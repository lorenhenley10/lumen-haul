/**
 * Media & content types.
 *
 * RULE: no component may contain a literal media path. Every video, poster and
 * still is declared here and referenced by id, so swapping placeholder files
 * for final masters is a one-file change and never a hunt through JSX.
 */

export type AspectRatio = "16/9" | "3/4" | "1/1" | "9/16";

export interface VideoSource {
  /** Path under /public, or an absolute CDN URL. */
  src: string;
  type: "video/mp4" | "video/webm";
}

export interface VideoAsset {
  kind: "video";
  /** Stable id — also the cache key for the playback registry. */
  id: string;
  /** Ordered by preference; the browser picks the first it can play. */
  sources: VideoSource[];
  /**
   * Lighter / reframed encode for small screens. When absent, `sources` is
   * used at every width.
   */
  mobileSources?: VideoSource[];
  /**
   * REQUIRED. The poster is the layout's load-bearing frame: it holds the box
   * before playback, covers the first-frame flash, and is the entire visual
   * under reduced-motion and save-data. Never ship a video without one.
   */
  poster: string;
  aspect: AspectRatio;
  /** Seconds. Lets progress UI render correctly before metadata arrives. */
  duration?: number;
  alt: string;
  /**
   * True while this points at a stand-in file. Renders a visible dev-only
   * badge so placeholder media can never silently reach production.
   */
  placeholder?: boolean;
}

export interface ImageAsset {
  kind: "image";
  id: string;
  src: string;
  alt: string;
  aspect: AspectRatio;
  width: number;
  height: number;
  placeholder?: boolean;
}

export type MediaAsset = VideoAsset | ImageAsset;

export interface Credit {
  role: string;
  name: string;
}

export interface Project {
  slug: string;
  /** Brand or client. Rendered in the medium weight. */
  client: string;
  /** Campaign or film name. Rendered in the light weight. */
  title: string;
  /** Order on /stories and in the home reel. 1-based. */
  index: number;
  /** Appears in the home reel when true. */
  featured: boolean;
  /** Sentence or two, shown on the project page hero. */
  summary: string;
  /** The hero film — opens in the fullscreen player. */
  film: VideoAsset;
  /** Muted loop used for the card and reel backgrounds. */
  loop: VideoAsset;
  /** Behind-the-scenes stills for the drag gallery. */
  gallery: ImageAsset[];
  credits: Credit[];
  year: number;
}

export interface Creator {
  slug: string;
  name: string;
  role: string;
  /** Full-bleed media revealed behind the index on hover. */
  backdrop: MediaAsset;
  /** Small circular portrait beside the name. */
  portrait: ImageAsset;
  bio: string;
}

/** One line of the /about services list. */
export interface Service {
  title: string;
  body: string;
}
