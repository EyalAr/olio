import State from "../../../src/state";
import Sync from "../../../src/sync";
import request from "superagent";
import {
  init as d_init,
  addDrawing as d_addDrawing,
  moveDrawing as d_moveDrawing,
  removeDrawing as d_removeDrawing,
  onDrawingAdd as d_onDrawingAdd,
  onDrawingMove as d_onDrawingMove,
  onDrawingRemove as d_onDrawingRemove,
  toggleDraw as d_toggleDraw,
  toggleMove as d_toggleMove
} from "./drawing";

const SYNC_INTERVAL_MS = 100; // 1 sec

console.log("Connecting...");

request.get("/connect").end((err, res) => {

  console.log("Connected");

  const myId = res.body.clientId,
        state = new State(res.body.initialState),
        sync = new Sync(state);

  document.getElementById("client-id").innerHTML = "Connected as client " + myId;

  d_init(
    document.getElementById("drawing-canvas"),
    res.body.initialState.shapes,
    myId
  );

  document.getElementById("toggle-draw").onclick = d_toggleDraw;
  document.getElementById("toggle-move").onclick = d_toggleMove;

  sync.addPeer("server");

  d_onDrawingAdd((id, shapeObj) => state.set(["shapes", id], shapeObj));
  d_onDrawingRemove((id, shapeObj) => state.set(["shapes", id], undefined));
  d_onDrawingMove((id, left, top) => {
    state.set(["shapes", id, "pos"], {top, left});
  });
  state.on("change", (path, val, old) => {
    if (path[0] === "shapes") {
      if (path.length === 2) {
        if (!old) {
          d_addDrawing(val, path[1]);
        } else if (!val) {
          d_removeDrawing(path[1]);
        }
      } else if (path[2] === "pos") {
        d_moveDrawing(path[1], val.left, val.top);
      }
    }
  });

  syncCycle();

  function syncCycle() {
    request.post("/sync").send({
      clientId: myId,
      patch: sync.patchPeer("server")
    }).end((err, res) => {
      const answer = res.body;
      sync.receive("server", answer, true);
      setTimeout(syncCycle, SYNC_INTERVAL_MS);
    });
  }
});
