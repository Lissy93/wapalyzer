#!/bin/sh

ln -f share/images/icons/*       drivers/firefox/skin/images/icons
ln -f share/js/lib/jquery.min.js drivers/firefox/content/js/lib
ln -f share/js/apps.js           drivers/firefox/content/js/
ln -f share/js/wappalyzer.js     drivers/firefox/content/js/

ln -f share/images/icons/*       drivers/chrome/images/icons
ln -f share/js/lib/jquery.min.js drivers/chrome/js/lib
ln -f share/js/apps.js           drivers/chrome/js/
ln -f share/js/wappalyzer.js     drivers/chrome/js/

ln -f share/images/icons/*       drivers/bookmarklet/images/icons
ln -f share/js/lib/jquery.min.js drivers/bookmarklet/js/lib
ln -f share/js/apps.js           drivers/bookmarklet/js/
ln -f share/js/wappalyzer.js     drivers/bookmarklet/js/

ln -f share/images/icons/*       drivers/html/images/icons
ln -f share/js/lib/jquery.min.js drivers/html/js/lib
ln -f share/js/apps.js           drivers/html/js/
ln -f share/js/wappalyzer.js     drivers/html/js/

ln -f share/js/apps.js           drivers/php/js/
ln -f share/js/wappalyzer.js     drivers/php/js/

