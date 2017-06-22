'use strict';
import { action, autorun } from 'mobx';
import { getDistanceBetween } from '../util/geometry-utils';

// Singleton factory
export default function(app) {
  const {CREATEJS, stage, canvasLayer, state, interactionManager, renderer} = app;
  const MOUSE_EVENTS = [
    'pointerleave',
    'pointerenter',
    'pointermove',
    'pointerdown',
    'pointerup'
  ];

  const { Graphics, EventDispatcher, Event } = CREATEJS;
  const { pointerState, touchState, POINTER_TYPE: { POINTER, FINGER } } = state;
  class UserEventListeners {
    disabledMouseEvents = [];
    path = [];
    oneFingerDown = false;
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
        let touchType = (touches[0].radiusX <= 0.2 || touches[0].radiusY <= 0.2) ? POINTER : FINGER;

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
          if(touchType === FINGER) {
            console.log('finger touch!');
            this.oneFingerDown = true;
          }
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


    onOneFingerTouch = (ev) => {
      const { stageX, stageY, nativeEvent } = ev;
    }

    @action
    onPointerUp = (ev) => {
      const { nativeEvent } = ev;
      if(nativeEvent.touches !== undefined) {
        pointerState.pointerDown = false;
        pointerState.pointerUp = true;

        if(touchState.touches.length > 1) {
          console.log('pointer Up, clearing touchlist');
          touchState.touches.clear();
          touchState.touchDownDistance = 0;
          touchState.zoomTouchDistance = 0;
        }
        else if(this.oneFingerDown === true) {
          console.log('finger touch up, CLICK!', ev);
          this.oneFingerClick = true;
          const clickEvent = new Event('onefingerclick');
          clickEvent.nativeEvent = ev;
          clickEvent.stageX = ev.stageX;
          clickEvent.stageY = ev.stageY;

          this.dispatchEvent(clickEvent);
        }
      }

      this.oneFingerDown = false;
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
        // let distanceBetween =  getDistanceBetween(
        //   , {
        //   x: nativeEvent.touches[1].clientX,
        //   y: nativeEvent.touches[1].clientY
        // });
        console.log('settings pan values', distance);
        if(Math.abs(distance - touchState.touchDownDistance) > 40) {
          touchState.zoomTouchDistance = distance;
        }
        else if(
        distance <= 90
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

  EventDispatcher.initialize(UserEventListeners.prototype);

  return new UserEventListeners();
}

function getClosestPoint(point, points) {
  return points.map(p => {
    return Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2);
  })
  .sort(-1)
  .pop();
}
