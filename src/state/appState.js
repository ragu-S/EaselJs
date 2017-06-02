import {observable} from 'mobx';

/* App State */
class AppState {
  // App Level events
  @observable initiated = true;

  // Mouse Events
  @observable mouseDown = false;
  @observable mouseUp = false;

  /* Tools */
  // Draw Line Props
  @observable stroke = {
    strokeColor: '#ff0000',
    fillColor: '#ff0000',
    strokeWidth: 6
  }
}

export default AppState;