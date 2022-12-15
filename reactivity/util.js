const ReactiveFlags = {
  RAW: "__v_raw",
};

// 获取响应式数据的原始数据
function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}

module.exports = {
  ReactiveFlags,
  toRaw,
};
