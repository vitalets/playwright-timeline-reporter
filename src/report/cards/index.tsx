/**
 * Renders the summary cards shown above the timeline chart.
 */
import { ChartData } from '../data/index.js';
import { formatTime } from '../utils.js';
import { Card } from './card.js';
import { FullyParallelCard } from './fully-parallel/index.js';
import { PromptCard } from './prompt/index.js';
import { ScoreCard } from './score/index.js';
import { ShardsCard } from './shards/index.js';

export function Cards({
  chartData,
  promptTemplate,
}: {
  chartData: ChartData;
  promptTemplate: string;
}) {
  const { runInfo } = chartData;

  return (
    <section className="cards-grid">
      <Card label="Total duration" value={formatTime(runInfo.duration)} />
      <ShardsCard chartData={chartData} />
      <Card
        label={chartData.isMergeReports ? 'Total Workers' : 'Workers'}
        value={chartData.workers.length}
      />
      <Card label="Worker Restarts" value={chartData.restarts.length} />
      <Card label="Projects" value={chartData.projects.length || '-'} />
      <FullyParallelCard runInfo={runInfo} />
      <ScoreCard chartData={chartData} />
      <PromptCard chartData={chartData} promptTemplate={promptTemplate} />
    </section>
  );
}
