# Agent Rules

- Ask clarifying questions if any requirement, behavior, or constraint is ambiguous. Do not start implementation until all open questions are resolved.

- Place React components in separate files. The only exception is when the component is very small and tightly coupled to its parent.

- If a React component has up to three props, inline those props in the function signature instead of defining a separate props type.

- Add a concise JSDoc comment at the top of every file you create or edit describing the purpose of the file.

- When suppressing ESLint for a single line, use the `// eslint-disable-next-line ...` form, not `// eslint-disable-line ...`.

- After any change to TypeScript files, run `npm run tsc`.
