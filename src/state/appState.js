import {observable, extendShallowObservable, computed, useStrict, autorun} from 'mobx';

const TOOLS = {
  DRAW: 'draw',
  SELECT: 'select',
  PAN: 'pan'
  //'pan'
};

/* App State */
class AppState {
  // App Level events
  @observable initiated = true;

  // Canvas display settings
  @observable width = 0;
  @observable height = 0;
  @observable zoomIndex = 1;


  /* Tools */
  @observable showTools = false;
  @observable selectedTool = TOOLS.DRAW;
}

class TouchState {
  @observable touches = [];
  @observable zoomTouchDistance = 0;
}

class PixiPointerState {
  // Pointer Events
  @observable pointerDown = false;
  @observable pointerUp = false;

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
  TOOLS
};

window._STATE = state;

export default state;
