(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"_process":3}],2:[function(require,module,exports){
/*!
	Papa Parse
	v4.1.2
	https://github.com/mholt/PapaParse
*/
(function(global)
{
	"use strict";

	var IS_WORKER = !global.document && !!global.postMessage,
		IS_PAPA_WORKER = IS_WORKER && /(\?|&)papaworker(=|&|$)/.test(global.location.search),
		LOADED_SYNC = false, AUTO_SCRIPT_PATH;
	var workers = {}, workerIdCounter = 0;

	var Papa = {};

	Papa.parse = CsvToJson;
	Papa.unparse = JsonToCsv;

	Papa.RECORD_SEP = String.fromCharCode(30);
	Papa.UNIT_SEP = String.fromCharCode(31);
	Papa.BYTE_ORDER_MARK = "\ufeff";
	Papa.BAD_DELIMITERS = ["\r", "\n", "\"", Papa.BYTE_ORDER_MARK];
	Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
	Papa.SCRIPT_PATH = null;	// Must be set by your code if you use workers and this lib is loaded asynchronously

	// Configurable chunk sizes for local and remote files, respectively
	Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
	Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
	Papa.DefaultDelimiter = ",";			// Used if not specified and detection fails

	// Exposed for testing and development only
	Papa.Parser = Parser;
	Papa.ParserHandle = ParserHandle;
	Papa.NetworkStreamer = NetworkStreamer;
	Papa.FileStreamer = FileStreamer;
	Papa.StringStreamer = StringStreamer;

	if (typeof module !== 'undefined' && module.exports)
	{
		// Export to Node...
		module.exports = Papa;
	}
	else if (isFunction(global.define) && global.define.amd)
	{
		// Wireup with RequireJS
		define(function() { return Papa; });
	}
	else
	{
		// ...or as browser global
		global.Papa = Papa;
	}

	if (global.jQuery)
	{
		var $ = global.jQuery;
		$.fn.parse = function(options)
		{
			var config = options.config || {};
			var queue = [];

			this.each(function(idx)
			{
				var supported = $(this).prop('tagName').toUpperCase() == "INPUT"
								&& $(this).attr('type').toLowerCase() == "file"
								&& global.FileReader;

				if (!supported || !this.files || this.files.length == 0)
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
				if (queue.length == 0)
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
						if (returned.action == "abort")
						{
							error("AbortError", f.file, f.inputElem, returned.reason);
							return;	// Aborts all queued files immediately
						}
						else if (returned.action == "skip")
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
						else if (typeof returned.config === 'object')
							f.instanceConfig = $.extend(f.instanceConfig, returned.config);
					}
					else if (returned == "skip")
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
		var _output = "";
		var _fields = [];

		// Default configuration

		/** whether to surround every datum with quotes */
		var _quotes = false;

		/** delimiting character */
		var _delimiter = ",";

		/** newline character(s) */
		var _newline = "\r\n";

		unpackConfig();

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
					_input.fields = _input.data[0] instanceof Array
									? _input.fields
									: objectKeys(_input.data[0]);

				if (!(_input.data[0] instanceof Array) && typeof _input.data[0] !== 'object')
					_input.data = [_input.data];	// handles input like [1,2,3] or ["asdf"]
			}

			return serialize(_input.fields || [], _input.data || []);
		}

		// Default (any valid paths should return before this)
		throw "exception: Unable to serialize unrecognized input";


		function unpackConfig()
		{
			if (typeof _config !== 'object')
				return;

			if (typeof _config.delimiter === 'string'
				&& _config.delimiter.length == 1
				&& Papa.BAD_DELIMITERS.indexOf(_config.delimiter) == -1)
			{
				_delimiter = _config.delimiter;
			}

			if (typeof _config.quotes === 'boolean'
				|| _config.quotes instanceof Array)
				_quotes = _config.quotes;

			if (typeof _config.newline === 'string')
				_newline = _config.newline;
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
			var csv = "";

			if (typeof fields === 'string')
				fields = JSON.parse(fields);
			if (typeof data === 'string')
				data = JSON.parse(data);

			var hasHeader = fields instanceof Array && fields.length > 0;
			var dataKeyedByField = !(data[0] instanceof Array);

			// If there a header row, write it first
			if (hasHeader)
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
			if (typeof str === "undefined" || str === null)
				return "";

			str = str.toString().replace(/"/g, '""');

			var needsQuotes = (typeof _quotes === 'boolean' && _quotes)
							|| (_quotes instanceof Array && _quotes[col])
							|| hasAny(str, Papa.BAD_DELIMITERS)
							|| str.indexOf(_delimiter) > -1
							|| str.charAt(0) == ' '
							|| str.charAt(str.length - 1) == ' ';

			return needsQuotes ? '"' + str + '"' : str;
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
		this._partialLine = "";
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
			this._partialLine = "";

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
				this._config.complete(this._completeResults);

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
			
			if (!IS_WORKER)
			{
				xhr.onload = bindFunction(this._chunkLoaded, this);
				xhr.onerror = bindFunction(this._chunkError, this);
			}

			xhr.open("GET", this._input, !IS_WORKER);
			
			if (this._config.chunkSize)
			{
				var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
				xhr.setRequestHeader("Range", "bytes="+this._start+"-"+end);
				xhr.setRequestHeader("If-None-Match", "webkit-no-cache"); // https://bugs.webkit.org/show_bug.cgi?id=82672
			}

			try {
				xhr.send();
			}
			catch (err) {
				this._chunkError(err.message);
			}

			if (IS_WORKER && xhr.status == 0)
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
			var contentRange = xhr.getResponseHeader("Content-Range");
			return parseInt(contentRange.substr(contentRange.lastIndexOf("/") + 1));
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
					if (_results.data.length == 0)
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
				var delimGuess = guessDelimiter(input);
				if (delimGuess.successful)
					_config.delimiter = delimGuess.bestDelimiter;
				else
				{
					_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
					_config.delimiter = Papa.DefaultDelimiter;
				}
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

		this.aborted = function () {
			return _aborted;
		}

		this.abort = function()
		{
			_aborted = true;
			_parser.abort();
			_results.meta.aborted = true;
			if (isFunction(_config.complete))
				_config.complete(_results);
			_input = "";
		};

		function processResults()
		{
			if (_results && _delimiterError)
			{
				addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '"+Papa.DefaultDelimiter+"'");
				_delimiterError = false;
			}

			if (_config.skipEmptyLines)
			{
				for (var i = 0; i < _results.data.length; i++)
					if (_results.data[i].length == 1 && _results.data[i][0] == "")
						_results.data.splice(i--, 1);
			}

			if (needsHeaderRow())
				fillHeaderFields();

			return applyHeaderAndDynamicTyping();
		}

		function needsHeaderRow()
		{
			return _config.header && _fields.length == 0;
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

		function applyHeaderAndDynamicTyping()
		{
			if (!_results || (!_config.header && !_config.dynamicTyping))
				return _results;

			for (var i = 0; i < _results.data.length; i++)
			{
				var row = {};

				for (var j = 0; j < _results.data[i].length; j++)
				{
					if (_config.dynamicTyping)
					{
						var value = _results.data[i][j];
						if (value == "true" || value == "TRUE")
							_results.data[i][j] = true;
						else if (value == "false" || value == "FALSE")
							_results.data[i][j] = false;
						else
							_results.data[i][j] = tryParseFloat(value);
					}

					if (_config.header)
					{
						if (j >= _fields.length)
						{
							if (!row["__parsed_extra"])
								row["__parsed_extra"] = [];
							row["__parsed_extra"].push(_results.data[i][j]);
						}
						else
							row[_fields[j]] = _results.data[i][j];
					}
				}

				if (_config.header)
				{
					_results.data[i] = row;
					if (j > _fields.length)
						addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, i);
					else if (j < _fields.length)
						addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, i);
				}
			}

			if (_config.header && _results.meta)
				_results.meta.fields = _fields;
			return _results;
		}

		function guessDelimiter(input)
		{
			var delimChoices = [",", "\t", "|", ";", Papa.RECORD_SEP, Papa.UNIT_SEP];
			var bestDelim, bestDelta, fieldCountPrevRow;

			for (var i = 0; i < delimChoices.length; i++)
			{
				var delim = delimChoices[i];
				var delta = 0, avgFieldCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					delimiter: delim,
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

			if (r.length == 1)
				return '\n';

			var numWithN = 0;
			for (var i = 0; i < r.length; i++)
			{
				if (r[i][0] == '\n')
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

		// Delimiter must be valid
		if (typeof delim !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
			delim = ",";

		// Comment character must be valid
		if (comments === delim)
			throw "Comment character same as delimiter";
		else if (comments === true)
			comments = "#";
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
				throw "Input must be a string";

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

			if (fastMode || (fastMode !== false && input.indexOf('"') === -1))
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
					if (comments && row.substr(0, commentsLen) == comments)
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

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] == '"')
				{
					// Start our search for the closing quote where the cursor is
					var quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						var quoteSearch = input.indexOf('"', quoteSearch+1);

						if (quoteSearch === -1)
						{
							if (!ignoreLastRow) {
								// No closing quote... what a pity
								errors.push({
									type: "Quotes",
									code: "MissingQuotes",
									message: "Quoted field unterminated",
									row: data.length,	// row has yet to be inserted
									index: cursor
								});
							}
							return finish();
						}

						if (quoteSearch === inputLen-1)
						{
							// Closing quote at EOF
							var value = input.substring(cursor, quoteSearch).replace(/""/g, '"');
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						if (input[quoteSearch+1] == '"')
						{
							quoteSearch++;
							continue;
						}

						if (input[quoteSearch+1] == delim)
						{
							// Closing quote followed by delimiter
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
							cursor = quoteSearch + 1 + delimLen;
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						if (input.substr(quoteSearch+1, newlineLen) === newline)
						{
							// Closing quote followed by newline
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
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
					if (nextNewline == -1)	// Comment ends at EOF
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
		// Append "papaworker" to the search string to tell papaparse that this is our worker.
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
		throw "Not implemented.";
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
})(typeof window !== 'undefined' ? window : this);

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
(function (global){
/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect;
(function (Reflect) {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    // feature test for Object.create support
    var supportsCreate = typeof Object.create === "function";
    // feature test for __proto__ support
    var supportsProto = { __proto__: [] } instanceof Array;
    // feature test for Symbol support
    var supportsSymbol = typeof Symbol === "function";
    var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
    var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
    // create an object in dictionary mode (a.k.a. "slow" mode in v8)
    var createDictionary = supportsCreate ? function () { return MakeDictionary(Object.create(null)); } :
        supportsProto ? function () { return MakeDictionary({ __proto__: null }); } :
            function () { return MakeDictionary({}); };
    var HashMap;
    (function (HashMap) {
        var downLevel = !supportsCreate && !supportsProto;
        HashMap.has = downLevel
            ? function (map, key) { return hasOwn.call(map, key); }
            : function (map, key) { return key in map; };
        HashMap.get = downLevel
            ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
            : function (map, key) { return map[key]; };
    })(HashMap || (HashMap = {}));
    // Load global or shim versions of Map, Set, and WeakMap
    var functionPrototype = Object.getPrototypeOf(Function);
    var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
    var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
    var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
    // [[Metadata]] internal slot
    var Metadata = new _WeakMap();
    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey (Optional) The property key to decorate.
      * @param targetDescriptor (Optional) The property descriptor for the target key
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Example = Reflect.decorate(decoratorsArray, Example);
      *
      *     // property (on constructor)
      *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Object.defineProperty(Example, "staticMethod",
      *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
      *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
      *
      *     // method (on prototype)
      *     Object.defineProperty(Example.prototype, "method",
      *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
      *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
      *
      */
    function decorate(decorators, target, targetKey, targetDescriptor) {
        if (!IsUndefined(targetKey)) {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsObject(target))
                throw new TypeError();
            if (!IsObject(targetDescriptor) && !IsUndefined(targetDescriptor) && !IsNull(targetDescriptor))
                throw new TypeError();
            if (IsNull(targetDescriptor))
                targetDescriptor = undefined;
            targetKey = ToPropertyKey(targetKey);
            return DecorateProperty(decorators, target, targetKey, targetDescriptor);
        }
        else {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsConstructor(target))
                throw new TypeError();
            return DecorateConstructor(decorators, target);
        }
    }
    Reflect.decorate = decorate;
    /**
      * A default metadata decorator factory that can be used on a class, class member, or parameter.
      * @param metadataKey The key for the metadata entry.
      * @param metadataValue The value for the metadata entry.
      * @returns A decorator function.
      * @remarks
      * If `metadataKey` is already defined for the target and target key, the
      * metadataValue for that key will be overwritten.
      * @example
      *
      *     // constructor
      *     @Reflect.metadata(key, value)
      *     class Example {
      *     }
      *
      *     // property (on constructor, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticProperty;
      *     }
      *
      *     // property (on prototype, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         property;
      *     }
      *
      *     // method (on constructor)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticMethod() { }
      *     }
      *
      *     // method (on prototype)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         method() { }
      *     }
      *
      */
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKey) {
            if (!IsUndefined(targetKey)) {
                if (!IsObject(target))
                    throw new TypeError();
                targetKey = ToPropertyKey(targetKey);
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
            }
            else {
                if (!IsConstructor(target))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, /*targetKey*/ undefined);
            }
        }
        return decorator;
    }
    Reflect.metadata = metadata;
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey (Optional) The property key for the target.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Reflect.defineMetadata("custom:annotation", options, Example);
      *
      *     // property (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
      *     }
      *
      */
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetMetadata(metadataKey, target, targetKey);
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "method");
      *
      */
    function getMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryMetadataKeys(target, targetKey);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
      *
      */
    function getOwnMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryOwnMetadataKeys(target, targetKey);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.deleteMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function deleteMetadata(metadataKey, target, targetKey) {
        // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#deletemetadata-metadatakey-p-
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        var metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
        if (IsUndefined(metadataMap))
            return false;
        if (!metadataMap.delete(metadataKey))
            return false;
        if (metadataMap.size > 0)
            return true;
        var targetMetadata = Metadata.get(target);
        targetMetadata.delete(targetKey);
        if (targetMetadata.size > 0)
            return true;
        Metadata.delete(target);
        return true;
    }
    Reflect.deleteMetadata = deleteMetadata;
    function DecorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsConstructor(decorated))
                    throw new TypeError();
                target = decorated;
            }
        }
        return target;
    }
    function DecorateProperty(decorators, target, propertyKey, descriptor) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsObject(decorated))
                    throw new TypeError();
                descriptor = decorated;
            }
        }
        return descriptor;
    }
    function GetOrCreateMetadataMap(O, P, Create) {
        var targetMetadata = Metadata.get(O);
        if (IsUndefined(targetMetadata)) {
            if (!Create)
                return undefined;
            targetMetadata = new _Map();
            Metadata.set(O, targetMetadata);
        }
        var metadataMap = targetMetadata.get(P);
        if (IsUndefined(metadataMap)) {
            if (!Create)
                return undefined;
            metadataMap = new _Map();
            targetMetadata.set(P, metadataMap);
        }
        return metadataMap;
    }
    // Ordinary Object Internal Methods and Internal Slots
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinary-object-internal-methods-and-internal-slots
    // OrdinaryHasMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasmetadata--metadatakey-o-p-
    function OrdinaryHasMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return true;
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
            return OrdinaryHasMetadata(MetadataKey, parent, P);
        return false;
    }
    // OrdinaryHasOwnMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasownmetadata--metadatakey-o-p-
    function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        if (IsUndefined(metadataMap))
            return false;
        return ToBoolean(metadataMap.has(MetadataKey));
    }
    // OrdinaryGetMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetmetadata--metadatakey-o-p-
    function OrdinaryGetMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
            return OrdinaryGetMetadata(MetadataKey, parent, P);
        return undefined;
    }
    // OrdinaryGetOwnMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetownmetadata--metadatakey-o-p-
    function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        if (IsUndefined(metadataMap))
            return undefined;
        return metadataMap.get(MetadataKey);
    }
    // OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarydefineownmetadata--metadatakey-metadatavalue-o-p-
    function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ true);
        metadataMap.set(MetadataKey, MetadataValue);
    }
    // OrdinaryMetadataKeys(O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarymetadatakeys--o-p-
    function OrdinaryMetadataKeys(O, P) {
        var ownKeys = OrdinaryOwnMetadataKeys(O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (parent === null)
            return ownKeys;
        var parentKeys = OrdinaryMetadataKeys(parent, P);
        if (parentKeys.length <= 0)
            return ownKeys;
        if (ownKeys.length <= 0)
            return parentKeys;
        var set = new _Set();
        var keys = [];
        for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
            var key = ownKeys_1[_i];
            var hasKey = set.has(key);
            if (!hasKey) {
                set.add(key);
                keys.push(key);
            }
        }
        for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
            var key = parentKeys_1[_a];
            var hasKey = set.has(key);
            if (!hasKey) {
                set.add(key);
                keys.push(key);
            }
        }
        return keys;
    }
    // OrdinaryOwnMetadataKeys(O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryownmetadatakeys--o-p-
    function OrdinaryOwnMetadataKeys(O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        var keys = [];
        if (IsUndefined(metadataMap))
            return keys;
        var keysObj = metadataMap.keys();
        var iterator = GetIterator(keysObj);
        while (true) {
            var next = IteratorStep(iterator);
            try {
                if (!next)
                    return keys;
                var nextValue = IteratorValue(next);
                keys.push(nextValue);
            }
            catch (e) {
                try {
                    if (next) {
                        next = false;
                        IteratorClose(iterator);
                    }
                }
                finally {
                    throw e;
                }
            }
            finally {
                if (next)
                    IteratorClose(iterator);
            }
        }
    }
    // ECMAScript Specification
    // https://tc39.github.io/ecma262/
    // 6 ECMAScript Data Typ0es and Values
    // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
    function Type(x) {
        if (x === null)
            return 1 /* Null */;
        switch (typeof x) {
            case "undefined": return 0 /* Undefined */;
            case "boolean": return 2 /* Boolean */;
            case "string": return 3 /* String */;
            case "symbol": return 4 /* Symbol */;
            case "number": return 5 /* Number */;
            case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
            default: return 6 /* Object */;
        }
    }
    // 6.1.1 The Undefined Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
    function IsUndefined(x) {
        return x === undefined;
    }
    // 6.1.2 The Null Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
    function IsNull(x) {
        return x === null;
    }
    // 6.1.5 The Symbol Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
    function IsSymbol(x) {
        return typeof x === "symbol";
    }
    // 6.1.7 The Object Type
    // https://tc39.github.io/ecma262/#sec-object-type
    function IsObject(x) {
        return typeof x === "object" ? x !== null : typeof x === "function";
    }
    // 7.1 Type Conversion
    // https://tc39.github.io/ecma262/#sec-type-conversion
    // 7.1.1 ToPrimitive(input [, PreferredType])
    // https://tc39.github.io/ecma262/#sec-toprimitive
    function ToPrimitive(input, PreferredType) {
        switch (Type(input)) {
            case 0 /* Undefined */: return input;
            case 1 /* Null */: return input;
            case 2 /* Boolean */: return input;
            case 3 /* String */: return input;
            case 4 /* Symbol */: return input;
            case 5 /* Number */: return input;
        }
        var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
        var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
        if (exoticToPrim !== undefined) {
            var result = exoticToPrim.call(input, hint);
            if (IsObject(result))
                throw new TypeError();
            return result;
        }
        return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
    }
    // 7.1.1.1 OrdinaryToPrimitive(O, hint)
    // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
    function OrdinaryToPrimitive(O, hint) {
        if (hint === "string") {
            var toString_1 = O.toString;
            if (IsCallable(toString_1)) {
                var result = toString_1.call(O);
                if (!IsObject(result))
                    return result;
            }
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                    return result;
            }
        }
        else {
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                    return result;
            }
            var toString_2 = O.toString;
            if (IsCallable(toString_2)) {
                var result = toString_2.call(O);
                if (!IsObject(result))
                    return result;
            }
        }
        throw new TypeError();
    }
    // 7.1.2 ToBoolean(argument)
    // https://tc39.github.io/ecma262/2016/#sec-toboolean
    function ToBoolean(argument) {
        return !!argument;
    }
    // 7.1.12 ToString(argument)
    // https://tc39.github.io/ecma262/#sec-tostring
    function ToString(argument) {
        return "" + argument;
    }
    // 7.1.14 ToPropertyKey(argument)
    // https://tc39.github.io/ecma262/#sec-topropertykey
    function ToPropertyKey(argument) {
        var key = ToPrimitive(argument, 3 /* String */);
        if (IsSymbol(key))
            return key;
        return ToString(key);
    }
    // 7.2 Testing and Comparison Operations
    // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
    // 7.2.2 IsArray(argument)
    // https://tc39.github.io/ecma262/#sec-isarray
    function IsArray(argument) {
        return Array.isArray
            ? Array.isArray(argument)
            : argument instanceof Object
                ? argument instanceof Array
                : Object.prototype.toString.call(argument) === "[object Array]";
    }
    // 7.2.3 IsCallable(argument)
    // https://tc39.github.io/ecma262/#sec-iscallable
    function IsCallable(argument) {
        // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
        return typeof argument === "function";
    }
    // 7.2.4 IsConstructor(argument)
    // https://tc39.github.io/ecma262/#sec-isconstructor
    function IsConstructor(argument) {
        // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
        return typeof argument === "function";
    }
    // 7.3 Operations on Objects
    // https://tc39.github.io/ecma262/#sec-operations-on-objects
    // 7.3.9 GetMethod(V, P)
    // https://tc39.github.io/ecma262/#sec-getmethod
    function GetMethod(V, P) {
        var func = V[P];
        if (func === undefined || func === null)
            return undefined;
        if (!IsCallable(func))
            throw new TypeError();
        return func;
    }
    // 7.4 Operations on Iterator Objects
    // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
    function GetIterator(obj) {
        var method = GetMethod(obj, iteratorSymbol);
        if (!IsCallable(method))
            throw new TypeError(); // from Call
        var iterator = method.call(obj);
        if (!IsObject(iterator))
            throw new TypeError();
        return iterator;
    }
    // 7.4.4 IteratorValue(iterResult)
    // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
    function IteratorValue(iterResult) {
        return iterResult.value;
    }
    // 7.4.5 IteratorStep(iterator)
    // https://tc39.github.io/ecma262/#sec-iteratorstep
    function IteratorStep(iterator) {
        var result = iterator.next();
        return result.done ? false : result;
    }
    // 7.4.6 IteratorClose(iterator, completion)
    // https://tc39.github.io/ecma262/#sec-iteratorclose
    function IteratorClose(iterator) {
        var f = iterator["return"];
        if (f)
            f.call(iterator);
    }
    // 9.1 Ordinary Object Internal Methods and Internal Slots
    // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
    // 9.1.1.1 OrdinaryGetPrototypeOf(O)
    // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
    function OrdinaryGetPrototypeOf(O) {
        var proto = Object.getPrototypeOf(O);
        if (typeof O !== "function" || O === functionPrototype)
            return proto;
        // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
        // Try to determine the superclass constructor. Compatible implementations
        // must either set __proto__ on a subclass constructor to the superclass constructor,
        // or ensure each class has a valid `constructor` property on its prototype that
        // points back to the constructor.
        // If this is not the same as Function.[[Prototype]], then this is definately inherited.
        // This is the case when in ES6 or when using __proto__ in a compatible browser.
        if (proto !== functionPrototype)
            return proto;
        // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
        var prototype = O.prototype;
        var prototypeProto = prototype && Object.getPrototypeOf(prototype);
        if (prototypeProto == null || prototypeProto === Object.prototype)
            return proto;
        // If the constructor was not a function, then we cannot determine the heritage.
        var constructor = prototypeProto.constructor;
        if (typeof constructor !== "function")
            return proto;
        // If we have some kind of self-reference, then we cannot determine the heritage.
        if (constructor === O)
            return proto;
        // we have a pretty good guess at the heritage.
        return constructor;
    }
    // naive Map shim
    function CreateMapPolyfill() {
        var cacheSentinel = {};
        var arraySentinel = [];
        var MapIterator = (function () {
            function MapIterator(keys, values, selector) {
                this._index = 0;
                this._keys = keys;
                this._values = values;
                this._selector = selector;
            }
            MapIterator.prototype["@@iterator"] = function () { return this; };
            MapIterator.prototype[iteratorSymbol] = function () { return this; };
            MapIterator.prototype.next = function () {
                var index = this._index;
                if (index >= 0 && index < this._keys.length) {
                    var result = this._selector(this._keys[index], this._values[index]);
                    if (index + 1 >= this._keys.length) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    else {
                        this._index++;
                    }
                    return { value: result, done: false };
                }
                return { value: undefined, done: true };
            };
            MapIterator.prototype.throw = function (error) {
                if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                }
                throw error;
            };
            MapIterator.prototype.return = function (value) {
                if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                }
                return { value: value, done: true };
            };
            return MapIterator;
        }());
        return (function () {
            function Map() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            }
            Object.defineProperty(Map.prototype, "size", {
                get: function () { return this._keys.length; },
                enumerable: true,
                configurable: true
            });
            Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
            Map.prototype.get = function (key) {
                var index = this._find(key, /*insert*/ false);
                return index >= 0 ? this._values[index] : undefined;
            };
            Map.prototype.set = function (key, value) {
                var index = this._find(key, /*insert*/ true);
                this._values[index] = value;
                return this;
            };
            Map.prototype.delete = function (key) {
                var index = this._find(key, /*insert*/ false);
                if (index >= 0) {
                    var size = this._keys.length;
                    for (var i = index + 1; i < size; i++) {
                        this._keys[i - 1] = this._keys[i];
                        this._values[i - 1] = this._values[i];
                    }
                    this._keys.length--;
                    this._values.length--;
                    if (key === this._cacheKey) {
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    }
                    return true;
                }
                return false;
            };
            Map.prototype.clear = function () {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            };
            Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
            Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
            Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
            Map.prototype["@@iterator"] = function () { return this.entries(); };
            Map.prototype[iteratorSymbol] = function () { return this.entries(); };
            Map.prototype._find = function (key, insert) {
                if (this._cacheKey === key)
                    return this._cacheIndex;
                var index = this._keys.indexOf(key);
                if (index < 0 && insert) {
                    index = this._keys.length;
                    this._keys.push(key);
                    this._values.push(undefined);
                }
                return this._cacheKey = key, this._cacheIndex = index;
            };
            return Map;
        }());
        function getKey(key, _) {
            return key;
        }
        function getValue(_, value) {
            return value;
        }
        function getEntry(key, value) {
            return [key, value];
        }
    }
    // naive Set shim
    function CreateSetPolyfill() {
        return (function () {
            function Set() {
                this._map = new _Map();
            }
            Object.defineProperty(Set.prototype, "size", {
                get: function () { return this._map.size; },
                enumerable: true,
                configurable: true
            });
            Set.prototype.has = function (value) { return this._map.has(value); };
            Set.prototype.add = function (value) { return this._map.set(value, value), this; };
            Set.prototype.delete = function (value) { return this._map.delete(value); };
            Set.prototype.clear = function () { this._map.clear(); };
            Set.prototype.keys = function () { return this._map.keys(); };
            Set.prototype.values = function () { return this._map.values(); };
            Set.prototype.entries = function () { return this._map.entries(); };
            Set.prototype["@@iterator"] = function () { return this.keys(); };
            Set.prototype[iteratorSymbol] = function () { return this.keys(); };
            return Set;
        }());
    }
    // naive WeakMap shim
    function CreateWeakMapPolyfill() {
        var UUID_SIZE = 16;
        var keys = createDictionary();
        var rootKey = CreateUniqueKey();
        return (function () {
            function WeakMap() {
                this._key = CreateUniqueKey();
            }
            WeakMap.prototype.has = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.has(table, this._key) : false;
            };
            WeakMap.prototype.get = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.get(table, this._key) : undefined;
            };
            WeakMap.prototype.set = function (target, value) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                table[this._key] = value;
                return this;
            };
            WeakMap.prototype.delete = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? delete table[this._key] : false;
            };
            WeakMap.prototype.clear = function () {
                // NOTE: not a real clear, just makes the previous data unreachable
                this._key = CreateUniqueKey();
            };
            return WeakMap;
        }());
        function CreateUniqueKey() {
            var key;
            do
                key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
        }
        function GetOrCreateWeakMapTable(target, create) {
            if (!hasOwn.call(target, rootKey)) {
                if (!create)
                    return undefined;
                Object.defineProperty(target, rootKey, { value: createDictionary() });
            }
            return target[rootKey];
        }
        function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i)
                buffer[i] = Math.random() * 0xff | 0;
            return buffer;
        }
        function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
                if (typeof crypto !== "undefined")
                    return crypto.getRandomValues(new Uint8Array(size));
                if (typeof msCrypto !== "undefined")
                    return msCrypto.getRandomValues(new Uint8Array(size));
                return FillRandomBytes(new Uint8Array(size), size);
            }
            return FillRandomBytes(new Array(size), size);
        }
        function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            // mark as random - RFC 4122 § 4.4
            data[6] = data[6] & 0x4f | 0x40;
            data[8] = data[8] & 0xbf | 0x80;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
                var byte = data[offset];
                if (offset === 4 || offset === 6 || offset === 8)
                    result += "-";
                if (byte < 16)
                    result += "0";
                result += byte.toString(16).toLowerCase();
            }
            return result;
        }
    }
    // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
    function MakeDictionary(obj) {
        obj.__ = undefined;
        delete obj.__;
        return obj;
    }
    // patch global Reflect
    (function (__global) {
        if (typeof __global.Reflect !== "undefined") {
            if (__global.Reflect !== Reflect) {
                for (var p in Reflect) {
                    if (hasOwn.call(Reflect, p)) {
                        __global.Reflect[p] = Reflect[p];
                    }
                }
            }
        }
        else {
            __global.Reflect = Reflect;
        }
    })(typeof global !== "undefined" ? global :
        typeof self !== "undefined" ? self :
            Function("return this;")());
})(Reflect || (Reflect = {}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
'use strict';
module.exports = require('./lib/index');

},{"./lib/index":9}],6:[function(require,module,exports){
'use strict';

var randomFromSeed = require('./random/random-from-seed');

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

module.exports = {
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};

},{"./random/random-from-seed":12}],7:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

/**
 * Decode the id to get the version and worker
 * Mainly for debugging and testing.
 * @param id - the shortid-generated id.
 */
function decode(id) {
    var characters = alphabet.shuffled();
    return {
        version: characters.indexOf(id.substr(0, 1)) & 0x0f,
        worker: characters.indexOf(id.substr(1, 1)) & 0x0f
    };
}

module.exports = decode;

},{"./alphabet":6}],8:[function(require,module,exports){
'use strict';

var randomByte = require('./random/random-byte');

function encode(lookup, number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + lookup( ( (number >> (4 * loopCounter)) & 0x0f ) | randomByte() );
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = encode;

},{"./random/random-byte":11}],9:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var encode = require('./encode');
var decode = require('./decode');
var isValid = require('./is-valid');

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1459707606518;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 6;

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = require('./util/cluster-worker-id') || 0;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function generate() {

    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + encode(alphabet.lookup, version);
    str = str + encode(alphabet.lookup, clusterWorkerId);
    if (counter > 0) {
        str = str + encode(alphabet.lookup, counter);
    }
    str = str + encode(alphabet.lookup, seconds);

    return str;
}


/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}


// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.decode = decode;
module.exports.isValid = isValid;

},{"./alphabet":6,"./decode":7,"./encode":8,"./is-valid":10,"./util/cluster-worker-id":13}],10:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var characters = alphabet.characters();
    var len = id.length;
    for(var i = 0; i < len;i++) {
        if (characters.indexOf(id[i]) === -1) {
            return false;
        }
    }
    return true;
}

module.exports = isShortId;

},{"./alphabet":6}],11:[function(require,module,exports){
'use strict';

var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

function randomByte() {
    if (!crypto || !crypto.getRandomValues) {
        return Math.floor(Math.random() * 256) & 0x30;
    }
    var dest = new Uint8Array(1);
    crypto.getRandomValues(dest);
    return dest[0] & 0x30;
}

module.exports = randomByte;

},{}],12:[function(require,module,exports){
'use strict';

// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};

},{}],13:[function(require,module,exports){
'use strict';

module.exports = 0;

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
"use strict";
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var FlexGridCell_1 = require("../model/flex/FlexGridCell");
var ExampleGridBuilder = (function () {
    function ExampleGridBuilder(lines, cols) {
        if (lines === void 0) { lines = 100; }
        if (cols === void 0) { cols = 52; }
        this.lines = lines;
        this.cols = cols;
    }
    ExampleGridBuilder.prototype.build = function () {
        var cells = [];
        this.createColumnRow(cells);
        for (var i = 0; i < this.lines; i++) {
            this.createResourceRow(cells, i);
        }
        return new DefaultGridModel_1.DefaultGridModel(cells, [], []);
    };
    ExampleGridBuilder.prototype.createColumnRow = function (cells) {
        cells.push(new FlexGridCell_1.FlexGridCell({
            colRef: 0,
            rowRef: 0,
            value: '+',
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new FlexGridCell_1.FlexGridCell({
                colRef: i + 1,
                rowRef: 0,
                value: 'Vertical #' + (i + 1),
            }));
        }
    };
    ExampleGridBuilder.prototype.createResourceRow = function (cells, line) {
        cells.push(new FlexGridCell_1.FlexGridCell({
            colRef: 0,
            rowRef: line + 1,
            value: "Horizontal #" + line,
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new FlexGridCell_1.FlexGridCell({
                colRef: i + 1,
                rowRef: line + 1,
                value: (line + i).toString(),
            }));
        }
    };
    return ExampleGridBuilder;
}());
exports.ExampleGridBuilder = ExampleGridBuilder;
},{"../model/default/DefaultGridModel":47,"../model/flex/FlexGridCell":49}],16:[function(require,module,exports){
"use strict";
var ExampleGridBuilder_1 = require("./ExampleGridBuilder");
var GridElement_1 = require("../ui/GridElement");
var SelectorExtension_1 = require("../extensions/SelectorExtension");
var ScrollerExtension_1 = require("../extensions/ScrollerExtension");
var EditingExtension_1 = require("../extensions/EditingExtension");
var ClipboardExtension_1 = require("../extensions/ClipboardExtension");
var HistoryExtension_1 = require("../extensions/HistoryExtension");
var PanExtension_1 = require("../extensions/PanExtension");
var ComputeExtension_1 = require("../extensions/ComputeExtension");
//let builder:any = new FlexGridBuilder(1, 1);
//builder = new FlexGridBuilder(52 * 5, 250);
var builder = new ExampleGridBuilder_1.ExampleGridBuilder();
var model = builder.build();
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension_1.ScrollerExtension())
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .extend(new ClipboardExtension_1.ClipboardExtension())
    .extend(new HistoryExtension_1.HistoryExtension())
    .extend(new PanExtension_1.PanExtension())
    .extend(new ComputeExtension_1.ComputeExtension())
    .mergeInterface();
grid.model = model;
grid.on('input', function (e) {
    e.changes.forEach(function (x) {
        x.cell.value = x.value;
    });
    grid.redraw();
});
window['grid'] = grid;
//window.addEventListener('keydown', e =>
//{
//    if (!e.ctrlKey)
//        return;
//
//    if (e.key === 'a')
//    {
//        let v = grid.scrollLeft - 100;
//        //tween.enable(grid, { scrollLeft: v }, .5, () => grid.scrollLeft = v);
//        grid.scrollLeft = v;
//    }
//    if (e.key === 'd')
//    {
//        let v = grid.scrollLeft + 100;
//        //tween.enable(grid, { scrollLeft: v }, .5, () => grid.scrollLeft = v);
//        grid.scrollLeft = v;
//    }
//    if (e.key === 'w')
//    {
//        let v = grid.scrollTop - 100;
//        //tween.enable(grid, { scrollTop: v }, .5, () => grid.scrollTop = v);
//        grid.scrollTop = v;
//    }
//    if (e.key === 's')
//    {
//        let v = grid.scrollTop + 100;
//        //tween.enable(grid, { scrollTop: v }, .5, () => grid.scrollTop = v);
//        grid.scrollTop = v;
//    }
//}) 
},{"../extensions/ClipboardExtension":17,"../extensions/ComputeExtension":18,"../extensions/EditingExtension":19,"../extensions/HistoryExtension":20,"../extensions/PanExtension":21,"../extensions/ScrollerExtension":22,"../extensions/SelectorExtension":23,"../ui/GridElement":54,"./ExampleGridBuilder":15}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var clipboard_1 = require("../vendor/clipboard");
var Widget_1 = require("../ui/Widget");
var Rect_1 = require("../geom/Rect");
var Point_1 = require("../geom/Point");
var GridRange_1 = require("../model/GridRange");
var Extensibility_1 = require("../ui/Extensibility");
var _ = require("../misc/Util");
var Dom = require("../misc/Dom");
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
        Dom.css(layer, {
            pointerEvents: 'none',
            overflow: 'hidden',
            width: target.clientWidth + 'px',
            height: target.clientHeight + 'px',
        });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
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
        var pasteRange = GridRange_1.GridRange.select(grid.model, startVector, endVector);
        var changes = {};
        for (var _i = 0, _b = pasteRange.ltr; _i < _b.length; _i++) {
            var cell = _b[_i];
            var xy = new Point_1.Point(cell.colRef, cell.rowRef).subtract(startVector);
            var value = data[xy.y][xy.x] || '';
            changes[cell.ref] = value;
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
            if (!!ae.className && ae.className.indexOf('grid') >= 0)
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
        return _super.apply(this, arguments) || this;
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
},{"../geom/Point":24,"../geom/Rect":25,"../input/KeyInput":30,"../misc/Dom":36,"../misc/Util":38,"../model/GridRange":43,"../ui/Extensibility":53,"../ui/Widget":56,"../vendor/clipboard":59,"papaparse":2,"tether":14}],18:[function(require,module,exports){
"use strict";
var Util_1 = require("../misc/Util");
var GridRange_1 = require("../model/GridRange");
var Point_1 = require("../geom/Point");
var RefExtract = /(?!.*['"`])[A-Za-z]+[0-9]+:?([A-Za-z]+[0-9])?/g;
var RefConvert = /([A-Za-z]+)([0-9]+)/g;
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
    sum: function (values) {
        return values.reduce(function (t, x) { return t + x; }, 0);
    },
};
var ComputeExtension = (function () {
    function ComputeExtension() {
        this.tracker = {};
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
        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
    };
    ComputeExtension.prototype.beginEditOverride = function (override, impl) {
        var _a = this, selection = _a.selection, tracker = _a.tracker;
        if (!selection[0]) {
            return false;
        }
        if (!override && override !== '') {
            override = tracker[selection[0]] || null;
        }
        return impl(override);
    };
    ComputeExtension.prototype.commitOverride = function (changes, impl) {
        var tracker = this.tracker;
        for (var ref in changes) {
            var val = changes[ref];
            if (val.length > 0 && val[0] === '=') {
                tracker[ref] = val;
                changes[ref] = this.evaluate(val);
            }
        }
        impl(changes);
    };
    ComputeExtension.prototype.evaluate = function (formula) {
        var result = null;
        while (result = RefExtract.exec(formula)) {
            if (!result.length)
                continue;
            formula =
                formula.substr(0, result.index) +
                    ("expr('" + result[0] + "')") +
                    formula.substring(result.index + result[0].length);
        }
        var functions = Util_1.extend({}, SupportFunctions);
        functions.expr = this.resolveExpr.bind(this);
        var code = ("with (arguments[0]) { return (" + formula.substr(1) + "); }").toLowerCase();
        console.log(code);
        var f = new Function(code).bind(null, functions);
        return f().toString() || '0';
    };
    ComputeExtension.prototype.resolveExpr = function (expr) {
        var _a = expr.split(':'), from = _a[0], to = _a[1];
        var fromCell = this.resolveRef(from);
        if (to === undefined) {
            if (!!fromCell) {
                return parseInt(fromCell.value) || 0;
            }
        }
        else {
            var toCell = this.resolveRef(to);
            if (!!fromCell && !!toCell) {
                var fromVector = new Point_1.Point(fromCell.colRef, fromCell.rowRef);
                var toVector = new Point_1.Point(toCell.colRef, toCell.rowRef);
                var range = GridRange_1.GridRange.select(this.grid.model, fromVector, toVector, true);
                return range.ltr.map(function (x) { return parseInt(x.value) || 0; });
            }
        }
        return 0;
    };
    ComputeExtension.prototype.resolveRef = function (nameRef) {
        RefConvert.lastIndex = 0;
        var result = RefConvert.exec(nameRef);
        var exprRef = result[1];
        var rowRef = parseInt(result[2]);
        var colRef = 0;
        for (var i = exprRef.length - 1; i >= 0; i--) {
            var x = (exprRef.length - 1) - i;
            var n = exprRef[x].toUpperCase().charCodeAt(0) - 64;
            colRef += n * (26 * i);
            if (i == 0) {
                colRef += n;
            }
        }
        return this.grid.model.locateCell(colRef - 1, rowRef - 1);
    };
    return ComputeExtension;
}());
exports.ComputeExtension = ComputeExtension;
},{"../geom/Point":24,"../misc/Util":38,"../model/GridRange":43}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var MouseInput_1 = require("../input/MouseInput");
var Point_1 = require("../geom/Point");
var _ = require("../misc/Util");
var Tether = require("tether");
var Dom = require("../misc/Dom");
var Widget_1 = require("../ui/Widget");
var Extensibility_1 = require("../ui/Extensibility");
var Vectors = {
    n: new Point_1.Point(0, -1),
    s: new Point_1.Point(0, 1),
    e: new Point_1.Point(1, 0),
    w: new Point_1.Point(-1, 0),
};
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
        layer.style.pointerEvents = 'none';
        layer.style.width = target.clientWidth + 'px';
        layer.style.height = target.clientHeight + 'px';
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
        this.layer = layer;
        this.input = Input.create(layer);
    };
    EditingExtension.prototype.beginEdit = function (override) {
        if (this.isEditing)
            return false;
        var input = this.input;
        var cell = this.grid.model.findCell(this.selection[0]);
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
        var changes = _.zipPairs(cells.map(function (x) { return [x, uniformValue]; }));
        this.commit(changes);
    };
    EditingExtension.prototype.commit = function (changes) {
        var grid = this.grid;
        var evt = {
            changes: _.unzipPairs(changes).map(function (x) { return ({
                cell: grid.model.findCell(x[0]),
                value: x[1],
            }); })
        };
        grid.emit('input', evt);
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
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "commit", null);
exports.EditingExtension = EditingExtension;
var Input = (function (_super) {
    __extends(Input, _super);
    function Input() {
        return _super.apply(this, arguments) || this;
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
},{"../geom/Point":24,"../input/KeyInput":30,"../input/MouseInput":35,"../misc/Dom":36,"../misc/Util":38,"../ui/Extensibility":53,"../ui/Widget":56,"tether":14}],20:[function(require,module,exports){
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
var KeyInput_1 = require("../input/KeyInput");
var Extensibility_1 = require("../ui/Extensibility");
var _ = require("../misc/Util");
var HistoryExtension = (function () {
    function HistoryExtension() {
        this.future = [];
        this.past = [];
        this.noCapture = false;
    }
    HistoryExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', function () { return _this.undo(); })
            .on('!CTRL+KEY_Y', function () { return _this.redo(); });
        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
    };
    HistoryExtension.prototype.undo = function () {
        if (!this.past.length) {
            return;
        }
        var action = this.past.pop();
        action.rollback();
        this.future.push(action);
    };
    HistoryExtension.prototype.redo = function () {
        if (!this.future.length) {
            return;
        }
        var action = this.future.pop();
        action.apply();
        this.past.push(action);
    };
    HistoryExtension.prototype.push = function (action) {
        this.past.push(action);
        this.future = [];
    };
    HistoryExtension.prototype.beforeCommit = function (changes) {
        if (this.noCapture)
            return;
        var snapshots = this.createSnapshots(changes);
        var action = this.createEditAction(snapshots);
        this.push(action);
    };
    HistoryExtension.prototype.createSnapshots = function (changes) {
        var model = this.grid.model;
        var batch = [];
        for (var ref in changes) {
            batch.push({
                ref: ref,
                newVal: changes[ref],
                oldVal: model.findCell(ref).value,
            });
        }
        return batch;
    };
    HistoryExtension.prototype.createEditAction = function (snapshots) {
        var _this = this;
        return {
            apply: function () {
                _this.invokeSilentCommit(_.zipPairs(snapshots.map(function (x) { return [x.ref, x.newVal]; })));
            },
            rollback: function () {
                _this.invokeSilentCommit(_.zipPairs(snapshots.map(function (x) { return [x.ref, x.oldVal]; })));
            },
        };
    };
    HistoryExtension.prototype.invokeSilentCommit = function (changes) {
        var kernel = this.grid.kernel;
        try {
            this.noCapture = true;
            kernel.commands.exec('commit', changes);
        }
        finally {
            this.noCapture = false;
        }
        kernel.commands.exec('select', _.keys(changes));
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
exports.HistoryExtension = HistoryExtension;
},{"../input/KeyInput":30,"../misc/Util":38,"../ui/Extensibility":53}],21:[function(require,module,exports){
"use strict";
var MouseInput_1 = require("../input/MouseInput");
var Point_1 = require("../geom/Point");
var Keys_1 = require("../input/Keys");
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
},{"../geom/Point":24,"../input/Keys":31,"../input/MouseInput":35}],22:[function(require,module,exports){
"use strict";
var Tether = require("tether");
var Dom = require("../misc/Dom");
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
        var layer = this.layer = document.createElement('div');
        layer.className = 'grid-layer';
        layer.style.pointerEvents = 'none';
        layer.style.width = target.clientWidth + 'px';
        layer.style.height = target.clientHeight + 'px';
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
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
},{"../misc/Dom":36,"tether":14}],23:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var MouseInput_1 = require("../input/MouseInput");
var MouseDragEventSupport_1 = require("../input/MouseDragEventSupport");
var Widget_1 = require("../ui/Widget");
var Extensibility_1 = require("../ui/Extensibility");
var Tether = require("tether");
var Dom = require("../misc/Dom");
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
            .on('RIGHT_ARROW', function () { return _this.selectNeighbor(Vectors.e); })
            .on('LEFT_ARROW', function () { return _this.selectNeighbor(Vectors.w); })
            .on('UP_ARROW', function () { return _this.selectNeighbor(Vectors.n); })
            .on('DOWN_ARROW', function () { return _this.selectNeighbor(Vectors.s); })
            .on('CTRL+RIGHT_ARROW', function () { return _this.selectEdge(Vectors.e); })
            .on('CTRL+LEFT_ARROW', function () { return _this.selectEdge(Vectors.w); })
            .on('CTRL+UP_ARROW', function () { return _this.selectEdge(Vectors.n); })
            .on('CTRL+DOWN_ARROW', function () { return _this.selectEdge(Vectors.s); })
            .on('CTRL+A', function () { return _this.selectAll(); })
            .on('HOME', function () { return _this.selectBorder(Vectors.w); })
            .on('CTRL+HOME', function () { return _this.selectBorder(Vectors.nw); })
            .on('END', function () { return _this.selectBorder(Vectors.e); })
            .on('CTRL+END', function () { return _this.selectBorder(Vectors.se); });
        MouseDragEventSupport_1.MouseDragEventSupport.enable(grid.root);
        MouseInput_1.MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', function (e) { return _this.selectLine(new Point_1.Point(e.gridX, e.gridY)); })
            .on('DOWN:PRIMARY', function (e) { return _this.beginSelectGesture(e.gridX, e.gridY); })
            .on('DRAG:PRIMARY', function (e) { return _this.updateSelectGesture(e.gridX, e.gridY); });
        grid.on('invalidate', function () { return _this.reselect(false); });
        grid.on('scroll', function () { return _this.alignSelectors(false); });
    };
    SelectorExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, {
            pointerEvents: 'none',
            overflow: 'hidden',
            width: target.clientWidth + 'px',
            height: target.clientHeight + 'px',
        });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
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
        var empty = function (cell) { return (cell.value === '' || cell.value === undefined || cell.value === null); };
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
    SelectorExtension.prototype.doSelect = function (cells, autoScroll) {
        if (cells === void 0) { cells = []; }
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
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
        return _super.apply(this, arguments) || this;
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
},{"../geom/Point":24,"../geom/Rect":25,"../input/KeyInput":30,"../input/MouseDragEventSupport":33,"../input/MouseInput":35,"../misc/Dom":36,"../ui/Extensibility":53,"../ui/Widget":56,"tether":14}],24:[function(require,module,exports){
"use strict";
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
},{}],25:[function(require,module,exports){
"use strict";
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
},{"./Point":24}],26:[function(require,module,exports){

},{}],27:[function(require,module,exports){
"use strict";
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
},{"../misc/Util":38}],28:[function(require,module,exports){
"use strict";
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
},{}],29:[function(require,module,exports){
"use strict";
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
},{"./Keys":31}],30:[function(require,module,exports){
"use strict";
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
},{"./EventTargetEventEmitterAdapter":27,"./KeyExpression":29}],31:[function(require,module,exports){
"use strict";
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
},{}],32:[function(require,module,exports){
"use strict";
},{}],33:[function(require,module,exports){
"use strict";
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
},{"../geom/Point":24}],34:[function(require,module,exports){
"use strict";
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
},{"../misc/Util":38,"./KeyCheck":28,"./Keys":31}],35:[function(require,module,exports){
"use strict";
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
},{"./EventTargetEventEmitterAdapter":27,"./KeyCheck":28,"./MouseExpression":34}],36:[function(require,module,exports){
"use strict";
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
},{}],37:[function(require,module,exports){
"use strict";
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
},{}],38:[function(require,module,exports){
"use strict";
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
},{}],39:[function(require,module,exports){
"use strict";
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
},{}],40:[function(require,module,exports){
"use strict";
},{}],41:[function(require,module,exports){
"use strict";
},{}],42:[function(require,module,exports){
"use strict";
},{}],43:[function(require,module,exports){
"use strict";
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var _ = require("../misc/util");
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
     * Selects a resolveExpr of cells from the specified model based on the specified vectors.  The vectors should be
     * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
     * Any cells falling into the rectangle created from these two points will be included in the selected resolveExpr.
     *
     * @param model
     * @param from
     * @param to
     * @param toInclusive
     * @returns {Range}
     */
    GridRange.select = function (model, from, to, toInclusive) {
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
                    results.push(cell.ref);
                }
            }
        }
        return GridRange.create(model, results);
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
},{"../geom/Point":24,"../geom/Rect":25,"../misc/util":39}],44:[function(require,module,exports){
"use strict";
},{}],45:[function(require,module,exports){
"use strict";
var _ = require("../../misc/Util");
var shortid = require("shortid");
/**
 * Provides a by-the-book implementation of GridCell.
 */
var DefaultGridCell = (function () {
    function DefaultGridCell(params) {
        params.ref = params.ref || shortid.generate();
        params.colSpan = params.colSpan || 1;
        params.rowSpan = params.rowSpan || 1;
        params.value = (params.value === undefined || params.value === null) ? '' : params.value;
        _.extend(this, params);
    }
    return DefaultGridCell;
}());
exports.DefaultGridCell = DefaultGridCell;
},{"../../misc/Util":38,"shortid":5}],46:[function(require,module,exports){
"use strict";
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
},{}],47:[function(require,module,exports){
"use strict";
var _ = require("../../misc/Util");
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
},{"../../misc/Util":38}],48:[function(require,module,exports){
"use strict";
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
},{}],49:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var StyledGridCell_1 = require("../styled/StyledGridCell");
var FlexGridCell = (function (_super) {
    __extends(FlexGridCell, _super);
    function FlexGridCell() {
        return _super.apply(this, arguments) || this;
    }
    return FlexGridCell;
}(StyledGridCell_1.StyledGridCell));
exports.FlexGridCell = FlexGridCell;
},{"../styled/StyledGridCell":52}],50:[function(require,module,exports){
"use strict";
var FlexGridController = (function () {
    function FlexGridController() {
    }
    return FlexGridController;
}());
exports.FlexGridController = FlexGridController;
},{}],51:[function(require,module,exports){
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
var Style = (function () {
    function Style(parent, values) {
        this.parent = parent || null;
        if (values) {
            Util_1.extend(this, values);
        }
    }
    return Style;
}());
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
    __metadata("design:type", String)
], Style.prototype, "textAlignment", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], Style.prototype, "textColor", void 0);
__decorate([
    cascade(),
    __metadata("design:type", String)
], Style.prototype, "textFont", void 0);
__decorate([
    cascade(),
    __metadata("design:type", Number)
], Style.prototype, "textSize", void 0);
exports.Style = Style;
exports.BaseStyle = new Style(null, {
    borderColor: 'lightgray',
    fillColor: 'white',
    textAlignment: 'left',
    textColor: 'black',
    textFont: 'Segoe UI',
    textSize: 13,
});
},{"../../misc/Util":38}],52:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DefaultGridCell_1 = require("../default/DefaultGridCell");
var Style_1 = require("./Style");
var Extensibility_1 = require("../../ui/Extensibility");
var StyledGridCell = (function (_super) {
    __extends(StyledGridCell, _super);
    function StyledGridCell() {
        var _this = _super.apply(this, arguments) || this;
        _this.style = Style_1.BaseStyle;
        return _this;
    }
    return StyledGridCell;
}(DefaultGridCell_1.DefaultGridCell));
__decorate([
    Extensibility_1.visualize(),
    __metadata("design:type", Style_1.Style)
], StyledGridCell.prototype, "style", void 0);
StyledGridCell = __decorate([
    Extensibility_1.renderer(draw),
    __metadata("design:paramtypes", [])
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
    gfx.fillStyle = style.textColor;
    gfx.textBaseline = 'middle';
    gfx.font = style.textSize + "px " + style.textFont;
    gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
}
},{"../../ui/Extensibility":53,"../default/DefaultGridCell":45,"./Style":51}],53:[function(require,module,exports){
"use strict";
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
    };
}
exports.visualize = visualize;
},{}],54:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var EventEmitter_1 = require("./internal/EventEmitter");
var GridKernel_1 = require("./GridKernel");
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
        ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(function (x) { return _this.forwardMouseEvent(x); });
        ['keydown', 'keypress', 'keyup']
            .forEach(function (x) { return _this.forwardKeyEvent(x); });
        return _this;
    }
    GridElement.create = function (target) {
        var canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className = ' grid';
        canvas.tabIndex = 0;
        canvas.width = target.clientWidth;
        canvas.height = target.clientHeight;
        target.parentNode.insertBefore(canvas, target);
        target.remove();
        return new GridElement(canvas);
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
        this.kernel.install(ext);
        if (ext.init) {
            ext.init(this, this.kernel);
        }
        return this;
    };
    GridElement.prototype.exec = function (command) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.kernel.commands.exec(command, args);
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
    GridElement.prototype.invalidate = function () {
        this.buffers = {};
        this.layout = GridLayout_1.GridLayout.compute(this.model);
        this.redraw();
        this.emit('invalidate');
    };
    GridElement.prototype.redraw = function () {
        if (!this.dirty) {
            this.dirty = true;
            requestAnimationFrame(this.draw.bind(this));
        }
    };
    GridElement.prototype.draw = function () {
        this.updateVisuals();
        this.drawVisuals();
        this.dirty = false;
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
            var visual = this.createVisual(cell, region);
            // If a previous visual already existed, perform a diff and if there are changes, trash the
            // buffer for this cell so that it is redrawn
            var previous = prevFrame[cell.ref];
            if (!!previous && !previous.equals(visual)) {
                delete this.buffers[cell.ref];
            }
            nextFrame[cell.ref] = visual;
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
                visual[p] = _.shadowClone(cell[p]);
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
    return GridElement;
}(EventEmitter_1.EventEmitterBase));
__decorate([
    Property_1.property(DefaultGridModel_1.DefaultGridModel.empty(), function (t) { return t.invalidate(); }),
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
},{"../geom/Point":24,"../geom/Rect":25,"../misc/Property":37,"../misc/Util":38,"../model/default/DefaultGridModel":47,"./GridKernel":55,"./internal/EventEmitter":57,"./internal/GridLayout":58}],55:[function(require,module,exports){
"use strict";
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
},{}],56:[function(require,module,exports){
"use strict";
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
            return new Rect_1.Rect(parseInt(this.root.style.left), parseInt(this.root.style.top), this.root.clientWidth, this.root.clientHeight);
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
},{"../geom/Rect":25,"../misc/Dom":36}],57:[function(require,module,exports){
"use strict";
EventTarget;
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
},{}],58:[function(require,module,exports){
"use strict";
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
},{"../../geom/Rect":25,"../../misc/Util":38,"../../model/default/DefaultGridColumn":46,"../../model/default/DefaultGridRow":48}],59:[function(require,module,exports){
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
},{"es6-promise":1}]},{},[4,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,45,46,47,48,49,50,40,41,42,43,44,51,52,53,54,55,57,58,56,59])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWZsZWN0LW1ldGFkYXRhL3RlbXAvUmVmbGVjdC5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2FscGhhYmV0LmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2xpYi9lbmNvZGUuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvaXMtdmFsaWQuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvcmFuZG9tL3JhbmRvbS1ieXRlLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvcmFuZG9tL3JhbmRvbS1mcm9tLXNlZWQuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvdXRpbC9jbHVzdGVyLXdvcmtlci1pZC1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RldGhlci9kaXN0L2pzL3RldGhlci5qcyIsInNyYy9fZXhhbXBsZS9FeGFtcGxlR3JpZEJ1aWxkZXIudHMiLCJzcmMvX2V4YW1wbGUvbWFpbi50cyIsInNyYy9leHRlbnNpb25zL0NsaXBib2FyZEV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL0NvbXB1dGVFeHRlbnNpb24udHMiLCJzcmMvZXh0ZW5zaW9ucy9FZGl0aW5nRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvSGlzdG9yeUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL1BhbkV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL1Njcm9sbGVyRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvU2VsZWN0b3JFeHRlbnNpb24udHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvZ2xvYmFsLmQudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qcm9wZXJ0eS50cyIsInNyYy9taXNjL1V0aWwudHMiLCJzcmMvbWlzYy91dGlsLnRzIiwic3JjL21vZGVsL0dyaWRSYW5nZS50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93LnRzIiwic3JjL21vZGVsL2ZsZXgvRmxleEdyaWRDZWxsLnRzIiwic3JjL21vZGVsL2ZsZXgvRmxleEdyaWRDb250cm9sbGVyLnRzIiwic3JjL21vZGVsL3N0eWxlZC9TdHlsZS50cyIsInNyYy9tb2RlbC9zdHlsZWQvU3R5bGVkR3JpZENlbGwudHMiLCJzcmMvdWkvRXh0ZW5zaWJpbGl0eS50cyIsInNyYy91aS9HcmlkRWxlbWVudC50cyIsInNyYy91aS9HcmlkS2VybmVsLnRzIiwic3JjL3VpL1dpZGdldC50cyIsInNyYy91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXIudHMiLCJzcmMvdWkvaW50ZXJuYWwvR3JpZExheW91dC50cyIsInNyYy92ZW5kb3IvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwb0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNybUNBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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TSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDNUIsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsS0FBSyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDeEMsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsS0FBSyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDMUMsS0FBSyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDaEQsS0FBSyxjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUM7Z0JBQ0ksRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDO29CQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQztnQkFDbEMsSUFBSTtvQkFDQSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBQ0wsV0FBQztBQUFELENBeFBBLEFBd1BDO0FBdFBpQixjQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBRyxHQUFHLENBQUMsQ0FBQztBQUNSLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLFFBQUcsR0FBRyxFQUFFLENBQUM7QUFDVCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNmLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBTyxHQUFHLEVBQUUsQ0FBQztBQUNiLGNBQVMsR0FBRyxFQUFFLENBQUM7QUFDZixRQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ1QsU0FBSSxHQUFHLEVBQUUsQ0FBQztBQUNWLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsYUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNkLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLGVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsV0FBTSxHQUFHLEVBQUUsQ0FBQztBQUNaLFdBQU0sR0FBRyxFQUFFLENBQUM7QUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztBQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFB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LEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0lBRUYsU0FBUyxDQUFDLEtBQUssR0FBRztRQUNkLE1BQU0sQ0FBQyxJQUFJLHFCQUFPLENBQUMsVUFBUyxPQUFPLEVBQUUsTUFBTTtZQUN2QyxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNWLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osdUNBQXVDO2dCQUN2QyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztBQUNOLENBQUM7QUFRWSxRQUFBLFNBQVMsR0FBRyxTQUFTLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBAb3ZlcnZpZXcgZXM2LXByb21pc2UgLSBhIHRpbnkgaW1wbGVtZW50YXRpb24gb2YgUHJvbWlzZXMvQSsuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAoYykgMjAxNCBZZWh1ZGEgS2F0eiwgVG9tIERhbGUsIFN0ZWZhbiBQZW5uZXIgYW5kIGNvbnRyaWJ1dG9ycyAoQ29udmVyc2lvbiB0byBFUzYgQVBJIGJ5IEpha2UgQXJjaGliYWxkKVxuICogQGxpY2Vuc2UgICBMaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZVxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3N0ZWZhbnBlbm5lci9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICA0LjAuNVxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gICAgKGdsb2JhbC5FUzZQcm9taXNlID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nO1xufVxuXG52YXIgX2lzQXJyYXkgPSB1bmRlZmluZWQ7XG5pZiAoIUFycmF5LmlzQXJyYXkpIHtcbiAgX2lzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG59IGVsc2Uge1xuICBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG59XG5cbnZhciBpc0FycmF5ID0gX2lzQXJyYXk7XG5cbnZhciBsZW4gPSAwO1xudmFyIHZlcnR4TmV4dCA9IHVuZGVmaW5lZDtcbnZhciBjdXN0b21TY2hlZHVsZXJGbiA9IHVuZGVmaW5lZDtcblxudmFyIGFzYXAgPSBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgcXVldWVbbGVuXSA9IGNhbGxiYWNrO1xuICBxdWV1ZVtsZW4gKyAxXSA9IGFyZztcbiAgbGVuICs9IDI7XG4gIGlmIChsZW4gPT09IDIpIHtcbiAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgaWYgKGN1c3RvbVNjaGVkdWxlckZuKSB7XG4gICAgICBjdXN0b21TY2hlZHVsZXJGbihmbHVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gIGN1c3RvbVNjaGVkdWxlckZuID0gc2NoZWR1bGVGbjtcbn1cblxuZnVuY3Rpb24gc2V0QXNhcChhc2FwRm4pIHtcbiAgYXNhcCA9IGFzYXBGbjtcbn1cblxudmFyIGJyb3dzZXJXaW5kb3cgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbnZhciBicm93c2VyR2xvYmFsID0gYnJvd3NlcldpbmRvdyB8fCB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgaXNOb2RlID0gdHlwZW9mIHNlbGYgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAoe30pLnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuLy8gdGVzdCBmb3Igd2ViIHdvcmtlciBidXQgbm90IGluIElFMTBcbnZhciBpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGltcG9ydFNjcmlwdHMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIG5vZGVcbmZ1bmN0aW9uIHVzZU5leHRUaWNrKCkge1xuICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jdWpvanMvd2hlbi9pc3N1ZXMvNDEwIGZvciBkZXRhaWxzXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICB9O1xufVxuXG4vLyB2ZXJ0eFxuZnVuY3Rpb24gdXNlVmVydHhUaW1lcigpIHtcbiAgaWYgKHR5cGVvZiB2ZXJ0eE5leHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZlcnR4TmV4dChmbHVzaCk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gIHZhciBpdGVyYXRpb25zID0gMDtcbiAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgbm9kZS5kYXRhID0gaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDI7XG4gIH07XG59XG5cbi8vIHdlYiB3b3JrZXJcbmZ1bmN0aW9uIHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VTZXRUaW1lb3V0KCkge1xuICAvLyBTdG9yZSBzZXRUaW1lb3V0IHJlZmVyZW5jZSBzbyBlczYtcHJvbWlzZSB3aWxsIGJlIHVuYWZmZWN0ZWQgYnlcbiAgLy8gb3RoZXIgY29kZSBtb2RpZnlpbmcgc2V0VGltZW91dCAobGlrZSBzaW5vbi51c2VGYWtlVGltZXJzKCkpXG4gIHZhciBnbG9iYWxTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZ2xvYmFsU2V0VGltZW91dChmbHVzaCwgMSk7XG4gIH07XG59XG5cbnZhciBxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gcXVldWVbaV07XG4gICAgdmFyIGFyZyA9IHF1ZXVlW2kgKyAxXTtcblxuICAgIGNhbGxiYWNrKGFyZyk7XG5cbiAgICBxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICBxdWV1ZVtpICsgMV0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBsZW4gPSAwO1xufVxuXG5mdW5jdGlvbiBhdHRlbXB0VmVydHgoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHIgPSByZXF1aXJlO1xuICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgdmVydHhOZXh0ID0gdmVydHgucnVuT25Mb29wIHx8IHZlcnR4LnJ1bk9uQ29udGV4dDtcbiAgICByZXR1cm4gdXNlVmVydHhUaW1lcigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHVzZVNldFRpbWVvdXQoKTtcbiAgfVxufVxuXG52YXIgc2NoZWR1bGVGbHVzaCA9IHVuZGVmaW5lZDtcbi8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG5pZiAoaXNOb2RlKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VOZXh0VGljaygpO1xufSBlbHNlIGlmIChCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTXV0YXRpb25PYnNlcnZlcigpO1xufSBlbHNlIGlmIChpc1dvcmtlcikge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTWVzc2FnZUNoYW5uZWwoKTtcbn0gZWxzZSBpZiAoYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSBhdHRlbXB0VmVydHgoKTtcbn0gZWxzZSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgdmFyIF9hcmd1bWVudHMgPSBhcmd1bWVudHM7XG5cbiAgdmFyIHBhcmVudCA9IHRoaXM7XG5cbiAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3Iobm9vcCk7XG5cbiAgaWYgKGNoaWxkW1BST01JU0VfSURdID09PSB1bmRlZmluZWQpIHtcbiAgICBtYWtlUHJvbWlzZShjaGlsZCk7XG4gIH1cblxuICB2YXIgX3N0YXRlID0gcGFyZW50Ll9zdGF0ZTtcblxuICBpZiAoX3N0YXRlKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWxsYmFjayA9IF9hcmd1bWVudHNbX3N0YXRlIC0gMV07XG4gICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUNhbGxiYWNrKF9zdGF0ZSwgY2hpbGQsIGNhbGxiYWNrLCBwYXJlbnQuX3Jlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9KSgpO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gIH1cblxuICByZXR1cm4gY2hpbGQ7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yZXNvbHZlYCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlc29sdmVkIHdpdGggdGhlXG4gIHBhc3NlZCBgdmFsdWVgLiBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVzb2x2ZSgxKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoMSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZXNvbHZlXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBbnl9IHZhbHVlIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCB3aXRoXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgZnVsZmlsbGVkIHdpdGggdGhlIGdpdmVuXG4gIGB2YWx1ZWBcbiovXG5mdW5jdGlvbiByZXNvbHZlKG9iamVjdCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcbiAgX3Jlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5cbnZhciBQUk9NSVNFX0lEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDE2KTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBQRU5ESU5HID0gdm9pZCAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgPSAyO1xuXG52YXIgR0VUX1RIRU5fRVJST1IgPSBuZXcgRXJyb3JPYmplY3QoKTtcblxuZnVuY3Rpb24gc2VsZkZ1bGZpbGxtZW50KCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG59XG5cbmZ1bmN0aW9uIGNhbm5vdFJldHVybk93bigpIHtcbiAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihwcm9taXNlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgIHJldHVybiBHRVRfVEhFTl9FUlJPUjtcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgdHJ5IHtcbiAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgYXNhcChmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICB2YXIgZXJyb3IgPSB0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChzZWFsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgX3JlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgfVxuICB9LCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gRlVMRklMTEVEKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IFJFSkVDVEVEKSB7XG4gICAgX3JlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgfSBlbHNlIHtcbiAgICBzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHJldHVybiBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuJCQpIHtcbiAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IgJiYgdGhlbiQkID09PSB0aGVuICYmIG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IucmVzb2x2ZSA9PT0gcmVzb2x2ZSkge1xuICAgIGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICB9IGVsc2Uge1xuICAgIGlmICh0aGVuJCQgPT09IEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICB9IGVsc2UgaWYgKHRoZW4kJCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih0aGVuJCQpKSB7XG4gICAgICBoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbiQkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgX3JlamVjdChwcm9taXNlLCBzZWxmRnVsZmlsbG1lbnQoKSk7XG4gIH0gZWxzZSBpZiAob2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlLCBnZXRUaGVuKHZhbHVlKSk7XG4gIH0gZWxzZSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gIGlmIChwcm9taXNlLl9vbmVycm9yKSB7XG4gICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICB9XG5cbiAgcHVibGlzaChwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgcHJvbWlzZS5fc3RhdGUgPSBGVUxGSUxMRUQ7XG5cbiAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgIGFzYXAocHVibGlzaCwgcHJvbWlzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3JlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQ7XG4gIHByb21pc2UuX3Jlc3VsdCA9IHJlYXNvbjtcblxuICBhc2FwKHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgdmFyIF9zdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gIHZhciBsZW5ndGggPSBfc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgX3N1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgX3N1YnNjcmliZXJzW2xlbmd0aCArIEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICBfc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdID0gb25SZWplY3Rpb247XG5cbiAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgYXNhcChwdWJsaXNoLCBwYXJlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2gocHJvbWlzZSkge1xuICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGNoaWxkID0gdW5kZWZpbmVkLFxuICAgICAgY2FsbGJhY2sgPSB1bmRlZmluZWQsXG4gICAgICBkZXRhaWwgPSBwcm9taXNlLl9yZXN1bHQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICB9XG4gIH1cblxuICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiBFcnJvck9iamVjdCgpIHtcbiAgdGhpcy5lcnJvciA9IG51bGw7XG59XG5cbnZhciBUUllfQ0FUQ0hfRVJST1IgPSBuZXcgRXJyb3JPYmplY3QoKTtcblxuZnVuY3Rpb24gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICB0cnkge1xuICAgIHJldHVybiBjYWxsYmFjayhkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICByZXR1cm4gVFJZX0NBVENIX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSA9IHVuZGVmaW5lZCxcbiAgICAgIGVycm9yID0gdW5kZWZpbmVkLFxuICAgICAgc3VjY2VlZGVkID0gdW5kZWZpbmVkLFxuICAgICAgZmFpbGVkID0gdW5kZWZpbmVkO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHZhbHVlID0gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICBpZiAodmFsdWUgPT09IFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICB2YWx1ZSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIC8vIG5vb3BcbiAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICAgIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gUkVKRUNURUQpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVByb21pc2UocHJvbWlzZSwgcmVzb2x2ZXIpIHtcbiAgdHJ5IHtcbiAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIGUpO1xuICB9XG59XG5cbnZhciBpZCA9IDA7XG5mdW5jdGlvbiBuZXh0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG5mdW5jdGlvbiBtYWtlUHJvbWlzZShwcm9taXNlKSB7XG4gIHByb21pc2VbUFJPTUlTRV9JRF0gPSBpZCsrO1xuICBwcm9taXNlLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gdW5kZWZpbmVkO1xuICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IFtdO1xufVxuXG5mdW5jdGlvbiBFbnVtZXJhdG9yKENvbnN0cnVjdG9yLCBpbnB1dCkge1xuICB0aGlzLl9pbnN0YW5jZUNvbnN0cnVjdG9yID0gQ29uc3RydWN0b3I7XG4gIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoIXRoaXMucHJvbWlzZVtQUk9NSVNFX0lEXSkge1xuICAgIG1ha2VQcm9taXNlKHRoaXMucHJvbWlzZSk7XG4gIH1cblxuICBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgIHRoaXMubGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuICAgIHRoaXMuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IHRoaXMubGVuZ3RoIHx8IDA7XG4gICAgICB0aGlzLl9lbnVtZXJhdGUoKTtcbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIF9yZWplY3QodGhpcy5wcm9taXNlLCB2YWxpZGF0aW9uRXJyb3IoKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGlvbkVycm9yKCkge1xuICByZXR1cm4gbmV3IEVycm9yKCdBcnJheSBNZXRob2RzIG11c3QgYmUgcHJvdmlkZWQgYW4gQXJyYXknKTtcbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgdmFyIF9pbnB1dCA9IHRoaXMuX2lucHV0O1xuXG4gIGZvciAodmFyIGkgPSAwOyB0aGlzLl9zdGF0ZSA9PT0gUEVORElORyAmJiBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLl9lYWNoRW50cnkoX2lucHV0W2ldLCBpKTtcbiAgfVxufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uIChlbnRyeSwgaSkge1xuICB2YXIgYyA9IHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3I7XG4gIHZhciByZXNvbHZlJCQgPSBjLnJlc29sdmU7XG5cbiAgaWYgKHJlc29sdmUkJCA9PT0gcmVzb2x2ZSkge1xuICAgIHZhciBfdGhlbiA9IGdldFRoZW4oZW50cnkpO1xuXG4gICAgaWYgKF90aGVuID09PSB0aGVuICYmIGVudHJ5Ll9zdGF0ZSAhPT0gUEVORElORykge1xuICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuICAgICAgdGhpcy5fcmVzdWx0W2ldID0gZW50cnk7XG4gICAgfSBlbHNlIGlmIChjID09PSBQcm9taXNlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBjKG5vb3ApO1xuICAgICAgaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgX3RoZW4pO1xuICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl93aWxsU2V0dGxlQXQobmV3IGMoZnVuY3Rpb24gKHJlc29sdmUkJCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSQkKGVudHJ5KTtcbiAgICAgIH0pLCBpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fd2lsbFNldHRsZUF0KHJlc29sdmUkJChlbnRyeSksIGkpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24gKHN0YXRlLCBpLCB2YWx1ZSkge1xuICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IFBFTkRJTkcpIHtcbiAgICB0aGlzLl9yZW1haW5pbmctLTtcblxuICAgIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fd2lsbFNldHRsZUF0ID0gZnVuY3Rpb24gKHByb21pc2UsIGkpIHtcbiAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gIHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gZW51bWVyYXRvci5fc2V0dGxlZEF0KFJFSkVDVEVELCBpLCByZWFzb24pO1xuICB9KTtcbn07XG5cbi8qKlxuICBgUHJvbWlzZS5hbGxgIGFjY2VwdHMgYW4gYXJyYXkgb2YgcHJvbWlzZXMsIGFuZCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2hcbiAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgb2YgZnVsZmlsbG1lbnQgdmFsdWVzIGZvciB0aGUgcGFzc2VkIHByb21pc2VzLCBvclxuICByZWplY3RlZCB3aXRoIHRoZSByZWFzb24gb2YgdGhlIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIGJlIHJlamVjdGVkLiBJdCBjYXN0cyBhbGxcbiAgZWxlbWVudHMgb2YgdGhlIHBhc3NlZCBpdGVyYWJsZSB0byBwcm9taXNlcyBhcyBpdCBydW5zIHRoaXMgYWxnb3JpdGhtLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSByZXNvbHZlKDEpO1xuICBsZXQgcHJvbWlzZTIgPSByZXNvbHZlKDIpO1xuICBsZXQgcHJvbWlzZTMgPSByZXNvbHZlKDMpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gVGhlIGFycmF5IGhlcmUgd291bGQgYmUgWyAxLCAyLCAzIF07XG4gIH0pO1xuICBgYGBcblxuICBJZiBhbnkgb2YgdGhlIGBwcm9taXNlc2AgZ2l2ZW4gdG8gYGFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgcmVqZWN0aW9uIGhhbmRsZXIuIEZvciBleGFtcGxlOlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSByZXNvbHZlKDEpO1xuICBsZXQgcHJvbWlzZTIgPSByZWplY3QobmV3IEVycm9yKFwiMlwiKSk7XG4gIGxldCBwcm9taXNlMyA9IHJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgbGV0IHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIGFsbFxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IGVudHJpZXMgYXJyYXkgb2YgcHJvbWlzZXNcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgbGFiZWxpbmcgdGhlIHByb21pc2UuXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCBgcHJvbWlzZXNgIGhhdmUgYmVlblxuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIGlmIGFueSBvZiB0aGVtIGJlY29tZSByZWplY3RlZC5cbiAgQHN0YXRpY1xuKi9cbmZ1bmN0aW9uIGFsbChlbnRyaWVzKSB7XG4gIHJldHVybiBuZXcgRW51bWVyYXRvcih0aGlzLCBlbnRyaWVzKS5wcm9taXNlO1xufVxuXG4vKipcbiAgYFByb21pc2UucmFjZWAgcmV0dXJucyBhIG5ldyBwcm9taXNlIHdoaWNoIGlzIHNldHRsZWQgaW4gdGhlIHNhbWUgd2F5IGFzIHRoZVxuICBmaXJzdCBwYXNzZWQgcHJvbWlzZSB0byBzZXR0bGUuXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZSgncHJvbWlzZSAxJyk7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgbGV0IHByb21pc2UyID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDInKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBQcm9taXNlLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyByZXN1bHQgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgaXQgd2FzIHJlc29sdmVkIGJlZm9yZSBwcm9taXNlMVxuICAgIC8vIHdhcyByZXNvbHZlZC5cbiAgfSk7XG4gIGBgYFxuXG4gIGBQcm9taXNlLnJhY2VgIGlzIGRldGVybWluaXN0aWMgaW4gdGhhdCBvbmx5IHRoZSBzdGF0ZSBvZiB0aGUgZmlyc3RcbiAgc2V0dGxlZCBwcm9taXNlIG1hdHRlcnMuIEZvciBleGFtcGxlLCBldmVuIGlmIG90aGVyIHByb21pc2VzIGdpdmVuIHRvIHRoZVxuICBgcHJvbWlzZXNgIGFycmF5IGFyZ3VtZW50IGFyZSByZXNvbHZlZCwgYnV0IHRoZSBmaXJzdCBzZXR0bGVkIHByb21pc2UgaGFzXG4gIGJlY29tZSByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICBwcm9taXNlIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ3Byb21pc2UgMicpKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBQcm9taXNlLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVuc1xuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAncHJvbWlzZSAyJyBiZWNhdXNlIHByb21pc2UgMiBiZWNhbWUgcmVqZWN0ZWQgYmVmb3JlXG4gICAgLy8gcHJvbWlzZSAxIGJlY2FtZSBmdWxmaWxsZWRcbiAgfSk7XG4gIGBgYFxuXG4gIEFuIGV4YW1wbGUgcmVhbC13b3JsZCB1c2UgY2FzZSBpcyBpbXBsZW1lbnRpbmcgdGltZW91dHM6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBQcm9taXNlLnJhY2UoW2FqYXgoJ2Zvby5qc29uJyksIHRpbWVvdXQoNTAwMCldKVxuICBgYGBcblxuICBAbWV0aG9kIHJhY2VcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FycmF5fSBwcm9taXNlcyBhcnJheSBvZiBwcm9taXNlcyB0byBvYnNlcnZlXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHdoaWNoIHNldHRsZXMgaW4gdGhlIHNhbWUgd2F5IGFzIHRoZSBmaXJzdCBwYXNzZWRcbiAgcHJvbWlzZSB0byBzZXR0bGUuXG4qL1xuZnVuY3Rpb24gcmFjZShlbnRyaWVzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKCFpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiAoXywgcmVqZWN0KSB7XG4gICAgICByZXR1cm4gcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIENvbnN0cnVjdG9yLnJlc29sdmUoZW50cmllc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yZWplY3RgIHJldHVybnMgYSBwcm9taXNlIHJlamVjdGVkIHdpdGggdGhlIHBhc3NlZCBgcmVhc29uYC5cbiAgSXQgaXMgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEluc3RlYWQgb2Ygd3JpdGluZyB0aGUgYWJvdmUsIHlvdXIgY29kZSBub3cgc2ltcGx5IGJlY29tZXMgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyBDb2RlIGhlcmUgZG9lc24ndCBydW4gYmVjYXVzZSB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCFcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ1dIT09QUydcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmVqZWN0XG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBbnl9IHJlYXNvbiB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQgd2l0aC5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgZ2l2ZW4gYHJlYXNvbmAuXG4qL1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcbiAgX3JlamVjdChwcm9taXNlLCByZWFzb24pO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gbmVlZHNSZXNvbHZlcigpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xufVxuXG5mdW5jdGlvbiBuZWVkc05ldygpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbn1cblxuLyoqXG4gIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGUgcmVhc29uXG4gIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gIFRlcm1pbm9sb2d5XG4gIC0tLS0tLS0tLS0tXG5cbiAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAtIGB2YWx1ZWAgaXMgYW55IGxlZ2FsIEphdmFTY3JpcHQgdmFsdWUgKGluY2x1ZGluZyB1bmRlZmluZWQsIGEgdGhlbmFibGUsIG9yIGEgcHJvbWlzZSkuXG4gIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gIC0gYHNldHRsZWRgIHRoZSBmaW5hbCByZXN0aW5nIHN0YXRlIG9mIGEgcHJvbWlzZSwgZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuXG4gIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICBzdGF0ZS4gIFByb21pc2VzIHRoYXQgYXJlIHJlamVjdGVkIGhhdmUgYSByZWplY3Rpb24gcmVhc29uIGFuZCBhcmUgaW4gdGhlXG4gIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICBwcm9taXNlLCB0aGVuIHRoZSBvcmlnaW5hbCBwcm9taXNlJ3Mgc2V0dGxlZCBzdGF0ZSB3aWxsIG1hdGNoIHRoZSB2YWx1ZSdzXG4gIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gIGl0c2VsZiBmdWxmaWxsLlxuXG5cbiAgQmFzaWMgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLVxuXG4gIGBgYGpzXG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gb24gc3VjY2Vzc1xuICAgIHJlc29sdmUodmFsdWUpO1xuXG4gICAgLy8gb24gZmFpbHVyZVxuICAgIHJlamVjdChyZWFzb24pO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvLyBvbiBmdWxmaWxsbWVudFxuICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAvLyBvbiByZWplY3Rpb25cbiAgfSk7XG4gIGBgYFxuXG4gIEFkdmFuY2VkIFVzYWdlOlxuICAtLS0tLS0tLS0tLS0tLS1cblxuICBQcm9taXNlcyBzaGluZSB3aGVuIGFic3RyYWN0aW5nIGF3YXkgYXN5bmNocm9ub3VzIGludGVyYWN0aW9ucyBzdWNoIGFzXG4gIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gIGBgYGpzXG4gIGZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSB0aGlzLkRPTkUpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICBgYGBqc1xuICBQcm9taXNlLmFsbChbXG4gICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgXSkudGhlbihmdW5jdGlvbih2YWx1ZXMpe1xuICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9KTtcbiAgYGBgXG5cbiAgQGNsYXNzIFByb21pc2VcbiAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAY29uc3RydWN0b3JcbiovXG5mdW5jdGlvbiBQcm9taXNlKHJlc29sdmVyKSB7XG4gIHRoaXNbUFJPTUlTRV9JRF0gPSBuZXh0SWQoKTtcbiAgdGhpcy5fcmVzdWx0ID0gdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgaWYgKG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgdHlwZW9mIHJlc29sdmVyICE9PSAnZnVuY3Rpb24nICYmIG5lZWRzUmVzb2x2ZXIoKTtcbiAgICB0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSA/IGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKSA6IG5lZWRzTmV3KCk7XG4gIH1cbn1cblxuUHJvbWlzZS5hbGwgPSBhbGw7XG5Qcm9taXNlLnJhY2UgPSByYWNlO1xuUHJvbWlzZS5yZXNvbHZlID0gcmVzb2x2ZTtcblByb21pc2UucmVqZWN0ID0gcmVqZWN0O1xuUHJvbWlzZS5fc2V0U2NoZWR1bGVyID0gc2V0U2NoZWR1bGVyO1xuUHJvbWlzZS5fc2V0QXNhcCA9IHNldEFzYXA7XG5Qcm9taXNlLl9hc2FwID0gYXNhcDtcblxuUHJvbWlzZS5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBQcm9taXNlLFxuXG4gIC8qKlxuICAgIFRoZSBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLFxuICAgIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIC8vIHVzZXIgaXMgYXZhaWxhYmxlXG4gICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIHVzZXIgaXMgdW5hdmFpbGFibGUsIGFuZCB5b3UgYXJlIGdpdmVuIHRoZSByZWFzb24gd2h5XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIENoYWluaW5nXG4gICAgLS0tLS0tLS1cbiAgXG4gICAgVGhlIHJldHVybiB2YWx1ZSBvZiBgdGhlbmAgaXMgaXRzZWxmIGEgcHJvbWlzZS4gIFRoaXMgc2Vjb25kLCAnZG93bnN0cmVhbSdcbiAgICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICByZXR1cm4gdXNlci5uYW1lO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHJldHVybiAnZGVmYXVsdCBuYW1lJztcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyTmFtZSkge1xuICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgLy8gd2lsbCBiZSBgJ2RlZmF1bHQgbmFtZSdgXG4gICAgfSk7XG4gIFxuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgIC8vIElmIGBmaW5kVXNlcmAgcmVqZWN0ZWQsIGByZWFzb25gIHdpbGwgYmUgJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknLlxuICAgIH0pO1xuICAgIGBgYFxuICAgIElmIHRoZSBkb3duc3RyZWFtIHByb21pc2UgZG9lcyBub3Qgc3BlY2lmeSBhIHJlamVjdGlvbiBoYW5kbGVyLCByZWplY3Rpb24gcmVhc29ucyB3aWxsIGJlIHByb3BhZ2F0ZWQgZnVydGhlciBkb3duc3RyZWFtLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBBc3NpbWlsYXRpb25cbiAgICAtLS0tLS0tLS0tLS1cbiAgXG4gICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICByZXRyaWV2ZWQgYXN5bmNocm9ub3VzbHkuIFRoaXMgY2FuIGJlIGFjaGlldmVkIGJ5IHJldHVybmluZyBhIHByb21pc2UgaW4gdGhlXG4gICAgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uIGhhbmRsZXIuIFRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCB0aGVuIGJlIHBlbmRpbmdcbiAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgLy8gVGhlIHVzZXIncyBjb21tZW50cyBhcmUgbm93IGF2YWlsYWJsZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCBmdWxmaWxscywgd2UnbGwgaGF2ZSB0aGUgdmFsdWUgaGVyZVxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgU2ltcGxlIEV4YW1wbGVcbiAgICAtLS0tLS0tLS0tLS0tLVxuICBcbiAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBsZXQgcmVzdWx0O1xuICBcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAvLyBmYWlsdXJlXG4gICAgfVxuICAgIGBgYFxuICBcbiAgICBFcnJiYWNrIEV4YW1wbGVcbiAgXG4gICAgYGBganNcbiAgICBmaW5kUmVzdWx0KGZ1bmN0aW9uKHJlc3VsdCwgZXJyKXtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBQcm9taXNlIEV4YW1wbGU7XG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBmaW5kUmVzdWx0KCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBmYWlsdXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAtLS0tLS0tLS0tLS0tLVxuICBcbiAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBsZXQgYXV0aG9yLCBib29rcztcbiAgXG4gICAgdHJ5IHtcbiAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgIGJvb2tzICA9IGZpbmRCb29rc0J5QXV0aG9yKGF1dGhvcik7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9XG4gICAgYGBgXG4gIFxuICAgIEVycmJhY2sgRXhhbXBsZVxuICBcbiAgICBgYGBqc1xuICBcbiAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG4gIFxuICAgIH1cbiAgXG4gICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcbiAgXG4gICAgfVxuICBcbiAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICBmYWlsdXJlKHJlYXNvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFByb21pc2UgRXhhbXBsZTtcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGZpbmRBdXRob3IoKS5cbiAgICAgIHRoZW4oZmluZEJvb2tzQnlBdXRob3IpLlxuICAgICAgdGhlbihmdW5jdGlvbihib29rcyl7XG4gICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEBtZXRob2QgdGhlblxuICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAqL1xuICB0aGVuOiB0aGVuLFxuXG4gIC8qKlxuICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICBhcyB0aGUgY2F0Y2ggYmxvY2sgb2YgYSB0cnkvY2F0Y2ggc3RhdGVtZW50LlxuICBcbiAgICBgYGBqc1xuICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgIH1cbiAgXG4gICAgLy8gc3luY2hyb25vdXNcbiAgICB0cnkge1xuICAgICAgZmluZEF1dGhvcigpO1xuICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH1cbiAgXG4gICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgIGZpbmRBdXRob3IoKS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQG1ldGhvZCBjYXRjaFxuICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG4gICdjYXRjaCc6IGZ1bmN0aW9uIF9jYXRjaChvblJlamVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICB9XG59O1xuXG5mdW5jdGlvbiBwb2x5ZmlsbCgpIHtcbiAgICB2YXIgbG9jYWwgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbG9jYWwgPSBzZWxmO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICBpZiAoUCkge1xuICAgICAgICB2YXIgcHJvbWlzZVRvU3RyaW5nID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2VUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHNpbGVudGx5IGlnbm9yZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9taXNlVG9TdHJpbmcgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsb2NhbC5Qcm9taXNlID0gUHJvbWlzZTtcbn1cblxuLy8gU3RyYW5nZSBjb21wYXQuLlxuUHJvbWlzZS5wb2x5ZmlsbCA9IHBvbHlmaWxsO1xuUHJvbWlzZS5Qcm9taXNlID0gUHJvbWlzZTtcblxucmV0dXJuIFByb21pc2U7XG5cbn0pKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lczYtcHJvbWlzZS5tYXAiLCIvKiFcblx0UGFwYSBQYXJzZVxuXHR2NC4xLjJcblx0aHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZVxuKi9cbihmdW5jdGlvbihnbG9iYWwpXG57XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBJU19XT1JLRVIgPSAhZ2xvYmFsLmRvY3VtZW50ICYmICEhZ2xvYmFsLnBvc3RNZXNzYWdlLFxuXHRcdElTX1BBUEFfV09SS0VSID0gSVNfV09SS0VSICYmIC8oXFw/fCYpcGFwYXdvcmtlcig9fCZ8JCkvLnRlc3QoZ2xvYmFsLmxvY2F0aW9uLnNlYXJjaCksXG5cdFx0TE9BREVEX1NZTkMgPSBmYWxzZSwgQVVUT19TQ1JJUFRfUEFUSDtcblx0dmFyIHdvcmtlcnMgPSB7fSwgd29ya2VySWRDb3VudGVyID0gMDtcblxuXHR2YXIgUGFwYSA9IHt9O1xuXG5cdFBhcGEucGFyc2UgPSBDc3ZUb0pzb247XG5cdFBhcGEudW5wYXJzZSA9IEpzb25Ub0NzdjtcblxuXHRQYXBhLlJFQ09SRF9TRVAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDMwKTtcblx0UGFwYS5VTklUX1NFUCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzEpO1xuXHRQYXBhLkJZVEVfT1JERVJfTUFSSyA9IFwiXFx1ZmVmZlwiO1xuXHRQYXBhLkJBRF9ERUxJTUlURVJTID0gW1wiXFxyXCIsIFwiXFxuXCIsIFwiXFxcIlwiLCBQYXBhLkJZVEVfT1JERVJfTUFSS107XG5cdFBhcGEuV09SS0VSU19TVVBQT1JURUQgPSAhSVNfV09SS0VSICYmICEhZ2xvYmFsLldvcmtlcjtcblx0UGFwYS5TQ1JJUFRfUEFUSCA9IG51bGw7XHQvLyBNdXN0IGJlIHNldCBieSB5b3VyIGNvZGUgaWYgeW91IHVzZSB3b3JrZXJzIGFuZCB0aGlzIGxpYiBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHlcblxuXHQvLyBDb25maWd1cmFibGUgY2h1bmsgc2l6ZXMgZm9yIGxvY2FsIGFuZCByZW1vdGUgZmlsZXMsIHJlc3BlY3RpdmVseVxuXHRQYXBhLkxvY2FsQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiAxMDtcdC8vIDEwIE1CXG5cdFBhcGEuUmVtb3RlQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiA1O1x0Ly8gNSBNQlxuXHRQYXBhLkRlZmF1bHREZWxpbWl0ZXIgPSBcIixcIjtcdFx0XHQvLyBVc2VkIGlmIG5vdCBzcGVjaWZpZWQgYW5kIGRldGVjdGlvbiBmYWlsc1xuXG5cdC8vIEV4cG9zZWQgZm9yIHRlc3RpbmcgYW5kIGRldmVsb3BtZW50IG9ubHlcblx0UGFwYS5QYXJzZXIgPSBQYXJzZXI7XG5cdFBhcGEuUGFyc2VySGFuZGxlID0gUGFyc2VySGFuZGxlO1xuXHRQYXBhLk5ldHdvcmtTdHJlYW1lciA9IE5ldHdvcmtTdHJlYW1lcjtcblx0UGFwYS5GaWxlU3RyZWFtZXIgPSBGaWxlU3RyZWFtZXI7XG5cdFBhcGEuU3RyaW5nU3RyZWFtZXIgPSBTdHJpbmdTdHJlYW1lcjtcblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXG5cdHtcblx0XHQvLyBFeHBvcnQgdG8gTm9kZS4uLlxuXHRcdG1vZHVsZS5leHBvcnRzID0gUGFwYTtcblx0fVxuXHRlbHNlIGlmIChpc0Z1bmN0aW9uKGdsb2JhbC5kZWZpbmUpICYmIGdsb2JhbC5kZWZpbmUuYW1kKVxuXHR7XG5cdFx0Ly8gV2lyZXVwIHdpdGggUmVxdWlyZUpTXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gUGFwYTsgfSk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Ly8gLi4ub3IgYXMgYnJvd3NlciBnbG9iYWxcblx0XHRnbG9iYWwuUGFwYSA9IFBhcGE7XG5cdH1cblxuXHRpZiAoZ2xvYmFsLmpRdWVyeSlcblx0e1xuXHRcdHZhciAkID0gZ2xvYmFsLmpRdWVyeTtcblx0XHQkLmZuLnBhcnNlID0gZnVuY3Rpb24ob3B0aW9ucylcblx0XHR7XG5cdFx0XHR2YXIgY29uZmlnID0gb3B0aW9ucy5jb25maWcgfHwge307XG5cdFx0XHR2YXIgcXVldWUgPSBbXTtcblxuXHRcdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKGlkeClcblx0XHRcdHtcblx0XHRcdFx0dmFyIHN1cHBvcnRlZCA9ICQodGhpcykucHJvcCgndGFnTmFtZScpLnRvVXBwZXJDYXNlKCkgPT0gXCJJTlBVVFwiXG5cdFx0XHRcdFx0XHRcdFx0JiYgJCh0aGlzKS5hdHRyKCd0eXBlJykudG9Mb3dlckNhc2UoKSA9PSBcImZpbGVcIlxuXHRcdFx0XHRcdFx0XHRcdCYmIGdsb2JhbC5GaWxlUmVhZGVyO1xuXG5cdFx0XHRcdGlmICghc3VwcG9ydGVkIHx8ICF0aGlzLmZpbGVzIHx8IHRoaXMuZmlsZXMubGVuZ3RoID09IDApXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHQvLyBjb250aW51ZSB0byBuZXh0IGlucHV0IGVsZW1lbnRcblxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmlsZXMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRxdWV1ZS5wdXNoKHtcblx0XHRcdFx0XHRcdGZpbGU6IHRoaXMuZmlsZXNbaV0sXG5cdFx0XHRcdFx0XHRpbnB1dEVsZW06IHRoaXMsXG5cdFx0XHRcdFx0XHRpbnN0YW5jZUNvbmZpZzogJC5leHRlbmQoe30sIGNvbmZpZylcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcdC8vIGJlZ2luIHBhcnNpbmdcblx0XHRcdHJldHVybiB0aGlzO1x0XHQvLyBtYWludGFpbnMgY2hhaW5hYmlsaXR5XG5cblxuXHRcdFx0ZnVuY3Rpb24gcGFyc2VOZXh0RmlsZSgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChxdWV1ZS5sZW5ndGggPT0gMClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuY29tcGxldGUpKVxuXHRcdFx0XHRcdFx0b3B0aW9ucy5jb21wbGV0ZSgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmID0gcXVldWVbMF07XG5cblx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5iZWZvcmUpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHJldHVybmVkID0gb3B0aW9ucy5iZWZvcmUoZi5maWxlLCBmLmlucHV0RWxlbSk7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIHJldHVybmVkID09PSAnb2JqZWN0Jylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAocmV0dXJuZWQuYWN0aW9uID09IFwiYWJvcnRcIilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZXJyb3IoXCJBYm9ydEVycm9yXCIsIGYuZmlsZSwgZi5pbnB1dEVsZW0sIHJldHVybmVkLnJlYXNvbik7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcdC8vIEFib3J0cyBhbGwgcXVldWVkIGZpbGVzIGltbWVkaWF0ZWx5XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmIChyZXR1cm5lZC5hY3Rpb24gPT0gXCJza2lwXCIpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgcmV0dXJuZWQuY29uZmlnID09PSAnb2JqZWN0Jylcblx0XHRcdFx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZyA9ICQuZXh0ZW5kKGYuaW5zdGFuY2VDb25maWcsIHJldHVybmVkLmNvbmZpZyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkID09IFwic2tpcFwiKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFdyYXAgdXAgdGhlIHVzZXIncyBjb21wbGV0ZSBjYWxsYmFjaywgaWYgYW55LCBzbyB0aGF0IG91cnMgYWxzbyBnZXRzIGV4ZWN1dGVkXG5cdFx0XHRcdHZhciB1c2VyQ29tcGxldGVGdW5jID0gZi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZTtcblx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZSA9IGZ1bmN0aW9uKHJlc3VsdHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbih1c2VyQ29tcGxldGVGdW5jKSlcblx0XHRcdFx0XHRcdHVzZXJDb21wbGV0ZUZ1bmMocmVzdWx0cywgZi5maWxlLCBmLmlucHV0RWxlbSk7XG5cdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0UGFwYS5wYXJzZShmLmZpbGUsIGYuaW5zdGFuY2VDb25maWcpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBlcnJvcihuYW1lLCBmaWxlLCBlbGVtLCByZWFzb24pXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuZXJyb3IpKVxuXHRcdFx0XHRcdG9wdGlvbnMuZXJyb3Ioe25hbWU6IG5hbWV9LCBmaWxlLCBlbGVtLCByZWFzb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBmaWxlQ29tcGxldGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRxdWV1ZS5zcGxpY2UoMCwgMSk7XG5cdFx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXG5cdGlmIChJU19QQVBBX1dPUktFUilcblx0e1xuXHRcdGdsb2JhbC5vbm1lc3NhZ2UgPSB3b3JrZXJUaHJlYWRSZWNlaXZlZE1lc3NhZ2U7XG5cdH1cblx0ZWxzZSBpZiAoUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0e1xuXHRcdEFVVE9fU0NSSVBUX1BBVEggPSBnZXRTY3JpcHRQYXRoKCk7XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgc2NyaXB0IHdhcyBsb2FkZWQgc3luY2hyb25vdXNseVxuXHRcdGlmICghZG9jdW1lbnQuYm9keSlcblx0XHR7XG5cdFx0XHQvLyBCb2R5IGRvZXNuJ3QgZXhpc3QgeWV0LCBtdXN0IGJlIHN5bmNocm9ub3VzXG5cdFx0XHRMT0FERURfU1lOQyA9IHRydWU7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRMT0FERURfU1lOQyA9IHRydWU7XG5cdFx0XHR9LCB0cnVlKTtcblx0XHR9XG5cdH1cblxuXG5cblxuXHRmdW5jdGlvbiBDc3ZUb0pzb24oX2lucHV0LCBfY29uZmlnKVxuXHR7XG5cdFx0X2NvbmZpZyA9IF9jb25maWcgfHwge307XG5cblx0XHRpZiAoX2NvbmZpZy53b3JrZXIgJiYgUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHR7XG5cdFx0XHR2YXIgdyA9IG5ld1dvcmtlcigpO1xuXG5cdFx0XHR3LnVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0dy51c2VyQ2h1bmsgPSBfY29uZmlnLmNodW5rO1xuXHRcdFx0dy51c2VyQ29tcGxldGUgPSBfY29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0dy51c2VyRXJyb3IgPSBfY29uZmlnLmVycm9yO1xuXG5cdFx0XHRfY29uZmlnLnN0ZXAgPSBpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCk7XG5cdFx0XHRfY29uZmlnLmNodW5rID0gaXNGdW5jdGlvbihfY29uZmlnLmNodW5rKTtcblx0XHRcdF9jb25maWcuY29tcGxldGUgPSBpc0Z1bmN0aW9uKF9jb25maWcuY29tcGxldGUpO1xuXHRcdFx0X2NvbmZpZy5lcnJvciA9IGlzRnVuY3Rpb24oX2NvbmZpZy5lcnJvcik7XG5cdFx0XHRkZWxldGUgX2NvbmZpZy53b3JrZXI7XHQvLyBwcmV2ZW50IGluZmluaXRlIGxvb3BcblxuXHRcdFx0dy5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdGlucHV0OiBfaW5wdXQsXG5cdFx0XHRcdGNvbmZpZzogX2NvbmZpZyxcblx0XHRcdFx0d29ya2VySWQ6IHcuaWRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHN0cmVhbWVyID0gbnVsbDtcblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0aWYgKF9jb25maWcuZG93bmxvYWQpXG5cdFx0XHRcdHN0cmVhbWVyID0gbmV3IE5ldHdvcmtTdHJlYW1lcihfY29uZmlnKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgU3RyaW5nU3RyZWFtZXIoX2NvbmZpZyk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChnbG9iYWwuRmlsZSAmJiBfaW5wdXQgaW5zdGFuY2VvZiBGaWxlKSB8fCBfaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpXHQvLyAuLi5TYWZhcmkuIChzZWUgaXNzdWUgIzEwNilcblx0XHRcdHN0cmVhbWVyID0gbmV3IEZpbGVTdHJlYW1lcihfY29uZmlnKTtcblxuXHRcdHJldHVybiBzdHJlYW1lci5zdHJlYW0oX2lucHV0KTtcblx0fVxuXG5cblxuXG5cblxuXHRmdW5jdGlvbiBKc29uVG9Dc3YoX2lucHV0LCBfY29uZmlnKVxuXHR7XG5cdFx0dmFyIF9vdXRwdXQgPSBcIlwiO1xuXHRcdHZhciBfZmllbGRzID0gW107XG5cblx0XHQvLyBEZWZhdWx0IGNvbmZpZ3VyYXRpb25cblxuXHRcdC8qKiB3aGV0aGVyIHRvIHN1cnJvdW5kIGV2ZXJ5IGRhdHVtIHdpdGggcXVvdGVzICovXG5cdFx0dmFyIF9xdW90ZXMgPSBmYWxzZTtcblxuXHRcdC8qKiBkZWxpbWl0aW5nIGNoYXJhY3RlciAqL1xuXHRcdHZhciBfZGVsaW1pdGVyID0gXCIsXCI7XG5cblx0XHQvKiogbmV3bGluZSBjaGFyYWN0ZXIocykgKi9cblx0XHR2YXIgX25ld2xpbmUgPSBcIlxcclxcblwiO1xuXG5cdFx0dW5wYWNrQ29uZmlnKCk7XG5cblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0XHRfaW5wdXQgPSBKU09OLnBhcnNlKF9pbnB1dCk7XG5cblx0XHRpZiAoX2lucHV0IGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0e1xuXHRcdFx0aWYgKCFfaW5wdXQubGVuZ3RoIHx8IF9pbnB1dFswXSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG51bGwsIF9pbnB1dCk7XG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgX2lucHV0WzBdID09PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShvYmplY3RLZXlzKF9pbnB1dFswXSksIF9pbnB1dCk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXQgPT09ICdvYmplY3QnKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2lucHV0LmRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfaW5wdXQuZGF0YSA9IEpTT04ucGFyc2UoX2lucHV0LmRhdGEpO1xuXG5cdFx0XHRpZiAoX2lucHV0LmRhdGEgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFfaW5wdXQuZmllbGRzKVxuXHRcdFx0XHRcdF9pbnB1dC5maWVsZHMgPSBfaW5wdXQuZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRcdFx0XHRcdFx0XHQ/IF9pbnB1dC5maWVsZHNcblx0XHRcdFx0XHRcdFx0XHRcdDogb2JqZWN0S2V5cyhfaW5wdXQuZGF0YVswXSk7XG5cblx0XHRcdFx0aWYgKCEoX2lucHV0LmRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheSkgJiYgdHlwZW9mIF9pbnB1dC5kYXRhWzBdICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0XHRfaW5wdXQuZGF0YSA9IFtfaW5wdXQuZGF0YV07XHQvLyBoYW5kbGVzIGlucHV0IGxpa2UgWzEsMiwzXSBvciBbXCJhc2RmXCJdXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzZXJpYWxpemUoX2lucHV0LmZpZWxkcyB8fCBbXSwgX2lucHV0LmRhdGEgfHwgW10pO1xuXHRcdH1cblxuXHRcdC8vIERlZmF1bHQgKGFueSB2YWxpZCBwYXRocyBzaG91bGQgcmV0dXJuIGJlZm9yZSB0aGlzKVxuXHRcdHRocm93IFwiZXhjZXB0aW9uOiBVbmFibGUgdG8gc2VyaWFsaXplIHVucmVjb2duaXplZCBpbnB1dFwiO1xuXG5cblx0XHRmdW5jdGlvbiB1bnBhY2tDb25maWcoKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZyAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLmRlbGltaXRlciA9PT0gJ3N0cmluZydcblx0XHRcdFx0JiYgX2NvbmZpZy5kZWxpbWl0ZXIubGVuZ3RoID09IDFcblx0XHRcdFx0JiYgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKF9jb25maWcuZGVsaW1pdGVyKSA9PSAtMSlcblx0XHRcdHtcblx0XHRcdFx0X2RlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcucXVvdGVzID09PSAnYm9vbGVhbidcblx0XHRcdFx0fHwgX2NvbmZpZy5xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdFx0X3F1b3RlcyA9IF9jb25maWcucXVvdGVzO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcubmV3bGluZSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9uZXdsaW5lID0gX2NvbmZpZy5uZXdsaW5lO1xuXHRcdH1cblxuXG5cdFx0LyoqIFR1cm5zIGFuIG9iamVjdCdzIGtleXMgaW50byBhbiBhcnJheSAqL1xuXHRcdGZ1bmN0aW9uIG9iamVjdEtleXMob2JqKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0dmFyIGtleXMgPSBbXTtcblx0XHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRcdGtleXMucHVzaChrZXkpO1xuXHRcdFx0cmV0dXJuIGtleXM7XG5cdFx0fVxuXG5cdFx0LyoqIFRoZSBkb3VibGUgZm9yIGxvb3AgdGhhdCBpdGVyYXRlcyB0aGUgZGF0YSBhbmQgd3JpdGVzIG91dCBhIENTViBzdHJpbmcgaW5jbHVkaW5nIGhlYWRlciByb3cgKi9cblx0XHRmdW5jdGlvbiBzZXJpYWxpemUoZmllbGRzLCBkYXRhKVxuXHRcdHtcblx0XHRcdHZhciBjc3YgPSBcIlwiO1xuXG5cdFx0XHRpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGZpZWxkcyA9IEpTT04ucGFyc2UoZmllbGRzKTtcblx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuXG5cdFx0XHR2YXIgaGFzSGVhZGVyID0gZmllbGRzIGluc3RhbmNlb2YgQXJyYXkgJiYgZmllbGRzLmxlbmd0aCA+IDA7XG5cdFx0XHR2YXIgZGF0YUtleWVkQnlGaWVsZCA9ICEoZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYSBoZWFkZXIgcm93LCB3cml0ZSBpdCBmaXJzdFxuXHRcdFx0aWYgKGhhc0hlYWRlcilcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaSA+IDApXG5cdFx0XHRcdFx0XHRjc3YgKz0gX2RlbGltaXRlcjtcblx0XHRcdFx0XHRjc3YgKz0gc2FmZShmaWVsZHNbaV0sIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0Y3N2ICs9IF9uZXdsaW5lO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaGVuIHdyaXRlIG91dCB0aGUgZGF0YVxuXHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgZGF0YS5sZW5ndGg7IHJvdysrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbWF4Q29sID0gaGFzSGVhZGVyID8gZmllbGRzLmxlbmd0aCA6IGRhdGFbcm93XS5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgbWF4Q29sOyBjb2wrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChjb2wgPiAwKVxuXHRcdFx0XHRcdFx0Y3N2ICs9IF9kZWxpbWl0ZXI7XG5cdFx0XHRcdFx0dmFyIGNvbElkeCA9IGhhc0hlYWRlciAmJiBkYXRhS2V5ZWRCeUZpZWxkID8gZmllbGRzW2NvbF0gOiBjb2w7XG5cdFx0XHRcdFx0Y3N2ICs9IHNhZmUoZGF0YVtyb3ddW2NvbElkeF0sIGNvbCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocm93IDwgZGF0YS5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdGNzdiArPSBfbmV3bGluZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGNzdjtcblx0XHR9XG5cblx0XHQvKiogRW5jbG9zZXMgYSB2YWx1ZSBhcm91bmQgcXVvdGVzIGlmIG5lZWRlZCAobWFrZXMgYSB2YWx1ZSBzYWZlIGZvciBDU1YgaW5zZXJ0aW9uKSAqL1xuXHRcdGZ1bmN0aW9uIHNhZmUoc3RyLCBjb2wpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBzdHIgPT09IFwidW5kZWZpbmVkXCIgfHwgc3RyID09PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gXCJcIjtcblxuXHRcdFx0c3RyID0gc3RyLnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ1wiXCInKTtcblxuXHRcdFx0dmFyIG5lZWRzUXVvdGVzID0gKHR5cGVvZiBfcXVvdGVzID09PSAnYm9vbGVhbicgJiYgX3F1b3Rlcylcblx0XHRcdFx0XHRcdFx0fHwgKF9xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSAmJiBfcXVvdGVzW2NvbF0pXG5cdFx0XHRcdFx0XHRcdHx8IGhhc0FueShzdHIsIFBhcGEuQkFEX0RFTElNSVRFUlMpXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5pbmRleE9mKF9kZWxpbWl0ZXIpID4gLTFcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdCgwKSA9PSAnICdcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdChzdHIubGVuZ3RoIC0gMSkgPT0gJyAnO1xuXG5cdFx0XHRyZXR1cm4gbmVlZHNRdW90ZXMgPyAnXCInICsgc3RyICsgJ1wiJyA6IHN0cjtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBoYXNBbnkoc3RyLCBzdWJzdHJpbmdzKVxuXHRcdHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic3RyaW5ncy5sZW5ndGg7IGkrKylcblx0XHRcdFx0aWYgKHN0ci5pbmRleE9mKHN1YnN0cmluZ3NbaV0pID4gLTEpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0LyoqIENodW5rU3RyZWFtZXIgaXMgdGhlIGJhc2UgcHJvdG90eXBlIGZvciB2YXJpb3VzIHN0cmVhbWVyIGltcGxlbWVudGF0aW9ucy4gKi9cblx0ZnVuY3Rpb24gQ2h1bmtTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHR0aGlzLl9oYW5kbGUgPSBudWxsO1xuXHRcdHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX2ZpbmlzaGVkID0gZmFsc2U7XG5cdFx0dGhpcy5faW5wdXQgPSBudWxsO1xuXHRcdHRoaXMuX2Jhc2VJbmRleCA9IDA7XG5cdFx0dGhpcy5fcGFydGlhbExpbmUgPSBcIlwiO1xuXHRcdHRoaXMuX3Jvd0NvdW50ID0gMDtcblx0XHR0aGlzLl9zdGFydCA9IDA7XG5cdFx0dGhpcy5fbmV4dENodW5rID0gbnVsbDtcblx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IHRydWU7XG5cdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0ge1xuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXHRcdHJlcGxhY2VDb25maWcuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dGhpcy5wYXJzZUNodW5rID0gZnVuY3Rpb24oY2h1bmspXG5cdFx0e1xuXHRcdFx0Ly8gRmlyc3QgY2h1bmsgcHJlLXByb2Nlc3Npbmdcblx0XHRcdGlmICh0aGlzLmlzRmlyc3RDaHVuayAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1vZGlmaWVkQ2h1bmsgPSB0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuayhjaHVuayk7XG5cdFx0XHRcdGlmIChtb2RpZmllZENodW5rICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0Y2h1bmsgPSBtb2RpZmllZENodW5rO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5pc0ZpcnN0Q2h1bmsgPSBmYWxzZTtcblxuXHRcdFx0Ly8gUmVqb2luIHRoZSBsaW5lIHdlIGxpa2VseSBqdXN0IHNwbGl0IGluIHR3byBieSBjaHVua2luZyB0aGUgZmlsZVxuXHRcdFx0dmFyIGFnZ3JlZ2F0ZSA9IHRoaXMuX3BhcnRpYWxMaW5lICsgY2h1bms7XG5cdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9IFwiXCI7XG5cblx0XHRcdHZhciByZXN1bHRzID0gdGhpcy5faGFuZGxlLnBhcnNlKGFnZ3JlZ2F0ZSwgdGhpcy5fYmFzZUluZGV4LCAhdGhpcy5fZmluaXNoZWQpO1xuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5faGFuZGxlLnBhdXNlZCgpIHx8IHRoaXMuX2hhbmRsZS5hYm9ydGVkKCkpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdFxuXHRcdFx0dmFyIGxhc3RJbmRleCA9IHJlc3VsdHMubWV0YS5jdXJzb3I7XG5cdFx0XHRcblx0XHRcdGlmICghdGhpcy5fZmluaXNoZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gYWdncmVnYXRlLnN1YnN0cmluZyhsYXN0SW5kZXggLSB0aGlzLl9iYXNlSW5kZXgpO1xuXHRcdFx0XHR0aGlzLl9iYXNlSW5kZXggPSBsYXN0SW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyZXN1bHRzICYmIHJlc3VsdHMuZGF0YSlcblx0XHRcdFx0dGhpcy5fcm93Q291bnQgKz0gcmVzdWx0cy5kYXRhLmxlbmd0aDtcblxuXHRcdFx0dmFyIGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyA9IHRoaXMuX2ZpbmlzaGVkIHx8ICh0aGlzLl9jb25maWcucHJldmlldyAmJiB0aGlzLl9yb3dDb3VudCA+PSB0aGlzLl9jb25maWcucHJldmlldyk7XG5cblx0XHRcdGlmIChJU19QQVBBX1dPUktFUilcblx0XHRcdHtcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHRyZXN1bHRzOiByZXN1bHRzLFxuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRmaW5pc2hlZDogZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9jb25maWcuY2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jb25maWcuY2h1bmsocmVzdWx0cywgdGhpcy5faGFuZGxlKTtcblx0XHRcdFx0aWYgKHRoaXMuX3BhdXNlZClcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdHJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0aGlzLl9jb25maWcuc3RlcCAmJiAhdGhpcy5fY29uZmlnLmNodW5rKSB7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhID0gdGhpcy5fY29tcGxldGVSZXN1bHRzLmRhdGEuY29uY2F0KHJlc3VsdHMuZGF0YSk7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMgPSB0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzLmNvbmNhdChyZXN1bHRzLmVycm9ycyk7XG5cdFx0XHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5tZXRhID0gcmVzdWx0cy5tZXRhO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ICYmIGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmNvbXBsZXRlKSAmJiAoIXJlc3VsdHMgfHwgIXJlc3VsdHMubWV0YS5hYm9ydGVkKSlcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNvbXBsZXRlKHRoaXMuX2NvbXBsZXRlUmVzdWx0cyk7XG5cblx0XHRcdGlmICghZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ICYmICghcmVzdWx0cyB8fCAhcmVzdWx0cy5tZXRhLnBhdXNlZCkpXG5cdFx0XHRcdHRoaXMuX25leHRDaHVuaygpO1xuXG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9O1xuXG5cdFx0dGhpcy5fc2VuZEVycm9yID0gZnVuY3Rpb24oZXJyb3IpXG5cdFx0e1xuXHRcdFx0aWYgKGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmVycm9yKSlcblx0XHRcdFx0dGhpcy5fY29uZmlnLmVycm9yKGVycm9yKTtcblx0XHRcdGVsc2UgaWYgKElTX1BBUEFfV09SS0VSICYmIHRoaXMuX2NvbmZpZy5lcnJvcilcblx0XHRcdHtcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0ZXJyb3I6IGVycm9yLFxuXHRcdFx0XHRcdGZpbmlzaGVkOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gcmVwbGFjZUNvbmZpZyhjb25maWcpXG5cdFx0e1xuXHRcdFx0Ly8gRGVlcC1jb3B5IHRoZSBjb25maWcgc28gd2UgY2FuIGVkaXQgaXRcblx0XHRcdHZhciBjb25maWdDb3B5ID0gY29weShjb25maWcpO1xuXHRcdFx0Y29uZmlnQ29weS5jaHVua1NpemUgPSBwYXJzZUludChjb25maWdDb3B5LmNodW5rU2l6ZSk7XHQvLyBwYXJzZUludCBWRVJZIGltcG9ydGFudCBzbyB3ZSBkb24ndCBjb25jYXRlbmF0ZSBzdHJpbmdzIVxuXHRcdFx0aWYgKCFjb25maWcuc3RlcCAmJiAhY29uZmlnLmNodW5rKVxuXHRcdFx0XHRjb25maWdDb3B5LmNodW5rU2l6ZSA9IG51bGw7ICAvLyBkaXNhYmxlIFJhbmdlIGhlYWRlciBpZiBub3Qgc3RyZWFtaW5nOyBiYWQgdmFsdWVzIGJyZWFrIElJUyAtIHNlZSBpc3N1ZSAjMTk2XG5cdFx0XHR0aGlzLl9oYW5kbGUgPSBuZXcgUGFyc2VySGFuZGxlKGNvbmZpZ0NvcHkpO1xuXHRcdFx0dGhpcy5faGFuZGxlLnN0cmVhbWVyID0gdGhpcztcblx0XHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZ0NvcHk7XHQvLyBwZXJzaXN0IHRoZSBjb3B5IHRvIHRoZSBjYWxsZXJcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIE5ldHdvcmtTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0aWYgKCFjb25maWcuY2h1bmtTaXplKVxuXHRcdFx0Y29uZmlnLmNodW5rU2l6ZSA9IFBhcGEuUmVtb3RlQ2h1bmtTaXplO1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHhocjtcblxuXHRcdGlmIChJU19XT1JLRVIpXG5cdFx0e1xuXHRcdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoKTtcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKHVybClcblx0XHR7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IHVybDtcblx0XHRcdHRoaXMuX25leHRDaHVuaygpO1x0Ly8gU3RhcnRzIHN0cmVhbWluZ1xuXHRcdH07XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHRoaXMuX2ZpbmlzaGVkKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdFx0XG5cdFx0XHRpZiAoIUlTX1dPUktFUilcblx0XHRcdHtcblx0XHRcdFx0eGhyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHhoci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIub3BlbihcIkdFVFwiLCB0aGlzLl9pbnB1dCwgIUlTX1dPUktFUik7XG5cdFx0XHRcblx0XHRcdGlmICh0aGlzLl9jb25maWcuY2h1bmtTaXplKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZW5kID0gdGhpcy5fc3RhcnQgKyB0aGlzLl9jb25maWcuY2h1bmtTaXplIC0gMTtcdC8vIG1pbnVzIG9uZSBiZWNhdXNlIGJ5dGUgcmFuZ2UgaXMgaW5jbHVzaXZlXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiUmFuZ2VcIiwgXCJieXRlcz1cIit0aGlzLl9zdGFydCtcIi1cIitlbmQpO1xuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIklmLU5vbmUtTWF0Y2hcIiwgXCJ3ZWJraXQtbm8tY2FjaGVcIik7IC8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MjY3MlxuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR4aHIuc2VuZCgpO1xuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKGVyci5tZXNzYWdlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKElTX1dPUktFUiAmJiB4aHIuc3RhdHVzID09IDApXG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0xvYWRlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgIT0gNClcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRpZiAoeGhyLnN0YXR1cyA8IDIwMCB8fCB4aHIuc3RhdHVzID49IDQwMClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcigpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXRoaXMuX2NvbmZpZy5jaHVua1NpemUgfHwgdGhpcy5fc3RhcnQgPiBnZXRGaWxlU2l6ZSh4aHIpO1xuXHRcdFx0dGhpcy5wYXJzZUNodW5rKHhoci5yZXNwb25zZVRleHQpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbihlcnJvck1lc3NhZ2UpXG5cdFx0e1xuXHRcdFx0dmFyIGVycm9yVGV4dCA9IHhoci5zdGF0dXNUZXh0IHx8IGVycm9yTWVzc2FnZTtcblx0XHRcdHRoaXMuX3NlbmRFcnJvcihlcnJvclRleHQpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEZpbGVTaXplKHhocilcblx0XHR7XG5cdFx0XHR2YXIgY29udGVudFJhbmdlID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1SYW5nZVwiKTtcblx0XHRcdHJldHVybiBwYXJzZUludChjb250ZW50UmFuZ2Uuc3Vic3RyKGNvbnRlbnRSYW5nZS5sYXN0SW5kZXhPZihcIi9cIikgKyAxKSk7XG5cdFx0fVxuXHR9XG5cdE5ldHdvcmtTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENodW5rU3RyZWFtZXIucHJvdG90eXBlKTtcblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5ldHdvcmtTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIEZpbGVTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0aWYgKCFjb25maWcuY2h1bmtTaXplKVxuXHRcdFx0Y29uZmlnLmNodW5rU2l6ZSA9IFBhcGEuTG9jYWxDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgcmVhZGVyLCBzbGljZTtcblxuXHRcdC8vIEZpbGVSZWFkZXIgaXMgYmV0dGVyIHRoYW4gRmlsZVJlYWRlclN5bmMgKGV2ZW4gaW4gd29ya2VyKSAtIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcS8yNDcwODY0OS8xMDQ4ODYyXG5cdFx0Ly8gQnV0IEZpcmVmb3ggaXMgYSBwaWxsLCB0b28gLSBzZWUgaXNzdWUgIzc2OiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy83NlxuXHRcdHZhciB1c2luZ0FzeW5jUmVhZGVyID0gdHlwZW9mIEZpbGVSZWFkZXIgIT09ICd1bmRlZmluZWQnO1x0Ly8gU2FmYXJpIGRvZXNuJ3QgY29uc2lkZXIgaXQgYSBmdW5jdGlvbiAtIHNlZSBpc3N1ZSAjMTA1XG5cblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKGZpbGUpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSBmaWxlO1xuXHRcdFx0c2xpY2UgPSBmaWxlLnNsaWNlIHx8IGZpbGUud2Via2l0U2xpY2UgfHwgZmlsZS5tb3pTbGljZTtcblxuXHRcdFx0aWYgKHVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHRcdC8vIFByZWZlcnJlZCBtZXRob2Qgb2YgcmVhZGluZyBmaWxlcywgZXZlbiBpbiB3b3JrZXJzXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHRyZWFkZXIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKCk7XHQvLyBIYWNrIGZvciBydW5uaW5nIGluIGEgd2ViIHdvcmtlciBpbiBGaXJlZm94XG5cblx0XHRcdHRoaXMuX25leHRDaHVuaygpO1x0Ly8gU3RhcnRzIHN0cmVhbWluZ1xuXHRcdH07XG5cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZCAmJiAoIXRoaXMuX2NvbmZpZy5wcmV2aWV3IHx8IHRoaXMuX3Jvd0NvdW50IDwgdGhpcy5fY29uZmlnLnByZXZpZXcpKVxuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHR9XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dmFyIGlucHV0ID0gdGhpcy5faW5wdXQ7XG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IE1hdGgubWluKHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSwgdGhpcy5faW5wdXQuc2l6ZSk7XG5cdFx0XHRcdGlucHV0ID0gc2xpY2UuY2FsbChpbnB1dCwgdGhpcy5fc3RhcnQsIGVuZCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdHh0ID0gcmVhZGVyLnJlYWRBc1RleHQoaW5wdXQsIHRoaXMuX2NvbmZpZy5lbmNvZGluZyk7XG5cdFx0XHRpZiAoIXVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKHsgdGFyZ2V0OiB7IHJlc3VsdDogdHh0IH0gfSk7XHQvLyBtaW1pYyB0aGUgYXN5bmMgc2lnbmF0dXJlXG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbihldmVudClcblx0XHR7XG5cdFx0XHQvLyBWZXJ5IGltcG9ydGFudCB0byBpbmNyZW1lbnQgc3RhcnQgZWFjaCB0aW1lIGJlZm9yZSBoYW5kbGluZyByZXN1bHRzXG5cdFx0XHR0aGlzLl9zdGFydCArPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+PSB0aGlzLl9pbnB1dC5zaXplO1xuXHRcdFx0dGhpcy5wYXJzZUNodW5rKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKHJlYWRlci5lcnJvcik7XG5cdFx0fVxuXG5cdH1cblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmlsZVN0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gU3RyaW5nU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHN0cmluZztcblx0XHR2YXIgcmVtYWluaW5nO1xuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24ocylcblx0XHR7XG5cdFx0XHRzdHJpbmcgPSBzO1xuXHRcdFx0cmVtYWluaW5nID0gcztcblx0XHRcdHJldHVybiB0aGlzLl9uZXh0Q2h1bmsoKTtcblx0XHR9XG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZCkgcmV0dXJuO1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dmFyIGNodW5rID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoMCwgc2l6ZSkgOiByZW1haW5pbmc7XG5cdFx0XHRyZW1haW5pbmcgPSBzaXplID8gcmVtYWluaW5nLnN1YnN0cihzaXplKSA6ICcnO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhcmVtYWluaW5nO1xuXHRcdFx0cmV0dXJuIHRoaXMucGFyc2VDaHVuayhjaHVuayk7XG5cdFx0fVxuXHR9XG5cdFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nU3RyZWFtZXIucHJvdG90eXBlKTtcblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RyaW5nU3RyZWFtZXI7XG5cblxuXG5cdC8vIFVzZSBvbmUgUGFyc2VySGFuZGxlIHBlciBlbnRpcmUgQ1NWIGZpbGUgb3Igc3RyaW5nXG5cdGZ1bmN0aW9uIFBhcnNlckhhbmRsZShfY29uZmlnKVxuXHR7XG5cdFx0Ly8gT25lIGdvYWwgaXMgdG8gbWluaW1pemUgdGhlIHVzZSBvZiByZWd1bGFyIGV4cHJlc3Npb25zLi4uXG5cdFx0dmFyIEZMT0FUID0gL15cXHMqLT8oXFxkKlxcLj9cXGQrfFxcZCtcXC4/XFxkKikoZVstK10/XFxkKyk/XFxzKiQvaTtcblxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgX3N0ZXBDb3VudGVyID0gMDtcdC8vIE51bWJlciBvZiB0aW1lcyBzdGVwIHdhcyBjYWxsZWQgKG51bWJlciBvZiByb3dzIHBhcnNlZClcblx0XHR2YXIgX2lucHV0O1x0XHRcdFx0Ly8gVGhlIGlucHV0IGJlaW5nIHBhcnNlZFxuXHRcdHZhciBfcGFyc2VyO1x0XHRcdC8vIFRoZSBjb3JlIHBhcnNlciBiZWluZyB1c2VkXG5cdFx0dmFyIF9wYXVzZWQgPSBmYWxzZTtcdC8vIFdoZXRoZXIgd2UgYXJlIHBhdXNlZCBvciBub3Rcblx0XHR2YXIgX2Fib3J0ZWQgPSBmYWxzZTsgICAvLyBXaGV0aGVyIHRoZSBwYXJzZXIgaGFzIGFib3J0ZWQgb3Igbm90XG5cdFx0dmFyIF9kZWxpbWl0ZXJFcnJvcjtcdC8vIFRlbXBvcmFyeSBzdGF0ZSBiZXR3ZWVuIGRlbGltaXRlciBkZXRlY3Rpb24gYW5kIHByb2Nlc3NpbmcgcmVzdWx0c1xuXHRcdHZhciBfZmllbGRzID0gW107XHRcdC8vIEZpZWxkcyBhcmUgZnJvbSB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgaW5wdXQsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdHZhciBfcmVzdWx0cyA9IHtcdFx0Ly8gVGhlIGxhc3QgcmVzdWx0cyByZXR1cm5lZCBmcm9tIHRoZSBwYXJzZXJcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblxuXHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCkpXG5cdFx0e1xuXHRcdFx0dmFyIHVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0X2NvbmZpZy5zdGVwID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdHtcblx0XHRcdFx0X3Jlc3VsdHMgPSByZXN1bHRzO1xuXG5cdFx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRcdGVsc2VcdC8vIG9ubHkgY2FsbCB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhZnRlciBoZWFkZXIgcm93XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXG5cdFx0XHRcdFx0Ly8gSXQncyBwb3NzYmlsZSB0aGF0IHRoaXMgbGluZSB3YXMgZW1wdHkgYW5kIHRoZXJlJ3Mgbm8gcm93IGhlcmUgYWZ0ZXIgYWxsXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGEubGVuZ3RoID09IDApXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdFx0XHRfc3RlcENvdW50ZXIgKz0gcmVzdWx0cy5kYXRhLmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5wcmV2aWV3ICYmIF9zdGVwQ291bnRlciA+IF9jb25maWcucHJldmlldylcblx0XHRcdFx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHR1c2VyU3RlcChfcmVzdWx0cywgc2VsZik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogUGFyc2VzIGlucHV0LiBNb3N0IHVzZXJzIHdvbid0IG5lZWQsIGFuZCBzaG91bGRuJ3QgbWVzcyB3aXRoLCB0aGUgYmFzZUluZGV4XG5cdFx0ICogYW5kIGlnbm9yZUxhc3RSb3cgcGFyYW1ldGVycy4gVGhleSBhcmUgdXNlZCBieSBzdHJlYW1lcnMgKHdyYXBwZXIgZnVuY3Rpb25zKVxuXHRcdCAqIHdoZW4gYW4gaW5wdXQgY29tZXMgaW4gbXVsdGlwbGUgY2h1bmtzLCBsaWtlIGZyb20gYSBmaWxlLlxuXHRcdCAqL1xuXHRcdHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KVxuXHRcdHtcblx0XHRcdGlmICghX2NvbmZpZy5uZXdsaW5lKVxuXHRcdFx0XHRfY29uZmlnLm5ld2xpbmUgPSBndWVzc0xpbmVFbmRpbmdzKGlucHV0KTtcblxuXHRcdFx0X2RlbGltaXRlckVycm9yID0gZmFsc2U7XG5cdFx0XHRpZiAoIV9jb25maWcuZGVsaW1pdGVyKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZGVsaW1HdWVzcyA9IGd1ZXNzRGVsaW1pdGVyKGlucHV0KTtcblx0XHRcdFx0aWYgKGRlbGltR3Vlc3Muc3VjY2Vzc2Z1bClcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGRlbGltR3Vlc3MuYmVzdERlbGltaXRlcjtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gdHJ1ZTtcdC8vIGFkZCBlcnJvciBhZnRlciBwYXJzaW5nIChvdGhlcndpc2UgaXQgd291bGQgYmUgb3ZlcndyaXR0ZW4pXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBQYXBhLkRlZmF1bHREZWxpbWl0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHBhcnNlckNvbmZpZyA9IGNvcHkoX2NvbmZpZyk7XG5cdFx0XHRpZiAoX2NvbmZpZy5wcmV2aWV3ICYmIF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHRwYXJzZXJDb25maWcucHJldmlldysrO1x0Ly8gdG8gY29tcGVuc2F0ZSBmb3IgaGVhZGVyIHJvd1xuXG5cdFx0XHRfaW5wdXQgPSBpbnB1dDtcblx0XHRcdF9wYXJzZXIgPSBuZXcgUGFyc2VyKHBhcnNlckNvbmZpZyk7XG5cdFx0XHRfcmVzdWx0cyA9IF9wYXJzZXIucGFyc2UoX2lucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpO1xuXHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblx0XHRcdHJldHVybiBfcGF1c2VkID8geyBtZXRhOiB7IHBhdXNlZDogdHJ1ZSB9IH0gOiAoX3Jlc3VsdHMgfHwgeyBtZXRhOiB7IHBhdXNlZDogZmFsc2UgfSB9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X3BhdXNlZCA9IHRydWU7XG5cdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRfaW5wdXQgPSBfaW5wdXQuc3Vic3RyKF9wYXJzZXIuZ2V0Q2hhckluZGV4KCkpO1xuXHRcdH07XG5cblx0XHR0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gZmFsc2U7XG5cdFx0XHRzZWxmLnN0cmVhbWVyLnBhcnNlQ2h1bmsoX2lucHV0KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5hYm9ydGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF9hYm9ydGVkO1xuXHRcdH1cblxuXHRcdHRoaXMuYWJvcnQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X2Fib3J0ZWQgPSB0cnVlO1xuXHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0X3Jlc3VsdHMubWV0YS5hYm9ydGVkID0gdHJ1ZTtcblx0XHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuY29tcGxldGUpKVxuXHRcdFx0XHRfY29uZmlnLmNvbXBsZXRlKF9yZXN1bHRzKTtcblx0XHRcdF9pbnB1dCA9IFwiXCI7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHByb2Nlc3NSZXN1bHRzKClcblx0XHR7XG5cdFx0XHRpZiAoX3Jlc3VsdHMgJiYgX2RlbGltaXRlckVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRhZGRFcnJvcihcIkRlbGltaXRlclwiLCBcIlVuZGV0ZWN0YWJsZURlbGltaXRlclwiLCBcIlVuYWJsZSB0byBhdXRvLWRldGVjdCBkZWxpbWl0aW5nIGNoYXJhY3RlcjsgZGVmYXVsdGVkIHRvICdcIitQYXBhLkRlZmF1bHREZWxpbWl0ZXIrXCInXCIpO1xuXHRcdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jb25maWcuc2tpcEVtcHR5TGluZXMpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0XHRpZiAoX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGggPT0gMSAmJiBfcmVzdWx0cy5kYXRhW2ldWzBdID09IFwiXCIpXG5cdFx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhLnNwbGljZShpLS0sIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobmVlZHNIZWFkZXJSb3coKSlcblx0XHRcdFx0ZmlsbEhlYWRlckZpZWxkcygpO1xuXG5cdFx0XHRyZXR1cm4gYXBwbHlIZWFkZXJBbmREeW5hbWljVHlwaW5nKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gbmVlZHNIZWFkZXJSb3coKVxuXHRcdHtcblx0XHRcdHJldHVybiBfY29uZmlnLmhlYWRlciAmJiBfZmllbGRzLmxlbmd0aCA9PSAwO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbGxIZWFkZXJGaWVsZHMoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBuZWVkc0hlYWRlclJvdygpICYmIGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdFx0X2ZpZWxkcy5wdXNoKF9yZXN1bHRzLmRhdGFbaV1bal0pO1xuXHRcdFx0X3Jlc3VsdHMuZGF0YS5zcGxpY2UoMCwgMSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gYXBwbHlIZWFkZXJBbmREeW5hbWljVHlwaW5nKClcblx0XHR7XG5cdFx0XHRpZiAoIV9yZXN1bHRzIHx8ICghX2NvbmZpZy5oZWFkZXIgJiYgIV9jb25maWcuZHluYW1pY1R5cGluZykpXG5cdFx0XHRcdHJldHVybiBfcmVzdWx0cztcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgcm93ID0ge307XG5cblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aDsgaisrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKF9jb25maWcuZHluYW1pY1R5cGluZylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR2YXIgdmFsdWUgPSBfcmVzdWx0cy5kYXRhW2ldW2pdO1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlID09IFwidHJ1ZVwiIHx8IHZhbHVlID09IFwiVFJVRVwiKVxuXHRcdFx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldW2pdID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGVsc2UgaWYgKHZhbHVlID09IFwiZmFsc2VcIiB8fCB2YWx1ZSA9PSBcIkZBTFNFXCIpXG5cdFx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGFbaV1bal0gPSBmYWxzZTtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YVtpXVtqXSA9IHRyeVBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoaiA+PSBfZmllbGRzLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKCFyb3dbXCJfX3BhcnNlZF9leHRyYVwiXSlcblx0XHRcdFx0XHRcdFx0XHRyb3dbXCJfX3BhcnNlZF9leHRyYVwiXSA9IFtdO1xuXHRcdFx0XHRcdFx0XHRyb3dbXCJfX3BhcnNlZF9leHRyYVwiXS5wdXNoKF9yZXN1bHRzLmRhdGFbaV1bal0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRyb3dbX2ZpZWxkc1tqXV0gPSBfcmVzdWx0cy5kYXRhW2ldW2pdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9yZXN1bHRzLmRhdGFbaV0gPSByb3c7XG5cdFx0XHRcdFx0aWYgKGogPiBfZmllbGRzLmxlbmd0aClcblx0XHRcdFx0XHRcdGFkZEVycm9yKFwiRmllbGRNaXNtYXRjaFwiLCBcIlRvb01hbnlGaWVsZHNcIiwgXCJUb28gbWFueSBmaWVsZHM6IGV4cGVjdGVkIFwiICsgX2ZpZWxkcy5sZW5ndGggKyBcIiBmaWVsZHMgYnV0IHBhcnNlZCBcIiArIGosIGkpO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGogPCBfZmllbGRzLmxlbmd0aClcblx0XHRcdFx0XHRcdGFkZEVycm9yKFwiRmllbGRNaXNtYXRjaFwiLCBcIlRvb0Zld0ZpZWxkc1wiLCBcIlRvbyBmZXcgZmllbGRzOiBleHBlY3RlZCBcIiArIF9maWVsZHMubGVuZ3RoICsgXCIgZmllbGRzIGJ1dCBwYXJzZWQgXCIgKyBqLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIgJiYgX3Jlc3VsdHMubWV0YSlcblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5maWVsZHMgPSBfZmllbGRzO1xuXHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzRGVsaW1pdGVyKGlucHV0KVxuXHRcdHtcblx0XHRcdHZhciBkZWxpbUNob2ljZXMgPSBbXCIsXCIsIFwiXFx0XCIsIFwifFwiLCBcIjtcIiwgUGFwYS5SRUNPUkRfU0VQLCBQYXBhLlVOSVRfU0VQXTtcblx0XHRcdHZhciBiZXN0RGVsaW0sIGJlc3REZWx0YSwgZmllbGRDb3VudFByZXZSb3c7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGVsaW1DaG9pY2VzLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZGVsaW0gPSBkZWxpbUNob2ljZXNbaV07XG5cdFx0XHRcdHZhciBkZWx0YSA9IDAsIGF2Z0ZpZWxkQ291bnQgPSAwO1xuXHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHR2YXIgcHJldmlldyA9IG5ldyBQYXJzZXIoe1xuXHRcdFx0XHRcdGRlbGltaXRlcjogZGVsaW0sXG5cdFx0XHRcdFx0cHJldmlldzogMTBcblx0XHRcdFx0fSkucGFyc2UoaW5wdXQpO1xuXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcHJldmlldy5kYXRhLmxlbmd0aDsgaisrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIGZpZWxkQ291bnQgPSBwcmV2aWV3LmRhdGFbal0ubGVuZ3RoO1xuXHRcdFx0XHRcdGF2Z0ZpZWxkQ291bnQgKz0gZmllbGRDb3VudDtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgZmllbGRDb3VudFByZXZSb3cgPT09ICd1bmRlZmluZWQnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChmaWVsZENvdW50ID4gMSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZWx0YSArPSBNYXRoLmFicyhmaWVsZENvdW50IC0gZmllbGRDb3VudFByZXZSb3cpO1xuXHRcdFx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSBmaWVsZENvdW50O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChwcmV2aWV3LmRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50IC89IHByZXZpZXcuZGF0YS5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKCh0eXBlb2YgYmVzdERlbHRhID09PSAndW5kZWZpbmVkJyB8fCBkZWx0YSA8IGJlc3REZWx0YSlcblx0XHRcdFx0XHQmJiBhdmdGaWVsZENvdW50ID4gMS45OSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJlc3REZWx0YSA9IGRlbHRhO1xuXHRcdFx0XHRcdGJlc3REZWxpbSA9IGRlbGltO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gYmVzdERlbGltO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzZnVsOiAhIWJlc3REZWxpbSxcblx0XHRcdFx0YmVzdERlbGltaXRlcjogYmVzdERlbGltXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dClcblx0XHR7XG5cdFx0XHRpbnB1dCA9IGlucHV0LnN1YnN0cigwLCAxMDI0KjEwMjQpO1x0Ly8gbWF4IGxlbmd0aCAxIE1CXG5cblx0XHRcdHZhciByID0gaW5wdXQuc3BsaXQoJ1xccicpO1xuXG5cdFx0XHRpZiAoci5sZW5ndGggPT0gMSlcblx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXG5cdFx0XHR2YXIgbnVtV2l0aE4gPSAwO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocltpXVswXSA9PSAnXFxuJylcblx0XHRcdFx0XHRudW1XaXRoTisrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbnVtV2l0aE4gPj0gci5sZW5ndGggLyAyID8gJ1xcclxcbicgOiAnXFxyJztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cnlQYXJzZUZsb2F0KHZhbClcblx0XHR7XG5cdFx0XHR2YXIgaXNOdW1iZXIgPSBGTE9BVC50ZXN0KHZhbCk7XG5cdFx0XHRyZXR1cm4gaXNOdW1iZXIgPyBwYXJzZUZsb2F0KHZhbCkgOiB2YWw7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gYWRkRXJyb3IodHlwZSwgY29kZSwgbXNnLCByb3cpXG5cdFx0e1xuXHRcdFx0X3Jlc3VsdHMuZXJyb3JzLnB1c2goe1xuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRtZXNzYWdlOiBtc2csXG5cdFx0XHRcdHJvdzogcm93XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cblxuXG5cdC8qKiBUaGUgY29yZSBwYXJzZXIgaW1wbGVtZW50cyBzcGVlZHkgYW5kIGNvcnJlY3QgQ1NWIHBhcnNpbmcgKi9cblx0ZnVuY3Rpb24gUGFyc2VyKGNvbmZpZylcblx0e1xuXHRcdC8vIFVucGFjayB0aGUgY29uZmlnIG9iamVjdFxuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHR2YXIgZGVsaW0gPSBjb25maWcuZGVsaW1pdGVyO1xuXHRcdHZhciBuZXdsaW5lID0gY29uZmlnLm5ld2xpbmU7XG5cdFx0dmFyIGNvbW1lbnRzID0gY29uZmlnLmNvbW1lbnRzO1xuXHRcdHZhciBzdGVwID0gY29uZmlnLnN0ZXA7XG5cdFx0dmFyIHByZXZpZXcgPSBjb25maWcucHJldmlldztcblx0XHR2YXIgZmFzdE1vZGUgPSBjb25maWcuZmFzdE1vZGU7XG5cblx0XHQvLyBEZWxpbWl0ZXIgbXVzdCBiZSB2YWxpZFxuXHRcdGlmICh0eXBlb2YgZGVsaW0gIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoZGVsaW0pID4gLTEpXG5cdFx0XHRkZWxpbSA9IFwiLFwiO1xuXG5cdFx0Ly8gQ29tbWVudCBjaGFyYWN0ZXIgbXVzdCBiZSB2YWxpZFxuXHRcdGlmIChjb21tZW50cyA9PT0gZGVsaW0pXG5cdFx0XHR0aHJvdyBcIkNvbW1lbnQgY2hhcmFjdGVyIHNhbWUgYXMgZGVsaW1pdGVyXCI7XG5cdFx0ZWxzZSBpZiAoY29tbWVudHMgPT09IHRydWUpXG5cdFx0XHRjb21tZW50cyA9IFwiI1wiO1xuXHRcdGVsc2UgaWYgKHR5cGVvZiBjb21tZW50cyAhPT0gJ3N0cmluZydcblx0XHRcdHx8IFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihjb21tZW50cykgPiAtMSlcblx0XHRcdGNvbW1lbnRzID0gZmFsc2U7XG5cblx0XHQvLyBOZXdsaW5lIG11c3QgYmUgdmFsaWQ6IFxcciwgXFxuLCBvciBcXHJcXG5cblx0XHRpZiAobmV3bGluZSAhPSAnXFxuJyAmJiBuZXdsaW5lICE9ICdcXHInICYmIG5ld2xpbmUgIT0gJ1xcclxcbicpXG5cdFx0XHRuZXdsaW5lID0gJ1xcbic7XG5cblx0XHQvLyBXZSdyZSBnb25uYSBuZWVkIHRoZXNlIGF0IHRoZSBQYXJzZXIgc2NvcGVcblx0XHR2YXIgY3Vyc29yID0gMDtcblx0XHR2YXIgYWJvcnRlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpXG5cdFx0e1xuXHRcdFx0Ly8gRm9yIHNvbWUgcmVhc29uLCBpbiBDaHJvbWUsIHRoaXMgc3BlZWRzIHRoaW5ncyB1cCAoIT8pXG5cdFx0XHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJylcblx0XHRcdFx0dGhyb3cgXCJJbnB1dCBtdXN0IGJlIGEgc3RyaW5nXCI7XG5cblx0XHRcdC8vIFdlIGRvbid0IG5lZWQgdG8gY29tcHV0ZSBzb21lIG9mIHRoZXNlIGV2ZXJ5IHRpbWUgcGFyc2UoKSBpcyBjYWxsZWQsXG5cdFx0XHQvLyBidXQgaGF2aW5nIHRoZW0gaW4gYSBtb3JlIGxvY2FsIHNjb3BlIHNlZW1zIHRvIHBlcmZvcm0gYmV0dGVyXG5cdFx0XHR2YXIgaW5wdXRMZW4gPSBpbnB1dC5sZW5ndGgsXG5cdFx0XHRcdGRlbGltTGVuID0gZGVsaW0ubGVuZ3RoLFxuXHRcdFx0XHRuZXdsaW5lTGVuID0gbmV3bGluZS5sZW5ndGgsXG5cdFx0XHRcdGNvbW1lbnRzTGVuID0gY29tbWVudHMubGVuZ3RoO1xuXHRcdFx0dmFyIHN0ZXBJc0Z1bmN0aW9uID0gdHlwZW9mIHN0ZXAgPT09ICdmdW5jdGlvbic7XG5cblx0XHRcdC8vIEVzdGFibGlzaCBzdGFydGluZyBzdGF0ZVxuXHRcdFx0Y3Vyc29yID0gMDtcblx0XHRcdHZhciBkYXRhID0gW10sIGVycm9ycyA9IFtdLCByb3cgPSBbXSwgbGFzdEN1cnNvciA9IDA7XG5cblx0XHRcdGlmICghaW5wdXQpXG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cblx0XHRcdGlmIChmYXN0TW9kZSB8fCAoZmFzdE1vZGUgIT09IGZhbHNlICYmIGlucHV0LmluZGV4T2YoJ1wiJykgPT09IC0xKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvd3MgPSBpbnB1dC5zcGxpdChuZXdsaW5lKTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHJvdyA9IHJvd3NbaV07XG5cdFx0XHRcdFx0Y3Vyc29yICs9IHJvdy5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKGkgIT09IHJvd3MubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHRcdGN1cnNvciArPSBuZXdsaW5lLmxlbmd0aDtcblx0XHRcdFx0XHRlbHNlIGlmIChpZ25vcmVMYXN0Um93KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRpZiAoY29tbWVudHMgJiYgcm93LnN1YnN0cigwLCBjb21tZW50c0xlbikgPT0gY29tbWVudHMpXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgaSA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBkYXRhLnNsaWNlKDAsIHByZXZpZXcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0dmFyIG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXG5cdFx0XHQvLyBQYXJzZXIgbG9vcFxuXHRcdFx0Zm9yICg7Oylcblx0XHRcdHtcblx0XHRcdFx0Ly8gRmllbGQgaGFzIG9wZW5pbmcgcXVvdGVcblx0XHRcdFx0aWYgKGlucHV0W2N1cnNvcl0gPT0gJ1wiJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIFN0YXJ0IG91ciBzZWFyY2ggZm9yIHRoZSBjbG9zaW5nIHF1b3RlIHdoZXJlIHRoZSBjdXJzb3IgaXNcblx0XHRcdFx0XHR2YXIgcXVvdGVTZWFyY2ggPSBjdXJzb3I7XG5cblx0XHRcdFx0XHQvLyBTa2lwIHRoZSBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdFx0Y3Vyc29yKys7XG5cblx0XHRcdFx0XHRmb3IgKDs7KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEZpbmQgY2xvc2luZyBxdW90ZVxuXHRcdFx0XHRcdFx0dmFyIHF1b3RlU2VhcmNoID0gaW5wdXQuaW5kZXhPZignXCInLCBxdW90ZVNlYXJjaCsxKTtcblxuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSAtMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKCFpZ25vcmVMYXN0Um93KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gTm8gY2xvc2luZyBxdW90ZS4uLiB3aGF0IGEgcGl0eVxuXHRcdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IFwiUXVvdGVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb2RlOiBcIk1pc3NpbmdRdW90ZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IFwiUXVvdGVkIGZpZWxkIHVudGVybWluYXRlZFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0cm93OiBkYXRhLmxlbmd0aCxcdC8vIHJvdyBoYXMgeWV0IHRvIGJlIGluc2VydGVkXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleDogY3Vyc29yXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVTZWFyY2ggPT09IGlucHV0TGVuLTEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgYXQgRU9GXG5cdFx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9IGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKC9cIlwiL2csICdcIicpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKHZhbHVlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhpcyBxdW90ZSBpcyBlc2NhcGVkLCBpdCdzIHBhcnQgb2YgdGhlIGRhdGE7IHNraXAgaXRcblx0XHRcdFx0XHRcdGlmIChpbnB1dFtxdW90ZVNlYXJjaCsxXSA9PSAnXCInKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRxdW90ZVNlYXJjaCsrO1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGlucHV0W3F1b3RlU2VhcmNoKzFdID09IGRlbGltKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IGRlbGltaXRlclxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZSgvXCJcIi9nLCAnXCInKSk7XG5cdFx0XHRcdFx0XHRcdGN1cnNvciA9IHF1b3RlU2VhcmNoICsgMSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpbnB1dC5zdWJzdHIocXVvdGVTZWFyY2grMSwgbmV3bGluZUxlbikgPT09IG5ld2xpbmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgbmV3bGluZVxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZSgvXCJcIi9nLCAnXCInKSk7XG5cdFx0XHRcdFx0XHRcdHNhdmVSb3cocXVvdGVTZWFyY2ggKyAxICsgbmV3bGluZUxlbik7XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XHQvLyBiZWNhdXNlIHdlIG1heSBoYXZlIHNraXBwZWQgdGhlIG5leHREZWxpbSBpbiB0aGUgcXVvdGVkIGZpZWxkXG5cblx0XHRcdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBkYXRhLmxlbmd0aCA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQ29tbWVudCBmb3VuZCBhdCBzdGFydCBvZiBuZXcgbGluZVxuXHRcdFx0XHRpZiAoY29tbWVudHMgJiYgcm93Lmxlbmd0aCA9PT0gMCAmJiBpbnB1dC5zdWJzdHIoY3Vyc29yLCBjb21tZW50c0xlbikgPT09IGNvbW1lbnRzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG5leHROZXdsaW5lID09IC0xKVx0Ly8gQ29tbWVudCBlbmRzIGF0IEVPRlxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRjdXJzb3IgPSBuZXh0TmV3bGluZSArIG5ld2xpbmVMZW47XG5cdFx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE5leHQgZGVsaW1pdGVyIGNvbWVzIGJlZm9yZSBuZXh0IG5ld2xpbmUsIHNvIHdlJ3ZlIHJlYWNoZWQgZW5kIG9mIGZpZWxkXG5cdFx0XHRcdGlmIChuZXh0RGVsaW0gIT09IC0xICYmIChuZXh0RGVsaW0gPCBuZXh0TmV3bGluZSB8fCBuZXh0TmV3bGluZSA9PT0gLTEpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgbmV4dERlbGltKSk7XG5cdFx0XHRcdFx0Y3Vyc29yID0gbmV4dERlbGltICsgZGVsaW1MZW47XG5cdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEVuZCBvZiByb3dcblx0XHRcdFx0aWYgKG5leHROZXdsaW5lICE9PSAtMSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIG5leHROZXdsaW5lKSk7XG5cdFx0XHRcdFx0c2F2ZVJvdyhuZXh0TmV3bGluZSArIG5ld2xpbmVMZW4pO1xuXG5cdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXG5cdFx0XHRyZXR1cm4gZmluaXNoKCk7XG5cblxuXHRcdFx0ZnVuY3Rpb24gcHVzaFJvdyhyb3cpXG5cdFx0XHR7XG5cdFx0XHRcdGRhdGEucHVzaChyb3cpO1xuXHRcdFx0XHRsYXN0Q3Vyc29yID0gY3Vyc29yO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIHJlbWFpbmluZyBpbnB1dCBmcm9tIGN1cnNvciB0byB0aGUgZW5kIGludG9cblx0XHRcdCAqIHJvdywgc2F2ZXMgdGhlIHJvdywgY2FsbHMgc3RlcCwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIGZpbmlzaCh2YWx1ZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXG5cdFx0XHRcdFx0dmFsdWUgPSBpbnB1dC5zdWJzdHIoY3Vyc29yKTtcblx0XHRcdFx0cm93LnB1c2godmFsdWUpO1xuXHRcdFx0XHRjdXJzb3IgPSBpbnB1dExlbjtcdC8vIGltcG9ydGFudCBpbiBjYXNlIHBhcnNpbmcgaXMgcGF1c2VkXG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIGN1cnJlbnQgcm93IHRvIHRoZSByZXN1bHRzLiBJdCBzZXRzIHRoZSBjdXJzb3Jcblx0XHRcdCAqIHRvIG5ld0N1cnNvciBhbmQgZmluZHMgdGhlIG5leHROZXdsaW5lLiBUaGUgY2FsbGVyIHNob3VsZFxuXHRcdFx0ICogdGFrZSBjYXJlIHRvIGV4ZWN1dGUgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYW5kIGNoZWNrIGZvclxuXHRcdFx0ICogcHJldmlldyBhbmQgZW5kIHBhcnNpbmcgaWYgbmVjZXNzYXJ5LlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBzYXZlUm93KG5ld0N1cnNvcilcblx0XHRcdHtcblx0XHRcdFx0Y3Vyc29yID0gbmV3Q3Vyc29yO1xuXHRcdFx0XHRwdXNoUm93KHJvdyk7XG5cdFx0XHRcdHJvdyA9IFtdO1xuXHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIHJlc3VsdHMsIGVycm9ycywgYW5kIG1ldGEuICovXG5cdFx0XHRmdW5jdGlvbiByZXR1cm5hYmxlKHN0b3BwZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0XHRlcnJvcnM6IGVycm9ycyxcblx0XHRcdFx0XHRtZXRhOiB7XG5cdFx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdFx0bGluZWJyZWFrOiBuZXdsaW5lLFxuXHRcdFx0XHRcdFx0YWJvcnRlZDogYWJvcnRlZCxcblx0XHRcdFx0XHRcdHRydW5jYXRlZDogISFzdG9wcGVkLFxuXHRcdFx0XHRcdFx0Y3Vyc29yOiBsYXN0Q3Vyc29yICsgKGJhc2VJbmRleCB8fCAwKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIEV4ZWN1dGVzIHRoZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgcmVzZXRzIGRhdGEgJiBlcnJvcnMuICovXG5cdFx0XHRmdW5jdGlvbiBkb1N0ZXAoKVxuXHRcdFx0e1xuXHRcdFx0XHRzdGVwKHJldHVybmFibGUoKSk7XG5cdFx0XHRcdGRhdGEgPSBbXSwgZXJyb3JzID0gW107XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBTZXRzIHRoZSBhYm9ydCBmbGFnICovXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0LyoqIEdldHMgdGhlIGN1cnNvciBwb3NpdGlvbiAqL1xuXHRcdHRoaXMuZ2V0Q2hhckluZGV4ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHJldHVybiBjdXJzb3I7XG5cdFx0fTtcblx0fVxuXG5cblx0Ly8gSWYgeW91IG5lZWQgdG8gbG9hZCBQYXBhIFBhcnNlIGFzeW5jaHJvbm91c2x5IGFuZCB5b3UgYWxzbyBuZWVkIHdvcmtlciB0aHJlYWRzLCBoYXJkLWNvZGVcblx0Ly8gdGhlIHNjcmlwdCBwYXRoIGhlcmUuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZS9pc3N1ZXMvODcjaXNzdWVjb21tZW50LTU3ODg1MzU4XG5cdGZ1bmN0aW9uIGdldFNjcmlwdFBhdGgoKVxuXHR7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdFx0cmV0dXJuIHNjcmlwdHMubGVuZ3RoID8gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyYyA6ICcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gbmV3V29ya2VyKClcblx0e1xuXHRcdGlmICghUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRpZiAoIUxPQURFRF9TWU5DICYmIFBhcGEuU0NSSVBUX1BBVEggPT09IG51bGwpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdCdTY3JpcHQgcGF0aCBjYW5ub3QgYmUgZGV0ZXJtaW5lZCBhdXRvbWF0aWNhbGx5IHdoZW4gUGFwYSBQYXJzZSBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHkuICcgK1xuXHRcdFx0XHQnWW91IG5lZWQgdG8gc2V0IFBhcGEuU0NSSVBUX1BBVEggbWFudWFsbHkuJ1xuXHRcdFx0KTtcblx0XHR2YXIgd29ya2VyVXJsID0gUGFwYS5TQ1JJUFRfUEFUSCB8fCBBVVRPX1NDUklQVF9QQVRIO1xuXHRcdC8vIEFwcGVuZCBcInBhcGF3b3JrZXJcIiB0byB0aGUgc2VhcmNoIHN0cmluZyB0byB0ZWxsIHBhcGFwYXJzZSB0aGF0IHRoaXMgaXMgb3VyIHdvcmtlci5cblx0XHR3b3JrZXJVcmwgKz0gKHdvcmtlclVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArICdwYXBhd29ya2VyJztcblx0XHR2YXIgdyA9IG5ldyBnbG9iYWwuV29ya2VyKHdvcmtlclVybCk7XG5cdFx0dy5vbm1lc3NhZ2UgPSBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHRcdHcuaWQgPSB3b3JrZXJJZENvdW50ZXIrKztcblx0XHR3b3JrZXJzW3cuaWRdID0gdztcblx0XHRyZXR1cm4gdztcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIG1haW4gdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlKGUpXG5cdHtcblx0XHR2YXIgbXNnID0gZS5kYXRhO1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW21zZy53b3JrZXJJZF07XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdGlmIChtc2cuZXJyb3IpXG5cdFx0XHR3b3JrZXIudXNlckVycm9yKG1zZy5lcnJvciwgbXNnLmZpbGUpO1xuXHRcdGVsc2UgaWYgKG1zZy5yZXN1bHRzICYmIG1zZy5yZXN1bHRzLmRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0XHRjb21wbGV0ZVdvcmtlcihtc2cud29ya2VySWQsIHsgZGF0YTogW10sIGVycm9yczogW10sIG1ldGE6IHsgYWJvcnRlZDogdHJ1ZSB9IH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGhhbmRsZSA9IHtcblx0XHRcdFx0YWJvcnQ6IGFib3J0LFxuXHRcdFx0XHRwYXVzZTogbm90SW1wbGVtZW50ZWQsXG5cdFx0XHRcdHJlc3VtZTogbm90SW1wbGVtZW50ZWRcblx0XHRcdH07XG5cblx0XHRcdGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyU3RlcCkpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLnJlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHdvcmtlci51c2VyU3RlcCh7XG5cdFx0XHRcdFx0XHRkYXRhOiBbbXNnLnJlc3VsdHMuZGF0YVtpXV0sXG5cdFx0XHRcdFx0XHRlcnJvcnM6IG1zZy5yZXN1bHRzLmVycm9ycyxcblx0XHRcdFx0XHRcdG1ldGE6IG1zZy5yZXN1bHRzLm1ldGFcblx0XHRcdFx0XHR9LCBoYW5kbGUpO1xuXHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVsZXRlIG1zZy5yZXN1bHRzO1x0Ly8gZnJlZSBtZW1vcnkgQVNBUFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0d29ya2VyLnVzZXJDaHVuayhtc2cucmVzdWx0cywgaGFuZGxlLCBtc2cuZmlsZSk7XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobXNnLmZpbmlzaGVkICYmICFhYm9ydGVkKVxuXHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCBtc2cucmVzdWx0cyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb21wbGV0ZVdvcmtlcih3b3JrZXJJZCwgcmVzdWx0cykge1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW3dvcmtlcklkXTtcblx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNvbXBsZXRlKSlcblx0XHRcdHdvcmtlci51c2VyQ29tcGxldGUocmVzdWx0cyk7XG5cdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xuXHRcdGRlbGV0ZSB3b3JrZXJzW3dvcmtlcklkXTtcblx0fVxuXG5cdGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCkge1xuXHRcdHRocm93IFwiTm90IGltcGxlbWVudGVkLlwiO1xuXHR9XG5cblx0LyoqIENhbGxiYWNrIHdoZW4gd29ya2VyIHRocmVhZCByZWNlaXZlcyBhIG1lc3NhZ2UgKi9cblx0ZnVuY3Rpb24gd29ya2VyVGhyZWFkUmVjZWl2ZWRNZXNzYWdlKGUpXG5cdHtcblx0XHR2YXIgbXNnID0gZS5kYXRhO1xuXG5cdFx0aWYgKHR5cGVvZiBQYXBhLldPUktFUl9JRCA9PT0gJ3VuZGVmaW5lZCcgJiYgbXNnKVxuXHRcdFx0UGFwYS5XT1JLRVJfSUQgPSBtc2cud29ya2VySWQ7XG5cblx0XHRpZiAodHlwZW9mIG1zZy5pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRyZXN1bHRzOiBQYXBhLnBhcnNlKG1zZy5pbnB1dCwgbXNnLmNvbmZpZyksXG5cdFx0XHRcdGZpbmlzaGVkOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKGdsb2JhbC5GaWxlICYmIG1zZy5pbnB1dCBpbnN0YW5jZW9mIEZpbGUpIHx8IG1zZy5pbnB1dCBpbnN0YW5jZW9mIE9iamVjdClcdC8vIHRoYW5rIHlvdSwgU2FmYXJpIChzZWUgaXNzdWUgIzEwNilcblx0XHR7XG5cdFx0XHR2YXIgcmVzdWx0cyA9IFBhcGEucGFyc2UobXNnLmlucHV0LCBtc2cuY29uZmlnKTtcblx0XHRcdGlmIChyZXN1bHRzKVxuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRyZXN1bHRzOiByZXN1bHRzLFxuXHRcdFx0XHRcdGZpbmlzaGVkOiB0cnVlXG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBNYWtlcyBhIGRlZXAgY29weSBvZiBhbiBhcnJheSBvciBvYmplY3QgKG1vc3RseSkgKi9cblx0ZnVuY3Rpb24gY29weShvYmopXG5cdHtcblx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdHZhciBjcHkgPSBvYmogaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iailcblx0XHRcdGNweVtrZXldID0gY29weShvYmpba2V5XSk7XG5cdFx0cmV0dXJuIGNweTtcblx0fVxuXG5cdGZ1bmN0aW9uIGJpbmRGdW5jdGlvbihmLCBzZWxmKVxuXHR7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyBmLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7IH07XG5cdH1cblxuXHRmdW5jdGlvbiBpc0Z1bmN0aW9uKGZ1bmMpXG5cdHtcblx0XHRyZXR1cm4gdHlwZW9mIGZ1bmMgPT09ICdmdW5jdGlvbic7XG5cdH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcyk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoQykgTWljcm9zb2Z0LiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcclxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxyXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxyXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxyXG5cclxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXHJcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxudmFyIFJlZmxlY3Q7XHJcbihmdW5jdGlvbiAoUmVmbGVjdCkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcclxuICAgIC8vIGZlYXR1cmUgdGVzdCBmb3IgT2JqZWN0LmNyZWF0ZSBzdXBwb3J0XHJcbiAgICB2YXIgc3VwcG9ydHNDcmVhdGUgPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiO1xyXG4gICAgLy8gZmVhdHVyZSB0ZXN0IGZvciBfX3Byb3RvX18gc3VwcG9ydFxyXG4gICAgdmFyIHN1cHBvcnRzUHJvdG8gPSB7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5O1xyXG4gICAgLy8gZmVhdHVyZSB0ZXN0IGZvciBTeW1ib2wgc3VwcG9ydFxyXG4gICAgdmFyIHN1cHBvcnRzU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiO1xyXG4gICAgdmFyIHRvUHJpbWl0aXZlU3ltYm9sID0gc3VwcG9ydHNTeW1ib2wgJiYgdHlwZW9mIFN5bWJvbC50b1ByaW1pdGl2ZSAhPT0gXCJ1bmRlZmluZWRcIiA/IFN5bWJvbC50b1ByaW1pdGl2ZSA6IFwiQEB0b1ByaW1pdGl2ZVwiO1xyXG4gICAgdmFyIGl0ZXJhdG9yU3ltYm9sID0gc3VwcG9ydHNTeW1ib2wgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciAhPT0gXCJ1bmRlZmluZWRcIiA/IFN5bWJvbC5pdGVyYXRvciA6IFwiQEBpdGVyYXRvclwiO1xyXG4gICAgLy8gY3JlYXRlIGFuIG9iamVjdCBpbiBkaWN0aW9uYXJ5IG1vZGUgKGEuay5hLiBcInNsb3dcIiBtb2RlIGluIHY4KVxyXG4gICAgdmFyIGNyZWF0ZURpY3Rpb25hcnkgPSBzdXBwb3J0c0NyZWF0ZSA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KE9iamVjdC5jcmVhdGUobnVsbCkpOyB9IDpcclxuICAgICAgICBzdXBwb3J0c1Byb3RvID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoeyBfX3Byb3RvX186IG51bGwgfSk7IH0gOlxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeSh7fSk7IH07XHJcbiAgICB2YXIgSGFzaE1hcDtcclxuICAgIChmdW5jdGlvbiAoSGFzaE1hcCkge1xyXG4gICAgICAgIHZhciBkb3duTGV2ZWwgPSAhc3VwcG9ydHNDcmVhdGUgJiYgIXN1cHBvcnRzUHJvdG87XHJcbiAgICAgICAgSGFzaE1hcC5oYXMgPSBkb3duTGV2ZWxcclxuICAgICAgICAgICAgPyBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG1hcCwga2V5KTsgfVxyXG4gICAgICAgICAgICA6IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4ga2V5IGluIG1hcDsgfTtcclxuICAgICAgICBIYXNoTWFwLmdldCA9IGRvd25MZXZlbFxyXG4gICAgICAgICAgICA/IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwobWFwLCBrZXkpID8gbWFwW2tleV0gOiB1bmRlZmluZWQ7IH1cclxuICAgICAgICAgICAgOiBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIG1hcFtrZXldOyB9O1xyXG4gICAgfSkoSGFzaE1hcCB8fCAoSGFzaE1hcCA9IHt9KSk7XHJcbiAgICAvLyBMb2FkIGdsb2JhbCBvciBzaGltIHZlcnNpb25zIG9mIE1hcCwgU2V0LCBhbmQgV2Vha01hcFxyXG4gICAgdmFyIGZ1bmN0aW9uUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKEZ1bmN0aW9uKTtcclxuICAgIHZhciBfTWFwID0gdHlwZW9mIE1hcCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBNYXAucHJvdG90eXBlLmVudHJpZXMgPT09IFwiZnVuY3Rpb25cIiA/IE1hcCA6IENyZWF0ZU1hcFBvbHlmaWxsKCk7XHJcbiAgICB2YXIgX1NldCA9IHR5cGVvZiBTZXQgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU2V0LnByb3RvdHlwZS5lbnRyaWVzID09PSBcImZ1bmN0aW9uXCIgPyBTZXQgOiBDcmVhdGVTZXRQb2x5ZmlsbCgpO1xyXG4gICAgdmFyIF9XZWFrTWFwID0gdHlwZW9mIFdlYWtNYXAgPT09IFwiZnVuY3Rpb25cIiA/IFdlYWtNYXAgOiBDcmVhdGVXZWFrTWFwUG9seWZpbGwoKTtcclxuICAgIC8vIFtbTWV0YWRhdGFdXSBpbnRlcm5hbCBzbG90XHJcbiAgICB2YXIgTWV0YWRhdGEgPSBuZXcgX1dlYWtNYXAoKTtcclxuICAgIC8qKlxyXG4gICAgICAqIEFwcGxpZXMgYSBzZXQgb2YgZGVjb3JhdG9ycyB0byBhIHByb3BlcnR5IG9mIGEgdGFyZ2V0IG9iamVjdC5cclxuICAgICAgKiBAcGFyYW0gZGVjb3JhdG9ycyBBbiBhcnJheSBvZiBkZWNvcmF0b3JzLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3QuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgdG8gZGVjb3JhdGUuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldERlc2NyaXB0b3IgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgdGhlIHRhcmdldCBrZXlcclxuICAgICAgKiBAcmVtYXJrcyBEZWNvcmF0b3JzIGFyZSBhcHBsaWVkIGluIHJldmVyc2Ugb3JkZXIuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICBFeGFtcGxlID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiLFxyXG4gICAgICAqICAgICAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIsXHJcbiAgICAgICogICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKSkpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIsXHJcbiAgICAgICogICAgICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIsXHJcbiAgICAgICogICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIikpKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCB0YXJnZXRLZXksIHRhcmdldERlc2NyaXB0b3IpIHtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpIHtcclxuICAgICAgICAgICAgaWYgKCFJc0FycmF5KGRlY29yYXRvcnMpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0RGVzY3JpcHRvcikgJiYgIUlzVW5kZWZpbmVkKHRhcmdldERlc2NyaXB0b3IpICYmICFJc051bGwodGFyZ2V0RGVzY3JpcHRvcikpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIGlmIChJc051bGwodGFyZ2V0RGVzY3JpcHRvcikpXHJcbiAgICAgICAgICAgICAgICB0YXJnZXREZXNjcmlwdG9yID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgICAgIHJldHVybiBEZWNvcmF0ZVByb3BlcnR5KGRlY29yYXRvcnMsIHRhcmdldCwgdGFyZ2V0S2V5LCB0YXJnZXREZXNjcmlwdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghSXNBcnJheShkZWNvcmF0b3JzKSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgaWYgKCFJc0NvbnN0cnVjdG9yKHRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBEZWNvcmF0ZUNvbnN0cnVjdG9yKGRlY29yYXRvcnMsIHRhcmdldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5kZWNvcmF0ZSA9IGRlY29yYXRlO1xyXG4gICAgLyoqXHJcbiAgICAgICogQSBkZWZhdWx0IG1ldGFkYXRhIGRlY29yYXRvciBmYWN0b3J5IHRoYXQgY2FuIGJlIHVzZWQgb24gYSBjbGFzcywgY2xhc3MgbWVtYmVyLCBvciBwYXJhbWV0ZXIuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IFRoZSBrZXkgZm9yIHRoZSBtZXRhZGF0YSBlbnRyeS5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFWYWx1ZSBUaGUgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBlbnRyeS5cclxuICAgICAgKiBAcmV0dXJucyBBIGRlY29yYXRvciBmdW5jdGlvbi5cclxuICAgICAgKiBAcmVtYXJrc1xyXG4gICAgICAqIElmIGBtZXRhZGF0YUtleWAgaXMgYWxyZWFkeSBkZWZpbmVkIGZvciB0aGUgdGFyZ2V0IGFuZCB0YXJnZXQga2V5LCB0aGVcclxuICAgICAgKiBtZXRhZGF0YVZhbHVlIGZvciB0aGF0IGtleSB3aWxsIGJlIG92ZXJ3cml0dGVuLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IsIFR5cGVTY3JpcHQgb25seSlcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSwgVHlwZVNjcmlwdCBvbmx5KVxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXHJcbiAgICAgICogICAgICAgICBwcm9wZXJ0eTtcclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QoKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXHJcbiAgICAgICogICAgICAgICBtZXRob2QoKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBtZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGRlY29yYXRvcih0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgICAgICAgICBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzQ29uc3RydWN0b3IodGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIC8qdGFyZ2V0S2V5Ki8gdW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGVjb3JhdG9yO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5tZXRhZGF0YSA9IG1ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogRGVmaW5lIGEgdW5pcXVlIG1ldGFkYXRhIGVudHJ5IG9uIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YVZhbHVlIEEgdmFsdWUgdGhhdCBjb250YWlucyBhdHRhY2hlZCBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRvIGRlZmluZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gZGVjb3JhdG9yIGZhY3RvcnkgYXMgbWV0YWRhdGEtcHJvZHVjaW5nIGFubm90YXRpb24uXHJcbiAgICAgICogICAgIGZ1bmN0aW9uIE15QW5ub3RhdGlvbihvcHRpb25zKTogRGVjb3JhdG9yIHtcclxuICAgICAgKiAgICAgICAgIHJldHVybiAodGFyZ2V0LCBrZXk/KSA9PiBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgdGFyZ2V0LCBrZXkpO1xyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRlZmluZU1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhID0gZGVmaW5lTWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIGEgdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4gaGFzIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGtleSB3YXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluOyBvdGhlcndpc2UsIGBmYWxzZWAuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBoYXNNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5oYXNNZXRhZGF0YSA9IGhhc01ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyBhIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgdGFyZ2V0IG9iamVjdCBoYXMgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEga2V5IHdhcyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0OyBvdGhlcndpc2UsIGBmYWxzZWAuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBoYXNPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5oYXNPd25NZXRhZGF0YSA9IGhhc093bk1ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbi5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBUaGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBrZXkgaWYgZm91bmQ7IG90aGVyd2lzZSwgYHVuZGVmaW5lZGAuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5nZXRNZXRhZGF0YSA9IGdldE1ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgb24gdGhlIHRhcmdldCBvYmplY3QuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgVGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEga2V5IGlmIGZvdW5kOyBvdGhlcndpc2UsIGB1bmRlZmluZWRgLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0T3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEgPSBnZXRPd25NZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIGtleXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdW5pcXVlIG1ldGFkYXRhIGtleXMuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0TWV0YWRhdGFLZXlzKHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5TWV0YWRhdGFLZXlzKHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzID0gZ2V0TWV0YWRhdGFLZXlzO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyB0aGUgdW5pcXVlIG1ldGFkYXRhIGtleXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHVuaXF1ZSBtZXRhZGF0YSBrZXlzLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldE93bk1ldGFkYXRhS2V5cyh0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyh0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyA9IGdldE93bk1ldGFkYXRhS2V5cztcclxuICAgIC8qKlxyXG4gICAgICAqIERlbGV0ZXMgdGhlIG1ldGFkYXRhIGVudHJ5IGZyb20gdGhlIHRhcmdldCBvYmplY3Qgd2l0aCB0aGUgcHJvdmlkZWQga2V5LlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEgZW50cnkgd2FzIGZvdW5kIGFuZCBkZWxldGVkOyBvdGhlcndpc2UsIGZhbHNlLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGVsZXRlTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjZGVsZXRlbWV0YWRhdGEtbWV0YWRhdGFrZXktcC1cclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKHRhcmdldCwgdGFyZ2V0S2V5LCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFtZXRhZGF0YU1hcC5kZWxldGUobWV0YWRhdGFLZXkpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG1ldGFkYXRhTWFwLnNpemUgPiAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB2YXIgdGFyZ2V0TWV0YWRhdGEgPSBNZXRhZGF0YS5nZXQodGFyZ2V0KTtcclxuICAgICAgICB0YXJnZXRNZXRhZGF0YS5kZWxldGUodGFyZ2V0S2V5KTtcclxuICAgICAgICBpZiAodGFyZ2V0TWV0YWRhdGEuc2l6ZSA+IDApXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIE1ldGFkYXRhLmRlbGV0ZSh0YXJnZXQpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5kZWxldGVNZXRhZGF0YSA9IGRlbGV0ZU1ldGFkYXRhO1xyXG4gICAgZnVuY3Rpb24gRGVjb3JhdGVDb25zdHJ1Y3RvcihkZWNvcmF0b3JzLCB0YXJnZXQpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICB2YXIgZGVjb3JhdG9yID0gZGVjb3JhdG9yc1tpXTtcclxuICAgICAgICAgICAgdmFyIGRlY29yYXRlZCA9IGRlY29yYXRvcih0YXJnZXQpO1xyXG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKGRlY29yYXRlZCkgJiYgIUlzTnVsbChkZWNvcmF0ZWQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzQ29uc3RydWN0b3IoZGVjb3JhdGVkKSlcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBkZWNvcmF0ZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIERlY29yYXRlUHJvcGVydHkoZGVjb3JhdG9ycywgdGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgIHZhciBkZWNvcmF0b3IgPSBkZWNvcmF0b3JzW2ldO1xyXG4gICAgICAgICAgICB2YXIgZGVjb3JhdGVkID0gZGVjb3JhdG9yKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpO1xyXG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKGRlY29yYXRlZCkgJiYgIUlzTnVsbChkZWNvcmF0ZWQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KGRlY29yYXRlZCkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvciA9IGRlY29yYXRlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGVzY3JpcHRvcjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgQ3JlYXRlKSB7XHJcbiAgICAgICAgdmFyIHRhcmdldE1ldGFkYXRhID0gTWV0YWRhdGEuZ2V0KE8pO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZCh0YXJnZXRNZXRhZGF0YSkpIHtcclxuICAgICAgICAgICAgaWYgKCFDcmVhdGUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0YXJnZXRNZXRhZGF0YSA9IG5ldyBfTWFwKCk7XHJcbiAgICAgICAgICAgIE1ldGFkYXRhLnNldChPLCB0YXJnZXRNZXRhZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IHRhcmdldE1ldGFkYXRhLmdldChQKTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKSB7XHJcbiAgICAgICAgICAgIGlmICghQ3JlYXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgbWV0YWRhdGFNYXAgPSBuZXcgX01hcCgpO1xyXG4gICAgICAgICAgICB0YXJnZXRNZXRhZGF0YS5zZXQoUCwgbWV0YWRhdGFNYXApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWV0YWRhdGFNYXA7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeSBPYmplY3QgSW50ZXJuYWwgTWV0aG9kcyBhbmQgSW50ZXJuYWwgU2xvdHNcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5LW9iamVjdC1pbnRlcm5hbC1tZXRob2RzLWFuZC1pbnRlcm5hbC1zbG90c1xyXG4gICAgLy8gT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5aGFzbWV0YWRhdGEtLW1ldGFkYXRha2V5LW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcclxuICAgICAgICB2YXIgaGFzT3duID0gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XHJcbiAgICAgICAgaWYgKGhhc093bilcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XHJcbiAgICAgICAgaWYgKCFJc051bGwocGFyZW50KSlcclxuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIHBhcmVudCwgUCk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5aGFzb3dubWV0YWRhdGEtLW1ldGFkYXRha2V5LW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gVG9Cb29sZWFuKG1ldGFkYXRhTWFwLmhhcyhNZXRhZGF0YUtleSkpO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5Z2V0bWV0YWRhdGEtLW1ldGFkYXRha2V5LW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcclxuICAgICAgICB2YXIgaGFzT3duID0gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XHJcbiAgICAgICAgaWYgKGhhc093bilcclxuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xyXG4gICAgICAgIGlmICghSXNOdWxsKHBhcmVudCkpXHJcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBwYXJlbnQsIFApO1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnlnZXRvd25tZXRhZGF0YS0tbWV0YWRhdGFrZXktby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICByZXR1cm4gbWV0YWRhdGFNYXAuZ2V0KE1ldGFkYXRhS2V5KTtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUsIE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeWRlZmluZW93bm1ldGFkYXRhLS1tZXRhZGF0YWtleS1tZXRhZGF0YXZhbHVlLW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUsIE8sIFApIHtcclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qY3JlYXRlKi8gdHJ1ZSk7XHJcbiAgICAgICAgbWV0YWRhdGFNYXAuc2V0KE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlKTtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5TWV0YWRhdGFLZXlzKE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeW1ldGFkYXRha2V5cy0tby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlNZXRhZGF0YUtleXMoTywgUCkge1xyXG4gICAgICAgIHZhciBvd25LZXlzID0gT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUCk7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XHJcbiAgICAgICAgaWYgKHBhcmVudCA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIG93bktleXM7XHJcbiAgICAgICAgdmFyIHBhcmVudEtleXMgPSBPcmRpbmFyeU1ldGFkYXRhS2V5cyhwYXJlbnQsIFApO1xyXG4gICAgICAgIGlmIChwYXJlbnRLZXlzLmxlbmd0aCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gb3duS2V5cztcclxuICAgICAgICBpZiAob3duS2V5cy5sZW5ndGggPD0gMClcclxuICAgICAgICAgICAgcmV0dXJuIHBhcmVudEtleXM7XHJcbiAgICAgICAgdmFyIHNldCA9IG5ldyBfU2V0KCk7XHJcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIG93bktleXNfMSA9IG93bktleXM7IF9pIDwgb3duS2V5c18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gb3duS2V5c18xW19pXTtcclxuICAgICAgICAgICAgdmFyIGhhc0tleSA9IHNldC5oYXMoa2V5KTtcclxuICAgICAgICAgICAgaWYgKCFoYXNLZXkpIHtcclxuICAgICAgICAgICAgICAgIHNldC5hZGQoa2V5KTtcclxuICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIF9hID0gMCwgcGFyZW50S2V5c18xID0gcGFyZW50S2V5czsgX2EgPCBwYXJlbnRLZXlzXzEubGVuZ3RoOyBfYSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBwYXJlbnRLZXlzXzFbX2FdO1xyXG4gICAgICAgICAgICB2YXIgaGFzS2V5ID0gc2V0LmhhcyhrZXkpO1xyXG4gICAgICAgICAgICBpZiAoIWhhc0tleSkge1xyXG4gICAgICAgICAgICAgICAgc2V0LmFkZChrZXkpO1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnlvd25tZXRhZGF0YWtleXMtLW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApIHtcclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgIHZhciBrZXlzID0gW107XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcclxuICAgICAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICAgICAgdmFyIGtleXNPYmogPSBtZXRhZGF0YU1hcC5rZXlzKCk7XHJcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0gR2V0SXRlcmF0b3Ioa2V5c09iaik7XHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgdmFyIG5leHQgPSBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5leHRWYWx1ZSA9IEl0ZXJhdG9yVmFsdWUobmV4dCk7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2gobmV4dFZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgICAgICAgICBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEVDTUFTY3JpcHQgU3BlY2lmaWNhdGlvblxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyL1xyXG4gICAgLy8gNiBFQ01BU2NyaXB0IERhdGEgVHlwMGVzIGFuZCBWYWx1ZXNcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtZGF0YS10eXBlcy1hbmQtdmFsdWVzXHJcbiAgICBmdW5jdGlvbiBUeXBlKHgpIHtcclxuICAgICAgICBpZiAoeCA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIDEgLyogTnVsbCAqLztcclxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB4KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjogcmV0dXJuIDAgLyogVW5kZWZpbmVkICovO1xyXG4gICAgICAgICAgICBjYXNlIFwiYm9vbGVhblwiOiByZXR1cm4gMiAvKiBCb29sZWFuICovO1xyXG4gICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6IHJldHVybiAzIC8qIFN0cmluZyAqLztcclxuICAgICAgICAgICAgY2FzZSBcInN5bWJvbFwiOiByZXR1cm4gNCAvKiBTeW1ib2wgKi87XHJcbiAgICAgICAgICAgIGNhc2UgXCJudW1iZXJcIjogcmV0dXJuIDUgLyogTnVtYmVyICovO1xyXG4gICAgICAgICAgICBjYXNlIFwib2JqZWN0XCI6IHJldHVybiB4ID09PSBudWxsID8gMSAvKiBOdWxsICovIDogNiAvKiBPYmplY3QgKi87XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiA2IC8qIE9iamVjdCAqLztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyA2LjEuMSBUaGUgVW5kZWZpbmVkIFR5cGVcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtdW5kZWZpbmVkLXR5cGVcclxuICAgIGZ1bmN0aW9uIElzVW5kZWZpbmVkKHgpIHtcclxuICAgICAgICByZXR1cm4geCA9PT0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgLy8gNi4xLjIgVGhlIE51bGwgVHlwZVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy1udWxsLXR5cGVcclxuICAgIGZ1bmN0aW9uIElzTnVsbCh4KSB7XHJcbiAgICAgICAgcmV0dXJuIHggPT09IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyA2LjEuNSBUaGUgU3ltYm9sIFR5cGVcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtc3ltYm9sLXR5cGVcclxuICAgIGZ1bmN0aW9uIElzU3ltYm9sKHgpIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3ltYm9sXCI7XHJcbiAgICB9XHJcbiAgICAvLyA2LjEuNyBUaGUgT2JqZWN0IFR5cGVcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9iamVjdC10eXBlXHJcbiAgICBmdW5jdGlvbiBJc09iamVjdCh4KSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiID8geCAhPT0gbnVsbCA6IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICB9XHJcbiAgICAvLyA3LjEgVHlwZSBDb252ZXJzaW9uXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10eXBlLWNvbnZlcnNpb25cclxuICAgIC8vIDcuMS4xIFRvUHJpbWl0aXZlKGlucHV0IFssIFByZWZlcnJlZFR5cGVdKVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9wcmltaXRpdmVcclxuICAgIGZ1bmN0aW9uIFRvUHJpbWl0aXZlKGlucHV0LCBQcmVmZXJyZWRUeXBlKSB7XHJcbiAgICAgICAgc3dpdGNoIChUeXBlKGlucHV0KSkge1xyXG4gICAgICAgICAgICBjYXNlIDAgLyogVW5kZWZpbmVkICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgICAgIGNhc2UgMSAvKiBOdWxsICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgICAgIGNhc2UgMiAvKiBCb29sZWFuICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgICAgIGNhc2UgMyAvKiBTdHJpbmcgKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgY2FzZSA0IC8qIFN5bWJvbCAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgICAgICBjYXNlIDUgLyogTnVtYmVyICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBoaW50ID0gUHJlZmVycmVkVHlwZSA9PT0gMyAvKiBTdHJpbmcgKi8gPyBcInN0cmluZ1wiIDogUHJlZmVycmVkVHlwZSA9PT0gNSAvKiBOdW1iZXIgKi8gPyBcIm51bWJlclwiIDogXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgdmFyIGV4b3RpY1RvUHJpbSA9IEdldE1ldGhvZChpbnB1dCwgdG9QcmltaXRpdmVTeW1ib2wpO1xyXG4gICAgICAgIGlmIChleG90aWNUb1ByaW0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZXhvdGljVG9QcmltLmNhbGwoaW5wdXQsIGhpbnQpO1xyXG4gICAgICAgICAgICBpZiAoSXNPYmplY3QocmVzdWx0KSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5VG9QcmltaXRpdmUoaW5wdXQsIGhpbnQgPT09IFwiZGVmYXVsdFwiID8gXCJudW1iZXJcIiA6IGhpbnQpO1xyXG4gICAgfVxyXG4gICAgLy8gNy4xLjEuMSBPcmRpbmFyeVRvUHJpbWl0aXZlKE8sIGhpbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeXRvcHJpbWl0aXZlXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeVRvUHJpbWl0aXZlKE8sIGhpbnQpIHtcclxuICAgICAgICBpZiAoaGludCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgdG9TdHJpbmdfMSA9IE8udG9TdHJpbmc7XHJcbiAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHRvU3RyaW5nXzEpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdG9TdHJpbmdfMS5jYWxsKE8pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHZhbHVlT2YgPSBPLnZhbHVlT2Y7XHJcbiAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHZhbHVlT2YpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVPZi5jYWxsKE8pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZU9mID0gTy52YWx1ZU9mO1xyXG4gICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh2YWx1ZU9mKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlT2YuY2FsbChPKTtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB0b1N0cmluZ18yID0gTy50b1N0cmluZztcclxuICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodG9TdHJpbmdfMikpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0b1N0cmluZ18yLmNhbGwoTyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICB9XHJcbiAgICAvLyA3LjEuMiBUb0Jvb2xlYW4oYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvMjAxNi8jc2VjLXRvYm9vbGVhblxyXG4gICAgZnVuY3Rpb24gVG9Cb29sZWFuKGFyZ3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuICEhYXJndW1lbnQ7XHJcbiAgICB9XHJcbiAgICAvLyA3LjEuMTIgVG9TdHJpbmcoYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3N0cmluZ1xyXG4gICAgZnVuY3Rpb24gVG9TdHJpbmcoYXJndW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gXCJcIiArIGFyZ3VtZW50O1xyXG4gICAgfVxyXG4gICAgLy8gNy4xLjE0IFRvUHJvcGVydHlLZXkoYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3Byb3BlcnR5a2V5XHJcbiAgICBmdW5jdGlvbiBUb1Byb3BlcnR5S2V5KGFyZ3VtZW50KSB7XHJcbiAgICAgICAgdmFyIGtleSA9IFRvUHJpbWl0aXZlKGFyZ3VtZW50LCAzIC8qIFN0cmluZyAqLyk7XHJcbiAgICAgICAgaWYgKElzU3ltYm9sKGtleSkpXHJcbiAgICAgICAgICAgIHJldHVybiBrZXk7XHJcbiAgICAgICAgcmV0dXJuIFRvU3RyaW5nKGtleSk7XHJcbiAgICB9XHJcbiAgICAvLyA3LjIgVGVzdGluZyBhbmQgQ29tcGFyaXNvbiBPcGVyYXRpb25zXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10ZXN0aW5nLWFuZC1jb21wYXJpc29uLW9wZXJhdGlvbnNcclxuICAgIC8vIDcuMi4yIElzQXJyYXkoYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2FycmF5XHJcbiAgICBmdW5jdGlvbiBJc0FycmF5KGFyZ3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXlcclxuICAgICAgICAgICAgPyBBcnJheS5pc0FycmF5KGFyZ3VtZW50KVxyXG4gICAgICAgICAgICA6IGFyZ3VtZW50IGluc3RhbmNlb2YgT2JqZWN0XHJcbiAgICAgICAgICAgICAgICA/IGFyZ3VtZW50IGluc3RhbmNlb2YgQXJyYXlcclxuICAgICAgICAgICAgICAgIDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50KSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xyXG4gICAgfVxyXG4gICAgLy8gNy4yLjMgSXNDYWxsYWJsZShhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzY2FsbGFibGVcclxuICAgIGZ1bmN0aW9uIElzQ2FsbGFibGUoYXJndW1lbnQpIHtcclxuICAgICAgICAvLyBOT1RFOiBUaGlzIGlzIGFuIGFwcHJveGltYXRpb24gYXMgd2UgY2Fubm90IGNoZWNrIGZvciBbW0NhbGxdXSBpbnRlcm5hbCBtZXRob2QuXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhcmd1bWVudCA9PT0gXCJmdW5jdGlvblwiO1xyXG4gICAgfVxyXG4gICAgLy8gNy4yLjQgSXNDb25zdHJ1Y3Rvcihhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzY29uc3RydWN0b3JcclxuICAgIGZ1bmN0aW9uIElzQ29uc3RydWN0b3IoYXJndW1lbnQpIHtcclxuICAgICAgICAvLyBOT1RFOiBUaGlzIGlzIGFuIGFwcHJveGltYXRpb24gYXMgd2UgY2Fubm90IGNoZWNrIGZvciBbW0NvbnN0cnVjdF1dIGludGVybmFsIG1ldGhvZC5cclxuICAgICAgICByZXR1cm4gdHlwZW9mIGFyZ3VtZW50ID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICB9XHJcbiAgICAvLyA3LjMgT3BlcmF0aW9ucyBvbiBPYmplY3RzXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcGVyYXRpb25zLW9uLW9iamVjdHNcclxuICAgIC8vIDcuMy45IEdldE1ldGhvZChWLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZ2V0bWV0aG9kXHJcbiAgICBmdW5jdGlvbiBHZXRNZXRob2QoViwgUCkge1xyXG4gICAgICAgIHZhciBmdW5jID0gVltQXTtcclxuICAgICAgICBpZiAoZnVuYyA9PT0gdW5kZWZpbmVkIHx8IGZ1bmMgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKCFJc0NhbGxhYmxlKGZ1bmMpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICB9XHJcbiAgICAvLyA3LjQgT3BlcmF0aW9ucyBvbiBJdGVyYXRvciBPYmplY3RzXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcGVyYXRpb25zLW9uLWl0ZXJhdG9yLW9iamVjdHNcclxuICAgIGZ1bmN0aW9uIEdldEl0ZXJhdG9yKG9iaikge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBHZXRNZXRob2Qob2JqLCBpdGVyYXRvclN5bWJvbCk7XHJcbiAgICAgICAgaWYgKCFJc0NhbGxhYmxlKG1ldGhvZCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTsgLy8gZnJvbSBDYWxsXHJcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0gbWV0aG9kLmNhbGwob2JqKTtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KGl0ZXJhdG9yKSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIHJldHVybiBpdGVyYXRvcjtcclxuICAgIH1cclxuICAgIC8vIDcuNC40IEl0ZXJhdG9yVmFsdWUoaXRlclJlc3VsdClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8yMDE2LyNzZWMtaXRlcmF0b3J2YWx1ZVxyXG4gICAgZnVuY3Rpb24gSXRlcmF0b3JWYWx1ZShpdGVyUmVzdWx0KSB7XHJcbiAgICAgICAgcmV0dXJuIGl0ZXJSZXN1bHQudmFsdWU7XHJcbiAgICB9XHJcbiAgICAvLyA3LjQuNSBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pdGVyYXRvcnN0ZXBcclxuICAgIGZ1bmN0aW9uIEl0ZXJhdG9yU3RlcChpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5kb25lID8gZmFsc2UgOiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICAvLyA3LjQuNiBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yLCBjb21wbGV0aW9uKVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXRlcmF0b3JjbG9zZVxyXG4gICAgZnVuY3Rpb24gSXRlcmF0b3JDbG9zZShpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciBmID0gaXRlcmF0b3JbXCJyZXR1cm5cIl07XHJcbiAgICAgICAgaWYgKGYpXHJcbiAgICAgICAgICAgIGYuY2FsbChpdGVyYXRvcik7XHJcbiAgICB9XHJcbiAgICAvLyA5LjEgT3JkaW5hcnkgT2JqZWN0IEludGVybmFsIE1ldGhvZHMgYW5kIEludGVybmFsIFNsb3RzXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeS1vYmplY3QtaW50ZXJuYWwtbWV0aG9kcy1hbmQtaW50ZXJuYWwtc2xvdHNcclxuICAgIC8vIDkuMS4xLjEgT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnlnZXRwcm90b3R5cGVvZlxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKSB7XHJcbiAgICAgICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE8pO1xyXG4gICAgICAgIGlmICh0eXBlb2YgTyAhPT0gXCJmdW5jdGlvblwiIHx8IE8gPT09IGZ1bmN0aW9uUHJvdG90eXBlKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XHJcbiAgICAgICAgLy8gVHlwZVNjcmlwdCBkb2Vzbid0IHNldCBfX3Byb3RvX18gaW4gRVM1LCBhcyBpdCdzIG5vbi1zdGFuZGFyZC5cclxuICAgICAgICAvLyBUcnkgdG8gZGV0ZXJtaW5lIHRoZSBzdXBlcmNsYXNzIGNvbnN0cnVjdG9yLiBDb21wYXRpYmxlIGltcGxlbWVudGF0aW9uc1xyXG4gICAgICAgIC8vIG11c3QgZWl0aGVyIHNldCBfX3Byb3RvX18gb24gYSBzdWJjbGFzcyBjb25zdHJ1Y3RvciB0byB0aGUgc3VwZXJjbGFzcyBjb25zdHJ1Y3RvcixcclxuICAgICAgICAvLyBvciBlbnN1cmUgZWFjaCBjbGFzcyBoYXMgYSB2YWxpZCBgY29uc3RydWN0b3JgIHByb3BlcnR5IG9uIGl0cyBwcm90b3R5cGUgdGhhdFxyXG4gICAgICAgIC8vIHBvaW50cyBiYWNrIHRvIHRoZSBjb25zdHJ1Y3Rvci5cclxuICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBGdW5jdGlvbi5bW1Byb3RvdHlwZV1dLCB0aGVuIHRoaXMgaXMgZGVmaW5hdGVseSBpbmhlcml0ZWQuXHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgY2FzZSB3aGVuIGluIEVTNiBvciB3aGVuIHVzaW5nIF9fcHJvdG9fXyBpbiBhIGNvbXBhdGlibGUgYnJvd3Nlci5cclxuICAgICAgICBpZiAocHJvdG8gIT09IGZ1bmN0aW9uUHJvdG90eXBlKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XHJcbiAgICAgICAgLy8gSWYgdGhlIHN1cGVyIHByb3RvdHlwZSBpcyBPYmplY3QucHJvdG90eXBlLCBudWxsLCBvciB1bmRlZmluZWQsIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXHJcbiAgICAgICAgdmFyIHByb3RvdHlwZSA9IE8ucHJvdG90eXBlO1xyXG4gICAgICAgIHZhciBwcm90b3R5cGVQcm90byA9IHByb3RvdHlwZSAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG90eXBlKTtcclxuICAgICAgICBpZiAocHJvdG90eXBlUHJvdG8gPT0gbnVsbCB8fCBwcm90b3R5cGVQcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSlcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xyXG4gICAgICAgIC8vIElmIHRoZSBjb25zdHJ1Y3RvciB3YXMgbm90IGEgZnVuY3Rpb24sIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXHJcbiAgICAgICAgdmFyIGNvbnN0cnVjdG9yID0gcHJvdG90eXBlUHJvdG8uY29uc3RydWN0b3I7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XHJcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBzb21lIGtpbmQgb2Ygc2VsZi1yZWZlcmVuY2UsIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXHJcbiAgICAgICAgaWYgKGNvbnN0cnVjdG9yID09PSBPKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XHJcbiAgICAgICAgLy8gd2UgaGF2ZSBhIHByZXR0eSBnb29kIGd1ZXNzIGF0IHRoZSBoZXJpdGFnZS5cclxuICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XHJcbiAgICB9XHJcbiAgICAvLyBuYWl2ZSBNYXAgc2hpbVxyXG4gICAgZnVuY3Rpb24gQ3JlYXRlTWFwUG9seWZpbGwoKSB7XHJcbiAgICAgICAgdmFyIGNhY2hlU2VudGluZWwgPSB7fTtcclxuICAgICAgICB2YXIgYXJyYXlTZW50aW5lbCA9IFtdO1xyXG4gICAgICAgIHZhciBNYXBJdGVyYXRvciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIE1hcEl0ZXJhdG9yKGtleXMsIHZhbHVlcywgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBrZXlzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfTtcclxuICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH07XHJcbiAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5faW5kZXg7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHRoaXMuX2tleXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX3NlbGVjdG9yKHRoaXMuX2tleXNbaW5kZXhdLCB0aGlzLl92YWx1ZXNbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggKyAxID49IHRoaXMuX2tleXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHJlc3VsdCwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLnRocm93ID0gZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUucmV0dXJuID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB2YWx1ZSwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gTWFwSXRlcmF0b3I7XHJcbiAgICAgICAgfSgpKTtcclxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gTWFwKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hcC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2tleXMubGVuZ3RoOyB9LFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7IHJldHVybiB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSkgPj0gMDsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXggPj0gMCA/IHRoaXMuX3ZhbHVlc1tpbmRleF0gOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzW2luZGV4XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2tleXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBpbmRleCArIDE7IGkgPCBzaXplOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5c1tpIC0gMV0gPSB0aGlzLl9rZXlzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXNbaSAtIDFdID0gdGhpcy5fdmFsdWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLmxlbmd0aC0tO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5sZW5ndGgtLTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB0aGlzLl9jYWNoZUtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0S2V5KTsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRWYWx1ZSk7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldEVudHJ5KTsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmVudHJpZXMoKTsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmVudHJpZXMoKTsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5fZmluZCA9IGZ1bmN0aW9uIChrZXksIGluc2VydCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NhY2hlS2V5ID09PSBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9rZXlzLmluZGV4T2Yoa2V5KTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IDAgJiYgaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSB0aGlzLl9rZXlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMucHVzaCh1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlS2V5ID0ga2V5LCB0aGlzLl9jYWNoZUluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBNYXA7XHJcbiAgICAgICAgfSgpKTtcclxuICAgICAgICBmdW5jdGlvbiBnZXRLZXkoa2V5LCBfKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFZhbHVlKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RW50cnkoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW2tleSwgdmFsdWVdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIG5haXZlIFNldCBzaGltXHJcbiAgICBmdW5jdGlvbiBDcmVhdGVTZXRQb2x5ZmlsbCgpIHtcclxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gU2V0KCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwID0gbmV3IF9NYXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2V0LnByb3RvdHlwZSwgXCJzaXplXCIsIHtcclxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLnNpemU7IH0sXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLmhhcyh2YWx1ZSk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuc2V0KHZhbHVlLCB2YWx1ZSksIHRoaXM7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuZGVsZXRlKHZhbHVlKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHsgdGhpcy5fbWFwLmNsZWFyKCk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5rZXlzKCk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLnZhbHVlcygpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAuZW50cmllcygpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMua2V5cygpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMua2V5cygpOyB9O1xyXG4gICAgICAgICAgICByZXR1cm4gU2V0O1xyXG4gICAgICAgIH0oKSk7XHJcbiAgICB9XHJcbiAgICAvLyBuYWl2ZSBXZWFrTWFwIHNoaW1cclxuICAgIGZ1bmN0aW9uIENyZWF0ZVdlYWtNYXBQb2x5ZmlsbCgpIHtcclxuICAgICAgICB2YXIgVVVJRF9TSVpFID0gMTY7XHJcbiAgICAgICAgdmFyIGtleXMgPSBjcmVhdGVEaWN0aW9uYXJ5KCk7XHJcbiAgICAgICAgdmFyIHJvb3RLZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcclxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gV2Vha01hcCgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2tleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IEhhc2hNYXAuaGFzKHRhYmxlLCB0aGlzLl9rZXkpIDogZmFsc2U7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IEhhc2hNYXAuZ2V0KHRhYmxlLCB0aGlzLl9rZXkpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodGFyZ2V0LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGFibGVbdGhpcy5fa2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IGRlbGV0ZSB0YWJsZVt0aGlzLl9rZXldIDogZmFsc2U7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gTk9URTogbm90IGEgcmVhbCBjbGVhciwganVzdCBtYWtlcyB0aGUgcHJldmlvdXMgZGF0YSB1bnJlYWNoYWJsZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBXZWFrTWFwO1xyXG4gICAgICAgIH0oKSk7XHJcbiAgICAgICAgZnVuY3Rpb24gQ3JlYXRlVW5pcXVlS2V5KCkge1xyXG4gICAgICAgICAgICB2YXIga2V5O1xyXG4gICAgICAgICAgICBkb1xyXG4gICAgICAgICAgICAgICAga2V5ID0gXCJAQFdlYWtNYXBAQFwiICsgQ3JlYXRlVVVJRCgpO1xyXG4gICAgICAgICAgICB3aGlsZSAoSGFzaE1hcC5oYXMoa2V5cywga2V5KSk7XHJcbiAgICAgICAgICAgIGtleXNba2V5XSA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgY3JlYXRlKSB7XHJcbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwodGFyZ2V0LCByb290S2V5KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjcmVhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHJvb3RLZXksIHsgdmFsdWU6IGNyZWF0ZURpY3Rpb25hcnkoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Jvb3RLZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBGaWxsUmFuZG9tQnl0ZXMoYnVmZmVyLCBzaXplKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgKytpKVxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW2ldID0gTWF0aC5yYW5kb20oKSAqIDB4ZmYgfCAwO1xyXG4gICAgICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBHZW5SYW5kb21CeXRlcyhzaXplKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgVWludDhBcnJheSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNyeXB0byAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShzaXplKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1zQ3J5cHRvICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtc0NyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEZpbGxSYW5kb21CeXRlcyhuZXcgVWludDhBcnJheShzaXplKSwgc2l6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIEZpbGxSYW5kb21CeXRlcyhuZXcgQXJyYXkoc2l6ZSksIHNpemUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBDcmVhdGVVVUlEKCkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IEdlblJhbmRvbUJ5dGVzKFVVSURfU0laRSk7XHJcbiAgICAgICAgICAgIC8vIG1hcmsgYXMgcmFuZG9tIC0gUkZDIDQxMjIgwqcgNC40XHJcbiAgICAgICAgICAgIGRhdGFbNl0gPSBkYXRhWzZdICYgMHg0ZiB8IDB4NDA7XHJcbiAgICAgICAgICAgIGRhdGFbOF0gPSBkYXRhWzhdICYgMHhiZiB8IDB4ODA7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBVVUlEX1NJWkU7ICsrb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYnl0ZSA9IGRhdGFbb2Zmc2V0XTtcclxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDQgfHwgb2Zmc2V0ID09PSA2IHx8IG9mZnNldCA9PT0gOClcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCItXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnl0ZSA8IDE2KVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBieXRlLnRvU3RyaW5nKDE2KS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gdXNlcyBhIGhldXJpc3RpYyB1c2VkIGJ5IHY4IGFuZCBjaGFrcmEgdG8gZm9yY2UgYW4gb2JqZWN0IGludG8gZGljdGlvbmFyeSBtb2RlLlxyXG4gICAgZnVuY3Rpb24gTWFrZURpY3Rpb25hcnkob2JqKSB7XHJcbiAgICAgICAgb2JqLl9fID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGRlbGV0ZSBvYmouX187XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuICAgIC8vIHBhdGNoIGdsb2JhbCBSZWZsZWN0XHJcbiAgICAoZnVuY3Rpb24gKF9fZ2xvYmFsKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBfX2dsb2JhbC5SZWZsZWN0ICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIGlmIChfX2dsb2JhbC5SZWZsZWN0ICE9PSBSZWZsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwIGluIFJlZmxlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwoUmVmbGVjdCwgcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX19nbG9iYWwuUmVmbGVjdFtwXSA9IFJlZmxlY3RbcF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBfX2dsb2JhbC5SZWZsZWN0ID0gUmVmbGVjdDtcclxuICAgICAgICB9XHJcbiAgICB9KSh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDpcclxuICAgICAgICB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOlxyXG4gICAgICAgICAgICBGdW5jdGlvbihcInJldHVybiB0aGlzO1wiKSgpKTtcclxufSkoUmVmbGVjdCB8fCAoUmVmbGVjdCA9IHt9KSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVJlZmxlY3QuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9pbmRleCcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZG9tRnJvbVNlZWQgPSByZXF1aXJlKCcuL3JhbmRvbS9yYW5kb20tZnJvbS1zZWVkJyk7XG5cbnZhciBPUklHSU5BTCA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWl8tJztcbnZhciBhbHBoYWJldDtcbnZhciBwcmV2aW91c1NlZWQ7XG5cbnZhciBzaHVmZmxlZDtcblxuZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgc2h1ZmZsZWQgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc2V0Q2hhcmFjdGVycyhfYWxwaGFiZXRfKSB7XG4gICAgaWYgKCFfYWxwaGFiZXRfKSB7XG4gICAgICAgIGlmIChhbHBoYWJldCAhPT0gT1JJR0lOQUwpIHtcbiAgICAgICAgICAgIGFscGhhYmV0ID0gT1JJR0lOQUw7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoX2FscGhhYmV0XyA9PT0gYWxwaGFiZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChfYWxwaGFiZXRfLmxlbmd0aCAhPT0gT1JJR0lOQUwubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ3VzdG9tIGFscGhhYmV0IGZvciBzaG9ydGlkIG11c3QgYmUgJyArIE9SSUdJTkFMLmxlbmd0aCArICcgdW5pcXVlIGNoYXJhY3RlcnMuIFlvdSBzdWJtaXR0ZWQgJyArIF9hbHBoYWJldF8ubGVuZ3RoICsgJyBjaGFyYWN0ZXJzOiAnICsgX2FscGhhYmV0Xyk7XG4gICAgfVxuXG4gICAgdmFyIHVuaXF1ZSA9IF9hbHBoYWJldF8uc3BsaXQoJycpLmZpbHRlcihmdW5jdGlvbihpdGVtLCBpbmQsIGFycil7XG4gICAgICAgcmV0dXJuIGluZCAhPT0gYXJyLmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHVuaXF1ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDdXN0b20gYWxwaGFiZXQgZm9yIHNob3J0aWQgbXVzdCBiZSAnICsgT1JJR0lOQUwubGVuZ3RoICsgJyB1bmlxdWUgY2hhcmFjdGVycy4gVGhlc2UgY2hhcmFjdGVycyB3ZXJlIG5vdCB1bmlxdWU6ICcgKyB1bmlxdWUuam9pbignLCAnKSk7XG4gICAgfVxuXG4gICAgYWxwaGFiZXQgPSBfYWxwaGFiZXRfO1xuICAgIHJlc2V0KCk7XG59XG5cbmZ1bmN0aW9uIGNoYXJhY3RlcnMoX2FscGhhYmV0Xykge1xuICAgIHNldENoYXJhY3RlcnMoX2FscGhhYmV0Xyk7XG4gICAgcmV0dXJuIGFscGhhYmV0O1xufVxuXG5mdW5jdGlvbiBzZXRTZWVkKHNlZWQpIHtcbiAgICByYW5kb21Gcm9tU2VlZC5zZWVkKHNlZWQpO1xuICAgIGlmIChwcmV2aW91c1NlZWQgIT09IHNlZWQpIHtcbiAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgcHJldmlvdXNTZWVkID0gc2VlZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNodWZmbGUoKSB7XG4gICAgaWYgKCFhbHBoYWJldCkge1xuICAgICAgICBzZXRDaGFyYWN0ZXJzKE9SSUdJTkFMKTtcbiAgICB9XG5cbiAgICB2YXIgc291cmNlQXJyYXkgPSBhbHBoYWJldC5zcGxpdCgnJyk7XG4gICAgdmFyIHRhcmdldEFycmF5ID0gW107XG4gICAgdmFyIHIgPSByYW5kb21Gcm9tU2VlZC5uZXh0VmFsdWUoKTtcbiAgICB2YXIgY2hhcmFjdGVySW5kZXg7XG5cbiAgICB3aGlsZSAoc291cmNlQXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICByID0gcmFuZG9tRnJvbVNlZWQubmV4dFZhbHVlKCk7XG4gICAgICAgIGNoYXJhY3RlckluZGV4ID0gTWF0aC5mbG9vcihyICogc291cmNlQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgdGFyZ2V0QXJyYXkucHVzaChzb3VyY2VBcnJheS5zcGxpY2UoY2hhcmFjdGVySW5kZXgsIDEpWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldEFycmF5LmpvaW4oJycpO1xufVxuXG5mdW5jdGlvbiBnZXRTaHVmZmxlZCgpIHtcbiAgICBpZiAoc2h1ZmZsZWQpIHtcbiAgICAgICAgcmV0dXJuIHNodWZmbGVkO1xuICAgIH1cbiAgICBzaHVmZmxlZCA9IHNodWZmbGUoKTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG59XG5cbi8qKlxuICogbG9va3VwIHNodWZmbGVkIGxldHRlclxuICogQHBhcmFtIGluZGV4XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBsb29rdXAoaW5kZXgpIHtcbiAgICB2YXIgYWxwaGFiZXRTaHVmZmxlZCA9IGdldFNodWZmbGVkKCk7XG4gICAgcmV0dXJuIGFscGhhYmV0U2h1ZmZsZWRbaW5kZXhdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjaGFyYWN0ZXJzOiBjaGFyYWN0ZXJzLFxuICAgIHNlZWQ6IHNldFNlZWQsXG4gICAgbG9va3VwOiBsb29rdXAsXG4gICAgc2h1ZmZsZWQ6IGdldFNodWZmbGVkXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFscGhhYmV0ID0gcmVxdWlyZSgnLi9hbHBoYWJldCcpO1xuXG4vKipcbiAqIERlY29kZSB0aGUgaWQgdG8gZ2V0IHRoZSB2ZXJzaW9uIGFuZCB3b3JrZXJcbiAqIE1haW5seSBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nLlxuICogQHBhcmFtIGlkIC0gdGhlIHNob3J0aWQtZ2VuZXJhdGVkIGlkLlxuICovXG5mdW5jdGlvbiBkZWNvZGUoaWQpIHtcbiAgICB2YXIgY2hhcmFjdGVycyA9IGFscGhhYmV0LnNodWZmbGVkKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogY2hhcmFjdGVycy5pbmRleE9mKGlkLnN1YnN0cigwLCAxKSkgJiAweDBmLFxuICAgICAgICB3b3JrZXI6IGNoYXJhY3RlcnMuaW5kZXhPZihpZC5zdWJzdHIoMSwgMSkpICYgMHgwZlxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVjb2RlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZG9tQnl0ZSA9IHJlcXVpcmUoJy4vcmFuZG9tL3JhbmRvbS1ieXRlJyk7XG5cbmZ1bmN0aW9uIGVuY29kZShsb29rdXAsIG51bWJlcikge1xuICAgIHZhciBsb29wQ291bnRlciA9IDA7XG4gICAgdmFyIGRvbmU7XG5cbiAgICB2YXIgc3RyID0gJyc7XG5cbiAgICB3aGlsZSAoIWRvbmUpIHtcbiAgICAgICAgc3RyID0gc3RyICsgbG9va3VwKCAoIChudW1iZXIgPj4gKDQgKiBsb29wQ291bnRlcikpICYgMHgwZiApIHwgcmFuZG9tQnl0ZSgpICk7XG4gICAgICAgIGRvbmUgPSBudW1iZXIgPCAoTWF0aC5wb3coMTYsIGxvb3BDb3VudGVyICsgMSApICk7XG4gICAgICAgIGxvb3BDb3VudGVyKys7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZW5jb2RlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYWxwaGFiZXQgPSByZXF1aXJlKCcuL2FscGhhYmV0Jyk7XG52YXIgZW5jb2RlID0gcmVxdWlyZSgnLi9lbmNvZGUnKTtcbnZhciBkZWNvZGUgPSByZXF1aXJlKCcuL2RlY29kZScpO1xudmFyIGlzVmFsaWQgPSByZXF1aXJlKCcuL2lzLXZhbGlkJyk7XG5cbi8vIElnbm9yZSBhbGwgbWlsbGlzZWNvbmRzIGJlZm9yZSBhIGNlcnRhaW4gdGltZSB0byByZWR1Y2UgdGhlIHNpemUgb2YgdGhlIGRhdGUgZW50cm9weSB3aXRob3V0IHNhY3JpZmljaW5nIHVuaXF1ZW5lc3MuXG4vLyBUaGlzIG51bWJlciBzaG91bGQgYmUgdXBkYXRlZCBldmVyeSB5ZWFyIG9yIHNvIHRvIGtlZXAgdGhlIGdlbmVyYXRlZCBpZCBzaG9ydC5cbi8vIFRvIHJlZ2VuZXJhdGUgYG5ldyBEYXRlKCkgLSAwYCBhbmQgYnVtcCB0aGUgdmVyc2lvbi4gQWx3YXlzIGJ1bXAgdGhlIHZlcnNpb24hXG52YXIgUkVEVUNFX1RJTUUgPSAxNDU5NzA3NjA2NTE4O1xuXG4vLyBkb24ndCBjaGFuZ2UgdW5sZXNzIHdlIGNoYW5nZSB0aGUgYWxnb3Mgb3IgUkVEVUNFX1RJTUVcbi8vIG11c3QgYmUgYW4gaW50ZWdlciBhbmQgbGVzcyB0aGFuIDE2XG52YXIgdmVyc2lvbiA9IDY7XG5cbi8vIGlmIHlvdSBhcmUgdXNpbmcgY2x1c3RlciBvciBtdWx0aXBsZSBzZXJ2ZXJzIHVzZSB0aGlzIHRvIG1ha2UgZWFjaCBpbnN0YW5jZVxuLy8gaGFzIGEgdW5pcXVlIHZhbHVlIGZvciB3b3JrZXJcbi8vIE5vdGU6IEkgZG9uJ3Qga25vdyBpZiB0aGlzIGlzIGF1dG9tYXRpY2FsbHkgc2V0IHdoZW4gdXNpbmcgdGhpcmRcbi8vIHBhcnR5IGNsdXN0ZXIgc29sdXRpb25zIHN1Y2ggYXMgcG0yLlxudmFyIGNsdXN0ZXJXb3JrZXJJZCA9IHJlcXVpcmUoJy4vdXRpbC9jbHVzdGVyLXdvcmtlci1pZCcpIHx8IDA7XG5cbi8vIENvdW50ZXIgaXMgdXNlZCB3aGVuIHNob3J0aWQgaXMgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGluIG9uZSBzZWNvbmQuXG52YXIgY291bnRlcjtcblxuLy8gUmVtZW1iZXIgdGhlIGxhc3QgdGltZSBzaG9ydGlkIHdhcyBjYWxsZWQgaW4gY2FzZSBjb3VudGVyIGlzIG5lZWRlZC5cbnZhciBwcmV2aW91c1NlY29uZHM7XG5cbi8qKlxuICogR2VuZXJhdGUgdW5pcXVlIGlkXG4gKiBSZXR1cm5zIHN0cmluZyBpZFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZSgpIHtcblxuICAgIHZhciBzdHIgPSAnJztcblxuICAgIHZhciBzZWNvbmRzID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIFJFRFVDRV9USU1FKSAqIDAuMDAxKTtcblxuICAgIGlmIChzZWNvbmRzID09PSBwcmV2aW91c1NlY29uZHMpIHtcbiAgICAgICAgY291bnRlcisrO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvdW50ZXIgPSAwO1xuICAgICAgICBwcmV2aW91c1NlY29uZHMgPSBzZWNvbmRzO1xuICAgIH1cblxuICAgIHN0ciA9IHN0ciArIGVuY29kZShhbHBoYWJldC5sb29rdXAsIHZlcnNpb24pO1xuICAgIHN0ciA9IHN0ciArIGVuY29kZShhbHBoYWJldC5sb29rdXAsIGNsdXN0ZXJXb3JrZXJJZCk7XG4gICAgaWYgKGNvdW50ZXIgPiAwKSB7XG4gICAgICAgIHN0ciA9IHN0ciArIGVuY29kZShhbHBoYWJldC5sb29rdXAsIGNvdW50ZXIpO1xuICAgIH1cbiAgICBzdHIgPSBzdHIgKyBlbmNvZGUoYWxwaGFiZXQubG9va3VwLCBzZWNvbmRzKTtcblxuICAgIHJldHVybiBzdHI7XG59XG5cblxuLyoqXG4gKiBTZXQgdGhlIHNlZWQuXG4gKiBIaWdobHkgcmVjb21tZW5kZWQgaWYgeW91IGRvbid0IHdhbnQgcGVvcGxlIHRvIHRyeSB0byBmaWd1cmUgb3V0IHlvdXIgaWQgc2NoZW1hLlxuICogZXhwb3NlZCBhcyBzaG9ydGlkLnNlZWQoaW50KVxuICogQHBhcmFtIHNlZWQgSW50ZWdlciB2YWx1ZSB0byBzZWVkIHRoZSByYW5kb20gYWxwaGFiZXQuICBBTFdBWVMgVVNFIFRIRSBTQU1FIFNFRUQgb3IgeW91IG1pZ2h0IGdldCBvdmVybGFwcy5cbiAqL1xuZnVuY3Rpb24gc2VlZChzZWVkVmFsdWUpIHtcbiAgICBhbHBoYWJldC5zZWVkKHNlZWRWYWx1ZSk7XG4gICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vKipcbiAqIFNldCB0aGUgY2x1c3RlciB3b3JrZXIgb3IgbWFjaGluZSBpZFxuICogZXhwb3NlZCBhcyBzaG9ydGlkLndvcmtlcihpbnQpXG4gKiBAcGFyYW0gd29ya2VySWQgd29ya2VyIG11c3QgYmUgcG9zaXRpdmUgaW50ZWdlci4gIE51bWJlciBsZXNzIHRoYW4gMTYgaXMgcmVjb21tZW5kZWQuXG4gKiByZXR1cm5zIHNob3J0aWQgbW9kdWxlIHNvIGl0IGNhbiBiZSBjaGFpbmVkLlxuICovXG5mdW5jdGlvbiB3b3JrZXIod29ya2VySWQpIHtcbiAgICBjbHVzdGVyV29ya2VySWQgPSB3b3JrZXJJZDtcbiAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8qKlxuICpcbiAqIHNldHMgbmV3IGNoYXJhY3RlcnMgdG8gdXNlIGluIHRoZSBhbHBoYWJldFxuICogcmV0dXJucyB0aGUgc2h1ZmZsZWQgYWxwaGFiZXRcbiAqL1xuZnVuY3Rpb24gY2hhcmFjdGVycyhuZXdDaGFyYWN0ZXJzKSB7XG4gICAgaWYgKG5ld0NoYXJhY3RlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhbHBoYWJldC5jaGFyYWN0ZXJzKG5ld0NoYXJhY3RlcnMpO1xuICAgIH1cblxuICAgIHJldHVybiBhbHBoYWJldC5zaHVmZmxlZCgpO1xufVxuXG5cbi8vIEV4cG9ydCBhbGwgb3RoZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMgb2YgdGhlIGdlbmVyYXRlIGZ1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYXRlO1xubW9kdWxlLmV4cG9ydHMuZ2VuZXJhdGUgPSBnZW5lcmF0ZTtcbm1vZHVsZS5leHBvcnRzLnNlZWQgPSBzZWVkO1xubW9kdWxlLmV4cG9ydHMud29ya2VyID0gd29ya2VyO1xubW9kdWxlLmV4cG9ydHMuY2hhcmFjdGVycyA9IGNoYXJhY3RlcnM7XG5tb2R1bGUuZXhwb3J0cy5kZWNvZGUgPSBkZWNvZGU7XG5tb2R1bGUuZXhwb3J0cy5pc1ZhbGlkID0gaXNWYWxpZDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBhbHBoYWJldCA9IHJlcXVpcmUoJy4vYWxwaGFiZXQnKTtcblxuZnVuY3Rpb24gaXNTaG9ydElkKGlkKSB7XG4gICAgaWYgKCFpZCB8fCB0eXBlb2YgaWQgIT09ICdzdHJpbmcnIHx8IGlkLmxlbmd0aCA8IDYgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgY2hhcmFjdGVycyA9IGFscGhhYmV0LmNoYXJhY3RlcnMoKTtcbiAgICB2YXIgbGVuID0gaWQubGVuZ3RoO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47aSsrKSB7XG4gICAgICAgIGlmIChjaGFyYWN0ZXJzLmluZGV4T2YoaWRbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU2hvcnRJZDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyeXB0byA9IHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmICh3aW5kb3cuY3J5cHRvIHx8IHdpbmRvdy5tc0NyeXB0byk7IC8vIElFIDExIHVzZXMgd2luZG93Lm1zQ3J5cHRvXG5cbmZ1bmN0aW9uIHJhbmRvbUJ5dGUoKSB7XG4gICAgaWYgKCFjcnlwdG8gfHwgIWNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI1NikgJiAweDMwO1xuICAgIH1cbiAgICB2YXIgZGVzdCA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoZGVzdCk7XG4gICAgcmV0dXJuIGRlc3RbMF0gJiAweDMwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJhbmRvbUJ5dGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEZvdW5kIHRoaXMgc2VlZC1iYXNlZCByYW5kb20gZ2VuZXJhdG9yIHNvbWV3aGVyZVxuLy8gQmFzZWQgb24gVGhlIENlbnRyYWwgUmFuZG9taXplciAxLjMgKEMpIDE5OTcgYnkgUGF1bCBIb3VsZSAoaG91bGVAbXNjLmNvcm5lbGwuZWR1KVxuXG52YXIgc2VlZCA9IDE7XG5cbi8qKlxuICogcmV0dXJuIGEgcmFuZG9tIG51bWJlciBiYXNlZCBvbiBhIHNlZWRcbiAqIEBwYXJhbSBzZWVkXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBnZXROZXh0VmFsdWUoKSB7XG4gICAgc2VlZCA9IChzZWVkICogOTMwMSArIDQ5Mjk3KSAlIDIzMzI4MDtcbiAgICByZXR1cm4gc2VlZC8oMjMzMjgwLjApO1xufVxuXG5mdW5jdGlvbiBzZXRTZWVkKF9zZWVkXykge1xuICAgIHNlZWQgPSBfc2VlZF87XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5leHRWYWx1ZTogZ2V0TmV4dFZhbHVlLFxuICAgIHNlZWQ6IHNldFNlZWRcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gMDtcbiIsIi8qISB0ZXRoZXIgMS40LjAgKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcbiAgfSBlbHNlIHtcbiAgICByb290LlRldGhlciA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIFRldGhlckJhc2UgPSB1bmRlZmluZWQ7XG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIFRldGhlckJhc2UgPSB7IG1vZHVsZXM6IFtdIH07XG59XG5cbnZhciB6ZXJvRWxlbWVudCA9IG51bGw7XG5cbi8vIFNhbWUgYXMgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCwgZXhjZXB0IGl0IHRha2VzIGludG8gYWNjb3VudCBwYXJlbnQgPGZyYW1lPiBvZmZzZXRzXG4vLyBpZiB0aGUgZWxlbWVudCBsaWVzIHdpdGhpbiBhIG5lc3RlZCBkb2N1bWVudCAoPGZyYW1lPiBvciA8aWZyYW1lPi1saWtlKS5cbmZ1bmN0aW9uIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKSB7XG4gIHZhciBib3VuZGluZ1JlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcbiAgLy8gV2UgY2FuJ3QgdXNlIGV4dGVuZCBiZWNhdXNlIHRoZSBwcm9wZXJ0aWVzIGFyZSBub3QgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBvYmplY3QgYnkgaGFzT3duUHJvcGVydHkgaW4gSUU5XG4gIHZhciByZWN0ID0ge307XG4gIGZvciAodmFyIGsgaW4gYm91bmRpbmdSZWN0KSB7XG4gICAgcmVjdFtrXSA9IGJvdW5kaW5nUmVjdFtrXTtcbiAgfVxuXG4gIGlmIChub2RlLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgdmFyIF9mcmFtZUVsZW1lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZnJhbWVFbGVtZW50O1xuICAgIGlmIChfZnJhbWVFbGVtZW50KSB7XG4gICAgICB2YXIgZnJhbWVSZWN0ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KF9mcmFtZUVsZW1lbnQpO1xuICAgICAgcmVjdC50b3AgKz0gZnJhbWVSZWN0LnRvcDtcbiAgICAgIHJlY3QuYm90dG9tICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmxlZnQgKz0gZnJhbWVSZWN0LmxlZnQ7XG4gICAgICByZWN0LnJpZ2h0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWN0O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxQYXJlbnRzKGVsKSB7XG4gIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG4gIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTU0ODM5N1xuICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWwpIHx8IHt9O1xuICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuICB2YXIgcGFyZW50cyA9IFtdO1xuXG4gIGlmIChwb3NpdGlvbiA9PT0gJ2ZpeGVkJykge1xuICAgIHJldHVybiBbZWxdO1xuICB9XG5cbiAgdmFyIHBhcmVudCA9IGVsO1xuICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSAmJiBwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUocGFyZW50KTtcbiAgICB9IGNhdGNoIChlcnIpIHt9XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAndW5kZWZpbmVkJyB8fCBzdHlsZSA9PT0gbnVsbCkge1xuICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICByZXR1cm4gcGFyZW50cztcbiAgICB9XG5cbiAgICB2YXIgX3N0eWxlID0gc3R5bGU7XG4gICAgdmFyIG92ZXJmbG93ID0gX3N0eWxlLm92ZXJmbG93O1xuICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuICAgIHZhciBvdmVyZmxvd1kgPSBfc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgaWYgKC8oYXV0b3xzY3JvbGwpLy50ZXN0KG92ZXJmbG93ICsgb3ZlcmZsb3dZICsgb3ZlcmZsb3dYKSkge1xuICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG4gICAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmJvZHkpO1xuXG4gIC8vIElmIHRoZSBub2RlIGlzIHdpdGhpbiBhIGZyYW1lLCBhY2NvdW50IGZvciB0aGUgcGFyZW50IHdpbmRvdyBzY3JvbGxcbiAgaWYgKGVsLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgcGFyZW50cy5wdXNoKGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudHM7XG59XG5cbnZhciB1bmlxdWVJZCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBpZCA9IDA7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICsraWQ7XG4gIH07XG59KSgpO1xuXG52YXIgemVyb1Bvc0NhY2hlID0ge307XG52YXIgZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luKCkge1xuICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG4gIC8vIGppdHRlciBhcyB0aGUgdXNlciBzY3JvbGxzIHRoYXQgbWVzc2VzIHdpdGggb3VyIGFiaWxpdHkgdG8gZGV0ZWN0IGlmIHR3byBwb3NpdGlvbnNcbiAgLy8gYXJlIGVxdWl2aWxhbnQgb3Igbm90LiAgV2UgcGxhY2UgYW4gZWxlbWVudCBhdCB0aGUgdG9wIGxlZnQgb2YgdGhlIHBhZ2UgdGhhdCB3aWxsXG4gIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG4gIHZhciBub2RlID0gemVyb0VsZW1lbnQ7XG4gIGlmICghbm9kZSB8fCAhZG9jdW1lbnQuYm9keS5jb250YWlucyhub2RlKSkge1xuICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcbiAgICBleHRlbmQobm9kZS5zdHlsZSwge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xuXG4gICAgemVyb0VsZW1lbnQgPSBub2RlO1xuICB9XG5cbiAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG4gIGlmICh0eXBlb2YgemVyb1Bvc0NhY2hlW2lkXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB6ZXJvUG9zQ2FjaGVbaWRdID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KG5vZGUpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNhY2hlIHdoZW4gdGhpcyBwb3NpdGlvbiBjYWxsIGlzIGRvbmVcbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xufTtcblxuZnVuY3Rpb24gcmVtb3ZlVXRpbEVsZW1lbnRzKCkge1xuICBpZiAoemVyb0VsZW1lbnQpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHplcm9FbGVtZW50KTtcbiAgfVxuICB6ZXJvRWxlbWVudCA9IG51bGw7XG59O1xuXG5mdW5jdGlvbiBnZXRCb3VuZHMoZWwpIHtcbiAgdmFyIGRvYyA9IHVuZGVmaW5lZDtcbiAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuICAgIGRvYyA9IGRvY3VtZW50O1xuICAgIGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIGRvYyA9IGVsLm93bmVyRG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gIHZhciBib3ggPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QoZWwpO1xuXG4gIHZhciBvcmlnaW4gPSBnZXRPcmlnaW4oKTtcblxuICBib3gudG9wIC09IG9yaWdpbi50b3A7XG4gIGJveC5sZWZ0IC09IG9yaWdpbi5sZWZ0O1xuXG4gIGlmICh0eXBlb2YgYm94LndpZHRoID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcbiAgfVxuICBpZiAodHlwZW9mIGJveC5oZWlnaHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG4gIH1cblxuICBib3gudG9wID0gYm94LnRvcCAtIGRvY0VsLmNsaWVudFRvcDtcbiAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG4gIGJveC5yaWdodCA9IGRvYy5ib2R5LmNsaWVudFdpZHRoIC0gYm94LndpZHRoIC0gYm94LmxlZnQ7XG4gIGJveC5ib3R0b20gPSBkb2MuYm9keS5jbGllbnRIZWlnaHQgLSBib3guaGVpZ2h0IC0gYm94LnRvcDtcblxuICByZXR1cm4gYm94O1xufVxuXG5mdW5jdGlvbiBnZXRPZmZzZXRQYXJlbnQoZWwpIHtcbiAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbnZhciBfc2Nyb2xsQmFyU2l6ZSA9IG51bGw7XG5mdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuICBpZiAoX3Njcm9sbEJhclNpemUpIHtcbiAgICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG4gIH1cbiAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpbm5lci5zdHlsZS5oZWlnaHQgPSAnMjAwcHgnO1xuXG4gIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgd2lkdGg6ICcyMDBweCcsXG4gICAgaGVpZ2h0OiAnMTUwcHgnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICB9KTtcblxuICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG4gIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG4gIHZhciB3aWR0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcbiAgICB3aWR0aFNjcm9sbCA9IG91dGVyLmNsaWVudFdpZHRoO1xuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoID0gd2lkdGhDb250YWluZWQgLSB3aWR0aFNjcm9sbDtcblxuICBfc2Nyb2xsQmFyU2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG4gIHJldHVybiBfc2Nyb2xsQmFyU2l6ZTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cbiAgdmFyIGFyZ3MgPSBbXTtcblxuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuXG4gIGFyZ3Muc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaikge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCkucmVwbGFjZShyZWdleCwgJyAnKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgaWYgKGNscy50cmltKCkpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgICB2YXIgY2xzID0gZ2V0Q2xhc3NOYW1lKGVsKSArICgnICcgKyBuYW1lKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcbiAgfVxuICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKTtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUgKyAnKCB8JCknLCAnZ2knKS50ZXN0KGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzTmFtZShlbCkge1xuICAvLyBDYW4ndCB1c2UganVzdCBTVkdBbmltYXRlZFN0cmluZyBoZXJlIHNpbmNlIG5vZGVzIHdpdGhpbiBhIEZyYW1lIGluIElFIGhhdmVcbiAgLy8gY29tcGxldGVseSBzZXBhcmF0ZWx5IFNWR0FuaW1hdGVkU3RyaW5nIGJhc2UgY2xhc3Nlc1xuICBpZiAoZWwuY2xhc3NOYW1lIGluc3RhbmNlb2YgZWwub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5TVkdBbmltYXRlZFN0cmluZykge1xuICAgIHJldHVybiBlbC5jbGFzc05hbWUuYmFzZVZhbDtcbiAgfVxuICByZXR1cm4gZWwuY2xhc3NOYW1lO1xufVxuXG5mdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcbiAgLy8gT2YgdGhlIHNldCBvZiAnYWxsJyBjbGFzc2VzLCB3ZSBuZWVkIHRoZSAnYWRkJyBjbGFzc2VzLCBhbmQgb25seSB0aGVcbiAgLy8gJ2FkZCcgY2xhc3NlcyB0byBiZSBzZXQuXG4gIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoYWRkLmluZGV4T2YoY2xzKSA9PT0gLTEgJiYgaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIHJlbW92ZUNsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG5cbiAgYWRkLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIGFkZENsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBkZWZlcnJlZCA9IFtdO1xuXG52YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuICBkZWZlcnJlZC5wdXNoKGZuKTtcbn07XG5cbnZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuICB2YXIgZm4gPSB1bmRlZmluZWQ7XG4gIHdoaWxlIChmbiA9IGRlZmVycmVkLnBvcCgpKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxudmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudGVkKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudGVkKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhFdmVudGVkLCBbe1xuICAgIGtleTogJ29uJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgdmFyIG9uY2UgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1szXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0ucHVzaCh7IGhhbmRsZXI6IGhhbmRsZXIsIGN0eDogY3R4LCBvbmNlOiBvbmNlIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29uY2UnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHRoaXMub24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb2ZmJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb2ZmKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmJpbmRpbmdzW2V2ZW50XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1tldmVudF1baV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICArK2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndHJpZ2dlcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5iaW5kaW5nc1tldmVudF0pIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgX2JpbmRpbmdzJGV2ZW50JGkgPSB0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXTtcbiAgICAgICAgICB2YXIgaGFuZGxlciA9IF9iaW5kaW5ncyRldmVudCRpLmhhbmRsZXI7XG4gICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcbiAgICAgICAgICB2YXIgb25jZSA9IF9iaW5kaW5ncyRldmVudCRpLm9uY2U7XG5cbiAgICAgICAgICB2YXIgY29udGV4dCA9IGN0eDtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG4gICAgICAgICAgaWYgKG9uY2UpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBFdmVudGVkO1xufSkoKTtcblxuVGV0aGVyQmFzZS5VdGlscyA9IHtcbiAgZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0OiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QsXG4gIGdldFNjcm9sbFBhcmVudHM6IGdldFNjcm9sbFBhcmVudHMsXG4gIGdldEJvdW5kczogZ2V0Qm91bmRzLFxuICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIHVwZGF0ZUNsYXNzZXM6IHVwZGF0ZUNsYXNzZXMsXG4gIGRlZmVyOiBkZWZlcixcbiAgZmx1c2g6IGZsdXNoLFxuICB1bmlxdWVJZDogdW5pcXVlSWQsXG4gIEV2ZW50ZWQ6IEV2ZW50ZWQsXG4gIGdldFNjcm9sbEJhclNpemU6IGdldFNjcm9sbEJhclNpemUsXG4gIHJlbW92ZVV0aWxFbGVtZW50czogcmVtb3ZlVXRpbEVsZW1lbnRzXG59O1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlLCBwZXJmb3JtYW5jZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDYsIF94NywgX3g4KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NiwgcHJvcGVydHkgPSBfeDcsIHJlY2VpdmVyID0gX3g4OyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NiA9IHBhcmVudDsgX3g3ID0gcHJvcGVydHk7IF94OCA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBkZXNjID0gcGFyZW50ID0gdW5kZWZpbmVkOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG59XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0U2Nyb2xsUGFyZW50cyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbFBhcmVudHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIGdldE9mZnNldFBhcmVudCA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldE9mZnNldFBhcmVudDtcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcbnZhciByZW1vdmVDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnJlbW92ZUNsYXNzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG52YXIgZmx1c2ggPSBfVGV0aGVyQmFzZSRVdGlscy5mbHVzaDtcbnZhciBnZXRTY3JvbGxCYXJTaXplID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsQmFyU2l6ZTtcbnZhciByZW1vdmVVdGlsRWxlbWVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVVdGlsRWxlbWVudHM7XG5cbmZ1bmN0aW9uIHdpdGhpbihhLCBiKSB7XG4gIHZhciBkaWZmID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gMSA6IGFyZ3VtZW50c1syXTtcblxuICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xufVxuXG52YXIgdHJhbnNmb3JtS2V5ID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgdmFyIHRyYW5zZm9ybXMgPSBbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nLCAnT1RyYW5zZm9ybScsICdNb3pUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFuc2Zvcm1zLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG4gICAgaWYgKGVsLnN0eWxlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gIH1cbn0pKCk7XG5cbnZhciB0ZXRoZXJzID0gW107XG5cbnZhciBwb3NpdGlvbiA9IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlcikge1xuICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG4gIH0pO1xuICBmbHVzaCgpO1xufTtcblxuZnVuY3Rpb24gbm93KCkge1xuICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfVxuICByZXR1cm4gK25ldyBEYXRlKCk7XG59XG5cbihmdW5jdGlvbiAoKSB7XG4gIHZhciBsYXN0Q2FsbCA9IG51bGw7XG4gIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuICB2YXIgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuXG4gIHZhciB0aWNrID0gZnVuY3Rpb24gdGljaygpIHtcbiAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcbiAgICAgIC8vIFdlIHZvbHVudGFyaWx5IHRocm90dGxlIG91cnNlbHZlcyBpZiB3ZSBjYW4ndCBtYW5hZ2UgNjBmcHNcbiAgICAgIGxhc3REdXJhdGlvbiA9IE1hdGgubWluKGxhc3REdXJhdGlvbiAtIDE2LCAyNTApO1xuXG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gc2V0VGltZW91dCh0aWNrLCAyNTApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbGFzdENhbGwgIT09ICd1bmRlZmluZWQnICYmIG5vdygpIC0gbGFzdENhbGwgPCAxMCkge1xuICAgICAgLy8gU29tZSBicm93c2VycyBjYWxsIGV2ZW50cyBhIGxpdHRsZSB0b28gZnJlcXVlbnRseSwgcmVmdXNlIHRvIHJ1biBtb3JlIHRoYW4gaXMgcmVhc29uYWJsZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwZW5kaW5nVGltZW91dCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuICAgICAgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuICAgIH1cblxuICAgIGxhc3RDYWxsID0gbm93KCk7XG4gICAgcG9zaXRpb24oKTtcbiAgICBsYXN0RHVyYXRpb24gPSBub3coKSAtIGxhc3RDYWxsO1xuICB9O1xuXG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgWydyZXNpemUnLCAnc2Nyb2xsJywgJ3RvdWNobW92ZSddLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdGljayk7XG4gICAgfSk7XG4gIH1cbn0pKCk7XG5cbnZhciBNSVJST1JfTFIgPSB7XG4gIGNlbnRlcjogJ2NlbnRlcicsXG4gIGxlZnQ6ICdyaWdodCcsXG4gIHJpZ2h0OiAnbGVmdCdcbn07XG5cbnZhciBNSVJST1JfVEIgPSB7XG4gIG1pZGRsZTogJ21pZGRsZScsXG4gIHRvcDogJ2JvdHRvbScsXG4gIGJvdHRvbTogJ3RvcCdcbn07XG5cbnZhciBPRkZTRVRfTUFQID0ge1xuICB0b3A6IDAsXG4gIGxlZnQ6IDAsXG4gIG1pZGRsZTogJzUwJScsXG4gIGNlbnRlcjogJzUwJScsXG4gIGJvdHRvbTogJzEwMCUnLFxuICByaWdodDogJzEwMCUnXG59O1xuXG52YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuICAgIGxlZnQgPSBNSVJST1JfTFJbcmVsYXRpdmVUb0F0dGFjaG1lbnQubGVmdF07XG4gIH1cblxuICBpZiAodG9wID09PSAnYXV0bycpIHtcbiAgICB0b3AgPSBNSVJST1JfVEJbcmVsYXRpdmVUb0F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG52YXIgYXR0YWNobWVudFRvT2Zmc2V0ID0gZnVuY3Rpb24gYXR0YWNobWVudFRvT2Zmc2V0KGF0dGFjaG1lbnQpIHtcbiAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG4gIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG5mdW5jdGlvbiBhZGRPZmZzZXQoKSB7XG4gIHZhciBvdXQgPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgb2Zmc2V0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuICAgICAgdG9wID0gcGFyc2VGbG9hdCh0b3AsIDEwKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgbGVmdCA9IHBhcnNlRmxvYXQobGVmdCwgMTApO1xuICAgIH1cblxuICAgIG91dC50b3AgKz0gdG9wO1xuICAgIG91dC5sZWZ0ICs9IGxlZnQ7XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG9mZnNldFRvUHgob2Zmc2V0LCBzaXplKSB7XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQubGVmdCA9IHBhcnNlRmxvYXQob2Zmc2V0LmxlZnQsIDEwKSAvIDEwMCAqIHNpemUud2lkdGg7XG4gIH1cbiAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQudG9wID0gcGFyc2VGbG9hdChvZmZzZXQudG9wLCAxMCkgLyAxMDAgKiBzaXplLmhlaWdodDtcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQ7XG59XG5cbnZhciBwYXJzZU9mZnNldCA9IGZ1bmN0aW9uIHBhcnNlT2Zmc2V0KHZhbHVlKSB7XG4gIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG4gIHZhciBfdmFsdWUkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX3ZhbHVlJHNwbGl0LCAyKTtcblxuICB2YXIgdG9wID0gX3ZhbHVlJHNwbGl0MlswXTtcbiAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG4gIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG59O1xudmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG52YXIgVGV0aGVyQ2xhc3MgPSAoZnVuY3Rpb24gKF9FdmVudGVkKSB7XG4gIF9pbmhlcml0cyhUZXRoZXJDbGFzcywgX0V2ZW50ZWQpO1xuXG4gIGZ1bmN0aW9uIFRldGhlckNsYXNzKG9wdGlvbnMpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRldGhlckNsYXNzLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuICAgIHRldGhlcnMucHVzaCh0aGlzKTtcblxuICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuXG4gICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuICAgIFRldGhlckJhc2UubW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChtb2R1bGUpIHtcbiAgICAgIGlmICh0eXBlb2YgbW9kdWxlLmluaXRpYWxpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wb3NpdGlvbigpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFRldGhlckNsYXNzLCBbe1xuICAgIGtleTogJ2dldENsYXNzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q2xhc3MoKSB7XG4gICAgICB2YXIga2V5ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG4gICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG4gICAgICBpZiAodHlwZW9mIGNsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIGNsYXNzZXNba2V5XSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzZXNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXggKyAnLScgKyBrZXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3NldE9wdGlvbnMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRPZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnYXV0byBhdXRvJyxcbiAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG4gICAgICB9O1xuXG4gICAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICB2YXIgZWxlbWVudCA9IF9vcHRpb25zLmVsZW1lbnQ7XG4gICAgICB2YXIgdGFyZ2V0ID0gX29wdGlvbnMudGFyZ2V0O1xuICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSAndmlld3BvcnQnKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXQgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG4gICAgICB9XG5cbiAgICAgIFsnZWxlbWVudCcsICd0YXJnZXQnXS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogQm90aCBlbGVtZW50IGFuZCB0YXJnZXQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IF90aGlzMltrZXldWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygndGFyZ2V0JykpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRhY2htZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBZb3UgbXVzdCBwcm92aWRlIGFuIGF0dGFjaG1lbnQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50YXJnZXRBdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy50YXJnZXRBdHRhY2htZW50KTtcbiAgICAgIHRoaXMuYXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMuYXR0YWNobWVudCk7XG4gICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuICAgICAgdGhpcy50YXJnZXRPZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMudGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cyA9IFt0aGlzLnRhcmdldF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBnZXRTY3JvbGxQYXJlbnRzKHRoaXMudGFyZ2V0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlKSkge1xuICAgICAgICB0aGlzLmVuYWJsZShwb3MpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFRhcmdldEJvdW5kcygpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdG9wOiBwYWdlWU9mZnNldCwgbGVmdDogcGFnZVhPZmZzZXQsIGhlaWdodDogaW5uZXJIZWlnaHQsIHdpZHRoOiBpbm5lcldpZHRoIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXG4gICAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBib3VuZHMud2lkdGgsXG4gICAgICAgICAgICAgIHRvcDogYm91bmRzLnRvcCxcbiAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0IC0gYm91bmRzLnRvcCkpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihpbm5lckhlaWdodCwgb3V0LmhlaWdodCk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0IC09IDI7XG5cbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0ICsgaW5uZXJXaWR0aCkpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKGlubmVyV2lkdGgsIG91dC53aWR0aCk7XG4gICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuICAgICAgICAgICAgaWYgKG91dC50b3AgPCBwYWdlWU9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQudG9wID0gcGFnZVlPZmZzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3V0LmxlZnQgPCBwYWdlWE9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQubGVmdCA9IHBhZ2VYT2Zmc2V0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgICB2YXIgYm91bmRzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG4gICAgICAgICAgICAgIHRvcDogcGFnZVlPZmZzZXQsXG4gICAgICAgICAgICAgIGhlaWdodDogaW5uZXJIZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XG5cbiAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgdmFyIHNjcm9sbEJvdHRvbSA9IDA7XG4gICAgICAgICAgaWYgKGhhc0JvdHRvbVNjcm9sbCkge1xuICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGhlaWdodCA9IGJvdW5kcy5oZWlnaHQgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKSAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpIC0gc2Nyb2xsQm90dG9tO1xuXG4gICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAxNSxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICogMC45NzUgKiAoaGVpZ2h0IC8gdGFyZ2V0LnNjcm9sbEhlaWdodCksXG4gICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBmaXRBZGogPSAwO1xuICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGZpdEFkaiA9IC0wLjAwMDExICogTWF0aC5wb3coaGVpZ2h0LCAyKSAtIDAuMDA3MjcgKiBoZWlnaHQgKyAyMi41ODtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG4gICAgICAgICAgb3V0LnRvcCA9IHNjcm9sbFBlcmNlbnRhZ2UgKiAoaGVpZ2h0IC0gb3V0LmhlaWdodCAtIGZpdEFkaikgKyBib3VuZHMudG9wICsgcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCk7XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnY2xlYXJDYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NhY2hlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG4gICAgICAvLyBNb3JlIHRoYW4gb25lIG1vZHVsZSB3aWxsIG9mdGVuIG5lZWQgdGhlIHNhbWUgRE9NIGluZm8sIHNvXG4gICAgICAvLyB3ZSBrZWVwIGEgY2FjaGUgd2hpY2ggaXMgY2xlYXJlZCBvbiBlYWNoIHBvc2l0aW9uIGNhbGxcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlW2tdID0gZ2V0dGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdlbmFibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbmFibGUoKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB9XG4gICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgIGlmIChwYXJlbnQgIT09IF90aGlzMy50YXJnZXQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIHBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdGhpczMucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHBvcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGlzYWJsZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICByZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXM0LnBvc2l0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGVzdHJveScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cbiAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG4gICAgICAgIGlmICh0ZXRoZXIgPT09IF90aGlzNSkge1xuICAgICAgICAgIHRldGhlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVtb3ZlIGFueSBlbGVtZW50cyB3ZSB3ZXJlIHVzaW5nIGZvciBjb252ZW5pZW5jZSBmcm9tIHRoZSBET01cbiAgICAgIGlmICh0ZXRoZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZW1vdmVVdGlsRWxlbWVudHMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVBdHRhY2hDbGFzc2VzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlQXR0YWNoQ2xhc3NlcyhlbGVtZW50QXR0YWNoLCB0YXJnZXRBdHRhY2gpIHtcbiAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICBlbGVtZW50QXR0YWNoID0gZWxlbWVudEF0dGFjaCB8fCB0aGlzLmF0dGFjaG1lbnQ7XG4gICAgICB0YXJnZXRBdHRhY2ggPSB0YXJnZXRBdHRhY2ggfHwgdGhpcy50YXJnZXRBdHRhY2htZW50O1xuICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIHVwZGF0ZUF0dGFjaENsYXNzZXMgY2FuIGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBpbiBhIHBvc2l0aW9uIGNhbGwsIHNvXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcbiAgICAgICAgLy8gcmFuIGl0IGRvZXNuJ3QgYWRkIGFueSBleHRyYSBjbGFzc2VzIGZyb20gcHJldmlvdXMgY2FsbHMuXG4gICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMuc3BsaWNlKDAsIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYWRkID0gdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcztcblxuICAgICAgaWYgKGVsZW1lbnRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhbGwgPSBbXTtcbiAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCEodHlwZW9mIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYuZWxlbWVudCwgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuICAgICAgICBpZiAoIShfdGhpczYub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNi50YXJnZXQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdwb3NpdGlvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgIHZhciBmbHVzaENoYW5nZXMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAvLyBmbHVzaENoYW5nZXMgY29tbWl0cyB0aGUgY2hhbmdlcyBpbW1lZGlhdGVseSwgbGVhdmUgdHJ1ZSB1bmxlc3MgeW91IGFyZSBwb3NpdGlvbmluZyBtdWx0aXBsZVxuICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG4gICAgICAvLyBUdXJuICdhdXRvJyBhdHRhY2htZW50cyBpbnRvIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIgb3IgZWRnZVxuICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgICB0aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXModGhpcy5hdHRhY2htZW50LCB0YXJnZXRBdHRhY2htZW50KTtcblxuICAgICAgdmFyIGVsZW1lbnRQb3MgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczcuZWxlbWVudCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHdpZHRoID0gZWxlbWVudFBvcy53aWR0aDtcbiAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuICAgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuICAgICAgICAvLyBnZXR0aW5nIGhpZGRlbi5cbiAgICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxhc3RTaXplID0geyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG4gICAgICB9XG5cbiAgICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXM3LmdldFRhcmdldEJvdW5kcygpO1xuICAgICAgfSk7XG4gICAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRhcmdldFBvcztcblxuICAgICAgLy8gR2V0IGFuIGFjdHVhbCBweCBvZmZzZXQgZnJvbSB0aGUgYXR0YWNobWVudFxuICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcbiAgICAgIHZhciB0YXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0YXJnZXRBdHRhY2htZW50KSwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIHZhciBtYW51YWxPZmZzZXQgPSBvZmZzZXRUb1B4KHRoaXMub2Zmc2V0LCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIC8vIEFkZCB0aGUgbWFudWFsbHkgcHJvdmlkZWQgb2Zmc2V0XG4gICAgICBvZmZzZXQgPSBhZGRPZmZzZXQob2Zmc2V0LCBtYW51YWxPZmZzZXQpO1xuICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgLy8gSXQncyBub3cgb3VyIGdvYWwgdG8gbWFrZSAoZWxlbWVudCBwb3NpdGlvbiArIG9mZnNldCkgPT0gKHRhcmdldCBwb3NpdGlvbiArIHRhcmdldCBvZmZzZXQpXG4gICAgICB2YXIgbGVmdCA9IHRhcmdldFBvcy5sZWZ0ICsgdGFyZ2V0T2Zmc2V0LmxlZnQgLSBvZmZzZXQubGVmdDtcbiAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVGV0aGVyQmFzZS5tb2R1bGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBfbW9kdWxlMiA9IFRldGhlckJhc2UubW9kdWxlc1tpXTtcbiAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRQb3M6IHRhcmdldFBvcyxcbiAgICAgICAgICBlbGVtZW50UG9zOiBlbGVtZW50UG9zLFxuICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgIHRhcmdldE9mZnNldDogdGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbE9mZnNldDogbWFudWFsT2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIHNjcm9sbGJhclNpemU6IHNjcm9sbGJhclNpemUsXG4gICAgICAgICAgYXR0YWNobWVudDogdGhpcy5hdHRhY2htZW50XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wID0gcmV0LnRvcDtcbiAgICAgICAgICBsZWZ0ID0gcmV0LmxlZnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2UgZGVzY3JpYmUgdGhlIHBvc2l0aW9uIHRocmVlIGRpZmZlcmVudCB3YXlzIHRvIGdpdmUgdGhlIG9wdGltaXplclxuICAgICAgLy8gYSBjaGFuY2UgdG8gZGVjaWRlIHRoZSBiZXN0IHBvc3NpYmxlIHdheSB0byBwb3NpdGlvbiB0aGUgZWxlbWVudFxuICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuICAgICAgdmFyIG5leHQgPSB7XG4gICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHBhZ2UgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcbiAgICAgICAgcGFnZToge1xuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIGxlZnQ6IGxlZnRcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICAgIHZpZXdwb3J0OiB7XG4gICAgICAgICAgdG9wOiB0b3AgLSBwYWdlWU9mZnNldCxcbiAgICAgICAgICBib3R0b206IHBhZ2VZT2Zmc2V0IC0gdG9wIC0gaGVpZ2h0ICsgaW5uZXJIZWlnaHQsXG4gICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgIHJpZ2h0OiBwYWdlWE9mZnNldCAtIGxlZnQgLSB3aWR0aCArIGlubmVyV2lkdGhcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRvYyA9IHRoaXMudGFyZ2V0Lm93bmVyRG9jdW1lbnQ7XG4gICAgICB2YXIgd2luID0gZG9jLmRlZmF1bHRWaWV3O1xuXG4gICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmICh3aW4uaW5uZXJIZWlnaHQgPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcbiAgICAgICAgbmV4dC52aWV3cG9ydC5ib3R0b20gLT0gc2Nyb2xsYmFyU2l6ZS5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW4uaW5uZXJXaWR0aCA+IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQucmlnaHQgLT0gc2Nyb2xsYmFyU2l6ZS53aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jLmJvZHkuc3R5bGUucG9zaXRpb24pID09PSAtMSB8fCBbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnBhcmVudEVsZW1lbnQuc3R5bGUucG9zaXRpb24pID09PSAtMSkge1xuICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG4gICAgICAgIG5leHQucGFnZS5ib3R0b20gPSBkb2MuYm9keS5zY3JvbGxIZWlnaHQgLSB0b3AgLSBoZWlnaHQ7XG4gICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gbGVmdCAtIHdpZHRoO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM3LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBvc2l0aW9uID0gX3RoaXM3LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuICAgICAgICAgIHZhciBvZmZzZXRCb3JkZXIgPSB7fTtcbiAgICAgICAgICBbJ1RvcCcsICdMZWZ0JywgJ0JvdHRvbScsICdSaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24uYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0UG9zaXRpb24udG9wIC0gb2Zmc2V0UGFyZW50U2l6ZS5oZWlnaHQgKyBvZmZzZXRCb3JkZXIuYm90dG9tO1xuXG4gICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuICAgICAgICAgICAgaWYgKG5leHQucGFnZS5sZWZ0ID49IG9mZnNldFBvc2l0aW9uLmxlZnQgKyBvZmZzZXRCb3JkZXIubGVmdCAmJiBuZXh0LnBhZ2UucmlnaHQgPj0gb2Zmc2V0UG9zaXRpb24ucmlnaHQpIHtcbiAgICAgICAgICAgICAgLy8gV2UncmUgd2l0aGluIHRoZSB2aXNpYmxlIHBhcnQgb2YgdGhlIHRhcmdldCdzIHNjcm9sbCBwYXJlbnRcbiAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxMZWZ0ID0gb2Zmc2V0UGFyZW50LnNjcm9sbExlZnQ7XG5cbiAgICAgICAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cbiAgICAgICAgICAgICAgbmV4dC5vZmZzZXQgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBuZXh0LnBhZ2UudG9wIC0gb2Zmc2V0UG9zaXRpb24udG9wICsgc2Nyb2xsVG9wIC0gb2Zmc2V0Qm9yZGVyLnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuICAgICAgLy8gbG9va2luZyBhdCB0aGUgYm9keSwgYnV0IHdlJ3JlIGdvbm5hIGdldCBkaW1pbmlzaGluZyByZXR1cm5zLlxuXG4gICAgICB0aGlzLm1vdmUobmV4dCk7XG5cbiAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG4gICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IDMpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmx1c2hDaGFuZ2VzKSB7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRIRSBJU1NVRVxuICB9LCB7XG4gICAga2V5OiAnbW92ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgaWYgKCEodHlwZW9mIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2FtZSA9IHt9O1xuXG4gICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuICAgICAgICBzYW1lW3R5cGVdID0ge307XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHBvc1t0eXBlXSkge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpc3RvcnkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IHRoaXMuaGlzdG9yeVtpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNzcyA9IHsgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgYm90dG9tOiAnJyB9O1xuXG4gICAgICB2YXIgdHJhbnNjcmliZSA9IGZ1bmN0aW9uIHRyYW5zY3JpYmUoX3NhbWUsIF9wb3MpIHtcbiAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBncHUgPSBoYXNPcHRpbWl6YXRpb25zID8gX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucy5ncHUgOiBudWxsO1xuICAgICAgICBpZiAoZ3B1ICE9PSBmYWxzZSkge1xuICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB4UG9zID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcbiAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuICAgICAgICAgICAgeVBvcyA9IF9wb3MudG9wO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSAtX3Bvcy5ib3R0b207XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcbiAgICAgICAgICAgIGNzcy5sZWZ0ID0gMDtcbiAgICAgICAgICAgIHhQb3MgPSBfcG9zLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gLV9wb3MucmlnaHQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgICAgICAgICAvLyBIdWJTcG90L3RldGhlciMyMDdcbiAgICAgICAgICAgIHZhciByZXRpbmEgPSB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMS4zZHBweCknKS5tYXRjaGVzIHx8IHdpbmRvdy5tYXRjaE1lZGlhKCdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMS4zKScpLm1hdGNoZXM7XG4gICAgICAgICAgICBpZiAoIXJldGluYSkge1xuICAgICAgICAgICAgICB4UG9zID0gTWF0aC5yb3VuZCh4UG9zKTtcbiAgICAgICAgICAgICAgeVBvcyA9IE1hdGgucm91bmQoeVBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gPSAndHJhbnNsYXRlWCgnICsgeFBvcyArICdweCkgdHJhbnNsYXRlWSgnICsgeVBvcyArICdweCknO1xuXG4gICAgICAgICAgaWYgKHRyYW5zZm9ybUtleSAhPT0gJ21zVHJhbnNmb3JtJykge1xuICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG4gICAgICAgICAgICAvLyBidXQgSUU5IGRvZXNuJ3Qgc3VwcG9ydCAzZCB0cmFuc2Zvcm1zIGFuZCB3aWxsIGNob2tlLlxuICAgICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gKz0gXCIgdHJhbnNsYXRlWigwKVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gX3Bvcy5ib3R0b20gKyAncHgnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IF9wb3MubGVmdCArICdweCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IF9wb3MucmlnaHQgKyAncHgnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIG1vdmVkID0gZmFsc2U7XG4gICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZShzYW1lLnBhZ2UsIHBvcy5wYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS52aWV3cG9ydCwgcG9zLnZpZXdwb3J0KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzOC5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM4LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIF90aGlzOC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG4gICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9KSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZSh7IHRvcDogdHJ1ZSwgbGVmdDogdHJ1ZSB9LCBwb3MucGFnZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghbW92ZWQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudCkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuICAgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQub3duZXJEb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFueSBjc3MgY2hhbmdlIHdpbGwgdHJpZ2dlciBhIHJlcGFpbnQsIHNvIGxldCdzIGF2b2lkIG9uZSBpZiBub3RoaW5nIGNoYW5nZWRcbiAgICAgIHZhciB3cml0ZUNTUyA9IHt9O1xuICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gY3NzKSB7XG4gICAgICAgIHZhciB2YWwgPSBjc3Nba2V5XTtcbiAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cbiAgICAgICAgaWYgKGVsVmFsICE9PSB2YWwpIHtcbiAgICAgICAgICB3cml0ZSA9IHRydWU7XG4gICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAod3JpdGUpIHtcbiAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGV4dGVuZChfdGhpczguZWxlbWVudC5zdHlsZSwgd3JpdGVDU1MpO1xuICAgICAgICAgIF90aGlzOC50cmlnZ2VyKCdyZXBvc2l0aW9uZWQnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFRldGhlckNsYXNzO1xufSkoRXZlbnRlZCk7XG5cblRldGhlckNsYXNzLm1vZHVsZXMgPSBbXTtcblxuVGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG52YXIgVGV0aGVyID0gZXh0ZW5kKFRldGhlckNsYXNzLCBUZXRoZXJCYXNlKTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxudmFyIEJPVU5EU19GT1JNQVQgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXG5mdW5jdGlvbiBnZXRCb3VuZGluZ1JlY3QodGV0aGVyLCB0bykge1xuICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG4gICAgdG8gPSB0ZXRoZXIuc2Nyb2xsUGFyZW50c1swXTtcbiAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcbiAgICB0byA9IFtwYWdlWE9mZnNldCwgcGFnZVlPZmZzZXQsIGlubmVyV2lkdGggKyBwYWdlWE9mZnNldCwgaW5uZXJIZWlnaHQgKyBwYWdlWU9mZnNldF07XG4gIH1cblxuICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG4gICAgdG8gPSB0by5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cblxuICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbm9kZSA9IHRvO1xuICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuICAgICAgdmFyIHBvcyA9IHNpemU7XG4gICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRvKTtcblxuICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuICAgICAgLy8gQWNjb3VudCBhbnkgcGFyZW50IEZyYW1lcyBzY3JvbGwgb2Zmc2V0XG4gICAgICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICB2YXIgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgICB0b1swXSArPSB3aW4ucGFnZVhPZmZzZXQ7XG4gICAgICAgIHRvWzFdICs9IHdpbi5wYWdlWU9mZnNldDtcbiAgICAgICAgdG9bMl0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1szXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICB9XG5cbiAgICAgIEJPVU5EU19GT1JNQVQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSwgaSkge1xuICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG4gICAgICAgIGlmIChzaWRlID09PSAnVG9wJyB8fCBzaWRlID09PSAnTGVmdCcpIHtcbiAgICAgICAgICB0b1tpXSArPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b1tpXSAtPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgfVxuXG4gIHJldHVybiB0bztcbn1cblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG4gICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBfcmVmLnRhcmdldEF0dGFjaG1lbnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25zdHJhaW50cykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuICAgICAgLy8gdGhlIGNsYXNzZXMgaW4gYW5kIG91dFxuICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgIH1cblxuICAgIHZhciB0YXJnZXRTaXplID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICB9KTtcblxuICAgIHZhciB0YXJnZXRIZWlnaHQgPSB0YXJnZXRTaXplLmhlaWdodDtcbiAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbdGhpcy5nZXRDbGFzcygncGlubmVkJyksIHRoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKV07XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICB2YXIgcGlubmVkQ2xhc3MgPSBjb25zdHJhaW50LnBpbm5lZENsYXNzO1xuXG4gICAgICBpZiAob3V0T2ZCb3VuZHNDbGFzcykge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKGNscyArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcbiAgICB2YXIgZUF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRoaXMuYXR0YWNobWVudCk7XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcbiAgICAgIHZhciBhdHRhY2htZW50ID0gY29uc3RyYWludC5hdHRhY2htZW50O1xuICAgICAgdmFyIHBpbiA9IGNvbnN0cmFpbnQucGluO1xuXG4gICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGF0dGFjaG1lbnQgPSAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG4gICAgICAgICAgY2hhbmdlQXR0YWNoWSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChhdHRhY2htZW50LmluZGV4T2YoJyAnKSA+PSAwKSB7XG4gICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX2F0dGFjaG1lbnQkc3BsaXQsIDIpO1xuXG4gICAgICAgIGNoYW5nZUF0dGFjaFkgPSBfYXR0YWNobWVudCRzcGxpdDJbMF07XG4gICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gY2hhbmdlQXR0YWNoWSA9IGF0dGFjaG1lbnQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoX3RoaXMsIHRvKTtcblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nICYmIHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnICYmIHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0b3AgLSAoaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0KSA+PSBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0gJiYgdG9wICsgKGhlaWdodCAqIDIgLSB0YXJnZXRIZWlnaHQpIDw9IGJvdW5kc1szXSkge1xuICAgICAgICAgICAgdG9wICs9IGhlaWdodCAtIHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuICAgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndG9nZXRoZXInKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHBpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGluID0gcGluLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAocGluID09PSB0cnVlKSB7XG4gICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgICB9XG5cbiAgICAgIHBpbiA9IHBpbiB8fCBbXTtcblxuICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuICAgICAgdmFyIG9vYiA9IFtdO1xuXG4gICAgICBpZiAodG9wIDwgYm91bmRzWzFdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1sxXTtcbiAgICAgICAgICBwaW5uZWQucHVzaCgndG9wJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3RvcCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG4gICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdib3R0b20nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdsZWZ0JykgPj0gMCkge1xuICAgICAgICAgIGxlZnQgPSBib3VuZHNbMF07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnbGVmdCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzJdIC0gd2lkdGg7XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLmdldENsYXNzKCdwaW5uZWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuICAgICAgICAgIHBpbm5lZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgb29iQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyk7XG4gICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyArICctJyArIHNpZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ2xlZnQnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChwaW5uZWQuaW5kZXhPZigndG9wJykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCAhPT0gdGFyZ2V0QXR0YWNobWVudC50b3AgfHwgdEF0dGFjaG1lbnQubGVmdCAhPT0gdGFyZ2V0QXR0YWNobWVudC5sZWZ0IHx8IGVBdHRhY2htZW50LnRvcCAhPT0gX3RoaXMuYXR0YWNobWVudC50b3AgfHwgZUF0dGFjaG1lbnQubGVmdCAhPT0gX3RoaXMuYXR0YWNobWVudC5sZWZ0KSB7XG4gICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcbiAgICAgICAgX3RoaXMudHJpZ2dlcigndXBkYXRlJywge1xuICAgICAgICAgIGF0dGFjaG1lbnQ6IGVBdHRhY2htZW50LFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRBdHRhY2htZW50XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gX2NhY2hlLndpZHRoO1xuXG4gICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cbiAgICB2YXIgYm90dG9tID0gdG9wICsgaGVpZ2h0O1xuICAgIHZhciByaWdodCA9IGxlZnQgKyB3aWR0aDtcblxuICAgIHZhciBhYnV0dGVkID0gW107XG4gICAgaWYgKHRvcCA8PSB0YXJnZXRQb3MuYm90dG9tICYmIGJvdHRvbSA+PSB0YXJnZXRQb3MudG9wKSB7XG4gICAgICBbJ2xlZnQnLCAncmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gbGVmdCB8fCB0YXJnZXRQb3NTaWRlID09PSByaWdodCkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG4gICAgICBbJ3RvcCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbXTtcbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcbiAgICBhbGxDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhbGxDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICB9XG5cbiAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgIGFkZENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgfSk7XG5cbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zaGlmdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdDtcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5zaGlmdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuICAgIH1cblxuICAgIHZhciBzaGlmdFRvcCA9IHVuZGVmaW5lZCxcbiAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2Ygc2hpZnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzaGlmdCA9IHNoaWZ0LnNwbGl0KCcgJyk7XG4gICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG4gICAgICB2YXIgX3NoaWZ0ID0gc2hpZnQ7XG5cbiAgICAgIHZhciBfc2hpZnQyID0gX3NsaWNlZFRvQXJyYXkoX3NoaWZ0LCAyKTtcblxuICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuICAgICAgc2hpZnRMZWZ0ID0gX3NoaWZ0MlsxXTtcblxuICAgICAgc2hpZnRUb3AgPSBwYXJzZUZsb2F0KHNoaWZ0VG9wLCAxMCk7XG4gICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGlmdFRvcCA9IHNoaWZ0LnRvcDtcbiAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG4gICAgfVxuXG4gICAgdG9wICs9IHNoaWZ0VG9wO1xuICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG4gICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgfVxufSk7XG5yZXR1cm4gVGV0aGVyO1xuXG59KSk7XG4iLCJpbXBvcnQgeyBEZWZhdWx0R3JpZE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsJztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRSb3cgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93JztcclxuaW1wb3J0IHsgRmxleEdyaWRDZWxsIH0gZnJvbSAnLi4vbW9kZWwvZmxleC9GbGV4R3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9tb2RlbC9HcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEV4YW1wbGVHcmlkQnVpbGRlclxyXG57XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxpbmVzOm51bWJlciA9IDEwMCwgcHJpdmF0ZSBjb2xzOm51bWJlciA9IDUyKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBidWlsZCgpOkdyaWRNb2RlbFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcblxyXG4gICAgICAgIHRoaXMuY3JlYXRlQ29sdW1uUm93KGNlbGxzKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxpbmVzOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVJlc291cmNlUm93KGNlbGxzLCBpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgRGVmYXVsdEdyaWRNb2RlbChjZWxscywgW10sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUNvbHVtblJvdyhjZWxsczpHcmlkQ2VsbFtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY2VsbHMucHVzaChuZXcgRmxleEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgY29sUmVmOiAwLFxyXG4gICAgICAgICAgICByb3dSZWY6IDAsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnKycsXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29sczsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2VsbHMucHVzaChuZXcgRmxleEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgICAgIGNvbFJlZjogaSArIDEsXHJcbiAgICAgICAgICAgICAgICByb3dSZWY6IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ1ZlcnRpY2FsICMnICsgKGkgKyAxKSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVJlc291cmNlUm93KGNlbGxzOkdyaWRDZWxsW10sIGxpbmU6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY2VsbHMucHVzaChuZXcgRmxleEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgY29sUmVmOiAwLFxyXG4gICAgICAgICAgICByb3dSZWY6IGxpbmUgKyAxLFxyXG4gICAgICAgICAgICB2YWx1ZTogYEhvcml6b250YWwgIyR7bGluZX1gLFxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbHM7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGxzLnB1c2gobmV3IEZsZXhHcmlkQ2VsbCh7XHJcbiAgICAgICAgICAgICAgICBjb2xSZWY6IGkgKyAxLFxyXG4gICAgICAgICAgICAgICAgcm93UmVmOiBsaW5lICsgMSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAobGluZSArIGkpLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFeGFtcGxlR3JpZEJ1aWxkZXIgfSBmcm9tICcuL0V4YW1wbGVHcmlkQnVpbGRlcic7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvckV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBTY3JvbGxlckV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvU2Nyb2xsZXJFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBFZGl0aW5nRXh0ZW5zaW9uLCBHcmlkRWRpdEV2ZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQ2xpcGJvYXJkRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9DbGlwYm9hcmRFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBIaXN0b3J5RXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9IaXN0b3J5RXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgUGFuRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9QYW5FeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBDb21wdXRlRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9Db21wdXRlRXh0ZW5zaW9uJztcclxuXHJcblxyXG4vL2xldCBidWlsZGVyOmFueSA9IG5ldyBGbGV4R3JpZEJ1aWxkZXIoMSwgMSk7XHJcbi8vYnVpbGRlciA9IG5ldyBGbGV4R3JpZEJ1aWxkZXIoNTIgKiA1LCAyNTApO1xyXG5sZXQgYnVpbGRlciA9IG5ldyBFeGFtcGxlR3JpZEJ1aWxkZXIoKTtcclxuXHJcbmxldCBtb2RlbCA9IGJ1aWxkZXIuYnVpbGQoKTtcclxuXHJcbmxldCBncmlkID0gR3JpZEVsZW1lbnRcclxuICAgIC5jcmVhdGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3gnKSlcclxuICAgIC5leHRlbmQobmV3IFNjcm9sbGVyRXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBTZWxlY3RvckV4dGVuc2lvbigpKVxyXG4gICAgLmV4dGVuZChuZXcgRWRpdGluZ0V4dGVuc2lvbigpKVxyXG4gICAgLmV4dGVuZChuZXcgQ2xpcGJvYXJkRXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBIaXN0b3J5RXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBQYW5FeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IENvbXB1dGVFeHRlbnNpb24oKSlcclxuICAgIC5tZXJnZUludGVyZmFjZSgpXHJcbjtcclxuXHJcbmdyaWQubW9kZWwgPSBtb2RlbDtcclxuZ3JpZC5vbignaW5wdXQnLCAoZTpHcmlkRWRpdEV2ZW50KSA9PlxyXG57XHJcbiAgICBlLmNoYW5nZXMuZm9yRWFjaCh4ID0+XHJcbiAgICB7XHJcbiAgICAgICAgeC5jZWxsLnZhbHVlID0geC52YWx1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyaWQucmVkcmF3KCk7XHJcbn0pO1xyXG5cclxud2luZG93WydncmlkJ10gPSBncmlkO1xyXG5cclxuXHJcbi8vd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+XHJcbi8ve1xyXG4vLyAgICBpZiAoIWUuY3RybEtleSlcclxuLy8gICAgICAgIHJldHVybjtcclxuLy9cclxuLy8gICAgaWYgKGUua2V5ID09PSAnYScpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxMZWZ0IC0gMTAwO1xyXG4vLyAgICAgICAgLy90d2Vlbi5lbmFibGUoZ3JpZCwgeyBzY3JvbGxMZWZ0OiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbExlZnQgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsTGVmdCA9IHY7XHJcbi8vICAgIH1cclxuLy8gICAgaWYgKGUua2V5ID09PSAnZCcpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxMZWZ0ICsgMTAwO1xyXG4vLyAgICAgICAgLy90d2Vlbi5lbmFibGUoZ3JpZCwgeyBzY3JvbGxMZWZ0OiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbExlZnQgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsTGVmdCA9IHY7XHJcbi8vICAgIH1cclxuLy8gICAgaWYgKGUua2V5ID09PSAndycpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxUb3AgLSAxMDA7XHJcbi8vICAgICAgICAvL3R3ZWVuLmVuYWJsZShncmlkLCB7IHNjcm9sbFRvcDogdiB9LCAuNSwgKCkgPT4gZ3JpZC5zY3JvbGxUb3AgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsVG9wID0gdjtcclxuLy8gICAgfVxyXG4vLyAgICBpZiAoZS5rZXkgPT09ICdzJylcclxuLy8gICAge1xyXG4vLyAgICAgICAgbGV0IHYgPSBncmlkLnNjcm9sbFRvcCArIDEwMDtcclxuLy8gICAgICAgIC8vdHdlZW4uZW5hYmxlKGdyaWQsIHsgc2Nyb2xsVG9wOiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbFRvcCA9IHYpO1xyXG4vLyAgICAgICAgZ3JpZC5zY3JvbGxUb3AgPSB2O1xyXG4vLyAgICB9XHJcbi8vfSkiLCJpbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IENsaXBib2FyZCB9IGZyb20gJy4uL3ZlbmRvci9jbGlwYm9hcmQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IHZhcmlhYmxlLCBjb21tYW5kLCByb3V0aW5lIH0gZnJvbSAnLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uL21pc2MvRG9tJztcclxuaW1wb3J0ICogYXMgUGFwYSBmcm9tICdwYXBhcGFyc2UnO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuXHJcblxyXG4vL0kga25vdy4uLiA6KFxyXG5jb25zdCBOZXdMaW5lID0gISF3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKC8uKltXd11bSWldW05uXS4qLykgPyAnXFxyXFxuJyA6ICdcXG4nO1xyXG5cclxuZXhwb3J0IGNsYXNzIENsaXBib2FyZEV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIGNvcHlMaXN0OnN0cmluZ1tdID0gW107XHJcbiAgICBwcml2YXRlIGNvcHlSYW5nZTpHcmlkUmFuZ2UgPSBHcmlkUmFuZ2UuZW1wdHkoKTtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBjb3B5TmV0OkNvcHlOZXQ7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IoZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0tFWV9DJywgKGU6S2V5Ym9hcmRFdmVudCkgPT4gdGhpcy5jb3B5U2VsZWN0aW9uKCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLm9uV2luZG93UGFzdGUuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25OZXQoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmJlZ2luRWRpdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpjb21taXQnLCAoKSA9PiB0aGlzLnJlc2V0Q29weSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBjYXB0dXJlU2VsZWN0b3IoKTpTZWxlY3RvcldpZGdldFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ2NhcHR1cmVTZWxlY3RvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgd2lkdGg6IHRhcmdldC5jbGllbnRXaWR0aCArICdweCcsXHJcbiAgICAgICAgICAgIGhlaWdodDogdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCcsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0LnBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmNvcHlOZXQgPSBDb3B5TmV0LmNyZWF0ZShsYXllcik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb3B5U2VsZWN0aW9uKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9Db3B5KHRoaXMuc2VsZWN0aW9uKTtcclxuICAgICAgICB0aGlzLmFsaWduTmV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZXNldENvcHkoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kb0NvcHkoW10pO1xyXG4gICAgICAgIHRoaXMuYWxpZ25OZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvQ29weShjZWxsczpzdHJpbmdbXSwgZGVsaW1pdGVyOnN0cmluZyA9ICdcXHQnKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jb3B5TGlzdCA9IGNlbGxzO1xyXG4gICAgICAgIGxldCByYW5nZSA9IHRoaXMuY29weVJhbmdlID0gR3JpZFJhbmdlLmNyZWF0ZSh0aGlzLmdyaWQubW9kZWwsIGNlbGxzKTtcclxuICAgICAgICBsZXQgdGV4dCA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGxzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgcnIgPSByYW5nZS5sdHJbMF0ucm93UmVmO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2UubHRyLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGMgPSByYW5nZS5sdHJbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAocnIgIT09IGMucm93UmVmKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IE5ld0xpbmU7XHJcbiAgICAgICAgICAgICAgICByciA9IGMucm93UmVmO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IGMudmFsdWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IChyYW5nZS5sdHIubGVuZ3RoIC0gMSkgJiYgcmFuZ2UubHRyW2kgKyAxXS5yb3dSZWYgPT09IHJyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGRlbGltaXRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgQ2xpcGJvYXJkLmNvcHkodGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb1Bhc3RlKHRleHQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IGZvY3VzZWRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChzZWxlY3Rpb25bMF0pO1xyXG5cclxuICAgICAgICBsZXQgcGFyc2VkID0gUGFwYS5wYXJzZSh0ZXh0LCB7XHJcbiAgICAgICAgICAgIGRlbGltaXRlcjogdGV4dC5pbmRleE9mKCdcXHQnKSA+PSAwID8gJ1xcdCcgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gcGFyc2VkLmRhdGEuZmlsdGVyKHggPT4geC5sZW5ndGggPiAxIHx8ICh4Lmxlbmd0aCA9PSAxICYmICEheFswXSkpO1xyXG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy5tYXgoZGF0YSwgeCA9PiB4Lmxlbmd0aCkubGVuZ3RoO1xyXG4gICAgICAgIGxldCBoZWlnaHQgPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICBsZXQgc3RhcnRWZWN0b3IgPSBuZXcgUG9pbnQoZm9jdXNlZENlbGwuY29sUmVmLCBmb2N1c2VkQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgIGxldCBlbmRWZWN0b3IgPSBzdGFydFZlY3Rvci5hZGQobmV3IFBvaW50KHdpZHRoLCBoZWlnaHQpKTtcclxuXHJcbiAgICAgICAgbGV0IHBhc3RlUmFuZ2UgPSBHcmlkUmFuZ2Uuc2VsZWN0KGdyaWQubW9kZWwsIHN0YXJ0VmVjdG9yLCBlbmRWZWN0b3IpO1xyXG5cclxuICAgICAgICBsZXQgY2hhbmdlcyA9IHt9IGFzIGFueTtcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHBhc3RlUmFuZ2UubHRyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHh5ID0gbmV3IFBvaW50KGNlbGwuY29sUmVmLCBjZWxsLnJvd1JlZikuc3VidHJhY3Qoc3RhcnRWZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBkYXRhW3h5LnldW3h5LnhdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgY2hhbmdlc1tjZWxsLnJlZl0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3QnLCBwYXN0ZVJhbmdlLmx0ci5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25OZXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgY29weUxpc3QsIGNvcHlOZXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChjb3B5TGlzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBuZXRSZWN0ID0gUmVjdC5mcm9tTWFueShjb3B5TGlzdC5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjb3B5TmV0LmdvdG8obmV0UmVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uV2luZG93UGFzdGUoZTpDbGlwYm9hcmRFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcbiAgICAgICAgd2hpbGUgKCEhYWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoISFhZS5jbGFzc05hbWUgJiYgYWUuY2xhc3NOYW1lLmluZGV4T2YoJ2dyaWQnKSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBhZSA9IGFlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWFlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB0ZXh0ID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQvcGxhaW4nKTtcclxuICAgICAgICBpZiAodGV4dCAhPT0gbnVsbCAmJiB0ZXh0ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRvUGFzdGUodGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29weU5ldCBleHRlbmRzIEFic1dpZGdldEJhc2U8SFRNTERpdkVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6Q29weU5ldFxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1uZXQgZ3JpZC1uZXQtY29weSc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgQ29weU5ldChyb290KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IGV4dGVuZCB9IGZyb20gJy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5cclxuXHJcbmNvbnN0IFJlZkV4dHJhY3QgPSAvKD8hLipbJ1wiYF0pW0EtWmEtel0rWzAtOV0rOj8oW0EtWmEtel0rWzAtOV0pPy9nO1xyXG5jb25zdCBSZWZDb252ZXJ0ID0gLyhbQS1aYS16XSspKFswLTldKykvZztcclxuXHJcbmNvbnN0IFN1cHBvcnRGdW5jdGlvbnMgPSB7XHJcbiAgICAvL01hdGg6XHJcbiAgICBhYnM6IE1hdGguYWJzLFxyXG4gICAgYWNvczogTWF0aC5hY29zLFxyXG4gICAgYXNpbjogTWF0aC5hc2luLFxyXG4gICAgYXRhbjogTWF0aC5hdGFuLFxyXG4gICAgYXRhbjI6IE1hdGguYXRhbjIsXHJcbiAgICBjZWlsOiBNYXRoLmNlaWwsXHJcbiAgICBjb3M6IE1hdGguY29zLFxyXG4gICAgZXhwOiBNYXRoLmV4cCxcclxuICAgIGZsb29yOiBNYXRoLmZsb29yLFxyXG4gICAgbG9nOiBNYXRoLmxvZyxcclxuICAgIG1heDogTWF0aC5tYXgsXHJcbiAgICBtaW46IE1hdGgubWluLFxyXG4gICAgcG93OiBNYXRoLnBvdyxcclxuICAgIHJhbmRvbTogTWF0aC5yYW5kb20sXHJcbiAgICByb3VuZDogTWF0aC5yb3VuZCxcclxuICAgIHNpbjogTWF0aC5zaW4sXHJcbiAgICBzcXJ0OiBNYXRoLnNxcnQsXHJcbiAgICB0YW46IE1hdGgudGFuLFxyXG4gICAgLy9DdXN0b206XHJcbiAgICBzdW06IGZ1bmN0aW9uKHZhbHVlczpudW1iZXJbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LCAwKTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wdXRlRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHRyYWNrZXI6T2JqZWN0TWFwPHN0cmluZz4gPSB7fTtcclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG5cclxuICAgICAgICBrZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2NvbW1pdCcsIHRoaXMuY29tbWl0T3ZlcnJpZGUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdiZWdpbkVkaXQnLCB0aGlzLmJlZ2luRWRpdE92ZXJyaWRlLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5FZGl0T3ZlcnJpZGUob3ZlcnJpZGU6c3RyaW5nLCBpbXBsOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IHNlbGVjdGlvbiwgdHJhY2tlciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb25bMF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW92ZXJyaWRlICYmIG92ZXJyaWRlICE9PSAnJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG92ZXJyaWRlID0gdHJhY2tlcltzZWxlY3Rpb25bMF1dIHx8IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW1wbChvdmVycmlkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb21taXRPdmVycmlkZShjaGFuZ2VzOk9iamVjdE1hcDxzdHJpbmc+LCBpbXBsOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IHRyYWNrZXIgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJlZiBpbiBjaGFuZ2VzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZhbCA9IGNoYW5nZXNbcmVmXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID4gMCAmJiB2YWxbMF0gPT09ICc9JylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlcltyZWZdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc1tyZWZdID0gdGhpcy5ldmFsdWF0ZSh2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbXBsKGNoYW5nZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZXZhbHVhdGUoZm9ybXVsYTpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBudWxsIGFzIFJlZ0V4cEV4ZWNBcnJheTtcclxuICAgICAgICB3aGlsZSAocmVzdWx0ID0gUmVmRXh0cmFjdC5leGVjKGZvcm11bGEpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBmb3JtdWxhID1cclxuICAgICAgICAgICAgICAgIGZvcm11bGEuc3Vic3RyKDAsIHJlc3VsdC5pbmRleCkgK1xyXG4gICAgICAgICAgICAgICAgYGV4cHIoJyR7cmVzdWx0WzBdfScpYCArXHJcbiAgICAgICAgICAgICAgICBmb3JtdWxhLnN1YnN0cmluZyhyZXN1bHQuaW5kZXggKyByZXN1bHRbMF0ubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmdW5jdGlvbnMgPSBleHRlbmQoe30sIFN1cHBvcnRGdW5jdGlvbnMpO1xyXG4gICAgICAgIGZ1bmN0aW9ucy5leHByID0gdGhpcy5yZXNvbHZlRXhwci5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICBsZXQgY29kZSA9IGB3aXRoIChhcmd1bWVudHNbMF0pIHsgcmV0dXJuICgke2Zvcm11bGEuc3Vic3RyKDEpfSk7IH1gLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGNvZGUpO1xyXG5cclxuICAgICAgICBsZXQgZiA9IG5ldyBGdW5jdGlvbihjb2RlKS5iaW5kKG51bGwsIGZ1bmN0aW9ucyk7XHJcbiAgICAgICAgcmV0dXJuIGYoKS50b1N0cmluZygpIHx8ICcwJztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVFeHByKGV4cHI6c3RyaW5nKTpudW1iZXJ8bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICBsZXQgW2Zyb20sIHRvXSA9IGV4cHIuc3BsaXQoJzonKTtcclxuXHJcbiAgICAgICAgbGV0IGZyb21DZWxsID0gdGhpcy5yZXNvbHZlUmVmKGZyb20pO1xyXG5cclxuICAgICAgICBpZiAodG8gPT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghIWZyb21DZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoZnJvbUNlbGwudmFsdWUpIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHRvQ2VsbCA9IHRoaXMucmVzb2x2ZVJlZih0byk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmcm9tQ2VsbCAmJiAhIXRvQ2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb21WZWN0b3IgPSBuZXcgUG9pbnQoZnJvbUNlbGwuY29sUmVmLCBmcm9tQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvVmVjdG9yID0gbmV3IFBvaW50KHRvQ2VsbC5jb2xSZWYsIHRvQ2VsbC5yb3dSZWYpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByYW5nZSA9IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLCBmcm9tVmVjdG9yLCB0b1ZlY3RvciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZ2UubHRyLm1hcCh4ID0+IHBhcnNlSW50KHgudmFsdWUpIHx8IDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVSZWYobmFtZVJlZjpzdHJpbmcpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgUmVmQ29udmVydC5sYXN0SW5kZXggPSAwO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBSZWZDb252ZXJ0LmV4ZWMobmFtZVJlZik7XHJcblxyXG4gICAgICAgIGxldCBleHByUmVmID0gcmVzdWx0WzFdO1xyXG4gICAgICAgIGxldCByb3dSZWYgPSBwYXJzZUludChyZXN1bHRbMl0pO1xyXG4gICAgICAgIGxldCBjb2xSZWYgPSAwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZXhwclJlZi5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gKGV4cHJSZWYubGVuZ3RoIC0gMSkgLSBpO1xyXG4gICAgICAgICAgICBsZXQgbiA9IGV4cHJSZWZbeF0udG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApIC0gNjQ7XHJcbiAgICAgICAgICAgIGNvbFJlZiArPSBuICogKDI2ICogaSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb2xSZWYgKz0gbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5tb2RlbC5sb2NhdGVDZWxsKGNvbFJlZiAtIDEsIHJvd1JlZiAtIDEpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgU2VsZWN0b3JXaWRnZXQgfSBmcm9tICcuL1NlbGVjdG9yRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlLCBXaWRnZXQgfSBmcm9tICcuLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbmNvbnN0IFZlY3RvcnMgPSB7XHJcbiAgICBuOiBuZXcgUG9pbnQoMCwgLTEpLFxyXG4gICAgczogbmV3IFBvaW50KDAsIDEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEVkaXRFdmVudFxyXG57XHJcbiAgICBjaGFuZ2VzOkdyaWRFZGl0SW50ZW50W107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEVkaXRJbnRlbnRcclxue1xyXG4gICAgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHZhbHVlOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJbnB1dFdpZGdldCBleHRlbmRzIFdpZGdldFxyXG57XHJcbiAgICBmb2N1cygpOnZvaWQ7XHJcbiAgICB2YWwodmFsdWU/OnN0cmluZyk6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdGluZ0V4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGlucHV0OklucHV0O1xyXG5cclxuICAgIHByaXZhdGUgaXNFZGl0aW5nOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKHRoaXMuaW5wdXQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchRVNDQVBFJywgKCkgPT4gdGhpcy5lbmRFZGl0KGZhbHNlKSlcclxuICAgICAgICAgICAgLm9uKCchRU5URVInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVRBQicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchU0hJRlQrVEFCJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ1VQX0FSUk9XJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJ0RPV05fQVJST1cnLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignUklHSFRfQVJST1cnLCAoKSA9PiB7IGlmICghdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCkgeyB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSk7IH0gfSlcclxuICAgICAgICAgICAgLm9uKCdMRUZUX0FSUk9XJywgKCkgPT4geyBpZiAoIXRoaXMuaXNFZGl0aW5nRGV0YWlsZWQpIHsgdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLncpOyB9IH0pXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcih0aGlzLmlucHV0LnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZJywgKCkgPT4gdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCA9IHRydWUpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IodGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIURFTEVURScsICgpID0+IHRoaXMuZXJhc2UoKSlcclxuICAgICAgICAgICAgLm9uKCchQkFDS1NQQUNFJywgKCkgPT4gdGhpcy5iZWdpbkVkaXQoJycpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IodGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignREJMQ0xJQ0s6UFJJTUFSWScsICgpID0+IHRoaXMuYmVnaW5FZGl0KG51bGwpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5vbigna2V5cHJlc3MnLCAoZTpHcmlkS2V5Ym9hcmRFdmVudCkgPT4gdGhpcy5iZWdpbkVkaXQoU3RyaW5nLmZyb21DaGFyQ29kZShlLmNoYXJDb2RlKSkpO1xyXG5cclxuICAgICAgICBrZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmRvU2VsZWN0JywgKCkgPT4gdGhpcy5lbmRFZGl0KHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBwcmltYXJ5U2VsZWN0b3IoKTpTZWxlY3RvcldpZGdldFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3ByaW1hcnlTZWxlY3RvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgbGF5ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuICAgICAgICBsYXllci5zdHlsZS53aWR0aCA9IHRhcmdldC5jbGllbnRXaWR0aCArICdweCc7XHJcbiAgICAgICAgbGF5ZXIuc3R5bGUuaGVpZ2h0ID0gdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCc7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0LnBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmlucHV0ID0gSW5wdXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGJlZ2luRWRpdChvdmVycmlkZTpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IHsgaW5wdXQgfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQubW9kZWwuZmluZENlbGwodGhpcy5zZWxlY3Rpb25bMF0pO1xyXG5cclxuICAgICAgICBpZiAoISFvdmVycmlkZSB8fCBvdmVycmlkZSA9PT0gJycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwob3ZlcnJpZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwoY2VsbC52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnB1dC5nb3RvKHRoaXMucHJpbWFyeVNlbGVjdG9yLnZpZXdSZWN0KTtcclxuICAgICAgICBpbnB1dC5mb2N1cygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVuZEVkaXQoY29tbWl0OmJvb2xlYW4gPSB0cnVlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgeyBncmlkLCBpbnB1dCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG4gICAgICAgIGxldCBuZXdWYWx1ZSA9IGlucHV0LnZhbCgpO1xyXG5cclxuICAgICAgICBpbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgaW5wdXQudmFsKCcnKTtcclxuICAgICAgICBncmlkLmZvY3VzKCk7XHJcblxyXG4gICAgICAgIGlmIChjb21taXQgJiYgISFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jb21taXRVbmlmb3JtKHNlbGVjdGlvbi5zbGljZSgwLCAxKSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5kRWRpdFRvTmVpZ2hib3IodmVjdG9yOlBvaW50LCBjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5lbmRFZGl0KGNvbW1pdCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ3NlbGVjdE5laWdoYm9yJywgdmVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBlcmFzZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLCAnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb21taXRVbmlmb3JtKGNlbGxzOnN0cmluZ1tdLCB1bmlmb3JtVmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBfLnppcFBhaXJzKGNlbGxzLm1hcCh4ID0+IFt4LCB1bmlmb3JtVmFsdWVdKSk7XHJcbiAgICAgICAgdGhpcy5jb21taXQoY2hhbmdlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBjb21taXQoY2hhbmdlczpPYmplY3RNYXA8c3RyaW5nPik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBldnQ6R3JpZEVkaXRFdmVudCA9IHtcclxuICAgICAgICAgICAgY2hhbmdlczogXy51bnppcFBhaXJzKGNoYW5nZXMpLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBjZWxsOiBncmlkLm1vZGVsLmZpbmRDZWxsKHhbMF0pLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHhbMV0sXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGdyaWQuZW1pdCgnaW5wdXQnLCBldnQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnB1dCBleHRlbmRzIEFic1dpZGdldEJhc2U8SFRNTElucHV0RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50KTpJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICByb290LnR5cGUgPSAndGV4dCc7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1pbnB1dCc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgcGFkZGluZzogJzAnLFxyXG4gICAgICAgICAgICBtYXJnaW46ICcwJyxcclxuICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgSW5wdXQocm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdvdG8odmlld1JlY3Q6UmVjdExpa2UsIGF1dG9TaG93OmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIuZ290byh2aWV3UmVjdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5yb290LCB7XHJcbiAgICAgICAgICAgIGxlZnQ6IGAke3ZpZXdSZWN0LmxlZnQgKyAyfXB4YCxcclxuICAgICAgICAgICAgdG9wOiBgJHt2aWV3UmVjdC50b3AgKyAyfXB4YCxcclxuICAgICAgICAgICAgd2lkdGg6IGAke3ZpZXdSZWN0LndpZHRofXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt2aWV3UmVjdC5oZWlnaHR9cHhgLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IHRoaXMucm9vdDtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByb290LmZvY3VzKCk7XHJcbiAgICAgICAgICAgIHJvb3Quc2V0U2VsZWN0aW9uUmFuZ2Uocm9vdC52YWx1ZS5sZW5ndGgsIHJvb3QudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICB9LCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmFsKHZhbHVlPzpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5yb290LnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5yb290LnZhbHVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tICcuLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnXHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBIaXN0b3J5QWN0aW9uXHJcbntcclxuICAgIGFwcGx5KCk6dm9pZDtcclxuXHJcbiAgICByb2xsYmFjaygpOnZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDZWxsRWRpdFNuYXBzaG90XHJcbntcclxuICAgIHJlZjpzdHJpbmc7XHJcbiAgICBuZXdWYWw6c3RyaW5nO1xyXG4gICAgb2xkVmFsOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEhpc3RvcnlFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIGZ1dHVyZTpIaXN0b3J5QWN0aW9uW10gPSBbXTtcclxuICAgIHByaXZhdGUgcGFzdDpIaXN0b3J5QWN0aW9uW10gPSBbXTtcclxuICAgIHByaXZhdGUgbm9DYXB0dXJlOmJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IoZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0tFWV9aJywgKCkgPT4gdGhpcy51bmRvKCkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1knLCAoKSA9PiB0aGlzLnJlZG8oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpjb21taXQnLCB0aGlzLmJlZm9yZUNvbW1pdC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHVuZG8oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnBhc3QubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMucGFzdC5wb3AoKTtcclxuICAgICAgICBhY3Rpb24ucm9sbGJhY2soKTtcclxuICAgICAgICB0aGlzLmZ1dHVyZS5wdXNoKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZWRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5mdXR1cmUubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMuZnV0dXJlLnBvcCgpO1xyXG4gICAgICAgIGFjdGlvbi5hcHBseSgpO1xyXG4gICAgICAgIHRoaXMucGFzdC5wdXNoKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXN0LnB1c2goYWN0aW9uKTtcclxuICAgICAgICB0aGlzLmZ1dHVyZSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVmb3JlQ29tbWl0KGNoYW5nZXM6T2JqZWN0TWFwPHN0cmluZz4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ub0NhcHR1cmUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHNuYXBzaG90cyA9IHRoaXMuY3JlYXRlU25hcHNob3RzKGNoYW5nZXMpO1xyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzKTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTbmFwc2hvdHMoY2hhbmdlczpPYmplY3RNYXA8c3RyaW5nPik6Q2VsbEVkaXRTbmFwc2hvdFtdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IG1vZGVsID0gdGhpcy5ncmlkLm1vZGVsO1xyXG4gICAgICAgIGxldCBiYXRjaCA9IFtdIGFzIENlbGxFZGl0U25hcHNob3RbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcmVmIGluIGNoYW5nZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiYXRjaC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHJlZjogcmVmLFxyXG4gICAgICAgICAgICAgICAgbmV3VmFsOiBjaGFuZ2VzW3JlZl0sXHJcbiAgICAgICAgICAgICAgICBvbGRWYWw6IG1vZGVsLmZpbmRDZWxsKHJlZikudmFsdWUsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGJhdGNoO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWRpdEFjdGlvbihzbmFwc2hvdHM6Q2VsbEVkaXRTbmFwc2hvdFtdKTpIaXN0b3J5QWN0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYXBwbHk6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2lsZW50Q29tbWl0KF8uemlwUGFpcnMoc25hcHNob3RzLm1hcCh4ID0+IFt4LnJlZiwgeC5uZXdWYWxdKSkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByb2xsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaWxlbnRDb21taXQoXy56aXBQYWlycyhzbmFwc2hvdHMubWFwKHggPT4gW3gucmVmLCB4Lm9sZFZhbF0pKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGludm9rZVNpbGVudENvbW1pdChjaGFuZ2VzOk9iamVjdE1hcDxzdHJpbmc+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMuZ3JpZC5rZXJuZWw7XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBrZXJuZWwuY29tbWFuZHMuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0JywgXy5rZXlzKGNoYW5nZXMpKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCB9IGZyb20gJy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gJy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCdcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi4vaW5wdXQvS2V5cyc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFBhbkV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBhbm5pbmcgPSBmYWxzZTtcclxuICAgICAgICBsZXQgbGFzdCA9IG51bGwgYXMgUG9pbnQ7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2tleWRvd24nLCAoZTpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gS2V5cy5TUEFDRSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFubmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsYXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdrZXl1cCcsIChlOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSBLZXlzLlNQQUNFKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBsYXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXBhbm5pbmcpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAobGFzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSBuZXcgUG9pbnQoZS5ncmlkWCwgZS5ncmlkWSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGVsdGEgPSBuZXh0LnN1YnRyYWN0KGxhc3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdyaWQuc2Nyb2xsTGVmdCAtPSBkZWx0YS54O1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxUb3AgLT0gZGVsdGEueTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGFzdCA9IG5ldyBQb2ludChlLmdyaWRYLCBlLmdyaWRZKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9ncmlkLmtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnYmVnaW5FZGl0JywgKG92ZXJyaWRlOnN0cmluZywgaW1wbDphbnkpID0+XHJcbiAgICAgICAgLy97XHJcbiAgICAgICAgLy8gICAgaWYgKHBhbm5pbmcpXHJcbiAgICAgICAgLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vICAgIHJldHVybiBpbXBsKG92ZXJyaWRlKTtcclxuICAgICAgICAvL30pO1xyXG5cclxuICAgICAgICAvL2dyaWQua2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdkb1NlbGVjdCcsIChjZWxsczpzdHJpbmdbXSA9IFtdLCBhdXRvU2Nyb2xsOmJvb2xlYW4sIGltcGw6YW55KSA9PlxyXG4gICAgICAgIC8ve1xyXG4gICAgICAgIC8vICAgIGlmIChwYW5uaW5nKVxyXG4gICAgICAgIC8vICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAgICByZXR1cm4gaW1wbChjZWxscywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgLy99KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vbWlzYy9Eb20nO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNjcm9sbGVyRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxlclg6SFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNjcm9sbGVyWTpIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgd2VkZ2VYOkhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSB3ZWRnZVk6SFRNTERpdkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCAoKSA9PiB0aGlzLmFsaWduRWxlbWVudHMoKSk7XHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbkVsZW1lbnRzKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gdGhpcy5sYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBsYXllci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgICAgIGxheWVyLnN0eWxlLndpZHRoID0gdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JztcclxuICAgICAgICBsYXllci5zdHlsZS5oZWlnaHQgPSB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHQucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgbGV0IHNjcm9sbGVyWCA9IHRoaXMuc2Nyb2xsZXJYID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgc2Nyb2xsZXJYLmNsYXNzTmFtZSA9ICdncmlkLXNjcm9sbGVyIGdyaWQtc2Nyb2xsZXIteCc7XHJcbiAgICAgICAgc2Nyb2xsZXJYLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxIb3Jpem9udGFsLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGxheWVyLmFwcGVuZENoaWxkKHNjcm9sbGVyWCk7XHJcblxyXG4gICAgICAgIGxldCB3ZWRnZVggPSB0aGlzLndlZGdlWCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHNjcm9sbGVyWC5hcHBlbmRDaGlsZCh3ZWRnZVgpO1xyXG5cclxuICAgICAgICBsZXQgc2Nyb2xsZXJZID0gdGhpcy5zY3JvbGxlclkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBzY3JvbGxlclkuY2xhc3NOYW1lID0gJ2dyaWQtc2Nyb2xsZXIgZ3JpZC1zY3JvbGxlci15JztcclxuICAgICAgICBzY3JvbGxlclkuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vblNjcm9sbFZlcnRpY2FsLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGxheWVyLmFwcGVuZENoaWxkKHNjcm9sbGVyWSk7XHJcblxyXG4gICAgICAgIGxldCB3ZWRnZVkgPSB0aGlzLndlZGdlWSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHNjcm9sbGVyWS5hcHBlbmRDaGlsZCh3ZWRnZVkpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMuc2Nyb2xsZXJYLCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt0aGlzLmdyaWQud2lkdGh9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6ICcxNnB4JyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIGJvdHRvbTogJzBweCcsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5zY3JvbGxlclksIHtcclxuICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICAgICAgd2lkdGg6ICcxNnB4JyxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt0aGlzLmdyaWQuaGVpZ2h0fXB4YCxcclxuICAgICAgICAgICAgcmlnaHQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25FbGVtZW50cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20uY3NzKHRoaXMuc2Nyb2xsZXJYLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt0aGlzLmdyaWQud2lkdGh9cHhgLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMud2VkZ2VYLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt0aGlzLmdyaWQudmlydHVhbFdpZHRofXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAnMXB4JyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsZXJYLnNjcm9sbExlZnQgIT0gdGhpcy5ncmlkLnNjcm9sbExlZnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVyWC5zY3JvbGxMZWZ0ID0gdGhpcy5ncmlkLnNjcm9sbExlZnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMuc2Nyb2xsZXJZLCB7XHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dGhpcy5ncmlkLmhlaWdodH1weGAsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy53ZWRnZVksIHtcclxuICAgICAgICAgICAgd2lkdGg6ICcxcHgnLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3RoaXMuZ3JpZC52aXJ0dWFsSGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsZXJZLnNjcm9sbFRvcCAhPSB0aGlzLmdyaWQuc2Nyb2xsVG9wKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxlclkuc2Nyb2xsVG9wID0gdGhpcy5ncmlkLnNjcm9sbFRvcDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvblNjcm9sbEhvcml6b250YWwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkLnNjcm9sbExlZnQgPSB0aGlzLnNjcm9sbGVyWC5zY3JvbGxMZWZ0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25TY3JvbGxWZXJ0aWNhbCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQuc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxlclkuc2Nyb2xsVG9wO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZE1vdXNlRXZlbnQsIEdyaWRNb3VzZURyYWdFdmVudCB9IGZyb20gJy4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnRTdXBwb3J0IH0gZnJvbSAnLi4vaW5wdXQvTW91c2VEcmFnRXZlbnRTdXBwb3J0JztcclxuaW1wb3J0IHsgV2lkZ2V0LCBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgY29tbWFuZCwgcm91dGluZSwgdmFyaWFibGUgfSBmcm9tICcuLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcblxyXG5cclxuY29uc3QgVmVjdG9ycyA9IHtcclxuICAgIG53OiBuZXcgUG9pbnQoLTEsIC0xKSxcclxuICAgIG46IG5ldyBQb2ludCgwLCAtMSksXHJcbiAgICBuZTogbmV3IFBvaW50KDEsIC0xKSxcclxuICAgIGU6IG5ldyBQb2ludCgxLCAwKSxcclxuICAgIHNlOiBuZXcgUG9pbnQoMSwgMSksXHJcbiAgICBzOiBuZXcgUG9pbnQoMCwgMSksXHJcbiAgICBzdzogbmV3IFBvaW50KC0xLCAxKSxcclxuICAgIHc6IG5ldyBQb2ludCgtMSwgMCksXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgU2VsZWN0R2VzdHVyZVxyXG57XHJcbiAgICBzdGFydDpzdHJpbmc7XHJcbiAgICBlbmQ6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdG9yV2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JFeHRlbnNpb25FeHBvcnRzXHJcbntcclxuICAgIGNhblNlbGVjdDpib29sZWFuO1xyXG5cclxuICAgIHJlYWRvbmx5IHNlbGVjdGlvbjpzdHJpbmdbXVxyXG5cclxuICAgIHJlYWRvbmx5IHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICByZWFkb25seSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3JXaWRnZXQ7XHJcblxyXG4gICAgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RMaW5lKGdyaWRQdDpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RvckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RHZXN0dXJlOlNlbGVjdEdlc3R1cmU7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgY2FuU2VsZWN0OmJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIEB2YXJpYWJsZShmYWxzZSlcclxuICAgIHByaXZhdGUgc2VsZWN0aW9uOnN0cmluZ1tdID0gW107XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBwcmltYXJ5U2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVNISUZUK1RBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCdSSUdIVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCdMRUZUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ1VQX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJ0RPV05fQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignQ1RSTCtSSUdIVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrTEVGVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK0RPV05fQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK0EnLCAoKSA9PiB0aGlzLnNlbGVjdEFsbCgpKVxyXG4gICAgICAgICAgICAub24oJ0hPTUUnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrSE9NRScsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMubncpKVxyXG4gICAgICAgICAgICAub24oJ0VORCcsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignQ1RSTCtFTkQnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLnNlKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydC5lbmFibGUoZ3JpZC5yb290KTtcclxuICAgICAgICBNb3VzZUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJ0RPV046U0hJRlQrUFJJTUFSWScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PiB0aGlzLnNlbGVjdExpbmUobmV3IFBvaW50KGUuZ3JpZFgsIGUuZ3JpZFkpKSlcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT4gdGhpcy5iZWdpblNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgKGU6R3JpZE1vdXNlRHJhZ0V2ZW50KSA9PiB0aGlzLnVwZGF0ZVNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5yZXNlbGVjdChmYWxzZSkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25TZWxlY3RvcnMoZmFsc2UpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB3aWR0aDogdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgaGVpZ2h0OiB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHQucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG5cclxuICAgICAgICB0aGlzLnByaW1hcnlTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5jYXB0dXJlU2VsZWN0b3IgPSBTZWxlY3Rvci5jcmVhdGUobGF5ZXIsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdChjZWxsczpzdHJpbmdbXSwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvU2VsZWN0KGNlbGxzLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICB0aGlzLmFsaWduU2VsZWN0b3JzKHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0QWxsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZ3JpZC5tb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXJ0Q2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwocmVmKTtcclxuICAgICAgICAgICAgbGV0IHh5ID0geyB4OiBzdGFydENlbGwuY29sUmVmLCB5OiBzdGFydENlbGwucm93UmVmIH0gYXMgUG9pbnRMaWtlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IGdyaWQubW9kZWxXaWR0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IGdyaWQubW9kZWxIZWlnaHQgLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVzdWx0Q2VsbCA9IGdyaWQubW9kZWwubG9jYXRlQ2VsbCh4eS54LCB4eS55KTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtyZXN1bHRDZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0RWRnZSh2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgZW1wdHkgPSAoY2VsbDpHcmlkQ2VsbCkgPT4gPGFueT4oY2VsbC52YWx1ZSA9PT0gJycgfHwgY2VsbC52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGNlbGwudmFsdWUgPT09IG51bGwpO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHN0YXJ0Q2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwocmVmKTtcclxuICAgICAgICAgICAgbGV0IGN1cnJDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKHN0YXJ0Q2VsbC5yZWYsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDZWxsID0gPEdyaWRDZWxsPm51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWN1cnJDZWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHRydWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhID0gY3VyckNlbGw7XHJcbiAgICAgICAgICAgICAgICBsZXQgYiA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihhLnJlZiwgdmVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWEgfHwgIWIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Q2VsbCA9ICEhYSA/IGEgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbXB0eShhKSArIGVtcHR5KGIpID09IDEpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Q2VsbCA9IGVtcHR5KGEpID8gYiA6IGE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY3VyckNlbGwgPSBiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW3Jlc3VsdENlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RMaW5lKGdyaWRQdDpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAoIXJlZilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHN0YXJ0UHQgPSBncmlkLmdldENlbGxHcmlkUmVjdChyZWYpLnRvcExlZnQoKTtcclxuICAgICAgICBsZXQgbGluZVJlY3QgPSBSZWN0LmZyb21Qb2ludHMoc3RhcnRQdCwgZ3JpZFB0KTtcclxuXHJcbiAgICAgICAgbGV0IGNlbGxSZWZzID0gZ3JpZC5nZXRDZWxsc0luR3JpZFJlY3QobGluZVJlY3QpLm1hcCh4ID0+IHgucmVmKTtcclxuICAgICAgICBjZWxsUmVmcy5zcGxpY2UoY2VsbFJlZnMuaW5kZXhPZihyZWYpLCAxKTtcclxuICAgICAgICBjZWxsUmVmcy5zcGxpY2UoMCwgMCwgcmVmKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGF1dG9TY3JvbGwpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0TmVpZ2hib3IodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZlY3RvciA9IHZlY3Rvci5ub3JtYWxpemUoKTtcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKHJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtjZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzZWxlY3QoYXV0b1Njcm9sbDpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlbWFpbmluZyA9IHNlbGVjdGlvbi5maWx0ZXIoeCA9PiAhIWdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG4gICAgICAgIGlmIChyZW1haW5pbmcubGVuZ3RoICE9IHNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdChyZW1haW5pbmcsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZ2luU2VsZWN0R2VzdHVyZShncmlkWDpudW1iZXIsIGdyaWRZOm51bWJlcik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChncmlkWCwgZ3JpZFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gdGhpcy5ncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcblxyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBjZWxsLnJlZixcclxuICAgICAgICAgICAgZW5kOiBjZWxsLnJlZixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChbIGNlbGwucmVmIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU2VsZWN0R2VzdHVyZShncmlkWDpudW1iZXIsIGdyaWRZOm51bWJlcik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdEdlc3R1cmUgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChncmlkWCwgZ3JpZFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGwgfHwgc2VsZWN0R2VzdHVyZS5lbmQgPT09IGNlbGwucmVmKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHNlbGVjdEdlc3R1cmUuZW5kID0gY2VsbC5yZWY7XHJcblxyXG4gICAgICAgIGxldCByZWdpb24gPSBSZWN0LmZyb21NYW55KFtcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5zdGFydCksXHJcbiAgICAgICAgICAgIGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHNlbGVjdEdlc3R1cmUuZW5kKVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICBsZXQgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChyZWdpb24pXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PngucmVmKTtcclxuXHJcbiAgICAgICAgaWYgKGNlbGxSZWZzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjZWxsUmVmcy5zcGxpY2UoY2VsbFJlZnMuaW5kZXhPZihzZWxlY3RHZXN0dXJlLnN0YXJ0KSwgMSk7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZSgwLCAwLCBzZWxlY3RHZXN0dXJlLnN0YXJ0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KGNlbGxSZWZzLCBjZWxsUmVmcy5sZW5ndGggPT0gMSk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb1NlbGVjdChjZWxsczpzdHJpbmdbXSA9IFtdLCBhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGNlbGxzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gY2VsbHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXV0b1Njcm9sbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxUbyhwcmltYXJ5UmVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnblNlbGVjdG9ycyhhbmltYXRlOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24sIHByaW1hcnlTZWxlY3RvciwgY2FwdHVyZVNlbGVjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwcmltYXJ5UmVjdCA9IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHNlbGVjdGlvblswXSk7XHJcbiAgICAgICAgICAgIHByaW1hcnlTZWxlY3Rvci5nb3RvKHByaW1hcnlSZWN0LCBhbmltYXRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogSW1wcm92ZSB0aGUgc2hpdCBvdXQgb2YgdGhpczpcclxuICAgICAgICAgICAgbGV0IGNhcHR1cmVSZWN0ID0gUmVjdC5mcm9tTWFueShzZWxlY3Rpb24ubWFwKHggPT4gZ3JpZC5nZXRDZWxsVmlld1JlY3QoeCkpKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLmdvdG8oY2FwdHVyZVJlY3QsIGFuaW1hdGUpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IudG9nZ2xlKHNlbGVjdGlvbi5sZW5ndGggPiAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmhpZGUoKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFNlbGVjdG9yIGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50LCBwcmltYXJ5OmJvb2xlYW4gPSBmYWxzZSk6U2VsZWN0b3JcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtc2VsZWN0b3IgJyArIChwcmltYXJ5ID8gJ2dyaWQtc2VsZWN0b3ItcHJpbWFyeScgOiAnJyk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0b3Iocm9vdCk7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnRMaWtlIFxyXG57XHJcbiAgICB4Om51bWJlcjtcclxuICAgIHk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBCcm93c2VyUG9pbnQgPSB7IGxlZnQ6bnVtYmVyOyB0b3A6bnVtYmVyOyB9O1xyXG5leHBvcnQgdHlwZSBQb2ludElucHV0ID0gbnVtYmVyW118UG9pbnR8UG9pbnRMaWtlfEJyb3dzZXJQb2ludDtcclxuXHJcbmV4cG9ydCBjbGFzcyBQb2ludCBpbXBsZW1lbnRzIFBvaW50TGlrZVxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgeDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHk6bnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJhZDJkZWc6bnVtYmVyID0gMzYwIC8gKE1hdGguUEkgKiAyKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgZGVnMnJhZDpudW1iZXIgPSAoTWF0aC5QSSAqIDIpIC8gMzYwO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkgPSBuZXcgUG9pbnQoMCwgMCk7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1heCA9IG5ldyBQb2ludCgyMTQ3NDgzNjQ3LCAyMTQ3NDgzNjQ3KTtcclxuICAgIHB1YmxpYyBzdGF0aWMgbWluID0gbmV3IFBvaW50KC0yMTQ3NDgzNjQ3LCAtMjE0NzQ4MzY0Nyk7XHJcbiAgICBwdWJsaWMgc3RhdGljIHVwID0gbmV3IFBvaW50KDAsIC0xKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGF2ZXJhZ2UocG9pbnRzOlBvaW50TGlrZVtdKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGlmICghcG9pbnRzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBQb2ludC5lbXB0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB4ID0gMCwgeSA9IDA7XHJcblxyXG4gICAgICAgIHBvaW50cy5mb3JFYWNoKHAgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gcC54O1xyXG4gICAgICAgICAgICB5ICs9IHAueTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh4IC8gcG9pbnRzLmxlbmd0aCwgeSAvIHBvaW50cy5sZW5ndGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZGlyZWN0aW9uKGZyb206UG9pbnRJbnB1dCwgdG86UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcHRBcmcodG8pLnN1YnRyYWN0KGZyb20pLm5vcm1hbGl6ZSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShzb3VyY2U6UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcHRBcmcoc291cmNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21CdWZmZXIoYnVmZmVyOm51bWJlcltdLCBpbmRleDpudW1iZXIgPSAwKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoYnVmZmVyW2luZGV4XSwgYnVmZmVyW2luZGV4ICsgMV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHg6bnVtYmVyfG51bWJlcltdLCB5PzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnggPSAoeFswXSk7XHJcbiAgICAgICAgICAgIHRoaXMueSA9ICh4WzFdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKDxudW1iZXI+eCk7XHJcbiAgICAgICAgICAgIHRoaXMueSA9ICh5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9yZWdpb24gR2VvbWV0cnlcclxuXHJcbiAgICBwdWJsaWMgYW5nbGUoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMueCA8IDApXHJcbiAgICAgICAgICAgID8gMzYwIC0gTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZyAqIC0xXHJcbiAgICAgICAgICAgIDogTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYW5nbGVBYm91dCh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMihwdC5jcm9zcyh0aGlzKSwgcHQuZG90KHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3Jvc3ModmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHB0LnkgLSB0aGlzLnkgKiBwdC54O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXN0YW5jZSh0bzpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh0byk7XHJcbiAgICAgICAgbGV0IGEgPSB0aGlzLnggLSBwdC54O1xyXG4gICAgICAgIGxldCBiID0gdGhpcy55IC0gcHQueTtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb3QodmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHB0LnggKyB0aGlzLnkgKiBwdC55O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsZW5ndGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxlbiA9IHRoaXMubGVuZ3RoKCk7XHJcbiAgICAgICAgaWYgKGxlbiA+IDAuMDAwMDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxIC8gbGVuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBlcnAoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy55ICogLTEsIHRoaXMueCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJwZXJwKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkucGVycCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnZlcnNlKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJldmVyc2UoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogLTEsIHRoaXMueSAqIC0xKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcm90YXRlKHJhZGlhbnM6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKTtcclxuICAgICAgICBsZXQgc2luID0gTWF0aC5zaW4ocmFkaWFucyk7XHJcbiAgICAgICAgbGV0IG54ID0gdGhpcy54ICogY29zIC0gdGhpcy55ICogc2luO1xyXG4gICAgICAgIGxldCBueSA9IHRoaXMueSAqIGNvcyArIHRoaXMueCAqIHNpbjtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChueCwgbnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZW5kcmVnaW9uXHJcblxyXG4gICAgLy9yZWdpb24gQXJpdGhtZXRpY1xyXG5cclxuICAgIHB1YmxpYyBhZGQodmFsOm51bWJlcnxQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgaWYgKCFwdCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnYWRkOiBwdCByZXF1aXJlZC4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKyBwdC54LCB0aGlzLnkgKyBwdC55KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGl2aWRlKGRpdmlzb3I6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54IC8gZGl2aXNvciwgdGhpcy55IC8gZGl2aXNvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG11bHRpcGx5KG11bHRpcGxlcjpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiBtdWx0aXBsZXIsIHRoaXMueSAqIG11bHRpcGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJvdW5kKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KE1hdGgucm91bmQodGhpcy54KSwgTWF0aC5yb3VuZCh0aGlzLnkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3VidHJhY3QodmFsOm51bWJlcnxQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgaWYgKCFwdCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnc3VidHJhY3Q6IHB0IHJlcXVpcmVkLic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5hZGQocHQucmV2ZXJzZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIENvbnZlcnNpb25cclxuXHJcbiAgICBwdWJsaWMgY2xvbmUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjpQb2ludExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBhbm90aGVyLnggJiYgdGhpcy55ID09PSBhbm90aGVyLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvQXJyYXkoKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy54fSwgJHt0aGlzLnl9XWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxufVxyXG5cclxuZnVuY3Rpb24gcHRBcmcodmFsOmFueSk6UG9pbnRcclxue1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCB8fCB2YWwgIT09IHVuZGVmaW5lZClcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gPFBvaW50PnZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLngsIHZhbC55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC5sZWZ0ICE9PSB1bmRlZmluZWQgJiYgdmFsLnRvcCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwubGVmdCwgdmFsLnRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KDxudW1iZXJbXT52YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnbnVtYmVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbn0iLCJpbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi9Qb2ludCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0TGlrZVxyXG57XHJcbiAgICBsZWZ0Om51bWJlcjtcclxuICAgIHRvcDpudW1iZXI7XHJcbiAgICB3aWR0aDpudW1iZXI7XHJcbiAgICBoZWlnaHQ6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5OlJlY3QgPSBuZXcgUmVjdCgwLCAwLCAwLCAwKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21FZGdlcyhsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgcmlnaHQ6bnVtYmVyLCBib3R0b206bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgbGVmdCxcclxuICAgICAgICAgICAgdG9wLFxyXG4gICAgICAgICAgICByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgICAgIGJvdHRvbSAtIHRvcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTGlrZShsaWtlOlJlY3RMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21NYW55KHJlY3RzOlJlY3RbXSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlY3RzLm1hcCh4ID0+IHgucG9pbnRzKCkpKTtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tUG9pbnRzKC4uLnBvaW50czpQb2ludFtdKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21Qb2ludEJ1ZmZlcihwb2ludHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50QnVmZmVyKHBvaW50czpQb2ludFtdLCBpbmRleD86bnVtYmVyLCBsZW5ndGg/Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5zbGljZShpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsZW5ndGggIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5zbGljZSgwLCBsZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbUVkZ2VzKFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC54KSksXHJcbiAgICAgICAgICAgIE1hdGgubWluKC4uLnBvaW50cy5tYXAocCA9PiBwLnkpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1heCguLi5wb2ludHMubWFwKHAgPT4gcC55KSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBsZWZ0Om51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdG9wOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyID0gMDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgd2lkdGg6bnVtYmVyLCBoZWlnaHQ6bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgdGhpcy50b3AgPSB0b3A7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgcmlnaHQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlZnQgKyB0aGlzLndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYm90dG9tKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2VudGVyKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMubGVmdCArICh0aGlzLndpZHRoIC8gMiksIHRoaXMudG9wICsgKHRoaXMuaGVpZ2h0IC8gMikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b3BMZWZ0KCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy50b3ApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwb2ludHMoKTpQb2ludFtdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy50b3ApLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5yaWdodCwgdGhpcy50b3ApLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5yaWdodCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5sZWZ0LCB0aGlzLmJvdHRvbSksXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2l6ZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9mZnNldChwdDpQb2ludExpa2UpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCArIHB0LngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgcHQueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb250YWlucyhpbnB1dDpQb2ludHxSZWN0TGlrZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmIChpbnB1dFsneCddICE9PSB1bmRlZmluZWQgJiYgaW5wdXRbJ3knXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHB0ID0gPFBvaW50PmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHB0LnggPj0gdGhpcy5sZWZ0XHJcbiAgICAgICAgICAgICAgICAmJiBwdC55ID49IHRoaXMudG9wXHJcbiAgICAgICAgICAgICAgICAmJiBwdC54IDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmVjdCA9IDxSZWN0TGlrZT5pbnB1dDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgPj0gdGhpcy5sZWZ0ICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCA+PSB0aGlzLnRvcCAmJlxyXG4gICAgICAgICAgICAgICAgcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA8PSB0aGlzLmxlZnQgKyB0aGlzLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IDw9IHRoaXMudG9wICsgdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluZmxhdGUoc2l6ZTpQb2ludCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgdGhpcy5sZWZ0IC0gc2l6ZS54LFxyXG4gICAgICAgICAgICB0aGlzLnRvcCAtIHNpemUueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCArIHNpemUueCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgKyBzaXplLnlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnRlcnNlY3RzKHJlY3Q6UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA+IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gdGhpcy50b3BcclxuICAgICAgICAgICAgJiYgcmVjdC5sZWZ0IDwgdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCA8IHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53aWR0aCA+PSAwICYmIHRoaXMuaGVpZ2h0ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4ID0gdGhpcy5sZWZ0O1xyXG4gICAgICAgIHZhciB5ID0gdGhpcy50b3A7XHJcbiAgICAgICAgdmFyIHcgPSB0aGlzLndpZHRoO1xyXG4gICAgICAgIHZhciBoID0gdGhpcy5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICh3IDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gdztcclxuICAgICAgICAgICAgdyA9IE1hdGguYWJzKHcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB5ICs9IGg7XHJcbiAgICAgICAgICAgIGggPSBNYXRoLmFicyhoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYFske3RoaXMubGVmdH0sICR7dGhpcy50b3B9LCAke3RoaXMud2lkdGh9LCAke3RoaXMuaGVpZ2h0fV1gO1xyXG4gICAgfVxyXG59IiwiIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudENhbGxiYWNrLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIGltcGxlbWVudHMgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgd3JhcCh0YXJnZXQ6RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyKTpFdmVudEVtaXR0ZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoISF0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD50YXJnZXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDxFdmVudEVtaXR0ZXI+dGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0OkV2ZW50VGFyZ2V0KVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmRpc3BhdGNoRXZlbnQoXHJcbiAgICAgICAgICAgIF8uZXh0ZW5kKG5ldyBFdmVudChldmVudCksIHsgYXJnczogYXJncyB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5sZXQgVHJhY2tlcjpPYmplY3RJbmRleDxib29sZWFuPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlDaGVja1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGluaXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFUcmFja2VyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgVHJhY2tlciA9IHt9O1xyXG5cclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gdHJ1ZSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlOiBLZXlib2FyZEV2ZW50KSA9PiBUcmFja2VyW2Uua2V5Q29kZV0gPSBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZG93bihrZXk6bnVtYmVyKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhVHJhY2tlciAmJiAhIVRyYWNrZXJba2V5XTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpLZXlFeHByZXNzaW9uXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGV4Y2x1c2l2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGtleXMgPSBpbnB1dFxyXG4gICAgICAgICAgICAuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBLZXlzLnBhcnNlKHgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlFeHByZXNzaW9uKGtleXMsIGV4Y2x1c2l2ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGN0cmw6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBhbHQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzaGlmdDpib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtleTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXhjbHVzaXZlOmJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihrZXlzOm51bWJlcltdLCBleGNsdXNpdmU6Ym9vbGVhbilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmV4Y2x1c2l2ZSA9IGV4Y2x1c2l2ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHJsID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5DVFJMKTtcclxuICAgICAgICB0aGlzLmFsdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQUxUKTtcclxuICAgICAgICB0aGlzLnNoaWZ0ID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5TSElGVCk7XHJcbiAgICAgICAgdGhpcy5rZXkgPSBrZXlzLmZpbHRlcih4ID0+IHggIT09IEtleXMuQ1RSTCAmJiB4ICE9PSBLZXlzLkFMVCAmJiB4ICE9PSBLZXlzLlNISUZUKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXRjaGVzKGtleURhdGE6S2V5RXhwcmVzc2lvbnxLZXlib2FyZEV2ZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlFeHByZXNzaW9uKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmwgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmxLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnRLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5Q29kZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgJ0tleUV4cHJlc3Npb24ubWF0Y2hlczogSW52YWxpZCBpbnB1dCc7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBLZXlNYXBwYWJsZSA9IEV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlckJhc2U7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEtleU1hcENhbGxiYWNrXHJcbntcclxuICAgIChlPzpLZXlib2FyZEV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5SW5wdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBmb3IoLi4uZWxtdHM6S2V5TWFwcGFibGVbXSk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEtleUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViczpFdmVudFN1YnNjcmlwdGlvbltdID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXJzOkV2ZW50RW1pdHRlcltdKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihleHByczpzdHJpbmd8c3RyaW5nW10sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpLZXlJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHBycykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbihbPHN0cmluZz5leHByc10sIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJlIG9mIGV4cHJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHNzID0gdGhpcy5lbWl0dGVycy5tYXAoZWUgPT4gdGhpcy5jcmVhdGVMaXN0ZW5lcihcclxuICAgICAgICAgICAgICAgIGVlLFxyXG4gICAgICAgICAgICAgICAgS2V5RXhwcmVzc2lvbi5wYXJzZShyZSksXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpc3RlbmVyKGVlOkV2ZW50RW1pdHRlciwga2U6S2V5RXhwcmVzc2lvbiwgY2FsbGJhY2s6S2V5TWFwQ2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVlLm9uKCdrZXlkb3duJywgKGV2dDpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGtlLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGtlLmV4Y2x1c2l2ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUoa21zOktleU1hcHBhYmxlW10pOkV2ZW50RW1pdHRlcltdXHJcbntcclxuICAgIHJldHVybiA8RXZlbnRFbWl0dGVyW10+a21zXHJcbiAgICAgICAgLm1hcCh4ID0+ICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICAgICAgPyBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD54KVxyXG4gICAgICAgICAgICA6IHhcclxuICAgICAgICApO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5c1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIEJBQ0tTUEFDRSA9IDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFRBQiA9IDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVOVEVSID0gMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNISUZUID0gMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIENUUkwgPSAxNztcclxuICAgIHB1YmxpYyBzdGF0aWMgQUxUID0gMTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBVVNFID0gMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIENBUFNfTE9DSyA9IDIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBFU0NBUEUgPSAyNztcclxuICAgIHB1YmxpYyBzdGF0aWMgU1BBQ0UgPSAzMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9VUCA9IDMzO1xyXG4gICAgcHVibGljIHN0YXRpYyBQQUdFX0RPV04gPSAzNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5EID0gMzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEhPTUUgPSAzNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9BUlJPVyA9IDM3O1xyXG4gICAgcHVibGljIHN0YXRpYyBVUF9BUlJPVyA9IDM4O1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9BUlJPVyA9IDM5O1xyXG4gICAgcHVibGljIHN0YXRpYyBET1dOX0FSUk9XID0gNDA7XHJcbiAgICBwdWJsaWMgc3RhdGljIElOU0VSVCA9IDQ1O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUxFVEUgPSA0NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzAgPSA0ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzEgPSA0OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzIgPSA1MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzMgPSA1MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzQgPSA1MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzUgPSA1MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzYgPSA1NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzcgPSA1NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzggPSA1NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzkgPSA1NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0EgPSA2NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0IgPSA2NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0MgPSA2NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0QgPSA2ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0UgPSA2OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0YgPSA3MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0cgPSA3MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ggPSA3MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0kgPSA3MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ogPSA3NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0sgPSA3NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0wgPSA3NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX00gPSA3NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX04gPSA3ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX08gPSA3OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1AgPSA4MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1EgPSA4MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1IgPSA4MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1MgPSA4MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1QgPSA4NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1UgPSA4NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1YgPSA4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1cgPSA4NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ggPSA4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1kgPSA4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ogPSA5MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9NRVRBID0gOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIFJJR0hUX01FVEEgPSA5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VMRUNUID0gOTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8wID0gOTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8xID0gOTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8yID0gOTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8zID0gOTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF80ID0gMTAwO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNSA9IDEwMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzYgPSAxMDI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF83ID0gMTAzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfOCA9IDEwNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzkgPSAxMDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIE1VTFRJUExZID0gMTA2O1xyXG4gICAgcHVibGljIHN0YXRpYyBBREQgPSAxMDc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNVQlRSQUNUID0gMTA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUNJTUFMID0gMTEwO1xyXG4gICAgcHVibGljIHN0YXRpYyBESVZJREUgPSAxMTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxID0gMTEyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMiA9IDExMztcclxuICAgIHB1YmxpYyBzdGF0aWMgRjMgPSAxMTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY0ID0gMTE1O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNSA9IDExNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjYgPSAxMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY3ID0gMTE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBGOCA9IDExOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjkgPSAxMjA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMCA9IDEyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjExID0gMTIyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTIgPSAxMjM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTV9MT0NLID0gMTQ0O1xyXG4gICAgcHVibGljIHN0YXRpYyBTQ1JPTExfTE9DSyA9IDE0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VNSUNPTE9OID0gMTg2O1xyXG4gICAgcHVibGljIHN0YXRpYyBFUVVBTFMgPSAxODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIENPTU1BID0gMTg4O1xyXG4gICAgcHVibGljIHN0YXRpYyBEQVNIID0gMTg5O1xyXG4gICAgcHVibGljIHN0YXRpYyBQRVJJT0QgPSAxOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEZPUldBUkRfU0xBU0ggPSAxOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEdSQVZFX0FDQ0VOVCA9IDE5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgT1BFTl9CUkFDS0VUID0gMjE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLX1NMQVNIID0gMjIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBDTE9TRV9CUkFDS0VUID0gMjIxO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSU5HTEVfUVVPVEUgPSAyMjI7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcsIHRocm93bk9uRmFpbDpib29sZWFuID0gdHJ1ZSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoIChpbnB1dC50cmltKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLU1BBQ0UnOiByZXR1cm4gS2V5cy5CQUNLU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1RBQic6IHJldHVybiBLZXlzLlRBQjtcclxuICAgICAgICAgICAgY2FzZSAnRU5URVInOiByZXR1cm4gS2V5cy5FTlRFUjtcclxuICAgICAgICAgICAgY2FzZSAnU0hJRlQnOiByZXR1cm4gS2V5cy5TSElGVDtcclxuICAgICAgICAgICAgY2FzZSAnQ1RSTCc6IHJldHVybiBLZXlzLkNUUkw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FMVCc6IHJldHVybiBLZXlzLkFMVDtcclxuICAgICAgICAgICAgY2FzZSAnUEFVU0UnOiByZXR1cm4gS2V5cy5QQVVTRTtcclxuICAgICAgICAgICAgY2FzZSAnQ0FQU19MT0NLJzogcmV0dXJuIEtleXMuQ0FQU19MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdFU0NBUEUnOiByZXR1cm4gS2V5cy5FU0NBUEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NQQUNFJzogcmV0dXJuIEtleXMuU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBR0VfVVAnOiByZXR1cm4gS2V5cy5QQUdFX1VQO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX0RPV04nOiByZXR1cm4gS2V5cy5QQUdFX0RPV047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VORCc6IHJldHVybiBLZXlzLkVORDtcclxuICAgICAgICAgICAgY2FzZSAnSE9NRSc6IHJldHVybiBLZXlzLkhPTUU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfQVJST1cnOiByZXR1cm4gS2V5cy5MRUZUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdVUF9BUlJPVyc6IHJldHVybiBLZXlzLlVQX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdSSUdIVF9BUlJPVyc6IHJldHVybiBLZXlzLlJJR0hUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdET1dOX0FSUk9XJzogcmV0dXJuIEtleXMuRE9XTl9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnSU5TRVJUJzogcmV0dXJuIEtleXMuSU5TRVJUO1xyXG4gICAgICAgICAgICBjYXNlICdERUxFVEUnOiByZXR1cm4gS2V5cy5ERUxFVEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8wJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8xJzogcmV0dXJuIEtleXMuS0VZXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8yJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8zJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV80JzogcmV0dXJuIEtleXMuS0VZXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV81JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV82JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV83JzogcmV0dXJuIEtleXMuS0VZXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV84JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV85JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9BJzogcmV0dXJuIEtleXMuS0VZX0E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9CJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9DJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9EJzogcmV0dXJuIEtleXMuS0VZX0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9FJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9GJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9HJzogcmV0dXJuIEtleXMuS0VZX0c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9IJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9JJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9KJzogcmV0dXJuIEtleXMuS0VZX0o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9LJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9MJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9NJzogcmV0dXJuIEtleXMuS0VZX007XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9OJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9PJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9QJzogcmV0dXJuIEtleXMuS0VZX1A7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9RJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9SJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9TJzogcmV0dXJuIEtleXMuS0VZX1M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9UJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9VJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9WJzogcmV0dXJuIEtleXMuS0VZX1Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9XJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9YJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9ZJzogcmV0dXJuIEtleXMuS0VZX1k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9aJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJzAnOiByZXR1cm4gS2V5cy5LRVlfMDtcclxuICAgICAgICAgICAgY2FzZSAnMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICcyJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJzMnOiByZXR1cm4gS2V5cy5LRVlfMztcclxuICAgICAgICAgICAgY2FzZSAnNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICc1JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJzYnOiByZXR1cm4gS2V5cy5LRVlfNjtcclxuICAgICAgICAgICAgY2FzZSAnNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICc4JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJzknOiByZXR1cm4gS2V5cy5LRVlfOTtcclxuICAgICAgICAgICAgY2FzZSAnQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdCJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gS2V5cy5LRVlfQztcclxuICAgICAgICAgICAgY2FzZSAnRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdFJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YnOiByZXR1cm4gS2V5cy5LRVlfRjtcclxuICAgICAgICAgICAgY2FzZSAnRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdIJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0knOiByZXR1cm4gS2V5cy5LRVlfSTtcclxuICAgICAgICAgICAgY2FzZSAnSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0wnOiByZXR1cm4gS2V5cy5LRVlfTDtcclxuICAgICAgICAgICAgY2FzZSAnTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdOJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ08nOiByZXR1cm4gS2V5cy5LRVlfTztcclxuICAgICAgICAgICAgY2FzZSAnUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdRJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ1InOiByZXR1cm4gS2V5cy5LRVlfUjtcclxuICAgICAgICAgICAgY2FzZSAnUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdUJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gS2V5cy5LRVlfVTtcclxuICAgICAgICAgICAgY2FzZSAnVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdXJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1gnOiByZXR1cm4gS2V5cy5LRVlfWDtcclxuICAgICAgICAgICAgY2FzZSAnWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdaJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfTUVUQSc6IHJldHVybiBLZXlzLkxFRlRfTUVUQTtcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfTUVUQSc6IHJldHVybiBLZXlzLlJJR0hUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NFTEVDVCc6IHJldHVybiBLZXlzLlNFTEVDVDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzAnOiByZXR1cm4gS2V5cy5OVU1QQURfMDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzEnOiByZXR1cm4gS2V5cy5OVU1QQURfMTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzInOiByZXR1cm4gS2V5cy5OVU1QQURfMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzMnOiByZXR1cm4gS2V5cy5OVU1QQURfMztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzQnOiByZXR1cm4gS2V5cy5OVU1QQURfNDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzUnOiByZXR1cm4gS2V5cy5OVU1QQURfNTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzYnOiByZXR1cm4gS2V5cy5OVU1QQURfNjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzcnOiByZXR1cm4gS2V5cy5OVU1QQURfNztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzgnOiByZXR1cm4gS2V5cy5OVU1QQURfODtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzknOiByZXR1cm4gS2V5cy5OVU1QQURfOTtcclxuICAgICAgICAgICAgY2FzZSAnTVVMVElQTFknOiByZXR1cm4gS2V5cy5NVUxUSVBMWTtcclxuICAgICAgICAgICAgY2FzZSAnQUREJzogcmV0dXJuIEtleXMuQUREO1xyXG4gICAgICAgICAgICBjYXNlICdTVUJUUkFDVCc6IHJldHVybiBLZXlzLlNVQlRSQUNUO1xyXG4gICAgICAgICAgICBjYXNlICdERUNJTUFMJzogcmV0dXJuIEtleXMuREVDSU1BTDtcclxuICAgICAgICAgICAgY2FzZSAnRElWSURFJzogcmV0dXJuIEtleXMuRElWSURFO1xyXG4gICAgICAgICAgICBjYXNlICdGMSc6IHJldHVybiBLZXlzLkYxO1xyXG4gICAgICAgICAgICBjYXNlICdGMic6IHJldHVybiBLZXlzLkYyO1xyXG4gICAgICAgICAgICBjYXNlICdGMyc6IHJldHVybiBLZXlzLkYzO1xyXG4gICAgICAgICAgICBjYXNlICdGNCc6IHJldHVybiBLZXlzLkY0O1xyXG4gICAgICAgICAgICBjYXNlICdGNSc6IHJldHVybiBLZXlzLkY1O1xyXG4gICAgICAgICAgICBjYXNlICdGNic6IHJldHVybiBLZXlzLkY2O1xyXG4gICAgICAgICAgICBjYXNlICdGNyc6IHJldHVybiBLZXlzLkY3O1xyXG4gICAgICAgICAgICBjYXNlICdGOCc6IHJldHVybiBLZXlzLkY4O1xyXG4gICAgICAgICAgICBjYXNlICdGOSc6IHJldHVybiBLZXlzLkY5O1xyXG4gICAgICAgICAgICBjYXNlICdGMTAnOiByZXR1cm4gS2V5cy5GMTA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMSc6IHJldHVybiBLZXlzLkYxMTtcclxuICAgICAgICAgICAgY2FzZSAnRjEyJzogcmV0dXJuIEtleXMuRjEyO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1fTE9DSyc6IHJldHVybiBLZXlzLk5VTV9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTQ1JPTExfTE9DSyc6IHJldHVybiBLZXlzLlNDUk9MTF9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTRU1JQ09MT04nOiByZXR1cm4gS2V5cy5TRU1JQ09MT047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VRVUFMUyc6IHJldHVybiBLZXlzLkVRVUFMUztcclxuICAgICAgICAgICAgY2FzZSAnQ09NTUEnOiByZXR1cm4gS2V5cy5DT01NQTtcclxuICAgICAgICAgICAgY2FzZSAnREFTSCc6IHJldHVybiBLZXlzLkRBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BFUklPRCc6IHJldHVybiBLZXlzLlBFUklPRDtcclxuICAgICAgICAgICAgY2FzZSAnRk9SV0FSRF9TTEFTSCc6IHJldHVybiBLZXlzLkZPUldBUkRfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0dSQVZFX0FDQ0VOVCc6IHJldHVybiBLZXlzLkdSQVZFX0FDQ0VOVDtcclxuICAgICAgICAgICAgY2FzZSAnT1BFTl9CUkFDS0VUJzogcmV0dXJuIEtleXMuT1BFTl9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLX1NMQVNIJzogcmV0dXJuIEtleXMuQkFDS19TTEFTSDtcclxuICAgICAgICAgICAgY2FzZSAnQ0xPU0VfQlJBQ0tFVCc6IHJldHVybiBLZXlzLkNMT1NFX0JSQUNLRVQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NJTkdMRV9RVU9URSc6IHJldHVybiBLZXlzLlNJTkdMRV9RVU9URTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd25PbkZhaWwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQga2V5OiAnICsgaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50JztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY2hlY2soZWxtdDpIVE1MRWxlbWVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlbG10LmRhdGFzZXRbJ01vdXNlRHJhZ0V2ZW50U3VwcG9ydCddID09PSAndHJ1ZSc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmFibGUoZWxtdDpIVE1MRWxlbWVudCk6TW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbiAgICB7XHJcbiAgICAgICAgZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9ICd0cnVlJztcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydChlbG10KTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgc2hvdWxkRHJhZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgaXNEcmFnZ2luZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgc3RhcnRQb2ludDpQb2ludDtcclxuICAgIHByb3RlY3RlZCBsYXN0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgY2FuY2VsOigpID0+IHZvaWQ7XHJcbiAgICBwcm90ZWN0ZWQgbGlzdGVuZXI6YW55O1xyXG5cclxuICAgIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgZWxtdDpIVE1MRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVsbXQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5saXN0ZW5lciA9IHRoaXMub25UYXJnZXRNb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvblRhcmdldE1vdXNlRG93bihlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gdGhpcy5sYXN0UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBsZXQgbW92ZUhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VNb3ZlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgbGV0IHVwSGFuZGxlciA9IHRoaXMub25XaW5kb3dNb3VzZVVwLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FuY2VsID0gKCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGxldCBuZXdQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNob3VsZERyYWcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2JlZ2luJywgZSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWcnLCBlLCBuZXdQb2ludC5zdWJ0cmFjdCh0aGlzLmxhc3RQb2ludCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0UG9pbnQgPSBuZXdQb2ludDtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZVVwKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2VuZCcsIGUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FuY2VsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFdmVudCh0eXBlOnN0cmluZywgc291cmNlOk1vdXNlRXZlbnQsIGRpc3Q/OlBvaW50KTpNb3VzZURyYWdFdmVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBldmVudCA9IDxNb3VzZURyYWdFdmVudD4obmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRYID0gdGhpcy5zdGFydFBvaW50Lng7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRZID0gdGhpcy5zdGFydFBvaW50Lnk7XHJcblxyXG4gICAgICAgIGlmIChkaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXZlbnQuZGlzdFggPSBkaXN0Lng7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RZID0gZGlzdC55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgS2V5cyB9IGZyb20gJy4vS2V5cyc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgS2V5Q2hlY2sgfSBmcm9tICcuL0tleUNoZWNrJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBNb3VzZUV2ZW50VHlwZSA9ICdjbGljayd8J2RibGNsaWNrJ3wnbW91c2Vkb3duJ3wnbW91c2Vtb3ZlJ3wnbW91c2V1cCd8J2RyYWdiZWdpbid8J2RyYWcnfCdkcmFnZW5kJ1xyXG5cclxuZnVuY3Rpb24gcGFyc2VfZXZlbnQodmFsdWU6c3RyaW5nKTpNb3VzZUV2ZW50VHlwZVxyXG57XHJcbiAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGNhc2UgJ2Rvd24nOlxyXG4gICAgICAgIGNhc2UgJ21vdmUnOlxyXG4gICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxNb3VzZUV2ZW50VHlwZT4oJ21vdXNlJyArIHZhbHVlKTtcclxuICAgICAgICBjYXNlICdjbGljayc6XHJcbiAgICAgICAgY2FzZSAnZGJsY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2Rvd24nOlxyXG4gICAgICAgIGNhc2UgJ21vdmUnOlxyXG4gICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICBjYXNlICdkcmFnYmVnaW4nOlxyXG4gICAgICAgIGNhc2UgJ2RyYWcnOlxyXG4gICAgICAgIGNhc2UgJ2RyYWdlbmQnOlxyXG4gICAgICAgICAgICByZXR1cm4gPE1vdXNlRXZlbnRUeXBlPnZhbHVlO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlRXZlbnRUeXBlOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlX2J1dHRvbih2YWx1ZTpzdHJpbmcpOm51bWJlclxyXG57XHJcbiAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGNhc2UgJ3ByaW1hcnknOlxyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjEnOlxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICBjYXNlICdzZWNvbmRhcnknOlxyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjInOlxyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICBjYXNlICdidXR0b24zJzpcclxuICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgTW91c2VCdXR0b246ICcgKyB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aWRlX2V4cHJlc3Npb24odmFsdWU6c3RyaW5nKTpzdHJpbmdbXVxyXG57XHJcbiAgICBsZXQgcGFydHMgPSB2YWx1ZS5zcGxpdCgnOicpO1xyXG5cclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPT0gMSlcclxuICAgIHtcclxuICAgICAgICBwYXJ0cy5zcGxpY2UoMCwgMCwgJ2Rvd24nKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFydHMuc2xpY2UoMCwgMik7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZUV4cHJlc3Npb25cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcpOk1vdXNlRXhwcmVzc2lvblxyXG4gICAge1xyXG4gICAgICAgIGxldCBjZmcgPSA8YW55PntcclxuICAgICAgICAgICAga2V5czogW10sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2ZnLmV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGNmZy5leGNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBbbGVmdCwgcmlnaHRdID0gZGl2aWRlX2V4cHJlc3Npb24oaW5wdXQpO1xyXG5cclxuICAgICAgICBjZmcuZXZlbnQgPSBwYXJzZV9ldmVudChsZWZ0KTtcclxuXHJcbiAgICAgICAgcmlnaHQuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKHggPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IEtleXMucGFyc2UoeCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZmcua2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmJ1dHRvbiA9IHBhcnNlX2J1dHRvbih4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VFeHByZXNzaW9uKGNmZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGV2ZW50Ok1vdXNlRXZlbnRUeXBlID0gbnVsbDtcclxuICAgIHB1YmxpYyByZWFkb25seSBidXR0b246bnVtYmVyID0gbnVsbDtcclxuICAgIHB1YmxpYyByZWFkb25seSBrZXlzOm51bWJlcltdID0gW107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXhjbHVzaXZlOmJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKGNmZzphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgY2ZnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlcyhtb3VzZURhdGE6TW91c2VFdmVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICE9PSBtb3VzZURhdGEudHlwZSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5idXR0b24gIT09IG51bGwgJiYgdGhpcy5idXR0b24gIT09IG1vdXNlRGF0YS5idXR0b24pXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgayBvZiB0aGlzLmtleXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIUtleUNoZWNrLmRvd24oaykpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEV2ZW50RW1pdHRlciwgRXZlbnRFbWl0dGVyQmFzZSwgRXZlbnRTdWJzY3JpcHRpb24gfSBmcm9tICcuLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuaW1wb3J0IHsgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIH0gZnJvbSAnLi9FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXInO1xyXG5pbXBvcnQgeyBNb3VzZUV4cHJlc3Npb24gfSBmcm9tICcuL01vdXNlRXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydCB9IGZyb20gJy4vTW91c2VEcmFnRXZlbnRTdXBwb3J0JztcclxuaW1wb3J0IHsgS2V5Q2hlY2sgfSBmcm9tICcuL0tleUNoZWNrJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBNYXBwYWJsZSA9IEV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlckJhc2U7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1vdXNlQ2FsbGJhY2tcclxue1xyXG4gICAgKGU6RXZlbnQpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZUlucHV0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZm9yKC4uLmVsbXRzOk1hcHBhYmxlW10pOk1vdXNlSW5wdXRcclxuICAgIHtcclxuICAgICAgICBLZXlDaGVjay5pbml0KCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViczpFdmVudFN1YnNjcmlwdGlvbltdID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXJzOkV2ZW50RW1pdHRlcltdKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihleHByOnN0cmluZywgY2FsbGJhY2s6TW91c2VDYWxsYmFjayk6TW91c2VJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGxldCBzcyA9IHRoaXMuZW1pdHRlcnMubWFwKGVlID0+IHRoaXMuY3JlYXRlTGlzdGVuZXIoXHJcbiAgICAgICAgICAgIGVlLFxyXG4gICAgICAgICAgICBNb3VzZUV4cHJlc3Npb24ucGFyc2UoZXhwciksXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKSk7XHJcblxyXG4gICAgICAgIHRoaXMuc3VicyA9IHRoaXMuc3Vicy5jb25jYXQoc3MpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpc3RlbmVyKHRhcmdldDpFdmVudEVtaXR0ZXIsIGV4cHI6TW91c2VFeHByZXNzaW9uLCBjYWxsYmFjazpNb3VzZUNhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0YXJnZXQub24oZXhwci5ldmVudCwgKGV2dDpNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGV4cHIubWF0Y2hlcyhldnQpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXhwci5leGNsdXNpdmUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplKGttczpNYXBwYWJsZVtdKTpFdmVudEVtaXR0ZXJbXVxyXG57XHJcbiAgICByZXR1cm4gPEV2ZW50RW1pdHRlcltdPmttc1xyXG4gICAgICAgIC5tYXAoeCA9PiAoISF4WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAgICAgID8gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+eClcclxuICAgICAgICAgICAgOiB4XHJcbiAgICAgICAgKTtcclxufVxyXG5cclxuIiwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoaHRtbDpzdHJpbmcpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIGxldCBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgbGV0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XHJcbiAgICBmcmFnLmFwcGVuZENoaWxkKGJvZHkpO1xyXG4gICAgYm9keS5pbm5lckhUTUwgPSBodG1sO1xyXG5cclxuICAgIHJldHVybiA8SFRNTEVsZW1lbnQ+Ym9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNzcyhlOkhUTUxFbGVtZW50LCBzdHlsZXM6T2JqZWN0TWFwPHN0cmluZz4pOkhUTUxFbGVtZW50XHJcbntcclxuICAgIGZvciAobGV0IHByb3AgaW4gc3R5bGVzKVxyXG4gICAge1xyXG4gICAgICAgIGUuc3R5bGVbcHJvcF0gPSBzdHlsZXNbcHJvcF07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoaWRlKGU6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwgeyBkaXNwbGF5OiAnbm9uZScgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG93KGU6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwgeyBkaXNwbGF5OiAnYmxvY2snIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlKGU6SFRNTEVsZW1lbnQsIHZpc2libGU6Ym9vbGVhbik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIHZpc2libGUgPyBzaG93KGUpIDogaGlkZShlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpbmdsZVRyYW5zaXRpb24oZTpIVE1MRWxlbWVudCwgcHJvcDpzdHJpbmcsIG1pbGxpczpudW1iZXIsIGVhc2U6c3RyaW5nID0gJ2xpbmVhcicpOnZvaWRcclxue1xyXG4gICAgZS5zdHlsZS50cmFuc2l0aW9uID0gYCR7cHJvcH0gJHttaWxsaXN9bXMgJHtlYXNlfWA7XHJcbiAgICBjb25zb2xlLmxvZyhlLnN0eWxlLnRyYW5zaXRpb24pO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiBlLnN0eWxlLnRyYW5zaXRpb24gPSAnJywgbWlsbGlzKTtcclxufSIsImV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2tcclxue1xyXG4gICAgKG9iajphbnksIHZhbDphbnkpOnZvaWRcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5KGRlZmF1bHRWYWx1ZTphbnksIGZpbHRlcjpQcm9wZXJ0eUNoYW5nZWRDYWxsYmFjaylcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55LCBwcm9wTmFtZTpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgcHJvcE5hbWUsIHtcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWwgPSB0aGlzWydfXycgKyBwcm9wTmFtZV07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbCA9PT0gdW5kZWZpbmVkKSA/IGRlZmF1bHRWYWx1ZSA6IHZhbDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BOYW1lXSA9IG5ld1ZhbDtcclxuICAgICAgICAgICAgICAgIGZpbHRlcih0aGlzLCBuZXdWYWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQodGFyZ2V0OmFueSwgZGF0YTphbnkpOmFueVxyXG57XHJcbiAgICBmb3IgKGxldCBrIGluIGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0W2tdID0gZGF0YVtrXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXg8VD4oYXJyOlRbXSwgaW5kZXhlcjoodG06VCkgPT4gbnVtYmVyfHN0cmluZyk6T2JqZWN0TWFwPFQ+XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCB0bSBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW2luZGV4ZXIodG0pXSA9IHRtO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBrZXlzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6c3RyaW5nW11cclxue1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGl4KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbHVlczxUPihpeDpPYmplY3RJbmRleDxUPnxPYmplY3RNYXA8VD4pOlRbXVxyXG57XHJcbiAgICBsZXQgYTpUW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBrIGluIGl4KVxyXG4gICAge1xyXG4gICAgICAgIGEucHVzaChpeFtrXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB6aXBQYWlycyhwYWlyczphbnlbXVtdKTphbnlcclxue1xyXG4gICAgbGV0IG9iaiA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IHBhaXIgb2YgcGFpcnMpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW3BhaXJbMF1dID0gcGFpclsxXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW56aXBQYWlycyhwYWlyczphbnkpOmFueVtdW11cclxue1xyXG4gICAgbGV0IGFyciA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGtleSBpbiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBhcnIucHVzaChba2V5LCBwYWlyc1trZXldXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFycjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1heDxUPihhcnI6VFtdLCBzZWxlY3RvcjoodDpUKSA9PiBudW1iZXIpOlRcclxue1xyXG4gICAgaWYgKGFyci5sZW5ndGggPT09IDApXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgbGV0IHQgPSBhcnJbMF07XHJcblxyXG4gICAgZm9yIChsZXQgeCBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKHQpIDwgc2VsZWN0b3IoeCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0ID0geDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkb3dDbG9uZSh0YXJnZXQ6YW55KTphbnlcclxue1xyXG4gICAgaWYgKHR5cGVvZih0YXJnZXQpID09PSAnb2JqZWN0JylcclxuICAgIHtcclxuICAgICAgICBsZXQgc2MgPSB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGFyZ2V0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2NbcHJvcF0gPSBzaGFkb3dDbG9uZSh0YXJnZXRbcHJvcF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNjO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQodGFyZ2V0OmFueSwgZGF0YTphbnkpOmFueVxyXG57XHJcbiAgICBmb3IgKGxldCBrIGluIGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0W2tdID0gZGF0YVtrXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXg8VD4oYXJyOlRbXSwgaW5kZXhlcjoodG06VCkgPT4gbnVtYmVyfHN0cmluZyk6T2JqZWN0TWFwPFQ+XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCB0bSBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW2luZGV4ZXIodG0pXSA9IHRtO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBrZXlzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6c3RyaW5nW11cclxue1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGl4KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbHVlczxUPihpeDpPYmplY3RJbmRleDxUPnxPYmplY3RNYXA8VD4pOlRbXVxyXG57XHJcbiAgICBsZXQgYTpUW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBrIGluIGl4KVxyXG4gICAge1xyXG4gICAgICAgIGEucHVzaChpeFtrXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB6aXBQYWlycyhwYWlyczphbnlbXVtdKTphbnlcclxue1xyXG4gICAgbGV0IG9iaiA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IHBhaXIgb2YgcGFpcnMpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW3BhaXJbMF1dID0gcGFpclsxXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW56aXBQYWlycyhwYWlyczphbnkpOmFueVtdW11cclxue1xyXG4gICAgbGV0IGFyciA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGtleSBpbiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBhcnIucHVzaChba2V5LCBwYWlyc1trZXldXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFycjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1heDxUPihhcnI6VFtdLCBzZWxlY3RvcjoodDpUKSA9PiBudW1iZXIpOlRcclxue1xyXG4gICAgaWYgKGFyci5sZW5ndGggPT09IDApXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgbGV0IHQgPSBhcnJbMF07XHJcblxyXG4gICAgZm9yIChsZXQgeCBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKHQpIDwgc2VsZWN0b3IoeCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0ID0geDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkb3dDbG9uZSh0YXJnZXQ6YW55KTphbnlcclxue1xyXG4gICAgaWYgKHR5cGVvZih0YXJnZXQpID09PSAnb2JqZWN0JylcclxuICAgIHtcclxuICAgICAgICBsZXQgc2MgPSB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGFyZ2V0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2NbcHJvcF0gPSBzaGFkb3dDbG9uZSh0YXJnZXRbcHJvcF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNjO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4vR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvdXRpbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlc2NyaWJlcyBhIHJlc29sdmVFeHByIG9mIGdyaWQgY2VsbHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZFJhbmdlXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyBHcmlkUmFuZ2Ugb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNlbGxzIHdpdGggdGhlIHNwZWNpZmllZCByZWZzIGZyb20gdGhlXHJcbiAgICAgKiBzcGVjaWZpZWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gY2VsbFJlZnNcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUobW9kZWw6R3JpZE1vZGVsLCBjZWxsUmVmczpzdHJpbmdbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IF8uaW5kZXgoY2VsbFJlZnMsIHggPT4geCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBtb2RlbC5jZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghbG9va3VwW2MucmVmXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY2VsbHMucHVzaChjKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgIGxldCB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VsZWN0cyBhIHJlc29sdmVFeHByIG9mIGNlbGxzIGZyb20gdGhlIHNwZWNpZmllZCBtb2RlbCBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIHZlY3RvcnMuICBUaGUgdmVjdG9ycyBzaG91bGQgYmVcclxuICAgICAqIHR3byBwb2ludHMgaW4gZ3JpZCBjb29yZGluYXRlcyAoZS5nLiBjb2wgYW5kIHJvdyByZWZlcmVuY2VzKSB0aGF0IGRyYXcgYSBsb2dpY2FsIGxpbmUgYWNyb3NzIHRoZSBncmlkLlxyXG4gICAgICogQW55IGNlbGxzIGZhbGxpbmcgaW50byB0aGUgcmVjdGFuZ2xlIGNyZWF0ZWQgZnJvbSB0aGVzZSB0d28gcG9pbnRzIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIHNlbGVjdGVkIHJlc29sdmVFeHByLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBtb2RlbFxyXG4gICAgICogQHBhcmFtIGZyb21cclxuICAgICAqIEBwYXJhbSB0b1xyXG4gICAgICogQHBhcmFtIHRvSW5jbHVzaXZlXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgc2VsZWN0KG1vZGVsOkdyaWRNb2RlbCwgZnJvbTpQb2ludCwgdG86UG9pbnQsIHRvSW5jbHVzaXZlOmJvb2xlYW4gPSBmYWxzZSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgLy9UT0RPOiBFeHBsYWluIHRoaXMuLi5cclxuICAgICAgICBsZXQgdGwgPSBuZXcgUG9pbnQoZnJvbS54IDwgdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA8IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuICAgICAgICBsZXQgYnIgPSBuZXcgUG9pbnQoZnJvbS54ID4gdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA+IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuXHJcbiAgICAgICAgaWYgKHRvSW5jbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnIgPSBici5hZGQoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGltcyA9IFJlY3QuZnJvbVBvaW50cyh0bCwgYnIpO1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gW10gYXMgc3RyaW5nW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHIgPSBkaW1zLnRvcDsgciA8IGRpbXMuYm90dG9tOyByKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjID0gZGltcy5sZWZ0OyBjIDwgZGltcy5yaWdodDsgYysrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IG1vZGVsLmxvY2F0ZUNlbGwoYywgcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZShtb2RlbCwgcmVzdWx0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IEdyaWRSYW5nZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5KCk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IFtdLFxyXG4gICAgICAgICAgICB0dGI6IFtdLFxyXG4gICAgICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICBsZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIGNvdW50OiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gbGVmdCB0byByaWdodC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGx0cjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gdG9wIHRvIGJvdHRvbS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCB3aWR0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgaW4gY29sdW1ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdpdGggaGVpZ2h0IG9mIHRoZSByZXNvbHZlRXhwciBpbiByb3dzLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByICh3aWxsIGJlIGRpZmZlcmVudCB0byBsZW5ndGggaWYgc29tZSBjZWxsIHNsb3RzIGNvbnRhaW4gbm8gY2VsbHMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY291bnQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGxlbmd0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgKG51bWJlciBvZiByb3dzICogbnVtYmVyIG9mIGNvbHVtbnMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVuZ3RoOm51bWJlcjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHZhbHVlczphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbHRyX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0dGJfc29ydChhOkdyaWRDZWxsLCBiOkdyaWRDZWxsKTpudW1iZXJcclxue1xyXG4gICAgbGV0IG4gPSAwO1xyXG5cclxuICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgaWYgKG4gPT09IDApXHJcbiAgICB7XHJcbiAgICAgICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG47XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL0dyaWRDZWxsJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgKiBhcyBzaG9ydGlkIGZyb20gJ3Nob3J0aWQnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBwYXJhbWV0ZXJzIHRoYXQgY2FuL3Nob3VsZCBiZSBwYXNzZWQgdG8gYSBuZXcgRGVmYXVsdEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgY29sUmVmOm51bWJlcjtcclxuICAgIHJvd1JlZjpudW1iZXI7XHJcbiAgICB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWY/OnN0cmluZztcclxuICAgIGNvbFNwYW4/Om51bWJlcjtcclxuICAgIHJvd1NwYW4/Om51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENlbGwuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRDZWxsIGltcGxlbWVudHMgR3JpZENlbGxcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbCByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6c3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbHVtbiByZWZlcmVuY2UgdGhhdCBkZXNjcmliZXMgdGhlIGhvcml6b250YWwgcG9zaXRpb24gb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2xSZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiBjb2x1bW5zIHRoYXQgdGhpcyBjZWxsIHNwYW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sU3BhbjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSB0aGF0IGRlc2NyaWJlcyB0aGUgdmVydGljYWwgcG9zaXRpb24gb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dSZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiByb3dzIHRoYXQgdGhpcyBjZWxsIHNwYW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93U3BhbjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgdmFsdWUgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB2YWx1ZTpzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOkRlZmF1bHRHcmlkQ2VsbFBhcmFtcylcclxuICAgIHtcclxuICAgICAgICBwYXJhbXMucmVmID0gcGFyYW1zLnJlZiB8fCBzaG9ydGlkLmdlbmVyYXRlKCk7XHJcbiAgICAgICAgcGFyYW1zLmNvbFNwYW4gPSBwYXJhbXMuY29sU3BhbiB8fCAxO1xyXG4gICAgICAgIHBhcmFtcy5yb3dTcGFuID0gcGFyYW1zLnJvd1NwYW4gfHwgMTtcclxuICAgICAgICBwYXJhbXMudmFsdWUgPSAocGFyYW1zLnZhbHVlID09PSB1bmRlZmluZWQgfHwgcGFyYW1zLnZhbHVlID09PSBudWxsKSA/ICcnIDogcGFyYW1zLnZhbHVlO1xyXG5cclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCBwYXJhbXMpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uL0dyaWRDb2x1bW4nO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDb2x1bW4uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRDb2x1bW4gaW1wbGVtZW50cyBHcmlkQ29sdW1uXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbHVtbiByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuICBVc2VkIHRvIGluZGljYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGVcclxuICAgICAqIGNvbHVtbiB3aXRoaW4gdGhlIGdyaWQgYmFzZWQgb24gYSB6ZXJvLWluZGV4LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDb2x1bW4uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICogQHBhcmFtIHdpZHRoXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHJlZjpudW1iZXIsIHdpZHRoOm51bWJlciA9IDEwMClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9HcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJ1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRNb2RlbC4gIEFsbCBpbnNwZWN0aW9uIG1ldGhvZHMgdXNlIE8oMSkgaW1wbGVtZW50YXRpb25zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIERlZmF1bHRHcmlkTW9kZWwgaW1wbGVtZW50cyBHcmlkTW9kZWxcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IGdyaWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0RlZmF1bHRHcmlkTW9kZWx9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKFtdLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY2VsbCBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjZWxsczpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY29sdW1uIGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbnM6R3JpZENvbHVtbltdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgcm93IGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZFJvd1tdO1xyXG5cclxuICAgIHByaXZhdGUgcmVmczpPYmplY3RNYXA8R3JpZENlbGw+O1xyXG4gICAgcHJpdmF0ZSBjb29yZHM6T2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkTW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGNlbGxzXHJcbiAgICAgKiBAcGFyYW0gY29sdW1uc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY2VsbHM6R3JpZENlbGxbXSwgY29sdW1uczpHcmlkQ29sdW1uW10sIHJvd3M6R3JpZFJvd1tdKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcyA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY29vcmRzID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuY29vcmRzW2MuY29sUmVmXSB8fCAodGhpcy5jb29yZHNbYy5jb2xSZWZdID0ge30pO1xyXG4gICAgICAgICAgICB4W2Mucm93UmVmXSA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCwgb3IgbnVsbCBpZiB0aGUgY2VsbCBkaWQgbm90IGV4aXN0XHJcbiAgICAgKiB3aXRoaW4gdGhlIG1vZGVsLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGwocmVmOnN0cmluZyk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZzW3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG5laWdoYm9yaW5nIGNlbGwgYXMgcGVyIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIHZlY3RvciAoZGlyZWN0aW9uKSBvYmplY3QsIG9yIG51bGwgaWYgbm8gbmVpZ2hib3IgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gdmVjdG9yXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBmaW5kQ2VsbE5laWdoYm9yKHJlZjpzdHJpbmcsIHZlY3RvcjpQb2ludCk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZmluZENlbGwocmVmKTtcclxuICAgICAgICBsZXQgY29sID0gY2VsbC5jb2xSZWYgKyB2ZWN0b3IueDtcclxuICAgICAgICBsZXQgcm93ID0gY2VsbC5yb3dSZWYgKyB2ZWN0b3IueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRlQ2VsbChjb2wsIHJvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgY29sdW1uIHJlZiBhbmQgcm93IHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCBhdCB0aGUgbG9jYXRpb24sXHJcbiAgICAgKiBvciBudWxsIGlmIG5vIGNlbGwgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gY29sUmVmXHJcbiAgICAgKiBAcGFyYW0gcm93UmVmXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBsb2NhdGVDZWxsKGNvbDpudW1iZXIsIHJvdzpudW1iZXIpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmNvb3Jkc1tjb2xdIHx8IHt9KVtyb3ddIHx8IG51bGw7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vR3JpZFJvdyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZFJvdy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZFJvdyBpbXBsZW1lbnRzIEdyaWRSb3dcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogcm93IHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkUm93LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgaGVpZ2h0Om51bWJlciA9IDIxKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgU3R5bGVkR3JpZENlbGwgfSBmcm9tICcuLi9zdHlsZWQvU3R5bGVkR3JpZENlbGwnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBGbGV4R3JpZENlbGwgZXh0ZW5kcyBTdHlsZWRHcmlkQ2VsbFxyXG57XHJcbiAgICBwdWJsaWMgZm9ybXVsYTpzdHJpbmc7XHJcbn0iLCJleHBvcnQgY2xhc3MgRmxleEdyaWRDb250cm9sbGVyXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKClcclxuICAgIHtcclxuXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBleHRlbmQgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXNjYWRlKCk6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTpQcm9wZXJ0eURlc2NyaXB0b3JcclxuICAgIHtcclxuICAgICAgICBsZXQgcGsgPSBgX18ke2tleX1gO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCk6dm9pZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1twa10gfHwgKCEhdGhpcy5wYXJlbnQgPyB0aGlzLnBhcmVudFtrZXldIDogbnVsbCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsOmFueSk6dm9pZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3BrXSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgVGV4dEFsaWdubWVudCA9ICdsZWZ0J3wnY2VudGVyJ3wncmlnaHQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN0eWxlXHJcbntcclxuICAgIHB1YmxpYyByZWFkb25seSBwYXJlbnQ6U3R5bGU7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGJvcmRlckNvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZmlsbENvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdGV4dEFsaWdubWVudDpUZXh0QWxpZ25tZW50O1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0Q29sb3I6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0Rm9udDpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHRleHRTaXplOm51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ/OlN0eWxlLCB2YWx1ZXM/OmFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG4gICAgICAgIGlmICh2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBCYXNlU3R5bGUgPSBuZXcgU3R5bGUobnVsbCwge1xyXG4gICAgYm9yZGVyQ29sb3I6ICdsaWdodGdyYXknLFxyXG4gICAgZmlsbENvbG9yOiAnd2hpdGUnLFxyXG4gICAgdGV4dEFsaWdubWVudDogJ2xlZnQnLFxyXG4gICAgdGV4dENvbG9yOiAnYmxhY2snLFxyXG4gICAgdGV4dEZvbnQ6ICdTZWdvZSBVSScsXHJcbiAgICB0ZXh0U2l6ZTogMTMsXHJcbn0pOyIsImltcG9ydCB7IERlZmF1bHRHcmlkQ2VsbCB9IGZyb20gJy4uL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gJy4vU3R5bGUnO1xyXG5pbXBvcnQgeyByZW5kZXJlciwgdmlzdWFsaXplIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcblxyXG5cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBTdHlsZWRHcmlkQ2VsbCBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFxyXG57XHJcbiAgICBAdmlzdWFsaXplKClcclxuICAgIHB1YmxpYyBzdHlsZTpTdHlsZSA9IEJhc2VTdHlsZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGxldCBzdHlsZSA9IHZpc3VhbC5zdHlsZSBhcyBTdHlsZTtcclxuXHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS5maWxsQ29sb3I7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gc3R5bGUuYm9yZGVyQ29sb3I7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUudGV4dENvbG9yO1xyXG4gICAgZ2Z4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xyXG4gICAgZ2Z4LmZvbnQgPSBgJHtzdHlsZS50ZXh0U2l6ZX1weCAke3N0eWxlLnRleHRGb250fWA7XHJcbiAgICBnZnguZmlsbFRleHQodmlzdWFsLnZhbHVlLCAzLCAwICsgKHZpc3VhbC5oZWlnaHQgLyAyKSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IGlzQm9vbGVhbiB9IGZyb20gJ3V0aWwnO1xyXG5cclxuLy9UaGlzIGtlZXBzIFdlYlN0b3JtIHF1aWV0LCBmb3Igc29tZSByZWFzb24gaXQgaXMgY29tcGxhaW5pbmcuLi5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDphbnk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERvIG5vdCB1c2UgZGlyZWN0bHkuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzRGVmPFQ+XHJcbntcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIGRlZmluaXRpb24gZm9yIGEgY2VsbCByZW5kZXJlciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJcclxue1xyXG4gICAgKGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIHZpc3VhbDphbnkpOnZvaWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9jb21tYW5kXzsgYW4gZXh0ZXJuYWxseSBjYWxsYWJsZSBsb2dpYyBibG9jayB0aGF0IHBlcmZvcm1zIHNvbWUgdGFzay4gIEEgbmFtZVxyXG4gKiBmb3IgdGhlIGNvbW1hbmQgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZCBhcyB0aGUgY29tbWFuZCB3aWxsIGJlXHJcbiAqIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCBjb21tYW5kIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZChuYW1lPzpzdHJpbmcpOk1ldGhvZERlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcsIGRlc2NyaXB0b3I6VHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8RnVuY3Rpb24+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6Y29tbWFuZHMnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBpbXBsOiBkZXNjcmlwdG9yLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IGRlZmluZXMgdGhlIHJlbmRlciBmdW5jdGlvbiBmb3IgYSBHcmlkQ2VsbCBpbXBsZW1lbnRhdGlvbiwgYWxsb3dpbmcgY3VzdG9tIGNlbGwgdHlwZXNcclxuICogdG8gY29udHJvbCB0aGVpciBkcmF3aW5nIGJlaGF2aW9yLlxyXG4gKlxyXG4gKiBAcGFyYW0gZnVuY1xyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyZXIoZnVuYzpSZW5kZXJlcik6Q2xhc3NEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgZnVuYywgY3Rvcik7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2QgYXMgYSBfcm91dGluZV87IGEgbG9naWMgYmxvY2sgdGhhdCBjYW4gYmUgaG9va2VkIGludG8gb3Igb3ZlcnJpZGRlbiBieSBvdGhlclxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgcm91dGluZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSByb3V0aW5lIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHJvdXRpbmUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3V0aW5lKG5hbWU/OnN0cmluZyk6TWV0aG9kRGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCByb3V0aW5lID0gZGVzY3JpcHRvci52YWx1ZTtcclxuICAgICAgICBsZXQgd3JhcHBlciA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQga2VybmVsID0gKHRoaXNbJ19fa2VybmVsJ10gfHwgdGhpc1sna2VybmVsJ10pIGFzIEdyaWRLZXJuZWw7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXJuZWwucm91dGluZXMuc2lnbmFsKGtleSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSwgcm91dGluZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlciB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBhIF92YXJpYWJsZV87IGEgcmVhZGFibGUgYW5kIG9wdGlvbmFsbHkgd3JpdGFibGUgdmFsdWUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnlcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHZhcmlhYmxlIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgdmFyaWFibGUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgdmFyaWFibGUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShtdXRhYmxlOmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yO1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZT86c3RyaW5nLCBtdXRhYmxlPzpib29sZWFuKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG5hbWU6c3RyaW5nfGJvb2xlYW4sIG11dGFibGU/OmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIGlmICh0eXBlb2YobmFtZSkgPT09ICdib29sZWFuJylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFyaWFibGUodW5kZWZpbmVkLCBuYW1lIGFzIGJvb2xlYW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZhcmlhYmxlcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIG11dGFibGU6IG11dGFibGUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vbGV0IHZhbFN0b3JlS2V5ID0gISFuYW1lID8ga2V5IDogYF9fJHtrZXl9YDtcclxuICAgICAgICAvL2xldCB1c2VBbHRWYWx1ZVN0b3JlID0gIW5hbWU7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL09iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBuYW1lIHx8IGtleSwge1xyXG4gICAgICAgIC8vICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAvLyAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2YWxTdG9yZUtleV07IH0sXHJcbiAgICAgICAgLy8gICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpIHsgdGhpc1t2YWxTdG9yZUtleV0gPSBuZXdWYWw7IH1cclxuICAgICAgICAvL30pO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIGZvciB1c2Ugd2l0aGluIGltcGxlbWVudGF0aW9ucyBvZiBHcmlkQ2VsbCB0aGF0IG1hcmtzIGEgZmllbGQgYXMgb25lIHRoYXQgYWZmZWN0cyB0aGUgdmlzdWFsXHJcbiAqIGFwcGVhcmFuY2Ugb2YgdGhlIGNlbGwuICBUaGlzIHdpbGwgY2F1c2UgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCB0byBiZSBtYXBwZWQgdG8gdGhlIF9WaXN1YWxfIG9iamVjdFxyXG4gKiBjcmVhdGVkIGJlZm9yZSB0aGUgY2VsbCBpcyBkcmF3bi5cclxuICpcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmlzdWFsaXplKCk6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6dmlzdWFsaXplJztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBSZWZsZWN0LmdldE1ldGFkYXRhKG1kaywgY3Rvcik7XHJcbiAgICAgICAgaWYgKCFsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShtZGssIChsaXN0ID0gW10pLCBjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxpc3QucHVzaChrZXkpO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IERlZmF1bHRHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXJCYXNlIH0gZnJvbSAnLi9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRMYXlvdXQgfSBmcm9tICcuL2ludGVybmFsL0dyaWRMYXlvdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IHByb3BlcnR5IH0gZnJvbSAnLi4vbWlzYy9Qcm9wZXJ0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgdmFyaWFibGUgfSBmcm9tICcuL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VFdmVudCBleHRlbmRzIE1vdXNlRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VEcmFnRXZlbnQgZXh0ZW5kcyBNb3VzZURyYWdFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRLZXlib2FyZEV2ZW50IGV4dGVuZHMgS2V5Ym9hcmRFdmVudFxyXG57XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZEVsZW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKHRhcmdldDpIVE1MRWxlbWVudCk6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgY2FudmFzID0gdGFyZ2V0Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgY2FudmFzLmlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgIGNhbnZhcy5jbGFzc05hbWUgPSB0YXJnZXQuY2xhc3NOYW1lID0gJyBncmlkJztcclxuICAgICAgICBjYW52YXMudGFiSW5kZXggPSAwO1xyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHRhcmdldC5jbGllbnRXaWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdGFyZ2V0LmNsaWVudEhlaWdodDtcclxuXHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNhbnZhcywgdGFyZ2V0KTtcclxuICAgICAgICB0YXJnZXQucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgR3JpZEVsZW1lbnQoY2FudmFzKTtcclxuICAgIH1cclxuXHJcbiAgICBAcHJvcGVydHkoRGVmYXVsdEdyaWRNb2RlbC5lbXB0eSgpLCB0ID0+IHQuaW52YWxpZGF0ZSgpKVxyXG4gICAgcHVibGljIG1vZGVsOkdyaWRNb2RlbDtcclxuXHJcbiAgICBAcHJvcGVydHkoMCwgdCA9PiB7IHQucmVkcmF3KCk7IHQuZW1pdCgnc2Nyb2xsJyk7IH0pXHJcbiAgICBwdWJsaWMgc2Nyb2xsTGVmdDpudW1iZXI7XHJcblxyXG4gICAgQHByb3BlcnR5KDAsIHQgPT4geyB0LnJlZHJhdygpOyB0LmVtaXQoJ3Njcm9sbCcpOyB9KVxyXG4gICAgcHVibGljIHNjcm9sbFRvcDpudW1iZXI7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvb3Q6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGtlcm5lbDpHcmlkS2VybmVsO1xyXG5cclxuICAgIHByaXZhdGUgbGF5b3V0OkdyaWRMYXlvdXQ7XHJcbiAgICBwcml2YXRlIGRpcnR5OmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgYnVmZmVyczpPYmplY3RNYXA8QnVmZmVyPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSB2aXN1YWxzOk9iamVjdE1hcDxWaXN1YWw+ID0ge307XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBjYW52YXM7XHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWwodGhpcy5lbWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBbJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnYmVnaW4nLCAnZHJhZycsICdkcmFnZW5kJ11cclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PiB0aGlzLmZvcndhcmRNb3VzZUV2ZW50KHgpKTtcclxuICAgICAgICBbJ2tleWRvd24nLCAna2V5cHJlc3MnLCAna2V5dXAnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZEtleUV2ZW50KHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxXaWR0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJvd3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbEhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGwoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy5zY3JvbGxMZWZ0LCB0aGlzLnNjcm9sbFRvcCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4dGVuZChleHQ6R3JpZEV4dGVuc2lvbik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChleHQuaW5pdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBleGVjKGNvbW1hbmQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuY29tbWFuZHMuZXhlYyhjb21tYW5kLCBhcmdzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLmdldCh2YXJpYWJsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCh2YXJpYWJsZTpzdHJpbmcsIHZhbHVlOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMua2VybmVsLnZhcmlhYmxlcy5zZXQodmFyaWFibGUsIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWVyZ2VJbnRlcmZhY2UoKTpHcmlkRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMua2VybmVsLmV4cG9ydEludGVyZmFjZSh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9jdXMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yb290LmZvY3VzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxBdEdyaWRQb2ludChwdDpQb2ludExpa2UpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlZnMgPSB0aGlzLmxheW91dC5jYXB0dXJlQ2VsbHMobmV3IFJlY3QocHQueCwgcHQueSwgMSwgMSkpO1xyXG4gICAgICAgIGlmIChyZWZzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmZpbmRDZWxsKHJlZnNbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxBdFZpZXdQb2ludChwdDpQb2ludExpa2UpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICBsZXQgZ3B0ID0gUG9pbnQuY3JlYXRlKHB0KS5hZGQodmlld3BvcnQudG9wTGVmdCgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2VsbEF0R3JpZFBvaW50KGdwdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxzSW5HcmlkUmVjdChyZWN0OlJlY3RMaWtlKTpHcmlkQ2VsbFtdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlZnMgPSB0aGlzLmxheW91dC5jYXB0dXJlQ2VsbHMocmVjdCk7XHJcbiAgICAgICAgcmV0dXJuIHJlZnMubWFwKHggPT4gdGhpcy5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxzSW5WaWV3UmVjdChyZWN0OlJlY3RMaWtlKTpHcmlkQ2VsbFtdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICBsZXQgZ3J0ID0gUmVjdC5mcm9tTGlrZShyZWN0KS5vZmZzZXQodmlld3BvcnQudG9wTGVmdCgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2VsbHNJbkdyaWRSZWN0KGdydCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxHcmlkUmVjdChyZWY6c3RyaW5nKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlZ2lvbiA9IHRoaXMubGF5b3V0LnF1ZXJ5Q2VsbChyZWYpO1xyXG4gICAgICAgIHJldHVybiAhIXJlZ2lvbiA/IFJlY3QuZnJvbUxpa2UocmVnaW9uKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENlbGxWaWV3UmVjdChyZWY6c3RyaW5nKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlY3QgPSB0aGlzLmdldENlbGxHcmlkUmVjdChyZWYpO1xyXG5cclxuICAgICAgICBpZiAocmVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJlY3QgPSByZWN0Lm9mZnNldCh0aGlzLnNjcm9sbC5pbnZlcnNlKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNjcm9sbFRvKHB0T3JSZWN0OlBvaW50TGlrZXxSZWN0TGlrZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBkZXN0ID0gPGFueT5wdE9yUmVjdDtcclxuXHJcbiAgICAgICAgaWYgKGRlc3Qud2lkdGggPT09IHVuZGVmaW5lZCAmJiBkZXN0LmhlaWdodCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGVzdCA9IG5ldyBSZWN0KGRlc3QueCwgZGVzdC55LCAxLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkZXN0LmxlZnQgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxMZWZ0ICs9IGRlc3QubGVmdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QucmlnaHQgPiB0aGlzLndpZHRoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxMZWZ0ICs9IGRlc3QucmlnaHQgLSB0aGlzLndpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC50b3AgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgKz0gZGVzdC50b3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmJvdHRvbSA+IHRoaXMuaGVpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgKz0gZGVzdC5ib3R0b20gLSB0aGlzLmhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludmFsaWRhdGUoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJzID0ge307XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0LmNvbXB1dGUodGhpcy5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZW1pdCgnaW52YWxpZGF0ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWRyYXcoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRpcnR5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZHJhdygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVZpc3VhbHMoKTtcclxuICAgICAgICB0aGlzLmRyYXdWaXN1YWxzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmVtaXQoJ2RyYXcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbXB1dGVWaWV3cG9ydCgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoTWF0aC5mbG9vcih0aGlzLnNjcm9sbExlZnQpLCBNYXRoLmZsb29yKHRoaXMuc2Nyb2xsVG9wKSwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQudXBkYXRlVmlzdWFscycpO1xyXG5cclxuICAgICAgICBsZXQgeyBtb2RlbCwgbGF5b3V0IH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCB2aXNpYmxlQ2VsbHMgPSBsYXlvdXQuY2FwdHVyZUNlbGxzKHZpZXdwb3J0KVxyXG4gICAgICAgICAgICAubWFwKHJlZiA9PiBtb2RlbC5maW5kQ2VsbChyZWYpKTtcclxuXHJcbiAgICAgICAgbGV0IHByZXZGcmFtZSA9IHRoaXMudmlzdWFscztcclxuICAgICAgICBsZXQgbmV4dEZyYW1lID0gPE9iamVjdE1hcDxWaXN1YWw+Pnt9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHZpc2libGVDZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZWdpb24gPSBsYXlvdXQucXVlcnlDZWxsKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgbGV0IHZpc3VhbCA9IHRoaXMuY3JlYXRlVmlzdWFsKGNlbGwsIHJlZ2lvbik7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhIHByZXZpb3VzIHZpc3VhbCBhbHJlYWR5IGV4aXN0ZWQsIHBlcmZvcm0gYSBkaWZmIGFuZCBpZiB0aGVyZSBhcmUgY2hhbmdlcywgdHJhc2ggdGhlXHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlciBmb3IgdGhpcyBjZWxsIHNvIHRoYXQgaXQgaXMgcmVkcmF3blxyXG4gICAgICAgICAgICBsZXQgcHJldmlvdXMgPSBwcmV2RnJhbWVbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICBpZiAoISFwcmV2aW91cyAmJiAhcHJldmlvdXMuZXF1YWxzKHZpc3VhbCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBuZXh0RnJhbWVbY2VsbC5yZWZdID0gdmlzdWFsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy52aXN1YWxzID0gbmV4dEZyYW1lO1xyXG5cclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXdWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICBsZXQgZ2Z4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IGFscGhhOiB0cnVlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICBnZnguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICBnZnguc2F2ZSgpO1xyXG4gICAgICAgIGdmeC50cmFuc2xhdGUodmlld3BvcnQubGVmdCAqIC0xLCB2aWV3cG9ydC50b3AgKiAtMSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNyIGluIHRoaXMudmlzdWFscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5tb2RlbC5maW5kQ2VsbChjcik7XHJcbiAgICAgICAgICAgIGxldCB2aXN1YWwgPSB0aGlzLnZpc3VhbHNbY3JdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF2aWV3cG9ydC5pbnRlcnNlY3RzKHZpc3VhbCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgYnVmZmVyID0gdGhpcy5idWZmZXJzW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghYnVmZmVyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdID0gdGhpcy5jcmVhdGVCdWZmZXIodmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2N1c3RvbTpyZW5kZXJlcicsIGNlbGwuY29uc3RydWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlbmRlcmVyKGJ1ZmZlci5nZngsIHZpc3VhbCwgY2VsbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdmeC5kcmF3SW1hZ2UoYnVmZmVyLmNhbnZhcywgdmlzdWFsLmxlZnQgLSBidWZmZXIuaW5mbGF0aW9uLCB2aXN1YWwudG9wIC0gYnVmZmVyLmluZmxhdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZngucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LmRyYXdWaXN1YWxzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVCdWZmZXIod2lkdGg6bnVtYmVyLCBoZWlnaHQ6bnVtYmVyKTpCdWZmZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcih3aWR0aCwgaGVpZ2h0LCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVZpc3VhbChjZWxsOmFueSwgcmVnaW9uOlJlY3RMaWtlKTpWaXN1YWxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlzdWFsID0gbmV3IFZpc3VhbChjZWxsLnJlZiwgY2VsbC52YWx1ZSwgcmVnaW9uLmxlZnQsIHJlZ2lvbi50b3AsIHJlZ2lvbi53aWR0aCwgcmVnaW9uLmhlaWdodCk7XHJcblxyXG4gICAgICAgIGxldCBwcm9wcyA9IChSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOnZpc3VhbGl6ZScsIGNlbGwuY29uc3RydWN0b3IucHJvdG90eXBlKSB8fCBbXSkgYXMgc3RyaW5nW107XHJcbiAgICAgICAgZm9yIChsZXQgcCBvZiBwcm9wcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxbcF0gPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmlzdWFsW3BdID0gXy5zaGFkb3dDbG9uZShjZWxsW3BdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYElsbGVnYWwgdmlzdWFsaXplZCBwcm9wZXJ0eSBuYW1lICR7cH0gb24gdHlwZSAke2NlbGwuY29uc3RydWN0b3IubmFtZX0uYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2aXN1YWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkTW91c2VFdmVudChldmVudDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCAobmU6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IG5ldyBQb2ludChuZS5vZmZzZXRYLCBuZS5vZmZzZXRZKTtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgZ2UgPSA8YW55Pm5lO1xyXG4gICAgICAgICAgICBnZS5jZWxsID0gY2VsbCB8fCBudWxsO1xyXG4gICAgICAgICAgICBnZS5ncmlkWCA9IHB0Lng7XHJcbiAgICAgICAgICAgIGdlLmdyaWRZID0gcHQueTsgICAgICBcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudCwgZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZEtleUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCA8R3JpZEtleWJvYXJkRXZlbnQ+bmUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBCdWZmZXJcclxue1xyXG4gICAgcHVibGljIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIHB1YmxpYyBnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB3aWR0aDpudW1iZXIsIHB1YmxpYyBoZWlnaHQ6bnVtYmVyLCBwdWJsaWMgaW5mbGF0aW9uOm51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2lkdGggKyAoaW5mbGF0aW9uICogMik7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0ICsgKGluZmxhdGlvbiAqIDIpO1xyXG4gICAgICAgIHRoaXMuZ2Z4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IGFscGhhOiBmYWxzZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgdGhpcy5nZngudHJhbnNsYXRlKGluZmxhdGlvbiwgaW5mbGF0aW9uKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVmlzdWFsXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWY6c3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlOnN0cmluZyxcclxuICAgICAgICAgICAgICAgIHB1YmxpYyBsZWZ0Om51bWJlcixcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB0b3A6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIHdpZHRoOm51bWJlcixcclxuICAgICAgICAgICAgICAgIHB1YmxpYyBoZWlnaHQ6bnVtYmVyKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjphbnkpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpc1twcm9wXSAhPT0gYW5vdGhlcltwcm9wXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufSIsImltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJ1xyXG5cclxuLy9UaGlzIGtlZXBzIFdlYlN0b3JtIHF1aWV0LCBmb3Igc29tZSByZWFzb24gaXQgaXMgY29tcGxhaW5pbmcuLi5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDphbnk7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ29tbWFuZFxyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ29tbWFuZEh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCBjb21tYW5kIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIGRlZmluZShjb21tYW5kOnN0cmluZywgaW1wbDpHcmlkQ29tbWFuZCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVzIHRoZSBzcGVjaWZpZWQgZ3JpZCBjb21tYW5kLlxyXG4gICAgICovXHJcbiAgICBleGVjKGNvbW1hbmQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRWYXJpYWJsZVxyXG57XHJcbiAgICBnZXQoKTphbnk7XHJcbiAgICBzZXQ/KHZhbHVlOmFueSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkVmFyaWFibGVIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgZGVmaW5lKHZhcmlhYmxlOnN0cmluZywgaW1wbDpHcmlkVmFyaWFibGUpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBnZXQodmFyaWFibGU6c3RyaW5nKTphbnk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBzZXQodmFyaWFibGU6c3RyaW5nLCB2YWx1ZTphbnkpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVIb29rXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lT3ZlcnJpZGVcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOmFueTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZUh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBob29rIHRvIHRoZSBzcGVjaWZpZWQgc2lnbmFsIHRoYXQgZW5hYmxlcyBleHRlbnNpb25zIHRvIG92ZXJyaWRlIGdyaWQgYmVoYXZpb3JcclxuICAgICAqIGRlZmluZWQgaW4gdGhlIGNvcmUgb3Igb3RoZXIgZXh0ZW5zaW9ucy5cclxuICAgICAqL1xyXG4gICAgaG9vayhyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6YW55KTp2b2lkO1xyXG5cclxuICAgIG92ZXJyaWRlKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazphbnkpOmFueTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpZ25hbHMgdGhhdCBhIHJvdXRpbmUgaXMgYWJvdXQgdG8gcnVuIHRoYXQgY2FuIGJlIGhvb2tlZCBvciBvdmVycmlkZGVuIGJ5IGV4dGVuc2lvbnMuICBBcmd1bWVudHNcclxuICAgICAqIHNob3VsZCBiZSBzdXBwb3J0aW5nIGRhdGEgb3IgcmVsZXZhbnQgb2JqZWN0cyB0byB0aGUgcm91dGluZS4gIFRoZSB2YWx1ZSByZXR1cm5lZCB3aWxsIGJlIGB0cnVlYFxyXG4gICAgICogaWYgdGhlIHJvdXRpbmUgaGFzIGJlZW4gb3ZlcnJpZGRlbiBieSBhbiBleHRlbnNpb24uXHJcbiAgICAgKi9cclxuICAgIHNpZ25hbChyb3V0aW5lOnN0cmluZywgLi4uYXJnczphbnlbXSk6Ym9vbGVhbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEltcGxlbWVudHMgdGhlIGNvcmUgb2YgdGhlIEdyaWQgZXh0ZW5zaWJpbGl0eSBzeXN0ZW0uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZEtlcm5lbFxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29tbWFuZHM6R3JpZENvbW1hbmRIdWIgPSBuZXcgR3JpZEtlcm5lbENvbW1hbmRIdWJJbXBsKCk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm91dGluZXM6R3JpZFJvdXRpbmVIdWIgPSBuZXcgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsKCk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdmFyaWFibGVzOkdyaWRWYXJpYWJsZUh1YiA9IG5ldyBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsKCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyOihldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4cG9ydEludGVyZmFjZSh0YXJnZXQ/OmFueSk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmRzID0gdGhpcy5jb21tYW5kc1snc3RvcmUnXSBhcyBPYmplY3RNYXA8R3JpZENvbW1hbmQ+O1xyXG4gICAgICAgIGxldCB2YXJpYWJsZXMgPSB0aGlzLnZhcmlhYmxlc1snc3RvcmUnXSBhcyBPYmplY3RNYXA8R3JpZFZhcmlhYmxlPjtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbiBpbiBjb21tYW5kcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRhcmdldFtuXSA9IGNvbW1hbmRzW25dO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgbiBpbiB2YXJpYWJsZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBuLCB2YXJpYWJsZXNbbl0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5zdGFsbChleHQ6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgY29tbWFuZHMsIHZhcmlhYmxlcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGV4dFsnX19rZXJuZWwnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdFeHRlbnNpb24gYXBwZWFycyB0byBoYXZlIGFscmVhZHkgYmVlbiBpbnN0YWxsZWQgaW50byB0aGlzIG9yIGFub3RoZXIgZ3JpZC4uLj8nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0WydfX2tlcm5lbCddID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGNtZHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOmNvbW1hbmRzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNtZHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb21tYW5kcy5kZWZpbmUoYy5uYW1lLCBjLmltcGwuYmluZChleHQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2YXJzID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2YXJpYWJsZXMnLCBleHQpIHx8IFtdO1xyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdmFycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhcmlhYmxlcy5kZWZpbmUodi5uYW1lLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXNbdi5rZXldOyB9KS5iaW5kKGV4dCksXHJcbiAgICAgICAgICAgICAgICBzZXQ6ICEhdi5tdXRhYmxlID8gKGZ1bmN0aW9uKHZhbCkgeyB0aGlzW3Yua2V5XSA9IHZhbDsgfSkuYmluZChleHQpIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRDb21tYW5kSHViXHJcbntcclxuICAgIHByaXZhdGUgc3RvcmU6T2JqZWN0TWFwPEdyaWRDb21tYW5kPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIGNvbW1hbmQgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGRlZmluZShjb21tYW5kOnN0cmluZywgaW1wbDpHcmlkQ29tbWFuZCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3JlW2NvbW1hbmRdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0NvbW1hbmQgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3JlW2NvbW1hbmRdID0gaW1wbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVzIHRoZSBzcGVjaWZpZWQgZ3JpZCBjb21tYW5kLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXhlYyhjb21tYW5kOnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVtjb21tYW5kXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgY29tbWFuZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsUm91dGluZUh1YkltcGwgaW1wbGVtZW50cyBHcmlkUm91dGluZUh1YlxyXG57XHJcbiAgICBwcml2YXRlIGhvb2tzOk9iamVjdE1hcDxHcmlkUm91dGluZUhvb2tbXT4gPSB7fTtcclxuICAgIHByaXZhdGUgb3ZlcnJpZGVzOk9iamVjdE1hcDxHcmlkUm91dGluZU92ZXJyaWRlPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGhvb2sgdG8gdGhlIHNwZWNpZmllZCBzaWduYWwgdGhhdCBlbmFibGVzIGV4dGVuc2lvbnMgdG8gb3ZlcnJpZGUgZ3JpZCBiZWhhdmlvclxyXG4gICAgICogZGVmaW5lZCBpbiB0aGUgY29yZSBvciBvdGhlciBleHRlbnNpb25zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaG9vayhyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6R3JpZFJvdXRpbmVIb29rKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmhvb2tzW3JvdXRpbmVdIHx8ICh0aGlzLmhvb2tzW3JvdXRpbmVdID0gW10pO1xyXG4gICAgICAgIGxpc3QucHVzaChjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG92ZXJyaWRlKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazpHcmlkUm91dGluZU92ZXJyaWRlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vdmVycmlkZXNbcm91dGluZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpZ25hbHMgdGhhdCBhIHJvdXRpbmUgaXMgYWJvdXQgdG8gcnVuIHRoYXQgY2FuIGJlIGhvb2tlZCBvciBvdmVycmlkZGVuIGJ5IGV4dGVuc2lvbnMuICBBcmd1bWVudHNcclxuICAgICAqIHNob3VsZCBiZSBzdXBwb3J0aW5nIGRhdGEgb3IgcmVsZXZhbnQgb2JqZWN0cyB0byB0aGUgcm91dGluZS4gIFRoZSB2YWx1ZSByZXR1cm5lZCB3aWxsIGJlIGB0cnVlYFxyXG4gICAgICogaWYgdGhlIHJvdXRpbmUgaGFzIGJlZW4gb3ZlcnJpZGRlbiBieSBhbiBleHRlbnNpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzaWduYWwocm91dGluZTpzdHJpbmcsIGFyZ3M6YW55W10sIGltcGw6RnVuY3Rpb24pOmFueVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3MoYGJlZm9yZToke3JvdXRpbmV9YCwgYXJncyk7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXJncy5wdXNoKGltcGwpO1xyXG4gICAgICAgICAgICBpbXBsID0gdGhpcy5vdmVycmlkZXNbcm91dGluZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gaW1wbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhyb3V0aW5lLCBhcmdzKTtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKGBhZnRlcjoke3JvdXRpbmV9YCwgYXJncyk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbnZva2VIb29rcyhyb3V0aW5lOnN0cmluZywgYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXTtcclxuXHJcbiAgICAgICAgaWYgKGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBob29rIG9mIGxpc3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGhvb2suYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwgaW1wbGVtZW50cyBHcmlkVmFyaWFibGVIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBzdG9yZTpPYmplY3RNYXA8R3JpZFZhcmlhYmxlPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZWZpbmUodmFyaWFibGU6c3RyaW5nLCBpbXBsOkdyaWRWYXJpYWJsZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3JlW3ZhcmlhYmxlXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdWYXJpYWJsZSB3aXRoIG5hbWUgYWxyZWFkeSByZWdpc3RlcmVkOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3JlW3ZhcmlhYmxlXSA9IGltcGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW3ZhcmlhYmxlXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbXBsLmdldCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldCh2YXJpYWJsZTpzdHJpbmcsIHZhbHVlOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVt2YXJpYWJsZV07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoaW1wbC5zZXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGltcGwuc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdDYW5ub3Qgc2V0IHJlYWRvbmx5IHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uL21pc2MvRG9tJztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgYmFzZSBpbnRlcmZhY2Ugb2YgYSB3aWRnZXQuICBBIHdpZGdldCBpcyBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgVUkgZWxlbWVudCB3aXRoaW4gdGhlIGNvbnRleHQgb2ZcclxuICogYSBncmlkLiAgSXQgY2FuIGJlIGNvbXBvc2VkIG9mIG9uZSBvciBtb3JlIERPTSBlbGVtZW50cyBhbmQgYmUgaW50ZXJhY3RhYmxlIG9yIHN0YXRpYy4gIFRoZSBXaWRnZXQgaW50ZXJmYWNlc1xyXG4gKiBwcm92aWRlcyBhIGNvbW1vbiBpbnRlcmZhY2UgdGhyb3VnaCB3aGljaCBtb2R1bGVzIG9yIGNvbnN1bWVycyBjYW4gYWNjZXNzIHRoZSB1bmRlcmx5aW5nIERPTSBlbGVtZW50cyBvZiBhIHdpZGdldFxyXG4gKiBhbmQgYmFzaWMgbWV0aG9kcyB0aGF0IGVhc2UgdGhlIG1hbmlwdWxhdGlvbiBvZiB3aWRnZXRzLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXaWRnZXRcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm9vdCBIVE1MRWxlbWVudCBvZiB0aGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSByb290OkhUTUxFbGVtZW50O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIFJlY3Qgb2JqZWN0IHRoYXQgZGVzY3JpYmVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBXaWRnZXQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSB2aWV3UmVjdDpSZWN0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZXMgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgaGlkZSgpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBzaG93KCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlzaWJsZVxyXG4gICAgICovXHJcbiAgICB0b2dnbGUodmlzaWJsZTpib29sZWFuKTp2b2lkO1xyXG59XHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYW4gYWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgV2lkZ2V0IGltcGxlbWVudGF0aW9ucyB0aGF0IGFyZSBleHBlY3RlZCB0byByZXByZXNlbnQgV2lkZ2V0cyB3aXRoXHJcbiAqIGFic29sdXRlbHkgcG9zaXRpb25lZCByb290IGVsZW1lbnRzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEFic1dpZGdldEJhc2U8VCBleHRlbmRzIEhUTUxFbGVtZW50PiBpbXBsZW1lbnRzIFdpZGdldFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcm9vdDpUKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIFJlY3Qgb2JqZWN0IHRoYXQgZGVzY3JpYmVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBXaWRnZXQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHZpZXdSZWN0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdFxyXG4gICAgICAgIChcclxuICAgICAgICAgICAgcGFyc2VJbnQodGhpcy5yb290LnN0eWxlLmxlZnQpLFxyXG4gICAgICAgICAgICBwYXJzZUludCh0aGlzLnJvb3Quc3R5bGUudG9wKSxcclxuICAgICAgICAgICAgdGhpcy5yb290LmNsaWVudFdpZHRoLFxyXG4gICAgICAgICAgICB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmVzIHRoZSBXaWRnZXQgdG8gdGhlIHNwZWNpZmllZCBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpZXdSZWN0XHJcbiAgICAgKiBAcGFyYW0gYW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ290byh2aWV3UmVjdDpSZWN0TGlrZSwgYXV0b1Nob3c6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoYXV0b1Nob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBEb20uc2hvdyh0aGlzLnJvb3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnJvb3QsIHtcclxuICAgICAgICAgICAgbGVmdDogYCR7dmlld1JlY3QubGVmdCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB0b3A6IGAke3ZpZXdSZWN0LnRvcCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dmlld1JlY3Qud2lkdGggKyAxfXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt2aWV3UmVjdC5oZWlnaHQgKyAxfXB4YCxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6IGBoaWRkZW5gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZXMgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhpZGUoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLmhpZGUodGhpcy5yb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzaG93KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIHRvZ2dsZSh2aXNpYmxlOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20udG9nZ2xlKHRoaXMucm9vdCwgdmlzaWJsZSlcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudFN1YnNjcmlwdGlvblxyXG57XHJcbiAgICBjYW5jZWwoKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50Q2FsbGJhY2tcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIG9uKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb247XHJcblxyXG4gICAgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZDtcclxuXHJcbiAgICBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuRXZlbnRUYXJnZXRcclxuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlckJhc2Vcclxue1xyXG4gICAgcHJpdmF0ZSBidWNrZXRzOmFueSA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpLnB1c2goY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7IGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgbGV0IGlkeCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjayk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2YgbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENhbGxiYWNrTGlzdChldmVudDpzdHJpbmcpOkV2ZW50Q2FsbGJhY2tbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldHNbZXZlbnRdIHx8ICh0aGlzLmJ1Y2tldHNbZXZlbnRdID0gW10pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRGVmYXVsdEdyaWRDb2x1bW4gfSBmcm9tICcuLi8uLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRSb3cgfSBmcm9tICcuLi8uLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRDb2x1bW4gfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBSZWN0LCBSZWN0TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG50eXBlIENlbGxDb2xSb3dMb29rdXAgPSBPYmplY3RJbmRleDxPYmplY3RJbmRleDxHcmlkQ2VsbD4+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTGF5b3V0UmVnaW9uPFQ+IGV4dGVuZHMgUmVjdExpa2Vcclxue1xyXG4gICAgcmVhZG9ubHkgcmVmOlQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkTGF5b3V0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY29tcHV0ZShtb2RlbDpHcmlkTW9kZWwpOkdyaWRMYXlvdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29sTG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRDb2x1bW4+Pm1vZGVsLmNvbHVtbnMucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCByb3dMb29rdXAgPSA8T2JqZWN0SW5kZXg8R3JpZFJvdz4+bW9kZWwucm93cy5yZWR1Y2UoKHQsIHgpID0+IHsgdFt4LnJlZl0gPSB4OyByZXR1cm4gdCB9LCB7fSk7XHJcbiAgICAgICAgbGV0IGNlbGxMb29rdXAgPSBidWlsZENlbGxMb29rdXAobW9kZWwuY2VsbHMpOyAvL2J5IGNvbCB0aGVuIHJvd1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIGFsbCBleHBlY3RlZCBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgbGV0IG1heENvbCA9IG1vZGVsLmNlbGxzLm1hcCh4ID0+IHguY29sUmVmICsgKHguY29sU3BhbiAtIDEpKS5yZWR1Y2UoKHQsIHgpID0+IHQgPiB4ID8gdCA6IHgsIDApO1xyXG4gICAgICAgIGxldCBtYXhSb3cgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJvd1JlZiArICh4LnJvd1NwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbWlzc2luZyBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Q29sOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAoY29sTG9va3VwW2ldIHx8IChjb2xMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRDb2x1bW4oaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Um93OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAocm93TG9va3VwW2ldIHx8IChyb3dMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRSb3coaSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgd2lkdGggYW5kIGhlaWdodCBvZiB3aG9sZSBncmlkXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy52YWx1ZXMoY29sTG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LndpZHRoLCAwKTtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gXy52YWx1ZXMocm93TG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LmhlaWdodCwgMCk7XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGxheW91dCByZWdpb25zIGZvciB0aGUgdmFyaW91cyBiaXRzXHJcbiAgICAgICAgbGV0IGNvbFJlZ3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10gPSBbXTtcclxuICAgICAgICBsZXQgcm93UmVnczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSA9IFtdO1xyXG4gICAgICAgIGxldCBjZWxsUmVnczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgYWNjTGVmdCA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgY2kgPSAwOyBjaSA8PSBtYXhDb2w7IGNpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY29sID0gY29sTG9va3VwW2NpXTtcclxuXHJcbiAgICAgICAgICAgIGNvbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByZWY6IGNvbC5yZWYsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGNvbC53aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhY2NUb3AgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCByaSA9IDA7IHJpIDw9IG1heFJvdzsgcmkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJvdyA9IHJvd0xvb2t1cFtyaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvd1JlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogcm93LnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByb3cuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjZWxsTG9va3VwW2NpXSAhPT0gdW5kZWZpbmVkICYmIGNlbGxMb29rdXBbY2ldW3JpXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjZWxsID0gY2VsbExvb2t1cFtjaV1bcmldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjZWxsUmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiBjZWxsLnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm93LmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhY2NUb3AgKz0gcm93LmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWNjTGVmdCArPSBjb2wud2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRMYXlvdXQod2lkdGgsIGhlaWdodCwgY29sUmVncywgcm93UmVncywgY2VsbFJlZ3MsIGNlbGxMb29rdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSB3aWR0aDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBjb2x1bW5zOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VsbHM6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W107XHJcblxyXG4gICAgcHJpdmF0ZSBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXA7XHJcbiAgICBwcml2YXRlIGNvbHVtbkluZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIHJvd0luZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIGNlbGxJbmRleDpPYmplY3RNYXA8R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+PjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHdpZHRoOm51bWJlciwgXHJcbiAgICAgICAgaGVpZ2h0Om51bWJlciwgXHJcbiAgICAgICAgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdLFxyXG4gICAgICAgIGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdLFxyXG4gICAgICAgIGNlbGxMb29rdXA6Q2VsbENvbFJvd0xvb2t1cClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuXHJcbiAgICAgICAgdGhpcy5jZWxsTG9va3VwID0gY2VsbExvb2t1cDtcclxuICAgICAgICB0aGlzLmNvbHVtbkluZGV4ID0gXy5pbmRleChjb2x1bW5zLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLnJvd0luZGV4ID0gXy5pbmRleChyb3dzLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLmNlbGxJbmRleCA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNvbHVtbihyZWY6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbkluZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlSb3cocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Q2VsbChyZWY6c3RyaW5nKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVDb2x1bW5zKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZVJvd3MocmVnaW9uOlJlY3RMaWtlKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IFJlY3QucHJvdG90eXBlLmludGVyc2VjdHMuY2FsbCh4LCByZWdpb24pKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ2VsbHMocmVnaW9uOlJlY3RMaWtlKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjb2xzID0gdGhpcy5jYXB0dXJlQ29sdW1ucyhyZWdpb24pO1xyXG4gICAgICAgIGxldCByb3dzID0gdGhpcy5jYXB0dXJlUm93cyhyZWdpb24pO1xyXG4gICAgICAgIGxldCBjZWxscyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY29scylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgb2Ygcm93cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmNlbGxMb29rdXBbY11bcl07XHJcbiAgICAgICAgICAgICAgICBpZiAoISFjZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxzLnB1c2goY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2VsbHM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQ2VsbExvb2t1cChjZWxsczpHcmlkQ2VsbFtdKTpDZWxsQ29sUm93TG9va3VwXHJcbntcclxuICAgIGxldCBpeCA9IHt9O1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBjaXggPSBpeFtjLmNvbFJlZl0gfHwgKGl4W2MuY29sUmVmXSA9IHt9KTtcclxuICAgICAgICBjaXhbYy5yb3dSZWZdID0gYztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGl4O1xyXG59IiwiLyoqXHJcbiAqIEVtYmVkZGluZyBvZiBDbGlwYm9hcmQuanMgLSBodHRwczovL2dpdGh1Yi5jb20vemVub3JvY2hhL2NsaXBib2FyZC5qcy9cclxuICpcclxuICogQWZ0ZXIgdmFyaW91cyBhdHRlbXB0cywgSSB3YXMgdW5hYmxlIHRvIG5wbSBpbnN0YWxsIGluY2x1ZGluZyB0eXBlcyBlZmZlY3RpdmVseSBhbmQgYmVjYXVzZSBhbiBpbmRleC5qcyBpcyBub3RcclxuICogdXNlZCBJIGNhbm5vdCB1c2UgdGhlIFR5cGVTY3JpcHQgMi4xIHVua25vd24gbW9kdWxlIGltcG9ydCwgc28gcmVzb3J0aW5nIHRvIGxvY2FsIGVtYmVkZGVkIHZlcnNpb24uICBXaWxsIHJlbW92ZVxyXG4gKiBpbiB0aGUgZnV0dXJlIGlmIHBvc3NpYmxlLlxyXG4gKlxyXG4gKiBNb2RpZmljYXRpb25zIGhhdmUgYmVlbiBtYWRlIHRvIG1ha2UgdGhlIGNvZGUgY29tcGlsZTpcclxuICogLSBSZW1vdmVkIFByb21pc2UgcG9seWZpbGwgKGltcG9ydGVkIGluc3RlYWQpXHJcbiAqIC0gUmVzdHJ1Y3R1cmVkIGV4cG9ydCBhbmQgYWRkZWQgdHlwZWQgaW50ZXJmYWNlXHJcbiAqIC0gU29tZSBjaGFuZ2VzIHRvIHByZXZlbnQgdHlwZSBjaGVja2luZyB3aGVyZSB1bmRlc2lyZWRcclxuICovXHJcblxyXG5pbXBvcnQgeyBQcm9taXNlIH0gZnJvbSAnZXM2LXByb21pc2UnO1xyXG5cclxuLy9EZWNsYXJlIHdpbmRvdyBhcyBhbiBhbnkgdmFyIGFsaWFzIHRvIHByZXZlbnQgVFMgbW9hbmluZy4uLlxyXG5sZXQgd25kID0gd2luZG93IGFzIGFueTtcclxuXHJcbmNvbnN0IGNsaXBib2FyZCA9IHt9IGFzIGFueTtcclxuXHJcbmNsaXBib2FyZC5jb3B5ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgIHZhciBfZGF0YSA9IG51bGw7IC8vIE1hcCBmcm9tIGRhdGEgdHlwZSAoZS5nLiBcInRleHQvaHRtbFwiKSB0byB2YWx1ZS5cclxuICAgIHZhciBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xyXG4gICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICBfZGF0YSA9IG51bGw7XHJcbiAgICAgICAgaWYgKF9ib2d1c1NlbGVjdGlvbikge1xyXG4gICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjb3B5XCIsIGZ1bmN0aW9uKGU6Q2xpcGJvYXJkRXZlbnQpIHtcclxuICAgICAgICBpZiAoX2ludGVyY2VwdCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKGtleSwgX2RhdGFba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdvcmthcm91bmQgZm9yIFNhZmFyaTogaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE1NjUyOVxyXG4gICAgZnVuY3Rpb24gYm9ndXNTZWxlY3QoKSB7XHJcbiAgICAgICAgdmFyIHNlbCA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgIC8vIElmIFwibm90aGluZ1wiIGlzIHNlbGVjdGVkLi4uXHJcbiAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeUNvbW1hbmRFbmFibGVkKFwiY29weVwiKSAmJiBzZWwuaXNDb2xsYXBzZWQpIHtcclxuICAgICAgICAgICAgLy8gLi4uIHRlbXBvcmFyaWx5IHNlbGVjdCB0aGUgZW50aXJlIGJvZHkuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFdlIHNlbGVjdCB0aGUgZW50aXJlIGJvZHkgYmVjYXVzZTpcclxuICAgICAgICAgICAgLy8gLSBpdCdzIGd1YXJhbnRlZWQgdG8gZXhpc3QsXHJcbiAgICAgICAgICAgIC8vIC0gaXQgd29ya3MgKHVubGlrZSwgc2F5LCBkb2N1bWVudC5oZWFkLCBvciBwaGFudG9tIGVsZW1lbnQgdGhhdCBpc1xyXG4gICAgICAgICAgICAvLyAgIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET00pLFxyXG4gICAgICAgICAgICAvLyAtIGl0IGRvZXNuJ3Qgc2VlbSB0byBmbGlja2VyIChkdWUgdG8gdGhlIHN5bmNocm9ub3VzIGNvcHkgZXZlbnQpLCBhbmRcclxuICAgICAgICAgICAgLy8gLSBpdCBhdm9pZHMgbW9kaWZ5aW5nIHRoZSBET00gKGNhbiB0cmlnZ2VyIG11dGF0aW9uIG9ic2VydmVycykuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2Ugd2UgY2FuJ3QgZG8gcHJvcGVyIGZlYXR1cmUgZGV0ZWN0aW9uICh3ZSBhbHJlYWR5IGNoZWNrZWRcclxuICAgICAgICAgICAgLy8gZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgLCB3aGljaCBhY3R1YWxseSBnaXZlcyBhIGZhbHNlXHJcbiAgICAgICAgICAgIC8vIG5lZ2F0aXZlIGZvciBCbGluayB3aGVuIG5vdGhpbmcgaXMgc2VsZWN0ZWQpIGFuZCBVQSBzbmlmZmluZyBpcyBub3RcclxuICAgICAgICAgICAgLy8gcmVsaWFibGUgKGEgbG90IG9mIFVBIHN0cmluZ3MgY29udGFpbiBcIlNhZmFyaVwiKSwgdGhpcyB3aWxsIGFsc29cclxuICAgICAgICAgICAgLy8gaGFwcGVuIGZvciBzb21lIGJyb3dzZXJzIG90aGVyIHRoYW4gU2FmYXJpLiA6LSgpXHJcbiAgICAgICAgICAgIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XHJcbiAgICAgICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhkb2N1bWVudC5ib2R5KTtcclxuICAgICAgICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcclxuICAgICAgICAgICAgX2JvZ3VzU2VsZWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IHtcInRleHQvcGxhaW5cIjogZGF0YX07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0ge1widGV4dC9odG1sXCI6IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoZGF0YSl9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBib2d1c1NlbGVjdCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiY29weVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRvY3VtZW50LmV4ZWNDb21tYW5kIGlzIHN5bmNocm9ub3VzOiBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELWNsaXBib2FyZC1hcGlzLTIwMTUwNDIxLyNpbnRlZ3JhdGlvbi13aXRoLXJpY2gtdGV4dC1lZGl0aW5nLWFwaXNcclxuICAgICAgICAgICAgICAgICAgICAvLyBTbyB3ZSBjYW4gY2FsbCByZXNvbHZlUmVmKCkgYmFjayBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY29weS4gUGVyaGFwcyBpdCdzIG5vdCBhdmFpbGFibGUgaW4geW91ciBicm93c2VyP1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuY2xpcGJvYXJkLnBhc3RlID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgIHZhciBfcmVzb2x2ZTtcclxuICAgIHZhciBfZGF0YVR5cGU7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIGZ1bmN0aW9uKGU6Q2xpcGJvYXJkRXZlbnQpIHtcclxuICAgICAgICBpZiAoX2ludGVyY2VwdCkge1xyXG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdmFyIHJlc29sdmUgPSBfcmVzb2x2ZTtcclxuICAgICAgICAgICAgX3Jlc29sdmUgPSBudWxsO1xyXG4gICAgICAgICAgICByZXNvbHZlKGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKF9kYXRhVHlwZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIF9yZXNvbHZlID0gcmVzb2x2ZTtcclxuICAgICAgICAgICAgX2RhdGFUeXBlID0gZGF0YVR5cGUgfHwgXCJ0ZXh0L3BsYWluXCI7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRvY3VtZW50LmV4ZWNDb21tYW5kKFwicGFzdGVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlVuYWJsZSB0byBwYXN0ZS4gUGFzdGluZyBvbmx5IHdvcmtzIGluIEludGVybmV0IEV4cGxvcmVyIGF0IHRoZSBtb21lbnQuXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG4vLyBIYW5kbGUgSUUgYmVoYXZpb3VyLlxyXG5pZiAodHlwZW9mIENsaXBib2FyZEV2ZW50ID09PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgIHR5cGVvZiB3bmQuY2xpcGJvYXJkRGF0YS5zZXREYXRhICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcblxyXG4gICAgY2xpcGJvYXJkLmNvcHkgPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICAvLyBJRSBzdXBwb3J0cyBzdHJpbmcgYW5kIFVSTCB0eXBlczogaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzNjc0NCh2PXZzLjg1KS5hc3B4XHJcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgc3VwcG9ydCB0aGUgc3RyaW5nIHR5cGUgZm9yIG5vdy5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiICYmICEoXCJ0ZXh0L3BsYWluXCIgaW4gZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IHByb3ZpZGUgYSB0ZXh0L3BsYWluIHR5cGUuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9ICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGRhdGEgOiBkYXRhW1widGV4dC9wbGFpblwiXSk7XHJcbiAgICAgICAgICAgIHZhciBjb3B5U3VjY2VlZGVkID0gd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YShcIlRleHRcIiwgc3RyRGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChjb3B5U3VjY2VlZGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiQ29weWluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbGlwYm9hcmQucGFzdGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJEYXRhID0gd25kLmNsaXBib2FyZERhdGEuZ2V0RGF0YShcIlRleHRcIik7XHJcbiAgICAgICAgICAgIGlmIChzdHJEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHN0ckRhdGEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIHVzZXIgcmVqZWN0ZWQgdGhlIHBhc3RlIHJlcXVlc3QuXHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUGFzdGluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDbGlwYm9hcmRPYmplY3Rcclxue1xyXG4gICAgY29weSh2YWw6c3RyaW5nfEVsZW1lbnQpOlByb21pc2U8dm9pZD47XHJcbiAgICBwYXN0ZSgpOlByb21pc2U8c3RyaW5nPjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IENsaXBib2FyZCA9IGNsaXBib2FyZDsiXX0=
