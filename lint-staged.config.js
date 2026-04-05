/** Configures staged-file formatting, linting, and type-checking for pre-commit. */
export default {
  '{**/*.ts,**/*.tsx,tsconfig.json,package-lock.json}': () => 'npm run tsc',
  '*.{ts,tsx,js}': ['eslint --fix', 'prettier --write'],
  '!*.{ts,tsx,js}': 'prettier --write --ignore-unknown',
};
