# Worker-lanes algorithm

Distributes Playwright test timings into visual lanes for the timeline chart.

## Why this algorithm is needed

By default Playwright runs test files in parallel across the configured worker pool, but keeps tests within each file sequential on a single worker — so files map 1-to-1 to lanes. But there are settings that change this behavior:

- Root config `fullyParallel: true` makes every test run independently, so each test gets its own worker slot.
- Root config `workers: N` limits the total number of concurrent workers across all projects.
- Per-project `workers` / `fullyParallel` override the global defaults for that project only.
- `test.describe.configure({ mode: 'parallel' })` inside a file or describe block makes that subset run in parallel, even when the rest of the suite does not.

Simply mapping `parallelIndex → lane` does not work reliably:

- When a project has fewer workers than the global maximum, its tests reuse low `parallelIndex` values that are also used by other projects, causing apparent collisions.
- Near the end of a run, remaining active workers shift down to fill lower `parallelIndex` slots, making the same index mean different physical workers at different points in time.

This algorithm therefore derives the actual lane assignment purely from observed
timing data (`workerIndex`, `parallelIndex`, `startTime`, `duration`), with no
dependency on any Playwright config flags.

## Phase 1 — Marker analysis (`marker-analysis.ts`)

Each test contributes a `start` and `end` timing marker. Markers are sorted by time
(end-before-start on ties, to avoid counting boundary moments as concurrent) and walked
with a running `Set<parallelIndex>`. This yields:

| Output                         | Purpose                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `maxParallelWorkers`           | Global peak concurrency — hard cap for Phase 2                                                        |
| `maxParallelWorkersPerProject` | Per-project peak — used for lane consolidation                                                        |
| `lastTestInWorker`             | Last `TestTimings` per `workerIndex`; a lane is free for reuse only when its last test is in this set |
| `lanePool`                     | N empty `WorkerLane` slots pre-created upfront                                                        |

## Phase 2 — Backtracking assignment (`assign.ts`)

Tests are processed in `startTime` order. For each test:

**Step A — Same `workerIndex`**
If any lane's last test shares the test's `workerIndex`, the test comes from the same
Playwright worker process. Append it to that lane with no branching.

**Step B — New `workerIndex`, candidates exist**
Collect eligible lanes (worker done + idle + consolidation rule below).

- 1 candidate → assign directly.
- 2+ candidates → try each as a separate branch; collect all non-null results; pick
  the best-scoring survivor (see Branch scoring below).

**Step C — New `workerIndex`, no candidates**
The test needs a fresh slot. If the number of currently active lanes already equals
`maxParallelWorkers`, this branch would exceed the observed physical concurrency
peak — discard it (`return null`). Otherwise claim the next empty lane from the pool.

### Lane consolidation rule (Step B)

Count `projectLanesUsed` = distinct lanes already containing tests from this project.
If `projectLanesUsed >= maxParallelWorkersPerProject[project]`, restrict candidates to
those existing project lanes. This prevents a project with `workers: 1` (where every
failing test bumps `workerIndex`) from spreading across lanes — all must funnel into
the one established project lane.

## Branch scoring (`scoring.ts`)

When multiple branches survive, each is scored by the sum of per-project population
variance of same-project worker-restart gaps (idle time between consecutive
same-project tests in a lane that have different `workerIndex` values). Lower variance
= more evenly spaced restarts = visually correct lane layout. The lowest-scoring branch
wins; ties go to the first in traversal order. Cross-project transitions are excluded
from scoring because they include browser/context setup overhead.
