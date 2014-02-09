(function() {
	'use strict';

	var
		main = require('wappalyzer'),
		w = main.wappalyzer,
		tabCache = {},
		categoryNames = {},
		data = require('sdk/self').data,
		tabs = require('sdk/tabs'),
		panel = require('sdk/panel').Panel({
			width: 250,
			height: 50,
			contentURL: data.url('panel.html'),
			contentScriptFile: data.url('js/panel.js')
		}),
		widget = require('sdk/widget').Widget({
			id: 'wappalyzer',
			label: 'Wappalyzer',
			contentURL: data.url('images/icon32.png'),
			panel: panel
		});

	tabs.on('open', function(tab) {
		tabCache[tab.id] = {
			count: 0,
			appsDetected: [],
			analyzed: []
		};
	});

	tabs.on('close', function(tab) {
		tabCache[tab.id] = null;
	});

	tabs.on('activate', function(tab) {
		w.driver.displayApps();

		tabs.activeTab.on('ready', function(tab) {
			var worker = tab.attach({
				contentScriptFile: data.url('js/tab.js')
			});

			worker.port.on('analyze', function(message) {
				w.analyze(message.hostname, message.url, message.analyze);
			});

			worker.port.on('log', function(message) {
				w.log('[ tab.js ] ' + message);
			});
		});
	});

	panel.port.on('resize', function(height) {
		panel.height = height;
	});

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log(args.message);
		},

		/**
		 * Initialize
		 */
		init: function(callback) {
			var json = JSON.parse(data.load('apps.json'));

			w.apps = json.apps;
			w.categories = json.categories;

			for ( var id in w.categories ) {
				categoryNames[id] = require('sdk/l10n').get('cat' + id);
			}

			for each ( var tab in tabs ) {
				tabCache[tab.id] = {
					count: 0,
					appsDetected: [],
					analyzed: []
				};
			}
		},

		displayApps: function() {
			var count = w.detected[tabs.activeTab.url] ? Object.keys(w.detected[tabs.activeTab.url]).length.toString() : '0';

			w.log('display apps');

			tabCache[tabs.activeTab.id].count = count;
			tabCache[tabs.activeTab.id].appsDetected = w.detected[tabs.activeTab.url];

			widget.contentURL = data.url('images/icon32.png');

			if ( count > 0 ) {
				// Find the main application to display
				var i, appName, found = false;

				widget.contentURL = data.url('images/icon32_hot.png'),

				w.driver.categoryOrder.forEach(function(match) {
					for ( appName in w.detected[tabs.activeTab.url] ) {
						w.apps[appName].cats.forEach(function(cat) {
							if ( cat == match && !found ) {
								widget.contentURL = data.url('images/icons/' + appName + '.png'),

								found = true;
							}
						});
					}
				});
			};

			panel.port.emit('displayApps', { tabCache: tabCache[tabs.activeTab.id], apps: w.apps, categories: w.categories, categoryNames: categoryNames });
		},

		ping: function() {
			w.log('ping');
		},

		categoryOrder: [ // Used to pick the main application
			 1, // CMS
			11, // Blog
			 6, // Web Shop
			 2, // Message Board
			 8, // Wiki
			13, // Issue Tracker
			30, // Web Mail
			18, // Web Framework
			21, // LMS
			 7, // Photo Gallery
			 3, // Database Manager
			34, // Database
			 4, // Documentation Tool
			 9, // Hosting Panel
			29, // Search Engine
			12, // Javascript Framework
			26, // Mobile Framework
			25, // Javascript Graphics
			22, // Web Server
			27, // Programming Language
			28, // Operating System
			15, // Comment System
			20, // Editor
			10, // Analytics
			32, // Marketing Automation
			38, // Media Server
			31, // CDN
			23, // Cache Tool
			17, // Font Script
			24, // Rich Text Editor
			35, // Map
			 5, // Widget
			14, // Video Player
			16, // Captcha
			33, // Web Server Extension
			37, // Network Device
			39, // Webcam
			40, // Printer
			36, // Advertising Network
			19  // Miscellaneous
		]
	}

	w.init();
}());
