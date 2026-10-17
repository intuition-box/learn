import type { ReactNode } from 'react';

import { docs } from '@/lib/docs';

/*
 * The whole shell: sidebar, search trigger, skip link and the grid.
 * It renders inside your application's root layout, which owns
 * `<html>` and `<body>`, and which imports the stylesheet.
 *
 * The wrapper fades the documentation in, which is how a trip from the
 * playground ends. It animates opacity only: a transform here would become
 * the containing block of the shell's fixed parts.
 */
export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="motion-safe:animate-docs-arrive">
      <docs.Layout>{children}</docs.Layout>
    </div>
  );
}
