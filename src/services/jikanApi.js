import animePlaylistMap from '../data/animePlaylistMap.json';
import { getPlaylistEpisodes } from './youtube';

const BASE_URL = 'https://api.jikan.moe/v4';
const ANILIST_URL = 'https://graphql.anilist.co';
const SHIKIMORI_URL = 'https://shikimori.one/api';

// --- Jikan Formatting ---
const formatAnime = (jikanAnime) => {
  if (!jikanAnime) return null;
  return {
    id: jikanAnime.mal_id?.toString() || "",
    title: jikanAnime.title || "Unknown Title",
    title_english: jikanAnime.title_english || jikanAnime.title,
    poster: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url || "",
    banner: jikanAnime.trailer?.images?.maximum_image_url || jikanAnime.images?.jpg?.large_image_url || "",
    genres: jikanAnime.genres?.map(g => g.name) || [],
    rating: jikanAnime.score ? Number(jikanAnime.score) : 0,
    status: jikanAnime.status || "Unknown",
    year: jikanAnime.year || (jikanAnime.aired?.prop?.from?.year) || 'TBA',
    description: jikanAnime.synopsis || "Deskripsi tidak tersedia.",
    episodesCount: jikanAnime.episodes || 0,
    trailer: jikanAnime.trailer?.youtube_id 
  };
};

// --- AniList API Helper & Formatting ---
const fetchAniList = async (query, variables = {}) => {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    throw new Error(`AniList HTTP error! Status: ${response.status}`);
  }
  
  const json = await response.json();
  if (json.errors) {
    throw new Error(`AniList GraphQL error: ${json.errors[0].message}`);
  }
  return json.data;
};

const formatAniListAnime = (alMedia) => {
  if (!alMedia) return null;
  const malId = alMedia.idMal ? alMedia.idMal.toString() : `al-${alMedia.id}`;
  return {
    id: malId,
    title: alMedia.title.userPreferred || alMedia.title.romaji || alMedia.title.english || "Unknown Title",
    title_english: alMedia.title.english || alMedia.title.romaji || alMedia.title.userPreferred || "",
    poster: alMedia.coverImage?.extraLarge || alMedia.coverImage?.large || alMedia.coverImage?.medium || "",
    banner: alMedia.bannerImage || alMedia.coverImage?.extraLarge || "",
    genres: alMedia.genres || [],
    rating: alMedia.averageScore ? Number((alMedia.averageScore / 10).toFixed(1)) : 0,
    status: alMedia.status === 'RELEASING' ? 'Currently Airing' : (alMedia.status === 'FINISHED' ? 'Finished Airing' : alMedia.status || "Unknown"),
    year: alMedia.seasonYear || 'TBA',
    description: alMedia.description?.replace(/<[^>]*>/g, '') || "Deskripsi tidak tersedia.",
    episodesCount: alMedia.episodes || 0,
    trailer: alMedia.trailer && alMedia.trailer.site === 'youtube' ? alMedia.trailer.id : null
  };
};

const getAniListTopAnime = async (limit = 10) => {
  const query = `
    query ($perPage: Int) {
      Page (page: 1, perPage: $perPage) {
        media (sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME) {
          idMal
          id
          title {
            romaji
            english
            userPreferred
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          genres
          averageScore
          status
          seasonYear
          description
          episodes
          trailer {
            id
            site
          }
        }
      }
    }
  `;
  const data = await fetchAniList(query, { perPage: limit });
  return (data?.Page?.media || []).map(formatAniListAnime).filter(Boolean);
};

