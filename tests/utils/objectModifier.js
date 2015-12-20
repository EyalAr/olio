/* eslint-env mocha */

import should from "should";
import ObjectModifier from "../../src/utils/objectModifier";

describe("Modify object", () => {
  describe("set a primitive value in a one level path", () => {
    describe("for a non existing path", () => {
      const obj = {},
            modifier = new ObjectModifier(obj),
            changes = [];

      modifier.set(["a"], "hello");
      modifier.forEachChange((path, newVal, oldVal) => {
        changes.push({ path, oldVal, newVal });
      });

      it("should modify the object", () => obj.should.be.deepEqual({ a: "hello" }));
      it("should report 1 change", () => changes.should.be.length(1));
      it("should report the change in the correct path", () => {
        changes[0].path.should.be.deepEqual(["a"]);
      });
      it("should report the correct new value", () => {
        changes[0].newVal.should.be.equal("hello");
      });
      it("should report the correct old value", () => {
        should(changes[0].oldVal).be.undefined();
      });
    });

    describe("for an existing path", () => {
      const obj = { a: "foo" },
            modifier = new ObjectModifier(obj),
            changes = [];

      modifier.set(["a"], "hello");
      modifier.forEachChange((path, newVal, oldVal) => {
        changes.push({ path, oldVal, newVal });
      });

      it("should modify the object", () => obj.should.be.deepEqual({ a: "hello" }));
      it("should report 1 change", () => changes.should.be.length(1));
      it("should report the change in the correct path", () => {
        changes[0].path.should.be.deepEqual(["a"]);
      });
      it("should report the correct new value", () => {
        changes[0].newVal.should.be.equal("hello");
      });
      it("should report the correct old value", () => {
        changes[0].oldVal.should.be.equal("foo");
      });
    });
  });

  describe("set a primitive value in a deep path", () => {
    describe("for a non existing path", () => {
      const obj = { foo: "bar" },
            expected = {
              foo: "bar",
              a: { b: [,,, "hello"] }
            },
            modifier = new ObjectModifier(obj),
            changes = [];

      modifier.set(["a", "b", 3], "hello");
      modifier.forEachChange((path, newVal, oldVal) => {
        changes.push({ path, oldVal, newVal });
      });

      it("should modify the object", () => obj.should.be.deepEqual(expected));
      it("should report 3 changes", () => changes.should.be.length(3));
      it("should report changes in the correct paths", () => {
        changes[0].path.should.be.deepEqual(["a"]);
        changes[1].path.should.be.deepEqual(["a", "b"]);
        changes[2].path.should.be.deepEqual(["a", "b", 3]);
      });
      it("should report the correct new values", () => {
        changes[0].newVal.should.be.deepEqual({ b: [,,, "hello"] });
        changes[1].newVal.should.be.deepEqual([,,, "hello"]);
        changes[2].newVal.should.be.equal("hello");
      });
      it("should report the correct old values", () => {
        should(changes[0].oldVal).be.undefined();
        should(changes[1].oldVal).be.undefined();
        should(changes[2].oldVal).be.undefined();
      });
    });

    describe("for an existing path", () => {
      const obj = {
              foo: "bar",
              a: { b: [,,, { c: "foo" }] }
            },
            expected = {
              foo: "bar",
              a: { b: [,,, { d: "hello" }] }
            },
            modifier = new ObjectModifier(obj),
            changes = [];

      modifier.set(["a", "b", 3], { d: "hello" });
      modifier.forEachChange((path, newVal, oldVal) => {
        changes.push({ path, oldVal, newVal });
      });

      it("should modify the object", () => obj.should.be.deepEqual(expected));
      it("should report 4 changes", () => changes.should.be.length(4));
      it("should report changes in the correct paths", () => {
        changes[0].path.should.be.deepEqual(["a"]);
        changes[1].path.should.be.deepEqual(["a", "b"]);
        changes[2].path.should.be.deepEqual(["a", "b", 3]);
      });
      it("should report the correct new values", () => {
        changes[0].newVal.should.be.deepEqual({ b: [,,, "hello"] });
        changes[1].newVal.should.be.deepEqual([,,, "hello"]);
        changes[2].newVal.should.be.equal("hello");
      });
      it("should report the correct old values", () => {
        should(changes[0].oldVal).be.undefined();
        should(changes[1].oldVal).be.undefined();
        should(changes[2].oldVal).be.undefined();
      });
    });
  });
});
