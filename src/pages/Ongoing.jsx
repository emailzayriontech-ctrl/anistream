import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import LoadingState from '../components/LoadingState';
import { getSeasonNow } from '../services/jikanApi';

const Ongoing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [animeList, setAnimeList] = useState([]);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        const list = await getSeasonNow(50); // Get up to 50 ongoing animes
        setAnimeList(list);
      } catch (err) {
        console.error("Error fetching ongoing anime", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  if (loading) {
    return <LoadingState.GridSkeleton count={8} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-white flex items-center gap-2">
          <Compass className="text-[#a78bfa]" size={24} />
          On Going Anime
        </h1>
        <p className="text-xs text-[#8d93ad] mt-1">
          Daftar anime yang sedang tayang pada musim ini
        </p>
      </div>

      {/* Grid Results */}
      {animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5 pb-10">
          {animeList.map((anime, index) => (
            <AnimeCard
              key={`ongoing-${anime.id}-${index}`}
              anime={anime}
              onClick={() => navigate(`/anime/${anime.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-[#121420] border border-[#1d2136] rounded-2xl text-center space-y-4">
          <p className="text-xs text-[#8d93ad] mt-1">
            Belum ada anime on going yang tersedia.
          </p>
        </div>
      )}
    </div>
  );
};

export default Ongoing;
