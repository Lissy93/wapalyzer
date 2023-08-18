const fs = require('fs')

const version = process.argv[2]

if (!version) {
  // eslint-disable-next-line no-console
  console.error(`No manifest version specified.`)

  process.exit(1)
}

fs.copyFileSync(`./src/manifest-${version}.json`, './src/manifest.json')
