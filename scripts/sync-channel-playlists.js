import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Environment Variables (from .env.local or .env)
let apiKey = process.env.VITE_YOUTUBE_API_KEY || '';
try {
  const rootDir = path.resolve(__dirname, '..');
  const envPaths = [path.join(rootDir, '.env.local'), path.join(rootDir, '.env')];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/VITE_YOUTUBE_API_KEY\s*=\s*([^\s\r\n]+)/);
      if (match && match[1]) {
        apiKey = match[1].replace(/['"]/g, '').trim();
        break;
      }
    }
  }
} catch (e) {
  console.warn("Peringatan: Gagal membaca berkas .env:", e.message);
}

if (!apiKey) {
  console.log('\x1b[33m%s\x1b[0m', 'Warning: VITE_YOUTUBE_API_KEY tidak ditemukan. Melewati proses sinkronisasi playlist channel.');
  process.exit(0); // Exit gracefully to not block build
}

const channelsPath = path.join(__dirname, '..', 'src', 'data', 'channels.json');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'animePlaylistMap.json');
const failedPath = path.join(__dirname, '..', 'failed-playlists.json');

// Check if channels.json exists
if (!fs.existsSync(channelsPath)) {
  console.error("Gagal: berkas channels.json tidak ditemukan di src/data/.");
  process.exit(1);
}

const channels = JSON.parse(fs.readFileSync(channelsPath, 'utf8'));

