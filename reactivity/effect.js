import { createDep } from "./dep.js";
import { TriggerOpTypes } from "./operation";
import { isIntegerKey, isArray, isMap } from "../shared/index";

let activeEffect = undefined;
let effectStack = [];
let targetMap = new WeakMap();

let shouldTrack = true;

const ITERABLE_KEY = Symbol("iterable_key");

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);

    activeEffect = effectFn;
    effectStack.push(effectFn);

    const result = fn(); // 执行副作用函数，用于对象属性读取，以进行依赖收集。

    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];

    return result;
  };

  // 用于存放所有与该副作用函数与之相关联的依赖集合。
  effectFn.deps = [];
  effectFn.options = options;

  if (options.lazy) {
    return effectFn;
  }
  effectFn();
}

// 该函数用于清除副作用函数与之相关联的所有依赖，避免存储了无效的遗留副作用函数
function cleanup(effectFn) {
  const { length } = effectFn.deps;
  for (let i = 0; i < length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

function track(target, key) {
  if (!activeEffect || !shouldTrack) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  // 将当前激活的副作用函数存放到 deps 依赖集合中去。
  deps.add(activeEffect);
  // 将所有与 activeEffect 副作用函数与之关联的依赖集合收集起来。
  activeEffect.deps.push(deps);
}

function trigger(target, key, type, newVal, oldVal) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  let deps = [];

  if (isArray(target) && key === "length") {
    // 取出索引值大于等于 length 长度的副作用依赖
    for (let index = Number(oldVal); index >= Number(newVal); index--) {
      deps.push(depsMap.get(`${index}`));
    }
  } else {
    // const iterableKeyDeps = depsMap.get(ITERABLE_KEY);
    // 每次副作用函数执行时，将所有与之关联的依赖集合中删除掉，等到副作用函数重新执行后，又会重新建立联系，这样在新的联系中就不会有
    //遗留的副作用函数进行影响了。

    // store all deps for SET | ADD | DELETE operate
    if (key !== undefined) {
      deps.push(depsMap.get(key));
    }

    // 只有当 ADD 类型时（表示新增属性），才将与 ITERABLE_KEY 相关联的副作用函数也添加到 deps 中去。
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERABLE_KEY));
        } else if (isArray(target) && isIntegerKey(key)) {
          // new index added to array -> length changes
          deps.push(depsMap.get("length"));
        }
        break;
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERABLE_KEY));
        }
        break;
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          deps.push(depsMap.get(ITERABLE_KEY));
        }
        break;
    }
  }

  const effects = [];
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }

  triggerEffects(createDep(effects));
}

function triggerEffects(effects) {
  for (const effect of effects) {
    triggerEffect(effect);
  }
}

function triggerEffect(effect) {
  if (effect !== activeEffect) {
    const { scheduler } = effect.options;
    if (scheduler) {
      // 支持可调度性：副作用函数的执行时机
      scheduler(effect);
    } else {
      // 默认执行副作用函数
      effect && effect();
    }
  }
}

function pauseTracking() {
  shouldTrack = false;
}

function resetTracking() {
  shouldTrack = true;
}

export { track, trigger, effect, pauseTracking, resetTracking, ITERABLE_KEY };
