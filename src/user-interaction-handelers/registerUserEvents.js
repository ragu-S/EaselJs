'use strict';
import { action, autorun } from 'mobx';
import { getDistanceBetween } from '../util/geometry-utils';

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
  const { pointerState, touchState } = state;
  class UserEventListeners {
    disabledMouseEvents = [];
    path = [];
    constructor(props) {
      // canvasLayer.interactive = true;
      // window.addEventListener('touchstart', this.multiTouch);
      stage.addEventListener('stagemousedown', this.onPointerDown);
      stage.addEventListener('stagemouseup', this.onPointerUp);
      stage.addEventListener('stagemousemove', this.onPointerMove);
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
      const { stageX, stageY, nativeEvent } = ev;

      console.log(ev);
      // if(pointerState.pointerDown === true && pointerState.pointerUp === false) {
      if(nativeEvent.touches && nativeEvent.touches.length > 1) {
        // console.log('multi touch');
        // if(ev.touches.length > 1) {
          touchState.touches.replace(
            [...nativeEvent.touches].map(touch => {
              return {
                x: touch.clientX,
                y: touch.clientY
              }
            })
          )
        // }
        // console.log(touchState.touches);
      }
      else {
        pointerState.pointerDown = true;
        pointerState.pointerUp = false;
        const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
        pointerState.x = x;
        pointerState.y = y;
      }
    }

    @action
    onPointerUp = (ev) => {
      pointerState.pointerDown = false;
      pointerState.pointerUp = true;
      if(touchState.touches.length > 1) {
        console.log('pointer Up, clearing touchlist');
        touchState.touches.pop();
      }
      // touchState.touches.remove(touchState.touches[0]);
      //touchState.touches.remove(getClosestPoint(ev.data.global, touchState.touches), 1);
    }

    @action
    onPointerMove = (ev) => {
      // console.log(ev);
      if(pointerState.pointerDown && !pointerState.pointerUp) {
        const { stageX, stageY, nativeEvent } = ev;
        if(nativeEvent.touches && nativeEvent.touches.length === 2) {
          // console.log('touches', ev.nativeEvent.touches);

          const distance = getDistanceBetween({
            x: nativeEvent.touches[0].clientX,
            y: nativeEvent.touches[0].clientY
          }, {
            x: nativeEvent.touches[1].clientX,
            y: nativeEvent.touches[1].clientY
          })

          if(Math.abs(touchState.zoomTouchDistance - distance) > 20) {
            console.log('zoom distance', touchState.zoomTouchDistance);
            touchState.zoomTouchDistance = distance;
          }
          // touchState.touches.replace(
          //   [...nativeEvent.touches].map(touch => {
          //     return {
          //       x: touch.clientX,
          //       y: touch.clientY
          //     }
          //   })
          // )
        }
        const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
        pointerState.x = x;
        pointerState.y = y;
      }
    }

    @action
    multiTouch = (ev) => {
      console.log(ev);
      // if(ev.touches.length > 1) {
      //   touchState.touches.replace(
      //     [...ev.touches].map(touch => {
      //       return {
      //         x: touch.clientX,
      //         y: touch.clientY
      //       }
      //     })
      //   )
      // }
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
