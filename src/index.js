import App from './app';
const createjs = require('createjs-browserify');

window.addEventListener('load', () => {
  require('./util/stats')();

  console.log('load detected');

  const { setUpCanvas, setUpRAFLoop, setUpTools, renderer } = App;

  setUpCanvas();

  setUpRAFLoop();

  setUpTools();
  // var shape = new createjs.Shape();
  // shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  // App.canvasLayer.addChild(shape);
  // updateDateCanvasOnce();
});
