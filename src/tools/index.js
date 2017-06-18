// import app from '../app';
import {reaction, autorun, action} from 'mobx'
import { getPathBounds } from '../util/geometry-utils';
import throttle from 'lodash.throttle';


export default function(app) {
  const { PIXI, state, stage, canvasLayer } = app;
  const { Graphics, Shape } = PIXI;
  const { appState, pointerState, drawToolState, touchState, canvasObjects, TOOLS, POINTER_TYPE: { POINTER, FINGER } } = state;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 10;
  const ZOOM_INCREMENT = 0.1;

  let MAX_PAN_X = window.innerWidth * 1.5;
  let MAX_PAN_Y = window.innerHeight * 1.5;
  const boundaryShape = new Shape();
  boundaryShape.graphics
    .setStrokeStyle(2)
    .beginStroke('#00ff00')
    .drawRect(0,0)
    .endStroke();

  stage.addChild(
    boundaryShape
  );

  // Draw Tool, gets instantiated when user clicks
  class DrawTool {
    path = [];
    drawStarted = false; // internal state
    previousTouchType = POINTER;
    previousBounds = null;
    leftMostBox = null;
    rightMostBox = null;
    topMostBox = null;
    bottomMostBox = null;
    boundary = new Shape();
    /*
     boundingBoxes
     leftMostBox
     rightMostBox
     topMostBox
     bottomMostBox
     */
    constructor() {
      this.listen();

      this.drawSession = [];

      this.shape = new Shape();

      canvasLayer.addChild(
        this.shape
      );

      canvasLayer.addChild(this.boundary);

      // Listen to style changes
      autorun(() => {
        if(drawToolState.edited === true) {
          console.log(
            'strokeColor', drawToolState.strokeColor,
            'fillColor', drawToolState.fillColor,
            'strokeWidth', drawToolState.strokeWidth
          )

          // const {x,y,x2,y2} = this.getBounds();

          // this.shape.cache(x,y,x2,y2);
          this.shape = new Shape();

          canvasLayer.addChild(
            this.shape
          )
        }
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

      const { strokeColor, fillColor, strokeWidth } = drawToolState;
      this.drawSession.push([x,y]);

      this.strokeWidth = strokeWidth;
      this.strokeColor = strokeColor;
    }

    onDrawMove = () => {
      const x = pointerState.x;
      const y = pointerState.y;
      const path = this.drawSession[this.drawSession.length - 1];
      // Detect any touch values outside of the range of current values (instrument error)
      const lastIndex = path.length - 1;//path[];

      if(Math.abs(y - path[lastIndex]) < 0.05 || Math.abs(x - path[lastIndex - 1]) < 0.05) return;

      this.drawSession[this.drawSession.length - 1] = path.concat([x,y]);

      this.draw();
    }


    onDrawStop = () => {
      this.drawStarted = false;
      window.PATH = this.path;

      /* Shows bounding box for text paths */
      const { strokeColor, fillColor, strokeWidth} = drawToolState;
      const lastDrawSession = this.drawSession[this.drawSession.length - 1];
      const bounds = getPathBounds(lastDrawSession, strokeWidth);

      if(this.previousBounds !== null) {
        if(this.x1 > bounds.x1) this.x1 = bounds.x1;
        if(this.y1 > bounds.y1) this.y1 = bounds.y1;
        if(this.x2 < bounds.x2) this.x2 = bounds.x2;
        if(this.y2 < bounds.y2) this.y2 = bounds.y2;
      }
      else {
        this.previousBounds = bounds;

        this.x1 = bounds.x1;
        this.y1 = bounds.y1;
        this.x2 = bounds.x2;
        this.y2 = bounds.y2;
      }

      this.drawBoundaryBox = {
        x1: this.x1,
        y1: this.y1,
        x2: this.x2,
        y2: this.y2
      }

      this.shape.setBounds(
        this.drawBoundaryBox.x1,
        this.drawBoundaryBox.y1,
        this.drawBoundaryBox.x2 - this.drawBoundaryBox.x1,
        this.drawBoundaryBox.y2 - this.drawBoundaryBox.y1
      )

      appState.displayLayerBounds = this.shape.getBounds();

      this.boundary.graphics
        .clear()
        .setStrokeStyle(1)
        .beginStroke('#000000')
        .drawRect(
          this.drawBoundaryBox.x1,
          this.drawBoundaryBox.y1,
          this.drawBoundaryBox.x2 - this.drawBoundaryBox.x1,
          this.drawBoundaryBox.y2 - this.drawBoundaryBox.y1
        )
        .endStroke()

      // const shape = new Shape();
      // shape.graphics
      //   .setStrokeStyle(1)
      //   .beginStroke('#FF0000')
      //   .drawRect(bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1)
      //   .endStroke()

      // canvasLayer.addChild(shape);
    }

    draw = () => {
      const graphics = this.shape.graphics
          .clear()
          .setStrokeStyle(this.strokeWidth)
          .beginStroke(this.strokeColor);

      this.drawSession.forEach(p => {
        graphics.moveTo(p[0],p[1]);
        for(let i = 2; i < p.length - 1; i +=2 ) {
          graphics.lineTo(p[i], p[i + 1]);
        }
      })
    }

    // @action
    // setStore = (keyValuePairs = []) => {
    //   keyValuePairs.forEach(([key, value]) => appState[key] = value)
    // }
  }

  class PanTool {
    originalX = -1;
    originalY = -1;
    zoomScale = 1;
    mainLayerScale = 1;
    prevZoomDistance = 0;
    constructor() {
      window._PAN = this;
      /* User interactions:
      1) panning, two fingers used

      2) zooming is two fingers spread
      */
      this.panDisposer = autorun(() => {
        if(touchState.touches.length > 1 && pointerState.pointerDown == true) {
          let returnEarly = false;
          let MAX_PAN_X = window.innerWidth * 1.5 * this.zoomScale;
          let MAX_PAN_Y = window.innerHeight * 1.5 * this.zoomScale;
          const bounds = appState.displayLayerBounds;

          const point = canvasLayer.localToGlobal(pointerState.x, pointerState.y);
          const secondTouch = touchState.touches[1];
          const point2 = canvasLayer.localToGlobal(secondTouch.x, secondTouch.y);

          const x = (point.x + point2.x) / 2;
          const y = (point.y + point2.y) / 2;

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

          if(bounds !== null) {
            MAX_PAN_X = (Math.max(window.innerWidth, bounds.width));
            MAX_PAN_Y = (Math.max(window.innerHeight, bounds.height));
          }

          if((Math.abs(canvasLayer.x + xPos)) > MAX_PAN_X * this.zoomScale) {
            xPos = 0;
          }
          if((Math.abs(canvasLayer.y + yPos)) > MAX_PAN_Y * this.zoomScale) {
            yPos = 0;
          }

          this.originalX = x;
          this.originalY = y;

          canvasLayer.x += xPos;
          canvasLayer.y += yPos;
        }
        else {
          this.originalX = -1;
          this.originalY = -1;
        }
      })

      this.zoomDisposer = autorun(() => {
        // console.log('zoom autorun');
        if(touchState.zoomTouchDistance > this.prevZoomDistance) this.zoomScale += ZOOM_INCREMENT;
        else this.zoomScale -= ZOOM_INCREMENT;

        this.prevZoomDistance = touchState.zoomTouchDistance;

        if(this.zoomScale > MAX_ZOOM) this.zoomScale = MAX_ZOOM;
        else if(this.zoomScale < MIN_ZOOM) this.zoomScale = MIN_ZOOM;
        else {
          canvasLayer.set({ scaleX: this.zoomScale, scaleY: this.zoomScale });
          // canvasLayer.scaleX = this.zoomScale;
          // canvasLayer.scaleY = this.zoomScale;
        }

        // const point = canvasLayer.localToGlobal(pointerState.x, pointerState.y);
        // const secondTouch = touchState.touches[1];
        // const point2 = canvasLayer.localToGlobal(secondTouch.x, secondTouch.y);


        // const x = (point.x + point2.x) / 2;
        // const y = (point.y + point2.y) / 2;

        // let xPos = 0;
        // let yPos = 0;
        // graphGraphics.position.x += (afterTransform.x - beforeTransform.x) * graphGraphics.scale.x;
        // graphGraphics.position.y += (afterTransform.y - beforeTransform.y) * graphGraphics.scale.y;
      })
    }

    zoomHander = throttle(() => {
      // canvasLayer.x = (canvasLayer.x * this.zoomScale - canvasLayer.x) * this.zoomScale;
      // canvasLayer.y = (canvasLayer.y * this.zoomScale - canvasLayer.y) * this.zoomScale;
    }, 50);

    centerCanvas = () => {

    }
  }


  class QuickTool {
    // manages UI, tools, etc.
    // Pops up after user taps with one finger (or pointerUp, after moving for a while)
    constructor() {
      window.QUICKTOOL = this;


    }

    showQuickTool = () => {

    }

    hideQuickTool = () => {

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
