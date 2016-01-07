import State from "../../../src/state";
import Sync from "../../../src/sync";
import request from "superagent";
import {
  init as d_init,
  setText as w_setText,
  setLineText as w_setLineText,
  onTextChange as w_onTextChange,
} from "./write";
import pointer from "json-pointer";

const SYNC_INTERVAL_MS = 500; // 0.5 sec

console.log("Connecting...");

request.get("/connect").end((err, res) => {

  console.log("Connected");

  const myId = res.body.clientId,
        state = new State(res.body.initialState),
        sync = new Sync(state);

  document.getElementById("client-id").innerHTML = "Connected as client " + myId;

  d_init(
    document.getElementById("write-container"),
    res.body.initialState.lines || [],
    myId
  );

  sync.addPeer("server");

  w_onTextChange(text => state.set("/lines", text.split("\n")));
  state.on("change", (path, val, old) => {
    path = pointer.parse(path);
    if (path[0] === "lines") {
      if (path.length === 1) {
        w_setText(val.join("\n"));
      } else if (path.length === 2) {
        w_setLineText(path[1], val);
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
