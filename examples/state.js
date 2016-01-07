import State from "../src/state";
import diff from "../src/utils/diff";
import { eq } from "lodash";
import assert from "assert";

const s1 = new State(),
      s2 = new State();

s1.on("change", (path, newVal, oldVal) => {
  console.log("S1", path, oldVal, "-->", newVal);
});

s2.on("change", (path, newVal, oldVal) => {
  console.log("S2", path, oldVal, "-->", newVal);
});

s1.set("/a/b", "hi");
s1.set("/a/c", "hello");
s1.set("/a/d/0", "a");
s1.set("/a/d/1", "aa");
s1.set("/a/d/2", "aaa");

s2.set("/k", "boo");

console.log();

const p1 = diff(s2, s1),
      p2 = diff(s1, s2);

const s1Old = State.clone(s1),
      s2Old = State.clone(s2);

s2.applyPatch(p1);
s1.applyPatch(p2);

assert(eq(s1.toJSON(), s2Old.toJSON()));
assert(eq(s2.toJSON(), s1Old.toJSON()));
