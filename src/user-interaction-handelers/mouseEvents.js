import * as CREATEJS from 'CREATEJS.js';
import { action } from 'mobx';

// Singleton factory
export default function(stage, state, interactionManager, renderer) {
  const { mouse } = state;
  const MOUSE_EVENTS = [
    'mouseleave',
    'mouseenter',
    'mousemove'
  ];

  const { Graphics } = CREATEJS;

  class MouseEventRegister {
    disabledMouseEvents = [];

    constructor(props) {
      console.log('registering MouseEventRegister');
      stage.interactive = true;
      interactionManager.on('mousedown', this.mouseDown);
      interactionManager.on('mouseup', this.mouseUp);
      interactionManager.on('mousemove', this.mouseMove);
    }

    disableEvent = (eventName) => {
      if(MOUSE_EVENTS.includes(eventName) &&
        !disabledMouseEvents.includes(eventName)) {
        disabledMouseEvents.push(eventName);
        return true;
      }

      return false;
    }

    @action
    mouseDown = ({data}) => {
      const { x, y } = data.global;
      console.log('mouse Down', data);
      mouse.mouseDown = true;
      mouse.mouseUp = false;

      const { strokeColor, fillColor, strokeWidth} = mouse.stroke;
      const shape = new Graphics();

      shape.lineStyle(strokeWidth, strokeColor, 1);

      this.path = [x,y];
      // this.path.push([x,y]);
      // shape.moveTo(x,y);
      this.shape = shape;
      stage.addChild(this.shape);

      window._shape = shape;
    }

    @action
    mouseUp = (ev) => {
      console.log('mouse Up');
      mouse.mouseDown = false;
      mouse.mouseUp = true;
      this.shape.cacheAsBitmapboolean = true;
      const { strokeColor, fillColor, strokeWidth} = state.stroke;
      const bounds = this.getPathBounds(this.path, strokeWidth);
      console.log(bounds);
      console.log(this.path);

      const shape = new Graphics();
      shape.lineStyle(1, 0xFF0000, 1);
      shape.lineColor = 0xFF0000;
      shape.drawRect(bounds.x1, bounds.y1, bounds.x2 - bounds.x1, bounds.y2 - bounds.y1);
      stage.addChild(shape);
    }

    @action
    mouseMove = ({ data }) => {
      if(mouse.mouseDown && !mouse.mouseUp) {
        const { x, y } = data.global;
        console.log('mouse move');
        // const { strokeColor, fillColor, strokeWidth} = mouse.stroke;
        console.log('x:', x, 'y:', y);
        this.path = this.path.concat([x,y]);
        this.shape.drawPolygon(this.path);
        // this.shape.lineTo(x, y);
      }
    }

    @action
    getPathBounds(path, strokeWidth = 0) {
      var x1 = path[0];
      var y1 = path[1];
      var x2 = 0;
      var y2 = 0;

      for(let i = 0; i < path.length - 1; i+=2) {
        let x = path[i];
        let y = path[i+1];
        if(x < x1) x1 = x;
        else if(x > x2) x2 = x;
        if(y < y1) y1 = y;
        else if(y > y2) y2 = y;
      }

      x1-=(strokeWidth/2);
      x2+=(strokeWidth/2);
      y1-=(strokeWidth/2);
      y2+=(strokeWidth/2);

      // Left, Top, Right, Bottom
      return { x1,y1,x2,y2 }
    }
  }

  return new MouseEventRegister();
}
