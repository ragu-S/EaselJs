import * as PIXI from 'pixi.js';
import state from './state/appState';
import registerUserEvents from './user-interaction-handelers/registerUserEvents';
import initTools from './tools';

class App {
  state = state;
  updateCanvas = true;
  stage = null;
  canvas = null;
  userEventsListener = null;
  tools = null;

  setUpCanvas = () => {
    //Create the renderer
    let renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight, {antialias: true, transparent: true, resolution: 1});

    renderer.autoResize = true;

    document.body.appendChild(renderer.view);


    this.render = renderer.render.bind(renderer);

    // Create a container object called the `stage`
    this.stage = new PIXI.Container();

    console.log(this.stage);

    this.interactionManager = renderer.plugins.interaction;//new PIXI.interaction.InteractionManager(renderer);

    this.renderer = renderer;
    this.userEventsListener = registerUserEvents(PIXI, this.stage, this.state, this.interactionManager, renderer);
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
    // requestAnimationFrame(this.handleTick);
  }

  setUpTools = () => {
    this.tools = initTools(PIXI, this.state, this.stage);
  }
}

const app = new App();
window.APP = app;

export default app;
