import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Film, Settings, Image, List, Check, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { dbService } from '../services/firebase';

const GENRE_LIST = [
  "Action", "Fantasy", "Sci-Fi", "Sports", "Gaming", 
  "Adventure", "Romance", "Comedy", "Psychological", 
  "Thriller", "Supernatural", "Drama"
];

const AdminDashboard = () => {
  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'animeForm' | 'episodeForm' | 'banners'
  const [loading, setLoading] = useState(false);
  const [animeCatalog, setAnimeCatalog] = useState([]);
  const [banners, setBanners] = useState([]);
  
  // Feedback alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Anime Form States (for Add & Edit)
  const [editingAnimeId, setEditingAnimeId] = useState(null);
  const [animeTitle, setAnimeTitle] = useState('');
  const [animeSynopsis, setAnimeSynopsis] = useState('');
  const [animePoster, setAnimePoster] = useState('');
  const [animeBanner, setAnimeBanner] = useState('');
  const [animeGenres, setAnimeGenres] = useState([]);
  const [animeStatus, setAnimeStatus] = useState('ongoing');
  const [animeYear, setAnimeYear] = useState('2026');
  const [animeRating, setAnimeRating] = useState('4.8');

  // 2. Episode Form States
  const [targetAnimeId, setTargetAnimeId] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeVideoUrl, setEpisodeVideoUrl] = useState('');
  const [episodeDuration, setEpisodeDuration] = useState('24:00');

  // 3. Banner Form States
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerAnimeId, setBannerAnimeId] = useState('');
  const [bannerActive, setBannerActive] = useState(true);

  // Sync data on load
  const syncData = async () => {
    try {
      const list = await dbService.getAnimeList();
      setAnimeCatalog(list);
      
      const bList = await dbService.getBanners();
      setBanners(bList);
    } catch (err) {
      console.error("Admin synchronization failed", err);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  // Switch to anime editing form
  const handleStartEditAnime = (anime) => {
    setEditingAnimeId(anime.id);
    setAnimeTitle(anime.title);
    setAnimeSynopsis(anime.synopsis);
    setAnimePoster(anime.poster);
    setAnimeBanner(anime.banner || '');
    setAnimeGenres(anime.genres || []);
    setAnimeStatus(anime.status);
    setAnimeYear(anime.year.toString());
    setAnimeRating(anime.rating.toString());
    
    setActiveSubTab('animeForm');
    clearAlerts();
  };

  const handleStartAddAnime = () => {
    setEditingAnimeId(null);
    setAnimeTitle('');
    setAnimeSynopsis('');
    setAnimePoster('');
    setAnimeBanner('');
    setAnimeGenres([]);
    setAnimeStatus('ongoing');
    setAnimeYear('2026');
    setAnimeRating('4.8');
    
    setActiveSubTab('animeForm');
    clearAlerts();
  };

  // Delete Anime Handler
  const handleDeleteAnime = async (id) => {
    if (window.confirm("Are you sure you want to delete this anime catalog item? This will also remove associated episodes.")) {
      try {
        await dbService.deleteAnime(id);
        setSuccess("Anime successfully removed.");
        syncData();
        setTimeout(clearAlerts, 3000);
      } catch (err) {
        setError(err.message || "Failed to delete anime.");
      }
    }
  };

  // Save / Edit Anime Submit
  const handleSaveAnime = async (e) => {
    e.preventDefault();
    if (!animeTitle || !animeSynopsis || !animePoster) {
      setError("Please fill in Title, Synopsis, and Poster URL.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const newId = editingAnimeId || animeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const animeData = {
      id: newId,
      title: animeTitle,
      synopsis: animeSynopsis,
      poster: animePoster,
      banner: animeBanner || animePoster,
      genres: animeGenres,
      status: animeStatus,
      year: parseInt(animeYear) || 2026,
      rating: parseFloat(animeRating) || 4.8
    };

    try {
      await dbService.saveAnime(animeData);
      setSuccess(editingAnimeId ? "Anime entry updated!" : "New anime added successfully!");
      syncData();
      
      // Reset Form and return to directory
      setTimeout(() => {
        handleStartAddAnime();
        setActiveSubTab('directory');
        clearAlerts();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to save anime.");
    } finally {
      setLoading(false);
    }
  };

  // Add Episode Submit
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    if (!targetAnimeId || !episodeTitle || !episodeVideoUrl) {
      setError("Please select Anime, enter Episode Title, and specify Stream Video URL.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const parsedEpNum = parseInt(episodeNumber) || 1;
    const cleanId = `ep-${targetAnimeId}-${parsedEpNum}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Parse duration seconds (approximate)
    const durParts = episodeDuration.split(':');
    const seconds = durParts.length === 2 
      ? (parseInt(durParts[0]) * 60) + parseInt(durParts[1]) 
      : 1440;

    const episodeData = {
      id: cleanId,
      episodeNumber: parsedEpNum,
      title: episodeTitle,
      videoUrl: episodeVideoUrl,
      videoType: 'mp4',
      duration: episodeDuration,
      durationSeconds: seconds,
      releaseDate: new Date().toISOString().split('T')[0]
    };

    try {
      await dbService.saveEpisode(targetAnimeId, episodeData);
      setSuccess(`Episode ${parsedEpNum} added successfully to catalog!`);
      syncData();
      
      // Reset inputs
      setEpisodeNumber((parsedEpNum + 1).toString());
      setEpisodeTitle('');
      setEpisodeVideoUrl('');
      setTimeout(clearAlerts, 3000);
    } catch (err) {
      setError(err.message || "Failed to append episode.");
    } finally {
      setLoading(false);
    }
  };

  // Add Banner Submit
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!bannerTitle || !bannerImageUrl || !bannerAnimeId) {
      setError("Please enter Banner Title, Image URL, and specify Target Anime ID.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const newBanner = {
      id: 'banner-' + Math.random().toString(36).substr(2, 9),
      title: bannerTitle,
      imageUrl: bannerImageUrl,
      animeId: bannerAnimeId,
      active: bannerActive,
      order: banners.length + 1
    };

    try {
      await dbService.saveBanner(newBanner);
      setSuccess("New hero banner registered successfully!");
      syncData();
      
      // Reset
      setBannerTitle('');
      setBannerImageUrl('');
      setBannerAnimeId('');
      setTimeout(clearAlerts, 3000);
    } catch (err) {
      setError(err.message || "Failed to register banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenreCheckboxChange = (genre) => {
    if (animeGenres.includes(genre)) {
      setAnimeGenres(animeGenres.filter(g => g !== genre));
    } else {
      setAnimeGenres([...animeGenres, genre]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-white">
          Admin Control Center
        </h1>
        <p className="text-xs text-[#8d93ad] mt-1">
          Manage anime records, update video streams, and configure banners
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#1d2136] gap-1">
        <button
          onClick={() => { setActiveSubTab('directory'); clearAlerts(); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <List size={14} />
          Anime Catalog
        </button>

        <button
          onClick={handleStartAddAnime}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'animeForm'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <Plus size={14} />
          {editingAnimeId ? 'Edit Anime' : 'Add Anime'}
        </button>

        <button
          onClick={() => { setActiveSubTab('episodeForm'); clearAlerts(); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'episodeForm'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <Film size={14} />
          Add Episode
        </button>

        <button
          onClick={() => { setActiveSubTab('banners'); clearAlerts(); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'banners'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <Image size={14} />
          Kelola Banner
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* ================= TAB 1: DIRECTORY ================= */}
      {activeSubTab === 'directory' && (
        <div className="bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1d2136] flex justify-between items-center">
            <h3 className="font-bold text-sm text-white">Registered Anime Catalog Items</h3>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleStartAddAnime}>
              Add New
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a0b11] border-b border-[#1d2136] text-[#8d93ad]">
                  <th className="p-4 font-bold">Poster</th>
                  <th className="p-4 font-bold">Title</th>
                  <th className="p-4 font-bold">Year</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Episodes</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2136]">
                {animeCatalog.map((anime) => (
                  <tr key={anime.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="w-9 h-12 rounded bg-[#0a0b11] overflow-hidden border border-white/5">
                        <img src={anime.poster} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white max-w-xs truncate">
                      {anime.title}
                    </td>
                    <td className="p-4 font-medium">{anime.year}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        anime.status === 'ongoing' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {anime.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{anime.episodesCount || 0} eps</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleStartEditAnime(anime)}
                          className="p-2 bg-white/5 hover:bg-[#8b5cf6]/20 border border-white/5 hover:border-[#8b5cf6]/30 text-white hover:text-[#a78bfa] rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnime(anime.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ANIME FORM ================= */}
      {activeSubTab === 'animeForm' && (
        <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <h3 className="font-bold text-sm text-white border-b border-[#1d2136] pb-3">
            {editingAnimeId ? `Modify Entry: ${animeTitle}` : 'Create New Anime Listing'}
          </h3>

          <form onSubmit={handleSaveAnime} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Anime Title</label>
                <input
                  type="text"
                  value={animeTitle}
                  onChange={(e) => setAnimeTitle(e.target.value)}
                  placeholder="e.g. Naruto Shippuden"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Release Year */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Release Year</label>
                <input
                  type="number"
                  value={animeYear}
                  onChange={(e) => setAnimeYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Synopsis</label>
              <textarea
                value={animeSynopsis}
                onChange={(e) => setAnimeSynopsis(e.target.value)}
                placeholder="Write summary description here..."
                rows="4"
                className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Poster URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Poster Image URL</label>
                <input
                  type="url"
                  value={animePoster}
                  onChange={(e) => setAnimePoster(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Banner URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Hero Banner Image URL (Landscape)</label>
                <input
                  type="url"
                  value={animeBanner}
                  onChange={(e) => setAnimeBanner(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Status</label>
                <select
                  value={animeStatus}
                  onChange={(e) => setAnimeStatus(e.target.value)}
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Rating Star (1.0 - 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={animeRating}
                  onChange={(e) => setAnimeRating(e.target.value)}
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase block">Select Genres</label>
              <div className="flex flex-wrap gap-2.5">
                {GENRE_LIST.map((g) => {
                  const active = animeGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleGenreCheckboxChange(g)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                        active
                          ? 'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/40'
                          : 'bg-[#0a0b11] text-[#8d93ad] border-[#1d2136] hover:border-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-4 flex gap-3 border-t border-[#1d2136]">
              <Button type="submit" variant="primary" loading={loading} className="text-xs font-bold">
                {editingAnimeId ? 'Modify Details' : 'Publish Anime'}
              </Button>
              <Button
                variant="outline"
                className="text-xs font-bold"
                onClick={() => { setActiveSubTab('directory'); clearAlerts(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: EPISODE FORM ================= */}
      {activeSubTab === 'episodeForm' && (
        <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <h3 className="font-bold text-sm text-white border-b border-[#1d2136] pb-3">
            Append Episode to Series
          </h3>

          <form onSubmit={handleAddEpisode} className="space-y-4">
            {/* Target Anime Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Target Anime Series</label>
              <select
                value={targetAnimeId}
                onChange={(e) => setTargetAnimeId(e.target.value)}
                className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
              >
                <option value="">Select Anime Series...</option>
                {animeCatalog.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Episode Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Episode Number</label>
                <input
                  type="number"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                  placeholder="1"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Episode Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Episode Title</label>
                <input
                  type="text"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="e.g. Departure"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Video URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Stream Video URL (MP4 / Legal Direct Link)</label>
                <input
                  type="url"
                  value={episodeVideoUrl}
                  onChange={(e) => setEpisodeVideoUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/.../movie.mp4"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Episode Duration (MM:SS)</label>
                <input
                  type="text"
                  value={episodeDuration}
                  onChange={(e) => setEpisodeDuration(e.target.value)}
                  placeholder="24:00"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" loading={loading} className="text-xs font-bold py-2.5">
              Publish Episode
            </Button>
          </form>
        </div>
      )}

      {/* ================= TAB 4: BANNER MANAGER ================= */}
      {activeSubTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Banner Creation Form */}
          <div className="lg:col-span-1 bg-[#121420] border border-[#1d2136] rounded-2xl p-6 space-y-4 shadow-xl h-fit">
            <h3 className="font-bold text-sm text-white border-b border-[#1d2136] pb-3">
              Add New Carousel Banner
            </h3>

            <form onSubmit={handleAddBanner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Banner Title</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Season Highlight"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Image URL (Wide Landscape)</label>
                <input
                  type="url"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="https://example.com/slide.jpg"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase">Target Anime Link ID</label>
                <select
                  value={bannerAnimeId}
                  onChange={(e) => setBannerAnimeId(e.target.value)}
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">Select Target Anime...</option>
                  {animeCatalog.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                  className="accent-[#8b5cf6] cursor-pointer"
                />
                <label htmlFor="banner-active" className="text-[10px] font-bold text-[#eaeaf0] cursor-pointer uppercase">
                  Active immediately
                </label>
              </div>

              <Button type="submit" variant="primary" loading={loading} className="w-full text-xs font-bold">
                Publish Banner Slide
              </Button>
            </form>
          </div>

          {/* Banner Listing Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-white">Active Banner Slides</h3>
            {banners.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {banners.map(b => (
                  <div key={b.id} className="bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden p-3.5 flex gap-4 items-center">
                    <div className="w-28 aspect-video rounded-xl bg-[#0a0b11] border border-white/5 overflow-hidden flex-shrink-0">
                      <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{b.title}</h4>
                      <p className="text-[10px] text-[#8d93ad] mt-0.5 truncate">Link: {b.animeId}</p>
                      <span className={`inline-block mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        b.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {b.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#121420] border border-[#1d2136] rounded-2xl text-xs text-[#8d93ad]">
                No banners registered yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
