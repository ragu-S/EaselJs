import {
  untracked,
  reaction,
  autorun,
  action,
  autorunAsync
} from 'mobx';

import { getPathBounds,
  centerCoords,
  contains,
  updateContainerBounds,
  linest,
  boundsHitTest,
  pathsIntersects
} from '../util/geometry-utils';

import { debugTracker } from '../util/debug-stats-tool';

import {
  initDebugBoundingShapes,
  debugCurrentLineArea,
  debugDisplayArea,
  debugNewLineArea,
  debugBoundsBox,
  debugCurrentLinearLineSession,
  debugLinearLine
} from '../util/debug-bounding-shapes';

import getDrawTool from './getDrawTool';
import getPanTool from './getPanTool';
import getQuickTool from './getQuickTool';

export default function(app) {
  return {
    // Select/Group Tool
    drawTool: getDrawTool(app),
    panTool: getPanTool(app), // Pan Tool, two fingers, one finger, zooming, etc.
    quickTool: getQuickTool(app) // Tool Selector/Manager
  }
}
