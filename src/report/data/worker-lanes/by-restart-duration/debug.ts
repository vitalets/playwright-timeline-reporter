/**
 * Debug helpers for the worker-lanes backtracking algorithm.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane } from './lane.js';
import { BranchMetrics } from './scoring.js';

export class WorkerLanesDebug {
  constructor(private readonly enabled = false) {}

  log(...args: unknown[]) {
    if (!this.enabled) return;
    console.log('[worker-lanes]', ...args);
  }

  logAnalysisSummary(
    maxParallelWorkers: number,
    maxParallelWorkersPerProject: Map<string, number>,
  ) {
    if (!this.enabled) return;
    this.log(
      'ANALYSIS:',
      `maxParallelWorkers=${maxParallelWorkers},`,
      `maxParallelWorkersPerProject=${formatProjectWorkers(maxParallelWorkersPerProject)}`,
    );
  }

  logBranchFanOut(
    test: TestTimings,
    candidates: WorkerLane[],
    currentLanes: WorkerLane[],
    totalBranches: number,
  ) {
    if (!this.enabled) return;
    const rows = buildCandidateRows(candidates, currentLanes);
    this.log(`NEW BRANCHES (+${rows.length}, total ${totalBranches}): ${testTitleRef(test)}`);
    rows.forEach((candidate) => {
      this.log(`  - lane[${candidate.laneIndex}]: ${testTitleRef(candidate.lastTest)}`);
    });
  }

  logBranchesPruned(totalBranchesBefore: number, totalBranchesAfter: number) {
    if (!this.enabled) return;
    this.log(`PRUNE: totalBranches ${totalBranchesBefore} -> ${totalBranchesAfter}`);
  }

  logFinalBranchScoring(options: {
    fullyParallel: boolean;
    branches: BranchMetrics[];
    selectedIndex: number;
  }) {
    if (!this.enabled) return;
    const { fullyParallel, branches, selectedIndex } = options;
    if (branches.length <= 1) return;
    this.log(`FINAL BRANCH SCORING (fullyParallel=${fullyParallel}):`);
    const rows = branches.map((branch, index) => ({
      index,
      variability: formatMetricNumber(branch.restartDurationVariability),
      totalRestart: formatMetricNumber(branch.totalRestartDuration),
      splitFiles: String(branch.splitFilesCount),
    }));
    const indexWidth = Math.max(...rows.map((row) => String(row.index).length));
    const variabilityWidth = Math.max(...rows.map((row) => row.variability.length));
    const totalRestartWidth = Math.max(...rows.map((row) => row.totalRestart.length));
    const splitFilesWidth = Math.max(...rows.map((row) => row.splitFiles.length));
    rows.forEach((row) => {
      this.log(
        `  [${String(row.index).padStart(indexWidth)}]: ` +
          `restartVariability = ${row.variability.padStart(variabilityWidth)}, ` +
          `totalRestart = ${row.totalRestart.padStart(totalRestartWidth)}, ` +
          `splitFiles = ${row.splitFiles.padStart(splitFilesWidth)}`,
      );
    });
    this.log(
      `FINAL BRANCH SELECTED: [${selectedIndex}] preferred because ${getPreferredReason(options)}`,
    );
  }
}

function formatMetricNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(0);
}

function formatProjectWorkers(maxParallelWorkersPerProject: Map<string, number>): string {
  const entries = [...maxParallelWorkersPerProject.entries()].map(
    ([projectName, workers]) => `${formatProjectName(projectName)}: ${workers}`,
  );
  return `{${entries.join(', ')}}`;
}

function buildCandidateRows(candidates: WorkerLane[], currentLanes: WorkerLane[]) {
  return candidates
    .flatMap((candidate) =>
      candidate.lastTest
        ? [{ laneIndex: currentLanes.indexOf(candidate), lastTest: candidate.lastTest }]
        : [],
    )
    .sort((a, b) => a.laneIndex - b.laneIndex);
}

function testTitleRef(t: TestTimings): string {
  const fileName = getFileName(t.testBody.location.file);
  const parts = [
    t.projectName ? `[${t.projectName}]` : '',
    fileName,
    ...t.testBody.title.filter(Boolean),
  ].filter(Boolean);
  return `"${parts.join(' › ')}"`;
}

function formatProjectName(projectName: string): string {
  return projectName || '<default>';
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

// eslint-disable-next-line visual/complexity
function getPreferredReason({
  fullyParallel,
  branches,
  selectedIndex,
}: {
  fullyParallel: boolean;
  branches: BranchMetrics[];
  selectedIndex: number;
}): string {
  const selected = branches[selectedIndex];
  const alternatives = branches.filter((_, index) => index !== selectedIndex);
  const bestAlternative = alternatives.reduce<BranchMetrics | undefined>((best, candidate) => {
    if (!best) return candidate;
    return compareBranchScores(candidate, best, fullyParallel) < 0 ? candidate : best;
  }, undefined);

  if (!bestAlternative) return 'only surviving branch';

  if (selected.restartDurationVariability !== bestAlternative.restartDurationVariability) {
    return (
      'lower restart-duration variability ' +
      `(${formatMetricNumber(selected.restartDurationVariability)} < ` +
      `${formatMetricNumber(bestAlternative.restartDurationVariability)})`
    );
  }

  if (!fullyParallel && selected.splitFilesCount === 0 && bestAlternative.splitFilesCount > 0) {
    return (
      'fullyParallel=false prefers no split files ' +
      `(${selected.splitFilesCount} < ${bestAlternative.splitFilesCount})`
    );
  }

  if (selected.totalRestartDuration !== bestAlternative.totalRestartDuration) {
    return (
      'lower total restart duration ' +
      `(${formatMetricNumber(selected.totalRestartDuration)} < ` +
      `${formatMetricNumber(bestAlternative.totalRestartDuration)})`
    );
  }

  if (selected.splitFilesCount !== bestAlternative.splitFilesCount) {
    return `fewer split files (${selected.splitFilesCount} < ${bestAlternative.splitFilesCount})`;
  }

  return 'ties on all scoring metrics and stays first by branch order';
}

function compareBranchScores(a: BranchMetrics, b: BranchMetrics, fullyParallel: boolean): number {
  return (
    a.restartDurationVariability - b.restartDurationVariability ||
    compareNoSplitFiles(a, b, fullyParallel) ||
    a.totalRestartDuration - b.totalRestartDuration ||
    a.splitFilesCount - b.splitFilesCount
  );
}

function compareNoSplitFiles(a: BranchMetrics, b: BranchMetrics, fullyParallel: boolean): number {
  if (fullyParallel) return 0;

  const aHasNoSplitFiles = a.splitFilesCount === 0;
  const bHasNoSplitFiles = b.splitFilesCount === 0;
  if (aHasNoSplitFiles === bHasNoSplitFiles) return 0;
  return aHasNoSplitFiles ? -1 : 1;
}