const getAniListSeasonNow = async (limit = 10) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  let season = 'WINTER';
  if (month >= 2 && month <= 4) season = 'SPRING';
  else if (month >= 5 && month <= 7) season = 'SUMMER';
  else if (month >= 8 && month <= 10) season = 'FALL';

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page (page: 1, perPage: $perPage) {
        media (season: $season, seasonYear: $seasonYear, status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          idMal
          id
          title {
            romaji
            english
            userPreferred
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          genres
          averageScore
          status
          seasonYear
          description
          episodes
          trailer {
            id
            site
          }
        }
      }
    }
  `;
  const data = await fetchAniList(query, { season, seasonYear: year, perPage: limit });
  return (data?.Page?.media || []).map(formatAniListAnime).filter(Boolean);
};

const searchAniListAnime = async (searchQuery, limit = 20) => {
  const query = `
    query ($search: String, $perPage: Int) {
      Page (page: 1, perPage: $perPage) {
        media (search: $search, type: ANIME, sort: POPULARITY_DESC) {
          idMal
          id
          title {
            romaji
            english
            userPreferred
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          genres
          averageScore
          status
          seasonYear
          description
          episodes
          trailer {
            id
            site
          }
        }
      }
    }
  `;
  const data = await fetchAniList(query, { search: searchQuery, perPage: limit });
  return (data?.Page?.media || []).map(formatAniListAnime).filter(Boolean);
};

const getAniListAnimeById = async (id) => {
  const malId = parseInt(id, 10);
  if (isNaN(malId)) {
    throw new Error("Invalid MAL ID for AniList search");
  }
  const query = `
    query ($idMal: Int) {
      Media (idMal: $idMal, type: ANIME) {
        idMal
        id
        title {
          romaji
          english
          userPreferred
        }
        coverImage {
          extraLarge
          large
          medium
        }
        bannerImage
        genres
        averageScore
        status
        seasonYear
        description
        episodes
        trailer {
          id
          site
        }
      }
    }
  `;
  const data = await fetchAniList(query, { idMal: malId });
  return formatAniListAnime(data?.Media);
};

// --- Shikimori API Helper & Formatting ---
const formatShikimoriAnime = (shikiAnime) => {
  if (!shikiAnime) return null;
  const imageBase = 'https://shikimori.one';
  const posterPath = shikiAnime.image?.original || shikiAnime.image?.preview || "";
  const poster = posterPath ? (posterPath.startsWith('http') ? posterPath : `${imageBase}${posterPath}`) : "";
  return {
    id: shikiAnime.id?.toString() || "",
    title: shikiAnime.name || "Unknown Title",
    title_english: shikiAnime.name || "",
    poster: poster,
    banner: poster,
    genres: shikiAnime.genres?.map(g => g.name) || [],
    rating: shikiAnime.score ? Number(shikiAnime.score) : 0,
    status: shikiAnime.status === 'ongoing' ? 'Currently Airing' : (shikiAnime.status === 'released' ? 'Finished Airing' : shikiAnime.status || "Unknown"),
    year: shikiAnime.aired_on ? new Date(shikiAnime.aired_on).getFullYear() : 'TBA',
    description: shikiAnime.description || "Deskripsi tidak tersedia.",
    episodesCount: shikiAnime.episodes || 0,
    trailer: null
  };
};

const getShikimoriTopAnime = async (limit = 10) => {
  const response = await fetch(`${SHIKIMORI_URL}/animes?limit=${limit}&order=popularity`);
  if (!response.ok) throw new Error("Shikimori API error");
  const data = await response.json();
  return (data || []).map(formatShikimoriAnime).filter(Boolean);
};

const getShikimoriSeasonNow = async (limit = 10) => {
  const response = await fetch(`${SHIKIMORI_URL}/animes?limit=${limit}&status=ongoing&order=popularity`);
  if (!response.ok) throw new Error("Shikimori API error");
  const data = await response.json();
  return (data || []).map(formatShikimoriAnime).filter(Boolean);
};

const searchShikimoriAnime = async (query, limit = 20) => {
  const response = await fetch(`${SHIKIMORI_URL}/animes?search=${encodeURIComponent(query)}&limit=${limit}`);
  if (!response.ok) throw new Error("Shikimori API error");
  const data = await response.json();
  return (data || []).map(formatShikimoriAnime).filter(Boolean);
};

const getShikimoriAnimeById = async (id) => {
  const response = await fetch(`${SHIKIMORI_URL}/animes/${id}`);
  if (!response.ok) throw new Error("Shikimori API error");
  const data = await response.json();
  return formatShikimoriAnime(data);
};

// --- Static Backup Data ---
const getDummyAnimeList = () => [
  {
    id: "52991",
    title: "Sousou no Frieren",
    title_english: "Frieren: Beyond Journey's End",
    poster: "https://cdn.myanimelist.net/images/anime/1015/138025.jpg",
    banner: "https://cdn.myanimelist.net/images/anime/1015/138025.jpg",
    genres: ["Adventure", "Drama", "Fantasy"],
    rating: 9.38,
    status: "Finished Airing",
    year: 2023,
    description: "During their 10-year quest to defeat the Demon King, the members of the hero's party—the hero Himel, the warrior Eisen, the priest Heiter, and the mage Frieren—forge bonds through battle and adventure.",
    episodesCount: 28,
    trailer: "qgQIF6M15QA"
  },
  {
    id: "54705",
    title: "Wind Breaker",
    title_english: "Wind Breaker",
    poster: "https://cdn.myanimelist.net/images/anime/1806/141823.jpg",
    banner: "https://cdn.myanimelist.net/images/anime/1806/141823.jpg",
    genres: ["Action", "School"],
    rating: 8.12,
    status: "Finished Airing",
    year: 2024,
    description: "Haruka Sakura wants nothing to do with weaklings—he's only interested in the strongest of the strong. He's just started at Furin High School, a school of degenerates known only for their brawling strength.",
    episodesCount: 12,
    trailer: "DJgmlzx6DNY"
  },
  {
    id: "21",
    title: "One Piece",
    title_english: "One Piece",
    poster: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg",
    banner: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg",
    genres: ["Action", "Adventure", "Fantasy"],
    rating: 8.72,
    status: "Currently Airing",
    year: 1999,
    description: "Gol D. Roger was known as the 'Pirate King,' the strongest and most mysterious being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.",
    episodesCount: 1100,
    trailer: "PLPanbgyToztYv2b8xOVqPBfQQAnwjbB0k"
  }
];

const getDummyOngoingList = () => [
  {
    id: "21",
    title: "One Piece",
    title_english: "One Piece",
    poster: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg",
    banner: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg",
    genres: ["Action", "Adventure", "Fantasy"],
    rating: 8.72,
    status: "Currently Airing",
    year: 1999,
    description: "Gol D. Roger was known as the 'Pirate King,' the strongest and most mysterious being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.",
    episodesCount: 1100,
    trailer: "PLPanbgyToztYv2b8xOVqPBfQQAnwjbB0k"
  },
  {
    id: "54705",
    title: "Wind Breaker",
    title_english: "Wind Breaker",
    poster: "https://cdn.myanimelist.net/images/anime/1806/141823.jpg",
    banner: "https://cdn.myanimelist.net/images/anime/1806/141823.jpg",
    genres: ["Action", "School"],
    rating: 8.12,
    status: "Finished Airing",
    year: 2024,
    description: "Haruka Sakura wants nothing to do with weaklings—he's only interested in the strongest of the strong. He's just started at Furin High School, a school of degenerates known only for their brawling strength.",
    episodesCount: 12,
    trailer: "DJgmlzx6DNY"
  }
];


// --- Exported Core API Functions ---

// Global memory cache for mapped catalog
let mappedCatalogCache = null;

export const getMappedAnimeCatalog = async () => {
  if (mappedCatalogCache) return mappedCatalogCache;
  
  try {
    const cached = localStorage.getItem('anistream_catalog_v4');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() < parsed.expiresAt) {
        mappedCatalogCache = parsed.data;
        return mappedCatalogCache;
      }
    }
  } catch (e) {}

  const malIds = animePlaylistMap.map(m => m.mal_id).filter(id => !isNaN(id) && id < 900000); 
  
  const query = `
    query ($idMal_in: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $idMal_in, type: ANIME) {
          id
          idMal
          title { romaji english userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          genres
          averageScore
          status
          seasonYear
          description
          episodes
          trailer { id site }
        }
      }
    }
  `;

  try {
    // Bagi daftar ID menjadi kelompok berisi maksimal 50 item
    const idChunks = [];
    for (let i = 0; i < malIds.length; i += 50) {
      idChunks.push(malIds.slice(i, i + 50));
    }

    // Ambil data dari AniList secara paralel untuk mempercepat loading
    const fetchPromises = idChunks.map(chunk => fetchAniList(query, { idMal_in: chunk }));
    const results = await Promise.all(fetchPromises);
    
    let catalog = [];
    for (const data of results) {
      if (data && data.Page && data.Page.media) {
        const mapped = data.Page.media.map(formatAniListAnime).filter(Boolean);
        catalog = [...catalog, ...mapped];
      }
    }
    
    // Add custom donghua/manual items
    const customIds = animePlaylistMap.filter(m => m.mal_id >= 900000);
    for (const c of customIds) {
      catalog.push({
        id: c.mal_id.toString(),
        title: c.note,
        title_english: c.note,
        poster: `https://placehold.co/225x318/1a1c29/eaeaf0?text=${encodeURIComponent(c.note)}`,
        banner: `https://placehold.co/1200x400/1a1c29/eaeaf0?text=${encodeURIComponent(c.note)}`,
        genres: ["Animation", "Fantasy"],
        rating: 8.0,
        status: "Currently Airing",
        year: "TBA",
        description: "Official Playlist for " + c.note,
        episodesCount: 24,
        trailer: null
      });
    }

    mappedCatalogCache = catalog;
    try {
      localStorage.setItem('anistream_catalog_v4', JSON.stringify({
        data: catalog,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 // Cache for 24 hours
      }));
    } catch (e) {}

    return catalog;
  } catch (error) {
    console.error("Failed to fetch catalog from AniList:", error);
    return [];
  }
};

