const Driver = require('./driver');

class Wappalyzer {
  constructor(pageUrl, options) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const Browser = require(`./browsers/${options.browser || 'zombie'}`);

    return new Driver(Browser, pageUrl, options);
  }
}

module.exports = Wappalyzer;
