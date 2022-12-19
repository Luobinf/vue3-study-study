function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function hasChanged(val1, val2) {
  return !Object.is(val1, val2);
}

function isObject(source) {
  return typeof source === 'object' && source !== null;
}

function isIntegerKey(key) {
  return Number.isInteger(parseInt(key));
}

function isSymbol(source) {
  return Object.prototype.toString.call(source) === "[object Symbol]";
}

function toRawType(source) {
  return Object.prototype.toString.call(source).slice(8, -1);
}

const extend = Object.assign;

function isArray(source) {
	return Array.isArray(source)
}

function isMap(source) {
  return Object.prototype.toString.call(source) === "[object Map]";
}

export {
  hasOwn,
  hasChanged,
  isObject,
  isIntegerKey,
  isSymbol,
  toRawType,
  extend,
	isArray,
	isMap
};
