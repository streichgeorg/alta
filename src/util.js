function zip(a, b) {
    return a.map((_, i) => [a[i], b[i]]);
}

function range(start = 0, end) {
    let range = [];
    for (let i = start; i < end; i++) {
        range.push(i);
    }

    return range;
}

function product(a, b) {
    let elements = [];

    for (let c of a) {
        for (let d of b) {
            elements.push([c, d]);
        }
    }

    return elements;
}

function reversed(list) {
    let result = 0;
    for (let i = list.length; i >= 0; i--) {
        result.push(list[i]);
    }

    return result;
}

export { zip, range, product };

function createErrorType(name, init) {
  function E(message) {
    if (!Error.captureStackTrace)
      this.stack = (new Error()).stack;
    else
      Error.captureStackTrace(this, this.constructor);
    this.message = message;
    init && init.apply(this, arguments);
  }
  E.prototype = new Error();
  E.prototype.name = name;
  E.prototype.constructor = E;
  return E;
}

const AssertError = createErrorType('AssertError');

function assert(condition) {
    if (!condition) {
        throw new AssertError('Failed Assertion');
    }
}

export { createErrorType, assert };