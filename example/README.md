# Playwright Timeline Reporter – Example

This example demonstrates how to generate the timeline report from a single (non-sharded) Playwright run that exercises a single `authenticate` fixture (defined in `tests/fixtures.ts`) plus five spec files across three workers. The tests intentionally avoid real network/page usage; instead they rely on the exported `delay()` helper to simulate work and occasionally throw `Error` objects to emulate failures. This keeps the scenario fully offline while still producing a rich timeline that includes both passing and failing segments.

## Steps

1. Install dependencies from the repository root:

```sh
npm install
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

Open `example/timeline-report/index.html` in a browser to explore worker utilization, hooks, and fixture durations from that run.
