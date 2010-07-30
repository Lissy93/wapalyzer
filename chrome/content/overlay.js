// Wappalyzer by ElbertF 2009 http://elbertf.com

var wappalyzer = {};

window.addEventListener('load',   function() { wappalyzer.init();       }, false);
window.addEventListener('unload', function() { wappalyzer.sendReport(); }, false);

wappalyzer =
{
	homeUrl:        'http://wappalyzer.com/',
	prevUrl:        '',
	regexDomain:    /^[a-z0-9._\-]+\.[a-z]+$/,
	appsDetected:   0,
	checkUnique:    {},
	currentTab:     false,
	prefs:          null,
	autoDetect:     true,
	enableTracking: true,
	newInstall:     false,
	showAppNames:   3,
	history:        {},
	hitCount:       0,
	isBookmarklet:  false,
	req:            false,

	apps: {
		'phpBB':                 { html: /(Powered by (<a href=("|')[^>]+)?phpBB|<meta name=("|')copyright("|') [^>]+phpBB Group)/i },
		'WordPress':             { html: /(<link rel=("|')stylesheet("|') [^>]+wp-content|<meta name=("|')generator("|') [^>]+WordPress)/i },
		'MediaWiki':             { html: /(<meta name=("|')generator("|') [^>]+MediaWiki|<a[^>]+>Powered by MediaWiki<\/a>)/i },
		'Joomla':                { html: /(<meta name=("|')generator("|') [^>]+Joomla|<!\-\- JoomlaWorks "K2")/i, headers: { 'X-Content-Encoded-By': /Joomla/ } },
		'Drupal':                { html: /(<script [^>]+drupal\.js|jQuery\.extend\(Drupal\.settings, \{|Drupal\.extend\(\{ settings: \{|<link[^>]+sites\/(default|all)\/themes\/|<style.+sites\/(default|all)\/(themes|modules)\/)/i, headers: { 'X-Drupal-Cache': /.*/ } },
		'Kolibri CMS':           { html: /<meta name=("|')copyright("|') [^>]+Kolibri/i },
		'vBulletin':             { html: /<meta name=("|')generator("|') [^>]+vBulletin/i },
		'SMF':                   { html: /<script .+\s+var smf_/i },
		'IPB':                   { html: /<script [^>]+jscripts\/ips_/i },
		'Coppermine':            { html: /<!--Coppermine Photo Gallery/i },
		'MiniBB':                { html: /<a href=("|')[^>]+minibb.+\s+<!--End of copyright link/i },
		'punBB':                 { html: /Powered by <a href=("|')[^>]+punbb/i },
		'XMB':                   { html: /<!-- Powered by XMB/i },
		'YaBB':                  { html: /Powered by <a href=("|')[^>]+yabbforum/i },
		's9y':                   { html: /<meta name=("|')Powered-By("|') [^>]+Serendipity/i },
		'e107':                  { html: /<script [^>]+e107\.js/i },
		'PHP-Fusion':            { html: /Powered by <a href=("|')[^>]+php-fusion/i },
		'DokuWiki':              { html: /<meta name=("|')generator("|') [^>]+DokuWiki/i },
		'Squarespace':           { html: /Squarespace\.Constants\.CURRENT_MODULE_ID/i },
		'MyBB':                  { html: /(<script .+\s+<!--\s+lang\.no_new_posts|<a[^>]* title=("|')Powered By MyBB)/i },
		'FluxBB':                { html: /Powered by (<strong>)?<a href=("|')[^>]+fluxbb/i },
		'Vanilla':               { html: /<body id=("|')(DiscussionsPage|vanilla)/i, headers: { 'X-Powered-By': /Vanilla/ } },
		'TYPO3':                 { html: /(<meta name=("|')generator("|') [^>]+TYPO3|<(script[^>]* src|link[^>]* href)=[^>]*fileadmin)/i, url: /\/typo3/i },
		'Prestashop':            { html: /(<meta name=("|')generator("|') [^>]+PrestaShop|Powered by <a href=("|')[^>]+PrestaShop)/i },
		'Zen Cart':              { html: /<meta name=("|')generator("|') [^>]+Zen Cart/i },
		'osCommerce':            { html: /<!-- header_eof \/\/-->/i },
		'WikkaWiki':             { html: /(Powered by <a href=("|')[^>]+WikkaWiki|<meta name=("|')generator("|') [^>]+WikkaWiki)/i },
		'osCSS':                 { html: /<body onload=("|')window\.defaultStatus='oscss templates';("|')/i },
		'Google Analytics':      { html: /(\.google\-analytics\.com\/ga\.js|<script src=("|')[^"]+google-analytics\.com\/urchin\.js("|'))/i },
		'Crazy Egg':             { html: /<script type=("|')text\/javascript("|') src=("|')http:\/\/cetrk\.com\/pages\/scripts\/[0-9]+\/[0-9]+\.js("|')/ },
		'OneStat':               { html: /var p=("|')http("|')\+\(d\.URL\.indexOf\('https:'\)==0\?'s':''\)\+("|'):\/\/stat\.onestat\.com\/stat\.aspx\?tagver/i },
		'Clicky':                { html: /<script src=("|')http:\/\/static\.getclicky\.com/i },
		'Quantcast':             { html: /<script[^>]* src=("|')http:\/\/edge\.quantserve\.com\/quant\.js("|')>/i },
		'StatCounter':           { html: /<script[^>]* src=("|')http:\/\/www\.statcounter\.com\/counter\/counter/i },
		'W3Counter':             { html: /<script[^>]* src=("|')http:\/\/www\.w3counter\.com\/tracker\.js("|')>/i },
		'Site Meter':            { html: /<script[^>]* src=("|')http:\/\/[^.]+\.sitemeter.com\/js\/counter\.js\?site=/i },
		'CubeCart':              { html: /Powered by <a href=.http:\/\/www\.cubecart\.com/i },
		'jQuery':                { html: /<script[^>]* src=("|')[^>]*jquery[^>]*\.js/i },
		'MooTools':              { html: /<script[^>]* src=("|')[^>]*mootools[^>]*\.js("|')/i },
		'Prototype':             { html: /<script[^>]* src=("|')[^>]*prototype\.js("|')/i },
		'MochiKit':              { html: /<script[^>]* src=("|')[^>]*MochiKit\.js/i },
		'viennaCMS':             { html: /powered by <a href=("|')[^>]+viennacms/i },
		'Movable Type':          { html: /<meta name=("|')generator("|') [^>]+Movable Type/i },
		'Tumblr':                { html: /<iframe src=("|')http:\/\/www\.tumblr\.com/i, url: /^(www.)?.+\.tumblr\.com/i, headers: { 'X-Tumblr-Usec': /.*/ } },
		'Google Friend Connect': { html: /<script[^>]* src=("|')[^>]*google.com\/friendconnect/i },
		'MyBlogLog':             { html: /<script[^>]* src=("|')[^>]*pub\.mybloglog\.com/i },
		'Google Maps':           { html: /<script[^>]* src=("|')[^>]*maps\.google\.com\/maps\?file=api/i },
		'AWStats':               { html: /<meta name=("|')generator("|') [^>]+AWStats/i },
		'phpMyAdmin':            { html: /(var pma_absolute_uri = '|PMA_sendHeaderLocation\(|<title>phpMyAdmin<\/title>)/i },
		'phpDocumentor':         { html: /<!-- Generated by phpDocumentor/ },
		'BigDump':               { html: /<!-- <h1>BigDump: Staggered MySQL Dump Importer/ },
		'MODx':                  { html: /(<a[^>]+>Powered by MODx<\/a>|var el= \$\('modxhost'\);|<script type=("|')text\/javascript("|')>var MODX_MEDIA_PATH = "media";)/i },
		'VP-ASP':                { html: /(<a[^>]+>Powered By VP\-ASP Shopping Cart<\/a>|<script[^>]* src=("|')[^>]*vs350\.js)/ },
		'SPIP':                  { html: /<meta name=("|')generator("|') [^>]+SPIP/i, headers: { 'X-Spip-Cache': /.*/ } },
		'Plesk':                 { html: /<script[^>]* src=("|')[^>]*common\.js\?plesk/i },
		'Magento':               { html: /var BLANK_URL = '[^>]+js\/blank\.html'/i },
		'DirectAdmin':           { html: /<a[^>]+>DirectAdmin<\/a> Web Control Panel/i },
		'cPanel':                { html: /<!-- cPanel/i },
		'webEdition':            { html: /(<meta name=("|')generator("|') [^>]+webEdition|<meta name=("|')DC.title("|') [^>]+webEdition)/i },
		'CMS Made Simple':       { html: /<meta name=("|')generator("|') [^>]+CMS Made Simple/i },
		'xtCommerce':            { html: /(<meta name=("|')generator("|') [^>]+xt:Commerce|<div class=("|')copyright("|')>.+<a[^>]+>xt:Commerce)/i },
		'BIGACE':                { html: /(<meta name=("|')generator("|') [^>]+BIGACE|Powered by <a href=("|')[^>]+BIGACE|<!--\s+Site is running BIGACE)/i },
		'Ubercart':              { html: /<script[^>]* src=("|')[^>]*uc_cart\/uc_cart_block\.js/i },
		'TYPOlight':             { html: /(<!--\s+This website is powered by (TYPOlight|Contao)|<link[^>]+(typolight|contao).css)/i },
		'posterous':             { html: /<div class=("|')posterous/i },
		'papaya CMS':            { html: /<link[^>]*\/papaya-themes\//i },
		'eZ Publish':            { html: /<meta name=("|')generator("|') [^>]+eZ Publish/i },
		'script.aculo.us':       { html: /<script[^>]* src=("|')[^>]*scriptaculous\.js("|')/i },
		'dojo':                  { html: /<script[^>]* src=("|')[^>]*dojo(\.xd)?\.js("|')/i },
		'ExtJS':                 { html: /<script[^>]* src=("|')[^>]*ext\-base\.js("|')/i },
		'WebPublisher':          { html: /<meta name=("|')generator("|') [^>]+WEB\|Publisher/i },
		'ConversionLab':         { html: /<script[^>]* src=("|')http:\/\/conversionlab\.trackset\.com\/track\/tsend\.js("|')/ },
		'Koego':                 { html: /<script[^>]* src=("|')http\:\/\/tracking\.koego\.com\/end\/ego\.js("|')/ },
		'YUI':                   { html: /<script[^>]* src=("|')[^'"]*(\/yui\/|yui\.yahooapis\.com)[^'"]*("|')/ },
		'VisualPath':            { html: /<script[^>]* src=("|')http:\/\/visualpath[^\/]*\.trackset\.it\/[^\/]+\/track\/include\.js("|')/ },
		'WebGUI':                { html: /<meta name=("|')generator("|') [^>]+WebGUI/i },
		'Plone':                 { html: /<meta name=("|')generator("|') [^>]+Plone/i },
		'CS Cart':               { html: /&nbsp;Powered by (<a href=.http:\/\/www\.cs\-cart\.com|CS\-Cart)/i },
		'Web Optimizer':         { html: /<title [^>]*lang=("|')wo("|')>/ },
		'K2':                    { html: /<!\-\- JoomlaWorks "K2"/ },
		'AddThis':               { html: /<script[^>]* src=("|')[^>]*addthis\.com\/js/ },
		'Koobi':                 { html: /<meta name=("|')generator("|') [^>]+Koobi/i },
		'XiTi':                  { html: /<[^>]+src=("|')[^>]+xiti.com\/hit.xiti/i },
		'Kampyle':               { html: /<script[^>]* src=("|')http:\/\/cf\.kampyle\.com\/k_button\.js("|')/ },
		'ClickTale':             { html: /if\(typeof ClickTale(Tag)*==("|')function("|')\)/ },
		'Yahoo! Web Analytics':  { html: /<script[^>]* src=("|')[^>]*http:\/\/d\.yimg\.com\/mi\/ywa\.js/ },
		'XOOPS':                 { html: /<meta name=("|')generator("|') [^>]+XOOPS/i },
		'Amiro.CMS':             { html: /<meta name=("|')generator("|') [^>]+Amiro/i },
		'Blogger':               { html: /<meta content=("|')blogger("|') [^>]+generator/i, url: /^(www.)?.+\.blogspot\.com/i },
		'DataLife Engine':       { html: /<meta name=("|')generator("|') [^>]+DataLife Engine/i },
		'Nedstat':               { html: /sitestat\(("|')http:\/\/nl\.sitestat\.com/ },
		'Microsoft ASP.NET':     { html: /<input[^>]+name=("|')__VIEWSTATE/ },
		'Yandex.Metrika':        { html: /<script[^>]* src=("|')[^"']+mc\.yandex\.ru\/metrika\/watch\.js("|')/ },
		'Snoobi':                { html: /<script[^>]* src=("|')[^"']+snoobi\.com\/snoop\.php/ },
		'Moogo':                 { html: /<script[^>]* src=("|')[^"']+kotisivukone.js/ },
		'Trac':                  { html: /(<a id=("|')tracpowered)/i },
		'MantisBT':              { html: /<img[^>]+ alt=("|')Powered by Mantis Bugtracker/i },
		'Bugzilla':              { html: /<[^>]+(id|title|name)=("|')bugzilla/i },
		'Redmine':               { html: /(<meta name=("|')description("|')Redmine("|')|Powered by <a href=("|')[^>]+Redmine)/i },
		'2z Project':            { html: /<meta name=("|')generator("|') [^>]+2z project/i },
		'Get Satisfaction':      { html: /var feedback_widget = new GSFN\.feedback_widget\(feedback_widget_options\)/ },
		'Swiftlet':              { html: /(<meta name=("|')generator("|') [^>]+Swiftlet|Powered by <a href=("|')[^>]+Swiftlet)/i, headers: { 'X-Swiftlet-Cache': /.*/, 'X-Powered-By': /Swiftlet/ } },
		'YouTube':               { html: /<(param|embed)[^>]+youtube\.com\/v/i },
		'Vimeo':                 { html: /<(param|embed)[^>]+vimeo\.com\/moogaloop/i },
		'blip.tv':               { html: /<(param|embed)[^>]+blip\.tv\/play/i },
		'SWFObject':             { html: /<script[^>]+swfobject\.js/i },
		'Textpattern CMS':       { html: /<meta name=("|')generator("|') [^>]+Textpattern/i },
		'1C-Bitrix':             { html: /(<link[^>]+components\/bitrix|<script[^>]+1c\-bitrix)/i },
		'InstantCMS':            { html: /<meta name=("|')generator("|') [^>]+InstantCMS/i },
		'MaxSite CMS':           { html: /<meta name=("|')generator("|') [^>]+MaxSite CMS/i },
		'S.Builder':             { html: /<meta name=("|')generator("|') [^>]+S\.Builder/i },
		'openEngine':            { html: /<meta[^>]+openEngine/i },
		'SiteEdit':              { html: /<meta name=("|')generator("|') [^>]+SiteEdit/i },
		'Kentico CMS':           { html: /<meta name=("|')generator("|') [^>]+Kentico CMS/i },
		'ShareThis':             { html: /<script[^>]+ src=("|')[^"']+w\.sharethis\.com\//i },
		'chartbeat':             { html: /function loadChartbeat\(\) {/i },
		'Meebo':                 { html: /(<iframe id=("|')meebo\-iframe("|')|Meebo\('domReady'\))/ },
		'Gravity Insights':      { html: /gravityInsightsParams\.site_guid = '/ },
		'Disqus':                { html: /(<div[^>]+id=("|')disqus_thread("|')|<script[^>]+disqus_url)/ },
		'reCAPTCHA':             { html: /(<div[^>]+id=("|')recaptcha_image|<script[^>]+ src=("|')https:\/\/api\-secure\.recaptcha\.net)/ },
		'DotNetNuke':            { html: /(<meta name=("|')generator("|') [^>]+DotNetNuke|<!\-\- by DotNetNuke Corporation)/i },
		'jQuery UI':             { html: /<script[^>]* src=("|')[^>]*jquery\-ui[^>]*\.js/i },
		'Typekit':               { html: /<script[^>]* src=("|')[^>]*use.typekit.com/i },
		'Mint':                  { html: /<script[^>]* src=("|')[^>]*mint\/\?js/i },
		'cufon':                 { html: /(<script[^>]* src=("|')[^>]*cufon\-yui\.js|<script[^>]*>[^<]+Cufon\.now\(\))/i },
		'sIFR':                  { html: /<script[^>]* src=("|')[^>]*sifr\.js/i },
		'Mollom':                { html: /(<script[^>]* src=("|')[^>]*mollom\.js|<img[^>]+\/.mollom\/.com)/i },
		'YUI Doc':               { html: /<html[^>]* yuilibrary\.com\/rdf\/[0-9.]+\/yui\.rdf/i },
		'Piwik':                 { html: /var piwikTracker = Piwik\.getTracker\(/i },
		'SOBI 2':                { html: /(<!\-\- start of Sigsiu Online Business Index|<div[^>]* class=("|')sobi2)/i },
		'DreamWeaver':           { html: /(<!\-\-[^>]*(InstanceBeginEditable|Dreamweaver[^>]+target|DWLayoutDefaultTable)|function MM_preloadImages\(\) {)/ },
		'FrontPage':             { html: /<meta name=("|')GENERATOR("|') [^>]+Microsoft FrontPage/i },
		'TypePad':               { html: /<meta name=("|')generator("|') [^>]+typepad/i, url: /^(www.)?.+\.typepad\.com/i },
		'LiveJournal':           { url: /^(www.)?.+\.livejournal\.com/i },
		'Vox':                   { url: /^(www.)?.+\.vox\.com/i },
		'xajax':                 { html: /<script[^>]* src=("|')[^>]*xajax_core\.js/i },
		'OpenCart':              { html: /Powered By <a href=("|')[^>]+OpenCart/i },
		'SQL Buddy':             { html: /(<title>SQL Buddy<\/title>|<[^>]+onclick=("|')sideMainClick\(("|')home\.php)/i },
		'phpPgAdmin':            { html: /(<title>phpPgAdmin<\/title>|<span class=("|')appname("|')>phpPgAdmin)/i },
		'Flyspray':              { html: /(<a[^>]+>Powered by Flyspray|<map id=("|')projectsearchform)/ },
		'swift.engine':          { headers: { 'X-Powered-By': /swift\.engine/ } },
		'sNews':                 { html: /<meta name=("|')Generator("|') [^>]+sNews/ },
		'Plura':                 { html: /<iframe src="http:\/\/pluraserver\.com/ },
		'comScore':              { html: /<iframe[^>]* (id=("|')comscore("|')|scr=[^>]+comscore)/ },
		'Google Font API':       { html: /<link[^>]* href=("|')http:\/\/fonts\.googleapis\.com/ },
		'CO2Stats':              { html: /src=("|')http:\/\/www\.co2stats\.com\/propres\.php/ },
		'Woopra':                { html: /<script[^>]* src=("|')[^>]*static\.woopra\.com/i }
		},

	init: function()
	{
		if ( wappalyzer.isBookmarklet )
		{
			return;
		}

		// Preferences
		wappalyzer.prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('wappalyzer.');

		wappalyzer.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		wappalyzer.prefs.addObserver('', wappalyzer, false);

		wappalyzer.showAppNames   = wappalyzer.prefs.getIntPref( 'showAppNames');
		wappalyzer.autoDetect     = wappalyzer.prefs.getBoolPref('autoDetect');
		wappalyzer.enableTracking = wappalyzer.prefs.getBoolPref('enableTracking');
		wappalyzer.newInstall     = wappalyzer.prefs.getBoolPref('newInstall');

		// Open page after installation
		if ( wappalyzer.newInstall )
		{
			wappalyzer.prefs.setBoolPref('newInstall', false);

			gBrowser.addEventListener('load', wappalyzer.installSuccess, false);
		}

		// Listen for URL changes
		gBrowser.addProgressListener(wappalyzer.urlChange, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);

		var appContent = document.getElementById('appcontent');

		if ( appContent )
		{
			appContent.addEventListener('DOMContentLoaded', wappalyzer.onPageLoad, true);
		}
	},

	observe: function(subject, topic, data)
	{
		if ( topic != 'nsPref:changed' )
		{
			return;
		}

		switch(data)
		{
			case 'autoDetect':
				wappalyzer.autoDetect     = wappalyzer.prefs.getBoolPref('autoDetect');

				break;
			case 'enableTracking':
				wappalyzer.enableTracking = wappalyzer.prefs.getBoolPref('enableTracking');

				break;
			case 'showAppNames':
				wappalyzer.showAppNames   = wappalyzer.prefs.getIntPref('showAppNames');

				break;
		}
	},

	onPageLoad: function(event)
	{
		var doc = event.originalTarget;

		wappalyzer.analyzePage(doc, true, false);
	},

	onUrlChange: function(request)
	{
		var doc = gBrowser.selectedBrowser.contentDocument;

		doc.request = request;

		wappalyzer.analyzePage(doc, false, false);
	},

	urlChange:
	{
		QueryInterface: function(iid)
		{
			if ( iid.equals(Components.interfaces.nsIWebProgressListener)   ||
			     iid.equals(Components.interfaces.nsISupportsWeakReference) ||
			     iid.equals(Components.interfaces.nsISupports) )
			{
				return this;
			}

			throw Components.results.NS_NOINTERFACE;
		},

		onLocationChange: function(progress, request, url)
		{
			if ( !url )
			{
				wappalyzer.prevUrl = '';

				return;
			}

			if ( url.spec != wappalyzer.prevUrl )
			{
				wappalyzer.prevUrl = url.spec;

				wappalyzer.onUrlChange(request);
			}
		},

		onStateChange:    function(a, b, c, d)       {},
		onProgressChange: function(a, b, c, d, e, f) {},
		onStatusChange:   function(a, b, c, d)       {},
		onSecurityChange: function(a, b, c)          {}
	},

	analyzePage: function(doc, doCount, manualDetect)
	{
		wappalyzer.currentTab = false;

		if ( !wappalyzer.isBookmarklet )
		{
			if ( doc.location.href == gBrowser.selectedBrowser.contentDocument.location.href )
			{
				wappalyzer.currentTab = true;

				wappalyzer.clearDetectedApps();
			}
		}

		if ( wappalyzer.autoDetect || ( !wappalyzer.autoDetect && manualDetect ) )
		{
			// Scan URL, domain and response headers for patterns
			var html = doc.documentElement.innerHTML;

			if ( html.length > 50000 ) // Prevent large documents from slowing things down
			{
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			if ( html )
			{
				for ( var appName in wappalyzer.apps )
				{
					if ( typeof(wappalyzer.checkUnique[appName]) == 'undefined' ) // Don't scan for apps that have already been detected
					{
						// Scan HTML
						if ( typeof(wappalyzer.apps[appName].html) != 'undefined' )
						{
							var regex = wappalyzer.apps[appName].html;

							if ( regex.test(html) )
							{
								wappalyzer.showApp(appName, doc, doCount);
							}
						}

						// Scan URL
						if ( typeof(wappalyzer.apps[appName].url) != 'undefined' && typeof(doc.location.href) != 'undefined' )
						{
							var regex = wappalyzer.apps[appName].url;

							if ( regex.test(doc.location.href) )
							{
								wappalyzer.showApp(appName, doc, doCount);
							}
						}

						// Scan response header
						if ( typeof(wappalyzer.apps[appName].headers) != 'undefined' && typeof(doc.request) != 'undefined' )
						{
							for ( var header in wappalyzer.apps[appName].headers )
							{
								var regex = wappalyzer.apps[appName].headers[header];

								try
								{
									if ( regex.test(doc.request.nsIHttpChannel.getResponseHeader(header)) )
									{
										wappalyzer.showApp(appName, doc, doCount);
									}
								}
								catch(e)
								{
								}
							}
						}
					}
				}
			}

			html = ''; // Free memory
		}
	},

	showApp: function(detectedApp, doc, doCount)
	{
		if ( !wappalyzer.currentTab && !wappalyzer.isBookmarklet )
		{
			wappalyzer.report(detectedApp, doc.domain);

			return;
		}

		if ( detectedApp && typeof(wappalyzer.checkUnique[detectedApp]) == 'undefined' )
		{
			domain = doc.domain;

			if ( !wappalyzer.isBookmarklet )
			{
				// Hide Wappalyzer icon
				document.getElementById('wappalyzer-icon').style.display = 'none';

				// Show app icon and label
				var e = document.getElementById('wappalyzer-detected-apps');

				var child = document.createElement('image');

				child.setAttribute('src',   'chrome://wappalyzer/skin/app_icons/' + detectedApp + '.ico');
				child.setAttribute('class', 'wappalyzer-icon');

				if ( wappalyzer.showAppNames == 2 )
				{
					var panel = document.getElementById('wappalyzer-panel');

					var tooltiptext = panel.getAttribute('tooltiptext') + ( panel.getAttribute('tooltiptext') ? '\n' : '' ) + detectedApp;

					panel.setAttribute('tooltiptext', tooltiptext);
				}

				if ( wappalyzer.showAppNames == 3 )
				{
					child.setAttribute('onmouseover', 'wappalyzer.showLabels(true)');
					child.setAttribute('onmouseout',  'wappalyzer.showLabels(false)');
				}

				if ( wappalyzer.appsDetected )
				{
					child.setAttribute('style', 'margin-left: .5em');
				}

				e.appendChild(child);

				child = document.createElement('label');

				child.setAttribute('value', detectedApp);
				child.setAttribute('class', 'wappalyzer-app-name');

				if ( wappalyzer.showAppNames != 1 )
				{
					child.setAttribute('style', 'display: none;');
				}

				if ( wappalyzer.showAppNames == 3 )
				{
					child.setAttribute('onmouseover', 'wappalyzer.showLabels(true)');
					child.setAttribute('onmouseout',  'wappalyzer.showLabels(false)');
				}

				e.appendChild(child);
			}
			else
			{
				var e = document.getElementById('wappalyzer-bookmarklet-apps');

				e.innerHTML =
					( wappalyzer.appsDetected ? e.innerHTML : '' ) +
					'<a href="' + wappalyzer.homeUrl + 'stats/app/' + escape(wappalyzer.app[i]) + '" style="color: #332;">' +
					wappalyzer.app[i] +
					'</a><br/>'
					;
			}

			if ( doCount )
			{
				wappalyzer.report(detectedApp, domain);
			}

			if ( !wappalyzer.isBookmarklet )
			{
				// Enable application statistics menu item
				var e = document.getElementById('wappalyzer-app-stats');

				e.parentNode.setAttribute('disabled', false);

				var child = document.createElement('menuitem');

				child.setAttribute('label',     detectedApp);
				child.setAttribute('class',     'menuitem-iconic');
				child.setAttribute('type',      '');
				child.setAttribute('image',     'chrome://wappalyzer/skin/app_icons/' + detectedApp + '.ico');
				child.setAttribute('oncommand', 'wappalyzer.openTab(\'' + wappalyzer.homeUrl + 'stats/app/' + escape(detectedApp) + '\');');

				e.appendChild(child);
			}

			wappalyzer.appsDetected ++;

			wappalyzer.checkUnique[detectedApp] = true;
		}
	},

	report: function(detectedApp, domain)
	{
		if ( wappalyzer.enableTracking && wappalyzer.regexDomain.test(domain) )
		{
			if ( typeof(wappalyzer.history[domain]) == 'undefined' )
			{
				wappalyzer.history[domain] = [];
			}

			if ( typeof(wappalyzer.history[domain][detectedApp]) == 'undefined' )
			{
				wappalyzer.history[domain][detectedApp] = 0;
			}

			wappalyzer.history[domain][detectedApp] ++;

			wappalyzer.hitCount ++;

			if ( wappalyzer.hitCount > 100 )
			{
				wappalyzer.sendReport();
			}
		}
	},

	sendReport: function()
	// Anonymously send the name of the detected apps and domains to wappalyzer.com
	// You can turn this off in the options dialog
	// This is used to track the distibution of software, stats are publically available on the site
	{
		if ( wappalyzer.enableTracking && !wappalyzer.req )
		{
			var report = '';

			var i, j;

			if ( wappalyzer.history )
			{
				for ( i in wappalyzer.history )
				{
					report += '[' + i;

					for ( j in wappalyzer.history[i] )
					{
						report += '|' + j + ':' + wappalyzer.history[i][j];
					}

					report += ']';
				}
			}

			// Make POST request
			wappalyzer.req = new XMLHttpRequest();

			wappalyzer.req.open('POST', wappalyzer.homeUrl + 'report/', true);

			wappalyzer.req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

			wappalyzer.req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			wappalyzer.req.onreadystatechange = function(e)
			{
				if ( wappalyzer.req.readyState == 4 )
				{
					if ( wappalyzer.req.status == 200 )
					{
						// Reset
						report = '';

						wappalyzer.hitCount = 0;
						wappalyzer.history  = [];
					}

					wappalyzer.req.close();

					wappalyzer.req = false;
				}
			};

			wappalyzer.req.send('d=' + encodeURIComponent(report));
		}
	},

	clearDetectedApps: function()
	{
		wappalyzer.appsDetected = 0;
		wappalyzer.checkUnique  = [];

		// Show Wappalyzer icon
		document.getElementById('wappalyzer-icon').style.display = 'inline';

		// Clear app icons and labels
		e = document.getElementById('wappalyzer-detected-apps');

		while ( e.childNodes.length > 0 )
		{
			e.removeChild(e.childNodes.item(0));
		}

		// Clear tooltip
		var panel = document.getElementById('wappalyzer-panel');

		panel.setAttribute('tooltiptext', '');

		/* */
		// Disable and clear application statistics menu item
		e = document.getElementById('wappalyzer-app-stats');

		e.parentNode.setAttribute('disabled', true);

		while ( e.childNodes.length > 0 )
		{
			e.removeChild(e.childNodes.item(0));
		}
		/* */
	},

	showLabels: function(show)
	{
		e = document.getElementsByClassName('wappalyzer-app-name');

		for ( i = 0; i < e.length; i ++ )
		{
			e[i].style.display = show ? 'inline' : 'none';
		}
	},

	installSuccess: function()
	{
		gBrowser.removeEventListener('load', wappalyzer.installSuccess, false);

		wappalyzer.openTab(wappalyzer.homeUrl + 'install/success/');
	},

	openTab: function(url)
	{
		gBrowser.selectedTab = gBrowser.addTab(url);
	},

	bookmarklet: function()
	{
		if ( typeof(gBrowser) == 'undefined' )
		{
			wappalyzer.isBookmarklet = true;

			if ( !document.getElementById('wappalyzer-bookmarklet') )
			{
				var body = document.getElementsByTagName('body')[0];

				if ( body )
				{
					var container = document.createElement('div');

					container.innerHTML =
						'<div id="wappalyzer-bookmarklet" style="' +
						'	color: #332;' +
						'	font: 12px \'Trebuchet MS\';' +
						'	position: fixed;' +
						'	text-align: right;' +
						'	right: 2em;' +
						'	top: 2em;' +
						'	z-index: 9999999999;' +
						'	">' +
						'	<div id="wappalyzer-container" style="' +
						'		-moz-border-radius: 7px;' +
						'		-webkit-border-radius: 7px;' +
						'		background: #FAFAFA;' +
						'		border: 7px solid #332;' +
						'		margin-bottom: .3em;' +
						'		min-width: 15em;' +
						'		padding: 1em 2em;' +
						'		text-align: center;' +
						'		">' +
						'		<div style="' +
						'			border-bottom: 1px solid #332;' +
						'			font-size: 13px;' +
						'			padding-bottom: 1em;' +
						'			margin-bottom: 1em;' +
						'			"><strong>Wappalyzer</strong></div>' +
						'		<span id="wappalyzer-bookmarklet-apps"><em>No apps detected</em></span>' +
						'	</div>' +
						'	<span style="float: left;"><a href="http://wappalyzer.com" style="color: #332 !important;">home</a> | <a href="http://twitter.com/ElbertF" style="color: #332 !important;">follow me</a></span>' +
						'   <span style="float: right;">click to close</span>' +
						'</div>'
						;

					container.onclick = function() { body.removeChild(container); };

					body.appendChild(container);

					wappalyzer.analyzePage(document, false, false);
				}
			}
		}
	}
};

wappalyzer.bookmarklet();
