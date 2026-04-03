/**
 * Renders all test span bars.
 */
import { useMemo } from 'react';
import { useReportData } from '../../state/report-data.js';
import { useScale } from '../../scales/index.js';
import { useAlignShards } from '../../state/align-shards.js';
import { MouseEventProps } from '../types.js';
import { TestBar, TestBarClipDef, TestBarData } from './test-bar.js';
import { isVisible } from '../../scales/time.js';
import { buildSpanBars } from './build-span-bars.js';
import { useAnimation } from './animation.js';

const BAR_HEIGHT_RATIO = 0.6;
const BAR_RADIUS = 14;
const MAX_ANIMATED_CLIPS = 200;

/**
 * Renders clip path definitions for visible test bars.
 * Must be placed inside the top-level SVG <defs> element.
 */
export function SeriesTestsDefs() {
  const { workers } = useReportData();
  const { timeScale, getRect } = useScale();
  const { applyShardOffset } = useAlignShards();
  const animate = useAnimation();

  const clipDefsData = useMemo(
    () =>
      workers.flatMap((worker) =>
        worker.tests
          .filter((chartTest) => {
            const startTime = applyShardOffset(chartTest.relStartTime, worker.mergeReportId);
            return isVisible(timeScale, startTime, chartTest.test.totalDuration);
          })
          .map((chartTest) => {
            const relStartTime = applyShardOffset(chartTest.relStartTime, worker.mergeReportId);
            const { test } = chartTest;
            const rect = getRect(
              relStartTime,
              test.totalDuration,
              worker.laneIndex,
              BAR_HEIGHT_RATIO,
            );
            return { laneIndex: worker.laneIndex, test, relStartTime, rect };
          }),
      ),
    [workers, applyShardOffset, timeScale, getRect],
  );

  const shouldAnimate = animate && clipDefsData.length <= MAX_ANIMATED_CLIPS;

  return (
    <>
      {clipDefsData.map(({ laneIndex, test, relStartTime, rect }) => (
        <TestBarClipDef
          key={`${laneIndex}-${relStartTime}`}
          data={{ laneIndex, test, rect }}
          radius={BAR_RADIUS}
          animate={shouldAnimate}
        />
      ))}
    </>
  );
}

export function SeriesTests({
  onMouseMove,
  onMouseLeave,
}: {
  onMouseMove?: MouseEventProps['onMouseMove'];
  onMouseLeave?: MouseEventProps['onMouseLeave'];
}) {
  const { workers } = useReportData();
  const { timeScale, workersScale, getRect } = useScale();
  const { applyShardOffset } = useAlignShards();

  const testBars = useMemo(() => {
    const testBars: TestBarData[] = [];
    workersScale.domain().forEach((laneIndex) => {
      const worker = workers[laneIndex];
      const visibleTests = worker.tests.filter((chartTest) => {
        const startTime = applyShardOffset(chartTest.relStartTime, worker.mergeReportId);
        return isVisible(timeScale, startTime, chartTest.test.totalDuration);
      });
      visibleTests.forEach((chartTest) => {
        const { test } = chartTest;
        const relStartTime = applyShardOffset(chartTest.relStartTime, worker.mergeReportId);
        const rect = getRect(relStartTime, test.totalDuration, laneIndex, BAR_HEIGHT_RATIO);
        const spans = buildSpanBars({
          chartTest,
          startTime: relStartTime,
          laneIndex,
          heightRatio: BAR_HEIGHT_RATIO,
          getRect,
        });

        testBars.push({ laneIndex, test, rect, spans });
      });
    });
    return testBars;
  }, [workers, workersScale, applyShardOffset, timeScale, getRect]);

  return (
    <>
      {testBars.map((data) => {
        // Stable key to avoid DOM re-creation when the visible range changes
        const key = `${data.laneIndex}-${data.test.testId}-${data.test.retry}`;
        return (
          <TestBar key={key} data={data} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} />
        );
      })}
    </>
  );
}
