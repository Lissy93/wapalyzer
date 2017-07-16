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
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/** global: browser */

(function () {
	var c = {
		init: function () {
			var html = document.documentElement.outerHTML;

			c.log('Function call: init()');

			if (html.length > 50000) {
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			browser.runtime.sendMessage({
				id: 'analyze',
				subject: { html: html },
				source: 'content.js'
			});

			c.getEnvironmentVars();
		},

		log: function (message) {
			browser.runtime.sendMessage({
				id: 'log',
				message: message,
				source: 'content.js'
			});
		},

		getEnvironmentVars: function () {
			var container, script;

			c.log('Function call: getEnvironmentVars()');

			if (typeof document.body === 'undefined') {
				return;
			}

			try {
				container = document.createElement('wappalyzerData');

				container.setAttribute('id', 'wappalyzerData');
				container.setAttribute('style', 'display: none');

				script = document.createElement('script');

				script.setAttribute('id', 'wappalyzerEnvDetection');
				script.setAttribute('src', browser.extension.getURL('js/inject.js'));

				container.addEventListener('wappalyzerEvent', function (event) {
					var environmentVars = event.target.childNodes[0].nodeValue;

					document.documentElement.removeChild(container);
					document.documentElement.removeChild(script);

					environmentVars = environmentVars.split(' ').slice(0, 500);

					browser.runtime.sendMessage({
						id: 'analyze',
						subject: { env: environmentVars },
						source: 'content.js'
					});
				}, true);

				document.documentElement.appendChild(container);
				document.documentElement.appendChild(script);
			} catch (e) {
				c.log('Error: ' + e);
			}
		}
	};

	c.init();
})();

/***/ })
/******/ ]);