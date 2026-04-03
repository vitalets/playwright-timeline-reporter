/**
 * Renders test clip path for rounded bar.
 */

import { TestTimings } from '../../../../test-timings/types.js';
import { Rect } from '../../lib/types.js';
import { SpanBar, SpanBarData } from './span-bar.js';
import { MouseEventProps } from '../types.js';

const TINY_TEST_WIDTH_PX = 2;

export type TestBarData = {
  laneIndex: number;
  test: TestTimings;
  rect: Rect;
  spans: SpanBarData[];
};

export function isTinyTest(width: number) {
  return width <= TINY_TEST_WIDTH_PX;
}

/**
 * Renders the <clipPath> definition for a test bar's rounded rect.
 * Must be placed inside the top-level SVG <defs> element.
 */
export function TestBarClipDef({
  data,
  radius,
  animate,
}: {
  data: { laneIndex: number; test: TestTimings; rect: Rect };
  radius: number;
  animate?: boolean;
}) {
  const clipPathId = getTestClipPathId(data.laneIndex, data.test.startTime);
  const { left, top, width, height } = data.rect;
  const clampedRadius = clampRadius(radius, width, height);
  return (
    <clipPath id={clipPathId}>
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={clampedRadius}
        ry={clampedRadius}
        className={animate ? 'animate' : undefined}
      />
    </clipPath>
  );
}

/**
 * Renders the span bars for a test, clipped by a pre-existing clip path.
 * The clip path definition must be rendered separately in the top-level SVG <defs>
 * via SeriesTestsDefs.
 */
export function TestBar({ data, ...mouseEventProps }: { data: TestBarData } & MouseEventProps) {
  const clip = !isTinyTest(data.rect.width);
  const clipPathId = getTestClipPathId(data.laneIndex, data.test.startTime);
  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      {data.spans.map((spanData, i) => (
        <SpanBar key={i} data={spanData} {...mouseEventProps} />
      ))}
    </g>
  );
}

function getTestClipPathId(laneIndex: number, startTime: number) {
  return `test-clip-${laneIndex}-${startTime}`;
}

function clampRadius(radius: number, width: number, height: number) {
  return Math.max(1, Math.min(radius, Math.min(width, height) / 2));
}
