import React from 'react';

// Fullscreen Spinner Loader
export const Spinner = ({ message = 'Loading AniStream...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 animate-fade-in">
      <div className="relative w-14 h-14">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8b5cf6] animate-spin" />
        {/* Inner reverse-spinning ring */}
        <div className="absolute inset-2.5 rounded-full border-4 border-transparent border-b-[#a855f7] animate-spin [animation-duration:0.8s] [animation-direction:reverse]" />
      </div>
      {message && (
        <p className="mt-5 text-sm font-semibold text-[#8d93ad] tracking-wider animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// Shimmer Skeleton for Anime Cards
export const CardSkeleton = () => {
  return (
    <div className="bg-[#121420] border border-[#1d2136] rounded-2xl overflow-hidden w-full flex flex-col animate-pulse">
      {/* Poster area */}
      <div className="aspect-[3/4] bg-[#1d2136] w-full" />
      {/* Detail area */}
      <div className="p-3 space-y-2.5 flex-1">
        <div className="h-4 bg-[#1d2136] rounded-md w-3/4" />
        <div className="h-3 bg-[#1d2136] rounded-md w-1/2" />
        <div className="flex items-center justify-between pt-2 border-t border-[#1d2136]">
          <div className="h-3 bg-[#1d2136] rounded-md w-1/4" />
          <div className="h-3 bg-[#1d2136] rounded-md w-1/5" />
        </div>
      </div>
    </div>
  );
};

// Shimmer Skeleton for Grids
export const GridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
};

// Shimmer Skeleton for Detail Page
export const DetailSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Banner */}
      <div className="h-64 md:h-80 bg-[#121420] rounded-3xl w-full" />
      
      {/* Grid structure for body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-[#121420] rounded-lg w-1/3" />
          <div className="h-4 bg-[#121420] rounded-lg w-full" />
          <div className="h-4 bg-[#121420] rounded-lg w-full" />
          <div className="h-4 bg-[#121420] rounded-lg w-2/3" />
          
          <div className="space-y-3 pt-6">
            <div className="h-6 bg-[#121420] rounded-lg w-1/4" />
            <div className="h-12 bg-[#121420] rounded-xl w-full" />
            <div className="h-12 bg-[#121420] rounded-xl w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#121420] rounded-2xl p-5 space-y-3.5 h-64" />
        </div>
      </div>
    </div>
  );
};

// Main wrapper export
const LoadingState = {
  Spinner,
  CardSkeleton,
  GridSkeleton,
  DetailSkeleton
};

export default LoadingState;
