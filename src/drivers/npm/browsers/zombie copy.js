const Zombie = require('zombie');

class Browser {
  constructor(options) {
    this.options = options;

    this.browser = new Zombie({
      proxy: options.proxy,
      silent: true,
      strictSSL: false,
      userAgent: options.userAgent,
      waitDuration: options.maxWait,
    });

    this.statusCode = null;
    this.contentType = null;
    this.headers = null;
    this.statusCode = null;
    this.contentType = null;
    this.html = null;
    this.scripts = null;
    this.cookies = null;

    this.window = this.browser.window;
    this.document = this.browser.document;

    this.browser.on('authenticate', (auth) => {
      auth.username = this.options.username;
      auth.password = this.options.password;
    });
  }

  visit(url) {
    return new Promise((resolve) => {
      this.browser.visit(url, () => {
        const resource = this.browser.resources.length
          ? this.browser.resources.filter(_resource => _resource.response).shift() : null;

        this.headers = this.getHeaders();
        this.statusCode = resource ? resource.response.status : 0;
        this.contentType = this.headers['content-type'] ? this.headers['content-type'].shift() : null;
        this.html = this.getHtml();
        this.scripts = this.getScripts();
        this.cookies = this.getCookies();

        resolve();
      });
    });
  }

  getHeaders() {
    const headers = {};

    const resource = this.browser.resources.length
      ? this.browser.resources.filter(_resource => _resource.response).shift() : null;

    if (resource) {
      // eslint-disable-next-line no-underscore-dangle
      resource.response.headers._headers.forEach((header) => {
        if (!headers[header[0]]) {
          headers[header[0]] = [];
        }

        headers[header[0]].push(header[1]);
      });
    }

    return headers;
  }

  getHtml() {
    let html = '';

    if (this.browser.document && this.browser.document.documentElement) {
      try {
        html = this.browser.html();
      } catch (error) {
        this.log(error.message, 'error');
      }
    }

    return html;
  }

  getScripts() {
    if (!this.browser.document || !this.browser.document.scripts) {
      return [];
    }

    const scripts = Array.prototype.slice
      .apply(this.browser.document.scripts)
      .filter(script => script.src)
      .map(script => script.src);

    return scripts;
  }

  getCookies() {
    const cookies = [];

    if (this.browser.cookies) {
      this.browser.cookies.forEach(cookie => cookies.push({
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
      }));
    }

    return cookies;
  }
}

export default Browser;
