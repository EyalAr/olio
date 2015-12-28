import { forEach } from "lodash";
import State from "./state";
import { diff } from "./utils/diff";

class Sync {
  constructor(init) {
    this.myState = init;
    this.peers = {};
    this.myState.on("change", () => forEach(this.peers, peer => {
      peer.isUpToDate = false;
    }));
  }

  addPeer(id) {
    this.peers[id] = {
      state: State.clone(this.myState),
      expectingAnswer: false,
      isUpToDate: false
    };
  }

  patchPeer(id) {
    const peer = this.peers[id];
    if (peer.expectingAnswer) {
      throw Error("Already expecting answer from peer");
    }
    peer.expectingAnswer = true;
    // should we bother calculating a diff?
    if (!peer.isUpToDate) {
      const p = diff(peer.state.state, this.myState.state);
      peer.state.applyPatch(p);
      peer.isUpToDate = true;
      return p;
    }
    return [];
  }

  receive(id, p, preferRemote = true) {
    const peer = this.peers[id];
    if (p.length) {
      try {
        peer.state.applyPatch(p, !preferRemote);
      } catch (e) { if (preferRemote) { throw e; } }
      try {
        this.myState.applyPatch(p, !preferRemote);
      } catch (e) {
        if (preferRemote) { throw e; }
      } finally {
        forEach(this.peers, peer => {
          peer.isUpToDate = false;
        });
      }
    }
    // were we expecting an answer from this peer?
    if (peer.expectingAnswer) {
      // this function received the answer.
      // no need to send anything back.
      peer.expectingAnswer = false;
      return [];
    }
    // this function was called to initiate a sync cycle.
    // we need to send an answer back.
    // but let's see if we should bother calculating a diff:
    if (!peer.isUpToDate) {
      const answer = diff(peer.state.state, this.myState.state);
      peer.state.applyPatch(answer, true);
      peer.isUpToDate = true;
      return answer;
    }
    return [];
  }
}

export default Sync;
