/**
 * Renders a single chart span bar and applies the active focus-filter opacity state.
 */
import { CSSProperties } from 'react';
import { getSpanFill } from '../config.js';
import { Rect } from '../../lib/types.js';
import type { ChartSpan } from '../../../data/tests.js';
import type { MouseEventProps } from '../types.js';
import { type FocusFilter, useFocusFilter } from '../../state/focus-filter.js';
import { getSeriesId } from '../config.js';

const OPACITY_HOVER = 1;
const OPACITY_FOCUSED = 0.9;
const OPACITY_UNFOCUSED = 0.3;

export type SpanBarData = {
  span: ChartSpan;
  rect: Rect;
};

export function SpanBar({
  data,
  style,
  ...props
}: { data: SpanBarData; style?: CSSProperties } & MouseEventProps) {
  const { focusFilter, setFocusFilter, resetFocusFilter } = useFocusFilter();
  const { left, top, width, height } = data.rect;
  const fill = getSpanFill(data.span.span);
  const focused = isSpanFocused(data.span, focusFilter);
  const baseOpacity = focused ? OPACITY_FOCUSED : OPACITY_UNFOCUSED;
  const pulsing = focused && focusFilter?.pulsing;

  const onClick = (e: React.MouseEvent<SVGRectElement>) => {
    if (focusFilter?.field === 'spanGroupId' && focusFilter.value === data.span.spanGroupId) {
      resetFocusFilter();
    } else {
      setFocusFilter('spanGroupId', data.span.spanGroupId);
    }
    props.onClick?.(e, data.span);
  };

  return (
    <rect
      className={pulsing ? 'search-match-pulse' : undefined}
      x={left}
      y={top}
      width={width}
      height={height}
      style={{
        fill,
        stroke: 'var(--bar-stroke)',
        strokeWidth: 1,
        opacity: baseOpacity,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (focused) e.currentTarget.style.opacity = String(OPACITY_HOVER);
      }}
      onMouseMove={(e) => props.onMouseMove?.(e, data.span)}
      onMouseLeave={(e) => {
        if (focused) e.currentTarget.style.opacity = String(baseOpacity);
        props.onMouseLeave?.();
      }}
    />
  );
}

// eslint-disable-next-line visual/complexity
function isSpanFocused(span: ChartSpan, focusFilter?: FocusFilter) {
  if (!focusFilter) return true;
  const { field, value, project } = focusFilter;
  if (project && span.test.projectName !== project) return false;
  if (field === 'spanGroupId' && span.spanGroupId !== value) return false;
  if (field === 'seriesId' && getSeriesId(span.span) !== value) return false;
  if (field === 'filePath' && !matchesFilePath(span, value)) return false;
  if (field === 'testId' && span.test.testId !== value) return false;
  if (field === 'spanId' && span.spanId !== value) return false;
  return true;
}

function matchesFilePath(span: ChartSpan, filePath?: string) {
  if (!filePath) return false;
  return span.span.location.file === filePath || span.test.testBody.location.file === filePath;
}
