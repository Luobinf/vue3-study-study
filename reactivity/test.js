
const { reactive, effect } = require("./index");

// const { reactive, effect } = require("@vue/reactivity");


// test======
const m = new Set()
const p1 = reactive(m)
const p2 = reactive( new Set([12]) )

p1.add(p2)

effect(() => {
	// 通过原始数据 m 访问 p2
	m.forEach(item => {
		console.log(item.size)
	})
})

debugger
// 通过原始数据 m 设置 p2, 但是副作用函数仍然会执行，理论上来说不应该去执行
m.forEach(item => {
	item.delete(12)
})



// test======
// const m = new Set()
// const p1 = reactive(m)
// const p2 = reactive( new Set([12]) )

// p1.add(p2)

// effect(() => {
// 	// 通过原始数据 m 访问 p2
// 	m.forEach(item => {
// 		console.log(item.size)
// 	})
// })

// debugger
// // 通过原始数据 m 设置 p2, 但是副作用函数仍然会执行，理论上来说不应该去执行
// m.forEach(item => {
// 	item.add(9999)
// })



// test======
// const m = new Map()
// const p1 = reactive(m)
// const p2 = reactive( new Map() )

// p1.set('p2', p2)

// effect(() => {
// 	// 通过原始数据 m 访问 p2
// 	console.log(m.get('p2').size)
// })

// // 通过原始数据 m 设置 p2, 但是副作用函数仍然会执行，理论上来说不应该去执行
// m.get('p2').set('foo', 1)


// test======
// const p = reactive(new Map([['key', 1]]))

// effect(() => {
// 	// console.log(p.get('key'))
// 	console.log(p.size)
// })

// p.set('key2', 2)



// const s = new Set([90])
// const p = reactive(s)


// effect(() => {
// 	console.log(p.size)
// })

// p.add(900)

// console.log(p.size)


// const arr = reactive([])
// effect(() => {s
// 	console.log(arr[0])
// })
// arr.push(1)
// arr.length = 90
// effect(() => {
// 	arr.push(1)
// })


// const obj = {}

// const arr = reactive([obj])

// console.log( arr.includes(arr[0]) ) // 得到的是 false，为啥不是 true？因为 arr 是一个嵌套对象，通过 arr.includes 返回 arr[0] 的时候获取的代理对象与单独通过 arr[0] 的时候获取返回的是一个新的 proxy 对象。 p.125

// console.log( arr.includes( obj ) ) // false

// const list = reactive([23,90])

// test
// effect(() => {
// 	for(let val of list) {
// 		console.log(`数据：${val}`)
// 	}
// })


// list[2] = 99 // 添加新元素，影响了 for in 循环的遍历操作


// test
// effect(() => {
// 	for(let key in list) {
// 		console.log(`数据：${list[key]}`)
// 	}
// })

// list[2] = 99 // 添加新元素，影响了 for in 循环的遍历操作
// list.length = 0 // 修改数组长度，影响了 for in 循环的遍历操作

// 以上本质上都是修改了数组的length属性，那么只要使用 length 去建立响应联系即可。


// test
// effect(() => {
// 	console.log(list.length)
// })

// list[2] = 99 // 修改数组属性可能会隐式的修改数组长度


// test
// effect(() => {
// 	console.log(list[0])
// })

// list.length = 0 // 修改数组长度可能会隐式的修改数组属性值



// const data = {
//   foo: 1,
//   get bar() {
//     return this.foo;
//   },
// };
// const obj = reactive(data);

// 增加一个对象本身不存在的属性时的拦截？
// effect(() => {
//   for (let key in obj) {
//     console.log(`key:`, key);
//   }
// });

// obj.name = 90;

// 更新对象属性值时不应该执行上述的 effect
// obj.foo = 90

// effect(() => {
//   for (let key in obj) {
//     console.log(`key:`, key);
//   }
// });

// delete obj.foo // 删除属性，上述副作用函数应该重新执行。


// effect(() => {
//   console.log("foo" in obj, "被执行了吗？"); // in 操作符对副作用函数进行依赖管理
// });

// delete obj.foo; // 对响应的副作用函数进行依赖管理

// 对象的代理

// var obj1 = {

// }

// var obj2 = {
// 	name: '23'
// }

// const child = reactive(obj1)
// const parent = reactive(obj2)

// Object.setPrototypeOf(child, parent)

// effect(() => {
// 	console.log(child.name)
// })

// child.name = 90