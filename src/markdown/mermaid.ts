/** Render worker activity as a Mermaid Gantt chart. */
import type { ShardTiming, WorkerTiming } from './reporter-data.js';
import { formatDuration } from './format-duration.js';

const CONFIG = `---
displayMode: compact
config:
  theme: base
  themeVariables:
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
  if (!shards.some((shard) => shard.workers.length)) return 'No worker activity to plot.\n';
  const title = shards.some((shard) => shard.grouped)
    ? 'Test distribution by shard and worker'
    : 'Test distribution by worker';
  const lines = [
    '```mermaid',
    CONFIG,
    `    title ${title}`,
    `    axisFormat ${getAxisFormat(span)}`,
  ];
  shards.forEach((shard, shardIndex) => {
    if (!shard.workers.length) return;
    const prefix = `s${shardIndex}`;
    const label =
      shard.shardIndex === undefined ? `Report ${shard.id}` : `SHARD ${shard.shardIndex}`;
    if (shard.grouped) {
      lines.push(`    section ${label}`);
      lines.push(
        `    ${formatDuration(shard.span)} :${prefix}total, ${formatClock(shard.start)}, ${shard.span}ms`,
      );
    }
    shard.workers.forEach((blocks, workerIndex) => {
      // Mermaid groups identical section names, so distinguish shards invisibly.
      const sectionSuffix = '\u200b'.repeat(shardIndex);
      lines.push(`    section \u00a0\u00a0Worker ${workerIndex + 1}${sectionSuffix}`);
      lines.push(...renderBlocks(blocks, `${prefix}w${workerIndex}`, shard.start));
    });
  });
  return lines.concat('```', '').join('\n');
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
