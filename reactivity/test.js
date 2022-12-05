debugger
const set = new Set([1]);
const newSet = new Set(set);

newSet.forEach((item) => {
  set.delete(1);
  set.add(1);
  // console.log(7878)
});

const { reactive, effect } = require("./index");

const data = {
  foo: 1,
  get bar() {
    return this.foo;
  },
};
const obj = reactive(data);

effect(() => {
  for (let key in obj) {
    console.log(`key:`, key);
  }
});

obj.name = 90

// obj.foo = 90

// effect(() => {
//   console.log("foo" in obj, "被执行了吗？"); // in 操作符对副作用函数进行依赖管理
// });

// delete obj.foo; // 对响应的副作用函数进行依赖管理

// 对象的代理

const p = new Proxy(data, {
  get(target, key, receiver) {
    console.log("你好");
    return Reflect.get(target, key, receiver);
  },
  ownKeys(target) {
    const res = Reflect.ownKeys(target);
    console.log("获取属性", res);
    return res;
  },
  deleteProperty(target, key) {
    return Reflect.deleteProperty(target, key);
  },
  has(target, prop) {
    return Reflect.has(target, prop);
  },
});

// for (let key in p) {
//   console.log(`key:`, key);
// }
