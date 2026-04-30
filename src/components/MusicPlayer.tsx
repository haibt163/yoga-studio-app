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
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-center">
      {/* Hidden YouTube Iframe */}
      <iframe
        ref={iframeRef}
        width="0"
        height="0"
        // enablejsapi=1 allows us to control it via code. playlist allows looping.
        src="https://www.youtube.com/embed/A-MQOHpdorQ?enablejsapi=1&loop=1&playlist=A-MQOHpdorQ"
        allow="autoplay"
        className="hidden"
      />

      {/* Floating Lotus Button */}
      <button 
        onClick={toggleMusic} 
        className={`w-12 h-12 bg-white/80 backdrop-blur-md border border-rose-100 shadow-lg rounded-full flex items-center justify-center text-rose-700 hover:bg-rose-50 transition-all ${isPlaying ? 'shadow-rose-200/50' : 'opacity-70'}`}
        aria-label="Toggle Background Music"
      >
        {/* Beautiful Minimalist Lotus SVG */}
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={`w-6 h-6 transition-transform duration-[3000ms] ease-linear ${isPlaying ? 'rotate-[360deg]' : ''}`}
        >
          <path d="M12,22C12,22 12,16 16,12C20,8 22,12 22,12C22,12 18,14 12,22ZM12,22C12,22 12,16 8,12C4,8 2,12 2,12C2,12 6,14 12,22ZM12,22C12,22 8,10 12,2C16,10 12,22 12,22Z" opacity="0.8"/>
        </svg>
      </button>
    </div>
  );
}