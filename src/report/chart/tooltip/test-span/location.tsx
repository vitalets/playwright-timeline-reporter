import type { Span } from '../../../../test-timings/types.js';

export function Location({ span }: { span: Span }) {
  if (!span.location?.file) return null;

  const { file, line, column } = span.location;
  const locationStr = [file, line, column].join(':');

  return (
    <div
      style={{
        color: 'var(--tooltip-text-muted)',
        fontSize: 13,
        marginBottom: 6,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
      }}
    >
      {locationStr}
    </div>
  );
}
