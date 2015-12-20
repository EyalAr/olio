import {
    isObject,
    forEach
} from 'lodash';

/**
 * Makes sure a path exists in the object tree.
 * Recursively creates child objects and/or arrays.
 * Remembers the old value of a path if it was overridden.
 * @param  {Object} obj The object to ensure the path in.
 * @param  {Array} path The path.
 * @return {Array} A list of the new paths which were created in the object
 * with the new values and old values of each path.
 * @example
 * var obj = { a: { b: "foo" } };
 * ensurePath(obj, ['a', 'b', 'c', 'd']);
 * // 'obj' is now { a: { b: { c: {} } } }
 * // and the path 'a.b.c.d' exists in this object.
 * // the return value is an array which contains information
 * // about the new paths which were created:
 * // [{
 * //   path: ['a', 'b'],
 * //   newVal: { c: {} },
 * //   oldVal: "foo"
 * // }, {
 * //   path: ['a', 'b', 'c'],
 * //   newVal: {},
 * //   oldVal: "foo"
 * // }]
 * // NOTE that 'a.b.c.d' is not reported as a new path, since obj.a.b.c.d
 * // was undefined and is still undefined; hence nothing changed for this path.
 */
function ensurePath ( obj, path ) {
    if (path.length === 1) return [];
    let key = path[0],
        next = path[1],
        newPaths = [];
    if (!isObject(obj[key])) {
        let oldVal = obj[key];
        obj[key] = +next === parseInt(next) && +next >= 0 ? [] : {};
        newPaths.push({
            path: [key],
            oldVal: oldVal,
            newVal: obj[key]
        });
    }
    var subPaths = ensurePath(obj[key], path.slice(1));
    forEach(subPaths, p => p.path = [key].concat(p.path));
    return newPaths.concat(subPaths);
}

export default ensurePath;
