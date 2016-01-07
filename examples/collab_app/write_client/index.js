import State from "../../../src/state";
import Sync from "../../../src/sync";
import request from "superagent";
import {
  init as w_init,
  setText as w_setText,
  setLineText as w_setLineText,
  setWordText as w_setWordText,
  onTextChange as w_onTextChange,
} from "./write";
import pointer from "json-pointer";
import { map } from "lodash";

const SYNC_INTERVAL_MS = 500; // 0.5 sec

console.log("Connecting...");

request.get("/connect").end((err, res) => {

  console.log("Connected");

  const myId = res.body.clientId,
        state = new State(res.body.initialState),
        sync = new Sync(state);

  document.getElementById("client-id").innerHTML = "Connected as client " + myId;

  w_init(
    document.getElementById("write-container"),
    res.body.initialState.lines || [],
    myId
  );

  sync.addPeer("server");

  w_onTextChange(text => state.set("/lines", map(text.split("\n"), line => line.split(" "))));
  state.on("change", (path, val, old) => {
    path = pointer.parse(path);
    if (path[0] === "lines") {
      if (path.length === 1) {
        w_setText(map(val, line => line.join(" ")).join("\n"));
      } else if (path.length === 2) {
        w_setLineText(path[1], val.join(" "));
      } else if (path.length === 3) {
        w_setWordText(path[1], path[2], val);
      }
    }
  });

  let syncIn = SYNC_INTERVAL_MS;
  const syncTimerEl = document.getElementById("sync-timer"),
        t = setInterval(() => {
          syncIn -= 100;
          if (syncIn >= 0) {
            syncTimerEl.innerHTML = "Sync in " + syncIn + " ms";
          } else {
            syncTimerEl.innerHTML = "Syncing...";
          }
        }, 100);

  syncCycle();

  function syncCycle() {
    request.post("/sync").send({
      clientId: myId,
      patch: sync.patchPeer("server")
    }).end((err, res) => {
      if (err) {
        syncTimerEl.innerHTML = "Sync error.";
        clearTimeout(t);
        return;
      }
      const answer = res.body;
      sync.receive("server", answer, true);
      setTimeout(syncCycle, SYNC_INTERVAL_MS);
      syncIn = SYNC_INTERVAL_MS
    });
  }
});
