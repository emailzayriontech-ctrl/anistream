import React from 'react';
import { Play, Plus, Check } from 'lucide-react';
import Button from './Button';

const HeroBanner = ({ anime, onPlay, isAddedToWatchlist, onToggleWatchlist }) => {
  if (!anime) return null;

  // Find the last episode or default to 1
  const latestEpisode = anime.episodes && anime.episodes.length > 0 
    ? anime.episodes[anime.episodes.length - 1] 
    : null;
  const epNumber = latestEpisode ? latestEpisode.episodeNumber : 1;

  return (
    <div className="relative w-full h-[40vh] sm:h-[48vh] md:h-[52vh] lg:h-[60vh] rounded-2xl md:rounded-3xl overflow-hidden mb-6 md:mb-8 group animate-fade-in">
      {/* Background Banner Image */}
      <div className="absolute inset-0 bg-[#0d0e15]">
        <img 
          src={anime.banner || anime.poster} 
          alt={anime.title} 
          className="w-full h-full object-cover object-top transition-transform duration-10000 ease-out group-hover:scale-105"
        />
        {/* Gradients to blend banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-12 z-10 max-w-2xl">
        {/* Status Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3.5">
          <span className="bg-[#8b5cf6] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded sm:rounded-md uppercase tracking-wider">
            {anime.status}
          </span>
          <span className="bg-white/10 backdrop-blur-md text-[#eaeaf0] text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded sm:rounded-md uppercase tracking-wider border border-white/5">
            EPISODE {String(epNumber).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs text-[#a78bfa] font-semibold ml-1">
            {anime.genres.join(' • ')}
          </span>
        </div>

        {/* Anime Title */}
        <h1 className="font-display font-extrabold text-lg sm:text-3xl lg:text-4xl text-white mb-2 md:mb-3.5 leading-tight tracking-tight drop-shadow-md line-clamp-1">
          {anime.title}
        </h1>

        {/* Synopsis */}
        <p className="text-[10px] sm:text-xs md:text-sm text-[#8d93ad] line-clamp-2 sm:line-clamp-3 mb-4 md:mb-6 leading-relaxed max-w-xl">
          {anime.synopsis}
        </p>

        {/* Play & List Buttons */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="primary" 
            size="sm"
            icon={Play}
            onClick={onPlay}
            className="shadow-lg shadow-[#8b5cf6]/20 font-bold !px-3.5 !py-2 sm:!px-5 sm:!py-2.5 text-[10px] sm:text-xs rounded-xl"
          >
            Watch Episode {epNumber}
          </Button>

          <Button
            variant={isAddedToWatchlist ? 'glass' : 'secondary'}
            size="sm"
            icon={isAddedToWatchlist ? Check : Plus}
            onClick={onToggleWatchlist}
            className="font-bold border border-white/10 !px-3.5 !py-2 sm:!px-5 sm:!py-2.5 text-[10px] sm:text-xs rounded-xl"
          >
            {isAddedToWatchlist ? 'My List' : 'My List'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
