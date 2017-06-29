

export function contains(containerBounds, childBounds) {
  return containerBounds.x1 <= childBounds.x1 &&
    containerBounds.x2 >= childBounds.x2 &&
    containerBounds.y1 <= childBounds.y1 &&
    containerBounds.y2 >= childBounds.y2;
}

export function updateContainerBounds(containerBounds, newChildBounds) {
  const { x1, y1, x2, y2 } = newChildBounds;
  
  if(containerBounds.x1 > x1) {
    containerBounds.x1 = x1;
  }
  if(containerBounds.y1 > y1) {
    containerBounds.y1 = y1;
  }
  if(containerBounds.x2 < x2) {
    containerBounds.x2 = x2;
  }
  if(containerBounds.y2 < y2) {
    containerBounds.y2 = y2;
  }

  return containerBounds;
}

export function getPathBounds(path, strokeWidth = 0) {
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

export function getDistanceBetween(p1, p2, pythogrean = true) {
  return pythogrean
    ? Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    )
    :
    (p2.x - p1.x) + Math.pow(p2.y - p1.y);
}

// Default container is stage
const defaultContainer = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
export function centerCoords(child, container = defaultContainer) {

  let outerWidth = container.radius !== undefined ? container.radius * 2 : container.width;
  let outerHeight = container.radius !== undefined ? container.radius * 2 : container.height;

  if(child.radius !== undefined) {
    return {
      x: container.x + outerWidth/2,
      y: container.y + outerHeight/2
    }
  }

  let innerWidth = child.width;
  let innerHeight = child.height;

  return {
    x: container.x + Math.floor((outerWidth - innerWidth) / 2),
    y: container.y + Math.floor((outerHeight - innerHeight) / 2)
  }
}

// ignore border
// border = [0,0,0,0] top, left, right, bottom
export function ignoreBorderContainer(shape, border) {
  // shape.x - ,
}
