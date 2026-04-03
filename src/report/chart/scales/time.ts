import { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import type { ScaleLinear } from 'd3-scale';
import { useLayout } from '../layout.js';
import { MinMax } from '../lib/types.js';

export type TimeScale = ScaleLinear<number, number>;

export function useTimeScale(timeRange: MinMax) {
  const { left, width } = useLayout().gridBox;

  // Time scale matches time to absolute LEFT coordinate of SVG
  return useMemo(() => {
    return scaleLinear()
      .domain(timeRange)
      .range([left, left + width]);
  }, [timeRange, left, width]);
}

export function getTimeCoords(timeScale: TimeScale, start: number, duration: number) {
  const left = timeScale(start);
  const width = timeScale(start + duration) - left;

  return { left, width };
}

export function isVisible(timeScale: TimeScale, startTime: number, duration: number) {
  const [minTime, maxTime] = timeScale.domain();
  return startTime <= maxTime && startTime + duration >= minTime;
}
