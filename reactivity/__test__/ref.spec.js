import { reactive, effect, ref, isRef, toRef, toRefs } from "../index";
import { shallowRef } from "../ref";

describe("reactivity/ref", () => {
  describe("ref", () => {
    it("should hold a value", () => {
      const a = ref(1);
      expect(a.value).toBe(1);
      a.value = 2;
      expect(a.value).toBe(2);
    });

    it("should be reactive", () => {
      const a = ref(1);
      let dummy;
      let calls = 0;
      effect(() => {
        calls++;
        dummy = a.value;
      });

      expect(calls).toBe(1);
      expect(dummy).toBe(1);
      a.value = 2;
      expect(calls).toBe(2);
      expect(dummy).toBe(2);

      // same value should not trigger
      a.value = 2;
      expect(calls).toBe(2);
    });

    it("should make nested properties reactive", () => {
      const a = ref({
        count: 1,
      });
      let dummy;
      effect(() => {
        dummy = a.value.count;
      });
      expect(dummy).toBe(1);
      a.value.count = 2;
      expect(dummy).toBe(2);
    });

    it("should work without initial value", () => {
      const a = ref();
      let dummy;
      effect(() => {
        dummy = a.value;
      });
      expect(dummy).toBe(undefined);
      a.value = 2;
      expect(dummy).toBe(2);
    });

    it('should work like a normal property when nested in a reactive object', () => {
        const a = ref(1)
        const obj = reactive({
          a,
          b: {
            c: a
          }
        })
    
        let dummy1
        let dummy2
    
        effect(() => {
          dummy1 = obj.a
          dummy2 = obj.b.c
        })
    
        const assertDummiesEqualTo = (val) =>
          [dummy1, dummy2].forEach(dummy => expect(dummy).toBe(val))
    
        assertDummiesEqualTo(1)
        a.value++
        assertDummiesEqualTo(2)
        obj.a++
        assertDummiesEqualTo(3)
        obj.b.c++
        assertDummiesEqualTo(4)
      })



    it("should", () => {
      const count = ref(12);

      effect(() => {
        console.log(count.value++);
      });

      count.value++;

      const a = isRef(count);
      expect(a).toBe(true);
    });

    it("解构带来的响应丢失问题", () => {
      const obj = reactive({
        age: 90,
      });

      const newObj = {
        ...obj,
      };

      effect(() => {
        console.log(newObj.age);
      });

      obj.age = 1;

      // 理论上来说，我们希望应该触发副作用函数，但是实际上副作用函数没触发，newObj.age 的值还是 90
      expect(newObj.age).toBe(90);
    });

    it("解构带来的响应丢失问题", () => {
      const obj = reactive({
        age: 90,
      });

      const newObj = {
        age: {
          get value() {
            return obj.age;
          },
        },
      };

      effect(() => {
        console.log(newObj.age.value);
      });

      obj.age = 1;

      expect(newObj.age.value).toBe(1);

      const x = {
        ...toRefs(obj),
      };
      console.log(x);
    });

    it("toRef包裹之后的对象可以设置对象属性值", () => {
      const obj = reactive({
        age: 90,
      });
      const refAge = toRef(obj, "age");
      refAge.value = 78;
    });

    it("自动脱Ref", () => {
      const obj = reactive({
        age: 90,
      });
      const refAge = toRef(obj, "age");
      refAge.value = 78;
    });

    it("test", () => {
      const state = reactive({
        foo: 1,
        bar: 2,
      });

      const fooRef = toRef(state, "foo");

      // 更改该 ref 会更新源属性
      fooRef.value++;
      console.log(state.foo); // 2

      // 更改源属性也会更新该 ref
      state.foo++;
      console.log(fooRef.value); // 3
    });

    it('test', () => {
      const shallowArray = shallowRef([
        1,2,3,4,5,6
      ])

     let dummy = 0
      effect(() => {
        dummy += 1
        console.log(shallowArray.value)
      })

      expect(dummy).toBe(1)

      // 不会触发响应式更新 
      shallowArray.value.push(90)

      // 不会触发响应式更新
      shallowArray.value[0] = 90
    
    //  触发了响应式更新
      shallowArray.value = [] // 触发了无限递归循环问题

      expect(dummy).toBe(2)

    })
    
  });
});
