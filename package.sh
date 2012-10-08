#!/bin/sh

path=`pwd`

./links.sh

cd $path/drivers/chrome  && zip -ro $path/wappalyzer-chrome.zip  .
cd $path/drivers/firefox && zip -ro $path/wappalyzer-firefox.xpi .
