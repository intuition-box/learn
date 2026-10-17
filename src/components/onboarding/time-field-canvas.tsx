'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';

import { JourneyContext } from './journey-context';
import { isDocsPath, linkLevelFor, stationFor } from './stations';
import { createTimeField, type TimeField } from './time-field';

/**
 * The field behind every page of the onboarding, and the soft clearing in
 * its middle that keeps the page's words easy to read.
 *
 * It sits in the root layout, so it is not rebuilt when the route changes:
 * the same field flies from one page's station to the next. Where it is, and
 * how many of its links are drawn, come from where the user is, or, during a
 * trip, from where they are going.
 */
export function TimeFieldCanvas(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<TimeField | null>(null);
  const pathname = usePathname();
  const destination = JourneyContext.useSelector(
    (state) => state.context.destination,
  );

  const isTravelling = destination !== null;
  const station = stationFor(destination ?? pathname);
  const links = linkLevelFor(destination ?? pathname);
  // The documentation has its own page to itself: the field shows there only
  // for the trip in.
  const isShown = isTravelling || !isDocsPath(pathname);

  useEffect(() => {
    const field = fieldRef.current;
    if (field !== null) {
      // Each call does nothing when it is told what it was last told.
      field.travelTo(station);
      field.setLinks(links);
    } else if (canvasRef.current !== null) {
      // The field starts where the page is, with no flight to it.
      fieldRef.current = createTimeField(canvasRef.current, station, links);
    }
  }, [station, links]);

  useEffect(() => {
    fieldRef.current?.setRunning(isShown);
  }, [isShown]);

  useEffect(
    () => () => {
      fieldRef.current?.destroy();
      fieldRef.current = null;
    },
    [],
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ${isShown ? 'opacity-100' : 'opacity-0'}`}
    >
      <canvas ref={canvasRef} className="size-full" />
      {/*
       * The clearing: the page's background colour in the middle, fading to
       * nothing toward the edges. It lifts during a trip, when the page's
       * words are gone and the whole field should show.
       */}
      <div
        className={`absolute inset-0 bg-radial-[closest-side] from-bg/80 from-15% to-transparent to-75% transition-opacity duration-500 ${isTravelling ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}
