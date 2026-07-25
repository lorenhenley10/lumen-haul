import type { Metadata } from "next";
import { ProjectCard } from "@/components/stories/project-card";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Stories",
  description: "Films and photography from Lumen Haul.",
};

export default function StoriesPage() {
  return (
    <PageShell>
      <h1 className="sr-only">Stories</h1>
      <section className="grid grid-cols-1 gap-x-4 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          // Cards reveal in place as the grid scrolls; the stagger comes from
          // each card crossing its own trigger point, not from an index delay,
          // so a resized grid never animates out of order.
          <Reveal key={project.slug} y={32}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </section>
    </PageShell>
  );
}
