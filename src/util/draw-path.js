var Shape = null;
var CanvasLayer = null;

export default function initDrawPath(app) {
  Shape = app.CREATEJS.Shape;
  CanvasLayer = app.canvasLayer;
}

export function drawPath(paths, opts = {}) {
  opts = {
    strokeWidth: 1,
    strokeColor: '#ff0000',
    ...opts
  }

  const shape = new Shape();
  const graphics = shape.graphics
    .clear()
    .setStrokeStyle(opts.strokeWidth)
    .beginStroke(opts.strokeColor);

  paths.forEach(p => {
    graphics.moveTo(p[0],p[1]);
    for(let i = 2; i < p.length - 1; i +=2) {
      graphics.lineTo(p[i], p[i + 1]);
    }
  })

  graphics.endStroke();

  CanvasLayer.addChild(shape);

  return shape;
}

export function drawPoint(coords, opts = {}) {
  opts = {
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: '#000000',
    ...opts
  }

  const shape = new Shape();
  const graphics = shape.graphics
    .clear()
    .setStrokeStyle(opts.strokeWidth)
    .beginStroke(opts.strokeColor)
    .beginFill(opts.strokeColor);

  coords.forEach(([x,y]) => {
    graphics
      .moveTo(x,y)
      .drawCircle(x,y,0.5)
  })
    graphics
      .endStroke()
      .endFill()

  CanvasLayer.addChild(shape);

  return shape;
}
