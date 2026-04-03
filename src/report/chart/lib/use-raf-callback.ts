/**
 * Defers a callback to the next animation frame and keeps only the latest call arguments.
 */
import { useCallback, useEffect, useRef } from 'react';

export function useRafCallback<T extends unknown[]>(callback: (...args: T) => void) {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>(0);
  const argsRef = useRef<T | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return useCallback((...args: T) => {
    argsRef.current = args;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (argsRef.current) callbackRef.current(...argsRef.current);
    });
  }, []);
}
