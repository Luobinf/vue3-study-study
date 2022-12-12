const { TriggerOpTypes } = require("vue");
const { track, trigger } = require("./effect");
const { RAW } = require("./operation");

const { ITERABLE_KEY } = require("./effect");

const mutableInstrumentations = {
  add(key) {
    const target = this[RAW];
    const hadKey = target.has(key);
    const res = target.add(key);
    // Set 数据结构自动去除重复
    if (!hadKey) {
      trigger(target, key, TriggerOpTypes.ADD);
    }
    return res;
  },
  size(target) {
    target = target[RAW];
    track(target, ITERABLE_KEY);
    return Reflect.get(target, "size", target);
  },
};

const collectionHandlers = {
  get(target, key, receiver) {
    if (key === RAW) {
      return target;
    }
    return mutableInstrumentations[key];
  },
};

module.exports = {
  collectionHandlers,
};
