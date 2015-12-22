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

  /**
   * Set a value for the specified key path in the object.
   * Overriding an existing value will be considered as two actions:
   * 1. setting the old value to undefined.
   * 2. setting the new value.
   * Overriding an object value will set each of the primitive values in the
   * object tree to undefined (with respective change entries).
   * @param {Array} keypath The key path in the object tree.
   * @param {*} newVal The value to set.
   */
  set(keypath, newVal) {
    // attempt to reset the keypath (remove whatever is there now):
    try {
      // _setPrimitiveDeep will throw if the path doesn't exist
      const removedVal = ObjectModifier._setPrimitiveDeep(this.obj, keypath, undefined);
      // if the path does exist, and the value under it was not undefined,
      // report removals for all primitive values in the removed object tree.
      if (!isUndefined(removedVal)) {
        forEach(ObjectModifier._generateRemovalChanges(removedVal), c => {
          c.keypath = keypath.concat(c.keypath);
          this.changes.push(c);
        });
      }
    } catch (e) { /* there was nothing there */ }
    // if array or plain object, walk down the object tree and recurse
    // calls to 'set' with the respective keypath.
    // this way we only have to deal with setting primitive values.
    if (isObject(newVal)) {
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

  /**
   * Called with one change entry.
   * @callback ObjectModifier~changesCallback
   * @param {Array} keypath The keypath of the change.
   * @param {*} newVal The value after the change.
   * @param {*} oldVal The value before the change.
   */

  /**
   * Loop over the changes made to the object.
   * @param {ObjectModifier~changesCallback} cb Callback function to be called
   * with each change.
   */
  forEachChange(cb) {
    forEach(this.changes, change => {
      cb(change.keypath, change.newVal, change.oldVal);
    });
  }

  /**
   * Set a primitive value under the keypath.
   * @param {Array} keypath The key path in the object tree.
   * @param {*} newVal The value to set.
   * @see _setPrimitiveDeep
   * @private
   */
  _setPrimitive(keypath, newVal) {
    const newPaths = ensurePath(this.obj, keypath);
    // the following call will always return undefined (the old value), since
    // we either deleted this path in this.set(), or ensurePath created an
    // undefined value under this path.
    ObjectModifier._setPrimitiveDeep(this.obj, keypath, newVal);
    // report the creation of new paths:
    forEach(newPaths, p => {
      this.changes.push({
        oldVal: p.oldVal,
        newVal: p.newVal,
        keypath: p.path
      });
    });
    // as mentioned above, the old value will always be undefined
    this.changes.push({ oldVal: undefined, newVal, keypath });
  }

  /**
   * Generate change entries as if all the primitive values in the given
   * object were set to undefined (setting to undefined is equivalent to
   * removing).
   * @param  {*} val The value (primitive or object).
   * @return {Array} Array of change entries.
   * @private
   */
  static _generateRemovalChanges(val) {
    const res = [];
    if (isObject(val)) {
      forEach(keys(val), key => {
        forEach(ObjectModifier._generateRemovalChanges(val[key]), c => {
          c.keypath = [key].concat(c.keypath);
          res.push(c);
        });
      });
    }
    res.push({
      keypath: [],
      oldVal: val,
      newVal: undefined
    });
    return res;
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
  static _setPrimitiveDeep(obj, keypath, newVal) {
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
    return ObjectModifier._setPrimitiveDeep(child, keypath.slice(1), newVal);
  }

}

export default ObjectModifier;
