import type { ReactNode } from 'react';

import type {
  BrandConfig,
  SectionMeta,
  Typeface,
  TypeStep,
} from './brand-config';
import { SPAN, SUBGRID } from '../layout/grid';
import { BrandSection, Subsection } from './brand-section';

/** The scale's Label step: the row names are set in it. */
const LABEL = 'font-mono text-xs tracking-[0.18em] indent-[0.18em] uppercase';

export interface TypographySectionProps {
  config: BrandConfig;
  section: SectionMeta;
}

/** A typeface, set in itself: its name, a large "Aa", each weight it is set in. */
function FaceCard({ face }: { face: Typeface }): ReactNode {
  return (
    // Four columns of the twelve: the three typefaces in one row.
    <li className={`${SPAN[4]} panel p-6`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className={`font-medium ${face.className}`}>{face.name}</p>
        <p className="text-sm text-graphite-500">{face.role}</p>
      </div>
      <p aria-hidden className={`mt-6 text-5xl leading-none ${face.className}`}>
        Aa
      </p>
      <ul className={`mt-6 flex list-none flex-wrap gap-x-4 ${face.className}`}>
        {face.weights.map((weight) => (
          // Each weight printed at itself: the number is the specimen.
          <li key={weight} style={{ fontWeight: weight }}>
            {weight}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-xs/relaxed break-words text-graphite-500">
        {face.stack}
      </p>
    </li>
  );
}

/**
 * A step of the scale, as Lanterna's brand page sets one: its name, as a
 * label, in two cells, and beside it a line set in the step.
 */
function ScaleRow({ step }: { step: TypeStep }): ReactNode {
  return (
    <li
      className={`${SUBGRID} items-start gap-y-3 border-t border-graphite-100 py-7 first:border-t-0`}
    >
      <p
        className={`${LABEL} col-span-full whitespace-nowrap text-graphite-500 md:col-span-2`}
      >
        {step.name}
      </p>
      <p
        className={`col-span-full min-w-0 break-words md:col-span-10 ${step.className}`}
      >
        {step.sample}
      </p>
    </li>
  );
}

/** The typefaces, then the scale the app sets text in. */
export function TypographySection({
  config,
  section,
}: TypographySectionProps): ReactNode {
  const typography = config.typography;
  if (typography === undefined) {
    return null;
  }
  return (
    <BrandSection section={section} lead={typography.lead}>
      {typography.faces.length === 0 ? null : (
        <Subsection label="Typefaces">
          <ul className={`${SUBGRID} list-none gap-y-3`}>
            {typography.faces.map((face) => (
              <FaceCard key={face.name} face={face} />
            ))}
          </ul>
        </Subsection>
      )}
      {typography.scale.length === 0 ? null : (
        <Subsection label="Type scale">
          <ul className={`${SUBGRID} panel list-none px-6`}>
            {typography.scale.map((step) => (
              <ScaleRow key={step.name} step={step} />
            ))}
          </ul>
        </Subsection>
      )}
    </BrandSection>
  );
}
