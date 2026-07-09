import fs from 'fs';
import https from 'https';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ask console questions
const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
};

// 1. Get YouTube API Key from .env or .env.local
let apiKey = '';
try {
  const envPaths = [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')];
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
  console.error("Gagal membaca berkas .env:", e.message);
}

if (!apiKey) {
  console.log('\x1b[31m%s\x1b[0m', 'Galat: VITE_YOUTUBE_API_KEY tidak ditemukan di berkas .env atau .env.local');
  process.exit(1);
}

const inputPath = path.join(__dirname, 'input-playlists.json');
const outputPath = path.join(__dirname, 'src', 'data', 'animePlaylistMap.json');

// 2. Preseed input-playlists.json if not exists
if (!fs.existsSync(inputPath)) {
  const defaultPlaylists = [
    "PLPanbgyToztbp3y7m1i1Qz9Z4eE2y26H4", // Frieren
    "PLPanbgyToztYeEbbQUautfzW7zz-5cgmS"  // Wind Breaker
  ];
  fs.writeFileSync(inputPath, JSON.stringify(defaultPlaylists, null, 2), 'utf8');
  console.log(`Berkas input-playlists.json berhasil dibuat. Silakan tambahkan Playlist ID lainnya di sana.`);
}

const playlistIds = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (!Array.isArray(playlistIds) || playlistIds.length === 0) {
  console.log('\x1b[33m%s\x1b[0m', 'Input playlist kosong. Silakan isi input-playlists.json dengan daftar Playlist ID.');
  process.exit(0);
}

console.log(`Memulai konversi ${playlistIds.length} Playlist ID ke format animePlaylistMap...\n`);

// Helper to make HTTPS requests returning Promise
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Referer': 'http://localhost:5175/'
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

// BACKUP API 1: AniList GraphQL Search
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
      'Referer': 'http://localhost:5175/'
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

// BACKUP API 2: Shikimori REST API Search
const searchShikimori = async (searchQuery) => {
  const url = `https://shikimori.one/api/animes?search=${encodeURIComponent(searchQuery)}&limit=1`;
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
  
  // Remove common suffixes
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

const run = async () => {
  let mappings = [];
  let failedPlaylists = [];
  if (fs.existsSync(outputPath)) {
    try {
      mappings = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch (_) {}
  }
  
  for (let i = 0; i < playlistIds.length; i++) {
    const playlistId = playlistIds[i];
    
    // Skip if already in mappings
    if (mappings.some(m => m.muse_playlist_id === playlistId)) {
      console.log(`[${i + 1}/${playlistIds.length}] Playlist ID: ${playlistId} sudah terdaftar di database. Melewati.`);
      continue;
    }
    
    console.log(`[${i + 1}/${playlistIds.length}] Memproses Playlist ID: ${playlistId}...`);
    
    try {
      // Step A: Fetch Playlist Title from YouTube API
      const ytUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
      const ytData = await fetchUrl(ytUrl);
      
      if (!ytData.items || ytData.items.length === 0) {
        console.log(`   \x1b[33mWarning: Playlist tidak ditemukan di YouTube.\x1b[0m`);
        continue;
      }
      
      const rawTitle = ytData.items[0].snippet.title;
      const searchQuery = cleanTitle(rawTitle);
      console.log(`   Judul YouTube: "${rawTitle}" -> Pencarian: "${searchQuery}"`);
      
      let matchedAnime = null;
      
      // Delay to respect rate limits
      await new Promise(r => setTimeout(r, 800));
      
      // Step B: Search MAL ID - Attempt 1: Jikan API
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
      await new Promise(r => setTimeout(r, 500));
      
      // Step C: Search MAL ID - Attempt 2: AniList API (Fallback)
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
      await new Promise(r => setTimeout(r, 500));
      
      // Step D: Search MAL ID - Attempt 3: Shikimori API (Fallback)
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
        console.log(`   -> Melewati playlist ini dan menyimpannya ke daftar gagal.`);
        failedPlaylists.push({
          playlistId,
          searchQuery,
          reason: "Tidak ditemukan di semua API"
        });
      }
    } catch (err) {
      console.error(`   \x1b[31mGagal memproses playlist ${playlistId}: ${err.message}\x1b[0m`);
      failedPlaylists.push({
        playlistId,
        searchQuery: "",
        reason: err.message
      });
    }
    
    // Extra delay between cycles
    await new Promise(r => setTimeout(r, 500));
  }
  
  // 3. Write compiled mappings to animePlaylistMap.json
  if (mappings.length > 0) {
    fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2), 'utf8');
    console.log(`\n\x1b[32m%s\x1b[0m`, `✓ Sukses! Berkas animePlaylistMap.json berhasil diperbarui dengan total ${mappings.length} pemetaan.`);
  } else {
    console.log(`\n\x1b[31m%s\x1b[0m`, `Gagal memperbarui berkas. Tidak ada pemetaan yang berhasil diproses.`);
  }

  // 4. Report Failures
  if (failedPlaylists.length > 0) {
    const failedPath = path.join(__dirname, 'failed-playlists.json');
    fs.writeFileSync(failedPath, JSON.stringify(failedPlaylists, null, 2), 'utf8');
    console.log(`\n\x1b[33mTerdapat ${failedPlaylists.length} playlist yang gagal diproses secara otomatis.\x1b[0m`);
    console.log(`Silakan periksa berkas \x1b[36mfailed-playlists.json\x1b[0m untuk melihat daftar playlist yang perlu diisi manual.`);
  }
};

run();
