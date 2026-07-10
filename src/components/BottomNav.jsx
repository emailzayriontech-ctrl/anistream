import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, FolderHeart, User, ShieldCheck, LogOut, Sparkles, Search } from 'lucide-react';
import { authService } from '../services/firebase';

const BottomNav = ({ user }) => {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/splash');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
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
      {/* ================= DESKTOP TOP HEADER ================= */}
      <header className="hidden md:flex items-center justify-between w-full bg-[#0a0b11] border-b border-[#1d2136] px-8 py-4 sticky top-0 z-20 shadow-md">
        {/* Left Side: Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          {/* Branding Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-8 h-8 bg-gradient-to-tr from-[#8b5cf6] to-[#a855f7] rounded-lg flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-lg bg-gradient-to-r from-white to-[#eaeaf0] bg-clip-text text-transparent tracking-wide">
              AniStream
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
                        : 'text-[#8d93ad] hover:text-[#eaeaf0] hover:bg-white/5'
                    }`
                  }
                >
                  {item.name.toUpperCase()}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Global Search Bar & User Session */}
        <div className="flex items-center gap-4">
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <Search className="absolute left-3.5 top-2.5 text-[#535975]" size={15} />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search Anime..."
              className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#535975] focus:outline-none focus:border-[#8b5cf6] transition-all"
            />
          </form>

          {/* User Profile/Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-[#1d2136]">
              <div 
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] flex items-center justify-center text-white font-bold text-xs border border-[#1d2136] shadow-md uppercase cursor-pointer"
                onClick={() => navigate('/profile')}
                title={user.name}
              >
                {user.name ? user.name.substring(0, 2) : 'US'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

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
