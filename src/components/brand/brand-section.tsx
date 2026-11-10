import type { ReactNode } from 'react';

import { GRID, SPAN, SUBGRID } from '../layout/grid';
import { GridRule } from '../layout/grid-page';
import { paragraphText } from './brand-config';
import type { Paragraph, SectionMeta } from './brand-config';

/**
 * Every description on the page, set one way: the page's own, each
 * section's, and a subsection's note. Body size, muted, at the width for
 * text, so none reads as more or less important than another.
 */
export const DESCRIPTION = `${SPAN[8]} text-pretty text-graphite-500`;

/**
 * A paragraph's words, its links set as the app sets a link in running
 * text. A link leaves the site, so it opens in a new tab, and says so to a
 * screen reader, as the eye sees no sign of it.
 */
export function ParagraphContent({
  paragraph,
}: {
  paragraph: Paragraph;
}): ReactNode {
  if (typeof paragraph === 'string') {
    return paragraph;
  }
  return paragraph.map((part) =>
    typeof part === 'string' ? (
      part
    ) : (
      <a
        key={part.href}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm text-graphite-900 underline decoration-graphite-500 underline-offset-[0.2em] outline-offset-2 outline-graphite-900 hover:decoration-graphite-900 focus-visible:outline-2"
      >
        {part.text}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ),
  );
}

/** A description's paragraphs, each its own `<p>`, in order. */
export function Paragraphs({
  paragraphs,
}: {
  paragraphs: readonly Paragraph[];
}): ReactNode {
  return paragraphs.map((paragraph) => (
    <p key={paragraphText(paragraph)}>
      <ParagraphContent paragraph={paragraph} />
    </p>
  ));
}

export interface BrandSectionProps {
  section: SectionMeta;
  lead?: readonly Paragraph[] | undefined;
  /** More of the description, after the lead: paragraphs and lists. */
  description?: ReactNode;
  children?: ReactNode;
}

/**
 * One section of the brand page, on the page's 12 columns: its rule, its
 * heading, from `SECTIONS`, so the contents and the heading cannot
 * disagree, its description under it, then its subsections, 40px apart.
 * Sections sit 128px apart, their rule halfway: the page's three steps of
 * space are a section, a subsection, and the 12px between tiles.
 */
export function BrandSection({
  section,
  lead,
  description,
  children,
}: BrandSectionProps): ReactNode {
  const titleId = `${section.id}-title`;
  return (
    // A jump lands on the rule, the heading 64px under it: at the top of the
    // window, or under the contents bar that is sticky at the top, below xl
    // and for a touch reader up to the rail's 1480px.
    <section
      id={section.id}
      aria-labelledby={titleId}
      className="relative mt-16 scroll-mt-14 xl:scroll-mt-0 xl:max-[92.5rem]:pointer-coarse:scroll-mt-14"
    >
      <GridRule />
      <div className={`${GRID} pt-16`}>
        <h2
          id={titleId}
          className="col-span-full text-2xl font-medium tracking-tight"
        >
          {section.title}
        </h2>
        {lead === undefined && description === undefined ? null : (
          <div className={`${DESCRIPTION} mt-3 flex flex-col gap-3`}>
            {lead === undefined ? null : <Paragraphs paragraphs={lead} />}
            {description}
          </div>
        )}
        {children === undefined ? null : (
          <div className={`${SUBGRID} mt-10 gap-y-10`}>{children}</div>
        )}
      </div>
    </section>
  );
}

/**
 * A subsection: its heading, then what it heads, on the page's columns. The
 * page's titles step down 36, 24, 20: the page's, a section's, and this,
 * each in sentence case and in full ink.
 */
export function Subsection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={SUBGRID}>
      <h3 className="col-span-full mb-3 text-xl font-medium">{label}</h3>
      {children}
    </div>
  );
}
