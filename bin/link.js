const fs = require('fs')

const link = (src, dest) => {
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }

  fs.linkSync(src, dest)
}

link('./src/wappalyzer.js', './src/drivers/webextension/js/wappalyzer.js')
link('./src/wappalyzer.js', './src/drivers/npm/wappalyzer.js')

link('./src/categories.json', './src/drivers/webextension/categories.json')
link('./src/categories.json', './src/drivers/npm/categories.json')

for (const index of Array(27).keys()) {
  const character = index ? String.fromCharCode(index + 96) : '_'

  link(
    `./src/technologies/${character}.json`,
    `./src/drivers/webextension/technologies/${character}.json`
  )
  link(
    `./src/technologies/${character}.json`,
    `./src/drivers/npm/technologies/${character}.json`
  )
}
