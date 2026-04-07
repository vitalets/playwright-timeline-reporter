/** Provides shared Playwright test helpers and YAML rendering utilities for timing fixtures. */
import { test as base } from '@playwright/test';
import yaml from 'yaml';
import { FixtureSpan, TestTimings } from '../src/test-timings/types.js';

export { base };

export async function delay(arg: number | [number, string]) {
  const [ms, error] = Array.isArray(arg) ? arg : [arg, undefined];
  const finalMs = error ? Math.max(0, ms - 30) : ms; // leave some time to throw error
  await new Promise((resolve) => setTimeout(resolve, finalMs));
  if (error) throw new Error(error);
}

export async function fixture(
  setup: number | [number, string],
  use: () => Promise<void>,
  teardown: number | [number, string],
) {
  // console.log(123);
  await delay(setup);
  await use();
  // console.log(456);
  await delay(teardown);
}

export function annotation(v: string) {
  return { annotation: { type: 'expected', description: v.trim() } };
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
        title: s.title,
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
        title: s.title,
        scope: s.scope,
        stage: s.stage,
        executedPart: s.executedPart,
        duration: s.duration,
        error: s.error?.message,
      })),
    })
    .trim();
}
