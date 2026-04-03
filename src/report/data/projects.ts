import type { TestTimings } from '../../test-timings/types.js';
import { groupBy } from '../../utils/group-by.js';

export type ProjectData = {
  name: string;
  startTime: number; // relative to run start time
  endTime: number; // relative to run start time
};

export function buildProjects(tests: TestTimings[], runStartTime: number): ProjectData[] {
  const byProject = groupBy(tests, (t) => t.projectName);
  return [...byProject.entries()]
    .filter(([name]) => Boolean(name))
    .map(([name, projectTests]) => {
      const startTime = Math.min(...projectTests.map((t) => t.startTime)) - runStartTime;
      const endTime =
        Math.max(...projectTests.map((t) => t.startTime + t.totalDuration)) - runStartTime;
      return { name, startTime, endTime };
    });
}
