import {
  autorun,
  action
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
  const { state, canvasLayer } = app;
  const { appState, pointerState, touchState, zoomState, POINTER_TYPE: { POINTER, FINGER } } = state;
  window.globalDrawSession = [];

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

  return new PanTool();
}
