const createjs = require('createjs-browserify');
let updateCanvas = false;

const APP = {
  /* App Canvas refs */
  stage: null,

  /* App RAF API */
  setUpRAFLoop: function() {
    // Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
  },
  handleTick: function() {
    if(updateCanvas) stage.update();
  },
  updateDateCanvasOnce: function() {
    stage.update();
  }
};

window.addEventListener('load', () => {
  console.log('load detected', createjs);

  setUpCanvas();

  setUpRAFLoop();

  // var shape = new createjs.Shape();
  // shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  // stage.addChild(shape);
  updateDateCanvasOnce();
});

function setUpCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.id = 'canvas';

  document.body.appendChild(canvas);

  APP.stage = new createjs.Stage('canvas');
}