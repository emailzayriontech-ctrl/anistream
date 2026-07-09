import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Award, Heart, Film, Bookmark, Clock, UserPlus, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import { authService, dbService } from '../services/firebase';

const GENRE_LIST = [
  "Action", "Fantasy", "Sci-Fi", "Sports", "Gaming", 
  "Adventure", "Romance", "Comedy", "Psychological", 
  "Thriller", "Supernatural", "Drama"
];

const Profile = ({ user, onAuthChange }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // States for Stats
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [totalWatchMinutes, setTotalWatchMinutes] = useState(0);

  // Profile Edit States
  const [name, setName] = useState(user?.name || '');
  const [selectedGenres, setSelectedGenres] = useState(user?.preferences || []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setSelectedGenres(user.preferences || []);

    const fetchStats = async () => {
      try {
        const wList = await dbService.getWatchlist(user.uid);
        setWatchlistCount(wList.length);

        const hist = await dbService.getHistory(user.uid);
        setHistoryCount(hist.length);

        // Sum up total progress minutes
        const totalSecs = hist.reduce((sum, item) => sum + (item.progressSeconds || 0), 0);
        setTotalWatchMinutes(Math.round(totalSecs / 60));
      } catch (err) {
        console.error("Stats compilation failed", err);
      }
    };
    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/splash');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updatedUser = await authService.updateProfile(name, selectedGenres);
      onAuthChange(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const isGuest = user?.role === 'guest';

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-white">
          My Account
        </h1>
        <p className="text-xs text-[#8d93ad] mt-1">
          Customize profile preferences and view account milestones
        </p>
      </div>

      {/* Guest Warning Sheet */}
      {isGuest && (
        <div className="bg-gradient-to-r from-[#1d143c] to-[#121420] border border-[#3c2a86]/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#8b5cf6]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="space-y-2 text-center md:text-left z-10">
            <h3 className="font-display font-extrabold text-base text-white flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={18} className="text-[#a78bfa]" />
              Guest Session Active
            </h3>
            <p className="text-xs text-[#8d93ad] leading-relaxed max-w-xl">
              You are exploring as a guest. To save your watchlist, continue watching progress across devices, and set custom genre recommendations, register a free account.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={handleLogout} // sign out guest and go register
            className="z-10 font-bold whitespace-nowrap shadow-lg shadow-[#8b5cf6]/20 cursor-pointer"
          >
            Create Account Now
          </Button>
        </div>
      )}

      {/* Grid: Details & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Edit Details Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="font-display font-extrabold text-base text-white">
              Profile Settings
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl">
                  Profile updated successfully!
                </div>
              )}

              {/* Display Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full bg-[#0a0b11]/50 border border-[#1d2136] rounded-xl px-4 py-3 text-xs text-[#535975] cursor-not-allowed select-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isGuest}
                    className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-3 text-xs text-white placeholder-[#535975] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Edit Preferences */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider block">
                  Favorite Genre Preferences
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {GENRE_LIST.map((genre) => {
                    const selected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreToggle(genre)}
                        disabled={isGuest}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          selected
                            ? 'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/40'
                            : 'bg-[#0a0b11] text-[#8d93ad] border-[#1d2136] hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isGuest && (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="font-bold text-xs"
                >
                  Save Profile Modifications
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* Right Col: Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 space-y-5">
            <h3 className="font-display font-extrabold text-base text-white">
              Streaming Statistics
            </h3>

            <div className="space-y-4">
              {/* Watchlist Count */}
              <div className="flex items-center gap-3 bg-[#0a0b11] border border-[#1d2136] p-3.5 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/10 text-[#a78bfa] flex items-center justify-center flex-shrink-0">
                  <Bookmark size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8d93ad] uppercase">Watchlist</span>
                  <h4 className="font-bold text-sm text-white">{watchlistCount} Shows</h4>
                </div>
              </div>

              {/* Episodes Watched */}
              <div className="flex items-center gap-3 bg-[#0a0b11] border border-[#1d2136] p-3.5 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-[#6366f1]/10 text-[#818cf8] flex items-center justify-center flex-shrink-0">
                  <Film size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8d93ad] uppercase">Episodes Streamed</span>
                  <h4 className="font-bold text-sm text-white">{historyCount} Episodes</h4>
                </div>
              </div>

              {/* Watch Minutes */}
              <div className="flex items-center gap-3 bg-[#0a0b11] border border-[#1d2136] p-3.5 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#8d93ad] uppercase">Estimated Time</span>
                  <h4 className="font-bold text-sm text-white">{totalWatchMinutes} Minutes</h4>
                </div>
              </div>
            </div>

            {/* Logout Buttons */}
            <div className="pt-2 border-t border-[#1d2136]">
              <Button
                variant="outline"
                size="md"
                icon={LogOut}
                onClick={handleLogout}
                className="w-full text-red-400 border-red-500/20 hover:bg-red-500/5 hover:text-red-300 font-bold text-xs"
              >
                Sign Out Account
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
