type ThemeName = 'light' | 'dark';

const LOCAL_STORAGE_KEY = 'playwright-timeline-theme';

export function initTheme() {
  const theme = getThemeFromLocalStorage() ?? 'dark';
  setThemeToDocument(theme);
}

export function toggleTheme() {
  const currentTheme = getThemeFromDocument();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setThemeToDocument(newTheme);
  saveThemeToLocalStorage(newTheme);
}

function getThemeFromLocalStorage() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) as ThemeName | null;
}

function getThemeFromDocument(): ThemeName {
  return document.documentElement.getAttribute('data-theme') as ThemeName;
}

function setThemeToDocument(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme);
}

function saveThemeToLocalStorage(theme: ThemeName) {
  localStorage.setItem(LOCAL_STORAGE_KEY, theme);
}
