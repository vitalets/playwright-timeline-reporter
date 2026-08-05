/** Displays the complete error message for a selected test execution. */
export function ErrorDialog({ error, onClose }: { error?: string; onClose: () => void }) {
  if (!error) return null;
  return (
    <div className="test-error-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="test-error-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-error-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <h3 id="test-error-dialog-title">Test error</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <pre>{error}</pre>
      </section>
    </div>
  );
}
