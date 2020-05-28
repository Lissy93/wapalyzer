# Wappalyzer

[Wappalyzer](https://www.wappalyzer.com/) is a
[cross-platform](https://www.wappalyzer.com/nodejs) utility that uncovers the
technologies used on websites. It detects
[content management systems](https://www.wappalyzer.com/technologies/cms), [ecommerce platforms](https://www.wappalyzer.com/technologies/ecommerce), [web servers](https://www.wappalyzer.com/technologies/web-servers), [JavaScript frameworks](https://www.wappalyzer.com/technologies/javascript-frameworks),
[analytics tools](https://www.wappalyzer.com/technologies/analytics) and
[many more](https://www.wappalyzer.com/technologies).


## Installation

```shell
$ npm i -g wappalyzer      # Globally
$ npm i wappalyzer --save  # As a dependency
```

To use Puppeteer (headless Chrome browser), you must install the NPM package manually:

```shell
$ npm i puppeteer@^2.0.0
```


## Run from the command line

```
wappalyzer <url> [options]
```

### Options

```
-b, --batch-size=...     Process links in batches
-d, --debug              Output debug messages
-t, --delay=ms           Wait for ms milliseconds between requests
-h, --help               This text
--html-max-cols=...      Limit the number of HTML characters per line processed
--html-max-rows=...      Limit the number of HTML lines processed
-D, --max-depth=...      Don't analyse pages more than num levels deep
-m, --max-urls=...       Exit when num URLs have been analysed
-w, --max-wait=...       Wait no more than ms milliseconds for page resources to load
-P, --pretty             Pretty-print JSON output
-r, --recursive          Follow links on pages (crawler)
-a, --user-agent=...     Set the user agent string
```


## Run from a script

```javascript
const Wappalyzer = require('wappalyzer');

const url = 'https://www.wappalyzer.com';

const options = {
  debug: false,
  delay: 500,
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

;(async function() {
  const wappalyzer = await new Wappalyzer(options)

  try {
    await wappalyzer.init()

    const site = await wappalyzer.open(url)

    site.on('error', (error) => {
      process.stderr.write(`error: ${error}\n`)
    })

    const results = await site.analyze()

    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)

    await wappalyzer.destroy()

    process.exit(0)
  } catch (error) {
    process.stderr.write(error.toString())

    await wappalyzer.destroy()

    process.exit(1)
  }
})()