export const getTopAnime = async (limit = 10) => {
  const catalog = await getMappedAnimeCatalog();
  // Karena AniList sudah memberikan data rating, kita cukup menyortirnya secara lokal
  // Ini mempercepat loading menjadi 0 ms dan kebal dari server down!
  return [...catalog].sort((a, b) => b.rating - a.rating).slice(0, limit);
};

export const searchAnime = async (query, limit = 20) => {
  const catalog = await getMappedAnimeCatalog();
  if (!query || query.trim() === '') return getTopAnime(limit);
  
  const q = query.toLowerCase();
  const results = catalog.filter(a => 
    (a.title && a.title.toLowerCase().includes(q)) || 
    (a.title_english && a.title_english.toLowerCase().includes(q))
  );
  return results.slice(0, limit);
};

export const getAnimeById = async (id) => {
  const numericId = parseInt(id, 10);
  
  // Jika ini adalah ID Kustom (>= 900000), bypass panggilan API eksternal sepenuhnya
  // Ambil langsung dari Katalog Lokal terhidrasi kita
  if (!isNaN(numericId) && numericId >= 900000) {
    const catalog = await getMappedAnimeCatalog();
    const match = catalog.find(a => a.id === id.toString());
    if (match) return match;
  }

  // 1. Try Jikan API
  try {
    const response = await fetch(`${BASE_URL}/anime/${id}/full`);
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        return formatAnime(data.data);
      }
    }
  } catch (error) {
    console.error("Jikan getAnimeById failed, falling back to AniList:", error);
  }

  // 2. Try AniList API
  try {
    const data = await getAniListAnimeById(id);
    if (data) return data;
  } catch (error) {
    console.error("AniList getAnimeById failed, falling back to Shikimori:", error);
  }

  // 3. Try Shikimori API
  try {
    const data = await getShikimoriAnimeById(id);
    if (data) return data;
  } catch (error) {
    console.error("Shikimori getAnimeById failed:", error);
  }

  // 4. Match dummy
  const dummy = [...getDummyAnimeList(), ...getDummyOngoingList()].find(a => a.id === id.toString());
  if (dummy) return dummy;

  // 5. Ultimate failsafe (Never throw an error to prevent React crashes on rate limits)
  return {
    id: id.toString(),
    title: "Detail Belum Tersedia (Server Sibuk)",
    title_english: "",
    poster: "https://placehold.co/225x318/1a1c29/eaeaf0?text=API+Sibuk",
    banner: "https://placehold.co/1200x400/1a1c29/eaeaf0?text=API+Sibuk",
    genres: ["Unknown"],
    rating: 0,
    status: "Unknown",
    year: "TBA",
    description: "Sistem tidak dapat memuat detail anime ini karena server API sedang sibuk (terlalu banyak permintaan). Silakan tunggu beberapa saat dan refresh halaman ini.",
    episodesCount: 12,
    trailer: null
  };
};

