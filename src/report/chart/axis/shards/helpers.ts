/** Builds shard-axis merge report segments with vertical bounds for the current worker scale. */
import type { MergeReportInfo } from '../../../../run-info.js';
import type { WorkerData } from '../../../data/workers.js';
import type { WorkersScale } from '../../scales/workers.js';

// MergeReportInfo enriched with Y coordinates.
export type ChartMergeReportInfo = {
  y1: number;
  y2: number;
  mergeReport: MergeReportInfo;
};

export function buildChartMergeReportInfos(
  workersScale: WorkersScale,
  allWorkers: WorkerData[],
  mergeReports: Record<string, MergeReportInfo>,
) {
  const infos: ChartMergeReportInfo[] = [];
  const selectedIndexes = workersScale.domain();
  const bandwidth = workersScale.bandwidth();

  // iterating workers from up to down
  for (let i = selectedIndexes.length - 1; i >= 0; i--) {
    const currIndex = selectedIndexes[i];
    const top = workersScale(currIndex)!;
    const mergeReport = getWorkerMergeReport(currIndex, allWorkers, mergeReports);

    appendChartMergeReportInfo(infos, mergeReport, top);
    if (i === 0) finalizeLastChartMergeReportInfo(infos, top, bandwidth);
  }

  return infos.reverse();
}

function getWorkerMergeReport(
  workerIndex: number,
  allWorkers: WorkerData[],
  mergeReports: Record<string, MergeReportInfo>,
) {
  const mergeReportId = allWorkers[workerIndex].mergeReportId;
  return mergeReportId ? mergeReports[mergeReportId] : undefined;
}

function appendChartMergeReportInfo(
  infos: ChartMergeReportInfo[],
  mergeReport: MergeReportInfo | undefined,
  top: number,
) {
  if (!mergeReport) return;

  const prevInfo = infos[infos.length - 1];
  if (mergeReport === prevInfo?.mergeReport) return;

  if (prevInfo) prevInfo.y2 = top;
  infos.push({ y1: top, y2: 0, mergeReport });
}

function finalizeLastChartMergeReportInfo(
  infos: ChartMergeReportInfo[],
  top: number,
  bandwidth: number,
) {
  if (!infos.length) return;
  infos[infos.length - 1].y2 = top + bandwidth;
}
