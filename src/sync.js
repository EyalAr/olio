import { forEach, filter } from "lodash";
import State from "./state";
import diff from "./utils/diff";
import patch from "./utils/patch";

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
      const p = diff(peer.state, this.myState);
      applyPatch(peer.state, p);
      peer.isUpToDate = true;
      return p;
    }
    return [];
  }

  receive(id, p, preferRemote = true) {
    const peer = this.peers[id];
    if (p.length) {
      try {
        applyPatch(peer.state, p, !preferRemote);
      } catch (e) { if (preferRemote) { throw e; } }
      try {
        applyPatch(this.myState, p, !preferRemote);
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
      const answer = diff(peer.state, this.myState);
      applyPatch(peer.state, answer, true);
      peer.isUpToDate = true;
      return answer;
    }
    return [];
  }
}

function applyPatch(state, p, strict = true) {
  patch(state.cur, filter(p, ({ op }) => strict || op !== "test"));
}

export default Sync;
