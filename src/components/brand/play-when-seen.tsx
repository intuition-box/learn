'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export interface PlayWhenSeenProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * A box that says when it has been seen: `data-seen="true"` once half of it
 * has scrolled into view, and for good after, so a motion inside it starts
 * then (`in-data-[seen=true]:`) rather than off screen, and plays once.
 */
export function PlayWhenSeen({
  className,
  style,
  children,
}: PlayWhenSeenProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [isSeen, setIsSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) {
          setIsSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-seen={isSeen} className={className} style={style}>
      {children}
    </div>
  );
}
