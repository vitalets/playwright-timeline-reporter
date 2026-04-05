import type { RunInfo } from '../../run-info.js';
import { parsePlaywrightUserAgent } from '../data/user-agent.js';
import { formatDate } from '../utils.js';
import { TitleChip } from './title-chip.js';

export function Chips({ runInfo }: { runInfo: RunInfo }) {
  const runAt = formatDate(new Date(runInfo.startTime));
  const chips = [
    { label: 'Test run', value: runAt },
    { label: 'OS', value: getOsName(runInfo) },
    { label: 'Node.js', value: runInfo.nodeVersion },
    { label: 'Playwright', value: `v${runInfo.playwrightVersion}` },
  ];

  return (
    <div className="header-chips">
      <TitleChip version={`v${runInfo.reporterVersion}`} />
      {chips.map((chip) => (
        <Chip key={chip.label} label={chip.label} value={chip.value} />
      ))}
    </div>
  );
}

function getOsName(runInfo: RunInfo): string {
  const mergeReports = Object.values(runInfo.mergeReports);
  if (!mergeReports.length) return runInfo.osName;

  const osValues = mergeReports.map((r) => parsePlaywrightUserAgent(r.userAgent).os);
  const unique = new Set(osValues);
  return unique.size === 1 ? [...unique][0] : 'multiple';
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="header-chip">
      <span className="header-chip-label">{label}</span>
      <span className="header-chip-value">{value}</span>
    </span>
  );
}
