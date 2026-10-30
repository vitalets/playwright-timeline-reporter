import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupReports, getReportDir, runPlaywright } from '../_helpers/playwright.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));

before(() => cleanupReports(configDir));

test('successful run produces an HTML report', (t) => {
  const reportDir = getReportDir(configDir, t);
  runPlaywright(configDir, reportDir);

  const html = fs.readFileSync(path.join(reportDir, 'index.html'), 'utf8');
  assert.match(html, /<html/);
  assert.match(html, /test 1/);
});
