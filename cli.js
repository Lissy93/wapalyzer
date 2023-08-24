#!/usr/bin/env node

const Wappalyzer = require('./driver');

const args = process.argv.slice(2);

const options = {};

let url;
let arg;

const aliases = {
  a: 'userAgent',
  b: 'browser',
  c: 'chunkSize',
  d: 'debug',
  t: 'delay',
  h: 'help',
  D: 'maxDepth',
  m: 'maxUrls',
  p: 'password',
  P: 'pretty',
  r: 'recursive',
  u: 'username',
  w: 'maxWait',
};

while (true) { // eslint-disable-line no-constant-condition
  arg = args.shift();

  if (!arg) {
    break;
  }

  const matches = /^-?-([^=]+)(?:=(.+)?)?/.exec(arg);

  if (matches) {
    const key = aliases[matches[1]] || matches[1].replace(/-\w/g, _matches => _matches[1].toUpperCase());
    // eslint-disable-next-line no-nested-ternary
    const value = matches[2] ? matches[2] : args[0] && !args[0].match(/^-/) ? args.shift() : true;

    options[key] = value;
  } else {
    url = arg;
  }
}

if (!url || options.help) {
  process.stdout.write(`Usage:
  wappalyzer <url> [options]
Examples:
  wappalyzer https://www.example.com
  node cli.js https://www.example.com -b puppeteer -r -D 3 -m 50
  docker wappalyzer/cli https://www.example.com --pretty
Options:
  -b, --browser=...        Specify which headless browser to use (zombie or puppeteer)
  -c, --chunk-size=...     Process links in chunks
  -d, --debug              Output debug messages
  -t, --delay=ms           Wait for ms milliseconds between requests
  -h, --help               This text
  --html-max-cols=...      Limit the number of HTML characters per line processed
  --html-max-rows=...      Limit the number of HTML lines processed
  -D, --max-depth=...      Don't analyse pages more than num levels deep
  -m, --max-urls=...       Exit when num URLs have been analysed
  -w, --max-wait=...       Wait no more than ms milliseconds for page resources to load
  -p, --password=...       Password to be used for basic HTTP authentication (zombie only)
  -P, --pretty             Pretty-print JSON output
  --proxy=...              Proxy URL, e.g. 'http://user:pass@proxy:8080' (zombie only)
  -r, --recursive          Follow links on pages (crawler)
  -a, --user-agent=...     Set the user agent string
  -u, --username=...       Username to be used for basic HTTP authentication (zombie only)
`);

  process.exit(1);
}

// eslint-disable-next-line import/no-dynamic-require
const Browser = require(`./browsers/${options.browser || 'zombie'}`);

const wappalyzer = new Wappalyzer(Browser, url, options);

wappalyzer.analyze()
  .then((json) => {
    process.stdout.write(`${JSON.stringify(json, null, options.pretty ? 2 : null)}\n`);

    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error}\n`);

    process.exit(1);
  });