export const getAnimeEpisodes = async (id) => {
  if (isNaN(id)) return [];
  
  // 1. Try Jikan API
  try {
    const response = await fetch(`${BASE_URL}/anime/${id}/episodes`);
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data.map(ep => ({
          id: ep.mal_id.toString(),
          episodeNumber: ep.mal_id,
          title: ep.title || `Episode ${ep.mal_id}`,
          duration: "24m", 
          videoUrl: "" 
        }));
      }
    }
  } catch (error) {
    console.error("Jikan getAnimeEpisodes failed, trying generated fallbacks:", error);
  }

  // 2. Fallback: Generate sequential episodes based on the anime metadata's episodes count
  try {
    const anime = await getAnimeById(id);
    if (anime && anime.episodesCount && anime.episodesCount > 0) {
      const eps = [];
      for (let i = 1; i <= anime.episodesCount; i++) {
        eps.push({
          id: i.toString(),
          episodeNumber: i,
          title: `Episode ${i}`,
          duration: "24m",
          videoUrl: ""
        });
      }
      return eps;
    }
  } catch (err) {
    console.error("Error generating fallback episodes count:", err);
  }

  // Final fallback: return standard 12 episodes if all else fails
  const fallbackEps = [];
  for (let i = 1; i <= 12; i++) {
    fallbackEps.push({
      id: i.toString(),
      episodeNumber: i,
      title: `Episode ${i}`,
      duration: "24m",
      videoUrl: ""
    });
  }
  return fallbackEps;
};

