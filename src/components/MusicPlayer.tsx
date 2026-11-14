'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

const MUSIC_KEY = 'yoga_music_enabled';
const MUSIC_EVENT = 'yoga-music-change';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(MUSIC_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(MUSIC_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(MUSIC_KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export default function MusicPlayer() {
  const t = useTranslations('Music');
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleMusic() {
    const next = !enabled;

    try {
      window.sessionStorage.setItem(MUSIC_KEY, String(next));
    } catch {
      return;
    }

    window.dispatchEvent(new Event(MUSIC_EVENT));
  }

  return (
    <div className="relative inline-flex">
      {enabled && (
        <iframe
          src="https://www.youtube.com/embed/A-MQOHpdorQ?enablejsapi=1&loop=1&playlist=A-MQOHpdorQ&autoplay=1"
          title={t('label')}
          allow="autoplay"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}

      <button
        type="button"
        onClick={toggleMusic}
        aria-pressed={enabled}
        aria-label={enabled ? t('on') : t('off')}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur transition-colors hover:border-rose-300"
      >
        <Image
          src="/lotus.jpg"
          alt=""
          width={36}
          height={36}
          className={`h-9 w-9 rounded-full object-cover ${
            enabled ? 'animate-[spin_10s_linear_infinite]' : ''
          }`}
        />
        <span className="pr-1 text-xs font-semibold uppercase tracking-widest text-stone-700">
          {enabled ? t('on') : t('off')}
        </span>
      </button>
    </div>
  );
}
