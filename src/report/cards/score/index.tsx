import { ChartData } from '../../data/index.js';
import { Card } from '../card.js';
import { calcScore } from './calc-score.js';
import { ScoreTooltip } from './score-tooltip.js';

export function ScoreCard({ chartData }: { chartData: ChartData }) {
  const score = calcScore(chartData);
  return (
    <Card
      label="Score"
      value={`${score}%`}
      valueType={score >= 60 ? 'good' : 'bad'}
      tooltip={<ScoreTooltip />}
    />
  );
}
