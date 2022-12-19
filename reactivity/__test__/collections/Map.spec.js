import { reactive, effect } from "../../index";

describe("reactivity/collections", () => {
  describe("Map", () => {
    it("should observe value when map value is object", () => {
      const key = { key: 12 };
      const m = new Map([[key, new Set([23, 34])]]);
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

    it('should trigger effect when use set method', () => {
        const m = new Map([['key', new Set([23, 34])]]);
        const p = reactive(m);
        let count = 0
        effect(() => {
          count += 1
          p.forEach((value, key, m) => {
              console.log(value);
          });
        });
        expect(count).toBe(1)
        
        p.set('key', 12)

        expect(count).toBe(2)
    })
  });
});
