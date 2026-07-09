import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Play, Plus, Check, Clock, Calendar, Film, Search, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import { dbService } from '../services/firebase';
import { getAnimeById, getAnimeEpisodes } from '../services/jikanApi';
import { 
  getPlaylistEpisodes, 
  getPlaylistIdForAnime, 
  saveCustomPlaylistMapping, 
  removeCustomPlaylistMapping, 
  searchYouTubePlaylists,
  cleanYouTubeTitle
} from '../services/youtube';

const AnimeDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [anime, setAnime] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // YouTube search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [manualPlaylistId, setManualPlaylistId] = useState('');
  const [isCustomMapped, setIsCustomMapped] = useState(false);

  const mergeCleanTitles = (ytEpisodes, jikanEpisodes, animeTitle) => {
    return ytEpisodes.map(ep => {
      const jikanEp = jikanEpisodes.find(je => je.episodeNumber === ep.episodeNumber);
      return {
        ...ep,
        title: jikanEp && jikanEp.title ? jikanEp.title : cleanYouTubeTitle(ep.title, animeTitle, ep.episodeNumber)
      };
    });
  };

  useEffect(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('anistream_custom_mappings') || '{}');
      setIsCustomMapped(!!custom[id]);
    } catch (_) {}

    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch from Jikan API for Anime Meta
        const item = await getAnimeById(id);
        
        // Fetch clean episode titles from Jikan in parallel
        let jikanEpisodes = [];
        try {
          jikanEpisodes = await getAnimeEpisodes(id);
        } catch (jeErr) {
          console.warn("Failed to fetch clean Jikan episodes:", jeErr);
        }
        
        // Cek mapping YouTube kustom / bawaan
        const playlistId = getPlaylistIdForAnime(id);
        
        let resolvedPlaylistId = playlistId;
        let episodesLoaded = false;
        
        if (resolvedPlaylistId) {
          try {
            const ytEpisodes = await getPlaylistEpisodes(resolvedPlaylistId);
            item.episodes = mergeCleanTitles(ytEpisodes, jikanEpisodes, item.title);
            item.hasOfficialEpisodes = true;
            item.playlistId = resolvedPlaylistId;
            episodesLoaded = true;
          } catch (ytErr) {
            console.error("YouTube API Error, attempting auto-recovery:", ytErr);
            resolvedPlaylistId = null;
          }
        }
        
        // Auto-search and auto-link if not mapped OR if the mapped playlist was broken
        if (!resolvedPlaylistId && !episodesLoaded) {
          try {
            setSearchLoading(true);
            setSearchError('');
            // Search YouTube for a playlist matching the anime title
            const results = await searchYouTubePlaylists(`${item.title} playlist`);
            setSearchResults(results);
            
            if (results && results.length > 0) {
              const autoPlaylistId = results[0].playlistId;
              
              // Load episodes from the first search result automatically
              const ytEpisodes = await getPlaylistEpisodes(autoPlaylistId);
              item.episodes = mergeCleanTitles(ytEpisodes, jikanEpisodes, item.title);
              item.hasOfficialEpisodes = true;
              item.playlistId = autoPlaylistId;
              episodesLoaded = true;
              
              // Persist mapping locally so it is instant next time
              saveCustomPlaylistMapping(id, autoPlaylistId);
              setIsCustomMapped(true);
            } else {
              item.episodes = [];
              item.hasOfficialEpisodes = false;
              setSearchError('Tidak ditemukan playlist YouTube yang cocok secara otomatis.');
            }
          } catch (err) {
            console.error("Auto-recovery playlist search failed:", err);
            item.episodes = [];
            item.hasOfficialEpisodes = false;
            item.ytError = err.message;
            setSearchError(err.message || 'Gagal mencari playlist secara otomatis.');
          } finally {
            setSearchLoading(false);
          }
        }

        item.episodesCount = item.episodes.length || item.episodesCount;
        setAnime(item);

        if (user) {
          const userWatchlist = await dbService.getWatchlist(user.uid);
          setWatchlist(userWatchlist);

          const userHistory = await dbService.getHistory(user.uid);
          setHistory(userHistory.filter(h => h.animeId === id));
        }
      } catch (err) {
        setError(err.message || "Failed to load anime details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id, user]);

  const handleSearchPlaylists = async (customQuery) => {
    const q = customQuery || searchQuery || (anime && anime.title);
    if (!q) return;
    
    setSearchLoading(true);
    setSearchError('');
    try {
      const results = await searchYouTubePlaylists(q);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('Tidak ditemukan playlist YouTube yang cocok.');
      }
    } catch (err) {
      setSearchError(err.message || 'Gagal mencari playlist.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnectPlaylist = async (selectedPlaylistId) => {
    if (!selectedPlaylistId || !selectedPlaylistId.trim()) return;
    try {
      setLoading(true);
      saveCustomPlaylistMapping(id, selectedPlaylistId);
      setIsCustomMapped(true);
      
      // Reload details
      const item = await getAnimeById(id);
      
      let jikanEpisodes = [];
      try {
        jikanEpisodes = await getAnimeEpisodes(id);
      } catch (_) {}
      
      const ytEpisodes = await getPlaylistEpisodes(selectedPlaylistId);
      item.episodes = mergeCleanTitles(ytEpisodes, jikanEpisodes, item.title);
      
      item.hasOfficialEpisodes = true;
      item.playlistId = selectedPlaylistId;
      item.episodesCount = item.episodes.length || item.episodesCount;
      setAnime(item);
      
      // Reset search states
      setSearchResults([]);
      setSearchQuery('');
      setManualPlaylistId('');
    } catch (err) {
      setError(err.message || 'Gagal menghubungkan playlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPlaylist = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kustomisasi playlist ini?")) return;
    try {
      setLoading(true);
      removeCustomPlaylistMapping(id);
      setIsCustomMapped(false);
      
      // Reload details
      const item = await getAnimeById(id);
      
      let jikanEpisodes = [];
      try {
        jikanEpisodes = await getAnimeEpisodes(id);
      } catch (_) {}
      
      const playlistId = getPlaylistIdForAnime(id);
      if (playlistId) {
        const ytEpisodes = await getPlaylistEpisodes(playlistId);
        item.episodes = mergeCleanTitles(ytEpisodes, jikanEpisodes, item.title);
        item.hasOfficialEpisodes = true;
        item.playlistId = playlistId;
      } else {
        item.episodes = [];
        item.hasOfficialEpisodes = false;
      }
      item.episodesCount = item.episodes.length || item.episodesCount;
      setAnime(item);
      
      if (!playlistId) {
        // Trigger auto search again
        handleSearchPlaylists(item.title);
      }
    } catch (err) {
      setError(err.message || 'Gagal mereset playlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) return;
    try {
      const { watchlist: updatedList } = await dbService.toggleWatchlist(user.uid, anime);
      setWatchlist(updatedList);
    } catch (err) {
      console.error("Error toggling watchlist", err);
    }
  };

  if (loading) {
    return <LoadingState.DetailSkeleton />;
  }

  if (error || !anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <p className="text-red-400 font-bold">{error || "Anime details not found."}</p>
        <Button variant="secondary" size="md" onClick={() => navigate('/home')}>
          Return Home
        </Button>
      </div>
    );
  }

  const isAddedToWatchlist = watchlist.some(w => w.id === anime.id);

  // Check watch history to get progress for each episode
  const getEpisodeProgress = (episodeId) => {
    const record = history.find(h => h.episodeId === episodeId);
    if (!record) return null;
    return Math.min(Math.round((record.progressSeconds / record.durationSeconds) * 100), 100);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. CINEMATIC DETAIL HERO */}
      <div className="relative rounded-3xl overflow-hidden bg-[#121420] border border-[#1d2136]">
        {/* Blurred Backdrop */}
        <div className="absolute inset-0 select-none">
          <img 
            src={anime.banner || anime.poster} 
            alt={anime.title} 
            className="w-full h-full object-cover blur-2xl opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121420] via-[#121420]/75 to-transparent" />
        </div>

        {/* Hero Meta Grid */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start p-6 md:p-10 gap-8">
          {/* Cover Poster */}
          <div className="w-48 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex-shrink-0 bg-[#0d0e15]">
            <img 
              src={anime.poster} 
              alt={anime.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text Metadata */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              <span className="bg-[#8b5cf6] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {anime.status}
              </span>
              <span className="bg-white/10 backdrop-blur-md text-[#eaeaf0] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/5">
                {anime.year}
              </span>
              <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Star size={11} fill="currentColor" />
                {anime.rating.toFixed(1)}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-xl sm:text-3xl text-white leading-tight">
              {anime.title}
            </h1>

            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
              {anime.genres.map(g => (
                <span 
                  key={g} 
                  className="px-2.5 py-1 bg-[#1d2136] text-[#a78bfa] border border-[#2d3250] text-[10px] font-bold rounded-lg"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 pt-3">
              {anime.episodes && anime.episodes.length > 0 ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={Play}
                  onClick={() => navigate(`/watch/${anime.id}/${anime.episodes[0].id}`)}
                  className="font-bold text-xs"
                >
                  Watch Episode 01
                </Button>
              ) : (
                <Button variant="primary" size="md" disabled className="text-xs">
                  No Episodes Available
                </Button>
              )}

              <Button
                variant={isAddedToWatchlist ? 'glass' : 'secondary'}
                size="md"
                icon={isAddedToWatchlist ? Check : Plus}
                onClick={handleToggleWatchlist}
                className="font-bold text-xs"
              >
                {isAddedToWatchlist ? 'My List' : 'My List'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BODY COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Synopsis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-white">
              Synopsis
            </h3>
            <p className="text-xs text-[#8d93ad] leading-relaxed">
              {anime.synopsis}
            </p>
          </div>

          {/* EPISODE LIST CARD */}
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-white flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Film size={18} className="text-[#a78bfa]" />
                Episodes List ({anime.episodes ? anime.episodes.length : 0})
              </span>
              {isCustomMapped ? (
                <button
                  onClick={handleResetPlaylist}
                  title="Kembalikan ke Playlist Bawaan"
                  className="p-1.5 hover:bg-red-500/15 border border-transparent hover:border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
                >
                  <RefreshCw size={12} />
                  Kembalikan ke Default
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Trigger playlist search mode
                    setAnime({ ...anime, hasOfficialEpisodes: false });
                    setTimeout(() => handleSearchPlaylists(anime.title), 50);
                  }}
                  title="Ganti dengan Playlist Kustom"
                  className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/10 text-[#8d93ad] hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
                >
                  <Settings size={12} />
                  Ganti Playlist
                </button>
              )}
            </h3>
            
            {anime.episodes && anime.episodes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {anime.episodes.map((ep) => {
                  const progress = getEpisodeProgress(ep.id);
                  const isCompleted = progress && progress >= 95;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => navigate(`/watch/${anime.id}/${ep.id}`)}
                      className="group flex flex-col sm:flex-row bg-[#0a0b11] border border-[#1d2136] rounded-xl p-3 gap-4 cursor-pointer hover:border-[#8b5cf6]/40 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Thumbnail Container */}
                      <div className="w-full sm:w-32 aspect-video rounded-lg bg-[#121420] border border-[#1d2136] relative overflow-hidden flex-shrink-0 group-hover:border-transparent transition-all">
                        {ep.thumbnail ? (
                          <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8d93ad]">
                            <Film size={16} />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={20} fill="currentColor" className="text-white" />
                        </div>
                      </div>

                      {/* Episode Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-center text-[10px] text-[#8d93ad] font-semibold">
                          <span>EPISODE {ep.episodeNumber}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {ep.duration || '24:00'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-[#eaeaf0] group-hover:text-[#a78bfa] transition-colors mt-1 line-clamp-2 leading-relaxed">
                          {ep.title}
                        </h4>
                        
                        <div className="mt-2">
                          {isCompleted ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 uppercase">
                              <Check size={10} strokeWidth={3} />
                              Watched
                            </span>
                          ) : progress ? (
                            <span className="bg-[#8b5cf6]/10 text-[#a78bfa] border border-[#8b5cf6]/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                              {progress}% Done
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Progress Line Bar */}
                      {progress && !isCompleted && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : anime.hasOfficialEpisodes && !anime.ytError ? (
              <div className="text-center py-6 text-xs text-[#8d93ad]">
                Playlist kosong.
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Error Banner */}
                {anime.ytError && (
                  anime.ytError.toLowerCase().includes('referer') ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 space-y-3.5">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                        <AlertCircle size={16} />
                        <span>API Key YouTube Terblokir (Referer Restriction)</span>
                      </div>
                      <p className="text-[10px] text-[#8d93ad] leading-relaxed">
                        API Key YouTube di berkas <code className="bg-black/40 px-1 py-0.5 rounded text-red-300">.env</code> memblokir permintaan dari alamat lokal Anda (<code className="bg-black/40 px-1 py-0.5 rounded text-white">{window.location.origin}</code>).
                      </p>
                      <div className="bg-black/20 rounded-lg p-3.5 space-y-2 text-[10px] text-[#8d93ad] leading-normal text-left">
                        <p className="font-bold text-white uppercase text-[9px]">Cara Mengatasi di Google Cloud Console:</p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] underline hover:text-[#8b5cf6]">Google Cloud Console</a>.</li>
                          <li>Pergi ke menu <strong>APIs & Services &gt; Credentials</strong>.</li>
                          <li>Edit API Key Anda, lalu pada bagian <strong>Website restrictions</strong>, tambahkan URL: <code className="bg-[#0a0b11] px-1 py-0.5 rounded text-white">{window.location.origin}/*</code> atau pilih <strong>None</strong> untuk menonaktifkan pembatasan selama tahap pengembangan.</li>
                          <li>Klik <strong>Save</strong> dan tunggu sekitar 1 menit, kemudian muat ulang halaman ini.</li>
                        </ol>
                      </div>
                      {isCustomMapped && (
                        <button
                          onClick={handleResetPlaylist}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-[10px] font-bold"
                        >
                          Batal Hubungkan & Cari Playlist Lain
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                        <AlertCircle size={16} />
                        <span>Gagal Memuat Playlist Video</span>
                      </div>
                      <p className="text-[10px] text-[#8d93ad] leading-relaxed text-left">
                        YouTube API melaporkan kesalahan: <span className="text-red-300 font-bold">{anime.ytError}</span>
                      </p>
                      <p className="text-[10px] text-[#8d93ad] leading-relaxed text-left">
                        Playlist bawaan ini mungkin telah dihapus, bersifat privat, atau Playlist ID tidak valid. Anda dapat memilih rekomendasi playlist lain di bawah ini atau menempelkan Playlist ID kustom yang masih aktif.
                      </p>
                      {isCustomMapped && (
                        <button
                          onClick={handleResetPlaylist}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-[10px] font-bold"
                        >
                          Batal Hubungkan & Kembalikan ke Default
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Header Information (only show if no ytError, to avoid clutter) */}
                {!anime.ytError && (
                  <div className="bg-[#0a0b11] border border-[#1d2136] rounded-xl p-5 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center mx-auto text-[#a78bfa]">
                      <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-white">Belum Ada Playlist Video Terhubung</h4>
                      <p className="text-[10px] text-[#8d93ad] max-w-md mx-auto leading-relaxed">
                        Anime ini belum terhubung ke playlist YouTube. Anda bisa mencari playlist secara otomatis atau memasukkan Playlist ID secara manual untuk memutar video.
                      </p>
                    </div>
                  </div>
                )}

                {/* Manual Input form */}
                <div className="bg-[#0a0b11]/50 border border-[#1d2136] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold text-[#8d93ad] uppercase block">Hubungkan Manual</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualPlaylistId}
                      onChange={(e) => setManualPlaylistId(e.target.value)}
                      placeholder="Masukkan YouTube Playlist ID (misal: PLPanbgy...)"
                      className="flex-1 bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#8b5cf6]/50"
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleConnectPlaylist(manualPlaylistId)}
                      disabled={!manualPlaylistId.trim()}
                      className="text-xs font-bold shrink-0"
                    >
                      Hubungkan
                    </Button>
                  </div>
                </div>

                {/* Auto Search Results */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8d93ad] uppercase">Rekomendasi Playlist YouTube</span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari playlist lain..."
                        className="bg-[#0a0b11] border border-[#1d2136] rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none w-40"
                      />
                      <button
                        onClick={() => handleSearchPlaylists()}
                        className="p-1.5 bg-[#1d2136] hover:bg-[#2d3250] text-[#a78bfa] border border-[#2d3250] rounded-lg transition-colors cursor-pointer"
                      >
                        <Search size={12} />
                      </button>
                    </div>
                  </div>

                  {searchLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-[#8b5cf6]" />
                    </div>
                  ) : searchError ? (
                    searchError.toLowerCase().includes('referer') ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3 text-left">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                          <AlertCircle size={15} />
                          <span>API Key YouTube Terblokir (Referer Restriction)</span>
                        </div>
                        <p className="text-[9.5px] text-[#8d93ad] leading-relaxed">
                          Gagal melakukan pencarian karena API Key membatasi permintaan dari origin lokal. Silakan tambahkan <code className="bg-black/30 px-1 rounded text-white">{window.location.origin}/*</code> ke <strong>Website Restrictions</strong> di API Key Cloud Console Anda, atau ganti dengan API Key yang bebas pembatasan.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl">
                        {searchError}
                      </div>
                    )
                  ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {searchResults.map((playlist) => (
                        <div
                          key={playlist.playlistId}
                          className="flex gap-3 bg-[#0a0b11]/80 hover:bg-[#0a0b11] border border-[#1d2136] hover:border-[#8b5cf6]/30 rounded-xl p-2.5 transition-all group items-center"
                        >
                          <div className="w-20 aspect-video rounded-lg bg-[#121420] border border-white/5 overflow-hidden flex-shrink-0">
                            <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-white truncate group-hover:text-[#a78bfa] transition-colors">
                              {playlist.title}
                            </h5>
                            <span className="text-[9px] text-[#8d93ad] mt-0.5 block font-medium">
                              Channel: {playlist.channelTitle}
                            </span>
                          </div>
                          <button
                            onClick={() => handleConnectPlaylist(playlist.playlistId)}
                            className="px-3 py-1.5 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6] text-[#a78bfa] hover:text-white border border-[#8b5cf6]/20 hover:border-transparent text-[10px] font-bold rounded-lg transition-all cursor-pointer flex-shrink-0"
                          >
                            Pilih
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#8d93ad] bg-[#0a0b11] rounded-xl border border-[#1d2136]">
                      Mencari playlist otomatis...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-extrabold text-base text-white">
              Details
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-[#1d2136]">
                <span className="text-[#8d93ad] font-medium">Release Year</span>
                <span className="text-[#eaeaf0] font-bold flex items-center gap-1">
                  <Calendar size={13} className="text-[#a78bfa]" />
                  {anime.year}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#1d2136]">
                <span className="text-[#8d93ad] font-medium">Status</span>
                <span className="text-[#eaeaf0] font-bold uppercase">{anime.status}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#1d2136]">
                <span className="text-[#8d93ad] font-medium">Episodes Count</span>
                <span className="text-[#eaeaf0] font-bold">{anime.episodesCount} Total</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#1d2136]">
                <span className="text-[#8d93ad] font-medium">Average Rating</span>
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  <Star size={13} fill="currentColor" />
                  {anime.rating} / 5.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;
