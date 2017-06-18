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
  @observable zoomIndex = 1;
  @observable displayLayerBounds = extendShallowObservable({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height : window.innerHeight
  });

  /* Tools */
  @observable showTools = false;
  @observable selectedTool = TOOLS.DRAW;
}

class TouchState {
  @observable touches = [];
  @observable touchDownDistance = 0;
  @observable zoomTouchDistance = 0;
  @observable zooming = false;
}

class PixiPointerState {
  // Pointer Events
  @observable pointerDown = false;
  @observable pointerUp = false;
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

  @computed get style() {
    return [
      this.strokeColor,
      this.fillColor,
      this.strokeWidth
    ]
  }
}

class CanvasObjects {
  _drawnObjects = [];
  _shapeObjects = [];

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

const state = {
  appState,
  drawToolState,
  pointerState,
  touchState,
  canvasObjects,
  TOOLS,
  POINTER_TYPE
};

window._STATE = state;

export default state;
