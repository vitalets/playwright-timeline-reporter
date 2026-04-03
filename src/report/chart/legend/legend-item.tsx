import { getSeriesFill, SeriesConfig } from '../series/config.js';

type LegendItemProps = {
  seriesConfig: SeriesConfig;
  isSelected: boolean;
  onClick: () => void;
};

export function LegendItem({ seriesConfig, isSelected, onClick }: LegendItemProps) {
  const fill = getSeriesFill(seriesConfig);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        cursor: 'pointer',
        opacity: isSelected ? 1 : 0.5,
        userSelect: 'none',
      }}
    >
      <svg
        width={22}
        height={13}
        style={{
          flexShrink: 0,
          border: '1px solid rgba(0,0,0,0.5)',
          borderRadius: 3,
          boxSizing: 'border-box',
        }}
      >
        <rect x={0} y={0} width="100%" height="100%" fill={fill} />
      </svg>
      <span style={{ fontSize: 13, color: 'var(--page-text)', whiteSpace: 'nowrap' }}>
        {seriesConfig.label}
      </span>
    </div>
  );
}
