import * as PIXI from 'pixi.js';
import state from './state/appState';
import registerUserEvents from './user-interaction-handelers/registerUserEvents';
import initTools from './tools';

class App {
  state = state;
  updateCanvas = true;
  stage = null;
  canvasLayer = null;
  canvas = null;
  userEventsListener = null;
  tools = null;

  setUpCanvas = () => {
    //Create the renderer
    let renderer = new PIXI.WebGLRenderer(window.innerWidth * 4, window.innerHeight * 4, {antialias: true, transparent: true, resolution: 1});

    renderer.autoResize = true;

    document.body.appendChild(renderer.view);

    this.render = renderer.render.bind(renderer);

    // Will contain all shapes, drawings, etc.
    this.canvasLayer = new PIXI.Container();

    // Create a container object called the `stage`
    this.stage = new PIXI.Container();

    this.stage.addChild(this.canvasLayer);

    console.log(this.stage);

    this.interactionManager = renderer.plugins.interaction;//new PIXI.interaction.InteractionManager(renderer);

    this.renderer = renderer;
    this.userEventsListener = registerUserEvents({
      PIXI,
      stage: this.stage,
      canvasLayer: this.canvasLayer,
      state: this.state,
      interactionManager: this.interactionManager,
      renderer
    });
  }

  /* App RAF API */
  setUpRAFLoop = () => {
    let ticker = new PIXI.ticker.Ticker();
    ticker.autoStart = false;

    ticker.stop();

    ticker.add(time => {
      if(this.updateCanvas) this.render(this.stage);
    });

    this.ticker = ticker;

    this.ticker.start();
  }

  setUpTools = () => {
    console.log('setting up tools');
    this.tools = initTools({ PIXI, state: this.state, stage: this.stage, canvasLayer: this.canvasLayer });
  }
}

const app = new App();
window.APP = app;

export default app;
