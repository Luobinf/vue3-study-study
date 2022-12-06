function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isEqual(val1, val2) {
	return Object.is(val1, val2)
}

function isObject(source) {
	return Object.prototype.toString.call(source) === '[object Object]'
}

module.exports = {
  hasOwn,
	isEqual,
	isObject
};
