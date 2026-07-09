const https = require('https');

const query = process.argv.slice(2).join(' ');
if (!query) {
  console.log('\x1b[33m%s\x1b[0m', 'Silakan masukkan judul anime. Contoh: node search-mal-id.js "Wind Breaker"');
  process.exit(1);
}

console.log(`Mencari ID untuk: "${query}"...\n`);

const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`;

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.data || parsed.data.length === 0) {
        console.log('\x1b[31m%s\x1b[0m', 'Tidak ditemukan anime dengan judul tersebut.');
        return;
      }
      
      console.log('\x1b[36m%s\x1b[0m', 'Berikut adalah hasil pencarian yang ditemukan:');
      console.log('------------------------------------------------');
      parsed.data.forEach((anime, idx) => {
        console.log(`\x1b[1m%s\x1b[0m`, `${idx + 1}. Judul: ${anime.title}`);
        console.log(`   ID (mal_id): \x1b[32m${anime.mal_id}\x1b[0m`);
        console.log(`   Tipe: ${anime.type || 'N/A'} | Rilis: ${anime.year || 'TBA'} | Skor: ${anime.score || 'N/A'}`);
        console.log(`   Format Copy-Paste JSON:`);
        console.log(`\x1b[34m   {`);
        console.log(`     "mal_id": ${anime.mal_id},`);
        console.log(`     "muse_playlist_id": "MASUKKAN_PLAYLIST_ID_DI_SINI",`);
        console.log(`     "note": "${anime.title}"`);
        console.log(`   }\x1b[0m`);
        console.log('------------------------------------------------');
      });
    } catch (err) {
      console.error('Gagal memproses respons:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Terjadi kesalahan koneksi:', err.message);
});
