import { ReactNode } from 'react';

interface BadgeProps {
  label: string;
  value: ReactNode;
}

export function Badge({ label, value }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--card-border)',
        borderRadius: 6,
        overflow: 'hidden',
        fontSize: 14,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          color: 'var(--tooltip-text-muted)',
          padding: '3px 6px',
          background: 'var(--tooltip-tag-label-bg)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontWeight: 600,
          padding: '3px 6px',
          background: 'var(--tooltip-tag-value-bg)',
        }}
      >
        {value}
      </span>
    </span>
  );
}
