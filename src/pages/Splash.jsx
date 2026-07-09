import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Flame, UserCheck } from 'lucide-react';
import Button from '../components/Button';
import { authService } from '../services/firebase';

const Splash = () => {
  const navigate = useNavigate();
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGuestEntry = async () => {
    setLoadingGuest(true);
    try {
      await authService.signInAsGuest();
      navigate('/home');
    } catch (err) {
      console.error("Guest access error", err);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07080d] flex items-center justify-center p-6 overflow-hidden select-none">
      {/* Decorative neon background elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#6366f1]/10 blur-[120px]" />

      <div className="w-full max-w-md text-center z-10 space-y-8 animate-fade-in">
        {/* Branding Logo */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#8b5cf6] to-[#a855f7] rounded-3xl flex items-center justify-center shadow-[0_10px_35px_rgba(139,92,246,0.5)] border border-[#a855f7]/30 mb-5 relative group animate-glow">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          
          <h1 className="font-display font-black text-4xl tracking-tight text-white">
            Ani<span className="bg-gradient-to-r from-[#a78bfa] to-[#6366f1] bg-clip-text text-transparent">Stream</span>
          </h1>
          <p className="text-xs text-[#8d93ad] tracking-widest uppercase font-bold mt-2">
            Catalog &amp; Safe Streaming
          </p>
        </div>



        {/* Sign In & Entry Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            variant="primary" 
            size="lg" 
            icon={Play}
            onClick={() => navigate('/login')}
            className="w-full font-bold py-3 text-sm"
          >
            Login
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate('/register')}
            className="w-full font-bold py-3 text-sm text-[#eaeaf0] border-[#1d2136] bg-[#121420]/30 hover:bg-[#121420]/60"
          >
            Daftar
          </Button>

          <button
            onClick={handleGuestEntry}
            disabled={loadingGuest}
            className="text-[11px] font-bold text-[#8d93ad] hover:text-[#a78bfa] transition-colors py-2 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            {loadingGuest ? 'Memasuki Sesi...' : 'Masuk Tanpa Akun'}
          </button>
        </div>

        {/* App Version Tag */}
        <div className="text-[10px] text-[#535975] font-semibold pt-4">
          AniStream MVP • Version 1.0.0
        </div>
      </div>
    </div>
  );
};

export default Splash;
