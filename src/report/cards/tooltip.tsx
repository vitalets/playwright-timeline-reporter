/**
 * Tooltip button (trigger + popover), shared tooltip header, and tooltip body for card tooltips.
 */
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { InfoIcon } from '../icons/info-icon.js';

const TOOLTIP_WIDTH = 240;
const TOOLTIP_MARGIN = 16;

export function TooltipHeader({ children }: { children: string }) {
  return <div className="tooltip-header">{children}</div>;
}

export function TooltipBody({ children }: { children: ReactNode }) {
  return <div className="tooltip-body">{children}</div>;
}

export function TooltipButton({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffectMouseDown(open, containerRef, setOpen);
  useEffectScroll(open, setOpen);

  const handleClick = () => {
    if (!open && triggerRef.current) {
      setTooltipStyle(getTooltipPosition(triggerRef.current));
    }
    setOpen((isOpen) => !isOpen);
  };

  return (
    <span ref={containerRef} className="tooltip-button">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-label="Card information"
        aria-expanded={open}
        className="tooltip-button__trigger"
      >
        <InfoIcon style={{ width: 14, height: 14 }} />
      </button>
      {open && (
        <span role="tooltip" className="tooltip-button__content" style={tooltipStyle}>
          {children}
        </span>
      )}
    </span>
  );
}

/** Computes the fixed tooltip position anchored below the trigger, clamped within the viewport. */
function getTooltipPosition(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(centerX - TOOLTIP_WIDTH / 2, TOOLTIP_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN,
  );
  return { top: rect.bottom + 6, left };
}

/** Closes the tooltip when a mousedown event occurs outside the tooltip container. */
function useEffectMouseDown(
  open: boolean,
  containerRef: React.RefObject<HTMLSpanElement | null>,
  setOpen: (v: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    const handleDocumentMouseDown = ({ target }: MouseEvent) => {
      if (!containerRef.current?.contains(target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [open]);
}

/**
 * Closes the tooltip when the user scrolls. The listener is registered with a 100ms delay
 * to avoid closing immediately due to tap-induced micro-scrolls on mobile.
 */
function useEffectScroll(open: boolean, setOpen: (v: boolean) => void) {
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    // Delay scroll listener to ignore any tap-induced micro-scroll on mobile.
    const scrollTimer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    }, 100);
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [open]);
}
