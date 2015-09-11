'use strict';

var exports = {};

(function(exports) {
	var utils = {
		pageMeta: {
			url: window.location.hostname,
			isHP: window.location.pathname === '/',
			referrer: window.document.referrer,
			rand: Math.floor(Math.random() * 10e12),
			startTime: new Date().getTime()
		},

		realArray: function(a) {
			return Array.prototype.slice.apply(a);
		},

		SCRIPT_IN_WINDOW_TOP: window === window.top,

		isFriendlyWindow: function(win) {
			var href;

			try {
				href = win.location.href;
			} catch(e) {
				return false;
			}

			return true;
		},

		elementWindow: function(el) {
			return el.ownerDocument.defaultView;
		},

		viewport: function(win) {
			return {width: win.innerWidth, height: win.innerHeight};
		},

		parseQS: function(qs) {
			if (qs.indexOf('http') === 0) {
				qs = qs.split('?')[1];
			}

			var i, kvs, key, val;

			var dict = {};

			qs = qs.split('&');

			for ( i = 0; i < qs.length; i++ ) {
				kvs = qs[i].split('=');
				key = kvs[0];
				val = kvs.slice(1).join('=');

				try {
					dict[key] = window.decodeURIComponent(val);
				} catch (e) {
					this.log('URI decode error', kvs);

					continue;
				}
			}
			return dict;
		},

		makeLog: function(opt_adData, opt_msgNum, opt_pageTags) {
			var assets = [opt_adData] || [];

			return {
				doc: this.pageMeta,
				assets: assets,
				version: '3',
				msgNum: opt_msgNum || 0,
				pageTags: opt_pageTags || []
			};
		},

		expBackoff: function(callback, initTimeoutMS, opt_maxTimeoutMS) {
			var curTimeout = initTimeoutMS;

			var wrapped = function() {
				callback();

				var nextTimeout = 2 * curTimeout;

				curTimeout = opt_maxTimeoutMS ? Math.min(nextTimeout, opt_maxTimeoutMS) : nextTimeout;

				setTimeout(wrapped, curTimeout);
			};

			setTimeout(wrapped, curTimeout);
		},
	};

	utils.SCRIPT_IN_FRIENDLY_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && utils.isFriendlyWindow(window.parent);
	utils.SCRIPT_IN_HOSTILE_IFRAME = !utils.SCRIPT_IN_WINDOW_TOP && !utils.SCRIPT_IN_FRIENDLY_IFRAME;

	exports.utils = utils;
})(exports);

(function(exports) {
	var VALID_AD_SIZES = [
		[160, 600],
		[300, 250],
		[300, 600],
		[300, 1050],
		[336, 280],
		[336, 850],
		[468, 60],
		[728, 90],
		[728, 270],
		[970, 66],
		[970, 90],
		[970, 250],
		[970, 400],
		[970, 415]
		];

	var
		PX_SIZE_TOL = 10,
		MIN_WINDOW_PX = 10,
		MAX_SEARCHES_PER_WINDOW = 10,
		MAX_SEARCHES_PER_ELEMENT = 2;

	var SIZE_SET = (function makeSizeSet() {
		var
			set = {},
			i,
			xfuz,
			yfuz,
			size,
			width,
			height;

		for ( i = 0; i < VALID_AD_SIZES.length; i++ ) {
			for  (xfuz = -PX_SIZE_TOL; xfuz <= PX_SIZE_TOL; xfuz++ ) {
				for ( yfuz = -PX_SIZE_TOL; yfuz <= PX_SIZE_TOL; yfuz++ ) {
					size = VALID_AD_SIZES[i];
					width = size[0] + xfuz;
					height = size[1] + yfuz;
					set[width] = set[width] || {};
					set[width][height] = true;
				}
			}
		}

		return set;
	})();

	function elementIsAd(el) {
		if ( typeof el.searches !== 'number' ) {
			el.searches = 0;
		}

		if ( el.searches >= MAX_SEARCHES_PER_ELEMENT ) {
			return false;
		}

		el.searches ++;

		var w = el.offsetWidth;

		return SIZE_SET[w] && SIZE_SET[w][el.offsetHeight];
	}

	function windowMightContainAds(win) {
		return win.innerWidth >= MIN_WINDOW_PX && win.innerHeight >= MIN_WINDOW_PX;
	}

	function isNewAd(el) {
		return el.mp_adFound !== true;
	}

	function getFriendlyIframes(win) {
		var iframes = win.document.querySelectorAll('iframe');

		iframes = exports.utils.realArray(iframes);

		var friendlyIframes = iframes.filter(function(ifr) {
			return exports.utils.isFriendlyWindow(ifr.contentWindow);
		});

		return friendlyIframes;
	}

	function findAds(win, opt_ads) {
		if ( !windowMightContainAds(win) ) {
			return;
		}

		if ( typeof win.searches !== 'number' ) {
			win.searches = 0;
		}

		var ads = opt_ads || [];

		if ( exports.utils.SCRIPT_IN_WINDOW_TOP || win.searches < MAX_SEARCHES_PER_WINDOW ) {
			var adCandidates = win.document.querySelectorAll('img, object, embed');

			adCandidates = exports.utils.realArray(adCandidates);

			adCandidates.forEach(function(el) {
				if (elementIsAd(el) && isNewAd(el)) {
					el.mp_adFound = true;

					ads.push(el);
				}
			});

			win.searches ++;
		}

		var iframes = getFriendlyIframes(win);

		iframes.forEach(function(ifr) {
			findAds(ifr.contentWindow, ads);
		});

		return ads;
	}

	exports.adfinder = {
		findAds: findAds
	};
})(exports);

