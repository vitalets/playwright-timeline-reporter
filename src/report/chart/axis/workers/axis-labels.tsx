import { useLayout } from '../../layout.js';
import { useScale } from '../../scales/index.js';
import { useReportData } from '../../state/report-data.js';

type WorkerLabelInfo = {
  workerIndex: number;
  x: number;
  y: number;
  textAnchor: 'middle' | 'start';
  label: string;
};

export function AxisWorkerLabels({
  onWorkerClick,
}: {
  onWorkerClick?: (workerIndex: number) => void;
}) {
  const items = useLabels();

  return (
    <>
      {items.map(({ workerIndex, x, y, textAnchor, label }) => {
        return (
          <text
            key={workerIndex}
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fontSize={14}
            fill="var(--page-text)"
            style={{ cursor: 'pointer' }}
            onClick={() => onWorkerClick?.(workerIndex)}
          >
            {label}
          </text>
        );
      })}
    </>
  );
}

function useLabels(): WorkerLabelInfo[] {
  const { workersBox: workersBox } = useLayout();
  const scale = useScale().workersScale;
  const { workers, isMergeReports } = useReportData();
  const bandwidth = scale.bandwidth();

  return scale.domain().map((workerIndex) => {
    const y = (scale(workerIndex) ?? 0) + bandwidth / 2;
    const x = isMergeReports ? workersBox.left + workersBox.width / 2 : workersBox.left;
    const textAnchor = isMergeReports ? 'middle' : 'start';
    const label = `Worker ${workers[workerIndex].workerIndex}`;
    return { workerIndex, x, y, label, textAnchor };
  });
}
