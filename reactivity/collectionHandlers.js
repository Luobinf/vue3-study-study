const { hasOwn, hasChanged, isObject } = require("../shared/index");
const { track, trigger, ITERABLE_KEY } = require("./effect");
const { TriggerOpTypes } = require("./operation");
const { ReactiveFlags, toRaw } = require('./util')

function size(target) {
  target = toRaw(target);
  track(target, ITERABLE_KEY);
  return Reflect.get(target, "size", target);
}

function add(key) {
	key = toRaw(key)
  const target = toRaw(this);
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
  const target = toRaw(this);
  const hadKey = target.has(key);
  const result = target.delete(key);
  if (hadKey) {
    trigger(target, key, TriggerOpTypes.DELETE);
  }
  return result;
}

function get(key) {
  const target = toRaw(this);
  const hadKey = target.has(key);
  // 追踪依赖，建立响应联系
  track(target, key);

  if (hadKey) {
    const result = target.get(key);
    // 若获取到的结果是一个对象，则需要将其转化成响应式数据
    return isObject(result) ? reactive(result) : result;
  }
}

function set(key, value) {
  // const target = this[ReactiveFlags.RAW]
	const target = toRaw(this)
	const hadKey = target.has(key)
	const oldVal = target.get(key)
	// 这里需要获取 value 的原始数据之后再进行 set 操作，有可能 value 是一个响应式数据，若不进行特殊处理，可能会引起不必要的更新。 p.141
	value = toRaw(value)
	target.set(key, value)

	if(!hadKey) {
		trigger(target, key, TriggerOpTypes.ADD)
	} else if(hasChanged(value, oldVal)) {
		trigger(target, key, TriggerOpTypes.SET)
	}
}

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
    if (key === ReactiveFlags.RAW) {
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
