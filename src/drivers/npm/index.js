#!/usr/bin/env node
'use strict';

const Wappalyzer = require('./driver');

const args = process.argv.slice(2);

const url = args.shift() || '';

if ( !url ) {
  process.stderr.write('No URL specified\n');

  process.exit(1);
}

let options = {};
let arg;

while ( arg = args.shift() ) {
  let matches = /--([^=]+)=(.+)/.exec(arg);

  if ( matches ) {
    let key = matches[1].replace(/-\w/g, matches => matches[1].toUpperCase());
    let value = matches[2];

    options[key] = value;
  }
}

const wappalyzer = new Wappalyzer(url, options);

wappalyzer.analyze()
  .then(json => {
    process.stdout.write(JSON.stringify(json) + '\n')

    process.exit(0);
  })
  .catch(error => {
    process.stderr.write(error + '\n')

    process.exit(1);
  });
