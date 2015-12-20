import {
  isObject,
  forEach,
  keys,
  isUndefined,
  isArray,
  last
} from "lodash";

import ensurePath from "./ensurePath";

/**
 * A wrapper around a plain object.
 * Can be used to set/remove values from the object in a nested
 * manner.
 * Will track all modifications done to the wrapped object.
 */
class ObjectModifier {

  /**
   * Constructor.
   * @param  {Object} obj The object to modify
   */
  constructor(obj) {
    this.obj = obj;
    this.changes = [];
  }

  set(keypath, newVal) {
    // if array or plain object, walk down the object tree and recurse
    // calls to 'set' with the respective keypath.
    // this way we only have to deal with setting primitive values.
    if (isObject(newVal)) {
      // attempt to reset the keypath (delete whatever is there now):
      try{
        _setPrimitiveDeep(this.obj, keypath, undefined);
      } catch (e) { /* there was nothing there */ }
      // deep traversal of the object/array. will walk the object tree
      // and set the value at each level.
      // will loop over an array's indices, or a plain object's keys:
      forEach(keys(newVal), key => this.set(
        keypath.concat([key]),
        newVal[key]
      ));
    } else {
      this._setPrimitive(keypath, newVal);
    }
  }

  forEachChange(cb) {
    forEach(this.changes, change => {
      cb(change.keypath, change.newVal, change.oldVal);
    });
  }

  _setPrimitive(keypath, newVal) {
    const newPaths = ensurePath(this.obj, keypath),
          oldVal = _setPrimitiveDeep(this.obj, keypath, newVal);
    forEach(newPaths, p => {
      this.changes.push({
        oldVal: p.oldVal,
        newVal: p.newVal,
        keypath: p.path
      });
    });
    this.changes.push({ oldVal, newVal, keypath });
  }

}

/**
 * Sets a primitive value under the specified keypath in the object.
 * If value is undefined, whatever is under this keypath will attempt to be
 * removed. If it's the last element of an array, it will be popped. If it's
 * an element in the middle of an array, it will be deleted (its index will not
 * exist, and the array will become sparse). If it's an object property, it will
 * be deleted.
 * @param {Object} obj The object to modify
 * @param {Array} keypath The keypath of the value
 * @param {Primitive} newVal The value to set
 * @return {*} The old value under this path (or undefined if it didn't exist)
 * @private
 */
function _setPrimitiveDeep(obj, keypath, newVal) {
  const child = obj[keypath[0]];
  if (keypath.length === 1) {
    obj[keypath[0]] = newVal;
    // do some cleanup in obj if possible:
    if (isUndefined(newVal)) {
      if (isArray(obj) && last(obj) === obj[keypath[0]]) {
        // if it's the last element of an array, pop it
        // (delete doesn't modify the length of the array).
        obj.pop();
      } else {
        delete obj[keypath[0]];
      }
    }
    return child;
  }
  // walk down the object
  return _setPrimitiveDeep(child, keypath.slice(1), newVal);
}

export default ObjectModifier;
