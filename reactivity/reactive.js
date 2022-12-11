// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

const { isObject, toRawType } = require("../shared/index");
const {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} = require("./baseHandlers");
const { collectionHandlers } = require("./collectionHandlers");

const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();

const TargetType = {
  INVALID: 0,
  COMMON: 1,
  COLLECTION: 2,
};

function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakSet":
    case "WeakMap":
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

function getTargetType(target) {
  return targetTypeMap(toRawType(target));
}

function createReactiveObject(
  target,
  isReadonly = false,
  baseHandlers,
  collectionHandlers,
  proxyMap
) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }

  // 目标对象已经是 Proxy 代理时，则直接重中获取，避免无限递归循环。p.125
  const existionProxy = proxyMap.get(target);
  if (existionProxy) return existionProxy;

  // only specific value types can be observed.
  const targetType = getTargetType(target);
  if (targetType === TargetType.INVALID) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  );

  proxyMap.set(target, proxy);

  return proxy;
}

function reactive(target) {
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    collectionHandlers,
    reactiveMap
  );
}

function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    collectionHandlers,
    shallowReactiveMap
  );
}

// 例如组件的 props 是只读的
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    collectionHandlers,
    readonlyMap
  );
}

function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    collectionHandlers,
    shallowReadonlyMap
  );
}

module.exports = {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
};
