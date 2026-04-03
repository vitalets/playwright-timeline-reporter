/**
 * Renders the report header and its action buttons.
 */
import { GithubLink } from './github-link.js';
import { SponsorsLink } from './sponsors-link.js';
import { ThemeToggle } from './theme-toggle.js';
import type { RunInfo } from '../../run-info.js';
import { Chips } from './chips.js';

export function Header({ runInfo }: { runInfo: RunInfo }) {
  return (
    <header className="report-header">
      <Chips runInfo={runInfo} />
      <div className="report-header-actions">
        <SponsorsLink />
        <GithubLink />
        <ThemeToggle />
      </div>
    </header>
  );
}
