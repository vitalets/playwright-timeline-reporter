import { useReportData } from '../../state/report-data.js';
import { useLayout } from '../../layout.js';
import { useScale } from '../../scales/index.js';

export function AxisWorkerTicks() {
  const { gridBox: grid, workersBox: workers } = useLayout();
  const scale = useScale().workersScale;
  const { isMergeReports } = useReportData();

  return (
    <>
      {scale.domain().map((workerIndex, i) => {
        const y = scale(workerIndex) ?? 0;
        const isLast = i === scale.domain().length - 1;
        return (
          <line
            key={workerIndex}
            x1={isLast && !isMergeReports ? workers.left : grid.left}
            x2={grid.x2}
            y1={y}
            y2={y}
            stroke="var(--chart-border-color)"
            strokeWidth={isLast ? 1 : 0.5}
          />
        );
      })}
    </>
  );
}