(function(exports) {
	var parser = {
		TAGS_WITH_SRC_ATTR: {
			'IMG': true,
			'SCRIPT': true,
			'IFRAME': true,
			'EMBED': true
		},

		MAX_ATTR_LEN: 100,

		getUrl: function(el, params) {
			var url;

			if ( this.TAGS_WITH_SRC_ATTR.hasOwnProperty(el.tagName) ) {
				url = el.src;
			} else if ( el.tagName === 'OBJECT' ) {
				url = el.data || (params && params.movie) || null;
			} else if ( el.tagName === 'A' ) {
				url = el.href;
			}

			if ( url && url.indexOf('http') === 0 ) {
				return url;
			} else {
				return null;
			}
		},

		getParams: function(el) {
			if ( el.tagName !== 'OBJECT' ) {
				return null;
			}

			var i, child;
			var params = {};
			var children = el.children;

			for ( i = 0; i < children.length; i++ ) {
				child = children[i];

				if ( child.tagName === 'PARAM' && child.name ) {
					params[child.name.toLowerCase()] = child.value;
				}
			}

			return params;
		},

		getPosition: function(el) {
			var rect = el.getBoundingClientRect();
			var win = exports.utils.elementWindow(el);

			return {
				width: rect.width,
				height: rect.height,
				left: rect.left + win.pageXOffset,
				top: rect.top + win.pageYOffset
			};
		},

		getFlashvars: function(el, params, url) {
			var flashvars;
			var urlQS = url && url.split('?')[1];

			if ( el.tagName === 'EMBED' ) {
				flashvars = el.getAttribute('flashvars') || urlQS;
			} else if (el.tagName === 'OBJECT') {
				flashvars = params.flashvars || el.getAttribute('flashvars') || urlQS;
			}

			return (flashvars && exports.utils.parseQS(flashvars)) || null;
		},

		findClickThru: function(el, flashvars) {
			var key;

			if ( el.tagName === 'IMG' && el.parentElement.tagName === 'A' ) {
				return el.parentElement.href;
			} else if ( flashvars ) {
				for ( key in flashvars ) {
					if ( flashvars.hasOwnProperty(key) ) {
						if (key.toLowerCase().indexOf('clicktag') === 0) {
							return flashvars[key];
						}
					}
				}
			}

			return null;
		},

		getAttr: function(el, name) {
			var val = el.getAttribute(name);

			if ( val && val.slice && val.toString ) {
				return val.slice(0, this.MAX_ATTR_LEN).toString();
			} else {
				return null;
			}
		},

		putPropIfExists: function(obj, name, val) {
			if (val) {
				obj[name] = val;
			}
		},

		putAttrIfExists: function(obj, el, name) {
			var val = this.getAttr(el, name);

			this.putPropIfExists(obj, name, val);
		},

		elementToJSON: function(el, opt_findClickThru) {
			var pos = this.getPosition(el);
			var params = this.getParams(el);
			var url = this.getUrl(el, params);
			var flashvars = this.getFlashvars(el, params, url);
			var clickThru = opt_findClickThru && this.findClickThru(el, flashvars);
			var json = {
				tagName: el.tagName,
				width: pos.width,
				height: pos.height,
				left: pos.left,
				top: pos.top,
				children: []
			};

			if (params) {
				delete params.flashvars;
			}

			this.putAttrIfExists(json, el, 'id');
			this.putAttrIfExists(json, el, 'class');
			this.putAttrIfExists(json, el, 'name');

			this.putPropIfExists(json, 'flashvars', flashvars);
			this.putPropIfExists(json, 'url', url);
			this.putPropIfExists(json, 'params', params);
			this.putPropIfExists(json, 'clickThru', clickThru);

			return json;
		}
	};

	exports.parser = { elementToJSON: parser.elementToJSON.bind(parser) };
})(exports);

