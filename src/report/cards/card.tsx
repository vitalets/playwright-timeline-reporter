import { ReactNode } from 'react';
import { TooltipButton } from './tooltip.js';

type ValueType = 'normal' | 'good' | 'bad';

export function Card({
  label,
  value,
  valueType = 'normal',
  tooltip,
}: {
  label: string;
  value: ReactNode;
  valueType?: ValueType;
  tooltip?: ReactNode;
}) {
  const valueColor = getValueColor(valueType);

  return (
    <article className="card">
      <h2 className="card-label">
        {label}
        {tooltip && <TooltipButton>{tooltip}</TooltipButton>}
      </h2>
      <div className="card-value" style={{ color: valueColor }}>
        {value}
      </div>
    </article>
  );
}

function getValueColor(type: ValueType) {
  switch (type) {
    case 'good':
      return 'var(--card-value-good)';
    case 'bad':
      return 'var(--card-value-bad)';
    default:
      return 'inherit';
  }
}
