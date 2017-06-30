const CREATEJS = require('createjs-browserify');
const DEBUG_TOOL_MARGIN = {
  left: 5,
  top: 5,
  bottom: 5,
  right: 10
};
const debug_trackers = [];
let stage = null;
let widest = 0;

let defaultColors = [
  '#001f3f', // #001f3f 
  '#0074D9', // #0074D9 
  '#7FDBFF', // #7FDBFF 
  '#39CCCC', // #39CCCC 
  '#3D9970', // #3D9970 
  '#2ECC40', // #2ECC40 
  '#01FF70', // #01FF70 
  '#FFDC00', // #FFDC00 
  '#FF851B', // #FF851B 
  '#FF4136', // #FF4136 
  '#85144b', // #85144b 
  '#F012BE', // #F012BE 
  '#B10DC9', // #B10DC9 
  '#111111', // #111111 
  '#AAAAAA', // #AAAAAA 
  '#DDDDDD', // #DDDDDD 
];

export function addStageRef(stageRef) {
  stage = stageRef;
}

export function debugTracker(label, opts, color = null) {
  const tracker = debug_trackers.find(t => t.label === label) || addNewTracker(label, opts, color);
  const text = createStringFromOpts(label, opts);
  tracker.shape.text = text;

  alignDebugToolObjects(debug_trackers);
}

function alignDebugToolObjects() {
  let curYLine = 0;
  
  debug_trackers.forEach(({shape:t}) => {
    let { width, height } = t.getBounds();
    if(width > widest) widest = width;

    t.x = window.innerWidth - (widest + DEBUG_TOOL_MARGIN.right);
    t.y = curYLine + parseInt(t.font) + (DEBUG_TOOL_MARGIN.top);
    curYLine = (height + DEBUG_TOOL_MARGIN.top);
  })
}

function addNewTracker(label, opts = null, color = null) {
  if(color === null) color = defaultColors.splice(Math.floor(Math.random() * (defaultColors.length)), 1);
  const shape = new CREATEJS.Text(label, "12px Arial", color);
  shape.textBaseline = "alphabetic";
  stage.addChild(shape);

  const newTracker = {
    label,
    shape
  };

  debug_trackers.push(newTracker);

  return newTracker;
}

function createStringFromOpts(label, opts) {
  Object.keys(opts).forEach(key => {
    if(!isNaN(opts[key])) opts[key] = opts[key].toFixed(2);
  })
  return `${label}\n${JSON.stringify(opts, null, 2)}`;
}

