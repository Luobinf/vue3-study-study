import { reactive, effect } from "../../index";

describe("reactivity/collections", () => {
  describe("Map", () => {
    it("should observe value when map value is object", () => {
      const key = { key: 12 };
      const m = new Set([12, 89,90]);
      const p = reactive(m);
      let count = 0
      effect(() => {
        count += 1
        p.forEach((value, key, m) => {
            console.log(value.size);
        });
      });
      expect(count).toBe(1)
      p.get(key).delete(23);
      expect(count).toBe(2)
    });

    it('should trigger effect when use forEach method', () => {
        const m = new Set([12, 89,90]);
        const p = reactive(m);
        let count = 0
        effect(() => {
          count += 1
          p.forEach((value, key, m) => {
            console.log(value);
          });
        });
        expect(count).toBe(1)
        
        p.set(12)

        expect(count).toBe(2)
    })

    it('should trigger effect when use entries method', () => {
        const m = new Set([12, 89,90]);
        const p = reactive(m);
        let count = 0
        effect(() => {
          count += 1
          for(let [key, value] of p.entries()) {
            console.log(key, value);
          }
        });

        // for...of... 迭代，Set 默认使用的是 values方法，Map 默认使用的是 entries 方法。
        expect(count).toBe(1)
        
        p.set(12)

        expect(count).toBe(2)
    })

    it('should trigger effect when use values method', () => {
        const m = new Set([12, 89,90]);
        const p = reactive(m);
        let count = 0
        effect(() => {
          count += 1
          for(let value of p.values()) {
            console.log( value );
          }
        });

        // for...of... 迭代，Set 默认使用的是 values方法，Map 默认使用的是 entries 方法。
        expect(count).toBe(1)
        
        p.set(12)

        expect(count).toBe(2)
    })

    it('should trigger effect when use keys method', () => {
        const m = new Set([12, 89,90]);
        const p = reactive(m);
        let count = 0
        effect(() => {
          count += 1
          for(let key of p.keys()) {
            console.log( key );
          }
        });

        // for...of... 迭代，Set 默认使用的是 values方法，Map 默认使用的是 entries 方法。
        expect(count).toBe(1)
        
        p.add(15)

        expect(count).toBe(2)
    })

  });
});
