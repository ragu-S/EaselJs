import {observable, extendShallowObservable, computed, useStrict, autorun} from 'mobx';

const TOOLS = {
  DRAW: 'draw',
  SELECT: 'select',
  PAN: 'pan'
  //'pan'
};

const POINTER_TYPE = {
  FINGER: 0,
  POINTER: 1
}

/* App State */
class AppState {
  // App Level events
  @observable initiated = true;

  // Canvas display settings
  @observable width = window.innerWidth;
  @observable height = window.innerHeight;

  @observable displayLayerBounds = {
    x1: 0,
    y1: 0,
    x2: window.innerWidth,
    y2: window.innerHeight,
    get width() {
      return this.x2 - this.x1;
    },
    get height() {
      return this.y2 - this.y1;
    }
  };

  /* Tools */
  @observable showTools = false;
  @observable selectedTool = TOOLS.DRAW;
}

class TouchState {
  @observable touches = [];
  @observable touchDownDistance = 0;
}

class ZoomState {
  _scale = null;
  _distance = 0;
  @observable zoom = 1;
  @observable x = 0;
  @observable y = 0;
  @observable zoomTouchDistance = 0;
  MAX_ZOOM = 10;
  MIN_ZOOM = 0.3;
}

class PixiPointerState {
  // Pointer Events
  @observable pointerDown = false;
  @observable pointerUp = false;
  @observable pointerMove = false;
  @observable touchType = POINTER_TYPE.POINTER;

  // Pointer Coordinates
  @observable x = 0;
  @observable y = 0;

  // Target Id of Canvas Object
  @observable target = null;
}

class DrawTool {
  @observable strokeColor = '#0000ff';
  @observable fillColor = '#ff00FF';
  @observable strokeWidth = 1;
  @observable cachedScale = 1;
}

class QuickTool {
  @observable showTool = false;
  @observable selectedTool = TOOLS.PAN;
}

class CanvasObjects {
  _drawnShapeObjects = {};
  _shapeObjects = {};
  @observable numPathsDrawn = 0;
  @observable avgLineHeight = 0;
  @observable recentShapeUpdatedId = null;

  @computed get lastDrawnObject() {
    return this._drawnObjects[this._drawnObjects.length - 1];
  }
}

useStrict(true);

const appState = new AppState();
const drawToolState = new DrawTool();
const pointerState = new PixiPointerState();
const touchState = new TouchState();
const canvasObjects = new CanvasObjects();
const quickToolState = new QuickTool();
const zoomState = new ZoomState();

const state = {
  appState,
  drawToolState,
  pointerState,
  touchState,
  zoomState,
  canvasObjects,
  quickToolState,
  TOOLS,
  POINTER_TYPE
};

window._STATE = state;

export default state;
