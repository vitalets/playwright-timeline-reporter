import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import type { ScaleLinear, ScaleBand } from 'd3-scale';
import { Rect } from '../lib/types.js';
import { useSelectedArea } from '../state/selected-area.js';
import { getTimeCoords, useTimeScale } from './time.js';
import { getWorkerCoords, useWorkersScale } from './workers.js';

type ScaleContextData = {
  timeScale: ScaleLinear<number, number>;
  workersScale: ScaleBand<number>;
  getRect: (startTime: number, duration: number, laneIndex: number, heightRatio: number) => Rect;
};

const ScaleContext = createContext<ScaleContextData | null>(null);

export function ScaleProvider({ children }: { children?: ReactNode }) {
  const { timeRange, workersRange } = useSelectedArea();
  const timeScale = useTimeScale(timeRange);
  const workersScale = useWorkersScale(workersRange);

  const getRect = useCallback(
    (startTime: number, duration: number, laneIndex: number, heightRatio: number) => {
      return {
        ...getTimeCoords(timeScale, startTime, duration),
        ...getWorkerCoords(workersScale, laneIndex, heightRatio),
      };
    },
    [timeScale, workersScale],
  );

  const value = useMemo(
    () => ({ timeScale, workersScale, getRect }),
    [timeScale, workersScale, getRect],
  );

  return <ScaleContext value={value}>{children}</ScaleContext>;
}

export function useScale() {
  const v = useContext(ScaleContext);
  if (!v) throw new Error('useScale() must be used within <ScaleProvider>');
  return v;
}
