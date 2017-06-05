'use strict';
// import * as PIXI from 'pixi.js';
import { action } from 'mobx';

// Singleton factory
export default function(PIXI, stage, state, interactionManager, renderer) {
  const MOUSE_EVENTS = [
    'pointerleave',
    'pointerenter',
    'pointermove',
    'pointerdown',
    'pointerup'
  ];

  const { Graphics } = PIXI;

  class UserEventListeners {
    disabledMouseEvents = [];

    constructor(props) {
      stage.interactive = true;
      interactionManager.on('touchstart', this.onPointerDown);
      interactionManager.on('touchend', this.onPointerUp);
      interactionManager.on('touchmove', this.onPointerMove);
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
    onPointerDown = (ev) => {
      const {data} = ev;
      const { x, y } = data.global;
      console.log('mouse Down', ev);
      state.pointerDown = true;
      state.pointerUp = false;
      state.x = x;
      state.y = y;

      // const { strokeColor, fillColor, strokeWidth} = state.stroke;
      // const shape = new Graphics();

      // shape.lineStyle(strokeWidth, strokeColor, 1);

      // this.path = [x,y];
      // // this.path.push([x,y]);
      // // shape.moveTo(x,y);
      // this.shape = shape;
      // stage.addChild(this.shape);

      // window._shape = shape;
    }

    @action
    onPointerUp = (ev) => {
      console.log('mouse Up', ev);
      state.pointerDown = false;
      state.pointerUp = true;
    }

    @action
    onPointerMove = ({ data }) => {
      if(state.pointerDown && !state.pointerUp) {
        const { x, y } = data.global;
        state.x = x;
        state.y = y;
      }
    }
  }

  return new UserEventListeners();
}
