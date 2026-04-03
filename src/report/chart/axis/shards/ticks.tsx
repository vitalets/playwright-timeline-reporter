import { Fragment } from 'react';
import { useLayout } from '../../layout.js';
import { ChartMergeReportInfo } from './helpers.js';

export function AxisTicks({ infos }: { infos: ChartMergeReportInfo[] }) {
  const { shardsBox: shards, gridBox: grid } = useLayout();
  // Add infos[0].y2 to draw the first tick
  const yList = [infos[0].y2, ...infos.map((info) => info.y1)];

  return (
    <>
      {yList.map((y, index) => {
        return (
          <Fragment key={index}>
            <line
              x1={shards.left}
              y1={y}
              x2={grid.left}
              y2={y}
              stroke="var(--chart-border-color)"
              strokeWidth="2"
            />
            <line
              x1={grid.left}
              y1={y}
              x2={grid.x2}
              y2={y}
              stroke="var(--chart-border-color)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </Fragment>
        );
      })}
    </>
  );
}
