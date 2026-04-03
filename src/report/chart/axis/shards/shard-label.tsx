/**
 * Renders a label centered and rotated -90°, shrinking to fit the
 * available slot without ever enlarging. Replicates visx scaleToFit="shrink-only"
 * using native SVG: measures getComputedTextLength() in a useLayoutEffect (before
 * the browser paints), then applies matrix(scale) + rotate(-90) transform.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { useLayout } from '../../layout.js';
import { MergeReportInfo } from '../../../../run-info.js';
import { ChartMergeReportInfo } from './helpers.js';

const LABEL_PADDING = 6;

type ShardLabelProps = {
  info: ChartMergeReportInfo;
  onClick: (mergeReport: MergeReportInfo) => void;
};

export function ShardLabel({ info, onClick }: ShardLabelProps) {
  const { left, width } = useLayout().shardsBox;
  const textRef = useRef<SVGTextElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const centerX = left + width / 2;
  const centerY = (info.y1 + info.y2) / 2;
  const text = getLabelText(info.mergeReport);
  const availableTextWidth = info.y2 - info.y1 - 2 * LABEL_PADDING;

  useLayoutEffect(() => {
    if (textRef.current) {
      const realTextWidth = textRef.current.getComputedTextLength();
      setScale(Math.min(1, availableTextWidth / realTextWidth));
    }
  }, [text, availableTextWidth]);

  // Replicate visx's matrix: scale around (cx, cy), then rotate -90° around (cx, cy).
  const s = scale ?? 1;
  const transform = getLabelTransform(centerX, centerY, s);

  return (
    <text
      ref={textRef}
      x={centerX}
      y={centerY}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="var(--page-text)"
      transform={transform}
      visibility={scale === null ? 'hidden' : 'visible'}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(info.mergeReport)}
    >
      {text}
    </text>
  );
}

function getLabelText(mergeReport: MergeReportInfo) {
  const shardIndex = mergeReport.shardIndex;
  return shardIndex ? `SHARD ${shardIndex}` : `REPORT ${mergeReport.reportId}`;
}

function getLabelTransform(centerX: number, centerY: number, scale: number) {
  const offsetX = centerX * (1 - scale);
  const offsetY = centerY * (1 - scale);
  return `matrix(${scale}, 0, 0, ${scale}, ${offsetX}, ${offsetY}) rotate(-90, ${centerX}, ${centerY})`;
}
