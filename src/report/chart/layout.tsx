import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useParentSize } from './lib/use-parent-size.js';
import { useReportData } from './state/report-data.js';
import { Box } from './lib/box.js';
import { MinMax } from './lib/types.js';

// add 1px padding to the right and top to prevent clipping of axis lines
const CHART_PADDING = { left: 0, top: 1, right: 1, bottom: 50 };
const SHARDS_AXIS_WIDTH = 30;
const WORKERS_AXIS_WIDTH = 140;

// minmax values for row heights
const ROW_MIN = 45;
const ROW_MAX = 60;

type LayoutData = {
  chartBox: Box;
  shardsBox: Box;
  workersBox: Box;
  gridBox: Box;
};

function buildLayout(width: number, height: number, hasShards: boolean): LayoutData {
  const chartBox = new Box({ width, height });
  const svgBox = chartBox.padding(CHART_PADDING);
  const shardsBox = svgBox.resizeWidthTo(hasShards ? SHARDS_AXIS_WIDTH : 0);
  const workersBox = svgBox
    .resizeLeftBy(shardsBox.width)
    // Without shards, worker labels aligned to the left -> substract 10px to avoid extra padding.
    .resizeWidthTo(WORKERS_AXIS_WIDTH - (hasShards ? 0 : 10));
  const gridBox = svgBox.resizeLeftBy(shardsBox.width + workersBox.width);

  return { chartBox, shardsBox, workersBox, gridBox };
}

const LayoutContext = createContext<LayoutData | null>(null);

export function LayoutProvider({ children }: { children?: ReactNode }) {
  const { parentRef, width, height } = useParentSize();
  const { isMergeReports } = useReportData();
  const layout = useMemo(
    () => buildLayout(width, height, isMergeReports),
    [width, height, isMergeReports],
  );

  return (
    <div
      ref={parentRef}
      style={{
        flex: '1 1 0', // fill BackgroundBottom, shrink freely (basis 0 = no intrinsic height)
        minHeight: 0, // override default auto so it can shrink below SVG content height
        position: 'relative', // for tooltip absolute positioning
      }}
    >
      <LayoutContext value={layout}>{children}</LayoutContext>
    </div>
  );
}

export function useLayout() {
  const layout = useContext(LayoutContext);
  if (!layout) throw new Error('useLayout() must be used within <LayoutProvider>.');
  return layout;
}

export function getMinMaxHeight([min, max]: MinMax) {
  const rows = max - min + 1;
  const base = CHART_PADDING.top + CHART_PADDING.bottom;
  return {
    minHeight: base + rows * ROW_MIN,
    maxHeight: base + rows * ROW_MAX,
  };
}
