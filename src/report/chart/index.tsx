/**
 * Renders the interactive timeline chart, including series, axes, brush selection, and tooltip behavior.
 */
import { ChartData } from '../data/index.js';
import { useCallback, useState } from 'react';
import { AxisWorkers } from './axis/workers/index.js';
import { Brush } from './brush.js';
import { AxisShards } from './axis/shards/index.js';
import { AxisTime } from './axis/time/index.js';
import { LayoutProvider, useLayout } from './layout.js';
import { ScaleProvider } from './scales/index.js';
import { FocusFilterProvider } from './state/focus-filter.js';
import { ReportDataProvider } from './state/report-data.js';
import { SeriesTests, SeriesTestsDefs } from './series/tests/index.js';
import { SeriesWorkerRestarts } from './series/worker-restarts/index.js';
import { GridClipPath, GridClipPathDef } from './axis/grid-clip-path.js';
import { Patterns } from './series/tests/patterns.js';
import { useTooltip } from './lib/tooltip.js';
import { Tooltip, TooltipData } from './tooltip/index.js';
import { SelectedProjectProvider } from './state/selected-project.js';
import { useReportData } from './state/report-data.js';
import { SelectedAreaProvider } from './state/selected-area.js';
import { Background } from './background.js';
import { Toolbox } from './toolbox/index.js';
import { useRafCallback } from './lib/use-raf-callback.js';
import { AlignShardsProvider } from './state/align-shards.js';

export function Chart({ chartData }: { chartData: ChartData }) {
  return (
    <ReportDataProvider data={chartData}>
      <SelectedProjectProvider>
        <AlignShardsProvider>
          <FocusFilterProvider>
            <SelectedAreaProvider>
              <Background toolbox={<Toolbox />}>
                <LayoutProvider>
                  <ScaleProvider>
                    <SvgContent />
                  </ScaleProvider>
                </LayoutProvider>
              </Background>
            </SelectedAreaProvider>
          </FocusFilterProvider>
        </AlignShardsProvider>
      </SelectedProjectProvider>
    </ReportDataProvider>
  );
}

// eslint-disable-next-line max-lines-per-function
function SvgContent() {
  const { chartBox } = useLayout();
  const tooltip = useTooltip<TooltipData>();
  const { isMergeReports } = useReportData();
  const [isBrushing, setIsBrushing] = useState(false);

  const showTooltipOnMouseMove = useRafCallback((left: number, top: number, data: TooltipData) => {
    if (!isBrushing) tooltip.show({ left, top, data });
  });

  const onMouseMove = useCallback(
    (event: React.MouseEvent, data: TooltipData) => {
      const left = event.clientX;
      const top = event.clientY;
      showTooltipOnMouseMove(left, top, data);
    },
    [showTooltipOnMouseMove],
  );

  // Initially, the chartBox might have width and height of 0 until the parent size is measured.
  if (chartBox.width === 0 || chartBox.height === 0) return;

  return (
    <>
      <svg
        width={chartBox.width}
        height={chartBox.height}
        style={{ display: 'block', userSelect: 'none' }}
      >
        {/*
            All SVG <defs> are placed here in the top-level SVG element intentionally.
            Safari has a bug where clip-path url(#id) references fail to resolve when
            the referenced <defs> are inside nested SVG elements or dynamically inserted
            JSX fragments.
          */}
        <defs>
          <Patterns />
          <GridClipPathDef />
          <SeriesTestsDefs />
        </defs>
        {isMergeReports && <AxisShards />}
        <AxisWorkers />
        <AxisTime />
        <Brush
          onBrushStart={() => {
            setIsBrushing(true);
            tooltip.hide();
          }}
          onBrushEnd={() => setIsBrushing(false)}
        >
          <GridClipPath>
            <SeriesTests onMouseMove={onMouseMove} onMouseLeave={tooltip.hide} />
            <SeriesWorkerRestarts onMouseMove={onMouseMove} onMouseLeave={tooltip.hide} />
          </GridClipPath>
        </Brush>
      </svg>
      {tooltip.data && (
        <Tooltip
          left={tooltip.left}
          top={tooltip.top}
          visible={tooltip.visible}
          data={tooltip.data}
        />
      )}
    </>
  );
}
