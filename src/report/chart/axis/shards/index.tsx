/**
 * Group axis for shards (or merge-reports for common case).
 */
import { useMemo } from 'react';
import { useScale } from '../../scales/index.js';
import { useReportData } from '../../state/report-data.js';
import { useSelectedArea } from '../../state/selected-area.js';
import { buildChartMergeReportInfos } from './helpers.js';
import { AxisLine } from './axis-line.js';
import { AxisTicks } from './ticks.js';
import { ShardLabel } from './shard-label.js';
import { MergeReportInfo } from '../../../../run-info.js';

export function AxisShards() {
  const workersScale = useScale().workersScale;
  const { workers, runInfo } = useReportData();
  const { workersRange, setSelectedArea, resetSelectedArea } = useSelectedArea();

  const infos = useMemo(
    () => buildChartMergeReportInfos(workersScale, workers, runInfo.mergeReports),
    [workersScale, workers, runInfo.mergeReports],
  );

  const onLabelClick = (mergeReport: MergeReportInfo) => {
    const visibleWorkers = workers.filter(
      (worker) => worker.mergeReportId === mergeReport?.reportId,
    );
    if (!visibleWorkers.length) return;

    const min = visibleWorkers[0].laneIndex;
    const max = visibleWorkers[visibleWorkers.length - 1].laneIndex;
    if (workersRange[0] === min && workersRange[1] === max) {
      resetSelectedArea();
    } else {
      setSelectedArea({ workersRange: [min, max] });
    }
  };

  return (
    <>
      <AxisLine />
      <AxisTicks infos={infos} />
      {infos.map((info, index) => (
        <ShardLabel key={index} info={info} onClick={onLabelClick} />
      ))}
    </>
  );
}
