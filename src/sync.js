import { forEach } from "lodash";
import State from "./state";
import { diff } from "./utils/diff";

class Sync {
  constructor(init) {
    this.myState = init;
    this.peers = {};
    this.myState.on("change", (path, newVal) => {
      forEach(this.peers, (peer, id) => {
        peer.local.set(path, newVal);
      });
    });
  }

  addPeer(id) {
    this.peers[id] = {
      local: State.clone(this.myState),
      remote: State.clone(this.myState),
      pendingAnswer: false
    };
  }

  patchPeer(id) {
    const peer = this.peers[id];
    if (peer.pendingAnswer) {
      throw Error("Pending answer from peer");
    }
    const p = peer.local.getLatestPatch();
    peer.remote.applyPatch(p);
    peer.pendingAnswer = true;
    return p;
  }

  receive(id, p, preferRemote = true) {
    const peer = this.peers[id],
          a = peer.local.getLatestPatch();
    try {
      peer.local.applyPatch(p, !preferRemote);
    } catch (e) { if (preferRemote) { throw e; } }
    try {
      peer.remote.applyPatch(p, !preferRemote);
    } catch (e) { if (preferRemote) { throw e; } }
    try {
      this.myState.applyPatch(p, !preferRemote);
    } catch (e) { if (preferRemote) { throw e; } }
    // were we waiting for an answer from this peer?
    if (peer.pendingAnswer) {
      // no need to send anything back
      peer.pendingAnswer = false;
      return;
    }
    return a;
  }
}

export default Sync;
