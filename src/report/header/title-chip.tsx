import { LogoIcon } from '../icons/logo-icon.js';
import { GITHUB_REPOSITORY_URL } from './github-link.js';

export function TitleChip({ version }: { version: string }) {
  return (
    <span className="header-chip">
      <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noreferrer" className="title-chip-link">
        <LogoIcon style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
        <span className="title-chip-text">Playwright Timeline Reporter</span>
      </a>
      <span className="header-chip-value">{version}</span>
    </span>
  );
}
