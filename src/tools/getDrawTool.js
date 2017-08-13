import {
  autorun,
  action,
  autorunAsync
} from 'mobx';

import {
  getPathBounds,
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
  debugDisplayArea,
  debugBoundsBox,
  debugLinearLine
} from '../util/debug-bounding-shapes';

export default function(app) {
  const { CREATEJS, state, stage, canvasLayer, userEventsListeners } = app;
  const { Graphics, Shape, Tween } = CREATEJS;
  const { appState, pointerState, drawToolState, quickToolState, touchState, zoomState, canvasObjects, TOOLS, POINTER_TYPE: { POINTER, FINGER } } = state;
  const AVG_CHAR_PATH_LENGTH = 40;


  // Draw Tool, gets instantiated when user clicks
  class DrawTool {
    previousPath = null;
    drawStarted = false; // internal state
    previousTouchType = POINTER;
    previousBounds = {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0
    };

    drawCacheTimeout = null;

    constructor() {
      this.listen();

      this.drawSession = [];
      this.lineSessions = [];

      this.shape = new Shape();
      this.drawCache = new Shape();

      canvasLayer.addChild(
        this.drawCache,
        this.shape
      );

      canvasObjects._drawnShapeObjects[this.shape.id] = this.shape;
      canvasObjects._drawnShapeObjects[this.drawCache.id] = this.drawCache;

      canvasLayer.x = 0;
      canvasLayer.y = 0;

      window._canvasObjects = canvasObjects;

      window.globalDrawSession = canvasObjects._textData;

      /* DEBUG */
      const displayAreaBounds = new Shape();
      const boundsBox = new Shape();

      initDebugBoundingShapes({
        shape: this.shape,
        displayAreaBounds,
        boundsBox,
      });

      canvasLayer.addChild(
        displayAreaBounds,
        boundsBox
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
        }
      })

      autorunAsync(() => {
        const scaleX = this.shape.scaleX;
        const zoom = zoomState.zoom;

        if(Math.abs(scaleX - zoom) <= 1) return;

        const {x,y,width,height} = this.drawCache.getBounds();

        this.drawCache.cache(x,y,width,height, zoom);
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
      //

      const { strokeColor, fillColor, strokeWidth } = drawToolState;
      this.drawSession.push([x,y]);

      this.fillColor = fillColor;
      this.strokeWidth = strokeWidth;
      this.strokeColor = strokeColor;
    }

    @action
    changeColor = (color = '#000000') => {
      drawToolState.strokeColor = color;
      const textData = canvasObjects.newTextData();

      textData.style.strokeColor = color;

      canvasObjects._textData.push(textData);
    }

    onDrawMove = () => {
      const x = pointerState.x;
      const y = pointerState.y;
      const path = this.drawSession[this.drawSession.length - 1];
      const lastIndex = path.length - 1;

      // Detect any touch values outside of the range of current values (instrument error)
      if(Math.abs(y - path[lastIndex]) < 0.05 || Math.abs(x - path[lastIndex - 1]) < 0.05) return;

      path.push(x);
      path.push(y);

      this.draw(this.shape, drawToolState, this.drawSession);
    }

    @action
    onDrawStop = () => {
      this.drawStarted = false;
      if(this.drawCacheTimeout) clearTimeout(this.drawCacheTimeout);

      /* Shows bounding box for text paths */
      const bounds = getPathBounds(this.drawSession[this.drawSession.length - 1], this.strokeWidth);
      debugBoundsBox(bounds);

      this.previousBounds = updateContainerBounds(this.previousBounds, bounds);

      this.drawCacheTimeout = setTimeout(this.cacheDrawState, 1000);
    }

    cacheDrawState = () => {
      const textData = canvasObjects._textData[canvasObjects._textData.length - 1];

      textData.path = textData.path.concat(this.drawSession);

      this.draw(this.drawCache, drawToolState, this.drawSession);

      this.drawCache.setBounds(
        this.previousBounds.x1,
        this.previousBounds.y1,
        this.previousBounds.x2 - this.previousBounds.x1,
        this.previousBounds.y2 - this.previousBounds.y1
      );

      this.drawCache.cache(
        this.previousBounds.x1,
        this.previousBounds.y1,
        this.previousBounds.x2 - this.previousBounds.x1,
        this.previousBounds.y2 - this.previousBounds.y1,
        zoomState.zoom
      );

      /* Need to find a way to anti alias better (try zooming in, zooming out, than caching*/
      // this.drawCache.cache(
      //   this.previousBounds.x1,
      //   this.previousBounds.y1,
      //   this.previousBounds.x2 - this.previousBounds.x1,
      //   this.previousBounds.y2 - this.previousBounds.y1,
      //   zoomState.zoom
      // );

      this.drawSession = [];

      this.shape.graphics.clear();

      this.drawCacheTimeout = null;
    }

    draw = (shape, style, drawPath) => {
      const graphics = shape.graphics
          .setStrokeStyle(style.strokeWidth)
          .beginStroke(style.strokeColor);

      drawPath.forEach(p => {
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
