/** Run Playwright and retain generated reports under each e2e test's name. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function cleanupReports(configDir) {
  fs.rmSync(path.join(configDir, 'reports'), { recursive: true, force: true });
  fs.rmSync(path.join(configDir, 'timeline-report'), { recursive: true, force: true });
}

export function getReportDir(configDir, t) {
  const name = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return path.join(configDir, 'reports', name);
}

export function runPlaywright(configDir, reportDir, env = {}) {
  try {
    execSync('npx playwright test', {
      cwd: configDir,
      timeout: 20000,
      env: {
        ...process.env,
        GITHUB_STEP_SUMMARY: '',
        PLAYWRIGHT_TIMELINE_OUTPUT_FILE: '',
        MARKDOWN_ENABLED: '1',
        MARKDOWN_OUTPUT_FILE: '',
        HTML_OUTPUT_FILE: '',
        ...env,
      },
      stdio: 'pipe',
    });
  } finally {
    // Preserve default-path output under this test's name, including on failure.
    const defaultReportDir = path.join(configDir, 'timeline-report');
    if (fs.existsSync(defaultReportDir)) {
      fs.mkdirSync(path.dirname(reportDir), { recursive: true });
      fs.renameSync(defaultReportDir, reportDir);
    }
  }
}
