/**
 * Renders the merged-report-only toggle that left-aligns each shard to its own start time.
 */
import { LeftAlignIcon } from '../../icons/left-align-icon.js';
import { useReportData } from '../state/report-data.js';
import { useAlignShards } from '../state/align-shards.js';

export function AlignShardsButton() {
  const { isMergeReports } = useReportData();
  const { shardsAligned, setShardsAligned } = useAlignShards();

  if (!isMergeReports) return null;

  return (
    <button
      type="button"
      onClick={() => setShardsAligned((v) => !v)}
      title={
        shardsAligned
          ? 'Disable shard alignment and align all shards to the run start'
          : 'Enable shard alignment and align each shard to its own start'
      }
      aria-pressed={shardsAligned}
      aria-label="Toggle shard alignment"
      className={shardsAligned ? 'align-shards-active' : 'align-shards-inactive'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 8,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <LeftAlignIcon width={18} height={18} />
    </button>
  );
}
