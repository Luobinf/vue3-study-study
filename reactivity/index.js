// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

debugger;
let activeEffect = undefined;

function effect(fn) {
  activeEffect = fn;
  fn(); // 执行副作用函数，用于对象属性读取，以进行依赖收集。
  activeEffect = undefined;
}

let bucket = new WeakMap();

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

  deps.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);

  deps &&
    deps.forEach((fn) => {
      fn && fn();
    });
}



const data = {
  name: "jack",
};

const obj = reactive(data);

effect(() => {
  console.log(obj.name);
});

obj.name = "jack chen";
