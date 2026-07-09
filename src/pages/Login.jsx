import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { authService } from '../services/firebase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.signIn(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07080d] flex items-center justify-center p-6 overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#6366f1]/10 blur-[120px]" />

      <div className="w-full max-w-md z-10 animate-fade-in space-y-6">
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
            Welcome Back to AniStream
          </h2>
          <p className="text-xs text-[#8d93ad] mt-1">
            Sign in to synchronize watchlist and watch progress
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121420]/80 border border-[#1d2136] rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
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
                  placeholder="name@example.com"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8d93ad] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-[#535975]" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={LogIn}
              className="w-full font-bold py-3 mt-2 text-xs"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 pt-5 border-t border-[#1d2136] text-[10px] text-[#8d93ad] space-y-2">
            <span className="font-bold text-[#eaeaf0] block uppercase tracking-wider mb-1">
              💡 Test Credentials (Preseeded):
            </span>
            <div className="flex justify-between bg-[#0a0b11] px-3 py-1.5 rounded-lg border border-[#1d2136]">
              <span>Demo User: <code className="text-[#a78bfa] p-0 bg-transparent">user@anistream.com</code></span>
              <span>Pass: <code className="text-[#a78bfa] p-0 bg-transparent">user123</code></span>
            </div>
            <div className="flex justify-between bg-[#0a0b11] px-3 py-1.5 rounded-lg border border-[#1d2136]">
              <span>Admin User: <code className="text-amber-400 p-0 bg-transparent">admin@anistream.com</code></span>
              <span>Pass: <code className="text-amber-400 p-0 bg-transparent">admin123</code></span>
            </div>
          </div>
        </div>

        {/* Bottom Redirect */}
        <div className="text-center text-xs font-semibold text-[#8d93ad]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#a78bfa] hover:text-[#8b5cf6] underline transition-colors">
            Register for Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
