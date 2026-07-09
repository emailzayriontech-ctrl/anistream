import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'src', 'data', 'animePlaylistMap.json');
let mappings = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

const failed = [
  { id: 56708, playlist: "PLPanbgyToztbsmc1HPxlCK3oQIafoNBgv", note: "Welcome to Demon School! Iruma-kun S4" },
  { id: 59203, playlist: "PLPanbgyToztZ5klRqFSqS9MRjeIkvnjr4", note: "Ratu sang Bos Terakhir Paling Gila yang Akan Menjadi Sumber Tragedi Ingin Berjuang Demi Seluruh Rakyatnya S2" },
  { id: 53439, playlist: "PLPanbgyToztbUPRsc112dqBWdCWUJgwLH", note: "Berserk nan Rakus: Hanya Aku yang Mampu Menembus Batas Bernama \"Level\"" },
  { id: 55365, playlist: "PLPanbgyToztZB4DEfobJuDfahboqvjREo", note: "Statusku Sebagai Asasin Jauh Lebih Kuat Dari Milik Pahlawan" },
  { id: 55709, playlist: "PLPanbgyToztZtSAc9G06namZBqs_tKzWn", note: "Tanpa Sadar Levelku Mentok Setelah Membasmi Slime Selama 300 Tahun - S2" },
  { id: 999901, playlist: "PLPanbgyToztaiNdzOxUHctNMp0dRjulTX", note: "Masalah Kecil Sang Putri Sihir (Donghua - ID Kustom)" }
];

// Add the known ones
for (const f of failed) {
  mappings = mappings.filter(m => m.mal_id !== f.id);
  mappings.push({ mal_id: f.id, muse_playlist_id: f.playlist, note: f.note });
}

// Helper to fetch the remaining 2 from Jikan using their English titles
const fetchJikan = (query) => {
  return new Promise((resolve) => {
    https.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.data && data.data.length > 0) {
             resolve(data.data[0].mal_id);
          } else {
             resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    });
  });
};

(async () => {
  console.log("Mencari ID untuk: Catatan Perjalanan Pengumpul Material di Dunia Lain...");
  const id4 = await fetchJikan("A Gatherer's Adventure in Isekai");
  if (id4) {
    mappings = mappings.filter(m => m.mal_id !== id4);
    mappings.push({ mal_id: id4, muse_playlist_id: "PLPanbgyToztY5d8qXvBR5s3s5L4QMy3jU", note: "Catatan Perjalanan Pengumpul Material di Dunia Lain" });
    console.log(` -> Ditemukan: ${id4}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  console.log("Mencari ID untuk: Gacha Tak Hingga...");
  const id5 = await fetchJikan("My Gift Lvl 9999 Unlimited Gacha");
  if (id5) {
    mappings = mappings.filter(m => m.mal_id !== id5);
    mappings.push({ mal_id: id5, muse_playlist_id: "PLPanbgyToztYQ1iFAr2ES0i33ZvWpyeuD", note: "Gacha Tak Hingga" });
    console.log(` -> Ditemukan: ${id5}`);
  }

  fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
  console.log(`\nSukses! Menyimpan total ${mappings.length} pemetaan ke animePlaylistMap.json`);
})();
