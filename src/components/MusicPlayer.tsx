'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-play on the user's first interaction with the website
  useEffect(() => {
    const handleFirstClick = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setIsPlaying(true);
        // Command YouTube iframe to play
        iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    };

    window.addEventListener('click', handleFirstClick, { once: true });
    return () => window.removeEventListener('click', handleFirstClick);
  }, [hasInteracted]);

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering the global click listener
    if (isPlaying) {
      iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } else {
      iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] pointer-events-none flex flex-col items-center">
      
      {/* Hidden YouTube Iframe */}
      <iframe
        ref={iframeRef}
        src="https://www.youtube.com/embed/A-MQOHpdorQ?enablejsapi=1&loop=1&playlist=A-MQOHpdorQ"
        allow="autoplay"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Floating Real-Photo Button */}
      <button 
        onClick={toggleMusic} 
        /* Slightly larger button (w-16 h-16) so the beautiful real photo is clear */
        className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out hover:-translate-y-1 shadow-2xl ${isPlaying ? 'shadow-rose-300/60 scale-105' : 'opacity-70 grayscale-[20%] scale-100'}`}
        aria-label="Toggle Background Music"
      >
        {/* This wraps your real photo in a circular frame. 
          When playing, it spins very slowly like a record player. 
        */}
        <div className={`w-full h-full rounded-full overflow-hidden border-[3px] bg-white ${isPlaying ? 'border-rose-200' : 'border-stone-200'} transition-colors duration-500`}>
          <img 
            src="/lotus.jpg" 
            alt="Music Player Lotus" 
            className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : 'transition-transform duration-700'}`}
          />
        </div>
      </button>
    </div>
  );
}