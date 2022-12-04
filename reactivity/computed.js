const { effect } = require('./index')

function computed(getterOrOptions) {
  // 用于缓存上一次的计算结果
  let value;
  let dirty = true;

  let getter = () => {};
  let setter;
  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
  } else if (typeof getterOrOptions === "object" && getterOrOptions !== null) {
    if (typeof getterOrOptions.get === "function") {
      getter = getterOrOptions.get;
    }
    if (typeof getterOrOptions.set === "function") {
      setter = getterOrOptions.set;
    }
  }
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true;
      // 当计算属性所依赖的响应式数据发生变化时，手动调用 track 函数进行更新。
      trigger(obj, "value");
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      // 当读取 value 时，手动调用 track 函数进行对 value 属性读取的副作用函数的追踪
      track(obj, "value");
      return value;
    },
    set value(newVal) {
      if (setter && newVal !== value) {
        setter(newVal);
      }
    },
  };
  return obj;
}


module.exports = computed
