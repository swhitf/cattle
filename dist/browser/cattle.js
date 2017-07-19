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
//  Import support https://stackoverflow.com/questions/13673346/supporting-both-commonjs-and-amd
(function(name, definition) {
    if (typeof module !== "undefined") { module.exports = definition(); }
    else if (typeof define === "function" && typeof define.amd === "object") { define(definition); }
    else { this[name] = definition(); }
}("clipboard", function() {
  if (typeof document === 'undefined' || !document.addEventListener) {
    return null;
  }

  var clipboard = {};

  clipboard.copy = (function() {
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

    document.addEventListener("copy", function(e) {
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
        sel.removeAllRanges();
        sel.addRange(range);
        _bogusSelection = true;
      }
    };

    return function(data) {
      return new Promise(function(resolve, reject) {
        _intercept = true;
        if (typeof data === "string") {
          _data = {"text/plain": data};
        } else if (data instanceof Node) {
          _data = {"text/html": new XMLSerializer().serializeToString(data)};
        } else if (data instanceof Object){
          _data = data;
        } else {
          reject("Invalid data type. Must be string, DOM node, or an object mapping MIME types to strings.")
        }

        function triggerCopy(tryBogusSelect) {
          try {
            if (document.execCommand("copy")) {
              // document.execCommand is synchronous: http://www.w3.org/TR/2015/WD-clipboard-apis-20150421/#integration-with-rich-text-editing-apis
              // So we can call resolve() back here.
              cleanup();
              resolve();
            }
            else {
              if (!tryBogusSelect) {
                bogusSelect();
                triggerCopy(true);
              } else {
                cleanup();
                throw new Error("Unable to copy. Perhaps it's not available in your browser?");
              }
            }
          } catch (e) {
            cleanup();
            reject(e);
          }
        }
        triggerCopy(false);

      });
    };
  })();

  clipboard.paste = (function() {
    var _intercept = false;
    var _resolve;
    var _dataType;

    document.addEventListener("paste", function(e) {
      if (_intercept) {
        _intercept = false;
        e.preventDefault();
        var resolve = _resolve;
        _resolve = null;
        resolve(e.clipboardData.getData(_dataType));
      }
    });

    return function(dataType) {
      return new Promise(function(resolve, reject) {
        _intercept = true;
        _resolve = resolve;
        _dataType = dataType || "text/plain";
        try {
          if (!document.execCommand("paste")) {
            _intercept = false;
            reject(new Error("Unable to paste. Pasting only works in Internet Explorer at the moment."));
          }
        } catch (e) {
          _intercept = false;
          reject(new Error(e));
        }
      });
    };
  })();

  // Handle IE behaviour.
  if (typeof ClipboardEvent === "undefined" &&
      typeof window.clipboardData !== "undefined" &&
      typeof window.clipboardData.setData !== "undefined") {

    /*! promise-polyfill 2.0.1 */
    (function(a){function b(a,b){return function(){a.apply(b,arguments)}}function c(a){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof a)throw new TypeError("not a function");this._state=null,this._value=null,this._deferreds=[],i(a,b(e,this),b(f,this))}function d(a){var b=this;return null===this._state?void this._deferreds.push(a):void j(function(){var c=b._state?a.onFulfilled:a.onRejected;if(null===c)return void(b._state?a.resolve:a.reject)(b._value);var d;try{d=c(b._value)}catch(e){return void a.reject(e)}a.resolve(d)})}function e(a){try{if(a===this)throw new TypeError("A promise cannot be resolved with itself.");if(a&&("object"==typeof a||"function"==typeof a)){var c=a.then;if("function"==typeof c)return void i(b(c,a),b(e,this),b(f,this))}this._state=!0,this._value=a,g.call(this)}catch(d){f.call(this,d)}}function f(a){this._state=!1,this._value=a,g.call(this)}function g(){for(var a=0,b=this._deferreds.length;b>a;a++)d.call(this,this._deferreds[a]);this._deferreds=null}function h(a,b,c,d){this.onFulfilled="function"==typeof a?a:null,this.onRejected="function"==typeof b?b:null,this.resolve=c,this.reject=d}function i(a,b,c){var d=!1;try{a(function(a){d||(d=!0,b(a))},function(a){d||(d=!0,c(a))})}catch(e){if(d)return;d=!0,c(e)}}var j=c.immediateFn||"function"==typeof setImmediate&&setImmediate||function(a){setTimeout(a,1)},k=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)};c.prototype["catch"]=function(a){return this.then(null,a)},c.prototype.then=function(a,b){var e=this;return new c(function(c,f){d.call(e,new h(a,b,c,f))})},c.all=function(){var a=Array.prototype.slice.call(1===arguments.length&&k(arguments[0])?arguments[0]:arguments);return new c(function(b,c){function d(f,g){try{if(g&&("object"==typeof g||"function"==typeof g)){var h=g.then;if("function"==typeof h)return void h.call(g,function(a){d(f,a)},c)}a[f]=g,0===--e&&b(a)}catch(i){c(i)}}if(0===a.length)return b([]);for(var e=a.length,f=0;f<a.length;f++)d(f,a[f])})},c.resolve=function(a){return a&&"object"==typeof a&&a.constructor===c?a:new c(function(b){b(a)})},c.reject=function(a){return new c(function(b,c){c(a)})},c.race=function(a){return new c(function(b,c){for(var d=0,e=a.length;e>d;d++)a[d].then(b,c)})},"undefined"!=typeof module&&module.exports?module.exports=c:a.Promise||(a.Promise=c)})(this);

    clipboard.copy = function(data) {
      return new Promise(function(resolve, reject) {
        // IE supports string and URL types: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
        // We only support the string type for now.
        if (typeof data !== "string" && !("text/plain" in data)) {
          throw new Error("You must provide a text/plain type.");
        }

        var strData = (typeof data === "string" ? data : data["text/plain"]);
        var copySucceeded = window.clipboardData.setData("Text", strData);
        if (copySucceeded) {
          resolve();
        } else {
          reject(new Error("Copying was rejected."));
        }
      });
    };

    clipboard.paste = function() {
      return new Promise(function(resolve, reject) {
        var strData = window.clipboardData.getData("Text");
        if (strData) {
          resolve(strData);
        } else {
          // The user rejected the paste request.
          reject(new Error("Pasting was rejected."));
        }
      });
    };
  }

  return clipboard;
}));

},{}],3:[function(require,module,exports){
/*!
	Papa Parse
	v4.3.3
	https://github.com/mholt/PapaParse
	License: MIT
*/
(function(root, factory)
{
	if (typeof define === 'function' && define.amd)
	{
		// AMD. Register as an anonymous module.
		define([], factory);
	}
	else if (typeof module === 'object' && typeof exports !== 'undefined')
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
	Papa.ReadableStreamStreamer = ReadableStreamStreamer;

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
		var dynamicTyping = _config.dynamicTyping || false;
		if (isFunction(dynamicTyping)) {
			_config.dynamicTypingFunction = dynamicTyping;
			// Will be filled on first row call
			dynamicTyping = {};
		}
		_config.dynamicTyping = dynamicTyping;

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
		else if (_input.readable === true && isFunction(_input.read) && isFunction(_input.on))
		{
			streamer = new ReadableStreamStreamer(_config);
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
			// Headers can only be set when once the request state is OPENED
			if (this._config.downloadRequestHeaders)
			{
				var headers = this._config.downloadRequestHeaders;

				for (var headerName in headers)
				{
					xhr.setRequestHeader(headerName, headers[headerName]);
				}
			}

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


	function ReadableStreamStreamer(config)
	{
		config = config || {};

		ChunkStreamer.call(this, config);

		var queue = [];
		var parseOnData = true;

		this.stream = function(stream)
		{
			this._input = stream;

			this._input.on('data', this._streamData);
			this._input.on('end', this._streamEnd);
			this._input.on('error', this._streamError);
		}

		this._nextChunk = function()
		{
			if (queue.length)
			{
				this.parseChunk(queue.shift());
			}
			else
			{
				parseOnData = true;
			}
		}

		this._streamData = bindFunction(function(chunk)
		{
			try
			{
				queue.push(typeof chunk === 'string' ? chunk : chunk.toString(this._config.encoding));

				if (parseOnData)
				{
					parseOnData = false;
					this.parseChunk(queue.shift());
				}
			}
			catch (error)
			{
				this._streamError(error);
			}
		}, this);

		this._streamError = bindFunction(function(error)
		{
			this._streamCleanUp();
			this._sendError(error.message);
		}, this);

		this._streamEnd = bindFunction(function()
		{
			this._streamCleanUp();
			this._finished = true;
			this._streamData('');
		}, this);

		this._streamCleanUp = bindFunction(function()
		{
			this._input.removeListener('data', this._streamData);
			this._input.removeListener('end', this._streamEnd);
			this._input.removeListener('error', this._streamError);
		}, this);
	}
	ReadableStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
	ReadableStreamStreamer.prototype.constructor = ReadableStreamStreamer;


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
		var _aborted = false;	// Whether the parser has aborted or not
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
			else if(isFunction(_config.delimiter))
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

		function shouldApplyDynamicTyping(field) {
			// Cache function values to avoid calling it for each row
			if (_config.dynamicTypingFunction && _config.dynamicTyping[field] === undefined) {
				_config.dynamicTyping[field] = _config.dynamicTypingFunction(field);
			}
			return (_config.dynamicTyping[field] || _config.dynamicTyping) === true
		}

		function parseDynamic(field, value)
		{
			if (shouldApplyDynamicTyping(field))
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
			var stepIsFunction = isFunction(step);

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

},{}],5:[function(require,module,exports){
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
},{"./extensions/common/ClipboardExtension":6,"./extensions/common/EditingExtension":7,"./extensions/common/ScrollerExtension":8,"./extensions/common/SelectorExtension":9,"./extensions/compute/ComputeExtension":10,"./extensions/compute/JavaScriptComputeEngine":11,"./extensions/compute/WatchManager":12,"./extensions/extra/ClickZoneExtension":13,"./extensions/history/HistoryExtension":14,"./extensions/history/HistoryManager":15,"./geom/Point":17,"./geom/Rect":18,"./misc/Base26":27,"./model/GridRange":33,"./model/default/DefaultGridCell":34,"./model/default/DefaultGridColumn":35,"./model/default/DefaultGridModel":36,"./model/default/DefaultGridRow":37,"./model/styled/Style":38,"./model/styled/StyledGridCell":39,"./ui/Extensibility":40,"./ui/GridElement":41,"./ui/GridKernel":42,"./ui/Widget":43,"./ui/internal/EventEmitter":44}],6:[function(require,module,exports){
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
var _ = require("../../misc/Util");
var Dom = require("../../misc/Dom");
var Papa = require("papaparse");
var Tether = require("tether");
var clipboard = require("clipboard-js");
//I know... :(
//const NewLine = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
var NewLine = '\r\n';
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
        clipboard.copy(text);
    };
    ClipboardExtension.prototype.doPaste = function (text) {
        var _a = this, grid = _a.grid, selection = _a.selection;
        selection = selection.filter(function (x) { return !is_readonly(grid.model.findCell(x)); });
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
    return ClipboardExtension;
}());
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
function is_readonly(cell) {
    return cell['readonly'] === true || cell['mutable'] === false;
}
},{"../../geom/Point":17,"../../geom/Rect":18,"../../input/KeyInput":22,"../../misc/Dom":28,"../../misc/Util":32,"../../model/GridRange":33,"../../ui/Extensibility":40,"../../ui/Widget":43,"./EditingExtension":7,"clipboard-js":2,"papaparse":3,"tether":4}],7:[function(require,module,exports){
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
        this.input.root.addEventListener('blur', function () { _this.endEdit(true); });
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
        var _a = this, grid = _a.grid, selection = _a.selection;
        if (this.isEditing)
            return;
        selection = selection.filter(function (x) { return !is_readonly(grid.model.findCell(x)); });
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
    return EditingExtension;
}());
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
},{"../../geom/Point":17,"../../input/KeyInput":22,"../../input/MouseInput":26,"../../misc/Dom":28,"../../misc/Util":32,"../../ui/Extensibility":40,"../../ui/Widget":43,"tether":4}],8:[function(require,module,exports){
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
},{"../../geom/Padding":16,"../../geom/Point":17,"../../misc/Dom":28,"../../misc/Util":32}],9:[function(require,module,exports){
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
    return SelectorExtension;
}());
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
},{"../../geom/Point":17,"../../geom/Rect":18,"../../input/KeyInput":22,"../../input/MouseDragEventSupport":24,"../../input/MouseInput":26,"../../misc/Dom":28,"../../ui/Extensibility":40,"../../ui/Widget":43,"tether":4}],10:[function(require,module,exports){
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
},{"../common/EditingExtension":7,"./JavaScriptComputeEngine":11}],11:[function(require,module,exports){
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
},{"../../misc/Util":32,"../../model/GridRange":33,"../common/EditingExtension":7,"./WatchManager":12}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Polyfill_1 = require("../../misc/Polyfill");
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
    var event = Polyfill_1.ie_safe_create_mouse_event(type, source);
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
},{"../../geom/Point":17,"../../geom/Rect":18,"../../misc/Dom":28,"../../misc/Polyfill":29,"tether":4}],14:[function(require,module,exports){
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
    return HistoryExtension;
}());
exports.HistoryExtension = HistoryExtension;
function create_changes(snapshots, valSelector) {
    var changeSet = new EditingExtension_1.GridChangeSet();
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        changeSet.put(s.ref, valSelector(s), s.cascaded);
    }
    return changeSet;
}
},{"../../input/KeyInput":22,"../../misc/Util":32,"../../ui/Extensibility":40,"../common/EditingExtension":7,"./HistoryManager":15}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
    Padding.empty = new Padding(0, 0, 0, 0);
    return Padding;
}());
exports.Padding = Padding;
},{"../misc/Util":32}],17:[function(require,module,exports){
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
    Point.rad2deg = 360 / (Math.PI * 2);
    Point.deg2rad = (Math.PI * 2) / 360;
    Point.empty = new Point(0, 0);
    Point.max = new Point(2147483647, 2147483647);
    Point.min = new Point(-2147483647, -2147483647);
    Point.up = new Point(0, -1);
    return Point;
}());
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
},{}],18:[function(require,module,exports){
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
    Rect.empty = new Rect(0, 0, 0, 0);
    return Rect;
}());
exports.Rect = Rect;
},{"./Point":17}],19:[function(require,module,exports){
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
},{"../misc/Util":32}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{"./Keys":23}],22:[function(require,module,exports){
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
},{"./EventTargetEventEmitterAdapter":19,"./KeyExpression":21}],23:[function(require,module,exports){
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
    return Keys;
}());
exports.Keys = Keys;
},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Polyfill_1 = require("../misc/Polyfill");
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
        var event = (Polyfill_1.ie_safe_create_mouse_event(type, source));
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
},{"../geom/Point":17,"../misc/Polyfill":29}],25:[function(require,module,exports){
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
},{"../misc/Util":32,"./KeyCheck":20,"./Keys":23}],26:[function(require,module,exports){
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
},{"./EventTargetEventEmitterAdapter":19,"./KeyCheck":20,"./MouseExpression":25}],27:[function(require,module,exports){
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
},{"bases":1}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ie_safe_create_mouse_event(type, source) {
    if (MouseEvent.prototype.initMouseEvent) {
        var event_1 = document.createEvent("MouseEvent");
        event_1.initMouseEvent(type, source.bubbles, source.cancelable, window, source.detail, source.screenX, source.screenY, source.clientX, source.clientY, source.ctrlKey, source.altKey, source.shiftKey, source.metaKey, source.button, source.relatedTarget);
        return event_1;
    }
    else {
        return new MouseEvent(type, source);
    }
}
exports.ie_safe_create_mouse_event = ie_safe_create_mouse_event;
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
},{"../geom/Point":17,"../geom/Rect":18,"../misc/Base26":27,"../misc/Util":32}],34:[function(require,module,exports){
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
    DefaultGridCell = __decorate([
        Extensibility_1.renderer(draw),
        __metadata("design:paramtypes", [Object])
    ], DefaultGridCell);
    return DefaultGridCell;
}());
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
        this.refresh();
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
    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    DefaultGridModel.prototype.refresh = function () {
        var cells = this.cells;
        this.refs = _.index(cells, function (x) { return x.ref; });
        this.coords = {};
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var cell = cells_1[_i];
            for (var co = 0; co < cell.colSpan; co++) {
                for (var ro = 0; ro < cell.rowSpan; ro++) {
                    var c = cell.colRef + co;
                    var r = cell.rowRef + ro;
                    var cix = this.coords[c] || (this.coords[c] = {});
                    if (cix[r]) {
                        console.warn('Two cells appear to occupy', c, 'x', r);
                    }
                    cix[r] = cell;
                }
            }
        }
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
    return Style;
}(Cascading));
exports.Style = Style;
var TextStyle = (function (_super) {
    __extends(TextStyle, _super);
    function TextStyle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
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
    return TextStyle;
}(Cascading));
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
    return StyledGridCell;
}(DefaultGridCell_1.DefaultGridCell));
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
},{"../../geom/Point":17,"../../ui/Extensibility":40,"../default/DefaultGridCell":34,"./Style":38}],40:[function(require,module,exports){
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
var Polyfill_1 = require("../misc/Polyfill");
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
            console.time("GridElement.redraw(force=" + forceImmediate + ")");
            if (forceImmediate) {
                this.draw(forceImmediate);
            }
            else {
                requestAnimationFrame(this.draw.bind(this, forceImmediate));
            }
        }
    };
    GridElement.prototype.draw = function (forced) {
        if (!this.dirty)
            return;
        this.updateVisuals();
        this.drawVisuals();
        this.dirty = false;
        console.timeEnd("GridElement.redraw(force=" + forced + ")");
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
        console.time('GridElement.updateVisuals');
        var _a = this, model = _a.model, layout = _a.layout;
        var fragments = this.computeViewFragments();
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
        var event = (Polyfill_1.ie_safe_create_mouse_event(type, source));
        event.cell = source.cell;
        event.gridX = source.gridX;
        event.gridY = source.gridY;
        return event;
    };
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
    return GridElement;
}(EventEmitter_1.EventEmitterBase));
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
},{"../geom/Padding":16,"../geom/Point":17,"../geom/Rect":18,"../misc/Polyfill":29,"../misc/Property":30,"../misc/Util":32,"../model/GridRange":33,"../model/default/DefaultGridModel":36,"./GridKernel":42,"./internal/EventEmitter":44,"./internal/GridLayout":45}],42:[function(require,module,exports){
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
},{"../geom/Rect":18,"../misc/Dom":28}],44:[function(require,module,exports){
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
        var loadTracker = {};
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
                    if (cell && !loadTracker[cell.ref]) {
                        var width_1 = 0, height_1 = 0;
                        //Take colSpan and rowSpan into account
                        for (var cix = ci; cix <= maxCol && cix < (ci + cell.colSpan); cix++) {
                            width_1 += colLookup[cix].width;
                        }
                        for (var rix = ri; rix <= maxRow && rix < (ri + cell.rowSpan); rix++) {
                            height_1 += rowLookup[rix].height;
                        }
                        cellRegs.push({
                            ref: cell.ref,
                            left: accLeft,
                            top: accTop,
                            width: width_1,
                            height: height_1,
                        });
                        loadTracker[cell.ref] = true;
                    }
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
        var lookup = this.cellLookup;
        var cols = this.captureColumns(region);
        var rows = this.captureRows(region);
        var cells = new Array();
        for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
            var c = cols_1[_i];
            if (!lookup[c])
                continue;
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var r = rows_1[_a];
                if (!lookup[c][r])
                    continue;
                cells.push(lookup[c][r].ref);
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
        var cell = cells_1[_i];
        for (var co = 0; co < cell.colSpan; co++) {
            for (var ro = 0; ro < cell.rowSpan; ro++) {
                var c = cell.colRef + co;
                var r = cell.rowRef + ro;
                var cix = ix[c] || (ix[c] = {});
                if (cix[r]) {
                    console.warn('Two cells appear to occupy', c, 'x', r);
                }
                cix[r] = cell;
            }
        }
    }
    return ix;
}
},{"../../geom/Rect":18,"../../misc/Util":32,"../../model/default/DefaultGridColumn":35,"../../model/default/DefaultGridRow":37}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZXMvYmFzZXMuanMiLCJub2RlX21vZHVsZXMvY2xpcGJvYXJkLWpzL2NsaXBib2FyZC5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3RldGhlci9kaXN0L2pzL3RldGhlci5qcyIsInNyYy9icm93c2VyLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL0NsaXBib2FyZEV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZS50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvV2F0Y2hNYW5hZ2VyLnRzIiwic3JjL2V4dGVuc2lvbnMvZXh0cmEvQ2xpY2tab25lRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5TWFuYWdlci50cyIsInNyYy9nZW9tL1BhZGRpbmcudHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9CYXNlMjYudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qb2x5ZmlsbC50cyIsInNyYy9taXNjL1Byb3BlcnR5LnRzIiwic3JjL21pc2MvUmVmR2VuLnRzIiwic3JjL21pc2MvVXRpbC50cyIsInNyYy9tb2RlbC9HcmlkUmFuZ2UudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENlbGwudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtbi50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZFJvdy50cyIsInNyYy9tb2RlbC9zdHlsZWQvU3R5bGUudHMiLCJzcmMvbW9kZWwvc3R5bGVkL1N0eWxlZEdyaWRDZWxsLnRzIiwic3JjL3VpL0V4dGVuc2liaWxpdHkudHMiLCJzcmMvdWkvR3JpZEVsZW1lbnQudHMiLCJzcmMvdWkvR3JpZEtlcm5lbC50cyIsInNyYy91aS9XaWRnZXQudHMiLCJzcmMvdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyLnRzIiwic3JjL3VpL2ludGVybmFsL0dyaWRMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlCLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssYUFBYSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzVCLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3RDLEtBQUssYUFBYSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hDLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ2hDLEtBQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQzlCLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xDLEtBQUssZUFBZSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ2hELEtBQUssY0FBYyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzlDLEtBQUssY0FBYyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzlDLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzFDLEtBQUssZUFBZSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ2hELEtBQUssY0FBYyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzlDO2dCQUNJLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQztvQkFDYixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUM7Z0JBQ2xDLElBQUk7b0JBQ0EsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDO0lBQ0wsQ0FBQztJQXJQYSxjQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsUUFBRyxHQUFHLENBQUMsQ0FBQztJQUNSLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsU0FBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLFFBQUcsR0FBRyxFQUFFLENBQUM7SUFDVCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsY0FBUyxHQUFHLEVBQUUsQ0FBQztJQUNmLFdBQU0sR0FBRyxFQUFFLENBQUM7SUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsWUFBTyxHQUFHLEVBQUUsQ0FBQztJQUNiLGNBQVMsR0FBRyxFQUFFLENBQUM7SUFDZixRQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ1QsU0FBSSxHQUFHLEVBQUUsQ0FBQztJQUNWLGVBQVUsR0FBRyxFQUFFLENBQUM7SUFDaEIsYUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNkLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLGVBQVUsR0FBRyxFQUFFLENBQUM7SUFDaEIsV0FBTSxHQUFHLEVBQUUsQ0FBQztJQUNaLFdBQU0sR0FBRyxFQUFFLENBQUM7SUFDWixVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxVQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ1gsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQUNYLFVBQUssR0FBRyxFQUFFLENBQUM7SUFDWCxjQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ2YsZUFBVSxHQUFHLEVBQUUsQ0FBQztJQUNoQixXQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ1osYUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNkLGFBQVEsR0FBRyxFQUFFLENBQUM7SUFDZCxhQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2QsYUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNkLGFBQVEsR0FBRyxHQUFHLENBQUM7SUFDZixhQUFRLEdBQUcsR0FBRyxDQUFDO0lBQ2YsYUFBUSxHQUFHLEdBQUcsQ0FBQztJQUNmLGFBQVEsR0FBRyxHQUFHLENBQUM7SUFDZixhQUFRLEdBQUcsR0FBRyxDQUFDO0lBQ2YsYUFBUSxHQUFHLEdBQUcsQ0FBQztJQUNmLGFBQVEsR0FBRyxHQUFHLENBQUM7SUFDZixRQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ1YsYUFBUSxHQUFHLEdBQUcsQ0FBQztJQUNmLFlBQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxXQUFNLEdBQUcsR0FBRyxDQUFDO0lBQ2IsT0FBRSxHQUFHLEdBQUcsQ0FBQztJQUNULE9BQUUsR0FBRyxHQUFHLENBQUM7SUFDVCxPQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ1QsT0FBRSxHQUFHLEdBQUcsQ0FBQztJQUNULE9BQUUsR0FBRyxHQUFHLENBQUM7SUFDVCxPQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ1QsT0FBRSxHQUFHLEdBQUcsQ0FBQztJQUNULE9BQUUsR0FBRyxHQUFHLENBQUM7SUFDVCxPQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ1QsUUFBRyxHQUFHLEdBQUcsQ0FBQztJQUNWLFFBQUcsR0FBRyxHQUFHLENBQUM7SUFDVixRQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ1YsYUFBUSxHQUFHLEdBQUcsQ0FBQztJQUNmLGdCQUFXLEdBQUcsR0FBRyxDQUFDO0lBQ2xCLGNBQVMsR0FBRyxHQUFHLENBQUM7SUFDaEIsV0FBTSxHQUFHLEdBQUcsQ0FBQztJQUNiLFVBQUssR0FBRyxHQUFHLENBQUM7SUFDWixTQUFJLEdBQUcsR0FBRyxDQUFDO0lBQ1gsV0FBTSxHQUFHLEdBQUcsQ0FBQztJQUNiLGtCQUFhLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLGlCQUFZLEdBQUcsR0FBRyxDQUFDO0lBQ25CLGlCQUFZLEdBQUcsR0FBRyxDQUFDO0lBQ25CLGVBQVUsR0FBRyxHQUFHLENBQUM7SUFDakIsa0JBQWEsR0FBRyxHQUFHLENBQUM7SUFDcEIsaUJBQVksR0FBRyxHQUFHLENBQUM7SUFvSnJDLFdBQUM7Q0F4UEQsQUF3UEMsSUFBQTtBQXhQWSxvQkFBSTs7OztBQ0hqQiw2Q0FBOEQ7QUFDOUQsdUNBQXNDO0FBSXRDO0lBb0JJLCtCQUFnQyxJQUFnQjtRQUFoQixTQUFJLEdBQUosSUFBSSxDQUFZO1FBUHRDLGVBQVUsR0FBVyxLQUFLLENBQUM7UUFDM0IsZUFBVSxHQUFXLEtBQUssQ0FBQztRQVFqQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvRixDQUFDO0lBckJhLDJCQUFLLEdBQW5CLFVBQW9CLElBQWdCO1FBRWhDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEtBQUssTUFBTSxDQUFDO0lBQzVELENBQUM7SUFFYSw0QkFBTSxHQUFwQixVQUFxQixJQUFnQjtRQUVqQyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFjTSx1Q0FBTyxHQUFkO1FBRUksSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFUyxpREFBaUIsR0FBM0IsVUFBNEIsQ0FBWTtRQUVwQyxxQkFBcUI7UUFDckIsc0JBQXNCO1FBRXRCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuRSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxNQUFNLEdBQUc7WUFFVixNQUFNLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDO1FBRUYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFUyxpREFBaUIsR0FBM0IsVUFBNEIsQ0FBWTtRQUVwQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXBCLElBQUksUUFBUSxHQUFHLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRS9DLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FDcEIsQ0FBQztZQUNHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUNyQixDQUFDO2dCQUNHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQzNCLENBQUM7WUFDRCxJQUFJLENBQ0osQ0FBQztnQkFDRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDOUIsQ0FBQztJQUVTLCtDQUFlLEdBQXpCLFVBQTBCLENBQVk7UUFFbEMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUVwQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQ3BCLENBQUM7WUFDRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FDaEIsQ0FBQztZQUNHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixDQUFDO0lBQ0wsQ0FBQztJQUVPLDJDQUFXLEdBQW5CLFVBQW9CLElBQVcsRUFBRSxNQUFpQixFQUFFLElBQVc7UUFFM0QsSUFBSSxLQUFLLEdBQW1CLENBQUMscUNBQTBCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdkUsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNqQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNULENBQUM7WUFDRyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckIsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDTCw0QkFBQztBQUFELENBNUdBLEFBNEdDLElBQUE7QUE1R1ksc0RBQXFCOzs7O0FDTGxDLCtCQUE4QjtBQUM5QixnQ0FBa0M7QUFDbEMsdUNBQXNDO0FBS3RDLHFCQUFxQixLQUFZO0lBRTdCLEtBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMzQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FDZCxDQUFDO1FBQ0csS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssSUFBSTtZQUNMLE1BQU0sQ0FBaUIsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDN0MsS0FBSyxPQUFPLENBQUM7UUFDYixLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssTUFBTSxDQUFDO1FBQ1osS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLFdBQVcsQ0FBQztRQUNqQixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssU0FBUztZQUNWLE1BQU0sQ0FBaUIsS0FBSyxDQUFDO1FBQ2pDO1lBQ0ksTUFBTSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7SUFDakQsQ0FBQztBQUNMLENBQUM7QUFFRCxzQkFBc0IsS0FBWTtJQUU5QixLQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDM0MsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQ2QsQ0FBQztRQUNHLEtBQUssU0FBUyxDQUFDO1FBQ2YsS0FBSyxTQUFTO1lBQ1YsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNiLEtBQUssV0FBVyxDQUFDO1FBQ2pCLEtBQUssU0FBUztZQUNWLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixLQUFLLFNBQVM7WUFDVixNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2I7WUFDSSxNQUFNLHVCQUF1QixHQUFHLEtBQUssQ0FBQztJQUM5QyxDQUFDO0FBQ0wsQ0FBQztBQUVELDJCQUEyQixLQUFZO0lBRW5DLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFN0IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDdEIsQ0FBQztRQUNHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRDtJQXdDSSx5QkFBb0IsR0FBTztRQUxYLFVBQUssR0FBa0IsSUFBSSxDQUFDO1FBQzVCLFdBQU0sR0FBVSxJQUFJLENBQUM7UUFDckIsU0FBSSxHQUFZLEVBQUUsQ0FBQztRQUNuQixjQUFTLEdBQVcsS0FBSyxDQUFDO1FBSXRDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUF6Q2EscUJBQUssR0FBbkIsVUFBb0IsS0FBWTtRQUU1QixJQUFJLEdBQUcsR0FBUTtZQUNYLElBQUksRUFBRSxFQUFFO1NBQ1gsQ0FBQztRQUVGLEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQ2xCLENBQUM7WUFDRyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUcsSUFBQSw2QkFBd0MsRUFBdkMsWUFBSSxFQUFFLGFBQUssQ0FBNkI7UUFFN0MsR0FBRyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFOUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLFVBQUEsQ0FBQztZQUVOLElBQUksR0FBRyxHQUFHLFdBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FDakIsQ0FBQztnQkFDRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QixDQUFDO1lBQ0QsSUFBSSxDQUNKLENBQUM7Z0JBQ0csR0FBRyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRVAsTUFBTSxDQUFDLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFZTSxpQ0FBTyxHQUFkLFVBQWUsU0FBb0I7UUFFL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFakIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFakIsR0FBRyxDQUFDLENBQVUsVUFBUyxFQUFULEtBQUEsSUFBSSxDQUFDLElBQUksRUFBVCxjQUFTLEVBQVQsSUFBUztZQUFsQixJQUFJLENBQUMsU0FBQTtZQUVOLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDcEI7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDTCxzQkFBQztBQUFELENBN0RBLEFBNkRDLElBQUE7QUE3RFksMENBQWU7Ozs7QUMxRDVCLG1GQUFrRjtBQUNsRixxREFBb0Q7QUFFcEQsdUNBQXNDO0FBVXRDO0lBVUksb0JBQTRCLFFBQXVCO1FBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7UUFGM0MsU0FBSSxHQUF1QixFQUFFLENBQUM7SUFJdEMsQ0FBQztJQVZhLGNBQUcsR0FBakI7UUFBa0IsZUFBbUI7YUFBbkIsVUFBbUIsRUFBbkIscUJBQW1CLEVBQW5CLElBQW1CO1lBQW5CLDBCQUFtQjs7UUFFakMsbUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQixNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQVFNLHVCQUFFLEdBQVQsVUFBVSxJQUFXLEVBQUUsUUFBc0I7UUFBN0MsaUJBVUM7UUFSRyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLEVBQUUsSUFBSSxPQUFBLEtBQUksQ0FBQyxjQUFjLENBQ2hELEVBQUUsRUFDRixpQ0FBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFDM0IsUUFBUSxDQUFDLEVBSG9CLENBR3BCLENBQUMsQ0FBQztRQUVmLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFakMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU8sbUNBQWMsR0FBdEIsVUFBdUIsTUFBbUIsRUFBRSxJQUFvQixFQUFFLFFBQXNCO1FBRXBGLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBQyxHQUFjO1lBRXhDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDdEIsQ0FBQztnQkFDRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQ25CLENBQUM7b0JBQ0csR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUNyQixHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLENBQUM7Z0JBRUQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDTCxpQkFBQztBQUFELENBMUNBLEFBMENDLElBQUE7QUExQ1ksZ0NBQVU7QUE0Q3ZCLG1CQUFtQixHQUFjO0lBRTdCLE1BQU0sQ0FBaUIsR0FBRztTQUNyQixHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztVQUM3QixJQUFJLCtEQUE4QixDQUFjLENBQUMsQ0FBQztVQUNsRCxDQUFDLEVBRkcsQ0FFSCxDQUNOLENBQUM7QUFDVixDQUFDOzs7O0FDbEVELDZCQUErQjtBQUcvQixJQUFNLE9BQU8sR0FBRyw0QkFBNEIsQ0FBQztBQUU3QztJQWVJLGdCQUFvQixHQUFVLEVBQUUsR0FBVTtRQUV0QyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFqQmEsVUFBRyxHQUFqQixVQUFrQixHQUFVO1FBRXhCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRWEsVUFBRyxHQUFqQixVQUFrQixHQUFVO1FBRXhCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBVUwsYUFBQztBQUFELENBcEJBLEFBb0JDLElBQUE7QUFwQlksd0JBQU07Ozs7QUNIbkIsZUFBc0IsSUFBVztJQUU3QixJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUM3QyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFFdEIsTUFBTSxDQUFjLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztBQUMvQyxDQUFDO0FBUkQsc0JBUUM7QUFFRCxhQUFvQixDQUFhLEVBQUUsTUFBd0I7SUFFdkQsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLENBQ3hCLENBQUM7UUFDRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUM7QUFSRCxrQkFRQztBQUVELGFBQW9CLENBQWEsRUFBRSxNQUFrQjtJQUVqRCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtRQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLElBQUk7UUFDaEMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSTtLQUNyQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBTkQsa0JBTUM7QUFFRCxjQUFxQixDQUFhO0lBRTlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUhELG9CQUdDO0FBRUQsY0FBcUIsQ0FBYTtJQUU5QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFIRCxvQkFHQztBQUVELGdCQUF1QixDQUFhLEVBQUUsT0FBZTtJQUVqRCxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUhELHdCQUdDO0FBRUQsMEJBQWlDLENBQWEsRUFBRSxJQUFXLEVBQUUsTUFBYSxFQUFFLElBQXNCO0lBQXRCLHFCQUFBLEVBQUEsZUFBc0I7SUFFOUYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQU0sSUFBSSxTQUFJLE1BQU0sV0FBTSxJQUFNLENBQUM7SUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2hDLFVBQVUsQ0FBQyxjQUFNLE9BQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxFQUF2QixDQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFMRCw0Q0FLQzs7OztBQ2hERCxvQ0FBMkMsSUFBVyxFQUFFLE1BQWlCO0lBRXJFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQ3hDLENBQUM7UUFDRyxJQUFJLE9BQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9DLE9BQUssQ0FBQyxjQUFjLENBQ2hCLElBQUksRUFDSixNQUFNLENBQUMsT0FBTyxFQUNkLE1BQU0sQ0FBQyxVQUFVLEVBQ2pCLE1BQU0sRUFDTixNQUFNLENBQUMsTUFBTSxFQUNiLE1BQU0sQ0FBQyxPQUFPLEVBQ2QsTUFBTSxDQUFDLE9BQU8sRUFDZCxNQUFNLENBQUMsT0FBTyxFQUNkLE1BQU0sQ0FBQyxPQUFPLEVBQ2QsTUFBTSxDQUFDLE9BQU8sRUFDZCxNQUFNLENBQUMsTUFBTSxFQUNiLE1BQU0sQ0FBQyxRQUFRLEVBQ2YsTUFBTSxDQUFDLE9BQU8sRUFDZCxNQUFNLENBQUMsTUFBTSxFQUNiLE1BQU0sQ0FBQyxhQUFhLENBQ3ZCLENBQUM7UUFDRixNQUFNLENBQUMsT0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxJQUFJLENBQ0osQ0FBQztRQUNHLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDeEMsQ0FBQztBQUNMLENBQUM7QUE1QkQsZ0VBNEJDOzs7O0FDekJELGtCQUF5QixZQUFnQixFQUFFLE1BQThCO0lBRXJFLE1BQU0sQ0FBQyxVQUFTLElBQVEsRUFBRSxRQUFlO1FBRXJDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNsQyxZQUFZLEVBQUUsS0FBSztZQUNuQixVQUFVLEVBQUUsSUFBSTtZQUNoQixHQUFHLEVBQUU7Z0JBRUQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQyxHQUFHLFlBQVksR0FBRyxHQUFHLENBQUM7WUFDcEQsQ0FBQztZQUNELEdBQUcsRUFBRSxVQUFTLE1BQU07Z0JBRWhCLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUMvQixNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLENBQUM7U0FDSixDQUFDLENBQUM7SUFDUCxDQUFDLENBQUE7QUFDTCxDQUFDO0FBbkJELDRCQW1CQzs7OztBQ3RCRCxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUVkO0lBQUE7SUFNQSxDQUFDO0lBSmlCLFdBQUksR0FBbEIsVUFBbUIsTUFBbUI7UUFBbkIsdUJBQUEsRUFBQSxZQUFtQjtRQUVsQyxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDTCxhQUFDO0FBQUQsQ0FOQSxBQU1DLElBQUE7QUFOWSx3QkFBTTs7OztBQ0huQjtJQUE0QixnQkFBYTtTQUFiLFVBQWEsRUFBYixxQkFBYSxFQUFiLElBQWE7UUFBYiwyQkFBYTs7SUFFckMsR0FBRyxDQUFDLENBQVUsVUFBTSxFQUFOLGlCQUFNLEVBQU4sb0JBQU0sRUFBTixJQUFNO1FBQWYsSUFBSSxDQUFDLGVBQUE7UUFFTixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FDbEMsQ0FBQztZQUNHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixDQUFDO0tBQ0o7SUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFYRCw0QkFXQztBQUVELGdCQUF1QixNQUFVLEVBQUUsSUFBUTtJQUV2QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FDbkIsQ0FBQztRQUNHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQVJELHdCQVFDO0FBRUQsZUFBeUIsR0FBTyxFQUFFLE9BQStCO0lBRTdELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUViLEdBQUcsQ0FBQyxDQUFXLFVBQUcsRUFBSCxXQUFHLEVBQUgsaUJBQUcsRUFBSCxJQUFHO1FBQWIsSUFBSSxFQUFFLFlBQUE7UUFFUCxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0tBQ3pCO0lBRUQsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFWRCxzQkFVQztBQUVELGlCQUEyQixFQUFNO0lBRTdCLElBQUksQ0FBQyxHQUFHLEVBQVMsQ0FBQztJQUNsQixHQUFHLENBQUMsQ0FBVyxVQUFFLEVBQUYsU0FBRSxFQUFGLGdCQUFFLEVBQUYsSUFBRTtRQUFaLElBQUksRUFBRSxXQUFBO1FBRVAsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUN0QixDQUFDO1lBQ0csQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUFDLElBQUksQ0FDTixDQUFDO1lBQ0csQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNkLENBQUM7S0FDSjtJQUNELE1BQU0sQ0FBQyxDQUFRLENBQUM7QUFDcEIsQ0FBQztBQWRELDBCQWNDO0FBRUQsY0FBd0IsRUFBOEI7SUFFbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUhELG9CQUdDO0FBRUQsZ0JBQTBCLEVBQThCO0lBRXBELElBQUksQ0FBQyxHQUFPLEVBQUUsQ0FBQztJQUVmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUNqQixDQUFDO1FBQ0csQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUM7QUFWRCx3QkFVQztBQUVELGtCQUF5QixLQUFhO0lBRWxDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUViLEdBQUcsQ0FBQyxDQUFhLFVBQUssRUFBTCxlQUFLLEVBQUwsbUJBQUssRUFBTCxJQUFLO1FBQWpCLElBQUksSUFBSSxjQUFBO1FBRVQsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMxQjtJQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDZixDQUFDO0FBVkQsNEJBVUM7QUFFRCxvQkFBMkIsS0FBUztJQUVoQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFFYixHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FDdEIsQ0FBQztRQUNHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFWRCxnQ0FVQztBQUVELGFBQXVCLEdBQU8sRUFBRSxRQUF3QjtJQUVwRCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBRWhCLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVmLEdBQUcsQ0FBQyxDQUFVLFVBQUcsRUFBSCxXQUFHLEVBQUgsaUJBQUcsRUFBSCxJQUFHO1FBQVosSUFBSSxDQUFDLFlBQUE7UUFFTixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQzlCLENBQUM7WUFDRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQUNKO0lBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUM7QUFoQkQsa0JBZ0JDO0FBRUQscUJBQTRCLE1BQVU7SUFFbEMsRUFBRSxDQUFDLENBQUMsT0FBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUNoQyxDQUFDO1FBQ0csSUFBSSxFQUFFLEdBQUcsRUFBUyxDQUFDO1FBRW5CLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLE1BQU0sQ0FBQyxDQUN4QixDQUFDO1lBQ0csRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFmRCxrQ0FlQzs7OztBQy9IRCx5Q0FBd0M7QUFHeEMsdUNBQXNDO0FBQ3RDLHFDQUFvQztBQUNwQyxnQ0FBa0M7QUFHbEM7O0dBRUc7QUFDSDtJQTZNSSxtQkFBb0IsTUFBVTtRQUUxQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBOU1EOzs7Ozs7O09BT0c7SUFDVyxnQkFBTSxHQUFwQixVQUFxQixLQUFlLEVBQUUsUUFBaUI7UUFFbkQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEVBQUQsQ0FBQyxDQUFDLENBQUM7UUFFdkMsSUFBSSxLQUFLLEdBQUcsRUFBZ0IsQ0FBQztRQUM3QixJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ2pELElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFFakQsR0FBRyxDQUFDLENBQVUsVUFBVyxFQUFYLEtBQUEsS0FBSyxDQUFDLEtBQUssRUFBWCxjQUFXLEVBQVgsSUFBVztZQUFwQixJQUFJLENBQUMsU0FBQTtZQUVOLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZixRQUFRLENBQUM7WUFFYixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWQsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7U0FDcEM7UUFFRCxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXhDLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQztZQUNqQixHQUFHLEVBQUUsR0FBRztZQUNSLEdBQUcsRUFBRSxHQUFHO1lBQ1IsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFO1lBQ2QsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFO1lBQ2YsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUM3QixLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU07U0FDdEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDVyxpQkFBTyxHQUFyQixVQUFzQixLQUFlLEVBQUUsSUFBVSxFQUFFLEVBQVEsRUFBRSxXQUEyQjtRQUEzQiw0QkFBQSxFQUFBLG1CQUEyQjtRQUVwRix1QkFBdUI7UUFDdkIsSUFBSSxFQUFFLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBSSxFQUFFLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakYsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQ2hCLENBQUM7WUFDRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBSSxJQUFJLEdBQUcsV0FBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsSUFBSSxPQUFPLEdBQUcsRUFBZ0IsQ0FBQztRQUUvQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUMzQyxDQUFDO1lBQ0csR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDM0MsQ0FBQztnQkFDRyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ1QsQ0FBQztvQkFDRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2QixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ1csZ0JBQU0sR0FBcEIsVUFBcUIsS0FBZSxFQUFFLEtBQVk7UUFFMUMsSUFBQSxxQkFBNkIsRUFBNUIsWUFBSSxFQUFFLFVBQUUsQ0FBcUI7UUFDbEMsSUFBSSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTdDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ1IsQ0FBQztZQUNHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FDZixDQUFDO2dCQUNHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNMLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksTUFBTSxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV6QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDM0IsQ0FBQztnQkFDRyxJQUFJLFVBQVUsR0FBRyxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxhQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNXLGVBQUssR0FBbkI7UUFFSSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUM7WUFDakIsR0FBRyxFQUFFLEVBQUU7WUFDUCxHQUFHLEVBQUUsRUFBRTtZQUNQLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLEVBQUUsQ0FBQztZQUNULEtBQUssRUFBRSxDQUFDO1NBQ1gsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVjLHdCQUFjLEdBQTdCLFVBQThCLEtBQWUsRUFBRSxLQUFnQjtRQUUzRCxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ2pELElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFFakQsR0FBRyxDQUFDLENBQVUsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7WUFBZCxJQUFJLENBQUMsY0FBQTtZQUVOLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2pDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2pDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2pDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQ3BDO1FBRUQsSUFBSSxHQUFjLENBQUM7UUFDbkIsSUFBSSxHQUFjLENBQUM7UUFFbkIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FDckIsQ0FBQztZQUNHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNCLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsSUFBSSxDQUNKLENBQUM7WUFDRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUN0QixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDO1lBQ2pCLEdBQUcsRUFBRSxHQUFHO1lBQ1IsR0FBRyxFQUFFLEdBQUc7WUFDUixLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUU7WUFDZCxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUU7WUFDZixNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQzdCLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTTtTQUN0QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBdUNEOztPQUVHO0lBQ0ksNEJBQVEsR0FBZixVQUFnQixPQUFjO1FBRTFCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUNoQixDQUFDO1lBQ0csSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksd0JBQUksR0FBWDtRQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxHQUFHLEVBQUwsQ0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0F0T0EsQUFzT0MsSUFBQTtBQXRPWSw4QkFBUztBQXdPdEIsa0JBQWtCLENBQVUsRUFBRSxDQUFVO0lBRXBDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDeEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUNaLENBQUM7UUFDRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQzVCLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQUVELGtCQUFrQixDQUFVLEVBQUUsQ0FBVTtJQUVwQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFVixDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ3hCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDWixDQUFDO1FBQ0csQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRCwwQkFBMEIsS0FBZSxFQUFFLEtBQVk7SUFFbkQsSUFBTSxVQUFVLEdBQUcsc0JBQXNCLENBQUM7SUFFMUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDekIsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVwQyxJQUFJLE1BQU0sR0FBRyxlQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUN2QyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXJDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDOzs7Ozs7Ozs7Ozs7O0FDeFJELDRDQUEyQztBQUUzQyxtQ0FBcUM7QUFDckMsd0RBQTZEO0FBZ0I3RDs7R0FFRztBQUVIO0lBZ0NJOzs7O09BSUc7SUFDSCx5QkFBWSxNQUE0QjtRQUVwQyxNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUV6RixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBN0NRLGVBQWU7UUFEM0Isd0JBQVEsQ0FBQyxJQUFJLENBQUM7O09BQ0YsZUFBZSxDQThDM0I7SUFBRCxzQkFBQztDQTlDRCxBQThDQyxJQUFBO0FBOUNZLDBDQUFlO0FBZ0Q1QixjQUFjLEdBQTRCLEVBQUUsTUFBVTtJQUVsRCxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNsQixJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUUxQyxHQUFHLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztJQUN4QixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXBELEdBQUcsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQzlCLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEQsR0FBRyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7SUFDeEIsR0FBRyxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFDNUIsR0FBRyxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQztJQUM3QixHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDOzs7O0FDbkZEOztHQUVHO0FBQ0g7SUFhSTs7Ozs7T0FLRztJQUNILDJCQUFZLEdBQVUsRUFBRSxLQUFrQjtRQUFsQixzQkFBQSxFQUFBLFdBQWtCO1FBRXRDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0F4QkEsQUF3QkMsSUFBQTtBQXhCWSw4Q0FBaUI7Ozs7QUNEOUIsbUNBQW9DO0FBQ3BDLHFEQUFvRDtBQUdwRDs7R0FFRztBQUNIO0lBdURJOzs7Ozs7T0FNRztJQUNILDBCQUFZLEtBQWdCLEVBQUUsT0FBb0IsRUFBRSxJQUFjO1FBRTlELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBbkVEOzs7OztPQUtHO0lBQ1csb0JBQUcsR0FBakIsVUFBa0IsSUFBVyxFQUFFLElBQVc7UUFFdEMsSUFBSSxLQUFLLEdBQUcsRUFBZ0IsQ0FBQztRQUU3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFDN0IsQ0FBQztZQUNHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUM3QixDQUFDO2dCQUNHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxpQ0FBZSxDQUFDO29CQUMzQixNQUFNLEVBQUUsQ0FBQztvQkFDVCxNQUFNLEVBQUUsQ0FBQztvQkFDVCxLQUFLLEVBQUUsRUFBRTtpQkFDWixDQUFDLENBQUMsQ0FBQztZQUNSLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNXLHNCQUFLLEdBQW5CO1FBRUksTUFBTSxDQUFDLElBQUksZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBb0NEOzs7O09BSUc7SUFDSSxtQ0FBUSxHQUFmLFVBQWdCLEdBQVU7UUFFdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLDJDQUFnQixHQUF2QixVQUF3QixHQUFVLEVBQUUsTUFBWTtRQUU1QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFakMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLHFDQUFVLEdBQWpCLFVBQWtCLEdBQVUsRUFBRSxHQUFVO1FBRXBDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ2pELENBQUM7SUFFRDs7T0FFRztJQUNJLGtDQUFPLEdBQWQ7UUFFVSxJQUFBLGtCQUFLLENBQVU7UUFFckIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxHQUFHLEVBQUwsQ0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFakIsR0FBRyxDQUFDLENBQWEsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7WUFBakIsSUFBSSxJQUFJLGNBQUE7WUFFVCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQ3hDLENBQUM7Z0JBQ0csR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUN4QyxDQUFDO29CQUNHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztvQkFFekIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ2xELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNYLENBQUM7d0JBQ0csT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMxRCxDQUFDO29CQUVELEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLENBQUM7WUFDTCxDQUFDO1NBQ0o7SUFDTCxDQUFDO0lBQ0wsdUJBQUM7QUFBRCxDQXpJQSxBQXlJQyxJQUFBO0FBeklZLDRDQUFnQjs7OztBQ1Q3Qjs7R0FFRztBQUNIO0lBYUk7Ozs7O09BS0c7SUFDSCx3QkFBWSxHQUFVLEVBQUUsTUFBa0I7UUFBbEIsdUJBQUEsRUFBQSxXQUFrQjtRQUV0QyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFDTCxxQkFBQztBQUFELENBeEJBLEFBd0JDLElBQUE7QUF4Qlksd0NBQWM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTjNCLHdDQUF5QztBQUd6QztJQUVJLE1BQU0sQ0FBQyxVQUFTLElBQVcsRUFBRSxHQUFVO1FBRW5DLElBQUksRUFBRSxHQUFHLE9BQUssR0FBSyxDQUFDO1FBRXBCLE1BQU0sQ0FBQztZQUNILFVBQVUsRUFBRSxJQUFJO1lBQ2hCLEdBQUcsRUFBRTtnQkFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsR0FBRyxFQUFFLFVBQVMsR0FBTztnQkFFakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNuQixDQUFDO1NBQ0osQ0FBQztJQUNOLENBQUMsQ0FBQztBQUNOLENBQUM7QUFsQkQsMEJBa0JDO0FBRUQ7SUFJSSxtQkFBWSxNQUFTLEVBQUUsTUFBVztRQUU5QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUM7UUFDN0IsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQ1gsQ0FBQztZQUNHLGFBQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekIsQ0FBQztJQUNMLENBQUM7SUFDTCxnQkFBQztBQUFELENBWkEsQUFZQyxJQUFBO0FBWlksOEJBQVM7QUF1QnRCO0lBQTJCLHlCQUFnQjtJQUEzQzs7SUFhQSxDQUFDO0lBVkc7UUFEQyxPQUFPLEVBQUU7OzhDQUNnQjtJQUcxQjtRQURDLE9BQU8sRUFBRTs7NENBQ2M7SUFHeEI7UUFEQyxPQUFPLEVBQUU7OzRDQUNzQjtJQUdoQztRQURDLE9BQU8sRUFBRTtrQ0FDRSxTQUFTO3VDQUFDO0lBQzFCLFlBQUM7Q0FiRCxBQWFDLENBYjBCLFNBQVMsR0FhbkM7QUFiWSxzQkFBSztBQWVsQjtJQUErQiw2QkFBb0I7SUFBbkQ7O0lBZ0NBLENBQUM7SUE5QmlCLGlCQUFPLEdBQWEsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO1FBQ2xELFNBQVMsRUFBRSxNQUFNO1FBQ2pCLEtBQUssRUFBRSxPQUFPO1FBQ2QsSUFBSSxFQUFFLFVBQVU7UUFDaEIsSUFBSSxFQUFFLEVBQUU7UUFDUixLQUFLLEVBQUUsUUFBUTtRQUNmLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUMsQ0FBQztJQUdIO1FBREMsT0FBTyxFQUFFOztnREFDcUI7SUFHL0I7UUFEQyxPQUFPLEVBQUU7OzRDQUNVO0lBR3BCO1FBREMsT0FBTyxFQUFFOzsyQ0FDUztJQUduQjtRQURDLE9BQU8sRUFBRTs7MkNBQ1M7SUFHbkI7UUFEQyxPQUFPLEVBQUU7OzRDQUNVO0lBR3BCO1FBREMsT0FBTyxFQUFFOzs4Q0FDWTtJQUd0QjtRQURDLE9BQU8sRUFBRTs7NkNBQ1c7SUFDekIsZ0JBQUM7Q0FoQ0QsQUFnQ0MsQ0FoQzhCLFNBQVMsR0FnQ3ZDO0FBaENZLDhCQUFTO0FBa0NULFFBQUEsU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtJQUNyQyxXQUFXLEVBQUUsV0FBVztJQUN4QixTQUFTLEVBQUUsT0FBTztJQUNsQixTQUFTLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEVBQUQsQ0FBQztJQUNqQixJQUFJLEVBQUUsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO1FBQ3RCLFNBQVMsRUFBRSxNQUFNO1FBQ2pCLEtBQUssRUFBRSxPQUFPO1FBQ2QsSUFBSSxFQUFFLFVBQVU7UUFDaEIsSUFBSSxFQUFFLEVBQUU7UUFDUixLQUFLLEVBQUUsUUFBUTtRQUNmLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUM7Q0FDTCxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDNUdILDhEQUFvRjtBQUNwRixpQ0FBMkM7QUFDM0Msd0RBQTZEO0FBQzdELDBDQUFvRDtBQWFwRDtJQUFvQyxrQ0FBZTtJQVEvQzs7OztPQUlHO0lBQ0gsd0JBQVksTUFBMkI7UUFBdkMsWUFFSSxrQkFBTSxNQUFNLENBQUMsU0FJaEI7UUFoQk0sV0FBSyxHQUFTLGlCQUFTLENBQUM7UUFHeEIsaUJBQVcsR0FBVSxFQUFFLENBQUM7UUFXM0IsS0FBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztRQUM1QyxLQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksaUJBQVMsQ0FBQzs7SUFDM0MsQ0FBQztJQWhCRDtRQURDLHlCQUFTLEVBQUU7a0NBQ0MsYUFBSztpREFBYTtJQUcvQjtRQURDLHlCQUFTLEVBQUU7O3VEQUNtQjtJQU50QixjQUFjO1FBRDFCLHdCQUFRLENBQUMsSUFBSSxDQUFDOztPQUNGLGNBQWMsQ0FvQjFCO0lBQUQscUJBQUM7Q0FwQkQsQUFvQkMsQ0FwQm1DLGlDQUFlLEdBb0JsRDtBQXBCWSx3Q0FBYztBQXNCM0IsY0FBYyxHQUE0QixFQUFFLE1BQVU7SUFFbEQsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQWMsQ0FBQztJQUVsQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNsQixJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUUxQyxHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDaEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVwRCxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDcEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0RCxJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQWMsQ0FBQztJQUMxRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FDdEMsQ0FBQztRQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLE9BQU8sQ0FBQyxDQUNyQyxDQUFDO1FBQ0csTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsR0FBRyxDQUFDLElBQUksR0FBTSxLQUFLLENBQUMsSUFBSSxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxTQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTSxDQUFDO0lBQzlHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDckMsR0FBRyxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFDNUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNqQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xHLENBQUM7Ozs7QUM1Q0Q7Ozs7OztHQU1HO0FBQ0gsaUJBQXdCLElBQVk7SUFFaEMsTUFBTSxDQUFDLFVBQVMsSUFBVyxFQUFFLEdBQVUsRUFBRSxVQUE0QztRQUVqRixJQUFNLEdBQUcsR0FBRyxlQUFlLENBQUM7UUFFNUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDVixDQUFDO1lBQ0csT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUM7WUFDTixJQUFJLEVBQUUsSUFBSSxJQUFJLEdBQUc7WUFDakIsR0FBRyxFQUFFLEdBQUc7WUFDUixJQUFJLEVBQUUsVUFBVSxDQUFDLEtBQUs7U0FDekIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQWxCRCwwQkFrQkM7QUFHRDs7Ozs7O0dBTUc7QUFDSCxrQkFBeUIsSUFBYTtJQUVsQyxNQUFNLENBQUMsVUFBUyxJQUFRO1FBRXBCLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztBQUNOLENBQUM7QUFORCw0QkFNQztBQUdEOzs7Ozs7R0FNRztBQUNILGlCQUF3QixJQUFZO0lBRWhDLE1BQU0sQ0FBQyxVQUFTLElBQVcsRUFBRSxHQUFVLEVBQUUsVUFBNEM7UUFFakYsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUMvQixJQUFJLE9BQU8sR0FBRztZQUVWLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBZSxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDO1FBRUYsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzlCLENBQUMsQ0FBQztBQUNOLENBQUM7QUFiRCwwQkFhQztBQVdELGtCQUF5QixJQUFtQixFQUFFLE9BQWdCO0lBRTFELEVBQUUsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FDL0IsQ0FBQztRQUNHLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQWUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxNQUFNLENBQUMsVUFBUyxJQUFXLEVBQUUsR0FBVTtRQUVuQyxJQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQztRQUU3QixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNWLENBQUM7WUFDRyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNOLElBQUksRUFBRSxJQUFJLElBQUksR0FBRztZQUNqQixHQUFHLEVBQUUsR0FBRztZQUNSLE9BQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztRQUVILDhDQUE4QztRQUM5QywrQkFBK0I7UUFDL0IsRUFBRTtRQUNGLDRDQUE0QztRQUM1QywwQkFBMEI7UUFDMUIsdUJBQXVCO1FBQ3ZCLG9EQUFvRDtRQUNwRCwyREFBMkQ7UUFDM0QsS0FBSztJQUNULENBQUMsQ0FBQztBQUNOLENBQUM7QUFqQ0QsNEJBaUNDO0FBRUQ7Ozs7OztHQU1HO0FBQ0g7SUFFSSxNQUFNLENBQUMsVUFBUyxJQUFXLEVBQUUsR0FBVTtRQUVuQyxJQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQztRQUU3QixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNWLENBQUM7WUFDRyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVmLElBQUksRUFBRSxHQUFHLE9BQUssR0FBSyxDQUFDO1FBRXBCLE1BQU0sQ0FBQztZQUNILEdBQUcsRUFBRTtnQkFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFDRCxHQUFHLEVBQUUsVUFBUyxHQUFPO2dCQUVqQixJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNmLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDM0IsQ0FBQztTQUNKLENBQUE7SUFDTCxDQUFDLENBQUM7QUFDTixDQUFDO0FBNUJELDhCQTRCQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2S0QsNkNBQThEO0FBQzlELDJDQUEwQztBQUcxQyxzRUFBcUU7QUFDckUsd0RBQTJEO0FBQzNELDJDQUEwQztBQUcxQyxnREFBK0M7QUFDL0Msb0RBQW1EO0FBRW5ELHFDQUE4QztBQUM5Qyx1Q0FBaUQ7QUFDakQsNkNBQTRDO0FBRTVDLGdDQUFrQztBQW1DbEM7SUFBaUMsK0JBQWdCO0lBa0Q3QyxxQkFBNEIsTUFBd0I7UUFBcEQsWUFFSSxpQkFBTyxTQWFWO1FBZjJCLFlBQU0sR0FBTixNQUFNLENBQWtCO1FBTjVDLFdBQUssR0FBVyxLQUFLLENBQUM7UUFFdEIsYUFBTyxHQUFxQixFQUFFLENBQUM7UUFDL0IsYUFBTyxHQUFxQixFQUFFLENBQUM7UUFPbkMsS0FBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDbkIsS0FBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBRXRDLElBQUksTUFBTSxHQUFHLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx1QkFBVSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUM7UUFFaEUsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDO2FBQy9ILE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO1FBQzdDLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUM7YUFDM0IsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBdkIsQ0FBdUIsQ0FBQyxDQUFDO1FBRTNDLEtBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDOztJQUNqQyxDQUFDO0lBL0RhLGtCQUFNLEdBQXBCLFVBQXFCLE1BQWtCLEVBQUUsWUFBdUI7UUFFNUQsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUVsQyxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxNQUFNLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDdEIsTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUM7UUFFdkMsTUFBTSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDakIsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUzQixFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUNqRSxDQUFDO1lBQ0csTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFJLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLFlBQVksSUFBSSxtQ0FBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVaLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQTBDRCxzQkFBVyw4QkFBSzthQUFoQjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQUVELHNCQUFXLCtCQUFNO2FBQWpCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ2xDLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsbUNBQVU7YUFBckI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3RDLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsb0NBQVc7YUFBdEI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ25DLENBQUM7OztPQUFBO0lBRUQsc0JBQVcscUNBQVk7YUFBdkI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDN0IsQ0FBQzs7O09BQUE7SUFFRCxzQkFBVyxzQ0FBYTthQUF4QjtZQUVJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM5QixDQUFDOzs7T0FBQTtJQUVELHNCQUFXLG1DQUFVO2FBQXJCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsa0NBQVM7YUFBcEI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDekIsQ0FBQzs7O09BQUE7SUFFTSw0QkFBTSxHQUFiLFVBQWMsR0FBOEI7UUFFeEMsRUFBRSxDQUFDLENBQUMsT0FBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUMvQixDQUFDO1lBQ0csR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUNELElBQUksQ0FDSixDQUFDO1lBQ0csSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFekIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUNiLENBQUM7Z0JBQ0csR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sMEJBQUksR0FBWCxVQUFZLE9BQWM7UUFBRSxjQUFhO2FBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtZQUFiLDZCQUFhOztRQUVyQyxDQUFBLEtBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUEsQ0FBQyxJQUFJLFlBQUMsT0FBTyxTQUFLLElBQUksR0FBRTs7SUFDaEQsQ0FBQztJQUVNLHlCQUFHLEdBQVYsVUFBVyxRQUFlO1FBRXRCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0seUJBQUcsR0FBVixVQUFXLFFBQWUsRUFBRSxLQUFTO1FBRWpDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLG9DQUFjLEdBQXJCO1FBRUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sMkJBQUssR0FBWjtRQUVJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVNLHdDQUFrQixHQUF6QixVQUEwQixFQUFZO1FBRWxDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksV0FBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQ2hCLENBQUM7WUFDRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLHdDQUFrQixHQUF6QixVQUEwQixFQUFZO1FBRWxDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0QyxJQUFJLEdBQUcsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUVuRCxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSx3Q0FBa0IsR0FBekIsVUFBMEIsSUFBYTtRQUF2QyxpQkFJQztRQUZHLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQXRCLENBQXNCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRU0sd0NBQWtCLEdBQXpCLFVBQTBCLElBQWE7UUFFbkMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3RDLElBQUksR0FBRyxHQUFHLFdBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXpELE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLHFDQUFlLEdBQXRCLFVBQXVCLEdBQVU7UUFFN0IsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsV0FBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkQsQ0FBQztJQUVNLHFDQUFlLEdBQXRCLFVBQXVCLEdBQVU7UUFFN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVyQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDVCxDQUFDO1lBQ0csSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSw4QkFBUSxHQUFmLFVBQWdCLFFBQTJCO1FBRXZDLElBQUksSUFBUyxDQUFDO1FBRWQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFNBQVMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQ3hFLENBQUM7WUFDRyxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUNELElBQUksQ0FDSixDQUFDO1lBQ0csSUFBSSxHQUFHLFdBQUksQ0FBQyxRQUFRLENBQUMsUUFBb0IsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLFNBQVMsR0FBRztZQUNaLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNuQixDQUFDO1FBRUYsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FDbEIsQ0FBQztZQUNHLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztRQUM3QixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQzVCLENBQUM7WUFDRyxTQUFTLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMzQyxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FDakIsQ0FBQztZQUNHLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUM1QixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQzlCLENBQUM7WUFDRyxTQUFTLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM3QyxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUNuQyxDQUFDO1lBQ0csSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDTCxDQUFDO0lBRU0sMEJBQUksR0FBWDtRQUVJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVsQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVNLGdDQUFVLEdBQWpCLFVBQWtCLEtBQW1CO1FBQW5CLHNCQUFBLEVBQUEsWUFBbUI7UUFFakMsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsdUJBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUNaLENBQUM7WUFDRyxJQUFJLEtBQUssR0FBRyxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELEdBQUcsQ0FBQyxDQUFhLFVBQVMsRUFBVCxLQUFBLEtBQUssQ0FBQyxHQUFHLEVBQVQsY0FBUyxFQUFULElBQVM7Z0JBQXJCLElBQUksSUFBSSxTQUFBO2dCQUNULE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2pDO1FBQ0wsQ0FBQztRQUNELElBQUksQ0FDSixDQUFDO1lBQ0csSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVNLDRCQUFNLEdBQWIsVUFBYyxjQUE4QjtRQUE5QiwrQkFBQSxFQUFBLHNCQUE4QjtRQUV4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FDaEIsQ0FBQztZQUNHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQTRCLGNBQWMsTUFBRyxDQUFDLENBQUM7WUFFNUQsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQ25CLENBQUM7Z0JBQ0csSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBQ0QsSUFBSSxDQUNKLENBQUM7Z0JBQ0cscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRU8sMEJBQUksR0FBWixVQUFhLE1BQWM7UUFFdkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ1osTUFBTSxDQUFDO1FBRVgsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixPQUFPLENBQUMsT0FBTyxDQUFDLDhCQUE0QixNQUFNLE1BQUcsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVPLDBDQUFvQixHQUE1QjtRQUVRLElBQUEsU0FBK0IsRUFBN0IsOEJBQVksRUFBRSxrQkFBTSxDQUFVO1FBRXBDLElBQUksSUFBSSxHQUFHLFVBQUMsQ0FBUSxFQUFFLENBQVEsRUFBRSxDQUFRLEVBQUUsQ0FBUSxFQUFFLEVBQVMsRUFBRSxFQUFTLElBQUssT0FBQSxDQUFDO1lBQzFFLElBQUksRUFBRSxDQUFDO1lBQ1AsR0FBRyxFQUFFLENBQUM7WUFDTixLQUFLLEVBQUUsQ0FBQztZQUNSLE1BQU0sRUFBRSxDQUFDO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxTQUFTLEVBQUUsRUFBRTtTQUNoQixDQUFDLEVBUDJFLENBTzNFLENBQUM7UUFFSCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFdEMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDckMsQ0FBQztZQUNHLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ3hGLENBQUM7UUFDRCxJQUFJLENBQ0osQ0FBQztZQUNHLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNsRSxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQy9ELElBQUksTUFBTSxHQUFHLElBQUksYUFBSyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUU5QyxtQ0FBbUM7WUFDbkMsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDO1lBQ2xCLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQztZQUVoQixNQUFNLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDL0IsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRU8scUNBQWUsR0FBdkI7UUFFSSxNQUFNLENBQUMsSUFBSSxXQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwSCxDQUFDO0lBRU8sbUNBQWEsR0FBckI7UUFFSSxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFFdEMsSUFBQSxTQUF3QixFQUF0QixnQkFBSyxFQUFFLGtCQUFNLENBQVU7UUFDN0IsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUMsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMzQixJQUFJLFNBQVMsR0FBRyxFQUFrQixDQUFDO1FBRW5DLDRGQUE0RjtRQUM1RixFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FDdkQsQ0FBQztZQUNHLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDekMsQ0FBQztZQUNHLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixJQUFJLE1BQU0sR0FBZTtnQkFDckIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLE9BQU8sRUFBRSxFQUFFO2FBQ2QsQ0FBQztZQUVGLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztpQkFDM0MsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO1lBRXJDLEdBQUcsQ0FBQyxDQUFhLFVBQVMsRUFBVCx1QkFBUyxFQUFULHVCQUFTLEVBQVQsSUFBUztnQkFBckIsSUFBSSxJQUFJLGtCQUFBO2dCQUVULElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFFaEUsa0ZBQWtGO2dCQUNsRixFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUN4RSxDQUFDO29CQUNHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUMzRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUU5QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUM1QixDQUFDO2dCQUVELElBQUksQ0FDSixDQUFDO29CQUNHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQztnQkFDdEMsQ0FBQzthQUNKO1lBRUQsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFFdkIsT0FBTyxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFTyxpQ0FBVyxHQUFuQjtRQUVRLElBQUEsU0FBK0IsRUFBN0Isa0JBQU0sRUFBRSxnQkFBSyxFQUFFLGdCQUFLLENBQVU7UUFFcEMsT0FBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBRXhDLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUE2QixDQUFDO1FBQy9FLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRCxHQUFHLENBQUMsQ0FBZSxVQUFLLEVBQUwsZUFBSyxFQUFMLG1CQUFLLEVBQUwsSUFBSztZQUFuQixJQUFJLE1BQU0sY0FBQTtZQUVYLElBQUksSUFBSSxHQUFHLFdBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXRDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3RCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUM5QixDQUFDO2dCQUNHLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlCLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRWhDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQzVDLENBQUM7b0JBQ0csUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQzdCLENBQUM7b0JBQ0csUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRXBDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQ1osQ0FBQztvQkFDRyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakYsMkNBQTJDO29CQUMzQyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFFeEUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUVELEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEcsQ0FBQztZQUVELEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNqQjtRQUVELE9BQU8sQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRU8sa0NBQVksR0FBcEIsVUFBcUIsS0FBWSxFQUFFLE1BQWE7UUFFNUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVPLGtDQUFZLEdBQXBCLFVBQXFCLElBQVEsRUFBRSxNQUFlO1FBRTFDLElBQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFcEcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFhLENBQUM7UUFDbEcsR0FBRyxDQUFDLENBQVUsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7WUFBZCxJQUFJLENBQUMsY0FBQTtZQUVOLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FDNUIsQ0FBQztnQkFDRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFDRCxJQUFJLENBQ0osQ0FBQztnQkFDRyxPQUFPLENBQUMsS0FBSyxDQUFDLHNDQUFvQyxDQUFDLGlCQUFZLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxNQUFHLENBQUMsQ0FBQztZQUM3RixDQUFDO1NBQ0o7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFTyx1Q0FBaUIsR0FBekIsVUFBMEIsS0FBWTtRQUF0QyxpQkFjQztRQVpHLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFVBQUMsRUFBYTtZQUU5QyxJQUFJLEVBQUUsR0FBRyxJQUFJLGFBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxJQUFJLElBQUksR0FBRyxLQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdkMsSUFBSSxFQUFFLEdBQVEsRUFBRSxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQztZQUN2QixFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEIsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhCLEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLHFDQUFlLEdBQXZCLFVBQXdCLEtBQVk7UUFBcEMsaUJBTUM7UUFKRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxVQUFDLEVBQWdCO1lBRWpELEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFxQixFQUFFLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTywyQ0FBcUIsR0FBN0I7UUFBQSxpQkF1QkM7UUFyQkcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsVUFBQyxDQUFnQjtZQUVsQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FDM0IsQ0FBQztnQkFDRyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsT0FBTyxDQUFDLENBQ2pCLENBQUM7b0JBQ0csSUFBSSxNQUFNLEdBQUcsS0FBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQVEsQ0FBQztvQkFDN0QsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFJLENBQUMsT0FBTyxDQUFDO29CQUMzQixLQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFFRCxLQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRXRCLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FDakIsQ0FBQztvQkFDRyxJQUFJLE1BQU0sR0FBRyxLQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBUSxDQUFDO29CQUM5RCxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUksQ0FBQyxPQUFPLENBQUM7b0JBQzNCLEtBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLDBDQUFvQixHQUE1QixVQUE2QixJQUFXLEVBQUUsTUFBcUI7UUFFM0QsSUFBSSxLQUFLLEdBQVEsQ0FBQyxxQ0FBMEIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1RCxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDekIsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUEvZkQ7UUFEQyxtQkFBUSxDQUFDLG1DQUFnQixDQUFDLEtBQUssRUFBRSxFQUFFLFVBQUEsQ0FBQyxJQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7OENBQy9EO0lBR3ZCO1FBREMsbUJBQVEsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQWQsQ0FBYyxDQUFDO2tDQUMzQixhQUFLO3FEQUFDO0lBRzFCO1FBREMsbUJBQVEsQ0FBQyxpQkFBTyxDQUFDLEtBQUssRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBZCxDQUFjLENBQUM7a0NBQzlCLGlCQUFPO2dEQUFDO0lBR3ZCO1FBREMsbUJBQVEsQ0FBQyxhQUFLLENBQUMsS0FBSyxFQUFFLFVBQUEsQ0FBQyxJQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7a0NBQ2hELGFBQUs7K0NBQUM7SUF1ZnhCLGtCQUFDO0NBNWhCRCxBQTRoQkMsQ0E1aEJnQywrQkFBZ0IsR0E0aEJoRDtBQTVoQlksa0NBQVc7QUEwaUJ4QixlQUFlLENBQUs7SUFFaEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNyQixDQUFDO1FBQ0csTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUNELElBQUksQ0FDSixDQUFDO1FBQ0csTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztBQUNMLENBQUM7QUFFRDtJQUtJLGdCQUFtQixLQUFZLEVBQVMsTUFBYSxFQUFTLFNBQWdCO1FBQTNELFVBQUssR0FBTCxLQUFLLENBQU87UUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFPO1FBQVMsY0FBUyxHQUFULFNBQVMsQ0FBTztRQUUxRSxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBNkIsQ0FBQztRQUN0RixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQWJBLEFBYUMsSUFBQTtBQUVEO0lBRUksZ0JBQW1CLEdBQVUsRUFDVixLQUFZLEVBQ1osSUFBVyxFQUNYLEdBQVUsRUFDVixLQUFZLEVBQ1osTUFBYTtRQUxiLFFBQUcsR0FBSCxHQUFHLENBQU87UUFDVixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBQ1osU0FBSSxHQUFKLElBQUksQ0FBTztRQUNYLFFBQUcsR0FBSCxHQUFHLENBQU87UUFDVixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBTztJQUVoQyxDQUFDO0lBRU0sdUJBQU0sR0FBYixVQUFjLE9BQVc7UUFFckIsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLENBQ3RCLENBQUM7WUFDRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ2pDLENBQUM7Z0JBQ0csTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQXZCQSxBQXVCQyxJQUFBOzs7O0FDbmtCRDs7R0FFRztBQUNIO0lBTUksb0JBQW9CLE9BQTZDO1FBQTdDLFlBQU8sR0FBUCxPQUFPLENBQXNDO1FBSmpELGFBQVEsR0FBa0IsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1FBQ3pELGFBQVEsR0FBa0IsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1FBQ3pELGNBQVMsR0FBbUIsSUFBSSx5QkFBeUIsRUFBRSxDQUFDO0lBSTVFLENBQUM7SUFFTSxvQ0FBZSxHQUF0QixVQUF1QixNQUFXO1FBRTlCLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBUyxDQUFDO1FBRTdCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUEyQixDQUFDO1FBQ2hFLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUE0QixDQUFDO1FBRW5FLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUN2QixDQUFDO1lBQ0csTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLENBQ3hCLENBQUM7WUFDRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVNLDRCQUFPLEdBQWQsVUFBZSxHQUFPO1FBRWQsSUFBQSxTQUE4QixFQUE1QixzQkFBUSxFQUFFLHdCQUFTLENBQVU7UUFFbkMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQ3BCLENBQUM7WUFDRyxNQUFNLGdGQUFnRixDQUFDO1FBQzNGLENBQUM7UUFFRCxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRXZCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzRCxHQUFHLENBQUMsQ0FBVSxVQUFJLEVBQUosYUFBSSxFQUFKLGtCQUFJLEVBQUosSUFBSTtZQUFiLElBQUksQ0FBQyxhQUFBO1lBRU4sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFFRCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQ0FDbkQsQ0FBQztZQUVOLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDckIsR0FBRyxFQUFFLENBQUMsY0FBYSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ25ELEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLFVBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVM7YUFDbEYsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQU5ELEdBQUcsQ0FBQyxDQUFVLFVBQUksRUFBSixhQUFJLEVBQUosa0JBQUksRUFBSixJQUFJO1lBQWIsSUFBSSxDQUFDLGFBQUE7b0JBQUQsQ0FBQztTQU1UO0lBQ0wsQ0FBQztJQUNMLGlCQUFDO0FBQUQsQ0F4REEsQUF3REMsSUFBQTtBQXhEWSxnQ0FBVTtBQTBEdkI7SUFBQTtRQUVZLFVBQUssR0FBMEIsRUFBRSxDQUFDO0lBOEI5QyxDQUFDO0lBNUJHOztPQUVHO0lBQ0kseUNBQU0sR0FBYixVQUFjLE9BQWMsRUFBRSxJQUFnQjtRQUUxQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQ3hCLENBQUM7WUFDRyxNQUFNLHdDQUF3QyxHQUFHLE9BQU8sQ0FBQztRQUM3RCxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0ksdUNBQUksR0FBWCxVQUFZLE9BQWM7UUFBRSxjQUFhO2FBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtZQUFiLDZCQUFhOztRQUVyQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNULENBQUM7WUFDRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxDQUNKLENBQUM7WUFDRyxNQUFNLHdCQUF3QixHQUFHLE9BQU8sQ0FBQztRQUM3QyxDQUFDO0lBQ0wsQ0FBQztJQUNMLCtCQUFDO0FBQUQsQ0FoQ0EsQUFnQ0MsSUFBQTtBQUVEO0lBQUE7UUFFWSxVQUFLLEdBQWdDLEVBQUUsQ0FBQztRQUN4QyxjQUFTLEdBQWtDLEVBQUUsQ0FBQztJQW9EMUQsQ0FBQztJQWxERzs7O09BR0c7SUFDSSx1Q0FBSSxHQUFYLFVBQVksT0FBYyxFQUFFLFFBQXdCO1FBRWhELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVNLDJDQUFRLEdBQWYsVUFBZ0IsT0FBYyxFQUFFLFFBQTRCO1FBRXhELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0kseUNBQU0sR0FBYixVQUFjLE9BQWMsRUFBRSxJQUFVLEVBQUUsSUFBYTtRQUVuRCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVUsT0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQzlCLENBQUM7WUFDRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hCLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVMsT0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVPLDhDQUFXLEdBQW5CLFVBQW9CLE9BQWMsRUFBRSxJQUFVO1FBRTFDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ1QsQ0FBQztZQUNHLEdBQUcsQ0FBQyxDQUFhLFVBQUksRUFBSixhQUFJLEVBQUosa0JBQUksRUFBSixJQUFJO2dCQUFoQixJQUFJLElBQUksYUFBQTtnQkFFVCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUMxQjtRQUNMLENBQUM7SUFDTCxDQUFDO0lBQ0wsK0JBQUM7QUFBRCxDQXZEQSxBQXVEQyxJQUFBO0FBRUQ7SUFBQTtRQUVZLFVBQUssR0FBMkIsRUFBRSxDQUFDO0lBbUQvQyxDQUFDO0lBakRHOztPQUVHO0lBQ0ksMENBQU0sR0FBYixVQUFjLFFBQWUsRUFBRSxJQUFpQjtRQUU1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQ3pCLENBQUM7WUFDRyxNQUFNLHlDQUF5QyxHQUFHLFFBQVEsQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksdUNBQUcsR0FBVixVQUFXLFFBQWU7UUFFdEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDVCxDQUFDO1lBQ0csTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRUQsTUFBTSx5QkFBeUIsR0FBRyxRQUFRLENBQUM7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksdUNBQUcsR0FBVixVQUFXLFFBQWUsRUFBRSxLQUFTO1FBRWpDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ1QsQ0FBQztZQUNHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FDYixDQUFDO2dCQUNHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELElBQUksQ0FDSixDQUFDO2dCQUNHLE1BQU0sZ0NBQWdDLEdBQUcsUUFBUSxDQUFDO1lBQ3RELENBQUM7UUFDTCxDQUFDO1FBQ0QsSUFBSSxDQUNKLENBQUM7WUFDRyxNQUFNLHlCQUF5QixHQUFHLFFBQVEsQ0FBQztRQUMvQyxDQUFDO0lBQ0wsQ0FBQztJQUNMLGdDQUFDO0FBQUQsQ0FyREEsQUFxREMsSUFBQTs7OztBQ3pSRCxxQ0FBOEM7QUFDOUMsaUNBQW1DO0FBdUNuQzs7O0dBR0c7QUFDSDtJQUVJLHVCQUFtQixJQUFNO1FBQU4sU0FBSSxHQUFKLElBQUksQ0FBRTtJQUV6QixDQUFDO0lBS0Qsc0JBQVcsbUNBQVE7UUFIbkI7O1dBRUc7YUFDSDtZQUVJLE1BQU0sQ0FBQyxJQUFJLFdBQUksQ0FFWCxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQ2hDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUN6QixDQUFDO1FBQ04sQ0FBQzs7O09BQUE7SUFFRDs7Ozs7T0FLRztJQUNJLDRCQUFJLEdBQVgsVUFBWSxRQUFpQixFQUFFLFFBQXVCO1FBQXZCLHlCQUFBLEVBQUEsZUFBdUI7UUFFbEQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQ2IsQ0FBQztZQUNHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDZixJQUFJLEVBQUssUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLE9BQUk7WUFDOUIsR0FBRyxFQUFLLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFJO1lBQzVCLEtBQUssRUFBSyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsT0FBSTtZQUNoQyxNQUFNLEVBQUssUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE9BQUk7WUFDbEMsUUFBUSxFQUFFLFFBQVE7U0FDckIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksNEJBQUksR0FBWDtRQUVJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNJLDRCQUFJLEdBQVg7UUFFSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDhCQUFNLEdBQWIsVUFBYyxPQUFlO1FBRXpCLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBQ0wsb0JBQUM7QUFBRCxDQW5FQSxBQW1FQyxJQUFBO0FBbkVZLHNDQUFhOzs7O0FDdEIxQjtJQUFBO1FBRVksWUFBTyxHQUFPLEVBQUUsQ0FBQztJQW9DN0IsQ0FBQztJQWxDVSw2QkFBRSxHQUFULFVBQVUsS0FBWSxFQUFFLFFBQXNCO1FBQTlDLGlCQUlDO1FBRkcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBekIsQ0FBeUIsRUFBRSxDQUFDO0lBQ3ZELENBQUM7SUFFTSw4QkFBRyxHQUFWLFVBQVcsS0FBWSxFQUFFLFFBQXNCO1FBRTNDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQ2IsQ0FBQztZQUNHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBRU0sK0JBQUksR0FBWCxVQUFZLEtBQVk7UUFFcEIsNEVBQTRFO1FBQzVFLElBQUk7UUFDSixtQ0FBbUM7UUFDbkMsSUFBSTtRQUxrQixjQUFhO2FBQWIsVUFBYSxFQUFiLHFCQUFhLEVBQWIsSUFBYTtZQUFiLDZCQUFhOztRQU9uQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLEdBQUcsQ0FBQyxDQUFpQixVQUFJLEVBQUosYUFBSSxFQUFKLGtCQUFJLEVBQUosSUFBSTtZQUFwQixJQUFJLFFBQVEsYUFBQTtZQUViLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzlCO0lBQ0wsQ0FBQztJQUVPLDBDQUFlLEdBQXZCLFVBQXdCLEtBQVk7UUFFaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFDTCx1QkFBQztBQUFELENBdENBLEFBc0NDLElBQUE7QUF0Q1ksNENBQWdCOzs7O0FDckI3QiwyRUFBMEU7QUFDMUUscUVBQW9FO0FBS3BFLHdDQUFpRDtBQUNqRCxtQ0FBcUM7QUFVckM7SUE4R0ksb0JBQ0ksS0FBWSxFQUNaLE1BQWEsRUFDYixPQUFrQyxFQUNsQyxJQUErQixFQUMvQixLQUFnQyxFQUNoQyxVQUEyQjtRQUUzQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUVuQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLEdBQUcsRUFBTCxDQUFLLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLEdBQUcsRUFBTCxDQUFLLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLEdBQUcsRUFBTCxDQUFLLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBOUhhLGtCQUFPLEdBQXJCLFVBQXNCLEtBQWUsRUFBRSxPQUFlO1FBRWxELElBQUksU0FBUyxHQUE0QixLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3hHLElBQUksU0FBUyxHQUF5QixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xHLElBQUksVUFBVSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7UUFFaEUsd0NBQXdDO1FBQ3hDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQTFCLENBQTBCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFiLENBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUExQixDQUEwQixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBYixDQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFakcsb0NBQW9DO1FBQ3BDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsRUFBRSxFQUNoQyxDQUFDO1lBQ0csQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsRUFBRSxFQUNoQyxDQUFDO1lBQ0csQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSwrQkFBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQseUNBQXlDO1FBQ3pDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFYLENBQVcsRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ3RGLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFaLENBQVksRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBRXRGLGtEQUFrRDtRQUNsRCxJQUFJLE9BQU8sR0FBOEIsRUFBRSxDQUFDO1FBQzVDLElBQUksT0FBTyxHQUE4QixFQUFFLENBQUM7UUFDNUMsSUFBSSxRQUFRLEdBQThCLEVBQUUsQ0FBQztRQUM3QyxJQUFJLFdBQVcsR0FBRyxFQUE4QixDQUFDO1FBRWpELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDM0IsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQ25DLENBQUM7WUFDRyxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEIsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDVCxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUc7Z0JBQ1osSUFBSSxFQUFFLE9BQU87Z0JBQ2IsR0FBRyxFQUFFLENBQUM7Z0JBQ04sS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO2dCQUNoQixNQUFNLEVBQUUsTUFBTTthQUNqQixDQUFDLENBQUM7WUFFSCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUNuQyxDQUFDO2dCQUNHLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFeEIsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUNiLENBQUM7b0JBQ0csT0FBTyxDQUFDLElBQUksQ0FBQzt3QkFDVCxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUc7d0JBQ1osSUFBSSxFQUFFLENBQUM7d0JBQ1AsR0FBRyxFQUFFLE1BQU07d0JBQ1gsS0FBSyxFQUFFLEtBQUs7d0JBQ1osTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO3FCQUNyQixDQUFDLENBQUM7Z0JBQ1AsQ0FBQztnQkFFRCxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssU0FBUyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FDckUsQ0FBQztvQkFDRyxJQUFJLElBQUksR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDbkMsQ0FBQzt3QkFDRyxJQUFJLE9BQUssR0FBRyxDQUFDLEVBQUUsUUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFFMUIsdUNBQXVDO3dCQUN2QyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEVBQUUsR0FBRyxJQUFJLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUNwRSxDQUFDOzRCQUNHLE9BQUssSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO3dCQUNsQyxDQUFDO3dCQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQ3BFLENBQUM7NEJBQ0csUUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7d0JBQ3BDLENBQUM7d0JBRUQsUUFBUSxDQUFDLElBQUksQ0FBQzs0QkFDVixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7NEJBQ2IsSUFBSSxFQUFFLE9BQU87NEJBQ2IsR0FBRyxFQUFFLE1BQU07NEJBQ1gsS0FBSyxFQUFFLE9BQUs7NEJBQ1osTUFBTSxFQUFFLFFBQU07eUJBQ2pCLENBQUMsQ0FBQzt3QkFFSCxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDakMsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQ3pCLENBQUM7WUFFRCxPQUFPLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakYsQ0FBQztJQWlDTSxnQ0FBVyxHQUFsQixVQUFtQixHQUFVO1FBRXpCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUN6QyxDQUFDO0lBRU0scUNBQWdCLEdBQXZCLFVBQXdCLE9BQWMsRUFBRSxPQUFjO1FBRWxELElBQUksS0FBSyxHQUFHLEVBQWdCLENBQUM7UUFFN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQ3RDLENBQUM7WUFDRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFdBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU0sNkJBQVEsR0FBZixVQUFnQixHQUFVO1FBRXRCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUN0QyxDQUFDO0lBRU0sa0NBQWEsR0FBcEIsVUFBcUIsT0FBYyxFQUFFLE9BQWM7UUFFL0MsSUFBSSxLQUFLLEdBQUcsRUFBZ0IsQ0FBQztRQUU3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFDdEMsQ0FBQztZQUNHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLENBQUMsV0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFdBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFTSw4QkFBUyxHQUFoQixVQUFpQixHQUFVO1FBRXZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUN2QyxDQUFDO0lBRU0sbUNBQWMsR0FBckIsVUFBc0IsTUFBZTtRQUVqQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU87YUFDZCxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxXQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUF6QyxDQUF5QyxDQUFDO2FBQ3RELEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxHQUFHLEVBQUwsQ0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVNLGdDQUFXLEdBQWxCLFVBQW1CLE1BQWU7UUFFOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJO2FBQ1gsTUFBTSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsV0FBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBekMsQ0FBeUMsQ0FBQzthQUN0RCxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsR0FBRyxFQUFMLENBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFTSxpQ0FBWSxHQUFuQixVQUFvQixNQUFlO1FBRS9CLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFVLENBQUM7UUFFaEMsR0FBRyxDQUFDLENBQVUsVUFBSSxFQUFKLGFBQUksRUFBSixrQkFBSSxFQUFKLElBQUk7WUFBYixJQUFJLENBQUMsYUFBQTtZQUVOLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLFFBQVEsQ0FBQztZQUViLEdBQUcsQ0FBQyxDQUFVLFVBQUksRUFBSixhQUFJLEVBQUosa0JBQUksRUFBSixJQUFJO2dCQUFiLElBQUksQ0FBQyxhQUFBO2dCQUVOLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNkLFFBQVEsQ0FBQztnQkFFYixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNoQztTQUNKO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0wsaUJBQUM7QUFBRCxDQTlNQSxBQThNQyxJQUFBO0FBOU1ZLGdDQUFVO0FBZ052Qix5QkFBeUIsS0FBZ0I7SUFFckMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBRVosR0FBRyxDQUFDLENBQWEsVUFBSyxFQUFMLGVBQUssRUFBTCxtQkFBSyxFQUFMLElBQUs7UUFBakIsSUFBSSxJQUFJLGNBQUE7UUFFVCxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQ3hDLENBQUM7WUFDRyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQ3hDLENBQUM7Z0JBQ0csSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUV6QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNYLENBQUM7b0JBQ0csT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO2dCQUVELEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDbEIsQ0FBQztRQUNMLENBQUM7S0FDSjtJQUVELE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDZCxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGJhc2VzLmpzXG4vLyBVdGlsaXR5IGZvciBjb252ZXJ0aW5nIG51bWJlcnMgdG8vZnJvbSBkaWZmZXJlbnQgYmFzZXMvYWxwaGFiZXRzLlxuLy8gU2VlIFJFQURNRS5tZCBmb3IgZGV0YWlscy5cblxudmFyIGJhc2VzID0gKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiAod2luZG93LkJhc2VzID0ge30pKTtcblxuLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbnVtYmVyIGZvciB0aGUgZ2l2ZW4gYWxwaGFiZXQ6XG5iYXNlcy50b0FscGhhYmV0ID0gZnVuY3Rpb24gKG51bSwgYWxwaGFiZXQpIHtcbiAgICB2YXIgYmFzZSA9IGFscGhhYmV0Lmxlbmd0aDtcbiAgICB2YXIgZGlnaXRzID0gW107ICAgIC8vIHRoZXNlIHdpbGwgYmUgaW4gcmV2ZXJzZSBvcmRlciBzaW5jZSBhcnJheXMgYXJlIHN0YWNrc1xuXG4gICAgLy8gZXhlY3V0ZSBhdCBsZWFzdCBvbmNlLCBldmVuIGlmIG51bSBpcyAwLCBzaW5jZSB3ZSBzaG91bGQgcmV0dXJuIHRoZSAnMCc6XG4gICAgZG8ge1xuICAgICAgICBkaWdpdHMucHVzaChudW0gJSBiYXNlKTsgICAgLy8gVE9ETyBoYW5kbGUgbmVnYXRpdmVzIHByb3Blcmx5P1xuICAgICAgICBudW0gPSBNYXRoLmZsb29yKG51bSAvIGJhc2UpO1xuICAgIH0gd2hpbGUgKG51bSA+IDApO1xuXG4gICAgdmFyIGNoYXJzID0gW107XG4gICAgd2hpbGUgKGRpZ2l0cy5sZW5ndGgpIHtcbiAgICAgICAgY2hhcnMucHVzaChhbHBoYWJldFtkaWdpdHMucG9wKCldKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xufTtcblxuLy8gUmV0dXJucyBhbiBpbnRlZ2VyIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBzdHJpbmcgZm9yIHRoZSBnaXZlbiBhbHBoYWJldDpcbmJhc2VzLmZyb21BbHBoYWJldCA9IGZ1bmN0aW9uIChzdHIsIGFscGhhYmV0KSB7XG4gICAgdmFyIGJhc2UgPSBhbHBoYWJldC5sZW5ndGg7XG4gICAgdmFyIHBvcyA9IDA7XG4gICAgdmFyIG51bSA9IDA7XG4gICAgdmFyIGM7XG5cbiAgICB3aGlsZSAoc3RyLmxlbmd0aCkge1xuICAgICAgICBjID0gc3RyW3N0ci5sZW5ndGggLSAxXTtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cigwLCBzdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgIG51bSArPSBNYXRoLnBvdyhiYXNlLCBwb3MpICogYWxwaGFiZXQuaW5kZXhPZihjKTtcbiAgICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bTtcbn07XG5cbi8vIEtub3duIGFscGhhYmV0czpcbmJhc2VzLk5VTUVSQUxTID0gJzAxMjM0NTY3ODknO1xuYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xuYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UgPSBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS50b1VwcGVyQ2FzZSgpO1xuYmFzZXMuS05PV05fQUxQSEFCRVRTID0ge307XG5cbi8vIEVhY2ggb2YgdGhlIG51bWJlciBvbmVzLCBzdGFydGluZyBmcm9tIGJhc2UtMiAoYmFzZS0xIGRvZXNuJ3QgbWFrZSBzZW5zZT8pOlxuZm9yICh2YXIgaSA9IDI7IGkgPD0gMTA7IGkrKykge1xuICAgIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tpXSA9IGJhc2VzLk5VTUVSQUxTLnN1YnN0cigwLCBpKTtcbn1cblxuLy8gTm9kZSdzIG5hdGl2ZSBoZXggaXMgMC05IGZvbGxvd2VkIGJ5ICpsb3dlcmNhc2UqIGEtZiwgc28gd2UnbGwgdGFrZSB0aGF0XG4vLyBhcHByb2FjaCBmb3IgZXZlcnl0aGluZyBmcm9tIGJhc2UtMTEgdG8gYmFzZS0xNjpcbmZvciAodmFyIGkgPSAxMTsgaSA8PSAxNjsgaSsrKSB7XG4gICAgYmFzZXMuS05PV05fQUxQSEFCRVRTW2ldID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRS5zdWJzdHIoMCwgaSAtIDEwKTtcbn1cblxuLy8gV2UgYWxzbyBtb2RlbCBiYXNlLTM2IG9mZiBvZiB0aGF0LCBqdXN0IHVzaW5nIHRoZSBmdWxsIGxldHRlciBhbHBoYWJldDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1szNl0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBBbmQgYmFzZS02MiB3aWxsIGJlIHRoZSB1cHBlcmNhc2UgbGV0dGVycyBhZGRlZDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0U7XG5cbi8vIEZvciBiYXNlLTI2LCB3ZSdsbCBhc3N1bWUgdGhlIHVzZXIgd2FudHMganVzdCB0aGUgbGV0dGVyIGFscGhhYmV0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzI2XSA9IGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFO1xuXG4vLyBXZSdsbCBhbHNvIGFkZCBhIHNpbWlsYXIgYmFzZS01MiwganVzdCBsZXR0ZXJzLCBsb3dlcmNhc2UgdGhlbiB1cHBlcmNhc2U6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbNTJdID0gYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5MRVRURVJTX1VQUEVSQ0FTRTtcblxuLy8gQmFzZS02NCBpcyBhIGZvcm1hbGx5LXNwZWNpZmllZCBhbHBoYWJldCB0aGF0IGhhcyBhIHBhcnRpY3VsYXIgb3JkZXI6XG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCAoYW5kIE5vZGUuanMgZm9sbG93cyB0aGlzIHRvbylcbi8vIFRPRE8gRklYTUUgQnV0IG91ciBjb2RlIGFib3ZlIGRvZXNuJ3QgYWRkIHBhZGRpbmchIERvbid0IHVzZSB0aGlzIHlldC4uLlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzY0XSA9IGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFICsgYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UgKyBiYXNlcy5OVU1FUkFMUyArICcrLyc7XG5cbi8vIEZsaWNrciBhbmQgb3RoZXJzIGFsc28gaGF2ZSBhIGJhc2UtNTggdGhhdCByZW1vdmVzIGNvbmZ1c2luZyBjaGFyYWN0ZXJzLCBidXRcbi8vIHRoZXJlIGlzbid0IGNvbnNlbnN1cyBvbiB0aGUgb3JkZXIgb2YgbG93ZXJjYXNlIHZzLiB1cHBlcmNhc2UuLi4gPS9cbi8vIGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9ncm91cHMvYXBpL2Rpc2N1c3MvNzIxNTc2MTY3MTM3ODYzOTIvXG4vLyBodHRwczovL2VuLmJpdGNvaW4uaXQvd2lraS9CYXNlNThDaGVja19lbmNvZGluZyNCYXNlNThfc3ltYm9sX2NoYXJ0XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZG91Z2FsL2Jhc2U1OC9ibG9iL21hc3Rlci9saWIvYmFzZTU4LnJiXG4vLyBodHRwOi8vaWNvbG9tYS5ibG9nc3BvdC5jb20vMjAxMC8wMy9jcmVhdGUteW91ci1vd24tYml0bHktdXNpbmctYmFzZTU4Lmh0bWxcbi8vIFdlJ2xsIGFyYml0cmFyaWx5IHN0YXkgY29uc2lzdGVudCB3aXRoIHRoZSBhYm92ZSBhbmQgdXNpbmcgbG93ZXJjYXNlIGZpcnN0OlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzU4XSA9IGJhc2VzLktOT1dOX0FMUEhBQkVUU1s2Ml0ucmVwbGFjZSgvWzBPbEldL2csICcnKTtcblxuLy8gQW5kIERvdWdsYXMgQ3JvY2tmb3JkIHNoYXJlZCBhIHNpbWlsYXIgYmFzZS0zMiBmcm9tIGJhc2UtMzY6XG4vLyBodHRwOi8vd3d3LmNyb2NrZm9yZC5jb20vd3JtZy9iYXNlMzIuaHRtbFxuLy8gVW5saWtlIG91ciBiYXNlLTM2LCBoZSBleHBsaWNpdGx5IHNwZWNpZmllcyB1cHBlcmNhc2UgbGV0dGVyc1xuYmFzZXMuS05PV05fQUxQSEFCRVRTWzMyXSA9IGJhc2VzLk5VTUVSQUxTICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0UucmVwbGFjZSgvW0lMT1VdL2csICcnKTtcblxuLy8gQ2xvc3VyZSBoZWxwZXIgZm9yIGNvbnZlbmllbmNlIGFsaWFzZXMgbGlrZSBiYXNlcy50b0Jhc2UzNigpOlxuZnVuY3Rpb24gbWFrZUFsaWFzIChiYXNlLCBhbHBoYWJldCkge1xuICAgIGJhc2VzWyd0b0Jhc2UnICsgYmFzZV0gPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBiYXNlcy50b0FscGhhYmV0KG51bSwgYWxwaGFiZXQpO1xuICAgIH07XG4gICAgYmFzZXNbJ2Zyb21CYXNlJyArIGJhc2VdID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYWxwaGFiZXQpO1xuICAgIH07XG59XG5cbi8vIERvIHRoaXMgZm9yIGFsbCBrbm93biBhbHBoYWJldHM6XG5mb3IgKHZhciBiYXNlIGluIGJhc2VzLktOT1dOX0FMUEhBQkVUUykge1xuICAgIGlmIChiYXNlcy5LTk9XTl9BTFBIQUJFVFMuaGFzT3duUHJvcGVydHkoYmFzZSkpIHtcbiAgICAgICAgbWFrZUFsaWFzKGJhc2UsIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG4gICAgfVxufVxuXG4vLyBBbmQgYSBnZW5lcmljIGFsaWFzIHRvbzpcbmJhc2VzLnRvQmFzZSA9IGZ1bmN0aW9uIChudW0sIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMudG9BbHBoYWJldChudW0sIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG59O1xuXG5iYXNlcy5mcm9tQmFzZSA9IGZ1bmN0aW9uIChzdHIsIGJhc2UpIHtcbiAgICByZXR1cm4gYmFzZXMuZnJvbUFscGhhYmV0KHN0ciwgYmFzZXMuS05PV05fQUxQSEFCRVRTW2Jhc2VdKTtcbn07XG4iLCIvLyAgSW1wb3J0IHN1cHBvcnQgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTM2NzMzNDYvc3VwcG9ydGluZy1ib3RoLWNvbW1vbmpzLWFuZC1hbWRcbihmdW5jdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIpIHsgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7IH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09IFwib2JqZWN0XCIpIHsgZGVmaW5lKGRlZmluaXRpb24pOyB9XG4gICAgZWxzZSB7IHRoaXNbbmFtZV0gPSBkZWZpbml0aW9uKCk7IH1cbn0oXCJjbGlwYm9hcmRcIiwgZnVuY3Rpb24oKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8ICFkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIgY2xpcGJvYXJkID0ge307XG5cbiAgY2xpcGJvYXJkLmNvcHkgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICB2YXIgX2RhdGEgPSBudWxsOyAvLyBNYXAgZnJvbSBkYXRhIHR5cGUgKGUuZy4gXCJ0ZXh0L2h0bWxcIikgdG8gdmFsdWUuXG4gICAgdmFyIF9ib2d1c1NlbGVjdGlvbiA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICAgIF9kYXRhID0gbnVsbDtcbiAgICAgIGlmIChfYm9ndXNTZWxlY3Rpb24pIHtcbiAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgfVxuICAgICAgX2JvZ3VzU2VsZWN0aW9uID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNvcHlcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKF9pbnRlcmNlcHQpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIF9kYXRhKSB7XG4gICAgICAgICAgZS5jbGlwYm9hcmREYXRhLnNldERhdGEoa2V5LCBfZGF0YVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXb3JrYXJvdW5kIGZvciBTYWZhcmk6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTY1MjlcbiAgICBmdW5jdGlvbiBib2d1c1NlbGVjdCgpIHtcbiAgICAgIHZhciBzZWwgPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIC8vIElmIFwibm90aGluZ1wiIGlzIHNlbGVjdGVkLi4uXG4gICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5Q29tbWFuZEVuYWJsZWQoXCJjb3B5XCIpICYmIHNlbC5pc0NvbGxhcHNlZCkge1xuICAgICAgICAvLyAuLi4gdGVtcG9yYXJpbHkgc2VsZWN0IHRoZSBlbnRpcmUgYm9keS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2Ugc2VsZWN0IHRoZSBlbnRpcmUgYm9keSBiZWNhdXNlOlxuICAgICAgICAvLyAtIGl0J3MgZ3VhcmFudGVlZCB0byBleGlzdCxcbiAgICAgICAgLy8gLSBpdCB3b3JrcyAodW5saWtlLCBzYXksIGRvY3VtZW50LmhlYWQsIG9yIHBoYW50b20gZWxlbWVudCB0aGF0IGlzXG4gICAgICAgIC8vICAgbm90IGluc2VydGVkIGludG8gdGhlIERPTSksXG4gICAgICAgIC8vIC0gaXQgZG9lc24ndCBzZWVtIHRvIGZsaWNrZXIgKGR1ZSB0byB0aGUgc3luY2hyb25vdXMgY29weSBldmVudCksIGFuZFxuICAgICAgICAvLyAtIGl0IGF2b2lkcyBtb2RpZnlpbmcgdGhlIERPTSAoY2FuIHRyaWdnZXIgbXV0YXRpb24gb2JzZXJ2ZXJzKS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQmVjYXVzZSB3ZSBjYW4ndCBkbyBwcm9wZXIgZmVhdHVyZSBkZXRlY3Rpb24gKHdlIGFscmVhZHkgY2hlY2tlZFxuICAgICAgICAvLyBkb2N1bWVudC5xdWVyeUNvbW1hbmRFbmFibGVkKFwiY29weVwiKSAsIHdoaWNoIGFjdHVhbGx5IGdpdmVzIGEgZmFsc2VcbiAgICAgICAgLy8gbmVnYXRpdmUgZm9yIEJsaW5rIHdoZW4gbm90aGluZyBpcyBzZWxlY3RlZCkgYW5kIFVBIHNuaWZmaW5nIGlzIG5vdFxuICAgICAgICAvLyByZWxpYWJsZSAoYSBsb3Qgb2YgVUEgc3RyaW5ncyBjb250YWluIFwiU2FmYXJpXCIpLCB0aGlzIHdpbGwgYWxzb1xuICAgICAgICAvLyBoYXBwZW4gZm9yIHNvbWUgYnJvd3NlcnMgb3RoZXIgdGhhbiBTYWZhcmkuIDotKClcbiAgICAgICAgdmFyIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGRvY3VtZW50LmJvZHkpO1xuICAgICAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIF9pbnRlcmNlcHQgPSB0cnVlO1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBfZGF0YSA9IHtcInRleHQvcGxhaW5cIjogZGF0YX07XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICBfZGF0YSA9IHtcInRleHQvaHRtbFwiOiBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpfTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgT2JqZWN0KXtcbiAgICAgICAgICBfZGF0YSA9IGRhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KFwiSW52YWxpZCBkYXRhIHR5cGUuIE11c3QgYmUgc3RyaW5nLCBET00gbm9kZSwgb3IgYW4gb2JqZWN0IG1hcHBpbmcgTUlNRSB0eXBlcyB0byBzdHJpbmdzLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdHJpZ2dlckNvcHkodHJ5Qm9ndXNTZWxlY3QpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiY29weVwiKSkge1xuICAgICAgICAgICAgICAvLyBkb2N1bWVudC5leGVjQ29tbWFuZCBpcyBzeW5jaHJvbm91czogaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC1jbGlwYm9hcmQtYXBpcy0yMDE1MDQyMS8jaW50ZWdyYXRpb24td2l0aC1yaWNoLXRleHQtZWRpdGluZy1hcGlzXG4gICAgICAgICAgICAgIC8vIFNvIHdlIGNhbiBjYWxsIHJlc29sdmUoKSBiYWNrIGhlcmUuXG4gICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGlmICghdHJ5Qm9ndXNTZWxlY3QpIHtcbiAgICAgICAgICAgICAgICBib2d1c1NlbGVjdCgpO1xuICAgICAgICAgICAgICAgIHRyaWdnZXJDb3B5KHRydWUpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY29weS4gUGVyaGFwcyBpdCdzIG5vdCBhdmFpbGFibGUgaW4geW91ciBicm93c2VyP1wiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdHJpZ2dlckNvcHkoZmFsc2UpO1xuXG4gICAgICB9KTtcbiAgICB9O1xuICB9KSgpO1xuXG4gIGNsaXBib2FyZC5wYXN0ZSA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgX2ludGVyY2VwdCA9IGZhbHNlO1xuICAgIHZhciBfcmVzb2x2ZTtcbiAgICB2YXIgX2RhdGFUeXBlO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChfaW50ZXJjZXB0KSB7XG4gICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICAgICAgICBfcmVzb2x2ZSA9IG51bGw7XG4gICAgICAgIHJlc29sdmUoZS5jbGlwYm9hcmREYXRhLmdldERhdGEoX2RhdGFUeXBlKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YVR5cGUpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XG4gICAgICAgIF9yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgX2RhdGFUeXBlID0gZGF0YVR5cGUgfHwgXCJ0ZXh0L3BsYWluXCI7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKCFkb2N1bWVudC5leGVjQ29tbWFuZChcInBhc3RlXCIpKSB7XG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiVW5hYmxlIHRvIHBhc3RlLiBQYXN0aW5nIG9ubHkgd29ya3MgaW4gSW50ZXJuZXQgRXhwbG9yZXIgYXQgdGhlIG1vbWVudC5cIikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGUpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfSkoKTtcblxuICAvLyBIYW5kbGUgSUUgYmVoYXZpb3VyLlxuICBpZiAodHlwZW9mIENsaXBib2FyZEV2ZW50ID09PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2Ygd2luZG93LmNsaXBib2FyZERhdGEgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAvKiEgcHJvbWlzZS1wb2x5ZmlsbCAyLjAuMSAqL1xuICAgIChmdW5jdGlvbihhKXtmdW5jdGlvbiBiKGEsYil7cmV0dXJuIGZ1bmN0aW9uKCl7YS5hcHBseShiLGFyZ3VtZW50cyl9fWZ1bmN0aW9uIGMoYSl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIHRoaXMpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ld1wiKTtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJub3QgYSBmdW5jdGlvblwiKTt0aGlzLl9zdGF0ZT1udWxsLHRoaXMuX3ZhbHVlPW51bGwsdGhpcy5fZGVmZXJyZWRzPVtdLGkoYSxiKGUsdGhpcyksYihmLHRoaXMpKX1mdW5jdGlvbiBkKGEpe3ZhciBiPXRoaXM7cmV0dXJuIG51bGw9PT10aGlzLl9zdGF0ZT92b2lkIHRoaXMuX2RlZmVycmVkcy5wdXNoKGEpOnZvaWQgaihmdW5jdGlvbigpe3ZhciBjPWIuX3N0YXRlP2Eub25GdWxmaWxsZWQ6YS5vblJlamVjdGVkO2lmKG51bGw9PT1jKXJldHVybiB2b2lkKGIuX3N0YXRlP2EucmVzb2x2ZTphLnJlamVjdCkoYi5fdmFsdWUpO3ZhciBkO3RyeXtkPWMoYi5fdmFsdWUpfWNhdGNoKGUpe3JldHVybiB2b2lkIGEucmVqZWN0KGUpfWEucmVzb2x2ZShkKX0pfWZ1bmN0aW9uIGUoYSl7dHJ5e2lmKGE9PT10aGlzKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLlwiKTtpZihhJiYoXCJvYmplY3RcIj09dHlwZW9mIGF8fFwiZnVuY3Rpb25cIj09dHlwZW9mIGEpKXt2YXIgYz1hLnRoZW47aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgYylyZXR1cm4gdm9pZCBpKGIoYyxhKSxiKGUsdGhpcyksYihmLHRoaXMpKX10aGlzLl9zdGF0ZT0hMCx0aGlzLl92YWx1ZT1hLGcuY2FsbCh0aGlzKX1jYXRjaChkKXtmLmNhbGwodGhpcyxkKX19ZnVuY3Rpb24gZihhKXt0aGlzLl9zdGF0ZT0hMSx0aGlzLl92YWx1ZT1hLGcuY2FsbCh0aGlzKX1mdW5jdGlvbiBnKCl7Zm9yKHZhciBhPTAsYj10aGlzLl9kZWZlcnJlZHMubGVuZ3RoO2I+YTthKyspZC5jYWxsKHRoaXMsdGhpcy5fZGVmZXJyZWRzW2FdKTt0aGlzLl9kZWZlcnJlZHM9bnVsbH1mdW5jdGlvbiBoKGEsYixjLGQpe3RoaXMub25GdWxmaWxsZWQ9XCJmdW5jdGlvblwiPT10eXBlb2YgYT9hOm51bGwsdGhpcy5vblJlamVjdGVkPVwiZnVuY3Rpb25cIj09dHlwZW9mIGI/YjpudWxsLHRoaXMucmVzb2x2ZT1jLHRoaXMucmVqZWN0PWR9ZnVuY3Rpb24gaShhLGIsYyl7dmFyIGQ9ITE7dHJ5e2EoZnVuY3Rpb24oYSl7ZHx8KGQ9ITAsYihhKSl9LGZ1bmN0aW9uKGEpe2R8fChkPSEwLGMoYSkpfSl9Y2F0Y2goZSl7aWYoZClyZXR1cm47ZD0hMCxjKGUpfX12YXIgaj1jLmltbWVkaWF0ZUZufHxcImZ1bmN0aW9uXCI9PXR5cGVvZiBzZXRJbW1lZGlhdGUmJnNldEltbWVkaWF0ZXx8ZnVuY3Rpb24oYSl7c2V0VGltZW91dChhLDEpfSxrPUFycmF5LmlzQXJyYXl8fGZ1bmN0aW9uKGEpe3JldHVyblwiW29iamVjdCBBcnJheV1cIj09PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKX07Yy5wcm90b3R5cGVbXCJjYXRjaFwiXT1mdW5jdGlvbihhKXtyZXR1cm4gdGhpcy50aGVuKG51bGwsYSl9LGMucHJvdG90eXBlLnRoZW49ZnVuY3Rpb24oYSxiKXt2YXIgZT10aGlzO3JldHVybiBuZXcgYyhmdW5jdGlvbihjLGYpe2QuY2FsbChlLG5ldyBoKGEsYixjLGYpKX0pfSxjLmFsbD1mdW5jdGlvbigpe3ZhciBhPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKDE9PT1hcmd1bWVudHMubGVuZ3RoJiZrKGFyZ3VtZW50c1swXSk/YXJndW1lbnRzWzBdOmFyZ3VtZW50cyk7cmV0dXJuIG5ldyBjKGZ1bmN0aW9uKGIsYyl7ZnVuY3Rpb24gZChmLGcpe3RyeXtpZihnJiYoXCJvYmplY3RcIj09dHlwZW9mIGd8fFwiZnVuY3Rpb25cIj09dHlwZW9mIGcpKXt2YXIgaD1nLnRoZW47aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgaClyZXR1cm4gdm9pZCBoLmNhbGwoZyxmdW5jdGlvbihhKXtkKGYsYSl9LGMpfWFbZl09ZywwPT09LS1lJiZiKGEpfWNhdGNoKGkpe2MoaSl9fWlmKDA9PT1hLmxlbmd0aClyZXR1cm4gYihbXSk7Zm9yKHZhciBlPWEubGVuZ3RoLGY9MDtmPGEubGVuZ3RoO2YrKylkKGYsYVtmXSl9KX0sYy5yZXNvbHZlPWZ1bmN0aW9uKGEpe3JldHVybiBhJiZcIm9iamVjdFwiPT10eXBlb2YgYSYmYS5jb25zdHJ1Y3Rvcj09PWM/YTpuZXcgYyhmdW5jdGlvbihiKXtiKGEpfSl9LGMucmVqZWN0PWZ1bmN0aW9uKGEpe3JldHVybiBuZXcgYyhmdW5jdGlvbihiLGMpe2MoYSl9KX0sYy5yYWNlPWZ1bmN0aW9uKGEpe3JldHVybiBuZXcgYyhmdW5jdGlvbihiLGMpe2Zvcih2YXIgZD0wLGU9YS5sZW5ndGg7ZT5kO2QrKylhW2RdLnRoZW4oYixjKX0pfSxcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlJiZtb2R1bGUuZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1jOmEuUHJvbWlzZXx8KGEuUHJvbWlzZT1jKX0pKHRoaXMpO1xuXG4gICAgY2xpcGJvYXJkLmNvcHkgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIElFIHN1cHBvcnRzIHN0cmluZyBhbmQgVVJMIHR5cGVzOiBodHRwczovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTM2NzQ0KHY9dnMuODUpLmFzcHhcbiAgICAgICAgLy8gV2Ugb25seSBzdXBwb3J0IHRoZSBzdHJpbmcgdHlwZSBmb3Igbm93LlxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09IFwic3RyaW5nXCIgJiYgIShcInRleHQvcGxhaW5cIiBpbiBkYXRhKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IHByb3ZpZGUgYSB0ZXh0L3BsYWluIHR5cGUuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0ckRhdGEgPSAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogZGF0YVtcInRleHQvcGxhaW5cIl0pO1xuICAgICAgICB2YXIgY29weVN1Y2NlZWRlZCA9IHdpbmRvdy5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJUZXh0XCIsIHN0ckRhdGEpO1xuICAgICAgICBpZiAoY29weVN1Y2NlZWRlZCkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiQ29weWluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNsaXBib2FyZC5wYXN0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgc3RyRGF0YSA9IHdpbmRvdy5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJUZXh0XCIpO1xuICAgICAgICBpZiAoc3RyRGF0YSkge1xuICAgICAgICAgIHJlc29sdmUoc3RyRGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgcmVqZWN0ZWQgdGhlIHBhc3RlIHJlcXVlc3QuXG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlBhc3Rpbmcgd2FzIHJlamVjdGVkLlwiKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gY2xpcGJvYXJkO1xufSkpO1xuIiwiLyohXG5cdFBhcGEgUGFyc2Vcblx0djQuMy4zXG5cdGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2Vcblx0TGljZW5zZTogTUlUXG4qL1xuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpXG57XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdHtcblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpXG5cdHtcblx0XHQvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLCBidXRcblx0XHQvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcblx0XHQvLyBsaWtlIE5vZGUuXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0Ly8gQnJvd3NlciBnbG9iYWxzIChyb290IGlzIHdpbmRvdylcblx0XHRyb290LlBhcGEgPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24oKVxue1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGdsb2JhbCA9IChmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gYWx0ZXJuYXRpdmUgbWV0aG9kLCBzaW1pbGFyIHRvIGBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpYFxuXHRcdC8vIGJ1dCB3aXRob3V0IHVzaW5nIGBldmFsYCAod2hpY2ggaXMgZGlzYWJsZWQgd2hlblxuXHRcdC8vIHVzaW5nIENvbnRlbnQgU2VjdXJpdHkgUG9saWN5KS5cblxuXHRcdGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIHNlbGY7IH1cblx0XHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIHdpbmRvdzsgfVxuXHRcdGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZ2xvYmFsOyB9XG5cblx0XHQvLyBXaGVuIHJ1bm5pbmcgdGVzdHMgbm9uZSBvZiB0aGUgYWJvdmUgaGF2ZSBiZWVuIGRlZmluZWRcblx0XHRyZXR1cm4ge307XG5cdH0pKCk7XG5cblxuXHR2YXIgSVNfV09SS0VSID0gIWdsb2JhbC5kb2N1bWVudCAmJiAhIWdsb2JhbC5wb3N0TWVzc2FnZSxcblx0XHRJU19QQVBBX1dPUktFUiA9IElTX1dPUktFUiAmJiAvKFxcP3wmKXBhcGF3b3JrZXIoPXwmfCQpLy50ZXN0KGdsb2JhbC5sb2NhdGlvbi5zZWFyY2gpLFxuXHRcdExPQURFRF9TWU5DID0gZmFsc2UsIEFVVE9fU0NSSVBUX1BBVEg7XG5cdHZhciB3b3JrZXJzID0ge30sIHdvcmtlcklkQ291bnRlciA9IDA7XG5cblx0dmFyIFBhcGEgPSB7fTtcblxuXHRQYXBhLnBhcnNlID0gQ3N2VG9Kc29uO1xuXHRQYXBhLnVucGFyc2UgPSBKc29uVG9Dc3Y7XG5cblx0UGFwYS5SRUNPUkRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7XG5cdFBhcGEuVU5JVF9TRVAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDMxKTtcblx0UGFwYS5CWVRFX09SREVSX01BUksgPSAnXFx1ZmVmZic7XG5cdFBhcGEuQkFEX0RFTElNSVRFUlMgPSBbJ1xccicsICdcXG4nLCAnXCInLCBQYXBhLkJZVEVfT1JERVJfTUFSS107XG5cdFBhcGEuV09SS0VSU19TVVBQT1JURUQgPSAhSVNfV09SS0VSICYmICEhZ2xvYmFsLldvcmtlcjtcblx0UGFwYS5TQ1JJUFRfUEFUSCA9IG51bGw7XHQvLyBNdXN0IGJlIHNldCBieSB5b3VyIGNvZGUgaWYgeW91IHVzZSB3b3JrZXJzIGFuZCB0aGlzIGxpYiBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHlcblxuXHQvLyBDb25maWd1cmFibGUgY2h1bmsgc2l6ZXMgZm9yIGxvY2FsIGFuZCByZW1vdGUgZmlsZXMsIHJlc3BlY3RpdmVseVxuXHRQYXBhLkxvY2FsQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiAxMDtcdC8vIDEwIE1CXG5cdFBhcGEuUmVtb3RlQ2h1bmtTaXplID0gMTAyNCAqIDEwMjQgKiA1O1x0Ly8gNSBNQlxuXHRQYXBhLkRlZmF1bHREZWxpbWl0ZXIgPSAnLCc7XHRcdFx0Ly8gVXNlZCBpZiBub3Qgc3BlY2lmaWVkIGFuZCBkZXRlY3Rpb24gZmFpbHNcblxuXHQvLyBFeHBvc2VkIGZvciB0ZXN0aW5nIGFuZCBkZXZlbG9wbWVudCBvbmx5XG5cdFBhcGEuUGFyc2VyID0gUGFyc2VyO1xuXHRQYXBhLlBhcnNlckhhbmRsZSA9IFBhcnNlckhhbmRsZTtcblx0UGFwYS5OZXR3b3JrU3RyZWFtZXIgPSBOZXR3b3JrU3RyZWFtZXI7XG5cdFBhcGEuRmlsZVN0cmVhbWVyID0gRmlsZVN0cmVhbWVyO1xuXHRQYXBhLlN0cmluZ1N0cmVhbWVyID0gU3RyaW5nU3RyZWFtZXI7XG5cdFBhcGEuUmVhZGFibGVTdHJlYW1TdHJlYW1lciA9IFJlYWRhYmxlU3RyZWFtU3RyZWFtZXI7XG5cblx0aWYgKGdsb2JhbC5qUXVlcnkpXG5cdHtcblx0XHR2YXIgJCA9IGdsb2JhbC5qUXVlcnk7XG5cdFx0JC5mbi5wYXJzZSA9IGZ1bmN0aW9uKG9wdGlvbnMpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbmZpZyA9IG9wdGlvbnMuY29uZmlnIHx8IHt9O1xuXHRcdFx0dmFyIHF1ZXVlID0gW107XG5cblx0XHRcdHRoaXMuZWFjaChmdW5jdGlvbihpZHgpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBzdXBwb3J0ZWQgPSAkKHRoaXMpLnByb3AoJ3RhZ05hbWUnKS50b1VwcGVyQ2FzZSgpID09PSAnSU5QVVQnXG5cdFx0XHRcdFx0XHRcdFx0JiYgJCh0aGlzKS5hdHRyKCd0eXBlJykudG9Mb3dlckNhc2UoKSA9PT0gJ2ZpbGUnXG5cdFx0XHRcdFx0XHRcdFx0JiYgZ2xvYmFsLkZpbGVSZWFkZXI7XG5cblx0XHRcdFx0aWYgKCFzdXBwb3J0ZWQgfHwgIXRoaXMuZmlsZXMgfHwgdGhpcy5maWxlcy5sZW5ndGggPT09IDApXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHQvLyBjb250aW51ZSB0byBuZXh0IGlucHV0IGVsZW1lbnRcblxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmlsZXMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRxdWV1ZS5wdXNoKHtcblx0XHRcdFx0XHRcdGZpbGU6IHRoaXMuZmlsZXNbaV0sXG5cdFx0XHRcdFx0XHRpbnB1dEVsZW06IHRoaXMsXG5cdFx0XHRcdFx0XHRpbnN0YW5jZUNvbmZpZzogJC5leHRlbmQoe30sIGNvbmZpZylcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcdC8vIGJlZ2luIHBhcnNpbmdcblx0XHRcdHJldHVybiB0aGlzO1x0XHQvLyBtYWludGFpbnMgY2hhaW5hYmlsaXR5XG5cblxuXHRcdFx0ZnVuY3Rpb24gcGFyc2VOZXh0RmlsZSgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChxdWV1ZS5sZW5ndGggPT09IDApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmNvbXBsZXRlKSlcblx0XHRcdFx0XHRcdG9wdGlvbnMuY29tcGxldGUoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZiA9IHF1ZXVlWzBdO1xuXG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuYmVmb3JlKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciByZXR1cm5lZCA9IG9wdGlvbnMuYmVmb3JlKGYuZmlsZSwgZi5pbnB1dEVsZW0pO1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiByZXR1cm5lZCA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKHJldHVybmVkLmFjdGlvbiA9PT0gJ2Fib3J0Jylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZXJyb3IoJ0Fib3J0RXJyb3InLCBmLmZpbGUsIGYuaW5wdXRFbGVtLCByZXR1cm5lZC5yZWFzb24pO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHQvLyBBYm9ydHMgYWxsIHF1ZXVlZCBmaWxlcyBpbW1lZGlhdGVseVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAocmV0dXJuZWQuYWN0aW9uID09PSAnc2tpcCcpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgcmV0dXJuZWQuY29uZmlnID09PSAnb2JqZWN0Jylcblx0XHRcdFx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZyA9ICQuZXh0ZW5kKGYuaW5zdGFuY2VDb25maWcsIHJldHVybmVkLmNvbmZpZyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkID09PSAnc2tpcCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XHQvLyBwYXJzZSB0aGUgbmV4dCBmaWxlIGluIHRoZSBxdWV1ZSwgaWYgYW55XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV3JhcCB1cCB0aGUgdXNlcidzIGNvbXBsZXRlIGNhbGxiYWNrLCBpZiBhbnksIHNvIHRoYXQgb3VycyBhbHNvIGdldHMgZXhlY3V0ZWRcblx0XHRcdFx0dmFyIHVzZXJDb21wbGV0ZUZ1bmMgPSBmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0XHRmLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpc0Z1bmN0aW9uKHVzZXJDb21wbGV0ZUZ1bmMpKVxuXHRcdFx0XHRcdFx0dXNlckNvbXBsZXRlRnVuYyhyZXN1bHRzLCBmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRQYXBhLnBhcnNlKGYuZmlsZSwgZi5pbnN0YW5jZUNvbmZpZyk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGVycm9yKG5hbWUsIGZpbGUsIGVsZW0sIHJlYXNvbilcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5lcnJvcikpXG5cdFx0XHRcdFx0b3B0aW9ucy5lcnJvcih7bmFtZTogbmFtZX0sIGZpbGUsIGVsZW0sIHJlYXNvbik7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGZpbGVDb21wbGV0ZSgpXG5cdFx0XHR7XG5cdFx0XHRcdHF1ZXVlLnNwbGljZSgwLCAxKTtcblx0XHRcdFx0cGFyc2VOZXh0RmlsZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cblx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHR7XG5cdFx0Z2xvYmFsLm9ubWVzc2FnZSA9IHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0fVxuXHRlbHNlIGlmIChQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHR7XG5cdFx0QVVUT19TQ1JJUFRfUEFUSCA9IGdldFNjcmlwdFBhdGgoKTtcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBzY3JpcHQgd2FzIGxvYWRlZCBzeW5jaHJvbm91c2x5XG5cdFx0aWYgKCFkb2N1bWVudC5ib2R5KVxuXHRcdHtcblx0XHRcdC8vIEJvZHkgZG9lc24ndCBleGlzdCB5ZXQsIG11c3QgYmUgc3luY2hyb25vdXNcblx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdExPQURFRF9TWU5DID0gdHJ1ZTtcblx0XHRcdH0sIHRydWUpO1xuXHRcdH1cblx0fVxuXG5cblxuXG5cdGZ1bmN0aW9uIENzdlRvSnNvbihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHRfY29uZmlnID0gX2NvbmZpZyB8fCB7fTtcblx0XHR2YXIgZHluYW1pY1R5cGluZyA9IF9jb25maWcuZHluYW1pY1R5cGluZyB8fCBmYWxzZTtcblx0XHRpZiAoaXNGdW5jdGlvbihkeW5hbWljVHlwaW5nKSkge1xuXHRcdFx0X2NvbmZpZy5keW5hbWljVHlwaW5nRnVuY3Rpb24gPSBkeW5hbWljVHlwaW5nO1xuXHRcdFx0Ly8gV2lsbCBiZSBmaWxsZWQgb24gZmlyc3Qgcm93IGNhbGxcblx0XHRcdGR5bmFtaWNUeXBpbmcgPSB7fTtcblx0XHR9XG5cdFx0X2NvbmZpZy5keW5hbWljVHlwaW5nID0gZHluYW1pY1R5cGluZztcblxuXHRcdGlmIChfY29uZmlnLndvcmtlciAmJiBQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdHtcblx0XHRcdHZhciB3ID0gbmV3V29ya2VyKCk7XG5cblx0XHRcdHcudXNlclN0ZXAgPSBfY29uZmlnLnN0ZXA7XG5cdFx0XHR3LnVzZXJDaHVuayA9IF9jb25maWcuY2h1bms7XG5cdFx0XHR3LnVzZXJDb21wbGV0ZSA9IF9jb25maWcuY29tcGxldGU7XG5cdFx0XHR3LnVzZXJFcnJvciA9IF9jb25maWcuZXJyb3I7XG5cblx0XHRcdF9jb25maWcuc3RlcCA9IGlzRnVuY3Rpb24oX2NvbmZpZy5zdGVwKTtcblx0XHRcdF9jb25maWcuY2h1bmsgPSBpc0Z1bmN0aW9uKF9jb25maWcuY2h1bmspO1xuXHRcdFx0X2NvbmZpZy5jb21wbGV0ZSA9IGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSk7XG5cdFx0XHRfY29uZmlnLmVycm9yID0gaXNGdW5jdGlvbihfY29uZmlnLmVycm9yKTtcblx0XHRcdGRlbGV0ZSBfY29uZmlnLndvcmtlcjtcdC8vIHByZXZlbnQgaW5maW5pdGUgbG9vcFxuXG5cdFx0XHR3LnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0aW5wdXQ6IF9pbnB1dCxcblx0XHRcdFx0Y29uZmlnOiBfY29uZmlnLFxuXHRcdFx0XHR3b3JrZXJJZDogdy5pZFxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc3RyZWFtZXIgPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRpZiAoX2NvbmZpZy5kb3dubG9hZClcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgTmV0d29ya1N0cmVhbWVyKF9jb25maWcpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRzdHJlYW1lciA9IG5ldyBTdHJpbmdTdHJlYW1lcihfY29uZmlnKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoX2lucHV0LnJlYWRhYmxlID09PSB0cnVlICYmIGlzRnVuY3Rpb24oX2lucHV0LnJlYWQpICYmIGlzRnVuY3Rpb24oX2lucHV0Lm9uKSlcblx0XHR7XG5cdFx0XHRzdHJlYW1lciA9IG5ldyBSZWFkYWJsZVN0cmVhbVN0cmVhbWVyKF9jb25maWcpO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgX2lucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgX2lucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gLi4uU2FmYXJpLiAoc2VlIGlzc3VlICMxMDYpXG5cdFx0XHRzdHJlYW1lciA9IG5ldyBGaWxlU3RyZWFtZXIoX2NvbmZpZyk7XG5cblx0XHRyZXR1cm4gc3RyZWFtZXIuc3RyZWFtKF9pbnB1dCk7XG5cdH1cblxuXG5cblxuXG5cblx0ZnVuY3Rpb24gSnNvblRvQ3N2KF9pbnB1dCwgX2NvbmZpZylcblx0e1xuXHRcdHZhciBfb3V0cHV0ID0gJyc7XG5cdFx0dmFyIF9maWVsZHMgPSBbXTtcblxuXHRcdC8vIERlZmF1bHQgY29uZmlndXJhdGlvblxuXG5cdFx0LyoqIHdoZXRoZXIgdG8gc3Vycm91bmQgZXZlcnkgZGF0dW0gd2l0aCBxdW90ZXMgKi9cblx0XHR2YXIgX3F1b3RlcyA9IGZhbHNlO1xuXG5cdFx0LyoqIHdoZXRoZXIgdG8gd3JpdGUgaGVhZGVycyAqL1xuXHRcdHZhciBfd3JpdGVIZWFkZXIgPSB0cnVlO1xuXG5cdFx0LyoqIGRlbGltaXRpbmcgY2hhcmFjdGVyICovXG5cdFx0dmFyIF9kZWxpbWl0ZXIgPSAnLCc7XG5cblx0XHQvKiogbmV3bGluZSBjaGFyYWN0ZXIocykgKi9cblx0XHR2YXIgX25ld2xpbmUgPSAnXFxyXFxuJztcblxuXHRcdC8qKiBxdW90ZSBjaGFyYWN0ZXIgKi9cblx0XHR2YXIgX3F1b3RlQ2hhciA9ICdcIic7XG5cblx0XHR1bnBhY2tDb25maWcoKTtcblxuXHRcdHZhciBxdW90ZUNoYXJSZWdleCA9IG5ldyBSZWdFeHAoX3F1b3RlQ2hhciwgJ2cnKTtcblxuXHRcdGlmICh0eXBlb2YgX2lucHV0ID09PSAnc3RyaW5nJylcblx0XHRcdF9pbnB1dCA9IEpTT04ucGFyc2UoX2lucHV0KTtcblxuXHRcdGlmIChfaW5wdXQgaW5zdGFuY2VvZiBBcnJheSlcblx0XHR7XG5cdFx0XHRpZiAoIV9pbnB1dC5sZW5ndGggfHwgX2lucHV0WzBdIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHRcdHJldHVybiBzZXJpYWxpemUobnVsbCwgX2lucHV0KTtcblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXRbMF0gPT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG9iamVjdEtleXMoX2lucHV0WzBdKSwgX2lucHV0KTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ29iamVjdCcpXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBfaW5wdXQuZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9pbnB1dC5kYXRhID0gSlNPTi5wYXJzZShfaW5wdXQuZGF0YSk7XG5cblx0XHRcdGlmIChfaW5wdXQuZGF0YSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoIV9pbnB1dC5maWVsZHMpXG5cdFx0XHRcdFx0X2lucHV0LmZpZWxkcyA9ICBfaW5wdXQubWV0YSAmJiBfaW5wdXQubWV0YS5maWVsZHM7XG5cblx0XHRcdFx0aWYgKCFfaW5wdXQuZmllbGRzKVxuXHRcdFx0XHRcdF9pbnB1dC5maWVsZHMgPSAgX2lucHV0LmRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHRcdFx0XHRcdFx0PyBfaW5wdXQuZmllbGRzXG5cdFx0XHRcdFx0XHRcdFx0XHQ6IG9iamVjdEtleXMoX2lucHV0LmRhdGFbMF0pO1xuXG5cdFx0XHRcdGlmICghKF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXkpICYmIHR5cGVvZiBfaW5wdXQuZGF0YVswXSAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0X2lucHV0LmRhdGEgPSBbX2lucHV0LmRhdGFdO1x0Ly8gaGFuZGxlcyBpbnB1dCBsaWtlIFsxLDIsM10gb3IgWydhc2RmJ11cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShfaW5wdXQuZmllbGRzIHx8IFtdLCBfaW5wdXQuZGF0YSB8fCBbXSk7XG5cdFx0fVxuXG5cdFx0Ly8gRGVmYXVsdCAoYW55IHZhbGlkIHBhdGhzIHNob3VsZCByZXR1cm4gYmVmb3JlIHRoaXMpXG5cdFx0dGhyb3cgJ2V4Y2VwdGlvbjogVW5hYmxlIHRvIHNlcmlhbGl6ZSB1bnJlY29nbml6ZWQgaW5wdXQnO1xuXG5cblx0XHRmdW5jdGlvbiB1bnBhY2tDb25maWcoKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZyAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLmRlbGltaXRlciA9PT0gJ3N0cmluZydcblx0XHRcdFx0JiYgX2NvbmZpZy5kZWxpbWl0ZXIubGVuZ3RoID09PSAxXG5cdFx0XHRcdCYmIFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihfY29uZmlnLmRlbGltaXRlcikgPT09IC0xKVxuXHRcdFx0e1xuXHRcdFx0XHRfZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5xdW90ZXMgPT09ICdib29sZWFuJ1xuXHRcdFx0XHR8fCBfY29uZmlnLnF1b3RlcyBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRfcXVvdGVzID0gX2NvbmZpZy5xdW90ZXM7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5uZXdsaW5lID09PSAnc3RyaW5nJylcblx0XHRcdFx0X25ld2xpbmUgPSBfY29uZmlnLm5ld2xpbmU7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5xdW90ZUNoYXIgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfcXVvdGVDaGFyID0gX2NvbmZpZy5xdW90ZUNoYXI7XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5oZWFkZXIgPT09ICdib29sZWFuJylcblx0XHRcdFx0X3dyaXRlSGVhZGVyID0gX2NvbmZpZy5oZWFkZXI7XG5cdFx0fVxuXG5cblx0XHQvKiogVHVybnMgYW4gb2JqZWN0J3Mga2V5cyBpbnRvIGFuIGFycmF5ICovXG5cdFx0ZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmopXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9iailcblx0XHRcdFx0a2V5cy5wdXNoKGtleSk7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cblx0XHQvKiogVGhlIGRvdWJsZSBmb3IgbG9vcCB0aGF0IGl0ZXJhdGVzIHRoZSBkYXRhIGFuZCB3cml0ZXMgb3V0IGEgQ1NWIHN0cmluZyBpbmNsdWRpbmcgaGVhZGVyIHJvdyAqL1xuXHRcdGZ1bmN0aW9uIHNlcmlhbGl6ZShmaWVsZHMsIGRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGNzdiA9ICcnO1xuXG5cdFx0XHRpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGZpZWxkcyA9IEpTT04ucGFyc2UoZmllbGRzKTtcblx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuXG5cdFx0XHR2YXIgaGFzSGVhZGVyID0gZmllbGRzIGluc3RhbmNlb2YgQXJyYXkgJiYgZmllbGRzLmxlbmd0aCA+IDA7XG5cdFx0XHR2YXIgZGF0YUtleWVkQnlGaWVsZCA9ICEoZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYSBoZWFkZXIgcm93LCB3cml0ZSBpdCBmaXJzdFxuXHRcdFx0aWYgKGhhc0hlYWRlciAmJiBfd3JpdGVIZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGkgPiAwKVxuXHRcdFx0XHRcdFx0Y3N2ICs9IF9kZWxpbWl0ZXI7XG5cdFx0XHRcdFx0Y3N2ICs9IHNhZmUoZmllbGRzW2ldLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdGNzdiArPSBfbmV3bGluZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVGhlbiB3cml0ZSBvdXQgdGhlIGRhdGFcblx0XHRcdGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IGRhdGEubGVuZ3RoOyByb3crKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1heENvbCA9IGhhc0hlYWRlciA/IGZpZWxkcy5sZW5ndGggOiBkYXRhW3Jvd10ubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IG1heENvbDsgY29sKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoY29sID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdHZhciBjb2xJZHggPSBoYXNIZWFkZXIgJiYgZGF0YUtleWVkQnlGaWVsZCA/IGZpZWxkc1tjb2xdIDogY29sO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGRhdGFbcm93XVtjb2xJZHhdLCBjb2wpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJvdyA8IGRhdGEubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBjc3Y7XG5cdFx0fVxuXG5cdFx0LyoqIEVuY2xvc2VzIGEgdmFsdWUgYXJvdW5kIHF1b3RlcyBpZiBuZWVkZWQgKG1ha2VzIGEgdmFsdWUgc2FmZSBmb3IgQ1NWIGluc2VydGlvbikgKi9cblx0XHRmdW5jdGlvbiBzYWZlKHN0ciwgY29sKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJyB8fCBzdHIgPT09IG51bGwpXG5cdFx0XHRcdHJldHVybiAnJztcblxuXHRcdFx0c3RyID0gc3RyLnRvU3RyaW5nKCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgX3F1b3RlQ2hhcitfcXVvdGVDaGFyKTtcblxuXHRcdFx0dmFyIG5lZWRzUXVvdGVzID0gKHR5cGVvZiBfcXVvdGVzID09PSAnYm9vbGVhbicgJiYgX3F1b3Rlcylcblx0XHRcdFx0XHRcdFx0fHwgKF9xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSAmJiBfcXVvdGVzW2NvbF0pXG5cdFx0XHRcdFx0XHRcdHx8IGhhc0FueShzdHIsIFBhcGEuQkFEX0RFTElNSVRFUlMpXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5pbmRleE9mKF9kZWxpbWl0ZXIpID4gLTFcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdCgwKSA9PT0gJyAnXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoc3RyLmxlbmd0aCAtIDEpID09PSAnICc7XG5cblx0XHRcdHJldHVybiBuZWVkc1F1b3RlcyA/IF9xdW90ZUNoYXIgKyBzdHIgKyBfcXVvdGVDaGFyIDogc3RyO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGhhc0FueShzdHIsIHN1YnN0cmluZ3MpXG5cdFx0e1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzdHJpbmdzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRpZiAoc3RyLmluZGV4T2Yoc3Vic3RyaW5nc1tpXSkgPiAtMSlcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKiogQ2h1bmtTdHJlYW1lciBpcyB0aGUgYmFzZSBwcm90b3R5cGUgZm9yIHZhcmlvdXMgc3RyZWFtZXIgaW1wbGVtZW50YXRpb25zLiAqL1xuXHRmdW5jdGlvbiBDaHVua1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdHRoaXMuX2hhbmRsZSA9IG51bGw7XG5cdFx0dGhpcy5fcGF1c2VkID0gZmFsc2U7XG5cdFx0dGhpcy5fZmluaXNoZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9pbnB1dCA9IG51bGw7XG5cdFx0dGhpcy5fYmFzZUluZGV4ID0gMDtcblx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9ICcnO1xuXHRcdHRoaXMuX3Jvd0NvdW50ID0gMDtcblx0XHR0aGlzLl9zdGFydCA9IDA7XG5cdFx0dGhpcy5fbmV4dENodW5rID0gbnVsbDtcblx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IHRydWU7XG5cdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0ge1xuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXHRcdHJlcGxhY2VDb25maWcuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dGhpcy5wYXJzZUNodW5rID0gZnVuY3Rpb24oY2h1bmspXG5cdFx0e1xuXHRcdFx0Ly8gRmlyc3QgY2h1bmsgcHJlLXByb2Nlc3Npbmdcblx0XHRcdGlmICh0aGlzLmlzRmlyc3RDaHVuayAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1vZGlmaWVkQ2h1bmsgPSB0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuayhjaHVuayk7XG5cdFx0XHRcdGlmIChtb2RpZmllZENodW5rICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0Y2h1bmsgPSBtb2RpZmllZENodW5rO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5pc0ZpcnN0Q2h1bmsgPSBmYWxzZTtcblxuXHRcdFx0Ly8gUmVqb2luIHRoZSBsaW5lIHdlIGxpa2VseSBqdXN0IHNwbGl0IGluIHR3byBieSBjaHVua2luZyB0aGUgZmlsZVxuXHRcdFx0dmFyIGFnZ3JlZ2F0ZSA9IHRoaXMuX3BhcnRpYWxMaW5lICsgY2h1bms7XG5cdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9ICcnO1xuXG5cdFx0XHR2YXIgcmVzdWx0cyA9IHRoaXMuX2hhbmRsZS5wYXJzZShhZ2dyZWdhdGUsIHRoaXMuX2Jhc2VJbmRleCwgIXRoaXMuX2ZpbmlzaGVkKTtcblxuXHRcdFx0aWYgKHRoaXMuX2hhbmRsZS5wYXVzZWQoKSB8fCB0aGlzLl9oYW5kbGUuYWJvcnRlZCgpKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdHZhciBsYXN0SW5kZXggPSByZXN1bHRzLm1ldGEuY3Vyc29yO1xuXG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9IGFnZ3JlZ2F0ZS5zdWJzdHJpbmcobGFzdEluZGV4IC0gdGhpcy5fYmFzZUluZGV4KTtcblx0XHRcdFx0dGhpcy5fYmFzZUluZGV4ID0gbGFzdEluZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVzdWx0cyAmJiByZXN1bHRzLmRhdGEpXG5cdFx0XHRcdHRoaXMuX3Jvd0NvdW50ICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cblx0XHRcdHZhciBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgPSB0aGlzLl9maW5pc2hlZCB8fCAodGhpcy5fY29uZmlnLnByZXZpZXcgJiYgdGhpcy5fcm93Q291bnQgPj0gdGhpcy5fY29uZmlnLnByZXZpZXcpO1xuXG5cdFx0XHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZpbmlzaGVkSW5jbHVkaW5nUHJldmlld1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNodW5rKHJlc3VsdHMsIHRoaXMuX2hhbmRsZSk7XG5cdFx0XHRcdGlmICh0aGlzLl9wYXVzZWQpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRyZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5fY29uZmlnLnN0ZXAgJiYgIXRoaXMuX2NvbmZpZy5jaHVuaykge1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YSA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhLmNvbmNhdChyZXN1bHRzLmRhdGEpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzID0gdGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycy5jb25jYXQocmVzdWx0cy5lcnJvcnMpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMubWV0YSA9IHJlc3VsdHMubWV0YTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jb21wbGV0ZSkgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEuYWJvcnRlZCkpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5jb21wbGV0ZSh0aGlzLl9jb21wbGV0ZVJlc3VsdHMsIHRoaXMuX2lucHV0KTtcblxuXHRcdFx0aWYgKCFmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEucGF1c2VkKSlcblx0XHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XG5cblx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdH07XG5cblx0XHR0aGlzLl9zZW5kRXJyb3IgPSBmdW5jdGlvbihlcnJvcilcblx0XHR7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbih0aGlzLl9jb25maWcuZXJyb3IpKVxuXHRcdFx0XHR0aGlzLl9jb25maWcuZXJyb3IoZXJyb3IpO1xuXHRcdFx0ZWxzZSBpZiAoSVNfUEFQQV9XT1JLRVIgJiYgdGhpcy5fY29uZmlnLmVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0XHRlcnJvcjogZXJyb3IsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRmdW5jdGlvbiByZXBsYWNlQ29uZmlnKGNvbmZpZylcblx0XHR7XG5cdFx0XHQvLyBEZWVwLWNvcHkgdGhlIGNvbmZpZyBzbyB3ZSBjYW4gZWRpdCBpdFxuXHRcdFx0dmFyIGNvbmZpZ0NvcHkgPSBjb3B5KGNvbmZpZyk7XG5cdFx0XHRjb25maWdDb3B5LmNodW5rU2l6ZSA9IHBhcnNlSW50KGNvbmZpZ0NvcHkuY2h1bmtTaXplKTtcdC8vIHBhcnNlSW50IFZFUlkgaW1wb3J0YW50IHNvIHdlIGRvbid0IGNvbmNhdGVuYXRlIHN0cmluZ3MhXG5cdFx0XHRpZiAoIWNvbmZpZy5zdGVwICYmICFjb25maWcuY2h1bmspXG5cdFx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gbnVsbDsgIC8vIGRpc2FibGUgUmFuZ2UgaGVhZGVyIGlmIG5vdCBzdHJlYW1pbmc7IGJhZCB2YWx1ZXMgYnJlYWsgSUlTIC0gc2VlIGlzc3VlICMxOTZcblx0XHRcdHRoaXMuX2hhbmRsZSA9IG5ldyBQYXJzZXJIYW5kbGUoY29uZmlnQ29weSk7XG5cdFx0XHR0aGlzLl9oYW5kbGUuc3RyZWFtZXIgPSB0aGlzO1xuXHRcdFx0dGhpcy5fY29uZmlnID0gY29uZmlnQ29weTtcdC8vIHBlcnNpc3QgdGhlIGNvcHkgdG8gdGhlIGNhbGxlclxuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gTmV0d29ya1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5SZW1vdGVDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgeGhyO1xuXG5cdFx0aWYgKElTX1dPUktFUilcblx0XHR7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCgpO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24odXJsKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gdXJsO1xuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX3JlYWRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0eGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHRcdGlmICh0aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzKVxuXHRcdFx0e1xuXHRcdFx0XHR4aHIud2l0aENyZWRlbnRpYWxzID0gdGhpcy5fY29uZmlnLndpdGhDcmVkZW50aWFscztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFJU19XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdHhoci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHR4aHIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0eGhyLm9wZW4oJ0dFVCcsIHRoaXMuX2lucHV0LCAhSVNfV09SS0VSKTtcblx0XHRcdC8vIEhlYWRlcnMgY2FuIG9ubHkgYmUgc2V0IHdoZW4gb25jZSB0aGUgcmVxdWVzdCBzdGF0ZSBpcyBPUEVORURcblx0XHRcdGlmICh0aGlzLl9jb25maWcuZG93bmxvYWRSZXF1ZXN0SGVhZGVycylcblx0XHRcdHtcblx0XHRcdFx0dmFyIGhlYWRlcnMgPSB0aGlzLl9jb25maWcuZG93bmxvYWRSZXF1ZXN0SGVhZGVycztcblxuXHRcdFx0XHRmb3IgKHZhciBoZWFkZXJOYW1lIGluIGhlYWRlcnMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXJOYW1lLCBoZWFkZXJzW2hlYWRlck5hbWVdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSAtIDE7XHQvLyBtaW51cyBvbmUgYmVjYXVzZSBieXRlIHJhbmdlIGlzIGluY2x1c2l2ZVxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignUmFuZ2UnLCAnYnl0ZXM9Jyt0aGlzLl9zdGFydCsnLScrZW5kKTtcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ0lmLU5vbmUtTWF0Y2gnLCAnd2Via2l0LW5vLWNhY2hlJyk7IC8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MjY3MlxuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR4aHIuc2VuZCgpO1xuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKGVyci5tZXNzYWdlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKElTX1dPUktFUiAmJiB4aHIuc3RhdHVzID09PSAwKVxuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuX3N0YXJ0ICs9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlICE9IDQpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHhoci5zdGF0dXMgPCAyMDAgfHwgeGhyLnN0YXR1cyA+PSA0MDApXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICF0aGlzLl9jb25maWcuY2h1bmtTaXplIHx8IHRoaXMuX3N0YXJ0ID4gZ2V0RmlsZVNpemUoeGhyKTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayh4aHIucmVzcG9uc2VUZXh0KTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0Vycm9yID0gZnVuY3Rpb24oZXJyb3JNZXNzYWdlKVxuXHRcdHtcblx0XHRcdHZhciBlcnJvclRleHQgPSB4aHIuc3RhdHVzVGV4dCB8fCBlcnJvck1lc3NhZ2U7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IoZXJyb3JUZXh0KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXRGaWxlU2l6ZSh4aHIpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbnRlbnRSYW5nZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1SYW5nZScpO1xuXHRcdFx0aWYgKGNvbnRlbnRSYW5nZSA9PT0gbnVsbCkgeyAvLyBubyBjb250ZW50IHJhbmdlLCB0aGVuIGZpbmlzaCFcblx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcnNlSW50KGNvbnRlbnRSYW5nZS5zdWJzdHIoY29udGVudFJhbmdlLmxhc3RJbmRleE9mKCcvJykgKyAxKSk7XG5cdFx0fVxuXHR9XG5cdE5ldHdvcmtTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENodW5rU3RyZWFtZXIucHJvdG90eXBlKTtcblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5ldHdvcmtTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIEZpbGVTdHJlYW1lcihjb25maWcpXG5cdHtcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0aWYgKCFjb25maWcuY2h1bmtTaXplKVxuXHRcdFx0Y29uZmlnLmNodW5rU2l6ZSA9IFBhcGEuTG9jYWxDaHVua1NpemU7XG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgcmVhZGVyLCBzbGljZTtcblxuXHRcdC8vIEZpbGVSZWFkZXIgaXMgYmV0dGVyIHRoYW4gRmlsZVJlYWRlclN5bmMgKGV2ZW4gaW4gd29ya2VyKSAtIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcS8yNDcwODY0OS8xMDQ4ODYyXG5cdFx0Ly8gQnV0IEZpcmVmb3ggaXMgYSBwaWxsLCB0b28gLSBzZWUgaXNzdWUgIzc2OiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy83NlxuXHRcdHZhciB1c2luZ0FzeW5jUmVhZGVyID0gdHlwZW9mIEZpbGVSZWFkZXIgIT09ICd1bmRlZmluZWQnO1x0Ly8gU2FmYXJpIGRvZXNuJ3QgY29uc2lkZXIgaXQgYSBmdW5jdGlvbiAtIHNlZSBpc3N1ZSAjMTA1XG5cblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKGZpbGUpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSBmaWxlO1xuXHRcdFx0c2xpY2UgPSBmaWxlLnNsaWNlIHx8IGZpbGUud2Via2l0U2xpY2UgfHwgZmlsZS5tb3pTbGljZTtcblxuXHRcdFx0aWYgKHVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHRcdC8vIFByZWZlcnJlZCBtZXRob2Qgb2YgcmVhZGluZyBmaWxlcywgZXZlbiBpbiB3b3JrZXJzXG5cdFx0XHRcdHJlYWRlci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHRyZWFkZXIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKCk7XHQvLyBIYWNrIGZvciBydW5uaW5nIGluIGEgd2ViIHdvcmtlciBpbiBGaXJlZm94XG5cblx0XHRcdHRoaXMuX25leHRDaHVuaygpO1x0Ly8gU3RhcnRzIHN0cmVhbWluZ1xuXHRcdH07XG5cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZCAmJiAoIXRoaXMuX2NvbmZpZy5wcmV2aWV3IHx8IHRoaXMuX3Jvd0NvdW50IDwgdGhpcy5fY29uZmlnLnByZXZpZXcpKVxuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHR9XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dmFyIGlucHV0ID0gdGhpcy5faW5wdXQ7XG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IE1hdGgubWluKHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSwgdGhpcy5faW5wdXQuc2l6ZSk7XG5cdFx0XHRcdGlucHV0ID0gc2xpY2UuY2FsbChpbnB1dCwgdGhpcy5fc3RhcnQsIGVuZCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdHh0ID0gcmVhZGVyLnJlYWRBc1RleHQoaW5wdXQsIHRoaXMuX2NvbmZpZy5lbmNvZGluZyk7XG5cdFx0XHRpZiAoIXVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKHsgdGFyZ2V0OiB7IHJlc3VsdDogdHh0IH0gfSk7XHQvLyBtaW1pYyB0aGUgYXN5bmMgc2lnbmF0dXJlXG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbihldmVudClcblx0XHR7XG5cdFx0XHQvLyBWZXJ5IGltcG9ydGFudCB0byBpbmNyZW1lbnQgc3RhcnQgZWFjaCB0aW1lIGJlZm9yZSBoYW5kbGluZyByZXN1bHRzXG5cdFx0XHR0aGlzLl9zdGFydCArPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+PSB0aGlzLl9pbnB1dC5zaXplO1xuXHRcdFx0dGhpcy5wYXJzZUNodW5rKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKHJlYWRlci5lcnJvcik7XG5cdFx0fVxuXG5cdH1cblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmlsZVN0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gU3RyaW5nU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHN0cmluZztcblx0XHR2YXIgcmVtYWluaW5nO1xuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24ocylcblx0XHR7XG5cdFx0XHRzdHJpbmcgPSBzO1xuXHRcdFx0cmVtYWluaW5nID0gcztcblx0XHRcdHJldHVybiB0aGlzLl9uZXh0Q2h1bmsoKTtcblx0XHR9XG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZCkgcmV0dXJuO1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLl9jb25maWcuY2h1bmtTaXplO1xuXHRcdFx0dmFyIGNodW5rID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoMCwgc2l6ZSkgOiByZW1haW5pbmc7XG5cdFx0XHRyZW1haW5pbmcgPSBzaXplID8gcmVtYWluaW5nLnN1YnN0cihzaXplKSA6ICcnO1xuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhcmVtYWluaW5nO1xuXHRcdFx0cmV0dXJuIHRoaXMucGFyc2VDaHVuayhjaHVuayk7XG5cdFx0fVxuXHR9XG5cdFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nU3RyZWFtZXIucHJvdG90eXBlKTtcblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RyaW5nU3RyZWFtZXI7XG5cblxuXHRmdW5jdGlvbiBSZWFkYWJsZVN0cmVhbVN0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblxuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHF1ZXVlID0gW107XG5cdFx0dmFyIHBhcnNlT25EYXRhID0gdHJ1ZTtcblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24oc3RyZWFtKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gc3RyZWFtO1xuXG5cdFx0XHR0aGlzLl9pbnB1dC5vbignZGF0YScsIHRoaXMuX3N0cmVhbURhdGEpO1xuXHRcdFx0dGhpcy5faW5wdXQub24oJ2VuZCcsIHRoaXMuX3N0cmVhbUVuZCk7XG5cdFx0XHR0aGlzLl9pbnB1dC5vbignZXJyb3InLCB0aGlzLl9zdHJlYW1FcnJvcik7XG5cdFx0fVxuXG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmIChxdWV1ZS5sZW5ndGgpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMucGFyc2VDaHVuayhxdWV1ZS5zaGlmdCgpKTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0cGFyc2VPbkRhdGEgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuX3N0cmVhbURhdGEgPSBiaW5kRnVuY3Rpb24oZnVuY3Rpb24oY2h1bmspXG5cdFx0e1xuXHRcdFx0dHJ5XG5cdFx0XHR7XG5cdFx0XHRcdHF1ZXVlLnB1c2godHlwZW9mIGNodW5rID09PSAnc3RyaW5nJyA/IGNodW5rIDogY2h1bmsudG9TdHJpbmcodGhpcy5fY29uZmlnLmVuY29kaW5nKSk7XG5cblx0XHRcdFx0aWYgKHBhcnNlT25EYXRhKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cGFyc2VPbkRhdGEgPSBmYWxzZTtcblx0XHRcdFx0XHR0aGlzLnBhcnNlQ2h1bmsocXVldWUuc2hpZnQoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlcnJvcilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fc3RyZWFtRXJyb3IoZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH0sIHRoaXMpO1xuXG5cdFx0dGhpcy5fc3RyZWFtRXJyb3IgPSBiaW5kRnVuY3Rpb24oZnVuY3Rpb24oZXJyb3IpXG5cdFx0e1xuXHRcdFx0dGhpcy5fc3RyZWFtQ2xlYW5VcCgpO1xuXHRcdFx0dGhpcy5fc2VuZEVycm9yKGVycm9yLm1lc3NhZ2UpO1xuXHRcdH0sIHRoaXMpO1xuXG5cdFx0dGhpcy5fc3RyZWFtRW5kID0gYmluZEZ1bmN0aW9uKGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR0aGlzLl9zdHJlYW1DbGVhblVwKCk7XG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9IHRydWU7XG5cdFx0XHR0aGlzLl9zdHJlYW1EYXRhKCcnKTtcblx0XHR9LCB0aGlzKTtcblxuXHRcdHRoaXMuX3N0cmVhbUNsZWFuVXAgPSBiaW5kRnVuY3Rpb24oZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0LnJlbW92ZUxpc3RlbmVyKCdkYXRhJywgdGhpcy5fc3RyZWFtRGF0YSk7XG5cdFx0XHR0aGlzLl9pbnB1dC5yZW1vdmVMaXN0ZW5lcignZW5kJywgdGhpcy5fc3RyZWFtRW5kKTtcblx0XHRcdHRoaXMuX2lucHV0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIHRoaXMuX3N0cmVhbUVycm9yKTtcblx0XHR9LCB0aGlzKTtcblx0fVxuXHRSZWFkYWJsZVN0cmVhbVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRSZWFkYWJsZVN0cmVhbVN0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlYWRhYmxlU3RyZWFtU3RyZWFtZXI7XG5cblxuXHQvLyBVc2Ugb25lIFBhcnNlckhhbmRsZSBwZXIgZW50aXJlIENTViBmaWxlIG9yIHN0cmluZ1xuXHRmdW5jdGlvbiBQYXJzZXJIYW5kbGUoX2NvbmZpZylcblx0e1xuXHRcdC8vIE9uZSBnb2FsIGlzIHRvIG1pbmltaXplIHRoZSB1c2Ugb2YgcmVndWxhciBleHByZXNzaW9ucy4uLlxuXHRcdHZhciBGTE9BVCA9IC9eXFxzKi0/KFxcZCpcXC4/XFxkK3xcXGQrXFwuP1xcZCopKGVbLStdP1xcZCspP1xccyokL2k7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIF9zdGVwQ291bnRlciA9IDA7XHQvLyBOdW1iZXIgb2YgdGltZXMgc3RlcCB3YXMgY2FsbGVkIChudW1iZXIgb2Ygcm93cyBwYXJzZWQpXG5cdFx0dmFyIF9pbnB1dDtcdFx0XHRcdC8vIFRoZSBpbnB1dCBiZWluZyBwYXJzZWRcblx0XHR2YXIgX3BhcnNlcjtcdFx0XHQvLyBUaGUgY29yZSBwYXJzZXIgYmVpbmcgdXNlZFxuXHRcdHZhciBfcGF1c2VkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHdlIGFyZSBwYXVzZWQgb3Igbm90XG5cdFx0dmFyIF9hYm9ydGVkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHRoZSBwYXJzZXIgaGFzIGFib3J0ZWQgb3Igbm90XG5cdFx0dmFyIF9kZWxpbWl0ZXJFcnJvcjtcdC8vIFRlbXBvcmFyeSBzdGF0ZSBiZXR3ZWVuIGRlbGltaXRlciBkZXRlY3Rpb24gYW5kIHByb2Nlc3NpbmcgcmVzdWx0c1xuXHRcdHZhciBfZmllbGRzID0gW107XHRcdC8vIEZpZWxkcyBhcmUgZnJvbSB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgaW5wdXQsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdHZhciBfcmVzdWx0cyA9IHtcdFx0Ly8gVGhlIGxhc3QgcmVzdWx0cyByZXR1cm5lZCBmcm9tIHRoZSBwYXJzZXJcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblxuXHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCkpXG5cdFx0e1xuXHRcdFx0dmFyIHVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0X2NvbmZpZy5zdGVwID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdHtcblx0XHRcdFx0X3Jlc3VsdHMgPSByZXN1bHRzO1xuXG5cdFx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRcdGVsc2VcdC8vIG9ubHkgY2FsbCB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhZnRlciBoZWFkZXIgcm93XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXG5cdFx0XHRcdFx0Ly8gSXQncyBwb3NzYmlsZSB0aGF0IHRoaXMgbGluZSB3YXMgZW1wdHkgYW5kIHRoZXJlJ3Mgbm8gcm93IGhlcmUgYWZ0ZXIgYWxsXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGEubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdFx0X3N0ZXBDb3VudGVyICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfc3RlcENvdW50ZXIgPiBfY29uZmlnLnByZXZpZXcpXG5cdFx0XHRcdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dXNlclN0ZXAoX3Jlc3VsdHMsIHNlbGYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFBhcnNlcyBpbnB1dC4gTW9zdCB1c2VycyB3b24ndCBuZWVkLCBhbmQgc2hvdWxkbid0IG1lc3Mgd2l0aCwgdGhlIGJhc2VJbmRleFxuXHRcdCAqIGFuZCBpZ25vcmVMYXN0Um93IHBhcmFtZXRlcnMuIFRoZXkgYXJlIHVzZWQgYnkgc3RyZWFtZXJzICh3cmFwcGVyIGZ1bmN0aW9ucylcblx0XHQgKiB3aGVuIGFuIGlucHV0IGNvbWVzIGluIG11bHRpcGxlIGNodW5rcywgbGlrZSBmcm9tIGEgZmlsZS5cblx0XHQgKi9cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHRpZiAoIV9jb25maWcubmV3bGluZSlcblx0XHRcdFx0X2NvbmZpZy5uZXdsaW5lID0gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dCk7XG5cblx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0aWYgKCFfY29uZmlnLmRlbGltaXRlcilcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltR3Vlc3MgPSBndWVzc0RlbGltaXRlcihpbnB1dCwgX2NvbmZpZy5uZXdsaW5lKTtcblx0XHRcdFx0aWYgKGRlbGltR3Vlc3Muc3VjY2Vzc2Z1bClcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGRlbGltR3Vlc3MuYmVzdERlbGltaXRlcjtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gdHJ1ZTtcdC8vIGFkZCBlcnJvciBhZnRlciBwYXJzaW5nIChvdGhlcndpc2UgaXQgd291bGQgYmUgb3ZlcndyaXR0ZW4pXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBQYXBhLkRlZmF1bHREZWxpbWl0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoaXNGdW5jdGlvbihfY29uZmlnLmRlbGltaXRlcikpXG5cdFx0XHR7XG5cdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXIoaW5wdXQpO1xuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcGFyc2VyQ29uZmlnID0gY29weShfY29uZmlnKTtcblx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHBhcnNlckNvbmZpZy5wcmV2aWV3Kys7XHQvLyB0byBjb21wZW5zYXRlIGZvciBoZWFkZXIgcm93XG5cblx0XHRcdF9pbnB1dCA9IGlucHV0O1xuXHRcdFx0X3BhcnNlciA9IG5ldyBQYXJzZXIocGFyc2VyQ29uZmlnKTtcblx0XHRcdF9yZXN1bHRzID0gX3BhcnNlci5wYXJzZShfaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdyk7XG5cdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQgPyB7IG1ldGE6IHsgcGF1c2VkOiB0cnVlIH0gfSA6IChfcmVzdWx0cyB8fCB7IG1ldGE6IHsgcGF1c2VkOiBmYWxzZSB9IH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9pbnB1dCA9IF9pbnB1dC5zdWJzdHIoX3BhcnNlci5nZXRDaGFySW5kZXgoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSBmYWxzZTtcblx0XHRcdHNlbGYuc3RyZWFtZXIucGFyc2VDaHVuayhfaW5wdXQpO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ZWQgPSBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdHJldHVybiBfYWJvcnRlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRfcmVzdWx0cy5tZXRhLmFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0aWYgKGlzRnVuY3Rpb24oX2NvbmZpZy5jb21wbGV0ZSkpXG5cdFx0XHRcdF9jb25maWcuY29tcGxldGUoX3Jlc3VsdHMpO1xuXHRcdFx0X2lucHV0ID0gJyc7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHByb2Nlc3NSZXN1bHRzKClcblx0XHR7XG5cdFx0XHRpZiAoX3Jlc3VsdHMgJiYgX2RlbGltaXRlckVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHRhZGRFcnJvcignRGVsaW1pdGVyJywgJ1VuZGV0ZWN0YWJsZURlbGltaXRlcicsICdVbmFibGUgdG8gYXV0by1kZXRlY3QgZGVsaW1pdGluZyBjaGFyYWN0ZXI7IGRlZmF1bHRlZCB0byBcXCcnK1BhcGEuRGVmYXVsdERlbGltaXRlcisnXFwnJyk7XG5cdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5za2lwRW1wdHlMaW5lcylcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aCA9PT0gMSAmJiBfcmVzdWx0cy5kYXRhW2ldWzBdID09PSAnJylcblx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKGktLSwgMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRmaWxsSGVhZGVyRmllbGRzKCk7XG5cblx0XHRcdHJldHVybiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBuZWVkc0hlYWRlclJvdygpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9jb25maWcuaGVhZGVyICYmIF9maWVsZHMubGVuZ3RoID09PSAwO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbGxIZWFkZXJGaWVsZHMoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBuZWVkc0hlYWRlclJvdygpICYmIGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdFx0X2ZpZWxkcy5wdXNoKF9yZXN1bHRzLmRhdGFbaV1bal0pO1xuXHRcdFx0X3Jlc3VsdHMuZGF0YS5zcGxpY2UoMCwgMSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gc2hvdWxkQXBwbHlEeW5hbWljVHlwaW5nKGZpZWxkKSB7XG5cdFx0XHQvLyBDYWNoZSBmdW5jdGlvbiB2YWx1ZXMgdG8gYXZvaWQgY2FsbGluZyBpdCBmb3IgZWFjaCByb3dcblx0XHRcdGlmIChfY29uZmlnLmR5bmFtaWNUeXBpbmdGdW5jdGlvbiAmJiBfY29uZmlnLmR5bmFtaWNUeXBpbmdbZmllbGRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0X2NvbmZpZy5keW5hbWljVHlwaW5nW2ZpZWxkXSA9IF9jb25maWcuZHluYW1pY1R5cGluZ0Z1bmN0aW9uKGZpZWxkKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAoX2NvbmZpZy5keW5hbWljVHlwaW5nW2ZpZWxkXSB8fCBfY29uZmlnLmR5bmFtaWNUeXBpbmcpID09PSB0cnVlXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSlcblx0XHR7XG5cdFx0XHRpZiAoc2hvdWxkQXBwbHlEeW5hbWljVHlwaW5nKGZpZWxkKSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSAndHJ1ZScgfHwgdmFsdWUgPT09ICdUUlVFJylcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0ZWxzZSBpZiAodmFsdWUgPT09ICdmYWxzZScgfHwgdmFsdWUgPT09ICdGQUxTRScpXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cmV0dXJuIHRyeVBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cyB8fCAoIV9jb25maWcuaGVhZGVyICYmICFfY29uZmlnLmR5bmFtaWNUeXBpbmcpKVxuXHRcdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvdyA9IF9jb25maWcuaGVhZGVyID8ge30gOiBbXTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgZmllbGQgPSBqO1xuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IF9yZXN1bHRzLmRhdGFbaV1bal07XG5cblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdFx0XHRmaWVsZCA9IGogPj0gX2ZpZWxkcy5sZW5ndGggPyAnX19wYXJzZWRfZXh0cmEnIDogX2ZpZWxkc1tqXTtcblxuXHRcdFx0XHRcdHZhbHVlID0gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSk7XG5cblx0XHRcdFx0XHRpZiAoZmllbGQgPT09ICdfX3BhcnNlZF9leHRyYScpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cm93W2ZpZWxkXSA9IHJvd1tmaWVsZF0gfHwgW107XG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdLnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdID0gdmFsdWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldID0gcm93O1xuXG5cdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChqID4gX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcignRmllbGRNaXNtYXRjaCcsICdUb29NYW55RmllbGRzJywgJ1RvbyBtYW55IGZpZWxkczogZXhwZWN0ZWQgJyArIF9maWVsZHMubGVuZ3RoICsgJyBmaWVsZHMgYnV0IHBhcnNlZCAnICsgaiwgaSk7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaiA8IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoJ0ZpZWxkTWlzbWF0Y2gnLCAnVG9vRmV3RmllbGRzJywgJ1RvbyBmZXcgZmllbGRzOiBleHBlY3RlZCAnICsgX2ZpZWxkcy5sZW5ndGggKyAnIGZpZWxkcyBidXQgcGFyc2VkICcgKyBqLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIgJiYgX3Jlc3VsdHMubWV0YSlcblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5maWVsZHMgPSBfZmllbGRzO1xuXHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzRGVsaW1pdGVyKGlucHV0LCBuZXdsaW5lKVxuXHRcdHtcblx0XHRcdHZhciBkZWxpbUNob2ljZXMgPSBbJywnLCAnXFx0JywgJ3wnLCAnOycsIFBhcGEuUkVDT1JEX1NFUCwgUGFwYS5VTklUX1NFUF07XG5cdFx0XHR2YXIgYmVzdERlbGltLCBiZXN0RGVsdGEsIGZpZWxkQ291bnRQcmV2Um93O1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRlbGltQ2hvaWNlcy5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltID0gZGVsaW1DaG9pY2VzW2ldO1xuXHRcdFx0XHR2YXIgZGVsdGEgPSAwLCBhdmdGaWVsZENvdW50ID0gMDtcblx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0dmFyIHByZXZpZXcgPSBuZXcgUGFyc2VyKHtcblx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdG5ld2xpbmU6IG5ld2xpbmUsXG5cdFx0XHRcdFx0cHJldmlldzogMTBcblx0XHRcdFx0fSkucGFyc2UoaW5wdXQpO1xuXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcHJldmlldy5kYXRhLmxlbmd0aDsgaisrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIGZpZWxkQ291bnQgPSBwcmV2aWV3LmRhdGFbal0ubGVuZ3RoO1xuXHRcdFx0XHRcdGF2Z0ZpZWxkQ291bnQgKz0gZmllbGRDb3VudDtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgZmllbGRDb3VudFByZXZSb3cgPT09ICd1bmRlZmluZWQnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChmaWVsZENvdW50ID4gMSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZWx0YSArPSBNYXRoLmFicyhmaWVsZENvdW50IC0gZmllbGRDb3VudFByZXZSb3cpO1xuXHRcdFx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSBmaWVsZENvdW50O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChwcmV2aWV3LmRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50IC89IHByZXZpZXcuZGF0YS5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKCh0eXBlb2YgYmVzdERlbHRhID09PSAndW5kZWZpbmVkJyB8fCBkZWx0YSA8IGJlc3REZWx0YSlcblx0XHRcdFx0XHQmJiBhdmdGaWVsZENvdW50ID4gMS45OSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJlc3REZWx0YSA9IGRlbHRhO1xuXHRcdFx0XHRcdGJlc3REZWxpbSA9IGRlbGltO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gYmVzdERlbGltO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzZnVsOiAhIWJlc3REZWxpbSxcblx0XHRcdFx0YmVzdERlbGltaXRlcjogYmVzdERlbGltXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dClcblx0XHR7XG5cdFx0XHRpbnB1dCA9IGlucHV0LnN1YnN0cigwLCAxMDI0KjEwMjQpO1x0Ly8gbWF4IGxlbmd0aCAxIE1CXG5cblx0XHRcdHZhciByID0gaW5wdXQuc3BsaXQoJ1xccicpO1xuXG5cdFx0XHR2YXIgbiA9IGlucHV0LnNwbGl0KCdcXG4nKTtcblxuXHRcdFx0dmFyIG5BcHBlYXJzRmlyc3QgPSAobi5sZW5ndGggPiAxICYmIG5bMF0ubGVuZ3RoIDwgclswXS5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoci5sZW5ndGggPT09IDEgfHwgbkFwcGVhcnNGaXJzdClcblx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXG5cdFx0XHR2YXIgbnVtV2l0aE4gPSAwO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocltpXVswXSA9PT0gJ1xcbicpXG5cdFx0XHRcdFx0bnVtV2l0aE4rKztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bVdpdGhOID49IHIubGVuZ3RoIC8gMiA/ICdcXHJcXG4nIDogJ1xccic7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJ5UGFyc2VGbG9hdCh2YWwpXG5cdFx0e1xuXHRcdFx0dmFyIGlzTnVtYmVyID0gRkxPQVQudGVzdCh2YWwpO1xuXHRcdFx0cmV0dXJuIGlzTnVtYmVyID8gcGFyc2VGbG9hdCh2YWwpIDogdmFsO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFkZEVycm9yKHR5cGUsIGNvZGUsIG1zZywgcm93KVxuXHRcdHtcblx0XHRcdF9yZXN1bHRzLmVycm9ycy5wdXNoKHtcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0bWVzc2FnZTogbXNnLFxuXHRcdFx0XHRyb3c6IHJvd1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblxuXHQvKiogVGhlIGNvcmUgcGFyc2VyIGltcGxlbWVudHMgc3BlZWR5IGFuZCBjb3JyZWN0IENTViBwYXJzaW5nICovXG5cdGZ1bmN0aW9uIFBhcnNlcihjb25maWcpXG5cdHtcblx0XHQvLyBVbnBhY2sgdGhlIGNvbmZpZyBvYmplY3Rcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0dmFyIGRlbGltID0gY29uZmlnLmRlbGltaXRlcjtcblx0XHR2YXIgbmV3bGluZSA9IGNvbmZpZy5uZXdsaW5lO1xuXHRcdHZhciBjb21tZW50cyA9IGNvbmZpZy5jb21tZW50cztcblx0XHR2YXIgc3RlcCA9IGNvbmZpZy5zdGVwO1xuXHRcdHZhciBwcmV2aWV3ID0gY29uZmlnLnByZXZpZXc7XG5cdFx0dmFyIGZhc3RNb2RlID0gY29uZmlnLmZhc3RNb2RlO1xuXHRcdHZhciBxdW90ZUNoYXIgPSBjb25maWcucXVvdGVDaGFyIHx8ICdcIic7XG5cblx0XHQvLyBEZWxpbWl0ZXIgbXVzdCBiZSB2YWxpZFxuXHRcdGlmICh0eXBlb2YgZGVsaW0gIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoZGVsaW0pID4gLTEpXG5cdFx0XHRkZWxpbSA9ICcsJztcblxuXHRcdC8vIENvbW1lbnQgY2hhcmFjdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAoY29tbWVudHMgPT09IGRlbGltKVxuXHRcdFx0dGhyb3cgJ0NvbW1lbnQgY2hhcmFjdGVyIHNhbWUgYXMgZGVsaW1pdGVyJztcblx0XHRlbHNlIGlmIChjb21tZW50cyA9PT0gdHJ1ZSlcblx0XHRcdGNvbW1lbnRzID0gJyMnO1xuXHRcdGVsc2UgaWYgKHR5cGVvZiBjb21tZW50cyAhPT0gJ3N0cmluZydcblx0XHRcdHx8IFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihjb21tZW50cykgPiAtMSlcblx0XHRcdGNvbW1lbnRzID0gZmFsc2U7XG5cblx0XHQvLyBOZXdsaW5lIG11c3QgYmUgdmFsaWQ6IFxcciwgXFxuLCBvciBcXHJcXG5cblx0XHRpZiAobmV3bGluZSAhPSAnXFxuJyAmJiBuZXdsaW5lICE9ICdcXHInICYmIG5ld2xpbmUgIT0gJ1xcclxcbicpXG5cdFx0XHRuZXdsaW5lID0gJ1xcbic7XG5cblx0XHQvLyBXZSdyZSBnb25uYSBuZWVkIHRoZXNlIGF0IHRoZSBQYXJzZXIgc2NvcGVcblx0XHR2YXIgY3Vyc29yID0gMDtcblx0XHR2YXIgYWJvcnRlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0LCBiYXNlSW5kZXgsIGlnbm9yZUxhc3RSb3cpXG5cdFx0e1xuXHRcdFx0Ly8gRm9yIHNvbWUgcmVhc29uLCBpbiBDaHJvbWUsIHRoaXMgc3BlZWRzIHRoaW5ncyB1cCAoIT8pXG5cdFx0XHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJylcblx0XHRcdFx0dGhyb3cgJ0lucHV0IG11c3QgYmUgYSBzdHJpbmcnO1xuXG5cdFx0XHQvLyBXZSBkb24ndCBuZWVkIHRvIGNvbXB1dGUgc29tZSBvZiB0aGVzZSBldmVyeSB0aW1lIHBhcnNlKCkgaXMgY2FsbGVkLFxuXHRcdFx0Ly8gYnV0IGhhdmluZyB0aGVtIGluIGEgbW9yZSBsb2NhbCBzY29wZSBzZWVtcyB0byBwZXJmb3JtIGJldHRlclxuXHRcdFx0dmFyIGlucHV0TGVuID0gaW5wdXQubGVuZ3RoLFxuXHRcdFx0XHRkZWxpbUxlbiA9IGRlbGltLmxlbmd0aCxcblx0XHRcdFx0bmV3bGluZUxlbiA9IG5ld2xpbmUubGVuZ3RoLFxuXHRcdFx0XHRjb21tZW50c0xlbiA9IGNvbW1lbnRzLmxlbmd0aDtcblx0XHRcdHZhciBzdGVwSXNGdW5jdGlvbiA9IGlzRnVuY3Rpb24oc3RlcCk7XG5cblx0XHRcdC8vIEVzdGFibGlzaCBzdGFydGluZyBzdGF0ZVxuXHRcdFx0Y3Vyc29yID0gMDtcblx0XHRcdHZhciBkYXRhID0gW10sIGVycm9ycyA9IFtdLCByb3cgPSBbXSwgbGFzdEN1cnNvciA9IDA7XG5cblx0XHRcdGlmICghaW5wdXQpXG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cblx0XHRcdGlmIChmYXN0TW9kZSB8fCAoZmFzdE1vZGUgIT09IGZhbHNlICYmIGlucHV0LmluZGV4T2YocXVvdGVDaGFyKSA9PT0gLTEpKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgcm93cyA9IGlucHV0LnNwbGl0KG5ld2xpbmUpO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcm93ID0gcm93c1tpXTtcblx0XHRcdFx0XHRjdXJzb3IgKz0gcm93Lmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoaSAhPT0gcm93cy5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdFx0Y3Vyc29yICs9IG5ld2xpbmUubGVuZ3RoO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cuc3Vic3RyKDAsIGNvbW1lbnRzTGVuKSA9PT0gY29tbWVudHMpXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgaSA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBkYXRhLnNsaWNlKDAsIHByZXZpZXcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0dmFyIG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0dmFyIHF1b3RlQ2hhclJlZ2V4ID0gbmV3IFJlZ0V4cChxdW90ZUNoYXIrcXVvdGVDaGFyLCAnZycpO1xuXG5cdFx0XHQvLyBQYXJzZXIgbG9vcFxuXHRcdFx0Zm9yICg7Oylcblx0XHRcdHtcblx0XHRcdFx0Ly8gRmllbGQgaGFzIG9wZW5pbmcgcXVvdGVcblx0XHRcdFx0aWYgKGlucHV0W2N1cnNvcl0gPT09IHF1b3RlQ2hhcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIFN0YXJ0IG91ciBzZWFyY2ggZm9yIHRoZSBjbG9zaW5nIHF1b3RlIHdoZXJlIHRoZSBjdXJzb3IgaXNcblx0XHRcdFx0XHR2YXIgcXVvdGVTZWFyY2ggPSBjdXJzb3I7XG5cblx0XHRcdFx0XHQvLyBTa2lwIHRoZSBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdFx0Y3Vyc29yKys7XG5cblx0XHRcdFx0XHRmb3IgKDs7KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEZpbmQgY2xvc2luZyBxdW90ZVxuXHRcdFx0XHRcdFx0dmFyIHF1b3RlU2VhcmNoID0gaW5wdXQuaW5kZXhPZihxdW90ZUNoYXIsIHF1b3RlU2VhcmNoKzEpO1xuXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVTZWFyY2ggPT09IC0xKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpZiAoIWlnbm9yZUxhc3RSb3cpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBObyBjbG9zaW5nIHF1b3RlLi4uIHdoYXQgYSBwaXR5XG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogJ1F1b3RlcycsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb2RlOiAnTWlzc2luZ1F1b3RlcycsXG5cdFx0XHRcdFx0XHRcdFx0XHRtZXNzYWdlOiAnUXVvdGVkIGZpZWxkIHVudGVybWluYXRlZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRyb3c6IGRhdGEubGVuZ3RoLFx0Ly8gcm93IGhhcyB5ZXQgdG8gYmUgaW5zZXJ0ZWRcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBjdXJzb3Jcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChxdW90ZVNlYXJjaCA9PT0gaW5wdXRMZW4tMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBhdCBFT0Zcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIHF1b3RlQ2hhcik7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmaW5pc2godmFsdWUpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGlzIHF1b3RlIGlzIGVzY2FwZWQsIGl0J3MgcGFydCBvZiB0aGUgZGF0YTsgc2tpcCBpdFxuXHRcdFx0XHRcdFx0aWYgKGlucHV0W3F1b3RlU2VhcmNoKzFdID09PSBxdW90ZUNoYXIpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHF1b3RlU2VhcmNoKys7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2grMV0gPT09IGRlbGltKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IGRlbGltaXRlclxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgcXVvdGVDaGFyKSk7XG5cdFx0XHRcdFx0XHRcdGN1cnNvciA9IHF1b3RlU2VhcmNoICsgMSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpbnB1dC5zdWJzdHIocXVvdGVTZWFyY2grMSwgbmV3bGluZUxlbikgPT09IG5ld2xpbmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgbmV3bGluZVxuXHRcdFx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZShxdW90ZUNoYXJSZWdleCwgcXVvdGVDaGFyKSk7XG5cdFx0XHRcdFx0XHRcdHNhdmVSb3cocXVvdGVTZWFyY2ggKyAxICsgbmV3bGluZUxlbik7XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XHQvLyBiZWNhdXNlIHdlIG1heSBoYXZlIHNraXBwZWQgdGhlIG5leHREZWxpbSBpbiB0aGUgcXVvdGVkIGZpZWxkXG5cblx0XHRcdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENvbW1lbnQgZm91bmQgYXQgc3RhcnQgb2YgbmV3IGxpbmVcblx0XHRcdFx0aWYgKGNvbW1lbnRzICYmIHJvdy5sZW5ndGggPT09IDAgJiYgaW5wdXQuc3Vic3RyKGN1cnNvciwgY29tbWVudHNMZW4pID09PSBjb21tZW50cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChuZXh0TmV3bGluZSA9PT0gLTEpXHQvLyBDb21tZW50IGVuZHMgYXQgRU9GXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHROZXdsaW5lICsgbmV3bGluZUxlbjtcblx0XHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTmV4dCBkZWxpbWl0ZXIgY29tZXMgYmVmb3JlIG5leHQgbmV3bGluZSwgc28gd2UndmUgcmVhY2hlZCBlbmQgb2YgZmllbGRcblx0XHRcdFx0aWYgKG5leHREZWxpbSAhPT0gLTEgJiYgKG5leHREZWxpbSA8IG5leHROZXdsaW5lIHx8IG5leHROZXdsaW5lID09PSAtMSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0RGVsaW0pKTtcblx0XHRcdFx0XHRjdXJzb3IgPSBuZXh0RGVsaW0gKyBkZWxpbUxlbjtcblx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRW5kIG9mIHJvd1xuXHRcdFx0XHRpZiAobmV4dE5ld2xpbmUgIT09IC0xKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgbmV4dE5ld2xpbmUpKTtcblx0XHRcdFx0XHRzYXZlUm93KG5leHROZXdsaW5lICsgbmV3bGluZUxlbik7XG5cblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocHJldmlldyAmJiBkYXRhLmxlbmd0aCA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cblx0XHRcdHJldHVybiBmaW5pc2goKTtcblxuXG5cdFx0XHRmdW5jdGlvbiBwdXNoUm93KHJvdylcblx0XHRcdHtcblx0XHRcdFx0ZGF0YS5wdXNoKHJvdyk7XG5cdFx0XHRcdGxhc3RDdXJzb3IgPSBjdXJzb3I7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgcmVtYWluaW5nIGlucHV0IGZyb20gY3Vyc29yIHRvIHRoZSBlbmQgaW50b1xuXHRcdFx0ICogcm93LCBzYXZlcyB0aGUgcm93LCBjYWxscyBzdGVwLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cy5cblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gZmluaXNoKHZhbHVlKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoaWdub3JlTGFzdFJvdylcblx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR2YWx1ZSA9IGlucHV0LnN1YnN0cihjdXJzb3IpO1xuXHRcdFx0XHRyb3cucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdGN1cnNvciA9IGlucHV0TGVuO1x0Ly8gaW1wb3J0YW50IGluIGNhc2UgcGFyc2luZyBpcyBwYXVzZWRcblx0XHRcdFx0cHVzaFJvdyhyb3cpO1xuXHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kcyB0aGUgY3VycmVudCByb3cgdG8gdGhlIHJlc3VsdHMuIEl0IHNldHMgdGhlIGN1cnNvclxuXHRcdFx0ICogdG8gbmV3Q3Vyc29yIGFuZCBmaW5kcyB0aGUgbmV4dE5ld2xpbmUuIFRoZSBjYWxsZXIgc2hvdWxkXG5cdFx0XHQgKiB0YWtlIGNhcmUgdG8gZXhlY3V0ZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgY2hlY2sgZm9yXG5cdFx0XHQgKiBwcmV2aWV3IGFuZCBlbmQgcGFyc2luZyBpZiBuZWNlc3NhcnkuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIHNhdmVSb3cobmV3Q3Vyc29yKVxuXHRcdFx0e1xuXHRcdFx0XHRjdXJzb3IgPSBuZXdDdXJzb3I7XG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0cm93ID0gW107XG5cdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgcmVzdWx0cywgZXJyb3JzLCBhbmQgbWV0YS4gKi9cblx0XHRcdGZ1bmN0aW9uIHJldHVybmFibGUoc3RvcHBlZClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0XHRcdGVycm9yczogZXJyb3JzLFxuXHRcdFx0XHRcdG1ldGE6IHtcblx0XHRcdFx0XHRcdGRlbGltaXRlcjogZGVsaW0sXG5cdFx0XHRcdFx0XHRsaW5lYnJlYWs6IG5ld2xpbmUsXG5cdFx0XHRcdFx0XHRhYm9ydGVkOiBhYm9ydGVkLFxuXHRcdFx0XHRcdFx0dHJ1bmNhdGVkOiAhIXN0b3BwZWQsXG5cdFx0XHRcdFx0XHRjdXJzb3I6IGxhc3RDdXJzb3IgKyAoYmFzZUluZGV4IHx8IDApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiogRXhlY3V0ZXMgdGhlIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFuZCByZXNldHMgZGF0YSAmIGVycm9ycy4gKi9cblx0XHRcdGZ1bmN0aW9uIGRvU3RlcCgpXG5cdFx0XHR7XG5cdFx0XHRcdHN0ZXAocmV0dXJuYWJsZSgpKTtcblx0XHRcdFx0ZGF0YSA9IFtdLCBlcnJvcnMgPSBbXTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqIFNldHMgdGhlIGFib3J0IGZsYWcgKi9cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdH07XG5cblx0XHQvKiogR2V0cyB0aGUgY3Vyc29yIHBvc2l0aW9uICovXG5cdFx0dGhpcy5nZXRDaGFySW5kZXggPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGN1cnNvcjtcblx0XHR9O1xuXHR9XG5cblxuXHQvLyBJZiB5b3UgbmVlZCB0byBsb2FkIFBhcGEgUGFyc2UgYXN5bmNocm9ub3VzbHkgYW5kIHlvdSBhbHNvIG5lZWQgd29ya2VyIHRocmVhZHMsIGhhcmQtY29kZVxuXHQvLyB0aGUgc2NyaXB0IHBhdGggaGVyZS4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWhvbHQvUGFwYVBhcnNlL2lzc3Vlcy84NyNpc3N1ZWNvbW1lbnQtNTc4ODUzNThcblx0ZnVuY3Rpb24gZ2V0U2NyaXB0UGF0aCgpXG5cdHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0XHRyZXR1cm4gc2NyaXB0cy5sZW5ndGggPyBzY3JpcHRzW3NjcmlwdHMubGVuZ3RoIC0gMV0uc3JjIDogJyc7XG5cdH1cblxuXHRmdW5jdGlvbiBuZXdXb3JrZXIoKVxuXHR7XG5cdFx0aWYgKCFQYXBhLldPUktFUlNfU1VQUE9SVEVEKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdGlmICghTE9BREVEX1NZTkMgJiYgUGFwYS5TQ1JJUFRfUEFUSCA9PT0gbnVsbClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0J1NjcmlwdCBwYXRoIGNhbm5vdCBiZSBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBQYXBhIFBhcnNlIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseS4gJyArXG5cdFx0XHRcdCdZb3UgbmVlZCB0byBzZXQgUGFwYS5TQ1JJUFRfUEFUSCBtYW51YWxseS4nXG5cdFx0XHQpO1xuXHRcdHZhciB3b3JrZXJVcmwgPSBQYXBhLlNDUklQVF9QQVRIIHx8IEFVVE9fU0NSSVBUX1BBVEg7XG5cdFx0Ly8gQXBwZW5kICdwYXBhd29ya2VyJyB0byB0aGUgc2VhcmNoIHN0cmluZyB0byB0ZWxsIHBhcGFwYXJzZSB0aGF0IHRoaXMgaXMgb3VyIHdvcmtlci5cblx0XHR3b3JrZXJVcmwgKz0gKHdvcmtlclVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArICdwYXBhd29ya2VyJztcblx0XHR2YXIgdyA9IG5ldyBnbG9iYWwuV29ya2VyKHdvcmtlclVybCk7XG5cdFx0dy5vbm1lc3NhZ2UgPSBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHRcdHcuaWQgPSB3b3JrZXJJZENvdW50ZXIrKztcblx0XHR3b3JrZXJzW3cuaWRdID0gdztcblx0XHRyZXR1cm4gdztcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIG1haW4gdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiBtYWluVGhyZWFkUmVjZWl2ZWRNZXNzYWdlKGUpXG5cdHtcblx0XHR2YXIgbXNnID0gZS5kYXRhO1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW21zZy53b3JrZXJJZF07XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdGlmIChtc2cuZXJyb3IpXG5cdFx0XHR3b3JrZXIudXNlckVycm9yKG1zZy5lcnJvciwgbXNnLmZpbGUpO1xuXHRcdGVsc2UgaWYgKG1zZy5yZXN1bHRzICYmIG1zZy5yZXN1bHRzLmRhdGEpXG5cdFx0e1xuXHRcdFx0dmFyIGFib3J0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXHRcdFx0XHRjb21wbGV0ZVdvcmtlcihtc2cud29ya2VySWQsIHsgZGF0YTogW10sIGVycm9yczogW10sIG1ldGE6IHsgYWJvcnRlZDogdHJ1ZSB9IH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGhhbmRsZSA9IHtcblx0XHRcdFx0YWJvcnQ6IGFib3J0LFxuXHRcdFx0XHRwYXVzZTogbm90SW1wbGVtZW50ZWQsXG5cdFx0XHRcdHJlc3VtZTogbm90SW1wbGVtZW50ZWRcblx0XHRcdH07XG5cblx0XHRcdGlmIChpc0Z1bmN0aW9uKHdvcmtlci51c2VyU3RlcCkpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLnJlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHdvcmtlci51c2VyU3RlcCh7XG5cdFx0XHRcdFx0XHRkYXRhOiBbbXNnLnJlc3VsdHMuZGF0YVtpXV0sXG5cdFx0XHRcdFx0XHRlcnJvcnM6IG1zZy5yZXN1bHRzLmVycm9ycyxcblx0XHRcdFx0XHRcdG1ldGE6IG1zZy5yZXN1bHRzLm1ldGFcblx0XHRcdFx0XHR9LCBoYW5kbGUpO1xuXHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGVsZXRlIG1zZy5yZXN1bHRzO1x0Ly8gZnJlZSBtZW1vcnkgQVNBUFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0d29ya2VyLnVzZXJDaHVuayhtc2cucmVzdWx0cywgaGFuZGxlLCBtc2cuZmlsZSk7XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobXNnLmZpbmlzaGVkICYmICFhYm9ydGVkKVxuXHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCBtc2cucmVzdWx0cyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb21wbGV0ZVdvcmtlcih3b3JrZXJJZCwgcmVzdWx0cykge1xuXHRcdHZhciB3b3JrZXIgPSB3b3JrZXJzW3dvcmtlcklkXTtcblx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlckNvbXBsZXRlKSlcblx0XHRcdHdvcmtlci51c2VyQ29tcGxldGUocmVzdWx0cyk7XG5cdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xuXHRcdGRlbGV0ZSB3b3JrZXJzW3dvcmtlcklkXTtcblx0fVxuXG5cdGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCkge1xuXHRcdHRocm93ICdOb3QgaW1wbGVtZW50ZWQuJztcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIHdvcmtlciB0aHJlYWQgcmVjZWl2ZXMgYSBtZXNzYWdlICovXG5cdGZ1bmN0aW9uIHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblxuXHRcdGlmICh0eXBlb2YgUGFwYS5XT1JLRVJfSUQgPT09ICd1bmRlZmluZWQnICYmIG1zZylcblx0XHRcdFBhcGEuV09SS0VSX0lEID0gbXNnLndvcmtlcklkO1xuXG5cdFx0aWYgKHR5cGVvZiBtc2cuaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0cmVzdWx0czogUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpLFxuXHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChnbG9iYWwuRmlsZSAmJiBtc2cuaW5wdXQgaW5zdGFuY2VvZiBGaWxlKSB8fCBtc2cuaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpXHQvLyB0aGFuayB5b3UsIFNhZmFyaSAoc2VlIGlzc3VlICMxMDYpXG5cdFx0e1xuXHRcdFx0dmFyIHJlc3VsdHMgPSBQYXBhLnBhcnNlKG1zZy5pbnB1dCwgbXNnLmNvbmZpZyk7XG5cdFx0XHRpZiAocmVzdWx0cylcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHQvKiogTWFrZXMgYSBkZWVwIGNvcHkgb2YgYW4gYXJyYXkgb3Igb2JqZWN0IChtb3N0bHkpICovXG5cdGZ1bmN0aW9uIGNvcHkob2JqKVxuXHR7XG5cdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR2YXIgY3B5ID0gb2JqIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRjcHlba2V5XSA9IGNvcHkob2JqW2tleV0pO1xuXHRcdHJldHVybiBjcHk7XG5cdH1cblxuXHRmdW5jdGlvbiBiaW5kRnVuY3Rpb24oZiwgc2VsZilcblx0e1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHsgZi5hcHBseShzZWxmLCBhcmd1bWVudHMpOyB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jKVxuXHR7XG5cdFx0cmV0dXJuIHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nO1xuXHR9XG5cblx0cmV0dXJuIFBhcGE7XG59KSk7XG4iLCIvKiEgdGV0aGVyIDEuNC4wICovXG5cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICBUZXRoZXJCYXNlID0geyBtb2R1bGVzOiBbXSB9O1xufVxuXG52YXIgemVyb0VsZW1lbnQgPSBudWxsO1xuXG4vLyBTYW1lIGFzIG5hdGl2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QsIGV4Y2VwdCBpdCB0YWtlcyBpbnRvIGFjY291bnQgcGFyZW50IDxmcmFtZT4gb2Zmc2V0c1xuLy8gaWYgdGhlIGVsZW1lbnQgbGllcyB3aXRoaW4gYSBuZXN0ZWQgZG9jdW1lbnQgKDxmcmFtZT4gb3IgPGlmcmFtZT4tbGlrZSkuXG5mdW5jdGlvbiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Qobm9kZSkge1xuICB2YXIgYm91bmRpbmdSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBUaGUgb3JpZ2luYWwgb2JqZWN0IHJldHVybmVkIGJ5IGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyBpbW11dGFibGUsIHNvIHdlIGNsb25lIGl0XG4gIC8vIFdlIGNhbid0IHVzZSBleHRlbmQgYmVjYXVzZSB0aGUgcHJvcGVydGllcyBhcmUgbm90IGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgb2JqZWN0IGJ5IGhhc093blByb3BlcnR5IGluIElFOVxuICB2YXIgcmVjdCA9IHt9O1xuICBmb3IgKHZhciBrIGluIGJvdW5kaW5nUmVjdCkge1xuICAgIHJlY3Rba10gPSBib3VuZGluZ1JlY3Rba107XG4gIH1cblxuICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHZhciBfZnJhbWVFbGVtZW50ID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmZyYW1lRWxlbWVudDtcbiAgICBpZiAoX2ZyYW1lRWxlbWVudCkge1xuICAgICAgdmFyIGZyYW1lUmVjdCA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChfZnJhbWVFbGVtZW50KTtcbiAgICAgIHJlY3QudG9wICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmJvdHRvbSArPSBmcmFtZVJlY3QudG9wO1xuICAgICAgcmVjdC5sZWZ0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgICAgcmVjdC5yaWdodCArPSBmcmFtZVJlY3QubGVmdDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50cyhlbCkge1xuICAvLyBJbiBmaXJlZm94IGlmIHRoZSBlbCBpcyBpbnNpZGUgYW4gaWZyYW1lIHdpdGggZGlzcGxheTogbm9uZTsgd2luZG93LmdldENvbXB1dGVkU3R5bGUoKSB3aWxsIHJldHVybiBudWxsO1xuICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01NDgzOTdcbiAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcbiAgdmFyIHBvc2l0aW9uID0gY29tcHV0ZWRTdHlsZS5wb3NpdGlvbjtcbiAgdmFyIHBhcmVudHMgPSBbXTtcblxuICBpZiAocG9zaXRpb24gPT09ICdmaXhlZCcpIHtcbiAgICByZXR1cm4gW2VsXTtcbiAgfVxuXG4gIHZhciBwYXJlbnQgPSBlbDtcbiAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkgJiYgcGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PT0gMSkge1xuICAgIHZhciBzdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7fVxuXG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUgPT09IG51bGwpIHtcbiAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgfVxuXG4gICAgdmFyIF9zdHlsZSA9IHN0eWxlO1xuICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcbiAgICB2YXIgb3ZlcmZsb3dYID0gX3N0eWxlLm92ZXJmbG93WDtcbiAgICB2YXIgb3ZlcmZsb3dZID0gX3N0eWxlLm92ZXJmbG93WTtcblxuICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcbiAgICAgIGlmIChwb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyB8fCBbJ3JlbGF0aXZlJywgJ2Fic29sdXRlJywgJ2ZpeGVkJ10uaW5kZXhPZihzdHlsZS5wb3NpdGlvbikgPj0gMCkge1xuICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJlbnRzLnB1c2goZWwub3duZXJEb2N1bWVudC5ib2R5KTtcblxuICAvLyBJZiB0aGUgbm9kZSBpcyB3aXRoaW4gYSBmcmFtZSwgYWNjb3VudCBmb3IgdGhlIHBhcmVudCB3aW5kb3cgc2Nyb2xsXG4gIGlmIChlbC5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3KTtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnRzO1xufVxuXG52YXIgdW5pcXVlSWQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgaWQgPSAwO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiArK2lkO1xuICB9O1xufSkoKTtcblxudmFyIHplcm9Qb3NDYWNoZSA9IHt9O1xudmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbigpIHtcbiAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIHVuZm9ydHVuYXRlbHkgdG9vIGFjY3VyYXRlLiAgSXQgaW50cm9kdWNlcyBhIHBpeGVsIG9yIHR3byBvZlxuICAvLyBqaXR0ZXIgYXMgdGhlIHVzZXIgc2Nyb2xscyB0aGF0IG1lc3NlcyB3aXRoIG91ciBhYmlsaXR5IHRvIGRldGVjdCBpZiB0d28gcG9zaXRpb25zXG4gIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuICAvLyBnZXQgdGhlIHNhbWUgaml0dGVyLCBzbyB3ZSBjYW4gY2FuY2VsIHRoZSB0d28gb3V0LlxuICB2YXIgbm9kZSA9IHplcm9FbGVtZW50O1xuICBpZiAoIW5vZGUgfHwgIWRvY3VtZW50LmJvZHkuY29udGFpbnMobm9kZSkpIHtcbiAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJywgdW5pcXVlSWQoKSk7XG4gICAgZXh0ZW5kKG5vZGUuc3R5bGUsIHtcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuICAgIHplcm9FbGVtZW50ID0gbm9kZTtcbiAgfVxuXG4gIHZhciBpZCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcpO1xuICBpZiAodHlwZW9mIHplcm9Qb3NDYWNoZVtpZF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgemVyb1Bvc0NhY2hlW2lkXSA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKTtcblxuICAgIC8vIENsZWFyIHRoZSBjYWNoZSB3aGVuIHRoaXMgcG9zaXRpb24gY2FsbCBpcyBkb25lXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgZGVsZXRlIHplcm9Qb3NDYWNoZVtpZF07XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gemVyb1Bvc0NhY2hlW2lkXTtcbn07XG5cbmZ1bmN0aW9uIHJlbW92ZVV0aWxFbGVtZW50cygpIHtcbiAgaWYgKHplcm9FbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh6ZXJvRWxlbWVudCk7XG4gIH1cbiAgemVyb0VsZW1lbnQgPSBudWxsO1xufTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRzKGVsKSB7XG4gIHZhciBkb2MgPSB1bmRlZmluZWQ7XG4gIGlmIChlbCA9PT0gZG9jdW1lbnQpIHtcbiAgICBkb2MgPSBkb2N1bWVudDtcbiAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICBkb2MgPSBlbC5vd25lckRvY3VtZW50O1xuICB9XG5cbiAgdmFyIGRvY0VsID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuICB2YXIgYm94ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KGVsKTtcblxuICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKCk7XG5cbiAgYm94LnRvcCAtPSBvcmlnaW4udG9wO1xuICBib3gubGVmdCAtPSBvcmlnaW4ubGVmdDtcblxuICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3gud2lkdGggPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gYm94LmxlZnQgLSBib3gucmlnaHQ7XG4gIH1cbiAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIGJveC50b3AgLSBib3guYm90dG9tO1xuICB9XG5cbiAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG4gIGJveC5sZWZ0ID0gYm94LmxlZnQgLSBkb2NFbC5jbGllbnRMZWZ0O1xuICBib3gucmlnaHQgPSBkb2MuYm9keS5jbGllbnRXaWR0aCAtIGJveC53aWR0aCAtIGJveC5sZWZ0O1xuICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cbiAgcmV0dXJuIGJveDtcbn1cblxuZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG4gIHJldHVybiBlbC5vZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xufVxuXG52YXIgX3Njcm9sbEJhclNpemUgPSBudWxsO1xuZnVuY3Rpb24gZ2V0U2Nyb2xsQmFyU2l6ZSgpIHtcbiAgaWYgKF9zY3JvbGxCYXJTaXplKSB7XG4gICAgcmV0dXJuIF9zY3JvbGxCYXJTaXplO1xuICB9XG4gIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcblxuICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZXh0ZW5kKG91dGVyLnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgIGhlaWdodDogJzE1MHB4JyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgfSk7XG5cbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aENvbnRhaW5lZCA9IGlubmVyLm9mZnNldFdpZHRoO1xuICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuICBpZiAod2lkdGhDb250YWluZWQgPT09IHdpZHRoU2Nyb2xsKSB7XG4gICAgd2lkdGhTY3JvbGwgPSBvdXRlci5jbGllbnRXaWR0aDtcbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aCA9IHdpZHRoQ29udGFpbmVkIC0gd2lkdGhTY3JvbGw7XG5cbiAgX3Njcm9sbEJhclNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiB3aWR0aCB9O1xuICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG4gIHZhciBhcmdzID0gW107XG5cbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcblxuICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmopIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBpZiAoY2xzLnRyaW0oKSkge1xuICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgnKF58ICknICsgbmFtZS5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcoIHwkKScsICdnaScpO1xuICAgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpLnJlcGxhY2UocmVnZXgsICcgJyk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cbiAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCk7XG4gIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc05hbWUoZWwpIHtcbiAgLy8gQ2FuJ3QgdXNlIGp1c3QgU1ZHQW5pbWF0ZWRTdHJpbmcgaGVyZSBzaW5jZSBub2RlcyB3aXRoaW4gYSBGcmFtZSBpbiBJRSBoYXZlXG4gIC8vIGNvbXBsZXRlbHkgc2VwYXJhdGVseSBTVkdBbmltYXRlZFN0cmluZyBiYXNlIGNsYXNzZXNcbiAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuU1ZHQW5pbWF0ZWRTdHJpbmcpIHtcbiAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG4gIH1cbiAgcmV0dXJuIGVsLmNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpIHtcbiAgZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzZXMoZWwsIGFkZCwgYWxsKSB7XG4gIC8vIE9mIHRoZSBzZXQgb2YgJ2FsbCcgY2xhc3Nlcywgd2UgbmVlZCB0aGUgJ2FkZCcgY2xhc3NlcywgYW5kIG9ubHkgdGhlXG4gIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuICBhbGwuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgaWYgKGFkZC5pbmRleE9mKGNscykgPT09IC0xICYmIGhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoIWhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICBhZGRDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgZGVmZXJyZWQgPSBbXTtcblxudmFyIGRlZmVyID0gZnVuY3Rpb24gZGVmZXIoZm4pIHtcbiAgZGVmZXJyZWQucHVzaChmbik7XG59O1xuXG52YXIgZmx1c2ggPSBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgdmFyIGZuID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuICAgIGZuKCk7XG4gIH1cbn07XG5cbnZhciBFdmVudGVkID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnRlZCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRXZlbnRlZCwgW3tcbiAgICBrZXk6ICdvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHZhciBvbmNlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAzIHx8IGFyZ3VtZW50c1szXSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBhcmd1bWVudHNbM107XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvbmNlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25jZShldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICB0aGlzLm9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIHRydWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29mZicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgdGhpcy5iaW5kaW5nc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBkZWxldGUgdGhpcy5iaW5kaW5nc1tldmVudF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RyaWdnZXInLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50KSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuYmluZGluZ3NbZXZlbnRdKSB7XG4gICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIF9iaW5kaW5ncyRldmVudCRpID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV07XG4gICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuICAgICAgICAgIHZhciBjdHggPSBfYmluZGluZ3MkZXZlbnQkaS5jdHg7XG4gICAgICAgICAgdmFyIG9uY2UgPSBfYmluZGluZ3MkZXZlbnQkaS5vbmNlO1xuXG4gICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaGFuZGxlci5hcHBseShjb250ZXh0LCBhcmdzKTtcblxuICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXZlbnRlZDtcbn0pKCk7XG5cblRldGhlckJhc2UuVXRpbHMgPSB7XG4gIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdDogZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0LFxuICBnZXRTY3JvbGxQYXJlbnRzOiBnZXRTY3JvbGxQYXJlbnRzLFxuICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcbiAgZ2V0T2Zmc2V0UGFyZW50OiBnZXRPZmZzZXRQYXJlbnQsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuICBkZWZlcjogZGVmZXIsXG4gIGZsdXNoOiBmbHVzaCxcbiAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuICBFdmVudGVkOiBFdmVudGVkLFxuICBnZXRTY3JvbGxCYXJTaXplOiBnZXRTY3JvbGxCYXJTaXplLFxuICByZW1vdmVVdGlsRWxlbWVudHM6IHJlbW92ZVV0aWxFbGVtZW50c1xufTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSwgcGVyZm9ybWFuY2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3g2LCBfeDcsIF94OCkgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeDYsIHByb3BlcnR5ID0gX3g3LCByZWNlaXZlciA9IF94ODsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeDYgPSBwYXJlbnQ7IF94NyA9IHByb3BlcnR5OyBfeDggPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IGluY2x1ZGUgdGhlIHV0aWxzLmpzIGZpbGUgYmVmb3JlIHRldGhlci5qcycpO1xufVxuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldFNjcm9sbFBhcmVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxQYXJlbnRzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBnZXRPZmZzZXRQYXJlbnQgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRPZmZzZXRQYXJlbnQ7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIGFkZENsYXNzID0gX1RldGhlckJhc2UkVXRpbHMuYWRkQ2xhc3M7XG52YXIgcmVtb3ZlQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVDbGFzcztcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xudmFyIGZsdXNoID0gX1RldGhlckJhc2UkVXRpbHMuZmx1c2g7XG52YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG52YXIgcmVtb3ZlVXRpbEVsZW1lbnRzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlVXRpbEVsZW1lbnRzO1xuXG5mdW5jdGlvbiB3aXRoaW4oYSwgYikge1xuICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cbiAgcmV0dXJuIGEgKyBkaWZmID49IGIgJiYgYiA+PSBhIC0gZGlmZjtcbn1cblxudmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIHZhciB0cmFuc2Zvcm1zID0gWyd0cmFuc2Zvcm0nLCAnV2Via2l0VHJhbnNmb3JtJywgJ09UcmFuc2Zvcm0nLCAnTW96VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJ107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBrZXkgPSB0cmFuc2Zvcm1zW2ldO1xuICAgIGlmIChlbC5zdHlsZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG59KSgpO1xuXG52YXIgdGV0aGVycyA9IFtdO1xuXG52YXIgcG9zaXRpb24gPSBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcbiAgICB0ZXRoZXIucG9zaXRpb24oZmFsc2UpO1xuICB9KTtcbiAgZmx1c2goKTtcbn07XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH1cbiAgcmV0dXJuICtuZXcgRGF0ZSgpO1xufVxuXG4oZnVuY3Rpb24gKCkge1xuICB2YXIgbGFzdENhbGwgPSBudWxsO1xuICB2YXIgbGFzdER1cmF0aW9uID0gbnVsbDtcbiAgdmFyIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcblxuICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKHR5cGVvZiBsYXN0RHVyYXRpb24gIT09ICd1bmRlZmluZWQnICYmIGxhc3REdXJhdGlvbiA+IDE2KSB7XG4gICAgICAvLyBXZSB2b2x1bnRhcmlseSB0aHJvdHRsZSBvdXJzZWx2ZXMgaWYgd2UgY2FuJ3QgbWFuYWdlIDYwZnBzXG4gICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuICAgICAgLy8gSnVzdCBpbiBjYXNlIHRoaXMgaXMgdGhlIGxhc3QgZXZlbnQsIHJlbWVtYmVyIHRvIHBvc2l0aW9uIGp1c3Qgb25jZSBtb3JlXG4gICAgICBwZW5kaW5nVGltZW91dCA9IHNldFRpbWVvdXQodGljaywgMjUwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGxhc3RDYWxsICE9PSAndW5kZWZpbmVkJyAmJiBub3coKSAtIGxhc3RDYWxsIDwgMTApIHtcbiAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocGVuZGluZ1RpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBsYXN0Q2FsbCA9IG5vdygpO1xuICAgIHBvc2l0aW9uKCk7XG4gICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcbiAgfTtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIFsncmVzaXplJywgJ3Njcm9sbCcsICd0b3VjaG1vdmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuICAgIH0pO1xuICB9XG59KSgpO1xuXG52YXIgTUlSUk9SX0xSID0ge1xuICBjZW50ZXI6ICdjZW50ZXInLFxuICBsZWZ0OiAncmlnaHQnLFxuICByaWdodDogJ2xlZnQnXG59O1xuXG52YXIgTUlSUk9SX1RCID0ge1xuICBtaWRkbGU6ICdtaWRkbGUnLFxuICB0b3A6ICdib3R0b20nLFxuICBib3R0b206ICd0b3AnXG59O1xuXG52YXIgT0ZGU0VUX01BUCA9IHtcbiAgdG9wOiAwLFxuICBsZWZ0OiAwLFxuICBtaWRkbGU6ICc1MCUnLFxuICBjZW50ZXI6ICc1MCUnLFxuICBib3R0b206ICcxMDAlJyxcbiAgcmlnaHQ6ICcxMDAlJ1xufTtcblxudmFyIGF1dG9Ub0ZpeGVkQXR0YWNobWVudCA9IGZ1bmN0aW9uIGF1dG9Ub0ZpeGVkQXR0YWNobWVudChhdHRhY2htZW50LCByZWxhdGl2ZVRvQXR0YWNobWVudCkge1xuICB2YXIgbGVmdCA9IGF0dGFjaG1lbnQubGVmdDtcbiAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG4gIGlmIChsZWZ0ID09PSAnYXV0bycpIHtcbiAgICBsZWZ0ID0gTUlSUk9SX0xSW3JlbGF0aXZlVG9BdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHRvcCA9PT0gJ2F1dG8nKSB7XG4gICAgdG9wID0gTUlSUk9SX1RCW3JlbGF0aXZlVG9BdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxudmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbGVmdCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdG9wID0gT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxuZnVuY3Rpb24gYWRkT2Zmc2V0KCkge1xuICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgb2Zmc2V0cyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIG9mZnNldHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cblxuICBvZmZzZXRzLmZvckVhY2goZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAodHlwZW9mIHRvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRvcCA9IHBhcnNlRmxvYXQodG9wLCAxMCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxlZnQgPSBwYXJzZUZsb2F0KGxlZnQsIDEwKTtcbiAgICB9XG5cbiAgICBvdXQudG9wICs9IHRvcDtcbiAgICBvdXQubGVmdCArPSBsZWZ0O1xuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuICBpZiAodHlwZW9mIG9mZnNldC5sZWZ0ID09PSAnc3RyaW5nJyAmJiBvZmZzZXQubGVmdC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LmxlZnQgPSBwYXJzZUZsb2F0KG9mZnNldC5sZWZ0LCAxMCkgLyAxMDAgKiBzaXplLndpZHRoO1xuICB9XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LnRvcCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LnRvcC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LnRvcCA9IHBhcnNlRmxvYXQob2Zmc2V0LnRvcCwgMTApIC8gMTAwICogc2l6ZS5oZWlnaHQ7XG4gIH1cblxuICByZXR1cm4gb2Zmc2V0O1xufVxuXG52YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuICB2YXIgX3ZhbHVlJHNwbGl0ID0gdmFsdWUuc3BsaXQoJyAnKTtcblxuICB2YXIgX3ZhbHVlJHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF92YWx1ZSRzcGxpdCwgMik7XG5cbiAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG4gIHZhciBsZWZ0ID0gX3ZhbHVlJHNwbGl0MlsxXTtcblxuICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xufTtcbnZhciBwYXJzZUF0dGFjaG1lbnQgPSBwYXJzZU9mZnNldDtcblxudmFyIFRldGhlckNsYXNzID0gKGZ1bmN0aW9uIChfRXZlbnRlZCkge1xuICBfaW5oZXJpdHMoVGV0aGVyQ2xhc3MsIF9FdmVudGVkKTtcblxuICBmdW5jdGlvbiBUZXRoZXJDbGFzcyhvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUZXRoZXJDbGFzcyk7XG5cbiAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUZXRoZXJDbGFzcy5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmJpbmQodGhpcyk7XG5cbiAgICB0ZXRoZXJzLnB1c2godGhpcyk7XG5cbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zLCBmYWxzZSk7XG5cbiAgICBUZXRoZXJCYXNlLm1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbiAobW9kdWxlKSB7XG4gICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuaW5pdGlhbGl6ZS5jYWxsKF90aGlzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucG9zaXRpb24oKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcbiAgICBrZXk6ICdnZXRDbGFzcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldENsYXNzKCkge1xuICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuICAgICAgdmFyIGNsYXNzZXMgPSB0aGlzLm9wdGlvbnMuY2xhc3NlcztcblxuICAgICAgaWYgKHR5cGVvZiBjbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiBjbGFzc2VzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzUHJlZml4ICsgJy0nICsga2V5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdzZXRPcHRpb25zJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgb2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0T2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG4gICAgICAgIGNsYXNzUHJlZml4OiAndGV0aGVyJ1xuICAgICAgfTtcblxuICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgdmFyIF9vcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgdmFyIGVsZW1lbnQgPSBfb3B0aW9ucy5lbGVtZW50O1xuICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcbiAgICAgIHZhciB0YXJnZXRNb2RpZmllciA9IF9vcHRpb25zLnRhcmdldE1vZGlmaWVyO1xuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gdGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gJ3ZpZXdwb3J0Jykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAndmlzaWJsZSc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudGFyZ2V0ID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Njcm9sbC1oYW5kbGUnO1xuICAgICAgfVxuXG4gICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IEJvdGggZWxlbWVudCBhbmQgdGFyZ2V0IG11c3QgYmUgZGVmaW5lZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XS5qcXVlcnkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBfdGhpczJba2V5XVswXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKF90aGlzMltrZXldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZWxlbWVudCcpKTtcbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYXR0YWNobWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudGFyZ2V0QXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMudGFyZ2V0QXR0YWNobWVudCk7XG4gICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuICAgICAgdGhpcy5vZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMub2Zmc2V0KTtcbiAgICAgIHRoaXMudGFyZ2V0T2Zmc2V0ID0gcGFyc2VPZmZzZXQodGhpcy5vcHRpb25zLnRhcmdldE9mZnNldCk7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBbdGhpcy50YXJnZXRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzID0gZ2V0U2Nyb2xsUGFyZW50cyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5lbmFibGVkID09PSBmYWxzZSkpIHtcbiAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRUYXJnZXRCb3VuZHMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRUYXJnZXRCb3VuZHMoKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAndmlzaWJsZScpIHtcbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcblxuICAgICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG4gICAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKGJvdW5kcy50b3AgKyBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0ICsgaW5uZXJIZWlnaHQpKSk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4oaW5uZXJIZWlnaHQsIG91dC5oZWlnaHQpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCAtIGJvdW5kcy5sZWZ0KSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCArIGlubmVyV2lkdGgpKSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuICAgICAgICAgICAgb3V0LndpZHRoIC09IDI7XG5cbiAgICAgICAgICAgIGlmIChvdXQudG9wIDwgcGFnZVlPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG91dC5sZWZ0IDwgcGFnZVhPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgICAgdmFyIGJvdW5kcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG4gICAgICAgICAgaWYgKHRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgICAgICBib3VuZHMgPSB7XG4gICAgICAgICAgICAgIGxlZnQ6IHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgICAgICB0b3A6IHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogaW5uZXJXaWR0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm91bmRzID0gZ2V0Qm91bmRzKHRhcmdldCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG4gICAgICAgICAgdmFyIGhhc0JvdHRvbVNjcm9sbCA9IHRhcmdldC5zY3JvbGxXaWR0aCA+IHRhcmdldC5jbGllbnRXaWR0aCB8fCBbc3R5bGUub3ZlcmZsb3csIHN0eWxlLm92ZXJmbG93WF0uaW5kZXhPZignc2Nyb2xsJykgPj0gMCB8fCB0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgIHZhciBzY3JvbGxCb3R0b20gPSAwO1xuICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcbiAgICAgICAgICAgIHNjcm9sbEJvdHRvbSA9IDE1O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICB3aWR0aDogMTUsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckxlZnRXaWR0aCkgLSAxNVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgZml0QWRqID0gMDtcbiAgICAgICAgICBpZiAoaGVpZ2h0IDwgNDA4ICYmIHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBmaXRBZGogPSAtMC4wMDAxMSAqIE1hdGgucG93KGhlaWdodCwgMikgLSAwLjAwNzI3ICogaGVpZ2h0ICsgMjIuNTg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzY3JvbGxQZXJjZW50YWdlID0gdGhpcy50YXJnZXQuc2Nyb2xsVG9wIC8gKHRhcmdldC5zY3JvbGxIZWlnaHQgLSBoZWlnaHQpO1xuICAgICAgICAgIG91dC50b3AgPSBzY3JvbGxQZXJjZW50YWdlICogKGhlaWdodCAtIG91dC5oZWlnaHQgLSBmaXRBZGopICsgYm91bmRzLnRvcCArIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NsZWFyQ2FjaGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhY2hlKGssIGdldHRlcikge1xuICAgICAgLy8gTW9yZSB0aGFuIG9uZSBtb2R1bGUgd2lsbCBvZnRlbiBuZWVkIHRoZSBzYW1lIERPTSBpbmZvLCBzb1xuICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlW2tdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZVtrXSA9IGdldHRlci5jYWxsKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVba107XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZW5hYmxlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZW5hYmxlKCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgfVxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50ICE9PSBfdGhpczMudGFyZ2V0Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICBwYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXMzLnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rpc2FibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNhYmxlKCkge1xuICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgICAgcGFyZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIF90aGlzNC5wb3NpdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rlc3Ryb3knLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG4gICAgICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlciwgaSkge1xuICAgICAgICBpZiAodGV0aGVyID09PSBfdGhpczUpIHtcbiAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgd2Ugd2VyZSB1c2luZyBmb3IgY29udmVuaWVuY2UgZnJvbSB0aGUgRE9NXG4gICAgICBpZiAodGV0aGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVtb3ZlVXRpbEVsZW1lbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndXBkYXRlQXR0YWNoQ2xhc3NlcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG4gICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgZWxlbWVudEF0dGFjaCA9IGVsZW1lbnRBdHRhY2ggfHwgdGhpcy5hdHRhY2htZW50O1xuICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcbiAgICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAnYm90dG9tJywgJ3JpZ2h0JywgJ21pZGRsZScsICdjZW50ZXInXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNsZWFuIHVwIGFmdGVyIG91cnNlbHZlcyBzdWNoIHRoYXQgd2hlbiB0aGUgbGFzdCBkZWZlciBnZXRzXG4gICAgICAgIC8vIHJhbiBpdCBkb2Vzbid0IGFkZCBhbnkgZXh0cmEgY2xhc3NlcyBmcm9tIHByZXZpb3VzIGNhbGxzLlxuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFkZCA9IHRoaXMuX2FkZEF0dGFjaENsYXNzZXM7XG5cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gubGVmdCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC50b3ApO1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLmxlZnQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgYWxsID0gW107XG4gICAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghKHR5cGVvZiBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM2LmVsZW1lbnQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgaWYgKCEoX3RoaXM2Lm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYudGFyZ2V0LCBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncG9zaXRpb24nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICB2YXIgZmx1c2hDaGFuZ2VzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcbiAgICAgIC8vIHRldGhlcnMgKGluIHdoaWNoIGNhc2UgY2FsbCBUZXRoZXIuVXRpbHMuZmx1c2ggeW91cnNlbGYgd2hlbiB5b3UncmUgZG9uZSlcblxuICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcblxuICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2VcbiAgICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gYXV0b1RvRml4ZWRBdHRhY2htZW50KHRoaXMudGFyZ2V0QXR0YWNobWVudCwgdGhpcy5hdHRhY2htZW50KTtcblxuICAgICAgdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKHRoaXMuYXR0YWNobWVudCwgdGFyZ2V0QXR0YWNobWVudCk7XG5cbiAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXM3LmVsZW1lbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG4gICAgICB2YXIgaGVpZ2h0ID0gZWxlbWVudFBvcy5oZWlnaHQ7XG5cbiAgICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG4gICAgICAgIC8vIFdlIGNhY2hlIHRoZSBoZWlnaHQgYW5kIHdpZHRoIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gcG9zaXRpb24gZWxlbWVudHMgdGhhdCBhcmVcbiAgICAgICAgLy8gZ2V0dGluZyBoaWRkZW4uXG4gICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuICAgICAgfVxuXG4gICAgICB2YXIgdGFyZ2V0UG9zID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzNy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHRhcmdldFNpemUgPSB0YXJnZXRQb3M7XG5cbiAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcbiAgICAgIHZhciBvZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0aGlzLmF0dGFjaG1lbnQpLCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgdGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeChhdHRhY2htZW50VG9PZmZzZXQodGFyZ2V0QXR0YWNobWVudCksIHRhcmdldFNpemUpO1xuXG4gICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgICAgdmFyIG1hbnVhbFRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy50YXJnZXRPZmZzZXQsIHRhcmdldFNpemUpO1xuXG4gICAgICAvLyBBZGQgdGhlIG1hbnVhbGx5IHByb3ZpZGVkIG9mZnNldFxuICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcbiAgICAgIHRhcmdldE9mZnNldCA9IGFkZE9mZnNldCh0YXJnZXRPZmZzZXQsIG1hbnVhbFRhcmdldE9mZnNldCk7XG5cbiAgICAgIC8vIEl0J3Mgbm93IG91ciBnb2FsIHRvIG1ha2UgKGVsZW1lbnQgcG9zaXRpb24gKyBvZmZzZXQpID09ICh0YXJnZXQgcG9zaXRpb24gKyB0YXJnZXQgb2Zmc2V0KVxuICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG4gICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcCArIHRhcmdldE9mZnNldC50b3AgLSBvZmZzZXQudG9wO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRldGhlckJhc2UubW9kdWxlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG4gICAgICAgIHZhciByZXQgPSBfbW9kdWxlMi5wb3NpdGlvbi5jYWxsKHRoaXMsIHtcbiAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRhcmdldEF0dGFjaG1lbnQsXG4gICAgICAgICAgdGFyZ2V0UG9zOiB0YXJnZXRQb3MsXG4gICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcbiAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICB0YXJnZXRPZmZzZXQ6IHRhcmdldE9mZnNldCxcbiAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcbiAgICAgICAgICBtYW51YWxUYXJnZXRPZmZzZXQ6IG1hbnVhbFRhcmdldE9mZnNldCxcbiAgICAgICAgICBzY3JvbGxiYXJTaXplOiBzY3JvbGxiYXJTaXplLFxuICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmV0ID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmV0ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcmV0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcCA9IHJldC50b3A7XG4gICAgICAgICAgbGVmdCA9IHJldC5sZWZ0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGRlc2NyaWJlIHRoZSBwb3NpdGlvbiB0aHJlZSBkaWZmZXJlbnQgd2F5cyB0byBnaXZlIHRoZSBvcHRpbWl6ZXJcbiAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggdGhlIGZld2VzdCByZXBhaW50cy5cbiAgICAgIHZhciBuZXh0ID0ge1xuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIGJvZHkpXG4gICAgICAgIHBhZ2U6IHtcbiAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICBsZWZ0OiBsZWZ0XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgICB2aWV3cG9ydDoge1xuICAgICAgICAgIHRvcDogdG9wIC0gcGFnZVlPZmZzZXQsXG4gICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IGxlZnQgLSBwYWdlWE9mZnNldCxcbiAgICAgICAgICByaWdodDogcGFnZVhPZmZzZXQgLSBsZWZ0IC0gd2lkdGggKyBpbm5lcldpZHRoXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBkb2MgPSB0aGlzLnRhcmdldC5vd25lckRvY3VtZW50O1xuICAgICAgdmFyIHdpbiA9IGRvYy5kZWZhdWx0VmlldztcblxuICAgICAgdmFyIHNjcm9sbGJhclNpemUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAod2luLmlubmVySGVpZ2h0ID4gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBpZiAod2luLmlubmVyV2lkdGggPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuICAgICAgICBuZXh0LnZpZXdwb3J0LnJpZ2h0IC09IHNjcm9sbGJhclNpemUud2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmIChbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEgfHwgWycnLCAnc3RhdGljJ10uaW5kZXhPZihkb2MuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gQWJzb2x1dGUgcG9zaXRpb25pbmcgaW4gdGhlIGJvZHkgd2lsbCBiZSByZWxhdGl2ZSB0byB0aGUgcGFnZSwgbm90IHRoZSAnaW5pdGlhbCBjb250YWluaW5nIGJsb2NrJ1xuICAgICAgICBuZXh0LnBhZ2UuYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuICAgICAgICBuZXh0LnBhZ2UucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIGxlZnQgLSB3aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMubW92ZUVsZW1lbnQgIT09IGZhbHNlICYmICEodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczcuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzNy50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTaXplID0gb2Zmc2V0UG9zaXRpb247XG5cbiAgICAgICAgICB2YXIgb2Zmc2V0Qm9yZGVyID0ge307XG4gICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBvZmZzZXRCb3JkZXJbc2lkZS50b0xvd2VyQ2FzZSgpXSA9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50U3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgLSBvZmZzZXRQYXJlbnRTaXplLndpZHRoICsgb2Zmc2V0Qm9yZGVyLnJpZ2h0O1xuICAgICAgICAgIG9mZnNldFBvc2l0aW9uLmJvdHRvbSA9IGRvYy5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuICAgICAgICAgIGlmIChuZXh0LnBhZ2UudG9wID49IG9mZnNldFBvc2l0aW9uLnRvcCArIG9mZnNldEJvcmRlci50b3AgJiYgbmV4dC5wYWdlLmJvdHRvbSA+PSBvZmZzZXRQb3NpdGlvbi5ib3R0b20pIHtcbiAgICAgICAgICAgIGlmIChuZXh0LnBhZ2UubGVmdCA+PSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0Qm9yZGVyLmxlZnQgJiYgbmV4dC5wYWdlLnJpZ2h0ID49IG9mZnNldFBvc2l0aW9uLnJpZ2h0KSB7XG4gICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICB2YXIgc2Nyb2xsTGVmdCA9IG9mZnNldFBhcmVudC5zY3JvbGxMZWZ0O1xuXG4gICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgbW92ZWQgdG8gYmUgYSBjaGlsZCBvZiB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCkuXG4gICAgICAgICAgICAgIG5leHQub2Zmc2V0ID0ge1xuICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogbmV4dC5wYWdlLmxlZnQgLSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgc2Nyb2xsTGVmdCAtIG9mZnNldEJvcmRlci5sZWZ0XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBjb3VsZCBhbHNvIHRyYXZlbCB1cCB0aGUgRE9NIGFuZCB0cnkgZWFjaCBjb250YWluaW5nIGNvbnRleHQsIHJhdGhlciB0aGFuIG9ubHlcbiAgICAgIC8vIGxvb2tpbmcgYXQgdGhlIGJvZHksIGJ1dCB3ZSdyZSBnb25uYSBnZXQgZGltaW5pc2hpbmcgcmV0dXJucy5cblxuICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG4gICAgICB0aGlzLmhpc3RvcnkudW5zaGlmdChuZXh0KTtcblxuICAgICAgaWYgKHRoaXMuaGlzdG9yeS5sZW5ndGggPiAzKSB7XG4gICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZsdXNoQ2hhbmdlcykge1xuICAgICAgICBmbHVzaCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUSEUgSVNTVUVcbiAgfSwge1xuICAgIGtleTogJ21vdmUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKHBvcykge1xuICAgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cbiAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHNhbWUgPSB7fTtcblxuICAgICAgZm9yICh2YXIgdHlwZSBpbiBwb3MpIHtcbiAgICAgICAgc2FtZVt0eXBlXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcbiAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaXN0b3J5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvaW50W3R5cGVdICE9PSAndW5kZWZpbmVkJyAmJiAhd2l0aGluKHBvaW50W3R5cGVdW2tleV0sIHBvc1t0eXBlXVtrZXldKSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHNhbWVbdHlwZV1ba2V5XSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjc3MgPSB7IHRvcDogJycsIGxlZnQ6ICcnLCByaWdodDogJycsIGJvdHRvbTogJycgfTtcblxuICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG4gICAgICAgIHZhciBoYXNPcHRpbWl6YXRpb25zID0gdHlwZW9mIF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgZ3B1ID0gaGFzT3B0aW1pemF0aW9ucyA/IF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMuZ3B1IDogbnVsbDtcbiAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB2YXIgeVBvcyA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgeFBvcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSBfcG9zLnRvcDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IDA7XG4gICAgICAgICAgICB5UG9zID0gLV9wb3MuYm90dG9tO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSAwO1xuICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgICAgICAgICAgLy8gSHViU3BvdC90ZXRoZXIjMjA3XG4gICAgICAgICAgICB2YXIgcmV0aW5hID0gd2luZG93Lm1hdGNoTWVkaWEoJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDEuM2RwcHgpJykubWF0Y2hlcyB8fCB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDEuMyknKS5tYXRjaGVzO1xuICAgICAgICAgICAgaWYgKCFyZXRpbmEpIHtcbiAgICAgICAgICAgICAgeFBvcyA9IE1hdGgucm91bmQoeFBvcyk7XG4gICAgICAgICAgICAgIHlQb3MgPSBNYXRoLnJvdW5kKHlQb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldID0gJ3RyYW5zbGF0ZVgoJyArIHhQb3MgKyAncHgpIHRyYW5zbGF0ZVkoJyArIHlQb3MgKyAncHgpJztcblxuICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcbiAgICAgICAgICAgIC8vIFRoZSBaIHRyYW5zZm9ybSB3aWxsIGtlZXAgdGhpcyBpbiB0aGUgR1BVIChmYXN0ZXIsIGFuZCBwcmV2ZW50cyBhcnRpZmFjdHMpLFxuICAgICAgICAgICAgLy8gYnV0IElFOSBkb2Vzbid0IHN1cHBvcnQgM2QgdHJhbnNmb3JtcyBhbmQgd2lsbCBjaG9rZS5cbiAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuICAgICAgICAgICAgY3NzLnRvcCA9IF9wb3MudG9wICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4JztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX3NhbWUubGVmdCkge1xuICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSBfcG9zLnJpZ2h0ICsgJ3B4JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuICAgICAgaWYgKChzYW1lLnBhZ2UudG9wIHx8IHNhbWUucGFnZS5ib3R0b20pICYmIChzYW1lLnBhZ2UubGVmdCB8fCBzYW1lLnBhZ2UucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG4gICAgICB9IGVsc2UgaWYgKChzYW1lLnZpZXdwb3J0LnRvcCB8fCBzYW1lLnZpZXdwb3J0LmJvdHRvbSkgJiYgKHNhbWUudmlld3BvcnQubGVmdCB8fCBzYW1lLnZpZXdwb3J0LnJpZ2h0KSkge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzYW1lLm9mZnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2FtZS5vZmZzZXQudG9wICYmIHNhbWUub2Zmc2V0LmxlZnQpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczguY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGdldE9mZnNldFBhcmVudChfdGhpczguZWxlbWVudCkgIT09IG9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBfdGhpczguZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50LmFwcGVuZENoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5vZmZzZXQsIHBvcy5vZmZzZXQpO1xuICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW1vdmVkKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50SXNCb2R5ID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICB3aGlsZSAoY3VycmVudE5vZGUgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IDEgJiYgY3VycmVudE5vZGUudGFnTmFtZSAhPT0gJ0JPRFknKSB7XG4gICAgICAgICAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZShjdXJyZW50Tm9kZSkucG9zaXRpb24gIT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICAgIG9mZnNldFBhcmVudElzQm9keSA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghb2Zmc2V0UGFyZW50SXNCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBbnkgY3NzIGNoYW5nZSB3aWxsIHRyaWdnZXIgYSByZXBhaW50LCBzbyBsZXQncyBhdm9pZCBvbmUgaWYgbm90aGluZyBjaGFuZ2VkXG4gICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcbiAgICAgIHZhciB3cml0ZSA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIga2V5IGluIGNzcykge1xuICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG4gICAgICAgIHZhciBlbFZhbCA9IHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuXG4gICAgICAgIGlmIChlbFZhbCAhPT0gdmFsKSB7XG4gICAgICAgICAgd3JpdGUgPSB0cnVlO1xuICAgICAgICAgIHdyaXRlQ1NTW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHdyaXRlKSB7XG4gICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBleHRlbmQoX3RoaXM4LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcbiAgICAgICAgICBfdGhpczgudHJpZ2dlcigncmVwb3NpdGlvbmVkJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBUZXRoZXJDbGFzcztcbn0pKEV2ZW50ZWQpO1xuXG5UZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblRldGhlckJhc2UucG9zaXRpb24gPSBwb3NpdGlvbjtcblxudmFyIFRldGhlciA9IGV4dGVuZChUZXRoZXJDbGFzcywgVGV0aGVyQmFzZSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cbnZhciBCT1VORFNfRk9STUFUID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcbiAgaWYgKHRvID09PSAnc2Nyb2xsUGFyZW50Jykge1xuICAgIHRvID0gdGV0aGVyLnNjcm9sbFBhcmVudHNbMF07XG4gIH0gZWxzZSBpZiAodG8gPT09ICd3aW5kb3cnKSB7XG4gICAgdG8gPSBbcGFnZVhPZmZzZXQsIHBhZ2VZT2Zmc2V0LCBpbm5lcldpZHRoICsgcGFnZVhPZmZzZXQsIGlubmVySGVpZ2h0ICsgcGFnZVlPZmZzZXRdO1xuICB9XG5cbiAgaWYgKHRvID09PSBkb2N1bWVudCkge1xuICAgIHRvID0gdG8uZG9jdW1lbnRFbGVtZW50O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB0by5ub2RlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5vZGUgPSB0bztcbiAgICAgIHZhciBzaXplID0gZ2V0Qm91bmRzKHRvKTtcbiAgICAgIHZhciBwb3MgPSBzaXplO1xuICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cbiAgICAgIHRvID0gW3Bvcy5sZWZ0LCBwb3MudG9wLCBzaXplLndpZHRoICsgcG9zLmxlZnQsIHNpemUuaGVpZ2h0ICsgcG9zLnRvcF07XG5cbiAgICAgIC8vIEFjY291bnQgYW55IHBhcmVudCBGcmFtZXMgc2Nyb2xsIG9mZnNldFxuICAgICAgaWYgKG5vZGUub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICAgICAgdG9bMF0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1sxXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICAgIHRvWzJdICs9IHdpbi5wYWdlWE9mZnNldDtcbiAgICAgICAgdG9bM10gKz0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcbiAgICAgICAgc2lkZSA9IHNpZGVbMF0udG9VcHBlckNhc2UoKSArIHNpZGUuc3Vic3RyKDEpO1xuICAgICAgICBpZiAoc2lkZSA9PT0gJ1RvcCcgfHwgc2lkZSA9PT0gJ0xlZnQnKSB7XG4gICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9baV0gLT0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH1cblxuICByZXR1cm4gdG87XG59XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gX3JlZi50YXJnZXRBdHRhY2htZW50O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cbiAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgaXRlbSBnZXR0aW5nIGhpZGRlbiBhcyBhIHJlc3VsdCBvZiBvdXIgcG9zaXRpb25pbmcgd2l0aG91dCBnbGl0Y2hpbmdcbiAgICAgIC8vIHRoZSBjbGFzc2VzIGluIGFuZCBvdXRcbiAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3RoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG4gICAgfSk7XG5cbiAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG4gICAgdmFyIHRhcmdldFdpZHRoID0gdGFyZ2V0U2l6ZS53aWR0aDtcblxuICAgIHZhciBhbGxDbGFzc2VzID0gW3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpLCB0aGlzLmdldENsYXNzKCdvdXQtb2YtYm91bmRzJyldO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciBvdXRPZkJvdW5kc0NsYXNzID0gY29uc3RyYWludC5vdXRPZkJvdW5kc0NsYXNzO1xuICAgICAgdmFyIHBpbm5lZENsYXNzID0gY29uc3RyYWludC5waW5uZWRDbGFzcztcblxuICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKG91dE9mQm91bmRzQ2xhc3MpO1xuICAgICAgfVxuICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhbGxDbGFzc2VzLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciB0QXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGFyZ2V0QXR0YWNobWVudCk7XG4gICAgdmFyIGVBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciB0byA9IGNvbnN0cmFpbnQudG87XG4gICAgICB2YXIgYXR0YWNobWVudCA9IGNvbnN0cmFpbnQuYXR0YWNobWVudDtcbiAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuICAgICAgaWYgKHR5cGVvZiBhdHRhY2htZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBhdHRhY2htZW50ID0gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGFuZ2VBdHRhY2hYID0gdW5kZWZpbmVkLFxuICAgICAgICAgIGNoYW5nZUF0dGFjaFkgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQgPSBhdHRhY2htZW50LnNwbGl0KCcgJyk7XG5cbiAgICAgICAgdmFyIF9hdHRhY2htZW50JHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF9hdHRhY2htZW50JHNwbGl0LCAyKTtcblxuICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gX2F0dGFjaG1lbnQkc3BsaXQyWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuICAgICAgfVxuXG4gICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KF90aGlzLCB0byk7XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0b2dldGhlcicpIHtcbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdG9wIC0gKGhlaWdodCAtIHRhcmdldEhlaWdodCkgPj0gYm91bmRzWzFdKSB7XG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcgJiYgdG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScgJiYgdG9wIDwgYm91bmRzWzFdICYmIHRvcCArIChoZWlnaHQgKiAyIC0gdGFyZ2V0SGVpZ2h0KSA8PSBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ21pZGRsZScpIHtcbiAgICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodEF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBwaW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgIHJldHVybiBwLnRyaW0oKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuICAgICAgICBwaW4gPSBbJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuICAgICAgfVxuXG4gICAgICBwaW4gPSBwaW4gfHwgW107XG5cbiAgICAgIHZhciBwaW5uZWQgPSBbXTtcbiAgICAgIHZhciBvb2IgPSBbXTtcblxuICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ3RvcCcpID49IDApIHtcbiAgICAgICAgICB0b3AgPSBib3VuZHNbMV07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCd0b3AnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1szXSAtIGhlaWdodDtcbiAgICAgICAgICBwaW5uZWQucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2JvdHRvbScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignbGVmdCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdsZWZ0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgICAgbGVmdCA9IGJvdW5kc1syXSAtIHdpZHRoO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwaW5uZWQubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHBpbm5lZENsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygncGlubmVkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgICAgICBwaW5uZWQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvb2IubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuICAgICAgICAgIG9vYi5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSB0QXR0YWNobWVudC5sZWZ0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gdEF0dGFjaG1lbnQudG9wID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuICAgICAgICBfdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKGVBdHRhY2htZW50LCB0QXR0YWNobWVudCk7XG4gICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZScsIHtcbiAgICAgICAgICBhdHRhY2htZW50OiBlQXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiB0QXR0YWNobWVudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmdldFRhcmdldEJvdW5kcygpO1xuXG4gICAgdmFyIGJvdHRvbSA9IHRvcCArIGhlaWdodDtcbiAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cbiAgICB2YXIgYWJ1dHRlZCA9IFtdO1xuICAgIGlmICh0b3AgPD0gdGFyZ2V0UG9zLmJvdHRvbSAmJiBib3R0b20gPj0gdGFyZ2V0UG9zLnRvcCkge1xuICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IGxlZnQgfHwgdGFyZ2V0UG9zU2lkZSA9PT0gcmlnaHQpIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChsZWZ0IDw9IHRhcmdldFBvcy5yaWdodCAmJiByaWdodCA+PSB0YXJnZXRQb3MubGVmdCkge1xuICAgICAgWyd0b3AnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IHRvcCB8fCB0YXJnZXRQb3NTaWRlID09PSBib3R0b20pIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBhbGxDbGFzc2VzID0gW107XG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgYWxsQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICB9KTtcblxuICAgIGlmIChhYnV0dGVkLmxlbmd0aCkge1xuICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgfVxuXG4gICAgYWJ1dHRlZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hpZnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQ7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0LmNhbGwodGhpcywgeyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9KTtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG4gICAgICAgIHNoaWZ0TGVmdCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHNoaWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuICAgICAgc2hpZnRbMV0gPSBzaGlmdFsxXSB8fCBzaGlmdFswXTtcblxuICAgICAgdmFyIF9zaGlmdCA9IHNoaWZ0O1xuXG4gICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cbiAgICAgIHNoaWZ0VG9wID0gX3NoaWZ0MlswXTtcbiAgICAgIHNoaWZ0TGVmdCA9IF9zaGlmdDJbMV07XG5cbiAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuICAgICAgc2hpZnRMZWZ0ID0gcGFyc2VGbG9hdChzaGlmdExlZnQsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG4gICAgICBzaGlmdExlZnQgPSBzaGlmdC5sZWZ0O1xuICAgIH1cblxuICAgIHRvcCArPSBzaGlmdFRvcDtcbiAgICBsZWZ0ICs9IHNoaWZ0TGVmdDtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xucmV0dXJuIFRldGhlcjtcblxufSkpO1xuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vZ2VvbS9Qb2ludFwiO1xyXG5pbXBvcnQge1JlY3R9IGZyb20gXCIuL2dlb20vUmVjdFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkQ2VsbH0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENlbGxcIjtcclxuaW1wb3J0IHtEZWZhdWx0R3JpZENvbHVtbn0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtblwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkTW9kZWx9IGZyb20gXCIuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRNb2RlbFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkUm93fSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkUm93XCI7XHJcbmltcG9ydCB7U3R5bGV9IGZyb20gXCIuL21vZGVsL3N0eWxlZC9TdHlsZVwiO1xyXG5pbXBvcnQge1N0eWxlZEdyaWRDZWxsfSBmcm9tIFwiLi9tb2RlbC9zdHlsZWQvU3R5bGVkR3JpZENlbGxcIjtcclxuaW1wb3J0IHtHcmlkUmFuZ2V9IGZyb20gXCIuL21vZGVsL0dyaWRSYW5nZVwiO1xyXG5pbXBvcnQge0dyaWRFbGVtZW50fSBmcm9tIFwiLi91aS9HcmlkRWxlbWVudFwiO1xyXG5pbXBvcnQge0dyaWRLZXJuZWx9IGZyb20gXCIuL3VpL0dyaWRLZXJuZWxcIjtcclxuaW1wb3J0IHtBYnNXaWRnZXRCYXNlfSBmcm9tIFwiLi91aS9XaWRnZXRcIjtcclxuaW1wb3J0IHtFdmVudEVtaXR0ZXJCYXNlfSBmcm9tIFwiLi91aS9pbnRlcm5hbC9FdmVudEVtaXR0ZXJcIjtcclxuaW1wb3J0IHtjb21tYW5kLCB2YXJpYWJsZSwgcm91dGluZSwgcmVuZGVyZXIsIHZpc3VhbGl6ZX0gZnJvbSBcIi4vdWkvRXh0ZW5zaWJpbGl0eVwiO1xyXG5pbXBvcnQge0NsaXBib2FyZEV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21tb24vQ2xpcGJvYXJkRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7RWRpdGluZ0V4dGVuc2lvbiwgR3JpZENoYW5nZVNldH0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21tb24vRWRpdGluZ0V4dGVuc2lvblwiO1xyXG5pbXBvcnQge1Njcm9sbGVyRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9TY3JvbGxlckV4dGVuc2lvblwiO1xyXG5pbXBvcnQge1NlbGVjdG9yRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9TZWxlY3RvckV4dGVuc2lvblwiO1xyXG5pbXBvcnQge0hpc3RvcnlFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7RGVmYXVsdEhpc3RvcnlNYW5hZ2VyfSBmcm9tIFwiLi9leHRlbnNpb25zL2hpc3RvcnkvSGlzdG9yeU1hbmFnZXJcIjtcclxuaW1wb3J0IHtDb21wdXRlRW5naW5lfSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbXB1dGUvQ29tcHV0ZUVuZ2luZVwiO1xyXG5pbXBvcnQge0NvbXB1dGVFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7SmF2YVNjcmlwdENvbXB1dGVFbmdpbmV9IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZVwiO1xyXG5pbXBvcnQge1dhdGNoTWFuYWdlcn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL1dhdGNoTWFuYWdlclwiO1xyXG5pbXBvcnQge0NsaWNrWm9uZUV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9leHRyYS9DbGlja1pvbmVFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtCYXNlMjZ9IGZyb20gXCIuL21pc2MvQmFzZTI2XCI7XHJcblxyXG5cclxuKGZ1bmN0aW9uKGV4dDphbnkpIHtcclxuXHJcbiAgICBleHQuQ2xpcGJvYXJkRXh0ZW5zaW9uID0gQ2xpcGJvYXJkRXh0ZW5zaW9uO1xyXG4gICAgZXh0LkVkaXRpbmdFeHRlbnNpb24gPSBFZGl0aW5nRXh0ZW5zaW9uOyAgICBcclxuICAgIGV4dC5TY3JvbGxlckV4dGVuc2lvbiA9IFNjcm9sbGVyRXh0ZW5zaW9uO1xyXG4gICAgZXh0LlNlbGVjdG9yRXh0ZW5zaW9uID0gU2VsZWN0b3JFeHRlbnNpb247XHJcbiAgICBleHQuSGlzdG9yeUV4dGVuc2lvbiA9IEhpc3RvcnlFeHRlbnNpb247XHJcbiAgICBleHQuRGVmYXVsdEhpc3RvcnlNYW5hZ2VyID0gRGVmYXVsdEhpc3RvcnlNYW5hZ2VyO1xyXG4gICAgZXh0LkNvbXB1dGVFeHRlbnNpb24gPSBDb21wdXRlRXh0ZW5zaW9uO1xyXG4gICAgZXh0LkphdmFTY3JpcHRDb21wdXRlRW5naW5lID0gSmF2YVNjcmlwdENvbXB1dGVFbmdpbmU7XHJcbiAgICBleHQuV2F0Y2hNYW5hZ2VyID0gV2F0Y2hNYW5hZ2VyO1xyXG4gICAgZXh0LkNsaWNrWm9uZUV4dGVuc2lvbiA9IENsaWNrWm9uZUV4dGVuc2lvbjtcclxuICAgIGV4dC5Qb2ludCA9IFBvaW50O1xyXG4gICAgZXh0LlJlY3QgPSBSZWN0O1xyXG4gICAgZXh0LkJhc2UyNiA9IEJhc2UyNjtcclxuICAgIGV4dC5EZWZhdWx0R3JpZENlbGwgPSBEZWZhdWx0R3JpZENlbGw7XHJcbiAgICBleHQuRGVmYXVsdEdyaWRDb2x1bW4gPSBEZWZhdWx0R3JpZENvbHVtbjtcclxuICAgIGV4dC5EZWZhdWx0R3JpZE1vZGVsID0gRGVmYXVsdEdyaWRNb2RlbDtcclxuICAgIGV4dC5EZWZhdWx0R3JpZFJvdyA9IERlZmF1bHRHcmlkUm93O1xyXG4gICAgZXh0LlN0eWxlID0gU3R5bGU7XHJcbiAgICBleHQuU3R5bGVkR3JpZENlbGwgPSBTdHlsZWRHcmlkQ2VsbDtcclxuICAgIGV4dC5HcmlkQ2hhbmdlU2V0ID0gR3JpZENoYW5nZVNldDtcclxuICAgIGV4dC5HcmlkUmFuZ2UgPSBHcmlkUmFuZ2U7XHJcbiAgICBleHQuR3JpZEVsZW1lbnQgPSBHcmlkRWxlbWVudDtcclxuICAgIGV4dC5HcmlkS2VybmVsID0gR3JpZEtlcm5lbDtcclxuICAgIGV4dC5BYnNXaWRnZXRCYXNlID0gQWJzV2lkZ2V0QmFzZTtcclxuICAgIGV4dC5FdmVudEVtaXR0ZXJCYXNlID0gRXZlbnRFbWl0dGVyQmFzZTtcclxuICAgIGV4dC5jb21tYW5kID0gY29tbWFuZDtcclxuICAgIGV4dC52YXJpYWJsZSA9IHZhcmlhYmxlO1xyXG4gICAgZXh0LnJvdXRpbmUgPSByb3V0aW5lO1xyXG4gICAgZXh0LnJlbmRlcmVyID0gcmVuZGVyZXI7XHJcbiAgICBleHQudmlzdWFsaXplID0gdmlzdWFsaXplO1xyXG4gICAgXHJcbn0pKHdpbmRvd1snY2F0dGxlJ10gfHwgKHdpbmRvd1snY2F0dGxlJ10gPSB7fSkpOyIsImltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZFJhbmdlIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJhbmdlJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgU2VsZWN0b3JXaWRnZXQgfSBmcm9tICcuL1NlbGVjdG9yRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgQWJzV2lkZ2V0QmFzZSB9IGZyb20gJy4uLy4uL3VpL1dpZGdldCc7XHJcbmltcG9ydCB7IHZhcmlhYmxlLCBjb21tYW5kLCByb3V0aW5lIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuaW1wb3J0ICogYXMgUGFwYSBmcm9tICdwYXBhcGFyc2UnO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgY2xpcGJvYXJkIGZyb20gJ2NsaXBib2FyZC1qcyc7XHJcblxyXG5cclxuLy9JIGtub3cuLi4gOihcclxuLy9jb25zdCBOZXdMaW5lID0gISF3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKC8uKltXd11bSWldW05uXS4qLykgPyAnXFxyXFxuJyA6ICdcXG4nO1xyXG5jb25zdCBOZXdMaW5lID0gJ1xcclxcbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpcGJvYXJkRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgY29weUxpc3Q6c3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgY29weVJhbmdlOkdyaWRSYW5nZSA9IEdyaWRSYW5nZS5lbXB0eSgpO1xyXG5cclxuICAgIEB2YXJpYWJsZSgpXHJcbiAgICBwcml2YXRlIGNvcHlOZXQ6Q29weU5ldDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX0MnLCAoZTpLZXlib2FyZEV2ZW50KSA9PiB0aGlzLmNvcHlTZWxlY3Rpb24oKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMub25XaW5kb3dQYXN0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnbk5ldCgpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6YmVnaW5FZGl0JywgKCkgPT4gdGhpcy5yZXNldENvcHkoKSk7XHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsICgpID0+IHRoaXMucmVzZXRDb3B5KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IGNhcHR1cmVTZWxlY3RvcigpOlNlbGVjdG9yV2lkZ2V0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnY2FwdHVyZVNlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgc2VsZWN0aW9uKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5jb3B5TmV0ID0gQ29weU5ldC5jcmVhdGUobGF5ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgY29weVNlbGVjdGlvbigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQ29weSh0aGlzLnNlbGVjdGlvbik7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgcmVzZXRDb3B5KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9Db3B5KFtdKTtcclxuICAgICAgICB0aGlzLmFsaWduTmV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb0NvcHkoY2VsbHM6c3RyaW5nW10sIGRlbGltaXRlcjpzdHJpbmcgPSAnXFx0Jyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY29weUxpc3QgPSBjZWxscztcclxuICAgICAgICBsZXQgcmFuZ2UgPSB0aGlzLmNvcHlSYW5nZSA9IEdyaWRSYW5nZS5jcmVhdGUodGhpcy5ncmlkLm1vZGVsLCBjZWxscyk7XHJcbiAgICAgICAgbGV0IHRleHQgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCFjZWxscy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHJyID0gcmFuZ2UubHRyWzBdLnJvd1JlZjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlLmx0ci5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjID0gcmFuZ2UubHRyW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJyICE9PSBjLnJvd1JlZilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBOZXdMaW5lO1xyXG4gICAgICAgICAgICAgICAgcnIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBjLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCAocmFuZ2UubHRyLmxlbmd0aCAtIDEpICYmIHJhbmdlLmx0cltpICsgMV0ucm93UmVmID09PSBycilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBkZWxpbWl0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xpcGJvYXJkLmNvcHkodGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb1Bhc3RlKHRleHQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb24uZmlsdGVyKHggPT4gIWlzX3JlYWRvbmx5KGdyaWQubW9kZWwuZmluZENlbGwoeCkpKTtcclxuXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBmb2N1c2VkQ2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwoc2VsZWN0aW9uWzBdKTtcclxuXHJcbiAgICAgICAgbGV0IHBhcnNlZCA9IFBhcGEucGFyc2UodGV4dCwge1xyXG4gICAgICAgICAgICBkZWxpbWl0ZXI6IHRleHQuaW5kZXhPZignXFx0JykgPj0gMCA/ICdcXHQnIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IHBhcnNlZC5kYXRhLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMSB8fCAoeC5sZW5ndGggPT0gMSAmJiAhIXhbMF0pKTtcclxuICAgICAgICBpZiAoIWRhdGEubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8ubWF4KGRhdGEsIHggPT4geC5sZW5ndGgpLmxlbmd0aDtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IHN0YXJ0VmVjdG9yID0gbmV3IFBvaW50KGZvY3VzZWRDZWxsLmNvbFJlZiwgZm9jdXNlZENlbGwucm93UmVmKTtcclxuICAgICAgICBsZXQgZW5kVmVjdG9yID0gc3RhcnRWZWN0b3IuYWRkKG5ldyBQb2ludCh3aWR0aCwgaGVpZ2h0KSk7XHJcblxyXG4gICAgICAgIGxldCBwYXN0ZVJhbmdlID0gR3JpZFJhbmdlLmNhcHR1cmUoZ3JpZC5tb2RlbCwgc3RhcnRWZWN0b3IsIGVuZFZlY3Rvcik7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VzID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHBhc3RlUmFuZ2UubHRyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHh5ID0gbmV3IFBvaW50KGNlbGwuY29sUmVmLCBjZWxsLnJvd1JlZikuc3VidHJhY3Qoc3RhcnRWZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBkYXRhW3h5LnldW3h5LnhdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgY2hhbmdlcy5wdXQoY2VsbC5yZWYsIHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3QnLCBwYXN0ZVJhbmdlLmx0ci5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25OZXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgY29weUxpc3QsIGNvcHlOZXQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChjb3B5TGlzdC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBuZXRSZWN0ID0gUmVjdC5mcm9tTWFueShjb3B5TGlzdC5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjb3B5TmV0LmdvdG8obmV0UmVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uV2luZG93UGFzdGUoZTpDbGlwYm9hcmRFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcbiAgICAgICAgd2hpbGUgKCEhYWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoYWUgPT0gdGhpcy5ncmlkLnJvb3QpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGFlID0gYWUucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYWUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9wbGFpbicpO1xyXG4gICAgICAgIGlmICh0ZXh0ICE9PSBudWxsICYmIHRleHQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9QYXN0ZSh0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb3B5TmV0IGV4dGVuZHMgQWJzV2lkZ2V0QmFzZTxIVE1MRGl2RWxlbWVudD5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoY29udGFpbmVyOkhUTUxFbGVtZW50KTpDb3B5TmV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLW5ldCBncmlkLW5ldC1jb3B5JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb3B5TmV0KHJvb3QpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc19yZWFkb25seShjZWxsOkdyaWRDZWxsKTpib29sZWFuXHJcbntcclxuICAgIHJldHVybiBjZWxsWydyZWFkb25seSddID09PSB0cnVlIHx8IGNlbGxbJ211dGFibGUnXSA9PT0gZmFsc2U7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IHZhbHVlcyB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEFic1dpZGdldEJhc2UsIFdpZGdldCB9IGZyb20gJy4uLy4uL3VpL1dpZGdldCc7XHJcbmltcG9ydCB7IGNvbW1hbmQsIHJvdXRpbmUsIHZhcmlhYmxlIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbmNvbnN0IFZlY3RvcnMgPSB7XHJcbiAgICBuOiBuZXcgUG9pbnQoMCwgLTEpLFxyXG4gICAgczogbmV3IFBvaW50KDAsIDEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEVkaXRFdmVudFxyXG57XHJcbiAgICBjaGFuZ2VzOkdyaWRDaGFuZ2VbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlXHJcbntcclxuICAgIHJlYWRvbmx5IGNlbGw6R3JpZENlbGw7XHJcbiAgICByZWFkb25seSB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWFkb25seSBjYXNjYWRlZD86Ym9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlU2V0VmlzaXRvclxyXG57XHJcbiAgICAocmVmOnN0cmluZywgdmFsOnN0cmluZywgY2FzY2FkZWQ6Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlU2V0SXRlbVxyXG57XHJcbiAgICByZWFkb25seSByZWY6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkQ2hhbmdlU2V0XHJcbntcclxuICAgIHByaXZhdGUgZGF0YTpPYmplY3RNYXA8R3JpZENoYW5nZVNldEl0ZW0+ID0ge307XHJcblxyXG4gICAgcHVibGljIGNvbnRlbnRzKCk6R3JpZENoYW5nZVNldEl0ZW1bXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZXModGhpcy5kYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0KHJlZjpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGxldCBlbnRyeSA9IHRoaXMuZGF0YVtyZWZdO1xyXG4gICAgICAgIHJldHVybiAhIWVudHJ5ID8gZW50cnkudmFsdWUgOiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHB1dChyZWY6c3RyaW5nLCB2YWx1ZTpzdHJpbmcsIGNhc2NhZGVkPzpib29sZWFuKTpHcmlkQ2hhbmdlU2V0XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3JlZl0gPSB7XHJcbiAgICAgICAgICAgIHJlZjogcmVmLFxyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIGNhc2NhZGVkOiAhIWNhc2NhZGVkLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWZzKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcGlsZShtb2RlbDpHcmlkTW9kZWwpOkdyaWRDaGFuZ2VbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRzKClcclxuICAgICAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBjZWxsOiBtb2RlbC5maW5kQ2VsbCh4LnJlZiksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogeC52YWx1ZSxcclxuICAgICAgICAgICAgICAgIGNhc2NhZGVkOiB4LmNhc2NhZGVkLFxyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheC5jYXNjYWRlZCB8fCAhaXNfcmVhZG9ubHkoeC5jZWxsKSlcclxuICAgICAgICA7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXRXaWRnZXQgZXh0ZW5kcyBXaWRnZXRcclxue1xyXG4gICAgZm9jdXMoKTp2b2lkO1xyXG4gICAgdmFsKHZhbHVlPzpzdHJpbmcpOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVkaXRpbmdFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBpbnB1dDpJbnB1dDtcclxuXHJcbiAgICBwcml2YXRlIGlzRWRpdGluZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcih0aGlzLmlucHV0LnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUVTQ0FQRScsICgpID0+IHRoaXMuZW5kRWRpdChmYWxzZSkpXHJcbiAgICAgICAgICAgIC5vbignIUVOVEVSJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVNISUZUK1RBQicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCdVUF9BUlJPVycsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCdET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJ1JJR0hUX0FSUk9XJywgKCkgPT4geyBpZiAoIXRoaXMuaXNFZGl0aW5nRGV0YWlsZWQpIHsgdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpOyB9IH0pXHJcbiAgICAgICAgICAgIC5vbignTEVGVF9BUlJPVycsICgpID0+IHsgaWYgKCF0aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy53KTsgfSB9KVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJ0RPV046UFJJTUFSWScsICgpID0+IHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSB0cnVlKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFERUxFVEUnLCAoKSA9PiB0aGlzLmVyYXNlKCkpXHJcbiAgICAgICAgICAgIC5vbignIUJBQ0tTUEFDRScsICgpID0+IHRoaXMuYmVnaW5FZGl0KCcnKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJ0RCTENMSUNLOlBSSU1BUlknLCAoKSA9PiB0aGlzLmJlZ2luRWRpdChudWxsKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHRoaXMuaW5wdXQucm9vdC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4geyB0aGlzLmVuZEVkaXQodHJ1ZSkgfSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2tleXByZXNzJywgKGU6R3JpZEtleWJvYXJkRXZlbnQpID0+IHRoaXMuYmVnaW5FZGl0KFN0cmluZy5mcm9tQ2hhckNvZGUoZS5jaGFyQ29kZSkpKTtcclxuXHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpkb1NlbGVjdCcsICgpID0+IHRoaXMuZW5kRWRpdCh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgcHJpbWFyeVNlbGVjdG9yKCk6U2VsZWN0b3JXaWRnZXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdwcmltYXJ5U2VsZWN0b3InKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmlucHV0ID0gSW5wdXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGJlZ2luRWRpdChvdmVycmlkZTpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeyBpbnB1dCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ3JpZC5tb2RlbC5maW5kQ2VsbCh0aGlzLnNlbGVjdGlvblswXSk7XHJcblxyXG4gICAgICAgIGlmIChpc19yZWFkb25seShjZWxsKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghIW92ZXJyaWRlIHx8IG92ZXJyaWRlID09PSAnJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChvdmVycmlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChjZWxsLnZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlucHV0LmdvdG8odGhpcy5wcmltYXJ5U2VsZWN0b3Iudmlld1JlY3QpO1xyXG4gICAgICAgIGlucHV0LmZvY3VzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZW5kRWRpdChjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCB7IGdyaWQsIGlucHV0LCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gaW5wdXQudmFsKCk7XHJcblxyXG4gICAgICAgIGlucHV0LmhpZGUoKTtcclxuICAgICAgICBpbnB1dC52YWwoJycpO1xyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbW1pdCAmJiAhIXNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLnNsaWNlKDAsIDEpLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmRFZGl0VG9OZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGNvbW1pdDpib29sZWFuID0gdHJ1ZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmVuZEVkaXQoY29tbWl0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0TmVpZ2hib3InLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVyYXNlKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbi5maWx0ZXIoeCA9PiAhaXNfcmVhZG9ubHkoZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSkpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLCAnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb21taXRVbmlmb3JtKGNlbGxzOnN0cmluZ1tdLCB1bmlmb3JtVmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgIGZvciAobGV0IHJlZiBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNoYW5nZXMucHV0KHJlZiwgdW5pZm9ybVZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdChjaGFuZ2VzKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZ3JpZDtcclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgaWYgKGNvbXBpbGVkLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnaW5wdXQnLCB7IGNoYW5nZXM6IGNvbXBpbGVkIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSW5wdXQgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxJbnB1dEVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6SW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgcm9vdC50eXBlID0gJ3RleHQnO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtaW5wdXQnO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgbWFyZ2luOiAnMCcsXHJcbiAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IElucHV0KHJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmdvdG8odmlld1JlY3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0ICsgMn1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wICsgMn1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9jdXMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcm9vdC5mb2N1cygpO1xyXG4gICAgICAgICAgICByb290LnNldFNlbGVjdGlvblJhbmdlKHJvb3QudmFsdWUubGVuZ3RoLCByb290LnZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC52YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNfcmVhZG9ubHkoY2VsbDpHcmlkQ2VsbCk6Ym9vbGVhblxyXG57XHJcbiAgICByZXR1cm4gY2VsbFsncmVhZG9ubHknXSA9PT0gdHJ1ZSB8fCBjZWxsWydtdXRhYmxlJ10gPT09IGZhbHNlO1xyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBQYWRkaW5nIH0gZnJvbSAnLi4vLi4vZ2VvbS9QYWRkaW5nJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JvbGxlckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHdlZGdlOkhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Nyb2xsZXJXaWR0aD86bnVtYmVyKSBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNjcm9sbGVyV2lkdGggPSBjb2FsZXNjZShzY3JvbGxlcldpZHRoLCBkZXRlY3RfbmF0aXZlX3Njcm9sbGVyX3dpZHRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICAvL1NldCBwYWRkaW5nIHJpZ2h0IGFuZCBib3R0b20gdG8gc2Nyb2xsZXIgd2lkdGggdG8gcHJldmVudCBvdmVybGFwXHJcbiAgICAgICAgZ3JpZC5wYWRkaW5nID0gbmV3IFBhZGRpbmcoXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy50b3AsXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy5yaWdodCArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmJvdHRvbSArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmxlZnQpO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5hbGlnbkVsZW1lbnRzKCkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25FbGVtZW50cygpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vU2Nyb2xsZXJFeHRlbnNpb24gaXMgYSBzcGVjaWFsIGNhc2UsIHdlIG5lZWQgdG8gbW9kaWZ5IHRoZSBncmlkIGNvbnRhaW5lciBlbGVtZW50IGluIG9yZGVyXHJcbiAgICAgICAgLy90byByZWxpYWJpbGl0eSBlbmFibGUgYWxsIHNjcm9sbCBpbnRlcmFjdGlvbiB3aXRob3V0IGxvZ3Mgb2YgZW11bGF0aW9uIGFuZCBidWdneSBjcmFwLiAgV2VcclxuICAgICAgICAvL2luamVjdCBhIHdlZGdlIGVsZW1lbnQgdGhhdCBzaW11bGF0ZXMgdGhlIG92ZXJmbG93IGZvciB0aGUgY29udGFpbmVyIHNjcm9sbCBiYXJzIGFuZCB0aGVuXHJcbiAgICAgICAgLy9ob2xkIHRoZSBncmlkIGluIHBsYWNlIHdoaWxlIG1pcnJvcmluZyB0aGUgc2Nyb2xsIHByb3BlcnR5IGFnYWluc3QgdGhlIGNvbnRhaW5lciBzY29ybGwgXHJcbiAgICAgICAgLy9wb3NpdGlvbi4gVnVhbGEhXHJcblxyXG4gICAgICAgIGxldCBjb250YWluZXIgPSB0aGlzLmdyaWQuY29udGFpbmVyO1xyXG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uQ29udGFpbmVyU2Nyb2xsLmJpbmQodGhpcykpO1xyXG4gICAgICAgIERvbS5jc3MoY29udGFpbmVyLCB7XHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB3ZWRnZSA9IHRoaXMud2VkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBEb20uY3NzKHdlZGdlLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgfSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHdlZGdlKTtcclxuXHJcbiAgICAgICAgdGhpcy5hbGlnbkVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbkVsZW1lbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBncmlkID0gdGhpcy5ncmlkO1xyXG4gICAgICAgIGxldCBjb25hdGluZXIgPSBncmlkLmNvbnRhaW5lcjtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhncmlkLnJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6IChncmlkLnNjcm9sbExlZnQpICsgJ3B4JyxcclxuICAgICAgICAgICAgdG9wOiAoZ3JpZC5zY3JvbGxUb3ApICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLndlZGdlLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHtncmlkLnZpcnR1YWxXaWR0aCAtIHRoaXMuc2Nyb2xsZXJXaWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7Z3JpZC52aXJ0dWFsSGVpZ2h0IC0gdGhpcy5zY3JvbGxlcldpZHRofXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxMZWZ0ICE9IGdyaWQuc2Nyb2xsTGVmdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbmF0aW5lci5zY3JvbGxMZWZ0ID0gZ3JpZC5zY3JvbGxMZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxUb3AgIT0gZ3JpZC5zY3JvbGxUb3ApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25hdGluZXIuc2Nyb2xsVG9wID0gZ3JpZC5zY3JvbGxUb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Db250YWluZXJTY3JvbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgbGV0IG1heFNjcm9sbCA9IG5ldyBQb2ludChcclxuICAgICAgICAgICAgZ3JpZC52aXJ0dWFsV2lkdGggLSBncmlkLndpZHRoLFxyXG4gICAgICAgICAgICBncmlkLnZpcnR1YWxIZWlnaHQgLSBncmlkLmhlaWdodCxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBncmlkLnNjcm9sbCA9IG5ldyBQb2ludChncmlkLmNvbnRhaW5lci5zY3JvbGxMZWZ0LCBncmlkLmNvbnRhaW5lci5zY3JvbGxUb3ApXHJcbiAgICAgICAgICAgIC5jbGFtcChQb2ludC5lbXB0eSwgbWF4U2Nyb2xsKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGV0ZWN0X25hdGl2ZV9zY3JvbGxlcl93aWR0aCgpIFxyXG57XHJcbiAgICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XHJcbiAgICBvdXRlci5zdHlsZS53aWR0aCA9IFwiMTAwcHhcIjtcclxuICAgIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9IFwic2Nyb2xsYmFyXCI7IC8vIG5lZWRlZCBmb3IgV2luSlMgYXBwc1xyXG5cclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xyXG5cclxuICAgIHZhciB3aWR0aE5vU2Nyb2xsID0gb3V0ZXIub2Zmc2V0V2lkdGg7XHJcbiAgICAvLyBmb3JjZSBzY3JvbGxiYXJzXHJcbiAgICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9IFwic2Nyb2xsXCI7XHJcblxyXG4gICAgLy8gYWRkIGlubmVyZGl2XHJcbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgaW5uZXIuc3R5bGUud2lkdGggPSBcIjEwMCVcIjtcclxuICAgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTsgICAgICAgIFxyXG5cclxuICAgIHZhciB3aWR0aFdpdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHJcbiAgICAvLyByZW1vdmUgZGl2c1xyXG4gICAgb3V0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdXRlcik7XHJcblxyXG4gICAgcmV0dXJuIHdpZHRoTm9TY3JvbGwgLSB3aWR0aFdpdGhTY3JvbGw7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50LCBHcmlkTW91c2VFdmVudCwgR3JpZE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEtleUlucHV0IH0gZnJvbSAnLi4vLi4vaW5wdXQvS2V5SW5wdXQnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQnO1xyXG5pbXBvcnQgeyBXaWRnZXQsIEFic1dpZGdldEJhc2UgfSBmcm9tICcuLi8uLi91aS9XaWRnZXQnO1xyXG5pbXBvcnQgeyBjb21tYW5kLCByb3V0aW5lLCB2YXJpYWJsZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgKiBhcyBUZXRoZXIgZnJvbSAndGV0aGVyJztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuXHJcblxyXG5jb25zdCBWZWN0b3JzID0ge1xyXG4gICAgbnc6IG5ldyBQb2ludCgtMSwgLTEpLFxyXG4gICAgbjogbmV3IFBvaW50KDAsIC0xKSxcclxuICAgIG5lOiBuZXcgUG9pbnQoMSwgLTEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgc2U6IG5ldyBQb2ludCgxLCAxKSxcclxuICAgIHM6IG5ldyBQb2ludCgwLCAxKSxcclxuICAgIHN3OiBuZXcgUG9pbnQoLTEsIDEpLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmludGVyZmFjZSBTZWxlY3RHZXN0dXJlXHJcbntcclxuICAgIHN0YXJ0OnN0cmluZztcclxuICAgIGVuZDpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JXaWRnZXQgZXh0ZW5kcyBXaWRnZXRcclxue1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RvckV4dGVuc2lvbkV4cG9ydHNcclxue1xyXG4gICAgY2FuU2VsZWN0OmJvb2xlYW47XHJcblxyXG4gICAgcmVhZG9ubHkgc2VsZWN0aW9uOnN0cmluZ1tdXHJcblxyXG4gICAgcmVhZG9ubHkgcHJpbWFyeVNlbGVjdG9yOlNlbGVjdG9yV2lkZ2V0O1xyXG5cclxuICAgIHJlYWRvbmx5IGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICBzZWxlY3QoY2VsbHM6c3RyaW5nW10sIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0QWxsKCk6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEVkZ2UodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdE5laWdoYm9yKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdG9yRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHNlbGVjdEdlc3R1cmU6U2VsZWN0R2VzdHVyZTtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBjYW5TZWxlY3Q6Ym9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3Rpb246c3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBAdmFyaWFibGUoZmFsc2UpXHJcbiAgICBwcml2YXRlIGNhcHR1cmVTZWxlY3RvcjpTZWxlY3RvcjtcclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignIVRBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchU0hJRlQrVEFCJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFSSUdIVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchTEVGVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignIURPV05fQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrUklHSFRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtMRUZUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrVVBfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMucykpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrQScsICgpID0+IHRoaXMuc2VsZWN0QWxsKCkpXHJcbiAgICAgICAgICAgIC5vbignIUhPTUUnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0hPTUUnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLm53KSlcclxuICAgICAgICAgICAgLm9uKCchRU5EJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5lKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtFTkQnLCAoKSA9PiB0aGlzLnNlbGVjdEJvcmRlcihWZWN0b3JzLnNlKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydC5lbmFibGUoZ3JpZC5yb290KTtcclxuICAgICAgICBNb3VzZUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJ0RPV046U0hJRlQrUFJJTUFSWScsIChlOkdyaWRNb3VzZUV2ZW50KSA9PiB0aGlzLnNlbGVjdExpbmUobmV3IFBvaW50KGUuZ3JpZFgsIGUuZ3JpZFkpKSlcclxuICAgICAgICAgICAgLm9uKCdET1dOOlBSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT4gdGhpcy5iZWdpblNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgKGU6R3JpZE1vdXNlRHJhZ0V2ZW50KSA9PiB0aGlzLnVwZGF0ZVNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSkpXHJcbiAgICAgICAgICAgIC5vbignVVA6UFJJTUFSWScsIChlOkdyaWRNb3VzZURyYWdFdmVudCkgPT4gdGhpcy5lbmRTZWxlY3RHZXN0dXJlKC8qZS5ncmlkWCwgZS5ncmlkWSovKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCAoKSA9PiB0aGlzLnJlc2VsZWN0KGZhbHNlKSk7XHJcbiAgICAgICAgZ3JpZC5vbignc2Nyb2xsJywgKCkgPT4gdGhpcy5hbGlnblNlbGVjdG9ycyhmYWxzZSkpO1xyXG5cclxuICAgICAgICBrZXJuZWwudmFyaWFibGVzLmRlZmluZSgnaXNTZWxlY3RpbmcnLCB7XHJcbiAgICAgICAgICAgIGdldDogKCkgPT4gISF0aGlzLnNlbGVjdEdlc3R1cmVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHJpbWFyeVNlbGVjdG9yID0gU2VsZWN0b3IuY3JlYXRlKGxheWVyLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmNhcHR1cmVTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9TZWxlY3QoY2VsbHMsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIHRoaXMuYWxpZ25TZWxlY3RvcnModHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RBbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLmNlbGxzLm1hcCh4ID0+IHgucmVmKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RCb3JkZXIodmVjdG9yOlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgeHkgPSB7IHg6IHN0YXJ0Q2VsbC5jb2xSZWYsIHk6IHN0YXJ0Q2VsbC5yb3dSZWYgfSBhcyBQb2ludExpa2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnggPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS54ID0gZ3JpZC5tb2RlbFdpZHRoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmVjdG9yLnkgPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB4eS55ID0gZ3JpZC5tb2RlbEhlaWdodCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDZWxsID0gZ3JpZC5tb2RlbC5sb2NhdGVDZWxsKHh5LngsIHh5LnkpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW3Jlc3VsdENlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgIGxldCBlbXB0eSA9IChjZWxsOkdyaWRDZWxsKSA9PiA8YW55PihjZWxsLnZhbHVlID09PSAnJyAgfHwgY2VsbC52YWx1ZSA9PT0gJzAnIHx8IGNlbGwudmFsdWUgPT09IHVuZGVmaW5lZCB8fCBjZWxsLnZhbHVlID09PSBudWxsKTtcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzdGFydENlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHJlZik7XHJcbiAgICAgICAgICAgIGxldCBjdXJyQ2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihzdGFydENlbGwucmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBsZXQgcmVzdWx0Q2VsbCA9IDxHcmlkQ2VsbD5udWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFjdXJyQ2VsbClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYSA9IGN1cnJDZWxsO1xyXG4gICAgICAgICAgICAgICAgbGV0IGIgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3IoYS5yZWYsIHZlY3Rvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFhIHx8ICFiKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdENlbGwgPSAhIWEgPyBhIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW1wdHkoYSkgKyBlbXB0eShiKSA9PSAxKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdENlbGwgPSBlbXB0eShhKSA/IGIgOiBhO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGN1cnJDZWxsID0gYjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtyZXN1bHRDZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0TGluZShncmlkUHQ6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKCFyZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcblxyXG4gICAgICAgIGxldCBzdGFydFB0ID0gZ3JpZC5nZXRDZWxsR3JpZFJlY3QocmVmKS50b3BMZWZ0KCk7XHJcbiAgICAgICAgbGV0IGxpbmVSZWN0ID0gUmVjdC5mcm9tUG9pbnRzKHN0YXJ0UHQsIGdyaWRQdCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KGxpbmVSZWN0KS5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKGNlbGxSZWZzLmluZGV4T2YocmVmKSwgMSk7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHJlZik7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KGNlbGxSZWZzLCBhdXRvU2Nyb2xsKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdE5laWdoYm9yKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGxOZWlnaGJvcihyZWYsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbY2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc2VsZWN0KGF1dG9TY3JvbGw6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZW1haW5pbmcgPSBzZWxlY3Rpb24uZmlsdGVyKHggPT4gISFncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgICAgICBpZiAocmVtYWluaW5nLmxlbmd0aCAhPSBzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3QocmVtYWluaW5nLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWdpblNlbGVjdEdlc3R1cmUoZ3JpZFg6bnVtYmVyLCBncmlkWTpudW1iZXIpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBuZXcgUG9pbnQoZ3JpZFgsIGdyaWRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0ge1xyXG4gICAgICAgICAgICBzdGFydDogY2VsbC5yZWYsXHJcbiAgICAgICAgICAgIGVuZDogY2VsbC5yZWYsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoWyBjZWxsLnJlZiBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVNlbGVjdEdlc3R1cmUoZ3JpZFg6bnVtYmVyLCBncmlkWTpudW1iZXIpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3RHZXN0dXJlIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcHQgPSBuZXcgUG9pbnQoZ3JpZFgsIGdyaWRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IGdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuXHJcbiAgICAgICAgaWYgKCFjZWxsIHx8IHNlbGVjdEdlc3R1cmUuZW5kID09PSBjZWxsLnJlZilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBzZWxlY3RHZXN0dXJlLmVuZCA9IGNlbGwucmVmO1xyXG5cclxuICAgICAgICBsZXQgcmVnaW9uID0gUmVjdC5mcm9tTWFueShbXHJcbiAgICAgICAgICAgIGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHNlbGVjdEdlc3R1cmUuc3RhcnQpLFxyXG4gICAgICAgICAgICBncmlkLmdldENlbGxHcmlkUmVjdChzZWxlY3RHZXN0dXJlLmVuZClcclxuICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgbGV0IGNlbGxSZWZzID0gZ3JpZC5nZXRDZWxsc0luR3JpZFJlY3QocmVnaW9uKVxyXG4gICAgICAgICAgICAubWFwKHggPT54LnJlZik7XHJcblxyXG4gICAgICAgIGlmIChjZWxsUmVmcy5sZW5ndGggPiAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKGNlbGxSZWZzLmluZGV4T2Yoc2VsZWN0R2VzdHVyZS5zdGFydCksIDEpO1xyXG4gICAgICAgICAgICBjZWxsUmVmcy5zcGxpY2UoMCwgMCwgc2VsZWN0R2VzdHVyZS5zdGFydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgY2VsbFJlZnMubGVuZ3RoID09IDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5kU2VsZWN0R2VzdHVyZSgpOnZvaWQgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RHZXN0dXJlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvU2VsZWN0KGNlbGxzOnN0cmluZ1tdID0gW10sIGF1dG9TY3JvbGw6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY2FuU2VsZWN0KVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChjZWxscy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IGNlbGxzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGF1dG9TY3JvbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBwcmltYXJ5UmVjdCA9IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KGNlbGxzWzBdKTtcclxuICAgICAgICAgICAgICAgIGdyaWQuc2Nyb2xsVG8ocHJpbWFyeVJlY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWxpZ25TZWxlY3RvcnMoYW5pbWF0ZTpib29sZWFuKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uLCBwcmltYXJ5U2VsZWN0b3IsIGNhcHR1cmVTZWxlY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHJpbWFyeVJlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChzZWxlY3Rpb25bMF0pO1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuZ290byhwcmltYXJ5UmVjdCwgYW5pbWF0ZSk7XHJcblxyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIGxldCBjYXB0dXJlUmVjdCA9IFJlY3QuZnJvbU1hbnkoc2VsZWN0aW9uLm1hcCh4ID0+IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHgpKSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci5nb3RvKGNhcHR1cmVSZWN0LCBhbmltYXRlKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLnRvZ2dsZShzZWxlY3Rpb24ubGVuZ3RoID4gMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByaW1hcnlTZWxlY3Rvci5oaWRlKCk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTZWxlY3RvciBleHRlbmRzIEFic1dpZGdldEJhc2U8SFRNTERpdkVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCwgcHJpbWFyeTpib29sZWFuID0gZmFsc2UpOlNlbGVjdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLXNlbGVjdG9yICcgKyAocHJpbWFyeSA/ICdncmlkLXNlbGVjdG9yLXByaW1hcnknIDogJycpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFNlbGVjdG9yKHJvb3QpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29tcHV0ZUVuZ2luZSB9IGZyb20gJy4vQ29tcHV0ZUVuZ2luZSc7XHJcbmltcG9ydCB7IEphdmFTY3JpcHRDb21wdXRlRW5naW5lIH0gZnJvbSAnLi9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSc7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEdyaWRDaGFuZ2VTZXQgfSBmcm9tICcuLi9jb21tb24vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBleHRlbmQsIGZsYXR0ZW4sIHppcFBhaXJzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDZWxsV2l0aEZvcm11bGEgZXh0ZW5kcyBHcmlkQ2VsbFxyXG57XHJcbiAgICBmb3JtdWxhOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbXB1dGVFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByb3RlY3RlZCByZWFkb25seSBlbmdpbmU6Q29tcHV0ZUVuZ2luZTtcclxuXHJcbiAgICBwcml2YXRlIG5vQ2FwdHVyZTpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZW5naW5lPzpDb21wdXRlRW5naW5lKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lIHx8IG5ldyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IHNlbGVjdGlvbigpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0PyhncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5lbmdpbmUuY29ubmVjdChncmlkKTtcclxuXHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLm92ZXJyaWRlKCdjb21taXQnLCB0aGlzLmNvbW1pdE92ZXJyaWRlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnYmVnaW5FZGl0JywgdGhpcy5iZWdpbkVkaXRPdmVycmlkZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgZ3JpZC5vbignaW52YWxpZGF0ZScsIHRoaXMucmVsb2FkLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVsb2FkKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGVuZ2luZSwgZ3JpZCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZW5naW5lLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjZWxsIG9mIGdyaWQubW9kZWwuY2VsbHMpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGZvcm11bGEgPSBjZWxsWydmb3JtdWxhJ10gYXMgc3RyaW5nO1xyXG4gICAgICAgICAgICBpZiAoISFmb3JtdWxhKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUucHJvZ3JhbShjZWxsLnJlZiwgZm9ybXVsYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubm9DYXB0dXJlID0gdHJ1ZTtcclxuICAgICAgICBncmlkLmV4ZWMoJ2NvbW1pdCcsIGVuZ2luZS5jb21wdXRlKCkpO1xyXG4gICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiZWdpbkVkaXRPdmVycmlkZShvdmVycmlkZTpzdHJpbmcsIGltcGw6YW55KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZW5naW5lLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uWzBdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFvdmVycmlkZSAmJiBvdmVycmlkZSAhPT0gJycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvdmVycmlkZSA9IGVuZ2luZS5nZXRGb3JtdWxhKHNlbGVjdGlvblswXSkgfHwgbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbXBsKG92ZXJyaWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbW1pdE92ZXJyaWRlKGNoYW5nZXM6R3JpZENoYW5nZVNldCwgaW1wbDphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBlbmdpbmUsIGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5ub0NhcHR1cmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc2NvcGUgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgICAgICBsZXQgY29tcHV0ZUxpc3QgPSBbXSBhcyBzdHJpbmdbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHRtIG9mIGNoYW5nZXMuY29udGVudHMoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsKHRtLnJlZik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFsncmVhZG9ubHknXSAhPT0gdHJ1ZSAmJiBjZWxsWydtdXRhYmxlJ10gIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0bS52YWx1ZS5sZW5ndGggPiAwICYmIHRtLnZhbHVlWzBdID09PSAnPScpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUucHJvZ3JhbSh0bS5yZWYsIHRtLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNsZWFyKFt0bS5yZWZdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUucHV0KHRtLnJlZiwgdG0udmFsdWUsIHRtLmNhc2NhZGVkKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbXB1dGVMaXN0LnB1c2godG0ucmVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGNvbXB1dGVMaXN0Lmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlcyA9IGVuZ2luZS5jb21wdXRlKGNvbXB1dGVMaXN0LCBzY29wZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaW1wbChjaGFuZ2VzKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uLy4uJztcclxuaW1wb3J0IHsgZXh0ZW5kLCBmbGF0dGVuLCBpbmRleCB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IENvbXB1dGVFbmdpbmUgfSBmcm9tICcuL0NvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IFdhdGNoTWFuYWdlciB9IGZyb20gJy4vV2F0Y2hNYW5hZ2VyJztcclxuXHJcblxyXG5jb25zdCBSZWZFeHRyYWN0ID0gLyg/IS4qWydcImBdKVtBLVphLXpdK1swLTldKzo/KFtBLVphLXpdK1swLTldKyk/L2c7XHJcblxyXG5jb25zdCBTdXBwb3J0RnVuY3Rpb25zID0ge1xyXG4gICAgLy9NYXRoOlxyXG4gICAgYWJzOiBNYXRoLmFicyxcclxuICAgIGFjb3M6IE1hdGguYWNvcyxcclxuICAgIGFzaW46IE1hdGguYXNpbixcclxuICAgIGF0YW46IE1hdGguYXRhbixcclxuICAgIGF0YW4yOiBNYXRoLmF0YW4yLFxyXG4gICAgY2VpbDogTWF0aC5jZWlsLFxyXG4gICAgY29zOiBNYXRoLmNvcyxcclxuICAgIGV4cDogTWF0aC5leHAsXHJcbiAgICBmbG9vcjogTWF0aC5mbG9vcixcclxuICAgIGxvZzogTWF0aC5sb2csXHJcbiAgICBtYXg6IE1hdGgubWF4LFxyXG4gICAgbWluOiBNYXRoLm1pbixcclxuICAgIHBvdzogTWF0aC5wb3csXHJcbiAgICByYW5kb206IE1hdGgucmFuZG9tLFxyXG4gICAgcm91bmQ6IE1hdGgucm91bmQsXHJcbiAgICBzaW46IE1hdGguc2luLFxyXG4gICAgc3FydDogTWF0aC5zcXJ0LFxyXG4gICAgdGFuOiBNYXRoLnRhbixcclxuICAgIC8vQ3VzdG9tOlxyXG4gICAgYXZnOiBmdW5jdGlvbih2YWx1ZXM6bnVtYmVyW10pOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBTdXBwb3J0RnVuY3Rpb25zLnN1bSh2YWx1ZXMpIC8gdmFsdWVzLmxlbmd0aDtcclxuICAgIH0sXHJcbiAgICBzdW06IGZ1bmN0aW9uKHZhbHVlczpudW1iZXJbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZXMucmVkdWNlKCh0LCB4KSA9PiB0ICsgeCwgMCk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb21waWxlZEZvcm11bGFcclxue1xyXG4gICAgKGNoYW5nZVNjb3BlPzpHcmlkQ2hhbmdlU2V0KTpudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSBpbXBsZW1lbnRzIENvbXB1dGVFbmdpbmVcclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBmb3JtdWxhczpPYmplY3RNYXA8c3RyaW5nPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBjYWNoZTpPYmplY3RNYXA8Q29tcGlsZWRGb3JtdWxhPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSB3YXRjaGVzOldhdGNoTWFuYWdlciA9IG5ldyBXYXRjaE1hbmFnZXIoKTtcclxuICAgIFxyXG4gICAgcHVibGljIGdldEZvcm11bGEoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZvcm11bGFzW2NlbGxSZWZdIHx8IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoY2VsbFJlZnM/OnN0cmluZ1tdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCEhY2VsbFJlZnMgJiYgISFjZWxsUmVmcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjciBvZiBjZWxsUmVmcykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZvcm11bGFzW2NyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2F0Y2hlcy51bndhdGNoKGNyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmZvcm11bGFzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcy5jbGVhcigpOyAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdChncmlkOkdyaWRFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV2YWx1YXRlKGZvcm11bGE6c3RyaW5nLCBjaGFuZ2VTY29wZT86R3JpZENoYW5nZVNldCk6c3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBmdW5jID0gdGhpcy5jb21waWxlKGZvcm11bGEpO1xyXG4gICAgICAgIHJldHVybiAoZnVuYyhjaGFuZ2VTY29wZSB8fCBuZXcgR3JpZENoYW5nZVNldCgpKSB8fCAwKS50b1N0cmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKGNlbGxSZWZzOnN0cmluZ1tdID0gW10sIHNjb3BlOkdyaWRDaGFuZ2VTZXQgPSBuZXcgR3JpZENoYW5nZVNldCgpLCBjYXNjYWRlOmJvb2xlYW4gPSB0cnVlKTpHcmlkQ2hhbmdlU2V0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgZm9ybXVsYXMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBsb29rdXAgPSBpbmRleChjZWxsUmVmcywgeCA9PiB4KTtcclxuICAgICAgICBsZXQgdGFyZ2V0cyA9ICghIWNlbGxSZWZzLmxlbmd0aCA/IGNlbGxSZWZzIDogT2JqZWN0LmtleXModGhpcy5mb3JtdWxhcykpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuXHJcbiAgICAgICAgaWYgKGNhc2NhZGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0YXJnZXRzID0gdGhpcy5jYXNjYWRlVGFyZ2V0cyh0YXJnZXRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgdGFyZ2V0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBmb3JtdWxhID0gZm9ybXVsYXNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICBpZiAoZm9ybXVsYSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHRoaXMuZXZhbHVhdGUoZm9ybXVsYSwgc2NvcGUpXHJcbiAgICAgICAgICAgICAgICBzY29wZS5wdXQoY2VsbC5yZWYsIHJlc3VsdCwgIWxvb2t1cFtjZWxsLnJlZl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2NvcGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluc3BlY3QoZm9ybXVsYTpzdHJpbmcpOnN0cmluZ1tdIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBleHBycyA9IFtdIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBudWxsIGFzIFJlZ0V4cEV4ZWNBcnJheTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHJlc3VsdCA9IFJlZkV4dHJhY3QuZXhlYyhmb3JtdWxhKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghcmVzdWx0Lmxlbmd0aClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZXhwcnMucHVzaChyZXN1bHRbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGV4cHJzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm9ncmFtKGNlbGxSZWY6c3RyaW5nLCBmb3JtdWxhOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZm9ybXVsYXNbY2VsbFJlZl0gPSBmb3JtdWxhO1xyXG5cclxuICAgICAgICBsZXQgZXhwcnMgPSB0aGlzLmluc3BlY3QoZm9ybXVsYSk7XHJcbiAgICAgICAgbGV0IGRwblJhbmdlcyA9IGV4cHJzLm1hcCh4ID0+IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLCB4KS5sdHIpO1xyXG4gICAgICAgIGxldCBkcG5zID0gZmxhdHRlbjxHcmlkQ2VsbD4oZHBuUmFuZ2VzKS5tYXAoeCA9PiB4LnJlZik7XHJcblxyXG4gICAgICAgIGlmIChkcG5zLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcy53YXRjaChjZWxsUmVmLCBkcG5zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGNvbXBpbGUoZm9ybXVsYTpzdHJpbmcpOkNvbXBpbGVkRm9ybXVsYVxyXG4gICAge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmQoZm9ybXVsYTpzdHJpbmcsIHJlZjpzdHJpbmcpOm51bWJlciBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm9ybXVsYS5sZW5ndGg7IGkrKykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChmb3JtdWxhW2ldID09IHJlZlswXSkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm11bGEuc3Vic3RyKGksIHJlZi5sZW5ndGgpID09PSByZWYpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5jID0gZm9ybXVsYVtpICsgcmVmLmxlbmd0aF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmMgfHwgIW5jLm1hdGNoKC9cXHcvKSkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL1N0b3JlIGtleSBzZXBhcmF0ZWx5IGJlY2F1c2Ugd2UgY2hhbmdlIHRoZSBmb3JtdWxhLi4uXHJcbiAgICAgICAgICAgIGxldCBjYWNoZUtleSA9IGZvcm11bGE7XHJcbiAgICAgICAgICAgIGxldCBmdW5jID0gdGhpcy5jYWNoZVtjYWNoZUtleV0gYXMgQ29tcGlsZWRGb3JtdWxhO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFmdW5jKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXhwcnMgPSB0aGlzLmluc3BlY3QoZm9ybXVsYSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCBvZiBleHBycykgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlkeCA9IGZpbmQoZm9ybXVsYSwgeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm11bGEgPSBmb3JtdWxhLnN1YnN0cmluZygwLCBpZHgpICsgYGV4cHIoJyR7eH0nLCBhcmd1bWVudHNbMV0pYCArIGZvcm11bGEuc3Vic3RyaW5nKGlkeCArIHgubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGZ1bmN0aW9ucyA9IGV4dGVuZCh7fSwgU3VwcG9ydEZ1bmN0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbnMuZXhwciA9IHRoaXMucmVzb2x2ZS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjb2RlID0gYHdpdGggKGFyZ3VtZW50c1swXSkgeyB0cnkgeyByZXR1cm4gKCR7Zm9ybXVsYS5zdWJzdHIoMSl9KTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyByZXR1cm4gMDsgfSB9YC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgZnVuYyA9IHRoaXMuY2FjaGVbY2FjaGVLZXldID0gbmV3IEZ1bmN0aW9uKGNvZGUpLmJpbmQobnVsbCwgZnVuY3Rpb25zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignY29tcGlsZTonLCBlKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihmb3JtdWxhKTtcclxuICAgICAgICAgICAgcmV0dXJuIHggPT4gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGNhc2NhZGVUYXJnZXRzKGNlbGxzOkdyaWRDZWxsW10pOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBmb3JtdWxhcywgd2F0Y2hlcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCBhbHJlYWR5UHVzaGVkID0ge30gYXMgT2JqZWN0TWFwPGJvb2xlYW4+O1xyXG5cclxuICAgICAgICBjb25zdCB2aXNpdCA9IChjZWxsOkdyaWRDZWxsKTp2b2lkID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoYWxyZWFkeVB1c2hlZFtjZWxsLnJlZl0gPT09IHRydWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVwZW5kZW5jaWVzID0gd2F0Y2hlcy5nZXRPYnNlcnZlcnNPZihjZWxsLnJlZilcclxuICAgICAgICAgICAgICAgIC5tYXAoeCA9PiBncmlkLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGRjIG9mIGRlcGVuZGVuY2llcylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmlzaXQoZGMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmb3JtdWxhc1tjZWxsLnJlZl0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKDAsIDAsIGNlbGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhbHJlYWR5UHVzaGVkW2NlbGwucmVmXSA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICB2aXNpdChjKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBsaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCByZXNvbHZlKGV4cHI6c3RyaW5nLCBjaGFuZ2VTY29wZTpHcmlkQ2hhbmdlU2V0KTpudW1iZXJ8bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICB2YXIgdmFsdWVzID0gR3JpZFJhbmdlXHJcbiAgICAgICAgICAgIC5zZWxlY3QodGhpcy5ncmlkLm1vZGVsLCBleHByKVxyXG4gICAgICAgICAgICAubHRyXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmNvYWxlc2NlRmxvYXQoY2hhbmdlU2NvcGUuZ2V0KHgucmVmKSwgeC52YWx1ZSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA8IDJcclxuICAgICAgICAgICAgPyAodmFsdWVzWzBdIHx8IDApXHJcbiAgICAgICAgICAgIDogdmFsdWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29hbGVzY2VGbG9hdCguLi52YWx1ZXM6c3RyaW5nW10pOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdmFsdWVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodikgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGNsYXNzIFdhdGNoTWFuYWdlclxyXG57XHJcbiAgICBwcml2YXRlIG9ic2VydmluZzpPYmplY3RNYXA8c3RyaW5nW10+ID0ge307XHJcbiAgICBwcml2YXRlIG9ic2VydmVkOk9iamVjdE1hcDxzdHJpbmdbXT4gPSB7fTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub2JzZXJ2aW5nID0ge307XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlZCA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRPYnNlcnZlcnNPZihjZWxsUmVmOnN0cmluZyk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlZFtjZWxsUmVmXSB8fCBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0T2JzZXJ2ZWRCeShjZWxsUmVmOnN0cmluZyk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZpbmdbY2VsbFJlZl0gfHwgW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdhdGNoKG9ic2VydmVyOnN0cmluZywgc3ViamVjdHM6c3RyaW5nW10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXN1YmplY3RzIHx8ICFzdWJqZWN0cy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZpbmdbb2JzZXJ2ZXJdID0gc3ViamVjdHM7XHJcbiAgICAgICAgZm9yIChsZXQgcyBvZiBzdWJqZWN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5vYnNlcnZlZFtzXSB8fCAodGhpcy5vYnNlcnZlZFtzXSA9IFtdKTtcclxuICAgICAgICAgICAgbGlzdC5wdXNoKG9ic2VydmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVud2F0Y2gob2JzZXJ2ZXI6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHN1YmplY3RzID0gdGhpcy5nZXRPYnNlcnZlZEJ5KG9ic2VydmVyKTtcclxuICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZpbmdbb2JzZXJ2ZXJdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzIG9mIHN1YmplY3RzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGxpc3QgPSB0aGlzLm9ic2VydmVkW3NdIHx8IFtdO1xyXG4gICAgICAgICAgICBsZXQgaXggPSBsaXN0LmluZGV4T2Yob2JzZXJ2ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXggPj0gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaXgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQgfSBmcm9tICcuLi8uLi9taXNjL1BvbHlmaWxsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJ1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEV4dGVuc2lvbiwgR3JpZE1vdXNlRXZlbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCdcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBSZWN0LCBSZWN0TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uLy4uL21pc2MvRG9tJztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgQ2xpY2tab25lTW9kZSA9ICdhYnMnfCdhYnMtYWx0J3wncmVsJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpY2tab25lIGV4dGVuZHMgUmVjdExpa2Vcclxue1xyXG4gICAgbW9kZTpDbGlja1pvbmVNb2RlO1xyXG4gICAgdHlwZTpzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDbGlja1pvbmVTZWxlY3Rpb25cclxue1xyXG4gICAgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHpvbmU6Q2xpY2tab25lO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENsaWNrWm9uZU1vdXNlRXZlbnQgZXh0ZW5kcyBHcmlkTW91c2VFdmVudFxyXG57XHJcbiAgICB6b25lOkNsaWNrWm9uZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENsaWNrWm9uZUV4dGVuc2lvbiBpbXBsZW1lbnRzIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgY3VycmVudDpDbGlja1pvbmVTZWxlY3Rpb247XHJcbiAgICBwcml2YXRlIGxhc3RHcmlkUHQ6UG9pbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgaXNTZWxlY3RpbmcoKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnaXNTZWxlY3RpbmcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5mb3J3YXJkTGF5ZXJFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5mb3J3YXJkTGF5ZXJFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25HbG9iYWxNb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgZ3JpZC5vbignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcblxyXG4gICAgICAgIGxldCB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBvbkJhc2ggPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIERvbS5maXQobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHQucG9zaXRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdyaWQub24oJ2Jhc2gnLCBvbkJhc2gpO1xyXG4gICAgICAgIG9uQmFzaCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzd2l0Y2hab25lKGN6czpDbGlja1pvbmVTZWxlY3Rpb24sIHNvdXJjZUV2ZW50Ok1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBsYXllciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGhhc2godGhpcy5jdXJyZW50KSA9PT0gaGFzaChjenMpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmlkLmVtaXQoJ3pvbmVleGl0JywgY3JlYXRlX2V2ZW50KCd6b25lZXhpdCcsIHRoaXMuY3VycmVudCwgc291cmNlRXZlbnQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IGN6cztcclxuXHJcbiAgICAgICAgaWYgKGN6cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxheWVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYWxsJztcclxuICAgICAgICAgICAgZ3JpZC5lbWl0KCd6b25lZW50ZXInLCBjcmVhdGVfZXZlbnQoJ3pvbmVlbnRlcicsIHRoaXMuY3VycmVudCwgc291cmNlRXZlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGF5ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkTGF5ZXJFdmVudChlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBsYXN0R3JpZFB0IH0gPSB0aGlzO1xyXG4gICAgICAgIGVbJ2dyaWRYJ10gPSBsYXN0R3JpZFB0Lng7XHJcbiAgICAgICAgZVsnZ3JpZFknXSA9IGxhc3RHcmlkUHQueTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGUgPSAnem9uZScgKyBlLnR5cGU7XHJcblxyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuICAgICAgICBncmlkLmVtaXQodHlwZSwgY3JlYXRlX2V2ZW50KHR5cGUsIHRoaXMuY3VycmVudCwgZSBhcyBHcmlkTW91c2VFdmVudCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlUHQgPSB0aGlzLmxhc3RHcmlkUHQgPSBuZXcgUG9pbnQoZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xyXG4gICAgICAgIGxldCBjZWxsID0gZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQobW91c2VQdCk7XHJcbiAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdmlld1JlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgIGxldCB6b25lcyA9IChjZWxsWyd6b25lcyddIHx8IFtdKSBhcyBDbGlja1pvbmVbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0YXJnZXQgPSB6b25lc1xyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMudGVzdChjZWxsLCB4LCBtb3VzZVB0KSlcclxuICAgICAgICAgICAgICAgIFswXSB8fCBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhdGFyZ2V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUoe2NlbGw6IGNlbGwsIHpvbmU6IHRhcmdldH0sIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKG51bGwsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkdsb2JhbE1vdXNlTW92ZShlOk1vdXNlRXZlbnQpOnZvaWQgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCEhdGhpcy5jdXJyZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGdyaWRSZWN0ID0gUmVjdC5mcm9tTGlrZShncmlkLnJvb3QuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpXHJcbiAgICAgICAgICAgIGxldCBtb3VzZVB0ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFncmlkUmVjdC5jb250YWlucyhtb3VzZVB0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKG51bGwsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIHRlc3QoY2VsbDpHcmlkQ2VsbCwgem9uZTpDbGlja1pvbmUsIHB0OlBvaW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpZXdSZWN0ID0gdGhpcy5ncmlkLmdldENlbGxWaWV3UmVjdChjZWxsLnJlZik7XHJcbiAgICAgICAgbGV0IHpvbmVSZWN0ID0gUmVjdC5mcm9tTGlrZSh6b25lKTtcclxuXHJcbiAgICAgICAgaWYgKHpvbmUubW9kZSA9PT0gJ3JlbCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB6b25lUmVjdCA9IG5ldyBSZWN0KFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3Qud2lkdGggKiAoem9uZVJlY3QubGVmdCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgKiAoem9uZVJlY3QudG9wIC8gMTAwKSxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoICogKHpvbmVSZWN0LndpZHRoIC8gMTAwKSxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LmhlaWdodCAqICh6b25lUmVjdC5oZWlnaHQgLyAxMDApLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoem9uZS5tb2RlID09PSAnYWJzLWFsdCcpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgem9uZVJlY3QgPSBuZXcgUmVjdChcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoIC0gem9uZVJlY3QubGVmdCAtIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LmhlaWdodCAtIHpvbmVSZWN0LnRvcCAtIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgICAgIHpvbmVSZWN0LndpZHRoLFxyXG4gICAgICAgICAgICAgICAgem9uZVJlY3QuaGVpZ2h0LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHpvbmVSZWN0Lm9mZnNldCh2aWV3UmVjdC50b3BMZWZ0KCkpLmNvbnRhaW5zKHB0KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlX2V2ZW50KHR5cGU6c3RyaW5nLCBjenM6Q2xpY2tab25lU2VsZWN0aW9uLCBzb3VyY2U6TW91c2VFdmVudCk6Q2xpY2tab25lTW91c2VFdmVudFxyXG57XHJcbiAgICBsZXQgZXZlbnQgPSBpZV9zYWZlX2NyZWF0ZV9tb3VzZV9ldmVudCh0eXBlLCBzb3VyY2UpIGFzIGFueTtcclxuICAgIC8vIGV2ZW50LmdyaWRYID0gc291cmNlLmdyaWRYO1xyXG4gICAgLy8gZXZlbnQuZ3JpZFkgPSBzb3VyY2UuZ3JpZFk7XHJcbiAgICBldmVudC5jZWxsID0gY3pzLmNlbGw7XHJcbiAgICBldmVudC56b25lID0gY3pzLnpvbmU7XHJcbiAgICByZXR1cm4gZXZlbnQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc2goY3pzOkNsaWNrWm9uZVNlbGVjdGlvbik6c3RyaW5nXHJcbntcclxuICAgIGlmICghY3pzKSByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gW2N6cy5jZWxsLnJlZiwgY3pzLnpvbmUubGVmdCwgY3pzLnpvbmUudG9wLCBjenMuem9uZS53aWR0aCwgY3pzLnpvbmUuaGVpZ2h0XVxyXG4gICAgICAgIC5qb2luKCc6Jyk7XHJcbn0iLCJpbXBvcnQgeyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIsIEhpc3RvcnlBY3Rpb24sIEhpc3RvcnlNYW5hZ2VyIH0gZnJvbSAnLi9IaXN0b3J5TWFuYWdlcic7XHJcbmltcG9ydCB7IHppcFBhaXJzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4uL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uJztcclxuaW1wb3J0IHsgR3JpZEV4dGVuc2lvbiwgR3JpZEVsZW1lbnQgfSBmcm9tICcuLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLi91aS9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnXHJcblxyXG5cclxuaW50ZXJmYWNlIENlbGxFZGl0U25hcHNob3Rcclxue1xyXG4gICAgcmVmOnN0cmluZztcclxuICAgIG5ld1ZhbDpzdHJpbmc7XHJcbiAgICBvbGRWYWw6c3RyaW5nO1xyXG4gICAgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIaXN0b3J5RXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIG1hbmFnZXI6SGlzdG9yeU1hbmFnZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBzdXNwZW5kZWQ6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBjYXB0dXJlOk9iamVjdE1hcDxzdHJpbmc+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmFnZXI/Okhpc3RvcnlNYW5hZ2VyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXIgfHwgbmV3IERlZmF1bHRIaXN0b3J5TWFuYWdlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1onLCAoKSA9PiB0aGlzLnVuZG8oKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfWScsICgpID0+IHRoaXMucmVkbygpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsIHRoaXMuYmVmb3JlQ29tbWl0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2FmdGVyOmNvbW1pdCcsIHRoaXMuYWZ0ZXJDb21taXQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSB1bmRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci51bmRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZWRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5yZWRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgnY2xlYXJIaXN0b3J5JylcclxuICAgIHByaXZhdGUgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoJ3N1c3BlbmRIaXN0b3J5JylcclxuICAgIHByaXZhdGUgc3VzcGVuZChmbGFnOmJvb2xlYW4gPSB0cnVlKTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc3VzcGVuZGVkID0gZmxhZztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZm9yZUNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ub0NhcHR1cmUgfHwgdGhpcy5zdXNwZW5kZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IG1vZGVsID0gdGhpcy5ncmlkLm1vZGVsO1xyXG5cclxuICAgICAgICB0aGlzLmNhcHR1cmUgPSB6aXBQYWlycyhcclxuICAgICAgICAgICAgY2hhbmdlcy5yZWZzKCkubWFwKHIgPT4gW3IsIG1vZGVsLmZpbmRDZWxsKHIpLnZhbHVlXSkgXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFmdGVyQ29tbWl0KGNoYW5nZXM6R3JpZENoYW5nZVNldCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm5vQ2FwdHVyZSB8fCAhdGhpcy5jYXB0dXJlIHx8IHRoaXMuc3VzcGVuZGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBzbmFwc2hvdHMgPSB0aGlzLmNyZWF0ZVNuYXBzaG90cyh0aGlzLmNhcHR1cmUsIGNoYW5nZXMpO1xyXG4gICAgICAgIGlmIChzbmFwc2hvdHMubGVuZ3RoKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FwdHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTbmFwc2hvdHMoY2FwdHVyZTpPYmplY3RNYXA8c3RyaW5nPiwgY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTpDZWxsRWRpdFNuYXBzaG90W11cclxuICAgIHtcclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmdyaWQubW9kZWw7XHJcbiAgICAgICAgbGV0IGJhdGNoID0gW10gYXMgQ2VsbEVkaXRTbmFwc2hvdFtdO1xyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUobW9kZWwpO1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbXBpbGVkLmZpbHRlcih4ID0+ICF4LmNhc2NhZGVkKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJhdGNoLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBlbnRyeS5jZWxsLnJlZixcclxuICAgICAgICAgICAgICAgIG5ld1ZhbDogZW50cnkudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWw6IGNhcHR1cmVbZW50cnkuY2VsbC5yZWZdLFxyXG4gICAgICAgICAgICAgICAgY2FzY2FkZWQ6IGVudHJ5LmNhc2NhZGVkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBiYXRjaDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSk6SGlzdG9yeUFjdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFwcGx5OiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNpbGVudENvbW1pdChjcmVhdGVfY2hhbmdlcyhzbmFwc2hvdHMsIHggPT4geC5uZXdWYWwpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcm9sbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2lsZW50Q29tbWl0KGNyZWF0ZV9jaGFuZ2VzKHNuYXBzaG90cywgeCA9PiB4Lm9sZFZhbCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbnZva2VTaWxlbnRDb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGdyaWQuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgbGV0IHJlZnMgPSBjb21waWxlZC5maWx0ZXIoeCA9PiAheC5jYXNjYWRlZCkubWFwKHggPT4geC5jZWxsLnJlZik7XHJcbiAgICAgICAgZ3JpZC5leGVjKCdzZWxlY3QnLCByZWZzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlX2NoYW5nZXMoc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSwgdmFsU2VsZWN0b3I6KHM6Q2VsbEVkaXRTbmFwc2hvdCkgPT4gc3RyaW5nKTpHcmlkQ2hhbmdlU2V0IFxyXG57XHJcbiAgICBsZXQgY2hhbmdlU2V0ID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgIGZvciAobGV0IHMgb2Ygc25hcHNob3RzKVxyXG4gICAge1xyXG4gICAgICAgIGNoYW5nZVNldC5wdXQocy5yZWYsIHZhbFNlbGVjdG9yKHMpLCBzLmNhc2NhZGVkKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGFuZ2VTZXQ7XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSGlzdG9yeUFjdGlvblxyXG57XHJcbiAgICBhcHBseSgpOnZvaWQ7XHJcblxyXG4gICAgcm9sbGJhY2soKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhpc3RvcnlNYW5hZ2VyXHJcbntcclxuICAgIHJlYWRvbmx5IGZ1dHVyZUNvdW50Om51bWJlcjtcclxuXHJcbiAgICByZWFkb25seSBwYXN0Q291bnQ6bnVtYmVyO1xyXG5cclxuICAgIGNsZWFyKCk6dm9pZDtcclxuXHJcbiAgICBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkO1xyXG5cclxuICAgIHJlZG8oKTpib29sZWFuO1xyXG5cclxuICAgIHVuZG8oKTpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyIGltcGxlbWVudHMgSGlzdG9yeU1hbmFnZXJcclxue1xyXG4gICAgcHJpdmF0ZSBmdXR1cmU6SGlzdG9yeUFjdGlvbltdID0gW107XHJcbiAgICBwcml2YXRlIHBhc3Q6SGlzdG9yeUFjdGlvbltdID0gW107XHJcblxyXG4gICAgcHVibGljIGdldCBmdXR1cmVDb3VudCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZ1dHVyZS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBwYXN0Q291bnQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXN0Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHVzaChhY3Rpb246SGlzdG9yeUFjdGlvbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGFzdC5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVkbygpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZnV0dXJlLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmZ1dHVyZS5wb3AoKTtcclxuICAgICAgICBhY3Rpb24uYXBwbHkoKTtcclxuICAgICAgICB0aGlzLnBhc3QucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmRvKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5wYXN0Lmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLnBhc3QucG9wKCk7XHJcbiAgICAgICAgYWN0aW9uLnJvbGxiYWNrKCk7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBQYWRkaW5nIFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBhZGRpbmcoMCwgMCwgMCwgMCk7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmlnaHQ6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJvdHRvbTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IodG9wPzpudW1iZXIsIHJpZ2h0PzpudW1iZXIsIGJvdHRvbT86bnVtYmVyLCBsZWZ0PzpudW1iZXIpIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudG9wID0gY29hbGVzY2UodG9wLCAwKTtcclxuICAgICAgICB0aGlzLnJpZ2h0ID0gY29hbGVzY2UocmlnaHQsIHRoaXMudG9wKTtcclxuICAgICAgICB0aGlzLmJvdHRvbSA9IGNvYWxlc2NlKGJvdHRvbSwgdGhpcy50b3ApO1xyXG4gICAgICAgIHRoaXMubGVmdCA9IGNvYWxlc2NlKGxlZnQsIHRoaXMucmlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaG9yaXpvbnRhbCgpOm51bWJlciBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy5yaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHZlcnRpY2FsKCk6bnVtYmVyIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRvcCArIHRoaXMuYm90dG9tO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbmZsYXRlKGJ5Om51bWJlcik6UGFkZGluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUGFkZGluZyhcclxuICAgICAgICAgICAgdGhpcy50b3AgKyBieSxcclxuICAgICAgICAgICAgdGhpcy5yaWdodCArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmJvdHRvbSArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgKyBieSxcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBvaW50TGlrZSBcclxue1xyXG4gICAgeDpudW1iZXI7XHJcbiAgICB5Om51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQnJvd3NlclBvaW50ID0geyBsZWZ0Om51bWJlcjsgdG9wOm51bWJlcjsgfTtcclxuZXhwb3J0IHR5cGUgUG9pbnRJbnB1dCA9IG51bWJlcltdfFBvaW50fFBvaW50TGlrZXxCcm93c2VyUG9pbnQ7XHJcblxyXG5leHBvcnQgY2xhc3MgUG9pbnQgaW1wbGVtZW50cyBQb2ludExpa2Vcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHg6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSB5Om51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyByYWQyZGVnOm51bWJlciA9IDM2MCAvIChNYXRoLlBJICogMik7XHJcbiAgICBwdWJsaWMgc3RhdGljIGRlZzJyYWQ6bnVtYmVyID0gKE1hdGguUEkgKiAyKSAvIDM2MDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBvaW50KDAsIDApO1xyXG4gICAgcHVibGljIHN0YXRpYyBtYXggPSBuZXcgUG9pbnQoMjE0NzQ4MzY0NywgMjE0NzQ4MzY0Nyk7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1pbiA9IG5ldyBQb2ludCgtMjE0NzQ4MzY0NywgLTIxNDc0ODM2NDcpO1xyXG4gICAgcHVibGljIHN0YXRpYyB1cCA9IG5ldyBQb2ludCgwLCAtMSk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBhdmVyYWdlKHBvaW50czpQb2ludExpa2VbXSk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXBvaW50cy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeCA9IDAsIHkgPSAwO1xyXG5cclxuICAgICAgICBwb2ludHMuZm9yRWFjaChwID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB4ICs9IHAueDtcclxuICAgICAgICAgICAgeSArPSBwLnk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoeCAvIHBvaW50cy5sZW5ndGgsIHkgLyBwb2ludHMubGVuZ3RoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpcmVjdGlvbihmcm9tOlBvaW50SW5wdXQsIHRvOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHRvKS5zdWJ0cmFjdChmcm9tKS5ub3JtYWxpemUoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoc291cmNlOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHNvdXJjZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tQnVmZmVyKGJ1ZmZlcjpudW1iZXJbXSwgaW5kZXg6bnVtYmVyID0gMCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KGJ1ZmZlcltpbmRleF0sIGJ1ZmZlcltpbmRleCArIDFdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4Om51bWJlcnxudW1iZXJbXSwgeT86bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKHhbMF0pO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9ICg8bnVtYmVyPngpO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vcmVnaW9uIEdlb21ldHJ5XHJcblxyXG4gICAgcHVibGljIGFuZ2xlKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnggPCAwKVxyXG4gICAgICAgICAgICA/IDM2MCAtIE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWcgKiAtMVxyXG4gICAgICAgICAgICA6IE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFuZ2xlQWJvdXQodmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocHQuY3Jvc3ModGhpcyksIHB0LmRvdCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyb3NzKHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC55IC0gdGhpcy55ICogcHQueDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzdGFuY2UodG86UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodG8pO1xyXG4gICAgICAgIGxldCBhID0gdGhpcy54IC0gcHQueDtcclxuICAgICAgICBsZXQgYiA9IHRoaXMueSAtIHB0Lnk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChhICogYSArIGIgKiBiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG90KHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC54ICsgdGhpcy55ICogcHQueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbGVuZ3RoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBub3JtYWxpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsZW4gPSB0aGlzLmxlbmd0aCgpO1xyXG4gICAgICAgIGlmIChsZW4gPiAwLjAwMDAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSAvIGxlbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwZXJwKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueSAqIC0xLCB0aGlzLngpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBycGVycCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLnBlcnAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52ZXJzZSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiAtMSwgdGhpcy55ICogLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXZlcnNlKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJvdGF0ZShyYWRpYW5zOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XHJcbiAgICAgICAgbGV0IHNpbiA9IE1hdGguc2luKHJhZGlhbnMpO1xyXG4gICAgICAgIGxldCBueCA9IHRoaXMueCAqIGNvcyAtIHRoaXMueSAqIHNpbjtcclxuICAgICAgICBsZXQgbnkgPSB0aGlzLnkgKiBjb3MgKyB0aGlzLnggKiBzaW47XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQobngsIG55KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIEFyaXRobWV0aWNcclxuXHJcbiAgICBwdWJsaWMgYWRkKHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ2FkZDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICsgcHQueCwgdGhpcy55ICsgcHQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpdmlkZShkaXZpc29yOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAvIGRpdmlzb3IsIHRoaXMueSAvIGRpdmlzb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtdWx0aXBseShtdWx0aXBsZXI6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogbXVsdGlwbGVyLCB0aGlzLnkgKiBtdWx0aXBsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByb3VuZCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJvdW5kKHRoaXMueCksIE1hdGgucm91bmQodGhpcy55KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YnRyYWN0KHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ3N1YnRyYWN0OiBwdCByZXF1aXJlZC4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHB0LnJldmVyc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsYW1wKGxvd2VyOlBvaW50LCB1cHBlcjpQb2ludCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgeCA9IHRoaXMueDtcclxuICAgICAgICBpZiAoeCA8IGxvd2VyLngpIHggPSBsb3dlci54O1xyXG4gICAgICAgIGlmICh4ID4gdXBwZXIueCkgeCA9IHVwcGVyLng7XHJcblxyXG4gICAgICAgIGxldCB5ID0gdGhpcy55O1xyXG4gICAgICAgIGlmICh5IDwgbG93ZXIueSkgeSA9IGxvd2VyLnk7XHJcbiAgICAgICAgaWYgKHkgPiB1cHBlci55KSB5ID0gdXBwZXIueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh4LCB5KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIENvbnZlcnNpb25cclxuXHJcbiAgICBwdWJsaWMgY2xvbmUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjpQb2ludExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBhbm90aGVyLnggJiYgdGhpcy55ID09PSBhbm90aGVyLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvQXJyYXkoKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy54fSwgJHt0aGlzLnl9XWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxufVxyXG5cclxuZnVuY3Rpb24gcHRBcmcodmFsOmFueSk6UG9pbnRcclxue1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCB8fCB2YWwgIT09IHVuZGVmaW5lZClcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gPFBvaW50PnZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLngsIHZhbC55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC5sZWZ0ICE9PSB1bmRlZmluZWQgJiYgdmFsLnRvcCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwubGVmdCwgdmFsLnRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KDxudW1iZXJbXT52YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnbnVtYmVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbn0iLCJpbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlLCBQb2ludElucHV0IH0gZnJvbSAnLi9Qb2ludCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0TGlrZVxyXG57XHJcbiAgICBsZWZ0Om51bWJlcjtcclxuICAgIHRvcDpudW1iZXI7XHJcbiAgICB3aWR0aDpudW1iZXI7XHJcbiAgICBoZWlnaHQ6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5OlJlY3QgPSBuZXcgUmVjdCgwLCAwLCAwLCAwKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21FZGdlcyhsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgcmlnaHQ6bnVtYmVyLCBib3R0b206bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgbGVmdCxcclxuICAgICAgICAgICAgdG9wLFxyXG4gICAgICAgICAgICByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgICAgIGJvdHRvbSAtIHRvcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTGlrZShsaWtlOlJlY3RMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21NYW55KHJlY3RzOlJlY3RbXSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlY3RzLm1hcCh4ID0+IFJlY3QucHJvdG90eXBlLnBvaW50cy5jYWxsKHgpKSk7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50cyguLi5wb2ludHM6UG9pbnRbXSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21Qb2ludEJ1ZmZlcihwb2ludHM6UG9pbnRbXSwgaW5kZXg/Om51bWJlciwgbGVuZ3RoPzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoMCwgbGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgTWF0aC5taW4oLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC55KSksXHJcbiAgICAgICAgICAgIE1hdGgubWF4KC4uLnBvaW50cy5tYXAocCA9PiBwLngpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueSkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlciA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IobGVmdDpudW1iZXIsIHRvcDpudW1iZXIsIHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHJpZ2h0KClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGJvdHRvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbnRlcigpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQgKyAodGhpcy53aWR0aCAvIDIpLCB0aGlzLnRvcCArICh0aGlzLmhlaWdodCAvIDIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9wTGVmdCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9pbnRzKCk6UG9pbnRbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb250YWlucyhpbnB1dDpQb2ludExpa2V8UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoaW5wdXRbJ3gnXSAhPT0gdW5kZWZpbmVkICYmIGlucHV0Wyd5J10gIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IDxQb2ludExpa2U+aW5wdXQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgcHQueCA+PSB0aGlzLmxlZnRcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPj0gdGhpcy50b3BcclxuICAgICAgICAgICAgICAgICYmIHB0LnggPD0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA8PSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZWN0ID0gPFJlY3RMaWtlPmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHJlY3QubGVmdCA+PSB0aGlzLmxlZnQgJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wID49IHRoaXMudG9wICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgKyByZWN0LndpZHRoIDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKHNpemU6UG9pbnRJbnB1dCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IFBvaW50LmNyZWF0ZShzaXplKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQsXHJcbiAgICAgICAgICAgIHRoaXMudG9wLFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgKyBwdC55LFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluZmxhdGUoc2l6ZTpQb2ludElucHV0KTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gUG9pbnQuY3JlYXRlKHNpemUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgdGhpcy5sZWZ0IC0gcHQueCxcclxuICAgICAgICAgICAgdGhpcy50b3AgLSBwdC55LFxyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0ICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5ib3R0b20gKyBwdC55XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2Zmc2V0KGJ5OlBvaW50SW5wdXQpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBQb2ludC5jcmVhdGUoYnkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCArIHB0LngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgcHQueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHRcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnRlcnNlY3RzKHJlY3Q6UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA+IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gdGhpcy50b3BcclxuICAgICAgICAgICAgJiYgcmVjdC5sZWZ0IDwgdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCA8IHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53aWR0aCA+PSAwICYmIHRoaXMuaGVpZ2h0ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4ID0gdGhpcy5sZWZ0O1xyXG4gICAgICAgIHZhciB5ID0gdGhpcy50b3A7XHJcbiAgICAgICAgdmFyIHcgPSB0aGlzLndpZHRoO1xyXG4gICAgICAgIHZhciBoID0gdGhpcy5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICh3IDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gdztcclxuICAgICAgICAgICAgdyA9IE1hdGguYWJzKHcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB5ICs9IGg7XHJcbiAgICAgICAgICAgIGggPSBNYXRoLmFicyhoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYFske3RoaXMubGVmdH0sICR7dGhpcy50b3B9LCAke3RoaXMud2lkdGh9LCAke3RoaXMuaGVpZ2h0fV1gO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudENhbGxiYWNrLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIGltcGxlbWVudHMgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgd3JhcCh0YXJnZXQ6RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyKTpFdmVudEVtaXR0ZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoISF0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD50YXJnZXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDxFdmVudEVtaXR0ZXI+dGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0OkV2ZW50VGFyZ2V0KVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmRpc3BhdGNoRXZlbnQoXHJcbiAgICAgICAgICAgIF8uZXh0ZW5kKG5ldyBFdmVudChldmVudCksIHsgYXJnczogYXJncyB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5sZXQgVHJhY2tlcjpPYmplY3RJbmRleDxib29sZWFuPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlDaGVja1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGluaXQoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFUcmFja2VyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgVHJhY2tlciA9IHt9O1xyXG5cclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gdHJ1ZSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlOiBLZXlib2FyZEV2ZW50KSA9PiBUcmFja2VyW2Uua2V5Q29kZV0gPSBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZG93bihrZXk6bnVtYmVyKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhVHJhY2tlciAmJiAhIVRyYWNrZXJba2V5XTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBLZXlFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpLZXlFeHByZXNzaW9uXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGV4Y2x1c2l2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGtleXMgPSBpbnB1dFxyXG4gICAgICAgICAgICAuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBLZXlzLnBhcnNlKHgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlFeHByZXNzaW9uKGtleXMsIGV4Y2x1c2l2ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGN0cmw6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBhbHQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzaGlmdDpib29sZWFuO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtleTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXhjbHVzaXZlOmJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihrZXlzOm51bWJlcltdLCBleGNsdXNpdmU6Ym9vbGVhbilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmV4Y2x1c2l2ZSA9IGV4Y2x1c2l2ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHJsID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5DVFJMKTtcclxuICAgICAgICB0aGlzLmFsdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQUxUKTtcclxuICAgICAgICB0aGlzLnNoaWZ0ID0ga2V5cy5zb21lKHggPT4geCA9PT0gS2V5cy5TSElGVCk7XHJcbiAgICAgICAgdGhpcy5rZXkgPSBrZXlzLmZpbHRlcih4ID0+IHggIT09IEtleXMuQ1RSTCAmJiB4ICE9PSBLZXlzLkFMVCAmJiB4ICE9PSBLZXlzLlNISUZUKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXRjaGVzKGtleURhdGE6S2V5RXhwcmVzc2lvbnxLZXlib2FyZEV2ZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlFeHByZXNzaW9uKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmwgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RybCA9PSBrZXlEYXRhLmN0cmxLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx0ID09IGtleURhdGEuYWx0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoaWZ0ID09IGtleURhdGEuc2hpZnRLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMua2V5ID09IGtleURhdGEua2V5Q29kZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgJ0tleUV4cHJlc3Npb24ubWF0Y2hlczogSW52YWxpZCBpbnB1dCc7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuXHJcblxyXG5leHBvcnQgdHlwZSBLZXlNYXBwYWJsZSA9IEV2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlckJhc2U7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEtleU1hcENhbGxiYWNrXHJcbntcclxuICAgIChlPzpLZXlib2FyZEV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5SW5wdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBmb3IoLi4uZWxtdHM6S2V5TWFwcGFibGVbXSk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEtleUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViczpFdmVudFN1YnNjcmlwdGlvbltdID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXJzOkV2ZW50RW1pdHRlcltdKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihleHByczpzdHJpbmd8c3RyaW5nW10sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpLZXlJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHBycykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbihbPHN0cmluZz5leHByc10sIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJlIG9mIGV4cHJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHNzID0gdGhpcy5lbWl0dGVycy5tYXAoZWUgPT4gdGhpcy5jcmVhdGVMaXN0ZW5lcihcclxuICAgICAgICAgICAgICAgIGVlLFxyXG4gICAgICAgICAgICAgICAgS2V5RXhwcmVzc2lvbi5wYXJzZShyZSksXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUxpc3RlbmVyKGVlOkV2ZW50RW1pdHRlciwga2U6S2V5RXhwcmVzc2lvbiwgY2FsbGJhY2s6S2V5TWFwQ2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVlLm9uKCdrZXlkb3duJywgKGV2dDpLZXlib2FyZEV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGtlLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGtlLmV4Y2x1c2l2ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUoa21zOktleU1hcHBhYmxlW10pOkV2ZW50RW1pdHRlcltdXHJcbntcclxuICAgIHJldHVybiA8RXZlbnRFbWl0dGVyW10+a21zXHJcbiAgICAgICAgLm1hcCh4ID0+ICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICAgICAgPyBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD54KVxyXG4gICAgICAgICAgICA6IHhcclxuICAgICAgICApO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBLZXlFeHByZXNzaW9uIH0gZnJvbSAnLi9LZXlFeHByZXNzaW9uJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5c1xyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIEJBQ0tTUEFDRSA9IDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFRBQiA9IDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVOVEVSID0gMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNISUZUID0gMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIENUUkwgPSAxNztcclxuICAgIHB1YmxpYyBzdGF0aWMgQUxUID0gMTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBVVNFID0gMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIENBUFNfTE9DSyA9IDIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBFU0NBUEUgPSAyNztcclxuICAgIHB1YmxpYyBzdGF0aWMgU1BBQ0UgPSAzMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9VUCA9IDMzO1xyXG4gICAgcHVibGljIHN0YXRpYyBQQUdFX0RPV04gPSAzNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5EID0gMzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEhPTUUgPSAzNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9BUlJPVyA9IDM3O1xyXG4gICAgcHVibGljIHN0YXRpYyBVUF9BUlJPVyA9IDM4O1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9BUlJPVyA9IDM5O1xyXG4gICAgcHVibGljIHN0YXRpYyBET1dOX0FSUk9XID0gNDA7XHJcbiAgICBwdWJsaWMgc3RhdGljIElOU0VSVCA9IDQ1O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUxFVEUgPSA0NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzAgPSA0ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzEgPSA0OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzIgPSA1MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzMgPSA1MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzQgPSA1MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzUgPSA1MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzYgPSA1NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzcgPSA1NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzggPSA1NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZXzkgPSA1NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0EgPSA2NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0IgPSA2NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0MgPSA2NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0QgPSA2ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0UgPSA2OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0YgPSA3MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0cgPSA3MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ggPSA3MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0kgPSA3MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0ogPSA3NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0sgPSA3NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX0wgPSA3NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX00gPSA3NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX04gPSA3ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX08gPSA3OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1AgPSA4MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1EgPSA4MTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1IgPSA4MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1MgPSA4MztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1QgPSA4NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1UgPSA4NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1YgPSA4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1cgPSA4NztcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ggPSA4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1kgPSA4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgS0VZX1ogPSA5MDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTEVGVF9NRVRBID0gOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIFJJR0hUX01FVEEgPSA5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VMRUNUID0gOTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8wID0gOTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8xID0gOTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8yID0gOTg7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF8zID0gOTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF80ID0gMTAwO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNSA9IDEwMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzYgPSAxMDI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF83ID0gMTAzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfOCA9IDEwNDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzkgPSAxMDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIE1VTFRJUExZID0gMTA2O1xyXG4gICAgcHVibGljIHN0YXRpYyBBREQgPSAxMDc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNVQlRSQUNUID0gMTA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBERUNJTUFMID0gMTEwO1xyXG4gICAgcHVibGljIHN0YXRpYyBESVZJREUgPSAxMTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxID0gMTEyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMiA9IDExMztcclxuICAgIHB1YmxpYyBzdGF0aWMgRjMgPSAxMTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY0ID0gMTE1O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNSA9IDExNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjYgPSAxMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY3ID0gMTE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBGOCA9IDExOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjkgPSAxMjA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMCA9IDEyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjExID0gMTIyO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTIgPSAxMjM7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTV9MT0NLID0gMTQ0O1xyXG4gICAgcHVibGljIHN0YXRpYyBTQ1JPTExfTE9DSyA9IDE0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0VNSUNPTE9OID0gMTg2O1xyXG4gICAgcHVibGljIHN0YXRpYyBFUVVBTFMgPSAxODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIENPTU1BID0gMTg4O1xyXG4gICAgcHVibGljIHN0YXRpYyBEQVNIID0gMTg5O1xyXG4gICAgcHVibGljIHN0YXRpYyBQRVJJT0QgPSAxOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEZPUldBUkRfU0xBU0ggPSAxOTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEdSQVZFX0FDQ0VOVCA9IDE5MjtcclxuICAgIHB1YmxpYyBzdGF0aWMgT1BFTl9CUkFDS0VUID0gMjE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLX1NMQVNIID0gMjIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBDTE9TRV9CUkFDS0VUID0gMjIxO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSU5HTEVfUVVPVEUgPSAyMjI7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBwYXJzZShpbnB1dDpzdHJpbmcsIHRocm93bk9uRmFpbDpib29sZWFuID0gdHJ1ZSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoIChpbnB1dC50cmltKCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLU1BBQ0UnOiByZXR1cm4gS2V5cy5CQUNLU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1RBQic6IHJldHVybiBLZXlzLlRBQjtcclxuICAgICAgICAgICAgY2FzZSAnRU5URVInOiByZXR1cm4gS2V5cy5FTlRFUjtcclxuICAgICAgICAgICAgY2FzZSAnU0hJRlQnOiByZXR1cm4gS2V5cy5TSElGVDtcclxuICAgICAgICAgICAgY2FzZSAnQ1RSTCc6IHJldHVybiBLZXlzLkNUUkw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FMVCc6IHJldHVybiBLZXlzLkFMVDtcclxuICAgICAgICAgICAgY2FzZSAnUEFVU0UnOiByZXR1cm4gS2V5cy5QQVVTRTtcclxuICAgICAgICAgICAgY2FzZSAnQ0FQU19MT0NLJzogcmV0dXJuIEtleXMuQ0FQU19MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdFU0NBUEUnOiByZXR1cm4gS2V5cy5FU0NBUEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NQQUNFJzogcmV0dXJuIEtleXMuU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBR0VfVVAnOiByZXR1cm4gS2V5cy5QQUdFX1VQO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX0RPV04nOiByZXR1cm4gS2V5cy5QQUdFX0RPV047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VORCc6IHJldHVybiBLZXlzLkVORDtcclxuICAgICAgICAgICAgY2FzZSAnSE9NRSc6IHJldHVybiBLZXlzLkhPTUU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfQVJST1cnOiByZXR1cm4gS2V5cy5MRUZUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdVUF9BUlJPVyc6IHJldHVybiBLZXlzLlVQX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdSSUdIVF9BUlJPVyc6IHJldHVybiBLZXlzLlJJR0hUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdET1dOX0FSUk9XJzogcmV0dXJuIEtleXMuRE9XTl9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnSU5TRVJUJzogcmV0dXJuIEtleXMuSU5TRVJUO1xyXG4gICAgICAgICAgICBjYXNlICdERUxFVEUnOiByZXR1cm4gS2V5cy5ERUxFVEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8wJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8xJzogcmV0dXJuIEtleXMuS0VZXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8yJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8zJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV80JzogcmV0dXJuIEtleXMuS0VZXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV81JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV82JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV83JzogcmV0dXJuIEtleXMuS0VZXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV84JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV85JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9BJzogcmV0dXJuIEtleXMuS0VZX0E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9CJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9DJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9EJzogcmV0dXJuIEtleXMuS0VZX0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9FJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9GJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9HJzogcmV0dXJuIEtleXMuS0VZX0c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9IJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9JJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9KJzogcmV0dXJuIEtleXMuS0VZX0o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9LJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9MJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9NJzogcmV0dXJuIEtleXMuS0VZX007XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9OJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9PJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9QJzogcmV0dXJuIEtleXMuS0VZX1A7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9RJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9SJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9TJzogcmV0dXJuIEtleXMuS0VZX1M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9UJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9VJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9WJzogcmV0dXJuIEtleXMuS0VZX1Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9XJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9YJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9ZJzogcmV0dXJuIEtleXMuS0VZX1k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9aJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJzAnOiByZXR1cm4gS2V5cy5LRVlfMDtcclxuICAgICAgICAgICAgY2FzZSAnMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICcyJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJzMnOiByZXR1cm4gS2V5cy5LRVlfMztcclxuICAgICAgICAgICAgY2FzZSAnNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICc1JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJzYnOiByZXR1cm4gS2V5cy5LRVlfNjtcclxuICAgICAgICAgICAgY2FzZSAnNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICc4JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJzknOiByZXR1cm4gS2V5cy5LRVlfOTtcclxuICAgICAgICAgICAgY2FzZSAnQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdCJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gS2V5cy5LRVlfQztcclxuICAgICAgICAgICAgY2FzZSAnRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdFJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YnOiByZXR1cm4gS2V5cy5LRVlfRjtcclxuICAgICAgICAgICAgY2FzZSAnRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdIJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0knOiByZXR1cm4gS2V5cy5LRVlfSTtcclxuICAgICAgICAgICAgY2FzZSAnSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0wnOiByZXR1cm4gS2V5cy5LRVlfTDtcclxuICAgICAgICAgICAgY2FzZSAnTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdOJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ08nOiByZXR1cm4gS2V5cy5LRVlfTztcclxuICAgICAgICAgICAgY2FzZSAnUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdRJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ1InOiByZXR1cm4gS2V5cy5LRVlfUjtcclxuICAgICAgICAgICAgY2FzZSAnUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdUJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gS2V5cy5LRVlfVTtcclxuICAgICAgICAgICAgY2FzZSAnVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdXJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1gnOiByZXR1cm4gS2V5cy5LRVlfWDtcclxuICAgICAgICAgICAgY2FzZSAnWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdaJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfTUVUQSc6IHJldHVybiBLZXlzLkxFRlRfTUVUQTtcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfTUVUQSc6IHJldHVybiBLZXlzLlJJR0hUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NFTEVDVCc6IHJldHVybiBLZXlzLlNFTEVDVDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzAnOiByZXR1cm4gS2V5cy5OVU1QQURfMDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzEnOiByZXR1cm4gS2V5cy5OVU1QQURfMTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzInOiByZXR1cm4gS2V5cy5OVU1QQURfMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzMnOiByZXR1cm4gS2V5cy5OVU1QQURfMztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzQnOiByZXR1cm4gS2V5cy5OVU1QQURfNDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzUnOiByZXR1cm4gS2V5cy5OVU1QQURfNTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzYnOiByZXR1cm4gS2V5cy5OVU1QQURfNjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzcnOiByZXR1cm4gS2V5cy5OVU1QQURfNztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzgnOiByZXR1cm4gS2V5cy5OVU1QQURfODtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzknOiByZXR1cm4gS2V5cy5OVU1QQURfOTtcclxuICAgICAgICAgICAgY2FzZSAnTVVMVElQTFknOiByZXR1cm4gS2V5cy5NVUxUSVBMWTtcclxuICAgICAgICAgICAgY2FzZSAnQUREJzogcmV0dXJuIEtleXMuQUREO1xyXG4gICAgICAgICAgICBjYXNlICdTVUJUUkFDVCc6IHJldHVybiBLZXlzLlNVQlRSQUNUO1xyXG4gICAgICAgICAgICBjYXNlICdERUNJTUFMJzogcmV0dXJuIEtleXMuREVDSU1BTDtcclxuICAgICAgICAgICAgY2FzZSAnRElWSURFJzogcmV0dXJuIEtleXMuRElWSURFO1xyXG4gICAgICAgICAgICBjYXNlICdGMSc6IHJldHVybiBLZXlzLkYxO1xyXG4gICAgICAgICAgICBjYXNlICdGMic6IHJldHVybiBLZXlzLkYyO1xyXG4gICAgICAgICAgICBjYXNlICdGMyc6IHJldHVybiBLZXlzLkYzO1xyXG4gICAgICAgICAgICBjYXNlICdGNCc6IHJldHVybiBLZXlzLkY0O1xyXG4gICAgICAgICAgICBjYXNlICdGNSc6IHJldHVybiBLZXlzLkY1O1xyXG4gICAgICAgICAgICBjYXNlICdGNic6IHJldHVybiBLZXlzLkY2O1xyXG4gICAgICAgICAgICBjYXNlICdGNyc6IHJldHVybiBLZXlzLkY3O1xyXG4gICAgICAgICAgICBjYXNlICdGOCc6IHJldHVybiBLZXlzLkY4O1xyXG4gICAgICAgICAgICBjYXNlICdGOSc6IHJldHVybiBLZXlzLkY5O1xyXG4gICAgICAgICAgICBjYXNlICdGMTAnOiByZXR1cm4gS2V5cy5GMTA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMSc6IHJldHVybiBLZXlzLkYxMTtcclxuICAgICAgICAgICAgY2FzZSAnRjEyJzogcmV0dXJuIEtleXMuRjEyO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1fTE9DSyc6IHJldHVybiBLZXlzLk5VTV9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTQ1JPTExfTE9DSyc6IHJldHVybiBLZXlzLlNDUk9MTF9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTRU1JQ09MT04nOiByZXR1cm4gS2V5cy5TRU1JQ09MT047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VRVUFMUyc6IHJldHVybiBLZXlzLkVRVUFMUztcclxuICAgICAgICAgICAgY2FzZSAnQ09NTUEnOiByZXR1cm4gS2V5cy5DT01NQTtcclxuICAgICAgICAgICAgY2FzZSAnREFTSCc6IHJldHVybiBLZXlzLkRBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BFUklPRCc6IHJldHVybiBLZXlzLlBFUklPRDtcclxuICAgICAgICAgICAgY2FzZSAnRk9SV0FSRF9TTEFTSCc6IHJldHVybiBLZXlzLkZPUldBUkRfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0dSQVZFX0FDQ0VOVCc6IHJldHVybiBLZXlzLkdSQVZFX0FDQ0VOVDtcclxuICAgICAgICAgICAgY2FzZSAnT1BFTl9CUkFDS0VUJzogcmV0dXJuIEtleXMuT1BFTl9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLX1NMQVNIJzogcmV0dXJuIEtleXMuQkFDS19TTEFTSDtcclxuICAgICAgICAgICAgY2FzZSAnQ0xPU0VfQlJBQ0tFVCc6IHJldHVybiBLZXlzLkNMT1NFX0JSQUNLRVQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NJTkdMRV9RVU9URSc6IHJldHVybiBLZXlzLlNJTkdMRV9RVU9URTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd25PbkZhaWwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQga2V5OiAnICsgaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQgfSBmcm9tICcuLi9taXNjL1BvbHlmaWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50JztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY2hlY2soZWxtdDpIVE1MRWxlbWVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlbG10LmRhdGFzZXRbJ01vdXNlRHJhZ0V2ZW50U3VwcG9ydCddID09PSAndHJ1ZSc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmFibGUoZWxtdDpIVE1MRWxlbWVudCk6TW91c2VEcmFnRXZlbnRTdXBwb3J0XHJcbiAgICB7XHJcbiAgICAgICAgZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9ICd0cnVlJztcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydChlbG10KTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgc2hvdWxkRHJhZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgaXNEcmFnZ2luZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcm90ZWN0ZWQgc3RhcnRQb2ludDpQb2ludDtcclxuICAgIHByb3RlY3RlZCBsYXN0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgY2FuY2VsOigpID0+IHZvaWQ7XHJcbiAgICBwcm90ZWN0ZWQgbGlzdGVuZXI6YW55O1xyXG5cclxuICAgIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgZWxtdDpIVE1MRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVsbXQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5saXN0ZW5lciA9IHRoaXMub25UYXJnZXRNb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvblRhcmdldE1vdXNlRG93bihlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gdGhpcy5sYXN0UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBsZXQgbW92ZUhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VNb3ZlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgbGV0IHVwSGFuZGxlciA9IHRoaXMub25XaW5kb3dNb3VzZVVwLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FuY2VsID0gKCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdXBIYW5kbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGxldCBuZXdQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNob3VsZERyYWcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2JlZ2luJywgZSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWcnLCBlLCBuZXdQb2ludC5zdWJ0cmFjdCh0aGlzLmxhc3RQb2ludCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0UG9pbnQgPSBuZXdQb2ludDtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25XaW5kb3dNb3VzZVVwKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbG10LmRpc3BhdGNoRXZlbnQodGhpcy5jcmVhdGVFdmVudCgnZHJhZ2VuZCcsIGUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvdWxkRHJhZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FuY2VsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFdmVudCh0eXBlOnN0cmluZywgc291cmNlOk1vdXNlRXZlbnQsIGRpc3Q/OlBvaW50KTpNb3VzZURyYWdFdmVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBldmVudCA9IDxNb3VzZURyYWdFdmVudD4oaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRYID0gdGhpcy5zdGFydFBvaW50Lng7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRZID0gdGhpcy5zdGFydFBvaW50Lnk7XHJcblxyXG4gICAgICAgIGlmIChkaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXZlbnQuZGlzdFggPSBkaXN0Lng7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RZID0gZGlzdC55O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbiIsImltcG9ydCB7IEtleXMgfSBmcm9tICcuL0tleXMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTW91c2VFdmVudFR5cGUgPSAnY2xpY2snfCdkYmxjbGljayd8J21vdXNlZG93bid8J21vdXNlbW92ZSd8J21vdXNldXAnfCdkcmFnYmVnaW4nfCdkcmFnJ3wnZHJhZ2VuZCdcclxuXHJcbmZ1bmN0aW9uIHBhcnNlX2V2ZW50KHZhbHVlOnN0cmluZyk6TW91c2VFdmVudFR5cGVcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgICAgIHJldHVybiA8TW91c2VFdmVudFR5cGU+KCdtb3VzZScgKyB2YWx1ZSk7XHJcbiAgICAgICAgY2FzZSAnY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2RibGNsaWNrJzpcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgY2FzZSAnZHJhZ2JlZ2luJzpcclxuICAgICAgICBjYXNlICdkcmFnJzpcclxuICAgICAgICBjYXNlICdkcmFnZW5kJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxNb3VzZUV2ZW50VHlwZT52YWx1ZTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBNb3VzZUV2ZW50VHlwZTogJyArIHZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZV9idXR0b24odmFsdWU6c3RyaW5nKTpudW1iZXJcclxue1xyXG4gICAgdmFsdWUgPSAodmFsdWUgfHwgJycpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgc3dpdGNoICh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBjYXNlICdwcmltYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24xJzpcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgY2FzZSAnc2Vjb25kYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24yJzpcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMyc6XHJcbiAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlQnV0dG9uOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpdmlkZV9leHByZXNzaW9uKHZhbHVlOnN0cmluZyk6c3RyaW5nW11cclxue1xyXG4gICAgbGV0IHBhcnRzID0gdmFsdWUuc3BsaXQoJzonKTtcclxuXHJcbiAgICBpZiAocGFydHMubGVuZ3RoID09IDEpXHJcbiAgICB7XHJcbiAgICAgICAgcGFydHMuc3BsaWNlKDAsIDAsICdkb3duJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnRzLnNsaWNlKDAsIDIpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VFeHByZXNzaW9uXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nKTpNb3VzZUV4cHJlc3Npb25cclxuICAgIHtcclxuICAgICAgICBsZXQgY2ZnID0gPGFueT57XHJcbiAgICAgICAgICAgIGtleXM6IFtdLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNmZy5leGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChjZmcuZXhjbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHIoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgW2xlZnQsIHJpZ2h0XSA9IGRpdmlkZV9leHByZXNzaW9uKGlucHV0KTtcclxuXHJcbiAgICAgICAgY2ZnLmV2ZW50ID0gcGFyc2VfZXZlbnQobGVmdCk7XHJcblxyXG4gICAgICAgIHJpZ2h0LnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBLZXlzLnBhcnNlKHgsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5idXR0b24gPSBwYXJzZV9idXR0b24oeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRXhwcmVzc2lvbihjZmcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBldmVudDpNb3VzZUV2ZW50VHlwZSA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnV0dG9uOm51bWJlciA9IG51bGw7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5czpudW1iZXJbXSA9IFtdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihjZmc6YW55KVxyXG4gICAge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIGNmZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hdGNoZXMobW91c2VEYXRhOk1vdXNlRXZlbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ldmVudCAhPT0gbW91c2VEYXRhLnR5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYnV0dG9uICE9PSBudWxsICYmIHRoaXMuYnV0dG9uICE9PSBtb3VzZURhdGEuYnV0dG9uKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGsgb2YgdGhpcy5rZXlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFLZXlDaGVjay5kb3duKGspKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIEV2ZW50RW1pdHRlckJhc2UsIEV2ZW50U3Vic2NyaXB0aW9uIH0gZnJvbSAnLi4vdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcbmltcG9ydCB7IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlciB9IGZyb20gJy4vRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyJztcclxuaW1wb3J0IHsgTW91c2VFeHByZXNzaW9uIH0gZnJvbSAnLi9Nb3VzZUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudFN1cHBvcnQgfSBmcm9tICcuL01vdXNlRHJhZ0V2ZW50U3VwcG9ydCc7XHJcbmltcG9ydCB7IEtleUNoZWNrIH0gZnJvbSAnLi9LZXlDaGVjayc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgTWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNb3VzZUNhbGxiYWNrXHJcbntcclxuICAgIChlOkV2ZW50KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VJbnB1dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGZvciguLi5lbG10czpNYXBwYWJsZVtdKTpNb3VzZUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgS2V5Q2hlY2suaW5pdCgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcjpzdHJpbmcsIGNhbGxiYWNrOk1vdXNlQ2FsbGJhY2spOk1vdXNlSW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgc3MgPSB0aGlzLmVtaXR0ZXJzLm1hcChlZSA9PiB0aGlzLmNyZWF0ZUxpc3RlbmVyKFxyXG4gICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgTW91c2VFeHByZXNzaW9uLnBhcnNlKGV4cHIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjaykpO1xyXG5cclxuICAgICAgICB0aGlzLnN1YnMgPSB0aGlzLnN1YnMuY29uY2F0KHNzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcih0YXJnZXQ6RXZlbnRFbWl0dGVyLCBleHByOk1vdXNlRXhwcmVzc2lvbiwgY2FsbGJhY2s6TW91c2VDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0Lm9uKGV4cHIuZXZlbnQsIChldnQ6TW91c2VFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChleHByLm1hdGNoZXMoZXZ0KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4cHIuZXhjbHVzaXZlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZShrbXM6TWFwcGFibGVbXSk6RXZlbnRFbWl0dGVyW11cclxue1xyXG4gICAgcmV0dXJuIDxFdmVudEVtaXR0ZXJbXT5rbXNcclxuICAgICAgICAubWFwKHggPT4gKCEheFsnYWRkRXZlbnRMaXN0ZW5lciddKVxyXG4gICAgICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoPEV2ZW50VGFyZ2V0PngpXHJcbiAgICAgICAgICAgIDogeFxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbiIsImltcG9ydCAqIGFzIGJhc2VzIGZyb20gJ2Jhc2VzJztcclxuXHJcblxyXG5jb25zdCBBbHBoYTI2ID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlMjZcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBudW0obnVtOm51bWJlcik6QmFzZTI2IFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmFzZTI2KG51bSwgYmFzZXMudG9BbHBoYWJldChudW0sIEFscGhhMjYpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHN0cihzdHI6c3RyaW5nKTpCYXNlMjYgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCYXNlMjYoYmFzZXMuZnJvbUFscGhhYmV0KHN0ci50b1VwcGVyQ2FzZSgpLCBBbHBoYTI2KSwgc3RyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbnVtOm51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBzdHI6c3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IobnVtOm51bWJlciwgc3RyOnN0cmluZykgXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5udW0gPSBudW07XHJcbiAgICAgICAgdGhpcy5zdHIgPSBzdHI7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShodG1sOnN0cmluZyk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgbGV0IGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICBsZXQgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcclxuICAgIGZyYWcuYXBwZW5kQ2hpbGQoYm9keSk7XHJcbiAgICBib2R5LmlubmVySFRNTCA9IGh0bWw7XHJcblxyXG4gICAgcmV0dXJuIDxIVE1MRWxlbWVudD5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3NzKGU6SFRNTEVsZW1lbnQsIHN0eWxlczpPYmplY3RNYXA8c3RyaW5nPik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpXHJcbiAgICB7XHJcbiAgICAgICAgZS5zdHlsZVtwcm9wXSA9IHN0eWxlc1twcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpdChlOkhUTUxFbGVtZW50LCB0YXJnZXQ6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwge1xyXG4gICAgICAgIHdpZHRoOiB0YXJnZXQuY2xpZW50V2lkdGggKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCcsXHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhpZGUoZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdub25lJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3coZTpIVE1MRWxlbWVudCk6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdibG9jaycgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGUoZTpIVE1MRWxlbWVudCwgdmlzaWJsZTpib29sZWFuKTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gdmlzaWJsZSA/IHNob3coZSkgOiBoaWRlKGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlVHJhbnNpdGlvbihlOkhUTUxFbGVtZW50LCBwcm9wOnN0cmluZywgbWlsbGlzOm51bWJlciwgZWFzZTpzdHJpbmcgPSAnbGluZWFyJyk6dm9pZFxyXG57XHJcbiAgICBlLnN0eWxlLnRyYW5zaXRpb24gPSBgJHtwcm9wfSAke21pbGxpc31tcyAke2Vhc2V9YDtcclxuICAgIGNvbnNvbGUubG9nKGUuc3R5bGUudHJhbnNpdGlvbik7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IGUuc3R5bGUudHJhbnNpdGlvbiA9ICcnLCBtaWxsaXMpO1xyXG59IiwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQodHlwZTpzdHJpbmcsIHNvdXJjZTpNb3VzZUV2ZW50KTpNb3VzZUV2ZW50XHJcbntcclxuICAgIGlmIChNb3VzZUV2ZW50LnByb3RvdHlwZS5pbml0TW91c2VFdmVudClcclxuICAgIHtcclxuICAgICAgICBsZXQgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRcIik7XHJcbiAgICAgICAgZXZlbnQuaW5pdE1vdXNlRXZlbnQoXHJcbiAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgIHNvdXJjZS5idWJibGVzLFxyXG4gICAgICAgICAgICBzb3VyY2UuY2FuY2VsYWJsZSxcclxuICAgICAgICAgICAgd2luZG93LFxyXG4gICAgICAgICAgICBzb3VyY2UuZGV0YWlsLFxyXG4gICAgICAgICAgICBzb3VyY2Uuc2NyZWVuWCxcclxuICAgICAgICAgICAgc291cmNlLnNjcmVlblksXHJcbiAgICAgICAgICAgIHNvdXJjZS5jbGllbnRYLFxyXG4gICAgICAgICAgICBzb3VyY2UuY2xpZW50WSxcclxuICAgICAgICAgICAgc291cmNlLmN0cmxLZXksXHJcbiAgICAgICAgICAgIHNvdXJjZS5hbHRLZXksXHJcbiAgICAgICAgICAgIHNvdXJjZS5zaGlmdEtleSxcclxuICAgICAgICAgICAgc291cmNlLm1ldGFLZXksXHJcbiAgICAgICAgICAgIHNvdXJjZS5idXR0b24sXHJcbiAgICAgICAgICAgIHNvdXJjZS5yZWxhdGVkVGFyZ2V0LFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgTW91c2VFdmVudCh0eXBlLCBzb3VyY2UpO1xyXG4gICAgfVxyXG59IiwiZXhwb3J0IGludGVyZmFjZSBQcm9wZXJ0eUNoYW5nZWRDYWxsYmFja1xyXG57XHJcbiAgICAob2JqOmFueSwgdmFsOmFueSk6dm9pZFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkoZGVmYXVsdFZhbHVlOmFueSwgZmlsdGVyOlByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjphbnksIHByb3BOYW1lOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBwcm9wTmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IHRoaXNbJ19fJyArIHByb3BOYW1lXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsID09PSB1bmRlZmluZWQpID8gZGVmYXVsdFZhbHVlIDogdmFsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcE5hbWVdID0gbmV3VmFsO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHRoaXMsIG5ld1ZhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsIlxyXG5cclxubGV0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKTtcclxubGV0IGNvdW50ID0gMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWZHZW5cclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBuZXh0KHByZWZpeDpzdHJpbmcgPSAnQycpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBwcmVmaXggKyBzdGFydCArICctJyArIChjb3VudCsrKTtcclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb2FsZXNjZTxUPiguLi5pbnB1dHM6VFtdKTpUXHJcbntcclxuICAgIGZvciAobGV0IHggb2YgaW5wdXRzKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh4ICE9PSB1bmRlZmluZWQgJiYgeCAhPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKHRhcmdldDphbnksIGRhdGE6YW55KTphbnlcclxue1xyXG4gICAgZm9yIChsZXQgayBpbiBkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIHRhcmdldFtrXSA9IGRhdGFba107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4PFQ+KGFycjpUW10sIGluZGV4ZXI6KHRtOlQpID0+IG51bWJlcnxzdHJpbmcpOk9iamVjdE1hcDxUPlxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgdG0gb2YgYXJyKVxyXG4gICAge1xyXG4gICAgICAgIG9ialtpbmRleGVyKHRtKV0gPSB0bTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbjxUPihhYTphbnkpOlRbXSBcclxue1xyXG4gICAgbGV0IGEgPSBbXSBhcyBhbnk7XHJcbiAgICBmb3IgKGxldCB0bSBvZiBhYSkgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodG0pKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGEgPSBhLmNvbmNhdChmbGF0dGVuKHRtKSk7XHJcbiAgICAgICAgfSBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYS5wdXNoKHRtKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhIGFzIFRbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGtleXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpzdHJpbmdbXVxyXG57XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaXgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsdWVzPFQ+KGl4Ok9iamVjdEluZGV4PFQ+fE9iamVjdE1hcDxUPik6VFtdXHJcbntcclxuICAgIGxldCBhOlRbXSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGsgaW4gaXgpXHJcbiAgICB7XHJcbiAgICAgICAgYS5wdXNoKGl4W2tdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHppcFBhaXJzKHBhaXJzOmFueVtdW10pOmFueVxyXG57XHJcbiAgICBsZXQgb2JqID0ge307XHJcblxyXG4gICAgZm9yIChsZXQgcGFpciBvZiBwYWlycylcclxuICAgIHtcclxuICAgICAgICBvYmpbcGFpclswXV0gPSBwYWlyWzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bnppcFBhaXJzKHBhaXJzOmFueSk6YW55W11bXVxyXG57XHJcbiAgICBsZXQgYXJyID0gW107XHJcblxyXG4gICAgZm9yIChsZXQga2V5IGluIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIGFyci5wdXNoKFtrZXksIHBhaXJzW2tleV1dKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXJyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4PFQ+KGFycjpUW10sIHNlbGVjdG9yOih0OlQpID0+IG51bWJlcik6VFxyXG57XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBsZXQgdCA9IGFyclswXTtcclxuXHJcbiAgICBmb3IgKGxldCB4IG9mIGFycilcclxuICAgIHtcclxuICAgICAgICBpZiAoc2VsZWN0b3IodCkgPCBzZWxlY3Rvcih4KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHQgPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNoYWRvd0Nsb25lKHRhcmdldDphbnkpOmFueVxyXG57XHJcbiAgICBpZiAodHlwZW9mKHRhcmdldCkgPT09ICdvYmplY3QnKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzYyA9IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0YXJnZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzY1twcm9wXSA9IHNoYWRvd0Nsb25lKHRhcmdldFtwcm9wXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2M7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhcmdldDtcclxufSIsImltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uL21pc2MvQmFzZTI2JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZXNjcmliZXMgYSByZXNvbHZlRXhwciBvZiBncmlkIGNlbGxzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdyaWRSYW5nZVxyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBuZXcgR3JpZFJhbmdlIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSBjZWxscyB3aXRoIHRoZSBzcGVjaWZpZWQgcmVmcyBmcm9tIHRoZVxyXG4gICAgICogc3BlY2lmaWVkIG1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBtb2RlbFxyXG4gICAgICogQHBhcmFtIGNlbGxSZWZzXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKG1vZGVsOkdyaWRNb2RlbCwgY2VsbFJlZnM6c3RyaW5nW10pOkdyaWRSYW5nZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsb29rdXAgPSBfLmluZGV4KGNlbGxSZWZzLCB4ID0+IHgpO1xyXG5cclxuICAgICAgICBsZXQgY2VsbHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCBsYyA9IE51bWJlci5NQVhfVkFMVUUsIGxyID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuICAgICAgICBsZXQgaGMgPSBOdW1iZXIuTUlOX1ZBTFVFLCBociA9IE51bWJlci5NSU5fVkFMVUU7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgb2YgbW9kZWwuY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWxvb2t1cFtjLnJlZl0pXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGNlbGxzLnB1c2goYyk7XHJcblxyXG4gICAgICAgICAgICBpZiAobGMgPiBjLmNvbFJlZikgbGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGhjIDwgYy5jb2xSZWYpIGhjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChsciA+IGMucm93UmVmKSBsciA9IGMucm93UmVmO1xyXG4gICAgICAgICAgICBpZiAoaHIgPCBjLnJvd1JlZikgaHIgPSBjLnJvd1JlZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBsdHIgPSBjZWxscy5zb3J0KGx0cl9zb3J0KTtcclxuICAgICAgICBsZXQgdHRiID0gY2VsbHMuc2xpY2UoMCkuc29ydCh0dGJfc29ydCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgR3JpZFJhbmdlKHtcclxuICAgICAgICAgICAgbHRyOiBsdHIsXHJcbiAgICAgICAgICAgIHR0YjogdHRiLFxyXG4gICAgICAgICAgICB3aWR0aDogaGMgLSBsYyxcclxuICAgICAgICAgICAgaGVpZ2h0OiBociAtIGxyLFxyXG4gICAgICAgICAgICBsZW5ndGg6IChoYyAtIGxjKSAqIChociAtIGxyKSxcclxuICAgICAgICAgICAgY291bnQ6IGNlbGxzLmxlbmd0aCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhcHR1cmVzIGEgcmFuZ2Ugb2YgY2VsbHMgZnJvbSB0aGUgc3BlY2lmaWVkIG1vZGVsIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgdmVjdG9ycy4gIFRoZSB2ZWN0b3JzIHNob3VsZCBiZVxyXG4gICAgICogdHdvIHBvaW50cyBpbiBncmlkIGNvb3JkaW5hdGVzIChlLmcuIGNvbCBhbmQgcm93IHJlZmVyZW5jZXMpIHRoYXQgZHJhdyBhIGxvZ2ljYWwgbGluZSBhY3Jvc3MgdGhlIGdyaWQuXHJcbiAgICAgKiBBbnkgY2VsbHMgZmFsbGluZyBpbnRvIHRoZSByZWN0YW5nbGUgY3JlYXRlZCBmcm9tIHRoZXNlIHR3byBwb2ludHMgd2lsbCBiZSBpbmNsdWRlZCBpbiB0aGUgc2VsZWN0ZWQgcmVzb2x2ZUV4cHIuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gZnJvbVxyXG4gICAgICogQHBhcmFtIHRvXHJcbiAgICAgKiBAcGFyYW0gdG9JbmNsdXNpdmVcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjYXB0dXJlKG1vZGVsOkdyaWRNb2RlbCwgZnJvbTpQb2ludCwgdG86UG9pbnQsIHRvSW5jbHVzaXZlOmJvb2xlYW4gPSBmYWxzZSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgLy9UT0RPOiBFeHBsYWluIHRoaXMuLi5cclxuICAgICAgICBsZXQgdGwgPSBuZXcgUG9pbnQoZnJvbS54IDwgdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA8IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuICAgICAgICBsZXQgYnIgPSBuZXcgUG9pbnQoZnJvbS54ID4gdG8ueCA/IGZyb20ueCA6IHRvLngsIGZyb20ueSA+IHRvLnkgPyBmcm9tLnkgOiB0by55KTtcclxuXHJcbiAgICAgICAgaWYgKHRvSW5jbHVzaXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnIgPSBici5hZGQoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGltcyA9IFJlY3QuZnJvbVBvaW50cyh0bCwgYnIpO1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gW10gYXMgR3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgciA9IGRpbXMudG9wOyByIDwgZGltcy5ib3R0b207IHIrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGMgPSBkaW1zLmxlZnQ7IGMgPCBkaW1zLnJpZ2h0OyBjKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gbW9kZWwubG9jYXRlQ2VsbChjLCByKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjZWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIEdyaWRSYW5nZS5jcmVhdGVJbnRlcm5hbChtb2RlbCwgcmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogU2VsZWN0cyBhIHJhbmdlIG9mIGNlbGxzIHVzaW5nIGFuIEV4Y2VsLWxpa2UgcmFuZ2UgZXhwcmVzc2lvbi4gRm9yIGV4YW1wbGU6XHJcbiAgICAgKiAtIEExIHNlbGVjdHMgYSAxeDEgcmFuZ2Ugb2YgdGhlIGZpcnN0IGNlbGxcclxuICAgICAqIC0gQTE6QTUgc2VsZWN0cyBhIDF4NSByYW5nZSBmcm9tIHRoZSBmaXJzdCBjZWxsIGhvcml6b250YWxseS5cclxuICAgICAqIC0gQTE6RTUgc2VsZWN0cyBhIDV4NSByYW5nZSBmcm9tIHRoZSBmaXJzdCBjZWxsIGV2ZW5seS5cclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gcXVlcnlcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBzZWxlY3QobW9kZWw6R3JpZE1vZGVsLCBxdWVyeTpzdHJpbmcpOkdyaWRSYW5nZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBbZnJvbSwgdG9dID0gcXVlcnkuc3BsaXQoJzonKTtcclxuICAgICAgICBsZXQgZnJvbUNlbGwgPSByZXNvbHZlX2V4cHJfcmVmKG1vZGVsLCBmcm9tKTtcclxuXHJcbiAgICAgICAgaWYgKCF0bylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghIWZyb21DZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZUludGVybmFsKG1vZGVsLCBbZnJvbUNlbGxdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdG9DZWxsID0gcmVzb2x2ZV9leHByX3JlZihtb2RlbCwgdG8pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwgJiYgISF0b0NlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBmcm9tVmVjdG9yID0gbmV3IFBvaW50KGZyb21DZWxsLmNvbFJlZiwgZnJvbUNlbGwucm93UmVmKTtcclxuICAgICAgICAgICAgICAgIGxldCB0b1ZlY3RvciA9IG5ldyBQb2ludCh0b0NlbGwuY29sUmVmLCB0b0NlbGwucm93UmVmKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY2FwdHVyZShtb2RlbCwgZnJvbVZlY3RvciwgdG9WZWN0b3IsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmVtcHR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGVtcHR5IEdyaWRSYW5nZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5KCk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IFtdLFxyXG4gICAgICAgICAgICB0dGI6IFtdLFxyXG4gICAgICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICBsZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIGNvdW50OiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGNyZWF0ZUludGVybmFsKG1vZGVsOkdyaWRNb2RlbCwgY2VsbHM6R3JpZENlbGxbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0cjpHcmlkQ2VsbFtdO1xyXG4gICAgICAgIGxldCB0dGI6R3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgaWYgKGNlbGxzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsdHIgPSBjZWxscy5zb3J0KGx0cl9zb3J0KTtcclxuICAgICAgICAgICAgdHRiID0gY2VsbHMuc2xpY2UoMCkuc29ydCh0dGJfc29ydCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGx0ciA9IHR0YiA9IGNlbGxzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gbGVmdCB0byByaWdodC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGx0cjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGxzIGluIHRoZSByZXNvbHZlRXhwciBvcmRlcmVkIGZyb20gdG9wIHRvIGJvdHRvbS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCB3aWR0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgaW4gY29sdW1ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdpdGggaGVpZ2h0IG9mIHRoZSByZXNvbHZlRXhwciBpbiByb3dzLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByICh3aWxsIGJlIGRpZmZlcmVudCB0byBsZW5ndGggaWYgc29tZSBjZWxsIHNsb3RzIGNvbnRhaW4gbm8gY2VsbHMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY291bnQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGxlbmd0aCBvZiB0aGUgcmVzb2x2ZUV4cHIgKG51bWJlciBvZiByb3dzICogbnVtYmVyIG9mIGNvbHVtbnMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVuZ3RoOm51bWJlcjtcclxuXHJcbiAgICBwcml2YXRlIGluZGV4Ok9iamVjdE1hcDxHcmlkQ2VsbD47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcih2YWx1ZXM6YW55KVxyXG4gICAge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIHZhbHVlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgd2hldGhlciBvciBub3QgYSBjZWxsIGlzIGluY2x1ZGVkIGluIHRoZSByYW5nZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGNvbnRhaW5zKGNlbGxSZWY6c3RyaW5nKTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmluZGV4KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IF8uaW5kZXgodGhpcy5sdHIsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICEhdGhpcy5pbmRleFtjZWxsUmVmXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSByZWZlcmVuY2VzIGZvciBhbGwgdGhlIGNlbGxzIGluIHRoZSByYW5nZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlZnMoKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmx0ci5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGx0cl9zb3J0KGE6R3JpZENlbGwsIGI6R3JpZENlbGwpOm51bWJlclxyXG57XHJcbiAgICBsZXQgbiA9IDA7XHJcblxyXG4gICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICBpZiAobiA9PT0gMClcclxuICAgIHtcclxuICAgICAgICBuID0gYS5jb2xSZWYgLSBiLmNvbFJlZjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbjtcclxufVxyXG5cclxuZnVuY3Rpb24gdHRiX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5jb2xSZWYgLSBiLmNvbFJlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLnJvd1JlZiAtIGIucm93UmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlX2V4cHJfcmVmKG1vZGVsOkdyaWRNb2RlbCwgdmFsdWU6c3RyaW5nKTpHcmlkQ2VsbFxyXG57XHJcbiAgICBjb25zdCBSZWZDb252ZXJ0ID0gLyhbQS1aYS16XSspKFswLTldKykvZztcclxuXHJcbiAgICBSZWZDb252ZXJ0Lmxhc3RJbmRleCA9IDA7XHJcbiAgICBsZXQgcmVzdWx0ID0gUmVmQ29udmVydC5leGVjKHZhbHVlKTtcclxuXHJcbiAgICBsZXQgY29sUmVmID0gQmFzZTI2LnN0cihyZXN1bHRbMV0pLm51bTtcclxuICAgIGxldCByb3dSZWYgPSBwYXJzZUludChyZXN1bHRbMl0pIC0gMTtcclxuXHJcbiAgICByZXR1cm4gbW9kZWwubG9jYXRlQ2VsbChjb2xSZWYsIHJvd1JlZik7XHJcbn0iLCJpbXBvcnQgeyBSZWZHZW4gfSBmcm9tICcuLi8uLi9taXNjL1JlZkdlbic7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vR3JpZENlbGwnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZSwgcmVuZGVyZXIgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IERlZmF1bHRHcmlkQ2VsbCBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdEdyaWRDZWxsUGFyYW1zXHJcbntcclxuICAgIGNvbFJlZjpudW1iZXI7XHJcbiAgICByb3dSZWY6bnVtYmVyO1xyXG4gICAgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVmPzpzdHJpbmc7XHJcbiAgICBjb2xTcGFuPzpudW1iZXI7XHJcbiAgICByb3dTcGFuPzpudW1iZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDZWxsLlxyXG4gKi9cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENlbGwgaW1wbGVtZW50cyBHcmlkQ2VsbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjZWxsIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJlZjpzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSB0aGF0IGRlc2NyaWJlcyB0aGUgaG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFJlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2xTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSByb3cgcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSB2ZXJ0aWNhbCBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1JlZjpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbnVtYmVyIG9mIHJvd3MgdGhhdCB0aGlzIGNlbGwgc3BhbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dTcGFuOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB2YWx1ZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHZhbHVlOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkQ2VsbC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHBhcmFtczpEZWZhdWx0R3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgcGFyYW1zLnJlZiA9IHBhcmFtcy5yZWYgfHwgUmVmR2VuLm5leHQoKTtcclxuICAgICAgICBwYXJhbXMuY29sU3BhbiA9IHBhcmFtcy5jb2xTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnJvd1NwYW4gPSBwYXJhbXMucm93U3BhbiB8fCAxO1xyXG4gICAgICAgIHBhcmFtcy52YWx1ZSA9IChwYXJhbXMudmFsdWUgPT09IHVuZGVmaW5lZCB8fCBwYXJhbXMudmFsdWUgPT09IG51bGwpID8gJycgOiBwYXJhbXMudmFsdWU7XHJcblxyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIHBhcmFtcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXcoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZFxyXG57XHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgZ2Z4LmZpbGxSZWN0KC1hdiwgLWF2LCB2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG5cclxuICAgIGdmeC5zdHJva2VTdHlsZSA9ICdsaWdodGdyYXknO1xyXG4gICAgZ2Z4LnN0cm9rZVJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICBnZngudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgICBnZnguZm9udCA9IGAxM3B4IFNhbnMtU2VyaWZgO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHZpc3VhbC52YWx1ZSwgMywgMCArICh2aXN1YWwuaGVpZ2h0IC8gMikpO1xyXG59IiwiaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uL0dyaWRDb2x1bW4nO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRDb2x1bW4uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRDb2x1bW4gaW1wbGVtZW50cyBHcmlkQ29sdW1uXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbHVtbiByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuICBVc2VkIHRvIGluZGljYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGVcclxuICAgICAqIGNvbHVtbiB3aXRoaW4gdGhlIGdyaWQgYmFzZWQgb24gYSB6ZXJvLWluZGV4LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB3aWR0aCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDb2x1bW4uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICogQHBhcmFtIHdpZHRoXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHJlZjpudW1iZXIsIHdpZHRoOm51bWJlciA9IDEwMClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9HcmlkUm93JztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJ1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwgfSBmcm9tICcuL0RlZmF1bHRHcmlkQ2VsbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZE1vZGVsLiAgQWxsIGluc3BlY3Rpb24gbWV0aG9kcyB1c2UgTygxKSBpbXBsZW1lbnRhdGlvbnMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRNb2RlbCBpbXBsZW1lbnRzIEdyaWRNb2RlbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZ3JpZCBtb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGNvbHVtbnMgYW5kIHJvd3MgcG9wdWxhdGVkIHdpdGggZGVmYXVsdCBjZWxscy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gY29sc1xyXG4gICAgICogQHBhcmFtIHJvd3NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBkaW0oY29sczpudW1iZXIsIHJvd3M6bnVtYmVyKTpEZWZhdWx0R3JpZE1vZGVsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNlbGxzID0gW10gYXMgR3JpZENlbGxbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2xzOyBjKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCByID0gMDsgciA8IHJvd3M7IHIrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2VsbHMucHVzaChuZXcgRGVmYXVsdEdyaWRDZWxsKHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xSZWY6IGMsXHJcbiAgICAgICAgICAgICAgICAgICAgcm93UmVmOiByLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0R3JpZE1vZGVsKGNlbGxzLCBbXSwgW10pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBlbXB0eSBncmlkIG1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtEZWZhdWx0R3JpZE1vZGVsfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5KCk6RGVmYXVsdEdyaWRNb2RlbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgRGVmYXVsdEdyaWRNb2RlbChbXSwgW10sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIGNlbGwgZGVmaW5pdGlvbnMuICBUaGUgb3JkZXIgaXMgYXJiaXRyYXJ5LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VsbHM6R3JpZENlbGxbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIGNvbHVtbiBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb2x1bW5zOkdyaWRDb2x1bW5bXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBncmlkIHJvdyBkZWZpbml0aW9ucy4gIFRoZSBvcmRlciBpcyBhcmJpdHJhcnkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb3dzOkdyaWRSb3dbXTtcclxuXHJcbiAgICBwcml2YXRlIHJlZnM6T2JqZWN0TWFwPEdyaWRDZWxsPjtcclxuICAgIHByaXZhdGUgY29vcmRzOk9iamVjdEluZGV4PE9iamVjdEluZGV4PEdyaWRDZWxsPj47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZE1vZGVsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBjZWxsc1xyXG4gICAgICogQHBhcmFtIGNvbHVtbnNcclxuICAgICAqIEBwYXJhbSByb3dzXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGNlbGxzOkdyaWRDZWxsW10sIGNvbHVtbnM6R3JpZENvbHVtbltdLCByb3dzOkdyaWRSb3dbXSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNlbGxzID0gY2VsbHM7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNlbGwsIG9yIG51bGwgaWYgdGhlIGNlbGwgZGlkIG5vdCBleGlzdFxyXG4gICAgICogd2l0aGluIHRoZSBtb2RlbC5cclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqL1xyXG4gICAgcHVibGljIGZpbmRDZWxsKHJlZjpzdHJpbmcpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmc1tyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgcmVmLCByZXR1cm5zIHRoZSBHcmlkQ2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBuZWlnaGJvcmluZyBjZWxsIGFzIHBlciB0aGUgc3BlY2lmaWVkXHJcbiAgICAgKiB2ZWN0b3IgKGRpcmVjdGlvbikgb2JqZWN0LCBvciBudWxsIGlmIG5vIG5laWdoYm9yIGNvdWxkIGJlIGZvdW5kLlxyXG4gICAgICogQHBhcmFtIHJlZlxyXG4gICAgICogQHBhcmFtIHZlY3RvclxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZmluZENlbGxOZWlnaGJvcihyZWY6c3RyaW5nLCB2ZWN0b3I6UG9pbnQpOkdyaWRDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmZpbmRDZWxsKHJlZik7XHJcbiAgICAgICAgbGV0IGNvbCA9IGNlbGwuY29sUmVmICsgdmVjdG9yLng7XHJcbiAgICAgICAgbGV0IHJvdyA9IGNlbGwucm93UmVmICsgdmVjdG9yLnk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0ZUNlbGwoY29sLCByb3cpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIGNvbHVtbiByZWYgYW5kIHJvdyByZWYsIHJldHVybnMgdGhlIEdyaWRDZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNlbGwgYXQgdGhlIGxvY2F0aW9uLFxyXG4gICAgICogb3IgbnVsbCBpZiBubyBjZWxsIGNvdWxkIGJlIGZvdW5kLlxyXG4gICAgICogQHBhcmFtIGNvbFJlZlxyXG4gICAgICogQHBhcmFtIHJvd1JlZlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgbG9jYXRlQ2VsbChjb2w6bnVtYmVyLCByb3c6bnVtYmVyKTpHcmlkQ2VsbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5jb29yZHNbY29sXSB8fCB7fSlbcm93XSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVmcmVzaGVzIGludGVybmFsIGNhY2hlcyB1c2VkIHRvIG9wdGltaXplIGxvb2t1cHMgYW5kIHNob3VsZCBiZSBpbnZva2VkIGFmdGVyIHRoZSBtb2RlbCBoYXMgYmVlbiBjaGFuZ2VkIChzdHJ1Y3R1cmFsbHkpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVmcmVzaCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBjZWxscyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5yZWZzID0gXy5pbmRleChjZWxscywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5jb29yZHMgPSB7fTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNvID0gMDsgY28gPCBjZWxsLmNvbFNwYW47IGNvKyspIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBybyA9IDA7IHJvIDwgY2VsbC5yb3dTcGFuOyBybysrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjID0gY2VsbC5jb2xSZWYgKyBjbztcclxuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IGNlbGwucm93UmVmICsgcm87XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjaXggPSB0aGlzLmNvb3Jkc1tjXSB8fCAodGhpcy5jb29yZHNbY10gPSB7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNpeFtyXSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVHdvIGNlbGxzIGFwcGVhciB0byBvY2N1cHknLCBjLCAneCcsIHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjaXhbcl0gPSBjZWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vR3JpZFJvdyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZFJvdy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZFJvdyBpbXBsZW1lbnRzIEdyaWRSb3dcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm93IHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogcm93IHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGhlaWdodCBvZiB0aGUgY29sdW1uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGVpZ2h0Om51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIERlZmF1bHRHcmlkUm93LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgaGVpZ2h0Om51bWJlciA9IDIxKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FzY2FkZSgpOlByb3BlcnR5RGVjb3JhdG9yXHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6UHJvcGVydHlEZXNjcmlwdG9yXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcGtdIHx8ICghIXRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnRba2V5XSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbDphbnkpOnZvaWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc1twa10gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENhc2NhZGluZzxUPlxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OlQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50PzpULCB2YWx1ZXM/OmFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG4gICAgICAgIGlmICh2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IHR5cGUgVGV4dEFsaWdubWVudCA9ICdsZWZ0J3wnY2VudGVyJ3wncmlnaHQnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZvcm1hdHRlclxyXG57XHJcbiAgICAodmFsdWU6c3RyaW5nLCB2aXN1YWw6YW55KTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdHlsZSBleHRlbmRzIENhc2NhZGluZzxTdHlsZT5cclxue1xyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGJvcmRlckNvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZmlsbENvbG9yOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgZm9ybWF0dGVyOlZhbHVlRm9ybWF0dGVyO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB0ZXh0OlRleHRTdHlsZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRleHRTdHlsZSBleHRlbmRzIENhc2NhZGluZzxUZXh0U3R5bGU+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgRGVmYXVsdDpUZXh0U3R5bGUgPSBuZXcgVGV4dFN0eWxlKG51bGwsIHtcclxuICAgICAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgICAgICBjb2xvcjogJ2JsYWNrJyxcclxuICAgICAgICBmb250OiAnU2Vnb2UgVUknLFxyXG4gICAgICAgIHNpemU6IDEzLFxyXG4gICAgICAgIHN0eWxlOiAnbm9ybWFsJyxcclxuICAgICAgICB2YXJpYW50OiAnbm9ybWFsJyxcclxuICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGFsaWdubWVudDpUZXh0QWxpZ25tZW50O1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBjb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZvbnQ6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBzaXplOm51bWJlcjtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgc3R5bGU6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyB2YXJpYW50OnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgd2VpZ2h0OnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEJhc2VTdHlsZSA9IG5ldyBTdHlsZShudWxsLCB7XHJcbiAgICBib3JkZXJDb2xvcjogJ2xpZ2h0Z3JheScsXHJcbiAgICBmaWxsQ29sb3I6ICd3aGl0ZScsXHJcbiAgICBmb3JtYXR0ZXI6IHYgPT4gdixcclxuICAgIHRleHQ6IG5ldyBUZXh0U3R5bGUobnVsbCwge1xyXG4gICAgICAgIGFsaWdubWVudDogJ2xlZnQnLFxyXG4gICAgICAgIGNvbG9yOiAnYmxhY2snLFxyXG4gICAgICAgIGZvbnQ6ICdTZWdvZSBVSScsXHJcbiAgICAgICAgc2l6ZTogMTMsXHJcbiAgICAgICAgc3R5bGU6ICdub3JtYWwnLFxyXG4gICAgICAgIHZhcmlhbnQ6ICdub3JtYWwnLFxyXG4gICAgICAgIHdlaWdodDogJ25vcm1hbCcsXHJcbiAgICB9KVxyXG59KTsiLCJpbXBvcnQgeyBEZWZhdWx0R3JpZENlbGwsIERlZmF1bHRHcmlkQ2VsbFBhcmFtcyB9IGZyb20gJy4uL2RlZmF1bHQvRGVmYXVsdEdyaWRDZWxsJztcclxuaW1wb3J0IHsgU3R5bGUsIEJhc2VTdHlsZSB9IGZyb20gJy4vU3R5bGUnO1xyXG5pbXBvcnQgeyByZW5kZXJlciwgdmlzdWFsaXplIH0gZnJvbSAnLi4vLi4vdWkvRXh0ZW5zaWJpbGl0eSc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbi9zaG91bGQgYmUgcGFzc2VkIHRvIGEgbmV3IFN0eWxlZEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBTdHlsZWRHcmlkQ2VsbFBhcmFtcyBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFBhcmFtc1xyXG57XHJcbiAgICBwbGFjZWhvbGRlcj86c3RyaW5nO1xyXG4gICAgc3R5bGU/OlN0eWxlO1xyXG59XHJcblxyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIFN0eWxlZEdyaWRDZWxsIGV4dGVuZHMgRGVmYXVsdEdyaWRDZWxsXHJcbntcclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHN0eWxlOlN0eWxlID0gQmFzZVN0eWxlO1xyXG5cclxuICAgIEB2aXN1YWxpemUoKVxyXG4gICAgcHVibGljIHBsYWNlaG9sZGVyOnN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgU3R5bGVkR3JpZENlbGwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM6U3R5bGVkR3JpZENlbGxQYXJhbXMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIocGFyYW1zKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IHBhcmFtcy5wbGFjZWhvbGRlciB8fCAnJztcclxuICAgICAgICB0aGlzLnN0eWxlID0gcGFyYW1zLnN0eWxlIHx8IEJhc2VTdHlsZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGxldCBzdHlsZSA9IHZpc3VhbC5zdHlsZSBhcyBTdHlsZTtcclxuXHJcbiAgICBnZngubGluZVdpZHRoID0gMTtcclxuICAgIGxldCBhdiA9IGdmeC5saW5lV2lkdGggJSAyID09IDAgPyAwIDogMC41O1xyXG5cclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS5maWxsQ29sb3I7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gc3R5bGUuYm9yZGVyQ29sb3I7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBsZXQgdGV4dFB0ID0gbmV3IFBvaW50KDMsIHZpc3VhbC5oZWlnaHQgLyAyKSBhcyBQb2ludExpa2U7XHJcbiAgICBpZiAoc3R5bGUudGV4dC5hbGlnbm1lbnQgPT09ICdjZW50ZXInKVxyXG4gICAge1xyXG4gICAgICAgIHRleHRQdC54ID0gdmlzdWFsLndpZHRoIC8gMjtcclxuICAgIH1cclxuICAgIGlmIChzdHlsZS50ZXh0LmFsaWdubWVudCA9PT0gJ3JpZ2h0JylcclxuICAgIHtcclxuICAgICAgICB0ZXh0UHQueCA9IHZpc3VhbC53aWR0aCAtIDM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2Z4LmZvbnQgPSBgJHtzdHlsZS50ZXh0fSAke3N0eWxlLnRleHQudmFyaWFudH0gJHtzdHlsZS50ZXh0LndlaWdodH0gJHtzdHlsZS50ZXh0LnNpemV9cHggJHtzdHlsZS50ZXh0LmZvbnR9YDtcclxuICAgIGdmeC50ZXh0QWxpZ24gPSBzdHlsZS50ZXh0LmFsaWdubWVudDtcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5maWxsU3R5bGUgPSBzdHlsZS50ZXh0LmNvbG9yO1xyXG4gICAgZ2Z4LmZpbGxUZXh0KHN0eWxlLmZvcm1hdHRlcih2aXN1YWwudmFsdWUsIHZpc3VhbCkgfHwgdmlzdWFsLnBsYWNlaG9sZGVyLCB0ZXh0UHQueCwgdGV4dFB0LnkpO1xyXG59IiwiaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBpc0Jvb2xlYW4gfSBmcm9tICd1dGlsJztcclxuXHJcbmRlY2xhcmUgdmFyIFJlZmxlY3Q7XHJcblxyXG4vKipcclxuICogRG8gbm90IHVzZSBkaXJlY3RseS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NEZWY8VD5cclxue1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gZGVmaW5pdGlvbiBmb3IgYSBjZWxsIHJlbmRlcmVyIGZ1bmN0aW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlclxyXG57XHJcbiAgICAoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kIGFzIGEgX2NvbW1hbmRfOyBhbiBleHRlcm5hbGx5IGNhbGxhYmxlIGxvZ2ljIGJsb2NrIHRoYXQgcGVyZm9ybXMgc29tZSB0YXNrLiAgQSBuYW1lXHJcbiAqIGZvciB0aGUgY29tbWFuZCBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkIGFzIHRoZSBjb21tYW5kIHdpbGwgYmVcclxuICogdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIGNvbW1hbmQgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kKG5hbWU/OnN0cmluZyk6YW55XHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDpjb21tYW5kcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIGltcGw6IGRlc2NyaXB0b3IudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgZGVmaW5lcyB0aGUgcmVuZGVyIGZ1bmN0aW9uIGZvciBhIEdyaWRDZWxsIGltcGxlbWVudGF0aW9uLCBhbGxvd2luZyBjdXN0b20gY2VsbCB0eXBlc1xyXG4gKiB0byBjb250cm9sIHRoZWlyIGRyYXdpbmcgYmVoYXZpb3IuXHJcbiAqXHJcbiAqIEBwYXJhbSBmdW5jXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJlcihmdW5jOlJlbmRlcmVyKTphbnlcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSgnY3VzdG9tOnJlbmRlcmVyJywgZnVuYywgY3Rvcik7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBtZXRob2QgYXMgYSBfcm91dGluZV87IGEgbG9naWMgYmxvY2sgdGhhdCBjYW4gYmUgaG9va2VkIGludG8gb3Igb3ZlcnJpZGRlbiBieSBvdGhlclxyXG4gKiBtb2R1bGVzLiAgQSBuYW1lIGZvciB0aGUgcm91dGluZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGJlaW5nIGV4cG9ydGVkXHJcbiAqIGFzIHRoZSByb3V0aW5lIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHJvdXRpbmUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByb3V0aW5lKG5hbWU/OnN0cmluZyk6YW55XHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZywgZGVzY3JpcHRvcjpUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxGdW5jdGlvbj4pOmFueVxyXG4gICAge1xyXG4gICAgICAgIGxldCByb3V0aW5lID0gZGVzY3JpcHRvci52YWx1ZTtcclxuICAgICAgICBsZXQgd3JhcHBlciA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQga2VybmVsID0gKHRoaXNbJ19fa2VybmVsJ10gfHwgdGhpc1sna2VybmVsJ10pIGFzIEdyaWRLZXJuZWw7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXJuZWwucm91dGluZXMuc2lnbmFsKGtleSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSwgcm91dGluZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlciB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWFya3MgYSBmaWVsZCBhcyBhIF92YXJpYWJsZV87IGEgcmVhZGFibGUgYW5kIG9wdGlvbmFsbHkgd3JpdGFibGUgdmFsdWUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnlcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHZhcmlhYmxlIGNhbiBiZSBvcHRpb25hbGx5IHNwZWNpZmllZCwgb3RoZXJ3aXNlIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgdmFyaWFibGUgd2lsbCBiZSB1c2VkLlxyXG4gKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgdmFyaWFibGUgbmFtZVxyXG4gKiBAcmV0dXJucyBkZWNvcmF0b3JcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShtdXRhYmxlOmJvb2xlYW4pOmFueTtcclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG5hbWU/OnN0cmluZywgbXV0YWJsZT86Ym9vbGVhbik6YW55O1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobmFtZTpzdHJpbmd8Ym9vbGVhbiwgbXV0YWJsZT86Ym9vbGVhbik6YW55XHJcbntcclxuICAgIGlmICh0eXBlb2YobmFtZSkgPT09ICdib29sZWFuJylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdmFyaWFibGUodW5kZWZpbmVkLCBuYW1lIGFzIGJvb2xlYW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZhcmlhYmxlcyc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIG11dGFibGU6IG11dGFibGUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vbGV0IHZhbFN0b3JlS2V5ID0gISFuYW1lID8ga2V5IDogYF9fJHtrZXl9YDtcclxuICAgICAgICAvL2xldCB1c2VBbHRWYWx1ZVN0b3JlID0gIW5hbWU7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL09iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBuYW1lIHx8IGtleSwge1xyXG4gICAgICAgIC8vICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAvLyAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2YWxTdG9yZUtleV07IH0sXHJcbiAgICAgICAgLy8gICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpIHsgdGhpc1t2YWxTdG9yZUtleV0gPSBuZXdWYWw7IH1cclxuICAgICAgICAvL30pO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGVjb3JhdG9yIGZvciB1c2Ugd2l0aGluIGltcGxlbWVudGF0aW9ucyBvZiBHcmlkQ2VsbCB0aGF0IG1hcmtzIGEgZmllbGQgYXMgb25lIHRoYXQgYWZmZWN0cyB0aGUgdmlzdWFsXHJcbiAqIGFwcGVhcmFuY2Ugb2YgdGhlIGNlbGwuICBUaGlzIHdpbGwgY2F1c2UgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCB0byBiZSBtYXBwZWQgdG8gdGhlIF9WaXN1YWxfIG9iamVjdFxyXG4gKiBjcmVhdGVkIGJlZm9yZSB0aGUgY2VsbCBpcyBkcmF3bi5cclxuICpcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmlzdWFsaXplKCk6YW55XHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOk9iamVjdCwga2V5OnN0cmluZyk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6dmlzdWFsaXplJztcclxuXHJcbiAgICAgICAgbGV0IGxpc3QgPSBSZWZsZWN0LmdldE1ldGFkYXRhKG1kaywgY3Rvcik7XHJcbiAgICAgICAgaWYgKCFsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShtZGssIChsaXN0ID0gW10pLCBjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxpc3QucHVzaChrZXkpO1xyXG5cclxuICAgICAgICBsZXQgcGsgPSBgX18ke2tleX1gO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCk6YW55XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3BrXTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbih2YWw6YW55KTp2b2lkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbcGtdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgdGhpc1snX19kaXJ0eSddID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iLCJpbXBvcnQgeyBpZV9zYWZlX2NyZWF0ZV9tb3VzZV9ldmVudCB9IGZyb20gJy4uL21pc2MvUG9seWZpbGwnO1xyXG5pbXBvcnQgeyBQYWRkaW5nIH0gZnJvbSAnLi4vZ2VvbS9QYWRkaW5nJztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vbW9kZWwvR3JpZFJvdyc7XHJcbmltcG9ydCB7IERlZmF1bHRHcmlkTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXJCYXNlIH0gZnJvbSAnLi9pbnRlcm5hbC9FdmVudEVtaXR0ZXInO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi9HcmlkS2VybmVsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IEdyaWRMYXlvdXQgfSBmcm9tICcuL2ludGVybmFsL0dyaWRMYXlvdXQnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IHByb3BlcnR5IH0gZnJvbSAnLi4vbWlzYy9Qcm9wZXJ0eSc7XHJcbmltcG9ydCB7IHZhcmlhYmxlIH0gZnJvbSAnLi9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDtcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuZGVyXHJcbntcclxuICAgIChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VFdmVudCBleHRlbmRzIE1vdXNlRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VEcmFnRXZlbnQgZXh0ZW5kcyBNb3VzZURyYWdFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRLZXlib2FyZEV2ZW50IGV4dGVuZHMgS2V5Ym9hcmRFdmVudFxyXG57XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRFbGVtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyQmFzZVxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZSh0YXJnZXQ6SFRNTEVsZW1lbnQsIGluaXRpYWxNb2RlbD86R3JpZE1vZGVsKTpHcmlkRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwYXJlbnQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGNhbnZhcyA9IHRhcmdldC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGNhbnZhcy5pZCA9IHRhcmdldC5pZDtcclxuICAgICAgICBjYW52YXMuY2xhc3NOYW1lID0gdGFyZ2V0LmNsYXNzTmFtZTtcclxuICAgICAgICBjYW52YXMudGFiSW5kZXggPSB0YXJnZXQudGFiSW5kZXggfHwgMDtcclxuXHJcbiAgICAgICAgdGFyZ2V0LmlkID0gbnVsbDtcclxuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNhbnZhcywgdGFyZ2V0KTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGFyZ2V0KTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgcGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGdyaWQgPSBuZXcgR3JpZEVsZW1lbnQoY2FudmFzKTtcclxuICAgICAgICBncmlkLm1vZGVsID0gaW5pdGlhbE1vZGVsIHx8IERlZmF1bHRHcmlkTW9kZWwuZGltKDI2LCAxMDApO1xyXG4gICAgICAgIGdyaWQuYmFzaCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JpZDtcclxuICAgIH1cclxuXHJcbiAgICBAcHJvcGVydHkoRGVmYXVsdEdyaWRNb2RlbC5lbXB0eSgpLCB0ID0+IHsgdC5lbWl0KCdsb2FkJywgdC5tb2RlbCk7IHQuaW52YWxpZGF0ZSgpOyB9KVxyXG4gICAgcHVibGljIG1vZGVsOkdyaWRNb2RlbDtcclxuXHJcbiAgICBAcHJvcGVydHkobmV3IFBvaW50KDAsIDApLCB0ID0+IHQuaW52YWxpZGF0ZSgpKVxyXG4gICAgcHVibGljIGZyZWV6ZU1hcmdpbjpQb2ludDtcclxuXHJcbiAgICBAcHJvcGVydHkoUGFkZGluZy5lbXB0eSwgdCA9PiB0LmludmFsaWRhdGUoKSlcclxuICAgIHB1YmxpYyBwYWRkaW5nOlBhZGRpbmc7XHJcblxyXG4gICAgQHByb3BlcnR5KFBvaW50LmVtcHR5LCB0ID0+IHsgdC5yZWRyYXcoKTsgdC5lbWl0KCdzY3JvbGwnKTsgfSlcclxuICAgIHB1YmxpYyBzY3JvbGw6UG9pbnQ7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvb3Q6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGFpbmVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtlcm5lbDpHcmlkS2VybmVsO1xyXG5cclxuICAgIHByaXZhdGUgaG90Q2VsbDpHcmlkQ2VsbDtcclxuICAgIHByaXZhdGUgZGlydHk6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBsYXlvdXQ6R3JpZExheW91dDsgICAgXHJcbiAgICBwcml2YXRlIGJ1ZmZlcnM6T2JqZWN0TWFwPEJ1ZmZlcj4gPSB7fTtcclxuICAgIHByaXZhdGUgdmlzdWFsczpPYmplY3RNYXA8VmlzdWFsPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBmcmFtZTpWaWV3QXNwZWN0W107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjYW52YXMucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWwodGhpcy5lbWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBbJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnLCAnbW91c2V3aGVlbCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnYmVnaW4nLCAnZHJhZycsICdkcmFnZW5kJ11cclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PiB0aGlzLmZvcndhcmRNb3VzZUV2ZW50KHgpKTtcclxuICAgICAgICBbJ2tleWRvd24nLCAna2V5cHJlc3MnLCAna2V5dXAnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZEtleUV2ZW50KHgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmFibGVFbnRlckV4aXRFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxXaWR0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJvd3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbEhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxMZWZ0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsLng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxUb3AoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGwueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9ufEdyaWRFeHRlbmRlcik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBpZiAodHlwZW9mKGV4dCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LmluaXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3Q6UmVjdDtcclxuXHJcbiAgICAgICAgaWYgKHB0T3JSZWN0Wyd3aWR0aCddID09PSB1bmRlZmluZWQgJiYgcHRPclJlY3RbJ2hlaWdodCddID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QocHRPclJlY3RbJ3gnXSwgcHRPclJlY3RbJ3knXSwgMSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlc3QgPSBSZWN0LmZyb21MaWtlKHB0T3JSZWN0IGFzIFJlY3RMaWtlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdTY3JvbGwgPSB7XHJcbiAgICAgICAgICAgIHg6IHRoaXMuc2Nyb2xsLngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMuc2Nyb2xsLnksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGRlc3QubGVmdCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdTY3JvbGwueCArPSBkZXN0LmxlZnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnJpZ2h0ID4gdGhpcy53aWR0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5ld1Njcm9sbC54ICs9IGRlc3QucmlnaHQgLSB0aGlzLndpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC50b3AgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC50b3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmJvdHRvbSA+IHRoaXMuaGVpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC5ib3R0b20gLSB0aGlzLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5zY3JvbGwuZXF1YWxzKG5ld1Njcm9sbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbCA9IFBvaW50LmNyZWF0ZShuZXdTY3JvbGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmFzaCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3Qud2lkdGggPSB0aGlzLnJvb3QucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICB0aGlzLnJvb3QuaGVpZ2h0ID0gdGhpcy5yb290LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuZW1pdCgnYmFzaCcpO1xyXG5cclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZShxdWVyeTpzdHJpbmcgPSBudWxsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC5pbnZhbGlkYXRlJyk7XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0LmNvbXB1dGUodGhpcy5tb2RlbCwgdGhpcy5wYWRkaW5nKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoISFxdWVyeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByYW5nZSA9IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5tb2RlbCwgcXVlcnkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHJhbmdlLmx0cikge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGxbJ19fZGlydHknXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVycyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNlbGxzLmZvckVhY2goeCA9PiBkZWxldGUgeFsnX19kaXJ0eSddKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuaW52YWxpZGF0ZScpO1xyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdpbnZhbGlkYXRlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZHJhdyhmb3JjZUltbWVkaWF0ZTpib29sZWFuID0gZmFsc2UpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS50aW1lKGBHcmlkRWxlbWVudC5yZWRyYXcoZm9yY2U9JHtmb3JjZUltbWVkaWF0ZX0pYCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZm9yY2VJbW1lZGlhdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyhmb3JjZUltbWVkaWF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcywgZm9yY2VJbW1lZGlhdGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXcoZm9yY2VkOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdGhpcy51cGRhdGVWaXN1YWxzKCk7XHJcbiAgICAgICAgdGhpcy5kcmF3VmlzdWFscygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKGBHcmlkRWxlbWVudC5yZWRyYXcoZm9yY2U9JHtmb3JjZWR9KWApO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZHJhdycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdGcmFnbWVudHMoKTpWaWV3RnJhZ21lbnRbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGZyZWV6ZU1hcmdpbiwgbGF5b3V0IH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbWFrZSA9IChsOm51bWJlciwgdDpudW1iZXIsIHc6bnVtYmVyLCBoOm51bWJlciwgb2w6bnVtYmVyLCBvdDpudW1iZXIpID0+ICh7XHJcbiAgICAgICAgICAgIGxlZnQ6IGwsXHJcbiAgICAgICAgICAgIHRvcDogdCxcclxuICAgICAgICAgICAgd2lkdGg6IHcsXHJcbiAgICAgICAgICAgIGhlaWdodDogaCxcclxuICAgICAgICAgICAgb2Zmc2V0TGVmdDogb2wsXHJcbiAgICAgICAgICAgIG9mZnNldFRvcDogb3QsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcblxyXG4gICAgICAgIGlmIChmcmVlemVNYXJnaW4uZXF1YWxzKFBvaW50LmVtcHR5KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBbIG1ha2Uodmlld3BvcnQubGVmdCwgdmlld3BvcnQudG9wLCB2aWV3cG9ydC53aWR0aCwgdmlld3BvcnQuaGVpZ2h0LCAwLCAwKSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgbWFyZ2luTGVmdCA9IGxheW91dC5xdWVyeUNvbHVtblJhbmdlKDAsIGZyZWV6ZU1hcmdpbi54KS53aWR0aDtcclxuICAgICAgICAgICAgbGV0IG1hcmdpblRvcCA9IGxheW91dC5xdWVyeVJvd1JhbmdlKDAsIGZyZWV6ZU1hcmdpbi55KS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtYXJnaW4gPSBuZXcgUG9pbnQobWFyZ2luTGVmdCwgbWFyZ2luVG9wKTtcclxuXHJcbiAgICAgICAgICAgIC8vQWxpYXNlcyB0byBwcmV2ZW50IG1hc3NpdmUgbGluZXM7XHJcbiAgICAgICAgICAgIGxldCB2cCA9IHZpZXdwb3J0O1xyXG4gICAgICAgICAgICBsZXQgbWcgPSBtYXJnaW47XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gWyBcclxuICAgICAgICAgICAgICAgIG1ha2UodnAubGVmdCArIG1nLngsIHZwLnRvcCArIG1nLnksIHZwLndpZHRoIC0gbWcueCwgdnAuaGVpZ2h0IC0gbWcueSwgbWcueCwgbWcueSksIC8vTWFpblxyXG4gICAgICAgICAgICAgICAgbWFrZSgwLCB2cC50b3AgKyBtZy55LCBtZy54LCB2cC5oZWlnaHQgLSBtZy55LCAwLCBtZy55KSwgLy9MZWZ0XHJcbiAgICAgICAgICAgICAgICBtYWtlKHZwLmxlZnQgKyBtZy54LCAwLCB2cC53aWR0aCAtIG1nLngsIG1nLnksIG1nLngsIDApLCAvL1RvcFxyXG4gICAgICAgICAgICAgICAgbWFrZSgwLCAwLCBtZy54LCBtZy55LCAwLCAwKSwgLy9MZWZ0VG9wXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdwb3J0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChNYXRoLmZsb29yKHRoaXMuc2Nyb2xsTGVmdCksIE1hdGguZmxvb3IodGhpcy5zY3JvbGxUb3ApLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVZpc3VhbHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHsgbW9kZWwsIGxheW91dCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgZnJhZ21lbnRzID0gdGhpcy5jb21wdXRlVmlld0ZyYWdtZW50cygpO1xyXG5cclxuICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy5mcmFtZTtcclxuICAgICAgICBsZXQgbmV4dEZyYW1lID0gW10gYXMgVmlld0FzcGVjdFtdO1xyXG5cclxuICAgICAgICAvL0lmIHRoZSBmcmFnbWVudHMgaGF2ZSBjaGFuZ2VkLCBuZXJmIHRoZSBwcmV2RnJhbWUgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byByZWN5Y2xlIGFueXRoaW5nLlxyXG4gICAgICAgIGlmICghcHJldkZyYW1lIHx8IHByZXZGcmFtZS5sZW5ndGggIT0gZnJhZ21lbnRzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZXZGcmFtZSA9IFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFnbWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHJldkFzcGVjdCA9IHByZXZGcmFtZVtpXTtcclxuICAgICAgICAgICAgbGV0IGFzcGVjdCA9IDxWaWV3QXNwZWN0PntcclxuICAgICAgICAgICAgICAgIHZpZXc6IGZyYWdtZW50c1tpXSxcclxuICAgICAgICAgICAgICAgIHZpc3VhbHM6IHt9LFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgbGV0IHZpZXdDZWxscyA9IGxheW91dC5jYXB0dXJlQ2VsbHMoYXNwZWN0LnZpZXcpXHJcbiAgICAgICAgICAgICAgICAubWFwKHJlZiA9PiBtb2RlbC5maW5kQ2VsbChyZWYpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGNlbGwgb2Ygdmlld0NlbGxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVnaW9uID0gbGF5b3V0LnF1ZXJ5Q2VsbChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmlzdWFsID0gISFwcmV2QXNwZWN0ID8gcHJldkFzcGVjdC52aXN1YWxzW2NlbGwucmVmXSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZGlkbid0IGhhdmUgYSBwcmV2aW91cyB2aXN1YWwgb3IgaWYgdGhlIGNlbGwgd2FzIGRpcnR5LCBjcmVhdGUgbmV3IHZpc3VhbFxyXG4gICAgICAgICAgICAgICAgaWYgKCF2aXN1YWwgfHwgY2VsbC52YWx1ZSAhPT0gdmlzdWFsLnZhbHVlIHx8IGNlbGxbJ19fZGlydHknXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0LnZpc3VhbHNbY2VsbC5yZWZdID0gdGhpcy5jcmVhdGVWaXN1YWwoY2VsbCwgcmVnaW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5idWZmZXJzW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbFsnX19kaXJ0eSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UganVzdCB1c2UgdGhlIHByZXZpb3VzXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0LnZpc3VhbHNbY2VsbC5yZWZdID0gdmlzdWFsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBuZXh0RnJhbWUucHVzaChhc3BlY3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mcmFtZSA9IG5leHRGcmFtZTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXdWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNhbnZhcywgbW9kZWwsIGZyYW1lIH0gPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IGdmeCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IHRydWUgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIGdmeC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXNwZWN0IG9mIGZyYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZpZXcgPSBSZWN0LmZyb21MaWtlKGFzcGVjdC52aWV3KTtcclxuXHJcbiAgICAgICAgICAgIGdmeC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGdmeC50cmFuc2xhdGUoYXNwZWN0LnZpZXcub2Zmc2V0TGVmdCwgYXNwZWN0LnZpZXcub2Zmc2V0VG9wKTtcclxuICAgICAgICAgICAgZ2Z4LnRyYW5zbGF0ZShhc3BlY3Qudmlldy5sZWZ0ICogLTEsIGFzcGVjdC52aWV3LnRvcCAqIC0xKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGNyIGluIGFzcGVjdC52aXN1YWxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IG1vZGVsLmZpbmRDZWxsKGNyKTtcclxuICAgICAgICAgICAgICAgIGxldCB2aXN1YWwgPSBhc3BlY3QudmlzdWFsc1tjcl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZpc3VhbC53aWR0aCA9PSAwIHx8IHZpc3VhbC5oZWlnaHQgPT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcuaW50ZXJzZWN0cyh2aXN1YWwpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZUJ1ZmZlcih2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBjZWxsLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZngucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5kcmF3VmlzdWFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlQnVmZmVyKHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcik6QnVmZmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIod2lkdGgsIGhlaWdodCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVWaXN1YWwoY2VsbDphbnksIHJlZ2lvbjpSZWN0TGlrZSk6VmlzdWFsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc3VhbCA9IG5ldyBWaXN1YWwoY2VsbC5yZWYsIGNlbGwudmFsdWUsIHJlZ2lvbi5sZWZ0LCByZWdpb24udG9wLCByZWdpb24ud2lkdGgsIHJlZ2lvbi5oZWlnaHQpO1xyXG5cclxuICAgICAgICBsZXQgcHJvcHMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2aXN1YWxpemUnLCBjZWxsLmNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgW10pIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcHJvcHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsW3BdID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc3VhbFtwXSA9IGNsb25lKGNlbGxbcF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSWxsZWdhbCB2aXN1YWxpemVkIHByb3BlcnR5IG5hbWUgJHtwfSBvbiB0eXBlICR7Y2VsbC5jb25zdHJ1Y3Rvci5uYW1lfS5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHZpc3VhbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcndhcmRNb3VzZUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KG5lLm9mZnNldFgsIG5lLm9mZnNldFkpO1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCBnZSA9IDxhbnk+bmU7XHJcbiAgICAgICAgICAgIGdlLmNlbGwgPSBjZWxsIHx8IG51bGw7XHJcbiAgICAgICAgICAgIGdlLmdyaWRYID0gcHQueDtcclxuICAgICAgICAgICAgZ2UuZ3JpZFkgPSBwdC55OyAgICAgIFxyXG5cclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCBnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkS2V5RXZlbnQoZXZlbnQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKG5lOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIDxHcmlkS2V5Ym9hcmRFdmVudD5uZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmFibGVFbnRlckV4aXRFdmVudHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vbignbW91c2Vtb3ZlJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5jZWxsICE9IHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3RXZ0ID0gdGhpcy5jcmVhdGVHcmlkTW91c2VFdmVudCgnY2VsbGV4aXQnLCBlKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RXZ0LmNlbGwgPSB0aGlzLmhvdENlbGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjZWxsZXhpdCcsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5ob3RDZWxsID0gZS5jZWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0V2dCA9IHRoaXMuY3JlYXRlR3JpZE1vdXNlRXZlbnQoJ2NlbGxlbnRlcicsIGUpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdFdnQuY2VsbCA9IHRoaXMuaG90Q2VsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2NlbGxlbnRlcicsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUdyaWRNb3VzZUV2ZW50KHR5cGU6c3RyaW5nLCBzb3VyY2U6R3JpZE1vdXNlRXZlbnQpOkdyaWRNb3VzZUV2ZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0gPGFueT4oaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuY2VsbCA9IHNvdXJjZS5jZWxsO1xyXG4gICAgICAgIGV2ZW50LmdyaWRYID0gc291cmNlLmdyaWRYO1xyXG4gICAgICAgIGV2ZW50LmdyaWRZID0gc291cmNlLmdyaWRZO1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdGcmFnbWVudCBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIG9mZnNldExlZnQ6bnVtYmVyO1xyXG4gICAgb2Zmc2V0VG9wOm51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdBc3BlY3Rcclxue1xyXG4gICAgdmlldzpWaWV3RnJhZ21lbnQ7XHJcbiAgICB2aXN1YWxzOk9iamVjdE1hcDxWaXN1YWw+O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZSh4OmFueSk6YW55XHJcbntcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB4Lm1hcChjbG9uZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIF8uc2hhZG93Q2xvbmUoeCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJ1ZmZlclxyXG57XHJcbiAgICBwdWJsaWMgY2FudmFzOkhUTUxDYW52YXNFbGVtZW50O1xyXG4gICAgcHVibGljIGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHdpZHRoOm51bWJlciwgcHVibGljIGhlaWdodDpudW1iZXIsIHB1YmxpYyBpbmZsYXRpb246bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgKyAoaW5mbGF0aW9uICogMik7XHJcbiAgICAgICAgdGhpcy5nZnggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IGZhbHNlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICB0aGlzLmdmeC50cmFuc2xhdGUoaW5mbGF0aW9uLCBpbmZsYXRpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBWaXN1YWxcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlZjpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU6c3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGxlZnQ6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIHRvcDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgd2lkdGg6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGhlaWdodDpudW1iZXIpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVxdWFscyhhbm90aGVyOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzW3Byb3BdICE9PSBhbm90aGVyW3Byb3BdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnXHJcblxyXG4vL1RoaXMga2VlcHMgV2ViU3Rvcm0gcXVpZXQsIGZvciBzb21lIHJlYXNvbiBpdCBpcyBjb21wbGFpbmluZy4uLlxyXG5kZWNsYXJlIHZhciBSZWZsZWN0OmFueTtcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDb21tYW5kXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRDb21tYW5kSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIGNvbW1hbmQgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgZGVmaW5lKGNvbW1hbmQ6c3RyaW5nLCBpbXBsOkdyaWRDb21tYW5kKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZXMgdGhlIHNwZWNpZmllZCBncmlkIGNvbW1hbmQuXHJcbiAgICAgKi9cclxuICAgIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFZhcmlhYmxlXHJcbntcclxuICAgIGdldCgpOmFueTtcclxuICAgIHNldD8odmFsdWU6YW55KTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRWYXJpYWJsZUh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCB2YXJpYWJsZSBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUodmFyaWFibGU6c3RyaW5nLCBpbXBsOkdyaWRWYXJpYWJsZSk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIGdldCh2YXJpYWJsZTpzdHJpbmcpOmFueTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHNldCh2YXJpYWJsZTpzdHJpbmcsIHZhbHVlOmFueSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZUhvb2tcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVPdmVycmlkZVxyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6YW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lSHViXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGhvb2sgdG8gdGhlIHNwZWNpZmllZCBzaWduYWwgdGhhdCBlbmFibGVzIGV4dGVuc2lvbnMgdG8gb3ZlcnJpZGUgZ3JpZCBiZWhhdmlvclxyXG4gICAgICogZGVmaW5lZCBpbiB0aGUgY29yZSBvciBvdGhlciBleHRlbnNpb25zLlxyXG4gICAgICovXHJcbiAgICBob29rKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazphbnkpOnZvaWQ7XHJcblxyXG4gICAgb3ZlcnJpZGUocm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOmFueSk6YW55O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2lnbmFscyB0aGF0IGEgcm91dGluZSBpcyBhYm91dCB0byBydW4gdGhhdCBjYW4gYmUgaG9va2VkIG9yIG92ZXJyaWRkZW4gYnkgZXh0ZW5zaW9ucy4gIEFyZ3VtZW50c1xyXG4gICAgICogc2hvdWxkIGJlIHN1cHBvcnRpbmcgZGF0YSBvciByZWxldmFudCBvYmplY3RzIHRvIHRoZSByb3V0aW5lLiAgVGhlIHZhbHVlIHJldHVybmVkIHdpbGwgYmUgYHRydWVgXHJcbiAgICAgKiBpZiB0aGUgcm91dGluZSBoYXMgYmVlbiBvdmVycmlkZGVuIGJ5IGFuIGV4dGVuc2lvbi5cclxuICAgICAqL1xyXG4gICAgc2lnbmFsKHJvdXRpbmU6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTpib29sZWFuO1xyXG59XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50cyB0aGUgY29yZSBvZiB0aGUgR3JpZCBleHRlbnNpYmlsaXR5IHN5c3RlbS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBHcmlkS2VybmVsXHJcbntcclxuICAgIHB1YmxpYyByZWFkb25seSBjb21tYW5kczpHcmlkQ29tbWFuZEh1YiA9IG5ldyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwoKTtcclxuICAgIHB1YmxpYyByZWFkb25seSByb3V0aW5lczpHcmlkUm91dGluZUh1YiA9IG5ldyBHcmlkS2VybmVsUm91dGluZUh1YkltcGwoKTtcclxuICAgIHB1YmxpYyByZWFkb25seSB2YXJpYWJsZXM6R3JpZFZhcmlhYmxlSHViID0gbmV3IEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwoKTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVtaXR0ZXI6KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSkgPT4gdm9pZClcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXhwb3J0SW50ZXJmYWNlKHRhcmdldD86YW55KTphbnlcclxuICAgIHtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwge30gYXMgYW55O1xyXG5cclxuICAgICAgICBsZXQgY29tbWFuZHMgPSB0aGlzLmNvbW1hbmRzWydzdG9yZSddIGFzIE9iamVjdE1hcDxHcmlkQ29tbWFuZD47XHJcbiAgICAgICAgbGV0IHZhcmlhYmxlcyA9IHRoaXMudmFyaWFibGVzWydzdG9yZSddIGFzIE9iamVjdE1hcDxHcmlkVmFyaWFibGU+O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBuIGluIGNvbW1hbmRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGFyZ2V0W25dID0gY29tbWFuZHNbbl07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBuIGluIHZhcmlhYmxlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIG4sIHZhcmlhYmxlc1tuXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnN0YWxsKGV4dDphbnkpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBjb21tYW5kcywgdmFyaWFibGVzIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoZXh0WydfX2tlcm5lbCddKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0V4dGVuc2lvbiBhcHBlYXJzIHRvIGhhdmUgYWxyZWFkeSBiZWVuIGluc3RhbGxlZCBpbnRvIHRoaXMgb3IgYW5vdGhlciBncmlkLi4uPyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRbJ19fa2VybmVsJ10gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgY21kcyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6Y29tbWFuZHMnLCBleHQpIHx8IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGMgb2YgY21kcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbW1hbmRzLmRlZmluZShjLm5hbWUsIGMuaW1wbC5iaW5kKGV4dCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhcnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOnZhcmlhYmxlcycsIGV4dCkgfHwgW107XHJcbiAgICAgICAgZm9yIChsZXQgdiBvZiB2YXJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyaWFibGVzLmRlZmluZSh2Lm5hbWUsIHtcclxuICAgICAgICAgICAgICAgIGdldDogKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpc1t2LmtleV07IH0pLmJpbmQoZXh0KSxcclxuICAgICAgICAgICAgICAgIHNldDogISF2Lm11dGFibGUgPyAoZnVuY3Rpb24odmFsKSB7IHRoaXNbdi5rZXldID0gdmFsOyB9KS5iaW5kKGV4dCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbENvbW1hbmRIdWJJbXBsIGltcGxlbWVudHMgR3JpZENvbW1hbmRIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBzdG9yZTpPYmplY3RNYXA8R3JpZENvbW1hbmQ+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVmaW5lKGNvbW1hbmQ6c3RyaW5nLCBpbXBsOkdyaWRDb21tYW5kKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVbY29tbWFuZF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnQ29tbWFuZCB3aXRoIG5hbWUgYWxyZWFkeSByZWdpc3RlcmVkOiAnICsgY29tbWFuZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVbY29tbWFuZF0gPSBpbXBsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZXMgdGhlIHNwZWNpZmllZCBncmlkIGNvbW1hbmQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleGVjKGNvbW1hbmQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW2NvbW1hbmRdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW1wbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCBjb21tYW5kOiAnICsgY29tbWFuZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRSb3V0aW5lSHViXHJcbntcclxuICAgIHByaXZhdGUgaG9va3M6T2JqZWN0TWFwPEdyaWRSb3V0aW5lSG9va1tdPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBvdmVycmlkZXM6T2JqZWN0TWFwPEdyaWRSb3V0aW5lT3ZlcnJpZGU+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBob29rKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazpHcmlkUm91dGluZUhvb2spOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuaG9va3Nbcm91dGluZV0gfHwgKHRoaXMuaG9va3Nbcm91dGluZV0gPSBbXSk7XHJcbiAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb3ZlcnJpZGUocm91dGluZTpzdHJpbmcsIGNhbGxiYWNrOkdyaWRSb3V0aW5lT3ZlcnJpZGUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2lnbmFscyB0aGF0IGEgcm91dGluZSBpcyBhYm91dCB0byBydW4gdGhhdCBjYW4gYmUgaG9va2VkIG9yIG92ZXJyaWRkZW4gYnkgZXh0ZW5zaW9ucy4gIEFyZ3VtZW50c1xyXG4gICAgICogc2hvdWxkIGJlIHN1cHBvcnRpbmcgZGF0YSBvciByZWxldmFudCBvYmplY3RzIHRvIHRoZSByb3V0aW5lLiAgVGhlIHZhbHVlIHJldHVybmVkIHdpbGwgYmUgYHRydWVgXHJcbiAgICAgKiBpZiB0aGUgcm91dGluZSBoYXMgYmVlbiBvdmVycmlkZGVuIGJ5IGFuIGV4dGVuc2lvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNpZ25hbChyb3V0aW5lOnN0cmluZywgYXJnczphbnlbXSwgaW1wbDpGdW5jdGlvbik6YW55XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhgYmVmb3JlOiR7cm91dGluZX1gLCBhcmdzKTtcclxuXHJcbiAgICAgICAgaWYgKCEhdGhpcy5vdmVycmlkZXNbcm91dGluZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhcmdzLnB1c2goaW1wbCk7XHJcbiAgICAgICAgICAgIGltcGwgPSB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXN1bHQgPSBpbXBsLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG5cclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKHJvdXRpbmUsIGFyZ3MpO1xyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3MoYGFmdGVyOiR7cm91dGluZX1gLCBhcmdzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGludm9rZUhvb2tzKHJvdXRpbmU6c3RyaW5nLCBhcmdzOmFueVtdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmhvb2tzW3JvdXRpbmVdO1xyXG5cclxuICAgICAgICBpZiAobGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGhvb2sgb2YgbGlzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaG9vay5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRWYXJpYWJsZUh1YlxyXG57XHJcbiAgICBwcml2YXRlIHN0b3JlOk9iamVjdE1hcDxHcmlkVmFyaWFibGU+ID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGRlZmluZSh2YXJpYWJsZTpzdHJpbmcsIGltcGw6R3JpZFZhcmlhYmxlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVbdmFyaWFibGVdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1ZhcmlhYmxlIHdpdGggbmFtZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVbdmFyaWFibGVdID0gaW1wbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgdGhlIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICBsZXQgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGltcGwuZ2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW3ZhcmlhYmxlXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpbXBsLnNldClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaW1wbC5zZXQodmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ0Nhbm5vdCBzZXQgcmVhZG9ubHkgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUmVjdExpa2UsIFJlY3QgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBiYXNlIGludGVyZmFjZSBvZiBhIHdpZGdldC4gIEEgd2lkZ2V0IGlzIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBVSSBlbGVtZW50IHdpdGhpbiB0aGUgY29udGV4dCBvZlxyXG4gKiBhIGdyaWQuICBJdCBjYW4gYmUgY29tcG9zZWQgb2Ygb25lIG9yIG1vcmUgRE9NIGVsZW1lbnRzIGFuZCBiZSBpbnRlcmFjdGFibGUgb3Igc3RhdGljLiAgVGhlIFdpZGdldCBpbnRlcmZhY2VzXHJcbiAqIHByb3ZpZGVzIGEgY29tbW9uIGludGVyZmFjZSB0aHJvdWdoIHdoaWNoIG1vZHVsZXMgb3IgY29uc3VtZXJzIGNhbiBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgRE9NIGVsZW1lbnRzIG9mIGEgd2lkZ2V0XHJcbiAqIGFuZCBiYXNpYyBtZXRob2RzIHRoYXQgZWFzZSB0aGUgbWFuaXB1bGF0aW9uIG9mIHdpZGdldHMuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdpZGdldFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIFRoZSByb290IEhUTUxFbGVtZW50IG9mIHRoZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHJvb3Q6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIGEgUmVjdCBvYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIFdpZGdldCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHZpZXdSZWN0OlJlY3Q7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlcyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBoaWRlKCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHNob3coKTp2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aXNpYmxlXHJcbiAgICAgKi9cclxuICAgIHRvZ2dsZSh2aXNpYmxlOmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhbiBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBXaWRnZXQgaW1wbGVtZW50YXRpb25zIHRoYXQgYXJlIGV4cGVjdGVkIHRvIHJlcHJlc2VudCBXaWRnZXRzIHdpdGhcclxuICogYWJzb2x1dGVseSBwb3NpdGlvbmVkIHJvb3QgZWxlbWVudHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQWJzV2lkZ2V0QmFzZTxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+IGltcGxlbWVudHMgV2lkZ2V0XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByb290OlQpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIGEgUmVjdCBvYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIFdpZGdldCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgdmlld1JlY3QoKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0XHJcbiAgICAgICAgKFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMucm9vdC5zdHlsZS5sZWZ0KSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLnJvb3Quc3R5bGUudG9wKSxcclxuICAgICAgICAgICAgdGhpcy5yb290LmNsaWVudFdpZHRoLFxyXG4gICAgICAgICAgICB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmVzIHRoZSBXaWRnZXQgdG8gdGhlIHNwZWNpZmllZCBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpZXdSZWN0XHJcbiAgICAgKiBAcGFyYW0gYW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ290byh2aWV3UmVjdDpSZWN0TGlrZSwgYXV0b1Nob3c6Ym9vbGVhbiA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoYXV0b1Nob3cpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBEb20uc2hvdyh0aGlzLnJvb3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLnJvb3QsIHtcclxuICAgICAgICAgICAgbGVmdDogYCR7dmlld1JlY3QubGVmdCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB0b3A6IGAke3ZpZXdSZWN0LnRvcCAtIDF9cHhgLFxyXG4gICAgICAgICAgICB3aWR0aDogYCR7dmlld1JlY3Qud2lkdGggKyAxfXB4YCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBgJHt2aWV3UmVjdC5oZWlnaHQgKyAxfXB4YCxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6IGBoaWRkZW5gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZXMgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhpZGUoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLmhpZGUodGhpcy5yb290KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzaG93KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIHRvZ2dsZSh2aXNpYmxlOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20udG9nZ2xlKHRoaXMucm9vdCwgdmlzaWJsZSlcclxuICAgIH1cclxufSIsIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudFN1YnNjcmlwdGlvblxyXG57XHJcbiAgICBjYW5jZWwoKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50Q2FsbGJhY2tcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIG9uKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb247XHJcblxyXG4gICAgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZDtcclxuXHJcbiAgICBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXJCYXNlXHJcbntcclxuICAgIHByaXZhdGUgYnVja2V0czphbnkgPSB7fTtcclxuXHJcbiAgICBwdWJsaWMgb24oZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KS5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4geyBjYW5jZWw6ICgpID0+IHRoaXMub2ZmKGV2ZW50LCBjYWxsYmFjaykgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGxldCBpZHggPSBsaXN0LmluZGV4T2YoY2FsbGJhY2spO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vIGlmICghZXZlbnQubWF0Y2goJ21vdXNlJykgJiYgIWV2ZW50Lm1hdGNoKCdrZXknKSAmJiAhZXZlbnQubWF0Y2goJ2RyYWcnKSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGV2ZW50LCAuLi5hcmdzKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5nZXRDYWxsYmFja0xpc3QoZXZlbnQpO1xyXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDYWxsYmFja0xpc3QoZXZlbnQ6c3RyaW5nKTpFdmVudENhbGxiYWNrW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5idWNrZXRzW2V2ZW50XSB8fCAodGhpcy5idWNrZXRzW2V2ZW50XSA9IFtdKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFBhZGRpbmcgfSBmcm9tICcuLi8uLi9nZW9tL1BhZGRpbmcnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZFJvdyB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJvdyc7XHJcbmltcG9ydCB7IFJlY3QsIFJlY3RMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbnR5cGUgQ2VsbENvbFJvd0xvb2t1cCA9IE9iamVjdEluZGV4PE9iamVjdEluZGV4PEdyaWRDZWxsPj47XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRMYXlvdXRSZWdpb248VD4gZXh0ZW5kcyBSZWN0TGlrZVxyXG57XHJcbiAgICByZWFkb25seSByZWY6VDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXlvdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBjb21wdXRlKG1vZGVsOkdyaWRNb2RlbCwgcGFkZGluZzpQYWRkaW5nKTpHcmlkTGF5b3V0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvbExvb2t1cCA9IDxPYmplY3RJbmRleDxHcmlkQ29sdW1uPj5tb2RlbC5jb2x1bW5zLnJlZHVjZSgodCwgeCkgPT4geyB0W3gucmVmXSA9IHg7IHJldHVybiB0IH0sIHt9KTtcclxuICAgICAgICBsZXQgcm93TG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRSb3c+Pm1vZGVsLnJvd3MucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCBjZWxsTG9va3VwID0gYnVpbGRDZWxsTG9va3VwKG1vZGVsLmNlbGxzKTsgLy9ieSBjb2wgdGhlbiByb3dcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSBhbGwgZXhwZWN0ZWQgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGxldCBtYXhDb2wgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LmNvbFJlZiArICh4LmNvbFNwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuICAgICAgICBsZXQgbWF4Um93ID0gbW9kZWwuY2VsbHMubWFwKHggPT4geC5yb3dSZWYgKyAoeC5yb3dTcGFuIC0gMSkpLnJlZHVjZSgodCwgeCkgPT4gdCA+IHggPyB0IDogeCwgMCk7XHJcblxyXG4gICAgICAgIC8vIEdlbmVyYXRlIG1pc3NpbmcgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heENvbDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKGNvbExvb2t1cFtpXSB8fCAoY29sTG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkQ29sdW1uKGkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG1heFJvdzsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgKHJvd0xvb2t1cFtpXSB8fCAocm93TG9va3VwW2ldID0gbmV3IERlZmF1bHRHcmlkUm93KGkpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHdpZHRoIGFuZCBoZWlnaHQgb2Ygd2hvbGUgZ3JpZFxyXG4gICAgICAgIGxldCB3aWR0aCA9IF8udmFsdWVzKGNvbExvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC53aWR0aCwgMCkgKyBwYWRkaW5nLmhvcml6b250YWw7XHJcbiAgICAgICAgbGV0IGhlaWdodCA9IF8udmFsdWVzKHJvd0xvb2t1cCkucmVkdWNlKCh0LCB4KSA9PiB0ICsgeC5oZWlnaHQsIDApICsgcGFkZGluZy52ZXJ0aWNhbDtcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgbGF5b3V0IHJlZ2lvbnMgZm9yIHRoZSB2YXJpb3VzIGJpdHNcclxuICAgICAgICBsZXQgY29sUmVnczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSA9IFtdO1xyXG4gICAgICAgIGxldCByb3dSZWdzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdID0gW107XHJcbiAgICAgICAgbGV0IGNlbGxSZWdzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdID0gW107XHJcbiAgICAgICAgbGV0IGxvYWRUcmFja2VyID0ge30gYXMgeyBba2V5OnN0cmluZ106Ym9vbGVhbiB9O1xyXG5cclxuICAgICAgICBsZXQgYWNjTGVmdCA9IHBhZGRpbmcubGVmdDtcclxuICAgICAgICBmb3IgKGxldCBjaSA9IDA7IGNpIDw9IG1heENvbDsgY2krKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjb2wgPSBjb2xMb29rdXBbY2ldO1xyXG5cclxuICAgICAgICAgICAgY29sUmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHJlZjogY29sLnJlZixcclxuICAgICAgICAgICAgICAgIGxlZnQ6IGFjY0xlZnQsXHJcbiAgICAgICAgICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogY29sLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFjY1RvcCA9IHBhZGRpbmcudG9wO1xyXG4gICAgICAgICAgICBmb3IgKGxldCByaSA9IDA7IHJpIDw9IG1heFJvdzsgcmkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJvdyA9IHJvd0xvb2t1cFtyaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvd1JlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogcm93LnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByb3cuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjZWxsTG9va3VwW2NpXSAhPT0gdW5kZWZpbmVkICYmIGNlbGxMb29rdXBbY2ldW3JpXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjZWxsID0gY2VsbExvb2t1cFtjaV1bcmldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjZWxsICYmICFsb2FkVHJhY2tlcltjZWxsLnJlZl0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgd2lkdGggPSAwLCBoZWlnaHQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9UYWtlIGNvbFNwYW4gYW5kIHJvd1NwYW4gaW50byBhY2NvdW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGNpeCA9IGNpOyBjaXggPD0gbWF4Q29sICYmIGNpeCA8IChjaSArIGNlbGwuY29sU3Bhbik7IGNpeCsrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCArPSBjb2xMb29rdXBbY2l4XS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCByaXggPSByaTsgcml4IDw9IG1heFJvdyAmJiByaXggPCAocmkgKyBjZWxsLnJvd1NwYW4pOyByaXgrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICs9IHJvd0xvb2t1cFtyaXhdLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogYWNjVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFRyYWNrZXJbY2VsbC5yZWZdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYWNjVG9wICs9IHJvdy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFjY0xlZnQgKz0gY29sLndpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkTGF5b3V0KHdpZHRoLCBoZWlnaHQsIGNvbFJlZ3MsIHJvd1JlZ3MsIGNlbGxSZWdzLCBjZWxsTG9va3VwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGhlaWdodDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXTtcclxuICAgIHB1YmxpYyByZWFkb25seSByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdO1xyXG5cclxuICAgIHByaXZhdGUgY2VsbExvb2t1cDpDZWxsQ29sUm93TG9va3VwO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5JbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSByb3dJbmRleDpPYmplY3RJbmRleDxHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj4+O1xyXG4gICAgcHJpdmF0ZSBjZWxsSW5kZXg6T2JqZWN0TWFwPEdyaWRMYXlvdXRSZWdpb248c3RyaW5nPj47XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcclxuICAgICAgICB3aWR0aDpudW1iZXIsIFxyXG4gICAgICAgIGhlaWdodDpudW1iZXIsIFxyXG4gICAgICAgIGNvbHVtbnM6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10sXHJcbiAgICAgICAgcm93czpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICBjZWxsczpHcmlkTGF5b3V0UmVnaW9uPHN0cmluZz5bXSxcclxuICAgICAgICBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gcm93cztcclxuICAgICAgICB0aGlzLmNlbGxzID0gY2VsbHM7XHJcblxyXG4gICAgICAgIHRoaXMuY2VsbExvb2t1cCA9IGNlbGxMb29rdXA7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5JbmRleCA9IF8uaW5kZXgoY29sdW1ucywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5yb3dJbmRleCA9IF8uaW5kZXgocm93cywgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgdGhpcy5jZWxsSW5kZXggPSBfLmluZGV4KGNlbGxzLCB4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlDb2x1bW4ocmVmOm51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5JbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Q29sdW1uUmFuZ2UoZnJvbVJlZjpudW1iZXIsIHRvUmVmRXg6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaWtlcyA9IFtdIGFzIFJlY3RMaWtlW107ICAgICAgICBcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZyb21SZWY7IGkgPCB0b1JlZkV4OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaWtlcy5wdXNoKHRoaXMucXVlcnlDb2x1bW4oaSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tTWFueShsaWtlcy5tYXAoUmVjdC5mcm9tTGlrZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeVJvdyhyZWY6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd0luZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlSb3dSYW5nZShmcm9tUmVmOm51bWJlciwgdG9SZWZFeDpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpa2VzID0gW10gYXMgUmVjdExpa2VbXTsgICAgICAgIFxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZnJvbVJlZjsgaSA8IHRvUmVmRXg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpa2VzLnB1c2godGhpcy5xdWVyeVJvdyhpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21NYW55KGxpa2VzLm1hcChSZWN0LmZyb21MaWtlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Q2VsbChyZWY6c3RyaW5nKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVDb2x1bW5zKHJlZ2lvbjpSZWN0TGlrZSk6bnVtYmVyW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5zXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBSZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZVJvd3MocmVnaW9uOlJlY3RMaWtlKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IFJlY3QucHJvdG90eXBlLmludGVyc2VjdHMuY2FsbCh4LCByZWdpb24pKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlQ2VsbHMocmVnaW9uOlJlY3RMaWtlKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsb29rdXAgPSB0aGlzLmNlbGxMb29rdXA7XHJcbiAgICAgICAgbGV0IGNvbHMgPSB0aGlzLmNhcHR1cmVDb2x1bW5zKHJlZ2lvbik7XHJcbiAgICAgICAgbGV0IHJvd3MgPSB0aGlzLmNhcHR1cmVSb3dzKHJlZ2lvbik7XHJcbiAgICAgICAgbGV0IGNlbGxzID0gbmV3IEFycmF5PHN0cmluZz4oKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBjb2xzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFsb29rdXBbY10pXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHIgb2Ygcm93cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsb29rdXBbY11bcl0pXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgY2VsbHMucHVzaChsb29rdXBbY11bcl0ucmVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNlbGxzO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZENlbGxMb29rdXAoY2VsbHM6R3JpZENlbGxbXSk6Q2VsbENvbFJvd0xvb2t1cFxyXG57XHJcbiAgICBsZXQgaXggPSB7fTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgY2VsbCBvZiBjZWxscylcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBjbyA9IDA7IGNvIDwgY2VsbC5jb2xTcGFuOyBjbysrKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHJvID0gMDsgcm8gPCBjZWxsLnJvd1NwYW47IHJvKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjID0gY2VsbC5jb2xSZWYgKyBjbztcclxuICAgICAgICAgICAgICAgIGxldCByID0gY2VsbC5yb3dSZWYgKyBybztcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2l4ID0gaXhbY10gfHwgKGl4W2NdID0ge30pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNpeFtyXSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1R3byBjZWxscyBhcHBlYXIgdG8gb2NjdXB5JywgYywgJ3gnLCByKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY2l4W3JdID0gY2VsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gaXg7XHJcbn0iXX0=
