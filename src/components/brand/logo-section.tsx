import type { ReactNode } from 'react';

import { SPAN, SUBGRID } from '../layout/grid';
import { AssetCard, CardCaption } from './asset-card';
import type {
  BrandConfig,
  ClearSpaceDiagram,
  ConstructionDiagram,
  LogoPoint,
  LogoSection as LogoSectionConfig,
  SectionMeta,
} from './brand-config';
import { BrandSection, Subsection } from './brand-section';
import { PlayWhenSeen } from './play-when-seen';

/**
 * The logo's diagrams' one look, so the construction and the clear space
 * cannot drift apart: red, the drafting convention for a rule drawn over a
 * picture; hairlines, one device pixel where the screen has two to a CSS
 * pixel and 1px where it has one, as nothing finer can be drawn there; and
 * a faint red fill for an area.
 */
const HAIRLINE_WIDTH =
  '[--hairline:1px] [@media(min-resolution:2dppx)]:[--hairline:0.5px]';
const DIAGRAM = `block h-auto w-full text-red-500 ${HAIRLINE_WIDTH}`;
const HAIRLINE = 'stroke-current stroke-(length:--hairline)';
const AREA = 'fill-current/8';

export interface LogoSectionProps {
  config: BrandConfig;
  section: SectionMeta;
  filesBase: string;
}

/**
 * The clear space, drawn from the logo's own measures: information, not a
 * file to download. In red, the drafting convention for a rule drawn over
 * a picture, drawn as the construction is. The card is the clear space
 * itself, framed in a hairline; inside, the logo's outermost edges carried
 * out to the frame, and a copy of the shape that sets the clear space in
 * each corner, filled faint.
 */
