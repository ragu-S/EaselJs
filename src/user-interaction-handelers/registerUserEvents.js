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
    touchDistancesEvents = 0;
    touchDistanceAvg = 0;
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
      // ev.preventDefault();
      // ev.stopPropagation();
      const { stageX, stageY, nativeEvent } = ev;
      if(nativeEvent.touches !== undefined) {
        const touches = nativeEvent.touches;
        let touchType = (touches[0].radiusX <= 0.2 || touches[0].radiusY <= 0.2) ? POINTER : FINGER;
        console.log('touch length', nativeEvent.touches)
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

          console.log('touch down distance', touchState.touchDownDistance);

          this.touchDistancesEvents = 0;
          this.touchDistanceAvg = 0;
          this.oneFingerDown = false;
        }
        else {
          if(touchType === FINGER) {
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
      // ev.preventDefault();
      // ev.stopPropagation();
      const { nativeEvent } = ev;
      if(nativeEvent.touches !== undefined) {
        pointerState.pointerMove = false;
        pointerState.pointerDown = false;
        pointerState.pointerUp = true;

        if(touchState.touches.length > 1) {
          touchState.touches.clear();
          touchState.touchDownDistance = 0;
          touchState.zoomTouchDistance = 0;
          this.oneFingerDown = false;
        }
        else if(this.oneFingerDown === true) {
          const clickEvent = new Event('onefingerclick');
          clickEvent.nativeEvent = ev;
          clickEvent.stageX = ev.stageX;
          clickEvent.stageY = ev.stageY;
          this.dispatchEvent(clickEvent);
        }
      }

      this.touchDistancesEvents = 0;
      this.touchDistanceAvg = 0;

      this.oneFingerDown = false;
    }

    @action
    onPointerMove = (ev) => {
      // ev.preventDefault();
      // ev.stopPropagation();

      const { stageX, stageY, nativeEvent } = ev;
      if(!nativeEvent.touches) return;
      if(!pointerState.pointerMove) pointerState.pointerMove = true;
      if(nativeEvent.touches.length === 2) {
        const touches = nativeEvent.touches;
        const distance = getDistanceBetween({
          x: touches[0].clientX,
          y: touches[0].clientY
        }, {
          x: touches[1].clientX,
          y: touches[1].clientY
        })

        console.log('distance', distance);

        touchState.touches.replace(
          [...touches].map(touch => {
            return {
              x: touch.clientX,
              y: touch.clientY
            }
          })
        )

        this.touchDistancesEvents++;
        const newAvg = (this.touchDistanceAvg + distance)/this.touchDistancesEvents;
        const dt = distance/newAvg;

        if(this.touchDistancesEvents > 8) {
          if(dt > 1.15 || dt < 0.95) {
            touchState.zoomTouchDistance = distance;
          }
        }
        this.touchDistanceAvg += newAvg;
      }
      else {
        const { x, y } = canvasLayer.globalToLocal(stageX, stageY);
        pointerState.x = x;
        pointerState.y = y;
        touchState.touches.replace([{
          x: nativeEvent.touches[0].clientX,
          y: nativeEvent.touches[0].clientY
        }])
      }
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
