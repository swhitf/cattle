(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
(function (setImmediate){
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

}).call(this,require("timers").setImmediate)

},{"timers":6}],3:[function(require,module,exports){
/*@license
	Papa Parse
	v4.4.0
	https://github.com/mholt/PapaParse
	License: MIT
*/
(function(root, factory)
{
	/* globals define */
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

	var global = (function() {
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
		};
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
			document.addEventListener('DOMContentLoaded', function() {
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

			str = str.toString().replace(quoteCharRegex, _quoteChar + _quoteChar);

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
		this._finished = false;
		this._completed = false;
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

		this.parseChunk = function(chunk, isFakeChunk)
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
			else if (isFunction(this._config.chunk) && !isFakeChunk)
			{
				this._config.chunk(results, this._handle);
				if (this._handle.paused() || this._handle.aborted())
					return;
				results = undefined;
				this._completeResults = undefined;
			}

			if (!this._config.step && !this._config.chunk) {
				this._completeResults.data = this._completeResults.data.concat(results.data);
				this._completeResults.errors = this._completeResults.errors.concat(results.errors);
				this._completeResults.meta = results.meta;
			}

			if (!this._completed && finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted)) {
				this._config.complete(this._completeResults, this._input);
				this._completed = true;
			}

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
				xhr.setRequestHeader('Range', 'bytes=' + this._start + '-' + end);
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
		};

		this._chunkLoaded = function()
		{
			if (xhr.readyState !== 4)
				return;

			if (xhr.status < 200 || xhr.status >= 400)
			{
				this._chunkError();
				return;
			}

			this._finished = !this._config.chunkSize || this._start > getFileSize(xhr);
			this.parseChunk(xhr.responseText);
		};

		this._chunkError = function(errorMessage)
		{
			var errorText = xhr.statusText || errorMessage;
			this._sendError(new Error(errorText));
		};

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
		};

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
		};

		this._chunkLoaded = function(event)
		{
			// Very important to increment start each time before handling results
			this._start += this._config.chunkSize;
			this._finished = !this._config.chunkSize || this._start >= this._input.size;
			this.parseChunk(event.target.result);
		};

		this._chunkError = function()
		{
			this._sendError(reader.error);
		};

	}
	FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
	FileStreamer.prototype.constructor = FileStreamer;


	function StringStreamer(config)
	{
		config = config || {};
		ChunkStreamer.call(this, config);

		var remaining;
		this.stream = function(s)
		{
			remaining = s;
			return this._nextChunk();
		};
		this._nextChunk = function()
		{
			if (this._finished) return;
			var size = this._config.chunkSize;
			var chunk = size ? remaining.substr(0, size) : remaining;
			remaining = size ? remaining.substr(size) : '';
			this._finished = !remaining;
			return this.parseChunk(chunk);
		};
	}
	StringStreamer.prototype = Object.create(StringStreamer.prototype);
	StringStreamer.prototype.constructor = StringStreamer;


	function ReadableStreamStreamer(config)
	{
		config = config || {};

		ChunkStreamer.call(this, config);

		var queue = [];
		var parseOnData = true;
		var streamHasEnded = false;

		this.pause = function()
		{
			ChunkStreamer.prototype.pause.apply(this, arguments);
			this._input.pause();
		};

		this.resume = function()
		{
			ChunkStreamer.prototype.resume.apply(this, arguments);
			this._input.resume();
		};

		this.stream = function(stream)
		{
			this._input = stream;

			this._input.on('data', this._streamData);
			this._input.on('end', this._streamEnd);
			this._input.on('error', this._streamError);
		};

		this._checkIsFinished = function()
		{
			if (streamHasEnded && queue.length === 1) {
				this._finished = true;
			}
		};

		this._nextChunk = function()
		{
			this._checkIsFinished();
			if (queue.length)
			{
				this.parseChunk(queue.shift());
			}
			else
			{
				parseOnData = true;
			}
		};

		this._streamData = bindFunction(function(chunk)
		{
			try
			{
				queue.push(typeof chunk === 'string' ? chunk : chunk.toString(this._config.encoding));

				if (parseOnData)
				{
					parseOnData = false;
					this._checkIsFinished();
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
			this._sendError(error);
		}, this);

		this._streamEnd = bindFunction(function()
		{
			this._streamCleanUp();
			streamHasEnded = true;
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
				var delimGuess = guessDelimiter(input, _config.newline, _config.skipEmptyLines);
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
			self.streamer.parseChunk(_input, true);
		};

		this.aborted = function()
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
				addError('Delimiter', 'UndetectableDelimiter', 'Unable to auto-detect delimiting character; defaulted to \'' + Papa.DefaultDelimiter + '\'');
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
				{
					var header = _results.data[i][j];

					if (_config.trimHeaders) {
						header = header.trim();
					}

					_fields.push(header);
				}
			_results.data.splice(0, 1);
		}

		function shouldApplyDynamicTyping(field) {
			// Cache function values to avoid calling it for each row
			if (_config.dynamicTypingFunction && _config.dynamicTyping[field] === undefined) {
				_config.dynamicTyping[field] = _config.dynamicTypingFunction(field);
			}
			return (_config.dynamicTyping[field] || _config.dynamicTyping) === true;
		}

		function parseDynamic(field, value)
		{
			if (shouldApplyDynamicTyping(field))
			{
				if (value === 'true' || value === 'TRUE')
					return true;
				else if (value === 'false' || value === 'FALSE')
					return false;
				else if(FLOAT.test(value)) {
					return parseFloat(value);
				}
				else {
					return (value === '' ? null : value);
				}
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

				var j;
				for (j = 0; j < _results.data[i].length; j++)
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

		function guessDelimiter(input, newline, skipEmptyLines)
		{
			var delimChoices = [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP];
			var bestDelim, bestDelta, fieldCountPrevRow;

			for (var i = 0; i < delimChoices.length; i++)
			{
				var delim = delimChoices[i];
				var delta = 0, avgFieldCount = 0, emptyLinesCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					delimiter: delim,
					newline: newline,
					preview: 10
				}).parse(input);

				for (var j = 0; j < preview.data.length; j++)
				{
					if (skipEmptyLines && preview.data[j].length === 1 && preview.data[j][0].length === 0) {
						emptyLinesCount++;
						continue;
					}
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
					avgFieldCount /= (preview.data.length - emptyLinesCount);

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
			};
		}

		function guessLineEndings(input)
		{
			input = input.substr(0, 1024 * 1024);	// max length 1 MB

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
		var quoteChar;
		/** Allows for no quoteChar by setting quoteChar to undefined in config */
		if (config.quoteChar === undefined) {
			quoteChar = '"';
		} else {
			quoteChar = config.quoteChar;
		}
		var escapeChar = quoteChar;
		if (config.escapeChar !== undefined) {
			escapeChar = config.escapeChar;
		}

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
		if (newline !== '\n' && newline !== '\r' && newline !== '\r\n')
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
					row = rows[i];
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
			var quoteCharRegex = new RegExp(escapeChar.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + quoteChar, 'g');
			var quoteSearch;

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] === quoteChar)
				{
					// Start our search for the closing quote where the cursor is
					quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						quoteSearch = input.indexOf(quoteChar, quoteSearch + 1);

						//No other quotes are found - no other delimiters
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

						// Closing quote at EOF
						if (quoteSearch === inputLen - 1)
						{
							var value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						// If the quote character is the escape character, then check if the next character is the escape character
						if (quoteChar === escapeChar &&  input[quoteSearch + 1] === escapeChar)
						{
							quoteSearch++;
							continue;
						}

						// If the quote character is not the escape character, then check if the previous character was the escape character
						if (quoteChar !== escapeChar && quoteSearch !== 0 && input[quoteSearch - 1] === escapeChar)
						{
							continue;
						}

						var spacesBetweenQuoteAndDelimiter = extraSpaces(nextDelim);

						// Closing quote followed by delimiter or 'unnecessary steps + delimiter'
						if (input[quoteSearch + 1 + spacesBetweenQuoteAndDelimiter] === delim)
						{
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							cursor = quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen;
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						var spacesBetweenQuoteAndNewLine = extraSpaces(nextNewline);

						// Closing quote followed by newline or 'unnecessary spaces + newLine'
						if (input.substr(quoteSearch + 1 + spacesBetweenQuoteAndNewLine, newlineLen) === newline)
						{
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							saveRow(quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen);
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


						// Checks for valid closing quotes are complete (escaped quotes or quote followed by EOF/delimiter/newline) -- assume these quotes are part of an invalid text string
						errors.push({
							type: 'Quotes',
							code: 'InvalidQuotes',
							message: 'Trailing quote on quoted field is malformed',
							row: data.length,	// row has yet to be inserted
							index: cursor
						});

						quoteSearch++;
						continue;

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
             * checks if there are extra spaces after closing quote and given index without any text
             * if Yes, returns the number of spaces
             */
			function extraSpaces(index) {
				var spaceLength = 0;
				if (index !== -1) {
					var textBetweenClosingQuoteAndIndex = input.substring(quoteSearch + 1, index);
					if (textBetweenClosingQuoteAndIndex && textBetweenClosingQuoteAndIndex.trim() === '') {
						spaceLength = textBetweenClosingQuoteAndIndex.length;
					}
				}
				return spaceLength;
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
				data = [];
				errors = [];
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
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

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
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":4,"timers":6}],7:[function(require,module,exports){
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
},{"./extensions/common/ClipboardExtension":8,"./extensions/common/EditingExtension":9,"./extensions/common/ScrollerExtension":10,"./extensions/common/SelectorExtension":11,"./extensions/compute/ComputeExtension":12,"./extensions/compute/JavaScriptComputeEngine":13,"./extensions/compute/WatchManager":14,"./extensions/extra/ClickZoneExtension":15,"./extensions/history/HistoryExtension":16,"./extensions/history/HistoryManager":17,"./geom/Point":19,"./geom/Rect":20,"./misc/Base26":29,"./model/GridRange":35,"./model/default/DefaultGridCell":36,"./model/default/DefaultGridColumn":37,"./model/default/DefaultGridModel":38,"./model/default/DefaultGridRow":39,"./model/styled/Style":40,"./model/styled/StyledGridCell":41,"./ui/Extensibility":42,"./ui/GridElement":43,"./ui/GridKernel":44,"./ui/Widget":45,"./ui/internal/EventEmitter":46}],8:[function(require,module,exports){
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
var ClipboardExtension = /** @class */ (function () {
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
var CopyNet = /** @class */ (function (_super) {
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
},{"../../geom/Point":19,"../../geom/Rect":20,"../../input/KeyInput":24,"../../misc/Dom":30,"../../misc/Util":34,"../../model/GridRange":35,"../../ui/Extensibility":42,"../../ui/Widget":45,"./EditingExtension":9,"clipboard-js":2,"papaparse":3,"tether":5}],9:[function(require,module,exports){
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
var Tether = require("tether");
var Point_1 = require("../../geom/Point");
var KeyInput_1 = require("../../input/KeyInput");
var MouseInput_1 = require("../../input/MouseInput");
var Dom = require("../../misc/Dom");
var Util_1 = require("../../misc/Util");
var Extensibility_1 = require("../../ui/Extensibility");
var Widget_1 = require("../../ui/Widget");
var Vectors = {
    n: new Point_1.Point(0, -1),
    s: new Point_1.Point(0, 1),
    e: new Point_1.Point(1, 0),
    w: new Point_1.Point(-1, 0),
};
var GridChangeSet = /** @class */ (function () {
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
var EditingExtension = /** @class */ (function () {
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
var Input = /** @class */ (function (_super) {
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
},{"../../geom/Point":19,"../../input/KeyInput":24,"../../input/MouseInput":28,"../../misc/Dom":30,"../../misc/Util":34,"../../ui/Extensibility":42,"../../ui/Widget":45,"tether":5}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
var Padding_1 = require("../../geom/Padding");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var ScrollerExtension = /** @class */ (function () {
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
        var maxScroll = new Point_1.Point(Math.max(0, grid.virtualWidth - grid.width), Math.max(0, grid.virtualHeight - grid.height));
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
},{"../../geom/Padding":18,"../../geom/Point":19,"../../misc/Dom":30,"../../misc/Util":34}],11:[function(require,module,exports){
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
var SelectorExtension = /** @class */ (function () {
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
            .on('UP:PRIMARY', function (e) { return _this.endSelectGesture( /*e.gridX, e.gridY*/); });
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
var Selector = /** @class */ (function (_super) {
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
},{"../../geom/Point":19,"../../geom/Rect":20,"../../input/KeyInput":24,"../../input/MouseDragEventSupport":26,"../../input/MouseInput":28,"../../misc/Dom":30,"../../ui/Extensibility":42,"../../ui/Widget":45,"tether":5}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JavaScriptComputeEngine_1 = require("./JavaScriptComputeEngine");
var EditingExtension_1 = require("../common/EditingExtension");
var ComputeExtension = /** @class */ (function () {
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
},{"../common/EditingExtension":9,"./JavaScriptComputeEngine":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
var GridRange_1 = require("../../model/GridRange");
var EditingExtension_1 = require("../common/EditingExtension");
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
var JavaScriptComputeEngine = /** @class */ (function () {
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
},{"../../misc/Util":34,"../../model/GridRange":35,"../common/EditingExtension":9,"./WatchManager":14}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WatchManager = /** @class */ (function () {
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
},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Polyfill_1 = require("../../misc/Polyfill");
var Rect_1 = require("../../geom/Rect");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var Tether = require("tether");
var ClickZoneExtension = /** @class */ (function () {
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
},{"../../geom/Point":19,"../../geom/Rect":20,"../../misc/Dom":30,"../../misc/Polyfill":31,"tether":5}],16:[function(require,module,exports){
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
var KeyInput_1 = require("../../input/KeyInput");
var Util_1 = require("../../misc/Util");
var Extensibility_1 = require("../../ui/Extensibility");
var EditingExtension_1 = require("../common/EditingExtension");
var HistoryManager_1 = require("./HistoryManager");
var HistoryExtension = /** @class */ (function () {
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
},{"../../input/KeyInput":24,"../../misc/Util":34,"../../ui/Extensibility":42,"../common/EditingExtension":9,"./HistoryManager":17}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultHistoryManager = /** @class */ (function () {
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
var Util_1 = require("../misc/Util");
var Padding = /** @class */ (function () {
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
},{"../misc/Util":34}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point = /** @class */ (function () {
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
},{}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("./Point");
var Rect = /** @class */ (function () {
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
},{"./Point":19}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("../misc/Util");
var EventTargetEventEmitterAdapter = /** @class */ (function () {
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
},{"../misc/Util":34}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tracker;
var KeyCheck = /** @class */ (function () {
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
var KeyExpression = /** @class */ (function () {
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
var KeyInput = /** @class */ (function () {
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
var Keys = /** @class */ (function () {
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
},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Polyfill_1 = require("../misc/Polyfill");
var Point_1 = require("../geom/Point");
var MouseDragEventSupport = /** @class */ (function () {
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
},{"../geom/Point":19,"../misc/Polyfill":31}],27:[function(require,module,exports){
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
var MouseExpression = /** @class */ (function () {
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
},{"../misc/Util":34,"./KeyCheck":22,"./Keys":25}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventTargetEventEmitterAdapter_1 = require("./EventTargetEventEmitterAdapter");
var MouseExpression_1 = require("./MouseExpression");
var KeyCheck_1 = require("./KeyCheck");
var MouseInput = /** @class */ (function () {
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
var Base26 = /** @class */ (function () {
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
},{}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var start = new Date().getTime().toString();
var count = 0;
var RefGen = /** @class */ (function () {
    function RefGen() {
    }
    RefGen.next = function (prefix) {
        if (prefix === void 0) { prefix = 'C'; }
        return prefix + start + '-' + (count++);
    };
    return RefGen;
}());
exports.RefGen = RefGen;
},{}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var Base26_1 = require("../misc/Base26");
var _ = require("../misc/Util");
/**
 * Describes a resolveExpr of grid cells.
 */
var GridRange = /** @class */ (function () {
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
},{"../geom/Point":19,"../geom/Rect":20,"../misc/Base26":29,"../misc/Util":34}],36:[function(require,module,exports){
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
var DefaultGridCell = /** @class */ (function () {
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
},{"../../misc/RefGen":33,"../../misc/Util":34,"../../ui/Extensibility":42}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides a by-the-book implementation of GridColumn.
 */
var DefaultGridColumn = /** @class */ (function () {
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
},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("../../misc/Util");
var DefaultGridCell_1 = require("./DefaultGridCell");
/**
 * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
 */
var DefaultGridModel = /** @class */ (function () {
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
},{"../../misc/Util":34,"./DefaultGridCell":36}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides a by-the-book implementation of GridRow.
 */
var DefaultGridRow = /** @class */ (function () {
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
},{}],40:[function(require,module,exports){
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
var Cascading = /** @class */ (function () {
    function Cascading(parent, values) {
        this.parent = parent || null;
        if (values) {
            Util_1.extend(this, values);
        }
    }
    return Cascading;
}());
exports.Cascading = Cascading;
var Style = /** @class */ (function (_super) {
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
var TextStyle = /** @class */ (function (_super) {
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
},{"../../misc/Util":34}],41:[function(require,module,exports){
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
var StyledGridCell = /** @class */ (function (_super) {
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
},{"../../geom/Point":19,"../../ui/Extensibility":42,"../default/DefaultGridCell":36,"./Style":40}],42:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
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
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var Polyfill_1 = require("../misc/Polyfill");
var Property_1 = require("../misc/Property");
var _ = require("../misc/Util");
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var GridRange_1 = require("../model/GridRange");
var GridKernel_1 = require("./GridKernel");
var EventEmitter_1 = require("./internal/EventEmitter");
var GridLayout_1 = require("./internal/GridLayout");
var GridElement = /** @class */ (function (_super) {
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
                // Otherwise just use the previous
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
var Buffer = /** @class */ (function () {
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
var Visual = /** @class */ (function () {
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
},{"../geom/Padding":18,"../geom/Point":19,"../geom/Rect":20,"../misc/Polyfill":31,"../misc/Property":32,"../misc/Util":34,"../model/GridRange":35,"../model/default/DefaultGridModel":38,"./GridKernel":44,"./internal/EventEmitter":46,"./internal/GridLayout":47}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Implements the core of the Grid extensibility system.
 */
var GridKernel = /** @class */ (function () {
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
var GridKernelCommandHubImpl = /** @class */ (function () {
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
var GridKernelRoutineHubImpl = /** @class */ (function () {
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
var GridKernelVariableHubImpl = /** @class */ (function () {
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
},{}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../geom/Rect");
var Dom = require("../misc/Dom");
/**
 * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
 * absolutely positioned root elements.
 */
var AbsWidgetBase = /** @class */ (function () {
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
},{"../geom/Rect":20,"../misc/Dom":30}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitterBase = /** @class */ (function () {
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
},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../../geom/Rect");
var _ = require("../../misc/Util");
var DefaultGridColumn_1 = require("../../model/default/DefaultGridColumn");
var DefaultGridRow_1 = require("../../model/default/DefaultGridRow");
var GridLayout = /** @class */ (function () {
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
},{"../../geom/Rect":20,"../../misc/Util":34,"../../model/default/DefaultGridColumn":37,"../../model/default/DefaultGridRow":39}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZXMvYmFzZXMuanMiLCJub2RlX21vZHVsZXMvY2xpcGJvYXJkLWpzL2NsaXBib2FyZC5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXRoZXIvZGlzdC9qcy90ZXRoZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInNyYy9icm93c2VyLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL0NsaXBib2FyZEV4dGVuc2lvbi50cyIsInNyYy9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvY29tcHV0ZS9KYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZS50cyIsInNyYy9leHRlbnNpb25zL2NvbXB1dGUvV2F0Y2hNYW5hZ2VyLnRzIiwic3JjL2V4dGVuc2lvbnMvZXh0cmEvQ2xpY2tab25lRXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5RXh0ZW5zaW9uLnRzIiwic3JjL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5TWFuYWdlci50cyIsInNyYy9nZW9tL1BhZGRpbmcudHMiLCJzcmMvZ2VvbS9Qb2ludC50cyIsInNyYy9nZW9tL1JlY3QudHMiLCJzcmMvaW5wdXQvRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnRzIiwic3JjL2lucHV0L0tleUNoZWNrLnRzIiwic3JjL2lucHV0L0tleUV4cHJlc3Npb24udHMiLCJzcmMvaW5wdXQvS2V5SW5wdXQudHMiLCJzcmMvaW5wdXQvS2V5cy50cyIsInNyYy9pbnB1dC9Nb3VzZURyYWdFdmVudFN1cHBvcnQudHMiLCJzcmMvaW5wdXQvTW91c2VFeHByZXNzaW9uLnRzIiwic3JjL2lucHV0L01vdXNlSW5wdXQudHMiLCJzcmMvbWlzYy9CYXNlMjYudHMiLCJzcmMvbWlzYy9Eb20udHMiLCJzcmMvbWlzYy9Qb2x5ZmlsbC50cyIsInNyYy9taXNjL1Byb3BlcnR5LnRzIiwic3JjL21pc2MvUmVmR2VuLnRzIiwic3JjL21pc2MvVXRpbC50cyIsInNyYy9tb2RlbC9HcmlkUmFuZ2UudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENlbGwudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZENvbHVtbi50cyIsInNyYy9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkTW9kZWwudHMiLCJzcmMvbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZFJvdy50cyIsInNyYy9tb2RlbC9zdHlsZWQvU3R5bGUudHMiLCJzcmMvbW9kZWwvc3R5bGVkL1N0eWxlZEdyaWRDZWxsLnRzIiwic3JjL3VpL0V4dGVuc2liaWxpdHkudHMiLCJzcmMvdWkvR3JpZEVsZW1lbnQudHMiLCJzcmMvdWkvR3JpZEtlcm5lbC50cyIsInNyYy91aS9XaWRnZXQudHMiLCJzcmMvdWkvaW50ZXJuYWwvRXZlbnRFbWl0dGVyLnRzIiwic3JjL3VpL2ludGVybmFsL0dyaWRMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdG5EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ254REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztZQUM5QixLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNwQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztZQUM5QixLQUFLLFlBQVksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM1QyxLQUFLLFlBQVksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxLQUFLLFlBQVksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMxQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLFNBQVMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNwQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM1QyxLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFNB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RyxDQUFDLENBQUMsQ0FBQyxFQUNWO29CQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDekQ7Z0JBRUQsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUNqQjtTQUNKO0tBQ0o7SUFFRCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBiYXNlcy5qc1xuLy8gVXRpbGl0eSBmb3IgY29udmVydGluZyBudW1iZXJzIHRvL2Zyb20gZGlmZmVyZW50IGJhc2VzL2FscGhhYmV0cy5cbi8vIFNlZSBSRUFETUUubWQgZm9yIGRldGFpbHMuXG5cbnZhciBiYXNlcyA9ICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogKHdpbmRvdy5CYXNlcyA9IHt9KSk7XG5cbi8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIG51bWJlciBmb3IgdGhlIGdpdmVuIGFscGhhYmV0OlxuYmFzZXMudG9BbHBoYWJldCA9IGZ1bmN0aW9uIChudW0sIGFscGhhYmV0KSB7XG4gICAgdmFyIGJhc2UgPSBhbHBoYWJldC5sZW5ndGg7XG4gICAgdmFyIGRpZ2l0cyA9IFtdOyAgICAvLyB0aGVzZSB3aWxsIGJlIGluIHJldmVyc2Ugb3JkZXIgc2luY2UgYXJyYXlzIGFyZSBzdGFja3NcblxuICAgIC8vIGV4ZWN1dGUgYXQgbGVhc3Qgb25jZSwgZXZlbiBpZiBudW0gaXMgMCwgc2luY2Ugd2Ugc2hvdWxkIHJldHVybiB0aGUgJzAnOlxuICAgIGRvIHtcbiAgICAgICAgZGlnaXRzLnB1c2gobnVtICUgYmFzZSk7ICAgIC8vIFRPRE8gaGFuZGxlIG5lZ2F0aXZlcyBwcm9wZXJseT9cbiAgICAgICAgbnVtID0gTWF0aC5mbG9vcihudW0gLyBiYXNlKTtcbiAgICB9IHdoaWxlIChudW0gPiAwKTtcblxuICAgIHZhciBjaGFycyA9IFtdO1xuICAgIHdoaWxlIChkaWdpdHMubGVuZ3RoKSB7XG4gICAgICAgIGNoYXJzLnB1c2goYWxwaGFiZXRbZGlnaXRzLnBvcCgpXSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbn07XG5cbi8vIFJldHVybnMgYW4gaW50ZWdlciByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gc3RyaW5nIGZvciB0aGUgZ2l2ZW4gYWxwaGFiZXQ6XG5iYXNlcy5mcm9tQWxwaGFiZXQgPSBmdW5jdGlvbiAoc3RyLCBhbHBoYWJldCkge1xuICAgIHZhciBiYXNlID0gYWxwaGFiZXQubGVuZ3RoO1xuICAgIHZhciBwb3MgPSAwO1xuICAgIHZhciBudW0gPSAwO1xuICAgIHZhciBjO1xuXG4gICAgd2hpbGUgKHN0ci5sZW5ndGgpIHtcbiAgICAgICAgYyA9IHN0cltzdHIubGVuZ3RoIC0gMV07XG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHIoMCwgc3RyLmxlbmd0aCAtIDEpO1xuICAgICAgICBudW0gKz0gTWF0aC5wb3coYmFzZSwgcG9zKSAqIGFscGhhYmV0LmluZGV4T2YoYyk7XG4gICAgICAgIHBvcysrO1xuICAgIH1cblxuICAgIHJldHVybiBudW07XG59O1xuXG4vLyBLbm93biBhbHBoYWJldHM6XG5iYXNlcy5OVU1FUkFMUyA9ICcwMTIzNDU2Nzg5JztcbmJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JztcbmJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFID0gYmFzZXMuTEVUVEVSU19MT1dFUkNBU0UudG9VcHBlckNhc2UoKTtcbmJhc2VzLktOT1dOX0FMUEhBQkVUUyA9IHt9O1xuXG4vLyBFYWNoIG9mIHRoZSBudW1iZXIgb25lcywgc3RhcnRpbmcgZnJvbSBiYXNlLTIgKGJhc2UtMSBkb2Vzbid0IG1ha2Ugc2Vuc2U/KTpcbmZvciAodmFyIGkgPSAyOyBpIDw9IDEwOyBpKyspIHtcbiAgICBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbaV0gPSBiYXNlcy5OVU1FUkFMUy5zdWJzdHIoMCwgaSk7XG59XG5cbi8vIE5vZGUncyBuYXRpdmUgaGV4IGlzIDAtOSBmb2xsb3dlZCBieSAqbG93ZXJjYXNlKiBhLWYsIHNvIHdlJ2xsIHRha2UgdGhhdFxuLy8gYXBwcm9hY2ggZm9yIGV2ZXJ5dGhpbmcgZnJvbSBiYXNlLTExIHRvIGJhc2UtMTY6XG5mb3IgKHZhciBpID0gMTE7IGkgPD0gMTY7IGkrKykge1xuICAgIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tpXSA9IGJhc2VzLk5VTUVSQUxTICsgYmFzZXMuTEVUVEVSU19MT1dFUkNBU0Uuc3Vic3RyKDAsIGkgLSAxMCk7XG59XG5cbi8vIFdlIGFsc28gbW9kZWwgYmFzZS0zNiBvZmYgb2YgdGhhdCwganVzdCB1c2luZyB0aGUgZnVsbCBsZXR0ZXIgYWxwaGFiZXQ6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbMzZdID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRTtcblxuLy8gQW5kIGJhc2UtNjIgd2lsbCBiZSB0aGUgdXBwZXJjYXNlIGxldHRlcnMgYWRkZWQ6XG5iYXNlcy5LTk9XTl9BTFBIQUJFVFNbNjJdID0gYmFzZXMuTlVNRVJBTFMgKyBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRSArIGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFO1xuXG4vLyBGb3IgYmFzZS0yNiwgd2UnbGwgYXNzdW1lIHRoZSB1c2VyIHdhbnRzIGp1c3QgdGhlIGxldHRlciBhbHBoYWJldDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1syNl0gPSBiYXNlcy5MRVRURVJTX0xPV0VSQ0FTRTtcblxuLy8gV2UnbGwgYWxzbyBhZGQgYSBzaW1pbGFyIGJhc2UtNTIsIGp1c3QgbGV0dGVycywgbG93ZXJjYXNlIHRoZW4gdXBwZXJjYXNlOlxuYmFzZXMuS05PV05fQUxQSEFCRVRTWzUyXSA9IGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTEVUVEVSU19VUFBFUkNBU0U7XG5cbi8vIEJhc2UtNjQgaXMgYSBmb3JtYWxseS1zcGVjaWZpZWQgYWxwaGFiZXQgdGhhdCBoYXMgYSBwYXJ0aWN1bGFyIG9yZGVyOlxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQgKGFuZCBOb2RlLmpzIGZvbGxvd3MgdGhpcyB0b28pXG4vLyBUT0RPIEZJWE1FIEJ1dCBvdXIgY29kZSBhYm92ZSBkb2Vzbid0IGFkZCBwYWRkaW5nISBEb24ndCB1c2UgdGhpcyB5ZXQuLi5cbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s2NF0gPSBiYXNlcy5MRVRURVJTX1VQUEVSQ0FTRSArIGJhc2VzLkxFVFRFUlNfTE9XRVJDQVNFICsgYmFzZXMuTlVNRVJBTFMgKyAnKy8nO1xuXG4vLyBGbGlja3IgYW5kIG90aGVycyBhbHNvIGhhdmUgYSBiYXNlLTU4IHRoYXQgcmVtb3ZlcyBjb25mdXNpbmcgY2hhcmFjdGVycywgYnV0XG4vLyB0aGVyZSBpc24ndCBjb25zZW5zdXMgb24gdGhlIG9yZGVyIG9mIGxvd2VyY2FzZSB2cy4gdXBwZXJjYXNlLi4uID0vXG4vLyBodHRwOi8vd3d3LmZsaWNrci5jb20vZ3JvdXBzL2FwaS9kaXNjdXNzLzcyMTU3NjE2NzEzNzg2MzkyL1xuLy8gaHR0cHM6Ly9lbi5iaXRjb2luLml0L3dpa2kvQmFzZTU4Q2hlY2tfZW5jb2RpbmcjQmFzZTU4X3N5bWJvbF9jaGFydFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvdWdhbC9iYXNlNTgvYmxvYi9tYXN0ZXIvbGliL2Jhc2U1OC5yYlxuLy8gaHR0cDovL2ljb2xvbWEuYmxvZ3Nwb3QuY29tLzIwMTAvMDMvY3JlYXRlLXlvdXItb3duLWJpdGx5LXVzaW5nLWJhc2U1OC5odG1sXG4vLyBXZSdsbCBhcmJpdHJhcmlseSBzdGF5IGNvbnNpc3RlbnQgd2l0aCB0aGUgYWJvdmUgYW5kIHVzaW5nIGxvd2VyY2FzZSBmaXJzdDpcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1s1OF0gPSBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbNjJdLnJlcGxhY2UoL1swT2xJXS9nLCAnJyk7XG5cbi8vIEFuZCBEb3VnbGFzIENyb2NrZm9yZCBzaGFyZWQgYSBzaW1pbGFyIGJhc2UtMzIgZnJvbSBiYXNlLTM2OlxuLy8gaHR0cDovL3d3dy5jcm9ja2ZvcmQuY29tL3dybWcvYmFzZTMyLmh0bWxcbi8vIFVubGlrZSBvdXIgYmFzZS0zNiwgaGUgZXhwbGljaXRseSBzcGVjaWZpZXMgdXBwZXJjYXNlIGxldHRlcnNcbmJhc2VzLktOT1dOX0FMUEhBQkVUU1szMl0gPSBiYXNlcy5OVU1FUkFMUyArIGJhc2VzLkxFVFRFUlNfVVBQRVJDQVNFLnJlcGxhY2UoL1tJTE9VXS9nLCAnJyk7XG5cbi8vIENsb3N1cmUgaGVscGVyIGZvciBjb252ZW5pZW5jZSBhbGlhc2VzIGxpa2UgYmFzZXMudG9CYXNlMzYoKTpcbmZ1bmN0aW9uIG1ha2VBbGlhcyAoYmFzZSwgYWxwaGFiZXQpIHtcbiAgICBiYXNlc1sndG9CYXNlJyArIGJhc2VdID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICByZXR1cm4gYmFzZXMudG9BbHBoYWJldChudW0sIGFscGhhYmV0KTtcbiAgICB9O1xuICAgIGJhc2VzWydmcm9tQmFzZScgKyBiYXNlXSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIGJhc2VzLmZyb21BbHBoYWJldChzdHIsIGFscGhhYmV0KTtcbiAgICB9O1xufVxuXG4vLyBEbyB0aGlzIGZvciBhbGwga25vd24gYWxwaGFiZXRzOlxuZm9yICh2YXIgYmFzZSBpbiBiYXNlcy5LTk9XTl9BTFBIQUJFVFMpIHtcbiAgICBpZiAoYmFzZXMuS05PV05fQUxQSEFCRVRTLmhhc093blByb3BlcnR5KGJhc2UpKSB7XG4gICAgICAgIG1ha2VBbGlhcyhiYXNlLCBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbYmFzZV0pO1xuICAgIH1cbn1cblxuLy8gQW5kIGEgZ2VuZXJpYyBhbGlhcyB0b286XG5iYXNlcy50b0Jhc2UgPSBmdW5jdGlvbiAobnVtLCBiYXNlKSB7XG4gICAgcmV0dXJuIGJhc2VzLnRvQWxwaGFiZXQobnVtLCBiYXNlcy5LTk9XTl9BTFBIQUJFVFNbYmFzZV0pO1xufTtcblxuYmFzZXMuZnJvbUJhc2UgPSBmdW5jdGlvbiAoc3RyLCBiYXNlKSB7XG4gICAgcmV0dXJuIGJhc2VzLmZyb21BbHBoYWJldChzdHIsIGJhc2VzLktOT1dOX0FMUEhBQkVUU1tiYXNlXSk7XG59O1xuIiwiLy8gIEltcG9ydCBzdXBwb3J0IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEzNjczMzQ2L3N1cHBvcnRpbmctYm90aC1jb21tb25qcy1hbmQtYW1kXG4oZnVuY3Rpb24obmFtZSwgZGVmaW5pdGlvbikge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKSB7IG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpOyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSBcIm9iamVjdFwiKSB7IGRlZmluZShkZWZpbml0aW9uKTsgfVxuICAgIGVsc2UgeyB0aGlzW25hbWVdID0gZGVmaW5pdGlvbigpOyB9XG59KFwiY2xpcGJvYXJkXCIsIGZ1bmN0aW9uKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCAhZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGNsaXBib2FyZCA9IHt9O1xuXG4gIGNsaXBib2FyZC5jb3B5ID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgdmFyIF9kYXRhID0gbnVsbDsgLy8gTWFwIGZyb20gZGF0YSB0eXBlIChlLmcuIFwidGV4dC9odG1sXCIpIHRvIHZhbHVlLlxuICAgIHZhciBfYm9ndXNTZWxlY3Rpb24gPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgICBfZGF0YSA9IG51bGw7XG4gICAgICBpZiAoX2JvZ3VzU2VsZWN0aW9uKSB7XG4gICAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjb3B5XCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChfaW50ZXJjZXB0KSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBfZGF0YSkge1xuICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKGtleSwgX2RhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV29ya2Fyb3VuZCBmb3IgU2FmYXJpOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTU2NTI5XG4gICAgZnVuY3Rpb24gYm9ndXNTZWxlY3QoKSB7XG4gICAgICB2YXIgc2VsID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAvLyBJZiBcIm5vdGhpbmdcIiBpcyBzZWxlY3RlZC4uLlxuICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeUNvbW1hbmRFbmFibGVkKFwiY29weVwiKSAmJiBzZWwuaXNDb2xsYXBzZWQpIHtcbiAgICAgICAgLy8gLi4uIHRlbXBvcmFyaWx5IHNlbGVjdCB0aGUgZW50aXJlIGJvZHkuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdlIHNlbGVjdCB0aGUgZW50aXJlIGJvZHkgYmVjYXVzZTpcbiAgICAgICAgLy8gLSBpdCdzIGd1YXJhbnRlZWQgdG8gZXhpc3QsXG4gICAgICAgIC8vIC0gaXQgd29ya3MgKHVubGlrZSwgc2F5LCBkb2N1bWVudC5oZWFkLCBvciBwaGFudG9tIGVsZW1lbnQgdGhhdCBpc1xuICAgICAgICAvLyAgIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET00pLFxuICAgICAgICAvLyAtIGl0IGRvZXNuJ3Qgc2VlbSB0byBmbGlja2VyIChkdWUgdG8gdGhlIHN5bmNocm9ub3VzIGNvcHkgZXZlbnQpLCBhbmRcbiAgICAgICAgLy8gLSBpdCBhdm9pZHMgbW9kaWZ5aW5nIHRoZSBET00gKGNhbiB0cmlnZ2VyIG11dGF0aW9uIG9ic2VydmVycykuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEJlY2F1c2Ugd2UgY2FuJ3QgZG8gcHJvcGVyIGZlYXR1cmUgZGV0ZWN0aW9uICh3ZSBhbHJlYWR5IGNoZWNrZWRcbiAgICAgICAgLy8gZG9jdW1lbnQucXVlcnlDb21tYW5kRW5hYmxlZChcImNvcHlcIikgLCB3aGljaCBhY3R1YWxseSBnaXZlcyBhIGZhbHNlXG4gICAgICAgIC8vIG5lZ2F0aXZlIGZvciBCbGluayB3aGVuIG5vdGhpbmcgaXMgc2VsZWN0ZWQpIGFuZCBVQSBzbmlmZmluZyBpcyBub3RcbiAgICAgICAgLy8gcmVsaWFibGUgKGEgbG90IG9mIFVBIHN0cmluZ3MgY29udGFpbiBcIlNhZmFyaVwiKSwgdGhpcyB3aWxsIGFsc29cbiAgICAgICAgLy8gaGFwcGVuIGZvciBzb21lIGJyb3dzZXJzIG90aGVyIHRoYW4gU2FmYXJpLiA6LSgpXG4gICAgICAgIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xuICAgICAgICBfYm9ndXNTZWxlY3Rpb24gPSB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBfaW50ZXJjZXB0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgX2RhdGEgPSB7XCJ0ZXh0L3BsYWluXCI6IGRhdGF9O1xuICAgICAgICB9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgICAgX2RhdGEgPSB7XCJ0ZXh0L2h0bWxcIjogbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhkYXRhKX07XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIE9iamVjdCl7XG4gICAgICAgICAgX2RhdGEgPSBkYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChcIkludmFsaWQgZGF0YSB0eXBlLiBNdXN0IGJlIHN0cmluZywgRE9NIG5vZGUsIG9yIGFuIG9iamVjdCBtYXBwaW5nIE1JTUUgdHlwZXMgdG8gc3RyaW5ncy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJDb3B5KHRyeUJvZ3VzU2VsZWN0KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIikpIHtcbiAgICAgICAgICAgICAgLy8gZG9jdW1lbnQuZXhlY0NvbW1hbmQgaXMgc3luY2hyb25vdXM6IGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtY2xpcGJvYXJkLWFwaXMtMjAxNTA0MjEvI2ludGVncmF0aW9uLXdpdGgtcmljaC10ZXh0LWVkaXRpbmctYXBpc1xuICAgICAgICAgICAgICAvLyBTbyB3ZSBjYW4gY2FsbCByZXNvbHZlKCkgYmFjayBoZXJlLlxuICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoIXRyeUJvZ3VzU2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgYm9ndXNTZWxlY3QoKTtcbiAgICAgICAgICAgICAgICB0cmlnZ2VyQ29weSh0cnVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNvcHkuIFBlcmhhcHMgaXQncyBub3QgYXZhaWxhYmxlIGluIHlvdXIgYnJvd3Nlcj9cIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRyaWdnZXJDb3B5KGZhbHNlKTtcblxuICAgICAgfSk7XG4gICAgfTtcbiAgfSkoKTtcblxuICBjbGlwYm9hcmQucGFzdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICB2YXIgX3Jlc29sdmU7XG4gICAgdmFyIF9kYXRhVHlwZTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoX2ludGVyY2VwdCkge1xuICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHJlc29sdmUgPSBfcmVzb2x2ZTtcbiAgICAgICAgX3Jlc29sdmUgPSBudWxsO1xuICAgICAgICByZXNvbHZlKGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKF9kYXRhVHlwZSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGFUeXBlKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIF9pbnRlcmNlcHQgPSB0cnVlO1xuICAgICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIF9kYXRhVHlwZSA9IGRhdGFUeXBlIHx8IFwidGV4dC9wbGFpblwiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICghZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJwYXN0ZVwiKSkge1xuICAgICAgICAgICAgX2ludGVyY2VwdCA9IGZhbHNlO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlVuYWJsZSB0byBwYXN0ZS4gUGFzdGluZyBvbmx5IHdvcmtzIGluIEludGVybmV0IEV4cGxvcmVyIGF0IHRoZSBtb21lbnQuXCIpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgLy8gSGFuZGxlIElFIGJlaGF2aW91ci5cbiAgaWYgKHR5cGVvZiBDbGlwYm9hcmRFdmVudCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIHdpbmRvdy5jbGlwYm9hcmREYXRhICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2Ygd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgLyohIHByb21pc2UtcG9seWZpbGwgMi4wLjEgKi9cbiAgICAoZnVuY3Rpb24oYSl7ZnVuY3Rpb24gYihhLGIpe3JldHVybiBmdW5jdGlvbigpe2EuYXBwbHkoYixhcmd1bWVudHMpfX1mdW5jdGlvbiBjKGEpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiB0aGlzKXRocm93IG5ldyBUeXBlRXJyb3IoXCJQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXdcIik7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwibm90IGEgZnVuY3Rpb25cIik7dGhpcy5fc3RhdGU9bnVsbCx0aGlzLl92YWx1ZT1udWxsLHRoaXMuX2RlZmVycmVkcz1bXSxpKGEsYihlLHRoaXMpLGIoZix0aGlzKSl9ZnVuY3Rpb24gZChhKXt2YXIgYj10aGlzO3JldHVybiBudWxsPT09dGhpcy5fc3RhdGU/dm9pZCB0aGlzLl9kZWZlcnJlZHMucHVzaChhKTp2b2lkIGooZnVuY3Rpb24oKXt2YXIgYz1iLl9zdGF0ZT9hLm9uRnVsZmlsbGVkOmEub25SZWplY3RlZDtpZihudWxsPT09YylyZXR1cm4gdm9pZChiLl9zdGF0ZT9hLnJlc29sdmU6YS5yZWplY3QpKGIuX3ZhbHVlKTt2YXIgZDt0cnl7ZD1jKGIuX3ZhbHVlKX1jYXRjaChlKXtyZXR1cm4gdm9pZCBhLnJlamVjdChlKX1hLnJlc29sdmUoZCl9KX1mdW5jdGlvbiBlKGEpe3RyeXtpZihhPT09dGhpcyl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQSBwcm9taXNlIGNhbm5vdCBiZSByZXNvbHZlZCB3aXRoIGl0c2VsZi5cIik7aWYoYSYmKFwib2JqZWN0XCI9PXR5cGVvZiBhfHxcImZ1bmN0aW9uXCI9PXR5cGVvZiBhKSl7dmFyIGM9YS50aGVuO2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGMpcmV0dXJuIHZvaWQgaShiKGMsYSksYihlLHRoaXMpLGIoZix0aGlzKSl9dGhpcy5fc3RhdGU9ITAsdGhpcy5fdmFsdWU9YSxnLmNhbGwodGhpcyl9Y2F0Y2goZCl7Zi5jYWxsKHRoaXMsZCl9fWZ1bmN0aW9uIGYoYSl7dGhpcy5fc3RhdGU9ITEsdGhpcy5fdmFsdWU9YSxnLmNhbGwodGhpcyl9ZnVuY3Rpb24gZygpe2Zvcih2YXIgYT0wLGI9dGhpcy5fZGVmZXJyZWRzLmxlbmd0aDtiPmE7YSsrKWQuY2FsbCh0aGlzLHRoaXMuX2RlZmVycmVkc1thXSk7dGhpcy5fZGVmZXJyZWRzPW51bGx9ZnVuY3Rpb24gaChhLGIsYyxkKXt0aGlzLm9uRnVsZmlsbGVkPVwiZnVuY3Rpb25cIj09dHlwZW9mIGE/YTpudWxsLHRoaXMub25SZWplY3RlZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBiP2I6bnVsbCx0aGlzLnJlc29sdmU9Yyx0aGlzLnJlamVjdD1kfWZ1bmN0aW9uIGkoYSxiLGMpe3ZhciBkPSExO3RyeXthKGZ1bmN0aW9uKGEpe2R8fChkPSEwLGIoYSkpfSxmdW5jdGlvbihhKXtkfHwoZD0hMCxjKGEpKX0pfWNhdGNoKGUpe2lmKGQpcmV0dXJuO2Q9ITAsYyhlKX19dmFyIGo9Yy5pbW1lZGlhdGVGbnx8XCJmdW5jdGlvblwiPT10eXBlb2Ygc2V0SW1tZWRpYXRlJiZzZXRJbW1lZGlhdGV8fGZ1bmN0aW9uKGEpe3NldFRpbWVvdXQoYSwxKX0saz1BcnJheS5pc0FycmF5fHxmdW5jdGlvbihhKXtyZXR1cm5cIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSl9O2MucHJvdG90eXBlW1wiY2F0Y2hcIl09ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMudGhlbihudWxsLGEpfSxjLnByb3RvdHlwZS50aGVuPWZ1bmN0aW9uKGEsYil7dmFyIGU9dGhpcztyZXR1cm4gbmV3IGMoZnVuY3Rpb24oYyxmKXtkLmNhbGwoZSxuZXcgaChhLGIsYyxmKSl9KX0sYy5hbGw9ZnVuY3Rpb24oKXt2YXIgYT1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCgxPT09YXJndW1lbnRzLmxlbmd0aCYmayhhcmd1bWVudHNbMF0pP2FyZ3VtZW50c1swXTphcmd1bWVudHMpO3JldHVybiBuZXcgYyhmdW5jdGlvbihiLGMpe2Z1bmN0aW9uIGQoZixnKXt0cnl7aWYoZyYmKFwib2JqZWN0XCI9PXR5cGVvZiBnfHxcImZ1bmN0aW9uXCI9PXR5cGVvZiBnKSl7dmFyIGg9Zy50aGVuO2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGgpcmV0dXJuIHZvaWQgaC5jYWxsKGcsZnVuY3Rpb24oYSl7ZChmLGEpfSxjKX1hW2ZdPWcsMD09PS0tZSYmYihhKX1jYXRjaChpKXtjKGkpfX1pZigwPT09YS5sZW5ndGgpcmV0dXJuIGIoW10pO2Zvcih2YXIgZT1hLmxlbmd0aCxmPTA7ZjxhLmxlbmd0aDtmKyspZChmLGFbZl0pfSl9LGMucmVzb2x2ZT1mdW5jdGlvbihhKXtyZXR1cm4gYSYmXCJvYmplY3RcIj09dHlwZW9mIGEmJmEuY29uc3RydWN0b3I9PT1jP2E6bmV3IGMoZnVuY3Rpb24oYil7YihhKX0pfSxjLnJlamVjdD1mdW5jdGlvbihhKXtyZXR1cm4gbmV3IGMoZnVuY3Rpb24oYixjKXtjKGEpfSl9LGMucmFjZT1mdW5jdGlvbihhKXtyZXR1cm4gbmV3IGMoZnVuY3Rpb24oYixjKXtmb3IodmFyIGQ9MCxlPWEubGVuZ3RoO2U+ZDtkKyspYVtkXS50aGVuKGIsYyl9KX0sXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSYmbW9kdWxlLmV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9YzphLlByb21pc2V8fChhLlByb21pc2U9Yyl9KSh0aGlzKTtcblxuICAgIGNsaXBib2FyZC5jb3B5ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBJRSBzdXBwb3J0cyBzdHJpbmcgYW5kIFVSTCB0eXBlczogaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzNjc0NCh2PXZzLjg1KS5hc3B4XG4gICAgICAgIC8vIFdlIG9ubHkgc3VwcG9ydCB0aGUgc3RyaW5nIHR5cGUgZm9yIG5vdy5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiICYmICEoXCJ0ZXh0L3BsYWluXCIgaW4gZGF0YSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBwcm92aWRlIGEgdGV4dC9wbGFpbiB0eXBlLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHJEYXRhID0gKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiID8gZGF0YSA6IGRhdGFbXCJ0ZXh0L3BsYWluXCJdKTtcbiAgICAgICAgdmFyIGNvcHlTdWNjZWVkZWQgPSB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhKFwiVGV4dFwiLCBzdHJEYXRhKTtcbiAgICAgICAgaWYgKGNvcHlTdWNjZWVkZWQpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcHlpbmcgd2FzIHJlamVjdGVkLlwiKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjbGlwYm9hcmQucGFzdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHN0ckRhdGEgPSB3aW5kb3cuY2xpcGJvYXJkRGF0YS5nZXREYXRhKFwiVGV4dFwiKTtcbiAgICAgICAgaWYgKHN0ckRhdGEpIHtcbiAgICAgICAgICByZXNvbHZlKHN0ckRhdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIHJlamVjdGVkIHRoZSBwYXN0ZSByZXF1ZXN0LlxuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJQYXN0aW5nIHdhcyByZWplY3RlZC5cIikpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGNsaXBib2FyZDtcbn0pKTtcbiIsIi8qQGxpY2Vuc2Vcblx0UGFwYSBQYXJzZVxuXHR2NC40LjBcblx0aHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZVxuXHRMaWNlbnNlOiBNSVRcbiovXG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSlcbntcblx0LyogZ2xvYmFscyBkZWZpbmUgKi9cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0e1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJylcblx0e1xuXHRcdC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuXHRcdC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuXHRcdC8vIGxpa2UgTm9kZS5cblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuXHRcdHJvb3QuUGFwYSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbigpXG57XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgZ2xvYmFsID0gKGZ1bmN0aW9uKCkge1xuXHRcdC8vIGFsdGVybmF0aXZlIG1ldGhvZCwgc2ltaWxhciB0byBgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKWBcblx0XHQvLyBidXQgd2l0aG91dCB1c2luZyBgZXZhbGAgKHdoaWNoIGlzIGRpc2FibGVkIHdoZW5cblx0XHQvLyB1c2luZyBDb250ZW50IFNlY3VyaXR5IFBvbGljeSkuXG5cblx0XHRpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBzZWxmOyB9XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiB3aW5kb3c7IH1cblx0XHRpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGdsb2JhbDsgfVxuXG5cdFx0Ly8gV2hlbiBydW5uaW5nIHRlc3RzIG5vbmUgb2YgdGhlIGFib3ZlIGhhdmUgYmVlbiBkZWZpbmVkXG5cdFx0cmV0dXJuIHt9O1xuXHR9KSgpO1xuXG5cblx0dmFyIElTX1dPUktFUiA9ICFnbG9iYWwuZG9jdW1lbnQgJiYgISFnbG9iYWwucG9zdE1lc3NhZ2UsXG5cdFx0SVNfUEFQQV9XT1JLRVIgPSBJU19XT1JLRVIgJiYgLyhcXD98JilwYXBhd29ya2VyKD18JnwkKS8udGVzdChnbG9iYWwubG9jYXRpb24uc2VhcmNoKSxcblx0XHRMT0FERURfU1lOQyA9IGZhbHNlLCBBVVRPX1NDUklQVF9QQVRIO1xuXHR2YXIgd29ya2VycyA9IHt9LCB3b3JrZXJJZENvdW50ZXIgPSAwO1xuXG5cdHZhciBQYXBhID0ge307XG5cblx0UGFwYS5wYXJzZSA9IENzdlRvSnNvbjtcblx0UGFwYS51bnBhcnNlID0gSnNvblRvQ3N2O1xuXG5cdFBhcGEuUkVDT1JEX1NFUCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApO1xuXHRQYXBhLlVOSVRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMSk7XG5cdFBhcGEuQllURV9PUkRFUl9NQVJLID0gJ1xcdWZlZmYnO1xuXHRQYXBhLkJBRF9ERUxJTUlURVJTID0gWydcXHInLCAnXFxuJywgJ1wiJywgUGFwYS5CWVRFX09SREVSX01BUktdO1xuXHRQYXBhLldPUktFUlNfU1VQUE9SVEVEID0gIUlTX1dPUktFUiAmJiAhIWdsb2JhbC5Xb3JrZXI7XG5cdFBhcGEuU0NSSVBUX1BBVEggPSBudWxsO1x0Ly8gTXVzdCBiZSBzZXQgYnkgeW91ciBjb2RlIGlmIHlvdSB1c2Ugd29ya2VycyBhbmQgdGhpcyBsaWIgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5XG5cblx0Ly8gQ29uZmlndXJhYmxlIGNodW5rIHNpemVzIGZvciBsb2NhbCBhbmQgcmVtb3RlIGZpbGVzLCByZXNwZWN0aXZlbHlcblx0UGFwYS5Mb2NhbENodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogMTA7XHQvLyAxMCBNQlxuXHRQYXBhLlJlbW90ZUNodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogNTtcdC8vIDUgTUJcblx0UGFwYS5EZWZhdWx0RGVsaW1pdGVyID0gJywnO1x0XHRcdC8vIFVzZWQgaWYgbm90IHNwZWNpZmllZCBhbmQgZGV0ZWN0aW9uIGZhaWxzXG5cblx0Ly8gRXhwb3NlZCBmb3IgdGVzdGluZyBhbmQgZGV2ZWxvcG1lbnQgb25seVxuXHRQYXBhLlBhcnNlciA9IFBhcnNlcjtcblx0UGFwYS5QYXJzZXJIYW5kbGUgPSBQYXJzZXJIYW5kbGU7XG5cdFBhcGEuTmV0d29ya1N0cmVhbWVyID0gTmV0d29ya1N0cmVhbWVyO1xuXHRQYXBhLkZpbGVTdHJlYW1lciA9IEZpbGVTdHJlYW1lcjtcblx0UGFwYS5TdHJpbmdTdHJlYW1lciA9IFN0cmluZ1N0cmVhbWVyO1xuXHRQYXBhLlJlYWRhYmxlU3RyZWFtU3RyZWFtZXIgPSBSZWFkYWJsZVN0cmVhbVN0cmVhbWVyO1xuXG5cdGlmIChnbG9iYWwualF1ZXJ5KVxuXHR7XG5cdFx0dmFyICQgPSBnbG9iYWwualF1ZXJ5O1xuXHRcdCQuZm4ucGFyc2UgPSBmdW5jdGlvbihvcHRpb25zKVxuXHRcdHtcblx0XHRcdHZhciBjb25maWcgPSBvcHRpb25zLmNvbmZpZyB8fCB7fTtcblx0XHRcdHZhciBxdWV1ZSA9IFtdO1xuXG5cdFx0XHR0aGlzLmVhY2goZnVuY3Rpb24oaWR4KVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgc3VwcG9ydGVkID0gJCh0aGlzKS5wcm9wKCd0YWdOYW1lJykudG9VcHBlckNhc2UoKSA9PT0gJ0lOUFVUJ1xuXHRcdFx0XHRcdFx0XHRcdCYmICQodGhpcykuYXR0cigndHlwZScpLnRvTG93ZXJDYXNlKCkgPT09ICdmaWxlJ1xuXHRcdFx0XHRcdFx0XHRcdCYmIGdsb2JhbC5GaWxlUmVhZGVyO1xuXG5cdFx0XHRcdGlmICghc3VwcG9ydGVkIHx8ICF0aGlzLmZpbGVzIHx8IHRoaXMuZmlsZXMubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1x0Ly8gY29udGludWUgdG8gbmV4dCBpbnB1dCBlbGVtZW50XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbGVzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cXVldWUucHVzaCh7XG5cdFx0XHRcdFx0XHRmaWxlOiB0aGlzLmZpbGVzW2ldLFxuXHRcdFx0XHRcdFx0aW5wdXRFbGVtOiB0aGlzLFxuXHRcdFx0XHRcdFx0aW5zdGFuY2VDb25maWc6ICQuZXh0ZW5kKHt9LCBjb25maWcpXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRwYXJzZU5leHRGaWxlKCk7XHQvLyBiZWdpbiBwYXJzaW5nXG5cdFx0XHRyZXR1cm4gdGhpcztcdFx0Ly8gbWFpbnRhaW5zIGNoYWluYWJpbGl0eVxuXG5cblx0XHRcdGZ1bmN0aW9uIHBhcnNlTmV4dEZpbGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocXVldWUubGVuZ3RoID09PSAwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGlzRnVuY3Rpb24ob3B0aW9ucy5jb21wbGV0ZSkpXG5cdFx0XHRcdFx0XHRvcHRpb25zLmNvbXBsZXRlKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGYgPSBxdWV1ZVswXTtcblxuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmJlZm9yZSkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcmV0dXJuZWQgPSBvcHRpb25zLmJlZm9yZShmLmZpbGUsIGYuaW5wdXRFbGVtKTtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgcmV0dXJuZWQgPT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChyZXR1cm5lZC5hY3Rpb24gPT09ICdhYm9ydCcpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGVycm9yKCdBYm9ydEVycm9yJywgZi5maWxlLCBmLmlucHV0RWxlbSwgcmV0dXJuZWQucmVhc29uKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1x0Ly8gQWJvcnRzIGFsbCBxdWV1ZWQgZmlsZXMgaW1tZWRpYXRlbHlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgaWYgKHJldHVybmVkLmFjdGlvbiA9PT0gJ3NraXAnKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcdC8vIHBhcnNlIHRoZSBuZXh0IGZpbGUgaW4gdGhlIHF1ZXVlLCBpZiBhbnlcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJldHVybmVkLmNvbmZpZyA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0XHRcdGYuaW5zdGFuY2VDb25maWcgPSAkLmV4dGVuZChmLmluc3RhbmNlQ29uZmlnLCByZXR1cm5lZC5jb25maWcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChyZXR1cm5lZCA9PT0gJ3NraXAnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1x0Ly8gcGFyc2UgdGhlIG5leHQgZmlsZSBpbiB0aGUgcXVldWUsIGlmIGFueVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFdyYXAgdXAgdGhlIHVzZXIncyBjb21wbGV0ZSBjYWxsYmFjaywgaWYgYW55LCBzbyB0aGF0IG91cnMgYWxzbyBnZXRzIGV4ZWN1dGVkXG5cdFx0XHRcdHZhciB1c2VyQ29tcGxldGVGdW5jID0gZi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZTtcblx0XHRcdFx0Zi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZSA9IGZ1bmN0aW9uKHJlc3VsdHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbih1c2VyQ29tcGxldGVGdW5jKSlcblx0XHRcdFx0XHRcdHVzZXJDb21wbGV0ZUZ1bmMocmVzdWx0cywgZi5maWxlLCBmLmlucHV0RWxlbSk7XG5cdFx0XHRcdFx0ZmlsZUNvbXBsZXRlKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0UGFwYS5wYXJzZShmLmZpbGUsIGYuaW5zdGFuY2VDb25maWcpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBlcnJvcihuYW1lLCBmaWxlLCBlbGVtLCByZWFzb24pXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuZXJyb3IpKVxuXHRcdFx0XHRcdG9wdGlvbnMuZXJyb3Ioe25hbWU6IG5hbWV9LCBmaWxlLCBlbGVtLCByZWFzb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBmaWxlQ29tcGxldGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRxdWV1ZS5zcGxpY2UoMCwgMSk7XG5cdFx0XHRcdHBhcnNlTmV4dEZpbGUoKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblxuXHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdHtcblx0XHRnbG9iYWwub25tZXNzYWdlID0gd29ya2VyVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHR9XG5cdGVsc2UgaWYgKFBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdHtcblx0XHRBVVRPX1NDUklQVF9QQVRIID0gZ2V0U2NyaXB0UGF0aCgpO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIHNjcmlwdCB3YXMgbG9hZGVkIHN5bmNocm9ub3VzbHlcblx0XHRpZiAoIWRvY3VtZW50LmJvZHkpXG5cdFx0e1xuXHRcdFx0Ly8gQm9keSBkb2Vzbid0IGV4aXN0IHlldCwgbXVzdCBiZSBzeW5jaHJvbm91c1xuXHRcdFx0TE9BREVEX1NZTkMgPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRMT0FERURfU1lOQyA9IHRydWU7XG5cdFx0XHR9LCB0cnVlKTtcblx0XHR9XG5cdH1cblxuXG5cblxuXHRmdW5jdGlvbiBDc3ZUb0pzb24oX2lucHV0LCBfY29uZmlnKVxuXHR7XG5cdFx0X2NvbmZpZyA9IF9jb25maWcgfHwge307XG5cdFx0dmFyIGR5bmFtaWNUeXBpbmcgPSBfY29uZmlnLmR5bmFtaWNUeXBpbmcgfHwgZmFsc2U7XG5cdFx0aWYgKGlzRnVuY3Rpb24oZHluYW1pY1R5cGluZykpIHtcblx0XHRcdF9jb25maWcuZHluYW1pY1R5cGluZ0Z1bmN0aW9uID0gZHluYW1pY1R5cGluZztcblx0XHRcdC8vIFdpbGwgYmUgZmlsbGVkIG9uIGZpcnN0IHJvdyBjYWxsXG5cdFx0XHRkeW5hbWljVHlwaW5nID0ge307XG5cdFx0fVxuXHRcdF9jb25maWcuZHluYW1pY1R5cGluZyA9IGR5bmFtaWNUeXBpbmc7XG5cblx0XHRpZiAoX2NvbmZpZy53b3JrZXIgJiYgUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHR7XG5cdFx0XHR2YXIgdyA9IG5ld1dvcmtlcigpO1xuXG5cdFx0XHR3LnVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0dy51c2VyQ2h1bmsgPSBfY29uZmlnLmNodW5rO1xuXHRcdFx0dy51c2VyQ29tcGxldGUgPSBfY29uZmlnLmNvbXBsZXRlO1xuXHRcdFx0dy51c2VyRXJyb3IgPSBfY29uZmlnLmVycm9yO1xuXG5cdFx0XHRfY29uZmlnLnN0ZXAgPSBpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCk7XG5cdFx0XHRfY29uZmlnLmNodW5rID0gaXNGdW5jdGlvbihfY29uZmlnLmNodW5rKTtcblx0XHRcdF9jb25maWcuY29tcGxldGUgPSBpc0Z1bmN0aW9uKF9jb25maWcuY29tcGxldGUpO1xuXHRcdFx0X2NvbmZpZy5lcnJvciA9IGlzRnVuY3Rpb24oX2NvbmZpZy5lcnJvcik7XG5cdFx0XHRkZWxldGUgX2NvbmZpZy53b3JrZXI7XHQvLyBwcmV2ZW50IGluZmluaXRlIGxvb3BcblxuXHRcdFx0dy5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdGlucHV0OiBfaW5wdXQsXG5cdFx0XHRcdGNvbmZpZzogX2NvbmZpZyxcblx0XHRcdFx0d29ya2VySWQ6IHcuaWRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHN0cmVhbWVyID0gbnVsbDtcblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0aWYgKF9jb25maWcuZG93bmxvYWQpXG5cdFx0XHRcdHN0cmVhbWVyID0gbmV3IE5ldHdvcmtTdHJlYW1lcihfY29uZmlnKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0c3RyZWFtZXIgPSBuZXcgU3RyaW5nU3RyZWFtZXIoX2NvbmZpZyk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKF9pbnB1dC5yZWFkYWJsZSA9PT0gdHJ1ZSAmJiBpc0Z1bmN0aW9uKF9pbnB1dC5yZWFkKSAmJiBpc0Z1bmN0aW9uKF9pbnB1dC5vbikpXG5cdFx0e1xuXHRcdFx0c3RyZWFtZXIgPSBuZXcgUmVhZGFibGVTdHJlYW1TdHJlYW1lcihfY29uZmlnKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKGdsb2JhbC5GaWxlICYmIF9pbnB1dCBpbnN0YW5jZW9mIEZpbGUpIHx8IF9pbnB1dCBpbnN0YW5jZW9mIE9iamVjdClcdC8vIC4uLlNhZmFyaS4gKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdFx0c3RyZWFtZXIgPSBuZXcgRmlsZVN0cmVhbWVyKF9jb25maWcpO1xuXG5cdFx0cmV0dXJuIHN0cmVhbWVyLnN0cmVhbShfaW5wdXQpO1xuXHR9XG5cblxuXG5cblxuXG5cdGZ1bmN0aW9uIEpzb25Ub0NzdihfaW5wdXQsIF9jb25maWcpXG5cdHtcblx0XHQvLyBEZWZhdWx0IGNvbmZpZ3VyYXRpb25cblxuXHRcdC8qKiB3aGV0aGVyIHRvIHN1cnJvdW5kIGV2ZXJ5IGRhdHVtIHdpdGggcXVvdGVzICovXG5cdFx0dmFyIF9xdW90ZXMgPSBmYWxzZTtcblxuXHRcdC8qKiB3aGV0aGVyIHRvIHdyaXRlIGhlYWRlcnMgKi9cblx0XHR2YXIgX3dyaXRlSGVhZGVyID0gdHJ1ZTtcblxuXHRcdC8qKiBkZWxpbWl0aW5nIGNoYXJhY3RlciAqL1xuXHRcdHZhciBfZGVsaW1pdGVyID0gJywnO1xuXG5cdFx0LyoqIG5ld2xpbmUgY2hhcmFjdGVyKHMpICovXG5cdFx0dmFyIF9uZXdsaW5lID0gJ1xcclxcbic7XG5cblx0XHQvKiogcXVvdGUgY2hhcmFjdGVyICovXG5cdFx0dmFyIF9xdW90ZUNoYXIgPSAnXCInO1xuXG5cdFx0dW5wYWNrQ29uZmlnKCk7XG5cblx0XHR2YXIgcXVvdGVDaGFyUmVnZXggPSBuZXcgUmVnRXhwKF9xdW90ZUNoYXIsICdnJyk7XG5cblx0XHRpZiAodHlwZW9mIF9pbnB1dCA9PT0gJ3N0cmluZycpXG5cdFx0XHRfaW5wdXQgPSBKU09OLnBhcnNlKF9pbnB1dCk7XG5cblx0XHRpZiAoX2lucHV0IGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0e1xuXHRcdFx0aWYgKCFfaW5wdXQubGVuZ3RoIHx8IF9pbnB1dFswXSBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdFx0XHRyZXR1cm4gc2VyaWFsaXplKG51bGwsIF9pbnB1dCk7XG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgX2lucHV0WzBdID09PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShvYmplY3RLZXlzKF9pbnB1dFswXSksIF9pbnB1dCk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGVvZiBfaW5wdXQgPT09ICdvYmplY3QnKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2YgX2lucHV0LmRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfaW5wdXQuZGF0YSA9IEpTT04ucGFyc2UoX2lucHV0LmRhdGEpO1xuXG5cdFx0XHRpZiAoX2lucHV0LmRhdGEgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFfaW5wdXQuZmllbGRzKVxuXHRcdFx0XHRcdF9pbnB1dC5maWVsZHMgPSAgX2lucHV0Lm1ldGEgJiYgX2lucHV0Lm1ldGEuZmllbGRzO1xuXG5cdFx0XHRcdGlmICghX2lucHV0LmZpZWxkcylcblx0XHRcdFx0XHRfaW5wdXQuZmllbGRzID0gIF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXlcblx0XHRcdFx0XHRcdD8gX2lucHV0LmZpZWxkc1xuXHRcdFx0XHRcdFx0OiBvYmplY3RLZXlzKF9pbnB1dC5kYXRhWzBdKTtcblxuXHRcdFx0XHRpZiAoIShfaW5wdXQuZGF0YVswXSBpbnN0YW5jZW9mIEFycmF5KSAmJiB0eXBlb2YgX2lucHV0LmRhdGFbMF0gIT09ICdvYmplY3QnKVxuXHRcdFx0XHRcdF9pbnB1dC5kYXRhID0gW19pbnB1dC5kYXRhXTtcdC8vIGhhbmRsZXMgaW5wdXQgbGlrZSBbMSwyLDNdIG9yIFsnYXNkZiddXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzZXJpYWxpemUoX2lucHV0LmZpZWxkcyB8fCBbXSwgX2lucHV0LmRhdGEgfHwgW10pO1xuXHRcdH1cblxuXHRcdC8vIERlZmF1bHQgKGFueSB2YWxpZCBwYXRocyBzaG91bGQgcmV0dXJuIGJlZm9yZSB0aGlzKVxuXHRcdHRocm93ICdleGNlcHRpb246IFVuYWJsZSB0byBzZXJpYWxpemUgdW5yZWNvZ25pemVkIGlucHV0JztcblxuXG5cdFx0ZnVuY3Rpb24gdW5wYWNrQ29uZmlnKClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcgIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5kZWxpbWl0ZXIgPT09ICdzdHJpbmcnXG5cdFx0XHRcdCYmIF9jb25maWcuZGVsaW1pdGVyLmxlbmd0aCA9PT0gMVxuXHRcdFx0XHQmJiBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoX2NvbmZpZy5kZWxpbWl0ZXIpID09PSAtMSlcblx0XHRcdHtcblx0XHRcdFx0X2RlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcucXVvdGVzID09PSAnYm9vbGVhbidcblx0XHRcdFx0fHwgX2NvbmZpZy5xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdFx0X3F1b3RlcyA9IF9jb25maWcucXVvdGVzO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcubmV3bGluZSA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdF9uZXdsaW5lID0gX2NvbmZpZy5uZXdsaW5lO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcucXVvdGVDaGFyID09PSAnc3RyaW5nJylcblx0XHRcdFx0X3F1b3RlQ2hhciA9IF9jb25maWcucXVvdGVDaGFyO1xuXG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcuaGVhZGVyID09PSAnYm9vbGVhbicpXG5cdFx0XHRcdF93cml0ZUhlYWRlciA9IF9jb25maWcuaGVhZGVyO1xuXHRcdH1cblxuXG5cdFx0LyoqIFR1cm5zIGFuIG9iamVjdCdzIGtleXMgaW50byBhbiBhcnJheSAqL1xuXHRcdGZ1bmN0aW9uIG9iamVjdEtleXMob2JqKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0dmFyIGtleXMgPSBbXTtcblx0XHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRcdGtleXMucHVzaChrZXkpO1xuXHRcdFx0cmV0dXJuIGtleXM7XG5cdFx0fVxuXG5cdFx0LyoqIFRoZSBkb3VibGUgZm9yIGxvb3AgdGhhdCBpdGVyYXRlcyB0aGUgZGF0YSBhbmQgd3JpdGVzIG91dCBhIENTViBzdHJpbmcgaW5jbHVkaW5nIGhlYWRlciByb3cgKi9cblx0XHRmdW5jdGlvbiBzZXJpYWxpemUoZmllbGRzLCBkYXRhKVxuXHRcdHtcblx0XHRcdHZhciBjc3YgPSAnJztcblxuXHRcdFx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRmaWVsZHMgPSBKU09OLnBhcnNlKGZpZWxkcyk7XG5cdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcblxuXHRcdFx0dmFyIGhhc0hlYWRlciA9IGZpZWxkcyBpbnN0YW5jZW9mIEFycmF5ICYmIGZpZWxkcy5sZW5ndGggPiAwO1xuXHRcdFx0dmFyIGRhdGFLZXllZEJ5RmllbGQgPSAhKGRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheSk7XG5cblx0XHRcdC8vIElmIHRoZXJlIGEgaGVhZGVyIHJvdywgd3JpdGUgaXQgZmlyc3Rcblx0XHRcdGlmIChoYXNIZWFkZXIgJiYgX3dyaXRlSGVhZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChpID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGZpZWxkc1tpXSwgaSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoID4gMClcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoZW4gd3JpdGUgb3V0IHRoZSBkYXRhXG5cdFx0XHRmb3IgKHZhciByb3cgPSAwOyByb3cgPCBkYXRhLmxlbmd0aDsgcm93KyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtYXhDb2wgPSBoYXNIZWFkZXIgPyBmaWVsZHMubGVuZ3RoIDogZGF0YVtyb3ddLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKHZhciBjb2wgPSAwOyBjb2wgPCBtYXhDb2w7IGNvbCsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGNvbCA+IDApXG5cdFx0XHRcdFx0XHRjc3YgKz0gX2RlbGltaXRlcjtcblx0XHRcdFx0XHR2YXIgY29sSWR4ID0gaGFzSGVhZGVyICYmIGRhdGFLZXllZEJ5RmllbGQgPyBmaWVsZHNbY29sXSA6IGNvbDtcblx0XHRcdFx0XHRjc3YgKz0gc2FmZShkYXRhW3Jvd11bY29sSWR4XSwgY29sKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyb3cgPCBkYXRhLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0Y3N2ICs9IF9uZXdsaW5lO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY3N2O1xuXHRcdH1cblxuXHRcdC8qKiBFbmNsb3NlcyBhIHZhbHVlIGFyb3VuZCBxdW90ZXMgaWYgbmVlZGVkIChtYWtlcyBhIHZhbHVlIHNhZmUgZm9yIENTViBpbnNlcnRpb24pICovXG5cdFx0ZnVuY3Rpb24gc2FmZShzdHIsIGNvbClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcgfHwgc3RyID09PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gJyc7XG5cblx0XHRcdHN0ciA9IHN0ci50b1N0cmluZygpLnJlcGxhY2UocXVvdGVDaGFyUmVnZXgsIF9xdW90ZUNoYXIgKyBfcXVvdGVDaGFyKTtcblxuXHRcdFx0dmFyIG5lZWRzUXVvdGVzID0gKHR5cGVvZiBfcXVvdGVzID09PSAnYm9vbGVhbicgJiYgX3F1b3Rlcylcblx0XHRcdFx0XHRcdFx0fHwgKF9xdW90ZXMgaW5zdGFuY2VvZiBBcnJheSAmJiBfcXVvdGVzW2NvbF0pXG5cdFx0XHRcdFx0XHRcdHx8IGhhc0FueShzdHIsIFBhcGEuQkFEX0RFTElNSVRFUlMpXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5pbmRleE9mKF9kZWxpbWl0ZXIpID4gLTFcblx0XHRcdFx0XHRcdFx0fHwgc3RyLmNoYXJBdCgwKSA9PT0gJyAnXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoc3RyLmxlbmd0aCAtIDEpID09PSAnICc7XG5cblx0XHRcdHJldHVybiBuZWVkc1F1b3RlcyA/IF9xdW90ZUNoYXIgKyBzdHIgKyBfcXVvdGVDaGFyIDogc3RyO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGhhc0FueShzdHIsIHN1YnN0cmluZ3MpXG5cdFx0e1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzdHJpbmdzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRpZiAoc3RyLmluZGV4T2Yoc3Vic3RyaW5nc1tpXSkgPiAtMSlcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKiogQ2h1bmtTdHJlYW1lciBpcyB0aGUgYmFzZSBwcm90b3R5cGUgZm9yIHZhcmlvdXMgc3RyZWFtZXIgaW1wbGVtZW50YXRpb25zLiAqL1xuXHRmdW5jdGlvbiBDaHVua1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdHRoaXMuX2hhbmRsZSA9IG51bGw7XG5cdFx0dGhpcy5fZmluaXNoZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9jb21wbGV0ZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9pbnB1dCA9IG51bGw7XG5cdFx0dGhpcy5fYmFzZUluZGV4ID0gMDtcblx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9ICcnO1xuXHRcdHRoaXMuX3Jvd0NvdW50ID0gMDtcblx0XHR0aGlzLl9zdGFydCA9IDA7XG5cdFx0dGhpcy5fbmV4dENodW5rID0gbnVsbDtcblx0XHR0aGlzLmlzRmlyc3RDaHVuayA9IHRydWU7XG5cdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0ge1xuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRlcnJvcnM6IFtdLFxuXHRcdFx0bWV0YToge31cblx0XHR9O1xuXHRcdHJlcGxhY2VDb25maWcuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dGhpcy5wYXJzZUNodW5rID0gZnVuY3Rpb24oY2h1bmssIGlzRmFrZUNodW5rKVxuXHRcdHtcblx0XHRcdC8vIEZpcnN0IGNodW5rIHByZS1wcm9jZXNzaW5nXG5cdFx0XHRpZiAodGhpcy5pc0ZpcnN0Q2h1bmsgJiYgaXNGdW5jdGlvbih0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtb2RpZmllZENodW5rID0gdGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmsoY2h1bmspO1xuXHRcdFx0XHRpZiAobW9kaWZpZWRDaHVuayAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdGNodW5rID0gbW9kaWZpZWRDaHVuaztcblx0XHRcdH1cblx0XHRcdHRoaXMuaXNGaXJzdENodW5rID0gZmFsc2U7XG5cblx0XHRcdC8vIFJlam9pbiB0aGUgbGluZSB3ZSBsaWtlbHkganVzdCBzcGxpdCBpbiB0d28gYnkgY2h1bmtpbmcgdGhlIGZpbGVcblx0XHRcdHZhciBhZ2dyZWdhdGUgPSB0aGlzLl9wYXJ0aWFsTGluZSArIGNodW5rO1xuXHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSAnJztcblxuXHRcdFx0dmFyIHJlc3VsdHMgPSB0aGlzLl9oYW5kbGUucGFyc2UoYWdncmVnYXRlLCB0aGlzLl9iYXNlSW5kZXgsICF0aGlzLl9maW5pc2hlZCk7XG5cblx0XHRcdGlmICh0aGlzLl9oYW5kbGUucGF1c2VkKCkgfHwgdGhpcy5faGFuZGxlLmFib3J0ZWQoKSlcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHR2YXIgbGFzdEluZGV4ID0gcmVzdWx0cy5tZXRhLmN1cnNvcjtcblxuXHRcdFx0aWYgKCF0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSBhZ2dyZWdhdGUuc3Vic3RyaW5nKGxhc3RJbmRleCAtIHRoaXMuX2Jhc2VJbmRleCk7XG5cdFx0XHRcdHRoaXMuX2Jhc2VJbmRleCA9IGxhc3RJbmRleDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5kYXRhKVxuXHRcdFx0XHR0aGlzLl9yb3dDb3VudCArPSByZXN1bHRzLmRhdGEubGVuZ3RoO1xuXG5cdFx0XHR2YXIgZmluaXNoZWRJbmNsdWRpbmdQcmV2aWV3ID0gdGhpcy5fZmluaXNoZWQgfHwgKHRoaXMuX2NvbmZpZy5wcmV2aWV3ICYmIHRoaXMuX3Jvd0NvdW50ID49IHRoaXMuX2NvbmZpZy5wcmV2aWV3KTtcblxuXHRcdFx0aWYgKElTX1BBUEFfV09SS0VSKVxuXHRcdFx0e1xuXHRcdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGZpbmlzaGVkOiBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jaHVuaykgJiYgIWlzRmFrZUNodW5rKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jb25maWcuY2h1bmsocmVzdWx0cywgdGhpcy5faGFuZGxlKTtcblx0XHRcdFx0aWYgKHRoaXMuX2hhbmRsZS5wYXVzZWQoKSB8fCB0aGlzLl9oYW5kbGUuYWJvcnRlZCgpKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0cmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuX2NvbmZpZy5zdGVwICYmICF0aGlzLl9jb25maWcuY2h1bmspIHtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmRhdGEgPSB0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YS5jb25jYXQocmVzdWx0cy5kYXRhKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycyA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMuY29uY2F0KHJlc3VsdHMuZXJyb3JzKTtcblx0XHRcdFx0dGhpcy5fY29tcGxldGVSZXN1bHRzLm1ldGEgPSByZXN1bHRzLm1ldGE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5fY29tcGxldGVkICYmIGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jb21wbGV0ZSkgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEuYWJvcnRlZCkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNvbXBsZXRlKHRoaXMuX2NvbXBsZXRlUmVzdWx0cywgdGhpcy5faW5wdXQpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiAoIXJlc3VsdHMgfHwgIXJlc3VsdHMubWV0YS5wYXVzZWQpKVxuXHRcdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcblxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fTtcblxuXHRcdHRoaXMuX3NlbmRFcnJvciA9IGZ1bmN0aW9uKGVycm9yKVxuXHRcdHtcblx0XHRcdGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5lcnJvcikpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5lcnJvcihlcnJvcik7XG5cdFx0XHRlbHNlIGlmIChJU19QQVBBX1dPUktFUiAmJiB0aGlzLl9jb25maWcuZXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGVycm9yOiBlcnJvcixcblx0XHRcdFx0XHRmaW5pc2hlZDogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHJlcGxhY2VDb25maWcoY29uZmlnKVxuXHRcdHtcblx0XHRcdC8vIERlZXAtY29weSB0aGUgY29uZmlnIHNvIHdlIGNhbiBlZGl0IGl0XG5cdFx0XHR2YXIgY29uZmlnQ29weSA9IGNvcHkoY29uZmlnKTtcblx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gcGFyc2VJbnQoY29uZmlnQ29weS5jaHVua1NpemUpO1x0Ly8gcGFyc2VJbnQgVkVSWSBpbXBvcnRhbnQgc28gd2UgZG9uJ3QgY29uY2F0ZW5hdGUgc3RyaW5ncyFcblx0XHRcdGlmICghY29uZmlnLnN0ZXAgJiYgIWNvbmZpZy5jaHVuaylcblx0XHRcdFx0Y29uZmlnQ29weS5jaHVua1NpemUgPSBudWxsOyAgLy8gZGlzYWJsZSBSYW5nZSBoZWFkZXIgaWYgbm90IHN0cmVhbWluZzsgYmFkIHZhbHVlcyBicmVhayBJSVMgLSBzZWUgaXNzdWUgIzE5NlxuXHRcdFx0dGhpcy5faGFuZGxlID0gbmV3IFBhcnNlckhhbmRsZShjb25maWdDb3B5KTtcblx0XHRcdHRoaXMuX2hhbmRsZS5zdHJlYW1lciA9IHRoaXM7XG5cdFx0XHR0aGlzLl9jb25maWcgPSBjb25maWdDb3B5O1x0Ly8gcGVyc2lzdCB0aGUgY29weSB0byB0aGUgY2FsbGVyXG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiBOZXR3b3JrU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdGlmICghY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdGNvbmZpZy5jaHVua1NpemUgPSBQYXBhLlJlbW90ZUNodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciB4aHI7XG5cblx0XHRpZiAoSVNfV09SS0VSKVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbih1cmwpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSB1cmw7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcdC8vIFN0YXJ0cyBzdHJlYW1pbmdcblx0XHR9O1xuXG5cdFx0dGhpcy5fcmVhZENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy53aXRoQ3JlZGVudGlhbHMpXG5cdFx0XHR7XG5cdFx0XHRcdHhoci53aXRoQ3JlZGVudGlhbHMgPSB0aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIUlTX1dPUktFUilcblx0XHRcdHtcblx0XHRcdFx0eGhyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHhoci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIub3BlbignR0VUJywgdGhpcy5faW5wdXQsICFJU19XT1JLRVIpO1xuXHRcdFx0Ly8gSGVhZGVycyBjYW4gb25seSBiZSBzZXQgd2hlbiBvbmNlIHRoZSByZXF1ZXN0IHN0YXRlIGlzIE9QRU5FRFxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5kb3dubG9hZFJlcXVlc3RIZWFkZXJzKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgaGVhZGVycyA9IHRoaXMuX2NvbmZpZy5kb3dubG9hZFJlcXVlc3RIZWFkZXJzO1xuXG5cdFx0XHRcdGZvciAodmFyIGhlYWRlck5hbWUgaW4gaGVhZGVycylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlck5hbWUsIGhlYWRlcnNbaGVhZGVyTmFtZV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLl9jb25maWcuY2h1bmtTaXplKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZW5kID0gdGhpcy5fc3RhcnQgKyB0aGlzLl9jb25maWcuY2h1bmtTaXplIC0gMTtcdC8vIG1pbnVzIG9uZSBiZWNhdXNlIGJ5dGUgcmFuZ2UgaXMgaW5jbHVzaXZlXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdSYW5nZScsICdieXRlcz0nICsgdGhpcy5fc3RhcnQgKyAnLScgKyBlbmQpO1xuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignSWYtTm9uZS1NYXRjaCcsICd3ZWJraXQtbm8tY2FjaGUnKTsgLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgyNjcyXG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHhoci5zZW5kKCk7XG5cdFx0XHR9XG5cdFx0XHRjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoZXJyLm1lc3NhZ2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoSVNfV09SS0VSICYmIHhoci5zdGF0dXMgPT09IDApXG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlICE9PSA0KVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh4aHIuc3RhdHVzIDwgMjAwIHx8IHhoci5zdGF0dXMgPj0gNDAwKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fZmluaXNoZWQgPSAhdGhpcy5fY29uZmlnLmNodW5rU2l6ZSB8fCB0aGlzLl9zdGFydCA+IGdldEZpbGVTaXplKHhocik7XG5cdFx0XHR0aGlzLnBhcnNlQ2h1bmsoeGhyLnJlc3BvbnNlVGV4dCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuX2NodW5rRXJyb3IgPSBmdW5jdGlvbihlcnJvck1lc3NhZ2UpXG5cdFx0e1xuXHRcdFx0dmFyIGVycm9yVGV4dCA9IHhoci5zdGF0dXNUZXh0IHx8IGVycm9yTWVzc2FnZTtcblx0XHRcdHRoaXMuX3NlbmRFcnJvcihuZXcgRXJyb3IoZXJyb3JUZXh0KSk7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIGdldEZpbGVTaXplKHhocilcblx0XHR7XG5cdFx0XHR2YXIgY29udGVudFJhbmdlID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVJhbmdlJyk7XG5cdFx0XHRpZiAoY29udGVudFJhbmdlID09PSBudWxsKSB7IC8vIG5vIGNvbnRlbnQgcmFuZ2UsIHRoZW4gZmluaXNoIVxuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoY29udGVudFJhbmdlLnN1YnN0cihjb250ZW50UmFuZ2UubGFzdEluZGV4T2YoJy8nKSArIDEpKTtcblx0XHR9XG5cdH1cblx0TmV0d29ya1N0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHROZXR3b3JrU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTmV0d29ya1N0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gRmlsZVN0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRpZiAoIWNvbmZpZy5jaHVua1NpemUpXG5cdFx0XHRjb25maWcuY2h1bmtTaXplID0gUGFwYS5Mb2NhbENodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciByZWFkZXIsIHNsaWNlO1xuXG5cdFx0Ly8gRmlsZVJlYWRlciBpcyBiZXR0ZXIgdGhhbiBGaWxlUmVhZGVyU3luYyAoZXZlbiBpbiB3b3JrZXIpIC0gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzI0NzA4NjQ5LzEwNDg4NjJcblx0XHQvLyBCdXQgRmlyZWZveCBpcyBhIHBpbGwsIHRvbyAtIHNlZSBpc3N1ZSAjNzY6IGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2UvaXNzdWVzLzc2XG5cdFx0dmFyIHVzaW5nQXN5bmNSZWFkZXIgPSB0eXBlb2YgRmlsZVJlYWRlciAhPT0gJ3VuZGVmaW5lZCc7XHQvLyBTYWZhcmkgZG9lc24ndCBjb25zaWRlciBpdCBhIGZ1bmN0aW9uIC0gc2VlIGlzc3VlICMxMDVcblxuXHRcdHRoaXMuc3RyZWFtID0gZnVuY3Rpb24oZmlsZSlcblx0XHR7XG5cdFx0XHR0aGlzLl9pbnB1dCA9IGZpbGU7XG5cdFx0XHRzbGljZSA9IGZpbGUuc2xpY2UgfHwgZmlsZS53ZWJraXRTbGljZSB8fCBmaWxlLm1velNsaWNlO1xuXG5cdFx0XHRpZiAodXNpbmdBc3luY1JlYWRlcilcblx0XHRcdHtcblx0XHRcdFx0cmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcdFx0Ly8gUHJlZmVycmVkIG1ldGhvZCBvZiByZWFkaW5nIGZpbGVzLCBldmVuIGluIHdvcmtlcnNcblx0XHRcdFx0cmVhZGVyLm9ubG9hZCA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0xvYWRlZCwgdGhpcyk7XG5cdFx0XHRcdHJlYWRlci5vbmVycm9yID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rRXJyb3IsIHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZWFkZXIgPSBuZXcgRmlsZVJlYWRlclN5bmMoKTtcdC8vIEhhY2sgZm9yIHJ1bm5pbmcgaW4gYSB3ZWIgd29ya2VyIGluIEZpcmVmb3hcblxuXHRcdFx0dGhpcy5fbmV4dENodW5rKCk7XHQvLyBTdGFydHMgc3RyZWFtaW5nXG5cdFx0fTtcblxuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkICYmICghdGhpcy5fY29uZmlnLnByZXZpZXcgfHwgdGhpcy5fcm93Q291bnQgPCB0aGlzLl9jb25maWcucHJldmlldykpXG5cdFx0XHRcdHRoaXMuX3JlYWRDaHVuaygpO1xuXHRcdH07XG5cblx0XHR0aGlzLl9yZWFkQ2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dmFyIGlucHV0ID0gdGhpcy5faW5wdXQ7XG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IE1hdGgubWluKHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSwgdGhpcy5faW5wdXQuc2l6ZSk7XG5cdFx0XHRcdGlucHV0ID0gc2xpY2UuY2FsbChpbnB1dCwgdGhpcy5fc3RhcnQsIGVuZCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdHh0ID0gcmVhZGVyLnJlYWRBc1RleHQoaW5wdXQsIHRoaXMuX2NvbmZpZy5lbmNvZGluZyk7XG5cdFx0XHRpZiAoIXVzaW5nQXN5bmNSZWFkZXIpXG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKHsgdGFyZ2V0OiB7IHJlc3VsdDogdHh0IH0gfSk7XHQvLyBtaW1pYyB0aGUgYXN5bmMgc2lnbmF0dXJlXG5cdFx0fTtcblxuXHRcdHRoaXMuX2NodW5rTG9hZGVkID0gZnVuY3Rpb24oZXZlbnQpXG5cdFx0e1xuXHRcdFx0Ly8gVmVyeSBpbXBvcnRhbnQgdG8gaW5jcmVtZW50IHN0YXJ0IGVhY2ggdGltZSBiZWZvcmUgaGFuZGxpbmcgcmVzdWx0c1xuXHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXRoaXMuX2NvbmZpZy5jaHVua1NpemUgfHwgdGhpcy5fc3RhcnQgPj0gdGhpcy5faW5wdXQuc2l6ZTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayhldmVudC50YXJnZXQucmVzdWx0KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5fY2h1bmtFcnJvciA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IocmVhZGVyLmVycm9yKTtcblx0XHR9O1xuXG5cdH1cblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRGaWxlU3RyZWFtZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmlsZVN0cmVhbWVyO1xuXG5cblx0ZnVuY3Rpb24gU3RyaW5nU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHJlbWFpbmluZztcblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKHMpXG5cdFx0e1xuXHRcdFx0cmVtYWluaW5nID0gcztcblx0XHRcdHJldHVybiB0aGlzLl9uZXh0Q2h1bmsoKTtcblx0XHR9O1xuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpIHJldHVybjtcblx0XHRcdHZhciBzaXplID0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHZhciBjaHVuayA9IHNpemUgPyByZW1haW5pbmcuc3Vic3RyKDAsIHNpemUpIDogcmVtYWluaW5nO1xuXHRcdFx0cmVtYWluaW5nID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoc2l6ZSkgOiAnJztcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXJlbWFpbmluZztcblx0XHRcdHJldHVybiB0aGlzLnBhcnNlQ2h1bmsoY2h1bmspO1xuXHRcdH07XG5cdH1cblx0U3RyaW5nU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdHJpbmdTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIFJlYWRhYmxlU3RyZWFtU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXG5cdFx0Q2h1bmtTdHJlYW1lci5jYWxsKHRoaXMsIGNvbmZpZyk7XG5cblx0XHR2YXIgcXVldWUgPSBbXTtcblx0XHR2YXIgcGFyc2VPbkRhdGEgPSB0cnVlO1xuXHRcdHZhciBzdHJlYW1IYXNFbmRlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRDaHVua1N0cmVhbWVyLnByb3RvdHlwZS5wYXVzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0dGhpcy5faW5wdXQucGF1c2UoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0Q2h1bmtTdHJlYW1lci5wcm90b3R5cGUucmVzdW1lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHR0aGlzLl9pbnB1dC5yZXN1bWUoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbihzdHJlYW0pXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSBzdHJlYW07XG5cblx0XHRcdHRoaXMuX2lucHV0Lm9uKCdkYXRhJywgdGhpcy5fc3RyZWFtRGF0YSk7XG5cdFx0XHR0aGlzLl9pbnB1dC5vbignZW5kJywgdGhpcy5fc3RyZWFtRW5kKTtcblx0XHRcdHRoaXMuX2lucHV0Lm9uKCdlcnJvcicsIHRoaXMuX3N0cmVhbUVycm9yKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5fY2hlY2tJc0ZpbmlzaGVkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmIChzdHJlYW1IYXNFbmRlZCAmJiBxdWV1ZS5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0dGhpcy5fZmluaXNoZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLl9uZXh0Q2h1bmsgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0dGhpcy5fY2hlY2tJc0ZpbmlzaGVkKCk7XG5cdFx0XHRpZiAocXVldWUubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLnBhcnNlQ2h1bmsocXVldWUuc2hpZnQoKSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdHBhcnNlT25EYXRhID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5fc3RyZWFtRGF0YSA9IGJpbmRGdW5jdGlvbihmdW5jdGlvbihjaHVuaylcblx0XHR7XG5cdFx0XHR0cnlcblx0XHRcdHtcblx0XHRcdFx0cXVldWUucHVzaCh0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnID8gY2h1bmsgOiBjaHVuay50b1N0cmluZyh0aGlzLl9jb25maWcuZW5jb2RpbmcpKTtcblxuXHRcdFx0XHRpZiAocGFyc2VPbkRhdGEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwYXJzZU9uRGF0YSA9IGZhbHNlO1xuXHRcdFx0XHRcdHRoaXMuX2NoZWNrSXNGaW5pc2hlZCgpO1xuXHRcdFx0XHRcdHRoaXMucGFyc2VDaHVuayhxdWV1ZS5zaGlmdCgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9zdHJlYW1FcnJvcihlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyk7XG5cblx0XHR0aGlzLl9zdHJlYW1FcnJvciA9IGJpbmRGdW5jdGlvbihmdW5jdGlvbihlcnJvcilcblx0XHR7XG5cdFx0XHR0aGlzLl9zdHJlYW1DbGVhblVwKCk7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IoZXJyb3IpO1xuXHRcdH0sIHRoaXMpO1xuXG5cdFx0dGhpcy5fc3RyZWFtRW5kID0gYmluZEZ1bmN0aW9uKGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHR0aGlzLl9zdHJlYW1DbGVhblVwKCk7XG5cdFx0XHRzdHJlYW1IYXNFbmRlZCA9IHRydWU7XG5cdFx0XHR0aGlzLl9zdHJlYW1EYXRhKCcnKTtcblx0XHR9LCB0aGlzKTtcblxuXHRcdHRoaXMuX3N0cmVhbUNsZWFuVXAgPSBiaW5kRnVuY3Rpb24oZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0LnJlbW92ZUxpc3RlbmVyKCdkYXRhJywgdGhpcy5fc3RyZWFtRGF0YSk7XG5cdFx0XHR0aGlzLl9pbnB1dC5yZW1vdmVMaXN0ZW5lcignZW5kJywgdGhpcy5fc3RyZWFtRW5kKTtcblx0XHRcdHRoaXMuX2lucHV0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIHRoaXMuX3N0cmVhbUVycm9yKTtcblx0XHR9LCB0aGlzKTtcblx0fVxuXHRSZWFkYWJsZVN0cmVhbVN0cmVhbWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2h1bmtTdHJlYW1lci5wcm90b3R5cGUpO1xuXHRSZWFkYWJsZVN0cmVhbVN0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlYWRhYmxlU3RyZWFtU3RyZWFtZXI7XG5cblxuXHQvLyBVc2Ugb25lIFBhcnNlckhhbmRsZSBwZXIgZW50aXJlIENTViBmaWxlIG9yIHN0cmluZ1xuXHRmdW5jdGlvbiBQYXJzZXJIYW5kbGUoX2NvbmZpZylcblx0e1xuXHRcdC8vIE9uZSBnb2FsIGlzIHRvIG1pbmltaXplIHRoZSB1c2Ugb2YgcmVndWxhciBleHByZXNzaW9ucy4uLlxuXHRcdHZhciBGTE9BVCA9IC9eXFxzKi0/KFxcZCpcXC4/XFxkK3xcXGQrXFwuP1xcZCopKGVbLStdP1xcZCspP1xccyokL2k7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIF9zdGVwQ291bnRlciA9IDA7XHQvLyBOdW1iZXIgb2YgdGltZXMgc3RlcCB3YXMgY2FsbGVkIChudW1iZXIgb2Ygcm93cyBwYXJzZWQpXG5cdFx0dmFyIF9pbnB1dDtcdFx0XHRcdC8vIFRoZSBpbnB1dCBiZWluZyBwYXJzZWRcblx0XHR2YXIgX3BhcnNlcjtcdFx0XHQvLyBUaGUgY29yZSBwYXJzZXIgYmVpbmcgdXNlZFxuXHRcdHZhciBfcGF1c2VkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHdlIGFyZSBwYXVzZWQgb3Igbm90XG5cdFx0dmFyIF9hYm9ydGVkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHRoZSBwYXJzZXIgaGFzIGFib3J0ZWQgb3Igbm90XG5cdFx0dmFyIF9kZWxpbWl0ZXJFcnJvcjtcdC8vIFRlbXBvcmFyeSBzdGF0ZSBiZXR3ZWVuIGRlbGltaXRlciBkZXRlY3Rpb24gYW5kIHByb2Nlc3NpbmcgcmVzdWx0c1xuXHRcdHZhciBfZmllbGRzID0gW107XHRcdC8vIEZpZWxkcyBhcmUgZnJvbSB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgaW5wdXQsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdHZhciBfcmVzdWx0cyA9IHtcdFx0Ly8gVGhlIGxhc3QgcmVzdWx0cyByZXR1cm5lZCBmcm9tIHRoZSBwYXJzZXJcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblxuXHRcdGlmIChpc0Z1bmN0aW9uKF9jb25maWcuc3RlcCkpXG5cdFx0e1xuXHRcdFx0dmFyIHVzZXJTdGVwID0gX2NvbmZpZy5zdGVwO1xuXHRcdFx0X2NvbmZpZy5zdGVwID0gZnVuY3Rpb24ocmVzdWx0cylcblx0XHRcdHtcblx0XHRcdFx0X3Jlc3VsdHMgPSByZXN1bHRzO1xuXG5cdFx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRcdGVsc2VcdC8vIG9ubHkgY2FsbCB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhZnRlciBoZWFkZXIgcm93XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXG5cdFx0XHRcdFx0Ly8gSXQncyBwb3NzYmlsZSB0aGF0IHRoaXMgbGluZSB3YXMgZW1wdHkgYW5kIHRoZXJlJ3Mgbm8gcm93IGhlcmUgYWZ0ZXIgYWxsXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGEubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdFx0X3N0ZXBDb3VudGVyICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfc3RlcENvdW50ZXIgPiBfY29uZmlnLnByZXZpZXcpXG5cdFx0XHRcdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dXNlclN0ZXAoX3Jlc3VsdHMsIHNlbGYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFBhcnNlcyBpbnB1dC4gTW9zdCB1c2VycyB3b24ndCBuZWVkLCBhbmQgc2hvdWxkbid0IG1lc3Mgd2l0aCwgdGhlIGJhc2VJbmRleFxuXHRcdCAqIGFuZCBpZ25vcmVMYXN0Um93IHBhcmFtZXRlcnMuIFRoZXkgYXJlIHVzZWQgYnkgc3RyZWFtZXJzICh3cmFwcGVyIGZ1bmN0aW9ucylcblx0XHQgKiB3aGVuIGFuIGlucHV0IGNvbWVzIGluIG11bHRpcGxlIGNodW5rcywgbGlrZSBmcm9tIGEgZmlsZS5cblx0XHQgKi9cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHRpZiAoIV9jb25maWcubmV3bGluZSlcblx0XHRcdFx0X2NvbmZpZy5uZXdsaW5lID0gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dCk7XG5cblx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0aWYgKCFfY29uZmlnLmRlbGltaXRlcilcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltR3Vlc3MgPSBndWVzc0RlbGltaXRlcihpbnB1dCwgX2NvbmZpZy5uZXdsaW5lLCBfY29uZmlnLnNraXBFbXB0eUxpbmVzKTtcblx0XHRcdFx0aWYgKGRlbGltR3Vlc3Muc3VjY2Vzc2Z1bClcblx0XHRcdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGRlbGltR3Vlc3MuYmVzdERlbGltaXRlcjtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gdHJ1ZTtcdC8vIGFkZCBlcnJvciBhZnRlciBwYXJzaW5nIChvdGhlcndpc2UgaXQgd291bGQgYmUgb3ZlcndyaXR0ZW4pXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBQYXBhLkRlZmF1bHREZWxpbWl0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoaXNGdW5jdGlvbihfY29uZmlnLmRlbGltaXRlcikpXG5cdFx0XHR7XG5cdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXIoaW5wdXQpO1xuXHRcdFx0XHRfcmVzdWx0cy5tZXRhLmRlbGltaXRlciA9IF9jb25maWcuZGVsaW1pdGVyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcGFyc2VyQ29uZmlnID0gY29weShfY29uZmlnKTtcblx0XHRcdGlmIChfY29uZmlnLnByZXZpZXcgJiYgX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHBhcnNlckNvbmZpZy5wcmV2aWV3Kys7XHQvLyB0byBjb21wZW5zYXRlIGZvciBoZWFkZXIgcm93XG5cblx0XHRcdF9pbnB1dCA9IGlucHV0O1xuXHRcdFx0X3BhcnNlciA9IG5ldyBQYXJzZXIocGFyc2VyQ29uZmlnKTtcblx0XHRcdF9yZXN1bHRzID0gX3BhcnNlci5wYXJzZShfaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdyk7XG5cdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0cmV0dXJuIF9wYXVzZWQgPyB7IG1ldGE6IHsgcGF1c2VkOiB0cnVlIH0gfSA6IChfcmVzdWx0cyB8fCB7IG1ldGE6IHsgcGF1c2VkOiBmYWxzZSB9IH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlZCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRfcGF1c2VkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9pbnB1dCA9IF9pbnB1dC5zdWJzdHIoX3BhcnNlci5nZXRDaGFySW5kZXgoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSBmYWxzZTtcblx0XHRcdHNlbGYuc3RyZWFtZXIucGFyc2VDaHVuayhfaW5wdXQsIHRydWUpO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9hYm9ydGVkO1xuXHRcdH07XG5cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9hYm9ydGVkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9yZXN1bHRzLm1ldGEuYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbihfY29uZmlnLmNvbXBsZXRlKSlcblx0XHRcdFx0X2NvbmZpZy5jb21wbGV0ZShfcmVzdWx0cyk7XG5cdFx0XHRfaW5wdXQgPSAnJztcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gcHJvY2Vzc1Jlc3VsdHMoKVxuXHRcdHtcblx0XHRcdGlmIChfcmVzdWx0cyAmJiBfZGVsaW1pdGVyRXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGFkZEVycm9yKCdEZWxpbWl0ZXInLCAnVW5kZXRlY3RhYmxlRGVsaW1pdGVyJywgJ1VuYWJsZSB0byBhdXRvLWRldGVjdCBkZWxpbWl0aW5nIGNoYXJhY3RlcjsgZGVmYXVsdGVkIHRvIFxcJycgKyBQYXBhLkRlZmF1bHREZWxpbWl0ZXIgKyAnXFwnJyk7XG5cdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5za2lwRW1wdHlMaW5lcylcblx0XHRcdHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aCA9PT0gMSAmJiBfcmVzdWx0cy5kYXRhW2ldWzBdID09PSAnJylcblx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKGktLSwgMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZWVkc0hlYWRlclJvdygpKVxuXHRcdFx0XHRmaWxsSGVhZGVyRmllbGRzKCk7XG5cblx0XHRcdHJldHVybiBhcHBseUhlYWRlckFuZER5bmFtaWNUeXBpbmcoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBuZWVkc0hlYWRlclJvdygpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIF9jb25maWcuaGVhZGVyICYmIF9maWVsZHMubGVuZ3RoID09PSAwO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbGxIZWFkZXJGaWVsZHMoKVxuXHRcdHtcblx0XHRcdGlmICghX3Jlc3VsdHMpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBuZWVkc0hlYWRlclJvdygpICYmIGkgPCBfcmVzdWx0cy5kYXRhLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgaGVhZGVyID0gX3Jlc3VsdHMuZGF0YVtpXVtqXTtcblxuXHRcdFx0XHRcdGlmIChfY29uZmlnLnRyaW1IZWFkZXJzKSB7XG5cdFx0XHRcdFx0XHRoZWFkZXIgPSBoZWFkZXIudHJpbSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdF9maWVsZHMucHVzaChoZWFkZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHRfcmVzdWx0cy5kYXRhLnNwbGljZSgwLCAxKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBzaG91bGRBcHBseUR5bmFtaWNUeXBpbmcoZmllbGQpIHtcblx0XHRcdC8vIENhY2hlIGZ1bmN0aW9uIHZhbHVlcyB0byBhdm9pZCBjYWxsaW5nIGl0IGZvciBlYWNoIHJvd1xuXHRcdFx0aWYgKF9jb25maWcuZHluYW1pY1R5cGluZ0Z1bmN0aW9uICYmIF9jb25maWcuZHluYW1pY1R5cGluZ1tmaWVsZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRfY29uZmlnLmR5bmFtaWNUeXBpbmdbZmllbGRdID0gX2NvbmZpZy5keW5hbWljVHlwaW5nRnVuY3Rpb24oZmllbGQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIChfY29uZmlnLmR5bmFtaWNUeXBpbmdbZmllbGRdIHx8IF9jb25maWcuZHluYW1pY1R5cGluZykgPT09IHRydWU7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSlcblx0XHR7XG5cdFx0XHRpZiAoc2hvdWxkQXBwbHlEeW5hbWljVHlwaW5nKGZpZWxkKSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSAndHJ1ZScgfHwgdmFsdWUgPT09ICdUUlVFJylcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0ZWxzZSBpZiAodmFsdWUgPT09ICdmYWxzZScgfHwgdmFsdWUgPT09ICdGQUxTRScpXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRlbHNlIGlmKEZMT0FULnRlc3QodmFsdWUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiAodmFsdWUgPT09ICcnID8gbnVsbCA6IHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cyB8fCAoIV9jb25maWcuaGVhZGVyICYmICFfY29uZmlnLmR5bmFtaWNUeXBpbmcpKVxuXHRcdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvdyA9IF9jb25maWcuaGVhZGVyID8ge30gOiBbXTtcblxuXHRcdFx0XHR2YXIgajtcblx0XHRcdFx0Zm9yIChqID0gMDsgaiA8IF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoOyBqKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgZmllbGQgPSBqO1xuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IF9yZXN1bHRzLmRhdGFbaV1bal07XG5cblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdFx0XHRmaWVsZCA9IGogPj0gX2ZpZWxkcy5sZW5ndGggPyAnX19wYXJzZWRfZXh0cmEnIDogX2ZpZWxkc1tqXTtcblxuXHRcdFx0XHRcdHZhbHVlID0gcGFyc2VEeW5hbWljKGZpZWxkLCB2YWx1ZSk7XG5cblx0XHRcdFx0XHRpZiAoZmllbGQgPT09ICdfX3BhcnNlZF9leHRyYScpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cm93W2ZpZWxkXSA9IHJvd1tmaWVsZF0gfHwgW107XG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdLnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRyb3dbZmllbGRdID0gdmFsdWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldID0gcm93O1xuXG5cdFx0XHRcdGlmIChfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChqID4gX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcignRmllbGRNaXNtYXRjaCcsICdUb29NYW55RmllbGRzJywgJ1RvbyBtYW55IGZpZWxkczogZXhwZWN0ZWQgJyArIF9maWVsZHMubGVuZ3RoICsgJyBmaWVsZHMgYnV0IHBhcnNlZCAnICsgaiwgaSk7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaiA8IF9maWVsZHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0YWRkRXJyb3IoJ0ZpZWxkTWlzbWF0Y2gnLCAnVG9vRmV3RmllbGRzJywgJ1RvbyBmZXcgZmllbGRzOiBleHBlY3RlZCAnICsgX2ZpZWxkcy5sZW5ndGggKyAnIGZpZWxkcyBidXQgcGFyc2VkICcgKyBqLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIgJiYgX3Jlc3VsdHMubWV0YSlcblx0XHRcdFx0X3Jlc3VsdHMubWV0YS5maWVsZHMgPSBfZmllbGRzO1xuXHRcdFx0cmV0dXJuIF9yZXN1bHRzO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzRGVsaW1pdGVyKGlucHV0LCBuZXdsaW5lLCBza2lwRW1wdHlMaW5lcylcblx0XHR7XG5cdFx0XHR2YXIgZGVsaW1DaG9pY2VzID0gWycsJywgJ1xcdCcsICd8JywgJzsnLCBQYXBhLlJFQ09SRF9TRVAsIFBhcGEuVU5JVF9TRVBdO1xuXHRcdFx0dmFyIGJlc3REZWxpbSwgYmVzdERlbHRhLCBmaWVsZENvdW50UHJldlJvdztcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWxpbUNob2ljZXMubGVuZ3RoOyBpKyspXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkZWxpbSA9IGRlbGltQ2hvaWNlc1tpXTtcblx0XHRcdFx0dmFyIGRlbHRhID0gMCwgYXZnRmllbGRDb3VudCA9IDAsIGVtcHR5TGluZXNDb3VudCA9IDA7XG5cdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdHZhciBwcmV2aWV3ID0gbmV3IFBhcnNlcih7XG5cdFx0XHRcdFx0ZGVsaW1pdGVyOiBkZWxpbSxcblx0XHRcdFx0XHRuZXdsaW5lOiBuZXdsaW5lLFxuXHRcdFx0XHRcdHByZXZpZXc6IDEwXG5cdFx0XHRcdH0pLnBhcnNlKGlucHV0KTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHByZXZpZXcuZGF0YS5sZW5ndGg7IGorKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChza2lwRW1wdHlMaW5lcyAmJiBwcmV2aWV3LmRhdGFbal0ubGVuZ3RoID09PSAxICYmIHByZXZpZXcuZGF0YVtqXVswXS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdGVtcHR5TGluZXNDb3VudCsrO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBmaWVsZENvdW50ID0gcHJldmlldy5kYXRhW2pdLmxlbmd0aDtcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50ICs9IGZpZWxkQ291bnQ7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIGZpZWxkQ291bnRQcmV2Um93ID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IGZpZWxkQ291bnQ7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoZmllbGRDb3VudCA+IDEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGVsdGEgKz0gTWF0aC5hYnMoZmllbGRDb3VudCAtIGZpZWxkQ291bnRQcmV2Um93KTtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocHJldmlldy5kYXRhLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0YXZnRmllbGRDb3VudCAvPSAocHJldmlldy5kYXRhLmxlbmd0aCAtIGVtcHR5TGluZXNDb3VudCk7XG5cblx0XHRcdFx0aWYgKCh0eXBlb2YgYmVzdERlbHRhID09PSAndW5kZWZpbmVkJyB8fCBkZWx0YSA8IGJlc3REZWx0YSlcblx0XHRcdFx0XHQmJiBhdmdGaWVsZENvdW50ID4gMS45OSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJlc3REZWx0YSA9IGRlbHRhO1xuXHRcdFx0XHRcdGJlc3REZWxpbSA9IGRlbGltO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gYmVzdERlbGltO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzZnVsOiAhIWJlc3REZWxpbSxcblx0XHRcdFx0YmVzdERlbGltaXRlcjogYmVzdERlbGltXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzTGluZUVuZGluZ3MoaW5wdXQpXG5cdFx0e1xuXHRcdFx0aW5wdXQgPSBpbnB1dC5zdWJzdHIoMCwgMTAyNCAqIDEwMjQpO1x0Ly8gbWF4IGxlbmd0aCAxIE1CXG5cblx0XHRcdHZhciByID0gaW5wdXQuc3BsaXQoJ1xccicpO1xuXG5cdFx0XHR2YXIgbiA9IGlucHV0LnNwbGl0KCdcXG4nKTtcblxuXHRcdFx0dmFyIG5BcHBlYXJzRmlyc3QgPSAobi5sZW5ndGggPiAxICYmIG5bMF0ubGVuZ3RoIDwgclswXS5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoci5sZW5ndGggPT09IDEgfHwgbkFwcGVhcnNGaXJzdClcblx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXG5cdFx0XHR2YXIgbnVtV2l0aE4gPSAwO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocltpXVswXSA9PT0gJ1xcbicpXG5cdFx0XHRcdFx0bnVtV2l0aE4rKztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bVdpdGhOID49IHIubGVuZ3RoIC8gMiA/ICdcXHJcXG4nIDogJ1xccic7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gYWRkRXJyb3IodHlwZSwgY29kZSwgbXNnLCByb3cpXG5cdFx0e1xuXHRcdFx0X3Jlc3VsdHMuZXJyb3JzLnB1c2goe1xuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRjb2RlOiBjb2RlLFxuXHRcdFx0XHRtZXNzYWdlOiBtc2csXG5cdFx0XHRcdHJvdzogcm93XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXG5cblxuXG5cdC8qKiBUaGUgY29yZSBwYXJzZXIgaW1wbGVtZW50cyBzcGVlZHkgYW5kIGNvcnJlY3QgQ1NWIHBhcnNpbmcgKi9cblx0ZnVuY3Rpb24gUGFyc2VyKGNvbmZpZylcblx0e1xuXHRcdC8vIFVucGFjayB0aGUgY29uZmlnIG9iamVjdFxuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHR2YXIgZGVsaW0gPSBjb25maWcuZGVsaW1pdGVyO1xuXHRcdHZhciBuZXdsaW5lID0gY29uZmlnLm5ld2xpbmU7XG5cdFx0dmFyIGNvbW1lbnRzID0gY29uZmlnLmNvbW1lbnRzO1xuXHRcdHZhciBzdGVwID0gY29uZmlnLnN0ZXA7XG5cdFx0dmFyIHByZXZpZXcgPSBjb25maWcucHJldmlldztcblx0XHR2YXIgZmFzdE1vZGUgPSBjb25maWcuZmFzdE1vZGU7XG5cdFx0dmFyIHF1b3RlQ2hhcjtcblx0XHQvKiogQWxsb3dzIGZvciBubyBxdW90ZUNoYXIgYnkgc2V0dGluZyBxdW90ZUNoYXIgdG8gdW5kZWZpbmVkIGluIGNvbmZpZyAqL1xuXHRcdGlmIChjb25maWcucXVvdGVDaGFyID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHF1b3RlQ2hhciA9ICdcIic7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHF1b3RlQ2hhciA9IGNvbmZpZy5xdW90ZUNoYXI7XG5cdFx0fVxuXHRcdHZhciBlc2NhcGVDaGFyID0gcXVvdGVDaGFyO1xuXHRcdGlmIChjb25maWcuZXNjYXBlQ2hhciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRlc2NhcGVDaGFyID0gY29uZmlnLmVzY2FwZUNoYXI7XG5cdFx0fVxuXG5cdFx0Ly8gRGVsaW1pdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAodHlwZW9mIGRlbGltICE9PSAnc3RyaW5nJ1xuXHRcdFx0fHwgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKGRlbGltKSA+IC0xKVxuXHRcdFx0ZGVsaW0gPSAnLCc7XG5cblx0XHQvLyBDb21tZW50IGNoYXJhY3RlciBtdXN0IGJlIHZhbGlkXG5cdFx0aWYgKGNvbW1lbnRzID09PSBkZWxpbSlcblx0XHRcdHRocm93ICdDb21tZW50IGNoYXJhY3RlciBzYW1lIGFzIGRlbGltaXRlcic7XG5cdFx0ZWxzZSBpZiAoY29tbWVudHMgPT09IHRydWUpXG5cdFx0XHRjb21tZW50cyA9ICcjJztcblx0XHRlbHNlIGlmICh0eXBlb2YgY29tbWVudHMgIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoY29tbWVudHMpID4gLTEpXG5cdFx0XHRjb21tZW50cyA9IGZhbHNlO1xuXG5cdFx0Ly8gTmV3bGluZSBtdXN0IGJlIHZhbGlkOiBcXHIsIFxcbiwgb3IgXFxyXFxuXG5cdFx0aWYgKG5ld2xpbmUgIT09ICdcXG4nICYmIG5ld2xpbmUgIT09ICdcXHInICYmIG5ld2xpbmUgIT09ICdcXHJcXG4nKVxuXHRcdFx0bmV3bGluZSA9ICdcXG4nO1xuXG5cdFx0Ly8gV2UncmUgZ29ubmEgbmVlZCB0aGVzZSBhdCB0aGUgUGFyc2VyIHNjb3BlXG5cdFx0dmFyIGN1cnNvciA9IDA7XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KVxuXHRcdHtcblx0XHRcdC8vIEZvciBzb21lIHJlYXNvbiwgaW4gQ2hyb21lLCB0aGlzIHNwZWVkcyB0aGluZ3MgdXAgKCE/KVxuXHRcdFx0aWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpXG5cdFx0XHRcdHRocm93ICdJbnB1dCBtdXN0IGJlIGEgc3RyaW5nJztcblxuXHRcdFx0Ly8gV2UgZG9uJ3QgbmVlZCB0byBjb21wdXRlIHNvbWUgb2YgdGhlc2UgZXZlcnkgdGltZSBwYXJzZSgpIGlzIGNhbGxlZCxcblx0XHRcdC8vIGJ1dCBoYXZpbmcgdGhlbSBpbiBhIG1vcmUgbG9jYWwgc2NvcGUgc2VlbXMgdG8gcGVyZm9ybSBiZXR0ZXJcblx0XHRcdHZhciBpbnB1dExlbiA9IGlucHV0Lmxlbmd0aCxcblx0XHRcdFx0ZGVsaW1MZW4gPSBkZWxpbS5sZW5ndGgsXG5cdFx0XHRcdG5ld2xpbmVMZW4gPSBuZXdsaW5lLmxlbmd0aCxcblx0XHRcdFx0Y29tbWVudHNMZW4gPSBjb21tZW50cy5sZW5ndGg7XG5cdFx0XHR2YXIgc3RlcElzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uKHN0ZXApO1xuXG5cdFx0XHQvLyBFc3RhYmxpc2ggc3RhcnRpbmcgc3RhdGVcblx0XHRcdGN1cnNvciA9IDA7XG5cdFx0XHR2YXIgZGF0YSA9IFtdLCBlcnJvcnMgPSBbXSwgcm93ID0gW10sIGxhc3RDdXJzb3IgPSAwO1xuXG5cdFx0XHRpZiAoIWlucHV0KVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXG5cdFx0XHRpZiAoZmFzdE1vZGUgfHwgKGZhc3RNb2RlICE9PSBmYWxzZSAmJiBpbnB1dC5pbmRleE9mKHF1b3RlQ2hhcikgPT09IC0xKSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvd3MgPSBpbnB1dC5zcGxpdChuZXdsaW5lKTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm93ID0gcm93c1tpXTtcblx0XHRcdFx0XHRjdXJzb3IgKz0gcm93Lmxlbmd0aDtcblx0XHRcdFx0XHRpZiAoaSAhPT0gcm93cy5sZW5ndGggLSAxKVxuXHRcdFx0XHRcdFx0Y3Vyc29yICs9IG5ld2xpbmUubGVuZ3RoO1xuXHRcdFx0XHRcdGVsc2UgaWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdGlmIChjb21tZW50cyAmJiByb3cuc3Vic3RyKDAsIGNvbW1lbnRzTGVuKSA9PT0gY29tbWVudHMpXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRpZiAoc3RlcElzRnVuY3Rpb24pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0cHVzaFJvdyhyb3cuc3BsaXQoZGVsaW0pKTtcblx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgaSA+PSBwcmV2aWV3KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBkYXRhLnNsaWNlKDAsIHByZXZpZXcpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUodHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1xuXHRcdFx0dmFyIG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0dmFyIHF1b3RlQ2hhclJlZ2V4ID0gbmV3IFJlZ0V4cChlc2NhcGVDaGFyLnJlcGxhY2UoL1stW1xcXS97fSgpKis/LlxcXFxeJHxdL2csICdcXFxcJCYnKSArIHF1b3RlQ2hhciwgJ2cnKTtcblx0XHRcdHZhciBxdW90ZVNlYXJjaDtcblxuXHRcdFx0Ly8gUGFyc2VyIGxvb3Bcblx0XHRcdGZvciAoOzspXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEZpZWxkIGhhcyBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdGlmIChpbnB1dFtjdXJzb3JdID09PSBxdW90ZUNoYXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBTdGFydCBvdXIgc2VhcmNoIGZvciB0aGUgY2xvc2luZyBxdW90ZSB3aGVyZSB0aGUgY3Vyc29yIGlzXG5cdFx0XHRcdFx0cXVvdGVTZWFyY2ggPSBjdXJzb3I7XG5cblx0XHRcdFx0XHQvLyBTa2lwIHRoZSBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdFx0Y3Vyc29yKys7XG5cblx0XHRcdFx0XHRmb3IgKDs7KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEZpbmQgY2xvc2luZyBxdW90ZVxuXHRcdFx0XHRcdFx0cXVvdGVTZWFyY2ggPSBpbnB1dC5pbmRleE9mKHF1b3RlQ2hhciwgcXVvdGVTZWFyY2ggKyAxKTtcblxuXHRcdFx0XHRcdFx0Ly9ObyBvdGhlciBxdW90ZXMgYXJlIGZvdW5kIC0gbm8gb3RoZXIgZGVsaW1pdGVyc1xuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSAtMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKCFpZ25vcmVMYXN0Um93KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gTm8gY2xvc2luZyBxdW90ZS4uLiB3aGF0IGEgcGl0eVxuXHRcdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6ICdRdW90ZXMnLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29kZTogJ01pc3NpbmdRdW90ZXMnLFxuXHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogJ1F1b3RlZCBmaWVsZCB1bnRlcm1pbmF0ZWQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0cm93OiBkYXRhLmxlbmd0aCxcdC8vIHJvdyBoYXMgeWV0IHRvIGJlIGluc2VydGVkXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleDogY3Vyc29yXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGF0IEVPRlxuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSBpbnB1dExlbiAtIDEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9IGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKHZhbHVlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhpcyBxdW90ZSBpcyBlc2NhcGVkLCBpdCdzIHBhcnQgb2YgdGhlIGRhdGE7IHNraXAgaXRcblx0XHRcdFx0XHRcdC8vIElmIHRoZSBxdW90ZSBjaGFyYWN0ZXIgaXMgdGhlIGVzY2FwZSBjaGFyYWN0ZXIsIHRoZW4gY2hlY2sgaWYgdGhlIG5leHQgY2hhcmFjdGVyIGlzIHRoZSBlc2NhcGUgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHRpZiAocXVvdGVDaGFyID09PSBlc2NhcGVDaGFyICYmICBpbnB1dFtxdW90ZVNlYXJjaCArIDFdID09PSBlc2NhcGVDaGFyKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRxdW90ZVNlYXJjaCsrO1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhlIHF1b3RlIGNoYXJhY3RlciBpcyBub3QgdGhlIGVzY2FwZSBjaGFyYWN0ZXIsIHRoZW4gY2hlY2sgaWYgdGhlIHByZXZpb3VzIGNoYXJhY3RlciB3YXMgdGhlIGVzY2FwZSBjaGFyYWN0ZXJcblx0XHRcdFx0XHRcdGlmIChxdW90ZUNoYXIgIT09IGVzY2FwZUNoYXIgJiYgcXVvdGVTZWFyY2ggIT09IDAgJiYgaW5wdXRbcXVvdGVTZWFyY2ggLSAxXSA9PT0gZXNjYXBlQ2hhcilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHZhciBzcGFjZXNCZXR3ZWVuUXVvdGVBbmREZWxpbWl0ZXIgPSBleHRyYVNwYWNlcyhuZXh0RGVsaW0pO1xuXG5cdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IGRlbGltaXRlciBvciAndW5uZWNlc3Nhcnkgc3RlcHMgKyBkZWxpbWl0ZXInXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2ggKyAxICsgc3BhY2VzQmV0d2VlblF1b3RlQW5kRGVsaW1pdGVyXSA9PT0gZGVsaW0pXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpKTtcblx0XHRcdFx0XHRcdFx0Y3Vyc29yID0gcXVvdGVTZWFyY2ggKyAxICsgc3BhY2VzQmV0d2VlblF1b3RlQW5kRGVsaW1pdGVyICsgZGVsaW1MZW47XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dmFyIHNwYWNlc0JldHdlZW5RdW90ZUFuZE5ld0xpbmUgPSBleHRyYVNwYWNlcyhuZXh0TmV3bGluZSk7XG5cblx0XHRcdFx0XHRcdC8vIENsb3NpbmcgcXVvdGUgZm9sbG93ZWQgYnkgbmV3bGluZSBvciAndW5uZWNlc3Nhcnkgc3BhY2VzICsgbmV3TGluZSdcblx0XHRcdFx0XHRcdGlmIChpbnB1dC5zdWJzdHIocXVvdGVTZWFyY2ggKyAxICsgc3BhY2VzQmV0d2VlblF1b3RlQW5kTmV3TGluZSwgbmV3bGluZUxlbikgPT09IG5ld2xpbmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIHF1b3RlU2VhcmNoKS5yZXBsYWNlKHF1b3RlQ2hhclJlZ2V4LCBxdW90ZUNoYXIpKTtcblx0XHRcdFx0XHRcdFx0c2F2ZVJvdyhxdW90ZVNlYXJjaCArIDEgKyBzcGFjZXNCZXR3ZWVuUXVvdGVBbmROZXdMaW5lICsgbmV3bGluZUxlbik7XG5cdFx0XHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XHQvLyBiZWNhdXNlIHdlIG1heSBoYXZlIHNraXBwZWQgdGhlIG5leHREZWxpbSBpbiB0aGUgcXVvdGVkIGZpZWxkXG5cblx0XHRcdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZG9TdGVwKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGFib3J0ZWQpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0XHQvLyBDaGVja3MgZm9yIHZhbGlkIGNsb3NpbmcgcXVvdGVzIGFyZSBjb21wbGV0ZSAoZXNjYXBlZCBxdW90ZXMgb3IgcXVvdGUgZm9sbG93ZWQgYnkgRU9GL2RlbGltaXRlci9uZXdsaW5lKSAtLSBhc3N1bWUgdGhlc2UgcXVvdGVzIGFyZSBwYXJ0IG9mIGFuIGludmFsaWQgdGV4dCBzdHJpbmdcblx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0dHlwZTogJ1F1b3RlcycsXG5cdFx0XHRcdFx0XHRcdGNvZGU6ICdJbnZhbGlkUXVvdGVzJyxcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogJ1RyYWlsaW5nIHF1b3RlIG9uIHF1b3RlZCBmaWVsZCBpcyBtYWxmb3JtZWQnLFxuXHRcdFx0XHRcdFx0XHRyb3c6IGRhdGEubGVuZ3RoLFx0Ly8gcm93IGhhcyB5ZXQgdG8gYmUgaW5zZXJ0ZWRcblx0XHRcdFx0XHRcdFx0aW5kZXg6IGN1cnNvclxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdHF1b3RlU2VhcmNoKys7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQ29tbWVudCBmb3VuZCBhdCBzdGFydCBvZiBuZXcgbGluZVxuXHRcdFx0XHRpZiAoY29tbWVudHMgJiYgcm93Lmxlbmd0aCA9PT0gMCAmJiBpbnB1dC5zdWJzdHIoY3Vyc29yLCBjb21tZW50c0xlbikgPT09IGNvbW1lbnRzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG5leHROZXdsaW5lID09PSAtMSlcdC8vIENvbW1lbnQgZW5kcyBhdCBFT0Zcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0Y3Vyc29yID0gbmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuO1xuXHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBOZXh0IGRlbGltaXRlciBjb21lcyBiZWZvcmUgbmV4dCBuZXdsaW5lLCBzbyB3ZSd2ZSByZWFjaGVkIGVuZCBvZiBmaWVsZFxuXHRcdFx0XHRpZiAobmV4dERlbGltICE9PSAtMSAmJiAobmV4dERlbGltIDwgbmV4dE5ld2xpbmUgfHwgbmV4dE5ld2xpbmUgPT09IC0xKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIG5leHREZWxpbSkpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHREZWxpbSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbmQgb2Ygcm93XG5cdFx0XHRcdGlmIChuZXh0TmV3bGluZSAhPT0gLTEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0TmV3bGluZSkpO1xuXHRcdFx0XHRcdHNhdmVSb3cobmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuKTtcblxuXHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGRhdGEubGVuZ3RoID49IHByZXZpZXcpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblxuXHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXG5cblx0XHRcdGZ1bmN0aW9uIHB1c2hSb3cocm93KVxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhLnB1c2gocm93KTtcblx0XHRcdFx0bGFzdEN1cnNvciA9IGN1cnNvcjtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG4gICAgICAgICAgICAgKiBjaGVja3MgaWYgdGhlcmUgYXJlIGV4dHJhIHNwYWNlcyBhZnRlciBjbG9zaW5nIHF1b3RlIGFuZCBnaXZlbiBpbmRleCB3aXRob3V0IGFueSB0ZXh0XG4gICAgICAgICAgICAgKiBpZiBZZXMsIHJldHVybnMgdGhlIG51bWJlciBvZiBzcGFjZXNcbiAgICAgICAgICAgICAqL1xuXHRcdFx0ZnVuY3Rpb24gZXh0cmFTcGFjZXMoaW5kZXgpIHtcblx0XHRcdFx0dmFyIHNwYWNlTGVuZ3RoID0gMDtcblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdHZhciB0ZXh0QmV0d2VlbkNsb3NpbmdRdW90ZUFuZEluZGV4ID0gaW5wdXQuc3Vic3RyaW5nKHF1b3RlU2VhcmNoICsgMSwgaW5kZXgpO1xuXHRcdFx0XHRcdGlmICh0ZXh0QmV0d2VlbkNsb3NpbmdRdW90ZUFuZEluZGV4ICYmIHRleHRCZXR3ZWVuQ2xvc2luZ1F1b3RlQW5kSW5kZXgudHJpbSgpID09PSAnJykge1xuXHRcdFx0XHRcdFx0c3BhY2VMZW5ndGggPSB0ZXh0QmV0d2VlbkNsb3NpbmdRdW90ZUFuZEluZGV4Lmxlbmd0aDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHNwYWNlTGVuZ3RoO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIHJlbWFpbmluZyBpbnB1dCBmcm9tIGN1cnNvciB0byB0aGUgZW5kIGludG9cblx0XHRcdCAqIHJvdywgc2F2ZXMgdGhlIHJvdywgY2FsbHMgc3RlcCwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMuXG5cdFx0XHQgKi9cblx0XHRcdGZ1bmN0aW9uIGZpbmlzaCh2YWx1ZSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKGlnbm9yZUxhc3RSb3cpXG5cdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXG5cdFx0XHRcdFx0dmFsdWUgPSBpbnB1dC5zdWJzdHIoY3Vyc29yKTtcblx0XHRcdFx0cm93LnB1c2godmFsdWUpO1xuXHRcdFx0XHRjdXJzb3IgPSBpbnB1dExlbjtcdC8vIGltcG9ydGFudCBpbiBjYXNlIHBhcnNpbmcgaXMgcGF1c2VkXG5cdFx0XHRcdHB1c2hSb3cocm93KTtcblx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZHMgdGhlIGN1cnJlbnQgcm93IHRvIHRoZSByZXN1bHRzLiBJdCBzZXRzIHRoZSBjdXJzb3Jcblx0XHRcdCAqIHRvIG5ld0N1cnNvciBhbmQgZmluZHMgdGhlIG5leHROZXdsaW5lLiBUaGUgY2FsbGVyIHNob3VsZFxuXHRcdFx0ICogdGFrZSBjYXJlIHRvIGV4ZWN1dGUgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYW5kIGNoZWNrIGZvclxuXHRcdFx0ICogcHJldmlldyBhbmQgZW5kIHBhcnNpbmcgaWYgbmVjZXNzYXJ5LlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBzYXZlUm93KG5ld0N1cnNvcilcblx0XHRcdHtcblx0XHRcdFx0Y3Vyc29yID0gbmV3Q3Vyc29yO1xuXHRcdFx0XHRwdXNoUm93KHJvdyk7XG5cdFx0XHRcdHJvdyA9IFtdO1xuXHRcdFx0XHRuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIHJlc3VsdHMsIGVycm9ycywgYW5kIG1ldGEuICovXG5cdFx0XHRmdW5jdGlvbiByZXR1cm5hYmxlKHN0b3BwZWQpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0XHRlcnJvcnM6IGVycm9ycyxcblx0XHRcdFx0XHRtZXRhOiB7XG5cdFx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdFx0bGluZWJyZWFrOiBuZXdsaW5lLFxuXHRcdFx0XHRcdFx0YWJvcnRlZDogYWJvcnRlZCxcblx0XHRcdFx0XHRcdHRydW5jYXRlZDogISFzdG9wcGVkLFxuXHRcdFx0XHRcdFx0Y3Vyc29yOiBsYXN0Q3Vyc29yICsgKGJhc2VJbmRleCB8fCAwKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0LyoqIEV4ZWN1dGVzIHRoZSB1c2VyJ3Mgc3RlcCBmdW5jdGlvbiBhbmQgcmVzZXRzIGRhdGEgJiBlcnJvcnMuICovXG5cdFx0XHRmdW5jdGlvbiBkb1N0ZXAoKVxuXHRcdFx0e1xuXHRcdFx0XHRzdGVwKHJldHVybmFibGUoKSk7XG5cdFx0XHRcdGRhdGEgPSBbXTtcblx0XHRcdFx0ZXJyb3JzID0gW107XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKiBTZXRzIHRoZSBhYm9ydCBmbGFnICovXG5cdFx0dGhpcy5hYm9ydCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0LyoqIEdldHMgdGhlIGN1cnNvciBwb3NpdGlvbiAqL1xuXHRcdHRoaXMuZ2V0Q2hhckluZGV4ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHJldHVybiBjdXJzb3I7XG5cdFx0fTtcblx0fVxuXG5cblx0Ly8gSWYgeW91IG5lZWQgdG8gbG9hZCBQYXBhIFBhcnNlIGFzeW5jaHJvbm91c2x5IGFuZCB5b3UgYWxzbyBuZWVkIHdvcmtlciB0aHJlYWRzLCBoYXJkLWNvZGVcblx0Ly8gdGhlIHNjcmlwdCBwYXRoIGhlcmUuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZS9pc3N1ZXMvODcjaXNzdWVjb21tZW50LTU3ODg1MzU4XG5cdGZ1bmN0aW9uIGdldFNjcmlwdFBhdGgoKVxuXHR7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdFx0cmV0dXJuIHNjcmlwdHMubGVuZ3RoID8gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyYyA6ICcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gbmV3V29ya2VyKClcblx0e1xuXHRcdGlmICghUGFwYS5XT1JLRVJTX1NVUFBPUlRFRClcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRpZiAoIUxPQURFRF9TWU5DICYmIFBhcGEuU0NSSVBUX1BBVEggPT09IG51bGwpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdCdTY3JpcHQgcGF0aCBjYW5ub3QgYmUgZGV0ZXJtaW5lZCBhdXRvbWF0aWNhbGx5IHdoZW4gUGFwYSBQYXJzZSBpcyBsb2FkZWQgYXN5bmNocm9ub3VzbHkuICcgK1xuXHRcdFx0XHQnWW91IG5lZWQgdG8gc2V0IFBhcGEuU0NSSVBUX1BBVEggbWFudWFsbHkuJ1xuXHRcdFx0KTtcblx0XHR2YXIgd29ya2VyVXJsID0gUGFwYS5TQ1JJUFRfUEFUSCB8fCBBVVRPX1NDUklQVF9QQVRIO1xuXHRcdC8vIEFwcGVuZCAncGFwYXdvcmtlcicgdG8gdGhlIHNlYXJjaCBzdHJpbmcgdG8gdGVsbCBwYXBhcGFyc2UgdGhhdCB0aGlzIGlzIG91ciB3b3JrZXIuXG5cdFx0d29ya2VyVXJsICs9ICh3b3JrZXJVcmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyAncGFwYXdvcmtlcic7XG5cdFx0dmFyIHcgPSBuZXcgZ2xvYmFsLldvcmtlcih3b3JrZXJVcmwpO1xuXHRcdHcub25tZXNzYWdlID0gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0XHR3LmlkID0gd29ya2VySWRDb3VudGVyKys7XG5cdFx0d29ya2Vyc1t3LmlkXSA9IHc7XG5cdFx0cmV0dXJuIHc7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiBtYWluIHRocmVhZCByZWNlaXZlcyBhIG1lc3NhZ2UgKi9cblx0ZnVuY3Rpb24gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1ttc2cud29ya2VySWRdO1xuXHRcdHZhciBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHRpZiAobXNnLmVycm9yKVxuXHRcdFx0d29ya2VyLnVzZXJFcnJvcihtc2cuZXJyb3IsIG1zZy5maWxlKTtcblx0XHRlbHNlIGlmIChtc2cucmVzdWx0cyAmJiBtc2cucmVzdWx0cy5kYXRhKVxuXHRcdHtcblx0XHRcdHZhciBhYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCB7IGRhdGE6IFtdLCBlcnJvcnM6IFtdLCBtZXRhOiB7IGFib3J0ZWQ6IHRydWUgfSB9KTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGUgPSB7XG5cdFx0XHRcdGFib3J0OiBhYm9ydCxcblx0XHRcdFx0cGF1c2U6IG5vdEltcGxlbWVudGVkLFxuXHRcdFx0XHRyZXN1bWU6IG5vdEltcGxlbWVudGVkXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlclN0ZXApKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1zZy5yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR3b3JrZXIudXNlclN0ZXAoe1xuXHRcdFx0XHRcdFx0ZGF0YTogW21zZy5yZXN1bHRzLmRhdGFbaV1dLFxuXHRcdFx0XHRcdFx0ZXJyb3JzOiBtc2cucmVzdWx0cy5lcnJvcnMsXG5cdFx0XHRcdFx0XHRtZXRhOiBtc2cucmVzdWx0cy5tZXRhXG5cdFx0XHRcdFx0fSwgaGFuZGxlKTtcblx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcdC8vIGZyZWUgbWVtb3J5IEFTQVBcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHdvcmtlci51c2VyQ2h1bmsobXNnLnJlc3VsdHMsIGhhbmRsZSwgbXNnLmZpbGUpO1xuXHRcdFx0XHRkZWxldGUgbXNnLnJlc3VsdHM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG1zZy5maW5pc2hlZCAmJiAhYWJvcnRlZClcblx0XHRcdGNvbXBsZXRlV29ya2VyKG1zZy53b3JrZXJJZCwgbXNnLnJlc3VsdHMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29tcGxldGVXb3JrZXIod29ya2VySWQsIHJlc3VsdHMpIHtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1t3b3JrZXJJZF07XG5cdFx0aWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDb21wbGV0ZSkpXG5cdFx0XHR3b3JrZXIudXNlckNvbXBsZXRlKHJlc3VsdHMpO1xuXHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcblx0XHRkZWxldGUgd29ya2Vyc1t3b3JrZXJJZF07XG5cdH1cblxuXHRmdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpIHtcblx0XHR0aHJvdyAnTm90IGltcGxlbWVudGVkLic7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiB3b3JrZXIgdGhyZWFkIHJlY2VpdmVzIGEgbWVzc2FnZSAqL1xuXHRmdW5jdGlvbiB3b3JrZXJUaHJlYWRSZWNlaXZlZE1lc3NhZ2UoZSlcblx0e1xuXHRcdHZhciBtc2cgPSBlLmRhdGE7XG5cblx0XHRpZiAodHlwZW9mIFBhcGEuV09SS0VSX0lEID09PSAndW5kZWZpbmVkJyAmJiBtc2cpXG5cdFx0XHRQYXBhLldPUktFUl9JRCA9IG1zZy53b3JrZXJJZDtcblxuXHRcdGlmICh0eXBlb2YgbXNnLmlucHV0ID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRnbG9iYWwucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdHJlc3VsdHM6IFBhcGEucGFyc2UobXNnLmlucHV0LCBtc2cuY29uZmlnKSxcblx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgbXNnLmlucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgbXNnLmlucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gdGhhbmsgeW91LCBTYWZhcmkgKHNlZSBpc3N1ZSAjMTA2KVxuXHRcdHtcblx0XHRcdHZhciByZXN1bHRzID0gUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpO1xuXHRcdFx0aWYgKHJlc3VsdHMpXG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdHJlc3VsdHM6IHJlc3VsdHMsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IHRydWVcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqIE1ha2VzIGEgZGVlcCBjb3B5IG9mIGFuIGFycmF5IG9yIG9iamVjdCAobW9zdGx5KSAqL1xuXHRmdW5jdGlvbiBjb3B5KG9iailcblx0e1xuXHRcdGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jylcblx0XHRcdHJldHVybiBvYmo7XG5cdFx0dmFyIGNweSA9IG9iaiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKVxuXHRcdFx0Y3B5W2tleV0gPSBjb3B5KG9ialtrZXldKTtcblx0XHRyZXR1cm4gY3B5O1xuXHR9XG5cblx0ZnVuY3Rpb24gYmluZEZ1bmN0aW9uKGYsIHNlbGYpXG5cdHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IGYuYXBwbHkoc2VsZiwgYXJndW1lbnRzKTsgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24oZnVuYylcblx0e1xuXHRcdHJldHVybiB0eXBlb2YgZnVuYyA9PT0gJ2Z1bmN0aW9uJztcblx0fVxuXG5cdHJldHVybiBQYXBhO1xufSkpO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qISB0ZXRoZXIgMS40LjAgKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcbiAgfSBlbHNlIHtcbiAgICByb290LlRldGhlciA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIFRldGhlckJhc2UgPSB1bmRlZmluZWQ7XG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIFRldGhlckJhc2UgPSB7IG1vZHVsZXM6IFtdIH07XG59XG5cbnZhciB6ZXJvRWxlbWVudCA9IG51bGw7XG5cbi8vIFNhbWUgYXMgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCwgZXhjZXB0IGl0IHRha2VzIGludG8gYWNjb3VudCBwYXJlbnQgPGZyYW1lPiBvZmZzZXRzXG4vLyBpZiB0aGUgZWxlbWVudCBsaWVzIHdpdGhpbiBhIG5lc3RlZCBkb2N1bWVudCAoPGZyYW1lPiBvciA8aWZyYW1lPi1saWtlKS5cbmZ1bmN0aW9uIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKSB7XG4gIHZhciBib3VuZGluZ1JlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcbiAgLy8gV2UgY2FuJ3QgdXNlIGV4dGVuZCBiZWNhdXNlIHRoZSBwcm9wZXJ0aWVzIGFyZSBub3QgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBvYmplY3QgYnkgaGFzT3duUHJvcGVydHkgaW4gSUU5XG4gIHZhciByZWN0ID0ge307XG4gIGZvciAodmFyIGsgaW4gYm91bmRpbmdSZWN0KSB7XG4gICAgcmVjdFtrXSA9IGJvdW5kaW5nUmVjdFtrXTtcbiAgfVxuXG4gIGlmIChub2RlLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgdmFyIF9mcmFtZUVsZW1lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZnJhbWVFbGVtZW50O1xuICAgIGlmIChfZnJhbWVFbGVtZW50KSB7XG4gICAgICB2YXIgZnJhbWVSZWN0ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KF9mcmFtZUVsZW1lbnQpO1xuICAgICAgcmVjdC50b3AgKz0gZnJhbWVSZWN0LnRvcDtcbiAgICAgIHJlY3QuYm90dG9tICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmxlZnQgKz0gZnJhbWVSZWN0LmxlZnQ7XG4gICAgICByZWN0LnJpZ2h0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWN0O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxQYXJlbnRzKGVsKSB7XG4gIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG4gIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTU0ODM5N1xuICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWwpIHx8IHt9O1xuICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuICB2YXIgcGFyZW50cyA9IFtdO1xuXG4gIGlmIChwb3NpdGlvbiA9PT0gJ2ZpeGVkJykge1xuICAgIHJldHVybiBbZWxdO1xuICB9XG5cbiAgdmFyIHBhcmVudCA9IGVsO1xuICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSAmJiBwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUocGFyZW50KTtcbiAgICB9IGNhdGNoIChlcnIpIHt9XG5cbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAndW5kZWZpbmVkJyB8fCBzdHlsZSA9PT0gbnVsbCkge1xuICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgICByZXR1cm4gcGFyZW50cztcbiAgICB9XG5cbiAgICB2YXIgX3N0eWxlID0gc3R5bGU7XG4gICAgdmFyIG92ZXJmbG93ID0gX3N0eWxlLm92ZXJmbG93O1xuICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuICAgIHZhciBvdmVyZmxvd1kgPSBfc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgaWYgKC8oYXV0b3xzY3JvbGwpLy50ZXN0KG92ZXJmbG93ICsgb3ZlcmZsb3dZICsgb3ZlcmZsb3dYKSkge1xuICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG4gICAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmJvZHkpO1xuXG4gIC8vIElmIHRoZSBub2RlIGlzIHdpdGhpbiBhIGZyYW1lLCBhY2NvdW50IGZvciB0aGUgcGFyZW50IHdpbmRvdyBzY3JvbGxcbiAgaWYgKGVsLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgcGFyZW50cy5wdXNoKGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudHM7XG59XG5cbnZhciB1bmlxdWVJZCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBpZCA9IDA7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICsraWQ7XG4gIH07XG59KSgpO1xuXG52YXIgemVyb1Bvc0NhY2hlID0ge307XG52YXIgZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luKCkge1xuICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG4gIC8vIGppdHRlciBhcyB0aGUgdXNlciBzY3JvbGxzIHRoYXQgbWVzc2VzIHdpdGggb3VyIGFiaWxpdHkgdG8gZGV0ZWN0IGlmIHR3byBwb3NpdGlvbnNcbiAgLy8gYXJlIGVxdWl2aWxhbnQgb3Igbm90LiAgV2UgcGxhY2UgYW4gZWxlbWVudCBhdCB0aGUgdG9wIGxlZnQgb2YgdGhlIHBhZ2UgdGhhdCB3aWxsXG4gIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG4gIHZhciBub2RlID0gemVyb0VsZW1lbnQ7XG4gIGlmICghbm9kZSB8fCAhZG9jdW1lbnQuYm9keS5jb250YWlucyhub2RlKSkge1xuICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcbiAgICBleHRlbmQobm9kZS5zdHlsZSwge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xuXG4gICAgemVyb0VsZW1lbnQgPSBub2RlO1xuICB9XG5cbiAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG4gIGlmICh0eXBlb2YgemVyb1Bvc0NhY2hlW2lkXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB6ZXJvUG9zQ2FjaGVbaWRdID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KG5vZGUpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNhY2hlIHdoZW4gdGhpcyBwb3NpdGlvbiBjYWxsIGlzIGRvbmVcbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xufTtcblxuZnVuY3Rpb24gcmVtb3ZlVXRpbEVsZW1lbnRzKCkge1xuICBpZiAoemVyb0VsZW1lbnQpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHplcm9FbGVtZW50KTtcbiAgfVxuICB6ZXJvRWxlbWVudCA9IG51bGw7XG59O1xuXG5mdW5jdGlvbiBnZXRCb3VuZHMoZWwpIHtcbiAgdmFyIGRvYyA9IHVuZGVmaW5lZDtcbiAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuICAgIGRvYyA9IGRvY3VtZW50O1xuICAgIGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIGRvYyA9IGVsLm93bmVyRG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gIHZhciBib3ggPSBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QoZWwpO1xuXG4gIHZhciBvcmlnaW4gPSBnZXRPcmlnaW4oKTtcblxuICBib3gudG9wIC09IG9yaWdpbi50b3A7XG4gIGJveC5sZWZ0IC09IG9yaWdpbi5sZWZ0O1xuXG4gIGlmICh0eXBlb2YgYm94LndpZHRoID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcbiAgfVxuICBpZiAodHlwZW9mIGJveC5oZWlnaHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG4gIH1cblxuICBib3gudG9wID0gYm94LnRvcCAtIGRvY0VsLmNsaWVudFRvcDtcbiAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG4gIGJveC5yaWdodCA9IGRvYy5ib2R5LmNsaWVudFdpZHRoIC0gYm94LndpZHRoIC0gYm94LmxlZnQ7XG4gIGJveC5ib3R0b20gPSBkb2MuYm9keS5jbGllbnRIZWlnaHQgLSBib3guaGVpZ2h0IC0gYm94LnRvcDtcblxuICByZXR1cm4gYm94O1xufVxuXG5mdW5jdGlvbiBnZXRPZmZzZXRQYXJlbnQoZWwpIHtcbiAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbnZhciBfc2Nyb2xsQmFyU2l6ZSA9IG51bGw7XG5mdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuICBpZiAoX3Njcm9sbEJhclNpemUpIHtcbiAgICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG4gIH1cbiAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpbm5lci5zdHlsZS5oZWlnaHQgPSAnMjAwcHgnO1xuXG4gIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgd2lkdGg6ICcyMDBweCcsXG4gICAgaGVpZ2h0OiAnMTUwcHgnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICB9KTtcblxuICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG4gIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XG4gIHZhciB3aWR0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcbiAgICB3aWR0aFNjcm9sbCA9IG91dGVyLmNsaWVudFdpZHRoO1xuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgdmFyIHdpZHRoID0gd2lkdGhDb250YWluZWQgLSB3aWR0aFNjcm9sbDtcblxuICBfc2Nyb2xsQmFyU2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG4gIHJldHVybiBfc2Nyb2xsQmFyU2l6ZTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cbiAgdmFyIGFyZ3MgPSBbXTtcblxuICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuXG4gIGFyZ3Muc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaikge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCkucmVwbGFjZShyZWdleCwgJyAnKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgaWYgKGNscy50cmltKCkpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgICB2YXIgY2xzID0gZ2V0Q2xhc3NOYW1lKGVsKSArICgnICcgKyBuYW1lKTtcbiAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcbiAgfVxuICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKTtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUgKyAnKCB8JCknLCAnZ2knKS50ZXN0KGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzTmFtZShlbCkge1xuICAvLyBDYW4ndCB1c2UganVzdCBTVkdBbmltYXRlZFN0cmluZyBoZXJlIHNpbmNlIG5vZGVzIHdpdGhpbiBhIEZyYW1lIGluIElFIGhhdmVcbiAgLy8gY29tcGxldGVseSBzZXBhcmF0ZWx5IFNWR0FuaW1hdGVkU3RyaW5nIGJhc2UgY2xhc3Nlc1xuICBpZiAoZWwuY2xhc3NOYW1lIGluc3RhbmNlb2YgZWwub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5TVkdBbmltYXRlZFN0cmluZykge1xuICAgIHJldHVybiBlbC5jbGFzc05hbWUuYmFzZVZhbDtcbiAgfVxuICByZXR1cm4gZWwuY2xhc3NOYW1lO1xufVxuXG5mdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcbiAgLy8gT2YgdGhlIHNldCBvZiAnYWxsJyBjbGFzc2VzLCB3ZSBuZWVkIHRoZSAnYWRkJyBjbGFzc2VzLCBhbmQgb25seSB0aGVcbiAgLy8gJ2FkZCcgY2xhc3NlcyB0byBiZSBzZXQuXG4gIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoYWRkLmluZGV4T2YoY2xzKSA9PT0gLTEgJiYgaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIHJlbW92ZUNsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG5cbiAgYWRkLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgIGFkZENsYXNzKGVsLCBjbHMpO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBkZWZlcnJlZCA9IFtdO1xuXG52YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuICBkZWZlcnJlZC5wdXNoKGZuKTtcbn07XG5cbnZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuICB2YXIgZm4gPSB1bmRlZmluZWQ7XG4gIHdoaWxlIChmbiA9IGRlZmVycmVkLnBvcCgpKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxudmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudGVkKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudGVkKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhFdmVudGVkLCBbe1xuICAgIGtleTogJ29uJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgdmFyIG9uY2UgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1szXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0ucHVzaCh7IGhhbmRsZXI6IGhhbmRsZXIsIGN0eDogY3R4LCBvbmNlOiBvbmNlIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29uY2UnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHRoaXMub24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb2ZmJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb2ZmKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmJpbmRpbmdzW2V2ZW50XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1tldmVudF1baV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICArK2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndHJpZ2dlcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5iaW5kaW5nc1tldmVudF0pIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgX2JpbmRpbmdzJGV2ZW50JGkgPSB0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXTtcbiAgICAgICAgICB2YXIgaGFuZGxlciA9IF9iaW5kaW5ncyRldmVudCRpLmhhbmRsZXI7XG4gICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcbiAgICAgICAgICB2YXIgb25jZSA9IF9iaW5kaW5ncyRldmVudCRpLm9uY2U7XG5cbiAgICAgICAgICB2YXIgY29udGV4dCA9IGN0eDtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG4gICAgICAgICAgaWYgKG9uY2UpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBFdmVudGVkO1xufSkoKTtcblxuVGV0aGVyQmFzZS5VdGlscyA9IHtcbiAgZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0OiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3QsXG4gIGdldFNjcm9sbFBhcmVudHM6IGdldFNjcm9sbFBhcmVudHMsXG4gIGdldEJvdW5kczogZ2V0Qm91bmRzLFxuICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIHVwZGF0ZUNsYXNzZXM6IHVwZGF0ZUNsYXNzZXMsXG4gIGRlZmVyOiBkZWZlcixcbiAgZmx1c2g6IGZsdXNoLFxuICB1bmlxdWVJZDogdW5pcXVlSWQsXG4gIEV2ZW50ZWQ6IEV2ZW50ZWQsXG4gIGdldFNjcm9sbEJhclNpemU6IGdldFNjcm9sbEJhclNpemUsXG4gIHJlbW92ZVV0aWxFbGVtZW50czogcmVtb3ZlVXRpbEVsZW1lbnRzXG59O1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlLCBwZXJmb3JtYW5jZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDYsIF94NywgX3g4KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NiwgcHJvcGVydHkgPSBfeDcsIHJlY2VpdmVyID0gX3g4OyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NiA9IHBhcmVudDsgX3g3ID0gcHJvcGVydHk7IF94OCA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBkZXNjID0gcGFyZW50ID0gdW5kZWZpbmVkOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5pZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG4gIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG59XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0U2Nyb2xsUGFyZW50cyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbFBhcmVudHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIGdldE9mZnNldFBhcmVudCA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldE9mZnNldFBhcmVudDtcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcbnZhciByZW1vdmVDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnJlbW92ZUNsYXNzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG52YXIgZmx1c2ggPSBfVGV0aGVyQmFzZSRVdGlscy5mbHVzaDtcbnZhciBnZXRTY3JvbGxCYXJTaXplID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsQmFyU2l6ZTtcbnZhciByZW1vdmVVdGlsRWxlbWVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVVdGlsRWxlbWVudHM7XG5cbmZ1bmN0aW9uIHdpdGhpbihhLCBiKSB7XG4gIHZhciBkaWZmID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gMSA6IGFyZ3VtZW50c1syXTtcblxuICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xufVxuXG52YXIgdHJhbnNmb3JtS2V5ID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgdmFyIHRyYW5zZm9ybXMgPSBbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nLCAnT1RyYW5zZm9ybScsICdNb3pUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFuc2Zvcm1zLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG4gICAgaWYgKGVsLnN0eWxlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gIH1cbn0pKCk7XG5cbnZhciB0ZXRoZXJzID0gW107XG5cbnZhciBwb3NpdGlvbiA9IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlcikge1xuICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG4gIH0pO1xuICBmbHVzaCgpO1xufTtcblxuZnVuY3Rpb24gbm93KCkge1xuICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfVxuICByZXR1cm4gK25ldyBEYXRlKCk7XG59XG5cbihmdW5jdGlvbiAoKSB7XG4gIHZhciBsYXN0Q2FsbCA9IG51bGw7XG4gIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuICB2YXIgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuXG4gIHZhciB0aWNrID0gZnVuY3Rpb24gdGljaygpIHtcbiAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcbiAgICAgIC8vIFdlIHZvbHVudGFyaWx5IHRocm90dGxlIG91cnNlbHZlcyBpZiB3ZSBjYW4ndCBtYW5hZ2UgNjBmcHNcbiAgICAgIGxhc3REdXJhdGlvbiA9IE1hdGgubWluKGxhc3REdXJhdGlvbiAtIDE2LCAyNTApO1xuXG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gc2V0VGltZW91dCh0aWNrLCAyNTApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbGFzdENhbGwgIT09ICd1bmRlZmluZWQnICYmIG5vdygpIC0gbGFzdENhbGwgPCAxMCkge1xuICAgICAgLy8gU29tZSBicm93c2VycyBjYWxsIGV2ZW50cyBhIGxpdHRsZSB0b28gZnJlcXVlbnRseSwgcmVmdXNlIHRvIHJ1biBtb3JlIHRoYW4gaXMgcmVhc29uYWJsZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwZW5kaW5nVGltZW91dCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuICAgICAgcGVuZGluZ1RpbWVvdXQgPSBudWxsO1xuICAgIH1cblxuICAgIGxhc3RDYWxsID0gbm93KCk7XG4gICAgcG9zaXRpb24oKTtcbiAgICBsYXN0RHVyYXRpb24gPSBub3coKSAtIGxhc3RDYWxsO1xuICB9O1xuXG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgWydyZXNpemUnLCAnc2Nyb2xsJywgJ3RvdWNobW92ZSddLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdGljayk7XG4gICAgfSk7XG4gIH1cbn0pKCk7XG5cbnZhciBNSVJST1JfTFIgPSB7XG4gIGNlbnRlcjogJ2NlbnRlcicsXG4gIGxlZnQ6ICdyaWdodCcsXG4gIHJpZ2h0OiAnbGVmdCdcbn07XG5cbnZhciBNSVJST1JfVEIgPSB7XG4gIG1pZGRsZTogJ21pZGRsZScsXG4gIHRvcDogJ2JvdHRvbScsXG4gIGJvdHRvbTogJ3RvcCdcbn07XG5cbnZhciBPRkZTRVRfTUFQID0ge1xuICB0b3A6IDAsXG4gIGxlZnQ6IDAsXG4gIG1pZGRsZTogJzUwJScsXG4gIGNlbnRlcjogJzUwJScsXG4gIGJvdHRvbTogJzEwMCUnLFxuICByaWdodDogJzEwMCUnXG59O1xuXG52YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuICAgIGxlZnQgPSBNSVJST1JfTFJbcmVsYXRpdmVUb0F0dGFjaG1lbnQubGVmdF07XG4gIH1cblxuICBpZiAodG9wID09PSAnYXV0bycpIHtcbiAgICB0b3AgPSBNSVJST1JfVEJbcmVsYXRpdmVUb0F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG52YXIgYXR0YWNobWVudFRvT2Zmc2V0ID0gZnVuY3Rpb24gYXR0YWNobWVudFRvT2Zmc2V0KGF0dGFjaG1lbnQpIHtcbiAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG4gIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcbiAgfVxuXG4gIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG59O1xuXG5mdW5jdGlvbiBhZGRPZmZzZXQoKSB7XG4gIHZhciBvdXQgPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgb2Zmc2V0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcbiAgICB2YXIgbGVmdCA9IF9yZWYubGVmdDtcblxuICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuICAgICAgdG9wID0gcGFyc2VGbG9hdCh0b3AsIDEwKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgbGVmdCA9IHBhcnNlRmxvYXQobGVmdCwgMTApO1xuICAgIH1cblxuICAgIG91dC50b3AgKz0gdG9wO1xuICAgIG91dC5sZWZ0ICs9IGxlZnQ7XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG9mZnNldFRvUHgob2Zmc2V0LCBzaXplKSB7XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQubGVmdCA9IHBhcnNlRmxvYXQob2Zmc2V0LmxlZnQsIDEwKSAvIDEwMCAqIHNpemUud2lkdGg7XG4gIH1cbiAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcbiAgICBvZmZzZXQudG9wID0gcGFyc2VGbG9hdChvZmZzZXQudG9wLCAxMCkgLyAxMDAgKiBzaXplLmhlaWdodDtcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQ7XG59XG5cbnZhciBwYXJzZU9mZnNldCA9IGZ1bmN0aW9uIHBhcnNlT2Zmc2V0KHZhbHVlKSB7XG4gIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG4gIHZhciBfdmFsdWUkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX3ZhbHVlJHNwbGl0LCAyKTtcblxuICB2YXIgdG9wID0gX3ZhbHVlJHNwbGl0MlswXTtcbiAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG4gIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG59O1xudmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG52YXIgVGV0aGVyQ2xhc3MgPSAoZnVuY3Rpb24gKF9FdmVudGVkKSB7XG4gIF9pbmhlcml0cyhUZXRoZXJDbGFzcywgX0V2ZW50ZWQpO1xuXG4gIGZ1bmN0aW9uIFRldGhlckNsYXNzKG9wdGlvbnMpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRldGhlckNsYXNzLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuICAgIHRldGhlcnMucHVzaCh0aGlzKTtcblxuICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuXG4gICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuICAgIFRldGhlckJhc2UubW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChtb2R1bGUpIHtcbiAgICAgIGlmICh0eXBlb2YgbW9kdWxlLmluaXRpYWxpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wb3NpdGlvbigpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFRldGhlckNsYXNzLCBbe1xuICAgIGtleTogJ2dldENsYXNzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q2xhc3MoKSB7XG4gICAgICB2YXIga2V5ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJycgOiBhcmd1bWVudHNbMF07XG4gICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG4gICAgICBpZiAodHlwZW9mIGNsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIGNsYXNzZXNba2V5XSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzZXNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXggKyAnLScgKyBrZXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3NldE9wdGlvbnMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRPZmZzZXQ6ICcwIDAnLFxuICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnYXV0byBhdXRvJyxcbiAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG4gICAgICB9O1xuXG4gICAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICB2YXIgZWxlbWVudCA9IF9vcHRpb25zLmVsZW1lbnQ7XG4gICAgICB2YXIgdGFyZ2V0ID0gX29wdGlvbnMudGFyZ2V0O1xuICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSAndmlld3BvcnQnKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXQgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG4gICAgICB9XG5cbiAgICAgIFsnZWxlbWVudCcsICd0YXJnZXQnXS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogQm90aCBlbGVtZW50IGFuZCB0YXJnZXQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IF90aGlzMltrZXldWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygndGFyZ2V0JykpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRhY2htZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBZb3UgbXVzdCBwcm92aWRlIGFuIGF0dGFjaG1lbnQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50YXJnZXRBdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy50YXJnZXRBdHRhY2htZW50KTtcbiAgICAgIHRoaXMuYXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMuYXR0YWNobWVudCk7XG4gICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuICAgICAgdGhpcy50YXJnZXRPZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMudGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cyA9IFt0aGlzLnRhcmdldF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBnZXRTY3JvbGxQYXJlbnRzKHRoaXMudGFyZ2V0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlKSkge1xuICAgICAgICB0aGlzLmVuYWJsZShwb3MpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFRhcmdldEJvdW5kcygpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdG9wOiBwYWdlWU9mZnNldCwgbGVmdDogcGFnZVhPZmZzZXQsIGhlaWdodDogaW5uZXJIZWlnaHQsIHdpZHRoOiBpbm5lcldpZHRoIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXG4gICAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBib3VuZHMud2lkdGgsXG4gICAgICAgICAgICAgIHRvcDogYm91bmRzLnRvcCxcbiAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0IC0gYm91bmRzLnRvcCkpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihpbm5lckhlaWdodCwgb3V0LmhlaWdodCk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0IC09IDI7XG5cbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0ICsgaW5uZXJXaWR0aCkpKTtcbiAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKGlubmVyV2lkdGgsIG91dC53aWR0aCk7XG4gICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuICAgICAgICAgICAgaWYgKG91dC50b3AgPCBwYWdlWU9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQudG9wID0gcGFnZVlPZmZzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3V0LmxlZnQgPCBwYWdlWE9mZnNldCkge1xuICAgICAgICAgICAgICBvdXQubGVmdCA9IHBhZ2VYT2Zmc2V0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgICB2YXIgYm91bmRzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgICAgICAgIGJvdW5kcyA9IHtcbiAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG4gICAgICAgICAgICAgIHRvcDogcGFnZVlPZmZzZXQsXG4gICAgICAgICAgICAgIGhlaWdodDogaW5uZXJIZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XG5cbiAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgICAgdmFyIHNjcm9sbEJvdHRvbSA9IDA7XG4gICAgICAgICAgaWYgKGhhc0JvdHRvbVNjcm9sbCkge1xuICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGhlaWdodCA9IGJvdW5kcy5oZWlnaHQgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKSAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpIC0gc2Nyb2xsQm90dG9tO1xuXG4gICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAxNSxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICogMC45NzUgKiAoaGVpZ2h0IC8gdGFyZ2V0LnNjcm9sbEhlaWdodCksXG4gICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBmaXRBZGogPSAwO1xuICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGZpdEFkaiA9IC0wLjAwMDExICogTWF0aC5wb3coaGVpZ2h0LCAyKSAtIDAuMDA3MjcgKiBoZWlnaHQgKyAyMi41ODtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG4gICAgICAgICAgb3V0LnRvcCA9IHNjcm9sbFBlcmNlbnRhZ2UgKiAoaGVpZ2h0IC0gb3V0LmhlaWdodCAtIGZpdEFkaikgKyBib3VuZHMudG9wICsgcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCk7XG5cbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnY2xlYXJDYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NhY2hlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG4gICAgICAvLyBNb3JlIHRoYW4gb25lIG1vZHVsZSB3aWxsIG9mdGVuIG5lZWQgdGhlIHNhbWUgRE9NIGluZm8sIHNvXG4gICAgICAvLyB3ZSBrZWVwIGEgY2FjaGUgd2hpY2ggaXMgY2xlYXJlZCBvbiBlYWNoIHBvc2l0aW9uIGNhbGxcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlW2tdID0gZ2V0dGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdlbmFibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbmFibGUoKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB9XG4gICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgIGlmIChwYXJlbnQgIT09IF90aGlzMy50YXJnZXQub3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIHBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdGhpczMucG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHBvcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGlzYWJsZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICByZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXM0LnBvc2l0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGVzdHJveScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cbiAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG4gICAgICAgIGlmICh0ZXRoZXIgPT09IF90aGlzNSkge1xuICAgICAgICAgIHRldGhlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVtb3ZlIGFueSBlbGVtZW50cyB3ZSB3ZXJlIHVzaW5nIGZvciBjb252ZW5pZW5jZSBmcm9tIHRoZSBET01cbiAgICAgIGlmICh0ZXRoZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZW1vdmVVdGlsRWxlbWVudHMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVBdHRhY2hDbGFzc2VzJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlQXR0YWNoQ2xhc3NlcyhlbGVtZW50QXR0YWNoLCB0YXJnZXRBdHRhY2gpIHtcbiAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICBlbGVtZW50QXR0YWNoID0gZWxlbWVudEF0dGFjaCB8fCB0aGlzLmF0dGFjaG1lbnQ7XG4gICAgICB0YXJnZXRBdHRhY2ggPSB0YXJnZXRBdHRhY2ggfHwgdGhpcy50YXJnZXRBdHRhY2htZW50O1xuICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIHVwZGF0ZUF0dGFjaENsYXNzZXMgY2FuIGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBpbiBhIHBvc2l0aW9uIGNhbGwsIHNvXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcbiAgICAgICAgLy8gcmFuIGl0IGRvZXNuJ3QgYWRkIGFueSBleHRyYSBjbGFzc2VzIGZyb20gcHJldmlvdXMgY2FsbHMuXG4gICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMuc3BsaWNlKDAsIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYWRkID0gdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcztcblxuICAgICAgaWYgKGVsZW1lbnRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRBdHRhY2gudG9wKSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLmxlZnQpIHtcbiAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhbGwgPSBbXTtcbiAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgYWxsLnB1c2goX3RoaXM2LmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCEodHlwZW9mIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYuZWxlbWVudCwgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuICAgICAgICBpZiAoIShfdGhpczYub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNi50YXJnZXQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdwb3NpdGlvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHBvc2l0aW9uKCkge1xuICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cbiAgICAgIHZhciBmbHVzaENoYW5nZXMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAvLyBmbHVzaENoYW5nZXMgY29tbWl0cyB0aGUgY2hhbmdlcyBpbW1lZGlhdGVseSwgbGVhdmUgdHJ1ZSB1bmxlc3MgeW91IGFyZSBwb3NpdGlvbmluZyBtdWx0aXBsZVxuICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG4gICAgICAvLyBUdXJuICdhdXRvJyBhdHRhY2htZW50cyBpbnRvIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIgb3IgZWRnZVxuICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgICB0aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXModGhpcy5hdHRhY2htZW50LCB0YXJnZXRBdHRhY2htZW50KTtcblxuICAgICAgdmFyIGVsZW1lbnRQb3MgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczcuZWxlbWVudCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHdpZHRoID0gZWxlbWVudFBvcy53aWR0aDtcbiAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuICAgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuICAgICAgICAvLyBnZXR0aW5nIGhpZGRlbi5cbiAgICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxhc3RTaXplID0geyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG4gICAgICB9XG5cbiAgICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXM3LmdldFRhcmdldEJvdW5kcygpO1xuICAgICAgfSk7XG4gICAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRhcmdldFBvcztcblxuICAgICAgLy8gR2V0IGFuIGFjdHVhbCBweCBvZmZzZXQgZnJvbSB0aGUgYXR0YWNobWVudFxuICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcbiAgICAgIHZhciB0YXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0YXJnZXRBdHRhY2htZW50KSwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIHZhciBtYW51YWxPZmZzZXQgPSBvZmZzZXRUb1B4KHRoaXMub2Zmc2V0LCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cbiAgICAgIC8vIEFkZCB0aGUgbWFudWFsbHkgcHJvdmlkZWQgb2Zmc2V0XG4gICAgICBvZmZzZXQgPSBhZGRPZmZzZXQob2Zmc2V0LCBtYW51YWxPZmZzZXQpO1xuICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuICAgICAgLy8gSXQncyBub3cgb3VyIGdvYWwgdG8gbWFrZSAoZWxlbWVudCBwb3NpdGlvbiArIG9mZnNldCkgPT0gKHRhcmdldCBwb3NpdGlvbiArIHRhcmdldCBvZmZzZXQpXG4gICAgICB2YXIgbGVmdCA9IHRhcmdldFBvcy5sZWZ0ICsgdGFyZ2V0T2Zmc2V0LmxlZnQgLSBvZmZzZXQubGVmdDtcbiAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVGV0aGVyQmFzZS5tb2R1bGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBfbW9kdWxlMiA9IFRldGhlckJhc2UubW9kdWxlc1tpXTtcbiAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRQb3M6IHRhcmdldFBvcyxcbiAgICAgICAgICBlbGVtZW50UG9zOiBlbGVtZW50UG9zLFxuICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgIHRhcmdldE9mZnNldDogdGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbE9mZnNldDogbWFudWFsT2Zmc2V0LFxuICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuICAgICAgICAgIHNjcm9sbGJhclNpemU6IHNjcm9sbGJhclNpemUsXG4gICAgICAgICAgYXR0YWNobWVudDogdGhpcy5hdHRhY2htZW50XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wID0gcmV0LnRvcDtcbiAgICAgICAgICBsZWZ0ID0gcmV0LmxlZnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2UgZGVzY3JpYmUgdGhlIHBvc2l0aW9uIHRocmVlIGRpZmZlcmVudCB3YXlzIHRvIGdpdmUgdGhlIG9wdGltaXplclxuICAgICAgLy8gYSBjaGFuY2UgdG8gZGVjaWRlIHRoZSBiZXN0IHBvc3NpYmxlIHdheSB0byBwb3NpdGlvbiB0aGUgZWxlbWVudFxuICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuICAgICAgdmFyIG5leHQgPSB7XG4gICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHBhZ2UgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcbiAgICAgICAgcGFnZToge1xuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIGxlZnQ6IGxlZnRcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICAgIHZpZXdwb3J0OiB7XG4gICAgICAgICAgdG9wOiB0b3AgLSBwYWdlWU9mZnNldCxcbiAgICAgICAgICBib3R0b206IHBhZ2VZT2Zmc2V0IC0gdG9wIC0gaGVpZ2h0ICsgaW5uZXJIZWlnaHQsXG4gICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgIHJpZ2h0OiBwYWdlWE9mZnNldCAtIGxlZnQgLSB3aWR0aCArIGlubmVyV2lkdGhcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRvYyA9IHRoaXMudGFyZ2V0Lm93bmVyRG9jdW1lbnQ7XG4gICAgICB2YXIgd2luID0gZG9jLmRlZmF1bHRWaWV3O1xuXG4gICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmICh3aW4uaW5uZXJIZWlnaHQgPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcbiAgICAgICAgbmV4dC52aWV3cG9ydC5ib3R0b20gLT0gc2Nyb2xsYmFyU2l6ZS5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW4uaW5uZXJXaWR0aCA+IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQucmlnaHQgLT0gc2Nyb2xsYmFyU2l6ZS53aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jLmJvZHkuc3R5bGUucG9zaXRpb24pID09PSAtMSB8fCBbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnBhcmVudEVsZW1lbnQuc3R5bGUucG9zaXRpb24pID09PSAtMSkge1xuICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG4gICAgICAgIG5leHQucGFnZS5ib3R0b20gPSBkb2MuYm9keS5zY3JvbGxIZWlnaHQgLSB0b3AgLSBoZWlnaHQ7XG4gICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gbGVmdCAtIHdpZHRoO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM3LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBvc2l0aW9uID0gX3RoaXM3LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuICAgICAgICAgIHZhciBvZmZzZXRCb3JkZXIgPSB7fTtcbiAgICAgICAgICBbJ1RvcCcsICdMZWZ0JywgJ0JvdHRvbScsICdSaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5yaWdodCA9IGRvYy5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24uYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0UG9zaXRpb24udG9wIC0gb2Zmc2V0UGFyZW50U2l6ZS5oZWlnaHQgKyBvZmZzZXRCb3JkZXIuYm90dG9tO1xuXG4gICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuICAgICAgICAgICAgaWYgKG5leHQucGFnZS5sZWZ0ID49IG9mZnNldFBvc2l0aW9uLmxlZnQgKyBvZmZzZXRCb3JkZXIubGVmdCAmJiBuZXh0LnBhZ2UucmlnaHQgPj0gb2Zmc2V0UG9zaXRpb24ucmlnaHQpIHtcbiAgICAgICAgICAgICAgLy8gV2UncmUgd2l0aGluIHRoZSB2aXNpYmxlIHBhcnQgb2YgdGhlIHRhcmdldCdzIHNjcm9sbCBwYXJlbnRcbiAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxMZWZ0ID0gb2Zmc2V0UGFyZW50LnNjcm9sbExlZnQ7XG5cbiAgICAgICAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cbiAgICAgICAgICAgICAgbmV4dC5vZmZzZXQgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBuZXh0LnBhZ2UudG9wIC0gb2Zmc2V0UG9zaXRpb24udG9wICsgc2Nyb2xsVG9wIC0gb2Zmc2V0Qm9yZGVyLnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuICAgICAgLy8gbG9va2luZyBhdCB0aGUgYm9keSwgYnV0IHdlJ3JlIGdvbm5hIGdldCBkaW1pbmlzaGluZyByZXR1cm5zLlxuXG4gICAgICB0aGlzLm1vdmUobmV4dCk7XG5cbiAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG4gICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IDMpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmx1c2hDaGFuZ2VzKSB7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRIRSBJU1NVRVxuICB9LCB7XG4gICAga2V5OiAnbW92ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgaWYgKCEodHlwZW9mIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2FtZSA9IHt9O1xuXG4gICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuICAgICAgICBzYW1lW3R5cGVdID0ge307XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHBvc1t0eXBlXSkge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpc3RvcnkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IHRoaXMuaGlzdG9yeVtpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGNzcyA9IHsgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgYm90dG9tOiAnJyB9O1xuXG4gICAgICB2YXIgdHJhbnNjcmliZSA9IGZ1bmN0aW9uIHRyYW5zY3JpYmUoX3NhbWUsIF9wb3MpIHtcbiAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBncHUgPSBoYXNPcHRpbWl6YXRpb25zID8gX3RoaXM4Lm9wdGlvbnMub3B0aW1pemF0aW9ucy5ncHUgOiBudWxsO1xuICAgICAgICBpZiAoZ3B1ICE9PSBmYWxzZSkge1xuICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB4UG9zID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcbiAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuICAgICAgICAgICAgeVBvcyA9IF9wb3MudG9wO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSAtX3Bvcy5ib3R0b207XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcbiAgICAgICAgICAgIGNzcy5sZWZ0ID0gMDtcbiAgICAgICAgICAgIHhQb3MgPSBfcG9zLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gLV9wb3MucmlnaHQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKSB7XG4gICAgICAgICAgICAvLyBIdWJTcG90L3RldGhlciMyMDdcbiAgICAgICAgICAgIHZhciByZXRpbmEgPSB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMS4zZHBweCknKS5tYXRjaGVzIHx8IHdpbmRvdy5tYXRjaE1lZGlhKCdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMS4zKScpLm1hdGNoZXM7XG4gICAgICAgICAgICBpZiAoIXJldGluYSkge1xuICAgICAgICAgICAgICB4UG9zID0gTWF0aC5yb3VuZCh4UG9zKTtcbiAgICAgICAgICAgICAgeVBvcyA9IE1hdGgucm91bmQoeVBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gPSAndHJhbnNsYXRlWCgnICsgeFBvcyArICdweCkgdHJhbnNsYXRlWSgnICsgeVBvcyArICdweCknO1xuXG4gICAgICAgICAgaWYgKHRyYW5zZm9ybUtleSAhPT0gJ21zVHJhbnNmb3JtJykge1xuICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG4gICAgICAgICAgICAvLyBidXQgSUU5IGRvZXNuJ3Qgc3VwcG9ydCAzZCB0cmFuc2Zvcm1zIGFuZCB3aWxsIGNob2tlLlxuICAgICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gKz0gXCIgdHJhbnNsYXRlWigwKVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MuYm90dG9tID0gX3Bvcy5ib3R0b20gKyAncHgnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IF9wb3MubGVmdCArICdweCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzcy5yaWdodCA9IF9wb3MucmlnaHQgKyAncHgnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIG1vdmVkID0gZmFsc2U7XG4gICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZShzYW1lLnBhZ2UsIHBvcy5wYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS52aWV3cG9ydCwgcG9zLnZpZXdwb3J0KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzOC5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM4LnRhcmdldCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIF90aGlzOC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM4LmVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG4gICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9KSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdHJhbnNjcmliZSh7IHRvcDogdHJ1ZSwgbGVmdDogdHJ1ZSB9LCBwb3MucGFnZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghbW92ZWQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudCkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuICAgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQub3duZXJEb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFueSBjc3MgY2hhbmdlIHdpbGwgdHJpZ2dlciBhIHJlcGFpbnQsIHNvIGxldCdzIGF2b2lkIG9uZSBpZiBub3RoaW5nIGNoYW5nZWRcbiAgICAgIHZhciB3cml0ZUNTUyA9IHt9O1xuICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gY3NzKSB7XG4gICAgICAgIHZhciB2YWwgPSBjc3Nba2V5XTtcbiAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cbiAgICAgICAgaWYgKGVsVmFsICE9PSB2YWwpIHtcbiAgICAgICAgICB3cml0ZSA9IHRydWU7XG4gICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAod3JpdGUpIHtcbiAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGV4dGVuZChfdGhpczguZWxlbWVudC5zdHlsZSwgd3JpdGVDU1MpO1xuICAgICAgICAgIF90aGlzOC50cmlnZ2VyKCdyZXBvc2l0aW9uZWQnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFRldGhlckNsYXNzO1xufSkoRXZlbnRlZCk7XG5cblRldGhlckNsYXNzLm1vZHVsZXMgPSBbXTtcblxuVGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG52YXIgVGV0aGVyID0gZXh0ZW5kKFRldGhlckNsYXNzLCBUZXRoZXJCYXNlKTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxudmFyIEJPVU5EU19GT1JNQVQgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXG5mdW5jdGlvbiBnZXRCb3VuZGluZ1JlY3QodGV0aGVyLCB0bykge1xuICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG4gICAgdG8gPSB0ZXRoZXIuc2Nyb2xsUGFyZW50c1swXTtcbiAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcbiAgICB0byA9IFtwYWdlWE9mZnNldCwgcGFnZVlPZmZzZXQsIGlubmVyV2lkdGggKyBwYWdlWE9mZnNldCwgaW5uZXJIZWlnaHQgKyBwYWdlWU9mZnNldF07XG4gIH1cblxuICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG4gICAgdG8gPSB0by5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cblxuICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbm9kZSA9IHRvO1xuICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuICAgICAgdmFyIHBvcyA9IHNpemU7XG4gICAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRvKTtcblxuICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuICAgICAgLy8gQWNjb3VudCBhbnkgcGFyZW50IEZyYW1lcyBzY3JvbGwgb2Zmc2V0XG4gICAgICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICB2YXIgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgICB0b1swXSArPSB3aW4ucGFnZVhPZmZzZXQ7XG4gICAgICAgIHRvWzFdICs9IHdpbi5wYWdlWU9mZnNldDtcbiAgICAgICAgdG9bMl0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1szXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICB9XG5cbiAgICAgIEJPVU5EU19GT1JNQVQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSwgaSkge1xuICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG4gICAgICAgIGlmIChzaWRlID09PSAnVG9wJyB8fCBzaWRlID09PSAnTGVmdCcpIHtcbiAgICAgICAgICB0b1tpXSArPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b1tpXSAtPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgfVxuXG4gIHJldHVybiB0bztcbn1cblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG4gICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBfcmVmLnRhcmdldEF0dGFjaG1lbnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25zdHJhaW50cykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuICAgICAgLy8gdGhlIGNsYXNzZXMgaW4gYW5kIG91dFxuICAgICAgd2lkdGggPSBfbGFzdFNpemUud2lkdGg7XG4gICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgIH1cblxuICAgIHZhciB0YXJnZXRTaXplID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICB9KTtcblxuICAgIHZhciB0YXJnZXRIZWlnaHQgPSB0YXJnZXRTaXplLmhlaWdodDtcbiAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbdGhpcy5nZXRDbGFzcygncGlubmVkJyksIHRoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKV07XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICB2YXIgcGlubmVkQ2xhc3MgPSBjb25zdHJhaW50LnBpbm5lZENsYXNzO1xuXG4gICAgICBpZiAob3V0T2ZCb3VuZHNDbGFzcykge1xuICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKGNscyArICctJyArIHNpZGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcbiAgICB2YXIgZUF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRoaXMuYXR0YWNobWVudCk7XG5cbiAgICB0aGlzLm9wdGlvbnMuY29uc3RyYWludHMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RyYWludCkge1xuICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcbiAgICAgIHZhciBhdHRhY2htZW50ID0gY29uc3RyYWludC5hdHRhY2htZW50O1xuICAgICAgdmFyIHBpbiA9IGNvbnN0cmFpbnQucGluO1xuXG4gICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGF0dGFjaG1lbnQgPSAnJztcbiAgICAgIH1cblxuICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG4gICAgICAgICAgY2hhbmdlQXR0YWNoWSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChhdHRhY2htZW50LmluZGV4T2YoJyAnKSA+PSAwKSB7XG4gICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX2F0dGFjaG1lbnQkc3BsaXQsIDIpO1xuXG4gICAgICAgIGNoYW5nZUF0dGFjaFkgPSBfYXR0YWNobWVudCRzcGxpdDJbMF07XG4gICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gY2hhbmdlQXR0YWNoWSA9IGF0dGFjaG1lbnQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoX3RoaXMsIHRvKTtcblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nICYmIHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnICYmIHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0b3AgLSAoaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0KSA+PSBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0gJiYgdG9wICsgKGhlaWdodCAqIDIgLSB0YXJnZXRIZWlnaHQpIDw9IGJvdW5kc1szXSkge1xuICAgICAgICAgICAgdG9wICs9IGhlaWdodCAtIHRhcmdldEhlaWdodDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuICAgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH0gZWxzZSBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndG9nZXRoZXInKSB7XG4gICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wIC09IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHBpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGluID0gcGluLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAocGluID09PSB0cnVlKSB7XG4gICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgICB9XG5cbiAgICAgIHBpbiA9IHBpbiB8fCBbXTtcblxuICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuICAgICAgdmFyIG9vYiA9IFtdO1xuXG4gICAgICBpZiAodG9wIDwgYm91bmRzWzFdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1sxXTtcbiAgICAgICAgICBwaW5uZWQucHVzaCgndG9wJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3RvcCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG4gICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdib3R0b20nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdsZWZ0JykgPj0gMCkge1xuICAgICAgICAgIGxlZnQgPSBib3VuZHNbMF07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvb2IucHVzaCgnbGVmdCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzJdIC0gd2lkdGg7XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ3JpZ2h0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLmdldENsYXNzKCdwaW5uZWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuICAgICAgICAgIHBpbm5lZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgb29iQ2xhc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyk7XG4gICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyArICctJyArIHNpZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ2xlZnQnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdyaWdodCcpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChwaW5uZWQuaW5kZXhPZigndG9wJykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCAhPT0gdGFyZ2V0QXR0YWNobWVudC50b3AgfHwgdEF0dGFjaG1lbnQubGVmdCAhPT0gdGFyZ2V0QXR0YWNobWVudC5sZWZ0IHx8IGVBdHRhY2htZW50LnRvcCAhPT0gX3RoaXMuYXR0YWNobWVudC50b3AgfHwgZUF0dGFjaG1lbnQubGVmdCAhPT0gX3RoaXMuYXR0YWNobWVudC5sZWZ0KSB7XG4gICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcbiAgICAgICAgX3RoaXMudHJpZ2dlcigndXBkYXRlJywge1xuICAgICAgICAgIGF0dGFjaG1lbnQ6IGVBdHRhY2htZW50LFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRBdHRhY2htZW50XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG52YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuVGV0aGVyQmFzZS5tb2R1bGVzLnB1c2goe1xuICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRzKF90aGlzLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gX2NhY2hlLndpZHRoO1xuXG4gICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cbiAgICB2YXIgYm90dG9tID0gdG9wICsgaGVpZ2h0O1xuICAgIHZhciByaWdodCA9IGxlZnQgKyB3aWR0aDtcblxuICAgIHZhciBhYnV0dGVkID0gW107XG4gICAgaWYgKHRvcCA8PSB0YXJnZXRQb3MuYm90dG9tICYmIGJvdHRvbSA+PSB0YXJnZXRQb3MudG9wKSB7XG4gICAgICBbJ2xlZnQnLCAncmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gbGVmdCB8fCB0YXJnZXRQb3NTaWRlID09PSByaWdodCkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG4gICAgICBbJ3RvcCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGFsbENsYXNzZXMgPSBbXTtcbiAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG4gICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcbiAgICBhbGxDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhbGxDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcbiAgICB9XG5cbiAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcbiAgICAgIGFkZENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgfSk7XG5cbiAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn0pO1xuLyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zaGlmdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdDtcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5zaGlmdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuICAgIH1cblxuICAgIHZhciBzaGlmdFRvcCA9IHVuZGVmaW5lZCxcbiAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2Ygc2hpZnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzaGlmdCA9IHNoaWZ0LnNwbGl0KCcgJyk7XG4gICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG4gICAgICB2YXIgX3NoaWZ0ID0gc2hpZnQ7XG5cbiAgICAgIHZhciBfc2hpZnQyID0gX3NsaWNlZFRvQXJyYXkoX3NoaWZ0LCAyKTtcblxuICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuICAgICAgc2hpZnRMZWZ0ID0gX3NoaWZ0MlsxXTtcblxuICAgICAgc2hpZnRUb3AgPSBwYXJzZUZsb2F0KHNoaWZ0VG9wLCAxMCk7XG4gICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGlmdFRvcCA9IHNoaWZ0LnRvcDtcbiAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG4gICAgfVxuXG4gICAgdG9wICs9IHNoaWZ0VG9wO1xuICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG4gICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgfVxufSk7XG5yZXR1cm4gVGV0aGVyO1xuXG59KSk7XG4iLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCJpbXBvcnQge1BvaW50fSBmcm9tIFwiLi9nZW9tL1BvaW50XCI7XHJcbmltcG9ydCB7UmVjdH0gZnJvbSBcIi4vZ2VvbS9SZWN0XCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRDZWxsfSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbFwiO1xyXG5pbXBvcnQge0RlZmF1bHRHcmlkQ29sdW1ufSBmcm9tIFwiLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkQ29sdW1uXCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRNb2RlbH0gZnJvbSBcIi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsXCI7XHJcbmltcG9ydCB7RGVmYXVsdEdyaWRSb3d9IGZyb20gXCIuL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3dcIjtcclxuaW1wb3J0IHtTdHlsZX0gZnJvbSBcIi4vbW9kZWwvc3R5bGVkL1N0eWxlXCI7XHJcbmltcG9ydCB7U3R5bGVkR3JpZENlbGx9IGZyb20gXCIuL21vZGVsL3N0eWxlZC9TdHlsZWRHcmlkQ2VsbFwiO1xyXG5pbXBvcnQge0dyaWRSYW5nZX0gZnJvbSBcIi4vbW9kZWwvR3JpZFJhbmdlXCI7XHJcbmltcG9ydCB7R3JpZEVsZW1lbnR9IGZyb20gXCIuL3VpL0dyaWRFbGVtZW50XCI7XHJcbmltcG9ydCB7R3JpZEtlcm5lbH0gZnJvbSBcIi4vdWkvR3JpZEtlcm5lbFwiO1xyXG5pbXBvcnQge0Fic1dpZGdldEJhc2V9IGZyb20gXCIuL3VpL1dpZGdldFwiO1xyXG5pbXBvcnQge0V2ZW50RW1pdHRlckJhc2V9IGZyb20gXCIuL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlclwiO1xyXG5pbXBvcnQge2NvbW1hbmQsIHZhcmlhYmxlLCByb3V0aW5lLCByZW5kZXJlciwgdmlzdWFsaXplfSBmcm9tIFwiLi91aS9FeHRlbnNpYmlsaXR5XCI7XHJcbmltcG9ydCB7Q2xpcGJvYXJkRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9DbGlwYm9hcmRFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtFZGl0aW5nRXh0ZW5zaW9uLCBHcmlkQ2hhbmdlU2V0fSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbW1vbi9FZGl0aW5nRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7U2Nyb2xsZXJFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tbW9uL1Njcm9sbGVyRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7U2VsZWN0b3JFeHRlbnNpb259IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tbW9uL1NlbGVjdG9yRXh0ZW5zaW9uXCI7XHJcbmltcG9ydCB7SGlzdG9yeUV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9oaXN0b3J5L0hpc3RvcnlFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtEZWZhdWx0SGlzdG9yeU1hbmFnZXJ9IGZyb20gXCIuL2V4dGVuc2lvbnMvaGlzdG9yeS9IaXN0b3J5TWFuYWdlclwiO1xyXG5pbXBvcnQge0NvbXB1dGVFbmdpbmV9IGZyb20gXCIuL2V4dGVuc2lvbnMvY29tcHV0ZS9Db21wdXRlRW5naW5lXCI7XHJcbmltcG9ydCB7Q29tcHV0ZUV4dGVuc2lvbn0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL0NvbXB1dGVFeHRlbnNpb25cIjtcclxuaW1wb3J0IHtKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZX0gZnJvbSBcIi4vZXh0ZW5zaW9ucy9jb21wdXRlL0phdmFTY3JpcHRDb21wdXRlRW5naW5lXCI7XHJcbmltcG9ydCB7V2F0Y2hNYW5hZ2VyfSBmcm9tIFwiLi9leHRlbnNpb25zL2NvbXB1dGUvV2F0Y2hNYW5hZ2VyXCI7XHJcbmltcG9ydCB7Q2xpY2tab25lRXh0ZW5zaW9ufSBmcm9tIFwiLi9leHRlbnNpb25zL2V4dHJhL0NsaWNrWm9uZUV4dGVuc2lvblwiO1xyXG5pbXBvcnQge0Jhc2UyNn0gZnJvbSBcIi4vbWlzYy9CYXNlMjZcIjtcclxuXHJcblxyXG4oZnVuY3Rpb24oZXh0OmFueSkge1xyXG5cclxuICAgIGV4dC5DbGlwYm9hcmRFeHRlbnNpb24gPSBDbGlwYm9hcmRFeHRlbnNpb247XHJcbiAgICBleHQuRWRpdGluZ0V4dGVuc2lvbiA9IEVkaXRpbmdFeHRlbnNpb247ICAgIFxyXG4gICAgZXh0LlNjcm9sbGVyRXh0ZW5zaW9uID0gU2Nyb2xsZXJFeHRlbnNpb247XHJcbiAgICBleHQuU2VsZWN0b3JFeHRlbnNpb24gPSBTZWxlY3RvckV4dGVuc2lvbjtcclxuICAgIGV4dC5IaXN0b3J5RXh0ZW5zaW9uID0gSGlzdG9yeUV4dGVuc2lvbjtcclxuICAgIGV4dC5EZWZhdWx0SGlzdG9yeU1hbmFnZXIgPSBEZWZhdWx0SGlzdG9yeU1hbmFnZXI7XHJcbiAgICBleHQuQ29tcHV0ZUV4dGVuc2lvbiA9IENvbXB1dGVFeHRlbnNpb247XHJcbiAgICBleHQuSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUgPSBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZTtcclxuICAgIGV4dC5XYXRjaE1hbmFnZXIgPSBXYXRjaE1hbmFnZXI7XHJcbiAgICBleHQuQ2xpY2tab25lRXh0ZW5zaW9uID0gQ2xpY2tab25lRXh0ZW5zaW9uO1xyXG4gICAgZXh0LlBvaW50ID0gUG9pbnQ7XHJcbiAgICBleHQuUmVjdCA9IFJlY3Q7XHJcbiAgICBleHQuQmFzZTI2ID0gQmFzZTI2O1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkQ2VsbCA9IERlZmF1bHRHcmlkQ2VsbDtcclxuICAgIGV4dC5EZWZhdWx0R3JpZENvbHVtbiA9IERlZmF1bHRHcmlkQ29sdW1uO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkTW9kZWwgPSBEZWZhdWx0R3JpZE1vZGVsO1xyXG4gICAgZXh0LkRlZmF1bHRHcmlkUm93ID0gRGVmYXVsdEdyaWRSb3c7XHJcbiAgICBleHQuU3R5bGUgPSBTdHlsZTtcclxuICAgIGV4dC5TdHlsZWRHcmlkQ2VsbCA9IFN0eWxlZEdyaWRDZWxsO1xyXG4gICAgZXh0LkdyaWRDaGFuZ2VTZXQgPSBHcmlkQ2hhbmdlU2V0O1xyXG4gICAgZXh0LkdyaWRSYW5nZSA9IEdyaWRSYW5nZTtcclxuICAgIGV4dC5HcmlkRWxlbWVudCA9IEdyaWRFbGVtZW50O1xyXG4gICAgZXh0LkdyaWRLZXJuZWwgPSBHcmlkS2VybmVsO1xyXG4gICAgZXh0LkFic1dpZGdldEJhc2UgPSBBYnNXaWRnZXRCYXNlO1xyXG4gICAgZXh0LkV2ZW50RW1pdHRlckJhc2UgPSBFdmVudEVtaXR0ZXJCYXNlO1xyXG4gICAgZXh0LmNvbW1hbmQgPSBjb21tYW5kO1xyXG4gICAgZXh0LnZhcmlhYmxlID0gdmFyaWFibGU7XHJcbiAgICBleHQucm91dGluZSA9IHJvdXRpbmU7XHJcbiAgICBleHQucmVuZGVyZXIgPSByZW5kZXJlcjtcclxuICAgIGV4dC52aXN1YWxpemUgPSB2aXN1YWxpemU7XHJcbiAgICBcclxufSkod2luZG93WydjYXR0bGUnXSB8fCAod2luZG93WydjYXR0bGUnXSA9IHt9KSk7IiwiaW1wb3J0IHsgR3JpZENoYW5nZVNldCB9IGZyb20gJy4vRWRpdGluZ0V4dGVuc2lvbic7XHJcbmltcG9ydCB7IEdyaWRFeHRlbnNpb24sIEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IFJlY3QgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgdmFyaWFibGUsIGNvbW1hbmQsIHJvdXRpbmUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgKiBhcyBQYXBhIGZyb20gJ3BhcGFwYXJzZSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBjbGlwYm9hcmQgZnJvbSAnY2xpcGJvYXJkLWpzJztcclxuXHJcblxyXG4vL0kga25vdy4uLiA6KFxyXG4vL2NvbnN0IE5ld0xpbmUgPSAhIXdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goLy4qW1d3XVtJaV1bTm5dLiovKSA/ICdcXHJcXG4nIDogJ1xcbic7XHJcbmNvbnN0IE5ld0xpbmUgPSAnXFxyXFxuJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDbGlwYm9hcmRFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBjb3B5TGlzdDpzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBjb3B5UmFuZ2U6R3JpZFJhbmdlID0gR3JpZFJhbmdlLmVtcHR5KCk7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgY29weU5ldDpDb3B5TmV0O1xyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKGdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfQycsIChlOktleWJvYXJkRXZlbnQpID0+IHRoaXMuY29weVNlbGVjdGlvbigpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgdGhpcy5vbldpbmRvd1Bhc3RlLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdzY3JvbGwnLCAoKSA9PiB0aGlzLmFsaWduTmV0KCkpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpiZWdpbkVkaXQnLCAoKSA9PiB0aGlzLnJlc2V0Q29weSgpKTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6Y29tbWl0JywgKCkgPT4gdGhpcy5yZXNldENvcHkoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgY2FwdHVyZVNlbGVjdG9yKCk6U2VsZWN0b3JXaWRnZXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdjYXB0dXJlU2VsZWN0b3InKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmNvcHlOZXQgPSBDb3B5TmV0LmNyZWF0ZShsYXllcik7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb3B5U2VsZWN0aW9uKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9Db3B5KHRoaXMuc2VsZWN0aW9uKTtcclxuICAgICAgICB0aGlzLmFsaWduTmV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZXNldENvcHkoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kb0NvcHkoW10pO1xyXG4gICAgICAgIHRoaXMuYWxpZ25OZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvQ29weShjZWxsczpzdHJpbmdbXSwgZGVsaW1pdGVyOnN0cmluZyA9ICdcXHQnKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jb3B5TGlzdCA9IGNlbGxzO1xyXG4gICAgICAgIGxldCByYW5nZSA9IHRoaXMuY29weVJhbmdlID0gR3JpZFJhbmdlLmNyZWF0ZSh0aGlzLmdyaWQubW9kZWwsIGNlbGxzKTtcclxuICAgICAgICBsZXQgdGV4dCA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIWNlbGxzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgcnIgPSByYW5nZS5sdHJbMF0ucm93UmVmO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2UubHRyLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGMgPSByYW5nZS5sdHJbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAocnIgIT09IGMucm93UmVmKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IE5ld0xpbmU7XHJcbiAgICAgICAgICAgICAgICByciA9IGMucm93UmVmO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IGMudmFsdWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IChyYW5nZS5sdHIubGVuZ3RoIC0gMSkgJiYgcmFuZ2UubHRyW2kgKyAxXS5yb3dSZWYgPT09IHJyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGRlbGltaXRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjbGlwYm9hcmQuY29weSh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGRvUGFzdGUodGV4dDpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbi5maWx0ZXIoeCA9PiAhaXNfcmVhZG9ubHkoZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSkpO1xyXG5cclxuICAgICAgICBpZiAoIXNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IGZvY3VzZWRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChzZWxlY3Rpb25bMF0pO1xyXG5cclxuICAgICAgICBsZXQgcGFyc2VkID0gUGFwYS5wYXJzZSh0ZXh0LCB7XHJcbiAgICAgICAgICAgIGRlbGltaXRlcjogdGV4dC5pbmRleE9mKCdcXHQnKSA+PSAwID8gJ1xcdCcgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gcGFyc2VkLmRhdGEuZmlsdGVyKHggPT4geC5sZW5ndGggPiAxIHx8ICh4Lmxlbmd0aCA9PSAxICYmICEheFswXSkpO1xyXG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy5tYXgoZGF0YSwgeCA9PiB4Lmxlbmd0aCkubGVuZ3RoO1xyXG4gICAgICAgIGxldCBoZWlnaHQgPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICBsZXQgc3RhcnRWZWN0b3IgPSBuZXcgUG9pbnQoZm9jdXNlZENlbGwuY29sUmVmLCBmb2N1c2VkQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgIGxldCBlbmRWZWN0b3IgPSBzdGFydFZlY3Rvci5hZGQobmV3IFBvaW50KHdpZHRoLCBoZWlnaHQpKTtcclxuXHJcbiAgICAgICAgbGV0IHBhc3RlUmFuZ2UgPSBHcmlkUmFuZ2UuY2FwdHVyZShncmlkLm1vZGVsLCBzdGFydFZlY3RvciwgZW5kVmVjdG9yKTtcclxuXHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgcGFzdGVSYW5nZS5sdHIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeHkgPSBuZXcgUG9pbnQoY2VsbC5jb2xSZWYsIGNlbGwucm93UmVmKS5zdWJ0cmFjdChzdGFydFZlY3Rvcik7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbeHkueV1beHkueF0gfHwgJyc7XHJcblxyXG4gICAgICAgICAgICBjaGFuZ2VzLnB1dChjZWxsLnJlZiwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdjb21taXQnLCBjaGFuZ2VzKTtcclxuICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ3NlbGVjdCcsIHBhc3RlUmFuZ2UubHRyLm1hcCh4ID0+IHgucmVmKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbk5ldCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBjb3B5TGlzdCwgY29weU5ldCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGNvcHlMaXN0Lmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogSW1wcm92ZSB0aGUgc2hpdCBvdXQgb2YgdGhpczpcclxuICAgICAgICAgICAgbGV0IG5ldFJlY3QgPSBSZWN0LmZyb21NYW55KGNvcHlMaXN0Lm1hcCh4ID0+IGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHgpKSk7XHJcbiAgICAgICAgICAgIGNvcHlOZXQuZ290byhuZXRSZWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29weU5ldC5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25XaW5kb3dQYXN0ZShlOkNsaXBib2FyZEV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGFlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgICB3aGlsZSAoISFhZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChhZSA9PSB0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgYWUgPSBhZS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFhZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgdGV4dCA9IGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0L3BsYWluJyk7XHJcbiAgICAgICAgaWYgKHRleHQgIT09IG51bGwgJiYgdGV4dCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kb1Bhc3RlKHRleHQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvcHlOZXQgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxEaXZFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQpOkNvcHlOZXRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtbmV0IGdyaWQtbmV0LWNvcHknO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IENvcHlOZXQocm9vdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzX3JlYWRvbmx5KGNlbGw6R3JpZENlbGwpOmJvb2xlYW5cclxue1xyXG4gICAgcmV0dXJuIGNlbGxbJ3JlYWRvbmx5J10gPT09IHRydWUgfHwgY2VsbFsnbXV0YWJsZSddID09PSBmYWxzZTtcclxufSIsImltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L01vdXNlSW5wdXQnO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5pbXBvcnQgeyBPYmplY3RNYXAgfSBmcm9tICcuLi8uLi9taXNjL0ludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyB2YWx1ZXMgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZE1vZGVsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZE1vZGVsJztcclxuaW1wb3J0IHsgY29tbWFuZCwgcm91dGluZSwgdmFyaWFibGUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0IHsgQWJzV2lkZ2V0QmFzZSwgV2lkZ2V0IH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi8uLi91aS9HcmlkRWxlbWVudCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBTZWxlY3RvcldpZGdldCB9IGZyb20gJy4vU2VsZWN0b3JFeHRlbnNpb24nO1xyXG5cclxuXHJcbmNvbnN0IFZlY3RvcnMgPSB7XHJcbiAgICBuOiBuZXcgUG9pbnQoMCwgLTEpLFxyXG4gICAgczogbmV3IFBvaW50KDAsIDEpLFxyXG4gICAgZTogbmV3IFBvaW50KDEsIDApLFxyXG4gICAgdzogbmV3IFBvaW50KC0xLCAwKSxcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEVkaXRFdmVudFxyXG57XHJcbiAgICBjaGFuZ2VzOkdyaWRDaGFuZ2VbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlXHJcbntcclxuICAgIHJlYWRvbmx5IGNlbGw6R3JpZENlbGw7XHJcbiAgICByZWFkb25seSB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWFkb25seSBjYXNjYWRlZD86Ym9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlU2V0VmlzaXRvclxyXG57XHJcbiAgICAocmVmOnN0cmluZywgdmFsOnN0cmluZywgY2FzY2FkZWQ6Ym9vbGVhbik6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2hhbmdlU2V0SXRlbVxyXG57XHJcbiAgICByZWFkb25seSByZWY6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgdmFsdWU6c3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkQ2hhbmdlU2V0XHJcbntcclxuICAgIHByaXZhdGUgZGF0YTpPYmplY3RNYXA8R3JpZENoYW5nZVNldEl0ZW0+ID0ge307XHJcblxyXG4gICAgcHVibGljIGNvbnRlbnRzKCk6R3JpZENoYW5nZVNldEl0ZW1bXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZXModGhpcy5kYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0KHJlZjpzdHJpbmcpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGxldCBlbnRyeSA9IHRoaXMuZGF0YVtyZWZdO1xyXG4gICAgICAgIHJldHVybiAhIWVudHJ5ID8gZW50cnkudmFsdWUgOiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHB1dChyZWY6c3RyaW5nLCB2YWx1ZTpzdHJpbmcsIGNhc2NhZGVkPzpib29sZWFuKTpHcmlkQ2hhbmdlU2V0XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3JlZl0gPSB7XHJcbiAgICAgICAgICAgIHJlZjogcmVmLFxyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIGNhc2NhZGVkOiAhIWNhc2NhZGVkLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWZzKCk6c3RyaW5nW11cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcGlsZShtb2RlbDpHcmlkTW9kZWwpOkdyaWRDaGFuZ2VbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRzKClcclxuICAgICAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBjZWxsOiBtb2RlbC5maW5kQ2VsbCh4LnJlZiksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogeC52YWx1ZSxcclxuICAgICAgICAgICAgICAgIGNhc2NhZGVkOiB4LmNhc2NhZGVkLFxyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheC5jYXNjYWRlZCB8fCAhaXNfcmVhZG9ubHkoeC5jZWxsKSlcclxuICAgICAgICA7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXRXaWRnZXQgZXh0ZW5kcyBXaWRnZXRcclxue1xyXG4gICAgZm9jdXMoKTp2b2lkO1xyXG4gICAgdmFsKHZhbHVlPzpzdHJpbmcpOnN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVkaXRpbmdFeHRlbnNpb25cclxue1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBsYXllcjpIVE1MRWxlbWVudDtcclxuXHJcbiAgICBAdmFyaWFibGUoKVxyXG4gICAgcHJpdmF0ZSBpbnB1dDpJbnB1dDtcclxuXHJcbiAgICBwcml2YXRlIGlzRWRpdGluZzpib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcih0aGlzLmlucHV0LnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUVTQ0FQRScsICgpID0+IHRoaXMuZW5kRWRpdChmYWxzZSkpXHJcbiAgICAgICAgICAgIC5vbignIUVOVEVSJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCAoKSA9PiB0aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVNISUZUK1RBQicsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCdVUF9BUlJPVycsICgpID0+IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5uKSlcclxuICAgICAgICAgICAgLm9uKCdET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJ1JJR0hUX0FSUk9XJywgKCkgPT4geyBpZiAoIXRoaXMuaXNFZGl0aW5nRGV0YWlsZWQpIHsgdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmUpOyB9IH0pXHJcbiAgICAgICAgICAgIC5vbignTEVGVF9BUlJPVycsICgpID0+IHsgaWYgKCF0aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7IHRoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy53KTsgfSB9KVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJ0RPV046UFJJTUFSWScsICgpID0+IHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSB0cnVlKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgS2V5SW5wdXQuZm9yKHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFERUxFVEUnLCAoKSA9PiB0aGlzLmVyYXNlKCkpXHJcbiAgICAgICAgICAgIC5vbignIUJBQ0tTUEFDRScsICgpID0+IHRoaXMuYmVnaW5FZGl0KCcnKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIE1vdXNlSW5wdXQuZm9yKHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJ0RCTENMSUNLOlBSSU1BUlknLCAoKSA9PiB0aGlzLmJlZ2luRWRpdChudWxsKSlcclxuICAgICAgICA7XHJcblxyXG4gICAgICAgIHRoaXMuaW5wdXQucm9vdC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4geyB0aGlzLmVuZEVkaXQodHJ1ZSkgfSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2tleXByZXNzJywgKGU6R3JpZEtleWJvYXJkRXZlbnQpID0+IHRoaXMuYmVnaW5FZGl0KFN0cmluZy5mcm9tQ2hhckNvZGUoZS5jaGFyQ29kZSkpKTtcclxuXHJcbiAgICAgICAga2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpkb1NlbGVjdCcsICgpID0+IHRoaXMuZW5kRWRpdCh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgcHJpbWFyeVNlbGVjdG9yKCk6U2VsZWN0b3JXaWRnZXRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdwcmltYXJ5U2VsZWN0b3InKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRWxlbWVudHModGFyZ2V0OkhUTUxFbGVtZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbGF5ZXIuY2xhc3NOYW1lID0gJ2dyaWQtbGF5ZXInO1xyXG4gICAgICAgIERvbS5jc3MobGF5ZXIsIHsgcG9pbnRlckV2ZW50czogJ25vbmUnLCBvdmVyZmxvdzogJ2hpZGRlbicsIH0pO1xyXG4gICAgICAgIHRhcmdldC5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShsYXllciwgdGFyZ2V0KTtcclxuXHJcbiAgICAgICAgbGV0IHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG9uQmFzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgRG9tLmZpdChsYXllciwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ3JpZC5vbignYmFzaCcsIG9uQmFzaCk7XHJcbiAgICAgICAgb25CYXNoKCk7XHJcblxyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmlucHV0ID0gSW5wdXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGJlZ2luRWRpdChvdmVycmlkZTpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeyBpbnB1dCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ3JpZC5tb2RlbC5maW5kQ2VsbCh0aGlzLnNlbGVjdGlvblswXSk7XHJcblxyXG4gICAgICAgIGlmIChpc19yZWFkb25seShjZWxsKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghIW92ZXJyaWRlIHx8IG92ZXJyaWRlID09PSAnJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChvdmVycmlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0LnZhbChjZWxsLnZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlucHV0LmdvdG8odGhpcy5wcmltYXJ5U2VsZWN0b3Iudmlld1JlY3QpO1xyXG4gICAgICAgIGlucHV0LmZvY3VzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIEByb3V0aW5lKClcclxuICAgIHByaXZhdGUgZW5kRWRpdChjb21taXQ6Ym9vbGVhbiA9IHRydWUpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCB7IGdyaWQsIGlucHV0LCBzZWxlY3Rpb24gfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gaW5wdXQudmFsKCk7XHJcblxyXG4gICAgICAgIGlucHV0LmhpZGUoKTtcclxuICAgICAgICBpbnB1dC52YWwoJycpO1xyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbW1pdCAmJiAhIXNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLnNsaWNlKDAsIDEpLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmRFZGl0VG9OZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGNvbW1pdDpib29sZWFuID0gdHJ1ZSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmVuZEVkaXQoY29tbWl0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0TmVpZ2hib3InLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGVyYXNlKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNFZGl0aW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHNlbGVjdGlvbiA9IHNlbGVjdGlvbi5maWx0ZXIoeCA9PiAhaXNfcmVhZG9ubHkoZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSkpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLCAnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBjb21taXRVbmlmb3JtKGNlbGxzOnN0cmluZ1tdLCB1bmlmb3JtVmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNoYW5nZXMgPSBuZXcgR3JpZENoYW5nZVNldCgpO1xyXG4gICAgICAgIGZvciAobGV0IHJlZiBvZiBjZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNoYW5nZXMucHV0KHJlZiwgdW5pZm9ybVZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbW1pdChjaGFuZ2VzKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBAcm91dGluZSgpXHJcbiAgICBwcml2YXRlIGNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgZ3JpZCA9IHRoaXMuZ3JpZDtcclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgaWYgKGNvbXBpbGVkLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnaW5wdXQnLCB7IGNoYW5nZXM6IGNvbXBpbGVkIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSW5wdXQgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxJbnB1dEVsZW1lbnQ+XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGNvbnRhaW5lcjpIVE1MRWxlbWVudCk6SW5wdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgcm9vdC50eXBlID0gJ3RleHQnO1xyXG4gICAgICAgIHJvb3QuY2xhc3NOYW1lID0gJ2dyaWQtaW5wdXQnO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgbWFyZ2luOiAnMCcsXHJcbiAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IElucHV0KHJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb3RvKHZpZXdSZWN0OlJlY3RMaWtlLCBhdXRvU2hvdzpib29sZWFuID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmdvdG8odmlld1JlY3QpO1xyXG5cclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiBgJHt2aWV3UmVjdC5sZWZ0ICsgMn1weGAsXHJcbiAgICAgICAgICAgIHRvcDogYCR7dmlld1JlY3QudG9wICsgMn1weGAsXHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHt2aWV3UmVjdC53aWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0fXB4YCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9jdXMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcm9vdC5mb2N1cygpO1xyXG4gICAgICAgICAgICByb290LnNldFNlbGVjdGlvblJhbmdlKHJvb3QudmFsdWUubGVuZ3RoLCByb290LnZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbCh2YWx1ZT86c3RyaW5nKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC52YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNfcmVhZG9ubHkoY2VsbDpHcmlkQ2VsbCk6Ym9vbGVhblxyXG57XHJcbiAgICByZXR1cm4gY2VsbFsncmVhZG9ubHknXSA9PT0gdHJ1ZSB8fCBjZWxsWydtdXRhYmxlJ10gPT09IGZhbHNlO1xyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBQYWRkaW5nIH0gZnJvbSAnLi4vLi4vZ2VvbS9QYWRkaW5nJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5pbXBvcnQgKiBhcyBEb20gZnJvbSAnLi4vLi4vbWlzYy9Eb20nO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTY3JvbGxlckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHdlZGdlOkhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc2Nyb2xsZXJXaWR0aD86bnVtYmVyKSBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNjcm9sbGVyV2lkdGggPSBjb2FsZXNjZShzY3JvbGxlcldpZHRoLCBkZXRlY3RfbmF0aXZlX3Njcm9sbGVyX3dpZHRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG5cclxuICAgICAgICAvL1NldCBwYWRkaW5nIHJpZ2h0IGFuZCBib3R0b20gdG8gc2Nyb2xsZXIgd2lkdGggdG8gcHJldmVudCBvdmVybGFwXHJcbiAgICAgICAgZ3JpZC5wYWRkaW5nID0gbmV3IFBhZGRpbmcoXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy50b3AsXHJcbiAgICAgICAgICAgIGdyaWQucGFkZGluZy5yaWdodCArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmJvdHRvbSArIHRoaXMuc2Nyb2xsZXJXaWR0aCxcclxuICAgICAgICAgICAgZ3JpZC5wYWRkaW5nLmxlZnQpO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5hbGlnbkVsZW1lbnRzKCkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25FbGVtZW50cygpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVsZW1lbnRzKHRhcmdldDpIVE1MRWxlbWVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIC8vU2Nyb2xsZXJFeHRlbnNpb24gaXMgYSBzcGVjaWFsIGNhc2UsIHdlIG5lZWQgdG8gbW9kaWZ5IHRoZSBncmlkIGNvbnRhaW5lciBlbGVtZW50IGluIG9yZGVyXHJcbiAgICAgICAgLy90byByZWxpYWJpbGl0eSBlbmFibGUgYWxsIHNjcm9sbCBpbnRlcmFjdGlvbiB3aXRob3V0IGxvZ3Mgb2YgZW11bGF0aW9uIGFuZCBidWdneSBjcmFwLiAgV2VcclxuICAgICAgICAvL2luamVjdCBhIHdlZGdlIGVsZW1lbnQgdGhhdCBzaW11bGF0ZXMgdGhlIG92ZXJmbG93IGZvciB0aGUgY29udGFpbmVyIHNjcm9sbCBiYXJzIGFuZCB0aGVuXHJcbiAgICAgICAgLy9ob2xkIHRoZSBncmlkIGluIHBsYWNlIHdoaWxlIG1pcnJvcmluZyB0aGUgc2Nyb2xsIHByb3BlcnR5IGFnYWluc3QgdGhlIGNvbnRhaW5lciBzY29ybGwgXHJcbiAgICAgICAgLy9wb3NpdGlvbi4gVnVhbGEhXHJcblxyXG4gICAgICAgIGxldCBjb250YWluZXIgPSB0aGlzLmdyaWQuY29udGFpbmVyO1xyXG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uQ29udGFpbmVyU2Nyb2xsLmJpbmQodGhpcykpO1xyXG4gICAgICAgIERvbS5jc3MoY29udGFpbmVyLCB7XHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB3ZWRnZSA9IHRoaXMud2VkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBEb20uY3NzKHdlZGdlLCB7IHBvaW50ZXJFdmVudHM6ICdub25lJywgfSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHdlZGdlKTtcclxuXHJcbiAgICAgICAgdGhpcy5hbGlnbkVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhbGlnbkVsZW1lbnRzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBncmlkID0gdGhpcy5ncmlkO1xyXG4gICAgICAgIGxldCBjb25hdGluZXIgPSBncmlkLmNvbnRhaW5lcjtcclxuXHJcbiAgICAgICAgRG9tLmNzcyhncmlkLnJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6IChncmlkLnNjcm9sbExlZnQpICsgJ3B4JyxcclxuICAgICAgICAgICAgdG9wOiAoZ3JpZC5zY3JvbGxUb3ApICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRG9tLmNzcyh0aGlzLndlZGdlLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBgJHtncmlkLnZpcnR1YWxXaWR0aCAtIHRoaXMuc2Nyb2xsZXJXaWR0aH1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7Z3JpZC52aXJ0dWFsSGVpZ2h0IC0gdGhpcy5zY3JvbGxlcldpZHRofXB4YCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxMZWZ0ICE9IGdyaWQuc2Nyb2xsTGVmdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbmF0aW5lci5zY3JvbGxMZWZ0ID0gZ3JpZC5zY3JvbGxMZWZ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbmF0aW5lci5zY3JvbGxUb3AgIT0gZ3JpZC5zY3JvbGxUb3ApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25hdGluZXIuc2Nyb2xsVG9wID0gZ3JpZC5zY3JvbGxUb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Db250YWluZXJTY3JvbGwoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgbGV0IG1heFNjcm9sbCA9IG5ldyBQb2ludChcclxuICAgICAgICAgICAgTWF0aC5tYXgoMCwgZ3JpZC52aXJ0dWFsV2lkdGggLSBncmlkLndpZHRoKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoMCwgZ3JpZC52aXJ0dWFsSGVpZ2h0IC0gZ3JpZC5oZWlnaHQpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ3JpZC5zY3JvbGwgPSBuZXcgUG9pbnQoZ3JpZC5jb250YWluZXIuc2Nyb2xsTGVmdCwgZ3JpZC5jb250YWluZXIuc2Nyb2xsVG9wKVxyXG4gICAgICAgICAgICAuY2xhbXAoUG9pbnQuZW1wdHksIG1heFNjcm9sbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRldGVjdF9uYXRpdmVfc2Nyb2xsZXJfd2lkdGgoKSBcclxue1xyXG4gICAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIG91dGVyLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xyXG4gICAgb3V0ZXIuc3R5bGUud2lkdGggPSBcIjEwMHB4XCI7XHJcbiAgICBvdXRlci5zdHlsZS5tc092ZXJmbG93U3R5bGUgPSBcInNjcm9sbGJhclwiOyAvLyBuZWVkZWQgZm9yIFdpbkpTIGFwcHNcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcclxuXHJcbiAgICB2YXIgd2lkdGhOb1Njcm9sbCA9IG91dGVyLm9mZnNldFdpZHRoO1xyXG4gICAgLy8gZm9yY2Ugc2Nyb2xsYmFyc1xyXG4gICAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xyXG5cclxuICAgIC8vIGFkZCBpbm5lcmRpdlxyXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIGlubmVyLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XHJcbiAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7ICAgICAgICBcclxuXHJcbiAgICB2YXIgd2lkdGhXaXRoU2Nyb2xsID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgLy8gcmVtb3ZlIGRpdnNcclxuICAgIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xyXG5cclxuICAgIHJldHVybiB3aWR0aE5vU2Nyb2xsIC0gd2lkdGhXaXRoU2Nyb2xsO1xyXG59IiwiaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuLi8uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZE1vdXNlRXZlbnQsIEdyaWRNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uLy4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBLZXlJbnB1dCB9IGZyb20gJy4uLy4uL2lucHV0L0tleUlucHV0JztcclxuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4uLy4uL2dlb20vUG9pbnQnO1xyXG5pbXBvcnQgeyBSZWN0TGlrZSwgUmVjdCB9IGZyb20gJy4uLy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnRTdXBwb3J0IH0gZnJvbSAnLi4vLi4vaW5wdXQvTW91c2VEcmFnRXZlbnRTdXBwb3J0JztcclxuaW1wb3J0IHsgV2lkZ2V0LCBBYnNXaWRnZXRCYXNlIH0gZnJvbSAnLi4vLi4vdWkvV2lkZ2V0JztcclxuaW1wb3J0IHsgY29tbWFuZCwgcm91dGluZSwgdmFyaWFibGUgfSBmcm9tICcuLi8uLi91aS9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0ICogYXMgVGV0aGVyIGZyb20gJ3RldGhlcic7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcblxyXG5cclxuY29uc3QgVmVjdG9ycyA9IHtcclxuICAgIG53OiBuZXcgUG9pbnQoLTEsIC0xKSxcclxuICAgIG46IG5ldyBQb2ludCgwLCAtMSksXHJcbiAgICBuZTogbmV3IFBvaW50KDEsIC0xKSxcclxuICAgIGU6IG5ldyBQb2ludCgxLCAwKSxcclxuICAgIHNlOiBuZXcgUG9pbnQoMSwgMSksXHJcbiAgICBzOiBuZXcgUG9pbnQoMCwgMSksXHJcbiAgICBzdzogbmV3IFBvaW50KC0xLCAxKSxcclxuICAgIHc6IG5ldyBQb2ludCgtMSwgMCksXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgU2VsZWN0R2VzdHVyZVxyXG57XHJcbiAgICBzdGFydDpzdHJpbmc7XHJcbiAgICBlbmQ6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdG9yV2lkZ2V0IGV4dGVuZHMgV2lkZ2V0XHJcbntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0b3JFeHRlbnNpb25FeHBvcnRzXHJcbntcclxuICAgIGNhblNlbGVjdDpib29sZWFuO1xyXG5cclxuICAgIHJlYWRvbmx5IHNlbGVjdGlvbjpzdHJpbmdbXVxyXG5cclxuICAgIHJlYWRvbmx5IHByaW1hcnlTZWxlY3RvcjpTZWxlY3RvcldpZGdldDtcclxuXHJcbiAgICByZWFkb25seSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3JXaWRnZXQ7XHJcblxyXG4gICAgc2VsZWN0KGNlbGxzOnN0cmluZ1tdLCBhdXRvU2Nyb2xsPzpib29sZWFuKTp2b2lkO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpOnZvaWQ7XHJcblxyXG4gICAgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RFZGdlKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3RMaW5lKGdyaWRQdDpQb2ludCwgYXV0b1Njcm9sbD86Ym9vbGVhbik6dm9pZDtcclxuXHJcbiAgICBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGw/OmJvb2xlYW4pOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RvckV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGxheWVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RHZXN0dXJlOlNlbGVjdEdlc3R1cmU7XHJcblxyXG4gICAgQHZhcmlhYmxlKClcclxuICAgIHByaXZhdGUgY2FuU2VsZWN0OmJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIEB2YXJpYWJsZShmYWxzZSlcclxuICAgIHByaXZhdGUgc2VsZWN0aW9uOnN0cmluZ1tdID0gW107XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBwcmltYXJ5U2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgQHZhcmlhYmxlKGZhbHNlKVxyXG4gICAgcHJpdmF0ZSBjYXB0dXJlU2VsZWN0b3I6U2VsZWN0b3I7XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIVNISUZUK1RBQicsICgpID0+IHRoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchUklHSFRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUxFRlRfQVJST1cnLCAoKSA9PiB0aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMudykpXHJcbiAgICAgICAgICAgIC5vbignIVVQX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLm4pKVxyXG4gICAgICAgICAgICAub24oJyFET1dOX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK1JJR0hUX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrTEVGVF9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLncpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK1VQX0FSUk9XJywgKCkgPT4gdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMubikpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrRE9XTl9BUlJPVycsICgpID0+IHRoaXMuc2VsZWN0RWRnZShWZWN0b3JzLnMpKVxyXG4gICAgICAgICAgICAub24oJyFDVFJMK0EnLCAoKSA9PiB0aGlzLnNlbGVjdEFsbCgpKVxyXG4gICAgICAgICAgICAub24oJyFIT01FJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy53KSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtIT01FJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5udykpXHJcbiAgICAgICAgICAgIC5vbignIUVORCcsICgpID0+IHRoaXMuc2VsZWN0Qm9yZGVyKFZlY3RvcnMuZSkpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrRU5EJywgKCkgPT4gdGhpcy5zZWxlY3RCb3JkZXIoVmVjdG9ycy5zZSkpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBNb3VzZURyYWdFdmVudFN1cHBvcnQuZW5hYmxlKGdyaWQucm9vdCk7XHJcbiAgICAgICAgTW91c2VJbnB1dC5mb3IoZ3JpZClcclxuICAgICAgICAgICAgLm9uKCdET1dOOlNISUZUK1BSSU1BUlknLCAoZTpHcmlkTW91c2VFdmVudCkgPT4gdGhpcy5zZWxlY3RMaW5lKG5ldyBQb2ludChlLmdyaWRYLCBlLmdyaWRZKSkpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+IHRoaXMuYmVnaW5TZWxlY3RHZXN0dXJlKGUuZ3JpZFgsIGUuZ3JpZFkpKVxyXG4gICAgICAgICAgICAub24oJ0RSQUc6UFJJTUFSWScsIChlOkdyaWRNb3VzZURyYWdFdmVudCkgPT4gdGhpcy51cGRhdGVTZWxlY3RHZXN0dXJlKGUuZ3JpZFgsIGUuZ3JpZFkpKVxyXG4gICAgICAgICAgICAub24oJ1VQOlBSSU1BUlknLCAoZTpHcmlkTW91c2VEcmFnRXZlbnQpID0+IHRoaXMuZW5kU2VsZWN0R2VzdHVyZSgvKmUuZ3JpZFgsIGUuZ3JpZFkqLykpXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBncmlkLm9uKCdpbnZhbGlkYXRlJywgKCkgPT4gdGhpcy5yZXNlbGVjdChmYWxzZSkpO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsICgpID0+IHRoaXMuYWxpZ25TZWxlY3RvcnMoZmFsc2UpKTtcclxuXHJcbiAgICAgICAga2VybmVsLnZhcmlhYmxlcy5kZWZpbmUoJ2lzU2VsZWN0aW5nJywge1xyXG4gICAgICAgICAgICBnZXQ6ICgpID0+ICEhdGhpcy5zZWxlY3RHZXN0dXJlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG5cclxuICAgICAgICB0aGlzLnByaW1hcnlTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5jYXB0dXJlU2VsZWN0b3IgPSBTZWxlY3Rvci5jcmVhdGUobGF5ZXIsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdChjZWxsczpzdHJpbmdbXSwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvU2VsZWN0KGNlbGxzLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICB0aGlzLmFsaWduU2VsZWN0b3JzKHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0QWxsKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZ3JpZC5tb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJlZikpO1xyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0Qm9yZGVyKHZlY3RvcjpQb2ludCwgYXV0b1Njcm9sbCA9IHRydWUpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXJ0Q2VsbCA9IGdyaWQubW9kZWwuZmluZENlbGwocmVmKTtcclxuICAgICAgICAgICAgbGV0IHh5ID0geyB4OiBzdGFydENlbGwuY29sUmVmLCB5OiBzdGFydENlbGwucm93UmVmIH0gYXMgUG9pbnRMaWtlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci54ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueCA9IGdyaWQubW9kZWxXaWR0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55IDwgMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZlY3Rvci55ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgeHkueSA9IGdyaWQubW9kZWxIZWlnaHQgLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVzdWx0Q2VsbCA9IGdyaWQubW9kZWwubG9jYXRlQ2VsbCh4eS54LCB4eS55KTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdENlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KFtyZXN1bHRDZWxsLnJlZl0sIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBjb21tYW5kKClcclxuICAgIHByaXZhdGUgc2VsZWN0RWRnZSh2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgZW1wdHkgPSAoY2VsbDpHcmlkQ2VsbCkgPT4gPGFueT4oY2VsbC52YWx1ZSA9PT0gJycgIHx8IGNlbGwudmFsdWUgPT09ICcwJyB8fCBjZWxsLnZhbHVlID09PSB1bmRlZmluZWQgfHwgY2VsbC52YWx1ZSA9PT0gbnVsbCk7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgc3RhcnRDZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICBsZXQgY3VyckNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3Ioc3RhcnRDZWxsLnJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdENlbGwgPSA8R3JpZENlbGw+bnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghY3VyckNlbGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGEgPSBjdXJyQ2VsbDtcclxuICAgICAgICAgICAgICAgIGxldCBiID0gZ3JpZC5tb2RlbC5maW5kQ2VsbE5laWdoYm9yKGEucmVmLCB2ZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYSB8fCAhYilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gISFhID8gYSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5KGEpICsgZW1wdHkoYikgPT0gMSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDZWxsID0gZW1wdHkoYSkgPyBiIDogYTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjdXJyQ2VsbCA9IGI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRDZWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbcmVzdWx0Q2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgpXHJcbiAgICBwcml2YXRlIHNlbGVjdExpbmUoZ3JpZFB0OlBvaW50LCBhdXRvU2Nyb2xsID0gdHJ1ZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmICghcmVmKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG5cclxuICAgICAgICBsZXQgc3RhcnRQdCA9IGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHJlZikudG9wTGVmdCgpO1xyXG4gICAgICAgIGxldCBsaW5lUmVjdCA9IFJlY3QuZnJvbVBvaW50cyhzdGFydFB0LCBncmlkUHQpO1xyXG5cclxuICAgICAgICBsZXQgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChsaW5lUmVjdCkubWFwKHggPT4geC5yZWYpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHJlZiksIDEpO1xyXG4gICAgICAgIGNlbGxSZWZzLnNwbGljZSgwLCAwLCByZWYpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgYXV0b1Njcm9sbCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBzZWxlY3ROZWlnaGJvcih2ZWN0b3I6UG9pbnQsIGF1dG9TY3JvbGwgPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBsZXQgcmVmID0gdGhpcy5zZWxlY3Rpb25bMF0gfHwgbnVsbDtcclxuICAgICAgICBpZiAocmVmKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNlbGwgPSBncmlkLm1vZGVsLmZpbmRDZWxsTmVpZ2hib3IocmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW2NlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNlbGVjdChhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVtYWluaW5nID0gc2VsZWN0aW9uLmZpbHRlcih4ID0+ICEhZ3JpZC5tb2RlbC5maW5kQ2VsbCh4KSk7XHJcbiAgICAgICAgaWYgKHJlbWFpbmluZy5sZW5ndGggIT0gc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KHJlbWFpbmluZywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5TZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSB0aGlzLmdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuXHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IHtcclxuICAgICAgICAgICAgc3RhcnQ6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICBlbmQ6IGNlbGwucmVmLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0KFsgY2VsbC5yZWYgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTZWxlY3RHZXN0dXJlKGdyaWRYOm51bWJlciwgZ3JpZFk6bnVtYmVyKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgc2VsZWN0R2VzdHVyZSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgbGV0IGNlbGwgPSBncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcblxyXG4gICAgICAgIGlmICghY2VsbCB8fCBzZWxlY3RHZXN0dXJlLmVuZCA9PT0gY2VsbC5yZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgc2VsZWN0R2VzdHVyZS5lbmQgPSBjZWxsLnJlZjtcclxuXHJcbiAgICAgICAgbGV0IHJlZ2lvbiA9IFJlY3QuZnJvbU1hbnkoW1xyXG4gICAgICAgICAgICBncmlkLmdldENlbGxHcmlkUmVjdChzZWxlY3RHZXN0dXJlLnN0YXJ0KSxcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5lbmQpXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIGxldCBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlZ2lvbilcclxuICAgICAgICAgICAgLm1hcCh4ID0+eC5yZWYpO1xyXG5cclxuICAgICAgICBpZiAoY2VsbFJlZnMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHNlbGVjdEdlc3R1cmUuc3RhcnQpLCAxKTtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHNlbGVjdEdlc3R1cmUuc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGNlbGxSZWZzLmxlbmd0aCA9PSAxKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuZFNlbGVjdEdlc3R1cmUoKTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgQHJvdXRpbmUoKVxyXG4gICAgcHJpdmF0ZSBkb1NlbGVjdChjZWxsczpzdHJpbmdbXSA9IFtdLCBhdXRvU2Nyb2xsOmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNhblNlbGVjdClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBjZWxscztcclxuXHJcbiAgICAgICAgICAgIGlmIChhdXRvU2Nyb2xsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJpbWFyeVJlY3QgPSBncmlkLmdldENlbGxWaWV3UmVjdChjZWxsc1swXSk7XHJcbiAgICAgICAgICAgICAgICBncmlkLnNjcm9sbFRvKHByaW1hcnlSZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEdlc3R1cmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFsaWduU2VsZWN0b3JzKGFuaW1hdGU6Ym9vbGVhbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIHNlbGVjdGlvbiwgcHJpbWFyeVNlbGVjdG9yLCBjYXB0dXJlU2VsZWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3Qoc2VsZWN0aW9uWzBdKTtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmdvdG8ocHJpbWFyeVJlY3QsIGFuaW1hdGUpO1xyXG5cclxuICAgICAgICAgICAgLy9UT0RPOiBJbXByb3ZlIHRoZSBzaGl0IG91dCBvZiB0aGlzOlxyXG4gICAgICAgICAgICBsZXQgY2FwdHVyZVJlY3QgPSBSZWN0LmZyb21NYW55KHNlbGVjdGlvbi5tYXAoeCA9PiBncmlkLmdldENlbGxWaWV3UmVjdCh4KSkpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuZ290byhjYXB0dXJlUmVjdCwgYW5pbWF0ZSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci50b2dnbGUoc2VsZWN0aW9uLmxlbmd0aCA+IDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2VsZWN0b3IgZXh0ZW5kcyBBYnNXaWRnZXRCYXNlPEhUTUxEaXZFbGVtZW50PlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShjb250YWluZXI6SFRNTEVsZW1lbnQsIHByaW1hcnk6Ym9vbGVhbiA9IGZhbHNlKTpTZWxlY3RvclxyXG4gICAge1xyXG4gICAgICAgIGxldCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1zZWxlY3RvciAnICsgKHByaW1hcnkgPyAnZ3JpZC1zZWxlY3Rvci1wcmltYXJ5JyA6ICcnKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgbGVmdDogJzBweCcsXHJcbiAgICAgICAgICAgIHRvcDogJzBweCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rvcihyb290KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbXB1dGVFbmdpbmUgfSBmcm9tICcuL0NvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBKYXZhU2NyaXB0Q29tcHV0ZUVuZ2luZSB9IGZyb20gJy4vSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUnO1xyXG5pbXBvcnQgeyBHcmlkRXh0ZW5zaW9uLCBHcmlkRWxlbWVudCB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBHcmlkUmFuZ2UgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkUmFuZ2UnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi8uLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgZXh0ZW5kLCBmbGF0dGVuLCB6aXBQYWlycyB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ2VsbFdpdGhGb3JtdWxhIGV4dGVuZHMgR3JpZENlbGxcclxue1xyXG4gICAgZm9ybXVsYTpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wdXRlRXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgZW5naW5lOkNvbXB1dGVFbmdpbmU7XHJcblxyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBncmlkOkdyaWRFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZT86Q29tcHV0ZUVuZ2luZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVuZ2luZSA9IGVuZ2luZSB8fCBuZXcgSmF2YVNjcmlwdENvbXB1dGVFbmdpbmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldCBzZWxlY3Rpb24oKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuZW5naW5lLmNvbm5lY3QoZ3JpZCk7XHJcblxyXG4gICAgICAgIGtlcm5lbC5yb3V0aW5lcy5vdmVycmlkZSgnY29tbWl0JywgdGhpcy5jb21taXRPdmVycmlkZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBrZXJuZWwucm91dGluZXMub3ZlcnJpZGUoJ2JlZ2luRWRpdCcsIHRoaXMuYmVnaW5FZGl0T3ZlcnJpZGUuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCB0aGlzLnJlbG9hZC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbG9hZCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBlbmdpbmUsIGdyaWQgfSA9IHRoaXM7XHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSB7fSBhcyBhbnk7XHJcblxyXG4gICAgICAgIGVuZ2luZS5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiBncmlkLm1vZGVsLmNlbGxzKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBmb3JtdWxhID0gY2VsbFsnZm9ybXVsYSddIGFzIHN0cmluZztcclxuICAgICAgICAgICAgaWYgKCEhZm9ybXVsYSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLnByb2dyYW0oY2VsbC5yZWYsIGZvcm11bGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgZ3JpZC5leGVjKCdjb21taXQnLCBlbmdpbmUuY29tcHV0ZSgpKTtcclxuICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmVnaW5FZGl0T3ZlcnJpZGUob3ZlcnJpZGU6c3RyaW5nLCBpbXBsOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGVuZ2luZSwgc2VsZWN0aW9uIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXNlbGVjdGlvblswXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghb3ZlcnJpZGUgJiYgb3ZlcnJpZGUgIT09ICcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb3ZlcnJpZGUgPSBlbmdpbmUuZ2V0Rm9ybXVsYShzZWxlY3Rpb25bMF0pIHx8IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW1wbChvdmVycmlkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb21taXRPdmVycmlkZShjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQsIGltcGw6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZW5naW5lLCBncmlkIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubm9DYXB0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHNjb3BlID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgICAgICAgICAgbGV0IGNvbXB1dGVMaXN0ID0gW10gYXMgc3RyaW5nW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCB0bSBvZiBjaGFuZ2VzLmNvbnRlbnRzKCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZWxsID0gZ3JpZC5tb2RlbC5maW5kQ2VsbCh0bS5yZWYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxbJ3JlYWRvbmx5J10gIT09IHRydWUgJiYgY2VsbFsnbXV0YWJsZSddICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodG0udmFsdWUubGVuZ3RoID4gMCAmJiB0bS52YWx1ZVswXSA9PT0gJz0nKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLnByb2dyYW0odG0ucmVmLCB0bS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5jbGVhcihbdG0ucmVmXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnB1dCh0bS5yZWYsIHRtLnZhbHVlLCB0bS5jYXNjYWRlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb21wdXRlTGlzdC5wdXNoKHRtLnJlZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb21wdXRlTGlzdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXMgPSBlbmdpbmUuY29tcHV0ZShjb21wdXRlTGlzdCwgc2NvcGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGltcGwoY2hhbmdlcyk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBPYmplY3RNYXAgfSBmcm9tICcuLi8uLi9taXNjL0ludGVyZmFjZXMnO1xyXG5pbXBvcnQgeyBleHRlbmQsIGZsYXR0ZW4sIGluZGV4IH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IEdyaWRFbGVtZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBDb21wdXRlRW5naW5lIH0gZnJvbSAnLi9Db21wdXRlRW5naW5lJztcclxuaW1wb3J0IHsgV2F0Y2hNYW5hZ2VyIH0gZnJvbSAnLi9XYXRjaE1hbmFnZXInO1xyXG5cclxuXHJcbmNvbnN0IFJlZkV4dHJhY3QgPSAvKD8hLipbJ1wiYF0pW0EtWmEtel0rWzAtOV0rOj8oW0EtWmEtel0rWzAtOV0rKT8vZztcclxuXHJcbmNvbnN0IFN1cHBvcnRGdW5jdGlvbnMgPSB7XHJcbiAgICAvL01hdGg6XHJcbiAgICBhYnM6IE1hdGguYWJzLFxyXG4gICAgYWNvczogTWF0aC5hY29zLFxyXG4gICAgYXNpbjogTWF0aC5hc2luLFxyXG4gICAgYXRhbjogTWF0aC5hdGFuLFxyXG4gICAgYXRhbjI6IE1hdGguYXRhbjIsXHJcbiAgICBjZWlsOiBNYXRoLmNlaWwsXHJcbiAgICBjb3M6IE1hdGguY29zLFxyXG4gICAgZXhwOiBNYXRoLmV4cCxcclxuICAgIGZsb29yOiBNYXRoLmZsb29yLFxyXG4gICAgbG9nOiBNYXRoLmxvZyxcclxuICAgIG1heDogTWF0aC5tYXgsXHJcbiAgICBtaW46IE1hdGgubWluLFxyXG4gICAgcG93OiBNYXRoLnBvdyxcclxuICAgIHJhbmRvbTogTWF0aC5yYW5kb20sXHJcbiAgICByb3VuZDogTWF0aC5yb3VuZCxcclxuICAgIHNpbjogTWF0aC5zaW4sXHJcbiAgICBzcXJ0OiBNYXRoLnNxcnQsXHJcbiAgICB0YW46IE1hdGgudGFuLFxyXG4gICAgLy9DdXN0b206XHJcbiAgICBhdmc6IGZ1bmN0aW9uKHZhbHVlczpudW1iZXJbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFN1cHBvcnRGdW5jdGlvbnMuc3VtKHZhbHVlcykgLyB2YWx1ZXMubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIHN1bTogZnVuY3Rpb24odmFsdWVzOm51bWJlcltdKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc107XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LCAwKTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVkRm9ybXVsYVxyXG57XHJcbiAgICAoY2hhbmdlU2NvcGU/OkdyaWRDaGFuZ2VTZXQpOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEphdmFTY3JpcHRDb21wdXRlRW5naW5lIGltcGxlbWVudHMgQ29tcHV0ZUVuZ2luZVxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGZvcm11bGFzOk9iamVjdE1hcDxzdHJpbmc+ID0ge307XHJcbiAgICBwcml2YXRlIGNhY2hlOk9iamVjdE1hcDxDb21waWxlZEZvcm11bGE+ID0ge307XHJcbiAgICBwcml2YXRlIHdhdGNoZXM6V2F0Y2hNYW5hZ2VyID0gbmV3IFdhdGNoTWFuYWdlcigpO1xyXG4gICAgXHJcbiAgICBwdWJsaWMgZ2V0Rm9ybXVsYShjZWxsUmVmOnN0cmluZyk6c3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybXVsYXNbY2VsbFJlZl0gfHwgdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcihjZWxsUmVmcz86c3RyaW5nW10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoISFjZWxsUmVmcyAmJiAhIWNlbGxSZWZzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNyIG9mIGNlbGxSZWZzKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZm9ybXVsYXNbY3JdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53YXRjaGVzLnVud2F0Y2goY3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZm9ybXVsYXMgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy53YXRjaGVzLmNsZWFyKCk7ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25uZWN0KGdyaWQ6R3JpZEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXZhbHVhdGUoZm9ybXVsYTpzdHJpbmcsIGNoYW5nZVNjb3BlPzpHcmlkQ2hhbmdlU2V0KTpzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGZ1bmMgPSB0aGlzLmNvbXBpbGUoZm9ybXVsYSk7XHJcbiAgICAgICAgcmV0dXJuIChmdW5jKGNoYW5nZVNjb3BlIHx8IG5ldyBHcmlkQ2hhbmdlU2V0KCkpIHx8IDApLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXB1dGUoY2VsbFJlZnM6c3RyaW5nW10gPSBbXSwgc2NvcGU6R3JpZENoYW5nZVNldCA9IG5ldyBHcmlkQ2hhbmdlU2V0KCksIGNhc2NhZGU6Ym9vbGVhbiA9IHRydWUpOkdyaWRDaGFuZ2VTZXRcclxuICAgIHtcclxuICAgICAgICBsZXQgeyBncmlkLCBmb3JtdWxhcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IGluZGV4KGNlbGxSZWZzLCB4ID0+IHgpO1xyXG4gICAgICAgIGxldCB0YXJnZXRzID0gKCEhY2VsbFJlZnMubGVuZ3RoID8gY2VsbFJlZnMgOiBPYmplY3Qua2V5cyh0aGlzLmZvcm11bGFzKSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IGdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG5cclxuICAgICAgICBpZiAoY2FzY2FkZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRhcmdldHMgPSB0aGlzLmNhc2NhZGVUYXJnZXRzKHRhcmdldHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2VsbCBvZiB0YXJnZXRzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGZvcm11bGEgPSBmb3JtdWxhc1tjZWxsLnJlZl07XHJcbiAgICAgICAgICAgIGlmIChmb3JtdWxhKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZShmb3JtdWxhLCBzY29wZSlcclxuICAgICAgICAgICAgICAgIHNjb3BlLnB1dChjZWxsLnJlZiwgcmVzdWx0LCAhbG9va3VwW2NlbGwucmVmXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzY29wZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5zcGVjdChmb3JtdWxhOnN0cmluZyk6c3RyaW5nW10gXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV4cHJzID0gW10gYXMgc3RyaW5nW107XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IG51bGwgYXMgUmVnRXhwRXhlY0FycmF5O1xyXG5cclxuICAgICAgICB3aGlsZSAocmVzdWx0ID0gUmVmRXh0cmFjdC5leGVjKGZvcm11bGEpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBleHBycy5wdXNoKHJlc3VsdFswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXhwcnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb2dyYW0oY2VsbFJlZjpzdHJpbmcsIGZvcm11bGE6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5mb3JtdWxhc1tjZWxsUmVmXSA9IGZvcm11bGE7XHJcblxyXG4gICAgICAgIGxldCBleHBycyA9IHRoaXMuaW5zcGVjdChmb3JtdWxhKTtcclxuICAgICAgICBsZXQgZHBuUmFuZ2VzID0gZXhwcnMubWFwKHggPT4gR3JpZFJhbmdlLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwsIHgpLmx0cik7XHJcbiAgICAgICAgbGV0IGRwbnMgPSBmbGF0dGVuPEdyaWRDZWxsPihkcG5SYW5nZXMpLm1hcCh4ID0+IHgucmVmKTtcclxuXHJcbiAgICAgICAgaWYgKGRwbnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53YXRjaGVzLndhdGNoKGNlbGxSZWYsIGRwbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY29tcGlsZShmb3JtdWxhOnN0cmluZyk6Q29tcGlsZWRGb3JtdWxhXHJcbiAgICB7XHJcbiAgICAgICAgZnVuY3Rpb24gZmluZChmb3JtdWxhOnN0cmluZywgcmVmOnN0cmluZyk6bnVtYmVyIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb3JtdWxhLmxlbmd0aDsgaSsrKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvcm11bGFbaV0gPT0gcmVmWzBdKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybXVsYS5zdWJzdHIoaSwgcmVmLmxlbmd0aCkgPT09IHJlZikgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmMgPSBmb3JtdWxhW2kgKyByZWYubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuYyB8fCAhbmMubWF0Y2goL1xcdy8pKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vU3RvcmUga2V5IHNlcGFyYXRlbHkgYmVjYXVzZSB3ZSBjaGFuZ2UgdGhlIGZvcm11bGEuLi5cclxuICAgICAgICAgICAgbGV0IGNhY2hlS2V5ID0gZm9ybXVsYTtcclxuICAgICAgICAgICAgbGV0IGZ1bmMgPSB0aGlzLmNhY2hlW2NhY2hlS2V5XSBhcyBDb21waWxlZEZvcm11bGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWZ1bmMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBleHBycyA9IHRoaXMuaW5zcGVjdChmb3JtdWxhKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4IG9mIGV4cHJzKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaWR4ID0gZmluZChmb3JtdWxhLCB4KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ID49IDApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybXVsYSA9IGZvcm11bGEuc3Vic3RyaW5nKDAsIGlkeCkgKyBgZXhwcignJHt4fScsIGFyZ3VtZW50c1sxXSlgICsgZm9ybXVsYS5zdWJzdHJpbmcoaWR4ICsgeC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZnVuY3Rpb25zID0gZXh0ZW5kKHt9LCBTdXBwb3J0RnVuY3Rpb25zKTtcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9ucy5leHByID0gdGhpcy5yZXNvbHZlLmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNvZGUgPSBgd2l0aCAoYXJndW1lbnRzWzBdKSB7IHRyeSB7IHJldHVybiAoJHtmb3JtdWxhLnN1YnN0cigxKX0pOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IHJldHVybiAwOyB9IH1gLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gdGhpcy5jYWNoZVtjYWNoZUtleV0gPSBuZXcgRnVuY3Rpb24oY29kZSkuYmluZChudWxsLCBmdW5jdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjb21waWxlOicsIGUpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGZvcm11bGEpO1xyXG4gICAgICAgICAgICByZXR1cm4geCA9PiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY2FzY2FkZVRhcmdldHMoY2VsbHM6R3JpZENlbGxbXSk6R3JpZENlbGxbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQsIGZvcm11bGFzLCB3YXRjaGVzIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGFscmVhZHlQdXNoZWQgPSB7fSBhcyBPYmplY3RNYXA8Ym9vbGVhbj47XHJcblxyXG4gICAgICAgIGNvbnN0IHZpc2l0ID0gKGNlbGw6R3JpZENlbGwpOnZvaWQgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChhbHJlYWR5UHVzaGVkW2NlbGwucmVmXSA9PT0gdHJ1ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSB3YXRjaGVzLmdldE9ic2VydmVyc09mKGNlbGwucmVmKVxyXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+IGdyaWQubW9kZWwuZmluZENlbGwoeCkpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgZGMgb2YgZGVwZW5kZW5jaWVzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2aXNpdChkYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghIWZvcm11bGFzW2NlbGwucmVmXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoMCwgMCwgY2VsbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFscmVhZHlQdXNoZWRbY2VsbC5yZWZdID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgIHZpc2l0KGMpOyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHJlc29sdmUoZXhwcjpzdHJpbmcsIGNoYW5nZVNjb3BlOkdyaWRDaGFuZ2VTZXQpOm51bWJlcnxudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBHcmlkUmFuZ2VcclxuICAgICAgICAgICAgLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwsIGV4cHIpXHJcbiAgICAgICAgICAgIC5sdHJcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHRoaXMuY29hbGVzY2VGbG9hdChjaGFuZ2VTY29wZS5nZXQoeC5yZWYpLCB4LnZhbHVlKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoIDwgMlxyXG4gICAgICAgICAgICA/ICh2YWx1ZXNbMF0gfHwgMClcclxuICAgICAgICAgICAgOiB2YWx1ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb2FsZXNjZUZsb2F0KC4uLnZhbHVlczpzdHJpbmdbXSk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgdiBvZiB2YWx1ZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2KSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBPYmplY3RNYXAgfSBmcm9tICcuLi8uLi9taXNjL0ludGVyZmFjZXMnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBXYXRjaE1hbmFnZXJcclxue1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZpbmc6T2JqZWN0TWFwPHN0cmluZ1tdPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZlZDpPYmplY3RNYXA8c3RyaW5nW10+ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IoKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9ic2VydmluZyA9IHt9O1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZWQgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0T2JzZXJ2ZXJzT2YoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZWRbY2VsbFJlZl0gfHwgW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE9ic2VydmVkQnkoY2VsbFJlZjpzdHJpbmcpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2aW5nW2NlbGxSZWZdIHx8IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3YXRjaChvYnNlcnZlcjpzdHJpbmcsIHN1YmplY3RzOnN0cmluZ1tdKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFzdWJqZWN0cyB8fCAhc3ViamVjdHMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2aW5nW29ic2VydmVyXSA9IHN1YmplY3RzO1xyXG4gICAgICAgIGZvciAobGV0IHMgb2Ygc3ViamVjdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMub2JzZXJ2ZWRbc10gfHwgKHRoaXMub2JzZXJ2ZWRbc10gPSBbXSk7XHJcbiAgICAgICAgICAgIGxpc3QucHVzaChvYnNlcnZlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bndhdGNoKG9ic2VydmVyOnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBzdWJqZWN0cyA9IHRoaXMuZ2V0T2JzZXJ2ZWRCeShvYnNlcnZlcik7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2aW5nW29ic2VydmVyXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcyBvZiBzdWJqZWN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBsaXN0ID0gdGhpcy5vYnNlcnZlZFtzXSB8fCBbXTtcclxuICAgICAgICAgICAgbGV0IGl4ID0gbGlzdC5pbmRleE9mKG9ic2VydmVyKTtcclxuICAgICAgICAgICAgaWYgKGl4ID49IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGl4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IGllX3NhZmVfY3JlYXRlX21vdXNlX2V2ZW50IH0gZnJvbSAnLi4vLi4vbWlzYy9Qb2x5ZmlsbCc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkS2VybmVsIH0gZnJvbSAnLi4vLi4vdWkvR3JpZEtlcm5lbCdcclxuaW1wb3J0IHsgR3JpZEVsZW1lbnQsIEdyaWRFeHRlbnNpb24sIEdyaWRNb3VzZUV2ZW50IH0gZnJvbSAnLi4vLi4vdWkvR3JpZEVsZW1lbnQnXHJcbmltcG9ydCB7IE1vdXNlSW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9Nb3VzZUlucHV0JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCAqIGFzIERvbSBmcm9tICcuLi8uLi9taXNjL0RvbSc7XHJcbmltcG9ydCAqIGFzIFRldGhlciBmcm9tICd0ZXRoZXInO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIENsaWNrWm9uZU1vZGUgPSAnYWJzJ3wnYWJzLWFsdCd8J3JlbCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENsaWNrWm9uZSBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIG1vZGU6Q2xpY2tab25lTW9kZTtcclxuICAgIHR5cGU6c3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQ2xpY2tab25lU2VsZWN0aW9uXHJcbntcclxuICAgIGNlbGw6R3JpZENlbGw7XHJcbiAgICB6b25lOkNsaWNrWm9uZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDbGlja1pvbmVNb3VzZUV2ZW50IGV4dGVuZHMgR3JpZE1vdXNlRXZlbnRcclxue1xyXG4gICAgem9uZTpDbGlja1pvbmU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDbGlja1pvbmVFeHRlbnNpb24gaW1wbGVtZW50cyBHcmlkRXh0ZW5zaW9uXHJcbntcclxuICAgIHByaXZhdGUgZ3JpZDpHcmlkRWxlbWVudDtcclxuICAgIHByaXZhdGUgbGF5ZXI6SFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGN1cnJlbnQ6Q2xpY2tab25lU2VsZWN0aW9uO1xyXG4gICAgcHJpdmF0ZSBsYXN0R3JpZFB0OlBvaW50O1xyXG5cclxuICAgIHByaXZhdGUgZ2V0IGlzU2VsZWN0aW5nKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ2lzU2VsZWN0aW5nJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluaXQoZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZm9yd2FyZExheWVyRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuZm9yd2FyZExheWVyRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5sYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uR2xvYmFsTW91c2VNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIGdyaWQub24oJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFbGVtZW50cyh0YXJnZXQ6SFRNTEVsZW1lbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwgeyBwb2ludGVyRXZlbnRzOiAnbm9uZScsIG92ZXJmbG93OiAnaGlkZGVuJywgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG5cclxuICAgICAgICBsZXQgdCA9IG5ldyBUZXRoZXIoe1xyXG4gICAgICAgICAgICBlbGVtZW50OiBsYXllcixcclxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgICAgICAgIGF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgb25CYXNoID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBEb20uZml0KGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmlkLm9uKCdiYXNoJywgb25CYXNoKTtcclxuICAgICAgICBvbkJhc2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3dpdGNoWm9uZShjenM6Q2xpY2tab25lU2VsZWN0aW9uLCBzb3VyY2VFdmVudDpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgbGF5ZXIgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChoYXNoKHRoaXMuY3VycmVudCkgPT09IGhhc2goY3pzKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JpZC5lbWl0KCd6b25lZXhpdCcsIGNyZWF0ZV9ldmVudCgnem9uZWV4aXQnLCB0aGlzLmN1cnJlbnQsIHNvdXJjZUV2ZW50KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBjenM7XHJcblxyXG4gICAgICAgIGlmIChjenMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsYXllci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2FsbCc7XHJcbiAgICAgICAgICAgIGdyaWQuZW1pdCgnem9uZWVudGVyJywgY3JlYXRlX2V2ZW50KCd6b25lZW50ZXInLCB0aGlzLmN1cnJlbnQsIHNvdXJjZUV2ZW50KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxheWVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yd2FyZExheWVyRXZlbnQoZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCwgbGFzdEdyaWRQdCB9ID0gdGhpcztcclxuICAgICAgICBlWydncmlkWCddID0gbGFzdEdyaWRQdC54O1xyXG4gICAgICAgIGVbJ2dyaWRZJ10gPSBsYXN0R3JpZFB0Lnk7XHJcblxyXG4gICAgICAgIGxldCB0eXBlID0gJ3pvbmUnICsgZS50eXBlO1xyXG5cclxuICAgICAgICBncmlkLmZvY3VzKCk7XHJcbiAgICAgICAgZ3JpZC5lbWl0KHR5cGUsIGNyZWF0ZV9ldmVudCh0eXBlLCB0aGlzLmN1cnJlbnQsIGUgYXMgR3JpZE1vdXNlRXZlbnQpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBtb3VzZVB0ID0gdGhpcy5sYXN0R3JpZFB0ID0gbmV3IFBvaW50KGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuICAgICAgICBsZXQgY2VsbCA9IGdyaWQuZ2V0Q2VsbEF0Vmlld1BvaW50KG1vdXNlUHQpO1xyXG4gICAgICAgIGlmIChjZWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZpZXdSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbC5yZWYpO1xyXG4gICAgICAgICAgICBsZXQgem9uZXMgPSAoY2VsbFsnem9uZXMnXSB8fCBbXSkgYXMgQ2xpY2tab25lW107XHJcblxyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0ID0gem9uZXNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLnRlc3QoY2VsbCwgeCwgbW91c2VQdCkpXHJcbiAgICAgICAgICAgICAgICBbMF0gfHwgbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRhcmdldClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hab25lKHtjZWxsOiBjZWxsLCB6b25lOiB0YXJnZXR9LCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnN3aXRjaFpvbmUobnVsbCwgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25HbG9iYWxNb3VzZU1vdmUoZTpNb3VzZUV2ZW50KTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGdyaWQgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMuY3VycmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBncmlkUmVjdCA9IFJlY3QuZnJvbUxpa2UoZ3JpZC5yb290LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKVxyXG4gICAgICAgICAgICBsZXQgbW91c2VQdCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghZ3JpZFJlY3QuY29udGFpbnMobW91c2VQdCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoWm9uZShudWxsLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJpdmF0ZSB0ZXN0KGNlbGw6R3JpZENlbGwsIHpvbmU6Q2xpY2tab25lLCBwdDpQb2ludCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aWV3UmVjdCA9IHRoaXMuZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbC5yZWYpO1xyXG4gICAgICAgIGxldCB6b25lUmVjdCA9IFJlY3QuZnJvbUxpa2Uoem9uZSk7XHJcblxyXG4gICAgICAgIGlmICh6b25lLm1vZGUgPT09ICdyZWwnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgem9uZVJlY3QgPSBuZXcgUmVjdChcclxuICAgICAgICAgICAgICAgIHZpZXdSZWN0LndpZHRoICogKHpvbmVSZWN0LmxlZnQgLyAxMDApLFxyXG4gICAgICAgICAgICAgICAgdmlld1JlY3QuaGVpZ2h0ICogKHpvbmVSZWN0LnRvcCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC53aWR0aCAqICh6b25lUmVjdC53aWR0aCAvIDEwMCksXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgKiAoem9uZVJlY3QuaGVpZ2h0IC8gMTAwKSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHpvbmUubW9kZSA9PT0gJ2Ficy1hbHQnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHpvbmVSZWN0ID0gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC53aWR0aCAtIHpvbmVSZWN0LmxlZnQgLSB6b25lUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICB2aWV3UmVjdC5oZWlnaHQgLSB6b25lUmVjdC50b3AgLSB6b25lUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICB6b25lUmVjdC53aWR0aCxcclxuICAgICAgICAgICAgICAgIHpvbmVSZWN0LmhlaWdodCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB6b25lUmVjdC5vZmZzZXQodmlld1JlY3QudG9wTGVmdCgpKS5jb250YWlucyhwdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZV9ldmVudCh0eXBlOnN0cmluZywgY3pzOkNsaWNrWm9uZVNlbGVjdGlvbiwgc291cmNlOk1vdXNlRXZlbnQpOkNsaWNrWm9uZU1vdXNlRXZlbnRcclxue1xyXG4gICAgbGV0IGV2ZW50ID0gaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQodHlwZSwgc291cmNlKSBhcyBhbnk7XHJcbiAgICAvLyBldmVudC5ncmlkWCA9IHNvdXJjZS5ncmlkWDtcclxuICAgIC8vIGV2ZW50LmdyaWRZID0gc291cmNlLmdyaWRZO1xyXG4gICAgZXZlbnQuY2VsbCA9IGN6cy5jZWxsO1xyXG4gICAgZXZlbnQuem9uZSA9IGN6cy56b25lO1xyXG4gICAgcmV0dXJuIGV2ZW50O1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNoKGN6czpDbGlja1pvbmVTZWxlY3Rpb24pOnN0cmluZ1xyXG57XHJcbiAgICBpZiAoIWN6cykgcmV0dXJuICcnO1xyXG4gICAgcmV0dXJuIFtjenMuY2VsbC5yZWYsIGN6cy56b25lLmxlZnQsIGN6cy56b25lLnRvcCwgY3pzLnpvbmUud2lkdGgsIGN6cy56b25lLmhlaWdodF1cclxuICAgICAgICAuam9pbignOicpO1xyXG59IiwiaW1wb3J0IHsgS2V5SW5wdXQgfSBmcm9tICcuLi8uLi9pbnB1dC9LZXlJbnB1dCc7XHJcbmltcG9ydCB7IE9iamVjdE1hcCB9IGZyb20gJy4uLy4uL21pc2MvSW50ZXJmYWNlcyc7XHJcbmltcG9ydCB7IHppcFBhaXJzIH0gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgeyBHcmlkRWxlbWVudCwgR3JpZEV4dGVuc2lvbiB9IGZyb20gJy4uLy4uL3VpL0dyaWRFbGVtZW50JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4uLy4uL3VpL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2hhbmdlU2V0IH0gZnJvbSAnLi4vY29tbW9uL0VkaXRpbmdFeHRlbnNpb24nO1xyXG5pbXBvcnQgeyBEZWZhdWx0SGlzdG9yeU1hbmFnZXIsIEhpc3RvcnlBY3Rpb24sIEhpc3RvcnlNYW5hZ2VyIH0gZnJvbSAnLi9IaXN0b3J5TWFuYWdlcic7XHJcblxyXG5cclxuaW50ZXJmYWNlIENlbGxFZGl0U25hcHNob3Rcclxue1xyXG4gICAgcmVmOnN0cmluZztcclxuICAgIG5ld1ZhbDpzdHJpbmc7XHJcbiAgICBvbGRWYWw6c3RyaW5nO1xyXG4gICAgY2FzY2FkZWQ/OmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIaXN0b3J5RXh0ZW5zaW9uIGltcGxlbWVudHMgR3JpZEV4dGVuc2lvblxyXG57XHJcbiAgICBwcml2YXRlIGdyaWQ6R3JpZEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIG1hbmFnZXI6SGlzdG9yeU1hbmFnZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBub0NhcHR1cmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBzdXNwZW5kZWQ6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBjYXB0dXJlOk9iamVjdE1hcDxzdHJpbmc+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmFnZXI/Okhpc3RvcnlNYW5hZ2VyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXIgfHwgbmV3IERlZmF1bHRIaXN0b3J5TWFuYWdlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbml0KGdyaWQ6R3JpZEVsZW1lbnQsIGtlcm5lbDpHcmlkS2VybmVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcblxyXG4gICAgICAgIEtleUlucHV0LmZvcihncmlkLnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignIUNUUkwrS0VZX1onLCAoKSA9PiB0aGlzLnVuZG8oKSlcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfWScsICgpID0+IHRoaXMucmVkbygpKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgICAgZ3JpZC5rZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmNvbW1pdCcsIHRoaXMuYmVmb3JlQ29tbWl0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2FmdGVyOmNvbW1pdCcsIHRoaXMuYWZ0ZXJDb21taXQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSB1bmRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci51bmRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSByZWRvKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5yZWRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoKVxyXG4gICAgcHJpdmF0ZSBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnB1c2goYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBAY29tbWFuZCgnY2xlYXJIaXN0b3J5JylcclxuICAgIHByaXZhdGUgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgQGNvbW1hbmQoJ3N1c3BlbmRIaXN0b3J5JylcclxuICAgIHByaXZhdGUgc3VzcGVuZChmbGFnOmJvb2xlYW4gPSB0cnVlKTp2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc3VzcGVuZGVkID0gZmxhZztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJlZm9yZUNvbW1pdChjaGFuZ2VzOkdyaWRDaGFuZ2VTZXQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5ub0NhcHR1cmUgfHwgdGhpcy5zdXNwZW5kZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IG1vZGVsID0gdGhpcy5ncmlkLm1vZGVsO1xyXG5cclxuICAgICAgICB0aGlzLmNhcHR1cmUgPSB6aXBQYWlycyhcclxuICAgICAgICAgICAgY2hhbmdlcy5yZWZzKCkubWFwKHIgPT4gW3IsIG1vZGVsLmZpbmRDZWxsKHIpLnZhbHVlXSkgXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFmdGVyQ29tbWl0KGNoYW5nZXM6R3JpZENoYW5nZVNldCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm5vQ2FwdHVyZSB8fCAhdGhpcy5jYXB0dXJlIHx8IHRoaXMuc3VzcGVuZGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBzbmFwc2hvdHMgPSB0aGlzLmNyZWF0ZVNuYXBzaG90cyh0aGlzLmNhcHR1cmUsIGNoYW5nZXMpO1xyXG4gICAgICAgIGlmIChzbmFwc2hvdHMubGVuZ3RoKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FwdHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTbmFwc2hvdHMoY2FwdHVyZTpPYmplY3RNYXA8c3RyaW5nPiwgY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTpDZWxsRWRpdFNuYXBzaG90W11cclxuICAgIHtcclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmdyaWQubW9kZWw7XHJcbiAgICAgICAgbGV0IGJhdGNoID0gW10gYXMgQ2VsbEVkaXRTbmFwc2hvdFtdO1xyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUobW9kZWwpO1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbXBpbGVkLmZpbHRlcih4ID0+ICF4LmNhc2NhZGVkKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJhdGNoLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBlbnRyeS5jZWxsLnJlZixcclxuICAgICAgICAgICAgICAgIG5ld1ZhbDogZW50cnkudmFsdWUsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWw6IGNhcHR1cmVbZW50cnkuY2VsbC5yZWZdLFxyXG4gICAgICAgICAgICAgICAgY2FzY2FkZWQ6IGVudHJ5LmNhc2NhZGVkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBiYXRjaDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVkaXRBY3Rpb24oc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSk6SGlzdG9yeUFjdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFwcGx5OiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNpbGVudENvbW1pdChjcmVhdGVfY2hhbmdlcyhzbmFwc2hvdHMsIHggPT4geC5uZXdWYWwpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcm9sbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2lsZW50Q29tbWl0KGNyZWF0ZV9jaGFuZ2VzKHNuYXBzaG90cywgeCA9PiB4Lm9sZFZhbCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbnZva2VTaWxlbnRDb21taXQoY2hhbmdlczpHcmlkQ2hhbmdlU2V0KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgZ3JpZCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm5vQ2FwdHVyZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGdyaWQuZXhlYygnY29tbWl0JywgY2hhbmdlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubm9DYXB0dXJlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29tcGlsZWQgPSBjaGFuZ2VzLmNvbXBpbGUoZ3JpZC5tb2RlbCk7XHJcbiAgICAgICAgbGV0IHJlZnMgPSBjb21waWxlZC5maWx0ZXIoeCA9PiAheC5jYXNjYWRlZCkubWFwKHggPT4geC5jZWxsLnJlZik7XHJcbiAgICAgICAgZ3JpZC5leGVjKCdzZWxlY3QnLCByZWZzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlX2NoYW5nZXMoc25hcHNob3RzOkNlbGxFZGl0U25hcHNob3RbXSwgdmFsU2VsZWN0b3I6KHM6Q2VsbEVkaXRTbmFwc2hvdCkgPT4gc3RyaW5nKTpHcmlkQ2hhbmdlU2V0IFxyXG57XHJcbiAgICBsZXQgY2hhbmdlU2V0ID0gbmV3IEdyaWRDaGFuZ2VTZXQoKTtcclxuICAgIGZvciAobGV0IHMgb2Ygc25hcHNob3RzKVxyXG4gICAge1xyXG4gICAgICAgIGNoYW5nZVNldC5wdXQocy5yZWYsIHZhbFNlbGVjdG9yKHMpLCBzLmNhc2NhZGVkKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGFuZ2VTZXQ7XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSGlzdG9yeUFjdGlvblxyXG57XHJcbiAgICBhcHBseSgpOnZvaWQ7XHJcblxyXG4gICAgcm9sbGJhY2soKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhpc3RvcnlNYW5hZ2VyXHJcbntcclxuICAgIHJlYWRvbmx5IGZ1dHVyZUNvdW50Om51bWJlcjtcclxuXHJcbiAgICByZWFkb25seSBwYXN0Q291bnQ6bnVtYmVyO1xyXG5cclxuICAgIGNsZWFyKCk6dm9pZDtcclxuXHJcbiAgICBwdXNoKGFjdGlvbjpIaXN0b3J5QWN0aW9uKTp2b2lkO1xyXG5cclxuICAgIHJlZG8oKTpib29sZWFuO1xyXG5cclxuICAgIHVuZG8oKTpib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEhpc3RvcnlNYW5hZ2VyIGltcGxlbWVudHMgSGlzdG9yeU1hbmFnZXJcclxue1xyXG4gICAgcHJpdmF0ZSBmdXR1cmU6SGlzdG9yeUFjdGlvbltdID0gW107XHJcbiAgICBwcml2YXRlIHBhc3Q6SGlzdG9yeUFjdGlvbltdID0gW107XHJcblxyXG4gICAgcHVibGljIGdldCBmdXR1cmVDb3VudCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZ1dHVyZS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBwYXN0Q291bnQoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXN0Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHVzaChhY3Rpb246SGlzdG9yeUFjdGlvbik6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGFzdC5wdXNoKGFjdGlvbik7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVkbygpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZnV0dXJlLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLmZ1dHVyZS5wb3AoKTtcclxuICAgICAgICBhY3Rpb24uYXBwbHkoKTtcclxuICAgICAgICB0aGlzLnBhc3QucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1bmRvKCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5wYXN0Lmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3Rpb24gPSB0aGlzLnBhc3QucG9wKCk7XHJcbiAgICAgICAgYWN0aW9uLnJvbGxiYWNrKCk7XHJcbiAgICAgICAgdGhpcy5mdXR1cmUucHVzaChhY3Rpb24pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgY29hbGVzY2UgfSBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBQYWRkaW5nIFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBhZGRpbmcoMCwgMCwgMCwgMCk7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmlnaHQ6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJvdHRvbTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IodG9wPzpudW1iZXIsIHJpZ2h0PzpudW1iZXIsIGJvdHRvbT86bnVtYmVyLCBsZWZ0PzpudW1iZXIpIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudG9wID0gY29hbGVzY2UodG9wLCAwKTtcclxuICAgICAgICB0aGlzLnJpZ2h0ID0gY29hbGVzY2UocmlnaHQsIHRoaXMudG9wKTtcclxuICAgICAgICB0aGlzLmJvdHRvbSA9IGNvYWxlc2NlKGJvdHRvbSwgdGhpcy50b3ApO1xyXG4gICAgICAgIHRoaXMubGVmdCA9IGNvYWxlc2NlKGxlZnQsIHRoaXMucmlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaG9yaXpvbnRhbCgpOm51bWJlciBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy5yaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHZlcnRpY2FsKCk6bnVtYmVyIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRvcCArIHRoaXMuYm90dG9tO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbmZsYXRlKGJ5Om51bWJlcik6UGFkZGluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUGFkZGluZyhcclxuICAgICAgICAgICAgdGhpcy50b3AgKyBieSxcclxuICAgICAgICAgICAgdGhpcy5yaWdodCArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmJvdHRvbSArIGJ5LFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQgKyBieSxcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59IiwiXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBvaW50TGlrZSBcclxue1xyXG4gICAgeDpudW1iZXI7XHJcbiAgICB5Om51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQnJvd3NlclBvaW50ID0geyBsZWZ0Om51bWJlcjsgdG9wOm51bWJlcjsgfTtcclxuZXhwb3J0IHR5cGUgUG9pbnRJbnB1dCA9IG51bWJlcltdfFBvaW50fFBvaW50TGlrZXxCcm93c2VyUG9pbnQ7XHJcblxyXG5leHBvcnQgY2xhc3MgUG9pbnQgaW1wbGVtZW50cyBQb2ludExpa2Vcclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHg6bnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyByZWFkb25seSB5Om51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyByYWQyZGVnOm51bWJlciA9IDM2MCAvIChNYXRoLlBJICogMik7XHJcbiAgICBwdWJsaWMgc3RhdGljIGRlZzJyYWQ6bnVtYmVyID0gKE1hdGguUEkgKiAyKSAvIDM2MDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5ID0gbmV3IFBvaW50KDAsIDApO1xyXG4gICAgcHVibGljIHN0YXRpYyBtYXggPSBuZXcgUG9pbnQoMjE0NzQ4MzY0NywgMjE0NzQ4MzY0Nyk7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1pbiA9IG5ldyBQb2ludCgtMjE0NzQ4MzY0NywgLTIxNDc0ODM2NDcpO1xyXG4gICAgcHVibGljIHN0YXRpYyB1cCA9IG5ldyBQb2ludCgwLCAtMSk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBhdmVyYWdlKHBvaW50czpQb2ludExpa2VbXSk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXBvaW50cy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeCA9IDAsIHkgPSAwO1xyXG5cclxuICAgICAgICBwb2ludHMuZm9yRWFjaChwID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB4ICs9IHAueDtcclxuICAgICAgICAgICAgeSArPSBwLnk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoeCAvIHBvaW50cy5sZW5ndGgsIHkgLyBwb2ludHMubGVuZ3RoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpcmVjdGlvbihmcm9tOlBvaW50SW5wdXQsIHRvOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHRvKS5zdWJ0cmFjdChmcm9tKS5ub3JtYWxpemUoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoc291cmNlOlBvaW50SW5wdXQpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHNvdXJjZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tQnVmZmVyKGJ1ZmZlcjpudW1iZXJbXSwgaW5kZXg6bnVtYmVyID0gMCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KGJ1ZmZlcltpbmRleF0sIGJ1ZmZlcltpbmRleCArIDFdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4Om51bWJlcnxudW1iZXJbXSwgeT86bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKHhbMF0pO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9ICg8bnVtYmVyPngpO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vcmVnaW9uIEdlb21ldHJ5XHJcblxyXG4gICAgcHVibGljIGFuZ2xlKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnggPCAwKVxyXG4gICAgICAgICAgICA/IDM2MCAtIE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWcgKiAtMVxyXG4gICAgICAgICAgICA6IE1hdGguYXRhbjIodGhpcy54LCAtdGhpcy55KSAqIFBvaW50LnJhZDJkZWc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFuZ2xlQWJvdXQodmFsOlBvaW50SW5wdXQpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocHQuY3Jvc3ModGhpcyksIHB0LmRvdCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyb3NzKHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC55IC0gdGhpcy55ICogcHQueDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzdGFuY2UodG86UG9pbnRJbnB1dCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gcHRBcmcodG8pO1xyXG4gICAgICAgIGxldCBhID0gdGhpcy54IC0gcHQueDtcclxuICAgICAgICBsZXQgYiA9IHRoaXMueSAtIHB0Lnk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChhICogYSArIGIgKiBiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG90KHZhbDpQb2ludElucHV0KTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC54ICsgdGhpcy55ICogcHQueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbGVuZ3RoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBub3JtYWxpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsZW4gPSB0aGlzLmxlbmd0aCgpO1xyXG4gICAgICAgIGlmIChsZW4gPiAwLjAwMDAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSAvIGxlbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwZXJwKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueSAqIC0xLCB0aGlzLngpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBycGVycCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLnBlcnAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52ZXJzZSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKiAtMSwgdGhpcy55ICogLTEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXZlcnNlKCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJvdGF0ZShyYWRpYW5zOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XHJcbiAgICAgICAgbGV0IHNpbiA9IE1hdGguc2luKHJhZGlhbnMpO1xyXG4gICAgICAgIGxldCBueCA9IHRoaXMueCAqIGNvcyAtIHRoaXMueSAqIHNpbjtcclxuICAgICAgICBsZXQgbnkgPSB0aGlzLnkgKiBjb3MgKyB0aGlzLnggKiBzaW47XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQobngsIG55KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIEFyaXRobWV0aWNcclxuXHJcbiAgICBwdWJsaWMgYWRkKHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ2FkZDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICsgcHQueCwgdGhpcy55ICsgcHQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpdmlkZShkaXZpc29yOm51bWJlcik6UG9pbnRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAvIGRpdmlzb3IsIHRoaXMueSAvIGRpdmlzb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtdWx0aXBseShtdWx0aXBsZXI6bnVtYmVyKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogbXVsdGlwbGVyLCB0aGlzLnkgKiBtdWx0aXBsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByb3VuZCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJvdW5kKHRoaXMueCksIE1hdGgucm91bmQodGhpcy55KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YnRyYWN0KHZhbDpudW1iZXJ8UG9pbnRJbnB1dCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ3N1YnRyYWN0OiBwdCByZXF1aXJlZC4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHB0LnJldmVyc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsYW1wKGxvd2VyOlBvaW50LCB1cHBlcjpQb2ludCk6UG9pbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgeCA9IHRoaXMueDtcclxuICAgICAgICBpZiAoeCA8IGxvd2VyLngpIHggPSBsb3dlci54O1xyXG4gICAgICAgIGlmICh4ID4gdXBwZXIueCkgeCA9IHVwcGVyLng7XHJcblxyXG4gICAgICAgIGxldCB5ID0gdGhpcy55O1xyXG4gICAgICAgIGlmICh5IDwgbG93ZXIueSkgeSA9IGxvd2VyLnk7XHJcbiAgICAgICAgaWYgKHkgPiB1cHBlci55KSB5ID0gdXBwZXIueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh4LCB5KTtcclxuICAgIH1cclxuXHJcbiAgICAvL2VuZHJlZ2lvblxyXG5cclxuICAgIC8vcmVnaW9uIENvbnZlcnNpb25cclxuXHJcbiAgICBwdWJsaWMgY2xvbmUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHMoYW5vdGhlcjpQb2ludExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBhbm90aGVyLnggJiYgdGhpcy55ID09PSBhbm90aGVyLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvQXJyYXkoKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpOnN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBgWyR7dGhpcy54fSwgJHt0aGlzLnl9XWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9lbmRyZWdpb25cclxufVxyXG5cclxuZnVuY3Rpb24gcHRBcmcodmFsOmFueSk6UG9pbnRcclxue1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCB8fCB2YWwgIT09IHVuZGVmaW5lZClcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gPFBvaW50PnZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLngsIHZhbC55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC5sZWZ0ICE9PSB1bmRlZmluZWQgJiYgdmFsLnRvcCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh2YWwubGVmdCwgdmFsLnRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KDxudW1iZXJbXT52YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mKHZhbCkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnbnVtYmVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUG9pbnQuZW1wdHk7XHJcbn0iLCJpbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlLCBQb2ludElucHV0IH0gZnJvbSAnLi9Qb2ludCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWN0TGlrZVxyXG57XHJcbiAgICBsZWZ0Om51bWJlcjtcclxuICAgIHRvcDpudW1iZXI7XHJcbiAgICB3aWR0aDpudW1iZXI7XHJcbiAgICBoZWlnaHQ6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGVtcHR5OlJlY3QgPSBuZXcgUmVjdCgwLCAwLCAwLCAwKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21FZGdlcyhsZWZ0Om51bWJlciwgdG9wOm51bWJlciwgcmlnaHQ6bnVtYmVyLCBib3R0b206bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChcclxuICAgICAgICAgICAgbGVmdCxcclxuICAgICAgICAgICAgdG9wLFxyXG4gICAgICAgICAgICByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgICAgIGJvdHRvbSAtIHRvcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmcm9tTGlrZShsaWtlOlJlY3RMaWtlKTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21NYW55KHJlY3RzOlJlY3RbXSk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHJlY3RzLm1hcCh4ID0+IFJlY3QucHJvdG90eXBlLnBvaW50cy5jYWxsKHgpKSk7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgZnJvbVBvaW50cyguLi5wb2ludHM6UG9pbnRbXSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tUG9pbnRCdWZmZXIocG9pbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZyb21Qb2ludEJ1ZmZlcihwb2ludHM6UG9pbnRbXSwgaW5kZXg/Om51bWJlciwgbGVuZ3RoPzpudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGVuZ3RoICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuc2xpY2UoMCwgbGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgTWF0aC5taW4oLi4ucG9pbnRzLm1hcChwID0+IHAueCkpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbiguLi5wb2ludHMubWFwKHAgPT4gcC55KSksXHJcbiAgICAgICAgICAgIE1hdGgubWF4KC4uLnBvaW50cy5tYXAocCA9PiBwLngpKSxcclxuICAgICAgICAgICAgTWF0aC5tYXgoLi4ucG9pbnRzLm1hcChwID0+IHAueSkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVmdDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHRvcDpudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHdpZHRoOm51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlciA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IobGVmdDpudW1iZXIsIHRvcDpudW1iZXIsIHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHJpZ2h0KClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGJvdHRvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbnRlcigpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQgKyAodGhpcy53aWR0aCAvIDIpLCB0aGlzLnRvcCArICh0aGlzLmhlaWdodCAvIDIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9wTGVmdCgpOlBvaW50XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9pbnRzKCk6UG9pbnRbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMucmlnaHQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50KHRoaXMubGVmdCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNpemUoKTpQb2ludFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb250YWlucyhpbnB1dDpQb2ludExpa2V8UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoaW5wdXRbJ3gnXSAhPT0gdW5kZWZpbmVkICYmIGlucHV0Wyd5J10gIT09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBwdCA9IDxQb2ludExpa2U+aW5wdXQ7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgcHQueCA+PSB0aGlzLmxlZnRcclxuICAgICAgICAgICAgICAgICYmIHB0LnkgPj0gdGhpcy50b3BcclxuICAgICAgICAgICAgICAgICYmIHB0LnggPD0gdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA8PSB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZWN0ID0gPFJlY3RMaWtlPmlucHV0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHJlY3QubGVmdCA+PSB0aGlzLmxlZnQgJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wID49IHRoaXMudG9wICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LmxlZnQgKyByZWN0LndpZHRoIDw9IHRoaXMubGVmdCArIHRoaXMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPD0gdGhpcy50b3AgKyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKHNpemU6UG9pbnRJbnB1dCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwdCA9IFBvaW50LmNyZWF0ZShzaXplKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQsXHJcbiAgICAgICAgICAgIHRoaXMudG9wLFxyXG4gICAgICAgICAgICB0aGlzLndpZHRoICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgKyBwdC55LFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGluZmxhdGUoc2l6ZTpQb2ludElucHV0KTpSZWN0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHB0ID0gUG9pbnQuY3JlYXRlKHNpemUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21FZGdlcyhcclxuICAgICAgICAgICAgdGhpcy5sZWZ0IC0gcHQueCxcclxuICAgICAgICAgICAgdGhpcy50b3AgLSBwdC55LFxyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0ICsgcHQueCxcclxuICAgICAgICAgICAgdGhpcy5ib3R0b20gKyBwdC55XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb2Zmc2V0KGJ5OlBvaW50SW5wdXQpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcHQgPSBQb2ludC5jcmVhdGUoYnkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdCArIHB0LngsXHJcbiAgICAgICAgICAgIHRoaXMudG9wICsgcHQueSxcclxuICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHRcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnRlcnNlY3RzKHJlY3Q6UmVjdExpa2UpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA+IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gdGhpcy50b3BcclxuICAgICAgICAgICAgJiYgcmVjdC5sZWZ0IDwgdGhpcy5sZWZ0ICsgdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAmJiByZWN0LnRvcCA8IHRoaXMudG9wICsgdGhpcy5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5vcm1hbGl6ZSgpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53aWR0aCA+PSAwICYmIHRoaXMuaGVpZ2h0ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4ID0gdGhpcy5sZWZ0O1xyXG4gICAgICAgIHZhciB5ID0gdGhpcy50b3A7XHJcbiAgICAgICAgdmFyIHcgPSB0aGlzLndpZHRoO1xyXG4gICAgICAgIHZhciBoID0gdGhpcy5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICh3IDwgMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggKz0gdztcclxuICAgICAgICAgICAgdyA9IE1hdGguYWJzKHcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB5ICs9IGg7XHJcbiAgICAgICAgICAgIGggPSBNYXRoLmFicyhoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYFske3RoaXMubGVmdH0sICR7dGhpcy50b3B9LCAke3RoaXMud2lkdGh9LCAke3RoaXMuaGVpZ2h0fV1gO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudENhbGxiYWNrLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vbWlzYy9VdGlsJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyIGltcGxlbWVudHMgRXZlbnRFbWl0dGVyXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgd3JhcCh0YXJnZXQ6RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyKTpFdmVudEVtaXR0ZXJcclxuICAgIHtcclxuICAgICAgICBpZiAoISF0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD50YXJnZXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDxFdmVudEVtaXR0ZXI+dGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0OkV2ZW50VGFyZ2V0KVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhbmNlbDogKCkgPT4gdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvZmYoZXZlbnQ6c3RyaW5nLCBjYWxsYmFjazpFdmVudENhbGxiYWNrKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbWl0KGV2ZW50OnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0LmRpc3BhdGNoRXZlbnQoXHJcbiAgICAgICAgICAgIF8uZXh0ZW5kKG5ldyBFdmVudChldmVudCksIHsgYXJnczogYXJncyB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBPYmplY3RJbmRleCB9IGZyb20gJy4uL21pc2MvSW50ZXJmYWNlcyc7XHJcblxyXG5cclxubGV0IFRyYWNrZXI6T2JqZWN0SW5kZXg8Ym9vbGVhbj47XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5Q2hlY2tcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBpbml0KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICghVHJhY2tlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFRyYWNrZXIgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IEtleWJvYXJkRXZlbnQpID0+IFRyYWNrZXJbZS5rZXlDb2RlXSA9IHRydWUpO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4gVHJhY2tlcltlLmtleUNvZGVdID0gZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRvd24oa2V5Om51bWJlcik6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIVRyYWNrZXIgJiYgISFUcmFja2VyW2tleV07XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2V5RXhwcmVzc2lvblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZyk6S2V5RXhwcmVzc2lvblxyXG4gICAge1xyXG4gICAgICAgIGxldCBleGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChleGNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBrZXlzID0gaW5wdXRcclxuICAgICAgICAgICAgLnNwbGl0KC9bXFxzXFwtXFwrXSsvKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gS2V5cy5wYXJzZSh4KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgS2V5RXhwcmVzc2lvbihrZXlzLCBleGNsdXNpdmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBjdHJsOmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYWx0OmJvb2xlYW47XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2hpZnQ6Ym9vbGVhbjtcclxuICAgIHB1YmxpYyByZWFkb25seSBrZXk6bnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGV4Y2x1c2l2ZTpib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3Ioa2V5czpudW1iZXJbXSwgZXhjbHVzaXZlOmJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5leGNsdXNpdmUgPSBleGNsdXNpdmU7XHJcblxyXG4gICAgICAgIHRoaXMuY3RybCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuQ1RSTCk7XHJcbiAgICAgICAgdGhpcy5hbHQgPSBrZXlzLnNvbWUoeCA9PiB4ID09PSBLZXlzLkFMVCk7XHJcbiAgICAgICAgdGhpcy5zaGlmdCA9IGtleXMuc29tZSh4ID0+IHggPT09IEtleXMuU0hJRlQpO1xyXG4gICAgICAgIHRoaXMua2V5ID0ga2V5cy5maWx0ZXIoeCA9PiB4ICE9PSBLZXlzLkNUUkwgJiYgeCAhPT0gS2V5cy5BTFQgJiYgeCAhPT0gS2V5cy5TSElGVClbMF0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlcyhrZXlEYXRhOktleUV4cHJlc3Npb258S2V5Ym9hcmRFdmVudCk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5RXhwcmVzc2lvbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChrZXlEYXRhIGluc3RhbmNlb2YgS2V5Ym9hcmRFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsS2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0S2V5ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleUNvZGVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93ICdLZXlFeHByZXNzaW9uLm1hdGNoZXM6IEludmFsaWQgaW5wdXQnO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJCYXNlLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgfSBmcm9tICcuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcic7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgS2V5TWFwcGFibGUgPSBFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJCYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBLZXlNYXBDYWxsYmFja1xyXG57XHJcbiAgICAoZT86S2V5Ym9hcmRFdmVudCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEtleUlucHV0XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgZm9yKC4uLmVsbXRzOktleU1hcHBhYmxlW10pOktleUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBLZXlJbnB1dChub3JtYWxpemUoZWxtdHMpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YnM6RXZlbnRTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyczpFdmVudEVtaXR0ZXJbXSlcclxuICAgIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb24oZXhwcnM6c3RyaW5nfHN0cmluZ1tdLCBjYWxsYmFjazpLZXlNYXBDYWxsYmFjayk6S2V5SW5wdXRcclxuICAgIHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhwcnMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oWzxzdHJpbmc+ZXhwcnNdLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCByZSBvZiBleHBycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBzcyA9IHRoaXMuZW1pdHRlcnMubWFwKGVlID0+IHRoaXMuY3JlYXRlTGlzdGVuZXIoXHJcbiAgICAgICAgICAgICAgICBlZSxcclxuICAgICAgICAgICAgICAgIEtleUV4cHJlc3Npb24ucGFyc2UocmUpLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2spKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3VicyA9IHRoaXMuc3Vicy5jb25jYXQoc3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVMaXN0ZW5lcihlZTpFdmVudEVtaXR0ZXIsIGtlOktleUV4cHJlc3Npb24sIGNhbGxiYWNrOktleU1hcENhbGxiYWNrKTpFdmVudFN1YnNjcmlwdGlvblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlZS5vbigna2V5ZG93bicsIChldnQ6S2V5Ym9hcmRFdmVudCkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChrZS5tYXRjaGVzKGV2dCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChrZS5leGNsdXNpdmUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplKGttczpLZXlNYXBwYWJsZVtdKTpFdmVudEVtaXR0ZXJbXVxyXG57XHJcbiAgICByZXR1cm4gPEV2ZW50RW1pdHRlcltdPmttc1xyXG4gICAgICAgIC5tYXAoeCA9PiAoISF4WydhZGRFdmVudExpc3RlbmVyJ10pXHJcbiAgICAgICAgICAgID8gbmV3IEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcig8RXZlbnRUYXJnZXQ+eClcclxuICAgICAgICAgICAgOiB4XHJcbiAgICAgICAgKTtcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgS2V5RXhwcmVzc2lvbiB9IGZyb20gJy4vS2V5RXhwcmVzc2lvbic7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEtleXNcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBCQUNLU1BBQ0UgPSA4O1xyXG4gICAgcHVibGljIHN0YXRpYyBUQUIgPSA5O1xyXG4gICAgcHVibGljIHN0YXRpYyBFTlRFUiA9IDEzO1xyXG4gICAgcHVibGljIHN0YXRpYyBTSElGVCA9IDE2O1xyXG4gICAgcHVibGljIHN0YXRpYyBDVFJMID0gMTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEFMVCA9IDE4O1xyXG4gICAgcHVibGljIHN0YXRpYyBQQVVTRSA9IDE5O1xyXG4gICAgcHVibGljIHN0YXRpYyBDQVBTX0xPQ0sgPSAyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVNDQVBFID0gMjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNQQUNFID0gMzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBBR0VfVVAgPSAzMztcclxuICAgIHB1YmxpYyBzdGF0aWMgUEFHRV9ET1dOID0gMzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEVORCA9IDM1O1xyXG4gICAgcHVibGljIHN0YXRpYyBIT01FID0gMzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfQVJST1cgPSAzNztcclxuICAgIHB1YmxpYyBzdGF0aWMgVVBfQVJST1cgPSAzODtcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFRfQVJST1cgPSAzOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRE9XTl9BUlJPVyA9IDQwO1xyXG4gICAgcHVibGljIHN0YXRpYyBJTlNFUlQgPSA0NTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVMRVRFID0gNDY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8wID0gNDg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8xID0gNDk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8yID0gNTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV8zID0gNTE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV80ID0gNTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV81ID0gNTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV82ID0gNTQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV83ID0gNTU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV84ID0gNTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV85ID0gNTc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9BID0gNjU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9CID0gNjY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9DID0gNjc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9EID0gNjg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9FID0gNjk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9GID0gNzA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9HID0gNzE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9IID0gNzI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9JID0gNzM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9KID0gNzQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9LID0gNzU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9MID0gNzY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9NID0gNzc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9OID0gNzg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9PID0gNzk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9QID0gODA7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9RID0gODE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9SID0gODI7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9TID0gODM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9UID0gODQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9VID0gODU7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9WID0gODY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9XID0gODc7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9YID0gODg7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9ZID0gODk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEtFWV9aID0gOTA7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlRfTUVUQSA9IDkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBSSUdIVF9NRVRBID0gOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTEVDVCA9IDkzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMCA9IDk2O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMSA9IDk3O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMiA9IDk4O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfMyA9IDk5O1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNCA9IDEwMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzUgPSAxMDE7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF82ID0gMTAyO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1QQURfNyA9IDEwMztcclxuICAgIHB1YmxpYyBzdGF0aWMgTlVNUEFEXzggPSAxMDQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5VTVBBRF85ID0gMTA1O1xyXG4gICAgcHVibGljIHN0YXRpYyBNVUxUSVBMWSA9IDEwNjtcclxuICAgIHB1YmxpYyBzdGF0aWMgQUREID0gMTA3O1xyXG4gICAgcHVibGljIHN0YXRpYyBTVUJUUkFDVCA9IDEwOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgREVDSU1BTCA9IDExMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgRElWSURFID0gMTExO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMSA9IDExMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjIgPSAxMTM7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYzID0gMTE0O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNCA9IDExNTtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjUgPSAxMTY7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY2ID0gMTE3O1xyXG4gICAgcHVibGljIHN0YXRpYyBGNyA9IDExODtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjggPSAxMTk7XHJcbiAgICBwdWJsaWMgc3RhdGljIEY5ID0gMTIwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGMTAgPSAxMjE7XHJcbiAgICBwdWJsaWMgc3RhdGljIEYxMSA9IDEyMjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRjEyID0gMTIzO1xyXG4gICAgcHVibGljIHN0YXRpYyBOVU1fTE9DSyA9IDE0NDtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0NST0xMX0xPQ0sgPSAxNDU7XHJcbiAgICBwdWJsaWMgc3RhdGljIFNFTUlDT0xPTiA9IDE4NjtcclxuICAgIHB1YmxpYyBzdGF0aWMgRVFVQUxTID0gMTg3O1xyXG4gICAgcHVibGljIHN0YXRpYyBDT01NQSA9IDE4ODtcclxuICAgIHB1YmxpYyBzdGF0aWMgREFTSCA9IDE4OTtcclxuICAgIHB1YmxpYyBzdGF0aWMgUEVSSU9EID0gMTkwO1xyXG4gICAgcHVibGljIHN0YXRpYyBGT1JXQVJEX1NMQVNIID0gMTkxO1xyXG4gICAgcHVibGljIHN0YXRpYyBHUkFWRV9BQ0NFTlQgPSAxOTI7XHJcbiAgICBwdWJsaWMgc3RhdGljIE9QRU5fQlJBQ0tFVCA9IDIxOTtcclxuICAgIHB1YmxpYyBzdGF0aWMgQkFDS19TTEFTSCA9IDIyMDtcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0xPU0VfQlJBQ0tFVCA9IDIyMTtcclxuICAgIHB1YmxpYyBzdGF0aWMgU0lOR0xFX1FVT1RFID0gMjIyO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UoaW5wdXQ6c3RyaW5nLCB0aHJvd25PbkZhaWw6Ym9vbGVhbiA9IHRydWUpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHN3aXRjaCAoaW5wdXQudHJpbSgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS1NQQUNFJzogcmV0dXJuIEtleXMuQkFDS1NQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdUQUInOiByZXR1cm4gS2V5cy5UQUI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0VOVEVSJzogcmV0dXJuIEtleXMuRU5URVI7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NISUZUJzogcmV0dXJuIEtleXMuU0hJRlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NUUkwnOiByZXR1cm4gS2V5cy5DVFJMO1xyXG4gICAgICAgICAgICBjYXNlICdBTFQnOiByZXR1cm4gS2V5cy5BTFQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBVVNFJzogcmV0dXJuIEtleXMuUEFVU0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NBUFNfTE9DSyc6IHJldHVybiBLZXlzLkNBUFNfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnRVNDQVBFJzogcmV0dXJuIEtleXMuRVNDQVBFO1xyXG4gICAgICAgICAgICBjYXNlICdTUEFDRSc6IHJldHVybiBLZXlzLlNQQUNFO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX1VQJzogcmV0dXJuIEtleXMuUEFHRV9VUDtcclxuICAgICAgICAgICAgY2FzZSAnUEFHRV9ET1dOJzogcmV0dXJuIEtleXMuUEFHRV9ET1dOO1xyXG4gICAgICAgICAgICBjYXNlICdFTkQnOiByZXR1cm4gS2V5cy5FTkQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0hPTUUnOiByZXR1cm4gS2V5cy5IT01FO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX0FSUk9XJzogcmV0dXJuIEtleXMuTEVGVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnVVBfQVJST1cnOiByZXR1cm4gS2V5cy5VUF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfQVJST1cnOiByZXR1cm4gS2V5cy5SSUdIVF9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnRE9XTl9BUlJPVyc6IHJldHVybiBLZXlzLkRPV05fQVJST1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0lOU0VSVCc6IHJldHVybiBLZXlzLklOU0VSVDtcclxuICAgICAgICAgICAgY2FzZSAnREVMRVRFJzogcmV0dXJuIEtleXMuREVMRVRFO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMCc6IHJldHVybiBLZXlzLktFWV8wO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfMyc6IHJldHVybiBLZXlzLktFWV8zO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNic6IHJldHVybiBLZXlzLktFWV82O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfOSc6IHJldHVybiBLZXlzLktFWV85O1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfQyc6IHJldHVybiBLZXlzLktFWV9DO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRic6IHJldHVybiBLZXlzLktFWV9GO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSSc6IHJldHVybiBLZXlzLktFWV9JO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTCc6IHJldHVybiBLZXlzLktFWV9MO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfTyc6IHJldHVybiBLZXlzLktFWV9PO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUic6IHJldHVybiBLZXlzLktFWV9SO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVSc6IHJldHVybiBLZXlzLktFWV9VO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWCc6IHJldHVybiBLZXlzLktFWV9YO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdLRVlfWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICcwJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJzEnOiByZXR1cm4gS2V5cy5LRVlfMTtcclxuICAgICAgICAgICAgY2FzZSAnMic6IHJldHVybiBLZXlzLktFWV8yO1xyXG4gICAgICAgICAgICBjYXNlICczJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJzQnOiByZXR1cm4gS2V5cy5LRVlfNDtcclxuICAgICAgICAgICAgY2FzZSAnNSc6IHJldHVybiBLZXlzLktFWV81O1xyXG4gICAgICAgICAgICBjYXNlICc2JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJzcnOiByZXR1cm4gS2V5cy5LRVlfNztcclxuICAgICAgICAgICAgY2FzZSAnOCc6IHJldHVybiBLZXlzLktFWV84O1xyXG4gICAgICAgICAgICBjYXNlICc5JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0EnOiByZXR1cm4gS2V5cy5LRVlfQTtcclxuICAgICAgICAgICAgY2FzZSAnQic6IHJldHVybiBLZXlzLktFWV9CO1xyXG4gICAgICAgICAgICBjYXNlICdDJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0QnOiByZXR1cm4gS2V5cy5LRVlfRDtcclxuICAgICAgICAgICAgY2FzZSAnRSc6IHJldHVybiBLZXlzLktFWV9FO1xyXG4gICAgICAgICAgICBjYXNlICdGJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0cnOiByZXR1cm4gS2V5cy5LRVlfRztcclxuICAgICAgICAgICAgY2FzZSAnSCc6IHJldHVybiBLZXlzLktFWV9IO1xyXG4gICAgICAgICAgICBjYXNlICdJJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0onOiByZXR1cm4gS2V5cy5LRVlfSjtcclxuICAgICAgICAgICAgY2FzZSAnSyc6IHJldHVybiBLZXlzLktFWV9LO1xyXG4gICAgICAgICAgICBjYXNlICdMJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ00nOiByZXR1cm4gS2V5cy5LRVlfTTtcclxuICAgICAgICAgICAgY2FzZSAnTic6IHJldHVybiBLZXlzLktFWV9OO1xyXG4gICAgICAgICAgICBjYXNlICdPJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ1AnOiByZXR1cm4gS2V5cy5LRVlfUDtcclxuICAgICAgICAgICAgY2FzZSAnUSc6IHJldHVybiBLZXlzLktFWV9RO1xyXG4gICAgICAgICAgICBjYXNlICdSJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ1MnOiByZXR1cm4gS2V5cy5LRVlfUztcclxuICAgICAgICAgICAgY2FzZSAnVCc6IHJldHVybiBLZXlzLktFWV9UO1xyXG4gICAgICAgICAgICBjYXNlICdVJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1YnOiByZXR1cm4gS2V5cy5LRVlfVjtcclxuICAgICAgICAgICAgY2FzZSAnVyc6IHJldHVybiBLZXlzLktFWV9XO1xyXG4gICAgICAgICAgICBjYXNlICdYJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1knOiByZXR1cm4gS2V5cy5LRVlfWTtcclxuICAgICAgICAgICAgY2FzZSAnWic6IHJldHVybiBLZXlzLktFWV9aO1xyXG4gICAgICAgICAgICBjYXNlICdMRUZUX01FVEEnOiByZXR1cm4gS2V5cy5MRUZUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1JJR0hUX01FVEEnOiByZXR1cm4gS2V5cy5SSUdIVF9NRVRBO1xyXG4gICAgICAgICAgICBjYXNlICdTRUxFQ1QnOiByZXR1cm4gS2V5cy5TRUxFQ1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8wJzogcmV0dXJuIEtleXMuTlVNUEFEXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8xJzogcmV0dXJuIEtleXMuTlVNUEFEXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8yJzogcmV0dXJuIEtleXMuTlVNUEFEXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF8zJzogcmV0dXJuIEtleXMuTlVNUEFEXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF80JzogcmV0dXJuIEtleXMuTlVNUEFEXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF81JzogcmV0dXJuIEtleXMuTlVNUEFEXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF82JzogcmV0dXJuIEtleXMuTlVNUEFEXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF83JzogcmV0dXJuIEtleXMuTlVNUEFEXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF84JzogcmV0dXJuIEtleXMuTlVNUEFEXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ05VTVBBRF85JzogcmV0dXJuIEtleXMuTlVNUEFEXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ01VTFRJUExZJzogcmV0dXJuIEtleXMuTVVMVElQTFk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FERCc6IHJldHVybiBLZXlzLkFERDtcclxuICAgICAgICAgICAgY2FzZSAnU1VCVFJBQ1QnOiByZXR1cm4gS2V5cy5TVUJUUkFDVDtcclxuICAgICAgICAgICAgY2FzZSAnREVDSU1BTCc6IHJldHVybiBLZXlzLkRFQ0lNQUw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RJVklERSc6IHJldHVybiBLZXlzLkRJVklERTtcclxuICAgICAgICAgICAgY2FzZSAnRjEnOiByZXR1cm4gS2V5cy5GMTtcclxuICAgICAgICAgICAgY2FzZSAnRjInOiByZXR1cm4gS2V5cy5GMjtcclxuICAgICAgICAgICAgY2FzZSAnRjMnOiByZXR1cm4gS2V5cy5GMztcclxuICAgICAgICAgICAgY2FzZSAnRjQnOiByZXR1cm4gS2V5cy5GNDtcclxuICAgICAgICAgICAgY2FzZSAnRjUnOiByZXR1cm4gS2V5cy5GNTtcclxuICAgICAgICAgICAgY2FzZSAnRjYnOiByZXR1cm4gS2V5cy5GNjtcclxuICAgICAgICAgICAgY2FzZSAnRjcnOiByZXR1cm4gS2V5cy5GNztcclxuICAgICAgICAgICAgY2FzZSAnRjgnOiByZXR1cm4gS2V5cy5GODtcclxuICAgICAgICAgICAgY2FzZSAnRjknOiByZXR1cm4gS2V5cy5GOTtcclxuICAgICAgICAgICAgY2FzZSAnRjEwJzogcmV0dXJuIEtleXMuRjEwO1xyXG4gICAgICAgICAgICBjYXNlICdGMTEnOiByZXR1cm4gS2V5cy5GMTE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMic6IHJldHVybiBLZXlzLkYxMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNX0xPQ0snOiByZXR1cm4gS2V5cy5OVU1fTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0NST0xMX0xPQ0snOiByZXR1cm4gS2V5cy5TQ1JPTExfTE9DSztcclxuICAgICAgICAgICAgY2FzZSAnU0VNSUNPTE9OJzogcmV0dXJuIEtleXMuU0VNSUNPTE9OO1xyXG4gICAgICAgICAgICBjYXNlICdFUVVBTFMnOiByZXR1cm4gS2V5cy5FUVVBTFM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NPTU1BJzogcmV0dXJuIEtleXMuQ09NTUE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0RBU0gnOiByZXR1cm4gS2V5cy5EQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdQRVJJT0QnOiByZXR1cm4gS2V5cy5QRVJJT0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0ZPUldBUkRfU0xBU0gnOiByZXR1cm4gS2V5cy5GT1JXQVJEX1NMQVNIO1xyXG4gICAgICAgICAgICBjYXNlICdHUkFWRV9BQ0NFTlQnOiByZXR1cm4gS2V5cy5HUkFWRV9BQ0NFTlQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ09QRU5fQlJBQ0tFVCc6IHJldHVybiBLZXlzLk9QRU5fQlJBQ0tFVDtcclxuICAgICAgICAgICAgY2FzZSAnQkFDS19TTEFTSCc6IHJldHVybiBLZXlzLkJBQ0tfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NMT1NFX0JSQUNLRVQnOiByZXR1cm4gS2V5cy5DTE9TRV9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdTSU5HTEVfUVVPVEUnOiByZXR1cm4gS2V5cy5TSU5HTEVfUVVPVEU7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhyb3duT25GYWlsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIGtleTogJyArIGlucHV0O1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IGllX3NhZmVfY3JlYXRlX21vdXNlX2V2ZW50IH0gZnJvbSAnLi4vbWlzYy9Qb2x5ZmlsbCc7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IE1vdXNlRHJhZ0V2ZW50IH0gZnJvbSAnLi9Nb3VzZURyYWdFdmVudCc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNoZWNrKGVsbXQ6SFRNTEVsZW1lbnQpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9PT0gJ3RydWUnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKGVsbXQ6SFRNTEVsZW1lbnQpOk1vdXNlRHJhZ0V2ZW50U3VwcG9ydFxyXG4gICAge1xyXG4gICAgICAgIGVsbXQuZGF0YXNldFsnTW91c2VEcmFnRXZlbnRTdXBwb3J0J10gPSAndHJ1ZSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZURyYWdFdmVudFN1cHBvcnQoZWxtdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHNob3VsZERyYWc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIGlzRHJhZ2dpbmc6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJvdGVjdGVkIHN0YXJ0UG9pbnQ6UG9pbnQ7XHJcbiAgICBwcm90ZWN0ZWQgbGFzdFBvaW50OlBvaW50O1xyXG4gICAgcHJvdGVjdGVkIGNhbmNlbDooKSA9PiB2b2lkO1xyXG4gICAgcHJvdGVjdGVkIGxpc3RlbmVyOmFueTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocHJvdGVjdGVkIGVsbXQ6SFRNTEVsZW1lbnQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbG10LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIgPSB0aGlzLm9uVGFyZ2V0TW91c2VEb3duLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZWxtdC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmxpc3RlbmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb25UYXJnZXRNb3VzZURvd24oZTpNb3VzZUV2ZW50KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgbGV0IG1vdmVIYW5kbGVyID0gdGhpcy5vbldpbmRvd01vdXNlTW92ZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGxldCB1cEhhbmRsZXIgPSB0aGlzLm9uV2luZG93TW91c2VVcC5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbmNlbCA9ICgpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VNb3ZlKGU6TW91c2VFdmVudCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgbmV3UG9pbnQgPSBuZXcgUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zaG91bGREcmFnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdiZWdpbicsIGUpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnJywgZSwgbmV3UG9pbnQuc3VidHJhY3QodGhpcy5sYXN0UG9pbnQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFBvaW50ID0gbmV3UG9pbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG9uV2luZG93TW91c2VVcChlOk1vdXNlRXZlbnQpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdlbmQnLCBlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmxhc3RQb2ludCA9IG5ldyBQb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNhbmNlbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRXZlbnQodHlwZTpzdHJpbmcsIHNvdXJjZTpNb3VzZUV2ZW50LCBkaXN0PzpQb2ludCk6TW91c2VEcmFnRXZlbnRcclxuICAgIHtcclxuICAgICAgICBsZXQgZXZlbnQgPSA8TW91c2VEcmFnRXZlbnQ+KGllX3NhZmVfY3JlYXRlX21vdXNlX2V2ZW50KHR5cGUsIHNvdXJjZSkpO1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WCA9IHRoaXMuc3RhcnRQb2ludC54O1xyXG4gICAgICAgIGV2ZW50LnN0YXJ0WSA9IHRoaXMuc3RhcnRQb2ludC55O1xyXG5cclxuICAgICAgICBpZiAoZGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RYID0gZGlzdC54O1xyXG4gICAgICAgICAgICBldmVudC5kaXN0WSA9IGRpc3QueTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBLZXlzIH0gZnJvbSAnLi9LZXlzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBLZXlDaGVjayB9IGZyb20gJy4vS2V5Q2hlY2snO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIE1vdXNlRXZlbnRUeXBlID0gJ2NsaWNrJ3wnZGJsY2xpY2snfCdtb3VzZWRvd24nfCdtb3VzZW1vdmUnfCdtb3VzZXVwJ3wnZHJhZ2JlZ2luJ3wnZHJhZyd8J2RyYWdlbmQnXHJcblxyXG5mdW5jdGlvbiBwYXJzZV9ldmVudCh2YWx1ZTpzdHJpbmcpOk1vdXNlRXZlbnRUeXBlXHJcbntcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FzZSAnZG93bic6XHJcbiAgICAgICAgY2FzZSAnbW92ZSc6XHJcbiAgICAgICAgY2FzZSAndXAnOlxyXG4gICAgICAgICAgICByZXR1cm4gPE1vdXNlRXZlbnRUeXBlPignbW91c2UnICsgdmFsdWUpO1xyXG4gICAgICAgIGNhc2UgJ2NsaWNrJzpcclxuICAgICAgICBjYXNlICdkYmxjbGljayc6XHJcbiAgICAgICAgY2FzZSAnZG93bic6XHJcbiAgICAgICAgY2FzZSAnbW92ZSc6XHJcbiAgICAgICAgY2FzZSAndXAnOlxyXG4gICAgICAgIGNhc2UgJ2RyYWdiZWdpbic6XHJcbiAgICAgICAgY2FzZSAnZHJhZyc6XHJcbiAgICAgICAgY2FzZSAnZHJhZ2VuZCc6XHJcbiAgICAgICAgICAgIHJldHVybiA8TW91c2VFdmVudFR5cGU+dmFsdWU7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgTW91c2VFdmVudFR5cGU6ICcgKyB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VfYnV0dG9uKHZhbHVlOnN0cmluZyk6bnVtYmVyXHJcbntcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FzZSAncHJpbWFyeSc6XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMSc6XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIGNhc2UgJ3NlY29uZGFyeSc6XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMic6XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIGNhc2UgJ2J1dHRvbjMnOlxyXG4gICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBNb3VzZUJ1dHRvbjogJyArIHZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXZpZGVfZXhwcmVzc2lvbih2YWx1ZTpzdHJpbmcpOnN0cmluZ1tdXHJcbntcclxuICAgIGxldCBwYXJ0cyA9IHZhbHVlLnNwbGl0KCc6Jyk7XHJcblxyXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PSAxKVxyXG4gICAge1xyXG4gICAgICAgIHBhcnRzLnNwbGljZSgwLCAwLCAnZG93bicpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYXJ0cy5zbGljZSgwLCAyKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlRXhwcmVzc2lvblxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIHBhcnNlKGlucHV0OnN0cmluZyk6TW91c2VFeHByZXNzaW9uXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNmZyA9IDxhbnk+e1xyXG4gICAgICAgICAgICBrZXlzOiBbXSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjZmcuZXhjbHVzaXZlID0gaW5wdXRbMF0gPT09ICchJztcclxuICAgICAgICBpZiAoY2ZnLmV4Y2x1c2l2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IFtsZWZ0LCByaWdodF0gPSBkaXZpZGVfZXhwcmVzc2lvbihpbnB1dCk7XHJcblxyXG4gICAgICAgIGNmZy5ldmVudCA9IHBhcnNlX2V2ZW50KGxlZnQpO1xyXG5cclxuICAgICAgICByaWdodC5zcGxpdCgvW1xcc1xcLVxcK10rLylcclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0gS2V5cy5wYXJzZSh4LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5rZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjZmcuYnV0dG9uID0gcGFyc2VfYnV0dG9uKHgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZUV4cHJlc3Npb24oY2ZnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgZXZlbnQ6TW91c2VFdmVudFR5cGUgPSBudWxsO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGJ1dHRvbjpudW1iZXIgPSBudWxsO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtleXM6bnVtYmVyW10gPSBbXTtcclxuICAgIHB1YmxpYyByZWFkb25seSBleGNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoY2ZnOmFueSlcclxuICAgIHtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCBjZmcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXRjaGVzKG1vdXNlRGF0YTpNb3VzZUV2ZW50KTpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgIT09IG1vdXNlRGF0YS50eXBlKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJ1dHRvbiAhPT0gbnVsbCAmJiB0aGlzLmJ1dHRvbiAhPT0gbW91c2VEYXRhLmJ1dHRvbilcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBrIG9mIHRoaXMua2V5cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghS2V5Q2hlY2suZG93bihrKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJCYXNlLCBFdmVudFN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEtleUV4cHJlc3Npb24gfSBmcm9tICcuL0tleUV4cHJlc3Npb24nO1xyXG5pbXBvcnQgeyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgfSBmcm9tICcuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcic7XHJcbmltcG9ydCB7IE1vdXNlRXhwcmVzc2lvbiB9IGZyb20gJy4vTW91c2VFeHByZXNzaW9uJztcclxuaW1wb3J0IHsgTW91c2VEcmFnRXZlbnRTdXBwb3J0IH0gZnJvbSAnLi9Nb3VzZURyYWdFdmVudFN1cHBvcnQnO1xyXG5pbXBvcnQgeyBLZXlDaGVjayB9IGZyb20gJy4vS2V5Q2hlY2snO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIE1hcHBhYmxlID0gRXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyQmFzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTW91c2VDYWxsYmFja1xyXG57XHJcbiAgICAoZTpFdmVudCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdXNlSW5wdXRcclxue1xyXG4gICAgcHVibGljIHN0YXRpYyBmb3IoLi4uZWxtdHM6TWFwcGFibGVbXSk6TW91c2VJbnB1dFxyXG4gICAge1xyXG4gICAgICAgIEtleUNoZWNrLmluaXQoKTtcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlSW5wdXQobm9ybWFsaXplKGVsbXRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdWJzOkV2ZW50U3Vic2NyaXB0aW9uW10gPSBbXTtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgZW1pdHRlcnM6RXZlbnRFbWl0dGVyW10pXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9uKGV4cHI6c3RyaW5nLCBjYWxsYmFjazpNb3VzZUNhbGxiYWNrKTpNb3VzZUlucHV0XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHNzID0gdGhpcy5lbWl0dGVycy5tYXAoZWUgPT4gdGhpcy5jcmVhdGVMaXN0ZW5lcihcclxuICAgICAgICAgICAgZWUsXHJcbiAgICAgICAgICAgIE1vdXNlRXhwcmVzc2lvbi5wYXJzZShleHByKSxcclxuICAgICAgICAgICAgY2FsbGJhY2spKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlTGlzdGVuZXIodGFyZ2V0OkV2ZW50RW1pdHRlciwgZXhwcjpNb3VzZUV4cHJlc3Npb24sIGNhbGxiYWNrOk1vdXNlQ2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldC5vbihleHByLmV2ZW50LCAoZXZ0Ok1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZXhwci5tYXRjaGVzKGV2dCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChleHByLmV4Y2x1c2l2ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZ0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUoa21zOk1hcHBhYmxlW10pOkV2ZW50RW1pdHRlcltdXHJcbntcclxuICAgIHJldHVybiA8RXZlbnRFbWl0dGVyW10+a21zXHJcbiAgICAgICAgLm1hcCh4ID0+ICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICAgICAgPyBuZXcgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKDxFdmVudFRhcmdldD54KVxyXG4gICAgICAgICAgICA6IHhcclxuICAgICAgICApO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgKiBhcyBiYXNlcyBmcm9tICdiYXNlcyc7XHJcblxyXG5cclxuY29uc3QgQWxwaGEyNiA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XHJcblxyXG5leHBvcnQgY2xhc3MgQmFzZTI2XHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgbnVtKG51bTpudW1iZXIpOkJhc2UyNiBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJhc2UyNihudW0sIGJhc2VzLnRvQWxwaGFiZXQobnVtLCBBbHBoYTI2KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBzdHIoc3RyOnN0cmluZyk6QmFzZTI2IFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmFzZTI2KGJhc2VzLmZyb21BbHBoYWJldChzdHIudG9VcHBlckNhc2UoKSwgQWxwaGEyNiksIHN0cik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IG51bTpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3RyOnN0cmluZztcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKG51bTpudW1iZXIsIHN0cjpzdHJpbmcpIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubnVtID0gbnVtO1xyXG4gICAgICAgIHRoaXMuc3RyID0gc3RyO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgT2JqZWN0TWFwIH0gZnJvbSAnLi9JbnRlcmZhY2VzJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoaHRtbDpzdHJpbmcpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIGxldCBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgbGV0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XHJcbiAgICBmcmFnLmFwcGVuZENoaWxkKGJvZHkpO1xyXG4gICAgYm9keS5pbm5lckhUTUwgPSBodG1sO1xyXG5cclxuICAgIHJldHVybiA8SFRNTEVsZW1lbnQ+Ym9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNzcyhlOkhUTUxFbGVtZW50LCBzdHlsZXM6T2JqZWN0TWFwPHN0cmluZz4pOkhUTUxFbGVtZW50XHJcbntcclxuICAgIGZvciAobGV0IHByb3AgaW4gc3R5bGVzKVxyXG4gICAge1xyXG4gICAgICAgIGUuc3R5bGVbcHJvcF0gPSBzdHlsZXNbcHJvcF07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaXQoZTpIVE1MRWxlbWVudCwgdGFyZ2V0OkhUTUxFbGVtZW50KTpIVE1MRWxlbWVudFxyXG57XHJcbiAgICByZXR1cm4gY3NzKGUsIHtcclxuICAgICAgICB3aWR0aDogdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHRhcmdldC5jbGllbnRIZWlnaHQgKyAncHgnLFxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoaWRlKGU6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwgeyBkaXNwbGF5OiAnbm9uZScgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG93KGU6SFRNTEVsZW1lbnQpOkhUTUxFbGVtZW50XHJcbntcclxuICAgIHJldHVybiBjc3MoZSwgeyBkaXNwbGF5OiAnYmxvY2snIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlKGU6SFRNTEVsZW1lbnQsIHZpc2libGU6Ym9vbGVhbik6SFRNTEVsZW1lbnRcclxue1xyXG4gICAgcmV0dXJuIHZpc2libGUgPyBzaG93KGUpIDogaGlkZShlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpbmdsZVRyYW5zaXRpb24oZTpIVE1MRWxlbWVudCwgcHJvcDpzdHJpbmcsIG1pbGxpczpudW1iZXIsIGVhc2U6c3RyaW5nID0gJ2xpbmVhcicpOnZvaWRcclxue1xyXG4gICAgZS5zdHlsZS50cmFuc2l0aW9uID0gYCR7cHJvcH0gJHttaWxsaXN9bXMgJHtlYXNlfWA7XHJcbiAgICBjb25zb2xlLmxvZyhlLnN0eWxlLnRyYW5zaXRpb24pO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiBlLnN0eWxlLnRyYW5zaXRpb24gPSAnJywgbWlsbGlzKTtcclxufSIsIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGllX3NhZmVfY3JlYXRlX21vdXNlX2V2ZW50KHR5cGU6c3RyaW5nLCBzb3VyY2U6TW91c2VFdmVudCk6TW91c2VFdmVudFxyXG57XHJcbiAgICBpZiAoTW91c2VFdmVudC5wcm90b3R5cGUuaW5pdE1vdXNlRXZlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJNb3VzZUV2ZW50XCIpO1xyXG4gICAgICAgIGV2ZW50LmluaXRNb3VzZUV2ZW50KFxyXG4gICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICBzb3VyY2UuYnViYmxlcyxcclxuICAgICAgICAgICAgc291cmNlLmNhbmNlbGFibGUsXHJcbiAgICAgICAgICAgIHdpbmRvdyxcclxuICAgICAgICAgICAgc291cmNlLmRldGFpbCxcclxuICAgICAgICAgICAgc291cmNlLnNjcmVlblgsXHJcbiAgICAgICAgICAgIHNvdXJjZS5zY3JlZW5ZLFxyXG4gICAgICAgICAgICBzb3VyY2UuY2xpZW50WCxcclxuICAgICAgICAgICAgc291cmNlLmNsaWVudFksXHJcbiAgICAgICAgICAgIHNvdXJjZS5jdHJsS2V5LFxyXG4gICAgICAgICAgICBzb3VyY2UuYWx0S2V5LFxyXG4gICAgICAgICAgICBzb3VyY2Uuc2hpZnRLZXksXHJcbiAgICAgICAgICAgIHNvdXJjZS5tZXRhS2V5LFxyXG4gICAgICAgICAgICBzb3VyY2UuYnV0dG9uLFxyXG4gICAgICAgICAgICBzb3VyY2UucmVsYXRlZFRhcmdldCxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKTtcclxuICAgIH1cclxufSIsImV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2tcclxue1xyXG4gICAgKG9iajphbnksIHZhbDphbnkpOnZvaWRcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5KGRlZmF1bHRWYWx1ZTphbnksIGZpbHRlcjpQcm9wZXJ0eUNoYW5nZWRDYWxsYmFjaylcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0b3I6YW55LCBwcm9wTmFtZTpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgcHJvcE5hbWUsIHtcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWwgPSB0aGlzWydfXycgKyBwcm9wTmFtZV07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbCA9PT0gdW5kZWZpbmVkKSA/IGRlZmF1bHRWYWx1ZSA6IHZhbDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihuZXdWYWwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BOYW1lXSA9IG5ld1ZhbDtcclxuICAgICAgICAgICAgICAgIGZpbHRlcih0aGlzLCBuZXdWYWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmxldCBzdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCk7XHJcbmxldCBjb3VudCA9IDA7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVmR2VuXHJcbntcclxuICAgIHB1YmxpYyBzdGF0aWMgbmV4dChwcmVmaXg6c3RyaW5nID0gJ0MnKTpzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcHJlZml4ICsgc3RhcnQgKyAnLScgKyAoY291bnQrKyk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgT2JqZWN0SW5kZXgsIE9iamVjdE1hcCB9IGZyb20gJy4vSW50ZXJmYWNlcyc7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvYWxlc2NlPFQ+KC4uLmlucHV0czpUW10pOlRcclxue1xyXG4gICAgZm9yIChsZXQgeCBvZiBpbnB1dHMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHggIT09IHVuZGVmaW5lZCAmJiB4ICE9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQodGFyZ2V0OmFueSwgZGF0YTphbnkpOmFueVxyXG57XHJcbiAgICBmb3IgKGxldCBrIGluIGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0W2tdID0gZGF0YVtrXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXg8VD4oYXJyOlRbXSwgaW5kZXhlcjoodG06VCkgPT4gbnVtYmVyfHN0cmluZyk6T2JqZWN0TWFwPFQ+XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCB0bSBvZiBhcnIpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqW2luZGV4ZXIodG0pXSA9IHRtO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuPFQ+KGFhOmFueSk6VFtdIFxyXG57XHJcbiAgICBsZXQgYSA9IFtdIGFzIGFueTtcclxuICAgIGZvciAobGV0IHRtIG9mIGFhKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0bSkpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYSA9IGEuY29uY2F0KGZsYXR0ZW4odG0pKTtcclxuICAgICAgICB9IGVsc2UgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhLnB1c2godG0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEgYXMgVFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24ga2V5czxUPihpeDpPYmplY3RJbmRleDxUPnxPYmplY3RNYXA8VD4pOnN0cmluZ1tdXHJcbntcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhpeCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWx1ZXM8VD4oaXg6T2JqZWN0SW5kZXg8VD58T2JqZWN0TWFwPFQ+KTpUW11cclxue1xyXG4gICAgbGV0IGE6VFtdID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgayBpbiBpeClcclxuICAgIHtcclxuICAgICAgICBhLnB1c2goaXhba10pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gemlwUGFpcnMocGFpcnM6YW55W11bXSk6YW55XHJcbntcclxuICAgIGxldCBvYmogPSB7fTtcclxuXHJcbiAgICBmb3IgKGxldCBwYWlyIG9mIHBhaXJzKVxyXG4gICAge1xyXG4gICAgICAgIG9ialtwYWlyWzBdXSA9IHBhaXJbMV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuemlwUGFpcnMocGFpcnM6YW55KTphbnlbXVtdXHJcbntcclxuICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBrZXkgaW4gcGFpcnMpXHJcbiAgICB7XHJcbiAgICAgICAgYXJyLnB1c2goW2tleSwgcGFpcnNba2V5XV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhcnI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXg8VD4oYXJyOlRbXSwgc2VsZWN0b3I6KHQ6VCkgPT4gbnVtYmVyKTpUXHJcbntcclxuICAgIGlmIChhcnIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIGxldCB0ID0gYXJyWzBdO1xyXG5cclxuICAgIGZvciAobGV0IHggb2YgYXJyKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChzZWxlY3Rvcih0KSA8IHNlbGVjdG9yKHgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdCA9IHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hhZG93Q2xvbmUodGFyZ2V0OmFueSk6YW55XHJcbntcclxuICAgIGlmICh0eXBlb2YodGFyZ2V0KSA9PT0gJ29iamVjdCcpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHNjID0ge30gYXMgYW55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRhcmdldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNjW3Byb3BdID0gc2hhZG93Q2xvbmUodGFyZ2V0W3Byb3BdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzYztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59IiwiaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL2dlb20vUmVjdCc7XHJcbmltcG9ydCB7IEJhc2UyNiB9IGZyb20gJy4uL21pc2MvQmFzZTI2JztcclxuaW1wb3J0IHsgT2JqZWN0TWFwIH0gZnJvbSAnLi4vbWlzYy9JbnRlcmZhY2VzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4vR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuL0dyaWRNb2RlbCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlc2NyaWJlcyBhIHJlc29sdmVFeHByIG9mIGdyaWQgY2VsbHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZFJhbmdlXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyBHcmlkUmFuZ2Ugb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNlbGxzIHdpdGggdGhlIHNwZWNpZmllZCByZWZzIGZyb20gdGhlXHJcbiAgICAgKiBzcGVjaWZpZWQgbW9kZWwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1vZGVsXHJcbiAgICAgKiBAcGFyYW0gY2VsbFJlZnNcclxuICAgICAqIEByZXR1cm5zIHtSYW5nZX1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUobW9kZWw6R3JpZE1vZGVsLCBjZWxsUmVmczpzdHJpbmdbXSk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IF8uaW5kZXgoY2VsbFJlZnMsIHggPT4geCk7XHJcblxyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIGxldCBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBtb2RlbC5jZWxscylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghbG9va3VwW2MucmVmXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY2VsbHMucHVzaChjKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsYyA+IGMuY29sUmVmKSBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZikgaGMgPSBjLmNvbFJlZjtcclxuICAgICAgICAgICAgaWYgKGxyID4gYy5yb3dSZWYpIGxyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgICAgIGlmIChociA8IGMucm93UmVmKSBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgIGxldCB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBHcmlkUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FwdHVyZXMgYSByYW5nZSBvZiBjZWxscyBmcm9tIHRoZSBzcGVjaWZpZWQgbW9kZWwgYmFzZWQgb24gdGhlIHNwZWNpZmllZCB2ZWN0b3JzLiAgVGhlIHZlY3RvcnMgc2hvdWxkIGJlXHJcbiAgICAgKiB0d28gcG9pbnRzIGluIGdyaWQgY29vcmRpbmF0ZXMgKGUuZy4gY29sIGFuZCByb3cgcmVmZXJlbmNlcykgdGhhdCBkcmF3IGEgbG9naWNhbCBsaW5lIGFjcm9zcyB0aGUgZ3JpZC5cclxuICAgICAqIEFueSBjZWxscyBmYWxsaW5nIGludG8gdGhlIHJlY3RhbmdsZSBjcmVhdGVkIGZyb20gdGhlc2UgdHdvIHBvaW50cyB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBzZWxlY3RlZCByZXNvbHZlRXhwci5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBmcm9tXHJcbiAgICAgKiBAcGFyYW0gdG9cclxuICAgICAqIEBwYXJhbSB0b0luY2x1c2l2ZVxyXG4gICAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNhcHR1cmUobW9kZWw6R3JpZE1vZGVsLCBmcm9tOlBvaW50LCB0bzpQb2ludCwgdG9JbmNsdXNpdmU6Ym9vbGVhbiA9IGZhbHNlKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICAvL1RPRE86IEV4cGxhaW4gdGhpcy4uLlxyXG4gICAgICAgIGxldCB0bCA9IG5ldyBQb2ludChmcm9tLnggPCB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55IDwgdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG4gICAgICAgIGxldCBiciA9IG5ldyBQb2ludChmcm9tLnggPiB0by54ID8gZnJvbS54IDogdG8ueCwgZnJvbS55ID4gdG8ueSA/IGZyb20ueSA6IHRvLnkpO1xyXG5cclxuICAgICAgICBpZiAodG9JbmNsdXNpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBiciA9IGJyLmFkZCgxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaW1zID0gUmVjdC5mcm9tUG9pbnRzKHRsLCBicik7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXSBhcyBHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCByID0gZGltcy50b3A7IHIgPCBkaW1zLmJvdHRvbTsgcisrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYyA9IGRpbXMubGVmdDsgYyA8IGRpbXMucmlnaHQ7IGMrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBtb2RlbC5sb2NhdGVDZWxsKGMsIHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNlbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR3JpZFJhbmdlLmNyZWF0ZUludGVybmFsKG1vZGVsLCByZXN1bHRzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3RzIGEgcmFuZ2Ugb2YgY2VsbHMgdXNpbmcgYW4gRXhjZWwtbGlrZSByYW5nZSBleHByZXNzaW9uLiBGb3IgZXhhbXBsZTpcclxuICAgICAqIC0gQTEgc2VsZWN0cyBhIDF4MSByYW5nZSBvZiB0aGUgZmlyc3QgY2VsbFxyXG4gICAgICogLSBBMTpBNSBzZWxlY3RzIGEgMXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgaG9yaXpvbnRhbGx5LlxyXG4gICAgICogLSBBMTpFNSBzZWxlY3RzIGEgNXg1IHJhbmdlIGZyb20gdGhlIGZpcnN0IGNlbGwgZXZlbmx5LlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gbW9kZWxcclxuICAgICAqIEBwYXJhbSBxdWVyeVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNlbGVjdChtb2RlbDpHcmlkTW9kZWwsIHF1ZXJ5OnN0cmluZyk6R3JpZFJhbmdlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IFtmcm9tLCB0b10gPSBxdWVyeS5zcGxpdCgnOicpO1xyXG4gICAgICAgIGxldCBmcm9tQ2VsbCA9IHJlc29sdmVfZXhwcl9yZWYobW9kZWwsIGZyb20pO1xyXG5cclxuICAgICAgICBpZiAoIXRvKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCEhZnJvbUNlbGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBHcmlkUmFuZ2UuY3JlYXRlSW50ZXJuYWwobW9kZWwsIFtmcm9tQ2VsbF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB0b0NlbGwgPSByZXNvbHZlX2V4cHJfcmVmKG1vZGVsLCB0byk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISFmcm9tQ2VsbCAmJiAhIXRvQ2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb21WZWN0b3IgPSBuZXcgUG9pbnQoZnJvbUNlbGwuY29sUmVmLCBmcm9tQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRvVmVjdG9yID0gbmV3IFBvaW50KHRvQ2VsbC5jb2xSZWYsIHRvQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEdyaWRSYW5nZS5jYXB0dXJlKG1vZGVsLCBmcm9tVmVjdG9yLCB0b1ZlY3RvciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBHcmlkUmFuZ2UuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZW1wdHkgR3JpZFJhbmdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZW1wdHkoKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogW10sXHJcbiAgICAgICAgICAgIHR0YjogW10sXHJcbiAgICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMCxcclxuICAgICAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlSW50ZXJuYWwobW9kZWw6R3JpZE1vZGVsLCBjZWxsczpHcmlkQ2VsbFtdKTpHcmlkUmFuZ2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbGMgPSBOdW1iZXIuTUFYX1ZBTFVFLCBsciA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgbGV0IGhjID0gTnVtYmVyLk1JTl9WQUxVRSwgaHIgPSBOdW1iZXIuTUlOX1ZBTFVFO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNlbGxzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGxjID4gYy5jb2xSZWYpIGxjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChoYyA8IGMuY29sUmVmKSBoYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAobHIgPiBjLnJvd1JlZikgbHIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgaWYgKGhyIDwgYy5yb3dSZWYpIGhyID0gYy5yb3dSZWY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbHRyOkdyaWRDZWxsW107XHJcbiAgICAgICAgbGV0IHR0YjpHcmlkQ2VsbFtdO1xyXG5cclxuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGx0ciA9IGNlbGxzLnNvcnQobHRyX3NvcnQpO1xyXG4gICAgICAgICAgICB0dGIgPSBjZWxscy5zbGljZSgwKS5zb3J0KHR0Yl9zb3J0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbHRyID0gdHRiID0gY2VsbHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRSYW5nZSh7XHJcbiAgICAgICAgICAgIGx0cjogbHRyLFxyXG4gICAgICAgICAgICB0dGI6IHR0YixcclxuICAgICAgICAgICAgd2lkdGg6IGhjIC0gbGMsXHJcbiAgICAgICAgICAgIGhlaWdodDogaHIgLSBscixcclxuICAgICAgICAgICAgbGVuZ3RoOiAoaGMgLSBsYykgKiAoaHIgLSBsciksXHJcbiAgICAgICAgICAgIGNvdW50OiBjZWxscy5sZW5ndGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbHRyOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2VsbHMgaW4gdGhlIHJlc29sdmVFeHByIG9yZGVyZWQgZnJvbSB0b3AgdG8gYm90dG9tLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHRiOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaXRoIHdpZHRoIG9mIHRoZSByZXNvbHZlRXhwciBpbiBjb2x1bW5zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgd2lkdGg6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2l0aCBoZWlnaHQgb2YgdGhlIHJlc29sdmVFeHByIGluIHJvd3MuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBoZWlnaHQ6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG51bWJlciBvZiBjZWxscyBpbiB0aGUgcmVzb2x2ZUV4cHIgKHdpbGwgYmUgZGlmZmVyZW50IHRvIGxlbmd0aCBpZiBzb21lIGNlbGwgc2xvdHMgY29udGFpbiBubyBjZWxscykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBjb3VudDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbGVuZ3RoIG9mIHRoZSByZXNvbHZlRXhwciAobnVtYmVyIG9mIHJvd3MgKiBudW1iZXIgb2YgY29sdW1ucykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSBsZW5ndGg6bnVtYmVyO1xyXG5cclxuICAgIHByaXZhdGUgaW5kZXg6T2JqZWN0TWFwPEdyaWRDZWxsPjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKHZhbHVlczphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgdmFsdWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIG9yIG5vdCBhIGNlbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29udGFpbnMoY2VsbFJlZjpzdHJpbmcpOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaW5kZXgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gXy5pbmRleCh0aGlzLmx0ciwgeCA9PiB4LnJlZik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISF0aGlzLmluZGV4W2NlbGxSZWZdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJlZmVyZW5jZXMgZm9yIGFsbCB0aGUgY2VsbHMgaW4gdGhlIHJhbmdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVmcygpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubHRyLm1hcCh4ID0+IHgucmVmKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbHRyX3NvcnQoYTpHcmlkQ2VsbCwgYjpHcmlkQ2VsbCk6bnVtYmVyXHJcbntcclxuICAgIGxldCBuID0gMDtcclxuXHJcbiAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIGlmIChuID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0dGJfc29ydChhOkdyaWRDZWxsLCBiOkdyaWRDZWxsKTpudW1iZXJcclxue1xyXG4gICAgbGV0IG4gPSAwO1xyXG5cclxuICAgIG4gPSBhLmNvbFJlZiAtIGIuY29sUmVmO1xyXG4gICAgaWYgKG4gPT09IDApXHJcbiAgICB7XHJcbiAgICAgICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVfZXhwcl9yZWYobW9kZWw6R3JpZE1vZGVsLCB2YWx1ZTpzdHJpbmcpOkdyaWRDZWxsXHJcbntcclxuICAgIGNvbnN0IFJlZkNvbnZlcnQgPSAvKFtBLVphLXpdKykoWzAtOV0rKS9nO1xyXG5cclxuICAgIFJlZkNvbnZlcnQubGFzdEluZGV4ID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBSZWZDb252ZXJ0LmV4ZWModmFsdWUpO1xyXG5cclxuICAgIGxldCBjb2xSZWYgPSBCYXNlMjYuc3RyKHJlc3VsdFsxXSkubnVtO1xyXG4gICAgbGV0IHJvd1JlZiA9IHBhcnNlSW50KHJlc3VsdFsyXSkgLSAxO1xyXG5cclxuICAgIHJldHVybiBtb2RlbC5sb2NhdGVDZWxsKGNvbFJlZiwgcm93UmVmKTtcclxufSIsImltcG9ydCB7IFJlZkdlbiB9IGZyb20gJy4uLy4uL21pc2MvUmVmR2VuJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9HcmlkQ2VsbCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnLi4vLi4vbWlzYy9VdGlsJztcclxuaW1wb3J0IHsgdmlzdWFsaXplLCByZW5kZXJlciB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZWZpbmVzIHRoZSBwYXJhbWV0ZXJzIHRoYXQgY2FuL3Nob3VsZCBiZSBwYXNzZWQgdG8gYSBuZXcgRGVmYXVsdEdyaWRDZWxsIGluc3RhbmNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgY29sUmVmOm51bWJlcjtcclxuICAgIHJvd1JlZjpudW1iZXI7XHJcbiAgICB2YWx1ZTpzdHJpbmc7XHJcbiAgICByZWY/OnN0cmluZztcclxuICAgIGNvbFNwYW4/Om51bWJlcjtcclxuICAgIHJvd1NwYW4/Om51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENlbGwuXHJcbiAqL1xyXG5AcmVuZGVyZXIoZHJhdylcclxuZXhwb3J0IGNsYXNzIERlZmF1bHRHcmlkQ2VsbCBpbXBsZW1lbnRzIEdyaWRDZWxsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNlbGwgcmVmZXJlbmNlLCBtdXN0IGJlIHVuaXF1ZSBwZXIgR3JpZE1vZGVsIGluc3RhbmNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOnN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb2x1bW4gcmVmZXJlbmNlIHRoYXQgZGVzY3JpYmVzIHRoZSBob3Jpem9udGFsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sUmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgY29sdW1ucyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbFNwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvdyByZWZlcmVuY2UgdGhhdCBkZXNjcmliZXMgdGhlIHZlcnRpY2FsIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93UmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyB0aGF0IHRoaXMgY2VsbCBzcGFucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd1NwYW46bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHZhbHVlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdmFsdWU6c3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRDZWxsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOkRlZmF1bHRHcmlkQ2VsbFBhcmFtcylcclxuICAgIHtcclxuICAgICAgICBwYXJhbXMucmVmID0gcGFyYW1zLnJlZiB8fCBSZWZHZW4ubmV4dCgpO1xyXG4gICAgICAgIHBhcmFtcy5jb2xTcGFuID0gcGFyYW1zLmNvbFNwYW4gfHwgMTtcclxuICAgICAgICBwYXJhbXMucm93U3BhbiA9IHBhcmFtcy5yb3dTcGFuIHx8IDE7XHJcbiAgICAgICAgcGFyYW1zLnZhbHVlID0gKHBhcmFtcy52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHBhcmFtcy52YWx1ZSA9PT0gbnVsbCkgPyAnJyA6IHBhcmFtcy52YWx1ZTtcclxuXHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgcGFyYW1zKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZHJhdyhnZng6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCB2aXN1YWw6YW55KTp2b2lkXHJcbntcclxuICAgIGdmeC5saW5lV2lkdGggPSAxO1xyXG4gICAgbGV0IGF2ID0gZ2Z4LmxpbmVXaWR0aCAlIDIgPT0gMCA/IDAgOiAwLjU7XHJcblxyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgZ2Z4LnN0cm9rZVN0eWxlID0gJ2xpZ2h0Z3JheSc7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgdmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gJ2JsYWNrJztcclxuICAgIGdmeC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgIGdmeC5mb250ID0gYDEzcHggU2Fucy1TZXJpZmA7XHJcbiAgICBnZnguZmlsbFRleHQodmlzdWFsLnZhbHVlLCAzLCAwICsgKHZpc3VhbC5oZWlnaHQgLyAyKSk7XHJcbn0iLCJpbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgYnktdGhlLWJvb2sgaW1wbGVtZW50YXRpb24gb2YgR3JpZENvbHVtbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZWZhdWx0R3JpZENvbHVtbiBpbXBsZW1lbnRzIEdyaWRDb2x1bW5cclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sdW1uIHJlZmVyZW5jZSwgbXVzdCBiZSB1bmlxdWUgcGVyIEdyaWRNb2RlbCBpbnN0YW5jZS4gIFVzZWQgdG8gaW5kaWNhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gICAgICogY29sdW1uIHdpdGhpbiB0aGUgZ3JpZCBiYXNlZCBvbiBhIHplcm8taW5kZXguXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByZWY6bnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHdpZHRoIG9mIHRoZSBjb2x1bW4uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aWR0aDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZENvbHVtbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gd2lkdGhcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVmOm51bWJlciwgd2lkdGg6bnVtYmVyID0gMTAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcbmltcG9ydCB7IE9iamVjdEluZGV4LCBPYmplY3RNYXAgfSBmcm9tICcuLi8uLi9taXNjL0ludGVyZmFjZXMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcbmltcG9ydCB7IEdyaWRDZWxsIH0gZnJvbSAnLi4vR3JpZENlbGwnO1xyXG5pbXBvcnQgeyBHcmlkQ29sdW1uIH0gZnJvbSAnLi4vR3JpZENvbHVtbic7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSb3cgfSBmcm9tICcuLi9HcmlkUm93JztcclxuaW1wb3J0IHsgRGVmYXVsdEdyaWRDZWxsIH0gZnJvbSAnLi9EZWZhdWx0R3JpZENlbGwnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRNb2RlbC4gIEFsbCBpbnNwZWN0aW9uIG1ldGhvZHMgdXNlIE8oMSkgaW1wbGVtZW50YXRpb25zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIERlZmF1bHRHcmlkTW9kZWwgaW1wbGVtZW50cyBHcmlkTW9kZWxcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuIGdyaWQgbW9kZWwgd2l0aCB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBjb2x1bW5zIGFuZCByb3dzIHBvcHVsYXRlZCB3aXRoIGRlZmF1bHQgY2VsbHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGNvbHNcclxuICAgICAqIEBwYXJhbSByb3dzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZGltKGNvbHM6bnVtYmVyLCByb3dzOm51bWJlcik6RGVmYXVsdEdyaWRNb2RlbFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjZWxscyA9IFtdIGFzIEdyaWRDZWxsW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29sczsgYysrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCByb3dzOyByKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNlbGxzLnB1c2gobmV3IERlZmF1bHRHcmlkQ2VsbCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sUmVmOiBjLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvd1JlZjogcixcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgRGVmYXVsdEdyaWRNb2RlbChjZWxscywgW10sIFtdKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gZW1wdHkgZ3JpZCBtb2RlbC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7RGVmYXVsdEdyaWRNb2RlbH1cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBlbXB0eSgpOkRlZmF1bHRHcmlkTW9kZWxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRHcmlkTW9kZWwoW10sIFtdLCBbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZ3JpZCBjZWxsIGRlZmluaXRpb25zLiAgVGhlIG9yZGVyIGlzIGFyYml0cmFyeS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGNlbGxzOkdyaWRDZWxsW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZ3JpZCBjb2x1bW4gZGVmaW5pdGlvbnMuICBUaGUgb3JkZXIgaXMgYXJiaXRyYXJ5LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29sdW1uczpHcmlkQ29sdW1uW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZ3JpZCByb3cgZGVmaW5pdGlvbnMuICBUaGUgb3JkZXIgaXMgYXJiaXRyYXJ5LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm93czpHcmlkUm93W107XHJcblxyXG4gICAgcHJpdmF0ZSByZWZzOk9iamVjdE1hcDxHcmlkQ2VsbD47XHJcbiAgICBwcml2YXRlIGNvb3JkczpPYmplY3RJbmRleDxPYmplY3RJbmRleDxHcmlkQ2VsbD4+O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGl6ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRGVmYXVsdEdyaWRNb2RlbC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gY2VsbHNcclxuICAgICAqIEBwYXJhbSBjb2x1bW5zXHJcbiAgICAgKiBAcGFyYW0gcm93c1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihjZWxsczpHcmlkQ2VsbFtdLCBjb2x1bW5zOkdyaWRDb2x1bW5bXSwgcm93czpHcmlkUm93W10pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jZWxscyA9IGNlbGxzO1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gcm93cztcclxuXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGNlbGwgcmVmLCByZXR1cm5zIHRoZSBHcmlkQ2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBjZWxsLCBvciBudWxsIGlmIHRoZSBjZWxsIGRpZCBub3QgZXhpc3RcclxuICAgICAqIHdpdGhpbiB0aGUgbW9kZWwuXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBmaW5kQ2VsbChyZWY6c3RyaW5nKTpHcmlkQ2VsbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZnNbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBjZWxsIHJlZiwgcmV0dXJucyB0aGUgR3JpZENlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgbmVpZ2hib3JpbmcgY2VsbCBhcyBwZXIgdGhlIHNwZWNpZmllZFxyXG4gICAgICogdmVjdG9yIChkaXJlY3Rpb24pIG9iamVjdCwgb3IgbnVsbCBpZiBubyBuZWlnaGJvciBjb3VsZCBiZSBmb3VuZC5cclxuICAgICAqIEBwYXJhbSByZWZcclxuICAgICAqIEBwYXJhbSB2ZWN0b3JcclxuICAgICAqL1xyXG4gICAgcHVibGljIGZpbmRDZWxsTmVpZ2hib3IocmVmOnN0cmluZywgdmVjdG9yOlBvaW50KTpHcmlkQ2VsbFxyXG4gICAge1xyXG4gICAgICAgIGxldCBjZWxsID0gdGhpcy5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgIGxldCBjb2wgPSBjZWxsLmNvbFJlZiArIHZlY3Rvci54O1xyXG4gICAgICAgIGxldCByb3cgPSBjZWxsLnJvd1JlZiArIHZlY3Rvci55O1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGVDZWxsKGNvbCwgcm93KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgY2VsbCBjb2x1bW4gcmVmIGFuZCByb3cgcmVmLCByZXR1cm5zIHRoZSBHcmlkQ2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBjZWxsIGF0IHRoZSBsb2NhdGlvbixcclxuICAgICAqIG9yIG51bGwgaWYgbm8gY2VsbCBjb3VsZCBiZSBmb3VuZC5cclxuICAgICAqIEBwYXJhbSBjb2xSZWZcclxuICAgICAqIEBwYXJhbSByb3dSZWZcclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvY2F0ZUNlbGwoY29sOm51bWJlciwgcm93Om51bWJlcik6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuY29vcmRzW2NvbF0gfHwge30pW3Jvd10gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZnJlc2hlcyBpbnRlcm5hbCBjYWNoZXMgdXNlZCB0byBvcHRpbWl6ZSBsb29rdXBzIGFuZCBzaG91bGQgYmUgaW52b2tlZCBhZnRlciB0aGUgbW9kZWwgaGFzIGJlZW4gY2hhbmdlZCAoc3RydWN0dXJhbGx5KS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlZnJlc2goKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgY2VsbHMgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMucmVmcyA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgICAgIHRoaXMuY29vcmRzID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNlbGwgb2YgY2VsbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjbyA9IDA7IGNvIDwgY2VsbC5jb2xTcGFuOyBjbysrKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcm8gPSAwOyBybyA8IGNlbGwucm93U3Bhbjsgcm8rKylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYyA9IGNlbGwuY29sUmVmICsgY287XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBjZWxsLnJvd1JlZiArIHJvO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2l4ID0gdGhpcy5jb29yZHNbY10gfHwgKHRoaXMuY29vcmRzW2NdID0ge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaXhbcl0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1R3byBjZWxscyBhcHBlYXIgdG8gb2NjdXB5JywgYywgJ3gnLCByKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2l4W3JdID0gY2VsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JpZFJvdyB9IGZyb20gJy4uL0dyaWRSb3cnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIGJ5LXRoZS1ib29rIGltcGxlbWVudGF0aW9uIG9mIEdyaWRSb3cuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRGVmYXVsdEdyaWRSb3cgaW1wbGVtZW50cyBHcmlkUm93XHJcbntcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvdyByZWZlcmVuY2UsIG11c3QgYmUgdW5pcXVlIHBlciBHcmlkTW9kZWwgaW5zdGFuY2UuICBVc2VkIHRvIGluZGljYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGVcclxuICAgICAqIHJvdyB3aXRoaW4gdGhlIGdyaWQgYmFzZWQgb24gYSB6ZXJvLWluZGV4LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVmOm51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIGNvbHVtbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhlaWdodDpudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyBhIG5ldyBpbnN0YW5jZSBvZiBEZWZhdWx0R3JpZFJvdy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVmXHJcbiAgICAgKiBAcGFyYW0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHJlZjpudW1iZXIsIGhlaWdodDpudW1iZXIgPSAyMSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IGV4dGVuZCB9IGZyb20gJy4uLy4uL21pc2MvVXRpbCc7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhc2NhZGUoKTpQcm9wZXJ0eURlY29yYXRvclxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOlByb3BlcnR5RGVzY3JpcHRvclxyXG4gICAge1xyXG4gICAgICAgIGxldCBwayA9IGBfXyR7a2V5fWA7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKTp2b2lkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3BrXSB8fCAoISF0aGlzLnBhcmVudCA/IHRoaXMucGFyZW50W2tleV0gOiBudWxsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbih2YWw6YW55KTp2b2lkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbcGtdID0gdmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDYXNjYWRpbmc8VD5cclxue1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmVudDpUO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudD86VCwgdmFsdWVzPzphbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcclxuICAgICAgICBpZiAodmFsdWVzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXh0ZW5kKHRoaXMsIHZhbHVlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRBbGlnbm1lbnQgPSAnbGVmdCd8J2NlbnRlcid8J3JpZ2h0JztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGb3JtYXR0ZXJcclxue1xyXG4gICAgKHZhbHVlOnN0cmluZywgdmlzdWFsOmFueSk6c3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3R5bGUgZXh0ZW5kcyBDYXNjYWRpbmc8U3R5bGU+XHJcbntcclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBib3JkZXJDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZpbGxDb2xvcjpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIGZvcm1hdHRlcjpWYWx1ZUZvcm1hdHRlcjtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdGV4dDpUZXh0U3R5bGU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUZXh0U3R5bGUgZXh0ZW5kcyBDYXNjYWRpbmc8VGV4dFN0eWxlPlxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIERlZmF1bHQ6VGV4dFN0eWxlID0gbmV3IFRleHRTdHlsZShudWxsLCB7XHJcbiAgICAgICAgYWxpZ25tZW50OiAnbGVmdCcsXHJcbiAgICAgICAgY29sb3I6ICdibGFjaycsXHJcbiAgICAgICAgZm9udDogJ1NlZ29lIFVJJyxcclxuICAgICAgICBzaXplOiAxMyxcclxuICAgICAgICBzdHlsZTogJ25vcm1hbCcsXHJcbiAgICAgICAgdmFyaWFudDogJ25vcm1hbCcsXHJcbiAgICAgICAgd2VpZ2h0OiAnbm9ybWFsJyxcclxuICAgIH0pO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBhbGlnbm1lbnQ6VGV4dEFsaWdubWVudDtcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgY29sb3I6c3RyaW5nO1xyXG5cclxuICAgIEBjYXNjYWRlKClcclxuICAgIHB1YmxpYyBmb250OnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgc2l6ZTpudW1iZXI7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHN0eWxlOnN0cmluZztcclxuXHJcbiAgICBAY2FzY2FkZSgpXHJcbiAgICBwdWJsaWMgdmFyaWFudDpzdHJpbmc7XHJcblxyXG4gICAgQGNhc2NhZGUoKVxyXG4gICAgcHVibGljIHdlaWdodDpzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBCYXNlU3R5bGUgPSBuZXcgU3R5bGUobnVsbCwge1xyXG4gICAgYm9yZGVyQ29sb3I6ICdsaWdodGdyYXknLFxyXG4gICAgZmlsbENvbG9yOiAnd2hpdGUnLFxyXG4gICAgZm9ybWF0dGVyOiB2ID0+IHYsXHJcbiAgICB0ZXh0OiBuZXcgVGV4dFN0eWxlKG51bGwsIHtcclxuICAgICAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgICAgICBjb2xvcjogJ2JsYWNrJyxcclxuICAgICAgICBmb250OiAnU2Vnb2UgVUknLFxyXG4gICAgICAgIHNpemU6IDEzLFxyXG4gICAgICAgIHN0eWxlOiAnbm9ybWFsJyxcclxuICAgICAgICB2YXJpYW50OiAnbm9ybWFsJyxcclxuICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgfSlcclxufSk7IiwiaW1wb3J0IHsgRGVmYXVsdEdyaWRDZWxsLCBEZWZhdWx0R3JpZENlbGxQYXJhbXMgfSBmcm9tICcuLi9kZWZhdWx0L0RlZmF1bHRHcmlkQ2VsbCc7XHJcbmltcG9ydCB7IFN0eWxlLCBCYXNlU3R5bGUgfSBmcm9tICcuL1N0eWxlJztcclxuaW1wb3J0IHsgcmVuZGVyZXIsIHZpc3VhbGl6ZSB9IGZyb20gJy4uLy4uL3VpL0V4dGVuc2liaWxpdHknO1xyXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi4vLi4vZ2VvbS9Qb2ludCc7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4vc2hvdWxkIGJlIHBhc3NlZCB0byBhIG5ldyBTdHlsZWRHcmlkQ2VsbCBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGVkR3JpZENlbGxQYXJhbXMgZXh0ZW5kcyBEZWZhdWx0R3JpZENlbGxQYXJhbXNcclxue1xyXG4gICAgcGxhY2Vob2xkZXI/OnN0cmluZztcclxuICAgIHN0eWxlPzpTdHlsZTtcclxufVxyXG5cclxuQHJlbmRlcmVyKGRyYXcpXHJcbmV4cG9ydCBjbGFzcyBTdHlsZWRHcmlkQ2VsbCBleHRlbmRzIERlZmF1bHRHcmlkQ2VsbFxyXG57XHJcbiAgICBAdmlzdWFsaXplKClcclxuICAgIHB1YmxpYyBzdHlsZTpTdHlsZSA9IEJhc2VTdHlsZTtcclxuXHJcbiAgICBAdmlzdWFsaXplKClcclxuICAgIHB1YmxpYyBwbGFjZWhvbGRlcjpzdHJpbmcgPSAnJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpemVzIGEgbmV3IGluc3RhbmNlIG9mIFN0eWxlZEdyaWRDZWxsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocGFyYW1zOlN0eWxlZEdyaWRDZWxsUGFyYW1zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKHBhcmFtcyk7XHJcblxyXG4gICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBwYXJhbXMucGxhY2Vob2xkZXIgfHwgJyc7XHJcbiAgICAgICAgdGhpcy5zdHlsZSA9IHBhcmFtcy5zdHlsZSB8fCBCYXNlU3R5bGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXcoZ2Z4OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgdmlzdWFsOmFueSk6dm9pZFxyXG57XHJcbiAgICBsZXQgc3R5bGUgPSB2aXN1YWwuc3R5bGUgYXMgU3R5bGU7XHJcblxyXG4gICAgZ2Z4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICBsZXQgYXYgPSBnZngubGluZVdpZHRoICUgMiA9PSAwID8gMCA6IDAuNTtcclxuXHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUuZmlsbENvbG9yO1xyXG4gICAgZ2Z4LmZpbGxSZWN0KC1hdiwgLWF2LCB2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG5cclxuICAgIGdmeC5zdHJva2VTdHlsZSA9IHN0eWxlLmJvcmRlckNvbG9yO1xyXG4gICAgZ2Z4LnN0cm9rZVJlY3QoLWF2LCAtYXYsIHZpc3VhbC53aWR0aCwgdmlzdWFsLmhlaWdodCk7XHJcblxyXG4gICAgbGV0IHRleHRQdCA9IG5ldyBQb2ludCgzLCB2aXN1YWwuaGVpZ2h0IC8gMikgYXMgUG9pbnRMaWtlO1xyXG4gICAgaWYgKHN0eWxlLnRleHQuYWxpZ25tZW50ID09PSAnY2VudGVyJylcclxuICAgIHtcclxuICAgICAgICB0ZXh0UHQueCA9IHZpc3VhbC53aWR0aCAvIDI7XHJcbiAgICB9XHJcbiAgICBpZiAoc3R5bGUudGV4dC5hbGlnbm1lbnQgPT09ICdyaWdodCcpXHJcbiAgICB7XHJcbiAgICAgICAgdGV4dFB0LnggPSB2aXN1YWwud2lkdGggLSAzO1xyXG4gICAgfVxyXG5cclxuICAgIGdmeC5mb250ID0gYCR7c3R5bGUudGV4dH0gJHtzdHlsZS50ZXh0LnZhcmlhbnR9ICR7c3R5bGUudGV4dC53ZWlnaHR9ICR7c3R5bGUudGV4dC5zaXplfXB4ICR7c3R5bGUudGV4dC5mb250fWA7XHJcbiAgICBnZngudGV4dEFsaWduID0gc3R5bGUudGV4dC5hbGlnbm1lbnQ7XHJcbiAgICBnZngudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgICBnZnguZmlsbFN0eWxlID0gc3R5bGUudGV4dC5jb2xvcjtcclxuICAgIGdmeC5maWxsVGV4dChzdHlsZS5mb3JtYXR0ZXIodmlzdWFsLnZhbHVlLCB2aXN1YWwpIHx8IHZpc3VhbC5wbGFjZWhvbGRlciwgdGV4dFB0LngsIHRleHRQdC55KTtcclxufSIsImltcG9ydCB7IEdyaWRLZXJuZWwgfSBmcm9tICcuL0dyaWRLZXJuZWwnO1xyXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0IHsgaXNCb29sZWFuIH0gZnJvbSAndXRpbCc7XHJcblxyXG5kZWNsYXJlIHZhciBSZWZsZWN0O1xyXG5cclxuLyoqXHJcbiAqIERvIG5vdCB1c2UgZGlyZWN0bHkuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzRGVmPFQ+XHJcbntcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIGRlZmluaXRpb24gZm9yIGEgY2VsbCByZW5kZXJlciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJcclxue1xyXG4gICAgKGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIHZpc3VhbDphbnkpOnZvaWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9jb21tYW5kXzsgYW4gZXh0ZXJuYWxseSBjYWxsYWJsZSBsb2dpYyBibG9jayB0aGF0IHBlcmZvcm1zIHNvbWUgdGFzay4gIEEgbmFtZVxyXG4gKiBmb3IgdGhlIGNvbW1hbmQgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZCBhcyB0aGUgY29tbWFuZCB3aWxsIGJlXHJcbiAqIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCBjb21tYW5kIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZChuYW1lPzpzdHJpbmcpOmFueVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcsIGRlc2NyaXB0b3I6VHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8RnVuY3Rpb24+KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgbWRrID0gJ2dyaWQ6Y29tbWFuZHMnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBpbXBsOiBkZXNjcmlwdG9yLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IGRlZmluZXMgdGhlIHJlbmRlciBmdW5jdGlvbiBmb3IgYSBHcmlkQ2VsbCBpbXBsZW1lbnRhdGlvbiwgYWxsb3dpbmcgY3VzdG9tIGNlbGwgdHlwZXNcclxuICogdG8gY29udHJvbCB0aGVpciBkcmF3aW5nIGJlaGF2aW9yLlxyXG4gKlxyXG4gKiBAcGFyYW0gZnVuY1xyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyZXIoZnVuYzpSZW5kZXJlcik6YW55XHJcbntcclxuICAgIHJldHVybiBmdW5jdGlvbihjdG9yOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoJ2N1c3RvbTpyZW5kZXJlcicsIGZ1bmMsIGN0b3IpO1xyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kIGFzIGEgX3JvdXRpbmVfOyBhIGxvZ2ljIGJsb2NrIHRoYXQgY2FuIGJlIGhvb2tlZCBpbnRvIG9yIG92ZXJyaWRkZW4gYnkgb3RoZXJcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHJvdXRpbmUgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgcm91dGluZSB3aWxsIGJlIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCByb3V0aW5lIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcm91dGluZShuYW1lPzpzdHJpbmcpOmFueVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcsIGRlc2NyaXB0b3I6VHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8RnVuY3Rpb24+KTphbnlcclxuICAgIHtcclxuICAgICAgICBsZXQgcm91dGluZSA9IGRlc2NyaXB0b3IudmFsdWU7XHJcbiAgICAgICAgbGV0IHdyYXBwZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGtlcm5lbCA9ICh0aGlzWydfX2tlcm5lbCddIHx8IHRoaXNbJ2tlcm5lbCddKSBhcyBHcmlkS2VybmVsO1xyXG4gICAgICAgICAgICByZXR1cm4ga2VybmVsLnJvdXRpbmVzLnNpZ25hbChrZXksIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksIHJvdXRpbmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHdyYXBwZXIgfTtcclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgZmllbGQgYXMgYSBfdmFyaWFibGVfOyBhIHJlYWRhYmxlIGFuZCBvcHRpb25hbGx5IHdyaXRhYmxlIHZhbHVlIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5XHJcbiAqIG1vZHVsZXMuICBBIG5hbWUgZm9yIHRoZSB2YXJpYWJsZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgZmllbGQgYmVpbmcgZXhwb3J0ZWRcclxuICogYXMgdGhlIHZhcmlhYmxlIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHZhcmlhYmxlIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUobXV0YWJsZTpib29sZWFuKTphbnk7XHJcbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShuYW1lPzpzdHJpbmcsIG11dGFibGU/OmJvb2xlYW4pOmFueTtcclxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKG5hbWU6c3RyaW5nfGJvb2xlYW4sIG11dGFibGU/OmJvb2xlYW4pOmFueVxyXG57XHJcbiAgICBpZiAodHlwZW9mKG5hbWUpID09PSAnYm9vbGVhbicpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHZhcmlhYmxlKHVuZGVmaW5lZCwgbmFtZSBhcyBib29sZWFuKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBjb25zdCBtZGsgPSAnZ3JpZDp2YXJpYWJsZXMnO1xyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBtdXRhYmxlOiBtdXRhYmxlLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2xldCB2YWxTdG9yZUtleSA9ICEhbmFtZSA/IGtleSA6IGBfXyR7a2V5fWA7XHJcbiAgICAgICAgLy9sZXQgdXNlQWx0VmFsdWVTdG9yZSA9ICFuYW1lO1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy9PYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgbmFtZSB8fCBrZXksIHtcclxuICAgICAgICAvLyAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgIC8vICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgLy8gICAgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXNbdmFsU3RvcmVLZXldOyB9LFxyXG4gICAgICAgIC8vICAgIHNldDogZnVuY3Rpb24obmV3VmFsKSB7IHRoaXNbdmFsU3RvcmVLZXldID0gbmV3VmFsOyB9XHJcbiAgICAgICAgLy99KTtcclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciBmb3IgdXNlIHdpdGhpbiBpbXBsZW1lbnRhdGlvbnMgb2YgR3JpZENlbGwgdGhhdCBtYXJrcyBhIGZpZWxkIGFzIG9uZSB0aGF0IGFmZmVjdHMgdGhlIHZpc3VhbFxyXG4gKiBhcHBlYXJhbmNlIG9mIHRoZSBjZWxsLiAgVGhpcyB3aWxsIGNhdXNlIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgdG8gYmUgbWFwcGVkIHRvIHRoZSBfVmlzdWFsXyBvYmplY3RcclxuICogY3JlYXRlZCBiZWZvcmUgdGhlIGNlbGwgaXMgZHJhd24uXHJcbiAqXHJcbiAqIEByZXR1cm5zIGRlY29yYXRvclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHZpc3VhbGl6ZSgpOmFueVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY3RvcjpPYmplY3QsIGtleTpzdHJpbmcpOmFueVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IG1kayA9ICdncmlkOnZpc3VhbGl6ZSc7XHJcblxyXG4gICAgICAgIGxldCBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEobWRrLCAobGlzdCA9IFtdKSwgY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnB1c2goa2V5KTtcclxuXHJcbiAgICAgICAgbGV0IHBrID0gYF9fJHtrZXl9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpOmFueVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1twa107XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsOmFueSk6dm9pZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3BrXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fZGlydHknXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgUGFkZGluZyB9IGZyb20gJy4uL2dlb20vUGFkZGluZyc7XHJcbmltcG9ydCB7IFBvaW50LCBQb2ludExpa2UgfSBmcm9tICcuLi9nZW9tL1BvaW50JztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBNb3VzZURyYWdFdmVudCB9IGZyb20gJy4uL2lucHV0L01vdXNlRHJhZ0V2ZW50JztcclxuaW1wb3J0IHsgT2JqZWN0TWFwIH0gZnJvbSAnLi4vbWlzYy9JbnRlcmZhY2VzJztcclxuaW1wb3J0IHsgaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQgfSBmcm9tICcuLi9taXNjL1BvbHlmaWxsJztcclxuaW1wb3J0IHsgcHJvcGVydHkgfSBmcm9tICcuLi9taXNjL1Byb3BlcnR5JztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZE1vZGVsJztcclxuaW1wb3J0IHsgR3JpZENlbGwgfSBmcm9tICcuLi9tb2RlbC9HcmlkQ2VsbCc7XHJcbmltcG9ydCB7IEdyaWRNb2RlbCB9IGZyb20gJy4uL21vZGVsL0dyaWRNb2RlbCc7XHJcbmltcG9ydCB7IEdyaWRSYW5nZSB9IGZyb20gJy4uL21vZGVsL0dyaWRSYW5nZSc7XHJcbmltcG9ydCB7IHZhcmlhYmxlIH0gZnJvbSAnLi9FeHRlbnNpYmlsaXR5JztcclxuaW1wb3J0IHsgR3JpZEtlcm5lbCB9IGZyb20gJy4vR3JpZEtlcm5lbCc7XHJcbmltcG9ydCB7IEV2ZW50RW1pdHRlckJhc2UgfSBmcm9tICcuL2ludGVybmFsL0V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7IEdyaWRMYXlvdXQgfSBmcm9tICcuL2ludGVybmFsL0dyaWRMYXlvdXQnO1xyXG5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDtcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRFeHRlbnNpb25cclxue1xyXG4gICAgaW5pdD8oZ3JpZDpHcmlkRWxlbWVudCwga2VybmVsOkdyaWRLZXJuZWwpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZEV4dGVuZGVyXHJcbntcclxuICAgIChncmlkOkdyaWRFbGVtZW50LCBrZXJuZWw6R3JpZEtlcm5lbCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VFdmVudCBleHRlbmRzIE1vdXNlRXZlbnRcclxue1xyXG4gICAgcmVhZG9ubHkgY2VsbDpHcmlkQ2VsbDtcclxuICAgIHJlYWRvbmx5IGdyaWRYOm51bWJlcjtcclxuICAgIHJlYWRvbmx5IGdyaWRZOm51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkTW91c2VEcmFnRXZlbnQgZXh0ZW5kcyBNb3VzZURyYWdFdmVudFxyXG57XHJcbiAgICByZWFkb25seSBjZWxsOkdyaWRDZWxsO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFg6bnVtYmVyO1xyXG4gICAgcmVhZG9ubHkgZ3JpZFk6bnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRLZXlib2FyZEV2ZW50IGV4dGVuZHMgS2V5Ym9hcmRFdmVudFxyXG57XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRFbGVtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyQmFzZVxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZSh0YXJnZXQ6SFRNTEVsZW1lbnQsIGluaXRpYWxNb2RlbD86R3JpZE1vZGVsKTpHcmlkRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIGxldCBwYXJlbnQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGNhbnZhcyA9IHRhcmdldC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGNhbnZhcy5pZCA9IHRhcmdldC5pZDtcclxuICAgICAgICBjYW52YXMuY2xhc3NOYW1lID0gdGFyZ2V0LmNsYXNzTmFtZTtcclxuICAgICAgICBjYW52YXMudGFiSW5kZXggPSB0YXJnZXQudGFiSW5kZXggfHwgMDtcclxuXHJcbiAgICAgICAgdGFyZ2V0LmlkID0gbnVsbDtcclxuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNhbnZhcywgdGFyZ2V0KTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGFyZ2V0KTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgcGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJlbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGdyaWQgPSBuZXcgR3JpZEVsZW1lbnQoY2FudmFzKTtcclxuICAgICAgICBncmlkLm1vZGVsID0gaW5pdGlhbE1vZGVsIHx8IERlZmF1bHRHcmlkTW9kZWwuZGltKDI2LCAxMDApO1xyXG4gICAgICAgIGdyaWQuYmFzaCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JpZDtcclxuICAgIH1cclxuXHJcbiAgICBAcHJvcGVydHkoRGVmYXVsdEdyaWRNb2RlbC5lbXB0eSgpLCB0ID0+IHsgdC5lbWl0KCdsb2FkJywgdC5tb2RlbCk7IHQuaW52YWxpZGF0ZSgpOyB9KVxyXG4gICAgcHVibGljIG1vZGVsOkdyaWRNb2RlbDtcclxuXHJcbiAgICBAcHJvcGVydHkobmV3IFBvaW50KDAsIDApLCB0ID0+IHQuaW52YWxpZGF0ZSgpKVxyXG4gICAgcHVibGljIGZyZWV6ZU1hcmdpbjpQb2ludDtcclxuXHJcbiAgICBAcHJvcGVydHkoUGFkZGluZy5lbXB0eSwgdCA9PiB0LmludmFsaWRhdGUoKSlcclxuICAgIHB1YmxpYyBwYWRkaW5nOlBhZGRpbmc7XHJcblxyXG4gICAgQHByb3BlcnR5KFBvaW50LmVtcHR5LCB0ID0+IHsgdC5yZWRyYXcoKTsgdC5lbWl0KCdzY3JvbGwnKTsgfSlcclxuICAgIHB1YmxpYyBzY3JvbGw6UG9pbnQ7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvb3Q6SFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGFpbmVyOkhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGtlcm5lbDpHcmlkS2VybmVsO1xyXG5cclxuICAgIHByaXZhdGUgaG90Q2VsbDpHcmlkQ2VsbDtcclxuICAgIHByaXZhdGUgZGlydHk6Ym9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBsYXlvdXQ6R3JpZExheW91dDsgICAgXHJcbiAgICBwcml2YXRlIGJ1ZmZlcnM6T2JqZWN0TWFwPEJ1ZmZlcj4gPSB7fTtcclxuICAgIHByaXZhdGUgdmlzdWFsczpPYmplY3RNYXA8VmlzdWFsPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBmcmFtZTpWaWV3QXNwZWN0W107XHJcblxyXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbnZhczpIVE1MQ2FudmFzRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjYW52YXMucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGtlcm5lbCA9IHRoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWwodGhpcy5lbWl0LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICBbJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnLCAnbW91c2V3aGVlbCcsICdjbGljaycsICdkYmxjbGljaycsICdkcmFnYmVnaW4nLCAnZHJhZycsICdkcmFnZW5kJ11cclxuICAgICAgICAgICAgLmZvckVhY2goeCA9PiB0aGlzLmZvcndhcmRNb3VzZUV2ZW50KHgpKTtcclxuICAgICAgICBbJ2tleWRvd24nLCAna2V5cHJlc3MnLCAna2V5dXAnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaCh4ID0+IHRoaXMuZm9yd2FyZEtleUV2ZW50KHgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmFibGVFbnRlckV4aXRFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jbGllbnRXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbW9kZWxXaWR0aCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsSGVpZ2h0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LnJvd3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbFdpZHRoKCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5b3V0LndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlydHVhbEhlaWdodCgpOm51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheW91dC5oZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxMZWZ0KCk6bnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsLng7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzY3JvbGxUb3AoKTpudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGwueTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXh0ZW5kKGV4dDpHcmlkRXh0ZW5zaW9ufEdyaWRFeHRlbmRlcik6R3JpZEVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICBpZiAodHlwZW9mKGV4dCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmtlcm5lbC5pbnN0YWxsKGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LmluaXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGV4dC5pbml0KHRoaXMsIHRoaXMua2VybmVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWMoY29tbWFuZDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC5jb21tYW5kcy5leGVjKGNvbW1hbmQsIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQodmFyaWFibGU6c3RyaW5nKTphbnlcclxuICAgIHtcclxuICAgICAgICB0aGlzLmtlcm5lbC52YXJpYWJsZXMuZ2V0KHZhcmlhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KHZhcmlhYmxlOnN0cmluZywgdmFsdWU6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwudmFyaWFibGVzLnNldCh2YXJpYWJsZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUludGVyZmFjZSgpOkdyaWRFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5rZXJuZWwuZXhwb3J0SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb2N1cygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3QuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0R3JpZFBvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdChwdC54LCBwdC55LCAxLCAxKSk7XHJcbiAgICAgICAgaWYgKHJlZnMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwuZmluZENlbGwocmVmc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEF0Vmlld1BvaW50KHB0OlBvaW50TGlrZSk6R3JpZENlbGxcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncHQgPSBQb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsQXRHcmlkUG9pbnQoZ3B0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhyZWN0KTtcclxuICAgICAgICByZXR1cm4gcmVmcy5tYXAoeCA9PiB0aGlzLm1vZGVsLmZpbmRDZWxsKHgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbHNJblZpZXdSZWN0KHJlY3Q6UmVjdExpa2UpOkdyaWRDZWxsW11cclxuICAgIHtcclxuICAgICAgICBsZXQgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIGxldCBncnQgPSBSZWN0LmZyb21MaWtlKHJlY3QpLm9mZnNldCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbEdyaWRSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHJlZik7XHJcbiAgICAgICAgcmV0dXJuICEhcmVnaW9uID8gUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2VsbFZpZXdSZWN0KHJlZjpzdHJpbmcpOlJlY3RcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuZ2V0Q2VsbEdyaWRSZWN0KHJlZik7XHJcblxyXG4gICAgICAgIGlmIChyZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVjdCA9IHJlY3Qub2Zmc2V0KHRoaXMuc2Nyb2xsLmludmVyc2UoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2Nyb2xsVG8ocHRPclJlY3Q6UG9pbnRMaWtlfFJlY3RMaWtlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGRlc3Q6UmVjdDtcclxuXHJcbiAgICAgICAgaWYgKHB0T3JSZWN0Wyd3aWR0aCddID09PSB1bmRlZmluZWQgJiYgcHRPclJlY3RbJ2hlaWdodCddID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZXN0ID0gbmV3IFJlY3QocHRPclJlY3RbJ3gnXSwgcHRPclJlY3RbJ3knXSwgMSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlc3QgPSBSZWN0LmZyb21MaWtlKHB0T3JSZWN0IGFzIFJlY3RMaWtlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdTY3JvbGwgPSB7XHJcbiAgICAgICAgICAgIHg6IHRoaXMuc2Nyb2xsLngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMuc2Nyb2xsLnksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGRlc3QubGVmdCA8IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuZXdTY3JvbGwueCArPSBkZXN0LmxlZnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnJpZ2h0ID4gdGhpcy53aWR0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5ld1Njcm9sbC54ICs9IGRlc3QucmlnaHQgLSB0aGlzLndpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVzdC50b3AgPCAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC50b3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmJvdHRvbSA+IHRoaXMuaGVpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3U2Nyb2xsLnkgKz0gZGVzdC5ib3R0b20gLSB0aGlzLmhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5zY3JvbGwuZXF1YWxzKG5ld1Njcm9sbCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbCA9IFBvaW50LmNyZWF0ZShuZXdTY3JvbGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmFzaCgpOnZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvb3Qud2lkdGggPSB0aGlzLnJvb3QucGFyZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICB0aGlzLnJvb3QuaGVpZ2h0ID0gdGhpcy5yb290LnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuZW1pdCgnYmFzaCcpO1xyXG5cclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZShxdWVyeTpzdHJpbmcgPSBudWxsKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC5pbnZhbGlkYXRlJyk7XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0LmNvbXB1dGUodGhpcy5tb2RlbCwgdGhpcy5wYWRkaW5nKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoISFxdWVyeSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByYW5nZSA9IEdyaWRSYW5nZS5zZWxlY3QodGhpcy5tb2RlbCwgcXVlcnkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjZWxsIG9mIHJhbmdlLmx0cikge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGxbJ19fZGlydHknXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVycyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmNlbGxzLmZvckVhY2goeCA9PiBkZWxldGUgeFsnX19kaXJ0eSddKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuaW52YWxpZGF0ZScpO1xyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdpbnZhbGlkYXRlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZHJhdyhmb3JjZUltbWVkaWF0ZTpib29sZWFuID0gZmFsc2UpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS50aW1lKGBHcmlkRWxlbWVudC5yZWRyYXcoZm9yY2U9JHtmb3JjZUltbWVkaWF0ZX0pYCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZm9yY2VJbW1lZGlhdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyhmb3JjZUltbWVkaWF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcywgZm9yY2VJbW1lZGlhdGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXcoZm9yY2VkOmJvb2xlYW4pOnZvaWRcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdGhpcy51cGRhdGVWaXN1YWxzKCk7XHJcbiAgICAgICAgdGhpcy5kcmF3VmlzdWFscygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKGBHcmlkRWxlbWVudC5yZWRyYXcoZm9yY2U9JHtmb3JjZWR9KWApO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZHJhdycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdGcmFnbWVudHMoKTpWaWV3RnJhZ21lbnRbXVxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGZyZWV6ZU1hcmdpbiwgbGF5b3V0IH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbWFrZSA9IChsOm51bWJlciwgdDpudW1iZXIsIHc6bnVtYmVyLCBoOm51bWJlciwgb2w6bnVtYmVyLCBvdDpudW1iZXIpID0+ICh7XHJcbiAgICAgICAgICAgIGxlZnQ6IGwsXHJcbiAgICAgICAgICAgIHRvcDogdCxcclxuICAgICAgICAgICAgd2lkdGg6IHcsXHJcbiAgICAgICAgICAgIGhlaWdodDogaCxcclxuICAgICAgICAgICAgb2Zmc2V0TGVmdDogb2wsXHJcbiAgICAgICAgICAgIG9mZnNldFRvcDogb3QsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcblxyXG4gICAgICAgIGlmIChmcmVlemVNYXJnaW4uZXF1YWxzKFBvaW50LmVtcHR5KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBbIG1ha2Uodmlld3BvcnQubGVmdCwgdmlld3BvcnQudG9wLCB2aWV3cG9ydC53aWR0aCwgdmlld3BvcnQuaGVpZ2h0LCAwLCAwKSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgbWFyZ2luTGVmdCA9IGxheW91dC5xdWVyeUNvbHVtblJhbmdlKDAsIGZyZWV6ZU1hcmdpbi54KS53aWR0aDtcclxuICAgICAgICAgICAgbGV0IG1hcmdpblRvcCA9IGxheW91dC5xdWVyeVJvd1JhbmdlKDAsIGZyZWV6ZU1hcmdpbi55KS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBtYXJnaW4gPSBuZXcgUG9pbnQobWFyZ2luTGVmdCwgbWFyZ2luVG9wKTtcclxuXHJcbiAgICAgICAgICAgIC8vQWxpYXNlcyB0byBwcmV2ZW50IG1hc3NpdmUgbGluZXM7XHJcbiAgICAgICAgICAgIGxldCB2cCA9IHZpZXdwb3J0O1xyXG4gICAgICAgICAgICBsZXQgbWcgPSBtYXJnaW47XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gWyBcclxuICAgICAgICAgICAgICAgIG1ha2UodnAubGVmdCArIG1nLngsIHZwLnRvcCArIG1nLnksIHZwLndpZHRoIC0gbWcueCwgdnAuaGVpZ2h0IC0gbWcueSwgbWcueCwgbWcueSksIC8vTWFpblxyXG4gICAgICAgICAgICAgICAgbWFrZSgwLCB2cC50b3AgKyBtZy55LCBtZy54LCB2cC5oZWlnaHQgLSBtZy55LCAwLCBtZy55KSwgLy9MZWZ0XHJcbiAgICAgICAgICAgICAgICBtYWtlKHZwLmxlZnQgKyBtZy54LCAwLCB2cC53aWR0aCAtIG1nLngsIG1nLnksIG1nLngsIDApLCAvL1RvcFxyXG4gICAgICAgICAgICAgICAgbWFrZSgwLCAwLCBtZy54LCBtZy55LCAwLCAwKSwgLy9MZWZ0VG9wXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29tcHV0ZVZpZXdwb3J0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdChNYXRoLmZsb29yKHRoaXMuc2Nyb2xsTGVmdCksIE1hdGguZmxvb3IodGhpcy5zY3JvbGxUb3ApLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVZpc3VhbHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS50aW1lKCdHcmlkRWxlbWVudC51cGRhdGVWaXN1YWxzJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHsgbW9kZWwsIGxheW91dCB9ID0gdGhpcztcclxuICAgICAgICBsZXQgZnJhZ21lbnRzID0gdGhpcy5jb21wdXRlVmlld0ZyYWdtZW50cygpO1xyXG5cclxuICAgICAgICBsZXQgcHJldkZyYW1lID0gdGhpcy5mcmFtZTtcclxuICAgICAgICBsZXQgbmV4dEZyYW1lID0gW10gYXMgVmlld0FzcGVjdFtdO1xyXG5cclxuICAgICAgICAvL0lmIHRoZSBmcmFnbWVudHMgaGF2ZSBjaGFuZ2VkLCBuZXJmIHRoZSBwcmV2RnJhbWUgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byByZWN5Y2xlIGFueXRoaW5nLlxyXG4gICAgICAgIGlmICghcHJldkZyYW1lIHx8IHByZXZGcmFtZS5sZW5ndGggIT0gZnJhZ21lbnRzLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZXZGcmFtZSA9IFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFnbWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcHJldkFzcGVjdCA9IHByZXZGcmFtZVtpXTtcclxuICAgICAgICAgICAgbGV0IGFzcGVjdCA9IDxWaWV3QXNwZWN0PntcclxuICAgICAgICAgICAgICAgIHZpZXc6IGZyYWdtZW50c1tpXSxcclxuICAgICAgICAgICAgICAgIHZpc3VhbHM6IHt9LFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgbGV0IHZpZXdDZWxscyA9IGxheW91dC5jYXB0dXJlQ2VsbHMoYXNwZWN0LnZpZXcpXHJcbiAgICAgICAgICAgICAgICAubWFwKHJlZiA9PiBtb2RlbC5maW5kQ2VsbChyZWYpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGNlbGwgb2Ygdmlld0NlbGxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVnaW9uID0gbGF5b3V0LnF1ZXJ5Q2VsbChjZWxsLnJlZik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmlzdWFsID0gISFwcmV2QXNwZWN0ID8gcHJldkFzcGVjdC52aXN1YWxzW2NlbGwucmVmXSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgZGlkbid0IGhhdmUgYSBwcmV2aW91cyB2aXN1YWwgb3IgaWYgdGhlIGNlbGwgd2FzIGRpcnR5LCBjcmVhdGUgbmV3IHZpc3VhbFxyXG4gICAgICAgICAgICAgICAgaWYgKCF2aXN1YWwgfHwgY2VsbC52YWx1ZSAhPT0gdmlzdWFsLnZhbHVlIHx8IGNlbGxbJ19fZGlydHknXSAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0LnZpc3VhbHNbY2VsbC5yZWZdID0gdGhpcy5jcmVhdGVWaXN1YWwoY2VsbCwgcmVnaW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5idWZmZXJzW2NlbGwucmVmXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbFsnX19kaXJ0eSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UganVzdCB1c2UgdGhlIHByZXZpb3VzXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0LnZpc3VhbHNbY2VsbC5yZWZdID0gdmlzdWFsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBuZXh0RnJhbWUucHVzaChhc3BlY3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mcmFtZSA9IG5leHRGcmFtZTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXdWaXN1YWxzKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCB7IGNhbnZhcywgbW9kZWwsIGZyYW1lIH0gPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuXHJcbiAgICAgICAgbGV0IGdmeCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IHRydWUgfSkgYXMgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG4gICAgICAgIGdmeC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXNwZWN0IG9mIGZyYW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZpZXcgPSBSZWN0LmZyb21MaWtlKGFzcGVjdC52aWV3KTtcclxuXHJcbiAgICAgICAgICAgIGdmeC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGdmeC50cmFuc2xhdGUoYXNwZWN0LnZpZXcub2Zmc2V0TGVmdCwgYXNwZWN0LnZpZXcub2Zmc2V0VG9wKTtcclxuICAgICAgICAgICAgZ2Z4LnRyYW5zbGF0ZShhc3BlY3Qudmlldy5sZWZ0ICogLTEsIGFzcGVjdC52aWV3LnRvcCAqIC0xKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGNyIGluIGFzcGVjdC52aXN1YWxzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VsbCA9IG1vZGVsLmZpbmRDZWxsKGNyKTtcclxuICAgICAgICAgICAgICAgIGxldCB2aXN1YWwgPSBhc3BlY3QudmlzdWFsc1tjcl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZpc3VhbC53aWR0aCA9PSAwIHx8IHZpc3VhbC5oZWlnaHQgPT0gMClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcuaW50ZXJzZWN0cyh2aXN1YWwpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl0gPSB0aGlzLmNyZWF0ZUJ1ZmZlcih2aXN1YWwud2lkdGgsIHZpc3VhbC5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBjZWxsLmNvbnN0cnVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZngucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdHcmlkRWxlbWVudC5kcmF3VmlzdWFscycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlQnVmZmVyKHdpZHRoOm51bWJlciwgaGVpZ2h0Om51bWJlcik6QnVmZmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIod2lkdGgsIGhlaWdodCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVWaXN1YWwoY2VsbDphbnksIHJlZ2lvbjpSZWN0TGlrZSk6VmlzdWFsXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc3VhbCA9IG5ldyBWaXN1YWwoY2VsbC5yZWYsIGNlbGwudmFsdWUsIHJlZ2lvbi5sZWZ0LCByZWdpb24udG9wLCByZWdpb24ud2lkdGgsIHJlZ2lvbi5oZWlnaHQpO1xyXG5cclxuICAgICAgICBsZXQgcHJvcHMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2aXN1YWxpemUnLCBjZWxsLmNvbnN0cnVjdG9yLnByb3RvdHlwZSkgfHwgW10pIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcHJvcHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsW3BdID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc3VhbFtwXSA9IGNsb25lKGNlbGxbcF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSWxsZWdhbCB2aXN1YWxpemVkIHByb3BlcnR5IG5hbWUgJHtwfSBvbiB0eXBlICR7Y2VsbC5jb25zdHJ1Y3Rvci5uYW1lfS5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHZpc3VhbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcndhcmRNb3VzZUV2ZW50KGV2ZW50OnN0cmluZyk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIChuZTpNb3VzZUV2ZW50KSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHB0ID0gbmV3IFBvaW50KG5lLm9mZnNldFgsIG5lLm9mZnNldFkpO1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbEF0Vmlld1BvaW50KHB0KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCBnZSA9IDxhbnk+bmU7XHJcbiAgICAgICAgICAgIGdlLmNlbGwgPSBjZWxsIHx8IG51bGw7XHJcbiAgICAgICAgICAgIGdlLmdyaWRYID0gcHQueDtcclxuICAgICAgICAgICAgZ2UuZ3JpZFkgPSBwdC55OyAgICAgIFxyXG5cclxuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCBnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3J3YXJkS2V5RXZlbnQoZXZlbnQ6c3RyaW5nKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKG5lOktleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIDxHcmlkS2V5Ym9hcmRFdmVudD5uZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbmFibGVFbnRlckV4aXRFdmVudHMoKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vbignbW91c2Vtb3ZlJywgKGU6R3JpZE1vdXNlRXZlbnQpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoZS5jZWxsICE9IHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaG90Q2VsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3RXZ0ID0gdGhpcy5jcmVhdGVHcmlkTW91c2VFdmVudCgnY2VsbGV4aXQnLCBlKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RXZ0LmNlbGwgPSB0aGlzLmhvdENlbGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjZWxsZXhpdCcsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5ob3RDZWxsID0gZS5jZWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvdENlbGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0V2dCA9IHRoaXMuY3JlYXRlR3JpZE1vdXNlRXZlbnQoJ2NlbGxlbnRlcicsIGUpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdFdnQuY2VsbCA9IHRoaXMuaG90Q2VsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2NlbGxlbnRlcicsIG5ld0V2dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUdyaWRNb3VzZUV2ZW50KHR5cGU6c3RyaW5nLCBzb3VyY2U6R3JpZE1vdXNlRXZlbnQpOkdyaWRNb3VzZUV2ZW50XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0gPGFueT4oaWVfc2FmZV9jcmVhdGVfbW91c2VfZXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuY2VsbCA9IHNvdXJjZS5jZWxsO1xyXG4gICAgICAgIGV2ZW50LmdyaWRYID0gc291cmNlLmdyaWRYO1xyXG4gICAgICAgIGV2ZW50LmdyaWRZID0gc291cmNlLmdyaWRZO1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdGcmFnbWVudCBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIG9mZnNldExlZnQ6bnVtYmVyO1xyXG4gICAgb2Zmc2V0VG9wOm51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZpZXdBc3BlY3Rcclxue1xyXG4gICAgdmlldzpWaWV3RnJhZ21lbnQ7XHJcbiAgICB2aXN1YWxzOk9iamVjdE1hcDxWaXN1YWw+O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZSh4OmFueSk6YW55XHJcbntcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB4Lm1hcChjbG9uZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIF8uc2hhZG93Q2xvbmUoeCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJ1ZmZlclxyXG57XHJcbiAgICBwdWJsaWMgY2FudmFzOkhUTUxDYW52YXNFbGVtZW50O1xyXG4gICAgcHVibGljIGdmeDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHdpZHRoOm51bWJlciwgcHVibGljIGhlaWdodDpudW1iZXIsIHB1YmxpYyBpbmZsYXRpb246bnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgKyAoaW5mbGF0aW9uICogMik7XHJcbiAgICAgICAgdGhpcy5nZnggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcsIHsgYWxwaGE6IGZhbHNlIH0pIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICB0aGlzLmdmeC50cmFuc2xhdGUoaW5mbGF0aW9uLCBpbmZsYXRpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBWaXN1YWxcclxue1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlZjpzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU6c3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGxlZnQ6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIHRvcDpudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwdWJsaWMgd2lkdGg6bnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgcHVibGljIGhlaWdodDpudW1iZXIpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVxdWFscyhhbm90aGVyOmFueSk6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzW3Byb3BdICE9PSBhbm90aGVyW3Byb3BdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgT2JqZWN0TWFwIH0gZnJvbSAnLi4vbWlzYy9JbnRlcmZhY2VzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi9taXNjL1V0aWwnO1xyXG5cclxuLy9UaGlzIGtlZXBzIFdlYlN0b3JtIHF1aWV0LCBmb3Igc29tZSByZWFzb24gaXQgaXMgY29tcGxhaW5pbmcuLi5cclxuZGVjbGFyZSB2YXIgUmVmbGVjdDphbnk7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ29tbWFuZFxyXG57XHJcbiAgICAoLi4uYXJnczphbnlbXSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkQ29tbWFuZEh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIERlZmluZXMgdGhlIHNwZWNpZmllZCBjb21tYW5kIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIGRlZmluZShjb21tYW5kOnN0cmluZywgaW1wbDpHcmlkQ29tbWFuZCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVzIHRoZSBzcGVjaWZpZWQgZ3JpZCBjb21tYW5kLlxyXG4gICAgICovXHJcbiAgICBleGVjKGNvbW1hbmQ6c3RyaW5nLCAuLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRWYXJpYWJsZVxyXG57XHJcbiAgICBnZXQoKTphbnk7XHJcbiAgICBzZXQ/KHZhbHVlOmFueSk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkVmFyaWFibGVIdWJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgdmFyaWFibGUgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgZGVmaW5lKHZhcmlhYmxlOnN0cmluZywgaW1wbDpHcmlkVmFyaWFibGUpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBnZXQodmFyaWFibGU6c3RyaW5nKTphbnk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBzZXQodmFyaWFibGU6c3RyaW5nLCB2YWx1ZTphbnkpOnZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZFJvdXRpbmVIb29rXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdyaWRSb3V0aW5lT3ZlcnJpZGVcclxue1xyXG4gICAgKC4uLmFyZ3M6YW55W10pOmFueTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHcmlkUm91dGluZUh1YlxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBob29rIHRvIHRoZSBzcGVjaWZpZWQgc2lnbmFsIHRoYXQgZW5hYmxlcyBleHRlbnNpb25zIHRvIG92ZXJyaWRlIGdyaWQgYmVoYXZpb3JcclxuICAgICAqIGRlZmluZWQgaW4gdGhlIGNvcmUgb3Igb3RoZXIgZXh0ZW5zaW9ucy5cclxuICAgICAqL1xyXG4gICAgaG9vayhyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6YW55KTp2b2lkO1xyXG5cclxuICAgIG92ZXJyaWRlKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazphbnkpOmFueTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpZ25hbHMgdGhhdCBhIHJvdXRpbmUgaXMgYWJvdXQgdG8gcnVuIHRoYXQgY2FuIGJlIGhvb2tlZCBvciBvdmVycmlkZGVuIGJ5IGV4dGVuc2lvbnMuICBBcmd1bWVudHNcclxuICAgICAqIHNob3VsZCBiZSBzdXBwb3J0aW5nIGRhdGEgb3IgcmVsZXZhbnQgb2JqZWN0cyB0byB0aGUgcm91dGluZS4gIFRoZSB2YWx1ZSByZXR1cm5lZCB3aWxsIGJlIGB0cnVlYFxyXG4gICAgICogaWYgdGhlIHJvdXRpbmUgaGFzIGJlZW4gb3ZlcnJpZGRlbiBieSBhbiBleHRlbnNpb24uXHJcbiAgICAgKi9cclxuICAgIHNpZ25hbChyb3V0aW5lOnN0cmluZywgLi4uYXJnczphbnlbXSk6Ym9vbGVhbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEltcGxlbWVudHMgdGhlIGNvcmUgb2YgdGhlIEdyaWQgZXh0ZW5zaWJpbGl0eSBzeXN0ZW0uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZEtlcm5lbFxyXG57XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29tbWFuZHM6R3JpZENvbW1hbmRIdWIgPSBuZXcgR3JpZEtlcm5lbENvbW1hbmRIdWJJbXBsKCk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm91dGluZXM6R3JpZFJvdXRpbmVIdWIgPSBuZXcgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsKCk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgdmFyaWFibGVzOkdyaWRWYXJpYWJsZUh1YiA9IG5ldyBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsKCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlbWl0dGVyOihldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4cG9ydEludGVyZmFjZSh0YXJnZXQ/OmFueSk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHt9IGFzIGFueTtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmRzID0gdGhpcy5jb21tYW5kc1snc3RvcmUnXSBhcyBPYmplY3RNYXA8R3JpZENvbW1hbmQ+O1xyXG4gICAgICAgIGxldCB2YXJpYWJsZXMgPSB0aGlzLnZhcmlhYmxlc1snc3RvcmUnXSBhcyBPYmplY3RNYXA8R3JpZFZhcmlhYmxlPjtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbiBpbiBjb21tYW5kcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRhcmdldFtuXSA9IGNvbW1hbmRzW25dO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgbiBpbiB2YXJpYWJsZXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBuLCB2YXJpYWJsZXNbbl0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5zdGFsbChleHQ6YW55KTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHsgY29tbWFuZHMsIHZhcmlhYmxlcyB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGV4dFsnX19rZXJuZWwnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdFeHRlbnNpb24gYXBwZWFycyB0byBoYXZlIGFscmVhZHkgYmVlbiBpbnN0YWxsZWQgaW50byB0aGlzIG9yIGFub3RoZXIgZ3JpZC4uLj8nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0WydfX2tlcm5lbCddID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGNtZHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOmNvbW1hbmRzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNtZHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb21tYW5kcy5kZWZpbmUoYy5uYW1lLCBjLmltcGwuYmluZChleHQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2YXJzID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZ3JpZDp2YXJpYWJsZXMnLCBleHQpIHx8IFtdO1xyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdmFycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhcmlhYmxlcy5kZWZpbmUodi5uYW1lLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXNbdi5rZXldOyB9KS5iaW5kKGV4dCksXHJcbiAgICAgICAgICAgICAgICBzZXQ6ICEhdi5tdXRhYmxlID8gKGZ1bmN0aW9uKHZhbCkgeyB0aGlzW3Yua2V5XSA9IHZhbDsgfSkuYmluZChleHQpIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCBpbXBsZW1lbnRzIEdyaWRDb21tYW5kSHViXHJcbntcclxuICAgIHByaXZhdGUgc3RvcmU6T2JqZWN0TWFwPEdyaWRDb21tYW5kPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIGNvbW1hbmQgZm9yIGV4dGVuc2lvbnMgb3IgY29uc3VtZXJzIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGRlZmluZShjb21tYW5kOnN0cmluZywgaW1wbDpHcmlkQ29tbWFuZCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3JlW2NvbW1hbmRdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0NvbW1hbmQgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3JlW2NvbW1hbmRdID0gaW1wbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVzIHRoZSBzcGVjaWZpZWQgZ3JpZCBjb21tYW5kLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXhlYyhjb21tYW5kOnN0cmluZywgLi4uYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVtjb21tYW5kXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgY29tbWFuZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHcmlkS2VybmVsUm91dGluZUh1YkltcGwgaW1wbGVtZW50cyBHcmlkUm91dGluZUh1YlxyXG57XHJcbiAgICBwcml2YXRlIGhvb2tzOk9iamVjdE1hcDxHcmlkUm91dGluZUhvb2tbXT4gPSB7fTtcclxuICAgIHByaXZhdGUgb3ZlcnJpZGVzOk9iamVjdE1hcDxHcmlkUm91dGluZU92ZXJyaWRlPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGhvb2sgdG8gdGhlIHNwZWNpZmllZCBzaWduYWwgdGhhdCBlbmFibGVzIGV4dGVuc2lvbnMgdG8gb3ZlcnJpZGUgZ3JpZCBiZWhhdmlvclxyXG4gICAgICogZGVmaW5lZCBpbiB0aGUgY29yZSBvciBvdGhlciBleHRlbnNpb25zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaG9vayhyb3V0aW5lOnN0cmluZywgY2FsbGJhY2s6R3JpZFJvdXRpbmVIb29rKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSB0aGlzLmhvb2tzW3JvdXRpbmVdIHx8ICh0aGlzLmhvb2tzW3JvdXRpbmVdID0gW10pO1xyXG4gICAgICAgIGxpc3QucHVzaChjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG92ZXJyaWRlKHJvdXRpbmU6c3RyaW5nLCBjYWxsYmFjazpHcmlkUm91dGluZU92ZXJyaWRlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vdmVycmlkZXNbcm91dGluZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpZ25hbHMgdGhhdCBhIHJvdXRpbmUgaXMgYWJvdXQgdG8gcnVuIHRoYXQgY2FuIGJlIGhvb2tlZCBvciBvdmVycmlkZGVuIGJ5IGV4dGVuc2lvbnMuICBBcmd1bWVudHNcclxuICAgICAqIHNob3VsZCBiZSBzdXBwb3J0aW5nIGRhdGEgb3IgcmVsZXZhbnQgb2JqZWN0cyB0byB0aGUgcm91dGluZS4gIFRoZSB2YWx1ZSByZXR1cm5lZCB3aWxsIGJlIGB0cnVlYFxyXG4gICAgICogaWYgdGhlIHJvdXRpbmUgaGFzIGJlZW4gb3ZlcnJpZGRlbiBieSBhbiBleHRlbnNpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzaWduYWwocm91dGluZTpzdHJpbmcsIGFyZ3M6YW55W10sIGltcGw6RnVuY3Rpb24pOmFueVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3MoYGJlZm9yZToke3JvdXRpbmV9YCwgYXJncyk7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMub3ZlcnJpZGVzW3JvdXRpbmVdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXJncy5wdXNoKGltcGwpO1xyXG4gICAgICAgICAgICBpbXBsID0gdGhpcy5vdmVycmlkZXNbcm91dGluZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gaW1wbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhyb3V0aW5lLCBhcmdzKTtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKGBhZnRlcjoke3JvdXRpbmV9YCwgYXJncyk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbnZva2VIb29rcyhyb3V0aW5lOnN0cmluZywgYXJnczphbnlbXSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXTtcclxuXHJcbiAgICAgICAgaWYgKGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBob29rIG9mIGxpc3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGhvb2suYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwgaW1wbGVtZW50cyBHcmlkVmFyaWFibGVIdWJcclxue1xyXG4gICAgcHJpdmF0ZSBzdG9yZTpPYmplY3RNYXA8R3JpZFZhcmlhYmxlPiA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZWZpbmUodmFyaWFibGU6c3RyaW5nLCBpbXBsOkdyaWRWYXJpYWJsZSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3JlW3ZhcmlhYmxlXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93ICdWYXJpYWJsZSB3aXRoIG5hbWUgYWxyZWFkeSByZWdpc3RlcmVkOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3JlW3ZhcmlhYmxlXSA9IGltcGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0KHZhcmlhYmxlOnN0cmluZyk6YW55XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGltcGwgPSB0aGlzLnN0b3JlW3ZhcmlhYmxlXTtcclxuICAgICAgICBpZiAoaW1wbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbXBsLmdldCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCB2YXJpYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldCh2YXJpYWJsZTpzdHJpbmcsIHZhbHVlOmFueSk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIGxldCBpbXBsID0gdGhpcy5zdG9yZVt2YXJpYWJsZV07XHJcbiAgICAgICAgaWYgKGltcGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoaW1wbC5zZXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGltcGwuc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdDYW5ub3Qgc2V0IHJlYWRvbmx5IHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1VucmVjb2duaXplZCB2YXJpYWJsZTogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlY3RMaWtlLCBSZWN0IH0gZnJvbSAnLi4vZ2VvbS9SZWN0JztcclxuaW1wb3J0ICogYXMgRG9tIGZyb20gJy4uL21pc2MvRG9tJztcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lcyB0aGUgYmFzZSBpbnRlcmZhY2Ugb2YgYSB3aWRnZXQuICBBIHdpZGdldCBpcyBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgVUkgZWxlbWVudCB3aXRoaW4gdGhlIGNvbnRleHQgb2ZcclxuICogYSBncmlkLiAgSXQgY2FuIGJlIGNvbXBvc2VkIG9mIG9uZSBvciBtb3JlIERPTSBlbGVtZW50cyBhbmQgYmUgaW50ZXJhY3RhYmxlIG9yIHN0YXRpYy4gIFRoZSBXaWRnZXQgaW50ZXJmYWNlc1xyXG4gKiBwcm92aWRlcyBhIGNvbW1vbiBpbnRlcmZhY2UgdGhyb3VnaCB3aGljaCBtb2R1bGVzIG9yIGNvbnN1bWVycyBjYW4gYWNjZXNzIHRoZSB1bmRlcmx5aW5nIERPTSBlbGVtZW50cyBvZiBhIHdpZGdldFxyXG4gKiBhbmQgYmFzaWMgbWV0aG9kcyB0aGF0IGVhc2UgdGhlIG1hbmlwdWxhdGlvbiBvZiB3aWRnZXRzLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXaWRnZXRcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcm9vdCBIVE1MRWxlbWVudCBvZiB0aGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSByb290OkhUTUxFbGVtZW50O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIFJlY3Qgb2JqZWN0IHRoYXQgZGVzY3JpYmVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBXaWRnZXQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSB2aWV3UmVjdDpSZWN0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZXMgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqL1xyXG4gICAgaGlkZSgpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBzaG93KCk6dm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIHdob2xlIHdpZGdldC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlzaWJsZVxyXG4gICAgICovXHJcbiAgICB0b2dnbGUodmlzaWJsZTpib29sZWFuKTp2b2lkO1xyXG59XHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYW4gYWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgV2lkZ2V0IGltcGxlbWVudGF0aW9ucyB0aGF0IGFyZSBleHBlY3RlZCB0byByZXByZXNlbnQgV2lkZ2V0cyB3aXRoXHJcbiAqIGFic29sdXRlbHkgcG9zaXRpb25lZCByb290IGVsZW1lbnRzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEFic1dpZGdldEJhc2U8VCBleHRlbmRzIEhUTUxFbGVtZW50PiBpbXBsZW1lbnRzIFdpZGdldFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcm9vdDpUKVxyXG4gICAge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIFJlY3Qgb2JqZWN0IHRoYXQgZGVzY3JpYmVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBXaWRnZXQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHZpZXdSZWN0KCk6UmVjdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjdFxyXG4gICAgICAgIChcclxuICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLnJvb3Quc3R5bGUubGVmdCksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5yb290LnN0eWxlLnRvcCksXHJcbiAgICAgICAgICAgIHRoaXMucm9vdC5jbGllbnRXaWR0aCxcclxuICAgICAgICAgICAgdGhpcy5yb290LmNsaWVudEhlaWdodFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlcyB0aGUgV2lkZ2V0IHRvIHRoZSBzcGVjaWZpZWQgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IG9mIHRoZSBncmlkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aWV3UmVjdFxyXG4gICAgICogQHBhcmFtIGFuaW1hdGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdvdG8odmlld1JlY3Q6UmVjdExpa2UsIGF1dG9TaG93OmJvb2xlYW4gPSB0cnVlKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGF1dG9TaG93KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgRG9tLnNob3codGhpcy5yb290KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERvbS5jc3ModGhpcy5yb290LCB7XHJcbiAgICAgICAgICAgIGxlZnQ6IGAke3ZpZXdSZWN0LmxlZnQgLSAxfXB4YCxcclxuICAgICAgICAgICAgdG9wOiBgJHt2aWV3UmVjdC50b3AgLSAxfXB4YCxcclxuICAgICAgICAgICAgd2lkdGg6IGAke3ZpZXdSZWN0LndpZHRoICsgMX1weGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogYCR7dmlld1JlY3QuaGVpZ2h0ICsgMX1weGAsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiBgaGlkZGVuYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZGVzIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBoaWRlKCk6dm9pZFxyXG4gICAge1xyXG4gICAgICAgIERvbS5oaWRlKHRoaXMucm9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2hvdygpOnZvaWRcclxuICAgIHtcclxuICAgICAgICBEb20uc2hvdyh0aGlzLnJvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2aXNpYmxlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0b2dnbGUodmlzaWJsZTpib29sZWFuKTp2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgRG9tLnRvZ2dsZSh0aGlzLnJvb3QsIHZpc2libGUpXHJcbiAgICB9XHJcbn0iLCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRTdWJzY3JpcHRpb25cclxue1xyXG4gICAgY2FuY2VsKCk6dm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFdmVudENhbGxiYWNrXHJcbntcclxuICAgICguLi5hcmdzOmFueVtdKTp2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50RW1pdHRlclxyXG57XHJcbiAgICBvbihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOkV2ZW50U3Vic2NyaXB0aW9uO1xyXG5cclxuICAgIG9mZihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOnZvaWQ7XHJcblxyXG4gICAgZW1pdChldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWQ7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyQmFzZVxyXG57XHJcbiAgICBwcml2YXRlIGJ1Y2tldHM6YW55ID0ge307XHJcblxyXG4gICAgcHVibGljIG9uKGV2ZW50OnN0cmluZywgY2FsbGJhY2s6RXZlbnRDYWxsYmFjayk6RXZlbnRTdWJzY3JpcHRpb25cclxuICAgIHtcclxuICAgICAgICB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCkucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgcmV0dXJuIHsgY2FuY2VsOiAoKSA9PiB0aGlzLm9mZihldmVudCwgY2FsbGJhY2spIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9mZihldmVudDpzdHJpbmcsIGNhbGxiYWNrOkV2ZW50Q2FsbGJhY2spOnZvaWRcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KTtcclxuICAgICAgICBsZXQgaWR4ID0gbGlzdC5pbmRleE9mKGNhbGxiYWNrKTtcclxuICAgICAgICBpZiAoaWR4ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW1pdChldmVudDpzdHJpbmcsIC4uLmFyZ3M6YW55W10pOnZvaWRcclxuICAgIHtcclxuICAgICAgICAvLyBpZiAoIWV2ZW50Lm1hdGNoKCdtb3VzZScpICYmICFldmVudC5tYXRjaCgna2V5JykgJiYgIWV2ZW50Lm1hdGNoKCdkcmFnJykpXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhldmVudCwgLi4uYXJncyk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KTtcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBsaXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50OnN0cmluZyk6RXZlbnRDYWxsYmFja1tdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVja2V0c1tldmVudF0gfHwgKHRoaXMuYnVja2V0c1tldmVudF0gPSBbXSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBQYWRkaW5nIH0gZnJvbSAnLi4vLi4vZ2VvbS9QYWRkaW5nJztcclxuaW1wb3J0IHsgUmVjdCwgUmVjdExpa2UgfSBmcm9tICcuLi8uLi9nZW9tL1JlY3QnO1xyXG5pbXBvcnQgeyBPYmplY3RJbmRleCwgT2JqZWN0TWFwIH0gZnJvbSAnLi4vLi4vbWlzYy9JbnRlcmZhY2VzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICcuLi8uLi9taXNjL1V0aWwnO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBEZWZhdWx0R3JpZFJvdyB9IGZyb20gJy4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdEdyaWRSb3cnO1xyXG5pbXBvcnQgeyBHcmlkQ2VsbCB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDZWxsJztcclxuaW1wb3J0IHsgR3JpZENvbHVtbiB9IGZyb20gJy4uLy4uL21vZGVsL0dyaWRDb2x1bW4nO1xyXG5pbXBvcnQgeyBHcmlkTW9kZWwgfSBmcm9tICcuLi8uLi9tb2RlbC9HcmlkTW9kZWwnO1xyXG5pbXBvcnQgeyBHcmlkUm93IH0gZnJvbSAnLi4vLi4vbW9kZWwvR3JpZFJvdyc7XHJcblxyXG5cclxudHlwZSBDZWxsQ29sUm93TG9va3VwID0gT2JqZWN0SW5kZXg8T2JqZWN0SW5kZXg8R3JpZENlbGw+PjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3JpZExheW91dFJlZ2lvbjxUPiBleHRlbmRzIFJlY3RMaWtlXHJcbntcclxuICAgIHJlYWRvbmx5IHJlZjpUO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZExheW91dFxyXG57XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbXB1dGUobW9kZWw6R3JpZE1vZGVsLCBwYWRkaW5nOlBhZGRpbmcpOkdyaWRMYXlvdXRcclxuICAgIHtcclxuICAgICAgICBsZXQgY29sTG9va3VwID0gPE9iamVjdEluZGV4PEdyaWRDb2x1bW4+Pm1vZGVsLmNvbHVtbnMucmVkdWNlKCh0LCB4KSA9PiB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQgfSwge30pO1xyXG4gICAgICAgIGxldCByb3dMb29rdXAgPSA8T2JqZWN0SW5kZXg8R3JpZFJvdz4+bW9kZWwucm93cy5yZWR1Y2UoKHQsIHgpID0+IHsgdFt4LnJlZl0gPSB4OyByZXR1cm4gdCB9LCB7fSk7XHJcbiAgICAgICAgbGV0IGNlbGxMb29rdXAgPSBidWlsZENlbGxMb29rdXAobW9kZWwuY2VsbHMpOyAvL2J5IGNvbCB0aGVuIHJvd1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIGFsbCBleHBlY3RlZCBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgbGV0IG1heENvbCA9IG1vZGVsLmNlbGxzLm1hcCh4ID0+IHguY29sUmVmICsgKHguY29sU3BhbiAtIDEpKS5yZWR1Y2UoKHQsIHgpID0+IHQgPiB4ID8gdCA6IHgsIDApO1xyXG4gICAgICAgIGxldCBtYXhSb3cgPSBtb2RlbC5jZWxscy5tYXAoeCA9PiB4LnJvd1JlZiArICh4LnJvd1NwYW4gLSAxKSkucmVkdWNlKCh0LCB4KSA9PiB0ID4geCA/IHQgOiB4LCAwKTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbWlzc2luZyBjb2x1bW5zIGFuZCByb3dzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Q29sOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAoY29sTG9va3VwW2ldIHx8IChjb2xMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRDb2x1bW4oaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbWF4Um93OyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAocm93TG9va3VwW2ldIHx8IChyb3dMb29rdXBbaV0gPSBuZXcgRGVmYXVsdEdyaWRSb3coaSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGUgd2lkdGggYW5kIGhlaWdodCBvZiB3aG9sZSBncmlkXHJcbiAgICAgICAgbGV0IHdpZHRoID0gXy52YWx1ZXMoY29sTG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LndpZHRoLCAwKSArIHBhZGRpbmcuaG9yaXpvbnRhbDtcclxuICAgICAgICBsZXQgaGVpZ2h0ID0gXy52YWx1ZXMocm93TG9va3VwKS5yZWR1Y2UoKHQsIHgpID0+IHQgKyB4LmhlaWdodCwgMCkgKyBwYWRkaW5nLnZlcnRpY2FsO1xyXG5cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBsYXlvdXQgcmVnaW9ucyBmb3IgdGhlIHZhcmlvdXMgYml0c1xyXG4gICAgICAgIGxldCBjb2xSZWdzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdID0gW107XHJcbiAgICAgICAgbGV0IHJvd1JlZ3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W10gPSBbXTtcclxuICAgICAgICBsZXQgY2VsbFJlZ3M6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W10gPSBbXTtcclxuICAgICAgICBsZXQgbG9hZFRyYWNrZXIgPSB7fSBhcyB7IFtrZXk6c3RyaW5nXTpib29sZWFuIH07XHJcblxyXG4gICAgICAgIGxldCBhY2NMZWZ0ID0gcGFkZGluZy5sZWZ0O1xyXG4gICAgICAgIGZvciAobGV0IGNpID0gMDsgY2kgPD0gbWF4Q29sOyBjaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNvbCA9IGNvbExvb2t1cFtjaV07XHJcblxyXG4gICAgICAgICAgICBjb2xSZWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcmVmOiBjb2wucmVmLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgIHRvcDogMCxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgYWNjVG9wID0gcGFkZGluZy50b3A7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHJpID0gMDsgcmkgPD0gbWF4Um93OyByaSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcm93ID0gcm93TG9va3VwW3JpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2kgPT09IDApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93UmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiByb3cucmVmLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGFjY1RvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHJvdy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxMb29rdXBbY2ldICE9PSB1bmRlZmluZWQgJiYgY2VsbExvb2t1cFtjaV1bcmldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNlbGwgPSBjZWxsTG9va3VwW2NpXVtyaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNlbGwgJiYgIWxvYWRUcmFja2VyW2NlbGwucmVmXSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB3aWR0aCA9IDAsIGhlaWdodCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1Rha2UgY29sU3BhbiBhbmQgcm93U3BhbiBpbnRvIGFjY291bnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY2l4ID0gY2k7IGNpeCA8PSBtYXhDb2wgJiYgY2l4IDwgKGNpICsgY2VsbC5jb2xTcGFuKTsgY2l4KyspXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICs9IGNvbExvb2t1cFtjaXhdLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHJpeCA9IHJpOyByaXggPD0gbWF4Um93ICYmIHJpeCA8IChyaSArIGNlbGwucm93U3Bhbik7IHJpeCsrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKz0gcm93TG9va3VwW3JpeF0uaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsUmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogY2VsbC5yZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVHJhY2tlcltjZWxsLnJlZl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhY2NUb3AgKz0gcm93LmhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWNjTGVmdCArPSBjb2wud2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRMYXlvdXQod2lkdGgsIGhlaWdodCwgY29sUmVncywgcm93UmVncywgY2VsbFJlZ3MsIGNlbGxMb29rdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSB3aWR0aDpudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVpZ2h0Om51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBjb2x1bW5zOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IHJvd3M6R3JpZExheW91dFJlZ2lvbjxudW1iZXI+W107XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VsbHM6R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+W107XHJcblxyXG4gICAgcHJpdmF0ZSBjZWxsTG9va3VwOkNlbGxDb2xSb3dMb29rdXA7XHJcbiAgICBwcml2YXRlIGNvbHVtbkluZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIHJvd0luZGV4Ok9iamVjdEluZGV4PEdyaWRMYXlvdXRSZWdpb248bnVtYmVyPj47XHJcbiAgICBwcml2YXRlIGNlbGxJbmRleDpPYmplY3RNYXA8R3JpZExheW91dFJlZ2lvbjxzdHJpbmc+PjtcclxuXHJcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHdpZHRoOm51bWJlciwgXHJcbiAgICAgICAgaGVpZ2h0Om51bWJlciwgXHJcbiAgICAgICAgY29sdW1uczpHcmlkTGF5b3V0UmVnaW9uPG51bWJlcj5bXSxcclxuICAgICAgICByb3dzOkdyaWRMYXlvdXRSZWdpb248bnVtYmVyPltdLFxyXG4gICAgICAgIGNlbGxzOkdyaWRMYXlvdXRSZWdpb248c3RyaW5nPltdLFxyXG4gICAgICAgIGNlbGxMb29rdXA6Q2VsbENvbFJvd0xvb2t1cClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBjZWxscztcclxuXHJcbiAgICAgICAgdGhpcy5jZWxsTG9va3VwID0gY2VsbExvb2t1cDtcclxuICAgICAgICB0aGlzLmNvbHVtbkluZGV4ID0gXy5pbmRleChjb2x1bW5zLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLnJvd0luZGV4ID0gXy5pbmRleChyb3dzLCB4ID0+IHgucmVmKTtcclxuICAgICAgICB0aGlzLmNlbGxJbmRleCA9IF8uaW5kZXgoY2VsbHMsIHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeUNvbHVtbihyZWY6bnVtYmVyKTpSZWN0TGlrZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbkluZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlDb2x1bW5SYW5nZShmcm9tUmVmOm51bWJlciwgdG9SZWZFeDpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxpa2VzID0gW10gYXMgUmVjdExpa2VbXTsgICAgICAgIFxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZnJvbVJlZjsgaSA8IHRvUmVmRXg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpa2VzLnB1c2godGhpcy5xdWVyeUNvbHVtbihpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBSZWN0LmZyb21NYW55KGxpa2VzLm1hcChSZWN0LmZyb21MaWtlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHF1ZXJ5Um93KHJlZjpudW1iZXIpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93SW5kZXhbcmVmXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBxdWVyeVJvd1JhbmdlKGZyb21SZWY6bnVtYmVyLCB0b1JlZkV4Om51bWJlcik6UmVjdExpa2VcclxuICAgIHtcclxuICAgICAgICBsZXQgbGlrZXMgPSBbXSBhcyBSZWN0TGlrZVtdOyAgICAgICAgXHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmcm9tUmVmOyBpIDwgdG9SZWZFeDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlrZXMucHVzaCh0aGlzLnF1ZXJ5Um93KGkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbU1hbnkobGlrZXMubWFwKFJlY3QuZnJvbUxpa2UpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlDZWxsKHJlZjpzdHJpbmcpOlJlY3RMaWtlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbEluZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FwdHVyZUNvbHVtbnMocmVnaW9uOlJlY3RMaWtlKTpudW1iZXJbXVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbnNcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IFJlY3QucHJvdG90eXBlLmludGVyc2VjdHMuY2FsbCh4LCByZWdpb24pKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZWYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXB0dXJlUm93cyhyZWdpb246UmVjdExpa2UpOm51bWJlcltdXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93c1xyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gUmVjdC5wcm90b3R5cGUuaW50ZXJzZWN0cy5jYWxsKHgsIHJlZ2lvbikpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhcHR1cmVDZWxscyhyZWdpb246UmVjdExpa2UpOnN0cmluZ1tdXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxvb2t1cCA9IHRoaXMuY2VsbExvb2t1cDtcclxuICAgICAgICBsZXQgY29scyA9IHRoaXMuY2FwdHVyZUNvbHVtbnMocmVnaW9uKTtcclxuICAgICAgICBsZXQgcm93cyA9IHRoaXMuY2FwdHVyZVJvd3MocmVnaW9uKTtcclxuICAgICAgICBsZXQgY2VsbHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjIG9mIGNvbHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWxvb2t1cFtjXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgciBvZiByb3dzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxvb2t1cFtjXVtyXSlcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZWxscy5wdXNoKGxvb2t1cFtjXVtyXS5yZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2VsbHM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQ2VsbExvb2t1cChjZWxsczpHcmlkQ2VsbFtdKTpDZWxsQ29sUm93TG9va3VwXHJcbntcclxuICAgIGxldCBpeCA9IHt9O1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBjZWxsIG9mIGNlbGxzKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGNvID0gMDsgY28gPCBjZWxsLmNvbFNwYW47IGNvKyspIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgcm8gPSAwOyBybyA8IGNlbGwucm93U3Bhbjsgcm8rKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGMgPSBjZWxsLmNvbFJlZiArIGNvO1xyXG4gICAgICAgICAgICAgICAgbGV0IHIgPSBjZWxsLnJvd1JlZiArIHJvO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjaXggPSBpeFtjXSB8fCAoaXhbY10gPSB7fSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2l4W3JdKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVHdvIGNlbGxzIGFwcGVhciB0byBvY2N1cHknLCBjLCAneCcsIHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjaXhbcl0gPSBjZWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBpeDtcclxufSJdfQ==
