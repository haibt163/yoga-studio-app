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
    /* FIX 1: z-[9999] ensures it beats all modals and headers.
      FIX 2: pointer-events-none ensures the invisible div doesn't block page clicks. 
    */
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] pointer-events-none flex flex-col items-center">
      
      {/* FIX 3: Removed 'hidden'. Using absolute, 0 size, and opacity-0 ensures 
        the YouTube API still executes perfectly in the background on all browsers. 
      */}
      <iframe
        ref={iframeRef}
        src="https://www.youtube.com/embed/A-MQOHpdorQ?enablejsapi=1&loop=1&playlist=A-MQOHpdorQ"
        allow="autoplay"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Floating Lotus Button */}
      <button 
        onClick={toggleMusic} 
        /* pointer-events-auto makes just the button clickable */
        className={`pointer-events-auto w-14 h-14 bg-white/90 backdrop-blur-md border border-rose-100 shadow-xl rounded-full flex items-center justify-center text-rose-700 hover:bg-rose-50 transition-all duration-500 ease-in-out hover:-translate-y-1 ${isPlaying ? 'shadow-rose-200/50' : 'opacity-60 grayscale-[30%]'}`}
        aria-label="Toggle Background Music"
      >
        {/* Beautiful Minimalist Lotus SVG with continuous slow spin when playing */}
        <svg 
          viewBox="0 0 512 512" 
          fill="currentColor" 
          className={`w-8 h-8 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'transition-transform duration-700 ease-out'}`}
        >
          <path d="M256,448c-9.1,0-18.1-1.2-26.7-3.6c-48.4-13.4-85.3-80.9-85.3-155.6c0-11,8.9-19.9,19.9-19.9s19.9,8.9,19.9,19.9
            c0,48.2,23.3,96.3,55.4,111c11.1,5.1,23.3,5.1,34.4,0c32.1-14.7,55.4-62.8,55.4-111c0-11,8.9-19.9,19.9-19.9s19.9,8.9,19.9,19.9
            c0,74.7-36.9,142.2-85.3,155.6C274.1,446.8,265.1,448,256,448z"/>
          <path d="M256,364.5c-39.7,0-72.1-70.3-72.1-156.4S216.3,51.8,256,51.8s72.1,70.3,72.1,156.4S295.7,364.5,256,364.5z 
            M256,91.6c-18.4,0-32.3,50.1-32.3,116.5s13.9,116.5,32.3,116.5s32.3-50.1,32.3-116.5S274.4,91.6,256,91.6z"/>
          <path d="M129.1,402.1c-43.2,0-78.5-62.2-78.5-138.4s35.3-138.4,78.5-138.4s78.5,62.2,78.5,138.4S172.4,402.1,129.1,402.1z
            M129.1,165.1c-22.1,0-38.6,44.3-38.6,98.6s16.5,98.6,38.6,98.6s38.6-44.3,38.6-98.6S151.3,165.1,129.1,165.1z"/>
          <path d="M382.9,402.1c-43.2,0-78.5-62.2-78.5-138.4s35.3-138.4,78.5-138.4s78.5,62.2,78.5,138.4S426.1,402.1,382.9,402.1z
            M382.9,165.1c-22.1,0-38.6,44.3-38.6,98.6s16.5,98.6,38.6,98.6s38.6-44.3,38.6-98.6S405.1,165.1,382.9,165.1z"/>
        </svg>
      </button>
    </div>
  );
}