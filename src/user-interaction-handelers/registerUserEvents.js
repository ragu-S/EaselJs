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
  const { pointerState, touchState, POINTER_TYPE: { POINTER, FINGER } } = state;
  class UserEventListeners {
    disabledMouseEvents = [];
    path = [];
    constructor(props) {
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
      if(nativeEvent.touches !== undefined) {
        const touches = nativeEvent.touches;
        let touchType = POINTER;

        if((touches[0].radiusX <= 0.2 || touches[0].radiusY <= 0.2) && pointerState !== POINTER) {
          touchType = POINTER;
          console.log('pointer input device')
        }
        else {
          touchType = FINGER;
          console.log('finger touch!');
        }

        if(touches.length > 1) {
          touchState.touches.replace(
            [...touches].map(touch => {
              return {
                x: touch.clientX,
                y: touch.clientY
              }
            })
          )

          touchState.touchDownDistance = getDistanceBetween({
            x: touches[0].clientX,
            y: touches[0].clientY
          }, {
            x: touches[1].clientX,
            y: touches[1].clientY
          })
        }
        else {
          pointerState.pointerDown = true;
          pointerState.pointerUp = false;
          const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
          pointerState.x = x;
          pointerState.y = y;
        }

        pointerState.touchType = touchType;
      }
      else {
        console.log('mouse event');
      }
    }

    @action
    onPointerUp = (ev) => {
      pointerState.pointerDown = false;
      pointerState.pointerUp = true;
      if(touchState.touches.length > 1) {
        console.log('pointer Up, clearing touchlist');
        touchState.touches.clear();
        touchState.touchDownDistance = 0;
        touchState.zoomTouchDistance = 0;
      }
    }

    @action
    onPointerMove = (ev) => {
      // if(pointerState.pointerDown && !pointerState.pointerUp) {
      const { stageX, stageY, nativeEvent } = ev;
      if(nativeEvent.touches && nativeEvent.touches.length === 2) {
        const distance = getDistanceBetween({
          x: nativeEvent.touches[0].clientX,
          y: nativeEvent.touches[0].clientY
        }, {
          x: nativeEvent.touches[1].clientX,
          y: nativeEvent.touches[1].clientY
        })

        if(Math.abs(distance - touchState.touchDownDistance) > 40) {
          touchState.zoomTouchDistance = distance;
        }
        else if(
          getDistanceBetween(
            touchState.touches[0], {
            x: nativeEvent.touches[0].clientX,
            y: nativeEvent.touches[0].clientY
          }) >= 5
        ) {
          const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
          pointerState.x = x;
          pointerState.y = y;
        }
      }
      else {
        const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
        pointerState.x = x;
        pointerState.y = y;
      }
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
