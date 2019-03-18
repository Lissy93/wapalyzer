/** global: browser */
/** global: XMLSerializer */

/* global browser */
/* eslint-env browser */

const port = browser.runtime.connect({
  name: 'content.js',
});

if (typeof browser !== 'undefined' && typeof document.body !== 'undefined') {
  try {
    port.postMessage({ id: 'init' });

    // HTML
    let html = new XMLSerializer().serializeToString(document);

    const chunks = [];
    const maxCols = 2000;
    const maxRows = 3000;
    const rows = html.length / maxCols;

    let i;

    for (i = 0; i < rows; i += 1) {
      if (i < maxRows / 2 || i > rows - maxRows / 2) {
        chunks.push(html.slice(i * maxCols, (i + 1) * maxCols));
      }
    }

    html = chunks.join('\n');

    // Scripts
    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(script => script.src)
      .map(script => script.src)
      .filter(script => script.indexOf('data:text/javascript;') !== 0);

    port.postMessage({ id: 'analyze', subject: { html, scripts } });

    // JavaScript variables
    const script = document.createElement('script');

    script.onload = () => {
      const onMessage = (event) => {
        if (event.data.id !== 'js') {
          return;
        }

        window.removeEventListener('message', onMessage);

        port.postMessage({ id: 'analyze', subject: { js: event.data.js } });

        script.remove();
      };

      window.addEventListener('message', onMessage);

      port.postMessage({ id: 'get_js_patterns' });
    };

    script.setAttribute('src', browser.extension.getURL('js/inject.js'));

    document.body.appendChild(script);
  } catch (error) {
    port.postMessage({ id: 'log', subject: error });
  }
}

port.onMessage.addListener((message) => {
  switch (message.id) {
    case 'get_js_patterns':
      postMessage({
        id: 'patterns',
        patterns: message.response.patterns,
      }, window.location.href);

      break;
    default:
      // Do nothing
  }
});

// https://stackoverflow.com/a/44774834
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript#Return_value
undefined; // eslint-disable-line no-unused-expressions
