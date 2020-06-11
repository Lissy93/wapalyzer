#!/usr/bin/env node

const fs = require('fs')
const Wappalyzer = require('./wappalyzer')

// See https://www.wappalyzer.com/docs/dev/specification
const { apps: technologies, categories } = JSON.parse(
  fs.readFileSync('./apps.json')
)

Wappalyzer.setTechnologies(technologies)
Wappalyzer.setCategories(categories)

const detections = Wappalyzer.analyze({
  url: 'https://example.github.io/',
  meta: { generator: ['WordPress'] },
  headers: { server: ['Nginx'] },
  scripts: ['jquery-3.0.0.js'],
  cookies: { awselb: [''] },
  html: '<div ng-app="">'
})

const results = Wappalyzer.resolve(detections)

console.log(results)
