/** Render worker activity as a Mermaid Gantt chart. */
import type { ShardTiming, WorkerTiming } from './reporter-data.js';
import { formatDuration } from './format-duration.js';

const CONFIG = `---
displayMode: compact
config:
  theme: base
  themeVariables:
    activeTaskBkgColor: "#ddf4ff"
    activeTaskBorderColor: "#80ccff"
    doneTaskBkgColor: "#2da44e"
    doneTaskBorderColor: "#238636"
    critBkgColor: "#cf222e"
    critBorderColor: "#a40e26"
    taskBkgColor: "#fff5df"
    taskBorderColor: "#efdfb9"
  gantt:
    leftPadding: 140
    rightPadding: 190
    barHeight: 24
    barGap: 10
    fontSize: 12
    sectionFontSize: 12
---
gantt
    dateFormat YYYY-MM-DD HH:mm:ss.SSS
    todayMarker off`;

export function renderMermaid(shards: ShardTiming[], span: number) {
  const osGroups = groupByOs(shards);
  if (osGroups.length <= 1) return renderChart(shards, span, osGroups[0]?.[0]);
  return osGroups
    .map(([os, reports]) => {
      const start = Math.min(...reports.map((report) => report.start));
      const end = Math.max(...reports.map((report) => report.start + report.span));
      const normalized = reports.map((report) => ({
        ...report,
        start: report.start - start,
        grouped: reports.length > 1 || report.shardIndex !== undefined,
      }));
      return renderChart(normalized, end - start, os);
    })
    .join('\n');
}

function renderChart(shards: ShardTiming[], span: number, os?: string) {
  if (span >= 86400000) {
    return `Diagram omitted${os ? ` (${os})` : ''}: test window reaches 24 hours.\n`;
  }
  const title = shards.some((shard) => shard.grouped)
    ? 'Test distribution by shard and worker'
    : 'Test distribution by worker';
  const lines = [
    '```mermaid',
    CONFIG,
    `    title ${title}${os ? ` (${os})` : ''}`,
    `    axisFormat ${getAxisFormat(span)}`,
    '    section TOTAL TIME',
    `    ${formatDuration(span)} :active, runTotal, ${formatClock(0)}, ${span}ms`,
  ];
  shards.forEach((shard, index) => {
    lines.push(...renderShard(shard, index, { depth: 0, showReport: shard.grouped }));
  });
  return lines.concat('```', '').join('\n');
}

function groupByOs(shards: ShardTiming[]) {
  const groups = new Map<string, ShardTiming[]>();
  for (const shard of shards) {
    const os = formatOsName(shard.os);
    const reports = groups.get(os) ?? [];
    reports.push(shard);
    groups.set(os, reports);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function formatOsName(os: string | undefined) {
  if (!os || os === 'unknown') return 'Unknown OS';
  // Keep metadata from introducing Mermaid statements or HTML into labels.
  const safe = os
    .replace(/[^\p{L}\p{N} ._+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!safe) return 'Unknown OS';
  return safe.startsWith('macOS') ? safe : safe[0].toUpperCase() + safe.slice(1);
}

function renderTotal(id: string, start: number, span: number) {
  return `    ${formatDuration(span)} :${id}, ${formatClock(start)}, ${span}ms`;
}

function renderShard(
  shard: ShardTiming,
  index: number,
  { depth, showReport }: { depth: number; showReport: boolean },
) {
  const lines: string[] = [];
  const prefix = `s${index}`;
  // Mermaid groups identical section names, so distinguish reports invisibly.
  const suffix = '\u200b'.repeat(index);
  if (showReport) {
    const label =
      shard.shardIndex === undefined ? `Report ${shard.id}` : `SHARD ${shard.shardIndex}`;
    lines.push(`    section ${'\u00a0'.repeat(depth * 2)}${label}${suffix}`);
    lines.push(renderTotal(`${prefix}total`, shard.start, shard.span));
  }
  const workerDepth = depth + (showReport ? 1 : 0);
  shard.workers.forEach((blocks, workerIndex) => {
    const indent = '\u00a0'.repeat(Math.max(1, workerDepth) * 2);
    lines.push(`    section ${indent}Worker ${workerIndex + 1}${suffix}`);
    lines.push(...renderBlocks(blocks, `${prefix}w${workerIndex}`, shard.start));
  });
  return lines;
}

function getAxisFormat(span: number) {
  return span >= 3600000 ? '%H:%M' : '%M:%S';
}

function renderBlocks(blocks: WorkerTiming[], prefix: string, offset: number) {
  return blocks.map((block, index) => {
    const style = block.status === 'passed' ? 'done' : 'crit';
    const timing = `${formatClock(offset + block.start)}, ${block.duration}ms`;
    return `    \u200b :${style}, ${prefix}t${index}, ${timing}`;
  });
}

function formatClock(ms: number) {
  // Fixed local calendar date avoids today's daylight-saving transitions in Mermaid.
  return `2000-01-01 ${new Date(ms).toISOString().slice(11, 23)}`;
}
