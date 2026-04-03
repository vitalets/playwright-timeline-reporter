/**
 * Renders vertical tick lines spanning the full grid height, tick labels, and the boundary lines.
 * Both boundaries are always drawn as the closing edges of the chart.
 */
import { Fragment, useMemo } from 'react';
import { TimeScale } from '../../scales/time.js';
import { Rect } from '../../lib/types.js';

const MAX_TICKS_COUNT = 10;
const TICK_OFFSET_Y = 8;
const LABEL_OFFSET_Y = 12;
// Approximate character width for 12px font, with a small padding
const AVG_CHAR_WIDTH = 7;
const TICK_LABEL_PADDING = 6;

type Tick = {
  time: number;
  x: number;
  boundary?: 'left' | 'right';
  hideLabel?: boolean;
};

type AxisTicksProps = {
  box: Rect;
  scale: TimeScale;
  tickFormat: (v: number) => string;
};

export function AxisTicks({ box, scale, tickFormat }: AxisTicksProps) {
  const { top, height } = box;
  const axisLineY = top + height;

  const ticks = useMemo(() => {
    const tickLabelWidth = estimateTickLabelWidth(tickFormat, scale);
    const ticks = buildRegularTicks(scale, tickLabelWidth);
    handleLeftBoundary(scale, ticks, tickLabelWidth);
    handleRightBoundary(scale, ticks, tickLabelWidth);
    return ticks;
  }, [scale, tickFormat]);

  return (
    <>
      {ticks.map(({ time, x, boundary, hideLabel }) => (
        <Fragment key={time}>
          <GridLine x={x} top={top} axisLineY={axisLineY} strokeWidth={boundary ? 1 : 0.5} />
          {!hideLabel && (
            <>
              <TickLine x={x} axisLineY={axisLineY} />
              <TickLabel
                x={x}
                axisLineY={axisLineY}
                label={tickFormat(time)}
                textAnchor={boundary === 'right' ? 'end' : 'middle'}
              />
            </>
          )}
        </Fragment>
      ))}
    </>
  );
}

function TickLabel(props: {
  x: number;
  axisLineY: number;
  label: string;
  textAnchor: 'end' | 'middle';
}) {
  const { x, axisLineY, label, textAnchor } = props;
  return (
    <text
      x={x}
      y={axisLineY + LABEL_OFFSET_Y}
      textAnchor={textAnchor}
      dominantBaseline="hanging"
      fontSize={12}
      fill="var(--page-text)"
      style={{ userSelect: 'none' }}
    >
      {label}
    </text>
  );
}

function TickLine(props: { x: number; axisLineY: number }) {
  const { x, axisLineY } = props;
  return (
    <line
      x1={x}
      x2={x}
      y1={axisLineY}
      y2={axisLineY + TICK_OFFSET_Y}
      stroke="var(--chart-border-color)"
      strokeWidth={1}
    />
  );
}

function GridLine(props: { x: number; top: number; axisLineY: number; strokeWidth: number }) {
  const { x, top, axisLineY, strokeWidth } = props;
  return (
    <line
      x1={x}
      x2={x}
      y1={top}
      y2={axisLineY}
      stroke="var(--chart-border-color)"
      strokeWidth={strokeWidth}
    />
  );
}

/**
 * Estimate tick label width by formatting the candidate ticks and finding the widest label.
 * Using actual tick values (nice round numbers) is more accurate than sampling domain endpoints.
 */
function estimateTickLabelWidth(tickFormat: (v: number) => string, scale: TimeScale): number {
  const candidateTicks = scale.ticks(MAX_TICKS_COUNT);
  const maxLen = Math.max(...candidateTicks.map((t) => tickFormat(t).length));
  return maxLen * AVG_CHAR_WIDTH + TICK_LABEL_PADDING;
}

function buildRegularTicks(scale: TimeScale, tickLabelWidth: number): Tick[] {
  const [rangeStart, rangeEnd] = scale.range();
  const rangeWidth = rangeEnd - rangeStart;
  const ticksCount = Math.min(MAX_TICKS_COUNT, Math.floor(rangeWidth / tickLabelWidth));
  return scale.ticks(ticksCount).map((time) => ({
    time,
    x: scale(time),
  }));
}

function handleLeftBoundary(scale: TimeScale, ticks: Tick[], tickLabelWidth: number) {
  const rangeStart = scale.range()[0];
  const timeStart = scale.domain()[0];
  const firstTick = ticks[0];

  const leftBoundaryTick: Tick = {
    time: timeStart,
    x: rangeStart,
    boundary: 'left',
  };

  const distance = Math.abs(firstTick.x - rangeStart);

  // If tick is very close to the boundary, replace it with the boundary tick.
  // Otherwise, add the boundary tick, but hide its label if it overlaps with the tick's label.
  if (distance < tickLabelWidth / 2) {
    ticks[0] = leftBoundaryTick;
  } else {
    leftBoundaryTick.hideLabel = distance < tickLabelWidth;
    ticks.unshift(leftBoundaryTick);
  }
}

function handleRightBoundary(scale: TimeScale, ticks: Tick[], tickLabelWidth: number) {
  const rangeEnd = scale.range()[1];
  const timeEnd = scale.domain()[1];
  const lastTick = ticks[ticks.length - 1];

  const rightBoundaryTick: Tick = {
    time: timeEnd,
    x: rangeEnd,
    boundary: 'right',
  };

  const distance = Math.abs(lastTick.x - rangeEnd);

  // If tick is very close to the boundary, replace it with the boundary tick.
  // Otherwise, add the boundary tick, but hide its label if it overlaps with the tick's label.
  if (distance < tickLabelWidth / 2) {
    ticks[ticks.length - 1] = rightBoundaryTick;
  } else {
    // Use ratio 1.5, because right boundary label is aligned by the right edge.
    rightBoundaryTick.hideLabel = distance < 1.5 * tickLabelWidth;
    ticks.push(rightBoundaryTick);
  }
}
