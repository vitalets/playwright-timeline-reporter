/**
 * Computes the worker utilization score from busy test time and worker availability.
 *
 * Worker Utilization Score = 100 × Σ(worker busy time) / Σ(worker available time)
 *
 * Examples:
 *   busyTimes=[80],           availableTimes=[80]         → 100  (single worker, fully busy)
 *   busyTimes=[80, 80, 80],   availableTimes=[80, 80, 80] → 100  (perfect distribution)
 *   busyTimes=[100, 70, 70],  availableTimes=[100, 100, 100] → 80   (moderate skew)
 *   busyTimes=[200, 20, 20],  availableTimes=[200, 200, 200] → 40   (heavy skew)
 */
import { ChartData } from '../../data/index.js';

export function calcScore(chartData: ChartData): number {
  const { workers } = chartData;
  if (workers.length === 0) return 0;

  const totalBusyTime = workers.reduce(
    (sum, worker) => sum + worker.tests.reduce((s, t) => s + t.test.totalDuration, 0),
    0,
  );
  const totalAvailableTime = workers.reduce(
    (sum, worker) => sum + getWorkerAvailableTime(chartData, worker.mergeReportId),
    0,
  );
  if (totalAvailableTime === 0) return 0;

  return Math.round((100 * totalBusyTime) / totalAvailableTime);
}

function getWorkerAvailableTime(chartData: ChartData, mergeReportId?: string) {
  const { runInfo } = chartData;
  if (!mergeReportId) return runInfo.duration;

  return runInfo.mergeReports[mergeReportId]?.duration ?? runInfo.duration;
}
