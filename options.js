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
/** global: wappalyzer */

document.addEventListener('DOMContentLoaded', function () {
	var d = document;

	var options = {
		init: function () {
			options.load();

			d.querySelector('#github').addEventListener('click', function () {
				open(wappalyzer.config.githubURL);
			});

			d.querySelector('#twitter').addEventListener('click', function () {
				open(wappalyzer.config.twitterURL);
			});

			d.querySelector('#wappalyzer').addEventListener('click', function () {
				open(wappalyzer.config.websiteURL);
			});
		},

		get: function (name, defaultValue, callback) {
			browser.storage.local.get(name).then(function (item) {
				callback(item.hasOwnProperty(name) ? item[name] : defaultValue);
			});
		},

		set: function (name, value) {
			var option = {};

			option[name] = value;

			browser.storage.local.set(option);
		},

		load: function () {
			options.get('upgradeMessage', true, function (value) {
				var el = d.querySelector('#option-upgrade-message');

				el.checked = value;

				el.addEventListener('change', function () {
					options.set('upgradeMessage', el.checked);
				});
			});

			options.get('dynamicIcon', true, function (value) {
				var el = d.querySelector('#option-dynamic-icon');

				el.checked = value;

				el.addEventListener('change', function () {
					options.set('dynamicIcon', el.checked);
				});
			});

			options.get('tracking', true, function (value) {
				var el = d.querySelector('#option-tracking');

				el.checked = value;

				el.addEventListener('change', function () {
					options.set('tracking', el.checked);
				});
			});
		}
	};

	options.init();
});

/***/ })
/******/ ]);