const fs = require('fs')

// WebExtension
fs.unlinkSync('./src/drivers/webextension/apps.json')
fs.linkSync('./src/apps.json', './src/drivers/webextension/apps.json')

fs.unlinkSync('./src/drivers/webextension/js/wappalyzer.js')
fs.linkSync(
  './src/wappalyzer.js',
  './src/drivers/webextension/js/wappalyzer.js'
)

// NPM
fs.unlinkSync('./src/drivers/npm/apps.json')
fs.linkSync('./src/apps.json', './src/drivers/npm/apps.json')

fs.unlinkSync('./src/drivers/npm/wappalyzer.js')
fs.linkSync('./src/wappalyzer.js', './src/drivers/npm/wappalyzer.js')
