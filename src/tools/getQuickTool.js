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

  return new QuickTool();
}
