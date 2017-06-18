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
