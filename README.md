# Playwright Timeline Reporter

A Playwright reporter that turns execution traces (tests, hooks, fixtures) into a horizontal timeline rendered with Apache ECharts. It is designed to be consumed via `npx playwright merge-reports` so multiple shards can be combined into a single visualization.

## Quick start

1. Install the package next to your Playwright config (currently locally via the repo):

```sh
npm install playwright-timeline-reporter
```

2. Run your usual Playwright suite while emitting blob output (per shard):

```sh
npx playwright test --reporter=blob
```

3. Merge the blobs and generate the HTML timeline (defaults to `timeline-report/index.html`):

```sh
npx playwright merge-reports --reporter=playwright-timeline-reporter blob-report
```

Open the generated HTML file to inspect worker utilization, long hooks, and fixtures. The legend highlights hooks/fixtures so slow setup/teardown is easy to spot.

## Reporter options

```ts
import { defineConfig } from '@playwright/test';
import { timelineReporter } from 'playwright-timeline-reporter';

export default defineConfig({
  reporter: [
    timelineReporter({
      outputFile: 'timeline-report/index.html',
      promptTemplate: `Review this Playwright run and suggest the top performance improvements.

Context:
{data}`,
    }),
  ],
});
```

`promptTemplate` is used by the report's `Prompt` card. It must contain the `{data}` placeholder exactly once. At copy time, the reporter replaces that placeholder with a summary of the current run metrics shown in the report.

## Example project

The `example/` folder contains a minimal Playwright suite exercising hooks and custom fixtures. After `npm install && npm run build` in the repo root:

```sh
cd example
npm install
npm run test
npm run report
```

Then open `example/timeline-report/index.html` in a browser.
