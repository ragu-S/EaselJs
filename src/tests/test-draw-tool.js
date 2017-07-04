import {
  untracked,
  reaction,
  autorun,
  action,
  autorunAsync
} from 'mobx';

import {
  getPathBounds,
  centerCoords,
  contains,
  updateContainerBounds,
  linest,
  boundsHitTest,
  pathsIntersects
} from '../util/geometry-utils';

import { debugTracker } from '../util/debug-stats-tool';

import { drawPath, drawPoint } from '../util/draw-path';
import charA from '../../raw-assets/json/a';
import charB from '../../raw-assets/json/b';

import {
  initDebugBoundingShapes,
  debugCurrentLineArea,
  debugDisplayArea,
  debugNewLineArea,
  debugBoundsBox,
  debugCurrentLinearLineSession,
  debugLinearLine
} from '../util/debug-bounding-shapes';


/*
  Draw Tool Colors:
  purple: 126 37 213
  dark blue: 52 66 87
  blue: rgb(75,135,203)
*/

export default function(app) {
  console.log('loading test-draw-tool');
  console.log(app.tools);
  const { canvasLayer, CREATEJS } = app;
  const { drawTool } = app.tools;

  drawPath([charA]);
  drawPath([charB], { strokeColor: '#0000ff'});

  const { x1, y1, x2, y2} = getPathBounds(charA);

  // const zeroSlopeSecantsCoords = getPathPeaks(charA, 10);
  const zeroSlopeSecantsCoords = getXPeak(charA, 10);

  console.log(zeroSlopeSecantsCoords);
  // debugger;
  const [x, y] = zeroSlopeSecantsCoords[0];

  // drawPath([], { strokeColor: 'rgb(75,135,203)'});
  drawPoint(zeroSlopeSecantsCoords, { strokeColor: 'rgb(126,37,213)', fillColor: 'rgb(126,37,213)'});
  drawPoint(getXPeak(charB, 10), { strokeColor: 'rgb(75,135,203)', fillColor: 'rgb(75,135,203)'});
}

function getPathPeaks(path, peaks = 2, strokeWidth = 1) {
  var x1 = path[0];
  var y1 = path[1];
  var x2 = path[2];
  var y2 = path[3];
  var delta = Math.trunc(y2 - y1) / Math.trunc(x2 - x1);
  const zeroSlopeSecantsCoords = [];

  let slope = delta/delta;

  for(let i = 4; i < path.length - 1; i+=2) {
    x1 = path[i-2];
    y1 = path[i-1];
    x2 = path[i];
    y2 = path[i+1];
    delta = Math.trunc((y2 - y1) / (x2 - x1));

    if(zeroSlopeSecantsCoords.length === peaks) break;

    if(Math.abs(delta) === 0) {
      zeroSlopeSecantsCoords.push([x2,y2]);
    }
  }
  return zeroSlopeSecantsCoords;
}

function getXPeak(path, peaks = 2, strokeWidth = 1) {
  const zeroSlopeSecantsCoords = [];
  var x1 = path[0];
  var y1 = path[1];
  var x2 = path[2];
  var y2 = path[3];
  var delta = Math.trunc(x2 - x1);

  let xSlope = delta/delta;

  for(let i = 4; i < path.length - 1; i+=2) {
    x1 = path[i-2];
    y1 = path[i-1];
    x2 = path[i];
    y2 = path[i+1];
    delta = Math.trunc(x2 - x1);
    let xSign = delta/delta;

    if(zeroSlopeSecantsCoords.length === peaks) break;

    if(xSign !== xSlope) {
      zeroSlopeSecantsCoords.push([(x2 + x1)/2,(y2 + y1)/2]);
      xSign = xSlope;
    }
  }

  return zeroSlopeSecantsCoords;
}










