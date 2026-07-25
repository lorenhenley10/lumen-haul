import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="container grid min-h-dvh place-items-center pt-top-section pb-16"
    >
      <div className="flex flex-col items-center gap-8 text-center">
        <p className="text-caption text-muted-foreground">[404]</p>
        <h1 className="text-display">
          <span className="font-medium">Nothing here</span>
          <br />
          <span className="font-light">This reel has ended</span>
        </h1>
        <Link
          href="/"
          className="rounded-full bg-white/10 px-6 py-3 text-caption uppercase backdrop-blur-lg transition-colors hover:bg-white/20"
        >
          Back to start
        </Link>
      </div>
    </main>
  );
}
