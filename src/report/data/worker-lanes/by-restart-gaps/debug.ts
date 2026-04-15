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

  logNewBranches(test: TestTimings, candidates: WorkerLane[], currentLanes: WorkerLane[]) {
    if (!this.enabled) return;
    const rows = buildCandidateRows(candidates, currentLanes);
    this.log(`NEW BRANCHES (+${candidates.length - 1}): ${testTitleRef(test)}`);
    rows.forEach((candidate) => {
      this.log(`  - lane[${candidate.laneIndex}]: ${testTitleRef(candidate.lastTest)}`);
    });
  }

  logPruneBranches(totalBranchesBefore: number, totalBranchesAfter: number) {
    if (!this.enabled) return;
    this.log(`PRUNE BRANCHES: ${totalBranchesBefore} -> ${totalBranchesAfter}`);
  }

  logFinalBranches(options: {
    fullyParallel: boolean;
    branches: BranchMetrics[];
    selectedIndex: number;
  }) {
    if (!this.enabled) return;
    const { fullyParallel, branches, selectedIndex } = options;
    this.log(`FINAL BRANCHES: ${branches.length}`);
    if (branches.length <= 1) return;
    const maxRestartGapsCount = Math.max(...branches.map((b) => b.restartGapsCount));
    const approach = maxRestartGapsCount >= 2 ? 'variability' : 'heuristic';
    const approachSuffix = approach === 'heuristic' ? `, fullyParallel=${fullyParallel}` : '';
    const header = `maxRestartGapsCount=${maxRestartGapsCount}, approach=${approach}${approachSuffix}`;
    this.log(`FINAL BRANCHES SCORING (${header}):`);
    const rows = buildBranchRows(branches);
    const widths = computeBranchRowWidths(rows);
    rows.forEach((row) => {
      const cols = formatBranchRow(row, approach, widths);
      this.log(`  [${String(row.index).padStart(widths.indexWidth)}]: ${cols}`);
    });
    const reason = getPreferredReason({ ...options, maxRestartGapsCount });
    this.log(`SELECTED BRANCH: [${selectedIndex}] preferred because ${reason}`);
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

type BranchRowWidths = {
  indexWidth: number;
  restartGapsCountWidth: number;
  variabilityWidth: number;
  restartGapsSumWidth: number;
  splitFilesWidth: number;
};

type BranchRow = {
  index: number;
  restartGapsCount: string;
  variability: string;
  restartGapsSum: string;
  splitFiles: string;
};

function buildBranchRows(branches: BranchMetrics[]): BranchRow[] {
  return branches
    .map((branch, index) => ({
      index,
      restartGapsCount: String(branch.restartGapsCount),
      variability: formatMetricNumber(branch.restartGapsVariability),
      restartGapsSum: formatMetricNumber(branch.restartGapsSum),
      splitFiles: String(branch.splitFilesCount),
    }))
    .sort((a, b) => Number(b.restartGapsCount) - Number(a.restartGapsCount));
}

function computeBranchRowWidths(rows: BranchRow[]): BranchRowWidths {
  return {
    indexWidth: Math.max(...rows.map((r) => String(r.index).length)),
    restartGapsCountWidth: Math.max(...rows.map((r) => r.restartGapsCount.length)),
    variabilityWidth: Math.max(...rows.map((r) => r.variability.length)),
    restartGapsSumWidth: Math.max(...rows.map((r) => r.restartGapsSum.length)),
    splitFilesWidth: Math.max(...rows.map((r) => r.splitFiles.length)),
  };
}

function formatBranchRow(row: BranchRow, approach: string, widths: BranchRowWidths): string {
  if (approach === 'variability') {
    return (
      `restartGapsCount = ${row.restartGapsCount.padStart(widths.restartGapsCountWidth)}, ` +
      `restartGapsVariability = ${row.variability.padStart(widths.variabilityWidth)}`
    );
  }
  return (
    `restartGapsSum = ${row.restartGapsSum.padStart(widths.restartGapsSumWidth)}, ` +
    `splitFiles = ${row.splitFiles.padStart(widths.splitFilesWidth)}`
  );
}

function getPreferredReason({
  fullyParallel,
  branches,
  selectedIndex,
  maxRestartGapsCount,
}: {
  fullyParallel: boolean;
  branches: BranchMetrics[];
  selectedIndex: number;
  maxRestartGapsCount: number;
}): string {
  if (branches.length === 1) return 'only surviving branch';
  const selected = branches[selectedIndex];
  if (maxRestartGapsCount >= 2) {
    const v = formatMetricNumber(selected.restartGapsVariability);
    return `restartGapsVariability=${v} (with restartGapsCount=${selected.restartGapsCount})`;
  }
  const parts = [
    !fullyParallel ? `splitFiles=${selected.splitFilesCount}` : '',
    `restartGapsSum=${formatMetricNumber(selected.restartGapsSum)}`,
  ]
    .filter(Boolean)
    .join(', ');
  return `heuristic: ${parts}`;
}
