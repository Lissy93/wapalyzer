/** global: browser */
/** global: XMLSerializer */

if ( typeof browser !== 'undefined' && typeof document.body !== 'undefined' ) {
  try {
    sendMessage('init', {});

    // HTML
    var html = new XMLSerializer().serializeToString(document).split('\n');

    html = html
      .slice(0, 1000).concat(html.slice(html.length - 1000))
      .map(line => line.substring(0, 1000))
      .join('\n');

    // Scripts
    const scripts = Array.prototype.slice
      .apply(document.scripts)
      .filter(script => script.src)
      .map(script => script.src)
      .filter(script => script.indexOf('data:text/javascript;') !== 0);

    sendMessage('analyze', { html, scripts });

    // JavaScript variables
    const script = document.createElement('script');

    script.onload = () => {
      addEventListener('message', event => {
        if ( event.data.id !== 'js' ) {
          return;
        }

        document.body.removeChild(script);

        sendMessage('analyze', { js: event.data.js });
      }, true);

      sendMessage('get_js_patterns', {}, response => {
        if ( response ) {
          postMessage({
            id: 'patterns',
            patterns: response.patterns
          }, '*');
        }
      });
    };

    script.setAttribute('src', browser.extension.getURL('js/inject.js'));

    document.body.appendChild(script);
  } catch (e) {
    sendMessage('log', e);
  }
}

function sendMessage(id, subject, callback) {
  ( chrome || browser ).runtime.sendMessage({
    id,
    subject,
    source: 'content.js'
  }, callback || ( () => {} ));
}
