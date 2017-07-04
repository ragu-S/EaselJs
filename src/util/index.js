import initStatTool from './debug-stats-tool';
import initDrawPath from './draw-path';

export default function(app) {
  initStatTool(app);
  initDrawPath(app);
}

