/** Provides the low-level SVG brush interaction used for chart drag selection. */
/* eslint-disable max-lines-per-function, visual/complexity */
import { type ReactNode, useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5; // px — minimum movement to start a brush instead of treating as a click
const SAFE_OFFSET = 0.01; // floating-point tolerance for snapping
const DEFAULT_SELECTION_STYLE: React.CSSProperties = {
  pointerEvents: 'none',
  fill: 'steelblue',
  fillOpacity: 0.2,
  stroke: 'steelblue',
  strokeWidth: 1,
  strokeOpacity: 0.8,
};

export type BrushExtent = { x0: number; x1: number; y0: number; y1: number };

export type BrushProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  snapX?: number[];
  snapY?: number[];
  onBrushStart?: () => void;
  /** Called with absolute SVG coordinates when a drag completes. */
  onBrushEnd?: (extent: BrushExtent) => void;
  onClick?: () => void;
  selectionStyle?: React.CSSProperties;
  children?: ReactNode;
};

export function Brush({
  left,
  top,
  width,
  height,
  snapX,
  snapY,
  onBrushStart,
  onBrushEnd,
  onClick,
  selectionStyle,
  children,
}: BrushProps) {
  const groupRef = useRef<SVGGElement>(null);
  const backgroundRef = useRef<SVGRectElement>(null);
  const [selectionExtent, setSelectionExtent] = useState<BrushExtent | null>(null);

  // Keep latest values reachable from stable event handlers without re-registering listeners.
  const boundsRef = useRef({ left, top, width, height });
  boundsRef.current = { left, top, width, height };
  const snapXRef = useRef(snapX);
  snapXRef.current = snapX;
  const snapYRef = useRef(snapY);
  snapYRef.current = snapY;
  const callbacksRef = useRef({ onBrushStart, onBrushEnd, onClick });
  callbacksRef.current = { onBrushStart, onBrushEnd, onClick };

  // Drag tracking — all mutations happen via this ref so event handlers stay stable.
  const dragRef = useRef({
    start: null as { x: number; y: number } | null,
    current: null as { x: number; y: number } | null,
    isDragging: false,
    isBackgroundTarget: false,
  });

  useEffect(() => {
    const svg = groupRef.current?.closest('svg');
    if (!svg) return;

    // Convert a MouseEvent to grid-local coordinates (clamped to grid bounds).
    const toGridCoords = (event: MouseEvent) => {
      const { left, top, width, height } = boundsRef.current;
      const svgRect = svg.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(event.clientX - svgRect.left - left, width)),
        y: Math.max(0, Math.min(event.clientY - svgRect.top - top, height)),
      };
    };

    const isInBounds = (event: MouseEvent) => {
      const { left, top, width, height } = boundsRef.current;
      const svgRect = svg.getBoundingClientRect();
      const x = event.clientX - svgRect.left - left;
      const y = event.clientY - svgRect.top - top;
      return x >= 0 && x <= width && y >= 0 && y <= height;
    };

    const computeExtent = (
      start: { x: number; y: number },
      end: { x: number; y: number },
    ): BrushExtent => {
      const snapX = snapXRef.current;
      const snapY = snapYRef.current;
      return {
        x0: snapX ? findLowerSnap(snapX, Math.min(start.x, end.x)) : Math.min(start.x, end.x),
        x1: snapX ? findUpperSnap(snapX, Math.max(start.x, end.x)) : Math.max(start.x, end.x),
        y0: snapY ? findLowerSnap(snapY, Math.min(start.y, end.y)) : Math.min(start.y, end.y),
        y1: snapY ? findUpperSnap(snapY, Math.max(start.y, end.y)) : Math.max(start.y, end.y),
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag.start) return;

      const coords = toGridCoords(event);

      if (!drag.isDragging) {
        const dx = coords.x - drag.start.x;
        const dy = coords.y - drag.start.y;
        if (Math.abs(dx) >= DRAG_THRESHOLD || Math.abs(dy) >= DRAG_THRESHOLD) {
          drag.isDragging = true;
          callbacksRef.current.onBrushStart?.();
        }
      }

      if (drag.isDragging) {
        drag.current = coords;
        setSelectionExtent(computeExtent(drag.start, coords));
      }
    };

    const handleMouseUp = () => {
      const drag = dragRef.current;

      if (drag.isDragging && drag.start && drag.current) {
        const { left, top } = boundsRef.current;
        const gridExtent = computeExtent(drag.start, drag.current);
        const absExtent: BrushExtent = {
          x0: left + gridExtent.x0,
          x1: left + gridExtent.x1,
          y0: top + gridExtent.y0,
          y1: top + gridExtent.y1,
        };
        callbacksRef.current.onBrushEnd?.(absExtent);
      } else if (!drag.isDragging && drag.isBackgroundTarget) {
        callbacksRef.current.onClick?.();
      }

      drag.start = null;
      drag.current = null;
      drag.isDragging = false;
      drag.isBackgroundTarget = false;
      setSelectionExtent(null);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!isInBounds(event)) return;

      const coords = toGridCoords(event);
      dragRef.current.start = coords;
      dragRef.current.current = coords;
      dragRef.current.isDragging = false;
      dragRef.current.isBackgroundTarget = event.target === backgroundRef.current;

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    svg.addEventListener('mousedown', handleMouseDown);
    return () => {
      svg.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []); // stable — all live values accessed via refs

  return (
    <g ref={groupRef} style={{ cursor: 'crosshair' }}>
      {/* Background rect: provides a hit area so the crosshair cursor shows between bars */}
      <rect ref={backgroundRef} x={left} y={top} width={width} height={height} fill="transparent" />
      {children}
      {/* Selection rect rendered last so it appears on top of children */}
      {selectionExtent && (
        <rect
          x={left + selectionExtent.x0}
          y={top + selectionExtent.y0}
          width={Math.max(0, selectionExtent.x1 - selectionExtent.x0)}
          height={Math.max(0, selectionExtent.y1 - selectionExtent.y0)}
          style={{ ...DEFAULT_SELECTION_STYLE, ...selectionStyle }}
        />
      )}
    </g>
  );
}

function findLowerSnap(snaps: number[], value: number) {
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i] < value + SAFE_OFFSET) return snaps[i];
  }
  return value;
}

function findUpperSnap(snaps: number[], value: number) {
  for (let i = 0; i < snaps.length; i++) {
    if (snaps[i] > value - SAFE_OFFSET) return snaps[i];
  }
  return value;
}
