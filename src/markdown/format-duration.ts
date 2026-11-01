/** Format Markdown durations using hours, minutes, seconds, and milliseconds. */
export function formatDuration(ms: number) {
  ms = Math.round(ms);
  if (ms < 1000) return `${ms}ms`;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = (ms % 60000) / 1000;
  return [hours && `${hours}h`, minutes && `${minutes}m`, seconds && `${seconds}s`]
    .filter(Boolean)
    .join(' ');
}
