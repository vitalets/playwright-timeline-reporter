/**
 * Render a shared error panel for report-level and React rendering errors.
 */

export function ReportError({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 12,
        backgroundColor: 'var(--chart-bg)',
        padding: '13px 20px',
        color: 'var(--color-danger, #e05252)',
      }}
    >
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</pre>
    </div>
  );
}
