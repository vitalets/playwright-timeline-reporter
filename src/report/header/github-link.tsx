import { GithubIcon } from '../icons/github-icon.js';

export const GITHUB_REPOSITORY_URL = 'https://github.com/vitalets/playwright-timeline-reporter';

export function GithubLink() {
  return (
    <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noreferrer" className="header-button">
      <GithubIcon width={20} height={20} />
    </a>
  );
}
