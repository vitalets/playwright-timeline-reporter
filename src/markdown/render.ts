/** Assemble prepared report data into the Markdown heading, total time, and chart. */
import type { MarkdownData } from './reporter-data.js';
import { renderMermaid } from './mermaid.js';

const HEADER = '### Playwright timeline report\n\n';

export function renderMarkdown({ span, workers, error }: MarkdownData) {
  if (error) return `${HEADER}Timeline omitted: ${error}\n`;
  const header = `${HEADER}Total time: **${span} ms**\n\n`;
  const diagram =
    span >= 86400000
      ? 'Diagram omitted: test window reaches 24 hours.\n'
      : renderMermaid(workers, span);
  return header + diagram;
}
