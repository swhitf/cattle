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
var StyledGridCell_1 = require("../model/styled/StyledGridCell");
var ExampleGridBuilder = (function () {
    function ExampleGridBuilder(lines, cols, style) {
        if (lines === void 0) { lines = 100; }
        if (cols === void 0) { cols = 52; }
        this.lines = lines;
        this.cols = cols;
        this.style = style;
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
        cells.push(new StyledGridCell_1.StyledGridCell({
            colRef: 0,
            rowRef: 0,
            value: '+',
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new StyledGridCell_1.StyledGridCell({
                colRef: i + 1,
                rowRef: 0,
                value: 'Vertical #' + (i + 1),
            }));
        }
    };
    ExampleGridBuilder.prototype.createResourceRow = function (cells, line) {
        cells.push(new StyledGridCell_1.StyledGridCell({
            colRef: 0,
            rowRef: line + 1,
            value: "Horizontal #" + line,
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new StyledGridCell_1.StyledGridCell({
                colRef: i + 1,
                rowRef: line + 1,
                value: (line + i).toString(),
                style: this.style,
                placeholder: '-'
            }));
        }
    };
    return ExampleGridBuilder;
}());
exports.ExampleGridBuilder = ExampleGridBuilder;
},{"../model/default/DefaultGridModel":47,"../model/styled/StyledGridCell":50}],16:[function(require,module,exports){
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
var Style_1 = require("../model/styled/Style");
//let builder:any = new FlexGridBuilder(1, 1);
//builder = new FlexGridBuilder(52 * 5, 250);
var builder = new ExampleGridBuilder_1.ExampleGridBuilder(100, 52, new Style_1.Style(Style_1.BaseStyle, {
    textAlignment: 'right'
}));
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
},{"../extensions/ClipboardExtension":17,"../extensions/ComputeExtension":18,"../extensions/EditingExtension":19,"../extensions/HistoryExtension":20,"../extensions/PanExtension":21,"../extensions/ScrollerExtension":22,"../extensions/SelectorExtension":23,"../model/styled/Style":49,"../ui/GridElement":52,"./ExampleGridBuilder":15}],17:[function(require,module,exports){
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
},{"../geom/Point":24,"../geom/Rect":25,"../input/KeyInput":30,"../misc/Dom":36,"../misc/Util":38,"../model/GridRange":43,"../ui/Extensibility":51,"../ui/Widget":54,"../vendor/clipboard":57,"papaparse":2,"tether":14}],18:[function(require,module,exports){
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
},{"../geom/Point":24,"../input/KeyInput":30,"../input/MouseInput":35,"../misc/Dom":36,"../misc/Util":38,"../ui/Extensibility":51,"../ui/Widget":54,"tether":14}],20:[function(require,module,exports){
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
},{"../input/KeyInput":30,"../misc/Util":38,"../ui/Extensibility":51}],21:[function(require,module,exports){
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
},{"../geom/Point":24,"../geom/Rect":25,"../input/KeyInput":30,"../input/MouseDragEventSupport":33,"../input/MouseInput":35,"../misc/Dom":36,"../ui/Extensibility":51,"../ui/Widget":54,"tether":14}],24:[function(require,module,exports){
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _ = require("../../misc/Util");
var shortid = require("shortid");
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
        params.ref = params.ref || shortid.generate();
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
},{"../../misc/Util":38,"../../ui/Extensibility":51,"shortid":5}],46:[function(require,module,exports){
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
},{"../../misc/Util":38,"./DefaultGridCell":45}],48:[function(require,module,exports){
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
},{"../../misc/Util":38}],50:[function(require,module,exports){
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
    if (style.textAlignment === 'center') {
        textPt.x = visual.width / 2;
    }
    if (style.textAlignment === 'right') {
        textPt.x = visual.width - 3;
    }
    gfx.font = style.textSize + "px " + style.textFont;
    gfx.textAlign = style.textAlignment;
    gfx.textBaseline = 'middle';
    gfx.fillStyle = style.textColor;
    gfx.fillText(visual.value || visual.placeholder, textPt.x, textPt.y);
}
},{"../../geom/Point":24,"../../ui/Extensibility":51,"../default/DefaultGridCell":45,"./Style":49}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
    GridElement.create = function (target, initialModel) {
        var canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className = ' grid';
        canvas.tabIndex = 0;
        canvas.width = target.clientWidth;
        canvas.height = target.clientHeight;
        target.parentNode.insertBefore(canvas, target);
        target.remove();
        var grid = new GridElement(canvas);
        grid.model = initialModel || DefaultGridModel_1.DefaultGridModel.dim(26, 100);
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
},{"../geom/Point":24,"../geom/Rect":25,"../misc/Property":37,"../misc/Util":38,"../model/default/DefaultGridModel":47,"./GridKernel":53,"./internal/EventEmitter":55,"./internal/GridLayout":56}],53:[function(require,module,exports){
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
},{}],54:[function(require,module,exports){
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
},{"../geom/Rect":25,"../misc/Dom":36}],55:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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
},{"../../geom/Rect":25,"../../misc/Util":38,"../../model/default/DefaultGridColumn":46,"../../model/default/DefaultGridRow":48}],57:[function(require,module,exports){
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
},{"es6-promise":1}]},{},[4,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,45,46,47,48,40,41,42,43,44,49,50,51,52,53,55,56,54,57])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWZsZWN0LW1ldGFkYXRhL3RlbXAvUmVmbGVjdC5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2FscGhhYmV0LmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2xpYi9lbmNvZGUuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvaXMtdmFsaWQuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvcmFuZG9tL3JhbmRvbS1ieXRlLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvcmFuZG9tL3JhbmRvbS1mcm9tLXNlZWQuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvdXRpbC9jbHVzdGVyLXdvcmtlci1pZC1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RldGhlci9kaXN0L2pzL3RldGhlci5qcyIsInNyYy9fZXhhbXBsZS9FeGFtcGxlR3JpZEJ1aWxkZXIudHMiLCJzcmMvX2V4YW1wbGUvbWFpbi50cyIsInNyYy9leHRlbnNpb25zL0NsaXBib2FyZEV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL0NvbXB1dGVFeHRlbnNpb24udHMiLCJzcmMvZXh0ZW5zaW9ucy9FZGl0aW5nRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvSGlzdG9yeUV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL1BhbkV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL1Njcm9sbGVyRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvU2VsZWN0b3JFeHRlbnNpb24udHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvZ2xvYmFsLmQudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qcm9wZXJ0eS50cyIsInNyYy9taXNjL1V0aWwudHMiLCJzcmMvbWlzYy91dGlsLnRzIiwic3JjL21vZGVsL0dyaWRSYW5nZS50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uLnRzIiwic3JjL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbC50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93LnRzIiwic3JjL21vZGVsL3N0eWxlZC9TdHlsZS50cyIsInNyYy9tb2RlbC9zdHlsZWQvU3R5bGVkR3JpZENlbGwudHMiLCJzcmMvdWkvRXh0ZW5zaWJpbGl0eS50cyIsInNyYy91aS9HcmlkRWxlbWVudC50cyIsInNyYy91aS9HcmlkS2VybmVsLnRzIiwic3JjL3VpL1dpZGdldC50cyIsInNyYy91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXIudHMiLCJzcmMvdWkvaW50ZXJuYWwvR3JpZExheW91dC50cyIsInNyYy92ZW5kb3IvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwb0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNybUNBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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TyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlCLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssYUFBYSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssYUFBYSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMs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Q0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQVFZLFFBQUEsU0FBUyxHQUFHLFNBQVMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3RlZmFucGVubmVyL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIDQuMC41XG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICAoZ2xvYmFsLkVTNlByb21pc2UgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oeCkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG59XG5cbnZhciBfaXNBcnJheSA9IHVuZGVmaW5lZDtcbmlmICghQXJyYXkuaXNBcnJheSkge1xuICBfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcbn0gZWxzZSB7XG4gIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbn1cblxudmFyIGlzQXJyYXkgPSBfaXNBcnJheTtcblxudmFyIGxlbiA9IDA7XG52YXIgdmVydHhOZXh0ID0gdW5kZWZpbmVkO1xudmFyIGN1c3RvbVNjaGVkdWxlckZuID0gdW5kZWZpbmVkO1xuXG52YXIgYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICBxdWV1ZVtsZW5dID0gY2FsbGJhY2s7XG4gIHF1ZXVlW2xlbiArIDFdID0gYXJnO1xuICBsZW4gKz0gMjtcbiAgaWYgKGxlbiA9PT0gMikge1xuICAgIC8vIElmIGxlbiBpcyAyLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICBpZiAoY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgIGN1c3RvbVNjaGVkdWxlckZuKGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xufVxuXG5mdW5jdGlvbiBzZXRBc2FwKGFzYXBGbikge1xuICBhc2FwID0gYXNhcEZuO1xufVxuXG52YXIgYnJvd3NlcldpbmRvdyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkO1xudmFyIGJyb3dzZXJHbG9iYWwgPSBicm93c2VyV2luZG93IHx8IHt9O1xudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbnZhciBpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICh7fSkudG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4vLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxudmFyIGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuLy8gbm9kZVxuZnVuY3Rpb24gdXNlTmV4dFRpY2soKSB7XG4gIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2N1am9qcy93aGVuL2lzc3Vlcy80MTAgZm9yIGRldGFpbHNcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gIH07XG59XG5cbi8vIHZlcnR4XG5mdW5jdGlvbiB1c2VWZXJ0eFRpbWVyKCkge1xuICBpZiAodHlwZW9mIHZlcnR4TmV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmVydHhOZXh0KGZsdXNoKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBub2RlLmRhdGEgPSBpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMjtcbiAgfTtcbn1cblxuLy8gd2ViIHdvcmtlclxuZnVuY3Rpb24gdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZVNldFRpbWVvdXQoKSB7XG4gIC8vIFN0b3JlIHNldFRpbWVvdXQgcmVmZXJlbmNlIHNvIGVzNi1wcm9taXNlIHdpbGwgYmUgdW5hZmZlY3RlZCBieVxuICAvLyBvdGhlciBjb2RlIG1vZGlmeWluZyBzZXRUaW1lb3V0IChsaWtlIHNpbm9uLnVzZUZha2VUaW1lcnMoKSlcbiAgdmFyIGdsb2JhbFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBnbG9iYWxTZXRUaW1lb3V0KGZsdXNoLCAxKTtcbiAgfTtcbn1cblxudmFyIHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBxdWV1ZVtpXTtcbiAgICB2YXIgYXJnID0gcXVldWVbaSArIDFdO1xuXG4gICAgY2FsbGJhY2soYXJnKTtcblxuICAgIHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgIHF1ZXVlW2kgKyAxXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGxlbiA9IDA7XG59XG5cbmZ1bmN0aW9uIGF0dGVtcHRWZXJ0eCgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICB2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgIHJldHVybiB1c2VWZXJ0eFRpbWVyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xuICB9XG59XG5cbnZhciBzY2hlZHVsZUZsdXNoID0gdW5kZWZpbmVkO1xuLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbmlmIChpc05vZGUpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG59IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG59IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNZXNzYWdlQ2hhbm5lbCgpO1xufSBlbHNlIGlmIChicm93c2VyV2luZG93ID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IGF0dGVtcHRWZXJ0eCgpO1xufSBlbHNlIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdGhlbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcblxuICB2YXIgcGFyZW50ID0gdGhpcztcblxuICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoY2hpbGRbUFJPTUlTRV9JRF0gPT09IHVuZGVmaW5lZCkge1xuICAgIG1ha2VQcm9taXNlKGNoaWxkKTtcbiAgfVxuXG4gIHZhciBfc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gIGlmIChfc3RhdGUpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNhbGxiYWNrID0gX2FyZ3VtZW50c1tfc3RhdGUgLSAxXTtcbiAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaW52b2tlQ2FsbGJhY2soX3N0YXRlLCBjaGlsZCwgY2FsbGJhY2ssIHBhcmVudC5fcmVzdWx0KTtcbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH0gZWxzZSB7XG4gICAgc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgfVxuXG4gIHJldHVybiBjaGlsZDtcbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlc29sdmVgIHJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgcmVzb2x2ZWQgd2l0aCB0aGVcbiAgcGFzc2VkIGB2YWx1ZWAuIEl0IGlzIHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZXNvbHZlKDEpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgxKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIHZhbHVlID09PSAxXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlc29sdmVcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gdmFsdWUgdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlc29sdmVkIHdpdGhcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSBmdWxmaWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgYHZhbHVlYFxuKi9cbmZ1bmN0aW9uIHJlc29sdmUob2JqZWN0KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IENvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVzb2x2ZShwcm9taXNlLCBvYmplY3QpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxudmFyIFBST01JU0VfSUQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMTYpO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxudmFyIFBFTkRJTkcgPSB2b2lkIDA7XG52YXIgRlVMRklMTEVEID0gMTtcbnZhciBSRUpFQ1RFRCA9IDI7XG5cbnZhciBHRVRfVEhFTl9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiBzZWxmRnVsZmlsbG1lbnQoKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbn1cblxuZnVuY3Rpb24gY2Fubm90UmV0dXJuT3duKCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xufVxuXG5mdW5jdGlvbiBnZXRUaGVuKHByb21pc2UpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgcmV0dXJuIEdFVF9USEVOX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICB0cnkge1xuICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICBhc2FwKGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgIHZhciBlcnJvciA9IHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBpZiAoc2VhbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9XG4gIH0sIHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBGVUxGSUxMRUQpIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gUkVKRUNURUQpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4kJCkge1xuICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3RvciAmJiB0aGVuJCQgPT09IHRoZW4gJiYgbWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3Rvci5yZXNvbHZlID09PSByZXNvbHZlKSB7XG4gICAgaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoZW4kJCA9PT0gR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgIH0gZWxzZSBpZiAodGhlbiQkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoZW4kJCkpIHtcbiAgICAgIGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuJCQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICBfcmVqZWN0KHByb21pc2UsIHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgfSBlbHNlIGlmIChvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUsIGdldFRoZW4odmFsdWUpKTtcbiAgfSBlbHNlIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gIH1cblxuICBwdWJsaXNoKHByb21pc2UpO1xufVxuXG5mdW5jdGlvbiBmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHByb21pc2UuX3Jlc3VsdCA9IHZhbHVlO1xuICBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRDtcblxuICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgYXNhcChwdWJsaXNoLCBwcm9taXNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gIGFzYXAocHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX3N1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgdmFyIGxlbmd0aCA9IF9zdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgcGFyZW50Ll9vbmVycm9yID0gbnVsbDtcblxuICBfc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBfc3Vic2NyaWJlcnNbbGVuZ3RoICsgRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gIF9zdWJzY3JpYmVyc1tsZW5ndGggKyBSRUpFQ1RFRF0gPSBvblJlamVjdGlvbjtcblxuICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICBhc2FwKHB1Ymxpc2gsIHBhcmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaChwcm9taXNlKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICB2YXIgc2V0dGxlZCA9IHByb21pc2UuX3N0YXRlO1xuXG4gIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2hpbGQgPSB1bmRlZmluZWQsXG4gICAgICBjYWxsYmFjayA9IHVuZGVmaW5lZCxcbiAgICAgIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgIGlmIChjaGlsZCkge1xuICAgICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgIH1cbiAgfVxuXG4gIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG59XG5cbmZ1bmN0aW9uIEVycm9yT2JqZWN0KCkge1xuICB0aGlzLmVycm9yID0gbnVsbDtcbn1cblxudmFyIFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBFcnJvck9iamVjdCgpO1xuXG5mdW5jdGlvbiB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgIHJldHVybiBUUllfQ0FUQ0hfRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICB2YXIgaGFzQ2FsbGJhY2sgPSBpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkLFxuICAgICAgZXJyb3IgPSB1bmRlZmluZWQsXG4gICAgICBzdWNjZWVkZWQgPSB1bmRlZmluZWQsXG4gICAgICBmYWlsZWQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgdmFsdWUgPSB0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgZXJyb3IgPSB2YWx1ZS5lcnJvcjtcbiAgICAgIHZhbHVlID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgLy8gbm9vcFxuICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgX3Jlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IEZVTEZJTExFRCkge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICB0cnkge1xuICAgIHJlc29sdmVyKGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKSB7XG4gICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIF9yZWplY3QocHJvbWlzZSwgZSk7XG4gIH1cbn1cblxudmFyIGlkID0gMDtcbmZ1bmN0aW9uIG5leHRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbmZ1bmN0aW9uIG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgcHJvbWlzZVtQUk9NSVNFX0lEXSA9IGlkKys7XG4gIHByb21pc2UuX3N0YXRlID0gdW5kZWZpbmVkO1xuICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gIHByb21pc2UuX3N1YnNjcmliZXJzID0gW107XG59XG5cbmZ1bmN0aW9uIEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgdGhpcy5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuXG4gIGlmICghdGhpcy5wcm9taXNlW1BST01JU0VfSURdKSB7XG4gICAgbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgfVxuXG4gIGlmIChpc0FycmF5KGlucHV0KSkge1xuICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5sZW5ndGggPSBpbnB1dC5sZW5ndGg7XG4gICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcblxuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGggfHwgMDtcbiAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgaWYgKHRoaXMuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgX3JlamVjdCh0aGlzLnByb21pc2UsIHZhbGlkYXRpb25FcnJvcigpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICB2YXIgX2lucHV0ID0gdGhpcy5faW5wdXQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IHRoaXMuX3N0YXRlID09PSBQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHRoaXMuX2VhY2hFbnRyeShfaW5wdXRbaV0sIGkpO1xuICB9XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24gKGVudHJ5LCBpKSB7XG4gIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgdmFyIHJlc29sdmUkJCA9IGMucmVzb2x2ZTtcblxuICBpZiAocmVzb2x2ZSQkID09PSByZXNvbHZlKSB7XG4gICAgdmFyIF90aGVuID0gZ2V0VGhlbihlbnRyeSk7XG5cbiAgICBpZiAoX3RoZW4gPT09IHRoZW4gJiYgZW50cnkuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgICB0aGlzLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fcmVtYWluaW5nLS07XG4gICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICB9IGVsc2UgaWYgKGMgPT09IFByb21pc2UpIHtcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobm9vcCk7XG4gICAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIGVudHJ5LCBfdGhlbik7XG4gICAgICB0aGlzLl93aWxsU2V0dGxlQXQocHJvbWlzZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbiAocmVzb2x2ZSQkKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlJCQoZW50cnkpO1xuICAgICAgfSksIGkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl93aWxsU2V0dGxlQXQocmVzb2x2ZSQkKGVudHJ5KSwgaSk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbiAoc3RhdGUsIGksIHZhbHVlKSB7XG4gIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuXG4gIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gUEVORElORykge1xuICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICBmdWxmaWxsKHByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbiAocHJvbWlzZSwgaSkge1xuICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIGVudW1lcmF0b3IuX3NldHRsZWRBdChGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoUkVKRUNURUQsIGksIHJlYXNvbik7XG4gIH0pO1xufTtcblxuLyoqXG4gIGBQcm9taXNlLmFsbGAgYWNjZXB0cyBhbiBhcnJheSBvZiBwcm9taXNlcywgYW5kIHJldHVybnMgYSBuZXcgcHJvbWlzZSB3aGljaFxuICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSBvZiBmdWxmaWxsbWVudCB2YWx1ZXMgZm9yIHRoZSBwYXNzZWQgcHJvbWlzZXMsIG9yXG4gIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiBvZiB0aGUgZmlyc3QgcGFzc2VkIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQuIEl0IGNhc3RzIGFsbFxuICBlbGVtZW50cyBvZiB0aGUgcGFzc2VkIGl0ZXJhYmxlIHRvIHByb21pc2VzIGFzIGl0IHJ1bnMgdGhpcyBhbGdvcml0aG0uXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlc29sdmUoMik7XG4gIGxldCBwcm9taXNlMyA9IHJlc29sdmUoMyk7XG4gIGxldCBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBUaGUgYXJyYXkgaGVyZSB3b3VsZCBiZSBbIDEsIDIsIDMgXTtcbiAgfSk7XG4gIGBgYFxuXG4gIElmIGFueSBvZiB0aGUgYHByb21pc2VzYCBnaXZlbiB0byBgYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gIHRoYXQgaXMgcmVqZWN0ZWQgd2lsbCBiZSBnaXZlbiBhcyBhbiBhcmd1bWVudCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZXMnc1xuICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlamVjdChuZXcgRXJyb3IoXCIyXCIpKTtcbiAgbGV0IHByb21pc2UzID0gcmVqZWN0KG5ldyBFcnJvcihcIjNcIikpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgYWxsXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBcnJheX0gZW50cmllcyBhcnJheSBvZiBwcm9taXNlc1xuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBsYWJlbGluZyB0aGUgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuICBAc3RhdGljXG4qL1xuZnVuY3Rpb24gYWxsKGVudHJpZXMpIHtcbiAgcmV0dXJuIG5ldyBFbnVtZXJhdG9yKHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yYWNlYCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2ggaXMgc2V0dGxlZCBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlXG4gIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIHNldHRsZS5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHJlc3VsdCA9PT0gJ3Byb21pc2UgMicgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFByb21pc2UucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdFxuICBzZXR0bGVkIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlXG4gIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IHNldHRsZWQgcHJvbWlzZSBoYXNcbiAgYmVjb21lIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gIHByb21pc2Ugd2lsbCBiZWNvbWUgcmVqZWN0ZWQ6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMScpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIGxldCBwcm9taXNlMiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcigncHJvbWlzZSAyJykpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICB9KTtcbiAgYGBgXG5cbiAgQW4gZXhhbXBsZSByZWFsLXdvcmxkIHVzZSBjYXNlIGlzIGltcGxlbWVudGluZyB0aW1lb3V0czpcblxuICBgYGBqYXZhc2NyaXB0XG4gIFByb21pc2UucmFjZShbYWpheCgnZm9vLmpzb24nKSwgdGltZW91dCg1MDAwKV0pXG4gIGBgYFxuXG4gIEBtZXRob2QgcmFjZVxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2Ugd2hpY2ggc2V0dGxlcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIGZpcnN0IHBhc3NlZFxuICBwcm9taXNlIHRvIHNldHRsZS5cbiovXG5mdW5jdGlvbiByYWNlKGVudHJpZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkoZW50cmllcykpIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChfLCByZWplY3QpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgcGFzc2VkIGByZWFzb25gLlxuICBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlbiBgcmVhc29uYC5cbiovXG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICBfcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBuZWVkc1Jlc29sdmVyKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG59XG5cbmZ1bmN0aW9uIG5lZWRzTmV3KCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xufVxuXG4vKipcbiAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgVGVybWlub2xvZ3lcbiAgLS0tLS0tLS0tLS1cblxuICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAtIGB0aGVuYWJsZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyBhIGB0aGVuYCBtZXRob2QuXG4gIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gIC0gYHJlYXNvbmAgaXMgYSB2YWx1ZSB0aGF0IGluZGljYXRlcyB3aHkgYSBwcm9taXNlIHdhcyByZWplY3RlZC5cbiAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gIFByb21pc2VzIHRoYXQgYXJlIGZ1bGZpbGxlZCBoYXZlIGEgZnVsZmlsbG1lbnQgdmFsdWUgYW5kIGFyZSBpbiB0aGUgZnVsZmlsbGVkXG4gIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgUHJvbWlzZXMgY2FuIGFsc28gYmUgc2FpZCB0byAqcmVzb2x2ZSogYSB2YWx1ZS4gIElmIHRoaXMgdmFsdWUgaXMgYWxzbyBhXG4gIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gIGl0c2VsZiByZWplY3QsIGFuZCBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdpbGxcbiAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICBCYXNpYyBVc2FnZTpcbiAgLS0tLS0tLS0tLS0tXG5cbiAgYGBganNcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBvbiBzdWNjZXNzXG4gICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAvLyBvbiBmYWlsdXJlXG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgQWR2YW5jZWQgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLS0tLVxuXG4gIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgYGBganNcbiAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgLy8gb24gcmVqZWN0aW9uXG4gIH0pO1xuICBgYGBcblxuICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gIGBgYGpzXG4gIFByb21pc2UuYWxsKFtcbiAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICBnZXRKU09OKCcvY29tbWVudHMnKVxuICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgIHZhbHVlc1sxXSAvLyA9PiBjb21tZW50c0pTT05cblxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH0pO1xuICBgYGBcblxuICBAY2xhc3MgUHJvbWlzZVxuICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgdGhpc1tQUk9NSVNFX0lEXSA9IG5leHRJZCgpO1xuICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICBpZiAobm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICB0eXBlb2YgcmVzb2x2ZXIgIT09ICdmdW5jdGlvbicgJiYgbmVlZHNSZXNvbHZlcigpO1xuICAgIHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlID8gaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpIDogbmVlZHNOZXcoKTtcbiAgfVxufVxuXG5Qcm9taXNlLmFsbCA9IGFsbDtcblByb21pc2UucmFjZSA9IHJhY2U7XG5Qcm9taXNlLnJlc29sdmUgPSByZXNvbHZlO1xuUHJvbWlzZS5yZWplY3QgPSByZWplY3Q7XG5Qcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBzZXRTY2hlZHVsZXI7XG5Qcm9taXNlLl9zZXRBc2FwID0gc2V0QXNhcDtcblByb21pc2UuX2FzYXAgPSBhc2FwO1xuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgLyoqXG4gICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgd2hpY2ggcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGVcbiAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgLy8gdXNlciBpcyBhdmFpbGFibGVcbiAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQ2hhaW5pbmdcbiAgICAtLS0tLS0tLVxuICBcbiAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmaXJzdCBwcm9taXNlJ3MgZnVsZmlsbG1lbnRcbiAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHJldHVybiB1c2VyLm5hbWU7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJOYW1lKSB7XG4gICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICB9KTtcbiAgXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgfSk7XG4gICAgYGBgXG4gICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEFzc2ltaWxhdGlvblxuICAgIC0tLS0tLS0tLS0tLVxuICBcbiAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICBmdWxmaWxsbWVudCBvciByZWplY3Rpb24gaGFuZGxlci4gVGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIHRoZW4gYmUgcGVuZGluZ1xuICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBTaW1wbGUgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCByZXN1bHQ7XG4gIFxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBmaW5kUmVzdWx0KCk7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9XG4gICAgYGBgXG4gIFxuICAgIEVycmJhY2sgRXhhbXBsZVxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRSZXN1bHQoZnVuY3Rpb24ocmVzdWx0LCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFByb21pc2UgRXhhbXBsZTtcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgIC0tLS0tLS0tLS0tLS0tXG4gIFxuICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgXG4gICAgYGBgamF2YXNjcmlwdFxuICAgIGxldCBhdXRob3IsIGJvb2tzO1xuICBcbiAgICB0cnkge1xuICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgIC8vIHN1Y2Nlc3NcbiAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH1cbiAgICBgYGBcbiAgXG4gICAgRXJyYmFjayBFeGFtcGxlXG4gIFxuICAgIGBgYGpzXG4gIFxuICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcbiAgXG4gICAgfVxuICBcbiAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuICBcbiAgICB9XG4gIFxuICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvdW5kQm9va3MoYm9va3MpO1xuICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgUHJvbWlzZSBFeGFtcGxlO1xuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgZmluZEF1dGhvcigpLlxuICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICB0aGVuKGZ1bmN0aW9uKGJvb2tzKXtcbiAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQG1ldGhvZCB0aGVuXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25GdWxmaWxsZWRcbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG4gIHRoZW46IHRoZW4sXG5cbiAgLyoqXG4gICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG4gIFxuICAgIGBgYGpzXG4gICAgZnVuY3Rpb24gZmluZEF1dGhvcigpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgfVxuICBcbiAgICAvLyBzeW5jaHJvbm91c1xuICAgIHRyeSB7XG4gICAgICBmaW5kQXV0aG9yKCk7XG4gICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfVxuICBcbiAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBAbWV0aG9kIGNhdGNoXG4gICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3Rpb25cbiAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgQHJldHVybiB7UHJvbWlzZX1cbiAgKi9cbiAgJ2NhdGNoJzogZnVuY3Rpb24gX2NhdGNoKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHBvbHlmaWxsKCkge1xuICAgIHZhciBsb2NhbCA9IHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IGdsb2JhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgIGlmIChQKSB7XG4gICAgICAgIHZhciBwcm9taXNlVG9TdHJpbmcgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZVRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gc2lsZW50bHkgaWdub3JlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2VUb1N0cmluZyA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxvY2FsLlByb21pc2UgPSBQcm9taXNlO1xufVxuXG4vLyBTdHJhbmdlIGNvbXBhdC4uXG5Qcm9taXNlLnBvbHlmaWxsID0gcG9seWZpbGw7XG5Qcm9taXNlLlByb21pc2UgPSBQcm9taXNlO1xuXG5yZXR1cm4gUHJvbWlzZTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVzNi1wcm9taXNlLm1hcCIsIi8qIVxuXHRQYXBhIFBhcnNlXG5cdHY0LjEuMlxuXHRodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlXG4qL1xuKGZ1bmN0aW9uKGdsb2JhbClcbntcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIElTX1dPUktFUiA9ICFnbG9iYWwuZG9jdW1lbnQgJiYgISFnbG9iYWwucG9zdE1lc3NhZ2UsXG5cdFx0SVNfUEFQQV9XT1JLRVIgPSBJU19XT1JLRVIgJiYgLyhcXD98JilwYXBhd29ya2VyKD18JnwkKS8udGVzdChnbG9iYWwubG9jYXRpb24uc2VhcmNoKSxcblx0XHRMT0FERURfU1lOQyA9IGZhbHNlLCBBVVRPX1NDUklQVF9QQVRIO1xuXHR2YXIgd29ya2VycyA9IHt9LCB3b3JrZXJJZENvdW50ZXIgPSAwO1xuXG5cdHZhciBQYXBhID0ge307XG5cblx0UGFwYS5wYXJzZSA9IENzdlRvSnNvbjtcblx0UGFwYS51bnBhcnNlID0gSnNvblRvQ3N2O1xuXG5cdFBhcGEuUkVDT1JEX1NFUCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApO1xuXHRQYXBhLlVOSVRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMSk7XG5cdFBhcGEuQllURV9PUkRFUl9NQVJLID0gXCJcXHVmZWZmXCI7XG5cdFBhcGEuQkFEX0RFTElNSVRFUlMgPSBbXCJcXHJcIiwgXCJcXG5cIiwgXCJcXFwiXCIsIFBhcGEuQllURV9PUkRFUl9NQVJLXTtcblx0UGFwYS5XT1JLRVJTX1NVUFBPUlRFRCA9ICFJU19XT1JLRVIgJiYgISFnbG9iYWwuV29ya2VyO1xuXHRQYXBhLlNDUklQVF9QQVRIID0gbnVsbDtcdC8vIE11c3QgYmUgc2V0IGJ5IHlvdXIgY29kZSBpZiB5b3UgdXNlIHdvcmtlcnMgYW5kIHRoaXMgbGliIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseVxuXG5cdC8vIENvbmZpZ3VyYWJsZSBjaHVuayBzaXplcyBmb3IgbG9jYWwgYW5kIHJlbW90ZSBmaWxlcywgcmVzcGVjdGl2ZWx5XG5cdFBhcGEuTG9jYWxDaHVua1NpemUgPSAxMDI0ICogMTAyNCAqIDEwO1x0Ly8gMTAgTUJcblx0UGFwYS5SZW1vdGVDaHVua1NpemUgPSAxMDI0ICogMTAyNCAqIDU7XHQvLyA1IE1CXG5cdFBhcGEuRGVmYXVsdERlbGltaXRlciA9IFwiLFwiO1x0XHRcdC8vIFVzZWQgaWYgbm90IHNwZWNpZmllZCBhbmQgZGV0ZWN0aW9uIGZhaWxzXG5cblx0Ly8gRXhwb3NlZCBmb3IgdGVzdGluZyBhbmQgZGV2ZWxvcG1lbnQgb25seVxuXHRQYXBhLlBhcnNlciA9IFBhcnNlcjtcblx0UGFwYS5QYXJzZXJIYW5kbGUgPSBQYXJzZXJIYW5kbGU7XG5cdFBhcGEuTmV0d29ya1N0cmVhbWVyID0gTmV0d29ya1N0cmVhbWVyO1xuXHRQYXBhLkZpbGVTdHJlYW1lciA9IEZpbGVTdHJlYW1lcjtcblx0UGFwYS5TdHJpbmdTdHJlYW1lciA9IFN0cmluZ1N0cmVhbWVyO1xuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcblx0e1xuXHRcdC8vIEV4cG9ydCB0byBOb2RlLi4uXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBQYXBhO1xuXHR9XG5cdGVsc2UgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLmRlZmluZSkgJiYgZ2xvYmFsLmRlZmluZS5hbWQpXG5cdHtcblx0XHQvLyBXaXJldXAgd2l0aCBSZXF1aXJlSlNcblx0XHRkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBQYXBhOyB9KTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHQvLyAuLi5vciBhcyBicm93c2VyIGdsb2JhbFxuXHRcdGdsb2JhbC5QYXBhID0gUGFwYTtcblx0fVxuXG5cdGlmIChnbG9iYWwualF1ZXJ5KVxuXHR7XG5cdFx0dmFyICQgPSBnbG9iYWwualF1ZXJ5O1xuXHRcdCQuZm4ucGFyc2UgPSBmdW5jdGlvbihvcHRpb25zKVxuXHRcdHtcblx0XHRcdHZhciBjb25maWcgPSBvcHRpb25zLmNvbmZpZyB8fCB7fTtcblx0XHRcdHZhciBxdWV1ZSA9IFtdO1xuXG5cdFx0XHR0aGlzLmVhY2goZnVuY3Rpb24oaWR4KVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgc3VwcG9ydGVkID0gJCh0aGlzKS5wcm9wKCd0YWdOYW1lJykudG9VcHBlckNhc2UoKSA9PSBcIklOUFVUXCJcblx0XHRcdFx0XHRcdFx0XHQmJiAkKHRoaXMpLmF0dHIoJ3R5cGUnKS50b0xvd2VyQ2FzZSgpID09IFwiZmlsZVwiXG5cdFx0XHRcdFx0XHRcdFx0JiYgZ2xvYmFsLkZpbGVSZWFkZXI7XG5cblx0XHRcdFx0aWYgKCFzdXBwb3J0ZWQgfHwgIXRoaXMuZmlsZXMgfHwgdGhpcy5maWxlcy5sZW5ndGggPT0gMClcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcdC8vIGNvbnRpbnVlIHRvIG5leHQgaW5wdXQgZWxlbWVudFxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5maWxlcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHF1ZXVlLnB1c2goe1xuXHRcdFx0XHRcdFx0ZmlsZTogdGhpcy5maWxlc1tpXSxcblx0XHRcdFx0XHRcdGlucHV0RWxlbTogdGhpcyxcblx0XHRcdFx0XHRcdGluc3RhbmNlQ29uZmlnOiAkLmV4dGVuZCh7fSwgY29uZmlnKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cGFyc2VOZXh0RmlsZSgpO1x0Ly8gYmVnaW4gcGFyc2luZ1xuXHRcdFx0cmV0dXJuIHRoaXM7XHRcdC8vIG1haW50YWlucyBjaGFpbmFiaWxpdHlcblxuXG5cdFx0XHRmdW5jdGlvbiBwYXJzZU5leHRGaWxlKClcblx0XHRcdHtcblx0XHRcdFx0aWYgKHF1ZXVlLmxlbmd0aCA9PSAwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5jb21wbGV0ZSkpXG5cdFx0XHRcdFx0XHRvcHRpb25zLmNvbXBsZXRlKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGYgPSBxdWV1ZVswXTtcblxuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmJlZm9yZSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcmV0dXJuZWQgPSBvcHRpb25zLmJlZm9yZShmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgcmV0dXJuZWQgPT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChyZXR1cm5lZC5hY3Rpb24gPT0gXCJhYm9ydFwiKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRlcnJvcihcIkFib3J0RXJyb3JcIiwgZi5maWxlLCBmLmlucHV0RWxlbSwgcmV0dXJuZWQucmVhc29uKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1x0Ly8gQWJvcnRzIGFsbCBxdWV1ZWQgZmlsZXMgaW1tZWRpYXRlbHlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkLmFjdGlvbiA9PSBcInNraXBcIilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XHQvLyBwYXJzZSB0aGUgbmV4dCBmaWxlIGluIHRoZSBxdWV1ZSwgaWYgYW55XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiByZXR1cm5lZC5jb25maWcgPT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdFx0XHRmLmluc3RhbmNlQ29uZmlnID0gJC5leHRlbmQoZi5pbnN0YW5jZUNvbmZpZywgcmV0dXJuZWQuY29uZmlnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAocmV0dXJuZWQgPT0gXCJza2lwXCIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XHQvLyBwYXJzZSB0aGUgbmV4dCBmaWxlIGluIHRoZSBxdWV1ZSwgaWYgYW55XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV3JhcCB1cCB0aGUgdXNlcidzIGNvbXBsZXRlIGNhbGxiYWNrLCBpZiBhbnksIHNvIHRoYXQgb3VycyBhbHNvIGdldHMgZXhlY3V0ZWRcblx0XHRcdFx0dmFyIHVzZXJDb21wbGV0ZUZ1bmMgPSBmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0XHRmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpc0Z1bmN0aW9uKHVzZXJDb21wbGV0ZUZ1bmMpKVxuXHRcdFx0XHRcdFx0dXNlckNvbXBsZXRlRnVuYyhyZXN1bHRzLCBmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRQYXBhLnBhcnNlKGYuZmlsZSwgZi5pbnN0YW5jZUNvbmZpZyk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGVycm9yKG5hbWUsIGZpbGUsIGVsZW0sIHJlYXNvbilcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpXG5cdFx0XHRcdFx0b3B0aW9ucy5lcnJvcih7bmFtZTogbmFtZX0sIGZpbGUsIGVsZW0sIHJlYXNvbik7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGZpbGVDb21wbGV0ZSgpXG5cdFx0XHR7XG5cdFx0XHRcdHF1ZXVlLnNwbGljZSgwLCAxKTtcblx0XHRcdFx0cGFyc2VOZXh0RmlsZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHR7XG5cdFx0Z2xvYmFsLm9ubWVzc2FnZSA9IHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0fVxuXHRlbHNlIGlmIChQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHR7XG5cdFx0QVVUT19TQ1JJUFRfUEFUSCA9IGdldFNjcmlwdFBhdGgoKTtcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBzY3JpcHQgd2FzIGxvYWRlZCBzeW5jaHJvbm91c2x5XG5cdFx0aWYgKCFkb2N1bWVudC5ib2R5KVxuXHRcdHtcblx0XHRcdC8vIEJvZHkgZG9lc24ndCBleGlzdCB5ZXQsIG11c3QgYmUgc3luY2hyb25vdXNcblx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHRcdH0sIHRydWUpO1xuXHRcdH1cblx0fVxuXG5cblxuXG5cdGZ1bmN0aW9uIENzdlRvSnNvbihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHRfY29uZmlnID0gX2NvbmZpZyB8fCB7fTtcblxuXHRcdGlmIChfY29uZmlnLndvcmtlciAmJiBQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdHtcblx0XHRcdHZhciB3ID0gbmV3V29ya2VyKCk7XG5cblx0XHRcdHcudXNlclN0ZXAgPSBfY29uZmlnLnN0ZXA7XG5cdFx0XHR3LnVzZXJDaHVuayA9IF9jb25maWcuY2h1bms7XG5cdFx0XHR3LnVzZXJDb21wbGV0ZSA9IF9jb25maWcuY29tcGxldGU7XG5cdFx0XHR3LnVzZXJFcnJvciA9IF9jb25maWcuZXJyb3I7XG5cblx0XHRcdF9jb25maWcuc3RlcCA9IGlzRnVuY3Rpb24oX2NvbmZpZy5zdGVwKTtcblx0XHRcdF9jb25maWcuY2h1bmsgPSBpc0Z1bmN0aW9uKF9jb25maWcuY2h1bmspO1xuXHRcdFx0X2NvbmZpZy5jb21wbGV0ZSA9IGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSk7XG5cdFx0XHRfY29uZmlnLmVycm9yID0gaXNGdW5jdGlvbihfY29uZmlnLmVycm9yKTtcblx0XHRcdGRlbGV0ZSBfY29uZmlnLndvcmtlcjtcdC8vIHByZXZlbnQgaW5maW5pdGUgbG9vcFxuXG5cdFx0XHR3LnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0aW5wdXQ6IF9pbnB1dCxcblx0XHRcdFx0Y29uZmlnOiBfY29uZmlnLFxuXHRcdFx0XHR3b3JrZXJJZDogdy5pZFxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc3RyZWFtZXIgPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRpZiAoX2NvbmZpZy5kb3dubG9hZClcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgTmV0d29ya1N0cmVhbWVyKF9jb25maWcpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRzdHJlYW1lciA9IG5ldyBTdHJpbmdTdHJlYW1lcihfY29uZmlnKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKGdsb2JhbC5GaWxlICYmIF9pbnB1dCBpbnN0YW5jZW9mIEZpbGUpIHx8IF9pbnB1dCBpbnN0YW5jZW9mIE9iamVjdClcdC8vIC4uLlNhZmFyaS4gKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdFx0c3RyZWFtZXIgPSBuZXcgRmlsZVN0cmVhbWVyKF9jb25maWcpO1xuXG5cdFx0cmV0dXJuIHN0cmVhbWVyLnN0cmVhbShfaW5wdXQpO1xuXHR9XG5cblxuXG5cblxuXG5cdGZ1bmN0aW9uIEpzb25Ub0NzdihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHR2YXIgX291dHB1dCA9IFwiXCI7XG5cdFx0dmFyIF9maWVsZHMgPSBbXTtcblxuXHRcdC8vIERlZmF1bHQgY29uZmlndXJhdGlvblxuXG5cdFx0LyoqIHdoZXRoZXIgdG8gc3Vycm91bmQgZXZlcnkgZGF0dW0gd2l0aCBxdW90ZXMgKi9cblx0XHR2YXIgX3F1b3RlcyA9IGZhbHNlO1xuXG5cdFx0LyoqIGRlbGltaXRpbmcgY2hhcmFjdGVyICovXG5cdFx0dmFyIF9kZWxpbWl0ZXIgPSBcIixcIjtcblxuXHRcdC8qKiBuZXdsaW5lIGNoYXJhY3RlcihzKSAqL1xuXHRcdHZhciBfbmV3bGluZSA9IFwiXFxyXFxuXCI7XG5cblx0XHR1bnBhY2tDb25maWcoKTtcblxuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHRcdF9pbnB1dCA9IEpTT04ucGFyc2UoX2lucHV0KTtcblxuXHRcdGlmIChfaW5wdXQgaW5zdGFuY2VvZiBBcnJheSlcblx0XHR7XG5cdFx0XHRpZiAoIV9pbnB1dC5sZW5ndGggfHwgX2lucHV0WzBdIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHRcdHJldHVybiBzZXJpYWxpemUobnVsbCwgX2lucHV0KTtcblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXRbMF0gPT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG9iamVjdEtleXMoX2lucHV0WzBdKSwgX2lucHV0KTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ29iamVjdCcpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBfaW5wdXQuZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9pbnB1dC5kYXRhID0gSlNPTi5wYXJzZShfaW5wdXQuZGF0YSk7XG5cblx0XHRcdGlmIChfaW5wdXQuZGF0YSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoIV9pbnB1dC5maWVsZHMpXG5cdFx0XHRcdFx0X2lucHV0LmZpZWxkcyA9IF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXlcblx0XHRcdFx0XHRcdFx0XHRcdD8gX2lucHV0LmZpZWxkc1xuXHRcdFx0XHRcdFx0XHRcdFx0OiBvYmplY3RLZXlzKF9pbnB1dC5kYXRhWzBdKTtcblxuXHRcdFx0XHRpZiAoIShfaW5wdXQuZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KSAmJiB0eXBlb2YgX2lucHV0LmRhdGFbMF0gIT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdF9pbnB1dC5kYXRhID0gW19pbnB1dC5kYXRhXTtcdC8vIGhhbmRsZXMgaW5wdXQgbGlrZSBbMSwyLDNdIG9yIFtcImFzZGZcIl1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShfaW5wdXQuZmllbGRzIHx8IFtdLCBfaW5wdXQuZGF0YSB8fCBbXSk7XG5cdFx0fVxuXG5cdFx0Ly8gRGVmYXVsdCAoYW55IHZhbGlkIHBhdGhzIHNob3VsZCByZXR1cm4gYmVmb3JlIHRoaXMpXG5cdFx0dGhyb3cgXCJleGNlcHRpb246IFVuYWJsZSB0byBzZXJpYWxpemUgdW5yZWNvZ25pemVkIGlucHV0XCI7XG5cblxuXHRcdGZ1bmN0aW9uIHVucGFja0NvbmZpZygpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcuZGVsaW1pdGVyID09PSAnc3RyaW5nJ1xuXHRcdFx0XHQmJiBfY29uZmlnLmRlbGltaXRlci5sZW5ndGggPT0gMVxuXHRcdFx0XHQmJiBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoX2NvbmZpZy5kZWxpbWl0ZXIpID09IC0xKVxuXHRcdFx0e1xuXHRcdFx0XHRfZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5xdW90ZXMgPT09ICdib29sZWFuJ1xuXHRcdFx0XHR8fCBfY29uZmlnLnF1b3RlcyBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRfcXVvdGVzID0gX2NvbmZpZy5xdW90ZXM7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5uZXdsaW5lID09PSAnc3RyaW5nJylcblx0XHRcdFx0X25ld2xpbmUgPSBfY29uZmlnLm5ld2xpbmU7XG5cdFx0fVxuXG5cblx0XHQvKiogVHVybnMgYW4gb2JqZWN0J3Mga2V5cyBpbnRvIGFuIGFycmF5ICovXG5cdFx0ZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmopXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9iailcblx0XHRcdFx0a2V5cy5wdXNoKGtleSk7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cblx0XHQvKiogVGhlIGRvdWJsZSBmb3IgbG9vcCB0aGF0IGl0ZXJhdGVzIHRoZSBkYXRhIGFuZCB3cml0ZXMgb3V0IGEgQ1NWIHN0cmluZyBpbmNsdWRpbmcgaGVhZGVyIHJvdyAqL1xuXHRcdGZ1bmN0aW9uIHNlcmlhbGl6ZShmaWVsZHMsIGRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGNzdiA9IFwiXCI7XG5cblx0XHRcdGlmICh0eXBlb2YgZmllbGRzID09PSAnc3RyaW5nJylcblx0XHRcdFx0ZmllbGRzID0gSlNPTi5wYXJzZShmaWVsZHMpO1xuXHRcdFx0aWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJylcblx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG5cblx0XHRcdHZhciBoYXNIZWFkZXIgPSBmaWVsZHMgaW5zdGFuY2VvZiBBcnJheSAmJiBmaWVsZHMubGVuZ3RoID4gMDtcblx0XHRcdHZhciBkYXRhS2V5ZWRCeUZpZWxkID0gIShkYXRhWzBdIGluc3RhbmNlb2YgQXJyYXkpO1xuXG5cdFx0XHQvLyBJZiB0aGVyZSBhIGhlYWRlciByb3csIHdyaXRlIGl0IGZpcnN0XG5cdFx0XHRpZiAoaGFzSGVhZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGZpZWxkc1tpXSwgaSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoZW4gd3JpdGUgb3V0IHRoZSBkYXRhXG5cdFx0XHRmb3IgKHZhciByb3cgPSAwOyByb3cgPCBkYXRhLmxlbmd0aDsgcm93KyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtYXhDb2wgPSBoYXNIZWFkZXIgPyBmaWVsZHMubGVuZ3RoIDogZGF0YVtyb3ddLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKHZhciBjb2wgPSAwOyBjb2wgPCBtYXhDb2w7IGNvbCsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGNvbCA+IDApXG5cdFx0XHRcdFx0XHRjc3YgKz0gX2RlbGltaXRlcjtcblx0XHRcdFx0XHR2YXIgY29sSWR4ID0gaGFzSGVhZGVyICYmIGRhdGFLZXllZEJ5RmllbGQgPyBmaWVsZHNbY29sXSA6IGNvbDtcblx0XHRcdFx0XHRjc3YgKz0gc2FmZShkYXRhW3Jvd11bY29sSWR4XSwgY29sKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyb3cgPCBkYXRhLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0Y3N2ICs9IF9uZXdsaW5lO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY3N2O1xuXHRcdH1cblxuXHRcdC8qKiBFbmNsb3NlcyBhIHZhbHVlIGFyb3VuZCBxdW90ZXMgaWYgbmVlZGVkIChtYWtlcyBhIHZhbHVlIHNhZmUgZm9yIENTViBpbnNlcnRpb24pICovXG5cdFx0ZnVuY3Rpb24gc2FmZShzdHIsIGNvbClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIHN0ciA9PT0gXCJ1bmRlZmluZWRcIiB8fCBzdHIgPT09IG51bGwpXG5cdFx0XHRcdHJldHVybiBcIlwiO1xuXG5cdFx0XHRzdHIgPSBzdHIudG9TdHJpbmcoKS5yZXBsYWNlKC9cIi9nLCAnXCJcIicpO1xuXG5cdFx0XHR2YXIgbmVlZHNRdW90ZXMgPSAodHlwZW9mIF9xdW90ZXMgPT09ICdib29sZWFuJyAmJiBfcXVvdGVzKVxuXHRcdFx0XHRcdFx0XHR8fCAoX3F1b3RlcyBpbnN0YW5jZW9mIEFycmF5ICYmIF9xdW90ZXNbY29sXSlcblx0XHRcdFx0XHRcdFx0fHwgaGFzQW55KHN0ciwgUGFwYS5CQURfREVMSU1JVEVSUylcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmluZGV4T2YoX2RlbGltaXRlcikgPiAtMVxuXHRcdFx0XHRcdFx0XHR8fCBzdHIuY2hhckF0KDApID09ICcgJ1xuXHRcdFx0XHRcdFx0XHR8fCBzdHIuY2hhckF0KHN0ci5sZW5ndGggLSAxKSA9PSAnICc7XG5cblx0XHRcdHJldHVybiBuZWVkc1F1b3RlcyA/ICdcIicgKyBzdHIgKyAnXCInIDogc3RyO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGhhc0FueShzdHIsIHN1YnN0cmluZ3MpXG5cdFx0e1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzdHJpbmdzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRpZiAoc3RyLmluZGV4T2Yoc3Vic3RyaW5nc1tpXSkgPiAtMSlcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKiogQ2h1bmtTdHJlYW1lciBpcyB0aGUgYmFzZSBwcm90b3R5cGUgZm9yIHZhcmlvdXMgc3RyZWFtZXIgaW1wbGVtZW50YXRpb25zLiAqL1xuXHRmdW5jdGlvbiBDaHVua1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdHRoaXMuX2hhbmRsZSA9IG51bGw7XG5cdFx0dGhpcy5fcGF1c2VkID0gZmFsc2U7XG5cdFx0dGhpcy5fZmluaXNoZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9pbnB1dCA9IG51bGw7XG5cdFx0dGhpcy5fYmFzZUluZGV4ID0gMDtcblx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9IFwiXCI7XG5cdFx0dGhpcy5fcm93Q291bnQgPSAwO1xuXHRcdHRoaXMuX3N0YXJ0ID0gMDtcblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBudWxsO1xuXHRcdHRoaXMuaXNGaXJzdENodW5rID0gdHJ1ZTtcblx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMgPSB7XG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdGVycm9yczogW10sXG5cdFx0XHRtZXRhOiB7fVxuXHRcdH07XG5cdFx0cmVwbGFjZUNvbmZpZy5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR0aGlzLnBhcnNlQ2h1bmsgPSBmdW5jdGlvbihjaHVuaylcblx0XHR7XG5cdFx0XHQvLyBGaXJzdCBjaHVuayBwcmUtcHJvY2Vzc2luZ1xuXHRcdFx0aWYgKHRoaXMuaXNGaXJzdENodW5rICYmIGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbW9kaWZpZWRDaHVuayA9IHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKGNodW5rKTtcblx0XHRcdFx0aWYgKG1vZGlmaWVkQ2h1bmsgIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRjaHVuayA9IG1vZGlmaWVkQ2h1bms7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IGZhbHNlO1xuXG5cdFx0XHQvLyBSZWpvaW4gdGhlIGxpbmUgd2UgbGlrZWx5IGp1c3Qgc3BsaXQgaW4gdHdvIGJ5IGNodW5raW5nIHRoZSBmaWxlXG5cdFx0XHR2YXIgYWdncmVnYXRlID0gdGhpcy5fcGFydGlhbExpbmUgKyBjaHVuaztcblx0XHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gXCJcIjtcblxuXHRcdFx0dmFyIHJlc3VsdHMgPSB0aGlzLl9oYW5kbGUucGFyc2UoYWdncmVnYXRlLCB0aGlzLl9iYXNlSW5kZXgsICF0aGlzLl9maW5pc2hlZCk7XG5cdFx0XHRcblx0XHRcdGlmICh0aGlzLl9oYW5kbGUucGF1c2VkKCkgfHwgdGhpcy5faGFuZGxlLmFib3J0ZWQoKSlcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XG5cdFx0XHR2YXIgbGFzdEluZGV4ID0gcmVzdWx0cy5tZXRhLmN1cnNvcjtcblx0XHRcdFxuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSBhZ2dyZWdhdGUuc3Vic3RyaW5nKGxhc3RJbmRleCAtIHRoaXMuX2Jhc2VJbmRleCk7XG5cdFx0XHRcdHRoaXMuX2Jhc2VJbmRleCA9IGxhc3RJbmRleDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5kYXRhKVxuXHRcdFx0XHR0aGlzLl9yb3dDb3VudCArPSByZXN1bHRzLmRhdGEubGVuZ3RoO1xuXG5cdFx0XHR2YXIgZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ID0gdGhpcy5fZmluaXNoZWQgfHwgKHRoaXMuX2NvbmZpZy5wcmV2aWV3ICYmIHRoaXMuX3Jvd0NvdW50ID49IHRoaXMuX2NvbmZpZy5wcmV2aWV3KTtcblxuXHRcdFx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGZpbmlzaGVkOiBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5jaHVuayhyZXN1bHRzLCB0aGlzLl9oYW5kbGUpO1xuXHRcdFx0XHRpZiAodGhpcy5fcGF1c2VkKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0cmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuX2NvbmZpZy5zdGVwICYmICF0aGlzLl9jb25maWcuY2h1bmspIHtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmRhdGEgPSB0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YS5jb25jYXQocmVzdWx0cy5kYXRhKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycyA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMuY29uY2F0KHJlc3VsdHMuZXJyb3JzKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLm1ldGEgPSByZXN1bHRzLm1ldGE7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgJiYgaXNGdW5jdGlvbih0aGlzLl9jb25maWcuY29tcGxldGUpICYmICghcmVzdWx0cyB8fCAhcmVzdWx0cy5tZXRhLmFib3J0ZWQpKVxuXHRcdFx0XHR0aGlzLl9jb25maWcuY29tcGxldGUodGhpcy5fY29tcGxldGVSZXN1bHRzKTtcblxuXHRcdFx0aWYgKCFmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEucGF1c2VkKSlcblx0XHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XG5cblx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdH07XG5cblx0XHR0aGlzLl9zZW5kRXJyb3IgPSBmdW5jdGlvbihlcnJvcilcblx0XHR7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbih0aGlzLl9jb25maWcuZXJyb3IpKVxuXHRcdFx0XHR0aGlzLl9jb25maWcuZXJyb3IoZXJyb3IpO1xuXHRcdFx0ZWxzZSBpZiAoSVNfUEFQQV9XT1JLRVIgJiYgdGhpcy5fY29uZmlnLmVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRlcnJvcjogZXJyb3IsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRmdW5jdGlvbiByZXBsYWNlQ29uZmlnKGNvbmZpZylcblx0XHR7XG5cdFx0XHQvLyBEZWVwLWNvcHkgdGhlIGNvbmZpZyBzbyB3ZSBjYW4gZWRpdCBpdFxuXHRcdFx0dmFyIGNvbmZpZ0NvcHkgPSBjb3B5KGNvbmZpZyk7XG5cdFx0XHRjb25maWdDb3B5LmNodW5rU2l6ZSA9IHBhcnNlSW50KGNvbmZpZ0NvcHkuY2h1bmtTaXplKTtcdC8vIHBhcnNlSW50IFZFUlkgaW1wb3J0YW50IHNvIHdlIGRvbid0IGNvbmNhdGVuYXRlIHN0cmluZ3MhXG5cdFx0XHRpZiAoIWNvbmZpZy5zdGVwICYmICFjb25maWcuY2h1bmspXG5cdFx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gbnVsbDsgIC8vIGRpc2FibGUgUmFuZ2UgaGVhZGVyIGlmIG5vdCBzdHJlYW1pbmc7IGJhZCB2YWx1ZXMgYnJlYWsgSUlTIC0gc2VlIGlzc3VlICMxOTZcblx0XHRcdHRoaXMuX2hhbmRsZSA9IG5ldyBQYXJzZXJIYW5kbGUoY29uZmlnQ29weSk7XG5cdFx0XHR0aGlzLl9oYW5kbGUuc3RyZWFtZXIgPSB0aGlzO1xuXHRcdFx0dGhpcy5fY29uZmlnID0gY29uZmlnQ29weTtcdC8vIHBlcnNpc3QgdGhlIGNvcHkgdG8gdGhlIGNhbGxlclxuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gTmV0d29ya1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5SZW1vdGVDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgeGhyO1xuXG5cdFx0aWYgKElTX1dPUktFUilcblx0XHR7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCgpO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24odXJsKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gdXJsO1xuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX3JlYWRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0eGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRcblx0XHRcdGlmICghSVNfV09SS0VSKVxuXHRcdFx0e1xuXHRcdFx0XHR4aHIub25sb2FkID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rTG9hZGVkLCB0aGlzKTtcblx0XHRcdFx0eGhyLm9uZXJyb3IgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtFcnJvciwgdGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdHhoci5vcGVuKFwiR0VUXCIsIHRoaXMuX2lucHV0LCAhSVNfV09SS0VSKTtcblx0XHRcdFxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBlbmQgPSB0aGlzLl9zdGFydCArIHRoaXMuX2NvbmZpZy5jaHVua1NpemUgLSAxO1x0Ly8gbWludXMgb25lIGJlY2F1c2UgYnl0ZSByYW5nZSBpcyBpbmNsdXNpdmVcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJSYW5nZVwiLCBcImJ5dGVzPVwiK3RoaXMuX3N0YXJ0K1wiLVwiK2VuZCk7XG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiSWYtTm9uZS1NYXRjaFwiLCBcIndlYmtpdC1uby1jYWNoZVwiKTsgLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgyNjcyXG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHhoci5zZW5kKCk7XG5cdFx0XHR9XG5cdFx0XHRjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoZXJyLm1lc3NhZ2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoSVNfV09SS0VSICYmIHhoci5zdGF0dXMgPT0gMClcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLl9zdGFydCArPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rTG9hZGVkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPSA0KVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh4aHIuc3RhdHVzIDwgMjAwIHx8IHhoci5zdGF0dXMgPj0gNDAwKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+IGdldEZpbGVTaXplKHhocik7XG5cdFx0XHR0aGlzLnBhcnNlQ2h1bmsoeGhyLnJlc3BvbnNlVGV4dCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtFcnJvciA9IGZ1bmN0aW9uKGVycm9yTWVzc2FnZSlcblx0XHR7XG5cdFx0XHR2YXIgZXJyb3JUZXh0ID0geGhyLnN0YXR1c1RleHQgfHwgZXJyb3JNZXNzYWdlO1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKGVycm9yVGV4dCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0RmlsZVNpemUoeGhyKVxuXHRcdHtcblx0XHRcdHZhciBjb250ZW50UmFuZ2UgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVJhbmdlXCIpO1xuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGNvbnRlbnRSYW5nZS5zdWJzdHIoY29udGVudFJhbmdlLmxhc3RJbmRleE9mKFwiL1wiKSArIDEpKTtcblx0XHR9XG5cdH1cblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHROZXR3b3JrU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTmV0d29ya1N0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gRmlsZVN0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5Mb2NhbENodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciByZWFkZXIsIHNsaWNlO1xuXG5cdFx0Ly8gRmlsZVJlYWRlciBpcyBiZXR0ZXIgdGhhbiBGaWxlUmVhZGVyU3luYyAoZXZlbiBpbiB3b3JrZXIpIC0gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzI0NzA4NjQ5LzEwNDg4NjJcblx0XHQvLyBCdXQgRmlyZWZveCBpcyBhIHBpbGwsIHRvbyAtIHNlZSBpc3N1ZSAjNzY6IGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2UvaXNzdWVzLzc2XG5cdFx0dmFyIHVzaW5nQXN5bmNSZWFkZXIgPSB0eXBlb2YgRmlsZVJlYWRlciAhPT0gJ3VuZGVmaW5lZCc7XHQvLyBTYWZhcmkgZG9lc24ndCBjb25zaWRlciBpdCBhIGZ1bmN0aW9uIC0gc2VlIGlzc3VlICMxMDVcblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24oZmlsZSlcblx0XHR7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IGZpbGU7XG5cdFx0XHRzbGljZSA9IGZpbGUuc2xpY2UgfHwgZmlsZS53ZWJraXRTbGljZSB8fCBmaWxlLm1velNsaWNlO1xuXG5cdFx0XHRpZiAodXNpbmdBc3luY1JlYWRlcilcblx0XHRcdHtcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcdFx0Ly8gUHJlZmVycmVkIG1ldGhvZCBvZiByZWFkaW5nIGZpbGVzLCBldmVuIGluIHdvcmtlcnNcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHJlYWRlci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZWFkZXIgPSBuZXcgRmlsZVJlYWRlclN5bmMoKTtcdC8vIEhhY2sgZm9yIHJ1bm5pbmcgaW4gYSB3ZWIgd29ya2VyIGluIEZpcmVmb3hcblxuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkICYmICghdGhpcy5fY29uZmlnLnByZXZpZXcgfHwgdGhpcy5fcm93Q291bnQgPCB0aGlzLl9jb25maWcucHJldmlldykpXG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdH1cblxuXHRcdHRoaXMuX3JlYWRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR2YXIgaW5wdXQgPSB0aGlzLl9pbnB1dDtcblx0XHRcdGlmICh0aGlzLl9jb25maWcuY2h1bmtTaXplKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZW5kID0gTWF0aC5taW4odGhpcy5fc3RhcnQgKyB0aGlzLl9jb25maWcuY2h1bmtTaXplLCB0aGlzLl9pbnB1dC5zaXplKTtcblx0XHRcdFx0aW5wdXQgPSBzbGljZS5jYWxsKGlucHV0LCB0aGlzLl9zdGFydCwgZW5kKTtcblx0XHRcdH1cblx0XHRcdHZhciB0eHQgPSByZWFkZXIucmVhZEFzVGV4dChpbnB1dCwgdGhpcy5fY29uZmlnLmVuY29kaW5nKTtcblx0XHRcdGlmICghdXNpbmdBc3luY1JlYWRlcilcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoeyB0YXJnZXQ6IHsgcmVzdWx0OiB0eHQgfSB9KTtcdC8vIG1pbWljIHRoZSBhc3luYyBzaWduYXR1cmVcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0xvYWRlZCA9IGZ1bmN0aW9uKGV2ZW50KVxuXHRcdHtcblx0XHRcdC8vIFZlcnkgaW1wb3J0YW50IHRvIGluY3JlbWVudCBzdGFydCBlYWNoIHRpbWUgYmVmb3JlIGhhbmRsaW5nIHJlc3VsdHNcblx0XHRcdHRoaXMuX3N0YXJ0ICs9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICF0aGlzLl9jb25maWcuY2h1bmtTaXplIHx8IHRoaXMuX3N0YXJ0ID49IHRoaXMuX2lucHV0LnNpemU7XG5cdFx0XHR0aGlzLnBhcnNlQ2h1bmsoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtFcnJvciA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IocmVhZGVyLmVycm9yKTtcblx0XHR9XG5cblx0fVxuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDaHVua1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdEZpbGVTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGaWxlU3RyZWFtZXI7XG5cblxuXHRmdW5jdGlvbiBTdHJpbmdTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgc3RyaW5nO1xuXHRcdHZhciByZW1haW5pbmc7XG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbihzKVxuXHRcdHtcblx0XHRcdHN0cmluZyA9IHM7XG5cdFx0XHRyZW1haW5pbmcgPSBzO1xuXHRcdFx0cmV0dXJuIHRoaXMuX25leHRDaHVuaygpO1xuXHRcdH1cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHRoaXMuX2ZpbmlzaGVkKSByZXR1cm47XG5cdFx0XHR2YXIgc2l6ZSA9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0XHR2YXIgY2h1bmsgPSBzaXplID8gcmVtYWluaW5nLnN1YnN0cigwLCBzaXplKSA6IHJlbWFpbmluZztcblx0XHRcdHJlbWFpbmluZyA9IHNpemUgPyByZW1haW5pbmcuc3Vic3RyKHNpemUpIDogJyc7XG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICFyZW1haW5pbmc7XG5cdFx0XHRyZXR1cm4gdGhpcy5wYXJzZUNodW5rKGNodW5rKTtcblx0XHR9XG5cdH1cblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdHJpbmdTdHJlYW1lcjtcblxuXG5cblx0Ly8gVXNlIG9uZSBQYXJzZXJIYW5kbGUgcGVyIGVudGlyZSBDU1YgZmlsZSBvciBzdHJpbmdcblx0ZnVuY3Rpb24gUGFyc2VySGFuZGxlKF9jb25maWcpXG5cdHtcblx0XHQvLyBPbmUgZ29hbCBpcyB0byBtaW5pbWl6ZSB0aGUgdXNlIG9mIHJlZ3VsYXIgZXhwcmVzc2lvbnMuLi5cblx0XHR2YXIgRkxPQVQgPSAvXlxccyotPyhcXGQqXFwuP1xcZCt8XFxkK1xcLj9cXGQqKShlWy0rXT9cXGQrKT9cXHMqJC9pO1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBfc3RlcENvdW50ZXIgPSAwO1x0Ly8gTnVtYmVyIG9mIHRpbWVzIHN0ZXAgd2FzIGNhbGxlZCAobnVtYmVyIG9mIHJvd3MgcGFyc2VkKVxuXHRcdHZhciBfaW5wdXQ7XHRcdFx0XHQvLyBUaGUgaW5wdXQgYmVpbmcgcGFyc2VkXG5cdFx0dmFyIF9wYXJzZXI7XHRcdFx0Ly8gVGhlIGNvcmUgcGFyc2VyIGJlaW5nIHVzZWRcblx0XHR2YXIgX3BhdXNlZCA9IGZhbHNlO1x0Ly8gV2hldGhlciB3ZSBhcmUgcGF1c2VkIG9yIG5vdFxuXHRcdHZhciBfYWJvcnRlZCA9IGZhbHNlOyAgIC8vIFdoZXRoZXIgdGhlIHBhcnNlciBoYXMgYWJvcnRlZCBvciBub3Rcblx0XHR2YXIgX2RlbGltaXRlckVycm9yO1x0Ly8gVGVtcG9yYXJ5IHN0YXRlIGJldHdlZW4gZGVsaW1pdGVyIGRldGVjdGlvbiBhbmQgcHJvY2Vzc2luZyByZXN1bHRzXG5cdFx0dmFyIF9maWVsZHMgPSBbXTtcdFx0Ly8gRmllbGRzIGFyZSBmcm9tIHRoZSBoZWFkZXIgcm93IG9mIHRoZSBpbnB1dCwgaWYgdGhlcmUgaXMgb25lXG5cdFx0dmFyIF9yZXN1bHRzID0ge1x0XHQvLyBUaGUgbGFzdCByZXN1bHRzIHJldHVybmVkIGZyb20gdGhlIHBhcnNlclxuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXG5cdFx0aWYgKGlzRnVuY3Rpb24oX2NvbmZpZy5zdGVwKSlcblx0XHR7XG5cdFx0XHR2YXIgdXNlclN0ZXAgPSBfY29uZmlnLnN0ZXA7XG5cdFx0XHRfY29uZmlnLnN0ZXAgPSBmdW5jdGlvbihyZXN1bHRzKVxuXHRcdFx0e1xuXHRcdFx0XHRfcmVzdWx0cyA9IHJlc3VsdHM7XG5cblx0XHRcdFx0aWYgKG5lZWRzSGVhZGVyUm93KCkpXG5cdFx0XHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblx0XHRcdFx0ZWxzZVx0Ly8gb25seSBjYWxsIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFmdGVyIGhlYWRlciByb3dcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cblx0XHRcdFx0XHQvLyBJdCdzIHBvc3NiaWxlIHRoYXQgdGhpcyBsaW5lIHdhcyBlbXB0eSBhbmQgdGhlcmUncyBubyByb3cgaGVyZSBhZnRlciBhbGxcblx0XHRcdFx0XHRpZiAoX3Jlc3VsdHMuZGF0YS5sZW5ndGggPT0gMClcblx0XHRcdFx0XHRcdHJldHVybjtcblxuXHRcdFx0XHRcdF9zdGVwQ291bnRlciArPSByZXN1bHRzLmRhdGEubGVuZ3RoO1xuXHRcdFx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX3N0ZXBDb3VudGVyID4gX2NvbmZpZy5wcmV2aWV3KVxuXHRcdFx0XHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHVzZXJTdGVwKF9yZXN1bHRzLCBzZWxmKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBQYXJzZXMgaW5wdXQuIE1vc3QgdXNlcnMgd29uJ3QgbmVlZCwgYW5kIHNob3VsZG4ndCBtZXNzIHdpdGgsIHRoZSBiYXNlSW5kZXhcblx0XHQgKiBhbmQgaWdub3JlTGFzdFJvdyBwYXJhbWV0ZXJzLiBUaGV5IGFyZSB1c2VkIGJ5IHN0cmVhbWVycyAod3JhcHBlciBmdW5jdGlvbnMpXG5cdFx0ICogd2hlbiBhbiBpbnB1dCBjb21lcyBpbiBtdWx0aXBsZSBjaHVua3MsIGxpa2UgZnJvbSBhIGZpbGUuXG5cdFx0ICovXG5cdFx0dGhpcy5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpXG5cdFx0e1xuXHRcdFx0aWYgKCFfY29uZmlnLm5ld2xpbmUpXG5cdFx0XHRcdF9jb25maWcubmV3bGluZSA9IGd1ZXNzTGluZUVuZGluZ3MoaW5wdXQpO1xuXG5cdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSBmYWxzZTtcblx0XHRcdGlmICghX2NvbmZpZy5kZWxpbWl0ZXIpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkZWxpbUd1ZXNzID0gZ3Vlc3NEZWxpbWl0ZXIoaW5wdXQpO1xuXHRcdFx0XHRpZiAoZGVsaW1HdWVzcy5zdWNjZXNzZnVsKVxuXHRcdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gZGVsaW1HdWVzcy5iZXN0RGVsaW1pdGVyO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZGVsaW1pdGVyRXJyb3IgPSB0cnVlO1x0Ly8gYWRkIGVycm9yIGFmdGVyIHBhcnNpbmcgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSBvdmVyd3JpdHRlbilcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IFBhcGEuRGVmYXVsdERlbGltaXRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcGFyc2VyQ29uZmlnID0gY29weShfY29uZmlnKTtcblx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHBhcnNlckNvbmZpZy5wcmV2aWV3Kys7XHQvLyB0byBjb21wZW5zYXRlIGZvciBoZWFkZXIgcm93XG5cblx0XHRcdF9pbnB1dCA9IGlucHV0O1xuXHRcdFx0X3BhcnNlciA9IG5ldyBQYXJzZXIocGFyc2VyQ29uZmlnKTtcblx0XHRcdF9yZXN1bHRzID0gX3BhcnNlci5wYXJzZShfaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdyk7XG5cdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQgPyB7IG1ldGE6IHsgcGF1c2VkOiB0cnVlIH0gfSA6IChfcmVzdWx0cyB8fCB7IG1ldGE6IHsgcGF1c2VkOiBmYWxzZSB9IH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9pbnB1dCA9IF9pbnB1dC5zdWJzdHIoX3BhcnNlci5nZXRDaGFySW5kZXgoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSBmYWxzZTtcblx0XHRcdHNlbGYuc3RyZWFtZXIucGFyc2VDaHVuayhfaW5wdXQpO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX2Fib3J0ZWQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRfcmVzdWx0cy5tZXRhLmFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0aWYgKGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSkpXG5cdFx0XHRcdF9jb25maWcuY29tcGxldGUoX3Jlc3VsdHMpO1xuXHRcdFx0X2lucHV0ID0gXCJcIjtcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gcHJvY2Vzc1Jlc3VsdHMoKVxuXHRcdHtcblx0XHRcdGlmIChfcmVzdWx0cyAmJiBfZGVsaW1pdGVyRXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGFkZEVycm9yKFwiRGVsaW1pdGVyXCIsIFwiVW5kZXRlY3RhYmxlRGVsaW1pdGVyXCIsIFwiVW5hYmxlIHRvIGF1dG8tZGV0ZWN0IGRlbGltaXRpbmcgY2hhcmFjdGVyOyBkZWZhdWx0ZWQgdG8gJ1wiK1BhcGEuRGVmYXVsdERlbGltaXRlcitcIidcIik7XG5cdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5za2lwRW1wdHlMaW5lcylcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aCA9PSAxICYmIF9yZXN1bHRzLmRhdGFbaV1bMF0gPT0gXCJcIilcblx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKGktLSwgMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRmaWxsSGVhZGVyRmllbGRzKCk7XG5cblx0XHRcdHJldHVybiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBuZWVkc0hlYWRlclJvdygpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9jb25maWcuaGVhZGVyICYmIF9maWVsZHMubGVuZ3RoID09IDA7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZmlsbEhlYWRlckZpZWxkcygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cylcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IG5lZWRzSGVhZGVyUm93KCkgJiYgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGg7IGorKylcblx0XHRcdFx0XHRfZmllbGRzLnB1c2goX3Jlc3VsdHMuZGF0YVtpXVtqXSk7XG5cdFx0XHRfcmVzdWx0cy5kYXRhLnNwbGljZSgwLCAxKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMgfHwgKCFfY29uZmlnLmhlYWRlciAmJiAhX2NvbmZpZy5keW5hbWljVHlwaW5nKSlcblx0XHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciByb3cgPSB7fTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5keW5hbWljVHlwaW5nKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9IF9yZXN1bHRzLmRhdGFbaV1bal07XG5cdFx0XHRcdFx0XHRpZiAodmFsdWUgPT0gXCJ0cnVlXCIgfHwgdmFsdWUgPT0gXCJUUlVFXCIpXG5cdFx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGFbaV1bal0gPSB0cnVlO1xuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodmFsdWUgPT0gXCJmYWxzZVwiIHx8IHZhbHVlID09IFwiRkFMU0VcIilcblx0XHRcdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YVtpXVtqXSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldW2pdID0gdHJ5UGFyc2VGbG9hdCh2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChqID49IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAoIXJvd1tcIl9fcGFyc2VkX2V4dHJhXCJdKVxuXHRcdFx0XHRcdFx0XHRcdHJvd1tcIl9fcGFyc2VkX2V4dHJhXCJdID0gW107XG5cdFx0XHRcdFx0XHRcdHJvd1tcIl9fcGFyc2VkX2V4dHJhXCJdLnB1c2goX3Jlc3VsdHMuZGF0YVtpXVtqXSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdHJvd1tfZmllbGRzW2pdXSA9IF9yZXN1bHRzLmRhdGFbaV1bal07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKF9jb25maWcuaGVhZGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YVtpXSA9IHJvdztcblx0XHRcdFx0XHRpZiAoaiA+IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoXCJGaWVsZE1pc21hdGNoXCIsIFwiVG9vTWFueUZpZWxkc1wiLCBcIlRvbyBtYW55IGZpZWxkczogZXhwZWN0ZWQgXCIgKyBfZmllbGRzLmxlbmd0aCArIFwiIGZpZWxkcyBidXQgcGFyc2VkIFwiICsgaiwgaSk7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaiA8IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoXCJGaWVsZE1pc21hdGNoXCIsIFwiVG9vRmV3RmllbGRzXCIsIFwiVG9vIGZldyBmaWVsZHM6IGV4cGVjdGVkIFwiICsgX2ZpZWxkcy5sZW5ndGggKyBcIiBmaWVsZHMgYnV0IHBhcnNlZCBcIiArIGosIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfY29uZmlnLmhlYWRlciAmJiBfcmVzdWx0cy5tZXRhKVxuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmZpZWxkcyA9IF9maWVsZHM7XG5cdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ3Vlc3NEZWxpbWl0ZXIoaW5wdXQpXG5cdFx0e1xuXHRcdFx0dmFyIGRlbGltQ2hvaWNlcyA9IFtcIixcIiwgXCJcXHRcIiwgXCJ8XCIsIFwiO1wiLCBQYXBhLlJFQ09SRF9TRVAsIFBhcGEuVU5JVF9TRVBdO1xuXHRcdFx0dmFyIGJlc3REZWxpbSwgYmVzdERlbHRhLCBmaWVsZENvdW50UHJldlJvdztcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWxpbUNob2ljZXMubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkZWxpbSA9IGRlbGltQ2hvaWNlc1tpXTtcblx0XHRcdFx0dmFyIGRlbHRhID0gMCwgYXZnRmllbGRDb3VudCA9IDA7XG5cdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdHZhciBwcmV2aWV3ID0gbmV3IFBhcnNlcih7XG5cdFx0XHRcdFx0ZGVsaW1pdGVyOiBkZWxpbSxcblx0XHRcdFx0XHRwcmV2aWV3OiAxMFxuXHRcdFx0XHR9KS5wYXJzZShpbnB1dCk7XG5cblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBwcmV2aWV3LmRhdGEubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgZmllbGRDb3VudCA9IHByZXZpZXcuZGF0YVtqXS5sZW5ndGg7XG5cdFx0XHRcdFx0YXZnRmllbGRDb3VudCArPSBmaWVsZENvdW50O1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBmaWVsZENvdW50UHJldlJvdyA9PT0gJ3VuZGVmaW5lZCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSBmaWVsZENvdW50O1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKGZpZWxkQ291bnQgPiAxKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRlbHRhICs9IE1hdGguYWJzKGZpZWxkQ291bnQgLSBmaWVsZENvdW50UHJldlJvdyk7XG5cdFx0XHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IGZpZWxkQ291bnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHByZXZpZXcuZGF0YS5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdGF2Z0ZpZWxkQ291bnQgLz0gcHJldmlldy5kYXRhLmxlbmd0aDtcblxuXHRcdFx0XHRpZiAoKHR5cGVvZiBiZXN0RGVsdGEgPT09ICd1bmRlZmluZWQnIHx8IGRlbHRhIDwgYmVzdERlbHRhKVxuXHRcdFx0XHRcdCYmIGF2Z0ZpZWxkQ291bnQgPiAxLjk5KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YmVzdERlbHRhID0gZGVsdGE7XG5cdFx0XHRcdFx0YmVzdERlbGltID0gZGVsaW07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBiZXN0RGVsaW07XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3NmdWw6ICEhYmVzdERlbGltLFxuXHRcdFx0XHRiZXN0RGVsaW1pdGVyOiBiZXN0RGVsaW1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBndWVzc0xpbmVFbmRpbmdzKGlucHV0KVxuXHRcdHtcblx0XHRcdGlucHV0ID0gaW5wdXQuc3Vic3RyKDAsIDEwMjQqMTAyNCk7XHQvLyBtYXggbGVuZ3RoIDEgTUJcblxuXHRcdFx0dmFyIHIgPSBpbnB1dC5zcGxpdCgnXFxyJyk7XG5cblx0XHRcdGlmIChyLmxlbmd0aCA9PSAxKVxuXHRcdFx0XHRyZXR1cm4gJ1xcbic7XG5cblx0XHRcdHZhciBudW1XaXRoTiA9IDA7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHIubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChyW2ldWzBdID09ICdcXG4nKVxuXHRcdFx0XHRcdG51bVdpdGhOKys7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudW1XaXRoTiA+PSByLmxlbmd0aCAvIDIgPyAnXFxyXFxuJyA6ICdcXHInO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyeVBhcnNlRmxvYXQodmFsKVxuXHRcdHtcblx0XHRcdHZhciBpc051bWJlciA9IEZMT0FULnRlc3QodmFsKTtcblx0XHRcdHJldHVybiBpc051bWJlciA/IHBhcnNlRmxvYXQodmFsKSA6IHZhbDtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBhZGRFcnJvcih0eXBlLCBjb2RlLCBtc2csIHJvdylcblx0XHR7XG5cdFx0XHRfcmVzdWx0cy5lcnJvcnMucHVzaCh7XG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdGNvZGU6IGNvZGUsXG5cdFx0XHRcdG1lc3NhZ2U6IG1zZyxcblx0XHRcdFx0cm93OiByb3dcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cblxuXG5cblx0LyoqIFRoZSBjb3JlIHBhcnNlciBpbXBsZW1lbnRzIHNwZWVkeSBhbmQgY29ycmVjdCBDU1YgcGFyc2luZyAqL1xuXHRmdW5jdGlvbiBQYXJzZXIoY29uZmlnKVxuXHR7XG5cdFx0Ly8gVW5wYWNrIHRoZSBjb25maWcgb2JqZWN0XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdHZhciBkZWxpbSA9IGNvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0dmFyIG5ld2xpbmUgPSBjb25maWcubmV3bGluZTtcblx0XHR2YXIgY29tbWVudHMgPSBjb25maWcuY29tbWVudHM7XG5cdFx0dmFyIHN0ZXAgPSBjb25maWcuc3RlcDtcblx0XHR2YXIgcHJldmlldyA9IGNvbmZpZy5wcmV2aWV3O1xuXHRcdHZhciBmYXN0TW9kZSA9IGNvbmZpZy5mYXN0TW9kZTtcblxuXHRcdC8vIERlbGltaXRlciBtdXN0IGJlIHZhbGlkXG5cdFx0aWYgKHR5cGVvZiBkZWxpbSAhPT0gJ3N0cmluZydcblx0XHRcdHx8IFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihkZWxpbSkgPiAtMSlcblx0XHRcdGRlbGltID0gXCIsXCI7XG5cblx0XHQvLyBDb21tZW50IGNoYXJhY3RlciBtdXN0IGJlIHZhbGlkXG5cdFx0aWYgKGNvbW1lbnRzID09PSBkZWxpbSlcblx0XHRcdHRocm93IFwiQ29tbWVudCBjaGFyYWN0ZXIgc2FtZSBhcyBkZWxpbWl0ZXJcIjtcblx0XHRlbHNlIGlmIChjb21tZW50cyA9PT0gdHJ1ZSlcblx0XHRcdGNvbW1lbnRzID0gXCIjXCI7XG5cdFx0ZWxzZSBpZiAodHlwZW9mIGNvbW1lbnRzICE9PSAnc3RyaW5nJ1xuXHRcdFx0fHwgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKGNvbW1lbnRzKSA+IC0xKVxuXHRcdFx0Y29tbWVudHMgPSBmYWxzZTtcblxuXHRcdC8vIE5ld2xpbmUgbXVzdCBiZSB2YWxpZDogXFxyLCBcXG4sIG9yIFxcclxcblxuXHRcdGlmIChuZXdsaW5lICE9ICdcXG4nICYmIG5ld2xpbmUgIT0gJ1xccicgJiYgbmV3bGluZSAhPSAnXFxyXFxuJylcblx0XHRcdG5ld2xpbmUgPSAnXFxuJztcblxuXHRcdC8vIFdlJ3JlIGdvbm5hIG5lZWQgdGhlc2UgYXQgdGhlIFBhcnNlciBzY29wZVxuXHRcdHZhciBjdXJzb3IgPSAwO1xuXHRcdHZhciBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHQvLyBGb3Igc29tZSByZWFzb24sIGluIENocm9tZSwgdGhpcyBzcGVlZHMgdGhpbmdzIHVwICghPylcblx0XHRcdGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKVxuXHRcdFx0XHR0aHJvdyBcIklucHV0IG11c3QgYmUgYSBzdHJpbmdcIjtcblxuXHRcdFx0Ly8gV2UgZG9uJ3QgbmVlZCB0byBjb21wdXRlIHNvbWUgb2YgdGhlc2UgZXZlcnkgdGltZSBwYXJzZSgpIGlzIGNhbGxlZCxcblx0XHRcdC8vIGJ1dCBoYXZpbmcgdGhlbSBpbiBhIG1vcmUgbG9jYWwgc2NvcGUgc2VlbXMgdG8gcGVyZm9ybSBiZXR0ZXJcblx0XHRcdHZhciBpbnB1dExlbiA9IGlucHV0Lmxlbmd0aCxcblx0XHRcdFx0ZGVsaW1MZW4gPSBkZWxpbS5sZW5ndGgsXG5cdFx0XHRcdG5ld2xpbmVMZW4gPSBuZXdsaW5lLmxlbmd0aCxcblx0XHRcdFx0Y29tbWVudHNMZW4gPSBjb21tZW50cy5sZW5ndGg7XG5cdFx0XHR2YXIgc3RlcElzRnVuY3Rpb24gPSB0eXBlb2Ygc3RlcCA9PT0gJ2Z1bmN0aW9uJztcblxuXHRcdFx0Ly8gRXN0YWJsaXNoIHN0YXJ0aW5nIHN0YXRlXG5cdFx0XHRjdXJzb3IgPSAwO1xuXHRcdFx0dmFyIGRhdGEgPSBbXSwgZXJyb3JzID0gW10sIHJvdyA9IFtdLCBsYXN0Q3Vyc29yID0gMDtcblxuXHRcdFx0aWYgKCFpbnB1dClcblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblxuXHRcdFx0aWYgKGZhc3RNb2RlIHx8IChmYXN0TW9kZSAhPT0gZmFsc2UgJiYgaW5wdXQuaW5kZXhPZignXCInKSA9PT0gLTEpKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgcm93cyA9IGlucHV0LnNwbGl0KG5ld2xpbmUpO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcm93ID0gcm93c1tpXTtcblx0XHRcdFx0XHRjdXJzb3IgKz0gcm93Lmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoaSAhPT0gcm93cy5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdFx0Y3Vyc29yICs9IG5ld2xpbmUubGVuZ3RoO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cuc3Vic3RyKDAsIGNvbW1lbnRzTGVuKSA9PSBjb21tZW50cylcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkYXRhID0gW107XG5cdFx0XHRcdFx0XHRwdXNoUm93KHJvdy5zcGxpdChkZWxpbSkpO1xuXHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBpID49IHByZXZpZXcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IGRhdGEuc2xpY2UoMCwgcHJldmlldyk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHR2YXIgbmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cblx0XHRcdC8vIFBhcnNlciBsb29wXG5cdFx0XHRmb3IgKDs7KVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBGaWVsZCBoYXMgb3BlbmluZyBxdW90ZVxuXHRcdFx0XHRpZiAoaW5wdXRbY3Vyc29yXSA9PSAnXCInKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly8gU3RhcnQgb3VyIHNlYXJjaCBmb3IgdGhlIGNsb3NpbmcgcXVvdGUgd2hlcmUgdGhlIGN1cnNvciBpc1xuXHRcdFx0XHRcdHZhciBxdW90ZVNlYXJjaCA9IGN1cnNvcjtcblxuXHRcdFx0XHRcdC8vIFNraXAgdGhlIG9wZW5pbmcgcXVvdGVcblx0XHRcdFx0XHRjdXJzb3IrKztcblxuXHRcdFx0XHRcdGZvciAoOzspXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8gRmluZCBjbG9zaW5nIHF1b3RlXG5cdFx0XHRcdFx0XHR2YXIgcXVvdGVTZWFyY2ggPSBpbnB1dC5pbmRleE9mKCdcIicsIHF1b3RlU2VhcmNoKzEpO1xuXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVTZWFyY2ggPT09IC0xKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAoIWlnbm9yZUxhc3RSb3cpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBObyBjbG9zaW5nIHF1b3RlLi4uIHdoYXQgYSBwaXR5XG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogXCJRdW90ZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdGNvZGU6IFwiTWlzc2luZ1F1b3Rlc1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogXCJRdW90ZWQgZmllbGQgdW50ZXJtaW5hdGVkXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRyb3c6IGRhdGEubGVuZ3RoLFx0Ly8gcm93IGhhcyB5ZXQgdG8gYmUgaW5zZXJ0ZWRcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBjdXJzb3Jcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChxdW90ZVNlYXJjaCA9PT0gaW5wdXRMZW4tMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBhdCBFT0Zcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UoL1wiXCIvZywgJ1wiJyk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmaW5pc2godmFsdWUpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGlzIHF1b3RlIGlzIGVzY2FwZWQsIGl0J3MgcGFydCBvZiB0aGUgZGF0YTsgc2tpcCBpdFxuXHRcdFx0XHRcdFx0aWYgKGlucHV0W3F1b3RlU2VhcmNoKzFdID09ICdcIicpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHF1b3RlU2VhcmNoKys7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2grMV0gPT0gZGVsaW0pXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgZGVsaW1pdGVyXG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKC9cIlwiL2csICdcIicpKTtcblx0XHRcdFx0XHRcdFx0Y3Vyc29yID0gcXVvdGVTZWFyY2ggKyAxICsgZGVsaW1MZW47XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGlucHV0LnN1YnN0cihxdW90ZVNlYXJjaCsxLCBuZXdsaW5lTGVuKSA9PT0gbmV3bGluZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBmb2xsb3dlZCBieSBuZXdsaW5lXG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKC9cIlwiL2csICdcIicpKTtcblx0XHRcdFx0XHRcdFx0c2F2ZVJvdyhxdW90ZVNlYXJjaCArIDEgKyBuZXdsaW5lTGVuKTtcblx0XHRcdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcdC8vIGJlY2F1c2Ugd2UgbWF5IGhhdmUgc2tpcHBlZCB0aGUgbmV4dERlbGltIGluIHRoZSBxdW90ZWQgZmllbGRcblxuXHRcdFx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGRhdGEubGVuZ3RoID49IHByZXZpZXcpXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBDb21tZW50IGZvdW5kIGF0IHN0YXJ0IG9mIG5ldyBsaW5lXG5cdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cubGVuZ3RoID09PSAwICYmIGlucHV0LnN1YnN0cihjdXJzb3IsIGNvbW1lbnRzTGVuKSA9PT0gY29tbWVudHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAobmV4dE5ld2xpbmUgPT0gLTEpXHQvLyBDb21tZW50IGVuZHMgYXQgRU9GXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHROZXdsaW5lICsgbmV3bGluZUxlbjtcblx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTmV4dCBkZWxpbWl0ZXIgY29tZXMgYmVmb3JlIG5leHQgbmV3bGluZSwgc28gd2UndmUgcmVhY2hlZCBlbmQgb2YgZmllbGRcblx0XHRcdFx0aWYgKG5leHREZWxpbSAhPT0gLTEgJiYgKG5leHREZWxpbSA8IG5leHROZXdsaW5lIHx8IG5leHROZXdsaW5lID09PSAtMSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0RGVsaW0pKTtcblx0XHRcdFx0XHRjdXJzb3IgPSBuZXh0RGVsaW0gKyBkZWxpbUxlbjtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRW5kIG9mIHJvd1xuXHRcdFx0XHRpZiAobmV4dE5ld2xpbmUgIT09IC0xKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgbmV4dE5ld2xpbmUpKTtcblx0XHRcdFx0XHRzYXZlUm93KG5leHROZXdsaW5lICsgbmV3bGluZUxlbik7XG5cblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBkYXRhLmxlbmd0aCA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cblx0XHRcdHJldHVybiBmaW5pc2goKTtcblxuXG5cdFx0XHRmdW5jdGlvbiBwdXNoUm93KHJvdylcblx0XHRcdHtcblx0XHRcdFx0ZGF0YS5wdXNoKHJvdyk7XG5cdFx0XHRcdGxhc3RDdXJzb3IgPSBjdXJzb3I7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgcmVtYWluaW5nIGlucHV0IGZyb20gY3Vyc29yIHRvIHRoZSBlbmQgaW50b1xuXHRcdFx0ICogcm93LCBzYXZlcyB0aGUgcm93LCBjYWxscyBzdGVwLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cy5cblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gZmluaXNoKHZhbHVlKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoaWdub3JlTGFzdFJvdylcblx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR2YWx1ZSA9IGlucHV0LnN1YnN0cihjdXJzb3IpO1xuXHRcdFx0XHRyb3cucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdGN1cnNvciA9IGlucHV0TGVuO1x0Ly8gaW1wb3J0YW50IGluIGNhc2UgcGFyc2luZyBpcyBwYXVzZWRcblx0XHRcdFx0cHVzaFJvdyhyb3cpO1xuXHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgY3VycmVudCByb3cgdG8gdGhlIHJlc3VsdHMuIEl0IHNldHMgdGhlIGN1cnNvclxuXHRcdFx0ICogdG8gbmV3Q3Vyc29yIGFuZCBmaW5kcyB0aGUgbmV4dE5ld2xpbmUuIFRoZSBjYWxsZXIgc2hvdWxkXG5cdFx0XHQgKiB0YWtlIGNhcmUgdG8gZXhlY3V0ZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgY2hlY2sgZm9yXG5cdFx0XHQgKiBwcmV2aWV3IGFuZCBlbmQgcGFyc2luZyBpZiBuZWNlc3NhcnkuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIHNhdmVSb3cobmV3Q3Vyc29yKVxuXHRcdFx0e1xuXHRcdFx0XHRjdXJzb3IgPSBuZXdDdXJzb3I7XG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0cm93ID0gW107XG5cdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgcmVzdWx0cywgZXJyb3JzLCBhbmQgbWV0YS4gKi9cblx0XHRcdGZ1bmN0aW9uIHJldHVybmFibGUoc3RvcHBlZClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0XHRcdGVycm9yczogZXJyb3JzLFxuXHRcdFx0XHRcdG1ldGE6IHtcblx0XHRcdFx0XHRcdGRlbGltaXRlcjogZGVsaW0sXG5cdFx0XHRcdFx0XHRsaW5lYnJlYWs6IG5ld2xpbmUsXG5cdFx0XHRcdFx0XHRhYm9ydGVkOiBhYm9ydGVkLFxuXHRcdFx0XHRcdFx0dHJ1bmNhdGVkOiAhIXN0b3BwZWQsXG5cdFx0XHRcdFx0XHRjdXJzb3I6IGxhc3RDdXJzb3IgKyAoYmFzZUluZGV4IHx8IDApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogRXhlY3V0ZXMgdGhlIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFuZCByZXNldHMgZGF0YSAmIGVycm9ycy4gKi9cblx0XHRcdGZ1bmN0aW9uIGRvU3RlcCgpXG5cdFx0XHR7XG5cdFx0XHRcdHN0ZXAocmV0dXJuYWJsZSgpKTtcblx0XHRcdFx0ZGF0YSA9IFtdLCBlcnJvcnMgPSBbXTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIFNldHMgdGhlIGFib3J0IGZsYWcgKi9cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdH07XG5cblx0XHQvKiogR2V0cyB0aGUgY3Vyc29yIHBvc2l0aW9uICovXG5cdFx0dGhpcy5nZXRDaGFySW5kZXggPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGN1cnNvcjtcblx0XHR9O1xuXHR9XG5cblxuXHQvLyBJZiB5b3UgbmVlZCB0byBsb2FkIFBhcGEgUGFyc2UgYXN5bmNocm9ub3VzbHkgYW5kIHlvdSBhbHNvIG5lZWQgd29ya2VyIHRocmVhZHMsIGhhcmQtY29kZVxuXHQvLyB0aGUgc2NyaXB0IHBhdGggaGVyZS4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy84NyNpc3N1ZWNvbW1lbnQtNTc4ODUzNThcblx0ZnVuY3Rpb24gZ2V0U2NyaXB0UGF0aCgpXG5cdHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0XHRyZXR1cm4gc2NyaXB0cy5sZW5ndGggPyBzY3JpcHRzW3NjcmlwdHMubGVuZ3RoIC0gMV0uc3JjIDogJyc7XG5cdH1cblxuXHRmdW5jdGlvbiBuZXdXb3JrZXIoKVxuXHR7XG5cdFx0aWYgKCFQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdGlmICghTE9BREVEX1NZTkMgJiYgUGFwYS5TQ1JJUFRfUEFUSCA9PT0gbnVsbClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0J1NjcmlwdCBwYXRoIGNhbm5vdCBiZSBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBQYXBhIFBhcnNlIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseS4gJyArXG5cdFx0XHRcdCdZb3UgbmVlZCB0byBzZXQgUGFwYS5TQ1JJUFRfUEFUSCBtYW51YWxseS4nXG5cdFx0XHQpO1xuXHRcdHZhciB3b3JrZXJVcmwgPSBQYXBhLlNDUklQVF9QQVRIIHx8IEFVVE9fU0NSSVBUX1BBVEg7XG5cdFx0Ly8gQXBwZW5kIFwicGFwYXdvcmtlclwiIHRvIHRoZSBzZWFyY2ggc3RyaW5nIHRvIHRlbGwgcGFwYXBhcnNlIHRoYXQgdGhpcyBpcyBvdXIgd29ya2VyLlxuXHRcdHdvcmtlclVybCArPSAod29ya2VyVXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgJ3BhcGF3b3JrZXInO1xuXHRcdHZhciB3ID0gbmV3IGdsb2JhbC5Xb3JrZXIod29ya2VyVXJsKTtcblx0XHR3Lm9ubWVzc2FnZSA9IG1haW5UaHJlYWRSZWNlaXZlZE1lc3NhZ2U7XG5cdFx0dy5pZCA9IHdvcmtlcklkQ291bnRlcisrO1xuXHRcdHdvcmtlcnNbdy5pZF0gPSB3O1xuXHRcdHJldHVybiB3O1xuXHR9XG5cblx0LyoqIENhbGxiYWNrIHdoZW4gbWFpbiB0aHJlYWQgcmVjZWl2ZXMgYSBtZXNzYWdlICovXG5cdGZ1bmN0aW9uIG1haW5UaHJlYWRSZWNlaXZlZE1lc3NhZ2UoZSlcblx0e1xuXHRcdHZhciBtc2cgPSBlLmRhdGE7XG5cdFx0dmFyIHdvcmtlciA9IHdvcmtlcnNbbXNnLndvcmtlcklkXTtcblx0XHR2YXIgYWJvcnRlZCA9IGZhbHNlO1xuXG5cdFx0aWYgKG1zZy5lcnJvcilcblx0XHRcdHdvcmtlci51c2VyRXJyb3IobXNnLmVycm9yLCBtc2cuZmlsZSk7XG5cdFx0ZWxzZSBpZiAobXNnLnJlc3VsdHMgJiYgbXNnLnJlc3VsdHMuZGF0YSlcblx0XHR7XG5cdFx0XHR2YXIgYWJvcnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0YWJvcnRlZCA9IHRydWU7XG5cdFx0XHRcdGNvbXBsZXRlV29ya2VyKG1zZy53b3JrZXJJZCwgeyBkYXRhOiBbXSwgZXJyb3JzOiBbXSwgbWV0YTogeyBhYm9ydGVkOiB0cnVlIH0gfSk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlID0ge1xuXHRcdFx0XHRhYm9ydDogYWJvcnQsXG5cdFx0XHRcdHBhdXNlOiBub3RJbXBsZW1lbnRlZCxcblx0XHRcdFx0cmVzdW1lOiBub3RJbXBsZW1lbnRlZFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJTdGVwKSlcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBtc2cucmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0d29ya2VyLnVzZXJTdGVwKHtcblx0XHRcdFx0XHRcdGRhdGE6IFttc2cucmVzdWx0cy5kYXRhW2ldXSxcblx0XHRcdFx0XHRcdGVycm9yczogbXNnLnJlc3VsdHMuZXJyb3JzLFxuXHRcdFx0XHRcdFx0bWV0YTogbXNnLnJlc3VsdHMubWV0YVxuXHRcdFx0XHRcdH0sIGhhbmRsZSk7XG5cdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWxldGUgbXNnLnJlc3VsdHM7XHQvLyBmcmVlIG1lbW9yeSBBU0FQXG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyQ2h1bmspKVxuXHRcdFx0e1xuXHRcdFx0XHR3b3JrZXIudXNlckNodW5rKG1zZy5yZXN1bHRzLCBoYW5kbGUsIG1zZy5maWxlKTtcblx0XHRcdFx0ZGVsZXRlIG1zZy5yZXN1bHRzO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtc2cuZmluaXNoZWQgJiYgIWFib3J0ZWQpXG5cdFx0XHRjb21wbGV0ZVdvcmtlcihtc2cud29ya2VySWQsIG1zZy5yZXN1bHRzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbXBsZXRlV29ya2VyKHdvcmtlcklkLCByZXN1bHRzKSB7XG5cdFx0dmFyIHdvcmtlciA9IHdvcmtlcnNbd29ya2VySWRdO1xuXHRcdGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyQ29tcGxldGUpKVxuXHRcdFx0d29ya2VyLnVzZXJDb21wbGV0ZShyZXN1bHRzKTtcblx0XHR3b3JrZXIudGVybWluYXRlKCk7XG5cdFx0ZGVsZXRlIHdvcmtlcnNbd29ya2VySWRdO1xuXHR9XG5cblx0ZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKSB7XG5cdFx0dGhyb3cgXCJOb3QgaW1wbGVtZW50ZWQuXCI7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiB3b3JrZXIgdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiB3b3JrZXJUaHJlYWRSZWNlaXZlZE1lc3NhZ2UoZSlcblx0e1xuXHRcdHZhciBtc2cgPSBlLmRhdGE7XG5cblx0XHRpZiAodHlwZW9mIFBhcGEuV09SS0VSX0lEID09PSAndW5kZWZpbmVkJyAmJiBtc2cpXG5cdFx0XHRQYXBhLldPUktFUl9JRCA9IG1zZy53b3JrZXJJZDtcblxuXHRcdGlmICh0eXBlb2YgbXNnLmlucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdHJlc3VsdHM6IFBhcGEucGFyc2UobXNnLmlucHV0LCBtc2cuY29uZmlnKSxcblx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgbXNnLmlucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgbXNnLmlucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gdGhhbmsgeW91LCBTYWZhcmkgKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdHtcblx0XHRcdHZhciByZXN1bHRzID0gUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpO1xuXHRcdFx0aWYgKHJlc3VsdHMpXG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqIE1ha2VzIGEgZGVlcCBjb3B5IG9mIGFuIGFycmF5IG9yIG9iamVjdCAobW9zdGx5KSAqL1xuXHRmdW5jdGlvbiBjb3B5KG9iailcblx0e1xuXHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdHJldHVybiBvYmo7XG5cdFx0dmFyIGNweSA9IG9iaiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKVxuXHRcdFx0Y3B5W2tleV0gPSBjb3B5KG9ialtrZXldKTtcblx0XHRyZXR1cm4gY3B5O1xuXHR9XG5cblx0ZnVuY3Rpb24gYmluZEZ1bmN0aW9uKGYsIHNlbGYpXG5cdHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IGYuYXBwbHkoc2VsZiwgYXJndW1lbnRzKTsgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24oZnVuYylcblx0e1xuXHRcdHJldHVybiB0eXBlb2YgZnVuYyA9PT0gJ2Z1bmN0aW9uJztcblx0fVxufSkodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0aGlzKTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChDKSBNaWNyb3NvZnQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxyXG50aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxyXG5MaWNlbnNlIGF0IGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG5cclxuVEhJUyBDT0RFIElTIFBST1ZJREVEIE9OIEFOICpBUyBJUyogQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxyXG5LSU5ELCBFSVRIRVIgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgV0lUSE9VVCBMSU1JVEFUSU9OIEFOWSBJTVBMSUVEXHJcbldBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBUSVRMRSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UsXHJcbk1FUkNIQU5UQUJMSVRZIE9SIE5PTi1JTkZSSU5HRU1FTlQuXHJcblxyXG5TZWUgdGhlIEFwYWNoZSBWZXJzaW9uIDIuMCBMaWNlbnNlIGZvciBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcclxuYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG52YXIgUmVmbGVjdDtcclxuKGZ1bmN0aW9uIChSZWZsZWN0KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xyXG4gICAgLy8gZmVhdHVyZSB0ZXN0IGZvciBPYmplY3QuY3JlYXRlIHN1cHBvcnRcclxuICAgIHZhciBzdXBwb3J0c0NyZWF0ZSA9IHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICAvLyBmZWF0dXJlIHRlc3QgZm9yIF9fcHJvdG9fXyBzdXBwb3J0XHJcbiAgICB2YXIgc3VwcG9ydHNQcm90byA9IHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXk7XHJcbiAgICAvLyBmZWF0dXJlIHRlc3QgZm9yIFN5bWJvbCBzdXBwb3J0XHJcbiAgICB2YXIgc3VwcG9ydHNTeW1ib2wgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICB2YXIgdG9QcmltaXRpdmVTeW1ib2wgPSBzdXBwb3J0c1N5bWJvbCAmJiB0eXBlb2YgU3ltYm9sLnRvUHJpbWl0aXZlICE9PSBcInVuZGVmaW5lZFwiID8gU3ltYm9sLnRvUHJpbWl0aXZlIDogXCJAQHRvUHJpbWl0aXZlXCI7XHJcbiAgICB2YXIgaXRlcmF0b3JTeW1ib2wgPSBzdXBwb3J0c1N5bWJvbCAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yICE9PSBcInVuZGVmaW5lZFwiID8gU3ltYm9sLml0ZXJhdG9yIDogXCJAQGl0ZXJhdG9yXCI7XHJcbiAgICAvLyBjcmVhdGUgYW4gb2JqZWN0IGluIGRpY3Rpb25hcnkgbW9kZSAoYS5rLmEuIFwic2xvd1wiIG1vZGUgaW4gdjgpXHJcbiAgICB2YXIgY3JlYXRlRGljdGlvbmFyeSA9IHN1cHBvcnRzQ3JlYXRlID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoT2JqZWN0LmNyZWF0ZShudWxsKSk7IH0gOlxyXG4gICAgICAgIHN1cHBvcnRzUHJvdG8gPyBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeSh7IF9fcHJvdG9fXzogbnVsbCB9KTsgfSA6XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KHt9KTsgfTtcclxuICAgIHZhciBIYXNoTWFwO1xyXG4gICAgKGZ1bmN0aW9uIChIYXNoTWFwKSB7XHJcbiAgICAgICAgdmFyIGRvd25MZXZlbCA9ICFzdXBwb3J0c0NyZWF0ZSAmJiAhc3VwcG9ydHNQcm90bztcclxuICAgICAgICBIYXNoTWFwLmhhcyA9IGRvd25MZXZlbFxyXG4gICAgICAgICAgICA/IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwobWFwLCBrZXkpOyB9XHJcbiAgICAgICAgICAgIDogZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBrZXkgaW4gbWFwOyB9O1xyXG4gICAgICAgIEhhc2hNYXAuZ2V0ID0gZG93bkxldmVsXHJcbiAgICAgICAgICAgID8gZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChtYXAsIGtleSkgPyBtYXBba2V5XSA6IHVuZGVmaW5lZDsgfVxyXG4gICAgICAgICAgICA6IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gbWFwW2tleV07IH07XHJcbiAgICB9KShIYXNoTWFwIHx8IChIYXNoTWFwID0ge30pKTtcclxuICAgIC8vIExvYWQgZ2xvYmFsIG9yIHNoaW0gdmVyc2lvbnMgb2YgTWFwLCBTZXQsIGFuZCBXZWFrTWFwXHJcbiAgICB2YXIgZnVuY3Rpb25Qcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoRnVuY3Rpb24pO1xyXG4gICAgdmFyIF9NYXAgPSB0eXBlb2YgTWFwID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIE1hcC5wcm90b3R5cGUuZW50cmllcyA9PT0gXCJmdW5jdGlvblwiID8gTWFwIDogQ3JlYXRlTWFwUG9seWZpbGwoKTtcclxuICAgIHZhciBfU2V0ID0gdHlwZW9mIFNldCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTZXQucHJvdG90eXBlLmVudHJpZXMgPT09IFwiZnVuY3Rpb25cIiA/IFNldCA6IENyZWF0ZVNldFBvbHlmaWxsKCk7XHJcbiAgICB2YXIgX1dlYWtNYXAgPSB0eXBlb2YgV2Vha01hcCA9PT0gXCJmdW5jdGlvblwiID8gV2Vha01hcCA6IENyZWF0ZVdlYWtNYXBQb2x5ZmlsbCgpO1xyXG4gICAgLy8gW1tNZXRhZGF0YV1dIGludGVybmFsIHNsb3RcclxuICAgIHZhciBNZXRhZGF0YSA9IG5ldyBfV2Vha01hcCgpO1xyXG4gICAgLyoqXHJcbiAgICAgICogQXBwbGllcyBhIHNldCBvZiBkZWNvcmF0b3JzIHRvIGEgcHJvcGVydHkgb2YgYSB0YXJnZXQgb2JqZWN0LlxyXG4gICAgICAqIEBwYXJhbSBkZWNvcmF0b3JzIEFuIGFycmF5IG9mIGRlY29yYXRvcnMuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSB0byBkZWNvcmF0ZS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0RGVzY3JpcHRvciAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciB0aGUgdGFyZ2V0IGtleVxyXG4gICAgICAqIEByZW1hcmtzIERlY29yYXRvcnMgYXJlIGFwcGxpZWQgaW4gcmV2ZXJzZSBvcmRlci5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIEV4YW1wbGUgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIsXHJcbiAgICAgICogICAgICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIixcclxuICAgICAgKiAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpKSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIixcclxuICAgICAgKiAgICAgICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIixcclxuICAgICAgKiAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKSkpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBkZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIHRhcmdldEtleSwgdGFyZ2V0RGVzY3JpcHRvcikge1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSkge1xyXG4gICAgICAgICAgICBpZiAoIUlzQXJyYXkoZGVjb3JhdG9ycykpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXREZXNjcmlwdG9yKSAmJiAhSXNVbmRlZmluZWQodGFyZ2V0RGVzY3JpcHRvcikgJiYgIUlzTnVsbCh0YXJnZXREZXNjcmlwdG9yKSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgaWYgKElzTnVsbCh0YXJnZXREZXNjcmlwdG9yKSlcclxuICAgICAgICAgICAgICAgIHRhcmdldERlc2NyaXB0b3IgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICAgICAgcmV0dXJuIERlY29yYXRlUHJvcGVydHkoZGVjb3JhdG9ycywgdGFyZ2V0LCB0YXJnZXRLZXksIHRhcmdldERlc2NyaXB0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKCFJc0FycmF5KGRlY29yYXRvcnMpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICBpZiAoIUlzQ29uc3RydWN0b3IodGFyZ2V0KSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgcmV0dXJuIERlY29yYXRlQ29uc3RydWN0b3IoZGVjb3JhdG9ycywgdGFyZ2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmRlY29yYXRlID0gZGVjb3JhdGU7XHJcbiAgICAvKipcclxuICAgICAgKiBBIGRlZmF1bHQgbWV0YWRhdGEgZGVjb3JhdG9yIGZhY3RvcnkgdGhhdCBjYW4gYmUgdXNlZCBvbiBhIGNsYXNzLCBjbGFzcyBtZW1iZXIsIG9yIHBhcmFtZXRlci5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgVGhlIGtleSBmb3IgdGhlIG1ldGFkYXRhIGVudHJ5LlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YVZhbHVlIFRoZSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGVudHJ5LlxyXG4gICAgICAqIEByZXR1cm5zIEEgZGVjb3JhdG9yIGZ1bmN0aW9uLlxyXG4gICAgICAqIEByZW1hcmtzXHJcbiAgICAgICogSWYgYG1ldGFkYXRhS2V5YCBpcyBhbHJlYWR5IGRlZmluZWQgZm9yIHRoZSB0YXJnZXQgYW5kIHRhcmdldCBrZXksIHRoZVxyXG4gICAgICAqIG1ldGFkYXRhVmFsdWUgZm9yIHRoYXQga2V5IHdpbGwgYmUgb3ZlcndyaXR0ZW4uXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvciwgVHlwZVNjcmlwdCBvbmx5KVxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlLCBUeXBlU2NyaXB0IG9ubHkpXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcclxuICAgICAgKiAgICAgICAgIHByb3BlcnR5O1xyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZCgpIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcclxuICAgICAgKiAgICAgICAgIG1ldGhvZCgpIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZGVjb3JhdG9yKHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICAgICAgICAgIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICghSXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgICAgIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgLyp0YXJnZXRLZXkqLyB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZWNvcmF0b3I7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0Lm1ldGFkYXRhID0gbWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBEZWZpbmUgYSB1bmlxdWUgbWV0YWRhdGEgZW50cnkgb24gdGhlIHRhcmdldC5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhVmFsdWUgQSB2YWx1ZSB0aGF0IGNvbnRhaW5zIGF0dGFjaGVkIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdG8gZGVmaW5lIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBkZWNvcmF0b3IgZmFjdG9yeSBhcyBtZXRhZGF0YS1wcm9kdWNpbmcgYW5ub3RhdGlvbi5cclxuICAgICAgKiAgICAgZnVuY3Rpb24gTXlBbm5vdGF0aW9uKG9wdGlvbnMpOiBEZWNvcmF0b3Ige1xyXG4gICAgICAqICAgICAgICAgcmV0dXJuICh0YXJnZXQsIGtleT8pID0+IFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCB0YXJnZXQsIGtleSk7XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGVmaW5lTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEgPSBkZWZpbmVNZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgYSB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbiBoYXMgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEga2V5IHdhcyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW47IG90aGVyd2lzZSwgYGZhbHNlYC5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGhhc01ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeUhhc01ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0Lmhhc01ldGFkYXRhID0gaGFzTWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIGEgdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSB0YXJnZXQgb2JqZWN0IGhhcyB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBrZXkgd2FzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Q7IG90aGVyd2lzZSwgYGZhbHNlYC5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGhhc093bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeUhhc093bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0Lmhhc093bk1ldGFkYXRhID0gaGFzT3duTWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluLlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIFRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGtleSBpZiBmb3VuZDsgb3RoZXJ3aXNlLCBgdW5kZWZpbmVkYC5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldE1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeUdldE1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmdldE1ldGFkYXRhID0gZ2V0TWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBvbiB0aGUgdGFyZ2V0IG9iamVjdC5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBUaGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBrZXkgaWYgZm91bmQ7IG90aGVyd2lzZSwgYHVuZGVmaW5lZGAuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5nZXRPd25NZXRhZGF0YSA9IGdldE93bk1ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEga2V5cyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4uXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB1bmlxdWUgbWV0YWRhdGEga2V5cy5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRNZXRhZGF0YUtleXModGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlNZXRhZGF0YUtleXModGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMgPSBnZXRNZXRhZGF0YUtleXM7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIHRoZSB1bmlxdWUgbWV0YWRhdGEga2V5cyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0LlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdW5pcXVlIG1ldGFkYXRhIGtleXMuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0T3duTWV0YWRhdGFLZXlzKHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzID0gZ2V0T3duTWV0YWRhdGFLZXlzO1xyXG4gICAgLyoqXHJcbiAgICAgICogRGVsZXRlcyB0aGUgbWV0YWRhdGEgZW50cnkgZnJvbSB0aGUgdGFyZ2V0IG9iamVjdCB3aXRoIHRoZSBwcm92aWRlZCBrZXkuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBlbnRyeSB3YXMgZm91bmQgYW5kIGRlbGV0ZWQ7IG90aGVyd2lzZSwgZmFsc2UuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBkZWxldGVNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNkZWxldGVtZXRhZGF0YS1tZXRhZGF0YWtleS1wLVxyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAodGFyZ2V0LCB0YXJnZXRLZXksIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoIW1ldGFkYXRhTWFwLmRlbGV0ZShtZXRhZGF0YUtleSkpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAobWV0YWRhdGFNYXAuc2l6ZSA+IDApXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIHZhciB0YXJnZXRNZXRhZGF0YSA9IE1ldGFkYXRhLmdldCh0YXJnZXQpO1xyXG4gICAgICAgIHRhcmdldE1ldGFkYXRhLmRlbGV0ZSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIGlmICh0YXJnZXRNZXRhZGF0YS5zaXplID4gMClcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgTWV0YWRhdGEuZGVsZXRlKHRhcmdldCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhID0gZGVsZXRlTWV0YWRhdGE7XHJcbiAgICBmdW5jdGlvbiBEZWNvcmF0ZUNvbnN0cnVjdG9yKGRlY29yYXRvcnMsIHRhcmdldCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgIHZhciBkZWNvcmF0b3IgPSBkZWNvcmF0b3JzW2ldO1xyXG4gICAgICAgICAgICB2YXIgZGVjb3JhdGVkID0gZGVjb3JhdG9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQoZGVjb3JhdGVkKSAmJiAhSXNOdWxsKGRlY29yYXRlZCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghSXNDb25zdHJ1Y3RvcihkZWNvcmF0ZWQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGRlY29yYXRlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gRGVjb3JhdGVQcm9wZXJ0eShkZWNvcmF0b3JzLCB0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgdmFyIGRlY29yYXRvciA9IGRlY29yYXRvcnNbaV07XHJcbiAgICAgICAgICAgIHZhciBkZWNvcmF0ZWQgPSBkZWNvcmF0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcik7XHJcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQoZGVjb3JhdGVkKSAmJiAhSXNOdWxsKGRlY29yYXRlZCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QoZGVjb3JhdGVkKSlcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdG9yID0gZGVjb3JhdGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCBDcmVhdGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0TWV0YWRhdGEgPSBNZXRhZGF0YS5nZXQoTyk7XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKHRhcmdldE1ldGFkYXRhKSkge1xyXG4gICAgICAgICAgICBpZiAoIUNyZWF0ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHRhcmdldE1ldGFkYXRhID0gbmV3IF9NYXAoKTtcclxuICAgICAgICAgICAgTWV0YWRhdGEuc2V0KE8sIHRhcmdldE1ldGFkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gdGFyZ2V0TWV0YWRhdGEuZ2V0KFApO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpIHtcclxuICAgICAgICAgICAgaWYgKCFDcmVhdGUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBtZXRhZGF0YU1hcCA9IG5ldyBfTWFwKCk7XHJcbiAgICAgICAgICAgIHRhcmdldE1ldGFkYXRhLnNldChQLCBtZXRhZGF0YU1hcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtZXRhZGF0YU1hcDtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5IE9iamVjdCBJbnRlcm5hbCBNZXRob2RzIGFuZCBJbnRlcm5hbCBTbG90c1xyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnktb2JqZWN0LWludGVybmFsLW1ldGhvZHMtYW5kLWludGVybmFsLXNsb3RzXHJcbiAgICAvLyBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnloYXNtZXRhZGF0YS0tbWV0YWRhdGFrZXktby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xyXG4gICAgICAgIHZhciBoYXNPd24gPSBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcclxuICAgICAgICBpZiAoaGFzT3duKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcclxuICAgICAgICBpZiAoIUlzTnVsbChwYXJlbnQpKVxyXG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgcGFyZW50LCBQKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnloYXNvd25tZXRhZGF0YS0tbWV0YWRhdGFrZXktby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBUb0Jvb2xlYW4obWV0YWRhdGFNYXAuaGFzKE1ldGFkYXRhS2V5KSk7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnlnZXRtZXRhZGF0YS0tbWV0YWRhdGFrZXktby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xyXG4gICAgICAgIHZhciBoYXNPd24gPSBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcclxuICAgICAgICBpZiAoaGFzT3duKVxyXG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XHJcbiAgICAgICAgaWYgKCFJc051bGwocGFyZW50KSlcclxuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIHBhcmVudCwgUCk7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeWdldG93bm1ldGFkYXRhLS1tZXRhZGF0YWtleS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIHJldHVybiBtZXRhZGF0YU1hcC5nZXQoTWV0YWRhdGFLZXkpO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSwgTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5ZGVmaW5lb3dubWV0YWRhdGEtLW1ldGFkYXRha2V5LW1ldGFkYXRhdmFsdWUtby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSwgTywgUCkge1xyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypjcmVhdGUqLyB0cnVlKTtcclxuICAgICAgICBtZXRhZGF0YU1hcC5zZXQoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUpO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlNZXRhZGF0YUtleXMoTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5bWV0YWRhdGFrZXlzLS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeU1ldGFkYXRhS2V5cyhPLCBQKSB7XHJcbiAgICAgICAgdmFyIG93bktleXMgPSBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKTtcclxuICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcclxuICAgICAgICBpZiAocGFyZW50ID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gb3duS2V5cztcclxuICAgICAgICB2YXIgcGFyZW50S2V5cyA9IE9yZGluYXJ5TWV0YWRhdGFLZXlzKHBhcmVudCwgUCk7XHJcbiAgICAgICAgaWYgKHBhcmVudEtleXMubGVuZ3RoIDw9IDApXHJcbiAgICAgICAgICAgIHJldHVybiBvd25LZXlzO1xyXG4gICAgICAgIGlmIChvd25LZXlzLmxlbmd0aCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gcGFyZW50S2V5cztcclxuICAgICAgICB2YXIgc2V0ID0gbmV3IF9TZXQoKTtcclxuICAgICAgICB2YXIga2V5cyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgb3duS2V5c18xID0gb3duS2V5czsgX2kgPCBvd25LZXlzXzEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBvd25LZXlzXzFbX2ldO1xyXG4gICAgICAgICAgICB2YXIgaGFzS2V5ID0gc2V0LmhhcyhrZXkpO1xyXG4gICAgICAgICAgICBpZiAoIWhhc0tleSkge1xyXG4gICAgICAgICAgICAgICAgc2V0LmFkZChrZXkpO1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgX2EgPSAwLCBwYXJlbnRLZXlzXzEgPSBwYXJlbnRLZXlzOyBfYSA8IHBhcmVudEtleXNfMS5sZW5ndGg7IF9hKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IHBhcmVudEtleXNfMVtfYV07XHJcbiAgICAgICAgICAgIHZhciBoYXNLZXkgPSBzZXQuaGFzKGtleSk7XHJcbiAgICAgICAgICAgIGlmICghaGFzS2V5KSB7XHJcbiAgICAgICAgICAgICAgICBzZXQuYWRkKGtleSk7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ga2V5cztcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeW93bm1ldGFkYXRha2V5cy0tby1wLVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUCkge1xyXG4gICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxyXG4gICAgICAgICAgICByZXR1cm4ga2V5cztcclxuICAgICAgICB2YXIga2V5c09iaiA9IG1ldGFkYXRhTWFwLmtleXMoKTtcclxuICAgICAgICB2YXIgaXRlcmF0b3IgPSBHZXRJdGVyYXRvcihrZXlzT2JqKTtcclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmV4dCA9IEl0ZXJhdG9yU3RlcChpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5leHQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFZhbHVlID0gSXRlcmF0b3JWYWx1ZShuZXh0KTtcclxuICAgICAgICAgICAgICAgIGtleXMucHVzaChuZXh0VmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgSXRlcmF0b3JDbG9zZShpdGVyYXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgIEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gRUNNQVNjcmlwdCBTcGVjaWZpY2F0aW9uXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvXHJcbiAgICAvLyA2IEVDTUFTY3JpcHQgRGF0YSBUeXAwZXMgYW5kIFZhbHVlc1xyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1kYXRhLXR5cGVzLWFuZC12YWx1ZXNcclxuICAgIGZ1bmN0aW9uIFR5cGUoeCkge1xyXG4gICAgICAgIGlmICh4ID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gMSAvKiBOdWxsICovO1xyXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHgpIHtcclxuICAgICAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOiByZXR1cm4gMCAvKiBVbmRlZmluZWQgKi87XHJcbiAgICAgICAgICAgIGNhc2UgXCJib29sZWFuXCI6IHJldHVybiAyIC8qIEJvb2xlYW4gKi87XHJcbiAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjogcmV0dXJuIDMgLyogU3RyaW5nICovO1xyXG4gICAgICAgICAgICBjYXNlIFwic3ltYm9sXCI6IHJldHVybiA0IC8qIFN5bWJvbCAqLztcclxuICAgICAgICAgICAgY2FzZSBcIm51bWJlclwiOiByZXR1cm4gNSAvKiBOdW1iZXIgKi87XHJcbiAgICAgICAgICAgIGNhc2UgXCJvYmplY3RcIjogcmV0dXJuIHggPT09IG51bGwgPyAxIC8qIE51bGwgKi8gOiA2IC8qIE9iamVjdCAqLztcclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIDYgLyogT2JqZWN0ICovO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIDYuMS4xIFRoZSBVbmRlZmluZWQgVHlwZVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy11bmRlZmluZWQtdHlwZVxyXG4gICAgZnVuY3Rpb24gSXNVbmRlZmluZWQoeCkge1xyXG4gICAgICAgIHJldHVybiB4ID09PSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvLyA2LjEuMiBUaGUgTnVsbCBUeXBlXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLW51bGwtdHlwZVxyXG4gICAgZnVuY3Rpb24gSXNOdWxsKHgpIHtcclxuICAgICAgICByZXR1cm4geCA9PT0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIDYuMS41IFRoZSBTeW1ib2wgVHlwZVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy1zeW1ib2wtdHlwZVxyXG4gICAgZnVuY3Rpb24gSXNTeW1ib2woeCkge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIjtcclxuICAgIH1cclxuICAgIC8vIDYuMS43IFRoZSBPYmplY3QgVHlwZVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb2JqZWN0LXR5cGVcclxuICAgIGZ1bmN0aW9uIElzT2JqZWN0KHgpIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwib2JqZWN0XCIgPyB4ICE9PSBudWxsIDogdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIH1cclxuICAgIC8vIDcuMSBUeXBlIENvbnZlcnNpb25cclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXR5cGUtY29udmVyc2lvblxyXG4gICAgLy8gNy4xLjEgVG9QcmltaXRpdmUoaW5wdXQgWywgUHJlZmVycmVkVHlwZV0pXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3ByaW1pdGl2ZVxyXG4gICAgZnVuY3Rpb24gVG9QcmltaXRpdmUoaW5wdXQsIFByZWZlcnJlZFR5cGUpIHtcclxuICAgICAgICBzd2l0Y2ggKFR5cGUoaW5wdXQpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMCAvKiBVbmRlZmluZWQgKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgY2FzZSAxIC8qIE51bGwgKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgY2FzZSAyIC8qIEJvb2xlYW4gKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgY2FzZSAzIC8qIFN0cmluZyAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgICAgICBjYXNlIDQgLyogU3ltYm9sICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgICAgIGNhc2UgNSAvKiBOdW1iZXIgKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGhpbnQgPSBQcmVmZXJyZWRUeXBlID09PSAzIC8qIFN0cmluZyAqLyA/IFwic3RyaW5nXCIgOiBQcmVmZXJyZWRUeXBlID09PSA1IC8qIE51bWJlciAqLyA/IFwibnVtYmVyXCIgOiBcImRlZmF1bHRcIjtcclxuICAgICAgICB2YXIgZXhvdGljVG9QcmltID0gR2V0TWV0aG9kKGlucHV0LCB0b1ByaW1pdGl2ZVN5bWJvbCk7XHJcbiAgICAgICAgaWYgKGV4b3RpY1RvUHJpbSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBleG90aWNUb1ByaW0uY2FsbChpbnB1dCwgaGludCk7XHJcbiAgICAgICAgICAgIGlmIChJc09iamVjdChyZXN1bHQpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlUb1ByaW1pdGl2ZShpbnB1dCwgaGludCA9PT0gXCJkZWZhdWx0XCIgPyBcIm51bWJlclwiIDogaGludCk7XHJcbiAgICB9XHJcbiAgICAvLyA3LjEuMS4xIE9yZGluYXJ5VG9QcmltaXRpdmUoTywgaGludClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5dG9wcmltaXRpdmVcclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5VG9QcmltaXRpdmUoTywgaGludCkge1xyXG4gICAgICAgIGlmIChoaW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciB0b1N0cmluZ18xID0gTy50b1N0cmluZztcclxuICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodG9TdHJpbmdfMSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0b1N0cmluZ18xLmNhbGwoTyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdmFsdWVPZiA9IE8udmFsdWVPZjtcclxuICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodmFsdWVPZikpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWx1ZU9mLmNhbGwoTyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlT2YgPSBPLnZhbHVlT2Y7XHJcbiAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHZhbHVlT2YpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVPZi5jYWxsKE8pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHRvU3RyaW5nXzIgPSBPLnRvU3RyaW5nO1xyXG4gICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh0b1N0cmluZ18yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRvU3RyaW5nXzIuY2FsbChPKTtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgIH1cclxuICAgIC8vIDcuMS4yIFRvQm9vbGVhbihhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8yMDE2LyNzZWMtdG9ib29sZWFuXHJcbiAgICBmdW5jdGlvbiBUb0Jvb2xlYW4oYXJndW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gISFhcmd1bWVudDtcclxuICAgIH1cclxuICAgIC8vIDcuMS4xMiBUb1N0cmluZyhhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvc3RyaW5nXHJcbiAgICBmdW5jdGlvbiBUb1N0cmluZyhhcmd1bWVudCkge1xyXG4gICAgICAgIHJldHVybiBcIlwiICsgYXJndW1lbnQ7XHJcbiAgICB9XHJcbiAgICAvLyA3LjEuMTQgVG9Qcm9wZXJ0eUtleShhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvcHJvcGVydHlrZXlcclxuICAgIGZ1bmN0aW9uIFRvUHJvcGVydHlLZXkoYXJndW1lbnQpIHtcclxuICAgICAgICB2YXIga2V5ID0gVG9QcmltaXRpdmUoYXJndW1lbnQsIDMgLyogU3RyaW5nICovKTtcclxuICAgICAgICBpZiAoSXNTeW1ib2woa2V5KSlcclxuICAgICAgICAgICAgcmV0dXJuIGtleTtcclxuICAgICAgICByZXR1cm4gVG9TdHJpbmcoa2V5KTtcclxuICAgIH1cclxuICAgIC8vIDcuMiBUZXN0aW5nIGFuZCBDb21wYXJpc29uIE9wZXJhdGlvbnNcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRlc3RpbmctYW5kLWNvbXBhcmlzb24tb3BlcmF0aW9uc1xyXG4gICAgLy8gNy4yLjIgSXNBcnJheShhcmd1bWVudClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzYXJyYXlcclxuICAgIGZ1bmN0aW9uIElzQXJyYXkoYXJndW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheVxyXG4gICAgICAgICAgICA/IEFycmF5LmlzQXJyYXkoYXJndW1lbnQpXHJcbiAgICAgICAgICAgIDogYXJndW1lbnQgaW5zdGFuY2VvZiBPYmplY3RcclxuICAgICAgICAgICAgICAgID8gYXJndW1lbnQgaW5zdGFuY2VvZiBBcnJheVxyXG4gICAgICAgICAgICAgICAgOiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnQpID09PSBcIltvYmplY3QgQXJyYXldXCI7XHJcbiAgICB9XHJcbiAgICAvLyA3LjIuMyBJc0NhbGxhYmxlKGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNjYWxsYWJsZVxyXG4gICAgZnVuY3Rpb24gSXNDYWxsYWJsZShhcmd1bWVudCkge1xyXG4gICAgICAgIC8vIE5PVEU6IFRoaXMgaXMgYW4gYXBwcm94aW1hdGlvbiBhcyB3ZSBjYW5ub3QgY2hlY2sgZm9yIFtbQ2FsbF1dIGludGVybmFsIG1ldGhvZC5cclxuICAgICAgICByZXR1cm4gdHlwZW9mIGFyZ3VtZW50ID09PSBcImZ1bmN0aW9uXCI7XHJcbiAgICB9XHJcbiAgICAvLyA3LjIuNCBJc0NvbnN0cnVjdG9yKGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNjb25zdHJ1Y3RvclxyXG4gICAgZnVuY3Rpb24gSXNDb25zdHJ1Y3Rvcihhcmd1bWVudCkge1xyXG4gICAgICAgIC8vIE5PVEU6IFRoaXMgaXMgYW4gYXBwcm94aW1hdGlvbiBhcyB3ZSBjYW5ub3QgY2hlY2sgZm9yIFtbQ29uc3RydWN0XV0gaW50ZXJuYWwgbWV0aG9kLlxyXG4gICAgICAgIHJldHVybiB0eXBlb2YgYXJndW1lbnQgPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIH1cclxuICAgIC8vIDcuMyBPcGVyYXRpb25zIG9uIE9iamVjdHNcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9wZXJhdGlvbnMtb24tb2JqZWN0c1xyXG4gICAgLy8gNy4zLjkgR2V0TWV0aG9kKFYsIFApXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1nZXRtZXRob2RcclxuICAgIGZ1bmN0aW9uIEdldE1ldGhvZChWLCBQKSB7XHJcbiAgICAgICAgdmFyIGZ1bmMgPSBWW1BdO1xyXG4gICAgICAgIGlmIChmdW5jID09PSB1bmRlZmluZWQgfHwgZnVuYyA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAoIUlzQ2FsbGFibGUoZnVuYykpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIC8vIDcuNCBPcGVyYXRpb25zIG9uIEl0ZXJhdG9yIE9iamVjdHNcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9wZXJhdGlvbnMtb24taXRlcmF0b3Itb2JqZWN0c1xyXG4gICAgZnVuY3Rpb24gR2V0SXRlcmF0b3Iob2JqKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IEdldE1ldGhvZChvYmosIGl0ZXJhdG9yU3ltYm9sKTtcclxuICAgICAgICBpZiAoIUlzQ2FsbGFibGUobWV0aG9kKSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpOyAvLyBmcm9tIENhbGxcclxuICAgICAgICB2YXIgaXRlcmF0b3IgPSBtZXRob2QuY2FsbChvYmopO1xyXG4gICAgICAgIGlmICghSXNPYmplY3QoaXRlcmF0b3IpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xyXG4gICAgfVxyXG4gICAgLy8gNy40LjQgSXRlcmF0b3JWYWx1ZShpdGVyUmVzdWx0KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLzIwMTYvI3NlYy1pdGVyYXRvcnZhbHVlXHJcbiAgICBmdW5jdGlvbiBJdGVyYXRvclZhbHVlKGl0ZXJSZXN1bHQpIHtcclxuICAgICAgICByZXR1cm4gaXRlclJlc3VsdC52YWx1ZTtcclxuICAgIH1cclxuICAgIC8vIDcuNC41IEl0ZXJhdG9yU3RlcChpdGVyYXRvcilcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWl0ZXJhdG9yc3RlcFxyXG4gICAgZnVuY3Rpb24gSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0LmRvbmUgPyBmYWxzZSA6IHJlc3VsdDtcclxuICAgIH1cclxuICAgIC8vIDcuNC42IEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IsIGNvbXBsZXRpb24pXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pdGVyYXRvcmNsb3NlXHJcbiAgICBmdW5jdGlvbiBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIGYgPSBpdGVyYXRvcltcInJldHVyblwiXTtcclxuICAgICAgICBpZiAoZilcclxuICAgICAgICAgICAgZi5jYWxsKGl0ZXJhdG9yKTtcclxuICAgIH1cclxuICAgIC8vIDkuMSBPcmRpbmFyeSBPYmplY3QgSW50ZXJuYWwgTWV0aG9kcyBhbmQgSW50ZXJuYWwgU2xvdHNcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5LW9iamVjdC1pbnRlcm5hbC1tZXRob2RzLWFuZC1pbnRlcm5hbC1zbG90c1xyXG4gICAgLy8gOS4xLjEuMSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeWdldHByb3RvdHlwZW9mXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pIHtcclxuICAgICAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTyk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBPICE9PSBcImZ1bmN0aW9uXCIgfHwgTyA9PT0gZnVuY3Rpb25Qcm90b3R5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcclxuICAgICAgICAvLyBUeXBlU2NyaXB0IGRvZXNuJ3Qgc2V0IF9fcHJvdG9fXyBpbiBFUzUsIGFzIGl0J3Mgbm9uLXN0YW5kYXJkLlxyXG4gICAgICAgIC8vIFRyeSB0byBkZXRlcm1pbmUgdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IuIENvbXBhdGlibGUgaW1wbGVtZW50YXRpb25zXHJcbiAgICAgICAgLy8gbXVzdCBlaXRoZXIgc2V0IF9fcHJvdG9fXyBvbiBhIHN1YmNsYXNzIGNvbnN0cnVjdG9yIHRvIHRoZSBzdXBlcmNsYXNzIGNvbnN0cnVjdG9yLFxyXG4gICAgICAgIC8vIG9yIGVuc3VyZSBlYWNoIGNsYXNzIGhhcyBhIHZhbGlkIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgb24gaXRzIHByb3RvdHlwZSB0aGF0XHJcbiAgICAgICAgLy8gcG9pbnRzIGJhY2sgdG8gdGhlIGNvbnN0cnVjdG9yLlxyXG4gICAgICAgIC8vIElmIHRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIEZ1bmN0aW9uLltbUHJvdG90eXBlXV0sIHRoZW4gdGhpcyBpcyBkZWZpbmF0ZWx5IGluaGVyaXRlZC5cclxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBjYXNlIHdoZW4gaW4gRVM2IG9yIHdoZW4gdXNpbmcgX19wcm90b19fIGluIGEgY29tcGF0aWJsZSBicm93c2VyLlxyXG4gICAgICAgIGlmIChwcm90byAhPT0gZnVuY3Rpb25Qcm90b3R5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcclxuICAgICAgICAvLyBJZiB0aGUgc3VwZXIgcHJvdG90eXBlIGlzIE9iamVjdC5wcm90b3R5cGUsIG51bGwsIG9yIHVuZGVmaW5lZCwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cclxuICAgICAgICB2YXIgcHJvdG90eXBlID0gTy5wcm90b3R5cGU7XHJcbiAgICAgICAgdmFyIHByb3RvdHlwZVByb3RvID0gcHJvdG90eXBlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90b3R5cGUpO1xyXG4gICAgICAgIGlmIChwcm90b3R5cGVQcm90byA9PSBudWxsIHx8IHByb3RvdHlwZVByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvdG87XHJcbiAgICAgICAgLy8gSWYgdGhlIGNvbnN0cnVjdG9yIHdhcyBub3QgYSBmdW5jdGlvbiwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cclxuICAgICAgICB2YXIgY29uc3RydWN0b3IgPSBwcm90b3R5cGVQcm90by5jb25zdHJ1Y3RvcjtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbnN0cnVjdG9yICE9PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcclxuICAgICAgICAvLyBJZiB3ZSBoYXZlIHNvbWUga2luZCBvZiBzZWxmLXJlZmVyZW5jZSwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cclxuICAgICAgICBpZiAoY29uc3RydWN0b3IgPT09IE8pXHJcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcclxuICAgICAgICAvLyB3ZSBoYXZlIGEgcHJldHR5IGdvb2QgZ3Vlc3MgYXQgdGhlIGhlcml0YWdlLlxyXG4gICAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcclxuICAgIH1cclxuICAgIC8vIG5haXZlIE1hcCBzaGltXHJcbiAgICBmdW5jdGlvbiBDcmVhdGVNYXBQb2x5ZmlsbCgpIHtcclxuICAgICAgICB2YXIgY2FjaGVTZW50aW5lbCA9IHt9O1xyXG4gICAgICAgIHZhciBhcnJheVNlbnRpbmVsID0gW107XHJcbiAgICAgICAgdmFyIE1hcEl0ZXJhdG9yID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gTWFwSXRlcmF0b3Ioa2V5cywgdmFsdWVzLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGtleXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9O1xyXG4gICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfTtcclxuICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9pbmRleDtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy5fa2V5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fc2VsZWN0b3IodGhpcy5fa2V5c1tpbmRleF0sIHRoaXMuX3ZhbHVlc1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCArIDEgPj0gdGhpcy5fa2V5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogcmVzdWx0LCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUudGhyb3cgPSBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS5yZXR1cm4gPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHZhbHVlLCBkb25lOiB0cnVlIH07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBNYXBJdGVyYXRvcjtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBNYXAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwLnByb3RvdHlwZSwgXCJzaXplXCIsIHtcclxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fa2V5cy5sZW5ndGg7IH0sXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKSA+PSAwOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAwID8gdGhpcy5fdmFsdWVzW2luZGV4XSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0gdGhpcy5fa2V5cy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGluZGV4ICsgMTsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzW2kgLSAxXSA9IHRoaXMuX2tleXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlc1tpIC0gMV0gPSB0aGlzLl92YWx1ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMubGVuZ3RoLS07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aC0tO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHRoaXMuX2NhY2hlS2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRLZXkpOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldFZhbHVlKTsgfTtcclxuICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0RW50cnkpOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuZW50cmllcygpOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuZW50cmllcygpOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLl9maW5kID0gZnVuY3Rpb24gKGtleSwgaW5zZXJ0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVLZXkgPT09IGtleSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FjaGVJbmRleDtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2tleXMuaW5kZXhPZihrZXkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMCAmJiBpbnNlcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHRoaXMuX2tleXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5wdXNoKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FjaGVLZXkgPSBrZXksIHRoaXMuX2NhY2hlSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIE1hcDtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGdldEtleShrZXksIF8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VmFsdWUoXywgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRFbnRyeShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBba2V5LCB2YWx1ZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gbmFpdmUgU2V0IHNoaW1cclxuICAgIGZ1bmN0aW9uIENyZWF0ZVNldFBvbHlmaWxsKCkge1xyXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBTZXQoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXAgPSBuZXcgX01hcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTZXQucHJvdG90eXBlLCBcInNpemVcIiwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAuc2l6ZTsgfSxcclxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuaGFzKHZhbHVlKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5zZXQodmFsdWUsIHZhbHVlKSwgdGhpczsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5kZWxldGUodmFsdWUpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkgeyB0aGlzLl9tYXAuY2xlYXIoKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLmtleXMoKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAudmFsdWVzKCk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5lbnRyaWVzKCk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5rZXlzKCk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5rZXlzKCk7IH07XHJcbiAgICAgICAgICAgIHJldHVybiBTZXQ7XHJcbiAgICAgICAgfSgpKTtcclxuICAgIH1cclxuICAgIC8vIG5haXZlIFdlYWtNYXAgc2hpbVxyXG4gICAgZnVuY3Rpb24gQ3JlYXRlV2Vha01hcFBvbHlmaWxsKCkge1xyXG4gICAgICAgIHZhciBVVUlEX1NJWkUgPSAxNjtcclxuICAgICAgICB2YXIga2V5cyA9IGNyZWF0ZURpY3Rpb25hcnkoKTtcclxuICAgICAgICB2YXIgcm9vdEtleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xyXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBXZWFrTWFwKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gSGFzaE1hcC5oYXModGFibGUsIHRoaXMuX2tleSkgOiBmYWxzZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gSGFzaE1hcC5nZXQodGFibGUsIHRoaXMuX2tleSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh0YXJnZXQsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB0YWJsZVt0aGlzLl9rZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gZGVsZXRlIHRhYmxlW3RoaXMuX2tleV0gOiBmYWxzZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiBub3QgYSByZWFsIGNsZWFyLCBqdXN0IG1ha2VzIHRoZSBwcmV2aW91cyBkYXRhIHVucmVhY2hhYmxlXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFdlYWtNYXA7XHJcbiAgICAgICAgfSgpKTtcclxuICAgICAgICBmdW5jdGlvbiBDcmVhdGVVbmlxdWVLZXkoKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXk7XHJcbiAgICAgICAgICAgIGRvXHJcbiAgICAgICAgICAgICAgICBrZXkgPSBcIkBAV2Vha01hcEBAXCIgKyBDcmVhdGVVVUlEKCk7XHJcbiAgICAgICAgICAgIHdoaWxlIChIYXNoTWFwLmhhcyhrZXlzLCBrZXkpKTtcclxuICAgICAgICAgICAga2V5c1trZXldID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGtleTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCBjcmVhdGUpIHtcclxuICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbCh0YXJnZXQsIHJvb3RLZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNyZWF0ZSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcm9vdEtleSwgeyB2YWx1ZTogY3JlYXRlRGljdGlvbmFyeSgpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbcm9vdEtleV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEZpbGxSYW5kb21CeXRlcyhidWZmZXIsIHNpemUpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyArK2kpXHJcbiAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSBNYXRoLnJhbmRvbSgpICogMHhmZiB8IDA7XHJcbiAgICAgICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEdlblJhbmRvbUJ5dGVzKHNpemUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBVaW50OEFycmF5ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHNpemUpKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbXNDcnlwdG8gIT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1zQ3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShzaXplKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRmlsbFJhbmRvbUJ5dGVzKG5ldyBVaW50OEFycmF5KHNpemUpLCBzaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gRmlsbFJhbmRvbUJ5dGVzKG5ldyBBcnJheShzaXplKSwgc2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIENyZWF0ZVVVSUQoKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gR2VuUmFuZG9tQnl0ZXMoVVVJRF9TSVpFKTtcclxuICAgICAgICAgICAgLy8gbWFyayBhcyByYW5kb20gLSBSRkMgNDEyMiDCpyA0LjRcclxuICAgICAgICAgICAgZGF0YVs2XSA9IGRhdGFbNl0gJiAweDRmIHwgMHg0MDtcclxuICAgICAgICAgICAgZGF0YVs4XSA9IGRhdGFbOF0gJiAweGJmIHwgMHg4MDtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGZvciAodmFyIG9mZnNldCA9IDA7IG9mZnNldCA8IFVVSURfU0laRTsgKytvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBieXRlID0gZGF0YVtvZmZzZXRdO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gNCB8fCBvZmZzZXQgPT09IDYgfHwgb2Zmc2V0ID09PSA4KVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIi1cIjtcclxuICAgICAgICAgICAgICAgIGlmIChieXRlIDwgMTYpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IGJ5dGUudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyB1c2VzIGEgaGV1cmlzdGljIHVzZWQgYnkgdjggYW5kIGNoYWtyYSB0byBmb3JjZSBhbiBvYmplY3QgaW50byBkaWN0aW9uYXJ5IG1vZGUuXHJcbiAgICBmdW5jdGlvbiBNYWtlRGljdGlvbmFyeShvYmopIHtcclxuICAgICAgICBvYmouX18gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgZGVsZXRlIG9iai5fXztcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG4gICAgLy8gcGF0Y2ggZ2xvYmFsIFJlZmxlY3RcclxuICAgIChmdW5jdGlvbiAoX19nbG9iYWwpIHtcclxuICAgICAgICBpZiAodHlwZW9mIF9fZ2xvYmFsLlJlZmxlY3QgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgaWYgKF9fZ2xvYmFsLlJlZmxlY3QgIT09IFJlZmxlY3QpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gUmVmbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChSZWZsZWN0LCBwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfX2dsb2JhbC5SZWZsZWN0W3BdID0gUmVmbGVjdFtwXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIF9fZ2xvYmFsLlJlZmxlY3QgPSBSZWZsZWN0O1xyXG4gICAgICAgIH1cclxuICAgIH0pKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOlxyXG4gICAgICAgIHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6XHJcbiAgICAgICAgICAgIEZ1bmN0aW9uKFwicmV0dXJuIHRoaXM7XCIpKCkpO1xyXG59KShSZWZsZWN0IHx8IChSZWZsZWN0ID0ge30pKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVmbGVjdC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2luZGV4Jyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByYW5kb21Gcm9tU2VlZCA9IHJlcXVpcmUoJy4vcmFuZG9tL3JhbmRvbS1mcm9tLXNlZWQnKTtcblxudmFyIE9SSUdJTkFMID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXy0nO1xudmFyIGFscGhhYmV0O1xudmFyIHByZXZpb3VzU2VlZDtcblxudmFyIHNodWZmbGVkO1xuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgICBzaHVmZmxlZCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzZXRDaGFyYWN0ZXJzKF9hbHBoYWJldF8pIHtcbiAgICBpZiAoIV9hbHBoYWJldF8pIHtcbiAgICAgICAgaWYgKGFscGhhYmV0ICE9PSBPUklHSU5BTCkge1xuICAgICAgICAgICAgYWxwaGFiZXQgPSBPUklHSU5BTDtcbiAgICAgICAgICAgIHJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChfYWxwaGFiZXRfID09PSBhbHBoYWJldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKF9hbHBoYWJldF8ubGVuZ3RoICE9PSBPUklHSU5BTC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDdXN0b20gYWxwaGFiZXQgZm9yIHNob3J0aWQgbXVzdCBiZSAnICsgT1JJR0lOQUwubGVuZ3RoICsgJyB1bmlxdWUgY2hhcmFjdGVycy4gWW91IHN1Ym1pdHRlZCAnICsgX2FscGhhYmV0Xy5sZW5ndGggKyAnIGNoYXJhY3RlcnM6ICcgKyBfYWxwaGFiZXRfKTtcbiAgICB9XG5cbiAgICB2YXIgdW5pcXVlID0gX2FscGhhYmV0Xy5zcGxpdCgnJykuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIGluZCwgYXJyKXtcbiAgICAgICByZXR1cm4gaW5kICE9PSBhcnIubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfSk7XG5cbiAgICBpZiAodW5pcXVlLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0N1c3RvbSBhbHBoYWJldCBmb3Igc2hvcnRpZCBtdXN0IGJlICcgKyBPUklHSU5BTC5sZW5ndGggKyAnIHVuaXF1ZSBjaGFyYWN0ZXJzLiBUaGVzZSBjaGFyYWN0ZXJzIHdlcmUgbm90IHVuaXF1ZTogJyArIHVuaXF1ZS5qb2luKCcsICcpKTtcbiAgICB9XG5cbiAgICBhbHBoYWJldCA9IF9hbHBoYWJldF87XG4gICAgcmVzZXQoKTtcbn1cblxuZnVuY3Rpb24gY2hhcmFjdGVycyhfYWxwaGFiZXRfKSB7XG4gICAgc2V0Q2hhcmFjdGVycyhfYWxwaGFiZXRfKTtcbiAgICByZXR1cm4gYWxwaGFiZXQ7XG59XG5cbmZ1bmN0aW9uIHNldFNlZWQoc2VlZCkge1xuICAgIHJhbmRvbUZyb21TZWVkLnNlZWQoc2VlZCk7XG4gICAgaWYgKHByZXZpb3VzU2VlZCAhPT0gc2VlZCkge1xuICAgICAgICByZXNldCgpO1xuICAgICAgICBwcmV2aW91c1NlZWQgPSBzZWVkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2h1ZmZsZSgpIHtcbiAgICBpZiAoIWFscGhhYmV0KSB7XG4gICAgICAgIHNldENoYXJhY3RlcnMoT1JJR0lOQUwpO1xuICAgIH1cblxuICAgIHZhciBzb3VyY2VBcnJheSA9IGFscGhhYmV0LnNwbGl0KCcnKTtcbiAgICB2YXIgdGFyZ2V0QXJyYXkgPSBbXTtcbiAgICB2YXIgciA9IHJhbmRvbUZyb21TZWVkLm5leHRWYWx1ZSgpO1xuICAgIHZhciBjaGFyYWN0ZXJJbmRleDtcblxuICAgIHdoaWxlIChzb3VyY2VBcnJheS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHIgPSByYW5kb21Gcm9tU2VlZC5uZXh0VmFsdWUoKTtcbiAgICAgICAgY2hhcmFjdGVySW5kZXggPSBNYXRoLmZsb29yKHIgKiBzb3VyY2VBcnJheS5sZW5ndGgpO1xuICAgICAgICB0YXJnZXRBcnJheS5wdXNoKHNvdXJjZUFycmF5LnNwbGljZShjaGFyYWN0ZXJJbmRleCwgMSlbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0QXJyYXkuam9pbignJyk7XG59XG5cbmZ1bmN0aW9uIGdldFNodWZmbGVkKCkge1xuICAgIGlmIChzaHVmZmxlZCkge1xuICAgICAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gICAgfVxuICAgIHNodWZmbGVkID0gc2h1ZmZsZSgpO1xuICAgIHJldHVybiBzaHVmZmxlZDtcbn1cblxuLyoqXG4gKiBsb29rdXAgc2h1ZmZsZWQgbGV0dGVyXG4gKiBAcGFyYW0gaW5kZXhcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGxvb2t1cChpbmRleCkge1xuICAgIHZhciBhbHBoYWJldFNodWZmbGVkID0gZ2V0U2h1ZmZsZWQoKTtcbiAgICByZXR1cm4gYWxwaGFiZXRTaHVmZmxlZFtpbmRleF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNoYXJhY3RlcnM6IGNoYXJhY3RlcnMsXG4gICAgc2VlZDogc2V0U2VlZCxcbiAgICBsb29rdXA6IGxvb2t1cCxcbiAgICBzaHVmZmxlZDogZ2V0U2h1ZmZsZWRcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgYWxwaGFiZXQgPSByZXF1aXJlKCcuL2FscGhhYmV0Jyk7XG5cbi8qKlxuICogRGVjb2RlIHRoZSBpZCB0byBnZXQgdGhlIHZlcnNpb24gYW5kIHdvcmtlclxuICogTWFpbmx5IGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcuXG4gKiBAcGFyYW0gaWQgLSB0aGUgc2hvcnRpZC1nZW5lcmF0ZWQgaWQuXG4gKi9cbmZ1bmN0aW9uIGRlY29kZShpZCkge1xuICAgIHZhciBjaGFyYWN0ZXJzID0gYWxwaGFiZXQuc2h1ZmZsZWQoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBjaGFyYWN0ZXJzLmluZGV4T2YoaWQuc3Vic3RyKDAsIDEpKSAmIDB4MGYsXG4gICAgICAgIHdvcmtlcjogY2hhcmFjdGVycy5pbmRleE9mKGlkLnN1YnN0cigxLCAxKSkgJiAweDBmXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWNvZGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByYW5kb21CeXRlID0gcmVxdWlyZSgnLi9yYW5kb20vcmFuZG9tLWJ5dGUnKTtcblxuZnVuY3Rpb24gZW5jb2RlKGxvb2t1cCwgbnVtYmVyKSB7XG4gICAgdmFyIGxvb3BDb3VudGVyID0gMDtcbiAgICB2YXIgZG9uZTtcblxuICAgIHZhciBzdHIgPSAnJztcblxuICAgIHdoaWxlICghZG9uZSkge1xuICAgICAgICBzdHIgPSBzdHIgKyBsb29rdXAoICggKG51bWJlciA+PiAoNCAqIGxvb3BDb3VudGVyKSkgJiAweDBmICkgfCByYW5kb21CeXRlKCkgKTtcbiAgICAgICAgZG9uZSA9IG51bWJlciA8IChNYXRoLnBvdygxNiwgbG9vcENvdW50ZXIgKyAxICkgKTtcbiAgICAgICAgbG9vcENvdW50ZXIrKztcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlbmNvZGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhbHBoYWJldCA9IHJlcXVpcmUoJy4vYWxwaGFiZXQnKTtcbnZhciBlbmNvZGUgPSByZXF1aXJlKCcuL2VuY29kZScpO1xudmFyIGRlY29kZSA9IHJlcXVpcmUoJy4vZGVjb2RlJyk7XG52YXIgaXNWYWxpZCA9IHJlcXVpcmUoJy4vaXMtdmFsaWQnKTtcblxuLy8gSWdub3JlIGFsbCBtaWxsaXNlY29uZHMgYmVmb3JlIGEgY2VydGFpbiB0aW1lIHRvIHJlZHVjZSB0aGUgc2l6ZSBvZiB0aGUgZGF0ZSBlbnRyb3B5IHdpdGhvdXQgc2FjcmlmaWNpbmcgdW5pcXVlbmVzcy5cbi8vIFRoaXMgbnVtYmVyIHNob3VsZCBiZSB1cGRhdGVkIGV2ZXJ5IHllYXIgb3Igc28gdG8ga2VlcCB0aGUgZ2VuZXJhdGVkIGlkIHNob3J0LlxuLy8gVG8gcmVnZW5lcmF0ZSBgbmV3IERhdGUoKSAtIDBgIGFuZCBidW1wIHRoZSB2ZXJzaW9uLiBBbHdheXMgYnVtcCB0aGUgdmVyc2lvbiFcbnZhciBSRURVQ0VfVElNRSA9IDE0NTk3MDc2MDY1MTg7XG5cbi8vIGRvbid0IGNoYW5nZSB1bmxlc3Mgd2UgY2hhbmdlIHRoZSBhbGdvcyBvciBSRURVQ0VfVElNRVxuLy8gbXVzdCBiZSBhbiBpbnRlZ2VyIGFuZCBsZXNzIHRoYW4gMTZcbnZhciB2ZXJzaW9uID0gNjtcblxuLy8gaWYgeW91IGFyZSB1c2luZyBjbHVzdGVyIG9yIG11bHRpcGxlIHNlcnZlcnMgdXNlIHRoaXMgdG8gbWFrZSBlYWNoIGluc3RhbmNlXG4vLyBoYXMgYSB1bmlxdWUgdmFsdWUgZm9yIHdvcmtlclxuLy8gTm90ZTogSSBkb24ndCBrbm93IGlmIHRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQgd2hlbiB1c2luZyB0aGlyZFxuLy8gcGFydHkgY2x1c3RlciBzb2x1dGlvbnMgc3VjaCBhcyBwbTIuXG52YXIgY2x1c3RlcldvcmtlcklkID0gcmVxdWlyZSgnLi91dGlsL2NsdXN0ZXItd29ya2VyLWlkJykgfHwgMDtcblxuLy8gQ291bnRlciBpcyB1c2VkIHdoZW4gc2hvcnRpZCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgaW4gb25lIHNlY29uZC5cbnZhciBjb3VudGVyO1xuXG4vLyBSZW1lbWJlciB0aGUgbGFzdCB0aW1lIHNob3J0aWQgd2FzIGNhbGxlZCBpbiBjYXNlIGNvdW50ZXIgaXMgbmVlZGVkLlxudmFyIHByZXZpb3VzU2Vjb25kcztcblxuLyoqXG4gKiBHZW5lcmF0ZSB1bmlxdWUgaWRcbiAqIFJldHVybnMgc3RyaW5nIGlkXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlKCkge1xuXG4gICAgdmFyIHN0ciA9ICcnO1xuXG4gICAgdmFyIHNlY29uZHMgPSBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gUkVEVUNFX1RJTUUpICogMC4wMDEpO1xuXG4gICAgaWYgKHNlY29uZHMgPT09IHByZXZpb3VzU2Vjb25kcykge1xuICAgICAgICBjb3VudGVyKys7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlciA9IDA7XG4gICAgICAgIHByZXZpb3VzU2Vjb25kcyA9IHNlY29uZHM7XG4gICAgfVxuXG4gICAgc3RyID0gc3RyICsgZW5jb2RlKGFscGhhYmV0Lmxvb2t1cCwgdmVyc2lvbik7XG4gICAgc3RyID0gc3RyICsgZW5jb2RlKGFscGhhYmV0Lmxvb2t1cCwgY2x1c3RlcldvcmtlcklkKTtcbiAgICBpZiAoY291bnRlciA+IDApIHtcbiAgICAgICAgc3RyID0gc3RyICsgZW5jb2RlKGFscGhhYmV0Lmxvb2t1cCwgY291bnRlcik7XG4gICAgfVxuICAgIHN0ciA9IHN0ciArIGVuY29kZShhbHBoYWJldC5sb29rdXAsIHNlY29uZHMpO1xuXG4gICAgcmV0dXJuIHN0cjtcbn1cblxuXG4vKipcbiAqIFNldCB0aGUgc2VlZC5cbiAqIEhpZ2hseSByZWNvbW1lbmRlZCBpZiB5b3UgZG9uJ3Qgd2FudCBwZW9wbGUgdG8gdHJ5IHRvIGZpZ3VyZSBvdXQgeW91ciBpZCBzY2hlbWEuXG4gKiBleHBvc2VkIGFzIHNob3J0aWQuc2VlZChpbnQpXG4gKiBAcGFyYW0gc2VlZCBJbnRlZ2VyIHZhbHVlIHRvIHNlZWQgdGhlIHJhbmRvbSBhbHBoYWJldC4gIEFMV0FZUyBVU0UgVEhFIFNBTUUgU0VFRCBvciB5b3UgbWlnaHQgZ2V0IG92ZXJsYXBzLlxuICovXG5mdW5jdGlvbiBzZWVkKHNlZWRWYWx1ZSkge1xuICAgIGFscGhhYmV0LnNlZWQoc2VlZFZhbHVlKTtcbiAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8qKlxuICogU2V0IHRoZSBjbHVzdGVyIHdvcmtlciBvciBtYWNoaW5lIGlkXG4gKiBleHBvc2VkIGFzIHNob3J0aWQud29ya2VyKGludClcbiAqIEBwYXJhbSB3b3JrZXJJZCB3b3JrZXIgbXVzdCBiZSBwb3NpdGl2ZSBpbnRlZ2VyLiAgTnVtYmVyIGxlc3MgdGhhbiAxNiBpcyByZWNvbW1lbmRlZC5cbiAqIHJldHVybnMgc2hvcnRpZCBtb2R1bGUgc28gaXQgY2FuIGJlIGNoYWluZWQuXG4gKi9cbmZ1bmN0aW9uIHdvcmtlcih3b3JrZXJJZCkge1xuICAgIGNsdXN0ZXJXb3JrZXJJZCA9IHdvcmtlcklkO1xuICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLyoqXG4gKlxuICogc2V0cyBuZXcgY2hhcmFjdGVycyB0byB1c2UgaW4gdGhlIGFscGhhYmV0XG4gKiByZXR1cm5zIHRoZSBzaHVmZmxlZCBhbHBoYWJldFxuICovXG5mdW5jdGlvbiBjaGFyYWN0ZXJzKG5ld0NoYXJhY3RlcnMpIHtcbiAgICBpZiAobmV3Q2hhcmFjdGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFscGhhYmV0LmNoYXJhY3RlcnMobmV3Q2hhcmFjdGVycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFscGhhYmV0LnNodWZmbGVkKCk7XG59XG5cblxuLy8gRXhwb3J0IGFsbCBvdGhlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcyBvZiB0aGUgZ2VuZXJhdGUgZnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzID0gZ2VuZXJhdGU7XG5tb2R1bGUuZXhwb3J0cy5nZW5lcmF0ZSA9IGdlbmVyYXRlO1xubW9kdWxlLmV4cG9ydHMuc2VlZCA9IHNlZWQ7XG5tb2R1bGUuZXhwb3J0cy53b3JrZXIgPSB3b3JrZXI7XG5tb2R1bGUuZXhwb3J0cy5jaGFyYWN0ZXJzID0gY2hhcmFjdGVycztcbm1vZHVsZS5leHBvcnRzLmRlY29kZSA9IGRlY29kZTtcbm1vZHVsZS5leHBvcnRzLmlzVmFsaWQgPSBpc1ZhbGlkO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFscGhhYmV0ID0gcmVxdWlyZSgnLi9hbHBoYWJldCcpO1xuXG5mdW5jdGlvbiBpc1Nob3J0SWQoaWQpIHtcbiAgICBpZiAoIWlkIHx8IHR5cGVvZiBpZCAhPT0gJ3N0cmluZycgfHwgaWQubGVuZ3RoIDwgNiApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBjaGFyYWN0ZXJzID0gYWxwaGFiZXQuY2hhcmFjdGVycygpO1xuICAgIHZhciBsZW4gPSBpZC5sZW5ndGg7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbjtpKyspIHtcbiAgICAgICAgaWYgKGNoYXJhY3RlcnMuaW5kZXhPZihpZFtpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTaG9ydElkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3J5cHRvID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgKHdpbmRvdy5jcnlwdG8gfHwgd2luZG93Lm1zQ3J5cHRvKTsgLy8gSUUgMTEgdXNlcyB3aW5kb3cubXNDcnlwdG9cblxuZnVuY3Rpb24gcmFuZG9tQnl0ZSgpIHtcbiAgICBpZiAoIWNyeXB0byB8fCAhY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU2KSAmIDB4MzA7XG4gICAgfVxuICAgIHZhciBkZXN0ID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhkZXN0KTtcbiAgICByZXR1cm4gZGVzdFswXSAmIDB4MzA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZG9tQnl0ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gRm91bmQgdGhpcyBzZWVkLWJhc2VkIHJhbmRvbSBnZW5lcmF0b3Igc29tZXdoZXJlXG4vLyBCYXNlZCBvbiBUaGUgQ2VudHJhbCBSYW5kb21pemVyIDEuMyAoQykgMTk5NyBieSBQYXVsIEhvdWxlIChob3VsZUBtc2MuY29ybmVsbC5lZHUpXG5cbnZhciBzZWVkID0gMTtcblxuLyoqXG4gKiByZXR1cm4gYSByYW5kb20gbnVtYmVyIGJhc2VkIG9uIGEgc2VlZFxuICogQHBhcmFtIHNlZWRcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldE5leHRWYWx1ZSgpIHtcbiAgICBzZWVkID0gKHNlZWQgKiA5MzAxICsgNDkyOTcpICUgMjMzMjgwO1xuICAgIHJldHVybiBzZWVkLygyMzMyODAuMCk7XG59XG5cbmZ1bmN0aW9uIHNldFNlZWQoX3NlZWRfKSB7XG4gICAgc2VlZCA9IF9zZWVkXztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbmV4dFZhbHVlOiBnZXROZXh0VmFsdWUsXG4gICAgc2VlZDogc2V0U2VlZFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAwO1xuIiwiLyohIHRldGhlciAxLjQuMCAqL1xuXG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuVGV0aGVyID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgVGV0aGVyQmFzZSA9IHVuZGVmaW5lZDtcbmlmICh0eXBlb2YgVGV0aGVyQmFzZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgVGV0aGVyQmFzZSA9IHsgbW9kdWxlczogW10gfTtcbn1cblxudmFyIHplcm9FbGVtZW50ID0gbnVsbDtcblxuLy8gU2FtZSBhcyBuYXRpdmUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0LCBleGNlcHQgaXQgdGFrZXMgaW50byBhY2NvdW50IHBhcmVudCA8ZnJhbWU+IG9mZnNldHNcbi8vIGlmIHRoZSBlbGVtZW50IGxpZXMgd2l0aGluIGEgbmVzdGVkIGRvY3VtZW50ICg8ZnJhbWU+IG9yIDxpZnJhbWU+LWxpa2UpLlxuZnVuY3Rpb24gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KG5vZGUpIHtcbiAgdmFyIGJvdW5kaW5nUmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgLy8gVGhlIG9yaWdpbmFsIG9iamVjdCByZXR1cm5lZCBieSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgaW1tdXRhYmxlLCBzbyB3ZSBjbG9uZSBpdFxuICAvLyBXZSBjYW4ndCB1c2UgZXh0ZW5kIGJlY2F1c2UgdGhlIHByb3BlcnRpZXMgYXJlIG5vdCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIG9iamVjdCBieSBoYXNPd25Qcm9wZXJ0eSBpbiBJRTlcbiAgdmFyIHJlY3QgPSB7fTtcbiAgZm9yICh2YXIgayBpbiBib3VuZGluZ1JlY3QpIHtcbiAgICByZWN0W2tdID0gYm91bmRpbmdSZWN0W2tdO1xuICB9XG5cbiAgaWYgKG5vZGUub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICB2YXIgX2ZyYW1lRWxlbWVudCA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5mcmFtZUVsZW1lbnQ7XG4gICAgaWYgKF9mcmFtZUVsZW1lbnQpIHtcbiAgICAgIHZhciBmcmFtZVJlY3QgPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QoX2ZyYW1lRWxlbWVudCk7XG4gICAgICByZWN0LnRvcCArPSBmcmFtZVJlY3QudG9wO1xuICAgICAgcmVjdC5ib3R0b20gKz0gZnJhbWVSZWN0LnRvcDtcbiAgICAgIHJlY3QubGVmdCArPSBmcmFtZVJlY3QubGVmdDtcbiAgICAgIHJlY3QucmlnaHQgKz0gZnJhbWVSZWN0LmxlZnQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlY3Q7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFBhcmVudHMoZWwpIHtcbiAgLy8gSW4gZmlyZWZveCBpZiB0aGUgZWwgaXMgaW5zaWRlIGFuIGlmcmFtZSB3aXRoIGRpc3BsYXk6IG5vbmU7IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCkgd2lsbCByZXR1cm4gbnVsbDtcbiAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCkgfHwge307XG4gIHZhciBwb3NpdGlvbiA9IGNvbXB1dGVkU3R5bGUucG9zaXRpb247XG4gIHZhciBwYXJlbnRzID0gW107XG5cbiAgaWYgKHBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG4gICAgcmV0dXJuIFtlbF07XG4gIH1cblxuICB2YXIgcGFyZW50ID0gZWw7XG4gIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpICYmIHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT09IDEpIHtcbiAgICB2YXIgc3R5bGUgPSB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpO1xuICAgIH0gY2F0Y2ggKGVycikge31cblxuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICd1bmRlZmluZWQnIHx8IHN0eWxlID09PSBudWxsKSB7XG4gICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgIHJldHVybiBwYXJlbnRzO1xuICAgIH1cblxuICAgIHZhciBfc3R5bGUgPSBzdHlsZTtcbiAgICB2YXIgb3ZlcmZsb3cgPSBfc3R5bGUub3ZlcmZsb3c7XG4gICAgdmFyIG92ZXJmbG93WCA9IF9zdHlsZS5vdmVyZmxvd1g7XG4gICAgdmFyIG92ZXJmbG93WSA9IF9zdHlsZS5vdmVyZmxvd1k7XG5cbiAgICBpZiAoLyhhdXRvfHNjcm9sbCkvLnRlc3Qob3ZlcmZsb3cgKyBvdmVyZmxvd1kgKyBvdmVyZmxvd1gpKSB7XG4gICAgICBpZiAocG9zaXRpb24gIT09ICdhYnNvbHV0ZScgfHwgWydyZWxhdGl2ZScsICdhYnNvbHV0ZScsICdmaXhlZCddLmluZGV4T2Yoc3R5bGUucG9zaXRpb24pID49IDApIHtcbiAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyZW50cy5wdXNoKGVsLm93bmVyRG9jdW1lbnQuYm9keSk7XG5cbiAgLy8gSWYgdGhlIG5vZGUgaXMgd2l0aGluIGEgZnJhbWUsIGFjY291bnQgZm9yIHRoZSBwYXJlbnQgd2luZG93IHNjcm9sbFxuICBpZiAoZWwub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICBwYXJlbnRzLnB1c2goZWwub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldyk7XG4gIH1cblxuICByZXR1cm4gcGFyZW50cztcbn1cblxudmFyIHVuaXF1ZUlkID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGlkID0gMDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKytpZDtcbiAgfTtcbn0pKCk7XG5cbnZhciB6ZXJvUG9zQ2FjaGUgPSB7fTtcbnZhciBnZXRPcmlnaW4gPSBmdW5jdGlvbiBnZXRPcmlnaW4oKSB7XG4gIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyB1bmZvcnR1bmF0ZWx5IHRvbyBhY2N1cmF0ZS4gIEl0IGludHJvZHVjZXMgYSBwaXhlbCBvciB0d28gb2ZcbiAgLy8gaml0dGVyIGFzIHRoZSB1c2VyIHNjcm9sbHMgdGhhdCBtZXNzZXMgd2l0aCBvdXIgYWJpbGl0eSB0byBkZXRlY3QgaWYgdHdvIHBvc2l0aW9uc1xuICAvLyBhcmUgZXF1aXZpbGFudCBvciBub3QuICBXZSBwbGFjZSBhbiBlbGVtZW50IGF0IHRoZSB0b3AgbGVmdCBvZiB0aGUgcGFnZSB0aGF0IHdpbGxcbiAgLy8gZ2V0IHRoZSBzYW1lIGppdHRlciwgc28gd2UgY2FuIGNhbmNlbCB0aGUgdHdvIG91dC5cbiAgdmFyIG5vZGUgPSB6ZXJvRWxlbWVudDtcbiAgaWYgKCFub2RlIHx8ICFkb2N1bWVudC5ib2R5LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcsIHVuaXF1ZUlkKCkpO1xuICAgIGV4dGVuZChub2RlLnN0eWxlLCB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSk7XG5cbiAgICB6ZXJvRWxlbWVudCA9IG5vZGU7XG4gIH1cblxuICB2YXIgaWQgPSBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnKTtcbiAgaWYgKHR5cGVvZiB6ZXJvUG9zQ2FjaGVbaWRdID09PSAndW5kZWZpbmVkJykge1xuICAgIHplcm9Qb3NDYWNoZVtpZF0gPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Qobm9kZSk7XG5cbiAgICAvLyBDbGVhciB0aGUgY2FjaGUgd2hlbiB0aGlzIHBvc2l0aW9uIGNhbGwgaXMgZG9uZVxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlbGV0ZSB6ZXJvUG9zQ2FjaGVbaWRdO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHplcm9Qb3NDYWNoZVtpZF07XG59O1xuXG5mdW5jdGlvbiByZW1vdmVVdGlsRWxlbWVudHMoKSB7XG4gIGlmICh6ZXJvRWxlbWVudCkge1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoemVyb0VsZW1lbnQpO1xuICB9XG4gIHplcm9FbGVtZW50ID0gbnVsbDtcbn07XG5cbmZ1bmN0aW9uIGdldEJvdW5kcyhlbCkge1xuICB2YXIgZG9jID0gdW5kZWZpbmVkO1xuICBpZiAoZWwgPT09IGRvY3VtZW50KSB7XG4gICAgZG9jID0gZG9jdW1lbnQ7XG4gICAgZWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgZG9jID0gZWwub3duZXJEb2N1bWVudDtcbiAgfVxuXG4gIHZhciBkb2NFbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgdmFyIGJveCA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChlbCk7XG5cbiAgdmFyIG9yaWdpbiA9IGdldE9yaWdpbigpO1xuXG4gIGJveC50b3AgLT0gb3JpZ2luLnRvcDtcbiAgYm94LmxlZnQgLT0gb3JpZ2luLmxlZnQ7XG5cbiAgaWYgKHR5cGVvZiBib3gud2lkdGggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm94LndpZHRoID0gZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCAtIGJveC5sZWZ0IC0gYm94LnJpZ2h0O1xuICB9XG4gIGlmICh0eXBlb2YgYm94LmhlaWdodCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3guaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQgLSBib3gudG9wIC0gYm94LmJvdHRvbTtcbiAgfVxuXG4gIGJveC50b3AgPSBib3gudG9wIC0gZG9jRWwuY2xpZW50VG9wO1xuICBib3gubGVmdCA9IGJveC5sZWZ0IC0gZG9jRWwuY2xpZW50TGVmdDtcbiAgYm94LnJpZ2h0ID0gZG9jLmJvZHkuY2xpZW50V2lkdGggLSBib3gud2lkdGggLSBib3gubGVmdDtcbiAgYm94LmJvdHRvbSA9IGRvYy5ib2R5LmNsaWVudEhlaWdodCAtIGJveC5oZWlnaHQgLSBib3gudG9wO1xuXG4gIHJldHVybiBib3g7XG59XG5cbmZ1bmN0aW9uIGdldE9mZnNldFBhcmVudChlbCkge1xuICByZXR1cm4gZWwub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbn1cblxudmFyIF9zY3JvbGxCYXJTaXplID0gbnVsbDtcbmZ1bmN0aW9uIGdldFNjcm9sbEJhclNpemUoKSB7XG4gIGlmIChfc2Nyb2xsQmFyU2l6ZSkge1xuICAgIHJldHVybiBfc2Nyb2xsQmFyU2l6ZTtcbiAgfVxuICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XG5cbiAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGV4dGVuZChvdXRlci5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJyxcbiAgICB3aWR0aDogJzIwMHB4JyxcbiAgICBoZWlnaHQ6ICcxNTBweCcsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nXG4gIH0pO1xuXG4gIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcblxuICB2YXIgd2lkdGhDb250YWluZWQgPSBpbm5lci5vZmZzZXRXaWR0aDtcbiAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcbiAgdmFyIHdpZHRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cbiAgaWYgKHdpZHRoQ29udGFpbmVkID09PSB3aWR0aFNjcm9sbCkge1xuICAgIHdpZHRoU2Nyb2xsID0gb3V0ZXIuY2xpZW50V2lkdGg7XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG91dGVyKTtcblxuICB2YXIgd2lkdGggPSB3aWR0aENvbnRhaW5lZCAtIHdpZHRoU2Nyb2xsO1xuXG4gIF9zY3JvbGxCYXJTaXplID0geyB3aWR0aDogd2lkdGgsIGhlaWdodDogd2lkdGggfTtcbiAgcmV0dXJuIF9zY3JvbGxCYXJTaXplO1xufVxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gIHZhciBvdXQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuICB2YXIgYXJncyA9IFtdO1xuXG4gIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG5cbiAgYXJncy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICBpZiAob2JqKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgaWYgKGNscy50cmltKCkpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShjbHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUuc3BsaXQoJyAnKS5qb2luKCd8JykgKyAnKCB8JCknLCAnZ2knKTtcbiAgICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKS5yZXBsYWNlKHJlZ2V4LCAnICcpO1xuICAgIHNldENsYXNzTmFtZShlbCwgY2xhc3NOYW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBpZiAoY2xzLnRyaW0oKSkge1xuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGNscyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuICAgIHZhciBjbHMgPSBnZXRDbGFzc05hbWUoZWwpICsgKCcgJyArIG5hbWUpO1xuICAgIHNldENsYXNzTmFtZShlbCwgY2xzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpO1xuICB9XG4gIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpO1xuICByZXR1cm4gbmV3IFJlZ0V4cCgnKF58ICknICsgbmFtZSArICcoIHwkKScsICdnaScpLnRlc3QoY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKGVsKSB7XG4gIC8vIENhbid0IHVzZSBqdXN0IFNWR0FuaW1hdGVkU3RyaW5nIGhlcmUgc2luY2Ugbm9kZXMgd2l0aGluIGEgRnJhbWUgaW4gSUUgaGF2ZVxuICAvLyBjb21wbGV0ZWx5IHNlcGFyYXRlbHkgU1ZHQW5pbWF0ZWRTdHJpbmcgYmFzZSBjbGFzc2VzXG4gIGlmIChlbC5jbGFzc05hbWUgaW5zdGFuY2VvZiBlbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LlNWR0FuaW1hdGVkU3RyaW5nKSB7XG4gICAgcmV0dXJuIGVsLmNsYXNzTmFtZS5iYXNlVmFsO1xuICB9XG4gIHJldHVybiBlbC5jbGFzc05hbWU7XG59XG5cbmZ1bmN0aW9uIHNldENsYXNzTmFtZShlbCwgY2xhc3NOYW1lKSB7XG4gIGVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDbGFzc2VzKGVsLCBhZGQsIGFsbCkge1xuICAvLyBPZiB0aGUgc2V0IG9mICdhbGwnIGNsYXNzZXMsIHdlIG5lZWQgdGhlICdhZGQnIGNsYXNzZXMsIGFuZCBvbmx5IHRoZVxuICAvLyAnYWRkJyBjbGFzc2VzIHRvIGJlIHNldC5cbiAgYWxsLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgIGlmIChhZGQuaW5kZXhPZihjbHMpID09PSAtMSAmJiBoYXNDbGFzcyhlbCwgY2xzKSkge1xuICAgICAgcmVtb3ZlQ2xhc3MoZWwsIGNscyk7XG4gICAgfVxuICB9KTtcblxuICBhZGQuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgaWYgKCFoYXNDbGFzcyhlbCwgY2xzKSkge1xuICAgICAgYWRkQ2xhc3MoZWwsIGNscyk7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIGRlZmVycmVkID0gW107XG5cbnZhciBkZWZlciA9IGZ1bmN0aW9uIGRlZmVyKGZuKSB7XG4gIGRlZmVycmVkLnB1c2goZm4pO1xufTtcblxudmFyIGZsdXNoID0gZnVuY3Rpb24gZmx1c2goKSB7XG4gIHZhciBmbiA9IHVuZGVmaW5lZDtcbiAgd2hpbGUgKGZuID0gZGVmZXJyZWQucG9wKCkpIHtcbiAgICBmbigpO1xuICB9XG59O1xuXG52YXIgRXZlbnRlZCA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50ZWQpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEV2ZW50ZWQsIFt7XG4gICAga2V5OiAnb24nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbihldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICB2YXIgb25jZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzNdO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5nc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdID0gW107XG4gICAgICB9XG4gICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5wdXNoKHsgaGFuZGxlcjogaGFuZGxlciwgY3R4OiBjdHgsIG9uY2U6IG9uY2UgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb25jZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvZmYnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvZmYoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0cmlnZ2VyJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdHJpZ2dlcihldmVudCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmJpbmRpbmdzW2V2ZW50XSkge1xuICAgICAgICB2YXIgaSA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBfYmluZGluZ3MkZXZlbnQkaSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldO1xuICAgICAgICAgIHZhciBoYW5kbGVyID0gX2JpbmRpbmdzJGV2ZW50JGkuaGFuZGxlcjtcbiAgICAgICAgICB2YXIgY3R4ID0gX2JpbmRpbmdzJGV2ZW50JGkuY3R4O1xuICAgICAgICAgIHZhciBvbmNlID0gX2JpbmRpbmdzJGV2ZW50JGkub25jZTtcblxuICAgICAgICAgIHZhciBjb250ZXh0ID0gY3R4O1xuICAgICAgICAgIGlmICh0eXBlb2YgY29udGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGhhbmRsZXIuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cbiAgICAgICAgICBpZiAob25jZSkge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICArK2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEV2ZW50ZWQ7XG59KSgpO1xuXG5UZXRoZXJCYXNlLlV0aWxzID0ge1xuICBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Q6IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdCxcbiAgZ2V0U2Nyb2xsUGFyZW50czogZ2V0U2Nyb2xsUGFyZW50cyxcbiAgZ2V0Qm91bmRzOiBnZXRCb3VuZHMsXG4gIGdldE9mZnNldFBhcmVudDogZ2V0T2Zmc2V0UGFyZW50LFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbiAgdXBkYXRlQ2xhc3NlczogdXBkYXRlQ2xhc3NlcyxcbiAgZGVmZXI6IGRlZmVyLFxuICBmbHVzaDogZmx1c2gsXG4gIHVuaXF1ZUlkOiB1bmlxdWVJZCxcbiAgRXZlbnRlZDogRXZlbnRlZCxcbiAgZ2V0U2Nyb2xsQmFyU2l6ZTogZ2V0U2Nyb2xsQmFyU2l6ZSxcbiAgcmVtb3ZlVXRpbEVsZW1lbnRzOiByZW1vdmVVdGlsRWxlbWVudHNcbn07XG4vKiBnbG9iYWxzIFRldGhlckJhc2UsIHBlcmZvcm1hbmNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94NiwgX3g3LCBfeDgpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3g2LCBwcm9wZXJ0eSA9IF94NywgcmVjZWl2ZXIgPSBfeDg7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3g2ID0gcGFyZW50OyBfeDcgPSBwcm9wZXJ0eTsgX3g4ID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGRlc2MgPSBwYXJlbnQgPSB1bmRlZmluZWQ7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKCd2YWx1ZScgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbmlmICh0eXBlb2YgVGV0aGVyQmFzZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBpbmNsdWRlIHRoZSB1dGlscy5qcyBmaWxlIGJlZm9yZSB0ZXRoZXIuanMnKTtcbn1cblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRTY3JvbGxQYXJlbnRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsUGFyZW50cztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgZ2V0T2Zmc2V0UGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0T2Zmc2V0UGFyZW50O1xudmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcbnZhciBhZGRDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmFkZENsYXNzO1xudmFyIHJlbW92ZUNsYXNzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlQ2xhc3M7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcbnZhciBmbHVzaCA9IF9UZXRoZXJCYXNlJFV0aWxzLmZsdXNoO1xudmFyIGdldFNjcm9sbEJhclNpemUgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxCYXJTaXplO1xudmFyIHJlbW92ZVV0aWxFbGVtZW50cyA9IF9UZXRoZXJCYXNlJFV0aWxzLnJlbW92ZVV0aWxFbGVtZW50cztcblxuZnVuY3Rpb24gd2l0aGluKGEsIGIpIHtcbiAgdmFyIGRpZmYgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDIgfHwgYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyAxIDogYXJndW1lbnRzWzJdO1xuXG4gIHJldHVybiBhICsgZGlmZiA+PSBiICYmIGIgPj0gYSAtIGRpZmY7XG59XG5cbnZhciB0cmFuc2Zvcm1LZXkgPSAoZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiAnJztcbiAgfVxuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICB2YXIgdHJhbnNmb3JtcyA9IFsndHJhbnNmb3JtJywgJ1dlYmtpdFRyYW5zZm9ybScsICdPVHJhbnNmb3JtJywgJ01velRyYW5zZm9ybScsICdtc1RyYW5zZm9ybSddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zZm9ybXMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIga2V5ID0gdHJhbnNmb3Jtc1tpXTtcbiAgICBpZiAoZWwuc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgfVxufSkoKTtcblxudmFyIHRldGhlcnMgPSBbXTtcblxudmFyIHBvc2l0aW9uID0gZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyKSB7XG4gICAgdGV0aGVyLnBvc2l0aW9uKGZhbHNlKTtcbiAgfSk7XG4gIGZsdXNoKCk7XG59O1xuXG5mdW5jdGlvbiBub3coKSB7XG4gIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICB9XG4gIHJldHVybiArbmV3IERhdGUoKTtcbn1cblxuKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhc3RDYWxsID0gbnVsbDtcbiAgdmFyIGxhc3REdXJhdGlvbiA9IG51bGw7XG4gIHZhciBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cbiAgdmFyIHRpY2sgPSBmdW5jdGlvbiB0aWNrKCkge1xuICAgIGlmICh0eXBlb2YgbGFzdER1cmF0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBsYXN0RHVyYXRpb24gPiAxNikge1xuICAgICAgLy8gV2Ugdm9sdW50YXJpbHkgdGhyb3R0bGUgb3Vyc2VsdmVzIGlmIHdlIGNhbid0IG1hbmFnZSA2MGZwc1xuICAgICAgbGFzdER1cmF0aW9uID0gTWF0aC5taW4obGFzdER1cmF0aW9uIC0gMTYsIDI1MCk7XG5cbiAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGlzIGlzIHRoZSBsYXN0IGV2ZW50LCByZW1lbWJlciB0byBwb3NpdGlvbiBqdXN0IG9uY2UgbW9yZVxuICAgICAgcGVuZGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRpY2ssIDI1MCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsYXN0Q2FsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgbm93KCkgLSBsYXN0Q2FsbCA8IDEwKSB7XG4gICAgICAvLyBTb21lIGJyb3dzZXJzIGNhbGwgZXZlbnRzIGEgbGl0dGxlIHRvbyBmcmVxdWVudGx5LCByZWZ1c2UgdG8gcnVuIG1vcmUgdGhhbiBpcyByZWFzb25hYmxlXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHBlbmRpbmdUaW1lb3V0ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZW91dCk7XG4gICAgICBwZW5kaW5nVGltZW91dCA9IG51bGw7XG4gICAgfVxuXG4gICAgbGFzdENhbGwgPSBub3coKTtcbiAgICBwb3NpdGlvbigpO1xuICAgIGxhc3REdXJhdGlvbiA9IG5vdygpIC0gbGFzdENhbGw7XG4gIH07XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBbJ3Jlc2l6ZScsICdzY3JvbGwnLCAndG91Y2htb3ZlJ10uZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCB0aWNrKTtcbiAgICB9KTtcbiAgfVxufSkoKTtcblxudmFyIE1JUlJPUl9MUiA9IHtcbiAgY2VudGVyOiAnY2VudGVyJyxcbiAgbGVmdDogJ3JpZ2h0JyxcbiAgcmlnaHQ6ICdsZWZ0J1xufTtcblxudmFyIE1JUlJPUl9UQiA9IHtcbiAgbWlkZGxlOiAnbWlkZGxlJyxcbiAgdG9wOiAnYm90dG9tJyxcbiAgYm90dG9tOiAndG9wJ1xufTtcblxudmFyIE9GRlNFVF9NQVAgPSB7XG4gIHRvcDogMCxcbiAgbGVmdDogMCxcbiAgbWlkZGxlOiAnNTAlJyxcbiAgY2VudGVyOiAnNTAlJyxcbiAgYm90dG9tOiAnMTAwJScsXG4gIHJpZ2h0OiAnMTAwJSdcbn07XG5cbnZhciBhdXRvVG9GaXhlZEF0dGFjaG1lbnQgPSBmdW5jdGlvbiBhdXRvVG9GaXhlZEF0dGFjaG1lbnQoYXR0YWNobWVudCwgcmVsYXRpdmVUb0F0dGFjaG1lbnQpIHtcbiAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG4gIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuICBpZiAobGVmdCA9PT0gJ2F1dG8nKSB7XG4gICAgbGVmdCA9IE1JUlJPUl9MUltyZWxhdGl2ZVRvQXR0YWNobWVudC5sZWZ0XTtcbiAgfVxuXG4gIGlmICh0b3AgPT09ICdhdXRvJykge1xuICAgIHRvcCA9IE1JUlJPUl9UQltyZWxhdGl2ZVRvQXR0YWNobWVudC50b3BdO1xuICB9XG5cbiAgcmV0dXJuIHsgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcbn07XG5cbnZhciBhdHRhY2htZW50VG9PZmZzZXQgPSBmdW5jdGlvbiBhdHRhY2htZW50VG9PZmZzZXQoYXR0YWNobWVudCkge1xuICB2YXIgbGVmdCA9IGF0dGFjaG1lbnQubGVmdDtcbiAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG4gIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxlZnQgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF07XG4gIH1cblxuICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC50b3BdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRvcCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC50b3BdO1xuICB9XG5cbiAgcmV0dXJuIHsgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcbn07XG5cbmZ1bmN0aW9uIGFkZE9mZnNldCgpIHtcbiAgdmFyIG91dCA9IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cbiAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIG9mZnNldHMgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICBvZmZzZXRzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICB9XG5cbiAgb2Zmc2V0cy5mb3JFYWNoKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgaWYgKHR5cGVvZiB0b3AgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0b3AgPSBwYXJzZUZsb2F0KHRvcCwgMTApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxlZnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0LCAxMCk7XG4gICAgfVxuXG4gICAgb3V0LnRvcCArPSB0b3A7XG4gICAgb3V0LmxlZnQgKz0gbGVmdDtcbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gb2Zmc2V0VG9QeChvZmZzZXQsIHNpemUpIHtcbiAgaWYgKHR5cGVvZiBvZmZzZXQubGVmdCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LmxlZnQuaW5kZXhPZignJScpICE9PSAtMSkge1xuICAgIG9mZnNldC5sZWZ0ID0gcGFyc2VGbG9hdChvZmZzZXQubGVmdCwgMTApIC8gMTAwICogc2l6ZS53aWR0aDtcbiAgfVxuICBpZiAodHlwZW9mIG9mZnNldC50b3AgPT09ICdzdHJpbmcnICYmIG9mZnNldC50b3AuaW5kZXhPZignJScpICE9PSAtMSkge1xuICAgIG9mZnNldC50b3AgPSBwYXJzZUZsb2F0KG9mZnNldC50b3AsIDEwKSAvIDEwMCAqIHNpemUuaGVpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIG9mZnNldDtcbn1cblxudmFyIHBhcnNlT2Zmc2V0ID0gZnVuY3Rpb24gcGFyc2VPZmZzZXQodmFsdWUpIHtcbiAgdmFyIF92YWx1ZSRzcGxpdCA9IHZhbHVlLnNwbGl0KCcgJyk7XG5cbiAgdmFyIF92YWx1ZSRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfdmFsdWUkc3BsaXQsIDIpO1xuXG4gIHZhciB0b3AgPSBfdmFsdWUkc3BsaXQyWzBdO1xuICB2YXIgbGVmdCA9IF92YWx1ZSRzcGxpdDJbMV07XG5cbiAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbn07XG52YXIgcGFyc2VBdHRhY2htZW50ID0gcGFyc2VPZmZzZXQ7XG5cbnZhciBUZXRoZXJDbGFzcyA9IChmdW5jdGlvbiAoX0V2ZW50ZWQpIHtcbiAgX2luaGVyaXRzKFRldGhlckNsYXNzLCBfRXZlbnRlZCk7XG5cbiAgZnVuY3Rpb24gVGV0aGVyQ2xhc3Mob3B0aW9ucykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVGV0aGVyQ2xhc3MpO1xuXG4gICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoVGV0aGVyQ2xhc3MucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5iaW5kKHRoaXMpO1xuXG4gICAgdGV0aGVycy5wdXNoKHRoaXMpO1xuXG4gICAgdGhpcy5oaXN0b3J5ID0gW107XG5cbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucywgZmFsc2UpO1xuXG4gICAgVGV0aGVyQmFzZS5tb2R1bGVzLmZvckVhY2goZnVuY3Rpb24gKG1vZHVsZSkge1xuICAgICAgaWYgKHR5cGVvZiBtb2R1bGUuaW5pdGlhbGl6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmluaXRpYWxpemUuY2FsbChfdGhpcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnBvc2l0aW9uKCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoVGV0aGVyQ2xhc3MsIFt7XG4gICAga2V5OiAnZ2V0Q2xhc3MnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGFzcygpIHtcbiAgICAgIHZhciBrZXkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcbiAgICAgIHZhciBjbGFzc2VzID0gdGhpcy5vcHRpb25zLmNsYXNzZXM7XG5cbiAgICAgIGlmICh0eXBlb2YgY2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgY2xhc3Nlc1trZXldKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3Nlc1trZXldO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCArICctJyArIGtleTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc2V0T3B0aW9ucycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG4gICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIG9mZnNldDogJzAgMCcsXG4gICAgICAgIHRhcmdldE9mZnNldDogJzAgMCcsXG4gICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdhdXRvIGF1dG8nLFxuICAgICAgICBjbGFzc1ByZWZpeDogJ3RldGhlcidcbiAgICAgIH07XG5cbiAgICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZChkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBfb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIHZhciBlbGVtZW50ID0gX29wdGlvbnMuZWxlbWVudDtcbiAgICAgIHZhciB0YXJnZXQgPSBfb3B0aW9ucy50YXJnZXQ7XG4gICAgICB2YXIgdGFyZ2V0TW9kaWZpZXIgPSBfb3B0aW9ucy50YXJnZXRNb2RpZmllcjtcblxuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9IHRhcmdldE1vZGlmaWVyO1xuXG4gICAgICBpZiAodGhpcy50YXJnZXQgPT09ICd2aWV3cG9ydCcpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Zpc2libGUnO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICdzY3JvbGwtaGFuZGxlJztcbiAgICAgIH1cblxuICAgICAgWydlbGVtZW50JywgJ3RhcmdldCddLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBCb3RoIGVsZW1lbnQgYW5kIHRhcmdldCBtdXN0IGJlIGRlZmluZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0uanF1ZXJ5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIF90aGlzMltrZXldID0gX3RoaXMyW2tleV1bMF07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIF90aGlzMltrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIF90aGlzMltrZXldID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihfdGhpczJba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQnKSk7XG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCd0YXJnZXQnKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IFlvdSBtdXN0IHByb3ZpZGUgYW4gYXR0YWNobWVudCcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRhcmdldEF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLnRhcmdldEF0dGFjaG1lbnQpO1xuICAgICAgdGhpcy5hdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy5hdHRhY2htZW50KTtcbiAgICAgIHRoaXMub2Zmc2V0ID0gcGFyc2VPZmZzZXQodGhpcy5vcHRpb25zLm9mZnNldCk7XG4gICAgICB0aGlzLnRhcmdldE9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy50YXJnZXRPZmZzZXQpO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2Nyb2xsUGFyZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzID0gW3RoaXMudGFyZ2V0XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cyA9IGdldFNjcm9sbFBhcmVudHModGhpcy50YXJnZXQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlKHBvcyk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZ2V0VGFyZ2V0Qm91bmRzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VGFyZ2V0Qm91bmRzKCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnRhcmdldE1vZGlmaWVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Zpc2libGUnKSB7XG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICByZXR1cm4geyB0b3A6IHBhZ2VZT2Zmc2V0LCBsZWZ0OiBwYWdlWE9mZnNldCwgaGVpZ2h0OiBpbm5lckhlaWdodCwgd2lkdGg6IGlubmVyV2lkdGggfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG5cbiAgICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICAgIGhlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgICAgdG9wOiBib3VuZHMudG9wLFxuICAgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgLSBib3VuZHMudG9wKSk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChib3VuZHMudG9wICsgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCArIGlubmVySGVpZ2h0KSkpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKGlubmVySGVpZ2h0LCBvdXQuaGVpZ2h0KTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgLT0gMjtcblxuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgLSBib3VuZHMubGVmdCkpO1xuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAoYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgKyBpbm5lcldpZHRoKSkpO1xuICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4oaW5uZXJXaWR0aCwgb3V0LndpZHRoKTtcbiAgICAgICAgICAgIG91dC53aWR0aCAtPSAyO1xuXG4gICAgICAgICAgICBpZiAob3V0LnRvcCA8IHBhZ2VZT2Zmc2V0KSB7XG4gICAgICAgICAgICAgIG91dC50b3AgPSBwYWdlWU9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvdXQubGVmdCA8IHBhZ2VYT2Zmc2V0KSB7XG4gICAgICAgICAgICAgIG91dC5sZWZ0ID0gcGFnZVhPZmZzZXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICAgIHZhciBib3VuZHMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuICAgICAgICAgIGlmICh0YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgICAgYm91bmRzID0ge1xuICAgICAgICAgICAgICBsZWZ0OiBwYWdlWE9mZnNldCxcbiAgICAgICAgICAgICAgdG9wOiBwYWdlWU9mZnNldCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiBpbm5lckhlaWdodCxcbiAgICAgICAgICAgICAgd2lkdGg6IGlubmVyV2lkdGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJvdW5kcyA9IGdldEJvdW5kcyh0YXJnZXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGFyZ2V0KTtcblxuICAgICAgICAgIHZhciBoYXNCb3R0b21TY3JvbGwgPSB0YXJnZXQuc2Nyb2xsV2lkdGggPiB0YXJnZXQuY2xpZW50V2lkdGggfHwgW3N0eWxlLm92ZXJmbG93LCBzdHlsZS5vdmVyZmxvd1hdLmluZGV4T2YoJ3Njcm9sbCcpID49IDAgfHwgdGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgICAgICB2YXIgc2Nyb2xsQm90dG9tID0gMDtcbiAgICAgICAgICBpZiAoaGFzQm90dG9tU2Nyb2xsKSB7XG4gICAgICAgICAgICBzY3JvbGxCb3R0b20gPSAxNTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm91bmRzLmhlaWdodCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpIC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJCb3R0b21XaWR0aCkgLSBzY3JvbGxCb3R0b207XG5cbiAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgd2lkdGg6IDE1LFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKiAwLjk3NSAqIChoZWlnaHQgLyB0YXJnZXQuc2Nyb2xsSGVpZ2h0KSxcbiAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJMZWZ0V2lkdGgpIC0gMTVcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdmFyIGZpdEFkaiA9IDA7XG4gICAgICAgICAgaWYgKGhlaWdodCA8IDQwOCAmJiB0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgZml0QWRqID0gLTAuMDAwMTEgKiBNYXRoLnBvdyhoZWlnaHQsIDIpIC0gMC4wMDcyNyAqIGhlaWdodCArIDIyLjU4O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc2Nyb2xsUGVyY2VudGFnZSA9IHRoaXMudGFyZ2V0LnNjcm9sbFRvcCAvICh0YXJnZXQuc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0KTtcbiAgICAgICAgICBvdXQudG9wID0gc2Nyb2xsUGVyY2VudGFnZSAqIChoZWlnaHQgLSBvdXQuaGVpZ2h0IC0gZml0QWRqKSArIGJvdW5kcy50b3AgKyBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKTtcblxuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjbGVhckNhY2hlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcbiAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnY2FjaGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYWNoZShrLCBnZXR0ZXIpIHtcbiAgICAgIC8vIE1vcmUgdGhhbiBvbmUgbW9kdWxlIHdpbGwgb2Z0ZW4gbmVlZCB0aGUgc2FtZSBET00gaW5mbywgc29cbiAgICAgIC8vIHdlIGtlZXAgYSBjYWNoZSB3aGljaCBpcyBjbGVhcmVkIG9uIGVhY2ggcG9zaXRpb24gY2FsbFxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jYWNoZVtrXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVba10gPSBnZXR0ZXIuY2FsbCh0aGlzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlW2tdO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2VuYWJsZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZSgpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIH1cbiAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gX3RoaXMzLnRhcmdldC5vd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgcGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIF90aGlzMy5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAocG9zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkaXNhYmxlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICByZW1vdmVDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2Nyb2xsUGFyZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICAgIHBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdGhpczQucG9zaXRpb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdkZXN0cm95JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICB0aGlzLmRpc2FibGUoKTtcblxuICAgICAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIsIGkpIHtcbiAgICAgICAgaWYgKHRldGhlciA9PT0gX3RoaXM1KSB7XG4gICAgICAgICAgdGV0aGVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgYW55IGVsZW1lbnRzIHdlIHdlcmUgdXNpbmcgZm9yIGNvbnZlbmllbmNlIGZyb20gdGhlIERPTVxuICAgICAgaWYgKHRldGhlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlbW92ZVV0aWxFbGVtZW50cygpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3VwZGF0ZUF0dGFjaENsYXNzZXMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVBdHRhY2hDbGFzc2VzKGVsZW1lbnRBdHRhY2gsIHRhcmdldEF0dGFjaCkge1xuICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cbiAgICAgIGVsZW1lbnRBdHRhY2ggPSBlbGVtZW50QXR0YWNoIHx8IHRoaXMuYXR0YWNobWVudDtcbiAgICAgIHRhcmdldEF0dGFjaCA9IHRhcmdldEF0dGFjaCB8fCB0aGlzLnRhcmdldEF0dGFjaG1lbnQ7XG4gICAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ2JvdHRvbScsICdyaWdodCcsICdtaWRkbGUnLCAnY2VudGVyJ107XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgLy8gdXBkYXRlQXR0YWNoQ2xhc3NlcyBjYW4gYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIGluIGEgcG9zaXRpb24gY2FsbCwgc29cbiAgICAgICAgLy8gd2UgbmVlZCB0byBjbGVhbiB1cCBhZnRlciBvdXJzZWx2ZXMgc3VjaCB0aGF0IHdoZW4gdGhlIGxhc3QgZGVmZXIgZ2V0c1xuICAgICAgICAvLyByYW4gaXQgZG9lc24ndCBhZGQgYW55IGV4dHJhIGNsYXNzZXMgZnJvbSBwcmV2aW91cyBjYWxscy5cbiAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5zcGxpY2UoMCwgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHZhciBhZGQgPSB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzO1xuXG4gICAgICBpZiAoZWxlbWVudEF0dGFjaC50b3ApIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC50b3ApO1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnRBdHRhY2gubGVmdCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLmxlZnQpO1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldEF0dGFjaC50b3ApIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gudG9wKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRBdHRhY2gubGVmdCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC5sZWZ0KTtcbiAgICAgIH1cblxuICAgICAgdmFyIGFsbCA9IFtdO1xuICAgICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICBhbGwucHVzaChfdGhpczYuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuICAgICAgICBhbGwucHVzaChfdGhpczYuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgICB9KTtcblxuICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoISh0eXBlb2YgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNi5lbGVtZW50LCBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG4gICAgICAgIGlmICghKF90aGlzNi5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM2LnRhcmdldCwgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3Bvc2l0aW9uJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gICAgICB2YXIgX3RoaXM3ID0gdGhpcztcblxuICAgICAgdmFyIGZsdXNoQ2hhbmdlcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIC8vIGZsdXNoQ2hhbmdlcyBjb21taXRzIHRoZSBjaGFuZ2VzIGltbWVkaWF0ZWx5LCBsZWF2ZSB0cnVlIHVubGVzcyB5b3UgYXJlIHBvc2l0aW9uaW5nIG11bHRpcGxlXG4gICAgICAvLyB0ZXRoZXJzIChpbiB3aGljaCBjYXNlIGNhbGwgVGV0aGVyLlV0aWxzLmZsdXNoIHlvdXJzZWxmIHdoZW4geW91J3JlIGRvbmUpXG5cbiAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cbiAgICAgIC8vIFR1cm4gJ2F1dG8nIGF0dGFjaG1lbnRzIGludG8gdGhlIGFwcHJvcHJpYXRlIGNvcm5lciBvciBlZGdlXG4gICAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IGF1dG9Ub0ZpeGVkQXR0YWNobWVudCh0aGlzLnRhcmdldEF0dGFjaG1lbnQsIHRoaXMuYXR0YWNobWVudCk7XG5cbiAgICAgIHRoaXMudXBkYXRlQXR0YWNoQ2xhc3Nlcyh0aGlzLmF0dGFjaG1lbnQsIHRhcmdldEF0dGFjaG1lbnQpO1xuXG4gICAgICB2YXIgZWxlbWVudFBvcyA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzNy5lbGVtZW50KTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgd2lkdGggPSBlbGVtZW50UG9zLndpZHRoO1xuICAgICAgdmFyIGhlaWdodCA9IGVsZW1lbnRQb3MuaGVpZ2h0O1xuXG4gICAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuICAgICAgICAvLyBXZSBjYWNoZSB0aGUgaGVpZ2h0IGFuZCB3aWR0aCB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHBvc2l0aW9uIGVsZW1lbnRzIHRoYXQgYXJlXG4gICAgICAgIC8vIGdldHRpbmcgaGlkZGVuLlxuICAgICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcbiAgICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGFzdFNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczcuZ2V0VGFyZ2V0Qm91bmRzKCk7XG4gICAgICB9KTtcbiAgICAgIHZhciB0YXJnZXRTaXplID0gdGFyZ2V0UG9zO1xuXG4gICAgICAvLyBHZXQgYW4gYWN0dWFsIHB4IG9mZnNldCBmcm9tIHRoZSBhdHRhY2htZW50XG4gICAgICB2YXIgb2Zmc2V0ID0gb2Zmc2V0VG9QeChhdHRhY2htZW50VG9PZmZzZXQodGhpcy5hdHRhY2htZW50KSwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgICAgdmFyIHRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRhcmdldEF0dGFjaG1lbnQpLCB0YXJnZXRTaXplKTtcblxuICAgICAgdmFyIG1hbnVhbE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy5vZmZzZXQsIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcbiAgICAgIHZhciBtYW51YWxUYXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KHRoaXMudGFyZ2V0T2Zmc2V0LCB0YXJnZXRTaXplKTtcblxuICAgICAgLy8gQWRkIHRoZSBtYW51YWxseSBwcm92aWRlZCBvZmZzZXRcbiAgICAgIG9mZnNldCA9IGFkZE9mZnNldChvZmZzZXQsIG1hbnVhbE9mZnNldCk7XG4gICAgICB0YXJnZXRPZmZzZXQgPSBhZGRPZmZzZXQodGFyZ2V0T2Zmc2V0LCBtYW51YWxUYXJnZXRPZmZzZXQpO1xuXG4gICAgICAvLyBJdCdzIG5vdyBvdXIgZ29hbCB0byBtYWtlIChlbGVtZW50IHBvc2l0aW9uICsgb2Zmc2V0KSA9PSAodGFyZ2V0IHBvc2l0aW9uICsgdGFyZ2V0IG9mZnNldClcbiAgICAgIHZhciBsZWZ0ID0gdGFyZ2V0UG9zLmxlZnQgKyB0YXJnZXRPZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0O1xuICAgICAgdmFyIHRvcCA9IHRhcmdldFBvcy50b3AgKyB0YXJnZXRPZmZzZXQudG9wIC0gb2Zmc2V0LnRvcDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUZXRoZXJCYXNlLm1vZHVsZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIF9tb2R1bGUyID0gVGV0aGVyQmFzZS5tb2R1bGVzW2ldO1xuICAgICAgICB2YXIgcmV0ID0gX21vZHVsZTIucG9zaXRpb24uY2FsbCh0aGlzLCB7XG4gICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiB0YXJnZXRBdHRhY2htZW50LFxuICAgICAgICAgIHRhcmdldFBvczogdGFyZ2V0UG9zLFxuICAgICAgICAgIGVsZW1lbnRQb3M6IGVsZW1lbnRQb3MsXG4gICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgICAgdGFyZ2V0T2Zmc2V0OiB0YXJnZXRPZmZzZXQsXG4gICAgICAgICAgbWFudWFsT2Zmc2V0OiBtYW51YWxPZmZzZXQsXG4gICAgICAgICAgbWFudWFsVGFyZ2V0T2Zmc2V0OiBtYW51YWxUYXJnZXRPZmZzZXQsXG4gICAgICAgICAgc2Nyb2xsYmFyU2l6ZTogc2Nyb2xsYmFyU2l6ZSxcbiAgICAgICAgICBhdHRhY2htZW50OiB0aGlzLmF0dGFjaG1lbnRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJldCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHJldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b3AgPSByZXQudG9wO1xuICAgICAgICAgIGxlZnQgPSByZXQubGVmdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXZSBkZXNjcmliZSB0aGUgcG9zaXRpb24gdGhyZWUgZGlmZmVyZW50IHdheXMgdG8gZ2l2ZSB0aGUgb3B0aW1pemVyXG4gICAgICAvLyBhIGNoYW5jZSB0byBkZWNpZGUgdGhlIGJlc3QgcG9zc2libGUgd2F5IHRvIHBvc2l0aW9uIHRoZSBlbGVtZW50XG4gICAgICAvLyB3aXRoIHRoZSBmZXdlc3QgcmVwYWludHMuXG4gICAgICB2YXIgbmV4dCA9IHtcbiAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgcGFnZSAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHRoZSBib2R5KVxuICAgICAgICBwYWdlOiB7XG4gICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgbGVmdDogbGVmdFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgICAgdmlld3BvcnQ6IHtcbiAgICAgICAgICB0b3A6IHRvcCAtIHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgIGJvdHRvbTogcGFnZVlPZmZzZXQgLSB0b3AgLSBoZWlnaHQgKyBpbm5lckhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBsZWZ0IC0gcGFnZVhPZmZzZXQsXG4gICAgICAgICAgcmlnaHQ6IHBhZ2VYT2Zmc2V0IC0gbGVmdCAtIHdpZHRoICsgaW5uZXJXaWR0aFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZG9jID0gdGhpcy50YXJnZXQub3duZXJEb2N1bWVudDtcbiAgICAgIHZhciB3aW4gPSBkb2MuZGVmYXVsdFZpZXc7XG5cbiAgICAgIHZhciBzY3JvbGxiYXJTaXplID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKHdpbi5pbm5lckhlaWdodCA+IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuICAgICAgICBuZXh0LnZpZXdwb3J0LmJvdHRvbSAtPSBzY3JvbGxiYXJTaXplLmhlaWdodDtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpbi5pbm5lcldpZHRoID4gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcbiAgICAgICAgbmV4dC52aWV3cG9ydC5yaWdodCAtPSBzY3JvbGxiYXJTaXplLndpZHRoO1xuICAgICAgfVxuXG4gICAgICBpZiAoWycnLCAnc3RhdGljJ10uaW5kZXhPZihkb2MuYm9keS5zdHlsZS5wb3NpdGlvbikgPT09IC0xIHx8IFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jLmJvZHkucGFyZW50RWxlbWVudC5zdHlsZS5wb3NpdGlvbikgPT09IC0xKSB7XG4gICAgICAgIC8vIEFic29sdXRlIHBvc2l0aW9uaW5nIGluIHRoZSBib2R5IHdpbGwgYmUgcmVsYXRpdmUgdG8gdGhlIHBhZ2UsIG5vdCB0aGUgJ2luaXRpYWwgY29udGFpbmluZyBibG9jaydcbiAgICAgICAgbmV4dC5wYWdlLmJvdHRvbSA9IGRvYy5ib2R5LnNjcm9sbEhlaWdodCAtIHRvcCAtIGhlaWdodDtcbiAgICAgICAgbmV4dC5wYWdlLnJpZ2h0ID0gZG9jLmJvZHkuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zLm1vdmVFbGVtZW50ICE9PSBmYWxzZSAmJiAhKHR5cGVvZiB0aGlzLnRhcmdldE1vZGlmaWVyICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gX3RoaXM3LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczcudGFyZ2V0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UG9zaXRpb24gPSBfdGhpczcuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUob2Zmc2V0UGFyZW50KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50U2l6ZSA9IG9mZnNldFBvc2l0aW9uO1xuXG4gICAgICAgICAgdmFyIG9mZnNldEJvcmRlciA9IHt9O1xuICAgICAgICAgIFsnVG9wJywgJ0xlZnQnLCAnQm90dG9tJywgJ1JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgb2Zmc2V0Qm9yZGVyW3NpZGUudG9Mb3dlckNhc2UoKV0gPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudFN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG9mZnNldFBvc2l0aW9uLnJpZ2h0ID0gZG9jLmJvZHkuc2Nyb2xsV2lkdGggLSBvZmZzZXRQb3NpdGlvbi5sZWZ0IC0gb2Zmc2V0UGFyZW50U2l6ZS53aWR0aCArIG9mZnNldEJvcmRlci5yaWdodDtcbiAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5ib3R0b20gPSBkb2MuYm9keS5zY3JvbGxIZWlnaHQgLSBvZmZzZXRQb3NpdGlvbi50b3AgLSBvZmZzZXRQYXJlbnRTaXplLmhlaWdodCArIG9mZnNldEJvcmRlci5ib3R0b207XG5cbiAgICAgICAgICBpZiAobmV4dC5wYWdlLnRvcCA+PSBvZmZzZXRQb3NpdGlvbi50b3AgKyBvZmZzZXRCb3JkZXIudG9wICYmIG5leHQucGFnZS5ib3R0b20gPj0gb2Zmc2V0UG9zaXRpb24uYm90dG9tKSB7XG4gICAgICAgICAgICBpZiAobmV4dC5wYWdlLmxlZnQgPj0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIG9mZnNldEJvcmRlci5sZWZ0ICYmIG5leHQucGFnZS5yaWdodCA+PSBvZmZzZXRQb3NpdGlvbi5yaWdodCkge1xuICAgICAgICAgICAgICAvLyBXZSdyZSB3aXRoaW4gdGhlIHZpc2libGUgcGFydCBvZiB0aGUgdGFyZ2V0J3Mgc2Nyb2xsIHBhcmVudFxuICAgICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gb2Zmc2V0UGFyZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgdmFyIHNjcm9sbExlZnQgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsTGVmdDtcblxuICAgICAgICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG4gICAgICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIG1vdmVkIHRvIGJlIGEgY2hpbGQgb2YgdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQpLlxuICAgICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG5leHQucGFnZS50b3AgLSBvZmZzZXRQb3NpdGlvbi50b3AgKyBzY3JvbGxUb3AgLSBvZmZzZXRCb3JkZXIudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IG5leHQucGFnZS5sZWZ0IC0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIHNjcm9sbExlZnQgLSBvZmZzZXRCb3JkZXIubGVmdFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgY291bGQgYWxzbyB0cmF2ZWwgdXAgdGhlIERPTSBhbmQgdHJ5IGVhY2ggY29udGFpbmluZyBjb250ZXh0LCByYXRoZXIgdGhhbiBvbmx5XG4gICAgICAvLyBsb29raW5nIGF0IHRoZSBib2R5LCBidXQgd2UncmUgZ29ubmEgZ2V0IGRpbWluaXNoaW5nIHJldHVybnMuXG5cbiAgICAgIHRoaXMubW92ZShuZXh0KTtcblxuICAgICAgdGhpcy5oaXN0b3J5LnVuc2hpZnQobmV4dCk7XG5cbiAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gMykge1xuICAgICAgICB0aGlzLmhpc3RvcnkucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmbHVzaENoYW5nZXMpIHtcbiAgICAgICAgZmx1c2goKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gVEhFIElTU1VFXG4gIH0sIHtcbiAgICBrZXk6ICdtb3ZlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZShwb3MpIHtcbiAgICAgIHZhciBfdGhpczggPSB0aGlzO1xuXG4gICAgICBpZiAoISh0eXBlb2YgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzYW1lID0ge307XG5cbiAgICAgIGZvciAodmFyIHR5cGUgaW4gcG9zKSB7XG4gICAgICAgIHNhbWVbdHlwZV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcG9zW3R5cGVdKSB7XG4gICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlzdG9yeS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5oaXN0b3J5W2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb2ludFt0eXBlXSAhPT0gJ3VuZGVmaW5lZCcgJiYgIXdpdGhpbihwb2ludFt0eXBlXVtrZXldLCBwb3NbdHlwZV1ba2V5XSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICBzYW1lW3R5cGVdW2tleV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgY3NzID0geyB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCBib3R0b206ICcnIH07XG5cbiAgICAgIHZhciB0cmFuc2NyaWJlID0gZnVuY3Rpb24gdHJhbnNjcmliZShfc2FtZSwgX3Bvcykge1xuICAgICAgICB2YXIgaGFzT3B0aW1pemF0aW9ucyA9IHR5cGVvZiBfdGhpczgub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGdwdSA9IGhhc09wdGltaXphdGlvbnMgPyBfdGhpczgub3B0aW9ucy5vcHRpbWl6YXRpb25zLmdwdSA6IG51bGw7XG4gICAgICAgIGlmIChncHUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIHlQb3MgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIHhQb3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuICAgICAgICAgICAgY3NzLnRvcCA9IDA7XG4gICAgICAgICAgICB5UG9zID0gX3Bvcy50b3A7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5ib3R0b20gPSAwO1xuICAgICAgICAgICAgeVBvcyA9IC1fcG9zLmJvdHRvbTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX3NhbWUubGVmdCkge1xuICAgICAgICAgICAgY3NzLmxlZnQgPSAwO1xuICAgICAgICAgICAgeFBvcyA9IF9wb3MubGVmdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLnJpZ2h0ID0gMDtcbiAgICAgICAgICAgIHhQb3MgPSAtX3Bvcy5yaWdodDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEpIHtcbiAgICAgICAgICAgIC8vIEh1YlNwb3QvdGV0aGVyIzIwN1xuICAgICAgICAgICAgdmFyIHJldGluYSA9IHdpbmRvdy5tYXRjaE1lZGlhKCdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxLjNkcHB4KScpLm1hdGNoZXMgfHwgd2luZG93Lm1hdGNoTWVkaWEoJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAxLjMpJykubWF0Y2hlcztcbiAgICAgICAgICAgIGlmICghcmV0aW5hKSB7XG4gICAgICAgICAgICAgIHhQb3MgPSBNYXRoLnJvdW5kKHhQb3MpO1xuICAgICAgICAgICAgICB5UG9zID0gTWF0aC5yb3VuZCh5UG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSA9ICd0cmFuc2xhdGVYKCcgKyB4UG9zICsgJ3B4KSB0cmFuc2xhdGVZKCcgKyB5UG9zICsgJ3B4KSc7XG5cbiAgICAgICAgICBpZiAodHJhbnNmb3JtS2V5ICE9PSAnbXNUcmFuc2Zvcm0nKSB7XG4gICAgICAgICAgICAvLyBUaGUgWiB0cmFuc2Zvcm0gd2lsbCBrZWVwIHRoaXMgaW4gdGhlIEdQVSAoZmFzdGVyLCBhbmQgcHJldmVudHMgYXJ0aWZhY3RzKSxcbiAgICAgICAgICAgIC8vIGJ1dCBJRTkgZG9lc24ndCBzdXBwb3J0IDNkIHRyYW5zZm9ybXMgYW5kIHdpbGwgY2hva2UuXG4gICAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSArPSBcIiB0cmFuc2xhdGVaKDApXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcbiAgICAgICAgICAgIGNzcy50b3AgPSBfcG9zLnRvcCArICdweCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5ib3R0b20gPSBfcG9zLmJvdHRvbSArICdweCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcbiAgICAgICAgICAgIGNzcy5sZWZ0ID0gX3Bvcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLnJpZ2h0ID0gX3Bvcy5yaWdodCArICdweCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgbW92ZWQgPSBmYWxzZTtcbiAgICAgIGlmICgoc2FtZS5wYWdlLnRvcCB8fCBzYW1lLnBhZ2UuYm90dG9tKSAmJiAoc2FtZS5wYWdlLmxlZnQgfHwgc2FtZS5wYWdlLnJpZ2h0KSkge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICB0cmFuc2NyaWJlKHNhbWUucGFnZSwgcG9zLnBhZ2UpO1xuICAgICAgfSBlbHNlIGlmICgoc2FtZS52aWV3cG9ydC50b3AgfHwgc2FtZS52aWV3cG9ydC5ib3R0b20pICYmIChzYW1lLnZpZXdwb3J0LmxlZnQgfHwgc2FtZS52aWV3cG9ydC5yaWdodCkpIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgdHJhbnNjcmliZShzYW1lLnZpZXdwb3J0LCBwb3Mudmlld3BvcnQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2FtZS5vZmZzZXQgIT09ICd1bmRlZmluZWQnICYmIHNhbWUub2Zmc2V0LnRvcCAmJiBzYW1lLm9mZnNldC5sZWZ0KSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gX3RoaXM4LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczgudGFyZ2V0KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChnZXRPZmZzZXRQYXJlbnQoX3RoaXM4LmVsZW1lbnQpICE9PSBvZmZzZXRQYXJlbnQpIHtcbiAgICAgICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXM4LmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChfdGhpczguZWxlbWVudCk7XG4gICAgICAgICAgICAgIG9mZnNldFBhcmVudC5hcHBlbmRDaGlsZChfdGhpczguZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cmFuc2NyaWJlKHNhbWUub2Zmc2V0LCBwb3Mub2Zmc2V0KTtcbiAgICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgICAgIH0pKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICB0cmFuc2NyaWJlKHsgdG9wOiB0cnVlLCBsZWZ0OiB0cnVlIH0sIHBvcy5wYWdlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFtb3ZlZCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJvZHlFbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLmJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudElzQm9keSA9IHRydWU7XG4gICAgICAgICAgdmFyIGN1cnJlbnROb2RlID0gdGhpcy5lbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSAxICYmIGN1cnJlbnROb2RlLnRhZ05hbWUgIT09ICdCT0RZJykge1xuICAgICAgICAgICAgaWYgKGdldENvbXB1dGVkU3R5bGUoY3VycmVudE5vZGUpLnBvc2l0aW9uICE9PSAnc3RhdGljJykge1xuICAgICAgICAgICAgICBvZmZzZXRQYXJlbnRJc0JvZHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIW9mZnNldFBhcmVudElzQm9keSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vd25lckRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQW55IGNzcyBjaGFuZ2Ugd2lsbCB0cmlnZ2VyIGEgcmVwYWludCwgc28gbGV0J3MgYXZvaWQgb25lIGlmIG5vdGhpbmcgY2hhbmdlZFxuICAgICAgdmFyIHdyaXRlQ1NTID0ge307XG4gICAgICB2YXIgd3JpdGUgPSBmYWxzZTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBjc3MpIHtcbiAgICAgICAgdmFyIHZhbCA9IGNzc1trZXldO1xuICAgICAgICB2YXIgZWxWYWwgPSB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XTtcblxuICAgICAgICBpZiAoZWxWYWwgIT09IHZhbCkge1xuICAgICAgICAgIHdyaXRlID0gdHJ1ZTtcbiAgICAgICAgICB3cml0ZUNTU1trZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh3cml0ZSkge1xuICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZXh0ZW5kKF90aGlzOC5lbGVtZW50LnN0eWxlLCB3cml0ZUNTUyk7XG4gICAgICAgICAgX3RoaXM4LnRyaWdnZXIoJ3JlcG9zaXRpb25lZCcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gVGV0aGVyQ2xhc3M7XG59KShFdmVudGVkKTtcblxuVGV0aGVyQ2xhc3MubW9kdWxlcyA9IFtdO1xuXG5UZXRoZXJCYXNlLnBvc2l0aW9uID0gcG9zaXRpb247XG5cbnZhciBUZXRoZXIgPSBleHRlbmQoVGV0aGVyQ2xhc3MsIFRldGhlckJhc2UpO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG52YXIgQk9VTkRTX0ZPUk1BVCA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cbmZ1bmN0aW9uIGdldEJvdW5kaW5nUmVjdCh0ZXRoZXIsIHRvKSB7XG4gIGlmICh0byA9PT0gJ3Njcm9sbFBhcmVudCcpIHtcbiAgICB0byA9IHRldGhlci5zY3JvbGxQYXJlbnRzWzBdO1xuICB9IGVsc2UgaWYgKHRvID09PSAnd2luZG93Jykge1xuICAgIHRvID0gW3BhZ2VYT2Zmc2V0LCBwYWdlWU9mZnNldCwgaW5uZXJXaWR0aCArIHBhZ2VYT2Zmc2V0LCBpbm5lckhlaWdodCArIHBhZ2VZT2Zmc2V0XTtcbiAgfVxuXG4gIGlmICh0byA9PT0gZG9jdW1lbnQpIHtcbiAgICB0byA9IHRvLmRvY3VtZW50RWxlbWVudDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdG8ubm9kZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBub2RlID0gdG87XG4gICAgICB2YXIgc2l6ZSA9IGdldEJvdW5kcyh0byk7XG4gICAgICB2YXIgcG9zID0gc2l6ZTtcbiAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodG8pO1xuXG4gICAgICB0byA9IFtwb3MubGVmdCwgcG9zLnRvcCwgc2l6ZS53aWR0aCArIHBvcy5sZWZ0LCBzaXplLmhlaWdodCArIHBvcy50b3BdO1xuXG4gICAgICAvLyBBY2NvdW50IGFueSBwYXJlbnQgRnJhbWVzIHNjcm9sbCBvZmZzZXRcbiAgICAgIGlmIChub2RlLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIHZhciB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHRvWzBdICs9IHdpbi5wYWdlWE9mZnNldDtcbiAgICAgICAgdG9bMV0gKz0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgICAgICB0b1syXSArPSB3aW4ucGFnZVhPZmZzZXQ7XG4gICAgICAgIHRvWzNdICs9IHdpbi5wYWdlWU9mZnNldDtcbiAgICAgIH1cblxuICAgICAgQk9VTkRTX0ZPUk1BVC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlLCBpKSB7XG4gICAgICAgIHNpZGUgPSBzaWRlWzBdLnRvVXBwZXJDYXNlKCkgKyBzaWRlLnN1YnN0cigxKTtcbiAgICAgICAgaWYgKHNpZGUgPT09ICdUb3AnIHx8IHNpZGUgPT09ICdMZWZ0Jykge1xuICAgICAgICAgIHRvW2ldICs9IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvW2ldIC09IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KSgpO1xuICB9XG5cbiAgcmV0dXJuIHRvO1xufVxuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcbiAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IF9yZWYudGFyZ2V0QXR0YWNobWVudDtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gX2NhY2hlLndpZHRoO1xuXG4gICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG4gICAgICAvLyBIYW5kbGUgdGhlIGl0ZW0gZ2V0dGluZyBoaWRkZW4gYXMgYSByZXN1bHQgb2Ygb3VyIHBvc2l0aW9uaW5nIHdpdGhvdXQgZ2xpdGNoaW5nXG4gICAgICAvLyB0aGUgY2xhc3NlcyBpbiBhbmQgb3V0XG4gICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcbiAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldFNpemUgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF90aGlzLmdldFRhcmdldEJvdW5kcygpO1xuICAgIH0pO1xuXG4gICAgdmFyIHRhcmdldEhlaWdodCA9IHRhcmdldFNpemUuaGVpZ2h0O1xuICAgIHZhciB0YXJnZXRXaWR0aCA9IHRhcmdldFNpemUud2lkdGg7XG5cbiAgICB2YXIgYWxsQ2xhc3NlcyA9IFt0aGlzLmdldENsYXNzKCdwaW5uZWQnKSwgdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpXTtcblxuICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG4gICAgICB2YXIgb3V0T2ZCb3VuZHNDbGFzcyA9IGNvbnN0cmFpbnQub3V0T2ZCb3VuZHNDbGFzcztcbiAgICAgIHZhciBwaW5uZWRDbGFzcyA9IGNvbnN0cmFpbnQucGlubmVkQ2xhc3M7XG5cbiAgICAgIGlmIChvdXRPZkJvdW5kc0NsYXNzKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChvdXRPZkJvdW5kc0NsYXNzKTtcbiAgICAgIH1cbiAgICAgIGlmIChwaW5uZWRDbGFzcykge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYWxsQ2xhc3Nlcy5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2goY2xzICsgJy0nICsgc2lkZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHZhciBhZGRDbGFzc2VzID0gW107XG5cbiAgICB2YXIgdEF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRhcmdldEF0dGFjaG1lbnQpO1xuICAgIHZhciBlQXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGhpcy5hdHRhY2htZW50KTtcblxuICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG4gICAgICB2YXIgdG8gPSBjb25zdHJhaW50LnRvO1xuICAgICAgdmFyIGF0dGFjaG1lbnQgPSBjb25zdHJhaW50LmF0dGFjaG1lbnQ7XG4gICAgICB2YXIgcGluID0gY29uc3RyYWludC5waW47XG5cbiAgICAgIGlmICh0eXBlb2YgYXR0YWNobWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgYXR0YWNobWVudCA9ICcnO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2hhbmdlQXR0YWNoWCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICBjaGFuZ2VBdHRhY2hZID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGF0dGFjaG1lbnQuaW5kZXhPZignICcpID49IDApIHtcbiAgICAgICAgdmFyIF9hdHRhY2htZW50JHNwbGl0ID0gYXR0YWNobWVudC5zcGxpdCgnICcpO1xuXG4gICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfYXR0YWNobWVudCRzcGxpdCwgMik7XG5cbiAgICAgICAgY2hhbmdlQXR0YWNoWSA9IF9hdHRhY2htZW50JHNwbGl0MlswXTtcbiAgICAgICAgY2hhbmdlQXR0YWNoWCA9IF9hdHRhY2htZW50JHNwbGl0MlsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYW5nZUF0dGFjaFggPSBjaGFuZ2VBdHRhY2hZID0gYXR0YWNobWVudDtcbiAgICAgIH1cblxuICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChfdGhpcywgdG8pO1xuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgdEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndG9nZXRoZXInKSB7XG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScgJiYgdG9wIDwgYm91bmRzWzFdKSB7XG4gICAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcgJiYgdG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRvcCAtIChoZWlnaHQgLSB0YXJnZXRIZWlnaHQpID49IGJvdW5kc1sxXSkge1xuICAgICAgICAgICAgdG9wIC09IGhlaWdodCAtIHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnICYmIHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuICAgICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nICYmIHRvcCA8IGJvdW5kc1sxXSAmJiB0b3AgKyAoaGVpZ2h0ICogMiAtIHRhcmdldEhlaWdodCkgPD0gYm91bmRzWzNdKSB7XG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICdtaWRkbGUnKSB7XG4gICAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0b2dldGhlcicpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcblxuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcblxuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGggLyAyO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGggLyAyO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgcGluID09PSAnc3RyaW5nJykge1xuICAgICAgICBwaW4gPSBwaW4uc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICByZXR1cm4gcC50cmltKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChwaW4gPT09IHRydWUpIHtcbiAgICAgICAgcGluID0gWyd0b3AnLCAnbGVmdCcsICdyaWdodCcsICdib3R0b20nXTtcbiAgICAgIH1cblxuICAgICAgcGluID0gcGluIHx8IFtdO1xuXG4gICAgICB2YXIgcGlubmVkID0gW107XG4gICAgICB2YXIgb29iID0gW107XG5cbiAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCd0b3AnKSA+PSAwKSB7XG4gICAgICAgICAgdG9wID0gYm91bmRzWzFdO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCd0b3AnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgndG9wJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcbiAgICAgICAgICB0b3AgPSBib3VuZHNbM10gLSBoZWlnaHQ7XG4gICAgICAgICAgcGlubmVkLnB1c2goJ2JvdHRvbScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdib3R0b20nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ2xlZnQnKSA+PSAwKSB7XG4gICAgICAgICAgbGVmdCA9IGJvdW5kc1swXTtcbiAgICAgICAgICBwaW5uZWQucHVzaCgnbGVmdCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdsZWZ0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ3JpZ2h0JykgPj0gMCkge1xuICAgICAgICAgIGxlZnQgPSBib3VuZHNbMl0gLSB3aWR0aDtcbiAgICAgICAgICBwaW5uZWQucHVzaCgncmlnaHQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgncmlnaHQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocGlubmVkLmxlbmd0aCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBwaW5uZWRDbGFzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG4gICAgICAgICAgcGlubmVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyArICctJyArIHNpZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAob29iLmxlbmd0aCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBvb2JDbGFzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLmdldENsYXNzKCdvdXQtb2YtYm91bmRzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzKTtcbiAgICAgICAgICBvb2IuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzICsgJy0nICsgc2lkZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwaW5uZWQuaW5kZXhPZignbGVmdCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ3JpZ2h0JykgPj0gMCkge1xuICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gdEF0dGFjaG1lbnQubGVmdCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCd0b3AnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG4gICAgICAgIGVBdHRhY2htZW50LnRvcCA9IHRBdHRhY2htZW50LnRvcCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodEF0dGFjaG1lbnQudG9wICE9PSB0YXJnZXRBdHRhY2htZW50LnRvcCB8fCB0QXR0YWNobWVudC5sZWZ0ICE9PSB0YXJnZXRBdHRhY2htZW50LmxlZnQgfHwgZUF0dGFjaG1lbnQudG9wICE9PSBfdGhpcy5hdHRhY2htZW50LnRvcCB8fCBlQXR0YWNobWVudC5sZWZ0ICE9PSBfdGhpcy5hdHRhY2htZW50LmxlZnQpIHtcbiAgICAgICAgX3RoaXMudXBkYXRlQXR0YWNoQ2xhc3NlcyhlQXR0YWNobWVudCwgdEF0dGFjaG1lbnQpO1xuICAgICAgICBfdGhpcy50cmlnZ2VyKCd1cGRhdGUnLCB7XG4gICAgICAgICAgYXR0YWNobWVudDogZUF0dGFjaG1lbnQsXG4gICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdEF0dGFjaG1lbnRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgfVxufSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cbiAgICB2YXIgdGFyZ2V0UG9zID0gdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcblxuICAgIHZhciBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG4gICAgdmFyIHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuXG4gICAgdmFyIGFidXR0ZWQgPSBbXTtcbiAgICBpZiAodG9wIDw9IHRhcmdldFBvcy5ib3R0b20gJiYgYm90dG9tID49IHRhcmdldFBvcy50b3ApIHtcbiAgICAgIFsnbGVmdCcsICdyaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgdmFyIHRhcmdldFBvc1NpZGUgPSB0YXJnZXRQb3Nbc2lkZV07XG4gICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSBsZWZ0IHx8IHRhcmdldFBvc1NpZGUgPT09IHJpZ2h0KSB7XG4gICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobGVmdCA8PSB0YXJnZXRQb3MucmlnaHQgJiYgcmlnaHQgPj0gdGFyZ2V0UG9zLmxlZnQpIHtcbiAgICAgIFsndG9wJywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgdmFyIHRhcmdldFBvc1NpZGUgPSB0YXJnZXRQb3Nbc2lkZV07XG4gICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSB0b3AgfHwgdGFyZ2V0UG9zU2lkZSA9PT0gYm90dG9tKSB7XG4gICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgYWxsQ2xhc3NlcyA9IFtdO1xuICAgIHZhciBhZGRDbGFzc2VzID0gW107XG5cbiAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuICAgIGFsbENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgIGFsbENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoYWJ1dHRlZC5sZW5ndGgpIHtcbiAgICAgIGFkZENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuICAgIH1cblxuICAgIGFidXR0ZWQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgYWRkQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICB9KTtcblxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLnNoaWZ0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0O1xuICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnNoaWZ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdC5jYWxsKHRoaXMsIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfSk7XG4gICAgfVxuXG4gICAgdmFyIHNoaWZ0VG9wID0gdW5kZWZpbmVkLFxuICAgICAgICBzaGlmdExlZnQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBzaGlmdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNoaWZ0ID0gc2hpZnQuc3BsaXQoJyAnKTtcbiAgICAgIHNoaWZ0WzFdID0gc2hpZnRbMV0gfHwgc2hpZnRbMF07XG5cbiAgICAgIHZhciBfc2hpZnQgPSBzaGlmdDtcblxuICAgICAgdmFyIF9zaGlmdDIgPSBfc2xpY2VkVG9BcnJheShfc2hpZnQsIDIpO1xuXG4gICAgICBzaGlmdFRvcCA9IF9zaGlmdDJbMF07XG4gICAgICBzaGlmdExlZnQgPSBfc2hpZnQyWzFdO1xuXG4gICAgICBzaGlmdFRvcCA9IHBhcnNlRmxvYXQoc2hpZnRUb3AsIDEwKTtcbiAgICAgIHNoaWZ0TGVmdCA9IHBhcnNlRmxvYXQoc2hpZnRMZWZ0LCAxMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNoaWZ0VG9wID0gc2hpZnQudG9wO1xuICAgICAgc2hpZnRMZWZ0ID0gc2hpZnQubGVmdDtcbiAgICB9XG5cbiAgICB0b3AgKz0gc2hpZnRUb3A7XG4gICAgbGVmdCArPSBzaGlmdExlZnQ7XG5cbiAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICB9XG59KTtcbnJldHVybiBUZXRoZXI7XG5cbn0pKTtcbiIsImltcG9ydCB7IERlZmF1bHRHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZFJvdyB9IGZyb20gJy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9tb2RlbC9HcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFN0eWxlZEdyaWRDZWxsIH0gZnJvbSAnLi4vbW9kZWwvc3R5bGVkL1N0eWxlZEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUgfSBmcm9tICcuLi9tb2RlbC9zdHlsZWQvU3R5bGUnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBFeGFtcGxlR3JpZEJ1aWxkZXJcclxue1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBsaW5lczpudW1iZXIgPSAxMDAsIHByaXZhdGUgY29sczpudW1iZXIgPSA1MiwgcHJpdmF0ZSBzdHlsZT86U3R5bGUpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGJ1aWxkKCk6R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNlbGxzID0gW10gYXMgR3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgdGhpcy5jcmVhdGVDb2x1bW5Sb3coY2VsbHMpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGluZXM7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlUmVzb3VyY2VSb3coY2VsbHMsIGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKGNlbGxzLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlQ29sdW1uUm93KGNlbGxzOkdyaWRDZWxsW10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjZWxscy5wdXNoKG5ldyBTdHlsZWRHcmlkQ2VsbCh7XHJcbiAgICAgICAgICAgIGNvbFJlZjogMCxcclxuICAgICAgICAgICAgcm93UmVmOiAwLFxyXG4gICAgICAgICAgICB2YWx1ZTogJysnLFxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbHM7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGxzLnB1c2gobmV3IFN0eWxlZEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgICAgIGNvbFJlZjogaSArIDEsXHJcbiAgICAgICAgICAgICAgICByb3dSZWY6IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ1ZlcnRpY2FsICMnICsgKGkgKyAxKSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVJlc291cmNlUm93KGNlbGxzOkdyaWRDZWxsW10sIGxpbmU6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY2VsbHMucHVzaChuZXcgU3R5bGVkR3JpZENlbGwoe1xyXG4gICAgICAgICAgICBjb2xSZWY6IDAsXHJcbiAgICAgICAgICAgIHJvd1JlZjogbGluZSArIDEsXHJcbiAgICAgICAgICAgIHZhbHVlOiBgSG9yaXpvbnRhbCAjJHtsaW5lfWAsXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29sczsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2VsbHMucHVzaChuZXcgU3R5bGVkR3JpZENlbGwoe1xyXG4gICAgICAgICAgICAgICAgY29sUmVmOiBpICsgMSxcclxuICAgICAgICAgICAgICAgIHJvd1JlZjogbGluZSArIDEsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogKGxpbmUgKyBpKS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHRoaXMuc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogJy0nXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFeGFtcGxlR3JpZEJ1aWxkZXIgfSBmcm9tICcuL0V4YW1wbGVHcmlkQnVpbGRlcic7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvckV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBTY3JvbGxlckV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvU2Nyb2xsZXJFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBFZGl0aW5nRXh0ZW5zaW9uLCBHcmlkRWRpdEV2ZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQ2xpcGJvYXJkRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9DbGlwYm9hcmRFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBIaXN0b3J5RXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9IaXN0b3J5RXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgUGFuRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9QYW5FeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBDb21wdXRlRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9Db21wdXRlRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQmFzZVN0eWxlLCBTdHlsZSB9IGZyb20gJy4uL21vZGVsL3N0eWxlZC9TdHlsZSc7XHJcblxyXG5cclxuLy9sZXQgYnVpbGRlcjphbnkgPSBuZXcgRmxleEdyaWRCdWlsZGVyKDEsIDEpO1xyXG4vL2J1aWxkZXIgPSBuZXcgRmxleEdyaWRCdWlsZGVyKDUyICogNSwgMjUwKTtcclxubGV0IGJ1aWxkZXIgPSBuZXcgRXhhbXBsZUdyaWRCdWlsZGVyKDEwMCwgNTIsIG5ldyBTdHlsZShCYXNlU3R5bGUsIHtcclxuICAgIHRleHRBbGlnbm1lbnQ6ICdyaWdodCdcclxufSkpO1xyXG5cclxubGV0IG1vZGVsID0gYnVpbGRlci5idWlsZCgpO1xyXG5cclxubGV0IGdyaWQgPSBHcmlkRWxlbWVudFxyXG4gICAgLmNyZWF0ZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgneCcpKVxyXG4gICAgLmV4dGVuZChuZXcgU2Nyb2xsZXJFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IFNlbGVjdG9yRXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBFZGl0aW5nRXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBDbGlwYm9hcmRFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IEhpc3RvcnlFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IFBhbkV4dGVuc2lvbigpKVxyXG4gICAgLmV4dGVuZChuZXcgQ29tcHV0ZUV4dGVuc2lvbigpKVxyXG4gICAgLm1lcmdlSW50ZXJmYWNlKClcclxuO1xyXG5cclxuZ3JpZC5tb2RlbCA9IG1vZGVsO1xyXG5ncmlkLm9uKCdpbnB1dCcsIChlOkdyaWRFZGl0RXZlbnQpID0+XHJcbntcclxuICAgIGUuY2hhbmdlcy5mb3JFYWNoKHggPT5cclxuICAgIHtcclxuICAgICAgICB4LmNlbGwudmFsdWUgPSB4LnZhbHVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZ3JpZC5yZWRyYXcoKTtcclxufSk7XHJcblxyXG53aW5kb3dbJ2dyaWQnXSA9IGdyaWQ7XHJcblxyXG5cclxuLy93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGUgPT5cclxuLy97XHJcbi8vICAgIGlmICghZS5jdHJsS2V5KVxyXG4vLyAgICAgICAgcmV0dXJuO1xyXG4vL1xyXG4vLyAgICBpZiAoZS5rZXkgPT09ICdhJylcclxuLy8gICAge1xyXG4vLyAgICAgICAgbGV0IHYgPSBncmlkLnNjcm9sbExlZnQgLSAxMDA7XHJcbi8vICAgICAgICAvL3R3ZWVuLmVuYWJsZShncmlkLCB7IHNjcm9sbExlZnQ6IHYgfSwgLjUsICgpID0+IGdyaWQuc2Nyb2xsTGVmdCA9IHYpO1xyXG4vLyAgICAgICAgZ3JpZC5zY3JvbGxMZWZ0ID0gdjtcclxuLy8gICAgfVxyXG4vLyAgICBpZiAoZS5rZXkgPT09ICdkJylcclxuLy8gICAge1xyXG4vLyAgICAgICAgbGV0IHYgPSBncmlkLnNjcm9sbExlZnQgKyAxMDA7XHJcbi8vICAgICAgICAvL3R3ZWVuLmVuYWJsZShncmlkLCB7IHNjcm9sbExlZnQ6IHYgfSwgLjUsICgpID0+IGdyaWQuc2Nyb2xsTGVmdCA9IHYpO1xyXG4vLyAgICAgICAgZ3JpZC5zY3JvbGxMZWZ0ID0gdjtcclxuLy8gICAgfVxyXG4vLyAgICBpZiAoZS5rZXkgPT09ICd3JylcclxuLy8gICAge1xyXG4vLyAgICAgICAgbGV0IHYgPSBncmlkLnNjcm9sbFRvcCAtIDEwMDtcclxuLy8gICAgICAgIC8vdHdlZW4uZW5hYmxlKGdyaWQsIHsgc2Nyb2xsVG9wOiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbFRvcCA9IHYpO1xyXG4vLyAgICAgICAgZ3JpZC5zY3JvbGxUb3AgPSB2O1xyXG4vLyAgICB9XHJcbi8vICAgIGlmIChlLmtleSA9PT0gJ3MnKVxyXG4vLyAgICB7XHJcbi8vICAgICAgICBsZXQgdiA9IGdyaWQuc2Nyb2xsVG9wICsgMTAwO1xyXG4vLyAgICAgICAgLy90d2Vlbi5lbmFibGUoZ3JpZCwgeyBzY3JvbGxUb3A6IHYgfSwgLjUsICgpID0+IGdyaWQuc2Nyb2xsVG9wID0gdik7XHJcbi8vICAgICAgICBncmlkLnNjcm9sbFRvcCA9IHY7XHJcbi8vICAgIH1cclxuLy99KSIsImltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgQ2xpcGJvYXJkIH0gZnJvbSAnLi4vdmVuZG9yL2NsaXBib2FyZCc7XHJcbmltcG9ydCB7IFNlbGVjdG9yV2lkZ2V0IH0gZnJvbSAnLi9TZWxlY3RvckV4dGVuc2lvbic7XHJcbmltcG9ydCB7IEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgdmFyaWFibGUsIGNvbW1hbmQsIHJvdXRpbmUgfSBmcm9tICcuLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgKiBhcyBQYXBhIGZyb20gJ3BhcGFwYXJzZSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuXHJcbi8vSSBrbm93Li4uIDooXHJcbmNvbnN0IE5ld0xpbmUgPSAhIXdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goLy4qW1d3XVtJaV1bTm5dLiovKSA/ICdcXHJcXG4nIDogJ1xcbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpcGJvYXJkRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgY29weUxpc3Q6c3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgY29weVJhbmdlOkdyaWRSYW5nZSA9IEdyaWRSYW5nZS5lbXB0eSgpO1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGNvcHlOZXQ6Q29weU5ldDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX0MnLCAoZTpLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmNvcHlTZWxlY3Rpb24oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMub25XaW5kb3dQYXN0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbk5ldCgpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6YmVnaW5FZGl0JywgKCkgPT4gdGhpcy5yZXNldENvcHkoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IGNhcHR1cmVTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnY2FwdHVyZVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB3aWR0aDogdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgaGVpZ2h0OiB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHQucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgICAgIHRoaXMuY29weU5ldCA9IENvcHlOZXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIGNvcHlTZWxlY3Rpb24oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kb0NvcHkodGhpcy5zZWxlY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuYWxpZ25OZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHJlc2V0Q29weSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQ29weShbXSk7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZG9Db3B5KGNlbGxzOnN0cmluZ1tdLCBkZWxpbWl0ZXI6c3RyaW5nID0gJ1xcdCcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNvcHlMaXN0ID0gY2VsbHM7XHJcbiAgICAgICAgbGV0IHJhbmdlID0gdGhpcy5jb3B5UmFuZ2UgPSBHcmlkUmFuZ2UuY3JlYXRlKHRoaXMuZ3JpZC5tb2RlbCwgY2VsbHMpO1xyXG4gICAgICAgIGxldCB0ZXh0ID0gJyc7XHJcblxyXG4gICAgICAgIGlmICghY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByciA9IHJhbmdlLmx0clswXS5yb3dSZWY7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZS5sdHIubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgYyA9IHJhbmdlLmx0cltpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyciAhPT0gYy5yb3dSZWYpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gTmV3TGluZTtcclxuICAgICAgICAgICAgICAgIHJyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gYy52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpIDwgKHJhbmdlLmx0ci5sZW5ndGggLSAxKSAmJiByYW5nZS5sdHJbaSArIDFdLnJvd1JlZiA9PT0gcnIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gZGVsaW1pdGVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBDbGlwYm9hcmQuY29weSh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvUGFzdGUodGV4dDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgZm9jdXNlZENlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHNlbGVjdGlvblswXSk7XHJcblxyXG4gICAgICAgIGxldCBwYXJzZWQgPSBQYXBhLnBhcnNlKHRleHQsIHtcclxuICAgICAgICAgICAgZGVsaW1pdGVyOiB0ZXh0LmluZGV4T2YoJ1xcdCcpID49IDAgPyAnXFx0JyA6IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGRhdGEgPSBwYXJzZWQuZGF0YS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDEgfHwgKHgubGVuZ3RoID09IDEgJiYgISF4WzBdKSk7XHJcbiAgICAgICAgaWYgKCFkYXRhLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgd2lkdGggPSBfLm1heChkYXRhLCB4ID0+IHgubGVuZ3RoKS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IGhlaWdodCA9IGRhdGEubGVuZ3RoO1xyXG4gICAgICAgIGxldCBzdGFydFZlY3RvciA9IG5ldyBQb2ludChmb2N1c2VkQ2VsbC5jb2xSZWYsIGZvY3VzZWRDZWxsLnJvd1JlZik7XHJcbiAgICAgICAgbGV0IGVuZFZlY3RvciA9IHN0YXJ0VmVjdG9yLmFkZChuZXcgUG9pbnQod2lkdGgsIGhlaWdodCkpO1xyXG5cclxuICAgICAgICBsZXQgcGFzdGVSYW5nZSA9IEdyaWRSYW5nZS5zZWxlY3QoZ3JpZC5tb2RlbCwgc3RhcnRWZWN0b3IsIGVuZFZlY3Rvcik7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VzID0ge30gYXMgYW55O1xyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgcGFzdGVSYW5nZS5sdHIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeHkgPSBuZXcgUG9pbnQoY2VsbC5jb2xSZWYsIGNlbGwucm93UmVmKS5zdWJ0cmFjdChzdGFydFZlY3Rvcik7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbeHkueV1beHkueF0gfHwgJyc7XHJcblxyXG4gICAgICAgICAgICBjaGFuZ2VzW2NlbGwucmVmXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdjb21taXQnLCBjaGFuZ2VzKTtcclxuICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ3NlbGVjdCcsIHBhc3RlUmFuZ2UubHRyLm1hcCh4ID0+IHgucmVmKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbk5ldCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBjb3B5TGlzdCwgY29weU5ldCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGNvcHlMaXN0Lmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogSW1wcm92ZSB0aGUgc2hpdCBvdXQgb2YgdGhpczpcclxuICAgICAgICAgICAgbGV0IG5ldFJlY3QgPSBSZWN0LmZyb21NYW55KGNvcHlMaXN0Lm1hcCh4ID0+IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHgpKSk7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuZ290byhuZXRSZWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29weU5ldC5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25XaW5kb3dQYXN0ZShlOkNsaXBib2FyZEV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGFlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgICB3aGlsZSAoISFhZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghIWFlLmNsYXNzTmFtZSAmJiBhZS5jbGFzc05hbWUuaW5kZXhPZignZ3JpZCcpID49IDApXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGFlID0gYWUucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYWUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9wbGFpbicpO1xyXG4gICAgICAgIGlmICh0ZXh0ICE9PSBudWxsICYmIHRleHQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9QYXN0ZSh0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb3B5TmV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50KTpDb3B5TmV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLW5ldCBncmlkLW5ldC1jb3B5JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb3B5TmV0KHJvb3QpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcblxyXG5cclxuY29uc3QgUmVmRXh0cmFjdCA9IC8oPyEuKlsnXCJgXSlbQS1aYS16XStbMC05XSs6PyhbQS1aYS16XStbMC05XSk/L2c7XHJcbmNvbnN0IFJlZkNvbnZlcnQgPSAvKFtBLVphLXpdKykoWzAtOV0rKS9nO1xyXG5cclxuY29uc3QgU3VwcG9ydEZ1bmN0aW9ucyA9IHtcclxuICAgIC8vTWF0aDpcclxuICAgIGFiczogTWF0aC5hYnMsXHJcbiAgICBhY29zOiBNYXRoLmFjb3MsXHJcbiAgICBhc2luOiBNYXRoLmFzaW4sXHJcbiAgICBhdGFuOiBNYXRoLmF0YW4sXHJcbiAgICBhdGFuMjogTWF0aC5hdGFuMixcclxuICAgIGNlaWw6IE1hdGguY2VpbCxcclxuICAgIGNvczogTWF0aC5jb3MsXHJcbiAgICBleHA6IE1hdGguZXhwLFxyXG4gICAgZmxvb3I6IE1hdGguZmxvb3IsXHJcbiAgICBsb2c6IE1hdGgubG9nLFxyXG4gICAgbWF4OiBNYXRoLm1heCxcclxuICAgIG1pbjogTWF0aC5taW4sXHJcbiAgICBwb3c6IE1hdGgucG93LFxyXG4gICAgcmFuZG9tOiBNYXRoLnJhbmRvbSxcclxuICAgIHJvdW5kOiBNYXRoLnJvdW5kLFxyXG4gICAgc2luOiBNYXRoLnNpbixcclxuICAgIHNxcnQ6IE1hdGguc3FydCxcclxuICAgIHRhbjogTWF0aC50YW4sXHJcbiAgICAvL0N1c3RvbTpcclxuICAgIHN1bTogZnVuY3Rpb24odmFsdWVzOm51bWJlcltdKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFsdWVzLnJlZHVjZSgodCwgeCkgPT4gdCArIHgsIDApO1xyXG4gICAgfSxcclxufTtcclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENvbXB1dGVFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgdHJhY2tlcjpPYmplY3RNYXA8c3RyaW5nPiA9IHt9O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnY29tbWl0JywgdGhpcy5jb21taXRPdmVycmlkZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBrZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2JlZ2luRWRpdCcsIHRoaXMuYmVnaW5FZGl0T3ZlcnJpZGUuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWdpbkVkaXRPdmVycmlkZShvdmVycmlkZTpzdHJpbmcsIGltcGw6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgc2VsZWN0aW9uLCB0cmFja2VyIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXNlbGVjdGlvblswXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghb3ZlcnJpZGUgJiYgb3ZlcnJpZGUgIT09ICcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb3ZlcnJpZGUgPSB0cmFja2VyW3NlbGVjdGlvblswXV0gfHwgbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbXBsKG92ZXJyaWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbW1pdE92ZXJyaWRlKGNoYW5nZXM6T2JqZWN0TWFwPHN0cmluZz4sIGltcGw6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgdHJhY2tlciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcmVmIGluIGNoYW5nZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdmFsID0gY2hhbmdlc1tyZWZdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPiAwICYmIHZhbFswXSA9PT0gJz0nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyW3JlZl0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzW3JlZl0gPSB0aGlzLmV2YWx1YXRlKHZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGltcGwoY2hhbmdlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBldmFsdWF0ZShmb3JtdWxhOnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IG51bGwgYXMgUmVnRXhwRXhlY0FycmF5O1xyXG4gICAgICAgIHdoaWxlIChyZXN1bHQgPSBSZWZFeHRyYWN0LmV4ZWMoZm9ybXVsYSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGZvcm11bGEgPVxyXG4gICAgICAgICAgICAgICAgZm9ybXVsYS5zdWJzdHIoMCwgcmVzdWx0LmluZGV4KSArXHJcbiAgICAgICAgICAgICAgICBgZXhwcignJHtyZXN1bHRbMF19JylgICtcclxuICAgICAgICAgICAgICAgIGZvcm11bGEuc3Vic3RyaW5nKHJlc3VsdC5pbmRleCArIHJlc3VsdFswXS5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZ1bmN0aW9ucyA9IGV4dGVuZCh7fSwgU3VwcG9ydEZ1bmN0aW9ucyk7XHJcbiAgICAgICAgZnVuY3Rpb25zLmV4cHIgPSB0aGlzLnJlc29sdmVFeHByLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIGxldCBjb2RlID0gYHdpdGggKGFyZ3VtZW50c1swXSkgeyByZXR1cm4gKCR7Zm9ybXVsYS5zdWJzdHIoMSl9KTsgfWAudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coY29kZSk7XHJcblxyXG4gICAgICAgIGxldCBmID0gbmV3IEZ1bmN0aW9uKGNvZGUpLmJpbmQobnVsbCwgZnVuY3Rpb25zKTtcclxuICAgICAgICByZXR1cm4gZigpLnRvU3RyaW5nKCkgfHwgJzAnO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzb2x2ZUV4cHIoZXhwcjpzdHJpbmcpOm51bWJlcnxudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCBbZnJvbSwgdG9dID0gZXhwci5zcGxpdCgnOicpO1xyXG5cclxuICAgICAgICBsZXQgZnJvbUNlbGwgPSB0aGlzLnJlc29sdmVSZWYoZnJvbSk7XHJcblxyXG4gICAgICAgIGlmICh0byA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChmcm9tQ2VsbC52YWx1ZSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdG9DZWxsID0gdGhpcy5yZXNvbHZlUmVmKHRvKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIWZyb21DZWxsICYmICEhdG9DZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZnJvbVZlY3RvciA9IG5ldyBQb2ludChmcm9tQ2VsbC5jb2xSZWYsIGZyb21DZWxsLnJvd1JlZik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdG9WZWN0b3IgPSBuZXcgUG9pbnQodG9DZWxsLmNvbFJlZiwgdG9DZWxsLnJvd1JlZik7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJhbmdlID0gR3JpZFJhbmdlLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwsIGZyb21WZWN0b3IsIHRvVmVjdG9yLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYW5nZS5sdHIubWFwKHggPT4gcGFyc2VJbnQoeC52YWx1ZSkgfHwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzb2x2ZVJlZihuYW1lUmVmOnN0cmluZyk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBSZWZDb252ZXJ0Lmxhc3RJbmRleCA9IDA7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFJlZkNvbnZlcnQuZXhlYyhuYW1lUmVmKTtcclxuXHJcbiAgICAgICAgbGV0IGV4cHJSZWYgPSByZXN1bHRbMV07XHJcbiAgICAgICAgbGV0IHJvd1JlZiA9IHBhcnNlSW50KHJlc3VsdFsyXSk7XHJcbiAgICAgICAgbGV0IGNvbFJlZiA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBleHByUmVmLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHggPSAoZXhwclJlZi5sZW5ndGggLSAxKSAtIGk7XHJcbiAgICAgICAgICAgIGxldCBuID0gZXhwclJlZlt4XS50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCkgLSA2NDtcclxuICAgICAgICAgICAgY29sUmVmICs9IG4gKiAoMjYgKiBpKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpID09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbFJlZiArPSBuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLm1vZGVsLmxvY2F0ZUNlbGwoY29sUmVmIC0gMSwgcm93UmVmIC0gMSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcbmltcG9ydCB7IEFic1dpZGdldEJhc2UsIFdpZGdldCB9IGZyb20gJy4uL3VpL1dpZGdldCc7XHJcbmltcG9ydCB7IGNvbW1hbmQsIHJvdXRpbmUsIHZhcmlhYmxlIH0gZnJvbSAnLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcblxyXG5cclxuY29uc3QgVmVjdG9ycyA9IHtcclxuICAgIG46IG5ldyBQb2ludCgwLCAtMSksXHJcbiAgICBzOiBuZXcgUG9pbnQoMCwgMSksXHJcbiAgICBlOiBuZXcgUG9pbnQoMSwgMCksXHJcbiAgICB3OiBuZXcgUG9pbnQoLTEsIDApLFxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkRWRpdEV2ZW50XHJcbntcclxuICAgIGNoYW5nZXM6R3JpZEVkaXRJbnRlbnRbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkRWRpdEludGVudFxyXG57XHJcbiAgICBjZWxsOkdyaWRDZWxsO1xyXG4gICAgdmFsdWU6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElucHV0V2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuICAgIGZvY3VzKCk6dm9pZDtcclxuICAgIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0aW5nRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgaW5wdXQ6SW5wdXQ7XHJcblxyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBpc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICBLZXlJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFFU0NBUEUnLCAoKSA9PiB0aGlzLmVuZEVkaXQoZmFsc2UpKVxyXG4gICAgICAgICAgICAub24oJyFFTlRFUicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchVEFCJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignVVBfQVJST1cnLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignRE9XTl9BUlJPVycsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCdSSUdIVF9BUlJPVycsICgpID0+IHsgaWYgKCF0aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5lKTsgfSB9KVxyXG4gICAgICAgICAgICAub24oJ0xFRlRfQVJST1cnLCAoKSA9PiB7IGlmICghdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCkgeyB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMudyk7IH0gfSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKHRoaXMuaW5wdXQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoKSA9PiB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gdHJ1ZSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchREVMRVRFJywgKCkgPT4gdGhpcy5lcmFzZSgpKVxyXG4gICAgICAgICAgICAub24oJyFCQUNLU1BBQ0UnLCAoKSA9PiB0aGlzLmJlZ2luRWRpdCgnJykpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdEQkxDTElDSzpQUklNQVJZJywgKCkgPT4gdGhpcy5iZWdpbkVkaXQobnVsbCkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdrZXlwcmVzcycsIChlOkdyaWRLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmJlZ2luRWRpdChTdHJpbmcuZnJvbUNoYXJDb2RlKGUuY2hhckNvZGUpKSk7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6ZG9TZWxlY3QnLCAoKSA9PiB0aGlzLmVuZEVkaXQodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHByaW1hcnlTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgncHJpbWFyeVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBsYXllci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgICAgIGxheWVyLnN0eWxlLndpZHRoID0gdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JztcclxuICAgICAgICBsYXllci5zdHlsZS5oZWlnaHQgPSB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHQucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgICAgIHRoaXMuaW5wdXQgPSBJbnB1dC5jcmVhdGUobGF5ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgYmVnaW5FZGl0KG92ZXJyaWRlOnN0cmluZyk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgeyBpbnB1dCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ3JpZC5tb2RlbC5maW5kQ2VsbCh0aGlzLnNlbGVjdGlvblswXSk7XHJcblxyXG4gICAgICAgIGlmICghIW92ZXJyaWRlIHx8IG92ZXJyaWRlID09PSAnJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChvdmVycmlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChjZWxsLnZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlucHV0LmdvdG8odGhpcy5wcmltYXJ5U2VsZWN0b3Iudmlld1JlY3QpO1xyXG4gICAgICAgIGlucHV0LmZvY3VzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZW5kRWRpdChjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCB7IGdyaWQsIGlucHV0LCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gaW5wdXQudmFsKCk7XHJcblxyXG4gICAgICAgIGlucHV0LmhpZGUoKTtcclxuICAgICAgICBpbnB1dC52YWwoJycpO1xyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbW1pdCAmJiAhIXNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLnNsaWNlKDAsIDEpLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmRFZGl0VG9OZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGNvbW1pdDpib29sZWFuID0gdHJ1ZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmVuZEVkaXQoY29tbWl0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0TmVpZ2hib3InLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVyYXNlKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuY29tbWl0VW5pZm9ybShzZWxlY3Rpb24sICcnKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIGNvbW1pdFVuaWZvcm0oY2VsbHM6c3RyaW5nW10sIHVuaWZvcm1WYWx1ZTphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgY2hhbmdlcyA9IF8uemlwUGFpcnMoY2VsbHMubWFwKHggPT4gW3gsIHVuaWZvcm1WYWx1ZV0pKTtcclxuICAgICAgICB0aGlzLmNvbW1pdChjaGFuZ2VzKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGNvbW1pdChjaGFuZ2VzOk9iamVjdE1hcDxzdHJpbmc+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGV2dDpHcmlkRWRpdEV2ZW50ID0ge1xyXG4gICAgICAgICAgICBjaGFuZ2VzOiBfLnVuemlwUGFpcnMoY2hhbmdlcykubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgICAgIGNlbGw6IGdyaWQubW9kZWwuZmluZENlbGwoeFswXSksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogeFsxXSxcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZ3JpZC5lbWl0KCdpbnB1dCcsIGV2dCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIElucHV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MSW5wdXRFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQpOklucHV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIHJvb3QudHlwZSA9ICd0ZXh0JztcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLWlucHV0JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgIG1hcmdpbjogJzAnLFxyXG4gICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dChyb290KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ290byh2aWV3UmVjdDpSZWN0TGlrZSwgYXV0b1Nob3c6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBzdXBlci5nb3RvKHZpZXdSZWN0KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnJvb3QsIHtcclxuICAgICAgICAgICAgbGVmdDogYCR7dmlld1JlY3QubGVmdCArIDJ9cHhgLFxyXG4gICAgICAgICAgICB0b3A6IGAke3ZpZXdSZWN0LnRvcCArIDJ9cHhgLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dmlld1JlY3Qud2lkdGh9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3ZpZXdSZWN0LmhlaWdodH1weGAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZvY3VzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gdGhpcy5yb290O1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJvb3QuZm9jdXMoKTtcclxuICAgICAgICAgICAgcm9vdC5zZXRTZWxlY3Rpb25SYW5nZShyb290LnZhbHVlLmxlbmd0aCwgcm9vdC52YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH0sIDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWwodmFsdWU/OnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QudmFsdWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gJy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCdcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhpc3RvcnlBY3Rpb25cclxue1xyXG4gICAgYXBwbHkoKTp2b2lkO1xyXG5cclxuICAgIHJvbGxiYWNrKCk6dm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIENlbGxFZGl0U25hcHNob3Rcclxue1xyXG4gICAgcmVmOnN0cmluZztcclxuICAgIG5ld1ZhbDpzdHJpbmc7XHJcbiAgICBvbGRWYWw6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSGlzdG9yeUV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgZnV0dXJlOkhpc3RvcnlBY3Rpb25bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBwYXN0Okhpc3RvcnlBY3Rpb25bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1onLCAoKSA9PiB0aGlzLnVuZG8oKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfWScsICgpID0+IHRoaXMucmVkbygpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsIHRoaXMuYmVmb3JlQ29tbWl0LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgdW5kbygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMucGFzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYWN0aW9uID0gdGhpcy5wYXN0LnBvcCgpO1xyXG4gICAgICAgIGFjdGlvbi5yb2xsYmFjaygpO1xyXG4gICAgICAgIHRoaXMuZnV0dXJlLnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHJlZG8oKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmZ1dHVyZS5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYWN0aW9uID0gdGhpcy5mdXR1cmUucG9wKCk7XHJcbiAgICAgICAgYWN0aW9uLmFwcGx5KCk7XHJcbiAgICAgICAgdGhpcy5wYXN0LnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHB1c2goYWN0aW9uOkhpc3RvcnlBY3Rpb24pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhc3QucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWZvcmVDb21taXQoY2hhbmdlczpPYmplY3RNYXA8c3RyaW5nPik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm5vQ2FwdHVyZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgc25hcHNob3RzID0gdGhpcy5jcmVhdGVTbmFwc2hvdHMoY2hhbmdlcyk7XHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IHRoaXMuY3JlYXRlRWRpdEFjdGlvbihzbmFwc2hvdHMpO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVNuYXBzaG90cyhjaGFuZ2VzOk9iamVjdE1hcDxzdHJpbmc+KTpDZWxsRWRpdFNuYXBzaG90W11cclxuICAgIHtcclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmdyaWQubW9kZWw7XHJcbiAgICAgICAgbGV0IGJhdGNoID0gW10gYXMgQ2VsbEVkaXRTbmFwc2hvdFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCByZWYgaW4gY2hhbmdlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJhdGNoLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiByZWYsXHJcbiAgICAgICAgICAgICAgICBuZXdWYWw6IGNoYW5nZXNbcmVmXSxcclxuICAgICAgICAgICAgICAgIG9sZFZhbDogbW9kZWwuZmluZENlbGwocmVmKS52YWx1ZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYmF0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFZGl0QWN0aW9uKHNuYXBzaG90czpDZWxsRWRpdFNuYXBzaG90W10pOkhpc3RvcnlBY3Rpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhcHBseTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaWxlbnRDb21taXQoXy56aXBQYWlycyhzbmFwc2hvdHMubWFwKHggPT4gW3gucmVmLCB4Lm5ld1ZhbF0pKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJvbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNpbGVudENvbW1pdChfLnppcFBhaXJzKHNuYXBzaG90cy5tYXAoeCA9PiBbeC5yZWYsIHgub2xkVmFsXSkpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW52b2tlU2lsZW50Q29tbWl0KGNoYW5nZXM6T2JqZWN0TWFwPHN0cmluZz4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQga2VybmVsID0gdGhpcy5ncmlkLmtlcm5lbDtcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGtlcm5lbC5jb21tYW5kcy5leGVjKCdjb21taXQnLCBjaGFuZ2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5ub0NhcHR1cmUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3QnLCBfLmtleXMoY2hhbmdlcykpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQsIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSAnLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJ1xyXG5pbXBvcnQgeyBNb3VzZUlucHV0IH0gZnJvbSAnLi4vaW5wdXQvTW91c2VJbnB1dCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IEtleXMgfSBmcm9tICcuLi9pbnB1dC9LZXlzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUGFuRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICBsZXQgcGFubmluZyA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsYXN0ID0gbnVsbCBhcyBQb2ludDtcclxuXHJcbiAgICAgICAgZ3JpZC5vbigna2V5ZG93bicsIChlOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSBLZXlzLlNQQUNFKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGxhc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2tleXVwJywgKGU6S2V5Ym9hcmRFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT09IEtleXMuU1BBQ0UpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhbm5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGxhc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKGdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCdEUkFHOlBSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghcGFubmluZylcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGlmIChsYXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IG5ldyBQb2ludChlLmdyaWRYLCBlLmdyaWRZKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZWx0YSA9IG5leHQuc3VidHJhY3QobGFzdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxMZWZ0IC09IGRlbHRhLng7XHJcbiAgICAgICAgICAgICAgICBncmlkLnNjcm9sbFRvcCAtPSBkZWx0YS55O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsYXN0ID0gbmV3IFBvaW50KGUuZ3JpZFgsIGUuZ3JpZFkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2dyaWQua2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdiZWdpbkVkaXQnLCAob3ZlcnJpZGU6c3RyaW5nLCBpbXBsOmFueSkgPT5cclxuICAgICAgICAvL3tcclxuICAgICAgICAvLyAgICBpZiAocGFubmluZylcclxuICAgICAgICAvLyAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gICAgcmV0dXJuIGltcGwob3ZlcnJpZGUpO1xyXG4gICAgICAgIC8vfSk7XHJcblxyXG4gICAgICAgIC8vZ3JpZC5rZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2RvU2VsZWN0JywgKGNlbGxzOnN0cmluZ1tdID0gW10sIGF1dG9TY3JvbGw6Ym9vbGVhbiwgaW1wbDphbnkpID0+XHJcbiAgICAgICAgLy97XHJcbiAgICAgICAgLy8gICAgaWYgKHBhbm5pbmcpXHJcbiAgICAgICAgLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vICAgIHJldHVybiBpbXBsKGNlbGxzLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAvL30pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2Nyb2xsZXJFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNjcm9sbGVyWDpIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgc2Nyb2xsZXJZOkhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSB3ZWRnZVg6SFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHdlZGdlWTpIVE1MRGl2RWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignaW52YWxpZGF0ZScsICgpID0+IHRoaXMuYWxpZ25FbGVtZW50cygpKTtcclxuICAgICAgICBncmlkLm9uKCdzY3JvbGwnLCAoKSA9PiB0aGlzLmFsaWduRWxlbWVudHMoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSB0aGlzLmxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIGxheWVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XHJcbiAgICAgICAgbGF5ZXIuc3R5bGUud2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGggKyAncHgnO1xyXG4gICAgICAgIGxheWVyLnN0eWxlLmhlaWdodCA9IHRhcmdldC5jbGllbnRIZWlnaHQgKyAncHgnO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdC5wb3NpdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgc2Nyb2xsZXJYID0gdGhpcy5zY3JvbGxlclggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBzY3JvbGxlclguY2xhc3NOYW1lID0gJ2dyaWQtc2Nyb2xsZXIgZ3JpZC1zY3JvbGxlci14JztcclxuICAgICAgICBzY3JvbGxlclguYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vblNjcm9sbEhvcml6b250YWwuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbGF5ZXIuYXBwZW5kQ2hpbGQoc2Nyb2xsZXJYKTtcclxuXHJcbiAgICAgICAgbGV0IHdlZGdlWCA9IHRoaXMud2VkZ2VYID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgc2Nyb2xsZXJYLmFwcGVuZENoaWxkKHdlZGdlWCk7XHJcblxyXG4gICAgICAgIGxldCBzY3JvbGxlclkgPSB0aGlzLnNjcm9sbGVyWSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHNjcm9sbGVyWS5jbGFzc05hbWUgPSAnZ3JpZC1zY3JvbGxlciBncmlkLXNjcm9sbGVyLXknO1xyXG4gICAgICAgIHNjcm9sbGVyWS5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsVmVydGljYWwuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbGF5ZXIuYXBwZW5kQ2hpbGQoc2Nyb2xsZXJZKTtcclxuXHJcbiAgICAgICAgbGV0IHdlZGdlWSA9IHRoaXMud2VkZ2VZID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgc2Nyb2xsZXJZLmFwcGVuZENoaWxkKHdlZGdlWSk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5zY3JvbGxlclgsIHtcclxuICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ2F1dG8nLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICAgICAgd2lkdGg6IGAke3RoaXMuZ3JpZC53aWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogJzE2cHgnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgYm90dG9tOiAnMHB4JyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnNjcm9sbGVyWSwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgICAgICB3aWR0aDogJzE2cHgnLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGAke3RoaXMuZ3JpZC5oZWlnaHR9cHhgLFxyXG4gICAgICAgICAgICByaWdodDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbkVsZW1lbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5jc3ModGhpcy5zY3JvbGxlclgsIHtcclxuICAgICAgICAgICAgd2lkdGg6IGAke3RoaXMuZ3JpZC53aWR0aH1weGAsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy53ZWRnZVgsIHtcclxuICAgICAgICAgICAgd2lkdGg6IGAke3RoaXMuZ3JpZC52aXJ0dWFsV2lkdGh9cHhgLFxyXG4gICAgICAgICAgICBoZWlnaHQ6ICcxcHgnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zY3JvbGxlclguc2Nyb2xsTGVmdCAhPSB0aGlzLmdyaWQuc2Nyb2xsTGVmdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXJYLnNjcm9sbExlZnQgPSB0aGlzLmdyaWQuc2Nyb2xsTGVmdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5zY3JvbGxlclksIHtcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt0aGlzLmdyaWQuaGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLndlZGdlWSwge1xyXG4gICAgICAgICAgICB3aWR0aDogJzFweCcsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dGhpcy5ncmlkLnZpcnR1YWxIZWlnaHR9cHhgLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zY3JvbGxlclkuc2Nyb2xsVG9wICE9IHRoaXMuZ3JpZC5zY3JvbGxUb3ApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVyWS5zY3JvbGxUb3AgPSB0aGlzLmdyaWQuc2Nyb2xsVG9wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uU2Nyb2xsSG9yaXpvbnRhbCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQuc2Nyb2xsTGVmdCA9IHRoaXMuc2Nyb2xsZXJYLnNjcm9sbExlZnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvblNjcm9sbFZlcnRpY2FsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZC5zY3JvbGxUb3AgPSB0aGlzLnNjcm9sbGVyWS5zY3JvbGxUb3A7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCwgR3JpZE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuLi9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQnO1xyXG5pbXBvcnQgeyBXaWRnZXQsIEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5jb25zdCBWZWN0b3JzID0ge1xyXG4gICAgbnc6IG5ldyBQb2ludCgtMSwgLTEpLFxyXG4gICAgbjogbmV3IFBvaW50KDAsIC0xKSxcclxuICAgIG5lOiBuZXcgUG9pbnQoMSwgLTEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgc2U6IG5ldyBQb2ludCgxLCAxKSxcclxuICAgIHM6IG5ldyBQb2ludCgwLCAxKSxcclxuICAgIHN3OiBuZXcgUG9pbnQoLTEsIDEpLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmludGVyZmFjZSBTZWxlY3RHZXN0dXJlXHJcbntcclxuICAgIHN0YXJ0OnN0cmluZztcclxuICAgIGVuZDpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JXaWRnZXQgZXh0ZW5kcyBXaWRnZXRcclxue1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RvckV4dGVuc2lvbkV4cG9ydHNcclxue1xyXG4gICAgY2FuU2VsZWN0OmJvb2xlYW47XHJcblxyXG4gICAgcmVhZG9ubHkgc2VsZWN0aW9uOnN0cmluZ1tdXHJcblxyXG4gICAgcmVhZG9ubHkgcHJpbWFyeVNlbGVjdG9yOlNlbGVjdG9yV2lkZ2V0O1xyXG5cclxuICAgIHJlYWRvbmx5IGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICBzZWxlY3QoY2VsbHM6c3RyaW5nW10sIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0QWxsKCk6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEVkZ2UodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdE5laWdoYm9yKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdG9yRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNlbGVjdEdlc3R1cmU6U2VsZWN0R2VzdHVyZTtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBjYW5TZWxlY3Q6Ym9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3Rpb246c3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignIVRBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchU0hJRlQrVEFCJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJ1JJR0hUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJ0xFRlRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignRE9XTl9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5zKSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK1JJR0hUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignQ1RSTCtMRUZUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignQ1RSTCtVUF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrRE9XTl9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrQScsICgpID0+IHRoaXMuc2VsZWN0QWxsKCkpXHJcbiAgICAgICAgICAgIC5vbignSE9NRScsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignQ1RSTCtIT01FJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5udykpXHJcbiAgICAgICAgICAgIC5vbignRU5EJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK0VORCcsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMuc2UpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VEcmFnRXZlbnRTdXBwb3J0LmVuYWJsZShncmlkLnJvb3QpO1xyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpTSElGVCtQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+IHRoaXMuc2VsZWN0TGluZShuZXcgUG9pbnQoZS5ncmlkWCwgZS5ncmlkWSkpKVxyXG4gICAgICAgICAgICAub24oJ0RPV046UFJJTUFSWScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PiB0aGlzLmJlZ2luU2VsZWN0R2VzdHVyZShlLmdyaWRYLCBlLmdyaWRZKSlcclxuICAgICAgICAgICAgLm9uKCdEUkFHOlBSSU1BUlknLCAoZTpHcmlkTW91c2VEcmFnRXZlbnQpID0+IHRoaXMudXBkYXRlU2VsZWN0R2VzdHVyZShlLmdyaWRYLCBlLmdyaWRZKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCAoKSA9PiB0aGlzLnJlc2VsZWN0KGZhbHNlKSk7XHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnblNlbGVjdG9ycyhmYWxzZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHtcclxuICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxyXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgIHdpZHRoOiB0YXJnZXQuY2xpZW50V2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IHRhcmdldC5jbGllbnRIZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdC5wb3NpdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHJpbWFyeVNlbGVjdG9yID0gU2VsZWN0b3IuY3JlYXRlKGxheWVyLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmNhcHR1cmVTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9TZWxlY3QoY2VsbHMsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIHRoaXMuYWxpZ25TZWxlY3RvcnModHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RBbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLmNlbGxzLm1hcCh4ID0+IHgucmVmKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgeHkgPSB7IHg6IHN0YXJ0Q2VsbC5jb2xSZWYsIHk6IHN0YXJ0Q2VsbC5yb3dSZWYgfSBhcyBQb2ludExpa2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gZ3JpZC5tb2RlbFdpZHRoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gZ3JpZC5tb2RlbEhlaWdodCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDZWxsID0gZ3JpZC5tb2RlbC5sb2NhdGVDZWxsKHh5LngsIHh5LnkpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW3Jlc3VsdENlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgIGxldCBlbXB0eSA9IChjZWxsOkdyaWRDZWxsKSA9PiA8YW55PihjZWxsLnZhbHVlID09PSAnJyB8fCBjZWxsLnZhbHVlID09PSB1bmRlZmluZWQgfHwgY2VsbC52YWx1ZSA9PT0gbnVsbCk7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgY3VyckNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3Ioc3RhcnRDZWxsLnJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdENlbGwgPSA8R3JpZENlbGw+bnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghY3VyckNlbGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGEgPSBjdXJyQ2VsbDtcclxuICAgICAgICAgICAgICAgIGxldCBiID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKGEucmVmLCB2ZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYSB8fCAhYilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gISFhID8gYSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5KGEpICsgZW1wdHkoYikgPT0gMSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gZW1wdHkoYSkgPyBiIDogYTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjdXJyQ2VsbCA9IGI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRDZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbcmVzdWx0Q2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmICghcmVmKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG5cclxuICAgICAgICBsZXQgc3RhcnRQdCA9IGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHJlZikudG9wTGVmdCgpO1xyXG4gICAgICAgIGxldCBsaW5lUmVjdCA9IFJlY3QuZnJvbVBvaW50cyhzdGFydFB0LCBncmlkUHQpO1xyXG5cclxuICAgICAgICBsZXQgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChsaW5lUmVjdCkubWFwKHggPT4geC5yZWYpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHJlZiksIDEpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZSgwLCAwLCByZWYpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgYXV0b1Njcm9sbCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3IocmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW2NlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNlbGVjdChhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVtYWluaW5nID0gc2VsZWN0aW9uLmZpbHRlcih4ID0+ICEhZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcbiAgICAgICAgaWYgKHJlbWFpbmluZy5sZW5ndGggIT0gc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KHJlbWFpbmluZywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5TZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuXHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IHtcclxuICAgICAgICAgICAgc3RhcnQ6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICBlbmQ6IGNlbGwucmVmLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KFsgY2VsbC5yZWYgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0R2VzdHVyZSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSBncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcblxyXG4gICAgICAgIGlmICghY2VsbCB8fCBzZWxlY3RHZXN0dXJlLmVuZCA9PT0gY2VsbC5yZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgc2VsZWN0R2VzdHVyZS5lbmQgPSBjZWxsLnJlZjtcclxuXHJcbiAgICAgICAgbGV0IHJlZ2lvbiA9IFJlY3QuZnJvbU1hbnkoW1xyXG4gICAgICAgICAgICBncmlkLmdldENlbGxHcmlkUmVjdChzZWxlY3RHZXN0dXJlLnN0YXJ0KSxcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5lbmQpXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIGxldCBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlZ2lvbilcclxuICAgICAgICAgICAgLm1hcCh4ID0+eC5yZWYpO1xyXG5cclxuICAgICAgICBpZiAoY2VsbFJlZnMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHNlbGVjdEdlc3R1cmUuc3RhcnQpLCAxKTtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHNlbGVjdEdlc3R1cmUuc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGNlbGxSZWZzLmxlbmd0aCA9PSAxKTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvU2VsZWN0KGNlbGxzOnN0cmluZ1tdID0gW10sIGF1dG9TY3JvbGw6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBjZWxscztcclxuXHJcbiAgICAgICAgICAgIGlmIChhdXRvU2Nyb2xsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJpbWFyeVJlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChjZWxsc1swXSk7XHJcbiAgICAgICAgICAgICAgICBncmlkLnNjcm9sbFRvKHByaW1hcnlSZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFsaWduU2VsZWN0b3JzKGFuaW1hdGU6Ym9vbGVhbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiwgcHJpbWFyeVNlbGVjdG9yLCBjYXB0dXJlU2VsZWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3Qoc2VsZWN0aW9uWzBdKTtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmdvdG8ocHJpbWFyeVJlY3QsIGFuaW1hdGUpO1xyXG5cclxuICAgICAgICAgICAgLy9UT0RPOiBJbXByb3ZlIHRoZSBzaGl0IG91dCBvZiB0aGlzOlxyXG4gICAgICAgICAgICBsZXQgY2FwdHVyZVJlY3QgPSBSZWN0LmZyb21NYW55KHNlbGVjdGlvbi5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuZ290byhjYXB0dXJlUmVjdCwgYW5pbWF0ZSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci50b2dnbGUoc2VsZWN0aW9uLmxlbmd0aCA+IDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2VsZWN0b3IgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxEaXZFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQsIHByaW1hcnk6Ym9vbGVhbiA9IGZhbHNlKTpTZWxlY3RvclxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1zZWxlY3RvciAnICsgKHByaW1hcnkgPyAnZ3JpZC1zZWxlY3Rvci1wcmltYXJ5JyA6ICcnKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rvcihyb290KTtcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQb2ludExpa2UgXHJcbntcclxuICAgIHg6bnVtYmVyO1xyXG4gICAgeTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEJyb3dzZXJQb2ludCA9IHsgbGVmdDpudW1iZXI7IHRvcDpudW1iZXI7IH07XHJcbmV4cG9ydCB0eXBlIFBvaW50SW5wdXQgPSBudW1iZXJbXXxQb2ludHxQb2ludExpa2V8QnJvd3NlclBvaW50O1xyXG5cclxuZXhwb3J0IGNsYXNzIFBvaW50IGltcGxlbWVudHMgUG9pbnRMaWtlXHJcbntcclxuICAgIHB1YmxpYyByZWFkb25seSB4Om51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgeTpudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcmFkMmRlZzpudW1iZXIgPSAzNjAgLyAoTWF0aC5QSSAqIDIpO1xyXG4gICAgcHVibGljIHN0YXRpYyBkZWcycmFkOm51bWJlciA9IChNYXRoLlBJICogMikgLyAzNjA7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbXB0eSA9IG5ldyBQb2ludCgwLCAwKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgbWF4ID0gbmV3IFBvaW50KDIxNDc0ODM2NDcsIDIxNDc0ODM2NDcpO1xyXG4gICAgcHVibGljIHN0YXRpYyBtaW4gPSBuZXcgUG9pbnQoLTIxNDc0ODM2NDcsIC0yMTQ3NDgzNjQ3KTtcclxuICAgIHB1YmxpYyBzdGF0aWMgdXAgPSBuZXcgUG9pbnQoMCwgLTEpO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXZlcmFnZShwb2ludHM6UG9pbnRMaWtlW10pOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFwb2ludHMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIFBvaW50LmVtcHR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHggPSAwLCB5ID0gMDtcclxuXHJcbiAgICAgICAgcG9pbnRzLmZvckVhY2gocCA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeCArPSBwLng7XHJcbiAgICAgICAgICAgIHkgKz0gcC55O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHggLyBwb2ludHMubGVuZ3RoLCB5IC8gcG9pbnRzLmxlbmd0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBkaXJlY3Rpb24oZnJvbTpQb2ludElucHV0LCB0bzpQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwdEFyZyh0bykuc3VidHJhY3QoZnJvbSkubm9ybWFsaXplKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKHNvdXJjZTpQb2ludElucHV0KTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwdEFyZyhzb3VyY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbUJ1ZmZlcihidWZmZXI6bnVtYmVyW10sIGluZGV4Om51bWJlciA9IDApOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChidWZmZXJbaW5kZXhdLCBidWZmZXJbaW5kZXggKyAxXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoeDpudW1iZXJ8bnVtYmVyW10sIHk/Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9ICh4WzBdKTtcclxuICAgICAgICAgICAgdGhpcy55ID0gKHhbMV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnggPSAoPG51bWJlcj54KTtcclxuICAgICAgICAgICAgdGhpcy55ID0gKHkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3JlZ2lvbiBHZW9tZXRyeVxyXG5cclxuICAgIHB1YmxpYyBhbmdsZSgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAodGhpcy54IDwgMClcclxuICAgICAgICAgICAgPyAzNjAgLSBNYXRoLmF0YW4yKHRoaXMueCwgLXRoaXMueSkgKiBQb2ludC5yYWQyZGVnICogLTFcclxuICAgICAgICAgICAgOiBNYXRoLmF0YW4yKHRoaXMueCwgLXRoaXMueSkgKiBQb2ludC5yYWQyZGVnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhbmdsZUFib3V0KHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHB0LmNyb3NzKHRoaXMpLCBwdC5kb3QodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcm9zcyh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogcHQueSAtIHRoaXMueSAqIHB0Lng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3RhbmNlKHRvOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHRvKTtcclxuICAgICAgICBsZXQgYSA9IHRoaXMueCAtIHB0Lng7XHJcbiAgICAgICAgbGV0IGIgPSB0aGlzLnkgLSBwdC55O1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRvdCh2YWw6UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogcHQueCArIHRoaXMueSAqIHB0Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxlbmd0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbm9ybWFsaXplKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuICAgICAgICBpZiAobGVuID4gMC4wMDAwMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KDEgLyBsZW4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcGVycCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnkgKiAtMSwgdGhpcy54KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcnBlcnAoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJldmVyc2UoKS5wZXJwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludmVyc2UoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogLTEsIHRoaXMueSAqIC0xKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmV2ZXJzZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiAtMSwgdGhpcy55ICogLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByb3RhdGUocmFkaWFuczpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvcyA9IE1hdGguY29zKHJhZGlhbnMpO1xyXG4gICAgICAgIGxldCBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcclxuICAgICAgICBsZXQgbnggPSB0aGlzLnggKiBjb3MgLSB0aGlzLnkgKiBzaW47XHJcbiAgICAgICAgbGV0IG55ID0gdGhpcy55ICogY29zICsgdGhpcy54ICogc2luO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KG54LCBueSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxuXHJcbiAgICAvL3JlZ2lvbiBBcml0aG1ldGljXHJcblxyXG4gICAgcHVibGljIGFkZCh2YWw6bnVtYmVyfFBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICBpZiAoIXB0KSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdhZGQ6IHB0IHJlcXVpcmVkLic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHB0LngsIHRoaXMueSArIHB0LnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXZpZGUoZGl2aXNvcjpudW1iZXIpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggLyBkaXZpc29yLCB0aGlzLnkgLyBkaXZpc29yKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbXVsdGlwbHkobXVsdGlwbGVyOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIG11bHRpcGxlciwgdGhpcy55ICogbXVsdGlwbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcm91bmQoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoTWF0aC5yb3VuZCh0aGlzLngpLCBNYXRoLnJvdW5kKHRoaXMueSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdWJ0cmFjdCh2YWw6bnVtYmVyfFBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICBpZiAoIXB0KSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdzdWJ0cmFjdDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChwdC5yZXZlcnNlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZW5kcmVnaW9uXHJcblxyXG4gICAgLy9yZWdpb24gQ29udmVyc2lvblxyXG5cclxuICAgIHB1YmxpYyBjbG9uZSgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVxdWFscyhhbm90aGVyOlBvaW50TGlrZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggPT09IGFub3RoZXIueCAmJiB0aGlzLnkgPT09IGFub3RoZXIueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9BcnJheSgpOm51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueV07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKCk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGBbJHt0aGlzLnh9LCAke3RoaXMueX1dYDtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG59XHJcblxyXG5mdW5jdGlvbiBwdEFyZyh2YWw6YW55KTpQb2ludFxyXG57XHJcbiAgICBpZiAodmFsICE9PSBudWxsIHx8IHZhbCAhPT0gdW5kZWZpbmVkKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBQb2ludClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiA8UG9pbnQ+dmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsLnggIT09IHVuZGVmaW5lZCAmJiB2YWwueSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwueCwgdmFsLnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsLmxlZnQgIT09IHVuZGVmaW5lZCAmJiB2YWwudG9wICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbC5sZWZ0LCB2YWwudG9wKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoPG51bWJlcltdPnZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YodmFsKSA9PT0gJ3N0cmluZycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YWwgPSBwYXJzZUludCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdudW1iZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQb2ludC5lbXB0eTtcclxufSIsImltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuL1BvaW50JztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlY3RMaWtlXHJcbntcclxuICAgIGxlZnQ6bnVtYmVyO1xyXG4gICAgdG9wOm51bWJlcjtcclxuICAgIHdpZHRoOm51bWJlcjtcclxuICAgIGhlaWdodDpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZWN0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHk6UmVjdCA9IG5ldyBSZWN0KDAsIDAsIDAsIDApO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbUVkZ2VzKGxlZnQ6bnVtYmVyLCB0b3A6bnVtYmVyLCByaWdodDpudW1iZXIsIGJvdHRvbTpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICBsZWZ0LFxyXG4gICAgICAgICAgICB0b3AsXHJcbiAgICAgICAgICAgIHJpZ2h0IC0gbGVmdCxcclxuICAgICAgICAgICAgYm90dG9tIC0gdG9wXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21MaWtlKGxpa2U6UmVjdExpa2UpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QobGlrZS5sZWZ0LCBsaWtlLnRvcCwgbGlrZS53aWR0aCwgbGlrZS5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbU1hbnkocmVjdHM6UmVjdFtdKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBvaW50cyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVjdHMubWFwKHggPT4geC5wb2ludHMoKSkpO1xyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21Qb2ludEJ1ZmZlcihwb2ludHMpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21Qb2ludHMoLi4ucG9pbnRzOlBvaW50W10pXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tUG9pbnRCdWZmZXIocG9pbnRzOlBvaW50W10sIGluZGV4PzpudW1iZXIsIGxlbmd0aD86bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLnNsaWNlKGluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLnNsaWNlKDAsIGxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tRWRnZXMoXHJcbiAgICAgICAgICAgIE1hdGgubWluKC4uLnBvaW50cy5tYXAocCA9PiBwLngpKSxcclxuICAgICAgICAgICAgTWF0aC5taW4oLi4ucG9pbnRzLm1hcChwID0+IHAueSkpLFxyXG4gICAgICAgICAgICBNYXRoLm1heCguLi5wb2ludHMubWFwKHAgPT4gcC54KSksXHJcbiAgICAgICAgICAgIE1hdGgubWF4KC4uLnBvaW50cy5tYXAocCA9PiBwLnkpKVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGxlZnQ6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSB0b3A6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSB3aWR0aDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGhlaWdodDpudW1iZXIgPSAwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGxlZnQ6bnVtYmVyLCB0b3A6bnVtYmVyLCB3aWR0aDpudW1iZXIsIGhlaWdodDpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcclxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCByaWdodCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdCArIHRoaXMud2lkdGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBib3R0b20oKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjZW50ZXIoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy5sZWZ0ICsgKHRoaXMud2lkdGggLyAyKSwgdGhpcy50b3AgKyAodGhpcy5oZWlnaHQgLyAyKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvcExlZnQoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy5sZWZ0LCB0aGlzLnRvcCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBvaW50cygpOlBvaW50W11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICBuZXcgUG9pbnQodGhpcy5sZWZ0LCB0aGlzLnRvcCksXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLnJpZ2h0LCB0aGlzLnRvcCksXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLnJpZ2h0LCB0aGlzLmJvdHRvbSksXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaXplKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2Zmc2V0KHB0OlBvaW50TGlrZSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgdGhpcy5sZWZ0ICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy50b3AgKyBwdC55LFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoLFxyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnRhaW5zKGlucHV0OlBvaW50fFJlY3RMaWtlKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGlucHV0Wyd4J10gIT09IHVuZGVmaW5lZCAmJiBpbnB1dFsneSddICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHQgPSA8UG9pbnQ+aW5wdXQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgcHQueCA+PSB0aGlzLmxlZnRcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPj0gdGhpcy50b3BcclxuICAgICAgICAgICAgICAgICYmIHB0LnggPD0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA8PSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZWN0ID0gPFJlY3RMaWtlPmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHJlY3QubGVmdCA+PSB0aGlzLmxlZnQgJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wID49IHRoaXMudG9wICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgKyByZWN0LndpZHRoIDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5mbGF0ZShzaXplOlBvaW50KTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgLSBzaXplLngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wIC0gc2l6ZS55LFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoICsgc2l6ZS54LFxyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCArIHNpemUueVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludGVyc2VjdHMocmVjdDpSZWN0TGlrZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiByZWN0LmxlZnQgKyByZWN0LndpZHRoID4gdGhpcy5sZWZ0XHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPiB0aGlzLnRvcFxyXG4gICAgICAgICAgICAmJiByZWN0LmxlZnQgPCB0aGlzLmxlZnQgKyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wIDwgdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbm9ybWFsaXplKCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndpZHRoID49IDAgJiYgdGhpcy5oZWlnaHQgPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHggPSB0aGlzLmxlZnQ7XHJcbiAgICAgICAgdmFyIHkgPSB0aGlzLnRvcDtcclxuICAgICAgICB2YXIgdyA9IHRoaXMud2lkdGg7XHJcbiAgICAgICAgdmFyIGggPSB0aGlzLmhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKHcgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeCArPSB3O1xyXG4gICAgICAgICAgICB3ID0gTWF0aC5hYnModyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChoIDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHkgKz0gaDtcclxuICAgICAgICAgICAgaCA9IE1hdGguYWJzKGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy5sZWZ0fSwgJHt0aGlzLnRvcH0sICR7dGhpcy53aWR0aH0sICR7dGhpcy5oZWlnaHR9XWA7XHJcbiAgICB9XHJcbn0iLCIiLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50Q2FsbGJhY2ssIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgaW1wbGVtZW50cyBFdmVudEVtaXR0ZXJcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyB3cmFwKHRhcmdldDpFdmVudFRhcmdldHxFdmVudEVtaXR0ZXIpOkV2ZW50RW1pdHRlclxyXG4gICAge1xyXG4gICAgICAgIGlmICghIXRhcmdldFsnYWRkRXZlbnRMaXN0ZW5lciddKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoPEV2ZW50VGFyZ2V0PnRhcmdldCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gPEV2ZW50RW1pdHRlcj50YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQ6RXZlbnRUYXJnZXQpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9uKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICB0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY2FuY2VsOiAoKSA9PiB0aGlzLm9mZihldmVudCwgY2FsbGJhY2spLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9mZihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVtaXQoZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuZGlzcGF0Y2hFdmVudChcclxuICAgICAgICAgICAgXy5leHRlbmQobmV3IEV2ZW50KGV2ZW50KSwgeyBhcmdzOiBhcmdzIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5cclxuXHJcbmxldCBUcmFja2VyOk9iamVjdEluZGV4PGJvb2xlYW4+O1xyXG5cclxuZXhwb3J0IGNsYXNzIEtleUNoZWNrXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgaW5pdCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIVRyYWNrZXIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBUcmFja2VyID0ge307XHJcblxyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiBUcmFja2VyW2Uua2V5Q29kZV0gPSB0cnVlKTtcclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGU6IEtleWJvYXJkRXZlbnQpID0+IFRyYWNrZXJbZS5rZXlDb2RlXSA9IGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBkb3duKGtleTpudW1iZXIpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISFUcmFja2VyICYmICEhVHJhY2tlcltrZXldO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgS2V5cyB9IGZyb20gJy4vS2V5cyc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEtleUV4cHJlc3Npb25cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcpOktleUV4cHJlc3Npb25cclxuICAgIHtcclxuICAgICAgICBsZXQgZXhjbHVzaXZlID0gaW5wdXRbMF0gPT09ICchJztcclxuICAgICAgICBpZiAoZXhjbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHIoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQga2V5cyA9IGlucHV0XHJcbiAgICAgICAgICAgIC5zcGxpdCgvW1xcc1xcLVxcK10rLylcclxuICAgICAgICAgICAgLm1hcCh4ID0+IEtleXMucGFyc2UoeCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEtleUV4cHJlc3Npb24oa2V5cywgZXhjbHVzaXZlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY3RybDpib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGFsdDpib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHNoaWZ0OmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5Om51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBleGNsdXNpdmU6Ym9vbGVhbjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKGtleXM6bnVtYmVyW10sIGV4Y2x1c2l2ZTpib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZXhjbHVzaXZlID0gZXhjbHVzaXZlO1xyXG5cclxuICAgICAgICB0aGlzLmN0cmwgPSBrZXlzLnNvbWUoeCA9PiB4ID09PSBLZXlzLkNUUkwpO1xyXG4gICAgICAgIHRoaXMuYWx0ID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5BTFQpO1xyXG4gICAgICAgIHRoaXMuc2hpZnQgPSBrZXlzLnNvbWUoeCA9PiB4ID09PSBLZXlzLlNISUZUKTtcclxuICAgICAgICB0aGlzLmtleSA9IGtleXMuZmlsdGVyKHggPT4geCAhPT0gS2V5cy5DVFJMICYmIHggIT09IEtleXMuQUxUICYmIHggIT09IEtleXMuU0hJRlQpWzBdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hdGNoZXMoa2V5RGF0YTpLZXlFeHByZXNzaW9ufEtleWJvYXJkRXZlbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoa2V5RGF0YSBpbnN0YW5jZW9mIEtleUV4cHJlc3Npb24pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHJsID09IGtleURhdGEuY3RybCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hbHQgPT0ga2V5RGF0YS5hbHQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hpZnQgPT0ga2V5RGF0YS5zaGlmdCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5rZXkgPT0ga2V5RGF0YS5rZXlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoa2V5RGF0YSBpbnN0YW5jZW9mIEtleWJvYXJkRXZlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHJsID09IGtleURhdGEuY3RybEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hbHQgPT0ga2V5RGF0YS5hbHRLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hpZnQgPT0ga2V5RGF0YS5zaGlmdEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5rZXkgPT0ga2V5RGF0YS5rZXlDb2RlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aHJvdyAnS2V5RXhwcmVzc2lvbi5tYXRjaGVzOiBJbnZhbGlkIGlucHV0JztcclxuICAgIH1cclxufSIsImltcG9ydCB7IEV2ZW50RW1pdHRlciwgRXZlbnRFbWl0dGVyQmFzZSwgRXZlbnRTdWJzY3JpcHRpb24gfSBmcm9tICcuLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuaW1wb3J0IHsgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIH0gZnJvbSAnLi9FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXInO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIEtleU1hcHBhYmxlID0gRXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyQmFzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgS2V5TWFwQ2FsbGJhY2tcclxue1xyXG4gICAgKGU/OktleWJvYXJkRXZlbnQpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlJbnB1dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGZvciguLi5lbG10czpLZXlNYXBwYWJsZVtdKTpLZXlJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgS2V5SW5wdXQobm9ybWFsaXplKGVsbXRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdWJzOkV2ZW50U3Vic2NyaXB0aW9uW10gPSBbXTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcnM6RXZlbnRFbWl0dGVyW10pXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9uKGV4cHJzOnN0cmluZ3xzdHJpbmdbXSwgY2FsbGJhY2s6S2V5TWFwQ2FsbGJhY2spOktleUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4cHJzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uKFs8c3RyaW5nPmV4cHJzXSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgcmUgb2YgZXhwcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc3MgPSB0aGlzLmVtaXR0ZXJzLm1hcChlZSA9PiB0aGlzLmNyZWF0ZUxpc3RlbmVyKFxyXG4gICAgICAgICAgICAgICAgZWUsXHJcbiAgICAgICAgICAgICAgICBLZXlFeHByZXNzaW9uLnBhcnNlKHJlKSxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN1YnMgPSB0aGlzLnN1YnMuY29uY2F0KHNzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlTGlzdGVuZXIoZWU6RXZlbnRFbWl0dGVyLCBrZTpLZXlFeHByZXNzaW9uLCBjYWxsYmFjazpLZXlNYXBDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZWUub24oJ2tleWRvd24nLCAoZXZ0OktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoa2UubWF0Y2hlcyhldnQpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2UuZXhjbHVzaXZlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZShrbXM6S2V5TWFwcGFibGVbXSk6RXZlbnRFbWl0dGVyW11cclxue1xyXG4gICAgcmV0dXJuIDxFdmVudEVtaXR0ZXJbXT5rbXNcclxuICAgICAgICAubWFwKHggPT4gKCEheFsnYWRkRXZlbnRMaXN0ZW5lciddKVxyXG4gICAgICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoPEV2ZW50VGFyZ2V0PngpXHJcbiAgICAgICAgICAgIDogeFxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbiIsImltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlzXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgQkFDS1NQQUNFID0gODtcclxuICAgIHB1YmxpYyBzdGF0aWMgVEFCID0gOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5URVIgPSAxMztcclxuICAgIHB1YmxpYyBzdGF0aWMgU0hJRlQgPSAxNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgQ1RSTCA9IDE3O1xyXG4gICAgcHVibGljIHN0YXRpYyBBTFQgPSAxODtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFVU0UgPSAxOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0FQU19MT0NLID0gMjA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVTQ0FQRSA9IDI3O1xyXG4gICAgcHVibGljIHN0YXRpYyBTUEFDRSA9IDMyO1xyXG4gICAgcHVibGljIHN0YXRpYyBQQUdFX1VQID0gMzM7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBR0VfRE9XTiA9IDM0O1xyXG4gICAgcHVibGljIHN0YXRpYyBFTkQgPSAzNTtcclxuICAgIHB1YmxpYyBzdGF0aWMgSE9NRSA9IDM2O1xyXG4gICAgcHVibGljIHN0YXRpYyBMRUZUX0FSUk9XID0gMzc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFVQX0FSUk9XID0gMzg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFJJR0hUX0FSUk9XID0gMzk7XHJcbiAgICBwdWJsaWMgc3RhdGljIERPV05fQVJST1cgPSA0MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgSU5TRVJUID0gNDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIERFTEVURSA9IDQ2O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfMCA9IDQ4O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfMSA9IDQ5O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfMiA9IDUwO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfMyA9IDUxO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfNCA9IDUyO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfNSA9IDUzO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfNiA9IDU0O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfNyA9IDU1O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfOCA9IDU2O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfOSA9IDU3O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfQSA9IDY1O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfQiA9IDY2O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfQyA9IDY3O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfRCA9IDY4O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfRSA9IDY5O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfRiA9IDcwO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfRyA9IDcxO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfSCA9IDcyO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfSSA9IDczO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfSiA9IDc0O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfSyA9IDc1O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfTCA9IDc2O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfTSA9IDc3O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfTiA9IDc4O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfTyA9IDc5O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfUCA9IDgwO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfUSA9IDgxO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfUiA9IDgyO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfUyA9IDgzO1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfVCA9IDg0O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfVSA9IDg1O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfViA9IDg2O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfVyA9IDg3O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfWCA9IDg4O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfWSA9IDg5O1xyXG4gICAgcHVibGljIHN0YXRpYyBLRVlfWiA9IDkwO1xyXG4gICAgcHVibGljIHN0YXRpYyBMRUZUX01FVEEgPSA5MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFRfTUVUQSA9IDkyO1xyXG4gICAgcHVibGljIHN0YXRpYyBTRUxFQ1QgPSA5MztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzAgPSA5NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzEgPSA5NztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzIgPSA5ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzMgPSA5OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzQgPSAxMDA7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF81ID0gMTAxO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNiA9IDEwMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzcgPSAxMDM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF84ID0gMTA0O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfOSA9IDEwNTtcclxuICAgIHB1YmxpYyBzdGF0aWMgTVVMVElQTFkgPSAxMDY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEFERCA9IDEwNztcclxuICAgIHB1YmxpYyBzdGF0aWMgU1VCVFJBQ1QgPSAxMDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIERFQ0lNQUwgPSAxMTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIERJVklERSA9IDExMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjEgPSAxMTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYyID0gMTEzO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMyA9IDExNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjQgPSAxMTU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY1ID0gMTE2O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNiA9IDExNztcclxuICAgIHB1YmxpYyBzdGF0aWMgRjcgPSAxMTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY4ID0gMTE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBGOSA9IDEyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjEwID0gMTIxO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTEgPSAxMjI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMiA9IDEyMztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNX0xPQ0sgPSAxNDQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNDUk9MTF9MT0NLID0gMTQ1O1xyXG4gICAgcHVibGljIHN0YXRpYyBTRU1JQ09MT04gPSAxODY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVRVUFMUyA9IDE4NztcclxuICAgIHB1YmxpYyBzdGF0aWMgQ09NTUEgPSAxODg7XHJcbiAgICBwdWJsaWMgc3RhdGljIERBU0ggPSAxODk7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBFUklPRCA9IDE5MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRk9SV0FSRF9TTEFTSCA9IDE5MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgR1JBVkVfQUNDRU5UID0gMTkyO1xyXG4gICAgcHVibGljIHN0YXRpYyBPUEVOX0JSQUNLRVQgPSAyMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEJBQ0tfU0xBU0ggPSAyMjA7XHJcbiAgICBwdWJsaWMgc3RhdGljIENMT1NFX0JSQUNLRVQgPSAyMjE7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNJTkdMRV9RVU9URSA9IDIyMjtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZywgdGhyb3duT25GYWlsOmJvb2xlYW4gPSB0cnVlKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBzd2l0Y2ggKGlucHV0LnRyaW0oKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ0JBQ0tTUEFDRSc6IHJldHVybiBLZXlzLkJBQ0tTUEFDRTtcclxuICAgICAgICAgICAgY2FzZSAnVEFCJzogcmV0dXJuIEtleXMuVEFCO1xyXG4gICAgICAgICAgICBjYXNlICdFTlRFUic6IHJldHVybiBLZXlzLkVOVEVSO1xyXG4gICAgICAgICAgICBjYXNlICdTSElGVCc6IHJldHVybiBLZXlzLlNISUZUO1xyXG4gICAgICAgICAgICBjYXNlICdDVFJMJzogcmV0dXJuIEtleXMuQ1RSTDtcclxuICAgICAgICAgICAgY2FzZSAnQUxUJzogcmV0dXJuIEtleXMuQUxUO1xyXG4gICAgICAgICAgICBjYXNlICdQQVVTRSc6IHJldHVybiBLZXlzLlBBVVNFO1xyXG4gICAgICAgICAgICBjYXNlICdDQVBTX0xPQ0snOiByZXR1cm4gS2V5cy5DQVBTX0xPQ0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0VTQ0FQRSc6IHJldHVybiBLZXlzLkVTQ0FQRTtcclxuICAgICAgICAgICAgY2FzZSAnU1BBQ0UnOiByZXR1cm4gS2V5cy5TUEFDRTtcclxuICAgICAgICAgICAgY2FzZSAnUEFHRV9VUCc6IHJldHVybiBLZXlzLlBBR0VfVVA7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBR0VfRE9XTic6IHJldHVybiBLZXlzLlBBR0VfRE9XTjtcclxuICAgICAgICAgICAgY2FzZSAnRU5EJzogcmV0dXJuIEtleXMuRU5EO1xyXG4gICAgICAgICAgICBjYXNlICdIT01FJzogcmV0dXJuIEtleXMuSE9NRTtcclxuICAgICAgICAgICAgY2FzZSAnTEVGVF9BUlJPVyc6IHJldHVybiBLZXlzLkxFRlRfQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1VQX0FSUk9XJzogcmV0dXJuIEtleXMuVVBfQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1JJR0hUX0FSUk9XJzogcmV0dXJuIEtleXMuUklHSFRfQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RPV05fQVJST1cnOiByZXR1cm4gS2V5cy5ET1dOX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdJTlNFUlQnOiByZXR1cm4gS2V5cy5JTlNFUlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RFTEVURSc6IHJldHVybiBLZXlzLkRFTEVURTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzAnOiByZXR1cm4gS2V5cy5LRVlfMDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzEnOiByZXR1cm4gS2V5cy5LRVlfMTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzInOiByZXR1cm4gS2V5cy5LRVlfMjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzMnOiByZXR1cm4gS2V5cy5LRVlfMztcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzQnOiByZXR1cm4gS2V5cy5LRVlfNDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzUnOiByZXR1cm4gS2V5cy5LRVlfNTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzYnOiByZXR1cm4gS2V5cy5LRVlfNjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzcnOiByZXR1cm4gS2V5cy5LRVlfNztcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzgnOiByZXR1cm4gS2V5cy5LRVlfODtcclxuICAgICAgICAgICAgY2FzZSAnS0VZXzknOiByZXR1cm4gS2V5cy5LRVlfOTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0EnOiByZXR1cm4gS2V5cy5LRVlfQTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0InOiByZXR1cm4gS2V5cy5LRVlfQjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0MnOiByZXR1cm4gS2V5cy5LRVlfQztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0QnOiByZXR1cm4gS2V5cy5LRVlfRDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0UnOiByZXR1cm4gS2V5cy5LRVlfRTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0YnOiByZXR1cm4gS2V5cy5LRVlfRjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0cnOiByZXR1cm4gS2V5cy5LRVlfRztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0gnOiByZXR1cm4gS2V5cy5LRVlfSDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0knOiByZXR1cm4gS2V5cy5LRVlfSTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0onOiByZXR1cm4gS2V5cy5LRVlfSjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0snOiByZXR1cm4gS2V5cy5LRVlfSztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX0wnOiByZXR1cm4gS2V5cy5LRVlfTDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX00nOiByZXR1cm4gS2V5cy5LRVlfTTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX04nOiByZXR1cm4gS2V5cy5LRVlfTjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX08nOiByZXR1cm4gS2V5cy5LRVlfTztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1AnOiByZXR1cm4gS2V5cy5LRVlfUDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1EnOiByZXR1cm4gS2V5cy5LRVlfUTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1InOiByZXR1cm4gS2V5cy5LRVlfUjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1MnOiByZXR1cm4gS2V5cy5LRVlfUztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1QnOiByZXR1cm4gS2V5cy5LRVlfVDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1UnOiByZXR1cm4gS2V5cy5LRVlfVTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1YnOiByZXR1cm4gS2V5cy5LRVlfVjtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1cnOiByZXR1cm4gS2V5cy5LRVlfVztcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1gnOiByZXR1cm4gS2V5cy5LRVlfWDtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1knOiByZXR1cm4gS2V5cy5LRVlfWTtcclxuICAgICAgICAgICAgY2FzZSAnS0VZX1onOiByZXR1cm4gS2V5cy5LRVlfWjtcclxuICAgICAgICAgICAgY2FzZSAnMCc6IHJldHVybiBLZXlzLktFWV8wO1xyXG4gICAgICAgICAgICBjYXNlICcxJzogcmV0dXJuIEtleXMuS0VZXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJzInOiByZXR1cm4gS2V5cy5LRVlfMjtcclxuICAgICAgICAgICAgY2FzZSAnMyc6IHJldHVybiBLZXlzLktFWV8zO1xyXG4gICAgICAgICAgICBjYXNlICc0JzogcmV0dXJuIEtleXMuS0VZXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJzUnOiByZXR1cm4gS2V5cy5LRVlfNTtcclxuICAgICAgICAgICAgY2FzZSAnNic6IHJldHVybiBLZXlzLktFWV82O1xyXG4gICAgICAgICAgICBjYXNlICc3JzogcmV0dXJuIEtleXMuS0VZXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJzgnOiByZXR1cm4gS2V5cy5LRVlfODtcclxuICAgICAgICAgICAgY2FzZSAnOSc6IHJldHVybiBLZXlzLktFWV85O1xyXG4gICAgICAgICAgICBjYXNlICdBJzogcmV0dXJuIEtleXMuS0VZX0E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0InOiByZXR1cm4gS2V5cy5LRVlfQjtcclxuICAgICAgICAgICAgY2FzZSAnQyc6IHJldHVybiBLZXlzLktFWV9DO1xyXG4gICAgICAgICAgICBjYXNlICdEJzogcmV0dXJuIEtleXMuS0VZX0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0UnOiByZXR1cm4gS2V5cy5LRVlfRTtcclxuICAgICAgICAgICAgY2FzZSAnRic6IHJldHVybiBLZXlzLktFWV9GO1xyXG4gICAgICAgICAgICBjYXNlICdHJzogcmV0dXJuIEtleXMuS0VZX0c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0gnOiByZXR1cm4gS2V5cy5LRVlfSDtcclxuICAgICAgICAgICAgY2FzZSAnSSc6IHJldHVybiBLZXlzLktFWV9JO1xyXG4gICAgICAgICAgICBjYXNlICdKJzogcmV0dXJuIEtleXMuS0VZX0o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0snOiByZXR1cm4gS2V5cy5LRVlfSztcclxuICAgICAgICAgICAgY2FzZSAnTCc6IHJldHVybiBLZXlzLktFWV9MO1xyXG4gICAgICAgICAgICBjYXNlICdNJzogcmV0dXJuIEtleXMuS0VZX007XHJcbiAgICAgICAgICAgIGNhc2UgJ04nOiByZXR1cm4gS2V5cy5LRVlfTjtcclxuICAgICAgICAgICAgY2FzZSAnTyc6IHJldHVybiBLZXlzLktFWV9PO1xyXG4gICAgICAgICAgICBjYXNlICdQJzogcmV0dXJuIEtleXMuS0VZX1A7XHJcbiAgICAgICAgICAgIGNhc2UgJ1EnOiByZXR1cm4gS2V5cy5LRVlfUTtcclxuICAgICAgICAgICAgY2FzZSAnUic6IHJldHVybiBLZXlzLktFWV9SO1xyXG4gICAgICAgICAgICBjYXNlICdTJzogcmV0dXJuIEtleXMuS0VZX1M7XHJcbiAgICAgICAgICAgIGNhc2UgJ1QnOiByZXR1cm4gS2V5cy5LRVlfVDtcclxuICAgICAgICAgICAgY2FzZSAnVSc6IHJldHVybiBLZXlzLktFWV9VO1xyXG4gICAgICAgICAgICBjYXNlICdWJzogcmV0dXJuIEtleXMuS0VZX1Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ1cnOiByZXR1cm4gS2V5cy5LRVlfVztcclxuICAgICAgICAgICAgY2FzZSAnWCc6IHJldHVybiBLZXlzLktFWV9YO1xyXG4gICAgICAgICAgICBjYXNlICdZJzogcmV0dXJuIEtleXMuS0VZX1k7XHJcbiAgICAgICAgICAgIGNhc2UgJ1onOiByZXR1cm4gS2V5cy5LRVlfWjtcclxuICAgICAgICAgICAgY2FzZSAnTEVGVF9NRVRBJzogcmV0dXJuIEtleXMuTEVGVF9NRVRBO1xyXG4gICAgICAgICAgICBjYXNlICdSSUdIVF9NRVRBJzogcmV0dXJuIEtleXMuUklHSFRfTUVUQTtcclxuICAgICAgICAgICAgY2FzZSAnU0VMRUNUJzogcmV0dXJuIEtleXMuU0VMRUNUO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfMCc6IHJldHVybiBLZXlzLk5VTVBBRF8wO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfMSc6IHJldHVybiBLZXlzLk5VTVBBRF8xO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfMic6IHJldHVybiBLZXlzLk5VTVBBRF8yO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfMyc6IHJldHVybiBLZXlzLk5VTVBBRF8zO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfNCc6IHJldHVybiBLZXlzLk5VTVBBRF80O1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfNSc6IHJldHVybiBLZXlzLk5VTVBBRF81O1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfNic6IHJldHVybiBLZXlzLk5VTVBBRF82O1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfNyc6IHJldHVybiBLZXlzLk5VTVBBRF83O1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfOCc6IHJldHVybiBLZXlzLk5VTVBBRF84O1xyXG4gICAgICAgICAgICBjYXNlICdOVU1QQURfOSc6IHJldHVybiBLZXlzLk5VTVBBRF85O1xyXG4gICAgICAgICAgICBjYXNlICdNVUxUSVBMWSc6IHJldHVybiBLZXlzLk1VTFRJUExZO1xyXG4gICAgICAgICAgICBjYXNlICdBREQnOiByZXR1cm4gS2V5cy5BREQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NVQlRSQUNUJzogcmV0dXJuIEtleXMuU1VCVFJBQ1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RFQ0lNQUwnOiByZXR1cm4gS2V5cy5ERUNJTUFMO1xyXG4gICAgICAgICAgICBjYXNlICdESVZJREUnOiByZXR1cm4gS2V5cy5ESVZJREU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxJzogcmV0dXJuIEtleXMuRjE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YyJzogcmV0dXJuIEtleXMuRjI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YzJzogcmV0dXJuIEtleXMuRjM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y0JzogcmV0dXJuIEtleXMuRjQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y1JzogcmV0dXJuIEtleXMuRjU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y2JzogcmV0dXJuIEtleXMuRjY7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y3JzogcmV0dXJuIEtleXMuRjc7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y4JzogcmV0dXJuIEtleXMuRjg7XHJcbiAgICAgICAgICAgIGNhc2UgJ0Y5JzogcmV0dXJuIEtleXMuRjk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMCc6IHJldHVybiBLZXlzLkYxMDtcclxuICAgICAgICAgICAgY2FzZSAnRjExJzogcmV0dXJuIEtleXMuRjExO1xyXG4gICAgICAgICAgICBjYXNlICdGMTInOiByZXR1cm4gS2V5cy5GMTI7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTV9MT0NLJzogcmV0dXJuIEtleXMuTlVNX0xPQ0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NDUk9MTF9MT0NLJzogcmV0dXJuIEtleXMuU0NST0xMX0xPQ0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NFTUlDT0xPTic6IHJldHVybiBLZXlzLlNFTUlDT0xPTjtcclxuICAgICAgICAgICAgY2FzZSAnRVFVQUxTJzogcmV0dXJuIEtleXMuRVFVQUxTO1xyXG4gICAgICAgICAgICBjYXNlICdDT01NQSc6IHJldHVybiBLZXlzLkNPTU1BO1xyXG4gICAgICAgICAgICBjYXNlICdEQVNIJzogcmV0dXJuIEtleXMuREFTSDtcclxuICAgICAgICAgICAgY2FzZSAnUEVSSU9EJzogcmV0dXJuIEtleXMuUEVSSU9EO1xyXG4gICAgICAgICAgICBjYXNlICdGT1JXQVJEX1NMQVNIJzogcmV0dXJuIEtleXMuRk9SV0FSRF9TTEFTSDtcclxuICAgICAgICAgICAgY2FzZSAnR1JBVkVfQUNDRU5UJzogcmV0dXJuIEtleXMuR1JBVkVfQUNDRU5UO1xyXG4gICAgICAgICAgICBjYXNlICdPUEVOX0JSQUNLRVQnOiByZXR1cm4gS2V5cy5PUEVOX0JSQUNLRVQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0JBQ0tfU0xBU0gnOiByZXR1cm4gS2V5cy5CQUNLX1NMQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdDTE9TRV9CUkFDS0VUJzogcmV0dXJuIEtleXMuQ0xPU0VfQlJBQ0tFVDtcclxuICAgICAgICAgICAgY2FzZSAnU0lOR0xFX1FVT1RFJzogcmV0dXJuIEtleXMuU0lOR0xFX1FVT1RFO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRocm93bk9uRmFpbClcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBrZXk6ICcgKyBpbnB1dDtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4vTW91c2VEcmFnRXZlbnQnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZURyYWdFdmVudFN1cHBvcnRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjaGVjayhlbG10OkhUTUxFbGVtZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVsbXQuZGF0YXNldFsnTW91c2VEcmFnRXZlbnRTdXBwb3J0J10gPT09ICd0cnVlJztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVuYWJsZShlbG10OkhUTUxFbGVtZW50KTpNb3VzZURyYWdFdmVudFN1cHBvcnRcclxuICAgIHtcclxuICAgICAgICBlbG10LmRhdGFzZXRbJ01vdXNlRHJhZ0V2ZW50U3VwcG9ydCddID0gJ3RydWUnO1xyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VEcmFnRXZlbnRTdXBwb3J0KGVsbXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBzaG91bGREcmFnOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByb3RlY3RlZCBpc0RyYWdnaW5nOmJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByb3RlY3RlZCBzdGFydFBvaW50OlBvaW50O1xyXG4gICAgcHJvdGVjdGVkIGxhc3RQb2ludDpQb2ludDtcclxuICAgIHByb3RlY3RlZCBjYW5jZWw6KCkgPT4gdm9pZDtcclxuICAgIHByb3RlY3RlZCBsaXN0ZW5lcjphbnk7XHJcblxyXG4gICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBlbG10OkhUTUxFbGVtZW50KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZWxtdC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmxpc3RlbmVyID0gdGhpcy5vblRhcmdldE1vdXNlRG93bi5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVsbXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5saXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uVGFyZ2V0TW91c2VEb3duKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIC8vZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG91bGREcmFnID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSB0aGlzLmxhc3RQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGxldCBtb3ZlSGFuZGxlciA9IHRoaXMub25XaW5kb3dNb3VzZU1vdmUuYmluZCh0aGlzKTtcclxuICAgICAgICBsZXQgdXBIYW5kbGVyID0gdGhpcy5vbldpbmRvd01vdXNlVXAuYmluZCh0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYW5jZWwgPSAoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB1cEhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvbldpbmRvd01vdXNlTW92ZShlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgbGV0IG5ld1BvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkRHJhZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0RyYWdnaW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnYmVnaW4nLCBlKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZycsIGUsIG5ld1BvaW50LnN1YnRyYWN0KHRoaXMubGFzdFBvaW50KSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RQb2ludCA9IG5ld1BvaW50O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvbldpbmRvd01vdXNlVXAoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnZW5kJywgZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG91bGREcmFnID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5sYXN0UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jYW5jZWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUV2ZW50KHR5cGU6c3RyaW5nLCBzb3VyY2U6TW91c2VFdmVudCwgZGlzdD86UG9pbnQpOk1vdXNlRHJhZ0V2ZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0gPE1vdXNlRHJhZ0V2ZW50PihuZXcgTW91c2VFdmVudCh0eXBlLCBzb3VyY2UpKTtcclxuICAgICAgICBldmVudC5zdGFydFggPSB0aGlzLnN0YXJ0UG9pbnQueDtcclxuICAgICAgICBldmVudC5zdGFydFkgPSB0aGlzLnN0YXJ0UG9pbnQueTtcclxuXHJcbiAgICAgICAgaWYgKGRpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBldmVudC5kaXN0WCA9IGRpc3QueDtcclxuICAgICAgICAgICAgZXZlbnQuZGlzdFkgPSBkaXN0Lnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBLZXlDaGVjayB9IGZyb20gJy4vS2V5Q2hlY2snO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIE1vdXNlRXZlbnRUeXBlID0gJ2NsaWNrJ3wnZGJsY2xpY2snfCdtb3VzZWRvd24nfCdtb3VzZW1vdmUnfCdtb3VzZXVwJ3wnZHJhZ2JlZ2luJ3wnZHJhZyd8J2RyYWdlbmQnXHJcblxyXG5mdW5jdGlvbiBwYXJzZV9ldmVudCh2YWx1ZTpzdHJpbmcpOk1vdXNlRXZlbnRUeXBlXHJcbntcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FzZSAnZG93bic6XHJcbiAgICAgICAgY2FzZSAnbW92ZSc6XHJcbiAgICAgICAgY2FzZSAndXAnOlxyXG4gICAgICAgICAgICByZXR1cm4gPE1vdXNlRXZlbnRUeXBlPignbW91c2UnICsgdmFsdWUpO1xyXG4gICAgICAgIGNhc2UgJ2NsaWNrJzpcclxuICAgICAgICBjYXNlICdkYmxjbGljayc6XHJcbiAgICAgICAgY2FzZSAnZG93bic6XHJcbiAgICAgICAgY2FzZSAnbW92ZSc6XHJcbiAgICAgICAgY2FzZSAndXAnOlxyXG4gICAgICAgIGNhc2UgJ2RyYWdiZWdpbic6XHJcbiAgICAgICAgY2FzZSAnZHJhZyc6XHJcbiAgICAgICAgY2FzZSAnZHJhZ2VuZCc6XHJcbiAgICAgICAgICAgIHJldHVybiA8TW91c2VFdmVudFR5cGU+dmFsdWU7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgTW91c2VFdmVudFR5cGU6ICcgKyB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VfYnV0dG9uKHZhbHVlOnN0cmluZyk6bnVtYmVyXHJcbntcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FzZSAncHJpbWFyeSc6XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMSc6XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIGNhc2UgJ3NlY29uZGFyeSc6XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMic6XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjMnOlxyXG4gICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBNb3VzZUJ1dHRvbjogJyArIHZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXZpZGVfZXhwcmVzc2lvbih2YWx1ZTpzdHJpbmcpOnN0cmluZ1tdXHJcbntcclxuICAgIGxldCBwYXJ0cyA9IHZhbHVlLnNwbGl0KCc6Jyk7XHJcblxyXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PSAxKVxyXG4gICAge1xyXG4gICAgICAgIHBhcnRzLnNwbGljZSgwLCAwLCAnZG93bicpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYXJ0cy5zbGljZSgwLCAyKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlRXhwcmVzc2lvblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZyk6TW91c2VFeHByZXNzaW9uXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNmZyA9IDxhbnk+e1xyXG4gICAgICAgICAgICBrZXlzOiBbXSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjZmcuZXhjbHVzaXZlID0gaW5wdXRbMF0gPT09ICchJztcclxuICAgICAgICBpZiAoY2ZnLmV4Y2x1c2l2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IFtsZWZ0LCByaWdodF0gPSBkaXZpZGVfZXhwcmVzc2lvbihpbnB1dCk7XHJcblxyXG4gICAgICAgIGNmZy5ldmVudCA9IHBhcnNlX2V2ZW50KGxlZnQpO1xyXG5cclxuICAgICAgICByaWdodC5zcGxpdCgvW1xcc1xcLVxcK10rLylcclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0gS2V5cy5wYXJzZSh4LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5rZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZmcuYnV0dG9uID0gcGFyc2VfYnV0dG9uKHgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZUV4cHJlc3Npb24oY2ZnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXZlbnQ6TW91c2VFdmVudFR5cGUgPSBudWxsO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJ1dHRvbjpudW1iZXIgPSBudWxsO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtleXM6bnVtYmVyW10gPSBbXTtcclxuICAgIHB1YmxpYyByZWFkb25seSBleGNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoY2ZnOmFueSlcclxuICAgIHtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCBjZmcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXRjaGVzKG1vdXNlRGF0YTpNb3VzZUV2ZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgIT09IG1vdXNlRGF0YS50eXBlKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJ1dHRvbiAhPT0gbnVsbCAmJiB0aGlzLmJ1dHRvbiAhPT0gbW91c2VEYXRhLmJ1dHRvbilcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBrIG9mIHRoaXMua2V5cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghS2V5Q2hlY2suZG93bihrKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJCYXNlLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgfSBmcm9tICcuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcic7XHJcbmltcG9ydCB7IE1vdXNlRXhwcmVzc2lvbiB9IGZyb20gJy4vTW91c2VFeHByZXNzaW9uJztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnRTdXBwb3J0IH0gZnJvbSAnLi9Nb3VzZURyYWdFdmVudFN1cHBvcnQnO1xyXG5pbXBvcnQgeyBLZXlDaGVjayB9IGZyb20gJy4vS2V5Q2hlY2snO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIE1hcHBhYmxlID0gRXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyQmFzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTW91c2VDYWxsYmFja1xyXG57XHJcbiAgICAoZTpFdmVudCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlSW5wdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBmb3IoLi4uZWxtdHM6TWFwcGFibGVbXSk6TW91c2VJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIEtleUNoZWNrLmluaXQoKTtcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlSW5wdXQobm9ybWFsaXplKGVsbXRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdWJzOkV2ZW50U3Vic2NyaXB0aW9uW10gPSBbXTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcnM6RXZlbnRFbWl0dGVyW10pXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9uKGV4cHI6c3RyaW5nLCBjYWxsYmFjazpNb3VzZUNhbGxiYWNrKTpNb3VzZUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHNzID0gdGhpcy5lbWl0dGVycy5tYXAoZWUgPT4gdGhpcy5jcmVhdGVMaXN0ZW5lcihcclxuICAgICAgICAgICAgZWUsXHJcbiAgICAgICAgICAgIE1vdXNlRXhwcmVzc2lvbi5wYXJzZShleHByKSxcclxuICAgICAgICAgICAgY2FsbGJhY2spKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlTGlzdGVuZXIodGFyZ2V0OkV2ZW50RW1pdHRlciwgZXhwcjpNb3VzZUV4cHJlc3Npb24sIGNhbGxiYWNrOk1vdXNlQ2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldC5vbihleHByLmV2ZW50LCAoZXZ0Ok1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZXhwci5tYXRjaGVzKGV2dCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChleHByLmV4Y2x1c2l2ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZ0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUoa21zOk1hcHBhYmxlW10pOkV2ZW50RW1pdHRlcltdXHJcbntcclxuICAgIHJldHVybiA8RXZlbnRFbWl0dGVyW10+a21zXHJcbiAgICAgICAgLm1hcCh4ID0+ICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICAgICAgPyBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD54KVxyXG4gICAgICAgICAgICA6IHhcclxuICAgICAgICApO1xyXG59XHJcblxyXG4iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShodG1sOnN0cmluZyk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgbGV0IGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICBsZXQgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcclxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoYm9keSk7XHJcbiAgICBib2R5LmlubmVySFRNTCA9IGh0bWw7XHJcblxyXG4gICAgcmV0dXJuIDxIVE1MRWxlbWVudD5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3NzKGU6SFRNTEVsZW1lbnQsIHN0eWxlczpPYmplY3RNYXA8c3RyaW5nPik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpXHJcbiAgICB7XHJcbiAgICAgICAgZS5zdHlsZVtwcm9wXSA9IHN0eWxlc1twcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhpZGUoZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdub25lJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3coZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdibG9jaycgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGUoZTpIVE1MRWxlbWVudCwgdmlzaWJsZTpib29sZWFuKTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gdmlzaWJsZSA/IHNob3coZSkgOiBoaWRlKGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlVHJhbnNpdGlvbihlOkhUTUxFbGVtZW50LCBwcm9wOnN0cmluZywgbWlsbGlzOm51bWJlciwgZWFzZTpzdHJpbmcgPSAnbGluZWFyJyk6dm9pZFxyXG57XHJcbiAgICBlLnN0eWxlLnRyYW5zaXRpb24gPSBgJHtwcm9wfSAke21pbGxpc31tcyAke2Vhc2V9YDtcclxuICAgIGNvbnNvbGUubG9nKGUuc3R5bGUudHJhbnNpdGlvbik7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IGUuc3R5bGUudHJhbnNpdGlvbiA9ICcnLCBtaWxsaXMpO1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBQcm9wZXJ0eUNoYW5nZWRDYWxsYmFja1xyXG57XHJcbiAgICAob2JqOmFueSwgdmFsOmFueSk6dm9pZFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkoZGVmYXVsdFZhbHVlOmFueSwgZmlsdGVyOlByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnksIHByb3BOYW1lOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBwcm9wTmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IHRoaXNbJ19fJyArIHByb3BOYW1lXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsID09PSB1bmRlZmluZWQpID8gZGVmYXVsdFZhbHVlIDogdmFsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcE5hbWVdID0gbmV3VmFsO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHRoaXMsIG5ld1ZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQ6YW55LCBkYXRhOmFueSk6YW55XHJcbntcclxuICAgIGZvciAobGV0IGsgaW4gZGF0YSlcclxuICAgIHtcclxuICAgICAgICB0YXJnZXRba10gPSBkYXRhW2tdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmRleDxUPihhcnI6VFtdLCBpbmRleGVyOih0bTpUKSA9PiBudW1iZXJ8c3RyaW5nKTpPYmplY3RNYXA8VD5cclxue1xyXG4gICAgbGV0IG9iaiA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IHRtIG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBvYmpbaW5kZXhlcih0bSldID0gdG07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGtleXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpzdHJpbmdbXVxyXG57XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaXgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsdWVzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6VFtdXHJcbntcclxuICAgIGxldCBhOlRbXSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGsgaW4gaXgpXHJcbiAgICB7XHJcbiAgICAgICAgYS5wdXNoKGl4W2tdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHppcFBhaXJzKHBhaXJzOmFueVtdW10pOmFueVxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgcGFpciBvZiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBvYmpbcGFpclswXV0gPSBwYWlyWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bnppcFBhaXJzKHBhaXJzOmFueSk6YW55W11bXVxyXG57XHJcbiAgICBsZXQgYXJyID0gW107XHJcblxyXG4gICAgZm9yIChsZXQga2V5IGluIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIGFyci5wdXNoKFtrZXksIHBhaXJzW2tleV1dKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXJyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4PFQ+KGFycjpUW10sIHNlbGVjdG9yOih0OlQpID0+IG51bWJlcik6VFxyXG57XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBsZXQgdCA9IGFyclswXTtcclxuXHJcbiAgICBmb3IgKGxldCB4IG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBpZiAoc2VsZWN0b3IodCkgPCBzZWxlY3Rvcih4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHQgPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRvd0Nsb25lKHRhcmdldDphbnkpOmFueVxyXG57XHJcbiAgICBpZiAodHlwZW9mKHRhcmdldCkgPT09ICdvYmplY3QnKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzYyA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0YXJnZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzY1twcm9wXSA9IHNoYWRvd0Nsb25lKHRhcmdldFtwcm9wXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2M7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufSIsIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQ6YW55LCBkYXRhOmFueSk6YW55XHJcbntcclxuICAgIGZvciAobGV0IGsgaW4gZGF0YSlcclxuICAgIHtcclxuICAgICAgICB0YXJnZXRba10gPSBkYXRhW2tdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmRleDxUPihhcnI6VFtdLCBpbmRleGVyOih0bTpUKSA9PiBudW1iZXJ8c3RyaW5nKTpPYmplY3RNYXA8VD5cclxue1xyXG4gICAgbGV0IG9iaiA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IHRtIG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBvYmpbaW5kZXhlcih0bSldID0gdG07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGtleXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpzdHJpbmdbXVxyXG57XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaXgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsdWVzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6VFtdXHJcbntcclxuICAgIGxldCBhOlRbXSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGsgaW4gaXgpXHJcbiAgICB7XHJcbiAgICAgICAgYS5wdXNoKGl4W2tdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHppcFBhaXJzKHBhaXJzOmFueVtdW10pOmFueVxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgcGFpciBvZiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBvYmpbcGFpclswXV0gPSBwYWlyWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bnppcFBhaXJzKHBhaXJzOmFueSk6YW55W11bXVxyXG57XHJcbiAgICBsZXQgYXJyID0gW107XHJcblxyXG4gICAgZm9yIChsZXQga2V5IGluIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIGFyci5wdXNoKFtrZXksIHBhaXJzW2tleV1dKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXJyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4PFQ+KGFycjpUW10sIHNlbGVjdG9yOih0OlQpID0+IG51bWJlcik6VFxyXG57XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBsZXQgdCA9IGFyclswXTtcclxuXHJcbiAgICBmb3IgKGxldCB4IG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBpZiAoc2VsZWN0b3IodCkgPCBzZWxlY3Rvcih4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHQgPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRvd0Nsb25lKHRhcmdldDphbnkpOmFueVxyXG57XHJcbiAgICBpZiAodHlwZW9mKHRhcmdldCkgPT09ICdvYmplY3QnKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzYyA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0YXJnZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzY1twcm9wXSA9IHNoYWRvd0Nsb25lKHRhcmdldFtwcm9wXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2M7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufSIsImltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4vR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy91dGlsJztcclxuXHJcblxyXG4vKipcclxuICogRGVzY3JpYmVzIGEgcmVzb2x2ZUV4cHIgb2YgZ3JpZCBjZWxscy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBHcmlkUmFuZ2Vcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgbmV3IEdyaWRSYW5nZSBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgY2VsbHMgd2l0aCB0aGUgc3BlY2lmaWVkIHJlZnMgZnJvbSB0aGVcclxuICAgICAqIHNwZWNpZmllZCBtb2RlbC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBjZWxsUmVmc1xyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShtb2RlbDpHcmlkTW9kZWwsIGNlbGxSZWZzOnN0cmluZ1tdKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbG9va3VwID0gXy5pbmRleChjZWxsUmVmcywgeCA9PiB4KTtcclxuXHJcbiAgICAgICAgbGV0IGNlbGxzID0gW10gYXMgR3JpZENlbGxbXTtcclxuICAgICAgICBsZXQgbGMgPSBOdW1iZXIuTUFYX1ZBTFVFLCBsciA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgbGV0IGhjID0gTnVtYmVyLk1JTl9WQUxVRSwgaHIgPSBOdW1iZXIuTUlOX1ZBTFVFO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIG1vZGVsLmNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFsb29rdXBbYy5yZWZdKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBjZWxscy5wdXNoKGMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxjID4gYy5jb2xSZWYpIGxjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChoYyA8IGMuY29sUmVmKSBoYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAobHIgPiBjLnJvd1JlZikgbHIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgaWYgKGhyIDwgYy5yb3dSZWYpIGhyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbHRyID0gY2VsbHMuc29ydChsdHJfc29ydCk7XHJcbiAgICAgICAgbGV0IHR0YiA9IGNlbGxzLnNsaWNlKDApLnNvcnQodHRiX3NvcnQpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogbHRyLFxyXG4gICAgICAgICAgICB0dGI6IHR0YixcclxuICAgICAgICAgICAgd2lkdGg6IGhjIC0gbGMsXHJcbiAgICAgICAgICAgIGhlaWdodDogaHIgLSBscixcclxuICAgICAgICAgICAgbGVuZ3RoOiAoaGMgLSBsYykgKiAoaHIgLSBsciksXHJcbiAgICAgICAgICAgIGNvdW50OiBjZWxscy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3RzIGEgcmVzb2x2ZUV4cHIgb2YgY2VsbHMgZnJvbSB0aGUgc3BlY2lmaWVkIG1vZGVsIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgdmVjdG9ycy4gIFRoZSB2ZWN0b3JzIHNob3VsZCBiZVxyXG4gICAgICogdHdvIHBvaW50cyBpbiBncmlkIGNvb3JkaW5hdGVzIChlLmcuIGNvbCBhbmQgcm93IHJlZmVyZW5jZXMpIHRoYXQgZHJhdyBhIGxvZ2ljYWwgbGluZSBhY3Jvc3MgdGhlIGdyaWQuXHJcbiAgICAgKiBBbnkgY2VsbHMgZmFsbGluZyBpbnRvIHRoZSByZWN0YW5nbGUgY3JlYXRlZCBmcm9tIHRoZXNlIHR3byBwb2ludHMgd2lsbCBiZSBpbmNsdWRlZCBpbiB0aGUgc2VsZWN0ZWQgcmVzb2x2ZUV4cHIuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gZnJvbVxyXG4gICAgICogQHBhcmFtIHRvXHJcbiAgICAgKiBAcGFyYW0gdG9JbmNsdXNpdmVcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBzZWxlY3QobW9kZWw6R3JpZE1vZGVsLCBmcm9tOlBvaW50LCB0bzpQb2ludCwgdG9JbmNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICAvL1RPRE86IEV4cGxhaW4gdGhpcy4uLlxyXG4gICAgICAgIGxldCB0bCA9IG5ldyBQb2ludChmcm9tLnggPCB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55IDwgdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG4gICAgICAgIGxldCBiciA9IG5ldyBQb2ludChmcm9tLnggPiB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55ID4gdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG5cclxuICAgICAgICBpZiAodG9JbmNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiciA9IGJyLmFkZCgxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaW1zID0gUmVjdC5mcm9tUG9pbnRzKHRsLCBicik7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXSBhcyBzdHJpbmdbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgciA9IGRpbXMudG9wOyByIDwgZGltcy5ib3R0b207IHIrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGMgPSBkaW1zLmxlZnQ7IGMgPCBkaW1zLnJpZ2h0OyBjKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gbW9kZWwubG9jYXRlQ2VsbChjLCByKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY3JlYXRlKG1vZGVsLCByZXN1bHRzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZW1wdHkgR3JpZFJhbmdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogW10sXHJcbiAgICAgICAgICAgIHR0YjogW10sXHJcbiAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMCxcclxuICAgICAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbHRyOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSB0b3AgdG8gYm90dG9tLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHRiOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaXRoIHdpZHRoIG9mIHRoZSByZXNvbHZlRXhwciBpbiBjb2x1bW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCBoZWlnaHQgb2YgdGhlIHJlc29sdmVFeHByIGluIHJvd3MuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiBjZWxscyBpbiB0aGUgcmVzb2x2ZUV4cHIgKHdpbGwgYmUgZGlmZmVyZW50IHRvIGxlbmd0aCBpZiBzb21lIGNlbGwgc2xvdHMgY29udGFpbiBubyBjZWxscykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb3VudDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbGVuZ3RoIG9mIHRoZSByZXNvbHZlRXhwciAobnVtYmVyIG9mIHJvd3MgKiBudW1iZXIgb2YgY29sdW1ucykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBsZW5ndGg6bnVtYmVyO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IodmFsdWVzOmFueSlcclxuICAgIHtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCB2YWx1ZXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBsdHJfc29ydChhOkdyaWRDZWxsLCBiOkdyaWRDZWxsKTpudW1iZXJcclxue1xyXG4gICAgbGV0IG4gPSAwO1xyXG5cclxuICAgIG4gPSBhLnJvd1JlZiAtIGIucm93UmVmO1xyXG4gICAgaWYgKG4gPT09IDApXHJcbiAgICB7XHJcbiAgICAgICAgbiA9IGEuY29sUmVmIC0gYi5jb2xSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR0Yl9zb3J0KGE6R3JpZENlbGwsIGI6R3JpZENlbGwpOm51bWJlclxyXG57XHJcbiAgICBsZXQgbiA9IDA7XHJcblxyXG4gICAgbiA9IGEuY29sUmVmIC0gYi5jb2xSZWY7XHJcbiAgICBpZiAobiA9PT0gMClcclxuICAgIHtcclxuICAgICAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbjtcclxufSIsImltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vR3JpZENlbGwnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCAqIGFzIHNob3J0aWQgZnJvbSAnc2hvcnRpZCc7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZSwgcmVuZGVyZXIgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IERlZmF1bHRHcmlkQ2VsbCBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdEdyaWRDZWxsUGFyYW1zXHJcbntcclxuICAgIGNvbFJlZjpudW1iZXI7XHJcbiAgICByb3dSZWY6bnVtYmVyO1xyXG4gICAgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVmPzpzdHJpbmc7XHJcbiAgICBjb2xTcGFuPzpudW1iZXI7XHJcbiAgICByb3dTcGFuPzpudW1iZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDZWxsLlxyXG4gKi9cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENlbGwgaW1wbGVtZW50cyBHcmlkQ2VsbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjZWxsIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJlZjpzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSB0aGF0IGRlc2NyaWJlcyB0aGUgaG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFJlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2xTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSByb3cgcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSB2ZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1JlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB2YWx1ZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHZhbHVlOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkQ2VsbC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHBhcmFtczpEZWZhdWx0R3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgcGFyYW1zLnJlZiA9IHBhcmFtcy5yZWYgfHwgc2hvcnRpZC5nZW5lcmF0ZSgpO1xyXG4gICAgICAgIHBhcmFtcy5jb2xTcGFuID0gcGFyYW1zLmNvbFNwYW4gfHwgMTtcclxuICAgICAgICBwYXJhbXMucm93U3BhbiA9IHBhcmFtcy5yb3dTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnZhbHVlID0gKHBhcmFtcy52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHBhcmFtcy52YWx1ZSA9PT0gbnVsbCkgPyAnJyA6IHBhcmFtcy52YWx1ZTtcclxuXHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgcGFyYW1zKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGdmeC5saW5lV2lkdGggPSAxO1xyXG4gICAgbGV0IGF2ID0gZ2Z4LmxpbmVXaWR0aCAlIDIgPT0gMCA/IDAgOiAwLjU7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gJ2xpZ2h0Z3JheSc7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5mb250ID0gYDEzcHggU2Fucy1TZXJpZmA7XHJcbiAgICBnZnguZmlsbFRleHQodmlzdWFsLnZhbHVlLCAzLCAwICsgKHZpc3VhbC5oZWlnaHQgLyAyKSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENvbHVtbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENvbHVtbiBpbXBsZW1lbnRzIEdyaWRDb2x1bW5cclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogY29sdW1uIHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBjb2x1bW4uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aWR0aDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZENvbHVtbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gd2lkdGhcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgd2lkdGg6bnVtYmVyID0gMTAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRDb2x1bW4gfSBmcm9tICcuLi9HcmlkQ29sdW1uJztcclxuaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL0dyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnXHJcbmltcG9ydCB7IERlZmF1bHRHcmlkQ2VsbCB9IGZyb20gJy4vRGVmYXVsdEdyaWRDZWxsJztcclxuXHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYSBieS10aGUtYm9vayBpbXBsZW1lbnRhdGlvbiBvZiBHcmlkTW9kZWwuICBBbGwgaW5zcGVjdGlvbiBtZXRob2RzIHVzZSBPKDEpIGltcGxlbWVudGF0aW9ucy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZE1vZGVsIGltcGxlbWVudHMgR3JpZE1vZGVsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBncmlkIG1vZGVsIHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgY29sdW1ucyBhbmQgcm93cyBwb3B1bGF0ZWQgd2l0aCBkZWZhdWx0IGNlbGxzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBjb2xzXHJcbiAgICAgKiBAcGFyYW0gcm93c1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpbShjb2xzOm51bWJlciwgcm93czpudW1iZXIpOkRlZmF1bHRHcmlkTW9kZWxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbHM7IGMrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgcm93czsgcisrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjZWxscy5wdXNoKG5ldyBEZWZhdWx0R3JpZENlbGwoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbFJlZjogYyxcclxuICAgICAgICAgICAgICAgICAgICByb3dSZWY6IHIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRHcmlkTW9kZWwoY2VsbHMsIFtdLCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IGdyaWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0RlZmF1bHRHcmlkTW9kZWx9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKFtdLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY2VsbCBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjZWxsczpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgY29sdW1uIGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbHVtbnM6R3JpZENvbHVtbltdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGdyaWQgcm93IGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZFJvd1tdO1xyXG5cclxuICAgIHByaXZhdGUgcmVmczpPYmplY3RNYXA8R3JpZENlbGw+O1xyXG4gICAgcHJpdmF0ZSBjb29yZHM6T2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkTW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGNlbGxzXHJcbiAgICAgKiBAcGFyYW0gY29sdW1uc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY2VsbHM6R3JpZENlbGxbXSwgY29sdW1uczpHcmlkQ29sdW1uW10sIHJvd3M6R3JpZFJvd1tdKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcyA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY29vcmRzID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuY29vcmRzW2MuY29sUmVmXSB8fCAodGhpcy5jb29yZHNbYy5jb2xSZWZdID0ge30pO1xyXG4gICAgICAgICAgICB4W2Mucm93UmVmXSA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCwgb3IgbnVsbCBpZiB0aGUgY2VsbCBkaWQgbm90IGV4aXN0XHJcbiAgICAgKiB3aXRoaW4gdGhlIG1vZGVsLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGwocmVmOnN0cmluZyk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZzW3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG5laWdoYm9yaW5nIGNlbGwgYXMgcGVyIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIHZlY3RvciAoZGlyZWN0aW9uKSBvYmplY3QsIG9yIG51bGwgaWYgbm8gbmVpZ2hib3IgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gdmVjdG9yXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBmaW5kQ2VsbE5laWdoYm9yKHJlZjpzdHJpbmcsIHZlY3RvcjpQb2ludCk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZmluZENlbGwocmVmKTtcclxuICAgICAgICBsZXQgY29sID0gY2VsbC5jb2xSZWYgKyB2ZWN0b3IueDtcclxuICAgICAgICBsZXQgcm93ID0gY2VsbC5yb3dSZWYgKyB2ZWN0b3IueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRlQ2VsbChjb2wsIHJvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgY29sdW1uIHJlZiBhbmQgcm93IHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY2VsbCBhdCB0aGUgbG9jYXRpb24sXHJcbiAgICAgKiBvciBudWxsIGlmIG5vIGNlbGwgY291bGQgYmUgZm91bmQuXHJcbiAgICAgKiBAcGFyYW0gY29sUmVmXHJcbiAgICAgKiBAcGFyYW0gcm93UmVmXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBsb2NhdGVDZWxsKGNvbDpudW1iZXIsIHJvdzpudW1iZXIpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmNvb3Jkc1tjb2xdIHx8IHt9KVtyb3ddIHx8IG51bGw7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vR3JpZFJvdyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZFJvdy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZFJvdyBpbXBsZW1lbnRzIEdyaWRSb3dcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogcm93IHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkUm93LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgaGVpZ2h0Om51bWJlciA9IDIxKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FzY2FkZSgpOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6UHJvcGVydHlEZXNjcmlwdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdIHx8ICghIXRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnRba2V5XSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRBbGlnbm1lbnQgPSAnbGVmdCd8J2NlbnRlcid8J3JpZ2h0JztcclxuXHJcbmV4cG9ydCBjbGFzcyBTdHlsZVxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OlN0eWxlO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBib3JkZXJDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZpbGxDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHRleHRBbGlnbm1lbnQ6VGV4dEFsaWdubWVudDtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdGV4dENvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdGV4dEZvbnQ6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0U2l6ZTpudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50PzpTdHlsZSwgdmFsdWVzPzphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcclxuICAgICAgICBpZiAodmFsdWVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXh0ZW5kKHRoaXMsIHZhbHVlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgQmFzZVN0eWxlID0gbmV3IFN0eWxlKG51bGwsIHtcclxuICAgIGJvcmRlckNvbG9yOiAnbGlnaHRncmF5JyxcclxuICAgIGZpbGxDb2xvcjogJ3doaXRlJyxcclxuICAgIHRleHRBbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgIHRleHRDb2xvcjogJ2JsYWNrJyxcclxuICAgIHRleHRGb250OiAnU2Vnb2UgVUknLFxyXG4gICAgdGV4dFNpemU6IDEzLFxyXG59KTsiLCJpbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwsIERlZmF1bHRHcmlkQ2VsbFBhcmFtcyB9IGZyb20gJy4uL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gJy4vU3R5bGUnO1xyXG5pbXBvcnQgeyByZW5kZXJlciwgdmlzdWFsaXplIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IFN0eWxlZEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBTdHlsZWRHcmlkQ2VsbFBhcmFtcyBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFBhcmFtc1xyXG57XHJcbiAgICBwbGFjZWhvbGRlcj86c3RyaW5nO1xyXG4gICAgc3R5bGU/OlN0eWxlO1xyXG59XHJcblxyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIFN0eWxlZEdyaWRDZWxsIGV4dGVuZHMgRGVmYXVsdEdyaWRDZWxsXHJcbntcclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHN0eWxlOlN0eWxlID0gQmFzZVN0eWxlO1xyXG5cclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHBsYWNlaG9sZGVyOnN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgU3R5bGVkR3JpZENlbGwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM6U3R5bGVkR3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIocGFyYW1zKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IHBhcmFtcy5wbGFjZWhvbGRlciB8fCAnJztcclxuICAgICAgICB0aGlzLnN0eWxlID0gcGFyYW1zLnN0eWxlIHx8IEJhc2VTdHlsZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGxldCBzdHlsZSA9IHZpc3VhbC5zdHlsZSBhcyBTdHlsZTtcclxuXHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS5maWxsQ29sb3I7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gc3R5bGUuYm9yZGVyQ29sb3I7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBsZXQgdGV4dFB0ID0gbmV3IFBvaW50KDMsIHZpc3VhbC5oZWlnaHQgLyAyKSBhcyBQb2ludExpa2U7XHJcbiAgICBpZiAoc3R5bGUudGV4dEFsaWdubWVudCA9PT0gJ2NlbnRlcicpXHJcbiAgICB7XHJcbiAgICAgICAgdGV4dFB0LnggPSB2aXN1YWwud2lkdGggLyAyO1xyXG4gICAgfVxyXG4gICAgaWYgKHN0eWxlLnRleHRBbGlnbm1lbnQgPT09ICdyaWdodCcpXHJcbiAgICB7XHJcbiAgICAgICAgdGV4dFB0LnggPSB2aXN1YWwud2lkdGggLSAzO1xyXG4gICAgfVxyXG5cclxuICAgIGdmeC5mb250ID0gYCR7c3R5bGUudGV4dFNpemV9cHggJHtzdHlsZS50ZXh0Rm9udH1gO1xyXG4gICAgZ2Z4LnRleHRBbGlnbiA9IHN0eWxlLnRleHRBbGlnbm1lbnQ7XHJcbiAgICBnZngudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUudGV4dENvbG9yO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHZpc3VhbC52YWx1ZSB8fCB2aXN1YWwucGxhY2Vob2xkZXIsIHRleHRQdC54LCB0ZXh0UHQueSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IGlzQm9vbGVhbiB9IGZyb20gJ3V0aWwnO1xyXG5cclxuLy9UaGlzIGtlZXBzIFdlYlN0b3JtIHF1aWV0LCBmb3Igc29tZSByZWFzb24gaXQgaXMgY29tcGxhaW5pbmcuLi5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDphbnk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERvIG5vdCB1c2UgZGlyZWN0bHkuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzRGVmPFQ+XHJcbntcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIGRlZmluaXRpb24gZm9yIGEgY2VsbCByZW5kZXJlciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJcclxue1xyXG4gICAgKGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIHZpc3VhbDphbnkpOnZvaWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9jb21tYW5kXzsgYW4gZXh0ZXJuYWxseSBjYWxsYWJsZSBsb2dpYyBibG9jayB0aGF0IHBlcmZvcm1zIHNvbWUgdGFzay4gIEEgbmFtZVxyXG4gKiBmb3IgdGhlIGNvbW1hbmQgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZCBhcyB0aGUgY29tbWFuZCB3aWxsIGJlXHJcbiAqIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCBjb21tYW5kIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZChuYW1lPzpzdHJpbmcpOk1ldGhvZERlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcsIGRlc2NyaXB0b3I6VHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8RnVuY3Rpb24+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6Y29tbWFuZHMnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBpbXBsOiBkZXNjcmlwdG9yLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IGRlZmluZXMgdGhlIHJlbmRlciBmdW5jdGlvbiBmb3IgYSBHcmlkQ2VsbCBpbXBsZW1lbnRhdGlvbiwgYWxsb3dpbmcgY3VzdG9tIGNlbGwgdHlwZXNcclxuICogdG8gY29udHJvbCB0aGVpciBkcmF3aW5nIGJlaGF2aW9yLlxyXG4gKlxyXG4gKiBAcGFyYW0gZnVuY1xyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyZXIoZnVuYzpSZW5kZXJlcik6Q2xhc3NEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgZnVuYywgY3Rvcik7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2QgYXMgYSBfcm91dGluZV87IGEgbG9naWMgYmxvY2sgdGhhdCBjYW4gYmUgaG9va2VkIGludG8gb3Igb3ZlcnJpZGRlbiBieSBvdGhlclxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgcm91dGluZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSByb3V0aW5lIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHJvdXRpbmUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3V0aW5lKG5hbWU/OnN0cmluZyk6TWV0aG9kRGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCByb3V0aW5lID0gZGVzY3JpcHRvci52YWx1ZTtcclxuICAgICAgICBsZXQgd3JhcHBlciA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQga2VybmVsID0gKHRoaXNbJ19fa2VybmVsJ10gfHwgdGhpc1sna2VybmVsJ10pIGFzIEdyaWRLZXJuZWw7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXJuZWwucm91dGluZXMuc2lnbmFsKGtleSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSwgcm91dGluZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlciB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBhIF92YXJpYWJsZV87IGEgcmVhZGFibGUgYW5kIG9wdGlvbmFsbHkgd3JpdGFibGUgdmFsdWUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnlcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHZhcmlhYmxlIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgdmFyaWFibGUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgdmFyaWFibGUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShtdXRhYmxlOmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yO1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZT86c3RyaW5nLCBtdXRhYmxlPzpib29sZWFuKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG5hbWU6c3RyaW5nfGJvb2xlYW4sIG11dGFibGU/OmJvb2xlYW4pOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIGlmICh0eXBlb2YobmFtZSkgPT09ICdib29sZWFuJylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFyaWFibGUodW5kZWZpbmVkLCBuYW1lIGFzIGJvb2xlYW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZhcmlhYmxlcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIG11dGFibGU6IG11dGFibGUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vbGV0IHZhbFN0b3JlS2V5ID0gISFuYW1lID8ga2V5IDogYF9fJHtrZXl9YDtcclxuICAgICAgICAvL2xldCB1c2VBbHRWYWx1ZVN0b3JlID0gIW5hbWU7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL09iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBuYW1lIHx8IGtleSwge1xyXG4gICAgICAgIC8vICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAvLyAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2YWxTdG9yZUtleV07IH0sXHJcbiAgICAgICAgLy8gICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpIHsgdGhpc1t2YWxTdG9yZUtleV0gPSBuZXdWYWw7IH1cclxuICAgICAgICAvL30pO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIGZvciB1c2Ugd2l0aGluIGltcGxlbWVudGF0aW9ucyBvZiBHcmlkQ2VsbCB0aGF0IG1hcmtzIGEgZmllbGQgYXMgb25lIHRoYXQgYWZmZWN0cyB0aGUgdmlzdWFsXHJcbiAqIGFwcGVhcmFuY2Ugb2YgdGhlIGNlbGwuICBUaGlzIHdpbGwgY2F1c2UgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCB0byBiZSBtYXBwZWQgdG8gdGhlIF9WaXN1YWxfIG9iamVjdFxyXG4gKiBjcmVhdGVkIGJlZm9yZSB0aGUgY2VsbCBpcyBkcmF3bi5cclxuICpcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmlzdWFsaXplKCk6UHJvcGVydHlEZWNvcmF0b3Jcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6T2JqZWN0LCBrZXk6c3RyaW5nKTpQcm9wZXJ0eURlc2NyaXB0b3JcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDp2aXN1YWxpemUnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKGtleSk7XHJcblxyXG4gICAgICAgIGxldCBwayA9IGBfXyR7a2V5fWA7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKTphbnlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICB0aGlzWydfX2RpcnR5J10gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSIsImltcG9ydCB7IERlZmF1bHRHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXJCYXNlIH0gZnJvbSAnLi9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRMYXlvdXQgfSBmcm9tICcuL2ludGVybmFsL0dyaWRMYXlvdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IHByb3BlcnR5IH0gZnJvbSAnLi4vbWlzYy9Qcm9wZXJ0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgdmFyaWFibGUgfSBmcm9tICcuL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VFdmVudCBleHRlbmRzIE1vdXNlRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VEcmFnRXZlbnQgZXh0ZW5kcyBNb3VzZURyYWdFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRLZXlib2FyZEV2ZW50IGV4dGVuZHMgS2V5Ym9hcmRFdmVudFxyXG57XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZEVsZW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKHRhcmdldDpIVE1MRWxlbWVudCwgaW5pdGlhbE1vZGVsPzpHcmlkTW9kZWwpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNhbnZhcyA9IHRhcmdldC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGNhbnZhcy5pZCA9IHRhcmdldC5pZDtcclxuICAgICAgICBjYW52YXMuY2xhc3NOYW1lID0gdGFyZ2V0LmNsYXNzTmFtZSA9ICcgZ3JpZCc7XHJcbiAgICAgICAgY2FudmFzLnRhYkluZGV4ID0gMDtcclxuICAgICAgICBjYW52YXMud2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHRhcmdldC5jbGllbnRIZWlnaHQ7XHJcblxyXG4gICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShjYW52YXMsIHRhcmdldCk7XHJcbiAgICAgICAgdGFyZ2V0LnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBsZXQgZ3JpZCA9IG5ldyBHcmlkRWxlbWVudChjYW52YXMpO1xyXG4gICAgICAgIGdyaWQubW9kZWwgPSBpbml0aWFsTW9kZWwgfHwgRGVmYXVsdEdyaWRNb2RlbC5kaW0oMjYsIDEwMCk7XHJcblxyXG4gICAgICAgIHJldHVybiBncmlkO1xyXG4gICAgfVxyXG5cclxuICAgIEBwcm9wZXJ0eShEZWZhdWx0R3JpZE1vZGVsLmVtcHR5KCksIHQgPT4gdC5pbnZhbGlkYXRlKCkpXHJcbiAgICBwdWJsaWMgbW9kZWw6R3JpZE1vZGVsO1xyXG5cclxuICAgIEBwcm9wZXJ0eSgwLCB0ID0+IHsgdC5yZWRyYXcoKTsgdC5lbWl0KCdzY3JvbGwnKTsgfSlcclxuICAgIHB1YmxpYyBzY3JvbGxMZWZ0Om51bWJlcjtcclxuXHJcbiAgICBAcHJvcGVydHkoMCwgdCA9PiB7IHQucmVkcmF3KCk7IHQuZW1pdCgnc2Nyb2xsJyk7IH0pXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG9wOm51bWJlcjtcclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9vdDpIVE1MRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2VybmVsOkdyaWRLZXJuZWw7XHJcblxyXG4gICAgcHJpdmF0ZSBsYXlvdXQ6R3JpZExheW91dDtcclxuICAgIHByaXZhdGUgZGlydHk6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBidWZmZXJzOk9iamVjdE1hcDxCdWZmZXI+ID0ge307XHJcbiAgICBwcml2YXRlIHZpc3VhbHM6T2JqZWN0TWFwPFZpc3VhbD4gPSB7fTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgY2FudmFzOkhUTUxDYW52YXNFbGVtZW50KVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMucm9vdCA9IGNhbnZhcztcclxuICAgICAgICBsZXQga2VybmVsID0gdGhpcy5rZXJuZWwgPSBuZXcgR3JpZEtlcm5lbCh0aGlzLmVtaXQuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIFsnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZXVwJywgJ2NsaWNrJywgJ2RibGNsaWNrJywgJ2RyYWdiZWdpbicsICdkcmFnJywgJ2RyYWdlbmQnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZE1vdXNlRXZlbnQoeCkpO1xyXG4gICAgICAgIFsna2V5ZG93bicsICdrZXlwcmVzcycsICdrZXl1cCddXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKHggPT4gdGhpcy5mb3J3YXJkS2V5RXZlbnQoeCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgd2lkdGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb290LmNsaWVudFdpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRIZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBtb2RlbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LmNvbHVtbnMubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxIZWlnaHQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQucm93cy5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB2aXJ0dWFsV2lkdGgoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQud2lkdGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB2aXJ0dWFsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNjcm9sbCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnNjcm9sbExlZnQsIHRoaXMuc2Nyb2xsVG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9uKTpHcmlkRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMua2VybmVsLmluc3RhbGwoZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKGV4dC5pbml0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXh0LmluaXQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3QgPSA8YW55PnB0T3JSZWN0O1xyXG5cclxuICAgICAgICBpZiAoZGVzdC53aWR0aCA9PT0gdW5kZWZpbmVkICYmIGRlc3QuaGVpZ2h0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QoZGVzdC54LCBkZXN0LnksIDEsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRlc3QubGVmdCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbExlZnQgKz0gZGVzdC5sZWZ0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC5yaWdodCA+IHRoaXMud2lkdGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbExlZnQgKz0gZGVzdC5yaWdodCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnRvcCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCArPSBkZXN0LnRvcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlc3QuYm90dG9tID4gdGhpcy5oZWlnaHQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCArPSBkZXN0LmJvdHRvbSAtIHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZSgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcclxuICAgICAgICB0aGlzLmxheW91dCA9IEdyaWRMYXlvdXQuY29tcHV0ZSh0aGlzLm1vZGVsKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbWl0KCdpbnZhbGlkYXRlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZHJhdygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudXBkYXRlVmlzdWFscygpO1xyXG4gICAgICAgIHRoaXMuZHJhd1Zpc3VhbHMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZHJhdycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdwb3J0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChNYXRoLmZsb29yKHRoaXMuc2Nyb2xsTGVmdCksIE1hdGguZmxvb3IodGhpcy5zY3JvbGxUb3ApLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVZpc3VhbHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB7IG1vZGVsLCBsYXlvdXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IHZpc2libGVDZWxscyA9IGxheW91dC5jYXB0dXJlQ2VsbHModmlld3BvcnQpXHJcbiAgICAgICAgICAgIC5tYXAocmVmID0+IG1vZGVsLmZpbmRDZWxsKHJlZikpO1xyXG5cclxuICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy52aXN1YWxzO1xyXG4gICAgICAgIGxldCBuZXh0RnJhbWUgPSA8T2JqZWN0TWFwPFZpc3VhbD4+e307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgdmlzaWJsZUNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJlZ2lvbiA9IGxheW91dC5xdWVyeUNlbGwoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gcHJldkZyYW1lW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBoYXZlIGEgcHJldmlvdXMgdmlzdWFsIG9yIGlmIHRoZSBjZWxsIHdhcyBkaXJ0eSwgY3JlYXRlIG5ldyB2aXN1YWxcclxuICAgICAgICAgICAgaWYgKCF2aXN1YWwgfHwgY2VsbC52YWx1ZSAhPT0gdmlzdWFsLnZhbHVlIHx8IGNlbGxbJ19fZGlydHknXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZVZpc3VhbChjZWxsLCByZWdpb24pO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICAgICAgY2VsbFsnX19kaXJ0eSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGp1c3QgdXNlIHRoZSBwcmV2aW91c1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5leHRGcmFtZVtjZWxsLnJlZl0gPSB2aXN1YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmlzdWFscyA9IG5leHRGcmFtZTtcclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3VmlzdWFscygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LmRyYXdWaXN1YWxzJyk7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgbGV0IGdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogdHJ1ZSB9KSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgZ2Z4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZ2Z4LnNhdmUoKTtcclxuICAgICAgICBnZngudHJhbnNsYXRlKHZpZXdwb3J0LmxlZnQgKiAtMSwgdmlld3BvcnQudG9wICogLTEpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjciBpbiB0aGlzLnZpc3VhbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMubW9kZWwuZmluZENlbGwoY3IpO1xyXG4gICAgICAgICAgICBsZXQgdmlzdWFsID0gdGhpcy52aXN1YWxzW2NyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdmlld3BvcnQuaW50ZXJzZWN0cyh2aXN1YWwpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWJ1ZmZlcilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5idWZmZXJzW2NlbGwucmVmXSA9IHRoaXMuY3JlYXRlQnVmZmVyKHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBUeXBlU2NyaXB0VW5yZXNvbHZlZEZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBjZWxsLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZW5kZXJlcihidWZmZXIuZ2Z4LCB2aXN1YWwsIGNlbGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2Z4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5kcmF3VmlzdWFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlQnVmZmVyKHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcik6QnVmZmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIod2lkdGgsIGhlaWdodCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVWaXN1YWwoY2VsbDphbnksIHJlZ2lvbjpSZWN0TGlrZSk6VmlzdWFsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc3VhbCA9IG5ldyBWaXN1YWwoY2VsbC5yZWYsIGNlbGwudmFsdWUsIHJlZ2lvbi5sZWZ0LCByZWdpb24udG9wLCByZWdpb24ud2lkdGgsIHJlZ2lvbi5oZWlnaHQpO1xyXG5cclxuICAgICAgICBsZXQgcHJvcHMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2aXN1YWxpemUnLCBjZWxsLmNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgW10pIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcHJvcHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsW3BdID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc3VhbFtwXSA9IF8uc2hhZG93Q2xvbmUoY2VsbFtwXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBJbGxlZ2FsIHZpc3VhbGl6ZWQgcHJvcGVydHkgbmFtZSAke3B9IG9uIHR5cGUgJHtjZWxsLmNvbnN0cnVjdG9yLm5hbWV9LmApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdmlzdWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZE1vdXNlRXZlbnQoZXZlbnQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKG5lOk1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHQgPSBuZXcgUG9pbnQobmUub2Zmc2V0WCwgbmUub2Zmc2V0WSk7XHJcbiAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGV0IGdlID0gPGFueT5uZTtcclxuICAgICAgICAgICAgZ2UuY2VsbCA9IGNlbGwgfHwgbnVsbDtcclxuICAgICAgICAgICAgZ2UuZ3JpZFggPSBwdC54O1xyXG4gICAgICAgICAgICBnZS5ncmlkWSA9IHB0Lnk7ICAgICAgXHJcblxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIGdlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcndhcmRLZXlFdmVudChldmVudDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCAobmU6S2V5Ym9hcmRFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudCwgPEdyaWRLZXlib2FyZEV2ZW50Pm5lKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQnVmZmVyXHJcbntcclxuICAgIHB1YmxpYyBjYW52YXM6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgd2lkdGg6bnVtYmVyLCBwdWJsaWMgaGVpZ2h0Om51bWJlciwgcHVibGljIGluZmxhdGlvbjpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICsgKGluZmxhdGlvbiAqIDIpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJywgeyBhbHBoYTogZmFsc2UgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIHRoaXMuZ2Z4LnRyYW5zbGF0ZShpbmZsYXRpb24sIGluZmxhdGlvbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFZpc3VhbFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVmOnN0cmluZyxcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZTpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgbGVmdDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdG9wOm51bWJlcixcclxuICAgICAgICAgICAgICAgIHB1YmxpYyB3aWR0aDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKGFub3RoZXI6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXNbcHJvcF0gIT09IGFub3RoZXJbcHJvcF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCdcclxuXHJcbi8vVGhpcyBrZWVwcyBXZWJTdG9ybSBxdWlldCwgZm9yIHNvbWUgcmVhc29uIGl0IGlzIGNvbXBsYWluaW5nLi4uXHJcbmRlY2xhcmUgdmFyIFJlZmxlY3Q6YW55O1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZENvbW1hbmRIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgZXhlYyhjb21tYW5kOnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkVmFyaWFibGVcclxue1xyXG4gICAgZ2V0KCk6YW55O1xyXG4gICAgc2V0Pyh2YWx1ZTphbnkpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIGRlZmluZSh2YXJpYWJsZTpzdHJpbmcsIGltcGw6R3JpZFZhcmlhYmxlKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lSG9va1xyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZU92ZXJyaWRlXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTphbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOmFueSk6dm9pZDtcclxuXHJcbiAgICBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6YW55KTphbnk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBzaWduYWwocm91dGluZTpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOmJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRzIHRoZSBjb3JlIG9mIHRoZSBHcmlkIGV4dGVuc2liaWxpdHkgc3lzdGVtLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdyaWRLZXJuZWxcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbW1hbmRzOkdyaWRDb21tYW5kSHViID0gbmV3IEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvdXRpbmVzOkdyaWRSb3V0aW5lSHViID0gbmV3IEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCgpO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHZhcmlhYmxlczpHcmlkVmFyaWFibGVIdWIgPSBuZXcgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCgpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcjooZXZlbnQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBleHBvcnRJbnRlcmZhY2UodGFyZ2V0PzphbnkpOmFueVxyXG4gICAge1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldCB8fCB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kcyA9IHRoaXMuY29tbWFuZHNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRDb21tYW5kPjtcclxuICAgICAgICBsZXQgdmFyaWFibGVzID0gdGhpcy52YXJpYWJsZXNbJ3N0b3JlJ10gYXMgT2JqZWN0TWFwPEdyaWRWYXJpYWJsZT47XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gY29tbWFuZHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0YXJnZXRbbl0gPSBjb21tYW5kc1tuXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gaW4gdmFyaWFibGVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbiwgdmFyaWFibGVzW25dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluc3RhbGwoZXh0OmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNvbW1hbmRzLCB2YXJpYWJsZXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChleHRbJ19fa2VybmVsJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnRXh0ZW5zaW9uIGFwcGVhcnMgdG8gaGF2ZSBhbHJlYWR5IGJlZW4gaW5zdGFsbGVkIGludG8gdGhpcyBvciBhbm90aGVyIGdyaWQuLi4/JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dFsnX19rZXJuZWwnXSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBjbWRzID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDpjb21tYW5kcycsIGV4dCkgfHwgW107XHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjbWRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29tbWFuZHMuZGVmaW5lKGMubmFtZSwgYy5pbXBsLmJpbmQoZXh0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmFycyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmFyaWFibGVzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCB2IG9mIHZhcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXJpYWJsZXMuZGVmaW5lKHYubmFtZSwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3Yua2V5XTsgfSkuYmluZChleHQpLFxyXG4gICAgICAgICAgICAgICAgc2V0OiAhIXYubXV0YWJsZSA/IChmdW5jdGlvbih2YWwpIHsgdGhpc1t2LmtleV0gPSB2YWw7IH0pLmJpbmQoZXh0KSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwgaW1wbGVtZW50cyBHcmlkQ29tbWFuZEh1YlxyXG57XHJcbiAgICBwcml2YXRlIHN0b3JlOk9iamVjdE1hcDxHcmlkQ29tbWFuZD4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCBjb21tYW5kIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZWZpbmUoY29tbWFuZDpzdHJpbmcsIGltcGw6R3JpZENvbW1hbmQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVtjb21tYW5kXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdDb21tYW5kIHdpdGggbmFtZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVtjb21tYW5kXSA9IGltcGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyB0aGUgc3BlY2lmaWVkIGdyaWQgY29tbWFuZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbY29tbWFuZF07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbXBsLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIGNvbW1hbmQ6ICcgKyBjb21tYW5kO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFJvdXRpbmVIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBob29rczpPYmplY3RNYXA8R3JpZFJvdXRpbmVIb29rW10+ID0ge307XHJcbiAgICBwcml2YXRlIG92ZXJyaWRlczpPYmplY3RNYXA8R3JpZFJvdXRpbmVPdmVycmlkZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBob29rIHRvIHRoZSBzcGVjaWZpZWQgc2lnbmFsIHRoYXQgZW5hYmxlcyBleHRlbnNpb25zIHRvIG92ZXJyaWRlIGdyaWQgYmVoYXZpb3JcclxuICAgICAqIGRlZmluZWQgaW4gdGhlIGNvcmUgb3Igb3RoZXIgZXh0ZW5zaW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhvb2socm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOkdyaWRSb3V0aW5lSG9vayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXSB8fCAodGhpcy5ob29rc1tyb3V0aW5lXSA9IFtdKTtcclxuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvdmVycmlkZShyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6R3JpZFJvdXRpbmVPdmVycmlkZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaWduYWxzIHRoYXQgYSByb3V0aW5lIGlzIGFib3V0IHRvIHJ1biB0aGF0IGNhbiBiZSBob29rZWQgb3Igb3ZlcnJpZGRlbiBieSBleHRlbnNpb25zLiAgQXJndW1lbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgc3VwcG9ydGluZyBkYXRhIG9yIHJlbGV2YW50IG9iamVjdHMgdG8gdGhlIHJvdXRpbmUuICBUaGUgdmFsdWUgcmV0dXJuZWQgd2lsbCBiZSBgdHJ1ZWBcclxuICAgICAqIGlmIHRoZSByb3V0aW5lIGhhcyBiZWVuIG92ZXJyaWRkZW4gYnkgYW4gZXh0ZW5zaW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2lnbmFsKHJvdXRpbmU6c3RyaW5nLCBhcmdzOmFueVtdLCBpbXBsOkZ1bmN0aW9uKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKGBiZWZvcmU6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICBpZiAoISF0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChpbXBsKTtcclxuICAgICAgICAgICAgaW1wbCA9IHRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcblxyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3Mocm91dGluZSwgYXJncyk7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhgYWZ0ZXI6JHtyb3V0aW5lfWAsIGFyZ3MpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW52b2tlSG9va3Mocm91dGluZTpzdHJpbmcsIGFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuaG9va3Nbcm91dGluZV07XHJcblxyXG4gICAgICAgIGlmIChsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaG9vayBvZiBsaXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob29rLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsIGltcGxlbWVudHMgR3JpZFZhcmlhYmxlSHViXHJcbntcclxuICAgIHByaXZhdGUgc3RvcmU6T2JqZWN0TWFwPEdyaWRWYXJpYWJsZT4gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCB2YXJpYWJsZSBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVmaW5lKHZhcmlhYmxlOnN0cmluZywgaW1wbDpHcmlkVmFyaWFibGUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9yZVt2YXJpYWJsZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVmFyaWFibGUgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZVt2YXJpYWJsZV0gPSBpbXBsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCh2YXJpYWJsZTpzdHJpbmcpOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVt2YXJpYWJsZV07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1wbC5nZXQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXQodmFyaWFibGU6c3RyaW5nLCB2YWx1ZTphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGltcGwuc2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpbXBsLnNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnQ2Fubm90IHNldCByZWFkb25seSB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi9taXNjL0RvbSc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIGJhc2UgaW50ZXJmYWNlIG9mIGEgd2lkZ2V0LiAgQSB3aWRnZXQgaXMgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIFVJIGVsZW1lbnQgd2l0aGluIHRoZSBjb250ZXh0IG9mXHJcbiAqIGEgZ3JpZC4gIEl0IGNhbiBiZSBjb21wb3NlZCBvZiBvbmUgb3IgbW9yZSBET00gZWxlbWVudHMgYW5kIGJlIGludGVyYWN0YWJsZSBvciBzdGF0aWMuICBUaGUgV2lkZ2V0IGludGVyZmFjZXNcclxuICogcHJvdmlkZXMgYSBjb21tb24gaW50ZXJmYWNlIHRocm91Z2ggd2hpY2ggbW9kdWxlcyBvciBjb25zdW1lcnMgY2FuIGFjY2VzcyB0aGUgdW5kZXJseWluZyBET00gZWxlbWVudHMgb2YgYSB3aWRnZXRcclxuICogYW5kIGJhc2ljIG1ldGhvZHMgdGhhdCBlYXNlIHRoZSBtYW5pcHVsYXRpb24gb2Ygd2lkZ2V0cy5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgV2lkZ2V0XHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvb3QgSFRNTEVsZW1lbnQgb2YgdGhlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgcm9vdDpIVE1MRWxlbWVudDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgdmlld1JlY3Q6UmVjdDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGVzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIGhpZGUoKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgc2hvdygpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgdG9nZ2xlKHZpc2libGU6Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIFdpZGdldCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBhcmUgZXhwZWN0ZWQgdG8gcmVwcmVzZW50IFdpZGdldHMgd2l0aFxyXG4gKiBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgcm9vdCBlbGVtZW50cy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBYnNXaWRnZXRCYXNlPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4gaW1wbGVtZW50cyBXaWRnZXRcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJvb3Q6VClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBSZWN0IG9iamVjdCB0aGF0IGRlc2NyaWJlcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgV2lkZ2V0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCB2aWV3UmVjdCgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3RcclxuICAgICAgICAoXHJcbiAgICAgICAgICAgIHBhcnNlSW50KHRoaXMucm9vdC5zdHlsZS5sZWZ0KSxcclxuICAgICAgICAgICAgcGFyc2VJbnQodGhpcy5yb290LnN0eWxlLnRvcCksXHJcbiAgICAgICAgICAgIHRoaXMucm9vdC5jbGllbnRXaWR0aCxcclxuICAgICAgICAgICAgdGhpcy5yb290LmNsaWVudEhlaWdodFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlcyB0aGUgV2lkZ2V0IHRvIHRoZSBzcGVjaWZpZWQgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aWV3UmVjdFxyXG4gICAgICogQHBhcmFtIGFuaW1hdGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdvdG8odmlld1JlY3Q6UmVjdExpa2UsIGF1dG9TaG93OmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGF1dG9TaG93KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgRG9tLnNob3codGhpcy5yb290KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5yb290LCB7XHJcbiAgICAgICAgICAgIGxlZnQ6IGAke3ZpZXdSZWN0LmxlZnQgLSAxfXB4YCxcclxuICAgICAgICAgICAgdG9wOiBgJHt2aWV3UmVjdC50b3AgLSAxfXB4YCxcclxuICAgICAgICAgICAgd2lkdGg6IGAke3ZpZXdSZWN0LndpZHRoICsgMX1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0ICsgMX1weGAsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiBgaGlkZGVuYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGVzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBoaWRlKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5oaWRlKHRoaXMucm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2hvdygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20uc2hvdyh0aGlzLnJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aXNpYmxlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0b2dnbGUodmlzaWJsZTpib29sZWFuKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLnRvZ2dsZSh0aGlzLnJvb3QsIHZpc2libGUpXHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRTdWJzY3JpcHRpb25cclxue1xyXG4gICAgY2FuY2VsKCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudENhbGxiYWNrXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50RW1pdHRlclxyXG57XHJcbiAgICBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uO1xyXG5cclxuICAgIG9mZihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOnZvaWQ7XHJcblxyXG4gICAgZW1pdChldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbkV2ZW50VGFyZ2V0XHJcbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHByaXZhdGUgYnVja2V0czphbnkgPSB7fTtcclxuXHJcbiAgICBwdWJsaWMgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KS5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4geyBjYW5jZWw6ICgpID0+IHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjaykgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGxldCBpZHggPSBsaXN0LmluZGV4T2YoY2FsbGJhY2spO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDYWxsYmFja0xpc3QoZXZlbnQ6c3RyaW5nKTpFdmVudENhbGxiYWNrW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5idWNrZXRzW2V2ZW50XSB8fCAodGhpcy5idWNrZXRzW2V2ZW50XSA9IFtdKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IERlZmF1bHRHcmlkQ29sdW1uIH0gZnJvbSAnLi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtbic7XHJcbmltcG9ydCB7IERlZmF1bHRHcmlkUm93IH0gZnJvbSAnLi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZFJvdyc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUm93JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxudHlwZSBDZWxsQ29sUm93TG9va3VwID0gT2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZExheW91dFJlZ2lvbjxUPiBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIHJlYWRvbmx5IHJlZjpUO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZExheW91dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbXB1dGUobW9kZWw6R3JpZE1vZGVsKTpHcmlkTGF5b3V0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvbExvb2t1cCA9IDxPYmplY3RJbmRleDxHcmlkQ29sdW1uPj5tb2RlbC5jb2x1bW5zLnJlZHVjZSgodCwgeCkgPT4geyB0W3gucmVmXSA9IHg7IHJldHVybiB0IH0sIHt9KTtcclxuICAgICAgICBsZXQgcm93TG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRSb3c+Pm1vZGVsLnJvd3MucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCBjZWxsTG9va3VwID0gYnVpbGRDZWxsTG9va3VwKG1vZGVsLmNlbGxzKTsgLy9ieSBjb2wgdGhlbiByb3dcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSBhbGwgZXhwZWN0ZWQgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGxldCBtYXhDb2wgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LmNvbFJlZiArICh4LmNvbFNwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuICAgICAgICBsZXQgbWF4Um93ID0gbW9kZWwuY2VsbHMubWFwKHggPT4geC5yb3dSZWYgKyAoeC5yb3dTcGFuIC0gMSkpLnJlZHVjZSgodCwgeCkgPT4gdCA+IHggPyB0IDogeCwgMCk7XHJcblxyXG4gICAgICAgIC8vIEdlbmVyYXRlIG1pc3NpbmcgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heENvbDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKGNvbExvb2t1cFtpXSB8fCAoY29sTG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkQ29sdW1uKGkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heFJvdzsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKHJvd0xvb2t1cFtpXSB8fCAocm93TG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkUm93KGkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHdpZHRoIGFuZCBoZWlnaHQgb2Ygd2hvbGUgZ3JpZFxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8udmFsdWVzKGNvbExvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC53aWR0aCwgMCk7XHJcbiAgICAgICAgbGV0IGhlaWdodCA9IF8udmFsdWVzKHJvd0xvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC5oZWlnaHQsIDApO1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBsYXlvdXQgcmVnaW9ucyBmb3IgdGhlIHZhcmlvdXMgYml0c1xyXG4gICAgICAgIGxldCBjb2xSZWdzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdID0gW107XHJcbiAgICAgICAgbGV0IHJvd1JlZ3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10gPSBbXTtcclxuICAgICAgICBsZXQgY2VsbFJlZ3M6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGFjY0xlZnQgPSAwO1xyXG4gICAgICAgIGZvciAobGV0IGNpID0gMDsgY2kgPD0gbWF4Q29sOyBjaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNvbCA9IGNvbExvb2t1cFtjaV07XHJcblxyXG4gICAgICAgICAgICBjb2xSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBjb2wucmVmLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgIHRvcDogMCxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgYWNjVG9wID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgcmkgPSAwOyByaSA8PSBtYXhSb3c7IHJpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCByb3cgPSByb3dMb29rdXBbcmldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6IHJvdy5yZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogYWNjVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm93LmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbExvb2t1cFtjaV0gIT09IHVuZGVmaW5lZCAmJiBjZWxsTG9va3VwW2NpXVtyaV0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IGNlbGxMb29rdXBbY2ldW3JpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogY2VsbC5yZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGFjY0xlZnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogYWNjVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogY29sLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHJvdy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYWNjVG9wICs9IHJvdy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFjY0xlZnQgKz0gY29sLndpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkTGF5b3V0KHdpZHRoLCBoZWlnaHQsIGNvbFJlZ3MsIHJvd1JlZ3MsIGNlbGxSZWdzLCBjZWxsTG9va3VwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGhlaWdodDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXTtcclxuICAgIHB1YmxpYyByZWFkb25seSByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdO1xyXG5cclxuICAgIHByaXZhdGUgY2VsbExvb2t1cDpDZWxsQ29sUm93TG9va3VwO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5JbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSByb3dJbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSBjZWxsSW5kZXg6T2JqZWN0TWFwPEdyaWRMYXlvdXRSZWdpb248c3RyaW5nPj47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcclxuICAgICAgICB3aWR0aDpudW1iZXIsIFxyXG4gICAgICAgIGhlaWdodDpudW1iZXIsIFxyXG4gICAgICAgIGNvbHVtbnM6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10sXHJcbiAgICAgICAgcm93czpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICBjZWxsczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXSxcclxuICAgICAgICBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gcm93cztcclxuICAgICAgICB0aGlzLmNlbGxzID0gY2VsbHM7XHJcblxyXG4gICAgICAgIHRoaXMuY2VsbExvb2t1cCA9IGNlbGxMb29rdXA7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5JbmRleCA9IF8uaW5kZXgoY29sdW1ucywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5yb3dJbmRleCA9IF8uaW5kZXgocm93cywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5jZWxsSW5kZXggPSBfLmluZGV4KGNlbGxzLCB4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlDb2x1bW4ocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5JbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Um93KHJlZjpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93SW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNlbGwocmVmOnN0cmluZyk6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jZWxsSW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ29sdW1ucyhyZWdpb246UmVjdExpa2UpOm51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uc1xyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gUmVjdC5wcm90b3R5cGUuaW50ZXJzZWN0cy5jYWxsKHgsIHJlZ2lvbikpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVSb3dzKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZUNlbGxzKHJlZ2lvbjpSZWN0TGlrZSk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICBsZXQgY29scyA9IHRoaXMuY2FwdHVyZUNvbHVtbnMocmVnaW9uKTtcclxuICAgICAgICBsZXQgcm93cyA9IHRoaXMuY2FwdHVyZVJvd3MocmVnaW9uKTtcclxuICAgICAgICBsZXQgY2VsbHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNvbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCByIG9mIHJvd3MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gdGhpcy5jZWxsTG9va3VwW2NdW3JdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhY2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNlbGxzO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZENlbGxMb29rdXAoY2VsbHM6R3JpZENlbGxbXSk6Q2VsbENvbFJvd0xvb2t1cFxyXG57XHJcbiAgICBsZXQgaXggPSB7fTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgIHtcclxuICAgICAgICBsZXQgY2l4ID0gaXhbYy5jb2xSZWZdIHx8IChpeFtjLmNvbFJlZl0gPSB7fSk7XHJcbiAgICAgICAgY2l4W2Mucm93UmVmXSA9IGM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBpeDtcclxufSIsIi8qKlxyXG4gKiBFbWJlZGRpbmcgb2YgQ2xpcGJvYXJkLmpzIC0gaHR0cHM6Ly9naXRodWIuY29tL3plbm9yb2NoYS9jbGlwYm9hcmQuanMvXHJcbiAqXHJcbiAqIEFmdGVyIHZhcmlvdXMgYXR0ZW1wdHMsIEkgd2FzIHVuYWJsZSB0byBucG0gaW5zdGFsbCBpbmNsdWRpbmcgdHlwZXMgZWZmZWN0aXZlbHkgYW5kIGJlY2F1c2UgYW4gaW5kZXguanMgaXMgbm90XHJcbiAqIHVzZWQgSSBjYW5ub3QgdXNlIHRoZSBUeXBlU2NyaXB0IDIuMSB1bmtub3duIG1vZHVsZSBpbXBvcnQsIHNvIHJlc29ydGluZyB0byBsb2NhbCBlbWJlZGRlZCB2ZXJzaW9uLiAgV2lsbCByZW1vdmVcclxuICogaW4gdGhlIGZ1dHVyZSBpZiBwb3NzaWJsZS5cclxuICpcclxuICogTW9kaWZpY2F0aW9ucyBoYXZlIGJlZW4gbWFkZSB0byBtYWtlIHRoZSBjb2RlIGNvbXBpbGU6XHJcbiAqIC0gUmVtb3ZlZCBQcm9taXNlIHBvbHlmaWxsIChpbXBvcnRlZCBpbnN0ZWFkKVxyXG4gKiAtIFJlc3RydWN0dXJlZCBleHBvcnQgYW5kIGFkZGVkIHR5cGVkIGludGVyZmFjZVxyXG4gKiAtIFNvbWUgY2hhbmdlcyB0byBwcmV2ZW50IHR5cGUgY2hlY2tpbmcgd2hlcmUgdW5kZXNpcmVkXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gJ2VzNi1wcm9taXNlJztcclxuXHJcbi8vRGVjbGFyZSB3aW5kb3cgYXMgYW4gYW55IHZhciBhbGlhcyB0byBwcmV2ZW50IFRTIG1vYW5pbmcuLi5cclxubGV0IHduZCA9IHdpbmRvdyBhcyBhbnk7XHJcblxyXG5jb25zdCBjbGlwYm9hcmQgPSB7fSBhcyBhbnk7XHJcblxyXG5jbGlwYm9hcmQuY29weSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX2RhdGEgPSBudWxsOyAvLyBNYXAgZnJvbSBkYXRhIHR5cGUgKGUuZy4gXCJ0ZXh0L2h0bWxcIikgdG8gdmFsdWUuXHJcbiAgICB2YXIgX2JvZ3VzU2VsZWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcclxuICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgX2RhdGEgPSBudWxsO1xyXG4gICAgICAgIGlmIChfYm9ndXNTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY29weVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YShrZXksIF9kYXRhW2tleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXb3JrYXJvdW5kIGZvciBTYWZhcmk6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTY1MjlcclxuICAgIGZ1bmN0aW9uIGJvZ3VzU2VsZWN0KCkge1xyXG4gICAgICAgIHZhciBzZWwgPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAvLyBJZiBcIm5vdGhpbmdcIiBpcyBzZWxlY3RlZC4uLlxyXG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgJiYgc2VsLmlzQ29sbGFwc2VkKSB7XHJcbiAgICAgICAgICAgIC8vIC4uLiB0ZW1wb3JhcmlseSBzZWxlY3QgdGhlIGVudGlyZSBib2R5LlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBXZSBzZWxlY3QgdGhlIGVudGlyZSBib2R5IGJlY2F1c2U6XHJcbiAgICAgICAgICAgIC8vIC0gaXQncyBndWFyYW50ZWVkIHRvIGV4aXN0LFxyXG4gICAgICAgICAgICAvLyAtIGl0IHdvcmtzICh1bmxpa2UsIHNheSwgZG9jdW1lbnQuaGVhZCwgb3IgcGhhbnRvbSBlbGVtZW50IHRoYXQgaXNcclxuICAgICAgICAgICAgLy8gICBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NKSxcclxuICAgICAgICAgICAgLy8gLSBpdCBkb2Vzbid0IHNlZW0gdG8gZmxpY2tlciAoZHVlIHRvIHRoZSBzeW5jaHJvbm91cyBjb3B5IGV2ZW50KSwgYW5kXHJcbiAgICAgICAgICAgIC8vIC0gaXQgYXZvaWRzIG1vZGlmeWluZyB0aGUgRE9NIChjYW4gdHJpZ2dlciBtdXRhdGlvbiBvYnNlcnZlcnMpLlxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIHdlIGNhbid0IGRvIHByb3BlciBmZWF0dXJlIGRldGVjdGlvbiAod2UgYWxyZWFkeSBjaGVja2VkXHJcbiAgICAgICAgICAgIC8vIGRvY3VtZW50LnF1ZXJ5Q29tbWFuZEVuYWJsZWQoXCJjb3B5XCIpICwgd2hpY2ggYWN0dWFsbHkgZ2l2ZXMgYSBmYWxzZVxyXG4gICAgICAgICAgICAvLyBuZWdhdGl2ZSBmb3IgQmxpbmsgd2hlbiBub3RoaW5nIGlzIHNlbGVjdGVkKSBhbmQgVUEgc25pZmZpbmcgaXMgbm90XHJcbiAgICAgICAgICAgIC8vIHJlbGlhYmxlIChhIGxvdCBvZiBVQSBzdHJpbmdzIGNvbnRhaW4gXCJTYWZhcmlcIiksIHRoaXMgd2lsbCBhbHNvXHJcbiAgICAgICAgICAgIC8vIGhhcHBlbiBmb3Igc29tZSBicm93c2VycyBvdGhlciB0aGFuIFNhZmFyaS4gOi0oKVxyXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xyXG4gICAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMoZG9jdW1lbnQuYm9keSk7XHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSB7XCJ0ZXh0L3BsYWluXCI6IGRhdGF9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IHtcInRleHQvaHRtbFwiOiBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYm9ndXNTZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudC5leGVjQ29tbWFuZCBpcyBzeW5jaHJvbm91czogaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC1jbGlwYm9hcmQtYXBpcy0yMDE1MDQyMS8jaW50ZWdyYXRpb24td2l0aC1yaWNoLXRleHQtZWRpdGluZy1hcGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU28gd2UgY2FuIGNhbGwgcmVzb2x2ZVJlZigpIGJhY2sgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNvcHkuIFBlcmhhcHMgaXQncyBub3QgYXZhaWxhYmxlIGluIHlvdXIgYnJvd3Nlcj9cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmNsaXBib2FyZC5wYXN0ZSA9IChmdW5jdGlvbigpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX3Jlc29sdmU7XHJcbiAgICB2YXIgX2RhdGFUeXBlO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBmdW5jdGlvbihlOkNsaXBib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHZhciByZXNvbHZlID0gX3Jlc29sdmU7XHJcbiAgICAgICAgICAgIF9yZXNvbHZlID0gbnVsbDtcclxuICAgICAgICAgICAgcmVzb2x2ZShlLmNsaXBib2FyZERhdGEuZ2V0RGF0YShfZGF0YVR5cGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIF9pbnRlcmNlcHQgPSB0cnVlO1xyXG4gICAgICAgICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICAgICAgICAgIF9kYXRhVHlwZSA9IGRhdGFUeXBlIHx8IFwidGV4dC9wbGFpblwiO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5leGVjQ29tbWFuZChcInBhc3RlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJVbmFibGUgdG8gcGFzdGUuIFBhc3Rpbmcgb25seSB3b3JrcyBpbiBJbnRlcm5ldCBFeHBsb3JlciBhdCB0aGUgbW9tZW50LlwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLy8gSGFuZGxlIElFIGJlaGF2aW91ci5cclxuaWYgKHR5cGVvZiBDbGlwYm9hcmRFdmVudCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgdHlwZW9mIHduZC5jbGlwYm9hcmREYXRhICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG5cclxuICAgIGNsaXBib2FyZC5jb3B5ID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgLy8gSUUgc3VwcG9ydHMgc3RyaW5nIGFuZCBVUkwgdHlwZXM6IGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzY3NDQodj12cy44NSkuYXNweFxyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHN1cHBvcnQgdGhlIHN0cmluZyB0eXBlIGZvciBub3cuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIiAmJiAhKFwidGV4dC9wbGFpblwiIGluIGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBwcm92aWRlIGEgdGV4dC9wbGFpbiB0eXBlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHN0ckRhdGEgPSAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogZGF0YVtcInRleHQvcGxhaW5cIl0pO1xyXG4gICAgICAgICAgICB2YXIgY29weVN1Y2NlZWRlZCA9IHduZC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJUZXh0XCIsIHN0ckRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoY29weVN1Y2NlZWRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcHlpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY2xpcGJvYXJkLnBhc3RlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9IHduZC5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJUZXh0XCIpO1xyXG4gICAgICAgICAgICBpZiAoc3RyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzdHJEYXRhKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIHJlamVjdGVkIHRoZSBwYXN0ZSByZXF1ZXN0LlxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlBhc3Rpbmcgd2FzIHJlamVjdGVkLlwiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpcGJvYXJkT2JqZWN0XHJcbntcclxuICAgIGNvcHkodmFsOnN0cmluZ3xFbGVtZW50KTpQcm9taXNlPHZvaWQ+O1xyXG4gICAgcGFzdGUoKTpQcm9taXNlPHN0cmluZz47XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBDbGlwYm9hcmQgPSBjbGlwYm9hcmQ7Il19
