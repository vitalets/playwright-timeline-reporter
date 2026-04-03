/**
 * Dedicated button that closes the search dialog from the header area.
 */
export function SearchCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="search-dialog-action-button search-dialog-close"
      onClick={onClose}
      aria-label="Close search dialog"
      title="Close search (Esc)"
    >
      <span aria-hidden="true" className="search-dialog-close-icon">
        ×
      </span>
    </button>
  );
}
