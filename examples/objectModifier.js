import ObjectModifier from "./src/utils/objectModifier";

const obj = {},
      m = new ObjectModifier(obj);

console.log("Before:", JSON.stringify(obj, 0, 2));

m.set(["a", "b", 0, "c"], "hello");
m.set(["a", "b", 0, "c"], { d: "hello" });
m.set(["a", "b", 0, "c", "d"], [1, 2, 3]);
m.set(["a", "b", 0, "c", "d", 2], { e: "hi" });
m.set(["a", "b", 0, "c"], "hello");
m.set(["a"], "hello");
m.push(["b"], "foo", "bar");
m.push(["b"], "boo");
m.remove(["a"]);

console.log("After:", JSON.stringify(obj, 0, 2));

console.log();
console.log("Changes Summary:");
console.log("----------------");
m.forEachChange((path, newVal, oldVal) => {
  console.log(path.join('.'), "\t", oldVal, "-->", newVal);
});

m.compact();

console.log();
console.log("Compacted Changes Summary:");
console.log("--------------------------");
m.forEachChange((path, newVal, oldVal) => {
  console.log(path.join('.'), "\t", oldVal, "-->", newVal);
});
