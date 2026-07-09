import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, AlertCircle, Heart } from 'lucide-react';
import Button from '../components/Button';
import { authService } from '../services/firebase';

const GENRE_OPTIONS = [
  "Action", "Fantasy", "Sci-Fi", "Sports", "Gaming", 
  "Adventure", "Romance", "Comedy", "Psychological", 
  "Thriller", "Supernatural", "Drama"
];

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenreToggle = (genre) => {
    if (preferences.includes(genre)) {
      setPreferences(preferences.filter(g => g !== genre));
    } else {
      setPreferences([...preferences, genre]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.signUp(email, password, name, preferences);
      navigate('/home');
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07080d] flex items-center justify-center p-6 overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#6366f1]/10 blur-[120px]" />

      <div className="w-full max-w-lg z-10 animate-fade-in space-y-6">
        {/* Branding Logo */}
        <div className="flex flex-col items-center text-center">
          <div 
            onClick={() => navigate('/splash')}
            className="w-14 h-14 bg-gradient-to-tr from-[#8b5cf6] to-[#a855f7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30 cursor-pointer mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          
          <h2 className="font-display font-bold text-2xl text-white">
            Create Your AniStream Account
          </h2>
          <p className="text-xs text-[#8d93ad] mt-1">
            Unlock tracking progress, watchlist, and personalized feeds
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#121420]/80 border border-[#1d2136] rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Grid for Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8d93ad] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-[#535975]" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8d93ad] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-[#535975]" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8d93ad] uppercase tracking-wider">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-[#535975]" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
                />
              </div>
            </div>

            {/* Onboarding Preferences */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8d93ad] uppercase tracking-wider">
                <Heart size={14} className="text-[#a78bfa]" />
                Select Favorite Genres (Optional)
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 pb-1">
                {GENRE_OPTIONS.map((genre) => {
                  const selected = preferences.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                        selected
                          ? 'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/40 shadow-[0_2px_8px_rgba(139,92,246,0.15)]'
                          : 'bg-[#0a0b11] text-[#8d93ad] border-[#1d2136] hover:border-white/10 hover:text-[#eaeaf0]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={UserPlus}
              className="w-full font-bold py-3 mt-1 text-xs"
            >
              Create Free Account
            </Button>
          </form>
        </div>

        {/* Bottom Redirect */}
        <div className="text-center text-xs font-semibold text-[#8d93ad]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#a78bfa] hover:text-[#8b5cf6] underline transition-colors">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
