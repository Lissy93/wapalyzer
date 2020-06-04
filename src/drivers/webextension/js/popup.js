'use strict'
/* eslint-env browser */
/* globals chrome, Utils */

const { agent, getOption } = Utils

const Popup = {
  port: chrome.runtime.connect({ name: 'popup.js' }),

  async init() {
    Popup.templates = Array.from(
      document.querySelectorAll('[data-template]')
    ).reduce((templates, template) => {
      templates[template.dataset.template] = template

      return templates
    }, {})

    Popup.log(agent)

    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    if (termsAccepted) {
      document.querySelector('.terms').style.display = 'none'

      Popup.driver('getDetections')
    } else {
      document.querySelector('.detections').style.display = 'none'

      Popup.i18n()
    }
  },

  driver(func, ...args) {
    Popup.port.postMessage({ func, args })
  },

  log(message) {
    Popup.driver('log', message, 'popup.js')
  },

  i18n() {
    Array.from(document.querySelectorAll('[data-i18n]')).forEach(
      (node) => (node.innerHTML = chrome.i18n.getMessage(node.dataset.i18n))
    )
  },

  categorise(technologies) {
    return Object.values(
      technologies.reduce((categories, technology) => {
        technology.categories.forEach((category) => {
          categories[category.id] = categories[category.id] || {
            ...category,
            technologies: []
          }

          categories[category.id].technologies.push(technology)
        })

        return categories
      }, {})
    )
  },

  onGetDetections(detections) {
    Popup.categorise(detections).forEach(
      ({ name, slug: categorySlug, technologies }) => {
        const categoryNode = Popup.templates.category.cloneNode(true)

        const link = categoryNode.querySelector('.category__link')

        link.href = `https://www.wappalyzer.com/technologie/${categorySlug}`
        link.textContent = name

        technologies.forEach(({ name, slug, icon, website }) => {
          Popup.log(name)
          const technologyNode = Popup.templates.technology.cloneNode(true)

          const link = technologyNode.querySelector('.technology__link')

          link.href = `https://www.wappalyzer.com/technologie/${categorySlug}/${slug}`
          link.textContent = name

          categoryNode
            .querySelector('.technologies')
            .appendChild(technologyNode)
        })

        document.querySelector('.detections').appendChild(categoryNode)
      }
    )

    Popup.i18n()
  }
}

Popup.port.onMessage.addListener(({ func, args }) => {
  const onFunc = `on${func.charAt(0).toUpperCase() + func.slice(1)}`

  if (Popup[onFunc]) {
    Popup[onFunc](args)
  }
})

if (/complete|interactive|loaded/.test(document.readyState)) {
  Popup.init()
} else {
  document.addEventListener('DOMContentLoaded', Popup.init)
}
