const fs = require('fs')

const link = (src, dest) => {
  if (fs.statSync(dest).isFile()) {
    fs.unlinkSync(dest)
  }

  fs.linkSync(src, dest)
}

// WebExtension
link('./src/apps.json', './src/drivers/webextension/apps.json')
link('./src/wappalyzer.js', './src/drivers/webextension/js/wappalyzer.js')

// NPM
link('./src/apps.json', './src/drivers/npm/apps.json')
link('./src/wappalyzer.js', './src/drivers/npm/wappalyzer.js')
