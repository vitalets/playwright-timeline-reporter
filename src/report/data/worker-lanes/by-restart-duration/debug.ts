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
    const maxInProjectRestarts = Math.max(...branches.map((b) => b.inProjectRestarts));
    this.log(
      `FINAL BRANCH SCORING (fullyParallel=${fullyParallel}, maxInProjectRestarts=${maxInProjectRestarts}):`,
    );
    const rows = branches.map((branch, index) => ({
      index,
      inProjectRestarts: String(branch.inProjectRestarts),
      variability: formatMetricNumber(branch.restartDurationVariability),
      totalRestart: formatMetricNumber(branch.totalRestartDuration),
      splitFiles: String(branch.splitFilesCount),
    }));
    const indexWidth = Math.max(...rows.map((row) => String(row.index).length));
    const inProjectRestartsWidth = Math.max(...rows.map((row) => row.inProjectRestarts.length));
    const variabilityWidth = Math.max(...rows.map((row) => row.variability.length));
    const totalRestartWidth = Math.max(...rows.map((row) => row.totalRestart.length));
    const splitFilesWidth = Math.max(...rows.map((row) => row.splitFiles.length));
    rows.forEach((row) => {
      this.log(
        `  [${String(row.index).padStart(indexWidth)}]: ` +
          `inProjectRestarts = ${row.inProjectRestarts.padStart(inProjectRestartsWidth)}, ` +
          `restartVariability = ${row.variability.padStart(variabilityWidth)}, ` +
          `totalRestart = ${row.totalRestart.padStart(totalRestartWidth)}, ` +
          `splitFiles = ${row.splitFiles.padStart(splitFilesWidth)}`,
      );
    });
    const reason = getPreferredReason({ ...options, maxInProjectRestarts });
    this.log(`FINAL BRANCH SELECTED: [${selectedIndex}] preferred because ${reason}`);
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

function getPreferredReason({
  fullyParallel,
  branches,
  selectedIndex,
  maxInProjectRestarts,
}: {
  fullyParallel: boolean;
  branches: BranchMetrics[];
  selectedIndex: number;
  maxInProjectRestarts: number;
}): string {
  if (branches.length === 1) return 'only surviving branch';
  const selected = branches[selectedIndex];
  if (maxInProjectRestarts >= 2) {
    return `restartDurationVariability=${formatMetricNumber(selected.restartDurationVariability)}`;
  }
  const parts = [
    !fullyParallel ? `splitFiles=${selected.splitFilesCount}` : '',
    `totalRestartDuration=${formatMetricNumber(selected.totalRestartDuration)}`,
  ]
    .filter(Boolean)
    .join(', ');
  return `heuristic: ${parts}`;
}
