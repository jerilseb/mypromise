var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;

/**
 * Check if a value is a Promise and, if it is,
 * return the `then` method of that promise.
 */
function getThen(value) {
  var t = typeof value;
  if (value && (t === "object" || t === "function")) {
    var then = value.then;
    if (typeof then === "function") {
      return then;
    }
  }
  return null;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(
      value => {
        if (done) return;
        done = true;
        onFulfilled(value);
      },
      reason => {
        if (done) return;
        done = true;
        onRejected(reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    onRejected(ex);
  }
}

module.exports = function MyPromise(fn) {
  // store state which can be PENDING, FULFILLED or REJECTED
  var _self = this;
  _self.state = PENDING;

  // store value once FULFILLED or REJECTED
  var value = null;

  // store sucess & failure handlers
  var handlers = [];

  function fulfill(result) {
    _self.state = FULFILLED;
    value = result;
    handlers.forEach(({ onFulfilled }) => {
      onFulfilled(value);
    });
    handlers = null;
  }

  function reject(error) {
    _self.state = REJECTED;
    value = error;
    handlers.forEach(({ onRejected }) => {
      onRejected(value);
    });
    handlers = null;
  }

  function resolve(result) {
    try {
      var then = getThen(result);
      if (then) {
        doResolve(then.bind(result), resolve, reject);
        return;
      }
      fulfill(result);
    } catch (e) {
      reject(e);
    }
  }

  this.done = (onFulfilled, onRejected) => {
    if (_self.state === PENDING) {
      handlers.push({ onFulfilled, onRejected });
    } else {
      if (_self.state === FULFILLED) {
        onFulfilled(value);
      }
      if (_self.state === REJECTED) {
        onRejected(value);
      }
    }
  };

  this.then = function(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      return this.done(
        function(result) {
          if (typeof onFulfilled === "function") {
            try {
              return resolve(onFulfilled(result));
            } catch (ex) {
              return reject(ex);
            }
          } else {
            return resolve(result);
          }
        },
        function(error) {
          if (typeof onRejected === "function") {
            try {
              return resolve(onRejected(error));
            } catch (ex) {
              return reject(ex);
            }
          } else {
            return reject(error);
          }
        }
      );
    });
  };

  doResolve(fn, resolve, reject);
};
