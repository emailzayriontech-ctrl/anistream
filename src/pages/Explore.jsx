import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, EyeOff, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import LoadingState from '../components/LoadingState';
import { searchAnime, getTopAnime } from '../services/jikanApi';

const GENRE_LIST = [
  "Action", "Fantasy", "Sci-Fi", "Sports", "Gaming", 
  "Adventure", "Romance", "Comedy", "Psychological", 
  "Thriller", "Supernatural", "Drama"
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [animeList, setAnimeList] = useState([]);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Sync local search input with URL parameter
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);
  
  // Pagination State
  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  
  // Filter visibility on mobile
  const [showFilters, setShowFilters] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGenre, selectedStatus, selectedYear]);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        let list = [];
        if (searchQuery.trim() === '') {
          list = await getTopAnime(10000); // Fetch all
        } else {
          list = await searchAnime(searchQuery, 10000); // Fetch all matching
        }
        setAnimeList(list);
      } catch (err) {
        console.error("Error fetching explore catalog", err);
      } finally {
        setLoading(false);
      }
    };

    // Search is now completely offline and instant, no need to debounce!
    fetchAnime();
  }, [searchQuery]);

  // Filter Logic (client side filtering for genre/status/year from the fetched results)
  const filteredAnime = useMemo(() => {
    return animeList.filter(anime => {
      // Genre match
      const matchesGenre = selectedGenre === 'All' || 
        anime.genres.includes(selectedGenre);
        
      // Status match
      const matchesStatus = selectedStatus === 'All' || 
        (anime.status && anime.status.toLowerCase().includes(selectedStatus.toLowerCase()));
        
      // Year match
      const matchesYear = selectedYear === 'All' || 
        (anime.year && anime.year.toString() === selectedYear);

      return matchesGenre && matchesStatus && matchesYear;
    });
  }, [animeList, selectedGenre, selectedStatus, selectedYear]);

  const totalPages = Math.ceil(filteredAnime.length / ITEMS_PER_PAGE);
  const currentAnime = filteredAnime.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Generate pagination buttons array
  const paginationGroup = useMemo(() => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push('...');
      }
    }
    return pages.filter((p, index, arr) => p !== '...' || arr[index - 1] !== '...');
  }, [page, totalPages]);

  if (loading) {
    return <LoadingState.GridSkeleton count={8} />;
  }



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-white">
          Explore Anime Directory
        </h1>
        <p className="text-xs text-[#8d93ad] mt-1">
          Search titles, filter by genres, year, or release status
        </p>
      </div>

      {/* Search and Filters Hub */}
      <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-[#535975]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams({ q: e.target.value });
              }}
              placeholder="Search by title, genre details..."
              className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl pl-12 pr-4 py-3 text-xs text-white placeholder-[#535975] transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              showFilters || selectedGenre !== 'All' || selectedStatus !== 'All' || selectedYear !== 'All'
                ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/40 text-[#a78bfa]'
                : 'bg-[#0a0b11] border-[#1d2136] text-[#8d93ad] hover:text-[#eaeaf0]'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter Expand Panel */}
        {(showFilters || selectedGenre !== 'All' || selectedStatus !== 'All' || selectedYear !== 'All') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#1d2136] animate-fade-in">
            {/* Genre Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-[#eaeaf0] cursor-pointer"
              >
                <option value="All">All Genres</option>
                {GENRE_LIST.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-[#eaeaf0] cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8d93ad] uppercase tracking-wider">Release Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#0a0b11] border border-[#1d2136] rounded-xl px-4 py-2.5 text-xs text-[#eaeaf0] cursor-pointer"
              >
                <option value="All">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid Results */}
      {currentAnime.length > 0 ? (
        <div className="space-y-8 animate-fade-in pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {currentAnime.map((anime, index) => (
              <AnimeCard
                key={`explore-${anime.id}-${index}`}
                anime={anime}
                onClick={() => navigate(`/anime/${anime.id}`)}
              />
            ))}
          </div>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center bg-[#121420] border border-[#1d2136] rounded-xl text-[#8d93ad] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1c29] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {paginationGroup.map((p, i) => (
                  p === '...' ? (
                    <span key={`dots-${i}`} className="text-[#8d93ad] px-2 text-sm">...</span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        page === p
                          ? 'bg-[#8b5cf6] text-white border border-[#8b5cf6]'
                          : 'bg-[#121420] border border-[#1d2136] text-[#8d93ad] hover:bg-[#1a1c29] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => {
                  setPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center bg-[#121420] border border-[#1d2136] rounded-xl text-[#8d93ad] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1c29] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-[#121420] border border-[#1d2136] rounded-2xl text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-[#1d2136] rounded-full flex items-center justify-center text-[#8d93ad]">
            <EyeOff size={30} />
          </div>
          <div>
            <h3 className="font-semibold text-white">No Anime Found</h3>
            <p className="text-xs text-[#8d93ad] mt-1 max-w-sm">
              We couldn&apos;t find any anime matching your criteria. Try adjusting your query or filters.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              setSelectedStatus('All');
              setSelectedYear('All');
            }}
            className="px-4 py-2 bg-[#1d2136] border border-[#2d3250] hover:bg-[#252a45] rounded-xl text-xs font-bold text-[#a78bfa] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;
