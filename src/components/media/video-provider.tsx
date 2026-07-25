"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "@/content/types";

interface VideoContextValue {
  /** Site-wide audio state, toggled from the header. Starts muted — always. */
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;

  /** The project currently open in the fullscreen player, if any. */
  activeFilm: Project | null;
  openFilm: (project: Project) => void;
  closeFilm: () => void;
}

const VideoContext = createContext<VideoContextValue | null>(null);

export function useVideo(): VideoContextValue {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error("useVideo must be used inside <VideoProvider>");
  return ctx;
}

/**
 * Global media state.
 *
 * Two things are genuinely app-wide and must not be duplicated per component:
 *
 *  1. MUTE. Browsers only autoplay muted video, so every ambient loop on the
 *     site is silent by default. The header's speaker toggle flips one flag
 *     that every player reads — there is no per-video mute button.
 *
 *  2. THE FULLSCREEN FILM. Only one film can be open at a time, and opening it
 *     must pause ambient playback behind it. Holding the open project here
 *     means any card, reel item or CTA can open the player without prop
 *     drilling a callback through the page.
 */
export function VideoProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(true);
  const [activeFilm, setActiveFilm] = useState<Project | null>(null);

  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  const openFilm = useCallback((project: Project) => {
    setActiveFilm(project);
  }, []);

  const closeFilm = useCallback(() => {
    setActiveFilm(null);
    // Leaving the player re-mutes the site so ambient loops don't suddenly
    // start speaking over the page the user returns to.
    setMuted(true);
  }, []);

  const value = useMemo(
    () => ({ muted, toggleMuted, setMuted, activeFilm, openFilm, closeFilm }),
    [muted, toggleMuted, activeFilm, openFilm, closeFilm],
  );

  return (
    <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
  );
}
