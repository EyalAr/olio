import { diff } from "./src/utils/diff";
import { patch } from "./src/utils/patch";

const o1 = {
        a: "hello",
        b: {
            c: {
                d: "hello"
            }
        },
        c: [1, 2, 3, {}]
      },
      o2 = {
        a: [1, 2, 3],
        b: [0, 0, 0],
        c: [0, 1, 2, 3, {}]
      },
      d = diff(o1, o2);

console.log(d);

var p = patch(o1, d, true);

console.log(diff(o1,o2));

p.forEachChange((path, newVal, oldVal) => {
  console.log(path, oldVal, "-->", newVal);
});
