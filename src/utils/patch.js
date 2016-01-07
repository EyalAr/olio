import {
  last,
  dropRight,
  isString,
  isUndefined
} from "lodash";
import Im from "immutable";
import pointer from "json-pointer";

const ops = {
        add: patchAdd,
        remove: patchRemove,
        replace: patchReplace,
        copy: patchCopy,
        move: patchMove,
        test: patchTest
      },
      END_OF_LIST_TOKEN = "-",
      LIST_ADD_INDICATOR_RE = new RegExp(`^(${END_OF_LIST_TOKEN}|(\\d+))$`),
      LIST_INDICATOR_RE = /^\d+$/;

function patchAdd(base, path, value) {
  const lastPath = last(path),
        containerPath = dropRight(path),
        container = base.getIn(containerPath);
  if (isUndefined(container)) {
    throw Error("Invalid path");
  }
  if (LIST_ADD_INDICATOR_RE.test(lastPath)) {
    if (Im.Iterable.isIndexed(container)) {
      if (lastPath === END_OF_LIST_TOKEN) {
        const listLen = container.count();
        path = dropRight(path).concat(listLen);
      }
      return patchAddIndexed(base, path, value);
    }
  }
  return patchAddKeyed(base, path, value);
}

function patchAddKeyed(base, path, value) {
  return base.setIn(path, value);
}

function patchAddIndexed(base, path, value) {
  const pathToList = dropRight(path),
        indexInList = +last(path),
        list = base.getIn(pathToList);
  return base.setIn(pathToList, list.splice(indexInList, 0, value).toList());
}

function patchRemove(base, path) {
  const lastPath = last(path);
  if (LIST_INDICATOR_RE.test(lastPath)) {
    const listPath = dropRight(path),
          list = base.getIn(listPath);
    if (Im.Iterable.isIndexed(list)) {
      return patchRemoveIndexed(base, path);
    }
  }
  return patchRemoveKeyed(base, path);
}

function patchRemoveKeyed(base, path) {
  return base.removeIn(path);
}

function patchRemoveIndexed(base, path) {
  const pathToList = dropRight(path),
        indexInList = +last(path),
        list = base.getIn(pathToList);
  return base.setIn(pathToList, list.splice(indexInList, 1).toList());
}

function patchReplace(base, path, value) {
  return patchAdd(patchRemove(base, path), path, value);
}

function patchCopy(base, path, value, from) {
  value = base.getIn(from);
  return base.setIn(path, value);
}

function patchMove(base, path, value, from) {
  return patchRemove(patchCopy(base, path, undefined, from), from);
}

function patchTest(base, path, value) {
  if (Im.is(base.getIn(path), value)) {
    return base;
  }
  throw Error("Test operation failed");
}

export default function patch(base, p) {
  return p.reduce((acc, { op, path, value, from }) => {
    return ops[op](
      acc,
      pointer.parse(path),
      Im.fromJS(value),
      isString(from) ? pointer.parse(from) : undefined
    );
  }, base);
}
