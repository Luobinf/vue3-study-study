function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isEqual(val1, val2) {
	return Object.is(val1, val2)
}

module.exports = {
  hasOwn,
	isEqual
};
