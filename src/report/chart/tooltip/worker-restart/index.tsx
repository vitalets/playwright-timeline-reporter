import { WorkerRestart } from '../../../data/worker-restarts.js';
import { RestartTriangle } from '../../series/worker-restarts/marker.js';
import { Badge } from '../badge.js';

export function WorkerRestartTooltip({ data }: { data: WorkerRestart }) {
  return (
    <>
      <div
        style={{
          color: 'var(--tooltip-text-muted)',
          fontSize: 12,
          letterSpacing: '0.04em',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width={7} height={14}>
          <RestartTriangle centerX={7 / 3} centerY={7} size={7} />
        </svg>
        WORKER RESTART
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 16,
          wordBreak: 'break-word',
        }}
      >
        Worker Restart
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          paddingTop: 10,
          borderTop: '1px solid var(--card-border)',
          marginTop: 10,
        }}
      >
        <Badge
          label="Worker Index"
          value={
            <>
              {data.prevWorkerIndex} &rarr; {data.nextWorkerIndex}
            </>
          }
        />
      </div>
    </>
  );
}
