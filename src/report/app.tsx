/**
 * Load report data and render the full report app with shared error handling.
 */
import type { RunInfo } from '../run-info.js';
import type { TestTimings } from '../test-timings/types.js';
import { Cards } from './cards/index.js';
import { Chart } from './chart/index.js';
import { buildChartData } from './data/index.js';
import { ReportErrorBoundary } from './error-boundary.js';
import { ReportError } from './error.js';
import { Header } from './header/index.js';
import { initTheme } from './theme-storage.js';
import { readJson } from './utils.js';

initTheme();

export function App() {
  return (
    <ReportErrorBoundary>
      <AppContent />
    </ReportErrorBoundary>
  );
}

function AppContent() {
  const timingsData = (readJson('#timeline-data') as TestTimings[]).map((t) => ({
    ...t,
    tags: t.tags ?? [],
  }));
  const runInfo = readJson('#run-info') as RunInfo;
  const promptTemplate = readJson('#prompt-template') as string;
  const chartData = buildChartData(timingsData, runInfo);

  return (
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
        <Chart chartData={chartData} />
      )}
    </div>
  );
}
