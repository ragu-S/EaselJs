// import * as CREATEJS from 'CREATEJS.js';
const CREATEJS = require('createjs-browserify');
import state from './state/appState';
import registerUserEvents from './user-interaction-handelers/registerUserEvents';
import initTools from './tools';

class App {
  state = state;
  updateCanvas = true;
  stage = null;
  canvasLayer = null;
  canvas = null;
  userEventsListeners = null;
  tools = null;

  setUpCanvas = () => {
    //Create the renderer
    // let renderer = new CREATEJS.WebGLRenderer(window.innerWidth * 4, window.innerHeight * 4, {antialias: true, transparent: true, resolution: 1});

    // renderer.autoResize = true;

    // document.body.appendChild(renderer.view);

    // this.render = renderer.render.bind(renderer);
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.right = 0;
    canvas.style.bottom = 0;
    canvas.id = 'canvas';
    this.canvas = canvas;
    document.body.appendChild(canvas);

    // Will contain all shapes, drawings, etc.
    this.canvasLayer = new CREATEJS.Container();

    // Create a container object called the `stage`
    // this.stage = new CREATEJS.Container();


    this.stage = new CREATEJS.Stage('canvas');
    this.stage.addChild(this.canvasLayer);
    CREATEJS.Touch.enable(this.stage);

    console.log(this.stage);
    window._CREATEJS = CREATEJS;
    // this.interactionManager = renderer.plugins.interaction;//new CREATEJS.interaction.InteractionManager(renderer);

    // this.renderer = renderer;
    this.userEventsListeners = registerUserEvents({
      CREATEJS,
      stage: this.stage,
      canvasLayer: this.canvasLayer,
      state: this.state,
      canvas: this.canvas
      // interactionManager: this.interactionManager,
      // renderer
    });
  }

  /* App RAF API */
  setUpRAFLoop = () => {
    createjs.Ticker.addEventListener("tick", this.loop);
    // requestAnimationFrame(this.loop);
  }

  loop = () => {
    // if(this.updateCanvas) this.render(this.stage);
    this.stage.update();
    // requestAnimationFrame(this.loop);
  }

  loopOnce = () => {
    this.stage.update();
    // if(this.updateCanvas) this.render(this.stage);
  }

  setUpTools = () => {
    console.log('setting up tools');
    this.tools = initTools({ CREATEJS, userEventsListeners: this.userEventsListeners, state: this.state, stage: this.stage, canvasLayer: this.canvasLayer });
  }
}

const app = new App();
window.APP = app;

export default app;
