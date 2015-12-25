import {
  isObject,
  forEach,
  keys,
  isUndefined,
  isArray,
  isEmpty,
  isString,
  last,
  first,
  filter,
  eq
} from "lodash";

import ensurePath from "./ensurePath";

/**
 * A wrapper around a plain object.
 *
 * Can be used to set/remove/push/pop values from the object in a nested
 * manner.
 *
 * Will track all modifications done to the wrapped object.
 */
class ObjectModifier {

  /**
   * Construct a new ObjectModifier.
   *
   * @param  {Object} obj The object to modify.
   */
  constructor(obj) {
    this.obj = obj;
    this.changes = [];
  }

  /**
   * Set a value for the specified key path in the object.
   *
   * Overriding an existing value will be considered as two actions:
   *
   * 1. setting the old value to undefined.
   * 2. setting the new value.
   *
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
    // we use 'isEmptry', because we treat empty objects and arrays as primitive
    // values.
    if (!isEmpty(newVal) && !isString(newVal)) {
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
   * Remove the keypath from the object. Equivalent to set(keypath, undefined).
   * @param {Array} keypath The key path in the object tree.
   */
  remove(keypath) {
    this.set(keypath, undefined);
  }

  /**
   * Push the provided value(s) to the specified keypath.
   *
   * If there's nothing at that path, a new array will be created.
   *
   * If there's a non-array in that path, an error will be thrown.
   * @param {Array} keypath The key path in the object tree.
   * @param {...*} values The values to set.
   */
  push(keypath, ...values) {
    if (!values.length) return;
    let target = this.obj;
    forEach(keypath, key => {
      target = target[key];
      return isObject(target);
    });
    if (isArray(target)) {
      this.set(keypath.concat([target.length]), values[0]);
    } else if (isUndefined(target)) {
      this.set(keypath.concat([0]), values[0]);
    } else {
      throw Error("Provided keypath does not point to an array. " + keypath);
    }
    this.push(keypath, ...values.slice(1));
  }

  /**
   * Pop a value from the array in the specified path.
   *
   * If there's a non-array in that path, an error will be thrown.
   *
   * @param {Array} keypath The key path in the object tree.
   */
  pop(keypath) {
    let target = this.obj;
    forEach(keypath, key => {
      target = target[key];
      if (!isObject(target)) {
        return false;
      }
    });
    if (isArray(target)) {
      let i = target.length - 1;
      if (i < 0) { i = 0; }
      this.set(keypath.concat([i]), undefined);
    } else {
      throw Error("Provided keypath does not point to an array. " + keypath);
    }
  }

  reset() {
    this.changes.splice(0, this.changes.length);
  }

  /**
   * Remove obselete changes from the history.
   *
   * Any change which indicates a value which no longer exists will be removed.
   */
  compact() {
    const changesTree = this._generateChangesTree();
    ObjectModifier._compactChangesTree(changesTree);
    this.changes = ObjectModifier._zipChangesTree(changesTree);
  }

  /**
   * Compress the history of changes into only the neccesary changes to
   * reconstruct the current state of the object. This looses history of
   * nested nodes.
   */
  compress() {
    const changesTree = this._generateChangesTree();
    ObjectModifier._compressChangesTree(changesTree);
    this.changes = ObjectModifier._zipChangesTree(changesTree);
  }

  /**
   * Called with one change entry.
   *
   * @callback ObjectModifier~changesCallback
   * @param {Array} keypath The keypath of the change.
   * @param {*} newVal The value after the change.
   * @param {*} oldVal The value before the change.
   * @param {Boolean} seen Was this change iterated before.
   */

  /**
   * Loop over the changes made to the object.
   *
   * @param {ObjectModifier~changesCallback} cb Callback function to be called
   * with each change.
   */
  forEachChange(cb) {
    forEach(this.changes, change => {
      const seen = !!change.seen;
      change.seen = true;
      cb(change.keypath, change.newVal, change.oldVal, seen);
    });
  }

  /**
   * Loop over the new changes made to the object since the last iteration.
   * @param {ObjectModifier~changesCallback} cb Callback function to be called
   * with each change.
   */
  forEachNewChange(cb) {
    const newChanges = filter(this.changes, c => !c.seen);
    forEach(newChanges, change => {
      change.seen = true;
      cb(change.keypath, change.newVal, change.oldVal, false);
    });
  }

  /**
   * Generate a tree from the list of changes.
   *
   * A path in the tree corresponds to a path in the modified object.
   *
   * Each node contains all the changes made to its path.
   * @return {Object} Tree of changes.
   * @private
   */
  _generateChangesTree() {
    const changesTree = { children: {}, changes: [] };
    this.forEachChange((path, newVal, oldVal, seen) => {
      let target = changesTree;
      // find the correct target node to place the change in:
      forEach(path, key => {
        if (isUndefined(target.children[key])) {
          target.children[key] = {
            changes: [],
            children: {}
          };
        }
        target = target.children[key];
      });
      target.changes.push({ newVal, oldVal, seen });
    });
    return changesTree;
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
   * Generate an array of changes from a changes tree.
   * @param  {Object} changesTree The tree which was generated
   * by {@link _generateChangesTree}.
   * @return {Array} List of changes.
   * @see  _generateChangesTree
   */
  static _zipChangesTree(changesTree) {
    const changes = [];
    forEach(changesTree.changes, c => {
      changes.push({
        keypath: [],
        oldVal: c.oldVal,
        newVal: c.newVal,
        seen: c.seen
      });
    });
    forEach(changesTree.children, (child, childKey) => {
      forEach(ObjectModifier._zipChangesTree(child), c => {
        changes.push({
          keypath: [childKey].concat(c.keypath),
          oldVal: c.oldVal,
          newVal: c.newVal,
          seen: c.seen
        });
      });
    });
    return changes;
  }

  /**
   * Walk through each of the nodes of the tree an compact its list of changes.
   *
   * Any two changes that cancel each other will be removed.
   *
   * Any two changes which share a middle value will be merged into one change.
   *
   * Any change with equal old and new values will be removed.
   * @return {Object} Tree of changes.
   */
  static _compactChangesTree(changesTree) {
    let i = changesTree.changes.length - 1,
        cPrev, cCur;
    while (i > 0) {
      cCur = changesTree.changes[i];
      cPrev = changesTree.changes[i - 1];
      if (eq(cCur.oldVal, cPrev.newVal)) {
        changesTree.changes.splice(i - 1, 2);
        if (!eq(cPrev.oldVal, cCur.newVal)) {
          changesTree.changes.push({
            oldVal: cPrev.oldVal,
            newVal: cCur.newVal,
            seen: cCur.seen
          });
        } else {
          i--;
        }
      }
      i--;
    }
    forEach(changesTree.children, ObjectModifier._compactChangesTree);
  }

  /**
   * Walk through each of the nodes of the tree an compress it to at most one
   * change. Essentially losing the history of the node's changes. If the node
   * has a change, remove the history of its children.
   * @return {Object} Tree of changes.
   */
  static _compressChangesTree(changesTree) {
    if (changesTree.changes.length) {
      const cLast = last(changesTree.changes),
            cFirst = first(changesTree.changes),
            newVal = cLast.newVal,
            oldVal = cFirst.oldVal;
      changesTree.changes = [{ oldVal, newVal }];
      changesTree.children = {};
    }
    forEach(changesTree.children, ObjectModifier._compressChangesTree);
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
    if (!isUndefined(val)) {
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
    }
    return res;
  }

  /**
   * Sets a primitive value under the specified keypath in the object.
   *
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
