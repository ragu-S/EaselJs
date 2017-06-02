const createjs = require('createjs-browserify');
import mousePath from './mousePath.json';

// Singleton factory
export default function(stage, state) {
  const MOUSE_EVENTS = [
    'mouseleave',
    'mouseenter',
    'mousemove'
  ];

  const { Graphics, Shape } = createjs;

  class MouseEventRegister {
    disabledMouseEvents = [];

    constructor(props) {
      stage.addEventListener('stagemousedown', this.mouseDown);
      stage.addEventListener('stagemouseup', this.mouseUp);
      stage.addEventListener('stagemousemove', this.mouseMove);

    }

    disableEvent = (eventName) => {
      if(MOUSE_EVENTS.includes(eventName) &&
        !disabledMouseEvents.includes(eventName)) {
        disabledMouseEvents.push(eventName);
        return true;
      }

      return false;
    }

    mouseDown = ({ stageX, stageY }) => {
      console.log('mouse Down');
      state.mouseDown = true;
      state.mouseUp = false;
      
      const { strokeColor, fillColor, strokeWidth} = state.stroke;
      const shape = new Shape();
      shape.graphics
        .setStrokeStyle(strokeWidth)
        .beginStroke(strokeColor)
        .moveTo(stageX, stageY)

      stage.addChild(shape);

      window._shape = shape;
      this.shape = shape;
    }

    mouseUp = (ev) => {
      console.log('mouse Up');
      state.mouseDown = false;
      state.mouseUp = true;

      this.shape.graphics.endStroke();

      // this.graphics = null;
    }

    mouseMove = ({ stageX, stageY }) => {
      if(state.mouseDown && !state.mouseUp) {
        // const { strokeColor, fillColor, strokeWidth} = state.stroke;
        console.log('x:', stageX, 'y:', stageY);
        // this.graphics.setStrokeStyle(50);
        // this.graphics.beginStroke(strokeColor);
        this.shape.graphics.lineTo(stageX, stageY);
      }
    }
  }

  return new MouseEventRegister();
}