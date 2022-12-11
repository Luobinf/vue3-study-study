const { effect } = require("./effect");
const {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
} = require("./reactive");



module.exports = {
  effect,
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
};

//  计算属性值会基于其响应式依赖被缓存。一个计算属性仅会在其响应式依赖更新时才重新计算。
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
