// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

import { isObject, toRawType } from "../shared/index";
import { mutableHandlers, shallowReactiveHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";
import { mutableCollectionHandlers } from "./collectionHandlers";

export const reactiveMap = new WeakMap();
export const shallowReactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

const TargetType = {
  INVALID: 0,
  COMMON: 1,
  COLLECTION: 2,
};


export const ReactiveFlags = {
	IS_SHALLOW: '__v_isShallow',
	IS_REACTIVE: '__v_isReactive',
	IS_READONLY: '__v_isReadonly',
	RAW: '__v_raw',
}


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

export function reactive(target) {
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}

export function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    mutableCollectionHandlers,
    shallowReactiveMap
  );
}

// 例如组件的 props 是只读的
export function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    mutableCollectionHandlers,
    readonlyMap
  );
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    mutableCollectionHandlers,
    shallowReadonlyMap
  );
}


export function isShallow(value) {
	return !!(value && value[ReactiveFlags.IS_SHALLOW])
}

export function isReactive(value) {
	return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function isReadonly(value) {
	return !!(value && value[ReactiveFlags.IS_READONLY])
}

export function isProxy(value) {
	return isReactive(value) || isReadonly(value)
}

export function toRaw(observed) {
	const raw = observed && observed[ReactiveFlags.RAW]
	// observed 又可能会被多次代理
	return raw ? toRaw(raw) : observed
}

export const toReactive = (value) => {
	return isObject(value) ? reactive(value) : value
}

export const toReadonly = (value) => {
	isObject(value) ? readonly(value) : value
}




