/** Shows the hovered span type label with its color swatch in the tooltip header. */
import type { Span } from '../../../../test-timings/types.js';
import { getSeriesConfig, getSpanFill } from '../../series/config.js';

export function SpanType({ span }: { span: Span }) {
  const seriesConfig = getSeriesConfig(span);
  const typeLabel = `${seriesConfig.label.toUpperCase()}${span.error ? ` (Failed)` : ''}`;
  const fill = getSpanFill(span);

  return (
    <div
      style={{
        color: 'var(--tooltip-text-muted)',
        fontSize: 12,
        letterSpacing: '0.04em',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <svg width={12} height={12}>
        <circle
          cx={6}
          cy={6}
          r={6}
          fill={fill}
          stroke="black"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      </svg>
      {typeLabel}
    </div>
  );
}
