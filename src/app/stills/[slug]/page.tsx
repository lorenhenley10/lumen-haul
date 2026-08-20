import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { StillsBanner } from "@/components/stills/stills-banner";
import { StillsGallery } from "@/components/stills/stills-gallery";
import {
  getNextStillsProject,
  getStillsProject,
  stillsProjects,
} from "@/content/stills";

export function generateStaticParams() {
  return stillsProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getStillsProject(slug);
  if (!project) return {};

  return {
    title: `${project.client} — ${project.title}`,
    description: project.description,
    openGraph: {
      title: `${project.client} — ${project.title}`,
      description: project.description,
      images: [{ url: project.hero.src }],
    },
  };
}

/**
 * One photography set.
 *
 * `padded={false}` because the banner is full-bleed and starts at the top of
 * the page, under the floating header. PageShell is still doing its real job —
 * the opaque background and the scroll room the fixed reveal footer needs —
 * which is why this is not a hand-rolled <main>.
 */
export default async function StillsProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getStillsProject(slug);
  if (!project) notFound();

  const next = getNextStillsProject(slug);
  const frames = project.images.length;

  return (
    <PageShell padded={false}>
      <StillsBanner image={project.hero} />

      <div className="container">
        <Reveal as="header" y={24} className="pt-16 md:pt-24">
          {/* The title runs at container width and the copy under it does not.
              Boxing both into one reading column wrapped a 56px display face
              at three lines with half the page empty beside it — the caption
              needs the narrow measure, the name does not. */}
          <h1 className="text-display">
            <span className="font-medium">{project.client}</span>
            <br />
            <span className="font-light tracking-tight">{project.title}</span>
          </h1>

          <p className="mt-8 max-w-prose text-pretty text-muted-foreground">
            {project.description}
          </p>

          <p className="mt-6 text-caption text-muted-foreground">
            {project.year} — {frames} {frames === 1 ? "frame" : "frames"}
          </p>
        </Reveal>

        {/* The sheet gets the page's standing section gap above it: the intro
            is a caption for the banner, and the frames are a new movement. */}
        <div className="pt-16 pb-16 md:pt-24">
          <StillsGallery
            images={project.images}
            label={`${project.client} — ${project.title}`}
          />
        </div>

        <section className="pb-16">
          <Link
            href={`/stills/${next.slug}`}
            className="group block rounded-[var(--radius)] border border-border p-8 transition-colors hover:bg-white/5"
          >
            <p className="text-caption text-muted-foreground">Next set</p>
            <p className="mt-4 text-display">
              <span className="font-medium">{next.client}</span>{" "}
              <span className="font-light">{next.title}</span>
            </p>
          </Link>
        </section>
      </div>
    </PageShell>
  );
}

export const dynamicParams = false;
