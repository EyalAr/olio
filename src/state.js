import {
  isUndefined,
  isPlainObject,
  isString,
  forEach,
  isArray
} from "lodash";

import {
  EventEmitter2 as EventEmitter
} from "eventemitter2";
import ObjectModifier from "./utils/objectModifier";

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
    this.modifier.forEachNewChange((path, newVal, oldVal) => {
      this.emit("change", { path, newVal, oldVal });
    });
  }

  getPatch() {
    this.modifier.compact();
    const patch = [];
    this.modifier.forEachChange((path, newVal) => {
      patch.push([path, isPlainObject(newVal) ? {} : isArray(newVal) ? [] : newVal]);
    });
    // this.modifier.reset();
    return patch;
  }

  applyPatch(patch) {
    forEach(patch, item => this.set(...item));
  }
}

export default State;
