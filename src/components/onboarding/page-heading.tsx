import type { ReactNode } from 'react';

export interface PageHeadingProps {
  title: string;
  description: string;
}

/**
 * A page's title and the sentence under it, centred.
 *
 * The words sit on a blurred patch of the page's colour, wider than they
 * are, so the field's atoms do not run through the letters. On a narrow
 * screen it is only as wide as the page's own padding: any wider and the
 * page would scroll sideways.
 */
export function PageHeading({
  title,
  description,
}: PageHeadingProps): ReactNode {
  return (
    <div className="relative isolate flex flex-col gap-4 text-center before:absolute before:-inset-x-6 before:-inset-y-8 before:-z-10 before:rounded-[50%] before:bg-bg/95 before:blur-2xl sm:before:-inset-x-16">
      <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        {title}
      </h1>
      <p className="text-lg text-balance text-fg-muted sm:text-xl">
        {description}
      </p>
    </div>
  );
}
