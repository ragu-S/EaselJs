import {
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

export default function(app) {
  const { CREATEJS, state, stage, canvasLayer, userEventsListeners } = app;
  const { Graphics, Shape, Tween } = CREATEJS;
  const { appState, pointerState, drawToolState, quickToolState, touchState, zoomState, canvasObjects, TOOLS, POINTER_TYPE: { POINTER, FINGER } } = state;
  const AVG_CHAR_PATH_LENGTH = 40;
  window.globalDrawSession = [];

  // Draw Tool, gets instantiated when user clicks
  class DrawTool {
    previousPath = null;
    drawStarted = false; // internal state
    previousTouchType = POINTER;
    previousBounds = null;

    // Needed to detect new lines
    newLineBounds = null;
    prevPathBounds = null;
    currentLineBounds = null;

    constructor() {
      this.listen();

      this.drawSession = [];
      this.lineSessions = [];

      this.shape = new Shape();

      canvasLayer.addChild(
        this.shape
      );

      canvasObjects._drawnShapeObjects[this.shape.id] = this.shape;
      // canvasObjects._drawnShapeObjects[this.cachedShape.id] = this.cachedShape;

      canvasLayer.x = 0;
      canvasLayer.y = 0;

      window._canvasObjects = canvasObjects;

      /* DEBUG */
      const displayAreaBounds = new Shape();
      const boundsBox = new Shape();
      const newLineArea = new Shape();
      const currentLineArea = new Shape();
      const linearLine = new Shape();
      const currentLinearLine = new Shape();

      initDebugBoundingShapes({
        shape: this.shape,
        displayAreaBounds,
        boundsBox,
        newLineArea,
        currentLineArea,
        linearLine,
        currentLinearLine
      });

      canvasLayer.addChild(
        displayAreaBounds,
        boundsBox,
        newLineArea,
        currentLineArea,
        linearLine,
        currentLinearLine
      );

      // Listen to style changes
      autorun(() => {
        console.log('track draw states');
        if(drawToolState.edited === true) {
          console.log(
            'strokeColor', drawToolState.strokeColor,
            'fillColor', drawToolState.fillColor,
            'strokeWidth', drawToolState.strokeWidth
          )

          const { strokeColor, fillColor, strokeWidth } = drawToolState;
          this.fillColor = fillColor;
          this.strokeWidth = strokeWidth;
          this.strokeColor = strokeColor;

          // const {x,y,x2,y2} = this.getBounds();

          // this.shape.cache(x,y,x2,y2);
        }
      })

      autorunAsync(() => {
        if(this.currentLineBounds === null) return;
        const scaleX = this.shape.scaleX;
        const zoom = zoomState.zoom;
        if(Math.abs(scaleX - zoom) <= 1) return;
        console.log('updating cache');
        Object.values(canvasObjects._drawnShapeObjects).forEach(obj => {
          if(obj._bounds === null) debugger;
          const {x,y,width,height} = obj.getBounds();
          obj.cache(x,y,width,height, zoom);
        })
      }, 600);

      autorun(() => {
        console.log('call debugging appState.displayAreaBounds');
        debugDisplayArea(appState.displayLayerBounds);
      })

      window._drawTool = this;
    }

    // Activate when tool is selected
    listen = () => {
      return autorun(() => {
        if(pointerState.touchType === FINGER && touchState.touches.length > 1 && this.previousTouchType === POINTER) {
          console.log('removing previous shape');
          // Remove previous drawing
          this.drawSession.pop();

          this.draw();

          // End draw
          this.drawStarted = false;
        }
        else if(pointerState.touchType === POINTER) {
          if(this.drawStarted === false && pointerState.pointerDown === true) {
            this.onDrawStart();
          }
          else if(pointerState.pointerDown === true && pointerState.pointerUp === false) {
            this.onDrawMove();
          }
          else if(this.drawStarted === true && pointerState.pointerUp === true) {
            this.onDrawStop();
          }
        }
        this.previousTouchType = pointerState.touchType;
      })
    }

    onDrawStart = () => {
      this.drawStarted = true;
      const { x, y } = pointerState;
      // check if something lies beneath point
      if(this.currentLineBounds !== null) {
        const selectedObject = canvasLayer.getObjectUnderPoint(x,y,0);
        if(selectedObject !== null) {
          console.log(selectedObject);
        }
      }
      const { strokeColor, fillColor, strokeWidth } = drawToolState;
      this.drawSession.push([x,y]);

      this.fillColor = fillColor;
      this.strokeWidth = strokeWidth;
      this.strokeColor = strokeColor;

      if(this.cacheResult) clearTimeout(this.cacheResult);
    }

    onDrawMove = () => {
      const x = pointerState.x;
      const y = pointerState.y;
      const path = this.drawSession[this.drawSession.length - 1];
      const lastIndex = path.length - 1;//path[];

      // Detect any touch values outside of the range of current values (instrument error)
      if(Math.abs(y - path[lastIndex]) < 0.05 || Math.abs(x - path[lastIndex - 1]) < 0.05) return;

      this.drawSession[this.drawSession.length - 1] = path.concat([x,y]);

      this.draw();
    }

    @action
    onDrawStop = () => {
      this.drawStarted = false;
      if(this.cacheResult) clearTimeout(this.cacheResult);

      /* Shows bounding box for text paths */
      const currentDrawPath = this.drawSession[this.drawSession.length - 1];

      const bounds = getPathBounds(currentDrawPath, this.strokeWidth);

      window.globalDrawSession = window.globalDrawSession.concat(currentDrawPath);

      window.LINEAR_LINE = linest(window.globalDrawSession);

      const currentLinearLine = linest(currentDrawPath);
      debugCurrentLinearLineSession(currentLinearLine);
      debugLinearLine(LINEAR_LINE);
      debugBoundsBox(bounds);
      // const newSession = this.lineSessions.concat(currentDrawPath);
      // const linePath = linest(newSession);
      // console.log('currentLineBounds', this.currentLineBounds);
      // console.log('newLineBounds', this.newLineBounds);
      // console.log('bounds', bounds);

      // First Draw
      if(this.previousBounds === null) {
        this.previousBounds = this.currentLineBounds = bounds;

        // this.previousPath = currentDrawPath;

        // create newLine area
        this.newLineBounds = {
          x1: bounds.x1,
          y1: bounds.y2,
          x2: bounds.x2,
          y2: bounds.y2 + (bounds.y2 - bounds.y1)
        }

        // update displayAreaBounds if bounds is not contained in current displayAreaBounds
      }
      else {
        // check path is not in newline area
        const isNewLine = contains(this.newLineBounds, bounds);

        if(isNewLine) {
          if(this.cacheResult) {
            clearTimeout(this.cacheResult);
            this.cacheResult = null;
          }

          // Create new Shape container
          const oldShape = this.shape;
          const newShape = new Shape();

          canvasLayer.addChild(newShape);

          this.shape = newShape;

          // Draw bounds to new Shape
          this.draw();

          // Cache old shape
          const { x1, x2, y1, y2 } = this.currentLineBounds;

          oldShape.cache(
            x1,
            y1,
            x2-x1,
            y2-y1,
            zoomState.zoom
          );

          if(newShape.id in canvasObjects._drawnShapeObjects) throw new Error('Old Shape ID in _drawnShapeObjects before insertion!');

          this.currentLineBounds = bounds;

          this.newLineBounds = {
            x1: bounds.x1,
            y1: bounds.y2,
            x2: bounds.x2,
            y2: bounds.y2 + (bounds.y2 - bounds.y1)
          }
        }
        // Same line and user continued drawing this session
        else {
          updateContainerBounds(this.currentLineBounds, bounds);

          this.newLineBounds = {
            x1: this.currentLineBounds.x1,
            y1: this.currentLineBounds.y2,
            x2: this.currentLineBounds.x2,
            y2: this.currentLineBounds.y2 + (this.currentLineBounds.y2 - this.currentLineBounds.y1)
          }
        }

        // Check path length > AVG_CHAR_PATH_LENGTH
        // if(currentDrawPath.length >= AVG_CHAR_PATH_LENGTH) {
        //   this.avgCharBounds = bounds;
        // }
      }

      /* Check if likely character
      1) if path is greater than current AVG_CHAR_PATH_LENGTH
      2) check if current line has bounds greater than 3 likely chars already
      */
      if(boundsHitTest(this.previousBounds, bounds) && this.drawSession.length > 1) {
        console.log('character connected!');
        const lastDrawPath = this.drawSession[this.drawSession.length - 2];
        if(pathsIntersects(lastDrawPath, currentDrawPath)) debugger;
      }

      this.shape.setBounds(
        this.currentLineBounds.x1,
        this.currentLineBounds.y1,
        this.currentLineBounds.x2 - this.currentLineBounds.x1,
        this.currentLineBounds.y2 - this.currentLineBounds.y1
      )

      // Update container to ensure it encomposses the new bounds object
      if(!contains(appState.displayLayerBounds, bounds)) updateContainerBounds(appState.displayLayerBounds, bounds);

      debugCurrentLineArea(this.currentLineBounds);
      debugNewLineArea(this.newLineBounds);

      debugTracker('DisplayLayerBounds', {
        x1: appState.displayLayerBounds.x1,
        y1: appState.displayLayerBounds.y1,
        width: appState.displayLayerBounds.width,
        height: appState.displayLayerBounds.height
      });

      this.previousBounds = bounds;

      //this.cacheResult = setTimeout(this.updateCache, 1500);
    }

    draw = () => {
      const graphics = this.shape.graphics
          .clear()
          .setStrokeStyle(this.strokeWidth)
          .beginStroke(this.strokeColor);

      this.drawSession.forEach(p => {
        graphics.moveTo(p[0],p[1]);
        for(let i = 2; i < p.length - 1; i +=2) {
          graphics.lineTo(p[i], p[i + 1]);
        }
      })

      graphics.endStroke();
    }
  }

  return new DrawTool();
}
