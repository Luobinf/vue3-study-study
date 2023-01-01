import { reactive, effect, ref, isRef, toRef, toRefs } from "../index";
import { toRaw } from "../reactive";
import { shallowRef } from "../ref";

describe("reactivity/reactive", () => {
  describe("reactive", () => {
    it("when original obj used to be reactive more times, toRaw api can get the original obj", () => {
      const obj = {
        foo: 12
      }  
      let a = reactive(obj)
      let b = reactive(a)

      expect(toRaw(b)).toBe(obj)

    });
    
  });
});
