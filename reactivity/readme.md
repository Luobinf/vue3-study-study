# 响应系统的作用与实现

**问题：**

1. 为什么要使用 Proxy，Object.defineProperty 有啥缺点？
2. 数组的响应系统如何实现？
3. 什么是响应式数据，什么是副作用，什么是依赖？
4. 依赖如何收集，如何触发？
5. Reflect 是用来干啥的，为什么 Proxy 常常与 Reflect 一起使用？
6. 依赖存储的数据结构中为什么要使用 WeakMap 数据结构？


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








