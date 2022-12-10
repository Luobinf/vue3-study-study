function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function hasChanged(val1, val2) {
	return !Object.is(val1, val2)
}

function isObject(source) {
	return Object.prototype.toString.call(source) === '[object Object]'
}

function isIntegerKey(key) {
	return Number.isInteger(parseInt(key))
}

function isSymbol(source) {
	return Object.prototype.toString.call(source) === '[object Symbol]'
}

module.exports = {
  hasOwn,
	hasChanged,
	isObject,
	isIntegerKey,
	isSymbol
};