(function(exports) {
	var ContextManager = function(adData) {
		this.adData = adData;
	};

	ContextManager.prototype = {
		CONTAINER_SIZE_TOL: 0.4,
		ASPECT_RATIO_FOR_LEADERBOARDS: 2,

		isValidContainer: function(el, opt_curWin) {
			var cWidth = el.clientWidth;
			var cHeight = el.clientHeight;

			var adWidth = this.adData.width;
			var adHeight = this.adData.height;

			var winWidth = opt_curWin && opt_curWin.innerWidth;
			var winHeight = opt_curWin && opt_curWin.innerHeight;
			var similarWin = opt_curWin && this.withinTol(adWidth, winWidth) && this.withinTol(adHeight, winHeight);

			var similarSizeX = this.withinTol(adWidth, cWidth);
			var similarSizeY = this.withinTol(adHeight, cHeight);
			var adAspect = adWidth / adHeight;

			return similarWin || el.tagName === 'A' || ( adAspect >= this.ASPECT_RATIO_FOR_LEADERBOARDS && similarSizeY ) || (similarSizeX && similarSizeY);
		},

		withinTol: function(adlen, conlen) {
			var pct = (conlen - adlen) / adlen;

			return pct <= this.CONTAINER_SIZE_TOL;
		},

		serializeElements: function(el) {
			if ( !el ) {
				return;
			}

			var i;
			var ifrWin;
			var adId = this.adData.adId;
			var elIsAd = false;

			if ( adId && el[adId] && el[adId].isAd === true ) {
				elIsAd = true;
			}

			var json = exports.parser.elementToJSON(el, elIsAd);

			if ( elIsAd ) {
				json.adId = adId;
				this.adData.element = json;
			}

			var children = exports.utils.realArray(el.children).filter(function(el) {
				var param = el.tagName === 'PARAM';
				var inlineScript = el.tagName === 'SCRIPT' && !(el.src && el.src.indexOf('http') >= 0);
				var noScript = el.tagName === 'NOSCRIPT';

				return !(param || inlineScript || noScript);
			});

			for ( i = 0; i < children.length; i++ ) {
				json.children.push(this.serializeElements(children[i]));
			}

			if ( el.tagName === 'IFRAME' ) {
				ifrWin = el.contentWindow;

				if ( adId && el[adId] && el[adId].needsWindow ) {
					json.contents = this.adData.serializedIframeContents;

					el[adId].needsWindow = false;

					delete this.adData.serializedIframeContents;
				} else if ( exports.utils.isFriendlyWindow(ifrWin) ) {
					json.contents = this.serializeElements(ifrWin.document.documentElement);
				}
			}

			return json;
		},

		captureHTML: function(containerEl) {
			this.adData.context = this.serializeElements(containerEl);

			if ( this.adData.html ) {
				this.adData.html.push(containerEl.outerHTML);
			}
		},

		nodeCount: function(el) {
			return el.getElementsByTagName('*').length + 1;
		},

		highestContainer: function(curWin, referenceElement) {
			var curContainer = referenceElement;
			var docEl = curWin.document.documentElement;
			var parentContainer;

			if ( curWin !== curWin.top && this.isValidContainer(docEl, curWin) ) {
				return docEl;
			}

			while ( true ) {
				parentContainer = curContainer.parentElement;

				if (this.isValidContainer(parentContainer)) {
					curContainer = parentContainer;
				} else {
					return curContainer;
				}
			}
		}
	};

	var tagfinder = {
		prepToSend: function(adData) {
			delete adData.width;
			delete adData.height;
		},

		setPositions: function(adData, opt_el, opt_winPos) {
			var el = opt_el || adData.context;
			var winPos = opt_winPos || {left: 0, top: 0};
			var ifrPos;

			el.left += winPos.left;
			el.top += winPos.top;

			el.children.forEach(function(child) {
				this.setPositions(adData, child, winPos);
			}, this);

			if ( el.contents ) {
				ifrPos = {left: el.left, top: el.top};
				this.setPositions(adData, el.contents, ifrPos);
			}

			if ( el.adId === adData.adId ) {
				adData.element.left = el.left;
				adData.element.top = el.top;
			}
		},

		appendTags: function(adData, referenceElement) {
			var mgr = new ContextManager(adData);
			var curWin = exports.utils.elementWindow(referenceElement);
			var highestContainer;

			while (true) {
				highestContainer = mgr.highestContainer(curWin, referenceElement);
				mgr.captureHTML(highestContainer);

				if (curWin === window.top) {
					break;
				} else {
					mgr.adData.serializedIframeContents = mgr.adData.context;

					if (exports.utils.isFriendlyWindow(curWin.parent)) {
						referenceElement = curWin.frameElement;
						referenceElement[mgr.adData.adId] = { needsWindow: true };
						curWin = curWin.parent;
					} else {
						break;
					}
				}
			}

			return {
				referenceElement:referenceElement,
				highestContainer: highestContainer
			};
		}
	};

	exports.tagfinder = tagfinder;
})(exports);