// Helper to make HTTPS requests returning Promise
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Referer': 'http://localhost:5175/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// AniList GraphQL Search
const searchAniList = async (searchQuery) => {
  const url = 'https://graphql.anilist.co';
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        idMal
        title {
          romaji
          english
          userPreferred
        }
      }
    }
  `;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': 'http://localhost:5175/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) {
            reject(new Error(parsed.errors[0].message));
          } else {
            resolve(parsed.data?.Media || null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify({ query, variables: { search: searchQuery } }));
    req.end();
  });
};

// Shikimori REST API Search
const searchShikimori = async (searchQuery) => {
  const url = `https://shikimori.one/api/animes?search=${encodeURIComponent(searchQuery)}&limit=1`;
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'http://localhost:5175/'
      }
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resolve({
              mal_id: parsed[0].id,
              title: parsed[0].name || parsed[0].russian
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Title cleaning helper
const cleanTitle = (title) => {
  let clean = title;
  
  // Remove content in brackets and parentheses
  clean = clean.replace(/\[.*?\]/g, '');
  clean = clean.replace(/\(.*?\)/g, '');
  
  // Remove common suffixes and channel tags
  clean = clean.replace(/sub(title)?\s*indonesia/gi, '');
  clean = clean.replace(/sub\s*indo/gi, '');
  clean = clean.replace(/takarir\s*indonesia/gi, '');
  clean = clean.replace(/takarir\s*indo/gi, '');
  clean = clean.replace(/takarir/gi, '');
  clean = clean.replace(/\|?\s*muse\s*indonesia/gi, '');
  clean = clean.replace(/\|?\s*muse\s*asia/gi, '');
  clean = clean.replace(/\|?\s*ani-one\s*asia/gi, '');
  clean = clean.replace(/\|?\s*ani-one\s*indonesia/gi, '');
  clean = clean.replace(/\|?\s*bilibili/gi, '');
  clean = clean.replace(/\s*\|\s*$/, '');
  clean = clean.replace(/^\s*\|\s*/, '');
  return clean.replace(/\s+/g, ' ').trim();
};

// Fetch all playlists from a YouTube Channel ID
const fetchChannelPlaylists = async (channelId) => {
  let playlists = [];
  let nextPageToken = '';
  
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const data = await fetchUrl(url);
      
      if (data.items) {
        playlists.push(...data.items.map(item => ({
          id: item.id,
          title: item.snippet.title
        })));
      } else if (data.error) {
        throw new Error(data.error.message);
      }
      
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
  } catch (err) {
    console.error(`Gagal mengambil playlist untuk channel ${channelId}:`, err.message);
  }
  
  return playlists;
};

const run = async () => {
  console.log("=== SINKRONISASI PLAYLIST DARI CHANNEL YOUTUBE ===");
  
  // 1. Read existing mappings
  let mappings = [];
  if (fs.existsSync(outputPath)) {
    try {
      mappings = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch (_) {}
  }
  
  const existingPlaylistIds = new Set(mappings.map(m => m.muse_playlist_id));
  
  // 2. Fetch all playlists from all configured channels
  let allChannelPlaylists = [];
  for (const channel of channels) {
    console.log(`Mengambil daftar playlist untuk channel: ${channel.name} (${channel.id})...`);
    const playlists = await fetchChannelPlaylists(channel.id);
    console.log(` -> Menemukan ${playlists.length} playlist.`);
    allChannelPlaylists.push(...playlists);
  }
  
  // 3. Filter only new playlists
  const newPlaylists = allChannelPlaylists.filter(p => !existingPlaylistIds.has(p.id));
  console.log(`Total playlist dari channel: ${allChannelPlaylists.length}`);
  console.log(`Total playlist baru yang belum dipetakan: ${newPlaylists.length}\n`);
  
  if (newPlaylists.length === 0) {
    console.log("Tidak ada playlist baru untuk disinkronkan.");
    process.exit(0);
  }
  
  let failedPlaylists = [];
  
  // 4. Resolve mappings for new playlists
  for (let i = 0; i < newPlaylists.length; i++) {
    const playlist = newPlaylists[i];
    const playlistId = playlist.id;
    const rawTitle = playlist.title;
    const searchQuery = cleanTitle(rawTitle);
    
    console.log(`[${i + 1}/${newPlaylists.length}] Memproses Playlist ID: ${playlistId}`);
    console.log(`   Judul YouTube: "${rawTitle}" -> Pencarian: "${searchQuery}"`);
    
    let matchedAnime = null;
    
    // Throttling delay
    await new Promise(r => setTimeout(r, 1000));
    
    // Step A: Search MAL ID - Attempt 1: Jikan API
    console.log("   -> Mencari via Jikan API...");
    const jikanUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=1`;
    try {
      const jikanData = await fetchUrl(jikanUrl);
      if (jikanData.data && jikanData.data.length > 0) {
        const animeMeta = jikanData.data[0];
        matchedAnime = {
          mal_id: animeMeta.mal_id,
          title: animeMeta.title,
          source: 'Jikan'
        };
      }
    } catch (jErr) {
      console.log(`      (Jikan API gagal: ${jErr.message})`);
    }
    
    // Delay
    await new Promise(r => setTimeout(r, 800));
    
    // Step B: Search MAL ID - Attempt 2: AniList API (Fallback)
    if (!matchedAnime) {
      console.log("   -> Mencari via AniList API (Fallback)...");
      try {
        const alData = await searchAniList(searchQuery);
        if (alData && alData.idMal) {
          matchedAnime = {
            mal_id: alData.idMal,
            title: alData.title.english || alData.title.romaji,
            source: 'AniList'
          };
        }
      } catch (alErr) {
        console.log(`      (AniList API gagal: ${alErr.message})`);
      }
    }
    
    // Delay
    await new Promise(r => setTimeout(r, 800));
    
    // Step C: Search MAL ID - Attempt 3: Shikimori API (Fallback)
    if (!matchedAnime) {
      console.log("   -> Mencari via Shikimori API (Fallback)...");
      try {
        const shData = await searchShikimori(searchQuery);
        if (shData && shData.mal_id) {
          matchedAnime = {
            mal_id: shData.mal_id,
            title: shData.title,
            source: 'Shikimori'
          };
        }
      } catch (shErr) {
        console.log(`      (Shikimori API gagal: ${shErr.message})`);
      }
    }
    
    // Process results
    if (matchedAnime) {
      console.log(`   \x1b[32mSuccess: Ditemukan anime "${matchedAnime.title}" (mal_id: ${matchedAnime.mal_id}) via ${matchedAnime.source}\x1b[0m`);
      
      // Remove duplicate mal_id mapping if any, before pushing new one
      mappings = mappings.filter(m => m.mal_id !== matchedAnime.mal_id);
      
      mappings.push({
        mal_id: matchedAnime.mal_id,
        muse_playlist_id: playlistId,
        note: matchedAnime.title
      });
    } else {
      console.log(`   \x1b[31mError: Tidak dapat menemukan kecocokan anime secara otomatis di semua API.\x1b[0m`);
      failedPlaylists.push({
        playlistId,
        playlistTitle: rawTitle,
        searchQuery,
        reason: "Tidak ditemukan di semua API"
      });
    }
    
    // Extra delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // 5. Write compiled mappings
  if (mappings.length > 0) {
    fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2), 'utf8');
    console.log(`\n\x1b[32m%s\x1b[0m`, `✓ Sukses! Berkas animePlaylistMap.json berhasil diperbarui dengan total ${mappings.length} pemetaan.`);
  }
  
  // 6. Write failed list
  if (failedPlaylists.length > 0) {
    let existingFailed = [];
    if (fs.existsSync(failedPath)) {
      try {
        existingFailed = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
      } catch (_) {}
    }
    
    // Merge without duplicates
    const existingFailedIds = new Set(existingFailed.map(f => f.playlistId));
    failedPlaylists.forEach(f => {
      if (!existingFailedIds.has(f.playlistId)) {
        existingFailed.push(f);
      }
    });
    
    fs.writeFileSync(failedPath, JSON.stringify(existingFailed, null, 2), 'utf8');
    console.log(`\n\x1b[33mTerdapat ${failedPlaylists.length} playlist baru yang gagal diproses secara otomatis.\x1b[0m`);
    console.log(`Silakan periksa berkas failed-playlists.json.`);
  }
};

run();
