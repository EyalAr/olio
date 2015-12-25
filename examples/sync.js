import State from "./src/state";
import Sync from "./src/sync";

var c1s = new State(),
    c1sync = new Sync(c1s);
c1sync.addPeer("server");

var c2s = new State(),
    c2sync = new Sync(c2s);
c2sync.addPeer("server");

var ss = new State(),
    ssync = new Sync(ss);
ssync.addPeer("client1");
ssync.addPeer("client2");

c1s.set("a", "hello");
c1s.set("b", [1, 2]);
c2s.set("a", "world");
c2s.set("c", "foo");

var c1p = c1sync.patchPeer("server");
var sa = ssync.receive("client1", c1p, false);
c1sync.receive("server", sa, true);

var c2p = c2sync.patchPeer("server");
sa = ssync.receive("client2", c2p, false);
c2sync.receive("server", sa, true);

c1p = c1sync.patchPeer("server");
sa = ssync.receive("client1", c1p, false);
c1sync.receive("server", sa, true);

console.log(c1s.state);
console.log(c2s.state);
