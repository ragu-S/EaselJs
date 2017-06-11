'use strict';
import { action, autorun } from 'mobx';

// Singleton factory
export default function(app) {
  const {PIXI, stage, canvasLayer, state, interactionManager, renderer} = app;
  const MOUSE_EVENTS = [
    'pointerleave',
    'pointerenter',
    'pointermove',
    'pointerdown',
    'pointerup'
  ];

  const { Graphics } = PIXI;
  const { mouse } = state;
  class UserEventListeners {
    disabledMouseEvents = [];
    path = [];
    constructor(props) {
      stage.interactive = true;
      window.addEventListener('touchstart', this.multiTouch);
      interactionManager.on('touchstart', this.onPointerDown);
      interactionManager.on('touchend', this.onPointerUp);
      interactionManager.on('touchmove', this.onPointerMove, {capture: true, passive: true});
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
      console.log(ev);
      if(mouse.pointerDown === true && mouse.pointerUp === false) {
        // console.log('multi touch');
        // mouse.touches.push({
        //   x: x,
        //   y: y
        // })

        // console.log(mouse.touches);
      }
      else {
        mouse.pointerDown = true;
        mouse.pointerUp = false;
        mouse.x = x;
        mouse.y = y;
      }
    }

    @action
    onPointerUp = (ev) => {
      mouse.pointerDown = false;
      mouse.pointerUp = true;
      if(mouse.touches.length !== 0) {
        console.log('pointer Up, clearing touchlist');
        mouse.touches.pop();
      }
      // mouse.touches.remove(mouse.touches[0]);
      //mouse.touches.remove(getClosestPoint(ev.data.global, mouse.touches), 1);
    }

    @action
    onPointerMove = (ev) => {
      if(ev.data.targetTouches && ev.data.targetTouches.length !== 0) {
        console.log('touches', ev.data.targetTouches);
      }
      if(mouse.pointerDown && !mouse.pointerUp) {
        const { x, y } = ev.data.global;
        mouse.x = x;
        mouse.y = y;
      }
    }

    @action
    multiTouch = (ev) => {
      console.log(ev);
      if(ev.touches.length > 1) {
        mouse.touches.replace(
          [...ev.touches].map(touch => {
            return {
              x: touch.clientX,
              y: touch.clientY
            }
          })
        )
      }
    }
  }

  return new UserEventListeners();
}

function getClosestPoint(point, points) {
  return points.map(p => {
    return Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2);
  })
  .sort(-1)
  .pop();
}
