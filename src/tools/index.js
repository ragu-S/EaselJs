// import app from '../app';
import {when, reaction, autorun, action} from 'mobx'
import { getPathBounds, centerCoords } from '../util/geometry-utils';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';

export default function(app) {
  const { CREATEJS, state, stage, canvasLayer, userEventsListeners } = app;
  const { Graphics, Shape, Tween } = CREATEJS;
  const { appState, pointerState, drawToolState, quickToolState, touchState, canvasObjects, TOOLS, POINTER_TYPE: { POINTER, FINGER } } = state;
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 10;
  const ZOOM_INCREMENT = 0.1;
  const DEBUG_TOOL_MARGIN = {
    left: 5,
    top: 5,
    bottom: 5,
    right: 10
  };
  /* DEBUG */
  // const boundaryShape = new Shape();

  // boundaryShape.graphics
  //   .setStrokeStyle(2)
  //   .beginStroke('#00ff00')
  //   .drawRect(0,0)
  //   .endStroke();

  // stage.addChild(
  //   boundaryShape
  // );
  let all_debug_tools = [];
  function alignDebugToolObjects() {
    let curYLine = 0;
    all_debug_tools.forEach(t => {
      const { width, height } = t.getBounds();
      t.x = window.innerWidth - (width + DEBUG_TOOL_MARGIN.right);
      t.y = curYLine + parseInt(t.font) + (DEBUG_TOOL_MARGIN.top);
      curYLine = (height + DEBUG_TOOL_MARGIN.top);
    })
  }

  const displayObjectText = new CREATEJS.Text("displayObjectText", "12px Arial", "#ff7700");
  const panZoomText = new CREATEJS.Text("panZoomText", "12px Arial", "#ff0592");
  displayObjectText.textBaseline = "alphabetic";
  panZoomText.textBaseline = "alphabetic";

  stage.addChild(displayObjectText, panZoomText);

  all_debug_tools = all_debug_tools.concat(displayObjectText, panZoomText)

  alignDebugToolObjects(all_debug_tools);

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
    cachedShape = null;
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
      this.cachedShape = new Shape();
      canvasLayer.x = 0;
      canvasLayer.y = 0;

      canvasLayer.addChild(
        this.shape,
        this.cachedShape
      );

      canvasLayer.addChild(this.boundary);

      // DEBUG
      // show debug values

      // Listen to style changes
      autorun(() => {
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

      reaction(() => {
        // return [
        //   ,
        //   appState.displayLayerBounds
        // ]
        return appState.zoomIndex;
      }, () => {
        console.log('updating cache');
        const { x, y, width, height } = appState.displayLayerBounds;
        this.cachedShape.cache(x,y,width,height,appState.zoomIndex);
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

      this.fillColor = fillColor;
      this.strokeWidth = strokeWidth;
      this.strokeColor = strokeColor;

      if(this.cacheResult) clearTimeout(this.cacheResult);
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

    @action
    onDrawStop = () => {
      this.drawStarted = false;
      window.PATH = this.path;

      /* Shows bounding box for text paths */
      const lastDrawSession = this.drawSession[this.drawSession.length - 1];
      const bounds = getPathBounds(lastDrawSession, this.strokeWidth);

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

      displayObjectText.text =
        `DisplayLayerBounds: {
          x:${appState.displayLayerBounds.x.toFixed(2)},
          y:${appState.displayLayerBounds.y.toFixed(2)},
          width:${appState.displayLayerBounds.width.toFixed(2)},
          height:${appState.displayLayerBounds.height.toFixed(2)}
        }`;

      alignDebugToolObjects(all_debug_tools);

      if(this.cacheResult) clearTimeout(this.cacheResult);
      // if(this.drawSession.length < 4) return;

      this.cacheResult = setTimeout(this.updateCache, 1500);
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

    updateCache = () => {
      console.log('setting new cache!');
      const { x, y, width, height } = appState.displayLayerBounds;

      const updates = new Graphics()
        .setStrokeStyle(this.strokeWidth)
        .beginStroke(this.strokeColor)

      this.cachedShape.graphics.instructions.slice(0,-2)
      .concat(this.shape.graphics.instructions.slice(1,-2))
      .forEach(i => updates.append(i));

      this.cachedShape.set({graphics: updates})

      this.cachedShape.cache(x,y,width,height,appState.zoomIndex);
      this.shape.graphics.clear();
      this.drawSession = [];
    }
  }

  class PanTool {
    originalX = -1;
    originalY = -1;
    zoomScale = 1;
    mainLayerScale = 1;
    prevZoomDistance = 0;
    constructor() {
      window._PAN = this;
      this.initialized = false;
      // this.updateAppStoreZoomIndex = debounce(action(this.updateAppStoreZoomIndex.bind(this)), 150);
      /* User interactions:
      1) panning, two fingers used

      2) zooming is two fingers spread
      */
      this.panDisposer = autorun(() => {
        console.log('pointerState.touchType', pointerState.touchType);
        console.log('pointerState', pointerState.x, 'touches length', touchState.touches.length);
        if(touchState.touches.length === 1 && pointerState.touchType === FINGER && pointerState.pointerMove === true) {
          console.log('panning');
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

          panZoomText.text = `Pan Zoom Text: {
            x: ${canvasLayer.x.toFixed(2)},
            y: ${canvasLayer.y.toFixed(2)},
            zoom: ${this.zoomScale.toFixed(2)}
          }`

          alignDebugToolObjects();
        }
        else {
          this.originalX = -1;
          this.originalY = -1;
        }
      })

      this.zoomDisposer = reaction(() => touchState.zoomTouchDistance, () => {
        if(touchState.touches.length <= 1) return;
        if(touchState.zoomTouchDistance > this.prevZoomDistance) this.zoomScale += ZOOM_INCREMENT;
        else this.zoomScale -= ZOOM_INCREMENT;

        this.prevZoomDistance = touchState.zoomTouchDistance;

        const point = touchState.touches[0];
        const secondTouch = touchState.touches[1];

        const x = (point.x + secondTouch.x) / 2;
        const y = (point.y + secondTouch.y) / 2;

        const point2BeforeTransform = canvasLayer.globalToLocal(x, y);

        if(this.zoomScale > MAX_ZOOM) this.zoomScale = MAX_ZOOM;
        else if(this.zoomScale < MIN_ZOOM) this.zoomScale = MIN_ZOOM;
        else {
          canvasLayer.set({ scaleX: this.zoomScale, scaleY: this.zoomScale });
          this.updateAppStoreZoomIndex();
        }

        const pointAfterTransform = canvasLayer.globalToLocal(x,y);

        // let xPos = 0;
        // let yPos = 0;
        canvasLayer.x += (pointAfterTransform.x - point2BeforeTransform.x) * this.zoomScale;
        canvasLayer.y += (pointAfterTransform.y - point2BeforeTransform.y) * this.zoomScale;

        panZoomText.text = `Pan Zoom Text: {
          x: ${canvasLayer.x.toFixed(2)},
          y: ${canvasLayer.y.toFixed(2)},
          zoom: ${this.zoomScale.toFixed(2)}
        }`

        alignDebugToolObjects();
      })
    }

    updateAppStoreZoomIndex = debounce(action(() => {
      console.log('setting zoom index');
      appState.zoomIndex = this.zoomScale;
    }), 150)

    centerCanvas = () => {

    }
  }


  class QuickTool {
    // manages UI, tools, etc.
    // Pops up after user taps with one finger (or pointerUp, after moving for a while)
    constructor() {
      window.QUICKTOOL = this;

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

      userEventsListeners.on('onefingerclick', (ev) => {
        quickToolState.showTool = !quickToolState.showTool;
      })
    }

    showQuickTool = () => {
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

      Tween.get(this.shape)
       .to({ scaleX: 1, scaleY: 1, override: true, useTicks: true }, 500);

      // const boundaryShape = new Shape();

      // boundaryShape.graphics
      //   .setStrokeStyle(2)
      //   .beginStroke('#00ff00')
      //   .drawRect(0,0)
      //   .endStroke();

      // stage.addChild(
      //   boundaryShape
      // );
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
