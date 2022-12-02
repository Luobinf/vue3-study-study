// 1. 副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。

debugger;
let activeEffect = undefined;
let bucket = new WeakMap();


function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn;
    fn(); // 执行副作用函数，用于对象属性读取，以进行依赖收集。
  }

  // 用于存放所有与该副作用函数与之相关联的依赖集合。
  effectFn.deps = []
  effectFn()

}

// 该函数用于清除副作用函数与之相关联的所有依赖，避免存储了无效的遗留副作用函数
function cleanup(effectFn) {
  const { length } = effectFn.deps
  for(let i = 0; i < length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
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
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);

  // 每次副作用函数执行时，将所有与之关联的依赖集合中删除掉，等到副作用函数重新执行后，又会重新建立联系，这样在新的联系中就不会有
  //遗留的副作用函数进行影响了。 
  deps &&
    deps.forEach((fn) => {
      fn && fn();
    });
}



const data = {
  name: "jack",
  isTrue: true
};

const obj = reactive(data);

let name = undefined

effect(() => {
  val = obj.isTrue ? obj.name : 'john'
  console.log(val)
});

obj.isTrue = false



// 由于 obj.isTrue 已经设置为 false，所以 val 最终的值与 obj.name 的值已经无关了，所以 obj.name 的值无论怎么变化，副作用函数都不应该再进行执行了
obj.name = 'xxxx'
