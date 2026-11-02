/** Collect worker activity and prepare ordered, normalized timings for Markdown rendering. */
import type {
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import type { MergeReportInfo } from '../run-info.js';
import { parsePlaywrightUserAgent } from '../report/data/user-agent.js';

type WorkerBlock = {
  projectIndex: number;
  workerIndex: number;
  parallelIndex: number;
  start: number;
  end: number;
  status: Exclude<TestResult['status'], 'skipped'>;
};

type Shard = {
  id: string;
  os?: string;
  shardIndex?: number;
  startTime?: number;
  duration?: number;
  blocks: WorkerBlock[];
};

export type WorkerTiming = {
  start: number;
  duration: number;
  status: WorkerBlock['status'];
};

export type MarkdownData = {
  span: number;
  shards: ShardTiming[];
  error?: string;
};

export type ShardTiming = {
  id: string;
  os?: string;
  shardIndex?: number;
  grouped: boolean;
  start: number;
  span: number;
  workers: WorkerTiming[][];
};

export class MarkdownReporterData {
  private shards = new Map<string, Shard>();
  private projectIndexes = new Map<string, number>();
  private lastWorkerBlocks = new Map<string, WorkerBlock>();
  private isMerging: boolean;
  private error?: string;

  constructor(config: FullConfig, suite: Suite, mergeReports?: Record<string, MergeReportInfo>) {
    this.isMerging = mergeReports !== undefined;
    const projectNames = suite.suites.map((project) => project.project()!.name).sort();
    projectNames.forEach((name, index) => this.projectIndexes.set(name, index + 1));
    const shards = mergeReports
      ? Object.values(mergeReports).map((report) => ({
          id: report.reportId,
          os: parsePlaywrightUserAgent(report.userAgent).os,
          shardIndex: report.shardIndex,
          startTime: report.startTime,
          duration: report.duration,
        }))
      : [
          {
            id: '1',
            shardIndex: config.shard?.current,
          },
        ];
    for (const shard of shards) {
      this.shards.set(shard.id, { ...shard, blocks: [] });
    }
  }

  addTestResult(test: TestCase, result: TestResult, mergeReportId?: string) {
    if (result.status === 'skipped' || result.workerIndex < 0) return;
    const shard = this.getShard(mergeReportId);
    if (!shard) {
      this.error = 'Report identity unavailable for an executed test result.';
      return;
    }
    if (!validTiming(result)) {
      this.error = 'Invalid execution timing or slot.';
      return;
    }
    this.recordBlock(shard, {
      projectIndex: this.projectIndexes.get(test.parent.project()!.name)!,
      workerIndex: result.workerIndex,
      parallelIndex: result.parallelIndex,
      start: result.startTime.getTime(),
      end: result.startTime.getTime() + result.duration,
      status: result.status,
    });
  }

  build(result: FullResult, mergeError?: string): MarkdownData {
    const error = mergeError ?? this.error;
    if (error) return { span: 0, shards: [], error };
    const timings = [...this.shards.values()].sort(compareShards).map((shard) => ({
      ...getWorkerTimings(shard, result),
      id: shard.id,
      os: shard.os,
      shardIndex: shard.shardIndex,
      grouped: this.isMerging || shard.shardIndex !== undefined,
    }));
    normalizeShardStarts(timings);
    return {
      span: timings.reduce((max, timing) => Math.max(max, timing.start + timing.span), 0),
      shards: timings,
    };
  }

  private getShard(mergeReportId?: string) {
    if (!this.isMerging) return this.shards.get('1');
    if (mergeReportId !== undefined) return this.shards.get(mergeReportId);
  }

  private recordBlock(shard: Shard, block: WorkerBlock) {
    const key = `${shard.id}:${block.projectIndex}:${block.parallelIndex}:${block.workerIndex}`;
    const previous = this.lastWorkerBlocks.get(key);
    if (canExtend(previous, block)) {
      previous!.end = block.end;
      return;
    }
    shard.blocks.push(block);
    this.lastWorkerBlocks.set(key, block);
  }
}

function normalizeShardStarts(timings: ShardTiming[]) {
  const start = timings.length ? Math.min(...timings.map((timing) => timing.start)) : 0;
  for (const timing of timings) {
    timing.start -= start;
  }
}

function validTiming(result: TestResult) {
  return (
    Number.isFinite(result.startTime.getTime()) &&
    Number.isFinite(result.duration) &&
    result.duration >= 0 &&
    Number.isInteger(result.parallelIndex) &&
    result.parallelIndex >= 0
  );
}

function canExtend(previous: WorkerBlock | undefined, block: WorkerBlock) {
  return previous?.status === 'passed' && block.status === 'passed' && block.start >= previous.end;
}

function compareShards(a: Shard, b: Shard) {
  return (a.shardIndex ?? 0) - (b.shardIndex ?? 0) || Number(a.id) - Number(b.id);
}

function getWorkerTimings(shard: Shard, result: FullResult) {
  const blocks = [...shard.blocks].sort(
    (a, b) => a.start - b.start || a.workerIndex - b.workerIndex,
  );
  const { start, span } = getRunBoundaries(shard, result);
  const slots = new Map<number, WorkerTiming[]>();
  for (const block of blocks) {
    if (block.end <= block.start) continue;
    // Projects and restarted worker processes reuse the same parallel slots.
    const key = block.parallelIndex;
    const slot = slots.get(key) ?? [];
    slot.push({
      start: block.start - start,
      duration: block.end - block.start,
      status: block.status,
    });
    slots.set(key, slot);
  }
  return { start, span, workers: [...slots.values()] };
}

function getRunBoundaries(shard: Shard, result: FullResult) {
  return {
    start: shard.startTime ?? result.startTime.getTime(),
    span: shard.duration ?? result.duration,
  };
}
