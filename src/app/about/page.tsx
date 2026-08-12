import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { aboutStatement, clients, contact, services } from "@/content/about";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

/**
 * /about — who runs the studio, what it does, and how to reach it.
 *
 * Deliberately image-free: the page is carried entirely by type. Adding
 * photography here would be the obvious way to make it worse, and the work
 * itself is one click away on /stories.
 *
 * This used to be /studio, a six-panel tab strip listing eight invented
 * departments and a physical address. The studio does crew up — off a standing
 * roster, per project — but it has never had a switchboard. The tab strip went
 * with the panels: a switcher is worth its complexity at six sections and looks
 * like leftover scaffolding at two, so this is now a plain single column. The
 * `#contact` anchor is kept because the footer, the mobile menu and the header
 * CTA all link straight to it.
 */
export default function AboutPage() {
  return (
    <PageShell>
      <section>
        {/*
          `text-pretty` balances the rag; hyphenation is deliberately OFF.
          It was inherited from a much longer statement, and on this one it
          split "automotive" across a line at 56px — a broken word in display
          type is the single most amateur thing a studio page can do. Measured
          before removing it: the block is the same height either way, and the
          longest word sets to 387px in a 1393px column, so there is nothing
          for hyphenation to rescue.
        */}
        <Reveal immediate y={16}>
          <h1 className="text-display text-pretty">{aboutStatement}</h1>
        </Reveal>
      </section>

      {/*
        A definition list, not a run of <h3>s. The type scale has three steps —
        display, heading, and the 14px mono UI step — and no h3 between them, so
        a heading here would have set SMALLER than the prose it introduces.
        These are label/value pairs anyway: `dl` is the honest markup, and the
        quiet mono label against larger prose is the same relationship the old
        contact panel used.
      */}
      <section className="mt-24">
        {/* "Services", not "What I do" — the studio scales past one person, and
            a first-person heading over a crewed commercial reads wrong. */}
        <h2 className="text-heading mb-6">Services</h2>
        <dl className="border-t border-border">
          {services.map((service) => (
            <Reveal
              key={service.title}
              y={16}
              className="grid gap-2 border-b border-border py-6 md:grid-cols-3 md:gap-8"
            >
              <dt>{service.title}</dt>
              <dd className="text-prose text-muted-foreground md:col-span-2">
                {service.body}
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/*
        Sits between the services and the contact details on purpose: it is the
        evidence for the claims above it, and the last thing read before the
        decision to get in touch.

        A plain list, not a logo wall. Sourced logos would arrive at seven
        different weights and colours and would need policing every time one
        rebrands; set in the studio's own type they read as a credit list,
        which is the more confident version of the same information.
      */}
      <section className="mt-24">
        <h2 className="text-heading mb-6">Selected clients</h2>
        <Reveal
          as="ul"
          staggerChildren
          y={12}
          className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-border pt-6 md:grid-cols-3 lg:grid-cols-4"
        >
          {clients.map((client) => (
            <li key={client}>{client}</li>
          ))}
        </Reveal>
      </section>

      {/*
        `scroll-mt` clears the fixed header — without it a jump to #contact
        parks the heading underneath the nav bar.
      */}
      <section id="contact" className="mt-24 scroll-mt-32">
        <h2 className="text-heading mb-6">Contact</h2>
        <dl className="border-t border-border">
          <Reveal
            y={16}
            className="grid gap-2 border-b border-border py-6 md:grid-cols-3 md:gap-8"
          >
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="md:col-span-2">
              <a
                href={contact.phoneHref}
                className="w-fit underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                {contact.phone}
              </a>
            </dd>
          </Reveal>
          <Reveal
            y={16}
            className="grid gap-2 border-b border-border py-6 md:grid-cols-3 md:gap-8"
          >
            <dt className="text-muted-foreground">Email</dt>
            <dd className="md:col-span-2">
              <a
                href={`mailto:${contact.email}`}
                className="w-fit break-all underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                {contact.email}
              </a>
            </dd>
          </Reveal>
        </dl>
      </section>
    </PageShell>
  );
}
