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
var PanExtension_1 = require("./extensions/extra/PanExtension");
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
    ext.PanExtension = PanExtension_1.PanExtension;
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
},{"./extensions/common/ClipboardExtension":7,"./extensions/common/EditingExtension":8,"./extensions/common/ScrollerExtension":9,"./extensions/common/SelectorExtension":10,"./extensions/compute/ComputeExtension":11,"./extensions/compute/JavaScriptComputeEngine":12,"./extensions/compute/WatchManager":13,"./extensions/extra/ClickZoneExtension":14,"./extensions/extra/PanExtension":15,"./extensions/history/HistoryExtension":16,"./extensions/history/HistoryManager":17,"./geom/Point":18,"./geom/Rect":19,"./misc/Base26":28,"./model/GridRange":33,"./model/default/DefaultGridCell":34,"./model/default/DefaultGridColumn":35,"./model/default/DefaultGridModel":36,"./model/default/DefaultGridRow":37,"./model/styled/Style":38,"./model/styled/StyledGridCell":39,"./ui/Extensibility":40,"./ui/GridElement":41,"./ui/GridKernel":42,"./ui/Widget":43,"./ui/internal/EventEmitter":44}],7:[function(require,module,exports){
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
var Tether = require("tether");
var Dom = require("../../misc/Dom");
var ScrollerExtension = (function () {
    function ScrollerExtension() {
    }
    ScrollerExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        grid.on('invalidate', function () { return _this.alignElements(); });
        grid.on('scroll', function () { return _this.alignElements(); });
    };
    ScrollerExtension.prototype.createElements = function (target) {
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
        var scrollerX = this.scrollerX = document.createElement('div');
        scrollerX.className = 'grid-scroller grid-scroller-x';
        scrollerX.addEventListener('scroll', this.onScrollHorizontal.bind(this));
        layer.appendChild(scrollerX);
        var wedgeX = this.wedgeX = document.createElement('div');
        scrollerX.appendChild(wedgeX);
        var scrollerY = this.scrollerY = document.createElement('div');
        scrollerY.className = 'grid-scroller grid-scroller-y';
        scrollerY.addEventListener('scroll', this.onScrollVertical.bind(this));
        layer.appendChild(scrollerY);
        var wedgeY = this.wedgeY = document.createElement('div');
        scrollerY.appendChild(wedgeY);
        Dom.css(this.scrollerX, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: this.grid.width + "px",
            height: '16px',
            left: '0px',
            bottom: '0px',
        });
        Dom.css(this.scrollerY, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: '16px',
            height: this.grid.height + "px",
            right: '0px',
            top: '0px',
        });
    };
    ScrollerExtension.prototype.alignElements = function () {
        Dom.css(this.scrollerX, {
            width: this.grid.width + "px",
        });
        Dom.css(this.wedgeX, {
            width: this.grid.virtualWidth + "px",
            height: '1px',
        });
        if (this.scrollerX.scrollLeft != this.grid.scrollLeft) {
            this.scrollerX.scrollLeft = this.grid.scrollLeft;
        }
        Dom.css(this.scrollerY, {
            height: this.grid.height + "px",
        });
        Dom.css(this.wedgeY, {
            width: '1px',
            height: this.grid.virtualHeight + "px",
        });
        if (this.scrollerY.scrollTop != this.grid.scrollTop) {
            this.scrollerY.scrollTop = this.grid.scrollTop;
        }
    };
    ScrollerExtension.prototype.onScrollHorizontal = function () {
        this.grid.scrollLeft = this.scrollerX.scrollLeft;
    };
    ScrollerExtension.prototype.onScrollVertical = function () {
        this.grid.scrollTop = this.scrollerY.scrollTop;
    };
    return ScrollerExtension;
}());
exports.ScrollerExtension = ScrollerExtension;
},{"../../misc/Dom":29,"tether":5}],10:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", { value: true });
var MouseInput_1 = require("../../input/MouseInput");
var Point_1 = require("../../geom/Point");
var Keys_1 = require("../../input/Keys");
var PanExtension = (function () {
    function PanExtension() {
    }
    PanExtension.prototype.init = function (grid, kernel) {
        var panning = false;
        var last = null;
        grid.on('keydown', function (e) {
            if (e.keyCode === Keys_1.Keys.SPACE) {
                panning = true;
                last = null;
            }
        });
        grid.on('keyup', function (e) {
            if (e.keyCode === Keys_1.Keys.SPACE) {
                panning = false;
                last = null;
            }
        });
        MouseInput_1.MouseInput.for(grid.root)
            .on('DRAG:PRIMARY', function (e) {
            if (!panning)
                return;
            if (last) {
                var next = new Point_1.Point(e.gridX, e.gridY);
                var delta = next.subtract(last);
                grid.scrollLeft -= delta.x;
                grid.scrollTop -= delta.y;
            }
            last = new Point_1.Point(e.gridX, e.gridY);
        });
        //grid.kernel.routines.override('beginEdit', (override:string, impl:any) =>
        //{
        //    if (panning)
        //        return false;
        //
        //    return impl(override);
        //});
        //grid.kernel.routines.override('doSelect', (cells:string[] = [], autoScroll:boolean, impl:any) =>
        //{
        //    if (panning)
        //        return false;
        //
        //    return impl(cells, autoScroll);
        //});
    };
    return PanExtension;
}());
exports.PanExtension = PanExtension;
},{"../../geom/Point":18,"../../input/Keys":24,"../../input/MouseInput":27}],16:[function(require,module,exports){
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
},{"../../input/KeyInput":23,"../../misc/Util":32,"../../ui/Extensibility":40,"../common/EditingExtension":8,"./HistoryManager":17}],17:[function(require,module,exports){
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
},{}],18:[function(require,module,exports){
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
        var kernel = _this.kernel = new GridKernel_1.GridKernel(_this.emit.bind(_this));
        ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(function (x) { return _this.forwardMouseEvent(x); });
        ['keydown', 'keypress', 'keyup']
            .forEach(function (x) { return _this.forwardKeyEvent(x); });
        _this.enableEnterExitEvents();
        return _this;
    }
    GridElement.create = function (target, initialModel) {
        var canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className;
        canvas.tabIndex = target.tabIndex || 0;
        target.parentNode.insertBefore(canvas, target);
        target.parentNode.removeChild(target);
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
    Object.defineProperty(GridElement.prototype, "scroll", {
        get: function () {
            return new Point_1.Point(this.scrollLeft, this.scrollTop);
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
        if (dest.left < 0) {
            this.scrollLeft += dest.left;
        }
        if (dest.right > this.width) {
            this.scrollLeft += dest.right - this.width;
        }
        if (dest.top < 0) {
            this.scrollTop += dest.top;
        }
        if (dest.bottom > this.height) {
            this.scrollTop += dest.bottom - this.height;
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
        this.layout = GridLayout_1.GridLayout.compute(this.model);
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
    Property_1.property(0, function (t) { t.redraw(); t.emit('scroll'); }),
    __metadata("design:type", Number)
], GridElement.prototype, "scrollLeft", void 0);
__decorate([
    Property_1.property(0, function (t) { t.redraw(); t.emit('scroll'); }),
    __metadata("design:type", Number)
], GridElement.prototype, "scrollTop", void 0);
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
},{"../geom/Point":18,"../geom/Rect":19,"../misc/Property":30,"../misc/Util":32,"../model/GridRange":33,"../model/default/DefaultGridModel":36,"./GridKernel":42,"./internal/EventEmitter":44,"./internal/GridLayout":45}],42:[function(require,module,exports){
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
    GridLayout.compute = function (model) {
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
        var width = _.values(colLookup).reduce(function (t, x) { return t + x.width; }, 0);
        var height = _.values(rowLookup).reduce(function (t, x) { return t + x.height; }, 0);
        // Compute the layout regions for the various bits
        var colRegs = [];
        var rowRegs = [];
        var cellRegs = [];
        var accLeft = 0;
        for (var ci = 0; ci <= maxCol; ci++) {
            var col = colLookup[ci];
            colRegs.push({
                ref: col.ref,
                left: accLeft,
                top: 0,
                width: col.width,
                height: height,
            });
            var accTop = 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZXMvYmFzZXMuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXRoZXIvZGlzdC9qcy90ZXRoZXIuanMiLCJzcmMvYnJvd3Nlci50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9DbGlwYm9hcmRFeHRlbnNpb24udHMiLCJzcmMvZXh0ZW5zaW9ucy9jb21tb24vRWRpdGluZ0V4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9TY3JvbGxlckV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9TZWxlY3RvckV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUudHMiLCJzcmMvZXh0ZW5zaW9ucy9jb21wdXRlL1dhdGNoTWFuYWdlci50cyIsInNyYy9leHRlbnNpb25zL2V4dHJhL0NsaWNrWm9uZUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2V4dHJhL1BhbkV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeU1hbmFnZXIudHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9CYXNlMjYudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qcm9wZXJ0eS50cyIsInNyYy9taXNjL1JlZkdlbi50cyIsInNyYy9taXNjL1V0aWwudHMiLCJzcmMvbW9kZWwvR3JpZFJhbmdlLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDb2x1bW4udHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cudHMiLCJzcmMvbW9kZWwvc3R5bGVkL1N0eWxlLnRzIiwic3JjL21vZGVsL3N0eWxlZC9TdHlsZWRHcmlkQ2VsbC50cyIsInNyYy91aS9FeHRlbnNpYmlsaXR5LnRzIiwic3JjL3VpL0dyaWRFbGVtZW50LnRzIiwic3JjL3VpL0dyaWRLZXJuZWwudHMiLCJzcmMvdWkvV2lkZ2V0LnRzIiwic3JjL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlci50cyIsInNyYy91aS9pbnRlcm5hbC9HcmlkTGF5b3V0LnRzIiwic3JjL3ZlbmRvci9jbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwb0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3N0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUNyQixDQUFDO1lBQ0csS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUM7Z0JBQ0ksRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDO29CQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQztnQkFDbEMsSUFBSTtvQkFDQSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBQ0wsV0FBQztBQUFELENBeFBBLEFBd1BDO0FBdFBpQixjQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBRyxHQUFHLENBQUMsQ0FBQztBQUNSLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLFFBQUcsR0FBRyxFQUFFLENBQUM7QUFDVCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNmLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBTyxHQUFHLEVBQUUsQ0FBQztBQUNiLGNBQVMsR0FBRyxFQUFFLENBQUM7QUFDZixRQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ1QsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsV0FBTSxHQUFHLEVBQUUsQ0FBQztBQUNaLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FB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UyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDaEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVwRCxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDcEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0RCxJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQWMsQ0FBQztJQUMxRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FDdEMsQ0FBQztRQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLE9BQU8sQ0FBQyxDQUNyQyxDQUFDO1FBQ0csTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsR0FBRyxDQUFDLElBQUksR0FBTSxLQUFLLENBQUMsSUFBSSxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTSxDQUFDO0lBQzlHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDckMsR0FBRyxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFDNUIsR0FBRyxD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L0QsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUM7SUFFRixTQUFTLENBQUMsS0FBSyxHQUFHO1FBQ2QsTUFBTSxDQUFDLElBQUkscUJBQU8sQ0FBQyxVQUFTLE9BQU8sRUFBRSxNQUFNO1lBQ3ZDLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSix1Q0FBdUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQVFZLFFBQUEsU0FBUyxHQUFHLFNBQVMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBiYXNlcy5qc1xuLy8gVXRpbGl0eSBmb3IgY29udmVydGluZyBudW1iZXJzIHRvL2Zyb20gZGlmZmVyZW50IGJhc2VzL2FscGhhYmV0cy5cbi8vIFNlZSBSRUFETUUubWQgZm9yIGRldGFpbHMuXG5cbnZhciBiYXNlcyA9ICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogKHdpbmRvdy5CYXNlcyA9IHt9KSk7XG5cbi8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIG51bWJlciBmb3IgdGhlIGdpdmVuIGFscGhhYmV0OlxuYmFzZXMudG9BbHBoYWJldCA9IGZ1bmN0aW9uIChudW0sIGFscGhhYmV0KSB7XG4gICAgdmFyIGJhc2UgPSBhbHBoYWJldC5sZW5ndGg7XG4gICAgdmFyIGRpZ2l0cyA9IFtdOyAgICAvLyB0aGVzZSB3aWxsIGJlIGluIHJldmVyc2Ugb3JkZXIgc2luY2UgYXJyYXlzIGFyZSBzdGFja3NcblxuICAgIC8vIGV4ZWN1dGUgYXQgbGVhc3Qgb25jZSwgZXZlbiBpZiBudW0gaXMgMCwgc2luY2Ugd2Ugc2hvdWxkIHJldHVybiB0aGUgJzAnOlxuICAgIGRvIHtcbiAgICAgICAgZGlnaXRzLnB1c2gobnVtICUgYmFzZSk7ICAgIC8vIFRPRE8gaGFuZGxlIG5lZ2F0aXZlcyBwcm9wZXJseT9cbiAgICAgICAgbnVtID0gTWF0aC5mbG9vcihudW0gLyBiYXNlKTtcbiAgICB9IHdoaWxlIChudW0gPiAwKTtcblxuICAgIHZhciBjaGFycyA9IFtdO1xuICAgIHdoaWxlIChkaWdpdHMubGVuZ3RoKSB7XG4gICAgICAgIGNoYXJzLnB1c2goYWxwaGFiZXRbZGlnaXRzLnBvcCgpXSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbn07XG5cbi8vIFJldHVybnMgYW4gaW50ZWdlciByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gc3RyaW5nIGZvciB0aGUgZ2l2ZW4gYWxwaGFiZXQ6XG5iYXNlcy5mcm9tQWxwaGFiZXQgPSBmdW5jdGlvbiAoc3RyLCBhbHBoYWJldCkge1xuICAgIHZhciBiYXNlID0gYWxwaGFiZXQubGVuZ3RoO1xuICAgIHZhciBwb3MgPSAwO1xuICAgIHZhciBudW0gPSAwO1xuICAgIHZhciBjO1xuXG4gICAgd2hpbGUgKHN0ci5sZW5ndGgpIHtcbiAgICAgICAgYyA9IHN0cltzdHIubGVuZ3RoIC0gMV07XG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHIoMCwgc3RyLmxlbmd0aCAtIDEpO1xuICAgICAgICBudW0gKz0gTWF0aC5wb3coYmFzZSwgcG9zKSAqIGFscGhhYmV0LmluZGV4T2YoYyk7XG4gICAgICAgIHBvcysrO1xuICAgIH1cblxuICAgIHJldHVybiBudW07XG59O1xuXG4vLyBLbm93biBhbHBoYWJldHM6XG5iYXNlcy5OVU1FUkFMUyA9ICcwMTIzNDU2Nzg5JztcbmJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JztcbmJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFID0gYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UudG9VcHBlckNhc2UoKTtcbmJhc2VzLktOT1dOX0FMUEhBQkVUUyA9IHt9O1xuXG4vLyBFYWNoIG9mIHRoZSBudW1iZXIgb25lcywgc3RhcnRpbmcgZnJvbSBiYXNlLTIgKGJhc2UtMSBkb2Vzbid0IG1ha2Ugc2Vuc2U/KTpcbmZvciAodmFyIGkgPSAyOyBpIDw9IDEwOyBpKyspIHtcbiAgICBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbaV0gPSBiYXNlcy5OVU1FUkFMUy5zdWJzdHIoMCwgaSk7XG59XG5cbi8vIE5vZGUncyBuYXRpdmUgaGV4IGlzIDAtOSBmb2xsb3dlZCBieSAqbG93ZXJjYXNlKiBhLWYsIHNvIHdlJ2xsIHRha2UgdGhhdFxuLy8gYXBwcm9hY2ggZm9yIGV2ZXJ5dGhpbmcgZnJvbSBiYXNlLTExIHRvIGJhc2UtMTY6XG5mb3IgKHZhciBpID0gMTE7IGkgPD0gMTY7IGkrKykge1xuICAgIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tpXSA9IGJhc2VzLk5VTUVSQUxTICsgYmFzZXMuTEVUVEVSU19MT1dFUkNBU0Uuc3Vic3RyKDAsIGkgLSAxMCk7XG59XG5cbi8vIFdlIGFsc28gbW9kZWwgYmFzZS0zNiBvZmYgb2YgdGhhdCwganVzdCB1c2luZyB0aGUgZnVsbCBsZXR0ZXIgYWxwaGFiZXQ6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbMzZdID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRTtcblxuLy8gQW5kIGJhc2UtNjIgd2lsbCBiZSB0aGUgdXBwZXJjYXNlIGxldHRlcnMgYWRkZWQ6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbNjJdID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRSArIGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFO1xuXG4vLyBGb3IgYmFzZS0yNiwgd2UnbGwgYXNzdW1lIHRoZSB1c2VyIHdhbnRzIGp1c3QgdGhlIGxldHRlciBhbHBoYWJldDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1syNl0gPSBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRTtcblxuLy8gV2UnbGwgYWxzbyBhZGQgYSBzaW1pbGFyIGJhc2UtNTIsIGp1c3QgbGV0dGVycywgbG93ZXJjYXNlIHRoZW4gdXBwZXJjYXNlOlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzUyXSA9IGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0U7XG5cbi8vIEJhc2UtNjQgaXMgYSBmb3JtYWxseS1zcGVjaWZpZWQgYWxwaGFiZXQgdGhhdCBoYXMgYSBwYXJ0aWN1bGFyIG9yZGVyOlxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQgKGFuZCBOb2RlLmpzIGZvbGxvd3MgdGhpcyB0b28pXG4vLyBUT0RPIEZJWE1FIEJ1dCBvdXIgY29kZSBhYm92ZSBkb2Vzbid0IGFkZCBwYWRkaW5nISBEb24ndCB1c2UgdGhpcyB5ZXQuLi5cbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s2NF0gPSBiYXNlcy5MRVRURVJTX1VQUEVSQ0FTRSArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTlVNRVJBTFMgKyAnKy8nO1xuXG4vLyBGbGlja3IgYW5kIG90aGVycyBhbHNvIGhhdmUgYSBiYXNlLTU4IHRoYXQgcmVtb3ZlcyBjb25mdXNpbmcgY2hhcmFjdGVycywgYnV0XG4vLyB0aGVyZSBpc24ndCBjb25zZW5zdXMgb24gdGhlIG9yZGVyIG9mIGxvd2VyY2FzZSB2cy4gdXBwZXJjYXNlLi4uID0vXG4vLyBodHRwOi8vd3d3LmZsaWNrci5jb20vZ3JvdXBzL2FwaS9kaXNjdXNzLzcyMTU3NjE2NzEzNzg2MzkyL1xuLy8gaHR0cHM6Ly9lbi5iaXRjb2luLml0L3dpa2kvQmFzZTU4Q2hlY2tfZW5jb2RpbmcjQmFzZTU4X3N5bWJvbF9jaGFydFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvdWdhbC9iYXNlNTgvYmxvYi9tYXN0ZXIvbGliL2Jhc2U1OC5yYlxuLy8gaHR0cDovL2ljb2xvbWEuYmxvZ3Nwb3QuY29tLzIwMTAvMDMvY3JlYXRlLXlvdXItb3duLWJpdGx5LXVzaW5nLWJhc2U1OC5odG1sXG4vLyBXZSdsbCBhcmJpdHJhcmlseSBzdGF5IGNvbnNpc3RlbnQgd2l0aCB0aGUgYWJvdmUgYW5kIHVzaW5nIGxvd2VyY2FzZSBmaXJzdDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s1OF0gPSBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbNjJdLnJlcGxhY2UoL1swT2xJXS9nLCAnJyk7XG5cbi8vIEFuZCBEb3VnbGFzIENyb2NrZm9yZCBzaGFyZWQgYSBzaW1pbGFyIGJhc2UtMzIgZnJvbSBiYXNlLTM2OlxuLy8gaHR0cDovL3d3dy5jcm9ja2ZvcmQuY29tL3dybWcvYmFzZTMyLmh0bWxcbi8vIFVubGlrZSBvdXIgYmFzZS0zNiwgaGUgZXhwbGljaXRseSBzcGVjaWZpZXMgdXBwZXJjYXNlIGxldHRlcnNcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1szMl0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFLnJlcGxhY2UoL1tJTE9VXS9nLCAnJyk7XG5cbi8vIENsb3N1cmUgaGVscGVyIGZvciBjb252ZW5pZW5jZSBhbGlhc2VzIGxpa2UgYmFzZXMudG9CYXNlMzYoKTpcbmZ1bmN0aW9uIG1ha2VBbGlhcyAoYmFzZSwgYWxwaGFiZXQpIHtcbiAgICBiYXNlc1sndG9CYXNlJyArIGJhc2VdID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICByZXR1cm4gYmFzZXMudG9BbHBoYWJldChudW0sIGFscGhhYmV0KTtcbiAgICB9O1xuICAgIGJhc2VzWydmcm9tQmFzZScgKyBiYXNlXSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIGJhc2VzLmZyb21BbHBoYWJldChzdHIsIGFscGhhYmV0KTtcbiAgICB9O1xufVxuXG4vLyBEbyB0aGlzIGZvciBhbGwga25vd24gYWxwaGFiZXRzOlxuZm9yICh2YXIgYmFzZSBpbiBiYXNlcy5LTk9XTl9BTFBIQUJFVFMpIHtcbiAgICBpZiAoYmFzZXMuS05PV05fQUxQSEFCRVRTLmhhc093blByb3BlcnR5KGJhc2UpKSB7XG4gICAgICAgIG1ha2VBbGlhcyhiYXNlLCBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbYmFzZV0pO1xuICAgIH1cbn1cblxuLy8gQW5kIGEgZ2VuZXJpYyBhbGlhcyB0b286XG5iYXNlcy50b0Jhc2UgPSBmdW5jdGlvbiAobnVtLCBiYXNlKSB7XG4gICAgcmV0dXJuIGJhc2VzLnRvQWxwaGFiZXQobnVtLCBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbYmFzZV0pO1xufTtcblxuYmFzZXMuZnJvbUJhc2UgPSBmdW5jdGlvbiAoc3RyLCBiYXNlKSB7XG4gICAgcmV0dXJuIGJhc2VzLmZyb21BbHBoYWJldChzdHIsIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG59O1xuIiwiLyohXG4gKiBAb3ZlcnZpZXcgZXM2LXByb21pc2UgLSBhIHRpbnkgaW1wbGVtZW50YXRpb24gb2YgUHJvbWlzZXMvQSsuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAoYykgMjAxNCBZZWh1ZGEgS2F0eiwgVG9tIERhbGUsIFN0ZWZhbiBQZW5uZXIgYW5kIGNvbnRyaWJ1dG9ycyAoQ29udmVyc2lvbiB0byBFUzYgQVBJIGJ5IEpha2UgQXJjaGliYWxkKVxuICogQGxpY2Vuc2UgICBMaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZVxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3N0ZWZhbnBlbm5lci9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICA0LjAuNVxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gICAgKGdsb2JhbC5FUzZQcm9taXNlID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nO1xufVxuXG52YXIgX2lzQXJyYXkgPSB1bmRlZmluZWQ7XG5pZiAoIUFycmF5LmlzQXJyYXkpIHtcbiAgX2lzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG59IGVsc2Uge1xuICBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG59XG5cbnZhciBpc0FycmF5ID0gX2lzQXJyYXk7XG5cbnZhciBsZW4gPSAwO1xudmFyIHZlcnR4TmV4dCA9IHVuZGVmaW5lZDtcbnZhciBjdXN0b21TY2hlZHVsZXJGbiA9IHVuZGVmaW5lZDtcblxudmFyIGFzYXAgPSBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgcXVldWVbbGVuXSA9IGNhbGxiYWNrO1xuICBxdWV1ZVtsZW4gKyAxXSA9IGFyZztcbiAgbGVuICs9IDI7XG4gIGlmIChsZW4gPT09IDIpIHtcbiAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgaWYgKGN1c3RvbVNjaGVkdWxlckZuKSB7XG4gICAgICBjdXN0b21TY2hlZHVsZXJGbihmbHVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gIGN1c3RvbVNjaGVkdWxlckZuID0gc2NoZWR1bGVGbjtcbn1cblxuZnVuY3Rpb24gc2V0QXNhcChhc2FwRm4pIHtcbiAgYXNhcCA9IGFzYXBGbjtcbn1cblxudmFyIGJyb3dzZXJXaW5kb3cgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbnZhciBicm93c2VyR2xvYmFsID0gYnJvd3NlcldpbmRvdyB8fCB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgaXNOb2RlID0gdHlwZW9mIHNlbGYgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAoe30pLnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuLy8gdGVzdCBmb3Igd2ViIHdvcmtlciBidXQgbm90IGluIElFMTBcbnZhciBpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGltcG9ydFNjcmlwdHMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIG5vZGVcbmZ1bmN0aW9uIHVzZU5leHRUaWNrKCkge1xuICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jdWpvanMvd2hlbi9pc3N1ZXMvNDEwIGZvciBkZXRhaWxzXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICB9O1xufVxuXG4vLyB2ZXJ0eFxuZnVuY3Rpb24gdXNlVmVydHhUaW1lcigpIHtcbiAgaWYgKHR5cGVvZiB2ZXJ0eE5leHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZlcnR4TmV4dChmbHVzaCk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gIHZhciBpdGVyYXRpb25zID0gMDtcbiAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgbm9kZS5kYXRhID0gaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDI7XG4gIH07XG59XG5cbi8vIHdlYiB3b3JrZXJcbmZ1bmN0aW9uIHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICAvLyBTdG9yZSBzZXRUaW1lb3V0IHJlZmVyZW5jZSBzbyBlczYtcHJvbWlzZSB3aWxsIGJlIHVuYWZmZWN0ZWQgYnlcbiAgLy8gb3RoZXIgY29kZSBtb2RpZnlpbmcgc2V0VGltZW91dCAobGlrZSBzaW5vbi51c2VGYWtlVGltZXJzKCkpXG4gIHZhciBnbG9iYWxTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZ2xvYmFsU2V0VGltZW91dChmbHVzaCwgMSk7XG4gIH07XG59XG5cbnZhciBxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gcXVldWVbaV07XG4gICAgdmFyIGFyZyA9IHF1ZXVlW2kgKyAxXTtcblxuICAgIGNhbGxiYWNrKGFyZyk7XG5cbiAgICBxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICBxdWV1ZVtpICsgMV0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBsZW4gPSAwO1xufVxuXG5mdW5jdGlvbiBhdHRlbXB0VmVydHgoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHIgPSByZXF1aXJlO1xuICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgdmVydHhOZXh0ID0gdmVydHgucnVuT25Mb29wIHx8IHZlcnR4LnJ1bk9uQ29udGV4dDtcbiAgICByZXR1cm4gdXNlVmVydHhUaW1lcigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHVzZVNldFRpbWVvdXQoKTtcbiAgfVxufVxuXG52YXIgc2NoZWR1bGVGbHVzaCA9IHVuZGVmaW5lZDtcbi8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG5pZiAoaXNOb2RlKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VOZXh0VGljaygpO1xufSBlbHNlIGlmIChCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xufSBlbHNlIGlmIChpc1dvcmtlcikge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTWVzc2FnZUNoYW5uZWwoKTtcbn0gZWxzZSBpZiAoYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSBhdHRlbXB0VmVydHgoKTtcbn0gZWxzZSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgdmFyIF9hcmd1bWVudHMgPSBhcmd1bWVudHM7XG5cbiAgdmFyIHBhcmVudCA9IHRoaXM7XG5cbiAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3Iobm9vcCk7XG5cbiAgaWYgKGNoaWxkW1BST01JU0VfSURdID09PSB1bmRlZmluZWQpIHtcbiAgICBtYWtlUHJvbWlzZShjaGlsZCk7XG4gIH1cblxuICB2YXIgX3N0YXRlID0gcGFyZW50Ll9zdGF0ZTtcblxuICBpZiAoX3N0YXRlKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWxsYmFjayA9IF9hcmd1bWVudHNbX3N0YXRlIC0gMV07XG4gICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUNhbGxiYWNrKF9zdGF0ZSwgY2hpbGQsIGNhbGxiYWNrLCBwYXJlbnQuX3Jlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9KSgpO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gIH1cblxuICByZXR1cm4gY2hpbGQ7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yZXNvbHZlYCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlc29sdmVkIHdpdGggdGhlXG4gIHBhc3NlZCBgdmFsdWVgLiBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVzb2x2ZSgxKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoMSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZXNvbHZlXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBbnl9IHZhbHVlIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCB3aXRoXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgZnVsZmlsbGVkIHdpdGggdGhlIGdpdmVuXG4gIGB2YWx1ZWBcbiovXG5mdW5jdGlvbiByZXNvbHZlKG9iamVjdCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcbiAgX3Jlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5cbnZhciBQUk9NSVNFX0lEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDE2KTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBQRU5ESU5HID0gdm9pZCAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgPSAyO1xuXG52YXIgR0VUX1RIRU5fRVJST1IgPSBuZXcgRXJyb3JPYmplY3QoKTtcblxuZnVuY3Rpb24gc2VsZkZ1bGZpbGxtZW50KCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG59XG5cbmZ1bmN0aW9uIGNhbm5vdFJldHVybk93bigpIHtcbiAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihwcm9taXNlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgIHJldHVybiBHRVRfVEhFTl9FUlJPUjtcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgdHJ5IHtcbiAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgYXNhcChmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICB2YXIgZXJyb3IgPSB0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChzZWFsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgX3JlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgfVxuICB9LCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gRlVMRklMTEVEKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IFJFSkVDVEVEKSB7XG4gICAgX3JlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgfSBlbHNlIHtcbiAgICBzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHJldHVybiBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuJCQpIHtcbiAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IgJiYgdGhlbiQkID09PSB0aGVuICYmIG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IucmVzb2x2ZSA9PT0gcmVzb2x2ZSkge1xuICAgIGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICB9IGVsc2Uge1xuICAgIGlmICh0aGVuJCQgPT09IEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICB9IGVsc2UgaWYgKHRoZW4kJCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih0aGVuJCQpKSB7XG4gICAgICBoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbiQkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgX3JlamVjdChwcm9taXNlLCBzZWxmRnVsZmlsbG1lbnQoKSk7XG4gIH0gZWxzZSBpZiAob2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlLCBnZXRUaGVuKHZhbHVlKSk7XG4gIH0gZWxzZSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gIGlmIChwcm9taXNlLl9vbmVycm9yKSB7XG4gICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICB9XG5cbiAgcHVibGlzaChwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgcHJvbWlzZS5fc3RhdGUgPSBGVUxGSUxMRUQ7XG5cbiAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgIGFzYXAocHVibGlzaCwgcHJvbWlzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3JlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQ7XG4gIHByb21pc2UuX3Jlc3VsdCA9IHJlYXNvbjtcblxuICBhc2FwKHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgdmFyIF9zdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gIHZhciBsZW5ndGggPSBfc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgX3N1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgX3N1YnNjcmliZXJzW2xlbmd0aCArIEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICBfc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdID0gb25SZWplY3Rpb247XG5cbiAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgYXNhcChwdWJsaXNoLCBwYXJlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2gocHJvbWlzZSkge1xuICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGNoaWxkID0gdW5kZWZpbmVkLFxuICAgICAgY2FsbGJhY2sgPSB1bmRlZmluZWQsXG4gICAgICBkZXRhaWwgPSBwcm9taXNlLl9yZXN1bHQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICB9XG4gIH1cblxuICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiBFcnJvck9iamVjdCgpIHtcbiAgdGhpcy5lcnJvciA9IG51bGw7XG59XG5cbnZhciBUUllfQ0FUQ0hfRVJST1IgPSBuZXcgRXJyb3JPYmplY3QoKTtcblxuZnVuY3Rpb24gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICB0cnkge1xuICAgIHJldHVybiBjYWxsYmFjayhkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICByZXR1cm4gVFJZX0NBVENIX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSA9IHVuZGVmaW5lZCxcbiAgICAgIGVycm9yID0gdW5kZWZpbmVkLFxuICAgICAgc3VjY2VlZGVkID0gdW5kZWZpbmVkLFxuICAgICAgZmFpbGVkID0gdW5kZWZpbmVkO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHZhbHVlID0gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICBpZiAodmFsdWUgPT09IFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICB2YWx1ZSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIC8vIG5vb3BcbiAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICAgIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gUkVKRUNURUQpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVByb21pc2UocHJvbWlzZSwgcmVzb2x2ZXIpIHtcbiAgdHJ5IHtcbiAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIGUpO1xuICB9XG59XG5cbnZhciBpZCA9IDA7XG5mdW5jdGlvbiBuZXh0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG5mdW5jdGlvbiBtYWtlUHJvbWlzZShwcm9taXNlKSB7XG4gIHByb21pc2VbUFJPTUlTRV9JRF0gPSBpZCsrO1xuICBwcm9taXNlLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gdW5kZWZpbmVkO1xuICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IFtdO1xufVxuXG5mdW5jdGlvbiBFbnVtZXJhdG9yKENvbnN0cnVjdG9yLCBpbnB1dCkge1xuICB0aGlzLl9pbnN0YW5jZUNvbnN0cnVjdG9yID0gQ29uc3RydWN0b3I7XG4gIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoIXRoaXMucHJvbWlzZVtQUk9NSVNFX0lEXSkge1xuICAgIG1ha2VQcm9taXNlKHRoaXMucHJvbWlzZSk7XG4gIH1cblxuICBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgIHRoaXMubGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuICAgIHRoaXMuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IHRoaXMubGVuZ3RoIHx8IDA7XG4gICAgICB0aGlzLl9lbnVtZXJhdGUoKTtcbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIF9yZWplY3QodGhpcy5wcm9taXNlLCB2YWxpZGF0aW9uRXJyb3IoKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGlvbkVycm9yKCkge1xuICByZXR1cm4gbmV3IEVycm9yKCdBcnJheSBNZXRob2RzIG11c3QgYmUgcHJvdmlkZWQgYW4gQXJyYXknKTtcbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgdmFyIF9pbnB1dCA9IHRoaXMuX2lucHV0O1xuXG4gIGZvciAodmFyIGkgPSAwOyB0aGlzLl9zdGF0ZSA9PT0gUEVORElORyAmJiBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLl9lYWNoRW50cnkoX2lucHV0W2ldLCBpKTtcbiAgfVxufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uIChlbnRyeSwgaSkge1xuICB2YXIgYyA9IHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3I7XG4gIHZhciByZXNvbHZlJCQgPSBjLnJlc29sdmU7XG5cbiAgaWYgKHJlc29sdmUkJCA9PT0gcmVzb2x2ZSkge1xuICAgIHZhciBfdGhlbiA9IGdldFRoZW4oZW50cnkpO1xuXG4gICAgaWYgKF90aGVuID09PSB0aGVuICYmIGVudHJ5Ll9zdGF0ZSAhPT0gUEVORElORykge1xuICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuICAgICAgdGhpcy5fcmVzdWx0W2ldID0gZW50cnk7XG4gICAgfSBlbHNlIGlmIChjID09PSBQcm9taXNlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBjKG5vb3ApO1xuICAgICAgaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgX3RoZW4pO1xuICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl93aWxsU2V0dGxlQXQobmV3IGMoZnVuY3Rpb24gKHJlc29sdmUkJCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSQkKGVudHJ5KTtcbiAgICAgIH0pLCBpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fd2lsbFNldHRsZUF0KHJlc29sdmUkJChlbnRyeSksIGkpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24gKHN0YXRlLCBpLCB2YWx1ZSkge1xuICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IFBFTkRJTkcpIHtcbiAgICB0aGlzLl9yZW1haW5pbmctLTtcblxuICAgIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fd2lsbFNldHRsZUF0ID0gZnVuY3Rpb24gKHByb21pc2UsIGkpIHtcbiAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gIHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gZW51bWVyYXRvci5fc2V0dGxlZEF0KFJFSkVDVEVELCBpLCByZWFzb24pO1xuICB9KTtcbn07XG5cbi8qKlxuICBgUHJvbWlzZS5hbGxgIGFjY2VwdHMgYW4gYXJyYXkgb2YgcHJvbWlzZXMsIGFuZCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2hcbiAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgb2YgZnVsZmlsbG1lbnQgdmFsdWVzIGZvciB0aGUgcGFzc2VkIHByb21pc2VzLCBvclxuICByZWplY3RlZCB3aXRoIHRoZSByZWFzb24gb2YgdGhlIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIGJlIHJlamVjdGVkLiBJdCBjYXN0cyBhbGxcbiAgZWxlbWVudHMgb2YgdGhlIHBhc3NlZCBpdGVyYWJsZSB0byBwcm9taXNlcyBhcyBpdCBydW5zIHRoaXMgYWxnb3JpdGhtLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSByZXNvbHZlKDEpO1xuICBsZXQgcHJvbWlzZTIgPSByZXNvbHZlKDIpO1xuICBsZXQgcHJvbWlzZTMgPSByZXNvbHZlKDMpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gVGhlIGFycmF5IGhlcmUgd291bGQgYmUgWyAxLCAyLCAzIF07XG4gIH0pO1xuICBgYGBcblxuICBJZiBhbnkgb2YgdGhlIGBwcm9taXNlc2AgZ2l2ZW4gdG8gYGFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgcmVqZWN0aW9uIGhhbmRsZXIuIEZvciBleGFtcGxlOlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSByZXNvbHZlKDEpO1xuICBsZXQgcHJvbWlzZTIgPSByZWplY3QobmV3IEVycm9yKFwiMlwiKSk7XG4gIGxldCBwcm9taXNlMyA9IHJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgbGV0IHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIGFsbFxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IGVudHJpZXMgYXJyYXkgb2YgcHJvbWlzZXNcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgbGFiZWxpbmcgdGhlIHByb21pc2UuXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCBgcHJvbWlzZXNgIGhhdmUgYmVlblxuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC5cbiAgQHN0YXRpY1xuKi9cbmZ1bmN0aW9uIGFsbChlbnRyaWVzKSB7XG4gIHJldHVybiBuZXcgRW51bWVyYXRvcih0aGlzLCBlbnRyaWVzKS5wcm9taXNlO1xufVxuXG4vKipcbiAgYFByb21pc2UucmFjZWAgcmV0dXJucyBhIG5ldyBwcm9taXNlIHdoaWNoIGlzIHNldHRsZWQgaW4gdGhlIHNhbWUgd2F5IGFzIHRoZVxuICBmaXJzdCBwYXNzZWQgcHJvbWlzZSB0byBzZXR0bGUuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZSgncHJvbWlzZSAxJyk7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgbGV0IHByb21pc2UyID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDInKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBQcm9taXNlLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyByZXN1bHQgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgaXQgd2FzIHJlc29sdmVkIGJlZm9yZSBwcm9taXNlMVxuICAgIC8vIHdhcyByZXNvbHZlZC5cbiAgfSk7XG4gIGBgYFxuXG4gIGBQcm9taXNlLnJhY2VgIGlzIGRldGVybWluaXN0aWMgaW4gdGhhdCBvbmx5IHRoZSBzdGF0ZSBvZiB0aGUgZmlyc3RcbiAgc2V0dGxlZCBwcm9taXNlIG1hdHRlcnMuIEZvciBleGFtcGxlLCBldmVuIGlmIG90aGVyIHByb21pc2VzIGdpdmVuIHRvIHRoZVxuICBgcHJvbWlzZXNgIGFycmF5IGFyZ3VtZW50IGFyZSByZXNvbHZlZCwgYnV0IHRoZSBmaXJzdCBzZXR0bGVkIHByb21pc2UgaGFzXG4gIGJlY29tZSByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICBwcm9taXNlIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ3Byb21pc2UgMicpKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBQcm9taXNlLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVuc1xuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAncHJvbWlzZSAyJyBiZWNhdXNlIHByb21pc2UgMiBiZWNhbWUgcmVqZWN0ZWQgYmVmb3JlXG4gICAgLy8gcHJvbWlzZSAxIGJlY2FtZSBmdWxmaWxsZWRcbiAgfSk7XG4gIGBgYFxuXG4gIEFuIGV4YW1wbGUgcmVhbC13b3JsZCB1c2UgY2FzZSBpcyBpbXBsZW1lbnRpbmcgdGltZW91dHM6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBQcm9taXNlLnJhY2UoW2FqYXgoJ2Zvby5qc29uJyksIHRpbWVvdXQoNTAwMCldKVxuICBgYGBcblxuICBAbWV0aG9kIHJhY2VcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FycmF5fSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyB0byBvYnNlcnZlXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHdoaWNoIHNldHRsZXMgaW4gdGhlIHNhbWUgd2F5IGFzIHRoZSBmaXJzdCBwYXNzZWRcbiAgcHJvbWlzZSB0byBzZXR0bGUuXG4qL1xuZnVuY3Rpb24gcmFjZShlbnRyaWVzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKCFpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiAoXywgcmVqZWN0KSB7XG4gICAgICByZXR1cm4gcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIENvbnN0cnVjdG9yLnJlc29sdmUoZW50cmllc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yZWplY3RgIHJldHVybnMgYSBwcm9taXNlIHJlamVjdGVkIHdpdGggdGhlIHBhc3NlZCBgcmVhc29uYC5cbiAgSXQgaXMgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEluc3RlYWQgb2Ygd3JpdGluZyB0aGUgYWJvdmUsIHlvdXIgY29kZSBub3cgc2ltcGx5IGJlY29tZXMgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmVqZWN0XG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBbnl9IHJlYXNvbiB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQgd2l0aC5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgZ2l2ZW4gYHJlYXNvbmAuXG4qL1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcbiAgX3JlamVjdChwcm9taXNlLCByZWFzb24pO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gbmVlZHNSZXNvbHZlcigpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xufVxuXG5mdW5jdGlvbiBuZWVkc05ldygpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbn1cblxuLyoqXG4gIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGUgcmVhc29uXG4gIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gIFRlcm1pbm9sb2d5XG4gIC0tLS0tLS0tLS0tXG5cbiAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAtIGB2YWx1ZWAgaXMgYW55IGxlZ2FsIEphdmFTY3JpcHQgdmFsdWUgKGluY2x1ZGluZyB1bmRlZmluZWQsIGEgdGhlbmFibGUsIG9yIGEgcHJvbWlzZSkuXG4gIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gIC0gYHNldHRsZWRgIHRoZSBmaW5hbCByZXN0aW5nIHN0YXRlIG9mIGEgcHJvbWlzZSwgZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuXG4gIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICBzdGF0ZS4gIFByb21pc2VzIHRoYXQgYXJlIHJlamVjdGVkIGhhdmUgYSByZWplY3Rpb24gcmVhc29uIGFuZCBhcmUgaW4gdGhlXG4gIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICBwcm9taXNlLCB0aGVuIHRoZSBvcmlnaW5hbCBwcm9taXNlJ3Mgc2V0dGxlZCBzdGF0ZSB3aWxsIG1hdGNoIHRoZSB2YWx1ZSdzXG4gIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gIGl0c2VsZiBmdWxmaWxsLlxuXG5cbiAgQmFzaWMgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLVxuXG4gIGBgYGpzXG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gb24gc3VjY2Vzc1xuICAgIHJlc29sdmUodmFsdWUpO1xuXG4gICAgLy8gb24gZmFpbHVyZVxuICAgIHJlamVjdChyZWFzb24pO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvLyBvbiBmdWxmaWxsbWVudFxuICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAvLyBvbiByZWplY3Rpb25cbiAgfSk7XG4gIGBgYFxuXG4gIEFkdmFuY2VkIFVzYWdlOlxuICAtLS0tLS0tLS0tLS0tLS1cblxuICBQcm9taXNlcyBzaGluZSB3aGVuIGFic3RyYWN0aW5nIGF3YXkgYXN5bmNocm9ub3VzIGludGVyYWN0aW9ucyBzdWNoIGFzXG4gIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gIGBgYGpzXG4gIGZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSB0aGlzLkRPTkUpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICBgYGBqc1xuICBQcm9taXNlLmFsbChbXG4gICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgXSkudGhlbihmdW5jdGlvbih2YWx1ZXMpe1xuICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9KTtcbiAgYGBgXG5cbiAgQGNsYXNzIFByb21pc2VcbiAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAY29uc3RydWN0b3JcbiovXG5mdW5jdGlvbiBQcm9taXNlKHJlc29sdmVyKSB7XG4gIHRoaXNbUFJPTUlTRV9JRF0gPSBuZXh0SWQoKTtcbiAgdGhpcy5fcmVzdWx0ID0gdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgaWYgKG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgdHlwZW9mIHJlc29sdmVyICE9PSAnZnVuY3Rpb24nICYmIG5lZWRzUmVzb2x2ZXIoKTtcbiAgICB0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSA/IGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKSA6IG5lZWRzTmV3KCk7XG4gIH1cbn1cblxuUHJvbWlzZS5hbGwgPSBhbGw7XG5Qcm9taXNlLnJhY2UgPSByYWNlO1xuUHJvbWlzZS5yZXNvbHZlID0gcmVzb2x2ZTtcblByb21pc2UucmVqZWN0ID0gcmVqZWN0O1xuUHJvbWlzZS5fc2V0U2NoZWR1bGVyID0gc2V0U2NoZWR1bGVyO1xuUHJvbWlzZS5fc2V0QXNhcCA9IHNldEFzYXA7XG5Qcm9taXNlLl9hc2FwID0gYXNhcDtcblxuUHJvbWlzZS5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBQcm9taXNlLFxuXG4gIC8qKlxuICAgIFRoZSBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLFxuICAgIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIC8vIHVzZXIgaXMgYXZhaWxhYmxlXG4gICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIHVzZXIgaXMgdW5hdmFpbGFibGUsIGFuZCB5b3UgYXJlIGdpdmVuIHRoZSByZWFzb24gd2h5XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIENoYWluaW5nXG4gICAgLS0tLS0tLS1cbiAgXG4gICAgVGhlIHJldHVybiB2YWx1ZSBvZiBgdGhlbmAgaXMgaXRzZWxmIGEgcHJvbWlzZS4gIFRoaXMgc2Vjb25kLCAnZG93bnN0cmVhbSdcbiAgICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICByZXR1cm4gdXNlci5uYW1lO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHJldHVybiAnZGVmYXVsdCBuYW1lJztcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyTmFtZSkge1xuICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgLy8gd2lsbCBiZSBgJ2RlZmF1bHQgbmFtZSdgXG4gICAgfSk7XG4gIFxuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgIC8vIElmIGBmaW5kVXNlcmAgcmVqZWN0ZWQsIGByZWFzb25gIHdpbGwgYmUgJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknLlxuICAgIH0pO1xuICAgIGBgYFxuICAgIElmIHRoZSBkb3duc3RyZWFtIHByb21pc2UgZG9lcyBub3Qgc3BlY2lmeSBhIHJlamVjdGlvbiBoYW5kbGVyLCByZWplY3Rpb24gcmVhc29ucyB3aWxsIGJlIHByb3BhZ2F0ZWQgZnVydGhlciBkb3duc3RyZWFtLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBBc3NpbWlsYXRpb25cbiAgICAtLS0tLS0tLS0tLS1cbiAgXG4gICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICByZXRyaWV2ZWQgYXN5bmNocm9ub3VzbHkuIFRoaXMgY2FuIGJlIGFjaGlldmVkIGJ5IHJldHVybmluZyBhIHByb21pc2UgaW4gdGhlXG4gICAgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uIGhhbmRsZXIuIFRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCB0aGVuIGJlIHBlbmRpbmdcbiAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgLy8gVGhlIHVzZXIncyBjb21tZW50cyBhcmUgbm93IGF2YWlsYWJsZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCBmdWxmaWxscywgd2UnbGwgaGF2ZSB0aGUgdmFsdWUgaGVyZVxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgU2ltcGxlIEV4YW1wbGVcbiAgICAtLS0tLS0tLS0tLS0tLVxuICBcbiAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBsZXQgcmVzdWx0O1xuICBcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAvLyBmYWlsdXJlXG4gICAgfVxuICAgIGBgYFxuICBcbiAgICBFcnJiYWNrIEV4YW1wbGVcbiAgXG4gICAgYGBganNcbiAgICBmaW5kUmVzdWx0KGZ1bmN0aW9uKHJlc3VsdCwgZXJyKXtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBQcm9taXNlIEV4YW1wbGU7XG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBmaW5kUmVzdWx0KCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBmYWlsdXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAtLS0tLS0tLS0tLS0tLVxuICBcbiAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBsZXQgYXV0aG9yLCBib29rcztcbiAgXG4gICAgdHJ5IHtcbiAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgIGJvb2tzICA9IGZpbmRCb29rc0J5QXV0aG9yKGF1dGhvcik7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9XG4gICAgYGBgXG4gIFxuICAgIEVycmJhY2sgRXhhbXBsZVxuICBcbiAgICBgYGBqc1xuICBcbiAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG4gIFxuICAgIH1cbiAgXG4gICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcbiAgXG4gICAgfVxuICBcbiAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICBmYWlsdXJlKHJlYXNvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFByb21pc2UgRXhhbXBsZTtcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGZpbmRBdXRob3IoKS5cbiAgICAgIHRoZW4oZmluZEJvb2tzQnlBdXRob3IpLlxuICAgICAgdGhlbihmdW5jdGlvbihib29rcyl7XG4gICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEBtZXRob2QgdGhlblxuICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAqL1xuICB0aGVuOiB0aGVuLFxuXG4gIC8qKlxuICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICBhcyB0aGUgY2F0Y2ggYmxvY2sgb2YgYSB0cnkvY2F0Y2ggc3RhdGVtZW50LlxuICBcbiAgICBgYGBqc1xuICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgIH1cbiAgXG4gICAgLy8gc3luY2hyb25vdXNcbiAgICB0cnkge1xuICAgICAgZmluZEF1dGhvcigpO1xuICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH1cbiAgXG4gICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgIGZpbmRBdXRob3IoKS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQG1ldGhvZCBjYXRjaFxuICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG4gICdjYXRjaCc6IGZ1bmN0aW9uIF9jYXRjaChvblJlamVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICB9XG59O1xuXG5mdW5jdGlvbiBwb2x5ZmlsbCgpIHtcbiAgICB2YXIgbG9jYWwgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbG9jYWwgPSBzZWxmO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICBpZiAoUCkge1xuICAgICAgICB2YXIgcHJvbWlzZVRvU3RyaW5nID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2VUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHNpbGVudGx5IGlnbm9yZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9taXNlVG9TdHJpbmcgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsb2NhbC5Qcm9taXNlID0gUHJvbWlzZTtcbn1cblxuLy8gU3RyYW5nZSBjb21wYXQuLlxuUHJvbWlzZS5wb2x5ZmlsbCA9IHBvbHlmaWxsO1xuUHJvbWlzZS5Qcm9taXNlID0gUHJvbWlzZTtcblxucmV0dXJuIFByb21pc2U7XG5cbn0pKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lczYtcHJvbWlzZS5tYXAiLCIvKiFcblx0UGFwYSBQYXJzZVxuXHR2NC4xLjRcblx0aHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZVxuKi9cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KVxue1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHR7XG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpXG5cdHtcblx0XHQvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLCBidXRcblx0XHQvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcblx0XHQvLyBsaWtlIE5vZGUuXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Ly8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcblx0XHRyb290LlBhcGEgPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24oKVxue1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGdsb2JhbCA9IChmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gYWx0ZXJuYXRpdmUgbWV0aG9kLCBzaW1pbGFyIHRvIGBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpYFxuXHRcdC8vIGJ1dCB3aXRob3V0IHVzaW5nIGBldmFsYCAod2hpY2ggaXMgZGlzYWJsZWQgd2hlblxuXHRcdC8vIHVzaW5nIENvbnRlbnQgU2VjdXJpdHkgUG9saWN5KS5cblxuXHRcdGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIHNlbGY7IH1cblx0XHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIHdpbmRvdzsgfVxuXHRcdGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZ2xvYmFsOyB9XG5cbiAgICAgICAgLy8gV2hlbiBydW5uaW5nIHRlc3RzIG5vbmUgb2YgdGhlIGFib3ZlIGhhdmUgYmVlbiBkZWZpbmVkXG4gICAgICAgIHJldHVybiB7fTtcblx0fSkoKTtcblxuXG5cdHZhciBJU19XT1JLRVIgPSAhZ2xvYmFsLmRvY3VtZW50ICYmICEhZ2xvYmFsLnBvc3RNZXNzYWdlLFxuXHRcdElTX1BBUEFfV09SS0VSID0gSVNfV09SS0VSICYmIC8oXFw/fCYpcGFwYXdvcmtlcig9fCZ8JCkvLnRlc3QoZ2xvYmFsLmxvY2F0aW9uLnNlYXJjaCksXG5cdFx0TE9BREVEX1NZTkMgPSBmYWxzZSwgQVVUT19TQ1JJUFRfUEFUSDtcblx0dmFyIHdvcmtlcnMgPSB7fSwgd29ya2VySWRDb3VudGVyID0gMDtcblxuXHR2YXIgUGFwYSA9IHt9O1xuXG5cdFBhcGEucGFyc2UgPSBDc3ZUb0pzb247XG5cdFBhcGEudW5wYXJzZSA9IEpzb25Ub0NzdjtcblxuXHRQYXBhLlJFQ09SRF9TRVAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDMwKTtcblx0UGFwYS5VTklUX1NFUCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzEpO1xuXHRQYXBhLkJZVEVfT1JERVJfTUFSSyA9ICdcXHVmZWZmJztcblx0UGFwYS5CQURfREVMSU1JVEVSUyA9IFsnXFxyJywgJ1xcbicsICdcIicsIFBhcGEuQllURV9PUkRFUl9NQVJLXTtcblx0UGFwYS5XT1JLRVJTX1NVUFBPUlRFRCA9ICFJU19XT1JLRVIgJiYgISFnbG9iYWwuV29ya2VyO1xuXHRQYXBhLlNDUklQVF9QQVRIID0gbnVsbDtcdC8vIE11c3QgYmUgc2V0IGJ5IHlvdXIgY29kZSBpZiB5b3UgdXNlIHdvcmtlcnMgYW5kIHRoaXMgbGliIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseVxuXG5cdC8vIENvbmZpZ3VyYWJsZSBjaHVuayBzaXplcyBmb3IgbG9jYWwgYW5kIHJlbW90ZSBmaWxlcywgcmVzcGVjdGl2ZWx5XG5cdFBhcGEuTG9jYWxDaHVua1NpemUgPSAxMDI0ICogMTAyNCAqIDEwO1x0Ly8gMTAgTUJcblx0UGFwYS5SZW1vdGVDaHVua1NpemUgPSAxMDI0ICogMTAyNCAqIDU7XHQvLyA1IE1CXG5cdFBhcGEuRGVmYXVsdERlbGltaXRlciA9ICcsJztcdFx0XHQvLyBVc2VkIGlmIG5vdCBzcGVjaWZpZWQgYW5kIGRldGVjdGlvbiBmYWlsc1xuXG5cdC8vIEV4cG9zZWQgZm9yIHRlc3RpbmcgYW5kIGRldmVsb3BtZW50IG9ubHlcblx0UGFwYS5QYXJzZXIgPSBQYXJzZXI7XG5cdFBhcGEuUGFyc2VySGFuZGxlID0gUGFyc2VySGFuZGxlO1xuXHRQYXBhLk5ldHdvcmtTdHJlYW1lciA9IE5ldHdvcmtTdHJlYW1lcjtcblx0UGFwYS5GaWxlU3RyZWFtZXIgPSBGaWxlU3RyZWFtZXI7XG5cdFBhcGEuU3RyaW5nU3RyZWFtZXIgPSBTdHJpbmdTdHJlYW1lcjtcblxuXHRpZiAoZ2xvYmFsLmpRdWVyeSlcblx0e1xuXHRcdHZhciAkID0gZ2xvYmFsLmpRdWVyeTtcblx0XHQkLmZuLnBhcnNlID0gZnVuY3Rpb24ob3B0aW9ucylcblx0XHR7XG5cdFx0XHR2YXIgY29uZmlnID0gb3B0aW9ucy5jb25maWcgfHwge307XG5cdFx0XHR2YXIgcXVldWUgPSBbXTtcblxuXHRcdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKGlkeClcblx0XHRcdHtcblx0XHRcdFx0dmFyIHN1cHBvcnRlZCA9ICQodGhpcykucHJvcCgndGFnTmFtZScpLnRvVXBwZXJDYXNlKCkgPT09ICdJTlBVVCdcblx0XHRcdFx0XHRcdFx0XHQmJiAkKHRoaXMpLmF0dHIoJ3R5cGUnKS50b0xvd2VyQ2FzZSgpID09PSAnZmlsZSdcblx0XHRcdFx0XHRcdFx0XHQmJiBnbG9iYWwuRmlsZVJlYWRlcjtcblxuXHRcdFx0XHRpZiAoIXN1cHBvcnRlZCB8fCAhdGhpcy5maWxlcyB8fCB0aGlzLmZpbGVzLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcdC8vIGNvbnRpbnVlIHRvIG5leHQgaW5wdXQgZWxlbWVudFxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5maWxlcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHF1ZXVlLnB1c2goe1xuXHRcdFx0XHRcdFx0ZmlsZTogdGhpcy5maWxlc1tpXSxcblx0XHRcdFx0XHRcdGlucHV0RWxlbTogdGhpcyxcblx0XHRcdFx0XHRcdGluc3RhbmNlQ29uZmlnOiAkLmV4dGVuZCh7fSwgY29uZmlnKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cGFyc2VOZXh0RmlsZSgpO1x0Ly8gYmVnaW4gcGFyc2luZ1xuXHRcdFx0cmV0dXJuIHRoaXM7XHRcdC8vIG1haW50YWlucyBjaGFpbmFiaWxpdHlcblxuXG5cdFx0XHRmdW5jdGlvbiBwYXJzZU5leHRGaWxlKClcblx0XHRcdHtcblx0XHRcdFx0aWYgKHF1ZXVlLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuY29tcGxldGUpKVxuXHRcdFx0XHRcdFx0b3B0aW9ucy5jb21wbGV0ZSgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmID0gcXVldWVbMF07XG5cblx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5iZWZvcmUpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHJldHVybmVkID0gb3B0aW9ucy5iZWZvcmUoZi5maWxlLCBmLmlucHV0RWxlbSk7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIHJldHVybmVkID09PSAnb2JqZWN0Jylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAocmV0dXJuZWQuYWN0aW9uID09PSAnYWJvcnQnKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRlcnJvcignQWJvcnRFcnJvcicsIGYuZmlsZSwgZi5pbnB1dEVsZW0sIHJldHVybmVkLnJlYXNvbik7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcdC8vIEFib3J0cyBhbGwgcXVldWVkIGZpbGVzIGltbWVkaWF0ZWx5XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmIChyZXR1cm5lZC5hY3Rpb24gPT09ICdza2lwJylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XHQvLyBwYXJzZSB0aGUgbmV4dCBmaWxlIGluIHRoZSBxdWV1ZSwgaWYgYW55XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiByZXR1cm5lZC5jb25maWcgPT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdFx0XHRmLmluc3RhbmNlQ29uZmlnID0gJC5leHRlbmQoZi5pbnN0YW5jZUNvbmZpZywgcmV0dXJuZWQuY29uZmlnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAocmV0dXJuZWQgPT09ICdza2lwJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcdC8vIHBhcnNlIHRoZSBuZXh0IGZpbGUgaW4gdGhlIHF1ZXVlLCBpZiBhbnlcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBXcmFwIHVwIHRoZSB1c2VyJ3MgY29tcGxldGUgY2FsbGJhY2ssIGlmIGFueSwgc28gdGhhdCBvdXJzIGFsc28gZ2V0cyBleGVjdXRlZFxuXHRcdFx0XHR2YXIgdXNlckNvbXBsZXRlRnVuYyA9IGYuaW5zdGFuY2VDb25maWcuY29tcGxldGU7XG5cdFx0XHRcdGYuaW5zdGFuY2VDb25maWcuY29tcGxldGUgPSBmdW5jdGlvbihyZXN1bHRzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGlzRnVuY3Rpb24odXNlckNvbXBsZXRlRnVuYykpXG5cdFx0XHRcdFx0XHR1c2VyQ29tcGxldGVGdW5jKHJlc3VsdHMsIGYuZmlsZSwgZi5pbnB1dEVsZW0pO1xuXHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFBhcGEucGFyc2UoZi5maWxlLCBmLmluc3RhbmNlQ29uZmlnKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZXJyb3IobmFtZSwgZmlsZSwgZWxlbSwgcmVhc29uKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmVycm9yKSlcblx0XHRcdFx0XHRvcHRpb25zLmVycm9yKHtuYW1lOiBuYW1lfSwgZmlsZSwgZWxlbSwgcmVhc29uKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZmlsZUNvbXBsZXRlKClcblx0XHRcdHtcblx0XHRcdFx0cXVldWUuc3BsaWNlKDAsIDEpO1xuXHRcdFx0XHRwYXJzZU5leHRGaWxlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblxuXHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdHtcblx0XHRnbG9iYWwub25tZXNzYWdlID0gd29ya2VyVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHR9XG5cdGVsc2UgaWYgKFBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdHtcblx0XHRBVVRPX1NDUklQVF9QQVRIID0gZ2V0U2NyaXB0UGF0aCgpO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIHNjcmlwdCB3YXMgbG9hZGVkIHN5bmNocm9ub3VzbHlcblx0XHRpZiAoIWRvY3VtZW50LmJvZHkpXG5cdFx0e1xuXHRcdFx0Ly8gQm9keSBkb2Vzbid0IGV4aXN0IHlldCwgbXVzdCBiZSBzeW5jaHJvbm91c1xuXHRcdFx0TE9BREVEX1NZTkMgPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0TE9BREVEX1NZTkMgPSB0cnVlO1xuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblx0ZnVuY3Rpb24gQ3N2VG9Kc29uKF9pbnB1dCwgX2NvbmZpZylcblx0e1xuXHRcdF9jb25maWcgPSBfY29uZmlnIHx8IHt9O1xuXHRcdF9jb25maWcuZHluYW1pY1R5cGluZyA9IF9jb25maWcuZHluYW1pY1R5cGluZyB8fCBmYWxzZTtcblxuXHRcdGlmIChfY29uZmlnLndvcmtlciAmJiBQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdHtcblx0XHRcdHZhciB3ID0gbmV3V29ya2VyKCk7XG5cblx0XHRcdHcudXNlclN0ZXAgPSBfY29uZmlnLnN0ZXA7XG5cdFx0XHR3LnVzZXJDaHVuayA9IF9jb25maWcuY2h1bms7XG5cdFx0XHR3LnVzZXJDb21wbGV0ZSA9IF9jb25maWcuY29tcGxldGU7XG5cdFx0XHR3LnVzZXJFcnJvciA9IF9jb25maWcuZXJyb3I7XG5cblx0XHRcdF9jb25maWcuc3RlcCA9IGlzRnVuY3Rpb24oX2NvbmZpZy5zdGVwKTtcblx0XHRcdF9jb25maWcuY2h1bmsgPSBpc0Z1bmN0aW9uKF9jb25maWcuY2h1bmspO1xuXHRcdFx0X2NvbmZpZy5jb21wbGV0ZSA9IGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSk7XG5cdFx0XHRfY29uZmlnLmVycm9yID0gaXNGdW5jdGlvbihfY29uZmlnLmVycm9yKTtcblx0XHRcdGRlbGV0ZSBfY29uZmlnLndvcmtlcjtcdC8vIHByZXZlbnQgaW5maW5pdGUgbG9vcFxuXG5cdFx0XHR3LnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0aW5wdXQ6IF9pbnB1dCxcblx0XHRcdFx0Y29uZmlnOiBfY29uZmlnLFxuXHRcdFx0XHR3b3JrZXJJZDogdy5pZFxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc3RyZWFtZXIgPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRpZiAoX2NvbmZpZy5kb3dubG9hZClcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgTmV0d29ya1N0cmVhbWVyKF9jb25maWcpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRzdHJlYW1lciA9IG5ldyBTdHJpbmdTdHJlYW1lcihfY29uZmlnKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKGdsb2JhbC5GaWxlICYmIF9pbnB1dCBpbnN0YW5jZW9mIEZpbGUpIHx8IF9pbnB1dCBpbnN0YW5jZW9mIE9iamVjdClcdC8vIC4uLlNhZmFyaS4gKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdFx0c3RyZWFtZXIgPSBuZXcgRmlsZVN0cmVhbWVyKF9jb25maWcpO1xuXG5cdFx0cmV0dXJuIHN0cmVhbWVyLnN0cmVhbShfaW5wdXQpO1xuXHR9XG5cblxuXG5cblxuXG5cdGZ1bmN0aW9uIEpzb25Ub0NzdihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHR2YXIgX291dHB1dCA9ICcnO1xuXHRcdHZhciBfZmllbGRzID0gW107XG5cblx0XHQvLyBEZWZhdWx0IGNvbmZpZ3VyYXRpb25cblxuXHRcdC8qKiB3aGV0aGVyIHRvIHN1cnJvdW5kIGV2ZXJ5IGRhdHVtIHdpdGggcXVvdGVzICovXG5cdFx0dmFyIF9xdW90ZXMgPSBmYWxzZTtcblxuXHRcdC8qKiB3aGV0aGVyIHRvIHdyaXRlIGhlYWRlcnMgKi9cblx0XHR2YXIgX3dyaXRlSGVhZGVyID0gdHJ1ZTtcblxuXHRcdC8qKiBkZWxpbWl0aW5nIGNoYXJhY3RlciAqL1xuXHRcdHZhciBfZGVsaW1pdGVyID0gJywnO1xuXG5cdFx0LyoqIG5ld2xpbmUgY2hhcmFjdGVyKHMpICovXG5cdFx0dmFyIF9uZXdsaW5lID0gJ1xcclxcbic7XG5cblx0XHQvKiogcXVvdGUgY2hhcmFjdGVyICovXG5cdFx0dmFyIF9xdW90ZUNoYXIgPSAnXCInO1xuXG5cdFx0dW5wYWNrQ29uZmlnKCk7XG5cblx0XHR2YXIgcXVvdGVDaGFyUmVnZXggPSBuZXcgUmVnRXhwKF9xdW90ZUNoYXIsICdnJyk7XG5cblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0XHRfaW5wdXQgPSBKU09OLnBhcnNlKF9pbnB1dCk7XG5cblx0XHRpZiAoX2lucHV0IGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0e1xuXHRcdFx0aWYgKCFfaW5wdXQubGVuZ3RoIHx8IF9pbnB1dFswXSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG51bGwsIF9pbnB1dCk7XG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgX2lucHV0WzBdID09PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShvYmplY3RLZXlzKF9pbnB1dFswXSksIF9pbnB1dCk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXQgPT09ICdvYmplY3QnKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2lucHV0LmRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfaW5wdXQuZGF0YSA9IEpTT04ucGFyc2UoX2lucHV0LmRhdGEpO1xuXG5cdFx0XHRpZiAoX2lucHV0LmRhdGEgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFfaW5wdXQuZmllbGRzKVxuXHRcdFx0XHRcdF9pbnB1dC5maWVsZHMgPSAgX2lucHV0Lm1ldGEgJiYgX2lucHV0Lm1ldGEuZmllbGRzO1xuXG5cdFx0XHRcdGlmICghX2lucHV0LmZpZWxkcylcblx0XHRcdFx0XHRfaW5wdXQuZmllbGRzID0gIF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXlcblx0XHRcdFx0XHRcdFx0XHRcdD8gX2lucHV0LmZpZWxkc1xuXHRcdFx0XHRcdFx0XHRcdFx0OiBvYmplY3RLZXlzKF9pbnB1dC5kYXRhWzBdKTtcblxuXHRcdFx0XHRpZiAoIShfaW5wdXQuZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KSAmJiB0eXBlb2YgX2lucHV0LmRhdGFbMF0gIT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdF9pbnB1dC5kYXRhID0gW19pbnB1dC5kYXRhXTtcdC8vIGhhbmRsZXMgaW5wdXQgbGlrZSBbMSwyLDNdIG9yIFsnYXNkZiddXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzZXJpYWxpemUoX2lucHV0LmZpZWxkcyB8fCBbXSwgX2lucHV0LmRhdGEgfHwgW10pO1xuXHRcdH1cblxuXHRcdC8vIERlZmF1bHQgKGFueSB2YWxpZCBwYXRocyBzaG91bGQgcmV0dXJuIGJlZm9yZSB0aGlzKVxuXHRcdHRocm93ICdleGNlcHRpb246IFVuYWJsZSB0byBzZXJpYWxpemUgdW5yZWNvZ25pemVkIGlucHV0JztcblxuXG5cdFx0ZnVuY3Rpb24gdW5wYWNrQ29uZmlnKClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcgIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5kZWxpbWl0ZXIgPT09ICdzdHJpbmcnXG5cdFx0XHRcdCYmIF9jb25maWcuZGVsaW1pdGVyLmxlbmd0aCA9PT0gMVxuXHRcdFx0XHQmJiBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoX2NvbmZpZy5kZWxpbWl0ZXIpID09PSAtMSlcblx0XHRcdHtcblx0XHRcdFx0X2RlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcucXVvdGVzID09PSAnYm9vbGVhbidcblx0XHRcdFx0fHwgX2NvbmZpZy5xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdFx0X3F1b3RlcyA9IF9jb25maWcucXVvdGVzO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcubmV3bGluZSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9uZXdsaW5lID0gX2NvbmZpZy5uZXdsaW5lO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcucXVvdGVDaGFyID09PSAnc3RyaW5nJylcblx0XHRcdFx0X3F1b3RlQ2hhciA9IF9jb25maWcucXVvdGVDaGFyO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcuaGVhZGVyID09PSAnYm9vbGVhbicpXG5cdFx0XHRcdF93cml0ZUhlYWRlciA9IF9jb25maWcuaGVhZGVyO1xuXHRcdH1cblxuXG5cdFx0LyoqIFR1cm5zIGFuIG9iamVjdCdzIGtleXMgaW50byBhbiBhcnJheSAqL1xuXHRcdGZ1bmN0aW9uIG9iamVjdEtleXMob2JqKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0dmFyIGtleXMgPSBbXTtcblx0XHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRcdGtleXMucHVzaChrZXkpO1xuXHRcdFx0cmV0dXJuIGtleXM7XG5cdFx0fVxuXG5cdFx0LyoqIFRoZSBkb3VibGUgZm9yIGxvb3AgdGhhdCBpdGVyYXRlcyB0aGUgZGF0YSBhbmQgd3JpdGVzIG91dCBhIENTViBzdHJpbmcgaW5jbHVkaW5nIGhlYWRlciByb3cgKi9cblx0XHRmdW5jdGlvbiBzZXJpYWxpemUoZmllbGRzLCBkYXRhKVxuXHRcdHtcblx0XHRcdHZhciBjc3YgPSAnJztcblxuXHRcdFx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRmaWVsZHMgPSBKU09OLnBhcnNlKGZpZWxkcyk7XG5cdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcblxuXHRcdFx0dmFyIGhhc0hlYWRlciA9IGZpZWxkcyBpbnN0YW5jZW9mIEFycmF5ICYmIGZpZWxkcy5sZW5ndGggPiAwO1xuXHRcdFx0dmFyIGRhdGFLZXllZEJ5RmllbGQgPSAhKGRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheSk7XG5cblx0XHRcdC8vIElmIHRoZXJlIGEgaGVhZGVyIHJvdywgd3JpdGUgaXQgZmlyc3Rcblx0XHRcdGlmIChoYXNIZWFkZXIgJiYgX3dyaXRlSGVhZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGZpZWxkc1tpXSwgaSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoZW4gd3JpdGUgb3V0IHRoZSBkYXRhXG5cdFx0XHRmb3IgKHZhciByb3cgPSAwOyByb3cgPCBkYXRhLmxlbmd0aDsgcm93KyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtYXhDb2wgPSBoYXNIZWFkZXIgPyBmaWVsZHMubGVuZ3RoIDogZGF0YVtyb3ddLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKHZhciBjb2wgPSAwOyBjb2wgPCBtYXhDb2w7IGNvbCsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGNvbCA+IDApXG5cdFx0XHRcdFx0XHRjc3YgKz0gX2RlbGltaXRlcjtcblx0XHRcdFx0XHR2YXIgY29sSWR4ID0gaGFzSGVhZGVyICYmIGRhdGFLZXllZEJ5RmllbGQgPyBmaWVsZHNbY29sXSA6IGNvbDtcblx0XHRcdFx0XHRjc3YgKz0gc2FmZShkYXRhW3Jvd11bY29sSWR4XSwgY29sKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyb3cgPCBkYXRhLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0Y3N2ICs9IF9uZXdsaW5lO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY3N2O1xuXHRcdH1cblxuXHRcdC8qKiBFbmNsb3NlcyBhIHZhbHVlIGFyb3VuZCBxdW90ZXMgaWYgbmVlZGVkIChtYWtlcyBhIHZhbHVlIHNhZmUgZm9yIENTViBpbnNlcnRpb24pICovXG5cdFx0ZnVuY3Rpb24gc2FmZShzdHIsIGNvbClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcgfHwgc3RyID09PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gJyc7XG5cblx0XHRcdHN0ciA9IHN0ci50b1N0cmluZygpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIF9xdW90ZUNoYXIrX3F1b3RlQ2hhcik7XG5cblx0XHRcdHZhciBuZWVkc1F1b3RlcyA9ICh0eXBlb2YgX3F1b3RlcyA9PT0gJ2Jvb2xlYW4nICYmIF9xdW90ZXMpXG5cdFx0XHRcdFx0XHRcdHx8IChfcXVvdGVzIGluc3RhbmNlb2YgQXJyYXkgJiYgX3F1b3Rlc1tjb2xdKVxuXHRcdFx0XHRcdFx0XHR8fCBoYXNBbnkoc3RyLCBQYXBhLkJBRF9ERUxJTUlURVJTKVxuXHRcdFx0XHRcdFx0XHR8fCBzdHIuaW5kZXhPZihfZGVsaW1pdGVyKSA+IC0xXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoMCkgPT09ICcgJ1xuXHRcdFx0XHRcdFx0XHR8fCBzdHIuY2hhckF0KHN0ci5sZW5ndGggLSAxKSA9PT0gJyAnO1xuXG5cdFx0XHRyZXR1cm4gbmVlZHNRdW90ZXMgPyBfcXVvdGVDaGFyICsgc3RyICsgX3F1b3RlQ2hhciA6IHN0cjtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBoYXNBbnkoc3RyLCBzdWJzdHJpbmdzKVxuXHRcdHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic3RyaW5ncy5sZW5ndGg7IGkrKylcblx0XHRcdFx0aWYgKHN0ci5pbmRleE9mKHN1YnN0cmluZ3NbaV0pID4gLTEpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0LyoqIENodW5rU3RyZWFtZXIgaXMgdGhlIGJhc2UgcHJvdG90eXBlIGZvciB2YXJpb3VzIHN0cmVhbWVyIGltcGxlbWVudGF0aW9ucy4gKi9cblx0ZnVuY3Rpb24gQ2h1bmtTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHR0aGlzLl9oYW5kbGUgPSBudWxsO1xuXHRcdHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX2ZpbmlzaGVkID0gZmFsc2U7XG5cdFx0dGhpcy5faW5wdXQgPSBudWxsO1xuXHRcdHRoaXMuX2Jhc2VJbmRleCA9IDA7XG5cdFx0dGhpcy5fcGFydGlhbExpbmUgPSAnJztcblx0XHR0aGlzLl9yb3dDb3VudCA9IDA7XG5cdFx0dGhpcy5fc3RhcnQgPSAwO1xuXHRcdHRoaXMuX25leHRDaHVuayA9IG51bGw7XG5cdFx0dGhpcy5pc0ZpcnN0Q2h1bmsgPSB0cnVlO1xuXHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cyA9IHtcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblx0XHRyZXBsYWNlQ29uZmlnLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHRoaXMucGFyc2VDaHVuayA9IGZ1bmN0aW9uKGNodW5rKVxuXHRcdHtcblx0XHRcdC8vIEZpcnN0IGNodW5rIHByZS1wcm9jZXNzaW5nXG5cdFx0XHRpZiAodGhpcy5pc0ZpcnN0Q2h1bmsgJiYgaXNGdW5jdGlvbih0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtb2RpZmllZENodW5rID0gdGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmsoY2h1bmspO1xuXHRcdFx0XHRpZiAobW9kaWZpZWRDaHVuayAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdGNodW5rID0gbW9kaWZpZWRDaHVuaztcblx0XHRcdH1cblx0XHRcdHRoaXMuaXNGaXJzdENodW5rID0gZmFsc2U7XG5cblx0XHRcdC8vIFJlam9pbiB0aGUgbGluZSB3ZSBsaWtlbHkganVzdCBzcGxpdCBpbiB0d28gYnkgY2h1bmtpbmcgdGhlIGZpbGVcblx0XHRcdHZhciBhZ2dyZWdhdGUgPSB0aGlzLl9wYXJ0aWFsTGluZSArIGNodW5rO1xuXHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSAnJztcblxuXHRcdFx0dmFyIHJlc3VsdHMgPSB0aGlzLl9oYW5kbGUucGFyc2UoYWdncmVnYXRlLCB0aGlzLl9iYXNlSW5kZXgsICF0aGlzLl9maW5pc2hlZCk7XG5cblx0XHRcdGlmICh0aGlzLl9oYW5kbGUucGF1c2VkKCkgfHwgdGhpcy5faGFuZGxlLmFib3J0ZWQoKSlcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHR2YXIgbGFzdEluZGV4ID0gcmVzdWx0cy5tZXRhLmN1cnNvcjtcblxuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSBhZ2dyZWdhdGUuc3Vic3RyaW5nKGxhc3RJbmRleCAtIHRoaXMuX2Jhc2VJbmRleCk7XG5cdFx0XHRcdHRoaXMuX2Jhc2VJbmRleCA9IGxhc3RJbmRleDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5kYXRhKVxuXHRcdFx0XHR0aGlzLl9yb3dDb3VudCArPSByZXN1bHRzLmRhdGEubGVuZ3RoO1xuXG5cdFx0XHR2YXIgZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ID0gdGhpcy5fZmluaXNoZWQgfHwgKHRoaXMuX2NvbmZpZy5wcmV2aWV3ICYmIHRoaXMuX3Jvd0NvdW50ID49IHRoaXMuX2NvbmZpZy5wcmV2aWV3KTtcblxuXHRcdFx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGZpbmlzaGVkOiBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5jaHVuayhyZXN1bHRzLCB0aGlzLl9oYW5kbGUpO1xuXHRcdFx0XHRpZiAodGhpcy5fcGF1c2VkKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0cmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuX2NvbmZpZy5zdGVwICYmICF0aGlzLl9jb25maWcuY2h1bmspIHtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmRhdGEgPSB0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YS5jb25jYXQocmVzdWx0cy5kYXRhKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycyA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMuY29uY2F0KHJlc3VsdHMuZXJyb3JzKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLm1ldGEgPSByZXN1bHRzLm1ldGE7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgJiYgaXNGdW5jdGlvbih0aGlzLl9jb25maWcuY29tcGxldGUpICYmICghcmVzdWx0cyB8fCAhcmVzdWx0cy5tZXRhLmFib3J0ZWQpKVxuXHRcdFx0XHR0aGlzLl9jb25maWcuY29tcGxldGUodGhpcy5fY29tcGxldGVSZXN1bHRzLCB0aGlzLl9pbnB1dCk7XG5cblx0XHRcdGlmICghZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ICYmICghcmVzdWx0cyB8fCAhcmVzdWx0cy5tZXRhLnBhdXNlZCkpXG5cdFx0XHRcdHRoaXMuX25leHRDaHVuaygpO1xuXG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9O1xuXG5cdFx0dGhpcy5fc2VuZEVycm9yID0gZnVuY3Rpb24oZXJyb3IpXG5cdFx0e1xuXHRcdFx0aWYgKGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmVycm9yKSlcblx0XHRcdFx0dGhpcy5fY29uZmlnLmVycm9yKGVycm9yKTtcblx0XHRcdGVsc2UgaWYgKElTX1BBUEFfV09SS0VSICYmIHRoaXMuX2NvbmZpZy5lcnJvcilcblx0XHRcdHtcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0ZXJyb3I6IGVycm9yLFxuXHRcdFx0XHRcdGZpbmlzaGVkOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gcmVwbGFjZUNvbmZpZyhjb25maWcpXG5cdFx0e1xuXHRcdFx0Ly8gRGVlcC1jb3B5IHRoZSBjb25maWcgc28gd2UgY2FuIGVkaXQgaXRcblx0XHRcdHZhciBjb25maWdDb3B5ID0gY29weShjb25maWcpO1xuXHRcdFx0Y29uZmlnQ29weS5jaHVua1NpemUgPSBwYXJzZUludChjb25maWdDb3B5LmNodW5rU2l6ZSk7XHQvLyBwYXJzZUludCBWRVJZIGltcG9ydGFudCBzbyB3ZSBkb24ndCBjb25jYXRlbmF0ZSBzdHJpbmdzIVxuXHRcdFx0aWYgKCFjb25maWcuc3RlcCAmJiAhY29uZmlnLmNodW5rKVxuXHRcdFx0XHRjb25maWdDb3B5LmNodW5rU2l6ZSA9IG51bGw7ICAvLyBkaXNhYmxlIFJhbmdlIGhlYWRlciBpZiBub3Qgc3RyZWFtaW5nOyBiYWQgdmFsdWVzIGJyZWFrIElJUyAtIHNlZSBpc3N1ZSAjMTk2XG5cdFx0XHR0aGlzLl9oYW5kbGUgPSBuZXcgUGFyc2VySGFuZGxlKGNvbmZpZ0NvcHkpO1xuXHRcdFx0dGhpcy5faGFuZGxlLnN0cmVhbWVyID0gdGhpcztcblx0XHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZ0NvcHk7XHQvLyBwZXJzaXN0IHRoZSBjb3B5IHRvIHRoZSBjYWxsZXJcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIE5ldHdvcmtTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0aWYgKCFjb25maWcuY2h1bmtTaXplKVxuXHRcdFx0Y29uZmlnLmNodW5rU2l6ZSA9IFBhcGEuUmVtb3RlQ2h1bmtTaXplO1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHhocjtcblxuXHRcdGlmIChJU19XT1JLRVIpXG5cdFx0e1xuXHRcdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoKTtcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKHVybClcblx0XHR7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IHVybDtcblx0XHRcdHRoaXMuX25leHRDaHVuaygpO1x0Ly8gU3RhcnRzIHN0cmVhbWluZ1xuXHRcdH07XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHRoaXMuX2ZpbmlzaGVkKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLndpdGhDcmVkZW50aWFscylcblx0XHRcdHtcblx0XHRcdFx0eGhyLndpdGhDcmVkZW50aWFscyA9IHRoaXMuX2NvbmZpZy53aXRoQ3JlZGVudGlhbHM7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghSVNfV09SS0VSKVxuXHRcdFx0e1xuXHRcdFx0XHR4aHIub25sb2FkID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rTG9hZGVkLCB0aGlzKTtcblx0XHRcdFx0eGhyLm9uZXJyb3IgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtFcnJvciwgdGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdHhoci5vcGVuKCdHRVQnLCB0aGlzLl9pbnB1dCwgIUlTX1dPUktFUik7XG5cblx0XHRcdGlmICh0aGlzLl9jb25maWcuY2h1bmtTaXplKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZW5kID0gdGhpcy5fc3RhcnQgKyB0aGlzLl9jb25maWcuY2h1bmtTaXplIC0gMTtcdC8vIG1pbnVzIG9uZSBiZWNhdXNlIGJ5dGUgcmFuZ2UgaXMgaW5jbHVzaXZlXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdSYW5nZScsICdieXRlcz0nK3RoaXMuX3N0YXJ0KyctJytlbmQpO1xuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignSWYtTm9uZS1NYXRjaCcsICd3ZWJraXQtbm8tY2FjaGUnKTsgLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgyNjcyXG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHhoci5zZW5kKCk7XG5cdFx0XHR9XG5cdFx0XHRjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoZXJyLm1lc3NhZ2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoSVNfV09SS0VSICYmIHhoci5zdGF0dXMgPT09IDApXG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0xvYWRlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgIT0gNClcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRpZiAoeGhyLnN0YXR1cyA8IDIwMCB8fCB4aHIuc3RhdHVzID49IDQwMClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcigpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXRoaXMuX2NvbmZpZy5jaHVua1NpemUgfHwgdGhpcy5fc3RhcnQgPiBnZXRGaWxlU2l6ZSh4aHIpO1xuXHRcdFx0dGhpcy5wYXJzZUNodW5rKHhoci5yZXNwb25zZVRleHQpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbihlcnJvck1lc3NhZ2UpXG5cdFx0e1xuXHRcdFx0dmFyIGVycm9yVGV4dCA9IHhoci5zdGF0dXNUZXh0IHx8IGVycm9yTWVzc2FnZTtcblx0XHRcdHRoaXMuX3NlbmRFcnJvcihlcnJvclRleHQpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEZpbGVTaXplKHhocilcblx0XHR7XG5cdFx0XHR2YXIgY29udGVudFJhbmdlID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVJhbmdlJyk7XG5cdFx0XHRpZiAoY29udGVudFJhbmdlID09PSBudWxsKSB7IC8vIG5vIGNvbnRlbnQgcmFuZ2UsIHRoZW4gZmluaXNoIVxuICAgICAgICBcdFx0XHRyZXR1cm4gLTE7XG4gICAgICAgICAgICBcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGNvbnRlbnRSYW5nZS5zdWJzdHIoY29udGVudFJhbmdlLmxhc3RJbmRleE9mKCcvJykgKyAxKSk7XG5cdFx0fVxuXHR9XG5cdE5ldHdvcmtTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENodW5rU3RyZWFtZXIucHJvdG90eXBlKTtcblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5ldHdvcmtTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIEZpbGVTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0aWYgKCFjb25maWcuY2h1bmtTaXplKVxuXHRcdFx0Y29uZmlnLmNodW5rU2l6ZSA9IFBhcGEuTG9jYWxDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgcmVhZGVyLCBzbGljZTtcblxuXHRcdC8vIEZpbGVSZWFkZXIgaXMgYmV0dGVyIHRoYW4gRmlsZVJlYWRlclN5bmMgKGV2ZW4gaW4gd29ya2VyKSAtIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcS8yNDcwODY0OS8xMDQ4ODYyXG5cdFx0Ly8gQnV0IEZpcmVmb3ggaXMgYSBwaWxsLCB0b28gLSBzZWUgaXNzdWUgIzc2OiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy83NlxuXHRcdHZhciB1c2luZ0FzeW5jUmVhZGVyID0gdHlwZW9mIEZpbGVSZWFkZXIgIT09ICd1bmRlZmluZWQnO1x0Ly8gU2FmYXJpIGRvZXNuJ3QgY29uc2lkZXIgaXQgYSBmdW5jdGlvbiAtIHNlZSBpc3N1ZSAjMTA1XG5cblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKGZpbGUpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSBmaWxlO1xuXHRcdFx0c2xpY2UgPSBmaWxlLnNsaWNlIHx8IGZpbGUud2Via2l0U2xpY2UgfHwgZmlsZS5tb3pTbGljZTtcblxuXHRcdFx0aWYgKHVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHRcdC8vIFByZWZlcnJlZCBtZXRob2Qgb2YgcmVhZGluZyBmaWxlcywgZXZlbiBpbiB3b3JrZXJzXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHRyZWFkZXIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKCk7XHQvLyBIYWNrIGZvciBydW5uaW5nIGluIGEgd2ViIHdvcmtlciBpbiBGaXJlZm94XG5cblx0XHRcdHRoaXMuX25leHRDaHVuaygpO1x0Ly8gU3RhcnRzIHN0cmVhbWluZ1xuXHRcdH07XG5cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZCAmJiAoIXRoaXMuX2NvbmZpZy5wcmV2aWV3IHx8IHRoaXMuX3Jvd0NvdW50IDwgdGhpcy5fY29uZmlnLnByZXZpZXcpKVxuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHR9XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dmFyIGlucHV0ID0gdGhpcy5faW5wdXQ7XG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IE1hdGgubWluKHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSwgdGhpcy5faW5wdXQuc2l6ZSk7XG5cdFx0XHRcdGlucHV0ID0gc2xpY2UuY2FsbChpbnB1dCwgdGhpcy5fc3RhcnQsIGVuZCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdHh0ID0gcmVhZGVyLnJlYWRBc1RleHQoaW5wdXQsIHRoaXMuX2NvbmZpZy5lbmNvZGluZyk7XG5cdFx0XHRpZiAoIXVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKHsgdGFyZ2V0OiB7IHJlc3VsdDogdHh0IH0gfSk7XHQvLyBtaW1pYyB0aGUgYXN5bmMgc2lnbmF0dXJlXG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbihldmVudClcblx0XHR7XG5cdFx0XHQvLyBWZXJ5IGltcG9ydGFudCB0byBpbmNyZW1lbnQgc3RhcnQgZWFjaCB0aW1lIGJlZm9yZSBoYW5kbGluZyByZXN1bHRzXG5cdFx0XHR0aGlzLl9zdGFydCArPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+PSB0aGlzLl9pbnB1dC5zaXplO1xuXHRcdFx0dGhpcy5wYXJzZUNodW5rKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKHJlYWRlci5lcnJvcik7XG5cdFx0fVxuXG5cdH1cblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmlsZVN0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gU3RyaW5nU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHN0cmluZztcblx0XHR2YXIgcmVtYWluaW5nO1xuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24ocylcblx0XHR7XG5cdFx0XHRzdHJpbmcgPSBzO1xuXHRcdFx0cmVtYWluaW5nID0gcztcblx0XHRcdHJldHVybiB0aGlzLl9uZXh0Q2h1bmsoKTtcblx0XHR9XG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZCkgcmV0dXJuO1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dmFyIGNodW5rID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoMCwgc2l6ZSkgOiByZW1haW5pbmc7XG5cdFx0XHRyZW1haW5pbmcgPSBzaXplID8gcmVtYWluaW5nLnN1YnN0cihzaXplKSA6ICcnO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhcmVtYWluaW5nO1xuXHRcdFx0cmV0dXJuIHRoaXMucGFyc2VDaHVuayhjaHVuayk7XG5cdFx0fVxuXHR9XG5cdFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nU3RyZWFtZXIucHJvdG90eXBlKTtcblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RyaW5nU3RyZWFtZXI7XG5cblxuXG5cdC8vIFVzZSBvbmUgUGFyc2VySGFuZGxlIHBlciBlbnRpcmUgQ1NWIGZpbGUgb3Igc3RyaW5nXG5cdGZ1bmN0aW9uIFBhcnNlckhhbmRsZShfY29uZmlnKVxuXHR7XG5cdFx0Ly8gT25lIGdvYWwgaXMgdG8gbWluaW1pemUgdGhlIHVzZSBvZiByZWd1bGFyIGV4cHJlc3Npb25zLi4uXG5cdFx0dmFyIEZMT0FUID0gL15cXHMqLT8oXFxkKlxcLj9cXGQrfFxcZCtcXC4/XFxkKikoZVstK10/XFxkKyk/XFxzKiQvaTtcblxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgX3N0ZXBDb3VudGVyID0gMDtcdC8vIE51bWJlciBvZiB0aW1lcyBzdGVwIHdhcyBjYWxsZWQgKG51bWJlciBvZiByb3dzIHBhcnNlZClcblx0XHR2YXIgX2lucHV0O1x0XHRcdFx0Ly8gVGhlIGlucHV0IGJlaW5nIHBhcnNlZFxuXHRcdHZhciBfcGFyc2VyO1x0XHRcdC8vIFRoZSBjb3JlIHBhcnNlciBiZWluZyB1c2VkXG5cdFx0dmFyIF9wYXVzZWQgPSBmYWxzZTtcdC8vIFdoZXRoZXIgd2UgYXJlIHBhdXNlZCBvciBub3Rcblx0XHR2YXIgX2Fib3J0ZWQgPSBmYWxzZTsgICAvLyBXaGV0aGVyIHRoZSBwYXJzZXIgaGFzIGFib3J0ZWQgb3Igbm90XG5cdFx0dmFyIF9kZWxpbWl0ZXJFcnJvcjtcdC8vIFRlbXBvcmFyeSBzdGF0ZSBiZXR3ZWVuIGRlbGltaXRlciBkZXRlY3Rpb24gYW5kIHByb2Nlc3NpbmcgcmVzdWx0c1xuXHRcdHZhciBfZmllbGRzID0gW107XHRcdC8vIEZpZWxkcyBhcmUgZnJvbSB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgaW5wdXQsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdHZhciBfcmVzdWx0cyA9IHtcdFx0Ly8gVGhlIGxhc3QgcmVzdWx0cyByZXR1cm5lZCBmcm9tIHRoZSBwYXJzZXJcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblxuXHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCkpXG5cdFx0e1xuXHRcdFx0dmFyIHVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0X2NvbmZpZy5zdGVwID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdHtcblx0XHRcdFx0X3Jlc3VsdHMgPSByZXN1bHRzO1xuXG5cdFx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRcdGVsc2VcdC8vIG9ubHkgY2FsbCB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhZnRlciBoZWFkZXIgcm93XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXG5cdFx0XHRcdFx0Ly8gSXQncyBwb3NzYmlsZSB0aGF0IHRoaXMgbGluZSB3YXMgZW1wdHkgYW5kIHRoZXJlJ3Mgbm8gcm93IGhlcmUgYWZ0ZXIgYWxsXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGEubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdFx0X3N0ZXBDb3VudGVyICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfc3RlcENvdW50ZXIgPiBfY29uZmlnLnByZXZpZXcpXG5cdFx0XHRcdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dXNlclN0ZXAoX3Jlc3VsdHMsIHNlbGYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFBhcnNlcyBpbnB1dC4gTW9zdCB1c2VycyB3b24ndCBuZWVkLCBhbmQgc2hvdWxkbid0IG1lc3Mgd2l0aCwgdGhlIGJhc2VJbmRleFxuXHRcdCAqIGFuZCBpZ25vcmVMYXN0Um93IHBhcmFtZXRlcnMuIFRoZXkgYXJlIHVzZWQgYnkgc3RyZWFtZXJzICh3cmFwcGVyIGZ1bmN0aW9ucylcblx0XHQgKiB3aGVuIGFuIGlucHV0IGNvbWVzIGluIG11bHRpcGxlIGNodW5rcywgbGlrZSBmcm9tIGEgZmlsZS5cblx0XHQgKi9cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHRpZiAoIV9jb25maWcubmV3bGluZSlcblx0XHRcdFx0X2NvbmZpZy5uZXdsaW5lID0gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dCk7XG5cblx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0aWYgKCFfY29uZmlnLmRlbGltaXRlcilcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltR3Vlc3MgPSBndWVzc0RlbGltaXRlcihpbnB1dCwgX2NvbmZpZy5uZXdsaW5lKTtcblx0XHRcdFx0aWYgKGRlbGltR3Vlc3Muc3VjY2Vzc2Z1bClcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGRlbGltR3Vlc3MuYmVzdERlbGltaXRlcjtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gdHJ1ZTtcdC8vIGFkZCBlcnJvciBhZnRlciBwYXJzaW5nIChvdGhlcndpc2UgaXQgd291bGQgYmUgb3ZlcndyaXR0ZW4pXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBQYXBhLkRlZmF1bHREZWxpbWl0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYodHlwZW9mIF9jb25maWcuZGVsaW1pdGVyID09PSAnZnVuY3Rpb24nKVxuXHRcdFx0e1xuXHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyKGlucHV0KTtcblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHBhcnNlckNvbmZpZyA9IGNvcHkoX2NvbmZpZyk7XG5cdFx0XHRpZiAoX2NvbmZpZy5wcmV2aWV3ICYmIF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHRwYXJzZXJDb25maWcucHJldmlldysrO1x0Ly8gdG8gY29tcGVuc2F0ZSBmb3IgaGVhZGVyIHJvd1xuXG5cdFx0XHRfaW5wdXQgPSBpbnB1dDtcblx0XHRcdF9wYXJzZXIgPSBuZXcgUGFyc2VyKHBhcnNlckNvbmZpZyk7XG5cdFx0XHRfcmVzdWx0cyA9IF9wYXJzZXIucGFyc2UoX2lucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpO1xuXHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblx0XHRcdHJldHVybiBfcGF1c2VkID8geyBtZXRhOiB7IHBhdXNlZDogdHJ1ZSB9IH0gOiAoX3Jlc3VsdHMgfHwgeyBtZXRhOiB7IHBhdXNlZDogZmFsc2UgfSB9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X3BhdXNlZCA9IHRydWU7XG5cdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRfaW5wdXQgPSBfaW5wdXQuc3Vic3RyKF9wYXJzZXIuZ2V0Q2hhckluZGV4KCkpO1xuXHRcdH07XG5cblx0XHR0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gZmFsc2U7XG5cdFx0XHRzZWxmLnN0cmVhbWVyLnBhcnNlQ2h1bmsoX2lucHV0KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5hYm9ydGVkID0gZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX2Fib3J0ZWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWJvcnQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X2Fib3J0ZWQgPSB0cnVlO1xuXHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0X3Jlc3VsdHMubWV0YS5hYm9ydGVkID0gdHJ1ZTtcblx0XHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuY29tcGxldGUpKVxuXHRcdFx0XHRfY29uZmlnLmNvbXBsZXRlKF9yZXN1bHRzKTtcblx0XHRcdF9pbnB1dCA9ICcnO1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBwcm9jZXNzUmVzdWx0cygpXG5cdFx0e1xuXHRcdFx0aWYgKF9yZXN1bHRzICYmIF9kZWxpbWl0ZXJFcnJvcilcblx0XHRcdHtcblx0XHRcdFx0YWRkRXJyb3IoJ0RlbGltaXRlcicsICdVbmRldGVjdGFibGVEZWxpbWl0ZXInLCAnVW5hYmxlIHRvIGF1dG8tZGV0ZWN0IGRlbGltaXRpbmcgY2hhcmFjdGVyOyBkZWZhdWx0ZWQgdG8gXFwnJytQYXBhLkRlZmF1bHREZWxpbWl0ZXIrJ1xcJycpO1xuXHRcdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jb25maWcuc2tpcEVtcHR5TGluZXMpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0XHRpZiAoX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGggPT09IDEgJiYgX3Jlc3VsdHMuZGF0YVtpXVswXSA9PT0gJycpXG5cdFx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhLnNwbGljZShpLS0sIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobmVlZHNIZWFkZXJSb3coKSlcblx0XHRcdFx0ZmlsbEhlYWRlckZpZWxkcygpO1xuXG5cdFx0XHRyZXR1cm4gYXBwbHlIZWFkZXJBbmREeW5hbWljVHlwaW5nKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gbmVlZHNIZWFkZXJSb3coKVxuXHRcdHtcblx0XHRcdHJldHVybiBfY29uZmlnLmhlYWRlciAmJiBfZmllbGRzLmxlbmd0aCA9PT0gMDtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBmaWxsSGVhZGVyRmllbGRzKClcblx0XHR7XG5cdFx0XHRpZiAoIV9yZXN1bHRzKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgbmVlZHNIZWFkZXJSb3coKSAmJiBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aDsgaisrKVxuXHRcdFx0XHRcdF9maWVsZHMucHVzaChfcmVzdWx0cy5kYXRhW2ldW2pdKTtcblx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKDAsIDEpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHBhcnNlRHluYW1pYyhmaWVsZCwgdmFsdWUpXG5cdFx0e1xuXHRcdFx0aWYgKChfY29uZmlnLmR5bmFtaWNUeXBpbmdbZmllbGRdIHx8IF9jb25maWcuZHluYW1pY1R5cGluZykgPT09IHRydWUpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gJ3RydWUnIHx8IHZhbHVlID09PSAnVFJVRScpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdGVsc2UgaWYgKHZhbHVlID09PSAnZmFsc2UnIHx8IHZhbHVlID09PSAnRkFMU0UnKVxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHJldHVybiB0cnlQYXJzZUZsb2F0KHZhbHVlKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMgfHwgKCFfY29uZmlnLmhlYWRlciAmJiAhX2NvbmZpZy5keW5hbWljVHlwaW5nKSlcblx0XHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciByb3cgPSBfY29uZmlnLmhlYWRlciA/IHt9IDogW107XG5cblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aDsgaisrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIGZpZWxkID0gajtcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBfcmVzdWx0cy5kYXRhW2ldW2pdO1xuXG5cdFx0XHRcdFx0aWYgKF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHRcdFx0ZmllbGQgPSBqID49IF9maWVsZHMubGVuZ3RoID8gJ19fcGFyc2VkX2V4dHJhJyA6IF9maWVsZHNbal07XG5cblx0XHRcdFx0XHR2YWx1ZSA9IHBhcnNlRHluYW1pYyhmaWVsZCwgdmFsdWUpO1xuXG5cdFx0XHRcdFx0aWYgKGZpZWxkID09PSAnX19wYXJzZWRfZXh0cmEnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHJvd1tmaWVsZF0gPSByb3dbZmllbGRdIHx8IFtdO1xuXHRcdFx0XHRcdFx0cm93W2ZpZWxkXS5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0cm93W2ZpZWxkXSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0X3Jlc3VsdHMuZGF0YVtpXSA9IHJvdztcblxuXHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaiA+IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoJ0ZpZWxkTWlzbWF0Y2gnLCAnVG9vTWFueUZpZWxkcycsICdUb28gbWFueSBmaWVsZHM6IGV4cGVjdGVkICcgKyBfZmllbGRzLmxlbmd0aCArICcgZmllbGRzIGJ1dCBwYXJzZWQgJyArIGosIGkpO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGogPCBfZmllbGRzLmxlbmd0aClcblx0XHRcdFx0XHRcdGFkZEVycm9yKCdGaWVsZE1pc21hdGNoJywgJ1Rvb0Zld0ZpZWxkcycsICdUb28gZmV3IGZpZWxkczogZXhwZWN0ZWQgJyArIF9maWVsZHMubGVuZ3RoICsgJyBmaWVsZHMgYnV0IHBhcnNlZCAnICsgaiwgaSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jb25maWcuaGVhZGVyICYmIF9yZXN1bHRzLm1ldGEpXG5cdFx0XHRcdF9yZXN1bHRzLm1ldGEuZmllbGRzID0gX2ZpZWxkcztcblx0XHRcdHJldHVybiBfcmVzdWx0cztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBndWVzc0RlbGltaXRlcihpbnB1dCwgbmV3bGluZSlcblx0XHR7XG5cdFx0XHR2YXIgZGVsaW1DaG9pY2VzID0gWycsJywgJ1xcdCcsICd8JywgJzsnLCBQYXBhLlJFQ09SRF9TRVAsIFBhcGEuVU5JVF9TRVBdO1xuXHRcdFx0dmFyIGJlc3REZWxpbSwgYmVzdERlbHRhLCBmaWVsZENvdW50UHJldlJvdztcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWxpbUNob2ljZXMubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkZWxpbSA9IGRlbGltQ2hvaWNlc1tpXTtcblx0XHRcdFx0dmFyIGRlbHRhID0gMCwgYXZnRmllbGRDb3VudCA9IDA7XG5cdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdHZhciBwcmV2aWV3ID0gbmV3IFBhcnNlcih7XG5cdFx0XHRcdFx0ZGVsaW1pdGVyOiBkZWxpbSxcblx0XHRcdFx0XHRuZXdsaW5lOiBuZXdsaW5lLFxuXHRcdFx0XHRcdHByZXZpZXc6IDEwXG5cdFx0XHRcdH0pLnBhcnNlKGlucHV0KTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHByZXZpZXcuZGF0YS5sZW5ndGg7IGorKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciBmaWVsZENvdW50ID0gcHJldmlldy5kYXRhW2pdLmxlbmd0aDtcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50ICs9IGZpZWxkQ291bnQ7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIGZpZWxkQ291bnRQcmV2Um93ID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IGZpZWxkQ291bnQ7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoZmllbGRDb3VudCA+IDEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGVsdGEgKz0gTWF0aC5hYnMoZmllbGRDb3VudCAtIGZpZWxkQ291bnRQcmV2Um93KTtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocHJldmlldy5kYXRhLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0YXZnRmllbGRDb3VudCAvPSBwcmV2aWV3LmRhdGEubGVuZ3RoO1xuXG5cdFx0XHRcdGlmICgodHlwZW9mIGJlc3REZWx0YSA9PT0gJ3VuZGVmaW5lZCcgfHwgZGVsdGEgPCBiZXN0RGVsdGEpXG5cdFx0XHRcdFx0JiYgYXZnRmllbGRDb3VudCA+IDEuOTkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiZXN0RGVsdGEgPSBkZWx0YTtcblx0XHRcdFx0XHRiZXN0RGVsaW0gPSBkZWxpbTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGJlc3REZWxpbTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2Vzc2Z1bDogISFiZXN0RGVsaW0sXG5cdFx0XHRcdGJlc3REZWxpbWl0ZXI6IGJlc3REZWxpbVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzTGluZUVuZGluZ3MoaW5wdXQpXG5cdFx0e1xuXHRcdFx0aW5wdXQgPSBpbnB1dC5zdWJzdHIoMCwgMTAyNCoxMDI0KTtcdC8vIG1heCBsZW5ndGggMSBNQlxuXG5cdFx0XHR2YXIgciA9IGlucHV0LnNwbGl0KCdcXHInKTtcblxuXHRcdFx0dmFyIG4gPSBpbnB1dC5zcGxpdCgnXFxuJyk7XG5cblx0XHRcdHZhciBuQXBwZWFyc0ZpcnN0ID0gKG4ubGVuZ3RoID4gMSAmJiBuWzBdLmxlbmd0aCA8IHJbMF0ubGVuZ3RoKTtcblxuXHRcdFx0aWYgKHIubGVuZ3RoID09PSAxIHx8IG5BcHBlYXJzRmlyc3QpXG5cdFx0XHRcdHJldHVybiAnXFxuJztcblxuXHRcdFx0dmFyIG51bVdpdGhOID0gMDtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0aWYgKHJbaV1bMF0gPT09ICdcXG4nKVxuXHRcdFx0XHRcdG51bVdpdGhOKys7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudW1XaXRoTiA+PSByLmxlbmd0aCAvIDIgPyAnXFxyXFxuJyA6ICdcXHInO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyeVBhcnNlRmxvYXQodmFsKVxuXHRcdHtcblx0XHRcdHZhciBpc051bWJlciA9IEZMT0FULnRlc3QodmFsKTtcblx0XHRcdHJldHVybiBpc051bWJlciA/IHBhcnNlRmxvYXQodmFsKSA6IHZhbDtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBhZGRFcnJvcih0eXBlLCBjb2RlLCBtc2csIHJvdylcblx0XHR7XG5cdFx0XHRfcmVzdWx0cy5lcnJvcnMucHVzaCh7XG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdGNvZGU6IGNvZGUsXG5cdFx0XHRcdG1lc3NhZ2U6IG1zZyxcblx0XHRcdFx0cm93OiByb3dcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cblxuXG5cblx0LyoqIFRoZSBjb3JlIHBhcnNlciBpbXBsZW1lbnRzIHNwZWVkeSBhbmQgY29ycmVjdCBDU1YgcGFyc2luZyAqL1xuXHRmdW5jdGlvbiBQYXJzZXIoY29uZmlnKVxuXHR7XG5cdFx0Ly8gVW5wYWNrIHRoZSBjb25maWcgb2JqZWN0XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdHZhciBkZWxpbSA9IGNvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0dmFyIG5ld2xpbmUgPSBjb25maWcubmV3bGluZTtcblx0XHR2YXIgY29tbWVudHMgPSBjb25maWcuY29tbWVudHM7XG5cdFx0dmFyIHN0ZXAgPSBjb25maWcuc3RlcDtcblx0XHR2YXIgcHJldmlldyA9IGNvbmZpZy5wcmV2aWV3O1xuXHRcdHZhciBmYXN0TW9kZSA9IGNvbmZpZy5mYXN0TW9kZTtcblx0XHR2YXIgcXVvdGVDaGFyID0gY29uZmlnLnF1b3RlQ2hhciB8fCAnXCInO1xuXG5cdFx0Ly8gRGVsaW1pdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAodHlwZW9mIGRlbGltICE9PSAnc3RyaW5nJ1xuXHRcdFx0fHwgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKGRlbGltKSA+IC0xKVxuXHRcdFx0ZGVsaW0gPSAnLCc7XG5cblx0XHQvLyBDb21tZW50IGNoYXJhY3RlciBtdXN0IGJlIHZhbGlkXG5cdFx0aWYgKGNvbW1lbnRzID09PSBkZWxpbSlcblx0XHRcdHRocm93ICdDb21tZW50IGNoYXJhY3RlciBzYW1lIGFzIGRlbGltaXRlcic7XG5cdFx0ZWxzZSBpZiAoY29tbWVudHMgPT09IHRydWUpXG5cdFx0XHRjb21tZW50cyA9ICcjJztcblx0XHRlbHNlIGlmICh0eXBlb2YgY29tbWVudHMgIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoY29tbWVudHMpID4gLTEpXG5cdFx0XHRjb21tZW50cyA9IGZhbHNlO1xuXG5cdFx0Ly8gTmV3bGluZSBtdXN0IGJlIHZhbGlkOiBcXHIsIFxcbiwgb3IgXFxyXFxuXG5cdFx0aWYgKG5ld2xpbmUgIT0gJ1xcbicgJiYgbmV3bGluZSAhPSAnXFxyJyAmJiBuZXdsaW5lICE9ICdcXHJcXG4nKVxuXHRcdFx0bmV3bGluZSA9ICdcXG4nO1xuXG5cdFx0Ly8gV2UncmUgZ29ubmEgbmVlZCB0aGVzZSBhdCB0aGUgUGFyc2VyIHNjb3BlXG5cdFx0dmFyIGN1cnNvciA9IDA7XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KVxuXHRcdHtcblx0XHRcdC8vIEZvciBzb21lIHJlYXNvbiwgaW4gQ2hyb21lLCB0aGlzIHNwZWVkcyB0aGluZ3MgdXAgKCE/KVxuXHRcdFx0aWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpXG5cdFx0XHRcdHRocm93ICdJbnB1dCBtdXN0IGJlIGEgc3RyaW5nJztcblxuXHRcdFx0Ly8gV2UgZG9uJ3QgbmVlZCB0byBjb21wdXRlIHNvbWUgb2YgdGhlc2UgZXZlcnkgdGltZSBwYXJzZSgpIGlzIGNhbGxlZCxcblx0XHRcdC8vIGJ1dCBoYXZpbmcgdGhlbSBpbiBhIG1vcmUgbG9jYWwgc2NvcGUgc2VlbXMgdG8gcGVyZm9ybSBiZXR0ZXJcblx0XHRcdHZhciBpbnB1dExlbiA9IGlucHV0Lmxlbmd0aCxcblx0XHRcdFx0ZGVsaW1MZW4gPSBkZWxpbS5sZW5ndGgsXG5cdFx0XHRcdG5ld2xpbmVMZW4gPSBuZXdsaW5lLmxlbmd0aCxcblx0XHRcdFx0Y29tbWVudHNMZW4gPSBjb21tZW50cy5sZW5ndGg7XG5cdFx0XHR2YXIgc3RlcElzRnVuY3Rpb24gPSB0eXBlb2Ygc3RlcCA9PT0gJ2Z1bmN0aW9uJztcblxuXHRcdFx0Ly8gRXN0YWJsaXNoIHN0YXJ0aW5nIHN0YXRlXG5cdFx0XHRjdXJzb3IgPSAwO1xuXHRcdFx0dmFyIGRhdGEgPSBbXSwgZXJyb3JzID0gW10sIHJvdyA9IFtdLCBsYXN0Q3Vyc29yID0gMDtcblxuXHRcdFx0aWYgKCFpbnB1dClcblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblxuXHRcdFx0aWYgKGZhc3RNb2RlIHx8IChmYXN0TW9kZSAhPT0gZmFsc2UgJiYgaW5wdXQuaW5kZXhPZihxdW90ZUNoYXIpID09PSAtMSkpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciByb3dzID0gaW5wdXQuc3BsaXQobmV3bGluZSk7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciByb3cgPSByb3dzW2ldO1xuXHRcdFx0XHRcdGN1cnNvciArPSByb3cubGVuZ3RoO1xuXHRcdFx0XHRcdGlmIChpICE9PSByb3dzLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0XHRjdXJzb3IgKz0gbmV3bGluZS5sZW5ndGg7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaWdub3JlTGFzdFJvdylcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0aWYgKGNvbW1lbnRzICYmIHJvdy5zdWJzdHIoMCwgY29tbWVudHNMZW4pID09PSBjb21tZW50cylcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkYXRhID0gW107XG5cdFx0XHRcdFx0XHRwdXNoUm93KHJvdy5zcGxpdChkZWxpbSkpO1xuXHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBpID49IHByZXZpZXcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IGRhdGEuc2xpY2UoMCwgcHJldmlldyk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHR2YXIgbmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHR2YXIgcXVvdGVDaGFyUmVnZXggPSBuZXcgUmVnRXhwKHF1b3RlQ2hhcitxdW90ZUNoYXIsICdnJyk7XG5cblx0XHRcdC8vIFBhcnNlciBsb29wXG5cdFx0XHRmb3IgKDs7KVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBGaWVsZCBoYXMgb3BlbmluZyBxdW90ZVxuXHRcdFx0XHRpZiAoaW5wdXRbY3Vyc29yXSA9PT0gcXVvdGVDaGFyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly8gU3RhcnQgb3VyIHNlYXJjaCBmb3IgdGhlIGNsb3NpbmcgcXVvdGUgd2hlcmUgdGhlIGN1cnNvciBpc1xuXHRcdFx0XHRcdHZhciBxdW90ZVNlYXJjaCA9IGN1cnNvcjtcblxuXHRcdFx0XHRcdC8vIFNraXAgdGhlIG9wZW5pbmcgcXVvdGVcblx0XHRcdFx0XHRjdXJzb3IrKztcblxuXHRcdFx0XHRcdGZvciAoOzspXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8gRmluZCBjbG9zaW5nIHF1b3RlXG5cdFx0XHRcdFx0XHR2YXIgcXVvdGVTZWFyY2ggPSBpbnB1dC5pbmRleE9mKHF1b3RlQ2hhciwgcXVvdGVTZWFyY2grMSk7XG5cblx0XHRcdFx0XHRcdGlmIChxdW90ZVNlYXJjaCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmICghaWdub3JlTGFzdFJvdykge1xuXHRcdFx0XHRcdFx0XHRcdC8vIE5vIGNsb3NpbmcgcXVvdGUuLi4gd2hhdCBhIHBpdHlcblx0XHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiAnUXVvdGVzJyxcblx0XHRcdFx0XHRcdFx0XHRcdGNvZGU6ICdNaXNzaW5nUXVvdGVzJyxcblx0XHRcdFx0XHRcdFx0XHRcdG1lc3NhZ2U6ICdRdW90ZWQgZmllbGQgdW50ZXJtaW5hdGVkJyxcblx0XHRcdFx0XHRcdFx0XHRcdHJvdzogZGF0YS5sZW5ndGgsXHQvLyByb3cgaGFzIHlldCB0byBiZSBpbnNlcnRlZFxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGN1cnNvclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmaW5pc2goKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSBpbnB1dExlbi0xKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGF0IEVPRlxuXHRcdFx0XHRcdFx0XHR2YXIgdmFsdWUgPSBpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgcXVvdGVDaGFyKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIElmIHRoaXMgcXVvdGUgaXMgZXNjYXBlZCwgaXQncyBwYXJ0IG9mIHRoZSBkYXRhOyBza2lwIGl0XG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2grMV0gPT09IHF1b3RlQ2hhcilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cXVvdGVTZWFyY2grKztcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpbnB1dFtxdW90ZVNlYXJjaCsxXSA9PT0gZGVsaW0pXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgZGVsaW1pdGVyXG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpKTtcblx0XHRcdFx0XHRcdFx0Y3Vyc29yID0gcXVvdGVTZWFyY2ggKyAxICsgZGVsaW1MZW47XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGlucHV0LnN1YnN0cihxdW90ZVNlYXJjaCsxLCBuZXdsaW5lTGVuKSA9PT0gbmV3bGluZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBmb2xsb3dlZCBieSBuZXdsaW5lXG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpKTtcblx0XHRcdFx0XHRcdFx0c2F2ZVJvdyhxdW90ZVNlYXJjaCArIDEgKyBuZXdsaW5lTGVuKTtcblx0XHRcdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcdC8vIGJlY2F1c2Ugd2UgbWF5IGhhdmUgc2tpcHBlZCB0aGUgbmV4dERlbGltIGluIHRoZSBxdW90ZWQgZmllbGRcblxuXHRcdFx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBkYXRhLmxlbmd0aCA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQ29tbWVudCBmb3VuZCBhdCBzdGFydCBvZiBuZXcgbGluZVxuXHRcdFx0XHRpZiAoY29tbWVudHMgJiYgcm93Lmxlbmd0aCA9PT0gMCAmJiBpbnB1dC5zdWJzdHIoY3Vyc29yLCBjb21tZW50c0xlbikgPT09IGNvbW1lbnRzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG5leHROZXdsaW5lID09PSAtMSlcdC8vIENvbW1lbnQgZW5kcyBhdCBFT0Zcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0Y3Vyc29yID0gbmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuO1xuXHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBOZXh0IGRlbGltaXRlciBjb21lcyBiZWZvcmUgbmV4dCBuZXdsaW5lLCBzbyB3ZSd2ZSByZWFjaGVkIGVuZCBvZiBmaWVsZFxuXHRcdFx0XHRpZiAobmV4dERlbGltICE9PSAtMSAmJiAobmV4dERlbGltIDwgbmV4dE5ld2xpbmUgfHwgbmV4dE5ld2xpbmUgPT09IC0xKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIG5leHREZWxpbSkpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHREZWxpbSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbmQgb2Ygcm93XG5cdFx0XHRcdGlmIChuZXh0TmV3bGluZSAhPT0gLTEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0TmV3bGluZSkpO1xuXHRcdFx0XHRcdHNhdmVSb3cobmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuKTtcblxuXHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGRhdGEubGVuZ3RoID49IHByZXZpZXcpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblxuXHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXG5cblx0XHRcdGZ1bmN0aW9uIHB1c2hSb3cocm93KVxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhLnB1c2gocm93KTtcblx0XHRcdFx0bGFzdEN1cnNvciA9IGN1cnNvcjtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBcHBlbmRzIHRoZSByZW1haW5pbmcgaW5wdXQgZnJvbSBjdXJzb3IgdG8gdGhlIGVuZCBpbnRvXG5cdFx0XHQgKiByb3csIHNhdmVzIHRoZSByb3csIGNhbGxzIHN0ZXAsIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzLlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBmaW5pc2godmFsdWUpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChpZ25vcmVMYXN0Um93KVxuXHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxuXHRcdFx0XHRcdHZhbHVlID0gaW5wdXQuc3Vic3RyKGN1cnNvcik7XG5cdFx0XHRcdHJvdy5wdXNoKHZhbHVlKTtcblx0XHRcdFx0Y3Vyc29yID0gaW5wdXRMZW47XHQvLyBpbXBvcnRhbnQgaW4gY2FzZSBwYXJzaW5nIGlzIHBhdXNlZFxuXHRcdFx0XHRwdXNoUm93KHJvdyk7XG5cdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBcHBlbmRzIHRoZSBjdXJyZW50IHJvdyB0byB0aGUgcmVzdWx0cy4gSXQgc2V0cyB0aGUgY3Vyc29yXG5cdFx0XHQgKiB0byBuZXdDdXJzb3IgYW5kIGZpbmRzIHRoZSBuZXh0TmV3bGluZS4gVGhlIGNhbGxlciBzaG91bGRcblx0XHRcdCAqIHRha2UgY2FyZSB0byBleGVjdXRlIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFuZCBjaGVjayBmb3Jcblx0XHRcdCAqIHByZXZpZXcgYW5kIGVuZCBwYXJzaW5nIGlmIG5lY2Vzc2FyeS5cblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gc2F2ZVJvdyhuZXdDdXJzb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGN1cnNvciA9IG5ld0N1cnNvcjtcblx0XHRcdFx0cHVzaFJvdyhyb3cpO1xuXHRcdFx0XHRyb3cgPSBbXTtcblx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHR9XG5cblx0XHRcdC8qKiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSByZXN1bHRzLCBlcnJvcnMsIGFuZCBtZXRhLiAqL1xuXHRcdFx0ZnVuY3Rpb24gcmV0dXJuYWJsZShzdG9wcGVkKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRcdFx0ZXJyb3JzOiBlcnJvcnMsXG5cdFx0XHRcdFx0bWV0YToge1xuXHRcdFx0XHRcdFx0ZGVsaW1pdGVyOiBkZWxpbSxcblx0XHRcdFx0XHRcdGxpbmVicmVhazogbmV3bGluZSxcblx0XHRcdFx0XHRcdGFib3J0ZWQ6IGFib3J0ZWQsXG5cdFx0XHRcdFx0XHR0cnVuY2F0ZWQ6ICEhc3RvcHBlZCxcblx0XHRcdFx0XHRcdGN1cnNvcjogbGFzdEN1cnNvciArIChiYXNlSW5kZXggfHwgMClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdC8qKiBFeGVjdXRlcyB0aGUgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYW5kIHJlc2V0cyBkYXRhICYgZXJyb3JzLiAqL1xuXHRcdFx0ZnVuY3Rpb24gZG9TdGVwKClcblx0XHRcdHtcblx0XHRcdFx0c3RlcChyZXR1cm5hYmxlKCkpO1xuXHRcdFx0XHRkYXRhID0gW10sIGVycm9ycyA9IFtdO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKiogU2V0cyB0aGUgYWJvcnQgZmxhZyAqL1xuXHRcdHRoaXMuYWJvcnQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0YWJvcnRlZCA9IHRydWU7XG5cdFx0fTtcblxuXHRcdC8qKiBHZXRzIHRoZSBjdXJzb3IgcG9zaXRpb24gKi9cblx0XHR0aGlzLmdldENoYXJJbmRleCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gY3Vyc29yO1xuXHRcdH07XG5cdH1cblxuXG5cdC8vIElmIHlvdSBuZWVkIHRvIGxvYWQgUGFwYSBQYXJzZSBhc3luY2hyb25vdXNseSBhbmQgeW91IGFsc28gbmVlZCB3b3JrZXIgdGhyZWFkcywgaGFyZC1jb2RlXG5cdC8vIHRoZSBzY3JpcHQgcGF0aCBoZXJlLiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2UvaXNzdWVzLzg3I2lzc3VlY29tbWVudC01Nzg4NTM1OFxuXHRmdW5jdGlvbiBnZXRTY3JpcHRQYXRoKClcblx0e1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuXHRcdHJldHVybiBzY3JpcHRzLmxlbmd0aCA/IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmMgOiAnJztcblx0fVxuXG5cdGZ1bmN0aW9uIG5ld1dvcmtlcigpXG5cdHtcblx0XHRpZiAoIVBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0aWYgKCFMT0FERURfU1lOQyAmJiBQYXBhLlNDUklQVF9QQVRIID09PSBudWxsKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHQnU2NyaXB0IHBhdGggY2Fubm90IGJlIGRldGVybWluZWQgYXV0b21hdGljYWxseSB3aGVuIFBhcGEgUGFyc2UgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5LiAnICtcblx0XHRcdFx0J1lvdSBuZWVkIHRvIHNldCBQYXBhLlNDUklQVF9QQVRIIG1hbnVhbGx5Lidcblx0XHRcdCk7XG5cdFx0dmFyIHdvcmtlclVybCA9IFBhcGEuU0NSSVBUX1BBVEggfHwgQVVUT19TQ1JJUFRfUEFUSDtcblx0XHQvLyBBcHBlbmQgJ3BhcGF3b3JrZXInIHRvIHRoZSBzZWFyY2ggc3RyaW5nIHRvIHRlbGwgcGFwYXBhcnNlIHRoYXQgdGhpcyBpcyBvdXIgd29ya2VyLlxuXHRcdHdvcmtlclVybCArPSAod29ya2VyVXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgJ3BhcGF3b3JrZXInO1xuXHRcdHZhciB3ID0gbmV3IGdsb2JhbC5Xb3JrZXIod29ya2VyVXJsKTtcblx0XHR3Lm9ubWVzc2FnZSA9IG1haW5UaHJlYWRSZWNlaXZlZE1lc3NhZ2U7XG5cdFx0dy5pZCA9IHdvcmtlcklkQ291bnRlcisrO1xuXHRcdHdvcmtlcnNbdy5pZF0gPSB3O1xuXHRcdHJldHVybiB3O1xuXHR9XG5cblx0LyoqIENhbGxiYWNrIHdoZW4gbWFpbiB0aHJlYWQgcmVjZWl2ZXMgYSBtZXNzYWdlICovXG5cdGZ1bmN0aW9uIG1haW5UaHJlYWRSZWNlaXZlZE1lc3NhZ2UoZSlcblx0e1xuXHRcdHZhciBtc2cgPSBlLmRhdGE7XG5cdFx0dmFyIHdvcmtlciA9IHdvcmtlcnNbbXNnLndvcmtlcklkXTtcblx0XHR2YXIgYWJvcnRlZCA9IGZhbHNlO1xuXG5cdFx0aWYgKG1zZy5lcnJvcilcblx0XHRcdHdvcmtlci51c2VyRXJyb3IobXNnLmVycm9yLCBtc2cuZmlsZSk7XG5cdFx0ZWxzZSBpZiAobXNnLnJlc3VsdHMgJiYgbXNnLnJlc3VsdHMuZGF0YSlcblx0XHR7XG5cdFx0XHR2YXIgYWJvcnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0YWJvcnRlZCA9IHRydWU7XG5cdFx0XHRcdGNvbXBsZXRlV29ya2VyKG1zZy53b3JrZXJJZCwgeyBkYXRhOiBbXSwgZXJyb3JzOiBbXSwgbWV0YTogeyBhYm9ydGVkOiB0cnVlIH0gfSk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlID0ge1xuXHRcdFx0XHRhYm9ydDogYWJvcnQsXG5cdFx0XHRcdHBhdXNlOiBub3RJbXBsZW1lbnRlZCxcblx0XHRcdFx0cmVzdW1lOiBub3RJbXBsZW1lbnRlZFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJTdGVwKSlcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBtc2cucmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0d29ya2VyLnVzZXJTdGVwKHtcblx0XHRcdFx0XHRcdGRhdGE6IFttc2cucmVzdWx0cy5kYXRhW2ldXSxcblx0XHRcdFx0XHRcdGVycm9yczogbXNnLnJlc3VsdHMuZXJyb3JzLFxuXHRcdFx0XHRcdFx0bWV0YTogbXNnLnJlc3VsdHMubWV0YVxuXHRcdFx0XHRcdH0sIGhhbmRsZSk7XG5cdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWxldGUgbXNnLnJlc3VsdHM7XHQvLyBmcmVlIG1lbW9yeSBBU0FQXG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyQ2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR3b3JrZXIudXNlckNodW5rKG1zZy5yZXN1bHRzLCBoYW5kbGUsIG1zZy5maWxlKTtcblx0XHRcdFx0ZGVsZXRlIG1zZy5yZXN1bHRzO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtc2cuZmluaXNoZWQgJiYgIWFib3J0ZWQpXG5cdFx0XHRjb21wbGV0ZVdvcmtlcihtc2cud29ya2VySWQsIG1zZy5yZXN1bHRzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbXBsZXRlV29ya2VyKHdvcmtlcklkLCByZXN1bHRzKSB7XG5cdFx0dmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySWRdO1xuXHRcdGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyQ29tcGxldGUpKVxuXHRcdFx0d29ya2VyLnVzZXJDb21wbGV0ZShyZXN1bHRzKTtcblx0XHR3b3JrZXIudGVybWluYXRlKCk7XG5cdFx0ZGVsZXRlIHdvcmtlcnNbd29ya2VySWRdO1xuXHR9XG5cblx0ZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKSB7XG5cdFx0dGhyb3cgJ05vdCBpbXBsZW1lbnRlZC4nO1xuXHR9XG5cblx0LyoqIENhbGxiYWNrIHdoZW4gd29ya2VyIHRocmVhZCByZWNlaXZlcyBhIG1lc3NhZ2UgKi9cblx0ZnVuY3Rpb24gd29ya2VyVGhyZWFkUmVjZWl2ZWRNZXNzYWdlKGUpXG5cdHtcblx0XHR2YXIgbXNnID0gZS5kYXRhO1xuXG5cdFx0aWYgKHR5cGVvZiBQYXBhLldPUktFUl9JRCA9PT0gJ3VuZGVmaW5lZCcgJiYgbXNnKVxuXHRcdFx0UGFwYS5XT1JLRVJfSUQgPSBtc2cud29ya2VySWQ7XG5cblx0XHRpZiAodHlwZW9mIG1zZy5pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRyZXN1bHRzOiBQYXBhLnBhcnNlKG1zZy5pbnB1dCwgbXNnLmNvbmZpZyksXG5cdFx0XHRcdGZpbmlzaGVkOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKGdsb2JhbC5GaWxlICYmIG1zZy5pbnB1dCBpbnN0YW5jZW9mIEZpbGUpIHx8IG1zZy5pbnB1dCBpbnN0YW5jZW9mIE9iamVjdClcdC8vIHRoYW5rIHlvdSwgU2FmYXJpIChzZWUgaXNzdWUgIzEwNilcblx0XHR7XG5cdFx0XHR2YXIgcmVzdWx0cyA9IFBhcGEucGFyc2UobXNnLmlucHV0LCBtc2cuY29uZmlnKTtcblx0XHRcdGlmIChyZXN1bHRzKVxuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRyZXN1bHRzOiByZXN1bHRzLFxuXHRcdFx0XHRcdGZpbmlzaGVkOiB0cnVlXG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBNYWtlcyBhIGRlZXAgY29weSBvZiBhbiBhcnJheSBvciBvYmplY3QgKG1vc3RseSkgKi9cblx0ZnVuY3Rpb24gY29weShvYmopXG5cdHtcblx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdHZhciBjcHkgPSBvYmogaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iailcblx0XHRcdGNweVtrZXldID0gY29weShvYmpba2V5XSk7XG5cdFx0cmV0dXJuIGNweTtcblx0fVxuXG5cdGZ1bmN0aW9uIGJpbmRGdW5jdGlvbihmLCBzZWxmKVxuXHR7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyBmLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7IH07XG5cdH1cblxuXHRmdW5jdGlvbiBpc0Z1bmN0aW9uKGZ1bmMpXG5cdHtcblx0XHRyZXR1cm4gdHlwZW9mIGZ1bmMgPT09ICdmdW5jdGlvbic7XG5cdH1cblxuXHRyZXR1cm4gUGFwYTtcbn0pKTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiEgdGV0aGVyIDEuNC4wICovXG5cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICBUZXRoZXJCYXNlID0geyBtb2R1bGVzOiBbXSB9O1xufVxuXG52YXIgemVyb0VsZW1lbnQgPSBudWxsO1xuXG4vLyBTYW1lIGFzIG5hdGl2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QsIGV4Y2VwdCBpdCB0YWtlcyBpbnRvIGFjY291bnQgcGFyZW50IDxmcmFtZT4gb2Zmc2V0c1xuLy8gaWYgdGhlIGVsZW1lbnQgbGllcyB3aXRoaW4gYSBuZXN0ZWQgZG9jdW1lbnQgKDxmcmFtZT4gb3IgPGlmcmFtZT4tbGlrZSkuXG5mdW5jdGlvbiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Qobm9kZSkge1xuICB2YXIgYm91bmRpbmdSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBUaGUgb3JpZ2luYWwgb2JqZWN0IHJldHVybmVkIGJ5IGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyBpbW11dGFibGUsIHNvIHdlIGNsb25lIGl0XG4gIC8vIFdlIGNhbid0IHVzZSBleHRlbmQgYmVjYXVzZSB0aGUgcHJvcGVydGllcyBhcmUgbm90IGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgb2JqZWN0IGJ5IGhhc093blByb3BlcnR5IGluIElFOVxuICB2YXIgcmVjdCA9IHt9O1xuICBmb3IgKHZhciBrIGluIGJvdW5kaW5nUmVjdCkge1xuICAgIHJlY3Rba10gPSBib3VuZGluZ1JlY3Rba107XG4gIH1cblxuICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHZhciBfZnJhbWVFbGVtZW50ID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmZyYW1lRWxlbWVudDtcbiAgICBpZiAoX2ZyYW1lRWxlbWVudCkge1xuICAgICAgdmFyIGZyYW1lUmVjdCA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChfZnJhbWVFbGVtZW50KTtcbiAgICAgIHJlY3QudG9wICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmJvdHRvbSArPSBmcmFtZVJlY3QudG9wO1xuICAgICAgcmVjdC5sZWZ0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgICAgcmVjdC5yaWdodCArPSBmcmFtZVJlY3QubGVmdDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50cyhlbCkge1xuICAvLyBJbiBmaXJlZm94IGlmIHRoZSBlbCBpcyBpbnNpZGUgYW4gaWZyYW1lIHdpdGggZGlzcGxheTogbm9uZTsgd2luZG93LmdldENvbXB1dGVkU3R5bGUoKSB3aWxsIHJldHVybiBudWxsO1xuICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01NDgzOTdcbiAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcbiAgdmFyIHBvc2l0aW9uID0gY29tcHV0ZWRTdHlsZS5wb3NpdGlvbjtcbiAgdmFyIHBhcmVudHMgPSBbXTtcblxuICBpZiAocG9zaXRpb24gPT09ICdmaXhlZCcpIHtcbiAgICByZXR1cm4gW2VsXTtcbiAgfVxuXG4gIHZhciBwYXJlbnQgPSBlbDtcbiAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkgJiYgcGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PT0gMSkge1xuICAgIHZhciBzdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7fVxuXG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUgPT09IG51bGwpIHtcbiAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgfVxuXG4gICAgdmFyIF9zdHlsZSA9IHN0eWxlO1xuICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcbiAgICB2YXIgb3ZlcmZsb3dYID0gX3N0eWxlLm92ZXJmbG93WDtcbiAgICB2YXIgb3ZlcmZsb3dZID0gX3N0eWxlLm92ZXJmbG93WTtcblxuICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcbiAgICAgIGlmIChwb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyB8fCBbJ3JlbGF0aXZlJywgJ2Fic29sdXRlJywgJ2ZpeGVkJ10uaW5kZXhPZihzdHlsZS5wb3NpdGlvbikgPj0gMCkge1xuICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJlbnRzLnB1c2goZWwub3duZXJEb2N1bWVudC5ib2R5KTtcblxuICAvLyBJZiB0aGUgbm9kZSBpcyB3aXRoaW4gYSBmcmFtZSwgYWNjb3VudCBmb3IgdGhlIHBhcmVudCB3aW5kb3cgc2Nyb2xsXG4gIGlmIChlbC5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3KTtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnRzO1xufVxuXG52YXIgdW5pcXVlSWQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgaWQgPSAwO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiArK2lkO1xuICB9O1xufSkoKTtcblxudmFyIHplcm9Qb3NDYWNoZSA9IHt9O1xudmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbigpIHtcbiAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIHVuZm9ydHVuYXRlbHkgdG9vIGFjY3VyYXRlLiAgSXQgaW50cm9kdWNlcyBhIHBpeGVsIG9yIHR3byBvZlxuICAvLyBqaXR0ZXIgYXMgdGhlIHVzZXIgc2Nyb2xscyB0aGF0IG1lc3NlcyB3aXRoIG91ciBhYmlsaXR5IHRvIGRldGVjdCBpZiB0d28gcG9zaXRpb25zXG4gIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuICAvLyBnZXQgdGhlIHNhbWUgaml0dGVyLCBzbyB3ZSBjYW4gY2FuY2VsIHRoZSB0d28gb3V0LlxuICB2YXIgbm9kZSA9IHplcm9FbGVtZW50O1xuICBpZiAoIW5vZGUgfHwgIWRvY3VtZW50LmJvZHkuY29udGFpbnMobm9kZSkpIHtcbiAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJywgdW5pcXVlSWQoKSk7XG4gICAgZXh0ZW5kKG5vZGUuc3R5bGUsIHtcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuICAgIHplcm9FbGVtZW50ID0gbm9kZTtcbiAgfVxuXG4gIHZhciBpZCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcpO1xuICBpZiAodHlwZW9mIHplcm9Qb3NDYWNoZVtpZF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgemVyb1Bvc0NhY2hlW2lkXSA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKTtcblxuICAgIC8vIENsZWFyIHRoZSBjYWNoZSB3aGVuIHRoaXMgcG9zaXRpb24gY2FsbCBpcyBkb25lXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgZGVsZXRlIHplcm9Qb3NDYWNoZVtpZF07XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gemVyb1Bvc0NhY2hlW2lkXTtcbn07XG5cbmZ1bmN0aW9uIHJlbW92ZVV0aWxFbGVtZW50cygpIHtcbiAgaWYgKHplcm9FbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh6ZXJvRWxlbWVudCk7XG4gIH1cbiAgemVyb0VsZW1lbnQgPSBudWxsO1xufTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRzKGVsKSB7XG4gIHZhciBkb2MgPSB1bmRlZmluZWQ7XG4gIGlmIChlbCA9PT0gZG9jdW1lbnQpIHtcbiAgICBkb2MgPSBkb2N1bWVudDtcbiAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICBkb2MgPSBlbC5vd25lckRvY3VtZW50O1xuICB9XG5cbiAgdmFyIGRvY0VsID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuICB2YXIgYm94ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KGVsKTtcblxuICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKCk7XG5cbiAgYm94LnRvcCAtPSBvcmlnaW4udG9wO1xuICBib3gubGVmdCAtPSBvcmlnaW4ubGVmdDtcblxuICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3gud2lkdGggPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gYm94LmxlZnQgLSBib3gucmlnaHQ7XG4gIH1cbiAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIGJveC50b3AgLSBib3guYm90dG9tO1xuICB9XG5cbiAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG4gIGJveC5sZWZ0ID0gYm94LmxlZnQgLSBkb2NFbC5jbGllbnRMZWZ0O1xuICBib3gucmlnaHQgPSBkb2MuYm9keS5jbGllbnRXaWR0aCAtIGJveC53aWR0aCAtIGJveC5sZWZ0O1xuICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cbiAgcmV0dXJuIGJveDtcbn1cblxuZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG4gIHJldHVybiBlbC5vZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xufVxuXG52YXIgX3Njcm9sbEJhclNpemUgPSBudWxsO1xuZnVuY3Rpb24gZ2V0U2Nyb2xsQmFyU2l6ZSgpIHtcbiAgaWYgKF9zY3JvbGxCYXJTaXplKSB7XG4gICAgcmV0dXJuIF9zY3JvbGxCYXJTaXplO1xuICB9XG4gIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcblxuICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZXh0ZW5kKG91dGVyLnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgIGhlaWdodDogJzE1MHB4JyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgfSk7XG5cbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aENvbnRhaW5lZCA9IGlubmVyLm9mZnNldFdpZHRoO1xuICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuICBpZiAod2lkdGhDb250YWluZWQgPT09IHdpZHRoU2Nyb2xsKSB7XG4gICAgd2lkdGhTY3JvbGwgPSBvdXRlci5jbGllbnRXaWR0aDtcbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aCA9IHdpZHRoQ29udGFpbmVkIC0gd2lkdGhTY3JvbGw7XG5cbiAgX3Njcm9sbEJhclNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiB3aWR0aCB9O1xuICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG4gIHZhciBhcmdzID0gW107XG5cbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcblxuICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmopIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBpZiAoY2xzLnRyaW0oKSkge1xuICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgnKF58ICknICsgbmFtZS5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcoIHwkKScsICdnaScpO1xuICAgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpLnJlcGxhY2UocmVnZXgsICcgJyk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cbiAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCk7XG4gIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc05hbWUoZWwpIHtcbiAgLy8gQ2FuJ3QgdXNlIGp1c3QgU1ZHQW5pbWF0ZWRTdHJpbmcgaGVyZSBzaW5jZSBub2RlcyB3aXRoaW4gYSBGcmFtZSBpbiBJRSBoYXZlXG4gIC8vIGNvbXBsZXRlbHkgc2VwYXJhdGVseSBTVkdBbmltYXRlZFN0cmluZyBiYXNlIGNsYXNzZXNcbiAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuU1ZHQW5pbWF0ZWRTdHJpbmcpIHtcbiAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG4gIH1cbiAgcmV0dXJuIGVsLmNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpIHtcbiAgZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzZXMoZWwsIGFkZCwgYWxsKSB7XG4gIC8vIE9mIHRoZSBzZXQgb2YgJ2FsbCcgY2xhc3Nlcywgd2UgbmVlZCB0aGUgJ2FkZCcgY2xhc3NlcywgYW5kIG9ubHkgdGhlXG4gIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuICBhbGwuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgaWYgKGFkZC5pbmRleE9mKGNscykgPT09IC0xICYmIGhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoIWhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICBhZGRDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgZGVmZXJyZWQgPSBbXTtcblxudmFyIGRlZmVyID0gZnVuY3Rpb24gZGVmZXIoZm4pIHtcbiAgZGVmZXJyZWQucHVzaChmbik7XG59O1xuXG52YXIgZmx1c2ggPSBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgdmFyIGZuID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuICAgIGZuKCk7XG4gIH1cbn07XG5cbnZhciBFdmVudGVkID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnRlZCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRXZlbnRlZCwgW3tcbiAgICBrZXk6ICdvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHZhciBvbmNlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAzIHx8IGFyZ3VtZW50c1szXSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBhcmd1bWVudHNbM107XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvbmNlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25jZShldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICB0aGlzLm9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIHRydWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29mZicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgdGhpcy5iaW5kaW5nc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBkZWxldGUgdGhpcy5iaW5kaW5nc1tldmVudF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RyaWdnZXInLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50KSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuYmluZGluZ3NbZXZlbnRdKSB7XG4gICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIF9iaW5kaW5ncyRldmVudCRpID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV07XG4gICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuICAgICAgICAgIHZhciBjdHggPSBfYmluZGluZ3MkZXZlbnQkaS5jdHg7XG4gICAgICAgICAgdmFyIG9uY2UgPSBfYmluZGluZ3MkZXZlbnQkaS5vbmNlO1xuXG4gICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaGFuZGxlci5hcHBseShjb250ZXh0LCBhcmdzKTtcblxuICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXZlbnRlZDtcbn0pKCk7XG5cblRldGhlckJhc2UuVXRpbHMgPSB7XG4gIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdDogZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0LFxuICBnZXRTY3JvbGxQYXJlbnRzOiBnZXRTY3JvbGxQYXJlbnRzLFxuICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcbiAgZ2V0T2Zmc2V0UGFyZW50OiBnZXRPZmZzZXRQYXJlbnQsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuICBkZWZlcjogZGVmZXIsXG4gIGZsdXNoOiBmbHVzaCxcbiAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuICBFdmVudGVkOiBFdmVudGVkLFxuICBnZXRTY3JvbGxCYXJTaXplOiBnZXRTY3JvbGxCYXJTaXplLFxuICByZW1vdmVVdGlsRWxlbWVudHM6IHJlbW92ZVV0aWxFbGVtZW50c1xufTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSwgcGVyZm9ybWFuY2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3g2LCBfeDcsIF94OCkgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeDYsIHByb3BlcnR5ID0gX3g3LCByZWNlaXZlciA9IF94ODsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeDYgPSBwYXJlbnQ7IF94NyA9IHByb3BlcnR5OyBfeDggPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IGluY2x1ZGUgdGhlIHV0aWxzLmpzIGZpbGUgYmVmb3JlIHRldGhlci5qcycpO1xufVxuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldFNjcm9sbFBhcmVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxQYXJlbnRzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBnZXRPZmZzZXRQYXJlbnQgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRPZmZzZXRQYXJlbnQ7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIGFkZENsYXNzID0gX1RldGhlckJhc2UkVXRpbHMuYWRkQ2xhc3M7XG52YXIgcmVtb3ZlQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVDbGFzcztcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xudmFyIGZsdXNoID0gX1RldGhlckJhc2UkVXRpbHMuZmx1c2g7XG52YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG52YXIgcmVtb3ZlVXRpbEVsZW1lbnRzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlVXRpbEVsZW1lbnRzO1xuXG5mdW5jdGlvbiB3aXRoaW4oYSwgYikge1xuICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cbiAgcmV0dXJuIGEgKyBkaWZmID49IGIgJiYgYiA+PSBhIC0gZGlmZjtcbn1cblxudmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIHZhciB0cmFuc2Zvcm1zID0gWyd0cmFuc2Zvcm0nLCAnV2Via2l0VHJhbnNmb3JtJywgJ09UcmFuc2Zvcm0nLCAnTW96VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJ107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBrZXkgPSB0cmFuc2Zvcm1zW2ldO1xuICAgIGlmIChlbC5zdHlsZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG59KSgpO1xuXG52YXIgdGV0aGVycyA9IFtdO1xuXG52YXIgcG9zaXRpb24gPSBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcbiAgICB0ZXRoZXIucG9zaXRpb24oZmFsc2UpO1xuICB9KTtcbiAgZmx1c2goKTtcbn07XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH1cbiAgcmV0dXJuICtuZXcgRGF0ZSgpO1xufVxuXG4oZnVuY3Rpb24gKCkge1xuICB2YXIgbGFzdENhbGwgPSBudWxsO1xuICB2YXIgbGFzdER1cmF0aW9uID0gbnVsbDtcbiAgdmFyIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcblxuICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKHR5cGVvZiBsYXN0RHVyYXRpb24gIT09ICd1bmRlZmluZWQnICYmIGxhc3REdXJhdGlvbiA+IDE2KSB7XG4gICAgICAvLyBXZSB2b2x1bnRhcmlseSB0aHJvdHRsZSBvdXJzZWx2ZXMgaWYgd2UgY2FuJ3QgbWFuYWdlIDYwZnBzXG4gICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuICAgICAgLy8gSnVzdCBpbiBjYXNlIHRoaXMgaXMgdGhlIGxhc3QgZXZlbnQsIHJlbWVtYmVyIHRvIHBvc2l0aW9uIGp1c3Qgb25jZSBtb3JlXG4gICAgICBwZW5kaW5nVGltZW91dCA9IHNldFRpbWVvdXQodGljaywgMjUwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGxhc3RDYWxsICE9PSAndW5kZWZpbmVkJyAmJiBub3coKSAtIGxhc3RDYWxsIDwgMTApIHtcbiAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocGVuZGluZ1RpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBsYXN0Q2FsbCA9IG5vdygpO1xuICAgIHBvc2l0aW9uKCk7XG4gICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcbiAgfTtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIFsncmVzaXplJywgJ3Njcm9sbCcsICd0b3VjaG1vdmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuICAgIH0pO1xuICB9XG59KSgpO1xuXG52YXIgTUlSUk9SX0xSID0ge1xuICBjZW50ZXI6ICdjZW50ZXInLFxuICBsZWZ0OiAncmlnaHQnLFxuICByaWdodDogJ2xlZnQnXG59O1xuXG52YXIgTUlSUk9SX1RCID0ge1xuICBtaWRkbGU6ICdtaWRkbGUnLFxuICB0b3A6ICdib3R0b20nLFxuICBib3R0b206ICd0b3AnXG59O1xuXG52YXIgT0ZGU0VUX01BUCA9IHtcbiAgdG9wOiAwLFxuICBsZWZ0OiAwLFxuICBtaWRkbGU6ICc1MCUnLFxuICBjZW50ZXI6ICc1MCUnLFxuICBib3R0b206ICcxMDAlJyxcbiAgcmlnaHQ6ICcxMDAlJ1xufTtcblxudmFyIGF1dG9Ub0ZpeGVkQXR0YWNobWVudCA9IGZ1bmN0aW9uIGF1dG9Ub0ZpeGVkQXR0YWNobWVudChhdHRhY2htZW50LCByZWxhdGl2ZVRvQXR0YWNobWVudCkge1xuICB2YXIgbGVmdCA9IGF0dGFjaG1lbnQubGVmdDtcbiAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG4gIGlmIChsZWZ0ID09PSAnYXV0bycpIHtcbiAgICBsZWZ0ID0gTUlSUk9SX0xSW3JlbGF0aXZlVG9BdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHRvcCA9PT0gJ2F1dG8nKSB7XG4gICAgdG9wID0gTUlSUk9SX1RCW3JlbGF0aXZlVG9BdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxudmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbGVmdCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdG9wID0gT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxuZnVuY3Rpb24gYWRkT2Zmc2V0KCkge1xuICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgb2Zmc2V0cyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIG9mZnNldHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cblxuICBvZmZzZXRzLmZvckVhY2goZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAodHlwZW9mIHRvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRvcCA9IHBhcnNlRmxvYXQodG9wLCAxMCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxlZnQgPSBwYXJzZUZsb2F0KGxlZnQsIDEwKTtcbiAgICB9XG5cbiAgICBvdXQudG9wICs9IHRvcDtcbiAgICBvdXQubGVmdCArPSBsZWZ0O1xuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuICBpZiAodHlwZW9mIG9mZnNldC5sZWZ0ID09PSAnc3RyaW5nJyAmJiBvZmZzZXQubGVmdC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LmxlZnQgPSBwYXJzZUZsb2F0KG9mZnNldC5sZWZ0LCAxMCkgLyAxMDAgKiBzaXplLndpZHRoO1xuICB9XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LnRvcCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LnRvcC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LnRvcCA9IHBhcnNlRmxvYXQob2Zmc2V0LnRvcCwgMTApIC8gMTAwICogc2l6ZS5oZWlnaHQ7XG4gIH1cblxuICByZXR1cm4gb2Zmc2V0O1xufVxuXG52YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuICB2YXIgX3ZhbHVlJHNwbGl0ID0gdmFsdWUuc3BsaXQoJyAnKTtcblxuICB2YXIgX3ZhbHVlJHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF92YWx1ZSRzcGxpdCwgMik7XG5cbiAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG4gIHZhciBsZWZ0ID0gX3ZhbHVlJHNwbGl0MlsxXTtcblxuICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xufTtcbnZhciBwYXJzZUF0dGFjaG1lbnQgPSBwYXJzZU9mZnNldDtcblxudmFyIFRldGhlckNsYXNzID0gKGZ1bmN0aW9uIChfRXZlbnRlZCkge1xuICBfaW5oZXJpdHMoVGV0aGVyQ2xhc3MsIF9FdmVudGVkKTtcblxuICBmdW5jdGlvbiBUZXRoZXJDbGFzcyhvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUZXRoZXJDbGFzcyk7XG5cbiAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUZXRoZXJDbGFzcy5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmJpbmQodGhpcyk7XG5cbiAgICB0ZXRoZXJzLnB1c2godGhpcyk7XG5cbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zLCBmYWxzZSk7XG5cbiAgICBUZXRoZXJCYXNlLm1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbiAobW9kdWxlKSB7XG4gICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuaW5pdGlhbGl6ZS5jYWxsKF90aGlzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucG9zaXRpb24oKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcbiAgICBrZXk6ICdnZXRDbGFzcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldENsYXNzKCkge1xuICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuICAgICAgdmFyIGNsYXNzZXMgPSB0aGlzLm9wdGlvbnMuY2xhc3NlcztcblxuICAgICAgaWYgKHR5cGVvZiBjbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiBjbGFzc2VzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzUHJlZml4ICsgJy0nICsga2V5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdzZXRPcHRpb25zJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgb2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0T2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG4gICAgICAgIGNsYXNzUHJlZml4OiAndGV0aGVyJ1xuICAgICAgfTtcblxuICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgdmFyIF9vcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgdmFyIGVsZW1lbnQgPSBfb3B0aW9ucy5lbGVtZW50O1xuICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcbiAgICAgIHZhciB0YXJnZXRNb2RpZmllciA9IF9vcHRpb25zLnRhcmdldE1vZGlmaWVyO1xuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gdGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gJ3ZpZXdwb3J0Jykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAndmlzaWJsZSc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudGFyZ2V0ID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Njcm9sbC1oYW5kbGUnO1xuICAgICAgfVxuXG4gICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IEJvdGggZWxlbWVudCBhbmQgdGFyZ2V0IG11c3QgYmUgZGVmaW5lZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XS5qcXVlcnkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBfdGhpczJba2V5XVswXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKF90aGlzMltrZXldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZWxlbWVudCcpKTtcbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYXR0YWNobWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudGFyZ2V0QXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMudGFyZ2V0QXR0YWNobWVudCk7XG4gICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuICAgICAgdGhpcy5vZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMub2Zmc2V0KTtcbiAgICAgIHRoaXMudGFyZ2V0T2Zmc2V0ID0gcGFyc2VPZmZzZXQodGhpcy5vcHRpb25zLnRhcmdldE9mZnNldCk7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBbdGhpcy50YXJnZXRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzID0gZ2V0U2Nyb2xsUGFyZW50cyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5lbmFibGVkID09PSBmYWxzZSkpIHtcbiAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRUYXJnZXRCb3VuZHMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRUYXJnZXRCb3VuZHMoKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAndmlzaWJsZScpIHtcbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcblxuICAgICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG4gICAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKGJvdW5kcy50b3AgKyBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0ICsgaW5uZXJIZWlnaHQpKSk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4oaW5uZXJIZWlnaHQsIG91dC5oZWlnaHQpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCAtIGJvdW5kcy5sZWZ0KSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCArIGlubmVyV2lkdGgpKSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuICAgICAgICAgICAgb3V0LndpZHRoIC09IDI7XG5cbiAgICAgICAgICAgIGlmIChvdXQudG9wIDwgcGFnZVlPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG91dC5sZWZ0IDwgcGFnZVhPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgICAgdmFyIGJvdW5kcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG4gICAgICAgICAgaWYgKHRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgICAgICBib3VuZHMgPSB7XG4gICAgICAgICAgICAgIGxlZnQ6IHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgICAgICB0b3A6IHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogaW5uZXJXaWR0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm91bmRzID0gZ2V0Qm91bmRzKHRhcmdldCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG4gICAgICAgICAgdmFyIGhhc0JvdHRvbVNjcm9sbCA9IHRhcmdldC5zY3JvbGxXaWR0aCA+IHRhcmdldC5jbGllbnRXaWR0aCB8fCBbc3R5bGUub3ZlcmZsb3csIHN0eWxlLm92ZXJmbG93WF0uaW5kZXhPZignc2Nyb2xsJykgPj0gMCB8fCB0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgIHZhciBzY3JvbGxCb3R0b20gPSAwO1xuICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcbiAgICAgICAgICAgIHNjcm9sbEJvdHRvbSA9IDE1O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICB3aWR0aDogMTUsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckxlZnRXaWR0aCkgLSAxNVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgZml0QWRqID0gMDtcbiAgICAgICAgICBpZiAoaGVpZ2h0IDwgNDA4ICYmIHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBmaXRBZGogPSAtMC4wMDAxMSAqIE1hdGgucG93KGhlaWdodCwgMikgLSAwLjAwNzI3ICogaGVpZ2h0ICsgMjIuNTg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzY3JvbGxQZXJjZW50YWdlID0gdGhpcy50YXJnZXQuc2Nyb2xsVG9wIC8gKHRhcmdldC5zY3JvbGxIZWlnaHQgLSBoZWlnaHQpO1xuICAgICAgICAgIG91dC50b3AgPSBzY3JvbGxQZXJjZW50YWdlICogKGhlaWdodCAtIG91dC5oZWlnaHQgLSBmaXRBZGopICsgYm91bmRzLnRvcCArIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NsZWFyQ2FjaGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhY2hlKGssIGdldHRlcikge1xuICAgICAgLy8gTW9yZSB0aGFuIG9uZSBtb2R1bGUgd2lsbCBvZnRlbiBuZWVkIHRoZSBzYW1lIERPTSBpbmZvLCBzb1xuICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlW2tdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZVtrXSA9IGdldHRlci5jYWxsKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVba107XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZW5hYmxlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZW5hYmxlKCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgfVxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50ICE9PSBfdGhpczMudGFyZ2V0Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICBwYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXMzLnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rpc2FibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNhYmxlKCkge1xuICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgICAgcGFyZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIF90aGlzNC5wb3NpdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rlc3Ryb3knLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG4gICAgICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlciwgaSkge1xuICAgICAgICBpZiAodGV0aGVyID09PSBfdGhpczUpIHtcbiAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgd2Ugd2VyZSB1c2luZyBmb3IgY29udmVuaWVuY2UgZnJvbSB0aGUgRE9NXG4gICAgICBpZiAodGV0aGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVtb3ZlVXRpbEVsZW1lbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndXBkYXRlQXR0YWNoQ2xhc3NlcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG4gICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgZWxlbWVudEF0dGFjaCA9IGVsZW1lbnRBdHRhY2ggfHwgdGhpcy5hdHRhY2htZW50O1xuICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcbiAgICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAnYm90dG9tJywgJ3JpZ2h0JywgJ21pZGRsZScsICdjZW50ZXInXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNsZWFuIHVwIGFmdGVyIG91cnNlbHZlcyBzdWNoIHRoYXQgd2hlbiB0aGUgbGFzdCBkZWZlciBnZXRzXG4gICAgICAgIC8vIHJhbiBpdCBkb2Vzbid0IGFkZCBhbnkgZXh0cmEgY2xhc3NlcyBmcm9tIHByZXZpb3VzIGNhbGxzLlxuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFkZCA9IHRoaXMuX2FkZEF0dGFjaENsYXNzZXM7XG5cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gubGVmdCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC50b3ApO1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLmxlZnQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgYWxsID0gW107XG4gICAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghKHR5cGVvZiBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM2LmVsZW1lbnQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgaWYgKCEoX3RoaXM2Lm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYudGFyZ2V0LCBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncG9zaXRpb24nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICB2YXIgZmx1c2hDaGFuZ2VzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcbiAgICAgIC8vIHRldGhlcnMgKGluIHdoaWNoIGNhc2UgY2FsbCBUZXRoZXIuVXRpbHMuZmx1c2ggeW91cnNlbGYgd2hlbiB5b3UncmUgZG9uZSlcblxuICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcblxuICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2VcbiAgICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gYXV0b1RvRml4ZWRBdHRhY2htZW50KHRoaXMudGFyZ2V0QXR0YWNobWVudCwgdGhpcy5hdHRhY2htZW50KTtcblxuICAgICAgdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKHRoaXMuYXR0YWNobWVudCwgdGFyZ2V0QXR0YWNobWVudCk7XG5cbiAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXM3LmVsZW1lbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG4gICAgICB2YXIgaGVpZ2h0ID0gZWxlbWVudFBvcy5oZWlnaHQ7XG5cbiAgICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG4gICAgICAgIC8vIFdlIGNhY2hlIHRoZSBoZWlnaHQgYW5kIHdpZHRoIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gcG9zaXRpb24gZWxlbWVudHMgdGhhdCBhcmVcbiAgICAgICAgLy8gZ2V0dGluZyBoaWRkZW4uXG4gICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuICAgICAgfVxuXG4gICAgICB2YXIgdGFyZ2V0UG9zID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzNy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHRhcmdldFNpemUgPSB0YXJnZXRQb3M7XG5cbiAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcbiAgICAgIHZhciBvZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0aGlzLmF0dGFjaG1lbnQpLCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgdGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeChhdHRhY2htZW50VG9PZmZzZXQodGFyZ2V0QXR0YWNobWVudCksIHRhcmdldFNpemUpO1xuXG4gICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgICAgdmFyIG1hbnVhbFRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy50YXJnZXRPZmZzZXQsIHRhcmdldFNpemUpO1xuXG4gICAgICAvLyBBZGQgdGhlIG1hbnVhbGx5IHByb3ZpZGVkIG9mZnNldFxuICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcbiAgICAgIHRhcmdldE9mZnNldCA9IGFkZE9mZnNldCh0YXJnZXRPZmZzZXQsIG1hbnVhbFRhcmdldE9mZnNldCk7XG5cbiAgICAgIC8vIEl0J3Mgbm93IG91ciBnb2FsIHRvIG1ha2UgKGVsZW1lbnQgcG9zaXRpb24gKyBvZmZzZXQpID09ICh0YXJnZXQgcG9zaXRpb24gKyB0YXJnZXQgb2Zmc2V0KVxuICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG4gICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcCArIHRhcmdldE9mZnNldC50b3AgLSBvZmZzZXQudG9wO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRldGhlckJhc2UubW9kdWxlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG4gICAgICAgIHZhciByZXQgPSBfbW9kdWxlMi5wb3NpdGlvbi5jYWxsKHRoaXMsIHtcbiAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRhcmdldEF0dGFjaG1lbnQsXG4gICAgICAgICAgdGFyZ2V0UG9zOiB0YXJnZXRQb3MsXG4gICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcbiAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICB0YXJnZXRPZmZzZXQ6IHRhcmdldE9mZnNldCxcbiAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcbiAgICAgICAgICBtYW51YWxUYXJnZXRPZmZzZXQ6IG1hbnVhbFRhcmdldE9mZnNldCxcbiAgICAgICAgICBzY3JvbGxiYXJTaXplOiBzY3JvbGxiYXJTaXplLFxuICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmV0ID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmV0ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcmV0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcCA9IHJldC50b3A7XG4gICAgICAgICAgbGVmdCA9IHJldC5sZWZ0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGRlc2NyaWJlIHRoZSBwb3NpdGlvbiB0aHJlZSBkaWZmZXJlbnQgd2F5cyB0byBnaXZlIHRoZSBvcHRpbWl6ZXJcbiAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggdGhlIGZld2VzdCByZXBhaW50cy5cbiAgICAgIHZhciBuZXh0ID0ge1xuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIGJvZHkpXG4gICAgICAgIHBhZ2U6IHtcbiAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICBsZWZ0OiBsZWZ0XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgICB2aWV3cG9ydDoge1xuICAgICAgICAgIHRvcDogdG9wIC0gcGFnZVlPZmZzZXQsXG4gICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IGxlZnQgLSBwYWdlWE9mZnNldCxcbiAgICAgICAgICByaWdodDogcGFnZVhPZmZzZXQgLSBsZWZ0IC0gd2lkdGggKyBpbm5lcldpZHRoXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBkb2MgPSB0aGlzLnRhcmdldC5vd25lckRvY3VtZW50O1xuICAgICAgdmFyIHdpbiA9IGRvYy5kZWZhdWx0VmlldztcblxuICAgICAgdmFyIHNjcm9sbGJhclNpemUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAod2luLmlubmVySGVpZ2h0ID4gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBpZiAod2luLmlubmVyV2lkdGggPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuICAgICAgICBuZXh0LnZpZXdwb3J0LnJpZ2h0IC09IHNjcm9sbGJhclNpemUud2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmIChbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEgfHwgWycnLCAnc3RhdGljJ10uaW5kZXhPZihkb2MuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gQWJzb2x1dGUgcG9zaXRpb25pbmcgaW4gdGhlIGJvZHkgd2lsbCBiZSByZWxhdGl2ZSB0byB0aGUgcGFnZSwgbm90IHRoZSAnaW5pdGlhbCBjb250YWluaW5nIGJsb2NrJ1xuICAgICAgICBuZXh0LnBhZ2UuYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuICAgICAgICBuZXh0LnBhZ2UucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIGxlZnQgLSB3aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMubW92ZUVsZW1lbnQgIT09IGZhbHNlICYmICEodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczcuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzNy50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTaXplID0gb2Zmc2V0UG9zaXRpb247XG5cbiAgICAgICAgICB2YXIgb2Zmc2V0Qm9yZGVyID0ge307XG4gICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBvZmZzZXRCb3JkZXJbc2lkZS50b0xvd2VyQ2FzZSgpXSA9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50U3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgLSBvZmZzZXRQYXJlbnRTaXplLndpZHRoICsgb2Zmc2V0Qm9yZGVyLnJpZ2h0O1xuICAgICAgICAgIG9mZnNldFBvc2l0aW9uLmJvdHRvbSA9IGRvYy5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuICAgICAgICAgIGlmIChuZXh0LnBhZ2UudG9wID49IG9mZnNldFBvc2l0aW9uLnRvcCArIG9mZnNldEJvcmRlci50b3AgJiYgbmV4dC5wYWdlLmJvdHRvbSA+PSBvZmZzZXRQb3NpdGlvbi5ib3R0b20pIHtcbiAgICAgICAgICAgIGlmIChuZXh0LnBhZ2UubGVmdCA+PSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0Qm9yZGVyLmxlZnQgJiYgbmV4dC5wYWdlLnJpZ2h0ID49IG9mZnNldFBvc2l0aW9uLnJpZ2h0KSB7XG4gICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICB2YXIgc2Nyb2xsTGVmdCA9IG9mZnNldFBhcmVudC5zY3JvbGxMZWZ0O1xuXG4gICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgbW92ZWQgdG8gYmUgYSBjaGlsZCBvZiB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCkuXG4gICAgICAgICAgICAgIG5leHQub2Zmc2V0ID0ge1xuICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogbmV4dC5wYWdlLmxlZnQgLSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgc2Nyb2xsTGVmdCAtIG9mZnNldEJvcmRlci5sZWZ0XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBjb3VsZCBhbHNvIHRyYXZlbCB1cCB0aGUgRE9NIGFuZCB0cnkgZWFjaCBjb250YWluaW5nIGNvbnRleHQsIHJhdGhlciB0aGFuIG9ubHlcbiAgICAgIC8vIGxvb2tpbmcgYXQgdGhlIGJvZHksIGJ1dCB3ZSdyZSBnb25uYSBnZXQgZGltaW5pc2hpbmcgcmV0dXJucy5cblxuICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG4gICAgICB0aGlzLmhpc3RvcnkudW5zaGlmdChuZXh0KTtcblxuICAgICAgaWYgKHRoaXMuaGlzdG9yeS5sZW5ndGggPiAzKSB7XG4gICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZsdXNoQ2hhbmdlcykge1xuICAgICAgICBmbHVzaCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUSEUgSVNTVUVcbiAgfSwge1xuICAgIGtleTogJ21vdmUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKHBvcykge1xuICAgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cbiAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHNhbWUgPSB7fTtcblxuICAgICAgZm9yICh2YXIgdHlwZSBpbiBwb3MpIHtcbiAgICAgICAgc2FtZVt0eXBlXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcbiAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaXN0b3J5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvaW50W3R5cGVdICE9PSAndW5kZWZpbmVkJyAmJiAhd2l0aGluKHBvaW50W3R5cGVdW2tleV0sIHBvc1t0eXBlXVtrZXldKSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHNhbWVbdHlwZV1ba2V5XSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjc3MgPSB7IHRvcDogJycsIGxlZnQ6ICcnLCByaWdodDogJycsIGJvdHRvbTogJycgfTtcblxuICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG4gICAgICAgIHZhciBoYXNPcHRpbWl6YXRpb25zID0gdHlwZW9mIF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgZ3B1ID0gaGFzT3B0aW1pemF0aW9ucyA/IF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMuZ3B1IDogbnVsbDtcbiAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB2YXIgeVBvcyA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgeFBvcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSBfcG9zLnRvcDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IDA7XG4gICAgICAgICAgICB5UG9zID0gLV9wb3MuYm90dG9tO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSAwO1xuICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgICAgICAgICAgLy8gSHViU3BvdC90ZXRoZXIjMjA3XG4gICAgICAgICAgICB2YXIgcmV0aW5hID0gd2luZG93Lm1hdGNoTWVkaWEoJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDEuM2RwcHgpJykubWF0Y2hlcyB8fCB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDEuMyknKS5tYXRjaGVzO1xuICAgICAgICAgICAgaWYgKCFyZXRpbmEpIHtcbiAgICAgICAgICAgICAgeFBvcyA9IE1hdGgucm91bmQoeFBvcyk7XG4gICAgICAgICAgICAgIHlQb3MgPSBNYXRoLnJvdW5kKHlQb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldID0gJ3RyYW5zbGF0ZVgoJyArIHhQb3MgKyAncHgpIHRyYW5zbGF0ZVkoJyArIHlQb3MgKyAncHgpJztcblxuICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcbiAgICAgICAgICAgIC8vIFRoZSBaIHRyYW5zZm9ybSB3aWxsIGtlZXAgdGhpcyBpbiB0aGUgR1BVIChmYXN0ZXIsIGFuZCBwcmV2ZW50cyBhcnRpZmFjdHMpLFxuICAgICAgICAgICAgLy8gYnV0IElFOSBkb2Vzbid0IHN1cHBvcnQgM2QgdHJhbnNmb3JtcyBhbmQgd2lsbCBjaG9rZS5cbiAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuICAgICAgICAgICAgY3NzLnRvcCA9IF9wb3MudG9wICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4JztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX3NhbWUubGVmdCkge1xuICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSBfcG9zLnJpZ2h0ICsgJ3B4JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuICAgICAgaWYgKChzYW1lLnBhZ2UudG9wIHx8IHNhbWUucGFnZS5ib3R0b20pICYmIChzYW1lLnBhZ2UubGVmdCB8fCBzYW1lLnBhZ2UucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG4gICAgICB9IGVsc2UgaWYgKChzYW1lLnZpZXdwb3J0LnRvcCB8fCBzYW1lLnZpZXdwb3J0LmJvdHRvbSkgJiYgKHNhbWUudmlld3BvcnQubGVmdCB8fCBzYW1lLnZpZXdwb3J0LnJpZ2h0KSkge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzYW1lLm9mZnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2FtZS5vZmZzZXQudG9wICYmIHNhbWUub2Zmc2V0LmxlZnQpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczguY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGdldE9mZnNldFBhcmVudChfdGhpczguZWxlbWVudCkgIT09IG9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBfdGhpczguZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50LmFwcGVuZENoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5vZmZzZXQsIHBvcy5vZmZzZXQpO1xuICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW1vdmVkKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50SXNCb2R5ID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICB3aGlsZSAoY3VycmVudE5vZGUgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IDEgJiYgY3VycmVudE5vZGUudGFnTmFtZSAhPT0gJ0JPRFknKSB7XG4gICAgICAgICAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZShjdXJyZW50Tm9kZSkucG9zaXRpb24gIT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICAgIG9mZnNldFBhcmVudElzQm9keSA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghb2Zmc2V0UGFyZW50SXNCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBbnkgY3NzIGNoYW5nZSB3aWxsIHRyaWdnZXIgYSByZXBhaW50LCBzbyBsZXQncyBhdm9pZCBvbmUgaWYgbm90aGluZyBjaGFuZ2VkXG4gICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcbiAgICAgIHZhciB3cml0ZSA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIga2V5IGluIGNzcykge1xuICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG4gICAgICAgIHZhciBlbFZhbCA9IHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuXG4gICAgICAgIGlmIChlbFZhbCAhPT0gdmFsKSB7XG4gICAgICAgICAgd3JpdGUgPSB0cnVlO1xuICAgICAgICAgIHdyaXRlQ1NTW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHdyaXRlKSB7XG4gICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBleHRlbmQoX3RoaXM4LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcbiAgICAgICAgICBfdGhpczgudHJpZ2dlcigncmVwb3NpdGlvbmVkJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBUZXRoZXJDbGFzcztcbn0pKEV2ZW50ZWQpO1xuXG5UZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblRldGhlckJhc2UucG9zaXRpb24gPSBwb3NpdGlvbjtcblxudmFyIFRldGhlciA9IGV4dGVuZChUZXRoZXJDbGFzcywgVGV0aGVyQmFzZSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cbnZhciBCT1VORFNfRk9STUFUID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcbiAgaWYgKHRvID09PSAnc2Nyb2xsUGFyZW50Jykge1xuICAgIHRvID0gdGV0aGVyLnNjcm9sbFBhcmVudHNbMF07XG4gIH0gZWxzZSBpZiAodG8gPT09ICd3aW5kb3cnKSB7XG4gICAgdG8gPSBbcGFnZVhPZmZzZXQsIHBhZ2VZT2Zmc2V0LCBpbm5lcldpZHRoICsgcGFnZVhPZmZzZXQsIGlubmVySGVpZ2h0ICsgcGFnZVlPZmZzZXRdO1xuICB9XG5cbiAgaWYgKHRvID09PSBkb2N1bWVudCkge1xuICAgIHRvID0gdG8uZG9jdW1lbnRFbGVtZW50O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB0by5ub2RlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5vZGUgPSB0bztcbiAgICAgIHZhciBzaXplID0gZ2V0Qm91bmRzKHRvKTtcbiAgICAgIHZhciBwb3MgPSBzaXplO1xuICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cbiAgICAgIHRvID0gW3Bvcy5sZWZ0LCBwb3MudG9wLCBzaXplLndpZHRoICsgcG9zLmxlZnQsIHNpemUuaGVpZ2h0ICsgcG9zLnRvcF07XG5cbiAgICAgIC8vIEFjY291bnQgYW55IHBhcmVudCBGcmFtZXMgc2Nyb2xsIG9mZnNldFxuICAgICAgaWYgKG5vZGUub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICAgICAgdG9bMF0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1sxXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICAgIHRvWzJdICs9IHdpbi5wYWdlWE9mZnNldDtcbiAgICAgICAgdG9bM10gKz0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcbiAgICAgICAgc2lkZSA9IHNpZGVbMF0udG9VcHBlckNhc2UoKSArIHNpZGUuc3Vic3RyKDEpO1xuICAgICAgICBpZiAoc2lkZSA9PT0gJ1RvcCcgfHwgc2lkZSA9PT0gJ0xlZnQnKSB7XG4gICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9baV0gLT0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH1cblxuICByZXR1cm4gdG87XG59XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gX3JlZi50YXJnZXRBdHRhY2htZW50O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cbiAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgaXRlbSBnZXR0aW5nIGhpZGRlbiBhcyBhIHJlc3VsdCBvZiBvdXIgcG9zaXRpb25pbmcgd2l0aG91dCBnbGl0Y2hpbmdcbiAgICAgIC8vIHRoZSBjbGFzc2VzIGluIGFuZCBvdXRcbiAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3RoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG4gICAgfSk7XG5cbiAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG4gICAgdmFyIHRhcmdldFdpZHRoID0gdGFyZ2V0U2l6ZS53aWR0aDtcblxuICAgIHZhciBhbGxDbGFzc2VzID0gW3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpLCB0aGlzLmdldENsYXNzKCdvdXQtb2YtYm91bmRzJyldO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciBvdXRPZkJvdW5kc0NsYXNzID0gY29uc3RyYWludC5vdXRPZkJvdW5kc0NsYXNzO1xuICAgICAgdmFyIHBpbm5lZENsYXNzID0gY29uc3RyYWludC5waW5uZWRDbGFzcztcblxuICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKG91dE9mQm91bmRzQ2xhc3MpO1xuICAgICAgfVxuICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhbGxDbGFzc2VzLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciB0QXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGFyZ2V0QXR0YWNobWVudCk7XG4gICAgdmFyIGVBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciB0byA9IGNvbnN0cmFpbnQudG87XG4gICAgICB2YXIgYXR0YWNobWVudCA9IGNvbnN0cmFpbnQuYXR0YWNobWVudDtcbiAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuICAgICAgaWYgKHR5cGVvZiBhdHRhY2htZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBhdHRhY2htZW50ID0gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGFuZ2VBdHRhY2hYID0gdW5kZWZpbmVkLFxuICAgICAgICAgIGNoYW5nZUF0dGFjaFkgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQgPSBhdHRhY2htZW50LnNwbGl0KCcgJyk7XG5cbiAgICAgICAgdmFyIF9hdHRhY2htZW50JHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF9hdHRhY2htZW50JHNwbGl0LCAyKTtcblxuICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gX2F0dGFjaG1lbnQkc3BsaXQyWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuICAgICAgfVxuXG4gICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KF90aGlzLCB0byk7XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0b2dldGhlcicpIHtcbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdG9wIC0gKGhlaWdodCAtIHRhcmdldEhlaWdodCkgPj0gYm91bmRzWzFdKSB7XG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcgJiYgdG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScgJiYgdG9wIDwgYm91bmRzWzFdICYmIHRvcCArIChoZWlnaHQgKiAyIC0gdGFyZ2V0SGVpZ2h0KSA8PSBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ21pZGRsZScpIHtcbiAgICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodEF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBwaW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgIHJldHVybiBwLnRyaW0oKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuICAgICAgICBwaW4gPSBbJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuICAgICAgfVxuXG4gICAgICBwaW4gPSBwaW4gfHwgW107XG5cbiAgICAgIHZhciBwaW5uZWQgPSBbXTtcbiAgICAgIHZhciBvb2IgPSBbXTtcblxuICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ3RvcCcpID49IDApIHtcbiAgICAgICAgICB0b3AgPSBib3VuZHNbMV07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCd0b3AnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1szXSAtIGhlaWdodDtcbiAgICAgICAgICBwaW5uZWQucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2JvdHRvbScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignbGVmdCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdsZWZ0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgICAgbGVmdCA9IGJvdW5kc1syXSAtIHdpZHRoO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwaW5uZWQubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHBpbm5lZENsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygncGlubmVkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgICAgICBwaW5uZWQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvb2IubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuICAgICAgICAgIG9vYi5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSB0QXR0YWNobWVudC5sZWZ0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gdEF0dGFjaG1lbnQudG9wID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuICAgICAgICBfdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKGVBdHRhY2htZW50LCB0QXR0YWNobWVudCk7XG4gICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZScsIHtcbiAgICAgICAgICBhdHRhY2htZW50OiBlQXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiB0QXR0YWNobWVudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmdldFRhcmdldEJvdW5kcygpO1xuXG4gICAgdmFyIGJvdHRvbSA9IHRvcCArIGhlaWdodDtcbiAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cbiAgICB2YXIgYWJ1dHRlZCA9IFtdO1xuICAgIGlmICh0b3AgPD0gdGFyZ2V0UG9zLmJvdHRvbSAmJiBib3R0b20gPj0gdGFyZ2V0UG9zLnRvcCkge1xuICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IGxlZnQgfHwgdGFyZ2V0UG9zU2lkZSA9PT0gcmlnaHQpIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChsZWZ0IDw9IHRhcmdldFBvcy5yaWdodCAmJiByaWdodCA+PSB0YXJnZXRQb3MubGVmdCkge1xuICAgICAgWyd0b3AnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IHRvcCB8fCB0YXJnZXRQb3NTaWRlID09PSBib3R0b20pIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBhbGxDbGFzc2VzID0gW107XG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgYWxsQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICB9KTtcblxuICAgIGlmIChhYnV0dGVkLmxlbmd0aCkge1xuICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgfVxuXG4gICAgYWJ1dHRlZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hpZnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQ7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0LmNhbGwodGhpcywgeyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9KTtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG4gICAgICAgIHNoaWZ0TGVmdCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHNoaWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuICAgICAgc2hpZnRbMV0gPSBzaGlmdFsxXSB8fCBzaGlmdFswXTtcblxuICAgICAgdmFyIF9zaGlmdCA9IHNoaWZ0O1xuXG4gICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cbiAgICAgIHNoaWZ0VG9wID0gX3NoaWZ0MlswXTtcbiAgICAgIHNoaWZ0TGVmdCA9IF9zaGlmdDJbMV07XG5cbiAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuICAgICAgc2hpZnRMZWZ0ID0gcGFyc2VGbG9hdChzaGlmdExlZnQsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG4gICAgICBzaGlmdExlZnQgPSBzaGlmdC5sZWZ0O1xuICAgIH1cblxuICAgIHRvcCArPSBzaGlmdFRvcDtcbiAgICBsZWZ0ICs9IHNoaWZ0TGVmdDtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xucmV0dXJuIFRldGhlcjtcblxufSkpO1xuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vZ2VvbS9Qb2ludFwiO1xyXG5pbXBvcnQge1JlY3R9IGZyb20gXCIuL2dlb20vUmVjdFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkQ2VsbH0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENlbGxcIjtcclxuaW1wb3J0IHtEZWZhdWx0R3JpZENvbHVtbn0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtblwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkTW9kZWx9IGZyb20gXCIuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkUm93fSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93XCI7XHJcbmltcG9ydCB7U3R5bGV9IGZyb20gXCIuL21vZGVsL3N0eWxlZC9TdHlsZVwiO1xyXG5pbXBvcnQge1N0eWxlZEdyaWRDZWxsfSBmcm9tIFwiLi9tb2RlbC9zdHlsZWQvU3R5bGVkR3JpZENlbGxcIjtcclxuaW1wb3J0IHtHcmlkUmFuZ2V9IGZyb20gXCIuL21vZGVsL0dyaWRSYW5nZVwiO1xyXG5pbXBvcnQge0dyaWRFbGVtZW50fSBmcm9tIFwiLi91aS9HcmlkRWxlbWVudFwiO1xyXG5pbXBvcnQge0dyaWRLZXJuZWx9IGZyb20gXCIuL3VpL0dyaWRLZXJuZWxcIjtcclxuaW1wb3J0IHtBYnNXaWRnZXRCYXNlfSBmcm9tIFwiLi91aS9XaWRnZXRcIjtcclxuaW1wb3J0IHtFdmVudEVtaXR0ZXJCYXNlfSBmcm9tIFwiLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXJcIjtcclxuaW1wb3J0IHtjb21tYW5kLCB2YXJpYWJsZSwgcm91dGluZSwgcmVuZGVyZXIsIHZpc3VhbGl6ZX0gZnJvbSBcIi4vdWkvRXh0ZW5zaWJpbGl0eVwiO1xyXG5pbXBvcnQge0NsaXBib2FyZEV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21tb24vQ2xpcGJvYXJkRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7RWRpdGluZ0V4dGVuc2lvbiwgR3JpZENoYW5nZVNldH0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21tb24vRWRpdGluZ0V4dGVuc2lvblwiO1xyXG5pbXBvcnQge1Njcm9sbGVyRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9TY3JvbGxlckV4dGVuc2lvblwiO1xyXG5pbXBvcnQge1NlbGVjdG9yRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9TZWxlY3RvckV4dGVuc2lvblwiO1xyXG5pbXBvcnQge0hpc3RvcnlFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7RGVmYXVsdEhpc3RvcnlNYW5hZ2VyfSBmcm9tIFwiLi9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeU1hbmFnZXJcIjtcclxuaW1wb3J0IHtDb21wdXRlRW5naW5lfSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUVuZ2luZVwiO1xyXG5pbXBvcnQge0NvbXB1dGVFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7SmF2YVNjcmlwdENvbXB1dGVFbmdpbmV9IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZVwiO1xyXG5pbXBvcnQge1dhdGNoTWFuYWdlcn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL1dhdGNoTWFuYWdlclwiO1xyXG5pbXBvcnQge1BhbkV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9leHRyYS9QYW5FeHRlbnNpb25cIjtcclxuaW1wb3J0IHtDbGlja1pvbmVFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvZXh0cmEvQ2xpY2tab25lRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7QmFzZTI2fSBmcm9tIFwiLi9taXNjL0Jhc2UyNlwiO1xyXG5cclxuXHJcbihmdW5jdGlvbihleHQ6YW55KSB7XHJcblxyXG4gICAgZXh0LkNsaXBib2FyZEV4dGVuc2lvbiA9IENsaXBib2FyZEV4dGVuc2lvbjtcclxuICAgIGV4dC5FZGl0aW5nRXh0ZW5zaW9uID0gRWRpdGluZ0V4dGVuc2lvbjsgICAgXHJcbiAgICBleHQuU2Nyb2xsZXJFeHRlbnNpb24gPSBTY3JvbGxlckV4dGVuc2lvbjtcclxuICAgIGV4dC5TZWxlY3RvckV4dGVuc2lvbiA9IFNlbGVjdG9yRXh0ZW5zaW9uO1xyXG4gICAgZXh0Lkhpc3RvcnlFeHRlbnNpb24gPSBIaXN0b3J5RXh0ZW5zaW9uO1xyXG4gICAgZXh0LkRlZmF1bHRIaXN0b3J5TWFuYWdlciA9IERlZmF1bHRIaXN0b3J5TWFuYWdlcjtcclxuICAgIGV4dC5Db21wdXRlRXh0ZW5zaW9uID0gQ29tcHV0ZUV4dGVuc2lvbjtcclxuICAgIGV4dC5KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSA9IEphdmFTY3JpcHRDb21wdXRlRW5naW5lO1xyXG4gICAgZXh0LldhdGNoTWFuYWdlciA9IFdhdGNoTWFuYWdlcjtcclxuICAgIGV4dC5QYW5FeHRlbnNpb24gPSBQYW5FeHRlbnNpb247XHJcbiAgICBleHQuQ2xpY2tab25lRXh0ZW5zaW9uID0gQ2xpY2tab25lRXh0ZW5zaW9uO1xyXG4gICAgZXh0LlBvaW50ID0gUG9pbnQ7XHJcbiAgICBleHQuUmVjdCA9IFJlY3Q7XHJcbiAgICBleHQuQmFzZTI2ID0gQmFzZTI2O1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkQ2VsbCA9IERlZmF1bHRHcmlkQ2VsbDtcclxuICAgIGV4dC5EZWZhdWx0R3JpZENvbHVtbiA9IERlZmF1bHRHcmlkQ29sdW1uO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkTW9kZWwgPSBEZWZhdWx0R3JpZE1vZGVsO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkUm93ID0gRGVmYXVsdEdyaWRSb3c7XHJcbiAgICBleHQuU3R5bGUgPSBTdHlsZTtcclxuICAgIGV4dC5TdHlsZWRHcmlkQ2VsbCA9IFN0eWxlZEdyaWRDZWxsO1xyXG4gICAgZXh0LkdyaWRDaGFuZ2VTZXQgPSBHcmlkQ2hhbmdlU2V0O1xyXG4gICAgZXh0LkdyaWRSYW5nZSA9IEdyaWRSYW5nZTtcclxuICAgIGV4dC5HcmlkRWxlbWVudCA9IEdyaWRFbGVtZW50O1xyXG4gICAgZXh0LkdyaWRLZXJuZWwgPSBHcmlkS2VybmVsO1xyXG4gICAgZXh0LkFic1dpZGdldEJhc2UgPSBBYnNXaWRnZXRCYXNlO1xyXG4gICAgZXh0LkV2ZW50RW1pdHRlckJhc2UgPSBFdmVudEVtaXR0ZXJCYXNlO1xyXG4gICAgZXh0LmNvbW1hbmQgPSBjb21tYW5kO1xyXG4gICAgZXh0LnZhcmlhYmxlID0gdmFyaWFibGU7XHJcbiAgICBleHQucm91dGluZSA9IHJvdXRpbmU7XHJcbiAgICBleHQucmVuZGVyZXIgPSByZW5kZXJlcjtcclxuICAgIGV4dC52aXN1YWxpemUgPSB2aXN1YWxpemU7XHJcbiAgICBcclxufSkod2luZG93WydjYXR0bGUnXSB8fCAod2luZG93WydjYXR0bGUnXSA9IHt9KSk7IiwiaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFNlbGVjdG9yV2lkZ2V0IH0gZnJvbSAnLi9TZWxlY3RvckV4dGVuc2lvbic7XHJcbmltcG9ydCB7IEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyB2YXJpYWJsZSwgY29tbWFuZCwgcm91dGluZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgeyBDbGlwYm9hcmQgfSBmcm9tICcuLi8uLi92ZW5kb3IvY2xpcGJvYXJkJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgKiBhcyBQYXBhIGZyb20gJ3BhcGFwYXJzZSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuXHJcbi8vSSBrbm93Li4uIDooXHJcbmNvbnN0IE5ld0xpbmUgPSAhIXdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goLy4qW1d3XVtJaV1bTm5dLiovKSA/ICdcXHJcXG4nIDogJ1xcbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpcGJvYXJkRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgY29weUxpc3Q6c3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgY29weVJhbmdlOkdyaWRSYW5nZSA9IEdyaWRSYW5nZS5lbXB0eSgpO1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGNvcHlOZXQ6Q29weU5ldDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX0MnLCAoZTpLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmNvcHlTZWxlY3Rpb24oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMub25XaW5kb3dQYXN0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbk5ldCgpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6YmVnaW5FZGl0JywgKCkgPT4gdGhpcy5yZXNldENvcHkoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IGNhcHR1cmVTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnY2FwdHVyZVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5jb3B5TmV0ID0gQ29weU5ldC5jcmVhdGUobGF5ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgY29weVNlbGVjdGlvbigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQ29weSh0aGlzLnNlbGVjdGlvbik7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgcmVzZXRDb3B5KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9Db3B5KFtdKTtcclxuICAgICAgICB0aGlzLmFsaWduTmV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb0NvcHkoY2VsbHM6c3RyaW5nW10sIGRlbGltaXRlcjpzdHJpbmcgPSAnXFx0Jyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY29weUxpc3QgPSBjZWxscztcclxuICAgICAgICBsZXQgcmFuZ2UgPSB0aGlzLmNvcHlSYW5nZSA9IEdyaWRSYW5nZS5jcmVhdGUodGhpcy5ncmlkLm1vZGVsLCBjZWxscyk7XHJcbiAgICAgICAgbGV0IHRleHQgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCFjZWxscy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHJyID0gcmFuZ2UubHRyWzBdLnJvd1JlZjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlLmx0ci5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjID0gcmFuZ2UubHRyW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJyICE9PSBjLnJvd1JlZilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBOZXdMaW5lO1xyXG4gICAgICAgICAgICAgICAgcnIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBjLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCAocmFuZ2UubHRyLmxlbmd0aCAtIDEpICYmIHJhbmdlLmx0cltpICsgMV0ucm93UmVmID09PSBycilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBkZWxpbWl0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIENsaXBib2FyZC5jb3B5KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZG9QYXN0ZSh0ZXh0OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBmb2N1c2VkQ2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwoc2VsZWN0aW9uWzBdKTtcclxuXHJcbiAgICAgICAgbGV0IHBhcnNlZCA9IFBhcGEucGFyc2UodGV4dCwge1xyXG4gICAgICAgICAgICBkZWxpbWl0ZXI6IHRleHQuaW5kZXhPZignXFx0JykgPj0gMCA/ICdcXHQnIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IHBhcnNlZC5kYXRhLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMSB8fCAoeC5sZW5ndGggPT0gMSAmJiAhIXhbMF0pKTtcclxuICAgICAgICBpZiAoIWRhdGEubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8ubWF4KGRhdGEsIHggPT4geC5sZW5ndGgpLmxlbmd0aDtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IHN0YXJ0VmVjdG9yID0gbmV3IFBvaW50KGZvY3VzZWRDZWxsLmNvbFJlZiwgZm9jdXNlZENlbGwucm93UmVmKTtcclxuICAgICAgICBsZXQgZW5kVmVjdG9yID0gc3RhcnRWZWN0b3IuYWRkKG5ldyBQb2ludCh3aWR0aCwgaGVpZ2h0KSk7XHJcblxyXG4gICAgICAgIGxldCBwYXN0ZVJhbmdlID0gR3JpZFJhbmdlLmNhcHR1cmUoZ3JpZC5tb2RlbCwgc3RhcnRWZWN0b3IsIGVuZFZlY3Rvcik7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VzID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHBhc3RlUmFuZ2UubHRyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHh5ID0gbmV3IFBvaW50KGNlbGwuY29sUmVmLCBjZWxsLnJvd1JlZikuc3VidHJhY3Qoc3RhcnRWZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBkYXRhW3h5LnldW3h5LnhdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgY2hhbmdlcy5wdXQoY2VsbC5yZWYsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3QnLCBwYXN0ZVJhbmdlLmx0ci5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25OZXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgY29weUxpc3QsIGNvcHlOZXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChjb3B5TGlzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBuZXRSZWN0ID0gUmVjdC5mcm9tTWFueShjb3B5TGlzdC5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjb3B5TmV0LmdvdG8obmV0UmVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uV2luZG93UGFzdGUoZTpDbGlwYm9hcmRFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcbiAgICAgICAgd2hpbGUgKCEhYWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoYWUgPT0gdGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGFlID0gYWUucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYWUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9wbGFpbicpO1xyXG4gICAgICAgIGlmICh0ZXh0ICE9PSBudWxsICYmIHRleHQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9QYXN0ZSh0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb3B5TmV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50KTpDb3B5TmV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLW5ldCBncmlkLW5ldC1jb3B5JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb3B5TmV0KHJvb3QpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgU2VsZWN0b3JXaWRnZXQgfSBmcm9tICcuL1NlbGVjdG9yRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyB2YWx1ZXMgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlLCBXaWRnZXQgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5jb25zdCBWZWN0b3JzID0ge1xyXG4gICAgbjogbmV3IFBvaW50KDAsIC0xKSxcclxuICAgIHM6IG5ldyBQb2ludCgwLCAxKSxcclxuICAgIGU6IG5ldyBQb2ludCgxLCAwKSxcclxuICAgIHc6IG5ldyBQb2ludCgtMSwgMCksXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFZGl0RXZlbnRcclxue1xyXG4gICAgY2hhbmdlczpHcmlkQ2hhbmdlW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVNldFZpc2l0b3Jcclxue1xyXG4gICAgKHJlZjpzdHJpbmcsIHZhbDpzdHJpbmcsIGNhc2NhZGVkOmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENoYW5nZVNldEl0ZW1cclxue1xyXG4gICAgcmVhZG9ubHkgcmVmOnN0cmluZztcclxuICAgIHJlYWRvbmx5IHZhbHVlOnN0cmluZztcclxuICAgIHJlYWRvbmx5IGNhc2NhZGVkPzpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZENoYW5nZVNldFxyXG57XHJcbiAgICBwcml2YXRlIGRhdGE6T2JqZWN0TWFwPEdyaWRDaGFuZ2VTZXRJdGVtPiA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyBjb250ZW50cygpOkdyaWRDaGFuZ2VTZXRJdGVtW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFsdWVzKHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldChyZWY6c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBsZXQgZW50cnkgPSB0aGlzLmRhdGFbcmVmXTtcclxuICAgICAgICByZXR1cm4gISFlbnRyeSA/IGVudHJ5LnZhbHVlIDogdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwdXQocmVmOnN0cmluZywgdmFsdWU6c3RyaW5nLCBjYXNjYWRlZD86Ym9vbGVhbik6R3JpZENoYW5nZVNldFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGF0YVtyZWZdID0ge1xyXG4gICAgICAgICAgICByZWY6IHJlZixcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBjYXNjYWRlZDogISFjYXNjYWRlZCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVmcygpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXBpbGUobW9kZWw6R3JpZE1vZGVsKTpHcmlkQ2hhbmdlW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50cygpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiAoe1xyXG4gICAgICAgICAgICAgICAgY2VsbDogbW9kZWwuZmluZENlbGwoeC5yZWYpLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHgudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBjYXNjYWRlZDogeC5jYXNjYWRlZCxcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguY2FzY2FkZWQgfHwgIWlzX3JlYWRvbmx5KHguY2VsbCkpXHJcbiAgICAgICAgO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElucHV0V2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuICAgIGZvY3VzKCk6dm9pZDtcclxuICAgIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0aW5nRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgaW5wdXQ6SW5wdXQ7XHJcblxyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFFU0NBUEUnLCAoKSA9PiB0aGlzLmVuZEVkaXQoZmFsc2UpKVxyXG4gICAgICAgICAgICAub24oJyFFTlRFUicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchVEFCJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignVVBfQVJST1cnLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignRE9XTl9BUlJPVycsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCdSSUdIVF9BUlJPVycsICgpID0+IHsgaWYgKCF0aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKTsgfSB9KVxyXG4gICAgICAgICAgICAub24oJ0xFRlRfQVJST1cnLCAoKSA9PiB7IGlmICghdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCkgeyB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudyk7IH0gfSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKHRoaXMuaW5wdXQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoKSA9PiB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gdHJ1ZSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchREVMRVRFJywgKCkgPT4gdGhpcy5lcmFzZSgpKVxyXG4gICAgICAgICAgICAub24oJyFCQUNLU1BBQ0UnLCAoKSA9PiB0aGlzLmJlZ2luRWRpdCgnJykpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdEQkxDTElDSzpQUklNQVJZJywgKCkgPT4gdGhpcy5iZWdpbkVkaXQobnVsbCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdrZXlwcmVzcycsIChlOkdyaWRLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmJlZ2luRWRpdChTdHJpbmcuZnJvbUNoYXJDb2RlKGUuY2hhckNvZGUpKSk7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6ZG9TZWxlY3QnLCAoKSA9PiB0aGlzLmVuZEVkaXQodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHByaW1hcnlTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgncHJpbWFyeVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5pbnB1dCA9IElucHV0LmNyZWF0ZShsYXllcik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBiZWdpbkVkaXQob3ZlcnJpZGU6c3RyaW5nKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHsgaW5wdXQgfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQubW9kZWwuZmluZENlbGwodGhpcy5zZWxlY3Rpb25bMF0pO1xyXG5cclxuICAgICAgICBpZiAoaXNfcmVhZG9ubHkoY2VsbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISFvdmVycmlkZSB8fCBvdmVycmlkZSA9PT0gJycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwob3ZlcnJpZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwoY2VsbC52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnB1dC5nb3RvKHRoaXMucHJpbWFyeVNlbGVjdG9yLnZpZXdSZWN0KTtcclxuICAgICAgICBpbnB1dC5mb2N1cygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVuZEVkaXQoY29tbWl0OmJvb2xlYW4gPSB0cnVlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgeyBncmlkLCBpbnB1dCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBuZXdWYWx1ZSA9IGlucHV0LnZhbCgpO1xyXG5cclxuICAgICAgICBpbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgaW5wdXQudmFsKCcnKTtcclxuICAgICAgICBncmlkLmZvY3VzKCk7XHJcblxyXG4gICAgICAgIGlmIChjb21taXQgJiYgISFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jb21taXRVbmlmb3JtKHNlbGVjdGlvbi5zbGljZSgwLCAxKSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5kRWRpdFRvTmVpZ2hib3IodmVjdG9yOlBvaW50LCBjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5lbmRFZGl0KGNvbW1pdCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ3NlbGVjdE5laWdoYm9yJywgdmVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBlcmFzZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLCAnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb21taXRVbmlmb3JtKGNlbGxzOnN0cmluZ1tdLCB1bmlmb3JtVmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgIGZvciAobGV0IHJlZiBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNoYW5nZXMucHV0KHJlZiwgdW5pZm9ybVZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdChjaGFuZ2VzKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZ3JpZDtcclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgaWYgKGNvbXBpbGVkLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnaW5wdXQnLCB7IGNoYW5nZXM6IGNvbXBpbGVkIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSW5wdXQgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxJbnB1dEVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6SW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgcm9vdC50eXBlID0gJ3RleHQnO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtaW5wdXQnO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgbWFyZ2luOiAnMCcsXHJcbiAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IElucHV0KHJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmdvdG8odmlld1JlY3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0ICsgMn1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wICsgMn1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9jdXMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcm9vdC5mb2N1cygpO1xyXG4gICAgICAgICAgICByb290LnNldFNlbGVjdGlvblJhbmdlKHJvb3QudmFsdWUubGVuZ3RoLCByb290LnZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC52YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNfcmVhZG9ubHkoY2VsbDpHcmlkQ2VsbCk6Ym9vbGVhblxyXG57XHJcbiAgICByZXR1cm4gY2VsbFsncmVhZG9ubHknXSA9PT0gdHJ1ZSB8fCBjZWxsWydtdXRhYmxlJ10gPT09IGZhbHNlO1xyXG59IiwiaW1wb3J0IHsgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNjcm9sbGVyRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxlclg6SFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNjcm9sbGVyWTpIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgd2VkZ2VYOkhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSB3ZWRnZVk6SFRNTERpdkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCAoKSA9PiB0aGlzLmFsaWduRWxlbWVudHMoKSk7XHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbkVsZW1lbnRzKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIGxldCBzY3JvbGxlclggPSB0aGlzLnNjcm9sbGVyWCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHNjcm9sbGVyWC5jbGFzc05hbWUgPSAnZ3JpZC1zY3JvbGxlciBncmlkLXNjcm9sbGVyLXgnO1xyXG4gICAgICAgIHNjcm9sbGVyWC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsSG9yaXpvbnRhbC5iaW5kKHRoaXMpKTtcclxuICAgICAgICBsYXllci5hcHBlbmRDaGlsZChzY3JvbGxlclgpO1xyXG5cclxuICAgICAgICBsZXQgd2VkZ2VYID0gdGhpcy53ZWRnZVggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBzY3JvbGxlclguYXBwZW5kQ2hpbGQod2VkZ2VYKTtcclxuXHJcbiAgICAgICAgbGV0IHNjcm9sbGVyWSA9IHRoaXMuc2Nyb2xsZXJZID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgc2Nyb2xsZXJZLmNsYXNzTmFtZSA9ICdncmlkLXNjcm9sbGVyIGdyaWQtc2Nyb2xsZXIteSc7XHJcbiAgICAgICAgc2Nyb2xsZXJZLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxWZXJ0aWNhbC5iaW5kKHRoaXMpKTtcclxuICAgICAgICBsYXllci5hcHBlbmRDaGlsZChzY3JvbGxlclkpO1xyXG5cclxuICAgICAgICBsZXQgd2VkZ2VZID0gdGhpcy53ZWRnZVkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBzY3JvbGxlclkuYXBwZW5kQ2hpbGQod2VkZ2VZKTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnNjcm9sbGVyWCwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dGhpcy5ncmlkLndpZHRofXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAnMTZweCcsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICBib3R0b206ICcwcHgnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMuc2Nyb2xsZXJZLCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnMTZweCcsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dGhpcy5ncmlkLmhlaWdodH1weGAsXHJcbiAgICAgICAgICAgIHJpZ2h0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFsaWduRWxlbWVudHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnNjcm9sbGVyWCwge1xyXG4gICAgICAgICAgICB3aWR0aDogYCR7dGhpcy5ncmlkLndpZHRofXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLndlZGdlWCwge1xyXG4gICAgICAgICAgICB3aWR0aDogYCR7dGhpcy5ncmlkLnZpcnR1YWxXaWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogJzFweCcsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGVyWC5zY3JvbGxMZWZ0ICE9IHRoaXMuZ3JpZC5zY3JvbGxMZWZ0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxlclguc2Nyb2xsTGVmdCA9IHRoaXMuZ3JpZC5zY3JvbGxMZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnNjcm9sbGVyWSwge1xyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3RoaXMuZ3JpZC5oZWlnaHR9cHhgLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMud2VkZ2VZLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAnMXB4JyxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt0aGlzLmdyaWQudmlydHVhbEhlaWdodH1weGAsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGVyWS5zY3JvbGxUb3AgIT0gdGhpcy5ncmlkLnNjcm9sbFRvcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXJZLnNjcm9sbFRvcCA9IHRoaXMuZ3JpZC5zY3JvbGxUb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25TY3JvbGxIb3Jpem9udGFsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZC5zY3JvbGxMZWZ0ID0gdGhpcy5zY3JvbGxlclguc2Nyb2xsTGVmdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uU2Nyb2xsVmVydGljYWwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkLnNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsZXJZLnNjcm9sbFRvcDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRNb3VzZUV2ZW50LCBHcmlkTW91c2VEcmFnRXZlbnQgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBNb3VzZUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvTW91c2VJbnB1dCc7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50U3VwcG9ydCc7XHJcbmltcG9ydCB7IFdpZGdldCwgQWJzV2lkZ2V0QmFzZSB9IGZyb20gJy4uLy4uL3VpL1dpZGdldCc7XHJcbmltcG9ydCB7IGNvbW1hbmQsIHJvdXRpbmUsIHZhcmlhYmxlIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbmNvbnN0IFZlY3RvcnMgPSB7XHJcbiAgICBudzogbmV3IFBvaW50KC0xLCAtMSksXHJcbiAgICBuOiBuZXcgUG9pbnQoMCwgLTEpLFxyXG4gICAgbmU6IG5ldyBQb2ludCgxLCAtMSksXHJcbiAgICBlOiBuZXcgUG9pbnQoMSwgMCksXHJcbiAgICBzZTogbmV3IFBvaW50KDEsIDEpLFxyXG4gICAgczogbmV3IFBvaW50KDAsIDEpLFxyXG4gICAgc3c6IG5ldyBQb2ludCgtMSwgMSksXHJcbiAgICB3OiBuZXcgUG9pbnQoLTEsIDApLFxyXG59O1xyXG5cclxuaW50ZXJmYWNlIFNlbGVjdEdlc3R1cmVcclxue1xyXG4gICAgc3RhcnQ6c3RyaW5nO1xyXG4gICAgZW5kOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RvcldpZGdldCBleHRlbmRzIFdpZGdldFxyXG57XHJcblxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdG9yRXh0ZW5zaW9uRXhwb3J0c1xyXG57XHJcbiAgICBjYW5TZWxlY3Q6Ym9vbGVhbjtcclxuXHJcbiAgICByZWFkb25seSBzZWxlY3Rpb246c3RyaW5nW11cclxuXHJcbiAgICByZWFkb25seSBwcmltYXJ5U2VsZWN0b3I6U2VsZWN0b3JXaWRnZXQ7XHJcblxyXG4gICAgcmVhZG9ubHkgY2FwdHVyZVNlbGVjdG9yOlNlbGVjdG9yV2lkZ2V0O1xyXG5cclxuICAgIHNlbGVjdChjZWxsczpzdHJpbmdbXSwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEJvcmRlcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0RWRnZSh2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0TGluZShncmlkUHQ6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0TmVpZ2hib3IodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2VsZWN0b3JFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgc2VsZWN0R2VzdHVyZTpTZWxlY3RHZXN0dXJlO1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGNhblNlbGVjdDpib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIHNlbGVjdGlvbjpzdHJpbmdbXSA9IFtdO1xyXG5cclxuICAgIEB2YXJpYWJsZShmYWxzZSlcclxuICAgIHByaXZhdGUgcHJpbWFyeVNlbGVjdG9yOlNlbGVjdG9yO1xyXG5cclxuICAgIEB2YXJpYWJsZShmYWxzZSlcclxuICAgIHByaXZhdGUgY2FwdHVyZVNlbGVjdG9yOlNlbGVjdG9yO1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IoZ3JpZClcclxuICAgICAgICAgICAgLm9uKCchVEFCJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIVJJR0hUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFMRUZUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFVUF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCchRE9XTl9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtSSUdIVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0xFRlRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtVUF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0RPV05fQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtBJywgKCkgPT4gdGhpcy5zZWxlY3RBbGwoKSlcclxuICAgICAgICAgICAgLm9uKCchSE9NRScsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrSE9NRScsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMubncpKVxyXG4gICAgICAgICAgICAub24oJyFFTkQnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0VORCcsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMuc2UpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VEcmFnRXZlbnRTdXBwb3J0LmVuYWJsZShncmlkLnJvb3QpO1xyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpTSElGVCtQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+IHRoaXMuc2VsZWN0TGluZShuZXcgUG9pbnQoZS5ncmlkWCwgZS5ncmlkWSkpKVxyXG4gICAgICAgICAgICAub24oJ0RPV046UFJJTUFSWScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PiB0aGlzLmJlZ2luU2VsZWN0R2VzdHVyZShlLmdyaWRYLCBlLmdyaWRZKSlcclxuICAgICAgICAgICAgLm9uKCdEUkFHOlBSSU1BUlknLCAoZTpHcmlkTW91c2VEcmFnRXZlbnQpID0+IHRoaXMudXBkYXRlU2VsZWN0R2VzdHVyZShlLmdyaWRYLCBlLmdyaWRZKSlcclxuICAgICAgICAgICAgLm9uKCdVUDpQUklNQVJZJywgKGU6R3JpZE1vdXNlRHJhZ0V2ZW50KSA9PiB0aGlzLmVuZFNlbGVjdEdlc3R1cmUoLyplLmdyaWRYLCBlLmdyaWRZKi8pKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignaW52YWxpZGF0ZScsICgpID0+IHRoaXMucmVzZWxlY3QoZmFsc2UpKTtcclxuICAgICAgICBncmlkLm9uKCdzY3JvbGwnLCAoKSA9PiB0aGlzLmFsaWduU2VsZWN0b3JzKGZhbHNlKSk7XHJcblxyXG4gICAgICAgIGtlcm5lbC52YXJpYWJsZXMuZGVmaW5lKCdpc1NlbGVjdGluZycsIHtcclxuICAgICAgICAgICAgZ2V0OiAoKSA9PiAhIXRoaXMuc2VsZWN0R2VzdHVyZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuXHJcbiAgICAgICAgdGhpcy5wcmltYXJ5U2VsZWN0b3IgPSBTZWxlY3Rvci5jcmVhdGUobGF5ZXIsIHRydWUpO1xyXG4gICAgICAgIHRoaXMuY2FwdHVyZVNlbGVjdG9yID0gU2VsZWN0b3IuY3JlYXRlKGxheWVyLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3QoY2VsbHM6c3RyaW5nW10sIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kb1NlbGVjdChjZWxscywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgdGhpcy5hbGlnblNlbGVjdG9ycyh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdEFsbCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwuY2VsbHMubWFwKHggPT4geC5yZWYpKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdEJvcmRlcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZlY3RvciA9IHZlY3Rvci5ub3JtYWxpemUoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdGFydENlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHJlZik7XHJcbiAgICAgICAgICAgIGxldCB4eSA9IHsgeDogc3RhcnRDZWxsLmNvbFJlZiwgeTogc3RhcnRDZWxsLnJvd1JlZiB9IGFzIFBvaW50TGlrZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2ZWN0b3IueCA8IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHh5LnggPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2ZWN0b3IueCA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHh5LnggPSBncmlkLm1vZGVsV2lkdGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2ZWN0b3IueSA8IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHh5LnkgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2ZWN0b3IueSA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHh5LnkgPSBncmlkLm1vZGVsSGVpZ2h0IC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHJlc3VsdENlbGwgPSBncmlkLm1vZGVsLmxvY2F0ZUNlbGwoeHkueCwgeHkueSk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRDZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbcmVzdWx0Q2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdEVkZ2UodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZlY3RvciA9IHZlY3Rvci5ub3JtYWxpemUoKTtcclxuXHJcbiAgICAgICAgbGV0IGVtcHR5ID0gKGNlbGw6R3JpZENlbGwpID0+IDxhbnk+KGNlbGwudmFsdWUgPT09ICcnICB8fCBjZWxsLnZhbHVlID09PSAnMCcgfHwgY2VsbC52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGNlbGwudmFsdWUgPT09IG51bGwpO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHN0YXJ0Q2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwocmVmKTtcclxuICAgICAgICAgICAgbGV0IGN1cnJDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKHN0YXJ0Q2VsbC5yZWYsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDZWxsID0gPEdyaWRDZWxsPm51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWN1cnJDZWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHRydWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhID0gY3VyckNlbGw7XHJcbiAgICAgICAgICAgICAgICBsZXQgYiA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihhLnJlZiwgdmVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWEgfHwgIWIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Q2VsbCA9ICEhYSA/IGEgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbXB0eShhKSArIGVtcHR5KGIpID09IDEpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Q2VsbCA9IGVtcHR5KGEpID8gYiA6IGE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY3VyckNlbGwgPSBiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW3Jlc3VsdENlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RMaW5lKGdyaWRQdDpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAoIXJlZilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHN0YXJ0UHQgPSBncmlkLmdldENlbGxHcmlkUmVjdChyZWYpLnRvcExlZnQoKTtcclxuICAgICAgICBsZXQgbGluZVJlY3QgPSBSZWN0LmZyb21Qb2ludHMoc3RhcnRQdCwgZ3JpZFB0KTtcclxuXHJcbiAgICAgICAgbGV0IGNlbGxSZWZzID0gZ3JpZC5nZXRDZWxsc0luR3JpZFJlY3QobGluZVJlY3QpLm1hcCh4ID0+IHgucmVmKTtcclxuICAgICAgICBjZWxsUmVmcy5zcGxpY2UoY2VsbFJlZnMuaW5kZXhPZihyZWYpLCAxKTtcclxuICAgICAgICBjZWxsUmVmcy5zcGxpY2UoMCwgMCwgcmVmKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGF1dG9TY3JvbGwpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0TmVpZ2hib3IodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZlY3RvciA9IHZlY3Rvci5ub3JtYWxpemUoKTtcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKHJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtjZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzZWxlY3QoYXV0b1Njcm9sbDpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlbWFpbmluZyA9IHNlbGVjdGlvbi5maWx0ZXIoeCA9PiAhIWdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG4gICAgICAgIGlmIChyZW1haW5pbmcubGVuZ3RoICE9IHNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdChyZW1haW5pbmcsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZ2luU2VsZWN0R2VzdHVyZShncmlkWDpudW1iZXIsIGdyaWRZOm51bWJlcik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChncmlkWCwgZ3JpZFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gdGhpcy5ncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcblxyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBjZWxsLnJlZixcclxuICAgICAgICAgICAgZW5kOiBjZWxsLnJlZixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChbIGNlbGwucmVmIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU2VsZWN0R2VzdHVyZShncmlkWDpudW1iZXIsIGdyaWRZOm51bWJlcik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdEdlc3R1cmUgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChncmlkWCwgZ3JpZFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGwgfHwgc2VsZWN0R2VzdHVyZS5lbmQgPT09IGNlbGwucmVmKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHNlbGVjdEdlc3R1cmUuZW5kID0gY2VsbC5yZWY7XHJcblxyXG4gICAgICAgIGxldCByZWdpb24gPSBSZWN0LmZyb21NYW55KFtcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5zdGFydCksXHJcbiAgICAgICAgICAgIGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHNlbGVjdEdlc3R1cmUuZW5kKVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICBsZXQgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChyZWdpb24pXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PngucmVmKTtcclxuXHJcbiAgICAgICAgaWYgKGNlbGxSZWZzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjZWxsUmVmcy5zcGxpY2UoY2VsbFJlZnMuaW5kZXhPZihzZWxlY3RHZXN0dXJlLnN0YXJ0KSwgMSk7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZSgwLCAwLCBzZWxlY3RHZXN0dXJlLnN0YXJ0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KGNlbGxSZWZzLCBjZWxsUmVmcy5sZW5ndGggPT0gMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmRTZWxlY3RHZXN0dXJlKCk6dm9pZCBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZG9TZWxlY3QoY2VsbHM6c3RyaW5nW10gPSBbXSwgYXV0b1Njcm9sbDpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jYW5TZWxlY3QpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKGNlbGxzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gY2VsbHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXV0b1Njcm9sbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxUbyhwcmltYXJ5UmVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnblNlbGVjdG9ycyhhbmltYXRlOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24sIHByaW1hcnlTZWxlY3RvciwgY2FwdHVyZVNlbGVjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwcmltYXJ5UmVjdCA9IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHNlbGVjdGlvblswXSk7XHJcbiAgICAgICAgICAgIHByaW1hcnlTZWxlY3Rvci5nb3RvKHByaW1hcnlSZWN0LCBhbmltYXRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogSW1wcm92ZSB0aGUgc2hpdCBvdXQgb2YgdGhpczpcclxuICAgICAgICAgICAgbGV0IGNhcHR1cmVSZWN0ID0gUmVjdC5mcm9tTWFueShzZWxlY3Rpb24ubWFwKHggPT4gZ3JpZC5nZXRDZWxsVmlld1JlY3QoeCkpKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLmdvdG8oY2FwdHVyZVJlY3QsIGFuaW1hdGUpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IudG9nZ2xlKHNlbGVjdGlvbi5sZW5ndGggPiAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmhpZGUoKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFNlbGVjdG9yIGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50LCBwcmltYXJ5OmJvb2xlYW4gPSBmYWxzZSk6U2VsZWN0b3JcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtc2VsZWN0b3IgJyArIChwcmltYXJ5ID8gJ2dyaWQtc2VsZWN0b3ItcHJpbWFyeScgOiAnJyk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0b3Iocm9vdCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb21wdXRlRW5naW5lIH0gZnJvbSAnLi9Db21wdXRlRW5naW5lJztcclxuaW1wb3J0IHsgSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUgfSBmcm9tICcuL0phdmFTY3JpcHRDb21wdXRlRW5naW5lJztcclxuaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4uL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IGV4dGVuZCwgZmxhdHRlbiwgemlwUGFpcnMgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENlbGxXaXRoRm9ybXVsYSBleHRlbmRzIEdyaWRDZWxsXHJcbntcclxuICAgIGZvcm11bGE6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcHV0ZUV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IGVuZ2luZTpDb21wdXRlRW5naW5lO1xyXG5cclxuICAgIHByaXZhdGUgbm9DYXB0dXJlOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlbmdpbmU/OkNvbXB1dGVFbmdpbmUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBlbmdpbmUgfHwgbmV3IEphdmFTY3JpcHRDb21wdXRlRW5naW5lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluaXQ/KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmVuZ2luZS5jb25uZWN0KGdyaWQpO1xyXG5cclxuICAgICAgICBrZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2NvbW1pdCcsIHRoaXMuY29tbWl0T3ZlcnJpZGUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdiZWdpbkVkaXQnLCB0aGlzLmJlZ2luRWRpdE92ZXJyaWRlLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgdGhpcy5yZWxvYWQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWxvYWQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZW5naW5lLCBncmlkIH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBwcm9ncmFtID0ge30gYXMgYW55O1xyXG5cclxuICAgICAgICBlbmdpbmUuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgZ3JpZC5tb2RlbC5jZWxscykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgZm9ybXVsYSA9IGNlbGxbJ2Zvcm11bGEnXSBhcyBzdHJpbmc7XHJcbiAgICAgICAgICAgIGlmICghIWZvcm11bGEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5wcm9ncmFtKGNlbGwucmVmLCBmb3JtdWxhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSB0cnVlO1xyXG4gICAgICAgIGdyaWQuZXhlYygnY29tbWl0JywgZW5naW5lLmNvbXB1dGUoKSk7XHJcbiAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZ2luRWRpdE92ZXJyaWRlKG92ZXJyaWRlOnN0cmluZywgaW1wbDphbnkpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBsZXQgeyBlbmdpbmUsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb25bMF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW92ZXJyaWRlICYmIG92ZXJyaWRlICE9PSAnJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG92ZXJyaWRlID0gZW5naW5lLmdldEZvcm11bGEoc2VsZWN0aW9uWzBdKSB8fCBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGltcGwob3ZlcnJpZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tbWl0T3ZlcnJpZGUoY2hhbmdlczpHcmlkQ2hhbmdlU2V0LCBpbXBsOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGVuZ2luZSwgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLm5vQ2FwdHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzY29wZSA9IG5ldyBHcmlkQ2hhbmdlU2V0KCk7XHJcbiAgICAgICAgICAgIGxldCBjb21wdXRlTGlzdCA9IFtdIGFzIHN0cmluZ1tdO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgdG0gb2YgY2hhbmdlcy5jb250ZW50cygpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwodG0ucmVmKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsWydyZWFkb25seSddICE9PSB0cnVlICYmIGNlbGxbJ211dGFibGUnXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRtLnZhbHVlLmxlbmd0aCA+IDAgJiYgdG0udmFsdWVbMF0gPT09ICc9JylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5wcm9ncmFtKHRtLnJlZiwgdG0udmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2xlYXIoW3RtLnJlZl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wdXQodG0ucmVmLCB0bS52YWx1ZSwgdG0uY2FzY2FkZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29tcHV0ZUxpc3QucHVzaCh0bS5yZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoY29tcHV0ZUxpc3QubGVuZ3RoKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzID0gZW5naW5lLmNvbXB1dGUoY29tcHV0ZUxpc3QsIHNjb3BlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpbXBsKGNoYW5nZXMpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQmFzZTI2IH0gZnJvbSAnLi4vLi4nO1xyXG5pbXBvcnQgeyBleHRlbmQsIGZsYXR0ZW4sIGluZGV4IH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgQ29tcHV0ZUVuZ2luZSB9IGZyb20gJy4vQ29tcHV0ZUVuZ2luZSc7XHJcbmltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuLi9jb21tb24vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgV2F0Y2hNYW5hZ2VyIH0gZnJvbSAnLi9XYXRjaE1hbmFnZXInO1xyXG5cclxuXHJcbmNvbnN0IFJlZkV4dHJhY3QgPSAvKD8hLipbJ1wiYF0pW0EtWmEtel0rWzAtOV0rOj8oW0EtWmEtel0rWzAtOV0rKT8vZztcclxuXHJcbmNvbnN0IFN1cHBvcnRGdW5jdGlvbnMgPSB7XHJcbiAgICAvL01hdGg6XHJcbiAgICBhYnM6IE1hdGguYWJzLFxyXG4gICAgYWNvczogTWF0aC5hY29zLFxyXG4gICAgYXNpbjogTWF0aC5hc2luLFxyXG4gICAgYXRhbjogTWF0aC5hdGFuLFxyXG4gICAgYXRhbjI6IE1hdGguYXRhbjIsXHJcbiAgICBjZWlsOiBNYXRoLmNlaWwsXHJcbiAgICBjb3M6IE1hdGguY29zLFxyXG4gICAgZXhwOiBNYXRoLmV4cCxcclxuICAgIGZsb29yOiBNYXRoLmZsb29yLFxyXG4gICAgbG9nOiBNYXRoLmxvZyxcclxuICAgIG1heDogTWF0aC5tYXgsXHJcbiAgICBtaW46IE1hdGgubWluLFxyXG4gICAgcG93OiBNYXRoLnBvdyxcclxuICAgIHJhbmRvbTogTWF0aC5yYW5kb20sXHJcbiAgICByb3VuZDogTWF0aC5yb3VuZCxcclxuICAgIHNpbjogTWF0aC5zaW4sXHJcbiAgICBzcXJ0OiBNYXRoLnNxcnQsXHJcbiAgICB0YW46IE1hdGgudGFuLFxyXG4gICAgLy9DdXN0b206XHJcbiAgICBhdmc6IGZ1bmN0aW9uKHZhbHVlczpudW1iZXJbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFN1cHBvcnRGdW5jdGlvbnMuc3VtKHZhbHVlcykgLyB2YWx1ZXMubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIHN1bTogZnVuY3Rpb24odmFsdWVzOm51bWJlcltdKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc107XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LCAwKTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVkRm9ybXVsYVxyXG57XHJcbiAgICAoY2hhbmdlU2NvcGU/OkdyaWRDaGFuZ2VTZXQpOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEphdmFTY3JpcHRDb21wdXRlRW5naW5lIGltcGxlbWVudHMgQ29tcHV0ZUVuZ2luZVxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGZvcm11bGFzOk9iamVjdE1hcDxzdHJpbmc+ID0ge307XHJcbiAgICBwcml2YXRlIGNhY2hlOk9iamVjdE1hcDxDb21waWxlZEZvcm11bGE+ID0ge307XHJcbiAgICBwcml2YXRlIHdhdGNoZXM6V2F0Y2hNYW5hZ2VyID0gbmV3IFdhdGNoTWFuYWdlcigpO1xyXG4gICAgXHJcbiAgICBwdWJsaWMgZ2V0Rm9ybXVsYShjZWxsUmVmOnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybXVsYXNbY2VsbFJlZl0gfHwgdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcihjZWxsUmVmcz86c3RyaW5nW10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoISFjZWxsUmVmcyAmJiAhIWNlbGxSZWZzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNyIG9mIGNlbGxSZWZzKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZm9ybXVsYXNbY3JdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53YXRjaGVzLnVud2F0Y2goY3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZm9ybXVsYXMgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy53YXRjaGVzLmNsZWFyKCk7ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25uZWN0KGdyaWQ6R3JpZEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXZhbHVhdGUoZm9ybXVsYTpzdHJpbmcsIGNoYW5nZVNjb3BlPzpHcmlkQ2hhbmdlU2V0KTpzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGZ1bmMgPSB0aGlzLmNvbXBpbGUoZm9ybXVsYSk7XHJcbiAgICAgICAgcmV0dXJuIChmdW5jKGNoYW5nZVNjb3BlIHx8IG5ldyBHcmlkQ2hhbmdlU2V0KCkpIHx8IDApLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXB1dGUoY2VsbFJlZnM6c3RyaW5nW10gPSBbXSwgc2NvcGU6R3JpZENoYW5nZVNldCA9IG5ldyBHcmlkQ2hhbmdlU2V0KCksIGNhc2NhZGU6Ym9vbGVhbiA9IHRydWUpOkdyaWRDaGFuZ2VTZXRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBmb3JtdWxhcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IGluZGV4KGNlbGxSZWZzLCB4ID0+IHgpO1xyXG4gICAgICAgIGxldCB0YXJnZXRzID0gKCEhY2VsbFJlZnMubGVuZ3RoID8gY2VsbFJlZnMgOiBPYmplY3Qua2V5cyh0aGlzLmZvcm11bGFzKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IGdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG5cclxuICAgICAgICBpZiAoY2FzY2FkZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRhcmdldHMgPSB0aGlzLmNhc2NhZGVUYXJnZXRzKHRhcmdldHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiB0YXJnZXRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGZvcm11bGEgPSBmb3JtdWxhc1tjZWxsLnJlZl07XHJcbiAgICAgICAgICAgIGlmIChmb3JtdWxhKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZShmb3JtdWxhLCBzY29wZSlcclxuICAgICAgICAgICAgICAgIHNjb3BlLnB1dChjZWxsLnJlZiwgcmVzdWx0LCAhbG9va3VwW2NlbGwucmVmXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzY29wZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5zcGVjdChmb3JtdWxhOnN0cmluZyk6c3RyaW5nW10gXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV4cHJzID0gW10gYXMgc3RyaW5nW107XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IG51bGwgYXMgUmVnRXhwRXhlY0FycmF5O1xyXG5cclxuICAgICAgICB3aGlsZSAocmVzdWx0ID0gUmVmRXh0cmFjdC5leGVjKGZvcm11bGEpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBleHBycy5wdXNoKHJlc3VsdFswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXhwcnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb2dyYW0oY2VsbFJlZjpzdHJpbmcsIGZvcm11bGE6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5mb3JtdWxhc1tjZWxsUmVmXSA9IGZvcm11bGE7XHJcblxyXG4gICAgICAgIGxldCBleHBycyA9IHRoaXMuaW5zcGVjdChmb3JtdWxhKTtcclxuICAgICAgICBsZXQgZHBuUmFuZ2VzID0gZXhwcnMubWFwKHggPT4gR3JpZFJhbmdlLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwsIHgpLmx0cik7XHJcbiAgICAgICAgbGV0IGRwbnMgPSBmbGF0dGVuPEdyaWRDZWxsPihkcG5SYW5nZXMpLm1hcCh4ID0+IHgucmVmKTtcclxuXHJcbiAgICAgICAgaWYgKGRwbnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53YXRjaGVzLndhdGNoKGNlbGxSZWYsIGRwbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY29tcGlsZShmb3JtdWxhOnN0cmluZyk6Q29tcGlsZWRGb3JtdWxhXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gZmluZChmb3JtdWxhOnN0cmluZywgcmVmOnN0cmluZyk6bnVtYmVyIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb3JtdWxhLmxlbmd0aDsgaSsrKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvcm11bGFbaV0gPT0gcmVmWzBdKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybXVsYS5zdWJzdHIoaSwgcmVmLmxlbmd0aCkgPT09IHJlZikgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmMgPSBmb3JtdWxhW2kgKyByZWYubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuYyB8fCAhbmMubWF0Y2goL1xcdy8pKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vU3RvcmUga2V5IHNlcGFyYXRlbHkgYmVjYXVzZSB3ZSBjaGFuZ2UgdGhlIGZvcm11bGEuLi5cclxuICAgICAgICAgICAgbGV0IGNhY2hlS2V5ID0gZm9ybXVsYTtcclxuICAgICAgICAgICAgbGV0IGZ1bmMgPSB0aGlzLmNhY2hlW2NhY2hlS2V5XSBhcyBDb21waWxlZEZvcm11bGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWZ1bmMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBleHBycyA9IHRoaXMuaW5zcGVjdChmb3JtdWxhKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4IG9mIGV4cHJzKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaWR4ID0gZmluZChmb3JtdWxhLCB4KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ID49IDApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybXVsYSA9IGZvcm11bGEuc3Vic3RyaW5nKDAsIGlkeCkgKyBgZXhwcignJHt4fScsIGFyZ3VtZW50c1sxXSlgICsgZm9ybXVsYS5zdWJzdHJpbmcoaWR4ICsgeC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZnVuY3Rpb25zID0gZXh0ZW5kKHt9LCBTdXBwb3J0RnVuY3Rpb25zKTtcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9ucy5leHByID0gdGhpcy5yZXNvbHZlLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNvZGUgPSBgd2l0aCAoYXJndW1lbnRzWzBdKSB7IHRyeSB7IHJldHVybiAoJHtmb3JtdWxhLnN1YnN0cigxKX0pOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IHJldHVybiAwOyB9IH1gLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gdGhpcy5jYWNoZVtjYWNoZUtleV0gPSBuZXcgRnVuY3Rpb24oY29kZSkuYmluZChudWxsLCBmdW5jdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjb21waWxlOicsIGUpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGZvcm11bGEpO1xyXG4gICAgICAgICAgICByZXR1cm4geCA9PiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY2FzY2FkZVRhcmdldHMoY2VsbHM6R3JpZENlbGxbXSk6R3JpZENlbGxbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGZvcm11bGFzLCB3YXRjaGVzIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGFscmVhZHlQdXNoZWQgPSB7fSBhcyBPYmplY3RNYXA8Ym9vbGVhbj47XHJcblxyXG4gICAgICAgIGNvbnN0IHZpc2l0ID0gKGNlbGw6R3JpZENlbGwpOnZvaWQgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChhbHJlYWR5UHVzaGVkW2NlbGwucmVmXSA9PT0gdHJ1ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSB3YXRjaGVzLmdldE9ic2VydmVyc09mKGNlbGwucmVmKVxyXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+IGdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgZGMgb2YgZGVwZW5kZW5jaWVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2aXNpdChkYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghIWZvcm11bGFzW2NlbGwucmVmXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoMCwgMCwgY2VsbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFscmVhZHlQdXNoZWRbY2VsbC5yZWZdID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgIHZpc2l0KGMpOyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHJlc29sdmUoZXhwcjpzdHJpbmcsIGNoYW5nZVNjb3BlOkdyaWRDaGFuZ2VTZXQpOm51bWJlcnxudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBHcmlkUmFuZ2VcclxuICAgICAgICAgICAgLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwsIGV4cHIpXHJcbiAgICAgICAgICAgIC5sdHJcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHRoaXMuY29hbGVzY2VGbG9hdChjaGFuZ2VTY29wZS5nZXQoeC5yZWYpLCB4LnZhbHVlKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoIDwgMlxyXG4gICAgICAgICAgICA/ICh2YWx1ZXNbMF0gfHwgMClcclxuICAgICAgICAgICAgOiB2YWx1ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb2FsZXNjZUZsb2F0KC4uLnZhbHVlczpzdHJpbmdbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgdiBvZiB2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2KSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxufVxyXG4iLCJleHBvcnQgY2xhc3MgV2F0Y2hNYW5hZ2VyXHJcbntcclxuICAgIHByaXZhdGUgb2JzZXJ2aW5nOk9iamVjdE1hcDxzdHJpbmdbXT4gPSB7fTtcclxuICAgIHByaXZhdGUgb2JzZXJ2ZWQ6T2JqZWN0TWFwPHN0cmluZ1tdPiA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZpbmcgPSB7fTtcclxuICAgICAgICB0aGlzLm9ic2VydmVkID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE9ic2VydmVyc09mKGNlbGxSZWY6c3RyaW5nKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmVkW2NlbGxSZWZdIHx8IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRPYnNlcnZlZEJ5KGNlbGxSZWY6c3RyaW5nKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmluZ1tjZWxsUmVmXSB8fCBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2F0Y2gob2JzZXJ2ZXI6c3RyaW5nLCBzdWJqZWN0czpzdHJpbmdbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghc3ViamVjdHMgfHwgIXN1YmplY3RzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLm9ic2VydmluZ1tvYnNlcnZlcl0gPSBzdWJqZWN0cztcclxuICAgICAgICBmb3IgKGxldCBzIG9mIHN1YmplY3RzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLm9ic2VydmVkW3NdIHx8ICh0aGlzLm9ic2VydmVkW3NdID0gW10pO1xyXG4gICAgICAgICAgICBsaXN0LnB1c2gob2JzZXJ2ZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdW53YXRjaChvYnNlcnZlcjpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgc3ViamVjdHMgPSB0aGlzLmdldE9ic2VydmVkQnkob2JzZXJ2ZXIpO1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLm9ic2VydmluZ1tvYnNlcnZlcl07XHJcblxyXG4gICAgICAgIGZvciAobGV0IHMgb2Ygc3ViamVjdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMub2JzZXJ2ZWRbc10gfHwgW107XHJcbiAgICAgICAgICAgIGxldCBpeCA9IGxpc3QuaW5kZXhPZihvYnNlcnZlcik7XHJcbiAgICAgICAgICAgIGlmIChpeCA+PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnXHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkRXh0ZW5zaW9uLCBHcmlkTW91c2VFdmVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50J1xyXG5pbXBvcnQgeyBNb3VzZUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvTW91c2VJbnB1dCc7XHJcbmltcG9ydCB7IFJlY3QsIFJlY3RMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBDbGlja1pvbmVNb2RlID0gJ2Ficyd8J2Ficy1hbHQnfCdyZWwnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDbGlja1pvbmUgZXh0ZW5kcyBSZWN0TGlrZVxyXG57XHJcbiAgICBtb2RlOkNsaWNrWm9uZU1vZGU7XHJcbiAgICB0eXBlOnN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIENsaWNrWm9uZVNlbGVjdGlvblxyXG57XHJcbiAgICBjZWxsOkdyaWRDZWxsO1xyXG4gICAgem9uZTpDbGlja1pvbmU7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpY2tab25lTW91c2VFdmVudCBleHRlbmRzIEdyaWRNb3VzZUV2ZW50XHJcbntcclxuICAgIHpvbmU6Q2xpY2tab25lO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpY2tab25lRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50OkNsaWNrWm9uZVNlbGVjdGlvbjtcclxuICAgIHByaXZhdGUgbGFzdEdyaWRQdDpQb2ludDtcclxuXHJcbiAgICBwcml2YXRlIGdldCBpc1NlbGVjdGluZygpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdpc1NlbGVjdGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmZvcndhcmRMYXllckV2ZW50LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMubGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLmZvcndhcmRMYXllckV2ZW50LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMubGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbkdsb2JhbE1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBncmlkLm9uKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN3aXRjaFpvbmUoY3pzOkNsaWNrWm9uZVNlbGVjdGlvbiwgc291cmNlRXZlbnQ6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGxheWVyIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoaGFzaCh0aGlzLmN1cnJlbnQpID09PSBoYXNoKGN6cykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnem9uZWV4aXQnLCBjcmVhdGVfZXZlbnQoJ3pvbmVleGl0JywgdGhpcy5jdXJyZW50LCBzb3VyY2VFdmVudCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gY3pzO1xyXG5cclxuICAgICAgICBpZiAoY3pzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGF5ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhbGwnO1xyXG4gICAgICAgICAgICBncmlkLmVtaXQoJ3pvbmVlbnRlcicsIGNyZWF0ZV9ldmVudCgnem9uZWVudGVyJywgdGhpcy5jdXJyZW50LCBzb3VyY2VFdmVudCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsYXllci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcndhcmRMYXllckV2ZW50KGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGxhc3RHcmlkUHQgfSA9IHRoaXM7XHJcbiAgICAgICAgZVsnZ3JpZFgnXSA9IGxhc3RHcmlkUHQueDtcclxuICAgICAgICBlWydncmlkWSddID0gbGFzdEdyaWRQdC55O1xyXG5cclxuICAgICAgICBsZXQgdHlwZSA9ICd6b25lJyArIGUudHlwZTtcclxuXHJcbiAgICAgICAgZ3JpZC5mb2N1cygpO1xyXG4gICAgICAgIGdyaWQuZW1pdCh0eXBlLCBjcmVhdGVfZXZlbnQodHlwZSwgdGhpcy5jdXJyZW50LCBlIGFzIEdyaWRNb3VzZUV2ZW50KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlTW92ZShlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbW91c2VQdCA9IHRoaXMubGFzdEdyaWRQdCA9IG5ldyBQb2ludChlLm9mZnNldFgsIGUub2Zmc2V0WSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSBncmlkLmdldENlbGxBdFZpZXdQb2ludChtb3VzZVB0KTtcclxuICAgICAgICBpZiAoY2VsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB2aWV3UmVjdCA9IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KGNlbGwucmVmKTtcclxuICAgICAgICAgICAgbGV0IHpvbmVzID0gKGNlbGxbJ3pvbmVzJ10gfHwgW10pIGFzIENsaWNrWm9uZVtdO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRhcmdldCA9IHpvbmVzXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy50ZXN0KGNlbGwsIHgsIG1vdXNlUHQpKVxyXG4gICAgICAgICAgICAgICAgWzBdIHx8IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoISF0YXJnZXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZSh7Y2VsbDogY2VsbCwgem9uZTogdGFyZ2V0fSwgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUobnVsbCwgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKG51bGwsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uR2xvYmFsTW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZCBcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoISF0aGlzLmN1cnJlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgZ3JpZFJlY3QgPSBSZWN0LmZyb21MaWtlKGdyaWQucm9vdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSlcclxuICAgICAgICAgICAgbGV0IG1vdXNlUHQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWdyaWRSZWN0LmNvbnRhaW5zKG1vdXNlUHQpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUobnVsbCwgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByaXZhdGUgdGVzdChjZWxsOkdyaWRDZWxsLCB6b25lOkNsaWNrWm9uZSwgcHQ6UG9pbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld1JlY3QgPSB0aGlzLmdyaWQuZ2V0Q2VsbFZpZXdSZWN0KGNlbGwucmVmKTtcclxuICAgICAgICBsZXQgem9uZVJlY3QgPSBSZWN0LmZyb21MaWtlKHpvbmUpO1xyXG5cclxuICAgICAgICBpZiAoem9uZS5tb2RlID09PSAncmVsJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHpvbmVSZWN0ID0gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC53aWR0aCAqICh6b25lUmVjdC5sZWZ0IC8gMTAwKSxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LmhlaWdodCAqICh6b25lUmVjdC50b3AgLyAxMDApLFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3Qud2lkdGggKiAoem9uZVJlY3Qud2lkdGggLyAxMDApLFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3QuaGVpZ2h0ICogKHpvbmVSZWN0LmhlaWdodCAvIDEwMCksXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh6b25lLm1vZGUgPT09ICdhYnMtYWx0JykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB6b25lUmVjdCA9IG5ldyBSZWN0KFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3Qud2lkdGggLSB6b25lUmVjdC5sZWZ0IC0gem9uZVJlY3QuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3QuaGVpZ2h0IC0gem9uZVJlY3QudG9wIC0gem9uZVJlY3QuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgem9uZVJlY3Qud2lkdGgsXHJcbiAgICAgICAgICAgICAgICB6b25lUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gem9uZVJlY3Qub2Zmc2V0KHZpZXdSZWN0LnRvcExlZnQoKSkuY29udGFpbnMocHQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVfZXZlbnQodHlwZTpzdHJpbmcsIGN6czpDbGlja1pvbmVTZWxlY3Rpb24sIHNvdXJjZTpNb3VzZUV2ZW50KTpDbGlja1pvbmVNb3VzZUV2ZW50XHJcbntcclxuICAgIGxldCBldmVudCA9IDxhbnk+KG5ldyBNb3VzZUV2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgLy8gZXZlbnQuZ3JpZFggPSBzb3VyY2UuZ3JpZFg7XHJcbiAgICAvLyBldmVudC5ncmlkWSA9IHNvdXJjZS5ncmlkWTtcclxuICAgIGV2ZW50LmNlbGwgPSBjenMuY2VsbDtcclxuICAgIGV2ZW50LnpvbmUgPSBjenMuem9uZTtcclxuICAgIHJldHVybiBldmVudDtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFzaChjenM6Q2xpY2tab25lU2VsZWN0aW9uKTpzdHJpbmdcclxue1xyXG4gICAgaWYgKCFjenMpIHJldHVybiAnJztcclxuICAgIHJldHVybiBbY3pzLmNlbGwucmVmLCBjenMuem9uZS5sZWZ0LCBjenMuem9uZS50b3AsIGN6cy56b25lLndpZHRoLCBjenMuem9uZS5oZWlnaHRdXHJcbiAgICAgICAgLmpvaW4oJzonKTtcclxufSIsImltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCdcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5cyc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFBhbkV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBhbm5pbmcgPSBmYWxzZTtcclxuICAgICAgICBsZXQgbGFzdCA9IG51bGwgYXMgUG9pbnQ7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2tleWRvd24nLCAoZTpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gS2V5cy5TUEFDRSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFubmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsYXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdrZXl1cCcsIChlOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSBLZXlzLlNQQUNFKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBsYXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXBhbm5pbmcpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAobGFzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSBuZXcgUG9pbnQoZS5ncmlkWCwgZS5ncmlkWSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGVsdGEgPSBuZXh0LnN1YnRyYWN0KGxhc3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdyaWQuc2Nyb2xsTGVmdCAtPSBkZWx0YS54O1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxUb3AgLT0gZGVsdGEueTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGFzdCA9IG5ldyBQb2ludChlLmdyaWRYLCBlLmdyaWRZKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9ncmlkLmtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnYmVnaW5FZGl0JywgKG92ZXJyaWRlOnN0cmluZywgaW1wbDphbnkpID0+XHJcbiAgICAgICAgLy97XHJcbiAgICAgICAgLy8gICAgaWYgKHBhbm5pbmcpXHJcbiAgICAgICAgLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vICAgIHJldHVybiBpbXBsKG92ZXJyaWRlKTtcclxuICAgICAgICAvL30pO1xyXG5cclxuICAgICAgICAvL2dyaWQua2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdkb1NlbGVjdCcsIChjZWxsczpzdHJpbmdbXSA9IFtdLCBhdXRvU2Nyb2xsOmJvb2xlYW4sIGltcGw6YW55KSA9PlxyXG4gICAgICAgIC8ve1xyXG4gICAgICAgIC8vICAgIGlmIChwYW5uaW5nKVxyXG4gICAgICAgIC8vICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAgICByZXR1cm4gaW1wbChjZWxscywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgLy99KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IERlZmF1bHRIaXN0b3J5TWFuYWdlciwgSGlzdG9yeUFjdGlvbiwgSGlzdG9yeU1hbmFnZXIgfSBmcm9tICcuL0hpc3RvcnlNYW5hZ2VyJztcclxuaW1wb3J0IHsgemlwUGFpcnMgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCdcclxuXHJcblxyXG5pbnRlcmZhY2UgQ2VsbEVkaXRTbmFwc2hvdFxyXG57XHJcbiAgICByZWY6c3RyaW5nO1xyXG4gICAgbmV3VmFsOnN0cmluZztcclxuICAgIG9sZFZhbDpzdHJpbmc7XHJcbiAgICBjYXNjYWRlZD86Ym9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEhpc3RvcnlFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbWFuYWdlcjpIaXN0b3J5TWFuYWdlcjtcclxuXHJcbiAgICBwcml2YXRlIG5vQ2FwdHVyZTpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIHN1c3BlbmRlZDpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGNhcHR1cmU6T2JqZWN0TWFwPHN0cmluZz47XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuYWdlcj86SGlzdG9yeU1hbmFnZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlciB8fCBuZXcgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKGdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfWicsICgpID0+IHRoaXMudW5kbygpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0tFWV9ZJywgKCkgPT4gdGhpcy5yZWRvKCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6Y29tbWl0JywgdGhpcy5iZWZvcmVDb21taXQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYWZ0ZXI6Y29tbWl0JywgdGhpcy5hZnRlckNvbW1pdC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHVuZG8oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnVuZG8oKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHJlZG8oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnJlZG8oKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHB1c2goYWN0aW9uOkhpc3RvcnlBY3Rpb24pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIucHVzaChhY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKCdjbGVhckhpc3RvcnknKVxyXG4gICAgcHJpdmF0ZSBjbGVhcigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgnc3VzcGVuZEhpc3RvcnknKVxyXG4gICAgcHJpdmF0ZSBzdXNwZW5kKGZsYWc6Ym9vbGVhbiA9IHRydWUpOnZvaWQgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zdXNwZW5kZWQgPSBmbGFnO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVmb3JlQ29tbWl0KGNoYW5nZXM6R3JpZENoYW5nZVNldCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm5vQ2FwdHVyZSB8fCB0aGlzLnN1c3BlbmRlZClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmdyaWQubW9kZWw7XHJcblxyXG4gICAgICAgIHRoaXMuY2FwdHVyZSA9IHppcFBhaXJzKFxyXG4gICAgICAgICAgICBjaGFuZ2VzLnJlZnMoKS5tYXAociA9PiBbciwgbW9kZWwuZmluZENlbGwocikudmFsdWVdKSBcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWZ0ZXJDb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMubm9DYXB0dXJlIHx8ICF0aGlzLmNhcHR1cmUgfHwgdGhpcy5zdXNwZW5kZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHNuYXBzaG90cyA9IHRoaXMuY3JlYXRlU25hcHNob3RzKHRoaXMuY2FwdHVyZSwgY2hhbmdlcyk7XHJcbiAgICAgICAgaWYgKHNuYXBzaG90cy5sZW5ndGgpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMuY3JlYXRlRWRpdEFjdGlvbihzbmFwc2hvdHMpO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2goYWN0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jYXB0dXJlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVNuYXBzaG90cyhjYXB0dXJlOk9iamVjdE1hcDxzdHJpbmc+LCBjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOkNlbGxFZGl0U25hcHNob3RbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCBtb2RlbCA9IHRoaXMuZ3JpZC5tb2RlbDtcclxuICAgICAgICBsZXQgYmF0Y2ggPSBbXSBhcyBDZWxsRWRpdFNuYXBzaG90W107XHJcblxyXG4gICAgICAgIGxldCBjb21waWxlZCA9IGNoYW5nZXMuY29tcGlsZShtb2RlbCk7XHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgY29tcGlsZWQuZmlsdGVyKHggPT4gIXguY2FzY2FkZWQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYmF0Y2gucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByZWY6IGVudHJ5LmNlbGwucmVmLFxyXG4gICAgICAgICAgICAgICAgbmV3VmFsOiBlbnRyeS52YWx1ZSxcclxuICAgICAgICAgICAgICAgIG9sZFZhbDogY2FwdHVyZVtlbnRyeS5jZWxsLnJlZl0sXHJcbiAgICAgICAgICAgICAgICBjYXNjYWRlZDogZW50cnkuY2FzY2FkZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGJhdGNoO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWRpdEFjdGlvbihzbmFwc2hvdHM6Q2VsbEVkaXRTbmFwc2hvdFtdKTpIaXN0b3J5QWN0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYXBwbHk6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2lsZW50Q29tbWl0KGNyZWF0ZV9jaGFuZ2VzKHNuYXBzaG90cywgeCA9PiB4Lm5ld1ZhbCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByb2xsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaWxlbnRDb21taXQoY3JlYXRlX2NoYW5nZXMoc25hcHNob3RzLCB4ID0+IHgub2xkVmFsKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGludm9rZVNpbGVudENvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB0cnlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubm9DYXB0dXJlID0gdHJ1ZTtcclxuICAgICAgICAgICAgZ3JpZC5leGVjKCdjb21taXQnLCBjaGFuZ2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjb21waWxlZCA9IGNoYW5nZXMuY29tcGlsZShncmlkLm1vZGVsKTtcclxuICAgICAgICBsZXQgcmVmcyA9IGNvbXBpbGVkLmZpbHRlcih4ID0+ICF4LmNhc2NhZGVkKS5tYXAoeCA9PiB4LmNlbGwucmVmKTtcclxuICAgICAgICBncmlkLmV4ZWMoJ3NlbGVjdCcsIHJlZnMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVfY2hhbmdlcyhzbmFwc2hvdHM6Q2VsbEVkaXRTbmFwc2hvdFtdLCB2YWxTZWxlY3RvcjooczpDZWxsRWRpdFNuYXBzaG90KSA9PiBzdHJpbmcpOkdyaWRDaGFuZ2VTZXQgXHJcbntcclxuICAgIGxldCBjaGFuZ2VTZXQgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgZm9yIChsZXQgcyBvZiBzbmFwc2hvdHMpXHJcbiAgICB7XHJcbiAgICAgICAgY2hhbmdlU2V0LnB1dChzLnJlZiwgdmFsU2VsZWN0b3IocyksIHMuY2FzY2FkZWQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoYW5nZVNldDtcclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBIaXN0b3J5QWN0aW9uXHJcbntcclxuICAgIGFwcGx5KCk6dm9pZDtcclxuXHJcbiAgICByb2xsYmFjaygpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSGlzdG9yeU1hbmFnZXJcclxue1xyXG4gICAgcmVhZG9ubHkgZnV0dXJlQ291bnQ6bnVtYmVyO1xyXG5cclxuICAgIHJlYWRvbmx5IHBhc3RDb3VudDpudW1iZXI7XHJcblxyXG4gICAgY2xlYXIoKTp2b2lkO1xyXG5cclxuICAgIHB1c2goYWN0aW9uOkhpc3RvcnlBY3Rpb24pOnZvaWQ7XHJcblxyXG4gICAgcmVkbygpOmJvb2xlYW47XHJcblxyXG4gICAgdW5kbygpOmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIgaW1wbGVtZW50cyBIaXN0b3J5TWFuYWdlclxyXG57XHJcbiAgICBwcml2YXRlIGZ1dHVyZTpIaXN0b3J5QWN0aW9uW10gPSBbXTtcclxuICAgIHByaXZhdGUgcGFzdDpIaXN0b3J5QWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGZ1dHVyZUNvdW50KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZnV0dXJlLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHBhc3RDb3VudCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhc3QubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhc3QgPSBbXTtcclxuICAgICAgICB0aGlzLmZ1dHVyZSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXN0LnB1c2goYWN0aW9uKTtcclxuICAgICAgICB0aGlzLmZ1dHVyZSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWRvKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5mdXR1cmUubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMuZnV0dXJlLnBvcCgpO1xyXG4gICAgICAgIGFjdGlvbi5hcHBseSgpO1xyXG4gICAgICAgIHRoaXMucGFzdC5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVuZG8oKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnBhc3QubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMucGFzdC5wb3AoKTtcclxuICAgICAgICBhY3Rpb24ucm9sbGJhY2soKTtcclxuICAgICAgICB0aGlzLmZ1dHVyZS5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnRMaWtlIFxyXG57XHJcbiAgICB4Om51bWJlcjtcclxuICAgIHk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBCcm93c2VyUG9pbnQgPSB7IGxlZnQ6bnVtYmVyOyB0b3A6bnVtYmVyOyB9O1xyXG5leHBvcnQgdHlwZSBQb2ludElucHV0ID0gbnVtYmVyW118UG9pbnR8UG9pbnRMaWtlfEJyb3dzZXJQb2ludDtcclxuXHJcbmV4cG9ydCBjbGFzcyBQb2ludCBpbXBsZW1lbnRzIFBvaW50TGlrZVxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgeDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHk6bnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJhZDJkZWc6bnVtYmVyID0gMzYwIC8gKE1hdGguUEkgKiAyKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgZGVnMnJhZDpudW1iZXIgPSAoTWF0aC5QSSAqIDIpIC8gMzYwO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkgPSBuZXcgUG9pbnQoMCwgMCk7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1heCA9IG5ldyBQb2ludCgyMTQ3NDgzNjQ3LCAyMTQ3NDgzNjQ3KTtcclxuICAgIHB1YmxpYyBzdGF0aWMgbWluID0gbmV3IFBvaW50KC0yMTQ3NDgzNjQ3LCAtMjE0NzQ4MzY0Nyk7XHJcbiAgICBwdWJsaWMgc3RhdGljIHVwID0gbmV3IFBvaW50KDAsIC0xKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGF2ZXJhZ2UocG9pbnRzOlBvaW50TGlrZVtdKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGlmICghcG9pbnRzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBQb2ludC5lbXB0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB4ID0gMCwgeSA9IDA7XHJcblxyXG4gICAgICAgIHBvaW50cy5mb3JFYWNoKHAgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gcC54O1xyXG4gICAgICAgICAgICB5ICs9IHAueTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh4IC8gcG9pbnRzLmxlbmd0aCwgeSAvIHBvaW50cy5sZW5ndGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZGlyZWN0aW9uKGZyb206UG9pbnRJbnB1dCwgdG86UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcHRBcmcodG8pLnN1YnRyYWN0KGZyb20pLm5vcm1hbGl6ZSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShzb3VyY2U6UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcHRBcmcoc291cmNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21CdWZmZXIoYnVmZmVyOm51bWJlcltdLCBpbmRleDpudW1iZXIgPSAwKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoYnVmZmVyW2luZGV4XSwgYnVmZmVyW2luZGV4ICsgMV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHg6bnVtYmVyfG51bWJlcltdLCB5PzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnggPSAoeFswXSk7XHJcbiAgICAgICAgICAgIHRoaXMueSA9ICh4WzFdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKDxudW1iZXI+eCk7XHJcbiAgICAgICAgICAgIHRoaXMueSA9ICh5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9yZWdpb24gR2VvbWV0cnlcclxuXHJcbiAgICBwdWJsaWMgYW5nbGUoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMueCA8IDApXHJcbiAgICAgICAgICAgID8gMzYwIC0gTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZyAqIC0xXHJcbiAgICAgICAgICAgIDogTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYW5nbGVBYm91dCh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMihwdC5jcm9zcyh0aGlzKSwgcHQuZG90KHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3Jvc3ModmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHB0LnkgLSB0aGlzLnkgKiBwdC54O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXN0YW5jZSh0bzpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh0byk7XHJcbiAgICAgICAgbGV0IGEgPSB0aGlzLnggLSBwdC54O1xyXG4gICAgICAgIGxldCBiID0gdGhpcy55IC0gcHQueTtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb3QodmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHB0LnggKyB0aGlzLnkgKiBwdC55O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsZW5ndGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxlbiA9IHRoaXMubGVuZ3RoKCk7XHJcbiAgICAgICAgaWYgKGxlbiA+IDAuMDAwMDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxIC8gbGVuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBlcnAoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy55ICogLTEsIHRoaXMueCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJwZXJwKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkucGVycCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnZlcnNlKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJldmVyc2UoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogLTEsIHRoaXMueSAqIC0xKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcm90YXRlKHJhZGlhbnM6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKTtcclxuICAgICAgICBsZXQgc2luID0gTWF0aC5zaW4ocmFkaWFucyk7XHJcbiAgICAgICAgbGV0IG54ID0gdGhpcy54ICogY29zIC0gdGhpcy55ICogc2luO1xyXG4gICAgICAgIGxldCBueSA9IHRoaXMueSAqIGNvcyArIHRoaXMueCAqIHNpbjtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChueCwgbnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZW5kcmVnaW9uXHJcblxyXG4gICAgLy9yZWdpb24gQXJpdGhtZXRpY1xyXG5cclxuICAgIHB1YmxpYyBhZGQodmFsOm51bWJlcnxQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgaWYgKCFwdCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnYWRkOiBwdCByZXF1aXJlZC4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKyBwdC54LCB0aGlzLnkgKyBwdC55KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGl2aWRlKGRpdmlzb3I6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54IC8gZGl2aXNvciwgdGhpcy55IC8gZGl2aXNvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG11bHRpcGx5KG11bHRpcGxlcjpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiBtdWx0aXBsZXIsIHRoaXMueSAqIG11bHRpcGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJvdW5kKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KE1hdGgucm91bmQodGhpcy54KSwgTWF0aC5yb3VuZCh0aGlzLnkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3VidHJhY3QodmFsOm51bWJlcnxQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgaWYgKCFwdCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnc3VidHJhY3Q6IHB0IHJlcXVpcmVkLic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5hZGQocHQucmV2ZXJzZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIENvbnZlcnNpb25cclxuXHJcbiAgICBwdWJsaWMgY2xvbmUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjpQb2ludExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBhbm90aGVyLnggJiYgdGhpcy55ID09PSBhbm90aGVyLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvQXJyYXkoKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy54fSwgJHt0aGlzLnl9XWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxufVxyXG5cclxuZnVuY3Rpb24gcHRBcmcodmFsOmFueSk6UG9pbnRcclxue1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCB8fCB2YWwgIT09IHVuZGVmaW5lZClcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gPFBvaW50PnZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLngsIHZhbC55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC5sZWZ0ICE9PSB1bmRlZmluZWQgJiYgdmFsLnRvcCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwubGVmdCwgdmFsLnRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KDxudW1iZXJbXT52YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnbnVtYmVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbn0iLCJpbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi9Qb2ludCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0TGlrZVxyXG57XHJcbiAgICBsZWZ0Om51bWJlcjtcclxuICAgIHRvcDpudW1iZXI7XHJcbiAgICB3aWR0aDpudW1iZXI7XHJcbiAgICBoZWlnaHQ6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5OlJlY3QgPSBuZXcgUmVjdCgwLCAwLCAwLCAwKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21FZGdlcyhsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgcmlnaHQ6bnVtYmVyLCBib3R0b206bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgbGVmdCxcclxuICAgICAgICAgICAgdG9wLFxyXG4gICAgICAgICAgICByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgICAgIGJvdHRvbSAtIHRvcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTGlrZShsaWtlOlJlY3RMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21NYW55KHJlY3RzOlJlY3RbXSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlY3RzLm1hcCh4ID0+IHgucG9pbnRzKCkpKTtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tUG9pbnRzKC4uLnBvaW50czpQb2ludFtdKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21Qb2ludEJ1ZmZlcihwb2ludHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50QnVmZmVyKHBvaW50czpQb2ludFtdLCBpbmRleD86bnVtYmVyLCBsZW5ndGg/Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5zbGljZShpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsZW5ndGggIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5zbGljZSgwLCBsZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbUVkZ2VzKFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC54KSksXHJcbiAgICAgICAgICAgIE1hdGgubWluKC4uLnBvaW50cy5tYXAocCA9PiBwLnkpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1heCguLi5wb2ludHMubWFwKHAgPT4gcC55KSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBsZWZ0Om51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdG9wOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyID0gMDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgd2lkdGg6bnVtYmVyLCBoZWlnaHQ6bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgdGhpcy50b3AgPSB0b3A7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgcmlnaHQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlZnQgKyB0aGlzLndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYm90dG9tKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2VudGVyKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMubGVmdCArICh0aGlzLndpZHRoIC8gMiksIHRoaXMudG9wICsgKHRoaXMuaGVpZ2h0IC8gMikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b3BMZWZ0KCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy50b3ApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwb2ludHMoKTpQb2ludFtdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy50b3ApLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5yaWdodCwgdGhpcy50b3ApLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5yaWdodCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5sZWZ0LCB0aGlzLmJvdHRvbSksXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2l6ZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9mZnNldChwdDpQb2ludExpa2UpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCArIHB0LngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgcHQueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb250YWlucyhpbnB1dDpQb2ludHxSZWN0TGlrZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmIChpbnB1dFsneCddICE9PSB1bmRlZmluZWQgJiYgaW5wdXRbJ3knXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHB0ID0gPFBvaW50PmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHB0LnggPj0gdGhpcy5sZWZ0XHJcbiAgICAgICAgICAgICAgICAmJiBwdC55ID49IHRoaXMudG9wXHJcbiAgICAgICAgICAgICAgICAmJiBwdC54IDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmVjdCA9IDxSZWN0TGlrZT5pbnB1dDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgPj0gdGhpcy5sZWZ0ICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCA+PSB0aGlzLnRvcCAmJlxyXG4gICAgICAgICAgICAgICAgcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA8PSB0aGlzLmxlZnQgKyB0aGlzLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IDw9IHRoaXMudG9wICsgdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluZmxhdGUoc2l6ZTpQb2ludExpa2UpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCAtIHNpemUueCxcclxuICAgICAgICAgICAgdGhpcy50b3AgLSBzaXplLnksXHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggKyBzaXplLngsXHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ICsgc2l6ZS55XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW50ZXJzZWN0cyhyZWN0OlJlY3RMaWtlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHJlY3QubGVmdCArIHJlY3Qud2lkdGggPiB0aGlzLmxlZnRcclxuICAgICAgICAgICAgJiYgcmVjdC50b3AgKyByZWN0LmhlaWdodCA+IHRoaXMudG9wXHJcbiAgICAgICAgICAgICYmIHJlY3QubGVmdCA8IHRoaXMubGVmdCArIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgJiYgcmVjdC50b3AgPCB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBub3JtYWxpemUoKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud2lkdGggPj0gMCAmJiB0aGlzLmhlaWdodCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgeCA9IHRoaXMubGVmdDtcclxuICAgICAgICB2YXIgeSA9IHRoaXMudG9wO1xyXG4gICAgICAgIHZhciB3ID0gdGhpcy53aWR0aDtcclxuICAgICAgICB2YXIgaCA9IHRoaXMuaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAodyA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB4ICs9IHc7XHJcbiAgICAgICAgICAgIHcgPSBNYXRoLmFicyh3KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGggPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeSArPSBoO1xyXG4gICAgICAgICAgICBoID0gTWF0aC5hYnMoaCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKCk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGBbJHt0aGlzLmxlZnR9LCAke3RoaXMudG9wfSwgJHt0aGlzLndpZHRofSwgJHt0aGlzLmhlaWdodH1dYDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEV2ZW50RW1pdHRlciwgRXZlbnRDYWxsYmFjaywgRXZlbnRTdWJzY3JpcHRpb24gfSBmcm9tICcuLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciBpbXBsZW1lbnRzIEV2ZW50RW1pdHRlclxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHdyYXAodGFyZ2V0OkV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlcik6RXZlbnRFbWl0dGVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCEhdGFyZ2V0WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+dGFyZ2V0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiA8RXZlbnRFbWl0dGVyPnRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhcmdldDpFdmVudFRhcmdldClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjYW5jZWw6ICgpID0+IHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjayksXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW1pdChldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnRhcmdldC5kaXNwYXRjaEV2ZW50KFxyXG4gICAgICAgICAgICBfLmV4dGVuZChuZXcgRXZlbnQoZXZlbnQpLCB7IGFyZ3M6IGFyZ3MgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgS2V5cyB9IGZyb20gJy4vS2V5cyc7XHJcblxyXG5cclxubGV0IFRyYWNrZXI6T2JqZWN0SW5kZXg8Ym9vbGVhbj47XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5Q2hlY2tcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBpbml0KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghVHJhY2tlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFRyYWNrZXIgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IEtleWJvYXJkRXZlbnQpID0+IFRyYWNrZXJbZS5rZXlDb2RlXSA9IHRydWUpO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRvd24oa2V5Om51bWJlcik6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIVRyYWNrZXIgJiYgISFUcmFja2VyW2tleV07XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5RXhwcmVzc2lvblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZyk6S2V5RXhwcmVzc2lvblxyXG4gICAge1xyXG4gICAgICAgIGxldCBleGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChleGNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBrZXlzID0gaW5wdXRcclxuICAgICAgICAgICAgLnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gS2V5cy5wYXJzZSh4KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgS2V5RXhwcmVzc2lvbihrZXlzLCBleGNsdXNpdmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBjdHJsOmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYWx0OmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2hpZnQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBrZXk6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3Ioa2V5czpudW1iZXJbXSwgZXhjbHVzaXZlOmJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5leGNsdXNpdmUgPSBleGNsdXNpdmU7XHJcblxyXG4gICAgICAgIHRoaXMuY3RybCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQ1RSTCk7XHJcbiAgICAgICAgdGhpcy5hbHQgPSBrZXlzLnNvbWUoeCA9PiB4ID09PSBLZXlzLkFMVCk7XHJcbiAgICAgICAgdGhpcy5zaGlmdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuU0hJRlQpO1xyXG4gICAgICAgIHRoaXMua2V5ID0ga2V5cy5maWx0ZXIoeCA9PiB4ICE9PSBLZXlzLkNUUkwgJiYgeCAhPT0gS2V5cy5BTFQgJiYgeCAhPT0gS2V5cy5TSElGVClbMF0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlcyhrZXlEYXRhOktleUV4cHJlc3Npb258S2V5Ym9hcmRFdmVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5RXhwcmVzc2lvbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5Ym9hcmRFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsS2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleUNvZGVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdLZXlFeHByZXNzaW9uLm1hdGNoZXM6IEludmFsaWQgaW5wdXQnO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJCYXNlLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgfSBmcm9tICcuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcic7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgS2V5TWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXlNYXBDYWxsYmFja1xyXG57XHJcbiAgICAoZT86S2V5Ym9hcmRFdmVudCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEtleUlucHV0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZm9yKC4uLmVsbXRzOktleU1hcHBhYmxlW10pOktleUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcnM6c3RyaW5nfHN0cmluZ1tdLCBjYWxsYmFjazpLZXlNYXBDYWxsYmFjayk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhwcnMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oWzxzdHJpbmc+ZXhwcnNdLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCByZSBvZiBleHBycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzcyA9IHRoaXMuZW1pdHRlcnMubWFwKGVlID0+IHRoaXMuY3JlYXRlTGlzdGVuZXIoXHJcbiAgICAgICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgICAgIEtleUV4cHJlc3Npb24ucGFyc2UocmUpLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2spKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3VicyA9IHRoaXMuc3Vicy5jb25jYXQoc3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcihlZTpFdmVudEVtaXR0ZXIsIGtlOktleUV4cHJlc3Npb24sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlZS5vbigna2V5ZG93bicsIChldnQ6S2V5Ym9hcmRFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChrZS5tYXRjaGVzKGV2dCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChrZS5leGNsdXNpdmUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplKGttczpLZXlNYXBwYWJsZVtdKTpFdmVudEVtaXR0ZXJbXVxyXG57XHJcbiAgICByZXR1cm4gPEV2ZW50RW1pdHRlcltdPmttc1xyXG4gICAgICAgIC5tYXAoeCA9PiAoISF4WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAgICAgID8gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+eClcclxuICAgICAgICAgICAgOiB4XHJcbiAgICAgICAgKTtcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEtleXNcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLU1BBQ0UgPSA4O1xyXG4gICAgcHVibGljIHN0YXRpYyBUQUIgPSA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBFTlRFUiA9IDEzO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSElGVCA9IDE2O1xyXG4gICAgcHVibGljIHN0YXRpYyBDVFJMID0gMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEFMVCA9IDE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBQQVVTRSA9IDE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBDQVBTX0xPQ0sgPSAyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVNDQVBFID0gMjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNQQUNFID0gMzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBR0VfVVAgPSAzMztcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9ET1dOID0gMzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVORCA9IDM1O1xyXG4gICAgcHVibGljIHN0YXRpYyBIT01FID0gMzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfQVJST1cgPSAzNztcclxuICAgIHB1YmxpYyBzdGF0aWMgVVBfQVJST1cgPSAzODtcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFRfQVJST1cgPSAzOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRE9XTl9BUlJPVyA9IDQwO1xyXG4gICAgcHVibGljIHN0YXRpYyBJTlNFUlQgPSA0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVMRVRFID0gNDY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8wID0gNDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8xID0gNDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8yID0gNTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8zID0gNTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV80ID0gNTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV81ID0gNTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV82ID0gNTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV83ID0gNTU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV84ID0gNTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV85ID0gNTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9BID0gNjU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9CID0gNjY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9DID0gNjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9EID0gNjg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9FID0gNjk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9GID0gNzA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9HID0gNzE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9IID0gNzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9JID0gNzM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9KID0gNzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9LID0gNzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9MID0gNzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9NID0gNzc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9OID0gNzg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9PID0gNzk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9QID0gODA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9RID0gODE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9SID0gODI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9TID0gODM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9UID0gODQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9VID0gODU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9WID0gODY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9XID0gODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9YID0gODg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9ZID0gODk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9aID0gOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfTUVUQSA9IDkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9NRVRBID0gOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTEVDVCA9IDkzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMCA9IDk2O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMSA9IDk3O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMiA9IDk4O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMyA9IDk5O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNCA9IDEwMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzUgPSAxMDE7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF82ID0gMTAyO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNyA9IDEwMztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzggPSAxMDQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF85ID0gMTA1O1xyXG4gICAgcHVibGljIHN0YXRpYyBNVUxUSVBMWSA9IDEwNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgQUREID0gMTA3O1xyXG4gICAgcHVibGljIHN0YXRpYyBTVUJUUkFDVCA9IDEwOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVDSU1BTCA9IDExMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRElWSURFID0gMTExO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMSA9IDExMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjIgPSAxMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYzID0gMTE0O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNCA9IDExNTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjUgPSAxMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY2ID0gMTE3O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNyA9IDExODtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjggPSAxMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY5ID0gMTIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTAgPSAxMjE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMSA9IDEyMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjEyID0gMTIzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1fTE9DSyA9IDE0NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0NST0xMX0xPQ0sgPSAxNDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTUlDT0xPTiA9IDE4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVFVQUxTID0gMTg3O1xyXG4gICAgcHVibGljIHN0YXRpYyBDT01NQSA9IDE4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgREFTSCA9IDE4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEVSSU9EID0gMTkwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGT1JXQVJEX1NMQVNIID0gMTkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBHUkFWRV9BQ0NFTlQgPSAxOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE9QRU5fQlJBQ0tFVCA9IDIxOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgQkFDS19TTEFTSCA9IDIyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0xPU0VfQlJBQ0tFVCA9IDIyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0lOR0xFX1FVT1RFID0gMjIyO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nLCB0aHJvd25PbkZhaWw6Ym9vbGVhbiA9IHRydWUpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHN3aXRjaCAoaW5wdXQudHJpbSgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS1NQQUNFJzogcmV0dXJuIEtleXMuQkFDS1NQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdUQUInOiByZXR1cm4gS2V5cy5UQUI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0VOVEVSJzogcmV0dXJuIEtleXMuRU5URVI7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NISUZUJzogcmV0dXJuIEtleXMuU0hJRlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NUUkwnOiByZXR1cm4gS2V5cy5DVFJMO1xyXG4gICAgICAgICAgICBjYXNlICdBTFQnOiByZXR1cm4gS2V5cy5BTFQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBVVNFJzogcmV0dXJuIEtleXMuUEFVU0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NBUFNfTE9DSyc6IHJldHVybiBLZXlzLkNBUFNfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnRVNDQVBFJzogcmV0dXJuIEtleXMuRVNDQVBFO1xyXG4gICAgICAgICAgICBjYXNlICdTUEFDRSc6IHJldHVybiBLZXlzLlNQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX1VQJzogcmV0dXJuIEtleXMuUEFHRV9VUDtcclxuICAgICAgICAgICAgY2FzZSAnUEFHRV9ET1dOJzogcmV0dXJuIEtleXMuUEFHRV9ET1dOO1xyXG4gICAgICAgICAgICBjYXNlICdFTkQnOiByZXR1cm4gS2V5cy5FTkQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0hPTUUnOiByZXR1cm4gS2V5cy5IT01FO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX0FSUk9XJzogcmV0dXJuIEtleXMuTEVGVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnVVBfQVJST1cnOiByZXR1cm4gS2V5cy5VUF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfQVJST1cnOiByZXR1cm4gS2V5cy5SSUdIVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnRE9XTl9BUlJPVyc6IHJldHVybiBLZXlzLkRPV05fQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0lOU0VSVCc6IHJldHVybiBLZXlzLklOU0VSVDtcclxuICAgICAgICAgICAgY2FzZSAnREVMRVRFJzogcmV0dXJuIEtleXMuREVMRVRFO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMCc6IHJldHVybiBLZXlzLktFWV8wO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMyc6IHJldHVybiBLZXlzLktFWV8zO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNic6IHJldHVybiBLZXlzLktFWV82O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOSc6IHJldHVybiBLZXlzLktFWV85O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQyc6IHJldHVybiBLZXlzLktFWV9DO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRic6IHJldHVybiBLZXlzLktFWV9GO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSSc6IHJldHVybiBLZXlzLktFWV9JO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTCc6IHJldHVybiBLZXlzLktFWV9MO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTyc6IHJldHVybiBLZXlzLktFWV9PO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUic6IHJldHVybiBLZXlzLktFWV9SO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVSc6IHJldHVybiBLZXlzLktFWV9VO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWCc6IHJldHVybiBLZXlzLktFWV9YO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICcwJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJzEnOiByZXR1cm4gS2V5cy5LRVlfMTtcclxuICAgICAgICAgICAgY2FzZSAnMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICczJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJzQnOiByZXR1cm4gS2V5cy5LRVlfNDtcclxuICAgICAgICAgICAgY2FzZSAnNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICc2JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJzcnOiByZXR1cm4gS2V5cy5LRVlfNztcclxuICAgICAgICAgICAgY2FzZSAnOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICc5JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0EnOiByZXR1cm4gS2V5cy5LRVlfQTtcclxuICAgICAgICAgICAgY2FzZSAnQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdDJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0QnOiByZXR1cm4gS2V5cy5LRVlfRDtcclxuICAgICAgICAgICAgY2FzZSAnRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdGJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0cnOiByZXR1cm4gS2V5cy5LRVlfRztcclxuICAgICAgICAgICAgY2FzZSAnSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdJJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0onOiByZXR1cm4gS2V5cy5LRVlfSjtcclxuICAgICAgICAgICAgY2FzZSAnSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdMJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ00nOiByZXR1cm4gS2V5cy5LRVlfTTtcclxuICAgICAgICAgICAgY2FzZSAnTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdPJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ1AnOiByZXR1cm4gS2V5cy5LRVlfUDtcclxuICAgICAgICAgICAgY2FzZSAnUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdSJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ1MnOiByZXR1cm4gS2V5cy5LRVlfUztcclxuICAgICAgICAgICAgY2FzZSAnVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdVJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1YnOiByZXR1cm4gS2V5cy5LRVlfVjtcclxuICAgICAgICAgICAgY2FzZSAnVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdYJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1knOiByZXR1cm4gS2V5cy5LRVlfWTtcclxuICAgICAgICAgICAgY2FzZSAnWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX01FVEEnOiByZXR1cm4gS2V5cy5MRUZUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1JJR0hUX01FVEEnOiByZXR1cm4gS2V5cy5SSUdIVF9NRVRBO1xyXG4gICAgICAgICAgICBjYXNlICdTRUxFQ1QnOiByZXR1cm4gS2V5cy5TRUxFQ1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8wJzogcmV0dXJuIEtleXMuTlVNUEFEXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8xJzogcmV0dXJuIEtleXMuTlVNUEFEXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8yJzogcmV0dXJuIEtleXMuTlVNUEFEXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8zJzogcmV0dXJuIEtleXMuTlVNUEFEXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF80JzogcmV0dXJuIEtleXMuTlVNUEFEXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF81JzogcmV0dXJuIEtleXMuTlVNUEFEXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF82JzogcmV0dXJuIEtleXMuTlVNUEFEXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF83JzogcmV0dXJuIEtleXMuTlVNUEFEXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF84JzogcmV0dXJuIEtleXMuTlVNUEFEXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF85JzogcmV0dXJuIEtleXMuTlVNUEFEXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ01VTFRJUExZJzogcmV0dXJuIEtleXMuTVVMVElQTFk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FERCc6IHJldHVybiBLZXlzLkFERDtcclxuICAgICAgICAgICAgY2FzZSAnU1VCVFJBQ1QnOiByZXR1cm4gS2V5cy5TVUJUUkFDVDtcclxuICAgICAgICAgICAgY2FzZSAnREVDSU1BTCc6IHJldHVybiBLZXlzLkRFQ0lNQUw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RJVklERSc6IHJldHVybiBLZXlzLkRJVklERTtcclxuICAgICAgICAgICAgY2FzZSAnRjEnOiByZXR1cm4gS2V5cy5GMTtcclxuICAgICAgICAgICAgY2FzZSAnRjInOiByZXR1cm4gS2V5cy5GMjtcclxuICAgICAgICAgICAgY2FzZSAnRjMnOiByZXR1cm4gS2V5cy5GMztcclxuICAgICAgICAgICAgY2FzZSAnRjQnOiByZXR1cm4gS2V5cy5GNDtcclxuICAgICAgICAgICAgY2FzZSAnRjUnOiByZXR1cm4gS2V5cy5GNTtcclxuICAgICAgICAgICAgY2FzZSAnRjYnOiByZXR1cm4gS2V5cy5GNjtcclxuICAgICAgICAgICAgY2FzZSAnRjcnOiByZXR1cm4gS2V5cy5GNztcclxuICAgICAgICAgICAgY2FzZSAnRjgnOiByZXR1cm4gS2V5cy5GODtcclxuICAgICAgICAgICAgY2FzZSAnRjknOiByZXR1cm4gS2V5cy5GOTtcclxuICAgICAgICAgICAgY2FzZSAnRjEwJzogcmV0dXJuIEtleXMuRjEwO1xyXG4gICAgICAgICAgICBjYXNlICdGMTEnOiByZXR1cm4gS2V5cy5GMTE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMic6IHJldHVybiBLZXlzLkYxMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNX0xPQ0snOiByZXR1cm4gS2V5cy5OVU1fTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0NST0xMX0xPQ0snOiByZXR1cm4gS2V5cy5TQ1JPTExfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0VNSUNPTE9OJzogcmV0dXJuIEtleXMuU0VNSUNPTE9OO1xyXG4gICAgICAgICAgICBjYXNlICdFUVVBTFMnOiByZXR1cm4gS2V5cy5FUVVBTFM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NPTU1BJzogcmV0dXJuIEtleXMuQ09NTUE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RBU0gnOiByZXR1cm4gS2V5cy5EQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdQRVJJT0QnOiByZXR1cm4gS2V5cy5QRVJJT0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0ZPUldBUkRfU0xBU0gnOiByZXR1cm4gS2V5cy5GT1JXQVJEX1NMQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdHUkFWRV9BQ0NFTlQnOiByZXR1cm4gS2V5cy5HUkFWRV9BQ0NFTlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ09QRU5fQlJBQ0tFVCc6IHJldHVybiBLZXlzLk9QRU5fQlJBQ0tFVDtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS19TTEFTSCc6IHJldHVybiBLZXlzLkJBQ0tfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NMT1NFX0JSQUNLRVQnOiByZXR1cm4gS2V5cy5DTE9TRV9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdTSU5HTEVfUVVPVEUnOiByZXR1cm4gS2V5cy5TSU5HTEVfUVVPVEU7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhyb3duT25GYWlsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIGtleTogJyArIGlucHV0O1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi9Nb3VzZURyYWdFdmVudCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNoZWNrKGVsbXQ6SFRNTEVsZW1lbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9PT0gJ3RydWUnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKGVsbXQ6SFRNTEVsZW1lbnQpOk1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG4gICAge1xyXG4gICAgICAgIGVsbXQuZGF0YXNldFsnTW91c2VEcmFnRXZlbnRTdXBwb3J0J10gPSAndHJ1ZSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZURyYWdFdmVudFN1cHBvcnQoZWxtdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHNob3VsZERyYWc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIGlzRHJhZ2dpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIHN0YXJ0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgbGFzdFBvaW50OlBvaW50O1xyXG4gICAgcHJvdGVjdGVkIGNhbmNlbDooKSA9PiB2b2lkO1xyXG4gICAgcHJvdGVjdGVkIGxpc3RlbmVyOmFueTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocHJvdGVjdGVkIGVsbXQ6SFRNTEVsZW1lbnQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIgPSB0aGlzLm9uVGFyZ2V0TW91c2VEb3duLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZWxtdC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmxpc3RlbmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25UYXJnZXRNb3VzZURvd24oZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgbGV0IG1vdmVIYW5kbGVyID0gdGhpcy5vbldpbmRvd01vdXNlTW92ZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGxldCB1cEhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VVcC5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbmNlbCA9ICgpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgbmV3UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zaG91bGREcmFnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdiZWdpbicsIGUpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnJywgZSwgbmV3UG9pbnQuc3VidHJhY3QodGhpcy5sYXN0UG9pbnQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3UG9pbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VVcChlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdlbmQnLCBlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmxhc3RQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNhbmNlbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRXZlbnQodHlwZTpzdHJpbmcsIHNvdXJjZTpNb3VzZUV2ZW50LCBkaXN0PzpQb2ludCk6TW91c2VEcmFnRXZlbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgZXZlbnQgPSA8TW91c2VEcmFnRXZlbnQ+KG5ldyBNb3VzZUV2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WCA9IHRoaXMuc3RhcnRQb2ludC54O1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WSA9IHRoaXMuc3RhcnRQb2ludC55O1xyXG5cclxuICAgICAgICBpZiAoZGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RYID0gZGlzdC54O1xyXG4gICAgICAgICAgICBldmVudC5kaXN0WSA9IGRpc3QueTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTW91c2VFdmVudFR5cGUgPSAnY2xpY2snfCdkYmxjbGljayd8J21vdXNlZG93bid8J21vdXNlbW92ZSd8J21vdXNldXAnfCdkcmFnYmVnaW4nfCdkcmFnJ3wnZHJhZ2VuZCdcclxuXHJcbmZ1bmN0aW9uIHBhcnNlX2V2ZW50KHZhbHVlOnN0cmluZyk6TW91c2VFdmVudFR5cGVcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgICAgIHJldHVybiA8TW91c2VFdmVudFR5cGU+KCdtb3VzZScgKyB2YWx1ZSk7XHJcbiAgICAgICAgY2FzZSAnY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2RibGNsaWNrJzpcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgY2FzZSAnZHJhZ2JlZ2luJzpcclxuICAgICAgICBjYXNlICdkcmFnJzpcclxuICAgICAgICBjYXNlICdkcmFnZW5kJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxNb3VzZUV2ZW50VHlwZT52YWx1ZTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBNb3VzZUV2ZW50VHlwZTogJyArIHZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZV9idXR0b24odmFsdWU6c3RyaW5nKTpudW1iZXJcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdwcmltYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24xJzpcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgY2FzZSAnc2Vjb25kYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24yJzpcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMyc6XHJcbiAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlQnV0dG9uOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpdmlkZV9leHByZXNzaW9uKHZhbHVlOnN0cmluZyk6c3RyaW5nW11cclxue1xyXG4gICAgbGV0IHBhcnRzID0gdmFsdWUuc3BsaXQoJzonKTtcclxuXHJcbiAgICBpZiAocGFydHMubGVuZ3RoID09IDEpXHJcbiAgICB7XHJcbiAgICAgICAgcGFydHMuc3BsaWNlKDAsIDAsICdkb3duJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnRzLnNsaWNlKDAsIDIpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpNb3VzZUV4cHJlc3Npb25cclxuICAgIHtcclxuICAgICAgICBsZXQgY2ZnID0gPGFueT57XHJcbiAgICAgICAgICAgIGtleXM6IFtdLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNmZy5leGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChjZmcuZXhjbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHIoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgW2xlZnQsIHJpZ2h0XSA9IGRpdmlkZV9leHByZXNzaW9uKGlucHV0KTtcclxuXHJcbiAgICAgICAgY2ZnLmV2ZW50ID0gcGFyc2VfZXZlbnQobGVmdCk7XHJcblxyXG4gICAgICAgIHJpZ2h0LnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBLZXlzLnBhcnNlKHgsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5idXR0b24gPSBwYXJzZV9idXR0b24oeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRXhwcmVzc2lvbihjZmcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBldmVudDpNb3VzZUV2ZW50VHlwZSA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnV0dG9uOm51bWJlciA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5czpudW1iZXJbXSA9IFtdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihjZmc6YW55KVxyXG4gICAge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIGNmZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hdGNoZXMobW91c2VEYXRhOk1vdXNlRXZlbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ldmVudCAhPT0gbW91c2VEYXRhLnR5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYnV0dG9uICE9PSBudWxsICYmIHRoaXMuYnV0dG9uICE9PSBtb3VzZURhdGEuYnV0dG9uKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGsgb2YgdGhpcy5rZXlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFLZXlDaGVjay5kb3duKGspKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuaW1wb3J0IHsgTW91c2VFeHByZXNzaW9uIH0gZnJvbSAnLi9Nb3VzZUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50U3VwcG9ydCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNb3VzZUNhbGxiYWNrXHJcbntcclxuICAgIChlOkV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VJbnB1dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGZvciguLi5lbG10czpNYXBwYWJsZVtdKTpNb3VzZUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgS2V5Q2hlY2suaW5pdCgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcjpzdHJpbmcsIGNhbGxiYWNrOk1vdXNlQ2FsbGJhY2spOk1vdXNlSW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgc3MgPSB0aGlzLmVtaXR0ZXJzLm1hcChlZSA9PiB0aGlzLmNyZWF0ZUxpc3RlbmVyKFxyXG4gICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgTW91c2VFeHByZXNzaW9uLnBhcnNlKGV4cHIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICB0aGlzLnN1YnMgPSB0aGlzLnN1YnMuY29uY2F0KHNzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcih0YXJnZXQ6RXZlbnRFbWl0dGVyLCBleHByOk1vdXNlRXhwcmVzc2lvbiwgY2FsbGJhY2s6TW91c2VDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0Lm9uKGV4cHIuZXZlbnQsIChldnQ6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChleHByLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4cHIuZXhjbHVzaXZlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZShrbXM6TWFwcGFibGVbXSk6RXZlbnRFbWl0dGVyW11cclxue1xyXG4gICAgcmV0dXJuIDxFdmVudEVtaXR0ZXJbXT5rbXNcclxuICAgICAgICAubWFwKHggPT4gKCEheFsnYWRkRXZlbnRMaXN0ZW5lciddKVxyXG4gICAgICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoPEV2ZW50VGFyZ2V0PngpXHJcbiAgICAgICAgICAgIDogeFxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbiIsImltcG9ydCAqIGFzIGJhc2VzIGZyb20gJ2Jhc2VzJztcclxuXHJcblxyXG5jb25zdCBBbHBoYTI2ID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlMjZcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBudW0obnVtOm51bWJlcik6QmFzZTI2IFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmFzZTI2KG51bSwgYmFzZXMudG9BbHBoYWJldChudW0sIEFscGhhMjYpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHN0cihzdHI6c3RyaW5nKTpCYXNlMjYgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCYXNlMjYoYmFzZXMuZnJvbUFscGhhYmV0KHN0ci50b1VwcGVyQ2FzZSgpLCBBbHBoYTI2KSwgc3RyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbnVtOm51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzdHI6c3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IobnVtOm51bWJlciwgc3RyOnN0cmluZykgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5udW0gPSBudW07XHJcbiAgICAgICAgdGhpcy5zdHIgPSBzdHI7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShodG1sOnN0cmluZyk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgbGV0IGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICBsZXQgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcclxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoYm9keSk7XHJcbiAgICBib2R5LmlubmVySFRNTCA9IGh0bWw7XHJcblxyXG4gICAgcmV0dXJuIDxIVE1MRWxlbWVudD5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3NzKGU6SFRNTEVsZW1lbnQsIHN0eWxlczpPYmplY3RNYXA8c3RyaW5nPik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpXHJcbiAgICB7XHJcbiAgICAgICAgZS5zdHlsZVtwcm9wXSA9IHN0eWxlc1twcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpdChlOkhUTUxFbGVtZW50LCB0YXJnZXQ6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwge1xyXG4gICAgICAgIHdpZHRoOiB0YXJnZXQuY2xpZW50V2lkdGggKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCcsXHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhpZGUoZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdub25lJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3coZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdibG9jaycgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGUoZTpIVE1MRWxlbWVudCwgdmlzaWJsZTpib29sZWFuKTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gdmlzaWJsZSA/IHNob3coZSkgOiBoaWRlKGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlVHJhbnNpdGlvbihlOkhUTUxFbGVtZW50LCBwcm9wOnN0cmluZywgbWlsbGlzOm51bWJlciwgZWFzZTpzdHJpbmcgPSAnbGluZWFyJyk6dm9pZFxyXG57XHJcbiAgICBlLnN0eWxlLnRyYW5zaXRpb24gPSBgJHtwcm9wfSAke21pbGxpc31tcyAke2Vhc2V9YDtcclxuICAgIGNvbnNvbGUubG9nKGUuc3R5bGUudHJhbnNpdGlvbik7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IGUuc3R5bGUudHJhbnNpdGlvbiA9ICcnLCBtaWxsaXMpO1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBQcm9wZXJ0eUNoYW5nZWRDYWxsYmFja1xyXG57XHJcbiAgICAob2JqOmFueSwgdmFsOmFueSk6dm9pZFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkoZGVmYXVsdFZhbHVlOmFueSwgZmlsdGVyOlByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnksIHByb3BOYW1lOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBwcm9wTmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IHRoaXNbJ19fJyArIHByb3BOYW1lXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsID09PSB1bmRlZmluZWQpID8gZGVmYXVsdFZhbHVlIDogdmFsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcE5hbWVdID0gbmV3VmFsO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHRoaXMsIG5ld1ZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsIlxyXG5cclxubGV0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKTtcclxubGV0IGNvdW50ID0gMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWZHZW5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBuZXh0KHByZWZpeDpzdHJpbmcgPSAnQycpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwcmVmaXggKyBzdGFydCArICctJyArIChjb3VudCsrKTtcclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQodGFyZ2V0OmFueSwgZGF0YTphbnkpOmFueVxyXG57XHJcbiAgICBmb3IgKGxldCBrIGluIGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0W2tdID0gZGF0YVtrXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXg8VD4oYXJyOlRbXSwgaW5kZXhlcjoodG06VCkgPT4gbnVtYmVyfHN0cmluZyk6T2JqZWN0TWFwPFQ+XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCB0bSBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW2luZGV4ZXIodG0pXSA9IHRtO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuPFQ+KGFhOmFueSk6VFtdIFxyXG57XHJcbiAgICBsZXQgYSA9IFtdIGFzIGFueTtcclxuICAgIGZvciAobGV0IHRtIG9mIGFhKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0bSkpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYSA9IGEuY29uY2F0KGZsYXR0ZW4odG0pKTtcclxuICAgICAgICB9IGVsc2UgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhLnB1c2godG0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEgYXMgVFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24ga2V5czxUPihpeDpPYmplY3RJbmRleDxUPnxPYmplY3RNYXA8VD4pOnN0cmluZ1tdXHJcbntcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhpeCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWx1ZXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpUW11cclxue1xyXG4gICAgbGV0IGE6VFtdID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgayBpbiBpeClcclxuICAgIHtcclxuICAgICAgICBhLnB1c2goaXhba10pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gemlwUGFpcnMocGFpcnM6YW55W11bXSk6YW55XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCBwYWlyIG9mIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIG9ialtwYWlyWzBdXSA9IHBhaXJbMV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuemlwUGFpcnMocGFpcnM6YW55KTphbnlbXVtdXHJcbntcclxuICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBrZXkgaW4gcGFpcnMpXHJcbiAgICB7XHJcbiAgICAgICAgYXJyLnB1c2goW2tleSwgcGFpcnNba2V5XV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXg8VD4oYXJyOlRbXSwgc2VsZWN0b3I6KHQ6VCkgPT4gbnVtYmVyKTpUXHJcbntcclxuICAgIGlmIChhcnIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIGxldCB0ID0gYXJyWzBdO1xyXG5cclxuICAgIGZvciAobGV0IHggb2YgYXJyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChzZWxlY3Rvcih0KSA8IHNlbGVjdG9yKHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdCA9IHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hhZG93Q2xvbmUodGFyZ2V0OmFueSk6YW55XHJcbntcclxuICAgIGlmICh0eXBlb2YodGFyZ2V0KSA9PT0gJ29iamVjdCcpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHNjID0ge30gYXMgYW55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRhcmdldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNjW3Byb3BdID0gc2hhZG93Q2xvbmUodGFyZ2V0W3Byb3BdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzYztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59IiwiaW1wb3J0IHsgQmFzZTI2IH0gZnJvbSAnLi4vbWlzYy9CYXNlMjYnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4vR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlc2NyaWJlcyBhIHJlc29sdmVFeHByIG9mIGdyaWQgY2VsbHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZFJhbmdlXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyBHcmlkUmFuZ2Ugb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNlbGxzIHdpdGggdGhlIHNwZWNpZmllZCByZWZzIGZyb20gdGhlXHJcbiAgICAgKiBzcGVjaWZpZWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gY2VsbFJlZnNcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUobW9kZWw6R3JpZE1vZGVsLCBjZWxsUmVmczpzdHJpbmdbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IF8uaW5kZXgoY2VsbFJlZnMsIHggPT4geCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBtb2RlbC5jZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghbG9va3VwW2MucmVmXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY2VsbHMucHVzaChjKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgIGxldCB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FwdHVyZXMgYSByYW5nZSBvZiBjZWxscyBmcm9tIHRoZSBzcGVjaWZpZWQgbW9kZWwgYmFzZWQgb24gdGhlIHNwZWNpZmllZCB2ZWN0b3JzLiAgVGhlIHZlY3RvcnMgc2hvdWxkIGJlXHJcbiAgICAgKiB0d28gcG9pbnRzIGluIGdyaWQgY29vcmRpbmF0ZXMgKGUuZy4gY29sIGFuZCByb3cgcmVmZXJlbmNlcykgdGhhdCBkcmF3IGEgbG9naWNhbCBsaW5lIGFjcm9zcyB0aGUgZ3JpZC5cclxuICAgICAqIEFueSBjZWxscyBmYWxsaW5nIGludG8gdGhlIHJlY3RhbmdsZSBjcmVhdGVkIGZyb20gdGhlc2UgdHdvIHBvaW50cyB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBzZWxlY3RlZCByZXNvbHZlRXhwci5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBmcm9tXHJcbiAgICAgKiBAcGFyYW0gdG9cclxuICAgICAqIEBwYXJhbSB0b0luY2x1c2l2ZVxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNhcHR1cmUobW9kZWw6R3JpZE1vZGVsLCBmcm9tOlBvaW50LCB0bzpQb2ludCwgdG9JbmNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICAvL1RPRE86IEV4cGxhaW4gdGhpcy4uLlxyXG4gICAgICAgIGxldCB0bCA9IG5ldyBQb2ludChmcm9tLnggPCB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55IDwgdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG4gICAgICAgIGxldCBiciA9IG5ldyBQb2ludChmcm9tLnggPiB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55ID4gdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG5cclxuICAgICAgICBpZiAodG9JbmNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiciA9IGJyLmFkZCgxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaW1zID0gUmVjdC5mcm9tUG9pbnRzKHRsLCBicik7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCByID0gZGltcy50b3A7IHIgPCBkaW1zLmJvdHRvbTsgcisrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYyA9IGRpbXMubGVmdDsgYyA8IGRpbXMucmlnaHQ7IGMrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBtb2RlbC5sb2NhdGVDZWxsKGMsIHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNlbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZUludGVybmFsKG1vZGVsLCByZXN1bHRzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3RzIGEgcmFuZ2Ugb2YgY2VsbHMgdXNpbmcgYW4gRXhjZWwtbGlrZSByYW5nZSBleHByZXNzaW9uLiBGb3IgZXhhbXBsZTpcclxuICAgICAqIC0gQTEgc2VsZWN0cyBhIDF4MSByYW5nZSBvZiB0aGUgZmlyc3QgY2VsbFxyXG4gICAgICogLSBBMTpBNSBzZWxlY3RzIGEgMXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgaG9yaXpvbnRhbGx5LlxyXG4gICAgICogLSBBMTpFNSBzZWxlY3RzIGEgNXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgZXZlbmx5LlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBxdWVyeVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNlbGVjdChtb2RlbDpHcmlkTW9kZWwsIHF1ZXJ5OnN0cmluZyk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IFtmcm9tLCB0b10gPSBxdWVyeS5zcGxpdCgnOicpO1xyXG4gICAgICAgIGxldCBmcm9tQ2VsbCA9IHJlc29sdmVfZXhwcl9yZWYobW9kZWwsIGZyb20pO1xyXG5cclxuICAgICAgICBpZiAoIXRvKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY3JlYXRlSW50ZXJuYWwobW9kZWwsIFtmcm9tQ2VsbF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB0b0NlbGwgPSByZXNvbHZlX2V4cHJfcmVmKG1vZGVsLCB0byk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmcm9tQ2VsbCAmJiAhIXRvQ2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb21WZWN0b3IgPSBuZXcgUG9pbnQoZnJvbUNlbGwuY29sUmVmLCBmcm9tQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvVmVjdG9yID0gbmV3IFBvaW50KHRvQ2VsbC5jb2xSZWYsIHRvQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEdyaWRSYW5nZS5jYXB0dXJlKG1vZGVsLCBmcm9tVmVjdG9yLCB0b1ZlY3RvciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBHcmlkUmFuZ2UuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZW1wdHkgR3JpZFJhbmdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogW10sXHJcbiAgICAgICAgICAgIHR0YjogW10sXHJcbiAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMCxcclxuICAgICAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlSW50ZXJuYWwobW9kZWw6R3JpZE1vZGVsLCBjZWxsczpHcmlkQ2VsbFtdKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbGMgPSBOdW1iZXIuTUFYX1ZBTFVFLCBsciA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgbGV0IGhjID0gTnVtYmVyLk1JTl9WQUxVRSwgaHIgPSBOdW1iZXIuTUlOX1ZBTFVFO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGxjID4gYy5jb2xSZWYpIGxjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChoYyA8IGMuY29sUmVmKSBoYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAobHIgPiBjLnJvd1JlZikgbHIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgaWYgKGhyIDwgYy5yb3dSZWYpIGhyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbHRyOkdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgICAgICB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbHRyID0gdHRiID0gY2VsbHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogbHRyLFxyXG4gICAgICAgICAgICB0dGI6IHR0YixcclxuICAgICAgICAgICAgd2lkdGg6IGhjIC0gbGMsXHJcbiAgICAgICAgICAgIGhlaWdodDogaHIgLSBscixcclxuICAgICAgICAgICAgbGVuZ3RoOiAoaGMgLSBsYykgKiAoaHIgLSBsciksXHJcbiAgICAgICAgICAgIGNvdW50OiBjZWxscy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbHRyOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSB0b3AgdG8gYm90dG9tLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHRiOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaXRoIHdpZHRoIG9mIHRoZSByZXNvbHZlRXhwciBpbiBjb2x1bW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCBoZWlnaHQgb2YgdGhlIHJlc29sdmVFeHByIGluIHJvd3MuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiBjZWxscyBpbiB0aGUgcmVzb2x2ZUV4cHIgKHdpbGwgYmUgZGlmZmVyZW50IHRvIGxlbmd0aCBpZiBzb21lIGNlbGwgc2xvdHMgY29udGFpbiBubyBjZWxscykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb3VudDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbGVuZ3RoIG9mIHRoZSByZXNvbHZlRXhwciAobnVtYmVyIG9mIHJvd3MgKiBudW1iZXIgb2YgY29sdW1ucykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBsZW5ndGg6bnVtYmVyO1xyXG5cclxuICAgIHByaXZhdGUgaW5kZXg6T2JqZWN0TWFwPEdyaWRDZWxsPjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHZhbHVlczphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIG9yIG5vdCBhIGNlbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29udGFpbnMoY2VsbFJlZjpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaW5kZXgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gXy5pbmRleCh0aGlzLmx0ciwgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISF0aGlzLmluZGV4W2NlbGxSZWZdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJlZmVyZW5jZXMgZm9yIGFsbCB0aGUgY2VsbHMgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVmcygpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubHRyLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbHRyX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0dGJfc29ydChhOkdyaWRDZWxsLCBiOkdyaWRDZWxsKTpudW1iZXJcclxue1xyXG4gICAgbGV0IG4gPSAwO1xyXG5cclxuICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgaWYgKG4gPT09IDApXHJcbiAgICB7XHJcbiAgICAgICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVfZXhwcl9yZWYobW9kZWw6R3JpZE1vZGVsLCB2YWx1ZTpzdHJpbmcpOkdyaWRDZWxsXHJcbntcclxuICAgIGNvbnN0IFJlZkNvbnZlcnQgPSAvKFtBLVphLXpdKykoWzAtOV0rKS9nO1xyXG5cclxuICAgIFJlZkNvbnZlcnQubGFzdEluZGV4ID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBSZWZDb252ZXJ0LmV4ZWModmFsdWUpO1xyXG5cclxuICAgIGxldCBjb2xSZWYgPSBCYXNlMjYuc3RyKHJlc3VsdFsxXSkubnVtO1xyXG4gICAgbGV0IHJvd1JlZiA9IHBhcnNlSW50KHJlc3VsdFsyXSkgLSAxO1xyXG5cclxuICAgIHJldHVybiBtb2RlbC5sb2NhdGVDZWxsKGNvbFJlZiwgcm93UmVmKTtcclxufSIsImltcG9ydCB7IFJlZkdlbiB9IGZyb20gJy4uLy4uL21pc2MvUmVmR2VuJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgdmlzdWFsaXplLCByZW5kZXJlciB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBwYXJhbWV0ZXJzIHRoYXQgY2FuL3Nob3VsZCBiZSBwYXNzZWQgdG8gYSBuZXcgRGVmYXVsdEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgY29sUmVmOm51bWJlcjtcclxuICAgIHJvd1JlZjpudW1iZXI7XHJcbiAgICB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWY/OnN0cmluZztcclxuICAgIGNvbFNwYW4/Om51bWJlcjtcclxuICAgIHJvd1NwYW4/Om51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENlbGwuXHJcbiAqL1xyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIERlZmF1bHRHcmlkQ2VsbCBpbXBsZW1lbnRzIEdyaWRDZWxsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGwgcmVmZXJlbmNlLCBtdXN0IGJlIHVuaXF1ZSBwZXIgR3JpZE1vZGVsIGluc3RhbmNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb2x1bW4gcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSBob3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sUmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFNwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvdyByZWZlcmVuY2UgdGhhdCBkZXNjcmliZXMgdGhlIHZlcnRpY2FsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93UmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1NwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHZhbHVlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdmFsdWU6c3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDZWxsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOkRlZmF1bHRHcmlkQ2VsbFBhcmFtcylcclxuICAgIHtcclxuICAgICAgICBwYXJhbXMucmVmID0gcGFyYW1zLnJlZiB8fCBSZWZHZW4ubmV4dCgpO1xyXG4gICAgICAgIHBhcmFtcy5jb2xTcGFuID0gcGFyYW1zLmNvbFNwYW4gfHwgMTtcclxuICAgICAgICBwYXJhbXMucm93U3BhbiA9IHBhcmFtcy5yb3dTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnZhbHVlID0gKHBhcmFtcy52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHBhcmFtcy52YWx1ZSA9PT0gbnVsbCkgPyAnJyA6IHBhcmFtcy52YWx1ZTtcclxuXHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgcGFyYW1zKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGdmeC5saW5lV2lkdGggPSAxO1xyXG4gICAgbGV0IGF2ID0gZ2Z4LmxpbmVXaWR0aCAlIDIgPT0gMCA/IDAgOiAwLjU7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gJ2xpZ2h0Z3JheSc7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5mb250ID0gYDEzcHggU2Fucy1TZXJpZmA7XHJcbiAgICBnZnguZmlsbFRleHQodmlzdWFsLnZhbHVlLCAzLCAwICsgKHZpc3VhbC5oZWlnaHQgLyAyKSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENvbHVtbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENvbHVtbiBpbXBsZW1lbnRzIEdyaWRDb2x1bW5cclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogY29sdW1uIHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBjb2x1bW4uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aWR0aDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZENvbHVtbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gd2lkdGhcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgd2lkdGg6bnVtYmVyID0gMTAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRDb2x1bW4gfSBmcm9tICcuLi9HcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnXHJcbmltcG9ydCB7IERlZmF1bHRHcmlkQ2VsbCB9IGZyb20gJy4vRGVmYXVsdEdyaWRDZWxsJztcclxuXHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYSBieS10aGUtYm9vayBpbXBsZW1lbnRhdGlvbiBvZiBHcmlkTW9kZWwuICBBbGwgaW5zcGVjdGlvbiBtZXRob2RzIHVzZSBPKDEpIGltcGxlbWVudGF0aW9ucy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZE1vZGVsIGltcGxlbWVudHMgR3JpZE1vZGVsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBncmlkIG1vZGVsIHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgY29sdW1ucyBhbmQgcm93cyBwb3B1bGF0ZWQgd2l0aCBkZWZhdWx0IGNlbGxzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBjb2xzXHJcbiAgICAgKiBAcGFyYW0gcm93c1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpbShjb2xzOm51bWJlciwgcm93czpudW1iZXIpOkRlZmF1bHRHcmlkTW9kZWxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbHM7IGMrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgcm93czsgcisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjZWxscy5wdXNoKG5ldyBEZWZhdWx0R3JpZENlbGwoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbFJlZjogYyxcclxuICAgICAgICAgICAgICAgICAgICByb3dSZWY6IHIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRHcmlkTW9kZWwoY2VsbHMsIFtdLCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IGdyaWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0RlZmF1bHRHcmlkTW9kZWx9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKFtdLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY2VsbCBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjZWxsczpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY29sdW1uIGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbnM6R3JpZENvbHVtbltdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgcm93IGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZFJvd1tdO1xyXG5cclxuICAgIHByaXZhdGUgcmVmczpPYmplY3RNYXA8R3JpZENlbGw+O1xyXG4gICAgcHJpdmF0ZSBjb29yZHM6T2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkTW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGNlbGxzXHJcbiAgICAgKiBAcGFyYW0gY29sdW1uc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY2VsbHM6R3JpZENlbGxbXSwgY29sdW1uczpHcmlkQ29sdW1uW10sIHJvd3M6R3JpZFJvd1tdKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcyA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY29vcmRzID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuY29vcmRzW2MuY29sUmVmXSB8fCAodGhpcy5jb29yZHNbYy5jb2xSZWZdID0ge30pO1xyXG4gICAgICAgICAgICB4W2Mucm93UmVmXSA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCwgb3IgbnVsbCBpZiB0aGUgY2VsbCBkaWQgbm90IGV4aXN0XHJcbiAgICAgKiB3aXRoaW4gdGhlIG1vZGVsLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGwocmVmOnN0cmluZyk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZzW3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG5laWdoYm9yaW5nIGNlbGwgYXMgcGVyIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIHZlY3RvciAoZGlyZWN0aW9uKSBvYmplY3QsIG9yIG51bGwgaWYgbm8gbmVpZ2hib3IgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gdmVjdG9yXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBmaW5kQ2VsbE5laWdoYm9yKHJlZjpzdHJpbmcsIHZlY3RvcjpQb2ludCk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZmluZENlbGwocmVmKTtcclxuICAgICAgICBsZXQgY29sID0gY2VsbC5jb2xSZWYgKyB2ZWN0b3IueDtcclxuICAgICAgICBsZXQgcm93ID0gY2VsbC5yb3dSZWYgKyB2ZWN0b3IueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRlQ2VsbChjb2wsIHJvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgY29sdW1uIHJlZiBhbmQgcm93IHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCBhdCB0aGUgbG9jYXRpb24sXHJcbiAgICAgKiBvciBudWxsIGlmIG5vIGNlbGwgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gY29sUmVmXHJcbiAgICAgKiBAcGFyYW0gcm93UmVmXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBsb2NhdGVDZWxsKGNvbDpudW1iZXIsIHJvdzpudW1iZXIpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmNvb3Jkc1tjb2xdIHx8IHt9KVtyb3ddIHx8IG51bGw7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vR3JpZFJvdyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZFJvdy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZFJvdyBpbXBsZW1lbnRzIEdyaWRSb3dcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogcm93IHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkUm93LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgaGVpZ2h0Om51bWJlciA9IDIxKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FzY2FkZSgpOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6UHJvcGVydHlEZXNjcmlwdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdIHx8ICghIXRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnRba2V5XSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENhc2NhZGluZzxUPlxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OlQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50PzpULCB2YWx1ZXM/OmFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG4gICAgICAgIGlmICh2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IHR5cGUgVGV4dEFsaWdubWVudCA9ICdsZWZ0J3wnY2VudGVyJ3wncmlnaHQnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZvcm1hdHRlclxyXG57XHJcbiAgICAodmFsdWU6c3RyaW5nLCB2aXN1YWw6YW55KTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdHlsZSBleHRlbmRzIENhc2NhZGluZzxTdHlsZT5cclxue1xyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGJvcmRlckNvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZmlsbENvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZm9ybWF0dGVyOlZhbHVlRm9ybWF0dGVyO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0OlRleHRTdHlsZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRleHRTdHlsZSBleHRlbmRzIENhc2NhZGluZzxUZXh0U3R5bGU+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgRGVmYXVsdDpUZXh0U3R5bGUgPSBuZXcgVGV4dFN0eWxlKG51bGwsIHtcclxuICAgICAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgICAgICBjb2xvcjogJ2JsYWNrJyxcclxuICAgICAgICBmb250OiAnU2Vnb2UgVUknLFxyXG4gICAgICAgIHNpemU6IDEzLFxyXG4gICAgICAgIHN0eWxlOiAnbm9ybWFsJyxcclxuICAgICAgICB2YXJpYW50OiAnbm9ybWFsJyxcclxuICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGFsaWdubWVudDpUZXh0QWxpZ25tZW50O1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBjb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZvbnQ6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBzaXplOm51bWJlcjtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgc3R5bGU6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB2YXJpYW50OnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgd2VpZ2h0OnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEJhc2VTdHlsZSA9IG5ldyBTdHlsZShudWxsLCB7XHJcbiAgICBib3JkZXJDb2xvcjogJ2xpZ2h0Z3JheScsXHJcbiAgICBmaWxsQ29sb3I6ICd3aGl0ZScsXHJcbiAgICBmb3JtYXR0ZXI6IHYgPT4gdixcclxuICAgIHRleHQ6IG5ldyBUZXh0U3R5bGUobnVsbCwge1xyXG4gICAgICAgIGFsaWdubWVudDogJ2xlZnQnLFxyXG4gICAgICAgIGNvbG9yOiAnYmxhY2snLFxyXG4gICAgICAgIGZvbnQ6ICdTZWdvZSBVSScsXHJcbiAgICAgICAgc2l6ZTogMTMsXHJcbiAgICAgICAgc3R5bGU6ICdub3JtYWwnLFxyXG4gICAgICAgIHZhcmlhbnQ6ICdub3JtYWwnLFxyXG4gICAgICAgIHdlaWdodDogJ25vcm1hbCcsXHJcbiAgICB9KVxyXG59KTsiLCJpbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwsIERlZmF1bHRHcmlkQ2VsbFBhcmFtcyB9IGZyb20gJy4uL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gJy4vU3R5bGUnO1xyXG5pbXBvcnQgeyByZW5kZXJlciwgdmlzdWFsaXplIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IFN0eWxlZEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBTdHlsZWRHcmlkQ2VsbFBhcmFtcyBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFBhcmFtc1xyXG57XHJcbiAgICBwbGFjZWhvbGRlcj86c3RyaW5nO1xyXG4gICAgc3R5bGU/OlN0eWxlO1xyXG59XHJcblxyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIFN0eWxlZEdyaWRDZWxsIGV4dGVuZHMgRGVmYXVsdEdyaWRDZWxsXHJcbntcclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHN0eWxlOlN0eWxlID0gQmFzZVN0eWxlO1xyXG5cclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHBsYWNlaG9sZGVyOnN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgU3R5bGVkR3JpZENlbGwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM6U3R5bGVkR3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIocGFyYW1zKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IHBhcmFtcy5wbGFjZWhvbGRlciB8fCAnJztcclxuICAgICAgICB0aGlzLnN0eWxlID0gcGFyYW1zLnN0eWxlIHx8IEJhc2VTdHlsZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGxldCBzdHlsZSA9IHZpc3VhbC5zdHlsZSBhcyBTdHlsZTtcclxuXHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS5maWxsQ29sb3I7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gc3R5bGUuYm9yZGVyQ29sb3I7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBsZXQgdGV4dFB0ID0gbmV3IFBvaW50KDMsIHZpc3VhbC5oZWlnaHQgLyAyKSBhcyBQb2ludExpa2U7XHJcbiAgICBpZiAoc3R5bGUudGV4dC5hbGlnbm1lbnQgPT09ICdjZW50ZXInKVxyXG4gICAge1xyXG4gICAgICAgIHRleHRQdC54ID0gdmlzdWFsLndpZHRoIC8gMjtcclxuICAgIH1cclxuICAgIGlmIChzdHlsZS50ZXh0LmFsaWdubWVudCA9PT0gJ3JpZ2h0JylcclxuICAgIHtcclxuICAgICAgICB0ZXh0UHQueCA9IHZpc3VhbC53aWR0aCAtIDM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2Z4LmZvbnQgPSBgJHtzdHlsZS50ZXh0fSAke3N0eWxlLnRleHQudmFyaWFudH0gJHtzdHlsZS50ZXh0LndlaWdodH0gJHtzdHlsZS50ZXh0LnNpemV9cHggJHtzdHlsZS50ZXh0LmZvbnR9YDtcclxuICAgIGdmeC50ZXh0QWxpZ24gPSBzdHlsZS50ZXh0LmFsaWdubWVudDtcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS50ZXh0LmNvbG9yO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHN0eWxlLmZvcm1hdHRlcih2aXN1YWwudmFsdWUsIHZpc3VhbCkgfHwgdmlzdWFsLnBsYWNlaG9sZGVyLCB0ZXh0UHQueCwgdGV4dFB0LnkpO1xyXG59IiwiaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBpc0Jvb2xlYW4gfSBmcm9tICd1dGlsJztcclxuXHJcblxyXG4vKipcclxuICogRG8gbm90IHVzZSBkaXJlY3RseS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NEZWY8VD5cclxue1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gZGVmaW5pdGlvbiBmb3IgYSBjZWxsIHJlbmRlcmVyIGZ1bmN0aW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlclxyXG57XHJcbiAgICAoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kIGFzIGEgX2NvbW1hbmRfOyBhbiBleHRlcm5hbGx5IGNhbGxhYmxlIGxvZ2ljIGJsb2NrIHRoYXQgcGVyZm9ybXMgc29tZSB0YXNrLiAgQSBuYW1lXHJcbiAqIGZvciB0aGUgY29tbWFuZCBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkIGFzIHRoZSBjb21tYW5kIHdpbGwgYmVcclxuICogdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIGNvbW1hbmQgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kKG5hbWU/OnN0cmluZyk6TWV0aG9kRGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDpjb21tYW5kcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIGltcGw6IGRlc2NyaXB0b3IudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgZGVmaW5lcyB0aGUgcmVuZGVyIGZ1bmN0aW9uIGZvciBhIEdyaWRDZWxsIGltcGxlbWVudGF0aW9uLCBhbGxvd2luZyBjdXN0b20gY2VsbCB0eXBlc1xyXG4gKiB0byBjb250cm9sIHRoZWlyIGRyYXdpbmcgYmVoYXZpb3IuXHJcbiAqXHJcbiAqIEBwYXJhbSBmdW5jXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJlcihmdW5jOlJlbmRlcmVyKTpDbGFzc0RlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBmdW5jLCBjdG9yKTtcclxuICAgIH07XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9yb3V0aW5lXzsgYSBsb2dpYyBibG9jayB0aGF0IGNhbiBiZSBob29rZWQgaW50byBvciBvdmVycmlkZGVuIGJ5IG90aGVyXHJcbiAqIG1vZHVsZXMuICBBIG5hbWUgZm9yIHRoZSByb3V0aW5lIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBtZXRob2QgYmVpbmcgZXhwb3J0ZWRcclxuICogYXMgdGhlIHJvdXRpbmUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgcm91dGluZSBuYW1lXHJcbiAqIEByZXR1cm5zIGRlY29yYXRvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRpbmUobmFtZT86c3RyaW5nKTpNZXRob2REZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nLCBkZXNjcmlwdG9yOlR5cGVkUHJvcGVydHlEZXNjcmlwdG9yPEZ1bmN0aW9uPik6YW55XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvdXRpbmUgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG4gICAgICAgIGxldCB3cmFwcGVyID0gZnVuY3Rpb24gKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBrZXJuZWwgPSAodGhpc1snX19rZXJuZWwnXSB8fCB0aGlzWydrZXJuZWwnXSkgYXMgR3JpZEtlcm5lbDtcclxuICAgICAgICAgICAgcmV0dXJuIGtlcm5lbC5yb3V0aW5lcy5zaWduYWwoa2V5LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLCByb3V0aW5lLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB3cmFwcGVyIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIGZpZWxkIGFzIGEgX3ZhcmlhYmxlXzsgYSByZWFkYWJsZSBhbmQgb3B0aW9uYWxseSB3cml0YWJsZSB2YWx1ZSB0aGF0IGNhbiBiZSBjb25zdW1lZCBieVxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgdmFyaWFibGUgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIGZpZWxkIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSB2YXJpYWJsZSB3aWxsIGJlIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCB2YXJpYWJsZSBuYW1lXHJcbiAqIEByZXR1cm5zIGRlY29yYXRvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG11dGFibGU6Ym9vbGVhbik6UHJvcGVydHlEZWNvcmF0b3I7XHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShuYW1lPzpzdHJpbmcsIG11dGFibGU/OmJvb2xlYW4pO1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZTpzdHJpbmd8Ym9vbGVhbiwgbXV0YWJsZT86Ym9vbGVhbik6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgaWYgKHR5cGVvZihuYW1lKSA9PT0gJ2Jvb2xlYW4nKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB2YXJpYWJsZSh1bmRlZmluZWQsIG5hbWUgYXMgYm9vbGVhbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6dmFyaWFibGVzJztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBSZWZsZWN0LmdldE1ldGFkYXRhKG1kaywgY3Rvcik7XHJcbiAgICAgICAgaWYgKCFsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShtZGssIChsaXN0ID0gW10pLCBjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUgfHwga2V5LFxyXG4gICAgICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICAgICAgbXV0YWJsZTogbXV0YWJsZSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9sZXQgdmFsU3RvcmVLZXkgPSAhIW5hbWUgPyBrZXkgOiBgX18ke2tleX1gO1xyXG4gICAgICAgIC8vbGV0IHVzZUFsdFZhbHVlU3RvcmUgPSAhbmFtZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIG5hbWUgfHwga2V5LCB7XHJcbiAgICAgICAgLy8gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAvLyAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIC8vICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3ZhbFN0b3JlS2V5XTsgfSxcclxuICAgICAgICAvLyAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbCkgeyB0aGlzW3ZhbFN0b3JlS2V5XSA9IG5ld1ZhbDsgfVxyXG4gICAgICAgIC8vfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgZm9yIHVzZSB3aXRoaW4gaW1wbGVtZW50YXRpb25zIG9mIEdyaWRDZWxsIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBvbmUgdGhhdCBhZmZlY3RzIHRoZSB2aXN1YWxcclxuICogYXBwZWFyYW5jZSBvZiB0aGUgY2VsbC4gIFRoaXMgd2lsbCBjYXVzZSB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIHRvIGJlIG1hcHBlZCB0byB0aGUgX1Zpc3VhbF8gb2JqZWN0XHJcbiAqIGNyZWF0ZWQgYmVmb3JlIHRoZSBjZWxsIGlzIGRyYXduLlxyXG4gKlxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2aXN1YWxpemUoKTpQcm9wZXJ0eURlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOlByb3BlcnR5RGVzY3JpcHRvclxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZpc3VhbGl6ZSc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goa2V5KTtcclxuXHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOmFueVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1twa107XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsOmFueSk6dm9pZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3BrXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fZGlydHknXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJvdyc7XHJcbmltcG9ydCB7IERlZmF1bHRHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXJCYXNlIH0gZnJvbSAnLi9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IEdyaWRMYXlvdXQgfSBmcm9tICcuL2ludGVybmFsL0dyaWRMYXlvdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IHByb3BlcnR5IH0gZnJvbSAnLi4vbWlzYy9Qcm9wZXJ0eSc7XHJcbmltcG9ydCB7IHZhcmlhYmxlIH0gZnJvbSAnLi9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkRXh0ZW5kZXJcclxue1xyXG4gICAgKGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRNb3VzZUV2ZW50IGV4dGVuZHMgTW91c2VFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRNb3VzZURyYWdFdmVudCBleHRlbmRzIE1vdXNlRHJhZ0V2ZW50XHJcbntcclxuICAgIHJlYWRvbmx5IGNlbGw6R3JpZENlbGw7XHJcbiAgICByZWFkb25seSBncmlkWDpudW1iZXI7XHJcbiAgICByZWFkb25seSBncmlkWTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEtleWJvYXJkRXZlbnQgZXh0ZW5kcyBLZXlib2FyZEV2ZW50XHJcbntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkRWxlbWVudCBleHRlbmRzIEV2ZW50RW1pdHRlckJhc2Vcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUodGFyZ2V0OkhUTUxFbGVtZW50LCBpbml0aWFsTW9kZWw/OkdyaWRNb2RlbCk6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgY2FudmFzID0gdGFyZ2V0Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgY2FudmFzLmlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgIGNhbnZhcy5jbGFzc05hbWUgPSB0YXJnZXQuY2xhc3NOYW1lO1xyXG4gICAgICAgIGNhbnZhcy50YWJJbmRleCA9IHRhcmdldC50YWJJbmRleCB8fCAwO1xyXG5cclxuICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2FudmFzLCB0YXJnZXQpO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCBncmlkID0gbmV3IEdyaWRFbGVtZW50KGNhbnZhcyk7XHJcbiAgICAgICAgZ3JpZC5tb2RlbCA9IGluaXRpYWxNb2RlbCB8fCBEZWZhdWx0R3JpZE1vZGVsLmRpbSgyNiwgMTAwKTtcclxuICAgICAgICBncmlkLmJhc2goKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgQHByb3BlcnR5KERlZmF1bHRHcmlkTW9kZWwuZW1wdHkoKSwgdCA9PiB7IHQuZW1pdCgnbG9hZCcsIHQubW9kZWwpOyB0LmludmFsaWRhdGUoKTsgfSlcclxuICAgIHB1YmxpYyBtb2RlbDpHcmlkTW9kZWw7XHJcblxyXG4gICAgQHByb3BlcnR5KDAsIHQgPT4geyB0LnJlZHJhdygpOyB0LmVtaXQoJ3Njcm9sbCcpOyB9KVxyXG4gICAgcHVibGljIHNjcm9sbExlZnQ6bnVtYmVyO1xyXG5cclxuICAgIEBwcm9wZXJ0eSgwLCB0ID0+IHsgdC5yZWRyYXcoKTsgdC5lbWl0KCdzY3JvbGwnKTsgfSlcclxuICAgIHB1YmxpYyBzY3JvbGxUb3A6bnVtYmVyO1xyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSByb290OkhUTUxDYW52YXNFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBrZXJuZWw6R3JpZEtlcm5lbDtcclxuXHJcbiAgICBwcml2YXRlIGhvdENlbGw6R3JpZENlbGw7XHJcbiAgICBwcml2YXRlIGxheW91dDpHcmlkTGF5b3V0O1xyXG4gICAgcHJpdmF0ZSBkaXJ0eTpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGJ1ZmZlcnM6T2JqZWN0TWFwPEJ1ZmZlcj4gPSB7fTtcclxuICAgIHByaXZhdGUgdmlzdWFsczpPYmplY3RNYXA8VmlzdWFsPiA9IHt9O1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBjYW52YXM6SFRNTENhbnZhc0VsZW1lbnQpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb290ID0gY2FudmFzO1xyXG4gICAgICAgIGxldCBrZXJuZWwgPSB0aGlzLmtlcm5lbCA9IG5ldyBHcmlkS2VybmVsKHRoaXMuZW1pdC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgWydtb3VzZWRvd24nLCAnbW91c2Vtb3ZlJywgJ21vdXNldXAnLCAnbW91c2VlbnRlcicsICdtb3VzZWxlYXZlJywgJ2NsaWNrJywgJ2RibGNsaWNrJywgJ2RyYWdiZWdpbicsICdkcmFnJywgJ2RyYWdlbmQnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZE1vdXNlRXZlbnQoeCkpO1xyXG4gICAgICAgIFsna2V5ZG93bicsICdrZXlwcmVzcycsICdrZXl1cCddXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKHggPT4gdGhpcy5mb3J3YXJkS2V5RXZlbnQoeCkpO1xyXG5cclxuICAgICAgICB0aGlzLmVuYWJsZUVudGVyRXhpdEV2ZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgd2lkdGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb290LmNsaWVudFdpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRIZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBtb2RlbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LmNvbHVtbnMubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxIZWlnaHQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQucm93cy5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB2aXJ0dWFsV2lkdGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQud2lkdGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB2aXJ0dWFsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNjcm9sbCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnNjcm9sbExlZnQsIHRoaXMuc2Nyb2xsVG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9ufEdyaWRFeHRlbmRlcik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBpZiAodHlwZW9mKGV4dCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LmluaXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3QgPSA8YW55PnB0T3JSZWN0O1xyXG5cclxuICAgICAgICBpZiAoZGVzdC53aWR0aCA9PT0gdW5kZWZpbmVkICYmIGRlc3QuaGVpZ2h0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QoZGVzdC54LCBkZXN0LnksIDEsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRlc3QubGVmdCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbExlZnQgKz0gZGVzdC5sZWZ0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC5yaWdodCA+IHRoaXMud2lkdGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbExlZnQgKz0gZGVzdC5yaWdodCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnRvcCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCArPSBkZXN0LnRvcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QuYm90dG9tID4gdGhpcy5oZWlnaHQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCArPSBkZXN0LmJvdHRvbSAtIHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmFzaCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3Qud2lkdGggPSB0aGlzLnJvb3QucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICB0aGlzLnJvb3QuaGVpZ2h0ID0gdGhpcy5yb290LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuZW1pdCgnYmFzaCcpO1xyXG5cclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZShxdWVyeTpzdHJpbmcgPSBudWxsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0LmNvbXB1dGUodGhpcy5tb2RlbCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCEhcXVlcnkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmFuZ2UgPSBHcmlkUmFuZ2Uuc2VsZWN0KHRoaXMubW9kZWwsIHF1ZXJ5KTtcclxuICAgICAgICAgICAgZm9yIChsZXQgY2VsbCBvZiByYW5nZS5sdHIpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjZWxsWydfX2RpcnR5J107XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5idWZmZXJzW2NlbGwucmVmXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbC5jZWxscy5mb3JFYWNoKHggPT4gZGVsZXRlIHhbJ19fZGlydHknXSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB0aGlzLmVtaXQoJ2ludmFsaWRhdGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVkcmF3KGZvcmNlSW1tZWRpYXRlOmJvb2xlYW4gPSBmYWxzZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LnJlZHJhdycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZvcmNlSW1tZWRpYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5kaXJ0eSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB0aGlzLnVwZGF0ZVZpc3VhbHMoKTtcclxuICAgICAgICB0aGlzLmRyYXdWaXN1YWxzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnJlZHJhdycpO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZHJhdycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdwb3J0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChNYXRoLmZsb29yKHRoaXMuc2Nyb2xsTGVmdCksIE1hdGguZmxvb3IodGhpcy5zY3JvbGxUb3ApLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVZpc3VhbHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB7IG1vZGVsLCBsYXlvdXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IHZpc2libGVDZWxscyA9IGxheW91dC5jYXB0dXJlQ2VsbHModmlld3BvcnQpXHJcbiAgICAgICAgICAgIC5tYXAocmVmID0+IG1vZGVsLmZpbmRDZWxsKHJlZikpO1xyXG5cclxuICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy52aXN1YWxzO1xyXG4gICAgICAgIGxldCBuZXh0RnJhbWUgPSA8T2JqZWN0TWFwPFZpc3VhbD4+e307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgdmlzaWJsZUNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJlZ2lvbiA9IGxheW91dC5xdWVyeUNlbGwoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gcHJldkZyYW1lW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBoYXZlIGEgcHJldmlvdXMgdmlzdWFsIG9yIGlmIHRoZSBjZWxsIHdhcyBkaXJ0eSwgY3JlYXRlIG5ldyB2aXN1YWxcclxuICAgICAgICAgICAgaWYgKCF2aXN1YWwgfHwgY2VsbC52YWx1ZSAhPT0gdmlzdWFsLnZhbHVlIHx8IGNlbGxbJ19fZGlydHknXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZVZpc3VhbChjZWxsLCByZWdpb24pO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICAgICAgY2VsbFsnX19kaXJ0eSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGp1c3QgdXNlIHRoZSBwcmV2aW91c1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB2aXN1YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmlzdWFscyA9IG5leHRGcmFtZTtcclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3VmlzdWFscygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LmRyYXdWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IGdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogdHJ1ZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgZ2Z4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZ2Z4LnNhdmUoKTtcclxuICAgICAgICBnZngudHJhbnNsYXRlKHZpZXdwb3J0LmxlZnQgKiAtMSwgdmlld3BvcnQudG9wICogLTEpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjciBpbiB0aGlzLnZpc3VhbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMubW9kZWwuZmluZENlbGwoY3IpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gdGhpcy52aXN1YWxzW2NyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2aXN1YWwud2lkdGggPT0gMCB8fCB2aXN1YWwuaGVpZ2h0ID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXZpZXdwb3J0LmludGVyc2VjdHModmlzdWFsKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFidWZmZXIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZUJ1ZmZlcih2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gVHlwZVNjcmlwdFVucmVzb2x2ZWRGdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgY2VsbC5jb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2Z4LmRyYXdJbWFnZShidWZmZXIuY2FudmFzLCB2aXN1YWwubGVmdCAtIGJ1ZmZlci5pbmZsYXRpb24sIHZpc3VhbC50b3AgLSBidWZmZXIuaW5mbGF0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdmeC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUJ1ZmZlcih3aWR0aDpudW1iZXIsIGhlaWdodDpudW1iZXIpOkJ1ZmZlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHdpZHRoLCBoZWlnaHQsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlVmlzdWFsKGNlbGw6YW55LCByZWdpb246UmVjdExpa2UpOlZpc3VhbFxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aXN1YWwgPSBuZXcgVmlzdWFsKGNlbGwucmVmLCBjZWxsLnZhbHVlLCByZWdpb24ubGVmdCwgcmVnaW9uLnRvcCwgcmVnaW9uLndpZHRoLCByZWdpb24uaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgbGV0IHByb3BzID0gKFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmlzdWFsaXplJywgY2VsbC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpIHx8IFtdKSBhcyBzdHJpbmdbXTtcclxuICAgICAgICBmb3IgKGxldCBwIG9mIHByb3BzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHZpc3VhbFtwXSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2aXN1YWxbcF0gPSBjbG9uZShjZWxsW3BdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYElsbGVnYWwgdmlzdWFsaXplZCBwcm9wZXJ0eSBuYW1lICR7cH0gb24gdHlwZSAke2NlbGwuY29uc3RydWN0b3IubmFtZX0uYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2aXN1YWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkTW91c2VFdmVudChldmVudDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCAobmU6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChuZS5vZmZzZXRYLCBuZS5vZmZzZXRZKTtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgZ2UgPSA8YW55Pm5lO1xyXG4gICAgICAgICAgICBnZS5jZWxsID0gY2VsbCB8fCBudWxsO1xyXG4gICAgICAgICAgICBnZS5ncmlkWCA9IHB0Lng7XHJcbiAgICAgICAgICAgIGdlLmdyaWRZID0gcHQueTsgICAgICBcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudCwgZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZEtleUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCA8R3JpZEtleWJvYXJkRXZlbnQ+bmUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5hYmxlRW50ZXJFeGl0RXZlbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub24oJ21vdXNlbW92ZScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGUuY2VsbCAhPSB0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0V2dCA9IHRoaXMuY3JlYXRlR3JpZE1vdXNlRXZlbnQoJ2NlbGxleGl0JywgZSkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld0V2dC5jZWxsID0gdGhpcy5ob3RDZWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2VsbGV4aXQnLCBuZXdFdnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaG90Q2VsbCA9IGUuY2VsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3RDZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdFdnQgPSB0aGlzLmNyZWF0ZUdyaWRNb3VzZUV2ZW50KCdjZWxsZW50ZXInLCBlKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RXZ0LmNlbGwgPSB0aGlzLmhvdENlbGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjZWxsZW50ZXInLCBuZXdFdnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVHcmlkTW91c2VFdmVudCh0eXBlOnN0cmluZywgc291cmNlOkdyaWRNb3VzZUV2ZW50KTpHcmlkTW91c2VFdmVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBldmVudCA9IDxhbnk+KG5ldyBNb3VzZUV2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgICAgIGV2ZW50LmNlbGwgPSBzb3VyY2UuY2VsbDtcclxuICAgICAgICBldmVudC5ncmlkWCA9IHNvdXJjZS5ncmlkWDtcclxuICAgICAgICBldmVudC5ncmlkWSA9IHNvdXJjZS5ncmlkWTtcclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lKHg6YW55KTphbnlcclxue1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHgubWFwKGNsb25lKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXy5zaGFkb3dDbG9uZSh4KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQnVmZmVyXHJcbntcclxuICAgIHB1YmxpYyBjYW52YXM6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgd2lkdGg6bnVtYmVyLCBwdWJsaWMgaGVpZ2h0Om51bWJlciwgcHVibGljIGluZmxhdGlvbjpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICsgKGluZmxhdGlvbiAqIDIpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogZmFsc2UgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIHRoaXMuZ2Z4LnRyYW5zbGF0ZShpbmZsYXRpb24sIGluZmxhdGlvbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFZpc3VhbFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVmOnN0cmluZyxcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZTpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgbGVmdDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdG9wOm51bWJlcixcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB3aWR0aDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKGFub3RoZXI6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXNbcHJvcF0gIT09IGFub3RoZXJbcHJvcF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCdcclxuXHJcbi8vVGhpcyBrZWVwcyBXZWJTdG9ybSBxdWlldCwgZm9yIHNvbWUgcmVhc29uIGl0IGlzIGNvbXBsYWluaW5nLi4uXHJcbmRlY2xhcmUgdmFyIFJlZmxlY3Q6YW55O1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgZXhlYyhjb21tYW5kOnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkVmFyaWFibGVcclxue1xyXG4gICAgZ2V0KCk6YW55O1xyXG4gICAgc2V0Pyh2YWx1ZTphbnkpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIGRlZmluZSh2YXJpYWJsZTpzdHJpbmcsIGltcGw6R3JpZFZhcmlhYmxlKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lSG9va1xyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZU92ZXJyaWRlXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTphbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOmFueSk6dm9pZDtcclxuXHJcbiAgICBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6YW55KTphbnk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBzaWduYWwocm91dGluZTpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOmJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRzIHRoZSBjb3JlIG9mIHRoZSBHcmlkIGV4dGVuc2liaWxpdHkgc3lzdGVtLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdyaWRLZXJuZWxcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbW1hbmRzOkdyaWRDb21tYW5kSHViID0gbmV3IEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvdXRpbmVzOkdyaWRSb3V0aW5lSHViID0gbmV3IEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHZhcmlhYmxlczpHcmlkVmFyaWFibGVIdWIgPSBuZXcgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCgpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcjooZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBleHBvcnRJbnRlcmZhY2UodGFyZ2V0PzphbnkpOmFueVxyXG4gICAge1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldCB8fCB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kcyA9IHRoaXMuY29tbWFuZHNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRDb21tYW5kPjtcclxuICAgICAgICBsZXQgdmFyaWFibGVzID0gdGhpcy52YXJpYWJsZXNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRWYXJpYWJsZT47XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gY29tbWFuZHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0YXJnZXRbbl0gPSBjb21tYW5kc1tuXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gdmFyaWFibGVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbiwgdmFyaWFibGVzW25dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluc3RhbGwoZXh0OmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNvbW1hbmRzLCB2YXJpYWJsZXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChleHRbJ19fa2VybmVsJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnRXh0ZW5zaW9uIGFwcGVhcnMgdG8gaGF2ZSBhbHJlYWR5IGJlZW4gaW5zdGFsbGVkIGludG8gdGhpcyBvciBhbm90aGVyIGdyaWQuLi4/JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dFsnX19rZXJuZWwnXSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBjbWRzID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDpjb21tYW5kcycsIGV4dCkgfHwgW107XHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjbWRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29tbWFuZHMuZGVmaW5lKGMubmFtZSwgYy5pbXBsLmJpbmQoZXh0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmFycyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmFyaWFibGVzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCB2IG9mIHZhcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXJpYWJsZXMuZGVmaW5lKHYubmFtZSwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3Yua2V5XTsgfSkuYmluZChleHQpLFxyXG4gICAgICAgICAgICAgICAgc2V0OiAhIXYubXV0YWJsZSA/IChmdW5jdGlvbih2YWwpIHsgdGhpc1t2LmtleV0gPSB2YWw7IH0pLmJpbmQoZXh0KSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwgaW1wbGVtZW50cyBHcmlkQ29tbWFuZEh1YlxyXG57XHJcbiAgICBwcml2YXRlIHN0b3JlOk9iamVjdE1hcDxHcmlkQ29tbWFuZD4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCBjb21tYW5kIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVtjb21tYW5kXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdDb21tYW5kIHdpdGggbmFtZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVtjb21tYW5kXSA9IGltcGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbY29tbWFuZF07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbXBsLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIGNvbW1hbmQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBob29rczpPYmplY3RNYXA8R3JpZFJvdXRpbmVIb29rW10+ID0ge307XHJcbiAgICBwcml2YXRlIG92ZXJyaWRlczpPYmplY3RNYXA8R3JpZFJvdXRpbmVPdmVycmlkZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBob29rIHRvIHRoZSBzcGVjaWZpZWQgc2lnbmFsIHRoYXQgZW5hYmxlcyBleHRlbnNpb25zIHRvIG92ZXJyaWRlIGdyaWQgYmVoYXZpb3JcclxuICAgICAqIGRlZmluZWQgaW4gdGhlIGNvcmUgb3Igb3RoZXIgZXh0ZW5zaW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOkdyaWRSb3V0aW5lSG9vayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXSB8fCAodGhpcy5ob29rc1tyb3V0aW5lXSA9IFtdKTtcclxuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6R3JpZFJvdXRpbmVPdmVycmlkZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2lnbmFsKHJvdXRpbmU6c3RyaW5nLCBhcmdzOmFueVtdLCBpbXBsOkZ1bmN0aW9uKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKGBiZWZvcmU6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICBpZiAoISF0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChpbXBsKTtcclxuICAgICAgICAgICAgaW1wbCA9IHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcblxyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3Mocm91dGluZSwgYXJncyk7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhgYWZ0ZXI6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW52b2tlSG9va3Mocm91dGluZTpzdHJpbmcsIGFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuaG9va3Nbcm91dGluZV07XHJcblxyXG4gICAgICAgIGlmIChsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaG9vayBvZiBsaXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob29rLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIHByaXZhdGUgc3RvcmU6T2JqZWN0TWFwPEdyaWRWYXJpYWJsZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCB2YXJpYWJsZSBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVmaW5lKHZhcmlhYmxlOnN0cmluZywgaW1wbDpHcmlkVmFyaWFibGUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVt2YXJpYWJsZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVmFyaWFibGUgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVt2YXJpYWJsZV0gPSBpbXBsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCh2YXJpYWJsZTpzdHJpbmcpOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVt2YXJpYWJsZV07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1wbC5nZXQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXQodmFyaWFibGU6c3RyaW5nLCB2YWx1ZTphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGltcGwuc2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbXBsLnNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnQ2Fubm90IHNldCByZWFkb25seSB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIGJhc2UgaW50ZXJmYWNlIG9mIGEgd2lkZ2V0LiAgQSB3aWRnZXQgaXMgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIFVJIGVsZW1lbnQgd2l0aGluIHRoZSBjb250ZXh0IG9mXHJcbiAqIGEgZ3JpZC4gIEl0IGNhbiBiZSBjb21wb3NlZCBvZiBvbmUgb3IgbW9yZSBET00gZWxlbWVudHMgYW5kIGJlIGludGVyYWN0YWJsZSBvciBzdGF0aWMuICBUaGUgV2lkZ2V0IGludGVyZmFjZXNcclxuICogcHJvdmlkZXMgYSBjb21tb24gaW50ZXJmYWNlIHRocm91Z2ggd2hpY2ggbW9kdWxlcyBvciBjb25zdW1lcnMgY2FuIGFjY2VzcyB0aGUgdW5kZXJseWluZyBET00gZWxlbWVudHMgb2YgYSB3aWRnZXRcclxuICogYW5kIGJhc2ljIG1ldGhvZHMgdGhhdCBlYXNlIHRoZSBtYW5pcHVsYXRpb24gb2Ygd2lkZ2V0cy5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgV2lkZ2V0XHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvb3QgSFRNTEVsZW1lbnQgb2YgdGhlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgcm9vdDpIVE1MRWxlbWVudDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgdmlld1JlY3Q6UmVjdDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGVzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIGhpZGUoKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgc2hvdygpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgdG9nZ2xlKHZpc2libGU6Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIFdpZGdldCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBhcmUgZXhwZWN0ZWQgdG8gcmVwcmVzZW50IFdpZGdldHMgd2l0aFxyXG4gKiBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgcm9vdCBlbGVtZW50cy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBYnNXaWRnZXRCYXNlPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4gaW1wbGVtZW50cyBXaWRnZXRcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJvb3Q6VClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCB2aWV3UmVjdCgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3RcclxuICAgICAgICAoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5yb290LnN0eWxlLmxlZnQpLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMucm9vdC5zdHlsZS50b3ApLFxyXG4gICAgICAgICAgICB0aGlzLnJvb3QuY2xpZW50V2lkdGgsXHJcbiAgICAgICAgICAgIHRoaXMucm9vdC5jbGllbnRIZWlnaHRcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZXMgdGhlIFdpZGdldCB0byB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlld1JlY3RcclxuICAgICAqIEBwYXJhbSBhbmltYXRlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmIChhdXRvU2hvdylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0IC0gMX1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wIC0gMX1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aCArIDF9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3ZpZXdSZWN0LmhlaWdodCArIDF9cHhgLFxyXG4gICAgICAgICAgICBvdmVyZmxvdzogYGhpZGRlbmAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlcyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGlkZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20uaGlkZSh0aGlzLnJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNob3coKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLnNob3codGhpcy5yb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlzaWJsZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdG9nZ2xlKHZpc2libGU6Ym9vbGVhbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS50b2dnbGUodGhpcy5yb290LCB2aXNpYmxlKVxyXG4gICAgfVxyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50U3Vic2NyaXB0aW9uXHJcbntcclxuICAgIGNhbmNlbCgpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRDYWxsYmFja1xyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudEVtaXR0ZXJcclxue1xyXG4gICAgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvbjtcclxuXHJcbiAgICBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkO1xyXG5cclxuICAgIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlckJhc2Vcclxue1xyXG4gICAgcHJpdmF0ZSBidWNrZXRzOmFueSA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpLnB1c2goY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7IGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgbGV0IGlkeCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYgKCFldmVudC5tYXRjaCgnbW91c2UnKSAmJiAhZXZlbnQubWF0Y2goJ2tleScpICYmICFldmVudC5tYXRjaCgnZHJhZycpKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coZXZlbnQsIC4uLmFyZ3MpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2YgbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENhbGxiYWNrTGlzdChldmVudDpzdHJpbmcpOkV2ZW50Q2FsbGJhY2tbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldHNbZXZlbnRdIHx8ICh0aGlzLmJ1Y2tldHNbZXZlbnRdID0gW10pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRGVmYXVsdEdyaWRDb2x1bW4gfSBmcm9tICcuLi8uLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRSb3cgfSBmcm9tICcuLi8uLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRDb2x1bW4gfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBSZWN0LCBSZWN0TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG50eXBlIENlbGxDb2xSb3dMb29rdXAgPSBPYmplY3RJbmRleDxPYmplY3RJbmRleDxHcmlkQ2VsbD4+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTGF5b3V0UmVnaW9uPFQ+IGV4dGVuZHMgUmVjdExpa2Vcclxue1xyXG4gICAgcmVhZG9ubHkgcmVmOlQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkTGF5b3V0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY29tcHV0ZShtb2RlbDpHcmlkTW9kZWwpOkdyaWRMYXlvdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29sTG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRDb2x1bW4+Pm1vZGVsLmNvbHVtbnMucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCByb3dMb29rdXAgPSA8T2JqZWN0SW5kZXg8R3JpZFJvdz4+bW9kZWwucm93cy5yZWR1Y2UoKHQsIHgpID0+IHsgdFt4LnJlZl0gPSB4OyByZXR1cm4gdCB9LCB7fSk7XHJcbiAgICAgICAgbGV0IGNlbGxMb29rdXAgPSBidWlsZENlbGxMb29rdXAobW9kZWwuY2VsbHMpOyAvL2J5IGNvbCB0aGVuIHJvd1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIGFsbCBleHBlY3RlZCBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgbGV0IG1heENvbCA9IG1vZGVsLmNlbGxzLm1hcCh4ID0+IHguY29sUmVmICsgKHguY29sU3BhbiAtIDEpKS5yZWR1Y2UoKHQsIHgpID0+IHQgPiB4ID8gdCA6IHgsIDApO1xyXG4gICAgICAgIGxldCBtYXhSb3cgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJvd1JlZiArICh4LnJvd1NwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbWlzc2luZyBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Q29sOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAoY29sTG9va3VwW2ldIHx8IChjb2xMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRDb2x1bW4oaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Um93OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAocm93TG9va3VwW2ldIHx8IChyb3dMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRSb3coaSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgd2lkdGggYW5kIGhlaWdodCBvZiB3aG9sZSBncmlkXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy52YWx1ZXMoY29sTG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LndpZHRoLCAwKTtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gXy52YWx1ZXMocm93TG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LmhlaWdodCwgMCk7XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGxheW91dCByZWdpb25zIGZvciB0aGUgdmFyaW91cyBiaXRzXHJcbiAgICAgICAgbGV0IGNvbFJlZ3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10gPSBbXTtcclxuICAgICAgICBsZXQgcm93UmVnczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSA9IFtdO1xyXG4gICAgICAgIGxldCBjZWxsUmVnczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgYWNjTGVmdCA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgY2kgPSAwOyBjaSA8PSBtYXhDb2w7IGNpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY29sID0gY29sTG9va3VwW2NpXTtcclxuXHJcbiAgICAgICAgICAgIGNvbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByZWY6IGNvbC5yZWYsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGNvbC53aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhY2NUb3AgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCByaSA9IDA7IHJpIDw9IG1heFJvdzsgcmkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJvdyA9IHJvd0xvb2t1cFtyaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvd1JlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogcm93LnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByb3cuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjZWxsTG9va3VwW2NpXSAhPT0gdW5kZWZpbmVkICYmIGNlbGxMb29rdXBbY2ldW3JpXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjZWxsID0gY2VsbExvb2t1cFtjaV1bcmldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjZWxsUmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiBjZWxsLnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm93LmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhY2NUb3AgKz0gcm93LmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWNjTGVmdCArPSBjb2wud2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRMYXlvdXQod2lkdGgsIGhlaWdodCwgY29sUmVncywgcm93UmVncywgY2VsbFJlZ3MsIGNlbGxMb29rdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSB3aWR0aDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBjb2x1bW5zOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VsbHM6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W107XHJcblxyXG4gICAgcHJpdmF0ZSBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXA7XHJcbiAgICBwcml2YXRlIGNvbHVtbkluZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIHJvd0luZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIGNlbGxJbmRleDpPYmplY3RNYXA8R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+PjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHdpZHRoOm51bWJlciwgXHJcbiAgICAgICAgaGVpZ2h0Om51bWJlciwgXHJcbiAgICAgICAgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdLFxyXG4gICAgICAgIGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdLFxyXG4gICAgICAgIGNlbGxMb29rdXA6Q2VsbENvbFJvd0xvb2t1cClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuXHJcbiAgICAgICAgdGhpcy5jZWxsTG9va3VwID0gY2VsbExvb2t1cDtcclxuICAgICAgICB0aGlzLmNvbHVtbkluZGV4ID0gXy5pbmRleChjb2x1bW5zLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLnJvd0luZGV4ID0gXy5pbmRleChyb3dzLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLmNlbGxJbmRleCA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNvbHVtbihyZWY6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbkluZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlSb3cocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Q2VsbChyZWY6c3RyaW5nKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVDb2x1bW5zKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZVJvd3MocmVnaW9uOlJlY3RMaWtlKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IFJlY3QucHJvdG90eXBlLmludGVyc2VjdHMuY2FsbCh4LCByZWdpb24pKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ2VsbHMocmVnaW9uOlJlY3RMaWtlKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjb2xzID0gdGhpcy5jYXB0dXJlQ29sdW1ucyhyZWdpb24pO1xyXG4gICAgICAgIGxldCByb3dzID0gdGhpcy5jYXB0dXJlUm93cyhyZWdpb24pO1xyXG4gICAgICAgIGxldCBjZWxscyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY29scylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgb2Ygcm93cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmNlbGxMb29rdXBbY11bcl07XHJcbiAgICAgICAgICAgICAgICBpZiAoISFjZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxzLnB1c2goY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2VsbHM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQ2VsbExvb2t1cChjZWxsczpHcmlkQ2VsbFtdKTpDZWxsQ29sUm93TG9va3VwXHJcbntcclxuICAgIGxldCBpeCA9IHt9O1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjaXggPSBpeFtjLmNvbFJlZl0gfHwgKGl4W2MuY29sUmVmXSA9IHt9KTtcclxuICAgICAgICBjaXhbYy5yb3dSZWZdID0gYztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGl4O1xyXG59IiwiLyoqXHJcbiAqIEVtYmVkZGluZyBvZiBDbGlwYm9hcmQuanMgLSBodHRwczovL2dpdGh1Yi5jb20vemVub3JvY2hhL2NsaXBib2FyZC5qcy9cclxuICpcclxuICogQWZ0ZXIgdmFyaW91cyBhdHRlbXB0cywgSSB3YXMgdW5hYmxlIHRvIG5wbSBpbnN0YWxsIGluY2x1ZGluZyB0eXBlcyBlZmZlY3RpdmVseSBhbmQgYmVjYXVzZSBhbiBpbmRleC5qcyBpcyBub3RcclxuICogdXNlZCBJIGNhbm5vdCB1c2UgdGhlIFR5cGVTY3JpcHQgMi4xIHVua25vd24gbW9kdWxlIGltcG9ydCwgc28gcmVzb3J0aW5nIHRvIGxvY2FsIGVtYmVkZGVkIHZlcnNpb24uICBXaWxsIHJlbW92ZVxyXG4gKiBpbiB0aGUgZnV0dXJlIGlmIHBvc3NpYmxlLlxyXG4gKlxyXG4gKiBNb2RpZmljYXRpb25zIGhhdmUgYmVlbiBtYWRlIHRvIG1ha2UgdGhlIGNvZGUgY29tcGlsZTpcclxuICogLSBSZW1vdmVkIFByb21pc2UgcG9seWZpbGwgKGltcG9ydGVkIGluc3RlYWQpXHJcbiAqIC0gUmVzdHJ1Y3R1cmVkIGV4cG9ydCBhbmQgYWRkZWQgdHlwZWQgaW50ZXJmYWNlXHJcbiAqIC0gU29tZSBjaGFuZ2VzIHRvIHByZXZlbnQgdHlwZSBjaGVja2luZyB3aGVyZSB1bmRlc2lyZWRcclxuICovXHJcblxyXG5pbXBvcnQgeyBQcm9taXNlIH0gZnJvbSAnZXM2LXByb21pc2UnO1xyXG5cclxuLy9EZWNsYXJlIHdpbmRvdyBhcyBhbiBhbnkgdmFyIGFsaWFzIHRvIHByZXZlbnQgVFMgbW9hbmluZy4uLlxyXG5sZXQgd25kID0gd2luZG93IGFzIGFueTtcclxuXHJcbmNvbnN0IGNsaXBib2FyZCA9IHt9IGFzIGFueTtcclxuXHJcbmNsaXBib2FyZC5jb3B5ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgIHZhciBfZGF0YSA9IG51bGw7IC8vIE1hcCBmcm9tIGRhdGEgdHlwZSAoZS5nLiBcInRleHQvaHRtbFwiKSB0byB2YWx1ZS5cclxuICAgIHZhciBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xyXG4gICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICBfZGF0YSA9IG51bGw7XHJcbiAgICAgICAgaWYgKF9ib2d1c1NlbGVjdGlvbikge1xyXG4gICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjb3B5XCIsIGZ1bmN0aW9uKGU6Q2xpcGJvYXJkRXZlbnQpIHtcclxuICAgICAgICBpZiAoX2ludGVyY2VwdCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKGtleSwgX2RhdGFba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdvcmthcm91bmQgZm9yIFNhZmFyaTogaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE1NjUyOVxyXG4gICAgZnVuY3Rpb24gYm9ndXNTZWxlY3QoKSB7XHJcbiAgICAgICAgdmFyIHNlbCA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgIC8vIElmIFwibm90aGluZ1wiIGlzIHNlbGVjdGVkLi4uXHJcbiAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeUNvbW1hbmRFbmFibGVkKFwiY29weVwiKSAmJiBzZWwuaXNDb2xsYXBzZWQpIHtcclxuICAgICAgICAgICAgLy8gLi4uIHRlbXBvcmFyaWx5IHNlbGVjdCB0aGUgZW50aXJlIGJvZHkuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFdlIHNlbGVjdCB0aGUgZW50aXJlIGJvZHkgYmVjYXVzZTpcclxuICAgICAgICAgICAgLy8gLSBpdCdzIGd1YXJhbnRlZWQgdG8gZXhpc3QsXHJcbiAgICAgICAgICAgIC8vIC0gaXQgd29ya3MgKHVubGlrZSwgc2F5LCBkb2N1bWVudC5oZWFkLCBvciBwaGFudG9tIGVsZW1lbnQgdGhhdCBpc1xyXG4gICAgICAgICAgICAvLyAgIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET00pLFxyXG4gICAgICAgICAgICAvLyAtIGl0IGRvZXNuJ3Qgc2VlbSB0byBmbGlja2VyIChkdWUgdG8gdGhlIHN5bmNocm9ub3VzIGNvcHkgZXZlbnQpLCBhbmRcclxuICAgICAgICAgICAgLy8gLSBpdCBhdm9pZHMgbW9kaWZ5aW5nIHRoZSBET00gKGNhbiB0cmlnZ2VyIG11dGF0aW9uIG9ic2VydmVycykuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2Ugd2UgY2FuJ3QgZG8gcHJvcGVyIGZlYXR1cmUgZGV0ZWN0aW9uICh3ZSBhbHJlYWR5IGNoZWNrZWRcclxuICAgICAgICAgICAgLy8gZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgLCB3aGljaCBhY3R1YWxseSBnaXZlcyBhIGZhbHNlXHJcbiAgICAgICAgICAgIC8vIG5lZ2F0aXZlIGZvciBCbGluayB3aGVuIG5vdGhpbmcgaXMgc2VsZWN0ZWQpIGFuZCBVQSBzbmlmZmluZyBpcyBub3RcclxuICAgICAgICAgICAgLy8gcmVsaWFibGUgKGEgbG90IG9mIFVBIHN0cmluZ3MgY29udGFpbiBcIlNhZmFyaVwiKSwgdGhpcyB3aWxsIGFsc29cclxuICAgICAgICAgICAgLy8gaGFwcGVuIGZvciBzb21lIGJyb3dzZXJzIG90aGVyIHRoYW4gU2FmYXJpLiA6LSgpXHJcbiAgICAgICAgICAgIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XHJcbiAgICAgICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhkb2N1bWVudC5ib2R5KTtcclxuICAgICAgICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcclxuICAgICAgICAgICAgX2JvZ3VzU2VsZWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IHtcInRleHQvcGxhaW5cIjogZGF0YX07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0ge1widGV4dC9odG1sXCI6IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoZGF0YSl9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBib2d1c1NlbGVjdCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiY29weVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRvY3VtZW50LmV4ZWNDb21tYW5kIGlzIHN5bmNocm9ub3VzOiBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELWNsaXBib2FyZC1hcGlzLTIwMTUwNDIxLyNpbnRlZ3JhdGlvbi13aXRoLXJpY2gtdGV4dC1lZGl0aW5nLWFwaXNcclxuICAgICAgICAgICAgICAgICAgICAvLyBTbyB3ZSBjYW4gY2FsbCByZXNvbHZlUmVmKCkgYmFjayBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY29weS4gUGVyaGFwcyBpdCdzIG5vdCBhdmFpbGFibGUgaW4geW91ciBicm93c2VyP1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuY2xpcGJvYXJkLnBhc3RlID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgIHZhciBfcmVzb2x2ZTtcclxuICAgIHZhciBfZGF0YVR5cGU7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIGZ1bmN0aW9uKGU6Q2xpcGJvYXJkRXZlbnQpIHtcclxuICAgICAgICBpZiAoX2ludGVyY2VwdCkge1xyXG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdmFyIHJlc29sdmUgPSBfcmVzb2x2ZTtcclxuICAgICAgICAgICAgX3Jlc29sdmUgPSBudWxsO1xyXG4gICAgICAgICAgICByZXNvbHZlKGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKF9kYXRhVHlwZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIF9yZXNvbHZlID0gcmVzb2x2ZTtcclxuICAgICAgICAgICAgX2RhdGFUeXBlID0gZGF0YVR5cGUgfHwgXCJ0ZXh0L3BsYWluXCI7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRvY3VtZW50LmV4ZWNDb21tYW5kKFwicGFzdGVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlVuYWJsZSB0byBwYXN0ZS4gUGFzdGluZyBvbmx5IHdvcmtzIGluIEludGVybmV0IEV4cGxvcmVyIGF0IHRoZSBtb21lbnQuXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG4vLyBIYW5kbGUgSUUgYmVoYXZpb3VyLlxyXG5pZiAodHlwZW9mIENsaXBib2FyZEV2ZW50ID09PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgIHR5cGVvZiB3bmQuY2xpcGJvYXJkRGF0YS5zZXREYXRhICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcblxyXG4gICAgY2xpcGJvYXJkLmNvcHkgPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICAvLyBJRSBzdXBwb3J0cyBzdHJpbmcgYW5kIFVSTCB0eXBlczogaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzNjc0NCh2PXZzLjg1KS5hc3B4XHJcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgc3VwcG9ydCB0aGUgc3RyaW5nIHR5cGUgZm9yIG5vdy5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiICYmICEoXCJ0ZXh0L3BsYWluXCIgaW4gZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IHByb3ZpZGUgYSB0ZXh0L3BsYWluIHR5cGUuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9ICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGRhdGEgOiBkYXRhW1widGV4dC9wbGFpblwiXSk7XHJcbiAgICAgICAgICAgIHZhciBjb3B5U3VjY2VlZGVkID0gd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YShcIlRleHRcIiwgc3RyRGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChjb3B5U3VjY2VlZGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiQ29weWluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbGlwYm9hcmQucGFzdGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJEYXRhID0gd25kLmNsaXBib2FyZERhdGEuZ2V0RGF0YShcIlRleHRcIik7XHJcbiAgICAgICAgICAgIGlmIChzdHJEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHN0ckRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIHVzZXIgcmVqZWN0ZWQgdGhlIHBhc3RlIHJlcXVlc3QuXHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUGFzdGluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDbGlwYm9hcmRPYmplY3Rcclxue1xyXG4gICAgY29weSh2YWw6c3RyaW5nfEVsZW1lbnQpOlByb21pc2U8dm9pZD47XHJcbiAgICBwYXN0ZSgpOlByb21pc2U8c3RyaW5nPjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IENsaXBib2FyZCA9IGNsaXBib2FyZDsiXX0=
