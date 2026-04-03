/**
 * Renders badge rows for a hovered test, hook, or fixture span tooltip.
 */
import { ChartSpan } from '../../../data/tests.js';
import { formatTime } from '../../../utils.js';
import { Badge } from '../badge.js';

interface Field {
  label: string;
  value: string;
}

interface FieldsProps {
  chartSpan: ChartSpan;
}

export function Badges({ chartSpan }: FieldsProps) {
  const fields: Field[] = [
    ...getDurationBadge(chartSpan),
    ...getRetryBadge(chartSpan),
    // these are not very informative
    // ...getInvocationsBadge(chartSpan),
    // ...getWorkerIndexBadge(chartSpan),
  ];

  const rows: Field[][] = [];
  for (let i = 0; i < fields.length; i += 3) {
    rows.push(fields.slice(i, i + 3));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingTop: 6,
      }}
    >
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: 6 }}>
          {row.map((field) => (
            <Badge key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
      ))}
    </div>
  );
}

function getDurationBadge(chartSpan: ChartSpan): Field[] {
  return [{ label: 'Duration', value: formatTime(chartSpan.span.duration) }];
}

function getRetryBadge(chartSpan: ChartSpan): Field[] {
  if (chartSpan.test.retry === 0) return [];
  return [{ label: 'Retry', value: String(chartSpan.test.retry) }];
}
