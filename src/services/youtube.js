import animePlaylistMap from '../data/animePlaylistMap.json';

const CACHE_PREFIX = 'yt_playlist_v3_';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Caches data to localStorage with expiration
 */
const setCache = (key, data) => {
  try {
    const cacheItem = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (err) {
    console.warn("Failed to save to localStorage cache", err);
  }
};

/**
 * Gets data from localStorage if it exists and hasn't expired
 */
const getCache = (key) => {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch (err) {
    return null;
  }
};

/**
 * Recursively fetches all items in a YouTube playlist
 */
export const getPlaylistEpisodes = async (playlistId) => {
  // Check cache first
  const cachedData = getCache(playlistId);
  if (cachedData) {
    return cachedData;
  }

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_YOUTUBE_API_KEY is missing in .env");
  }

  let allItems = [];
  let nextPageToken = '';
  
  try {
    // Loop until we fetch all pages (nextPageToken is empty)
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `YouTube API Error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Process and map the items
      const processedItems = data.items.map((item) => {
        const videoId = item.contentDetails.videoId;
        const snippet = item.snippet;
        
        return {
          id: videoId, // Use YouTube videoId as the unique ID
          title: snippet.title,
          duration: '24 min', 
          thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
          videoType: 'youtube',
          videoUrl: `https://www.youtube.com/embed/${videoId}`,
          publishedAt: snippet.publishedAt,
          channelId: snippet.channelId,
          videoOwnerChannelId: snippet.videoOwnerChannelId,
          channelTitle: snippet.channelTitle || ""
        };
      });
      
      // Filter out deleted videos AND enforce that the uploader is the playlist owner
      const validItems = processedItems.filter(item => {
        const isNotDeleted = !item.title.toLowerCase().includes('private video') && !item.title.toLowerCase().includes('deleted video');
        const isOwnerMatch = !item.videoOwnerChannelId || item.videoOwnerChannelId === item.channelId;
        
        return isNotDeleted && isOwnerMatch;
      });
      
      allItems = [...allItems, ...validItems];
      nextPageToken = data.nextPageToken;
      
    } while (nextPageToken);

    // Parse episode number from title helper
    const parseEpisodeNumber = (title) => {
      if (!title) return null;
      const clean = title.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '');
      
      const match = clean.match(/\b(?:episode|episod|eps|ep|ep\.|ep-)\s*(\d+)\b/i);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
      
      const matchHyphen = clean.match(/-\s*(\d+)\b/);
      if (matchHyphen && matchHyphen[1]) {
        return parseInt(matchHyphen[1], 10);
      }
      
      const matchStandalone = clean.match(/\b(\d+)\b/);
      if (matchStandalone && matchStandalone[1]) {
        return parseInt(matchStandalone[1], 10);
      }
      
      return null;
    };

    // Auto-detect descending playlist order and reverse if needed
    const parsedNums = allItems.map(item => parseEpisodeNumber(item.title)).filter(num => num !== null);
    if (parsedNums.length >= 2) {
      const firstFew = parsedNums.slice(0, Math.min(3, parsedNums.length));
      const lastFew = parsedNums.slice(-Math.min(3, parsedNums.length));
      const avgFirst = firstFew.reduce((a, b) => a + b, 0) / firstFew.length;
      const avgLast = lastFew.reduce((a, b) => a + b, 0) / lastFew.length;
      
      if (avgFirst > avgLast) {
        allItems.reverse(); // Reverse to keep chronological ascending order
      }
    }

    // Assign sequential, gapless episode numbers after filtering/reversing
    allItems = allItems.map((item, idx) => ({
      ...item,
      episodeNumber: idx + 1
    }));

    // Save full list to cache
    setCache(playlistId, allItems);
    
    return allItems;
  } catch (err) {
    console.error(`Failed to fetch playlist ${playlistId}:`, err);
    throw err;
  }
};

/**
 * Searches for playlists on YouTube matching the query
 */
export const searchYouTubePlaylists = async (query) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_YOUTUBE_API_KEY is missing in .env");
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${encodeURIComponent(query)}&maxResults=8&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || `YouTube API Error: ${res.status}`);
    }
    const data = await res.json();
    return (data.items || []).map(item => ({
      playlistId: item.id.playlistId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    })).filter(item => item.playlistId); // Ensure valid playlistId
  } catch (err) {
    console.error("YouTube search error:", err);
    throw err;
  }
};

export const getPlaylistIdForAnime = (animeId) => {
  try {
    const customMappings = JSON.parse(localStorage.getItem('anistream_custom_mappings') || '{}');
    if (customMappings[animeId.toString()]) {
      return customMappings[animeId.toString()];
    }
  } catch (err) {
    console.error("Error reading custom mappings from localStorage", err);
  }
  
  // Fallback to static mapping
  const mapping = animePlaylistMap.find(m => m.mal_id.toString() === animeId.toString());
  return mapping ? mapping.muse_playlist_id : null;
};

/**
 * Saves a custom playlist mapping to localStorage
 */
export const saveCustomPlaylistMapping = (animeId, playlistId) => {
  try {
    const customMappings = JSON.parse(localStorage.getItem('anistream_custom_mappings') || '{}');
    customMappings[animeId.toString()] = playlistId;
    localStorage.setItem('anistream_custom_mappings', JSON.stringify(customMappings));
  } catch (err) {
    console.error("Error saving custom mapping to localStorage", err);
  }
};

/**
 * Removes a custom playlist mapping from localStorage
 */
export const removeCustomPlaylistMapping = (animeId) => {
  try {
    const customMappings = JSON.parse(localStorage.getItem('anistream_custom_mappings') || '{}');
    delete customMappings[animeId.toString()];
    localStorage.setItem('anistream_custom_mappings', JSON.stringify(customMappings));
  } catch (err) {
    console.error("Error removing custom mapping from localStorage", err);
  }
};

/**
 * Cleans up messy YouTube episode video titles (removes channel tags, sub tags, etc.)
 */
export const cleanYouTubeTitle = (title, animeTitle, episodeNumber) => {
  if (!title) return `Episode ${episodeNumber}`;
  let clean = title;
  
  // Remove common channel tags and suffixes
  clean = clean.replace(/\[?sub(title)?\s*indonesia\]?/gi, '');
  clean = clean.replace(/\[?sub\s*indo\]?/gi, '');
  clean = clean.replace(/\|?\s*muse\s*indonesia/gi, '');
  clean = clean.replace(/\|?\s*muse\s*asia/gi, '');
  clean = clean.replace(/\|?\s*ani-one\s*asia/gi, '');
  clean = clean.replace(/\|?\s*ani-one\s*indonesia/gi, '');
  clean = clean.replace(/\|?\s*bilibili/gi, '');
  
  // Remove the anime title prefix if it exists in the video title
  if (animeTitle) {
    const escapedAnimeTitle = animeTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`^\\s*${escapedAnimeTitle}\\s*[-–:]?\\s*`, 'i');
    clean = clean.replace(regex, '');
  }
  
  // Strip common "Episode XX" or "EP XX" prefix
  clean = clean.replace(/^\s*(episode|ep)\s*\d+\s*[-–:]?\s*/i, '');
  
  // Clean up any remaining double spaces, dangling pipes, or braces
  clean = clean.replace(/\s*\|\s*$/, '');
  clean = clean.replace(/^\s*\|\s*/, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean || `Episode ${episodeNumber}`;
};


