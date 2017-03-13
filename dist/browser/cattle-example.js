(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// bases.js
// Utility for converting numbers to/from different bases/alphabets.
// See README.md for details.

var bases = (typeof exports !== 'undefined' ? exports : (window.Bases = {}));

// Returns a string representation of the given number for the given alphabet:
bases.toAlphabet = function (num, alphabet) {
    var base = alphabet.length;
    var digits = [];    // these will be in reverse order since arrays are stacks

    // execute at least once, even if num is 0, since we should return the '0':
    do {
        digits.push(num % base);    // TODO handle negatives properly?
        num = Math.floor(num / base);
    } while (num > 0);

    var chars = [];
    while (digits.length) {
        chars.push(alphabet[digits.pop()]);
    }
    return chars.join('');
};

// Returns an integer representation of the given string for the given alphabet:
bases.fromAlphabet = function (str, alphabet) {
    var base = alphabet.length;
    var pos = 0;
    var num = 0;
    var c;

    while (str.length) {
        c = str[str.length - 1];
        str = str.substr(0, str.length - 1);
        num += Math.pow(base, pos) * alphabet.indexOf(c);
        pos++;
    }

    return num;
};

// Known alphabets:
bases.NUMERALS = '0123456789';
bases.LETTERS_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
bases.LETTERS_UPPERCASE = bases.LETTERS_LOWERCASE.toUpperCase();
bases.KNOWN_ALPHABETS = {};

// Each of the number ones, starting from base-2 (base-1 doesn't make sense?):
for (var i = 2; i <= 10; i++) {
    bases.KNOWN_ALPHABETS[i] = bases.NUMERALS.substr(0, i);
}

// Node's native hex is 0-9 followed by *lowercase* a-f, so we'll take that
// approach for everything from base-11 to base-16:
for (var i = 11; i <= 16; i++) {
    bases.KNOWN_ALPHABETS[i] = bases.NUMERALS + bases.LETTERS_LOWERCASE.substr(0, i - 10);
}

// We also model base-36 off of that, just using the full letter alphabet:
bases.KNOWN_ALPHABETS[36] = bases.NUMERALS + bases.LETTERS_LOWERCASE;

// And base-62 will be the uppercase letters added:
bases.KNOWN_ALPHABETS[62] = bases.NUMERALS + bases.LETTERS_LOWERCASE + bases.LETTERS_UPPERCASE;

// For base-26, we'll assume the user wants just the letter alphabet:
bases.KNOWN_ALPHABETS[26] = bases.LETTERS_LOWERCASE;

// We'll also add a similar base-52, just letters, lowercase then uppercase:
bases.KNOWN_ALPHABETS[52] = bases.LETTERS_LOWERCASE + bases.LETTERS_UPPERCASE;

// Base-64 is a formally-specified alphabet that has a particular order:
// http://en.wikipedia.org/wiki/Base64 (and Node.js follows this too)
// TODO FIXME But our code above doesn't add padding! Don't use this yet...
bases.KNOWN_ALPHABETS[64] = bases.LETTERS_UPPERCASE + bases.LETTERS_LOWERCASE + bases.NUMERALS + '+/';

// Flickr and others also have a base-58 that removes confusing characters, but
// there isn't consensus on the order of lowercase vs. uppercase... =/
// http://www.flickr.com/groups/api/discuss/72157616713786392/
// https://en.bitcoin.it/wiki/Base58Check_encoding#Base58_symbol_chart
// https://github.com/dougal/base58/blob/master/lib/base58.rb
// http://icoloma.blogspot.com/2010/03/create-your-own-bitly-using-base58.html
// We'll arbitrarily stay consistent with the above and using lowercase first:
bases.KNOWN_ALPHABETS[58] = bases.KNOWN_ALPHABETS[62].replace(/[0OlI]/g, '');

// And Douglas Crockford shared a similar base-32 from base-36:
// http://www.crockford.com/wrmg/base32.html
// Unlike our base-36, he explicitly specifies uppercase letters
bases.KNOWN_ALPHABETS[32] = bases.NUMERALS + bases.LETTERS_UPPERCASE.replace(/[ILOU]/g, '');

// Closure helper for convenience aliases like bases.toBase36():
function makeAlias (base, alphabet) {
    bases['toBase' + base] = function (num) {
        return bases.toAlphabet(num, alphabet);
    };
    bases['fromBase' + base] = function (str) {
        return bases.fromAlphabet(str, alphabet);
    };
}

// Do this for all known alphabets:
for (var base in bases.KNOWN_ALPHABETS) {
    if (bases.KNOWN_ALPHABETS.hasOwnProperty(base)) {
        makeAlias(base, bases.KNOWN_ALPHABETS[base]);
    }
}

// And a generic alias too:
bases.toBase = function (num, base) {
    return bases.toAlphabet(num, bases.KNOWN_ALPHABETS[base]);
};

bases.fromBase = function (str, base) {
    return bases.fromAlphabet(str, bases.KNOWN_ALPHABETS[base]);
};

},{}],2:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.1.0
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
      GET_THEN_ERROR.error = null;
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":4}],3:[function(require,module,exports){
/*!
	Papa Parse
	v4.1.4
	https://github.com/mholt/PapaParse
*/
(function(root, factory)
{
	if (typeof define === 'function' && define.amd)
	{
		// AMD. Register as an anonymous module.
		define([], factory);
	}
	else if (typeof module === 'object' && module.exports)
	{
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	}
	else
	{
		// Browser globals (root is window)
		root.Papa = factory();
	}
}(this, function()
{
	'use strict';

	var global = (function () {
		// alternative method, similar to `Function('return this')()`
		// but without using `eval` (which is disabled when
		// using Content Security Policy).

		if (typeof self !== 'undefined') { return self; }
		if (typeof window !== 'undefined') { return window; }
		if (typeof global !== 'undefined') { return global; }

        // When running tests none of the above have been defined
        return {};
	})();


	var IS_WORKER = !global.document && !!global.postMessage,
		IS_PAPA_WORKER = IS_WORKER && /(\?|&)papaworker(=|&|$)/.test(global.location.search),
		LOADED_SYNC = false, AUTO_SCRIPT_PATH;
	var workers = {}, workerIdCounter = 0;

	var Papa = {};

	Papa.parse = CsvToJson;
	Papa.unparse = JsonToCsv;

	Papa.RECORD_SEP = String.fromCharCode(30);
	Papa.UNIT_SEP = String.fromCharCode(31);
	Papa.BYTE_ORDER_MARK = '\ufeff';
	Papa.BAD_DELIMITERS = ['\r', '\n', '"', Papa.BYTE_ORDER_MARK];
	Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
	Papa.SCRIPT_PATH = null;	// Must be set by your code if you use workers and this lib is loaded asynchronously

	// Configurable chunk sizes for local and remote files, respectively
	Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
	Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
	Papa.DefaultDelimiter = ',';			// Used if not specified and detection fails

	// Exposed for testing and development only
	Papa.Parser = Parser;
	Papa.ParserHandle = ParserHandle;
	Papa.NetworkStreamer = NetworkStreamer;
	Papa.FileStreamer = FileStreamer;
	Papa.StringStreamer = StringStreamer;

	if (global.jQuery)
	{
		var $ = global.jQuery;
		$.fn.parse = function(options)
		{
			var config = options.config || {};
			var queue = [];

			this.each(function(idx)
			{
				var supported = $(this).prop('tagName').toUpperCase() === 'INPUT'
								&& $(this).attr('type').toLowerCase() === 'file'
								&& global.FileReader;

				if (!supported || !this.files || this.files.length === 0)
					return true;	// continue to next input element

				for (var i = 0; i < this.files.length; i++)
				{
					queue.push({
						file: this.files[i],
						inputElem: this,
						instanceConfig: $.extend({}, config)
					});
				}
			});

			parseNextFile();	// begin parsing
			return this;		// maintains chainability


			function parseNextFile()
			{
				if (queue.length === 0)
				{
					if (isFunction(options.complete))
						options.complete();
					return;
				}

				var f = queue[0];

				if (isFunction(options.before))
				{
					var returned = options.before(f.file, f.inputElem);

					if (typeof returned === 'object')
					{
						if (returned.action === 'abort')
						{
							error('AbortError', f.file, f.inputElem, returned.reason);
							return;	// Aborts all queued files immediately
						}
						else if (returned.action === 'skip')
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
						else if (typeof returned.config === 'object')
							f.instanceConfig = $.extend(f.instanceConfig, returned.config);
					}
					else if (returned === 'skip')
					{
						fileComplete();	// parse the next file in the queue, if any
						return;
					}
				}

				// Wrap up the user's complete callback, if any, so that ours also gets executed
				var userCompleteFunc = f.instanceConfig.complete;
				f.instanceConfig.complete = function(results)
				{
					if (isFunction(userCompleteFunc))
						userCompleteFunc(results, f.file, f.inputElem);
					fileComplete();
				};

				Papa.parse(f.file, f.instanceConfig);
			}

			function error(name, file, elem, reason)
			{
				if (isFunction(options.error))
					options.error({name: name}, file, elem, reason);
			}

			function fileComplete()
			{
				queue.splice(0, 1);
				parseNextFile();
			}
		}
	}


	if (IS_PAPA_WORKER)
	{
		global.onmessage = workerThreadReceivedMessage;
	}
	else if (Papa.WORKERS_SUPPORTED)
	{
		AUTO_SCRIPT_PATH = getScriptPath();

		// Check if the script was loaded synchronously
		if (!document.body)
		{
			// Body doesn't exist yet, must be synchronous
			LOADED_SYNC = true;
		}
		else
		{
			document.addEventListener('DOMContentLoaded', function () {
				LOADED_SYNC = true;
			}, true);
		}
	}




	function CsvToJson(_input, _config)
	{
		_config = _config || {};
		_config.dynamicTyping = _config.dynamicTyping || false;

		if (_config.worker && Papa.WORKERS_SUPPORTED)
		{
			var w = newWorker();

			w.userStep = _config.step;
			w.userChunk = _config.chunk;
			w.userComplete = _config.complete;
			w.userError = _config.error;

			_config.step = isFunction(_config.step);
			_config.chunk = isFunction(_config.chunk);
			_config.complete = isFunction(_config.complete);
			_config.error = isFunction(_config.error);
			delete _config.worker;	// prevent infinite loop

			w.postMessage({
				input: _input,
				config: _config,
				workerId: w.id
			});

			return;
		}

		var streamer = null;
		if (typeof _input === 'string')
		{
			if (_config.download)
				streamer = new NetworkStreamer(_config);
			else
				streamer = new StringStreamer(_config);
		}
		else if ((global.File && _input instanceof File) || _input instanceof Object)	// ...Safari. (see issue #106)
			streamer = new FileStreamer(_config);

		return streamer.stream(_input);
	}






	function JsonToCsv(_input, _config)
	{
		var _output = '';
		var _fields = [];

		// Default configuration

		/** whether to surround every datum with quotes */
		var _quotes = false;

		/** whether to write headers */
		var _writeHeader = true;

		/** delimiting character */
		var _delimiter = ',';

		/** newline character(s) */
		var _newline = '\r\n';

		/** quote character */
		var _quoteChar = '"';

		unpackConfig();

		var quoteCharRegex = new RegExp(_quoteChar, 'g');

		if (typeof _input === 'string')
			_input = JSON.parse(_input);

		if (_input instanceof Array)
		{
			if (!_input.length || _input[0] instanceof Array)
				return serialize(null, _input);
			else if (typeof _input[0] === 'object')
				return serialize(objectKeys(_input[0]), _input);
		}
		else if (typeof _input === 'object')
		{
			if (typeof _input.data === 'string')
				_input.data = JSON.parse(_input.data);

			if (_input.data instanceof Array)
			{
				if (!_input.fields)
					_input.fields =  _input.meta && _input.meta.fields;

				if (!_input.fields)
					_input.fields =  _input.data[0] instanceof Array
									? _input.fields
									: objectKeys(_input.data[0]);

				if (!(_input.data[0] instanceof Array) && typeof _input.data[0] !== 'object')
					_input.data = [_input.data];	// handles input like [1,2,3] or ['asdf']
			}

			return serialize(_input.fields || [], _input.data || []);
		}

		// Default (any valid paths should return before this)
		throw 'exception: Unable to serialize unrecognized input';


		function unpackConfig()
		{
			if (typeof _config !== 'object')
				return;

			if (typeof _config.delimiter === 'string'
				&& _config.delimiter.length === 1
				&& Papa.BAD_DELIMITERS.indexOf(_config.delimiter) === -1)
			{
				_delimiter = _config.delimiter;
			}

			if (typeof _config.quotes === 'boolean'
				|| _config.quotes instanceof Array)
				_quotes = _config.quotes;

			if (typeof _config.newline === 'string')
				_newline = _config.newline;

			if (typeof _config.quoteChar === 'string')
				_quoteChar = _config.quoteChar;

			if (typeof _config.header === 'boolean')
				_writeHeader = _config.header;
		}


		/** Turns an object's keys into an array */
		function objectKeys(obj)
		{
			if (typeof obj !== 'object')
				return [];
			var keys = [];
			for (var key in obj)
				keys.push(key);
			return keys;
		}

		/** The double for loop that iterates the data and writes out a CSV string including header row */
		function serialize(fields, data)
		{
			var csv = '';

			if (typeof fields === 'string')
				fields = JSON.parse(fields);
			if (typeof data === 'string')
				data = JSON.parse(data);

			var hasHeader = fields instanceof Array && fields.length > 0;
			var dataKeyedByField = !(data[0] instanceof Array);

			// If there a header row, write it first
			if (hasHeader && _writeHeader)
			{
				for (var i = 0; i < fields.length; i++)
				{
					if (i > 0)
						csv += _delimiter;
					csv += safe(fields[i], i);
				}
				if (data.length > 0)
					csv += _newline;
			}

			// Then write out the data
			for (var row = 0; row < data.length; row++)
			{
				var maxCol = hasHeader ? fields.length : data[row].length;

				for (var col = 0; col < maxCol; col++)
				{
					if (col > 0)
						csv += _delimiter;
					var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
					csv += safe(data[row][colIdx], col);
				}

				if (row < data.length - 1)
					csv += _newline;
			}

			return csv;
		}

		/** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
		function safe(str, col)
		{
			if (typeof str === 'undefined' || str === null)
				return '';

			str = str.toString().replace(quoteCharRegex, _quoteChar+_quoteChar);

			var needsQuotes = (typeof _quotes === 'boolean' && _quotes)
							|| (_quotes instanceof Array && _quotes[col])
							|| hasAny(str, Papa.BAD_DELIMITERS)
							|| str.indexOf(_delimiter) > -1
							|| str.charAt(0) === ' '
							|| str.charAt(str.length - 1) === ' ';

			return needsQuotes ? _quoteChar + str + _quoteChar : str;
		}

		function hasAny(str, substrings)
		{
			for (var i = 0; i < substrings.length; i++)
				if (str.indexOf(substrings[i]) > -1)
					return true;
			return false;
		}
	}

	/** ChunkStreamer is the base prototype for various streamer implementations. */
	function ChunkStreamer(config)
	{
		this._handle = null;
		this._paused = false;
		this._finished = false;
		this._input = null;
		this._baseIndex = 0;
		this._partialLine = '';
		this._rowCount = 0;
		this._start = 0;
		this._nextChunk = null;
		this.isFirstChunk = true;
		this._completeResults = {
			data: [],
			errors: [],
			meta: {}
		};
		replaceConfig.call(this, config);

		this.parseChunk = function(chunk)
		{
			// First chunk pre-processing
			if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk))
			{
				var modifiedChunk = this._config.beforeFirstChunk(chunk);
				if (modifiedChunk !== undefined)
					chunk = modifiedChunk;
			}
			this.isFirstChunk = false;

			// Rejoin the line we likely just split in two by chunking the file
			var aggregate = this._partialLine + chunk;
			this._partialLine = '';

			var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);

			if (this._handle.paused() || this._handle.aborted())
				return;

			var lastIndex = results.meta.cursor;

			if (!this._finished)
			{
				this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
				this._baseIndex = lastIndex;
			}

			if (results && results.data)
				this._rowCount += results.data.length;

			var finishedIncludingPreview = this._finished || (this._config.preview && this._rowCount >= this._config.preview);

			if (IS_PAPA_WORKER)
			{
				global.postMessage({
					results: results,
					workerId: Papa.WORKER_ID,
					finished: finishedIncludingPreview
				});
			}
			else if (isFunction(this._config.chunk))
			{
				this._config.chunk(results, this._handle);
				if (this._paused)
					return;
				results = undefined;
				this._completeResults = undefined;
			}

			if (!this._config.step && !this._config.chunk) {
				this._completeResults.data = this._completeResults.data.concat(results.data);
				this._completeResults.errors = this._completeResults.errors.concat(results.errors);
				this._completeResults.meta = results.meta;
			}

			if (finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted))
				this._config.complete(this._completeResults, this._input);

			if (!finishedIncludingPreview && (!results || !results.meta.paused))
				this._nextChunk();

			return results;
		};

		this._sendError = function(error)
		{
			if (isFunction(this._config.error))
				this._config.error(error);
			else if (IS_PAPA_WORKER && this._config.error)
			{
				global.postMessage({
					workerId: Papa.WORKER_ID,
					error: error,
					finished: false
				});
			}
		};

		function replaceConfig(config)
		{
			// Deep-copy the config so we can edit it
			var configCopy = copy(config);
			configCopy.chunkSize = parseInt(configCopy.chunkSize);	// parseInt VERY important so we don't concatenate strings!
			if (!config.step && !config.chunk)
				configCopy.chunkSize = null;  // disable Range header if not streaming; bad values break IIS - see issue #196
			this._handle = new ParserHandle(configCopy);
			this._handle.streamer = this;
			this._config = configCopy;	// persist the copy to the caller
		}
	}


	function NetworkStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.RemoteChunkSize;
		ChunkStreamer.call(this, config);

		var xhr;

		if (IS_WORKER)
		{
			this._nextChunk = function()
			{
				this._readChunk();
				this._chunkLoaded();
			};
		}
		else
		{
			this._nextChunk = function()
			{
				this._readChunk();
			};
		}

		this.stream = function(url)
		{
			this._input = url;
			this._nextChunk();	// Starts streaming
		};

		this._readChunk = function()
		{
			if (this._finished)
			{
				this._chunkLoaded();
				return;
			}

			xhr = new XMLHttpRequest();

			if (this._config.withCredentials)
			{
				xhr.withCredentials = this._config.withCredentials;
			}

			if (!IS_WORKER)
			{
				xhr.onload = bindFunction(this._chunkLoaded, this);
				xhr.onerror = bindFunction(this._chunkError, this);
			}

			xhr.open('GET', this._input, !IS_WORKER);

			if (this._config.chunkSize)
			{
				var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
				xhr.setRequestHeader('Range', 'bytes='+this._start+'-'+end);
				xhr.setRequestHeader('If-None-Match', 'webkit-no-cache'); // https://bugs.webkit.org/show_bug.cgi?id=82672
			}

			try {
				xhr.send();
			}
			catch (err) {
				this._chunkError(err.message);
			}

			if (IS_WORKER && xhr.status === 0)
				this._chunkError();
			else
				this._start += this._config.chunkSize;
		}

		this._chunkLoaded = function()
		{
			if (xhr.readyState != 4)
				return;

			if (xhr.status < 200 || xhr.status >= 400)
			{
				this._chunkError();
				return;
			}

			this._finished = !this._config.chunkSize || this._start > getFileSize(xhr);
			this.parseChunk(xhr.responseText);
		}

		this._chunkError = function(errorMessage)
		{
			var errorText = xhr.statusText || errorMessage;
			this._sendError(errorText);
		}

		function getFileSize(xhr)
		{
			var contentRange = xhr.getResponseHeader('Content-Range');
			if (contentRange === null) { // no content range, then finish!
        			return -1;
            		}
			return parseInt(contentRange.substr(contentRange.lastIndexOf('/') + 1));
		}
	}
	NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
	NetworkStreamer.prototype.constructor = NetworkStreamer;


	function FileStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.LocalChunkSize;
		ChunkStreamer.call(this, config);

		var reader, slice;

		// FileReader is better than FileReaderSync (even in worker) - see http://stackoverflow.com/q/24708649/1048862
		// But Firefox is a pill, too - see issue #76: https://github.com/mholt/PapaParse/issues/76
		var usingAsyncReader = typeof FileReader !== 'undefined';	// Safari doesn't consider it a function - see issue #105

		this.stream = function(file)
		{
			this._input = file;
			slice = file.slice || file.webkitSlice || file.mozSlice;

			if (usingAsyncReader)
			{
				reader = new FileReader();		// Preferred method of reading files, even in workers
				reader.onload = bindFunction(this._chunkLoaded, this);
				reader.onerror = bindFunction(this._chunkError, this);
			}
			else
				reader = new FileReaderSync();	// Hack for running in a web worker in Firefox

			this._nextChunk();	// Starts streaming
		};

		this._nextChunk = function()
		{
			if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
				this._readChunk();
		}

		this._readChunk = function()
		{
			var input = this._input;
			if (this._config.chunkSize)
			{
				var end = Math.min(this._start + this._config.chunkSize, this._input.size);
				input = slice.call(input, this._start, end);
			}
			var txt = reader.readAsText(input, this._config.encoding);
			if (!usingAsyncReader)
				this._chunkLoaded({ target: { result: txt } });	// mimic the async signature
		}

		this._chunkLoaded = function(event)
		{
			// Very important to increment start each time before handling results
			this._start += this._config.chunkSize;
			this._finished = !this._config.chunkSize || this._start >= this._input.size;
			this.parseChunk(event.target.result);
		}

		this._chunkError = function()
		{
			this._sendError(reader.error);
		}

	}
	FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
	FileStreamer.prototype.constructor = FileStreamer;


	function StringStreamer(config)
	{
		config = config || {};
		ChunkStreamer.call(this, config);

		var string;
		var remaining;
		this.stream = function(s)
		{
			string = s;
			remaining = s;
			return this._nextChunk();
		}
		this._nextChunk = function()
		{
			if (this._finished) return;
			var size = this._config.chunkSize;
			var chunk = size ? remaining.substr(0, size) : remaining;
			remaining = size ? remaining.substr(size) : '';
			this._finished = !remaining;
			return this.parseChunk(chunk);
		}
	}
	StringStreamer.prototype = Object.create(StringStreamer.prototype);
	StringStreamer.prototype.constructor = StringStreamer;



	// Use one ParserHandle per entire CSV file or string
	function ParserHandle(_config)
	{
		// One goal is to minimize the use of regular expressions...
		var FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;

		var self = this;
		var _stepCounter = 0;	// Number of times step was called (number of rows parsed)
		var _input;				// The input being parsed
		var _parser;			// The core parser being used
		var _paused = false;	// Whether we are paused or not
		var _aborted = false;   // Whether the parser has aborted or not
		var _delimiterError;	// Temporary state between delimiter detection and processing results
		var _fields = [];		// Fields are from the header row of the input, if there is one
		var _results = {		// The last results returned from the parser
			data: [],
			errors: [],
			meta: {}
		};

		if (isFunction(_config.step))
		{
			var userStep = _config.step;
			_config.step = function(results)
			{
				_results = results;

				if (needsHeaderRow())
					processResults();
				else	// only call user's step function after header row
				{
					processResults();

					// It's possbile that this line was empty and there's no row here after all
					if (_results.data.length === 0)
						return;

					_stepCounter += results.data.length;
					if (_config.preview && _stepCounter > _config.preview)
						_parser.abort();
					else
						userStep(_results, self);
				}
			};
		}

		/**
		 * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
		 * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
		 * when an input comes in multiple chunks, like from a file.
		 */
		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			if (!_config.newline)
				_config.newline = guessLineEndings(input);

			_delimiterError = false;
			if (!_config.delimiter)
			{
				var delimGuess = guessDelimiter(input, _config.newline);
				if (delimGuess.successful)
					_config.delimiter = delimGuess.bestDelimiter;
				else
				{
					_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
					_config.delimiter = Papa.DefaultDelimiter;
				}
				_results.meta.delimiter = _config.delimiter;
			}
			else if(typeof _config.delimiter === 'function')
			{
				_config.delimiter = _config.delimiter(input);
				_results.meta.delimiter = _config.delimiter;
			}

			var parserConfig = copy(_config);
			if (_config.preview && _config.header)
				parserConfig.preview++;	// to compensate for header row

			_input = input;
			_parser = new Parser(parserConfig);
			_results = _parser.parse(_input, baseIndex, ignoreLastRow);
			processResults();
			return _paused ? { meta: { paused: true } } : (_results || { meta: { paused: false } });
		};

		this.paused = function()
		{
			return _paused;
		};

		this.pause = function()
		{
			_paused = true;
			_parser.abort();
			_input = _input.substr(_parser.getCharIndex());
		};

		this.resume = function()
		{
			_paused = false;
			self.streamer.parseChunk(_input);
		};

		this.aborted = function ()
		{
			return _aborted;
		};

		this.abort = function()
		{
			_aborted = true;
			_parser.abort();
			_results.meta.aborted = true;
			if (isFunction(_config.complete))
				_config.complete(_results);
			_input = '';
		};

		function processResults()
		{
			if (_results && _delimiterError)
			{
				addError('Delimiter', 'UndetectableDelimiter', 'Unable to auto-detect delimiting character; defaulted to \''+Papa.DefaultDelimiter+'\'');
				_delimiterError = false;
			}

			if (_config.skipEmptyLines)
			{
				for (var i = 0; i < _results.data.length; i++)
					if (_results.data[i].length === 1 && _results.data[i][0] === '')
						_results.data.splice(i--, 1);
			}

			if (needsHeaderRow())
				fillHeaderFields();

			return applyHeaderAndDynamicTyping();
		}

		function needsHeaderRow()
		{
			return _config.header && _fields.length === 0;
		}

		function fillHeaderFields()
		{
			if (!_results)
				return;
			for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
				for (var j = 0; j < _results.data[i].length; j++)
					_fields.push(_results.data[i][j]);
			_results.data.splice(0, 1);
		}

		function parseDynamic(field, value)
		{
			if ((_config.dynamicTyping[field] || _config.dynamicTyping) === true)
			{
				if (value === 'true' || value === 'TRUE')
					return true;
				else if (value === 'false' || value === 'FALSE')
					return false;
				else
					return tryParseFloat(value);
			}
			return value;
		}

		function applyHeaderAndDynamicTyping()
		{
			if (!_results || (!_config.header && !_config.dynamicTyping))
				return _results;

			for (var i = 0; i < _results.data.length; i++)
			{
				var row = _config.header ? {} : [];

				for (var j = 0; j < _results.data[i].length; j++)
				{
					var field = j;
					var value = _results.data[i][j];

					if (_config.header)
						field = j >= _fields.length ? '__parsed_extra' : _fields[j];

					value = parseDynamic(field, value);

					if (field === '__parsed_extra')
					{
						row[field] = row[field] || [];
						row[field].push(value);
					}
					else
						row[field] = value;
				}

				_results.data[i] = row;

				if (_config.header)
				{
					if (j > _fields.length)
						addError('FieldMismatch', 'TooManyFields', 'Too many fields: expected ' + _fields.length + ' fields but parsed ' + j, i);
					else if (j < _fields.length)
						addError('FieldMismatch', 'TooFewFields', 'Too few fields: expected ' + _fields.length + ' fields but parsed ' + j, i);
				}
			}

			if (_config.header && _results.meta)
				_results.meta.fields = _fields;
			return _results;
		}

		function guessDelimiter(input, newline)
		{
			var delimChoices = [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP];
			var bestDelim, bestDelta, fieldCountPrevRow;

			for (var i = 0; i < delimChoices.length; i++)
			{
				var delim = delimChoices[i];
				var delta = 0, avgFieldCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					delimiter: delim,
					newline: newline,
					preview: 10
				}).parse(input);

				for (var j = 0; j < preview.data.length; j++)
				{
					var fieldCount = preview.data[j].length;
					avgFieldCount += fieldCount;

					if (typeof fieldCountPrevRow === 'undefined')
					{
						fieldCountPrevRow = fieldCount;
						continue;
					}
					else if (fieldCount > 1)
					{
						delta += Math.abs(fieldCount - fieldCountPrevRow);
						fieldCountPrevRow = fieldCount;
					}
				}

				if (preview.data.length > 0)
					avgFieldCount /= preview.data.length;

				if ((typeof bestDelta === 'undefined' || delta < bestDelta)
					&& avgFieldCount > 1.99)
				{
					bestDelta = delta;
					bestDelim = delim;
				}
			}

			_config.delimiter = bestDelim;

			return {
				successful: !!bestDelim,
				bestDelimiter: bestDelim
			}
		}

		function guessLineEndings(input)
		{
			input = input.substr(0, 1024*1024);	// max length 1 MB

			var r = input.split('\r');

			var n = input.split('\n');

			var nAppearsFirst = (n.length > 1 && n[0].length < r[0].length);

			if (r.length === 1 || nAppearsFirst)
				return '\n';

			var numWithN = 0;
			for (var i = 0; i < r.length; i++)
			{
				if (r[i][0] === '\n')
					numWithN++;
			}

			return numWithN >= r.length / 2 ? '\r\n' : '\r';
		}

		function tryParseFloat(val)
		{
			var isNumber = FLOAT.test(val);
			return isNumber ? parseFloat(val) : val;
		}

		function addError(type, code, msg, row)
		{
			_results.errors.push({
				type: type,
				code: code,
				message: msg,
				row: row
			});
		}
	}





	/** The core parser implements speedy and correct CSV parsing */
	function Parser(config)
	{
		// Unpack the config object
		config = config || {};
		var delim = config.delimiter;
		var newline = config.newline;
		var comments = config.comments;
		var step = config.step;
		var preview = config.preview;
		var fastMode = config.fastMode;
		var quoteChar = config.quoteChar || '"';

		// Delimiter must be valid
		if (typeof delim !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
			delim = ',';

		// Comment character must be valid
		if (comments === delim)
			throw 'Comment character same as delimiter';
		else if (comments === true)
			comments = '#';
		else if (typeof comments !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(comments) > -1)
			comments = false;

		// Newline must be valid: \r, \n, or \r\n
		if (newline != '\n' && newline != '\r' && newline != '\r\n')
			newline = '\n';

		// We're gonna need these at the Parser scope
		var cursor = 0;
		var aborted = false;

		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			// For some reason, in Chrome, this speeds things up (!?)
			if (typeof input !== 'string')
				throw 'Input must be a string';

			// We don't need to compute some of these every time parse() is called,
			// but having them in a more local scope seems to perform better
			var inputLen = input.length,
				delimLen = delim.length,
				newlineLen = newline.length,
				commentsLen = comments.length;
			var stepIsFunction = typeof step === 'function';

			// Establish starting state
			cursor = 0;
			var data = [], errors = [], row = [], lastCursor = 0;

			if (!input)
				return returnable();

			if (fastMode || (fastMode !== false && input.indexOf(quoteChar) === -1))
			{
				var rows = input.split(newline);
				for (var i = 0; i < rows.length; i++)
				{
					var row = rows[i];
					cursor += row.length;
					if (i !== rows.length - 1)
						cursor += newline.length;
					else if (ignoreLastRow)
						return returnable();
					if (comments && row.substr(0, commentsLen) === comments)
						continue;
					if (stepIsFunction)
					{
						data = [];
						pushRow(row.split(delim));
						doStep();
						if (aborted)
							return returnable();
					}
					else
						pushRow(row.split(delim));
					if (preview && i >= preview)
					{
						data = data.slice(0, preview);
						return returnable(true);
					}
				}
				return returnable();
			}

			var nextDelim = input.indexOf(delim, cursor);
			var nextNewline = input.indexOf(newline, cursor);
			var quoteCharRegex = new RegExp(quoteChar+quoteChar, 'g');

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] === quoteChar)
				{
					// Start our search for the closing quote where the cursor is
					var quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						var quoteSearch = input.indexOf(quoteChar, quoteSearch+1);

						if (quoteSearch === -1)
						{
							if (!ignoreLastRow) {
								// No closing quote... what a pity
								errors.push({
									type: 'Quotes',
									code: 'MissingQuotes',
									message: 'Quoted field unterminated',
									row: data.length,	// row has yet to be inserted
									index: cursor
								});
							}
							return finish();
						}

						if (quoteSearch === inputLen-1)
						{
							// Closing quote at EOF
							var value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						if (input[quoteSearch+1] === quoteChar)
						{
							quoteSearch++;
							continue;
						}

						if (input[quoteSearch+1] === delim)
						{
							// Closing quote followed by delimiter
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							cursor = quoteSearch + 1 + delimLen;
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						if (input.substr(quoteSearch+1, newlineLen) === newline)
						{
							// Closing quote followed by newline
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							saveRow(quoteSearch + 1 + newlineLen);
							nextDelim = input.indexOf(delim, cursor);	// because we may have skipped the nextDelim in the quoted field

							if (stepIsFunction)
							{
								doStep();
								if (aborted)
									return returnable();
							}

							if (preview && data.length >= preview)
								return returnable(true);

							break;
						}
					}

					continue;
				}

				// Comment found at start of new line
				if (comments && row.length === 0 && input.substr(cursor, commentsLen) === comments)
				{
					if (nextNewline === -1)	// Comment ends at EOF
						return returnable();
					cursor = nextNewline + newlineLen;
					nextNewline = input.indexOf(newline, cursor);
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// Next delimiter comes before next newline, so we've reached end of field
				if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1))
				{
					row.push(input.substring(cursor, nextDelim));
					cursor = nextDelim + delimLen;
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// End of row
				if (nextNewline !== -1)
				{
					row.push(input.substring(cursor, nextNewline));
					saveRow(nextNewline + newlineLen);

					if (stepIsFunction)
					{
						doStep();
						if (aborted)
							return returnable();
					}

					if (preview && data.length >= preview)
						return returnable(true);

					continue;
				}

				break;
			}


			return finish();


			function pushRow(row)
			{
				data.push(row);
				lastCursor = cursor;
			}

			/**
			 * Appends the remaining input from cursor to the end into
			 * row, saves the row, calls step, and returns the results.
			 */
			function finish(value)
			{
				if (ignoreLastRow)
					return returnable();
				if (typeof value === 'undefined')
					value = input.substr(cursor);
				row.push(value);
				cursor = inputLen;	// important in case parsing is paused
				pushRow(row);
				if (stepIsFunction)
					doStep();
				return returnable();
			}

			/**
			 * Appends the current row to the results. It sets the cursor
			 * to newCursor and finds the nextNewline. The caller should
			 * take care to execute user's step function and check for
			 * preview and end parsing if necessary.
			 */
			function saveRow(newCursor)
			{
				cursor = newCursor;
				pushRow(row);
				row = [];
				nextNewline = input.indexOf(newline, cursor);
			}

			/** Returns an object with the results, errors, and meta. */
			function returnable(stopped)
			{
				return {
					data: data,
					errors: errors,
					meta: {
						delimiter: delim,
						linebreak: newline,
						aborted: aborted,
						truncated: !!stopped,
						cursor: lastCursor + (baseIndex || 0)
					}
				};
			}

			/** Executes the user's step function and resets data & errors. */
			function doStep()
			{
				step(returnable());
				data = [], errors = [];
			}
		};

		/** Sets the abort flag */
		this.abort = function()
		{
			aborted = true;
		};

		/** Gets the cursor position */
		this.getCharIndex = function()
		{
			return cursor;
		};
	}


	// If you need to load Papa Parse asynchronously and you also need worker threads, hard-code
	// the script path here. See: https://github.com/mholt/PapaParse/issues/87#issuecomment-57885358
	function getScriptPath()
	{
		var scripts = document.getElementsByTagName('script');
		return scripts.length ? scripts[scripts.length - 1].src : '';
	}

	function newWorker()
	{
		if (!Papa.WORKERS_SUPPORTED)
			return false;
		if (!LOADED_SYNC && Papa.SCRIPT_PATH === null)
			throw new Error(
				'Script path cannot be determined automatically when Papa Parse is loaded asynchronously. ' +
				'You need to set Papa.SCRIPT_PATH manually.'
			);
		var workerUrl = Papa.SCRIPT_PATH || AUTO_SCRIPT_PATH;
		// Append 'papaworker' to the search string to tell papaparse that this is our worker.
		workerUrl += (workerUrl.indexOf('?') !== -1 ? '&' : '?') + 'papaworker';
		var w = new global.Worker(workerUrl);
		w.onmessage = mainThreadReceivedMessage;
		w.id = workerIdCounter++;
		workers[w.id] = w;
		return w;
	}

	/** Callback when main thread receives a message */
	function mainThreadReceivedMessage(e)
	{
		var msg = e.data;
		var worker = workers[msg.workerId];
		var aborted = false;

		if (msg.error)
			worker.userError(msg.error, msg.file);
		else if (msg.results && msg.results.data)
		{
			var abort = function() {
				aborted = true;
				completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
			};

			var handle = {
				abort: abort,
				pause: notImplemented,
				resume: notImplemented
			};

			if (isFunction(worker.userStep))
			{
				for (var i = 0; i < msg.results.data.length; i++)
				{
					worker.userStep({
						data: [msg.results.data[i]],
						errors: msg.results.errors,
						meta: msg.results.meta
					}, handle);
					if (aborted)
						break;
				}
				delete msg.results;	// free memory ASAP
			}
			else if (isFunction(worker.userChunk))
			{
				worker.userChunk(msg.results, handle, msg.file);
				delete msg.results;
			}
		}

		if (msg.finished && !aborted)
			completeWorker(msg.workerId, msg.results);
	}

	function completeWorker(workerId, results) {
		var worker = workers[workerId];
		if (isFunction(worker.userComplete))
			worker.userComplete(results);
		worker.terminate();
		delete workers[workerId];
	}

	function notImplemented() {
		throw 'Not implemented.';
	}

	/** Callback when worker thread receives a message */
	function workerThreadReceivedMessage(e)
	{
		var msg = e.data;

		if (typeof Papa.WORKER_ID === 'undefined' && msg)
			Papa.WORKER_ID = msg.workerId;

		if (typeof msg.input === 'string')
		{
			global.postMessage({
				workerId: Papa.WORKER_ID,
				results: Papa.parse(msg.input, msg.config),
				finished: true
			});
		}
		else if ((global.File && msg.input instanceof File) || msg.input instanceof Object)	// thank you, Safari (see issue #106)
		{
			var results = Papa.parse(msg.input, msg.config);
			if (results)
				global.postMessage({
					workerId: Papa.WORKER_ID,
					results: results,
					finished: true
				});
		}
	}

	/** Makes a deep copy of an array or object (mostly) */
	function copy(obj)
	{
		if (typeof obj !== 'object')
			return obj;
		var cpy = obj instanceof Array ? [] : {};
		for (var key in obj)
			cpy[key] = copy(obj[key]);
		return cpy;
	}

	function bindFunction(f, self)
	{
		return function() { f.apply(self, arguments); };
	}

	function isFunction(func)
	{
		return typeof func === 'function';
	}

	return Papa;
}));

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
/*! tether 1.4.0 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.Tether = factory();
  }
}(this, function(require, exports, module) {

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var TetherBase = undefined;
if (typeof TetherBase === 'undefined') {
  TetherBase = { modules: [] };
}

var zeroElement = null;

// Same as native getBoundingClientRect, except it takes into account parent <frame> offsets
// if the element lies within a nested document (<frame> or <iframe>-like).
function getActualBoundingClientRect(node) {
  var boundingRect = node.getBoundingClientRect();

  // The original object returned by getBoundingClientRect is immutable, so we clone it
  // We can't use extend because the properties are not considered part of the object by hasOwnProperty in IE9
  var rect = {};
  for (var k in boundingRect) {
    rect[k] = boundingRect[k];
  }

  if (node.ownerDocument !== document) {
    var _frameElement = node.ownerDocument.defaultView.frameElement;
    if (_frameElement) {
      var frameRect = getActualBoundingClientRect(_frameElement);
      rect.top += frameRect.top;
      rect.bottom += frameRect.top;
      rect.left += frameRect.left;
      rect.right += frameRect.left;
    }
  }

  return rect;
}

function getScrollParents(el) {
  // In firefox if the el is inside an iframe with display: none; window.getComputedStyle() will return null;
  // https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  var computedStyle = getComputedStyle(el) || {};
  var position = computedStyle.position;
  var parents = [];

  if (position === 'fixed') {
    return [el];
  }

  var parent = el;
  while ((parent = parent.parentNode) && parent && parent.nodeType === 1) {
    var style = undefined;
    try {
      style = getComputedStyle(parent);
    } catch (err) {}

    if (typeof style === 'undefined' || style === null) {
      parents.push(parent);
      return parents;
    }

    var _style = style;
    var overflow = _style.overflow;
    var overflowX = _style.overflowX;
    var overflowY = _style.overflowY;

    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      if (position !== 'absolute' || ['relative', 'absolute', 'fixed'].indexOf(style.position) >= 0) {
        parents.push(parent);
      }
    }
  }

  parents.push(el.ownerDocument.body);

  // If the node is within a frame, account for the parent window scroll
  if (el.ownerDocument !== document) {
    parents.push(el.ownerDocument.defaultView);
  }

  return parents;
}

var uniqueId = (function () {
  var id = 0;
  return function () {
    return ++id;
  };
})();

var zeroPosCache = {};
var getOrigin = function getOrigin() {
  // getBoundingClientRect is unfortunately too accurate.  It introduces a pixel or two of
  // jitter as the user scrolls that messes with our ability to detect if two positions
  // are equivilant or not.  We place an element at the top left of the page that will
  // get the same jitter, so we can cancel the two out.
  var node = zeroElement;
  if (!node || !document.body.contains(node)) {
    node = document.createElement('div');
    node.setAttribute('data-tether-id', uniqueId());
    extend(node.style, {
      top: 0,
      left: 0,
      position: 'absolute'
    });

    document.body.appendChild(node);

    zeroElement = node;
  }

  var id = node.getAttribute('data-tether-id');
  if (typeof zeroPosCache[id] === 'undefined') {
    zeroPosCache[id] = getActualBoundingClientRect(node);

    // Clear the cache when this position call is done
    defer(function () {
      delete zeroPosCache[id];
    });
  }

  return zeroPosCache[id];
};

function removeUtilElements() {
  if (zeroElement) {
    document.body.removeChild(zeroElement);
  }
  zeroElement = null;
};

function getBounds(el) {
  var doc = undefined;
  if (el === document) {
    doc = document;
    el = document.documentElement;
  } else {
    doc = el.ownerDocument;
  }

  var docEl = doc.documentElement;

  var box = getActualBoundingClientRect(el);

  var origin = getOrigin();

  box.top -= origin.top;
  box.left -= origin.left;

  if (typeof box.width === 'undefined') {
    box.width = document.body.scrollWidth - box.left - box.right;
  }
  if (typeof box.height === 'undefined') {
    box.height = document.body.scrollHeight - box.top - box.bottom;
  }

  box.top = box.top - docEl.clientTop;
  box.left = box.left - docEl.clientLeft;
  box.right = doc.body.clientWidth - box.width - box.left;
  box.bottom = doc.body.clientHeight - box.height - box.top;

  return box;
}

function getOffsetParent(el) {
  return el.offsetParent || document.documentElement;
}

var _scrollBarSize = null;
function getScrollBarSize() {
  if (_scrollBarSize) {
    return _scrollBarSize;
  }
  var inner = document.createElement('div');
  inner.style.width = '100%';
  inner.style.height = '200px';

  var outer = document.createElement('div');
  extend(outer.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    width: '200px',
    height: '150px',
    overflow: 'hidden'
  });

  outer.appendChild(inner);

  document.body.appendChild(outer);

  var widthContained = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var widthScroll = inner.offsetWidth;

  if (widthContained === widthScroll) {
    widthScroll = outer.clientWidth;
  }

  document.body.removeChild(outer);

  var width = widthContained - widthScroll;

  _scrollBarSize = { width: width, height: width };
  return _scrollBarSize;
}

function extend() {
  var out = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var args = [];

  Array.prototype.push.apply(args, arguments);

  args.slice(1).forEach(function (obj) {
    if (obj) {
      for (var key in obj) {
        if (({}).hasOwnProperty.call(obj, key)) {
          out[key] = obj[key];
        }
      }
    }
  });

  return out;
}

function removeClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    name.split(' ').forEach(function (cls) {
      if (cls.trim()) {
        el.classList.remove(cls);
      }
    });
  } else {
    var regex = new RegExp('(^| )' + name.split(' ').join('|') + '( |$)', 'gi');
    var className = getClassName(el).replace(regex, ' ');
    setClassName(el, className);
  }
}

function addClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    name.split(' ').forEach(function (cls) {
      if (cls.trim()) {
        el.classList.add(cls);
      }
    });
  } else {
    removeClass(el, name);
    var cls = getClassName(el) + (' ' + name);
    setClassName(el, cls);
  }
}

function hasClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    return el.classList.contains(name);
  }
  var className = getClassName(el);
  return new RegExp('(^| )' + name + '( |$)', 'gi').test(className);
}

function getClassName(el) {
  // Can't use just SVGAnimatedString here since nodes within a Frame in IE have
  // completely separately SVGAnimatedString base classes
  if (el.className instanceof el.ownerDocument.defaultView.SVGAnimatedString) {
    return el.className.baseVal;
  }
  return el.className;
}

function setClassName(el, className) {
  el.setAttribute('class', className);
}

function updateClasses(el, add, all) {
  // Of the set of 'all' classes, we need the 'add' classes, and only the
  // 'add' classes to be set.
  all.forEach(function (cls) {
    if (add.indexOf(cls) === -1 && hasClass(el, cls)) {
      removeClass(el, cls);
    }
  });

  add.forEach(function (cls) {
    if (!hasClass(el, cls)) {
      addClass(el, cls);
    }
  });
}

var deferred = [];

var defer = function defer(fn) {
  deferred.push(fn);
};

var flush = function flush() {
  var fn = undefined;
  while (fn = deferred.pop()) {
    fn();
  }
};

var Evented = (function () {
  function Evented() {
    _classCallCheck(this, Evented);
  }

  _createClass(Evented, [{
    key: 'on',
    value: function on(event, handler, ctx) {
      var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      if (typeof this.bindings === 'undefined') {
        this.bindings = {};
      }
      if (typeof this.bindings[event] === 'undefined') {
        this.bindings[event] = [];
      }
      this.bindings[event].push({ handler: handler, ctx: ctx, once: once });
    }
  }, {
    key: 'once',
    value: function once(event, handler, ctx) {
      this.on(event, handler, ctx, true);
    }
  }, {
    key: 'off',
    value: function off(event, handler) {
      if (typeof this.bindings === 'undefined' || typeof this.bindings[event] === 'undefined') {
        return;
      }

      if (typeof handler === 'undefined') {
        delete this.bindings[event];
      } else {
        var i = 0;
        while (i < this.bindings[event].length) {
          if (this.bindings[event][i].handler === handler) {
            this.bindings[event].splice(i, 1);
          } else {
            ++i;
          }
        }
      }
    }
  }, {
    key: 'trigger',
    value: function trigger(event) {
      if (typeof this.bindings !== 'undefined' && this.bindings[event]) {
        var i = 0;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        while (i < this.bindings[event].length) {
          var _bindings$event$i = this.bindings[event][i];
          var handler = _bindings$event$i.handler;
          var ctx = _bindings$event$i.ctx;
          var once = _bindings$event$i.once;

          var context = ctx;
          if (typeof context === 'undefined') {
            context = this;
          }

          handler.apply(context, args);

          if (once) {
            this.bindings[event].splice(i, 1);
          } else {
            ++i;
          }
        }
      }
    }
  }]);

  return Evented;
})();

TetherBase.Utils = {
  getActualBoundingClientRect: getActualBoundingClientRect,
  getScrollParents: getScrollParents,
  getBounds: getBounds,
  getOffsetParent: getOffsetParent,
  extend: extend,
  addClass: addClass,
  removeClass: removeClass,
  hasClass: hasClass,
  updateClasses: updateClasses,
  defer: defer,
  flush: flush,
  uniqueId: uniqueId,
  Evented: Evented,
  getScrollBarSize: getScrollBarSize,
  removeUtilElements: removeUtilElements
};
/* globals TetherBase, performance */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

if (typeof TetherBase === 'undefined') {
  throw new Error('You must include the utils.js file before tether.js');
}

var _TetherBase$Utils = TetherBase.Utils;
var getScrollParents = _TetherBase$Utils.getScrollParents;
var getBounds = _TetherBase$Utils.getBounds;
var getOffsetParent = _TetherBase$Utils.getOffsetParent;
var extend = _TetherBase$Utils.extend;
var addClass = _TetherBase$Utils.addClass;
var removeClass = _TetherBase$Utils.removeClass;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;
var flush = _TetherBase$Utils.flush;
var getScrollBarSize = _TetherBase$Utils.getScrollBarSize;
var removeUtilElements = _TetherBase$Utils.removeUtilElements;

function within(a, b) {
  var diff = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

  return a + diff >= b && b >= a - diff;
}

var transformKey = (function () {
  if (typeof document === 'undefined') {
    return '';
  }
  var el = document.createElement('div');

  var transforms = ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform'];
  for (var i = 0; i < transforms.length; ++i) {
    var key = transforms[i];
    if (el.style[key] !== undefined) {
      return key;
    }
  }
})();

var tethers = [];

var position = function position() {
  tethers.forEach(function (tether) {
    tether.position(false);
  });
  flush();
};

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now !== 'undefined') {
    return performance.now();
  }
  return +new Date();
}

(function () {
  var lastCall = null;
  var lastDuration = null;
  var pendingTimeout = null;

  var tick = function tick() {
    if (typeof lastDuration !== 'undefined' && lastDuration > 16) {
      // We voluntarily throttle ourselves if we can't manage 60fps
      lastDuration = Math.min(lastDuration - 16, 250);

      // Just in case this is the last event, remember to position just once more
      pendingTimeout = setTimeout(tick, 250);
      return;
    }

    if (typeof lastCall !== 'undefined' && now() - lastCall < 10) {
      // Some browsers call events a little too frequently, refuse to run more than is reasonable
      return;
    }

    if (pendingTimeout != null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }

    lastCall = now();
    position();
    lastDuration = now() - lastCall;
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener !== 'undefined') {
    ['resize', 'scroll', 'touchmove'].forEach(function (event) {
      window.addEventListener(event, tick);
    });
  }
})();

var MIRROR_LR = {
  center: 'center',
  left: 'right',
  right: 'left'
};

var MIRROR_TB = {
  middle: 'middle',
  top: 'bottom',
  bottom: 'top'
};

var OFFSET_MAP = {
  top: 0,
  left: 0,
  middle: '50%',
  center: '50%',
  bottom: '100%',
  right: '100%'
};

var autoToFixedAttachment = function autoToFixedAttachment(attachment, relativeToAttachment) {
  var left = attachment.left;
  var top = attachment.top;

  if (left === 'auto') {
    left = MIRROR_LR[relativeToAttachment.left];
  }

  if (top === 'auto') {
    top = MIRROR_TB[relativeToAttachment.top];
  }

  return { left: left, top: top };
};

var attachmentToOffset = function attachmentToOffset(attachment) {
  var left = attachment.left;
  var top = attachment.top;

  if (typeof OFFSET_MAP[attachment.left] !== 'undefined') {
    left = OFFSET_MAP[attachment.left];
  }

  if (typeof OFFSET_MAP[attachment.top] !== 'undefined') {
    top = OFFSET_MAP[attachment.top];
  }

  return { left: left, top: top };
};

function addOffset() {
  var out = { top: 0, left: 0 };

  for (var _len = arguments.length, offsets = Array(_len), _key = 0; _key < _len; _key++) {
    offsets[_key] = arguments[_key];
  }

  offsets.forEach(function (_ref) {
    var top = _ref.top;
    var left = _ref.left;

    if (typeof top === 'string') {
      top = parseFloat(top, 10);
    }
    if (typeof left === 'string') {
      left = parseFloat(left, 10);
    }

    out.top += top;
    out.left += left;
  });

  return out;
}

function offsetToPx(offset, size) {
  if (typeof offset.left === 'string' && offset.left.indexOf('%') !== -1) {
    offset.left = parseFloat(offset.left, 10) / 100 * size.width;
  }
  if (typeof offset.top === 'string' && offset.top.indexOf('%') !== -1) {
    offset.top = parseFloat(offset.top, 10) / 100 * size.height;
  }

  return offset;
}

var parseOffset = function parseOffset(value) {
  var _value$split = value.split(' ');

  var _value$split2 = _slicedToArray(_value$split, 2);

  var top = _value$split2[0];
  var left = _value$split2[1];

  return { top: top, left: left };
};
var parseAttachment = parseOffset;

var TetherClass = (function (_Evented) {
  _inherits(TetherClass, _Evented);

  function TetherClass(options) {
    var _this = this;

    _classCallCheck(this, TetherClass);

    _get(Object.getPrototypeOf(TetherClass.prototype), 'constructor', this).call(this);
    this.position = this.position.bind(this);

    tethers.push(this);

    this.history = [];

    this.setOptions(options, false);

    TetherBase.modules.forEach(function (module) {
      if (typeof module.initialize !== 'undefined') {
        module.initialize.call(_this);
      }
    });

    this.position();
  }

  _createClass(TetherClass, [{
    key: 'getClass',
    value: function getClass() {
      var key = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
      var classes = this.options.classes;

      if (typeof classes !== 'undefined' && classes[key]) {
        return this.options.classes[key];
      } else if (this.options.classPrefix) {
        return this.options.classPrefix + '-' + key;
      } else {
        return key;
      }
    }
  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      var _this2 = this;

      var pos = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      var defaults = {
        offset: '0 0',
        targetOffset: '0 0',
        targetAttachment: 'auto auto',
        classPrefix: 'tether'
      };

      this.options = extend(defaults, options);

      var _options = this.options;
      var element = _options.element;
      var target = _options.target;
      var targetModifier = _options.targetModifier;

      this.element = element;
      this.target = target;
      this.targetModifier = targetModifier;

      if (this.target === 'viewport') {
        this.target = document.body;
        this.targetModifier = 'visible';
      } else if (this.target === 'scroll-handle') {
        this.target = document.body;
        this.targetModifier = 'scroll-handle';
      }

      ['element', 'target'].forEach(function (key) {
        if (typeof _this2[key] === 'undefined') {
          throw new Error('Tether Error: Both element and target must be defined');
        }

        if (typeof _this2[key].jquery !== 'undefined') {
          _this2[key] = _this2[key][0];
        } else if (typeof _this2[key] === 'string') {
          _this2[key] = document.querySelector(_this2[key]);
        }
      });

      addClass(this.element, this.getClass('element'));
      if (!(this.options.addTargetClasses === false)) {
        addClass(this.target, this.getClass('target'));
      }

      if (!this.options.attachment) {
        throw new Error('Tether Error: You must provide an attachment');
      }

      this.targetAttachment = parseAttachment(this.options.targetAttachment);
      this.attachment = parseAttachment(this.options.attachment);
      this.offset = parseOffset(this.options.offset);
      this.targetOffset = parseOffset(this.options.targetOffset);

      if (typeof this.scrollParents !== 'undefined') {
        this.disable();
      }

      if (this.targetModifier === 'scroll-handle') {
        this.scrollParents = [this.target];
      } else {
        this.scrollParents = getScrollParents(this.target);
      }

      if (!(this.options.enabled === false)) {
        this.enable(pos);
      }
    }
  }, {
    key: 'getTargetBounds',
    value: function getTargetBounds() {
      if (typeof this.targetModifier !== 'undefined') {
        if (this.targetModifier === 'visible') {
          if (this.target === document.body) {
            return { top: pageYOffset, left: pageXOffset, height: innerHeight, width: innerWidth };
          } else {
            var bounds = getBounds(this.target);

            var out = {
              height: bounds.height,
              width: bounds.width,
              top: bounds.top,
              left: bounds.left
            };

            out.height = Math.min(out.height, bounds.height - (pageYOffset - bounds.top));
            out.height = Math.min(out.height, bounds.height - (bounds.top + bounds.height - (pageYOffset + innerHeight)));
            out.height = Math.min(innerHeight, out.height);
            out.height -= 2;

            out.width = Math.min(out.width, bounds.width - (pageXOffset - bounds.left));
            out.width = Math.min(out.width, bounds.width - (bounds.left + bounds.width - (pageXOffset + innerWidth)));
            out.width = Math.min(innerWidth, out.width);
            out.width -= 2;

            if (out.top < pageYOffset) {
              out.top = pageYOffset;
            }
            if (out.left < pageXOffset) {
              out.left = pageXOffset;
            }

            return out;
          }
        } else if (this.targetModifier === 'scroll-handle') {
          var bounds = undefined;
          var target = this.target;
          if (target === document.body) {
            target = document.documentElement;

            bounds = {
              left: pageXOffset,
              top: pageYOffset,
              height: innerHeight,
              width: innerWidth
            };
          } else {
            bounds = getBounds(target);
          }

          var style = getComputedStyle(target);

          var hasBottomScroll = target.scrollWidth > target.clientWidth || [style.overflow, style.overflowX].indexOf('scroll') >= 0 || this.target !== document.body;

          var scrollBottom = 0;
          if (hasBottomScroll) {
            scrollBottom = 15;
          }

          var height = bounds.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - scrollBottom;

          var out = {
            width: 15,
            height: height * 0.975 * (height / target.scrollHeight),
            left: bounds.left + bounds.width - parseFloat(style.borderLeftWidth) - 15
          };

          var fitAdj = 0;
          if (height < 408 && this.target === document.body) {
            fitAdj = -0.00011 * Math.pow(height, 2) - 0.00727 * height + 22.58;
          }

          if (this.target !== document.body) {
            out.height = Math.max(out.height, 24);
          }

          var scrollPercentage = this.target.scrollTop / (target.scrollHeight - height);
          out.top = scrollPercentage * (height - out.height - fitAdj) + bounds.top + parseFloat(style.borderTopWidth);

          if (this.target === document.body) {
            out.height = Math.max(out.height, 24);
          }

          return out;
        }
      } else {
        return getBounds(this.target);
      }
    }
  }, {
    key: 'clearCache',
    value: function clearCache() {
      this._cache = {};
    }
  }, {
    key: 'cache',
    value: function cache(k, getter) {
      // More than one module will often need the same DOM info, so
      // we keep a cache which is cleared on each position call
      if (typeof this._cache === 'undefined') {
        this._cache = {};
      }

      if (typeof this._cache[k] === 'undefined') {
        this._cache[k] = getter.call(this);
      }

      return this._cache[k];
    }
  }, {
    key: 'enable',
    value: function enable() {
      var _this3 = this;

      var pos = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      if (!(this.options.addTargetClasses === false)) {
        addClass(this.target, this.getClass('enabled'));
      }
      addClass(this.element, this.getClass('enabled'));
      this.enabled = true;

      this.scrollParents.forEach(function (parent) {
        if (parent !== _this3.target.ownerDocument) {
          parent.addEventListener('scroll', _this3.position);
        }
      });

      if (pos) {
        this.position();
      }
    }
  }, {
    key: 'disable',
    value: function disable() {
      var _this4 = this;

      removeClass(this.target, this.getClass('enabled'));
      removeClass(this.element, this.getClass('enabled'));
      this.enabled = false;

      if (typeof this.scrollParents !== 'undefined') {
        this.scrollParents.forEach(function (parent) {
          parent.removeEventListener('scroll', _this4.position);
        });
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this5 = this;

      this.disable();

      tethers.forEach(function (tether, i) {
        if (tether === _this5) {
          tethers.splice(i, 1);
        }
      });

      // Remove any elements we were using for convenience from the DOM
      if (tethers.length === 0) {
        removeUtilElements();
      }
    }
  }, {
    key: 'updateAttachClasses',
    value: function updateAttachClasses(elementAttach, targetAttach) {
      var _this6 = this;

      elementAttach = elementAttach || this.attachment;
      targetAttach = targetAttach || this.targetAttachment;
      var sides = ['left', 'top', 'bottom', 'right', 'middle', 'center'];

      if (typeof this._addAttachClasses !== 'undefined' && this._addAttachClasses.length) {
        // updateAttachClasses can be called more than once in a position call, so
        // we need to clean up after ourselves such that when the last defer gets
        // ran it doesn't add any extra classes from previous calls.
        this._addAttachClasses.splice(0, this._addAttachClasses.length);
      }

      if (typeof this._addAttachClasses === 'undefined') {
        this._addAttachClasses = [];
      }
      var add = this._addAttachClasses;

      if (elementAttach.top) {
        add.push(this.getClass('element-attached') + '-' + elementAttach.top);
      }
      if (elementAttach.left) {
        add.push(this.getClass('element-attached') + '-' + elementAttach.left);
      }
      if (targetAttach.top) {
        add.push(this.getClass('target-attached') + '-' + targetAttach.top);
      }
      if (targetAttach.left) {
        add.push(this.getClass('target-attached') + '-' + targetAttach.left);
      }

      var all = [];
      sides.forEach(function (side) {
        all.push(_this6.getClass('element-attached') + '-' + side);
        all.push(_this6.getClass('target-attached') + '-' + side);
      });

      defer(function () {
        if (!(typeof _this6._addAttachClasses !== 'undefined')) {
          return;
        }

        updateClasses(_this6.element, _this6._addAttachClasses, all);
        if (!(_this6.options.addTargetClasses === false)) {
          updateClasses(_this6.target, _this6._addAttachClasses, all);
        }

        delete _this6._addAttachClasses;
      });
    }
  }, {
    key: 'position',
    value: function position() {
      var _this7 = this;

      var flushChanges = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      // flushChanges commits the changes immediately, leave true unless you are positioning multiple
      // tethers (in which case call Tether.Utils.flush yourself when you're done)

      if (!this.enabled) {
        return;
      }

      this.clearCache();

      // Turn 'auto' attachments into the appropriate corner or edge
      var targetAttachment = autoToFixedAttachment(this.targetAttachment, this.attachment);

      this.updateAttachClasses(this.attachment, targetAttachment);

      var elementPos = this.cache('element-bounds', function () {
        return getBounds(_this7.element);
      });

      var width = elementPos.width;
      var height = elementPos.height;

      if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
        var _lastSize = this.lastSize;

        // We cache the height and width to make it possible to position elements that are
        // getting hidden.
        width = _lastSize.width;
        height = _lastSize.height;
      } else {
        this.lastSize = { width: width, height: height };
      }

      var targetPos = this.cache('target-bounds', function () {
        return _this7.getTargetBounds();
      });
      var targetSize = targetPos;

      // Get an actual px offset from the attachment
      var offset = offsetToPx(attachmentToOffset(this.attachment), { width: width, height: height });
      var targetOffset = offsetToPx(attachmentToOffset(targetAttachment), targetSize);

      var manualOffset = offsetToPx(this.offset, { width: width, height: height });
      var manualTargetOffset = offsetToPx(this.targetOffset, targetSize);

      // Add the manually provided offset
      offset = addOffset(offset, manualOffset);
      targetOffset = addOffset(targetOffset, manualTargetOffset);

      // It's now our goal to make (element position + offset) == (target position + target offset)
      var left = targetPos.left + targetOffset.left - offset.left;
      var top = targetPos.top + targetOffset.top - offset.top;

      for (var i = 0; i < TetherBase.modules.length; ++i) {
        var _module2 = TetherBase.modules[i];
        var ret = _module2.position.call(this, {
          left: left,
          top: top,
          targetAttachment: targetAttachment,
          targetPos: targetPos,
          elementPos: elementPos,
          offset: offset,
          targetOffset: targetOffset,
          manualOffset: manualOffset,
          manualTargetOffset: manualTargetOffset,
          scrollbarSize: scrollbarSize,
          attachment: this.attachment
        });

        if (ret === false) {
          return false;
        } else if (typeof ret === 'undefined' || typeof ret !== 'object') {
          continue;
        } else {
          top = ret.top;
          left = ret.left;
        }
      }

      // We describe the position three different ways to give the optimizer
      // a chance to decide the best possible way to position the element
      // with the fewest repaints.
      var next = {
        // It's position relative to the page (absolute positioning when
        // the element is a child of the body)
        page: {
          top: top,
          left: left
        },

        // It's position relative to the viewport (fixed positioning)
        viewport: {
          top: top - pageYOffset,
          bottom: pageYOffset - top - height + innerHeight,
          left: left - pageXOffset,
          right: pageXOffset - left - width + innerWidth
        }
      };

      var doc = this.target.ownerDocument;
      var win = doc.defaultView;

      var scrollbarSize = undefined;
      if (win.innerHeight > doc.documentElement.clientHeight) {
        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
        next.viewport.bottom -= scrollbarSize.height;
      }

      if (win.innerWidth > doc.documentElement.clientWidth) {
        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
        next.viewport.right -= scrollbarSize.width;
      }

      if (['', 'static'].indexOf(doc.body.style.position) === -1 || ['', 'static'].indexOf(doc.body.parentElement.style.position) === -1) {
        // Absolute positioning in the body will be relative to the page, not the 'initial containing block'
        next.page.bottom = doc.body.scrollHeight - top - height;
        next.page.right = doc.body.scrollWidth - left - width;
      }

      if (typeof this.options.optimizations !== 'undefined' && this.options.optimizations.moveElement !== false && !(typeof this.targetModifier !== 'undefined')) {
        (function () {
          var offsetParent = _this7.cache('target-offsetparent', function () {
            return getOffsetParent(_this7.target);
          });
          var offsetPosition = _this7.cache('target-offsetparent-bounds', function () {
            return getBounds(offsetParent);
          });
          var offsetParentStyle = getComputedStyle(offsetParent);
          var offsetParentSize = offsetPosition;

          var offsetBorder = {};
          ['Top', 'Left', 'Bottom', 'Right'].forEach(function (side) {
            offsetBorder[side.toLowerCase()] = parseFloat(offsetParentStyle['border' + side + 'Width']);
          });

          offsetPosition.right = doc.body.scrollWidth - offsetPosition.left - offsetParentSize.width + offsetBorder.right;
          offsetPosition.bottom = doc.body.scrollHeight - offsetPosition.top - offsetParentSize.height + offsetBorder.bottom;

          if (next.page.top >= offsetPosition.top + offsetBorder.top && next.page.bottom >= offsetPosition.bottom) {
            if (next.page.left >= offsetPosition.left + offsetBorder.left && next.page.right >= offsetPosition.right) {
              // We're within the visible part of the target's scroll parent
              var scrollTop = offsetParent.scrollTop;
              var scrollLeft = offsetParent.scrollLeft;

              // It's position relative to the target's offset parent (absolute positioning when
              // the element is moved to be a child of the target's offset parent).
              next.offset = {
                top: next.page.top - offsetPosition.top + scrollTop - offsetBorder.top,
                left: next.page.left - offsetPosition.left + scrollLeft - offsetBorder.left
              };
            }
          }
        })();
      }

      // We could also travel up the DOM and try each containing context, rather than only
      // looking at the body, but we're gonna get diminishing returns.

      this.move(next);

      this.history.unshift(next);

      if (this.history.length > 3) {
        this.history.pop();
      }

      if (flushChanges) {
        flush();
      }

      return true;
    }

    // THE ISSUE
  }, {
    key: 'move',
    value: function move(pos) {
      var _this8 = this;

      if (!(typeof this.element.parentNode !== 'undefined')) {
        return;
      }

      var same = {};

      for (var type in pos) {
        same[type] = {};

        for (var key in pos[type]) {
          var found = false;

          for (var i = 0; i < this.history.length; ++i) {
            var point = this.history[i];
            if (typeof point[type] !== 'undefined' && !within(point[type][key], pos[type][key])) {
              found = true;
              break;
            }
          }

          if (!found) {
            same[type][key] = true;
          }
        }
      }

      var css = { top: '', left: '', right: '', bottom: '' };

      var transcribe = function transcribe(_same, _pos) {
        var hasOptimizations = typeof _this8.options.optimizations !== 'undefined';
        var gpu = hasOptimizations ? _this8.options.optimizations.gpu : null;
        if (gpu !== false) {
          var yPos = undefined,
              xPos = undefined;
          if (_same.top) {
            css.top = 0;
            yPos = _pos.top;
          } else {
            css.bottom = 0;
            yPos = -_pos.bottom;
          }

          if (_same.left) {
            css.left = 0;
            xPos = _pos.left;
          } else {
            css.right = 0;
            xPos = -_pos.right;
          }

          if (window.matchMedia) {
            // HubSpot/tether#207
            var retina = window.matchMedia('only screen and (min-resolution: 1.3dppx)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3)').matches;
            if (!retina) {
              xPos = Math.round(xPos);
              yPos = Math.round(yPos);
            }
          }

          css[transformKey] = 'translateX(' + xPos + 'px) translateY(' + yPos + 'px)';

          if (transformKey !== 'msTransform') {
            // The Z transform will keep this in the GPU (faster, and prevents artifacts),
            // but IE9 doesn't support 3d transforms and will choke.
            css[transformKey] += " translateZ(0)";
          }
        } else {
          if (_same.top) {
            css.top = _pos.top + 'px';
          } else {
            css.bottom = _pos.bottom + 'px';
          }

          if (_same.left) {
            css.left = _pos.left + 'px';
          } else {
            css.right = _pos.right + 'px';
          }
        }
      };

      var moved = false;
      if ((same.page.top || same.page.bottom) && (same.page.left || same.page.right)) {
        css.position = 'absolute';
        transcribe(same.page, pos.page);
      } else if ((same.viewport.top || same.viewport.bottom) && (same.viewport.left || same.viewport.right)) {
        css.position = 'fixed';
        transcribe(same.viewport, pos.viewport);
      } else if (typeof same.offset !== 'undefined' && same.offset.top && same.offset.left) {
        (function () {
          css.position = 'absolute';
          var offsetParent = _this8.cache('target-offsetparent', function () {
            return getOffsetParent(_this8.target);
          });

          if (getOffsetParent(_this8.element) !== offsetParent) {
            defer(function () {
              _this8.element.parentNode.removeChild(_this8.element);
              offsetParent.appendChild(_this8.element);
            });
          }

          transcribe(same.offset, pos.offset);
          moved = true;
        })();
      } else {
        css.position = 'absolute';
        transcribe({ top: true, left: true }, pos.page);
      }

      if (!moved) {
        if (this.options.bodyElement) {
          this.options.bodyElement.appendChild(this.element);
        } else {
          var offsetParentIsBody = true;
          var currentNode = this.element.parentNode;
          while (currentNode && currentNode.nodeType === 1 && currentNode.tagName !== 'BODY') {
            if (getComputedStyle(currentNode).position !== 'static') {
              offsetParentIsBody = false;
              break;
            }

            currentNode = currentNode.parentNode;
          }

          if (!offsetParentIsBody) {
            this.element.parentNode.removeChild(this.element);
            this.element.ownerDocument.body.appendChild(this.element);
          }
        }
      }

      // Any css change will trigger a repaint, so let's avoid one if nothing changed
      var writeCSS = {};
      var write = false;
      for (var key in css) {
        var val = css[key];
        var elVal = this.element.style[key];

        if (elVal !== val) {
          write = true;
          writeCSS[key] = val;
        }
      }

      if (write) {
        defer(function () {
          extend(_this8.element.style, writeCSS);
          _this8.trigger('repositioned');
        });
      }
    }
  }]);

  return TetherClass;
})(Evented);

TetherClass.modules = [];

TetherBase.position = position;

var Tether = extend(TetherClass, TetherBase);
/* globals TetherBase */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _TetherBase$Utils = TetherBase.Utils;
var getBounds = _TetherBase$Utils.getBounds;
var extend = _TetherBase$Utils.extend;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;

var BOUNDS_FORMAT = ['left', 'top', 'right', 'bottom'];

function getBoundingRect(tether, to) {
  if (to === 'scrollParent') {
    to = tether.scrollParents[0];
  } else if (to === 'window') {
    to = [pageXOffset, pageYOffset, innerWidth + pageXOffset, innerHeight + pageYOffset];
  }

  if (to === document) {
    to = to.documentElement;
  }

  if (typeof to.nodeType !== 'undefined') {
    (function () {
      var node = to;
      var size = getBounds(to);
      var pos = size;
      var style = getComputedStyle(to);

      to = [pos.left, pos.top, size.width + pos.left, size.height + pos.top];

      // Account any parent Frames scroll offset
      if (node.ownerDocument !== document) {
        var win = node.ownerDocument.defaultView;
        to[0] += win.pageXOffset;
        to[1] += win.pageYOffset;
        to[2] += win.pageXOffset;
        to[3] += win.pageYOffset;
      }

      BOUNDS_FORMAT.forEach(function (side, i) {
        side = side[0].toUpperCase() + side.substr(1);
        if (side === 'Top' || side === 'Left') {
          to[i] += parseFloat(style['border' + side + 'Width']);
        } else {
          to[i] -= parseFloat(style['border' + side + 'Width']);
        }
      });
    })();
  }

  return to;
}

TetherBase.modules.push({
  position: function position(_ref) {
    var _this = this;

    var top = _ref.top;
    var left = _ref.left;
    var targetAttachment = _ref.targetAttachment;

    if (!this.options.constraints) {
      return true;
    }

    var _cache = this.cache('element-bounds', function () {
      return getBounds(_this.element);
    });

    var height = _cache.height;
    var width = _cache.width;

    if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
      var _lastSize = this.lastSize;

      // Handle the item getting hidden as a result of our positioning without glitching
      // the classes in and out
      width = _lastSize.width;
      height = _lastSize.height;
    }

    var targetSize = this.cache('target-bounds', function () {
      return _this.getTargetBounds();
    });

    var targetHeight = targetSize.height;
    var targetWidth = targetSize.width;

    var allClasses = [this.getClass('pinned'), this.getClass('out-of-bounds')];

    this.options.constraints.forEach(function (constraint) {
      var outOfBoundsClass = constraint.outOfBoundsClass;
      var pinnedClass = constraint.pinnedClass;

      if (outOfBoundsClass) {
        allClasses.push(outOfBoundsClass);
      }
      if (pinnedClass) {
        allClasses.push(pinnedClass);
      }
    });

    allClasses.forEach(function (cls) {
      ['left', 'top', 'right', 'bottom'].forEach(function (side) {
        allClasses.push(cls + '-' + side);
      });
    });

    var addClasses = [];

    var tAttachment = extend({}, targetAttachment);
    var eAttachment = extend({}, this.attachment);

    this.options.constraints.forEach(function (constraint) {
      var to = constraint.to;
      var attachment = constraint.attachment;
      var pin = constraint.pin;

      if (typeof attachment === 'undefined') {
        attachment = '';
      }

      var changeAttachX = undefined,
          changeAttachY = undefined;
      if (attachment.indexOf(' ') >= 0) {
        var _attachment$split = attachment.split(' ');

        var _attachment$split2 = _slicedToArray(_attachment$split, 2);

        changeAttachY = _attachment$split2[0];
        changeAttachX = _attachment$split2[1];
      } else {
        changeAttachX = changeAttachY = attachment;
      }

      var bounds = getBoundingRect(_this, to);

      if (changeAttachY === 'target' || changeAttachY === 'both') {
        if (top < bounds[1] && tAttachment.top === 'top') {
          top += targetHeight;
          tAttachment.top = 'bottom';
        }

        if (top + height > bounds[3] && tAttachment.top === 'bottom') {
          top -= targetHeight;
          tAttachment.top = 'top';
        }
      }

      if (changeAttachY === 'together') {
        if (tAttachment.top === 'top') {
          if (eAttachment.top === 'bottom' && top < bounds[1]) {
            top += targetHeight;
            tAttachment.top = 'bottom';

            top += height;
            eAttachment.top = 'top';
          } else if (eAttachment.top === 'top' && top + height > bounds[3] && top - (height - targetHeight) >= bounds[1]) {
            top -= height - targetHeight;
            tAttachment.top = 'bottom';

            eAttachment.top = 'bottom';
          }
        }

        if (tAttachment.top === 'bottom') {
          if (eAttachment.top === 'top' && top + height > bounds[3]) {
            top -= targetHeight;
            tAttachment.top = 'top';

            top -= height;
            eAttachment.top = 'bottom';
          } else if (eAttachment.top === 'bottom' && top < bounds[1] && top + (height * 2 - targetHeight) <= bounds[3]) {
            top += height - targetHeight;
            tAttachment.top = 'top';

            eAttachment.top = 'top';
          }
        }

        if (tAttachment.top === 'middle') {
          if (top + height > bounds[3] && eAttachment.top === 'top') {
            top -= height;
            eAttachment.top = 'bottom';
          } else if (top < bounds[1] && eAttachment.top === 'bottom') {
            top += height;
            eAttachment.top = 'top';
          }
        }
      }

      if (changeAttachX === 'target' || changeAttachX === 'both') {
        if (left < bounds[0] && tAttachment.left === 'left') {
          left += targetWidth;
          tAttachment.left = 'right';
        }

        if (left + width > bounds[2] && tAttachment.left === 'right') {
          left -= targetWidth;
          tAttachment.left = 'left';
        }
      }

      if (changeAttachX === 'together') {
        if (left < bounds[0] && tAttachment.left === 'left') {
          if (eAttachment.left === 'right') {
            left += targetWidth;
            tAttachment.left = 'right';

            left += width;
            eAttachment.left = 'left';
          } else if (eAttachment.left === 'left') {
            left += targetWidth;
            tAttachment.left = 'right';

            left -= width;
            eAttachment.left = 'right';
          }
        } else if (left + width > bounds[2] && tAttachment.left === 'right') {
          if (eAttachment.left === 'left') {
            left -= targetWidth;
            tAttachment.left = 'left';

            left -= width;
            eAttachment.left = 'right';
          } else if (eAttachment.left === 'right') {
            left -= targetWidth;
            tAttachment.left = 'left';

            left += width;
            eAttachment.left = 'left';
          }
        } else if (tAttachment.left === 'center') {
          if (left + width > bounds[2] && eAttachment.left === 'left') {
            left -= width;
            eAttachment.left = 'right';
          } else if (left < bounds[0] && eAttachment.left === 'right') {
            left += width;
            eAttachment.left = 'left';
          }
        }
      }

      if (changeAttachY === 'element' || changeAttachY === 'both') {
        if (top < bounds[1] && eAttachment.top === 'bottom') {
          top += height;
          eAttachment.top = 'top';
        }

        if (top + height > bounds[3] && eAttachment.top === 'top') {
          top -= height;
          eAttachment.top = 'bottom';
        }
      }

      if (changeAttachX === 'element' || changeAttachX === 'both') {
        if (left < bounds[0]) {
          if (eAttachment.left === 'right') {
            left += width;
            eAttachment.left = 'left';
          } else if (eAttachment.left === 'center') {
            left += width / 2;
            eAttachment.left = 'left';
          }
        }

        if (left + width > bounds[2]) {
          if (eAttachment.left === 'left') {
            left -= width;
            eAttachment.left = 'right';
          } else if (eAttachment.left === 'center') {
            left -= width / 2;
            eAttachment.left = 'right';
          }
        }
      }

      if (typeof pin === 'string') {
        pin = pin.split(',').map(function (p) {
          return p.trim();
        });
      } else if (pin === true) {
        pin = ['top', 'left', 'right', 'bottom'];
      }

      pin = pin || [];

      var pinned = [];
      var oob = [];

      if (top < bounds[1]) {
        if (pin.indexOf('top') >= 0) {
          top = bounds[1];
          pinned.push('top');
        } else {
          oob.push('top');
        }
      }

      if (top + height > bounds[3]) {
        if (pin.indexOf('bottom') >= 0) {
          top = bounds[3] - height;
          pinned.push('bottom');
        } else {
          oob.push('bottom');
        }
      }

      if (left < bounds[0]) {
        if (pin.indexOf('left') >= 0) {
          left = bounds[0];
          pinned.push('left');
        } else {
          oob.push('left');
        }
      }

      if (left + width > bounds[2]) {
        if (pin.indexOf('right') >= 0) {
          left = bounds[2] - width;
          pinned.push('right');
        } else {
          oob.push('right');
        }
      }

      if (pinned.length) {
        (function () {
          var pinnedClass = undefined;
          if (typeof _this.options.pinnedClass !== 'undefined') {
            pinnedClass = _this.options.pinnedClass;
          } else {
            pinnedClass = _this.getClass('pinned');
          }

          addClasses.push(pinnedClass);
          pinned.forEach(function (side) {
            addClasses.push(pinnedClass + '-' + side);
          });
        })();
      }

      if (oob.length) {
        (function () {
          var oobClass = undefined;
          if (typeof _this.options.outOfBoundsClass !== 'undefined') {
            oobClass = _this.options.outOfBoundsClass;
          } else {
            oobClass = _this.getClass('out-of-bounds');
          }

          addClasses.push(oobClass);
          oob.forEach(function (side) {
            addClasses.push(oobClass + '-' + side);
          });
        })();
      }

      if (pinned.indexOf('left') >= 0 || pinned.indexOf('right') >= 0) {
        eAttachment.left = tAttachment.left = false;
      }
      if (pinned.indexOf('top') >= 0 || pinned.indexOf('bottom') >= 0) {
        eAttachment.top = tAttachment.top = false;
      }

      if (tAttachment.top !== targetAttachment.top || tAttachment.left !== targetAttachment.left || eAttachment.top !== _this.attachment.top || eAttachment.left !== _this.attachment.left) {
        _this.updateAttachClasses(eAttachment, tAttachment);
        _this.trigger('update', {
          attachment: eAttachment,
          targetAttachment: tAttachment
        });
      }
    });

    defer(function () {
      if (!(_this.options.addTargetClasses === false)) {
        updateClasses(_this.target, addClasses, allClasses);
      }
      updateClasses(_this.element, addClasses, allClasses);
    });

    return { top: top, left: left };
  }
});
/* globals TetherBase */

'use strict';

var _TetherBase$Utils = TetherBase.Utils;
var getBounds = _TetherBase$Utils.getBounds;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;

TetherBase.modules.push({
  position: function position(_ref) {
    var _this = this;

    var top = _ref.top;
    var left = _ref.left;

    var _cache = this.cache('element-bounds', function () {
      return getBounds(_this.element);
    });

    var height = _cache.height;
    var width = _cache.width;

    var targetPos = this.getTargetBounds();

    var bottom = top + height;
    var right = left + width;

    var abutted = [];
    if (top <= targetPos.bottom && bottom >= targetPos.top) {
      ['left', 'right'].forEach(function (side) {
        var targetPosSide = targetPos[side];
        if (targetPosSide === left || targetPosSide === right) {
          abutted.push(side);
        }
      });
    }

    if (left <= targetPos.right && right >= targetPos.left) {
      ['top', 'bottom'].forEach(function (side) {
        var targetPosSide = targetPos[side];
        if (targetPosSide === top || targetPosSide === bottom) {
          abutted.push(side);
        }
      });
    }

    var allClasses = [];
    var addClasses = [];

    var sides = ['left', 'top', 'right', 'bottom'];
    allClasses.push(this.getClass('abutted'));
    sides.forEach(function (side) {
      allClasses.push(_this.getClass('abutted') + '-' + side);
    });

    if (abutted.length) {
      addClasses.push(this.getClass('abutted'));
    }

    abutted.forEach(function (side) {
      addClasses.push(_this.getClass('abutted') + '-' + side);
    });

    defer(function () {
      if (!(_this.options.addTargetClasses === false)) {
        updateClasses(_this.target, addClasses, allClasses);
      }
      updateClasses(_this.element, addClasses, allClasses);
    });

    return true;
  }
});
/* globals TetherBase */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

TetherBase.modules.push({
  position: function position(_ref) {
    var top = _ref.top;
    var left = _ref.left;

    if (!this.options.shift) {
      return;
    }

    var shift = this.options.shift;
    if (typeof this.options.shift === 'function') {
      shift = this.options.shift.call(this, { top: top, left: left });
    }

    var shiftTop = undefined,
        shiftLeft = undefined;
    if (typeof shift === 'string') {
      shift = shift.split(' ');
      shift[1] = shift[1] || shift[0];

      var _shift = shift;

      var _shift2 = _slicedToArray(_shift, 2);

      shiftTop = _shift2[0];
      shiftLeft = _shift2[1];

      shiftTop = parseFloat(shiftTop, 10);
      shiftLeft = parseFloat(shiftLeft, 10);
    } else {
      shiftTop = shift.top;
      shiftLeft = shift.left;
    }

    top += shiftTop;
    left += shiftLeft;

    return { top: top, left: left };
  }
});
return Tether;

}));

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var ClickZoneExtension_1 = require("../extensions/extra/ClickZoneExtension");
var EditingExtension_1 = require("../extensions/common/EditingExtension");
var GridElement_1 = require("../ui/GridElement");
var SelectorExtension_1 = require("../extensions/common/SelectorExtension");
var ScrollerExtension_1 = require("../extensions/common/ScrollerExtension");
var ClipboardExtension_1 = require("../extensions/common/ClipboardExtension");
var HistoryExtension_1 = require("../extensions/history/HistoryExtension");
var ComputeExtension_1 = require("../extensions/compute/ComputeExtension");
var Base26_1 = require("../misc/Base26");
var DefaultGridCell_1 = require("../model/default/DefaultGridCell");
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var GridRange_1 = require("../model/GridRange");
var TestExtension = (function () {
    function TestExtension() {
    }
    TestExtension.prototype.init = function (grid, kernel) {
    };
    return TestExtension;
}());
var history = new _1.DefaultHistoryManager();
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension_1.ScrollerExtension())
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .extend(new ClipboardExtension_1.ClipboardExtension())
    .extend(new HistoryExtension_1.HistoryExtension(history))
    .extend(new ComputeExtension_1.ComputeExtension())
    .extend(new ClickZoneExtension_1.ClickZoneExtension())
    .mergeInterface();
grid.on('input', function (e) {
    e.changes.forEach(function (x) {
        var ln = Base26_1.Base26.num(x.cell.colRef).str + (x.cell.rowRef + 1);
        console.log('change:', ln, 'from', x.cell.value, 'to', x.value, '- cascaded: ', x.cascaded);
        x.cell.value = x.value;
    });
    grid.redraw(true);
});
grid.on('click', function (e) {
    if (e.cell) {
        console.log(Base26_1.Base26.num(e.cell.colRef).str + (e.cell.rowRef + 1));
    }
});
grid.on('zoneenter', function (e) { return console.log(e.type, e.zone.type); });
grid.on('zoneexit', function (e) { return console.log(e.type, e.zone.type); });
grid.on('zoneclick', function (e) { return console.log(e.type, e.zone.type); });
grid.model = make_model(26 * 5, 250);
grid.model.cells[0]['formula'] = '=SUM(B1:B10)';
grid.model.cells[0]['readonly'] = true;
grid.model.cells[0]['zones'] = [
    {
        mode: 'rel',
        left: 0,
        top: 0,
        width: 50,
        height: 100,
        type: 'test1',
    },
    {
        mode: 'rel',
        left: 50,
        top: 0,
        width: 50,
        height: 100,
        type: 'test2',
    }
];
grid.invalidate();
history.clear();
history.push({
    apply: function () { return alert('Forward!'); },
    rollback: function () { return alert('Backward!'); },
});
window['GridRange'] = GridRange_1.GridRange;
window['grid'] = grid;
function make_model(cols, rows) {
    var cells = [];
    for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
            cells.push(new DefaultGridCell_1.DefaultGridCell({
                colRef: c,
                rowRef: r,
                value: '123',
            }));
        }
    }
    return new DefaultGridModel_1.DefaultGridModel(cells, [], []);
}
},{"../":20,"../extensions/common/ClipboardExtension":7,"../extensions/common/EditingExtension":8,"../extensions/common/ScrollerExtension":9,"../extensions/common/SelectorExtension":10,"../extensions/compute/ComputeExtension":11,"../extensions/extra/ClickZoneExtension":14,"../extensions/history/HistoryExtension":15,"../misc/Base26":29,"../model/GridRange":34,"../model/default/DefaultGridCell":35,"../model/default/DefaultGridModel":37,"../ui/GridElement":42}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var EditingExtension_1 = require("./EditingExtension");
var GridRange_1 = require("../../model/GridRange");
var KeyInput_1 = require("../../input/KeyInput");
var Rect_1 = require("../../geom/Rect");
var Point_1 = require("../../geom/Point");
var Widget_1 = require("../../ui/Widget");
var Extensibility_1 = require("../../ui/Extensibility");
var clipboard_1 = require("../../vendor/clipboard");
var _ = require("../../misc/Util");
var Dom = require("../../misc/Dom");
var Papa = require("papaparse");
var Tether = require("tether");
//I know... :(
var NewLine = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
var ClipboardExtension = (function () {
    function ClipboardExtension() {
        this.copyList = [];
        this.copyRange = GridRange_1.GridRange.empty();
    }
    ClipboardExtension.prototype.init = function (grid) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_C', function (e) { return _this.copySelection(); });
        window.addEventListener('paste', this.onWindowPaste.bind(this));
        grid.on('scroll', function () { return _this.alignNet(); });
        grid.kernel.routines.hook('before:beginEdit', function () { return _this.resetCopy(); });
        grid.kernel.routines.hook('before:commit', function () { return _this.resetCopy(); });
    };
    Object.defineProperty(ClipboardExtension.prototype, "captureSelector", {
        get: function () {
            return this.grid.kernel.variables.get('captureSelector');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ClipboardExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    ClipboardExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        var onBash = function () {
            Dom.fit(layer, target);
            t.position();
        };
        this.grid.on('bash', onBash);
        onBash();
        this.layer = layer;
        this.copyNet = CopyNet.create(layer);
    };
    ClipboardExtension.prototype.copySelection = function () {
        this.doCopy(this.selection);
        this.alignNet();
    };
    ClipboardExtension.prototype.resetCopy = function () {
        this.doCopy([]);
        this.alignNet();
    };
    ClipboardExtension.prototype.doCopy = function (cells, delimiter) {
        if (delimiter === void 0) { delimiter = '\t'; }
        this.copyList = cells;
        var range = this.copyRange = GridRange_1.GridRange.create(this.grid.model, cells);
        var text = '';
        if (!cells.length)
            return;
        var rr = range.ltr[0].rowRef;
        for (var i = 0; i < range.ltr.length; i++) {
            var c = range.ltr[i];
            if (rr !== c.rowRef) {
                text += NewLine;
                rr = c.rowRef;
            }
            text += c.value;
            if (i < (range.ltr.length - 1) && range.ltr[i + 1].rowRef === rr) {
                text += delimiter;
            }
        }
        clipboard_1.Clipboard.copy(text);
    };
    ClipboardExtension.prototype.doPaste = function (text) {
        var _a = this, grid = _a.grid, selection = _a.selection;
        if (!selection.length)
            return;
        var focusedCell = grid.model.findCell(selection[0]);
        var parsed = Papa.parse(text, {
            delimiter: text.indexOf('\t') >= 0 ? '\t' : undefined,
        });
        var data = parsed.data.filter(function (x) { return x.length > 1 || (x.length == 1 && !!x[0]); });
        if (!data.length)
            return;
        var width = _.max(data, function (x) { return x.length; }).length;
        var height = data.length;
        var startVector = new Point_1.Point(focusedCell.colRef, focusedCell.rowRef);
        var endVector = startVector.add(new Point_1.Point(width, height));
        var pasteRange = GridRange_1.GridRange.capture(grid.model, startVector, endVector);
        var changes = new EditingExtension_1.GridChangeSet();
        for (var _i = 0, _b = pasteRange.ltr; _i < _b.length; _i++) {
            var cell = _b[_i];
            var xy = new Point_1.Point(cell.colRef, cell.rowRef).subtract(startVector);
            var value = data[xy.y][xy.x] || '';
            changes.put(cell.ref, value);
        }
        this.grid.kernel.commands.exec('commit', changes);
        this.grid.kernel.commands.exec('select', pasteRange.ltr.map(function (x) { return x.ref; }));
    };
    ClipboardExtension.prototype.alignNet = function () {
        var _a = this, grid = _a.grid, copyList = _a.copyList, copyNet = _a.copyNet;
        if (copyList.length) {
            //TODO: Improve the shit out of this:
            var netRect = Rect_1.Rect.fromMany(copyList.map(function (x) { return grid.getCellViewRect(x); }));
            copyNet.goto(netRect);
        }
        else {
            copyNet.hide();
        }
    };
    ClipboardExtension.prototype.onWindowPaste = function (e) {
        var ae = document.activeElement;
        while (!!ae) {
            if (ae == this.grid.root)
                break;
            ae = ae.parentElement;
        }
        if (!ae)
            return;
        var text = e.clipboardData.getData('text/plain');
        if (text !== null && text !== undefined) {
            this.doPaste(text);
        }
    };
    return ClipboardExtension;
}());
__decorate([
    Extensibility_1.variable(),
    __metadata("design:type", CopyNet)
], ClipboardExtension.prototype, "copyNet", void 0);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClipboardExtension.prototype, "copySelection", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClipboardExtension.prototype, "resetCopy", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", void 0)
], ClipboardExtension.prototype, "doCopy", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClipboardExtension.prototype, "doPaste", null);
exports.ClipboardExtension = ClipboardExtension;
var CopyNet = (function (_super) {
    __extends(CopyNet, _super);
    function CopyNet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CopyNet.create = function (container) {
        var root = document.createElement('div');
        root.className = 'grid-net grid-net-copy';
        container.appendChild(root);
        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });
        return new CopyNet(root);
    };
    return CopyNet;
}(Widget_1.AbsWidgetBase));
exports.CopyNet = CopyNet;
},{"../../geom/Point":18,"../../geom/Rect":19,"../../input/KeyInput":24,"../../misc/Dom":30,"../../misc/Util":33,"../../model/GridRange":34,"../../ui/Extensibility":41,"../../ui/Widget":44,"../../vendor/clipboard":47,"./EditingExtension":8,"papaparse":3,"tether":5}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var KeyInput_1 = require("../../input/KeyInput");
var MouseInput_1 = require("../../input/MouseInput");
var Point_1 = require("../../geom/Point");
var Util_1 = require("../../misc/Util");
var Widget_1 = require("../../ui/Widget");
var Extensibility_1 = require("../../ui/Extensibility");
var Tether = require("tether");
var Dom = require("../../misc/Dom");
var Vectors = {
    n: new Point_1.Point(0, -1),
    s: new Point_1.Point(0, 1),
    e: new Point_1.Point(1, 0),
    w: new Point_1.Point(-1, 0),
};
var GridChangeSet = (function () {
    function GridChangeSet() {
        this.data = {};
    }
    GridChangeSet.prototype.contents = function () {
        return Util_1.values(this.data);
    };
    GridChangeSet.prototype.get = function (ref) {
        var entry = this.data[ref];
        return !!entry ? entry.value : undefined;
    };
    GridChangeSet.prototype.put = function (ref, value, cascaded) {
        this.data[ref] = {
            ref: ref,
            value: value,
            cascaded: !!cascaded,
        };
        return this;
    };
    GridChangeSet.prototype.refs = function () {
        return Object.keys(this.data);
    };
    GridChangeSet.prototype.compile = function (model) {
        return this.contents()
            .map(function (x) { return ({
            cell: model.findCell(x.ref),
            value: x.value,
            cascaded: x.cascaded,
        }); })
            .filter(function (x) { return !!x.cascaded || !is_readonly(x.cell); });
    };
    return GridChangeSet;
}());
exports.GridChangeSet = GridChangeSet;
var EditingExtension = (function () {
    function EditingExtension() {
        this.isEditing = false;
        this.isEditingDetailed = false;
    }
    EditingExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(this.input.root)
            .on('!ESCAPE', function () { return _this.endEdit(false); })
            .on('!ENTER', function () { return _this.endEditToNeighbor(Vectors.e); })
            .on('!TAB', function () { return _this.endEditToNeighbor(Vectors.e); })
            .on('!SHIFT+TAB', function () { return _this.endEditToNeighbor(Vectors.w); })
            .on('UP_ARROW', function () { return _this.endEditToNeighbor(Vectors.n); })
            .on('DOWN_ARROW', function () { return _this.endEditToNeighbor(Vectors.s); })
            .on('RIGHT_ARROW', function () { if (!_this.isEditingDetailed) {
            _this.endEditToNeighbor(Vectors.e);
        } })
            .on('LEFT_ARROW', function () { if (!_this.isEditingDetailed) {
            _this.endEditToNeighbor(Vectors.w);
        } });
        MouseInput_1.MouseInput.for(this.input.root)
            .on('DOWN:PRIMARY', function () { return _this.isEditingDetailed = true; });
        KeyInput_1.KeyInput.for(this.grid.root)
            .on('!DELETE', function () { return _this.erase(); })
            .on('!BACKSPACE', function () { return _this.beginEdit(''); });
        MouseInput_1.MouseInput.for(this.grid.root)
            .on('DBLCLICK:PRIMARY', function () { return _this.beginEdit(null); });
        grid.on('keypress', function (e) { return _this.beginEdit(String.fromCharCode(e.charCode)); });
        kernel.routines.hook('before:doSelect', function () { return _this.endEdit(true); });
    };
    Object.defineProperty(EditingExtension.prototype, "primarySelector", {
        get: function () {
            return this.grid.kernel.variables.get('primarySelector');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EditingExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    EditingExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        var onBash = function () {
            Dom.fit(layer, target);
            t.position();
        };
        this.grid.on('bash', onBash);
        onBash();
        this.layer = layer;
        this.input = Input.create(layer);
    };
    EditingExtension.prototype.beginEdit = function (override) {
        if (this.isEditing) {
            return false;
        }
        var input = this.input;
        var cell = this.grid.model.findCell(this.selection[0]);
        if (is_readonly(cell)) {
            return false;
        }
        if (!!override || override === '') {
            input.val(override);
        }
        else {
            input.val(cell.value);
        }
        input.goto(this.primarySelector.viewRect);
        input.focus();
        this.isEditingDetailed = false;
        this.isEditing = true;
        return true;
    };
    EditingExtension.prototype.endEdit = function (commit) {
        if (commit === void 0) { commit = true; }
        if (!this.isEditing)
            return false;
        var _a = this, grid = _a.grid, input = _a.input, selection = _a.selection;
        var newValue = input.val();
        input.hide();
        input.val('');
        grid.focus();
        if (commit && !!selection.length) {
            this.commitUniform(selection.slice(0, 1), newValue);
        }
        this.isEditing = false;
        this.isEditingDetailed = false;
        return true;
    };
    EditingExtension.prototype.endEditToNeighbor = function (vector, commit) {
        if (commit === void 0) { commit = true; }
        if (this.endEdit(commit)) {
            this.grid.kernel.commands.exec('selectNeighbor', vector);
            return true;
        }
        return false;
    };
    EditingExtension.prototype.erase = function () {
        var selection = this.selection;
        if (this.isEditing)
            return;
        this.commitUniform(selection, '');
    };
    EditingExtension.prototype.commitUniform = function (cells, uniformValue) {
        var changes = new GridChangeSet();
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var ref = cells_1[_i];
            changes.put(ref, uniformValue, false);
        }
        this.commit(changes);
    };
    EditingExtension.prototype.commit = function (changes) {
        var grid = this.grid;
        var compiled = changes.compile(grid.model);
        if (compiled.length) {
            grid.emit('input', { changes: compiled });
        }
    };
    return EditingExtension;
}());
__decorate([
    Extensibility_1.variable(),
    __metadata("design:type", Input)
], EditingExtension.prototype, "input", void 0);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], EditingExtension.prototype, "beginEdit", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], EditingExtension.prototype, "endEdit", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "erase", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "commitUniform", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GridChangeSet]),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "commit", null);
exports.EditingExtension = EditingExtension;
var Input = (function (_super) {
    __extends(Input, _super);
    function Input() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Input.create = function (container) {
        var root = document.createElement('input');
        root.type = 'text';
        root.className = 'grid-input';
        container.appendChild(root);
        Dom.css(root, {
            pointerEvents: 'auto',
            display: 'none',
            position: 'absolute',
            left: '0px',
            top: '0px',
            padding: '0',
            margin: '0',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
        });
        return new Input(root);
    };
    Input.prototype.goto = function (viewRect, autoShow) {
        if (autoShow === void 0) { autoShow = true; }
        _super.prototype.goto.call(this, viewRect);
        Dom.css(this.root, {
            left: viewRect.left + 2 + "px",
            top: viewRect.top + 2 + "px",
            width: viewRect.width + "px",
            height: viewRect.height + "px",
        });
    };
    Input.prototype.focus = function () {
        var root = this.root;
        setTimeout(function () {
            root.focus();
            root.setSelectionRange(root.value.length, root.value.length);
        }, 0);
    };
    Input.prototype.val = function (value) {
        if (value !== undefined) {
            this.root.value = value;
        }
        return this.root.value;
    };
    return Input;
}(Widget_1.AbsWidgetBase));
function is_readonly(cell) {
    return cell['readonly'] === true || cell['mutable'] === false;
}
},{"../../geom/Point":18,"../../input/KeyInput":24,"../../input/MouseInput":28,"../../misc/Dom":30,"../../misc/Util":33,"../../ui/Extensibility":41,"../../ui/Widget":44,"tether":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
var Padding_1 = require("../../geom/Padding");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var ScrollerExtension = (function () {
    function ScrollerExtension(scrollerWidth) {
        this.scrollerWidth = scrollerWidth;
        this.scrollerWidth = Util_1.coalesce(scrollerWidth, detect_native_scroller_width());
    }
    ScrollerExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        //Set padding right and bottom to scroller width to prevent overlap
        grid.padding = new Padding_1.Padding(grid.padding.top, grid.padding.right + this.scrollerWidth, grid.padding.bottom + this.scrollerWidth, grid.padding.left);
        grid.on('invalidate', function () { return _this.alignElements(); });
        grid.on('scroll', function () { return _this.alignElements(); });
    };
    ScrollerExtension.prototype.createElements = function (target) {
        //ScrollerExtension is a special case, we need to modify the grid container element in order
        //to reliability enable all scroll interaction without logs of emulation and buggy crap.  We
        //inject a wedge element that simulates the overflow for the container scroll bars and then
        //hold the grid in place while mirroring the scroll property against the container scorll 
        //position. Vuala!
        var container = this.grid.container;
        container.addEventListener('scroll', this.onContainerScroll.bind(this));
        Dom.css(container, {
            overflow: 'auto',
        });
        var wedge = this.wedge = document.createElement('div');
        Dom.css(wedge, { pointerEvents: 'none', });
        container.appendChild(wedge);
        this.alignElements();
    };
    ScrollerExtension.prototype.alignElements = function () {
        var grid = this.grid;
        var conatiner = grid.container;
        Dom.css(grid.root, {
            position: 'absolute',
            left: (grid.scrollLeft) + 'px',
            top: (grid.scrollTop) + 'px',
        });
        Dom.css(this.wedge, {
            width: grid.virtualWidth - this.scrollerWidth + "px",
            height: grid.virtualHeight - this.scrollerWidth + "px",
        });
        if (conatiner.scrollLeft != grid.scrollLeft) {
            conatiner.scrollLeft = grid.scrollLeft;
        }
        if (conatiner.scrollTop != grid.scrollTop) {
            conatiner.scrollTop = grid.scrollTop;
        }
    };
    ScrollerExtension.prototype.onContainerScroll = function () {
        var grid = this.grid;
        var maxScroll = new Point_1.Point(grid.virtualWidth - grid.width, grid.virtualHeight - grid.height);
        grid.scroll = new Point_1.Point(grid.container.scrollLeft, grid.container.scrollTop)
            .clamp(Point_1.Point.empty, maxScroll);
    };
    return ScrollerExtension;
}());
exports.ScrollerExtension = ScrollerExtension;
function detect_native_scroller_width() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);
    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";
    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);
    var widthWithScroll = inner.offsetWidth;
    // remove divs
    outer.parentNode.removeChild(outer);
    return widthNoScroll - widthWithScroll;
}
},{"../../geom/Padding":17,"../../geom/Point":18,"../../misc/Dom":30,"../../misc/Util":33}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var KeyInput_1 = require("../../input/KeyInput");
var Point_1 = require("../../geom/Point");
var Rect_1 = require("../../geom/Rect");
var MouseInput_1 = require("../../input/MouseInput");
var MouseDragEventSupport_1 = require("../../input/MouseDragEventSupport");
var Widget_1 = require("../../ui/Widget");
var Extensibility_1 = require("../../ui/Extensibility");
var Tether = require("tether");
var Dom = require("../../misc/Dom");
var Vectors = {
    nw: new Point_1.Point(-1, -1),
    n: new Point_1.Point(0, -1),
    ne: new Point_1.Point(1, -1),
    e: new Point_1.Point(1, 0),
    se: new Point_1.Point(1, 1),
    s: new Point_1.Point(0, 1),
    sw: new Point_1.Point(-1, 1),
    w: new Point_1.Point(-1, 0),
};
var SelectorExtension = (function () {
    function SelectorExtension() {
        this.canSelect = true;
        this.selection = [];
    }
    SelectorExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(grid)
            .on('!TAB', function () { return _this.selectNeighbor(Vectors.e); })
            .on('!SHIFT+TAB', function () { return _this.selectNeighbor(Vectors.w); })
            .on('!RIGHT_ARROW', function () { return _this.selectNeighbor(Vectors.e); })
            .on('!LEFT_ARROW', function () { return _this.selectNeighbor(Vectors.w); })
            .on('!UP_ARROW', function () { return _this.selectNeighbor(Vectors.n); })
            .on('!DOWN_ARROW', function () { return _this.selectNeighbor(Vectors.s); })
            .on('!CTRL+RIGHT_ARROW', function () { return _this.selectEdge(Vectors.e); })
            .on('!CTRL+LEFT_ARROW', function () { return _this.selectEdge(Vectors.w); })
            .on('!CTRL+UP_ARROW', function () { return _this.selectEdge(Vectors.n); })
            .on('!CTRL+DOWN_ARROW', function () { return _this.selectEdge(Vectors.s); })
            .on('!CTRL+A', function () { return _this.selectAll(); })
            .on('!HOME', function () { return _this.selectBorder(Vectors.w); })
            .on('!CTRL+HOME', function () { return _this.selectBorder(Vectors.nw); })
            .on('!END', function () { return _this.selectBorder(Vectors.e); })
            .on('!CTRL+END', function () { return _this.selectBorder(Vectors.se); });
        MouseDragEventSupport_1.MouseDragEventSupport.enable(grid.root);
        MouseInput_1.MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', function (e) { return _this.selectLine(new Point_1.Point(e.gridX, e.gridY)); })
            .on('DOWN:PRIMARY', function (e) { return _this.beginSelectGesture(e.gridX, e.gridY); })
            .on('DRAG:PRIMARY', function (e) { return _this.updateSelectGesture(e.gridX, e.gridY); })
            .on('UP:PRIMARY', function (e) { return _this.endSelectGesture(); });
        grid.on('invalidate', function () { return _this.reselect(false); });
        grid.on('scroll', function () { return _this.alignSelectors(false); });
        kernel.variables.define('isSelecting', {
            get: function () { return !!_this.selectGesture; }
        });
    };
    SelectorExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        var onBash = function () {
            Dom.fit(layer, target);
            t.position();
        };
        this.grid.on('bash', onBash);
        onBash();
        this.layer = layer;
        this.primarySelector = Selector.create(layer, true);
        this.captureSelector = Selector.create(layer, false);
    };
    SelectorExtension.prototype.select = function (cells, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        this.doSelect(cells, autoScroll);
        this.alignSelectors(true);
    };
    SelectorExtension.prototype.selectAll = function () {
        this.select(this.grid.model.cells.map(function (x) { return x.ref; }));
    };
    SelectorExtension.prototype.selectBorder = function (vector, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        var ref = this.selection[0] || null;
        if (ref) {
            vector = vector.normalize();
            var startCell = grid.model.findCell(ref);
            var xy = { x: startCell.colRef, y: startCell.rowRef };
            if (vector.x < 0) {
                xy.x = 0;
            }
            if (vector.x > 0) {
                xy.x = grid.modelWidth - 1;
            }
            if (vector.y < 0) {
                xy.y = 0;
            }
            if (vector.y > 0) {
                xy.y = grid.modelHeight - 1;
            }
            var resultCell = grid.model.locateCell(xy.x, xy.y);
            if (resultCell) {
                this.select([resultCell.ref], autoScroll);
            }
        }
    };
    SelectorExtension.prototype.selectEdge = function (vector, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        vector = vector.normalize();
        var empty = function (cell) { return (cell.value === '' || cell.value === '0' || cell.value === undefined || cell.value === null); };
        var ref = this.selection[0] || null;
        if (ref) {
            var startCell = grid.model.findCell(ref);
            var currCell = grid.model.findCellNeighbor(startCell.ref, vector);
            var resultCell = null;
            if (!currCell)
                return;
            while (true) {
                var a = currCell;
                var b = grid.model.findCellNeighbor(a.ref, vector);
                if (!a || !b) {
                    resultCell = !!a ? a : null;
                    break;
                }
                if (empty(a) + empty(b) == 1) {
                    resultCell = empty(a) ? b : a;
                    break;
                }
                currCell = b;
            }
            if (resultCell) {
                this.select([resultCell.ref], autoScroll);
            }
        }
    };
    SelectorExtension.prototype.selectLine = function (gridPt, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        var ref = this.selection[0] || null;
        if (!ref)
            return;
        var startPt = grid.getCellGridRect(ref).topLeft();
        var lineRect = Rect_1.Rect.fromPoints(startPt, gridPt);
        var cellRefs = grid.getCellsInGridRect(lineRect).map(function (x) { return x.ref; });
        cellRefs.splice(cellRefs.indexOf(ref), 1);
        cellRefs.splice(0, 0, ref);
        this.select(cellRefs, autoScroll);
    };
    SelectorExtension.prototype.selectNeighbor = function (vector, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        vector = vector.normalize();
        var ref = this.selection[0] || null;
        if (ref) {
            var cell = grid.model.findCellNeighbor(ref, vector);
            if (cell) {
                this.select([cell.ref], autoScroll);
            }
        }
    };
    SelectorExtension.prototype.reselect = function (autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var _a = this, grid = _a.grid, selection = _a.selection;
        var remaining = selection.filter(function (x) { return !!grid.model.findCell(x); });
        if (remaining.length != selection.length) {
            this.select(remaining, autoScroll);
        }
    };
    SelectorExtension.prototype.beginSelectGesture = function (gridX, gridY) {
        var pt = new Point_1.Point(gridX, gridY);
        var cell = this.grid.getCellAtViewPoint(pt);
        if (!cell)
            return;
        this.selectGesture = {
            start: cell.ref,
            end: cell.ref,
        };
        this.select([cell.ref]);
    };
    SelectorExtension.prototype.updateSelectGesture = function (gridX, gridY) {
        var _a = this, grid = _a.grid, selectGesture = _a.selectGesture;
        var pt = new Point_1.Point(gridX, gridY);
        var cell = grid.getCellAtViewPoint(pt);
        if (!cell || selectGesture.end === cell.ref)
            return;
        selectGesture.end = cell.ref;
        var region = Rect_1.Rect.fromMany([
            grid.getCellGridRect(selectGesture.start),
            grid.getCellGridRect(selectGesture.end)
        ]);
        var cellRefs = grid.getCellsInGridRect(region)
            .map(function (x) { return x.ref; });
        if (cellRefs.length > 1) {
            cellRefs.splice(cellRefs.indexOf(selectGesture.start), 1);
            cellRefs.splice(0, 0, selectGesture.start);
        }
        this.select(cellRefs, cellRefs.length == 1);
    };
    SelectorExtension.prototype.endSelectGesture = function () {
        this.selectGesture = null;
    };
    SelectorExtension.prototype.doSelect = function (cells, autoScroll) {
        if (cells === void 0) { cells = []; }
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        if (!this.canSelect)
            return;
        if (cells.length) {
            this.selection = cells;
            if (autoScroll) {
                var primaryRect = grid.getCellViewRect(cells[0]);
                grid.scrollTo(primaryRect);
            }
        }
        else {
            this.selection = [];
            this.selectGesture = null;
        }
    };
    SelectorExtension.prototype.alignSelectors = function (animate) {
        var _a = this, grid = _a.grid, selection = _a.selection, primarySelector = _a.primarySelector, captureSelector = _a.captureSelector;
        if (selection.length) {
            var primaryRect = grid.getCellViewRect(selection[0]);
            primarySelector.goto(primaryRect, animate);
            //TODO: Improve the shit out of this:
            var captureRect = Rect_1.Rect.fromMany(selection.map(function (x) { return grid.getCellViewRect(x); }));
            captureSelector.goto(captureRect, animate);
            captureSelector.toggle(selection.length > 1);
        }
        else {
            primarySelector.hide();
            captureSelector.hide();
        }
    };
    return SelectorExtension;
}());
__decorate([
    Extensibility_1.variable(),
    __metadata("design:type", Boolean)
], SelectorExtension.prototype, "canSelect", void 0);
__decorate([
    Extensibility_1.variable(false),
    __metadata("design:type", Array)
], SelectorExtension.prototype, "selection", void 0);
__decorate([
    Extensibility_1.variable(false),
    __metadata("design:type", Selector)
], SelectorExtension.prototype, "primarySelector", void 0);
__decorate([
    Extensibility_1.variable(false),
    __metadata("design:type", Selector)
], SelectorExtension.prototype, "captureSelector", void 0);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "select", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectAll", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectBorder", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectEdge", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectLine", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectNeighbor", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Boolean]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "doSelect", null);
exports.SelectorExtension = SelectorExtension;
var Selector = (function (_super) {
    __extends(Selector, _super);
    function Selector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Selector.create = function (container, primary) {
        if (primary === void 0) { primary = false; }
        var root = document.createElement('div');
        root.className = 'grid-selector ' + (primary ? 'grid-selector-primary' : '');
        container.appendChild(root);
        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });
        return new Selector(root);
    };
    return Selector;
}(Widget_1.AbsWidgetBase));
},{"../../geom/Point":18,"../../geom/Rect":19,"../../input/KeyInput":24,"../../input/MouseDragEventSupport":26,"../../input/MouseInput":28,"../../misc/Dom":30,"../../ui/Extensibility":41,"../../ui/Widget":44,"tether":5}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JavaScriptComputeEngine_1 = require("./JavaScriptComputeEngine");
var EditingExtension_1 = require("../common/EditingExtension");
var ComputeExtension = (function () {
    function ComputeExtension(engine) {
        this.noCapture = false;
        this.engine = engine || new JavaScriptComputeEngine_1.JavaScriptComputeEngine();
    }
    Object.defineProperty(ComputeExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    ComputeExtension.prototype.init = function (grid, kernel) {
        this.grid = grid;
        this.engine.connect(grid);
        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
        grid.on('invalidate', this.reload.bind(this));
    };
    ComputeExtension.prototype.reload = function () {
        var _a = this, engine = _a.engine, grid = _a.grid;
        var program = {};
        engine.clear();
        for (var _i = 0, _b = grid.model.cells; _i < _b.length; _i++) {
            var cell = _b[_i];
            var formula = cell['formula'];
            if (!!formula) {
                engine.program(cell.ref, formula);
            }
        }
        this.noCapture = true;
        grid.exec('commit', engine.compute());
        this.noCapture = false;
    };
    ComputeExtension.prototype.beginEditOverride = function (override, impl) {
        var _a = this, engine = _a.engine, selection = _a.selection;
        if (!selection[0]) {
            return false;
        }
        if (!override && override !== '') {
            override = engine.getFormula(selection[0]) || null;
        }
        return impl(override);
    };
    ComputeExtension.prototype.commitOverride = function (changes, impl) {
        var _a = this, engine = _a.engine, grid = _a.grid;
        if (!this.noCapture) {
            var scope = new EditingExtension_1.GridChangeSet();
            var computeList = [];
            for (var _i = 0, _b = changes.contents(); _i < _b.length; _i++) {
                var tm = _b[_i];
                var cell = grid.model.findCell(tm.ref);
                if (cell['readonly'] !== true && cell['mutable'] !== false) {
                    if (tm.value.length > 0 && tm.value[0] === '=') {
                        engine.program(tm.ref, tm.value);
                    }
                    else {
                        engine.clear([tm.ref]);
                        scope.put(tm.ref, tm.value, tm.cascaded);
                    }
                }
                computeList.push(tm.ref);
            }
            if (computeList.length) {
                changes = engine.compute(computeList, scope);
            }
        }
        impl(changes);
    };
    return ComputeExtension;
}());
exports.ComputeExtension = ComputeExtension;
},{"../common/EditingExtension":8,"./JavaScriptComputeEngine":12}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
var EditingExtension_1 = require("../common/EditingExtension");
var GridRange_1 = require("../../model/GridRange");
var WatchManager_1 = require("./WatchManager");
var RefExtract = /(?!.*['"`])[A-Za-z]+[0-9]+:?([A-Za-z]+[0-9]+)?/g;
var SupportFunctions = {
    //Math:
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    //Custom:
    avg: function (values) {
        return SupportFunctions.sum(values) / values.length;
    },
    sum: function (values) {
        if (!Array.isArray(values))
            values = [values];
        return values.reduce(function (t, x) { return t + x; }, 0);
    },
};
var JavaScriptComputeEngine = (function () {
    function JavaScriptComputeEngine() {
        this.formulas = {};
        this.cache = {};
        this.watches = new WatchManager_1.WatchManager();
    }
    JavaScriptComputeEngine.prototype.getFormula = function (cellRef) {
        return this.formulas[cellRef] || undefined;
    };
    JavaScriptComputeEngine.prototype.clear = function (cellRefs) {
        if (!!cellRefs && !!cellRefs.length) {
            for (var _i = 0, cellRefs_1 = cellRefs; _i < cellRefs_1.length; _i++) {
                var cr = cellRefs_1[_i];
                delete this.formulas[cr];
                this.watches.unwatch(cr);
            }
        }
        else {
            this.formulas = {};
            this.watches.clear();
        }
    };
    JavaScriptComputeEngine.prototype.connect = function (grid) {
        this.clear();
        this.grid = grid;
    };
    JavaScriptComputeEngine.prototype.evaluate = function (formula, changeScope) {
        var func = this.compile(formula);
        return (func(changeScope || new EditingExtension_1.GridChangeSet()) || 0).toString();
    };
    JavaScriptComputeEngine.prototype.compute = function (cellRefs, scope, cascade) {
        if (cellRefs === void 0) { cellRefs = []; }
        if (scope === void 0) { scope = new EditingExtension_1.GridChangeSet(); }
        if (cascade === void 0) { cascade = true; }
        var _a = this, grid = _a.grid, formulas = _a.formulas;
        var lookup = Util_1.index(cellRefs, function (x) { return x; });
        var targets = (!!cellRefs.length ? cellRefs : Object.keys(this.formulas))
            .map(function (x) { return grid.model.findCell(x); });
        if (cascade) {
            targets = this.cascadeTargets(targets);
        }
        for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
            var cell = targets_1[_i];
            var formula = formulas[cell.ref];
            if (formula) {
                var result = this.evaluate(formula, scope);
                scope.put(cell.ref, result, !lookup[cell.ref]);
            }
        }
        return scope;
    };
    JavaScriptComputeEngine.prototype.inspect = function (formula) {
        var exprs = [];
        var result = null;
        while (result = RefExtract.exec(formula)) {
            if (!result.length)
                continue;
            exprs.push(result[0]);
        }
        return exprs;
    };
    JavaScriptComputeEngine.prototype.program = function (cellRef, formula) {
        var _this = this;
        this.formulas[cellRef] = formula;
        var exprs = this.inspect(formula);
        var dpnRanges = exprs.map(function (x) { return GridRange_1.GridRange.select(_this.grid.model, x).ltr; });
        var dpns = Util_1.flatten(dpnRanges).map(function (x) { return x.ref; });
        if (dpns.length) {
            this.watches.watch(cellRef, dpns);
        }
    };
    JavaScriptComputeEngine.prototype.compile = function (formula) {
        function find(formula, ref) {
            for (var i = 0; i < formula.length; i++) {
                if (formula[i] == ref[0]) {
                    if (formula.substr(i, ref.length) === ref) {
                        var nc = formula[i + ref.length];
                        if (!nc || !nc.match(/\w/)) {
                            return i;
                        }
                    }
                }
            }
            return -1;
        }
        try {
            //Store key separately because we change the formula...
            var cacheKey = formula;
            var func = this.cache[cacheKey];
            if (!func) {
                var exprs = this.inspect(formula);
                for (var _i = 0, exprs_1 = exprs; _i < exprs_1.length; _i++) {
                    var x = exprs_1[_i];
                    var idx = find(formula, x);
                    if (idx >= 0) {
                        formula = formula.substring(0, idx) + ("expr('" + x + "', arguments[1])") + formula.substring(idx + x.length);
                    }
                }
                var functions = Util_1.extend({}, SupportFunctions);
                functions.expr = this.resolve.bind(this);
                var code = ("with (arguments[0]) { try { return (" + formula.substr(1) + "); } catch (e) { console.error(e); return 0; } }").toLowerCase();
                func = this.cache[cacheKey] = new Function(code).bind(null, functions);
            }
            return func;
        }
        catch (e) {
            console.error('compile:', e);
            console.error(formula);
            return function (x) { return 0; };
        }
    };
    JavaScriptComputeEngine.prototype.cascadeTargets = function (cells) {
        var _a = this, grid = _a.grid, formulas = _a.formulas, watches = _a.watches;
        var list = [];
        var alreadyPushed = {};
        var visit = function (cell) {
            if (alreadyPushed[cell.ref] === true)
                return;
            var dependencies = watches.getObserversOf(cell.ref)
                .map(function (x) { return grid.model.findCell(x); });
            for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
                var dc = dependencies_1[_i];
                visit(dc);
            }
            if (!!formulas[cell.ref]) {
                list.splice(0, 0, cell);
            }
            alreadyPushed[cell.ref] = true;
        };
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var c = cells_1[_i];
            visit(c);
        }
        return list;
    };
    JavaScriptComputeEngine.prototype.resolve = function (expr, changeScope) {
        var _this = this;
        var values = GridRange_1.GridRange
            .select(this.grid.model, expr)
            .ltr
            .map(function (x) { return _this.coalesceFloat(changeScope.get(x.ref), x.value); });
        return values.length < 2
            ? (values[0] || 0)
            : values;
    };
    JavaScriptComputeEngine.prototype.coalesceFloat = function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        for (var _a = 0, values_1 = values; _a < values_1.length; _a++) {
            var v = values_1[_a];
            if (v !== undefined) {
                return parseFloat(v) || 0;
            }
        }
        return 0;
    };
    return JavaScriptComputeEngine;
}());
exports.JavaScriptComputeEngine = JavaScriptComputeEngine;
},{"../../misc/Util":33,"../../model/GridRange":34,"../common/EditingExtension":8,"./WatchManager":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WatchManager = (function () {
    function WatchManager() {
        this.observing = {};
        this.observed = {};
    }
    WatchManager.prototype.clear = function () {
        this.observing = {};
        this.observed = {};
    };
    WatchManager.prototype.getObserversOf = function (cellRef) {
        return this.observed[cellRef] || [];
    };
    WatchManager.prototype.getObservedBy = function (cellRef) {
        return this.observing[cellRef] || [];
    };
    WatchManager.prototype.watch = function (observer, subjects) {
        if (!subjects || !subjects.length)
            return;
        this.observing[observer] = subjects;
        for (var _i = 0, subjects_1 = subjects; _i < subjects_1.length; _i++) {
            var s = subjects_1[_i];
            var list = this.observed[s] || (this.observed[s] = []);
            list.push(observer);
        }
    };
    WatchManager.prototype.unwatch = function (observer) {
        var subjects = this.getObservedBy(observer);
        delete this.observing[observer];
        for (var _i = 0, subjects_2 = subjects; _i < subjects_2.length; _i++) {
            var s = subjects_2[_i];
            var list = this.observed[s] || [];
            var ix = list.indexOf(observer);
            if (ix >= 0) {
                list.splice(ix, 1);
            }
        }
    };
    return WatchManager;
}());
exports.WatchManager = WatchManager;
},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../../geom/Rect");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var Tether = require("tether");
var ClickZoneExtension = (function () {
    function ClickZoneExtension() {
    }
    Object.defineProperty(ClickZoneExtension.prototype, "isSelecting", {
        get: function () {
            return this.grid.kernel.variables.get('isSelecting');
        },
        enumerable: true,
        configurable: true
    });
    ClickZoneExtension.prototype.init = function (grid, kernel) {
        this.grid = grid;
        this.createElements(grid.root);
        this.layer.addEventListener('click', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('dblclick', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousemove', this.onGlobalMouseMove.bind(this));
        grid.on('mousemove', this.onMouseMove.bind(this));
    };
    ClickZoneExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        var onBash = function () {
            Dom.fit(layer, target);
            t.position();
        };
        this.grid.on('bash', onBash);
        onBash();
        this.layer = layer;
    };
    ClickZoneExtension.prototype.switchZone = function (czs, sourceEvent) {
        var _a = this, grid = _a.grid, layer = _a.layer;
        if (hash(this.current) === hash(czs))
            return;
        if (this.current) {
            grid.emit('zoneexit', create_event('zoneexit', this.current, sourceEvent));
        }
        this.current = czs;
        if (czs) {
            layer.style.pointerEvents = 'all';
            grid.emit('zoneenter', create_event('zoneenter', this.current, sourceEvent));
        }
        else {
            layer.style.pointerEvents = 'none';
        }
    };
    ClickZoneExtension.prototype.forwardLayerEvent = function (e) {
        var _a = this, grid = _a.grid, lastGridPt = _a.lastGridPt;
        e['gridX'] = lastGridPt.x;
        e['gridY'] = lastGridPt.y;
        var type = 'zone' + e.type;
        grid.focus();
        grid.emit(type, create_event(type, this.current, e));
    };
    ClickZoneExtension.prototype.onMouseMove = function (e) {
        var _this = this;
        var grid = this.grid;
        var mousePt = this.lastGridPt = new Point_1.Point(e.offsetX, e.offsetY);
        var cell = grid.getCellAtViewPoint(mousePt);
        if (cell) {
            var viewRect = grid.getCellViewRect(cell.ref);
            var zones = (cell['zones'] || []);
            var target = zones
                .filter(function (x) { return _this.test(cell, x, mousePt); })[0] || null;
            if (!!target) {
                this.switchZone({ cell: cell, zone: target }, e);
            }
            else {
                this.switchZone(null, e);
            }
        }
        else {
            this.switchZone(null, e);
        }
    };
    ClickZoneExtension.prototype.onGlobalMouseMove = function (e) {
        var grid = this.grid;
        if (!!this.current) {
            var gridRect = Rect_1.Rect.fromLike(grid.root.getBoundingClientRect());
            var mousePt = new Point_1.Point(e.clientX, e.clientY);
            if (!gridRect.contains(mousePt)) {
                this.switchZone(null, e);
            }
        }
    };
    ClickZoneExtension.prototype.test = function (cell, zone, pt) {
        var viewRect = this.grid.getCellViewRect(cell.ref);
        var zoneRect = Rect_1.Rect.fromLike(zone);
        if (zone.mode === 'rel') {
            zoneRect = new Rect_1.Rect(viewRect.width * (zoneRect.left / 100), viewRect.height * (zoneRect.top / 100), viewRect.width * (zoneRect.width / 100), viewRect.height * (zoneRect.height / 100));
        }
        if (zone.mode === 'abs-alt') {
            zoneRect = new Rect_1.Rect(viewRect.width - zoneRect.left - zoneRect.height, viewRect.height - zoneRect.top - zoneRect.height, zoneRect.width, zoneRect.height);
        }
        return zoneRect.offset(viewRect.topLeft()).contains(pt);
    };
    return ClickZoneExtension;
}());
exports.ClickZoneExtension = ClickZoneExtension;
function create_event(type, czs, source) {
    var event = (new MouseEvent(type, source));
    // event.gridX = source.gridX;
    // event.gridY = source.gridY;
    event.cell = czs.cell;
    event.zone = czs.zone;
    return event;
}
function hash(czs) {
    if (!czs)
        return '';
    return [czs.cell.ref, czs.zone.left, czs.zone.top, czs.zone.width, czs.zone.height]
        .join(':');
}
},{"../../geom/Point":18,"../../geom/Rect":19,"../../misc/Dom":30,"tether":5}],15:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var HistoryManager_1 = require("./HistoryManager");
var Util_1 = require("../../misc/Util");
var EditingExtension_1 = require("../common/EditingExtension");
var KeyInput_1 = require("../../input/KeyInput");
var Extensibility_1 = require("../../ui/Extensibility");
var HistoryExtension = (function () {
    function HistoryExtension(manager) {
        this.noCapture = false;
        this.suspended = false;
        this.manager = manager || new HistoryManager_1.DefaultHistoryManager();
    }
    HistoryExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', function () { return _this.undo(); })
            .on('!CTRL+KEY_Y', function () { return _this.redo(); });
        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
        grid.kernel.routines.hook('after:commit', this.afterCommit.bind(this));
    };
    HistoryExtension.prototype.undo = function () {
        this.manager.undo();
    };
    HistoryExtension.prototype.redo = function () {
        this.manager.redo();
    };
    HistoryExtension.prototype.push = function (action) {
        this.manager.push(action);
    };
    HistoryExtension.prototype.clear = function () {
        this.manager.clear();
    };
    HistoryExtension.prototype.suspend = function (flag) {
        if (flag === void 0) { flag = true; }
        this.suspended = flag;
    };
    HistoryExtension.prototype.beforeCommit = function (changes) {
        if (this.noCapture || this.suspended)
            return;
        var model = this.grid.model;
        this.capture = Util_1.zipPairs(changes.refs().map(function (r) { return [r, model.findCell(r).value]; }));
    };
    HistoryExtension.prototype.afterCommit = function (changes) {
        if (this.noCapture || !this.capture || this.suspended)
            return;
        var snapshots = this.createSnapshots(this.capture, changes);
        if (snapshots.length) {
            var action = this.createEditAction(snapshots);
            this.push(action);
        }
        this.capture = null;
    };
    HistoryExtension.prototype.createSnapshots = function (capture, changes) {
        var model = this.grid.model;
        var batch = [];
        var compiled = changes.compile(model);
        for (var _i = 0, _a = compiled.filter(function (x) { return !x.cascaded; }); _i < _a.length; _i++) {
            var entry = _a[_i];
            batch.push({
                ref: entry.cell.ref,
                newVal: entry.value,
                oldVal: capture[entry.cell.ref],
                cascaded: entry.cascaded,
            });
        }
        return batch;
    };
    HistoryExtension.prototype.createEditAction = function (snapshots) {
        var _this = this;
        return {
            apply: function () {
                _this.invokeSilentCommit(create_changes(snapshots, function (x) { return x.newVal; }));
            },
            rollback: function () {
                _this.invokeSilentCommit(create_changes(snapshots, function (x) { return x.oldVal; }));
            },
        };
    };
    HistoryExtension.prototype.invokeSilentCommit = function (changes) {
        var grid = this.grid;
        try {
            this.noCapture = true;
            grid.exec('commit', changes);
        }
        finally {
            this.noCapture = false;
        }
        var compiled = changes.compile(grid.model);
        var refs = compiled.filter(function (x) { return !x.cascaded; }).map(function (x) { return x.cell.ref; });
        grid.exec('select', refs);
    };
    return HistoryExtension;
}());
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HistoryExtension.prototype, "undo", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HistoryExtension.prototype, "redo", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HistoryExtension.prototype, "push", null);
__decorate([
    Extensibility_1.command('clearHistory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HistoryExtension.prototype, "clear", null);
__decorate([
    Extensibility_1.command('suspendHistory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], HistoryExtension.prototype, "suspend", null);
exports.HistoryExtension = HistoryExtension;
function create_changes(snapshots, valSelector) {
    var changeSet = new EditingExtension_1.GridChangeSet();
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        changeSet.put(s.ref, valSelector(s), s.cascaded);
    }
    return changeSet;
}
},{"../../input/KeyInput":24,"../../misc/Util":33,"../../ui/Extensibility":41,"../common/EditingExtension":8,"./HistoryManager":16}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultHistoryManager = (function () {
    function DefaultHistoryManager() {
        this.future = [];
        this.past = [];
    }
    Object.defineProperty(DefaultHistoryManager.prototype, "futureCount", {
        get: function () {
            return this.future.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DefaultHistoryManager.prototype, "pastCount", {
        get: function () {
            return this.past.length;
        },
        enumerable: true,
        configurable: true
    });
    DefaultHistoryManager.prototype.clear = function () {
        this.past = [];
        this.future = [];
    };
    DefaultHistoryManager.prototype.push = function (action) {
        this.past.push(action);
        this.future = [];
    };
    DefaultHistoryManager.prototype.redo = function () {
        if (!this.future.length) {
            return false;
        }
        var action = this.future.pop();
        action.apply();
        this.past.push(action);
        return true;
    };
    DefaultHistoryManager.prototype.undo = function () {
        if (!this.past.length) {
            return false;
        }
        var action = this.past.pop();
        action.rollback();
        this.future.push(action);
        return true;
    };
    return DefaultHistoryManager;
}());
exports.DefaultHistoryManager = DefaultHistoryManager;
},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../misc/Util");
var Padding = (function () {
    function Padding(top, right, bottom, left) {
        this.top = Util_1.coalesce(top, 0);
        this.right = Util_1.coalesce(right, this.top);
        this.bottom = Util_1.coalesce(bottom, this.top);
        this.left = Util_1.coalesce(left, this.right);
    }
    Object.defineProperty(Padding.prototype, "horizontal", {
        get: function () {
            return this.left + this.right;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Padding.prototype, "vertical", {
        get: function () {
            return this.top + this.bottom;
        },
        enumerable: true,
        configurable: true
    });
    Padding.prototype.inflate = function (by) {
        return new Padding(this.top + by, this.right + by, this.bottom + by, this.left + by);
    };
    return Padding;
}());
Padding.empty = new Padding(0, 0, 0, 0);
exports.Padding = Padding;
},{"../misc/Util":33}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point = (function () {
    function Point(x, y) {
        this.x = 0;
        this.y = 0;
        if (Array.isArray(x)) {
            this.x = (x[0]);
            this.y = (x[1]);
        }
        else {
            this.x = x;
            this.y = (y);
        }
    }
    Point.average = function (points) {
        if (!points.length) {
            return Point.empty;
        }
        var x = 0, y = 0;
        points.forEach(function (p) {
            x += p.x;
            y += p.y;
        });
        return new Point(x / points.length, y / points.length);
    };
    Point.direction = function (from, to) {
        return ptArg(to).subtract(from).normalize();
    };
    Point.create = function (source) {
        return ptArg(source);
    };
    Point.fromBuffer = function (buffer, index) {
        if (index === void 0) { index = 0; }
        return new Point(buffer[index], buffer[index + 1]);
    };
    //region Geometry
    Point.prototype.angle = function () {
        return (this.x < 0)
            ? 360 - Math.atan2(this.x, -this.y) * Point.rad2deg * -1
            : Math.atan2(this.x, -this.y) * Point.rad2deg;
    };
    Point.prototype.angleAbout = function (val) {
        var pt = ptArg(val);
        return Math.atan2(pt.cross(this), pt.dot(this));
    };
    Point.prototype.cross = function (val) {
        var pt = ptArg(val);
        return this.x * pt.y - this.y * pt.x;
    };
    Point.prototype.distance = function (to) {
        var pt = ptArg(to);
        var a = this.x - pt.x;
        var b = this.y - pt.y;
        return Math.sqrt(a * a + b * b);
    };
    Point.prototype.dot = function (val) {
        var pt = ptArg(val);
        return this.x * pt.x + this.y * pt.y;
    };
    Point.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Point.prototype.normalize = function () {
        var len = this.length();
        if (len > 0.00001) {
            return this.multiply(1 / len);
        }
        return this.clone();
    };
    Point.prototype.perp = function () {
        return new Point(this.y * -1, this.x);
    };
    Point.prototype.rperp = function () {
        return this.reverse().perp();
    };
    Point.prototype.inverse = function () {
        return new Point(this.x * -1, this.y * -1);
    };
    Point.prototype.reverse = function () {
        return new Point(this.x * -1, this.y * -1);
    };
    Point.prototype.rotate = function (radians) {
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = this.x * cos - this.y * sin;
        var ny = this.y * cos + this.x * sin;
        return new Point(nx, ny);
    };
    //endregion
    //region Arithmetic
    Point.prototype.add = function (val) {
        var pt = ptArg(val);
        if (!pt) {
            throw 'add: pt required.';
        }
        return new Point(this.x + pt.x, this.y + pt.y);
    };
    Point.prototype.divide = function (divisor) {
        return new Point(this.x / divisor, this.y / divisor);
    };
    Point.prototype.multiply = function (multipler) {
        return new Point(this.x * multipler, this.y * multipler);
    };
    Point.prototype.round = function () {
        return new Point(Math.round(this.x), Math.round(this.y));
    };
    Point.prototype.subtract = function (val) {
        var pt = ptArg(val);
        if (!pt) {
            throw 'subtract: pt required.';
        }
        return this.add(pt.reverse());
    };
    Point.prototype.clamp = function (lower, upper) {
        var x = this.x;
        if (x < lower.x)
            x = lower.x;
        if (x > upper.x)
            x = upper.x;
        var y = this.y;
        if (y < lower.y)
            y = lower.y;
        if (y > upper.y)
            y = upper.y;
        return new Point(x, y);
    };
    //endregion
    //region Conversion
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.equals = function (another) {
        return this.x === another.x && this.y === another.y;
    };
    Point.prototype.toArray = function () {
        return [this.x, this.y];
    };
    Point.prototype.toString = function () {
        return "[" + this.x + ", " + this.y + "]";
    };
    return Point;
}());
Point.rad2deg = 360 / (Math.PI * 2);
Point.deg2rad = (Math.PI * 2) / 360;
Point.empty = new Point(0, 0);
Point.max = new Point(2147483647, 2147483647);
Point.min = new Point(-2147483647, -2147483647);
Point.up = new Point(0, -1);
exports.Point = Point;
function ptArg(val) {
    if (val !== null || val !== undefined) {
        if (val instanceof Point) {
            return val;
        }
        if (val.x !== undefined && val.y !== undefined) {
            return new Point(val.x, val.y);
        }
        if (val.left !== undefined && val.top !== undefined) {
            return new Point(val.left, val.top);
        }
        if (Array.isArray(val)) {
            return new Point(val);
        }
        if (typeof (val) === 'string') {
            val = parseInt(val);
        }
        if (typeof (val) === 'number') {
            return new Point(val, val);
        }
    }
    return Point.empty;
}
},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("./Point");
var Rect = (function () {
    function Rect(left, top, width, height) {
        this.left = 0;
        this.top = 0;
        this.width = 0;
        this.height = 0;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    Rect.fromEdges = function (left, top, right, bottom) {
        return new Rect(left, top, right - left, bottom - top);
    };
    Rect.fromLike = function (like) {
        return new Rect(like.left, like.top, like.width, like.height);
    };
    Rect.fromMany = function (rects) {
        var points = [].concat.apply([], rects.map(function (x) { return x.points(); }));
        return Rect.fromPointBuffer(points);
    };
    Rect.fromPoints = function () {
        var points = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            points[_i] = arguments[_i];
        }
        return Rect.fromPointBuffer(points);
    };
    Rect.fromPointBuffer = function (points, index, length) {
        if (index !== undefined) {
            points = points.slice(index);
        }
        if (length !== undefined) {
            points = points.slice(0, length);
        }
        return Rect.fromEdges(Math.min.apply(Math, points.map(function (p) { return p.x; })), Math.min.apply(Math, points.map(function (p) { return p.y; })), Math.max.apply(Math, points.map(function (p) { return p.x; })), Math.max.apply(Math, points.map(function (p) { return p.y; })));
    };
    Object.defineProperty(Rect.prototype, "right", {
        get: function () {
            return this.left + this.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "bottom", {
        get: function () {
            return this.top + this.height;
        },
        enumerable: true,
        configurable: true
    });
    Rect.prototype.center = function () {
        return new Point_1.Point(this.left + (this.width / 2), this.top + (this.height / 2));
    };
    Rect.prototype.topLeft = function () {
        return new Point_1.Point(this.left, this.top);
    };
    Rect.prototype.points = function () {
        return [
            new Point_1.Point(this.left, this.top),
            new Point_1.Point(this.right, this.top),
            new Point_1.Point(this.right, this.bottom),
            new Point_1.Point(this.left, this.bottom),
        ];
    };
    Rect.prototype.size = function () {
        return new Point_1.Point(this.width, this.height);
    };
    Rect.prototype.offset = function (pt) {
        return new Rect(this.left + pt.x, this.top + pt.y, this.width, this.height);
    };
    Rect.prototype.contains = function (input) {
        if (input['x'] !== undefined && input['y'] !== undefined) {
            var pt = input;
            return (pt.x >= this.left
                && pt.y >= this.top
                && pt.x <= this.left + this.width
                && pt.y <= this.top + this.height);
        }
        else {
            var rect = input;
            return (rect.left >= this.left &&
                rect.top >= this.top &&
                rect.left + rect.width <= this.left + this.width &&
                rect.top + rect.height <= this.top + this.height);
        }
    };
    Rect.prototype.inflate = function (size) {
        return new Rect(this.left - size.x, this.top - size.y, this.width + size.x, this.height + size.y);
    };
    Rect.prototype.intersects = function (rect) {
        return rect.left + rect.width > this.left
            && rect.top + rect.height > this.top
            && rect.left < this.left + this.width
            && rect.top < this.top + this.height;
    };
    Rect.prototype.normalize = function () {
        if (this.width >= 0 && this.height >= 0) {
            return this;
        }
        var x = this.left;
        var y = this.top;
        var w = this.width;
        var h = this.height;
        if (w < 0) {
            x += w;
            w = Math.abs(w);
        }
        if (h < 0) {
            y += h;
            h = Math.abs(h);
        }
        return new Rect(x, y, w, h);
    };
    Rect.prototype.toString = function () {
        return "[" + this.left + ", " + this.top + ", " + this.width + ", " + this.height + "]";
    };
    return Rect;
}());
Rect.empty = new Rect(0, 0, 0, 0);
exports.Rect = Rect;
},{"./Point":18}],20:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./extensions/common/SelectorExtension"));
__export(require("./extensions/common/EditingExtension"));
__export(require("./extensions/common/ClipboardExtension"));
__export(require("./extensions/common/ScrollerExtension"));
__export(require("./extensions/history/HistoryExtension"));
__export(require("./extensions/history/HistoryManager"));
__export(require("./extensions/compute/JavaScriptComputeEngine"));
__export(require("./extensions/compute/ComputeExtension"));
__export(require("./extensions/extra/ClickZoneExtension"));
__export(require("./geom/Point"));
__export(require("./geom/Rect"));
__export(require("./misc/Base26"));
__export(require("./model/default/DefaultGridCell"));
__export(require("./model/default/DefaultGridColumn"));
__export(require("./model/default/DefaultGridModel"));
__export(require("./model/default/DefaultGridRow"));
__export(require("./model/styled/Style"));
__export(require("./model/styled/StyledGridCell"));
__export(require("./model/GridRange"));
__export(require("./ui/Extensibility"));
__export(require("./ui/GridElement"));
__export(require("./ui/GridKernel"));
__export(require("./ui/Widget"));
__export(require("./ui/internal/EventEmitter"));
var Tether = require("tether");
exports.Tether = Tether;
var Dom = require("./misc/Dom");
exports.Dom = Dom;
},{"./extensions/common/ClipboardExtension":7,"./extensions/common/EditingExtension":8,"./extensions/common/ScrollerExtension":9,"./extensions/common/SelectorExtension":10,"./extensions/compute/ComputeExtension":11,"./extensions/compute/JavaScriptComputeEngine":12,"./extensions/extra/ClickZoneExtension":14,"./extensions/history/HistoryExtension":15,"./extensions/history/HistoryManager":16,"./geom/Point":18,"./geom/Rect":19,"./misc/Base26":29,"./misc/Dom":30,"./model/GridRange":34,"./model/default/DefaultGridCell":35,"./model/default/DefaultGridColumn":36,"./model/default/DefaultGridModel":37,"./model/default/DefaultGridRow":38,"./model/styled/Style":39,"./model/styled/StyledGridCell":40,"./ui/Extensibility":41,"./ui/GridElement":42,"./ui/GridKernel":43,"./ui/Widget":44,"./ui/internal/EventEmitter":45,"tether":5}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("../misc/Util");
var EventTargetEventEmitterAdapter = (function () {
    function EventTargetEventEmitterAdapter(target) {
        this.target = target;
    }
    EventTargetEventEmitterAdapter.wrap = function (target) {
        if (!!target['addEventListener']) {
            return new EventTargetEventEmitterAdapter(target);
        }
        return target;
    };
    EventTargetEventEmitterAdapter.prototype.on = function (event, callback) {
        var _this = this;
        this.target.addEventListener(event, callback);
        return {
            cancel: function () { return _this.off(event, callback); },
        };
    };
    EventTargetEventEmitterAdapter.prototype.off = function (event, callback) {
        this.target.removeEventListener(event, callback);
    };
    EventTargetEventEmitterAdapter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.target.dispatchEvent(_.extend(new Event(event), { args: args }));
    };
    return EventTargetEventEmitterAdapter;
}());
exports.EventTargetEventEmitterAdapter = EventTargetEventEmitterAdapter;
},{"../misc/Util":33}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tracker;
var KeyCheck = (function () {
    function KeyCheck() {
    }
    KeyCheck.init = function () {
        if (!Tracker) {
            Tracker = {};
            window.addEventListener('keydown', function (e) { return Tracker[e.keyCode] = true; });
            window.addEventListener('keyup', function (e) { return Tracker[e.keyCode] = false; });
        }
    };
    KeyCheck.down = function (key) {
        return !!Tracker && !!Tracker[key];
    };
    return KeyCheck;
}());
exports.KeyCheck = KeyCheck;
},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Keys_1 = require("./Keys");
var KeyExpression = (function () {
    function KeyExpression(keys, exclusive) {
        this.exclusive = exclusive;
        this.ctrl = keys.some(function (x) { return x === Keys_1.Keys.CTRL; });
        this.alt = keys.some(function (x) { return x === Keys_1.Keys.ALT; });
        this.shift = keys.some(function (x) { return x === Keys_1.Keys.SHIFT; });
        this.key = keys.filter(function (x) { return x !== Keys_1.Keys.CTRL && x !== Keys_1.Keys.ALT && x !== Keys_1.Keys.SHIFT; })[0] || null;
    }
    KeyExpression.parse = function (input) {
        var exclusive = input[0] === '!';
        if (exclusive) {
            input = input.substr(1);
        }
        var keys = input
            .split(/[\s\-\+]+/)
            .map(function (x) { return Keys_1.Keys.parse(x); });
        return new KeyExpression(keys, exclusive);
    };
    KeyExpression.prototype.matches = function (keyData) {
        if (keyData instanceof KeyExpression) {
            return (this.ctrl == keyData.ctrl &&
                this.alt == keyData.alt &&
                this.shift == keyData.shift &&
                this.key == keyData.key);
        }
        else if (keyData instanceof KeyboardEvent) {
            return (this.ctrl == keyData.ctrlKey &&
                this.alt == keyData.altKey &&
                this.shift == keyData.shiftKey &&
                this.key == keyData.keyCode);
        }
        throw 'KeyExpression.matches: Invalid input';
    };
    return KeyExpression;
}());
exports.KeyExpression = KeyExpression;
},{"./Keys":25}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var KeyExpression_1 = require("./KeyExpression");
var EventTargetEventEmitterAdapter_1 = require("./EventTargetEventEmitterAdapter");
var KeyInput = (function () {
    function KeyInput(emitters) {
        this.emitters = emitters;
        this.subs = [];
    }
    KeyInput.for = function () {
        var elmts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elmts[_i] = arguments[_i];
        }
        return new KeyInput(normalize(elmts));
    };
    KeyInput.prototype.on = function (exprs, callback) {
        var _this = this;
        if (!Array.isArray(exprs)) {
            return this.on([exprs], callback);
        }
        var _loop_1 = function (re) {
            var ss = this_1.emitters.map(function (ee) { return _this.createListener(ee, KeyExpression_1.KeyExpression.parse(re), callback); });
            this_1.subs = this_1.subs.concat(ss);
        };
        var this_1 = this;
        for (var _i = 0, exprs_1 = exprs; _i < exprs_1.length; _i++) {
            var re = exprs_1[_i];
            _loop_1(re);
        }
        return this;
    };
    KeyInput.prototype.createListener = function (ee, ke, callback) {
        return ee.on('keydown', function (evt) {
            if (ke.matches(evt)) {
                if (ke.exclusive) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                callback();
            }
        });
    };
    return KeyInput;
}());
exports.KeyInput = KeyInput;
function normalize(kms) {
    return kms
        .map(function (x) { return (!!x['addEventListener'])
        ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
        : x; });
}
},{"./EventTargetEventEmitterAdapter":21,"./KeyExpression":23}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Keys = (function () {
    function Keys() {
    }
    Keys.parse = function (input, thrownOnFail) {
        if (thrownOnFail === void 0) { thrownOnFail = true; }
        switch (input.trim()) {
            case 'BACKSPACE': return Keys.BACKSPACE;
            case 'TAB': return Keys.TAB;
            case 'ENTER': return Keys.ENTER;
            case 'SHIFT': return Keys.SHIFT;
            case 'CTRL': return Keys.CTRL;
            case 'ALT': return Keys.ALT;
            case 'PAUSE': return Keys.PAUSE;
            case 'CAPS_LOCK': return Keys.CAPS_LOCK;
            case 'ESCAPE': return Keys.ESCAPE;
            case 'SPACE': return Keys.SPACE;
            case 'PAGE_UP': return Keys.PAGE_UP;
            case 'PAGE_DOWN': return Keys.PAGE_DOWN;
            case 'END': return Keys.END;
            case 'HOME': return Keys.HOME;
            case 'LEFT_ARROW': return Keys.LEFT_ARROW;
            case 'UP_ARROW': return Keys.UP_ARROW;
            case 'RIGHT_ARROW': return Keys.RIGHT_ARROW;
            case 'DOWN_ARROW': return Keys.DOWN_ARROW;
            case 'INSERT': return Keys.INSERT;
            case 'DELETE': return Keys.DELETE;
            case 'KEY_0': return Keys.KEY_0;
            case 'KEY_1': return Keys.KEY_1;
            case 'KEY_2': return Keys.KEY_2;
            case 'KEY_3': return Keys.KEY_3;
            case 'KEY_4': return Keys.KEY_4;
            case 'KEY_5': return Keys.KEY_5;
            case 'KEY_6': return Keys.KEY_6;
            case 'KEY_7': return Keys.KEY_7;
            case 'KEY_8': return Keys.KEY_8;
            case 'KEY_9': return Keys.KEY_9;
            case 'KEY_A': return Keys.KEY_A;
            case 'KEY_B': return Keys.KEY_B;
            case 'KEY_C': return Keys.KEY_C;
            case 'KEY_D': return Keys.KEY_D;
            case 'KEY_E': return Keys.KEY_E;
            case 'KEY_F': return Keys.KEY_F;
            case 'KEY_G': return Keys.KEY_G;
            case 'KEY_H': return Keys.KEY_H;
            case 'KEY_I': return Keys.KEY_I;
            case 'KEY_J': return Keys.KEY_J;
            case 'KEY_K': return Keys.KEY_K;
            case 'KEY_L': return Keys.KEY_L;
            case 'KEY_M': return Keys.KEY_M;
            case 'KEY_N': return Keys.KEY_N;
            case 'KEY_O': return Keys.KEY_O;
            case 'KEY_P': return Keys.KEY_P;
            case 'KEY_Q': return Keys.KEY_Q;
            case 'KEY_R': return Keys.KEY_R;
            case 'KEY_S': return Keys.KEY_S;
            case 'KEY_T': return Keys.KEY_T;
            case 'KEY_U': return Keys.KEY_U;
            case 'KEY_V': return Keys.KEY_V;
            case 'KEY_W': return Keys.KEY_W;
            case 'KEY_X': return Keys.KEY_X;
            case 'KEY_Y': return Keys.KEY_Y;
            case 'KEY_Z': return Keys.KEY_Z;
            case '0': return Keys.KEY_0;
            case '1': return Keys.KEY_1;
            case '2': return Keys.KEY_2;
            case '3': return Keys.KEY_3;
            case '4': return Keys.KEY_4;
            case '5': return Keys.KEY_5;
            case '6': return Keys.KEY_6;
            case '7': return Keys.KEY_7;
            case '8': return Keys.KEY_8;
            case '9': return Keys.KEY_9;
            case 'A': return Keys.KEY_A;
            case 'B': return Keys.KEY_B;
            case 'C': return Keys.KEY_C;
            case 'D': return Keys.KEY_D;
            case 'E': return Keys.KEY_E;
            case 'F': return Keys.KEY_F;
            case 'G': return Keys.KEY_G;
            case 'H': return Keys.KEY_H;
            case 'I': return Keys.KEY_I;
            case 'J': return Keys.KEY_J;
            case 'K': return Keys.KEY_K;
            case 'L': return Keys.KEY_L;
            case 'M': return Keys.KEY_M;
            case 'N': return Keys.KEY_N;
            case 'O': return Keys.KEY_O;
            case 'P': return Keys.KEY_P;
            case 'Q': return Keys.KEY_Q;
            case 'R': return Keys.KEY_R;
            case 'S': return Keys.KEY_S;
            case 'T': return Keys.KEY_T;
            case 'U': return Keys.KEY_U;
            case 'V': return Keys.KEY_V;
            case 'W': return Keys.KEY_W;
            case 'X': return Keys.KEY_X;
            case 'Y': return Keys.KEY_Y;
            case 'Z': return Keys.KEY_Z;
            case 'LEFT_META': return Keys.LEFT_META;
            case 'RIGHT_META': return Keys.RIGHT_META;
            case 'SELECT': return Keys.SELECT;
            case 'NUMPAD_0': return Keys.NUMPAD_0;
            case 'NUMPAD_1': return Keys.NUMPAD_1;
            case 'NUMPAD_2': return Keys.NUMPAD_2;
            case 'NUMPAD_3': return Keys.NUMPAD_3;
            case 'NUMPAD_4': return Keys.NUMPAD_4;
            case 'NUMPAD_5': return Keys.NUMPAD_5;
            case 'NUMPAD_6': return Keys.NUMPAD_6;
            case 'NUMPAD_7': return Keys.NUMPAD_7;
            case 'NUMPAD_8': return Keys.NUMPAD_8;
            case 'NUMPAD_9': return Keys.NUMPAD_9;
            case 'MULTIPLY': return Keys.MULTIPLY;
            case 'ADD': return Keys.ADD;
            case 'SUBTRACT': return Keys.SUBTRACT;
            case 'DECIMAL': return Keys.DECIMAL;
            case 'DIVIDE': return Keys.DIVIDE;
            case 'F1': return Keys.F1;
            case 'F2': return Keys.F2;
            case 'F3': return Keys.F3;
            case 'F4': return Keys.F4;
            case 'F5': return Keys.F5;
            case 'F6': return Keys.F6;
            case 'F7': return Keys.F7;
            case 'F8': return Keys.F8;
            case 'F9': return Keys.F9;
            case 'F10': return Keys.F10;
            case 'F11': return Keys.F11;
            case 'F12': return Keys.F12;
            case 'NUM_LOCK': return Keys.NUM_LOCK;
            case 'SCROLL_LOCK': return Keys.SCROLL_LOCK;
            case 'SEMICOLON': return Keys.SEMICOLON;
            case 'EQUALS': return Keys.EQUALS;
            case 'COMMA': return Keys.COMMA;
            case 'DASH': return Keys.DASH;
            case 'PERIOD': return Keys.PERIOD;
            case 'FORWARD_SLASH': return Keys.FORWARD_SLASH;
            case 'GRAVE_ACCENT': return Keys.GRAVE_ACCENT;
            case 'OPEN_BRACKET': return Keys.OPEN_BRACKET;
            case 'BACK_SLASH': return Keys.BACK_SLASH;
            case 'CLOSE_BRACKET': return Keys.CLOSE_BRACKET;
            case 'SINGLE_QUOTE': return Keys.SINGLE_QUOTE;
            default:
                if (thrownOnFail)
                    throw 'Invalid key: ' + input;
                else
                    return null;
        }
    };
    return Keys;
}());
Keys.BACKSPACE = 8;
Keys.TAB = 9;
Keys.ENTER = 13;
Keys.SHIFT = 16;
Keys.CTRL = 17;
Keys.ALT = 18;
Keys.PAUSE = 19;
Keys.CAPS_LOCK = 20;
Keys.ESCAPE = 27;
Keys.SPACE = 32;
Keys.PAGE_UP = 33;
Keys.PAGE_DOWN = 34;
Keys.END = 35;
Keys.HOME = 36;
Keys.LEFT_ARROW = 37;
Keys.UP_ARROW = 38;
Keys.RIGHT_ARROW = 39;
Keys.DOWN_ARROW = 40;
Keys.INSERT = 45;
Keys.DELETE = 46;
Keys.KEY_0 = 48;
Keys.KEY_1 = 49;
Keys.KEY_2 = 50;
Keys.KEY_3 = 51;
Keys.KEY_4 = 52;
Keys.KEY_5 = 53;
Keys.KEY_6 = 54;
Keys.KEY_7 = 55;
Keys.KEY_8 = 56;
Keys.KEY_9 = 57;
Keys.KEY_A = 65;
Keys.KEY_B = 66;
Keys.KEY_C = 67;
Keys.KEY_D = 68;
Keys.KEY_E = 69;
Keys.KEY_F = 70;
Keys.KEY_G = 71;
Keys.KEY_H = 72;
Keys.KEY_I = 73;
Keys.KEY_J = 74;
Keys.KEY_K = 75;
Keys.KEY_L = 76;
Keys.KEY_M = 77;
Keys.KEY_N = 78;
Keys.KEY_O = 79;
Keys.KEY_P = 80;
Keys.KEY_Q = 81;
Keys.KEY_R = 82;
Keys.KEY_S = 83;
Keys.KEY_T = 84;
Keys.KEY_U = 85;
Keys.KEY_V = 86;
Keys.KEY_W = 87;
Keys.KEY_X = 88;
Keys.KEY_Y = 89;
Keys.KEY_Z = 90;
Keys.LEFT_META = 91;
Keys.RIGHT_META = 92;
Keys.SELECT = 93;
Keys.NUMPAD_0 = 96;
Keys.NUMPAD_1 = 97;
Keys.NUMPAD_2 = 98;
Keys.NUMPAD_3 = 99;
Keys.NUMPAD_4 = 100;
Keys.NUMPAD_5 = 101;
Keys.NUMPAD_6 = 102;
Keys.NUMPAD_7 = 103;
Keys.NUMPAD_8 = 104;
Keys.NUMPAD_9 = 105;
Keys.MULTIPLY = 106;
Keys.ADD = 107;
Keys.SUBTRACT = 109;
Keys.DECIMAL = 110;
Keys.DIVIDE = 111;
Keys.F1 = 112;
Keys.F2 = 113;
Keys.F3 = 114;
Keys.F4 = 115;
Keys.F5 = 116;
Keys.F6 = 117;
Keys.F7 = 118;
Keys.F8 = 119;
Keys.F9 = 120;
Keys.F10 = 121;
Keys.F11 = 122;
Keys.F12 = 123;
Keys.NUM_LOCK = 144;
Keys.SCROLL_LOCK = 145;
Keys.SEMICOLON = 186;
Keys.EQUALS = 187;
Keys.COMMA = 188;
Keys.DASH = 189;
Keys.PERIOD = 190;
Keys.FORWARD_SLASH = 191;
Keys.GRAVE_ACCENT = 192;
Keys.OPEN_BRACKET = 219;
Keys.BACK_SLASH = 220;
Keys.CLOSE_BRACKET = 221;
Keys.SINGLE_QUOTE = 222;
exports.Keys = Keys;
},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../geom/Point");
var MouseDragEventSupport = (function () {
    function MouseDragEventSupport(elmt) {
        this.elmt = elmt;
        this.shouldDrag = false;
        this.isDragging = false;
        this.elmt.addEventListener('mousedown', this.listener = this.onTargetMouseDown.bind(this));
    }
    MouseDragEventSupport.check = function (elmt) {
        return elmt.dataset['MouseDragEventSupport'] === 'true';
    };
    MouseDragEventSupport.enable = function (elmt) {
        elmt.dataset['MouseDragEventSupport'] = 'true';
        return new MouseDragEventSupport(elmt);
    };
    MouseDragEventSupport.prototype.destroy = function () {
        this.elmt.removeEventListener('mousedown', this.listener);
    };
    MouseDragEventSupport.prototype.onTargetMouseDown = function (e) {
        //e.preventDefault();
        //e.stopPropagation();
        this.shouldDrag = true;
        this.isDragging = false;
        this.startPoint = this.lastPoint = new Point_1.Point(e.clientX, e.clientY);
        var moveHandler = this.onWindowMouseMove.bind(this);
        var upHandler = this.onWindowMouseUp.bind(this);
        this.cancel = function () {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    };
    MouseDragEventSupport.prototype.onWindowMouseMove = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var newPoint = new Point_1.Point(e.clientX, e.clientY);
        if (this.shouldDrag) {
            if (!this.isDragging) {
                this.elmt.dispatchEvent(this.createEvent('dragbegin', e));
                this.isDragging = true;
            }
            else {
                this.elmt.dispatchEvent(this.createEvent('drag', e, newPoint.subtract(this.lastPoint)));
            }
        }
        this.lastPoint = newPoint;
    };
    MouseDragEventSupport.prototype.onWindowMouseUp = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.isDragging) {
            this.elmt.dispatchEvent(this.createEvent('dragend', e));
        }
        this.shouldDrag = false;
        this.isDragging = false;
        this.lastPoint = new Point_1.Point(e.clientX, e.clientY);
        if (this.cancel) {
            this.cancel();
        }
    };
    MouseDragEventSupport.prototype.createEvent = function (type, source, dist) {
        var event = (new MouseEvent(type, source));
        event.startX = this.startPoint.x;
        event.startY = this.startPoint.y;
        if (dist) {
            event.distX = dist.x;
            event.distY = dist.y;
        }
        return event;
    };
    return MouseDragEventSupport;
}());
exports.MouseDragEventSupport = MouseDragEventSupport;
},{"../geom/Point":18}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Keys_1 = require("./Keys");
var _ = require("../misc/Util");
var KeyCheck_1 = require("./KeyCheck");
function parse_event(value) {
    value = (value || '').trim().toLowerCase();
    switch (value) {
        case 'down':
        case 'move':
        case 'up':
            return ('mouse' + value);
        case 'click':
        case 'dblclick':
        case 'down':
        case 'move':
        case 'up':
        case 'dragbegin':
        case 'drag':
        case 'dragend':
            return value;
        default:
            throw 'Invalid MouseEventType: ' + value;
    }
}
function parse_button(value) {
    value = (value || '').trim().toLowerCase();
    switch (value) {
        case 'primary':
        case 'button1':
            return 0;
        case 'secondary':
        case 'button2':
            return 1;
        case 'button3':
            return 2;
        default:
            throw 'Invalid MouseButton: ' + value;
    }
}
function divide_expression(value) {
    var parts = value.split(':');
    if (parts.length == 1) {
        parts.splice(0, 0, 'down');
    }
    return parts.slice(0, 2);
}
var MouseExpression = (function () {
    function MouseExpression(cfg) {
        this.event = null;
        this.button = null;
        this.keys = [];
        this.exclusive = false;
        _.extend(this, cfg);
    }
    MouseExpression.parse = function (input) {
        var cfg = {
            keys: [],
        };
        cfg.exclusive = input[0] === '!';
        if (cfg.exclusive) {
            input = input.substr(1);
        }
        var _a = divide_expression(input), left = _a[0], right = _a[1];
        cfg.event = parse_event(left);
        right.split(/[\s\-\+]+/)
            .forEach(function (x) {
            var key = Keys_1.Keys.parse(x, false);
            if (key !== null) {
                cfg.keys.push(key);
            }
            else {
                cfg.button = parse_button(x);
            }
        });
        return new MouseExpression(cfg);
    };
    MouseExpression.prototype.matches = function (mouseData) {
        if (this.event !== mouseData.type)
            return false;
        if (this.button !== null && this.button !== mouseData.button)
            return false;
        for (var _i = 0, _a = this.keys; _i < _a.length; _i++) {
            var k = _a[_i];
            if (!KeyCheck_1.KeyCheck.down(k))
                return false;
        }
        return true;
    };
    return MouseExpression;
}());
exports.MouseExpression = MouseExpression;
},{"../misc/Util":33,"./KeyCheck":22,"./Keys":25}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventTargetEventEmitterAdapter_1 = require("./EventTargetEventEmitterAdapter");
var MouseExpression_1 = require("./MouseExpression");
var KeyCheck_1 = require("./KeyCheck");
var MouseInput = (function () {
    function MouseInput(emitters) {
        this.emitters = emitters;
        this.subs = [];
    }
    MouseInput.for = function () {
        var elmts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elmts[_i] = arguments[_i];
        }
        KeyCheck_1.KeyCheck.init();
        return new MouseInput(normalize(elmts));
    };
    MouseInput.prototype.on = function (expr, callback) {
        var _this = this;
        var ss = this.emitters.map(function (ee) { return _this.createListener(ee, MouseExpression_1.MouseExpression.parse(expr), callback); });
        this.subs = this.subs.concat(ss);
        return this;
    };
    MouseInput.prototype.createListener = function (target, expr, callback) {
        return target.on(expr.event, function (evt) {
            if (expr.matches(evt)) {
                if (expr.exclusive) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                callback(evt);
            }
        });
    };
    return MouseInput;
}());
exports.MouseInput = MouseInput;
function normalize(kms) {
    return kms
        .map(function (x) { return (!!x['addEventListener'])
        ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
        : x; });
}
},{"./EventTargetEventEmitterAdapter":21,"./KeyCheck":22,"./MouseExpression":27}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bases = require("bases");
var Alpha26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var Base26 = (function () {
    function Base26(num, str) {
        this.num = num;
        this.str = str;
    }
    Base26.num = function (num) {
        return new Base26(num, bases.toAlphabet(num, Alpha26));
    };
    Base26.str = function (str) {
        return new Base26(bases.fromAlphabet(str.toUpperCase(), Alpha26), str);
    };
    return Base26;
}());
exports.Base26 = Base26;
},{"bases":1}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parse(html) {
    var frag = document.createDocumentFragment();
    var body = document.createElement('body');
    frag.appendChild(body);
    body.innerHTML = html;
    return body.firstElementChild;
}
exports.parse = parse;
function css(e, styles) {
    for (var prop in styles) {
        e.style[prop] = styles[prop];
    }
    return e;
}
exports.css = css;
function fit(e, target) {
    return css(e, {
        width: target.clientWidth + 'px',
        height: target.clientHeight + 'px',
    });
}
exports.fit = fit;
function hide(e) {
    return css(e, { display: 'none' });
}
exports.hide = hide;
function show(e) {
    return css(e, { display: 'block' });
}
exports.show = show;
function toggle(e, visible) {
    return visible ? show(e) : hide(e);
}
exports.toggle = toggle;
function singleTransition(e, prop, millis, ease) {
    if (ease === void 0) { ease = 'linear'; }
    e.style.transition = prop + " " + millis + "ms " + ease;
    console.log(e.style.transition);
    setTimeout(function () { return e.style.transition = ''; }, millis);
}
exports.singleTransition = singleTransition;
},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function property(defaultValue, filter) {
    return function (ctor, propName) {
        Object.defineProperty(ctor, propName, {
            configurable: false,
            enumerable: true,
            get: function () {
                var val = this['__' + propName];
                return (val === undefined) ? defaultValue : val;
            },
            set: function (newVal) {
                this['__' + propName] = newVal;
                filter(this, newVal);
            }
        });
    };
}
exports.property = property;
},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var start = new Date().getTime().toString();
var count = 0;
var RefGen = (function () {
    function RefGen() {
    }
    RefGen.next = function (prefix) {
        if (prefix === void 0) { prefix = 'C'; }
        return prefix + start + '-' + (count++);
    };
    return RefGen;
}());
exports.RefGen = RefGen;
},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function coalesce() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    for (var _a = 0, inputs_1 = inputs; _a < inputs_1.length; _a++) {
        var x = inputs_1[_a];
        if (x !== undefined && x !== null) {
            return x;
        }
    }
    return undefined;
}
exports.coalesce = coalesce;
function extend(target, data) {
    for (var k in data) {
        target[k] = data[k];
    }
    return target;
}
exports.extend = extend;
function index(arr, indexer) {
    var obj = {};
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var tm = arr_1[_i];
        obj[indexer(tm)] = tm;
    }
    return obj;
}
exports.index = index;
function flatten(aa) {
    var a = [];
    for (var _i = 0, aa_1 = aa; _i < aa_1.length; _i++) {
        var tm = aa_1[_i];
        if (Array.isArray(tm)) {
            a = a.concat(flatten(tm));
        }
        else {
            a.push(tm);
        }
    }
    return a;
}
exports.flatten = flatten;
function keys(ix) {
    return Object.keys(ix);
}
exports.keys = keys;
function values(ix) {
    var a = [];
    for (var k in ix) {
        a.push(ix[k]);
    }
    return a;
}
exports.values = values;
function zipPairs(pairs) {
    var obj = {};
    for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
        var pair = pairs_1[_i];
        obj[pair[0]] = pair[1];
    }
    return obj;
}
exports.zipPairs = zipPairs;
function unzipPairs(pairs) {
    var arr = [];
    for (var key in pairs) {
        arr.push([key, pairs[key]]);
    }
    return arr;
}
exports.unzipPairs = unzipPairs;
function max(arr, selector) {
    if (arr.length === 0)
        return null;
    var t = arr[0];
    for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
        var x = arr_2[_i];
        if (selector(t) < selector(x)) {
            t = x;
        }
    }
    return t;
}
exports.max = max;
function shadowClone(target) {
    if (typeof (target) === 'object') {
        var sc = {};
        for (var prop in target) {
            sc[prop] = shadowClone(target[prop]);
        }
        return sc;
    }
    return target;
}
exports.shadowClone = shadowClone;
},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Base26_1 = require("../misc/Base26");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var _ = require("../misc/Util");
/**
 * Describes a resolveExpr of grid cells.
 */
var GridRange = (function () {
    function GridRange(values) {
        _.extend(this, values);
    }
    /**
     * Creates a new GridRange object that contains the cells with the specified refs from the
     * specified model.
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    GridRange.create = function (model, cellRefs) {
        var lookup = _.index(cellRefs, function (x) { return x; });
        var cells = [];
        var lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
        var hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;
        for (var _i = 0, _a = model.cells; _i < _a.length; _i++) {
            var c = _a[_i];
            if (!lookup[c.ref])
                continue;
            cells.push(c);
            if (lc > c.colRef)
                lc = c.colRef;
            if (hc < c.colRef)
                hc = c.colRef;
            if (lr > c.rowRef)
                lr = c.rowRef;
            if (hr < c.rowRef)
                hr = c.rowRef;
        }
        var ltr = cells.sort(ltr_sort);
        var ttb = cells.slice(0).sort(ttb_sort);
        return new GridRange({
            ltr: ltr,
            ttb: ttb,
            width: hc - lc,
            height: hr - lr,
            length: (hc - lc) * (hr - lr),
            count: cells.length,
        });
    };
    /**
     * Captures a range of cells from the specified model based on the specified vectors.  The vectors should be
     * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
     * Any cells falling into the rectangle created from these two points will be included in the selected resolveExpr.
     *
     * @param model
     * @param from
     * @param to
     * @param toInclusive
     * @returns {Range}
     */
    GridRange.capture = function (model, from, to, toInclusive) {
        if (toInclusive === void 0) { toInclusive = false; }
        //TODO: Explain this...
        var tl = new Point_1.Point(from.x < to.x ? from.x : to.x, from.y < to.y ? from.y : to.y);
        var br = new Point_1.Point(from.x > to.x ? from.x : to.x, from.y > to.y ? from.y : to.y);
        if (toInclusive) {
            br = br.add(1);
        }
        var dims = Rect_1.Rect.fromPoints(tl, br);
        var results = [];
        for (var r = dims.top; r < dims.bottom; r++) {
            for (var c = dims.left; c < dims.right; c++) {
                var cell = model.locateCell(c, r);
                if (cell) {
                    results.push(cell);
                }
            }
        }
        return GridRange.createInternal(model, results);
    };
    /**
     * Selects a range of cells using an Excel-like range expression. For example:
     * - A1 selects a 1x1 range of the first cell
     * - A1:A5 selects a 1x5 range from the first cell horizontally.
     * - A1:E5 selects a 5x5 range from the first cell evenly.
     *
     * @param model
     * @param query
     */
    GridRange.select = function (model, query) {
        var _a = query.split(':'), from = _a[0], to = _a[1];
        var fromCell = resolve_expr_ref(model, from);
        if (!to) {
            if (!!fromCell) {
                return GridRange.createInternal(model, [fromCell]);
            }
        }
        else {
            var toCell = resolve_expr_ref(model, to);
            if (!!fromCell && !!toCell) {
                var fromVector = new Point_1.Point(fromCell.colRef, fromCell.rowRef);
                var toVector = new Point_1.Point(toCell.colRef, toCell.rowRef);
                return GridRange.capture(model, fromVector, toVector, true);
            }
        }
        return GridRange.empty();
    };
    /**
     * Creates an empty GridRange object.
     *
     * @returns {Range}
     */
    GridRange.empty = function () {
        return new GridRange({
            ltr: [],
            ttb: [],
            width: 0,
            height: 0,
            length: 0,
            count: 0,
        });
    };
    GridRange.createInternal = function (model, cells) {
        var lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
        var hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var c = cells_1[_i];
            if (lc > c.colRef)
                lc = c.colRef;
            if (hc < c.colRef)
                hc = c.colRef;
            if (lr > c.rowRef)
                lr = c.rowRef;
            if (hr < c.rowRef)
                hr = c.rowRef;
        }
        var ltr;
        var ttb;
        if (cells.length > 1) {
            ltr = cells.sort(ltr_sort);
            ttb = cells.slice(0).sort(ttb_sort);
        }
        else {
            ltr = ttb = cells;
        }
        return new GridRange({
            ltr: ltr,
            ttb: ttb,
            width: hc - lc,
            height: hr - lr,
            length: (hc - lc) * (hr - lr),
            count: cells.length,
        });
    };
    /**
     * Indicates whether or not a cell is included in the range.
     */
    GridRange.prototype.contains = function (cellRef) {
        if (!this.index) {
            this.index = _.index(this.ltr, function (x) { return x.ref; });
        }
        return !!this.index[cellRef];
    };
    /**
     * Returns an array of the references for all the cells in the range.
     */
    GridRange.prototype.refs = function () {
        return this.ltr.map(function (x) { return x.ref; });
    };
    return GridRange;
}());
exports.GridRange = GridRange;
function ltr_sort(a, b) {
    var n = 0;
    n = a.rowRef - b.rowRef;
    if (n === 0) {
        n = a.colRef - b.colRef;
    }
    return n;
}
function ttb_sort(a, b) {
    var n = 0;
    n = a.colRef - b.colRef;
    if (n === 0) {
        n = a.rowRef - b.rowRef;
    }
    return n;
}
function resolve_expr_ref(model, value) {
    var RefConvert = /([A-Za-z]+)([0-9]+)/g;
    RefConvert.lastIndex = 0;
    var result = RefConvert.exec(value);
    var colRef = Base26_1.Base26.str(result[1]).num;
    var rowRef = parseInt(result[2]) - 1;
    return model.locateCell(colRef, rowRef);
}
},{"../geom/Point":18,"../geom/Rect":19,"../misc/Base26":29,"../misc/Util":33}],35:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var RefGen_1 = require("../../misc/RefGen");
var _ = require("../../misc/Util");
var Extensibility_1 = require("../../ui/Extensibility");
/**
 * Provides a by-the-book implementation of GridCell.
 */
var DefaultGridCell = (function () {
    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    function DefaultGridCell(params) {
        params.ref = params.ref || RefGen_1.RefGen.next();
        params.colSpan = params.colSpan || 1;
        params.rowSpan = params.rowSpan || 1;
        params.value = (params.value === undefined || params.value === null) ? '' : params.value;
        _.extend(this, params);
    }
    return DefaultGridCell;
}());
DefaultGridCell = __decorate([
    Extensibility_1.renderer(draw),
    __metadata("design:paramtypes", [Object])
], DefaultGridCell);
exports.DefaultGridCell = DefaultGridCell;
function draw(gfx, visual) {
    gfx.lineWidth = 1;
    var av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;
    gfx.fillStyle = 'white';
    gfx.fillRect(-av, -av, visual.width, visual.height);
    gfx.strokeStyle = 'lightgray';
    gfx.strokeRect(-av, -av, visual.width, visual.height);
    gfx.fillStyle = 'black';
    gfx.textBaseline = 'middle';
    gfx.font = "13px Sans-Serif";
    gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
}
},{"../../misc/RefGen":32,"../../misc/Util":33,"../../ui/Extensibility":41}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides a by-the-book implementation of GridColumn.
 */
var DefaultGridColumn = (function () {
    /**
     * Initializes a new instance of DefaultGridColumn.
     *
     * @param ref
     * @param width
     */
    function DefaultGridColumn(ref, width) {
        if (width === void 0) { width = 100; }
        this.ref = ref;
        this.width = width;
    }
    return DefaultGridColumn;
}());
exports.DefaultGridColumn = DefaultGridColumn;
},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("../../misc/Util");
var DefaultGridCell_1 = require("./DefaultGridCell");
/**
 * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
 */
var DefaultGridModel = (function () {
    /**
     * Initializes a new instance of DefaultGridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    function DefaultGridModel(cells, columns, rows) {
        this.cells = cells;
        this.columns = columns;
        this.rows = rows;
        this.refs = _.index(cells, function (x) { return x.ref; });
        this.coords = {};
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var c = cells_1[_i];
            var x = this.coords[c.colRef] || (this.coords[c.colRef] = {});
            x[c.rowRef] = c;
        }
    }
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    DefaultGridModel.dim = function (cols, rows) {
        var cells = [];
        for (var c = 0; c < cols; c++) {
            for (var r = 0; r < rows; r++) {
                cells.push(new DefaultGridCell_1.DefaultGridCell({
                    colRef: c,
                    rowRef: r,
                    value: '',
                }));
            }
        }
        return new DefaultGridModel(cells, [], []);
    };
    /**
     * Creates an empty grid model.
     *
     * @returns {DefaultGridModel}
     */
    DefaultGridModel.empty = function () {
        return new DefaultGridModel([], [], []);
    };
    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    DefaultGridModel.prototype.findCell = function (ref) {
        return this.refs[ref] || null;
    };
    /**
     * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
     * vector (direction) object, or null if no neighbor could be found.
     * @param ref
     * @param vector
     */
    DefaultGridModel.prototype.findCellNeighbor = function (ref, vector) {
        var cell = this.findCell(ref);
        var col = cell.colRef + vector.x;
        var row = cell.rowRef + vector.y;
        return this.locateCell(col, row);
    };
    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    DefaultGridModel.prototype.locateCell = function (col, row) {
        return (this.coords[col] || {})[row] || null;
    };
    return DefaultGridModel;
}());
exports.DefaultGridModel = DefaultGridModel;
},{"../../misc/Util":33,"./DefaultGridCell":35}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides a by-the-book implementation of GridRow.
 */
var DefaultGridRow = (function () {
    /**
     * Initializes a new instance of DefaultGridRow.
     *
     * @param ref
     * @param height
     */
    function DefaultGridRow(ref, height) {
        if (height === void 0) { height = 21; }
        this.ref = ref;
        this.height = height;
    }
    return DefaultGridRow;
}());
exports.DefaultGridRow = DefaultGridRow;
},{}],39:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
function cascade() {
    return function (ctor, key) {
        var pk = "__" + key;
        return {
            enumerable: true,
            get: function () {
                return this[pk] || (!!this.parent ? this.parent[key] : null);
            },
            set: function (val) {
                this[pk] = val;
            }
        };
    };
}
exports.cascade = cascade;
var Cascading = (function () {
    function Cascading(parent, values) {
        this.parent = parent || null;
        if (values) {
            Util_1.extend(this, values);
        }
    }
    return Cascading;
}());
exports.Cascading = Cascading;
var Style = (function (_super) {
    __extends(Style, _super);
    function Style() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Style;
}(Cascading));
__decorate([
    cascade(),
    __metadata("design:type", String)
], Style.prototype, "borderColor", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], Style.prototype, "fillColor", void 0);
__decorate([
    cascade(),
    __metadata("design:type", Function)
], Style.prototype, "formatter", void 0);
__decorate([
    cascade(),
    __metadata("design:type", TextStyle)
], Style.prototype, "text", void 0);
exports.Style = Style;
var TextStyle = (function (_super) {
    __extends(TextStyle, _super);
    function TextStyle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TextStyle;
}(Cascading));
TextStyle.Default = new TextStyle(null, {
    alignment: 'left',
    color: 'black',
    font: 'Segoe UI',
    size: 13,
    style: 'normal',
    variant: 'normal',
    weight: 'normal',
});
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "alignment", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "color", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "font", void 0);
__decorate([
    cascade(),
    __metadata("design:type", Number)
], TextStyle.prototype, "size", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "style", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "variant", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], TextStyle.prototype, "weight", void 0);
exports.TextStyle = TextStyle;
exports.BaseStyle = new Style(null, {
    borderColor: 'lightgray',
    fillColor: 'white',
    formatter: function (v) { return v; },
    text: new TextStyle(null, {
        alignment: 'left',
        color: 'black',
        font: 'Segoe UI',
        size: 13,
        style: 'normal',
        variant: 'normal',
        weight: 'normal',
    })
});
},{"../../misc/Util":33}],40:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultGridCell_1 = require("../default/DefaultGridCell");
var Style_1 = require("./Style");
var Extensibility_1 = require("../../ui/Extensibility");
var Point_1 = require("../../geom/Point");
var StyledGridCell = (function (_super) {
    __extends(StyledGridCell, _super);
    /**
     * Initializes a new instance of StyledGridCell.
     *
     * @param params
     */
    function StyledGridCell(params) {
        var _this = _super.call(this, params) || this;
        _this.style = Style_1.BaseStyle;
        _this.placeholder = '';
        _this.placeholder = params.placeholder || '';
        _this.style = params.style || Style_1.BaseStyle;
        return _this;
    }
    return StyledGridCell;
}(DefaultGridCell_1.DefaultGridCell));
__decorate([
    Extensibility_1.visualize(),
    __metadata("design:type", Style_1.Style)
], StyledGridCell.prototype, "style", void 0);
__decorate([
    Extensibility_1.visualize(),
    __metadata("design:type", String)
], StyledGridCell.prototype, "placeholder", void 0);
StyledGridCell = __decorate([
    Extensibility_1.renderer(draw),
    __metadata("design:paramtypes", [Object])
], StyledGridCell);
exports.StyledGridCell = StyledGridCell;
function draw(gfx, visual) {
    var style = visual.style;
    gfx.lineWidth = 1;
    var av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;
    gfx.fillStyle = style.fillColor;
    gfx.fillRect(-av, -av, visual.width, visual.height);
    gfx.strokeStyle = style.borderColor;
    gfx.strokeRect(-av, -av, visual.width, visual.height);
    var textPt = new Point_1.Point(3, visual.height / 2);
    if (style.text.alignment === 'center') {
        textPt.x = visual.width / 2;
    }
    if (style.text.alignment === 'right') {
        textPt.x = visual.width - 3;
    }
    gfx.font = style.text + " " + style.text.variant + " " + style.text.weight + " " + style.text.size + "px " + style.text.font;
    gfx.textAlign = style.text.alignment;
    gfx.textBaseline = 'middle';
    gfx.fillStyle = style.text.color;
    gfx.fillText(style.formatter(visual.value, visual) || visual.placeholder, textPt.x, textPt.y);
}
},{"../../geom/Point":18,"../../ui/Extensibility":41,"../default/DefaultGridCell":35,"./Style":39}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs some task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
function command(name) {
    return function (ctor, key, descriptor) {
        var mdk = 'grid:commands';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            impl: descriptor.value,
        });
    };
}
exports.command = command;
/**
 * A decorator that defines the render function for a GridCell implementation, allowing custom cell types
 * to control their drawing behavior.
 *
 * @param func
 * A decorator that marks a method
 */
function renderer(func) {
    return function (ctor) {
        Reflect.defineMetadata('custom:renderer', func, ctor);
    };
}
exports.renderer = renderer;
/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
function routine(name) {
    return function (ctor, key, descriptor) {
        var routine = descriptor.value;
        var wrapper = function () {
            var kernel = (this['__kernel'] || this['kernel']);
            return kernel.routines.signal(key, Array.prototype.slice.call(arguments, 0), routine.bind(this));
        };
        return { value: wrapper };
    };
}
exports.routine = routine;
function variable(name, mutable) {
    if (typeof (name) === 'boolean') {
        return variable(undefined, name);
    }
    return function (ctor, key) {
        var mdk = 'grid:variables';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            mutable: mutable,
        });
        //let valStoreKey = !!name ? key : `__${key}`;
        //let useAltValueStore = !name;
        //
        //Object.defineProperty(ctor, name || key, {
        //    configurable: false,
        //    enumerable: true,
        //    get: function() { return this[valStoreKey]; },
        //    set: function(newVal) { this[valStoreKey] = newVal; }
        //});
    };
}
exports.variable = variable;
/**
 * A decorator for use within implementations of GridCell that marks a field as one that affects the visual
 * appearance of the cell.  This will cause the value of the field to be mapped to the _Visual_ object
 * created before the cell is drawn.
 *
 * @returns decorator
 */
function visualize() {
    return function (ctor, key) {
        var mdk = 'grid:visualize';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push(key);
        var pk = "__" + key;
        return {
            get: function () {
                return this[pk];
            },
            set: function (val) {
                this[pk] = val;
                this['__dirty'] = true;
            }
        };
    };
}
exports.visualize = visualize;
},{}],42:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Padding_1 = require("../geom/Padding");
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var EventEmitter_1 = require("./internal/EventEmitter");
var GridKernel_1 = require("./GridKernel");
var GridRange_1 = require("../model/GridRange");
var GridLayout_1 = require("./internal/GridLayout");
var Rect_1 = require("../geom/Rect");
var Point_1 = require("../geom/Point");
var Property_1 = require("../misc/Property");
var _ = require("../misc/Util");
var GridElement = (function (_super) {
    __extends(GridElement, _super);
    function GridElement(canvas) {
        var _this = _super.call(this) || this;
        _this.canvas = canvas;
        _this.dirty = false;
        _this.buffers = {};
        _this.visuals = {};
        _this.root = canvas;
        _this.container = canvas.parentElement;
        var kernel = _this.kernel = new GridKernel_1.GridKernel(_this.emit.bind(_this));
        ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave', 'mousewheel', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(function (x) { return _this.forwardMouseEvent(x); });
        ['keydown', 'keypress', 'keyup']
            .forEach(function (x) { return _this.forwardKeyEvent(x); });
        _this.enableEnterExitEvents();
        return _this;
    }
    GridElement.create = function (target, initialModel) {
        var parent = target.parentElement;
        var canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className;
        canvas.tabIndex = target.tabIndex || 0;
        target.id = null;
        parent.insertBefore(canvas, target);
        parent.removeChild(target);
        if (!parent.style.position || parent.style.position === 'static') {
            parent.style.position = 'relative';
        }
        var grid = new GridElement(canvas);
        grid.model = initialModel || DefaultGridModel_1.DefaultGridModel.dim(26, 100);
        grid.bash();
        return grid;
    };
    Object.defineProperty(GridElement.prototype, "width", {
        get: function () {
            return this.root.clientWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "height", {
        get: function () {
            return this.root.clientHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "modelWidth", {
        get: function () {
            return this.layout.columns.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "modelHeight", {
        get: function () {
            return this.layout.rows.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "virtualWidth", {
        get: function () {
            return this.layout.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "virtualHeight", {
        get: function () {
            return this.layout.height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "scrollLeft", {
        get: function () {
            return this.scroll.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "scrollTop", {
        get: function () {
            return this.scroll.y;
        },
        enumerable: true,
        configurable: true
    });
    GridElement.prototype.extend = function (ext) {
        if (typeof (ext) === 'function') {
            ext(this, this.kernel);
        }
        else {
            this.kernel.install(ext);
            if (ext.init) {
                ext.init(this, this.kernel);
            }
        }
        return this;
    };
    GridElement.prototype.exec = function (command) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        (_a = this.kernel.commands).exec.apply(_a, [command].concat(args));
        var _a;
    };
    GridElement.prototype.get = function (variable) {
        this.kernel.variables.get(variable);
    };
    GridElement.prototype.set = function (variable, value) {
        this.kernel.variables.set(variable, value);
    };
    GridElement.prototype.mergeInterface = function () {
        this.kernel.exportInterface(this);
        return this;
    };
    GridElement.prototype.focus = function () {
        this.root.focus();
    };
    GridElement.prototype.getCellAtGridPoint = function (pt) {
        var refs = this.layout.captureCells(new Rect_1.Rect(pt.x, pt.y, 1, 1));
        if (refs.length) {
            return this.model.findCell(refs[0]);
        }
        return null;
    };
    GridElement.prototype.getCellAtViewPoint = function (pt) {
        var viewport = this.computeViewport();
        var gpt = Point_1.Point.create(pt).add(viewport.topLeft());
        return this.getCellAtGridPoint(gpt);
    };
    GridElement.prototype.getCellsInGridRect = function (rect) {
        var _this = this;
        var refs = this.layout.captureCells(rect);
        return refs.map(function (x) { return _this.model.findCell(x); });
    };
    GridElement.prototype.getCellsInViewRect = function (rect) {
        var viewport = this.computeViewport();
        var grt = Rect_1.Rect.fromLike(rect).offset(viewport.topLeft());
        return this.getCellsInGridRect(grt);
    };
    GridElement.prototype.getCellGridRect = function (ref) {
        var region = this.layout.queryCell(ref);
        return !!region ? Rect_1.Rect.fromLike(region) : null;
    };
    GridElement.prototype.getCellViewRect = function (ref) {
        var rect = this.getCellGridRect(ref);
        if (rect) {
            rect = rect.offset(this.scroll.inverse());
        }
        return rect;
    };
    GridElement.prototype.scrollTo = function (ptOrRect) {
        var dest = ptOrRect;
        if (dest.width === undefined && dest.height === undefined) {
            dest = new Rect_1.Rect(dest.x, dest.y, 1, 1);
        }
        var newScroll = {
            x: this.scroll.x,
            y: this.scroll.y,
        };
        if (dest.left < 0) {
            newScroll.x += dest.left;
        }
        if (dest.right > this.width) {
            newScroll.x += dest.right - this.width;
        }
        if (dest.top < 0) {
            newScroll.y += dest.top;
        }
        if (dest.bottom > this.height) {
            newScroll.y += dest.bottom - this.height;
        }
        if (!this.scroll.equals(newScroll)) {
            this.scroll = Point_1.Point.create(newScroll);
        }
    };
    GridElement.prototype.bash = function () {
        this.root.width = this.root.parentElement.clientWidth;
        this.root.height = this.root.parentElement.clientHeight;
        this.emit('bash');
        this.invalidate();
    };
    GridElement.prototype.invalidate = function (query) {
        if (query === void 0) { query = null; }
        console.time('GridElement.invalidate');
        this.layout = GridLayout_1.GridLayout.compute(this.model, this.padding);
        if (!!query) {
            var range = GridRange_1.GridRange.select(this.model, query);
            for (var _i = 0, _a = range.ltr; _i < _a.length; _i++) {
                var cell = _a[_i];
                delete cell['__dirty'];
                delete this.buffers[cell.ref];
            }
        }
        else {
            this.buffers = {};
            this.model.cells.forEach(function (x) { return delete x['__dirty']; });
        }
        console.timeEnd('GridElement.invalidate');
        this.redraw();
        this.emit('invalidate');
    };
    GridElement.prototype.redraw = function (forceImmediate) {
        if (forceImmediate === void 0) { forceImmediate = false; }
        if (!this.dirty) {
            this.dirty = true;
            console.time('GridElement.redraw');
            if (forceImmediate) {
                this.draw();
            }
            else {
                requestAnimationFrame(this.draw.bind(this));
            }
        }
    };
    GridElement.prototype.draw = function () {
        if (!this.dirty)
            return;
        this.updateVisuals();
        this.drawVisuals();
        this.dirty = false;
        console.timeEnd('GridElement.redraw');
        this.emit('draw');
    };
    GridElement.prototype.computeViewport = function () {
        return new Rect_1.Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    };
    GridElement.prototype.updateVisuals = function () {
        console.time('GridElement.updateVisuals');
        var _a = this, model = _a.model, layout = _a.layout;
        var viewport = this.computeViewport();
        var visibleCells = layout.captureCells(viewport)
            .map(function (ref) { return model.findCell(ref); });
        var prevFrame = this.visuals;
        var nextFrame = {};
        for (var _i = 0, visibleCells_1 = visibleCells; _i < visibleCells_1.length; _i++) {
            var cell = visibleCells_1[_i];
            var region = layout.queryCell(cell.ref);
            var visual = prevFrame[cell.ref];
            // If we didn't have a previous visual or if the cell was dirty, create new visual
            if (!visual || cell.value !== visual.value || cell['__dirty'] !== false) {
                nextFrame[cell.ref] = this.createVisual(cell, region);
                delete this.buffers[cell.ref];
                cell['__dirty'] = false;
            }
            else {
                nextFrame[cell.ref] = visual;
            }
        }
        this.visuals = nextFrame;
        console.timeEnd('GridElement.updateVisuals');
    };
    GridElement.prototype.drawVisuals = function () {
        console.time('GridElement.drawVisuals');
        var viewport = this.computeViewport();
        var gfx = this.canvas.getContext('2d', { alpha: true });
        gfx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        gfx.save();
        gfx.translate(viewport.left * -1, viewport.top * -1);
        for (var cr in this.visuals) {
            var cell = this.model.findCell(cr);
            var visual = this.visuals[cr];
            if (visual.width == 0 || visual.height == 0) {
                continue;
            }
            if (!viewport.intersects(visual)) {
                continue;
            }
            var buffer = this.buffers[cell.ref];
            if (!buffer) {
                buffer = this.buffers[cell.ref] = this.createBuffer(visual.width, visual.height);
                //noinspection TypeScriptUnresolvedFunction
                var renderer = Reflect.getMetadata('custom:renderer', cell.constructor);
                renderer(buffer.gfx, visual, cell);
            }
            gfx.drawImage(buffer.canvas, visual.left - buffer.inflation, visual.top - buffer.inflation);
        }
        gfx.restore();
        console.timeEnd('GridElement.drawVisuals');
    };
    GridElement.prototype.createBuffer = function (width, height) {
        return new Buffer(width, height, 0);
    };
    GridElement.prototype.createVisual = function (cell, region) {
        var visual = new Visual(cell.ref, cell.value, region.left, region.top, region.width, region.height);
        var props = (Reflect.getMetadata('grid:visualize', cell.constructor.prototype) || []);
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var p = props_1[_i];
            if (visual[p] === undefined) {
                visual[p] = clone(cell[p]);
            }
            else {
                console.error("Illegal visualized property name " + p + " on type " + cell.constructor.name + ".");
            }
        }
        return visual;
    };
    GridElement.prototype.forwardMouseEvent = function (event) {
        var _this = this;
        this.canvas.addEventListener(event, function (ne) {
            var pt = new Point_1.Point(ne.offsetX, ne.offsetY);
            var cell = _this.getCellAtViewPoint(pt);
            var ge = ne;
            ge.cell = cell || null;
            ge.gridX = pt.x;
            ge.gridY = pt.y;
            _this.emit(event, ge);
        });
    };
    GridElement.prototype.forwardKeyEvent = function (event) {
        var _this = this;
        this.canvas.addEventListener(event, function (ne) {
            _this.emit(event, ne);
        });
    };
    GridElement.prototype.enableEnterExitEvents = function () {
        var _this = this;
        this.on('mousemove', function (e) {
            if (e.cell != _this.hotCell) {
                if (_this.hotCell) {
                    var newEvt = _this.createGridMouseEvent('cellexit', e);
                    newEvt.cell = _this.hotCell;
                    _this.emit('cellexit', newEvt);
                }
                _this.hotCell = e.cell;
                if (_this.hotCell) {
                    var newEvt = _this.createGridMouseEvent('cellenter', e);
                    newEvt.cell = _this.hotCell;
                    _this.emit('cellenter', newEvt);
                }
            }
        });
    };
    GridElement.prototype.createGridMouseEvent = function (type, source) {
        var event = (new MouseEvent(type, source));
        event.cell = source.cell;
        event.gridX = source.gridX;
        event.gridY = source.gridY;
        return event;
    };
    return GridElement;
}(EventEmitter_1.EventEmitterBase));
__decorate([
    Property_1.property(DefaultGridModel_1.DefaultGridModel.empty(), function (t) { t.emit('load', t.model); t.invalidate(); }),
    __metadata("design:type", Object)
], GridElement.prototype, "model", void 0);
__decorate([
    Property_1.property(Padding_1.Padding.empty, function (t) { return t.invalidate(); }),
    __metadata("design:type", Padding_1.Padding)
], GridElement.prototype, "padding", void 0);
__decorate([
    Property_1.property(Point_1.Point.empty, function (t) { t.redraw(); t.emit('scroll'); }),
    __metadata("design:type", Point_1.Point)
], GridElement.prototype, "scroll", void 0);
exports.GridElement = GridElement;
function clone(x) {
    if (Array.isArray(x)) {
        return x.map(clone);
    }
    else {
        return _.shadowClone(x);
    }
}
var Buffer = (function () {
    function Buffer(width, height, inflation) {
        this.width = width;
        this.height = height;
        this.inflation = inflation;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width + (inflation * 2);
        this.canvas.height = height + (inflation * 2);
        this.gfx = this.canvas.getContext('2d', { alpha: false });
        this.gfx.translate(inflation, inflation);
    }
    return Buffer;
}());
var Visual = (function () {
    function Visual(ref, value, left, top, width, height) {
        this.ref = ref;
        this.value = value;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    Visual.prototype.equals = function (another) {
        for (var prop in this) {
            if (this[prop] !== another[prop]) {
                return false;
            }
        }
        return true;
    };
    return Visual;
}());
},{"../geom/Padding":17,"../geom/Point":18,"../geom/Rect":19,"../misc/Property":31,"../misc/Util":33,"../model/GridRange":34,"../model/default/DefaultGridModel":37,"./GridKernel":43,"./internal/EventEmitter":45,"./internal/GridLayout":46}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Implements the core of the Grid extensibility system.
 */
var GridKernel = (function () {
    function GridKernel(emitter) {
        this.emitter = emitter;
        this.commands = new GridKernelCommandHubImpl();
        this.routines = new GridKernelRoutineHubImpl();
        this.variables = new GridKernelVariableHubImpl();
    }
    GridKernel.prototype.exportInterface = function (target) {
        target = target || {};
        var commands = this.commands['store'];
        var variables = this.variables['store'];
        for (var n in commands) {
            target[n] = commands[n];
        }
        for (var n in variables) {
            Object.defineProperty(target, n, variables[n]);
        }
        return target;
    };
    GridKernel.prototype.install = function (ext) {
        var _a = this, commands = _a.commands, variables = _a.variables;
        if (ext['__kernel']) {
            throw 'Extension appears to have already been installed into this or another grid...?';
        }
        ext['__kernel'] = this;
        var cmds = Reflect.getMetadata('grid:commands', ext) || [];
        for (var _i = 0, cmds_1 = cmds; _i < cmds_1.length; _i++) {
            var c = cmds_1[_i];
            commands.define(c.name, c.impl.bind(ext));
        }
        var vars = Reflect.getMetadata('grid:variables', ext) || [];
        var _loop_1 = function (v) {
            variables.define(v.name, {
                get: (function () { return this[v.key]; }).bind(ext),
                set: !!v.mutable ? (function (val) { this[v.key] = val; }).bind(ext) : undefined,
            });
        };
        for (var _b = 0, vars_1 = vars; _b < vars_1.length; _b++) {
            var v = vars_1[_b];
            _loop_1(v);
        }
    };
    return GridKernel;
}());
exports.GridKernel = GridKernel;
var GridKernelCommandHubImpl = (function () {
    function GridKernelCommandHubImpl() {
        this.store = {};
    }
    /**
     * Defines the specified command for extensions or consumers to use.
     */
    GridKernelCommandHubImpl.prototype.define = function (command, impl) {
        if (this.store[command]) {
            throw 'Command with name already registered: ' + command;
        }
        this.store[command] = impl;
    };
    /**
     * Executes the specified grid command.
     */
    GridKernelCommandHubImpl.prototype.exec = function (command) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var impl = this.store[command];
        if (impl) {
            impl.apply(this, args);
        }
        else {
            throw 'Unrecognized command: ' + command;
        }
    };
    return GridKernelCommandHubImpl;
}());
var GridKernelRoutineHubImpl = (function () {
    function GridKernelRoutineHubImpl() {
        this.hooks = {};
        this.overrides = {};
    }
    /**
     * Adds a hook to the specified signal that enables extensions to override grid behavior
     * defined in the core or other extensions.
     */
    GridKernelRoutineHubImpl.prototype.hook = function (routine, callback) {
        var list = this.hooks[routine] || (this.hooks[routine] = []);
        list.push(callback);
    };
    GridKernelRoutineHubImpl.prototype.override = function (routine, callback) {
        this.overrides[routine] = callback;
    };
    /**
     * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
     * should be supporting data or relevant objects to the routine.  The value returned will be `true`
     * if the routine has been overridden by an extension.
     */
    GridKernelRoutineHubImpl.prototype.signal = function (routine, args, impl) {
        this.invokeHooks("before:" + routine, args);
        if (!!this.overrides[routine]) {
            args.push(impl);
            impl = this.overrides[routine];
        }
        var result = impl.apply(this, args);
        this.invokeHooks(routine, args);
        this.invokeHooks("after:" + routine, args);
        return result;
    };
    GridKernelRoutineHubImpl.prototype.invokeHooks = function (routine, args) {
        var list = this.hooks[routine];
        if (list) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var hook = list_1[_i];
                hook.apply(this, args);
            }
        }
    };
    return GridKernelRoutineHubImpl;
}());
var GridKernelVariableHubImpl = (function () {
    function GridKernelVariableHubImpl() {
        this.store = {};
    }
    /**
     * Defines the specified variable for extensions or consumers to use.
     */
    GridKernelVariableHubImpl.prototype.define = function (variable, impl) {
        if (this.store[variable]) {
            throw 'Variable with name already registered: ' + variable;
        }
        this.store[variable] = impl;
    };
    /**
     * Gets the value of the specified variable.
     */
    GridKernelVariableHubImpl.prototype.get = function (variable) {
        var impl = this.store[variable];
        if (impl) {
            return impl.get();
        }
        throw 'Unrecognized variable: ' + variable;
    };
    /**
     * Sets the value of the specified variable.
     */
    GridKernelVariableHubImpl.prototype.set = function (variable, value) {
        var impl = this.store[variable];
        if (impl) {
            if (impl.set) {
                impl.set(value);
            }
            else {
                throw 'Cannot set readonly variable: ' + variable;
            }
        }
        else {
            throw 'Unrecognized variable: ' + variable;
        }
    };
    return GridKernelVariableHubImpl;
}());
},{}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../geom/Rect");
var Dom = require("../misc/Dom");
/**
 * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
 * absolutely positioned root elements.
 */
var AbsWidgetBase = (function () {
    function AbsWidgetBase(root) {
        this.root = root;
    }
    Object.defineProperty(AbsWidgetBase.prototype, "viewRect", {
        /**
         * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
         */
        get: function () {
            return new Rect_1.Rect(parseFloat(this.root.style.left), parseFloat(this.root.style.top), this.root.clientWidth, this.root.clientHeight);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Moves the Widget to the specified position relative to the viewport of the grid.
     *
     * @param viewRect
     * @param animate
     */
    AbsWidgetBase.prototype.goto = function (viewRect, autoShow) {
        if (autoShow === void 0) { autoShow = true; }
        if (autoShow) {
            Dom.show(this.root);
        }
        Dom.css(this.root, {
            left: viewRect.left - 1 + "px",
            top: viewRect.top - 1 + "px",
            width: viewRect.width + 1 + "px",
            height: viewRect.height + 1 + "px",
            overflow: "hidden",
        });
    };
    /**
     * Hides the whole widget.
     */
    AbsWidgetBase.prototype.hide = function () {
        Dom.hide(this.root);
    };
    /**
     * Shows the whole widget.
     */
    AbsWidgetBase.prototype.show = function () {
        Dom.show(this.root);
    };
    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    AbsWidgetBase.prototype.toggle = function (visible) {
        Dom.toggle(this.root, visible);
    };
    return AbsWidgetBase;
}());
exports.AbsWidgetBase = AbsWidgetBase;
},{"../geom/Rect":19,"../misc/Dom":30}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitterBase = (function () {
    function EventEmitterBase() {
        this.buckets = {};
    }
    EventEmitterBase.prototype.on = function (event, callback) {
        var _this = this;
        this.getCallbackList(event).push(callback);
        return { cancel: function () { return _this.off(event, callback); } };
    };
    EventEmitterBase.prototype.off = function (event, callback) {
        var list = this.getCallbackList(event);
        var idx = list.indexOf(callback);
        if (idx >= 0) {
            list.splice(idx, 1);
        }
    };
    EventEmitterBase.prototype.emit = function (event) {
        // if (!event.match('mouse') && !event.match('key') && !event.match('drag'))
        // {
        //     console.log(event, ...args);
        // }
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var list = this.getCallbackList(event);
        for (var _a = 0, list_1 = list; _a < list_1.length; _a++) {
            var callback = list_1[_a];
            callback.apply(null, args);
        }
    };
    EventEmitterBase.prototype.getCallbackList = function (event) {
        return this.buckets[event] || (this.buckets[event] = []);
    };
    return EventEmitterBase;
}());
exports.EventEmitterBase = EventEmitterBase;
},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultGridColumn_1 = require("../../model/default/DefaultGridColumn");
var DefaultGridRow_1 = require("../../model/default/DefaultGridRow");
var Rect_1 = require("../../geom/Rect");
var _ = require("../../misc/Util");
var GridLayout = (function () {
    function GridLayout(width, height, columns, rows, cells, cellLookup) {
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.rows = rows;
        this.cells = cells;
        this.cellLookup = cellLookup;
        this.columnIndex = _.index(columns, function (x) { return x.ref; });
        this.rowIndex = _.index(rows, function (x) { return x.ref; });
        this.cellIndex = _.index(cells, function (x) { return x.ref; });
    }
    GridLayout.compute = function (model, padding) {
        var colLookup = model.columns.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var rowLookup = model.rows.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var cellLookup = buildCellLookup(model.cells); //by col then row
        // Compute all expected columns and rows
        var maxCol = model.cells.map(function (x) { return x.colRef + (x.colSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        var maxRow = model.cells.map(function (x) { return x.rowRef + (x.rowSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        // Generate missing columns and rows
        for (var i = 0; i <= maxCol; i++) {
            (colLookup[i] || (colLookup[i] = new DefaultGridColumn_1.DefaultGridColumn(i)));
        }
        for (var i = 0; i <= maxRow; i++) {
            (rowLookup[i] || (rowLookup[i] = new DefaultGridRow_1.DefaultGridRow(i)));
        }
        // Compute width and height of whole grid
        var width = _.values(colLookup).reduce(function (t, x) { return t + x.width; }, 0) + padding.horizontal;
        var height = _.values(rowLookup).reduce(function (t, x) { return t + x.height; }, 0) + padding.vertical;
        // Compute the layout regions for the various bits
        var colRegs = [];
        var rowRegs = [];
        var cellRegs = [];
        var accLeft = padding.left;
        for (var ci = 0; ci <= maxCol; ci++) {
            var col = colLookup[ci];
            colRegs.push({
                ref: col.ref,
                left: accLeft,
                top: 0,
                width: col.width,
                height: height,
            });
            var accTop = padding.top;
            for (var ri = 0; ri <= maxRow; ri++) {
                var row = rowLookup[ri];
                if (ci === 0) {
                    rowRegs.push({
                        ref: row.ref,
                        left: 0,
                        top: accTop,
                        width: width,
                        height: row.height,
                    });
                }
                if (cellLookup[ci] !== undefined && cellLookup[ci][ri] !== undefined) {
                    var cell = cellLookup[ci][ri];
                    cellRegs.push({
                        ref: cell.ref,
                        left: accLeft,
                        top: accTop,
                        width: col.width,
                        height: row.height,
                    });
                }
                accTop += row.height;
            }
            accLeft += col.width;
        }
        return new GridLayout(width, height, colRegs, rowRegs, cellRegs, cellLookup);
    };
    GridLayout.prototype.queryColumn = function (ref) {
        return this.columnIndex[ref] || null;
    };
    GridLayout.prototype.queryRow = function (ref) {
        return this.rowIndex[ref] || null;
    };
    GridLayout.prototype.queryCell = function (ref) {
        return this.cellIndex[ref] || null;
    };
    GridLayout.prototype.captureColumns = function (region) {
        return this.columns
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.ref; });
    };
    GridLayout.prototype.captureRows = function (region) {
        return this.rows
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.ref; });
    };
    GridLayout.prototype.captureCells = function (region) {
        var cols = this.captureColumns(region);
        var rows = this.captureRows(region);
        var cells = new Array();
        for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
            var c = cols_1[_i];
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var r = rows_1[_a];
                var cell = this.cellLookup[c][r];
                if (!!cell) {
                    cells.push(cell.ref);
                }
            }
        }
        return cells;
    };
    return GridLayout;
}());
exports.GridLayout = GridLayout;
function buildCellLookup(cells) {
    var ix = {};
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var c = cells_1[_i];
        var cix = ix[c.colRef] || (ix[c.colRef] = {});
        cix[c.rowRef] = c;
    }
    return ix;
}
},{"../../geom/Rect":19,"../../misc/Util":33,"../../model/default/DefaultGridColumn":36,"../../model/default/DefaultGridRow":38}],47:[function(require,module,exports){
/**
 * Embedding of Clipboard.js - https://github.com/zenorocha/clipboard.js/
 *
 * After various attempts, I was unable to npm install including types effectively and because an index.js is not
 * used I cannot use the TypeScript 2.1 unknown module import, so resorting to local embedded version.  Will remove
 * in the future if possible.
 *
 * Modifications have been made to make the code compile:
 * - Removed Promise polyfill (imported instead)
 * - Restructured export and added typed interface
 * - Some changes to prevent type checking where undesired
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var es6_promise_1 = require("es6-promise");
//Declare window as an any var alias to prevent TS moaning...
var wnd = window;
var clipboard = {};
clipboard.copy = (function () {
    var _intercept = false;
    var _data = null; // Map from data type (e.g. "text/html") to value.
    var _bogusSelection = false;
    function cleanup() {
        _intercept = false;
        _data = null;
        if (_bogusSelection) {
            window.getSelection().removeAllRanges();
        }
        _bogusSelection = false;
    }
    document.addEventListener("copy", function (e) {
        if (_intercept) {
            for (var key in _data) {
                e.clipboardData.setData(key, _data[key]);
            }
            e.preventDefault();
        }
    });
    // Workaround for Safari: https://bugs.webkit.org/show_bug.cgi?id=156529
    function bogusSelect() {
        var sel = document.getSelection();
        // If "nothing" is selected...
        if (!document.queryCommandEnabled("copy") && sel.isCollapsed) {
            // ... temporarily select the entire body.
            //
            // We select the entire body because:
            // - it's guaranteed to exist,
            // - it works (unlike, say, document.head, or phantom element that is
            //   not inserted into the DOM),
            // - it doesn't seem to flicker (due to the synchronous copy event), and
            // - it avoids modifying the DOM (can trigger mutation observers).
            //
            // Because we can't do proper feature detection (we already checked
            // document.queryCommandEnabled("copy") , which actually gives a false
            // negative for Blink when nothing is selected) and UA sniffing is not
            // reliable (a lot of UA strings contain "Safari"), this will also
            // happen for some browsers other than Safari. :-()
            var range = document.createRange();
            range.selectNodeContents(document.body);
            sel.addRange(range);
            _bogusSelection = true;
        }
    }
    ;
    return function (data) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            _intercept = true;
            if (typeof data === "string") {
                _data = { "text/plain": data };
            }
            else if (data instanceof Node) {
                _data = { "text/html": new XMLSerializer().serializeToString(data) };
            }
            else {
                _data = data;
            }
            try {
                bogusSelect();
                if (document.execCommand("copy")) {
                    // document.execCommand is synchronous: http://www.w3.org/TR/2015/WD-clipboard-apis-20150421/#integration-with-rich-text-editing-apis
                    // So we can call resolveRef() back here.
                    cleanup();
                    resolve();
                }
                else {
                    throw new Error("Unable to copy. Perhaps it's not available in your browser?");
                }
            }
            catch (e) {
                cleanup();
                reject(e);
            }
        });
    };
})();
clipboard.paste = (function () {
    var _intercept = false;
    var _resolve;
    var _dataType;
    document.addEventListener("paste", function (e) {
        if (_intercept) {
            _intercept = false;
            e.preventDefault();
            var resolve = _resolve;
            _resolve = null;
            resolve(e.clipboardData.getData(_dataType));
        }
    });
    return function (dataType) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            _intercept = true;
            _resolve = resolve;
            _dataType = dataType || "text/plain";
            try {
                if (!document.execCommand("paste")) {
                    _intercept = false;
                    reject(new Error("Unable to paste. Pasting only works in Internet Explorer at the moment."));
                }
            }
            catch (e) {
                _intercept = false;
                reject(new Error(e));
            }
        });
    };
})();
// Handle IE behaviour.
if (typeof ClipboardEvent === "undefined" &&
    typeof wnd.clipboardData !== "undefined" &&
    typeof wnd.clipboardData.setData !== "undefined") {
    clipboard.copy = function (data) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            // IE supports string and URL types: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
            // We only support the string type for now.
            if (typeof data !== "string" && !("text/plain" in data)) {
                throw new Error("You must provide a text/plain type.");
            }
            var strData = (typeof data === "string" ? data : data["text/plain"]);
            var copySucceeded = wnd.clipboardData.setData("Text", strData);
            if (copySucceeded) {
                resolve();
            }
            else {
                reject(new Error("Copying was rejected."));
            }
        });
    };
    clipboard.paste = function () {
        return new es6_promise_1.Promise(function (resolve, reject) {
            var strData = wnd.clipboardData.getData("Text");
            if (strData) {
                resolve(strData);
            }
            else {
                // The user rejected the paste request.
                reject(new Error("Pasting was rejected."));
            }
        });
    };
}
exports.Clipboard = clipboard;
},{"es6-promise":2}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZXMvYmFzZXMuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXRoZXIvZGlzdC9qcy90ZXRoZXIuanMiLCJzcmMvX2Rldi9tYWluLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL0NsaXBib2FyZEV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZS50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvV2F0Y2hNYW5hZ2VyLnRzIiwic3JjL2V4dGVuc2lvbnMvZXh0cmEvQ2xpY2tab25lRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5TWFuYWdlci50cyIsInNyYy9nZW9tL1BhZGRpbmcudHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9CYXNlMjYudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qcm9wZXJ0eS50cyIsInNyYy9taXNjL1JlZkdlbi50cyIsInNyYy9taXNjL1V0aWwudHMiLCJzcmMvbW9kZWwvR3JpZFJhbmdlLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDb2x1bW4udHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cudHMiLCJzcmMvbW9kZWwvc3R5bGVkL1N0eWxlLnRzIiwic3JjL21vZGVsL3N0eWxlZC9TdHlsZWRHcmlkQ2VsbC50cyIsInNyYy91aS9FeHRlbnNpYmlsaXR5LnRzIiwic3JjL3VpL0dyaWRFbGVtZW50LnRzIiwic3JjL3VpL0dyaWRLZXJuZWwudHMiLCJzcmMvdWkvV2lkZ2V0LnRzIiwic3JjL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlci50cyIsInNyYy91aS9pbnRlcm5hbC9HcmlkTGF5b3V0LnRzIiwic3JjL3ZlbmRvci9jbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdG9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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SUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLGFBQWEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM1QyxLQUFLLFlBQVksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLFdBQVcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxLQUFLLFlBQVksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNwQyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLEtBQUssRUFBRSxNQUFN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QUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQVMsR0FBRyxFQUFFLENBQUM7QUFDZixlQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixhQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2QsYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGFBQVEsR0FBRyxFQUFFLENBQUM7QUFDZCxhQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2QsYUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLGFBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixhQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsYUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLGFBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixhQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsYUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLFFBQUcsR0FBRyxHQUFHLENBQUM7QUFDVixhQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsWUFBTyxHQUFHLEdBQUcsQ0FBQztBQUNkLFdBQU0sR0FBRyxHQUFHLENBQUM7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ZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGJhc2VzLmpzXG4vLyBVdGlsaXR5IGZvciBjb252ZXJ0aW5nIG51bWJlcnMgdG8vZnJvbSBkaWZmZXJlbnQgYmFzZXMvYWxwaGFiZXRzLlxuLy8gU2VlIFJFQURNRS5tZCBmb3IgZGV0YWlscy5cblxudmFyIGJhc2VzID0gKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiAod2luZG93LkJhc2VzID0ge30pKTtcblxuLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbnVtYmVyIGZvciB0aGUgZ2l2ZW4gYWxwaGFiZXQ6XG5iYXNlcy50b0FscGhhYmV0ID0gZnVuY3Rpb24gKG51bSwgYWxwaGFiZXQpIHtcbiAgICB2YXIgYmFzZSA9IGFscGhhYmV0Lmxlbmd0aDtcbiAgICB2YXIgZGlnaXRzID0gW107ICAgIC8vIHRoZXNlIHdpbGwgYmUgaW4gcmV2ZXJzZSBvcmRlciBzaW5jZSBhcnJheXMgYXJlIHN0YWNrc1xuXG4gICAgLy8gZXhlY3V0ZSBhdCBsZWFzdCBvbmNlLCBldmVuIGlmIG51bSBpcyAwLCBzaW5jZSB3ZSBzaG91bGQgcmV0dXJuIHRoZSAnMCc6XG4gICAgZG8ge1xuICAgICAgICBkaWdpdHMucHVzaChudW0gJSBiYXNlKTsgICAgLy8gVE9ETyBoYW5kbGUgbmVnYXRpdmVzIHByb3Blcmx5P1xuICAgICAgICBudW0gPSBNYXRoLmZsb29yKG51bSAvIGJhc2UpO1xuICAgIH0gd2hpbGUgKG51bSA+IDApO1xuXG4gICAgdmFyIGNoYXJzID0gW107XG4gICAgd2hpbGUgKGRpZ2l0cy5sZW5ndGgpIHtcbiAgICAgICAgY2hhcnMucHVzaChhbHBoYWJldFtkaWdpdHMucG9wKCldKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xufTtcblxuLy8gUmV0dXJucyBhbiBpbnRlZ2VyIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBzdHJpbmcgZm9yIHRoZSBnaXZlbiBhbHBoYWJldDpcbmJhc2VzLmZyb21BbHBoYWJldCA9IGZ1bmN0aW9uIChzdHIsIGFscGhhYmV0KSB7XG4gICAgdmFyIGJhc2UgPSBhbHBoYWJldC5sZW5ndGg7XG4gICAgdmFyIHBvcyA9IDA7XG4gICAgdmFyIG51bSA9IDA7XG4gICAgdmFyIGM7XG5cbiAgICB3aGlsZSAoc3RyLmxlbmd0aCkge1xuICAgICAgICBjID0gc3RyW3N0ci5sZW5ndGggLSAxXTtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cigwLCBzdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgIG51bSArPSBNYXRoLnBvdyhiYXNlLCBwb3MpICogYWxwaGFiZXQuaW5kZXhPZihjKTtcbiAgICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bTtcbn07XG5cbi8vIEtub3duIGFscGhhYmV0czpcbmJhc2VzLk5VTUVSQUxTID0gJzAxMjM0NTY3ODknO1xuYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xuYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UgPSBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS50b1VwcGVyQ2FzZSgpO1xuYmFzZXMuS05PV05fQUxQSEFCRVRTID0ge307XG5cbi8vIEVhY2ggb2YgdGhlIG51bWJlciBvbmVzLCBzdGFydGluZyBmcm9tIGJhc2UtMiAoYmFzZS0xIGRvZXNuJ3QgbWFrZSBzZW5zZT8pOlxuZm9yICh2YXIgaSA9IDI7IGkgPD0gMTA7IGkrKykge1xuICAgIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tpXSA9IGJhc2VzLk5VTUVSQUxTLnN1YnN0cigwLCBpKTtcbn1cblxuLy8gTm9kZSdzIG5hdGl2ZSBoZXggaXMgMC05IGZvbGxvd2VkIGJ5ICpsb3dlcmNhc2UqIGEtZiwgc28gd2UnbGwgdGFrZSB0aGF0XG4vLyBhcHByb2FjaCBmb3IgZXZlcnl0aGluZyBmcm9tIGJhc2UtMTEgdG8gYmFzZS0xNjpcbmZvciAodmFyIGkgPSAxMTsgaSA8PSAxNjsgaSsrKSB7XG4gICAgYmFzZXMuS05PV05fQUxQSEFCRVRTW2ldID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS5zdWJzdHIoMCwgaSAtIDEwKTtcbn1cblxuLy8gV2UgYWxzbyBtb2RlbCBiYXNlLTM2IG9mZiBvZiB0aGF0LCBqdXN0IHVzaW5nIHRoZSBmdWxsIGxldHRlciBhbHBoYWJldDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1szNl0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBBbmQgYmFzZS02MiB3aWxsIGJlIHRoZSB1cHBlcmNhc2UgbGV0dGVycyBhZGRlZDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0U7XG5cbi8vIEZvciBiYXNlLTI2LCB3ZSdsbCBhc3N1bWUgdGhlIHVzZXIgd2FudHMganVzdCB0aGUgbGV0dGVyIGFscGhhYmV0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzI2XSA9IGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBXZSdsbCBhbHNvIGFkZCBhIHNpbWlsYXIgYmFzZS01MiwganVzdCBsZXR0ZXJzLCBsb3dlcmNhc2UgdGhlbiB1cHBlcmNhc2U6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbNTJdID0gYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5MRVRURVJTX1VQUEVSQ0FTRTtcblxuLy8gQmFzZS02NCBpcyBhIGZvcm1hbGx5LXNwZWNpZmllZCBhbHBoYWJldCB0aGF0IGhhcyBhIHBhcnRpY3VsYXIgb3JkZXI6XG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCAoYW5kIE5vZGUuanMgZm9sbG93cyB0aGlzIHRvbylcbi8vIFRPRE8gRklYTUUgQnV0IG91ciBjb2RlIGFib3ZlIGRvZXNuJ3QgYWRkIHBhZGRpbmchIERvbid0IHVzZSB0aGlzIHlldC4uLlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzY0XSA9IGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFICsgYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5OVU1FUkFMUyArICcrLyc7XG5cbi8vIEZsaWNrciBhbmQgb3RoZXJzIGFsc28gaGF2ZSBhIGJhc2UtNTggdGhhdCByZW1vdmVzIGNvbmZ1c2luZyBjaGFyYWN0ZXJzLCBidXRcbi8vIHRoZXJlIGlzbid0IGNvbnNlbnN1cyBvbiB0aGUgb3JkZXIgb2YgbG93ZXJjYXNlIHZzLiB1cHBlcmNhc2UuLi4gPS9cbi8vIGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9ncm91cHMvYXBpL2Rpc2N1c3MvNzIxNTc2MTY3MTM3ODYzOTIvXG4vLyBodHRwczovL2VuLmJpdGNvaW4uaXQvd2lraS9CYXNlNThDaGVja19lbmNvZGluZyNCYXNlNThfc3ltYm9sX2NoYXJ0XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZG91Z2FsL2Jhc2U1OC9ibG9iL21hc3Rlci9saWIvYmFzZTU4LnJiXG4vLyBodHRwOi8vaWNvbG9tYS5ibG9nc3BvdC5jb20vMjAxMC8wMy9jcmVhdGUteW91ci1vd24tYml0bHktdXNpbmctYmFzZTU4Lmh0bWxcbi8vIFdlJ2xsIGFyYml0cmFyaWx5IHN0YXkgY29uc2lzdGVudCB3aXRoIHRoZSBhYm92ZSBhbmQgdXNpbmcgbG93ZXJjYXNlIGZpcnN0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzU4XSA9IGJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0ucmVwbGFjZSgvWzBPbEldL2csICcnKTtcblxuLy8gQW5kIERvdWdsYXMgQ3JvY2tmb3JkIHNoYXJlZCBhIHNpbWlsYXIgYmFzZS0zMiBmcm9tIGJhc2UtMzY6XG4vLyBodHRwOi8vd3d3LmNyb2NrZm9yZC5jb20vd3JtZy9iYXNlMzIuaHRtbFxuLy8gVW5saWtlIG91ciBiYXNlLTM2LCBoZSBleHBsaWNpdGx5IHNwZWNpZmllcyB1cHBlcmNhc2UgbGV0dGVyc1xuYmFzZXMuS05PV05fQUxQSEFCRVRTWzMyXSA9IGJhc2VzLk5VTUVSQUxTICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UucmVwbGFjZSgvW0lMT1VdL2csICcnKTtcblxuLy8gQ2xvc3VyZSBoZWxwZXIgZm9yIGNvbnZlbmllbmNlIGFsaWFzZXMgbGlrZSBiYXNlcy50b0Jhc2UzNigpOlxuZnVuY3Rpb24gbWFrZUFsaWFzIChiYXNlLCBhbHBoYWJldCkge1xuICAgIGJhc2VzWyd0b0Jhc2UnICsgYmFzZV0gPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBiYXNlcy50b0FscGhhYmV0KG51bSwgYWxwaGFiZXQpO1xuICAgIH07XG4gICAgYmFzZXNbJ2Zyb21CYXNlJyArIGJhc2VdID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYWxwaGFiZXQpO1xuICAgIH07XG59XG5cbi8vIERvIHRoaXMgZm9yIGFsbCBrbm93biBhbHBoYWJldHM6XG5mb3IgKHZhciBiYXNlIGluIGJhc2VzLktOT1dOX0FMUEhBQkVUUykge1xuICAgIGlmIChiYXNlcy5LTk9XTl9BTFBIQUJFVFMuaGFzT3duUHJvcGVydHkoYmFzZSkpIHtcbiAgICAgICAgbWFrZUFsaWFzKGJhc2UsIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG4gICAgfVxufVxuXG4vLyBBbmQgYSBnZW5lcmljIGFsaWFzIHRvbzpcbmJhc2VzLnRvQmFzZSA9IGZ1bmN0aW9uIChudW0sIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMudG9BbHBoYWJldChudW0sIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG59O1xuXG5iYXNlcy5mcm9tQmFzZSA9IGZ1bmN0aW9uIChzdHIsIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYmFzZXMuS05PV05fQUxQSEFCRVRTW2Jhc2VdKTtcbn07XG4iLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3RlZmFucGVubmVyL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIDQuMS4wXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICAoZ2xvYmFsLkVTNlByb21pc2UgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG59XG5cbnZhciBfaXNBcnJheSA9IHVuZGVmaW5lZDtcbmlmICghQXJyYXkuaXNBcnJheSkge1xuICBfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcbn0gZWxzZSB7XG4gIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbn1cblxudmFyIGlzQXJyYXkgPSBfaXNBcnJheTtcblxudmFyIGxlbiA9IDA7XG52YXIgdmVydHhOZXh0ID0gdW5kZWZpbmVkO1xudmFyIGN1c3RvbVNjaGVkdWxlckZuID0gdW5kZWZpbmVkO1xuXG52YXIgYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICBxdWV1ZVtsZW5dID0gY2FsbGJhY2s7XG4gIHF1ZXVlW2xlbiArIDFdID0gYXJnO1xuICBsZW4gKz0gMjtcbiAgaWYgKGxlbiA9PT0gMikge1xuICAgIC8vIElmIGxlbiBpcyAyLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICBpZiAoY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgIGN1c3RvbVNjaGVkdWxlckZuKGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xufVxuXG5mdW5jdGlvbiBzZXRBc2FwKGFzYXBGbikge1xuICBhc2FwID0gYXNhcEZuO1xufVxuXG52YXIgYnJvd3NlcldpbmRvdyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkO1xudmFyIGJyb3dzZXJHbG9iYWwgPSBicm93c2VyV2luZG93IHx8IHt9O1xudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbnZhciBpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICh7fSkudG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4vLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxudmFyIGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuLy8gbm9kZVxuZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2N1am9qcy93aGVuL2lzc3Vlcy80MTAgZm9yIGRldGFpbHNcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gIH07XG59XG5cbi8vIHZlcnR4XG5mdW5jdGlvbiB1c2VWZXJ0eFRpbWVyKCkge1xuICBpZiAodHlwZW9mIHZlcnR4TmV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmVydHhOZXh0KGZsdXNoKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBub2RlLmRhdGEgPSBpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMjtcbiAgfTtcbn1cblxuLy8gd2ViIHdvcmtlclxuZnVuY3Rpb24gdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZVNldFRpbWVvdXQoKSB7XG4gIC8vIFN0b3JlIHNldFRpbWVvdXQgcmVmZXJlbmNlIHNvIGVzNi1wcm9taXNlIHdpbGwgYmUgdW5hZmZlY3RlZCBieVxuICAvLyBvdGhlciBjb2RlIG1vZGlmeWluZyBzZXRUaW1lb3V0IChsaWtlIHNpbm9uLnVzZUZha2VUaW1lcnMoKSlcbiAgdmFyIGdsb2JhbFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBnbG9iYWxTZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgfTtcbn1cblxudmFyIHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBxdWV1ZVtpXTtcbiAgICB2YXIgYXJnID0gcXVldWVbaSArIDFdO1xuXG4gICAgY2FsbGJhY2soYXJnKTtcblxuICAgIHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgIHF1ZXVlW2kgKyAxXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGxlbiA9IDA7XG59XG5cbmZ1bmN0aW9uIGF0dGVtcHRWZXJ0eCgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICB2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgIHJldHVybiB1c2VWZXJ0eFRpbWVyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xuICB9XG59XG5cbnZhciBzY2hlZHVsZUZsdXNoID0gdW5kZWZpbmVkO1xuLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbmlmIChpc05vZGUpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG59IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG59IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNZXNzYWdlQ2hhbm5lbCgpO1xufSBlbHNlIGlmIChicm93c2VyV2luZG93ID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IGF0dGVtcHRWZXJ0eCgpO1xufSBlbHNlIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdGhlbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcblxuICB2YXIgcGFyZW50ID0gdGhpcztcblxuICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoY2hpbGRbUFJPTUlTRV9JRF0gPT09IHVuZGVmaW5lZCkge1xuICAgIG1ha2VQcm9taXNlKGNoaWxkKTtcbiAgfVxuXG4gIHZhciBfc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gIGlmIChfc3RhdGUpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNhbGxiYWNrID0gX2FyZ3VtZW50c1tfc3RhdGUgLSAxXTtcbiAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaW52b2tlQ2FsbGJhY2soX3N0YXRlLCBjaGlsZCwgY2FsbGJhY2ssIHBhcmVudC5fcmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH0gZWxzZSB7XG4gICAgc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgfVxuXG4gIHJldHVybiBjaGlsZDtcbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlc29sdmVgIHJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVzb2x2ZWQgd2l0aCB0aGVcbiAgcGFzc2VkIGB2YWx1ZWAuIEl0IGlzIHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZXNvbHZlKDEpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgxKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlc29sdmVcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gdmFsdWUgdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlc29sdmVkIHdpdGhcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSBmdWxmaWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgYHZhbHVlYFxuKi9cbmZ1bmN0aW9uIHJlc29sdmUob2JqZWN0KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IENvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVzb2x2ZShwcm9taXNlLCBvYmplY3QpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxudmFyIFBST01JU0VfSUQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMTYpO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxudmFyIFBFTkRJTkcgPSB2b2lkIDA7XG52YXIgRlVMRklMTEVEID0gMTtcbnZhciBSRUpFQ1RFRCA9IDI7XG5cbnZhciBHRVRfVEhFTl9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiBzZWxmRnVsZmlsbG1lbnQoKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbn1cblxuZnVuY3Rpb24gY2Fubm90UmV0dXJuT3duKCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xufVxuXG5mdW5jdGlvbiBnZXRUaGVuKHByb21pc2UpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgcmV0dXJuIEdFVF9USEVOX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICB0cnkge1xuICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICBhc2FwKGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgIHZhciBlcnJvciA9IHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoc2VhbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9XG4gIH0sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBGVUxGSUxMRUQpIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gUkVKRUNURUQpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4kJCkge1xuICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3RvciAmJiB0aGVuJCQgPT09IHRoZW4gJiYgbWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3Rvci5yZXNvbHZlID09PSByZXNvbHZlKSB7XG4gICAgaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoZW4kJCA9PT0gR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgICAgR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAodGhlbiQkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoZW4kJCkpIHtcbiAgICAgIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuJCQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgfSBlbHNlIGlmIChvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUsIGdldFRoZW4odmFsdWUpKTtcbiAgfSBlbHNlIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gIH1cblxuICBwdWJsaXNoKHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHByb21pc2UuX3Jlc3VsdCA9IHZhbHVlO1xuICBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRDtcblxuICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgYXNhcChwdWJsaXNoLCBwcm9taXNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gIGFzYXAocHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX3N1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgdmFyIGxlbmd0aCA9IF9zdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgcGFyZW50Ll9vbmVycm9yID0gbnVsbDtcblxuICBfc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBfc3Vic2NyaWJlcnNbbGVuZ3RoICsgRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gIF9zdWJzY3JpYmVyc1tsZW5ndGggKyBSRUpFQ1RFRF0gPSBvblJlamVjdGlvbjtcblxuICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICBhc2FwKHB1Ymxpc2gsIHBhcmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaChwcm9taXNlKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICB2YXIgc2V0dGxlZCA9IHByb21pc2UuX3N0YXRlO1xuXG4gIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2hpbGQgPSB1bmRlZmluZWQsXG4gICAgICBjYWxsYmFjayA9IHVuZGVmaW5lZCxcbiAgICAgIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgIGlmIChjaGlsZCkge1xuICAgICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgIH1cbiAgfVxuXG4gIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG59XG5cbmZ1bmN0aW9uIEVycm9yT2JqZWN0KCkge1xuICB0aGlzLmVycm9yID0gbnVsbDtcbn1cblxudmFyIFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgIHJldHVybiBUUllfQ0FUQ0hfRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICB2YXIgaGFzQ2FsbGJhY2sgPSBpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkLFxuICAgICAgZXJyb3IgPSB1bmRlZmluZWQsXG4gICAgICBzdWNjZWVkZWQgPSB1bmRlZmluZWQsXG4gICAgICBmYWlsZWQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgdmFsdWUgPSB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgZXJyb3IgPSB2YWx1ZS5lcnJvcjtcbiAgICAgIHZhbHVlLmVycm9yID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgLy8gbm9vcFxuICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IEZVTEZJTExFRCkge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICB0cnkge1xuICAgIHJlc29sdmVyKGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKSB7XG4gICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIF9yZWplY3QocHJvbWlzZSwgZSk7XG4gIH1cbn1cblxudmFyIGlkID0gMDtcbmZ1bmN0aW9uIG5leHRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbmZ1bmN0aW9uIG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgcHJvbWlzZVtQUk9NSVNFX0lEXSA9IGlkKys7XG4gIHByb21pc2UuX3N0YXRlID0gdW5kZWZpbmVkO1xuICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gIHByb21pc2UuX3N1YnNjcmliZXJzID0gW107XG59XG5cbmZ1bmN0aW9uIEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgdGhpcy5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuXG4gIGlmICghdGhpcy5wcm9taXNlW1BST01JU0VfSURdKSB7XG4gICAgbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgfVxuXG4gIGlmIChpc0FycmF5KGlucHV0KSkge1xuICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5sZW5ndGggPSBpbnB1dC5sZW5ndGg7XG4gICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcblxuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGggfHwgMDtcbiAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgaWYgKHRoaXMuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgX3JlamVjdCh0aGlzLnByb21pc2UsIHZhbGlkYXRpb25FcnJvcigpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICB2YXIgX2lucHV0ID0gdGhpcy5faW5wdXQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IHRoaXMuX3N0YXRlID09PSBQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHRoaXMuX2VhY2hFbnRyeShfaW5wdXRbaV0sIGkpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24gKGVudHJ5LCBpKSB7XG4gIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgdmFyIHJlc29sdmUkJCA9IGMucmVzb2x2ZTtcblxuICBpZiAocmVzb2x2ZSQkID09PSByZXNvbHZlKSB7XG4gICAgdmFyIF90aGVuID0gZ2V0VGhlbihlbnRyeSk7XG5cbiAgICBpZiAoX3RoZW4gPT09IHRoZW4gJiYgZW50cnkuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgICB0aGlzLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fcmVtYWluaW5nLS07XG4gICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICB9IGVsc2UgaWYgKGMgPT09IFByb21pc2UpIHtcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobm9vcCk7XG4gICAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIGVudHJ5LCBfdGhlbik7XG4gICAgICB0aGlzLl93aWxsU2V0dGxlQXQocHJvbWlzZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbiAocmVzb2x2ZSQkKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlJCQoZW50cnkpO1xuICAgICAgfSksIGkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl93aWxsU2V0dGxlQXQocmVzb2x2ZSQkKGVudHJ5KSwgaSk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbiAoc3RhdGUsIGksIHZhbHVlKSB7XG4gIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuXG4gIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gUEVORElORykge1xuICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbiAocHJvbWlzZSwgaSkge1xuICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIGVudW1lcmF0b3IuX3NldHRsZWRBdChGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoUkVKRUNURUQsIGksIHJlYXNvbik7XG4gIH0pO1xufTtcblxuLyoqXG4gIGBQcm9taXNlLmFsbGAgYWNjZXB0cyBhbiBhcnJheSBvZiBwcm9taXNlcywgYW5kIHJldHVybnMgYSBuZXcgcHJvbWlzZSB3aGljaFxuICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSBvZiBmdWxmaWxsbWVudCB2YWx1ZXMgZm9yIHRoZSBwYXNzZWQgcHJvbWlzZXMsIG9yXG4gIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiBvZiB0aGUgZmlyc3QgcGFzc2VkIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQuIEl0IGNhc3RzIGFsbFxuICBlbGVtZW50cyBvZiB0aGUgcGFzc2VkIGl0ZXJhYmxlIHRvIHByb21pc2VzIGFzIGl0IHJ1bnMgdGhpcyBhbGdvcml0aG0uXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlc29sdmUoMik7XG4gIGxldCBwcm9taXNlMyA9IHJlc29sdmUoMyk7XG4gIGxldCBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBUaGUgYXJyYXkgaGVyZSB3b3VsZCBiZSBbIDEsIDIsIDMgXTtcbiAgfSk7XG4gIGBgYFxuXG4gIElmIGFueSBvZiB0aGUgYHByb21pc2VzYCBnaXZlbiB0byBgYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gIHRoYXQgaXMgcmVqZWN0ZWQgd2lsbCBiZSBnaXZlbiBhcyBhbiBhcmd1bWVudCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZXMnc1xuICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlamVjdChuZXcgRXJyb3IoXCIyXCIpKTtcbiAgbGV0IHByb21pc2UzID0gcmVqZWN0KG5ldyBFcnJvcihcIjNcIikpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgYWxsXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBcnJheX0gZW50cmllcyBhcnJheSBvZiBwcm9taXNlc1xuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBsYWJlbGluZyB0aGUgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuICBAc3RhdGljXG4qL1xuZnVuY3Rpb24gYWxsKGVudHJpZXMpIHtcbiAgcmV0dXJuIG5ldyBFbnVtZXJhdG9yKHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yYWNlYCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2ggaXMgc2V0dGxlZCBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlXG4gIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIHNldHRsZS5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHJlc3VsdCA9PT0gJ3Byb21pc2UgMicgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFByb21pc2UucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdFxuICBzZXR0bGVkIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlXG4gIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IHNldHRsZWQgcHJvbWlzZSBoYXNcbiAgYmVjb21lIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gIHByb21pc2Ugd2lsbCBiZWNvbWUgcmVqZWN0ZWQ6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMScpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIGxldCBwcm9taXNlMiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcigncHJvbWlzZSAyJykpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICB9KTtcbiAgYGBgXG5cbiAgQW4gZXhhbXBsZSByZWFsLXdvcmxkIHVzZSBjYXNlIGlzIGltcGxlbWVudGluZyB0aW1lb3V0czpcblxuICBgYGBqYXZhc2NyaXB0XG4gIFByb21pc2UucmFjZShbYWpheCgnZm9vLmpzb24nKSwgdGltZW91dCg1MDAwKV0pXG4gIGBgYFxuXG4gIEBtZXRob2QgcmFjZVxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2Ugd2hpY2ggc2V0dGxlcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIGZpcnN0IHBhc3NlZFxuICBwcm9taXNlIHRvIHNldHRsZS5cbiovXG5mdW5jdGlvbiByYWNlKGVudHJpZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkoZW50cmllcykpIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChfLCByZWplY3QpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgcGFzc2VkIGByZWFzb25gLlxuICBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlbiBgcmVhc29uYC5cbiovXG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBuZWVkc1Jlc29sdmVyKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG59XG5cbmZ1bmN0aW9uIG5lZWRzTmV3KCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xufVxuXG4vKipcbiAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgVGVybWlub2xvZ3lcbiAgLS0tLS0tLS0tLS1cblxuICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAtIGB0aGVuYWJsZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyBhIGB0aGVuYCBtZXRob2QuXG4gIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gIC0gYHJlYXNvbmAgaXMgYSB2YWx1ZSB0aGF0IGluZGljYXRlcyB3aHkgYSBwcm9taXNlIHdhcyByZWplY3RlZC5cbiAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gIFByb21pc2VzIHRoYXQgYXJlIGZ1bGZpbGxlZCBoYXZlIGEgZnVsZmlsbG1lbnQgdmFsdWUgYW5kIGFyZSBpbiB0aGUgZnVsZmlsbGVkXG4gIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgUHJvbWlzZXMgY2FuIGFsc28gYmUgc2FpZCB0byAqcmVzb2x2ZSogYSB2YWx1ZS4gIElmIHRoaXMgdmFsdWUgaXMgYWxzbyBhXG4gIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gIGl0c2VsZiByZWplY3QsIGFuZCBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdpbGxcbiAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICBCYXNpYyBVc2FnZTpcbiAgLS0tLS0tLS0tLS0tXG5cbiAgYGBganNcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBvbiBzdWNjZXNzXG4gICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAvLyBvbiBmYWlsdXJlXG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgQWR2YW5jZWQgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLS0tLVxuXG4gIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgYGBganNcbiAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgLy8gb24gcmVqZWN0aW9uXG4gIH0pO1xuICBgYGBcblxuICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gIGBgYGpzXG4gIFByb21pc2UuYWxsKFtcbiAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICBnZXRKU09OKCcvY29tbWVudHMnKVxuICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgIHZhbHVlc1sxXSAvLyA9PiBjb21tZW50c0pTT05cblxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH0pO1xuICBgYGBcblxuICBAY2xhc3MgUHJvbWlzZVxuICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgdGhpc1tQUk9NSVNFX0lEXSA9IG5leHRJZCgpO1xuICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICBpZiAobm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICB0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicgJiYgbmVlZHNSZXNvbHZlcigpO1xuICAgIHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlID8gaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpIDogbmVlZHNOZXcoKTtcbiAgfVxufVxuXG5Qcm9taXNlLmFsbCA9IGFsbDtcblByb21pc2UucmFjZSA9IHJhY2U7XG5Qcm9taXNlLnJlc29sdmUgPSByZXNvbHZlO1xuUHJvbWlzZS5yZWplY3QgPSByZWplY3Q7XG5Qcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBzZXRTY2hlZHVsZXI7XG5Qcm9taXNlLl9zZXRBc2FwID0gc2V0QXNhcDtcblByb21pc2UuX2FzYXAgPSBhc2FwO1xuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgLyoqXG4gICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgd2hpY2ggcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGVcbiAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgLy8gdXNlciBpcyBhdmFpbGFibGVcbiAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQ2hhaW5pbmdcbiAgICAtLS0tLS0tLVxuICBcbiAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmaXJzdCBwcm9taXNlJ3MgZnVsZmlsbG1lbnRcbiAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiB1c2VyLm5hbWU7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJOYW1lKSB7XG4gICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICB9KTtcbiAgXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgfSk7XG4gICAgYGBgXG4gICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEFzc2ltaWxhdGlvblxuICAgIC0tLS0tLS0tLS0tLVxuICBcbiAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICBmdWxmaWxsbWVudCBvciByZWplY3Rpb24gaGFuZGxlci4gVGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIHRoZW4gYmUgcGVuZGluZ1xuICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBTaW1wbGUgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCByZXN1bHQ7XG4gIFxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBmaW5kUmVzdWx0KCk7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9XG4gICAgYGBgXG4gIFxuICAgIEVycmJhY2sgRXhhbXBsZVxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRSZXN1bHQoZnVuY3Rpb24ocmVzdWx0LCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFByb21pc2UgRXhhbXBsZTtcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCBhdXRob3IsIGJvb2tzO1xuICBcbiAgICB0cnkge1xuICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgIC8vIHN1Y2Nlc3NcbiAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH1cbiAgICBgYGBcbiAgXG4gICAgRXJyYmFjayBFeGFtcGxlXG4gIFxuICAgIGBgYGpzXG4gIFxuICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcbiAgXG4gICAgfVxuICBcbiAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuICBcbiAgICB9XG4gIFxuICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvdW5kQm9va3MoYm9va3MpO1xuICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgUHJvbWlzZSBFeGFtcGxlO1xuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgZmluZEF1dGhvcigpLlxuICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICB0aGVuKGZ1bmN0aW9uKGJvb2tzKXtcbiAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQG1ldGhvZCB0aGVuXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25GdWxmaWxsZWRcbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG4gIHRoZW46IHRoZW4sXG5cbiAgLyoqXG4gICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG4gIFxuICAgIGBgYGpzXG4gICAgZnVuY3Rpb24gZmluZEF1dGhvcigpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgfVxuICBcbiAgICAvLyBzeW5jaHJvbm91c1xuICAgIHRyeSB7XG4gICAgICBmaW5kQXV0aG9yKCk7XG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfVxuICBcbiAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBAbWV0aG9kIGNhdGNoXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3Rpb25cbiAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgQHJldHVybiB7UHJvbWlzZX1cbiAgKi9cbiAgJ2NhdGNoJzogZnVuY3Rpb24gX2NhdGNoKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHBvbHlmaWxsKCkge1xuICAgIHZhciBsb2NhbCA9IHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IGdsb2JhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgIGlmIChQKSB7XG4gICAgICAgIHZhciBwcm9taXNlVG9TdHJpbmcgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZVRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gc2lsZW50bHkgaWdub3JlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2VUb1N0cmluZyA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxvY2FsLlByb21pc2UgPSBQcm9taXNlO1xufVxuXG4vLyBTdHJhbmdlIGNvbXBhdC4uXG5Qcm9taXNlLnBvbHlmaWxsID0gcG9seWZpbGw7XG5Qcm9taXNlLlByb21pc2UgPSBQcm9taXNlO1xuXG5yZXR1cm4gUHJvbWlzZTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVzNi1wcm9taXNlLm1hcFxuIiwiLyohXG5cdFBhcGEgUGFyc2Vcblx0djQuMS40XG5cdGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2VcbiovXG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSlcbntcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0e1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKVxuXHR7XG5cdFx0Ly8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG5cdFx0Ly8gb25seSBDb21tb25KUy1saWtlIGVudmlyb25tZW50cyB0aGF0IHN1cHBvcnQgbW9kdWxlLmV4cG9ydHMsXG5cdFx0Ly8gbGlrZSBOb2RlLlxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG5cdFx0cm9vdC5QYXBhID0gZmFjdG9yeSgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uKClcbntcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBnbG9iYWwgPSAoZnVuY3Rpb24gKCkge1xuXHRcdC8vIGFsdGVybmF0aXZlIG1ldGhvZCwgc2ltaWxhciB0byBgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKWBcblx0XHQvLyBidXQgd2l0aG91dCB1c2luZyBgZXZhbGAgKHdoaWNoIGlzIGRpc2FibGVkIHdoZW5cblx0XHQvLyB1c2luZyBDb250ZW50IFNlY3VyaXR5IFBvbGljeSkuXG5cblx0XHRpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBzZWxmOyB9XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiB3aW5kb3c7IH1cblx0XHRpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGdsb2JhbDsgfVxuXG4gICAgICAgIC8vIFdoZW4gcnVubmluZyB0ZXN0cyBub25lIG9mIHRoZSBhYm92ZSBoYXZlIGJlZW4gZGVmaW5lZFxuICAgICAgICByZXR1cm4ge307XG5cdH0pKCk7XG5cblxuXHR2YXIgSVNfV09SS0VSID0gIWdsb2JhbC5kb2N1bWVudCAmJiAhIWdsb2JhbC5wb3N0TWVzc2FnZSxcblx0XHRJU19QQVBBX1dPUktFUiA9IElTX1dPUktFUiAmJiAvKFxcP3wmKXBhcGF3b3JrZXIoPXwmfCQpLy50ZXN0KGdsb2JhbC5sb2NhdGlvbi5zZWFyY2gpLFxuXHRcdExPQURFRF9TWU5DID0gZmFsc2UsIEFVVE9fU0NSSVBUX1BBVEg7XG5cdHZhciB3b3JrZXJzID0ge30sIHdvcmtlcklkQ291bnRlciA9IDA7XG5cblx0dmFyIFBhcGEgPSB7fTtcblxuXHRQYXBhLnBhcnNlID0gQ3N2VG9Kc29uO1xuXHRQYXBhLnVucGFyc2UgPSBKc29uVG9Dc3Y7XG5cblx0UGFwYS5SRUNPUkRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7XG5cdFBhcGEuVU5JVF9TRVAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDMxKTtcblx0UGFwYS5CWVRFX09SREVSX01BUksgPSAnXFx1ZmVmZic7XG5cdFBhcGEuQkFEX0RFTElNSVRFUlMgPSBbJ1xccicsICdcXG4nLCAnXCInLCBQYXBhLkJZVEVfT1JERVJfTUFSS107XG5cdFBhcGEuV09SS0VSU19TVVBQT1JURUQgPSAhSVNfV09SS0VSICYmICEhZ2xvYmFsLldvcmtlcjtcblx0UGFwYS5TQ1JJUFRfUEFUSCA9IG51bGw7XHQvLyBNdXN0IGJlIHNldCBieSB5b3VyIGNvZGUgaWYgeW91IHVzZSB3b3JrZXJzIGFuZCB0aGlzIGxpYiBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHlcblxuXHQvLyBDb25maWd1cmFibGUgY2h1bmsgc2l6ZXMgZm9yIGxvY2FsIGFuZCByZW1vdGUgZmlsZXMsIHJlc3BlY3RpdmVseVxuXHRQYXBhLkxvY2FsQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiAxMDtcdC8vIDEwIE1CXG5cdFBhcGEuUmVtb3RlQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiA1O1x0Ly8gNSBNQlxuXHRQYXBhLkRlZmF1bHREZWxpbWl0ZXIgPSAnLCc7XHRcdFx0Ly8gVXNlZCBpZiBub3Qgc3BlY2lmaWVkIGFuZCBkZXRlY3Rpb24gZmFpbHNcblxuXHQvLyBFeHBvc2VkIGZvciB0ZXN0aW5nIGFuZCBkZXZlbG9wbWVudCBvbmx5XG5cdFBhcGEuUGFyc2VyID0gUGFyc2VyO1xuXHRQYXBhLlBhcnNlckhhbmRsZSA9IFBhcnNlckhhbmRsZTtcblx0UGFwYS5OZXR3b3JrU3RyZWFtZXIgPSBOZXR3b3JrU3RyZWFtZXI7XG5cdFBhcGEuRmlsZVN0cmVhbWVyID0gRmlsZVN0cmVhbWVyO1xuXHRQYXBhLlN0cmluZ1N0cmVhbWVyID0gU3RyaW5nU3RyZWFtZXI7XG5cblx0aWYgKGdsb2JhbC5qUXVlcnkpXG5cdHtcblx0XHR2YXIgJCA9IGdsb2JhbC5qUXVlcnk7XG5cdFx0JC5mbi5wYXJzZSA9IGZ1bmN0aW9uKG9wdGlvbnMpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbmZpZyA9IG9wdGlvbnMuY29uZmlnIHx8IHt9O1xuXHRcdFx0dmFyIHF1ZXVlID0gW107XG5cblx0XHRcdHRoaXMuZWFjaChmdW5jdGlvbihpZHgpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBzdXBwb3J0ZWQgPSAkKHRoaXMpLnByb3AoJ3RhZ05hbWUnKS50b1VwcGVyQ2FzZSgpID09PSAnSU5QVVQnXG5cdFx0XHRcdFx0XHRcdFx0JiYgJCh0aGlzKS5hdHRyKCd0eXBlJykudG9Mb3dlckNhc2UoKSA9PT0gJ2ZpbGUnXG5cdFx0XHRcdFx0XHRcdFx0JiYgZ2xvYmFsLkZpbGVSZWFkZXI7XG5cblx0XHRcdFx0aWYgKCFzdXBwb3J0ZWQgfHwgIXRoaXMuZmlsZXMgfHwgdGhpcy5maWxlcy5sZW5ndGggPT09IDApXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHQvLyBjb250aW51ZSB0byBuZXh0IGlucHV0IGVsZW1lbnRcblxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmlsZXMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRxdWV1ZS5wdXNoKHtcblx0XHRcdFx0XHRcdGZpbGU6IHRoaXMuZmlsZXNbaV0sXG5cdFx0XHRcdFx0XHRpbnB1dEVsZW06IHRoaXMsXG5cdFx0XHRcdFx0XHRpbnN0YW5jZUNvbmZpZzogJC5leHRlbmQoe30sIGNvbmZpZylcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcdC8vIGJlZ2luIHBhcnNpbmdcblx0XHRcdHJldHVybiB0aGlzO1x0XHQvLyBtYWludGFpbnMgY2hhaW5hYmlsaXR5XG5cblxuXHRcdFx0ZnVuY3Rpb24gcGFyc2VOZXh0RmlsZSgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChxdWV1ZS5sZW5ndGggPT09IDApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmNvbXBsZXRlKSlcblx0XHRcdFx0XHRcdG9wdGlvbnMuY29tcGxldGUoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZiA9IHF1ZXVlWzBdO1xuXG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuYmVmb3JlKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciByZXR1cm5lZCA9IG9wdGlvbnMuYmVmb3JlKGYuZmlsZSwgZi5pbnB1dEVsZW0pO1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiByZXR1cm5lZCA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKHJldHVybmVkLmFjdGlvbiA9PT0gJ2Fib3J0Jylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZXJyb3IoJ0Fib3J0RXJyb3InLCBmLmZpbGUsIGYuaW5wdXRFbGVtLCByZXR1cm5lZC5yZWFzb24pO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHQvLyBBYm9ydHMgYWxsIHF1ZXVlZCBmaWxlcyBpbW1lZGlhdGVseVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAocmV0dXJuZWQuYWN0aW9uID09PSAnc2tpcCcpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgcmV0dXJuZWQuY29uZmlnID09PSAnb2JqZWN0Jylcblx0XHRcdFx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZyA9ICQuZXh0ZW5kKGYuaW5zdGFuY2VDb25maWcsIHJldHVybmVkLmNvbmZpZyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkID09PSAnc2tpcCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XHQvLyBwYXJzZSB0aGUgbmV4dCBmaWxlIGluIHRoZSBxdWV1ZSwgaWYgYW55XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV3JhcCB1cCB0aGUgdXNlcidzIGNvbXBsZXRlIGNhbGxiYWNrLCBpZiBhbnksIHNvIHRoYXQgb3VycyBhbHNvIGdldHMgZXhlY3V0ZWRcblx0XHRcdFx0dmFyIHVzZXJDb21wbGV0ZUZ1bmMgPSBmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0XHRmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpc0Z1bmN0aW9uKHVzZXJDb21wbGV0ZUZ1bmMpKVxuXHRcdFx0XHRcdFx0dXNlckNvbXBsZXRlRnVuYyhyZXN1bHRzLCBmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRQYXBhLnBhcnNlKGYuZmlsZSwgZi5pbnN0YW5jZUNvbmZpZyk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGVycm9yKG5hbWUsIGZpbGUsIGVsZW0sIHJlYXNvbilcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpXG5cdFx0XHRcdFx0b3B0aW9ucy5lcnJvcih7bmFtZTogbmFtZX0sIGZpbGUsIGVsZW0sIHJlYXNvbik7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGZpbGVDb21wbGV0ZSgpXG5cdFx0XHR7XG5cdFx0XHRcdHF1ZXVlLnNwbGljZSgwLCAxKTtcblx0XHRcdFx0cGFyc2VOZXh0RmlsZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHR7XG5cdFx0Z2xvYmFsLm9ubWVzc2FnZSA9IHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0fVxuXHRlbHNlIGlmIChQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHR7XG5cdFx0QVVUT19TQ1JJUFRfUEFUSCA9IGdldFNjcmlwdFBhdGgoKTtcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBzY3JpcHQgd2FzIGxvYWRlZCBzeW5jaHJvbm91c2x5XG5cdFx0aWYgKCFkb2N1bWVudC5ib2R5KVxuXHRcdHtcblx0XHRcdC8vIEJvZHkgZG9lc24ndCBleGlzdCB5ZXQsIG11c3QgYmUgc3luY2hyb25vdXNcblx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHRcdH0sIHRydWUpO1xuXHRcdH1cblx0fVxuXG5cblxuXG5cdGZ1bmN0aW9uIENzdlRvSnNvbihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHRfY29uZmlnID0gX2NvbmZpZyB8fCB7fTtcblx0XHRfY29uZmlnLmR5bmFtaWNUeXBpbmcgPSBfY29uZmlnLmR5bmFtaWNUeXBpbmcgfHwgZmFsc2U7XG5cblx0XHRpZiAoX2NvbmZpZy53b3JrZXIgJiYgUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHR7XG5cdFx0XHR2YXIgdyA9IG5ld1dvcmtlcigpO1xuXG5cdFx0XHR3LnVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0dy51c2VyQ2h1bmsgPSBfY29uZmlnLmNodW5rO1xuXHRcdFx0dy51c2VyQ29tcGxldGUgPSBfY29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0dy51c2VyRXJyb3IgPSBfY29uZmlnLmVycm9yO1xuXG5cdFx0XHRfY29uZmlnLnN0ZXAgPSBpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCk7XG5cdFx0XHRfY29uZmlnLmNodW5rID0gaXNGdW5jdGlvbihfY29uZmlnLmNodW5rKTtcblx0XHRcdF9jb25maWcuY29tcGxldGUgPSBpc0Z1bmN0aW9uKF9jb25maWcuY29tcGxldGUpO1xuXHRcdFx0X2NvbmZpZy5lcnJvciA9IGlzRnVuY3Rpb24oX2NvbmZpZy5lcnJvcik7XG5cdFx0XHRkZWxldGUgX2NvbmZpZy53b3JrZXI7XHQvLyBwcmV2ZW50IGluZmluaXRlIGxvb3BcblxuXHRcdFx0dy5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdGlucHV0OiBfaW5wdXQsXG5cdFx0XHRcdGNvbmZpZzogX2NvbmZpZyxcblx0XHRcdFx0d29ya2VySWQ6IHcuaWRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHN0cmVhbWVyID0gbnVsbDtcblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0aWYgKF9jb25maWcuZG93bmxvYWQpXG5cdFx0XHRcdHN0cmVhbWVyID0gbmV3IE5ldHdvcmtTdHJlYW1lcihfY29uZmlnKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgU3RyaW5nU3RyZWFtZXIoX2NvbmZpZyk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChnbG9iYWwuRmlsZSAmJiBfaW5wdXQgaW5zdGFuY2VvZiBGaWxlKSB8fCBfaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpXHQvLyAuLi5TYWZhcmkuIChzZWUgaXNzdWUgIzEwNilcblx0XHRcdHN0cmVhbWVyID0gbmV3IEZpbGVTdHJlYW1lcihfY29uZmlnKTtcblxuXHRcdHJldHVybiBzdHJlYW1lci5zdHJlYW0oX2lucHV0KTtcblx0fVxuXG5cblxuXG5cblxuXHRmdW5jdGlvbiBKc29uVG9Dc3YoX2lucHV0LCBfY29uZmlnKVxuXHR7XG5cdFx0dmFyIF9vdXRwdXQgPSAnJztcblx0XHR2YXIgX2ZpZWxkcyA9IFtdO1xuXG5cdFx0Ly8gRGVmYXVsdCBjb25maWd1cmF0aW9uXG5cblx0XHQvKiogd2hldGhlciB0byBzdXJyb3VuZCBldmVyeSBkYXR1bSB3aXRoIHF1b3RlcyAqL1xuXHRcdHZhciBfcXVvdGVzID0gZmFsc2U7XG5cblx0XHQvKiogd2hldGhlciB0byB3cml0ZSBoZWFkZXJzICovXG5cdFx0dmFyIF93cml0ZUhlYWRlciA9IHRydWU7XG5cblx0XHQvKiogZGVsaW1pdGluZyBjaGFyYWN0ZXIgKi9cblx0XHR2YXIgX2RlbGltaXRlciA9ICcsJztcblxuXHRcdC8qKiBuZXdsaW5lIGNoYXJhY3RlcihzKSAqL1xuXHRcdHZhciBfbmV3bGluZSA9ICdcXHJcXG4nO1xuXG5cdFx0LyoqIHF1b3RlIGNoYXJhY3RlciAqL1xuXHRcdHZhciBfcXVvdGVDaGFyID0gJ1wiJztcblxuXHRcdHVucGFja0NvbmZpZygpO1xuXG5cdFx0dmFyIHF1b3RlQ2hhclJlZ2V4ID0gbmV3IFJlZ0V4cChfcXVvdGVDaGFyLCAnZycpO1xuXG5cdFx0aWYgKHR5cGVvZiBfaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdFx0X2lucHV0ID0gSlNPTi5wYXJzZShfaW5wdXQpO1xuXG5cdFx0aWYgKF9pbnB1dCBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdHtcblx0XHRcdGlmICghX2lucHV0Lmxlbmd0aCB8fCBfaW5wdXRbMF0gaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShudWxsLCBfaW5wdXQpO1xuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIF9pbnB1dFswXSA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybiBzZXJpYWxpemUob2JqZWN0S2V5cyhfaW5wdXRbMF0pLCBfaW5wdXQpO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlb2YgX2lucHV0ID09PSAnb2JqZWN0Jylcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIF9pbnB1dC5kYXRhID09PSAnc3RyaW5nJylcblx0XHRcdFx0X2lucHV0LmRhdGEgPSBKU09OLnBhcnNlKF9pbnB1dC5kYXRhKTtcblxuXHRcdFx0aWYgKF9pbnB1dC5kYXRhIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICghX2lucHV0LmZpZWxkcylcblx0XHRcdFx0XHRfaW5wdXQuZmllbGRzID0gIF9pbnB1dC5tZXRhICYmIF9pbnB1dC5tZXRhLmZpZWxkcztcblxuXHRcdFx0XHRpZiAoIV9pbnB1dC5maWVsZHMpXG5cdFx0XHRcdFx0X2lucHV0LmZpZWxkcyA9ICBfaW5wdXQuZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRcdFx0XHRcdFx0XHQ/IF9pbnB1dC5maWVsZHNcblx0XHRcdFx0XHRcdFx0XHRcdDogb2JqZWN0S2V5cyhfaW5wdXQuZGF0YVswXSk7XG5cblx0XHRcdFx0aWYgKCEoX2lucHV0LmRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheSkgJiYgdHlwZW9mIF9pbnB1dC5kYXRhWzBdICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0XHRfaW5wdXQuZGF0YSA9IFtfaW5wdXQuZGF0YV07XHQvLyBoYW5kbGVzIGlucHV0IGxpa2UgWzEsMiwzXSBvciBbJ2FzZGYnXVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc2VyaWFsaXplKF9pbnB1dC5maWVsZHMgfHwgW10sIF9pbnB1dC5kYXRhIHx8IFtdKTtcblx0XHR9XG5cblx0XHQvLyBEZWZhdWx0IChhbnkgdmFsaWQgcGF0aHMgc2hvdWxkIHJldHVybiBiZWZvcmUgdGhpcylcblx0XHR0aHJvdyAnZXhjZXB0aW9uOiBVbmFibGUgdG8gc2VyaWFsaXplIHVucmVjb2duaXplZCBpbnB1dCc7XG5cblxuXHRcdGZ1bmN0aW9uIHVucGFja0NvbmZpZygpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcuZGVsaW1pdGVyID09PSAnc3RyaW5nJ1xuXHRcdFx0XHQmJiBfY29uZmlnLmRlbGltaXRlci5sZW5ndGggPT09IDFcblx0XHRcdFx0JiYgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKF9jb25maWcuZGVsaW1pdGVyKSA9PT0gLTEpXG5cdFx0XHR7XG5cdFx0XHRcdF9kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLnF1b3RlcyA9PT0gJ2Jvb2xlYW4nXG5cdFx0XHRcdHx8IF9jb25maWcucXVvdGVzIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHRcdF9xdW90ZXMgPSBfY29uZmlnLnF1b3RlcztcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLm5ld2xpbmUgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfbmV3bGluZSA9IF9jb25maWcubmV3bGluZTtcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLnF1b3RlQ2hhciA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9xdW90ZUNoYXIgPSBfY29uZmlnLnF1b3RlQ2hhcjtcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLmhlYWRlciA9PT0gJ2Jvb2xlYW4nKVxuXHRcdFx0XHRfd3JpdGVIZWFkZXIgPSBfY29uZmlnLmhlYWRlcjtcblx0XHR9XG5cblxuXHRcdC8qKiBUdXJucyBhbiBvYmplY3QncyBrZXlzIGludG8gYW4gYXJyYXkgKi9cblx0XHRmdW5jdGlvbiBvYmplY3RLZXlzKG9iailcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdHZhciBrZXlzID0gW107XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKVxuXHRcdFx0XHRrZXlzLnB1c2goa2V5KTtcblx0XHRcdHJldHVybiBrZXlzO1xuXHRcdH1cblxuXHRcdC8qKiBUaGUgZG91YmxlIGZvciBsb29wIHRoYXQgaXRlcmF0ZXMgdGhlIGRhdGEgYW5kIHdyaXRlcyBvdXQgYSBDU1Ygc3RyaW5nIGluY2x1ZGluZyBoZWFkZXIgcm93ICovXG5cdFx0ZnVuY3Rpb24gc2VyaWFsaXplKGZpZWxkcywgZGF0YSlcblx0XHR7XG5cdFx0XHR2YXIgY3N2ID0gJyc7XG5cblx0XHRcdGlmICh0eXBlb2YgZmllbGRzID09PSAnc3RyaW5nJylcblx0XHRcdFx0ZmllbGRzID0gSlNPTi5wYXJzZShmaWVsZHMpO1xuXHRcdFx0aWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJylcblx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG5cblx0XHRcdHZhciBoYXNIZWFkZXIgPSBmaWVsZHMgaW5zdGFuY2VvZiBBcnJheSAmJiBmaWVsZHMubGVuZ3RoID4gMDtcblx0XHRcdHZhciBkYXRhS2V5ZWRCeUZpZWxkID0gIShkYXRhWzBdIGluc3RhbmNlb2YgQXJyYXkpO1xuXG5cdFx0XHQvLyBJZiB0aGVyZSBhIGhlYWRlciByb3csIHdyaXRlIGl0IGZpcnN0XG5cdFx0XHRpZiAoaGFzSGVhZGVyICYmIF93cml0ZUhlYWRlcilcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaSA+IDApXG5cdFx0XHRcdFx0XHRjc3YgKz0gX2RlbGltaXRlcjtcblx0XHRcdFx0XHRjc3YgKz0gc2FmZShmaWVsZHNbaV0sIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0Y3N2ICs9IF9uZXdsaW5lO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaGVuIHdyaXRlIG91dCB0aGUgZGF0YVxuXHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgZGF0YS5sZW5ndGg7IHJvdysrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbWF4Q29sID0gaGFzSGVhZGVyID8gZmllbGRzLmxlbmd0aCA6IGRhdGFbcm93XS5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgbWF4Q29sOyBjb2wrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChjb2wgPiAwKVxuXHRcdFx0XHRcdFx0Y3N2ICs9IF9kZWxpbWl0ZXI7XG5cdFx0XHRcdFx0dmFyIGNvbElkeCA9IGhhc0hlYWRlciAmJiBkYXRhS2V5ZWRCeUZpZWxkID8gZmllbGRzW2NvbF0gOiBjb2w7XG5cdFx0XHRcdFx0Y3N2ICs9IHNhZmUoZGF0YVtyb3ddW2NvbElkeF0sIGNvbCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocm93IDwgZGF0YS5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdGNzdiArPSBfbmV3bGluZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGNzdjtcblx0XHR9XG5cblx0XHQvKiogRW5jbG9zZXMgYSB2YWx1ZSBhcm91bmQgcXVvdGVzIGlmIG5lZWRlZCAobWFrZXMgYSB2YWx1ZSBzYWZlIGZvciBDU1YgaW5zZXJ0aW9uKSAqL1xuXHRcdGZ1bmN0aW9uIHNhZmUoc3RyLCBjb2wpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBzdHIgPT09ICd1bmRlZmluZWQnIHx8IHN0ciA9PT0gbnVsbClcblx0XHRcdFx0cmV0dXJuICcnO1xuXG5cdFx0XHRzdHIgPSBzdHIudG9TdHJpbmcoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBfcXVvdGVDaGFyK19xdW90ZUNoYXIpO1xuXG5cdFx0XHR2YXIgbmVlZHNRdW90ZXMgPSAodHlwZW9mIF9xdW90ZXMgPT09ICdib29sZWFuJyAmJiBfcXVvdGVzKVxuXHRcdFx0XHRcdFx0XHR8fCAoX3F1b3RlcyBpbnN0YW5jZW9mIEFycmF5ICYmIF9xdW90ZXNbY29sXSlcblx0XHRcdFx0XHRcdFx0fHwgaGFzQW55KHN0ciwgUGFwYS5CQURfREVMSU1JVEVSUylcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmluZGV4T2YoX2RlbGltaXRlcikgPiAtMVxuXHRcdFx0XHRcdFx0XHR8fCBzdHIuY2hhckF0KDApID09PSAnICdcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdChzdHIubGVuZ3RoIC0gMSkgPT09ICcgJztcblxuXHRcdFx0cmV0dXJuIG5lZWRzUXVvdGVzID8gX3F1b3RlQ2hhciArIHN0ciArIF9xdW90ZUNoYXIgOiBzdHI7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaGFzQW55KHN0ciwgc3Vic3RyaW5ncylcblx0XHR7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN1YnN0cmluZ3MubGVuZ3RoOyBpKyspXG5cdFx0XHRcdGlmIChzdHIuaW5kZXhPZihzdWJzdHJpbmdzW2ldKSA+IC0xKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBDaHVua1N0cmVhbWVyIGlzIHRoZSBiYXNlIHByb3RvdHlwZSBmb3IgdmFyaW91cyBzdHJlYW1lciBpbXBsZW1lbnRhdGlvbnMuICovXG5cdGZ1bmN0aW9uIENodW5rU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0dGhpcy5faGFuZGxlID0gbnVsbDtcblx0XHR0aGlzLl9wYXVzZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9maW5pc2hlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX2lucHV0ID0gbnVsbDtcblx0XHR0aGlzLl9iYXNlSW5kZXggPSAwO1xuXHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gJyc7XG5cdFx0dGhpcy5fcm93Q291bnQgPSAwO1xuXHRcdHRoaXMuX3N0YXJ0ID0gMDtcblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBudWxsO1xuXHRcdHRoaXMuaXNGaXJzdENodW5rID0gdHJ1ZTtcblx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMgPSB7XG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdGVycm9yczogW10sXG5cdFx0XHRtZXRhOiB7fVxuXHRcdH07XG5cdFx0cmVwbGFjZUNvbmZpZy5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR0aGlzLnBhcnNlQ2h1bmsgPSBmdW5jdGlvbihjaHVuaylcblx0XHR7XG5cdFx0XHQvLyBGaXJzdCBjaHVuayBwcmUtcHJvY2Vzc2luZ1xuXHRcdFx0aWYgKHRoaXMuaXNGaXJzdENodW5rICYmIGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbW9kaWZpZWRDaHVuayA9IHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKGNodW5rKTtcblx0XHRcdFx0aWYgKG1vZGlmaWVkQ2h1bmsgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRjaHVuayA9IG1vZGlmaWVkQ2h1bms7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IGZhbHNlO1xuXG5cdFx0XHQvLyBSZWpvaW4gdGhlIGxpbmUgd2UgbGlrZWx5IGp1c3Qgc3BsaXQgaW4gdHdvIGJ5IGNodW5raW5nIHRoZSBmaWxlXG5cdFx0XHR2YXIgYWdncmVnYXRlID0gdGhpcy5fcGFydGlhbExpbmUgKyBjaHVuaztcblx0XHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gJyc7XG5cblx0XHRcdHZhciByZXN1bHRzID0gdGhpcy5faGFuZGxlLnBhcnNlKGFnZ3JlZ2F0ZSwgdGhpcy5fYmFzZUluZGV4LCAhdGhpcy5fZmluaXNoZWQpO1xuXG5cdFx0XHRpZiAodGhpcy5faGFuZGxlLnBhdXNlZCgpIHx8IHRoaXMuX2hhbmRsZS5hYm9ydGVkKCkpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0dmFyIGxhc3RJbmRleCA9IHJlc3VsdHMubWV0YS5jdXJzb3I7XG5cblx0XHRcdGlmICghdGhpcy5fZmluaXNoZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gYWdncmVnYXRlLnN1YnN0cmluZyhsYXN0SW5kZXggLSB0aGlzLl9iYXNlSW5kZXgpO1xuXHRcdFx0XHR0aGlzLl9iYXNlSW5kZXggPSBsYXN0SW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyZXN1bHRzICYmIHJlc3VsdHMuZGF0YSlcblx0XHRcdFx0dGhpcy5fcm93Q291bnQgKz0gcmVzdWx0cy5kYXRhLmxlbmd0aDtcblxuXHRcdFx0dmFyIGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyA9IHRoaXMuX2ZpbmlzaGVkIHx8ICh0aGlzLl9jb25maWcucHJldmlldyAmJiB0aGlzLl9yb3dDb3VudCA+PSB0aGlzLl9jb25maWcucHJldmlldyk7XG5cblx0XHRcdGlmIChJU19QQVBBX1dPUktFUilcblx0XHRcdHtcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHRyZXN1bHRzOiByZXN1bHRzLFxuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRmaW5pc2hlZDogZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9jb25maWcuY2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jb25maWcuY2h1bmsocmVzdWx0cywgdGhpcy5faGFuZGxlKTtcblx0XHRcdFx0aWYgKHRoaXMuX3BhdXNlZClcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdHJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0aGlzLl9jb25maWcuc3RlcCAmJiAhdGhpcy5fY29uZmlnLmNodW5rKSB7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhID0gdGhpcy5fY29tcGxldGVSZXN1bHRzLmRhdGEuY29uY2F0KHJlc3VsdHMuZGF0YSk7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMgPSB0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzLmNvbmNhdChyZXN1bHRzLmVycm9ycyk7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5tZXRhID0gcmVzdWx0cy5tZXRhO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ICYmIGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmNvbXBsZXRlKSAmJiAoIXJlc3VsdHMgfHwgIXJlc3VsdHMubWV0YS5hYm9ydGVkKSlcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNvbXBsZXRlKHRoaXMuX2NvbXBsZXRlUmVzdWx0cywgdGhpcy5faW5wdXQpO1xuXG5cdFx0XHRpZiAoIWZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiAoIXJlc3VsdHMgfHwgIXJlc3VsdHMubWV0YS5wYXVzZWQpKVxuXHRcdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcblxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fTtcblxuXHRcdHRoaXMuX3NlbmRFcnJvciA9IGZ1bmN0aW9uKGVycm9yKVxuXHRcdHtcblx0XHRcdGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5lcnJvcikpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5lcnJvcihlcnJvcik7XG5cdFx0XHRlbHNlIGlmIChJU19QQVBBX1dPUktFUiAmJiB0aGlzLl9jb25maWcuZXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGVycm9yOiBlcnJvcixcblx0XHRcdFx0XHRmaW5pc2hlZDogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHJlcGxhY2VDb25maWcoY29uZmlnKVxuXHRcdHtcblx0XHRcdC8vIERlZXAtY29weSB0aGUgY29uZmlnIHNvIHdlIGNhbiBlZGl0IGl0XG5cdFx0XHR2YXIgY29uZmlnQ29weSA9IGNvcHkoY29uZmlnKTtcblx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gcGFyc2VJbnQoY29uZmlnQ29weS5jaHVua1NpemUpO1x0Ly8gcGFyc2VJbnQgVkVSWSBpbXBvcnRhbnQgc28gd2UgZG9uJ3QgY29uY2F0ZW5hdGUgc3RyaW5ncyFcblx0XHRcdGlmICghY29uZmlnLnN0ZXAgJiYgIWNvbmZpZy5jaHVuaylcblx0XHRcdFx0Y29uZmlnQ29weS5jaHVua1NpemUgPSBudWxsOyAgLy8gZGlzYWJsZSBSYW5nZSBoZWFkZXIgaWYgbm90IHN0cmVhbWluZzsgYmFkIHZhbHVlcyBicmVhayBJSVMgLSBzZWUgaXNzdWUgIzE5NlxuXHRcdFx0dGhpcy5faGFuZGxlID0gbmV3IFBhcnNlckhhbmRsZShjb25maWdDb3B5KTtcblx0XHRcdHRoaXMuX2hhbmRsZS5zdHJlYW1lciA9IHRoaXM7XG5cdFx0XHR0aGlzLl9jb25maWcgPSBjb25maWdDb3B5O1x0Ly8gcGVyc2lzdCB0aGUgY29weSB0byB0aGUgY2FsbGVyXG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiBOZXR3b3JrU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdGlmICghY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdGNvbmZpZy5jaHVua1NpemUgPSBQYXBhLlJlbW90ZUNodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciB4aHI7XG5cblx0XHRpZiAoSVNfV09SS0VSKVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbih1cmwpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSB1cmw7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcdC8vIFN0YXJ0cyBzdHJlYW1pbmdcblx0XHR9O1xuXG5cdFx0dGhpcy5fcmVhZENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy53aXRoQ3JlZGVudGlhbHMpXG5cdFx0XHR7XG5cdFx0XHRcdHhoci53aXRoQ3JlZGVudGlhbHMgPSB0aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIUlTX1dPUktFUilcblx0XHRcdHtcblx0XHRcdFx0eGhyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHhoci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIub3BlbignR0VUJywgdGhpcy5faW5wdXQsICFJU19XT1JLRVIpO1xuXG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSAtIDE7XHQvLyBtaW51cyBvbmUgYmVjYXVzZSBieXRlIHJhbmdlIGlzIGluY2x1c2l2ZVxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignUmFuZ2UnLCAnYnl0ZXM9Jyt0aGlzLl9zdGFydCsnLScrZW5kKTtcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ0lmLU5vbmUtTWF0Y2gnLCAnd2Via2l0LW5vLWNhY2hlJyk7IC8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MjY3MlxuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR4aHIuc2VuZCgpO1xuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKGVyci5tZXNzYWdlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKElTX1dPUktFUiAmJiB4aHIuc3RhdHVzID09PSAwKVxuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuX3N0YXJ0ICs9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlICE9IDQpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHhoci5zdGF0dXMgPCAyMDAgfHwgeGhyLnN0YXR1cyA+PSA0MDApXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICF0aGlzLl9jb25maWcuY2h1bmtTaXplIHx8IHRoaXMuX3N0YXJ0ID4gZ2V0RmlsZVNpemUoeGhyKTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayh4aHIucmVzcG9uc2VUZXh0KTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0Vycm9yID0gZnVuY3Rpb24oZXJyb3JNZXNzYWdlKVxuXHRcdHtcblx0XHRcdHZhciBlcnJvclRleHQgPSB4aHIuc3RhdHVzVGV4dCB8fCBlcnJvck1lc3NhZ2U7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IoZXJyb3JUZXh0KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXRGaWxlU2l6ZSh4aHIpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbnRlbnRSYW5nZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1SYW5nZScpO1xuXHRcdFx0aWYgKGNvbnRlbnRSYW5nZSA9PT0gbnVsbCkgeyAvLyBubyBjb250ZW50IHJhbmdlLCB0aGVuIGZpbmlzaCFcbiAgICAgICAgXHRcdFx0cmV0dXJuIC0xO1xuICAgICAgICAgICAgXHRcdH1cblx0XHRcdHJldHVybiBwYXJzZUludChjb250ZW50UmFuZ2Uuc3Vic3RyKGNvbnRlbnRSYW5nZS5sYXN0SW5kZXhPZignLycpICsgMSkpO1xuXHRcdH1cblx0fVxuXHROZXR3b3JrU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDaHVua1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdE5ldHdvcmtTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBOZXR3b3JrU3RyZWFtZXI7XG5cblxuXHRmdW5jdGlvbiBGaWxlU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdGlmICghY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdGNvbmZpZy5jaHVua1NpemUgPSBQYXBhLkxvY2FsQ2h1bmtTaXplO1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHJlYWRlciwgc2xpY2U7XG5cblx0XHQvLyBGaWxlUmVhZGVyIGlzIGJldHRlciB0aGFuIEZpbGVSZWFkZXJTeW5jIChldmVuIGluIHdvcmtlcikgLSBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3EvMjQ3MDg2NDkvMTA0ODg2MlxuXHRcdC8vIEJ1dCBGaXJlZm94IGlzIGEgcGlsbCwgdG9vIC0gc2VlIGlzc3VlICM3NjogaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZS9pc3N1ZXMvNzZcblx0XHR2YXIgdXNpbmdBc3luY1JlYWRlciA9IHR5cGVvZiBGaWxlUmVhZGVyICE9PSAndW5kZWZpbmVkJztcdC8vIFNhZmFyaSBkb2Vzbid0IGNvbnNpZGVyIGl0IGEgZnVuY3Rpb24gLSBzZWUgaXNzdWUgIzEwNVxuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbihmaWxlKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gZmlsZTtcblx0XHRcdHNsaWNlID0gZmlsZS5zbGljZSB8fCBmaWxlLndlYmtpdFNsaWNlIHx8IGZpbGUubW96U2xpY2U7XG5cblx0XHRcdGlmICh1c2luZ0FzeW5jUmVhZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRyZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1x0XHQvLyBQcmVmZXJyZWQgbWV0aG9kIG9mIHJlYWRpbmcgZmlsZXMsIGV2ZW4gaW4gd29ya2Vyc1xuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rTG9hZGVkLCB0aGlzKTtcblx0XHRcdFx0cmVhZGVyLm9uZXJyb3IgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtFcnJvciwgdGhpcyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyU3luYygpO1x0Ly8gSGFjayBmb3IgcnVubmluZyBpbiBhIHdlYiB3b3JrZXIgaW4gRmlyZWZveFxuXG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcdC8vIFN0YXJ0cyBzdHJlYW1pbmdcblx0XHR9O1xuXG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICghdGhpcy5fZmluaXNoZWQgJiYgKCF0aGlzLl9jb25maWcucHJldmlldyB8fCB0aGlzLl9yb3dDb3VudCA8IHRoaXMuX2NvbmZpZy5wcmV2aWV3KSlcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fcmVhZENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHZhciBpbnB1dCA9IHRoaXMuX2lucHV0O1xuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBlbmQgPSBNYXRoLm1pbih0aGlzLl9zdGFydCArIHRoaXMuX2NvbmZpZy5jaHVua1NpemUsIHRoaXMuX2lucHV0LnNpemUpO1xuXHRcdFx0XHRpbnB1dCA9IHNsaWNlLmNhbGwoaW5wdXQsIHRoaXMuX3N0YXJ0LCBlbmQpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHR4dCA9IHJlYWRlci5yZWFkQXNUZXh0KGlucHV0LCB0aGlzLl9jb25maWcuZW5jb2RpbmcpO1xuXHRcdFx0aWYgKCF1c2luZ0FzeW5jUmVhZGVyKVxuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCh7IHRhcmdldDogeyByZXN1bHQ6IHR4dCB9IH0pO1x0Ly8gbWltaWMgdGhlIGFzeW5jIHNpZ25hdHVyZVxuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rTG9hZGVkID0gZnVuY3Rpb24oZXZlbnQpXG5cdFx0e1xuXHRcdFx0Ly8gVmVyeSBpbXBvcnRhbnQgdG8gaW5jcmVtZW50IHN0YXJ0IGVhY2ggdGltZSBiZWZvcmUgaGFuZGxpbmcgcmVzdWx0c1xuXHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXRoaXMuX2NvbmZpZy5jaHVua1NpemUgfHwgdGhpcy5fc3RhcnQgPj0gdGhpcy5faW5wdXQuc2l6ZTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayhldmVudC50YXJnZXQucmVzdWx0KTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0Vycm9yID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHRoaXMuX3NlbmRFcnJvcihyZWFkZXIuZXJyb3IpO1xuXHRcdH1cblxuXHR9XG5cdEZpbGVTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENodW5rU3RyZWFtZXIucHJvdG90eXBlKTtcblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZpbGVTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIFN0cmluZ1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciBzdHJpbmc7XG5cdFx0dmFyIHJlbWFpbmluZztcblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKHMpXG5cdFx0e1xuXHRcdFx0c3RyaW5nID0gcztcblx0XHRcdHJlbWFpbmluZyA9IHM7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbmV4dENodW5rKCk7XG5cdFx0fVxuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpIHJldHVybjtcblx0XHRcdHZhciBzaXplID0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHZhciBjaHVuayA9IHNpemUgPyByZW1haW5pbmcuc3Vic3RyKDAsIHNpemUpIDogcmVtYWluaW5nO1xuXHRcdFx0cmVtYWluaW5nID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoc2l6ZSkgOiAnJztcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXJlbWFpbmluZztcblx0XHRcdHJldHVybiB0aGlzLnBhcnNlQ2h1bmsoY2h1bmspO1xuXHRcdH1cblx0fVxuXHRTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN0cmluZ1N0cmVhbWVyO1xuXG5cblxuXHQvLyBVc2Ugb25lIFBhcnNlckhhbmRsZSBwZXIgZW50aXJlIENTViBmaWxlIG9yIHN0cmluZ1xuXHRmdW5jdGlvbiBQYXJzZXJIYW5kbGUoX2NvbmZpZylcblx0e1xuXHRcdC8vIE9uZSBnb2FsIGlzIHRvIG1pbmltaXplIHRoZSB1c2Ugb2YgcmVndWxhciBleHByZXNzaW9ucy4uLlxuXHRcdHZhciBGTE9BVCA9IC9eXFxzKi0/KFxcZCpcXC4/XFxkK3xcXGQrXFwuP1xcZCopKGVbLStdP1xcZCspP1xccyokL2k7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIF9zdGVwQ291bnRlciA9IDA7XHQvLyBOdW1iZXIgb2YgdGltZXMgc3RlcCB3YXMgY2FsbGVkIChudW1iZXIgb2Ygcm93cyBwYXJzZWQpXG5cdFx0dmFyIF9pbnB1dDtcdFx0XHRcdC8vIFRoZSBpbnB1dCBiZWluZyBwYXJzZWRcblx0XHR2YXIgX3BhcnNlcjtcdFx0XHQvLyBUaGUgY29yZSBwYXJzZXIgYmVpbmcgdXNlZFxuXHRcdHZhciBfcGF1c2VkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHdlIGFyZSBwYXVzZWQgb3Igbm90XG5cdFx0dmFyIF9hYm9ydGVkID0gZmFsc2U7ICAgLy8gV2hldGhlciB0aGUgcGFyc2VyIGhhcyBhYm9ydGVkIG9yIG5vdFxuXHRcdHZhciBfZGVsaW1pdGVyRXJyb3I7XHQvLyBUZW1wb3Jhcnkgc3RhdGUgYmV0d2VlbiBkZWxpbWl0ZXIgZGV0ZWN0aW9uIGFuZCBwcm9jZXNzaW5nIHJlc3VsdHNcblx0XHR2YXIgX2ZpZWxkcyA9IFtdO1x0XHQvLyBGaWVsZHMgYXJlIGZyb20gdGhlIGhlYWRlciByb3cgb2YgdGhlIGlucHV0LCBpZiB0aGVyZSBpcyBvbmVcblx0XHR2YXIgX3Jlc3VsdHMgPSB7XHRcdC8vIFRoZSBsYXN0IHJlc3VsdHMgcmV0dXJuZWQgZnJvbSB0aGUgcGFyc2VyXG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdGVycm9yczogW10sXG5cdFx0XHRtZXRhOiB7fVxuXHRcdH07XG5cblx0XHRpZiAoaXNGdW5jdGlvbihfY29uZmlnLnN0ZXApKVxuXHRcdHtcblx0XHRcdHZhciB1c2VyU3RlcCA9IF9jb25maWcuc3RlcDtcblx0XHRcdF9jb25maWcuc3RlcCA9IGZ1bmN0aW9uKHJlc3VsdHMpXG5cdFx0XHR7XG5cdFx0XHRcdF9yZXN1bHRzID0gcmVzdWx0cztcblxuXHRcdFx0XHRpZiAobmVlZHNIZWFkZXJSb3coKSlcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0XHRlbHNlXHQvLyBvbmx5IGNhbGwgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYWZ0ZXIgaGVhZGVyIHJvd1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblxuXHRcdFx0XHRcdC8vIEl0J3MgcG9zc2JpbGUgdGhhdCB0aGlzIGxpbmUgd2FzIGVtcHR5IGFuZCB0aGVyZSdzIG5vIHJvdyBoZXJlIGFmdGVyIGFsbFxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0XHRcdHJldHVybjtcblxuXHRcdFx0XHRcdF9zdGVwQ291bnRlciArPSByZXN1bHRzLmRhdGEubGVuZ3RoO1xuXHRcdFx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX3N0ZXBDb3VudGVyID4gX2NvbmZpZy5wcmV2aWV3KVxuXHRcdFx0XHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHVzZXJTdGVwKF9yZXN1bHRzLCBzZWxmKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBQYXJzZXMgaW5wdXQuIE1vc3QgdXNlcnMgd29uJ3QgbmVlZCwgYW5kIHNob3VsZG4ndCBtZXNzIHdpdGgsIHRoZSBiYXNlSW5kZXhcblx0XHQgKiBhbmQgaWdub3JlTGFzdFJvdyBwYXJhbWV0ZXJzLiBUaGV5IGFyZSB1c2VkIGJ5IHN0cmVhbWVycyAod3JhcHBlciBmdW5jdGlvbnMpXG5cdFx0ICogd2hlbiBhbiBpbnB1dCBjb21lcyBpbiBtdWx0aXBsZSBjaHVua3MsIGxpa2UgZnJvbSBhIGZpbGUuXG5cdFx0ICovXG5cdFx0dGhpcy5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpXG5cdFx0e1xuXHRcdFx0aWYgKCFfY29uZmlnLm5ld2xpbmUpXG5cdFx0XHRcdF9jb25maWcubmV3bGluZSA9IGd1ZXNzTGluZUVuZGluZ3MoaW5wdXQpO1xuXG5cdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSBmYWxzZTtcblx0XHRcdGlmICghX2NvbmZpZy5kZWxpbWl0ZXIpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkZWxpbUd1ZXNzID0gZ3Vlc3NEZWxpbWl0ZXIoaW5wdXQsIF9jb25maWcubmV3bGluZSk7XG5cdFx0XHRcdGlmIChkZWxpbUd1ZXNzLnN1Y2Nlc3NmdWwpXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBkZWxpbUd1ZXNzLmJlc3REZWxpbWl0ZXI7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IHRydWU7XHQvLyBhZGQgZXJyb3IgYWZ0ZXIgcGFyc2luZyAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIG92ZXJ3cml0dGVuKVxuXHRcdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gUGFwYS5EZWZhdWx0RGVsaW1pdGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF9yZXN1bHRzLm1ldGEuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKHR5cGVvZiBfY29uZmlnLmRlbGltaXRlciA9PT0gJ2Z1bmN0aW9uJylcblx0XHRcdHtcblx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcihpbnB1dCk7XG5cdFx0XHRcdF9yZXN1bHRzLm1ldGEuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwYXJzZXJDb25maWcgPSBjb3B5KF9jb25maWcpO1xuXHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0cGFyc2VyQ29uZmlnLnByZXZpZXcrKztcdC8vIHRvIGNvbXBlbnNhdGUgZm9yIGhlYWRlciByb3dcblxuXHRcdFx0X2lucHV0ID0gaW5wdXQ7XG5cdFx0XHRfcGFyc2VyID0gbmV3IFBhcnNlcihwYXJzZXJDb25maWcpO1xuXHRcdFx0X3Jlc3VsdHMgPSBfcGFyc2VyLnBhcnNlKF9pbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KTtcblx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZCA/IHsgbWV0YTogeyBwYXVzZWQ6IHRydWUgfSB9IDogKF9yZXN1bHRzIHx8IHsgbWV0YTogeyBwYXVzZWQ6IGZhbHNlIH0gfSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucGF1c2VkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHJldHVybiBfcGF1c2VkO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSB0cnVlO1xuXHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0X2lucHV0ID0gX2lucHV0LnN1YnN0cihfcGFyc2VyLmdldENoYXJJbmRleCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X3BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZi5zdHJlYW1lci5wYXJzZUNodW5rKF9pbnB1dCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWJvcnRlZCA9IGZ1bmN0aW9uICgpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9hYm9ydGVkO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9hYm9ydGVkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9yZXN1bHRzLm1ldGEuYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbihfY29uZmlnLmNvbXBsZXRlKSlcblx0XHRcdFx0X2NvbmZpZy5jb21wbGV0ZShfcmVzdWx0cyk7XG5cdFx0XHRfaW5wdXQgPSAnJztcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gcHJvY2Vzc1Jlc3VsdHMoKVxuXHRcdHtcblx0XHRcdGlmIChfcmVzdWx0cyAmJiBfZGVsaW1pdGVyRXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGFkZEVycm9yKCdEZWxpbWl0ZXInLCAnVW5kZXRlY3RhYmxlRGVsaW1pdGVyJywgJ1VuYWJsZSB0byBhdXRvLWRldGVjdCBkZWxpbWl0aW5nIGNoYXJhY3RlcjsgZGVmYXVsdGVkIHRvIFxcJycrUGFwYS5EZWZhdWx0RGVsaW1pdGVyKydcXCcnKTtcblx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfY29uZmlnLnNraXBFbXB0eUxpbmVzKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoID09PSAxICYmIF9yZXN1bHRzLmRhdGFbaV1bMF0gPT09ICcnKVxuXHRcdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YS5zcGxpY2UoaS0tLCAxKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG5lZWRzSGVhZGVyUm93KCkpXG5cdFx0XHRcdGZpbGxIZWFkZXJGaWVsZHMoKTtcblxuXHRcdFx0cmV0dXJuIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG5lZWRzSGVhZGVyUm93KClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX2NvbmZpZy5oZWFkZXIgJiYgX2ZpZWxkcy5sZW5ndGggPT09IDA7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZmlsbEhlYWRlckZpZWxkcygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cylcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IG5lZWRzSGVhZGVyUm93KCkgJiYgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGg7IGorKylcblx0XHRcdFx0XHRfZmllbGRzLnB1c2goX3Jlc3VsdHMuZGF0YVtpXVtqXSk7XG5cdFx0XHRfcmVzdWx0cy5kYXRhLnNwbGljZSgwLCAxKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBwYXJzZUR5bmFtaWMoZmllbGQsIHZhbHVlKVxuXHRcdHtcblx0XHRcdGlmICgoX2NvbmZpZy5keW5hbWljVHlwaW5nW2ZpZWxkXSB8fCBfY29uZmlnLmR5bmFtaWNUeXBpbmcpID09PSB0cnVlKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAodmFsdWUgPT09ICd0cnVlJyB8fCB2YWx1ZSA9PT0gJ1RSVUUnKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRlbHNlIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJyB8fCB2YWx1ZSA9PT0gJ0ZBTFNFJylcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRyZXR1cm4gdHJ5UGFyc2VGbG9hdCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gYXBwbHlIZWFkZXJBbmREeW5hbWljVHlwaW5nKClcblx0XHR7XG5cdFx0XHRpZiAoIV9yZXN1bHRzIHx8ICghX2NvbmZpZy5oZWFkZXIgJiYgIV9jb25maWcuZHluYW1pY1R5cGluZykpXG5cdFx0XHRcdHJldHVybiBfcmVzdWx0cztcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgcm93ID0gX2NvbmZpZy5oZWFkZXIgPyB7fSA6IFtdO1xuXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGg7IGorKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciBmaWVsZCA9IGo7XG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gX3Jlc3VsdHMuZGF0YVtpXVtqXTtcblxuXHRcdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0XHRcdGZpZWxkID0gaiA+PSBfZmllbGRzLmxlbmd0aCA/ICdfX3BhcnNlZF9leHRyYScgOiBfZmllbGRzW2pdO1xuXG5cdFx0XHRcdFx0dmFsdWUgPSBwYXJzZUR5bmFtaWMoZmllbGQsIHZhbHVlKTtcblxuXHRcdFx0XHRcdGlmIChmaWVsZCA9PT0gJ19fcGFyc2VkX2V4dHJhJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdID0gcm93W2ZpZWxkXSB8fCBbXTtcblx0XHRcdFx0XHRcdHJvd1tmaWVsZF0ucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHJvd1tmaWVsZF0gPSB2YWx1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF9yZXN1bHRzLmRhdGFbaV0gPSByb3c7XG5cblx0XHRcdFx0aWYgKF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGogPiBfZmllbGRzLmxlbmd0aClcblx0XHRcdFx0XHRcdGFkZEVycm9yKCdGaWVsZE1pc21hdGNoJywgJ1Rvb01hbnlGaWVsZHMnLCAnVG9vIG1hbnkgZmllbGRzOiBleHBlY3RlZCAnICsgX2ZpZWxkcy5sZW5ndGggKyAnIGZpZWxkcyBidXQgcGFyc2VkICcgKyBqLCBpKTtcblx0XHRcdFx0XHRlbHNlIGlmIChqIDwgX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcignRmllbGRNaXNtYXRjaCcsICdUb29GZXdGaWVsZHMnLCAnVG9vIGZldyBmaWVsZHM6IGV4cGVjdGVkICcgKyBfZmllbGRzLmxlbmd0aCArICcgZmllbGRzIGJ1dCBwYXJzZWQgJyArIGosIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfY29uZmlnLmhlYWRlciAmJiBfcmVzdWx0cy5tZXRhKVxuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmZpZWxkcyA9IF9maWVsZHM7XG5cdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ3Vlc3NEZWxpbWl0ZXIoaW5wdXQsIG5ld2xpbmUpXG5cdFx0e1xuXHRcdFx0dmFyIGRlbGltQ2hvaWNlcyA9IFsnLCcsICdcXHQnLCAnfCcsICc7JywgUGFwYS5SRUNPUkRfU0VQLCBQYXBhLlVOSVRfU0VQXTtcblx0XHRcdHZhciBiZXN0RGVsaW0sIGJlc3REZWx0YSwgZmllbGRDb3VudFByZXZSb3c7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGVsaW1DaG9pY2VzLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZGVsaW0gPSBkZWxpbUNob2ljZXNbaV07XG5cdFx0XHRcdHZhciBkZWx0YSA9IDAsIGF2Z0ZpZWxkQ291bnQgPSAwO1xuXHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHR2YXIgcHJldmlldyA9IG5ldyBQYXJzZXIoe1xuXHRcdFx0XHRcdGRlbGltaXRlcjogZGVsaW0sXG5cdFx0XHRcdFx0bmV3bGluZTogbmV3bGluZSxcblx0XHRcdFx0XHRwcmV2aWV3OiAxMFxuXHRcdFx0XHR9KS5wYXJzZShpbnB1dCk7XG5cblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBwcmV2aWV3LmRhdGEubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgZmllbGRDb3VudCA9IHByZXZpZXcuZGF0YVtqXS5sZW5ndGg7XG5cdFx0XHRcdFx0YXZnRmllbGRDb3VudCArPSBmaWVsZENvdW50O1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBmaWVsZENvdW50UHJldlJvdyA9PT0gJ3VuZGVmaW5lZCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSBmaWVsZENvdW50O1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKGZpZWxkQ291bnQgPiAxKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRlbHRhICs9IE1hdGguYWJzKGZpZWxkQ291bnQgLSBmaWVsZENvdW50UHJldlJvdyk7XG5cdFx0XHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IGZpZWxkQ291bnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHByZXZpZXcuZGF0YS5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdGF2Z0ZpZWxkQ291bnQgLz0gcHJldmlldy5kYXRhLmxlbmd0aDtcblxuXHRcdFx0XHRpZiAoKHR5cGVvZiBiZXN0RGVsdGEgPT09ICd1bmRlZmluZWQnIHx8IGRlbHRhIDwgYmVzdERlbHRhKVxuXHRcdFx0XHRcdCYmIGF2Z0ZpZWxkQ291bnQgPiAxLjk5KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmVzdERlbHRhID0gZGVsdGE7XG5cdFx0XHRcdFx0YmVzdERlbGltID0gZGVsaW07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBiZXN0RGVsaW07XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3NmdWw6ICEhYmVzdERlbGltLFxuXHRcdFx0XHRiZXN0RGVsaW1pdGVyOiBiZXN0RGVsaW1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBndWVzc0xpbmVFbmRpbmdzKGlucHV0KVxuXHRcdHtcblx0XHRcdGlucHV0ID0gaW5wdXQuc3Vic3RyKDAsIDEwMjQqMTAyNCk7XHQvLyBtYXggbGVuZ3RoIDEgTUJcblxuXHRcdFx0dmFyIHIgPSBpbnB1dC5zcGxpdCgnXFxyJyk7XG5cblx0XHRcdHZhciBuID0gaW5wdXQuc3BsaXQoJ1xcbicpO1xuXG5cdFx0XHR2YXIgbkFwcGVhcnNGaXJzdCA9IChuLmxlbmd0aCA+IDEgJiYgblswXS5sZW5ndGggPCByWzBdLmxlbmd0aCk7XG5cblx0XHRcdGlmIChyLmxlbmd0aCA9PT0gMSB8fCBuQXBwZWFyc0ZpcnN0KVxuXHRcdFx0XHRyZXR1cm4gJ1xcbic7XG5cblx0XHRcdHZhciBudW1XaXRoTiA9IDA7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHIubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChyW2ldWzBdID09PSAnXFxuJylcblx0XHRcdFx0XHRudW1XaXRoTisrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbnVtV2l0aE4gPj0gci5sZW5ndGggLyAyID8gJ1xcclxcbicgOiAnXFxyJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cnlQYXJzZUZsb2F0KHZhbClcblx0XHR7XG5cdFx0XHR2YXIgaXNOdW1iZXIgPSBGTE9BVC50ZXN0KHZhbCk7XG5cdFx0XHRyZXR1cm4gaXNOdW1iZXIgPyBwYXJzZUZsb2F0KHZhbCkgOiB2YWw7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gYWRkRXJyb3IodHlwZSwgY29kZSwgbXNnLCByb3cpXG5cdFx0e1xuXHRcdFx0X3Jlc3VsdHMuZXJyb3JzLnB1c2goe1xuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRtZXNzYWdlOiBtc2csXG5cdFx0XHRcdHJvdzogcm93XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cblxuXG5cdC8qKiBUaGUgY29yZSBwYXJzZXIgaW1wbGVtZW50cyBzcGVlZHkgYW5kIGNvcnJlY3QgQ1NWIHBhcnNpbmcgKi9cblx0ZnVuY3Rpb24gUGFyc2VyKGNvbmZpZylcblx0e1xuXHRcdC8vIFVucGFjayB0aGUgY29uZmlnIG9iamVjdFxuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHR2YXIgZGVsaW0gPSBjb25maWcuZGVsaW1pdGVyO1xuXHRcdHZhciBuZXdsaW5lID0gY29uZmlnLm5ld2xpbmU7XG5cdFx0dmFyIGNvbW1lbnRzID0gY29uZmlnLmNvbW1lbnRzO1xuXHRcdHZhciBzdGVwID0gY29uZmlnLnN0ZXA7XG5cdFx0dmFyIHByZXZpZXcgPSBjb25maWcucHJldmlldztcblx0XHR2YXIgZmFzdE1vZGUgPSBjb25maWcuZmFzdE1vZGU7XG5cdFx0dmFyIHF1b3RlQ2hhciA9IGNvbmZpZy5xdW90ZUNoYXIgfHwgJ1wiJztcblxuXHRcdC8vIERlbGltaXRlciBtdXN0IGJlIHZhbGlkXG5cdFx0aWYgKHR5cGVvZiBkZWxpbSAhPT0gJ3N0cmluZydcblx0XHRcdHx8IFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihkZWxpbSkgPiAtMSlcblx0XHRcdGRlbGltID0gJywnO1xuXG5cdFx0Ly8gQ29tbWVudCBjaGFyYWN0ZXIgbXVzdCBiZSB2YWxpZFxuXHRcdGlmIChjb21tZW50cyA9PT0gZGVsaW0pXG5cdFx0XHR0aHJvdyAnQ29tbWVudCBjaGFyYWN0ZXIgc2FtZSBhcyBkZWxpbWl0ZXInO1xuXHRcdGVsc2UgaWYgKGNvbW1lbnRzID09PSB0cnVlKVxuXHRcdFx0Y29tbWVudHMgPSAnIyc7XG5cdFx0ZWxzZSBpZiAodHlwZW9mIGNvbW1lbnRzICE9PSAnc3RyaW5nJ1xuXHRcdFx0fHwgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKGNvbW1lbnRzKSA+IC0xKVxuXHRcdFx0Y29tbWVudHMgPSBmYWxzZTtcblxuXHRcdC8vIE5ld2xpbmUgbXVzdCBiZSB2YWxpZDogXFxyLCBcXG4sIG9yIFxcclxcblxuXHRcdGlmIChuZXdsaW5lICE9ICdcXG4nICYmIG5ld2xpbmUgIT0gJ1xccicgJiYgbmV3bGluZSAhPSAnXFxyXFxuJylcblx0XHRcdG5ld2xpbmUgPSAnXFxuJztcblxuXHRcdC8vIFdlJ3JlIGdvbm5hIG5lZWQgdGhlc2UgYXQgdGhlIFBhcnNlciBzY29wZVxuXHRcdHZhciBjdXJzb3IgPSAwO1xuXHRcdHZhciBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHQvLyBGb3Igc29tZSByZWFzb24sIGluIENocm9tZSwgdGhpcyBzcGVlZHMgdGhpbmdzIHVwICghPylcblx0XHRcdGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKVxuXHRcdFx0XHR0aHJvdyAnSW5wdXQgbXVzdCBiZSBhIHN0cmluZyc7XG5cblx0XHRcdC8vIFdlIGRvbid0IG5lZWQgdG8gY29tcHV0ZSBzb21lIG9mIHRoZXNlIGV2ZXJ5IHRpbWUgcGFyc2UoKSBpcyBjYWxsZWQsXG5cdFx0XHQvLyBidXQgaGF2aW5nIHRoZW0gaW4gYSBtb3JlIGxvY2FsIHNjb3BlIHNlZW1zIHRvIHBlcmZvcm0gYmV0dGVyXG5cdFx0XHR2YXIgaW5wdXRMZW4gPSBpbnB1dC5sZW5ndGgsXG5cdFx0XHRcdGRlbGltTGVuID0gZGVsaW0ubGVuZ3RoLFxuXHRcdFx0XHRuZXdsaW5lTGVuID0gbmV3bGluZS5sZW5ndGgsXG5cdFx0XHRcdGNvbW1lbnRzTGVuID0gY29tbWVudHMubGVuZ3RoO1xuXHRcdFx0dmFyIHN0ZXBJc0Z1bmN0aW9uID0gdHlwZW9mIHN0ZXAgPT09ICdmdW5jdGlvbic7XG5cblx0XHRcdC8vIEVzdGFibGlzaCBzdGFydGluZyBzdGF0ZVxuXHRcdFx0Y3Vyc29yID0gMDtcblx0XHRcdHZhciBkYXRhID0gW10sIGVycm9ycyA9IFtdLCByb3cgPSBbXSwgbGFzdEN1cnNvciA9IDA7XG5cblx0XHRcdGlmICghaW5wdXQpXG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cblx0XHRcdGlmIChmYXN0TW9kZSB8fCAoZmFzdE1vZGUgIT09IGZhbHNlICYmIGlucHV0LmluZGV4T2YocXVvdGVDaGFyKSA9PT0gLTEpKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgcm93cyA9IGlucHV0LnNwbGl0KG5ld2xpbmUpO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcm93ID0gcm93c1tpXTtcblx0XHRcdFx0XHRjdXJzb3IgKz0gcm93Lmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoaSAhPT0gcm93cy5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdFx0Y3Vyc29yICs9IG5ld2xpbmUubGVuZ3RoO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cuc3Vic3RyKDAsIGNvbW1lbnRzTGVuKSA9PT0gY29tbWVudHMpXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgaSA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBkYXRhLnNsaWNlKDAsIHByZXZpZXcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0dmFyIG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0dmFyIHF1b3RlQ2hhclJlZ2V4ID0gbmV3IFJlZ0V4cChxdW90ZUNoYXIrcXVvdGVDaGFyLCAnZycpO1xuXG5cdFx0XHQvLyBQYXJzZXIgbG9vcFxuXHRcdFx0Zm9yICg7Oylcblx0XHRcdHtcblx0XHRcdFx0Ly8gRmllbGQgaGFzIG9wZW5pbmcgcXVvdGVcblx0XHRcdFx0aWYgKGlucHV0W2N1cnNvcl0gPT09IHF1b3RlQ2hhcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIFN0YXJ0IG91ciBzZWFyY2ggZm9yIHRoZSBjbG9zaW5nIHF1b3RlIHdoZXJlIHRoZSBjdXJzb3IgaXNcblx0XHRcdFx0XHR2YXIgcXVvdGVTZWFyY2ggPSBjdXJzb3I7XG5cblx0XHRcdFx0XHQvLyBTa2lwIHRoZSBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdFx0Y3Vyc29yKys7XG5cblx0XHRcdFx0XHRmb3IgKDs7KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEZpbmQgY2xvc2luZyBxdW90ZVxuXHRcdFx0XHRcdFx0dmFyIHF1b3RlU2VhcmNoID0gaW5wdXQuaW5kZXhPZihxdW90ZUNoYXIsIHF1b3RlU2VhcmNoKzEpO1xuXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVTZWFyY2ggPT09IC0xKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAoIWlnbm9yZUxhc3RSb3cpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBObyBjbG9zaW5nIHF1b3RlLi4uIHdoYXQgYSBwaXR5XG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogJ1F1b3RlcycsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb2RlOiAnTWlzc2luZ1F1b3RlcycsXG5cdFx0XHRcdFx0XHRcdFx0XHRtZXNzYWdlOiAnUXVvdGVkIGZpZWxkIHVudGVybWluYXRlZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRyb3c6IGRhdGEubGVuZ3RoLFx0Ly8gcm93IGhhcyB5ZXQgdG8gYmUgaW5zZXJ0ZWRcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBjdXJzb3Jcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChxdW90ZVNlYXJjaCA9PT0gaW5wdXRMZW4tMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBhdCBFT0Zcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIHF1b3RlQ2hhcik7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmaW5pc2godmFsdWUpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGlzIHF1b3RlIGlzIGVzY2FwZWQsIGl0J3MgcGFydCBvZiB0aGUgZGF0YTsgc2tpcCBpdFxuXHRcdFx0XHRcdFx0aWYgKGlucHV0W3F1b3RlU2VhcmNoKzFdID09PSBxdW90ZUNoYXIpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHF1b3RlU2VhcmNoKys7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2grMV0gPT09IGRlbGltKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IGRlbGltaXRlclxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgcXVvdGVDaGFyKSk7XG5cdFx0XHRcdFx0XHRcdGN1cnNvciA9IHF1b3RlU2VhcmNoICsgMSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpbnB1dC5zdWJzdHIocXVvdGVTZWFyY2grMSwgbmV3bGluZUxlbikgPT09IG5ld2xpbmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgbmV3bGluZVxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgcXVvdGVDaGFyKSk7XG5cdFx0XHRcdFx0XHRcdHNhdmVSb3cocXVvdGVTZWFyY2ggKyAxICsgbmV3bGluZUxlbik7XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XHQvLyBiZWNhdXNlIHdlIG1heSBoYXZlIHNraXBwZWQgdGhlIG5leHREZWxpbSBpbiB0aGUgcXVvdGVkIGZpZWxkXG5cblx0XHRcdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENvbW1lbnQgZm91bmQgYXQgc3RhcnQgb2YgbmV3IGxpbmVcblx0XHRcdFx0aWYgKGNvbW1lbnRzICYmIHJvdy5sZW5ndGggPT09IDAgJiYgaW5wdXQuc3Vic3RyKGN1cnNvciwgY29tbWVudHNMZW4pID09PSBjb21tZW50cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChuZXh0TmV3bGluZSA9PT0gLTEpXHQvLyBDb21tZW50IGVuZHMgYXQgRU9GXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHROZXdsaW5lICsgbmV3bGluZUxlbjtcblx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTmV4dCBkZWxpbWl0ZXIgY29tZXMgYmVmb3JlIG5leHQgbmV3bGluZSwgc28gd2UndmUgcmVhY2hlZCBlbmQgb2YgZmllbGRcblx0XHRcdFx0aWYgKG5leHREZWxpbSAhPT0gLTEgJiYgKG5leHREZWxpbSA8IG5leHROZXdsaW5lIHx8IG5leHROZXdsaW5lID09PSAtMSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0RGVsaW0pKTtcblx0XHRcdFx0XHRjdXJzb3IgPSBuZXh0RGVsaW0gKyBkZWxpbUxlbjtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRW5kIG9mIHJvd1xuXHRcdFx0XHRpZiAobmV4dE5ld2xpbmUgIT09IC0xKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgbmV4dE5ld2xpbmUpKTtcblx0XHRcdFx0XHRzYXZlUm93KG5leHROZXdsaW5lICsgbmV3bGluZUxlbik7XG5cblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBkYXRhLmxlbmd0aCA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cblx0XHRcdHJldHVybiBmaW5pc2goKTtcblxuXG5cdFx0XHRmdW5jdGlvbiBwdXNoUm93KHJvdylcblx0XHRcdHtcblx0XHRcdFx0ZGF0YS5wdXNoKHJvdyk7XG5cdFx0XHRcdGxhc3RDdXJzb3IgPSBjdXJzb3I7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgcmVtYWluaW5nIGlucHV0IGZyb20gY3Vyc29yIHRvIHRoZSBlbmQgaW50b1xuXHRcdFx0ICogcm93LCBzYXZlcyB0aGUgcm93LCBjYWxscyBzdGVwLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cy5cblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gZmluaXNoKHZhbHVlKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoaWdub3JlTGFzdFJvdylcblx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR2YWx1ZSA9IGlucHV0LnN1YnN0cihjdXJzb3IpO1xuXHRcdFx0XHRyb3cucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdGN1cnNvciA9IGlucHV0TGVuO1x0Ly8gaW1wb3J0YW50IGluIGNhc2UgcGFyc2luZyBpcyBwYXVzZWRcblx0XHRcdFx0cHVzaFJvdyhyb3cpO1xuXHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgY3VycmVudCByb3cgdG8gdGhlIHJlc3VsdHMuIEl0IHNldHMgdGhlIGN1cnNvclxuXHRcdFx0ICogdG8gbmV3Q3Vyc29yIGFuZCBmaW5kcyB0aGUgbmV4dE5ld2xpbmUuIFRoZSBjYWxsZXIgc2hvdWxkXG5cdFx0XHQgKiB0YWtlIGNhcmUgdG8gZXhlY3V0ZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgY2hlY2sgZm9yXG5cdFx0XHQgKiBwcmV2aWV3IGFuZCBlbmQgcGFyc2luZyBpZiBuZWNlc3NhcnkuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIHNhdmVSb3cobmV3Q3Vyc29yKVxuXHRcdFx0e1xuXHRcdFx0XHRjdXJzb3IgPSBuZXdDdXJzb3I7XG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0cm93ID0gW107XG5cdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgcmVzdWx0cywgZXJyb3JzLCBhbmQgbWV0YS4gKi9cblx0XHRcdGZ1bmN0aW9uIHJldHVybmFibGUoc3RvcHBlZClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0XHRcdGVycm9yczogZXJyb3JzLFxuXHRcdFx0XHRcdG1ldGE6IHtcblx0XHRcdFx0XHRcdGRlbGltaXRlcjogZGVsaW0sXG5cdFx0XHRcdFx0XHRsaW5lYnJlYWs6IG5ld2xpbmUsXG5cdFx0XHRcdFx0XHRhYm9ydGVkOiBhYm9ydGVkLFxuXHRcdFx0XHRcdFx0dHJ1bmNhdGVkOiAhIXN0b3BwZWQsXG5cdFx0XHRcdFx0XHRjdXJzb3I6IGxhc3RDdXJzb3IgKyAoYmFzZUluZGV4IHx8IDApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogRXhlY3V0ZXMgdGhlIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFuZCByZXNldHMgZGF0YSAmIGVycm9ycy4gKi9cblx0XHRcdGZ1bmN0aW9uIGRvU3RlcCgpXG5cdFx0XHR7XG5cdFx0XHRcdHN0ZXAocmV0dXJuYWJsZSgpKTtcblx0XHRcdFx0ZGF0YSA9IFtdLCBlcnJvcnMgPSBbXTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIFNldHMgdGhlIGFib3J0IGZsYWcgKi9cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdH07XG5cblx0XHQvKiogR2V0cyB0aGUgY3Vyc29yIHBvc2l0aW9uICovXG5cdFx0dGhpcy5nZXRDaGFySW5kZXggPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGN1cnNvcjtcblx0XHR9O1xuXHR9XG5cblxuXHQvLyBJZiB5b3UgbmVlZCB0byBsb2FkIFBhcGEgUGFyc2UgYXN5bmNocm9ub3VzbHkgYW5kIHlvdSBhbHNvIG5lZWQgd29ya2VyIHRocmVhZHMsIGhhcmQtY29kZVxuXHQvLyB0aGUgc2NyaXB0IHBhdGggaGVyZS4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy84NyNpc3N1ZWNvbW1lbnQtNTc4ODUzNThcblx0ZnVuY3Rpb24gZ2V0U2NyaXB0UGF0aCgpXG5cdHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0XHRyZXR1cm4gc2NyaXB0cy5sZW5ndGggPyBzY3JpcHRzW3NjcmlwdHMubGVuZ3RoIC0gMV0uc3JjIDogJyc7XG5cdH1cblxuXHRmdW5jdGlvbiBuZXdXb3JrZXIoKVxuXHR7XG5cdFx0aWYgKCFQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdGlmICghTE9BREVEX1NZTkMgJiYgUGFwYS5TQ1JJUFRfUEFUSCA9PT0gbnVsbClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0J1NjcmlwdCBwYXRoIGNhbm5vdCBiZSBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBQYXBhIFBhcnNlIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseS4gJyArXG5cdFx0XHRcdCdZb3UgbmVlZCB0byBzZXQgUGFwYS5TQ1JJUFRfUEFUSCBtYW51YWxseS4nXG5cdFx0XHQpO1xuXHRcdHZhciB3b3JrZXJVcmwgPSBQYXBhLlNDUklQVF9QQVRIIHx8IEFVVE9fU0NSSVBUX1BBVEg7XG5cdFx0Ly8gQXBwZW5kICdwYXBhd29ya2VyJyB0byB0aGUgc2VhcmNoIHN0cmluZyB0byB0ZWxsIHBhcGFwYXJzZSB0aGF0IHRoaXMgaXMgb3VyIHdvcmtlci5cblx0XHR3b3JrZXJVcmwgKz0gKHdvcmtlclVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArICdwYXBhd29ya2VyJztcblx0XHR2YXIgdyA9IG5ldyBnbG9iYWwuV29ya2VyKHdvcmtlclVybCk7XG5cdFx0dy5vbm1lc3NhZ2UgPSBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHRcdHcuaWQgPSB3b3JrZXJJZENvdW50ZXIrKztcblx0XHR3b3JrZXJzW3cuaWRdID0gdztcblx0XHRyZXR1cm4gdztcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIG1haW4gdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlKGUpXG5cdHtcblx0XHR2YXIgbXNnID0gZS5kYXRhO1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW21zZy53b3JrZXJJZF07XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdGlmIChtc2cuZXJyb3IpXG5cdFx0XHR3b3JrZXIudXNlckVycm9yKG1zZy5lcnJvciwgbXNnLmZpbGUpO1xuXHRcdGVsc2UgaWYgKG1zZy5yZXN1bHRzICYmIG1zZy5yZXN1bHRzLmRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0XHRjb21wbGV0ZVdvcmtlcihtc2cud29ya2VySWQsIHsgZGF0YTogW10sIGVycm9yczogW10sIG1ldGE6IHsgYWJvcnRlZDogdHJ1ZSB9IH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGhhbmRsZSA9IHtcblx0XHRcdFx0YWJvcnQ6IGFib3J0LFxuXHRcdFx0XHRwYXVzZTogbm90SW1wbGVtZW50ZWQsXG5cdFx0XHRcdHJlc3VtZTogbm90SW1wbGVtZW50ZWRcblx0XHRcdH07XG5cblx0XHRcdGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyU3RlcCkpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLnJlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHdvcmtlci51c2VyU3RlcCh7XG5cdFx0XHRcdFx0XHRkYXRhOiBbbXNnLnJlc3VsdHMuZGF0YVtpXV0sXG5cdFx0XHRcdFx0XHRlcnJvcnM6IG1zZy5yZXN1bHRzLmVycm9ycyxcblx0XHRcdFx0XHRcdG1ldGE6IG1zZy5yZXN1bHRzLm1ldGFcblx0XHRcdFx0XHR9LCBoYW5kbGUpO1xuXHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVsZXRlIG1zZy5yZXN1bHRzO1x0Ly8gZnJlZSBtZW1vcnkgQVNBUFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0d29ya2VyLnVzZXJDaHVuayhtc2cucmVzdWx0cywgaGFuZGxlLCBtc2cuZmlsZSk7XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobXNnLmZpbmlzaGVkICYmICFhYm9ydGVkKVxuXHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCBtc2cucmVzdWx0cyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb21wbGV0ZVdvcmtlcih3b3JrZXJJZCwgcmVzdWx0cykge1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW3dvcmtlcklkXTtcblx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNvbXBsZXRlKSlcblx0XHRcdHdvcmtlci51c2VyQ29tcGxldGUocmVzdWx0cyk7XG5cdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xuXHRcdGRlbGV0ZSB3b3JrZXJzW3dvcmtlcklkXTtcblx0fVxuXG5cdGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCkge1xuXHRcdHRocm93ICdOb3QgaW1wbGVtZW50ZWQuJztcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIHdvcmtlciB0aHJlYWQgcmVjZWl2ZXMgYSBtZXNzYWdlICovXG5cdGZ1bmN0aW9uIHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblxuXHRcdGlmICh0eXBlb2YgUGFwYS5XT1JLRVJfSUQgPT09ICd1bmRlZmluZWQnICYmIG1zZylcblx0XHRcdFBhcGEuV09SS0VSX0lEID0gbXNnLndvcmtlcklkO1xuXG5cdFx0aWYgKHR5cGVvZiBtc2cuaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0cmVzdWx0czogUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpLFxuXHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChnbG9iYWwuRmlsZSAmJiBtc2cuaW5wdXQgaW5zdGFuY2VvZiBGaWxlKSB8fCBtc2cuaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpXHQvLyB0aGFuayB5b3UsIFNhZmFyaSAoc2VlIGlzc3VlICMxMDYpXG5cdFx0e1xuXHRcdFx0dmFyIHJlc3VsdHMgPSBQYXBhLnBhcnNlKG1zZy5pbnB1dCwgbXNnLmNvbmZpZyk7XG5cdFx0XHRpZiAocmVzdWx0cylcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHQvKiogTWFrZXMgYSBkZWVwIGNvcHkgb2YgYW4gYXJyYXkgb3Igb2JqZWN0IChtb3N0bHkpICovXG5cdGZ1bmN0aW9uIGNvcHkob2JqKVxuXHR7XG5cdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR2YXIgY3B5ID0gb2JqIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRjcHlba2V5XSA9IGNvcHkob2JqW2tleV0pO1xuXHRcdHJldHVybiBjcHk7XG5cdH1cblxuXHRmdW5jdGlvbiBiaW5kRnVuY3Rpb24oZiwgc2VsZilcblx0e1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHsgZi5hcHBseShzZWxmLCBhcmd1bWVudHMpOyB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jKVxuXHR7XG5cdFx0cmV0dXJuIHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nO1xuXHR9XG5cblx0cmV0dXJuIFBhcGE7XG59KSk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyohIHRldGhlciAxLjQuMCAqL1xuXG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuVGV0aGVyID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgVGV0aGVyQmFzZSA9IHVuZGVmaW5lZDtcbmlmICh0eXBlb2YgVGV0aGVyQmFzZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgVGV0aGVyQmFzZSA9IHsgbW9kdWxlczogW10gfTtcbn1cblxudmFyIHplcm9FbGVtZW50ID0gbnVsbDtcblxuLy8gU2FtZSBhcyBuYXRpdmUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0LCBleGNlcHQgaXQgdGFrZXMgaW50byBhY2NvdW50IHBhcmVudCA8ZnJhbWU+IG9mZnNldHNcbi8vIGlmIHRoZSBlbGVtZW50IGxpZXMgd2l0aGluIGEgbmVzdGVkIGRvY3VtZW50ICg8ZnJhbWU+IG9yIDxpZnJhbWU+LWxpa2UpLlxuZnVuY3Rpb24gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KG5vZGUpIHtcbiAgdmFyIGJvdW5kaW5nUmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgLy8gVGhlIG9yaWdpbmFsIG9iamVjdCByZXR1cm5lZCBieSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgaW1tdXRhYmxlLCBzbyB3ZSBjbG9uZSBpdFxuICAvLyBXZSBjYW4ndCB1c2UgZXh0ZW5kIGJlY2F1c2UgdGhlIHByb3BlcnRpZXMgYXJlIG5vdCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIG9iamVjdCBieSBoYXNPd25Qcm9wZXJ0eSBpbiBJRTlcbiAgdmFyIHJlY3QgPSB7fTtcbiAgZm9yICh2YXIgayBpbiBib3VuZGluZ1JlY3QpIHtcbiAgICByZWN0W2tdID0gYm91bmRpbmdSZWN0W2tdO1xuICB9XG5cbiAgaWYgKG5vZGUub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICB2YXIgX2ZyYW1lRWxlbWVudCA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5mcmFtZUVsZW1lbnQ7XG4gICAgaWYgKF9mcmFtZUVsZW1lbnQpIHtcbiAgICAgIHZhciBmcmFtZVJlY3QgPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QoX2ZyYW1lRWxlbWVudCk7XG4gICAgICByZWN0LnRvcCArPSBmcmFtZVJlY3QudG9wO1xuICAgICAgcmVjdC5ib3R0b20gKz0gZnJhbWVSZWN0LnRvcDtcbiAgICAgIHJlY3QubGVmdCArPSBmcmFtZVJlY3QubGVmdDtcbiAgICAgIHJlY3QucmlnaHQgKz0gZnJhbWVSZWN0LmxlZnQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlY3Q7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFBhcmVudHMoZWwpIHtcbiAgLy8gSW4gZmlyZWZveCBpZiB0aGUgZWwgaXMgaW5zaWRlIGFuIGlmcmFtZSB3aXRoIGRpc3BsYXk6IG5vbmU7IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCkgd2lsbCByZXR1cm4gbnVsbDtcbiAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCkgfHwge307XG4gIHZhciBwb3NpdGlvbiA9IGNvbXB1dGVkU3R5bGUucG9zaXRpb247XG4gIHZhciBwYXJlbnRzID0gW107XG5cbiAgaWYgKHBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG4gICAgcmV0dXJuIFtlbF07XG4gIH1cblxuICB2YXIgcGFyZW50ID0gZWw7XG4gIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpICYmIHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT09IDEpIHtcbiAgICB2YXIgc3R5bGUgPSB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpO1xuICAgIH0gY2F0Y2ggKGVycikge31cblxuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICd1bmRlZmluZWQnIHx8IHN0eWxlID09PSBudWxsKSB7XG4gICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgIHJldHVybiBwYXJlbnRzO1xuICAgIH1cblxuICAgIHZhciBfc3R5bGUgPSBzdHlsZTtcbiAgICB2YXIgb3ZlcmZsb3cgPSBfc3R5bGUub3ZlcmZsb3c7XG4gICAgdmFyIG92ZXJmbG93WCA9IF9zdHlsZS5vdmVyZmxvd1g7XG4gICAgdmFyIG92ZXJmbG93WSA9IF9zdHlsZS5vdmVyZmxvd1k7XG5cbiAgICBpZiAoLyhhdXRvfHNjcm9sbCkvLnRlc3Qob3ZlcmZsb3cgKyBvdmVyZmxvd1kgKyBvdmVyZmxvd1gpKSB7XG4gICAgICBpZiAocG9zaXRpb24gIT09ICdhYnNvbHV0ZScgfHwgWydyZWxhdGl2ZScsICdhYnNvbHV0ZScsICdmaXhlZCddLmluZGV4T2Yoc3R5bGUucG9zaXRpb24pID49IDApIHtcbiAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyZW50cy5wdXNoKGVsLm93bmVyRG9jdW1lbnQuYm9keSk7XG5cbiAgLy8gSWYgdGhlIG5vZGUgaXMgd2l0aGluIGEgZnJhbWUsIGFjY291bnQgZm9yIHRoZSBwYXJlbnQgd2luZG93IHNjcm9sbFxuICBpZiAoZWwub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICBwYXJlbnRzLnB1c2goZWwub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldyk7XG4gIH1cblxuICByZXR1cm4gcGFyZW50cztcbn1cblxudmFyIHVuaXF1ZUlkID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGlkID0gMDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKytpZDtcbiAgfTtcbn0pKCk7XG5cbnZhciB6ZXJvUG9zQ2FjaGUgPSB7fTtcbnZhciBnZXRPcmlnaW4gPSBmdW5jdGlvbiBnZXRPcmlnaW4oKSB7XG4gIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyB1bmZvcnR1bmF0ZWx5IHRvbyBhY2N1cmF0ZS4gIEl0IGludHJvZHVjZXMgYSBwaXhlbCBvciB0d28gb2ZcbiAgLy8gaml0dGVyIGFzIHRoZSB1c2VyIHNjcm9sbHMgdGhhdCBtZXNzZXMgd2l0aCBvdXIgYWJpbGl0eSB0byBkZXRlY3QgaWYgdHdvIHBvc2l0aW9uc1xuICAvLyBhcmUgZXF1aXZpbGFudCBvciBub3QuICBXZSBwbGFjZSBhbiBlbGVtZW50IGF0IHRoZSB0b3AgbGVmdCBvZiB0aGUgcGFnZSB0aGF0IHdpbGxcbiAgLy8gZ2V0IHRoZSBzYW1lIGppdHRlciwgc28gd2UgY2FuIGNhbmNlbCB0aGUgdHdvIG91dC5cbiAgdmFyIG5vZGUgPSB6ZXJvRWxlbWVudDtcbiAgaWYgKCFub2RlIHx8ICFkb2N1bWVudC5ib2R5LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcsIHVuaXF1ZUlkKCkpO1xuICAgIGV4dGVuZChub2RlLnN0eWxlLCB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSk7XG5cbiAgICB6ZXJvRWxlbWVudCA9IG5vZGU7XG4gIH1cblxuICB2YXIgaWQgPSBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnKTtcbiAgaWYgKHR5cGVvZiB6ZXJvUG9zQ2FjaGVbaWRdID09PSAndW5kZWZpbmVkJykge1xuICAgIHplcm9Qb3NDYWNoZVtpZF0gPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Qobm9kZSk7XG5cbiAgICAvLyBDbGVhciB0aGUgY2FjaGUgd2hlbiB0aGlzIHBvc2l0aW9uIGNhbGwgaXMgZG9uZVxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlbGV0ZSB6ZXJvUG9zQ2FjaGVbaWRdO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHplcm9Qb3NDYWNoZVtpZF07XG59O1xuXG5mdW5jdGlvbiByZW1vdmVVdGlsRWxlbWVudHMoKSB7XG4gIGlmICh6ZXJvRWxlbWVudCkge1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoemVyb0VsZW1lbnQpO1xuICB9XG4gIHplcm9FbGVtZW50ID0gbnVsbDtcbn07XG5cbmZ1bmN0aW9uIGdldEJvdW5kcyhlbCkge1xuICB2YXIgZG9jID0gdW5kZWZpbmVkO1xuICBpZiAoZWwgPT09IGRvY3VtZW50KSB7XG4gICAgZG9jID0gZG9jdW1lbnQ7XG4gICAgZWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgZG9jID0gZWwub3duZXJEb2N1bWVudDtcbiAgfVxuXG4gIHZhciBkb2NFbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgdmFyIGJveCA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChlbCk7XG5cbiAgdmFyIG9yaWdpbiA9IGdldE9yaWdpbigpO1xuXG4gIGJveC50b3AgLT0gb3JpZ2luLnRvcDtcbiAgYm94LmxlZnQgLT0gb3JpZ2luLmxlZnQ7XG5cbiAgaWYgKHR5cGVvZiBib3gud2lkdGggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm94LndpZHRoID0gZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCAtIGJveC5sZWZ0IC0gYm94LnJpZ2h0O1xuICB9XG4gIGlmICh0eXBlb2YgYm94LmhlaWdodCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3guaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQgLSBib3gudG9wIC0gYm94LmJvdHRvbTtcbiAgfVxuXG4gIGJveC50b3AgPSBib3gudG9wIC0gZG9jRWwuY2xpZW50VG9wO1xuICBib3gubGVmdCA9IGJveC5sZWZ0IC0gZG9jRWwuY2xpZW50TGVmdDtcbiAgYm94LnJpZ2h0ID0gZG9jLmJvZHkuY2xpZW50V2lkdGggLSBib3gud2lkdGggLSBib3gubGVmdDtcbiAgYm94LmJvdHRvbSA9IGRvYy5ib2R5LmNsaWVudEhlaWdodCAtIGJveC5oZWlnaHQgLSBib3gudG9wO1xuXG4gIHJldHVybiBib3g7XG59XG5cbmZ1bmN0aW9uIGdldE9mZnNldFBhcmVudChlbCkge1xuICByZXR1cm4gZWwub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbn1cblxudmFyIF9zY3JvbGxCYXJTaXplID0gbnVsbDtcbmZ1bmN0aW9uIGdldFNjcm9sbEJhclNpemUoKSB7XG4gIGlmIChfc2Nyb2xsQmFyU2l6ZSkge1xuICAgIHJldHVybiBfc2Nyb2xsQmFyU2l6ZTtcbiAgfVxuICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XG5cbiAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGV4dGVuZChvdXRlci5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJyxcbiAgICB3aWR0aDogJzIwMHB4JyxcbiAgICBoZWlnaHQ6ICcxNTBweCcsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nXG4gIH0pO1xuXG4gIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcblxuICB2YXIgd2lkdGhDb250YWluZWQgPSBpbm5lci5vZmZzZXRXaWR0aDtcbiAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcbiAgdmFyIHdpZHRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cbiAgaWYgKHdpZHRoQ29udGFpbmVkID09PSB3aWR0aFNjcm9sbCkge1xuICAgIHdpZHRoU2Nyb2xsID0gb3V0ZXIuY2xpZW50V2lkdGg7XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG91dGVyKTtcblxuICB2YXIgd2lkdGggPSB3aWR0aENvbnRhaW5lZCAtIHdpZHRoU2Nyb2xsO1xuXG4gIF9zY3JvbGxCYXJTaXplID0geyB3aWR0aDogd2lkdGgsIGhlaWdodDogd2lkdGggfTtcbiAgcmV0dXJuIF9zY3JvbGxCYXJTaXplO1xufVxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gIHZhciBvdXQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuICB2YXIgYXJncyA9IFtdO1xuXG4gIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG5cbiAgYXJncy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICBpZiAob2JqKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgaWYgKGNscy50cmltKCkpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShjbHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUuc3BsaXQoJyAnKS5qb2luKCd8JykgKyAnKCB8JCknLCAnZ2knKTtcbiAgICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKS5yZXBsYWNlKHJlZ2V4LCAnICcpO1xuICAgIHNldENsYXNzTmFtZShlbCwgY2xhc3NOYW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBpZiAoY2xzLnRyaW0oKSkge1xuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGNscyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuICAgIHZhciBjbHMgPSBnZXRDbGFzc05hbWUoZWwpICsgKCcgJyArIG5hbWUpO1xuICAgIHNldENsYXNzTmFtZShlbCwgY2xzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpO1xuICB9XG4gIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpO1xuICByZXR1cm4gbmV3IFJlZ0V4cCgnKF58ICknICsgbmFtZSArICcoIHwkKScsICdnaScpLnRlc3QoY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKGVsKSB7XG4gIC8vIENhbid0IHVzZSBqdXN0IFNWR0FuaW1hdGVkU3RyaW5nIGhlcmUgc2luY2Ugbm9kZXMgd2l0aGluIGEgRnJhbWUgaW4gSUUgaGF2ZVxuICAvLyBjb21wbGV0ZWx5IHNlcGFyYXRlbHkgU1ZHQW5pbWF0ZWRTdHJpbmcgYmFzZSBjbGFzc2VzXG4gIGlmIChlbC5jbGFzc05hbWUgaW5zdGFuY2VvZiBlbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LlNWR0FuaW1hdGVkU3RyaW5nKSB7XG4gICAgcmV0dXJuIGVsLmNsYXNzTmFtZS5iYXNlVmFsO1xuICB9XG4gIHJldHVybiBlbC5jbGFzc05hbWU7XG59XG5cbmZ1bmN0aW9uIHNldENsYXNzTmFtZShlbCwgY2xhc3NOYW1lKSB7XG4gIGVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDbGFzc2VzKGVsLCBhZGQsIGFsbCkge1xuICAvLyBPZiB0aGUgc2V0IG9mICdhbGwnIGNsYXNzZXMsIHdlIG5lZWQgdGhlICdhZGQnIGNsYXNzZXMsIGFuZCBvbmx5IHRoZVxuICAvLyAnYWRkJyBjbGFzc2VzIHRvIGJlIHNldC5cbiAgYWxsLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgIGlmIChhZGQuaW5kZXhPZihjbHMpID09PSAtMSAmJiBoYXNDbGFzcyhlbCwgY2xzKSkge1xuICAgICAgcmVtb3ZlQ2xhc3MoZWwsIGNscyk7XG4gICAgfVxuICB9KTtcblxuICBhZGQuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgaWYgKCFoYXNDbGFzcyhlbCwgY2xzKSkge1xuICAgICAgYWRkQ2xhc3MoZWwsIGNscyk7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGRlZmVycmVkID0gW107XG5cbnZhciBkZWZlciA9IGZ1bmN0aW9uIGRlZmVyKGZuKSB7XG4gIGRlZmVycmVkLnB1c2goZm4pO1xufTtcblxudmFyIGZsdXNoID0gZnVuY3Rpb24gZmx1c2goKSB7XG4gIHZhciBmbiA9IHVuZGVmaW5lZDtcbiAgd2hpbGUgKGZuID0gZGVmZXJyZWQucG9wKCkpIHtcbiAgICBmbigpO1xuICB9XG59O1xuXG52YXIgRXZlbnRlZCA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50ZWQpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEV2ZW50ZWQsIFt7XG4gICAga2V5OiAnb24nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbihldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICB2YXIgb25jZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5nc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdID0gW107XG4gICAgICB9XG4gICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5wdXNoKHsgaGFuZGxlcjogaGFuZGxlciwgY3R4OiBjdHgsIG9uY2U6IG9uY2UgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb25jZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvZmYnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvZmYoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0cmlnZ2VyJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdHJpZ2dlcihldmVudCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmJpbmRpbmdzW2V2ZW50XSkge1xuICAgICAgICB2YXIgaSA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBfYmluZGluZ3MkZXZlbnQkaSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldO1xuICAgICAgICAgIHZhciBoYW5kbGVyID0gX2JpbmRpbmdzJGV2ZW50JGkuaGFuZGxlcjtcbiAgICAgICAgICB2YXIgY3R4ID0gX2JpbmRpbmdzJGV2ZW50JGkuY3R4O1xuICAgICAgICAgIHZhciBvbmNlID0gX2JpbmRpbmdzJGV2ZW50JGkub25jZTtcblxuICAgICAgICAgIHZhciBjb250ZXh0ID0gY3R4O1xuICAgICAgICAgIGlmICh0eXBlb2YgY29udGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGhhbmRsZXIuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cbiAgICAgICAgICBpZiAob25jZSkge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICArK2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEV2ZW50ZWQ7XG59KSgpO1xuXG5UZXRoZXJCYXNlLlV0aWxzID0ge1xuICBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Q6IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdCxcbiAgZ2V0U2Nyb2xsUGFyZW50czogZ2V0U2Nyb2xsUGFyZW50cyxcbiAgZ2V0Qm91bmRzOiBnZXRCb3VuZHMsXG4gIGdldE9mZnNldFBhcmVudDogZ2V0T2Zmc2V0UGFyZW50LFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbiAgdXBkYXRlQ2xhc3NlczogdXBkYXRlQ2xhc3NlcyxcbiAgZGVmZXI6IGRlZmVyLFxuICBmbHVzaDogZmx1c2gsXG4gIHVuaXF1ZUlkOiB1bmlxdWVJZCxcbiAgRXZlbnRlZDogRXZlbnRlZCxcbiAgZ2V0U2Nyb2xsQmFyU2l6ZTogZ2V0U2Nyb2xsQmFyU2l6ZSxcbiAgcmVtb3ZlVXRpbEVsZW1lbnRzOiByZW1vdmVVdGlsRWxlbWVudHNcbn07XG4vKiBnbG9iYWxzIFRldGhlckJhc2UsIHBlcmZvcm1hbmNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94NiwgX3g3LCBfeDgpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3g2LCBwcm9wZXJ0eSA9IF94NywgcmVjZWl2ZXIgPSBfeDg7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3g2ID0gcGFyZW50OyBfeDcgPSBwcm9wZXJ0eTsgX3g4ID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGRlc2MgPSBwYXJlbnQgPSB1bmRlZmluZWQ7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKCd2YWx1ZScgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbmlmICh0eXBlb2YgVGV0aGVyQmFzZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBpbmNsdWRlIHRoZSB1dGlscy5qcyBmaWxlIGJlZm9yZSB0ZXRoZXIuanMnKTtcbn1cblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRTY3JvbGxQYXJlbnRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsUGFyZW50cztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgZ2V0T2Zmc2V0UGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0T2Zmc2V0UGFyZW50O1xudmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcbnZhciBhZGRDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmFkZENsYXNzO1xudmFyIHJlbW92ZUNsYXNzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlQ2xhc3M7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcbnZhciBmbHVzaCA9IF9UZXRoZXJCYXNlJFV0aWxzLmZsdXNoO1xudmFyIGdldFNjcm9sbEJhclNpemUgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxCYXJTaXplO1xudmFyIHJlbW92ZVV0aWxFbGVtZW50cyA9IF9UZXRoZXJCYXNlJFV0aWxzLnJlbW92ZVV0aWxFbGVtZW50cztcblxuZnVuY3Rpb24gd2l0aGluKGEsIGIpIHtcbiAgdmFyIGRpZmYgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDIgfHwgYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyAxIDogYXJndW1lbnRzWzJdO1xuXG4gIHJldHVybiBhICsgZGlmZiA+PSBiICYmIGIgPj0gYSAtIGRpZmY7XG59XG5cbnZhciB0cmFuc2Zvcm1LZXkgPSAoZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiAnJztcbiAgfVxuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICB2YXIgdHJhbnNmb3JtcyA9IFsndHJhbnNmb3JtJywgJ1dlYmtpdFRyYW5zZm9ybScsICdPVHJhbnNmb3JtJywgJ01velRyYW5zZm9ybScsICdtc1RyYW5zZm9ybSddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zZm9ybXMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIga2V5ID0gdHJhbnNmb3Jtc1tpXTtcbiAgICBpZiAoZWwuc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgfVxufSkoKTtcblxudmFyIHRldGhlcnMgPSBbXTtcblxudmFyIHBvc2l0aW9uID0gZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyKSB7XG4gICAgdGV0aGVyLnBvc2l0aW9uKGZhbHNlKTtcbiAgfSk7XG4gIGZsdXNoKCk7XG59O1xuXG5mdW5jdGlvbiBub3coKSB7XG4gIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICB9XG4gIHJldHVybiArbmV3IERhdGUoKTtcbn1cblxuKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhc3RDYWxsID0gbnVsbDtcbiAgdmFyIGxhc3REdXJhdGlvbiA9IG51bGw7XG4gIHZhciBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cbiAgdmFyIHRpY2sgPSBmdW5jdGlvbiB0aWNrKCkge1xuICAgIGlmICh0eXBlb2YgbGFzdER1cmF0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBsYXN0RHVyYXRpb24gPiAxNikge1xuICAgICAgLy8gV2Ugdm9sdW50YXJpbHkgdGhyb3R0bGUgb3Vyc2VsdmVzIGlmIHdlIGNhbid0IG1hbmFnZSA2MGZwc1xuICAgICAgbGFzdER1cmF0aW9uID0gTWF0aC5taW4obGFzdER1cmF0aW9uIC0gMTYsIDI1MCk7XG5cbiAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGlzIGlzIHRoZSBsYXN0IGV2ZW50LCByZW1lbWJlciB0byBwb3NpdGlvbiBqdXN0IG9uY2UgbW9yZVxuICAgICAgcGVuZGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRpY2ssIDI1MCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsYXN0Q2FsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgbm93KCkgLSBsYXN0Q2FsbCA8IDEwKSB7XG4gICAgICAvLyBTb21lIGJyb3dzZXJzIGNhbGwgZXZlbnRzIGEgbGl0dGxlIHRvbyBmcmVxdWVudGx5LCByZWZ1c2UgdG8gcnVuIG1vcmUgdGhhbiBpcyByZWFzb25hYmxlXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHBlbmRpbmdUaW1lb3V0ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZW91dCk7XG4gICAgICBwZW5kaW5nVGltZW91dCA9IG51bGw7XG4gICAgfVxuXG4gICAgbGFzdENhbGwgPSBub3coKTtcbiAgICBwb3NpdGlvbigpO1xuICAgIGxhc3REdXJhdGlvbiA9IG5vdygpIC0gbGFzdENhbGw7XG4gIH07XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBbJ3Jlc2l6ZScsICdzY3JvbGwnLCAndG91Y2htb3ZlJ10uZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCB0aWNrKTtcbiAgICB9KTtcbiAgfVxufSkoKTtcblxudmFyIE1JUlJPUl9MUiA9IHtcbiAgY2VudGVyOiAnY2VudGVyJyxcbiAgbGVmdDogJ3JpZ2h0JyxcbiAgcmlnaHQ6ICdsZWZ0J1xufTtcblxudmFyIE1JUlJPUl9UQiA9IHtcbiAgbWlkZGxlOiAnbWlkZGxlJyxcbiAgdG9wOiAnYm90dG9tJyxcbiAgYm90dG9tOiAndG9wJ1xufTtcblxudmFyIE9GRlNFVF9NQVAgPSB7XG4gIHRvcDogMCxcbiAgbGVmdDogMCxcbiAgbWlkZGxlOiAnNTAlJyxcbiAgY2VudGVyOiAnNTAlJyxcbiAgYm90dG9tOiAnMTAwJScsXG4gIHJpZ2h0OiAnMTAwJSdcbn07XG5cbnZhciBhdXRvVG9GaXhlZEF0dGFjaG1lbnQgPSBmdW5jdGlvbiBhdXRvVG9GaXhlZEF0dGFjaG1lbnQoYXR0YWNobWVudCwgcmVsYXRpdmVUb0F0dGFjaG1lbnQpIHtcbiAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG4gIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuICBpZiAobGVmdCA9PT0gJ2F1dG8nKSB7XG4gICAgbGVmdCA9IE1JUlJPUl9MUltyZWxhdGl2ZVRvQXR0YWNobWVudC5sZWZ0XTtcbiAgfVxuXG4gIGlmICh0b3AgPT09ICdhdXRvJykge1xuICAgIHRvcCA9IE1JUlJPUl9UQltyZWxhdGl2ZVRvQXR0YWNobWVudC50b3BdO1xuICB9XG5cbiAgcmV0dXJuIHsgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcbn07XG5cbnZhciBhdHRhY2htZW50VG9PZmZzZXQgPSBmdW5jdGlvbiBhdHRhY2htZW50VG9PZmZzZXQoYXR0YWNobWVudCkge1xuICB2YXIgbGVmdCA9IGF0dGFjaG1lbnQubGVmdDtcbiAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG4gIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxlZnQgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF07XG4gIH1cblxuICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC50b3BdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRvcCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC50b3BdO1xuICB9XG5cbiAgcmV0dXJuIHsgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcbn07XG5cbmZ1bmN0aW9uIGFkZE9mZnNldCgpIHtcbiAgdmFyIG91dCA9IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cbiAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIG9mZnNldHMgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICBvZmZzZXRzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICB9XG5cbiAgb2Zmc2V0cy5mb3JFYWNoKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgaWYgKHR5cGVvZiB0b3AgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0b3AgPSBwYXJzZUZsb2F0KHRvcCwgMTApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxlZnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0LCAxMCk7XG4gICAgfVxuXG4gICAgb3V0LnRvcCArPSB0b3A7XG4gICAgb3V0LmxlZnQgKz0gbGVmdDtcbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gb2Zmc2V0VG9QeChvZmZzZXQsIHNpemUpIHtcbiAgaWYgKHR5cGVvZiBvZmZzZXQubGVmdCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LmxlZnQuaW5kZXhPZignJScpICE9PSAtMSkge1xuICAgIG9mZnNldC5sZWZ0ID0gcGFyc2VGbG9hdChvZmZzZXQubGVmdCwgMTApIC8gMTAwICogc2l6ZS53aWR0aDtcbiAgfVxuICBpZiAodHlwZW9mIG9mZnNldC50b3AgPT09ICdzdHJpbmcnICYmIG9mZnNldC50b3AuaW5kZXhPZignJScpICE9PSAtMSkge1xuICAgIG9mZnNldC50b3AgPSBwYXJzZUZsb2F0KG9mZnNldC50b3AsIDEwKSAvIDEwMCAqIHNpemUuaGVpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIG9mZnNldDtcbn1cblxudmFyIHBhcnNlT2Zmc2V0ID0gZnVuY3Rpb24gcGFyc2VPZmZzZXQodmFsdWUpIHtcbiAgdmFyIF92YWx1ZSRzcGxpdCA9IHZhbHVlLnNwbGl0KCcgJyk7XG5cbiAgdmFyIF92YWx1ZSRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfdmFsdWUkc3BsaXQsIDIpO1xuXG4gIHZhciB0b3AgPSBfdmFsdWUkc3BsaXQyWzBdO1xuICB2YXIgbGVmdCA9IF92YWx1ZSRzcGxpdDJbMV07XG5cbiAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbn07XG52YXIgcGFyc2VBdHRhY2htZW50ID0gcGFyc2VPZmZzZXQ7XG5cbnZhciBUZXRoZXJDbGFzcyA9IChmdW5jdGlvbiAoX0V2ZW50ZWQpIHtcbiAgX2luaGVyaXRzKFRldGhlckNsYXNzLCBfRXZlbnRlZCk7XG5cbiAgZnVuY3Rpb24gVGV0aGVyQ2xhc3Mob3B0aW9ucykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVGV0aGVyQ2xhc3MpO1xuXG4gICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoVGV0aGVyQ2xhc3MucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5iaW5kKHRoaXMpO1xuXG4gICAgdGV0aGVycy5wdXNoKHRoaXMpO1xuXG4gICAgdGhpcy5oaXN0b3J5ID0gW107XG5cbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucywgZmFsc2UpO1xuXG4gICAgVGV0aGVyQmFzZS5tb2R1bGVzLmZvckVhY2goZnVuY3Rpb24gKG1vZHVsZSkge1xuICAgICAgaWYgKHR5cGVvZiBtb2R1bGUuaW5pdGlhbGl6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmluaXRpYWxpemUuY2FsbChfdGhpcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnBvc2l0aW9uKCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoVGV0aGVyQ2xhc3MsIFt7XG4gICAga2V5OiAnZ2V0Q2xhc3MnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGFzcygpIHtcbiAgICAgIHZhciBrZXkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcbiAgICAgIHZhciBjbGFzc2VzID0gdGhpcy5vcHRpb25zLmNsYXNzZXM7XG5cbiAgICAgIGlmICh0eXBlb2YgY2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgY2xhc3Nlc1trZXldKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3Nlc1trZXldO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCArICctJyArIGtleTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc2V0T3B0aW9ucycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG4gICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIG9mZnNldDogJzAgMCcsXG4gICAgICAgIHRhcmdldE9mZnNldDogJzAgMCcsXG4gICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdhdXRvIGF1dG8nLFxuICAgICAgICBjbGFzc1ByZWZpeDogJ3RldGhlcidcbiAgICAgIH07XG5cbiAgICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZChkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBfb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIHZhciBlbGVtZW50ID0gX29wdGlvbnMuZWxlbWVudDtcbiAgICAgIHZhciB0YXJnZXQgPSBfb3B0aW9ucy50YXJnZXQ7XG4gICAgICB2YXIgdGFyZ2V0TW9kaWZpZXIgPSBfb3B0aW9ucy50YXJnZXRNb2RpZmllcjtcblxuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9IHRhcmdldE1vZGlmaWVyO1xuXG4gICAgICBpZiAodGhpcy50YXJnZXQgPT09ICd2aWV3cG9ydCcpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Zpc2libGUnO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICdzY3JvbGwtaGFuZGxlJztcbiAgICAgIH1cblxuICAgICAgWydlbGVtZW50JywgJ3RhcmdldCddLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBCb3RoIGVsZW1lbnQgYW5kIHRhcmdldCBtdXN0IGJlIGRlZmluZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0uanF1ZXJ5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIF90aGlzMltrZXldID0gX3RoaXMyW2tleV1bMF07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIF90aGlzMltrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIF90aGlzMltrZXldID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihfdGhpczJba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQnKSk7XG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCd0YXJnZXQnKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IFlvdSBtdXN0IHByb3ZpZGUgYW4gYXR0YWNobWVudCcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRhcmdldEF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLnRhcmdldEF0dGFjaG1lbnQpO1xuICAgICAgdGhpcy5hdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy5hdHRhY2htZW50KTtcbiAgICAgIHRoaXMub2Zmc2V0ID0gcGFyc2VPZmZzZXQodGhpcy5vcHRpb25zLm9mZnNldCk7XG4gICAgICB0aGlzLnRhcmdldE9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy50YXJnZXRPZmZzZXQpO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2Nyb2xsUGFyZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzID0gW3RoaXMudGFyZ2V0XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cyA9IGdldFNjcm9sbFBhcmVudHModGhpcy50YXJnZXQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlKHBvcyk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZ2V0VGFyZ2V0Qm91bmRzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VGFyZ2V0Qm91bmRzKCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnRhcmdldE1vZGlmaWVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Zpc2libGUnKSB7XG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICByZXR1cm4geyB0b3A6IHBhZ2VZT2Zmc2V0LCBsZWZ0OiBwYWdlWE9mZnNldCwgaGVpZ2h0OiBpbm5lckhlaWdodCwgd2lkdGg6IGlubmVyV2lkdGggfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG5cbiAgICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICAgIGhlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgICAgdG9wOiBib3VuZHMudG9wLFxuICAgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgLSBib3VuZHMudG9wKSk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChib3VuZHMudG9wICsgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCArIGlubmVySGVpZ2h0KSkpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKGlubmVySGVpZ2h0LCBvdXQuaGVpZ2h0KTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgLT0gMjtcblxuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgLSBib3VuZHMubGVmdCkpO1xuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAoYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgKyBpbm5lcldpZHRoKSkpO1xuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4oaW5uZXJXaWR0aCwgb3V0LndpZHRoKTtcbiAgICAgICAgICAgIG91dC53aWR0aCAtPSAyO1xuXG4gICAgICAgICAgICBpZiAob3V0LnRvcCA8IHBhZ2VZT2Zmc2V0KSB7XG4gICAgICAgICAgICAgIG91dC50b3AgPSBwYWdlWU9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvdXQubGVmdCA8IHBhZ2VYT2Zmc2V0KSB7XG4gICAgICAgICAgICAgIG91dC5sZWZ0ID0gcGFnZVhPZmZzZXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICAgIHZhciBib3VuZHMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuICAgICAgICAgIGlmICh0YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgICAgYm91bmRzID0ge1xuICAgICAgICAgICAgICBsZWZ0OiBwYWdlWE9mZnNldCxcbiAgICAgICAgICAgICAgdG9wOiBwYWdlWU9mZnNldCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiBpbm5lckhlaWdodCxcbiAgICAgICAgICAgICAgd2lkdGg6IGlubmVyV2lkdGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJvdW5kcyA9IGdldEJvdW5kcyh0YXJnZXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGFyZ2V0KTtcblxuICAgICAgICAgIHZhciBoYXNCb3R0b21TY3JvbGwgPSB0YXJnZXQuc2Nyb2xsV2lkdGggPiB0YXJnZXQuY2xpZW50V2lkdGggfHwgW3N0eWxlLm92ZXJmbG93LCBzdHlsZS5vdmVyZmxvd1hdLmluZGV4T2YoJ3Njcm9sbCcpID49IDAgfHwgdGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgICB2YXIgc2Nyb2xsQm90dG9tID0gMDtcbiAgICAgICAgICBpZiAoaGFzQm90dG9tU2Nyb2xsKSB7XG4gICAgICAgICAgICBzY3JvbGxCb3R0b20gPSAxNTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm91bmRzLmhlaWdodCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpIC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJCb3R0b21XaWR0aCkgLSBzY3JvbGxCb3R0b207XG5cbiAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgd2lkdGg6IDE1LFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKiAwLjk3NSAqIChoZWlnaHQgLyB0YXJnZXQuc2Nyb2xsSGVpZ2h0KSxcbiAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJMZWZ0V2lkdGgpIC0gMTVcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdmFyIGZpdEFkaiA9IDA7XG4gICAgICAgICAgaWYgKGhlaWdodCA8IDQwOCAmJiB0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgZml0QWRqID0gLTAuMDAwMTEgKiBNYXRoLnBvdyhoZWlnaHQsIDIpIC0gMC4wMDcyNyAqIGhlaWdodCArIDIyLjU4O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc2Nyb2xsUGVyY2VudGFnZSA9IHRoaXMudGFyZ2V0LnNjcm9sbFRvcCAvICh0YXJnZXQuc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0KTtcbiAgICAgICAgICBvdXQudG9wID0gc2Nyb2xsUGVyY2VudGFnZSAqIChoZWlnaHQgLSBvdXQuaGVpZ2h0IC0gZml0QWRqKSArIGJvdW5kcy50b3AgKyBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKTtcblxuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjbGVhckNhY2hlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcbiAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnY2FjaGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYWNoZShrLCBnZXR0ZXIpIHtcbiAgICAgIC8vIE1vcmUgdGhhbiBvbmUgbW9kdWxlIHdpbGwgb2Z0ZW4gbmVlZCB0aGUgc2FtZSBET00gaW5mbywgc29cbiAgICAgIC8vIHdlIGtlZXAgYSBjYWNoZSB3aGljaCBpcyBjbGVhcmVkIG9uIGVhY2ggcG9zaXRpb24gY2FsbFxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jYWNoZVtrXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVba10gPSBnZXR0ZXIuY2FsbCh0aGlzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlW2tdO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2VuYWJsZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZSgpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIH1cbiAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gX3RoaXMzLnRhcmdldC5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgcGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIF90aGlzMy5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAocG9zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkaXNhYmxlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICByZW1vdmVDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2Nyb2xsUGFyZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICAgIHBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdGhpczQucG9zaXRpb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkZXN0cm95JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICB0aGlzLmRpc2FibGUoKTtcblxuICAgICAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIsIGkpIHtcbiAgICAgICAgaWYgKHRldGhlciA9PT0gX3RoaXM1KSB7XG4gICAgICAgICAgdGV0aGVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgYW55IGVsZW1lbnRzIHdlIHdlcmUgdXNpbmcgZm9yIGNvbnZlbmllbmNlIGZyb20gdGhlIERPTVxuICAgICAgaWYgKHRldGhlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlbW92ZVV0aWxFbGVtZW50cygpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3VwZGF0ZUF0dGFjaENsYXNzZXMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVBdHRhY2hDbGFzc2VzKGVsZW1lbnRBdHRhY2gsIHRhcmdldEF0dGFjaCkge1xuICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cbiAgICAgIGVsZW1lbnRBdHRhY2ggPSBlbGVtZW50QXR0YWNoIHx8IHRoaXMuYXR0YWNobWVudDtcbiAgICAgIHRhcmdldEF0dGFjaCA9IHRhcmdldEF0dGFjaCB8fCB0aGlzLnRhcmdldEF0dGFjaG1lbnQ7XG4gICAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ2JvdHRvbScsICdyaWdodCcsICdtaWRkbGUnLCAnY2VudGVyJ107XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgLy8gdXBkYXRlQXR0YWNoQ2xhc3NlcyBjYW4gYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIGluIGEgcG9zaXRpb24gY2FsbCwgc29cbiAgICAgICAgLy8gd2UgbmVlZCB0byBjbGVhbiB1cCBhZnRlciBvdXJzZWx2ZXMgc3VjaCB0aGF0IHdoZW4gdGhlIGxhc3QgZGVmZXIgZ2V0c1xuICAgICAgICAvLyByYW4gaXQgZG9lc24ndCBhZGQgYW55IGV4dHJhIGNsYXNzZXMgZnJvbSBwcmV2aW91cyBjYWxscy5cbiAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5zcGxpY2UoMCwgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHZhciBhZGQgPSB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzO1xuXG4gICAgICBpZiAoZWxlbWVudEF0dGFjaC50b3ApIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC50b3ApO1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnRBdHRhY2gubGVmdCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLmxlZnQpO1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldEF0dGFjaC50b3ApIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gudG9wKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRBdHRhY2gubGVmdCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC5sZWZ0KTtcbiAgICAgIH1cblxuICAgICAgdmFyIGFsbCA9IFtdO1xuICAgICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICBhbGwucHVzaChfdGhpczYuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuICAgICAgICBhbGwucHVzaChfdGhpczYuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgICB9KTtcblxuICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoISh0eXBlb2YgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNi5lbGVtZW50LCBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG4gICAgICAgIGlmICghKF90aGlzNi5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM2LnRhcmdldCwgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3Bvc2l0aW9uJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gICAgICB2YXIgX3RoaXM3ID0gdGhpcztcblxuICAgICAgdmFyIGZsdXNoQ2hhbmdlcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIC8vIGZsdXNoQ2hhbmdlcyBjb21taXRzIHRoZSBjaGFuZ2VzIGltbWVkaWF0ZWx5LCBsZWF2ZSB0cnVlIHVubGVzcyB5b3UgYXJlIHBvc2l0aW9uaW5nIG11bHRpcGxlXG4gICAgICAvLyB0ZXRoZXJzIChpbiB3aGljaCBjYXNlIGNhbGwgVGV0aGVyLlV0aWxzLmZsdXNoIHlvdXJzZWxmIHdoZW4geW91J3JlIGRvbmUpXG5cbiAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cbiAgICAgIC8vIFR1cm4gJ2F1dG8nIGF0dGFjaG1lbnRzIGludG8gdGhlIGFwcHJvcHJpYXRlIGNvcm5lciBvciBlZGdlXG4gICAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IGF1dG9Ub0ZpeGVkQXR0YWNobWVudCh0aGlzLnRhcmdldEF0dGFjaG1lbnQsIHRoaXMuYXR0YWNobWVudCk7XG5cbiAgICAgIHRoaXMudXBkYXRlQXR0YWNoQ2xhc3Nlcyh0aGlzLmF0dGFjaG1lbnQsIHRhcmdldEF0dGFjaG1lbnQpO1xuXG4gICAgICB2YXIgZWxlbWVudFBvcyA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzNy5lbGVtZW50KTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgd2lkdGggPSBlbGVtZW50UG9zLndpZHRoO1xuICAgICAgdmFyIGhlaWdodCA9IGVsZW1lbnRQb3MuaGVpZ2h0O1xuXG4gICAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuICAgICAgICAvLyBXZSBjYWNoZSB0aGUgaGVpZ2h0IGFuZCB3aWR0aCB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHBvc2l0aW9uIGVsZW1lbnRzIHRoYXQgYXJlXG4gICAgICAgIC8vIGdldHRpbmcgaGlkZGVuLlxuICAgICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcbiAgICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGFzdFNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczcuZ2V0VGFyZ2V0Qm91bmRzKCk7XG4gICAgICB9KTtcbiAgICAgIHZhciB0YXJnZXRTaXplID0gdGFyZ2V0UG9zO1xuXG4gICAgICAvLyBHZXQgYW4gYWN0dWFsIHB4IG9mZnNldCBmcm9tIHRoZSBhdHRhY2htZW50XG4gICAgICB2YXIgb2Zmc2V0ID0gb2Zmc2V0VG9QeChhdHRhY2htZW50VG9PZmZzZXQodGhpcy5hdHRhY2htZW50KSwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgICAgdmFyIHRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRhcmdldEF0dGFjaG1lbnQpLCB0YXJnZXRTaXplKTtcblxuICAgICAgdmFyIG1hbnVhbE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy5vZmZzZXQsIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcbiAgICAgIHZhciBtYW51YWxUYXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KHRoaXMudGFyZ2V0T2Zmc2V0LCB0YXJnZXRTaXplKTtcblxuICAgICAgLy8gQWRkIHRoZSBtYW51YWxseSBwcm92aWRlZCBvZmZzZXRcbiAgICAgIG9mZnNldCA9IGFkZE9mZnNldChvZmZzZXQsIG1hbnVhbE9mZnNldCk7XG4gICAgICB0YXJnZXRPZmZzZXQgPSBhZGRPZmZzZXQodGFyZ2V0T2Zmc2V0LCBtYW51YWxUYXJnZXRPZmZzZXQpO1xuXG4gICAgICAvLyBJdCdzIG5vdyBvdXIgZ29hbCB0byBtYWtlIChlbGVtZW50IHBvc2l0aW9uICsgb2Zmc2V0KSA9PSAodGFyZ2V0IHBvc2l0aW9uICsgdGFyZ2V0IG9mZnNldClcbiAgICAgIHZhciBsZWZ0ID0gdGFyZ2V0UG9zLmxlZnQgKyB0YXJnZXRPZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0O1xuICAgICAgdmFyIHRvcCA9IHRhcmdldFBvcy50b3AgKyB0YXJnZXRPZmZzZXQudG9wIC0gb2Zmc2V0LnRvcDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUZXRoZXJCYXNlLm1vZHVsZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIF9tb2R1bGUyID0gVGV0aGVyQmFzZS5tb2R1bGVzW2ldO1xuICAgICAgICB2YXIgcmV0ID0gX21vZHVsZTIucG9zaXRpb24uY2FsbCh0aGlzLCB7XG4gICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiB0YXJnZXRBdHRhY2htZW50LFxuICAgICAgICAgIHRhcmdldFBvczogdGFyZ2V0UG9zLFxuICAgICAgICAgIGVsZW1lbnRQb3M6IGVsZW1lbnRQb3MsXG4gICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgICAgdGFyZ2V0T2Zmc2V0OiB0YXJnZXRPZmZzZXQsXG4gICAgICAgICAgbWFudWFsT2Zmc2V0OiBtYW51YWxPZmZzZXQsXG4gICAgICAgICAgbWFudWFsVGFyZ2V0T2Zmc2V0OiBtYW51YWxUYXJnZXRPZmZzZXQsXG4gICAgICAgICAgc2Nyb2xsYmFyU2l6ZTogc2Nyb2xsYmFyU2l6ZSxcbiAgICAgICAgICBhdHRhY2htZW50OiB0aGlzLmF0dGFjaG1lbnRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJldCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHJldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b3AgPSByZXQudG9wO1xuICAgICAgICAgIGxlZnQgPSByZXQubGVmdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXZSBkZXNjcmliZSB0aGUgcG9zaXRpb24gdGhyZWUgZGlmZmVyZW50IHdheXMgdG8gZ2l2ZSB0aGUgb3B0aW1pemVyXG4gICAgICAvLyBhIGNoYW5jZSB0byBkZWNpZGUgdGhlIGJlc3QgcG9zc2libGUgd2F5IHRvIHBvc2l0aW9uIHRoZSBlbGVtZW50XG4gICAgICAvLyB3aXRoIHRoZSBmZXdlc3QgcmVwYWludHMuXG4gICAgICB2YXIgbmV4dCA9IHtcbiAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgcGFnZSAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHRoZSBib2R5KVxuICAgICAgICBwYWdlOiB7XG4gICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgbGVmdDogbGVmdFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgICAgdmlld3BvcnQ6IHtcbiAgICAgICAgICB0b3A6IHRvcCAtIHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgIGJvdHRvbTogcGFnZVlPZmZzZXQgLSB0b3AgLSBoZWlnaHQgKyBpbm5lckhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBsZWZ0IC0gcGFnZVhPZmZzZXQsXG4gICAgICAgICAgcmlnaHQ6IHBhZ2VYT2Zmc2V0IC0gbGVmdCAtIHdpZHRoICsgaW5uZXJXaWR0aFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZG9jID0gdGhpcy50YXJnZXQub3duZXJEb2N1bWVudDtcbiAgICAgIHZhciB3aW4gPSBkb2MuZGVmYXVsdFZpZXc7XG5cbiAgICAgIHZhciBzY3JvbGxiYXJTaXplID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKHdpbi5pbm5lckhlaWdodCA+IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuICAgICAgICBuZXh0LnZpZXdwb3J0LmJvdHRvbSAtPSBzY3JvbGxiYXJTaXplLmhlaWdodDtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbi5pbm5lcldpZHRoID4gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcbiAgICAgICAgbmV4dC52aWV3cG9ydC5yaWdodCAtPSBzY3JvbGxiYXJTaXplLndpZHRoO1xuICAgICAgfVxuXG4gICAgICBpZiAoWycnLCAnc3RhdGljJ10uaW5kZXhPZihkb2MuYm9keS5zdHlsZS5wb3NpdGlvbikgPT09IC0xIHx8IFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jLmJvZHkucGFyZW50RWxlbWVudC5zdHlsZS5wb3NpdGlvbikgPT09IC0xKSB7XG4gICAgICAgIC8vIEFic29sdXRlIHBvc2l0aW9uaW5nIGluIHRoZSBib2R5IHdpbGwgYmUgcmVsYXRpdmUgdG8gdGhlIHBhZ2UsIG5vdCB0aGUgJ2luaXRpYWwgY29udGFpbmluZyBibG9jaydcbiAgICAgICAgbmV4dC5wYWdlLmJvdHRvbSA9IGRvYy5ib2R5LnNjcm9sbEhlaWdodCAtIHRvcCAtIGhlaWdodDtcbiAgICAgICAgbmV4dC5wYWdlLnJpZ2h0ID0gZG9jLmJvZHkuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zLm1vdmVFbGVtZW50ICE9PSBmYWxzZSAmJiAhKHR5cGVvZiB0aGlzLnRhcmdldE1vZGlmaWVyICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gX3RoaXM3LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczcudGFyZ2V0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UG9zaXRpb24gPSBfdGhpczcuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUob2Zmc2V0UGFyZW50KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50U2l6ZSA9IG9mZnNldFBvc2l0aW9uO1xuXG4gICAgICAgICAgdmFyIG9mZnNldEJvcmRlciA9IHt9O1xuICAgICAgICAgIFsnVG9wJywgJ0xlZnQnLCAnQm90dG9tJywgJ1JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgb2Zmc2V0Qm9yZGVyW3NpZGUudG9Mb3dlckNhc2UoKV0gPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudFN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG9mZnNldFBvc2l0aW9uLnJpZ2h0ID0gZG9jLmJvZHkuc2Nyb2xsV2lkdGggLSBvZmZzZXRQb3NpdGlvbi5sZWZ0IC0gb2Zmc2V0UGFyZW50U2l6ZS53aWR0aCArIG9mZnNldEJvcmRlci5yaWdodDtcbiAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5ib3R0b20gPSBkb2MuYm9keS5zY3JvbGxIZWlnaHQgLSBvZmZzZXRQb3NpdGlvbi50b3AgLSBvZmZzZXRQYXJlbnRTaXplLmhlaWdodCArIG9mZnNldEJvcmRlci5ib3R0b207XG5cbiAgICAgICAgICBpZiAobmV4dC5wYWdlLnRvcCA+PSBvZmZzZXRQb3NpdGlvbi50b3AgKyBvZmZzZXRCb3JkZXIudG9wICYmIG5leHQucGFnZS5ib3R0b20gPj0gb2Zmc2V0UG9zaXRpb24uYm90dG9tKSB7XG4gICAgICAgICAgICBpZiAobmV4dC5wYWdlLmxlZnQgPj0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIG9mZnNldEJvcmRlci5sZWZ0ICYmIG5leHQucGFnZS5yaWdodCA+PSBvZmZzZXRQb3NpdGlvbi5yaWdodCkge1xuICAgICAgICAgICAgICAvLyBXZSdyZSB3aXRoaW4gdGhlIHZpc2libGUgcGFydCBvZiB0aGUgdGFyZ2V0J3Mgc2Nyb2xsIHBhcmVudFxuICAgICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gb2Zmc2V0UGFyZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgdmFyIHNjcm9sbExlZnQgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsTGVmdDtcblxuICAgICAgICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG4gICAgICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIG1vdmVkIHRvIGJlIGEgY2hpbGQgb2YgdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQpLlxuICAgICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG5leHQucGFnZS50b3AgLSBvZmZzZXRQb3NpdGlvbi50b3AgKyBzY3JvbGxUb3AgLSBvZmZzZXRCb3JkZXIudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IG5leHQucGFnZS5sZWZ0IC0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIHNjcm9sbExlZnQgLSBvZmZzZXRCb3JkZXIubGVmdFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgY291bGQgYWxzbyB0cmF2ZWwgdXAgdGhlIERPTSBhbmQgdHJ5IGVhY2ggY29udGFpbmluZyBjb250ZXh0LCByYXRoZXIgdGhhbiBvbmx5XG4gICAgICAvLyBsb29raW5nIGF0IHRoZSBib2R5LCBidXQgd2UncmUgZ29ubmEgZ2V0IGRpbWluaXNoaW5nIHJldHVybnMuXG5cbiAgICAgIHRoaXMubW92ZShuZXh0KTtcblxuICAgICAgdGhpcy5oaXN0b3J5LnVuc2hpZnQobmV4dCk7XG5cbiAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gMykge1xuICAgICAgICB0aGlzLmhpc3RvcnkucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmbHVzaENoYW5nZXMpIHtcbiAgICAgICAgZmx1c2goKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gVEhFIElTU1VFXG4gIH0sIHtcbiAgICBrZXk6ICdtb3ZlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZShwb3MpIHtcbiAgICAgIHZhciBfdGhpczggPSB0aGlzO1xuXG4gICAgICBpZiAoISh0eXBlb2YgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzYW1lID0ge307XG5cbiAgICAgIGZvciAodmFyIHR5cGUgaW4gcG9zKSB7XG4gICAgICAgIHNhbWVbdHlwZV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcG9zW3R5cGVdKSB7XG4gICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlzdG9yeS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5oaXN0b3J5W2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb2ludFt0eXBlXSAhPT0gJ3VuZGVmaW5lZCcgJiYgIXdpdGhpbihwb2ludFt0eXBlXVtrZXldLCBwb3NbdHlwZV1ba2V5XSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICBzYW1lW3R5cGVdW2tleV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY3NzID0geyB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCBib3R0b206ICcnIH07XG5cbiAgICAgIHZhciB0cmFuc2NyaWJlID0gZnVuY3Rpb24gdHJhbnNjcmliZShfc2FtZSwgX3Bvcykge1xuICAgICAgICB2YXIgaGFzT3B0aW1pemF0aW9ucyA9IHR5cGVvZiBfdGhpczgub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGdwdSA9IGhhc09wdGltaXphdGlvbnMgPyBfdGhpczgub3B0aW9ucy5vcHRpbWl6YXRpb25zLmdwdSA6IG51bGw7XG4gICAgICAgIGlmIChncHUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIHlQb3MgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIHhQb3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuICAgICAgICAgICAgY3NzLnRvcCA9IDA7XG4gICAgICAgICAgICB5UG9zID0gX3Bvcy50b3A7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5ib3R0b20gPSAwO1xuICAgICAgICAgICAgeVBvcyA9IC1fcG9zLmJvdHRvbTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX3NhbWUubGVmdCkge1xuICAgICAgICAgICAgY3NzLmxlZnQgPSAwO1xuICAgICAgICAgICAgeFBvcyA9IF9wb3MubGVmdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLnJpZ2h0ID0gMDtcbiAgICAgICAgICAgIHhQb3MgPSAtX3Bvcy5yaWdodDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICAgICAgICAgIC8vIEh1YlNwb3QvdGV0aGVyIzIwN1xuICAgICAgICAgICAgdmFyIHJldGluYSA9IHdpbmRvdy5tYXRjaE1lZGlhKCdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxLjNkcHB4KScpLm1hdGNoZXMgfHwgd2luZG93Lm1hdGNoTWVkaWEoJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAxLjMpJykubWF0Y2hlcztcbiAgICAgICAgICAgIGlmICghcmV0aW5hKSB7XG4gICAgICAgICAgICAgIHhQb3MgPSBNYXRoLnJvdW5kKHhQb3MpO1xuICAgICAgICAgICAgICB5UG9zID0gTWF0aC5yb3VuZCh5UG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSA9ICd0cmFuc2xhdGVYKCcgKyB4UG9zICsgJ3B4KSB0cmFuc2xhdGVZKCcgKyB5UG9zICsgJ3B4KSc7XG5cbiAgICAgICAgICBpZiAodHJhbnNmb3JtS2V5ICE9PSAnbXNUcmFuc2Zvcm0nKSB7XG4gICAgICAgICAgICAvLyBUaGUgWiB0cmFuc2Zvcm0gd2lsbCBrZWVwIHRoaXMgaW4gdGhlIEdQVSAoZmFzdGVyLCBhbmQgcHJldmVudHMgYXJ0aWZhY3RzKSxcbiAgICAgICAgICAgIC8vIGJ1dCBJRTkgZG9lc24ndCBzdXBwb3J0IDNkIHRyYW5zZm9ybXMgYW5kIHdpbGwgY2hva2UuXG4gICAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSArPSBcIiB0cmFuc2xhdGVaKDApXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcbiAgICAgICAgICAgIGNzcy50b3AgPSBfcG9zLnRvcCArICdweCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5ib3R0b20gPSBfcG9zLmJvdHRvbSArICdweCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcbiAgICAgICAgICAgIGNzcy5sZWZ0ID0gX3Bvcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLnJpZ2h0ID0gX3Bvcy5yaWdodCArICdweCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgbW92ZWQgPSBmYWxzZTtcbiAgICAgIGlmICgoc2FtZS5wYWdlLnRvcCB8fCBzYW1lLnBhZ2UuYm90dG9tKSAmJiAoc2FtZS5wYWdlLmxlZnQgfHwgc2FtZS5wYWdlLnJpZ2h0KSkge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICB0cmFuc2NyaWJlKHNhbWUucGFnZSwgcG9zLnBhZ2UpO1xuICAgICAgfSBlbHNlIGlmICgoc2FtZS52aWV3cG9ydC50b3AgfHwgc2FtZS52aWV3cG9ydC5ib3R0b20pICYmIChzYW1lLnZpZXdwb3J0LmxlZnQgfHwgc2FtZS52aWV3cG9ydC5yaWdodCkpIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgdHJhbnNjcmliZShzYW1lLnZpZXdwb3J0LCBwb3Mudmlld3BvcnQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2FtZS5vZmZzZXQgIT09ICd1bmRlZmluZWQnICYmIHNhbWUub2Zmc2V0LnRvcCAmJiBzYW1lLm9mZnNldC5sZWZ0KSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gX3RoaXM4LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczgudGFyZ2V0KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChnZXRPZmZzZXRQYXJlbnQoX3RoaXM4LmVsZW1lbnQpICE9PSBvZmZzZXRQYXJlbnQpIHtcbiAgICAgICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXM4LmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChfdGhpczguZWxlbWVudCk7XG4gICAgICAgICAgICAgIG9mZnNldFBhcmVudC5hcHBlbmRDaGlsZChfdGhpczguZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cmFuc2NyaWJlKHNhbWUub2Zmc2V0LCBwb3Mub2Zmc2V0KTtcbiAgICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgICAgIH0pKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICB0cmFuc2NyaWJlKHsgdG9wOiB0cnVlLCBsZWZ0OiB0cnVlIH0sIHBvcy5wYWdlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFtb3ZlZCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJvZHlFbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLmJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudElzQm9keSA9IHRydWU7XG4gICAgICAgICAgdmFyIGN1cnJlbnROb2RlID0gdGhpcy5lbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSAxICYmIGN1cnJlbnROb2RlLnRhZ05hbWUgIT09ICdCT0RZJykge1xuICAgICAgICAgICAgaWYgKGdldENvbXB1dGVkU3R5bGUoY3VycmVudE5vZGUpLnBvc2l0aW9uICE9PSAnc3RhdGljJykge1xuICAgICAgICAgICAgICBvZmZzZXRQYXJlbnRJc0JvZHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIW9mZnNldFBhcmVudElzQm9keSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vd25lckRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQW55IGNzcyBjaGFuZ2Ugd2lsbCB0cmlnZ2VyIGEgcmVwYWludCwgc28gbGV0J3MgYXZvaWQgb25lIGlmIG5vdGhpbmcgY2hhbmdlZFxuICAgICAgdmFyIHdyaXRlQ1NTID0ge307XG4gICAgICB2YXIgd3JpdGUgPSBmYWxzZTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBjc3MpIHtcbiAgICAgICAgdmFyIHZhbCA9IGNzc1trZXldO1xuICAgICAgICB2YXIgZWxWYWwgPSB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XTtcblxuICAgICAgICBpZiAoZWxWYWwgIT09IHZhbCkge1xuICAgICAgICAgIHdyaXRlID0gdHJ1ZTtcbiAgICAgICAgICB3cml0ZUNTU1trZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh3cml0ZSkge1xuICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZXh0ZW5kKF90aGlzOC5lbGVtZW50LnN0eWxlLCB3cml0ZUNTUyk7XG4gICAgICAgICAgX3RoaXM4LnRyaWdnZXIoJ3JlcG9zaXRpb25lZCcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gVGV0aGVyQ2xhc3M7XG59KShFdmVudGVkKTtcblxuVGV0aGVyQ2xhc3MubW9kdWxlcyA9IFtdO1xuXG5UZXRoZXJCYXNlLnBvc2l0aW9uID0gcG9zaXRpb247XG5cbnZhciBUZXRoZXIgPSBleHRlbmQoVGV0aGVyQ2xhc3MsIFRldGhlckJhc2UpO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG52YXIgQk9VTkRTX0ZPUk1BVCA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cbmZ1bmN0aW9uIGdldEJvdW5kaW5nUmVjdCh0ZXRoZXIsIHRvKSB7XG4gIGlmICh0byA9PT0gJ3Njcm9sbFBhcmVudCcpIHtcbiAgICB0byA9IHRldGhlci5zY3JvbGxQYXJlbnRzWzBdO1xuICB9IGVsc2UgaWYgKHRvID09PSAnd2luZG93Jykge1xuICAgIHRvID0gW3BhZ2VYT2Zmc2V0LCBwYWdlWU9mZnNldCwgaW5uZXJXaWR0aCArIHBhZ2VYT2Zmc2V0LCBpbm5lckhlaWdodCArIHBhZ2VZT2Zmc2V0XTtcbiAgfVxuXG4gIGlmICh0byA9PT0gZG9jdW1lbnQpIHtcbiAgICB0byA9IHRvLmRvY3VtZW50RWxlbWVudDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdG8ubm9kZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBub2RlID0gdG87XG4gICAgICB2YXIgc2l6ZSA9IGdldEJvdW5kcyh0byk7XG4gICAgICB2YXIgcG9zID0gc2l6ZTtcbiAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodG8pO1xuXG4gICAgICB0byA9IFtwb3MubGVmdCwgcG9zLnRvcCwgc2l6ZS53aWR0aCArIHBvcy5sZWZ0LCBzaXplLmhlaWdodCArIHBvcy50b3BdO1xuXG4gICAgICAvLyBBY2NvdW50IGFueSBwYXJlbnQgRnJhbWVzIHNjcm9sbCBvZmZzZXRcbiAgICAgIGlmIChub2RlLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIHZhciB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHRvWzBdICs9IHdpbi5wYWdlWE9mZnNldDtcbiAgICAgICAgdG9bMV0gKz0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgICAgICB0b1syXSArPSB3aW4ucGFnZVhPZmZzZXQ7XG4gICAgICAgIHRvWzNdICs9IHdpbi5wYWdlWU9mZnNldDtcbiAgICAgIH1cblxuICAgICAgQk9VTkRTX0ZPUk1BVC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlLCBpKSB7XG4gICAgICAgIHNpZGUgPSBzaWRlWzBdLnRvVXBwZXJDYXNlKCkgKyBzaWRlLnN1YnN0cigxKTtcbiAgICAgICAgaWYgKHNpZGUgPT09ICdUb3AnIHx8IHNpZGUgPT09ICdMZWZ0Jykge1xuICAgICAgICAgIHRvW2ldICs9IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvW2ldIC09IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KSgpO1xuICB9XG5cbiAgcmV0dXJuIHRvO1xufVxuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcbiAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IF9yZWYudGFyZ2V0QXR0YWNobWVudDtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gX2NhY2hlLndpZHRoO1xuXG4gICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG4gICAgICAvLyBIYW5kbGUgdGhlIGl0ZW0gZ2V0dGluZyBoaWRkZW4gYXMgYSByZXN1bHQgb2Ygb3VyIHBvc2l0aW9uaW5nIHdpdGhvdXQgZ2xpdGNoaW5nXG4gICAgICAvLyB0aGUgY2xhc3NlcyBpbiBhbmQgb3V0XG4gICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcbiAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldFNpemUgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF90aGlzLmdldFRhcmdldEJvdW5kcygpO1xuICAgIH0pO1xuXG4gICAgdmFyIHRhcmdldEhlaWdodCA9IHRhcmdldFNpemUuaGVpZ2h0O1xuICAgIHZhciB0YXJnZXRXaWR0aCA9IHRhcmdldFNpemUud2lkdGg7XG5cbiAgICB2YXIgYWxsQ2xhc3NlcyA9IFt0aGlzLmdldENsYXNzKCdwaW5uZWQnKSwgdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpXTtcblxuICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG4gICAgICB2YXIgb3V0T2ZCb3VuZHNDbGFzcyA9IGNvbnN0cmFpbnQub3V0T2ZCb3VuZHNDbGFzcztcbiAgICAgIHZhciBwaW5uZWRDbGFzcyA9IGNvbnN0cmFpbnQucGlubmVkQ2xhc3M7XG5cbiAgICAgIGlmIChvdXRPZkJvdW5kc0NsYXNzKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChvdXRPZkJvdW5kc0NsYXNzKTtcbiAgICAgIH1cbiAgICAgIGlmIChwaW5uZWRDbGFzcykge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYWxsQ2xhc3Nlcy5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2goY2xzICsgJy0nICsgc2lkZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHZhciBhZGRDbGFzc2VzID0gW107XG5cbiAgICB2YXIgdEF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRhcmdldEF0dGFjaG1lbnQpO1xuICAgIHZhciBlQXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGhpcy5hdHRhY2htZW50KTtcblxuICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG4gICAgICB2YXIgdG8gPSBjb25zdHJhaW50LnRvO1xuICAgICAgdmFyIGF0dGFjaG1lbnQgPSBjb25zdHJhaW50LmF0dGFjaG1lbnQ7XG4gICAgICB2YXIgcGluID0gY29uc3RyYWludC5waW47XG5cbiAgICAgIGlmICh0eXBlb2YgYXR0YWNobWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgYXR0YWNobWVudCA9ICcnO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2hhbmdlQXR0YWNoWCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICBjaGFuZ2VBdHRhY2hZID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGF0dGFjaG1lbnQuaW5kZXhPZignICcpID49IDApIHtcbiAgICAgICAgdmFyIF9hdHRhY2htZW50JHNwbGl0ID0gYXR0YWNobWVudC5zcGxpdCgnICcpO1xuXG4gICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfYXR0YWNobWVudCRzcGxpdCwgMik7XG5cbiAgICAgICAgY2hhbmdlQXR0YWNoWSA9IF9hdHRhY2htZW50JHNwbGl0MlswXTtcbiAgICAgICAgY2hhbmdlQXR0YWNoWCA9IF9hdHRhY2htZW50JHNwbGl0MlsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYW5nZUF0dGFjaFggPSBjaGFuZ2VBdHRhY2hZID0gYXR0YWNobWVudDtcbiAgICAgIH1cblxuICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChfdGhpcywgdG8pO1xuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgdEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndG9nZXRoZXInKSB7XG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScgJiYgdG9wIDwgYm91bmRzWzFdKSB7XG4gICAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcgJiYgdG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRvcCAtIChoZWlnaHQgLSB0YXJnZXRIZWlnaHQpID49IGJvdW5kc1sxXSkge1xuICAgICAgICAgICAgdG9wIC09IGhlaWdodCAtIHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnICYmIHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuICAgICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nICYmIHRvcCA8IGJvdW5kc1sxXSAmJiB0b3AgKyAoaGVpZ2h0ICogMiAtIHRhcmdldEhlaWdodCkgPD0gYm91bmRzWzNdKSB7XG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICdtaWRkbGUnKSB7XG4gICAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0b2dldGhlcicpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcblxuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcblxuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGggLyAyO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGggLyAyO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgcGluID09PSAnc3RyaW5nJykge1xuICAgICAgICBwaW4gPSBwaW4uc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICByZXR1cm4gcC50cmltKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChwaW4gPT09IHRydWUpIHtcbiAgICAgICAgcGluID0gWyd0b3AnLCAnbGVmdCcsICdyaWdodCcsICdib3R0b20nXTtcbiAgICAgIH1cblxuICAgICAgcGluID0gcGluIHx8IFtdO1xuXG4gICAgICB2YXIgcGlubmVkID0gW107XG4gICAgICB2YXIgb29iID0gW107XG5cbiAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCd0b3AnKSA+PSAwKSB7XG4gICAgICAgICAgdG9wID0gYm91bmRzWzFdO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCd0b3AnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgndG9wJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcbiAgICAgICAgICB0b3AgPSBib3VuZHNbM10gLSBoZWlnaHQ7XG4gICAgICAgICAgcGlubmVkLnB1c2goJ2JvdHRvbScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdib3R0b20nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ2xlZnQnKSA+PSAwKSB7XG4gICAgICAgICAgbGVmdCA9IGJvdW5kc1swXTtcbiAgICAgICAgICBwaW5uZWQucHVzaCgnbGVmdCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdsZWZ0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ3JpZ2h0JykgPj0gMCkge1xuICAgICAgICAgIGxlZnQgPSBib3VuZHNbMl0gLSB3aWR0aDtcbiAgICAgICAgICBwaW5uZWQucHVzaCgncmlnaHQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgncmlnaHQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocGlubmVkLmxlbmd0aCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBwaW5uZWRDbGFzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG4gICAgICAgICAgcGlubmVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyArICctJyArIHNpZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAob29iLmxlbmd0aCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBvb2JDbGFzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLmdldENsYXNzKCdvdXQtb2YtYm91bmRzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzKTtcbiAgICAgICAgICBvb2IuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzICsgJy0nICsgc2lkZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwaW5uZWQuaW5kZXhPZignbGVmdCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ3JpZ2h0JykgPj0gMCkge1xuICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gdEF0dGFjaG1lbnQubGVmdCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCd0b3AnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG4gICAgICAgIGVBdHRhY2htZW50LnRvcCA9IHRBdHRhY2htZW50LnRvcCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodEF0dGFjaG1lbnQudG9wICE9PSB0YXJnZXRBdHRhY2htZW50LnRvcCB8fCB0QXR0YWNobWVudC5sZWZ0ICE9PSB0YXJnZXRBdHRhY2htZW50LmxlZnQgfHwgZUF0dGFjaG1lbnQudG9wICE9PSBfdGhpcy5hdHRhY2htZW50LnRvcCB8fCBlQXR0YWNobWVudC5sZWZ0ICE9PSBfdGhpcy5hdHRhY2htZW50LmxlZnQpIHtcbiAgICAgICAgX3RoaXMudXBkYXRlQXR0YWNoQ2xhc3NlcyhlQXR0YWNobWVudCwgdEF0dGFjaG1lbnQpO1xuICAgICAgICBfdGhpcy50cmlnZ2VyKCd1cGRhdGUnLCB7XG4gICAgICAgICAgYXR0YWNobWVudDogZUF0dGFjaG1lbnQsXG4gICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdEF0dGFjaG1lbnRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgfVxufSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cbiAgICB2YXIgdGFyZ2V0UG9zID0gdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcblxuICAgIHZhciBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG4gICAgdmFyIHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuXG4gICAgdmFyIGFidXR0ZWQgPSBbXTtcbiAgICBpZiAodG9wIDw9IHRhcmdldFBvcy5ib3R0b20gJiYgYm90dG9tID49IHRhcmdldFBvcy50b3ApIHtcbiAgICAgIFsnbGVmdCcsICdyaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgdmFyIHRhcmdldFBvc1NpZGUgPSB0YXJnZXRQb3Nbc2lkZV07XG4gICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSBsZWZ0IHx8IHRhcmdldFBvc1NpZGUgPT09IHJpZ2h0KSB7XG4gICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobGVmdCA8PSB0YXJnZXRQb3MucmlnaHQgJiYgcmlnaHQgPj0gdGFyZ2V0UG9zLmxlZnQpIHtcbiAgICAgIFsndG9wJywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgdmFyIHRhcmdldFBvc1NpZGUgPSB0YXJnZXRQb3Nbc2lkZV07XG4gICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSB0b3AgfHwgdGFyZ2V0UG9zU2lkZSA9PT0gYm90dG9tKSB7XG4gICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgYWxsQ2xhc3NlcyA9IFtdO1xuICAgIHZhciBhZGRDbGFzc2VzID0gW107XG5cbiAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuICAgIGFsbENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgIGFsbENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoYWJ1dHRlZC5sZW5ndGgpIHtcbiAgICAgIGFkZENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuICAgIH1cblxuICAgIGFidXR0ZWQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgYWRkQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICB9KTtcblxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLnNoaWZ0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0O1xuICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnNoaWZ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdC5jYWxsKHRoaXMsIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfSk7XG4gICAgfVxuXG4gICAgdmFyIHNoaWZ0VG9wID0gdW5kZWZpbmVkLFxuICAgICAgICBzaGlmdExlZnQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBzaGlmdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNoaWZ0ID0gc2hpZnQuc3BsaXQoJyAnKTtcbiAgICAgIHNoaWZ0WzFdID0gc2hpZnRbMV0gfHwgc2hpZnRbMF07XG5cbiAgICAgIHZhciBfc2hpZnQgPSBzaGlmdDtcblxuICAgICAgdmFyIF9zaGlmdDIgPSBfc2xpY2VkVG9BcnJheShfc2hpZnQsIDIpO1xuXG4gICAgICBzaGlmdFRvcCA9IF9zaGlmdDJbMF07XG4gICAgICBzaGlmdExlZnQgPSBfc2hpZnQyWzFdO1xuXG4gICAgICBzaGlmdFRvcCA9IHBhcnNlRmxvYXQoc2hpZnRUb3AsIDEwKTtcbiAgICAgIHNoaWZ0TGVmdCA9IHBhcnNlRmxvYXQoc2hpZnRMZWZ0LCAxMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNoaWZ0VG9wID0gc2hpZnQudG9wO1xuICAgICAgc2hpZnRMZWZ0ID0gc2hpZnQubGVmdDtcbiAgICB9XG5cbiAgICB0b3AgKz0gc2hpZnRUb3A7XG4gICAgbGVmdCArPSBzaGlmdExlZnQ7XG5cbiAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICB9XG59KTtcbnJldHVybiBUZXRoZXI7XG5cbn0pKTtcbiIsImltcG9ydCB7IFBhZGRpbmcgfSBmcm9tICcuLi9nZW9tL1BhZGRpbmcnO1xyXG5pbXBvcnQgeyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIsIEdyaWRFeHRlbnNpb24sIEdyaWRLZXJuZWwgfSBmcm9tICcuLi8nO1xyXG5pbXBvcnQgeyBDbGlja1pvbmVFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2V4dHJhL0NsaWNrWm9uZUV4dGVuc2lvbic7XHJcbmltcG9ydCB7IEVkaXRpbmdFeHRlbnNpb24sIEdyaWRFZGl0RXZlbnQgfSBmcm9tICcuLi9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IFNlbGVjdG9yRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9jb21tb24vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBTY3JvbGxlckV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQ2xpcGJvYXJkRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9jb21tb24vQ2xpcGJvYXJkRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgSGlzdG9yeUV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQ29tcHV0ZUV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQmFzZVN0eWxlLCBTdHlsZSB9IGZyb20gJy4uL21vZGVsL3N0eWxlZC9TdHlsZSc7XHJcbmltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uL21pc2MvQmFzZTI2JztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRDZWxsIH0gZnJvbSAnLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENlbGwnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuXHJcblxyXG5jbGFzcyBUZXN0RXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxubGV0IGhpc3RvcnkgPSBuZXcgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyKCk7XHJcblxyXG5sZXQgZ3JpZCA9IEdyaWRFbGVtZW50XHJcbiAgICAuY3JlYXRlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd4JykpXHJcbiAgICAuZXh0ZW5kKG5ldyBTY3JvbGxlckV4dGVuc2lvbigpKVxyXG4gICAgLmV4dGVuZChuZXcgU2VsZWN0b3JFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IEVkaXRpbmdFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IENsaXBib2FyZEV4dGVuc2lvbigpKVxyXG4gICAgLmV4dGVuZChuZXcgSGlzdG9yeUV4dGVuc2lvbihoaXN0b3J5KSlcclxuICAgIC5leHRlbmQobmV3IENvbXB1dGVFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IENsaWNrWm9uZUV4dGVuc2lvbigpKVxyXG4gICAgLm1lcmdlSW50ZXJmYWNlKClcclxuO1xyXG5cclxuZ3JpZC5vbignaW5wdXQnLCAoZTpHcmlkRWRpdEV2ZW50KSA9PlxyXG57XHJcbiAgICBlLmNoYW5nZXMuZm9yRWFjaCh4ID0+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxuID0gQmFzZTI2Lm51bSh4LmNlbGwuY29sUmVmKS5zdHIgKyAoeC5jZWxsLnJvd1JlZiArIDEpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnY2hhbmdlOicsIGxuLCAnZnJvbScsIHguY2VsbC52YWx1ZSwgJ3RvJywgeC52YWx1ZSwgJy0gY2FzY2FkZWQ6ICcsIHguY2FzY2FkZWQpO1xyXG4gICAgICAgIHguY2VsbC52YWx1ZSA9IHgudmFsdWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncmlkLnJlZHJhdyh0cnVlKTtcclxufSk7XHJcblxyXG5ncmlkLm9uKCdjbGljaycsIChlOmFueSkgPT5cclxue1xyXG4gICAgaWYgKGUuY2VsbCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKEJhc2UyNi5udW0oZS5jZWxsLmNvbFJlZikuc3RyICsgKGUuY2VsbC5yb3dSZWYgKyAxKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZ3JpZC5vbignem9uZWVudGVyJywgZSA9PiBjb25zb2xlLmxvZyhlLnR5cGUsIGUuem9uZS50eXBlKSk7XHJcbmdyaWQub24oJ3pvbmVleGl0JywgZSA9PiBjb25zb2xlLmxvZyhlLnR5cGUsIGUuem9uZS50eXBlKSk7XHJcbmdyaWQub24oJ3pvbmVjbGljaycsIGUgPT4gY29uc29sZS5sb2coZS50eXBlLCBlLnpvbmUudHlwZSkpO1xyXG5cclxuZ3JpZC5tb2RlbCA9IG1ha2VfbW9kZWwoMjYgKiA1LCAyNTApO1xyXG5ncmlkLm1vZGVsLmNlbGxzWzBdWydmb3JtdWxhJ10gPSAnPVNVTShCMTpCMTApJztcclxuZ3JpZC5tb2RlbC5jZWxsc1swXVsncmVhZG9ubHknXSA9IHRydWU7XHJcbmdyaWQubW9kZWwuY2VsbHNbMF1bJ3pvbmVzJ10gPSBbXHJcbiAgICB7XHJcbiAgICAgICAgbW9kZTogJ3JlbCcsXHJcbiAgICAgICAgbGVmdDogMCxcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgd2lkdGg6IDUwLFxyXG4gICAgICAgIGhlaWdodDogMTAwLFxyXG4gICAgICAgIHR5cGU6ICd0ZXN0MScsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG1vZGU6ICdyZWwnLFxyXG4gICAgICAgIGxlZnQ6IDUwLFxyXG4gICAgICAgIHRvcDogMCxcclxuICAgICAgICB3aWR0aDogNTAsXHJcbiAgICAgICAgaGVpZ2h0OiAxMDAsXHJcbiAgICAgICAgdHlwZTogJ3Rlc3QyJyxcclxuICAgIH1cclxuXTtcclxuXHJcbmdyaWQuaW52YWxpZGF0ZSgpO1xyXG5oaXN0b3J5LmNsZWFyKCk7XHJcbmhpc3RvcnkucHVzaCh7XHJcbiAgICBhcHBseTogKCkgPT4gYWxlcnQoJ0ZvcndhcmQhJyksXHJcbiAgICByb2xsYmFjazogKCkgPT4gYWxlcnQoJ0JhY2t3YXJkIScpLFxyXG59KTtcclxuXHJcbndpbmRvd1snR3JpZFJhbmdlJ10gPSBHcmlkUmFuZ2U7XHJcbndpbmRvd1snZ3JpZCddID0gZ3JpZDtcclxuXHJcbmZ1bmN0aW9uIG1ha2VfbW9kZWwoY29sczpudW1iZXIsIHJvd3M6bnVtYmVyKVxyXG57XHJcbiAgICBsZXQgY2VsbHMgPSBbXTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2xzOyBjKyspXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCByb3dzOyByKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjZWxscy5wdXNoKG5ldyBEZWZhdWx0R3JpZENlbGwoe1xyXG4gICAgICAgICAgICAgICAgY29sUmVmOiBjLFxyXG4gICAgICAgICAgICAgICAgcm93UmVmOiByLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICcxMjMnLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gbmV3IERlZmF1bHRHcmlkTW9kZWwoY2VsbHMsIFtdLCBbXSlcclxufSIsImltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgdmFyaWFibGUsIGNvbW1hbmQsIHJvdXRpbmUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0IHsgQ2xpcGJvYXJkIH0gZnJvbSAnLi4vLi4vdmVuZG9yL2NsaXBib2FyZCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuaW1wb3J0ICogYXMgUGFwYSBmcm9tICdwYXBhcGFyc2UnO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuXHJcblxyXG4vL0kga25vdy4uLiA6KFxyXG5jb25zdCBOZXdMaW5lID0gISF3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKC8uKltXd11bSWldW05uXS4qLykgPyAnXFxyXFxuJyA6ICdcXG4nO1xyXG5cclxuZXhwb3J0IGNsYXNzIENsaXBib2FyZEV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIGNvcHlMaXN0OnN0cmluZ1tdID0gW107XHJcbiAgICBwcml2YXRlIGNvcHlSYW5nZTpHcmlkUmFuZ2UgPSBHcmlkUmFuZ2UuZW1wdHkoKTtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBjb3B5TmV0OkNvcHlOZXQ7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IoZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0tFWV9DJywgKGU6S2V5Ym9hcmRFdmVudCkgPT4gdGhpcy5jb3B5U2VsZWN0aW9uKCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLm9uV2luZG93UGFzdGUuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25OZXQoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmJlZ2luRWRpdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpjb21taXQnLCAoKSA9PiB0aGlzLnJlc2V0Q29weSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBjYXB0dXJlU2VsZWN0b3IoKTpTZWxlY3RvcldpZGdldFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ2NhcHR1cmVTZWxlY3RvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgICAgIHRoaXMuY29weU5ldCA9IENvcHlOZXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIGNvcHlTZWxlY3Rpb24oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kb0NvcHkodGhpcy5zZWxlY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuYWxpZ25OZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHJlc2V0Q29weSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQ29weShbXSk7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZG9Db3B5KGNlbGxzOnN0cmluZ1tdLCBkZWxpbWl0ZXI6c3RyaW5nID0gJ1xcdCcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNvcHlMaXN0ID0gY2VsbHM7XHJcbiAgICAgICAgbGV0IHJhbmdlID0gdGhpcy5jb3B5UmFuZ2UgPSBHcmlkUmFuZ2UuY3JlYXRlKHRoaXMuZ3JpZC5tb2RlbCwgY2VsbHMpO1xyXG4gICAgICAgIGxldCB0ZXh0ID0gJyc7XHJcblxyXG4gICAgICAgIGlmICghY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByciA9IHJhbmdlLmx0clswXS5yb3dSZWY7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZS5sdHIubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgYyA9IHJhbmdlLmx0cltpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyciAhPT0gYy5yb3dSZWYpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gTmV3TGluZTtcclxuICAgICAgICAgICAgICAgIHJyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gYy52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpIDwgKHJhbmdlLmx0ci5sZW5ndGggLSAxKSAmJiByYW5nZS5sdHJbaSArIDFdLnJvd1JlZiA9PT0gcnIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gZGVsaW1pdGVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBDbGlwYm9hcmQuY29weSh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvUGFzdGUodGV4dDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgZm9jdXNlZENlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHNlbGVjdGlvblswXSk7XHJcblxyXG4gICAgICAgIGxldCBwYXJzZWQgPSBQYXBhLnBhcnNlKHRleHQsIHtcclxuICAgICAgICAgICAgZGVsaW1pdGVyOiB0ZXh0LmluZGV4T2YoJ1xcdCcpID49IDAgPyAnXFx0JyA6IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGRhdGEgPSBwYXJzZWQuZGF0YS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDEgfHwgKHgubGVuZ3RoID09IDEgJiYgISF4WzBdKSk7XHJcbiAgICAgICAgaWYgKCFkYXRhLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgd2lkdGggPSBfLm1heChkYXRhLCB4ID0+IHgubGVuZ3RoKS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IGhlaWdodCA9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgIGxldCBzdGFydFZlY3RvciA9IG5ldyBQb2ludChmb2N1c2VkQ2VsbC5jb2xSZWYsIGZvY3VzZWRDZWxsLnJvd1JlZik7XHJcbiAgICAgICAgbGV0IGVuZFZlY3RvciA9IHN0YXJ0VmVjdG9yLmFkZChuZXcgUG9pbnQod2lkdGgsIGhlaWdodCkpO1xyXG5cclxuICAgICAgICBsZXQgcGFzdGVSYW5nZSA9IEdyaWRSYW5nZS5jYXB0dXJlKGdyaWQubW9kZWwsIHN0YXJ0VmVjdG9yLCBlbmRWZWN0b3IpO1xyXG5cclxuICAgICAgICBsZXQgY2hhbmdlcyA9IG5ldyBHcmlkQ2hhbmdlU2V0KCk7XHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBwYXN0ZVJhbmdlLmx0cilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB4eSA9IG5ldyBQb2ludChjZWxsLmNvbFJlZiwgY2VsbC5yb3dSZWYpLnN1YnRyYWN0KHN0YXJ0VmVjdG9yKTtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gZGF0YVt4eS55XVt4eS54XSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIGNoYW5nZXMucHV0KGNlbGwucmVmLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ2NvbW1pdCcsIGNoYW5nZXMpO1xyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0JywgcGFzdGVSYW5nZS5sdHIubWFwKHggPT4geC5yZWYpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFsaWduTmV0KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGNvcHlMaXN0LCBjb3B5TmV0IH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoY29weUxpc3QubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBJbXByb3ZlIHRoZSBzaGl0IG91dCBvZiB0aGlzOlxyXG4gICAgICAgICAgICBsZXQgbmV0UmVjdCA9IFJlY3QuZnJvbU1hbnkoY29weUxpc3QubWFwKHggPT4gZ3JpZC5nZXRDZWxsVmlld1JlY3QoeCkpKTtcclxuICAgICAgICAgICAgY29weU5ldC5nb3RvKG5ldFJlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb3B5TmV0LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbldpbmRvd1Bhc3RlKGU6Q2xpcGJvYXJkRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgYWUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4gICAgICAgIHdoaWxlICghIWFlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGFlID09IHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBhZSA9IGFlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWFlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB0ZXh0ID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQvcGxhaW4nKTtcclxuICAgICAgICBpZiAodGV4dCAhPT0gbnVsbCAmJiB0ZXh0ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRvUGFzdGUodGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29weU5ldCBleHRlbmRzIEFic1dpZGdldEJhc2U8SFRNTERpdkVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6Q29weU5ldFxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1uZXQgZ3JpZC1uZXQtY29weSc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgQ29weU5ldChyb290KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IFNlbGVjdG9yV2lkZ2V0IH0gZnJvbSAnLi9TZWxlY3RvckV4dGVuc2lvbic7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBNb3VzZUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvTW91c2VJbnB1dCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgdmFsdWVzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgQWJzV2lkZ2V0QmFzZSwgV2lkZ2V0IH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgY29tbWFuZCwgcm91dGluZSwgdmFyaWFibGUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcblxyXG5cclxuY29uc3QgVmVjdG9ycyA9IHtcclxuICAgIG46IG5ldyBQb2ludCgwLCAtMSksXHJcbiAgICBzOiBuZXcgUG9pbnQoMCwgMSksXHJcbiAgICBlOiBuZXcgUG9pbnQoMSwgMCksXHJcbiAgICB3OiBuZXcgUG9pbnQoLTEsIDApLFxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkRWRpdEV2ZW50XHJcbntcclxuICAgIGNoYW5nZXM6R3JpZENoYW5nZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDaGFuZ2Vcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IHZhbHVlOnN0cmluZztcclxuICAgIHJlYWRvbmx5IGNhc2NhZGVkPzpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDaGFuZ2VTZXRWaXNpdG9yXHJcbntcclxuICAgIChyZWY6c3RyaW5nLCB2YWw6c3RyaW5nLCBjYXNjYWRlZDpib29sZWFuKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDaGFuZ2VTZXRJdGVtXHJcbntcclxuICAgIHJlYWRvbmx5IHJlZjpzdHJpbmc7XHJcbiAgICByZWFkb25seSB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWFkb25seSBjYXNjYWRlZD86Ym9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRDaGFuZ2VTZXRcclxue1xyXG4gICAgcHJpdmF0ZSBkYXRhOk9iamVjdE1hcDxHcmlkQ2hhbmdlU2V0SXRlbT4gPSB7fTtcclxuXHJcbiAgICBwdWJsaWMgY29udGVudHMoKTpHcmlkQ2hhbmdlU2V0SXRlbVtdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcyh0aGlzLmRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQocmVmOnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGVudHJ5ID0gdGhpcy5kYXRhW3JlZl07XHJcbiAgICAgICAgcmV0dXJuICEhZW50cnkgPyBlbnRyeS52YWx1ZSA6IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHV0KHJlZjpzdHJpbmcsIHZhbHVlOnN0cmluZywgY2FzY2FkZWQ/OmJvb2xlYW4pOkdyaWRDaGFuZ2VTZXRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRhdGFbcmVmXSA9IHtcclxuICAgICAgICAgICAgcmVmOiByZWYsXHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgY2FzY2FkZWQ6ICEhY2FzY2FkZWQsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZnMoKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21waWxlKG1vZGVsOkdyaWRNb2RlbCk6R3JpZENoYW5nZVtdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudHMoKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgICAgIGNlbGw6IG1vZGVsLmZpbmRDZWxsKHgucmVmKSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB4LnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgY2FzY2FkZWQ6IHguY2FzY2FkZWQsXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4LmNhc2NhZGVkIHx8ICFpc19yZWFkb25seSh4LmNlbGwpKVxyXG4gICAgICAgIDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJbnB1dFdpZGdldCBleHRlbmRzIFdpZGdldFxyXG57XHJcbiAgICBmb2N1cygpOnZvaWQ7XHJcbiAgICB2YWwodmFsdWU/OnN0cmluZyk6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdGluZ0V4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGlucHV0OklucHV0O1xyXG5cclxuICAgIHByaXZhdGUgaXNFZGl0aW5nOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKHRoaXMuaW5wdXQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchRVNDQVBFJywgKCkgPT4gdGhpcy5lbmRFZGl0KGZhbHNlKSlcclxuICAgICAgICAgICAgLm9uKCchRU5URVInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVRBQicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchU0hJRlQrVEFCJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ1VQX0FSUk9XJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJ0RPV05fQVJST1cnLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignUklHSFRfQVJST1cnLCAoKSA9PiB7IGlmICghdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCkgeyB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSk7IH0gfSlcclxuICAgICAgICAgICAgLm9uKCdMRUZUX0FSUk9XJywgKCkgPT4geyBpZiAoIXRoaXMuaXNFZGl0aW5nRGV0YWlsZWQpIHsgdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLncpOyB9IH0pXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcih0aGlzLmlucHV0LnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZJywgKCkgPT4gdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCA9IHRydWUpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IodGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIURFTEVURScsICgpID0+IHRoaXMuZXJhc2UoKSlcclxuICAgICAgICAgICAgLm9uKCchQkFDS1NQQUNFJywgKCkgPT4gdGhpcy5iZWdpbkVkaXQoJycpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IodGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignREJMQ0xJQ0s6UFJJTUFSWScsICgpID0+IHRoaXMuYmVnaW5FZGl0KG51bGwpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5vbigna2V5cHJlc3MnLCAoZTpHcmlkS2V5Ym9hcmRFdmVudCkgPT4gdGhpcy5iZWdpbkVkaXQoU3RyaW5nLmZyb21DaGFyQ29kZShlLmNoYXJDb2RlKSkpO1xyXG5cclxuICAgICAgICBrZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmRvU2VsZWN0JywgKCkgPT4gdGhpcy5lbmRFZGl0KHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBwcmltYXJ5U2VsZWN0b3IoKTpTZWxlY3RvcldpZGdldFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3ByaW1hcnlTZWxlY3RvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgICAgIHRoaXMuaW5wdXQgPSBJbnB1dC5jcmVhdGUobGF5ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgYmVnaW5FZGl0KG92ZXJyaWRlOnN0cmluZyk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB7IGlucHV0IH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBjZWxsID0gdGhpcy5ncmlkLm1vZGVsLmZpbmRDZWxsKHRoaXMuc2VsZWN0aW9uWzBdKTtcclxuXHJcbiAgICAgICAgaWYgKGlzX3JlYWRvbmx5KGNlbGwpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhb3ZlcnJpZGUgfHwgb3ZlcnJpZGUgPT09ICcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQudmFsKG92ZXJyaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQudmFsKGNlbGwudmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5wdXQuZ290byh0aGlzLnByaW1hcnlTZWxlY3Rvci52aWV3UmVjdCk7XHJcbiAgICAgICAgaW5wdXQuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBlbmRFZGl0KGNvbW1pdDpib29sZWFuID0gdHJ1ZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgaW5wdXQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuICAgICAgICBsZXQgbmV3VmFsdWUgPSBpbnB1dC52YWwoKTtcclxuXHJcbiAgICAgICAgaW5wdXQuaGlkZSgpO1xyXG4gICAgICAgIGlucHV0LnZhbCgnJyk7XHJcbiAgICAgICAgZ3JpZC5mb2N1cygpO1xyXG5cclxuICAgICAgICBpZiAoY29tbWl0ICYmICEhc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tbWl0VW5pZm9ybShzZWxlY3Rpb24uc2xpY2UoMCwgMSksIG5ld1ZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuZEVkaXRUb05laWdoYm9yKHZlY3RvcjpQb2ludCwgY29tbWl0OmJvb2xlYW4gPSB0cnVlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuZW5kRWRpdChjb21taXQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3ROZWlnaGJvcicsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZXJhc2UoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5jb21taXRVbmlmb3JtKHNlbGVjdGlvbiwgJycpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgY29tbWl0VW5pZm9ybShjZWxsczpzdHJpbmdbXSwgdW5pZm9ybVZhbHVlOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjaGFuZ2VzID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICBmb3IgKGxldCByZWYgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjaGFuZ2VzLnB1dChyZWYsIHVuaWZvcm1WYWx1ZSwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jb21taXQoY2hhbmdlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBjb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgbGV0IGNvbXBpbGVkID0gY2hhbmdlcy5jb21waWxlKGdyaWQubW9kZWwpO1xyXG4gICAgICAgIGlmIChjb21waWxlZC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmlkLmVtaXQoJ2lucHV0JywgeyBjaGFuZ2VzOiBjb21waWxlZCB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIElucHV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MSW5wdXRFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQpOklucHV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIHJvb3QudHlwZSA9ICd0ZXh0JztcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLWlucHV0JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgIG1hcmdpbjogJzAnLFxyXG4gICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChyb290KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ290byh2aWV3UmVjdDpSZWN0TGlrZSwgYXV0b1Nob3c6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBzdXBlci5nb3RvKHZpZXdSZWN0KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnJvb3QsIHtcclxuICAgICAgICAgICAgbGVmdDogYCR7dmlld1JlY3QubGVmdCArIDJ9cHhgLFxyXG4gICAgICAgICAgICB0b3A6IGAke3ZpZXdSZWN0LnRvcCArIDJ9cHhgLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dmlld1JlY3Qud2lkdGh9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3ZpZXdSZWN0LmhlaWdodH1weGAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZvY3VzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gdGhpcy5yb290O1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJvb3QuZm9jdXMoKTtcclxuICAgICAgICAgICAgcm9vdC5zZXRTZWxlY3Rpb25SYW5nZShyb290LnZhbHVlLmxlbmd0aCwgcm9vdC52YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH0sIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWwodmFsdWU/OnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QudmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzX3JlYWRvbmx5KGNlbGw6R3JpZENlbGwpOmJvb2xlYW5cclxue1xyXG4gICAgcmV0dXJuIGNlbGxbJ3JlYWRvbmx5J10gPT09IHRydWUgfHwgY2VsbFsnbXV0YWJsZSddID09PSBmYWxzZTtcclxufSIsImltcG9ydCB7IGNvYWxlc2NlIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgUGFkZGluZyB9IGZyb20gJy4uLy4uL2dlb20vUGFkZGluZyc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU2Nyb2xsZXJFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSB3ZWRnZTpIVE1MRGl2RWxlbWVudDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNjcm9sbGVyV2lkdGg/Om51bWJlcikgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxlcldpZHRoID0gY29hbGVzY2Uoc2Nyb2xsZXJXaWR0aCwgZGV0ZWN0X25hdGl2ZV9zY3JvbGxlcl93aWR0aCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgLy9TZXQgcGFkZGluZyByaWdodCBhbmQgYm90dG9tIHRvIHNjcm9sbGVyIHdpZHRoIHRvIHByZXZlbnQgb3ZlcmxhcFxyXG4gICAgICAgIGdyaWQucGFkZGluZyA9IG5ldyBQYWRkaW5nKFxyXG4gICAgICAgICAgICBncmlkLnBhZGRpbmcudG9wLFxyXG4gICAgICAgICAgICBncmlkLnBhZGRpbmcucmlnaHQgKyB0aGlzLnNjcm9sbGVyV2lkdGgsXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy5ib3R0b20gKyB0aGlzLnNjcm9sbGVyV2lkdGgsXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy5sZWZ0KTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignaW52YWxpZGF0ZScsICgpID0+IHRoaXMuYWxpZ25FbGVtZW50cygpKTtcclxuICAgICAgICBncmlkLm9uKCdzY3JvbGwnLCAoKSA9PiB0aGlzLmFsaWduRWxlbWVudHMoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICAvL1Njcm9sbGVyRXh0ZW5zaW9uIGlzIGEgc3BlY2lhbCBjYXNlLCB3ZSBuZWVkIHRvIG1vZGlmeSB0aGUgZ3JpZCBjb250YWluZXIgZWxlbWVudCBpbiBvcmRlclxyXG4gICAgICAgIC8vdG8gcmVsaWFiaWxpdHkgZW5hYmxlIGFsbCBzY3JvbGwgaW50ZXJhY3Rpb24gd2l0aG91dCBsb2dzIG9mIGVtdWxhdGlvbiBhbmQgYnVnZ3kgY3JhcC4gIFdlXHJcbiAgICAgICAgLy9pbmplY3QgYSB3ZWRnZSBlbGVtZW50IHRoYXQgc2ltdWxhdGVzIHRoZSBvdmVyZmxvdyBmb3IgdGhlIGNvbnRhaW5lciBzY3JvbGwgYmFycyBhbmQgdGhlblxyXG4gICAgICAgIC8vaG9sZCB0aGUgZ3JpZCBpbiBwbGFjZSB3aGlsZSBtaXJyb3JpbmcgdGhlIHNjcm9sbCBwcm9wZXJ0eSBhZ2FpbnN0IHRoZSBjb250YWluZXIgc2NvcmxsIFxyXG4gICAgICAgIC8vcG9zaXRpb24uIFZ1YWxhIVxyXG5cclxuICAgICAgICBsZXQgY29udGFpbmVyID0gdGhpcy5ncmlkLmNvbnRhaW5lcjtcclxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vbkNvbnRhaW5lclNjcm9sbC5iaW5kKHRoaXMpKTtcclxuICAgICAgICBEb20uY3NzKGNvbnRhaW5lciwge1xyXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgd2VkZ2UgPSB0aGlzLndlZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgRG9tLmNzcyh3ZWRnZSwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIH0pO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh3ZWRnZSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWxpZ25FbGVtZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25FbGVtZW50cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZ3JpZDtcclxuICAgICAgICBsZXQgY29uYXRpbmVyID0gZ3JpZC5jb250YWluZXI7XHJcblxyXG4gICAgICAgIERvbS5jc3MoZ3JpZC5yb290LCB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAoZ3JpZC5zY3JvbGxMZWZ0KSArICdweCcsXHJcbiAgICAgICAgICAgIHRvcDogKGdyaWQuc2Nyb2xsVG9wKSArICdweCcsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy53ZWRnZSwge1xyXG4gICAgICAgICAgICB3aWR0aDogYCR7Z3JpZC52aXJ0dWFsV2lkdGggLSB0aGlzLnNjcm9sbGVyV2lkdGh9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke2dyaWQudmlydHVhbEhlaWdodCAtIHRoaXMuc2Nyb2xsZXJXaWR0aH1weGAsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChjb25hdGluZXIuc2Nyb2xsTGVmdCAhPSBncmlkLnNjcm9sbExlZnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25hdGluZXIuc2Nyb2xsTGVmdCA9IGdyaWQuc2Nyb2xsTGVmdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25hdGluZXIuc2Nyb2xsVG9wICE9IGdyaWQuc2Nyb2xsVG9wKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uYXRpbmVyLnNjcm9sbFRvcCA9IGdyaWQuc2Nyb2xsVG9wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ29udGFpbmVyU2Nyb2xsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBncmlkID0gdGhpcy5ncmlkO1xyXG4gICAgICAgIGxldCBtYXhTY3JvbGwgPSBuZXcgUG9pbnQoXHJcbiAgICAgICAgICAgIGdyaWQudmlydHVhbFdpZHRoIC0gZ3JpZC53aWR0aCxcclxuICAgICAgICAgICAgZ3JpZC52aXJ0dWFsSGVpZ2h0IC0gZ3JpZC5oZWlnaHQsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ3JpZC5zY3JvbGwgPSBuZXcgUG9pbnQoZ3JpZC5jb250YWluZXIuc2Nyb2xsTGVmdCwgZ3JpZC5jb250YWluZXIuc2Nyb2xsVG9wKVxyXG4gICAgICAgICAgICAuY2xhbXAoUG9pbnQuZW1wdHksIG1heFNjcm9sbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRldGVjdF9uYXRpdmVfc2Nyb2xsZXJfd2lkdGgoKSBcclxue1xyXG4gICAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIG91dGVyLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xyXG4gICAgb3V0ZXIuc3R5bGUud2lkdGggPSBcIjEwMHB4XCI7XHJcbiAgICBvdXRlci5zdHlsZS5tc092ZXJmbG93U3R5bGUgPSBcInNjcm9sbGJhclwiOyAvLyBuZWVkZWQgZm9yIFdpbkpTIGFwcHNcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcclxuXHJcbiAgICB2YXIgd2lkdGhOb1Njcm9sbCA9IG91dGVyLm9mZnNldFdpZHRoO1xyXG4gICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xyXG4gICAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xyXG5cclxuICAgIC8vIGFkZCBpbm5lcmRpdlxyXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIGlubmVyLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XHJcbiAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7ICAgICAgICBcclxuXHJcbiAgICB2YXIgd2lkdGhXaXRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgLy8gcmVtb3ZlIGRpdnNcclxuICAgIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xyXG5cclxuICAgIHJldHVybiB3aWR0aE5vU2Nyb2xsIC0gd2lkdGhXaXRoU2Nyb2xsO1xyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZE1vdXNlRXZlbnQsIEdyaWRNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnRTdXBwb3J0IH0gZnJvbSAnLi4vLi4vaW5wdXQvTW91c2VEcmFnRXZlbnRTdXBwb3J0JztcclxuaW1wb3J0IHsgV2lkZ2V0LCBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgY29tbWFuZCwgcm91dGluZSwgdmFyaWFibGUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcblxyXG5cclxuY29uc3QgVmVjdG9ycyA9IHtcclxuICAgIG53OiBuZXcgUG9pbnQoLTEsIC0xKSxcclxuICAgIG46IG5ldyBQb2ludCgwLCAtMSksXHJcbiAgICBuZTogbmV3IFBvaW50KDEsIC0xKSxcclxuICAgIGU6IG5ldyBQb2ludCgxLCAwKSxcclxuICAgIHNlOiBuZXcgUG9pbnQoMSwgMSksXHJcbiAgICBzOiBuZXcgUG9pbnQoMCwgMSksXHJcbiAgICBzdzogbmV3IFBvaW50KC0xLCAxKSxcclxuICAgIHc6IG5ldyBQb2ludCgtMSwgMCksXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgU2VsZWN0R2VzdHVyZVxyXG57XHJcbiAgICBzdGFydDpzdHJpbmc7XHJcbiAgICBlbmQ6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdG9yV2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JFeHRlbnNpb25FeHBvcnRzXHJcbntcclxuICAgIGNhblNlbGVjdDpib29sZWFuO1xyXG5cclxuICAgIHJlYWRvbmx5IHNlbGVjdGlvbjpzdHJpbmdbXVxyXG5cclxuICAgIHJlYWRvbmx5IHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICByZWFkb25seSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3JXaWRnZXQ7XHJcblxyXG4gICAgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RMaW5lKGdyaWRQdDpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RvckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RHZXN0dXJlOlNlbGVjdEdlc3R1cmU7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgY2FuU2VsZWN0OmJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIEB2YXJpYWJsZShmYWxzZSlcclxuICAgIHByaXZhdGUgc2VsZWN0aW9uOnN0cmluZ1tdID0gW107XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBwcmltYXJ5U2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVNISUZUK1RBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchUklHSFRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUxFRlRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIVVQX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJyFET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK1JJR0hUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrTEVGVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK1VQX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrRE9XTl9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0EnLCAoKSA9PiB0aGlzLnNlbGVjdEFsbCgpKVxyXG4gICAgICAgICAgICAub24oJyFIT01FJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtIT01FJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5udykpXHJcbiAgICAgICAgICAgIC5vbignIUVORCcsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrRU5EJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5zZSkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZURyYWdFdmVudFN1cHBvcnQuZW5hYmxlKGdyaWQucm9vdCk7XHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IoZ3JpZClcclxuICAgICAgICAgICAgLm9uKCdET1dOOlNISUZUK1BSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT4gdGhpcy5zZWxlY3RMaW5lKG5ldyBQb2ludChlLmdyaWRYLCBlLmdyaWRZKSkpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+IHRoaXMuYmVnaW5TZWxlY3RHZXN0dXJlKGUuZ3JpZFgsIGUuZ3JpZFkpKVxyXG4gICAgICAgICAgICAub24oJ0RSQUc6UFJJTUFSWScsIChlOkdyaWRNb3VzZURyYWdFdmVudCkgPT4gdGhpcy51cGRhdGVTZWxlY3RHZXN0dXJlKGUuZ3JpZFgsIGUuZ3JpZFkpKVxyXG4gICAgICAgICAgICAub24oJ1VQOlBSSU1BUlknLCAoZTpHcmlkTW91c2VEcmFnRXZlbnQpID0+IHRoaXMuZW5kU2VsZWN0R2VzdHVyZSgvKmUuZ3JpZFgsIGUuZ3JpZFkqLykpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5yZXNlbGVjdChmYWxzZSkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25TZWxlY3RvcnMoZmFsc2UpKTtcclxuXHJcbiAgICAgICAga2VybmVsLnZhcmlhYmxlcy5kZWZpbmUoJ2lzU2VsZWN0aW5nJywge1xyXG4gICAgICAgICAgICBnZXQ6ICgpID0+ICEhdGhpcy5zZWxlY3RHZXN0dXJlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG5cclxuICAgICAgICB0aGlzLnByaW1hcnlTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5jYXB0dXJlU2VsZWN0b3IgPSBTZWxlY3Rvci5jcmVhdGUobGF5ZXIsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdChjZWxsczpzdHJpbmdbXSwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvU2VsZWN0KGNlbGxzLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICB0aGlzLmFsaWduU2VsZWN0b3JzKHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0QWxsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZ3JpZC5tb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXJ0Q2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwocmVmKTtcclxuICAgICAgICAgICAgbGV0IHh5ID0geyB4OiBzdGFydENlbGwuY29sUmVmLCB5OiBzdGFydENlbGwucm93UmVmIH0gYXMgUG9pbnRMaWtlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IGdyaWQubW9kZWxXaWR0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IGdyaWQubW9kZWxIZWlnaHQgLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVzdWx0Q2VsbCA9IGdyaWQubW9kZWwubG9jYXRlQ2VsbCh4eS54LCB4eS55KTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtyZXN1bHRDZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0RWRnZSh2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgZW1wdHkgPSAoY2VsbDpHcmlkQ2VsbCkgPT4gPGFueT4oY2VsbC52YWx1ZSA9PT0gJycgIHx8IGNlbGwudmFsdWUgPT09ICcwJyB8fCBjZWxsLnZhbHVlID09PSB1bmRlZmluZWQgfHwgY2VsbC52YWx1ZSA9PT0gbnVsbCk7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgY3VyckNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3Ioc3RhcnRDZWxsLnJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdENlbGwgPSA8R3JpZENlbGw+bnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghY3VyckNlbGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGEgPSBjdXJyQ2VsbDtcclxuICAgICAgICAgICAgICAgIGxldCBiID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKGEucmVmLCB2ZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYSB8fCAhYilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gISFhID8gYSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5KGEpICsgZW1wdHkoYikgPT0gMSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gZW1wdHkoYSkgPyBiIDogYTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjdXJyQ2VsbCA9IGI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRDZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbcmVzdWx0Q2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmICghcmVmKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG5cclxuICAgICAgICBsZXQgc3RhcnRQdCA9IGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHJlZikudG9wTGVmdCgpO1xyXG4gICAgICAgIGxldCBsaW5lUmVjdCA9IFJlY3QuZnJvbVBvaW50cyhzdGFydFB0LCBncmlkUHQpO1xyXG5cclxuICAgICAgICBsZXQgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChsaW5lUmVjdCkubWFwKHggPT4geC5yZWYpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHJlZiksIDEpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZSgwLCAwLCByZWYpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgYXV0b1Njcm9sbCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3IocmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW2NlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNlbGVjdChhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVtYWluaW5nID0gc2VsZWN0aW9uLmZpbHRlcih4ID0+ICEhZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcbiAgICAgICAgaWYgKHJlbWFpbmluZy5sZW5ndGggIT0gc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KHJlbWFpbmluZywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5TZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuXHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IHtcclxuICAgICAgICAgICAgc3RhcnQ6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICBlbmQ6IGNlbGwucmVmLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KFsgY2VsbC5yZWYgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0R2VzdHVyZSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSBncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcblxyXG4gICAgICAgIGlmICghY2VsbCB8fCBzZWxlY3RHZXN0dXJlLmVuZCA9PT0gY2VsbC5yZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgc2VsZWN0R2VzdHVyZS5lbmQgPSBjZWxsLnJlZjtcclxuXHJcbiAgICAgICAgbGV0IHJlZ2lvbiA9IFJlY3QuZnJvbU1hbnkoW1xyXG4gICAgICAgICAgICBncmlkLmdldENlbGxHcmlkUmVjdChzZWxlY3RHZXN0dXJlLnN0YXJ0KSxcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5lbmQpXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIGxldCBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlZ2lvbilcclxuICAgICAgICAgICAgLm1hcCh4ID0+eC5yZWYpO1xyXG5cclxuICAgICAgICBpZiAoY2VsbFJlZnMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHNlbGVjdEdlc3R1cmUuc3RhcnQpLCAxKTtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHNlbGVjdEdlc3R1cmUuc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGNlbGxSZWZzLmxlbmd0aCA9PSAxKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuZFNlbGVjdEdlc3R1cmUoKTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb1NlbGVjdChjZWxsczpzdHJpbmdbXSA9IFtdLCBhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNhblNlbGVjdClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBjZWxscztcclxuXHJcbiAgICAgICAgICAgIGlmIChhdXRvU2Nyb2xsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJpbWFyeVJlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChjZWxsc1swXSk7XHJcbiAgICAgICAgICAgICAgICBncmlkLnNjcm9sbFRvKHByaW1hcnlSZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFsaWduU2VsZWN0b3JzKGFuaW1hdGU6Ym9vbGVhbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiwgcHJpbWFyeVNlbGVjdG9yLCBjYXB0dXJlU2VsZWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3Qoc2VsZWN0aW9uWzBdKTtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmdvdG8ocHJpbWFyeVJlY3QsIGFuaW1hdGUpO1xyXG5cclxuICAgICAgICAgICAgLy9UT0RPOiBJbXByb3ZlIHRoZSBzaGl0IG91dCBvZiB0aGlzOlxyXG4gICAgICAgICAgICBsZXQgY2FwdHVyZVJlY3QgPSBSZWN0LmZyb21NYW55KHNlbGVjdGlvbi5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuZ290byhjYXB0dXJlUmVjdCwgYW5pbWF0ZSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci50b2dnbGUoc2VsZWN0aW9uLmxlbmd0aCA+IDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2VsZWN0b3IgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxEaXZFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQsIHByaW1hcnk6Ym9vbGVhbiA9IGZhbHNlKTpTZWxlY3RvclxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1zZWxlY3RvciAnICsgKHByaW1hcnkgPyAnZ3JpZC1zZWxlY3Rvci1wcmltYXJ5JyA6ICcnKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rvcihyb290KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbXB1dGVFbmdpbmUgfSBmcm9tICcuL0NvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSB9IGZyb20gJy4vSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgZXh0ZW5kLCBmbGF0dGVuLCB6aXBQYWlycyB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2VsbFdpdGhGb3JtdWxhIGV4dGVuZHMgR3JpZENlbGxcclxue1xyXG4gICAgZm9ybXVsYTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wdXRlRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgZW5naW5lOkNvbXB1dGVFbmdpbmU7XHJcblxyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZT86Q29tcHV0ZUVuZ2luZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVuZ2luZSA9IGVuZ2luZSB8fCBuZXcgSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuZW5naW5lLmNvbm5lY3QoZ3JpZCk7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnY29tbWl0JywgdGhpcy5jb21taXRPdmVycmlkZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBrZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2JlZ2luRWRpdCcsIHRoaXMuYmVnaW5FZGl0T3ZlcnJpZGUuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCB0aGlzLnJlbG9hZC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbG9hZCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBlbmdpbmUsIGdyaWQgfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGVuZ2luZS5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBncmlkLm1vZGVsLmNlbGxzKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBmb3JtdWxhID0gY2VsbFsnZm9ybXVsYSddIGFzIHN0cmluZztcclxuICAgICAgICAgICAgaWYgKCEhZm9ybXVsYSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLnByb2dyYW0oY2VsbC5yZWYsIGZvcm11bGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgZ3JpZC5leGVjKCdjb21taXQnLCBlbmdpbmUuY29tcHV0ZSgpKTtcclxuICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5FZGl0T3ZlcnJpZGUob3ZlcnJpZGU6c3RyaW5nLCBpbXBsOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGVuZ2luZSwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXNlbGVjdGlvblswXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghb3ZlcnJpZGUgJiYgb3ZlcnJpZGUgIT09ICcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb3ZlcnJpZGUgPSBlbmdpbmUuZ2V0Rm9ybXVsYShzZWxlY3Rpb25bMF0pIHx8IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW1wbChvdmVycmlkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb21taXRPdmVycmlkZShjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQsIGltcGw6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZW5naW5lLCBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubm9DYXB0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHNjb3BlID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICAgICAgbGV0IGNvbXB1dGVMaXN0ID0gW10gYXMgc3RyaW5nW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCB0bSBvZiBjaGFuZ2VzLmNvbnRlbnRzKCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbCh0bS5yZWYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxbJ3JlYWRvbmx5J10gIT09IHRydWUgJiYgY2VsbFsnbXV0YWJsZSddICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodG0udmFsdWUubGVuZ3RoID4gMCAmJiB0bS52YWx1ZVswXSA9PT0gJz0nKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLnByb2dyYW0odG0ucmVmLCB0bS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5jbGVhcihbdG0ucmVmXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnB1dCh0bS5yZWYsIHRtLnZhbHVlLCB0bS5jYXNjYWRlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb21wdXRlTGlzdC5wdXNoKHRtLnJlZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb21wdXRlTGlzdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXMgPSBlbmdpbmUuY29tcHV0ZShjb21wdXRlTGlzdCwgc2NvcGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGltcGwoY2hhbmdlcyk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBCYXNlMjYgfSBmcm9tICcuLi8uLic7XHJcbmltcG9ydCB7IGV4dGVuZCwgZmxhdHRlbiwgaW5kZXggfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBDb21wdXRlRW5naW5lIH0gZnJvbSAnLi9Db21wdXRlRW5naW5lJztcclxuaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4uL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBXYXRjaE1hbmFnZXIgfSBmcm9tICcuL1dhdGNoTWFuYWdlcic7XHJcblxyXG5cclxuY29uc3QgUmVmRXh0cmFjdCA9IC8oPyEuKlsnXCJgXSlbQS1aYS16XStbMC05XSs6PyhbQS1aYS16XStbMC05XSspPy9nO1xyXG5cclxuY29uc3QgU3VwcG9ydEZ1bmN0aW9ucyA9IHtcclxuICAgIC8vTWF0aDpcclxuICAgIGFiczogTWF0aC5hYnMsXHJcbiAgICBhY29zOiBNYXRoLmFjb3MsXHJcbiAgICBhc2luOiBNYXRoLmFzaW4sXHJcbiAgICBhdGFuOiBNYXRoLmF0YW4sXHJcbiAgICBhdGFuMjogTWF0aC5hdGFuMixcclxuICAgIGNlaWw6IE1hdGguY2VpbCxcclxuICAgIGNvczogTWF0aC5jb3MsXHJcbiAgICBleHA6IE1hdGguZXhwLFxyXG4gICAgZmxvb3I6IE1hdGguZmxvb3IsXHJcbiAgICBsb2c6IE1hdGgubG9nLFxyXG4gICAgbWF4OiBNYXRoLm1heCxcclxuICAgIG1pbjogTWF0aC5taW4sXHJcbiAgICBwb3c6IE1hdGgucG93LFxyXG4gICAgcmFuZG9tOiBNYXRoLnJhbmRvbSxcclxuICAgIHJvdW5kOiBNYXRoLnJvdW5kLFxyXG4gICAgc2luOiBNYXRoLnNpbixcclxuICAgIHNxcnQ6IE1hdGguc3FydCxcclxuICAgIHRhbjogTWF0aC50YW4sXHJcbiAgICAvL0N1c3RvbTpcclxuICAgIGF2ZzogZnVuY3Rpb24odmFsdWVzOm51bWJlcltdKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gU3VwcG9ydEZ1bmN0aW9ucy5zdW0odmFsdWVzKSAvIHZhbHVlcy5sZW5ndGg7XHJcbiAgICB9LFxyXG4gICAgc3VtOiBmdW5jdGlvbih2YWx1ZXM6bnVtYmVyW10pOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB2YWx1ZXMgPSBbdmFsdWVzXTtcclxuICAgICAgICByZXR1cm4gdmFsdWVzLnJlZHVjZSgodCwgeCkgPT4gdCArIHgsIDApO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGlsZWRGb3JtdWxhXHJcbntcclxuICAgIChjaGFuZ2VTY29wZT86R3JpZENoYW5nZVNldCk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUgaW1wbGVtZW50cyBDb21wdXRlRW5naW5lXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgZm9ybXVsYXM6T2JqZWN0TWFwPHN0cmluZz4gPSB7fTtcclxuICAgIHByaXZhdGUgY2FjaGU6T2JqZWN0TWFwPENvbXBpbGVkRm9ybXVsYT4gPSB7fTtcclxuICAgIHByaXZhdGUgd2F0Y2hlczpXYXRjaE1hbmFnZXIgPSBuZXcgV2F0Y2hNYW5hZ2VyKCk7XHJcbiAgICBcclxuICAgIHB1YmxpYyBnZXRGb3JtdWxhKGNlbGxSZWY6c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtdWxhc1tjZWxsUmVmXSB8fCB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKGNlbGxSZWZzPzpzdHJpbmdbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghIWNlbGxSZWZzICYmICEhY2VsbFJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgY3Igb2YgY2VsbFJlZnMpIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5mb3JtdWxhc1tjcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLndhdGNoZXMudW53YXRjaChjcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5mb3JtdWxhcyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLndhdGNoZXMuY2xlYXIoKTsgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoZ3JpZDpHcmlkRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBldmFsdWF0ZShmb3JtdWxhOnN0cmluZywgY2hhbmdlU2NvcGU/OkdyaWRDaGFuZ2VTZXQpOnN0cmluZyBcclxuICAgIHtcclxuICAgICAgICBsZXQgZnVuYyA9IHRoaXMuY29tcGlsZShmb3JtdWxhKTtcclxuICAgICAgICByZXR1cm4gKGZ1bmMoY2hhbmdlU2NvcGUgfHwgbmV3IEdyaWRDaGFuZ2VTZXQoKSkgfHwgMCkudG9TdHJpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShjZWxsUmVmczpzdHJpbmdbXSA9IFtdLCBzY29wZTpHcmlkQ2hhbmdlU2V0ID0gbmV3IEdyaWRDaGFuZ2VTZXQoKSwgY2FzY2FkZTpib29sZWFuID0gdHJ1ZSk6R3JpZENoYW5nZVNldFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGZvcm11bGFzIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbG9va3VwID0gaW5kZXgoY2VsbFJlZnMsIHggPT4geCk7XHJcbiAgICAgICAgbGV0IHRhcmdldHMgPSAoISFjZWxsUmVmcy5sZW5ndGggPyBjZWxsUmVmcyA6IE9iamVjdC5rZXlzKHRoaXMuZm9ybXVsYXMpKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcblxyXG4gICAgICAgIGlmIChjYXNjYWRlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGFyZ2V0cyA9IHRoaXMuY2FzY2FkZVRhcmdldHModGFyZ2V0cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHRhcmdldHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgZm9ybXVsYSA9IGZvcm11bGFzW2NlbGwucmVmXTtcclxuICAgICAgICAgICAgaWYgKGZvcm11bGEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSB0aGlzLmV2YWx1YXRlKGZvcm11bGEsIHNjb3BlKVxyXG4gICAgICAgICAgICAgICAgc2NvcGUucHV0KGNlbGwucmVmLCByZXN1bHQsICFsb29rdXBbY2VsbC5yZWZdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNjb3BlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnNwZWN0KGZvcm11bGE6c3RyaW5nKTpzdHJpbmdbXSBcclxuICAgIHtcclxuICAgICAgICBsZXQgZXhwcnMgPSBbXSBhcyBzdHJpbmdbXTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gbnVsbCBhcyBSZWdFeHBFeGVjQXJyYXk7XHJcblxyXG4gICAgICAgIHdoaWxlIChyZXN1bHQgPSBSZWZFeHRyYWN0LmV4ZWMoZm9ybXVsYSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGV4cHJzLnB1c2gocmVzdWx0WzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBleHBycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvZ3JhbShjZWxsUmVmOnN0cmluZywgZm9ybXVsYTpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmZvcm11bGFzW2NlbGxSZWZdID0gZm9ybXVsYTtcclxuXHJcbiAgICAgICAgbGV0IGV4cHJzID0gdGhpcy5pbnNwZWN0KGZvcm11bGEpO1xyXG4gICAgICAgIGxldCBkcG5SYW5nZXMgPSBleHBycy5tYXAoeCA9PiBHcmlkUmFuZ2Uuc2VsZWN0KHRoaXMuZ3JpZC5tb2RlbCwgeCkubHRyKTtcclxuICAgICAgICBsZXQgZHBucyA9IGZsYXR0ZW48R3JpZENlbGw+KGRwblJhbmdlcykubWFwKHggPT4geC5yZWYpO1xyXG5cclxuICAgICAgICBpZiAoZHBucy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndhdGNoZXMud2F0Y2goY2VsbFJlZiwgZHBucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBjb21waWxlKGZvcm11bGE6c3RyaW5nKTpDb21waWxlZEZvcm11bGFcclxuICAgIHtcclxuICAgICAgICBmdW5jdGlvbiBmaW5kKGZvcm11bGE6c3RyaW5nLCByZWY6c3RyaW5nKTpudW1iZXIgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvcm11bGEubGVuZ3RoOyBpKyspIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm9ybXVsYVtpXSA9PSByZWZbMF0pIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3JtdWxhLnN1YnN0cihpLCByZWYubGVuZ3RoKSA9PT0gcmVmKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuYyA9IGZvcm11bGFbaSArIHJlZi5sZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5jIHx8ICFuYy5tYXRjaCgvXFx3LykpIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9TdG9yZSBrZXkgc2VwYXJhdGVseSBiZWNhdXNlIHdlIGNoYW5nZSB0aGUgZm9ybXVsYS4uLlxyXG4gICAgICAgICAgICBsZXQgY2FjaGVLZXkgPSBmb3JtdWxhO1xyXG4gICAgICAgICAgICBsZXQgZnVuYyA9IHRoaXMuY2FjaGVbY2FjaGVLZXldIGFzIENvbXBpbGVkRm9ybXVsYTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZnVuYylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4cHJzID0gdGhpcy5pbnNwZWN0KGZvcm11bGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHggb2YgZXhwcnMpIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBpZHggPSBmaW5kKGZvcm11bGEsIHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtdWxhID0gZm9ybXVsYS5zdWJzdHJpbmcoMCwgaWR4KSArIGBleHByKCcke3h9JywgYXJndW1lbnRzWzFdKWAgKyBmb3JtdWxhLnN1YnN0cmluZyhpZHggKyB4Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmdW5jdGlvbnMgPSBleHRlbmQoe30sIFN1cHBvcnRGdW5jdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb25zLmV4cHIgPSB0aGlzLnJlc29sdmUuYmluZCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY29kZSA9IGB3aXRoIChhcmd1bWVudHNbMF0pIHsgdHJ5IHsgcmV0dXJuICgke2Zvcm11bGEuc3Vic3RyKDEpfSk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgcmV0dXJuIDA7IH0gfWAudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSB0aGlzLmNhY2hlW2NhY2hlS2V5XSA9IG5ldyBGdW5jdGlvbihjb2RlKS5iaW5kKG51bGwsIGZ1bmN0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NvbXBpbGU6JywgZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybXVsYSk7XHJcbiAgICAgICAgICAgIHJldHVybiB4ID0+IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBjYXNjYWRlVGFyZ2V0cyhjZWxsczpHcmlkQ2VsbFtdKTpHcmlkQ2VsbFtdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgZm9ybXVsYXMsIHdhdGNoZXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gW10gYXMgR3JpZENlbGxbXTtcclxuICAgICAgICBsZXQgYWxyZWFkeVB1c2hlZCA9IHt9IGFzIE9iamVjdE1hcDxib29sZWFuPjtcclxuXHJcbiAgICAgICAgY29uc3QgdmlzaXQgPSAoY2VsbDpHcmlkQ2VsbCk6dm9pZCA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGFscmVhZHlQdXNoZWRbY2VsbC5yZWZdID09PSB0cnVlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IHdhdGNoZXMuZ2V0T2JzZXJ2ZXJzT2YoY2VsbC5yZWYpXHJcbiAgICAgICAgICAgICAgICAubWFwKHggPT4gZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBkYyBvZiBkZXBlbmRlbmNpZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc2l0KGRjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEhZm9ybXVsYXNbY2VsbC5yZWZdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaXN0LnNwbGljZSgwLCAwLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWxyZWFkeVB1c2hlZFtjZWxsLnJlZl0gPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgdmlzaXQoYyk7ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgcmVzb2x2ZShleHByOnN0cmluZywgY2hhbmdlU2NvcGU6R3JpZENoYW5nZVNldCk6bnVtYmVyfG51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHZhbHVlcyA9IEdyaWRSYW5nZVxyXG4gICAgICAgICAgICAuc2VsZWN0KHRoaXMuZ3JpZC5tb2RlbCwgZXhwcilcclxuICAgICAgICAgICAgLmx0clxyXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5jb2FsZXNjZUZsb2F0KGNoYW5nZVNjb3BlLmdldCh4LnJlZiksIHgudmFsdWUpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPCAyXHJcbiAgICAgICAgICAgID8gKHZhbHVlc1swXSB8fCAwKVxyXG4gICAgICAgICAgICA6IHZhbHVlcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvYWxlc2NlRmxvYXQoLi4udmFsdWVzOnN0cmluZ1tdKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCB2IG9mIHZhbHVlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHYpIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBjbGFzcyBXYXRjaE1hbmFnZXJcclxue1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZpbmc6T2JqZWN0TWFwPHN0cmluZ1tdPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZlZDpPYmplY3RNYXA8c3RyaW5nW10+ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IoKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9ic2VydmluZyA9IHt9O1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZWQgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0T2JzZXJ2ZXJzT2YoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZWRbY2VsbFJlZl0gfHwgW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE9ic2VydmVkQnkoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2aW5nW2NlbGxSZWZdIHx8IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3YXRjaChvYnNlcnZlcjpzdHJpbmcsIHN1YmplY3RzOnN0cmluZ1tdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFzdWJqZWN0cyB8fCAhc3ViamVjdHMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2aW5nW29ic2VydmVyXSA9IHN1YmplY3RzO1xyXG4gICAgICAgIGZvciAobGV0IHMgb2Ygc3ViamVjdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMub2JzZXJ2ZWRbc10gfHwgKHRoaXMub2JzZXJ2ZWRbc10gPSBbXSk7XHJcbiAgICAgICAgICAgIGxpc3QucHVzaChvYnNlcnZlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bndhdGNoKG9ic2VydmVyOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBzdWJqZWN0cyA9IHRoaXMuZ2V0T2JzZXJ2ZWRCeShvYnNlcnZlcik7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2aW5nW29ic2VydmVyXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcyBvZiBzdWJqZWN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5vYnNlcnZlZFtzXSB8fCBbXTtcclxuICAgICAgICAgICAgbGV0IGl4ID0gbGlzdC5pbmRleE9mKG9ic2VydmVyKTtcclxuICAgICAgICAgICAgaWYgKGl4ID49IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGl4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCdcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRFeHRlbnNpb24sIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnXHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIENsaWNrWm9uZU1vZGUgPSAnYWJzJ3wnYWJzLWFsdCd8J3JlbCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENsaWNrWm9uZSBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIG1vZGU6Q2xpY2tab25lTW9kZTtcclxuICAgIHR5cGU6c3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQ2xpY2tab25lU2VsZWN0aW9uXHJcbntcclxuICAgIGNlbGw6R3JpZENlbGw7XHJcbiAgICB6b25lOkNsaWNrWm9uZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDbGlja1pvbmVNb3VzZUV2ZW50IGV4dGVuZHMgR3JpZE1vdXNlRXZlbnRcclxue1xyXG4gICAgem9uZTpDbGlja1pvbmU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDbGlja1pvbmVFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGN1cnJlbnQ6Q2xpY2tab25lU2VsZWN0aW9uO1xyXG4gICAgcHJpdmF0ZSBsYXN0R3JpZFB0OlBvaW50O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0IGlzU2VsZWN0aW5nKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ2lzU2VsZWN0aW5nJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZm9yd2FyZExheWVyRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuZm9yd2FyZExheWVyRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uR2xvYmFsTW91c2VNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGdyaWQub24oJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3dpdGNoWm9uZShjenM6Q2xpY2tab25lU2VsZWN0aW9uLCBzb3VyY2VFdmVudDpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgbGF5ZXIgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChoYXNoKHRoaXMuY3VycmVudCkgPT09IGhhc2goY3pzKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JpZC5lbWl0KCd6b25lZXhpdCcsIGNyZWF0ZV9ldmVudCgnem9uZWV4aXQnLCB0aGlzLmN1cnJlbnQsIHNvdXJjZUV2ZW50KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBjenM7XHJcblxyXG4gICAgICAgIGlmIChjenMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsYXllci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2FsbCc7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnem9uZWVudGVyJywgY3JlYXRlX2V2ZW50KCd6b25lZW50ZXInLCB0aGlzLmN1cnJlbnQsIHNvdXJjZUV2ZW50KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxheWVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZExheWVyRXZlbnQoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgbGFzdEdyaWRQdCB9ID0gdGhpcztcclxuICAgICAgICBlWydncmlkWCddID0gbGFzdEdyaWRQdC54O1xyXG4gICAgICAgIGVbJ2dyaWRZJ10gPSBsYXN0R3JpZFB0Lnk7XHJcblxyXG4gICAgICAgIGxldCB0eXBlID0gJ3pvbmUnICsgZS50eXBlO1xyXG5cclxuICAgICAgICBncmlkLmZvY3VzKCk7XHJcbiAgICAgICAgZ3JpZC5lbWl0KHR5cGUsIGNyZWF0ZV9ldmVudCh0eXBlLCB0aGlzLmN1cnJlbnQsIGUgYXMgR3JpZE1vdXNlRXZlbnQpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBtb3VzZVB0ID0gdGhpcy5sYXN0R3JpZFB0ID0gbmV3IFBvaW50KGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IGdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KG1vdXNlUHQpO1xyXG4gICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZpZXdSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICBsZXQgem9uZXMgPSAoY2VsbFsnem9uZXMnXSB8fCBbXSkgYXMgQ2xpY2tab25lW107XHJcblxyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0ID0gem9uZXNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLnRlc3QoY2VsbCwgeCwgbW91c2VQdCkpXHJcbiAgICAgICAgICAgICAgICBbMF0gfHwgbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRhcmdldClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKHtjZWxsOiBjZWxsLCB6b25lOiB0YXJnZXR9LCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUobnVsbCwgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25HbG9iYWxNb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMuY3VycmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBncmlkUmVjdCA9IFJlY3QuZnJvbUxpa2UoZ3JpZC5yb290LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKVxyXG4gICAgICAgICAgICBsZXQgbW91c2VQdCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghZ3JpZFJlY3QuY29udGFpbnMobW91c2VQdCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJpdmF0ZSB0ZXN0KGNlbGw6R3JpZENlbGwsIHpvbmU6Q2xpY2tab25lLCBwdDpQb2ludCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aWV3UmVjdCA9IHRoaXMuZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbC5yZWYpO1xyXG4gICAgICAgIGxldCB6b25lUmVjdCA9IFJlY3QuZnJvbUxpa2Uoem9uZSk7XHJcblxyXG4gICAgICAgIGlmICh6b25lLm1vZGUgPT09ICdyZWwnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgem9uZVJlY3QgPSBuZXcgUmVjdChcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoICogKHpvbmVSZWN0LmxlZnQgLyAxMDApLFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3QuaGVpZ2h0ICogKHpvbmVSZWN0LnRvcCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC53aWR0aCAqICh6b25lUmVjdC53aWR0aCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgKiAoem9uZVJlY3QuaGVpZ2h0IC8gMTAwKSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHpvbmUubW9kZSA9PT0gJ2Ficy1hbHQnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHpvbmVSZWN0ID0gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC53aWR0aCAtIHpvbmVSZWN0LmxlZnQgLSB6b25lUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgLSB6b25lUmVjdC50b3AgLSB6b25lUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICB6b25lUmVjdC53aWR0aCxcclxuICAgICAgICAgICAgICAgIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB6b25lUmVjdC5vZmZzZXQodmlld1JlY3QudG9wTGVmdCgpKS5jb250YWlucyhwdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZV9ldmVudCh0eXBlOnN0cmluZywgY3pzOkNsaWNrWm9uZVNlbGVjdGlvbiwgc291cmNlOk1vdXNlRXZlbnQpOkNsaWNrWm9uZU1vdXNlRXZlbnRcclxue1xyXG4gICAgbGV0IGV2ZW50ID0gPGFueT4obmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAvLyBldmVudC5ncmlkWCA9IHNvdXJjZS5ncmlkWDtcclxuICAgIC8vIGV2ZW50LmdyaWRZID0gc291cmNlLmdyaWRZO1xyXG4gICAgZXZlbnQuY2VsbCA9IGN6cy5jZWxsO1xyXG4gICAgZXZlbnQuem9uZSA9IGN6cy56b25lO1xyXG4gICAgcmV0dXJuIGV2ZW50O1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNoKGN6czpDbGlja1pvbmVTZWxlY3Rpb24pOnN0cmluZ1xyXG57XHJcbiAgICBpZiAoIWN6cykgcmV0dXJuICcnO1xyXG4gICAgcmV0dXJuIFtjenMuY2VsbC5yZWYsIGN6cy56b25lLmxlZnQsIGN6cy56b25lLnRvcCwgY3pzLnpvbmUud2lkdGgsIGN6cy56b25lLmhlaWdodF1cclxuICAgICAgICAuam9pbignOicpO1xyXG59IiwiaW1wb3J0IHsgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyLCBIaXN0b3J5QWN0aW9uLCBIaXN0b3J5TWFuYWdlciB9IGZyb20gJy4vSGlzdG9yeU1hbmFnZXInO1xyXG5pbXBvcnQgeyB6aXBQYWlycyB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuLi9jb21tb24vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJ1xyXG5cclxuXHJcbmludGVyZmFjZSBDZWxsRWRpdFNuYXBzaG90XHJcbntcclxuICAgIHJlZjpzdHJpbmc7XHJcbiAgICBuZXdWYWw6c3RyaW5nO1xyXG4gICAgb2xkVmFsOnN0cmluZztcclxuICAgIGNhc2NhZGVkPzpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSGlzdG9yeUV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBtYW5hZ2VyOkhpc3RvcnlNYW5hZ2VyO1xyXG5cclxuICAgIHByaXZhdGUgbm9DYXB0dXJlOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgc3VzcGVuZGVkOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgY2FwdHVyZTpPYmplY3RNYXA8c3RyaW5nPjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5hZ2VyPzpIaXN0b3J5TWFuYWdlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyIHx8IG5ldyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IoZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0tFWV9aJywgKCkgPT4gdGhpcy51bmRvKCkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1knLCAoKSA9PiB0aGlzLnJlZG8oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpjb21taXQnLCB0aGlzLmJlZm9yZUNvbW1pdC5iaW5kKHRoaXMpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdhZnRlcjpjb21taXQnLCB0aGlzLmFmdGVyQ29tbWl0LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgdW5kbygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIudW5kbygpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgcmVkbygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIucmVkbygpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgcHVzaChhY3Rpb246SGlzdG9yeUFjdGlvbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5wdXNoKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoJ2NsZWFySGlzdG9yeScpXHJcbiAgICBwcml2YXRlIGNsZWFyKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5jbGVhcigpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKCdzdXNwZW5kSGlzdG9yeScpXHJcbiAgICBwcml2YXRlIHN1c3BlbmQoZmxhZzpib29sZWFuID0gdHJ1ZSk6dm9pZCBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnN1c3BlbmRlZCA9IGZsYWc7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWZvcmVDb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMubm9DYXB0dXJlIHx8IHRoaXMuc3VzcGVuZGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBtb2RlbCA9IHRoaXMuZ3JpZC5tb2RlbDtcclxuXHJcbiAgICAgICAgdGhpcy5jYXB0dXJlID0gemlwUGFpcnMoXHJcbiAgICAgICAgICAgIGNoYW5nZXMucmVmcygpLm1hcChyID0+IFtyLCBtb2RlbC5maW5kQ2VsbChyKS52YWx1ZV0pIFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZnRlckNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ub0NhcHR1cmUgfHwgIXRoaXMuY2FwdHVyZSB8fCB0aGlzLnN1c3BlbmRlZClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgc25hcHNob3RzID0gdGhpcy5jcmVhdGVTbmFwc2hvdHModGhpcy5jYXB0dXJlLCBjaGFuZ2VzKTtcclxuICAgICAgICBpZiAoc25hcHNob3RzLmxlbmd0aCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgYWN0aW9uID0gdGhpcy5jcmVhdGVFZGl0QWN0aW9uKHNuYXBzaG90cyk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNhcHR1cmUgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlU25hcHNob3RzKGNhcHR1cmU6T2JqZWN0TWFwPHN0cmluZz4sIGNoYW5nZXM6R3JpZENoYW5nZVNldCk6Q2VsbEVkaXRTbmFwc2hvdFtdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IG1vZGVsID0gdGhpcy5ncmlkLm1vZGVsO1xyXG4gICAgICAgIGxldCBiYXRjaCA9IFtdIGFzIENlbGxFZGl0U25hcHNob3RbXTtcclxuXHJcbiAgICAgICAgbGV0IGNvbXBpbGVkID0gY2hhbmdlcy5jb21waWxlKG1vZGVsKTtcclxuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBjb21waWxlZC5maWx0ZXIoeCA9PiAheC5jYXNjYWRlZCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiYXRjaC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHJlZjogZW50cnkuY2VsbC5yZWYsXHJcbiAgICAgICAgICAgICAgICBuZXdWYWw6IGVudHJ5LnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgb2xkVmFsOiBjYXB0dXJlW2VudHJ5LmNlbGwucmVmXSxcclxuICAgICAgICAgICAgICAgIGNhc2NhZGVkOiBlbnRyeS5jYXNjYWRlZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYmF0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFZGl0QWN0aW9uKHNuYXBzaG90czpDZWxsRWRpdFNuYXBzaG90W10pOkhpc3RvcnlBY3Rpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhcHBseTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaWxlbnRDb21taXQoY3JlYXRlX2NoYW5nZXMoc25hcHNob3RzLCB4ID0+IHgubmV3VmFsKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJvbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNpbGVudENvbW1pdChjcmVhdGVfY2hhbmdlcyhzbmFwc2hvdHMsIHggPT4geC5vbGRWYWwpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW52b2tlU2lsZW50Q29tbWl0KGNoYW5nZXM6R3JpZENoYW5nZVNldCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBncmlkLmV4ZWMoJ2NvbW1pdCcsIGNoYW5nZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvbXBpbGVkID0gY2hhbmdlcy5jb21waWxlKGdyaWQubW9kZWwpO1xyXG4gICAgICAgIGxldCByZWZzID0gY29tcGlsZWQuZmlsdGVyKHggPT4gIXguY2FzY2FkZWQpLm1hcCh4ID0+IHguY2VsbC5yZWYpO1xyXG4gICAgICAgIGdyaWQuZXhlYygnc2VsZWN0JywgcmVmcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZV9jaGFuZ2VzKHNuYXBzaG90czpDZWxsRWRpdFNuYXBzaG90W10sIHZhbFNlbGVjdG9yOihzOkNlbGxFZGl0U25hcHNob3QpID0+IHN0cmluZyk6R3JpZENoYW5nZVNldCBcclxue1xyXG4gICAgbGV0IGNoYW5nZVNldCA9IG5ldyBHcmlkQ2hhbmdlU2V0KCk7XHJcbiAgICBmb3IgKGxldCBzIG9mIHNuYXBzaG90cylcclxuICAgIHtcclxuICAgICAgICBjaGFuZ2VTZXQucHV0KHMucmVmLCB2YWxTZWxlY3RvcihzKSwgcy5jYXNjYWRlZCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhbmdlU2V0O1xyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhpc3RvcnlBY3Rpb25cclxue1xyXG4gICAgYXBwbHkoKTp2b2lkO1xyXG5cclxuICAgIHJvbGxiYWNrKCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBIaXN0b3J5TWFuYWdlclxyXG57XHJcbiAgICByZWFkb25seSBmdXR1cmVDb3VudDpudW1iZXI7XHJcblxyXG4gICAgcmVhZG9ubHkgcGFzdENvdW50Om51bWJlcjtcclxuXHJcbiAgICBjbGVhcigpOnZvaWQ7XHJcblxyXG4gICAgcHVzaChhY3Rpb246SGlzdG9yeUFjdGlvbik6dm9pZDtcclxuXHJcbiAgICByZWRvKCk6Ym9vbGVhbjtcclxuXHJcbiAgICB1bmRvKCk6Ym9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERlZmF1bHRIaXN0b3J5TWFuYWdlciBpbXBsZW1lbnRzIEhpc3RvcnlNYW5hZ2VyXHJcbntcclxuICAgIHByaXZhdGUgZnV0dXJlOkhpc3RvcnlBY3Rpb25bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBwYXN0Okhpc3RvcnlBY3Rpb25bXSA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgZnV0dXJlQ291bnQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mdXR1cmUubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgcGFzdENvdW50KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFzdC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGFzdCA9IFtdO1xyXG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHB1c2goYWN0aW9uOkhpc3RvcnlBY3Rpb24pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhc3QucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZG8oKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmZ1dHVyZS5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYWN0aW9uID0gdGhpcy5mdXR1cmUucG9wKCk7XHJcbiAgICAgICAgYWN0aW9uLmFwcGx5KCk7XHJcbiAgICAgICAgdGhpcy5wYXN0LnB1c2goYWN0aW9uKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW5kbygpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMucGFzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYWN0aW9uID0gdGhpcy5wYXN0LnBvcCgpO1xyXG4gICAgICAgIGFjdGlvbi5yb2xsYmFjaygpO1xyXG4gICAgICAgIHRoaXMuZnV0dXJlLnB1c2goYWN0aW9uKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IGNvYWxlc2NlIH0gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUGFkZGluZyBcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBlbXB0eSA9IG5ldyBQYWRkaW5nKDAsIDAsIDAsIDApO1xyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSB0b3A6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJpZ2h0Om51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBib3R0b206bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGxlZnQ6bnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHRvcD86bnVtYmVyLCByaWdodD86bnVtYmVyLCBib3R0b20/Om51bWJlciwgbGVmdD86bnVtYmVyKSBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnRvcCA9IGNvYWxlc2NlKHRvcCwgMCk7XHJcbiAgICAgICAgdGhpcy5yaWdodCA9IGNvYWxlc2NlKHJpZ2h0LCB0aGlzLnRvcCk7XHJcbiAgICAgICAgdGhpcy5ib3R0b20gPSBjb2FsZXNjZShib3R0b20sIHRoaXMudG9wKTtcclxuICAgICAgICB0aGlzLmxlZnQgPSBjb2FsZXNjZShsZWZ0LCB0aGlzLnJpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhvcml6b250YWwoKTpudW1iZXIgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdCArIHRoaXMucmlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB2ZXJ0aWNhbCgpOm51bWJlciBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50b3AgKyB0aGlzLmJvdHRvbTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5mbGF0ZShieTpudW1iZXIpOlBhZGRpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBhZGRpbmcoXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgYnksXHJcbiAgICAgICAgICAgIHRoaXMucmlnaHQgKyBieSxcclxuICAgICAgICAgICAgdGhpcy5ib3R0b20gKyBieSxcclxuICAgICAgICAgICAgdGhpcy5sZWZ0ICsgYnksXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQb2ludExpa2UgXHJcbntcclxuICAgIHg6bnVtYmVyO1xyXG4gICAgeTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEJyb3dzZXJQb2ludCA9IHsgbGVmdDpudW1iZXI7IHRvcDpudW1iZXI7IH07XHJcbmV4cG9ydCB0eXBlIFBvaW50SW5wdXQgPSBudW1iZXJbXXxQb2ludHxQb2ludExpa2V8QnJvd3NlclBvaW50O1xyXG5cclxuZXhwb3J0IGNsYXNzIFBvaW50IGltcGxlbWVudHMgUG9pbnRMaWtlXHJcbntcclxuICAgIHB1YmxpYyByZWFkb25seSB4Om51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgeTpudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcmFkMmRlZzpudW1iZXIgPSAzNjAgLyAoTWF0aC5QSSAqIDIpO1xyXG4gICAgcHVibGljIHN0YXRpYyBkZWcycmFkOm51bWJlciA9IChNYXRoLlBJICogMikgLyAzNjA7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbXB0eSA9IG5ldyBQb2ludCgwLCAwKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgbWF4ID0gbmV3IFBvaW50KDIxNDc0ODM2NDcsIDIxNDc0ODM2NDcpO1xyXG4gICAgcHVibGljIHN0YXRpYyBtaW4gPSBuZXcgUG9pbnQoLTIxNDc0ODM2NDcsIC0yMTQ3NDgzNjQ3KTtcclxuICAgIHB1YmxpYyBzdGF0aWMgdXAgPSBuZXcgUG9pbnQoMCwgLTEpO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXZlcmFnZShwb2ludHM6UG9pbnRMaWtlW10pOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFwb2ludHMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIFBvaW50LmVtcHR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHggPSAwLCB5ID0gMDtcclxuXHJcbiAgICAgICAgcG9pbnRzLmZvckVhY2gocCA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeCArPSBwLng7XHJcbiAgICAgICAgICAgIHkgKz0gcC55O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHggLyBwb2ludHMubGVuZ3RoLCB5IC8gcG9pbnRzLmxlbmd0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBkaXJlY3Rpb24oZnJvbTpQb2ludElucHV0LCB0bzpQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwdEFyZyh0bykuc3VidHJhY3QoZnJvbSkubm9ybWFsaXplKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKHNvdXJjZTpQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwdEFyZyhzb3VyY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbUJ1ZmZlcihidWZmZXI6bnVtYmVyW10sIGluZGV4Om51bWJlciA9IDApOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChidWZmZXJbaW5kZXhdLCBidWZmZXJbaW5kZXggKyAxXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoeDpudW1iZXJ8bnVtYmVyW10sIHk/Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9ICh4WzBdKTtcclxuICAgICAgICAgICAgdGhpcy55ID0gKHhbMV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnggPSAoPG51bWJlcj54KTtcclxuICAgICAgICAgICAgdGhpcy55ID0gKHkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3JlZ2lvbiBHZW9tZXRyeVxyXG5cclxuICAgIHB1YmxpYyBhbmdsZSgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAodGhpcy54IDwgMClcclxuICAgICAgICAgICAgPyAzNjAgLSBNYXRoLmF0YW4yKHRoaXMueCwgLXRoaXMueSkgKiBQb2ludC5yYWQyZGVnICogLTFcclxuICAgICAgICAgICAgOiBNYXRoLmF0YW4yKHRoaXMueCwgLXRoaXMueSkgKiBQb2ludC5yYWQyZGVnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhbmdsZUFib3V0KHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHB0LmNyb3NzKHRoaXMpLCBwdC5kb3QodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcm9zcyh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogcHQueSAtIHRoaXMueSAqIHB0Lng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3RhbmNlKHRvOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHRvKTtcclxuICAgICAgICBsZXQgYSA9IHRoaXMueCAtIHB0Lng7XHJcbiAgICAgICAgbGV0IGIgPSB0aGlzLnkgLSBwdC55O1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRvdCh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogcHQueCArIHRoaXMueSAqIHB0Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxlbmd0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbm9ybWFsaXplKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuICAgICAgICBpZiAobGVuID4gMC4wMDAwMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KDEgLyBsZW4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcGVycCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnkgKiAtMSwgdGhpcy54KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcnBlcnAoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJldmVyc2UoKS5wZXJwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludmVyc2UoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogLTEsIHRoaXMueSAqIC0xKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmV2ZXJzZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiAtMSwgdGhpcy55ICogLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByb3RhdGUocmFkaWFuczpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvcyA9IE1hdGguY29zKHJhZGlhbnMpO1xyXG4gICAgICAgIGxldCBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcclxuICAgICAgICBsZXQgbnggPSB0aGlzLnggKiBjb3MgLSB0aGlzLnkgKiBzaW47XHJcbiAgICAgICAgbGV0IG55ID0gdGhpcy55ICogY29zICsgdGhpcy54ICogc2luO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KG54LCBueSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxuXHJcbiAgICAvL3JlZ2lvbiBBcml0aG1ldGljXHJcblxyXG4gICAgcHVibGljIGFkZCh2YWw6bnVtYmVyfFBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICBpZiAoIXB0KSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdhZGQ6IHB0IHJlcXVpcmVkLic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHB0LngsIHRoaXMueSArIHB0LnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXZpZGUoZGl2aXNvcjpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggLyBkaXZpc29yLCB0aGlzLnkgLyBkaXZpc29yKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbXVsdGlwbHkobXVsdGlwbGVyOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIG11bHRpcGxlciwgdGhpcy55ICogbXVsdGlwbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcm91bmQoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoTWF0aC5yb3VuZCh0aGlzLngpLCBNYXRoLnJvdW5kKHRoaXMueSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdWJ0cmFjdCh2YWw6bnVtYmVyfFBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICBpZiAoIXB0KSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdzdWJ0cmFjdDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChwdC5yZXZlcnNlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGFtcChsb3dlcjpQb2ludCwgdXBwZXI6UG9pbnQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHggPSB0aGlzLng7XHJcbiAgICAgICAgaWYgKHggPCBsb3dlci54KSB4ID0gbG93ZXIueDtcclxuICAgICAgICBpZiAoeCA+IHVwcGVyLngpIHggPSB1cHBlci54O1xyXG5cclxuICAgICAgICBsZXQgeSA9IHRoaXMueTtcclxuICAgICAgICBpZiAoeSA8IGxvd2VyLnkpIHkgPSBsb3dlci55O1xyXG4gICAgICAgIGlmICh5ID4gdXBwZXIueSkgeSA9IHVwcGVyLnk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoeCwgeSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxuXHJcbiAgICAvL3JlZ2lvbiBDb252ZXJzaW9uXHJcblxyXG4gICAgcHVibGljIGNsb25lKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCwgdGhpcy55KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKGFub3RoZXI6UG9pbnRMaWtlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCA9PT0gYW5vdGhlci54ICYmIHRoaXMueSA9PT0gYW5vdGhlci55O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b0FycmF5KCk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55XTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYFske3RoaXMueH0sICR7dGhpcy55fV1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZW5kcmVnaW9uXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHB0QXJnKHZhbDphbnkpOlBvaW50XHJcbntcclxuICAgIGlmICh2YWwgIT09IG51bGwgfHwgdmFsICE9PSB1bmRlZmluZWQpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIFBvaW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIDxQb2ludD52YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2YWwueCAhPT0gdW5kZWZpbmVkICYmIHZhbC55ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbC54LCB2YWwueSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2YWwubGVmdCAhPT0gdW5kZWZpbmVkICYmIHZhbC50b3AgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLmxlZnQsIHZhbC50b3ApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCg8bnVtYmVyW10+dmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnc3RyaW5nJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YodmFsKSA9PT0gJ251bWJlcicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbCwgdmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFBvaW50LmVtcHR5O1xyXG59IiwiaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4vUG9pbnQnO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVjdExpa2Vcclxue1xyXG4gICAgbGVmdDpudW1iZXI7XHJcbiAgICB0b3A6bnVtYmVyO1xyXG4gICAgd2lkdGg6bnVtYmVyO1xyXG4gICAgaGVpZ2h0Om51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJlY3Rcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBlbXB0eTpSZWN0ID0gbmV3IFJlY3QoMCwgMCwgMCwgMCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tRWRnZXMobGVmdDpudW1iZXIsIHRvcDpudW1iZXIsIHJpZ2h0Om51bWJlciwgYm90dG9tOm51bWJlcilcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIGxlZnQsXHJcbiAgICAgICAgICAgIHRvcCxcclxuICAgICAgICAgICAgcmlnaHQgLSBsZWZ0LFxyXG4gICAgICAgICAgICBib3R0b20gLSB0b3BcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbUxpa2UobGlrZTpSZWN0TGlrZSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChsaWtlLmxlZnQsIGxpa2UudG9wLCBsaWtlLndpZHRoLCBsaWtlLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTWFueShyZWN0czpSZWN0W10pOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcG9pbnRzID0gW10uY29uY2F0LmFwcGx5KFtdLCByZWN0cy5tYXAoeCA9PiB4LnBvaW50cygpKSk7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50cyguLi5wb2ludHM6UG9pbnRbXSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21Qb2ludEJ1ZmZlcihwb2ludHM6UG9pbnRbXSwgaW5kZXg/Om51bWJlciwgbGVuZ3RoPzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoMCwgbGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgTWF0aC5taW4oLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC55KSksXHJcbiAgICAgICAgICAgIE1hdGgubWF4KC4uLnBvaW50cy5tYXAocCA9PiBwLngpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueSkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlciA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IobGVmdDpudW1iZXIsIHRvcDpudW1iZXIsIHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHJpZ2h0KClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGJvdHRvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbnRlcigpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQgKyAodGhpcy53aWR0aCAvIDIpLCB0aGlzLnRvcCArICh0aGlzLmhlaWdodCAvIDIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9wTGVmdCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9pbnRzKCk6UG9pbnRbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmZzZXQocHQ6UG9pbnRMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgKyBwdC54LFxyXG4gICAgICAgICAgICB0aGlzLnRvcCArIHB0LnksXHJcbiAgICAgICAgICAgIHRoaXMud2lkdGgsXHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29udGFpbnMoaW5wdXQ6UG9pbnR8UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoaW5wdXRbJ3gnXSAhPT0gdW5kZWZpbmVkICYmIGlucHV0Wyd5J10gIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IDxQb2ludD5pbnB1dDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICBwdC54ID49IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA+PSB0aGlzLnRvcFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueCA8PSB0aGlzLmxlZnQgKyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICAmJiBwdC55IDw9IHRoaXMudG9wICsgdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJlY3QgPSA8UmVjdExpa2U+aW5wdXQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgcmVjdC5sZWZ0ID49IHRoaXMubGVmdCAmJlxyXG4gICAgICAgICAgICAgICAgcmVjdC50b3AgPj0gdGhpcy50b3AgJiZcclxuICAgICAgICAgICAgICAgIHJlY3QubGVmdCArIHJlY3Qud2lkdGggPD0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgcmVjdC50b3AgKyByZWN0LmhlaWdodCA8PSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbmZsYXRlKHNpemU6UG9pbnRMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgLSBzaXplLngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wIC0gc2l6ZS55LFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoICsgc2l6ZS54LFxyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCArIHNpemUueVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludGVyc2VjdHMocmVjdDpSZWN0TGlrZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiByZWN0LmxlZnQgKyByZWN0LndpZHRoID4gdGhpcy5sZWZ0XHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPiB0aGlzLnRvcFxyXG4gICAgICAgICAgICAmJiByZWN0LmxlZnQgPCB0aGlzLmxlZnQgKyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wIDwgdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbm9ybWFsaXplKCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndpZHRoID49IDAgJiYgdGhpcy5oZWlnaHQgPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHggPSB0aGlzLmxlZnQ7XHJcbiAgICAgICAgdmFyIHkgPSB0aGlzLnRvcDtcclxuICAgICAgICB2YXIgdyA9IHRoaXMud2lkdGg7XHJcbiAgICAgICAgdmFyIGggPSB0aGlzLmhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKHcgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeCArPSB3O1xyXG4gICAgICAgICAgICB3ID0gTWF0aC5hYnModyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChoIDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHkgKz0gaDtcclxuICAgICAgICAgICAgaCA9IE1hdGguYWJzKGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy5sZWZ0fSwgJHt0aGlzLnRvcH0sICR7dGhpcy53aWR0aH0sICR7dGhpcy5oZWlnaHR9XWA7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgKiBmcm9tICcuL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uJztcclxuZXhwb3J0ICogZnJvbSAnLi9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuZXhwb3J0ICogZnJvbSAnLi9leHRlbnNpb25zL2NvbW1vbi9DbGlwYm9hcmRFeHRlbnNpb24nO1xyXG5leHBvcnQgKiBmcm9tICcuL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uJztcclxuZXhwb3J0ICogZnJvbSAnLi9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeUV4dGVuc2lvbic7XHJcbmV4cG9ydCAqIGZyb20gJy4vZXh0ZW5zaW9ucy9oaXN0b3J5L0hpc3RvcnlNYW5hZ2VyJztcclxuZXhwb3J0ICogZnJvbSAnLi9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUVuZ2luZSc7XHJcbmV4cG9ydCAqIGZyb20gJy4vZXh0ZW5zaW9ucy9jb21wdXRlL0phdmFTY3JpcHRDb21wdXRlRW5naW5lJztcclxuZXhwb3J0ICogZnJvbSAnLi9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUV4dGVuc2lvbic7XHJcbmV4cG9ydCAqIGZyb20gJy4vZXh0ZW5zaW9ucy9leHRyYS9DbGlja1pvbmVFeHRlbnNpb24nO1xyXG5leHBvcnQgKiBmcm9tICcuL2dlb20vUG9pbnQnO1xyXG5leHBvcnQgKiBmcm9tICcuL2dlb20vUmVjdCc7XHJcbmV4cG9ydCAqIGZyb20gJy4vbWlzYy9CYXNlMjYnO1xyXG5leHBvcnQgKiBmcm9tICcuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuZXhwb3J0ICogZnJvbSAnLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uJztcclxuZXhwb3J0ICogZnJvbSAnLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5leHBvcnQgKiBmcm9tICcuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cnO1xyXG5leHBvcnQgKiBmcm9tICcuL21vZGVsL3N0eWxlZC9TdHlsZSc7XHJcbmV4cG9ydCAqIGZyb20gJy4vbW9kZWwvc3R5bGVkL1N0eWxlZEdyaWRDZWxsJztcclxuZXhwb3J0ICogZnJvbSAnLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5leHBvcnQgKiBmcm9tICcuL21vZGVsL0dyaWRSYW5nZSc7XHJcbmV4cG9ydCAqIGZyb20gJy4vbW9kZWwvR3JpZFJvdyc7XHJcbmV4cG9ydCAqIGZyb20gJy4vbW9kZWwvR3JpZENlbGwnO1xyXG5leHBvcnQgKiBmcm9tICcuL21vZGVsL0dyaWRDb2x1bW4nO1xyXG5leHBvcnQgKiBmcm9tICcuL3VpL0V4dGVuc2liaWxpdHknO1xyXG5leHBvcnQgKiBmcm9tICcuL3VpL0dyaWRFbGVtZW50JztcclxuZXhwb3J0ICogZnJvbSAnLi91aS9HcmlkS2VybmVsJztcclxuZXhwb3J0ICogZnJvbSAnLi91aS9XaWRnZXQnO1xyXG5leHBvcnQgKiBmcm9tICcuL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcblxyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuZXhwb3J0IHsgVGV0aGVyIH07XHJcblxyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi9taXNjL0RvbSc7XHJcbmV4cG9ydCB7IERvbSB9OyIsImltcG9ydCB7IEV2ZW50RW1pdHRlciwgRXZlbnRDYWxsYmFjaywgRXZlbnRTdWJzY3JpcHRpb24gfSBmcm9tICcuLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciBpbXBsZW1lbnRzIEV2ZW50RW1pdHRlclxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHdyYXAodGFyZ2V0OkV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlcik6RXZlbnRFbWl0dGVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCEhdGFyZ2V0WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+dGFyZ2V0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiA8RXZlbnRFbWl0dGVyPnRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhcmdldDpFdmVudFRhcmdldClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjYW5jZWw6ICgpID0+IHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjayksXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW1pdChldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnRhcmdldC5kaXNwYXRjaEV2ZW50KFxyXG4gICAgICAgICAgICBfLmV4dGVuZChuZXcgRXZlbnQoZXZlbnQpLCB7IGFyZ3M6IGFyZ3MgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgS2V5cyB9IGZyb20gJy4vS2V5cyc7XHJcblxyXG5cclxubGV0IFRyYWNrZXI6T2JqZWN0SW5kZXg8Ym9vbGVhbj47XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5Q2hlY2tcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBpbml0KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghVHJhY2tlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFRyYWNrZXIgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IEtleWJvYXJkRXZlbnQpID0+IFRyYWNrZXJbZS5rZXlDb2RlXSA9IHRydWUpO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRvd24oa2V5Om51bWJlcik6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIVRyYWNrZXIgJiYgISFUcmFja2VyW2tleV07XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5RXhwcmVzc2lvblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZyk6S2V5RXhwcmVzc2lvblxyXG4gICAge1xyXG4gICAgICAgIGxldCBleGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChleGNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBrZXlzID0gaW5wdXRcclxuICAgICAgICAgICAgLnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gS2V5cy5wYXJzZSh4KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgS2V5RXhwcmVzc2lvbihrZXlzLCBleGNsdXNpdmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBjdHJsOmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYWx0OmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2hpZnQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBrZXk6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3Ioa2V5czpudW1iZXJbXSwgZXhjbHVzaXZlOmJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5leGNsdXNpdmUgPSBleGNsdXNpdmU7XHJcblxyXG4gICAgICAgIHRoaXMuY3RybCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQ1RSTCk7XHJcbiAgICAgICAgdGhpcy5hbHQgPSBrZXlzLnNvbWUoeCA9PiB4ID09PSBLZXlzLkFMVCk7XHJcbiAgICAgICAgdGhpcy5zaGlmdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuU0hJRlQpO1xyXG4gICAgICAgIHRoaXMua2V5ID0ga2V5cy5maWx0ZXIoeCA9PiB4ICE9PSBLZXlzLkNUUkwgJiYgeCAhPT0gS2V5cy5BTFQgJiYgeCAhPT0gS2V5cy5TSElGVClbMF0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlcyhrZXlEYXRhOktleUV4cHJlc3Npb258S2V5Ym9hcmRFdmVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5RXhwcmVzc2lvbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5Ym9hcmRFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsS2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleUNvZGVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdLZXlFeHByZXNzaW9uLm1hdGNoZXM6IEludmFsaWQgaW5wdXQnO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJCYXNlLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgfSBmcm9tICcuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcic7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgS2V5TWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXlNYXBDYWxsYmFja1xyXG57XHJcbiAgICAoZT86S2V5Ym9hcmRFdmVudCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEtleUlucHV0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZm9yKC4uLmVsbXRzOktleU1hcHBhYmxlW10pOktleUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcnM6c3RyaW5nfHN0cmluZ1tdLCBjYWxsYmFjazpLZXlNYXBDYWxsYmFjayk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhwcnMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oWzxzdHJpbmc+ZXhwcnNdLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCByZSBvZiBleHBycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzcyA9IHRoaXMuZW1pdHRlcnMubWFwKGVlID0+IHRoaXMuY3JlYXRlTGlzdGVuZXIoXHJcbiAgICAgICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgICAgIEtleUV4cHJlc3Npb24ucGFyc2UocmUpLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2spKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3VicyA9IHRoaXMuc3Vicy5jb25jYXQoc3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcihlZTpFdmVudEVtaXR0ZXIsIGtlOktleUV4cHJlc3Npb24sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlZS5vbigna2V5ZG93bicsIChldnQ6S2V5Ym9hcmRFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChrZS5tYXRjaGVzKGV2dCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChrZS5leGNsdXNpdmUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplKGttczpLZXlNYXBwYWJsZVtdKTpFdmVudEVtaXR0ZXJbXVxyXG57XHJcbiAgICByZXR1cm4gPEV2ZW50RW1pdHRlcltdPmttc1xyXG4gICAgICAgIC5tYXAoeCA9PiAoISF4WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAgICAgID8gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+eClcclxuICAgICAgICAgICAgOiB4XHJcbiAgICAgICAgKTtcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEtleXNcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLU1BBQ0UgPSA4O1xyXG4gICAgcHVibGljIHN0YXRpYyBUQUIgPSA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBFTlRFUiA9IDEzO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSElGVCA9IDE2O1xyXG4gICAgcHVibGljIHN0YXRpYyBDVFJMID0gMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEFMVCA9IDE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBQQVVTRSA9IDE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBDQVBTX0xPQ0sgPSAyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVNDQVBFID0gMjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNQQUNFID0gMzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBR0VfVVAgPSAzMztcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9ET1dOID0gMzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVORCA9IDM1O1xyXG4gICAgcHVibGljIHN0YXRpYyBIT01FID0gMzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfQVJST1cgPSAzNztcclxuICAgIHB1YmxpYyBzdGF0aWMgVVBfQVJST1cgPSAzODtcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFRfQVJST1cgPSAzOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRE9XTl9BUlJPVyA9IDQwO1xyXG4gICAgcHVibGljIHN0YXRpYyBJTlNFUlQgPSA0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVMRVRFID0gNDY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8wID0gNDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8xID0gNDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8yID0gNTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8zID0gNTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV80ID0gNTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV81ID0gNTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV82ID0gNTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV83ID0gNTU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV84ID0gNTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV85ID0gNTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9BID0gNjU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9CID0gNjY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9DID0gNjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9EID0gNjg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9FID0gNjk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9GID0gNzA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9HID0gNzE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9IID0gNzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9JID0gNzM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9KID0gNzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9LID0gNzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9MID0gNzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9NID0gNzc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9OID0gNzg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9PID0gNzk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9QID0gODA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9RID0gODE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9SID0gODI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9TID0gODM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9UID0gODQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9VID0gODU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9WID0gODY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9XID0gODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9YID0gODg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9ZID0gODk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9aID0gOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfTUVUQSA9IDkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9NRVRBID0gOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTEVDVCA9IDkzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMCA9IDk2O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMSA9IDk3O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMiA9IDk4O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMyA9IDk5O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNCA9IDEwMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzUgPSAxMDE7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF82ID0gMTAyO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNyA9IDEwMztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzggPSAxMDQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF85ID0gMTA1O1xyXG4gICAgcHVibGljIHN0YXRpYyBNVUxUSVBMWSA9IDEwNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgQUREID0gMTA3O1xyXG4gICAgcHVibGljIHN0YXRpYyBTVUJUUkFDVCA9IDEwOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVDSU1BTCA9IDExMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRElWSURFID0gMTExO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMSA9IDExMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjIgPSAxMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYzID0gMTE0O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNCA9IDExNTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjUgPSAxMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY2ID0gMTE3O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNyA9IDExODtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjggPSAxMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY5ID0gMTIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTAgPSAxMjE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMSA9IDEyMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjEyID0gMTIzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1fTE9DSyA9IDE0NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0NST0xMX0xPQ0sgPSAxNDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTUlDT0xPTiA9IDE4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVFVQUxTID0gMTg3O1xyXG4gICAgcHVibGljIHN0YXRpYyBDT01NQSA9IDE4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgREFTSCA9IDE4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEVSSU9EID0gMTkwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGT1JXQVJEX1NMQVNIID0gMTkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBHUkFWRV9BQ0NFTlQgPSAxOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE9QRU5fQlJBQ0tFVCA9IDIxOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgQkFDS19TTEFTSCA9IDIyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0xPU0VfQlJBQ0tFVCA9IDIyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0lOR0xFX1FVT1RFID0gMjIyO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nLCB0aHJvd25PbkZhaWw6Ym9vbGVhbiA9IHRydWUpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHN3aXRjaCAoaW5wdXQudHJpbSgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS1NQQUNFJzogcmV0dXJuIEtleXMuQkFDS1NQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdUQUInOiByZXR1cm4gS2V5cy5UQUI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0VOVEVSJzogcmV0dXJuIEtleXMuRU5URVI7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NISUZUJzogcmV0dXJuIEtleXMuU0hJRlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NUUkwnOiByZXR1cm4gS2V5cy5DVFJMO1xyXG4gICAgICAgICAgICBjYXNlICdBTFQnOiByZXR1cm4gS2V5cy5BTFQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBVVNFJzogcmV0dXJuIEtleXMuUEFVU0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NBUFNfTE9DSyc6IHJldHVybiBLZXlzLkNBUFNfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnRVNDQVBFJzogcmV0dXJuIEtleXMuRVNDQVBFO1xyXG4gICAgICAgICAgICBjYXNlICdTUEFDRSc6IHJldHVybiBLZXlzLlNQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX1VQJzogcmV0dXJuIEtleXMuUEFHRV9VUDtcclxuICAgICAgICAgICAgY2FzZSAnUEFHRV9ET1dOJzogcmV0dXJuIEtleXMuUEFHRV9ET1dOO1xyXG4gICAgICAgICAgICBjYXNlICdFTkQnOiByZXR1cm4gS2V5cy5FTkQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0hPTUUnOiByZXR1cm4gS2V5cy5IT01FO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX0FSUk9XJzogcmV0dXJuIEtleXMuTEVGVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnVVBfQVJST1cnOiByZXR1cm4gS2V5cy5VUF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfQVJST1cnOiByZXR1cm4gS2V5cy5SSUdIVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnRE9XTl9BUlJPVyc6IHJldHVybiBLZXlzLkRPV05fQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0lOU0VSVCc6IHJldHVybiBLZXlzLklOU0VSVDtcclxuICAgICAgICAgICAgY2FzZSAnREVMRVRFJzogcmV0dXJuIEtleXMuREVMRVRFO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMCc6IHJldHVybiBLZXlzLktFWV8wO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMyc6IHJldHVybiBLZXlzLktFWV8zO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNic6IHJldHVybiBLZXlzLktFWV82O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOSc6IHJldHVybiBLZXlzLktFWV85O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQyc6IHJldHVybiBLZXlzLktFWV9DO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRic6IHJldHVybiBLZXlzLktFWV9GO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSSc6IHJldHVybiBLZXlzLktFWV9JO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTCc6IHJldHVybiBLZXlzLktFWV9MO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTyc6IHJldHVybiBLZXlzLktFWV9PO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUic6IHJldHVybiBLZXlzLktFWV9SO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVSc6IHJldHVybiBLZXlzLktFWV9VO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWCc6IHJldHVybiBLZXlzLktFWV9YO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICcwJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJzEnOiByZXR1cm4gS2V5cy5LRVlfMTtcclxuICAgICAgICAgICAgY2FzZSAnMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICczJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJzQnOiByZXR1cm4gS2V5cy5LRVlfNDtcclxuICAgICAgICAgICAgY2FzZSAnNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICc2JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJzcnOiByZXR1cm4gS2V5cy5LRVlfNztcclxuICAgICAgICAgICAgY2FzZSAnOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICc5JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0EnOiByZXR1cm4gS2V5cy5LRVlfQTtcclxuICAgICAgICAgICAgY2FzZSAnQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdDJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0QnOiByZXR1cm4gS2V5cy5LRVlfRDtcclxuICAgICAgICAgICAgY2FzZSAnRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdGJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0cnOiByZXR1cm4gS2V5cy5LRVlfRztcclxuICAgICAgICAgICAgY2FzZSAnSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdJJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0onOiByZXR1cm4gS2V5cy5LRVlfSjtcclxuICAgICAgICAgICAgY2FzZSAnSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdMJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ00nOiByZXR1cm4gS2V5cy5LRVlfTTtcclxuICAgICAgICAgICAgY2FzZSAnTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdPJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ1AnOiByZXR1cm4gS2V5cy5LRVlfUDtcclxuICAgICAgICAgICAgY2FzZSAnUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdSJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ1MnOiByZXR1cm4gS2V5cy5LRVlfUztcclxuICAgICAgICAgICAgY2FzZSAnVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdVJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1YnOiByZXR1cm4gS2V5cy5LRVlfVjtcclxuICAgICAgICAgICAgY2FzZSAnVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdYJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1knOiByZXR1cm4gS2V5cy5LRVlfWTtcclxuICAgICAgICAgICAgY2FzZSAnWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX01FVEEnOiByZXR1cm4gS2V5cy5MRUZUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1JJR0hUX01FVEEnOiByZXR1cm4gS2V5cy5SSUdIVF9NRVRBO1xyXG4gICAgICAgICAgICBjYXNlICdTRUxFQ1QnOiByZXR1cm4gS2V5cy5TRUxFQ1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8wJzogcmV0dXJuIEtleXMuTlVNUEFEXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8xJzogcmV0dXJuIEtleXMuTlVNUEFEXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8yJzogcmV0dXJuIEtleXMuTlVNUEFEXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8zJzogcmV0dXJuIEtleXMuTlVNUEFEXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF80JzogcmV0dXJuIEtleXMuTlVNUEFEXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF81JzogcmV0dXJuIEtleXMuTlVNUEFEXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF82JzogcmV0dXJuIEtleXMuTlVNUEFEXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF83JzogcmV0dXJuIEtleXMuTlVNUEFEXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF84JzogcmV0dXJuIEtleXMuTlVNUEFEXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF85JzogcmV0dXJuIEtleXMuTlVNUEFEXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ01VTFRJUExZJzogcmV0dXJuIEtleXMuTVVMVElQTFk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FERCc6IHJldHVybiBLZXlzLkFERDtcclxuICAgICAgICAgICAgY2FzZSAnU1VCVFJBQ1QnOiByZXR1cm4gS2V5cy5TVUJUUkFDVDtcclxuICAgICAgICAgICAgY2FzZSAnREVDSU1BTCc6IHJldHVybiBLZXlzLkRFQ0lNQUw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RJVklERSc6IHJldHVybiBLZXlzLkRJVklERTtcclxuICAgICAgICAgICAgY2FzZSAnRjEnOiByZXR1cm4gS2V5cy5GMTtcclxuICAgICAgICAgICAgY2FzZSAnRjInOiByZXR1cm4gS2V5cy5GMjtcclxuICAgICAgICAgICAgY2FzZSAnRjMnOiByZXR1cm4gS2V5cy5GMztcclxuICAgICAgICAgICAgY2FzZSAnRjQnOiByZXR1cm4gS2V5cy5GNDtcclxuICAgICAgICAgICAgY2FzZSAnRjUnOiByZXR1cm4gS2V5cy5GNTtcclxuICAgICAgICAgICAgY2FzZSAnRjYnOiByZXR1cm4gS2V5cy5GNjtcclxuICAgICAgICAgICAgY2FzZSAnRjcnOiByZXR1cm4gS2V5cy5GNztcclxuICAgICAgICAgICAgY2FzZSAnRjgnOiByZXR1cm4gS2V5cy5GODtcclxuICAgICAgICAgICAgY2FzZSAnRjknOiByZXR1cm4gS2V5cy5GOTtcclxuICAgICAgICAgICAgY2FzZSAnRjEwJzogcmV0dXJuIEtleXMuRjEwO1xyXG4gICAgICAgICAgICBjYXNlICdGMTEnOiByZXR1cm4gS2V5cy5GMTE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMic6IHJldHVybiBLZXlzLkYxMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNX0xPQ0snOiByZXR1cm4gS2V5cy5OVU1fTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0NST0xMX0xPQ0snOiByZXR1cm4gS2V5cy5TQ1JPTExfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0VNSUNPTE9OJzogcmV0dXJuIEtleXMuU0VNSUNPTE9OO1xyXG4gICAgICAgICAgICBjYXNlICdFUVVBTFMnOiByZXR1cm4gS2V5cy5FUVVBTFM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NPTU1BJzogcmV0dXJuIEtleXMuQ09NTUE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RBU0gnOiByZXR1cm4gS2V5cy5EQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdQRVJJT0QnOiByZXR1cm4gS2V5cy5QRVJJT0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0ZPUldBUkRfU0xBU0gnOiByZXR1cm4gS2V5cy5GT1JXQVJEX1NMQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdHUkFWRV9BQ0NFTlQnOiByZXR1cm4gS2V5cy5HUkFWRV9BQ0NFTlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ09QRU5fQlJBQ0tFVCc6IHJldHVybiBLZXlzLk9QRU5fQlJBQ0tFVDtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS19TTEFTSCc6IHJldHVybiBLZXlzLkJBQ0tfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NMT1NFX0JSQUNLRVQnOiByZXR1cm4gS2V5cy5DTE9TRV9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdTSU5HTEVfUVVPVEUnOiByZXR1cm4gS2V5cy5TSU5HTEVfUVVPVEU7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhyb3duT25GYWlsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIGtleTogJyArIGlucHV0O1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi9Nb3VzZURyYWdFdmVudCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNoZWNrKGVsbXQ6SFRNTEVsZW1lbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9PT0gJ3RydWUnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKGVsbXQ6SFRNTEVsZW1lbnQpOk1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG4gICAge1xyXG4gICAgICAgIGVsbXQuZGF0YXNldFsnTW91c2VEcmFnRXZlbnRTdXBwb3J0J10gPSAndHJ1ZSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZURyYWdFdmVudFN1cHBvcnQoZWxtdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHNob3VsZERyYWc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIGlzRHJhZ2dpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIHN0YXJ0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgbGFzdFBvaW50OlBvaW50O1xyXG4gICAgcHJvdGVjdGVkIGNhbmNlbDooKSA9PiB2b2lkO1xyXG4gICAgcHJvdGVjdGVkIGxpc3RlbmVyOmFueTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocHJvdGVjdGVkIGVsbXQ6SFRNTEVsZW1lbnQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIgPSB0aGlzLm9uVGFyZ2V0TW91c2VEb3duLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZWxtdC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmxpc3RlbmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25UYXJnZXRNb3VzZURvd24oZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgbGV0IG1vdmVIYW5kbGVyID0gdGhpcy5vbldpbmRvd01vdXNlTW92ZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGxldCB1cEhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VVcC5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbmNlbCA9ICgpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgbmV3UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zaG91bGREcmFnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdiZWdpbicsIGUpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnJywgZSwgbmV3UG9pbnQuc3VidHJhY3QodGhpcy5sYXN0UG9pbnQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3UG9pbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VVcChlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdlbmQnLCBlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmxhc3RQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNhbmNlbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRXZlbnQodHlwZTpzdHJpbmcsIHNvdXJjZTpNb3VzZUV2ZW50LCBkaXN0PzpQb2ludCk6TW91c2VEcmFnRXZlbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgZXZlbnQgPSA8TW91c2VEcmFnRXZlbnQ+KG5ldyBNb3VzZUV2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WCA9IHRoaXMuc3RhcnRQb2ludC54O1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WSA9IHRoaXMuc3RhcnRQb2ludC55O1xyXG5cclxuICAgICAgICBpZiAoZGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RYID0gZGlzdC54O1xyXG4gICAgICAgICAgICBldmVudC5kaXN0WSA9IGRpc3QueTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTW91c2VFdmVudFR5cGUgPSAnY2xpY2snfCdkYmxjbGljayd8J21vdXNlZG93bid8J21vdXNlbW92ZSd8J21vdXNldXAnfCdkcmFnYmVnaW4nfCdkcmFnJ3wnZHJhZ2VuZCdcclxuXHJcbmZ1bmN0aW9uIHBhcnNlX2V2ZW50KHZhbHVlOnN0cmluZyk6TW91c2VFdmVudFR5cGVcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgICAgIHJldHVybiA8TW91c2VFdmVudFR5cGU+KCdtb3VzZScgKyB2YWx1ZSk7XHJcbiAgICAgICAgY2FzZSAnY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2RibGNsaWNrJzpcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgY2FzZSAnZHJhZ2JlZ2luJzpcclxuICAgICAgICBjYXNlICdkcmFnJzpcclxuICAgICAgICBjYXNlICdkcmFnZW5kJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxNb3VzZUV2ZW50VHlwZT52YWx1ZTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBNb3VzZUV2ZW50VHlwZTogJyArIHZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZV9idXR0b24odmFsdWU6c3RyaW5nKTpudW1iZXJcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdwcmltYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24xJzpcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgY2FzZSAnc2Vjb25kYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24yJzpcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMyc6XHJcbiAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlQnV0dG9uOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpdmlkZV9leHByZXNzaW9uKHZhbHVlOnN0cmluZyk6c3RyaW5nW11cclxue1xyXG4gICAgbGV0IHBhcnRzID0gdmFsdWUuc3BsaXQoJzonKTtcclxuXHJcbiAgICBpZiAocGFydHMubGVuZ3RoID09IDEpXHJcbiAgICB7XHJcbiAgICAgICAgcGFydHMuc3BsaWNlKDAsIDAsICdkb3duJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnRzLnNsaWNlKDAsIDIpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpNb3VzZUV4cHJlc3Npb25cclxuICAgIHtcclxuICAgICAgICBsZXQgY2ZnID0gPGFueT57XHJcbiAgICAgICAgICAgIGtleXM6IFtdLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNmZy5leGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChjZmcuZXhjbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHIoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgW2xlZnQsIHJpZ2h0XSA9IGRpdmlkZV9leHByZXNzaW9uKGlucHV0KTtcclxuXHJcbiAgICAgICAgY2ZnLmV2ZW50ID0gcGFyc2VfZXZlbnQobGVmdCk7XHJcblxyXG4gICAgICAgIHJpZ2h0LnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBLZXlzLnBhcnNlKHgsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5idXR0b24gPSBwYXJzZV9idXR0b24oeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRXhwcmVzc2lvbihjZmcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBldmVudDpNb3VzZUV2ZW50VHlwZSA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnV0dG9uOm51bWJlciA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5czpudW1iZXJbXSA9IFtdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihjZmc6YW55KVxyXG4gICAge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIGNmZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hdGNoZXMobW91c2VEYXRhOk1vdXNlRXZlbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ldmVudCAhPT0gbW91c2VEYXRhLnR5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYnV0dG9uICE9PSBudWxsICYmIHRoaXMuYnV0dG9uICE9PSBtb3VzZURhdGEuYnV0dG9uKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGsgb2YgdGhpcy5rZXlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFLZXlDaGVjay5kb3duKGspKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuaW1wb3J0IHsgTW91c2VFeHByZXNzaW9uIH0gZnJvbSAnLi9Nb3VzZUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50U3VwcG9ydCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNb3VzZUNhbGxiYWNrXHJcbntcclxuICAgIChlOkV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VJbnB1dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGZvciguLi5lbG10czpNYXBwYWJsZVtdKTpNb3VzZUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgS2V5Q2hlY2suaW5pdCgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcjpzdHJpbmcsIGNhbGxiYWNrOk1vdXNlQ2FsbGJhY2spOk1vdXNlSW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgc3MgPSB0aGlzLmVtaXR0ZXJzLm1hcChlZSA9PiB0aGlzLmNyZWF0ZUxpc3RlbmVyKFxyXG4gICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgTW91c2VFeHByZXNzaW9uLnBhcnNlKGV4cHIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICB0aGlzLnN1YnMgPSB0aGlzLnN1YnMuY29uY2F0KHNzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcih0YXJnZXQ6RXZlbnRFbWl0dGVyLCBleHByOk1vdXNlRXhwcmVzc2lvbiwgY2FsbGJhY2s6TW91c2VDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0Lm9uKGV4cHIuZXZlbnQsIChldnQ6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChleHByLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4cHIuZXhjbHVzaXZlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZShrbXM6TWFwcGFibGVbXSk6RXZlbnRFbWl0dGVyW11cclxue1xyXG4gICAgcmV0dXJuIDxFdmVudEVtaXR0ZXJbXT5rbXNcclxuICAgICAgICAubWFwKHggPT4gKCEheFsnYWRkRXZlbnRMaXN0ZW5lciddKVxyXG4gICAgICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoPEV2ZW50VGFyZ2V0PngpXHJcbiAgICAgICAgICAgIDogeFxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbiIsImltcG9ydCAqIGFzIGJhc2VzIGZyb20gJ2Jhc2VzJztcclxuXHJcblxyXG5jb25zdCBBbHBoYTI2ID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlMjZcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBudW0obnVtOm51bWJlcik6QmFzZTI2IFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmFzZTI2KG51bSwgYmFzZXMudG9BbHBoYWJldChudW0sIEFscGhhMjYpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHN0cihzdHI6c3RyaW5nKTpCYXNlMjYgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCYXNlMjYoYmFzZXMuZnJvbUFscGhhYmV0KHN0ci50b1VwcGVyQ2FzZSgpLCBBbHBoYTI2KSwgc3RyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbnVtOm51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzdHI6c3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IobnVtOm51bWJlciwgc3RyOnN0cmluZykgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5udW0gPSBudW07XHJcbiAgICAgICAgdGhpcy5zdHIgPSBzdHI7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShodG1sOnN0cmluZyk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgbGV0IGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICBsZXQgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcclxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoYm9keSk7XHJcbiAgICBib2R5LmlubmVySFRNTCA9IGh0bWw7XHJcblxyXG4gICAgcmV0dXJuIDxIVE1MRWxlbWVudD5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3NzKGU6SFRNTEVsZW1lbnQsIHN0eWxlczpPYmplY3RNYXA8c3RyaW5nPik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpXHJcbiAgICB7XHJcbiAgICAgICAgZS5zdHlsZVtwcm9wXSA9IHN0eWxlc1twcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpdChlOkhUTUxFbGVtZW50LCB0YXJnZXQ6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwge1xyXG4gICAgICAgIHdpZHRoOiB0YXJnZXQuY2xpZW50V2lkdGggKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCcsXHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhpZGUoZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdub25lJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3coZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdibG9jaycgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGUoZTpIVE1MRWxlbWVudCwgdmlzaWJsZTpib29sZWFuKTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gdmlzaWJsZSA/IHNob3coZSkgOiBoaWRlKGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlVHJhbnNpdGlvbihlOkhUTUxFbGVtZW50LCBwcm9wOnN0cmluZywgbWlsbGlzOm51bWJlciwgZWFzZTpzdHJpbmcgPSAnbGluZWFyJyk6dm9pZFxyXG57XHJcbiAgICBlLnN0eWxlLnRyYW5zaXRpb24gPSBgJHtwcm9wfSAke21pbGxpc31tcyAke2Vhc2V9YDtcclxuICAgIGNvbnNvbGUubG9nKGUuc3R5bGUudHJhbnNpdGlvbik7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IGUuc3R5bGUudHJhbnNpdGlvbiA9ICcnLCBtaWxsaXMpO1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBQcm9wZXJ0eUNoYW5nZWRDYWxsYmFja1xyXG57XHJcbiAgICAob2JqOmFueSwgdmFsOmFueSk6dm9pZFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkoZGVmYXVsdFZhbHVlOmFueSwgZmlsdGVyOlByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnksIHByb3BOYW1lOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBwcm9wTmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IHRoaXNbJ19fJyArIHByb3BOYW1lXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsID09PSB1bmRlZmluZWQpID8gZGVmYXVsdFZhbHVlIDogdmFsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcE5hbWVdID0gbmV3VmFsO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHRoaXMsIG5ld1ZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsIlxyXG5cclxubGV0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKTtcclxubGV0IGNvdW50ID0gMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWZHZW5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBuZXh0KHByZWZpeDpzdHJpbmcgPSAnQycpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwcmVmaXggKyBzdGFydCArICctJyArIChjb3VudCsrKTtcclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb2FsZXNjZTxUPiguLi5pbnB1dHM6VFtdKTpUXHJcbntcclxuICAgIGZvciAobGV0IHggb2YgaW5wdXRzKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh4ICE9PSB1bmRlZmluZWQgJiYgeCAhPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKHRhcmdldDphbnksIGRhdGE6YW55KTphbnlcclxue1xyXG4gICAgZm9yIChsZXQgayBpbiBkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIHRhcmdldFtrXSA9IGRhdGFba107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4PFQ+KGFycjpUW10sIGluZGV4ZXI6KHRtOlQpID0+IG51bWJlcnxzdHJpbmcpOk9iamVjdE1hcDxUPlxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgdG0gb2YgYXJyKVxyXG4gICAge1xyXG4gICAgICAgIG9ialtpbmRleGVyKHRtKV0gPSB0bTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbjxUPihhYTphbnkpOlRbXSBcclxue1xyXG4gICAgbGV0IGEgPSBbXSBhcyBhbnk7XHJcbiAgICBmb3IgKGxldCB0bSBvZiBhYSkgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodG0pKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGEgPSBhLmNvbmNhdChmbGF0dGVuKHRtKSk7XHJcbiAgICAgICAgfSBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYS5wdXNoKHRtKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhIGFzIFRbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGtleXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpzdHJpbmdbXVxyXG57XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaXgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsdWVzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6VFtdXHJcbntcclxuICAgIGxldCBhOlRbXSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGsgaW4gaXgpXHJcbiAgICB7XHJcbiAgICAgICAgYS5wdXNoKGl4W2tdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHppcFBhaXJzKHBhaXJzOmFueVtdW10pOmFueVxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgcGFpciBvZiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBvYmpbcGFpclswXV0gPSBwYWlyWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bnppcFBhaXJzKHBhaXJzOmFueSk6YW55W11bXVxyXG57XHJcbiAgICBsZXQgYXJyID0gW107XHJcblxyXG4gICAgZm9yIChsZXQga2V5IGluIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIGFyci5wdXNoKFtrZXksIHBhaXJzW2tleV1dKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXJyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4PFQ+KGFycjpUW10sIHNlbGVjdG9yOih0OlQpID0+IG51bWJlcik6VFxyXG57XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBsZXQgdCA9IGFyclswXTtcclxuXHJcbiAgICBmb3IgKGxldCB4IG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBpZiAoc2VsZWN0b3IodCkgPCBzZWxlY3Rvcih4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHQgPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRvd0Nsb25lKHRhcmdldDphbnkpOmFueVxyXG57XHJcbiAgICBpZiAodHlwZW9mKHRhcmdldCkgPT09ICdvYmplY3QnKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzYyA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0YXJnZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzY1twcm9wXSA9IHNoYWRvd0Nsb25lKHRhcmdldFtwcm9wXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2M7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufSIsImltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uL21pc2MvQmFzZTI2JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZXNjcmliZXMgYSByZXNvbHZlRXhwciBvZiBncmlkIGNlbGxzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdyaWRSYW5nZVxyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBuZXcgR3JpZFJhbmdlIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSBjZWxscyB3aXRoIHRoZSBzcGVjaWZpZWQgcmVmcyBmcm9tIHRoZVxyXG4gICAgICogc3BlY2lmaWVkIG1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBtb2RlbFxyXG4gICAgICogQHBhcmFtIGNlbGxSZWZzXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKG1vZGVsOkdyaWRNb2RlbCwgY2VsbFJlZnM6c3RyaW5nW10pOkdyaWRSYW5nZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsb29rdXAgPSBfLmluZGV4KGNlbGxSZWZzLCB4ID0+IHgpO1xyXG5cclxuICAgICAgICBsZXQgY2VsbHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCBsYyA9IE51bWJlci5NQVhfVkFMVUUsIGxyID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuICAgICAgICBsZXQgaGMgPSBOdW1iZXIuTUlOX1ZBTFVFLCBociA9IE51bWJlci5NSU5fVkFMVUU7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgbW9kZWwuY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWxvb2t1cFtjLnJlZl0pXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGNlbGxzLnB1c2goYyk7XHJcblxyXG4gICAgICAgICAgICBpZiAobGMgPiBjLmNvbFJlZikgbGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGhjIDwgYy5jb2xSZWYpIGhjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChsciA+IGMucm93UmVmKSBsciA9IGMucm93UmVmO1xyXG4gICAgICAgICAgICBpZiAoaHIgPCBjLnJvd1JlZikgaHIgPSBjLnJvd1JlZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBsdHIgPSBjZWxscy5zb3J0KGx0cl9zb3J0KTtcclxuICAgICAgICBsZXQgdHRiID0gY2VsbHMuc2xpY2UoMCkuc29ydCh0dGJfc29ydCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgR3JpZFJhbmdlKHtcclxuICAgICAgICAgICAgbHRyOiBsdHIsXHJcbiAgICAgICAgICAgIHR0YjogdHRiLFxyXG4gICAgICAgICAgICB3aWR0aDogaGMgLSBsYyxcclxuICAgICAgICAgICAgaGVpZ2h0OiBociAtIGxyLFxyXG4gICAgICAgICAgICBsZW5ndGg6IChoYyAtIGxjKSAqIChociAtIGxyKSxcclxuICAgICAgICAgICAgY291bnQ6IGNlbGxzLmxlbmd0aCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhcHR1cmVzIGEgcmFuZ2Ugb2YgY2VsbHMgZnJvbSB0aGUgc3BlY2lmaWVkIG1vZGVsIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgdmVjdG9ycy4gIFRoZSB2ZWN0b3JzIHNob3VsZCBiZVxyXG4gICAgICogdHdvIHBvaW50cyBpbiBncmlkIGNvb3JkaW5hdGVzIChlLmcuIGNvbCBhbmQgcm93IHJlZmVyZW5jZXMpIHRoYXQgZHJhdyBhIGxvZ2ljYWwgbGluZSBhY3Jvc3MgdGhlIGdyaWQuXHJcbiAgICAgKiBBbnkgY2VsbHMgZmFsbGluZyBpbnRvIHRoZSByZWN0YW5nbGUgY3JlYXRlZCBmcm9tIHRoZXNlIHR3byBwb2ludHMgd2lsbCBiZSBpbmNsdWRlZCBpbiB0aGUgc2VsZWN0ZWQgcmVzb2x2ZUV4cHIuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gZnJvbVxyXG4gICAgICogQHBhcmFtIHRvXHJcbiAgICAgKiBAcGFyYW0gdG9JbmNsdXNpdmVcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjYXB0dXJlKG1vZGVsOkdyaWRNb2RlbCwgZnJvbTpQb2ludCwgdG86UG9pbnQsIHRvSW5jbHVzaXZlOmJvb2xlYW4gPSBmYWxzZSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgLy9UT0RPOiBFeHBsYWluIHRoaXMuLi5cclxuICAgICAgICBsZXQgdGwgPSBuZXcgUG9pbnQoZnJvbS54IDwgdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA8IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuICAgICAgICBsZXQgYnIgPSBuZXcgUG9pbnQoZnJvbS54ID4gdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA+IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuXHJcbiAgICAgICAgaWYgKHRvSW5jbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnIgPSBici5hZGQoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGltcyA9IFJlY3QuZnJvbVBvaW50cyh0bCwgYnIpO1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gW10gYXMgR3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgciA9IGRpbXMudG9wOyByIDwgZGltcy5ib3R0b207IHIrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGMgPSBkaW1zLmxlZnQ7IGMgPCBkaW1zLnJpZ2h0OyBjKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gbW9kZWwubG9jYXRlQ2VsbChjLCByKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjZWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIEdyaWRSYW5nZS5jcmVhdGVJbnRlcm5hbChtb2RlbCwgcmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogU2VsZWN0cyBhIHJhbmdlIG9mIGNlbGxzIHVzaW5nIGFuIEV4Y2VsLWxpa2UgcmFuZ2UgZXhwcmVzc2lvbi4gRm9yIGV4YW1wbGU6XHJcbiAgICAgKiAtIEExIHNlbGVjdHMgYSAxeDEgcmFuZ2Ugb2YgdGhlIGZpcnN0IGNlbGxcclxuICAgICAqIC0gQTE6QTUgc2VsZWN0cyBhIDF4NSByYW5nZSBmcm9tIHRoZSBmaXJzdCBjZWxsIGhvcml6b250YWxseS5cclxuICAgICAqIC0gQTE6RTUgc2VsZWN0cyBhIDV4NSByYW5nZSBmcm9tIHRoZSBmaXJzdCBjZWxsIGV2ZW5seS5cclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gcXVlcnlcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBzZWxlY3QobW9kZWw6R3JpZE1vZGVsLCBxdWVyeTpzdHJpbmcpOkdyaWRSYW5nZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBbZnJvbSwgdG9dID0gcXVlcnkuc3BsaXQoJzonKTtcclxuICAgICAgICBsZXQgZnJvbUNlbGwgPSByZXNvbHZlX2V4cHJfcmVmKG1vZGVsLCBmcm9tKTtcclxuXHJcbiAgICAgICAgaWYgKCF0bylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghIWZyb21DZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZUludGVybmFsKG1vZGVsLCBbZnJvbUNlbGxdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdG9DZWxsID0gcmVzb2x2ZV9leHByX3JlZihtb2RlbCwgdG8pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwgJiYgISF0b0NlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBmcm9tVmVjdG9yID0gbmV3IFBvaW50KGZyb21DZWxsLmNvbFJlZiwgZnJvbUNlbGwucm93UmVmKTtcclxuICAgICAgICAgICAgICAgIGxldCB0b1ZlY3RvciA9IG5ldyBQb2ludCh0b0NlbGwuY29sUmVmLCB0b0NlbGwucm93UmVmKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY2FwdHVyZShtb2RlbCwgZnJvbVZlY3RvciwgdG9WZWN0b3IsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmVtcHR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IEdyaWRSYW5nZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5KCk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IFtdLFxyXG4gICAgICAgICAgICB0dGI6IFtdLFxyXG4gICAgICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICBsZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIGNvdW50OiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUludGVybmFsKG1vZGVsOkdyaWRNb2RlbCwgY2VsbHM6R3JpZENlbGxbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0cjpHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCB0dGI6R3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgaWYgKGNlbGxzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsdHIgPSBjZWxscy5zb3J0KGx0cl9zb3J0KTtcclxuICAgICAgICAgICAgdHRiID0gY2VsbHMuc2xpY2UoMCkuc29ydCh0dGJfc29ydCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGx0ciA9IHR0YiA9IGNlbGxzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gbGVmdCB0byByaWdodC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGx0cjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gdG9wIHRvIGJvdHRvbS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCB3aWR0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgaW4gY29sdW1ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdpdGggaGVpZ2h0IG9mIHRoZSByZXNvbHZlRXhwciBpbiByb3dzLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByICh3aWxsIGJlIGRpZmZlcmVudCB0byBsZW5ndGggaWYgc29tZSBjZWxsIHNsb3RzIGNvbnRhaW4gbm8gY2VsbHMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY291bnQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGxlbmd0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgKG51bWJlciBvZiByb3dzICogbnVtYmVyIG9mIGNvbHVtbnMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVuZ3RoOm51bWJlcjtcclxuXHJcbiAgICBwcml2YXRlIGluZGV4Ok9iamVjdE1hcDxHcmlkQ2VsbD47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcih2YWx1ZXM6YW55KVxyXG4gICAge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIHZhbHVlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgd2hldGhlciBvciBub3QgYSBjZWxsIGlzIGluY2x1ZGVkIGluIHRoZSByYW5nZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGNvbnRhaW5zKGNlbGxSZWY6c3RyaW5nKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IF8uaW5kZXgodGhpcy5sdHIsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICEhdGhpcy5pbmRleFtjZWxsUmVmXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSByZWZlcmVuY2VzIGZvciBhbGwgdGhlIGNlbGxzIGluIHRoZSByYW5nZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlZnMoKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmx0ci5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGx0cl9zb3J0KGE6R3JpZENlbGwsIGI6R3JpZENlbGwpOm51bWJlclxyXG57XHJcbiAgICBsZXQgbiA9IDA7XHJcblxyXG4gICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICBpZiAobiA9PT0gMClcclxuICAgIHtcclxuICAgICAgICBuID0gYS5jb2xSZWYgLSBiLmNvbFJlZjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbjtcclxufVxyXG5cclxuZnVuY3Rpb24gdHRiX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5jb2xSZWYgLSBiLmNvbFJlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLnJvd1JlZiAtIGIucm93UmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlX2V4cHJfcmVmKG1vZGVsOkdyaWRNb2RlbCwgdmFsdWU6c3RyaW5nKTpHcmlkQ2VsbFxyXG57XHJcbiAgICBjb25zdCBSZWZDb252ZXJ0ID0gLyhbQS1aYS16XSspKFswLTldKykvZztcclxuXHJcbiAgICBSZWZDb252ZXJ0Lmxhc3RJbmRleCA9IDA7XHJcbiAgICBsZXQgcmVzdWx0ID0gUmVmQ29udmVydC5leGVjKHZhbHVlKTtcclxuXHJcbiAgICBsZXQgY29sUmVmID0gQmFzZTI2LnN0cihyZXN1bHRbMV0pLm51bTtcclxuICAgIGxldCByb3dSZWYgPSBwYXJzZUludChyZXN1bHRbMl0pIC0gMTtcclxuXHJcbiAgICByZXR1cm4gbW9kZWwubG9jYXRlQ2VsbChjb2xSZWYsIHJvd1JlZik7XHJcbn0iLCJpbXBvcnQgeyBSZWZHZW4gfSBmcm9tICcuLi8uLi9taXNjL1JlZkdlbic7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vR3JpZENlbGwnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZSwgcmVuZGVyZXIgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IERlZmF1bHRHcmlkQ2VsbCBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdEdyaWRDZWxsUGFyYW1zXHJcbntcclxuICAgIGNvbFJlZjpudW1iZXI7XHJcbiAgICByb3dSZWY6bnVtYmVyO1xyXG4gICAgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVmPzpzdHJpbmc7XHJcbiAgICBjb2xTcGFuPzpudW1iZXI7XHJcbiAgICByb3dTcGFuPzpudW1iZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDZWxsLlxyXG4gKi9cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENlbGwgaW1wbGVtZW50cyBHcmlkQ2VsbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjZWxsIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJlZjpzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSB0aGF0IGRlc2NyaWJlcyB0aGUgaG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFJlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2xTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSByb3cgcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSB2ZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1JlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB2YWx1ZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHZhbHVlOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkQ2VsbC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHBhcmFtczpEZWZhdWx0R3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgcGFyYW1zLnJlZiA9IHBhcmFtcy5yZWYgfHwgUmVmR2VuLm5leHQoKTtcclxuICAgICAgICBwYXJhbXMuY29sU3BhbiA9IHBhcmFtcy5jb2xTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnJvd1NwYW4gPSBwYXJhbXMucm93U3BhbiB8fCAxO1xyXG4gICAgICAgIHBhcmFtcy52YWx1ZSA9IChwYXJhbXMudmFsdWUgPT09IHVuZGVmaW5lZCB8fCBwYXJhbXMudmFsdWUgPT09IG51bGwpID8gJycgOiBwYXJhbXMudmFsdWU7XHJcblxyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIHBhcmFtcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXcoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZFxyXG57XHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgZ2Z4LmZpbGxSZWN0KC1hdiwgLWF2LCB2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG5cclxuICAgIGdmeC5zdHJva2VTdHlsZSA9ICdsaWdodGdyYXknO1xyXG4gICAgZ2Z4LnN0cm9rZVJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICBnZngudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgICBnZnguZm9udCA9IGAxM3B4IFNhbnMtU2VyaWZgO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHZpc3VhbC52YWx1ZSwgMywgMCArICh2aXN1YWwuaGVpZ2h0IC8gMikpO1xyXG59IiwiaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uL0dyaWRDb2x1bW4nO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDb2x1bW4uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRDb2x1bW4gaW1wbGVtZW50cyBHcmlkQ29sdW1uXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbHVtbiByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuICBVc2VkIHRvIGluZGljYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGVcclxuICAgICAqIGNvbHVtbiB3aXRoaW4gdGhlIGdyaWQgYmFzZWQgb24gYSB6ZXJvLWluZGV4LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDb2x1bW4uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICogQHBhcmFtIHdpZHRoXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHJlZjpudW1iZXIsIHdpZHRoOm51bWJlciA9IDEwMClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9HcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJ1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwgfSBmcm9tICcuL0RlZmF1bHRHcmlkQ2VsbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZE1vZGVsLiAgQWxsIGluc3BlY3Rpb24gbWV0aG9kcyB1c2UgTygxKSBpbXBsZW1lbnRhdGlvbnMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRNb2RlbCBpbXBsZW1lbnRzIEdyaWRNb2RlbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZ3JpZCBtb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGNvbHVtbnMgYW5kIHJvd3MgcG9wdWxhdGVkIHdpdGggZGVmYXVsdCBjZWxscy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gY29sc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBkaW0oY29sczpudW1iZXIsIHJvd3M6bnVtYmVyKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNlbGxzID0gW10gYXMgR3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2xzOyBjKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCByID0gMDsgciA8IHJvd3M7IHIrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2VsbHMucHVzaChuZXcgRGVmYXVsdEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xSZWY6IGMsXHJcbiAgICAgICAgICAgICAgICAgICAgcm93UmVmOiByLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKGNlbGxzLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBlbXB0eSBncmlkIG1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtEZWZhdWx0R3JpZE1vZGVsfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5KCk6RGVmYXVsdEdyaWRNb2RlbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgRGVmYXVsdEdyaWRNb2RlbChbXSwgW10sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIGNlbGwgZGVmaW5pdGlvbnMuICBUaGUgb3JkZXIgaXMgYXJiaXRyYXJ5LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VsbHM6R3JpZENlbGxbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIGNvbHVtbiBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2x1bW5zOkdyaWRDb2x1bW5bXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIHJvdyBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dzOkdyaWRSb3dbXTtcclxuXHJcbiAgICBwcml2YXRlIHJlZnM6T2JqZWN0TWFwPEdyaWRDZWxsPjtcclxuICAgIHByaXZhdGUgY29vcmRzOk9iamVjdEluZGV4PE9iamVjdEluZGV4PEdyaWRDZWxsPj47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZE1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBjZWxsc1xyXG4gICAgICogQHBhcmFtIGNvbHVtbnNcclxuICAgICAqIEBwYXJhbSByb3dzXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGNlbGxzOkdyaWRDZWxsW10sIGNvbHVtbnM6R3JpZENvbHVtbltdLCByb3dzOkdyaWRSb3dbXSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNlbGxzID0gY2VsbHM7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnMgPSBfLmluZGV4KGNlbGxzLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLmNvb3JkcyA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHggPSB0aGlzLmNvb3Jkc1tjLmNvbFJlZl0gfHwgKHRoaXMuY29vcmRzW2MuY29sUmVmXSA9IHt9KTtcclxuICAgICAgICAgICAgeFtjLnJvd1JlZl0gPSBjO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNlbGwsIG9yIG51bGwgaWYgdGhlIGNlbGwgZGlkIG5vdCBleGlzdFxyXG4gICAgICogd2l0aGluIHRoZSBtb2RlbC5cclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqL1xyXG4gICAgcHVibGljIGZpbmRDZWxsKHJlZjpzdHJpbmcpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmc1tyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgcmVmLCByZXR1cm5zIHRoZSBHcmlkQ2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBuZWlnaGJvcmluZyBjZWxsIGFzIHBlciB0aGUgc3BlY2lmaWVkXHJcbiAgICAgKiB2ZWN0b3IgKGRpcmVjdGlvbikgb2JqZWN0LCBvciBudWxsIGlmIG5vIG5laWdoYm9yIGNvdWxkIGJlIGZvdW5kLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICogQHBhcmFtIHZlY3RvclxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGxOZWlnaGJvcihyZWY6c3RyaW5nLCB2ZWN0b3I6UG9pbnQpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmZpbmRDZWxsKHJlZik7XHJcbiAgICAgICAgbGV0IGNvbCA9IGNlbGwuY29sUmVmICsgdmVjdG9yLng7XHJcbiAgICAgICAgbGV0IHJvdyA9IGNlbGwucm93UmVmICsgdmVjdG9yLnk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0ZUNlbGwoY29sLCByb3cpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIGNvbHVtbiByZWYgYW5kIHJvdyByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNlbGwgYXQgdGhlIGxvY2F0aW9uLFxyXG4gICAgICogb3IgbnVsbCBpZiBubyBjZWxsIGNvdWxkIGJlIGZvdW5kLlxyXG4gICAgICogQHBhcmFtIGNvbFJlZlxyXG4gICAgICogQHBhcmFtIHJvd1JlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgbG9jYXRlQ2VsbChjb2w6bnVtYmVyLCByb3c6bnVtYmVyKTpHcmlkQ2VsbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5jb29yZHNbY29sXSB8fCB7fSlbcm93XSB8fCBudWxsO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL0dyaWRSb3cnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRSb3cuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRSb3cgaW1wbGVtZW50cyBHcmlkUm93XHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvdyByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuICBVc2VkIHRvIGluZGljYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGVcclxuICAgICAqIHJvdyB3aXRoaW4gdGhlIGdyaWQgYmFzZWQgb24gYSB6ZXJvLWluZGV4LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIGNvbHVtbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhlaWdodDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZFJvdy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHJlZjpudW1iZXIsIGhlaWdodDpudW1iZXIgPSAyMSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IGV4dGVuZCB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhc2NhZGUoKTpQcm9wZXJ0eURlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOlByb3BlcnR5RGVzY3JpcHRvclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwayA9IGBfXyR7a2V5fWA7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKTp2b2lkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3BrXSB8fCAoISF0aGlzLnBhcmVudCA/IHRoaXMucGFyZW50W2tleV0gOiBudWxsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbih2YWw6YW55KTp2b2lkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbcGtdID0gdmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDYXNjYWRpbmc8VD5cclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmVudDpUO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudD86VCwgdmFsdWVzPzphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcclxuICAgICAgICBpZiAodmFsdWVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXh0ZW5kKHRoaXMsIHZhbHVlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRBbGlnbm1lbnQgPSAnbGVmdCd8J2NlbnRlcid8J3JpZ2h0JztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGb3JtYXR0ZXJcclxue1xyXG4gICAgKHZhbHVlOnN0cmluZywgdmlzdWFsOmFueSk6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3R5bGUgZXh0ZW5kcyBDYXNjYWRpbmc8U3R5bGU+XHJcbntcclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBib3JkZXJDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZpbGxDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZvcm1hdHRlcjpWYWx1ZUZvcm1hdHRlcjtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdGV4dDpUZXh0U3R5bGU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUZXh0U3R5bGUgZXh0ZW5kcyBDYXNjYWRpbmc8VGV4dFN0eWxlPlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIERlZmF1bHQ6VGV4dFN0eWxlID0gbmV3IFRleHRTdHlsZShudWxsLCB7XHJcbiAgICAgICAgYWxpZ25tZW50OiAnbGVmdCcsXHJcbiAgICAgICAgY29sb3I6ICdibGFjaycsXHJcbiAgICAgICAgZm9udDogJ1NlZ29lIFVJJyxcclxuICAgICAgICBzaXplOiAxMyxcclxuICAgICAgICBzdHlsZTogJ25vcm1hbCcsXHJcbiAgICAgICAgdmFyaWFudDogJ25vcm1hbCcsXHJcbiAgICAgICAgd2VpZ2h0OiAnbm9ybWFsJyxcclxuICAgIH0pO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBhbGlnbm1lbnQ6VGV4dEFsaWdubWVudDtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgY29sb3I6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBmb250OnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgc2l6ZTpudW1iZXI7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHN0eWxlOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdmFyaWFudDpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHdlaWdodDpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBCYXNlU3R5bGUgPSBuZXcgU3R5bGUobnVsbCwge1xyXG4gICAgYm9yZGVyQ29sb3I6ICdsaWdodGdyYXknLFxyXG4gICAgZmlsbENvbG9yOiAnd2hpdGUnLFxyXG4gICAgZm9ybWF0dGVyOiB2ID0+IHYsXHJcbiAgICB0ZXh0OiBuZXcgVGV4dFN0eWxlKG51bGwsIHtcclxuICAgICAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgICAgICBjb2xvcjogJ2JsYWNrJyxcclxuICAgICAgICBmb250OiAnU2Vnb2UgVUknLFxyXG4gICAgICAgIHNpemU6IDEzLFxyXG4gICAgICAgIHN0eWxlOiAnbm9ybWFsJyxcclxuICAgICAgICB2YXJpYW50OiAnbm9ybWFsJyxcclxuICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgfSlcclxufSk7IiwiaW1wb3J0IHsgRGVmYXVsdEdyaWRDZWxsLCBEZWZhdWx0R3JpZENlbGxQYXJhbXMgfSBmcm9tICcuLi9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFN0eWxlLCBCYXNlU3R5bGUgfSBmcm9tICcuL1N0eWxlJztcclxuaW1wb3J0IHsgcmVuZGVyZXIsIHZpc3VhbGl6ZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4vc2hvdWxkIGJlIHBhc3NlZCB0byBhIG5ldyBTdHlsZWRHcmlkQ2VsbCBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGVkR3JpZENlbGxQYXJhbXMgZXh0ZW5kcyBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgcGxhY2Vob2xkZXI/OnN0cmluZztcclxuICAgIHN0eWxlPzpTdHlsZTtcclxufVxyXG5cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBTdHlsZWRHcmlkQ2VsbCBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFxyXG57XHJcbiAgICBAdmlzdWFsaXplKClcclxuICAgIHB1YmxpYyBzdHlsZTpTdHlsZSA9IEJhc2VTdHlsZTtcclxuXHJcbiAgICBAdmlzdWFsaXplKClcclxuICAgIHB1YmxpYyBwbGFjZWhvbGRlcjpzdHJpbmcgPSAnJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIFN0eWxlZEdyaWRDZWxsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOlN0eWxlZEdyaWRDZWxsUGFyYW1zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKHBhcmFtcyk7XHJcblxyXG4gICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBwYXJhbXMucGxhY2Vob2xkZXIgfHwgJyc7XHJcbiAgICAgICAgdGhpcy5zdHlsZSA9IHBhcmFtcy5zdHlsZSB8fCBCYXNlU3R5bGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXcoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZFxyXG57XHJcbiAgICBsZXQgc3R5bGUgPSB2aXN1YWwuc3R5bGUgYXMgU3R5bGU7XHJcblxyXG4gICAgZ2Z4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICBsZXQgYXYgPSBnZngubGluZVdpZHRoICUgMiA9PSAwID8gMCA6IDAuNTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUuZmlsbENvbG9yO1xyXG4gICAgZ2Z4LmZpbGxSZWN0KC1hdiwgLWF2LCB2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG5cclxuICAgIGdmeC5zdHJva2VTdHlsZSA9IHN0eWxlLmJvcmRlckNvbG9yO1xyXG4gICAgZ2Z4LnN0cm9rZVJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgbGV0IHRleHRQdCA9IG5ldyBQb2ludCgzLCB2aXN1YWwuaGVpZ2h0IC8gMikgYXMgUG9pbnRMaWtlO1xyXG4gICAgaWYgKHN0eWxlLnRleHQuYWxpZ25tZW50ID09PSAnY2VudGVyJylcclxuICAgIHtcclxuICAgICAgICB0ZXh0UHQueCA9IHZpc3VhbC53aWR0aCAvIDI7XHJcbiAgICB9XHJcbiAgICBpZiAoc3R5bGUudGV4dC5hbGlnbm1lbnQgPT09ICdyaWdodCcpXHJcbiAgICB7XHJcbiAgICAgICAgdGV4dFB0LnggPSB2aXN1YWwud2lkdGggLSAzO1xyXG4gICAgfVxyXG5cclxuICAgIGdmeC5mb250ID0gYCR7c3R5bGUudGV4dH0gJHtzdHlsZS50ZXh0LnZhcmlhbnR9ICR7c3R5bGUudGV4dC53ZWlnaHR9ICR7c3R5bGUudGV4dC5zaXplfXB4ICR7c3R5bGUudGV4dC5mb250fWA7XHJcbiAgICBnZngudGV4dEFsaWduID0gc3R5bGUudGV4dC5hbGlnbm1lbnQ7XHJcbiAgICBnZngudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUudGV4dC5jb2xvcjtcclxuICAgIGdmeC5maWxsVGV4dChzdHlsZS5mb3JtYXR0ZXIodmlzdWFsLnZhbHVlLCB2aXN1YWwpIHx8IHZpc3VhbC5wbGFjZWhvbGRlciwgdGV4dFB0LngsIHRleHRQdC55KTtcclxufSIsImltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgaXNCb29sZWFuIH0gZnJvbSAndXRpbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERvIG5vdCB1c2UgZGlyZWN0bHkuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzRGVmPFQ+XHJcbntcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIGRlZmluaXRpb24gZm9yIGEgY2VsbCByZW5kZXJlciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJcclxue1xyXG4gICAgKGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIHZpc3VhbDphbnkpOnZvaWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9jb21tYW5kXzsgYW4gZXh0ZXJuYWxseSBjYWxsYWJsZSBsb2dpYyBibG9jayB0aGF0IHBlcmZvcm1zIHNvbWUgdGFzay4gIEEgbmFtZVxyXG4gKiBmb3IgdGhlIGNvbW1hbmQgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZCBhcyB0aGUgY29tbWFuZCB3aWxsIGJlXHJcbiAqIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCBjb21tYW5kIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZChuYW1lPzpzdHJpbmcpOk1ldGhvZERlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcsIGRlc2NyaXB0b3I6VHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8RnVuY3Rpb24+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6Y29tbWFuZHMnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBpbXBsOiBkZXNjcmlwdG9yLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IGRlZmluZXMgdGhlIHJlbmRlciBmdW5jdGlvbiBmb3IgYSBHcmlkQ2VsbCBpbXBsZW1lbnRhdGlvbiwgYWxsb3dpbmcgY3VzdG9tIGNlbGwgdHlwZXNcclxuICogdG8gY29udHJvbCB0aGVpciBkcmF3aW5nIGJlaGF2aW9yLlxyXG4gKlxyXG4gKiBAcGFyYW0gZnVuY1xyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyZXIoZnVuYzpSZW5kZXJlcik6Q2xhc3NEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgZnVuYywgY3Rvcik7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2QgYXMgYSBfcm91dGluZV87IGEgbG9naWMgYmxvY2sgdGhhdCBjYW4gYmUgaG9va2VkIGludG8gb3Igb3ZlcnJpZGRlbiBieSBvdGhlclxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgcm91dGluZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSByb3V0aW5lIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHJvdXRpbmUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3V0aW5lKG5hbWU/OnN0cmluZyk6TWV0aG9kRGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCByb3V0aW5lID0gZGVzY3JpcHRvci52YWx1ZTtcclxuICAgICAgICBsZXQgd3JhcHBlciA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQga2VybmVsID0gKHRoaXNbJ19fa2VybmVsJ10gfHwgdGhpc1sna2VybmVsJ10pIGFzIEdyaWRLZXJuZWw7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXJuZWwucm91dGluZXMuc2lnbmFsKGtleSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSwgcm91dGluZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlciB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBhIF92YXJpYWJsZV87IGEgcmVhZGFibGUgYW5kIG9wdGlvbmFsbHkgd3JpdGFibGUgdmFsdWUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnlcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHZhcmlhYmxlIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgdmFyaWFibGUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgdmFyaWFibGUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShtdXRhYmxlOmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yO1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZT86c3RyaW5nLCBtdXRhYmxlPzpib29sZWFuKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG5hbWU6c3RyaW5nfGJvb2xlYW4sIG11dGFibGU/OmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIGlmICh0eXBlb2YobmFtZSkgPT09ICdib29sZWFuJylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFyaWFibGUodW5kZWZpbmVkLCBuYW1lIGFzIGJvb2xlYW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZhcmlhYmxlcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIG11dGFibGU6IG11dGFibGUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vbGV0IHZhbFN0b3JlS2V5ID0gISFuYW1lID8ga2V5IDogYF9fJHtrZXl9YDtcclxuICAgICAgICAvL2xldCB1c2VBbHRWYWx1ZVN0b3JlID0gIW5hbWU7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL09iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBuYW1lIHx8IGtleSwge1xyXG4gICAgICAgIC8vICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAvLyAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2YWxTdG9yZUtleV07IH0sXHJcbiAgICAgICAgLy8gICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpIHsgdGhpc1t2YWxTdG9yZUtleV0gPSBuZXdWYWw7IH1cclxuICAgICAgICAvL30pO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIGZvciB1c2Ugd2l0aGluIGltcGxlbWVudGF0aW9ucyBvZiBHcmlkQ2VsbCB0aGF0IG1hcmtzIGEgZmllbGQgYXMgb25lIHRoYXQgYWZmZWN0cyB0aGUgdmlzdWFsXHJcbiAqIGFwcGVhcmFuY2Ugb2YgdGhlIGNlbGwuICBUaGlzIHdpbGwgY2F1c2UgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCB0byBiZSBtYXBwZWQgdG8gdGhlIF9WaXN1YWxfIG9iamVjdFxyXG4gKiBjcmVhdGVkIGJlZm9yZSB0aGUgY2VsbCBpcyBkcmF3bi5cclxuICpcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmlzdWFsaXplKCk6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTpQcm9wZXJ0eURlc2NyaXB0b3JcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDp2aXN1YWxpemUnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKGtleSk7XHJcblxyXG4gICAgICAgIGxldCBwayA9IGBfXyR7a2V5fWA7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKTphbnlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICB0aGlzWydfX2RpcnR5J10gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSIsImltcG9ydCB7IFBhZGRpbmcgfSBmcm9tICcuLi9nZW9tL1BhZGRpbmcnO1xyXG5pbXBvcnQgeyBNb3VzZUlucHV0IH0gZnJvbSAnLi4vaW5wdXQvTW91c2VJbnB1dCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9tb2RlbC9HcmlkUm93JztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEV2ZW50RW1pdHRlckJhc2UgfSBmcm9tICcuL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgR3JpZExheW91dCB9IGZyb20gJy4vaW50ZXJuYWwvR3JpZExheW91dCc7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi4vaW5wdXQvTW91c2VEcmFnRXZlbnQnO1xyXG5pbXBvcnQgeyBSZWN0LCBSZWN0TGlrZSB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgcHJvcGVydHkgfSBmcm9tICcuLi9taXNjL1Byb3BlcnR5JztcclxuaW1wb3J0IHsgdmFyaWFibGUgfSBmcm9tICcuL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIGluaXQ/KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFeHRlbmRlclxyXG57XHJcbiAgICAoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZE1vdXNlRXZlbnQgZXh0ZW5kcyBNb3VzZUV2ZW50XHJcbntcclxuICAgIHJlYWRvbmx5IGNlbGw6R3JpZENlbGw7XHJcbiAgICByZWFkb25seSBncmlkWDpudW1iZXI7XHJcbiAgICByZWFkb25seSBncmlkWTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZE1vdXNlRHJhZ0V2ZW50IGV4dGVuZHMgTW91c2VEcmFnRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkS2V5Ym9hcmRFdmVudCBleHRlbmRzIEtleWJvYXJkRXZlbnRcclxue1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZEVsZW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKHRhcmdldDpIVE1MRWxlbWVudCwgaW5pdGlhbE1vZGVsPzpHcmlkTW9kZWwpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBhcmVudCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xyXG5cclxuICAgICAgICBsZXQgY2FudmFzID0gdGFyZ2V0Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgY2FudmFzLmlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgIGNhbnZhcy5jbGFzc05hbWUgPSB0YXJnZXQuY2xhc3NOYW1lO1xyXG4gICAgICAgIGNhbnZhcy50YWJJbmRleCA9IHRhcmdldC50YWJJbmRleCB8fCAwO1xyXG5cclxuICAgICAgICB0YXJnZXQuaWQgPSBudWxsO1xyXG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2FudmFzLCB0YXJnZXQpO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0YXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCBwYXJlbnQuc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhcmVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZ3JpZCA9IG5ldyBHcmlkRWxlbWVudChjYW52YXMpO1xyXG4gICAgICAgIGdyaWQubW9kZWwgPSBpbml0aWFsTW9kZWwgfHwgRGVmYXVsdEdyaWRNb2RlbC5kaW0oMjYsIDEwMCk7XHJcbiAgICAgICAgZ3JpZC5iYXNoKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBncmlkO1xyXG4gICAgfVxyXG5cclxuICAgIEBwcm9wZXJ0eShEZWZhdWx0R3JpZE1vZGVsLmVtcHR5KCksIHQgPT4geyB0LmVtaXQoJ2xvYWQnLCB0Lm1vZGVsKTsgdC5pbnZhbGlkYXRlKCk7IH0pXHJcbiAgICBwdWJsaWMgbW9kZWw6R3JpZE1vZGVsO1xyXG5cclxuICAgIEBwcm9wZXJ0eShQYWRkaW5nLmVtcHR5LCB0ID0+IHQuaW52YWxpZGF0ZSgpKVxyXG4gICAgcHVibGljIHBhZGRpbmc6UGFkZGluZztcclxuXHJcbiAgICBAcHJvcGVydHkoUG9pbnQuZW1wdHksIHQgPT4geyB0LnJlZHJhdygpOyB0LmVtaXQoJ3Njcm9sbCcpOyB9KVxyXG4gICAgcHVibGljIHNjcm9sbDpQb2ludDtcclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9vdDpIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIHB1YmxpYyByZWFkb25seSBjb250YWluZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2VybmVsOkdyaWRLZXJuZWw7XHJcblxyXG4gICAgcHJpdmF0ZSBob3RDZWxsOkdyaWRDZWxsO1xyXG4gICAgcHJpdmF0ZSBkaXJ0eTpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGxheW91dDpHcmlkTGF5b3V0OyAgICBcclxuICAgIHByaXZhdGUgYnVmZmVyczpPYmplY3RNYXA8QnVmZmVyPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSB2aXN1YWxzOk9iamVjdE1hcDxWaXN1YWw+ID0ge307XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjYW52YXMucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWwodGhpcy5lbWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBbJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnLCAnbW91c2V3aGVlbCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnYmVnaW4nLCAnZHJhZycsICdkcmFnZW5kJ11cclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PiB0aGlzLmZvcndhcmRNb3VzZUV2ZW50KHgpKTtcclxuICAgICAgICBbJ2tleWRvd24nLCAna2V5cHJlc3MnLCAna2V5dXAnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZEtleUV2ZW50KHgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmFibGVFbnRlckV4aXRFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxXaWR0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJvd3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbEhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxMZWZ0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsLng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxUb3AoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGwueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9ufEdyaWRFeHRlbmRlcik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBpZiAodHlwZW9mKGV4dCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LmluaXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3QgPSA8YW55PnB0T3JSZWN0O1xyXG5cclxuICAgICAgICBpZiAoZGVzdC53aWR0aCA9PT0gdW5kZWZpbmVkICYmIGRlc3QuaGVpZ2h0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QoZGVzdC54LCBkZXN0LnksIDEsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG5ld1Njcm9sbCA9IHtcclxuICAgICAgICAgICAgeDogdGhpcy5zY3JvbGwueCxcclxuICAgICAgICAgICAgeTogdGhpcy5zY3JvbGwueSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoZGVzdC5sZWZ0IDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5ld1Njcm9sbC54ICs9IGRlc3QubGVmdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QucmlnaHQgPiB0aGlzLndpZHRoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnggKz0gZGVzdC5yaWdodCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnRvcCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdTY3JvbGwueSArPSBkZXN0LnRvcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QuYm90dG9tID4gdGhpcy5oZWlnaHQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdTY3JvbGwueSArPSBkZXN0LmJvdHRvbSAtIHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnNjcm9sbC5lcXVhbHMobmV3U2Nyb2xsKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsID0gUG9pbnQuY3JlYXRlKG5ld1Njcm9sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBiYXNoKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucm9vdC53aWR0aCA9IHRoaXMucm9vdC5wYXJlbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgIHRoaXMucm9vdC5oZWlnaHQgPSB0aGlzLnJvb3QucGFyZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdiYXNoJyk7XHJcblxyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnZhbGlkYXRlKHF1ZXJ5OnN0cmluZyA9IG51bGwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LmludmFsaWRhdGUnKTtcclxuICAgICAgICB0aGlzLmxheW91dCA9IEdyaWRMYXlvdXQuY29tcHV0ZSh0aGlzLm1vZGVsLCB0aGlzLnBhZGRpbmcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghIXF1ZXJ5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJhbmdlID0gR3JpZFJhbmdlLnNlbGVjdCh0aGlzLm1vZGVsLCBxdWVyeSk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNlbGwgb2YgcmFuZ2UubHRyKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY2VsbFsnX19kaXJ0eSddO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWwuY2VsbHMuZm9yRWFjaCh4ID0+IGRlbGV0ZSB4WydfX2RpcnR5J10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5pbnZhbGlkYXRlJyk7XHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB0aGlzLmVtaXQoJ2ludmFsaWRhdGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVkcmF3KGZvcmNlSW1tZWRpYXRlOmJvb2xlYW4gPSBmYWxzZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LnJlZHJhdycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZvcmNlSW1tZWRpYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB0aGlzLnVwZGF0ZVZpc3VhbHMoKTtcclxuICAgICAgICB0aGlzLmRyYXdWaXN1YWxzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnJlZHJhdycpO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZHJhdycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdwb3J0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChNYXRoLmZsb29yKHRoaXMuc2Nyb2xsTGVmdCksIE1hdGguZmxvb3IodGhpcy5zY3JvbGxUb3ApLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVZpc3VhbHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB7IG1vZGVsLCBsYXlvdXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IHZpc2libGVDZWxscyA9IGxheW91dC5jYXB0dXJlQ2VsbHModmlld3BvcnQpXHJcbiAgICAgICAgICAgIC5tYXAocmVmID0+IG1vZGVsLmZpbmRDZWxsKHJlZikpO1xyXG5cclxuICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy52aXN1YWxzO1xyXG4gICAgICAgIGxldCBuZXh0RnJhbWUgPSA8T2JqZWN0TWFwPFZpc3VhbD4+e307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgdmlzaWJsZUNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJlZ2lvbiA9IGxheW91dC5xdWVyeUNlbGwoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gcHJldkZyYW1lW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBoYXZlIGEgcHJldmlvdXMgdmlzdWFsIG9yIGlmIHRoZSBjZWxsIHdhcyBkaXJ0eSwgY3JlYXRlIG5ldyB2aXN1YWxcclxuICAgICAgICAgICAgaWYgKCF2aXN1YWwgfHwgY2VsbC52YWx1ZSAhPT0gdmlzdWFsLnZhbHVlIHx8IGNlbGxbJ19fZGlydHknXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZVZpc3VhbChjZWxsLCByZWdpb24pO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICAgICAgY2VsbFsnX19kaXJ0eSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGp1c3QgdXNlIHRoZSBwcmV2aW91c1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB2aXN1YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmlzdWFscyA9IG5leHRGcmFtZTtcclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3VmlzdWFscygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LmRyYXdWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IGdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogdHJ1ZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgZ2Z4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZ2Z4LnNhdmUoKTtcclxuICAgICAgICBnZngudHJhbnNsYXRlKHZpZXdwb3J0LmxlZnQgKiAtMSwgdmlld3BvcnQudG9wICogLTEpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjciBpbiB0aGlzLnZpc3VhbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMubW9kZWwuZmluZENlbGwoY3IpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gdGhpcy52aXN1YWxzW2NyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2aXN1YWwud2lkdGggPT0gMCB8fCB2aXN1YWwuaGVpZ2h0ID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXZpZXdwb3J0LmludGVyc2VjdHModmlzdWFsKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFidWZmZXIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZUJ1ZmZlcih2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gVHlwZVNjcmlwdFVucmVzb2x2ZWRGdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgY2VsbC5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2Z4LmRyYXdJbWFnZShidWZmZXIuY2FudmFzLCB2aXN1YWwubGVmdCAtIGJ1ZmZlci5pbmZsYXRpb24sIHZpc3VhbC50b3AgLSBidWZmZXIuaW5mbGF0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdmeC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUJ1ZmZlcih3aWR0aDpudW1iZXIsIGhlaWdodDpudW1iZXIpOkJ1ZmZlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHdpZHRoLCBoZWlnaHQsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlVmlzdWFsKGNlbGw6YW55LCByZWdpb246UmVjdExpa2UpOlZpc3VhbFxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aXN1YWwgPSBuZXcgVmlzdWFsKGNlbGwucmVmLCBjZWxsLnZhbHVlLCByZWdpb24ubGVmdCwgcmVnaW9uLnRvcCwgcmVnaW9uLndpZHRoLCByZWdpb24uaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgbGV0IHByb3BzID0gKFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmlzdWFsaXplJywgY2VsbC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpIHx8IFtdKSBhcyBzdHJpbmdbXTtcclxuICAgICAgICBmb3IgKGxldCBwIG9mIHByb3BzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHZpc3VhbFtwXSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2aXN1YWxbcF0gPSBjbG9uZShjZWxsW3BdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYElsbGVnYWwgdmlzdWFsaXplZCBwcm9wZXJ0eSBuYW1lICR7cH0gb24gdHlwZSAke2NlbGwuY29uc3RydWN0b3IubmFtZX0uYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2aXN1YWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkTW91c2VFdmVudChldmVudDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCAobmU6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChuZS5vZmZzZXRYLCBuZS5vZmZzZXRZKTtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgZ2UgPSA8YW55Pm5lO1xyXG4gICAgICAgICAgICBnZS5jZWxsID0gY2VsbCB8fCBudWxsO1xyXG4gICAgICAgICAgICBnZS5ncmlkWCA9IHB0Lng7XHJcbiAgICAgICAgICAgIGdlLmdyaWRZID0gcHQueTsgICAgICBcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudCwgZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZEtleUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCA8R3JpZEtleWJvYXJkRXZlbnQ+bmUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5hYmxlRW50ZXJFeGl0RXZlbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub24oJ21vdXNlbW92ZScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGUuY2VsbCAhPSB0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0V2dCA9IHRoaXMuY3JlYXRlR3JpZE1vdXNlRXZlbnQoJ2NlbGxleGl0JywgZSkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld0V2dC5jZWxsID0gdGhpcy5ob3RDZWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2VsbGV4aXQnLCBuZXdFdnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaG90Q2VsbCA9IGUuY2VsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3RDZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdFdnQgPSB0aGlzLmNyZWF0ZUdyaWRNb3VzZUV2ZW50KCdjZWxsZW50ZXInLCBlKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RXZ0LmNlbGwgPSB0aGlzLmhvdENlbGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjZWxsZW50ZXInLCBuZXdFdnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVHcmlkTW91c2VFdmVudCh0eXBlOnN0cmluZywgc291cmNlOkdyaWRNb3VzZUV2ZW50KTpHcmlkTW91c2VFdmVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBldmVudCA9IDxhbnk+KG5ldyBNb3VzZUV2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgICAgIGV2ZW50LmNlbGwgPSBzb3VyY2UuY2VsbDtcclxuICAgICAgICBldmVudC5ncmlkWCA9IHNvdXJjZS5ncmlkWDtcclxuICAgICAgICBldmVudC5ncmlkWSA9IHNvdXJjZS5ncmlkWTtcclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lKHg6YW55KTphbnlcclxue1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHgubWFwKGNsb25lKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXy5zaGFkb3dDbG9uZSh4KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQnVmZmVyXHJcbntcclxuICAgIHB1YmxpYyBjYW52YXM6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgd2lkdGg6bnVtYmVyLCBwdWJsaWMgaGVpZ2h0Om51bWJlciwgcHVibGljIGluZmxhdGlvbjpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICsgKGluZmxhdGlvbiAqIDIpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogZmFsc2UgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIHRoaXMuZ2Z4LnRyYW5zbGF0ZShpbmZsYXRpb24sIGluZmxhdGlvbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFZpc3VhbFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVmOnN0cmluZyxcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZTpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgbGVmdDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdG9wOm51bWJlcixcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB3aWR0aDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKGFub3RoZXI6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXNbcHJvcF0gIT09IGFub3RoZXJbcHJvcF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCdcclxuXHJcbi8vVGhpcyBrZWVwcyBXZWJTdG9ybSBxdWlldCwgZm9yIHNvbWUgcmVhc29uIGl0IGlzIGNvbXBsYWluaW5nLi4uXHJcbmRlY2xhcmUgdmFyIFJlZmxlY3Q6YW55O1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgZXhlYyhjb21tYW5kOnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkVmFyaWFibGVcclxue1xyXG4gICAgZ2V0KCk6YW55O1xyXG4gICAgc2V0Pyh2YWx1ZTphbnkpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIGRlZmluZSh2YXJpYWJsZTpzdHJpbmcsIGltcGw6R3JpZFZhcmlhYmxlKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lSG9va1xyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZU92ZXJyaWRlXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTphbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOmFueSk6dm9pZDtcclxuXHJcbiAgICBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6YW55KTphbnk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBzaWduYWwocm91dGluZTpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOmJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRzIHRoZSBjb3JlIG9mIHRoZSBHcmlkIGV4dGVuc2liaWxpdHkgc3lzdGVtLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdyaWRLZXJuZWxcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbW1hbmRzOkdyaWRDb21tYW5kSHViID0gbmV3IEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvdXRpbmVzOkdyaWRSb3V0aW5lSHViID0gbmV3IEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHZhcmlhYmxlczpHcmlkVmFyaWFibGVIdWIgPSBuZXcgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCgpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcjooZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBleHBvcnRJbnRlcmZhY2UodGFyZ2V0PzphbnkpOmFueVxyXG4gICAge1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldCB8fCB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kcyA9IHRoaXMuY29tbWFuZHNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRDb21tYW5kPjtcclxuICAgICAgICBsZXQgdmFyaWFibGVzID0gdGhpcy52YXJpYWJsZXNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRWYXJpYWJsZT47XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gY29tbWFuZHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0YXJnZXRbbl0gPSBjb21tYW5kc1tuXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gdmFyaWFibGVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbiwgdmFyaWFibGVzW25dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluc3RhbGwoZXh0OmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNvbW1hbmRzLCB2YXJpYWJsZXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChleHRbJ19fa2VybmVsJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnRXh0ZW5zaW9uIGFwcGVhcnMgdG8gaGF2ZSBhbHJlYWR5IGJlZW4gaW5zdGFsbGVkIGludG8gdGhpcyBvciBhbm90aGVyIGdyaWQuLi4/JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dFsnX19rZXJuZWwnXSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBjbWRzID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDpjb21tYW5kcycsIGV4dCkgfHwgW107XHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjbWRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29tbWFuZHMuZGVmaW5lKGMubmFtZSwgYy5pbXBsLmJpbmQoZXh0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmFycyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmFyaWFibGVzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCB2IG9mIHZhcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXJpYWJsZXMuZGVmaW5lKHYubmFtZSwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3Yua2V5XTsgfSkuYmluZChleHQpLFxyXG4gICAgICAgICAgICAgICAgc2V0OiAhIXYubXV0YWJsZSA/IChmdW5jdGlvbih2YWwpIHsgdGhpc1t2LmtleV0gPSB2YWw7IH0pLmJpbmQoZXh0KSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwgaW1wbGVtZW50cyBHcmlkQ29tbWFuZEh1YlxyXG57XHJcbiAgICBwcml2YXRlIHN0b3JlOk9iamVjdE1hcDxHcmlkQ29tbWFuZD4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCBjb21tYW5kIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVtjb21tYW5kXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdDb21tYW5kIHdpdGggbmFtZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVtjb21tYW5kXSA9IGltcGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbY29tbWFuZF07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbXBsLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIGNvbW1hbmQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBob29rczpPYmplY3RNYXA8R3JpZFJvdXRpbmVIb29rW10+ID0ge307XHJcbiAgICBwcml2YXRlIG92ZXJyaWRlczpPYmplY3RNYXA8R3JpZFJvdXRpbmVPdmVycmlkZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBob29rIHRvIHRoZSBzcGVjaWZpZWQgc2lnbmFsIHRoYXQgZW5hYmxlcyBleHRlbnNpb25zIHRvIG92ZXJyaWRlIGdyaWQgYmVoYXZpb3JcclxuICAgICAqIGRlZmluZWQgaW4gdGhlIGNvcmUgb3Igb3RoZXIgZXh0ZW5zaW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOkdyaWRSb3V0aW5lSG9vayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXSB8fCAodGhpcy5ob29rc1tyb3V0aW5lXSA9IFtdKTtcclxuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6R3JpZFJvdXRpbmVPdmVycmlkZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2lnbmFsKHJvdXRpbmU6c3RyaW5nLCBhcmdzOmFueVtdLCBpbXBsOkZ1bmN0aW9uKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKGBiZWZvcmU6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICBpZiAoISF0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChpbXBsKTtcclxuICAgICAgICAgICAgaW1wbCA9IHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcblxyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3Mocm91dGluZSwgYXJncyk7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhgYWZ0ZXI6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW52b2tlSG9va3Mocm91dGluZTpzdHJpbmcsIGFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuaG9va3Nbcm91dGluZV07XHJcblxyXG4gICAgICAgIGlmIChsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaG9vayBvZiBsaXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob29rLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIHByaXZhdGUgc3RvcmU6T2JqZWN0TWFwPEdyaWRWYXJpYWJsZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCB2YXJpYWJsZSBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVmaW5lKHZhcmlhYmxlOnN0cmluZywgaW1wbDpHcmlkVmFyaWFibGUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVt2YXJpYWJsZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVmFyaWFibGUgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVt2YXJpYWJsZV0gPSBpbXBsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCh2YXJpYWJsZTpzdHJpbmcpOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVt2YXJpYWJsZV07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1wbC5nZXQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXQodmFyaWFibGU6c3RyaW5nLCB2YWx1ZTphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGltcGwuc2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbXBsLnNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnQ2Fubm90IHNldCByZWFkb25seSB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIGJhc2UgaW50ZXJmYWNlIG9mIGEgd2lkZ2V0LiAgQSB3aWRnZXQgaXMgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIFVJIGVsZW1lbnQgd2l0aGluIHRoZSBjb250ZXh0IG9mXHJcbiAqIGEgZ3JpZC4gIEl0IGNhbiBiZSBjb21wb3NlZCBvZiBvbmUgb3IgbW9yZSBET00gZWxlbWVudHMgYW5kIGJlIGludGVyYWN0YWJsZSBvciBzdGF0aWMuICBUaGUgV2lkZ2V0IGludGVyZmFjZXNcclxuICogcHJvdmlkZXMgYSBjb21tb24gaW50ZXJmYWNlIHRocm91Z2ggd2hpY2ggbW9kdWxlcyBvciBjb25zdW1lcnMgY2FuIGFjY2VzcyB0aGUgdW5kZXJseWluZyBET00gZWxlbWVudHMgb2YgYSB3aWRnZXRcclxuICogYW5kIGJhc2ljIG1ldGhvZHMgdGhhdCBlYXNlIHRoZSBtYW5pcHVsYXRpb24gb2Ygd2lkZ2V0cy5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgV2lkZ2V0XHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvb3QgSFRNTEVsZW1lbnQgb2YgdGhlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgcm9vdDpIVE1MRWxlbWVudDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgdmlld1JlY3Q6UmVjdDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGVzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIGhpZGUoKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgc2hvdygpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgdG9nZ2xlKHZpc2libGU6Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIFdpZGdldCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBhcmUgZXhwZWN0ZWQgdG8gcmVwcmVzZW50IFdpZGdldHMgd2l0aFxyXG4gKiBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgcm9vdCBlbGVtZW50cy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBYnNXaWRnZXRCYXNlPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4gaW1wbGVtZW50cyBXaWRnZXRcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJvb3Q6VClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCB2aWV3UmVjdCgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3RcclxuICAgICAgICAoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5yb290LnN0eWxlLmxlZnQpLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMucm9vdC5zdHlsZS50b3ApLFxyXG4gICAgICAgICAgICB0aGlzLnJvb3QuY2xpZW50V2lkdGgsXHJcbiAgICAgICAgICAgIHRoaXMucm9vdC5jbGllbnRIZWlnaHRcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZXMgdGhlIFdpZGdldCB0byB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlld1JlY3RcclxuICAgICAqIEBwYXJhbSBhbmltYXRlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmIChhdXRvU2hvdylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0IC0gMX1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wIC0gMX1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aCArIDF9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3ZpZXdSZWN0LmhlaWdodCArIDF9cHhgLFxyXG4gICAgICAgICAgICBvdmVyZmxvdzogYGhpZGRlbmAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlcyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGlkZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20uaGlkZSh0aGlzLnJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNob3coKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLnNob3codGhpcy5yb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlzaWJsZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdG9nZ2xlKHZpc2libGU6Ym9vbGVhbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS50b2dnbGUodGhpcy5yb290LCB2aXNpYmxlKVxyXG4gICAgfVxyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50U3Vic2NyaXB0aW9uXHJcbntcclxuICAgIGNhbmNlbCgpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRDYWxsYmFja1xyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudEVtaXR0ZXJcclxue1xyXG4gICAgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvbjtcclxuXHJcbiAgICBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkO1xyXG5cclxuICAgIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlckJhc2Vcclxue1xyXG4gICAgcHJpdmF0ZSBidWNrZXRzOmFueSA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpLnB1c2goY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7IGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgbGV0IGlkeCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYgKCFldmVudC5tYXRjaCgnbW91c2UnKSAmJiAhZXZlbnQubWF0Y2goJ2tleScpICYmICFldmVudC5tYXRjaCgnZHJhZycpKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coZXZlbnQsIC4uLmFyZ3MpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2YgbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENhbGxiYWNrTGlzdChldmVudDpzdHJpbmcpOkV2ZW50Q2FsbGJhY2tbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldHNbZXZlbnRdIHx8ICh0aGlzLmJ1Y2tldHNbZXZlbnRdID0gW10pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUGFkZGluZyB9IGZyb20gJy4uLy4uL2dlb20vUGFkZGluZyc7XHJcbmltcG9ydCB7IERlZmF1bHRHcmlkQ29sdW1uIH0gZnJvbSAnLi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtbic7XHJcbmltcG9ydCB7IERlZmF1bHRHcmlkUm93IH0gZnJvbSAnLi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZFJvdyc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUm93JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxudHlwZSBDZWxsQ29sUm93TG9va3VwID0gT2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZExheW91dFJlZ2lvbjxUPiBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIHJlYWRvbmx5IHJlZjpUO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZExheW91dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbXB1dGUobW9kZWw6R3JpZE1vZGVsLCBwYWRkaW5nOlBhZGRpbmcpOkdyaWRMYXlvdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29sTG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRDb2x1bW4+Pm1vZGVsLmNvbHVtbnMucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCByb3dMb29rdXAgPSA8T2JqZWN0SW5kZXg8R3JpZFJvdz4+bW9kZWwucm93cy5yZWR1Y2UoKHQsIHgpID0+IHsgdFt4LnJlZl0gPSB4OyByZXR1cm4gdCB9LCB7fSk7XHJcbiAgICAgICAgbGV0IGNlbGxMb29rdXAgPSBidWlsZENlbGxMb29rdXAobW9kZWwuY2VsbHMpOyAvL2J5IGNvbCB0aGVuIHJvd1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIGFsbCBleHBlY3RlZCBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgbGV0IG1heENvbCA9IG1vZGVsLmNlbGxzLm1hcCh4ID0+IHguY29sUmVmICsgKHguY29sU3BhbiAtIDEpKS5yZWR1Y2UoKHQsIHgpID0+IHQgPiB4ID8gdCA6IHgsIDApO1xyXG4gICAgICAgIGxldCBtYXhSb3cgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJvd1JlZiArICh4LnJvd1NwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbWlzc2luZyBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Q29sOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAoY29sTG9va3VwW2ldIHx8IChjb2xMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRDb2x1bW4oaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Um93OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAocm93TG9va3VwW2ldIHx8IChyb3dMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRSb3coaSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgd2lkdGggYW5kIGhlaWdodCBvZiB3aG9sZSBncmlkXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy52YWx1ZXMoY29sTG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LndpZHRoLCAwKSArIHBhZGRpbmcuaG9yaXpvbnRhbDtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gXy52YWx1ZXMocm93TG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LmhlaWdodCwgMCkgKyBwYWRkaW5nLnZlcnRpY2FsO1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBsYXlvdXQgcmVnaW9ucyBmb3IgdGhlIHZhcmlvdXMgYml0c1xyXG4gICAgICAgIGxldCBjb2xSZWdzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdID0gW107XHJcbiAgICAgICAgbGV0IHJvd1JlZ3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10gPSBbXTtcclxuICAgICAgICBsZXQgY2VsbFJlZ3M6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGFjY0xlZnQgPSBwYWRkaW5nLmxlZnQ7XHJcbiAgICAgICAgZm9yIChsZXQgY2kgPSAwOyBjaSA8PSBtYXhDb2w7IGNpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY29sID0gY29sTG9va3VwW2NpXTtcclxuXHJcbiAgICAgICAgICAgIGNvbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByZWY6IGNvbC5yZWYsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGNvbC53aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhY2NUb3AgPSBwYWRkaW5nLnRvcDtcclxuICAgICAgICAgICAgZm9yIChsZXQgcmkgPSAwOyByaSA8PSBtYXhSb3c7IHJpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCByb3cgPSByb3dMb29rdXBbcmldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6IHJvdy5yZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogYWNjVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm93LmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbExvb2t1cFtjaV0gIT09IHVuZGVmaW5lZCAmJiBjZWxsTG9va3VwW2NpXVtyaV0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IGNlbGxMb29rdXBbY2ldW3JpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogY2VsbC5yZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGFjY0xlZnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogYWNjVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogY29sLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHJvdy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYWNjVG9wICs9IHJvdy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFjY0xlZnQgKz0gY29sLndpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkTGF5b3V0KHdpZHRoLCBoZWlnaHQsIGNvbFJlZ3MsIHJvd1JlZ3MsIGNlbGxSZWdzLCBjZWxsTG9va3VwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGhlaWdodDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXTtcclxuICAgIHB1YmxpYyByZWFkb25seSByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdO1xyXG5cclxuICAgIHByaXZhdGUgY2VsbExvb2t1cDpDZWxsQ29sUm93TG9va3VwO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5JbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSByb3dJbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSBjZWxsSW5kZXg6T2JqZWN0TWFwPEdyaWRMYXlvdXRSZWdpb248c3RyaW5nPj47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcclxuICAgICAgICB3aWR0aDpudW1iZXIsIFxyXG4gICAgICAgIGhlaWdodDpudW1iZXIsIFxyXG4gICAgICAgIGNvbHVtbnM6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10sXHJcbiAgICAgICAgcm93czpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICBjZWxsczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXSxcclxuICAgICAgICBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gcm93cztcclxuICAgICAgICB0aGlzLmNlbGxzID0gY2VsbHM7XHJcblxyXG4gICAgICAgIHRoaXMuY2VsbExvb2t1cCA9IGNlbGxMb29rdXA7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5JbmRleCA9IF8uaW5kZXgoY29sdW1ucywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5yb3dJbmRleCA9IF8uaW5kZXgocm93cywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5jZWxsSW5kZXggPSBfLmluZGV4KGNlbGxzLCB4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlDb2x1bW4ocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5JbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Um93KHJlZjpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93SW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNlbGwocmVmOnN0cmluZyk6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jZWxsSW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ29sdW1ucyhyZWdpb246UmVjdExpa2UpOm51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uc1xyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gUmVjdC5wcm90b3R5cGUuaW50ZXJzZWN0cy5jYWxsKHgsIHJlZ2lvbikpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVSb3dzKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZUNlbGxzKHJlZ2lvbjpSZWN0TGlrZSk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICBsZXQgY29scyA9IHRoaXMuY2FwdHVyZUNvbHVtbnMocmVnaW9uKTtcclxuICAgICAgICBsZXQgcm93cyA9IHRoaXMuY2FwdHVyZVJvd3MocmVnaW9uKTtcclxuICAgICAgICBsZXQgY2VsbHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNvbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCByIG9mIHJvd3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5jZWxsTG9va3VwW2NdW3JdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhY2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNlbGxzO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZENlbGxMb29rdXAoY2VsbHM6R3JpZENlbGxbXSk6Q2VsbENvbFJvd0xvb2t1cFxyXG57XHJcbiAgICBsZXQgaXggPSB7fTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgIHtcclxuICAgICAgICBsZXQgY2l4ID0gaXhbYy5jb2xSZWZdIHx8IChpeFtjLmNvbFJlZl0gPSB7fSk7XHJcbiAgICAgICAgY2l4W2Mucm93UmVmXSA9IGM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBpeDtcclxufSIsIi8qKlxyXG4gKiBFbWJlZGRpbmcgb2YgQ2xpcGJvYXJkLmpzIC0gaHR0cHM6Ly9naXRodWIuY29tL3plbm9yb2NoYS9jbGlwYm9hcmQuanMvXHJcbiAqXHJcbiAqIEFmdGVyIHZhcmlvdXMgYXR0ZW1wdHMsIEkgd2FzIHVuYWJsZSB0byBucG0gaW5zdGFsbCBpbmNsdWRpbmcgdHlwZXMgZWZmZWN0aXZlbHkgYW5kIGJlY2F1c2UgYW4gaW5kZXguanMgaXMgbm90XHJcbiAqIHVzZWQgSSBjYW5ub3QgdXNlIHRoZSBUeXBlU2NyaXB0IDIuMSB1bmtub3duIG1vZHVsZSBpbXBvcnQsIHNvIHJlc29ydGluZyB0byBsb2NhbCBlbWJlZGRlZCB2ZXJzaW9uLiAgV2lsbCByZW1vdmVcclxuICogaW4gdGhlIGZ1dHVyZSBpZiBwb3NzaWJsZS5cclxuICpcclxuICogTW9kaWZpY2F0aW9ucyBoYXZlIGJlZW4gbWFkZSB0byBtYWtlIHRoZSBjb2RlIGNvbXBpbGU6XHJcbiAqIC0gUmVtb3ZlZCBQcm9taXNlIHBvbHlmaWxsIChpbXBvcnRlZCBpbnN0ZWFkKVxyXG4gKiAtIFJlc3RydWN0dXJlZCBleHBvcnQgYW5kIGFkZGVkIHR5cGVkIGludGVyZmFjZVxyXG4gKiAtIFNvbWUgY2hhbmdlcyB0byBwcmV2ZW50IHR5cGUgY2hlY2tpbmcgd2hlcmUgdW5kZXNpcmVkXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gJ2VzNi1wcm9taXNlJztcclxuXHJcbi8vRGVjbGFyZSB3aW5kb3cgYXMgYW4gYW55IHZhciBhbGlhcyB0byBwcmV2ZW50IFRTIG1vYW5pbmcuLi5cclxubGV0IHduZCA9IHdpbmRvdyBhcyBhbnk7XHJcblxyXG5jb25zdCBjbGlwYm9hcmQgPSB7fSBhcyBhbnk7XHJcblxyXG5jbGlwYm9hcmQuY29weSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX2RhdGEgPSBudWxsOyAvLyBNYXAgZnJvbSBkYXRhIHR5cGUgKGUuZy4gXCJ0ZXh0L2h0bWxcIikgdG8gdmFsdWUuXHJcbiAgICB2YXIgX2JvZ3VzU2VsZWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcclxuICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgX2RhdGEgPSBudWxsO1xyXG4gICAgICAgIGlmIChfYm9ndXNTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY29weVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YShrZXksIF9kYXRhW2tleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXb3JrYXJvdW5kIGZvciBTYWZhcmk6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTY1MjlcclxuICAgIGZ1bmN0aW9uIGJvZ3VzU2VsZWN0KCkge1xyXG4gICAgICAgIHZhciBzZWwgPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAvLyBJZiBcIm5vdGhpbmdcIiBpcyBzZWxlY3RlZC4uLlxyXG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgJiYgc2VsLmlzQ29sbGFwc2VkKSB7XHJcbiAgICAgICAgICAgIC8vIC4uLiB0ZW1wb3JhcmlseSBzZWxlY3QgdGhlIGVudGlyZSBib2R5LlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBXZSBzZWxlY3QgdGhlIGVudGlyZSBib2R5IGJlY2F1c2U6XHJcbiAgICAgICAgICAgIC8vIC0gaXQncyBndWFyYW50ZWVkIHRvIGV4aXN0LFxyXG4gICAgICAgICAgICAvLyAtIGl0IHdvcmtzICh1bmxpa2UsIHNheSwgZG9jdW1lbnQuaGVhZCwgb3IgcGhhbnRvbSBlbGVtZW50IHRoYXQgaXNcclxuICAgICAgICAgICAgLy8gICBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NKSxcclxuICAgICAgICAgICAgLy8gLSBpdCBkb2Vzbid0IHNlZW0gdG8gZmxpY2tlciAoZHVlIHRvIHRoZSBzeW5jaHJvbm91cyBjb3B5IGV2ZW50KSwgYW5kXHJcbiAgICAgICAgICAgIC8vIC0gaXQgYXZvaWRzIG1vZGlmeWluZyB0aGUgRE9NIChjYW4gdHJpZ2dlciBtdXRhdGlvbiBvYnNlcnZlcnMpLlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIHdlIGNhbid0IGRvIHByb3BlciBmZWF0dXJlIGRldGVjdGlvbiAod2UgYWxyZWFkeSBjaGVja2VkXHJcbiAgICAgICAgICAgIC8vIGRvY3VtZW50LnF1ZXJ5Q29tbWFuZEVuYWJsZWQoXCJjb3B5XCIpICwgd2hpY2ggYWN0dWFsbHkgZ2l2ZXMgYSBmYWxzZVxyXG4gICAgICAgICAgICAvLyBuZWdhdGl2ZSBmb3IgQmxpbmsgd2hlbiBub3RoaW5nIGlzIHNlbGVjdGVkKSBhbmQgVUEgc25pZmZpbmcgaXMgbm90XHJcbiAgICAgICAgICAgIC8vIHJlbGlhYmxlIChhIGxvdCBvZiBVQSBzdHJpbmdzIGNvbnRhaW4gXCJTYWZhcmlcIiksIHRoaXMgd2lsbCBhbHNvXHJcbiAgICAgICAgICAgIC8vIGhhcHBlbiBmb3Igc29tZSBicm93c2VycyBvdGhlciB0aGFuIFNhZmFyaS4gOi0oKVxyXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xyXG4gICAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMoZG9jdW1lbnQuYm9keSk7XHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSB7XCJ0ZXh0L3BsYWluXCI6IGRhdGF9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IHtcInRleHQvaHRtbFwiOiBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYm9ndXNTZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudC5leGVjQ29tbWFuZCBpcyBzeW5jaHJvbm91czogaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC1jbGlwYm9hcmQtYXBpcy0yMDE1MDQyMS8jaW50ZWdyYXRpb24td2l0aC1yaWNoLXRleHQtZWRpdGluZy1hcGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU28gd2UgY2FuIGNhbGwgcmVzb2x2ZVJlZigpIGJhY2sgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNvcHkuIFBlcmhhcHMgaXQncyBub3QgYXZhaWxhYmxlIGluIHlvdXIgYnJvd3Nlcj9cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmNsaXBib2FyZC5wYXN0ZSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX3Jlc29sdmU7XHJcbiAgICB2YXIgX2RhdGFUeXBlO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHZhciByZXNvbHZlID0gX3Jlc29sdmU7XHJcbiAgICAgICAgICAgIF9yZXNvbHZlID0gbnVsbDtcclxuICAgICAgICAgICAgcmVzb2x2ZShlLmNsaXBib2FyZERhdGEuZ2V0RGF0YShfZGF0YVR5cGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIF9pbnRlcmNlcHQgPSB0cnVlO1xyXG4gICAgICAgICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICAgICAgICAgIF9kYXRhVHlwZSA9IGRhdGFUeXBlIHx8IFwidGV4dC9wbGFpblwiO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5leGVjQ29tbWFuZChcInBhc3RlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJVbmFibGUgdG8gcGFzdGUuIFBhc3Rpbmcgb25seSB3b3JrcyBpbiBJbnRlcm5ldCBFeHBsb3JlciBhdCB0aGUgbW9tZW50LlwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLy8gSGFuZGxlIElFIGJlaGF2aW91ci5cclxuaWYgKHR5cGVvZiBDbGlwYm9hcmRFdmVudCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgdHlwZW9mIHduZC5jbGlwYm9hcmREYXRhICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG5cclxuICAgIGNsaXBib2FyZC5jb3B5ID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgLy8gSUUgc3VwcG9ydHMgc3RyaW5nIGFuZCBVUkwgdHlwZXM6IGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzY3NDQodj12cy44NSkuYXNweFxyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHN1cHBvcnQgdGhlIHN0cmluZyB0eXBlIGZvciBub3cuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIiAmJiAhKFwidGV4dC9wbGFpblwiIGluIGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBwcm92aWRlIGEgdGV4dC9wbGFpbiB0eXBlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0ckRhdGEgPSAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogZGF0YVtcInRleHQvcGxhaW5cIl0pO1xyXG4gICAgICAgICAgICB2YXIgY29weVN1Y2NlZWRlZCA9IHduZC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJUZXh0XCIsIHN0ckRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoY29weVN1Y2NlZWRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcHlpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY2xpcGJvYXJkLnBhc3RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9IHduZC5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJUZXh0XCIpO1xyXG4gICAgICAgICAgICBpZiAoc3RyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzdHJEYXRhKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIHJlamVjdGVkIHRoZSBwYXN0ZSByZXF1ZXN0LlxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlBhc3Rpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpcGJvYXJkT2JqZWN0XHJcbntcclxuICAgIGNvcHkodmFsOnN0cmluZ3xFbGVtZW50KTpQcm9taXNlPHZvaWQ+O1xyXG4gICAgcGFzdGUoKTpQcm9taXNlPHN0cmluZz47XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBDbGlwYm9hcmQgPSBjbGlwYm9hcmQ7Il19
