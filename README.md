# Wappalyzer [![Travis](https://travis-ci.org/aliasio/wappalyzer.svg?branch=master)](https://travis-ci.org/aliasio/wappalyzer/)

[Wappalyzer](https://www.wappalyzer.com) identifies technologies on websites.

## Documentation

Please read the [developer documentation](https://www.wappalyzer.com/docs).

## Quick start

```sh
git clone https://github.com/aliasio/wappalyzer
cd wappalyzer
yarn install
yarn link
```

## Usage

### Command line

```sh
node src/drivers/npm/cli.js https://example.com
```

### Chrome extension

* Go go `about:extensions`
* Enable 'Developer mode'
* Click 'Load unpacked'
* Select `src/drivers/webextension`

### Firefox extension

* Go go `about:debugging#/runtime/this-firefox`
* Click 'Load Temporary Add-on'
* Select `src/drivers/webextension/manifest.json`
