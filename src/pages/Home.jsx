import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Compass, Play, Sparkles, FolderHeart } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import AnimeCard from '../components/AnimeCard';
import LoadingState from '../components/LoadingState';
import { dbService } from '../services/firebase';
import { getTopAnime, getSeasonNow, getRecentlyUpdatedAnime } from '../services/jikanApi';

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);
  const [ongoingAnime, setOngoingAnime] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [spotlightAnime, setSpotlightAnime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data simultaneously since rate-limiting is now handled gracefully via batch queries and caching
        const [topData, seasonData, updatedData] = await Promise.all([
          getTopAnime(15),
          getSeasonNow(15),
          getRecentlyUpdatedAnime(10)
        ]);

        setTrendingAnime(topData);
        setOngoingAnime(seasonData);
        setRecentlyUpdated(updatedData);

        // Set spotlight anime to the top #1 anime
        setSpotlightAnime(topData[0]);

        if (user) {
          // Fetch User's Watchlist (from Firebase later)
          const userWatchlist = await dbService.getWatchlist(user.uid);
          setWatchlist(userWatchlist);

          // Fetch User's History for Continue Watching
          const history = await dbService.getHistory(user.uid);
          
          // Construct "Continue Watching" items with anime meta
          // Note: with real DB, history should store animeMeta or we fetch it individually
          // For now, we will map it if it happens to be in topData/seasonData
          const allLoaded = [...topData, ...seasonData];
          const continueList = history.map(histItem => {
            const animeMeta = allLoaded.find(a => a.id === histItem.animeId) || histItem.animeMeta;
            if (animeMeta) {
              return {
                ...histItem,
                animeMeta
              };
            }
            return null;
          }).filter(Boolean);

          setContinueWatching(continueList);
        }
      } catch (err) {
        console.error("Error loading home dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleToggleWatchlist = async (anime) => {
    if (!user) return;
    try {
      const { watchlist: updatedList } = await dbService.toggleWatchlist(user.uid, anime);
      setWatchlist(updatedList);
    } catch (err) {
      console.error("Watchlist toggle failed", err);
    }
  };

  if (loading) {
    return <LoadingState.DetailSkeleton />;
  }

  const isSpotlightInWatchlist = spotlightAnime 
    ? watchlist.some(w => w.id === spotlightAnime.id) 
    : false;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. HERO SPOTLIGHT BANNER */}
      {spotlightAnime && (
        <HeroBanner
          anime={spotlightAnime}
          onPlay={() => {
            // Always try to play episode 1 from the hero banner
            navigate(`/watch/${spotlightAnime.id}/1`);
          }}
          isAddedToWatchlist={isSpotlightInWatchlist}
          onToggleWatchlist={() => handleToggleWatchlist(spotlightAnime)}
        />
      )}

      {/* MAIN CONTENT & SIDEBAR SPLIT */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT CONTENT AREA */}
        <div className="flex-1 space-y-10 min-w-0">
          {/* 2. CONTINUE WATCHING ROW */}
          {continueWatching.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg md:text-xl text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#8b5cf6] rounded-full" />
                  Continue Watching
                </h2>
                <button 
                  onClick={() => navigate('/library')} 
                  className="text-xs text-[#a78bfa] hover:text-[#8b5cf6] font-semibold transition-colors uppercase tracking-wider"
                >
                  See All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {continueWatching.slice(0, 2).map((item, index) => (
                  <AnimeCard
                    key={`cw-${item.animeId}-${index}`}
                    anime={item.animeMeta}
                    variant="horizontal"
                    progress={item}
                    onResume={() => navigate(`/watch/${item.animeId}/${item.episodeId}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. RECENTLY UPDATED ROW */}
          {recentlyUpdated.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg md:text-xl text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#ec4899] rounded-full" />
                  Baru Saja Rilis
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {recentlyUpdated.map((anime, idx) => (
                  <div key={`recent-${anime.id}-${idx}`} className="relative">
                    <AnimeCard anime={anime} variant="vertical" onClick={() => navigate(`/anime/${anime.id}`)} />
                    {anime.latestEpisodeTitle && (
                      <div className="absolute top-2 left-2 max-w-[85%] bg-gradient-to-r from-pink-600/95 to-purple-600/95 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 pointer-events-none z-10">
                        <Sparkles className="w-3 h-3 flex-shrink-0 text-pink-200" />
                        <span className="truncate">{anime.latestEpisodeTitle}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. TRENDING ROW */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-lg md:text-xl text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#8b5cf6] rounded-full" />
                Trending This Week
              </h2>
              <button 
                onClick={() => navigate('/explore')} 
                className="text-xs text-[#a78bfa] hover:text-[#8b5cf6] font-semibold transition-colors uppercase tracking-wider"
              >
                Expand All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {trendingAnime.map((anime, index) => (
                <div key={`trending-${anime.id}-${index}`} className="relative">
                  <AnimeCard 
                    anime={anime} 
                    onClick={() => navigate(`/anime/${anime.id}`)} 
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR (ONGOING) */}
        <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0">
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-5 shadow-lg">
            <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2 mb-5">
              <span className="w-1.5 h-5 bg-[#6366f1] rounded-full" />
              Ongoing Anime
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {ongoingAnime.slice(0, 8).map((anime, index) => (
                <AnimeCard 
                  key={`ongoing-${anime.id}-${index}`}
                  anime={anime} 
                  variant="vertical"
                  onClick={() => navigate(`/anime/${anime.id}`)} 
                />
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Home;
