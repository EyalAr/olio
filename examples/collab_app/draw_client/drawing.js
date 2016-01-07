import { fabric } from "fabric";
import {
  forEach,
  uniqueId,
  keys
} from "lodash";

const shapes = {},
      addCbs = [],
      moveCbs = [],
      removeCbs = [];

let canvas;

export function init(el, initShapes, myid) {
  canvas = new fabric.Canvas(el, {
    isDrawingMode: true,
    renderOnAddRemove: true
  });
  forEach(initShapes, (shape, id) => addDrawing(shape, id, false));
  canvas.on("object:added", e => {
    const shape = e.target;
    if (shape.get("sid")) { return; }
    const sid = uniqueId(myid + "_s_"); // shape id
    shape.set("sid", sid);
    shapes[sid] = shape;
    forEach(addCbs, cb => cb(sid, shape.toJSON()));
  });
  canvas.on("object:removed", e => {
    const shape = e.target,
          sid = shape.get("sid");
    delete shapes[sid];
    forEach(removeCbs, cb => cb(sid));
  });
};

export function clearDrawings() {
  forEach(keys(shapes), removeDrawing);
}

export function addDrawing(shape, id, fireCbs = true) {
  if (shapes[id]) { return; }
  shapes[id] = new fabric.Path(shape.path, shape);
  shapes[id].set("sid", id);
  shapes[id].setControlsVisibility({
    'tl': false, 'tr': false, 'br': false, 'bl': false, 'ml': false,
    'mt': false, 'mr': false, 'mb': false, 'mtr': false
  });
  shapes[id].on("modified", function() {
    const shape = this;
    forEach(moveCbs, cb => cb(id, shape.left, shape.top));
  });
  canvas.add(shapes[id]);
  if (fireCbs) {
    forEach(addCbs, cb => cb(id, shapes[id].toJSON()));
  }
}

export function removeDrawing(id, fireCbs = true) {
  if (!shapes[id]) { return; }
  canvas.remove(shapes[id]);
  delete shapes[id];
  if (fireCbs) {
    forEach(removeCbs, cb => cb(id, shapes[id].toJSON()));
  }
}

export function moveDrawing(id, x, y) {
  shapes[id].setLeft("left", x);
  shapes[id].setTop("top", y);
  canvas.renderAll();
}

export function toggleDraw() {
  canvas.isDrawingMode = true;
}

export function toggleMove() {
  canvas.isDrawingMode = false;
}

export function onDrawingAdd(cb) {
  addCbs.push(cb);
}

export function onDrawingMove(cb) {
  moveCbs.push(cb);
}

export function onDrawingRemove(cb) {
  removeCbs.push(cb);
}
