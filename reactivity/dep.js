function createDep(effects) {
  const dep = new Set(effects);
  return dep;
}

module.exports = {
  createDep,
};
