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
 * @version   4.0.5
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
      value = null;
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
var Point_1 = require("./geom/Point");
var Rect_1 = require("./geom/Rect");
var DefaultGridCell_1 = require("./model/default/DefaultGridCell");
var DefaultGridColumn_1 = require("./model/default/DefaultGridColumn");
var DefaultGridModel_1 = require("./model/default/DefaultGridModel");
var DefaultGridRow_1 = require("./model/default/DefaultGridRow");
var Style_1 = require("./model/styled/Style");
var StyledGridCell_1 = require("./model/styled/StyledGridCell");
var GridRange_1 = require("./model/GridRange");
var GridElement_1 = require("./ui/GridElement");
var GridKernel_1 = require("./ui/GridKernel");
var Widget_1 = require("./ui/Widget");
var EventEmitter_1 = require("./ui/internal/EventEmitter");
var Extensibility_1 = require("./ui/Extensibility");
var ClipboardExtension_1 = require("./extensions/common/ClipboardExtension");
var EditingExtension_1 = require("./extensions/common/EditingExtension");
var ScrollerExtension_1 = require("./extensions/common/ScrollerExtension");
var SelectorExtension_1 = require("./extensions/common/SelectorExtension");
var HistoryExtension_1 = require("./extensions/history/HistoryExtension");
var HistoryManager_1 = require("./extensions/history/HistoryManager");
var ComputeExtension_1 = require("./extensions/compute/ComputeExtension");
var JavaScriptComputeEngine_1 = require("./extensions/compute/JavaScriptComputeEngine");
var WatchManager_1 = require("./extensions/compute/WatchManager");
var ClickZoneExtension_1 = require("./extensions/extra/ClickZoneExtension");
var Base26_1 = require("./misc/Base26");
(function (ext) {
    ext.ClipboardExtension = ClipboardExtension_1.ClipboardExtension;
    ext.EditingExtension = EditingExtension_1.EditingExtension;
    ext.ScrollerExtension = ScrollerExtension_1.ScrollerExtension;
    ext.SelectorExtension = SelectorExtension_1.SelectorExtension;
    ext.HistoryExtension = HistoryExtension_1.HistoryExtension;
    ext.DefaultHistoryManager = HistoryManager_1.DefaultHistoryManager;
    ext.ComputeExtension = ComputeExtension_1.ComputeExtension;
    ext.JavaScriptComputeEngine = JavaScriptComputeEngine_1.JavaScriptComputeEngine;
    ext.WatchManager = WatchManager_1.WatchManager;
    ext.ClickZoneExtension = ClickZoneExtension_1.ClickZoneExtension;
    ext.Point = Point_1.Point;
    ext.Rect = Rect_1.Rect;
    ext.Base26 = Base26_1.Base26;
    ext.DefaultGridCell = DefaultGridCell_1.DefaultGridCell;
    ext.DefaultGridColumn = DefaultGridColumn_1.DefaultGridColumn;
    ext.DefaultGridModel = DefaultGridModel_1.DefaultGridModel;
    ext.DefaultGridRow = DefaultGridRow_1.DefaultGridRow;
    ext.Style = Style_1.Style;
    ext.StyledGridCell = StyledGridCell_1.StyledGridCell;
    ext.GridChangeSet = EditingExtension_1.GridChangeSet;
    ext.GridRange = GridRange_1.GridRange;
    ext.GridElement = GridElement_1.GridElement;
    ext.GridKernel = GridKernel_1.GridKernel;
    ext.AbsWidgetBase = Widget_1.AbsWidgetBase;
    ext.EventEmitterBase = EventEmitter_1.EventEmitterBase;
    ext.command = Extensibility_1.command;
    ext.variable = Extensibility_1.variable;
    ext.routine = Extensibility_1.routine;
    ext.renderer = Extensibility_1.renderer;
    ext.visualize = Extensibility_1.visualize;
})(window['cattle'] || (window['cattle'] = {}));
},{"./extensions/common/ClipboardExtension":7,"./extensions/common/EditingExtension":8,"./extensions/common/ScrollerExtension":9,"./extensions/common/SelectorExtension":10,"./extensions/compute/ComputeExtension":11,"./extensions/compute/JavaScriptComputeEngine":12,"./extensions/compute/WatchManager":13,"./extensions/extra/ClickZoneExtension":14,"./extensions/history/HistoryExtension":15,"./extensions/history/HistoryManager":16,"./geom/Point":18,"./geom/Rect":19,"./misc/Base26":28,"./model/GridRange":33,"./model/default/DefaultGridCell":34,"./model/default/DefaultGridColumn":35,"./model/default/DefaultGridModel":36,"./model/default/DefaultGridRow":37,"./model/styled/Style":38,"./model/styled/StyledGridCell":39,"./ui/Extensibility":40,"./ui/GridElement":41,"./ui/GridKernel":42,"./ui/Widget":43,"./ui/internal/EventEmitter":44}],7:[function(require,module,exports){
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
},{"../../geom/Point":18,"../../geom/Rect":19,"../../input/KeyInput":23,"../../misc/Dom":29,"../../misc/Util":32,"../../model/GridRange":33,"../../ui/Extensibility":40,"../../ui/Widget":43,"../../vendor/clipboard":46,"./EditingExtension":8,"papaparse":3,"tether":5}],8:[function(require,module,exports){
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
},{"../../geom/Point":18,"../../input/KeyInput":23,"../../input/MouseInput":27,"../../misc/Dom":29,"../../misc/Util":32,"../../ui/Extensibility":40,"../../ui/Widget":43,"tether":5}],9:[function(require,module,exports){
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
},{"../../geom/Padding":17,"../../geom/Point":18,"../../misc/Dom":29,"../../misc/Util":32}],10:[function(require,module,exports){
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
},{"../../geom/Point":18,"../../geom/Rect":19,"../../input/KeyInput":23,"../../input/MouseDragEventSupport":25,"../../input/MouseInput":27,"../../misc/Dom":29,"../../ui/Extensibility":40,"../../ui/Widget":43,"tether":5}],11:[function(require,module,exports){
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
},{"../../misc/Util":32,"../../model/GridRange":33,"../common/EditingExtension":8,"./WatchManager":13}],13:[function(require,module,exports){
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
},{"../../geom/Point":18,"../../geom/Rect":19,"../../misc/Dom":29,"tether":5}],15:[function(require,module,exports){
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
},{"../../input/KeyInput":23,"../../misc/Util":32,"../../ui/Extensibility":40,"../common/EditingExtension":8,"./HistoryManager":16}],16:[function(require,module,exports){
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
},{"../misc/Util":32}],18:[function(require,module,exports){
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
        var points = [].concat.apply([], rects.map(function (x) { return Rect.prototype.points.call(x); }));
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
    Rect.prototype.extend = function (size) {
        var pt = Point_1.Point.create(size);
        return new Rect(this.left, this.top, this.width + pt.x, this.height + pt.y);
    };
    Rect.prototype.inflate = function (size) {
        var pt = Point_1.Point.create(size);
        return Rect.fromEdges(this.left - pt.x, this.top - pt.y, this.right + pt.x, this.bottom + pt.y);
    };
    Rect.prototype.offset = function (by) {
        var pt = Point_1.Point.create(by);
        return new Rect(this.left + pt.x, this.top + pt.y, this.width, this.height);
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
},{"../misc/Util":32}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{"./Keys":24}],23:[function(require,module,exports){
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
},{"./EventTargetEventEmitterAdapter":20,"./KeyExpression":22}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{"../geom/Point":18}],26:[function(require,module,exports){
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
},{"../misc/Util":32,"./KeyCheck":21,"./Keys":24}],27:[function(require,module,exports){
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
},{"./EventTargetEventEmitterAdapter":20,"./KeyCheck":21,"./MouseExpression":26}],28:[function(require,module,exports){
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
},{"bases":1}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
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
},{"../geom/Point":18,"../geom/Rect":19,"../misc/Base26":28,"../misc/Util":32}],34:[function(require,module,exports){
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
},{"../../misc/RefGen":31,"../../misc/Util":32,"../../ui/Extensibility":40}],35:[function(require,module,exports){
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
},{}],36:[function(require,module,exports){
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
},{"../../misc/Util":32,"./DefaultGridCell":34}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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
},{"../../misc/Util":32}],39:[function(require,module,exports){
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
},{"../../geom/Point":18,"../../ui/Extensibility":40,"../default/DefaultGridCell":34,"./Style":38}],40:[function(require,module,exports){
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
},{}],41:[function(require,module,exports){
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
        var dest;
        if (ptOrRect['width'] === undefined && ptOrRect['height'] === undefined) {
            dest = new Rect_1.Rect(ptOrRect['x'], ptOrRect['y'], 1, 1);
        }
        else {
            dest = Rect_1.Rect.fromLike(ptOrRect);
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
    GridElement.prototype.computeViewFragments = function () {
        var _a = this, freezeMargin = _a.freezeMargin, layout = _a.layout;
        var make = function (l, t, w, h, ol, ot) { return ({
            left: l,
            top: t,
            width: w,
            height: h,
            offsetLeft: ol,
            offsetTop: ot,
        }); };
        var viewport = this.computeViewport();
        if (freezeMargin.equals(Point_1.Point.empty)) {
            return [make(viewport.left, viewport.top, viewport.width, viewport.height, 0, 0)];
        }
        else {
            var marginLeft = layout.queryColumnRange(0, freezeMargin.x).width;
            var marginTop = layout.queryRowRange(0, freezeMargin.y).height;
            var margin = new Point_1.Point(marginLeft, marginTop);
            //Aliases to prevent massive lines;
            var vp = viewport;
            var mg = margin;
            return [
                make(vp.left + mg.x, vp.top + mg.y, vp.width - mg.x, vp.height - mg.y, mg.x, mg.y),
                make(0, vp.top + mg.y, mg.x, vp.height - mg.y, 0, mg.y),
                make(vp.left + mg.x, 0, vp.width - mg.x, mg.y, mg.x, 0),
                make(0, 0, mg.x, mg.y, 0, 0),
            ];
        }
    };
    GridElement.prototype.computeViewport = function () {
        return new Rect_1.Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    };
    GridElement.prototype.updateVisuals = function () {
        console.time('GridElement.drawVisuals');
        var _a = this, model = _a.model, layout = _a.layout;
        var fragments = this.computeViewFragments();
        console.log(fragments);
        var prevFrame = this.frame;
        var nextFrame = [];
        //If the fragments have changed, nerf the prevFrame since we don't want to recycle anything.
        if (!prevFrame || prevFrame.length != fragments.length) {
            prevFrame = [];
        }
        for (var i = 0; i < fragments.length; i++) {
            var prevAspect = prevFrame[i];
            var aspect = {
                view: fragments[i],
                visuals: {},
            };
            var viewCells = layout.captureCells(aspect.view)
                .map(function (ref) { return model.findCell(ref); });
            for (var _i = 0, viewCells_1 = viewCells; _i < viewCells_1.length; _i++) {
                var cell = viewCells_1[_i];
                var region = layout.queryCell(cell.ref);
                var visual = !!prevAspect ? prevAspect.visuals[cell.ref] : null;
                // If we didn't have a previous visual or if the cell was dirty, create new visual
                if (!visual || cell.value !== visual.value || cell['__dirty'] !== false) {
                    aspect.visuals[cell.ref] = this.createVisual(cell, region);
                    delete this.buffers[cell.ref];
                    cell['__dirty'] = false;
                }
                else {
                    aspect.visuals[cell.ref] = visual;
                }
            }
            nextFrame.push(aspect);
        }
        this.frame = nextFrame;
        // setTimeout(() =>
        // {
        //     let gfx = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
        //     gfx.save();
        //     for (let f of fragments) 
        //     {
        //         //gfx.translate(f.left * -1, f.top * -1);
        //         gfx.strokeStyle = 'red';
        //         gfx.strokeRect(f.offsetLeft, f.offsetTop, f.width, f.height);            
        //     }
        //     gfx.restore();
        // }, 50);
    };
    GridElement.prototype.updateVisuals2 = function () {
        var _this = this;
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
        //let frozenCells = layout.captureCells(viewport.inflate)
        var fm = this.freezeMargin;
        var fragments = [];
        fragments.push(viewport);
        fragments.push(new Rect_1.Rect(0, 0, layout.queryColumnRange(0, fm.x).width, layout.queryRowRange(0, fm.y).height));
        fragments.push(new Rect_1.Rect(0, viewport.top + fragments[1].height, fragments[1].width, (viewport.height - fragments[1].height)));
        fragments.push(new Rect_1.Rect(viewport.left + fragments[1].width, 0, viewport.width - fragments[1].width, fragments[1].height));
        setTimeout(function () {
            var gfx = _this.canvas.getContext('2d', { alpha: true });
            gfx.save();
            gfx.translate(viewport.left * -1, viewport.top * -1);
            for (var _i = 0, fragments_1 = fragments; _i < fragments_1.length; _i++) {
                var f = fragments_1[_i];
                gfx.strokeStyle = 'red';
                gfx.strokeRect(f.left, f.top, f.width, f.height);
            }
            gfx.restore();
        }, 50);
        fragments.splice(0, 1);
        fragments[0]['m'] = function (r, v) { v.left = r.left + viewport.left; v.top = r.top + viewport.top; };
        fragments[1]['m'] = function (r, v) { return v.left = r.left + viewport.left; };
        fragments[2]['m'] = function (r, v) { return v.top = r.top + viewport.top; };
        nextFrame = {};
        for (var _b = 0, _c = fragments.reverse(); _b < _c.length; _b++) {
            var f = _c[_b];
            var fragmentCells = layout.captureCells(f)
                .map(function (ref) { return model.findCell(ref); });
            var prevFrame_1 = this.visuals;
            for (var _d = 0, fragmentCells_1 = fragmentCells; _d < fragmentCells_1.length; _d++) {
                var cell = fragmentCells_1[_d];
                var region = layout.queryCell(cell.ref);
                var visual = prevFrame_1[cell.ref] || nextFrame[cell.ref];
                // If we didn't have a previous visual or if the cell was dirty, create new visual
                if (!visual || cell.value !== visual.value || cell['__dirty'] !== false) {
                    nextFrame[cell.ref] = visual = this.createVisual(cell, region);
                    delete this.buffers[cell.ref];
                    cell['__dirty'] = false;
                }
                else {
                    nextFrame[cell.ref] = visual;
                }
                f['m'](region, visual);
            }
        }
        console.log(fragments);
        this.visuals = nextFrame;
        console.timeEnd('GridElement.updateVisuals');
    };
    GridElement.prototype.drawVisuals = function () {
        var _a = this, canvas = _a.canvas, model = _a.model, frame = _a.frame;
        console.time('GridElement.drawVisuals');
        var gfx = canvas.getContext('2d', { alpha: true });
        gfx.clearRect(0, 0, canvas.width, canvas.height);
        for (var _i = 0, frame_1 = frame; _i < frame_1.length; _i++) {
            var aspect = frame_1[_i];
            var view = Rect_1.Rect.fromLike(aspect.view);
            gfx.save();
            gfx.translate(aspect.view.offsetLeft, aspect.view.offsetTop);
            gfx.translate(aspect.view.left * -1, aspect.view.top * -1);
            for (var cr in aspect.visuals) {
                var cell = model.findCell(cr);
                var visual = aspect.visuals[cr];
                if (visual.width == 0 || visual.height == 0) {
                    continue;
                }
                if (!view.intersects(visual)) {
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
        }
        console.timeEnd('GridElement.drawVisuals');
    };
    GridElement.prototype.drawVisuals2 = function () {
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
    Property_1.property(new Point_1.Point(0, 0), function (t) { return t.invalidate(); }),
    __metadata("design:type", Point_1.Point)
], GridElement.prototype, "freezeMargin", void 0);
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
},{"../geom/Padding":17,"../geom/Point":18,"../geom/Rect":19,"../misc/Property":30,"../misc/Util":32,"../model/GridRange":33,"../model/default/DefaultGridModel":36,"./GridKernel":42,"./internal/EventEmitter":44,"./internal/GridLayout":45}],42:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
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
},{"../geom/Rect":19,"../misc/Dom":29}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
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
    GridLayout.prototype.queryColumnRange = function (fromRef, toRefEx) {
        var likes = [];
        for (var i = fromRef; i < toRefEx; i++) {
            likes.push(this.queryColumn(i));
        }
        return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
    };
    GridLayout.prototype.queryRow = function (ref) {
        return this.rowIndex[ref] || null;
    };
    GridLayout.prototype.queryRowRange = function (fromRef, toRefEx) {
        var likes = [];
        for (var i = fromRef; i < toRefEx; i++) {
            likes.push(this.queryRow(i));
        }
        return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
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
},{"../../geom/Rect":19,"../../misc/Util":32,"../../model/default/DefaultGridColumn":35,"../../model/default/DefaultGridRow":37}],46:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZXMvYmFzZXMuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXRoZXIvZGlzdC9qcy90ZXRoZXIuanMiLCJzcmMvYnJvd3Nlci50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9DbGlwYm9hcmRFeHRlbnNpb24udHMiLCJzcmMvZXh0ZW5zaW9ucy9jb21tb24vRWRpdGluZ0V4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9TY3JvbGxlckV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9TZWxlY3RvckV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUudHMiLCJzcmMvZXh0ZW5zaW9ucy9jb21wdXRlL1dhdGNoTWFuYWdlci50cyIsInNyYy9leHRlbnNpb25zL2V4dHJhL0NsaWNrWm9uZUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeU1hbmFnZXIudHMiLCJzcmMvZ2VvbS9QYWRkaW5nLnRzIiwic3JjL2dlb20vUG9pbnQudHMiLCJzcmMvZ2VvbS9SZWN0LnRzIiwic3JjL2lucHV0L0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlci50cyIsInNyYy9pbnB1dC9LZXlDaGVjay50cyIsInNyYy9pbnB1dC9LZXlFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L0tleUlucHV0LnRzIiwic3JjL2lucHV0L0tleXMudHMiLCJzcmMvaW5wdXQvTW91c2VEcmFnRXZlbnRTdXBwb3J0LnRzIiwic3JjL2lucHV0L01vdXNlRXhwcmVzc2lvbi50cyIsInNyYy9pbnB1dC9Nb3VzZUlucHV0LnRzIiwic3JjL21pc2MvQmFzZTI2LnRzIiwic3JjL21pc2MvRG9tLnRzIiwic3JjL21pc2MvUHJvcGVydHkudHMiLCJzcmMvbWlzYy9SZWZHZW4udHMiLCJzcmMvbWlzYy9VdGlsLnRzIiwic3JjL21vZGVsL0dyaWRSYW5nZS50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93LnRzIiwic3JjL21vZGVsL3N0eWxlZC9TdHlsZS50cyIsInNyYy9tb2RlbC9zdHlsZWQvU3R5bGVkR3JpZENlbGwudHMiLCJzcmMvdWkvRXh0ZW5zaWJpbGl0eS50cyIsInNyYy91aS9HcmlkRWxlbWVudC50cyIsInNyYy91aS9HcmlkS2VybmVsLnRzIiwic3JjL3VpL1dpZGdldC50cyIsInNyYy91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXIudHMiLCJzcmMvdWkvaW50ZXJuYWwvR3JpZExheW91dC50cyIsInNyYy92ZW5kb3IvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcG9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbnhEQSxzQ0FBbUM7QUFDbkMsb0NBQWlDO0FBQ2pDLG1FQUFnRTtBQUNoRSx1RUFBb0U7QUFDcEUscUVBQWtFO0FBQ2xFLGlFQUE4RDtBQUM5RCw4Q0FBMkM7QUFDM0MsZ0VBQTZEO0FBQzdELCtDQUE0QztBQUM1QyxnREFBNkM7QUFDN0MsOENBQTJDO0FBQzNDLHNDQUEwQztBQUMxQywyREFBNEQ7QUFDNUQsb0RBQW1GO0FBQ25GLDZFQUEwRTtBQUMxRSx5RUFBcUY7QUFDckYsMkVBQXdFO0FBQ3hFLDJFQUF3RTtBQUN4RSwwRUFBdUU7QUFDdkUsc0VBQTBFO0FBRTFFLDBFQUF1RTtBQUN2RSx3RkFBcUY7QUFDckYsa0VBQStEO0FBQy9ELDRFQUF5RTtBQUN6RSx3Q0FBcUM7QUFHckMsQ0FBQyxVQUFTLEdBQU87SUFFYixHQUFHLENBQUMsa0JBQWtCLEdBQUcsdUNBQWtCLENBQUM7SUFDNUMsR0FBRyxDQUFDLGdCQUFnQixHQUFHLG1DQUFnQixDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxxQ0FBaUIsQ0FBQztJQUMxQyxHQUFHLENBQUMsaUJBQWlCLEdBQUcscUNBQWlCLENBQUM7SUFDMUMsR0FBRyxDQUFDLGdCQUFnQixHQUFHLG1DQUFnQixDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxxQkFBcUIsR0FBRyxzQ0FBcUIsQ0FBQztJQUNsRCxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsbUNBQWdCLENBQUM7SUFDeEMsR0FBRyxDQUFDLHVCQUF1QixHQUFHLGlEQUF1QixDQUFDO0lBQ3RELEdBQUcsQ0FBQyxZQUFZLEdBQUcsMkJBQVksQ0FBQztJQUNoQyxHQUFHLENBQUMsa0JBQWtCLEdBQUcsdUNBQWtCLENBQUM7SUFDNUMsR0FBRyxDQUFDLEtBQUssR0FBRyxhQUFLLENBQUM7SUFDbEIsR0FBRyxDQUFDLElBQUksR0FBRyxXQUFJLENBQUM7SUFDaEIsR0FBRyxDQUFDLE1BQU0sR0FBRyxlQUFNLENBQUM7SUFDcEIsR0FBRyxDQUFDLGVBQWUsR0FBRyxpQ0FBZSxDQUFDO0lBQ3RDLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxxQ0FBaUIsQ0FBQztJQUMxQyxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsbUNBQWdCLENBQUM7SUFDeEMsR0FBRyxDQUFDLGNBQWMsR0FBRywrQkFBYyxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsYUFBSyxDQUFDO0lBQ2xCLEdBQUcsQ0FBQyxjQUFjLEdBQUcsK0JBQWMsQ0FBQztJQUNwQyxHQUFHLENBQUMsYUFBYSxHQUFHLGdDQUFhLENBQUM7SUFDbEMsR0FBRyxDQUFDLFNBQVMsR0FBRyxxQkFBUyxDQUFDO0lBQzFCLEdBQUcsQ0FBQyxXQUFXLEdBQUcseUJBQVcsQ0FBQztJQUM5QixHQUFHLENBQUMsVUFBVSxHQUFHLHVCQUFVLENBQUM7SUFDNUIsR0FBRyxDQUFDLGFBQWEsR0FBRyxzQkFBYSxDQUFDO0lBQ2xDLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRywrQkFBZ0IsQ0FBQztJQUN4QyxHQUFHLENBQUMsT0FBTyxHQUFHLHVCQUFPLENBQUM7SUFDdEIsR0FBRyxDQUFDLFFBQVEsR0FBRyx3QkFBUSxDQUFDO0lBQ3hCLEdBQUcsQ0FBQyxPQUFPLEdBQUcsdUJBQU8sQ0FBQztJQUN0QixHQUFHLENBQUMsUUFBUSxHQUFHLHdCQUFRLENBQUM7SUFDeEIsR0FBRyxDQUFDLFNBQVMsR0FBRyx5QkFBUyxDQUFDO0FBRTlCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdEaEQsdURBQW1EO0FBRW5ELG1EQUFrRDtBQUNsRCxpREFBZ0Q7QUFDaEQsd0NBQXVDO0FBQ3ZDLDBDQUF5QztBQUV6QywwQ0FBZ0Q7QUFDaEQsd0RBQW9FO0FBQ3BFLG9EQUFtRDtBQUNuRCxtQ0FBcUM7QUFDckMsb0NBQXNDO0FBQ3RDLGdDQUFrQztBQUNsQywrQkFBaUM7QUFHakMsY0FBYztBQUNkLElBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBRXRGO0lBQUE7UUFLWSxhQUFRLEdBQVksRUFBRSxDQUFDO1FBQ3ZCLGNBQVMsR0FBYSxxQkFBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBaUxwRCxDQUFDO0lBNUtVLGlDQUFJLEdBQVgsVUFBWSxJQUFnQjtRQUE1QixpQkFjQztRQVpHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLG1CQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDbEIsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFDLENBQWUsSUFBSyxPQUFBLEtBQUksQ0FBQyxhQUFhLEVBQUUsRUFBcEIsQ0FBb0IsQ0FBQyxDQUNoRTtRQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVoRSxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLFFBQVEsRUFBRSxFQUFmLENBQWUsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsRUFBRSxFQUFoQixDQUFnQixDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsRUFBRSxFQUFoQixDQUFnQixDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELHNCQUFZLCtDQUFlO2FBQTNCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM3RCxDQUFDOzs7T0FBQTtJQUVELHNCQUFZLHlDQUFTO2FBQXJCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkQsQ0FBQzs7O09BQUE7SUFFTywyQ0FBYyxHQUF0QixVQUF1QixNQUFrQjtRQUVyQyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDO1FBQy9CLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUMvRCxNQUFNLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFakQsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUM7WUFDZixPQUFPLEVBQUUsS0FBSztZQUNkLE1BQU0sRUFBRSxNQUFNO1lBQ2QsVUFBVSxFQUFFLGVBQWU7WUFDM0IsZ0JBQWdCLEVBQUUsZUFBZTtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLE1BQU0sR0FBRztZQUNULEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUM7UUFFRixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0IsTUFBTSxFQUFFLENBQUM7UUFFVCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUdPLDBDQUFhLEdBQXJCO1FBRUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFHTyxzQ0FBUyxHQUFqQjtRQUVJLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFHTyxtQ0FBTSxHQUFkLFVBQWUsS0FBYyxFQUFFLFNBQXVCO1FBQXZCLDBCQUFBLEVBQUEsZ0JBQXVCO1FBRWxELElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRWQsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ2QsTUFBTSxDQUFDO1FBRVgsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDekMsQ0FBQztZQUNHLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckIsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDcEIsQ0FBQztnQkFDRyxJQUFJLElBQUksT0FBTyxDQUFDO2dCQUNoQixFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFaEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUNqRSxDQUFDO2dCQUNHLElBQUksSUFBSSxTQUFTLENBQUM7WUFDdEIsQ0FBQztRQUNMLENBQUM7UUFFRCxxQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBR08sb0NBQU8sR0FBZixVQUFnQixJQUFXO1FBRW5CLElBQUEsU0FBMEIsRUFBeEIsY0FBSSxFQUFFLHdCQUFTLENBQVU7UUFFL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQztRQUVYLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO1lBQzFCLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsU0FBUztTQUN4RCxDQUFDLENBQUM7UUFFSCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUF6QyxDQUF5QyxDQUFDLENBQUM7UUFDOUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2IsTUFBTSxDQUFDO1FBRVgsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxFQUFSLENBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM5QyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLElBQUksV0FBVyxHQUFHLElBQUksYUFBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BFLElBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxhQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFMUQsSUFBSSxVQUFVLEdBQUcscUJBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFdkUsSUFBSSxPQUFPLEdBQUcsSUFBSSxnQ0FBYSxFQUFFLENBQUM7UUFDbEMsR0FBRyxDQUFDLENBQWEsVUFBYyxFQUFkLEtBQUEsVUFBVSxDQUFDLEdBQUcsRUFBZCxjQUFjLEVBQWQsSUFBYztZQUExQixJQUFJLElBQUksU0FBQTtZQUVULElBQUksRUFBRSxHQUFHLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuRSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVPLHFDQUFRLEdBQWhCO1FBRVEsSUFBQSxTQUFrQyxFQUFoQyxjQUFJLEVBQUUsc0JBQVEsRUFBRSxvQkFBTyxDQUFVO1FBRXZDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FDcEIsQ0FBQztZQUNHLHFDQUFxQztZQUNyQyxJQUFJLE9BQU8sR0FBRyxXQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUMsQ0FBQztZQUN4RSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQixDQUFDO0lBQ0wsQ0FBQztJQUVPLDBDQUFhLEdBQXJCLFVBQXNCLENBQWdCO1FBRWxDLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDaEMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUNYLENBQUM7WUFDRyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3JCLEtBQUssQ0FBQztZQUVWLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDO1FBQzFCLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNKLE1BQU0sQ0FBQztRQUVYLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pELEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUN4QyxDQUFDO1lBQ0csSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixDQUFDO0lBQ0wsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0F2TEEsQUF1TEMsSUFBQTtBQTlLRztJQURDLHdCQUFRLEVBQUU7OEJBQ0ssT0FBTzttREFBQztBQXVEeEI7SUFEQyx1QkFBTyxFQUFFOzs7O3VEQUtUO0FBR0Q7SUFEQyx1QkFBTyxFQUFFOzs7O21EQUtUO0FBR0Q7SUFEQyx1QkFBTyxFQUFFOzs7O2dEQThCVDtBQUdEO0lBREMsdUJBQU8sRUFBRTs7OztpREFvQ1Q7QUFqSlEsZ0RBQWtCO0FBeUwvQjtJQUE2QiwyQkFBNkI7SUFBMUQ7O0lBaUJBLENBQUM7SUFmaUIsY0FBTSxHQUFwQixVQUFxQixTQUFxQjtRQUV0QyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsd0JBQXdCLENBQUM7UUFDMUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU1QixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRTtZQUNWLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLElBQUksRUFBRSxLQUFLO1lBQ1gsR0FBRyxFQUFFLEtBQUs7WUFDVixPQUFPLEVBQUUsTUFBTTtTQUNsQixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNMLGNBQUM7QUFBRCxDQWpCQSxBQWlCQyxDQWpCNEIsc0JBQWEsR0FpQnpDO0FBakJZLDBCQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3ZNcEIsaURBQWdEO0FBQ2hELHFEQUFvRDtBQUNwRCwwQ0FBeUM7QUFFekMsd0NBQXlDO0FBQ3pDLDBDQUF3RDtBQUN4RCx3REFBb0U7QUFDcEUsK0JBQWlDO0FBQ2pDLG9DQUFzQztBQUd0QyxJQUFNLE9BQU8sR0FBRztJQUNaLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkIsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUN0QixDQUFDO0FBMEJGO0lBQUE7UUFFWSxTQUFJLEdBQWdDLEVBQUUsQ0FBQztJQXdDbkQsQ0FBQztJQXRDVSxnQ0FBUSxHQUFmO1FBRUksTUFBTSxDQUFDLGFBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLDJCQUFHLEdBQVYsVUFBVyxHQUFVO1FBRWpCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDN0MsQ0FBQztJQUVNLDJCQUFHLEdBQVYsVUFBVyxHQUFVLEVBQUUsS0FBWSxFQUFFLFFBQWlCO1FBRWxELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7WUFDYixHQUFHLEVBQUUsR0FBRztZQUNSLEtBQUssRUFBRSxLQUFLO1lBQ1osUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRO1NBQ3ZCLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSw0QkFBSSxHQUFYO1FBRUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTSwrQkFBTyxHQUFkLFVBQWUsS0FBZTtRQUUxQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTthQUNqQixHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDO1lBQ1AsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUMzQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7WUFDZCxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVE7U0FDdkIsQ0FBQyxFQUpRLENBSVIsQ0FBQzthQUNGLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBcEMsQ0FBb0MsQ0FBQyxDQUNyRDtJQUNMLENBQUM7SUFDTCxvQkFBQztBQUFELENBMUNBLEFBMENDLElBQUE7QUExQ1ksc0NBQWE7QUFrRDFCO0lBQUE7UUFRWSxjQUFTLEdBQVcsS0FBSyxDQUFDO1FBQzFCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztJQWtMdEMsQ0FBQztJQWhMVSwrQkFBSSxHQUFYLFVBQVksSUFBZ0IsRUFBRSxNQUFpQjtRQUEvQyxpQkFnQ0M7UUE5QkcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0IsbUJBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7YUFDeEIsRUFBRSxDQUFDLFNBQVMsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQzthQUN4QyxFQUFFLENBQUMsUUFBUSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFqQyxDQUFpQyxDQUFDO2FBQ3JELEVBQUUsQ0FBQyxNQUFNLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQWpDLENBQWlDLENBQUM7YUFDbkQsRUFBRSxDQUFDLFlBQVksRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBakMsQ0FBaUMsQ0FBQzthQUN6RCxFQUFFLENBQUMsVUFBVSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFqQyxDQUFpQyxDQUFDO2FBQ3ZELEVBQUUsQ0FBQyxZQUFZLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQWpDLENBQWlDLENBQUM7YUFDekQsRUFBRSxDQUFDLGFBQWEsRUFBRSxjQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUFDLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2hHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsY0FBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFBQyxLQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNuRztRQUVELHVCQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQzFCLEVBQUUsQ0FBQyxjQUFjLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEVBQTdCLENBQTZCLENBQUMsQ0FDM0Q7UUFFRCxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUN2QixFQUFFLENBQUMsU0FBUyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsS0FBSyxFQUFFLEVBQVosQ0FBWSxDQUFDO2FBQ2pDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQWxCLENBQWtCLENBQUMsQ0FDOUM7UUFFRCx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUN6QixFQUFFLENBQUMsa0JBQWtCLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQXBCLENBQW9CLENBQUMsQ0FDdEQ7UUFFRCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFDLENBQW1CLElBQUssT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQS9DLENBQStDLENBQUMsQ0FBQztRQUU5RixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxzQkFBWSw2Q0FBZTthQUEzQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0QsQ0FBQzs7O09BQUE7SUFFRCxzQkFBWSx1Q0FBUzthQUFyQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7OztPQUFBO0lBRU8seUNBQWMsR0FBdEIsVUFBdUIsTUFBa0I7UUFFckMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxLQUFLLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztRQUMvQixHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDL0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWpELElBQUksQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxlQUFlO1lBQzNCLGdCQUFnQixFQUFFLGVBQWU7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLEdBQUc7WUFDVCxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2QixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sRUFBRSxDQUFDO1FBRVQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFJTyxvQ0FBUyxHQUFqQixVQUFrQixRQUFlO1FBRTdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FDbkIsQ0FBQztZQUNHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUVLLElBQUEsa0JBQUssQ0FBVTtRQUNyQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZELEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN0QixDQUFDO1lBQ0csTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLEtBQUssRUFBRSxDQUFDLENBQ2xDLENBQUM7WUFDRyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRWQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUV0QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFJTyxrQ0FBTyxHQUFmLFVBQWdCLE1BQXFCO1FBQXJCLHVCQUFBLEVBQUEsYUFBcUI7UUFFakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFYixJQUFBLFNBQWlDLEVBQS9CLGNBQUksRUFBRSxnQkFBSyxFQUFFLHdCQUFTLENBQVU7UUFDdEMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTNCLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDZCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FDakMsQ0FBQztZQUNHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFL0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU8sNENBQWlCLEdBQXpCLFVBQTBCLE1BQVksRUFBRSxNQUFxQjtRQUFyQix1QkFBQSxFQUFBLGFBQXFCO1FBRXpELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FDekIsQ0FBQztZQUNHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBSU8sZ0NBQUssR0FBYjtRQUVVLElBQUEsMEJBQVMsQ0FBVTtRQUV6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2YsTUFBTSxDQUFDO1FBRVgsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUdPLHdDQUFhLEdBQXJCLFVBQXNCLEtBQWMsRUFBRSxZQUFnQjtRQUVsRCxJQUFJLE9BQU8sR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ2xDLEdBQUcsQ0FBQyxDQUFZLFVBQUssRUFBTCxlQUFLLEVBQUwsbUJBQUssRUFBTCxJQUFLO1lBQWhCLElBQUksR0FBRyxjQUFBO1lBRVIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBSU8saUNBQU0sR0FBZCxVQUFlLE9BQXFCO1FBRWhDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDckIsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUNwQixDQUFDO1lBQ0csSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO0lBQ0wsQ0FBQztJQUNMLHVCQUFDO0FBQUQsQ0EzTEEsQUEyTEMsSUFBQTtBQXJMRztJQURDLHdCQUFRLEVBQUU7OEJBQ0csS0FBSzsrQ0FBQztBQTZFcEI7SUFGQyx1QkFBTyxFQUFFO0lBQ1QsdUJBQU8sRUFBRTs7OztpREFnQ1Q7QUFJRDtJQUZDLHVCQUFPLEVBQUU7SUFDVCx1QkFBTyxFQUFFOzs7OytDQXNCVDtBQWVEO0lBRkMsdUJBQU8sRUFBRTtJQUNULHVCQUFPLEVBQUU7Ozs7NkNBU1Q7QUFHRDtJQURDLHVCQUFPLEVBQUU7Ozs7cURBVVQ7QUFJRDtJQUZDLHVCQUFPLEVBQUU7SUFDVCx1QkFBTyxFQUFFOztxQ0FDYSxhQUFhOzs4Q0FRbkM7QUExTFEsNENBQWdCO0FBNkw3QjtJQUFvQix5QkFBK0I7SUFBbkQ7O0lBd0RBLENBQUM7SUF0RGlCLFlBQU0sR0FBcEIsVUFBcUIsU0FBcUI7UUFFdEMsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztRQUM5QixTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTVCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO1lBQ1YsYUFBYSxFQUFFLE1BQU07WUFDckIsT0FBTyxFQUFFLE1BQU07WUFDZixRQUFRLEVBQUUsVUFBVTtZQUNwQixJQUFJLEVBQUUsS0FBSztZQUNYLEdBQUcsRUFBRSxLQUFLO1lBQ1YsT0FBTyxFQUFFLEdBQUc7WUFDWixNQUFNLEVBQUUsR0FBRztZQUNYLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLE1BQU07WUFDZixTQUFTLEVBQUUsTUFBTTtTQUNwQixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVNLG9CQUFJLEdBQVgsVUFBWSxRQUFpQixFQUFFLFFBQXVCO1FBQXZCLHlCQUFBLEVBQUEsZUFBdUI7UUFFbEQsaUJBQU0sSUFBSSxZQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXJCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNmLElBQUksRUFBSyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBSTtZQUM5QixHQUFHLEVBQUssUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQUk7WUFDNUIsS0FBSyxFQUFLLFFBQVEsQ0FBQyxLQUFLLE9BQUk7WUFDNUIsTUFBTSxFQUFLLFFBQVEsQ0FBQyxNQUFNLE9BQUk7U0FDakMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLHFCQUFLLEdBQVo7UUFFSSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3JCLFVBQVUsQ0FBQztZQUVQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFTSxtQkFBRyxHQUFWLFVBQVcsS0FBYTtRQUVwQixFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQ3hCLENBQUM7WUFDRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUMzQixDQUFDO0lBQ0wsWUFBQztBQUFELENBeERBLEFBd0RDLENBeERtQixzQkFBYSxHQXdEaEM7QUFFRCxxQkFBcUIsSUFBYTtJQUU5QixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssS0FBSyxDQUFDO0FBQ2xFLENBQUM7Ozs7QUMzVkQsd0NBQTJDO0FBQzNDLDhDQUE2QztBQUM3QywwQ0FBeUM7QUFJekMsb0NBQXNDO0FBR3RDO0lBS0ksMkJBQW9CLGFBQXFCO1FBQXJCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBRXJDLElBQUksQ0FBQyxhQUFhLEdBQUcsZUFBUSxDQUFDLGFBQWEsRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVNLGdDQUFJLEdBQVgsVUFBWSxJQUFnQixFQUFFLE1BQWlCO1FBQS9DLGlCQWNDO1FBWkcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0IsbUVBQW1FO1FBQ25FLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QixJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLGFBQWEsRUFBRSxFQUFwQixDQUFvQixDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxhQUFhLEVBQUUsRUFBcEIsQ0FBb0IsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTywwQ0FBYyxHQUF0QixVQUF1QixNQUFrQjtRQUVyQyw0RkFBNEY7UUFDNUYsNEZBQTRGO1FBQzVGLDJGQUEyRjtRQUMzRiwwRkFBMEY7UUFDMUYsa0JBQWtCO1FBRWxCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3BDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFO1lBQ2YsUUFBUSxFQUFFLE1BQU07U0FDbkIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsYUFBYSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDM0MsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU3QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVPLHlDQUFhLEdBQXJCO1FBRUksSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNyQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBRS9CLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNmLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJO1lBQzlCLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJO1NBQy9CLENBQUMsQ0FBQztRQUVILEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNoQixLQUFLLEVBQUssSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxPQUFJO1lBQ3BELE1BQU0sRUFBSyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLE9BQUk7U0FDekQsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQzVDLENBQUM7WUFDRyxTQUFTLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDM0MsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUMxQyxDQUFDO1lBQ0csU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3pDLENBQUM7SUFDTCxDQUFDO0lBRU8sNkNBQWlCLEdBQXpCO1FBRUksSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNyQixJQUFJLFNBQVMsR0FBRyxJQUFJLGFBQUssQ0FDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUM5QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQ25DLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO2FBQ3ZFLEtBQUssQ0FBQyxhQUFLLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFDTCx3QkFBQztBQUFELENBckZBLEFBcUZDLElBQUE7QUFyRlksOENBQWlCO0FBdUY5QjtJQUVJLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO0lBQ2xDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztJQUM1QixLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsQ0FBQyx3QkFBd0I7SUFFbkUsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFakMsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztJQUN0QyxtQkFBbUI7SUFDbkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBRWhDLGVBQWU7SUFDZixJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUMzQixLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXpCLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFFeEMsY0FBYztJQUNkLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQzNDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckhELGlEQUFnRDtBQUNoRCwwQ0FBb0Q7QUFDcEQsd0NBQWlEO0FBQ2pELHFEQUFvRDtBQUNwRCwyRUFBMEU7QUFDMUUsMENBQXdEO0FBQ3hELHdEQUFvRTtBQUNwRSwrQkFBaUM7QUFDakMsb0NBQXNDO0FBR3RDLElBQU0sT0FBTyxHQUFHO0lBQ1osRUFBRSxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkIsRUFBRSxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNwQixDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQixFQUFFLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQixDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQixFQUFFLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDdEIsQ0FBQztBQW9DRjtJQUFBO1FBT1ksY0FBUyxHQUFXLElBQUksQ0FBQztRQUd6QixjQUFTLEdBQVksRUFBRSxDQUFDO0lBNFRwQyxDQUFDO0lBcFRVLGdDQUFJLEdBQVgsVUFBWSxJQUFnQixFQUFFLE1BQWlCO1FBQS9DLGlCQXFDQztRQW5DRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvQixtQkFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7YUFDYixFQUFFLENBQUMsTUFBTSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUNoRCxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUN0RCxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUN4RCxFQUFFLENBQUMsYUFBYSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUN2RCxFQUFFLENBQUMsV0FBVyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUNyRCxFQUFFLENBQUMsYUFBYSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQzthQUN2RCxFQUFFLENBQUMsbUJBQW1CLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUExQixDQUEwQixDQUFDO2FBQ3pELEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQTFCLENBQTBCLENBQUM7YUFDeEQsRUFBRSxDQUFDLGdCQUFnQixFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBMUIsQ0FBMEIsQ0FBQzthQUN0RCxFQUFFLENBQUMsa0JBQWtCLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUExQixDQUEwQixDQUFDO2FBQ3hELEVBQUUsQ0FBQyxTQUFTLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxTQUFTLEVBQUUsRUFBaEIsQ0FBZ0IsQ0FBQzthQUNyQyxFQUFFLENBQUMsT0FBTyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBNUIsQ0FBNEIsQ0FBQzthQUMvQyxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBN0IsQ0FBNkIsQ0FBQzthQUNyRCxFQUFFLENBQUMsTUFBTSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBNUIsQ0FBNEIsQ0FBQzthQUM5QyxFQUFFLENBQUMsV0FBVyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBN0IsQ0FBNkIsQ0FBQyxDQUN4RDtRQUVELDZDQUFxQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsdUJBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO2FBQ2YsRUFBRSxDQUFDLG9CQUFvQixFQUFFLFVBQUMsQ0FBZ0IsSUFBSyxPQUFBLEtBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBNUMsQ0FBNEMsQ0FBQzthQUM1RixFQUFFLENBQUMsY0FBYyxFQUFFLFVBQUMsQ0FBZ0IsSUFBSyxPQUFBLEtBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBekMsQ0FBeUMsQ0FBQzthQUNuRixFQUFFLENBQUMsY0FBYyxFQUFFLFVBQUMsQ0FBb0IsSUFBSyxPQUFBLEtBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBMUMsQ0FBMEMsQ0FBQzthQUN4RixFQUFFLENBQUMsWUFBWSxFQUFFLFVBQUMsQ0FBb0IsSUFBSyxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsRUFBc0IsRUFBM0MsQ0FBMkMsQ0FBQyxDQUMzRjtRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFwQixDQUFvQixDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQTFCLENBQTBCLENBQUMsQ0FBQztRQUVwRCxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUU7WUFDbkMsR0FBRyxFQUFFLGNBQU0sT0FBQSxDQUFDLENBQUMsS0FBSSxDQUFDLGFBQWEsRUFBcEIsQ0FBb0I7U0FDbEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLDBDQUFjLEdBQXRCLFVBQXVCLE1BQWtCO1FBRXJDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUM7UUFDL0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVqRCxJQUFJLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQztZQUNmLE9BQU8sRUFBRSxLQUFLO1lBQ2QsTUFBTSxFQUFFLE1BQU07WUFDZCxVQUFVLEVBQUUsZUFBZTtZQUMzQixnQkFBZ0IsRUFBRSxlQUFlO1NBQ3BDLENBQUMsQ0FBQztRQUVILElBQUksTUFBTSxHQUFHO1lBQ1QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUVGLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3QixNQUFNLEVBQUUsQ0FBQztRQUVULElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBR08sa0NBQU0sR0FBZCxVQUFlLEtBQWMsRUFBRSxVQUFpQjtRQUFqQiwyQkFBQSxFQUFBLGlCQUFpQjtRQUU1QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFHTyxxQ0FBUyxHQUFqQjtRQUVJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxHQUFHLEVBQUwsQ0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBR08sd0NBQVksR0FBcEIsVUFBcUIsTUFBWSxFQUFFLFVBQWlCO1FBQWpCLDJCQUFBLEVBQUEsaUJBQWlCO1FBRTFDLElBQUEsZ0JBQUksQ0FBVTtRQUVwQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUNwQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDUixDQUFDO1lBQ0csTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUU1QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFlLENBQUM7WUFFbkUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDakIsQ0FBQztnQkFDRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNiLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUNqQixDQUFDO2dCQUNHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ2pCLENBQUM7Z0JBQ0csRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDYixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDakIsQ0FBQztnQkFDRyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FDZixDQUFDO2dCQUNHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBR08sc0NBQVUsR0FBbEIsVUFBbUIsTUFBWSxFQUFFLFVBQWlCO1FBQWpCLDJCQUFBLEVBQUEsaUJBQWlCO1FBRXhDLElBQUEsZ0JBQUksQ0FBVTtRQUVwQixNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRTVCLElBQUksS0FBSyxHQUFHLFVBQUMsSUFBYSxJQUFLLE9BQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUUsSUFBSyxJQUFJLENBQUMsS0FBSyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxFQUFsRyxDQUFrRyxDQUFDO1FBRWxJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQ3BDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUNSLENBQUM7WUFDRyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEUsSUFBSSxVQUFVLEdBQWEsSUFBSSxDQUFDO1lBRWhDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUNWLE1BQU0sQ0FBQztZQUVYLE9BQU8sSUFBSSxFQUNYLENBQUM7Z0JBQ0csSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDO2dCQUNqQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRW5ELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQ2IsQ0FBQztvQkFDRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUM1QixLQUFLLENBQUM7Z0JBQ1YsQ0FBQztnQkFFRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUM3QixDQUFDO29CQUNHLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDOUIsS0FBSyxDQUFDO2dCQUNWLENBQUM7Z0JBRUQsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNqQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQ2YsQ0FBQztnQkFDRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUdPLHNDQUFVLEdBQWxCLFVBQW1CLE1BQVksRUFBRSxVQUFpQjtRQUFqQiwyQkFBQSxFQUFBLGlCQUFpQjtRQUV4QyxJQUFBLGdCQUFJLENBQVU7UUFFcEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDcEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDTCxNQUFNLENBQUM7UUFHWCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xELElBQUksUUFBUSxHQUFHLFdBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWhELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQyxDQUFDO1FBQ2pFLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUdPLDBDQUFjLEdBQXRCLFVBQXVCLE1BQVksRUFBRSxVQUFpQjtRQUFqQiwyQkFBQSxFQUFBLGlCQUFpQjtRQUU1QyxJQUFBLGdCQUFJLENBQVU7UUFFcEIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUU1QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUNwQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDUixDQUFDO1lBQ0csSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ1QsQ0FBQztnQkFDRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVPLG9DQUFRLEdBQWhCLFVBQWlCLFVBQXlCO1FBQXpCLDJCQUFBLEVBQUEsaUJBQXlCO1FBRWxDLElBQUEsU0FBMEIsRUFBeEIsY0FBSSxFQUFFLHdCQUFTLENBQVU7UUFFL0IsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBeEIsQ0FBd0IsQ0FBQyxDQUFDO1FBQ2hFLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxDQUFDO1lBQ0csSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTyw4Q0FBa0IsR0FBMUIsVUFBMkIsS0FBWSxFQUFFLEtBQVk7UUFFakQsSUFBSSxFQUFFLEdBQUcsSUFBSSxhQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFNUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixNQUFNLENBQUM7UUFFWCxJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ2pCLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRztZQUNmLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztTQUNoQixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTywrQ0FBbUIsR0FBM0IsVUFBNEIsS0FBWSxFQUFFLEtBQVk7UUFFOUMsSUFBQSxTQUE4QixFQUE1QixjQUFJLEVBQUUsZ0NBQWEsQ0FBVTtRQUVuQyxJQUFJLEVBQUUsR0FBRyxJQUFJLGFBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUN4QyxNQUFNLENBQUM7UUFFWCxhQUFhLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFFN0IsSUFBSSxNQUFNLEdBQUcsV0FBSSxDQUFDLFFBQVEsQ0FBQztZQUN2QixJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFDekMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDO1NBQzFDLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7YUFDekMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFHLE9BQUEsQ0FBQyxDQUFDLEdBQUcsRUFBTCxDQUFLLENBQUMsQ0FBQztRQUVwQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUN4QixDQUFDO1lBQ0csUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFTyw0Q0FBZ0IsR0FBeEI7UUFFSSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztJQUM5QixDQUFDO0lBR08sb0NBQVEsR0FBaEIsVUFBaUIsS0FBbUIsRUFBRSxVQUF5QjtRQUE5QyxzQkFBQSxFQUFBLFVBQW1CO1FBQUUsMkJBQUEsRUFBQSxpQkFBeUI7UUFFckQsSUFBQSxnQkFBSSxDQUFVO1FBRXBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNoQixNQUFNLENBQUM7UUFFWCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQ2pCLENBQUM7WUFDRyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUV2QixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FDZixDQUFDO2dCQUNHLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNMLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUM7SUFDTCxDQUFDO0lBRU8sMENBQWMsR0FBdEIsVUFBdUIsT0FBZTtRQUU5QixJQUFBLFNBQTRELEVBQTFELGNBQUksRUFBRSx3QkFBUyxFQUFFLG9DQUFlLEVBQUUsb0NBQWUsQ0FBVTtRQUVqRSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQ3JCLENBQUM7WUFDRyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTNDLHFDQUFxQztZQUNyQyxJQUFJLFdBQVcsR0FBRyxXQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUF2QixDQUF1QixDQUFDLENBQUMsQ0FBQztZQUM3RSxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzQyxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELElBQUksQ0FDSixDQUFDO1lBQ0csZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZCLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixDQUFDO0lBQ0wsQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0F0VUEsQUFzVUMsSUFBQTtBQS9URztJQURDLHdCQUFRLEVBQUU7O29EQUNzQjtBQUdqQztJQURDLHdCQUFRLENBQUMsS0FBSyxDQUFDOztvREFDZ0I7QUFHaEM7SUFEQyx3QkFBUSxDQUFDLEtBQUssQ0FBQzs4QkFDUSxRQUFROzBEQUFDO0FBR2pDO0lBREMsd0JBQVEsQ0FBQyxLQUFLLENBQUM7OEJBQ1EsUUFBUTswREFBQztBQXNFakM7SUFEQyx1QkFBTyxFQUFFOzs7OytDQUtUO0FBR0Q7SUFEQyx1QkFBTyxFQUFFOzs7O2tEQUlUO0FBR0Q7SUFEQyx1QkFBTyxFQUFFOztxQ0FDa0IsYUFBSzs7cURBbUNoQztBQUdEO0lBREMsdUJBQU8sRUFBRTs7cUNBQ2dCLGFBQUs7O21EQTJDOUI7QUFHRDtJQURDLHVCQUFPLEVBQUU7O3FDQUNnQixhQUFLOzttREFpQjlCO0FBR0Q7SUFEQyx1QkFBTyxFQUFFOztxQ0FDb0IsYUFBSzs7dURBZWxDO0FBZ0VEO0lBREMsdUJBQU8sRUFBRTs7OztpREF1QlQ7QUFoVFEsOENBQWlCO0FBd1U5QjtJQUF1Qiw0QkFBNkI7SUFBcEQ7O0lBaUJBLENBQUM7SUFmaUIsZUFBTSxHQUFwQixVQUFxQixTQUFxQixFQUFFLE9BQXVCO1FBQXZCLHdCQUFBLEVBQUEsZUFBdUI7UUFFL0QsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsU0FBUyxHQUFHLGdCQUFnQixHQUFHLENBQUMsT0FBTyxHQUFHLHVCQUF1QixHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFNUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7WUFDVixRQUFRLEVBQUUsVUFBVTtZQUNwQixJQUFJLEVBQUUsS0FBSztZQUNYLEdBQUcsRUFBRSxLQUFLO1lBQ1YsT0FBTyxFQUFFLE1BQU07U0FDbEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FqQkEsQUFpQkMsQ0FqQnNCLHNCQUFhLEdBaUJuQzs7OztBQ25aRCxxRUFBb0U7QUFHcEUsK0RBQTJEO0FBWTNEO0lBT0ksMEJBQVksTUFBcUI7UUFIekIsY0FBUyxHQUFXLEtBQUssQ0FBQztRQUs5QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLGlEQUF1QixFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVELHNCQUFZLHVDQUFTO2FBQXJCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkQsQ0FBQzs7O09BQUE7SUFFTSwrQkFBSSxHQUFYLFVBQWEsSUFBZ0IsRUFBRSxNQUFpQjtRQUU1QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUxQixNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXpFLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVPLGlDQUFNLEdBQWQ7UUFFUSxJQUFBLFNBQXVCLEVBQXJCLGtCQUFNLEVBQUUsY0FBSSxDQUFVO1FBQzVCLElBQUksT0FBTyxHQUFHLEVBQVMsQ0FBQztRQUV4QixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFZixHQUFHLENBQUMsQ0FBYSxVQUFnQixFQUFoQixLQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFoQixjQUFnQixFQUFoQixJQUFnQjtZQUE1QixJQUFJLElBQUksU0FBQTtZQUVULElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQVcsQ0FBQztZQUN4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQ2QsQ0FBQztnQkFDRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEMsQ0FBQztTQUNKO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDM0IsQ0FBQztJQUVPLDRDQUFpQixHQUF6QixVQUEwQixRQUFlLEVBQUUsSUFBUTtRQUUzQyxJQUFBLFNBQTRCLEVBQTFCLGtCQUFNLEVBQUUsd0JBQVMsQ0FBVTtRQUVqQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNsQixDQUFDO1lBQ0csTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxLQUFLLEVBQUUsQ0FBQyxDQUNqQyxDQUFDO1lBQ0csUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTyx5Q0FBYyxHQUF0QixVQUF1QixPQUFxQixFQUFFLElBQVE7UUFFOUMsSUFBQSxTQUF1QixFQUFyQixrQkFBTSxFQUFFLGNBQUksQ0FBVTtRQUU1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FDcEIsQ0FBQztZQUNHLElBQUksS0FBSyxHQUFHLElBQUksZ0NBQWEsRUFBRSxDQUFDO1lBQ2hDLElBQUksV0FBVyxHQUFHLEVBQWMsQ0FBQztZQUVqQyxHQUFHLENBQUMsQ0FBVyxVQUFrQixFQUFsQixLQUFBLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBbEIsY0FBa0IsRUFBbEIsSUFBa0I7Z0JBQTVCLElBQUksRUFBRSxTQUFBO2dCQUVQLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQzNELENBQUM7b0JBQ0csRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQy9DLENBQUM7d0JBQ0csTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDckMsQ0FBQztvQkFDRCxJQUFJLENBQ0osQ0FBQzt3QkFDRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDN0MsQ0FBQztnQkFDTCxDQUFDO2dCQUVELFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzVCO1lBRUQsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUN2QixDQUFDO2dCQUNHLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBQ0wsdUJBQUM7QUFBRCxDQXRHQSxBQXNHQyxJQUFBO0FBdEdZLDRDQUFnQjs7OztBQ2Y3Qix3Q0FBeUQ7QUFFekQsK0RBQTJEO0FBRzNELG1EQUFrRDtBQUNsRCwrQ0FBOEM7QUFHOUMsSUFBTSxVQUFVLEdBQUcsaURBQWlELENBQUM7QUFFckUsSUFBTSxnQkFBZ0IsR0FBRztJQUNyQixPQUFPO0lBQ1AsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO0lBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO0lBQ2pCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtJQUNmLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztJQUNiLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztJQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztJQUNqQixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7SUFDYixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7SUFDYixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7SUFDYixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7SUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07SUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO0lBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztJQUNiLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtJQUNmLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztJQUNiLFNBQVM7SUFDVCxHQUFHLEVBQUUsVUFBUyxNQUFlO1FBRXpCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxDQUFDO0lBQ0QsR0FBRyxFQUFFLFVBQVMsTUFBZTtRQUV6QixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLEdBQUcsQ0FBQyxFQUFMLENBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0osQ0FBQztBQU9GO0lBQUE7UUFHWSxhQUFRLEdBQXFCLEVBQUUsQ0FBQztRQUNoQyxVQUFLLEdBQThCLEVBQUUsQ0FBQztRQUN0QyxZQUFPLEdBQWdCLElBQUksMkJBQVksRUFBRSxDQUFDO0lBaU50RCxDQUFDO0lBL01VLDRDQUFVLEdBQWpCLFVBQWtCLE9BQWM7UUFFNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQy9DLENBQUM7SUFFTSx1Q0FBSyxHQUFaLFVBQWEsUUFBa0I7UUFFM0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUNwQyxDQUFDO1lBQ0csR0FBRyxDQUFDLENBQVcsVUFBUSxFQUFSLHFCQUFRLEVBQVIsc0JBQVEsRUFBUixJQUFRO2dCQUFsQixJQUFJLEVBQUUsaUJBQUE7Z0JBRVAsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUM1QjtRQUNMLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekIsQ0FBQztJQUNMLENBQUM7SUFFTSx5Q0FBTyxHQUFkLFVBQWUsSUFBZ0I7UUFFM0IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVNLDBDQUFRLEdBQWYsVUFBZ0IsT0FBYyxFQUFFLFdBQTBCO1FBRXRELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLGdDQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3RFLENBQUM7SUFFTSx5Q0FBTyxHQUFkLFVBQWUsUUFBc0IsRUFBRSxLQUF5QyxFQUFFLE9BQXNCO1FBQXpGLHlCQUFBLEVBQUEsYUFBc0I7UUFBRSxzQkFBQSxFQUFBLFlBQTBCLGdDQUFhLEVBQUU7UUFBRSx3QkFBQSxFQUFBLGNBQXNCO1FBRWhHLElBQUEsU0FBeUIsRUFBdkIsY0FBSSxFQUFFLHNCQUFRLENBQVU7UUFFOUIsSUFBSSxNQUFNLEdBQUcsWUFBSyxDQUFDLFFBQVEsRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUMsQ0FBQztRQUNyQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNwRSxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBdEIsQ0FBc0IsQ0FBQyxDQUFDO1FBRXRDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUNaLENBQUM7WUFDRyxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsR0FBRyxDQUFDLENBQWEsVUFBTyxFQUFQLG1CQUFPLEVBQVAscUJBQU8sRUFBUCxJQUFPO1lBQW5CLElBQUksSUFBSSxnQkFBQTtZQUVULElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQ1osQ0FBQztnQkFDRyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDMUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1NBQ0o7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFTSx5Q0FBTyxHQUFkLFVBQWUsT0FBYztRQUV6QixJQUFJLEtBQUssR0FBRyxFQUFjLENBQUM7UUFDM0IsSUFBSSxNQUFNLEdBQUcsSUFBdUIsQ0FBQztRQUVyQyxPQUFPLE1BQU0sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUN4QyxDQUFDO1lBQ0csRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNmLFFBQVEsQ0FBQztZQUViLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVNLHlDQUFPLEdBQWQsVUFBZSxPQUFjLEVBQUUsT0FBYztRQUE3QyxpQkFZQztRQVZHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBRWpDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLHFCQUFTLENBQUMsTUFBTSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBeEMsQ0FBd0MsQ0FBQyxDQUFDO1FBQ3pFLElBQUksSUFBSSxHQUFHLGNBQU8sQ0FBVyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQyxDQUFDO1FBRXhELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FDaEIsQ0FBQztZQUNHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQztJQUVTLHlDQUFPLEdBQWpCLFVBQWtCLE9BQWM7UUFFNUIsY0FBYyxPQUFjLEVBQUUsR0FBVTtZQUVwQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ3ZDLENBQUM7Z0JBQ0csRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN6QixDQUFDO29CQUNHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FDMUMsQ0FBQzt3QkFDRyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQzNCLENBQUM7NEJBQ0csTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDYixDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFDRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFDQSxDQUFDO1lBQ0csdURBQXVEO1lBQ3ZELElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBb0IsQ0FBQztZQUVuRCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNWLENBQUM7Z0JBQ0csSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFbEMsR0FBRyxDQUFDLENBQVUsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7b0JBQWQsSUFBSSxDQUFDLGNBQUE7b0JBRU4sSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDM0IsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUNiLENBQUM7d0JBQ0csT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFHLFdBQVMsQ0FBQyxxQkFBa0IsQ0FBQSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDM0csQ0FBQztpQkFDSjtnQkFFRCxJQUFJLFNBQVMsR0FBRyxhQUFNLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQzdDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXpDLElBQUksSUFBSSxHQUFHLENBQUEseUNBQXVDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHFEQUFrRCxDQUFBLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNULENBQUM7WUFDRyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7UUFDbEIsQ0FBQztJQUNMLENBQUM7SUFFUyxnREFBYyxHQUF4QixVQUF5QixLQUFnQjtRQUVqQyxJQUFBLFNBQWtDLEVBQWhDLGNBQUksRUFBRSxzQkFBUSxFQUFFLG9CQUFPLENBQVU7UUFFdkMsSUFBSSxJQUFJLEdBQUcsRUFBZ0IsQ0FBQztRQUM1QixJQUFJLGFBQWEsR0FBRyxFQUF3QixDQUFDO1FBRTdDLElBQU0sS0FBSyxHQUFHLFVBQUMsSUFBYTtZQUV4QixFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQztnQkFDakMsTUFBTSxDQUFDO1lBRVgsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2lCQUM5QyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBdEIsQ0FBc0IsQ0FBQyxDQUFDO1lBRXRDLEdBQUcsQ0FBQyxDQUFXLFVBQVksRUFBWiw2QkFBWSxFQUFaLDBCQUFZLEVBQVosSUFBWTtnQkFBdEIsSUFBSSxFQUFFLHFCQUFBO2dCQUVQLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNiO1lBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDekIsQ0FBQztnQkFDRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUVELGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ25DLENBQUMsQ0FBQztRQUVGLEdBQUcsQ0FBQyxDQUFVLFVBQUssRUFBTCxlQUFLLEVBQUwsbUJBQUssRUFBTCxJQUFLO1lBQWQsSUFBSSxDQUFDLGNBQUE7WUFFTCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDYjtRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVTLHlDQUFPLEdBQWpCLFVBQWtCLElBQVcsRUFBRSxXQUF5QjtRQUF4RCxpQkFVQztRQVJHLElBQUksTUFBTSxHQUFHLHFCQUFTO2FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUM7YUFDN0IsR0FBRzthQUNILEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFuRCxDQUFtRCxDQUFDLENBQUM7UUFFbkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQztjQUNsQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Y0FDaEIsTUFBTSxDQUFDO0lBQ2pCLENBQUM7SUFFTywrQ0FBYSxHQUFyQjtRQUFzQixnQkFBa0I7YUFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO1lBQWxCLDJCQUFrQjs7UUFFcEMsR0FBRyxDQUFDLENBQVUsVUFBTSxFQUFOLGlCQUFNLEVBQU4sb0JBQU0sRUFBTixJQUFNO1lBQWYsSUFBSSxDQUFDLGVBQUE7WUFFTixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQ3BCLENBQUM7Z0JBQ0csTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztTQUNKO1FBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNiLENBQUM7SUFDTCw4QkFBQztBQUFELENBdE5BLEFBc05DLElBQUE7QUF0TlksMERBQXVCOzs7O0FDakRwQztJQUtJO1FBSFEsY0FBUyxHQUF1QixFQUFFLENBQUM7UUFDbkMsYUFBUSxHQUF1QixFQUFFLENBQUM7SUFJMUMsQ0FBQztJQUVNLDRCQUFLLEdBQVo7UUFFSSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRU0scUNBQWMsR0FBckIsVUFBc0IsT0FBYztRQUVoQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVNLG9DQUFhLEdBQXBCLFVBQXFCLE9BQWM7UUFFL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFTSw0QkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFFBQWlCO1FBRTNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLENBQUM7UUFFWCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUNwQyxHQUFHLENBQUMsQ0FBVSxVQUFRLEVBQVIscUJBQVEsRUFBUixzQkFBUSxFQUFSLElBQVE7WUFBakIsSUFBSSxDQUFDLGlCQUFBO1lBRU4sSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2QjtJQUNMLENBQUM7SUFFTSw4QkFBTyxHQUFkLFVBQWUsUUFBZTtRQUUxQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVoQyxHQUFHLENBQUMsQ0FBVSxVQUFRLEVBQVIscUJBQVEsRUFBUixzQkFBUSxFQUFSLElBQVE7WUFBakIsSUFBSSxDQUFDLGlCQUFBO1lBRU4sSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQ1osQ0FBQztnQkFDRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixDQUFDO1NBQ0o7SUFDTCxDQUFDO0lBQ0wsbUJBQUM7QUFBRCxDQXJEQSxBQXFEQyxJQUFBO0FBckRZLG9DQUFZOzs7O0FDSXpCLHdDQUFpRDtBQUNqRCwwQ0FBb0Q7QUFDcEQsb0NBQXNDO0FBQ3RDLCtCQUFpQztBQXNCakM7SUFBQTtJQThKQSxDQUFDO0lBdkpHLHNCQUFZLDJDQUFXO2FBQXZCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekQsQ0FBQzs7O09BQUE7SUFFTSxpQ0FBSSxHQUFYLFVBQVksSUFBZ0IsRUFBRSxNQUFpQjtRQUUzQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvQixJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNFLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRU8sMkNBQWMsR0FBdEIsVUFBdUIsTUFBa0I7UUFFckMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxLQUFLLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztRQUMvQixHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDL0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWpELElBQUksQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDO1lBQ2YsT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSxlQUFlO1lBQzNCLGdCQUFnQixFQUFFLGVBQWU7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLEdBQUc7WUFDVCxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2QixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sRUFBRSxDQUFDO1FBRVQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVPLHVDQUFVLEdBQWxCLFVBQW1CLEdBQXNCLEVBQUUsV0FBc0I7UUFFekQsSUFBQSxTQUFzQixFQUFwQixjQUFJLEVBQUUsZ0JBQUssQ0FBVTtRQUUzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUM7UUFFWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQ2pCLENBQUM7WUFDRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFFbkIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ1IsQ0FBQztZQUNHLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBQ0QsSUFBSSxDQUNKLENBQUM7WUFDRyxLQUFLLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTyw4Q0FBaUIsR0FBekIsVUFBMEIsQ0FBWTtRQUU5QixJQUFBLFNBQTJCLEVBQXpCLGNBQUksRUFBRSwwQkFBVSxDQUFVO1FBQ2hDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRTFCLElBQUksSUFBSSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTNCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFtQixDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU8sd0NBQVcsR0FBbkIsVUFBb0IsQ0FBWTtRQUFoQyxpQkE0QkM7UUExQlMsSUFBQSxnQkFBSSxDQUFVO1FBRXBCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNULENBQUM7WUFDRyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQWdCLENBQUM7WUFFakQsSUFBSSxNQUFNLEdBQUcsS0FBSztpQkFDYixNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQTNCLENBQTJCLENBQUMsQ0FDeEMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1lBRWhCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDYixDQUFDO2dCQUNHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsSUFBSSxDQUNKLENBQUM7Z0JBQ0csSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNMLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDTCxDQUFDO0lBRU8sOENBQWlCLEdBQXpCLFVBQTBCLENBQVk7UUFFNUIsSUFBQSxnQkFBSSxDQUFVO1FBRXBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQ25CLENBQUM7WUFDRyxJQUFJLFFBQVEsR0FBRyxXQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFBO1lBQy9ELElBQUksT0FBTyxHQUFHLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUNoQyxDQUFDO2dCQUNHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVPLGlDQUFJLEdBQVosVUFBYSxJQUFhLEVBQUUsSUFBYyxFQUFFLEVBQVE7UUFFaEQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELElBQUksUUFBUSxHQUFHLFdBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FDeEIsQ0FBQztZQUNHLFFBQVEsR0FBRyxJQUFJLFdBQUksQ0FDZixRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsRUFDdEMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQ3RDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUN2QyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FDNUMsQ0FBQztRQUNOLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUM1QixDQUFDO1lBQ0csUUFBUSxHQUFHLElBQUksV0FBSSxDQUNmLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxFQUNoRCxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFDaEQsUUFBUSxDQUFDLEtBQUssRUFDZCxRQUFRLENBQUMsTUFBTSxDQUNsQixDQUFDO1FBQ04sQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQTlKQSxBQThKQyxJQUFBO0FBOUpZLGdEQUFrQjtBQWdLL0Isc0JBQXNCLElBQVcsRUFBRSxHQUFzQixFQUFFLE1BQWlCO0lBRXhFLElBQUksS0FBSyxHQUFRLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDaEQsOEJBQThCO0lBQzlCLDhCQUE4QjtJQUM5QixLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDdEIsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVELGNBQWMsR0FBc0I7SUFFaEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQzlFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQixDQUFDOzs7Ozs7Ozs7Ozs7O0FDNU1ELG1EQUF3RjtBQUN4Rix3Q0FBMkM7QUFDM0MsK0RBQTJEO0FBRzNELGlEQUFnRDtBQUNoRCx3REFBaUQ7QUFZakQ7SUFTSSwwQkFBWSxPQUF1QjtRQUozQixjQUFTLEdBQVcsS0FBSyxDQUFDO1FBQzFCLGNBQVMsR0FBVyxLQUFLLENBQUM7UUFLOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksSUFBSSxzQ0FBcUIsRUFBRSxDQUFDO0lBQzFELENBQUM7SUFFTSwrQkFBSSxHQUFYLFVBQVksSUFBZ0IsRUFBRSxNQUFpQjtRQUEvQyxpQkFXQztRQVRHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLG1CQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDbEIsRUFBRSxDQUFDLGFBQWEsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLElBQUksRUFBRSxFQUFYLENBQVcsQ0FBQzthQUNwQyxFQUFFLENBQUMsYUFBYSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsSUFBSSxFQUFFLEVBQVgsQ0FBVyxDQUFDLENBQ3hDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBR08sK0JBQUksR0FBWjtRQUVJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUdPLCtCQUFJLEdBQVo7UUFFSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFHTywrQkFBSSxHQUFaLFVBQWEsTUFBb0I7UUFFN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUdPLGdDQUFLLEdBQWI7UUFFSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFHTyxrQ0FBTyxHQUFmLFVBQWdCLElBQW1CO1FBQW5CLHFCQUFBLEVBQUEsV0FBbUI7UUFFL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVPLHVDQUFZLEdBQXBCLFVBQXFCLE9BQXFCO1FBRXRDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNqQyxNQUFNLENBQUM7UUFFWCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUU1QixJQUFJLENBQUMsT0FBTyxHQUFHLGVBQVEsQ0FDbkIsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQTVCLENBQTRCLENBQUMsQ0FDeEQsQ0FBQztJQUNOLENBQUM7SUFFTyxzQ0FBVyxHQUFuQixVQUFvQixPQUFxQjtRQUVyQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2xELE1BQU0sQ0FBQztRQUVYLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQ3JCLENBQUM7WUFDRyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztJQUVPLDBDQUFlLEdBQXZCLFVBQXdCLE9BQXlCLEVBQUUsT0FBcUI7UUFFcEUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDNUIsSUFBSSxLQUFLLEdBQUcsRUFBd0IsQ0FBQztRQUVyQyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxDQUFjLFVBQWlDLEVBQWpDLEtBQUEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBWCxDQUFXLENBQUMsRUFBakMsY0FBaUMsRUFBakMsSUFBaUM7WUFBOUMsSUFBSSxLQUFLLFNBQUE7WUFFVixLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNQLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7Z0JBQ25CLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSztnQkFDbkIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDL0IsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzNCLENBQUMsQ0FBQztTQUNOO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRU8sMkNBQWdCLEdBQXhCLFVBQXlCLFNBQTRCO1FBQXJELGlCQVVDO1FBUkcsTUFBTSxDQUFDO1lBQ0gsS0FBSyxFQUFFO2dCQUNILEtBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sRUFBUixDQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxRQUFRLEVBQUU7Z0JBQ04sS0FBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxFQUFSLENBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEUsQ0FBQztTQUNKLENBQUM7SUFDTixDQUFDO0lBRU8sNkNBQWtCLEdBQTFCLFVBQTJCLE9BQXFCO1FBRXRDLElBQUEsZ0JBQUksQ0FBVTtRQUVwQixJQUNBLENBQUM7WUFDRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO2dCQUVELENBQUM7WUFDRyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBWCxDQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBVixDQUFVLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ0wsdUJBQUM7QUFBRCxDQXJJQSxBQXFJQyxJQUFBO0FBekdHO0lBREMsdUJBQU8sRUFBRTs7Ozs0Q0FJVDtBQUdEO0lBREMsdUJBQU8sRUFBRTs7Ozs0Q0FJVDtBQUdEO0lBREMsdUJBQU8sRUFBRTs7Ozs0Q0FJVDtBQUdEO0lBREMsdUJBQU8sQ0FBQyxjQUFjLENBQUM7Ozs7NkNBSXZCO0FBR0Q7SUFEQyx1QkFBTyxDQUFDLGdCQUFnQixDQUFDOzs7OytDQUl6QjtBQXZEUSw0Q0FBZ0I7QUF1STdCLHdCQUF3QixTQUE0QixFQUFFLFdBQTBDO0lBRTVGLElBQUksU0FBUyxHQUFHLElBQUksZ0NBQWEsRUFBRSxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxDQUFVLFVBQVMsRUFBVCx1QkFBUyxFQUFULHVCQUFTLEVBQVQsSUFBUztRQUFsQixJQUFJLENBQUMsa0JBQUE7UUFFTixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNwRDtJQUNELE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDckIsQ0FBQzs7OztBQ3pJRDtJQUFBO1FBRVksV0FBTSxHQUFtQixFQUFFLENBQUM7UUFDNUIsU0FBSSxHQUFtQixFQUFFLENBQUM7SUFpRHRDLENBQUM7SUEvQ0csc0JBQVcsOENBQVc7YUFBdEI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDOUIsQ0FBQzs7O09BQUE7SUFFRCxzQkFBVyw0Q0FBUzthQUFwQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM1QixDQUFDOzs7T0FBQTtJQUVNLHFDQUFLLEdBQVo7UUFFSSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFTSxvQ0FBSSxHQUFYLFVBQVksTUFBb0I7UUFFNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVNLG9DQUFJLEdBQVg7UUFFSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQ3hCLENBQUM7WUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLG9DQUFJLEdBQVg7UUFFSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQ3RCLENBQUM7WUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDTCw0QkFBQztBQUFELENBcERBLEFBb0RDLElBQUE7QUFwRFksc0RBQXFCOzs7O0FDeEJsQyxxQ0FBd0M7QUFHeEM7SUFTSSxpQkFBWSxHQUFXLEVBQUUsS0FBYSxFQUFFLE1BQWMsRUFBRSxJQUFZO1FBRWhFLElBQUksQ0FBQyxHQUFHLEdBQUcsZUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLGVBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsZUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLElBQUksR0FBRyxlQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsc0JBQVcsK0JBQVU7YUFBckI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2xDLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsNkJBQVE7YUFBbkI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xDLENBQUM7OztPQUFBO0lBRU0seUJBQU8sR0FBZCxVQUFlLEVBQVM7UUFFcEIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUNkLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FDakIsQ0FBQztJQUNOLENBQUM7SUFDTCxjQUFDO0FBQUQsQ0FwQ0EsQUFvQ0M7QUFsQ2lCLGFBQUssR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUZyQywwQkFBTzs7OztBQ1FwQjtJQThDSSxlQUFZLENBQWlCLEVBQUUsQ0FBUztRQTVDeEIsTUFBQyxHQUFVLENBQUMsQ0FBQztRQUNiLE1BQUMsR0FBVSxDQUFDLENBQUM7UUE2Q3pCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDckIsQ0FBQztZQUNHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztRQUNELElBQUksQ0FDSixDQUFDO1lBQ0csSUFBSSxDQUFDLENBQUMsR0FBWSxDQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBN0NhLGFBQU8sR0FBckIsVUFBc0IsTUFBa0I7UUFFcEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQ25CLENBQUM7WUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7WUFFWixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNULENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRWEsZUFBUyxHQUF2QixVQUF3QixJQUFlLEVBQUUsRUFBYTtRQUVsRCxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRWEsWUFBTSxHQUFwQixVQUFxQixNQUFpQjtRQUVsQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFYSxnQkFBVSxHQUF4QixVQUF5QixNQUFlLEVBQUUsS0FBZ0I7UUFBaEIsc0JBQUEsRUFBQSxTQUFnQjtRQUV0RCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBZ0JELGlCQUFpQjtJQUVWLHFCQUFLLEdBQVo7UUFFSSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztjQUNiLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7Y0FDdEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFDdEQsQ0FBQztJQUVNLDBCQUFVLEdBQWpCLFVBQWtCLEdBQWM7UUFFNUIsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxxQkFBSyxHQUFaLFVBQWEsR0FBYztRQUV2QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVNLHdCQUFRLEdBQWYsVUFBZ0IsRUFBYTtRQUV6QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU0sbUJBQUcsR0FBVixVQUFXLEdBQWM7UUFFckIsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFTSxzQkFBTSxHQUFiO1FBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFTSx5QkFBUyxHQUFoQjtRQUVJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QixFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQ2xCLENBQUM7WUFDRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVNLG9CQUFJLEdBQVg7UUFFSSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLHFCQUFLLEdBQVo7UUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFTSx1QkFBTyxHQUFkO1FBRUksTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFTSx1QkFBTyxHQUFkO1FBRUksTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFTSxzQkFBTSxHQUFiLFVBQWMsT0FBYztRQUV4QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDckMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFFckMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsV0FBVztJQUVYLG1CQUFtQjtJQUVaLG1CQUFHLEdBQVYsVUFBVyxHQUFxQjtRQUU1QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDUixDQUFDO1lBQ0csTUFBTSxtQkFBbUIsQ0FBQztRQUM5QixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU0sc0JBQU0sR0FBYixVQUFjLE9BQWM7UUFFeEIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVNLHdCQUFRLEdBQWYsVUFBZ0IsU0FBZ0I7UUFFNUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVNLHFCQUFLLEdBQVo7UUFFSSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU0sd0JBQVEsR0FBZixVQUFnQixHQUFxQjtRQUVqQyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDUixDQUFDO1lBQ0csTUFBTSx3QkFBd0IsQ0FBQztRQUNuQyxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLHFCQUFLLEdBQVosVUFBYSxLQUFXLEVBQUUsS0FBVztRQUVqQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2YsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM3QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTdCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDZixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0IsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsV0FBVztJQUVYLG1CQUFtQjtJQUVaLHFCQUFLLEdBQVo7UUFFSSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVNLHNCQUFNLEdBQWIsVUFBYyxPQUFpQjtRQUUzQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sdUJBQU8sR0FBZDtRQUVJLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFTSx3QkFBUSxHQUFmO1FBRUksTUFBTSxDQUFDLE1BQUksSUFBSSxDQUFDLENBQUMsVUFBSyxJQUFJLENBQUMsQ0FBQyxNQUFHLENBQUM7SUFDcEMsQ0FBQztJQUdMLFlBQUM7QUFBRCxDQTVOQSxBQTROQztBQXZOaUIsYUFBTyxHQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckMsYUFBTyxHQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFFckMsV0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN4QixTQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3hDLFNBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLFFBQUUsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQVgzQixzQkFBSztBQThObEIsZUFBZSxHQUFPO0lBRWxCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxLQUFLLFNBQVMsQ0FBQyxDQUN0QyxDQUFDO1FBQ0csRUFBRSxDQUFDLENBQUMsR0FBRyxZQUFZLEtBQUssQ0FBQyxDQUN6QixDQUFDO1lBQ0csTUFBTSxDQUFRLEdBQUcsQ0FBQztRQUN0QixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FDL0MsQ0FBQztZQUNHLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FDcEQsQ0FBQztZQUNHLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUN2QixDQUFDO1lBQ0csTUFBTSxDQUFDLElBQUksS0FBSyxDQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxPQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQzdCLENBQUM7WUFDRyxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxPQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQzdCLENBQUM7WUFDRyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkIsQ0FBQzs7OztBQ3hRRCxpQ0FBdUQ7QUFXdkQ7SUFzREksY0FBWSxJQUFXLEVBQUUsR0FBVSxFQUFFLEtBQVksRUFBRSxNQUFhO1FBTGhELFNBQUksR0FBVSxDQUFDLENBQUM7UUFDaEIsUUFBRyxHQUFVLENBQUMsQ0FBQztRQUNmLFVBQUssR0FBVSxDQUFDLENBQUM7UUFDakIsV0FBTSxHQUFVLENBQUMsQ0FBQztRQUk5QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUF4RGEsY0FBUyxHQUF2QixVQUF3QixJQUFXLEVBQUUsR0FBVSxFQUFFLEtBQVksRUFBRSxNQUFhO1FBRXhFLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FDWCxJQUFJLEVBQ0osR0FBRyxFQUNILEtBQUssR0FBRyxJQUFJLEVBQ1osTUFBTSxHQUFHLEdBQUcsQ0FDZixDQUFDO0lBQ04sQ0FBQztJQUVhLGFBQVEsR0FBdEIsVUFBdUIsSUFBYTtRQUVoQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFYSxhQUFRLEdBQXRCLFVBQXVCLEtBQVk7UUFFL0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQTdCLENBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFYSxlQUFVLEdBQXhCO1FBQXlCLGdCQUFpQjthQUFqQixVQUFpQixFQUFqQixxQkFBaUIsRUFBakIsSUFBaUI7WUFBakIsMkJBQWlCOztRQUV0QyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRWEsb0JBQWUsR0FBN0IsVUFBOEIsTUFBYyxFQUFFLEtBQWEsRUFBRSxNQUFjO1FBRXZFLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FDeEIsQ0FBQztZQUNHLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQ3pCLENBQUM7WUFDRyxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUNqQixJQUFJLENBQUMsR0FBRyxPQUFSLElBQUksRUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLENBQUMsRUFBSCxDQUFHLENBQUMsR0FDaEMsSUFBSSxDQUFDLEdBQUcsT0FBUixJQUFJLEVBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxDQUFDLEVBQUgsQ0FBRyxDQUFDLEdBQ2hDLElBQUksQ0FBQyxHQUFHLE9BQVIsSUFBSSxFQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsQ0FBQyxFQUFILENBQUcsQ0FBQyxHQUNoQyxJQUFJLENBQUMsR0FBRyxPQUFSLElBQUksRUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLENBQUMsRUFBSCxDQUFHLENBQUMsRUFDbkMsQ0FBQztJQUNOLENBQUM7SUFlRCxzQkFBVyx1QkFBSzthQUFoQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbEMsQ0FBQzs7O09BQUE7SUFFRCxzQkFBVyx3QkFBTTthQUFqQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDbEMsQ0FBQzs7O09BQUE7SUFFTSxxQkFBTSxHQUFiO1FBRUksTUFBTSxDQUFDLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVNLHNCQUFPLEdBQWQ7UUFFSSxNQUFNLENBQUMsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLHFCQUFNLEdBQWI7UUFFSSxNQUFNLENBQUM7WUFDSCxJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDOUIsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQy9CLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDcEMsQ0FBQztJQUNOLENBQUM7SUFFTSxtQkFBSSxHQUFYO1FBRUksTUFBTSxDQUFDLElBQUksYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFTSx1QkFBUSxHQUFmLFVBQWdCLEtBQXdCO1FBRXBDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUN6RCxDQUFDO1lBQ0csSUFBSSxFQUFFLEdBQWMsS0FBSyxDQUFDO1lBRTFCLE1BQU0sQ0FBQyxDQUNILEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUk7bUJBQ2QsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRzttQkFDaEIsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLO21CQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FDcEMsQ0FBQztRQUNOLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksSUFBSSxHQUFhLEtBQUssQ0FBQztZQUUzQixNQUFNLENBQUMsQ0FDSCxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJO2dCQUN0QixJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHO2dCQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSztnQkFDaEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FDbkQsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRU0scUJBQU0sR0FBYixVQUFjLElBQWU7UUFFekIsSUFBSSxFQUFFLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU1QixNQUFNLENBQUMsSUFBSSxJQUFJLENBQ1gsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsR0FBRyxFQUNSLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUNyQixDQUFDO0lBQ04sQ0FBQztJQUVNLHNCQUFPLEdBQWQsVUFBZSxJQUFlO1FBRTFCLElBQUksRUFBRSxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDaEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUNyQixDQUFDO0lBQ04sQ0FBQztJQUVNLHFCQUFNLEdBQWIsVUFBYyxFQUFhO1FBRXZCLElBQUksRUFBRSxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFMUIsTUFBTSxDQUFDLElBQUksSUFBSSxDQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDaEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUNmLElBQUksQ0FBQyxLQUFLLEVBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FDZCxDQUFDO0lBQ04sQ0FBQztJQUVNLHlCQUFVLEdBQWpCLFVBQWtCLElBQWE7UUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSTtlQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUc7ZUFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLO2VBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdDLENBQUM7SUFFTSx3QkFBUyxHQUFoQjtRQUVJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQ3hDLENBQUM7WUFDRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRXBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDVixDQUFDO1lBQ0csQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ1YsQ0FBQztZQUNHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSx1QkFBUSxHQUFmO1FBRUksTUFBTSxDQUFDLE1BQUksSUFBSSxDQUFDLElBQUksVUFBSyxJQUFJLENBQUMsR0FBRyxVQUFLLElBQUksQ0FBQyxLQUFLLFVBQUssSUFBSSxDQUFDLE1BQU0sTUFBRyxDQUFDO0lBQ3hFLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FyTUEsQUFxTUM7QUFuTWlCLFVBQUssR0FBUSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUZ2QyxvQkFBSTs7OztBQ1ZqQixnQ0FBa0M7QUFHbEM7SUFZSSx3Q0FBb0IsTUFBa0I7UUFBbEIsV0FBTSxHQUFOLE1BQU0sQ0FBWTtJQUV0QyxDQUFDO0lBWmEsbUNBQUksR0FBbEIsVUFBbUIsTUFBK0I7UUFFOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQ2pDLENBQUM7WUFDRyxNQUFNLENBQUMsSUFBSSw4QkFBOEIsQ0FBYyxNQUFNLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsTUFBTSxDQUFlLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBTU0sMkNBQUUsR0FBVCxVQUFVLEtBQVksRUFBRSxRQUFzQjtRQUE5QyxpQkFNQztRQUpHLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sQ0FBQztZQUNILE1BQU0sRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQXpCLENBQXlCO1NBQzFDLENBQUM7SUFDTixDQUFDO0lBRU0sNENBQUcsR0FBVixVQUFXLEtBQVksRUFBRSxRQUFzQjtRQUUzQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0sNkNBQUksR0FBWCxVQUFZLEtBQVk7UUFBRSxjQUFhO2FBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtZQUFiLDZCQUFhOztRQUVuQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUM3QyxDQUFDO0lBQ04sQ0FBQztJQUNMLHFDQUFDO0FBQUQsQ0FuQ0EsQUFtQ0MsSUFBQTtBQW5DWSx3RUFBOEI7Ozs7QUNEM0MsSUFBSSxPQUE0QixDQUFDO0FBRWpDO0lBQUE7SUFpQkEsQ0FBQztJQWZpQixhQUFJLEdBQWxCO1FBRUksRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FDYixDQUFDO1lBQ0csT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUViLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsVUFBQyxDQUFnQixJQUFLLE9BQUEsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLEVBQXpCLENBQXlCLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUMsQ0FBZ0IsSUFBSyxPQUFBLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxFQUExQixDQUEwQixDQUFDLENBQUM7UUFDdkYsQ0FBQztJQUNMLENBQUM7SUFFYSxhQUFJLEdBQWxCLFVBQW1CLEdBQVU7UUFFekIsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0wsZUFBQztBQUFELENBakJBLEFBaUJDLElBQUE7QUFqQlksNEJBQVE7Ozs7QUNMckIsK0JBQThCO0FBRzlCO0lBdUJJLHVCQUFvQixJQUFhLEVBQUUsU0FBaUI7UUFFaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFFM0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLFdBQUksQ0FBQyxJQUFJLEVBQWYsQ0FBZSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLFdBQUksQ0FBQyxHQUFHLEVBQWQsQ0FBYyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLFdBQUksQ0FBQyxLQUFLLEVBQWhCLENBQWdCLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEtBQUssV0FBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssV0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssV0FBSSxDQUFDLEtBQUssRUFBckQsQ0FBcUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUNsRyxDQUFDO0lBN0JhLG1CQUFLLEdBQW5CLFVBQW9CLEtBQVk7UUFFNUIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDZCxDQUFDO1lBQ0csS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksSUFBSSxHQUFHLEtBQUs7YUFDWCxLQUFLLENBQUMsV0FBVyxDQUFDO2FBQ2xCLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLFdBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxDQUFDLENBQUM7UUFFN0IsTUFBTSxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBa0JNLCtCQUFPLEdBQWQsVUFBZSxPQUFtQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLFlBQVksYUFBYSxDQUFDLENBQ3JDLENBQUM7WUFDRyxNQUFNLENBQUMsQ0FDSCxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJO2dCQUN6QixJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHO2dCQUN2QixJQUFJLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLO2dCQUMzQixJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQzFCLENBQUM7UUFDTixDQUFDO1FBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sWUFBWSxhQUFhLENBQUMsQ0FDMUMsQ0FBQztZQUNHLE1BQU0sQ0FBQyxDQUNILElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLE9BQU87Z0JBQzVCLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU07Z0JBQzFCLElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLFFBQVE7Z0JBQzlCLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FDOUIsQ0FBQztRQUNOLENBQUM7UUFFRCxNQUFNLHNDQUFzQyxDQUFDO0lBQ2pELENBQUM7SUFDTCxvQkFBQztBQUFELENBeERBLEFBd0RDLElBQUE7QUF4RFksc0NBQWE7Ozs7QUNGMUIsaURBQWdEO0FBQ2hELG1GQUFrRjtBQVVsRjtJQVNJLGtCQUE0QixRQUF1QjtRQUF2QixhQUFRLEdBQVIsUUFBUSxDQUFlO1FBRjNDLFNBQUksR0FBdUIsRUFBRSxDQUFDO0lBSXRDLENBQUM7SUFUYSxZQUFHLEdBQWpCO1FBQWtCLGVBQXNCO2FBQXRCLFVBQXNCLEVBQXRCLHFCQUFzQixFQUF0QixJQUFzQjtZQUF0QiwwQkFBc0I7O1FBRXBDLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBUU0scUJBQUUsR0FBVCxVQUFVLEtBQXFCLEVBQUUsUUFBdUI7UUFBeEQsaUJBa0JDO1FBaEJHLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUMxQixDQUFDO1lBQ0csTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBUyxLQUFLLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5QyxDQUFDO2dDQUVRLEVBQUU7WUFFUCxJQUFJLEVBQUUsR0FBRyxPQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxLQUFJLENBQUMsY0FBYyxDQUNoRCxFQUFFLEVBQ0YsNkJBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQ3ZCLFFBQVEsQ0FBQyxFQUhvQixDQUdwQixDQUFDLENBQUM7WUFFZixPQUFLLElBQUksR0FBRyxPQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckMsQ0FBQzs7UUFSRCxHQUFHLENBQUMsQ0FBVyxVQUFLLEVBQUwsZUFBSyxFQUFMLG1CQUFLLEVBQUwsSUFBSztZQUFmLElBQUksRUFBRSxjQUFBO29CQUFGLEVBQUU7U0FRVjtRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVPLGlDQUFjLEdBQXRCLFVBQXVCLEVBQWUsRUFBRSxFQUFnQixFQUFFLFFBQXVCO1FBRTdFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFDLEdBQWlCO1lBRXRDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDcEIsQ0FBQztnQkFDRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQ2pCLENBQUM7b0JBQ0csR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUNyQixHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLENBQUM7Z0JBRUQsUUFBUSxFQUFFLENBQUM7WUFDZixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0wsZUFBQztBQUFELENBakRBLEFBaURDLElBQUE7QUFqRFksNEJBQVE7QUFtRHJCLG1CQUFtQixHQUFpQjtJQUVoQyxNQUFNLENBQWlCLEdBQUc7U0FDckIsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7VUFDN0IsSUFBSSwrREFBOEIsQ0FBYyxDQUFDLENBQUM7VUFDbEQsQ0FBQyxFQUZHLENBRUgsQ0FDTixDQUFDO0FBQ1YsQ0FBQzs7OztBQ25FRDtJQUFBO0lBd1BBLENBQUM7SUFsSmlCLFVBQUssR0FBbkIsVUFBb0IsS0FBWSxFQUFFLFlBQTJCO1FBQTNCLDZCQUFBLEVBQUEsbUJBQTJCO1FBRXpELE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUNyQixDQUFDO1lBQ0csS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUM7Z0JBQ0ksRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDO29CQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQztnQkFDbEMsSUFBSTtvQkFDQSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBQ0wsV0FBQztBQUFELENBeFBBLEFBd1BDO0FBdFBpQixjQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBRyxHQUFHLENBQUMsQ0FBQztBQUNSLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLFFBQUcsR0FBRyxFQUFFLENBQUM7QUFDVCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNmLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBTyxHQUFHLEVBQUUsQ0FBQztBQUNiLGNBQVMsR0FBRyxFQUFFLENBQUM7QUFDZixRQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ1QsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsV0FBTSxHQUFHLEVBQUUsQ0FBQztBQUNaLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxjQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ2YsZUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNoQixXQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ1osYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGFBQVEsR0FBRyxFQUFFLENBQUM7QUFDZCxhQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2QsYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGFBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixhQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsYUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLGFBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixhQUFRLEdBQUcsR0FBRyxD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QUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksYUFBYSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvRCxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztJQUVGLFNBQVMsQ0FBQyxLQUFLLEdBQUc7UUFDZCxNQUFNLENBQUMsSUFBSSxxQkFBTyxDQUFDLFVBQVMsT0FBTyxFQUFFLE1BQU07WUFDdkMsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEQsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDVixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLHVDQUF1QztnQkFDdkMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUM7QUFDTixDQUFDO0FBUVksUUFBQSxTQUFTLEdBQUcsU0FBUyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGJhc2VzLmpzXG4vLyBVdGlsaXR5IGZvciBjb252ZXJ0aW5nIG51bWJlcnMgdG8vZnJvbSBkaWZmZXJlbnQgYmFzZXMvYWxwaGFiZXRzLlxuLy8gU2VlIFJFQURNRS5tZCBmb3IgZGV0YWlscy5cblxudmFyIGJhc2VzID0gKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiAod2luZG93LkJhc2VzID0ge30pKTtcblxuLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbnVtYmVyIGZvciB0aGUgZ2l2ZW4gYWxwaGFiZXQ6XG5iYXNlcy50b0FscGhhYmV0ID0gZnVuY3Rpb24gKG51bSwgYWxwaGFiZXQpIHtcbiAgICB2YXIgYmFzZSA9IGFscGhhYmV0Lmxlbmd0aDtcbiAgICB2YXIgZGlnaXRzID0gW107ICAgIC8vIHRoZXNlIHdpbGwgYmUgaW4gcmV2ZXJzZSBvcmRlciBzaW5jZSBhcnJheXMgYXJlIHN0YWNrc1xuXG4gICAgLy8gZXhlY3V0ZSBhdCBsZWFzdCBvbmNlLCBldmVuIGlmIG51bSBpcyAwLCBzaW5jZSB3ZSBzaG91bGQgcmV0dXJuIHRoZSAnMCc6XG4gICAgZG8ge1xuICAgICAgICBkaWdpdHMucHVzaChudW0gJSBiYXNlKTsgICAgLy8gVE9ETyBoYW5kbGUgbmVnYXRpdmVzIHByb3Blcmx5P1xuICAgICAgICBudW0gPSBNYXRoLmZsb29yKG51bSAvIGJhc2UpO1xuICAgIH0gd2hpbGUgKG51bSA+IDApO1xuXG4gICAgdmFyIGNoYXJzID0gW107XG4gICAgd2hpbGUgKGRpZ2l0cy5sZW5ndGgpIHtcbiAgICAgICAgY2hhcnMucHVzaChhbHBoYWJldFtkaWdpdHMucG9wKCldKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xufTtcblxuLy8gUmV0dXJucyBhbiBpbnRlZ2VyIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBzdHJpbmcgZm9yIHRoZSBnaXZlbiBhbHBoYWJldDpcbmJhc2VzLmZyb21BbHBoYWJldCA9IGZ1bmN0aW9uIChzdHIsIGFscGhhYmV0KSB7XG4gICAgdmFyIGJhc2UgPSBhbHBoYWJldC5sZW5ndGg7XG4gICAgdmFyIHBvcyA9IDA7XG4gICAgdmFyIG51bSA9IDA7XG4gICAgdmFyIGM7XG5cbiAgICB3aGlsZSAoc3RyLmxlbmd0aCkge1xuICAgICAgICBjID0gc3RyW3N0ci5sZW5ndGggLSAxXTtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cigwLCBzdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgIG51bSArPSBNYXRoLnBvdyhiYXNlLCBwb3MpICogYWxwaGFiZXQuaW5kZXhPZihjKTtcbiAgICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bTtcbn07XG5cbi8vIEtub3duIGFscGhhYmV0czpcbmJhc2VzLk5VTUVSQUxTID0gJzAxMjM0NTY3ODknO1xuYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xuYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UgPSBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS50b1VwcGVyQ2FzZSgpO1xuYmFzZXMuS05PV05fQUxQSEFCRVRTID0ge307XG5cbi8vIEVhY2ggb2YgdGhlIG51bWJlciBvbmVzLCBzdGFydGluZyBmcm9tIGJhc2UtMiAoYmFzZS0xIGRvZXNuJ3QgbWFrZSBzZW5zZT8pOlxuZm9yICh2YXIgaSA9IDI7IGkgPD0gMTA7IGkrKykge1xuICAgIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tpXSA9IGJhc2VzLk5VTUVSQUxTLnN1YnN0cigwLCBpKTtcbn1cblxuLy8gTm9kZSdzIG5hdGl2ZSBoZXggaXMgMC05IGZvbGxvd2VkIGJ5ICpsb3dlcmNhc2UqIGEtZiwgc28gd2UnbGwgdGFrZSB0aGF0XG4vLyBhcHByb2FjaCBmb3IgZXZlcnl0aGluZyBmcm9tIGJhc2UtMTEgdG8gYmFzZS0xNjpcbmZvciAodmFyIGkgPSAxMTsgaSA8PSAxNjsgaSsrKSB7XG4gICAgYmFzZXMuS05PV05fQUxQSEFCRVRTW2ldID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS5zdWJzdHIoMCwgaSAtIDEwKTtcbn1cblxuLy8gV2UgYWxzbyBtb2RlbCBiYXNlLTM2IG9mZiBvZiB0aGF0LCBqdXN0IHVzaW5nIHRoZSBmdWxsIGxldHRlciBhbHBoYWJldDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1szNl0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBBbmQgYmFzZS02MiB3aWxsIGJlIHRoZSB1cHBlcmNhc2UgbGV0dGVycyBhZGRlZDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0U7XG5cbi8vIEZvciBiYXNlLTI2LCB3ZSdsbCBhc3N1bWUgdGhlIHVzZXIgd2FudHMganVzdCB0aGUgbGV0dGVyIGFscGhhYmV0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzI2XSA9IGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBXZSdsbCBhbHNvIGFkZCBhIHNpbWlsYXIgYmFzZS01MiwganVzdCBsZXR0ZXJzLCBsb3dlcmNhc2UgdGhlbiB1cHBlcmNhc2U6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbNTJdID0gYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5MRVRURVJTX1VQUEVSQ0FTRTtcblxuLy8gQmFzZS02NCBpcyBhIGZvcm1hbGx5LXNwZWNpZmllZCBhbHBoYWJldCB0aGF0IGhhcyBhIHBhcnRpY3VsYXIgb3JkZXI6XG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCAoYW5kIE5vZGUuanMgZm9sbG93cyB0aGlzIHRvbylcbi8vIFRPRE8gRklYTUUgQnV0IG91ciBjb2RlIGFib3ZlIGRvZXNuJ3QgYWRkIHBhZGRpbmchIERvbid0IHVzZSB0aGlzIHlldC4uLlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzY0XSA9IGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFICsgYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5OVU1FUkFMUyArICcrLyc7XG5cbi8vIEZsaWNrciBhbmQgb3RoZXJzIGFsc28gaGF2ZSBhIGJhc2UtNTggdGhhdCByZW1vdmVzIGNvbmZ1c2luZyBjaGFyYWN0ZXJzLCBidXRcbi8vIHRoZXJlIGlzbid0IGNvbnNlbnN1cyBvbiB0aGUgb3JkZXIgb2YgbG93ZXJjYXNlIHZzLiB1cHBlcmNhc2UuLi4gPS9cbi8vIGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9ncm91cHMvYXBpL2Rpc2N1c3MvNzIxNTc2MTY3MTM3ODYzOTIvXG4vLyBodHRwczovL2VuLmJpdGNvaW4uaXQvd2lraS9CYXNlNThDaGVja19lbmNvZGluZyNCYXNlNThfc3ltYm9sX2NoYXJ0XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZG91Z2FsL2Jhc2U1OC9ibG9iL21hc3Rlci9saWIvYmFzZTU4LnJiXG4vLyBodHRwOi8vaWNvbG9tYS5ibG9nc3BvdC5jb20vMjAxMC8wMy9jcmVhdGUteW91ci1vd24tYml0bHktdXNpbmctYmFzZTU4Lmh0bWxcbi8vIFdlJ2xsIGFyYml0cmFyaWx5IHN0YXkgY29uc2lzdGVudCB3aXRoIHRoZSBhYm92ZSBhbmQgdXNpbmcgbG93ZXJjYXNlIGZpcnN0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzU4XSA9IGJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0ucmVwbGFjZSgvWzBPbEldL2csICcnKTtcblxuLy8gQW5kIERvdWdsYXMgQ3JvY2tmb3JkIHNoYXJlZCBhIHNpbWlsYXIgYmFzZS0zMiBmcm9tIGJhc2UtMzY6XG4vLyBodHRwOi8vd3d3LmNyb2NrZm9yZC5jb20vd3JtZy9iYXNlMzIuaHRtbFxuLy8gVW5saWtlIG91ciBiYXNlLTM2LCBoZSBleHBsaWNpdGx5IHNwZWNpZmllcyB1cHBlcmNhc2UgbGV0dGVyc1xuYmFzZXMuS05PV05fQUxQSEFCRVRTWzMyXSA9IGJhc2VzLk5VTUVSQUxTICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UucmVwbGFjZSgvW0lMT1VdL2csICcnKTtcblxuLy8gQ2xvc3VyZSBoZWxwZXIgZm9yIGNvbnZlbmllbmNlIGFsaWFzZXMgbGlrZSBiYXNlcy50b0Jhc2UzNigpOlxuZnVuY3Rpb24gbWFrZUFsaWFzIChiYXNlLCBhbHBoYWJldCkge1xuICAgIGJhc2VzWyd0b0Jhc2UnICsgYmFzZV0gPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBiYXNlcy50b0FscGhhYmV0KG51bSwgYWxwaGFiZXQpO1xuICAgIH07XG4gICAgYmFzZXNbJ2Zyb21CYXNlJyArIGJhc2VdID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYWxwaGFiZXQpO1xuICAgIH07XG59XG5cbi8vIERvIHRoaXMgZm9yIGFsbCBrbm93biBhbHBoYWJldHM6XG5mb3IgKHZhciBiYXNlIGluIGJhc2VzLktOT1dOX0FMUEhBQkVUUykge1xuICAgIGlmIChiYXNlcy5LTk9XTl9BTFBIQUJFVFMuaGFzT3duUHJvcGVydHkoYmFzZSkpIHtcbiAgICAgICAgbWFrZUFsaWFzKGJhc2UsIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG4gICAgfVxufVxuXG4vLyBBbmQgYSBnZW5lcmljIGFsaWFzIHRvbzpcbmJhc2VzLnRvQmFzZSA9IGZ1bmN0aW9uIChudW0sIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMudG9BbHBoYWJldChudW0sIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG59O1xuXG5iYXNlcy5mcm9tQmFzZSA9IGZ1bmN0aW9uIChzdHIsIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYmFzZXMuS05PV05fQUxQSEFCRVRTW2Jhc2VdKTtcbn07XG4iLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3RlZmFucGVubmVyL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIDQuMC41XG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICAoZ2xvYmFsLkVTNlByb21pc2UgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG59XG5cbnZhciBfaXNBcnJheSA9IHVuZGVmaW5lZDtcbmlmICghQXJyYXkuaXNBcnJheSkge1xuICBfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcbn0gZWxzZSB7XG4gIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbn1cblxudmFyIGlzQXJyYXkgPSBfaXNBcnJheTtcblxudmFyIGxlbiA9IDA7XG52YXIgdmVydHhOZXh0ID0gdW5kZWZpbmVkO1xudmFyIGN1c3RvbVNjaGVkdWxlckZuID0gdW5kZWZpbmVkO1xuXG52YXIgYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICBxdWV1ZVtsZW5dID0gY2FsbGJhY2s7XG4gIHF1ZXVlW2xlbiArIDFdID0gYXJnO1xuICBsZW4gKz0gMjtcbiAgaWYgKGxlbiA9PT0gMikge1xuICAgIC8vIElmIGxlbiBpcyAyLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICBpZiAoY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgIGN1c3RvbVNjaGVkdWxlckZuKGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xufVxuXG5mdW5jdGlvbiBzZXRBc2FwKGFzYXBGbikge1xuICBhc2FwID0gYXNhcEZuO1xufVxuXG52YXIgYnJvd3NlcldpbmRvdyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkO1xudmFyIGJyb3dzZXJHbG9iYWwgPSBicm93c2VyV2luZG93IHx8IHt9O1xudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbnZhciBpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICh7fSkudG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4vLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxudmFyIGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuLy8gbm9kZVxuZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2N1am9qcy93aGVuL2lzc3Vlcy80MTAgZm9yIGRldGFpbHNcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gIH07XG59XG5cbi8vIHZlcnR4XG5mdW5jdGlvbiB1c2VWZXJ0eFRpbWVyKCkge1xuICBpZiAodHlwZW9mIHZlcnR4TmV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmVydHhOZXh0KGZsdXNoKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBub2RlLmRhdGEgPSBpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMjtcbiAgfTtcbn1cblxuLy8gd2ViIHdvcmtlclxuZnVuY3Rpb24gdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZVNldFRpbWVvdXQoKSB7XG4gIC8vIFN0b3JlIHNldFRpbWVvdXQgcmVmZXJlbmNlIHNvIGVzNi1wcm9taXNlIHdpbGwgYmUgdW5hZmZlY3RlZCBieVxuICAvLyBvdGhlciBjb2RlIG1vZGlmeWluZyBzZXRUaW1lb3V0IChsaWtlIHNpbm9uLnVzZUZha2VUaW1lcnMoKSlcbiAgdmFyIGdsb2JhbFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBnbG9iYWxTZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgfTtcbn1cblxudmFyIHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBxdWV1ZVtpXTtcbiAgICB2YXIgYXJnID0gcXVldWVbaSArIDFdO1xuXG4gICAgY2FsbGJhY2soYXJnKTtcblxuICAgIHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgIHF1ZXVlW2kgKyAxXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGxlbiA9IDA7XG59XG5cbmZ1bmN0aW9uIGF0dGVtcHRWZXJ0eCgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICB2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgIHJldHVybiB1c2VWZXJ0eFRpbWVyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xuICB9XG59XG5cbnZhciBzY2hlZHVsZUZsdXNoID0gdW5kZWZpbmVkO1xuLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbmlmIChpc05vZGUpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG59IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG59IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNZXNzYWdlQ2hhbm5lbCgpO1xufSBlbHNlIGlmIChicm93c2VyV2luZG93ID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IGF0dGVtcHRWZXJ0eCgpO1xufSBlbHNlIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdGhlbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcblxuICB2YXIgcGFyZW50ID0gdGhpcztcblxuICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoY2hpbGRbUFJPTUlTRV9JRF0gPT09IHVuZGVmaW5lZCkge1xuICAgIG1ha2VQcm9taXNlKGNoaWxkKTtcbiAgfVxuXG4gIHZhciBfc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gIGlmIChfc3RhdGUpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNhbGxiYWNrID0gX2FyZ3VtZW50c1tfc3RhdGUgLSAxXTtcbiAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaW52b2tlQ2FsbGJhY2soX3N0YXRlLCBjaGlsZCwgY2FsbGJhY2ssIHBhcmVudC5fcmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH0gZWxzZSB7XG4gICAgc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgfVxuXG4gIHJldHVybiBjaGlsZDtcbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlc29sdmVgIHJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVzb2x2ZWQgd2l0aCB0aGVcbiAgcGFzc2VkIGB2YWx1ZWAuIEl0IGlzIHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZXNvbHZlKDEpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgxKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlc29sdmVcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gdmFsdWUgdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlc29sdmVkIHdpdGhcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSBmdWxmaWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgYHZhbHVlYFxuKi9cbmZ1bmN0aW9uIHJlc29sdmUob2JqZWN0KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IENvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVzb2x2ZShwcm9taXNlLCBvYmplY3QpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxudmFyIFBST01JU0VfSUQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMTYpO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxudmFyIFBFTkRJTkcgPSB2b2lkIDA7XG52YXIgRlVMRklMTEVEID0gMTtcbnZhciBSRUpFQ1RFRCA9IDI7XG5cbnZhciBHRVRfVEhFTl9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiBzZWxmRnVsZmlsbG1lbnQoKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbn1cblxuZnVuY3Rpb24gY2Fubm90UmV0dXJuT3duKCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xufVxuXG5mdW5jdGlvbiBnZXRUaGVuKHByb21pc2UpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgcmV0dXJuIEdFVF9USEVOX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICB0cnkge1xuICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICBhc2FwKGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgIHZhciBlcnJvciA9IHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoc2VhbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9XG4gIH0sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBGVUxGSUxMRUQpIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gUkVKRUNURUQpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4kJCkge1xuICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3RvciAmJiB0aGVuJCQgPT09IHRoZW4gJiYgbWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3Rvci5yZXNvbHZlID09PSByZXNvbHZlKSB7XG4gICAgaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoZW4kJCA9PT0gR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgIH0gZWxzZSBpZiAodGhlbiQkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoZW4kJCkpIHtcbiAgICAgIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuJCQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgfSBlbHNlIGlmIChvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUsIGdldFRoZW4odmFsdWUpKTtcbiAgfSBlbHNlIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gIH1cblxuICBwdWJsaXNoKHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHByb21pc2UuX3Jlc3VsdCA9IHZhbHVlO1xuICBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRDtcblxuICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgYXNhcChwdWJsaXNoLCBwcm9taXNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gIGFzYXAocHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX3N1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgdmFyIGxlbmd0aCA9IF9zdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgcGFyZW50Ll9vbmVycm9yID0gbnVsbDtcblxuICBfc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBfc3Vic2NyaWJlcnNbbGVuZ3RoICsgRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gIF9zdWJzY3JpYmVyc1tsZW5ndGggKyBSRUpFQ1RFRF0gPSBvblJlamVjdGlvbjtcblxuICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICBhc2FwKHB1Ymxpc2gsIHBhcmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaChwcm9taXNlKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICB2YXIgc2V0dGxlZCA9IHByb21pc2UuX3N0YXRlO1xuXG4gIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2hpbGQgPSB1bmRlZmluZWQsXG4gICAgICBjYWxsYmFjayA9IHVuZGVmaW5lZCxcbiAgICAgIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgIGlmIChjaGlsZCkge1xuICAgICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgIH1cbiAgfVxuXG4gIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG59XG5cbmZ1bmN0aW9uIEVycm9yT2JqZWN0KCkge1xuICB0aGlzLmVycm9yID0gbnVsbDtcbn1cblxudmFyIFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgIHJldHVybiBUUllfQ0FUQ0hfRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICB2YXIgaGFzQ2FsbGJhY2sgPSBpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkLFxuICAgICAgZXJyb3IgPSB1bmRlZmluZWQsXG4gICAgICBzdWNjZWVkZWQgPSB1bmRlZmluZWQsXG4gICAgICBmYWlsZWQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgdmFsdWUgPSB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgZXJyb3IgPSB2YWx1ZS5lcnJvcjtcbiAgICAgIHZhbHVlID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgLy8gbm9vcFxuICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IEZVTEZJTExFRCkge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICB0cnkge1xuICAgIHJlc29sdmVyKGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKSB7XG4gICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIF9yZWplY3QocHJvbWlzZSwgZSk7XG4gIH1cbn1cblxudmFyIGlkID0gMDtcbmZ1bmN0aW9uIG5leHRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbmZ1bmN0aW9uIG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgcHJvbWlzZVtQUk9NSVNFX0lEXSA9IGlkKys7XG4gIHByb21pc2UuX3N0YXRlID0gdW5kZWZpbmVkO1xuICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gIHByb21pc2UuX3N1YnNjcmliZXJzID0gW107XG59XG5cbmZ1bmN0aW9uIEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgdGhpcy5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuXG4gIGlmICghdGhpcy5wcm9taXNlW1BST01JU0VfSURdKSB7XG4gICAgbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgfVxuXG4gIGlmIChpc0FycmF5KGlucHV0KSkge1xuICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5sZW5ndGggPSBpbnB1dC5sZW5ndGg7XG4gICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcblxuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGggfHwgMDtcbiAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgaWYgKHRoaXMuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgX3JlamVjdCh0aGlzLnByb21pc2UsIHZhbGlkYXRpb25FcnJvcigpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICB2YXIgX2lucHV0ID0gdGhpcy5faW5wdXQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IHRoaXMuX3N0YXRlID09PSBQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHRoaXMuX2VhY2hFbnRyeShfaW5wdXRbaV0sIGkpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24gKGVudHJ5LCBpKSB7XG4gIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgdmFyIHJlc29sdmUkJCA9IGMucmVzb2x2ZTtcblxuICBpZiAocmVzb2x2ZSQkID09PSByZXNvbHZlKSB7XG4gICAgdmFyIF90aGVuID0gZ2V0VGhlbihlbnRyeSk7XG5cbiAgICBpZiAoX3RoZW4gPT09IHRoZW4gJiYgZW50cnkuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgICB0aGlzLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fcmVtYWluaW5nLS07XG4gICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICB9IGVsc2UgaWYgKGMgPT09IFByb21pc2UpIHtcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobm9vcCk7XG4gICAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIGVudHJ5LCBfdGhlbik7XG4gICAgICB0aGlzLl93aWxsU2V0dGxlQXQocHJvbWlzZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbiAocmVzb2x2ZSQkKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlJCQoZW50cnkpO1xuICAgICAgfSksIGkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl93aWxsU2V0dGxlQXQocmVzb2x2ZSQkKGVudHJ5KSwgaSk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbiAoc3RhdGUsIGksIHZhbHVlKSB7XG4gIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuXG4gIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gUEVORElORykge1xuICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbiAocHJvbWlzZSwgaSkge1xuICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIGVudW1lcmF0b3IuX3NldHRsZWRBdChGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoUkVKRUNURUQsIGksIHJlYXNvbik7XG4gIH0pO1xufTtcblxuLyoqXG4gIGBQcm9taXNlLmFsbGAgYWNjZXB0cyBhbiBhcnJheSBvZiBwcm9taXNlcywgYW5kIHJldHVybnMgYSBuZXcgcHJvbWlzZSB3aGljaFxuICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSBvZiBmdWxmaWxsbWVudCB2YWx1ZXMgZm9yIHRoZSBwYXNzZWQgcHJvbWlzZXMsIG9yXG4gIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiBvZiB0aGUgZmlyc3QgcGFzc2VkIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQuIEl0IGNhc3RzIGFsbFxuICBlbGVtZW50cyBvZiB0aGUgcGFzc2VkIGl0ZXJhYmxlIHRvIHByb21pc2VzIGFzIGl0IHJ1bnMgdGhpcyBhbGdvcml0aG0uXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlc29sdmUoMik7XG4gIGxldCBwcm9taXNlMyA9IHJlc29sdmUoMyk7XG4gIGxldCBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBUaGUgYXJyYXkgaGVyZSB3b3VsZCBiZSBbIDEsIDIsIDMgXTtcbiAgfSk7XG4gIGBgYFxuXG4gIElmIGFueSBvZiB0aGUgYHByb21pc2VzYCBnaXZlbiB0byBgYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gIHRoYXQgaXMgcmVqZWN0ZWQgd2lsbCBiZSBnaXZlbiBhcyBhbiBhcmd1bWVudCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZXMnc1xuICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlamVjdChuZXcgRXJyb3IoXCIyXCIpKTtcbiAgbGV0IHByb21pc2UzID0gcmVqZWN0KG5ldyBFcnJvcihcIjNcIikpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgYWxsXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBcnJheX0gZW50cmllcyBhcnJheSBvZiBwcm9taXNlc1xuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBsYWJlbGluZyB0aGUgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuICBAc3RhdGljXG4qL1xuZnVuY3Rpb24gYWxsKGVudHJpZXMpIHtcbiAgcmV0dXJuIG5ldyBFbnVtZXJhdG9yKHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yYWNlYCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2ggaXMgc2V0dGxlZCBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlXG4gIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIHNldHRsZS5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHJlc3VsdCA9PT0gJ3Byb21pc2UgMicgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFByb21pc2UucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdFxuICBzZXR0bGVkIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlXG4gIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IHNldHRsZWQgcHJvbWlzZSBoYXNcbiAgYmVjb21lIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gIHByb21pc2Ugd2lsbCBiZWNvbWUgcmVqZWN0ZWQ6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMScpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIGxldCBwcm9taXNlMiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcigncHJvbWlzZSAyJykpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICB9KTtcbiAgYGBgXG5cbiAgQW4gZXhhbXBsZSByZWFsLXdvcmxkIHVzZSBjYXNlIGlzIGltcGxlbWVudGluZyB0aW1lb3V0czpcblxuICBgYGBqYXZhc2NyaXB0XG4gIFByb21pc2UucmFjZShbYWpheCgnZm9vLmpzb24nKSwgdGltZW91dCg1MDAwKV0pXG4gIGBgYFxuXG4gIEBtZXRob2QgcmFjZVxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2Ugd2hpY2ggc2V0dGxlcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIGZpcnN0IHBhc3NlZFxuICBwcm9taXNlIHRvIHNldHRsZS5cbiovXG5mdW5jdGlvbiByYWNlKGVudHJpZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkoZW50cmllcykpIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChfLCByZWplY3QpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgcGFzc2VkIGByZWFzb25gLlxuICBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlbiBgcmVhc29uYC5cbiovXG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBuZWVkc1Jlc29sdmVyKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG59XG5cbmZ1bmN0aW9uIG5lZWRzTmV3KCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xufVxuXG4vKipcbiAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgVGVybWlub2xvZ3lcbiAgLS0tLS0tLS0tLS1cblxuICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAtIGB0aGVuYWJsZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyBhIGB0aGVuYCBtZXRob2QuXG4gIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gIC0gYHJlYXNvbmAgaXMgYSB2YWx1ZSB0aGF0IGluZGljYXRlcyB3aHkgYSBwcm9taXNlIHdhcyByZWplY3RlZC5cbiAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gIFByb21pc2VzIHRoYXQgYXJlIGZ1bGZpbGxlZCBoYXZlIGEgZnVsZmlsbG1lbnQgdmFsdWUgYW5kIGFyZSBpbiB0aGUgZnVsZmlsbGVkXG4gIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgUHJvbWlzZXMgY2FuIGFsc28gYmUgc2FpZCB0byAqcmVzb2x2ZSogYSB2YWx1ZS4gIElmIHRoaXMgdmFsdWUgaXMgYWxzbyBhXG4gIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gIGl0c2VsZiByZWplY3QsIGFuZCBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdpbGxcbiAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICBCYXNpYyBVc2FnZTpcbiAgLS0tLS0tLS0tLS0tXG5cbiAgYGBganNcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBvbiBzdWNjZXNzXG4gICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAvLyBvbiBmYWlsdXJlXG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgQWR2YW5jZWQgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLS0tLVxuXG4gIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgYGBganNcbiAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgLy8gb24gcmVqZWN0aW9uXG4gIH0pO1xuICBgYGBcblxuICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gIGBgYGpzXG4gIFByb21pc2UuYWxsKFtcbiAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICBnZXRKU09OKCcvY29tbWVudHMnKVxuICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgIHZhbHVlc1sxXSAvLyA9PiBjb21tZW50c0pTT05cblxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH0pO1xuICBgYGBcblxuICBAY2xhc3MgUHJvbWlzZVxuICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgdGhpc1tQUk9NSVNFX0lEXSA9IG5leHRJZCgpO1xuICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICBpZiAobm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICB0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicgJiYgbmVlZHNSZXNvbHZlcigpO1xuICAgIHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlID8gaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpIDogbmVlZHNOZXcoKTtcbiAgfVxufVxuXG5Qcm9taXNlLmFsbCA9IGFsbDtcblByb21pc2UucmFjZSA9IHJhY2U7XG5Qcm9taXNlLnJlc29sdmUgPSByZXNvbHZlO1xuUHJvbWlzZS5yZWplY3QgPSByZWplY3Q7XG5Qcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBzZXRTY2hlZHVsZXI7XG5Qcm9taXNlLl9zZXRBc2FwID0gc2V0QXNhcDtcblByb21pc2UuX2FzYXAgPSBhc2FwO1xuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgLyoqXG4gICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgd2hpY2ggcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGVcbiAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgLy8gdXNlciBpcyBhdmFpbGFibGVcbiAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQ2hhaW5pbmdcbiAgICAtLS0tLS0tLVxuICBcbiAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmaXJzdCBwcm9taXNlJ3MgZnVsZmlsbG1lbnRcbiAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiB1c2VyLm5hbWU7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJOYW1lKSB7XG4gICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICB9KTtcbiAgXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgfSk7XG4gICAgYGBgXG4gICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEFzc2ltaWxhdGlvblxuICAgIC0tLS0tLS0tLS0tLVxuICBcbiAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICBmdWxmaWxsbWVudCBvciByZWplY3Rpb24gaGFuZGxlci4gVGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIHRoZW4gYmUgcGVuZGluZ1xuICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBTaW1wbGUgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCByZXN1bHQ7XG4gIFxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBmaW5kUmVzdWx0KCk7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9XG4gICAgYGBgXG4gIFxuICAgIEVycmJhY2sgRXhhbXBsZVxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRSZXN1bHQoZnVuY3Rpb24ocmVzdWx0LCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFByb21pc2UgRXhhbXBsZTtcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCBhdXRob3IsIGJvb2tzO1xuICBcbiAgICB0cnkge1xuICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgIC8vIHN1Y2Nlc3NcbiAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH1cbiAgICBgYGBcbiAgXG4gICAgRXJyYmFjayBFeGFtcGxlXG4gIFxuICAgIGBgYGpzXG4gIFxuICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcbiAgXG4gICAgfVxuICBcbiAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuICBcbiAgICB9XG4gIFxuICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvdW5kQm9va3MoYm9va3MpO1xuICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgUHJvbWlzZSBFeGFtcGxlO1xuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgZmluZEF1dGhvcigpLlxuICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICB0aGVuKGZ1bmN0aW9uKGJvb2tzKXtcbiAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQG1ldGhvZCB0aGVuXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25GdWxmaWxsZWRcbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG4gIHRoZW46IHRoZW4sXG5cbiAgLyoqXG4gICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG4gIFxuICAgIGBgYGpzXG4gICAgZnVuY3Rpb24gZmluZEF1dGhvcigpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgfVxuICBcbiAgICAvLyBzeW5jaHJvbm91c1xuICAgIHRyeSB7XG4gICAgICBmaW5kQXV0aG9yKCk7XG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfVxuICBcbiAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBAbWV0aG9kIGNhdGNoXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3Rpb25cbiAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgQHJldHVybiB7UHJvbWlzZX1cbiAgKi9cbiAgJ2NhdGNoJzogZnVuY3Rpb24gX2NhdGNoKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHBvbHlmaWxsKCkge1xuICAgIHZhciBsb2NhbCA9IHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IGdsb2JhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgIGlmIChQKSB7XG4gICAgICAgIHZhciBwcm9taXNlVG9TdHJpbmcgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZVRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gc2lsZW50bHkgaWdub3JlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2VUb1N0cmluZyA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxvY2FsLlByb21pc2UgPSBQcm9taXNlO1xufVxuXG4vLyBTdHJhbmdlIGNvbXBhdC4uXG5Qcm9taXNlLnBvbHlmaWxsID0gcG9seWZpbGw7XG5Qcm9taXNlLlByb21pc2UgPSBQcm9taXNlO1xuXG5yZXR1cm4gUHJvbWlzZTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVzNi1wcm9taXNlLm1hcCIsIi8qIVxuXHRQYXBhIFBhcnNlXG5cdHY0LjEuNFxuXHRodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlXG4qL1xuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpXG57XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdHtcblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cylcblx0e1xuXHRcdC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuXHRcdC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuXHRcdC8vIGxpa2UgTm9kZS5cblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuXHRcdHJvb3QuUGFwYSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbigpXG57XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgZ2xvYmFsID0gKGZ1bmN0aW9uICgpIHtcblx0XHQvLyBhbHRlcm5hdGl2ZSBtZXRob2QsIHNpbWlsYXIgdG8gYEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKClgXG5cdFx0Ly8gYnV0IHdpdGhvdXQgdXNpbmcgYGV2YWxgICh3aGljaCBpcyBkaXNhYmxlZCB3aGVuXG5cdFx0Ly8gdXNpbmcgQ29udGVudCBTZWN1cml0eSBQb2xpY3kpLlxuXG5cdFx0aWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gc2VsZjsgfVxuXHRcdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gd2luZG93OyB9XG5cdFx0aWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBnbG9iYWw7IH1cblxuICAgICAgICAvLyBXaGVuIHJ1bm5pbmcgdGVzdHMgbm9uZSBvZiB0aGUgYWJvdmUgaGF2ZSBiZWVuIGRlZmluZWRcbiAgICAgICAgcmV0dXJuIHt9O1xuXHR9KSgpO1xuXG5cblx0dmFyIElTX1dPUktFUiA9ICFnbG9iYWwuZG9jdW1lbnQgJiYgISFnbG9iYWwucG9zdE1lc3NhZ2UsXG5cdFx0SVNfUEFQQV9XT1JLRVIgPSBJU19XT1JLRVIgJiYgLyhcXD98JilwYXBhd29ya2VyKD18JnwkKS8udGVzdChnbG9iYWwubG9jYXRpb24uc2VhcmNoKSxcblx0XHRMT0FERURfU1lOQyA9IGZhbHNlLCBBVVRPX1NDUklQVF9QQVRIO1xuXHR2YXIgd29ya2VycyA9IHt9LCB3b3JrZXJJZENvdW50ZXIgPSAwO1xuXG5cdHZhciBQYXBhID0ge307XG5cblx0UGFwYS5wYXJzZSA9IENzdlRvSnNvbjtcblx0UGFwYS51bnBhcnNlID0gSnNvblRvQ3N2O1xuXG5cdFBhcGEuUkVDT1JEX1NFUCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApO1xuXHRQYXBhLlVOSVRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMSk7XG5cdFBhcGEuQllURV9PUkRFUl9NQVJLID0gJ1xcdWZlZmYnO1xuXHRQYXBhLkJBRF9ERUxJTUlURVJTID0gWydcXHInLCAnXFxuJywgJ1wiJywgUGFwYS5CWVRFX09SREVSX01BUktdO1xuXHRQYXBhLldPUktFUlNfU1VQUE9SVEVEID0gIUlTX1dPUktFUiAmJiAhIWdsb2JhbC5Xb3JrZXI7XG5cdFBhcGEuU0NSSVBUX1BBVEggPSBudWxsO1x0Ly8gTXVzdCBiZSBzZXQgYnkgeW91ciBjb2RlIGlmIHlvdSB1c2Ugd29ya2VycyBhbmQgdGhpcyBsaWIgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5XG5cblx0Ly8gQ29uZmlndXJhYmxlIGNodW5rIHNpemVzIGZvciBsb2NhbCBhbmQgcmVtb3RlIGZpbGVzLCByZXNwZWN0aXZlbHlcblx0UGFwYS5Mb2NhbENodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogMTA7XHQvLyAxMCBNQlxuXHRQYXBhLlJlbW90ZUNodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogNTtcdC8vIDUgTUJcblx0UGFwYS5EZWZhdWx0RGVsaW1pdGVyID0gJywnO1x0XHRcdC8vIFVzZWQgaWYgbm90IHNwZWNpZmllZCBhbmQgZGV0ZWN0aW9uIGZhaWxzXG5cblx0Ly8gRXhwb3NlZCBmb3IgdGVzdGluZyBhbmQgZGV2ZWxvcG1lbnQgb25seVxuXHRQYXBhLlBhcnNlciA9IFBhcnNlcjtcblx0UGFwYS5QYXJzZXJIYW5kbGUgPSBQYXJzZXJIYW5kbGU7XG5cdFBhcGEuTmV0d29ya1N0cmVhbWVyID0gTmV0d29ya1N0cmVhbWVyO1xuXHRQYXBhLkZpbGVTdHJlYW1lciA9IEZpbGVTdHJlYW1lcjtcblx0UGFwYS5TdHJpbmdTdHJlYW1lciA9IFN0cmluZ1N0cmVhbWVyO1xuXG5cdGlmIChnbG9iYWwualF1ZXJ5KVxuXHR7XG5cdFx0dmFyICQgPSBnbG9iYWwualF1ZXJ5O1xuXHRcdCQuZm4ucGFyc2UgPSBmdW5jdGlvbihvcHRpb25zKVxuXHRcdHtcblx0XHRcdHZhciBjb25maWcgPSBvcHRpb25zLmNvbmZpZyB8fCB7fTtcblx0XHRcdHZhciBxdWV1ZSA9IFtdO1xuXG5cdFx0XHR0aGlzLmVhY2goZnVuY3Rpb24oaWR4KVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgc3VwcG9ydGVkID0gJCh0aGlzKS5wcm9wKCd0YWdOYW1lJykudG9VcHBlckNhc2UoKSA9PT0gJ0lOUFVUJ1xuXHRcdFx0XHRcdFx0XHRcdCYmICQodGhpcykuYXR0cigndHlwZScpLnRvTG93ZXJDYXNlKCkgPT09ICdmaWxlJ1xuXHRcdFx0XHRcdFx0XHRcdCYmIGdsb2JhbC5GaWxlUmVhZGVyO1xuXG5cdFx0XHRcdGlmICghc3VwcG9ydGVkIHx8ICF0aGlzLmZpbGVzIHx8IHRoaXMuZmlsZXMubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1x0Ly8gY29udGludWUgdG8gbmV4dCBpbnB1dCBlbGVtZW50XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbGVzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cXVldWUucHVzaCh7XG5cdFx0XHRcdFx0XHRmaWxlOiB0aGlzLmZpbGVzW2ldLFxuXHRcdFx0XHRcdFx0aW5wdXRFbGVtOiB0aGlzLFxuXHRcdFx0XHRcdFx0aW5zdGFuY2VDb25maWc6ICQuZXh0ZW5kKHt9LCBjb25maWcpXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRwYXJzZU5leHRGaWxlKCk7XHQvLyBiZWdpbiBwYXJzaW5nXG5cdFx0XHRyZXR1cm4gdGhpcztcdFx0Ly8gbWFpbnRhaW5zIGNoYWluYWJpbGl0eVxuXG5cblx0XHRcdGZ1bmN0aW9uIHBhcnNlTmV4dEZpbGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocXVldWUubGVuZ3RoID09PSAwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5jb21wbGV0ZSkpXG5cdFx0XHRcdFx0XHRvcHRpb25zLmNvbXBsZXRlKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGYgPSBxdWV1ZVswXTtcblxuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmJlZm9yZSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcmV0dXJuZWQgPSBvcHRpb25zLmJlZm9yZShmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgcmV0dXJuZWQgPT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChyZXR1cm5lZC5hY3Rpb24gPT09ICdhYm9ydCcpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGVycm9yKCdBYm9ydEVycm9yJywgZi5maWxlLCBmLmlucHV0RWxlbSwgcmV0dXJuZWQucmVhc29uKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1x0Ly8gQWJvcnRzIGFsbCBxdWV1ZWQgZmlsZXMgaW1tZWRpYXRlbHlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkLmFjdGlvbiA9PT0gJ3NraXAnKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcdC8vIHBhcnNlIHRoZSBuZXh0IGZpbGUgaW4gdGhlIHF1ZXVlLCBpZiBhbnlcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJldHVybmVkLmNvbmZpZyA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0XHRcdGYuaW5zdGFuY2VDb25maWcgPSAkLmV4dGVuZChmLmluc3RhbmNlQ29uZmlnLCByZXR1cm5lZC5jb25maWcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChyZXR1cm5lZCA9PT0gJ3NraXAnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFdyYXAgdXAgdGhlIHVzZXIncyBjb21wbGV0ZSBjYWxsYmFjaywgaWYgYW55LCBzbyB0aGF0IG91cnMgYWxzbyBnZXRzIGV4ZWN1dGVkXG5cdFx0XHRcdHZhciB1c2VyQ29tcGxldGVGdW5jID0gZi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZTtcblx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZSA9IGZ1bmN0aW9uKHJlc3VsdHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbih1c2VyQ29tcGxldGVGdW5jKSlcblx0XHRcdFx0XHRcdHVzZXJDb21wbGV0ZUZ1bmMocmVzdWx0cywgZi5maWxlLCBmLmlucHV0RWxlbSk7XG5cdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0UGFwYS5wYXJzZShmLmZpbGUsIGYuaW5zdGFuY2VDb25maWcpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBlcnJvcihuYW1lLCBmaWxlLCBlbGVtLCByZWFzb24pXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuZXJyb3IpKVxuXHRcdFx0XHRcdG9wdGlvbnMuZXJyb3Ioe25hbWU6IG5hbWV9LCBmaWxlLCBlbGVtLCByZWFzb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBmaWxlQ29tcGxldGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRxdWV1ZS5zcGxpY2UoMCwgMSk7XG5cdFx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXG5cdGlmIChJU19QQVBBX1dPUktFUilcblx0e1xuXHRcdGdsb2JhbC5vbm1lc3NhZ2UgPSB3b3JrZXJUaHJlYWRSZWNlaXZlZE1lc3NhZ2U7XG5cdH1cblx0ZWxzZSBpZiAoUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0e1xuXHRcdEFVVE9fU0NSSVBUX1BBVEggPSBnZXRTY3JpcHRQYXRoKCk7XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgc2NyaXB0IHdhcyBsb2FkZWQgc3luY2hyb25vdXNseVxuXHRcdGlmICghZG9jdW1lbnQuYm9keSlcblx0XHR7XG5cdFx0XHQvLyBCb2R5IGRvZXNuJ3QgZXhpc3QgeWV0LCBtdXN0IGJlIHN5bmNocm9ub3VzXG5cdFx0XHRMT0FERURfU1lOQyA9IHRydWU7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRMT0FERURfU1lOQyA9IHRydWU7XG5cdFx0XHR9LCB0cnVlKTtcblx0XHR9XG5cdH1cblxuXG5cblxuXHRmdW5jdGlvbiBDc3ZUb0pzb24oX2lucHV0LCBfY29uZmlnKVxuXHR7XG5cdFx0X2NvbmZpZyA9IF9jb25maWcgfHwge307XG5cdFx0X2NvbmZpZy5keW5hbWljVHlwaW5nID0gX2NvbmZpZy5keW5hbWljVHlwaW5nIHx8IGZhbHNlO1xuXG5cdFx0aWYgKF9jb25maWcud29ya2VyICYmIFBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdFx0e1xuXHRcdFx0dmFyIHcgPSBuZXdXb3JrZXIoKTtcblxuXHRcdFx0dy51c2VyU3RlcCA9IF9jb25maWcuc3RlcDtcblx0XHRcdHcudXNlckNodW5rID0gX2NvbmZpZy5jaHVuaztcblx0XHRcdHcudXNlckNvbXBsZXRlID0gX2NvbmZpZy5jb21wbGV0ZTtcblx0XHRcdHcudXNlckVycm9yID0gX2NvbmZpZy5lcnJvcjtcblxuXHRcdFx0X2NvbmZpZy5zdGVwID0gaXNGdW5jdGlvbihfY29uZmlnLnN0ZXApO1xuXHRcdFx0X2NvbmZpZy5jaHVuayA9IGlzRnVuY3Rpb24oX2NvbmZpZy5jaHVuayk7XG5cdFx0XHRfY29uZmlnLmNvbXBsZXRlID0gaXNGdW5jdGlvbihfY29uZmlnLmNvbXBsZXRlKTtcblx0XHRcdF9jb25maWcuZXJyb3IgPSBpc0Z1bmN0aW9uKF9jb25maWcuZXJyb3IpO1xuXHRcdFx0ZGVsZXRlIF9jb25maWcud29ya2VyO1x0Ly8gcHJldmVudCBpbmZpbml0ZSBsb29wXG5cblx0XHRcdHcucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRpbnB1dDogX2lucHV0LFxuXHRcdFx0XHRjb25maWc6IF9jb25maWcsXG5cdFx0XHRcdHdvcmtlcklkOiB3LmlkXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBzdHJlYW1lciA9IG51bGw7XG5cdFx0aWYgKHR5cGVvZiBfaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdGlmIChfY29uZmlnLmRvd25sb2FkKVxuXHRcdFx0XHRzdHJlYW1lciA9IG5ldyBOZXR3b3JrU3RyZWFtZXIoX2NvbmZpZyk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHN0cmVhbWVyID0gbmV3IFN0cmluZ1N0cmVhbWVyKF9jb25maWcpO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgX2lucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgX2lucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gLi4uU2FmYXJpLiAoc2VlIGlzc3VlICMxMDYpXG5cdFx0XHRzdHJlYW1lciA9IG5ldyBGaWxlU3RyZWFtZXIoX2NvbmZpZyk7XG5cblx0XHRyZXR1cm4gc3RyZWFtZXIuc3RyZWFtKF9pbnB1dCk7XG5cdH1cblxuXG5cblxuXG5cblx0ZnVuY3Rpb24gSnNvblRvQ3N2KF9pbnB1dCwgX2NvbmZpZylcblx0e1xuXHRcdHZhciBfb3V0cHV0ID0gJyc7XG5cdFx0dmFyIF9maWVsZHMgPSBbXTtcblxuXHRcdC8vIERlZmF1bHQgY29uZmlndXJhdGlvblxuXG5cdFx0LyoqIHdoZXRoZXIgdG8gc3Vycm91bmQgZXZlcnkgZGF0dW0gd2l0aCBxdW90ZXMgKi9cblx0XHR2YXIgX3F1b3RlcyA9IGZhbHNlO1xuXG5cdFx0LyoqIHdoZXRoZXIgdG8gd3JpdGUgaGVhZGVycyAqL1xuXHRcdHZhciBfd3JpdGVIZWFkZXIgPSB0cnVlO1xuXG5cdFx0LyoqIGRlbGltaXRpbmcgY2hhcmFjdGVyICovXG5cdFx0dmFyIF9kZWxpbWl0ZXIgPSAnLCc7XG5cblx0XHQvKiogbmV3bGluZSBjaGFyYWN0ZXIocykgKi9cblx0XHR2YXIgX25ld2xpbmUgPSAnXFxyXFxuJztcblxuXHRcdC8qKiBxdW90ZSBjaGFyYWN0ZXIgKi9cblx0XHR2YXIgX3F1b3RlQ2hhciA9ICdcIic7XG5cblx0XHR1bnBhY2tDb25maWcoKTtcblxuXHRcdHZhciBxdW90ZUNoYXJSZWdleCA9IG5ldyBSZWdFeHAoX3F1b3RlQ2hhciwgJ2cnKTtcblxuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHRcdF9pbnB1dCA9IEpTT04ucGFyc2UoX2lucHV0KTtcblxuXHRcdGlmIChfaW5wdXQgaW5zdGFuY2VvZiBBcnJheSlcblx0XHR7XG5cdFx0XHRpZiAoIV9pbnB1dC5sZW5ndGggfHwgX2lucHV0WzBdIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHRcdHJldHVybiBzZXJpYWxpemUobnVsbCwgX2lucHV0KTtcblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXRbMF0gPT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG9iamVjdEtleXMoX2lucHV0WzBdKSwgX2lucHV0KTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ29iamVjdCcpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBfaW5wdXQuZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9pbnB1dC5kYXRhID0gSlNPTi5wYXJzZShfaW5wdXQuZGF0YSk7XG5cblx0XHRcdGlmIChfaW5wdXQuZGF0YSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoIV9pbnB1dC5maWVsZHMpXG5cdFx0XHRcdFx0X2lucHV0LmZpZWxkcyA9ICBfaW5wdXQubWV0YSAmJiBfaW5wdXQubWV0YS5maWVsZHM7XG5cblx0XHRcdFx0aWYgKCFfaW5wdXQuZmllbGRzKVxuXHRcdFx0XHRcdF9pbnB1dC5maWVsZHMgPSAgX2lucHV0LmRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHRcdFx0XHRcdFx0PyBfaW5wdXQuZmllbGRzXG5cdFx0XHRcdFx0XHRcdFx0XHQ6IG9iamVjdEtleXMoX2lucHV0LmRhdGFbMF0pO1xuXG5cdFx0XHRcdGlmICghKF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXkpICYmIHR5cGVvZiBfaW5wdXQuZGF0YVswXSAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0X2lucHV0LmRhdGEgPSBbX2lucHV0LmRhdGFdO1x0Ly8gaGFuZGxlcyBpbnB1dCBsaWtlIFsxLDIsM10gb3IgWydhc2RmJ11cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShfaW5wdXQuZmllbGRzIHx8IFtdLCBfaW5wdXQuZGF0YSB8fCBbXSk7XG5cdFx0fVxuXG5cdFx0Ly8gRGVmYXVsdCAoYW55IHZhbGlkIHBhdGhzIHNob3VsZCByZXR1cm4gYmVmb3JlIHRoaXMpXG5cdFx0dGhyb3cgJ2V4Y2VwdGlvbjogVW5hYmxlIHRvIHNlcmlhbGl6ZSB1bnJlY29nbml6ZWQgaW5wdXQnO1xuXG5cblx0XHRmdW5jdGlvbiB1bnBhY2tDb25maWcoKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZyAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLmRlbGltaXRlciA9PT0gJ3N0cmluZydcblx0XHRcdFx0JiYgX2NvbmZpZy5kZWxpbWl0ZXIubGVuZ3RoID09PSAxXG5cdFx0XHRcdCYmIFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihfY29uZmlnLmRlbGltaXRlcikgPT09IC0xKVxuXHRcdFx0e1xuXHRcdFx0XHRfZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5xdW90ZXMgPT09ICdib29sZWFuJ1xuXHRcdFx0XHR8fCBfY29uZmlnLnF1b3RlcyBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRfcXVvdGVzID0gX2NvbmZpZy5xdW90ZXM7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5uZXdsaW5lID09PSAnc3RyaW5nJylcblx0XHRcdFx0X25ld2xpbmUgPSBfY29uZmlnLm5ld2xpbmU7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5xdW90ZUNoYXIgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfcXVvdGVDaGFyID0gX2NvbmZpZy5xdW90ZUNoYXI7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5oZWFkZXIgPT09ICdib29sZWFuJylcblx0XHRcdFx0X3dyaXRlSGVhZGVyID0gX2NvbmZpZy5oZWFkZXI7XG5cdFx0fVxuXG5cblx0XHQvKiogVHVybnMgYW4gb2JqZWN0J3Mga2V5cyBpbnRvIGFuIGFycmF5ICovXG5cdFx0ZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmopXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9iailcblx0XHRcdFx0a2V5cy5wdXNoKGtleSk7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cblx0XHQvKiogVGhlIGRvdWJsZSBmb3IgbG9vcCB0aGF0IGl0ZXJhdGVzIHRoZSBkYXRhIGFuZCB3cml0ZXMgb3V0IGEgQ1NWIHN0cmluZyBpbmNsdWRpbmcgaGVhZGVyIHJvdyAqL1xuXHRcdGZ1bmN0aW9uIHNlcmlhbGl6ZShmaWVsZHMsIGRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGNzdiA9ICcnO1xuXG5cdFx0XHRpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGZpZWxkcyA9IEpTT04ucGFyc2UoZmllbGRzKTtcblx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuXG5cdFx0XHR2YXIgaGFzSGVhZGVyID0gZmllbGRzIGluc3RhbmNlb2YgQXJyYXkgJiYgZmllbGRzLmxlbmd0aCA+IDA7XG5cdFx0XHR2YXIgZGF0YUtleWVkQnlGaWVsZCA9ICEoZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYSBoZWFkZXIgcm93LCB3cml0ZSBpdCBmaXJzdFxuXHRcdFx0aWYgKGhhc0hlYWRlciAmJiBfd3JpdGVIZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGkgPiAwKVxuXHRcdFx0XHRcdFx0Y3N2ICs9IF9kZWxpbWl0ZXI7XG5cdFx0XHRcdFx0Y3N2ICs9IHNhZmUoZmllbGRzW2ldLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdGNzdiArPSBfbmV3bGluZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVGhlbiB3cml0ZSBvdXQgdGhlIGRhdGFcblx0XHRcdGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IGRhdGEubGVuZ3RoOyByb3crKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1heENvbCA9IGhhc0hlYWRlciA/IGZpZWxkcy5sZW5ndGggOiBkYXRhW3Jvd10ubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IG1heENvbDsgY29sKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoY29sID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdHZhciBjb2xJZHggPSBoYXNIZWFkZXIgJiYgZGF0YUtleWVkQnlGaWVsZCA/IGZpZWxkc1tjb2xdIDogY29sO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGRhdGFbcm93XVtjb2xJZHhdLCBjb2wpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJvdyA8IGRhdGEubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBjc3Y7XG5cdFx0fVxuXG5cdFx0LyoqIEVuY2xvc2VzIGEgdmFsdWUgYXJvdW5kIHF1b3RlcyBpZiBuZWVkZWQgKG1ha2VzIGEgdmFsdWUgc2FmZSBmb3IgQ1NWIGluc2VydGlvbikgKi9cblx0XHRmdW5jdGlvbiBzYWZlKHN0ciwgY29sKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJyB8fCBzdHIgPT09IG51bGwpXG5cdFx0XHRcdHJldHVybiAnJztcblxuXHRcdFx0c3RyID0gc3RyLnRvU3RyaW5nKCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgX3F1b3RlQ2hhcitfcXVvdGVDaGFyKTtcblxuXHRcdFx0dmFyIG5lZWRzUXVvdGVzID0gKHR5cGVvZiBfcXVvdGVzID09PSAnYm9vbGVhbicgJiYgX3F1b3Rlcylcblx0XHRcdFx0XHRcdFx0fHwgKF9xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSAmJiBfcXVvdGVzW2NvbF0pXG5cdFx0XHRcdFx0XHRcdHx8IGhhc0FueShzdHIsIFBhcGEuQkFEX0RFTElNSVRFUlMpXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5pbmRleE9mKF9kZWxpbWl0ZXIpID4gLTFcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdCgwKSA9PT0gJyAnXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoc3RyLmxlbmd0aCAtIDEpID09PSAnICc7XG5cblx0XHRcdHJldHVybiBuZWVkc1F1b3RlcyA/IF9xdW90ZUNoYXIgKyBzdHIgKyBfcXVvdGVDaGFyIDogc3RyO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGhhc0FueShzdHIsIHN1YnN0cmluZ3MpXG5cdFx0e1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzdHJpbmdzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRpZiAoc3RyLmluZGV4T2Yoc3Vic3RyaW5nc1tpXSkgPiAtMSlcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKiogQ2h1bmtTdHJlYW1lciBpcyB0aGUgYmFzZSBwcm90b3R5cGUgZm9yIHZhcmlvdXMgc3RyZWFtZXIgaW1wbGVtZW50YXRpb25zLiAqL1xuXHRmdW5jdGlvbiBDaHVua1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdHRoaXMuX2hhbmRsZSA9IG51bGw7XG5cdFx0dGhpcy5fcGF1c2VkID0gZmFsc2U7XG5cdFx0dGhpcy5fZmluaXNoZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9pbnB1dCA9IG51bGw7XG5cdFx0dGhpcy5fYmFzZUluZGV4ID0gMDtcblx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9ICcnO1xuXHRcdHRoaXMuX3Jvd0NvdW50ID0gMDtcblx0XHR0aGlzLl9zdGFydCA9IDA7XG5cdFx0dGhpcy5fbmV4dENodW5rID0gbnVsbDtcblx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IHRydWU7XG5cdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0ge1xuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXHRcdHJlcGxhY2VDb25maWcuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dGhpcy5wYXJzZUNodW5rID0gZnVuY3Rpb24oY2h1bmspXG5cdFx0e1xuXHRcdFx0Ly8gRmlyc3QgY2h1bmsgcHJlLXByb2Nlc3Npbmdcblx0XHRcdGlmICh0aGlzLmlzRmlyc3RDaHVuayAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1vZGlmaWVkQ2h1bmsgPSB0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuayhjaHVuayk7XG5cdFx0XHRcdGlmIChtb2RpZmllZENodW5rICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0Y2h1bmsgPSBtb2RpZmllZENodW5rO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5pc0ZpcnN0Q2h1bmsgPSBmYWxzZTtcblxuXHRcdFx0Ly8gUmVqb2luIHRoZSBsaW5lIHdlIGxpa2VseSBqdXN0IHNwbGl0IGluIHR3byBieSBjaHVua2luZyB0aGUgZmlsZVxuXHRcdFx0dmFyIGFnZ3JlZ2F0ZSA9IHRoaXMuX3BhcnRpYWxMaW5lICsgY2h1bms7XG5cdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9ICcnO1xuXG5cdFx0XHR2YXIgcmVzdWx0cyA9IHRoaXMuX2hhbmRsZS5wYXJzZShhZ2dyZWdhdGUsIHRoaXMuX2Jhc2VJbmRleCwgIXRoaXMuX2ZpbmlzaGVkKTtcblxuXHRcdFx0aWYgKHRoaXMuX2hhbmRsZS5wYXVzZWQoKSB8fCB0aGlzLl9oYW5kbGUuYWJvcnRlZCgpKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdHZhciBsYXN0SW5kZXggPSByZXN1bHRzLm1ldGEuY3Vyc29yO1xuXG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9IGFnZ3JlZ2F0ZS5zdWJzdHJpbmcobGFzdEluZGV4IC0gdGhpcy5fYmFzZUluZGV4KTtcblx0XHRcdFx0dGhpcy5fYmFzZUluZGV4ID0gbGFzdEluZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVzdWx0cyAmJiByZXN1bHRzLmRhdGEpXG5cdFx0XHRcdHRoaXMuX3Jvd0NvdW50ICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cblx0XHRcdHZhciBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgPSB0aGlzLl9maW5pc2hlZCB8fCAodGhpcy5fY29uZmlnLnByZXZpZXcgJiYgdGhpcy5fcm93Q291bnQgPj0gdGhpcy5fY29uZmlnLnByZXZpZXcpO1xuXG5cdFx0XHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZpbmlzaGVkSW5jbHVkaW5nUHJldmlld1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNodW5rKHJlc3VsdHMsIHRoaXMuX2hhbmRsZSk7XG5cdFx0XHRcdGlmICh0aGlzLl9wYXVzZWQpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRyZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5fY29uZmlnLnN0ZXAgJiYgIXRoaXMuX2NvbmZpZy5jaHVuaykge1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YSA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhLmNvbmNhdChyZXN1bHRzLmRhdGEpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzID0gdGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycy5jb25jYXQocmVzdWx0cy5lcnJvcnMpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMubWV0YSA9IHJlc3VsdHMubWV0YTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jb21wbGV0ZSkgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEuYWJvcnRlZCkpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5jb21wbGV0ZSh0aGlzLl9jb21wbGV0ZVJlc3VsdHMsIHRoaXMuX2lucHV0KTtcblxuXHRcdFx0aWYgKCFmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEucGF1c2VkKSlcblx0XHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XG5cblx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdH07XG5cblx0XHR0aGlzLl9zZW5kRXJyb3IgPSBmdW5jdGlvbihlcnJvcilcblx0XHR7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbih0aGlzLl9jb25maWcuZXJyb3IpKVxuXHRcdFx0XHR0aGlzLl9jb25maWcuZXJyb3IoZXJyb3IpO1xuXHRcdFx0ZWxzZSBpZiAoSVNfUEFQQV9XT1JLRVIgJiYgdGhpcy5fY29uZmlnLmVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRlcnJvcjogZXJyb3IsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRmdW5jdGlvbiByZXBsYWNlQ29uZmlnKGNvbmZpZylcblx0XHR7XG5cdFx0XHQvLyBEZWVwLWNvcHkgdGhlIGNvbmZpZyBzbyB3ZSBjYW4gZWRpdCBpdFxuXHRcdFx0dmFyIGNvbmZpZ0NvcHkgPSBjb3B5KGNvbmZpZyk7XG5cdFx0XHRjb25maWdDb3B5LmNodW5rU2l6ZSA9IHBhcnNlSW50KGNvbmZpZ0NvcHkuY2h1bmtTaXplKTtcdC8vIHBhcnNlSW50IFZFUlkgaW1wb3J0YW50IHNvIHdlIGRvbid0IGNvbmNhdGVuYXRlIHN0cmluZ3MhXG5cdFx0XHRpZiAoIWNvbmZpZy5zdGVwICYmICFjb25maWcuY2h1bmspXG5cdFx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gbnVsbDsgIC8vIGRpc2FibGUgUmFuZ2UgaGVhZGVyIGlmIG5vdCBzdHJlYW1pbmc7IGJhZCB2YWx1ZXMgYnJlYWsgSUlTIC0gc2VlIGlzc3VlICMxOTZcblx0XHRcdHRoaXMuX2hhbmRsZSA9IG5ldyBQYXJzZXJIYW5kbGUoY29uZmlnQ29weSk7XG5cdFx0XHR0aGlzLl9oYW5kbGUuc3RyZWFtZXIgPSB0aGlzO1xuXHRcdFx0dGhpcy5fY29uZmlnID0gY29uZmlnQ29weTtcdC8vIHBlcnNpc3QgdGhlIGNvcHkgdG8gdGhlIGNhbGxlclxuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gTmV0d29ya1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5SZW1vdGVDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgeGhyO1xuXG5cdFx0aWYgKElTX1dPUktFUilcblx0XHR7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCgpO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24odXJsKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gdXJsO1xuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX3JlYWRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0eGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHRcdGlmICh0aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzKVxuXHRcdFx0e1xuXHRcdFx0XHR4aHIud2l0aENyZWRlbnRpYWxzID0gdGhpcy5fY29uZmlnLndpdGhDcmVkZW50aWFscztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFJU19XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdHhoci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHR4aHIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0eGhyLm9wZW4oJ0dFVCcsIHRoaXMuX2lucHV0LCAhSVNfV09SS0VSKTtcblxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBlbmQgPSB0aGlzLl9zdGFydCArIHRoaXMuX2NvbmZpZy5jaHVua1NpemUgLSAxO1x0Ly8gbWludXMgb25lIGJlY2F1c2UgYnl0ZSByYW5nZSBpcyBpbmNsdXNpdmVcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ1JhbmdlJywgJ2J5dGVzPScrdGhpcy5fc3RhcnQrJy0nK2VuZCk7XG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdJZi1Ob25lLU1hdGNoJywgJ3dlYmtpdC1uby1jYWNoZScpOyAvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODI2NzJcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0eGhyLnNlbmQoKTtcblx0XHRcdH1cblx0XHRcdGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcihlcnIubWVzc2FnZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChJU19XT1JLRVIgJiYgeGhyLnN0YXR1cyA9PT0gMClcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLl9zdGFydCArPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rTG9hZGVkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPSA0KVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh4aHIuc3RhdHVzIDwgMjAwIHx8IHhoci5zdGF0dXMgPj0gNDAwKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+IGdldEZpbGVTaXplKHhocik7XG5cdFx0XHR0aGlzLnBhcnNlQ2h1bmsoeGhyLnJlc3BvbnNlVGV4dCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtFcnJvciA9IGZ1bmN0aW9uKGVycm9yTWVzc2FnZSlcblx0XHR7XG5cdFx0XHR2YXIgZXJyb3JUZXh0ID0geGhyLnN0YXR1c1RleHQgfHwgZXJyb3JNZXNzYWdlO1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKGVycm9yVGV4dCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0RmlsZVNpemUoeGhyKVxuXHRcdHtcblx0XHRcdHZhciBjb250ZW50UmFuZ2UgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnKTtcblx0XHRcdGlmIChjb250ZW50UmFuZ2UgPT09IG51bGwpIHsgLy8gbm8gY29udGVudCByYW5nZSwgdGhlbiBmaW5pc2ghXG4gICAgICAgIFx0XHRcdHJldHVybiAtMTtcbiAgICAgICAgICAgIFx0XHR9XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoY29udGVudFJhbmdlLnN1YnN0cihjb250ZW50UmFuZ2UubGFzdEluZGV4T2YoJy8nKSArIDEpKTtcblx0XHR9XG5cdH1cblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHROZXR3b3JrU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTmV0d29ya1N0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gRmlsZVN0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5Mb2NhbENodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciByZWFkZXIsIHNsaWNlO1xuXG5cdFx0Ly8gRmlsZVJlYWRlciBpcyBiZXR0ZXIgdGhhbiBGaWxlUmVhZGVyU3luYyAoZXZlbiBpbiB3b3JrZXIpIC0gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzI0NzA4NjQ5LzEwNDg4NjJcblx0XHQvLyBCdXQgRmlyZWZveCBpcyBhIHBpbGwsIHRvbyAtIHNlZSBpc3N1ZSAjNzY6IGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2UvaXNzdWVzLzc2XG5cdFx0dmFyIHVzaW5nQXN5bmNSZWFkZXIgPSB0eXBlb2YgRmlsZVJlYWRlciAhPT0gJ3VuZGVmaW5lZCc7XHQvLyBTYWZhcmkgZG9lc24ndCBjb25zaWRlciBpdCBhIGZ1bmN0aW9uIC0gc2VlIGlzc3VlICMxMDVcblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24oZmlsZSlcblx0XHR7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IGZpbGU7XG5cdFx0XHRzbGljZSA9IGZpbGUuc2xpY2UgfHwgZmlsZS53ZWJraXRTbGljZSB8fCBmaWxlLm1velNsaWNlO1xuXG5cdFx0XHRpZiAodXNpbmdBc3luY1JlYWRlcilcblx0XHRcdHtcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcdFx0Ly8gUHJlZmVycmVkIG1ldGhvZCBvZiByZWFkaW5nIGZpbGVzLCBldmVuIGluIHdvcmtlcnNcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHJlYWRlci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZWFkZXIgPSBuZXcgRmlsZVJlYWRlclN5bmMoKTtcdC8vIEhhY2sgZm9yIHJ1bm5pbmcgaW4gYSB3ZWIgd29ya2VyIGluIEZpcmVmb3hcblxuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkICYmICghdGhpcy5fY29uZmlnLnByZXZpZXcgfHwgdGhpcy5fcm93Q291bnQgPCB0aGlzLl9jb25maWcucHJldmlldykpXG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdH1cblxuXHRcdHRoaXMuX3JlYWRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR2YXIgaW5wdXQgPSB0aGlzLl9pbnB1dDtcblx0XHRcdGlmICh0aGlzLl9jb25maWcuY2h1bmtTaXplKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZW5kID0gTWF0aC5taW4odGhpcy5fc3RhcnQgKyB0aGlzLl9jb25maWcuY2h1bmtTaXplLCB0aGlzLl9pbnB1dC5zaXplKTtcblx0XHRcdFx0aW5wdXQgPSBzbGljZS5jYWxsKGlucHV0LCB0aGlzLl9zdGFydCwgZW5kKTtcblx0XHRcdH1cblx0XHRcdHZhciB0eHQgPSByZWFkZXIucmVhZEFzVGV4dChpbnB1dCwgdGhpcy5fY29uZmlnLmVuY29kaW5nKTtcblx0XHRcdGlmICghdXNpbmdBc3luY1JlYWRlcilcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoeyB0YXJnZXQ6IHsgcmVzdWx0OiB0eHQgfSB9KTtcdC8vIG1pbWljIHRoZSBhc3luYyBzaWduYXR1cmVcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0xvYWRlZCA9IGZ1bmN0aW9uKGV2ZW50KVxuXHRcdHtcblx0XHRcdC8vIFZlcnkgaW1wb3J0YW50IHRvIGluY3JlbWVudCBzdGFydCBlYWNoIHRpbWUgYmVmb3JlIGhhbmRsaW5nIHJlc3VsdHNcblx0XHRcdHRoaXMuX3N0YXJ0ICs9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICF0aGlzLl9jb25maWcuY2h1bmtTaXplIHx8IHRoaXMuX3N0YXJ0ID49IHRoaXMuX2lucHV0LnNpemU7XG5cdFx0XHR0aGlzLnBhcnNlQ2h1bmsoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtFcnJvciA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IocmVhZGVyLmVycm9yKTtcblx0XHR9XG5cblx0fVxuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDaHVua1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdEZpbGVTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGaWxlU3RyZWFtZXI7XG5cblxuXHRmdW5jdGlvbiBTdHJpbmdTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgc3RyaW5nO1xuXHRcdHZhciByZW1haW5pbmc7XG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbihzKVxuXHRcdHtcblx0XHRcdHN0cmluZyA9IHM7XG5cdFx0XHRyZW1haW5pbmcgPSBzO1xuXHRcdFx0cmV0dXJuIHRoaXMuX25leHRDaHVuaygpO1xuXHRcdH1cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHRoaXMuX2ZpbmlzaGVkKSByZXR1cm47XG5cdFx0XHR2YXIgc2l6ZSA9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0XHR2YXIgY2h1bmsgPSBzaXplID8gcmVtYWluaW5nLnN1YnN0cigwLCBzaXplKSA6IHJlbWFpbmluZztcblx0XHRcdHJlbWFpbmluZyA9IHNpemUgPyByZW1haW5pbmcuc3Vic3RyKHNpemUpIDogJyc7XG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICFyZW1haW5pbmc7XG5cdFx0XHRyZXR1cm4gdGhpcy5wYXJzZUNodW5rKGNodW5rKTtcblx0XHR9XG5cdH1cblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdHJpbmdTdHJlYW1lcjtcblxuXG5cblx0Ly8gVXNlIG9uZSBQYXJzZXJIYW5kbGUgcGVyIGVudGlyZSBDU1YgZmlsZSBvciBzdHJpbmdcblx0ZnVuY3Rpb24gUGFyc2VySGFuZGxlKF9jb25maWcpXG5cdHtcblx0XHQvLyBPbmUgZ29hbCBpcyB0byBtaW5pbWl6ZSB0aGUgdXNlIG9mIHJlZ3VsYXIgZXhwcmVzc2lvbnMuLi5cblx0XHR2YXIgRkxPQVQgPSAvXlxccyotPyhcXGQqXFwuP1xcZCt8XFxkK1xcLj9cXGQqKShlWy0rXT9cXGQrKT9cXHMqJC9pO1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBfc3RlcENvdW50ZXIgPSAwO1x0Ly8gTnVtYmVyIG9mIHRpbWVzIHN0ZXAgd2FzIGNhbGxlZCAobnVtYmVyIG9mIHJvd3MgcGFyc2VkKVxuXHRcdHZhciBfaW5wdXQ7XHRcdFx0XHQvLyBUaGUgaW5wdXQgYmVpbmcgcGFyc2VkXG5cdFx0dmFyIF9wYXJzZXI7XHRcdFx0Ly8gVGhlIGNvcmUgcGFyc2VyIGJlaW5nIHVzZWRcblx0XHR2YXIgX3BhdXNlZCA9IGZhbHNlO1x0Ly8gV2hldGhlciB3ZSBhcmUgcGF1c2VkIG9yIG5vdFxuXHRcdHZhciBfYWJvcnRlZCA9IGZhbHNlOyAgIC8vIFdoZXRoZXIgdGhlIHBhcnNlciBoYXMgYWJvcnRlZCBvciBub3Rcblx0XHR2YXIgX2RlbGltaXRlckVycm9yO1x0Ly8gVGVtcG9yYXJ5IHN0YXRlIGJldHdlZW4gZGVsaW1pdGVyIGRldGVjdGlvbiBhbmQgcHJvY2Vzc2luZyByZXN1bHRzXG5cdFx0dmFyIF9maWVsZHMgPSBbXTtcdFx0Ly8gRmllbGRzIGFyZSBmcm9tIHRoZSBoZWFkZXIgcm93IG9mIHRoZSBpbnB1dCwgaWYgdGhlcmUgaXMgb25lXG5cdFx0dmFyIF9yZXN1bHRzID0ge1x0XHQvLyBUaGUgbGFzdCByZXN1bHRzIHJldHVybmVkIGZyb20gdGhlIHBhcnNlclxuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXG5cdFx0aWYgKGlzRnVuY3Rpb24oX2NvbmZpZy5zdGVwKSlcblx0XHR7XG5cdFx0XHR2YXIgdXNlclN0ZXAgPSBfY29uZmlnLnN0ZXA7XG5cdFx0XHRfY29uZmlnLnN0ZXAgPSBmdW5jdGlvbihyZXN1bHRzKVxuXHRcdFx0e1xuXHRcdFx0XHRfcmVzdWx0cyA9IHJlc3VsdHM7XG5cblx0XHRcdFx0aWYgKG5lZWRzSGVhZGVyUm93KCkpXG5cdFx0XHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblx0XHRcdFx0ZWxzZVx0Ly8gb25seSBjYWxsIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFmdGVyIGhlYWRlciByb3dcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cblx0XHRcdFx0XHQvLyBJdCdzIHBvc3NiaWxlIHRoYXQgdGhpcyBsaW5lIHdhcyBlbXB0eSBhbmQgdGhlcmUncyBubyByb3cgaGVyZSBhZnRlciBhbGxcblx0XHRcdFx0XHRpZiAoX3Jlc3VsdHMuZGF0YS5sZW5ndGggPT09IDApXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdFx0XHRfc3RlcENvdW50ZXIgKz0gcmVzdWx0cy5kYXRhLmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5wcmV2aWV3ICYmIF9zdGVwQ291bnRlciA+IF9jb25maWcucHJldmlldylcblx0XHRcdFx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHR1c2VyU3RlcChfcmVzdWx0cywgc2VsZik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUGFyc2VzIGlucHV0LiBNb3N0IHVzZXJzIHdvbid0IG5lZWQsIGFuZCBzaG91bGRuJ3QgbWVzcyB3aXRoLCB0aGUgYmFzZUluZGV4XG5cdFx0ICogYW5kIGlnbm9yZUxhc3RSb3cgcGFyYW1ldGVycy4gVGhleSBhcmUgdXNlZCBieSBzdHJlYW1lcnMgKHdyYXBwZXIgZnVuY3Rpb25zKVxuXHRcdCAqIHdoZW4gYW4gaW5wdXQgY29tZXMgaW4gbXVsdGlwbGUgY2h1bmtzLCBsaWtlIGZyb20gYSBmaWxlLlxuXHRcdCAqL1xuXHRcdHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KVxuXHRcdHtcblx0XHRcdGlmICghX2NvbmZpZy5uZXdsaW5lKVxuXHRcdFx0XHRfY29uZmlnLm5ld2xpbmUgPSBndWVzc0xpbmVFbmRpbmdzKGlucHV0KTtcblxuXHRcdFx0X2RlbGltaXRlckVycm9yID0gZmFsc2U7XG5cdFx0XHRpZiAoIV9jb25maWcuZGVsaW1pdGVyKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZGVsaW1HdWVzcyA9IGd1ZXNzRGVsaW1pdGVyKGlucHV0LCBfY29uZmlnLm5ld2xpbmUpO1xuXHRcdFx0XHRpZiAoZGVsaW1HdWVzcy5zdWNjZXNzZnVsKVxuXHRcdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gZGVsaW1HdWVzcy5iZXN0RGVsaW1pdGVyO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSB0cnVlO1x0Ly8gYWRkIGVycm9yIGFmdGVyIHBhcnNpbmcgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSBvdmVyd3JpdHRlbilcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IFBhcGEuRGVmYXVsdERlbGltaXRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZih0eXBlb2YgX2NvbmZpZy5kZWxpbWl0ZXIgPT09ICdmdW5jdGlvbicpXG5cdFx0XHR7XG5cdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXIoaW5wdXQpO1xuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcGFyc2VyQ29uZmlnID0gY29weShfY29uZmlnKTtcblx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHBhcnNlckNvbmZpZy5wcmV2aWV3Kys7XHQvLyB0byBjb21wZW5zYXRlIGZvciBoZWFkZXIgcm93XG5cblx0XHRcdF9pbnB1dCA9IGlucHV0O1xuXHRcdFx0X3BhcnNlciA9IG5ldyBQYXJzZXIocGFyc2VyQ29uZmlnKTtcblx0XHRcdF9yZXN1bHRzID0gX3BhcnNlci5wYXJzZShfaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdyk7XG5cdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQgPyB7IG1ldGE6IHsgcGF1c2VkOiB0cnVlIH0gfSA6IChfcmVzdWx0cyB8fCB7IG1ldGE6IHsgcGF1c2VkOiBmYWxzZSB9IH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9pbnB1dCA9IF9pbnB1dC5zdWJzdHIoX3BhcnNlci5nZXRDaGFySW5kZXgoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSBmYWxzZTtcblx0XHRcdHNlbGYuc3RyZWFtZXIucGFyc2VDaHVuayhfaW5wdXQpO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ZWQgPSBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdHJldHVybiBfYWJvcnRlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRfcmVzdWx0cy5tZXRhLmFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0aWYgKGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSkpXG5cdFx0XHRcdF9jb25maWcuY29tcGxldGUoX3Jlc3VsdHMpO1xuXHRcdFx0X2lucHV0ID0gJyc7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHByb2Nlc3NSZXN1bHRzKClcblx0XHR7XG5cdFx0XHRpZiAoX3Jlc3VsdHMgJiYgX2RlbGltaXRlckVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRhZGRFcnJvcignRGVsaW1pdGVyJywgJ1VuZGV0ZWN0YWJsZURlbGltaXRlcicsICdVbmFibGUgdG8gYXV0by1kZXRlY3QgZGVsaW1pdGluZyBjaGFyYWN0ZXI7IGRlZmF1bHRlZCB0byBcXCcnK1BhcGEuRGVmYXVsdERlbGltaXRlcisnXFwnJyk7XG5cdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5za2lwRW1wdHlMaW5lcylcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aCA9PT0gMSAmJiBfcmVzdWx0cy5kYXRhW2ldWzBdID09PSAnJylcblx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKGktLSwgMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRmaWxsSGVhZGVyRmllbGRzKCk7XG5cblx0XHRcdHJldHVybiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBuZWVkc0hlYWRlclJvdygpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9jb25maWcuaGVhZGVyICYmIF9maWVsZHMubGVuZ3RoID09PSAwO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbGxIZWFkZXJGaWVsZHMoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBuZWVkc0hlYWRlclJvdygpICYmIGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdFx0X2ZpZWxkcy5wdXNoKF9yZXN1bHRzLmRhdGFbaV1bal0pO1xuXHRcdFx0X3Jlc3VsdHMuZGF0YS5zcGxpY2UoMCwgMSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSlcblx0XHR7XG5cdFx0XHRpZiAoKF9jb25maWcuZHluYW1pY1R5cGluZ1tmaWVsZF0gfHwgX2NvbmZpZy5keW5hbWljVHlwaW5nKSA9PT0gdHJ1ZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSAndHJ1ZScgfHwgdmFsdWUgPT09ICdUUlVFJylcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0ZWxzZSBpZiAodmFsdWUgPT09ICdmYWxzZScgfHwgdmFsdWUgPT09ICdGQUxTRScpXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cmV0dXJuIHRyeVBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cyB8fCAoIV9jb25maWcuaGVhZGVyICYmICFfY29uZmlnLmR5bmFtaWNUeXBpbmcpKVxuXHRcdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvdyA9IF9jb25maWcuaGVhZGVyID8ge30gOiBbXTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgZmllbGQgPSBqO1xuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IF9yZXN1bHRzLmRhdGFbaV1bal07XG5cblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdFx0XHRmaWVsZCA9IGogPj0gX2ZpZWxkcy5sZW5ndGggPyAnX19wYXJzZWRfZXh0cmEnIDogX2ZpZWxkc1tqXTtcblxuXHRcdFx0XHRcdHZhbHVlID0gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSk7XG5cblx0XHRcdFx0XHRpZiAoZmllbGQgPT09ICdfX3BhcnNlZF9leHRyYScpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cm93W2ZpZWxkXSA9IHJvd1tmaWVsZF0gfHwgW107XG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdLnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdID0gdmFsdWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldID0gcm93O1xuXG5cdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChqID4gX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcignRmllbGRNaXNtYXRjaCcsICdUb29NYW55RmllbGRzJywgJ1RvbyBtYW55IGZpZWxkczogZXhwZWN0ZWQgJyArIF9maWVsZHMubGVuZ3RoICsgJyBmaWVsZHMgYnV0IHBhcnNlZCAnICsgaiwgaSk7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaiA8IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoJ0ZpZWxkTWlzbWF0Y2gnLCAnVG9vRmV3RmllbGRzJywgJ1RvbyBmZXcgZmllbGRzOiBleHBlY3RlZCAnICsgX2ZpZWxkcy5sZW5ndGggKyAnIGZpZWxkcyBidXQgcGFyc2VkICcgKyBqLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIgJiYgX3Jlc3VsdHMubWV0YSlcblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5maWVsZHMgPSBfZmllbGRzO1xuXHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzRGVsaW1pdGVyKGlucHV0LCBuZXdsaW5lKVxuXHRcdHtcblx0XHRcdHZhciBkZWxpbUNob2ljZXMgPSBbJywnLCAnXFx0JywgJ3wnLCAnOycsIFBhcGEuUkVDT1JEX1NFUCwgUGFwYS5VTklUX1NFUF07XG5cdFx0XHR2YXIgYmVzdERlbGltLCBiZXN0RGVsdGEsIGZpZWxkQ291bnRQcmV2Um93O1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRlbGltQ2hvaWNlcy5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltID0gZGVsaW1DaG9pY2VzW2ldO1xuXHRcdFx0XHR2YXIgZGVsdGEgPSAwLCBhdmdGaWVsZENvdW50ID0gMDtcblx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0dmFyIHByZXZpZXcgPSBuZXcgUGFyc2VyKHtcblx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdG5ld2xpbmU6IG5ld2xpbmUsXG5cdFx0XHRcdFx0cHJldmlldzogMTBcblx0XHRcdFx0fSkucGFyc2UoaW5wdXQpO1xuXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcHJldmlldy5kYXRhLmxlbmd0aDsgaisrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIGZpZWxkQ291bnQgPSBwcmV2aWV3LmRhdGFbal0ubGVuZ3RoO1xuXHRcdFx0XHRcdGF2Z0ZpZWxkQ291bnQgKz0gZmllbGRDb3VudDtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgZmllbGRDb3VudFByZXZSb3cgPT09ICd1bmRlZmluZWQnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChmaWVsZENvdW50ID4gMSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZWx0YSArPSBNYXRoLmFicyhmaWVsZENvdW50IC0gZmllbGRDb3VudFByZXZSb3cpO1xuXHRcdFx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSBmaWVsZENvdW50O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChwcmV2aWV3LmRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50IC89IHByZXZpZXcuZGF0YS5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKCh0eXBlb2YgYmVzdERlbHRhID09PSAndW5kZWZpbmVkJyB8fCBkZWx0YSA8IGJlc3REZWx0YSlcblx0XHRcdFx0XHQmJiBhdmdGaWVsZENvdW50ID4gMS45OSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJlc3REZWx0YSA9IGRlbHRhO1xuXHRcdFx0XHRcdGJlc3REZWxpbSA9IGRlbGltO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gYmVzdERlbGltO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzZnVsOiAhIWJlc3REZWxpbSxcblx0XHRcdFx0YmVzdERlbGltaXRlcjogYmVzdERlbGltXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dClcblx0XHR7XG5cdFx0XHRpbnB1dCA9IGlucHV0LnN1YnN0cigwLCAxMDI0KjEwMjQpO1x0Ly8gbWF4IGxlbmd0aCAxIE1CXG5cblx0XHRcdHZhciByID0gaW5wdXQuc3BsaXQoJ1xccicpO1xuXG5cdFx0XHR2YXIgbiA9IGlucHV0LnNwbGl0KCdcXG4nKTtcblxuXHRcdFx0dmFyIG5BcHBlYXJzRmlyc3QgPSAobi5sZW5ndGggPiAxICYmIG5bMF0ubGVuZ3RoIDwgclswXS5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoci5sZW5ndGggPT09IDEgfHwgbkFwcGVhcnNGaXJzdClcblx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXG5cdFx0XHR2YXIgbnVtV2l0aE4gPSAwO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocltpXVswXSA9PT0gJ1xcbicpXG5cdFx0XHRcdFx0bnVtV2l0aE4rKztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bVdpdGhOID49IHIubGVuZ3RoIC8gMiA/ICdcXHJcXG4nIDogJ1xccic7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJ5UGFyc2VGbG9hdCh2YWwpXG5cdFx0e1xuXHRcdFx0dmFyIGlzTnVtYmVyID0gRkxPQVQudGVzdCh2YWwpO1xuXHRcdFx0cmV0dXJuIGlzTnVtYmVyID8gcGFyc2VGbG9hdCh2YWwpIDogdmFsO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFkZEVycm9yKHR5cGUsIGNvZGUsIG1zZywgcm93KVxuXHRcdHtcblx0XHRcdF9yZXN1bHRzLmVycm9ycy5wdXNoKHtcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0bWVzc2FnZTogbXNnLFxuXHRcdFx0XHRyb3c6IHJvd1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblxuXHQvKiogVGhlIGNvcmUgcGFyc2VyIGltcGxlbWVudHMgc3BlZWR5IGFuZCBjb3JyZWN0IENTViBwYXJzaW5nICovXG5cdGZ1bmN0aW9uIFBhcnNlcihjb25maWcpXG5cdHtcblx0XHQvLyBVbnBhY2sgdGhlIGNvbmZpZyBvYmplY3Rcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0dmFyIGRlbGltID0gY29uZmlnLmRlbGltaXRlcjtcblx0XHR2YXIgbmV3bGluZSA9IGNvbmZpZy5uZXdsaW5lO1xuXHRcdHZhciBjb21tZW50cyA9IGNvbmZpZy5jb21tZW50cztcblx0XHR2YXIgc3RlcCA9IGNvbmZpZy5zdGVwO1xuXHRcdHZhciBwcmV2aWV3ID0gY29uZmlnLnByZXZpZXc7XG5cdFx0dmFyIGZhc3RNb2RlID0gY29uZmlnLmZhc3RNb2RlO1xuXHRcdHZhciBxdW90ZUNoYXIgPSBjb25maWcucXVvdGVDaGFyIHx8ICdcIic7XG5cblx0XHQvLyBEZWxpbWl0ZXIgbXVzdCBiZSB2YWxpZFxuXHRcdGlmICh0eXBlb2YgZGVsaW0gIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoZGVsaW0pID4gLTEpXG5cdFx0XHRkZWxpbSA9ICcsJztcblxuXHRcdC8vIENvbW1lbnQgY2hhcmFjdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAoY29tbWVudHMgPT09IGRlbGltKVxuXHRcdFx0dGhyb3cgJ0NvbW1lbnQgY2hhcmFjdGVyIHNhbWUgYXMgZGVsaW1pdGVyJztcblx0XHRlbHNlIGlmIChjb21tZW50cyA9PT0gdHJ1ZSlcblx0XHRcdGNvbW1lbnRzID0gJyMnO1xuXHRcdGVsc2UgaWYgKHR5cGVvZiBjb21tZW50cyAhPT0gJ3N0cmluZydcblx0XHRcdHx8IFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihjb21tZW50cykgPiAtMSlcblx0XHRcdGNvbW1lbnRzID0gZmFsc2U7XG5cblx0XHQvLyBOZXdsaW5lIG11c3QgYmUgdmFsaWQ6IFxcciwgXFxuLCBvciBcXHJcXG5cblx0XHRpZiAobmV3bGluZSAhPSAnXFxuJyAmJiBuZXdsaW5lICE9ICdcXHInICYmIG5ld2xpbmUgIT0gJ1xcclxcbicpXG5cdFx0XHRuZXdsaW5lID0gJ1xcbic7XG5cblx0XHQvLyBXZSdyZSBnb25uYSBuZWVkIHRoZXNlIGF0IHRoZSBQYXJzZXIgc2NvcGVcblx0XHR2YXIgY3Vyc29yID0gMDtcblx0XHR2YXIgYWJvcnRlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpXG5cdFx0e1xuXHRcdFx0Ly8gRm9yIHNvbWUgcmVhc29uLCBpbiBDaHJvbWUsIHRoaXMgc3BlZWRzIHRoaW5ncyB1cCAoIT8pXG5cdFx0XHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJylcblx0XHRcdFx0dGhyb3cgJ0lucHV0IG11c3QgYmUgYSBzdHJpbmcnO1xuXG5cdFx0XHQvLyBXZSBkb24ndCBuZWVkIHRvIGNvbXB1dGUgc29tZSBvZiB0aGVzZSBldmVyeSB0aW1lIHBhcnNlKCkgaXMgY2FsbGVkLFxuXHRcdFx0Ly8gYnV0IGhhdmluZyB0aGVtIGluIGEgbW9yZSBsb2NhbCBzY29wZSBzZWVtcyB0byBwZXJmb3JtIGJldHRlclxuXHRcdFx0dmFyIGlucHV0TGVuID0gaW5wdXQubGVuZ3RoLFxuXHRcdFx0XHRkZWxpbUxlbiA9IGRlbGltLmxlbmd0aCxcblx0XHRcdFx0bmV3bGluZUxlbiA9IG5ld2xpbmUubGVuZ3RoLFxuXHRcdFx0XHRjb21tZW50c0xlbiA9IGNvbW1lbnRzLmxlbmd0aDtcblx0XHRcdHZhciBzdGVwSXNGdW5jdGlvbiA9IHR5cGVvZiBzdGVwID09PSAnZnVuY3Rpb24nO1xuXG5cdFx0XHQvLyBFc3RhYmxpc2ggc3RhcnRpbmcgc3RhdGVcblx0XHRcdGN1cnNvciA9IDA7XG5cdFx0XHR2YXIgZGF0YSA9IFtdLCBlcnJvcnMgPSBbXSwgcm93ID0gW10sIGxhc3RDdXJzb3IgPSAwO1xuXG5cdFx0XHRpZiAoIWlucHV0KVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXG5cdFx0XHRpZiAoZmFzdE1vZGUgfHwgKGZhc3RNb2RlICE9PSBmYWxzZSAmJiBpbnB1dC5pbmRleE9mKHF1b3RlQ2hhcikgPT09IC0xKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvd3MgPSBpbnB1dC5zcGxpdChuZXdsaW5lKTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHJvdyA9IHJvd3NbaV07XG5cdFx0XHRcdFx0Y3Vyc29yICs9IHJvdy5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKGkgIT09IHJvd3MubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHRcdGN1cnNvciArPSBuZXdsaW5lLmxlbmd0aDtcblx0XHRcdFx0XHRlbHNlIGlmIChpZ25vcmVMYXN0Um93KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRpZiAoY29tbWVudHMgJiYgcm93LnN1YnN0cigwLCBjb21tZW50c0xlbikgPT09IGNvbW1lbnRzKVxuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXTtcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRwdXNoUm93KHJvdy5zcGxpdChkZWxpbSkpO1xuXHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGkgPj0gcHJldmlldylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkYXRhID0gZGF0YS5zbGljZSgwLCBwcmV2aWV3KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdHZhciBuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdHZhciBxdW90ZUNoYXJSZWdleCA9IG5ldyBSZWdFeHAocXVvdGVDaGFyK3F1b3RlQ2hhciwgJ2cnKTtcblxuXHRcdFx0Ly8gUGFyc2VyIGxvb3Bcblx0XHRcdGZvciAoOzspXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEZpZWxkIGhhcyBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdGlmIChpbnB1dFtjdXJzb3JdID09PSBxdW90ZUNoYXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBTdGFydCBvdXIgc2VhcmNoIGZvciB0aGUgY2xvc2luZyBxdW90ZSB3aGVyZSB0aGUgY3Vyc29yIGlzXG5cdFx0XHRcdFx0dmFyIHF1b3RlU2VhcmNoID0gY3Vyc29yO1xuXG5cdFx0XHRcdFx0Ly8gU2tpcCB0aGUgb3BlbmluZyBxdW90ZVxuXHRcdFx0XHRcdGN1cnNvcisrO1xuXG5cdFx0XHRcdFx0Zm9yICg7Oylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyBGaW5kIGNsb3NpbmcgcXVvdGVcblx0XHRcdFx0XHRcdHZhciBxdW90ZVNlYXJjaCA9IGlucHV0LmluZGV4T2YocXVvdGVDaGFyLCBxdW90ZVNlYXJjaCsxKTtcblxuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSAtMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKCFpZ25vcmVMYXN0Um93KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gTm8gY2xvc2luZyBxdW90ZS4uLiB3aGF0IGEgcGl0eVxuXHRcdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6ICdRdW90ZXMnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29kZTogJ01pc3NpbmdRdW90ZXMnLFxuXHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogJ1F1b3RlZCBmaWVsZCB1bnRlcm1pbmF0ZWQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0cm93OiBkYXRhLmxlbmd0aCxcdC8vIHJvdyBoYXMgeWV0IHRvIGJlIGluc2VydGVkXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleDogY3Vyc29yXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVTZWFyY2ggPT09IGlucHV0TGVuLTEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgYXQgRU9GXG5cdFx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9IGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKHZhbHVlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhpcyBxdW90ZSBpcyBlc2NhcGVkLCBpdCdzIHBhcnQgb2YgdGhlIGRhdGE7IHNraXAgaXRcblx0XHRcdFx0XHRcdGlmIChpbnB1dFtxdW90ZVNlYXJjaCsxXSA9PT0gcXVvdGVDaGFyKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRxdW90ZVNlYXJjaCsrO1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGlucHV0W3F1b3RlU2VhcmNoKzFdID09PSBkZWxpbSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBmb2xsb3dlZCBieSBkZWxpbWl0ZXJcblx0XHRcdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIHF1b3RlQ2hhcikpO1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgPSBxdW90ZVNlYXJjaCArIDEgKyBkZWxpbUxlbjtcblx0XHRcdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXQuc3Vic3RyKHF1b3RlU2VhcmNoKzEsIG5ld2xpbmVMZW4pID09PSBuZXdsaW5lKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IG5ld2xpbmVcblx0XHRcdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIHF1b3RlQ2hhcikpO1xuXHRcdFx0XHRcdFx0XHRzYXZlUm93KHF1b3RlU2VhcmNoICsgMSArIG5ld2xpbmVMZW4pO1xuXHRcdFx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1x0Ly8gYmVjYXVzZSB3ZSBtYXkgaGF2ZSBza2lwcGVkIHRoZSBuZXh0RGVsaW0gaW4gdGhlIHF1b3RlZCBmaWVsZFxuXG5cdFx0XHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGRhdGEubGVuZ3RoID49IHByZXZpZXcpXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBDb21tZW50IGZvdW5kIGF0IHN0YXJ0IG9mIG5ldyBsaW5lXG5cdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cubGVuZ3RoID09PSAwICYmIGlucHV0LnN1YnN0cihjdXJzb3IsIGNvbW1lbnRzTGVuKSA9PT0gY29tbWVudHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAobmV4dE5ld2xpbmUgPT09IC0xKVx0Ly8gQ29tbWVudCBlbmRzIGF0IEVPRlxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRjdXJzb3IgPSBuZXh0TmV3bGluZSArIG5ld2xpbmVMZW47XG5cdFx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE5leHQgZGVsaW1pdGVyIGNvbWVzIGJlZm9yZSBuZXh0IG5ld2xpbmUsIHNvIHdlJ3ZlIHJlYWNoZWQgZW5kIG9mIGZpZWxkXG5cdFx0XHRcdGlmIChuZXh0RGVsaW0gIT09IC0xICYmIChuZXh0RGVsaW0gPCBuZXh0TmV3bGluZSB8fCBuZXh0TmV3bGluZSA9PT0gLTEpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgbmV4dERlbGltKSk7XG5cdFx0XHRcdFx0Y3Vyc29yID0gbmV4dERlbGltICsgZGVsaW1MZW47XG5cdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEVuZCBvZiByb3dcblx0XHRcdFx0aWYgKG5leHROZXdsaW5lICE9PSAtMSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIG5leHROZXdsaW5lKSk7XG5cdFx0XHRcdFx0c2F2ZVJvdyhuZXh0TmV3bGluZSArIG5ld2xpbmVMZW4pO1xuXG5cdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXG5cdFx0XHRyZXR1cm4gZmluaXNoKCk7XG5cblxuXHRcdFx0ZnVuY3Rpb24gcHVzaFJvdyhyb3cpXG5cdFx0XHR7XG5cdFx0XHRcdGRhdGEucHVzaChyb3cpO1xuXHRcdFx0XHRsYXN0Q3Vyc29yID0gY3Vyc29yO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIHJlbWFpbmluZyBpbnB1dCBmcm9tIGN1cnNvciB0byB0aGUgZW5kIGludG9cblx0XHRcdCAqIHJvdywgc2F2ZXMgdGhlIHJvdywgY2FsbHMgc3RlcCwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIGZpbmlzaCh2YWx1ZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXG5cdFx0XHRcdFx0dmFsdWUgPSBpbnB1dC5zdWJzdHIoY3Vyc29yKTtcblx0XHRcdFx0cm93LnB1c2godmFsdWUpO1xuXHRcdFx0XHRjdXJzb3IgPSBpbnB1dExlbjtcdC8vIGltcG9ydGFudCBpbiBjYXNlIHBhcnNpbmcgaXMgcGF1c2VkXG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIGN1cnJlbnQgcm93IHRvIHRoZSByZXN1bHRzLiBJdCBzZXRzIHRoZSBjdXJzb3Jcblx0XHRcdCAqIHRvIG5ld0N1cnNvciBhbmQgZmluZHMgdGhlIG5leHROZXdsaW5lLiBUaGUgY2FsbGVyIHNob3VsZFxuXHRcdFx0ICogdGFrZSBjYXJlIHRvIGV4ZWN1dGUgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYW5kIGNoZWNrIGZvclxuXHRcdFx0ICogcHJldmlldyBhbmQgZW5kIHBhcnNpbmcgaWYgbmVjZXNzYXJ5LlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBzYXZlUm93KG5ld0N1cnNvcilcblx0XHRcdHtcblx0XHRcdFx0Y3Vyc29yID0gbmV3Q3Vyc29yO1xuXHRcdFx0XHRwdXNoUm93KHJvdyk7XG5cdFx0XHRcdHJvdyA9IFtdO1xuXHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIHJlc3VsdHMsIGVycm9ycywgYW5kIG1ldGEuICovXG5cdFx0XHRmdW5jdGlvbiByZXR1cm5hYmxlKHN0b3BwZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0XHRlcnJvcnM6IGVycm9ycyxcblx0XHRcdFx0XHRtZXRhOiB7XG5cdFx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdFx0bGluZWJyZWFrOiBuZXdsaW5lLFxuXHRcdFx0XHRcdFx0YWJvcnRlZDogYWJvcnRlZCxcblx0XHRcdFx0XHRcdHRydW5jYXRlZDogISFzdG9wcGVkLFxuXHRcdFx0XHRcdFx0Y3Vyc29yOiBsYXN0Q3Vyc29yICsgKGJhc2VJbmRleCB8fCAwKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIEV4ZWN1dGVzIHRoZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgcmVzZXRzIGRhdGEgJiBlcnJvcnMuICovXG5cdFx0XHRmdW5jdGlvbiBkb1N0ZXAoKVxuXHRcdFx0e1xuXHRcdFx0XHRzdGVwKHJldHVybmFibGUoKSk7XG5cdFx0XHRcdGRhdGEgPSBbXSwgZXJyb3JzID0gW107XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBTZXRzIHRoZSBhYm9ydCBmbGFnICovXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0LyoqIEdldHMgdGhlIGN1cnNvciBwb3NpdGlvbiAqL1xuXHRcdHRoaXMuZ2V0Q2hhckluZGV4ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHJldHVybiBjdXJzb3I7XG5cdFx0fTtcblx0fVxuXG5cblx0Ly8gSWYgeW91IG5lZWQgdG8gbG9hZCBQYXBhIFBhcnNlIGFzeW5jaHJvbm91c2x5IGFuZCB5b3UgYWxzbyBuZWVkIHdvcmtlciB0aHJlYWRzLCBoYXJkLWNvZGVcblx0Ly8gdGhlIHNjcmlwdCBwYXRoIGhlcmUuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZS9pc3N1ZXMvODcjaXNzdWVjb21tZW50LTU3ODg1MzU4XG5cdGZ1bmN0aW9uIGdldFNjcmlwdFBhdGgoKVxuXHR7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdFx0cmV0dXJuIHNjcmlwdHMubGVuZ3RoID8gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyYyA6ICcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gbmV3V29ya2VyKClcblx0e1xuXHRcdGlmICghUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRpZiAoIUxPQURFRF9TWU5DICYmIFBhcGEuU0NSSVBUX1BBVEggPT09IG51bGwpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdCdTY3JpcHQgcGF0aCBjYW5ub3QgYmUgZGV0ZXJtaW5lZCBhdXRvbWF0aWNhbGx5IHdoZW4gUGFwYSBQYXJzZSBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHkuICcgK1xuXHRcdFx0XHQnWW91IG5lZWQgdG8gc2V0IFBhcGEuU0NSSVBUX1BBVEggbWFudWFsbHkuJ1xuXHRcdFx0KTtcblx0XHR2YXIgd29ya2VyVXJsID0gUGFwYS5TQ1JJUFRfUEFUSCB8fCBBVVRPX1NDUklQVF9QQVRIO1xuXHRcdC8vIEFwcGVuZCAncGFwYXdvcmtlcicgdG8gdGhlIHNlYXJjaCBzdHJpbmcgdG8gdGVsbCBwYXBhcGFyc2UgdGhhdCB0aGlzIGlzIG91ciB3b3JrZXIuXG5cdFx0d29ya2VyVXJsICs9ICh3b3JrZXJVcmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyAncGFwYXdvcmtlcic7XG5cdFx0dmFyIHcgPSBuZXcgZ2xvYmFsLldvcmtlcih3b3JrZXJVcmwpO1xuXHRcdHcub25tZXNzYWdlID0gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0XHR3LmlkID0gd29ya2VySWRDb3VudGVyKys7XG5cdFx0d29ya2Vyc1t3LmlkXSA9IHc7XG5cdFx0cmV0dXJuIHc7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiBtYWluIHRocmVhZCByZWNlaXZlcyBhIG1lc3NhZ2UgKi9cblx0ZnVuY3Rpb24gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1ttc2cud29ya2VySWRdO1xuXHRcdHZhciBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHRpZiAobXNnLmVycm9yKVxuXHRcdFx0d29ya2VyLnVzZXJFcnJvcihtc2cuZXJyb3IsIG1zZy5maWxlKTtcblx0XHRlbHNlIGlmIChtc2cucmVzdWx0cyAmJiBtc2cucmVzdWx0cy5kYXRhKVxuXHRcdHtcblx0XHRcdHZhciBhYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCB7IGRhdGE6IFtdLCBlcnJvcnM6IFtdLCBtZXRhOiB7IGFib3J0ZWQ6IHRydWUgfSB9KTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGUgPSB7XG5cdFx0XHRcdGFib3J0OiBhYm9ydCxcblx0XHRcdFx0cGF1c2U6IG5vdEltcGxlbWVudGVkLFxuXHRcdFx0XHRyZXN1bWU6IG5vdEltcGxlbWVudGVkXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlclN0ZXApKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1zZy5yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR3b3JrZXIudXNlclN0ZXAoe1xuXHRcdFx0XHRcdFx0ZGF0YTogW21zZy5yZXN1bHRzLmRhdGFbaV1dLFxuXHRcdFx0XHRcdFx0ZXJyb3JzOiBtc2cucmVzdWx0cy5lcnJvcnMsXG5cdFx0XHRcdFx0XHRtZXRhOiBtc2cucmVzdWx0cy5tZXRhXG5cdFx0XHRcdFx0fSwgaGFuZGxlKTtcblx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcdC8vIGZyZWUgbWVtb3J5IEFTQVBcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHdvcmtlci51c2VyQ2h1bmsobXNnLnJlc3VsdHMsIGhhbmRsZSwgbXNnLmZpbGUpO1xuXHRcdFx0XHRkZWxldGUgbXNnLnJlc3VsdHM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG1zZy5maW5pc2hlZCAmJiAhYWJvcnRlZClcblx0XHRcdGNvbXBsZXRlV29ya2VyKG1zZy53b3JrZXJJZCwgbXNnLnJlc3VsdHMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29tcGxldGVXb3JrZXIod29ya2VySWQsIHJlc3VsdHMpIHtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1t3b3JrZXJJZF07XG5cdFx0aWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDb21wbGV0ZSkpXG5cdFx0XHR3b3JrZXIudXNlckNvbXBsZXRlKHJlc3VsdHMpO1xuXHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcblx0XHRkZWxldGUgd29ya2Vyc1t3b3JrZXJJZF07XG5cdH1cblxuXHRmdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpIHtcblx0XHR0aHJvdyAnTm90IGltcGxlbWVudGVkLic7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiB3b3JrZXIgdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiB3b3JrZXJUaHJlYWRSZWNlaXZlZE1lc3NhZ2UoZSlcblx0e1xuXHRcdHZhciBtc2cgPSBlLmRhdGE7XG5cblx0XHRpZiAodHlwZW9mIFBhcGEuV09SS0VSX0lEID09PSAndW5kZWZpbmVkJyAmJiBtc2cpXG5cdFx0XHRQYXBhLldPUktFUl9JRCA9IG1zZy53b3JrZXJJZDtcblxuXHRcdGlmICh0eXBlb2YgbXNnLmlucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdHJlc3VsdHM6IFBhcGEucGFyc2UobXNnLmlucHV0LCBtc2cuY29uZmlnKSxcblx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgbXNnLmlucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgbXNnLmlucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gdGhhbmsgeW91LCBTYWZhcmkgKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdHtcblx0XHRcdHZhciByZXN1bHRzID0gUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpO1xuXHRcdFx0aWYgKHJlc3VsdHMpXG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqIE1ha2VzIGEgZGVlcCBjb3B5IG9mIGFuIGFycmF5IG9yIG9iamVjdCAobW9zdGx5KSAqL1xuXHRmdW5jdGlvbiBjb3B5KG9iailcblx0e1xuXHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdHJldHVybiBvYmo7XG5cdFx0dmFyIGNweSA9IG9iaiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKVxuXHRcdFx0Y3B5W2tleV0gPSBjb3B5KG9ialtrZXldKTtcblx0XHRyZXR1cm4gY3B5O1xuXHR9XG5cblx0ZnVuY3Rpb24gYmluZEZ1bmN0aW9uKGYsIHNlbGYpXG5cdHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IGYuYXBwbHkoc2VsZiwgYXJndW1lbnRzKTsgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24oZnVuYylcblx0e1xuXHRcdHJldHVybiB0eXBlb2YgZnVuYyA9PT0gJ2Z1bmN0aW9uJztcblx0fVxuXG5cdHJldHVybiBQYXBhO1xufSkpO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qISB0ZXRoZXIgMS40LjAgKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcbiAgfSBlbHNlIHtcbiAgICByb290LlRldGhlciA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIFRldGhlckJhc2UgPSB1bmRlZmluZWQ7XG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIFRldGhlckJhc2UgPSB7IG1vZHVsZXM6IFtdIH07XG59XG5cbnZhciB6ZXJvRWxlbWVudCA9IG51bGw7XG5cbi8vIFNhbWUgYXMgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCwgZXhjZXB0IGl0IHRha2VzIGludG8gYWNjb3VudCBwYXJlbnQgPGZyYW1lPiBvZmZzZXRzXG4vLyBpZiB0aGUgZWxlbWVudCBsaWVzIHdpdGhpbiBhIG5lc3RlZCBkb2N1bWVudCAoPGZyYW1lPiBvciA8aWZyYW1lPi1saWtlKS5cbmZ1bmN0aW9uIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKSB7XG4gIHZhciBib3VuZGluZ1JlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcbiAgLy8gV2UgY2FuJ3QgdXNlIGV4dGVuZCBiZWNhdXNlIHRoZSBwcm9wZXJ0aWVzIGFyZSBub3QgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBvYmplY3QgYnkgaGFzT3duUHJvcGVydHkgaW4gSUU5XG4gIHZhciByZWN0ID0ge307XG4gIGZvciAodmFyIGsgaW4gYm91bmRpbmdSZWN0KSB7XG4gICAgcmVjdFtrXSA9IGJvdW5kaW5nUmVjdFtrXTtcbiAgfVxuXG4gIGlmIChub2RlLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgdmFyIF9mcmFtZUVsZW1lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZnJhbWVFbGVtZW50O1xuICAgIGlmIChfZnJhbWVFbGVtZW50KSB7XG4gICAgICB2YXIgZnJhbWVSZWN0ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KF9mcmFtZUVsZW1lbnQpO1xuICAgICAgcmVjdC50b3AgKz0gZnJhbWVSZWN0LnRvcDtcbiAgICAgIHJlY3QuYm90dG9tICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmxlZnQgKz0gZnJhbWVSZWN0LmxlZnQ7XG4gICAgICByZWN0LnJpZ2h0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWN0O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxQYXJlbnRzKGVsKSB7XG4gIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG4gIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTU0ODM5N1xuICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWwpIHx8IHt9O1xuICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuICB2YXIgcGFyZW50cyA9IFtdO1xuXG4gIGlmIChwb3NpdGlvbiA9PT0gJ2ZpeGVkJykge1xuICAgIHJldHVybiBbZWxdO1xuICB9XG5cbiAgdmFyIHBhcmVudCA9IGVsO1xuICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSAmJiBwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUocGFyZW50KTtcbiAgICB9IGNhdGNoIChlcnIpIHt9XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAndW5kZWZpbmVkJyB8fCBzdHlsZSA9PT0gbnVsbCkge1xuICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICByZXR1cm4gcGFyZW50cztcbiAgICB9XG5cbiAgICB2YXIgX3N0eWxlID0gc3R5bGU7XG4gICAgdmFyIG92ZXJmbG93ID0gX3N0eWxlLm92ZXJmbG93O1xuICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuICAgIHZhciBvdmVyZmxvd1kgPSBfc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgaWYgKC8oYXV0b3xzY3JvbGwpLy50ZXN0KG92ZXJmbG93ICsgb3ZlcmZsb3dZICsgb3ZlcmZsb3dYKSkge1xuICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG4gICAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmJvZHkpO1xuXG4gIC8vIElmIHRoZSBub2RlIGlzIHdpdGhpbiBhIGZyYW1lLCBhY2NvdW50IGZvciB0aGUgcGFyZW50IHdpbmRvdyBzY3JvbGxcbiAgaWYgKGVsLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgcGFyZW50cy5wdXNoKGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudHM7XG59XG5cbnZhciB1bmlxdWVJZCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBpZCA9IDA7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICsraWQ7XG4gIH07XG59KSgpO1xuXG52YXIgemVyb1Bvc0NhY2hlID0ge307XG52YXIgZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luKCkge1xuICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG4gIC8vIGppdHRlciBhcyB0aGUgdXNlciBzY3JvbGxzIHRoYXQgbWVzc2VzIHdpdGggb3VyIGFiaWxpdHkgdG8gZGV0ZWN0IGlmIHR3byBwb3NpdGlvbnNcbiAgLy8gYXJlIGVxdWl2aWxhbnQgb3Igbm90LiAgV2UgcGxhY2UgYW4gZWxlbWVudCBhdCB0aGUgdG9wIGxlZnQgb2YgdGhlIHBhZ2UgdGhhdCB3aWxsXG4gIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG4gIHZhciBub2RlID0gemVyb0VsZW1lbnQ7XG4gIGlmICghbm9kZSB8fCAhZG9jdW1lbnQuYm9keS5jb250YWlucyhub2RlKSkge1xuICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcbiAgICBleHRlbmQobm9kZS5zdHlsZSwge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xuXG4gICAgemVyb0VsZW1lbnQgPSBub2RlO1xuICB9XG5cbiAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG4gIGlmICh0eXBlb2YgemVyb1Bvc0NhY2hlW2lkXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB6ZXJvUG9zQ2FjaGVbaWRdID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KG5vZGUpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNhY2hlIHdoZW4gdGhpcyBwb3NpdGlvbiBjYWxsIGlzIGRvbmVcbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xufTtcblxuZnVuY3Rpb24gcmVtb3ZlVXRpbEVsZW1lbnRzKCkge1xuICBpZiAoemVyb0VsZW1lbnQpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHplcm9FbGVtZW50KTtcbiAgfVxuICB6ZXJvRWxlbWVudCA9IG51bGw7XG59O1xuXG5mdW5jdGlvbiBnZXRCb3VuZHMoZWwpIHtcbiAgdmFyIGRvYyA9IHVuZGVmaW5lZDtcbiAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuICAgIGRvYyA9IGRvY3VtZW50O1xuICAgIGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIGRvYyA9IGVsLm93bmVyRG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gIHZhciBib3ggPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QoZWwpO1xuXG4gIHZhciBvcmlnaW4gPSBnZXRPcmlnaW4oKTtcblxuICBib3gudG9wIC09IG9yaWdpbi50b3A7XG4gIGJveC5sZWZ0IC09IG9yaWdpbi5sZWZ0O1xuXG4gIGlmICh0eXBlb2YgYm94LndpZHRoID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcbiAgfVxuICBpZiAodHlwZW9mIGJveC5oZWlnaHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG4gIH1cblxuICBib3gudG9wID0gYm94LnRvcCAtIGRvY0VsLmNsaWVudFRvcDtcbiAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG4gIGJveC5yaWdodCA9IGRvYy5ib2R5LmNsaWVudFdpZHRoIC0gYm94LndpZHRoIC0gYm94LmxlZnQ7XG4gIGJveC5ib3R0b20gPSBkb2MuYm9keS5jbGllbnRIZWlnaHQgLSBib3guaGVpZ2h0IC0gYm94LnRvcDtcblxuICByZXR1cm4gYm94O1xufVxuXG5mdW5jdGlvbiBnZXRPZmZzZXRQYXJlbnQoZWwpIHtcbiAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbnZhciBfc2Nyb2xsQmFyU2l6ZSA9IG51bGw7XG5mdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuICBpZiAoX3Njcm9sbEJhclNpemUpIHtcbiAgICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG4gIH1cbiAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpbm5lci5zdHlsZS5oZWlnaHQgPSAnMjAwcHgnO1xuXG4gIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgd2lkdGg6ICcyMDBweCcsXG4gICAgaGVpZ2h0OiAnMTUwcHgnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICB9KTtcblxuICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG4gIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG4gIHZhciB3aWR0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcbiAgICB3aWR0aFNjcm9sbCA9IG91dGVyLmNsaWVudFdpZHRoO1xuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoID0gd2lkdGhDb250YWluZWQgLSB3aWR0aFNjcm9sbDtcblxuICBfc2Nyb2xsQmFyU2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG4gIHJldHVybiBfc2Nyb2xsQmFyU2l6ZTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cbiAgdmFyIGFyZ3MgPSBbXTtcblxuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuXG4gIGFyZ3Muc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaikge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCkucmVwbGFjZShyZWdleCwgJyAnKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgaWYgKGNscy50cmltKCkpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgICB2YXIgY2xzID0gZ2V0Q2xhc3NOYW1lKGVsKSArICgnICcgKyBuYW1lKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcbiAgfVxuICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKTtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUgKyAnKCB8JCknLCAnZ2knKS50ZXN0KGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzTmFtZShlbCkge1xuICAvLyBDYW4ndCB1c2UganVzdCBTVkdBbmltYXRlZFN0cmluZyBoZXJlIHNpbmNlIG5vZGVzIHdpdGhpbiBhIEZyYW1lIGluIElFIGhhdmVcbiAgLy8gY29tcGxldGVseSBzZXBhcmF0ZWx5IFNWR0FuaW1hdGVkU3RyaW5nIGJhc2UgY2xhc3Nlc1xuICBpZiAoZWwuY2xhc3NOYW1lIGluc3RhbmNlb2YgZWwub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5TVkdBbmltYXRlZFN0cmluZykge1xuICAgIHJldHVybiBlbC5jbGFzc05hbWUuYmFzZVZhbDtcbiAgfVxuICByZXR1cm4gZWwuY2xhc3NOYW1lO1xufVxuXG5mdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcbiAgLy8gT2YgdGhlIHNldCBvZiAnYWxsJyBjbGFzc2VzLCB3ZSBuZWVkIHRoZSAnYWRkJyBjbGFzc2VzLCBhbmQgb25seSB0aGVcbiAgLy8gJ2FkZCcgY2xhc3NlcyB0byBiZSBzZXQuXG4gIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoYWRkLmluZGV4T2YoY2xzKSA9PT0gLTEgJiYgaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIHJlbW92ZUNsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG5cbiAgYWRkLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIGFkZENsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBkZWZlcnJlZCA9IFtdO1xuXG52YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuICBkZWZlcnJlZC5wdXNoKGZuKTtcbn07XG5cbnZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuICB2YXIgZm4gPSB1bmRlZmluZWQ7XG4gIHdoaWxlIChmbiA9IGRlZmVycmVkLnBvcCgpKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxudmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudGVkKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudGVkKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhFdmVudGVkLCBbe1xuICAgIGtleTogJ29uJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgdmFyIG9uY2UgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1szXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0ucHVzaCh7IGhhbmRsZXI6IGhhbmRsZXIsIGN0eDogY3R4LCBvbmNlOiBvbmNlIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29uY2UnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHRoaXMub24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb2ZmJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb2ZmKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmJpbmRpbmdzW2V2ZW50XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1tldmVudF1baV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICArK2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndHJpZ2dlcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5iaW5kaW5nc1tldmVudF0pIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgX2JpbmRpbmdzJGV2ZW50JGkgPSB0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXTtcbiAgICAgICAgICB2YXIgaGFuZGxlciA9IF9iaW5kaW5ncyRldmVudCRpLmhhbmRsZXI7XG4gICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcbiAgICAgICAgICB2YXIgb25jZSA9IF9iaW5kaW5ncyRldmVudCRpLm9uY2U7XG5cbiAgICAgICAgICB2YXIgY29udGV4dCA9IGN0eDtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG4gICAgICAgICAgaWYgKG9uY2UpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBFdmVudGVkO1xufSkoKTtcblxuVGV0aGVyQmFzZS5VdGlscyA9IHtcbiAgZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0OiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QsXG4gIGdldFNjcm9sbFBhcmVudHM6IGdldFNjcm9sbFBhcmVudHMsXG4gIGdldEJvdW5kczogZ2V0Qm91bmRzLFxuICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIHVwZGF0ZUNsYXNzZXM6IHVwZGF0ZUNsYXNzZXMsXG4gIGRlZmVyOiBkZWZlcixcbiAgZmx1c2g6IGZsdXNoLFxuICB1bmlxdWVJZDogdW5pcXVlSWQsXG4gIEV2ZW50ZWQ6IEV2ZW50ZWQsXG4gIGdldFNjcm9sbEJhclNpemU6IGdldFNjcm9sbEJhclNpemUsXG4gIHJlbW92ZVV0aWxFbGVtZW50czogcmVtb3ZlVXRpbEVsZW1lbnRzXG59O1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlLCBwZXJmb3JtYW5jZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDYsIF94NywgX3g4KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NiwgcHJvcGVydHkgPSBfeDcsIHJlY2VpdmVyID0gX3g4OyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NiA9IHBhcmVudDsgX3g3ID0gcHJvcGVydHk7IF94OCA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBkZXNjID0gcGFyZW50ID0gdW5kZWZpbmVkOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG59XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0U2Nyb2xsUGFyZW50cyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbFBhcmVudHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIGdldE9mZnNldFBhcmVudCA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldE9mZnNldFBhcmVudDtcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcbnZhciByZW1vdmVDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnJlbW92ZUNsYXNzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG52YXIgZmx1c2ggPSBfVGV0aGVyQmFzZSRVdGlscy5mbHVzaDtcbnZhciBnZXRTY3JvbGxCYXJTaXplID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsQmFyU2l6ZTtcbnZhciByZW1vdmVVdGlsRWxlbWVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVVdGlsRWxlbWVudHM7XG5cbmZ1bmN0aW9uIHdpdGhpbihhLCBiKSB7XG4gIHZhciBkaWZmID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gMSA6IGFyZ3VtZW50c1syXTtcblxuICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xufVxuXG52YXIgdHJhbnNmb3JtS2V5ID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgdmFyIHRyYW5zZm9ybXMgPSBbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nLCAnT1RyYW5zZm9ybScsICdNb3pUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFuc2Zvcm1zLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG4gICAgaWYgKGVsLnN0eWxlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gIH1cbn0pKCk7XG5cbnZhciB0ZXRoZXJzID0gW107XG5cbnZhciBwb3NpdGlvbiA9IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlcikge1xuICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG4gIH0pO1xuICBmbHVzaCgpO1xufTtcblxuZnVuY3Rpb24gbm93KCkge1xuICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfVxuICByZXR1cm4gK25ldyBEYXRlKCk7XG59XG5cbihmdW5jdGlvbiAoKSB7XG4gIHZhciBsYXN0Q2FsbCA9IG51bGw7XG4gIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuICB2YXIgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuXG4gIHZhciB0aWNrID0gZnVuY3Rpb24gdGljaygpIHtcbiAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcbiAgICAgIC8vIFdlIHZvbHVudGFyaWx5IHRocm90dGxlIG91cnNlbHZlcyBpZiB3ZSBjYW4ndCBtYW5hZ2UgNjBmcHNcbiAgICAgIGxhc3REdXJhdGlvbiA9IE1hdGgubWluKGxhc3REdXJhdGlvbiAtIDE2LCAyNTApO1xuXG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gc2V0VGltZW91dCh0aWNrLCAyNTApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbGFzdENhbGwgIT09ICd1bmRlZmluZWQnICYmIG5vdygpIC0gbGFzdENhbGwgPCAxMCkge1xuICAgICAgLy8gU29tZSBicm93c2VycyBjYWxsIGV2ZW50cyBhIGxpdHRsZSB0b28gZnJlcXVlbnRseSwgcmVmdXNlIHRvIHJ1biBtb3JlIHRoYW4gaXMgcmVhc29uYWJsZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwZW5kaW5nVGltZW91dCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuICAgICAgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuICAgIH1cblxuICAgIGxhc3RDYWxsID0gbm93KCk7XG4gICAgcG9zaXRpb24oKTtcbiAgICBsYXN0RHVyYXRpb24gPSBub3coKSAtIGxhc3RDYWxsO1xuICB9O1xuXG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgWydyZXNpemUnLCAnc2Nyb2xsJywgJ3RvdWNobW92ZSddLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdGljayk7XG4gICAgfSk7XG4gIH1cbn0pKCk7XG5cbnZhciBNSVJST1JfTFIgPSB7XG4gIGNlbnRlcjogJ2NlbnRlcicsXG4gIGxlZnQ6ICdyaWdodCcsXG4gIHJpZ2h0OiAnbGVmdCdcbn07XG5cbnZhciBNSVJST1JfVEIgPSB7XG4gIG1pZGRsZTogJ21pZGRsZScsXG4gIHRvcDogJ2JvdHRvbScsXG4gIGJvdHRvbTogJ3RvcCdcbn07XG5cbnZhciBPRkZTRVRfTUFQID0ge1xuICB0b3A6IDAsXG4gIGxlZnQ6IDAsXG4gIG1pZGRsZTogJzUwJScsXG4gIGNlbnRlcjogJzUwJScsXG4gIGJvdHRvbTogJzEwMCUnLFxuICByaWdodDogJzEwMCUnXG59O1xuXG52YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuICAgIGxlZnQgPSBNSVJST1JfTFJbcmVsYXRpdmVUb0F0dGFjaG1lbnQubGVmdF07XG4gIH1cblxuICBpZiAodG9wID09PSAnYXV0bycpIHtcbiAgICB0b3AgPSBNSVJST1JfVEJbcmVsYXRpdmVUb0F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG52YXIgYXR0YWNobWVudFRvT2Zmc2V0ID0gZnVuY3Rpb24gYXR0YWNobWVudFRvT2Zmc2V0KGF0dGFjaG1lbnQpIHtcbiAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG4gIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG5mdW5jdGlvbiBhZGRPZmZzZXQoKSB7XG4gIHZhciBvdXQgPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgb2Zmc2V0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuICAgICAgdG9wID0gcGFyc2VGbG9hdCh0b3AsIDEwKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgbGVmdCA9IHBhcnNlRmxvYXQobGVmdCwgMTApO1xuICAgIH1cblxuICAgIG91dC50b3AgKz0gdG9wO1xuICAgIG91dC5sZWZ0ICs9IGxlZnQ7XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG9mZnNldFRvUHgob2Zmc2V0LCBzaXplKSB7XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQubGVmdCA9IHBhcnNlRmxvYXQob2Zmc2V0LmxlZnQsIDEwKSAvIDEwMCAqIHNpemUud2lkdGg7XG4gIH1cbiAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQudG9wID0gcGFyc2VGbG9hdChvZmZzZXQudG9wLCAxMCkgLyAxMDAgKiBzaXplLmhlaWdodDtcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQ7XG59XG5cbnZhciBwYXJzZU9mZnNldCA9IGZ1bmN0aW9uIHBhcnNlT2Zmc2V0KHZhbHVlKSB7XG4gIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG4gIHZhciBfdmFsdWUkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX3ZhbHVlJHNwbGl0LCAyKTtcblxuICB2YXIgdG9wID0gX3ZhbHVlJHNwbGl0MlswXTtcbiAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG4gIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG59O1xudmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG52YXIgVGV0aGVyQ2xhc3MgPSAoZnVuY3Rpb24gKF9FdmVudGVkKSB7XG4gIF9pbmhlcml0cyhUZXRoZXJDbGFzcywgX0V2ZW50ZWQpO1xuXG4gIGZ1bmN0aW9uIFRldGhlckNsYXNzKG9wdGlvbnMpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRldGhlckNsYXNzLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuICAgIHRldGhlcnMucHVzaCh0aGlzKTtcblxuICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuXG4gICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuICAgIFRldGhlckJhc2UubW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChtb2R1bGUpIHtcbiAgICAgIGlmICh0eXBlb2YgbW9kdWxlLmluaXRpYWxpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wb3NpdGlvbigpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFRldGhlckNsYXNzLCBbe1xuICAgIGtleTogJ2dldENsYXNzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q2xhc3MoKSB7XG4gICAgICB2YXIga2V5ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG4gICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG4gICAgICBpZiAodHlwZW9mIGNsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIGNsYXNzZXNba2V5XSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzZXNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXggKyAnLScgKyBrZXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3NldE9wdGlvbnMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRPZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnYXV0byBhdXRvJyxcbiAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG4gICAgICB9O1xuXG4gICAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICB2YXIgZWxlbWVudCA9IF9vcHRpb25zLmVsZW1lbnQ7XG4gICAgICB2YXIgdGFyZ2V0ID0gX29wdGlvbnMudGFyZ2V0O1xuICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSAndmlld3BvcnQnKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXQgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG4gICAgICB9XG5cbiAgICAgIFsnZWxlbWVudCcsICd0YXJnZXQnXS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogQm90aCBlbGVtZW50IGFuZCB0YXJnZXQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IF90aGlzMltrZXldWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygndGFyZ2V0JykpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRhY2htZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBZb3UgbXVzdCBwcm92aWRlIGFuIGF0dGFjaG1lbnQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50YXJnZXRBdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy50YXJnZXRBdHRhY2htZW50KTtcbiAgICAgIHRoaXMuYXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMuYXR0YWNobWVudCk7XG4gICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuICAgICAgdGhpcy50YXJnZXRPZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMudGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cyA9IFt0aGlzLnRhcmdldF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBnZXRTY3JvbGxQYXJlbnRzKHRoaXMudGFyZ2V0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlKSkge1xuICAgICAgICB0aGlzLmVuYWJsZShwb3MpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFRhcmdldEJvdW5kcygpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdG9wOiBwYWdlWU9mZnNldCwgbGVmdDogcGFnZVhPZmZzZXQsIGhlaWdodDogaW5uZXJIZWlnaHQsIHdpZHRoOiBpbm5lcldpZHRoIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXG4gICAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBib3VuZHMud2lkdGgsXG4gICAgICAgICAgICAgIHRvcDogYm91bmRzLnRvcCxcbiAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0IC0gYm91bmRzLnRvcCkpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihpbm5lckhlaWdodCwgb3V0LmhlaWdodCk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0IC09IDI7XG5cbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0ICsgaW5uZXJXaWR0aCkpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKGlubmVyV2lkdGgsIG91dC53aWR0aCk7XG4gICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuICAgICAgICAgICAgaWYgKG91dC50b3AgPCBwYWdlWU9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQudG9wID0gcGFnZVlPZmZzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3V0LmxlZnQgPCBwYWdlWE9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQubGVmdCA9IHBhZ2VYT2Zmc2V0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgICB2YXIgYm91bmRzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG4gICAgICAgICAgICAgIHRvcDogcGFnZVlPZmZzZXQsXG4gICAgICAgICAgICAgIGhlaWdodDogaW5uZXJIZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XG5cbiAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgdmFyIHNjcm9sbEJvdHRvbSA9IDA7XG4gICAgICAgICAgaWYgKGhhc0JvdHRvbVNjcm9sbCkge1xuICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGhlaWdodCA9IGJvdW5kcy5oZWlnaHQgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKSAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpIC0gc2Nyb2xsQm90dG9tO1xuXG4gICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAxNSxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICogMC45NzUgKiAoaGVpZ2h0IC8gdGFyZ2V0LnNjcm9sbEhlaWdodCksXG4gICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBmaXRBZGogPSAwO1xuICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGZpdEFkaiA9IC0wLjAwMDExICogTWF0aC5wb3coaGVpZ2h0LCAyKSAtIDAuMDA3MjcgKiBoZWlnaHQgKyAyMi41ODtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG4gICAgICAgICAgb3V0LnRvcCA9IHNjcm9sbFBlcmNlbnRhZ2UgKiAoaGVpZ2h0IC0gb3V0LmhlaWdodCAtIGZpdEFkaikgKyBib3VuZHMudG9wICsgcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCk7XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnY2xlYXJDYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NhY2hlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG4gICAgICAvLyBNb3JlIHRoYW4gb25lIG1vZHVsZSB3aWxsIG9mdGVuIG5lZWQgdGhlIHNhbWUgRE9NIGluZm8sIHNvXG4gICAgICAvLyB3ZSBrZWVwIGEgY2FjaGUgd2hpY2ggaXMgY2xlYXJlZCBvbiBlYWNoIHBvc2l0aW9uIGNhbGxcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlW2tdID0gZ2V0dGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdlbmFibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbmFibGUoKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB9XG4gICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgIGlmIChwYXJlbnQgIT09IF90aGlzMy50YXJnZXQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIHBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdGhpczMucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHBvcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGlzYWJsZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICByZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXM0LnBvc2l0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGVzdHJveScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cbiAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG4gICAgICAgIGlmICh0ZXRoZXIgPT09IF90aGlzNSkge1xuICAgICAgICAgIHRldGhlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVtb3ZlIGFueSBlbGVtZW50cyB3ZSB3ZXJlIHVzaW5nIGZvciBjb252ZW5pZW5jZSBmcm9tIHRoZSBET01cbiAgICAgIGlmICh0ZXRoZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZW1vdmVVdGlsRWxlbWVudHMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVBdHRhY2hDbGFzc2VzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlQXR0YWNoQ2xhc3NlcyhlbGVtZW50QXR0YWNoLCB0YXJnZXRBdHRhY2gpIHtcbiAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICBlbGVtZW50QXR0YWNoID0gZWxlbWVudEF0dGFjaCB8fCB0aGlzLmF0dGFjaG1lbnQ7XG4gICAgICB0YXJnZXRBdHRhY2ggPSB0YXJnZXRBdHRhY2ggfHwgdGhpcy50YXJnZXRBdHRhY2htZW50O1xuICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIHVwZGF0ZUF0dGFjaENsYXNzZXMgY2FuIGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBpbiBhIHBvc2l0aW9uIGNhbGwsIHNvXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcbiAgICAgICAgLy8gcmFuIGl0IGRvZXNuJ3QgYWRkIGFueSBleHRyYSBjbGFzc2VzIGZyb20gcHJldmlvdXMgY2FsbHMuXG4gICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMuc3BsaWNlKDAsIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYWRkID0gdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcztcblxuICAgICAgaWYgKGVsZW1lbnRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhbGwgPSBbXTtcbiAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCEodHlwZW9mIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYuZWxlbWVudCwgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuICAgICAgICBpZiAoIShfdGhpczYub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNi50YXJnZXQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdwb3NpdGlvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgIHZhciBmbHVzaENoYW5nZXMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAvLyBmbHVzaENoYW5nZXMgY29tbWl0cyB0aGUgY2hhbmdlcyBpbW1lZGlhdGVseSwgbGVhdmUgdHJ1ZSB1bmxlc3MgeW91IGFyZSBwb3NpdGlvbmluZyBtdWx0aXBsZVxuICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG4gICAgICAvLyBUdXJuICdhdXRvJyBhdHRhY2htZW50cyBpbnRvIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIgb3IgZWRnZVxuICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgICB0aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXModGhpcy5hdHRhY2htZW50LCB0YXJnZXRBdHRhY2htZW50KTtcblxuICAgICAgdmFyIGVsZW1lbnRQb3MgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczcuZWxlbWVudCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHdpZHRoID0gZWxlbWVudFBvcy53aWR0aDtcbiAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuICAgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuICAgICAgICAvLyBnZXR0aW5nIGhpZGRlbi5cbiAgICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxhc3RTaXplID0geyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG4gICAgICB9XG5cbiAgICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXM3LmdldFRhcmdldEJvdW5kcygpO1xuICAgICAgfSk7XG4gICAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRhcmdldFBvcztcblxuICAgICAgLy8gR2V0IGFuIGFjdHVhbCBweCBvZmZzZXQgZnJvbSB0aGUgYXR0YWNobWVudFxuICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcbiAgICAgIHZhciB0YXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0YXJnZXRBdHRhY2htZW50KSwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIHZhciBtYW51YWxPZmZzZXQgPSBvZmZzZXRUb1B4KHRoaXMub2Zmc2V0LCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIC8vIEFkZCB0aGUgbWFudWFsbHkgcHJvdmlkZWQgb2Zmc2V0XG4gICAgICBvZmZzZXQgPSBhZGRPZmZzZXQob2Zmc2V0LCBtYW51YWxPZmZzZXQpO1xuICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgLy8gSXQncyBub3cgb3VyIGdvYWwgdG8gbWFrZSAoZWxlbWVudCBwb3NpdGlvbiArIG9mZnNldCkgPT0gKHRhcmdldCBwb3NpdGlvbiArIHRhcmdldCBvZmZzZXQpXG4gICAgICB2YXIgbGVmdCA9IHRhcmdldFBvcy5sZWZ0ICsgdGFyZ2V0T2Zmc2V0LmxlZnQgLSBvZmZzZXQubGVmdDtcbiAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVGV0aGVyQmFzZS5tb2R1bGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBfbW9kdWxlMiA9IFRldGhlckJhc2UubW9kdWxlc1tpXTtcbiAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRQb3M6IHRhcmdldFBvcyxcbiAgICAgICAgICBlbGVtZW50UG9zOiBlbGVtZW50UG9zLFxuICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgIHRhcmdldE9mZnNldDogdGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbE9mZnNldDogbWFudWFsT2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIHNjcm9sbGJhclNpemU6IHNjcm9sbGJhclNpemUsXG4gICAgICAgICAgYXR0YWNobWVudDogdGhpcy5hdHRhY2htZW50XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wID0gcmV0LnRvcDtcbiAgICAgICAgICBsZWZ0ID0gcmV0LmxlZnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2UgZGVzY3JpYmUgdGhlIHBvc2l0aW9uIHRocmVlIGRpZmZlcmVudCB3YXlzIHRvIGdpdmUgdGhlIG9wdGltaXplclxuICAgICAgLy8gYSBjaGFuY2UgdG8gZGVjaWRlIHRoZSBiZXN0IHBvc3NpYmxlIHdheSB0byBwb3NpdGlvbiB0aGUgZWxlbWVudFxuICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuICAgICAgdmFyIG5leHQgPSB7XG4gICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHBhZ2UgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcbiAgICAgICAgcGFnZToge1xuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIGxlZnQ6IGxlZnRcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICAgIHZpZXdwb3J0OiB7XG4gICAgICAgICAgdG9wOiB0b3AgLSBwYWdlWU9mZnNldCxcbiAgICAgICAgICBib3R0b206IHBhZ2VZT2Zmc2V0IC0gdG9wIC0gaGVpZ2h0ICsgaW5uZXJIZWlnaHQsXG4gICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgIHJpZ2h0OiBwYWdlWE9mZnNldCAtIGxlZnQgLSB3aWR0aCArIGlubmVyV2lkdGhcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRvYyA9IHRoaXMudGFyZ2V0Lm93bmVyRG9jdW1lbnQ7XG4gICAgICB2YXIgd2luID0gZG9jLmRlZmF1bHRWaWV3O1xuXG4gICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmICh3aW4uaW5uZXJIZWlnaHQgPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcbiAgICAgICAgbmV4dC52aWV3cG9ydC5ib3R0b20gLT0gc2Nyb2xsYmFyU2l6ZS5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW4uaW5uZXJXaWR0aCA+IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQucmlnaHQgLT0gc2Nyb2xsYmFyU2l6ZS53aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jLmJvZHkuc3R5bGUucG9zaXRpb24pID09PSAtMSB8fCBbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnBhcmVudEVsZW1lbnQuc3R5bGUucG9zaXRpb24pID09PSAtMSkge1xuICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG4gICAgICAgIG5leHQucGFnZS5ib3R0b20gPSBkb2MuYm9keS5zY3JvbGxIZWlnaHQgLSB0b3AgLSBoZWlnaHQ7XG4gICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gbGVmdCAtIHdpZHRoO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM3LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBvc2l0aW9uID0gX3RoaXM3LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuICAgICAgICAgIHZhciBvZmZzZXRCb3JkZXIgPSB7fTtcbiAgICAgICAgICBbJ1RvcCcsICdMZWZ0JywgJ0JvdHRvbScsICdSaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24uYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0UG9zaXRpb24udG9wIC0gb2Zmc2V0UGFyZW50U2l6ZS5oZWlnaHQgKyBvZmZzZXRCb3JkZXIuYm90dG9tO1xuXG4gICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuICAgICAgICAgICAgaWYgKG5leHQucGFnZS5sZWZ0ID49IG9mZnNldFBvc2l0aW9uLmxlZnQgKyBvZmZzZXRCb3JkZXIubGVmdCAmJiBuZXh0LnBhZ2UucmlnaHQgPj0gb2Zmc2V0UG9zaXRpb24ucmlnaHQpIHtcbiAgICAgICAgICAgICAgLy8gV2UncmUgd2l0aGluIHRoZSB2aXNpYmxlIHBhcnQgb2YgdGhlIHRhcmdldCdzIHNjcm9sbCBwYXJlbnRcbiAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxMZWZ0ID0gb2Zmc2V0UGFyZW50LnNjcm9sbExlZnQ7XG5cbiAgICAgICAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cbiAgICAgICAgICAgICAgbmV4dC5vZmZzZXQgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBuZXh0LnBhZ2UudG9wIC0gb2Zmc2V0UG9zaXRpb24udG9wICsgc2Nyb2xsVG9wIC0gb2Zmc2V0Qm9yZGVyLnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuICAgICAgLy8gbG9va2luZyBhdCB0aGUgYm9keSwgYnV0IHdlJ3JlIGdvbm5hIGdldCBkaW1pbmlzaGluZyByZXR1cm5zLlxuXG4gICAgICB0aGlzLm1vdmUobmV4dCk7XG5cbiAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG4gICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IDMpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmx1c2hDaGFuZ2VzKSB7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRIRSBJU1NVRVxuICB9LCB7XG4gICAga2V5OiAnbW92ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgaWYgKCEodHlwZW9mIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2FtZSA9IHt9O1xuXG4gICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuICAgICAgICBzYW1lW3R5cGVdID0ge307XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHBvc1t0eXBlXSkge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpc3RvcnkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IHRoaXMuaGlzdG9yeVtpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNzcyA9IHsgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgYm90dG9tOiAnJyB9O1xuXG4gICAgICB2YXIgdHJhbnNjcmliZSA9IGZ1bmN0aW9uIHRyYW5zY3JpYmUoX3NhbWUsIF9wb3MpIHtcbiAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBncHUgPSBoYXNPcHRpbWl6YXRpb25zID8gX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucy5ncHUgOiBudWxsO1xuICAgICAgICBpZiAoZ3B1ICE9PSBmYWxzZSkge1xuICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB4UG9zID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcbiAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuICAgICAgICAgICAgeVBvcyA9IF9wb3MudG9wO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSAtX3Bvcy5ib3R0b207XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcbiAgICAgICAgICAgIGNzcy5sZWZ0ID0gMDtcbiAgICAgICAgICAgIHhQb3MgPSBfcG9zLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gLV9wb3MucmlnaHQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgICAgICAgICAvLyBIdWJTcG90L3RldGhlciMyMDdcbiAgICAgICAgICAgIHZhciByZXRpbmEgPSB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMS4zZHBweCknKS5tYXRjaGVzIHx8IHdpbmRvdy5tYXRjaE1lZGlhKCdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMS4zKScpLm1hdGNoZXM7XG4gICAgICAgICAgICBpZiAoIXJldGluYSkge1xuICAgICAgICAgICAgICB4UG9zID0gTWF0aC5yb3VuZCh4UG9zKTtcbiAgICAgICAgICAgICAgeVBvcyA9IE1hdGgucm91bmQoeVBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gPSAndHJhbnNsYXRlWCgnICsgeFBvcyArICdweCkgdHJhbnNsYXRlWSgnICsgeVBvcyArICdweCknO1xuXG4gICAgICAgICAgaWYgKHRyYW5zZm9ybUtleSAhPT0gJ21zVHJhbnNmb3JtJykge1xuICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG4gICAgICAgICAgICAvLyBidXQgSUU5IGRvZXNuJ3Qgc3VwcG9ydCAzZCB0cmFuc2Zvcm1zIGFuZCB3aWxsIGNob2tlLlxuICAgICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gKz0gXCIgdHJhbnNsYXRlWigwKVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gX3Bvcy5ib3R0b20gKyAncHgnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IF9wb3MubGVmdCArICdweCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IF9wb3MucmlnaHQgKyAncHgnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIG1vdmVkID0gZmFsc2U7XG4gICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZShzYW1lLnBhZ2UsIHBvcy5wYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS52aWV3cG9ydCwgcG9zLnZpZXdwb3J0KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzOC5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM4LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIF90aGlzOC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG4gICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9KSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZSh7IHRvcDogdHJ1ZSwgbGVmdDogdHJ1ZSB9LCBwb3MucGFnZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghbW92ZWQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudCkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuICAgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQub3duZXJEb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFueSBjc3MgY2hhbmdlIHdpbGwgdHJpZ2dlciBhIHJlcGFpbnQsIHNvIGxldCdzIGF2b2lkIG9uZSBpZiBub3RoaW5nIGNoYW5nZWRcbiAgICAgIHZhciB3cml0ZUNTUyA9IHt9O1xuICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gY3NzKSB7XG4gICAgICAgIHZhciB2YWwgPSBjc3Nba2V5XTtcbiAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cbiAgICAgICAgaWYgKGVsVmFsICE9PSB2YWwpIHtcbiAgICAgICAgICB3cml0ZSA9IHRydWU7XG4gICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAod3JpdGUpIHtcbiAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGV4dGVuZChfdGhpczguZWxlbWVudC5zdHlsZSwgd3JpdGVDU1MpO1xuICAgICAgICAgIF90aGlzOC50cmlnZ2VyKCdyZXBvc2l0aW9uZWQnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFRldGhlckNsYXNzO1xufSkoRXZlbnRlZCk7XG5cblRldGhlckNsYXNzLm1vZHVsZXMgPSBbXTtcblxuVGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG52YXIgVGV0aGVyID0gZXh0ZW5kKFRldGhlckNsYXNzLCBUZXRoZXJCYXNlKTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxudmFyIEJPVU5EU19GT1JNQVQgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXG5mdW5jdGlvbiBnZXRCb3VuZGluZ1JlY3QodGV0aGVyLCB0bykge1xuICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG4gICAgdG8gPSB0ZXRoZXIuc2Nyb2xsUGFyZW50c1swXTtcbiAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcbiAgICB0byA9IFtwYWdlWE9mZnNldCwgcGFnZVlPZmZzZXQsIGlubmVyV2lkdGggKyBwYWdlWE9mZnNldCwgaW5uZXJIZWlnaHQgKyBwYWdlWU9mZnNldF07XG4gIH1cblxuICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG4gICAgdG8gPSB0by5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cblxuICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbm9kZSA9IHRvO1xuICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuICAgICAgdmFyIHBvcyA9IHNpemU7XG4gICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRvKTtcblxuICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuICAgICAgLy8gQWNjb3VudCBhbnkgcGFyZW50IEZyYW1lcyBzY3JvbGwgb2Zmc2V0XG4gICAgICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICB2YXIgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgICB0b1swXSArPSB3aW4ucGFnZVhPZmZzZXQ7XG4gICAgICAgIHRvWzFdICs9IHdpbi5wYWdlWU9mZnNldDtcbiAgICAgICAgdG9bMl0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1szXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICB9XG5cbiAgICAgIEJPVU5EU19GT1JNQVQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSwgaSkge1xuICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG4gICAgICAgIGlmIChzaWRlID09PSAnVG9wJyB8fCBzaWRlID09PSAnTGVmdCcpIHtcbiAgICAgICAgICB0b1tpXSArPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b1tpXSAtPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgfVxuXG4gIHJldHVybiB0bztcbn1cblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG4gICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBfcmVmLnRhcmdldEF0dGFjaG1lbnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25zdHJhaW50cykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuICAgICAgLy8gdGhlIGNsYXNzZXMgaW4gYW5kIG91dFxuICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgIH1cblxuICAgIHZhciB0YXJnZXRTaXplID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICB9KTtcblxuICAgIHZhciB0YXJnZXRIZWlnaHQgPSB0YXJnZXRTaXplLmhlaWdodDtcbiAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbdGhpcy5nZXRDbGFzcygncGlubmVkJyksIHRoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKV07XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICB2YXIgcGlubmVkQ2xhc3MgPSBjb25zdHJhaW50LnBpbm5lZENsYXNzO1xuXG4gICAgICBpZiAob3V0T2ZCb3VuZHNDbGFzcykge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKGNscyArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcbiAgICB2YXIgZUF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRoaXMuYXR0YWNobWVudCk7XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcbiAgICAgIHZhciBhdHRhY2htZW50ID0gY29uc3RyYWludC5hdHRhY2htZW50O1xuICAgICAgdmFyIHBpbiA9IGNvbnN0cmFpbnQucGluO1xuXG4gICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGF0dGFjaG1lbnQgPSAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG4gICAgICAgICAgY2hhbmdlQXR0YWNoWSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChhdHRhY2htZW50LmluZGV4T2YoJyAnKSA+PSAwKSB7XG4gICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX2F0dGFjaG1lbnQkc3BsaXQsIDIpO1xuXG4gICAgICAgIGNoYW5nZUF0dGFjaFkgPSBfYXR0YWNobWVudCRzcGxpdDJbMF07XG4gICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gY2hhbmdlQXR0YWNoWSA9IGF0dGFjaG1lbnQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoX3RoaXMsIHRvKTtcblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nICYmIHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnICYmIHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0b3AgLSAoaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0KSA+PSBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0gJiYgdG9wICsgKGhlaWdodCAqIDIgLSB0YXJnZXRIZWlnaHQpIDw9IGJvdW5kc1szXSkge1xuICAgICAgICAgICAgdG9wICs9IGhlaWdodCAtIHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuICAgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndG9nZXRoZXInKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHBpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGluID0gcGluLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAocGluID09PSB0cnVlKSB7XG4gICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgICB9XG5cbiAgICAgIHBpbiA9IHBpbiB8fCBbXTtcblxuICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuICAgICAgdmFyIG9vYiA9IFtdO1xuXG4gICAgICBpZiAodG9wIDwgYm91bmRzWzFdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1sxXTtcbiAgICAgICAgICBwaW5uZWQucHVzaCgndG9wJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3RvcCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG4gICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdib3R0b20nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdsZWZ0JykgPj0gMCkge1xuICAgICAgICAgIGxlZnQgPSBib3VuZHNbMF07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnbGVmdCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzJdIC0gd2lkdGg7XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLmdldENsYXNzKCdwaW5uZWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuICAgICAgICAgIHBpbm5lZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgb29iQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyk7XG4gICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyArICctJyArIHNpZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ2xlZnQnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChwaW5uZWQuaW5kZXhPZigndG9wJykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCAhPT0gdGFyZ2V0QXR0YWNobWVudC50b3AgfHwgdEF0dGFjaG1lbnQubGVmdCAhPT0gdGFyZ2V0QXR0YWNobWVudC5sZWZ0IHx8IGVBdHRhY2htZW50LnRvcCAhPT0gX3RoaXMuYXR0YWNobWVudC50b3AgfHwgZUF0dGFjaG1lbnQubGVmdCAhPT0gX3RoaXMuYXR0YWNobWVudC5sZWZ0KSB7XG4gICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcbiAgICAgICAgX3RoaXMudHJpZ2dlcigndXBkYXRlJywge1xuICAgICAgICAgIGF0dGFjaG1lbnQ6IGVBdHRhY2htZW50LFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRBdHRhY2htZW50XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gX2NhY2hlLndpZHRoO1xuXG4gICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cbiAgICB2YXIgYm90dG9tID0gdG9wICsgaGVpZ2h0O1xuICAgIHZhciByaWdodCA9IGxlZnQgKyB3aWR0aDtcblxuICAgIHZhciBhYnV0dGVkID0gW107XG4gICAgaWYgKHRvcCA8PSB0YXJnZXRQb3MuYm90dG9tICYmIGJvdHRvbSA+PSB0YXJnZXRQb3MudG9wKSB7XG4gICAgICBbJ2xlZnQnLCAncmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gbGVmdCB8fCB0YXJnZXRQb3NTaWRlID09PSByaWdodCkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG4gICAgICBbJ3RvcCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbXTtcbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcbiAgICBhbGxDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhbGxDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICB9XG5cbiAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgIGFkZENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgfSk7XG5cbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zaGlmdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdDtcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5zaGlmdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuICAgIH1cblxuICAgIHZhciBzaGlmdFRvcCA9IHVuZGVmaW5lZCxcbiAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2Ygc2hpZnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzaGlmdCA9IHNoaWZ0LnNwbGl0KCcgJyk7XG4gICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG4gICAgICB2YXIgX3NoaWZ0ID0gc2hpZnQ7XG5cbiAgICAgIHZhciBfc2hpZnQyID0gX3NsaWNlZFRvQXJyYXkoX3NoaWZ0LCAyKTtcblxuICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuICAgICAgc2hpZnRMZWZ0ID0gX3NoaWZ0MlsxXTtcblxuICAgICAgc2hpZnRUb3AgPSBwYXJzZUZsb2F0KHNoaWZ0VG9wLCAxMCk7XG4gICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGlmdFRvcCA9IHNoaWZ0LnRvcDtcbiAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG4gICAgfVxuXG4gICAgdG9wICs9IHNoaWZ0VG9wO1xuICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG4gICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgfVxufSk7XG5yZXR1cm4gVGV0aGVyO1xuXG59KSk7XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tIFwiLi9nZW9tL1BvaW50XCI7XHJcbmltcG9ydCB7UmVjdH0gZnJvbSBcIi4vZ2VvbS9SZWN0XCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRDZWxsfSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkQ29sdW1ufSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uXCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRNb2RlbH0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsXCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRSb3d9IGZyb20gXCIuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3dcIjtcclxuaW1wb3J0IHtTdHlsZX0gZnJvbSBcIi4vbW9kZWwvc3R5bGVkL1N0eWxlXCI7XHJcbmltcG9ydCB7U3R5bGVkR3JpZENlbGx9IGZyb20gXCIuL21vZGVsL3N0eWxlZC9TdHlsZWRHcmlkQ2VsbFwiO1xyXG5pbXBvcnQge0dyaWRSYW5nZX0gZnJvbSBcIi4vbW9kZWwvR3JpZFJhbmdlXCI7XHJcbmltcG9ydCB7R3JpZEVsZW1lbnR9IGZyb20gXCIuL3VpL0dyaWRFbGVtZW50XCI7XHJcbmltcG9ydCB7R3JpZEtlcm5lbH0gZnJvbSBcIi4vdWkvR3JpZEtlcm5lbFwiO1xyXG5pbXBvcnQge0Fic1dpZGdldEJhc2V9IGZyb20gXCIuL3VpL1dpZGdldFwiO1xyXG5pbXBvcnQge0V2ZW50RW1pdHRlckJhc2V9IGZyb20gXCIuL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlclwiO1xyXG5pbXBvcnQge2NvbW1hbmQsIHZhcmlhYmxlLCByb3V0aW5lLCByZW5kZXJlciwgdmlzdWFsaXplfSBmcm9tIFwiLi91aS9FeHRlbnNpYmlsaXR5XCI7XHJcbmltcG9ydCB7Q2xpcGJvYXJkRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9DbGlwYm9hcmRFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtFZGl0aW5nRXh0ZW5zaW9uLCBHcmlkQ2hhbmdlU2V0fSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7U2Nyb2xsZXJFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7U2VsZWN0b3JFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7SGlzdG9yeUV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9oaXN0b3J5L0hpc3RvcnlFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtEZWZhdWx0SGlzdG9yeU1hbmFnZXJ9IGZyb20gXCIuL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5TWFuYWdlclwiO1xyXG5pbXBvcnQge0NvbXB1dGVFbmdpbmV9IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRW5naW5lXCI7XHJcbmltcG9ydCB7Q29tcHV0ZUV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL0NvbXB1dGVFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZX0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL0phdmFTY3JpcHRDb21wdXRlRW5naW5lXCI7XHJcbmltcG9ydCB7V2F0Y2hNYW5hZ2VyfSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbXB1dGUvV2F0Y2hNYW5hZ2VyXCI7XHJcbmltcG9ydCB7Q2xpY2tab25lRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2V4dHJhL0NsaWNrWm9uZUV4dGVuc2lvblwiO1xyXG5pbXBvcnQge0Jhc2UyNn0gZnJvbSBcIi4vbWlzYy9CYXNlMjZcIjtcclxuXHJcblxyXG4oZnVuY3Rpb24oZXh0OmFueSkge1xyXG5cclxuICAgIGV4dC5DbGlwYm9hcmRFeHRlbnNpb24gPSBDbGlwYm9hcmRFeHRlbnNpb247XHJcbiAgICBleHQuRWRpdGluZ0V4dGVuc2lvbiA9IEVkaXRpbmdFeHRlbnNpb247ICAgIFxyXG4gICAgZXh0LlNjcm9sbGVyRXh0ZW5zaW9uID0gU2Nyb2xsZXJFeHRlbnNpb247XHJcbiAgICBleHQuU2VsZWN0b3JFeHRlbnNpb24gPSBTZWxlY3RvckV4dGVuc2lvbjtcclxuICAgIGV4dC5IaXN0b3J5RXh0ZW5zaW9uID0gSGlzdG9yeUV4dGVuc2lvbjtcclxuICAgIGV4dC5EZWZhdWx0SGlzdG9yeU1hbmFnZXIgPSBEZWZhdWx0SGlzdG9yeU1hbmFnZXI7XHJcbiAgICBleHQuQ29tcHV0ZUV4dGVuc2lvbiA9IENvbXB1dGVFeHRlbnNpb247XHJcbiAgICBleHQuSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUgPSBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZTtcclxuICAgIGV4dC5XYXRjaE1hbmFnZXIgPSBXYXRjaE1hbmFnZXI7XHJcbiAgICBleHQuQ2xpY2tab25lRXh0ZW5zaW9uID0gQ2xpY2tab25lRXh0ZW5zaW9uO1xyXG4gICAgZXh0LlBvaW50ID0gUG9pbnQ7XHJcbiAgICBleHQuUmVjdCA9IFJlY3Q7XHJcbiAgICBleHQuQmFzZTI2ID0gQmFzZTI2O1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkQ2VsbCA9IERlZmF1bHRHcmlkQ2VsbDtcclxuICAgIGV4dC5EZWZhdWx0R3JpZENvbHVtbiA9IERlZmF1bHRHcmlkQ29sdW1uO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkTW9kZWwgPSBEZWZhdWx0R3JpZE1vZGVsO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkUm93ID0gRGVmYXVsdEdyaWRSb3c7XHJcbiAgICBleHQuU3R5bGUgPSBTdHlsZTtcclxuICAgIGV4dC5TdHlsZWRHcmlkQ2VsbCA9IFN0eWxlZEdyaWRDZWxsO1xyXG4gICAgZXh0LkdyaWRDaGFuZ2VTZXQgPSBHcmlkQ2hhbmdlU2V0O1xyXG4gICAgZXh0LkdyaWRSYW5nZSA9IEdyaWRSYW5nZTtcclxuICAgIGV4dC5HcmlkRWxlbWVudCA9IEdyaWRFbGVtZW50O1xyXG4gICAgZXh0LkdyaWRLZXJuZWwgPSBHcmlkS2VybmVsO1xyXG4gICAgZXh0LkFic1dpZGdldEJhc2UgPSBBYnNXaWRnZXRCYXNlO1xyXG4gICAgZXh0LkV2ZW50RW1pdHRlckJhc2UgPSBFdmVudEVtaXR0ZXJCYXNlO1xyXG4gICAgZXh0LmNvbW1hbmQgPSBjb21tYW5kO1xyXG4gICAgZXh0LnZhcmlhYmxlID0gdmFyaWFibGU7XHJcbiAgICBleHQucm91dGluZSA9IHJvdXRpbmU7XHJcbiAgICBleHQucmVuZGVyZXIgPSByZW5kZXJlcjtcclxuICAgIGV4dC52aXN1YWxpemUgPSB2aXN1YWxpemU7XHJcbiAgICBcclxufSkod2luZG93WydjYXR0bGUnXSB8fCAod2luZG93WydjYXR0bGUnXSA9IHt9KSk7IiwiaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFNlbGVjdG9yV2lkZ2V0IH0gZnJvbSAnLi9TZWxlY3RvckV4dGVuc2lvbic7XHJcbmltcG9ydCB7IEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyB2YXJpYWJsZSwgY29tbWFuZCwgcm91dGluZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgeyBDbGlwYm9hcmQgfSBmcm9tICcuLi8uLi92ZW5kb3IvY2xpcGJvYXJkJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgKiBhcyBQYXBhIGZyb20gJ3BhcGFwYXJzZSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuXHJcbi8vSSBrbm93Li4uIDooXHJcbmNvbnN0IE5ld0xpbmUgPSAhIXdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goLy4qW1d3XVtJaV1bTm5dLiovKSA/ICdcXHJcXG4nIDogJ1xcbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpcGJvYXJkRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgY29weUxpc3Q6c3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgY29weVJhbmdlOkdyaWRSYW5nZSA9IEdyaWRSYW5nZS5lbXB0eSgpO1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGNvcHlOZXQ6Q29weU5ldDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX0MnLCAoZTpLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmNvcHlTZWxlY3Rpb24oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMub25XaW5kb3dQYXN0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbk5ldCgpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6YmVnaW5FZGl0JywgKCkgPT4gdGhpcy5yZXNldENvcHkoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IGNhcHR1cmVTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnY2FwdHVyZVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5jb3B5TmV0ID0gQ29weU5ldC5jcmVhdGUobGF5ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgY29weVNlbGVjdGlvbigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQ29weSh0aGlzLnNlbGVjdGlvbik7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgcmVzZXRDb3B5KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9Db3B5KFtdKTtcclxuICAgICAgICB0aGlzLmFsaWduTmV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb0NvcHkoY2VsbHM6c3RyaW5nW10sIGRlbGltaXRlcjpzdHJpbmcgPSAnXFx0Jyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY29weUxpc3QgPSBjZWxscztcclxuICAgICAgICBsZXQgcmFuZ2UgPSB0aGlzLmNvcHlSYW5nZSA9IEdyaWRSYW5nZS5jcmVhdGUodGhpcy5ncmlkLm1vZGVsLCBjZWxscyk7XHJcbiAgICAgICAgbGV0IHRleHQgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCFjZWxscy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHJyID0gcmFuZ2UubHRyWzBdLnJvd1JlZjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlLmx0ci5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjID0gcmFuZ2UubHRyW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJyICE9PSBjLnJvd1JlZilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBOZXdMaW5lO1xyXG4gICAgICAgICAgICAgICAgcnIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBjLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCAocmFuZ2UubHRyLmxlbmd0aCAtIDEpICYmIHJhbmdlLmx0cltpICsgMV0ucm93UmVmID09PSBycilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBkZWxpbWl0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIENsaXBib2FyZC5jb3B5KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZG9QYXN0ZSh0ZXh0OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBmb2N1c2VkQ2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwoc2VsZWN0aW9uWzBdKTtcclxuXHJcbiAgICAgICAgbGV0IHBhcnNlZCA9IFBhcGEucGFyc2UodGV4dCwge1xyXG4gICAgICAgICAgICBkZWxpbWl0ZXI6IHRleHQuaW5kZXhPZignXFx0JykgPj0gMCA/ICdcXHQnIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IHBhcnNlZC5kYXRhLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMSB8fCAoeC5sZW5ndGggPT0gMSAmJiAhIXhbMF0pKTtcclxuICAgICAgICBpZiAoIWRhdGEubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8ubWF4KGRhdGEsIHggPT4geC5sZW5ndGgpLmxlbmd0aDtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IHN0YXJ0VmVjdG9yID0gbmV3IFBvaW50KGZvY3VzZWRDZWxsLmNvbFJlZiwgZm9jdXNlZENlbGwucm93UmVmKTtcclxuICAgICAgICBsZXQgZW5kVmVjdG9yID0gc3RhcnRWZWN0b3IuYWRkKG5ldyBQb2ludCh3aWR0aCwgaGVpZ2h0KSk7XHJcblxyXG4gICAgICAgIGxldCBwYXN0ZVJhbmdlID0gR3JpZFJhbmdlLmNhcHR1cmUoZ3JpZC5tb2RlbCwgc3RhcnRWZWN0b3IsIGVuZFZlY3Rvcik7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VzID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHBhc3RlUmFuZ2UubHRyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHh5ID0gbmV3IFBvaW50KGNlbGwuY29sUmVmLCBjZWxsLnJvd1JlZikuc3VidHJhY3Qoc3RhcnRWZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBkYXRhW3h5LnldW3h5LnhdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgY2hhbmdlcy5wdXQoY2VsbC5yZWYsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3QnLCBwYXN0ZVJhbmdlLmx0ci5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25OZXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgY29weUxpc3QsIGNvcHlOZXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChjb3B5TGlzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBuZXRSZWN0ID0gUmVjdC5mcm9tTWFueShjb3B5TGlzdC5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjb3B5TmV0LmdvdG8obmV0UmVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uV2luZG93UGFzdGUoZTpDbGlwYm9hcmRFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcbiAgICAgICAgd2hpbGUgKCEhYWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoYWUgPT0gdGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGFlID0gYWUucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYWUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9wbGFpbicpO1xyXG4gICAgICAgIGlmICh0ZXh0ICE9PSBudWxsICYmIHRleHQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9QYXN0ZSh0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb3B5TmV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50KTpDb3B5TmV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLW5ldCBncmlkLW5ldC1jb3B5JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb3B5TmV0KHJvb3QpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgU2VsZWN0b3JXaWRnZXQgfSBmcm9tICcuL1NlbGVjdG9yRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyB2YWx1ZXMgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlLCBXaWRnZXQgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5jb25zdCBWZWN0b3JzID0ge1xyXG4gICAgbjogbmV3IFBvaW50KDAsIC0xKSxcclxuICAgIHM6IG5ldyBQb2ludCgwLCAxKSxcclxuICAgIGU6IG5ldyBQb2ludCgxLCAwKSxcclxuICAgIHc6IG5ldyBQb2ludCgtMSwgMCksXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFZGl0RXZlbnRcclxue1xyXG4gICAgY2hhbmdlczpHcmlkQ2hhbmdlW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVNldFZpc2l0b3Jcclxue1xyXG4gICAgKHJlZjpzdHJpbmcsIHZhbDpzdHJpbmcsIGNhc2NhZGVkOmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVNldEl0ZW1cclxue1xyXG4gICAgcmVhZG9ubHkgcmVmOnN0cmluZztcclxuICAgIHJlYWRvbmx5IHZhbHVlOnN0cmluZztcclxuICAgIHJlYWRvbmx5IGNhc2NhZGVkPzpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZENoYW5nZVNldFxyXG57XHJcbiAgICBwcml2YXRlIGRhdGE6T2JqZWN0TWFwPEdyaWRDaGFuZ2VTZXRJdGVtPiA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyBjb250ZW50cygpOkdyaWRDaGFuZ2VTZXRJdGVtW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFsdWVzKHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldChyZWY6c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBsZXQgZW50cnkgPSB0aGlzLmRhdGFbcmVmXTtcclxuICAgICAgICByZXR1cm4gISFlbnRyeSA/IGVudHJ5LnZhbHVlIDogdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwdXQocmVmOnN0cmluZywgdmFsdWU6c3RyaW5nLCBjYXNjYWRlZD86Ym9vbGVhbik6R3JpZENoYW5nZVNldFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGF0YVtyZWZdID0ge1xyXG4gICAgICAgICAgICByZWY6IHJlZixcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBjYXNjYWRlZDogISFjYXNjYWRlZCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVmcygpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXBpbGUobW9kZWw6R3JpZE1vZGVsKTpHcmlkQ2hhbmdlW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50cygpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiAoe1xyXG4gICAgICAgICAgICAgICAgY2VsbDogbW9kZWwuZmluZENlbGwoeC5yZWYpLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHgudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBjYXNjYWRlZDogeC5jYXNjYWRlZCxcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguY2FzY2FkZWQgfHwgIWlzX3JlYWRvbmx5KHguY2VsbCkpXHJcbiAgICAgICAgO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElucHV0V2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuICAgIGZvY3VzKCk6dm9pZDtcclxuICAgIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0aW5nRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgaW5wdXQ6SW5wdXQ7XHJcblxyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFFU0NBUEUnLCAoKSA9PiB0aGlzLmVuZEVkaXQoZmFsc2UpKVxyXG4gICAgICAgICAgICAub24oJyFFTlRFUicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchVEFCJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignVVBfQVJST1cnLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignRE9XTl9BUlJPVycsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCdSSUdIVF9BUlJPVycsICgpID0+IHsgaWYgKCF0aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKTsgfSB9KVxyXG4gICAgICAgICAgICAub24oJ0xFRlRfQVJST1cnLCAoKSA9PiB7IGlmICghdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCkgeyB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudyk7IH0gfSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKHRoaXMuaW5wdXQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoKSA9PiB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gdHJ1ZSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchREVMRVRFJywgKCkgPT4gdGhpcy5lcmFzZSgpKVxyXG4gICAgICAgICAgICAub24oJyFCQUNLU1BBQ0UnLCAoKSA9PiB0aGlzLmJlZ2luRWRpdCgnJykpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdEQkxDTElDSzpQUklNQVJZJywgKCkgPT4gdGhpcy5iZWdpbkVkaXQobnVsbCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdrZXlwcmVzcycsIChlOkdyaWRLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmJlZ2luRWRpdChTdHJpbmcuZnJvbUNoYXJDb2RlKGUuY2hhckNvZGUpKSk7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6ZG9TZWxlY3QnLCAoKSA9PiB0aGlzLmVuZEVkaXQodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHByaW1hcnlTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgncHJpbWFyeVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5pbnB1dCA9IElucHV0LmNyZWF0ZShsYXllcik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBiZWdpbkVkaXQob3ZlcnJpZGU6c3RyaW5nKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHsgaW5wdXQgfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQubW9kZWwuZmluZENlbGwodGhpcy5zZWxlY3Rpb25bMF0pO1xyXG5cclxuICAgICAgICBpZiAoaXNfcmVhZG9ubHkoY2VsbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISFvdmVycmlkZSB8fCBvdmVycmlkZSA9PT0gJycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwob3ZlcnJpZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwoY2VsbC52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnB1dC5nb3RvKHRoaXMucHJpbWFyeVNlbGVjdG9yLnZpZXdSZWN0KTtcclxuICAgICAgICBpbnB1dC5mb2N1cygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVuZEVkaXQoY29tbWl0OmJvb2xlYW4gPSB0cnVlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgeyBncmlkLCBpbnB1dCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBuZXdWYWx1ZSA9IGlucHV0LnZhbCgpO1xyXG5cclxuICAgICAgICBpbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgaW5wdXQudmFsKCcnKTtcclxuICAgICAgICBncmlkLmZvY3VzKCk7XHJcblxyXG4gICAgICAgIGlmIChjb21taXQgJiYgISFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jb21taXRVbmlmb3JtKHNlbGVjdGlvbi5zbGljZSgwLCAxKSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5kRWRpdFRvTmVpZ2hib3IodmVjdG9yOlBvaW50LCBjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5lbmRFZGl0KGNvbW1pdCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ3NlbGVjdE5laWdoYm9yJywgdmVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBlcmFzZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLCAnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb21taXRVbmlmb3JtKGNlbGxzOnN0cmluZ1tdLCB1bmlmb3JtVmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgIGZvciAobGV0IHJlZiBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNoYW5nZXMucHV0KHJlZiwgdW5pZm9ybVZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdChjaGFuZ2VzKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZ3JpZDtcclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgaWYgKGNvbXBpbGVkLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnaW5wdXQnLCB7IGNoYW5nZXM6IGNvbXBpbGVkIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSW5wdXQgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxJbnB1dEVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6SW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgcm9vdC50eXBlID0gJ3RleHQnO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtaW5wdXQnO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgbWFyZ2luOiAnMCcsXHJcbiAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IElucHV0KHJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmdvdG8odmlld1JlY3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0ICsgMn1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wICsgMn1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9jdXMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcm9vdC5mb2N1cygpO1xyXG4gICAgICAgICAgICByb290LnNldFNlbGVjdGlvblJhbmdlKHJvb3QudmFsdWUubGVuZ3RoLCByb290LnZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC52YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNfcmVhZG9ubHkoY2VsbDpHcmlkQ2VsbCk6Ym9vbGVhblxyXG57XHJcbiAgICByZXR1cm4gY2VsbFsncmVhZG9ubHknXSA9PT0gdHJ1ZSB8fCBjZWxsWydtdXRhYmxlJ10gPT09IGZhbHNlO1xyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBQYWRkaW5nIH0gZnJvbSAnLi4vLi4vZ2VvbS9QYWRkaW5nJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JvbGxlckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHdlZGdlOkhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Nyb2xsZXJXaWR0aD86bnVtYmVyKSBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNjcm9sbGVyV2lkdGggPSBjb2FsZXNjZShzY3JvbGxlcldpZHRoLCBkZXRlY3RfbmF0aXZlX3Njcm9sbGVyX3dpZHRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICAvL1NldCBwYWRkaW5nIHJpZ2h0IGFuZCBib3R0b20gdG8gc2Nyb2xsZXIgd2lkdGggdG8gcHJldmVudCBvdmVybGFwXHJcbiAgICAgICAgZ3JpZC5wYWRkaW5nID0gbmV3IFBhZGRpbmcoXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy50b3AsXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy5yaWdodCArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmJvdHRvbSArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmxlZnQpO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5hbGlnbkVsZW1lbnRzKCkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25FbGVtZW50cygpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vU2Nyb2xsZXJFeHRlbnNpb24gaXMgYSBzcGVjaWFsIGNhc2UsIHdlIG5lZWQgdG8gbW9kaWZ5IHRoZSBncmlkIGNvbnRhaW5lciBlbGVtZW50IGluIG9yZGVyXHJcbiAgICAgICAgLy90byByZWxpYWJpbGl0eSBlbmFibGUgYWxsIHNjcm9sbCBpbnRlcmFjdGlvbiB3aXRob3V0IGxvZ3Mgb2YgZW11bGF0aW9uIGFuZCBidWdneSBjcmFwLiAgV2VcclxuICAgICAgICAvL2luamVjdCBhIHdlZGdlIGVsZW1lbnQgdGhhdCBzaW11bGF0ZXMgdGhlIG92ZXJmbG93IGZvciB0aGUgY29udGFpbmVyIHNjcm9sbCBiYXJzIGFuZCB0aGVuXHJcbiAgICAgICAgLy9ob2xkIHRoZSBncmlkIGluIHBsYWNlIHdoaWxlIG1pcnJvcmluZyB0aGUgc2Nyb2xsIHByb3BlcnR5IGFnYWluc3QgdGhlIGNvbnRhaW5lciBzY29ybGwgXHJcbiAgICAgICAgLy9wb3NpdGlvbi4gVnVhbGEhXHJcblxyXG4gICAgICAgIGxldCBjb250YWluZXIgPSB0aGlzLmdyaWQuY29udGFpbmVyO1xyXG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uQ29udGFpbmVyU2Nyb2xsLmJpbmQodGhpcykpO1xyXG4gICAgICAgIERvbS5jc3MoY29udGFpbmVyLCB7XHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB3ZWRnZSA9IHRoaXMud2VkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBEb20uY3NzKHdlZGdlLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgfSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHdlZGdlKTtcclxuXHJcbiAgICAgICAgdGhpcy5hbGlnbkVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbkVsZW1lbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBncmlkID0gdGhpcy5ncmlkO1xyXG4gICAgICAgIGxldCBjb25hdGluZXIgPSBncmlkLmNvbnRhaW5lcjtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhncmlkLnJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6IChncmlkLnNjcm9sbExlZnQpICsgJ3B4JyxcclxuICAgICAgICAgICAgdG9wOiAoZ3JpZC5zY3JvbGxUb3ApICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLndlZGdlLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHtncmlkLnZpcnR1YWxXaWR0aCAtIHRoaXMuc2Nyb2xsZXJXaWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7Z3JpZC52aXJ0dWFsSGVpZ2h0IC0gdGhpcy5zY3JvbGxlcldpZHRofXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxMZWZ0ICE9IGdyaWQuc2Nyb2xsTGVmdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbmF0aW5lci5zY3JvbGxMZWZ0ID0gZ3JpZC5zY3JvbGxMZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxUb3AgIT0gZ3JpZC5zY3JvbGxUb3ApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25hdGluZXIuc2Nyb2xsVG9wID0gZ3JpZC5zY3JvbGxUb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Db250YWluZXJTY3JvbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgbGV0IG1heFNjcm9sbCA9IG5ldyBQb2ludChcclxuICAgICAgICAgICAgZ3JpZC52aXJ0dWFsV2lkdGggLSBncmlkLndpZHRoLFxyXG4gICAgICAgICAgICBncmlkLnZpcnR1YWxIZWlnaHQgLSBncmlkLmhlaWdodCxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBncmlkLnNjcm9sbCA9IG5ldyBQb2ludChncmlkLmNvbnRhaW5lci5zY3JvbGxMZWZ0LCBncmlkLmNvbnRhaW5lci5zY3JvbGxUb3ApXHJcbiAgICAgICAgICAgIC5jbGFtcChQb2ludC5lbXB0eSwgbWF4U2Nyb2xsKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGV0ZWN0X25hdGl2ZV9zY3JvbGxlcl93aWR0aCgpIFxyXG57XHJcbiAgICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XHJcbiAgICBvdXRlci5zdHlsZS53aWR0aCA9IFwiMTAwcHhcIjtcclxuICAgIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9IFwic2Nyb2xsYmFyXCI7IC8vIG5lZWRlZCBmb3IgV2luSlMgYXBwc1xyXG5cclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xyXG5cclxuICAgIHZhciB3aWR0aE5vU2Nyb2xsID0gb3V0ZXIub2Zmc2V0V2lkdGg7XHJcbiAgICAvLyBmb3JjZSBzY3JvbGxiYXJzXHJcbiAgICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9IFwic2Nyb2xsXCI7XHJcblxyXG4gICAgLy8gYWRkIGlubmVyZGl2XHJcbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgaW5uZXIuc3R5bGUud2lkdGggPSBcIjEwMCVcIjtcclxuICAgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTsgICAgICAgIFxyXG5cclxuICAgIHZhciB3aWR0aFdpdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHJcbiAgICAvLyByZW1vdmUgZGl2c1xyXG4gICAgb3V0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdXRlcik7XHJcblxyXG4gICAgcmV0dXJuIHdpZHRoTm9TY3JvbGwgLSB3aWR0aFdpdGhTY3JvbGw7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCwgR3JpZE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQnO1xyXG5pbXBvcnQgeyBXaWRnZXQsIEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5jb25zdCBWZWN0b3JzID0ge1xyXG4gICAgbnc6IG5ldyBQb2ludCgtMSwgLTEpLFxyXG4gICAgbjogbmV3IFBvaW50KDAsIC0xKSxcclxuICAgIG5lOiBuZXcgUG9pbnQoMSwgLTEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgc2U6IG5ldyBQb2ludCgxLCAxKSxcclxuICAgIHM6IG5ldyBQb2ludCgwLCAxKSxcclxuICAgIHN3OiBuZXcgUG9pbnQoLTEsIDEpLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmludGVyZmFjZSBTZWxlY3RHZXN0dXJlXHJcbntcclxuICAgIHN0YXJ0OnN0cmluZztcclxuICAgIGVuZDpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JXaWRnZXQgZXh0ZW5kcyBXaWRnZXRcclxue1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RvckV4dGVuc2lvbkV4cG9ydHNcclxue1xyXG4gICAgY2FuU2VsZWN0OmJvb2xlYW47XHJcblxyXG4gICAgcmVhZG9ubHkgc2VsZWN0aW9uOnN0cmluZ1tdXHJcblxyXG4gICAgcmVhZG9ubHkgcHJpbWFyeVNlbGVjdG9yOlNlbGVjdG9yV2lkZ2V0O1xyXG5cclxuICAgIHJlYWRvbmx5IGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICBzZWxlY3QoY2VsbHM6c3RyaW5nW10sIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0QWxsKCk6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEVkZ2UodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdE5laWdoYm9yKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdG9yRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNlbGVjdEdlc3R1cmU6U2VsZWN0R2VzdHVyZTtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBjYW5TZWxlY3Q6Ym9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3Rpb246c3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignIVRBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchU0hJRlQrVEFCJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFSSUdIVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchTEVGVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignIURPV05fQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrUklHSFRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtMRUZUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrQScsICgpID0+IHRoaXMuc2VsZWN0QWxsKCkpXHJcbiAgICAgICAgICAgIC5vbignIUhPTUUnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0hPTUUnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLm53KSlcclxuICAgICAgICAgICAgLm9uKCchRU5EJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtFTkQnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLnNlKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydC5lbmFibGUoZ3JpZC5yb290KTtcclxuICAgICAgICBNb3VzZUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJ0RPV046U0hJRlQrUFJJTUFSWScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PiB0aGlzLnNlbGVjdExpbmUobmV3IFBvaW50KGUuZ3JpZFgsIGUuZ3JpZFkpKSlcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT4gdGhpcy5iZWdpblNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgKGU6R3JpZE1vdXNlRHJhZ0V2ZW50KSA9PiB0aGlzLnVwZGF0ZVNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgICAgIC5vbignVVA6UFJJTUFSWScsIChlOkdyaWRNb3VzZURyYWdFdmVudCkgPT4gdGhpcy5lbmRTZWxlY3RHZXN0dXJlKC8qZS5ncmlkWCwgZS5ncmlkWSovKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCAoKSA9PiB0aGlzLnJlc2VsZWN0KGZhbHNlKSk7XHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnblNlbGVjdG9ycyhmYWxzZSkpO1xyXG5cclxuICAgICAgICBrZXJuZWwudmFyaWFibGVzLmRlZmluZSgnaXNTZWxlY3RpbmcnLCB7XHJcbiAgICAgICAgICAgIGdldDogKCkgPT4gISF0aGlzLnNlbGVjdEdlc3R1cmVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHJpbWFyeVNlbGVjdG9yID0gU2VsZWN0b3IuY3JlYXRlKGxheWVyLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmNhcHR1cmVTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9TZWxlY3QoY2VsbHMsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIHRoaXMuYWxpZ25TZWxlY3RvcnModHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RBbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLmNlbGxzLm1hcCh4ID0+IHgucmVmKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgeHkgPSB7IHg6IHN0YXJ0Q2VsbC5jb2xSZWYsIHk6IHN0YXJ0Q2VsbC5yb3dSZWYgfSBhcyBQb2ludExpa2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gZ3JpZC5tb2RlbFdpZHRoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gZ3JpZC5tb2RlbEhlaWdodCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDZWxsID0gZ3JpZC5tb2RlbC5sb2NhdGVDZWxsKHh5LngsIHh5LnkpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW3Jlc3VsdENlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgIGxldCBlbXB0eSA9IChjZWxsOkdyaWRDZWxsKSA9PiA8YW55PihjZWxsLnZhbHVlID09PSAnJyAgfHwgY2VsbC52YWx1ZSA9PT0gJzAnIHx8IGNlbGwudmFsdWUgPT09IHVuZGVmaW5lZCB8fCBjZWxsLnZhbHVlID09PSBudWxsKTtcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzdGFydENlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHJlZik7XHJcbiAgICAgICAgICAgIGxldCBjdXJyQ2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihzdGFydENlbGwucmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0Q2VsbCA9IDxHcmlkQ2VsbD5udWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFjdXJyQ2VsbClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYSA9IGN1cnJDZWxsO1xyXG4gICAgICAgICAgICAgICAgbGV0IGIgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3IoYS5yZWYsIHZlY3Rvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFhIHx8ICFiKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdENlbGwgPSAhIWEgPyBhIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW1wdHkoYSkgKyBlbXB0eShiKSA9PSAxKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdENlbGwgPSBlbXB0eShhKSA/IGIgOiBhO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGN1cnJDZWxsID0gYjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtyZXN1bHRDZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0TGluZShncmlkUHQ6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKCFyZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcblxyXG4gICAgICAgIGxldCBzdGFydFB0ID0gZ3JpZC5nZXRDZWxsR3JpZFJlY3QocmVmKS50b3BMZWZ0KCk7XHJcbiAgICAgICAgbGV0IGxpbmVSZWN0ID0gUmVjdC5mcm9tUG9pbnRzKHN0YXJ0UHQsIGdyaWRQdCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KGxpbmVSZWN0KS5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKGNlbGxSZWZzLmluZGV4T2YocmVmKSwgMSk7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHJlZik7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KGNlbGxSZWZzLCBhdXRvU2Nyb2xsKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdE5laWdoYm9yKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihyZWYsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbY2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc2VsZWN0KGF1dG9TY3JvbGw6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZW1haW5pbmcgPSBzZWxlY3Rpb24uZmlsdGVyKHggPT4gISFncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgICAgICBpZiAocmVtYWluaW5nLmxlbmd0aCAhPSBzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3QocmVtYWluaW5nLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWdpblNlbGVjdEdlc3R1cmUoZ3JpZFg6bnVtYmVyLCBncmlkWTpudW1iZXIpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBuZXcgUG9pbnQoZ3JpZFgsIGdyaWRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0ge1xyXG4gICAgICAgICAgICBzdGFydDogY2VsbC5yZWYsXHJcbiAgICAgICAgICAgIGVuZDogY2VsbC5yZWYsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoWyBjZWxsLnJlZiBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVNlbGVjdEdlc3R1cmUoZ3JpZFg6bnVtYmVyLCBncmlkWTpudW1iZXIpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3RHZXN0dXJlIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcHQgPSBuZXcgUG9pbnQoZ3JpZFgsIGdyaWRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IGdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuXHJcbiAgICAgICAgaWYgKCFjZWxsIHx8IHNlbGVjdEdlc3R1cmUuZW5kID09PSBjZWxsLnJlZilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBzZWxlY3RHZXN0dXJlLmVuZCA9IGNlbGwucmVmO1xyXG5cclxuICAgICAgICBsZXQgcmVnaW9uID0gUmVjdC5mcm9tTWFueShbXHJcbiAgICAgICAgICAgIGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHNlbGVjdEdlc3R1cmUuc3RhcnQpLFxyXG4gICAgICAgICAgICBncmlkLmdldENlbGxHcmlkUmVjdChzZWxlY3RHZXN0dXJlLmVuZClcclxuICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgbGV0IGNlbGxSZWZzID0gZ3JpZC5nZXRDZWxsc0luR3JpZFJlY3QocmVnaW9uKVxyXG4gICAgICAgICAgICAubWFwKHggPT54LnJlZik7XHJcblxyXG4gICAgICAgIGlmIChjZWxsUmVmcy5sZW5ndGggPiAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKGNlbGxSZWZzLmluZGV4T2Yoc2VsZWN0R2VzdHVyZS5zdGFydCksIDEpO1xyXG4gICAgICAgICAgICBjZWxsUmVmcy5zcGxpY2UoMCwgMCwgc2VsZWN0R2VzdHVyZS5zdGFydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgY2VsbFJlZnMubGVuZ3RoID09IDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5kU2VsZWN0R2VzdHVyZSgpOnZvaWQgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvU2VsZWN0KGNlbGxzOnN0cmluZ1tdID0gW10sIGF1dG9TY3JvbGw6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY2FuU2VsZWN0KVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChjZWxscy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IGNlbGxzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGF1dG9TY3JvbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBwcmltYXJ5UmVjdCA9IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KGNlbGxzWzBdKTtcclxuICAgICAgICAgICAgICAgIGdyaWQuc2Nyb2xsVG8ocHJpbWFyeVJlY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25TZWxlY3RvcnMoYW5pbWF0ZTpib29sZWFuKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uLCBwcmltYXJ5U2VsZWN0b3IsIGNhcHR1cmVTZWxlY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHJpbWFyeVJlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChzZWxlY3Rpb25bMF0pO1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuZ290byhwcmltYXJ5UmVjdCwgYW5pbWF0ZSk7XHJcblxyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBjYXB0dXJlUmVjdCA9IFJlY3QuZnJvbU1hbnkoc2VsZWN0aW9uLm1hcCh4ID0+IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHgpKSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci5nb3RvKGNhcHR1cmVSZWN0LCBhbmltYXRlKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLnRvZ2dsZShzZWxlY3Rpb24ubGVuZ3RoID4gMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByaW1hcnlTZWxlY3Rvci5oaWRlKCk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTZWxlY3RvciBleHRlbmRzIEFic1dpZGdldEJhc2U8SFRNTERpdkVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCwgcHJpbWFyeTpib29sZWFuID0gZmFsc2UpOlNlbGVjdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLXNlbGVjdG9yICcgKyAocHJpbWFyeSA/ICdncmlkLXNlbGVjdG9yLXByaW1hcnknIDogJycpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFNlbGVjdG9yKHJvb3QpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29tcHV0ZUVuZ2luZSB9IGZyb20gJy4vQ29tcHV0ZUVuZ2luZSc7XHJcbmltcG9ydCB7IEphdmFTY3JpcHRDb21wdXRlRW5naW5lIH0gZnJvbSAnLi9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSc7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuLi9jb21tb24vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBleHRlbmQsIGZsYXR0ZW4sIHppcFBhaXJzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDZWxsV2l0aEZvcm11bGEgZXh0ZW5kcyBHcmlkQ2VsbFxyXG57XHJcbiAgICBmb3JtdWxhOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbXB1dGVFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByb3RlY3RlZCByZWFkb25seSBlbmdpbmU6Q29tcHV0ZUVuZ2luZTtcclxuXHJcbiAgICBwcml2YXRlIG5vQ2FwdHVyZTpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZW5naW5lPzpDb21wdXRlRW5naW5lKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lIHx8IG5ldyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5lbmdpbmUuY29ubmVjdChncmlkKTtcclxuXHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdjb21taXQnLCB0aGlzLmNvbW1pdE92ZXJyaWRlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnYmVnaW5FZGl0JywgdGhpcy5iZWdpbkVkaXRPdmVycmlkZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignaW52YWxpZGF0ZScsIHRoaXMucmVsb2FkLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVsb2FkKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGVuZ2luZSwgZ3JpZCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZW5naW5lLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIGdyaWQubW9kZWwuY2VsbHMpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGZvcm11bGEgPSBjZWxsWydmb3JtdWxhJ10gYXMgc3RyaW5nO1xyXG4gICAgICAgICAgICBpZiAoISFmb3JtdWxhKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUucHJvZ3JhbShjZWxsLnJlZiwgZm9ybXVsYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubm9DYXB0dXJlID0gdHJ1ZTtcclxuICAgICAgICBncmlkLmV4ZWMoJ2NvbW1pdCcsIGVuZ2luZS5jb21wdXRlKCkpO1xyXG4gICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWdpbkVkaXRPdmVycmlkZShvdmVycmlkZTpzdHJpbmcsIGltcGw6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZW5naW5lLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uWzBdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFvdmVycmlkZSAmJiBvdmVycmlkZSAhPT0gJycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvdmVycmlkZSA9IGVuZ2luZS5nZXRGb3JtdWxhKHNlbGVjdGlvblswXSkgfHwgbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbXBsKG92ZXJyaWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbW1pdE92ZXJyaWRlKGNoYW5nZXM6R3JpZENoYW5nZVNldCwgaW1wbDphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBlbmdpbmUsIGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5ub0NhcHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc2NvcGUgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgICAgICBsZXQgY29tcHV0ZUxpc3QgPSBbXSBhcyBzdHJpbmdbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHRtIG9mIGNoYW5nZXMuY29udGVudHMoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHRtLnJlZik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFsncmVhZG9ubHknXSAhPT0gdHJ1ZSAmJiBjZWxsWydtdXRhYmxlJ10gIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0bS52YWx1ZS5sZW5ndGggPiAwICYmIHRtLnZhbHVlWzBdID09PSAnPScpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUucHJvZ3JhbSh0bS5yZWYsIHRtLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNsZWFyKFt0bS5yZWZdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUucHV0KHRtLnJlZiwgdG0udmFsdWUsIHRtLmNhc2NhZGVkKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbXB1dGVMaXN0LnB1c2godG0ucmVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGNvbXB1dGVMaXN0Lmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlcyA9IGVuZ2luZS5jb21wdXRlKGNvbXB1dGVMaXN0LCBzY29wZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaW1wbChjaGFuZ2VzKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uLy4uJztcclxuaW1wb3J0IHsgZXh0ZW5kLCBmbGF0dGVuLCBpbmRleCB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IENvbXB1dGVFbmdpbmUgfSBmcm9tICcuL0NvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IFdhdGNoTWFuYWdlciB9IGZyb20gJy4vV2F0Y2hNYW5hZ2VyJztcclxuXHJcblxyXG5jb25zdCBSZWZFeHRyYWN0ID0gLyg/IS4qWydcImBdKVtBLVphLXpdK1swLTldKzo/KFtBLVphLXpdK1swLTldKyk/L2c7XHJcblxyXG5jb25zdCBTdXBwb3J0RnVuY3Rpb25zID0ge1xyXG4gICAgLy9NYXRoOlxyXG4gICAgYWJzOiBNYXRoLmFicyxcclxuICAgIGFjb3M6IE1hdGguYWNvcyxcclxuICAgIGFzaW46IE1hdGguYXNpbixcclxuICAgIGF0YW46IE1hdGguYXRhbixcclxuICAgIGF0YW4yOiBNYXRoLmF0YW4yLFxyXG4gICAgY2VpbDogTWF0aC5jZWlsLFxyXG4gICAgY29zOiBNYXRoLmNvcyxcclxuICAgIGV4cDogTWF0aC5leHAsXHJcbiAgICBmbG9vcjogTWF0aC5mbG9vcixcclxuICAgIGxvZzogTWF0aC5sb2csXHJcbiAgICBtYXg6IE1hdGgubWF4LFxyXG4gICAgbWluOiBNYXRoLm1pbixcclxuICAgIHBvdzogTWF0aC5wb3csXHJcbiAgICByYW5kb206IE1hdGgucmFuZG9tLFxyXG4gICAgcm91bmQ6IE1hdGgucm91bmQsXHJcbiAgICBzaW46IE1hdGguc2luLFxyXG4gICAgc3FydDogTWF0aC5zcXJ0LFxyXG4gICAgdGFuOiBNYXRoLnRhbixcclxuICAgIC8vQ3VzdG9tOlxyXG4gICAgYXZnOiBmdW5jdGlvbih2YWx1ZXM6bnVtYmVyW10pOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBTdXBwb3J0RnVuY3Rpb25zLnN1bSh2YWx1ZXMpIC8gdmFsdWVzLmxlbmd0aDtcclxuICAgIH0sXHJcbiAgICBzdW06IGZ1bmN0aW9uKHZhbHVlczpudW1iZXJbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZXMucmVkdWNlKCh0LCB4KSA9PiB0ICsgeCwgMCk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb21waWxlZEZvcm11bGFcclxue1xyXG4gICAgKGNoYW5nZVNjb3BlPzpHcmlkQ2hhbmdlU2V0KTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSBpbXBsZW1lbnRzIENvbXB1dGVFbmdpbmVcclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBmb3JtdWxhczpPYmplY3RNYXA8c3RyaW5nPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBjYWNoZTpPYmplY3RNYXA8Q29tcGlsZWRGb3JtdWxhPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSB3YXRjaGVzOldhdGNoTWFuYWdlciA9IG5ldyBXYXRjaE1hbmFnZXIoKTtcclxuICAgIFxyXG4gICAgcHVibGljIGdldEZvcm11bGEoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZvcm11bGFzW2NlbGxSZWZdIHx8IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoY2VsbFJlZnM/OnN0cmluZ1tdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCEhY2VsbFJlZnMgJiYgISFjZWxsUmVmcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjciBvZiBjZWxsUmVmcykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZvcm11bGFzW2NyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2F0Y2hlcy51bndhdGNoKGNyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmZvcm11bGFzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcy5jbGVhcigpOyAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV2YWx1YXRlKGZvcm11bGE6c3RyaW5nLCBjaGFuZ2VTY29wZT86R3JpZENoYW5nZVNldCk6c3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBmdW5jID0gdGhpcy5jb21waWxlKGZvcm11bGEpO1xyXG4gICAgICAgIHJldHVybiAoZnVuYyhjaGFuZ2VTY29wZSB8fCBuZXcgR3JpZENoYW5nZVNldCgpKSB8fCAwKS50b1N0cmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKGNlbGxSZWZzOnN0cmluZ1tdID0gW10sIHNjb3BlOkdyaWRDaGFuZ2VTZXQgPSBuZXcgR3JpZENoYW5nZVNldCgpLCBjYXNjYWRlOmJvb2xlYW4gPSB0cnVlKTpHcmlkQ2hhbmdlU2V0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgZm9ybXVsYXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBsb29rdXAgPSBpbmRleChjZWxsUmVmcywgeCA9PiB4KTtcclxuICAgICAgICBsZXQgdGFyZ2V0cyA9ICghIWNlbGxSZWZzLmxlbmd0aCA/IGNlbGxSZWZzIDogT2JqZWN0LmtleXModGhpcy5mb3JtdWxhcykpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuXHJcbiAgICAgICAgaWYgKGNhc2NhZGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0YXJnZXRzID0gdGhpcy5jYXNjYWRlVGFyZ2V0cyh0YXJnZXRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgdGFyZ2V0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBmb3JtdWxhID0gZm9ybXVsYXNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICBpZiAoZm9ybXVsYSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHRoaXMuZXZhbHVhdGUoZm9ybXVsYSwgc2NvcGUpXHJcbiAgICAgICAgICAgICAgICBzY29wZS5wdXQoY2VsbC5yZWYsIHJlc3VsdCwgIWxvb2t1cFtjZWxsLnJlZl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2NvcGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluc3BlY3QoZm9ybXVsYTpzdHJpbmcpOnN0cmluZ1tdIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBleHBycyA9IFtdIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBudWxsIGFzIFJlZ0V4cEV4ZWNBcnJheTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHJlc3VsdCA9IFJlZkV4dHJhY3QuZXhlYyhmb3JtdWxhKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghcmVzdWx0Lmxlbmd0aClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZXhwcnMucHVzaChyZXN1bHRbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGV4cHJzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm9ncmFtKGNlbGxSZWY6c3RyaW5nLCBmb3JtdWxhOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZm9ybXVsYXNbY2VsbFJlZl0gPSBmb3JtdWxhO1xyXG5cclxuICAgICAgICBsZXQgZXhwcnMgPSB0aGlzLmluc3BlY3QoZm9ybXVsYSk7XHJcbiAgICAgICAgbGV0IGRwblJhbmdlcyA9IGV4cHJzLm1hcCh4ID0+IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLCB4KS5sdHIpO1xyXG4gICAgICAgIGxldCBkcG5zID0gZmxhdHRlbjxHcmlkQ2VsbD4oZHBuUmFuZ2VzKS5tYXAoeCA9PiB4LnJlZik7XHJcblxyXG4gICAgICAgIGlmIChkcG5zLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcy53YXRjaChjZWxsUmVmLCBkcG5zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGNvbXBpbGUoZm9ybXVsYTpzdHJpbmcpOkNvbXBpbGVkRm9ybXVsYVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmQoZm9ybXVsYTpzdHJpbmcsIHJlZjpzdHJpbmcpOm51bWJlciBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm9ybXVsYS5sZW5ndGg7IGkrKykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChmb3JtdWxhW2ldID09IHJlZlswXSkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm11bGEuc3Vic3RyKGksIHJlZi5sZW5ndGgpID09PSByZWYpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5jID0gZm9ybXVsYVtpICsgcmVmLmxlbmd0aF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmMgfHwgIW5jLm1hdGNoKC9cXHcvKSkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1N0b3JlIGtleSBzZXBhcmF0ZWx5IGJlY2F1c2Ugd2UgY2hhbmdlIHRoZSBmb3JtdWxhLi4uXHJcbiAgICAgICAgICAgIGxldCBjYWNoZUtleSA9IGZvcm11bGE7XHJcbiAgICAgICAgICAgIGxldCBmdW5jID0gdGhpcy5jYWNoZVtjYWNoZUtleV0gYXMgQ29tcGlsZWRGb3JtdWxhO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFmdW5jKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXhwcnMgPSB0aGlzLmluc3BlY3QoZm9ybXVsYSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCBvZiBleHBycykgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlkeCA9IGZpbmQoZm9ybXVsYSwgeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm11bGEgPSBmb3JtdWxhLnN1YnN0cmluZygwLCBpZHgpICsgYGV4cHIoJyR7eH0nLCBhcmd1bWVudHNbMV0pYCArIGZvcm11bGEuc3Vic3RyaW5nKGlkeCArIHgubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGZ1bmN0aW9ucyA9IGV4dGVuZCh7fSwgU3VwcG9ydEZ1bmN0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbnMuZXhwciA9IHRoaXMucmVzb2x2ZS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjb2RlID0gYHdpdGggKGFyZ3VtZW50c1swXSkgeyB0cnkgeyByZXR1cm4gKCR7Zm9ybXVsYS5zdWJzdHIoMSl9KTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyByZXR1cm4gMDsgfSB9YC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgZnVuYyA9IHRoaXMuY2FjaGVbY2FjaGVLZXldID0gbmV3IEZ1bmN0aW9uKGNvZGUpLmJpbmQobnVsbCwgZnVuY3Rpb25zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignY29tcGlsZTonLCBlKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihmb3JtdWxhKTtcclxuICAgICAgICAgICAgcmV0dXJuIHggPT4gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGNhc2NhZGVUYXJnZXRzKGNlbGxzOkdyaWRDZWxsW10pOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBmb3JtdWxhcywgd2F0Y2hlcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCBhbHJlYWR5UHVzaGVkID0ge30gYXMgT2JqZWN0TWFwPGJvb2xlYW4+O1xyXG5cclxuICAgICAgICBjb25zdCB2aXNpdCA9IChjZWxsOkdyaWRDZWxsKTp2b2lkID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoYWxyZWFkeVB1c2hlZFtjZWxsLnJlZl0gPT09IHRydWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVwZW5kZW5jaWVzID0gd2F0Y2hlcy5nZXRPYnNlcnZlcnNPZihjZWxsLnJlZilcclxuICAgICAgICAgICAgICAgIC5tYXAoeCA9PiBncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGRjIG9mIGRlcGVuZGVuY2llcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmlzaXQoZGMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmb3JtdWxhc1tjZWxsLnJlZl0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKDAsIDAsIGNlbGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhbHJlYWR5UHVzaGVkW2NlbGwucmVmXSA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICB2aXNpdChjKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBsaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCByZXNvbHZlKGV4cHI6c3RyaW5nLCBjaGFuZ2VTY29wZTpHcmlkQ2hhbmdlU2V0KTpudW1iZXJ8bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICB2YXIgdmFsdWVzID0gR3JpZFJhbmdlXHJcbiAgICAgICAgICAgIC5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLCBleHByKVxyXG4gICAgICAgICAgICAubHRyXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmNvYWxlc2NlRmxvYXQoY2hhbmdlU2NvcGUuZ2V0KHgucmVmKSwgeC52YWx1ZSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA8IDJcclxuICAgICAgICAgICAgPyAodmFsdWVzWzBdIHx8IDApXHJcbiAgICAgICAgICAgIDogdmFsdWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29hbGVzY2VGbG9hdCguLi52YWx1ZXM6c3RyaW5nW10pOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdmFsdWVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodikgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGNsYXNzIFdhdGNoTWFuYWdlclxyXG57XHJcbiAgICBwcml2YXRlIG9ic2VydmluZzpPYmplY3RNYXA8c3RyaW5nW10+ID0ge307XHJcbiAgICBwcml2YXRlIG9ic2VydmVkOk9iamVjdE1hcDxzdHJpbmdbXT4gPSB7fTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub2JzZXJ2aW5nID0ge307XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlZCA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRPYnNlcnZlcnNPZihjZWxsUmVmOnN0cmluZyk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlZFtjZWxsUmVmXSB8fCBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0T2JzZXJ2ZWRCeShjZWxsUmVmOnN0cmluZyk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZpbmdbY2VsbFJlZl0gfHwgW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdhdGNoKG9ic2VydmVyOnN0cmluZywgc3ViamVjdHM6c3RyaW5nW10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXN1YmplY3RzIHx8ICFzdWJqZWN0cy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZpbmdbb2JzZXJ2ZXJdID0gc3ViamVjdHM7XHJcbiAgICAgICAgZm9yIChsZXQgcyBvZiBzdWJqZWN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5vYnNlcnZlZFtzXSB8fCAodGhpcy5vYnNlcnZlZFtzXSA9IFtdKTtcclxuICAgICAgICAgICAgbGlzdC5wdXNoKG9ic2VydmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVud2F0Y2gob2JzZXJ2ZXI6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHN1YmplY3RzID0gdGhpcy5nZXRPYnNlcnZlZEJ5KG9ic2VydmVyKTtcclxuICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZpbmdbb2JzZXJ2ZXJdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzIG9mIHN1YmplY3RzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLm9ic2VydmVkW3NdIHx8IFtdO1xyXG4gICAgICAgICAgICBsZXQgaXggPSBsaXN0LmluZGV4T2Yob2JzZXJ2ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXggPj0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaXgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJ1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEV4dGVuc2lvbiwgR3JpZE1vdXNlRXZlbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCdcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBSZWN0LCBSZWN0TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgQ2xpY2tab25lTW9kZSA9ICdhYnMnfCdhYnMtYWx0J3wncmVsJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpY2tab25lIGV4dGVuZHMgUmVjdExpa2Vcclxue1xyXG4gICAgbW9kZTpDbGlja1pvbmVNb2RlO1xyXG4gICAgdHlwZTpzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDbGlja1pvbmVTZWxlY3Rpb25cclxue1xyXG4gICAgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHpvbmU6Q2xpY2tab25lO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENsaWNrWm9uZU1vdXNlRXZlbnQgZXh0ZW5kcyBHcmlkTW91c2VFdmVudFxyXG57XHJcbiAgICB6b25lOkNsaWNrWm9uZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENsaWNrWm9uZUV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgY3VycmVudDpDbGlja1pvbmVTZWxlY3Rpb247XHJcbiAgICBwcml2YXRlIGxhc3RHcmlkUHQ6UG9pbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgaXNTZWxlY3RpbmcoKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnaXNTZWxlY3RpbmcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5mb3J3YXJkTGF5ZXJFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5mb3J3YXJkTGF5ZXJFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25HbG9iYWxNb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgZ3JpZC5vbignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzd2l0Y2hab25lKGN6czpDbGlja1pvbmVTZWxlY3Rpb24sIHNvdXJjZUV2ZW50Ok1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBsYXllciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGhhc2godGhpcy5jdXJyZW50KSA9PT0gaGFzaChjenMpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmlkLmVtaXQoJ3pvbmVleGl0JywgY3JlYXRlX2V2ZW50KCd6b25lZXhpdCcsIHRoaXMuY3VycmVudCwgc291cmNlRXZlbnQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IGN6cztcclxuXHJcbiAgICAgICAgaWYgKGN6cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxheWVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYWxsJztcclxuICAgICAgICAgICAgZ3JpZC5lbWl0KCd6b25lZW50ZXInLCBjcmVhdGVfZXZlbnQoJ3pvbmVlbnRlcicsIHRoaXMuY3VycmVudCwgc291cmNlRXZlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGF5ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkTGF5ZXJFdmVudChlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBsYXN0R3JpZFB0IH0gPSB0aGlzO1xyXG4gICAgICAgIGVbJ2dyaWRYJ10gPSBsYXN0R3JpZFB0Lng7XHJcbiAgICAgICAgZVsnZ3JpZFknXSA9IGxhc3RHcmlkUHQueTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGUgPSAnem9uZScgKyBlLnR5cGU7XHJcblxyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuICAgICAgICBncmlkLmVtaXQodHlwZSwgY3JlYXRlX2V2ZW50KHR5cGUsIHRoaXMuY3VycmVudCwgZSBhcyBHcmlkTW91c2VFdmVudCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlUHQgPSB0aGlzLmxhc3RHcmlkUHQgPSBuZXcgUG9pbnQoZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQobW91c2VQdCk7XHJcbiAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdmlld1JlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgIGxldCB6b25lcyA9IChjZWxsWyd6b25lcyddIHx8IFtdKSBhcyBDbGlja1pvbmVbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0YXJnZXQgPSB6b25lc1xyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMudGVzdChjZWxsLCB4LCBtb3VzZVB0KSlcclxuICAgICAgICAgICAgICAgIFswXSB8fCBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhdGFyZ2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUoe2NlbGw6IGNlbGwsIHpvbmU6IHRhcmdldH0sIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKG51bGwsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkdsb2JhbE1vdXNlTW92ZShlOk1vdXNlRXZlbnQpOnZvaWQgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCEhdGhpcy5jdXJyZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGdyaWRSZWN0ID0gUmVjdC5mcm9tTGlrZShncmlkLnJvb3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpXHJcbiAgICAgICAgICAgIGxldCBtb3VzZVB0ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFncmlkUmVjdC5jb250YWlucyhtb3VzZVB0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKG51bGwsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIHRlc3QoY2VsbDpHcmlkQ2VsbCwgem9uZTpDbGlja1pvbmUsIHB0OlBvaW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpZXdSZWN0ID0gdGhpcy5ncmlkLmdldENlbGxWaWV3UmVjdChjZWxsLnJlZik7XHJcbiAgICAgICAgbGV0IHpvbmVSZWN0ID0gUmVjdC5mcm9tTGlrZSh6b25lKTtcclxuXHJcbiAgICAgICAgaWYgKHpvbmUubW9kZSA9PT0gJ3JlbCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB6b25lUmVjdCA9IG5ldyBSZWN0KFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3Qud2lkdGggKiAoem9uZVJlY3QubGVmdCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgKiAoem9uZVJlY3QudG9wIC8gMTAwKSxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoICogKHpvbmVSZWN0LndpZHRoIC8gMTAwKSxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LmhlaWdodCAqICh6b25lUmVjdC5oZWlnaHQgLyAxMDApLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoem9uZS5tb2RlID09PSAnYWJzLWFsdCcpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgem9uZVJlY3QgPSBuZXcgUmVjdChcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoIC0gem9uZVJlY3QubGVmdCAtIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LmhlaWdodCAtIHpvbmVSZWN0LnRvcCAtIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgICAgIHpvbmVSZWN0LndpZHRoLFxyXG4gICAgICAgICAgICAgICAgem9uZVJlY3QuaGVpZ2h0LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHpvbmVSZWN0Lm9mZnNldCh2aWV3UmVjdC50b3BMZWZ0KCkpLmNvbnRhaW5zKHB0KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlX2V2ZW50KHR5cGU6c3RyaW5nLCBjenM6Q2xpY2tab25lU2VsZWN0aW9uLCBzb3VyY2U6TW91c2VFdmVudCk6Q2xpY2tab25lTW91c2VFdmVudFxyXG57XHJcbiAgICBsZXQgZXZlbnQgPSA8YW55PihuZXcgTW91c2VFdmVudCh0eXBlLCBzb3VyY2UpKTtcclxuICAgIC8vIGV2ZW50LmdyaWRYID0gc291cmNlLmdyaWRYO1xyXG4gICAgLy8gZXZlbnQuZ3JpZFkgPSBzb3VyY2UuZ3JpZFk7XHJcbiAgICBldmVudC5jZWxsID0gY3pzLmNlbGw7XHJcbiAgICBldmVudC56b25lID0gY3pzLnpvbmU7XHJcbiAgICByZXR1cm4gZXZlbnQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc2goY3pzOkNsaWNrWm9uZVNlbGVjdGlvbik6c3RyaW5nXHJcbntcclxuICAgIGlmICghY3pzKSByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gW2N6cy5jZWxsLnJlZiwgY3pzLnpvbmUubGVmdCwgY3pzLnpvbmUudG9wLCBjenMuem9uZS53aWR0aCwgY3pzLnpvbmUuaGVpZ2h0XVxyXG4gICAgICAgIC5qb2luKCc6Jyk7XHJcbn0iLCJpbXBvcnQgeyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIsIEhpc3RvcnlBY3Rpb24sIEhpc3RvcnlNYW5hZ2VyIH0gZnJvbSAnLi9IaXN0b3J5TWFuYWdlcic7XHJcbmltcG9ydCB7IHppcFBhaXJzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4uL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnXHJcblxyXG5cclxuaW50ZXJmYWNlIENlbGxFZGl0U25hcHNob3Rcclxue1xyXG4gICAgcmVmOnN0cmluZztcclxuICAgIG5ld1ZhbDpzdHJpbmc7XHJcbiAgICBvbGRWYWw6c3RyaW5nO1xyXG4gICAgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIaXN0b3J5RXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIG1hbmFnZXI6SGlzdG9yeU1hbmFnZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBzdXNwZW5kZWQ6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBjYXB0dXJlOk9iamVjdE1hcDxzdHJpbmc+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmFnZXI/Okhpc3RvcnlNYW5hZ2VyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXIgfHwgbmV3IERlZmF1bHRIaXN0b3J5TWFuYWdlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1onLCAoKSA9PiB0aGlzLnVuZG8oKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfWScsICgpID0+IHRoaXMucmVkbygpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsIHRoaXMuYmVmb3JlQ29tbWl0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2FmdGVyOmNvbW1pdCcsIHRoaXMuYWZ0ZXJDb21taXQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSB1bmRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci51bmRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZWRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5yZWRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgnY2xlYXJIaXN0b3J5JylcclxuICAgIHByaXZhdGUgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoJ3N1c3BlbmRIaXN0b3J5JylcclxuICAgIHByaXZhdGUgc3VzcGVuZChmbGFnOmJvb2xlYW4gPSB0cnVlKTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc3VzcGVuZGVkID0gZmxhZztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZm9yZUNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ub0NhcHR1cmUgfHwgdGhpcy5zdXNwZW5kZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IG1vZGVsID0gdGhpcy5ncmlkLm1vZGVsO1xyXG5cclxuICAgICAgICB0aGlzLmNhcHR1cmUgPSB6aXBQYWlycyhcclxuICAgICAgICAgICAgY2hhbmdlcy5yZWZzKCkubWFwKHIgPT4gW3IsIG1vZGVsLmZpbmRDZWxsKHIpLnZhbHVlXSkgXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFmdGVyQ29tbWl0KGNoYW5nZXM6R3JpZENoYW5nZVNldCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm5vQ2FwdHVyZSB8fCAhdGhpcy5jYXB0dXJlIHx8IHRoaXMuc3VzcGVuZGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBzbmFwc2hvdHMgPSB0aGlzLmNyZWF0ZVNuYXBzaG90cyh0aGlzLmNhcHR1cmUsIGNoYW5nZXMpO1xyXG4gICAgICAgIGlmIChzbmFwc2hvdHMubGVuZ3RoKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FwdHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTbmFwc2hvdHMoY2FwdHVyZTpPYmplY3RNYXA8c3RyaW5nPiwgY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTpDZWxsRWRpdFNuYXBzaG90W11cclxuICAgIHtcclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmdyaWQubW9kZWw7XHJcbiAgICAgICAgbGV0IGJhdGNoID0gW10gYXMgQ2VsbEVkaXRTbmFwc2hvdFtdO1xyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUobW9kZWwpO1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbXBpbGVkLmZpbHRlcih4ID0+ICF4LmNhc2NhZGVkKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJhdGNoLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBlbnRyeS5jZWxsLnJlZixcclxuICAgICAgICAgICAgICAgIG5ld1ZhbDogZW50cnkudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWw6IGNhcHR1cmVbZW50cnkuY2VsbC5yZWZdLFxyXG4gICAgICAgICAgICAgICAgY2FzY2FkZWQ6IGVudHJ5LmNhc2NhZGVkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBiYXRjaDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSk6SGlzdG9yeUFjdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFwcGx5OiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNpbGVudENvbW1pdChjcmVhdGVfY2hhbmdlcyhzbmFwc2hvdHMsIHggPT4geC5uZXdWYWwpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcm9sbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2lsZW50Q29tbWl0KGNyZWF0ZV9jaGFuZ2VzKHNuYXBzaG90cywgeCA9PiB4Lm9sZFZhbCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbnZva2VTaWxlbnRDb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGdyaWQuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgbGV0IHJlZnMgPSBjb21waWxlZC5maWx0ZXIoeCA9PiAheC5jYXNjYWRlZCkubWFwKHggPT4geC5jZWxsLnJlZik7XHJcbiAgICAgICAgZ3JpZC5leGVjKCdzZWxlY3QnLCByZWZzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlX2NoYW5nZXMoc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSwgdmFsU2VsZWN0b3I6KHM6Q2VsbEVkaXRTbmFwc2hvdCkgPT4gc3RyaW5nKTpHcmlkQ2hhbmdlU2V0IFxyXG57XHJcbiAgICBsZXQgY2hhbmdlU2V0ID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgIGZvciAobGV0IHMgb2Ygc25hcHNob3RzKVxyXG4gICAge1xyXG4gICAgICAgIGNoYW5nZVNldC5wdXQocy5yZWYsIHZhbFNlbGVjdG9yKHMpLCBzLmNhc2NhZGVkKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGFuZ2VTZXQ7XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSGlzdG9yeUFjdGlvblxyXG57XHJcbiAgICBhcHBseSgpOnZvaWQ7XHJcblxyXG4gICAgcm9sbGJhY2soKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhpc3RvcnlNYW5hZ2VyXHJcbntcclxuICAgIHJlYWRvbmx5IGZ1dHVyZUNvdW50Om51bWJlcjtcclxuXHJcbiAgICByZWFkb25seSBwYXN0Q291bnQ6bnVtYmVyO1xyXG5cclxuICAgIGNsZWFyKCk6dm9pZDtcclxuXHJcbiAgICBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkO1xyXG5cclxuICAgIHJlZG8oKTpib29sZWFuO1xyXG5cclxuICAgIHVuZG8oKTpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyIGltcGxlbWVudHMgSGlzdG9yeU1hbmFnZXJcclxue1xyXG4gICAgcHJpdmF0ZSBmdXR1cmU6SGlzdG9yeUFjdGlvbltdID0gW107XHJcbiAgICBwcml2YXRlIHBhc3Q6SGlzdG9yeUFjdGlvbltdID0gW107XHJcblxyXG4gICAgcHVibGljIGdldCBmdXR1cmVDb3VudCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZ1dHVyZS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBwYXN0Q291bnQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXN0Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHVzaChhY3Rpb246SGlzdG9yeUFjdGlvbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGFzdC5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVkbygpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZnV0dXJlLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmZ1dHVyZS5wb3AoKTtcclxuICAgICAgICBhY3Rpb24uYXBwbHkoKTtcclxuICAgICAgICB0aGlzLnBhc3QucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmRvKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5wYXN0Lmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLnBhc3QucG9wKCk7XHJcbiAgICAgICAgYWN0aW9uLnJvbGxiYWNrKCk7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBQYWRkaW5nIFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBhZGRpbmcoMCwgMCwgMCwgMCk7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmlnaHQ6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJvdHRvbTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IodG9wPzpudW1iZXIsIHJpZ2h0PzpudW1iZXIsIGJvdHRvbT86bnVtYmVyLCBsZWZ0PzpudW1iZXIpIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudG9wID0gY29hbGVzY2UodG9wLCAwKTtcclxuICAgICAgICB0aGlzLnJpZ2h0ID0gY29hbGVzY2UocmlnaHQsIHRoaXMudG9wKTtcclxuICAgICAgICB0aGlzLmJvdHRvbSA9IGNvYWxlc2NlKGJvdHRvbSwgdGhpcy50b3ApO1xyXG4gICAgICAgIHRoaXMubGVmdCA9IGNvYWxlc2NlKGxlZnQsIHRoaXMucmlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaG9yaXpvbnRhbCgpOm51bWJlciBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy5yaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHZlcnRpY2FsKCk6bnVtYmVyIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRvcCArIHRoaXMuYm90dG9tO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbmZsYXRlKGJ5Om51bWJlcik6UGFkZGluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUGFkZGluZyhcclxuICAgICAgICAgICAgdGhpcy50b3AgKyBieSxcclxuICAgICAgICAgICAgdGhpcy5yaWdodCArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmJvdHRvbSArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgKyBieSxcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBvaW50TGlrZSBcclxue1xyXG4gICAgeDpudW1iZXI7XHJcbiAgICB5Om51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQnJvd3NlclBvaW50ID0geyBsZWZ0Om51bWJlcjsgdG9wOm51bWJlcjsgfTtcclxuZXhwb3J0IHR5cGUgUG9pbnRJbnB1dCA9IG51bWJlcltdfFBvaW50fFBvaW50TGlrZXxCcm93c2VyUG9pbnQ7XHJcblxyXG5leHBvcnQgY2xhc3MgUG9pbnQgaW1wbGVtZW50cyBQb2ludExpa2Vcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHg6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSB5Om51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyByYWQyZGVnOm51bWJlciA9IDM2MCAvIChNYXRoLlBJICogMik7XHJcbiAgICBwdWJsaWMgc3RhdGljIGRlZzJyYWQ6bnVtYmVyID0gKE1hdGguUEkgKiAyKSAvIDM2MDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBvaW50KDAsIDApO1xyXG4gICAgcHVibGljIHN0YXRpYyBtYXggPSBuZXcgUG9pbnQoMjE0NzQ4MzY0NywgMjE0NzQ4MzY0Nyk7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1pbiA9IG5ldyBQb2ludCgtMjE0NzQ4MzY0NywgLTIxNDc0ODM2NDcpO1xyXG4gICAgcHVibGljIHN0YXRpYyB1cCA9IG5ldyBQb2ludCgwLCAtMSk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBhdmVyYWdlKHBvaW50czpQb2ludExpa2VbXSk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXBvaW50cy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeCA9IDAsIHkgPSAwO1xyXG5cclxuICAgICAgICBwb2ludHMuZm9yRWFjaChwID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB4ICs9IHAueDtcclxuICAgICAgICAgICAgeSArPSBwLnk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoeCAvIHBvaW50cy5sZW5ndGgsIHkgLyBwb2ludHMubGVuZ3RoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpcmVjdGlvbihmcm9tOlBvaW50SW5wdXQsIHRvOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHRvKS5zdWJ0cmFjdChmcm9tKS5ub3JtYWxpemUoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoc291cmNlOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHNvdXJjZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tQnVmZmVyKGJ1ZmZlcjpudW1iZXJbXSwgaW5kZXg6bnVtYmVyID0gMCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KGJ1ZmZlcltpbmRleF0sIGJ1ZmZlcltpbmRleCArIDFdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4Om51bWJlcnxudW1iZXJbXSwgeT86bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKHhbMF0pO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9ICg8bnVtYmVyPngpO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vcmVnaW9uIEdlb21ldHJ5XHJcblxyXG4gICAgcHVibGljIGFuZ2xlKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnggPCAwKVxyXG4gICAgICAgICAgICA/IDM2MCAtIE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWcgKiAtMVxyXG4gICAgICAgICAgICA6IE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFuZ2xlQWJvdXQodmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocHQuY3Jvc3ModGhpcyksIHB0LmRvdCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyb3NzKHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC55IC0gdGhpcy55ICogcHQueDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzdGFuY2UodG86UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodG8pO1xyXG4gICAgICAgIGxldCBhID0gdGhpcy54IC0gcHQueDtcclxuICAgICAgICBsZXQgYiA9IHRoaXMueSAtIHB0Lnk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChhICogYSArIGIgKiBiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG90KHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC54ICsgdGhpcy55ICogcHQueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbGVuZ3RoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBub3JtYWxpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsZW4gPSB0aGlzLmxlbmd0aCgpO1xyXG4gICAgICAgIGlmIChsZW4gPiAwLjAwMDAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSAvIGxlbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwZXJwKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueSAqIC0xLCB0aGlzLngpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBycGVycCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLnBlcnAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52ZXJzZSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiAtMSwgdGhpcy55ICogLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXZlcnNlKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJvdGF0ZShyYWRpYW5zOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XHJcbiAgICAgICAgbGV0IHNpbiA9IE1hdGguc2luKHJhZGlhbnMpO1xyXG4gICAgICAgIGxldCBueCA9IHRoaXMueCAqIGNvcyAtIHRoaXMueSAqIHNpbjtcclxuICAgICAgICBsZXQgbnkgPSB0aGlzLnkgKiBjb3MgKyB0aGlzLnggKiBzaW47XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQobngsIG55KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIEFyaXRobWV0aWNcclxuXHJcbiAgICBwdWJsaWMgYWRkKHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ2FkZDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICsgcHQueCwgdGhpcy55ICsgcHQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpdmlkZShkaXZpc29yOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAvIGRpdmlzb3IsIHRoaXMueSAvIGRpdmlzb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtdWx0aXBseShtdWx0aXBsZXI6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogbXVsdGlwbGVyLCB0aGlzLnkgKiBtdWx0aXBsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByb3VuZCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJvdW5kKHRoaXMueCksIE1hdGgucm91bmQodGhpcy55KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YnRyYWN0KHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ3N1YnRyYWN0OiBwdCByZXF1aXJlZC4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHB0LnJldmVyc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsYW1wKGxvd2VyOlBvaW50LCB1cHBlcjpQb2ludCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgeCA9IHRoaXMueDtcclxuICAgICAgICBpZiAoeCA8IGxvd2VyLngpIHggPSBsb3dlci54O1xyXG4gICAgICAgIGlmICh4ID4gdXBwZXIueCkgeCA9IHVwcGVyLng7XHJcblxyXG4gICAgICAgIGxldCB5ID0gdGhpcy55O1xyXG4gICAgICAgIGlmICh5IDwgbG93ZXIueSkgeSA9IGxvd2VyLnk7XHJcbiAgICAgICAgaWYgKHkgPiB1cHBlci55KSB5ID0gdXBwZXIueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh4LCB5KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIENvbnZlcnNpb25cclxuXHJcbiAgICBwdWJsaWMgY2xvbmUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjpQb2ludExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBhbm90aGVyLnggJiYgdGhpcy55ID09PSBhbm90aGVyLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvQXJyYXkoKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy54fSwgJHt0aGlzLnl9XWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxufVxyXG5cclxuZnVuY3Rpb24gcHRBcmcodmFsOmFueSk6UG9pbnRcclxue1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCB8fCB2YWwgIT09IHVuZGVmaW5lZClcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gPFBvaW50PnZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLngsIHZhbC55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC5sZWZ0ICE9PSB1bmRlZmluZWQgJiYgdmFsLnRvcCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwubGVmdCwgdmFsLnRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KDxudW1iZXJbXT52YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnbnVtYmVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbn0iLCJpbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlLCBQb2ludElucHV0IH0gZnJvbSAnLi9Qb2ludCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0TGlrZVxyXG57XHJcbiAgICBsZWZ0Om51bWJlcjtcclxuICAgIHRvcDpudW1iZXI7XHJcbiAgICB3aWR0aDpudW1iZXI7XHJcbiAgICBoZWlnaHQ6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5OlJlY3QgPSBuZXcgUmVjdCgwLCAwLCAwLCAwKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21FZGdlcyhsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgcmlnaHQ6bnVtYmVyLCBib3R0b206bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgbGVmdCxcclxuICAgICAgICAgICAgdG9wLFxyXG4gICAgICAgICAgICByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgICAgIGJvdHRvbSAtIHRvcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTGlrZShsaWtlOlJlY3RMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21NYW55KHJlY3RzOlJlY3RbXSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlY3RzLm1hcCh4ID0+IFJlY3QucHJvdG90eXBlLnBvaW50cy5jYWxsKHgpKSk7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50cyguLi5wb2ludHM6UG9pbnRbXSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21Qb2ludEJ1ZmZlcihwb2ludHM6UG9pbnRbXSwgaW5kZXg/Om51bWJlciwgbGVuZ3RoPzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoMCwgbGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgTWF0aC5taW4oLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC55KSksXHJcbiAgICAgICAgICAgIE1hdGgubWF4KC4uLnBvaW50cy5tYXAocCA9PiBwLngpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueSkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlciA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IobGVmdDpudW1iZXIsIHRvcDpudW1iZXIsIHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHJpZ2h0KClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGJvdHRvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbnRlcigpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQgKyAodGhpcy53aWR0aCAvIDIpLCB0aGlzLnRvcCArICh0aGlzLmhlaWdodCAvIDIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9wTGVmdCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9pbnRzKCk6UG9pbnRbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb250YWlucyhpbnB1dDpQb2ludExpa2V8UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoaW5wdXRbJ3gnXSAhPT0gdW5kZWZpbmVkICYmIGlucHV0Wyd5J10gIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IDxQb2ludExpa2U+aW5wdXQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgcHQueCA+PSB0aGlzLmxlZnRcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPj0gdGhpcy50b3BcclxuICAgICAgICAgICAgICAgICYmIHB0LnggPD0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA8PSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZWN0ID0gPFJlY3RMaWtlPmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHJlY3QubGVmdCA+PSB0aGlzLmxlZnQgJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wID49IHRoaXMudG9wICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgKyByZWN0LndpZHRoIDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKHNpemU6UG9pbnRJbnB1dCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IFBvaW50LmNyZWF0ZShzaXplKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQsXHJcbiAgICAgICAgICAgIHRoaXMudG9wLFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgKyBwdC55LFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluZmxhdGUoc2l6ZTpQb2ludElucHV0KTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gUG9pbnQuY3JlYXRlKHNpemUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgdGhpcy5sZWZ0IC0gcHQueCxcclxuICAgICAgICAgICAgdGhpcy50b3AgLSBwdC55LFxyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0ICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5ib3R0b20gKyBwdC55XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2Zmc2V0KGJ5OlBvaW50SW5wdXQpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBQb2ludC5jcmVhdGUoYnkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCArIHB0LngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgcHQueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHRcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnRlcnNlY3RzKHJlY3Q6UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA+IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gdGhpcy50b3BcclxuICAgICAgICAgICAgJiYgcmVjdC5sZWZ0IDwgdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCA8IHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53aWR0aCA+PSAwICYmIHRoaXMuaGVpZ2h0ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4ID0gdGhpcy5sZWZ0O1xyXG4gICAgICAgIHZhciB5ID0gdGhpcy50b3A7XHJcbiAgICAgICAgdmFyIHcgPSB0aGlzLndpZHRoO1xyXG4gICAgICAgIHZhciBoID0gdGhpcy5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICh3IDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gdztcclxuICAgICAgICAgICAgdyA9IE1hdGguYWJzKHcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB5ICs9IGg7XHJcbiAgICAgICAgICAgIGggPSBNYXRoLmFicyhoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYFske3RoaXMubGVmdH0sICR7dGhpcy50b3B9LCAke3RoaXMud2lkdGh9LCAke3RoaXMuaGVpZ2h0fV1gO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudENhbGxiYWNrLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIGltcGxlbWVudHMgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgd3JhcCh0YXJnZXQ6RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyKTpFdmVudEVtaXR0ZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoISF0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD50YXJnZXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDxFdmVudEVtaXR0ZXI+dGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0OkV2ZW50VGFyZ2V0KVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmRpc3BhdGNoRXZlbnQoXHJcbiAgICAgICAgICAgIF8uZXh0ZW5kKG5ldyBFdmVudChldmVudCksIHsgYXJnczogYXJncyB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5sZXQgVHJhY2tlcjpPYmplY3RJbmRleDxib29sZWFuPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlDaGVja1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGluaXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFUcmFja2VyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgVHJhY2tlciA9IHt9O1xyXG5cclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gdHJ1ZSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlOiBLZXlib2FyZEV2ZW50KSA9PiBUcmFja2VyW2Uua2V5Q29kZV0gPSBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZG93bihrZXk6bnVtYmVyKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhVHJhY2tlciAmJiAhIVRyYWNrZXJba2V5XTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpLZXlFeHByZXNzaW9uXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGV4Y2x1c2l2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGtleXMgPSBpbnB1dFxyXG4gICAgICAgICAgICAuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBLZXlzLnBhcnNlKHgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlFeHByZXNzaW9uKGtleXMsIGV4Y2x1c2l2ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGN0cmw6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBhbHQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzaGlmdDpib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtleTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXhjbHVzaXZlOmJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihrZXlzOm51bWJlcltdLCBleGNsdXNpdmU6Ym9vbGVhbilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmV4Y2x1c2l2ZSA9IGV4Y2x1c2l2ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHJsID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5DVFJMKTtcclxuICAgICAgICB0aGlzLmFsdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQUxUKTtcclxuICAgICAgICB0aGlzLnNoaWZ0ID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5TSElGVCk7XHJcbiAgICAgICAgdGhpcy5rZXkgPSBrZXlzLmZpbHRlcih4ID0+IHggIT09IEtleXMuQ1RSTCAmJiB4ICE9PSBLZXlzLkFMVCAmJiB4ICE9PSBLZXlzLlNISUZUKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXRjaGVzKGtleURhdGE6S2V5RXhwcmVzc2lvbnxLZXlib2FyZEV2ZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlFeHByZXNzaW9uKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmwgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmxLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnRLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5Q29kZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgJ0tleUV4cHJlc3Npb24ubWF0Y2hlczogSW52YWxpZCBpbnB1dCc7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBLZXlNYXBwYWJsZSA9IEV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlckJhc2U7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEtleU1hcENhbGxiYWNrXHJcbntcclxuICAgIChlPzpLZXlib2FyZEV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5SW5wdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBmb3IoLi4uZWxtdHM6S2V5TWFwcGFibGVbXSk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEtleUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViczpFdmVudFN1YnNjcmlwdGlvbltdID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXJzOkV2ZW50RW1pdHRlcltdKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihleHByczpzdHJpbmd8c3RyaW5nW10sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpLZXlJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHBycykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbihbPHN0cmluZz5leHByc10sIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJlIG9mIGV4cHJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHNzID0gdGhpcy5lbWl0dGVycy5tYXAoZWUgPT4gdGhpcy5jcmVhdGVMaXN0ZW5lcihcclxuICAgICAgICAgICAgICAgIGVlLFxyXG4gICAgICAgICAgICAgICAgS2V5RXhwcmVzc2lvbi5wYXJzZShyZSksXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpc3RlbmVyKGVlOkV2ZW50RW1pdHRlciwga2U6S2V5RXhwcmVzc2lvbiwgY2FsbGJhY2s6S2V5TWFwQ2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVlLm9uKCdrZXlkb3duJywgKGV2dDpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGtlLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGtlLmV4Y2x1c2l2ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUoa21zOktleU1hcHBhYmxlW10pOkV2ZW50RW1pdHRlcltdXHJcbntcclxuICAgIHJldHVybiA8RXZlbnRFbWl0dGVyW10+a21zXHJcbiAgICAgICAgLm1hcCh4ID0+ICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICAgICAgPyBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD54KVxyXG4gICAgICAgICAgICA6IHhcclxuICAgICAgICApO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5c1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIEJBQ0tTUEFDRSA9IDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFRBQiA9IDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVOVEVSID0gMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNISUZUID0gMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIENUUkwgPSAxNztcclxuICAgIHB1YmxpYyBzdGF0aWMgQUxUID0gMTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBVVNFID0gMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIENBUFNfTE9DSyA9IDIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBFU0NBUEUgPSAyNztcclxuICAgIHB1YmxpYyBzdGF0aWMgU1BBQ0UgPSAzMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9VUCA9IDMzO1xyXG4gICAgcHVibGljIHN0YXRpYyBQQUdFX0RPV04gPSAzNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5EID0gMzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEhPTUUgPSAzNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9BUlJPVyA9IDM3O1xyXG4gICAgcHVibGljIHN0YXRpYyBVUF9BUlJPVyA9IDM4O1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9BUlJPVyA9IDM5O1xyXG4gICAgcHVibGljIHN0YXRpYyBET1dOX0FSUk9XID0gNDA7XHJcbiAgICBwdWJsaWMgc3RhdGljIElOU0VSVCA9IDQ1O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUxFVEUgPSA0NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzAgPSA0ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzEgPSA0OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzIgPSA1MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzMgPSA1MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzQgPSA1MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzUgPSA1MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzYgPSA1NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzcgPSA1NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzggPSA1NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzkgPSA1NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0EgPSA2NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0IgPSA2NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0MgPSA2NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0QgPSA2ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0UgPSA2OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0YgPSA3MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0cgPSA3MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ggPSA3MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0kgPSA3MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ogPSA3NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0sgPSA3NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0wgPSA3NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX00gPSA3NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX04gPSA3ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX08gPSA3OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1AgPSA4MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1EgPSA4MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1IgPSA4MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1MgPSA4MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1QgPSA4NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1UgPSA4NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1YgPSA4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1cgPSA4NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ggPSA4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1kgPSA4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ogPSA5MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9NRVRBID0gOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIFJJR0hUX01FVEEgPSA5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VMRUNUID0gOTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8wID0gOTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8xID0gOTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8yID0gOTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8zID0gOTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF80ID0gMTAwO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNSA9IDEwMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzYgPSAxMDI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF83ID0gMTAzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfOCA9IDEwNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzkgPSAxMDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIE1VTFRJUExZID0gMTA2O1xyXG4gICAgcHVibGljIHN0YXRpYyBBREQgPSAxMDc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNVQlRSQUNUID0gMTA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUNJTUFMID0gMTEwO1xyXG4gICAgcHVibGljIHN0YXRpYyBESVZJREUgPSAxMTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxID0gMTEyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMiA9IDExMztcclxuICAgIHB1YmxpYyBzdGF0aWMgRjMgPSAxMTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY0ID0gMTE1O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNSA9IDExNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjYgPSAxMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY3ID0gMTE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBGOCA9IDExOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjkgPSAxMjA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMCA9IDEyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjExID0gMTIyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTIgPSAxMjM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTV9MT0NLID0gMTQ0O1xyXG4gICAgcHVibGljIHN0YXRpYyBTQ1JPTExfTE9DSyA9IDE0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VNSUNPTE9OID0gMTg2O1xyXG4gICAgcHVibGljIHN0YXRpYyBFUVVBTFMgPSAxODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIENPTU1BID0gMTg4O1xyXG4gICAgcHVibGljIHN0YXRpYyBEQVNIID0gMTg5O1xyXG4gICAgcHVibGljIHN0YXRpYyBQRVJJT0QgPSAxOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEZPUldBUkRfU0xBU0ggPSAxOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEdSQVZFX0FDQ0VOVCA9IDE5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgT1BFTl9CUkFDS0VUID0gMjE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLX1NMQVNIID0gMjIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBDTE9TRV9CUkFDS0VUID0gMjIxO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSU5HTEVfUVVPVEUgPSAyMjI7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcsIHRocm93bk9uRmFpbDpib29sZWFuID0gdHJ1ZSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoIChpbnB1dC50cmltKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLU1BBQ0UnOiByZXR1cm4gS2V5cy5CQUNLU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1RBQic6IHJldHVybiBLZXlzLlRBQjtcclxuICAgICAgICAgICAgY2FzZSAnRU5URVInOiByZXR1cm4gS2V5cy5FTlRFUjtcclxuICAgICAgICAgICAgY2FzZSAnU0hJRlQnOiByZXR1cm4gS2V5cy5TSElGVDtcclxuICAgICAgICAgICAgY2FzZSAnQ1RSTCc6IHJldHVybiBLZXlzLkNUUkw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FMVCc6IHJldHVybiBLZXlzLkFMVDtcclxuICAgICAgICAgICAgY2FzZSAnUEFVU0UnOiByZXR1cm4gS2V5cy5QQVVTRTtcclxuICAgICAgICAgICAgY2FzZSAnQ0FQU19MT0NLJzogcmV0dXJuIEtleXMuQ0FQU19MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdFU0NBUEUnOiByZXR1cm4gS2V5cy5FU0NBUEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NQQUNFJzogcmV0dXJuIEtleXMuU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBR0VfVVAnOiByZXR1cm4gS2V5cy5QQUdFX1VQO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX0RPV04nOiByZXR1cm4gS2V5cy5QQUdFX0RPV047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VORCc6IHJldHVybiBLZXlzLkVORDtcclxuICAgICAgICAgICAgY2FzZSAnSE9NRSc6IHJldHVybiBLZXlzLkhPTUU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfQVJST1cnOiByZXR1cm4gS2V5cy5MRUZUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdVUF9BUlJPVyc6IHJldHVybiBLZXlzLlVQX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdSSUdIVF9BUlJPVyc6IHJldHVybiBLZXlzLlJJR0hUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdET1dOX0FSUk9XJzogcmV0dXJuIEtleXMuRE9XTl9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnSU5TRVJUJzogcmV0dXJuIEtleXMuSU5TRVJUO1xyXG4gICAgICAgICAgICBjYXNlICdERUxFVEUnOiByZXR1cm4gS2V5cy5ERUxFVEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8wJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8xJzogcmV0dXJuIEtleXMuS0VZXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8yJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8zJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV80JzogcmV0dXJuIEtleXMuS0VZXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV81JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV82JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV83JzogcmV0dXJuIEtleXMuS0VZXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV84JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV85JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9BJzogcmV0dXJuIEtleXMuS0VZX0E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9CJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9DJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9EJzogcmV0dXJuIEtleXMuS0VZX0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9FJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9GJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9HJzogcmV0dXJuIEtleXMuS0VZX0c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9IJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9JJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9KJzogcmV0dXJuIEtleXMuS0VZX0o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9LJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9MJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9NJzogcmV0dXJuIEtleXMuS0VZX007XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9OJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9PJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9QJzogcmV0dXJuIEtleXMuS0VZX1A7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9RJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9SJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9TJzogcmV0dXJuIEtleXMuS0VZX1M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9UJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9VJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9WJzogcmV0dXJuIEtleXMuS0VZX1Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9XJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9YJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9ZJzogcmV0dXJuIEtleXMuS0VZX1k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9aJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJzAnOiByZXR1cm4gS2V5cy5LRVlfMDtcclxuICAgICAgICAgICAgY2FzZSAnMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICcyJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJzMnOiByZXR1cm4gS2V5cy5LRVlfMztcclxuICAgICAgICAgICAgY2FzZSAnNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICc1JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJzYnOiByZXR1cm4gS2V5cy5LRVlfNjtcclxuICAgICAgICAgICAgY2FzZSAnNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICc4JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJzknOiByZXR1cm4gS2V5cy5LRVlfOTtcclxuICAgICAgICAgICAgY2FzZSAnQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdCJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gS2V5cy5LRVlfQztcclxuICAgICAgICAgICAgY2FzZSAnRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdFJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YnOiByZXR1cm4gS2V5cy5LRVlfRjtcclxuICAgICAgICAgICAgY2FzZSAnRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdIJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0knOiByZXR1cm4gS2V5cy5LRVlfSTtcclxuICAgICAgICAgICAgY2FzZSAnSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0wnOiByZXR1cm4gS2V5cy5LRVlfTDtcclxuICAgICAgICAgICAgY2FzZSAnTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdOJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ08nOiByZXR1cm4gS2V5cy5LRVlfTztcclxuICAgICAgICAgICAgY2FzZSAnUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdRJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ1InOiByZXR1cm4gS2V5cy5LRVlfUjtcclxuICAgICAgICAgICAgY2FzZSAnUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdUJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gS2V5cy5LRVlfVTtcclxuICAgICAgICAgICAgY2FzZSAnVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdXJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1gnOiByZXR1cm4gS2V5cy5LRVlfWDtcclxuICAgICAgICAgICAgY2FzZSAnWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdaJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfTUVUQSc6IHJldHVybiBLZXlzLkxFRlRfTUVUQTtcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfTUVUQSc6IHJldHVybiBLZXlzLlJJR0hUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NFTEVDVCc6IHJldHVybiBLZXlzLlNFTEVDVDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzAnOiByZXR1cm4gS2V5cy5OVU1QQURfMDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzEnOiByZXR1cm4gS2V5cy5OVU1QQURfMTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzInOiByZXR1cm4gS2V5cy5OVU1QQURfMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzMnOiByZXR1cm4gS2V5cy5OVU1QQURfMztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzQnOiByZXR1cm4gS2V5cy5OVU1QQURfNDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzUnOiByZXR1cm4gS2V5cy5OVU1QQURfNTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzYnOiByZXR1cm4gS2V5cy5OVU1QQURfNjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzcnOiByZXR1cm4gS2V5cy5OVU1QQURfNztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzgnOiByZXR1cm4gS2V5cy5OVU1QQURfODtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzknOiByZXR1cm4gS2V5cy5OVU1QQURfOTtcclxuICAgICAgICAgICAgY2FzZSAnTVVMVElQTFknOiByZXR1cm4gS2V5cy5NVUxUSVBMWTtcclxuICAgICAgICAgICAgY2FzZSAnQUREJzogcmV0dXJuIEtleXMuQUREO1xyXG4gICAgICAgICAgICBjYXNlICdTVUJUUkFDVCc6IHJldHVybiBLZXlzLlNVQlRSQUNUO1xyXG4gICAgICAgICAgICBjYXNlICdERUNJTUFMJzogcmV0dXJuIEtleXMuREVDSU1BTDtcclxuICAgICAgICAgICAgY2FzZSAnRElWSURFJzogcmV0dXJuIEtleXMuRElWSURFO1xyXG4gICAgICAgICAgICBjYXNlICdGMSc6IHJldHVybiBLZXlzLkYxO1xyXG4gICAgICAgICAgICBjYXNlICdGMic6IHJldHVybiBLZXlzLkYyO1xyXG4gICAgICAgICAgICBjYXNlICdGMyc6IHJldHVybiBLZXlzLkYzO1xyXG4gICAgICAgICAgICBjYXNlICdGNCc6IHJldHVybiBLZXlzLkY0O1xyXG4gICAgICAgICAgICBjYXNlICdGNSc6IHJldHVybiBLZXlzLkY1O1xyXG4gICAgICAgICAgICBjYXNlICdGNic6IHJldHVybiBLZXlzLkY2O1xyXG4gICAgICAgICAgICBjYXNlICdGNyc6IHJldHVybiBLZXlzLkY3O1xyXG4gICAgICAgICAgICBjYXNlICdGOCc6IHJldHVybiBLZXlzLkY4O1xyXG4gICAgICAgICAgICBjYXNlICdGOSc6IHJldHVybiBLZXlzLkY5O1xyXG4gICAgICAgICAgICBjYXNlICdGMTAnOiByZXR1cm4gS2V5cy5GMTA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMSc6IHJldHVybiBLZXlzLkYxMTtcclxuICAgICAgICAgICAgY2FzZSAnRjEyJzogcmV0dXJuIEtleXMuRjEyO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1fTE9DSyc6IHJldHVybiBLZXlzLk5VTV9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTQ1JPTExfTE9DSyc6IHJldHVybiBLZXlzLlNDUk9MTF9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTRU1JQ09MT04nOiByZXR1cm4gS2V5cy5TRU1JQ09MT047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VRVUFMUyc6IHJldHVybiBLZXlzLkVRVUFMUztcclxuICAgICAgICAgICAgY2FzZSAnQ09NTUEnOiByZXR1cm4gS2V5cy5DT01NQTtcclxuICAgICAgICAgICAgY2FzZSAnREFTSCc6IHJldHVybiBLZXlzLkRBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BFUklPRCc6IHJldHVybiBLZXlzLlBFUklPRDtcclxuICAgICAgICAgICAgY2FzZSAnRk9SV0FSRF9TTEFTSCc6IHJldHVybiBLZXlzLkZPUldBUkRfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0dSQVZFX0FDQ0VOVCc6IHJldHVybiBLZXlzLkdSQVZFX0FDQ0VOVDtcclxuICAgICAgICAgICAgY2FzZSAnT1BFTl9CUkFDS0VUJzogcmV0dXJuIEtleXMuT1BFTl9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLX1NMQVNIJzogcmV0dXJuIEtleXMuQkFDS19TTEFTSDtcclxuICAgICAgICAgICAgY2FzZSAnQ0xPU0VfQlJBQ0tFVCc6IHJldHVybiBLZXlzLkNMT1NFX0JSQUNLRVQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NJTkdMRV9RVU9URSc6IHJldHVybiBLZXlzLlNJTkdMRV9RVU9URTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd25PbkZhaWwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQga2V5OiAnICsgaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50JztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY2hlY2soZWxtdDpIVE1MRWxlbWVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlbG10LmRhdGFzZXRbJ01vdXNlRHJhZ0V2ZW50U3VwcG9ydCddID09PSAndHJ1ZSc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmFibGUoZWxtdDpIVE1MRWxlbWVudCk6TW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbiAgICB7XHJcbiAgICAgICAgZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9ICd0cnVlJztcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydChlbG10KTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgc2hvdWxkRHJhZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgaXNEcmFnZ2luZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgc3RhcnRQb2ludDpQb2ludDtcclxuICAgIHByb3RlY3RlZCBsYXN0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgY2FuY2VsOigpID0+IHZvaWQ7XHJcbiAgICBwcm90ZWN0ZWQgbGlzdGVuZXI6YW55O1xyXG5cclxuICAgIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgZWxtdDpIVE1MRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVsbXQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5saXN0ZW5lciA9IHRoaXMub25UYXJnZXRNb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvblRhcmdldE1vdXNlRG93bihlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gdGhpcy5sYXN0UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBsZXQgbW92ZUhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VNb3ZlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgbGV0IHVwSGFuZGxlciA9IHRoaXMub25XaW5kb3dNb3VzZVVwLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FuY2VsID0gKCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGxldCBuZXdQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNob3VsZERyYWcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2JlZ2luJywgZSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWcnLCBlLCBuZXdQb2ludC5zdWJ0cmFjdCh0aGlzLmxhc3RQb2ludCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0UG9pbnQgPSBuZXdQb2ludDtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZVVwKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2VuZCcsIGUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FuY2VsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFdmVudCh0eXBlOnN0cmluZywgc291cmNlOk1vdXNlRXZlbnQsIGRpc3Q/OlBvaW50KTpNb3VzZURyYWdFdmVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBldmVudCA9IDxNb3VzZURyYWdFdmVudD4obmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRYID0gdGhpcy5zdGFydFBvaW50Lng7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRZID0gdGhpcy5zdGFydFBvaW50Lnk7XHJcblxyXG4gICAgICAgIGlmIChkaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXZlbnQuZGlzdFggPSBkaXN0Lng7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RZID0gZGlzdC55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgS2V5cyB9IGZyb20gJy4vS2V5cyc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgS2V5Q2hlY2sgfSBmcm9tICcuL0tleUNoZWNrJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBNb3VzZUV2ZW50VHlwZSA9ICdjbGljayd8J2RibGNsaWNrJ3wnbW91c2Vkb3duJ3wnbW91c2Vtb3ZlJ3wnbW91c2V1cCd8J2RyYWdiZWdpbid8J2RyYWcnfCdkcmFnZW5kJ1xyXG5cclxuZnVuY3Rpb24gcGFyc2VfZXZlbnQodmFsdWU6c3RyaW5nKTpNb3VzZUV2ZW50VHlwZVxyXG57XHJcbiAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGNhc2UgJ2Rvd24nOlxyXG4gICAgICAgIGNhc2UgJ21vdmUnOlxyXG4gICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxNb3VzZUV2ZW50VHlwZT4oJ21vdXNlJyArIHZhbHVlKTtcclxuICAgICAgICBjYXNlICdjbGljayc6XHJcbiAgICAgICAgY2FzZSAnZGJsY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2Rvd24nOlxyXG4gICAgICAgIGNhc2UgJ21vdmUnOlxyXG4gICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICBjYXNlICdkcmFnYmVnaW4nOlxyXG4gICAgICAgIGNhc2UgJ2RyYWcnOlxyXG4gICAgICAgIGNhc2UgJ2RyYWdlbmQnOlxyXG4gICAgICAgICAgICByZXR1cm4gPE1vdXNlRXZlbnRUeXBlPnZhbHVlO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlRXZlbnRUeXBlOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlX2J1dHRvbih2YWx1ZTpzdHJpbmcpOm51bWJlclxyXG57XHJcbiAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGNhc2UgJ3ByaW1hcnknOlxyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjEnOlxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICBjYXNlICdzZWNvbmRhcnknOlxyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjInOlxyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICBjYXNlICdidXR0b24zJzpcclxuICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgTW91c2VCdXR0b246ICcgKyB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aWRlX2V4cHJlc3Npb24odmFsdWU6c3RyaW5nKTpzdHJpbmdbXVxyXG57XHJcbiAgICBsZXQgcGFydHMgPSB2YWx1ZS5zcGxpdCgnOicpO1xyXG5cclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPT0gMSlcclxuICAgIHtcclxuICAgICAgICBwYXJ0cy5zcGxpY2UoMCwgMCwgJ2Rvd24nKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFydHMuc2xpY2UoMCwgMik7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZUV4cHJlc3Npb25cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcpOk1vdXNlRXhwcmVzc2lvblxyXG4gICAge1xyXG4gICAgICAgIGxldCBjZmcgPSA8YW55PntcclxuICAgICAgICAgICAga2V5czogW10sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2ZnLmV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGNmZy5leGNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBbbGVmdCwgcmlnaHRdID0gZGl2aWRlX2V4cHJlc3Npb24oaW5wdXQpO1xyXG5cclxuICAgICAgICBjZmcuZXZlbnQgPSBwYXJzZV9ldmVudChsZWZ0KTtcclxuXHJcbiAgICAgICAgcmlnaHQuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKHggPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IEtleXMucGFyc2UoeCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZmcua2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmJ1dHRvbiA9IHBhcnNlX2J1dHRvbih4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VFeHByZXNzaW9uKGNmZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGV2ZW50Ok1vdXNlRXZlbnRUeXBlID0gbnVsbDtcclxuICAgIHB1YmxpYyByZWFkb25seSBidXR0b246bnVtYmVyID0gbnVsbDtcclxuICAgIHB1YmxpYyByZWFkb25seSBrZXlzOm51bWJlcltdID0gW107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXhjbHVzaXZlOmJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKGNmZzphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgY2ZnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlcyhtb3VzZURhdGE6TW91c2VFdmVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICE9PSBtb3VzZURhdGEudHlwZSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5idXR0b24gIT09IG51bGwgJiYgdGhpcy5idXR0b24gIT09IG1vdXNlRGF0YS5idXR0b24pXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgayBvZiB0aGlzLmtleXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIUtleUNoZWNrLmRvd24oaykpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEV2ZW50RW1pdHRlciwgRXZlbnRFbWl0dGVyQmFzZSwgRXZlbnRTdWJzY3JpcHRpb24gfSBmcm9tICcuLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuaW1wb3J0IHsgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIH0gZnJvbSAnLi9FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXInO1xyXG5pbXBvcnQgeyBNb3VzZUV4cHJlc3Npb24gfSBmcm9tICcuL01vdXNlRXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydCB9IGZyb20gJy4vTW91c2VEcmFnRXZlbnRTdXBwb3J0JztcclxuaW1wb3J0IHsgS2V5Q2hlY2sgfSBmcm9tICcuL0tleUNoZWNrJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBNYXBwYWJsZSA9IEV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlckJhc2U7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1vdXNlQ2FsbGJhY2tcclxue1xyXG4gICAgKGU6RXZlbnQpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZUlucHV0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZm9yKC4uLmVsbXRzOk1hcHBhYmxlW10pOk1vdXNlSW5wdXRcclxuICAgIHtcclxuICAgICAgICBLZXlDaGVjay5pbml0KCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViczpFdmVudFN1YnNjcmlwdGlvbltdID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXJzOkV2ZW50RW1pdHRlcltdKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihleHByOnN0cmluZywgY2FsbGJhY2s6TW91c2VDYWxsYmFjayk6TW91c2VJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGxldCBzcyA9IHRoaXMuZW1pdHRlcnMubWFwKGVlID0+IHRoaXMuY3JlYXRlTGlzdGVuZXIoXHJcbiAgICAgICAgICAgIGVlLFxyXG4gICAgICAgICAgICBNb3VzZUV4cHJlc3Npb24ucGFyc2UoZXhwciksXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKSk7XHJcblxyXG4gICAgICAgIHRoaXMuc3VicyA9IHRoaXMuc3Vicy5jb25jYXQoc3MpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpc3RlbmVyKHRhcmdldDpFdmVudEVtaXR0ZXIsIGV4cHI6TW91c2VFeHByZXNzaW9uLCBjYWxsYmFjazpNb3VzZUNhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0YXJnZXQub24oZXhwci5ldmVudCwgKGV2dDpNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGV4cHIubWF0Y2hlcyhldnQpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXhwci5leGNsdXNpdmUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplKGttczpNYXBwYWJsZVtdKTpFdmVudEVtaXR0ZXJbXVxyXG57XHJcbiAgICByZXR1cm4gPEV2ZW50RW1pdHRlcltdPmttc1xyXG4gICAgICAgIC5tYXAoeCA9PiAoISF4WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAgICAgID8gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+eClcclxuICAgICAgICAgICAgOiB4XHJcbiAgICAgICAgKTtcclxufVxyXG5cclxuIiwiaW1wb3J0ICogYXMgYmFzZXMgZnJvbSAnYmFzZXMnO1xyXG5cclxuXHJcbmNvbnN0IEFscGhhMjYgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2UyNlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIG51bShudW06bnVtYmVyKTpCYXNlMjYgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCYXNlMjYobnVtLCBiYXNlcy50b0FscGhhYmV0KG51bSwgQWxwaGEyNikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc3RyKHN0cjpzdHJpbmcpOkJhc2UyNiBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJhc2UyNihiYXNlcy5mcm9tQWxwaGFiZXQoc3RyLnRvVXBwZXJDYXNlKCksIEFscGhhMjYpLCBzdHIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBudW06bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHN0cjpzdHJpbmc7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihudW06bnVtYmVyLCBzdHI6c3RyaW5nKSBcclxuICAgIHtcclxuICAgICAgICB0aGlzLm51bSA9IG51bTtcclxuICAgICAgICB0aGlzLnN0ciA9IHN0cjtcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKGh0bWw6c3RyaW5nKTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICBsZXQgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIGxldCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9keScpO1xyXG4gICAgZnJhZy5hcHBlbmRDaGlsZChib2R5KTtcclxuICAgIGJvZHkuaW5uZXJIVE1MID0gaHRtbDtcclxuXHJcbiAgICByZXR1cm4gPEhUTUxFbGVtZW50PmJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjc3MoZTpIVE1MRWxlbWVudCwgc3R5bGVzOk9iamVjdE1hcDxzdHJpbmc+KTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICBmb3IgKGxldCBwcm9wIGluIHN0eWxlcylcclxuICAgIHtcclxuICAgICAgICBlLnN0eWxlW3Byb3BdID0gc3R5bGVzW3Byb3BdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZml0KGU6SFRNTEVsZW1lbnQsIHRhcmdldDpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7XHJcbiAgICAgICAgd2lkdGg6IHRhcmdldC5jbGllbnRXaWR0aCArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JyxcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGlkZShlOkhUTUxFbGVtZW50KTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gY3NzKGUsIHsgZGlzcGxheTogJ25vbmUnIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvdyhlOkhUTUxFbGVtZW50KTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gY3NzKGUsIHsgZGlzcGxheTogJ2Jsb2NrJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZShlOkhUTUxFbGVtZW50LCB2aXNpYmxlOmJvb2xlYW4pOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiB2aXNpYmxlID8gc2hvdyhlKSA6IGhpZGUoZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaW5nbGVUcmFuc2l0aW9uKGU6SFRNTEVsZW1lbnQsIHByb3A6c3RyaW5nLCBtaWxsaXM6bnVtYmVyLCBlYXNlOnN0cmluZyA9ICdsaW5lYXInKTp2b2lkXHJcbntcclxuICAgIGUuc3R5bGUudHJhbnNpdGlvbiA9IGAke3Byb3B9ICR7bWlsbGlzfW1zICR7ZWFzZX1gO1xyXG4gICAgY29uc29sZS5sb2coZS5zdHlsZS50cmFuc2l0aW9uKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gZS5zdHlsZS50cmFuc2l0aW9uID0gJycsIG1pbGxpcyk7XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIFByb3BlcnR5Q2hhbmdlZENhbGxiYWNrXHJcbntcclxuICAgIChvYmo6YW55LCB2YWw6YW55KTp2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShkZWZhdWx0VmFsdWU6YW55LCBmaWx0ZXI6UHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2spXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOmFueSwgcHJvcE5hbWU6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIHByb3BOYW1lLCB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsID0gdGhpc1snX18nICsgcHJvcE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCkgPyBkZWZhdWx0VmFsdWUgOiB2YWw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24obmV3VmFsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wTmFtZV0gPSBuZXdWYWw7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIodGhpcywgbmV3VmFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiXHJcblxyXG5sZXQgc3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKS50b1N0cmluZygpO1xyXG5sZXQgY291bnQgPSAwO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlZkdlblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIG5leHQocHJlZml4OnN0cmluZyA9ICdDJyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHByZWZpeCArIHN0YXJ0ICsgJy0nICsgKGNvdW50KyspO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvYWxlc2NlPFQ+KC4uLmlucHV0czpUW10pOlRcclxue1xyXG4gICAgZm9yIChsZXQgeCBvZiBpbnB1dHMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHggIT09IHVuZGVmaW5lZCAmJiB4ICE9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQodGFyZ2V0OmFueSwgZGF0YTphbnkpOmFueVxyXG57XHJcbiAgICBmb3IgKGxldCBrIGluIGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0W2tdID0gZGF0YVtrXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXg8VD4oYXJyOlRbXSwgaW5kZXhlcjoodG06VCkgPT4gbnVtYmVyfHN0cmluZyk6T2JqZWN0TWFwPFQ+XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCB0bSBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW2luZGV4ZXIodG0pXSA9IHRtO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuPFQ+KGFhOmFueSk6VFtdIFxyXG57XHJcbiAgICBsZXQgYSA9IFtdIGFzIGFueTtcclxuICAgIGZvciAobGV0IHRtIG9mIGFhKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0bSkpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYSA9IGEuY29uY2F0KGZsYXR0ZW4odG0pKTtcclxuICAgICAgICB9IGVsc2UgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhLnB1c2godG0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEgYXMgVFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24ga2V5czxUPihpeDpPYmplY3RJbmRleDxUPnxPYmplY3RNYXA8VD4pOnN0cmluZ1tdXHJcbntcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhpeCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWx1ZXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpUW11cclxue1xyXG4gICAgbGV0IGE6VFtdID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgayBpbiBpeClcclxuICAgIHtcclxuICAgICAgICBhLnB1c2goaXhba10pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gemlwUGFpcnMocGFpcnM6YW55W11bXSk6YW55XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCBwYWlyIG9mIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIG9ialtwYWlyWzBdXSA9IHBhaXJbMV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuemlwUGFpcnMocGFpcnM6YW55KTphbnlbXVtdXHJcbntcclxuICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBrZXkgaW4gcGFpcnMpXHJcbiAgICB7XHJcbiAgICAgICAgYXJyLnB1c2goW2tleSwgcGFpcnNba2V5XV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXg8VD4oYXJyOlRbXSwgc2VsZWN0b3I6KHQ6VCkgPT4gbnVtYmVyKTpUXHJcbntcclxuICAgIGlmIChhcnIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIGxldCB0ID0gYXJyWzBdO1xyXG5cclxuICAgIGZvciAobGV0IHggb2YgYXJyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChzZWxlY3Rvcih0KSA8IHNlbGVjdG9yKHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdCA9IHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hhZG93Q2xvbmUodGFyZ2V0OmFueSk6YW55XHJcbntcclxuICAgIGlmICh0eXBlb2YodGFyZ2V0KSA9PT0gJ29iamVjdCcpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHNjID0ge30gYXMgYW55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRhcmdldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNjW3Byb3BdID0gc2hhZG93Q2xvbmUodGFyZ2V0W3Byb3BdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzYztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59IiwiaW1wb3J0IHsgQmFzZTI2IH0gZnJvbSAnLi4vbWlzYy9CYXNlMjYnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4vR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlc2NyaWJlcyBhIHJlc29sdmVFeHByIG9mIGdyaWQgY2VsbHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZFJhbmdlXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyBHcmlkUmFuZ2Ugb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNlbGxzIHdpdGggdGhlIHNwZWNpZmllZCByZWZzIGZyb20gdGhlXHJcbiAgICAgKiBzcGVjaWZpZWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gY2VsbFJlZnNcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUobW9kZWw6R3JpZE1vZGVsLCBjZWxsUmVmczpzdHJpbmdbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IF8uaW5kZXgoY2VsbFJlZnMsIHggPT4geCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBtb2RlbC5jZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghbG9va3VwW2MucmVmXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY2VsbHMucHVzaChjKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgIGxldCB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FwdHVyZXMgYSByYW5nZSBvZiBjZWxscyBmcm9tIHRoZSBzcGVjaWZpZWQgbW9kZWwgYmFzZWQgb24gdGhlIHNwZWNpZmllZCB2ZWN0b3JzLiAgVGhlIHZlY3RvcnMgc2hvdWxkIGJlXHJcbiAgICAgKiB0d28gcG9pbnRzIGluIGdyaWQgY29vcmRpbmF0ZXMgKGUuZy4gY29sIGFuZCByb3cgcmVmZXJlbmNlcykgdGhhdCBkcmF3IGEgbG9naWNhbCBsaW5lIGFjcm9zcyB0aGUgZ3JpZC5cclxuICAgICAqIEFueSBjZWxscyBmYWxsaW5nIGludG8gdGhlIHJlY3RhbmdsZSBjcmVhdGVkIGZyb20gdGhlc2UgdHdvIHBvaW50cyB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBzZWxlY3RlZCByZXNvbHZlRXhwci5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBmcm9tXHJcbiAgICAgKiBAcGFyYW0gdG9cclxuICAgICAqIEBwYXJhbSB0b0luY2x1c2l2ZVxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNhcHR1cmUobW9kZWw6R3JpZE1vZGVsLCBmcm9tOlBvaW50LCB0bzpQb2ludCwgdG9JbmNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICAvL1RPRE86IEV4cGxhaW4gdGhpcy4uLlxyXG4gICAgICAgIGxldCB0bCA9IG5ldyBQb2ludChmcm9tLnggPCB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55IDwgdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG4gICAgICAgIGxldCBiciA9IG5ldyBQb2ludChmcm9tLnggPiB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55ID4gdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG5cclxuICAgICAgICBpZiAodG9JbmNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiciA9IGJyLmFkZCgxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaW1zID0gUmVjdC5mcm9tUG9pbnRzKHRsLCBicik7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCByID0gZGltcy50b3A7IHIgPCBkaW1zLmJvdHRvbTsgcisrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYyA9IGRpbXMubGVmdDsgYyA8IGRpbXMucmlnaHQ7IGMrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBtb2RlbC5sb2NhdGVDZWxsKGMsIHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNlbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZUludGVybmFsKG1vZGVsLCByZXN1bHRzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3RzIGEgcmFuZ2Ugb2YgY2VsbHMgdXNpbmcgYW4gRXhjZWwtbGlrZSByYW5nZSBleHByZXNzaW9uLiBGb3IgZXhhbXBsZTpcclxuICAgICAqIC0gQTEgc2VsZWN0cyBhIDF4MSByYW5nZSBvZiB0aGUgZmlyc3QgY2VsbFxyXG4gICAgICogLSBBMTpBNSBzZWxlY3RzIGEgMXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgaG9yaXpvbnRhbGx5LlxyXG4gICAgICogLSBBMTpFNSBzZWxlY3RzIGEgNXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgZXZlbmx5LlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBxdWVyeVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNlbGVjdChtb2RlbDpHcmlkTW9kZWwsIHF1ZXJ5OnN0cmluZyk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IFtmcm9tLCB0b10gPSBxdWVyeS5zcGxpdCgnOicpO1xyXG4gICAgICAgIGxldCBmcm9tQ2VsbCA9IHJlc29sdmVfZXhwcl9yZWYobW9kZWwsIGZyb20pO1xyXG5cclxuICAgICAgICBpZiAoIXRvKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY3JlYXRlSW50ZXJuYWwobW9kZWwsIFtmcm9tQ2VsbF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB0b0NlbGwgPSByZXNvbHZlX2V4cHJfcmVmKG1vZGVsLCB0byk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmcm9tQ2VsbCAmJiAhIXRvQ2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb21WZWN0b3IgPSBuZXcgUG9pbnQoZnJvbUNlbGwuY29sUmVmLCBmcm9tQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvVmVjdG9yID0gbmV3IFBvaW50KHRvQ2VsbC5jb2xSZWYsIHRvQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEdyaWRSYW5nZS5jYXB0dXJlKG1vZGVsLCBmcm9tVmVjdG9yLCB0b1ZlY3RvciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBHcmlkUmFuZ2UuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZW1wdHkgR3JpZFJhbmdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogW10sXHJcbiAgICAgICAgICAgIHR0YjogW10sXHJcbiAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMCxcclxuICAgICAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlSW50ZXJuYWwobW9kZWw6R3JpZE1vZGVsLCBjZWxsczpHcmlkQ2VsbFtdKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbGMgPSBOdW1iZXIuTUFYX1ZBTFVFLCBsciA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgbGV0IGhjID0gTnVtYmVyLk1JTl9WQUxVRSwgaHIgPSBOdW1iZXIuTUlOX1ZBTFVFO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGxjID4gYy5jb2xSZWYpIGxjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChoYyA8IGMuY29sUmVmKSBoYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAobHIgPiBjLnJvd1JlZikgbHIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgaWYgKGhyIDwgYy5yb3dSZWYpIGhyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbHRyOkdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgICAgICB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbHRyID0gdHRiID0gY2VsbHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogbHRyLFxyXG4gICAgICAgICAgICB0dGI6IHR0YixcclxuICAgICAgICAgICAgd2lkdGg6IGhjIC0gbGMsXHJcbiAgICAgICAgICAgIGhlaWdodDogaHIgLSBscixcclxuICAgICAgICAgICAgbGVuZ3RoOiAoaGMgLSBsYykgKiAoaHIgLSBsciksXHJcbiAgICAgICAgICAgIGNvdW50OiBjZWxscy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbHRyOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSB0b3AgdG8gYm90dG9tLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHRiOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaXRoIHdpZHRoIG9mIHRoZSByZXNvbHZlRXhwciBpbiBjb2x1bW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCBoZWlnaHQgb2YgdGhlIHJlc29sdmVFeHByIGluIHJvd3MuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiBjZWxscyBpbiB0aGUgcmVzb2x2ZUV4cHIgKHdpbGwgYmUgZGlmZmVyZW50IHRvIGxlbmd0aCBpZiBzb21lIGNlbGwgc2xvdHMgY29udGFpbiBubyBjZWxscykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb3VudDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbGVuZ3RoIG9mIHRoZSByZXNvbHZlRXhwciAobnVtYmVyIG9mIHJvd3MgKiBudW1iZXIgb2YgY29sdW1ucykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBsZW5ndGg6bnVtYmVyO1xyXG5cclxuICAgIHByaXZhdGUgaW5kZXg6T2JqZWN0TWFwPEdyaWRDZWxsPjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHZhbHVlczphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIG9yIG5vdCBhIGNlbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29udGFpbnMoY2VsbFJlZjpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaW5kZXgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gXy5pbmRleCh0aGlzLmx0ciwgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISF0aGlzLmluZGV4W2NlbGxSZWZdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJlZmVyZW5jZXMgZm9yIGFsbCB0aGUgY2VsbHMgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVmcygpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubHRyLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbHRyX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0dGJfc29ydChhOkdyaWRDZWxsLCBiOkdyaWRDZWxsKTpudW1iZXJcclxue1xyXG4gICAgbGV0IG4gPSAwO1xyXG5cclxuICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgaWYgKG4gPT09IDApXHJcbiAgICB7XHJcbiAgICAgICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVfZXhwcl9yZWYobW9kZWw6R3JpZE1vZGVsLCB2YWx1ZTpzdHJpbmcpOkdyaWRDZWxsXHJcbntcclxuICAgIGNvbnN0IFJlZkNvbnZlcnQgPSAvKFtBLVphLXpdKykoWzAtOV0rKS9nO1xyXG5cclxuICAgIFJlZkNvbnZlcnQubGFzdEluZGV4ID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBSZWZDb252ZXJ0LmV4ZWModmFsdWUpO1xyXG5cclxuICAgIGxldCBjb2xSZWYgPSBCYXNlMjYuc3RyKHJlc3VsdFsxXSkubnVtO1xyXG4gICAgbGV0IHJvd1JlZiA9IHBhcnNlSW50KHJlc3VsdFsyXSkgLSAxO1xyXG5cclxuICAgIHJldHVybiBtb2RlbC5sb2NhdGVDZWxsKGNvbFJlZiwgcm93UmVmKTtcclxufSIsImltcG9ydCB7IFJlZkdlbiB9IGZyb20gJy4uLy4uL21pc2MvUmVmR2VuJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgdmlzdWFsaXplLCByZW5kZXJlciB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBwYXJhbWV0ZXJzIHRoYXQgY2FuL3Nob3VsZCBiZSBwYXNzZWQgdG8gYSBuZXcgRGVmYXVsdEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgY29sUmVmOm51bWJlcjtcclxuICAgIHJvd1JlZjpudW1iZXI7XHJcbiAgICB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWY/OnN0cmluZztcclxuICAgIGNvbFNwYW4/Om51bWJlcjtcclxuICAgIHJvd1NwYW4/Om51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENlbGwuXHJcbiAqL1xyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIERlZmF1bHRHcmlkQ2VsbCBpbXBsZW1lbnRzIEdyaWRDZWxsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGwgcmVmZXJlbmNlLCBtdXN0IGJlIHVuaXF1ZSBwZXIgR3JpZE1vZGVsIGluc3RhbmNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb2x1bW4gcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSBob3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sUmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFNwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvdyByZWZlcmVuY2UgdGhhdCBkZXNjcmliZXMgdGhlIHZlcnRpY2FsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93UmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1NwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHZhbHVlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdmFsdWU6c3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDZWxsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOkRlZmF1bHRHcmlkQ2VsbFBhcmFtcylcclxuICAgIHtcclxuICAgICAgICBwYXJhbXMucmVmID0gcGFyYW1zLnJlZiB8fCBSZWZHZW4ubmV4dCgpO1xyXG4gICAgICAgIHBhcmFtcy5jb2xTcGFuID0gcGFyYW1zLmNvbFNwYW4gfHwgMTtcclxuICAgICAgICBwYXJhbXMucm93U3BhbiA9IHBhcmFtcy5yb3dTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnZhbHVlID0gKHBhcmFtcy52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHBhcmFtcy52YWx1ZSA9PT0gbnVsbCkgPyAnJyA6IHBhcmFtcy52YWx1ZTtcclxuXHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgcGFyYW1zKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGdmeC5saW5lV2lkdGggPSAxO1xyXG4gICAgbGV0IGF2ID0gZ2Z4LmxpbmVXaWR0aCAlIDIgPT0gMCA/IDAgOiAwLjU7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gJ2xpZ2h0Z3JheSc7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5mb250ID0gYDEzcHggU2Fucy1TZXJpZmA7XHJcbiAgICBnZnguZmlsbFRleHQodmlzdWFsLnZhbHVlLCAzLCAwICsgKHZpc3VhbC5oZWlnaHQgLyAyKSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENvbHVtbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENvbHVtbiBpbXBsZW1lbnRzIEdyaWRDb2x1bW5cclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogY29sdW1uIHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBjb2x1bW4uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aWR0aDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZENvbHVtbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gd2lkdGhcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgd2lkdGg6bnVtYmVyID0gMTAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRDb2x1bW4gfSBmcm9tICcuLi9HcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnXHJcbmltcG9ydCB7IERlZmF1bHRHcmlkQ2VsbCB9IGZyb20gJy4vRGVmYXVsdEdyaWRDZWxsJztcclxuXHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYSBieS10aGUtYm9vayBpbXBsZW1lbnRhdGlvbiBvZiBHcmlkTW9kZWwuICBBbGwgaW5zcGVjdGlvbiBtZXRob2RzIHVzZSBPKDEpIGltcGxlbWVudGF0aW9ucy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZE1vZGVsIGltcGxlbWVudHMgR3JpZE1vZGVsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBncmlkIG1vZGVsIHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgY29sdW1ucyBhbmQgcm93cyBwb3B1bGF0ZWQgd2l0aCBkZWZhdWx0IGNlbGxzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBjb2xzXHJcbiAgICAgKiBAcGFyYW0gcm93c1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpbShjb2xzOm51bWJlciwgcm93czpudW1iZXIpOkRlZmF1bHRHcmlkTW9kZWxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbHM7IGMrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgcm93czsgcisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjZWxscy5wdXNoKG5ldyBEZWZhdWx0R3JpZENlbGwoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbFJlZjogYyxcclxuICAgICAgICAgICAgICAgICAgICByb3dSZWY6IHIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRHcmlkTW9kZWwoY2VsbHMsIFtdLCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IGdyaWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0RlZmF1bHRHcmlkTW9kZWx9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKFtdLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY2VsbCBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjZWxsczpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY29sdW1uIGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbnM6R3JpZENvbHVtbltdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgcm93IGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZFJvd1tdO1xyXG5cclxuICAgIHByaXZhdGUgcmVmczpPYmplY3RNYXA8R3JpZENlbGw+O1xyXG4gICAgcHJpdmF0ZSBjb29yZHM6T2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkTW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGNlbGxzXHJcbiAgICAgKiBAcGFyYW0gY29sdW1uc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY2VsbHM6R3JpZENlbGxbXSwgY29sdW1uczpHcmlkQ29sdW1uW10sIHJvd3M6R3JpZFJvd1tdKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcyA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY29vcmRzID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuY29vcmRzW2MuY29sUmVmXSB8fCAodGhpcy5jb29yZHNbYy5jb2xSZWZdID0ge30pO1xyXG4gICAgICAgICAgICB4W2Mucm93UmVmXSA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCwgb3IgbnVsbCBpZiB0aGUgY2VsbCBkaWQgbm90IGV4aXN0XHJcbiAgICAgKiB3aXRoaW4gdGhlIG1vZGVsLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGwocmVmOnN0cmluZyk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZzW3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG5laWdoYm9yaW5nIGNlbGwgYXMgcGVyIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIHZlY3RvciAoZGlyZWN0aW9uKSBvYmplY3QsIG9yIG51bGwgaWYgbm8gbmVpZ2hib3IgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gdmVjdG9yXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBmaW5kQ2VsbE5laWdoYm9yKHJlZjpzdHJpbmcsIHZlY3RvcjpQb2ludCk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZmluZENlbGwocmVmKTtcclxuICAgICAgICBsZXQgY29sID0gY2VsbC5jb2xSZWYgKyB2ZWN0b3IueDtcclxuICAgICAgICBsZXQgcm93ID0gY2VsbC5yb3dSZWYgKyB2ZWN0b3IueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRlQ2VsbChjb2wsIHJvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgY29sdW1uIHJlZiBhbmQgcm93IHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCBhdCB0aGUgbG9jYXRpb24sXHJcbiAgICAgKiBvciBudWxsIGlmIG5vIGNlbGwgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gY29sUmVmXHJcbiAgICAgKiBAcGFyYW0gcm93UmVmXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBsb2NhdGVDZWxsKGNvbDpudW1iZXIsIHJvdzpudW1iZXIpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmNvb3Jkc1tjb2xdIHx8IHt9KVtyb3ddIHx8IG51bGw7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vR3JpZFJvdyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZFJvdy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZFJvdyBpbXBsZW1lbnRzIEdyaWRSb3dcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogcm93IHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkUm93LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgaGVpZ2h0Om51bWJlciA9IDIxKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FzY2FkZSgpOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6UHJvcGVydHlEZXNjcmlwdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdIHx8ICghIXRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnRba2V5XSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENhc2NhZGluZzxUPlxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OlQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50PzpULCB2YWx1ZXM/OmFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG4gICAgICAgIGlmICh2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IHR5cGUgVGV4dEFsaWdubWVudCA9ICdsZWZ0J3wnY2VudGVyJ3wncmlnaHQnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZvcm1hdHRlclxyXG57XHJcbiAgICAodmFsdWU6c3RyaW5nLCB2aXN1YWw6YW55KTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdHlsZSBleHRlbmRzIENhc2NhZGluZzxTdHlsZT5cclxue1xyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGJvcmRlckNvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZmlsbENvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZm9ybWF0dGVyOlZhbHVlRm9ybWF0dGVyO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0OlRleHRTdHlsZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRleHRTdHlsZSBleHRlbmRzIENhc2NhZGluZzxUZXh0U3R5bGU+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgRGVmYXVsdDpUZXh0U3R5bGUgPSBuZXcgVGV4dFN0eWxlKG51bGwsIHtcclxuICAgICAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgICAgICBjb2xvcjogJ2JsYWNrJyxcclxuICAgICAgICBmb250OiAnU2Vnb2UgVUknLFxyXG4gICAgICAgIHNpemU6IDEzLFxyXG4gICAgICAgIHN0eWxlOiAnbm9ybWFsJyxcclxuICAgICAgICB2YXJpYW50OiAnbm9ybWFsJyxcclxuICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGFsaWdubWVudDpUZXh0QWxpZ25tZW50O1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBjb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZvbnQ6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBzaXplOm51bWJlcjtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgc3R5bGU6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB2YXJpYW50OnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgd2VpZ2h0OnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEJhc2VTdHlsZSA9IG5ldyBTdHlsZShudWxsLCB7XHJcbiAgICBib3JkZXJDb2xvcjogJ2xpZ2h0Z3JheScsXHJcbiAgICBmaWxsQ29sb3I6ICd3aGl0ZScsXHJcbiAgICBmb3JtYXR0ZXI6IHYgPT4gdixcclxuICAgIHRleHQ6IG5ldyBUZXh0U3R5bGUobnVsbCwge1xyXG4gICAgICAgIGFsaWdubWVudDogJ2xlZnQnLFxyXG4gICAgICAgIGNvbG9yOiAnYmxhY2snLFxyXG4gICAgICAgIGZvbnQ6ICdTZWdvZSBVSScsXHJcbiAgICAgICAgc2l6ZTogMTMsXHJcbiAgICAgICAgc3R5bGU6ICdub3JtYWwnLFxyXG4gICAgICAgIHZhcmlhbnQ6ICdub3JtYWwnLFxyXG4gICAgICAgIHdlaWdodDogJ25vcm1hbCcsXHJcbiAgICB9KVxyXG59KTsiLCJpbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwsIERlZmF1bHRHcmlkQ2VsbFBhcmFtcyB9IGZyb20gJy4uL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gJy4vU3R5bGUnO1xyXG5pbXBvcnQgeyByZW5kZXJlciwgdmlzdWFsaXplIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IFN0eWxlZEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBTdHlsZWRHcmlkQ2VsbFBhcmFtcyBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFBhcmFtc1xyXG57XHJcbiAgICBwbGFjZWhvbGRlcj86c3RyaW5nO1xyXG4gICAgc3R5bGU/OlN0eWxlO1xyXG59XHJcblxyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIFN0eWxlZEdyaWRDZWxsIGV4dGVuZHMgRGVmYXVsdEdyaWRDZWxsXHJcbntcclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHN0eWxlOlN0eWxlID0gQmFzZVN0eWxlO1xyXG5cclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHBsYWNlaG9sZGVyOnN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgU3R5bGVkR3JpZENlbGwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM6U3R5bGVkR3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIocGFyYW1zKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IHBhcmFtcy5wbGFjZWhvbGRlciB8fCAnJztcclxuICAgICAgICB0aGlzLnN0eWxlID0gcGFyYW1zLnN0eWxlIHx8IEJhc2VTdHlsZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGxldCBzdHlsZSA9IHZpc3VhbC5zdHlsZSBhcyBTdHlsZTtcclxuXHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS5maWxsQ29sb3I7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gc3R5bGUuYm9yZGVyQ29sb3I7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBsZXQgdGV4dFB0ID0gbmV3IFBvaW50KDMsIHZpc3VhbC5oZWlnaHQgLyAyKSBhcyBQb2ludExpa2U7XHJcbiAgICBpZiAoc3R5bGUudGV4dC5hbGlnbm1lbnQgPT09ICdjZW50ZXInKVxyXG4gICAge1xyXG4gICAgICAgIHRleHRQdC54ID0gdmlzdWFsLndpZHRoIC8gMjtcclxuICAgIH1cclxuICAgIGlmIChzdHlsZS50ZXh0LmFsaWdubWVudCA9PT0gJ3JpZ2h0JylcclxuICAgIHtcclxuICAgICAgICB0ZXh0UHQueCA9IHZpc3VhbC53aWR0aCAtIDM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2Z4LmZvbnQgPSBgJHtzdHlsZS50ZXh0fSAke3N0eWxlLnRleHQudmFyaWFudH0gJHtzdHlsZS50ZXh0LndlaWdodH0gJHtzdHlsZS50ZXh0LnNpemV9cHggJHtzdHlsZS50ZXh0LmZvbnR9YDtcclxuICAgIGdmeC50ZXh0QWxpZ24gPSBzdHlsZS50ZXh0LmFsaWdubWVudDtcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS50ZXh0LmNvbG9yO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHN0eWxlLmZvcm1hdHRlcih2aXN1YWwudmFsdWUsIHZpc3VhbCkgfHwgdmlzdWFsLnBsYWNlaG9sZGVyLCB0ZXh0UHQueCwgdGV4dFB0LnkpO1xyXG59IiwiaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBpc0Jvb2xlYW4gfSBmcm9tICd1dGlsJztcclxuXHJcblxyXG4vKipcclxuICogRG8gbm90IHVzZSBkaXJlY3RseS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NEZWY8VD5cclxue1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gZGVmaW5pdGlvbiBmb3IgYSBjZWxsIHJlbmRlcmVyIGZ1bmN0aW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlclxyXG57XHJcbiAgICAoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kIGFzIGEgX2NvbW1hbmRfOyBhbiBleHRlcm5hbGx5IGNhbGxhYmxlIGxvZ2ljIGJsb2NrIHRoYXQgcGVyZm9ybXMgc29tZSB0YXNrLiAgQSBuYW1lXHJcbiAqIGZvciB0aGUgY29tbWFuZCBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkIGFzIHRoZSBjb21tYW5kIHdpbGwgYmVcclxuICogdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIGNvbW1hbmQgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kKG5hbWU/OnN0cmluZyk6TWV0aG9kRGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDpjb21tYW5kcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIGltcGw6IGRlc2NyaXB0b3IudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgZGVmaW5lcyB0aGUgcmVuZGVyIGZ1bmN0aW9uIGZvciBhIEdyaWRDZWxsIGltcGxlbWVudGF0aW9uLCBhbGxvd2luZyBjdXN0b20gY2VsbCB0eXBlc1xyXG4gKiB0byBjb250cm9sIHRoZWlyIGRyYXdpbmcgYmVoYXZpb3IuXHJcbiAqXHJcbiAqIEBwYXJhbSBmdW5jXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJlcihmdW5jOlJlbmRlcmVyKTpDbGFzc0RlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBmdW5jLCBjdG9yKTtcclxuICAgIH07XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9yb3V0aW5lXzsgYSBsb2dpYyBibG9jayB0aGF0IGNhbiBiZSBob29rZWQgaW50byBvciBvdmVycmlkZGVuIGJ5IG90aGVyXHJcbiAqIG1vZHVsZXMuICBBIG5hbWUgZm9yIHRoZSByb3V0aW5lIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBtZXRob2QgYmVpbmcgZXhwb3J0ZWRcclxuICogYXMgdGhlIHJvdXRpbmUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgcm91dGluZSBuYW1lXHJcbiAqIEByZXR1cm5zIGRlY29yYXRvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRpbmUobmFtZT86c3RyaW5nKTpNZXRob2REZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nLCBkZXNjcmlwdG9yOlR5cGVkUHJvcGVydHlEZXNjcmlwdG9yPEZ1bmN0aW9uPik6YW55XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvdXRpbmUgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG4gICAgICAgIGxldCB3cmFwcGVyID0gZnVuY3Rpb24gKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBrZXJuZWwgPSAodGhpc1snX19rZXJuZWwnXSB8fCB0aGlzWydrZXJuZWwnXSkgYXMgR3JpZEtlcm5lbDtcclxuICAgICAgICAgICAgcmV0dXJuIGtlcm5lbC5yb3V0aW5lcy5zaWduYWwoa2V5LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLCByb3V0aW5lLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB3cmFwcGVyIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIGZpZWxkIGFzIGEgX3ZhcmlhYmxlXzsgYSByZWFkYWJsZSBhbmQgb3B0aW9uYWxseSB3cml0YWJsZSB2YWx1ZSB0aGF0IGNhbiBiZSBjb25zdW1lZCBieVxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgdmFyaWFibGUgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIGZpZWxkIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSB2YXJpYWJsZSB3aWxsIGJlIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCB2YXJpYWJsZSBuYW1lXHJcbiAqIEByZXR1cm5zIGRlY29yYXRvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG11dGFibGU6Ym9vbGVhbik6UHJvcGVydHlEZWNvcmF0b3I7XHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShuYW1lPzpzdHJpbmcsIG11dGFibGU/OmJvb2xlYW4pO1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZTpzdHJpbmd8Ym9vbGVhbiwgbXV0YWJsZT86Ym9vbGVhbik6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgaWYgKHR5cGVvZihuYW1lKSA9PT0gJ2Jvb2xlYW4nKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB2YXJpYWJsZSh1bmRlZmluZWQsIG5hbWUgYXMgYm9vbGVhbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6dmFyaWFibGVzJztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBSZWZsZWN0LmdldE1ldGFkYXRhKG1kaywgY3Rvcik7XHJcbiAgICAgICAgaWYgKCFsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShtZGssIChsaXN0ID0gW10pLCBjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUgfHwga2V5LFxyXG4gICAgICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICAgICAgbXV0YWJsZTogbXV0YWJsZSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9sZXQgdmFsU3RvcmVLZXkgPSAhIW5hbWUgPyBrZXkgOiBgX18ke2tleX1gO1xyXG4gICAgICAgIC8vbGV0IHVzZUFsdFZhbHVlU3RvcmUgPSAhbmFtZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIG5hbWUgfHwga2V5LCB7XHJcbiAgICAgICAgLy8gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAvLyAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIC8vICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3ZhbFN0b3JlS2V5XTsgfSxcclxuICAgICAgICAvLyAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbCkgeyB0aGlzW3ZhbFN0b3JlS2V5XSA9IG5ld1ZhbDsgfVxyXG4gICAgICAgIC8vfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgZm9yIHVzZSB3aXRoaW4gaW1wbGVtZW50YXRpb25zIG9mIEdyaWRDZWxsIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBvbmUgdGhhdCBhZmZlY3RzIHRoZSB2aXN1YWxcclxuICogYXBwZWFyYW5jZSBvZiB0aGUgY2VsbC4gIFRoaXMgd2lsbCBjYXVzZSB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIHRvIGJlIG1hcHBlZCB0byB0aGUgX1Zpc3VhbF8gb2JqZWN0XHJcbiAqIGNyZWF0ZWQgYmVmb3JlIHRoZSBjZWxsIGlzIGRyYXduLlxyXG4gKlxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2aXN1YWxpemUoKTpQcm9wZXJ0eURlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOlByb3BlcnR5RGVzY3JpcHRvclxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZpc3VhbGl6ZSc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goa2V5KTtcclxuXHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOmFueVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1twa107XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsOmFueSk6dm9pZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3BrXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fZGlydHknXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgUGFkZGluZyB9IGZyb20gJy4uL2dlb20vUGFkZGluZyc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL21vZGVsL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsJztcclxuaW1wb3J0IHsgRXZlbnRFbWl0dGVyQmFzZSB9IGZyb20gJy4vaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBHcmlkTGF5b3V0IH0gZnJvbSAnLi9pbnRlcm5hbC9HcmlkTGF5b3V0JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnQgfSBmcm9tICcuLi9pbnB1dC9Nb3VzZURyYWdFdmVudCc7XHJcbmltcG9ydCB7IFJlY3QsIFJlY3RMaWtlIH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBwcm9wZXJ0eSB9IGZyb20gJy4uL21pc2MvUHJvcGVydHknO1xyXG5pbXBvcnQgeyB2YXJpYWJsZSB9IGZyb20gJy4vRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuZGVyXHJcbntcclxuICAgIChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VFdmVudCBleHRlbmRzIE1vdXNlRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VEcmFnRXZlbnQgZXh0ZW5kcyBNb3VzZURyYWdFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRLZXlib2FyZEV2ZW50IGV4dGVuZHMgS2V5Ym9hcmRFdmVudFxyXG57XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRFbGVtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyQmFzZVxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZSh0YXJnZXQ6SFRNTEVsZW1lbnQsIGluaXRpYWxNb2RlbD86R3JpZE1vZGVsKTpHcmlkRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwYXJlbnQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGNhbnZhcyA9IHRhcmdldC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGNhbnZhcy5pZCA9IHRhcmdldC5pZDtcclxuICAgICAgICBjYW52YXMuY2xhc3NOYW1lID0gdGFyZ2V0LmNsYXNzTmFtZTtcclxuICAgICAgICBjYW52YXMudGFiSW5kZXggPSB0YXJnZXQudGFiSW5kZXggfHwgMDtcclxuXHJcbiAgICAgICAgdGFyZ2V0LmlkID0gbnVsbDtcclxuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNhbnZhcywgdGFyZ2V0KTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGFyZ2V0KTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgcGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGdyaWQgPSBuZXcgR3JpZEVsZW1lbnQoY2FudmFzKTtcclxuICAgICAgICBncmlkLm1vZGVsID0gaW5pdGlhbE1vZGVsIHx8IERlZmF1bHRHcmlkTW9kZWwuZGltKDI2LCAxMDApO1xyXG4gICAgICAgIGdyaWQuYmFzaCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JpZDtcclxuICAgIH1cclxuXHJcbiAgICBAcHJvcGVydHkoRGVmYXVsdEdyaWRNb2RlbC5lbXB0eSgpLCB0ID0+IHsgdC5lbWl0KCdsb2FkJywgdC5tb2RlbCk7IHQuaW52YWxpZGF0ZSgpOyB9KVxyXG4gICAgcHVibGljIG1vZGVsOkdyaWRNb2RlbDtcclxuXHJcbiAgICBAcHJvcGVydHkobmV3IFBvaW50KDAsIDApLCB0ID0+IHQuaW52YWxpZGF0ZSgpKVxyXG4gICAgcHVibGljIGZyZWV6ZU1hcmdpbjpQb2ludDtcclxuXHJcbiAgICBAcHJvcGVydHkoUGFkZGluZy5lbXB0eSwgdCA9PiB0LmludmFsaWRhdGUoKSlcclxuICAgIHB1YmxpYyBwYWRkaW5nOlBhZGRpbmc7XHJcblxyXG4gICAgQHByb3BlcnR5KFBvaW50LmVtcHR5LCB0ID0+IHsgdC5yZWRyYXcoKTsgdC5lbWl0KCdzY3JvbGwnKTsgfSlcclxuICAgIHB1YmxpYyBzY3JvbGw6UG9pbnQ7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvb3Q6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGFpbmVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtlcm5lbDpHcmlkS2VybmVsO1xyXG5cclxuICAgIHByaXZhdGUgaG90Q2VsbDpHcmlkQ2VsbDtcclxuICAgIHByaXZhdGUgZGlydHk6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBsYXlvdXQ6R3JpZExheW91dDsgICAgXHJcbiAgICBwcml2YXRlIGJ1ZmZlcnM6T2JqZWN0TWFwPEJ1ZmZlcj4gPSB7fTtcclxuICAgIHByaXZhdGUgdmlzdWFsczpPYmplY3RNYXA8VmlzdWFsPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBmcmFtZTpWaWV3QXNwZWN0W107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjYW52YXMucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWwodGhpcy5lbWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBbJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnLCAnbW91c2V3aGVlbCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnYmVnaW4nLCAnZHJhZycsICdkcmFnZW5kJ11cclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PiB0aGlzLmZvcndhcmRNb3VzZUV2ZW50KHgpKTtcclxuICAgICAgICBbJ2tleWRvd24nLCAna2V5cHJlc3MnLCAna2V5dXAnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZEtleUV2ZW50KHgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmFibGVFbnRlckV4aXRFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxXaWR0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJvd3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbEhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxMZWZ0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsLng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxUb3AoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGwueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9ufEdyaWRFeHRlbmRlcik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBpZiAodHlwZW9mKGV4dCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LmluaXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3Q6UmVjdDtcclxuXHJcbiAgICAgICAgaWYgKHB0T3JSZWN0Wyd3aWR0aCddID09PSB1bmRlZmluZWQgJiYgcHRPclJlY3RbJ2hlaWdodCddID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QocHRPclJlY3RbJ3gnXSwgcHRPclJlY3RbJ3knXSwgMSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlc3QgPSBSZWN0LmZyb21MaWtlKHB0T3JSZWN0IGFzIFJlY3RMaWtlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdTY3JvbGwgPSB7XHJcbiAgICAgICAgICAgIHg6IHRoaXMuc2Nyb2xsLngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMuc2Nyb2xsLnksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGRlc3QubGVmdCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdTY3JvbGwueCArPSBkZXN0LmxlZnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnJpZ2h0ID4gdGhpcy53aWR0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5ld1Njcm9sbC54ICs9IGRlc3QucmlnaHQgLSB0aGlzLndpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC50b3AgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC50b3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmJvdHRvbSA+IHRoaXMuaGVpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC5ib3R0b20gLSB0aGlzLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5zY3JvbGwuZXF1YWxzKG5ld1Njcm9sbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbCA9IFBvaW50LmNyZWF0ZShuZXdTY3JvbGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmFzaCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3Qud2lkdGggPSB0aGlzLnJvb3QucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICB0aGlzLnJvb3QuaGVpZ2h0ID0gdGhpcy5yb290LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuZW1pdCgnYmFzaCcpO1xyXG5cclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZShxdWVyeTpzdHJpbmcgPSBudWxsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC5pbnZhbGlkYXRlJyk7XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0LmNvbXB1dGUodGhpcy5tb2RlbCwgdGhpcy5wYWRkaW5nKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoISFxdWVyeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByYW5nZSA9IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5tb2RlbCwgcXVlcnkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHJhbmdlLmx0cikge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGxbJ19fZGlydHknXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVycyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNlbGxzLmZvckVhY2goeCA9PiBkZWxldGUgeFsnX19kaXJ0eSddKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuaW52YWxpZGF0ZScpO1xyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdpbnZhbGlkYXRlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZHJhdyhmb3JjZUltbWVkaWF0ZTpib29sZWFuID0gZmFsc2UpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC5yZWRyYXcnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmb3JjZUltbWVkaWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZHJhdygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdGhpcy51cGRhdGVWaXN1YWxzKCk7XHJcbiAgICAgICAgdGhpcy5kcmF3VmlzdWFscygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5yZWRyYXcnKTtcclxuICAgICAgICB0aGlzLmVtaXQoJ2RyYXcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbXB1dGVWaWV3RnJhZ21lbnRzKCk6Vmlld0ZyYWdtZW50W11cclxuICAgIHtcclxuICAgICAgICBsZXQgeyBmcmVlemVNYXJnaW4sIGxheW91dCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IG1ha2UgPSAobDpudW1iZXIsIHQ6bnVtYmVyLCB3Om51bWJlciwgaDpudW1iZXIsIG9sOm51bWJlciwgb3Q6bnVtYmVyKSA9PiAoe1xyXG4gICAgICAgICAgICBsZWZ0OiBsLFxyXG4gICAgICAgICAgICB0b3A6IHQsXHJcbiAgICAgICAgICAgIHdpZHRoOiB3LFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGgsXHJcbiAgICAgICAgICAgIG9mZnNldExlZnQ6IG9sLFxyXG4gICAgICAgICAgICBvZmZzZXRUb3A6IG90LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG5cclxuICAgICAgICBpZiAoZnJlZXplTWFyZ2luLmVxdWFscyhQb2ludC5lbXB0eSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gWyBtYWtlKHZpZXdwb3J0LmxlZnQsIHZpZXdwb3J0LnRvcCwgdmlld3BvcnQud2lkdGgsIHZpZXdwb3J0LmhlaWdodCwgMCwgMCkgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IG1hcmdpbkxlZnQgPSBsYXlvdXQucXVlcnlDb2x1bW5SYW5nZSgwLCBmcmVlemVNYXJnaW4ueCkud2lkdGg7XHJcbiAgICAgICAgICAgIGxldCBtYXJnaW5Ub3AgPSBsYXlvdXQucXVlcnlSb3dSYW5nZSgwLCBmcmVlemVNYXJnaW4ueSkuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgbWFyZ2luID0gbmV3IFBvaW50KG1hcmdpbkxlZnQsIG1hcmdpblRvcCk7XHJcblxyXG4gICAgICAgICAgICAvL0FsaWFzZXMgdG8gcHJldmVudCBtYXNzaXZlIGxpbmVzO1xyXG4gICAgICAgICAgICBsZXQgdnAgPSB2aWV3cG9ydDtcclxuICAgICAgICAgICAgbGV0IG1nID0gbWFyZ2luO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFsgXHJcbiAgICAgICAgICAgICAgICBtYWtlKHZwLmxlZnQgKyBtZy54LCB2cC50b3AgKyBtZy55LCB2cC53aWR0aCAtIG1nLngsIHZwLmhlaWdodCAtIG1nLnksIG1nLngsIG1nLnkpLCAvL01haW5cclxuICAgICAgICAgICAgICAgIG1ha2UoMCwgdnAudG9wICsgbWcueSwgbWcueCwgdnAuaGVpZ2h0IC0gbWcueSwgMCwgbWcueSksIC8vTGVmdFxyXG4gICAgICAgICAgICAgICAgbWFrZSh2cC5sZWZ0ICsgbWcueCwgMCwgdnAud2lkdGggLSBtZy54LCBtZy55LCBtZy54LCAwKSwgLy9Ub3BcclxuICAgICAgICAgICAgICAgIG1ha2UoMCwgMCwgbWcueCwgbWcueSwgMCwgMCksIC8vTGVmdFRvcFxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbXB1dGVWaWV3cG9ydCgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoTWF0aC5mbG9vcih0aGlzLnNjcm9sbExlZnQpLCBNYXRoLmZsb29yKHRoaXMuc2Nyb2xsVG9wKSwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgeyBtb2RlbCwgbGF5b3V0IH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBmcmFnbWVudHMgPSB0aGlzLmNvbXB1dGVWaWV3RnJhZ21lbnRzKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGZyYWdtZW50cyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByZXZGcmFtZSA9IHRoaXMuZnJhbWU7XHJcbiAgICAgICAgbGV0IG5leHRGcmFtZSA9IFtdIGFzIFZpZXdBc3BlY3RbXTtcclxuXHJcbiAgICAgICAgLy9JZiB0aGUgZnJhZ21lbnRzIGhhdmUgY2hhbmdlZCwgbmVyZiB0aGUgcHJldkZyYW1lIHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gcmVjeWNsZSBhbnl0aGluZy5cclxuICAgICAgICBpZiAoIXByZXZGcmFtZSB8fCBwcmV2RnJhbWUubGVuZ3RoICE9IGZyYWdtZW50cy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmV2RnJhbWUgPSBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhZ21lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHByZXZBc3BlY3QgPSBwcmV2RnJhbWVbaV07XHJcbiAgICAgICAgICAgIGxldCBhc3BlY3QgPSA8Vmlld0FzcGVjdD57XHJcbiAgICAgICAgICAgICAgICB2aWV3OiBmcmFnbWVudHNbaV0sXHJcbiAgICAgICAgICAgICAgICB2aXN1YWxzOiB7fSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxldCB2aWV3Q2VsbHMgPSBsYXlvdXQuY2FwdHVyZUNlbGxzKGFzcGVjdC52aWV3KVxyXG4gICAgICAgICAgICAgICAgLm1hcChyZWYgPT4gbW9kZWwuZmluZENlbGwocmVmKSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHZpZXdDZWxscylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlZ2lvbiA9IGxheW91dC5xdWVyeUNlbGwoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZpc3VhbCA9ICEhcHJldkFzcGVjdCA/IHByZXZBc3BlY3QudmlzdWFsc1tjZWxsLnJlZl0gOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBoYXZlIGEgcHJldmlvdXMgdmlzdWFsIG9yIGlmIHRoZSBjZWxsIHdhcyBkaXJ0eSwgY3JlYXRlIG5ldyB2aXN1YWxcclxuICAgICAgICAgICAgICAgIGlmICghdmlzdWFsIHx8IGNlbGwudmFsdWUgIT09IHZpc3VhbC52YWx1ZSB8fCBjZWxsWydfX2RpcnR5J10gIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFzcGVjdC52aXN1YWxzW2NlbGwucmVmXSA9IHRoaXMuY3JlYXRlVmlzdWFsKGNlbGwsIHJlZ2lvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxbJ19fZGlydHknXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGp1c3QgdXNlIHRoZSBwcmV2aW91c1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFzcGVjdC52aXN1YWxzW2NlbGwucmVmXSA9IHZpc3VhbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbmV4dEZyYW1lLnB1c2goYXNwZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZnJhbWUgPSBuZXh0RnJhbWU7XHJcblxyXG5cclxuICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+XHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBsZXQgZ2Z4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IGFscGhhOiB0cnVlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICAvLyAgICAgZ2Z4LnNhdmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGZvciAobGV0IGYgb2YgZnJhZ21lbnRzKSBcclxuICAgICAgICAvLyAgICAge1xyXG4gICAgICAgIC8vICAgICAgICAgLy9nZngudHJhbnNsYXRlKGYubGVmdCAqIC0xLCBmLnRvcCAqIC0xKTtcclxuICAgICAgICAvLyAgICAgICAgIGdmeC5zdHJva2VTdHlsZSA9ICdyZWQnO1xyXG4gICAgICAgIC8vICAgICAgICAgZ2Z4LnN0cm9rZVJlY3QoZi5vZmZzZXRMZWZ0LCBmLm9mZnNldFRvcCwgZi53aWR0aCwgZi5oZWlnaHQpOyAgICAgICAgICAgIFxyXG4gICAgICAgIC8vICAgICB9XHJcblxyXG4gICAgICAgIC8vICAgICBnZngucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICAvLyB9LCA1MCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVWaXN1YWxzMigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IHsgbW9kZWwsIGxheW91dCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICBsZXQgdmlzaWJsZUNlbGxzID0gbGF5b3V0LmNhcHR1cmVDZWxscyh2aWV3cG9ydClcclxuICAgICAgICAgICAgLm1hcChyZWYgPT4gbW9kZWwuZmluZENlbGwocmVmKSk7XHJcblxyXG4gICAgICAgIGxldCBwcmV2RnJhbWUgPSB0aGlzLnZpc3VhbHM7XHJcbiAgICAgICAgbGV0IG5leHRGcmFtZSA9IDxPYmplY3RNYXA8VmlzdWFsPj57fTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiB2aXNpYmxlQ2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmVnaW9uID0gbGF5b3V0LnF1ZXJ5Q2VsbChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgIGxldCB2aXN1YWwgPSBwcmV2RnJhbWVbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgd2UgZGlkbid0IGhhdmUgYSBwcmV2aW91cyB2aXN1YWwgb3IgaWYgdGhlIGNlbGwgd2FzIGRpcnR5LCBjcmVhdGUgbmV3IHZpc3VhbFxyXG4gICAgICAgICAgICBpZiAoIXZpc3VhbCB8fCBjZWxsLnZhbHVlICE9PSB2aXN1YWwudmFsdWUgfHwgY2VsbFsnX19kaXJ0eSddICE9PSBmYWxzZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV4dEZyYW1lW2NlbGwucmVmXSA9IHRoaXMuY3JlYXRlVmlzdWFsKGNlbGwsIHJlZ2lvbik7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5idWZmZXJzW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZWxsWydfX2RpcnR5J10gPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UganVzdCB1c2UgdGhlIHByZXZpb3VzXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmV4dEZyYW1lW2NlbGwucmVmXSA9IHZpc3VhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9sZXQgZnJvemVuQ2VsbHMgPSBsYXlvdXQuY2FwdHVyZUNlbGxzKHZpZXdwb3J0LmluZmxhdGUpXHJcbiAgICAgICAgbGV0IGZtID0gdGhpcy5mcmVlemVNYXJnaW47XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGZyYWdtZW50cyA9IFtdIGFzIFJlY3RbXTtcclxuICAgICAgICBmcmFnbWVudHMucHVzaCh2aWV3cG9ydCk7XHJcbiAgICAgICAgZnJhZ21lbnRzLnB1c2gobmV3IFJlY3QoMCwgMCwgbGF5b3V0LnF1ZXJ5Q29sdW1uUmFuZ2UoMCwgZm0ueCkud2lkdGgsIGxheW91dC5xdWVyeVJvd1JhbmdlKDAsIGZtLnkpLmhlaWdodCkpO1xyXG4gICAgICAgIGZyYWdtZW50cy5wdXNoKG5ldyBSZWN0KDAsIHZpZXdwb3J0LnRvcCArIGZyYWdtZW50c1sxXS5oZWlnaHQsIGZyYWdtZW50c1sxXS53aWR0aCwgKHZpZXdwb3J0LmhlaWdodCAtIGZyYWdtZW50c1sxXS5oZWlnaHQpKSk7XHJcbiAgICAgICAgZnJhZ21lbnRzLnB1c2gobmV3IFJlY3Qodmlld3BvcnQubGVmdCArIGZyYWdtZW50c1sxXS53aWR0aCwgMCwgdmlld3BvcnQud2lkdGggLSBmcmFnbWVudHNbMV0ud2lkdGgsIGZyYWdtZW50c1sxXS5oZWlnaHQpKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogdHJ1ZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgICAgIGdmeC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGdmeC50cmFuc2xhdGUodmlld3BvcnQubGVmdCAqIC0xLCB2aWV3cG9ydC50b3AgKiAtMSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGxldCBmIG9mIGZyYWdtZW50cykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdmeC5zdHJva2VTdHlsZSA9ICdyZWQnO1xyXG4gICAgICAgICAgICAgICAgZ2Z4LnN0cm9rZVJlY3QoZi5sZWZ0LCBmLnRvcCwgZi53aWR0aCwgZi5oZWlnaHQpOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZngucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICB9LCA1MCk7XHJcblxyXG4gICAgICAgIGZyYWdtZW50cy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgZnJhZ21lbnRzWzBdWydtJ10gPSAocjpSZWN0LCB2OlZpc3VhbCkgPT4geyB2LmxlZnQgPSByLmxlZnQgKyB2aWV3cG9ydC5sZWZ0OyB2LnRvcCA9IHIudG9wICsgdmlld3BvcnQudG9wIH1cclxuICAgICAgICBmcmFnbWVudHNbMV1bJ20nXSA9IChyOlJlY3QsIHY6VmlzdWFsKSA9PiB2LmxlZnQgPSByLmxlZnQgKyB2aWV3cG9ydC5sZWZ0O1xyXG4gICAgICAgIGZyYWdtZW50c1syXVsnbSddID0gKHI6UmVjdCwgdjpWaXN1YWwpID0+IHYudG9wID0gci50b3AgKyB2aWV3cG9ydC50b3A7XHJcblxyXG4gICAgICAgIG5leHRGcmFtZSA9IDxPYmplY3RNYXA8VmlzdWFsPj57fTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZiBvZiBmcmFnbWVudHMucmV2ZXJzZSgpKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBmcmFnbWVudENlbGxzID0gbGF5b3V0LmNhcHR1cmVDZWxscyhmKVxyXG4gICAgICAgICAgICAgICAgLm1hcChyZWYgPT4gbW9kZWwuZmluZENlbGwocmVmKSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy52aXN1YWxzO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBmcmFnbWVudENlbGxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVnaW9uID0gbGF5b3V0LnF1ZXJ5Q2VsbChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmlzdWFsID0gcHJldkZyYW1lW2NlbGwucmVmXSB8fCBuZXh0RnJhbWVbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBoYXZlIGEgcHJldmlvdXMgdmlzdWFsIG9yIGlmIHRoZSBjZWxsIHdhcyBkaXJ0eSwgY3JlYXRlIG5ldyB2aXN1YWxcclxuICAgICAgICAgICAgICAgIGlmICghdmlzdWFsIHx8IGNlbGwudmFsdWUgIT09IHZpc3VhbC52YWx1ZSB8fCBjZWxsWydfX2RpcnR5J10gIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB2aXN1YWwgPSB0aGlzLmNyZWF0ZVZpc3VhbChjZWxsLCByZWdpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxbJ19fZGlydHknXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGp1c3QgdXNlIHRoZSBwcmV2aW91c1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB2aXN1YWw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZlsnbSddKHJlZ2lvbiwgdmlzdWFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coZnJhZ21lbnRzKTtcclxuXHJcbiAgICAgICAgdGhpcy52aXN1YWxzID0gbmV4dEZyYW1lO1xyXG5cclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXdWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNhbnZhcywgbW9kZWwsIGZyYW1lIH0gPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IGdmeCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IHRydWUgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIGdmeC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXNwZWN0IG9mIGZyYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZpZXcgPSBSZWN0LmZyb21MaWtlKGFzcGVjdC52aWV3KTtcclxuXHJcbiAgICAgICAgICAgIGdmeC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGdmeC50cmFuc2xhdGUoYXNwZWN0LnZpZXcub2Zmc2V0TGVmdCwgYXNwZWN0LnZpZXcub2Zmc2V0VG9wKTtcclxuICAgICAgICAgICAgZ2Z4LnRyYW5zbGF0ZShhc3BlY3Qudmlldy5sZWZ0ICogLTEsIGFzcGVjdC52aWV3LnRvcCAqIC0xKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGNyIGluIGFzcGVjdC52aXN1YWxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IG1vZGVsLmZpbmRDZWxsKGNyKTtcclxuICAgICAgICAgICAgICAgIGxldCB2aXN1YWwgPSBhc3BlY3QudmlzdWFsc1tjcl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZpc3VhbC53aWR0aCA9PSAwIHx8IHZpc3VhbC5oZWlnaHQgPT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcuaW50ZXJzZWN0cyh2aXN1YWwpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZUJ1ZmZlcih2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBjZWxsLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZngucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5kcmF3VmlzdWFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZHJhd1Zpc3VhbHMyKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICBsZXQgZ2Z4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IGFscGhhOiB0cnVlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICBnZnguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICBnZnguc2F2ZSgpO1xyXG4gICAgICAgIGdmeC50cmFuc2xhdGUodmlld3BvcnQubGVmdCAqIC0xLCB2aWV3cG9ydC50b3AgKiAtMSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNyIGluIHRoaXMudmlzdWFscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5tb2RlbC5maW5kQ2VsbChjcik7XHJcbiAgICAgICAgICAgIGxldCB2aXN1YWwgPSB0aGlzLnZpc3VhbHNbY3JdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZpc3VhbC53aWR0aCA9PSAwIHx8IHZpc3VhbC5oZWlnaHQgPT0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdmlld3BvcnQuaW50ZXJzZWN0cyh2aXN1YWwpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWJ1ZmZlcilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5idWZmZXJzW2NlbGwucmVmXSA9IHRoaXMuY3JlYXRlQnVmZmVyKHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBUeXBlU2NyaXB0VW5yZXNvbHZlZEZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBjZWxsLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZW5kZXJlcihidWZmZXIuZ2Z4LCB2aXN1YWwsIGNlbGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2Z4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5kcmF3VmlzdWFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlQnVmZmVyKHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcik6QnVmZmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIod2lkdGgsIGhlaWdodCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVWaXN1YWwoY2VsbDphbnksIHJlZ2lvbjpSZWN0TGlrZSk6VmlzdWFsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc3VhbCA9IG5ldyBWaXN1YWwoY2VsbC5yZWYsIGNlbGwudmFsdWUsIHJlZ2lvbi5sZWZ0LCByZWdpb24udG9wLCByZWdpb24ud2lkdGgsIHJlZ2lvbi5oZWlnaHQpO1xyXG5cclxuICAgICAgICBsZXQgcHJvcHMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2aXN1YWxpemUnLCBjZWxsLmNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgW10pIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcHJvcHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsW3BdID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc3VhbFtwXSA9IGNsb25lKGNlbGxbcF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSWxsZWdhbCB2aXN1YWxpemVkIHByb3BlcnR5IG5hbWUgJHtwfSBvbiB0eXBlICR7Y2VsbC5jb25zdHJ1Y3Rvci5uYW1lfS5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHZpc3VhbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcndhcmRNb3VzZUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KG5lLm9mZnNldFgsIG5lLm9mZnNldFkpO1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCBnZSA9IDxhbnk+bmU7XHJcbiAgICAgICAgICAgIGdlLmNlbGwgPSBjZWxsIHx8IG51bGw7XHJcbiAgICAgICAgICAgIGdlLmdyaWRYID0gcHQueDtcclxuICAgICAgICAgICAgZ2UuZ3JpZFkgPSBwdC55OyAgICAgIFxyXG5cclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCBnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkS2V5RXZlbnQoZXZlbnQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKG5lOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIDxHcmlkS2V5Ym9hcmRFdmVudD5uZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmFibGVFbnRlckV4aXRFdmVudHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vbignbW91c2Vtb3ZlJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5jZWxsICE9IHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3RXZ0ID0gdGhpcy5jcmVhdGVHcmlkTW91c2VFdmVudCgnY2VsbGV4aXQnLCBlKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RXZ0LmNlbGwgPSB0aGlzLmhvdENlbGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjZWxsZXhpdCcsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5ob3RDZWxsID0gZS5jZWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0V2dCA9IHRoaXMuY3JlYXRlR3JpZE1vdXNlRXZlbnQoJ2NlbGxlbnRlcicsIGUpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdFdnQuY2VsbCA9IHRoaXMuaG90Q2VsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2NlbGxlbnRlcicsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUdyaWRNb3VzZUV2ZW50KHR5cGU6c3RyaW5nLCBzb3VyY2U6R3JpZE1vdXNlRXZlbnQpOkdyaWRNb3VzZUV2ZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0gPGFueT4obmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuY2VsbCA9IHNvdXJjZS5jZWxsO1xyXG4gICAgICAgIGV2ZW50LmdyaWRYID0gc291cmNlLmdyaWRYO1xyXG4gICAgICAgIGV2ZW50LmdyaWRZID0gc291cmNlLmdyaWRZO1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdGcmFnbWVudCBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIG9mZnNldExlZnQ6bnVtYmVyO1xyXG4gICAgb2Zmc2V0VG9wOm51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdBc3BlY3Rcclxue1xyXG4gICAgdmlldzpWaWV3RnJhZ21lbnQ7XHJcbiAgICB2aXN1YWxzOk9iamVjdE1hcDxWaXN1YWw+O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZSh4OmFueSk6YW55XHJcbntcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB4Lm1hcChjbG9uZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIF8uc2hhZG93Q2xvbmUoeCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJ1ZmZlclxyXG57XHJcbiAgICBwdWJsaWMgY2FudmFzOkhUTUxDYW52YXNFbGVtZW50O1xyXG4gICAgcHVibGljIGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHdpZHRoOm51bWJlciwgcHVibGljIGhlaWdodDpudW1iZXIsIHB1YmxpYyBpbmZsYXRpb246bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgKyAoaW5mbGF0aW9uICogMik7XHJcbiAgICAgICAgdGhpcy5nZnggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IGZhbHNlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICB0aGlzLmdmeC50cmFuc2xhdGUoaW5mbGF0aW9uLCBpbmZsYXRpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBWaXN1YWxcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlZjpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU6c3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGxlZnQ6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIHRvcDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgd2lkdGg6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGhlaWdodDpudW1iZXIpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVxdWFscyhhbm90aGVyOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzW3Byb3BdICE9PSBhbm90aGVyW3Byb3BdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnXHJcblxyXG4vL1RoaXMga2VlcHMgV2ViU3Rvcm0gcXVpZXQsIGZvciBzb21lIHJlYXNvbiBpdCBpcyBjb21wbGFpbmluZy4uLlxyXG5kZWNsYXJlIHZhciBSZWZsZWN0OmFueTtcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDb21tYW5kXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDb21tYW5kSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIGNvbW1hbmQgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgZGVmaW5lKGNvbW1hbmQ6c3RyaW5nLCBpbXBsOkdyaWRDb21tYW5kKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZXMgdGhlIHNwZWNpZmllZCBncmlkIGNvbW1hbmQuXHJcbiAgICAgKi9cclxuICAgIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFZhcmlhYmxlXHJcbntcclxuICAgIGdldCgpOmFueTtcclxuICAgIHNldD8odmFsdWU6YW55KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRWYXJpYWJsZUh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCB2YXJpYWJsZSBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUodmFyaWFibGU6c3RyaW5nLCBpbXBsOkdyaWRWYXJpYWJsZSk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIGdldCh2YXJpYWJsZTpzdHJpbmcpOmFueTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHNldCh2YXJpYWJsZTpzdHJpbmcsIHZhbHVlOmFueSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZUhvb2tcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVPdmVycmlkZVxyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6YW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGhvb2sgdG8gdGhlIHNwZWNpZmllZCBzaWduYWwgdGhhdCBlbmFibGVzIGV4dGVuc2lvbnMgdG8gb3ZlcnJpZGUgZ3JpZCBiZWhhdmlvclxyXG4gICAgICogZGVmaW5lZCBpbiB0aGUgY29yZSBvciBvdGhlciBleHRlbnNpb25zLlxyXG4gICAgICovXHJcbiAgICBob29rKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazphbnkpOnZvaWQ7XHJcblxyXG4gICAgb3ZlcnJpZGUocm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOmFueSk6YW55O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2lnbmFscyB0aGF0IGEgcm91dGluZSBpcyBhYm91dCB0byBydW4gdGhhdCBjYW4gYmUgaG9va2VkIG9yIG92ZXJyaWRkZW4gYnkgZXh0ZW5zaW9ucy4gIEFyZ3VtZW50c1xyXG4gICAgICogc2hvdWxkIGJlIHN1cHBvcnRpbmcgZGF0YSBvciByZWxldmFudCBvYmplY3RzIHRvIHRoZSByb3V0aW5lLiAgVGhlIHZhbHVlIHJldHVybmVkIHdpbGwgYmUgYHRydWVgXHJcbiAgICAgKiBpZiB0aGUgcm91dGluZSBoYXMgYmVlbiBvdmVycmlkZGVuIGJ5IGFuIGV4dGVuc2lvbi5cclxuICAgICAqL1xyXG4gICAgc2lnbmFsKHJvdXRpbmU6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTpib29sZWFuO1xyXG59XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50cyB0aGUgY29yZSBvZiB0aGUgR3JpZCBleHRlbnNpYmlsaXR5IHN5c3RlbS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBHcmlkS2VybmVsXHJcbntcclxuICAgIHB1YmxpYyByZWFkb25seSBjb21tYW5kczpHcmlkQ29tbWFuZEh1YiA9IG5ldyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwoKTtcclxuICAgIHB1YmxpYyByZWFkb25seSByb3V0aW5lczpHcmlkUm91dGluZUh1YiA9IG5ldyBHcmlkS2VybmVsUm91dGluZUh1YkltcGwoKTtcclxuICAgIHB1YmxpYyByZWFkb25seSB2YXJpYWJsZXM6R3JpZFZhcmlhYmxlSHViID0gbmV3IEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwoKTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXI6KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSkgPT4gdm9pZClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXhwb3J0SW50ZXJmYWNlKHRhcmdldD86YW55KTphbnlcclxuICAgIHtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwge30gYXMgYW55O1xyXG5cclxuICAgICAgICBsZXQgY29tbWFuZHMgPSB0aGlzLmNvbW1hbmRzWydzdG9yZSddIGFzIE9iamVjdE1hcDxHcmlkQ29tbWFuZD47XHJcbiAgICAgICAgbGV0IHZhcmlhYmxlcyA9IHRoaXMudmFyaWFibGVzWydzdG9yZSddIGFzIE9iamVjdE1hcDxHcmlkVmFyaWFibGU+O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBuIGluIGNvbW1hbmRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGFyZ2V0W25dID0gY29tbWFuZHNbbl07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBuIGluIHZhcmlhYmxlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIG4sIHZhcmlhYmxlc1tuXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnN0YWxsKGV4dDphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBjb21tYW5kcywgdmFyaWFibGVzIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoZXh0WydfX2tlcm5lbCddKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0V4dGVuc2lvbiBhcHBlYXJzIHRvIGhhdmUgYWxyZWFkeSBiZWVuIGluc3RhbGxlZCBpbnRvIHRoaXMgb3IgYW5vdGhlciBncmlkLi4uPyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRbJ19fa2VybmVsJ10gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgY21kcyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6Y29tbWFuZHMnLCBleHQpIHx8IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY21kcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbW1hbmRzLmRlZmluZShjLm5hbWUsIGMuaW1wbC5iaW5kKGV4dCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhcnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOnZhcmlhYmxlcycsIGV4dCkgfHwgW107XHJcbiAgICAgICAgZm9yIChsZXQgdiBvZiB2YXJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyaWFibGVzLmRlZmluZSh2Lm5hbWUsIHtcclxuICAgICAgICAgICAgICAgIGdldDogKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2LmtleV07IH0pLmJpbmQoZXh0KSxcclxuICAgICAgICAgICAgICAgIHNldDogISF2Lm11dGFibGUgPyAoZnVuY3Rpb24odmFsKSB7IHRoaXNbdi5rZXldID0gdmFsOyB9KS5iaW5kKGV4dCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbENvbW1hbmRIdWJJbXBsIGltcGxlbWVudHMgR3JpZENvbW1hbmRIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBzdG9yZTpPYmplY3RNYXA8R3JpZENvbW1hbmQ+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVmaW5lKGNvbW1hbmQ6c3RyaW5nLCBpbXBsOkdyaWRDb21tYW5kKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVbY29tbWFuZF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnQ29tbWFuZCB3aXRoIG5hbWUgYWxyZWFkeSByZWdpc3RlcmVkOiAnICsgY29tbWFuZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVbY29tbWFuZF0gPSBpbXBsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZXMgdGhlIHNwZWNpZmllZCBncmlkIGNvbW1hbmQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleGVjKGNvbW1hbmQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW2NvbW1hbmRdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW1wbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCBjb21tYW5kOiAnICsgY29tbWFuZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRSb3V0aW5lSHViXHJcbntcclxuICAgIHByaXZhdGUgaG9va3M6T2JqZWN0TWFwPEdyaWRSb3V0aW5lSG9va1tdPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBvdmVycmlkZXM6T2JqZWN0TWFwPEdyaWRSb3V0aW5lT3ZlcnJpZGU+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBob29rKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazpHcmlkUm91dGluZUhvb2spOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuaG9va3Nbcm91dGluZV0gfHwgKHRoaXMuaG9va3Nbcm91dGluZV0gPSBbXSk7XHJcbiAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb3ZlcnJpZGUocm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOkdyaWRSb3V0aW5lT3ZlcnJpZGUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2lnbmFscyB0aGF0IGEgcm91dGluZSBpcyBhYm91dCB0byBydW4gdGhhdCBjYW4gYmUgaG9va2VkIG9yIG92ZXJyaWRkZW4gYnkgZXh0ZW5zaW9ucy4gIEFyZ3VtZW50c1xyXG4gICAgICogc2hvdWxkIGJlIHN1cHBvcnRpbmcgZGF0YSBvciByZWxldmFudCBvYmplY3RzIHRvIHRoZSByb3V0aW5lLiAgVGhlIHZhbHVlIHJldHVybmVkIHdpbGwgYmUgYHRydWVgXHJcbiAgICAgKiBpZiB0aGUgcm91dGluZSBoYXMgYmVlbiBvdmVycmlkZGVuIGJ5IGFuIGV4dGVuc2lvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNpZ25hbChyb3V0aW5lOnN0cmluZywgYXJnczphbnlbXSwgaW1wbDpGdW5jdGlvbik6YW55XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhgYmVmb3JlOiR7cm91dGluZX1gLCBhcmdzKTtcclxuXHJcbiAgICAgICAgaWYgKCEhdGhpcy5vdmVycmlkZXNbcm91dGluZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhcmdzLnB1c2goaW1wbCk7XHJcbiAgICAgICAgICAgIGltcGwgPSB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXN1bHQgPSBpbXBsLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG5cclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKHJvdXRpbmUsIGFyZ3MpO1xyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3MoYGFmdGVyOiR7cm91dGluZX1gLCBhcmdzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGludm9rZUhvb2tzKHJvdXRpbmU6c3RyaW5nLCBhcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmhvb2tzW3JvdXRpbmVdO1xyXG5cclxuICAgICAgICBpZiAobGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGhvb2sgb2YgbGlzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaG9vay5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRWYXJpYWJsZUh1YlxyXG57XHJcbiAgICBwcml2YXRlIHN0b3JlOk9iamVjdE1hcDxHcmlkVmFyaWFibGU+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGRlZmluZSh2YXJpYWJsZTpzdHJpbmcsIGltcGw6R3JpZFZhcmlhYmxlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVbdmFyaWFibGVdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1ZhcmlhYmxlIHdpdGggbmFtZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVbdmFyaWFibGVdID0gaW1wbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGltcGwuZ2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW3ZhcmlhYmxlXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpbXBsLnNldClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaW1wbC5zZXQodmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ0Nhbm5vdCBzZXQgcmVhZG9ubHkgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBiYXNlIGludGVyZmFjZSBvZiBhIHdpZGdldC4gIEEgd2lkZ2V0IGlzIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBVSSBlbGVtZW50IHdpdGhpbiB0aGUgY29udGV4dCBvZlxyXG4gKiBhIGdyaWQuICBJdCBjYW4gYmUgY29tcG9zZWQgb2Ygb25lIG9yIG1vcmUgRE9NIGVsZW1lbnRzIGFuZCBiZSBpbnRlcmFjdGFibGUgb3Igc3RhdGljLiAgVGhlIFdpZGdldCBpbnRlcmZhY2VzXHJcbiAqIHByb3ZpZGVzIGEgY29tbW9uIGludGVyZmFjZSB0aHJvdWdoIHdoaWNoIG1vZHVsZXMgb3IgY29uc3VtZXJzIGNhbiBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgRE9NIGVsZW1lbnRzIG9mIGEgd2lkZ2V0XHJcbiAqIGFuZCBiYXNpYyBtZXRob2RzIHRoYXQgZWFzZSB0aGUgbWFuaXB1bGF0aW9uIG9mIHdpZGdldHMuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdpZGdldFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIFRoZSByb290IEhUTUxFbGVtZW50IG9mIHRoZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHJvb3Q6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIGEgUmVjdCBvYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIFdpZGdldCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHZpZXdSZWN0OlJlY3Q7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlcyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBoaWRlKCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHNob3coKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aXNpYmxlXHJcbiAgICAgKi9cclxuICAgIHRvZ2dsZSh2aXNpYmxlOmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhbiBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBXaWRnZXQgaW1wbGVtZW50YXRpb25zIHRoYXQgYXJlIGV4cGVjdGVkIHRvIHJlcHJlc2VudCBXaWRnZXRzIHdpdGhcclxuICogYWJzb2x1dGVseSBwb3NpdGlvbmVkIHJvb3QgZWxlbWVudHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQWJzV2lkZ2V0QmFzZTxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+IGltcGxlbWVudHMgV2lkZ2V0XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByb290OlQpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIGEgUmVjdCBvYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIFdpZGdldCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgdmlld1JlY3QoKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0XHJcbiAgICAgICAgKFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMucm9vdC5zdHlsZS5sZWZ0KSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLnJvb3Quc3R5bGUudG9wKSxcclxuICAgICAgICAgICAgdGhpcy5yb290LmNsaWVudFdpZHRoLFxyXG4gICAgICAgICAgICB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmVzIHRoZSBXaWRnZXQgdG8gdGhlIHNwZWNpZmllZCBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpZXdSZWN0XHJcbiAgICAgKiBAcGFyYW0gYW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ290byh2aWV3UmVjdDpSZWN0TGlrZSwgYXV0b1Nob3c6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoYXV0b1Nob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBEb20uc2hvdyh0aGlzLnJvb3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnJvb3QsIHtcclxuICAgICAgICAgICAgbGVmdDogYCR7dmlld1JlY3QubGVmdCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB0b3A6IGAke3ZpZXdSZWN0LnRvcCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dmlld1JlY3Qud2lkdGggKyAxfXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt2aWV3UmVjdC5oZWlnaHQgKyAxfXB4YCxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6IGBoaWRkZW5gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZXMgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhpZGUoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLmhpZGUodGhpcy5yb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzaG93KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIHRvZ2dsZSh2aXNpYmxlOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20udG9nZ2xlKHRoaXMucm9vdCwgdmlzaWJsZSlcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudFN1YnNjcmlwdGlvblxyXG57XHJcbiAgICBjYW5jZWwoKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50Q2FsbGJhY2tcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIG9uKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb247XHJcblxyXG4gICAgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZDtcclxuXHJcbiAgICBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHByaXZhdGUgYnVja2V0czphbnkgPSB7fTtcclxuXHJcbiAgICBwdWJsaWMgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KS5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4geyBjYW5jZWw6ICgpID0+IHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjaykgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGxldCBpZHggPSBsaXN0LmluZGV4T2YoY2FsbGJhY2spO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vIGlmICghZXZlbnQubWF0Y2goJ21vdXNlJykgJiYgIWV2ZW50Lm1hdGNoKCdrZXknKSAmJiAhZXZlbnQubWF0Y2goJ2RyYWcnKSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGV2ZW50LCAuLi5hcmdzKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDYWxsYmFja0xpc3QoZXZlbnQ6c3RyaW5nKTpFdmVudENhbGxiYWNrW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5idWNrZXRzW2V2ZW50XSB8fCAodGhpcy5idWNrZXRzW2V2ZW50XSA9IFtdKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFBhZGRpbmcgfSBmcm9tICcuLi8uLi9nZW9tL1BhZGRpbmcnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZFJvdyB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJvdyc7XHJcbmltcG9ydCB7IFJlY3QsIFJlY3RMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbnR5cGUgQ2VsbENvbFJvd0xvb2t1cCA9IE9iamVjdEluZGV4PE9iamVjdEluZGV4PEdyaWRDZWxsPj47XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRMYXlvdXRSZWdpb248VD4gZXh0ZW5kcyBSZWN0TGlrZVxyXG57XHJcbiAgICByZWFkb25seSByZWY6VDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXlvdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjb21wdXRlKG1vZGVsOkdyaWRNb2RlbCwgcGFkZGluZzpQYWRkaW5nKTpHcmlkTGF5b3V0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvbExvb2t1cCA9IDxPYmplY3RJbmRleDxHcmlkQ29sdW1uPj5tb2RlbC5jb2x1bW5zLnJlZHVjZSgodCwgeCkgPT4geyB0W3gucmVmXSA9IHg7IHJldHVybiB0IH0sIHt9KTtcclxuICAgICAgICBsZXQgcm93TG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRSb3c+Pm1vZGVsLnJvd3MucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCBjZWxsTG9va3VwID0gYnVpbGRDZWxsTG9va3VwKG1vZGVsLmNlbGxzKTsgLy9ieSBjb2wgdGhlbiByb3dcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSBhbGwgZXhwZWN0ZWQgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGxldCBtYXhDb2wgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LmNvbFJlZiArICh4LmNvbFNwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuICAgICAgICBsZXQgbWF4Um93ID0gbW9kZWwuY2VsbHMubWFwKHggPT4geC5yb3dSZWYgKyAoeC5yb3dTcGFuIC0gMSkpLnJlZHVjZSgodCwgeCkgPT4gdCA+IHggPyB0IDogeCwgMCk7XHJcblxyXG4gICAgICAgIC8vIEdlbmVyYXRlIG1pc3NpbmcgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heENvbDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKGNvbExvb2t1cFtpXSB8fCAoY29sTG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkQ29sdW1uKGkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heFJvdzsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKHJvd0xvb2t1cFtpXSB8fCAocm93TG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkUm93KGkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHdpZHRoIGFuZCBoZWlnaHQgb2Ygd2hvbGUgZ3JpZFxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8udmFsdWVzKGNvbExvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC53aWR0aCwgMCkgKyBwYWRkaW5nLmhvcml6b250YWw7XHJcbiAgICAgICAgbGV0IGhlaWdodCA9IF8udmFsdWVzKHJvd0xvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC5oZWlnaHQsIDApICsgcGFkZGluZy52ZXJ0aWNhbDtcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgbGF5b3V0IHJlZ2lvbnMgZm9yIHRoZSB2YXJpb3VzIGJpdHNcclxuICAgICAgICBsZXQgY29sUmVnczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSA9IFtdO1xyXG4gICAgICAgIGxldCByb3dSZWdzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdID0gW107XHJcbiAgICAgICAgbGV0IGNlbGxSZWdzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdID0gW107XHJcblxyXG4gICAgICAgIGxldCBhY2NMZWZ0ID0gcGFkZGluZy5sZWZ0O1xyXG4gICAgICAgIGZvciAobGV0IGNpID0gMDsgY2kgPD0gbWF4Q29sOyBjaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNvbCA9IGNvbExvb2t1cFtjaV07XHJcblxyXG4gICAgICAgICAgICBjb2xSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBjb2wucmVmLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgIHRvcDogMCxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgYWNjVG9wID0gcGFkZGluZy50b3A7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHJpID0gMDsgcmkgPD0gbWF4Um93OyByaSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcm93ID0gcm93TG9va3VwW3JpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2kgPT09IDApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93UmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiByb3cucmVmLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGFjY1RvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHJvdy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxMb29rdXBbY2ldICE9PSB1bmRlZmluZWQgJiYgY2VsbExvb2t1cFtjaV1bcmldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBjZWxsTG9va3VwW2NpXVtyaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGFjY1RvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGNvbC53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByb3cuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFjY1RvcCArPSByb3cuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhY2NMZWZ0ICs9IGNvbC53aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgR3JpZExheW91dCh3aWR0aCwgaGVpZ2h0LCBjb2xSZWdzLCByb3dSZWdzLCBjZWxsUmVncywgY2VsbExvb2t1cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbnM6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93czpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXTtcclxuICAgIHB1YmxpYyByZWFkb25seSBjZWxsczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXTtcclxuXHJcbiAgICBwcml2YXRlIGNlbGxMb29rdXA6Q2VsbENvbFJvd0xvb2t1cDtcclxuICAgIHByaXZhdGUgY29sdW1uSW5kZXg6T2JqZWN0SW5kZXg8R3JpZExheW91dFJlZ2lvbjxudW1iZXI+PjtcclxuICAgIHByaXZhdGUgcm93SW5kZXg6T2JqZWN0SW5kZXg8R3JpZExheW91dFJlZ2lvbjxudW1iZXI+PjtcclxuICAgIHByaXZhdGUgY2VsbEluZGV4Ok9iamVjdE1hcDxHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz4+O1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoXHJcbiAgICAgICAgd2lkdGg6bnVtYmVyLCBcclxuICAgICAgICBoZWlnaHQ6bnVtYmVyLCBcclxuICAgICAgICBjb2x1bW5zOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdLFxyXG4gICAgICAgIHJvd3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10sXHJcbiAgICAgICAgY2VsbHM6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W10sXHJcbiAgICAgICAgY2VsbExvb2t1cDpDZWxsQ29sUm93TG9va3VwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcbiAgICAgICAgdGhpcy5jZWxscyA9IGNlbGxzO1xyXG5cclxuICAgICAgICB0aGlzLmNlbGxMb29rdXAgPSBjZWxsTG9va3VwO1xyXG4gICAgICAgIHRoaXMuY29sdW1uSW5kZXggPSBfLmluZGV4KGNvbHVtbnMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMucm93SW5kZXggPSBfLmluZGV4KHJvd3MsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY2VsbEluZGV4ID0gXy5pbmRleChjZWxscywgeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Q29sdW1uKHJlZjpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uSW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNvbHVtblJhbmdlKGZyb21SZWY6bnVtYmVyLCB0b1JlZkV4Om51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlrZXMgPSBbXSBhcyBSZWN0TGlrZVtdOyAgICAgICAgXHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmcm9tUmVmOyBpIDwgdG9SZWZFeDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlrZXMucHVzaCh0aGlzLnF1ZXJ5Q29sdW1uKGkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbU1hbnkobGlrZXMubWFwKFJlY3QuZnJvbUxpa2UpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlSb3cocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Um93UmFuZ2UoZnJvbVJlZjpudW1iZXIsIHRvUmVmRXg6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaWtlcyA9IFtdIGFzIFJlY3RMaWtlW107ICAgICAgICBcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZyb21SZWY7IGkgPCB0b1JlZkV4OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaWtlcy5wdXNoKHRoaXMucXVlcnlSb3coaSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tTWFueShsaWtlcy5tYXAoUmVjdC5mcm9tTGlrZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNlbGwocmVmOnN0cmluZyk6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jZWxsSW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ29sdW1ucyhyZWdpb246UmVjdExpa2UpOm51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uc1xyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gUmVjdC5wcm90b3R5cGUuaW50ZXJzZWN0cy5jYWxsKHgsIHJlZ2lvbikpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVSb3dzKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZUNlbGxzKHJlZ2lvbjpSZWN0TGlrZSk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICBsZXQgY29scyA9IHRoaXMuY2FwdHVyZUNvbHVtbnMocmVnaW9uKTtcclxuICAgICAgICBsZXQgcm93cyA9IHRoaXMuY2FwdHVyZVJvd3MocmVnaW9uKTtcclxuICAgICAgICBsZXQgY2VsbHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNvbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCByIG9mIHJvd3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5jZWxsTG9va3VwW2NdW3JdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhY2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNlbGxzO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZENlbGxMb29rdXAoY2VsbHM6R3JpZENlbGxbXSk6Q2VsbENvbFJvd0xvb2t1cFxyXG57XHJcbiAgICBsZXQgaXggPSB7fTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgIHtcclxuICAgICAgICBsZXQgY2l4ID0gaXhbYy5jb2xSZWZdIHx8IChpeFtjLmNvbFJlZl0gPSB7fSk7XHJcbiAgICAgICAgY2l4W2Mucm93UmVmXSA9IGM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBpeDtcclxufSIsIi8qKlxyXG4gKiBFbWJlZGRpbmcgb2YgQ2xpcGJvYXJkLmpzIC0gaHR0cHM6Ly9naXRodWIuY29tL3plbm9yb2NoYS9jbGlwYm9hcmQuanMvXHJcbiAqXHJcbiAqIEFmdGVyIHZhcmlvdXMgYXR0ZW1wdHMsIEkgd2FzIHVuYWJsZSB0byBucG0gaW5zdGFsbCBpbmNsdWRpbmcgdHlwZXMgZWZmZWN0aXZlbHkgYW5kIGJlY2F1c2UgYW4gaW5kZXguanMgaXMgbm90XHJcbiAqIHVzZWQgSSBjYW5ub3QgdXNlIHRoZSBUeXBlU2NyaXB0IDIuMSB1bmtub3duIG1vZHVsZSBpbXBvcnQsIHNvIHJlc29ydGluZyB0byBsb2NhbCBlbWJlZGRlZCB2ZXJzaW9uLiAgV2lsbCByZW1vdmVcclxuICogaW4gdGhlIGZ1dHVyZSBpZiBwb3NzaWJsZS5cclxuICpcclxuICogTW9kaWZpY2F0aW9ucyBoYXZlIGJlZW4gbWFkZSB0byBtYWtlIHRoZSBjb2RlIGNvbXBpbGU6XHJcbiAqIC0gUmVtb3ZlZCBQcm9taXNlIHBvbHlmaWxsIChpbXBvcnRlZCBpbnN0ZWFkKVxyXG4gKiAtIFJlc3RydWN0dXJlZCBleHBvcnQgYW5kIGFkZGVkIHR5cGVkIGludGVyZmFjZVxyXG4gKiAtIFNvbWUgY2hhbmdlcyB0byBwcmV2ZW50IHR5cGUgY2hlY2tpbmcgd2hlcmUgdW5kZXNpcmVkXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gJ2VzNi1wcm9taXNlJztcclxuXHJcbi8vRGVjbGFyZSB3aW5kb3cgYXMgYW4gYW55IHZhciBhbGlhcyB0byBwcmV2ZW50IFRTIG1vYW5pbmcuLi5cclxubGV0IHduZCA9IHdpbmRvdyBhcyBhbnk7XHJcblxyXG5jb25zdCBjbGlwYm9hcmQgPSB7fSBhcyBhbnk7XHJcblxyXG5jbGlwYm9hcmQuY29weSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX2RhdGEgPSBudWxsOyAvLyBNYXAgZnJvbSBkYXRhIHR5cGUgKGUuZy4gXCJ0ZXh0L2h0bWxcIikgdG8gdmFsdWUuXHJcbiAgICB2YXIgX2JvZ3VzU2VsZWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcclxuICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgX2RhdGEgPSBudWxsO1xyXG4gICAgICAgIGlmIChfYm9ndXNTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY29weVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YShrZXksIF9kYXRhW2tleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXb3JrYXJvdW5kIGZvciBTYWZhcmk6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTY1MjlcclxuICAgIGZ1bmN0aW9uIGJvZ3VzU2VsZWN0KCkge1xyXG4gICAgICAgIHZhciBzZWwgPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAvLyBJZiBcIm5vdGhpbmdcIiBpcyBzZWxlY3RlZC4uLlxyXG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgJiYgc2VsLmlzQ29sbGFwc2VkKSB7XHJcbiAgICAgICAgICAgIC8vIC4uLiB0ZW1wb3JhcmlseSBzZWxlY3QgdGhlIGVudGlyZSBib2R5LlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBXZSBzZWxlY3QgdGhlIGVudGlyZSBib2R5IGJlY2F1c2U6XHJcbiAgICAgICAgICAgIC8vIC0gaXQncyBndWFyYW50ZWVkIHRvIGV4aXN0LFxyXG4gICAgICAgICAgICAvLyAtIGl0IHdvcmtzICh1bmxpa2UsIHNheSwgZG9jdW1lbnQuaGVhZCwgb3IgcGhhbnRvbSBlbGVtZW50IHRoYXQgaXNcclxuICAgICAgICAgICAgLy8gICBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NKSxcclxuICAgICAgICAgICAgLy8gLSBpdCBkb2Vzbid0IHNlZW0gdG8gZmxpY2tlciAoZHVlIHRvIHRoZSBzeW5jaHJvbm91cyBjb3B5IGV2ZW50KSwgYW5kXHJcbiAgICAgICAgICAgIC8vIC0gaXQgYXZvaWRzIG1vZGlmeWluZyB0aGUgRE9NIChjYW4gdHJpZ2dlciBtdXRhdGlvbiBvYnNlcnZlcnMpLlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIHdlIGNhbid0IGRvIHByb3BlciBmZWF0dXJlIGRldGVjdGlvbiAod2UgYWxyZWFkeSBjaGVja2VkXHJcbiAgICAgICAgICAgIC8vIGRvY3VtZW50LnF1ZXJ5Q29tbWFuZEVuYWJsZWQoXCJjb3B5XCIpICwgd2hpY2ggYWN0dWFsbHkgZ2l2ZXMgYSBmYWxzZVxyXG4gICAgICAgICAgICAvLyBuZWdhdGl2ZSBmb3IgQmxpbmsgd2hlbiBub3RoaW5nIGlzIHNlbGVjdGVkKSBhbmQgVUEgc25pZmZpbmcgaXMgbm90XHJcbiAgICAgICAgICAgIC8vIHJlbGlhYmxlIChhIGxvdCBvZiBVQSBzdHJpbmdzIGNvbnRhaW4gXCJTYWZhcmlcIiksIHRoaXMgd2lsbCBhbHNvXHJcbiAgICAgICAgICAgIC8vIGhhcHBlbiBmb3Igc29tZSBicm93c2VycyBvdGhlciB0aGFuIFNhZmFyaS4gOi0oKVxyXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xyXG4gICAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMoZG9jdW1lbnQuYm9keSk7XHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSB7XCJ0ZXh0L3BsYWluXCI6IGRhdGF9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IHtcInRleHQvaHRtbFwiOiBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYm9ndXNTZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudC5leGVjQ29tbWFuZCBpcyBzeW5jaHJvbm91czogaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC1jbGlwYm9hcmQtYXBpcy0yMDE1MDQyMS8jaW50ZWdyYXRpb24td2l0aC1yaWNoLXRleHQtZWRpdGluZy1hcGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU28gd2UgY2FuIGNhbGwgcmVzb2x2ZVJlZigpIGJhY2sgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNvcHkuIFBlcmhhcHMgaXQncyBub3QgYXZhaWxhYmxlIGluIHlvdXIgYnJvd3Nlcj9cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmNsaXBib2FyZC5wYXN0ZSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX3Jlc29sdmU7XHJcbiAgICB2YXIgX2RhdGFUeXBlO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHZhciByZXNvbHZlID0gX3Jlc29sdmU7XHJcbiAgICAgICAgICAgIF9yZXNvbHZlID0gbnVsbDtcclxuICAgICAgICAgICAgcmVzb2x2ZShlLmNsaXBib2FyZERhdGEuZ2V0RGF0YShfZGF0YVR5cGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIF9pbnRlcmNlcHQgPSB0cnVlO1xyXG4gICAgICAgICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICAgICAgICAgIF9kYXRhVHlwZSA9IGRhdGFUeXBlIHx8IFwidGV4dC9wbGFpblwiO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5leGVjQ29tbWFuZChcInBhc3RlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJVbmFibGUgdG8gcGFzdGUuIFBhc3Rpbmcgb25seSB3b3JrcyBpbiBJbnRlcm5ldCBFeHBsb3JlciBhdCB0aGUgbW9tZW50LlwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLy8gSGFuZGxlIElFIGJlaGF2aW91ci5cclxuaWYgKHR5cGVvZiBDbGlwYm9hcmRFdmVudCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgdHlwZW9mIHduZC5jbGlwYm9hcmREYXRhICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG5cclxuICAgIGNsaXBib2FyZC5jb3B5ID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgLy8gSUUgc3VwcG9ydHMgc3RyaW5nIGFuZCBVUkwgdHlwZXM6IGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzY3NDQodj12cy44NSkuYXNweFxyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHN1cHBvcnQgdGhlIHN0cmluZyB0eXBlIGZvciBub3cuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIiAmJiAhKFwidGV4dC9wbGFpblwiIGluIGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBwcm92aWRlIGEgdGV4dC9wbGFpbiB0eXBlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0ckRhdGEgPSAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogZGF0YVtcInRleHQvcGxhaW5cIl0pO1xyXG4gICAgICAgICAgICB2YXIgY29weVN1Y2NlZWRlZCA9IHduZC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJUZXh0XCIsIHN0ckRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoY29weVN1Y2NlZWRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcHlpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY2xpcGJvYXJkLnBhc3RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9IHduZC5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJUZXh0XCIpO1xyXG4gICAgICAgICAgICBpZiAoc3RyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzdHJEYXRhKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIHJlamVjdGVkIHRoZSBwYXN0ZSByZXF1ZXN0LlxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlBhc3Rpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpcGJvYXJkT2JqZWN0XHJcbntcclxuICAgIGNvcHkodmFsOnN0cmluZ3xFbGVtZW50KTpQcm9taXNlPHZvaWQ+O1xyXG4gICAgcGFzdGUoKTpQcm9taXNlPHN0cmluZz47XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBDbGlwYm9hcmQgPSBjbGlwYm9hcmQ7Il19
