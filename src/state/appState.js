import {observable, useStrict, autorun} from 'mobx';

const TOOLS = {
  DRAW: 'draw',
  SELECT: 'select',
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
  @observable panCoordinates = { // Stage x,y coords
    x: 0,
    y: 0
  }

  // Mouse/Touch Coordinates
  @observable x = 0;
  @observable y = 0;

  /* Tools */
  @observable showTools = false;
  @observable selectedTool = TOOLS.DRAW;

  // Draw Line Props
  @observable stroke = {
    strokeColor: '#ff0000',
    fillColor: '#ff0000',
    strokeWidth: 1
  }
  TOOLS
}

autorun('autoRunDebug', () => {
  console.log('state changed');
})

useStrict(true);

const state = new AppState();
window._STATE = state;
export default state;
