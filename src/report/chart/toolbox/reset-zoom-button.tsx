/** Renders the reset-zoom control and adapts its inactive styling to the current zoom state. */
import { ResetIcon } from './reset-icon.js';
import { useSelectedArea } from '../state/selected-area.js';

export function ResetZoomButton() {
  const { isZoomed, resetSelectedArea } = useSelectedArea();
  const className = `reset-zoom-button ${
    isZoomed ? 'reset-zoom-button-active' : 'reset-zoom-button-inactive'
  }`;

  return (
    <button
      disabled={!isZoomed}
      onClick={resetSelectedArea}
      title="Tip: press Escape to reset zoom"
      className={className}
    >
      <ResetIcon width="24" height="24" style={{ marginTop: -4 }} />
      Reset Zoom
    </button>
  );
}
