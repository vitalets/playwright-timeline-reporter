import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export function useParentSize() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // useLayoutEffect ensures size updates trigger a synchronous re-render before paint,
  // preventing a visible blink when the container resizes (e.g. on zoom reset).
  useLayoutEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // flushSync forces React to process the state update synchronously
        // inside the ResizeObserver callback (which fires before paint).
        // Without it, React batches the update and the browser paints one frame
        // with stale SVG positions inside the resized container, causing a blink.
        flushSync(() => setSize({ width, height }));
      }
    });
    if (parentRef.current) observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  return { parentRef, ...size };
}
