import type { Span } from '../../../../test-timings/types.js';

export function ErrorBlock({ span }: { span: Span }) {
  if (!span.error) return null;

  const { message } = span.error;
  const { truncatedMessage } = truncateMessage(message.trim(), 200);

  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 10px',
        background: 'var(--tooltip-error-bg)',
        border: '1px solid var(--tooltip-error-border)',
        borderRadius: 6,
        color: 'var(--tooltip-error-text)',
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxWidth: 400,
      }}
    >
      <div style={{ opacity: 0.9 }}>{truncatedMessage}</div>
    </div>
  );
}

function truncateMessage(
  message: string,
  maxLength: number,
): { truncatedMessage: string; isTruncated: boolean } {
  if (message.length <= maxLength) {
    return { truncatedMessage: message, isTruncated: false };
  }

  const lineBreakIndex = message.indexOf('\n', maxLength);
  if (lineBreakIndex !== -1) {
    return { truncatedMessage: message.slice(0, lineBreakIndex) + '\n...', isTruncated: true };
  }

  return { truncatedMessage: message.slice(0, maxLength) + '...', isTruncated: true };
}
