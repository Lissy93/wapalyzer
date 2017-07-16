/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/*global window, global*/
var util = __webpack_require__(2)
var assert = __webpack_require__(7)
var now = __webpack_require__(8)

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    var duration = now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process, console) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(5);

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(6);

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0), __webpack_require__(4), __webpack_require__(1)))

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(console) {if (!Range.prototype["intersectsNode"]) {
    Range.prototype["intersectsNode"] = function (node) {
        let range = document.createRange();
        range.selectNode(node);
        return 0 > this.compareBoundaryPoints(Range.END_TO_START, range) && 0 < this.compareBoundaryPoints(Range.START_TO_END, range);
    };
}
var getExtensionProtocol = function () {
    if (typeof browser == "undefined") {
        if (typeof chrome !== "undefined") return "chrome-extension://";
    } else {
        return "ms-browser-extension://";
    }
};
class FakeEvent {
    addListener(callback) {}
    addRules(rules, callback) {}
    getRules(ruleIdentifiers, callback) {}
    hasListener(callback) {
        return false;
    }
    hasListeners() {
        return false;
    }
    removeRules(ruleIdentifiers, callback) {}
    removeListener(callback) {}
}
class EdgeBridgeHelper {
    constructor() {
        this.fakeEvent = new FakeEvent();
    }
    toAbsolutePath(relativePath) {
        if (relativePath.indexOf("ms-browser-extension://") == 0) {
            return relativePath.replace(myBrowser.runtime.getURL(""), "");
        } else if (relativePath.indexOf("/") != 0) {
            var absolutePath = "";
            var documentPath = document.location.pathname;
            absolutePath = documentPath.substring(0, documentPath.lastIndexOf("/") + 1);
            absolutePath += relativePath;
            return absolutePath;
        }
        return relativePath;
    }
}
var bridgeHelper = new EdgeBridgeHelper();
class EdgeBridgeDebugLog {
    constructor() {
        this.CatchOnException = true;
        this.VerboseLogging = true;
        this.FailedCalls = {};
        this.SuccededCalls = {};
        this.DeprecatedCalls = {};
        this.BridgedCalls = {};
        this.UnavailableApis = {};
        this.EdgeIssues = {};
    }
    log(message) {
        try {
            if (this.VerboseLogging) {
                console.log(message);
            }
        } catch (e) {}
    }
    info(message) {
        try {
            if (this.VerboseLogging) {
                console.info(message);
            }
        } catch (e) {}
    }
    warn(message) {
        try {
            if (this.VerboseLogging) {
                console.warn(message);
            }
        } catch (e) {}
    }
    error(message) {
        try {
            if (this.VerboseLogging) {
                console.error(message);
            }
        } catch (e) {}
    }
    DoActionAndLog(action, name, deprecatedTo, bridgedTo) {
        var result;
        try {
            result = action();
            this.AddToCalledDictionary(this.SuccededCalls, name);
            if (typeof deprecatedTo !== "undefined" && typeof deprecatedTo !== "null") {
                this.warn("API Call Deprecated - Name: " + name + ", Please use " + deprecatedTo + " instead!");
                this.AddToCalledDictionary(this.DeprecatedCalls, name);
            }
            if (typeof bridgedTo !== "undefined" && typeof bridgedTo !== "null") {
                this.info("API Call '" + name + "' has been bridged to another Edge API: " + bridgedTo);
                this.AddToCalledDictionary(this.BridgedCalls, name);
            }
            return result;
        } catch (ex) {
            this.AddToCalledDictionary(this.FailedCalls, name);
            if (this.CatchOnException) this.error("API Call Failed: " + name + " - " + ex);else throw ex;
        }
    }
    LogEdgeIssue(name, message) {
        this.warn(message);
        this.AddToCalledDictionary(this.EdgeIssues, name);
    }
    LogUnavailbleApi(name, deprecatedTo) {
        this.warn("API Call '" + name + "' is not supported in Edge");
        this.AddToCalledDictionary(this.UnavailableApis, name);
        if (typeof deprecatedTo !== "undefined" && typeof deprecatedTo !== "null") {
            this.warn("API Call Deprecated - Name: " + name + ", Please use " + deprecatedTo + " instead!");
            this.AddToCalledDictionary(this.DeprecatedCalls, name);
        }
    }
    AddToCalledDictionary(dictionary, name) {
        if (typeof dictionary[name] !== "undefined") {
            dictionary[name]++;
        } else {
            dictionary[name] = 1;
        }
    }
}
var bridgeLog = new EdgeBridgeDebugLog();
class EdgeChromeAppBridge {
    getDetails() {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeChromeRuntimeBridge.prototype.getManifest();
        }, "app.getManifest", undefined, "runtime.getManifest");
    }
    get isInstalled() {
        return bridgeLog.DoActionAndLog(() => {
            throw "app.isInstalled is not available in Edge";
        }, "app.isInstalled");
    }
    getIsInstalled() {
        return bridgeLog.DoActionAndLog(() => {
            throw "app.getIsInstalled is not available in the Edge";
        }, "app.getIsInstalled");
    }
    installState() {
        return bridgeLog.DoActionAndLog(() => {
            throw "app.installState is not available in Edge";
        }, "app.installState");
    }
    runningState() {
        return bridgeLog.DoActionAndLog(() => {
            throw "app.runningState is not available in Edge";
        }, "app.runningState");
    }
}
class EdgeBrowserActionBridge {
    get onClicked() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.browserAction.onClicked;
        }, "browserAction.onClicked");
    }
    disable(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.disable(tabId);
        }, "browserAction.disable");
    }
    enable(tabId) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof tabId !== "undefined" && typeof tabId !== "null") {
                myBrowser.browserAction.enable(tabId);
            } else {
                myBrowser.browserAction.enable();
            }
        }, "browserAction.Enable");
    }
    getBadgeBackgroundColor(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.getBadgeBackgroundColor(details, callback);
        }, "browserAction.getBadgeBackgroundColor");
    }
    getBadgeText(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.getBadgeText(details, callback);
        }, "browserAction.getBadgeText");
    }
    setBadgeBackgroundColor(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setBadgeBackgroundColor(details);
        }, "browserAction.setBadgeBackgroundColor");
    }
    setBadgeText(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setBadgeText(details);
        }, "browserAction.setBadgeText");
    }
    setIcon(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof details.path !== "undefined") {
                if (typeof details.path === "object") {
                    for (var key in details.path) {
                        if (details.path.hasOwnProperty(key)) {
                            details.path[key] = bridgeHelper.toAbsolutePath(details.path[key]);
                        }
                    }
                } else {
                    details.path = bridgeHelper.toAbsolutePath(details.path);
                }
            }
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.browserAction.setIcon(details, callback);
            } else {
                myBrowser.browserAction.setIcon(details);
            }
        }, "browserAction.setIcon", undefined, "browserAction.setIcon with absolute path");
    }
    setPopup(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setPopup(details);
        }, "browserAction.setPopup");
    }
}
class EdgeChromeBrowserActionBridge extends EdgeBrowserActionBridge {
    getPopup(details, callback) {
        bridgeLog.LogUnavailbleApi("browserAction.getPopup");
    }
    getTitle(details, callback) {
        bridgeLog.LogUnavailbleApi("browserAction.getTitle");
    }
    setTitle(details) {
        bridgeLog.LogUnavailbleApi("browserAction.setTitle");
    }
}
class EdgeContextMenusBridge {
    get ACTION_MENU_TOP_LEVEL_LIMIT() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT;
        }, "contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT");
    }
    get onClicked() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.contextMenus.onClicked;
        }, "contextMenus.onClicked");
    }
    create(createProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.create(createProperties, callback);
            } else {
                myBrowser.contextMenus.create(createProperties);
            }
        }, "contextMenus.create");
    }
    remove(menuItemId, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.remove(menuItemId, callback);
            } else {
                myBrowser.contextMenus.remove(menuItemId);
            }
        }, "contextMenus.remove");
    }
    removeAll(callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.removeAll(callback);
            } else {
                myBrowser.contextMenus.removeAll();
            }
        }, "contextMenus.removeAll");
    }
    update(id, updateProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.update(id, updateProperties, callback);
            } else {
                myBrowser.contextMenus.update(id, updateProperties);
            }
        }, "contextMenus.update");
    }
}
class EdgeCookiesBridge {
    get(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.cookies.get(details, callback);
        }, "cookies.get");
    }
    getAll(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.cookies.getAll(details, callback);
        }, "cookies.getAll");
    }
    remove(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.cookies.remove(details, callback);
            } else {
                myBrowser.cookies.remove(details);
            }
        }, "cookies.remove");
    }
    set(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.cookies.set(details, callback);
            } else {
                myBrowser.cookies.set(details);
            }
        }, "cookies.set");
    }
}
class EdgeChromeCookiesBridge extends EdgeCookiesBridge {
    get onChanged() {
        bridgeLog.LogUnavailbleApi("cookies.onChanged");return bridgeHelper.fakeEvent;
    }
}
class EdgeExtensionBridge {
    getBackgroundPage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getBackgroundPage();
        }, "extension.getBackgroundPage");
    }
    getURL(path) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getURL(path);
        }, "extension.getURL");
    }
    getViews(fetchProperties) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getViews(fetchProperties);
        }, "extension.getViews");
    }
}
class EdgeChromeExtensionBridge extends EdgeExtensionBridge {
    get onConnect() {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.onConnect;
        }, "extension.onConnect", "runtime.onConnect", "runtime.onConnect");
    }
    get onMessage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onMessage;
        }, "extension.onMessage", "runtime.onMessage", "runtime.onMessage");
    }
    get onRequest() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onMessage;
        }, "extension.onRequest", "runtime.onMessage", "runtime.onMessage");
    }
    get onRequestExternal() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onMessageExternal;
        }, "extension.onRequestExternal", "runtime.onMessageExternal", "runtime.onMessageExternal");
    }
    get inIncognitoContext() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension["inPrivateContext"];
        }, "extension.inIncognitoContext", undefined, "extension.inPrivateContext");
    }
    get lastError() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.lastError;
        }, "extension.lastError", undefined, "runtime.lastError");
    }
    connect(extensionId, connectInfo) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.connect(extensionId, connectInfo);
        }, "extension.connect", "runtime.connect", "runtime.connect");
    }
    sendMessage(message, responseCallback) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.sendMessage(message, responseCallback, undefined, undefined);
        }, "extension.sendMessage", "runtime.sendMessage", "runtime.sendMessage");
    }
    sendRequest(extensionId, message, options, responseCallback) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.sendMessage(extensionId, message, options, responseCallback);
        }, "extension.sendRequest", "runtime.sendMessage", "runtime.sendMessage");
    }
    isAllowedFileSchemeAccess(callback) {
        bridgeLog.LogUnavailbleApi("extension.isAllowedFileSchemeAccess");
    }
    isAllowedIncognitoAccess(callback) {
        bridgeLog.LogUnavailbleApi("extension.isAllowedIncognitoAccess");
    }
    setUpdateUrlData(data) {
        bridgeLog.LogUnavailbleApi("extension.setUpdateUrlData");
    }
}
class EdgeHistoryBridge {
    get onVisited() {
        bridgeLog.LogUnavailbleApi("history.onVisited");return bridgeHelper.fakeEvent;
    }
    get onVisitRemoved() {
        bridgeLog.LogUnavailbleApi("history.onVisitRemoved");return bridgeHelper.fakeEvent;
    }
    addUrl(details, callback) {
        bridgeLog.LogUnavailbleApi("history.addUrl");
    }
    deleteAll(callback) {
        bridgeLog.LogUnavailbleApi("history.deleteAll");
    }
    deleteRange(range, callback) {
        bridgeLog.LogUnavailbleApi("history.deleteRange");
    }
    deleteUrl(details, callback) {
        bridgeLog.LogUnavailbleApi("history.deleteUrl");
    }
    getVisits(details, callback) {
        bridgeLog.LogUnavailbleApi("history.getVisits");
    }
    search(query, callback) {
        bridgeLog.LogUnavailbleApi("history.search");
    }
}
class EdgeI18nBridge {
    getAcceptLanguages(callback) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.i18n.getAcceptLanguages(callback);
        }, "i18n.getAcceptLanguages");
    }
    getMessage(messageName, substitutions) {
        return bridgeLog.DoActionAndLog(() => {
            if (messageName.indexOf("@@extension_id") > -1) {
                return myBrowser.runtime.id;
            }
            if (typeof substitutions !== "undefined" && typeof substitutions !== "null") {
                return myBrowser.i18n.getMessage(messageName, substitutions);
            } else {
                return myBrowser.i18n.getMessage(messageName);
            }
        }, "i18n.getMessage");
    }
    getUILanguage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.i18n.getUILanguage();
        }, "i18n.getUILanguage");
    }
}
class EdgeNotificationBridge {
    get onButtonClicked() {
        bridgeLog.LogUnavailbleApi("notifications.onButtonClicked");return bridgeHelper.fakeEvent;
    }
    get onClicked() {
        bridgeLog.LogUnavailbleApi("notifications.onClicked");return bridgeHelper.fakeEvent;
    }
    get onClosed() {
        bridgeLog.LogUnavailbleApi("notifications.onClosed");return bridgeHelper.fakeEvent;
    }
    get onPermissionLevelChanged() {
        bridgeLog.LogUnavailbleApi("notifications.onPermissionLevelChanged");return bridgeHelper.fakeEvent;
    }
    get onShowSettings() {
        bridgeLog.LogUnavailbleApi("notifications.onShowSettings");return bridgeHelper.fakeEvent;
    }
    clear(notificationId, callback) {
        bridgeLog.LogUnavailbleApi("notifications.clear");
    }
    create(notificationId, options, callback) {
        bridgeLog.LogUnavailbleApi("notifications.create");
    }
    getAll(callback) {
        bridgeLog.LogUnavailbleApi("notifications.getAll");
    }
    getPermissionLevel(callback) {
        bridgeLog.LogUnavailbleApi("notifications.getPermissionLevel");
    }
    update(notificationId, options, callback) {
        bridgeLog.LogUnavailbleApi("notifications.update");
    }
}
class EdgePageActionBridge {
    get onClicked() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.pageAction.onClicked;
        }, "pageAction.onClicked");
    }
    getPopup(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.getPopup(details, callback);
        }, "pageAction.getPopup");
    }
    getTitle(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.getTitle(details, callback);
        }, "pageAction.getTitle");
    }
    hide(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.hide(tabId);
        }, "pageAction.hide");
    }
    setTitle(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.setTitle(details);
        }, "pageAction.setTitle");
    }
    setIcon(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.pageAction.setIcon(details, callback);
            } else {
                myBrowser.pageAction.setIcon(details, callback);
            }
        }, "pageAction.setIcon");
    }
    setPopup(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.setPopup(details);
        }, "pageAction.setPopup");
    }
    show(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.show(tabId);
        }, "pageAction.show");
    }
}
class EdgePermissionsBridge {
    get onAdded() {
        bridgeLog.LogUnavailbleApi("permissions.onAdded");return bridgeHelper.fakeEvent;
    }
    get onRemoved() {
        bridgeLog.LogUnavailbleApi("permissions.onRemoved");return bridgeHelper.fakeEvent;
    }
    contains(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.contains");
    }
    getAll(callback) {
        bridgeLog.LogUnavailbleApi("permissions.getAll");
    }
    remove(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.remove");
    }
    request(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.request");
    }
}
class EdgeRuntimeBridge {
    get id() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.id;
        }, "runtime.id");
    }
    get lastError() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.lastError;
        }, "runtime.lastError");
    }
    get onConnect() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onConnect;
        }, "runtime.onConnect");
    }
    get onInstalled() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onInstalled;
        }, "runtime.onInstalled");
    }
    get onMessage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onMessage;
        }, "runtime.onMessage");
    }
    get onMessageExternal() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.onMessageExternal;
        }, "runtime.onMessageExternal");
    }
    connect(extensionId, connectInfo) {
        return bridgeLog.DoActionAndLog(() => {
            if (typeof connectInfo !== "undefined" && typeof connectInfo !== "null") {
                return myBrowser.runtime.connect(extensionId, connectInfo);
            } else {
                return myBrowser.runtime.connect(extensionId);
            }
        }, "runtime.connect");
    }
    getBackgroundPage(callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.runtime.getBackgroundPage(callback);
        }, "runtime.getBackgroundPage");
    }
    getManifest() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.getManifest();
        }, "runtime.getManifest");
    }
    getURL(path) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.getURL(path);
        }, "runtime.getURL");
    }
    sendMessage(extensionId, message, options, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof responseCallback !== "undefined" && typeof responseCallback !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message, options, responseCallback);
            } else if (typeof options !== "undefined" && typeof options !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message, options);
            } else if (typeof message !== "undefined" && typeof message !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message);
            } else {
                myBrowser.runtime.sendMessage(undefined, extensionId);
            }
        }, "runtime.sendMessage");
    }
}
class EdgeChromeRuntimeBridge extends EdgeRuntimeBridge {
    get onConnectExternal() {
        bridgeLog.LogUnavailbleApi("runtime.onConnectExternal");return bridgeHelper.fakeEvent;
    }
    get onRestartRequired() {
        bridgeLog.LogUnavailbleApi("runtime.onRestartRequired");return bridgeHelper.fakeEvent;
    }
    get onStartup() {
        bridgeLog.LogUnavailbleApi("runtime.onStartup");return bridgeHelper.fakeEvent;
    }
    get onSuspend() {
        bridgeLog.LogUnavailbleApi("runtime.onSuspend");return bridgeHelper.fakeEvent;
    }
    get onSuspendCanceled() {
        bridgeLog.LogUnavailbleApi("runtime.onSuspendCanceled");return bridgeHelper.fakeEvent;
    }
    get onUpdateAvailable() {
        bridgeLog.LogUnavailbleApi("runtime.onUpdateAvailable");return bridgeHelper.fakeEvent;
    }
    openOptionsPage(callback) {
        bridgeLog.DoActionAndLog(() => {
            var optionsPage = myBrowser.runtime.getManifest()["options_page"];
            var optionsPageUrl = myBrowser.runtime.getURL(optionsPage);
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.create({ url: optionsPageUrl }, callback);
            } else {
                myBrowser.tabs.create({ url: optionsPageUrl });
            }
        }, "runtime.openOptionsPage", undefined, "tabs.create({ url: optionsPageUrl })");
    }
    connectNative(application) {
        bridgeLog.LogUnavailbleApi("runtime.connectNative");
        return null;
    }
    getPackageDirectoryEntry(callback) {
        bridgeLog.LogUnavailbleApi("runtime.getPackageDirectoryEntry");
    }
    getPlatformInfo(callback) {
        bridgeLog.LogUnavailbleApi("runtime.getPlatformInfo");
    }
    reload() {
        bridgeLog.LogUnavailbleApi("runtime.reload");
    }
    requestUpdateCheck(callback) {
        bridgeLog.LogUnavailbleApi("runtime.requestUpdateCheck");
    }
    restart() {
        bridgeLog.LogUnavailbleApi("runtime.restart");
    }
    setUninstallURL(url, callback) {
        bridgeLog.LogUnavailbleApi("runtime.setUninstallURL");
    }
    sendNativeMessage(application, message, responseCallback) {
        bridgeLog.LogUnavailbleApi("runtime.sendNativeMessage");
    }
}
class EdgeStorageBridge {
    get local() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.storage.local;
        }, "storage.local");
    }
    get onChanged() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.storage.onChanged;
        }, "storage.onChanged");
    }
}
class EdgeChromeStorageBridge extends EdgeStorageBridge {
    get managed() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.storage.local;
        }, "storage.managed", undefined, "storage.local");
    }
    get sync() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.storage.local;
        }, "storage.sync", undefined, "storage.local");
    }
}
class EdgeTabsBridge {
    get onActivated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.tabs.onActivated;
        }, "tabs.onActivated");
    }
    get onCreated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.tabs.onCreated;
        }, "tabs.onCreated");
    }
    get onRemoved() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.tabs.onRemoved;
        }, "tabs.onRemoved");
    }
    get onReplaced() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.tabs.onReplaced;
        }, "tabs.onReplaced");
    }
    get onUpdated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.tabs.onUpdated;
        }, "tabs.onUpdated");
    }
    create(createProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.create(createProperties, callback);
            } else {
                myBrowser.tabs.create(createProperties);
            }
        }, "tabs.create");
    }
    detectLanguage(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.detectLanguage(tabId, callback);
        }, "tabs.detectLanguage");
    }
    executeScript(tabId, details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.executeScript(tabId, details, callback);
            } else {
                myBrowser.tabs.executeScript(tabId, details);
            }
        }, "tabs.executeScript");
    }
    get(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.get(tabId, callback);
        }, "tabs.get");
    }
    getCurrent(callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.getCurrent(callback);
        }, "tabs.getCurrent");
    }
    insertCSS(tabId, details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.insertCSS(tabId, details, callback);
            } else {
                myBrowser.tabs.insertCSS(tabId, details);
            }
        }, "tabs.insertCSS");
    }
    query(queryInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.query(queryInfo, callback);
        }, "tabs.query");
    }
    remove(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.remove(tabId, callback);
            } else {
                myBrowser.tabs.remove(tabId);
            }
        }, "tabs.remove");
    }
    sendMessage(tabId, message, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof responseCallback !== "undefined" && typeof responseCallback !== "null") {
                myBrowser.tabs.sendMessage(tabId, message, responseCallback);
            } else {
                myBrowser.tabs.sendMessage(tabId, message);
            }
        }, "tabs.sendMessage");
    }
    update(tabId, updateProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.update(tabId, updateProperties, callback);
            } else {
                myBrowser.tabs.update(tabId, updateProperties);
            }
        }, "tabs.update");
    }
}
class EdgeChromeTabsBridge extends EdgeTabsBridge {
    get onAttached() {
        bridgeLog.LogUnavailbleApi("tabs.onAttached");return bridgeHelper.fakeEvent;
    }
    get onDetached() {
        bridgeLog.LogUnavailbleApi("tabs.onDetached");return bridgeHelper.fakeEvent;
    }
    get onHighlighted() {
        bridgeLog.LogUnavailbleApi("tabs.onHighlighted");return bridgeHelper.fakeEvent;
    }
    get onMoved() {
        bridgeLog.LogUnavailbleApi("tabs.onMoved");return bridgeHelper.fakeEvent;
    }
    get onSelectionChanged() {
        return bridgeLog.DoActionAndLog(() => {
            var fakeEvent = bridgeHelper.fakeEvent;
            fakeEvent.addListener = callback => {
                myBrowser.tabs.onActivated.addListener(activeInfo => {
                    callback(activeInfo.tabId, { windowId: activeInfo.windowId });
                });
            };
            return fakeEvent;
        }, "tabs.onSelectionChanged", "tabs.onActivated", "tabs.onActivated");
    }
    duplicate(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.get(tabId, function (tab) {
                if (typeof callback !== "undefined" && typeof callback !== "null") {
                    myBrowser.tabs.create({ url: tab.url }, callback);
                } else {
                    myBrowser.tabs.create({ url: tab.url });
                }
            });
        }, "tabs.duplicate", undefined, "tabs.create");
    }
    getAllInWindow(windowId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.query({ windowId: windowId }, callback);
        }, "tabs.getAllInWindow", "tabs.query", "tabs.query");
    }
    getSelected(windowId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.query({ active: true }, tabs => callback(tabs[0]));
        }, "tabs.getSelected", "tabs.query", "tabs.query");
    }
    sendRequest(tabId, request, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            this.sendMessage(tabId, request, responseCallback);
        }, "tabs.sendRequest", "tabs.sendMessage", "tabs.sendMessage");
    }
    captureVisibleTab(windowId, options, callback) {
        bridgeLog.LogUnavailbleApi("tabs.captureVisibleTab");
    }
    connect(tabId, connectInfo) {
        bridgeLog.LogUnavailbleApi("tabs.connect");
        return null;
    }
    highlight(highlightInfo, callback) {
        bridgeLog.LogUnavailbleApi("tabs.highlight");
    }
    move(tabId, moveProperties, callback) {
        bridgeLog.LogUnavailbleApi("tabs.move");
    }
    reload(tabId, reloadProperties, callback) {
        bridgeLog.LogUnavailbleApi("tabs.reload");
    }
}
class EdgeWebNavigationBridge {
    get onBeforeNavigate() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onBeforeNavigate;
        }, "webNavigation.onBeforeNavigate");
    }
    get onCommitted() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onCommitted;
        }, "webNavigation.onCommitted");
    }
    get onCompleted() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onCompleted;
        }, "webNavigation.onCompleted");
    }
    get onCreatedNavigationTarget() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onCreatedNavigationTarget;
        }, "webNavigation.onCreatedNavigationTarget");
    }
    get onDOMContentLoaded() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onDOMContentLoaded;
        }, "webNavigation.onDOMContentLoaded");
    }
    get onErrorOccurred() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onErrorOccurred;
        }, "webNavigation.onErrorOccurred");
    }
    get onHistoryStateUpdated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onHistoryStateUpdated;
        }, "webNavigation.onHistoryStateUpdated");
    }
    get onReferenceFragmentUpdated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onReferenceFragmentUpdated;
        }, "webNavigation.onReferenceFragmentUpdated");
    }
    get onTabReplaced() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webNavigation.onTabReplaced;
        }, "webNavigation.onTabReplaced");
    }
    getAllFrames(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.webNavigation.getAllFrames(details, callback);
        }, "webNavigation.getAllFrames");
    }
    getFrame(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.webNavigation.getFrame(details, callback);
        }, "webNavigation.getFrame");
    }
}
class EdgeWebRequestBridge {
    get MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES;
        }, "webNavigation.MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES");
    }
    get onAuthRequired() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onAuthRequired;
        }, "webNavigation.onAuthRequired");
    }
    get onBeforeRedirect() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onBeforeRedirect;
        }, "webNavigation.onBeforeRedirect");
    }
    get onBeforeRequest() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onBeforeRequest;
        }, "webNavigation.onBeforeRequest");
    }
    get onBeforeSendHeaders() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onBeforeSendHeaders;
        }, "webNavigation.onBeforeSendHeaders");
    }
    get onCompleted() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onCompleted;
        }, "webNavigation.onCompleted");
    }
    get onErrorOccurred() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onErrorOccurred;
        }, "webNavigation.onErrorOccurred");
    }
    get onHeadersReceived() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onHeadersReceived;
        }, "webNavigation.onHeadersReceived");
    }
    get onResponseStarted() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onResponseStarted;
        }, "webNavigation.onResponseStarted");
    }
    get onSendHeaders() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.webRequest.onSendHeaders;
        }, "webNavigation.onSendHeaders");
    }
    handlerBehaviorChanged(callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.webRequest.handlerBehaviorChanged(callback);
            } else {
                myBrowser.webRequest.handlerBehaviorChanged();
            }
        }, "webRequest.handlerBehaviorChanged");
    }
}
class EdgeWindowsBridge {
    get WINDOW_ID_CURRENT() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.windows.WINDOW_ID_CURRENT;
        }, "windows.WINDOW_ID_CURRENT");
    }
    get WINDOW_ID_NONE() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.windows.WINDOW_ID_NONE;
        }, "windows.WINDOW_ID_NONE");
    }
    get onCreated() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.windows.onCreated;
        }, "windows.onCreated");
    }
    get onFocusChanged() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.windows.onFocusChanged;
        }, "windows.onFocusChanged");
    }
    get onRemoved() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.windows.onRemoved;
        }, "windows.onRemoved");
    }
    create(createData, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.windows.create(createData, callback);
            } else {
                myBrowser.windows.create(createData);
            }
        }, "windows.create");
    }
    get(windowId, getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.get(windowId, getInfo, callback);
        }, "windows.get");
    }
    getAll(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getAll(getInfo, callback);
        }, "windows.getAll");
    }
    getCurrent(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getCurrent(getInfo, callback);
        }, "windows.getCurrent");
    }
    getLastFocused(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getLastFocused(getInfo, callback);
        }, "windows.getLastFocused");
    }
    update(windowId, updateInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.windows.update(windowId, updateInfo, callback);
            } else {
                myBrowser.windows.update(windowId, updateInfo);
            }
        }, "windows.update");
    }
}
class EdgeChromeWindowsBridge extends EdgeWindowsBridge {
    remove(windowId, callback) {
        bridgeLog.LogUnavailbleApi("windows.remove");
    }
}
class EdgeBackgroundBridge {
    constructor() {
        this.app = new EdgeChromeAppBridge();
        this.browserAction = typeof browser.browserAction !== "undefined" ? new EdgeChromeBrowserActionBridge() : undefined;
        this.contextMenus = typeof browser.contextMenus !== "undefined" ? new EdgeContextMenusBridge() : undefined;
        this.cookies = typeof browser.cookies !== "undefined" ? new EdgeChromeCookiesBridge() : undefined;
        this.extension = typeof browser.extension !== "undefined" ? new EdgeChromeExtensionBridge() : undefined;
        this.history = typeof browser.history !== "undefined" ? new EdgeHistoryBridge() : undefined;
        this.i18n = typeof browser.i18n !== "undefined" ? new EdgeI18nBridge() : undefined;
        this.notifications = typeof browser.notifications !== "undefined" ? new EdgeNotificationBridge() : undefined;
        this.pageAction = typeof browser.pageAction !== "undefined" ? new EdgePageActionBridge() : undefined;
        this.permissions = typeof browser.permissions !== "undefined" ? new EdgePermissionsBridge() : undefined;
        this.runtime = typeof browser.runtime !== "undefined" ? new EdgeChromeRuntimeBridge() : undefined;
        this.storage = typeof browser.storage !== "undefined" ? new EdgeChromeStorageBridge() : undefined;
        this.tabs = typeof browser.tabs !== "undefined" ? new EdgeChromeTabsBridge() : undefined;
        this.webNavigation = typeof browser.webNavigation !== "undefined" ? new EdgeWebNavigationBridge() : undefined;
        this.webRequest = typeof browser.webRequest !== "undefined" ? new EdgeWebRequestBridge() : undefined;
        this.windows = typeof browser.windows !== "undefined" ? new EdgeChromeWindowsBridge() : undefined;
    }
}
var myBrowser = browser;
var chrome = new EdgeBackgroundBridge();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ }),
/* 4 */
/***/ (function(module, exports) {

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


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),
/* 6 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = __webpack_require__(2);
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = now

function now() {
    return new Date().getTime()
}


/***/ })
/******/ ]);