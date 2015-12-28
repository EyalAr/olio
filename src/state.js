import {
  isUndefined,
  isPlainObject,
  isString,
  forEach,
  cloneDeep
} from "lodash";

import {
  EventEmitter
} from "events";
import ObjectModifier from "./utils/objectModifier";
import { generateDiffFromChanges } from "./utils/diff";
import { patchEntry } from "./utils/patch";

const PATH_DELIMITER = ".";

class State extends EventEmitter {
  constructor(init) {
    super();
    if (!isPlainObject(init) && !isUndefined(init)) {
      throw Error("Initial state must be a plain object");
    }
    this.state = init || {};
    this.modifier = new ObjectModifier(this.state);
  }

  set(keypath, value) {
    if (isString(keypath)) {
      keypath = keypath.split(PATH_DELIMITER);
    }
    this.modifier.set(keypath, value);
    this.modifier.compact();
    this.modifier.forEachNewChange((path, newVal, oldVal) => {
      this.emit("change", path, newVal, oldVal);
    });
  }

  applyPatch(patch, strict = true) {
    const failedPatches = [];
    forEach(patch, entry => {
      try {
        patchEntry(this.state, this.modifier, strict, entry);
      } catch (e) {
        failedPatches.push(e);
      }
    });
    this.modifier.compact();
    this.modifier.forEachNewChange((path, newVal, oldVal) => {
      this.emit("change", path, newVal, oldVal);
    });
    if (strict && failedPatches.length) {
      const err = Error(failedPatches.length + " failed patch entries");
      err.failedPatches = failedPatches;
      throw err;
    }
  }

  getLatestPatch() {
    const p = generateDiffFromChanges(this.modifier);
    this.modifier.reset();
    return p;
  }

  toJSON() {
    return this.state;
  }

  static clone(other) {
    return new State(cloneDeep(other.state));
  }
}

export default State;
