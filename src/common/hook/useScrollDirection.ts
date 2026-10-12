import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

/**
 * Detects whether the user is scrolling up or down.
 * Used primarily by the mobile header to auto-hide on scroll-down
 * and reappear on scroll-up — like native iOS/Android browsers.
 *
 * @param threshold - minimum scroll delta (px) before direction changes.
 *                    Prevents jittery toggling from tiny scrolls.
 */
export function useScrollDirection(threshold = 8): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateDirection = () => {
      const scrollY = window.scrollY;

      // Always show header when near the top of the page
      if (scrollY < 48) {
        setDirection('up');
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? 'down' : 'up');
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return direction;
}
