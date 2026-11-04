"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useWedding } from "./wedding-context";

type Music = { playing: boolean; available: boolean; play: () => void; toggle: () => void };

const MusicContext = createContext<Music>({ playing: false, available: false, play: () => {}, toggle: () => {} });

export const useMusic = () => useContext(MusicContext);

/** Nhạc nền nằm ở layout nên vẫn phát khi chuyển sang trang trò chơi. */
export function MusicProvider({ children }: { children: ReactNode }) {
  const { music } = useWedding();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const available = !!music.src && !failed;

  const play = useCallback(() => {
    audio.current?.play().catch(() => setPlaying(false));
  }, []);

  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  return (
    <MusicContext.Provider value={{ playing, available, play, toggle }}>
      <audio
        ref={audio}
        src={music.src || undefined}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {children}
    </MusicContext.Provider>
  );
}
