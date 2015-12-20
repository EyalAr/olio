import {
  isObject,
  map,
  parseInt
} from "lodash";

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
function ensurePath(obj, path) {
  // no new sub-objects need to be created. obj[path[0]] exists or is undefined
  if (path.length === 1) return [];
  const key = path[0],
        next = path[1],
        newPaths = [],
        oldVal = obj[key];
  if (!isObject(oldVal)) {
    // we need to override this value with an object or an array in order to
    // keep going down the path.
    // decide if to create an object or an array based on if the key is a
    // positive integer or not.
    const makeArray = +next === parseInt(next) && +next >= 0,
          newVal = obj[key] = makeArray ? [] : {},
          relPath = [key]; // relative path to our current position
    newPaths.push({
      path: relPath,
      newVal,
      oldVal,
    });
  }
  return newPaths.concat(
    // continue traversing the object tree
    map(ensurePath(obj[key], path.slice(1)), p => {
      p.path = [key].concat(p.path); // fix relative path
      return p;
    })
  );
}

export default ensurePath;
