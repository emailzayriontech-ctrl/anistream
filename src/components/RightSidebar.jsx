import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Flame, ChevronRight } from 'lucide-react';

const RightSidebar = () => {
  const navigate = useNavigate();

  // Popular anime schedule data (matching typical seasonal airing days)
  const scheduleData = [
    { day: 'Senin', title: 'Tower of God Season 2', ep: 'Ep 2' },
    { day: 'Selasa', title: 'Make Heroine ga Oosugiru!', ep: 'Ep 3' },
    { day: 'Rabu', title: 'Tokidoki Bosotto Russia-go', ep: 'Ep 2' },
    { day: 'Kamis', title: 'Oshi no Ko Season 2', ep: 'Ep 2' },
    { day: 'Jumat', title: 'NieR:Automata Ver1.1a', ep: 'Ep 14' },
    { day: 'Sabtu', title: 'The Elusive Samurai', ep: 'Ep 2' },
    { day: 'Minggu', title: 'Wistoria: Wand and Sword', ep: 'Ep 1' },
  ];

  return (
    <aside className="w-full space-y-6">
      {/* 1. FACEBOOK WIDGET CARD */}
      <div className="bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden shadow-lg">
        {/* Widget Header */}
        <div className="px-4.5 py-3 border-b border-[#1d2136] bg-[#121420]">
          <h3 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-[#1877f2]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Sukai Halamannya ya!
          </h3>
        </div>

        {/* Facebook Page Plugin Mock */}
        <div className="p-4">
          <div className="relative h-28 w-full rounded-xl overflow-hidden border border-[#1d2136] bg-gradient-to-br from-[#1e1b4b] to-[#311042] flex items-end p-3.5 group">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

            {/* Profile Content */}
            <div className="relative flex items-center gap-3 z-10 w-full">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-[#8b5cf6] to-[#a855f7] border-2 border-white/10 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                AS
              </div>
              
              {/* Titles */}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white leading-tight drop-shadow-md hover:text-[#a78bfa] transition-colors cursor-pointer">
                  AniStream
                </h4>
                <p className="text-[10px] text-gray-300 font-semibold mt-0.5">
                  125.000 pengikut
                </p>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3.5 w-full py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Ikuti Halaman
          </a>
        </div>
      </div>

      {/* 2. DAILY RELEASE SCHEDULE WIDGET */}
      <div className="bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden shadow-lg">
        {/* Widget Header */}
        <div className="px-4.5 py-3 border-b border-[#1d2136] bg-[#121420] flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Calendar size={14} className="text-[#8b5cf6]" />
            Jadwal Rilis Terpopuler
          </h3>
          <span className="text-[9px] font-bold bg-[#8b5cf6]/10 text-[#a78bfa] px-1.5 py-0.5 rounded border border-[#8b5cf6]/20">
            WIB
          </span>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-[#1d2136]/50">
          {scheduleData.map((item, idx) => (
            <div 
              key={`sched-${idx}`} 
              className="p-3.5 hover:bg-white/[0.01] transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-extrabold text-[#8b5cf6] uppercase bg-[#8b5cf6]/5 px-1.5 py-0.5 rounded border border-[#8b5cf6]/10">
                    {item.day}
                  </span>
                  <span className="text-[9px] text-[#8d93ad] font-semibold">
                    {item.ep}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#535975] group-hover:text-white transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
