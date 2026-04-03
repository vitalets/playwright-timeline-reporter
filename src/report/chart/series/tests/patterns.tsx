import { SERIES, SeriesConfig } from '../config.js';

export type PatternName = 'diagonal';

export const FIXTURE_ERROR_PATTERN_ID = 'series-pattern-fixture-error';

export function getPatternId(seriesConfig: SeriesConfig) {
  return `series-pattern-${seriesConfig.id}-${seriesConfig.pattern}`;
}

export function Patterns() {
  return (
    <>
      {SERIES.map((seriesConfig, i) => (
        <Pattern key={i} seriesConfig={seriesConfig}></Pattern>
      ))}
      <PatternDiagonal id={FIXTURE_ERROR_PATTERN_ID} color="var(--color-failure)" />
    </>
  );
}

function Pattern({ seriesConfig }: { seriesConfig: SeriesConfig }) {
  if (seriesConfig.pattern === 'diagonal') {
    const patternId = getPatternId(seriesConfig);
    return <PatternDiagonal id={patternId} color={seriesConfig.color} />;
    // return <PatternDots id={patternId} color={seriesConfig.color} />;
  }
}

function PatternDiagonal({ id, color }: { id: string; color: string }) {
  const size = 6;
  const stripeWidth = 1.2;

  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width={size}
      height={size}
      patternTransform={`rotate(45 ${size / 2} ${size / 2})`}
    >
      {/* background */}
      <rect width={size} height={size} fill={color} />

      {/* stripe */}
      <rect
        x={(size - stripeWidth) / 2}
        y={0}
        width={stripeWidth}
        height={size}
        fill="var(--bar-pattern-color)"
      />
    </pattern>
  );
}
