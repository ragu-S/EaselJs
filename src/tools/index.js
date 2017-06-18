// import app from '../app';
import {when, autorun, action} from 'mobx'
import { getPathBounds } from '../util/geometry-utils';

export default function(app) {
  const { PIXI, state, stage, canvasLayer } = app;
  const { Graphics, Shape } = PIXI;
  const { pointerState, drawToolState, touchState, canvasObjects, TOOLS } = state;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;
  const ZOOM_INCREMENT = 0.1;

  // Draw Tool, gets instantiated when user clicks
  class DrawTool {
    path = [];
    drawStarted = false; // internal state
    constructor() {
      this.listen();

      this.drawSession = [];

      this.shape = new Shape();

      canvasLayer.addChild(
        this.shape
      );

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
        if(this.drawStarted === true && pointerState.pointerDown === true && touchState.touches.length > 1) {
          console.log('removing previous shape');
          // Remove previous drawing
          this.drawSession.pop();

          this.draw();

          // End draw
          this.drawStarted = false;
        }
        else if(this.drawStarted === false && pointerState.pointerDown == true) {
          this.onDrawStart();
        }
        else if(pointerState.pointerDown === true && pointerState.pointerUp === false) {
          this.onDrawMove();
        }
        else if(this.drawStarted === true && pointerState.pointerUp === true) {
          this.onDrawStop();
        }
      })
    }

    onDrawStart = () => {
      console.log('draw start')
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
      // const { strokeColor, fillColor, strokeWidth} = pointerState.stroke;
      // const bounds = this.getPathBounds(this.path, strokeWidth);
      // const shape = new Graphics();
      // shape.lineStyle(1, 0xFF0000, 1);
      // shape.lineColor = 0xFF0000;
      // shape.drawRect(bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1);
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
  }

  class PanTool {
    originalX = -1;
    originalY = -1;
    zoomScale = 1;
    mainLayerScale = 1;
    prevZoomDistance = 0;
    constructor() {
      /* User interactions:
      1) panning, if tool selected or two fingers used

      2) zooming is two fingers spread
      */
      this.disposer = autorun(() => {
        if(touchState.touches.length > 1 && pointerState.pointerDown == true) {
          const point = canvasLayer.localToGlobal(pointerState.x, pointerState.y);
          const secondTouch = touchState.touches[1];
          const point2 = canvasLayer.localToGlobal(secondTouch.x, secondTouch.y);

          // console.log('multitouch', touchState.touches.length);

          const x = (point.x + point2.x) / 2;
          const y = (point.y + point2.y) / 2;
          // console.log('xD', Math.abs(pX - x));
          // Check if Zoom gesture
          // if(this.zoomScale === null) {
          console.log('zoom indicator');
          // if(this.zoomScale <= MAX_ZOOM && this.zoomScale >= MIN_ZOOM) {
          //   if(touchState.zoomTouchDistance > this.prevZoomDistance) {
          //     canvasLayer.scaleX += ZOOM_INCREMENT;
          //     canvasLayer.scaleY += ZOOM_INCREMENT;
          //     this.zoomScale += ZOOM_INCREMENT;
          //   }
          //   else {
          //     canvasLayer.scaleX -= ZOOM_INCREMENT;
          //     canvasLayer.scaleY -= ZOOM_INCREMENT;
          //     this.zoomScale -= ZOOM_INCREMENT;
          //   }
          //   console.log('this.zoomScale', this.zoomScale);
          //   this.prevZoomDistance = touchState.zoomTouchDistance;
          // }
          // }
          //   this.zoomScale = Math.pow(pX - x, 2) + Math.pow(pY - y, 2);
          //   console.log('this.zoomScale', this.zoomScale);

          //   this.originalX = -1;
          //   this.originalY = -1;
          //   return;
          // }
          // else if(this.zoomScale !== null) {
          //   const newZoomScale = Math.pow(pX - x, 2) + Math.pow(pY - y, 2)
          //   const zoomRatio = (newZoomScale  - this.zoomScale) / this.zoomScale;
          //   console.log('zoomRatio', zoomRatio);
          //   this.mainLayerScale = zoomRatio > 1 ? this.mainLayerScale + ZOOM_INCREMENT : this.mainLayerScale - ZOOM_INCREMENT;

          //   if(this.mainLayerScale >= MIN_ZOOM && this.mainLayerScale <= MAX_ZOOM) {
          //     canvasLayer.scale.set({ x: this.mainLayerScale, y: this.mainLayerScale });
          //   }

          //   // console.log('mainLayerScale', this.mainLayerScale);
          //   this.originalX = -1;
          //   this.originalY = -1;
          //   return;
          // }
          // else {
          //   this.zoomScale = null;
          // }

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
    }
  }

  return {
    drawTool: new DrawTool(),
    panTool: new PanTool()
  }
}

// Select Tool

// Pan Tool
// two fingers
// zooming
