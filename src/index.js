import App from './app';
import * as PIXI from 'pixi.js';

window.addEventListener('load', () => {
  console.log('load detected');
  const { setUpCanvas, setUpRAFLoop, setUpTools, renderer } = App;

  setUpCanvas();

  setUpRAFLoop();

  setUpTools();
  // var shape = new createjs.Shape();
  // shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  // App.stage.addChild(shape);
  // updateDateCanvasOnce();
});
