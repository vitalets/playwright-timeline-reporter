const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export function formatTime(ms: number) {
  if (ms === 0) return '0s';
  if (ms < 100) {
    return Math.round(ms) + 'ms';
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return seconds.toFixed(1) + 's';
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}

export function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Prefer UA Client Hints where available.
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  if (brands?.some((b) => /chrom/i.test(b.brand))) return true;

  // Fallback to legacy user agent string.
  const ua = navigator.userAgent;
  return /(Chrome|Chromium|CriOS|Edg|OPR)/i.test(ua);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function readJson(selector: string): unknown {
  const dataEl = document.querySelector(selector);
  if (!dataEl) {
    throw new Error(`Element not found for selector "${selector}"`);
  }

  const raw = dataEl.textContent?.trim();
  if (!raw) {
    throw new Error(`Element "${selector}" has no content`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON from element "${selector}": ${error}`);
  }
}
