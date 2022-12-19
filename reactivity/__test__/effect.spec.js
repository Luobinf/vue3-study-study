import { reactive, effect } from "../index";

describe("reactivity/effect", () => {
  describe("effect", () => {
    it("should trigger effect when use for...in ", () => {
      let obj = reactive({
        name: "jack",
        address: "BJ",
      });

      const objSPy = jest.fn();

      effect(() => {
        objSPy();
        for (let key in obj) {
          console.log(key);
        }
      });
      expect(objSPy).toHaveBeenCalledTimes(1);
      obj.name = "john";
      expect(objSPy).toHaveBeenCalledTimes(1);
    });
  });
});
