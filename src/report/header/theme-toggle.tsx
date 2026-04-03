import { toggleTheme } from '../theme-storage.js';
import { ThemeIcon } from '../icons/theme-icon.js';

export function ThemeToggle() {
  return (
    <button type="button" className="header-button" onClick={toggleTheme}>
      <ThemeIcon width={24} height={24} />
    </button>
  );
}
