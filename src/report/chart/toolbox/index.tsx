/**
 * Arranges the chart legend and toolbar controls above the timeline.
 */
import { Legend } from '../legend/index.js';
import { SearchDialog } from '../search/search-dialog.js';
import { AlignShardsButton } from './align-shards-button.js';
import { ProjectFilter } from './project-filter.js';
import { ResetZoomButton } from './reset-zoom-button.js';

export function Toolbox() {
  return (
    <div className="chart-toolbox">
      <div className="chart-toolbox-leading">
        <AlignShardsButton />
        <Legend />
      </div>
      <div className="chart-toolbox-trailing">
        <div className="chart-toolbox-reset">
          <ResetZoomButton />
        </div>
        <div className="chart-toolbox-controls">
          <SearchDialog />
          <ProjectFilter />
        </div>
      </div>
    </div>
  );
}
