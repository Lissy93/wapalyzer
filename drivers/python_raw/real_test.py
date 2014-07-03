#! /usr/bin/python
# -*- coding: utf-8 -*-
from wappalyzer import Wappalyzer

TESTS = [
    {
        'url': 'http://www.hardgraft.com',
        'apps': ['jQuery', 'Shopify', 'Nginx']
    },
    {
        'url': 'http://its.bplaced.net',
        'apps': ['WordPress', 'jQuery', 'Apache']
    },
    {
        'url': 'http://www.bodybuilding.com/',
        'apps': ['jQuery', 'Optimizely', 'SiteCatalyst', 'Apache Tomcat']
    },
    {
        'url': 'http://guidedhelp21.weebly.com/',
        'apps': ['Weebly', 'Apache', 'Quantcast', 'Google Analytics', 'jQuery']
    },
    {
        'url': 'http://www.bancadelparque.com/',
        'apps': ['Wix', 'Twitter Bootstrap']
    },
    {
        'url': 'http://joomla.ru/',
        'apps': ['Joomla', 'jQuery', 'MooTools', 'Yandex.Metrika', 'LiteSpeed']
    },
    {
        'url': 'http://demoshop21.e-stile.ru/',
        'apps': ['SiteEdit', 'PHP']
    },
    {
        'url': 'http://umbraco.com',
        'apps': ['Umbraco', 'IIS', 'Microsoft ASP.NET']
    },
    {
        'url': 'http://johnsciacca.webs.com/',
        'apps': ['Webs', 'RequireJS', 'Site Meter', 'Modernizr']
    },
    {
        'url': 'http://www.1c-bitrix.ru/',
        'apps': ['1C-Bitrix', 'Yandex.Metrika']
    },
    {
        'url': 'http://amirocms.com',
        'apps': ['Amiro.CMS']
    },
    {
        'url': 'http://dle-news.ru',
        'apps': ['DataLife Engine', 'CloudFlare']
    },
    {
        'url': 'http://dotnetnuke.com',
        'apps': ['DotNetNuke', 'Microsoft ASP.NET']
    },
    {
        'url': 'http://www.schooldude.com',
        'apps': ['DotNetNuke', 'Microsoft ASP.NET']
    },
    {
        'url': 'http://www.sportsdirect.com/',
        'apps': ['DotNetNuke', 'Microsoft ASP.NET']
    },
    {
        'url': 'http://drupal.org',
        'apps': ['Drupal', 'Varnish']
    },
    {
        'url': 'http://www.komodocms.com/',
        'apps': ['Komodo CMS']
    },
    {
        'url': 'http://livestreetcms.com/',
        'apps': ['LiveStreet CMS']
    },
    {
        'url': 'http://modxcms.com/',
        'apps': ['MODx']
    },
    {
        'url': 'http://modx.ru/',
        'apps': ['MODx']
    },
    {
        'url': 'http://revo.modx.ru/',
        'apps': ['MODx']
    },
    {
        'url': 'http://www.punchbrand.com',
        'apps': ['CS Cart']
    },
    {
        'url': 'http://demo.cs-cart.com/',
        'apps': ['CS Cart']
    },
    {
        'url': 'https://livedemo.installatron.com/1404307206magento/',
        'apps': ['Magento']
    },
    {
        'url': 'http://livedemo.installatron.com/1404300689prestashop/',
        'apps': ['Prestashop']
    },
    {
        'url': 'http://demo.opencart.com/',
        'apps': ['OpenCart']
    },
    {
        'url': 'https://livedemo.installatron.com/1404307206oscommerce/',
        'apps': ['osCommerce']
    },
    {
        'url': 'http://www.ubercartdemo.com/',
        'apps': ['Ubercart']
    },
    {
        'url': 'http://demostore.x-cart.com/',
        'apps': ['X-Cart']
    },
    {
        'url': 'https://livedemo.installatron.com/1404307206zencart/',
        'apps': ['Zen Cart']
    },
    {
        'url': 'http://oreonfray83.wordpress.com',
        'apps': ['WordPress.Com']
    },
    {
        'url': 'http://www.try-phpbb.com/30x/',
        'apps': ['phpBB']
    },
]


def test():
    wappalyzer = Wappalyzer(datafile_path='../../share/apps.json')

    for site in TESTS:
        print 'testing %s ...' % site['url']
        result = wappalyzer.analyze(site['url'])
        for app in site['apps']:
            found = result.pop(app, None)
            if found:
                print '\t%s\t- ok\tconfidence=%d' % (app, found.get_confidence())
            else:
                print '\t%s\t- NOT FOUND' % (app)
                return
        if result:
            print '\tUNEXPECTED APPS:'
            for app_name, app in result.iteritems():
                print '\t\t%s\t- ok\tconfidence=%d' % (app_name, app.get_confidence())

if __name__ == '__main__':
    test()