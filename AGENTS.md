# Agent Rules

## Project Structure

- This project has two main halves:
  - Node-side reporter code: collects Playwright data, processes timings, and generates the self-contained report. Main path: `src/` excluding `src/report/`.
  - Browser-side report app: renders the interactive HTML report in React, including chart, cards, tooltips, and styles. Main path: `src/report/`.

## Coding Guidelines

- Add a concise JSDoc comment at the top of every source file you create describing the purpose of the file.

- In every file, place exported functions and components before non-exported helper functions. Try to order helper functions as they are used in the main exported component/function.

- Place React components in separate files. The only exception is when the component is very small and tightly coupled to its parent.

- If a React component has up to three props, inline those props in the function signature instead of defining a separate props type.

- When suppressing ESLint for a single line, use the `// eslint-disable-next-line ...` form, not `// eslint-disable-line ...`.

- After any change to TypeScript files, run `npm run tsc`.
