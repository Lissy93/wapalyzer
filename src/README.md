# Wappalyzer core

[Wappalyzer](https://www.wappalyzer.com/) identifies technologies on websites.

## Installation

```shell
$ npm i wappalyzer-core
```

## Usage

```javascript
#!/usr/bin/env node

const fs = require('fs')
const Wappalyzer = require('./wappalyzer')

// See https://github.com/wappalyzer/wappalyzer/blob/master/README.md#specification
const categories = JSON.parse(
  fs.readFileSync(path.resolve(`./categories.json`))
)

let technologies = {}

for (const index of Array(27).keys()) {
  const character = index ? String.fromCharCode(index + 96) : '_'

  technologies = {
    ...technologies,
    ...JSON.parse(
      fs.readFileSync(path.resolve(`./technologies/${character}.json`))
    ),
  }
}

Wappalyzer.setTechnologies(technologies)
Wappalyzer.setCategories(categories)

Wappalyzer.analyze({
  url: 'https://example.github.io/',
  meta: { generator: ['WordPress'] },
  headers: { server: ['Nginx'] },
  scriptSrc: ['jquery-3.0.0.js'],
  cookies: { awselb: [''] },
  html: '<div ng-app="">',
}).then((detections) => {
  const results = Wappalyzer.resolve(detections)

  console.log(results)
})
```

Here's a shell script to download all of the necessary files referenced in the above example:

```shell
http --follow https://raw.githubusercontent.com/wappalyzer/wappalyzer/master/src/categories.json > categories.json
http --follow https://github.com/wappalyzer/wappalyzer/archive/refs/heads/master.tar.gz | tar -xz --strip-components=2 'wappalyzer-master/src/technologies'
```
