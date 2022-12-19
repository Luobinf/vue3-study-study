import { reactive, readonly } from "./reactive";
import { track, trigger, pauseTracking, resetTracking, ITERABLE_KEY } from "./effect";
import { hasOwn, hasChanged, isObject, isIntegerKey, isSymbol, extend } from "../shared/index";
import { TriggerOpTypes } from "./operation";
import { ReactiveFlags } from './util';

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const set = createSetter();
const shallowReadonlyGet = createGetter(true, true);

const arrayInstrumentations = createArrayInstrumentations();
// 数组方法重写
function createArrayInstrumentations() {
  const instrumentations = {};

  ["includes", "indexOf", "lastIndexOf"].forEach((method) => {
    const originMethod = Array.prototype[method];
    instrumentations[method] = function (...args) {
      let res = originMethod.apply(this, args);

      // res 为 false 表示在代理对象中找不到，接着再去原始对数组中查找值在不在
      if (res === false || res === -1) {
        res = originMethod.apply(this[ReactiveFlags.RAW], args);
      }

      return res;
    };
  });

  // 对于某些方法调用会隐式的修改数组长度，导致 length 被收集，可能在某些情况下会导致无限循环(#2137)。
  ["push", "pop", "shift", "unshift", "splice"].forEach((method) => {
    const originMethod = Array.prototype[method];
    instrumentations[method] = function (...args) {
      pauseTracking();
      let res = originMethod.apply(this, args);
      resetTracking();
      return res;
    };
  });

  return instrumentations;
}

const mutableHandlers = {
  get,
  set,
  has,
  deleteProperty,
  ownKeys,
};

const shallowReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowGet,
});

const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`对象 ${target} 的属性 ${key} 是只读的, 无法修改`);
    return false;
  },
  deleteProperty(target, prop) {
    console.warn(`对象 ${target} 的属性 ${prop} 是只读的, 无法删除`);
    return false;
  },
};

const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});

function createGetter(isReadonly = false, isShallow = false) {
  // child.name: target = obj1, receiver = child,; target = obj2, receiver = child
  // 第一次读取时：receiver 是 target 的代理对象，第二次读取时 receiver 不是 target 的代理对象。
  // 如何确定 receiver 是 target 的代理对象？
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.RAW) {
      return target;
    }

    // 数组方法重写
    if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }

    const res = Reflect.get(target, key, receiver);

    // 触发依赖收集
    if (!isReadonly && !isSymbol(key)) {
      track(target, key);
    }

    // 浅响应或浅只读
    if (isShallow) {
      return res;
    }

    // 深响应或深只读
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, val, receiver) {
    const hadKey =
      Array.isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const oldVal = target[key];
    const res = Reflect.set(target, key, val, receiver);

    // 触发依赖
    // 说明 receiver 是 target 的代理对象，避免触发因原型引起的副作用函数的更新
    if (target === receiver[ReactiveFlags.RAW]) {
      if (!hadKey) {
        trigger(target, key, TriggerOpTypes.ADD);
      } else if (hasChanged(oldVal, val)) {
        // 触发set操作，只有新的值与旧的值不一样才需要执行与之相关的副作用函数
        trigger(target, key, TriggerOpTypes.SET, val, oldVal);
      }
    }

    return res;
  };
}

function has(target, prop) {
  const res = Reflect.has(target, prop);
  track(target, prop);
  return res;
}

function deleteProperty(target, prop) {
  const hadKey = hasOwn(target, prop);
  const res = Reflect.deleteProperty(target, prop);
  if (res && hadKey) {
    trigger(target, prop, TriggerOpTypes.DELETE);
  }
  return res;
}

function ownKeys(target) {
  const res = Reflect.ownKeys(target);
  if (Array.isArray(target)) {
    track(target, "length");
  } else {
    // 非数组可迭代对象，依赖收集
    track(target, ITERABLE_KEY);
  }
  return res;
}

export {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
};
