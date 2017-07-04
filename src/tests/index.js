import App from '../app';
//import sample from '../../raw-assets/json/sample-content.json';
import initUtils from '../util';
import testDrawTool from './test-draw-tool';

window.addEventListener('load', () => {
  require('../util/stats')();

  console.log('loading test index.js');

  const { setUpCanvas, setUpRAFLoop, setUpTools, renderer, loopOnce } = App;

  setUpCanvas();

  setUpRAFLoop();

  // initialize utils that need App refs
  initUtils(App);

  setUpTools();

  // Tests
  testDrawTool(App);
});
