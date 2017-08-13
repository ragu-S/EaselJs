const DISPLAY_AREA_BOUNDS_COLOR = '#2444D8';
const CURRENTLINE_BOUNDS_COLOR = '#FF7F0D';
const NEWLINE_BOUNDS_COLOR = '#7E22AA';
const CURRENT_LINEAR_LINE = '#E65E38';
const CURRENT_PATH_BOUNDS_COLOR = '#ff0000';
const CURRENT_SHAPE_BOUNDS_COLOR = '';
const LINEAR_LINE_PATH_COLOR = '#00C300';
const LINES_COLOR = '#7E1A00';

const shapes = {};

export function initDebugBoundingShapes(
  shapeRefs) {
  /*
    displayAreaBounds,
    boundsBox,
    newLineArea,
    currentLineArea
  */
  Object.assign(shapes, {
    ...shapeRefs
  })
}

export function debugCurrentLineArea(bounds) {
  shapes.currentLineArea.graphics
    .clear()
    .setStrokeStyle(1)
    .beginStroke(CURRENTLINE_BOUNDS_COLOR)
    .drawRect(
      bounds.x1,
      bounds.y1,
      bounds.x2 - bounds.x1,
      bounds.y2 - bounds.y1
    )
    .endStroke()
}

export function debugDisplayArea(bounds) {
  shapes.displayAreaBounds.graphics
    .clear()
    .setStrokeStyle(1)
    .beginStroke(DISPLAY_AREA_BOUNDS_COLOR)
    .drawRect(
      bounds.x1,
      bounds.y1,
      bounds.x2 - bounds.x1,
      bounds.y2 - bounds.y1
    )
    .endStroke()
}

export function debugNewLineArea(bounds) {
  shapes.newLineArea.graphics
    .clear()
    .setStrokeStyle(1)
    .beginStroke(NEWLINE_BOUNDS_COLOR)
    .drawRect(
      bounds.x1,
      bounds.y1,
      bounds.x2 - bounds.x1,
      bounds.y2 - bounds.y1
    )
    .endStroke()
}

export function debugBoundsBox(bounds) {
  shapes.boundsBox.graphics
    .clear()
    .setStrokeStyle(1)
    .beginStroke(CURRENT_PATH_BOUNDS_COLOR)
    .drawRect(
      bounds.x1,
      bounds.y1,
      bounds.x2 - bounds.x1,
      bounds.y2 - bounds.y1
    )
    .endStroke()
}



