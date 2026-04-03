import { ChartData } from '../../data/index.js';
import { Card } from '../card.js';

export function ShardsCard({ chartData }: { chartData: ChartData }) {
  const mergeReports = Object.values(chartData.runInfo.mergeReports);
  const shards = mergeReports.filter((r) => r.shardIndex !== undefined);

  if (shards.length) {
    return <Card label="Shards" value={shards.length} />;
  }

  if (mergeReports.length) {
    return <Card label="Merge Reports" value={mergeReports.length} />;
  }

  return null;
}
