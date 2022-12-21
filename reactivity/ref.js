import { toRaw } from "vue";
import { reactive, toReactive } from "./reactive";

class RefImpl {
  constructor(value, __v_isShallow) {
    this.dep = undefined
    this.__v_isRef = true
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    return this._value
  }

  set value(newVal) {

  }
}


export function shallowRef() {

}

export function ref(val) {
  const wrapper = {
    value: val,
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
    configurable: false,
    writable: false,
  });
  return reactive(wrapper);
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
