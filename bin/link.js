const fs = require('fs')

const link = (src, dest) => {
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }

  fs.linkSync(src, dest)
}

// WebExtension
link('./src/technologies.json', './src/drivers/webextension/technologies.json')
link('./src/wappalyzer.js', './src/drivers/webextension/js/wappalyzer.js')

// NPM
link('./src/technologies.json', './src/drivers/npm/technologies.json')
link('./src/wappalyzer.js', './src/drivers/npm/wappalyzer.js')
