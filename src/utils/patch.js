import {
  forEach,
  isObject,
  eq
} from "lodash";

import ObjectModifier from "./objectModifier";

/**
 * Apply a diff to an object.  
 * Modifies the object.  
 * In strict mode, the old value of each changed property will be verified. If
 * there is a mismatch an error will be thrown.
 * @param {Object} target The target object to patch.
 * @param {Diff} diff The diff to apply.
 * @param {Boolean} [strict=true] Should the patch be strict.
 * @return {ObjectModifier} An object modifier which can be used to get all the
 * changes done to the object.
 */
function patch(target, diff, strict = true) {
  const modifier = new ObjectModifier(target);
  forEach(diff, _patchEntry.bind(null, target, modifier, strict));
  modifier.compact();
  return modifier;
}

/**
 * @private
 */
function _patchEntry(o, m, strict, p) {
  const path = p[0],
        type = p[1];
  let expectedOldVal, actualOldVal, newVal;
  switch (type) {
    case "a":
      expectedOldVal = undefined;
      newVal = p[2];
      break;
    case "u":
      expectedOldVal = p[2];
      newVal = p[3];
      break;
    case "d":
      expectedOldVal = p[2];
      newVal = undefined;
      break;
    default:
      throw Error("Unknown patch entry type " + type);
  }
  if (strict) {
    actualOldVal = _get(o, path);
    if (!eq(actualOldVal, expectedOldVal)) {
      _throwBaseError(expectedOldVal, actualOldVal);
    }
  }
  m.set(path, newVal);
}

/**
 * @private
 */
function _throwBaseError(expected, actual) {
  throw Error("Base mismatch error. " + "Expected " + expected + " but found " + actual);
}

/**
 * Get the value under the specified path in the object.
 * @private
 */
function _get(o, path) {
  if (!path.length) {
    return o;
  }
  if (!isObject(o)) {
    return undefined;
  }
  return _get(o[path[0]], path.slice(1));
}

export default patch;
