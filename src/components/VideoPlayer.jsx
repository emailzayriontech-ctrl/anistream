import React, { useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export default function VideoPlayer({ videoType, videoUrl, title }) {
  const playerRef = useRef(null);
  const plyrInstance = useRef(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    setSkipped(false);
  }, [videoUrl]);

  useEffect(() => {
    if (!playerRef.current) return;

    // Initialize Plyr
    plyrInstance.current = new Plyr(playerRef.current, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'pip',
        'fullscreen'
      ],
      settings: ['quality', 'speed'],
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
      }
    });

    // Fullscreen auto-landscape handlers
    const handleEnterFullscreen = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        } else if (screen.lockOrientation) {
          screen.lockOrientation("landscape");
        }
      } catch (error) {
        console.warn("Screen orientation lock failed:", error);
      }
    };

    const handleExitFullscreen = () => {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        } else if (screen.unlockOrientation) {
          screen.unlockOrientation();
        }
      } catch (error) {
        console.warn("Screen orientation unlock failed:", error);
      }
    };

    plyrInstance.current.on('enterfullscreen', handleEnterFullscreen);
    plyrInstance.current.on('exitfullscreen', handleExitFullscreen);

    return () => {
      if (plyrInstance.current) {
        plyrInstance.current.destroy();
        plyrInstance.current = null;
      }
    };
  }, [videoUrl, videoType]);

  const handleSkipOpening = () => {
    if (plyrInstance.current) {
      plyrInstance.current.currentTime = 90; // Seek to 1m 30s
      setSkipped(true);
    }
  };

  if (!videoUrl || videoType === "error") {
    return (
      <div className="aspect-video w-full bg-[#0a0b11] border border-[#1d2136] flex flex-col items-center justify-center rounded-xl p-6 text-center shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500/80 mb-4">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p className="text-[#eaeaf0] font-bold mb-2">Video Tidak Tersedia</p>
        <p className="text-xs text-[#8d93ad] max-w-sm">
          Playlist YouTube untuk anime ini tidak valid, telah dihapus, atau dikunci secara regional oleh pemilik aslinya.
        </p>
      </div>
    );
  }

  if (videoType === "youtube" || videoType === "embed") {
    const isYoutube = videoUrl.includes("youtube.com/embed/");
    const getYoutubeId = (url) => {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : url;
    };
    const videoId = isYoutube ? getYoutubeId(videoUrl) : videoUrl;

    return (
      <div className="w-full relative group">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative shadow-2xl border border-[#1d2136]">
          <div 
            ref={playerRef} 
            data-plyr-provider="youtube" 
            data-plyr-embed-id={videoId}
          />
          {!skipped && (
            <button
              onClick={handleSkipOpening}
              className="absolute bottom-12 right-4 sm:bottom-16 sm:right-6 bg-black/70 hover:bg-[#1d2136]/90 backdrop-blur-md border border-[#2d3250] text-[#eaeaf0] hover:text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer shadow-lg"
            >
              <FastForward size={14} className="text-[#a78bfa]" />
              Skip Opening
            </button>
          )}
        </div>
      </div>
    );
  }

  if (videoType === "direct") {
    return (
      <div className="w-full relative group">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative shadow-2xl border border-[#1d2136]">
          <video
            ref={playerRef}
            className="w-full h-full"
            src={videoUrl}
            playsInline
          >
            Browser kamu tidak mendukung video player.
          </video>
          {!skipped && (
            <button
              onClick={handleSkipOpening}
              className="absolute bottom-12 right-4 sm:bottom-16 sm:right-6 bg-black/70 hover:bg-[#1d2136]/90 backdrop-blur-md border border-[#2d3250] text-[#eaeaf0] hover:text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer shadow-lg"
            >
              <FastForward size={14} className="text-[#a78bfa]" />
              Skip Opening
            </button>
          )}
        </div>
      </div>
    );
  }

  // Persiapan roadmap masa depan untuk HLS
  if (videoType === "hls") {
    return (
      <div className="aspect-video w-full bg-zinc-900 flex items-center justify-center rounded-xl">
        <p className="text-gray-400">Player HLS belum diimplementasi di MVP ini.</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-zinc-900 flex items-center justify-center rounded-xl">
      <p className="text-gray-400">Format video tidak didukung.</p>
    </div>
  );
}

