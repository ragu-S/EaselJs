// import app from '../app';
import {when} from 'mobx'
import { getPathBounds } from '../util/geometry-utils';

export default function(PIXI, state, stage) {
  const { Graphics } = PIXI;

  // Draw Tool
  class DrawTool {
    path = [];
    drawStarted = false; // internal state
    constructor() {
      // Activate when tool is selected
      when('drawStart', () => {
        console.log('pointerDown', state.pointerDown, 'pointerUp', state.pointerUp);
        return state.selectedTool === 'draw' &&
          this.drawStarted === false &&
          state.pointerDown === true &&
          state.pointerUp === false;
      }, this.onDrawStart);

      when('drawMove', () => {
        console.log('draw move', this.drawStarted);
        return state.pointerDown === true &&
          state.pointerUp === false;
      }, this.onDrawMove);

      when('drawStop', () => {
        console.log('draw stop', this);
        return state.selectedTool === 'draw' &&
          this.drawStarted === true
      }, this.onDrawStop)
    }

    onDrawStart = () => {
      console.log('draw start')
      this.drawStarted = true;
      const { x, y, stroke } = state;
      const { strokeColor, fillColor, strokeWidth } = stroke;
      const shape = new Graphics();

      shape.lineStyle(strokeWidth, strokeColor, 1);

      this.path = [x,y];
      // this.path.push([x,y]);
      // shape.moveTo(x,y);
      this.shape = shape;
      stage.addChild(this.shape);

      window._shape = shape;
    }

    onDrawMove = () => {
      console.log('mouse move ');
      const { x, y } = state;

      // Detect any touch values outside of the range of current values (instrument error)
      // const lastIndex = this.path.length - 1;

      // if(Math.abs(y - this.path[lastIndex]) < 0.05 || Math.abs(x - this.path[lastIndex - 1]) < 0.05) return;
      // this.path = this.path.concat([x,y]);

      // this.shape.drawPolygon(this.path);
    }

    onDrawStop = () => {
      this.shape.cacheAsBitmapboolean = true;
      this.drawStarted = false;
      window.PATH = this.path;

      /* Shows bounding box for text paths */
      // const { strokeColor, fillColor, strokeWidth} = state.stroke;
      // const bounds = this.getPathBounds(this.path, strokeWidth);
      // const shape = new Graphics();
      // shape.lineStyle(1, 0xFF0000, 1);
      // shape.lineColor = 0xFF0000;
      // shape.drawRect(bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1);
      // stage.addChild(shape);
    }
  }

  return {
    drawTool: new DrawTool()
  }
}
// state.pointerDown && !state.pointerUp

// if(state.pointerDown && !state.pointerUp) {
//   const { x, y } = data.global;

//   // Detect any touch values outside of the range of current values (instrument error)
//   const lastIndex = this.path.length - 1;

//   if(Math.abs(y - this.path[lastIndex]) < 0.05 || Math.abs(x - this.path[lastIndex - 1]) < 0.05) return;
//   this.path = this.path.concat([x,y]);

//   this.shape.drawPolygon(this.path);
// }

// Select Tool

// Pan Tool
// two fingers
// zooming
