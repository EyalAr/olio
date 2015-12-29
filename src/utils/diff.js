import {
  cloneDeep,
  forEach,
  intersection,
  keys,
  difference,
  isUndefined,
  isPlainObject,
  isArray,
  isEmpty
} from "lodash";

import ObjectModifier from "./objectModifier";

/**
 * A list of differences.
 *
 * First element indicates the path in the object.
 *
 * Second element indicates the type of difference:
 *
 * 0. "a" - add
 * 0. "u" - update
 * 0. "d" - delete
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
  const baseClone = cloneDeep(base),
        modifier = new ObjectModifier(baseClone);
  _diff([], baseClone, target, modifier);
  return generateDiffFromChanges(modifier);
}

function generateDiffFromChanges(modifier) {
  const res = [];
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
  if (isEmpty(o2)) {
    if (path.length) {
      modifier.set(path, o2);
      return;
    }
  }
  forEach(intersection(keys(o1), keys(o2)), k => {
    const nextPath = path.concat([k]),
          sameType = (isPlainObject(o1[k]) && isPlainObject(o2[k])) ||
                     (isArray(o1[k]) && isArray(o2[k]));
    if (sameType) {
      _diff(nextPath, o1[k], o2[k], modifier);
    } else {
      modifier.set(nextPath, o2[k]);
    }
  });
  forEach(difference(keys(o1), keys(o2)), k => {
    modifier.remove(path.concat([k]));
  });
  forEach(difference(keys(o2), keys(o1)), k => {
    modifier.set(path.concat([k]), o2[k]);
  });
}

export { diff, generateDiffFromChanges };
