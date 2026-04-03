import { formatTime } from '../../../utils.js';
import { useReportData } from '../../state/report-data.js';
import { useLayout } from '../../layout.js';
import { useScale } from '../../scales/index.js';
import { AxisLabel } from './axis-label.js';
import { AxisLine } from './axis-line.js';
import { AxisTicks } from './axis-ticks.js';

export function AxisTime() {
  const { gridBox: grid, workersBox: workers } = useLayout();
  const scale = useScale().timeScale;
  const { isMergeReports } = useReportData();

  return (
    <>
      <AxisLine x1={isMergeReports ? grid.left : workers.left} x2={grid.x2} top={grid.y2} />
      <AxisTicks box={grid} scale={scale} tickFormat={formatTime} />
      <AxisLabel box={grid} />
    </>
  );
}
