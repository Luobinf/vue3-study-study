# 响应系统的作用与实现

**问题：**

1. 为什么要使用 Proxy，与 Object.defineProperty 有啥不同？
2. 数组的响应系统如何实现？
3. 什么是响应式数据，什么是副作用，什么是依赖？
4. 依赖如何收集，如何触发？
5. Reflect 是用来干啥的，为什么 Reflect 常常与 Proxy 一起使用？
6. 依赖存储的数据结构中为什么要使用 WeakMap 数据结构？
7. 为什么会存在嵌套的 effect？
8. 原始值与非原始值的响应式方案如何设计？
7. 计算属性是如何实现的？
8. watch是如何实现的？


副作用函数：会产生副作用的函数。一个函数若输入一些参数，输出的结果每次都一样，且不影响外界，则表示该函数是一个纯函数，否则就是副作用函数。副作用函数会产生一些附加影响，例如修改全局变量等。

副作用函数要与操作目标字段建立明确的联系。例如我在副作用函数中读取了obj.xx 的字段，我应该将 obj 上的 xx 字段与副作用函数建立联系。那如何设计数据结构呢？


target1 
    ---->key1
           ----> effectFn
    ---->key2
           ----> effectFn, effectFn2

target2 
    ---->key1
           ----> effectFn
    ---->key2
           ----> effectFn, effectFn2

    副作用函数与响应式目标字段之间的数据结构关系



## 遗留的副作用函数导致不必要的更新

```JS
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

```


## 嵌套的 effect

```JS
effect(() => {
  console.log(`最外层effect函数执行`)
  effect(() => {
    console.log(`最里层effect函数执行`)
    obj.name
  })
  obj.isTrue
})
```


## 避免无限递归循环

```JS
effect(() => {
  obj.foo = obj.foo + 1;
});

effectsToRun &&
    effectsToRun.forEach((effectFn) => {
       // 新增
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行，避免出现无限递归的情况。
      if (activeEffect !== effectFn) {
        effectFn && effectFn();
      }
    });
```



## 调度执行


1. 可调度性指的是用户有能力决定什么时候去触发副作用函数的执行时机。
2. 控制副作用函数执行的次数（多次修改数据只会触发一次更新）。


```JS
// 通过 scheduler，用户有能力决定什么时候去触发副作用函数的执行时机
effect(() => {
  console.log(obj.foo)
}, {
  scheduler(fn) {
    setTimeout(() => {
      fn && fn()
    }, 0);
  }
});
obj.foo++
console.log(`执行结束了吗？？？`)
```



```JS
// 控制副作用函数执行的次数（多次修改数据只会触发一次更新）
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
    // 该调度函数中副作用函数最终只会执行一次   
    jobQueue.add(fn)
    flushJob()
  }
});

obj.foo++
obj.foo++
```


## 计算属性 computed 与 lazy（副作用函数的懒执行）


lazy: 用于控制副作用函数的执行时机，有时候我们并不希望副作用函数立即执行，用户决定什么时候去执行以及到底执不执行。通过 effect 函数调用后的返回值即为副作用函数。


计算属性：计算属性的结果会被缓存，计算属性只有在其响应式依赖发生变化时才会进行计算。


```JS
const obj = reactive({
    name: 'jack'
})
const result = computed(() => {
    return obj.name
})
console.log(result.value) // 'jack'
obj.name =  'hello ' + obj.name
console.log(result.value) // 'hello jack'
```

# 原始值的响应式方案

Proxy 与 Reflect。








