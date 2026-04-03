/**
 * Renders the chart legend and lets CSS determine when it should wrap.
 */
import { SERIES } from '../series/config.js';
import { useFocusFilter } from '../state/focus-filter.js';
import { LegendItem } from './legend-item.js';

export function Legend() {
  const { focusFilter, setFocusFilter, resetFocusFilter } = useFocusFilter();
  const selectedSeries =
    focusFilter?.field === 'seriesId' && focusFilter.value ? [focusFilter.value] : [];

  const onSeriesClick = (seriesId: string) => {
    if (focusFilter?.field === 'seriesId' && focusFilter.value === seriesId) {
      resetFocusFilter();
    } else {
      setFocusFilter('seriesId', seriesId);
    }
  };

  return (
    <div className="chart-legend">
      {SERIES.map((seriesConfig) => {
        const isSelected = !selectedSeries.length || selectedSeries.includes(seriesConfig.id);
        return (
          <LegendItem
            key={seriesConfig.id}
            seriesConfig={seriesConfig}
            isSelected={isSelected}
            onClick={() => onSeriesClick(seriesConfig.id)}
          />
        );
      })}
    </div>
  );
}
