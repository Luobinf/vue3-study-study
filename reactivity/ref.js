import { effect, isReadonly, isShallow, toRaw } from "vue";
import { hasChanged } from "../shared";
import { createDep } from "./dep";
import { activeEffect, shouldTrack, trackEffects, triggerEffects } from "./effect";
import { reactive, toReactive } from "./reactive";

class RefImpl {
  constructor(value, __v_isShallow = false) {
    this.dep = undefined
    this.__v_isRef = true
    this.__v_isShallow = __v_isShallow
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    // 收集副作用函数
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if(hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)
      // 触发副作用函数
      triggerRefValue(this)
    }
  }
}


export function trackRefValue(ref) {
  if(shouldTrack && activeEffect) {
    ref.dep = ref.dep || createDep()
    trackEffects(ref.dep)
  }
}

export function triggerRefValue(ref) {
  if(ref.dep) {
    triggerEffects(ref.dep)
  }
}


function createRef(val, isShallow = false) {
  return new RefImpl(val, isShallow)
}


// 浅层 ref 的内部值将会原样存储和暴露，并且不会被深层递归地转为响应式。只有对 .value 的访问是响应式的。
export function shallowRef(val) {
  return createRef(val, true)
}

export function ref(val) {
  return createRef(val)
}

export function isRef(r) {
  return !!(r && r.__v_isRef === true);
}

export function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
    configurable: false,
    writable: false,
  });
  return wrapper;
}

export function toRefs(obj) {
  let result = {};

  for (const key in obj) {
    result[key] = toRef(obj, key);
  }

  return result;
}