export const getSeasonNow = async (limit = 10) => {
  const catalog = await getMappedAnimeCatalog();
  
  // Filter katalog offline kita khusus untuk anime yang sedang tayang (Menurut data AniList)
  const ongoing = catalog.filter(a => a.status === 'Currently Airing' || a.status === 'Releasing');
  
  if (ongoing.length > 0) {
    // Urutkan berdasarkan yang paling populer/rating tertinggi
    return ongoing.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  // Fallback terakhir jika kebetulan tidak ada anime ongoing di daftar JSON Anda
  return [...catalog].sort((a, b) => b.rating - a.rating).slice(0, limit);
};

export const getRecentlyUpdatedAnime = async (limit = 10) => {
  const catalog = await getMappedAnimeCatalog();
  const ongoing = catalog.filter(a => a.status === 'Currently Airing' || a.status === 'Releasing');
  
  const updatedList = [];
  
  for (const anime of ongoing) {
    const mapping = animePlaylistMap.find(m => m.mal_id.toString() === anime.id);
    if (!mapping) continue;
    
    try {
      const episodes = await getPlaylistEpisodes(mapping.muse_playlist_id);
      if (episodes && episodes.length > 0) {
        let latestEp = episodes[episodes.length - 1];
        
        // Find the most recent publishedAt
        for(let ep of episodes) {
            if(ep.publishedAt && latestEp.publishedAt) {
                if(new Date(ep.publishedAt) > new Date(latestEp.publishedAt)) {
                    latestEp = ep;
                }
            }
        }
        
        updatedList.push({
          ...anime,
          latestEpisodeTitle: latestEp.title,
          latestEpisodeThumbnail: latestEp.thumbnail,
          publishedAtTimestamp: latestEp.publishedAt ? new Date(latestEp.publishedAt).getTime() : 0
        });
      }
    } catch (err) {
      console.warn(`[Updater] Failed to get episodes for ${anime.title}`, err);
    }
  }
  
  // Sort by most recently updated
  updatedList.sort((a, b) => b.publishedAtTimestamp - a.publishedAtTimestamp);
  
  return updatedList.slice(0, limit);
};

