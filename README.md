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

**Playwright Timeline Reporter** renders your [Playwright](https://playwright.dev/) tests as an interactive timeline and helps you optimize test run performance. Plug it into any Playwright project and get a self-contained HTML report.

## Live Demo

<p align="center">
  <a href="https://vitalets.github.io/playwright-timeline-reporter/demos/index.html">
    <img src="https://vitalets.github.io/playwright-timeline-reporter/demos/screenshot.png" alt="Timeline report screenshot">
  </a>
  <br>
  <em>Click the screenshot to open the live report ↗</em>
</p>

> Also check out the [sharded report demo](https://vitalets.github.io/playwright-timeline-reporter/demos/shards.html).

## Features

- **Span isolation:** click a test, hook, or fixture to focus on it.
- **Worker restart markers:** inspect why workers restarted.
- **Project filtering:** isolate project-specific bottlenecks.
- **Worker and shard filtering:** click a label to focus on its timeline.
- **Region zoom:** select a region for deeper investigation.
- **Search:** find files, tests, tags, or error messages.
- **AI analysis:** copy a ready-to-use prompt into any AI chat.

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

## Usage

Add the reporter to your `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['playwright-timeline-reporter']
  ],
});
```

Run your tests and open `./timeline-report/index.html` in any browser.

See [Options](#options) for customization.

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

In GitHub Actions, you can add a compact worker timeline to your workflow run summary.
Enable Markdown alongside the HTML report with the `markdown` option:

```ts
reporter: [['playwright-timeline-reporter', { markdown: true }]],
```

To generate only Markdown, use the `/markdown` entry point:

```sh
npx playwright test --reporter=playwright-timeline-reporter/markdown
```

For [sharded runs](#sharding), use it when merging the blob reports:

```sh
npx playwright merge-reports --reporter=playwright-timeline-reporter/markdown ./all-blob-reports
```

See the [example workflow](.github/workflows/example.yml) and
[sharding example workflow](.github/workflows/example-sharding.yml).

To omit the GitHub summary report while keeping the Markdown file, clear
`GITHUB_STEP_SUMMARY` for the command:

```sh
GITHUB_STEP_SUMMARY='' npx playwright test
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

The reporter works within the limits of Playwright's API. In particular, worker lanes are approximated and may not exactly match the original execution. Related Playwright requests ([#38350](https://github.com/microsoft/playwright/issues/38350), [#38962](https://github.com/microsoft/playwright/issues/38962), [#40175](https://github.com/microsoft/playwright/issues/40175)) were closed as not planned.

If you notice a bug or have any feedback, feel free to [open an issue](https://github.com/vitalets/playwright-timeline-reporter/issues).

## Packages to speedup tests

- [@global-cache/playwright](https://github.com/vitalets/global-cache) - Cache and reuse data between Playwright workers.
- [request-mocking-protocol](https://github.com/vitalets/request-mocking-protocol) - Mock client-side and server-side API calls in tests.

## License

This project is licensed under the [MIT License](https://github.com/vitalets/playwright-timeline-reporter/blob/main/LICENSE).

The generated report includes attribution links to this repository and the sponsor page. You are welcome to use and modify the tool freely — please keep those links intact in the report output.
