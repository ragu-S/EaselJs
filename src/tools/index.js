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
  boundsHitTest
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
    charBounds = [];
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
        const scaleX = this.shape.scaleX;
        const zoom = zoomState.zoom;
        if(Math.abs(scaleX - zoom) < 2) return;
        console.log('updating cache');
        Object.values(canvasObjects._drawnShapeObjects).forEach(obj => {
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
      const lastDrawSession = this.drawSession[this.drawSession.length - 1];

      const bounds = getPathBounds(lastDrawSession, this.strokeWidth);

      window.globalDrawSession = window.globalDrawSession.concat(lastDrawSession);

      window.LINEAR_LINE = linest(window.globalDrawSession);

      const currentLinearLine = linest(lastDrawSession);
      debugCurrentLinearLineSession(currentLinearLine);
      debugLinearLine(LINEAR_LINE);
      debugBoundsBox(bounds);
      // const newSession = this.lineSessions.concat(lastDrawSession);
      // const linePath = linest(newSession);
      // console.log('currentLineBounds', this.currentLineBounds);
      // console.log('newLineBounds', this.newLineBounds);
      // console.log('bounds', bounds);

      // First Draw
      if(this.previousBounds === null) {
        this.previousBounds = this.currentLineBounds = bounds;

        this.charBounds.push({
          path: lastDrawSession,
          bounds
        });

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

        if(boundsHitTest(this.previousBounds, bounds)) {
          console.log('character connected!');
        }

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
        if(lastDrawSession.length >= AVG_CHAR_PATH_LENGTH) {
          this.avgCharBounds = bounds;
        }
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

  class PanTool {
    originalX = -1;
    originalY = -1;
    zoomScale = 1;
    mainLayerScale = 1;
    constructor() {
      window._PAN = this;
      this.initialized = false;
      // this.updateAppStoreZoomIndex = debounce(action(this.updateAppStoreZoomIndex.bind(this)), 150);
      /* User interactions:
      1) panning, two fingers used

      2) zooming is two fingers spread
      */

      this.panDisposer = autorun(() => {
        if(touchState.touches.length === 1 && pointerState.touchType === FINGER && pointerState.pointerMove === true) {
          let returnEarly = false;
          let MAX_PAN_X = window.innerWidth * 1.5 * this.zoomScale;
          let MAX_PAN_Y = window.innerHeight * 1.5 * this.zoomScale;
          const bounds = appState.displayLayerBounds;

          const { x, y } = canvasLayer.localToGlobal(pointerState.x, pointerState.y);

          let xPos = 0;
          let yPos = 0;

          if(this.originalX === -1 && this.originalY === -1) {
            this.originalX = x;
            this.originalY = y;
          }

          if(this.originalX > x) {
            xPos = -Math.abs(x - this.originalX);
          }
          else if(this.originalX < x) {
            xPos = Math.abs(x - this.originalX);
          }

          if(this.originalY > y) {
            yPos = -Math.abs(y - this.originalY);
          }
          else if(this.originalY < y) {
            yPos = Math.abs(y - this.originalY);
          }

          // if(bounds !== null) {
          //   MAX_PAN_X = (Math.max(window.innerWidth, bounds.width));
          //   MAX_PAN_Y = (Math.max(window.innerHeight, bounds.height));
          // }

          // if((Math.abs(canvasLayer.x + xPos)) > MAX_PAN_X * this.zoomScale) {
          //   xPos = 0;
          // }
          // if((Math.abs(canvasLayer.y + yPos)) > MAX_PAN_Y * this.zoomScale) {
          //   yPos = 0;
          // }

          this.originalX = x;
          this.originalY = y;

          canvasLayer.x += xPos;
          canvasLayer.y += yPos;

          debugTracker('Pan Zoom Text', {
            x: canvasLayer.x,
            y: canvasLayer.y,
            zoom: this.zoomScale
          });

        }
        else {
          this.originalX = -1;
          this.originalY = -1;
        }
      });

      this.zoomDisposer = autorun(this.throttledZoom);
    }

    throttledZoom = () => {
      if(touchState.touches.length <= 1 || this.zoomScale === zoomState.zoom) return;
      this.zoomScale = zoomState.zoom;

      const {x,y} = zoomState;

      const point2BeforeTransform = canvasLayer.globalToLocal(x, y);

      canvasLayer.set({ scaleX: this.zoomScale, scaleY: this.zoomScale });

      const pointAfterTransform = canvasLayer.globalToLocal(x,y);

      canvasLayer.x += (pointAfterTransform.x - point2BeforeTransform.x) * this.zoomScale;
      canvasLayer.y += (pointAfterTransform.y - point2BeforeTransform.y) * this.zoomScale;

      debugTracker('Pan Zoom Text', {
        x: canvasLayer.x,
        y: canvasLayer.y,
        zoom: this.zoomScale
      });

    }

    centerCanvas = () => {

    }
  }


  class QuickTool {
    previousClickTime = new Date()
    toolAnimating = false
    // manages UI, tools, etc.
    // Pops up after user taps with one finger (or pointerUp, after moving for a while)
    constructor() {
      window.QUICKTOOL = this;
      const { hammerjs } = userEventsListeners;
      this.shape = new Shape();
      this.graphics = this.shape.graphics;
      this.radius = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.4);

      stage.addChild(this.shape);

      this.listen = autorun(() => {
        // Check if any canvas objects are below click event
        // This will allow tool to customize itself to w/e object is beneath it

        if(quickToolState.showTool === true) this.showQuickTool()
        else this.hideQuickTool()
      })

      //hammerjs.on('doubletap', this.doubleTapHandler);
    }

    @action
    doubleTapHandler = ev => {
      console.log('click showTool', quickToolState.showTool);
      if(this.toolAnimating === true) return;
      quickToolState.showTool = !quickToolState.showTool;
      // const dateDiff = ev.timeStamp - this.previousClickTime;

      // this.previousClickTime = ev.timeStamp;

      // if(dateDiff < 400) {
      //   quickToolState.showTool = true;
      // }
    }

    singleTapHandler = ev => {
      console.log('single tap');
    }

    showQuickTool = () => {
      // detecting double click
      this.graphics
          .setStrokeStyle()
          .beginStroke('#000000')
          .drawCircle(0,0, this.radius)
          .endStroke()

      const {x,y} = centerCoords({x:0,y:0,radius:this.radius});
      const updated = stage.globalToLocal(x,y);
      this.shape.x = updated.x;
      this.shape.y = updated.y;
      this.shape.scaleX = this.shape.scaleY = 0;
      this.toolAnimating = true;

      Tween.get(this.shape)
       .to({ scaleX: 1, scaleY: 1, override: true, useTicks: true }, 500)
       .call(() => this.toolAnimating = false)
    }

    hideQuickTool = () => {
      Tween.get(this.shape)
      .to({ scaleX: 0, scaleY: 0, override: true, useTicks: true }, 500)
      .call(() => this.graphics.clear())
    }

  }

  return {
    drawTool: new DrawTool(),
    panTool: new PanTool(),
    qiuckTool: new QuickTool()
  }
}

// Select Tool

// Pan Tool
// two fingers
// zooming
