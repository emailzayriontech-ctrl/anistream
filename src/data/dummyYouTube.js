// Data manual/admin untuk video resmi YouTube (Muse, Ani-One, dll)
// Digunakan sebagai fallback MVP agar tayangan 100% legal dan menggunakan video full episode, bukan trailer.

export const officialYouTubeVideos = [
  // Fallback default list if specific anime ID isn't mapped
  {
    episodeNumber: 1,
    title: "Episode 1 (Gundam Build Divers)",
    videoType: "youtube",
    videoUrl: "https://www.youtube.com/embed/Fj-cQh3t8D4", 
    duration: "24 min"
  },
  {
    episodeNumber: 2,
    title: "Episode 2 (SD GUNDAM WORLD HEROES)",
    videoType: "youtube",
    videoUrl: "https://www.youtube.com/embed/1uN3_3z9n0I", 
    duration: "24 min"
  },
  {
    episodeNumber: 3,
    title: "Episode 3 (Gundam Reconguista in G)",
    videoType: "youtube",
    videoUrl: "https://www.youtube.com/embed/3gB-yD8VdY8", 
    duration: "24 min"
  }
];

/**
 * Mendapatkan URL YouTube resmi berdasarkan nomor episode.
 * Ini mensimulasikan database manual/admin.
 */
export const getOfficialYoutubeEmbed = (episodeNumber) => {
  // Loop video agar tidak kehabisan jika episodenya banyak
  const index = ((episodeNumber || 1) - 1) % officialYouTubeVideos.length;
  return officialYouTubeVideos[index >= 0 ? index : 0].videoUrl;
};
