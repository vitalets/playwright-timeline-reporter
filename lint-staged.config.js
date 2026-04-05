export default {
  '{**/*.ts,**/*.tsx,tsconfig.json,package-lock.json}': () => 'npm run tsc',
  '*.{ts,tsx,js}': 'eslint --fix',
};
