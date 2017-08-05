/** global: chrome */
/** global: browser */

var func = tabs => {
  ( chrome || browser ).runtime.sendMessage({
    id: 'get_apps',
    tab: tabs[0],
    source: 'popup.js'
  }, response => {
    replaceDomWhenReady(appsToDomTemplate(response));
  });
};

try {
  // Chrome, Firefox
  browser.tabs.query({ active: true, currentWindow: true })
    .then(func)
    .catch(console.error);
} catch ( e ) {
  // Edge
  browser.tabs.query({ active: true, currentWindow: true }, func);
}

function replaceDomWhenReady(dom) {
  if ( /complete|interactive|loaded/.test(document.readyState) ) {
    replaceDom(dom);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      replaceDom(dom);
    });
  }
}

function replaceDom(domTemplate) {
  var body = document.body;

  while ( body.firstChild ) {
    body.removeChild(body.firstChild);
  }

  body.appendChild(jsonToDOM(domTemplate, document, {}));

  var nodes = document.querySelectorAll('[data-i18n]');

  for ( let ms = 200; ms < 500; ms += 50 ) {
    setTimeout(() => {
      let div = document.createElement('div');

      div.style.display = 'none';

      body.appendChild(div);
    }, ms);
  };

  Array.prototype.forEach.call(nodes, node => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });
}

function appsToDomTemplate(response) {
  var
    appName, confidence, version, categories,
    template = [];

  if ( response.tabCache && Object.keys(response.tabCache.detected).length > 0 ) {
    for ( appName in response.tabCache.detected ) {
      confidence = response.tabCache.detected[appName].confidenceTotal;
      version    = response.tabCache.detected[appName].version;
      categories = [];

      response.apps[appName].cats.forEach(cat => {
        categories.push(
          [
            'a', {
              target: '_blank',
              href: 'https://wappalyzer.com/categories/' + slugify(response.categories[cat].name)
            }, [
              'span', {
                class: 'category'
              }, [
                'span', {
                  class: 'name'
                },
                browser.i18n.getMessage('categoryName' + cat)
              ]
            ]
          ]
        );
      });

      template.push(
        [
          'div', {
            class: 'detected-app'
          }, [
            'a', {
              target: '_blank',
              href: 'https://wappalyzer.com/applications/' + slugify(appName)
            }, [
              'img', {
                src: '../images/icons/' + ( response.apps[appName].icon || 'default.svg' )
              }
            ], [
              'span', {
                class: 'label'
              }, [
                'span', {
                  class: 'name'
                },
                appName
              ],
              ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' )
            ]
          ],
          categories
        ]
      );
    }
  } else {
    template = [
      'div', {
        class: 'empty'
      },
      browser.i18n.getMessage('noAppsDetected')
    ];
  }

  return template;
}

function slugify(string) {
  return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
}
