/** Assemble prepared report data into the Markdown heading and chart. */
import type { MarkdownData } from './reporter-data.js';
import { renderMermaid } from './mermaid.js';

const HEADER = '### Playwright timeline report\n\n';

export function renderMarkdown({ span, shards, error }: MarkdownData) {
  if (error) return `${HEADER}Timeline omitted: ${error}\n`;
  return HEADER + renderMermaid(shards, span);
}
