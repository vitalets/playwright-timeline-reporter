/**
 * Card background split into two visual halves: top (toolbox) and bottom (chart).
 *
 * Why split?
 * We need the chart area to shrink between maxHeight and minHeight as the
 * viewport shrinks, while the background wraps tightly around the content.
 * With a single wrapper this is impossible in pure CSS: the wrapper's
 * flex-basis would need to include the toolbox height, but that height
 * is unknown at CSS-authoring time. Splitting lets us put flex sizing
 * (flex-basis = maxHeight + padding, min-height = minHeight + padding)
 * directly on the bottom part — no JS measurement needed.
 */
import { ReactNode, useMemo } from 'react';
import { getMinMaxHeight } from './layout.js';
import { useSelectedArea } from './state/selected-area.js';

const BORDER_RADIUS = 12;
const BORDER = '1px solid var(--card-border, transparent)';
const BG_COLOR = 'var(--chart-bg)';

const BOTTOM_PADDING_TOP = 5;
const BOTTOM_PADDING_BOTTOM = 13;
const BOTTOM_BORDER_BOTTOM = 1;
const BOTTOM_OVERHEAD = BOTTOM_PADDING_TOP + BOTTOM_PADDING_BOTTOM + BOTTOM_BORDER_BOTTOM;

export function Background({ toolbox, children }: { toolbox: ReactNode; children: ReactNode }) {
  const { workersRange } = useSelectedArea();
  const { minHeight, maxHeight } = useMemo(() => getMinMaxHeight(workersRange), [workersRange]);

  return (
    <div style={{ flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flexShrink: 0,
          borderRadius: `${BORDER_RADIUS}px ${BORDER_RADIUS}px 0 0`,
          border: BORDER,
          borderBottom: 'none',
          backgroundColor: BG_COLOR,
          padding: '13px 20px 5px',
        }}
      >
        {toolbox}
      </div>
      <div
        style={{
          flex: `0 1 ${maxHeight + BOTTOM_OVERHEAD}px`,
          minHeight: minHeight + BOTTOM_OVERHEAD,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: `0 0 ${BORDER_RADIUS}px ${BORDER_RADIUS}px`,
          border: BORDER,
          borderTop: 'none',
          backgroundColor: BG_COLOR,
          padding: `${BOTTOM_PADDING_TOP}px 20px ${BOTTOM_PADDING_BOTTOM}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
