<p align="center">
  <img src="src/report/favicon.svg" width="64" alt="Playwright Timeline Reporter icon">
</p>

<h1 align="center">Playwright Timeline Reporter</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/playwright-timeline-reporter"><img src="https://img.shields.io/npm/v/playwright-timeline-reporter" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/playwright-timeline-reporter"><img src="https://img.shields.io/npm/l/playwright-timeline-reporter" alt="license"></a>
</p>

**Playwright Timeline Reporter** visualizes your test suite execution as an interactive timeline. Identify slow tests, detect costly repeated hooks, and understand worker utilization. Plug it into any Playwright project and get a self-contained HTML report with zero extra infrastructure.

## Live Demos

### Basic

<p align="center">
  <a href="https://vitalets.github.io/playwright-timeline-reporter/basic/">
    <img src="docs/screenshots/basic.png" alt="Basic timeline report screenshot">
  </a>
  <br>
  <em>Click the screenshot to open the live report ↗</em>
</p>

### With Sharding

<p align="center">
  <a href="https://vitalets.github.io/playwright-timeline-reporter/shards/">
    <img src="docs/screenshots/shards.png" alt="Sharded timeline report screenshot">
  </a>
  <br>
  <em>Click the screenshot to open the live report ↗</em>
</p>

## Features

- Per-test fixture and hook breakdown
- Worker and shard segmentation
- Worker restart points
- Per-project filtering
- Zoom controls (worker, shard, arbitrary range)
- Full-text test search
- Worker utilization score
- AI-ready optimization prompt

## Installation

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

## Usage

Add the reporter to your `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { timelineReporter } from 'playwright-timeline-reporter';

export default defineConfig({
  reporter: [
    timelineReporter(),
    // ...other reporters
  ],
});
```

After your test run, open `./timeline-report/index.html` in any browser.

### Usage With Sharding

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

## Options

| Option               | Type     | Default                        | Description                                                                                                                                                                                                       |
| -------------------- | -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outputFile`         | `string` | `./timeline-report/index.html` | Path for the generated report file                                                                                                                                                                                |
| `promptTemplateFile` | `string` | —                              | Path to a custom LLM prompt template; must contain `{data}` exactly once. See the [default prompt](https://github.com/vitalets/playwright-timeline-reporter/blob/main/src/report/cards/prompt/default-prompt.ts). |

Example with options:

```ts
export default defineConfig({
  reporter: [
    timelineReporter({
      outputFile: './my-reports/timeline.html',
    }),
  ],
});
```

## License

This project is licensed under the [MIT License](https://github.com/vitalets/playwright-timeline-reporter/blob/main/LICENSE).

The generated report includes attribution links to this repository and the sponsor page. You are welcome to use and modify the tool freely — please keep those links intact in the report output.
