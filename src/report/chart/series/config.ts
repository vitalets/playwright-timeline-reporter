import { Span } from '../../../test-timings/types.js';
import { FIXTURE_ERROR_PATTERN_ID, getPatternId, PatternName } from './tests/patterns.js';

export const WORKER_RESTART_SERIES_ID = 'workerRestart';

export const SERIES: SeriesConfig[] = [
  {
    id: 'workerFixture',
    label: 'Worker Fixture',
    labelWidth: 82.45,
    color: 'var(--color-worker-fixture)',
    pattern: 'diagonal',
  },
  {
    id: 'workerHook',
    label: 'Worker Hook',
    labelWidth: 73.31,
    color: 'var(--color-worker-hook)',
  },
  {
    id: 'testFixture',
    label: 'Test Fixture',
    labelWidth: 65.98,
    color: 'var(--color-test-fixture)',
    pattern: 'diagonal',
  },
  {
    id: 'testHook',
    label: 'Test Hook',
    labelWidth: 56.85,
    color: 'var(--color-test-hook)',
  },
  {
    id: 'testBody',
    label: 'Test Body',
    labelWidth: 56.11,
    color: 'var(--color-test-body)',
  },
];

export type SeriesConfig = {
  id: string;
  label: string;
  labelWidth: number;
  color: string;
  pattern?: PatternName;
};

// eslint-disable-next-line visual/complexity
export function getSeriesId(span: Span) {
  const { type } = span;
  const scope = 'scope' in span ? span.scope : 'test';
  if (type === 'fixture') return scope === 'worker' ? 'workerFixture' : 'testFixture';
  if (type === 'hook') return scope === 'worker' ? 'workerHook' : 'testHook';
  return 'testBody';
}

export function getSeriesConfig(span: Span) {
  const key = getSeriesId(span);
  return SERIES.find((s) => s.id === key)!;
}

export function getSpanFill(span: Span) {
  const seriesConfig = getSeriesConfig(span);
  if (span.error && seriesConfig.pattern === 'diagonal') {
    return `url(#${FIXTURE_ERROR_PATTERN_ID})`;
  }
  if (span.error) return 'var(--color-failure)';
  return getSeriesFill(seriesConfig);
}

export function getSeriesFill(seriesConfig: SeriesConfig) {
  return seriesConfig.pattern ? `url(#${getPatternId(seriesConfig)})` : seriesConfig.color;
}

/*
Script to measure label widths:

(() => {
  const labels = [
    'Worker Fixture',
    'Worker Hook',
    'Test Fixture',
    'Test Hook',
    'Test Body',
  ];

  const fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
  const fontSize = 12;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // hidden SVG mount
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'fixed';
  svg.style.left = '-9999px';
  svg.style.top = '-9999px';
  svg.style.visibility = 'hidden';
  svg.style.pointerEvents = 'none';

  document.body.appendChild(svg);

  try {
    const results = labels.map((text) => {
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('font-family', fontFamily);
      t.setAttribute('font-size', String(fontSize));
      t.textContent = text;

      svg.appendChild(t);

      // getComputedTextLength is the most direct "SVG text width" measurement
      const width = t.getComputedTextLength();

      svg.removeChild(t);

      return { text, font: `${fontSize}px ${fontFamily}`, widthPx: Number(width.toFixed(2)) };
    });

    console.table(results);
  } finally {
    svg.remove();
  }
})();
*/
