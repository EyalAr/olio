import patch from "../src/utils/patch";
import Im from "immutable";
import fjp from "fast-json-patch";
import { eq } from "lodash";
import assert from "assert";

const o1 = {
        a: "a",
        b: [1, 2, 3, 4, 5, 6]
      },
      o2 = {
        a: "b",
        b: [1, 3, 3, 4, 5, 6, 7],
        c: [{ a: "a" }, { b: "b" }]
      };

const diff = fjp.compare(o1, o2),
      oIm = Im.fromJS(o1),
      oImPatched = patch(oIm, diff);

console.log(diff);
console.log(oIm);
console.log(oImPatched);

assert(eq(o2, oImPatched.toJS()));
