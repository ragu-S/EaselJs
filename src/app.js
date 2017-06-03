import * as PIXI from 'pixi.js';
import AppState from './state/appState';
import mouseEvents from './user-interaction-handelers/mouseEvents';

class App {
  state = new AppState();
  updateCanvas = true;
  stage = null;
  canvas = null;
  mouseEventsRegistry = null;

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
    this.mouseEventsRegistry = mouseEvents(this.stage, this.state, this.interactionManager, renderer);
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
}

const app = new App();
window.APP = app;

export default app;
