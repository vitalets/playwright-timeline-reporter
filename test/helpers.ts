/** Provides shared Playwright test helpers and YAML rendering utilities for timing fixtures. */
import { test as base } from '@playwright/test';
import yaml from 'yaml';
import type { FixtureSpan, TestTimings } from '../src/test-timings/types.js';

export { base };

// Real execution on CI can drift enough to make 100ms timing buckets flaky, so timing specs
// run delays 10x slower and the reporter scales measured durations back down to the same
// 100ms-based expectations.
export const TIMING_SCALE = 5;
const ERROR_THROW_SHIFT_MS = 30;

export async function delay(arg: number | [number, string]) {
  const [ms, error] = Array.isArray(arg) ? arg : [arg, undefined];
  const baseDelay = ms * TIMING_SCALE;
  // leave some time to throw error
  const finalDelay = error ? Math.max(0, baseDelay - ERROR_THROW_SHIFT_MS) : baseDelay;
  await new Promise((resolve) => setTimeout(resolve, finalDelay));
  if (error) throw new Error(error);
}

export async function fixture(
  setup: number | [number, string],
  use: () => Promise<void>,
  teardown: number | [number, string],
) {
  await delay(setup);
  await use();
  await delay(teardown);
}

export function annotation(v: string) {
  return { annotation: { type: 'expected', description: v.trim() } };
}

export function round(duration: number) {
  const res = Math.round(duration / TIMING_SCALE / 100) * 100;
  return Object.is(res, -0) ? 0 : res;
}

export function renderTimings(t: TestTimings) {
  return yaml
    .stringify({
      totalDuration: t.totalDuration,
      status: t.status,
      beforeAll: t.beforeHooks
        .filter((h) => h.scope === 'worker')
        .map((s) => ({
          title: s.title,
          duration: s.duration,
          error: s.error?.message,
        })),
      beforeEach: t.beforeHooks
        .filter((h) => h.scope === 'test')
        .map((s) => ({
          title: s.title,
          duration: s.duration,
          error: s.error?.message,
        })),
      beforeFixtures: t.beforeFixtures.map((s: FixtureSpan) => ({
        title: unifyFixtureTitles(s.title),
        scope: s.scope,
        stage: s.stage,
        executedPart: s.executedPart,
        duration: s.duration,
        error: s.error?.message,
      })),
      testBody: {
        duration: t.testBody.duration,
        error: t.testBody.error?.message,
      },
      afterEach: t.afterHooks
        .filter((h) => h.scope === 'test')
        .map((s) => ({
          title: s.title,
          duration: s.duration,
          error: s.error?.message,
        })),
      afterAll: t.afterHooks
        .filter((h) => h.scope === 'worker')
        .map((s) => ({
          title: s.title,
          duration: s.duration,
          error: s.error?.message,
        })),
      afterFixtures: t.afterFixtures.map((s: FixtureSpan) => ({
        title: unifyFixtureTitles(s.title),
        scope: s.scope,
        stage: s.stage,
        executedPart: s.executedPart,
        duration: s.duration,
        error: s.error?.message,
      })),
    })
    .trim();
}

/**
 * Normalizes a Playwright fixture step title to always have form `Fixture "name"`.
 * Wraps bare fixture names that lack the prefix (across different Playwright versions).
 */
function unifyFixtureTitles(title: string) {
  return title.startsWith('Fixture "') ? title : `Fixture "${title}"`;
}
