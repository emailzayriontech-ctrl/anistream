import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SkipForward, SkipBack, ListVideo } from 'lucide-react';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import { dbService } from '../services/firebase';
import { getAnimeById, getAnimeEpisodes, getMappedAnimeCatalog } from '../services/jikanApi';
import { getPlaylistEpisodes, getPlaylistIdForAnime } from '../services/youtube';
import VideoPlayer from '../components/VideoPlayer';
import AnimeCard from '../components/AnimeCard';

const Watch = ({ user }) => {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [anime, setAnime] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchEpisodeMeta = async () => {
      try {
        setLoading(true);
        // Fetch from Jikan API
        const animeMeta = await getAnimeById(animeId);
        
        let episodes = [];
        const playlistId = getPlaylistIdForAnime(animeId);
        
        let usedPlaylist = false;
        
        if (playlistId) {
          try {
            episodes = await getPlaylistEpisodes(playlistId);
            usedPlaylist = true;
          } catch (ytErr) {
            console.warn("Playlist YouTube gagal dimuat (mungkin dihapus/private), menggunakan fallback:", ytErr);
          }
        } 
        
        if (!usedPlaylist) {
          // If no mapping or it failed, fallback to Jikan dummy episodes
          episodes = await getAnimeEpisodes(animeId);
        }
        
        animeMeta.episodes = episodes;
        setAnime(animeMeta);

        // Try to find the exact episode by ID, or fallback to the first episode
        let epMeta = episodes.find(e => e.id.toString() === episodeId.toString());
        if (!epMeta && episodes.length > 0) {
          epMeta = episodes[0]; // Fallback to episode 1 if exact ID not matched
        }

        if (epMeta) {
          // getPlaylistEpisodes already sets videoType and videoUrl!
          // But if it's fallback jikan data (playlist 404/deleted), we show an error state
          if (!usedPlaylist) {
            epMeta.videoType = "error";
            epMeta.videoUrl = ""; 
          }
          setEpisode(epMeta);
        } else {
          throw new Error("Episode details not found.");
        }

        // Fetch Recommendations
        try {
          const catalog = await getMappedAnimeCatalog();
          const recs = catalog.filter(a => a.id.toString() !== animeId.toString());
          setRecommendations(recs.sort(() => 0.5 - Math.random()).slice(0, 6));
        } catch (err) {
          console.error("Failed to load recommendations", err);
        }

        // We skip custom watch progress history tracking for iframes 
        // since we can't easily track current time of an external embed.
        // We will just mark it as visited.
        if (user) {
          await dbService.updateWatchProgress(user.uid, {
            animeId: animeMeta.id,
            animeTitle: animeMeta.title,
            animePoster: animeMeta.poster,
            episodeId: epMeta ? epMeta.id : episodeId,
            episodeNumber: epMeta ? epMeta.episodeNumber : 1,
            episodeTitle: epMeta ? epMeta.title : 'Episode',
            progressSeconds: 0,
            durationSeconds: 1440
          });
        }
      } catch (err) {
        console.error("Watch loader failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodeMeta();
  }, [animeId, episodeId, user]);

  if (loading) {
    return <LoadingState.Spinner message={`Loading Episode...`} />;
  }

  if (!anime || !episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <p className="text-red-400 font-bold">Watch page meta failed to compile.</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>Return Home</Button>
      </div>
    );
  }

  // Find Next & Prev Episode
  const nextEpisode = anime.episodes.find(
    e => e.episodeNumber === episode.episodeNumber + 1
  );
  
  const prevEpisode = anime.episodes.find(
    e => e.episodeNumber === episode.episodeNumber - 1
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Back Button navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/anime/${animeId}`)}
          className="w-9 h-9 rounded-full bg-[#121420] border border-[#1d2136] flex items-center justify-center text-[#8d93ad] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="font-semibold text-xs text-[#a78bfa] tracking-wide truncate">{anime.title}</h2>
          <h1 className="font-display font-extrabold text-sm md:text-base text-white mt-0.5">
            EP {episode.episodeNumber} : {episode.title}
          </h1>
        </div>
      </div>

      {/* VIDEO PLAYER CONTAINER */}
      <div className="w-full flex justify-center">
        <VideoPlayer
          videoType={episode.videoType}
          videoUrl={episode.videoUrl}
          title={`${anime.title} Episode ${episode.episodeNumber}`}
        />
      </div>

      {/* SYNOPSIS & EPISODE NAVIGATION */}
      <div className="bg-[#121420] border border-[#1d2136] rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2 flex-1">
          <h3 className="font-display font-extrabold text-base text-white">About this Episode</h3>
          <p className="text-xs text-[#8d93ad] leading-relaxed max-w-3xl">
            You are watching Episode {episode.episodeNumber} of &quot;{anime.title}&quot;. 
            Because this is an MVP using external video embeds, progress tracking is limited.
          </p>
        </div>

        {/* EPISODE NAVIGATION BUTTONS */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 md:justify-end w-full md:w-auto">
          <Button
            variant="secondary"
            size="md"
            icon={ListVideo}
            onClick={() => navigate(`/anime/${anime.id}`)}
            className="w-full sm:w-auto text-xs font-bold whitespace-nowrap"
          >
            Lihat Semua Eps
          </Button>

          {prevEpisode && (
            <Button
              variant="secondary"
              size="md"
              icon={SkipBack}
              onClick={() => navigate(`/watch/${anime.id}/${prevEpisode.id}`)}
              className="w-full sm:w-auto text-xs font-bold whitespace-nowrap"
            >
              Prev Eps
            </Button>
          )}

          {nextEpisode && (
            <Button
              variant="primary"
              size="md"
              icon={SkipForward}
              onClick={() => navigate(`/watch/${anime.id}/${nextEpisode.id}`)}
              className="w-full sm:w-auto text-xs font-bold whitespace-nowrap"
            >
              Next Eps
            </Button>
          )}
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="pt-6 mt-4 border-t border-[#1d2136]">
          <h3 className="font-display font-extrabold text-base md:text-lg text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#6366f1] rounded-full" />
            You May Also Like
          </h3>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {recommendations.map((recAnime, index) => (
              <div key={`rec-${recAnime.id}-${index}`} className="w-32 sm:w-40 md:w-48 flex-shrink-0">
                <AnimeCard 
                  anime={recAnime} 
                  onClick={() => navigate(`/anime/${recAnime.id}`)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
