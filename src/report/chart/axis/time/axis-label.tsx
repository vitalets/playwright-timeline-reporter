/**
 * Renders the axis label centered below the tick labels.
 */
import { useAlignShards } from '../../state/align-shards.js';
import { Rect } from '../../lib/types.js';

const AXIS_LABEL_OFFSET_Y = 34;

export function AxisLabel({ box }: { box: Rect }) {
  const { shardsAligned } = useAlignShards();
  const { left, top, width, height } = box;
  return (
    <text
      x={left + width / 2}
      y={top + height + AXIS_LABEL_OFFSET_Y}
      textAnchor="middle"
      dominantBaseline="hanging"
      fontSize={14}
      fill="var(--page-text)"
      style={{ userSelect: 'none' }}
    >
      {shardsAligned ? 'Time from shard start' : 'Time from start'}
    </text>
  );
}
