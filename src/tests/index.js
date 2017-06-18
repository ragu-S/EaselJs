import App from '../app';
import * as PIXI from 'pixi.js';

import sample from '../../raw-assets/json/sample-content.json';

window.addEventListener('load', () => {
  require('../util/stats')();

  console.log('loading test index.js');

  const { setUpCanvas, setUpRAFLoop, setUpTools, renderer, loopOnce } = App;

  setUpCanvas();

  setUpRAFLoop();

  setUpTools();

  // var shape = new createjs.Shape();
  // shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  // App.stage.addChild(shape);
  // // updateDateCanvasOnce();
  // let s = new PIXI.Graphics();
  // s.lineStyle(1, 0x000000, 1);

  // window._sample = sample.reduce((agg, arr) => agg.concat(arr));

  // _sample.forEach(p => s.drawPolygon(p));

  // App.canvasLayer.addChild(s);
  // let yOffset = 50;
  // let xOffset = 0;

  // Array.from(Array(10)).forEach((_, i) => {
  //   if(i === 1) {
  //     xOffset += 100;
  //     yOffset = 0;
  //   }

  //   let s = new PIXI.Graphics();
  //   s.lineStyle(1, 0x000000, 1);

  //   _sample.map(p => p.map(
  //     (point, i) =>
  //       i%2 !== 0 ? point + yOffset : point + xOffset
  //     )
  //   )
  //   .forEach(p => s.drawPolygon(p))
  //   App.canvasLayer.addChild(s);
  //   yOffset += 70;
  // })

  // loopOnce();
});
