const Driver = require('./driver');
const ZombieBrowser = require('./browsers/zombie');

class Wappalyzer {
  constructor(pageUrl, options) {
    this.browser = ZombieBrowser;

    return new Driver(this.browser, pageUrl, options);
  }
}

Wappalyzer.browsers = {
  zombie: ZombieBrowser,
};

module.exports = Wappalyzer;
