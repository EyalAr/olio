import {
  isUndefined,
  isPlainObject,
  isString,
  isArray
} from "lodash";
import {
  EventEmitter
} from "events";
import Im from "immutable";
import Cursor from "immutable/contrib/cursor";
import pointer from "json-pointer";

const MAX_HISTORY = 1000;

class State extends EventEmitter {
  constructor(init) {
    super();
    if (Im.Iterable.isKeyed(init)) {
      this.state = init;
    } else if (isPlainObject(init)) {
      this.state = Im.fromJS(init);
    } else if (isUndefined(init)) {
      this.state = new Im.Map();
    } else {
      throw Error("Initial state must be a plain object or an Immutable keyed object");
    }
    this.history = [this.state];
    this.cur = Cursor.from(this.state, this._cursorUpdateCb.bind(this));
  }

  _cursorUpdateCb(state, prev, path) {
    if (state === prev) { return; }
    let valBefore = prev.getIn(path),
        valAfter = state.getIn(path);
    // we want to make sure that internally the state contains only immutable
    // structures.
    if (!Im.Iterable.isIterable(valAfter)) {
      if (isPlainObject(valAfter) || isArray(valAfter)) {
        this.set(path, Im.fromJS(valAfter));
        return;
      }
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

  get(path) {
    if (isString(path)) {
      path = pointer.parse(path);
    }
    const res = this.cur.getIn(path);
    if (Im.Iterable.isIterable(res)) {
      return res.toJS();
    }
    return res;
  }

  set(path, value) {
    if (isString(path)) {
      path = pointer.parse(path);
    }
    return this.cur.setIn(path, value);
  }

  remove(path) {
    if (isString(path)) {
      path = pointer.parse(path);
    }
    return this.cur.removeIn(path);
  }

  update(path, updater) {
    if (isString(path)) {
      path = pointer.parse(path);
    }
    return this.set(path, updater(this.get(path)));
  }

  clear() {
    return this.cur.clear();
  }

  toJSON() {
    return this.state.toJS();
  }

  toString() {
    return this.state.toString();
  }

  static clone(other) {
    return new State(other.state);
  }
}

export default State;
