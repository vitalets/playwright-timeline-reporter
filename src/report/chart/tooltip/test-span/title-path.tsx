/** Renders the tooltip title path for a chart span. */
import { ChartSpan } from '../../../data/tests.js';

export function TitlePath({ chartSpan }: { chartSpan: ChartSpan }) {
  const parts = buildTitleParts(chartSpan);

  if (parts.length === 0) return null;

  const displayParts = parts.length > 3 ? [parts[0], '…', ...parts.slice(-2)] : parts;

  return (
    <div
      style={{
        color: 'var(--tooltip-text-muted)',
        fontSize: 14,
        marginBottom: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {displayParts.join(' › ')}
    </div>
  );
}

function buildTitleParts(chartSpan: ChartSpan): string[] {
  const { test, span } = chartSpan;
  const isTestBody = span.type === 'testBody';
  const titlePath = test.testBody.title;
  const suitePath = titlePath.slice(0, -1);
  const testName = titlePath[titlePath.length - 1];
  const parts: string[] = [];

  if (test.projectName) {
    parts.push(test.projectName);
  }

  parts.push(...suitePath);

  if (!isTestBody && testName) {
    parts.push(testName);
  }

  return parts;
}
