/**
 * Renders the prompt action button and switches between clipboard copy and file download.
 */
import { useEffect, useState } from 'react';
import { CopyIcon } from '../../icons/copy-icon.js';
import { DownloadIcon } from '../../icons/download-icon.js';

const MAX_PROMPT_COPY_CHARS = 30_000;
const PROMPT_DOWNLOAD_FILENAME = 'prompt-timeline-reporter.md';
type PromptAction = 'copy' | 'download';

const COPIED_TEXT_DURATION_MS = 1000;

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const action = getPromptAction(text);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_TEXT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    if (action === 'copy') {
      await writeToClipboard(text);
      setCopied(true);
    } else {
      downloadPrompt(text);
    }
  }

  return (
    <span style={{ fontSize: '1.1rem' }}>
      {copied ? (
        <span>Copied</span>
      ) : (
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
            fontSize: 'inherit',
          }}
        >
          {action === 'copy' ? (
            <CopyIcon width={14} height={14} />
          ) : (
            <DownloadIcon width={14} height={14} />
          )}
          Prompt
        </button>
      )}
    </span>
  );
}

async function writeToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fallback for local-file reports where the async clipboard API is unavailable.
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function downloadPrompt(text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = PROMPT_DOWNLOAD_FILENAME;
  link.style.display = 'none';

  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function getPromptAction(text: string): PromptAction {
  return text.length > MAX_PROMPT_COPY_CHARS ? 'download' : 'copy';
}
