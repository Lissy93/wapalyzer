#!/usr/bin/env node

const Wappalyzer = require('./driver');

const args = process.argv.slice(2);

const options = {};

let url;
let arg;

while (true) { // eslint-disable-line no-constant-condition
  arg = args.shift();

  if (!arg) {
    break;
  }

  const matches = /--([^=]+)(?:=(.+))?/.exec(arg);

  if (matches) {
    const key = matches[1].replace(/-\w/g, _matches => _matches[1].toUpperCase());
    const value = matches[2] || true;

    options[key] = value;
  } else {
    url = arg;
  }
}

if (!url) {
  process.stderr.write('No URL specified\n');

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
