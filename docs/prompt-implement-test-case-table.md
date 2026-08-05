# LLM Implementation Prompt: Searchable Test-Case Table

Implement the searchable, sortable test-case table described in
[`prd-test-case-table.md`](./prd-test-case-table.md) in this repository.

## Objective

Extend the browser-side interactive HTML report with a table that renders every recorded Playwright
test execution. Users must be able to search by test name and sort by test name or total duration,
so they can quickly locate failed tests and identify the longest-running executions.

## Repository context

- Repository: `playwright-timeline-reporter`
- Browser report application: `src/report/`
- Existing report data is embedded in the generated HTML as `#timeline-data` and read as
  `TestTimings[]` in `src/report/app.tsx`.
- The existing data model is `src/test-timings/types.ts`.
- `buildChartData` and `ReportDataProvider` show existing browser-side data patterns.
- There is already a command-palette search in `src/report/chart/search/`. Do not replace or alter
  it: it searches/focuses the chart. The new table needs its own visible inline search input that
  filters table rows.
- CSS is imported through `src/report/css/index.css`; existing light/dark theme variables are in
  the theme CSS files.

## Required behaviour

1. Add a table section to the report app. Place it directly below the summary cards and above the
   timeline chart unless the existing layout makes another placement clearly more coherent.
2. Create one row for every `TestTimings` record in `#timeline-data`, including retries. Do not
   deduplicate by `testId` and do not modify the generated JSON or Node-side reporter pipeline.
3. Every row must show:
   - full test title path from `testBody.title`;
   - Playwright status;
   - human-readable `totalDuration`;
   - project name when meaningful;
   - retry number when applicable;
   - merged-report/shard context when available.
4. Add a visible, labelled search input above or beside the table.
   - Filter while typing.
   - Match the full test title path case-insensitively with substring matching.
   - Preserve the currently selected sort while filtering.
   - Show an explicit empty state when there are no matches.
   - Clearing the input restores every row.
5. Make Test name and Duration column headers sortable.
   - First activation sorts ascending; second activation reverses the direction.
   - Initial state preserves input data order (no default sort).
   - Name sorting must be deterministic and alphabetical/locale-aware.
   - Duration sorting must use numeric milliseconds, not the display text.
   - Use deterministic tie-breaking so equal values do not reorder unpredictably.
   - Expose the active sort direction both visually and accessibly, e.g. `aria-sort` on the active
     table header.
6. Make statuses distinct without colour alone. Use semantic table markup and keyboard-operable
   search/sort controls. The result must work in current light and dark themes.
7. On narrow viewports, keep essential data usable. Horizontal scrolling is acceptable; do not
   remove or make inaccessible test name, status, or duration.
8. The report must remain self-contained: no network calls, server, added reporter option, or
   consumer-side Playwright configuration change.

## Constraints and coding conventions

- Read and follow `AGENTS.md` before editing.
- Add a concise JSDoc comment at the top of every new file under `src/`.
- Put exported functions/components before non-exported helpers.
- Keep React components in separate files unless a component is very small and tightly coupled to
  its parent.
- Prefer a table-specific view model/helper built from existing `TestTimings` data. Do not create a
  second serialized report data format.
- Reuse existing utilities and theme variables where they fit; avoid unrelated refactors and
  dependency additions unless they are genuinely necessary.
- Keep the command-palette search and its chart focus behaviour unchanged.
- Do not change the public reporter API, report schema, reporter options, or test collection code.

## Suggested implementation shape

- Add a `src/report/test-table/` feature area with a main React component, focused helpers for row
  mapping/filtering/sorting, and any small child components needed for search or sortable headers.
- Pass the existing raw `TestTimings[]` from `AppContent` to the table, or expose it through an
  existing report-data context if that yields a simpler, well-typed interface. Do not reconstruct
  test attempts by flattening chart spans.
- Add a dedicated stylesheet and import it from `src/report/css/index.css`.
- Only render project, retry, and shard context columns when they add information for the current
  report; always render test name, status, and duration.

## Testing and verification

Add focused automated coverage for:

- one rendered row per input `TestTimings` entry, including retries;
- full-title, case-insensitive substring search and clear/reset behaviour;
- explicit no-matches state;
- ascending and descending name sorting;
- ascending and descending numeric-duration sorting;
- active sorting remaining in effect after search;
- status and formatted duration rendering;
- reports with projects and merged/sharded data where relevant.

Use the repository’s existing test approach and fixtures where possible. Do not introduce brittle
tests coupled to incidental markup.

After implementation, run at least:

```bash
npm run tsc
npm run lint
npm run test:e2e
```

Run any focused additional tests you add. If practical, run `npm run test:all` before declaring the
work complete. Report exactly which commands passed or failed and summarize the changed files.

## Definition of done

- All acceptance criteria in `docs/prd-test-case-table.md` are satisfied.
- Existing report generation works unchanged with current Playwright configurations and embedded
  JSON data.
- The new table is visually integrated with the current report, is accessible, and works in both
  themes.
- TypeScript, lint, and relevant tests pass.
