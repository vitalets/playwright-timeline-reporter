<p align="center">
  <img src="src/report/favicon.svg" width="64" alt="Playwright Timeline Reporter icon">
</p>

<h1 align="center">Playwright Timeline Reporter</h1>

<div align="center">

[![lint status](https://github.com/vitalets/playwright-timeline-reporter/actions/workflows/lint.yml/badge.svg)](https://github.com/vitalets/playwright-timeline-reporter/actions/workflows/lint.yml)
[![test status](https://github.com/vitalets/playwright-timeline-reporter/actions/workflows/test.yml/badge.svg)](https://github.com/vitalets/playwright-timeline-reporter/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/playwright-timeline-reporter)](https://www.npmjs.com/package/playwright-timeline-reporter)
[![license](https://img.shields.io/npm/l/playwright-timeline-reporter)](https://www.npmjs.com/package/playwright-timeline-reporter)

</div>

**Playwright Timeline Reporter** renders your [Playwright](https://playwright.dev/) tests as an interactive timeline. You can use it to optimize your test run performance:

- identify slow tests
- detect costly or repeated hooks and fixtures
- evaluate worker utilization
- get ready-to-use prompt for AI analysis

Plug it into any Playwright project and get a self-contained HTML report.

## Live Demo

<p align="center">
  <a href="https://vitalets.github.io/playwright-timeline-reporter/demos/index.html">
    <img src="https://vitalets.github.io/playwright-timeline-reporter/demos/screenshot.png" alt="Timeline report screenshot">
  </a>
  <br>
  <em>Click the screenshot to open the live report ↗</em>
</p>

> Also check out the **sharded** report [demo](https://vitalets.github.io/playwright-timeline-reporter/demos/shards.html).

## Installation

Install with any package manager:

### npm

```sh
npm install --save-dev playwright-timeline-reporter
```

### pnpm

```sh
pnpm add --save-dev playwright-timeline-reporter
```

### Yarn

```sh
yarn add --dev playwright-timeline-reporter
```

## Configuration

Add the reporter to your `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['playwright-timeline-reporter']
  ],
});
```

Additionally, you can provide [options](#options):

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['playwright-timeline-reporter', { /* reporter options */ }],
  ],
});
```

## Usage

Run your tests and open `./timeline-report/index.html` in any browser.

In the report you can do the following:

- **Review the timeline** to spot the slowest spans.
- **Hover any span** to inspect its type, details, and source location.
- **Click spans** to isolate a specific test, hook, or fixture.
- **Inspect restart markers** to understand worker restart reasons.
- **Switch projects** to isolate project-specific bottlenecks.
- **Focus on a worker or shard** by clicking its label.
- **Select a region** to zoom in for deeper investigation.
- **Search** for files, tests, tags, or error messages.
- **Copy the AI prompt** and paste it into any AI chat for analysis.

> [!NOTE]
> **Your input is appreciated:** you can help improve the reporter by upvoting these Playwright issues: [#38350](https://github.com/microsoft/playwright/issues/38350), [#38962](https://github.com/microsoft/playwright/issues/38962), [#40175](https://github.com/microsoft/playwright/issues/40175).

## Sharding

For sharded runs, configure each shard to produce a **blob report**, then merge them into a single timeline.

**1. Run each shard with the blob reporter:**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['blob']
  ],
});
```

```sh
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3
```

**2. Merge the blob reports:**

```sh
npx playwright merge-reports --reporter=playwright-timeline-reporter ./blob-report
```

Open `./timeline-report/index.html` to see the unified timeline across all shards.

> For more details on sharding see the [Playwright sharding docs](https://playwright.dev/docs/test-sharding).

## GitHub Summary report

If you run tests on GitHub, you can get a compact worker timeline report directly in your workflow run summary:

<!-- Add a screenshot  -->

See the [example workflow](.github/workflows/example.yml) and
[sharding example workflow](.github/workflows/example-sharding.yml).
Their demo tests intentionally fail, so the test steps use `continue-on-error`
to keep the workflows green while generating the GitHub summary despite those
failures. A successful example workflow does not mean all demo tests passed.

To enable it, set the `markdown` option:
```ts
reporter: [['playwright-timeline-reporter', { markdown: true }]],
```

Or add `--reporter=playwright-timeline-reporter/markdown` to the test run command:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ...
      - run: npx playwright test --reporter=playwright-timeline-reporter/markdown
```

## Options

#### `outputFile`

- **Type:** `string`
- **Default:** `./timeline-report/index.html`
- **Env var:** `PLAYWRIGHT_TIMELINE_OUTPUT_FILE`

Path for the generated report file, relative to config dir.

#### `markdown`

- **Type:** `boolean | string`
- **Default:** `false` (`true` for the `/markdown` entry point)

Enables the Markdown timeline report. Set `true` to write `./timeline-report/index.md`,
a string to specify a path relative to config dir, or `false` to disable it.
In GitHub Actions, the report is also automatically appended to the workflow run
summary. See [GitHub Summary report](#github-summary-report).

#### `promptTemplateFile`

- **Type:** `string`
- **Default:** —

Path to a custom LLM prompt template, must contain `{data}` exactly once. See the [default prompt](https://github.com/vitalets/playwright-timeline-reporter/blob/main/src/report/cards/prompt/default-prompt.ts).

#### `debug`

- **Type:** `boolean`
- **Default:** `false`
- **Env var:** `PLAYWRIGHT_TIMELINE_DEBUG`

Enables debug logging in the reporter and extra debug details in the generated HTML report.

Example with options:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    [
      'playwright-timeline-reporter',
      {
        outputFile: './reports/timeline.html',
        debug: true,
      },
    ],
  ],
});
```

## Learning Playwright

You can also use this reporter to better understand and visualize different Playwright concepts. Feel free to add timelines to your posts and presentations. Deploy it to GitHub Pages and share a link with your readers so they can explore the chart themselves.

Example articles: 

- [Playwright in Pictures: Fully Parallel Mode](https://dev.to/vitalets/playwright-in-pictures-fully-parallel-mode-3ecj)
- [Playwright in Pictures: Why Workers Restart?](https://dev.to/vitalets/playwright-in-pictures-why-workers-restart-34bp)
- [Playwright in Pictures: How Fixtures Work](https://dev.to/vitalets/playwright-in-pictures-how-fixtures-work-3oe3)

## Integration with Playwright HTML Reporter

You can integrate a link to the timeline inside Playwright's built-in HTML report:

<img width="600" src="https://vitalets.github.io/playwright-timeline-reporter/link-in-html-reporter.png" alt="Timeline in HTML reporter">

Add a timeline report link to the `metadata` object in the Playwright config:
```ts
export default defineConfig({
  metadata: {
    timeline: 'https://path/to/uploaded/timeline/index.html',
  }
});
```

Then open the HTML report with a **special hash** `#show-metadata-other`:
```
http://localhost:9323/#show-metadata-other
```

> Customization of Playwright HTML report is a bit awkward, see [#35614](https://github.com/microsoft/playwright/issues/35614).

## Data Privacy

The reporter embeds all collected data directly into the generated HTML file. It does not send it to any third-party services. Your data remains local unless you choose to share the HTML file yourself.

## Limitations

Playwright's API does not provide a reliable way to reconstruct worker lanes exactly as they were executed ([#40175](https://github.com/microsoft/playwright/issues/40175)). This reporter does its best to approximate the original worker distribution, but in some cases the lane assignment may be not 100% accurate.

If you notice a bug or have any feedback, feel free to [open an issue](https://github.com/vitalets/playwright-timeline-reporter/issues).

## Packages to speedup tests

- [@global-cache/playwright](https://github.com/vitalets/global-cache) - Cache and reuse data between Playwright workers.
- [request-mocking-protocol](https://github.com/vitalets/request-mocking-protocol) - Mock client-side and server-side API calls in tests.

## License

This project is licensed under the [MIT License](https://github.com/vitalets/playwright-timeline-reporter/blob/main/LICENSE).

The generated report includes attribution links to this repository and the sponsor page. You are welcome to use and modify the tool freely — please keep those links intact in the report output.

## Markdown reporter

Use the separate entry point to generate a compact Mermaid Gantt in Markdown:

```ts
import { defineConfig } from '@playwright/test';
import type { MarkdownReporterOptions } from 'playwright-timeline-reporter/markdown';

const markdownOptions: MarkdownReporterOptions = {
  markdown: './reports/timeline.md', // Optional; default: timeline-report/index.md
};

export default defineConfig({
  reporter: [
    ['list'],
    ['playwright-timeline-reporter/markdown', markdownOptions],
  ],
});
```

The Markdown path is always set with `markdown`, on either entry point. Use `true`
for the default path, a string for a custom path, or `false` to disable it.
The `/markdown` entry point enables Markdown by default; the main entry point does not.
`outputFile` configures HTML only. Relative paths resolve from the Playwright config
folder, or cwd when no config exists. Parent directories are created, and each run
replaces the local Markdown file. The Markdown reporter does not create HTML or read
`PLAYWRIGHT_TIMELINE_OUTPUT_FILE`. Its runtime does not depend on Mermaid or a browser.

When `GITHUB_STEP_SUMMARY` is nonempty, the reporter also appends the report there,
separated from existing content by blank lines. No token, PR comment, custom Action,
or separate `cat` command is needed. Without this variable, only the local file is
written. Existing Summary content is never overwritten. If the resolved Summary
and output paths are identical, a single append replaces the normal overwrite.
Use distinct paths to retain a separate full local copy.

### Reading the diagram

The report contains a small heading, total time, and a Mermaid worker timeline.
There is no table or explanatory footer. Indented rows are labeled Worker 0, Worker 1,
and so on, with unique display numbers across shards and projects.

Green blocks combine consecutive successful tests in the same worker process,
including gaps between them. Each failed, timed-out, or interrupted attempt gets a
separate red block. Retries retain their own colors, and restarts start new blocks.
Skipped results and results without an actual worker are excluded. Zero-duration
executions have no separate visible block.

Each shard starts at 00:00. Total time is the longest observed test window
across shards, excluding setup before the first attempt and teardown after
the last. Worker rows represent project-local parallel slots; separate reports and
projects never combine, even when their slot indexes match. These are activity
windows rather than exact process lifetimes or CPU usage.

Missing report identity produces an omission message instead of a chart. This relies
on internal Playwright blob result IDs, so compatibility checks matter when upgrading.
The chart is also omitted for windows of 24 hours or more; total time is retained.
If the GitHub step summary has insufficient space for the chart, only the heading,
total time, and a short omission notice are appended. A full summary is left unchanged.
The local file retains the complete report.

GitHub controls Mermaid rendering and zoom. The chart reserves 190 pixels on the
right for its controls; narrow containers may still require scrolling.

### GitHub Actions: one run

Commit a config with the Markdown reporter and use the normal test command:

```yaml
name: Playwright timeline
on: [push, workflow_dispatch]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

These checkout/setup-node major versions follow this repository's current CI.
Your lockfile must include a package version with the `/markdown` entry point.
For testing an unreleased implementation, first build and install an `npm pack`
tarball; version 1.1.1 from the registry does not contain this entry point.

### GitHub Actions: sharded run

Use standard Playwright blob reports and `merge-reports`:

```yaml
name: Playwright timeline
on: [push, workflow_dispatch]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/2 --reporter=blob
      - uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 1
  timeline:
    needs: test
    if: ${{ !cancelled() }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v8
        with:
          pattern: blob-report-*
          path: all-blob-reports
          merge-multiple: true
      - run: >
          npx playwright merge-reports
          --reporter=playwright-timeline-reporter/markdown
          ./all-blob-reports
```

Browser installation is unnecessary in the merge job. The Summary appears in that
job. Failed tests remain visible in the shard jobs; successful report generation
does not mean the tests passed. `--reporter=blob` intentionally overrides config
reporters so each shard does not generate its own Summary. No custom merge script
or JSON transport is required.

### HTML and Markdown together

Enable both formats with a single reporter entry:

```ts
export default defineConfig({
  reporter: [['playwright-timeline-reporter', { markdown: true }]],
});
```

Use a string to customize the Markdown path independently:

```ts
export default defineConfig({
  reporter: [['playwright-timeline-reporter', {
    outputFile: './reports/timeline.html',
    markdown: './reports/timeline.md',
  }]],
});
```

The main entry point always generates HTML; `markdown` defaults to `false`.
The `/markdown` entry point generates only Markdown. You can also configure the
two entry points separately:

```ts
// playwright.merge.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['playwright-timeline-reporter'],
    ['playwright-timeline-reporter/markdown'],
  ],
});
```

```sh
npx playwright merge-reports --config=playwright.merge.config.ts ./all-blob-reports
```

The defaults create `timeline-report/index.html` and `timeline-report/index.md`
independently. HTML is not published automatically. You can upload the directory
with `actions/upload-artifact` as an additional workflow step.

### Summary size and write failures

GitHub limits one step's Summary to 1 MiB. The reporter uses a conservative **900 KiB
budget**, including the existing file's UTF-8 bytes and separators. If the full
report does not fit, it keeps the heading and total time with a short omission notice.
If that does not fit, it warns and leaves the existing Summary unchanged. Mermaid is never
truncated mid-block. With distinct output and Summary paths, the full local file
is preserved independently of this budget.

Failure to append the additional GitHub channel emits a warning and does not change
test results. Primary output errors propagate through Playwright's reporter error
handling, as with the HTML reporter. Writes assume sequential use within a step;
concurrent append from multiple processes is not coordinated.

The visual reference is the [fixed prototype at commit cc46b114](https://github.com/vitalets/playwright-demos/tree/cc46b1148fd04ca58e033f59215a05a50d23181a/github-summary-report).
Its GitHub screenshots and workflow results describe the prototype, not validation
of this package implementation.
