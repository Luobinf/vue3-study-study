// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

let { hasOwn, hasChanged, isObject, isIntegerKey } = require("../shared/index");

let activeEffect = undefined;
let effectStack = [];

let bucket = new WeakMap();

const ITERABLE_KEY = Symbol("iterable_key");

const TriggerOpTypes = {
  SET: "set",
  ADD: "add",
  DELETE: "delete",
};
const RAW = "__IS_RAW__";

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

function createReactive(target, isShallow = false, isReadonly = false) {
  return new Proxy(target, {
    // child.name: target = obj1, receiver = child,; target = obj2, receiver = child
    // 第一次读取时：receiver 是 target 的代理对象，第二次读取时 receiver 不是 target 的代理对象。
    // 如何确定 receiver 是 target 的代理对象？

    get(target, key, receiver) {
      if (key === RAW) {
        return target;
      }

      const res = Reflect.get(target, key, receiver);

      // 触发依赖收集
      if (!isReadonly) {
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
    },

    set(target, key, val, receiver) {
      if (isReadonly) {
        console.warn(`对象 ${target} 的属性 ${key} 是只读的, 无法修改`);
        return false;
      }

      const hadKey =
        Array.isArray(target) && isIntegerKey(key)
          ? Number(key) < target.length
          : hasOwn(target, key);

      const oldVal = target[key];
      const res = Reflect.set(target, key, val, receiver);

      // 触发依赖
      // 说明 receiver 是 target 的代理对象，避免触发因原型引起的副作用函数的更新
      if (target === receiver[RAW]) {
        if (!hadKey) {
          trigger(target, key, TriggerOpTypes.ADD);
        } else if (hasChanged(oldVal, val)) {
          // 触发set操作，只有新的值与旧的值不一样才需要执行与之相关的副作用函数
          trigger(target, key, TriggerOpTypes.SET, val, oldVal);
        }
      }

      return res;
    },

    has(target, prop) {
      const res = Reflect.has(target, prop);
      track(target, prop);
      return res;
    },

    deleteProperty(target, prop) {
      if (isReadonly) {
        console.warn(`对象 ${target} 的属性 ${key} 是只读的, 无法删除`);
        return false;
      }

      const hadKey = hasOwn(target, prop);
      const res = Reflect.deleteProperty(target, prop);
      if (res && hadKey) {
        trigger(target, prop, TriggerOpTypes.DELETE);
      }
      return res;
    },

    ownKeys(target) {
      const res = Reflect.ownKeys(target);
      if( Array.isArray(target) ) {
        track(target, 'length');
      } else {
        // 非数组可迭代对象，依赖收集
        track(target, ITERABLE_KEY);
      }
      return res;
    },
  });
}

function reactive(data) {
  return createReactive(data);
}

function shallowReactive(data) {
  // reactive（data, isShallow)
  return createReactive(data, true);
}

// 例如组件的 props 是只读的
function readonly(data) {
  return createReactive(data, false, true);
}

function shallowReadonly(data) {
  return createReactive(data, true, true);
}

function track(target, key) {
  if (!activeEffect) return;

  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
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
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  let deps = []

  if(Array.isArray(target) && key === 'length') {
    // 取出索引值大于等于 length 长度的副作用依赖
    for(let index = Number(oldVal); index >= Number(newVal); index--) {
      deps.push( depsMap.get(`${index}`) )
    }
  }

  // const iterableKeyDeps = depsMap.get(ITERABLE_KEY);
  // 每次副作用函数执行时，将所有与之关联的依赖集合中删除掉，等到副作用函数重新执行后，又会重新建立联系，这样在新的联系中就不会有
  //遗留的副作用函数进行影响了。

  // store all deps for SET | ADD | DELETE operate
  if(key !== undefined) {
    deps.push(depsMap.get(key))
  }

  // 只有当 ADD 类型时（表示新增属性），才将与 ITERABLE_KEY 相关联的副作用函数也添加到 deps 中去。
  switch (type) {
    case TriggerOpTypes.ADD:
      if(!Array.isArray(target)) {
        deps.push(depsMap.get(ITERABLE_KEY))
      } else if(Array.isArray(target) && isIntegerKey(key)) {
        // new index added to array -> length changes
        deps.push(depsMap.get('length'))
      }
      break;
    case TriggerOpTypes.DELETE:
      if(!Array.isArray(target)) {
        deps.push(depsMap.get(ITERABLE_KEY))
      }
      break
    case TriggerOpTypes.SET:

      break;
  }
  
  const effects = []
  for(const dep of deps) {
    if(dep) {
      effects.push(...dep)
    }
  }

  triggerEffects(createDep(effects))
}


function triggerEffects(effects) {
  for(const effect of effects) {
    triggerEffect(effect)
  }
}


function triggerEffect(effect) {
  if(effect !== activeEffect) {
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

function createDep(effects) {
  const dep = new Set(effects)
  return dep
}

module.exports = {
  effect,
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
};

// 计算属性值会基于其响应式依赖被缓存。一个计算属性仅会在其响应式依赖更新时才重新计算。
// 计算属性应该如何实现？？

// case=========================
// const data = {
//   name: "jack",
//   isTrue: true,
//   foo: 1,
//   count: 90,
// };

// const obj = reactive(data);

// let name = undefined;

// effect(() => {
//   val = obj.isTrue ? obj.name : 'john'
//   console.log(val)
// });

// obj.isTrue = false

// 由于 obj.isTrue 已经设置为 false，所以 val 最终的值与 obj.name 的值已经无关了，所以 obj.name 的值无论怎么变化，副作用函数都不应该再进行执行了
// obj.name = 'xxxx'

// 嵌套的 effect
// effect(() => {
//   console.log(`最外层effect函数执行`)
//   effect(() => {
//     console.log(`最里层effect函数执行`)
//     obj.name
//   })
//   obj.isTrue
// })

// obj.name = 90

// 避免无限无限递归循环的情况
// effect(() => {
//   obj.foo = obj.foo + 1;
// });

// 支持可调度性
// 可调度性指的是用户有能力决定什么时候去触发副作用函数的执行时机。

// effect(() => {
//   console.log(obj.foo)
// }, {
//   scheduler(fn) {
//     setTimeout(() => {
//       fn && fn()
//     }, 0);
//   }
// });

// obj.foo++
// obj.foo++

// 使用微任务控制更新 job，使得响应式数据更新多次只会执行一次。
// let jobQueue = new Set()
// let isFlushing = false
// let p = Promise.resolve()

// function flushJob() {
//   if(isFlushing) return
//   isFlushing = true
//   p.then(() => {
//     jobQueue.forEach(job => {
//       job && job()
//     })
//   }).finally(() => {
//     isFlushing = false
//   })
// }

// effect(() => {
//   console.log(obj.foo)
// }, {
//   scheduler(fn) {
//     jobQueue.add(fn)
//     flushJob()
//   }
// });

// obj.foo++
// obj.foo++

// const effectFn = effect(
//   () => {
//     console.log(`我被执行了吗？？`);
//     return obj.foo;
//   },
//   {
//     lazy: true,
//   }
// );

// const value = effectFn();

// console.log(value, value);

// console.log(res.value);

// obj.foo++;

// console.log(res.value);

// obj.foo 的数据发生变化之后，以下 effect 副作用函数并不会重新执行。原因是 res.value内部的computed中的getter函数建立了
//联系，而res.value 与副作用函数本身并没有建立联系。只需要将res.value与最外层的副作用函数建立联系即刻。

// effect(() => {
//   console.log(res.value)
// })

// obj.foo++

// const plusOne = computed({
//   get: () => obj.count + 1,
//   set: (val) => {
//     obj.count = val - 1;
//   },
// });

// effect(() => {
//   console.log(`变更了吗？`, plusOne.value);
// });

// console.log(plusOne.value); // 91
// plusOne.value = 1;
// console.log(obj.count); // 0
