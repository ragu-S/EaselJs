'use strict';
import { action, autorun } from 'mobx';
import { getDistanceBetween } from '../util/geometry-utils';
import * as Hammer from 'hammerjs';

// Singleton factory
export default function(app) {
  const {CREATEJS, stage, canvasLayer, state, interactionManager, renderer, canvas} = app;
  const MOUSE_EVENTS = [
    'pointerleave',
    'pointerenter',
    'pointermove',
    'pointerdown',
    'pointerup'
  ];

  const { Graphics, EventDispatcher, Event } = CREATEJS;
  const { pointerState, touchState, zoomState, POINTER_TYPE: { POINTER, FINGER } } = state;
  class UserEventListeners {
    disabledMouseEvents = [];
    path = [];
    oneFingerDown = false;
    touchDistancesEvents = 0;
    touchDistanceAvg = 0;

    constructor(props) {
      var hammerjs = new Hammer.Manager(canvas);
      hammerjs.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
      hammerjs.add(new Hammer.Tap({ event: 'singletap', taps: 1 }));
      hammerjs.add(new Hammer.Pinch({ threshold: 0.2 }));

      hammerjs.on('pinchin', this.onPinchInOut);
      hammerjs.on('pinchout', this.onPinchInOut);

      stage.addEventListener('stagemousedown', this.onPointerDown);
      stage.addEventListener('stagemouseup', this.onPointerUp);
      stage.addEventListener('stagemousemove', this.onPointerMove);

      this.hammerjs = hammerjs;
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
      ev.preventDefault();
      const { stageX, stageY, nativeEvent } = ev;
      if(nativeEvent.touches !== undefined) {
        const touches = nativeEvent.touches;
        let touchType = (touches[0].radiusX <= 0.2 || touches[0].radiusY <= 0.2) ? POINTER : FINGER;
        pointerState.touchType = touchType;

        if(touches.length > 1) {
          touchState.touches.replace(
            [...touches].map(touch => {
              return {
                x: touch.clientX,
                y: touch.clientY
              }
            })
          )

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
      }
      else {
        console.log('mouse event');
      }
    }

    @action
    onPinchInOut = ev => {
      if(zoomState._scale === null) {
        zoomState._scale = ev.scale;
        return;
      }

      const zoomDiff = ev.scale - zoomState._scale;
      const updatedZoom = (zoomDiff * zoomState.zoom) + zoomState.zoom;

      if(zoomState.MIN_ZOOM < updatedZoom && updatedZoom < zoomState.MAX_ZOOM) {
        zoomState.zoom = updatedZoom;
        zoomState.x = ev.center.x;
        zoomState.y = ev.center.y;
        zoomState.zoomTouchDistance = ev.distance;
        zoomState._scale = ev.scale;
      }
      // // pinch in
      // if(ev.type === 'pinchin') {
      // }
      // // pinch out
      // else {
      // }
    }

    @action
    onPointerUp = (ev) => {
      ev.preventDefault();
      const { nativeEvent } = ev;
      if(nativeEvent.touches !== undefined) {
        pointerState.pointerMove = false;
        pointerState.pointerDown = false;
        pointerState.pointerUp = true;
        zoomState._scale = null;

        if(nativeEvent.touches > 1) {
          touchState.touches.clear();
          touchState.touchDownDistance = 0;
          touchState.zoomTouchDistance = 0;
          this.oneFingerDown = false;
        }
      }

      this.touchDistancesEvents = 0;
      this.touchDistanceAvg = 0;
      this.oneFingerDown = false;
    }

    @action
    onPointerMove = (ev) => {
      ev.preventDefault();
      const { stageX, stageY, nativeEvent } = ev;
      if(nativeEvent.touches === undefined) return;
      if(pointerState.pointerMove === false) pointerState.pointerMove = true;
      const touches = nativeEvent.touches;
      if(nativeEvent.touches.length === 2) {
        touchState.touches.replace(
          [...touches].map(touch => {
            return {
              x: touch.clientX,
              y: touch.clientY
            }
          })
        )
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

  return new UserEventListeners();
}

function getClosestPoint(point, points) {
  return points.map(p => {
    return Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2);
  })
  .sort(-1)
  .pop();
}
