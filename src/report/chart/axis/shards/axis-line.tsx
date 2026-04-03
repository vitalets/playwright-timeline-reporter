import { useLayout } from '../../layout.js';

export function AxisLine() {
  const { top, x2, y2 } = useLayout().shardsBox;
  return (
    <line x1={x2} y1={top} x2={x2} y2={y2} stroke="var(--chart-border-color)" strokeWidth="2" />
  );
}