(function(exports) {
	var _onAdFound;
	var _getFullHTML;
	var _logsSent = 0;
	var _pageTags;
	var INIT_MS_BW_SEARCHES = 2000;
	var PAGE_TAG_RE = new RegExp('gpt|oascentral');

	function getPageTags(doc) {
		var scripts = doc.getElementsByTagName('script');
		var pageTags = [];

		scripts = exports.utils.realArray(scripts);

		scripts.forEach(function(script) {
			if (PAGE_TAG_RE.exec(script.src)) {
				pageTags.push({'tagName': 'SCRIPT', 'url': script.src});
			}
		});

		return pageTags;
	}

	function messageAllParentFrames(adData) {
		adData.dummyId = true;

		var win = window;

		while ( win !== win.top ) {
			win = win.parent;
			win.postMessage(adData, '*');
		}
	}

	function appendTagsAndSendToParent(adData, referenceElement) {
		var results = exports.tagfinder.appendTags(adData, referenceElement);

		if ( exports.utils.SCRIPT_IN_HOSTILE_IFRAME ) {
			messageAllParentFrames(adData);
		} else if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
			exports.tagfinder.setPositions(adData);
			exports.tagfinder.prepToSend(adData);

			var html = adData.html;

			delete adData.html;

			adData.curPageUrl = window.location.href;
			_pageTags = _pageTags || getPageTags(document);

			var log = exports.utils.makeLog(adData, _logsSent, _pageTags);

			if ( _onAdFound ) {
				_onAdFound(log, html, results.referenceElement);
				_logsSent++;
			}
		}
	}

	function extractAdsWrapper() {
		extractAds();
		setTimeout(extractAdsWrapper, INIT_MS_BW_SEARCHES);
	}

	function extractAds() {
		var ads = exports.adfinder.findAds(window);

		if ( !ads ) {
			return;
		}

		ads.forEach(function(ad) {
			var startTime = new Date().getTime();
			var adId = startTime + '-' + Math.floor(Math.random() * 10e12);

			var adData = {
				width: ad.offsetWidth,
				height: ad.offsetHeight,
				startTime: startTime,
				html: ( _getFullHTML && [] ) || null,
				adId: adId
			};

			ad[adId] = { isAd: true };

			appendTagsAndSendToParent(adData, ad);
		});
	}

	function onPostMessage(event) {
		var adData = event.data;
		var ifrTag;

		if ( !adData.dummyId ) {
			return;
		}

		delete adData.dummyId;

		try {
			ifrTag = event.source.frameElement;
		} catch(e) {
			return false;
		}

		ifrTag[adData.adId] = {needsWindow: true};

		appendTagsAndSendToParent(adData, ifrTag);
	}

	exports.coordinator = {
		init: function(onAdFound, opt_getFullHTML) {
			if (exports.utils.SCRIPT_IN_FRIENDLY_IFRAME) {
				return false;
			}

			_onAdFound = onAdFound;
			_getFullHTML = opt_getFullHTML;

			if ( exports.utils.SCRIPT_IN_WINDOW_TOP ) {
				chrome.runtime.sendMessage({ event: 'new-page', url: window.location.href });
			}

			window.addEventListener('message', onPostMessage, false);

			if ( document.readyState !== 'loading' ) {
				extractAdsWrapper();
			} else {
				document.addEventListener('DOMContentLoaded', extractAdsWrapper);
			}
		}
	};
})(exports);

(function(exports) {
	var onAdFound = function(log) {
		chrome.extension.sendRequest({ id: 'ad_log', subject: log });
	};

	var getFullHTML = false;

	exports.coordinator.init(onAdFound, getFullHTML);
})(exports);
