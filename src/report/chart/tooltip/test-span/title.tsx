import { ChartSpan } from '../../../data/tests.js';

export function Title({ chartSpan }: { chartSpan: ChartSpan }) {
  return (
    <div
      style={{
        fontWeight: 600,
        fontSize: 16,
        marginBottom: 4,
        wordBreak: 'break-word',
      }}
    >
      {chartSpan.title}
    </div>
  );
}
