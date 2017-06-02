const createjs = require('createjs-browserify');
import AppState from './state/appState';
import mouseEvents from './user-interaction-handelers/mouseEvents';

class App {
  state = new AppState();
  updateCanvas = true;
  stage = null;
  canvas = null;
  mouseEventsRegistry = null;

  setUpCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.id = 'canvas';

    document.body.appendChild(canvas);

    this.canvas = canvas;

    this.stage = new createjs.Stage('canvas');

    createjs.Touch.enable(this.stage);

    console.log(this.stage);

    this.mouseEventsRegistry = mouseEvents(this.stage, this.state);
  }

  /* App RAF API */
  setUpRAFLoop = () => {
    // Update stage will render next frame
    createjs.Ticker.addEventListener('tick', this.handleTick);
  }

  handleTick = () => {
    if(this.updateCanvas) this.stage.update();
  }

  updateDateCanvasOnce = () => {
    this.stage.update();
  }
}

const app = new App();
window.APP = app;

export default app;