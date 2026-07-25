import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { VideoProvider } from "@/components/media/video-provider";
import { FullscreenPlayer } from "@/components/media/fullscreen-player";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * TYPEFACE SUBSTITUTION — read before changing.
 *
 * The intended pairing is a Neue Montreal-class neo-grotesque for display and
 * a neutral coding mono for UI. Those are licensed faces, so this build ships
 * the closest freely-redistributable stand-ins: Inter Tight and JetBrains Mono.
 *
 * To swap in licensed faces, replace these two loaders with `next/font/local`
 * declarations pointing at the woff2 files and keep the SAME CSS variable
 * names — nothing else in the codebase names a font family directly.
 */
const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-ui-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1c1c1c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        {/*
          Provider order is load-bearing: VideoProvider sits OUTSIDE
          LenisProvider because the fullscreen player stops Lenis when it opens
          and therefore needs both contexts in scope.
        */}
        <VideoProvider>
          <LenisProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-player)] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <SiteHeader />
            {children}
            <FullscreenPlayer />
          </LenisProvider>
        </VideoProvider>
      </body>
    </html>
  );
}
