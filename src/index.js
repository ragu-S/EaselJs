import App from './app';
const createjs = require('createjs-browserify');
import { spy } from 'mobx';

window.addEventListener('load', () => {
  const debugQueryParams = location.search.includes('debug') ? location.search.match(/(debug=)([0-9]+)(?=&|$)/i) : 0;
  window.DEBUG = debugQueryParams && debugQueryParams.length === 3 ? debugQueryParams[2] : 0;

  require('./util/stats')();

  console.log('load detected');

  const { setUpCanvas, setUpRAFLoop, setUpTools, renderer } = App;

  setUpCanvas();

  setUpRAFLoop();

  setUpTools();

  // DEBUG Mobx
  if(window.DEBUG >= 1) {
    spy(event => {
      if(event.type === 'action') {
        console.log(`${event.name} with args: ${event.arguments}`)
      }
    })
  }
  
  // var shape = new createjs.Shape();
  // shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  // App.canvasLayer.addChild(shape);
  // updateDateCanvasOnce();
});
