import State from "./src/state";

var s1 = new State(),
    s2 = new State();

s1.on("change", (path, newVal, oldVal) => {
  console.log("S1", path, oldVal, "-->", newVal);
});

s2.on("change", (path, newVal, oldVal) => {
  console.log("S2", path, oldVal, "-->", newVal);
});

s1.set("a.b", "hi");
s1.set("a.c", "hello");
s1.set("a.d.0", "a");
s1.set("a.d.1", "aa");
s1.set("a.d.2", "aaa");

s2.set("k", "boo");

console.log();

var p1 = s1.getLatestPatch(),
    p2 = s2.getLatestPatch();

s2.applyPatch(p1);
s1.applyPatch(p2);
