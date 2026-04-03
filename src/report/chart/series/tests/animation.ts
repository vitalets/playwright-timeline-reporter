import { useEffect } from 'react';
import { isChromiumBrowser } from '../../../utils.js';

// Should be in sync with animation.css
const ANIMATION_DURATION_MS = 250;

let hasAnimated = false;

export function useAnimation(): boolean {
  // show animation in Chromium browsers, as it's laggy in FF/Safari (investigate)
  const animate = !hasAnimated && isChromiumBrowser();
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => {
        hasAnimated = true;
      }, ANIMATION_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [animate]);

  return animate;
}
