/**
 * Bootstrap the report application and render the chart or a report-level error state.
 */
import { createRoot } from 'react-dom/client';
import { readJson } from './utils.js';
import type { RunInfo } from '../run-info.js';
import type { TestTimings } from '../test-timings/types.js';
import { buildChartData } from './data/index.js';
import { initTheme } from './theme-storage.js';
import { Header } from './header/index.js';
import { Cards } from './cards/index.js';
import { Chart } from './chart/index.js';
import { ChartErrorBoundary } from './error-boundary.js';
import { ReportError } from './error.js';

initTheme();
document.addEventListener('DOMContentLoaded', main);

function main() {
  const timingsData = (readJson('#timeline-data') as TestTimings[]).map((t) => ({
    ...t,
    tags: t.tags ?? [],
  }));
  const runInfo = readJson('#run-info') as RunInfo;
  const promptTemplate = readJson('#prompt-template') as string;
  const chartData = buildChartData(timingsData, runInfo);

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        gap: 18,
      }}
    >
      <Header runInfo={runInfo} />
      <Cards chartData={chartData} promptTemplate={promptTemplate} />
      {runInfo.reporterError ? (
        <ReportError message={runInfo.reporterError} />
      ) : (
        <ChartErrorBoundary>
          <Chart chartData={chartData} />
        </ChartErrorBoundary>
      )}
    </div>,
  );
}
