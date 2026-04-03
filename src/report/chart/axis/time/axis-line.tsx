/**
 * Renders the horizontal axis line spanning the chart width.
 */

export function AxisLine({ x1, x2, top }: { top: number; x1: number; x2: number }) {
  return (
    <line x1={x1} x2={x2} y1={top} y2={top} stroke="var(--chart-border-color)" strokeWidth={1} />
  );
}
