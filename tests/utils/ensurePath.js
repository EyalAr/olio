/* eslint-env mocha */

import should from "should";
import ensurePath from "../../src/utils/ensurePath";

describe("ensure path in object", () => {
  describe("path already exists", () => {
    const obj = { a: { b: { c: [null, { d: null }] } } },
          original = { a: { b: { c: [null, { d: null }] } } },
          newPaths = ensurePath(obj, ["a", "b", "c", 1, "d"]);

    it("should not create new paths", () => newPaths.should.be.empty());
    it("should not modify the object", () => original.should.be.deepEqual(obj));
  });

  describe("path doesn't exist", () => {
    const obj = { foo: "bar" },
          expected = {
            a: { b: { c: [undefined, {}] } },
            foo: "bar"
          },
          newPaths = ensurePath(obj, ["a", "b", "c", 1, "d"]);

    it("should create 4 new paths", () => {
      newPaths.should.be.length(4);
    });

    it("should create correct path for the 1st level", () => {
      newPaths[0].path.should.be.deepEqual(["a"]);
    });
    it("should create correct value for the 1st level", () => {
      newPaths[0].newVal.should.be.deepEqual(expected.a);
    });
    it("should remember old value of the 1st level", () => {
      should(newPaths[0].oldVal).be.undefined();
    });

    it("should create correct path for the 2nd level", () => {
      newPaths[1].path.should.be.deepEqual(["a", "b"]);
    });
    it("should create correct value for the 2nd level", () => {
      newPaths[1].newVal.should.be.deepEqual(expected.a.b);
    });
    it("should remember old value of the 2nd level", () => {
      should(newPaths[1].oldVal).be.undefined();
    });

    it("should create correct path for the 3rd level", () => {
      newPaths[2].path.should.be.deepEqual(["a", "b", "c"]);
    });
    it("should create correct value for the 3rd level", () => {
      newPaths[2].newVal.should.be.deepEqual(expected.a.b.c);
    });
    it("should remember old value of the 3rd level", () => {
      should(newPaths[2].oldVal).be.undefined();
    });

    it("should create correct path for the 4th level", () => {
      newPaths[3].path.should.be.deepEqual(["a", "b", "c", 1]);
    });
    it("should create correct value for the 4th level", () => {
      newPaths[3].newVal.should.be.deepEqual(expected.a.b.c[1]);
    });
    it("should remember old value of the 4th level", () => {
      should(newPaths[3].oldVal).be.undefined();
    });

    it("should modify the object", () => {
      expected.should.be.deepEqual(obj);
    });
  });

  describe("path partially exists", () => {
    const obj = {
            a: { b: "foo" },
            foo: "bar"
          },
          expected = {
            a: { b: { c: [undefined, {}] } },
            foo: "bar"
          },
          newPaths = ensurePath(obj, ["a", "b", "c", 1, "d"]);

    it("should create 3 new paths", () => {
      newPaths.should.be.length(3);
    });

    it("should create correct path for the 2nd level", () => {
      newPaths[0].path.should.be.deepEqual(["a", "b"]);
    });
    it("should create correct value for the 2nd level", () => {
      newPaths[0].newVal.should.be.deepEqual(expected.a.b);
    });
    it("should remember old value of the 2nd level", () => {
      newPaths[0].oldVal.should.be.equal("foo");
    });

    it("should create correct path for the 3rd level", () => {
      newPaths[1].path.should.be.deepEqual(["a", "b", "c"]);
    });
    it("should create correct value for the 3rd level", () => {
      newPaths[1].newVal.should.be.deepEqual(expected.a.b.c);
    });
    it("should remember old value of the 3rd level", () => {
      should(newPaths[1].oldVal).be.undefined();
    });

    it("should create correct path for the 4th level", () => {
      newPaths[2].path.should.be.deepEqual(["a", "b", "c", 1]);
    });
    it("should create correct value for the 4th level", () => {
      newPaths[2].newVal.should.be.deepEqual(expected.a.b.c[1]);
    });
    it("should remember old value of the 4th level", () => {
      should(newPaths[2].oldVal).be.undefined();
    });

    it("should modify the object", () => {
      expected.should.be.deepEqual(obj);
    });
  });

  describe("path goes through arrays", () => {
    const obj = { foo: "bar" },
          expected = {
            "1.1": [undefined, undefined, [undefined, undefined, undefined, { "-8": [] }]],
            foo: "bar"
          },
          newPaths = ensurePath(obj, [1.1, 2, 3, -8, 0]);

    it("should create 4 new paths", () => {
      newPaths.should.be.length(4);
    });

    it("should create correct path for the 1st level", () => {
      newPaths[0].path.should.be.deepEqual([1.1]);
    });
    it("should create correct value for the 1st level", () => {
      newPaths[0].newVal.should.be.deepEqual(expected["1.1"]);
    });
    it("should remember old value of the 1st level", () => {
      should(newPaths[0].oldVal).be.undefined();
    });

    it("should create correct path for the 2nd level", () => {
      newPaths[1].path.should.be.deepEqual([1.1, 2]);
    });
    it("should create correct value for the 2nd level", () => {
      newPaths[1].newVal.should.be.deepEqual(expected["1.1"][2]);
    });
    it("should remember old value of the 2nd level", () => {
      should(newPaths[1].oldVal).be.undefined();
    });

    it("should create correct path for the 3rd level", () => {
      newPaths[2].path.should.be.deepEqual([1.1, 2, 3]);
    });
    it("should create correct value for the 3rd level", () => {
      newPaths[2].newVal.should.be.deepEqual(expected["1.1"][2][3]);
    });
    it("should remember old value of the 3rd level", () => {
      should(newPaths[2].oldVal).be.undefined();
    });

    it("should create correct path for the 4th level", () => {
      newPaths[3].path.should.be.deepEqual([1.1, 2, 3, -8]);
    });
    it("should create correct value for the 4th level", () => {
      newPaths[3].newVal.should.be.deepEqual(expected["1.1"][2][3]["-8"]);
    });
    it("should remember old value of the 4th level", () => {
      should(newPaths[3].oldVal).be.undefined();
    });

    it("should modify the object", () => {
      expected.should.be.deepEqual(obj);
    });
  });
});
