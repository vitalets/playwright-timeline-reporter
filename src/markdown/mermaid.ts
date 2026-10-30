/** Render worker activity as a Mermaid Gantt chart. */
import type { WorkerTiming } from './reporter-data.js';

const CONFIG = `---
displayMode: compact
config:
  theme: base
  themeVariables:
    doneTaskBkgColor: "#2da44e"
    doneTaskBorderColor: "#238636"
    critBkgColor: "#cf222e"
    critBorderColor: "#a40e26"
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

export function renderMermaid(workers: WorkerTiming[][], span: number) {
  if (!workers.length) return 'No worker activity to plot.\n';
  const lines = [
    '```mermaid',
    CONFIG,
    `    axisFormat ${getAxisFormat(span)}`,
    `    tickInterval ${getTickInterval(span)}`,
  ];
  workers.forEach((blocks, workerIndex) => {
    lines.push(`    section \u00a0\u00a0Worker ${workerIndex}`);
    lines.push(...renderBlocks(blocks, `w${workerIndex}`));
  });
  return lines.concat('```', '').join('\n');
}

function getAxisFormat(span: number) {
  return span >= 3600000 ? '%H:%M' : '%M:%S';
}

function getTickInterval(span: number) {
  if (span < 15000) return '1second';
  if (span < 120000) return '10second';
  if (span < 1200000) return '1minute';
  if (span < 7200000) return '10minute';
  return '1hour';
}

function renderBlocks(blocks: WorkerTiming[], prefix: string) {
  return blocks.map((block, index) => {
    const style = block.status === 'passed' ? 'done' : 'crit';
    const timing = `${formatClock(block.start)}, ${block.duration}ms`;
    return `    \u200b :${style}, ${prefix}t${index}, ${timing}`;
  });
}

function formatClock(ms: number) {
  // Fixed local calendar date avoids today's daylight-saving transitions in Mermaid.
  return `2000-01-01 ${new Date(ms).toISOString().slice(11, 23)}`;
}
