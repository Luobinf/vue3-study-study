// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

debugger;
let activeEffect = undefined;
let effectStack = [];

let bucket = new WeakMap();

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);

    activeEffect = effectFn;
    effectStack.push(effectFn);

    fn(); // 执行副作用函数，用于对象属性读取，以进行依赖收集。

    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };

  // 用于存放所有与该副作用函数与之相关联的依赖集合。
  effectFn.deps = [];
  effectFn.options = options
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

function reactive(data) {
  return new Proxy(data, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);

      // 触发依赖收集
      track(target, key);

      return res;
    },

    set(target, key, val, receiver) {
      Reflect.set(target, key, val, receiver);

      // 触发依赖
      trigger(target, key);
    },
  });
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

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);

  // 每次副作用函数执行时，将所有与之关联的依赖集合中删除掉，等到副作用函数重新执行后，又会重新建立联系，这样在新的联系中就不会有
  //遗留的副作用函数进行影响了。

  const effectsToRun = new Set(deps);

  effectsToRun &&
    effectsToRun.forEach((effectFn) => {
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行，避免出现无限递归的情况。
      if (activeEffect !== effectFn) {
        const { scheduler } = effectFn.options
        if(scheduler) {
          // 支持可调度性：副作用函数的执行时机
          scheduler && scheduler(effectFn)
        } else {
          // 默认执行副作用函数
          effectFn && effectFn();
        }
      }
    });
}

const data = {
  name: "jack",
  isTrue: true,
  foo: 1,
};

const obj = reactive(data);

let name = undefined;


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


let jobQueue = new Set()
let isFlushing = false
let p = Promise.resolve()
// 使用微任务控制更新 job，使得响应式数据更新多次只会执行一次。

function flushJob() {
  if(isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => {
      job && job()
    })
  }).finally(() => {
    isFlushing = false
  })
}


effect(() => {
  console.log(obj.foo)
}, {
  scheduler(fn) {
    jobQueue.add(fn)
    flushJob()
  }
});

obj.foo++
obj.foo++





