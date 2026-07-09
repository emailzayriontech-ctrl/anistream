import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, FolderHeart, User, ShieldCheck, LogOut, Sparkles } from 'lucide-react';
import { authService } from '../services/firebase';

const BottomNav = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/splash');
  };

  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'On Going', path: '/ongoing', icon: FolderHeart },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // If user is admin, append Admin Dashboard
  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0b11] border-r border-[#1d2136] h-screen sticky top-0 left-0 p-5 z-20 flex-shrink-0">
        {/* Branding Logo */}
        <div className="flex items-center gap-2.5 mb-8 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="w-9 h-9 bg-gradient-to-tr from-[#8b5cf6] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-xl bg-gradient-to-r from-white to-[#eaeaf0] bg-clip-text text-transparent tracking-wide">
            AniStream
          </span>
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm border-2 border-[#1d2136] shadow-md uppercase">
              {user.name ? user.name.substring(0, 2) : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#8d93ad] font-semibold">Welcome Back</p>
              <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 uppercase ${
                user.role === 'admin' 
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                  : user.role === 'guest' 
                  ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' 
                  : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
              }`}>
                {user.role === 'admin' ? 'SYSTEM ADMIN' : user.role === 'guest' ? 'GUEST USER' : 'PREMIUM MEMBER'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-[#8b5cf6]/10 text-[#a78bfa] border-l-4 border-[#8b5cf6]'
                      : 'text-[#8d93ad] hover:text-[#eaeaf0] hover:bg-white/5 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Upgrade to Pro Card */}
        {user && user.role !== 'guest' && user.role !== 'admin' && (
          <div className="bg-gradient-to-br from-[#121420] to-[#1a1330] border border-[#2d1e57] rounded-2xl p-4.5 mb-6 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#8b5cf6]/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#a78bfa] uppercase mb-1">
              <Sparkles size={12} />
              AniStream Plus
            </div>
            <h4 className="text-xs font-bold text-white mb-2.5">
              Unlock Offline Downloading & 4K Streaming
            </h4>
            <button className="w-full py-2 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:brightness-110 text-white rounded-xl text-[10px] font-bold transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold text-[#f87171] hover:bg-red-500/5 hover:text-red-400 transition-all duration-300 w-full text-left"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        )}
      </aside>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-nav border-t border-white/5 flex items-center justify-around px-3 z-30 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 min-w-16 ${
                  isActive
                    ? 'text-[#a78bfa] scale-105'
                    : 'text-[#8d93ad]'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[9px] font-bold mt-1 tracking-wide uppercase">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
