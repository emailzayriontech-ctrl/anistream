import React from 'react';
import { Star, Play, RotateCcw } from 'lucide-react';

const AnimeCard = ({ anime, onClick, variant = 'vertical', progress, onResume }) => {
  // Vertical card layout (catalog/trending)
  if (variant === 'vertical') {
    return (
      <div 
        onClick={onClick}
        className="group relative flex flex-col bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/50 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] w-full animate-fade-in"
      >
        {/* Aspect Ratio container for Poster */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0d0e15]">
          {/* Episode Count Badge */}
          {anime.episodesCount && (
            <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-[8px] sm:text-[10px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10 uppercase">
              EP {String(anime.episodesCount).padStart(2, '0')}
            </div>
          )}
          
          {/* Rating Badge */}
          <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md text-[8px] sm:text-[10px] font-bold text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-1">
            <Star size={9} fill="currentColor" />
            {anime.rating.toFixed(1)}
          </div>

          <img 
            src={anime.poster} 
            alt={anime.title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-10 h-10 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-[#8b5cf6]/50">
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[11px] sm:text-xs md:text-sm line-clamp-1 text-[#eaeaf0] group-hover:text-[#a78bfa] transition-colors">
              {anime.title}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[#8d93ad] mt-0.5 line-clamp-1">
              {anime.genres.join(' • ')}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1d2136]">
            <span className="text-[8px] sm:text-[9px] font-medium text-[#8d93ad] uppercase">
              {anime.status}
            </span>
            <span className="text-[8px] sm:text-[9px] font-medium text-[#8d93ad]">
              {anime.year}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Horizontal card layout (continue watching)
  if (variant === 'horizontal' && progress) {
    const percentWatched = Math.min(
      Math.round((progress.progressSeconds / progress.durationSeconds) * 100), 
      100
    );
    const isFinished = percentWatched >= 95;

    return (
      <div className="flex flex-row items-center bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden p-2 sm:p-3 gap-3 sm:gap-4 transition-all duration-300 hover:border-[#8b5cf6]/30 hover:shadow-[0_4px_20px_rgba(139,92,246,0.05)] w-full">
        {/* Landscape Thumbnail */}
        <div className="relative w-24 sm:w-32 md:w-48 aspect-video rounded-xl overflow-hidden bg-[#0d0e15] flex-shrink-0">
          <img 
            src={anime.banner || anime.poster} 
            alt={anime.title} 
            className="w-full h-full object-cover"
          />
          {/* Progress bar overlay on thumbnail for mobile/tablet */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 md:hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]'
              }`}
              style={{ width: `${percentWatched}%` }}
            />
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between self-stretch">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[8px] sm:text-[10px] font-bold text-[#a78bfa] tracking-wider uppercase truncate">
                {anime.title}
              </span>
              <span className="text-[8px] sm:text-[10px] text-[#8d93ad] font-semibold flex-shrink-0 hidden sm:inline">
                {progress.lastWatchedAt ? new Date(progress.lastWatchedAt).toLocaleDateString() : ''}
              </span>
            </div>
            
            <h4 className="font-semibold text-[#eaeaf0] text-[11px] sm:text-xs md:text-sm mt-0.5 truncate">
              S1 : Ep {progress.episodeNumber} — &quot;{progress.episodeTitle}&quot;
            </h4>
            
            <p className="text-[10px] text-[#8d93ad] mt-1 hidden md:block">
              {Math.floor(progress.progressSeconds / 60)}m watched / {Math.floor(progress.durationSeconds / 60)}m total
            </p>
          </div>

          {/* Desktop Progress Bar (Visible on md and up) */}
          <div className="mt-2 hidden md:block">
            <div className="flex justify-between items-center text-[10px] text-[#8d93ad] mb-1 font-medium">
              <span>{Math.floor(progress.progressSeconds / 60)}:{(progress.progressSeconds % 60).toString().padStart(2, '0')} / {Math.floor(progress.durationSeconds / 60)}:{(progress.durationSeconds % 60).toString().padStart(2, '0')}</span>
              <span className={isFinished ? 'text-green-400 font-bold' : 'text-[#a78bfa]'}>
                {isFinished ? 'Finished' : `${percentWatched}%`}
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isFinished 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]'
                }`}
                style={{ width: `${percentWatched}%` }}
              />
            </div>
          </div>
          
          {/* Mobile Watch Details */}
          <div className="md:hidden flex items-center gap-1.5 text-[8px] sm:text-[9px] text-[#8d93ad] mt-1 font-semibold">
            <span className={isFinished ? 'text-emerald-400' : 'text-[#a78bfa]'}>
              {isFinished ? 'Finished' : `${percentWatched}% watched`}
            </span>
          </div>
        </div>

        {/* Action Button Column */}
        <div className="flex-shrink-0 pl-1 md:pl-2">
          <button
            onClick={onResume}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-[9px] sm:text-xs md:text-sm transition-all duration-300 active:scale-95 flex items-center gap-1 sm:gap-2 cursor-pointer ${
              isFinished 
                ? 'bg-[#1d2136] text-[#eaeaf0] border border-[#2d3250] hover:bg-[#252a45]' 
                : 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-[0_4px_10px_rgba(139,92,246,0.2)] hover:brightness-110'
            }`}
          >
            {isFinished ? (
              <>
                <RotateCcw size={11} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Restart</span>
              </>
            ) : (
              <>
                <Play size={11} fill="currentColor" className="sm:w-3.5 sm:h-3.5 ml-0.5" />
                <span className="hidden sm:inline">Resume</span>
                <span className="sm:hidden">Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AnimeCard;
