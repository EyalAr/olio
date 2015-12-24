import {
  cloneDeep,
  forEach,
  intersection,
  keys,
  difference,
  isObject,
  isUndefined
} from "lodash";

import ObjectModifier from "./objectModifier";

/**
 * A list of differences.
 * First element indicates the path in the object.  
 * Second element indicates the type of difference:
 * - "a" - add
 * - "u" - update
 * - "d" - delete
 *
 * Third element is the new value on add operation, or the old value on update
 * and delete operations.
 * Fourth element is the new value on update operation.
 * @typedef {Array} Diff
 */

/**
 * Calculate the diff between two objects.
 * @param  {Object} base The base object.
 * @param  {Object} target The target object.
 * @return {Diff} The list of differences between the objects.
 */
function diff(base, target) {
  const o1Clone = cloneDeep(base),
        modifier = new ObjectModifier(o1Clone),
        res = [];
  _diff([], o1Clone, target, modifier);
  modifier.compact();
  modifier.compress();
  modifier.forEachChange((path, newVal, oldVal) => {
    const uold = isUndefined(oldVal),
          unew = isUndefined(newVal),
          op = uold ? "a" : unew ? "d" : "u",
          entry = [path, op];
    if (!uold) { entry.push(oldVal); }
    if (!unew) { entry.push(newVal); }
    res.push(entry);
  });
  return res;
}

/**
 * @private
 */
function _diff(path, o1, o2, modifier) {
  if (!isObject(o2)) {
    modifier.set(path, o2);
    return;
  }
  forEach(intersection(keys(o1), keys(o2)), k => {
    if (!isObject(o1[k])) {
      modifier.set(path.concat([k]), o2[k]);
    }
    _diff(path.concat([k]), o1[k], o2[k], modifier);
  });
  forEach(difference(keys(o1), keys(o2)), k => {
    modifier.remove(path.concat([k]));
  });
  forEach(difference(keys(o2), keys(o1)), k => {
    modifier.set(path.concat([k]), o2[k]);
  });
}

export default diff;
