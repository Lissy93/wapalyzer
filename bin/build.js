const fs = require('fs')
const Zip = require('adm-zip')

const currentVersion = JSON.parse(fs.readFileSync('./src/package.json')).version

const version = process.argv[2]

if (!version) {
  // eslint-disable-next-line no-console
  console.error(
    `No version number specified. Current version is ${currentVersion}.`
  )

  process.exit(1)
}

;[
  './src/package.json',
  './src/drivers/npm/package.json',
  './src/drivers/webextension/manifest-v2.json',
  './src/drivers/webextension/manifest-v3.json',
].forEach((file) => {
  const json = JSON.parse(fs.readFileSync(file))

  json.version = version

  fs.writeFileSync(file, JSON.stringify(json, null, 2))
})

fs.copyFileSync(
  `./src/drivers/webextension/manifest.json`,
  './src/drivers/webextension/manifest.bak.json'
)

fs.copyFileSync(
  `./src/drivers/webextension/manifest-v2.json`,
  './src/drivers/webextension/manifest.json'
)

let zip = new Zip()

zip.addLocalFolder('./src/drivers/webextension', '')

zip.writeZip('./build/webextension-v2.zip')

fs.copyFileSync(
  `./src/drivers/webextension/manifest-v3.json`,
  './src/drivers/webextension/manifest.json'
)

zip = new Zip()

zip.addLocalFolder('./src/drivers/webextension', '')

zip.writeZip('./build/webextension-v3.zip')

fs.copyFileSync(
  `./src/drivers/webextension/manifest.bak.json`,
  './src/drivers/webextension/manifest.json'
)
