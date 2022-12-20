import { toReactive } from "./reactive";
import { hasOwn, hasChanged, isMap } from "../shared/index";
import { track, trigger, ITERABLE_KEY, MAP_KEY_ITERATE_KEY } from "./effect";
import { TriggerOpTypes } from "./operation";
import { ReactiveFlags, toRaw } from './util';


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
    return toReactive(result);
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


function createForEach(isReadonly, isShallow) {
	return function forEach (callback, thisArg) {
		const target = toRaw(this)
		const wrap = (val) => toReactive(val)
		track(target, ITERABLE_KEY) // 通过 ITERABLE_KEY 收集当前 forEach 方法外的副作用函数
		target.forEach((value, key) => {
			// 为什么 calback 需要重写 ？
			// the value received should be a corresponding reactive/readonly。
			callback && callback.call(thisArg, wrap(value), wrap(key), this)
		})
	}
}


function createIterableMethod(method) {
	return function (...args) {
		const target = this[ReactiveFlags.RAW]
		const targetIsMap = isMap(target)
		// Map 的默认迭代器是 entries 方法，Set 的默认迭代器是 values 方法。
		const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap)
		const isKeyOnly = method === 'keys' && targetIsMap
		const innerIterator = target[method](...args)
	
		const wrap = (val) => toReactive(val)
	
		track(target, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERABLE_KEY)
	
		return {
			next() {
				const { value, done } = innerIterator.next()
				return {
					value: value ? ( isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value) ): value,
					done
				}
			},
			// 可迭代协议，表示对象使用 for....of迭代时，会使用 Symbol.iterator 方法进行迭代
			[Symbol.iterator]() {
				return this
			}
		}
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
		forEach: createForEach(),
  };

	const iteratorMethods = ['values', 'keys', 'entries', Symbol.iterator]

	iteratorMethods.forEach(method => {
		mutableInstrumentations[method] = createIterableMethod(method)
	})

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

export {
  mutableCollectionHandlers,
};


