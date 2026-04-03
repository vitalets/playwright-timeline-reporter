/**
 * Renders the sponsor call-to-action in the report header.
 */
import { SponsorsIcon } from '../icons/sponsors-icon.js';

const SPONSOR_URL = 'https://github.com/sponsors/vitalets';

export function SponsorsLink() {
  return (
    <a
      href={SPONSOR_URL}
      target="_blank"
      rel="noreferrer"
      className="header-button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        paddingRight: '2px',
      }}
    >
      <SponsorsIcon width={16} height={16} fill="#ea4aaa" />
      Sponsor
    </a>
  );
}
