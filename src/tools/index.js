// import app from '../app';
import {when, autorun, action} from 'mobx'
import { getPathBounds } from '../util/geometry-utils';

export default function(app) {
  const { PIXI, state, stage, canvasLayer } = app;
  const { Graphics } = PIXI;
  const { mouse, TOOLS } = state;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 2;
  const ZOOM_INCREMENT = 0.1;

  // Draw Tool, gets instantiated when user clicks
  class DrawTool {
    path = [];
    drawStarted = false; // internal state
    constructor() {
      this.listen();
    }
    // Activate when tool is selected
    listen = () => {
      return autorun(() => {
        // console.log('pointerUp', mouse.pointerUp);
        // console.log('pointerDown', mouse.pointerDown);
        // console.log('mouse x', mouse.x, 'mouse y', mouse.y, 'mouse.touches', mouse.touches.length);
        if(this.drawStarted === true && mouse.pointerDown === true && mouse.touches.length !== 0) {
          console.log('removing previous shape');
          // Remove previous drawing
          canvasLayer.removeChild(this.shape);

          // End draw
          this.drawStarted = false;
        }
        else if(this.drawStarted === false && mouse.pointerDown == true) {
          this.onDrawStart();
        }
        else if(mouse.pointerDown === true && mouse.pointerUp === false) {
          this.onDrawMove();
        }
        else if(this.drawStarted === true && mouse.pointerUp === true) {
          this.onDrawStop();
        }
      })
    }

    onDrawStart = () => {
      console.log('draw start')
      this.drawStarted = true;
      const { stroke } = mouse;
      const { x, y } = canvasLayer.toLocal(mouse);
      // const x = mouse.x;
      // const y = mouse.y;
      const { strokeColor, fillColor, strokeWidth } = stroke;
      const shape = new Graphics();

      shape.lineStyle(strokeWidth, strokeColor, 1);

      this.path = [x,y];
      this.shape = shape;
      canvasLayer.addChild(this.shape);
    }

    onDrawMove = () => {
      const { x, y } = canvasLayer.toLocal(mouse);
      // const x = mouse.x;
      // const y = mouse.y;

      // Detect any touch values outside of the range of current values (instrument error)
      const lastIndex = this.path.length - 1;

      if(Math.abs(y - this.path[lastIndex]) < 0.05 || Math.abs(x - this.path[lastIndex - 1]) < 0.05) return;
      this.path = this.path.concat([x,y]);

      this.shape.drawPolygon(this.path);
    }

    onDrawStop = () => {
      this.shape.cacheAsBitmapboolean = true;
      this.drawStarted = false;
      window.PATH = this.path;

      /* Shows bounding box for text paths */
      // const { strokeColor, fillColor, strokeWidth} = mouse.stroke;
      // const bounds = this.getPathBounds(this.path, strokeWidth);
      // const shape = new Graphics();
      // shape.lineStyle(1, 0xFF0000, 1);
      // shape.lineColor = 0xFF0000;
      // shape.drawRect(bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1);
      // canvasLayer.addChild(shape);
    }
  }

  class PanTool {
    originalX = -1;
    originalY = -1;
    zoomScale = null;
    mainLayerScale = 1;

    constructor() {
      /* User interactions:
      1) panning, if tool selected or two fingers used

      2) zooming is two fingers spread
      */
      this.disposer = autorun(() => {
        if(mouse.touches.length !== 0 && mouse.pointerDown == true) {
          const { x, y } = mouse;
          const secondTouch = mouse.touches[0];
          const pX = secondTouch.x
          const pY = secondTouch.y;

          // console.log('xD', Math.abs(pX - x));
          // Check if Zoom gesture
          if(this.zoomScale === null && Math.abs(pX - x) > 15 && Math.abs(pY - y) > 15) {
            this.zoomScale = Math.pow(pX - x, 2) + Math.pow(pY - y, 2);
            console.log('this.zoomScale', this.zoomScale);

            this.originalX = -1;
            this.originalY = -1;
            return;
          }
          else if(this.zoomScale !== null) {
            const newZoomScale = Math.pow(pX - x, 2) + Math.pow(pY - y, 2)
            const zoomRatio = (newZoomScale  - this.zoomScale) / this.zoomScale;
            console.log('zoomRatio', zoomRatio);
            this.mainLayerScale = zoomRatio > 1 ? this.mainLayerScale + ZOOM_INCREMENT : this.mainLayerScale - ZOOM_INCREMENT;

            if(this.mainLayerScale >= MIN_ZOOM && this.mainLayerScale <= MAX_ZOOM) {
              canvasLayer.scale.set({ x: this.mainLayerScale, y: this.mainLayerScale });
            }

            // console.log('mainLayerScale', this.mainLayerScale);
            this.originalX = -1;
            this.originalY = -1;
            return;
          }
          else {
            this.zoomScale = null;
          }

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
        //   console.log('clearing original x,y s');
          this.originalX = -1;
          this.originalY = -1;
        }
      })
    }
  }

  return {
    drawTool: new DrawTool(),
    panTool: new PanTool
  }
}

// Select Tool

// Pan Tool
// two fingers
// zooming
