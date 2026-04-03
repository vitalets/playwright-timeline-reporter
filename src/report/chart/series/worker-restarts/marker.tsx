/** Renders worker restart markers and toggles the matching focus filter on click. */
import { SVGProps } from 'react';
import { MouseEventProps } from '../types.js';
import { WorkerRestart } from '../../../data/worker-restarts.js';
import { Rect } from '../../lib/types.js';
import { FocusFilter, useFocusFilter } from '../../state/focus-filter.js';
import { WORKER_RESTART_SERIES_ID } from '../config.js';

const COLOR = 'var(--color-worker-restart)';
const OPACITY_FOCUSED = 1;
const OPACITY_UNFOCUSED = 0.3;

export type WorkerRestartData = {
  restart: WorkerRestart;
  rect: Rect;
};

export function RestartMarker({
  data,
  triangleSize,
  onMouseMove,
  onMouseLeave,
}: { data: WorkerRestartData; triangleSize: number } & MouseEventProps) {
  const { focusFilter, setFocusFilter, resetFocusFilter } = useFocusFilter();
  const { restart, rect } = data;

  const opacity = isWorkerRestartFocused(focusFilter) ? OPACITY_FOCUSED : OPACITY_UNFOCUSED;

  const handleClick = () => {
    if (focusFilter?.field === 'seriesId' && focusFilter.value === WORKER_RESTART_SERIES_ID) {
      resetFocusFilter();
    } else {
      setFocusFilter('seriesId', WORKER_RESTART_SERIES_ID);
    }
  };

  return (
    <g opacity={opacity}>
      {/* Commented for now, cleaner UI */}
      {/* <RestartLine left={rect.left} top={rect.top} height={rect.height} /> */}
      <RestartTriangle
        centerX={rect.left - 1} // small offset to cover the line
        centerY={rect.top + rect.height / 2}
        size={triangleSize}
        onMouseMove={(e) => onMouseMove?.(e, restart)}
        onMouseLeave={onMouseLeave}
        onClick={handleClick}
      />
    </g>
  );
}

export function RestartTriangle({
  centerX,
  centerY,
  size,
  ...props
}: {
  centerX: number;
  centerY: number;
  size: number;
} & SVGProps<SVGPolygonElement>) {
  const points = `${centerX},${centerY - size} ${centerX + size},${centerY} ${centerX},${centerY + size}`;
  return <polygon points={points} fill={COLOR} {...props} />;
}

// function RestartLine({ left, top, height }: { left: number; top: number; height: number }) {
//   return (
//     <line
//       x1={left}
//       y1={top}
//       x2={left}
//       y2={top + height}
//       stroke={COLOR}
//       strokeWidth={1.5}
//       strokeDasharray="2,2"
//     />
//   );
// }

function isWorkerRestartFocused(focusFilter: FocusFilter | undefined) {
  return (
    !focusFilter?.field ||
    (focusFilter.field === 'seriesId' && focusFilter.value === WORKER_RESTART_SERIES_ID)
  );
}
