const { hasOwn } = require("../shared/index");
const { track, trigger } = require("./effect");
const { TriggerOpTypes, RAW } = require("./operation");

const { ITERABLE_KEY } = require("./effect");
const { isObject } = require("@vue/shared");
const { reactive } = require("vue");

function size(target) {
  target = target[RAW];
  track(target, ITERABLE_KEY);
  return Reflect.get(target, "size", target);
}

function add(key) {
  const target = this[RAW];
  const hadKey = target.has(key);
  // Set 数据结构自动去除重复
  if (!hadKey) {
    target.add(key);
    trigger(target, key, TriggerOpTypes.ADD);
  }
  return this;
}

function deleteEntry(key) {
  // 获取原始对象
  const target = this[RAW];
  const hadKey = target.has(key);
  const result = target.delete(key);
  if (hadKey) {
    trigger(target, key, TriggerOpTypes.DELETE);
  }
  return result;
}

function get(key) {
  const target = this[RAW];
  const hadKey = target.has(key);
  // 追踪依赖，建立响应联系
  track(target, key);

  if (hadKey) {
    const result = target.get(key);
    // 若获取到的结果是一个对象，则需要将其转化成响应式数据
    return isObject(result) ? reactive(result) : result;
  }
}

function set(key) {}

function createInstrumentations() {
  const mutableInstrumentations = {
    add,
    get size() {
      return size(this);
    },
    delete: deleteEntry,
    get,
    set,
  };

  return {
    mutableInstrumentations,
  };
}

const { mutableInstrumentations } = createInstrumentations();

function createInstrumentationGetter() {
  const instrumentations = mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === RAW) {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver
    );
  };
}

const mutableCollectionHandlers = {
  get: createInstrumentationGetter(),
};

module.exports = {
  mutableCollectionHandlers,
};
