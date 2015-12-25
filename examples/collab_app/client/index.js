import State from "../../../src/state";
import Sync from "../../../src/sync";
import request from "superagent";
import Ractive from "ractive";

const SYNC_INTERVAL_MS = 2000; // 2 sec

console.log("Connecting...");

request.get("/connect").end((err, res) => {
  console.log("Connected");

  const myId = res.body.clientId,
        state = new State(JSON.parse(res.body.initialState)),
        sync = new Sync(state);

  const ractive = new Ractive({
    el: document.getElementById("container"),
    template: "<textarea value='{{content}}'></textarea>",
    data: JSON.parse(res.body.initialState)
  });

  sync.addPeer("server");
  state.on("change", (path, val) => ractive.set(path.join("."), val));
  ractive.observe("content", (newVal, oldVal, keypath) => state.set(["content"], newVal));

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
