import {observable, extendShallowObservable, useStrict, autorun} from 'mobx';

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

  // Pointer Events
  @observable pointerDown = false;
  @observable pointerUp = false;

  // Canvas display settings
  @observable width = 0;
  @observable height = 0;
  @observable zoomIndex = 1;
  // @observable panX = 0;
  // @observable panY = 0;
  // @observable panCoordinates = extendShallowObservable(this, { // Stage x,y coords
  //   x: 0,
  //   y: 0
  // })

  // Mouse/Touch Coordinates
  mouse = extendShallowObservable(this, {
    x: 0,
    y: 0,
    target: null,
    pointerDown: false,
    pointerUp: true,
    touches: observable([])
  })

  /* Tools */
  @observable showTools = false;
  @observable selectedTool = TOOLS.DRAW;

  // Draw Line Props
  stroke = extendShallowObservable(this, {
    strokeColor: '#ff0000',
    fillColor: '#ff0000',
    strokeWidth: 1
  });
  TOOLS = TOOLS;

  constructor() {
    // this.handler3 = autorun(() => console.log('mouse prop changed', this.mouse.pointerUp));
  }
}

autorun('autoRunDebug', () => {
  console.log('state changed');
})

useStrict(true);

const state = new AppState();
window._STATE = state;
export default state;
