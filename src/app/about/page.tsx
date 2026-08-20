import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import {
  aboutLead,
  aboutSupport,
  clients,
  contact,
  services,
} from "@/content/about";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

/**
 * /about — who runs the studio, what it does, and how to reach it.
 *
 * Deliberately image-free: the page is carried entirely by type, and the work
 * itself is one click away on /stories.
 *
 * ## Measure is the whole design here
 *
 * The page reads as a wall or it reads as a document, and the difference is
 * column width rather than any decoration. Every block below is held to a
 * measure, because the version this replaced held none:
 *
 *  - the statement set five lines of roughly NINETY characters at 56px, which
 *    is past twice a readable line,
 *  - each service description ran a 930px column of justified uppercase mono,
 *    around 115 characters, which is genuinely hard to read rather than merely
 *    wide,
 *  - and everything sat in one full-bleed column, so nothing had a shape.
 *
 * So: a twelve-column grid on md+, a display claim against a reading column
 * beside it, and no line of body copy wider than the column it was set for.
 * The page's own width is not a licence to use all of it.
 *
 * ## History
 *
 * This used to be /studio, a six-panel tab strip listing eight invented
 * departments and a physical address. The studio does crew up — off a standing
 * roster, per project — but it has never had a switchboard. The tab strip went
 * with the panels: a switcher is worth its complexity at six sections and looks
 * like leftover scaffolding at two. The `#contact` anchor is kept because the
 * footer, the mobile menu and the header CTA all link straight to it.
 */
export default function AboutPage() {
  return (
    <PageShell>
      {/*
        The claim and the qualification, side by side rather than stacked into
        one paragraph. `self-end` sits the reading column on the last line of
        the display block, so the two are related by a shared baseline instead
        of by a gap.
      */}
      <section className="grid gap-y-8 md:grid-cols-12 md:gap-x-4">
        <Reveal immediate y={16} className="md:col-span-7">
          {/*
            `text-pretty` balances the rag; hyphenation is deliberately OFF.
            It was inherited from a much longer statement, and on this one it
            split "automotive" across a line at 56px — a broken word in display
            type is the single most amateur thing a studio page can do.
          */}
          <h1 className="text-display text-pretty">{aboutLead}</h1>
        </Reveal>

        <Reveal
          immediate
          y={16}
          delay={0.08}
          className="md:col-span-4 md:col-start-9 md:self-end"
        >
          {/*
            `text-left` overrides the prose step's justification. Justified
            monospace needs a wide measure to work: every glyph is the same
            width, so word spacing is the only elastic in the line, and in a
            column this narrow it opens rivers. The step's size, leading and
            tracking are what is wanted here — the alignment is not.
          */}
          <p className="text-prose text-left text-muted-foreground">
            {aboutSupport}
          </p>
        </Reveal>
      </section>

      {/*
        A definition list, not a run of <h3>s. The type scale has three steps —
        display, heading, and the 14px mono UI step — and no h3 between them, so
        a heading here would have set SMALLER than the prose it introduces.
        These are label/value pairs anyway: `dl` is the honest markup.
      */}
      <section className="mt-32">
        {/* "Services", not "What I do" — the studio scales past one person, and
            a first-person heading over a crewed commercial reads wrong. */}
        <h2 className="text-heading">Services</h2>
        <dl className="mt-8 border-t border-border">
          {services.map((service) => (
            <Reveal
              key={service.title}
              y={16}
              className="grid gap-2 border-b border-border py-8 md:grid-cols-12 md:gap-x-4"
            >
              <dt className="md:col-span-3">{service.title}</dt>
              {/* Ends at column 11. The empty twelfth is what holds the
                  measure to something readable rather than letting the text
                  run the full width of the page. */}
              <dd className="text-prose text-left text-muted-foreground md:col-span-6 md:col-start-5">
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

        Names FLOW AND WRAP rather than sitting in a four-column grid. A grid
        of ten names in 14px mono reads as a table of contents; the same names
        at the heading step, wrapping like a sentence, read as a client list —
        and the ragged last line is what makes it look like a real one.
      */}
      <section className="mt-32">
        <h2 className="text-heading">Selected clients</h2>
        <Reveal
          as="ul"
          staggerChildren
          y={12}
          className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-8"
        >
          {clients.map((client) => (
            <li key={client} className="text-heading">
              {client}
            </li>
          ))}
        </Reveal>
      </section>

      {/*
        The page ends on the two things a visitor came for, at a size that says
        so. They were 14px rows in a table before, which is where contact
        details go to be ignored.

        `scroll-mt` clears the fixed header — without it a jump to #contact
        parks the heading underneath the nav bar.
      */}
      <section id="contact" className="mt-32 scroll-mt-32">
        <h2 className="text-heading">Contact</h2>
        <dl className="mt-8 grid gap-y-10 border-t border-border pt-8 md:grid-cols-2 md:gap-x-4">
          <div>
            <dt className="text-caption text-muted-foreground">Phone</dt>
            <dd className="mt-3">
              <a
                href={contact.phoneHref}
                className="text-heading w-fit transition-opacity hover:opacity-60"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Email</dt>
            <dd className="mt-3">
              <a
                href={`mailto:${contact.email}`}
                className="text-heading w-fit break-words transition-opacity hover:opacity-60"
              >
                {contact.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </PageShell>
  );
}
