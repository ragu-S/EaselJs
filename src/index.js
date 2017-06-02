import App from './app';

window.addEventListener('load', () => {
  console.log('load detected', createjs);
  const { setUpCanvas, setUpRAFLoop, updateDateCanvasOnce } = App;

  setUpCanvas();

  setUpRAFLoop();

  var shape = new createjs.Shape();
  shape.graphics.beginFill('red').drawRect(0, 0, 120, 120);
  App.stage.addChild(shape);
  // updateDateCanvasOnce();
});