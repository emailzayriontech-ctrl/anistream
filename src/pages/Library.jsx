import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Clock, Trash2, HeartOff, RefreshCw } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import LoadingState from '../components/LoadingState';
import { dbService } from '../services/firebase';

const Library = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'history'
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch Watchlist
      const wList = await dbService.getWatchlist(user.uid);
      setWatchlist(wList);

      // Fetch History
      const hist = await dbService.getHistory(user.uid);
      
      // Fetch Anime Catalog to map full metadata
      const animeCatalog = await dbService.getAnimeList();
      
      const mappedHistory = hist.map(histItem => {
        const meta = animeCatalog.find(a => a.id === histItem.animeId);
        if (meta) {
          return {
            ...histItem,
            animeMeta: meta
          };
        }
        return null;
      }).filter(Boolean);

      setHistory(mappedHistory);
    } catch (err) {
      console.error("Library sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClearHistory = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to clear your entire watch history?")) {
      try {
        await dbService.clearHistory(user.uid);
        setHistory([]);
      } catch (err) {
        console.error("Clear history failed", err);
      }
    }
  };

  if (loading) {
    return <LoadingState.GridSkeleton count={4} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display font-extrabold text-xl md:text-2xl text-white">
            My Library
          </h1>
          <p className="text-xs text-[#8d93ad] mt-1">
            Access bookmarked shows and check your streaming progress
          </p>
        </div>

        {/* Clear History Action (Only on history tab & if history exists) */}
        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Tabs Toggles */}
      <div className="flex border-b border-[#1d2136]">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'watchlist'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <Bookmark size={15} />
          My Watchlist ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'text-[#a78bfa] border-[#8b5cf6]'
              : 'text-[#8d93ad] border-transparent hover:text-white'
          }`}
        >
          <Clock size={15} />
          Watch History ({history.length})
        </button>
      </div>

      {/* TAB SHEETS CONTENT */}
      {activeTab === 'watchlist' ? (
        watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {watchlist.map((item) => (
              <AnimeCard
                key={item.id}
                anime={item}
                onClick={() => navigate(`/anime/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          /* Watchlist Empty State */
          <div className="flex flex-col items-center justify-center p-12 bg-[#121420] border border-[#1d2136] rounded-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#1d2136] rounded-full flex items-center justify-center text-[#8d93ad]">
              <Bookmark size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Your Watchlist is Empty</h3>
              <p className="text-xs text-[#8d93ad] mt-1 max-w-xs mx-auto">
                Keep track of shows you want to watch by bookmarking them from their details pages.
              </p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              Browse Anime Catalog
            </button>
          </div>
        )
      ) : (
        /* History Tab Content */
        history.length > 0 ? (
          <div className="flex flex-col gap-4">
            {history.map((progressRecord) => (
              <AnimeCard
                key={progressRecord.key}
                anime={progressRecord.animeMeta}
                variant="horizontal"
                progress={progressRecord}
                onResume={() => navigate(`/watch/${progressRecord.animeId}/${progressRecord.episodeId}`)}
              />
            ))}
          </div>
        ) : (
          /* History Empty State */
          <div className="flex flex-col items-center justify-center p-12 bg-[#121420] border border-[#1d2136] rounded-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#1d2136] rounded-full flex items-center justify-center text-[#8d93ad]">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white">No Stream History</h3>
              <p className="text-xs text-[#8d93ad] mt-1 max-w-xs mx-auto">
                Streaming progress will automatically save here so you can continue from any page.
              </p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              Start Watching Now
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default Library;
