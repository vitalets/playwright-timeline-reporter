/**
 * Generic hook providing startTimer/stopTimer methods that invoke a callback after a given duration.
 */
import { useEffect, useRef } from 'react';

export function useTimer(duration: number, callback: () => void) {
  const timerRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      callbackRef.current();
    }, duration);
  };

  return { startTimer, stopTimer };
}
