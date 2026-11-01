/** Assemble prepared report data into the Markdown heading, total time, and chart. */
import type { MarkdownData } from './reporter-data.js';
import { renderMermaid } from './mermaid.js';
import { formatDuration } from './format-duration.js';

const HEADER = '### Playwright timeline report\n\n';

export function renderMarkdown({ span, shards, error }: MarkdownData) {
  if (error) return `${HEADER}Timeline omitted: ${error}\n`;
  const title = shards.some((shard) => shard.grouped)
    ? 'Test distribution by shard and worker'
    : 'Test distribution by worker';
  const header = `${HEADER}Total test time: **${formatDuration(span)}**\n\n#### ${title}\n\n`;
  const diagram =
    span >= 86400000
      ? 'Diagram omitted: test window reaches 24 hours.\n'
      : renderMermaid(shards, span);
  return header + diagram;
}
