# Playwright Timeline Reporter – Example

This example generates HTML and Markdown timeline reports from a Playwright run
with two projects and three workers. The tests use Chromium, visit playwright.dev,
and add simulated delays to hooks and fixtures. Some tests and fixtures deliberately
fail to demonstrate failures and worker restarts. Internet access is required.

## Steps

1. Install dependencies from the repository root:

```sh
npm install
npx playwright install chromium
```

2. Build the reporter so Playwright can import the compiled output:

```sh
npm run build
```

3. Run the sample tests from the `example` folder (the config uses `workers: 3`). Expect a few tests to fail—this is deliberate to showcase failure rendering:

```sh
cd example
npm install
npm run test
```

Open `timeline-report/index.html` from the example folder in a browser to explore
worker utilization, hooks, and fixture durations. The Markdown report is saved to
`timeline-report/index.md`.

## GitHub Actions example

The [example workflow](../.github/workflows/example.yml)
builds the local reporter and runs these tests. The reporter automatically appends
the Markdown timeline to the job summary. The workflow uploads the reports as the
`example-timeline-report` artifact, including when tests fail.

[View successful example runs](https://github.com/vitalets/playwright-timeline-reporter/actions/workflows/example.yml?query=branch%3Amain+is%3Asuccess).
You can also start a run manually from the workflow's Actions page.
