/** Renders the chart drag-selection overlay and maps it to worker and time ranges. */
import { ReactNode, useMemo } from 'react';
import { useLayout } from './layout.js';
import { useScale } from './scales/index.js';
import { MinMax } from './lib/types.js';
import { WorkersScale } from './scales/workers.js';
import { TimeScale } from './scales/time.js';
import { Brush as BrushBase, BrushExtent } from './lib/brush.js';
import { useFocusFilter } from './state/focus-filter.js';
import { useSelectedArea } from './state/selected-area.js';

const MIN_TIME_DURATION = 1; // 1ms — minimum time range to trigger zoom

export function Brush({
  children,
  onBrushStart,
  onBrushEnd,
}: {
  children?: ReactNode;
  onBrushStart?: () => void;
  onBrushEnd?: () => void;
}) {
  const { left, top, width, height } = useLayout().gridBox;
  const { workersScale, timeScale } = useScale();
  const { resetFocusFilter } = useFocusFilter();
  const { setSelectedArea } = useSelectedArea();
  const snapY = useWorkerLines(workersScale);

  const handleBrushEnd = (absExtent: BrushExtent) => {
    onBrushEnd?.();
    const workersRange = getWorkersRange(workersScale, absExtent);
    const timeRange = getTimeRange(timeScale, absExtent);
    if (workersRange && timeRange[1] - timeRange[0] > MIN_TIME_DURATION) {
      setSelectedArea({ timeRange, workersRange });
    }
  };

  return (
    <BrushBase
      left={left}
      top={top}
      width={width}
      height={height}
      snapY={snapY}
      onBrushStart={onBrushStart}
      onBrushEnd={handleBrushEnd}
      onClick={resetFocusFilter}
    >
      {children}
    </BrushBase>
  );
}

function useWorkerLines(workersScale: WorkersScale) {
  return useMemo(() => {
    const offset = workersScale.range()[1];
    const bandwidth = workersScale.bandwidth();
    const upperLines = workersScale
      .domain()
      .map((v) => workersScale(v)! + bandwidth - offset)
      .reverse();
    return [0, ...upperLines];
  }, [workersScale]);
}

function getWorkersRange(workersScale: WorkersScale, absExtent: BrushExtent): MinMax | undefined {
  const indexes = workersScale.domain().filter((v) => {
    const mid = workersScale(v)! + workersScale.bandwidth() / 2;
    return mid > absExtent.y0 && mid < absExtent.y1;
  });
  if (indexes.length) {
    return [indexes[0], indexes[indexes.length - 1]];
  }
}

function getTimeRange(timeScale: TimeScale, absExtent: BrushExtent): MinMax {
  return [timeScale.invert(absExtent.x0), timeScale.invert(absExtent.x1)];
}