function ClearSpace({
  clearSpace,
}: {
  clearSpace: NonNullable<LogoSectionConfig['clearSpace']>;
}): ReactNode {
  const { name, rule, alt, diagram } = clearSpace;
  return (
    // As wide as a lockup above it, so the two share their edges.
    <figure className={SPAN[4]}>
      {/* Captioned as a lockup is: what it shows, then its rule. */}
      <CardCaption title={name}>
        {rule.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </CardCaption>
      {/* The card is the clear space: its frame is the clear space's edge, solid red. */}
      <div className="border border-red-500 bg-graphite-0 [@media(min-resolution:2dppx)]:border-[0.5px]">
        <Diagram diagram={diagram} alt={alt} />
      </div>
    </figure>
  );
}

type Measure = ConstructionDiagram['measures'][number];

/** A measure's end ticks: 4px each way across its line. */
const TICK = 4;

/**
 * Where a measure's line stands from the frame line it measures off: 10px
 * clear of it, stroke face to stroke face, so its center is 10px and a
 * hairline from the frame line's center.
 */
const LINE_OFFSET = {
  above: 'translateY(calc(-10px - var(--hairline)))',
  below: 'translateY(calc(10px + var(--hairline)))',
  left: 'translateX(calc(-10px - var(--hairline)))',
} as const;

/**
 * Where its label stands from the line's center: 10px clear of the line,
 * measured to the figures. Inter's figures stand 0.737em tall on the
 * baseline, and the last one carries 0.06em empty after it.
 */
const LABEL_OFFSET = {
  above: 'translateY(calc(-10px - var(--hairline) / 2))',
  below: 'translateY(calc(10px + var(--hairline) / 2 + 0.737em))',
  left: 'translate(calc(-10px - var(--hairline) / 2 + 0.06em), 0.3685em)',
} as const;

/**
 * A measure in page pixels at any width: a viewport laid over the span it
 * measures, placed as a share of the view so its ends fall on the frame's
 * lines, with pixels for units. Its line and ticks are strokes, as the
 * frame's are, so the two draw alike and their ends meet.
 */
function MeasureMark({
  measure,
  view,
  hasLine = true,
}: {
  measure: Measure;
  view: ConstructionDiagram['view'];
  /** Without it, the label alone, where the measure would set it. */
  hasLine?: boolean;
}): ReactNode {
  const { text, from, to, edge, side } = measure;
  const across = (value: number) => ((value - view.x) / view.width) * 100;
  const down = (value: number) => ((value - view.y) / view.height) * 100;
  if (side === 'left') {
    return (
      <svg
        x={`${across(edge)}%`}
        y={`${down(from)}%`}
        width={1}
        height={`${down(to) - down(from)}%`}
        overflow="visible"
      >
        <g style={{ transform: LINE_OFFSET[side] }}>
          <g className={HAIRLINE}>
            <line y2="100%" />
            <line x1={-TICK} x2={TICK} />
            <line x1={-TICK} x2={TICK} y1="100%" y2="100%" />
          </g>
          <text
            y="50%"
            textAnchor="end"
            className="fill-current"
            style={{ transform: LABEL_OFFSET[side] }}
          >
            {text}
          </text>
        </g>
      </svg>
    );
  }
  return (
    <svg
      x={`${across(from)}%`}
      y={`${down(edge)}%`}
      width={`${across(to) - across(from)}%`}
      height={1}
      overflow="visible"
    >
      <g style={{ transform: LINE_OFFSET[side] }}>
        {hasLine ? (
          <g className={HAIRLINE}>
            <line x2="100%" />
            <line y1={-TICK} y2={TICK} />
            <line x1="100%" x2="100%" y1={-TICK} y2={TICK} />
          </g>
        ) : null}
        <text
          x="50%"
          textAnchor="middle"
          className="fill-current"
          style={{ transform: LABEL_OFFSET[side] }}
        >
          {text}
        </text>
      </g>
    </svg>
  );
}

/**
 * How the logo is built, from its grid: the cells in faint red, their
 * edges run the grid's length in red hairlines, the logo over them in its
 * color, its corners' circles and radii on it, its shapes reaching past their cells as they are
 * drawn to, and the grid's measures, each a dimension line and its label,
 * in red, the drafting convention for a rule drawn over a picture.
 */
function Construction({
  construction,
}: {
  construction: NonNullable<LogoSectionConfig['construction']>;
}): ReactNode {
  const { name, rule, alt, diagram } = construction;
  const { view } = diagram;
  return (
    // As wide as a lockup above it, so the two share their edges.
    <figure className={SPAN[4]}>
      <CardCaption title={name}>
        {rule.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </CardCaption>
      <div className="panel relative overflow-hidden">
        <svg
          role="img"
          aria-label={alt}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          className={DIAGRAM}
        >
          <g className={AREA}>
            {diagram.cells.map(({ x, y, width, height }) => (
              <rect
                key={`${x} ${y}`}
                x={x}
                y={y}
                width={width}
                height={height}
              />
            ))}
          </g>
          <g className={HAIRLINE}>
            {diagram.grid.map(({ x1, y1, x2, y2 }) => (
              <line
                key={`${x1} ${y1} ${x2} ${y2}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
          <g fill={diagram.color}>
            {diagram.logo.map(({ d, x, y }) => (
              <path key={d} d={d} transform={`translate(${x} ${y})`} />
            ))}
          </g>
          {/*
           * The radii inside their shapes, in the diagram's red as every
           * rule drawn over the logo is: the circle that rounds each corner,
           * and the radius, named.
           */}
          <g className={`fill-none ${HAIRLINE}`}>
            {diagram.corners.map(({ cx, cy, r }) => (
              <circle
                key={`${cx} ${cy}`}
                cx={cx}
                cy={cy}
                r={r}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </svg>
        {/*
          The labels and the measures over the drawing, in page pixels, not
          in its units: those scale with the diagram, so their sizes and
          gaps changed with the screen. The labels are Inter at 12px, at
          any width.
          Hidden from assistive technology: the drawing's label says all of
          it.
        */}
        <div
          aria-hidden
          className={`absolute inset-0 font-sans text-xs leading-none text-red-500 ${HAIRLINE_WIDTH}`}
        >
          {diagram.radii.map(({ text, x, y }) => (
            <span
              key={`${text} ${x} ${y}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
              // Centered on its point: a share of the view.
              style={{
                left: `${((x - view.x) / view.width) * 100}%`,
                top: `${((y - view.y) / view.height) * 100}%`,
              }}
            >
              {text}
            </span>
          ))}
          {/* The measures in pixels, over the drawing as the labels are. */}
          <svg className="absolute inset-0 size-full overflow-visible">
            {diagram.measures.map((measure) => (
              <MeasureMark key={measure.text} measure={measure} view={view} />
            ))}
          </svg>
        </div>
      </div>
    </figure>
  );
}

/** As wide as the two cards above it together, at every width. */
const PAIR_SPAN = 'col-span-full md:col-span-8';

/** The loupe's clip: one loupe on the page. */
const LOUPE_CLIP = 'logo-versions-loupe';

/** The reversed mark's drift, once its card is in view, and never for less motion. */
const DRIFT = 'motion-safe:in-data-[seen=true]:animate-reversed-drag';

/**
 * The logo's two versions laid one over the other, on dark: the mark in
 * drafting red under the reversed mark in white, so what the reversed mark
 * leaves out shows as a red rim round every edge of every shape. Beside
 * them, a loupe on the square's top right corner, magnified and still, and
 * a ring round the corner joined to it.
 *
 * When the card comes into view the reversed mark drifts off the red one
 * as if dragged, and settles back on it, again and again. Apart, the two
 * read as one logo; together, the rim reads as what the reversed mark
 * leaves out. Still for a reader who asked for less motion.
 */
function ReversedOverlay({
  overlay,
}: {
  overlay: NonNullable<LogoSectionConfig['reversedOverlay']>;
}): ReactNode {
  const { name, rule, alt, diagram } = overlay;
  const { view, loupe } = diagram;
  const paths = (logo: readonly { d: string; x: number; y: number }[]) =>
    logo.map(({ d, x, y }) => (
      <path key={d} d={d} transform={`translate(${x} ${y})`} />
    ));
  // The loupe's view of the marks: the spot at its centre, magnified.
  const magnified = `translate(${loupe.center.x} ${loupe.center.y}) scale(${loupe.zoom}) translate(${-loupe.spot.x} ${-loupe.spot.y})`;
  return (
    <figure className={PAIR_SPAN}>
      <CardCaption title={name}>
        {rule.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </CardCaption>
      <PlayWhenSeen
        className="panel relative overflow-hidden"
        // The ground's color is the content, not a token.
        style={{ backgroundColor: diagram.groundColor }}
      >
        <svg
          role="img"
          aria-label={alt}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          className={DIAGRAM}
        >
          <defs>
            <clipPath id={LOUPE_CLIP}>
              <circle
                cx={loupe.center.x}
                cy={loupe.center.y}
                r={loupe.radius}
              />
            </clipPath>
          </defs>
          <g className="fill-current">{paths(diagram.under)}</g>
          <g fill={diagram.color} className={DRIFT}>
            {paths(diagram.over)}
          </g>
          <g clipPath={`url(#${LOUPE_CLIP})`}>
            <g transform={magnified}>
              <g className="fill-current">{paths(diagram.under)}</g>
              <g fill={diagram.color}>{paths(diagram.over)}</g>
            </g>
          </g>
          <g className={`fill-none ${HAIRLINE}`}>
            <circle
              cx={loupe.spot.x}
              cy={loupe.spot.y}
              r={loupe.spot.radius}
              vectorEffect="non-scaling-stroke"
            />
            <line {...loupe.leader} vectorEffect="non-scaling-stroke" />
            <circle
              cx={loupe.center.x}
              cy={loupe.center.y}
              r={loupe.radius}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
        {/* The rim's width, its label alone, in page pixels, as the construction's are. */}
        <div
          aria-hidden
          className={`absolute inset-0 font-sans text-xs leading-none text-red-500 ${HAIRLINE_WIDTH}`}
        >
          <svg className="absolute inset-0 size-full overflow-visible">
            <MeasureMark measure={loupe.label} view={view} hasLine={false} />
          </svg>
        </div>
      </PlayWhenSeen>
    </figure>
  );
}

function Diagram({
  diagram,
  alt,
}: {
  diagram: ClearSpaceDiagram;
  alt: string;
}): ReactNode {
  const { boundary } = diagram;
  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox={`${boundary.x} ${boundary.y} ${boundary.width} ${boundary.height}`}
      className={DIAGRAM}
    >
      <g className={AREA}>
        {diagram.unit.map(({ d, x, y }) => (
          <path key={`${x} ${y}`} d={d} transform={`translate(${x} ${y})`} />
        ))}
      </g>
      <g className={HAIRLINE}>
        {diagram.guides.map(({ x1, y1, x2, y2 }) => (
          <line
            key={`${x1} ${y1} ${x2} ${y2}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <g fill={diagram.color}>
        {diagram.logo.map(({ d, x, y }) => (
          <path key={d} d={d} transform={`translate(${x} ${y})`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The rest of the logo's description, under its lead, in the section's
 * column for text: how it reads, a list with each point's term set
 * forward, then the paragraph on how it is drawn.
 */
function Description({
  points,
  drawing,
}: {
  points: readonly LogoPoint[];
  drawing: string | undefined;
}): ReactNode {
  return (
    <>
      <ul className="flex list-disc flex-col gap-1 ps-5">
        {points.map(({ term, text }) => (
          <li key={term}>
            <span className="font-medium text-graphite-900">{term}</span> {text}
          </li>
        ))}
      </ul>
      {drawing === undefined ? null : <p>{drawing}</p>}
    </>
  );
}

/** The logo: what it means, every lockup to download, then the room each keeps round it. */
export function LogoSection({
  config,
  section,
  filesBase,
}: LogoSectionProps): ReactNode {
  const logo = config.logo;
  if (logo === undefined) {
    return null;
  }

  return (
    <BrandSection
      section={section}
      lead={logo.lead}
      description={
        logo.points === undefined ? undefined : (
          <Description points={logo.points} drawing={logo.drawing} />
        )
      }
    >
      <Subsection label="Lockups">
        <div className={`${SUBGRID} gap-y-10`}>
          {logo.assets.map((asset) => (
            <AssetCard
              key={asset.slug}
              config={config}
              asset={asset}
              filesBase={filesBase}
              className={SPAN[4]}
            />
          ))}
        </div>
      </Subsection>
      {/*
        How the logo is made and the room it keeps, side by side: the two
        specifications a reader needs to set it, each a card titled by what
        it shows.
      */}
      {logo.construction === undefined &&
      logo.clearSpace === undefined &&
      logo.reversedOverlay === undefined ? null : (
        <Subsection label="Specifications">
          <div className={`${SUBGRID} gap-y-10`}>
            {logo.construction === undefined ? null : (
              <Construction construction={logo.construction} />
            )}
            {logo.clearSpace === undefined ? null : (
              <ClearSpace clearSpace={logo.clearSpace} />
            )}
            {logo.reversedOverlay === undefined ? null : (
              <ReversedOverlay overlay={logo.reversedOverlay} />
            )}
          </div>
        </Subsection>
      )}
    </BrandSection>
  );
}
