import { useMemo } from 'react';
import { scaleBand } from 'd3-scale';
import type { ScaleBand } from 'd3-scale';
import { useLayout } from '../layout.js';
import { MinMax } from '../lib/types.js';

export type WorkersScale = ScaleBand<number>;

export function useWorkersScale(workersRange: MinMax) {
  const { top, height } = useLayout().gridBox;

  // Workers scale matches worker lane index to absolute TOP coordinate of SVG
  return useMemo(() => {
    const domain: number[] = [];
    for (let i = workersRange[0]; i <= workersRange[1]; i++) domain.push(i);
    return scaleBand<number>()
      .domain(domain)
      .range([top + height, top]);
  }, [workersRange, top, height]);
}

export function getWorkerCoords(workersScale: WorkersScale, laneIndex: number, heightRatio = 1) {
  const y0 = workersScale(laneIndex) ?? 0;
  const bandwidth = workersScale.bandwidth();
  const height = bandwidth * heightRatio;
  const top = y0 + (bandwidth - height) / 2;

  return { top, height };
}
