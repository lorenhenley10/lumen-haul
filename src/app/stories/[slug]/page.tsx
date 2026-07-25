import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectHero } from "@/components/stories/project-hero";
import { DragGallery } from "@/components/stories/drag-gallery";
import { SplitText } from "@/components/motion/split-text";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/layout/site-footer";
import { getNextProject, getProject, projects } from "@/content/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: `${project.client} — ${project.title}`,
    description: project.summary,
    openGraph: {
      title: `${project.client} — ${project.title}`,
      description: project.summary,
      images: [{ url: project.film.poster }],
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(slug);

  return (
    <>
      <main id="main" className="relative">
        <ProjectHero project={project} />

        {/* Everything below scrolls up over the sticky hero. The gradient is
            what stops that edge from reading as a hard seam, and the opaque
            background below it is what keeps the fixed footer covered until
            the page has actually scrolled off it. */}
        <div className="relative z-[var(--z-content)]">
          <div className="h-96 bg-linear-to-b from-transparent to-background" />

          <div className="bg-background">
            <section className="grid place-items-center py-32">
              <SplitText
                as="h2"
                text="(Behind the Scenes)"
                by="char"
                className="text-heading text-center"
              />
            </section>

            {/* Not every project has a stills set yet. An empty drag canvas
                would read as a broken viewport, so the section is skipped
                entirely rather than rendered empty. */}
            {project.gallery.length > 0 && (
              <DragGallery stills={project.gallery} />
            )}

            <section className="container py-32">
              {project.credits.length > 0 && (
                <>
                  <Reveal>
                    <h2 className="text-heading">Credits</h2>
                  </Reveal>
                  <Reveal staggerChildren className="mt-8">
                    {project.credits.map((credit) => (
                      <div
                        key={`${credit.role}-${credit.name}`}
                        className="grid border-b border-border py-4 last:border-b-0 md:grid-cols-2"
                      >
                        <p className="text-muted-foreground">{credit.role}</p>
                        <p>{credit.name}</p>
                      </div>
                    ))}
                  </Reveal>
                </>
              )}
              <p className="mt-8 text-caption text-muted-foreground">
                {project.year}
              </p>
            </section>

            <section className="container pb-32">
              <Link
                href={`/stories/${next.slug}`}
                className="group block rounded-[var(--radius)] border border-border p-8 transition-colors hover:bg-white/5"
              >
                <p className="text-caption text-muted-foreground">Next story</p>
                <p className="mt-4 text-display">
                  <span className="font-medium">{next.client}</span>{" "}
                  <span className="font-light">{next.title}</span>
                </p>
              </Link>
            </section>
          </div>
        </div>
      </main>

      <div aria-hidden className="h-[70vh] max-lg:hidden" />
      <SiteFooter />
    </>
  );
}

export const dynamicParams = false;
