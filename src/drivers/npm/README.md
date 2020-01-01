# Wappalyzer

[Wappalyzer](https://www.wappalyzer.com/) is a
[cross-platform](https://github.com/AliasIO/Wappalyzer/wiki/Drivers) utility that uncovers the
technologies used on websites. It detects
[content management systems](https://www.wappalyzer.com/categories/cms),
[eCommerce platforms](https://www.wappalyzer.com/categories/ecommerce),
[web servers](https://www.wappalyzer.com/categories/web-servers),
[JavaScript frameworks](https://www.wappalyzer.com/categories/javascript-frameworks),
[analytics tools](https://www.wappalyzer.com/categories/analytics) and
[many more](https://www.wappalyzer.com/applications).


## Installation

```shell
$ npm i -g wappalyzer      # Globally
$ npm i wappalyzer --save  # As a dependency
```


## Run from the command line

```
wappalyzer [url] [options]
```

### Options

```
--browser=str        Specify which headless browser to use (zombie or puppeteer)
--password=str       Password to be used for basic HTTP authentication
--proxy=str          Proxy URL, e.g. 'http://user:pass@proxy:8080'
--username=str       Username to be used for basic HTTP authentication
--chunk-size=num     Process links in chunks.
--debug              Output debug messages.
--delay=ms           Wait for ms milliseconds between requests.
--html-max-cols=num  Limit the number of HTML characters per line processed.
--html-max-rows=num  Limit the number of HTML lines processed.
--max-depth=num      Don't analyse pages more than num levels deep.
--max-urls=num       Exit when num URLs have been analysed.
--max-wait=ms        Wait no more than ms milliseconds for page resources to load.
--pretty             Pretty-print JSON output
--recursive          Follow links on pages (crawler).
--user-agent=str     Set the user agent string.
```


## Run from a script

```javascript
const Wappalyzer = require('wappalyzer');

const url = 'https://www.wappalyzer.com';

const options = {
  // browser: 'puppeteer',
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

const wappalyzer = new Wappalyzer(url, options);

// Optional: capture log output
// wappalyzer.on('log', params => {
//   const { message, source, type } = params;
// });

// Optional: do something on page visit
// wappalyzer.on('visit', params => {
//   const { browser, pageUrl } = params;
// });

wappalyzer.analyze()
  .then((json) => {
    process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);

    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error}\n`);

    process.exit(1);
  });
```
