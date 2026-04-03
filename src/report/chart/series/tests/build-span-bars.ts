/**
 * Converts a chart test into positioned span bars using the active chart start time.
 */
import { ChartTest } from '../../../data/tests.js';
import { SpanBarData } from './span-bar.js';
import { mergeSpanBars } from './merge-span-bars.js';

type BuildSpanBarsParams = {
  chartTest: ChartTest;
  startTime: number;
  laneIndex: number;
  heightRatio: number;
  getRect: (
    startTime: number,
    duration: number,
    laneIndex: number,
    heightRatio: number,
  ) => SpanBarData['rect'];
};

export function buildSpanBars({
  chartTest,
  startTime,
  laneIndex,
  heightRatio,
  getRect,
}: BuildSpanBarsParams) {
  let relStartTime = startTime;
  const spanBars = chartTest.spans.map((span) => {
    const rect = getRect(relStartTime, span.duration, laneIndex, heightRatio);
    relStartTime += span.duration;
    return { span, rect };
  });

  return mergeSpanBars(spanBars);
}
