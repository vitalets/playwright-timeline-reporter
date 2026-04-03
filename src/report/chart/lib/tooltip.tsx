/**
 * Tooltip that flips horizontally/vertically when it would exceed viewport boundaries.
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export type TooltipState<T> = {
  left: number;
  top: number;
  data: T | undefined;
  visible: boolean;
};

export function useTooltip<T>() {
  const [state, setState] = useState<TooltipState<T>>({
    visible: false,
    data: undefined,
    left: 0,
    top: 0,
  });

  const show = useCallback(({ data, left, top }: Omit<TooltipState<T>, 'visible'>) => {
    setState({ visible: true, data, left, top });
  }, []);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return { ...state, show, hide };
}

export function BaseTooltip({
  left,
  top,
  offset = 0,
  visible = true,
  style,
  children,
}: {
  left: number;
  top: number;
  offset?: number;
  visible?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = left + offset;
    if (x + rect.width > vw) x = left - offset - rect.width;
    x = Math.max(0, Math.min(x, vw - rect.width));

    let y = top + offset;
    if (y + rect.height > vh) y = top - offset - rect.height;
    y = Math.max(0, Math.min(y, vh - rect.height));

    node.style.transform = `translate(${x}px, ${y}px)`;
  }, [left, top, offset]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${left + offset}px, ${top + offset}px)`,
        willChange: 'transform',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'opacity 120ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
