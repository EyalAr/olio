import {
  isUndefined,
  isPlainObject,
  isString,
  isArray,
  forEach,
  filter
} from "lodash";
import {
  EventEmitter
} from "events";
import patch from "./utils/patch";
import Im from "immutable";
import Cursor from "immutable/contrib/cursor";
import pointer from "json-pointer";

const MAX_HISTORY = 1000;

class State extends EventEmitter {
  constructor(init) {
    super();
    if (init instanceof Im.Collection.Keyed) {
      this.state = init;
    } else if (isPlainObject(init)) {
      this.state = Im.fromJS(init);
    } else if (isUndefined(init)) {
      this.state = new Im.Map();
    } else {
      throw Error("Initial state must be a plain object or an Immutable keyed object");
    }
    this.cur = Cursor.from(this.state, this._cursorUpdateCb.bind(this));
    this.history = [this.state];
  }

  _cursorUpdateCb(state, prev, path) {
    if (state === prev) { return; }
    let valBefore = prev.getIn(path),
        valAfter = state.getIn(path);
    // we want to make sure that internally the state contains only immutable
    // structures.
    if (isPlainObject(valAfter) || isArray(valAfter)) {
      this.set(path, Im.fromJS(valAfter));
      return;
    }
    // the values we report on change should be regular JS
    if (Im.Iterable.isIterable(valAfter)) {
      valAfter = valAfter.toJS();
    }
    if (Im.Iterable.isIterable(valBefore)) {
      valBefore = valBefore.toJS();
    }
    this.state = state;
    if (this.history.length === MAX_HISTORY) {
      this.history.shift();
    }
    this.history.push(this.state);
    this.cur = Cursor.from(this.state, this._cursorUpdateCb.bind(this));
    this.emit("change", pointer.compile(path), valAfter, valBefore);
  }

  applyPatch(p, strict = true) {
    patch(this.cur, filter(p, ({ op }) => strict || op !== "test"));
  }

  clear() {
    this.cur.clear();
  }

  toJSON() {
    return this.state.toJS();
  }

  static clone(other) {
    return new State(other.state);
  }
}

// borrow methods from Immutable Cursor:
forEach([
  "getIn", "setIn", "deleteIn", "removeIn", "updateIn", "mergeIn", "mergeDeepIn"
], methodName => {
  State.prototype[methodName] = function (path, ...args) {
    if (isString(path)) {
      path = pointer.parse(path);
    }
    return this.cur[methodName].apply(this.cur, [path].concat(args));
  };
});

// aliases
forEach([
  "get", "set", "delete", "remove", "update", "merge", "mergeDeep"
], methodName => {
  State.prototype[methodName] = State.prototype[methodName + "In"];
});

export default State;
