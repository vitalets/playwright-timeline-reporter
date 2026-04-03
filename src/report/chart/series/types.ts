import { MouseEvent } from 'react';
import { TooltipData } from '../tooltip/index.js';

export type MouseEventProps = {
  onClick?: (event: MouseEvent, data: TooltipData) => void;
  onMouseMove?: (event: MouseEvent, data: TooltipData) => void;
  onMouseLeave?: () => void;
};
