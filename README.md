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

**Playwright Timeline Reporter** visualizes your [Playwright](https://playwright.dev/) tests as an interactive timeline.

Helps you optimize test performance:

- identify slow tests
- detect costly or repeated hooks and fixtures
- evaluate worker utilization
- generate ready-to-use prompt for AI analysis

Plug it into any Playwright project and get a self-contained HTML report.

## Live Demo

<p align="center">
  <a href="https://vitalets.github.io/playwright-timeline-reporter/demos/index.html">
    <img src="https://vitalets.github.io/playwright-timeline-reporter/demos/screenshot.png" alt="Timeline report screenshot">
  </a>
  <br>
  <em>Click the screenshot to open the live report ↗</em>
</p>

> Also check out the [sharded report demo](https://vitalets.github.io/playwright-timeline-reporter/demos/shards.html).

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
  reporter: [['playwright-timeline-reporter']],
});
```

After your test run, open `./timeline-report/index.html` in any browser.

## Options

#### `outputFile`

- **Type:** `string`
- **Default:** `./timeline-report/index.html`
- **Env var:** `PLAYWRIGHT_TIMELINE_OUTPUT_FILE`

Path for the generated report file, relative to config dir.

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

## Usage

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
> **Your input is appreciated:** you can make the reporter even better by upvoting these issues in the Playwright repo: [#38350](https://github.com/microsoft/playwright/issues/38350), [#38962](https://github.com/microsoft/playwright/issues/38962), [#40175](https://github.com/microsoft/playwright/issues/40175)

## Sharding

For sharded runs, configure each shard to produce a blob report, then merge them into a single timeline.

**1. Run each shard with the blob reporter:**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['blob']],
});
```

```sh
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3
```

**2. Merge the blob reports:**

```sh
npx playwright merge-reports --reporter=playwright-timeline-reporter/reporter ./blob-report
```

Open `./timeline-report/index.html` to see the unified timeline across all shards.

> For more details on sharding see the [Playwright sharding docs](https://playwright.dev/docs/test-sharding).

## Limitations

Playwright's API does not provide a reliable way to reconstruct worker lanes exactly as they were executed ([#40175](https://github.com/microsoft/playwright/issues/40175)). This reporter does its best to approximate the original worker distribution, but in some cases the lane assignment may be not 100% accurate.

## Packages to speedup tests

- [@global-cache/playwright](https://github.com/vitalets/global-cache) - Cache and reuse data between Playwright workers.
- [request-mocking-protocol](https://github.com/vitalets/request-mocking-protocol) - Mock server-side API calls in tests.

## License

This project is licensed under the [MIT License](https://github.com/vitalets/playwright-timeline-reporter/blob/main/LICENSE).

The generated report includes attribution links to this repository and the sponsor page. You are welcome to use and modify the tool freely — please keep those links intact in the report output.
