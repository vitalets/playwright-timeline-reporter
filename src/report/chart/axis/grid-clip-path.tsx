import { useLayout } from '../layout.js';

const GRID_CLIP_PATH_ID = 'grid-clip-path';

/**
 * Renders the clip rect definition for the grid area.
 * Must be placed inside the top-level SVG <defs> element.
 */
export function GridClipPathDef() {
  const { gridBox: grid } = useLayout();
  const { left, top, width, height } = grid;
  return (
    <clipPath id={GRID_CLIP_PATH_ID}>
      <rect x={left} y={top} width={width} height={height} />
    </clipPath>
  );
}

/**
 * Wraps children in a <g> clipped to the grid area.
 * Requires GridClipPathDef to be present in the top-level SVG <defs>.
 */
export function GridClipPath({ children }: { children?: React.ReactNode }) {
  return <g clipPath={`url(#${GRID_CLIP_PATH_ID})`}>{children}</g>;
}
