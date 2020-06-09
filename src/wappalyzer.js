'use strict'

const Wappalyzer = {
  technologies: [],
  categories: [],

  slugify(string) {
    return string
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/(?:^-|-$)/, '')
  },

  getTechnology(name) {
    return Wappalyzer.technologies.find(({ name: _name }) => name === _name)
  },

  getCategory(id) {
    return Wappalyzer.categories.find(({ id: _id }) => id === _id)
  },

  resolve(detections = []) {
    const resolved = detections.reduce((resolved, { technology }) => {
      if (
        resolved.findIndex(
          ({ technology: { name } }) => name === technology.name
        ) === -1
      ) {
        let version = ''
        let confidence = 0

        detections.forEach(({ technology: { name }, pattern, match }) => {
          if (name === technology.name) {
            const versionValue = Wappalyzer.resolveVersion(pattern, match)

            confidence = Math.min(100, confidence + pattern.confidence)
            version =
              versionValue.length > version.length && versionValue.length <= 10
                ? versionValue
                : version
          }
        })

        resolved.push({ technology, confidence, version })
      }

      return resolved
    }, [])

    Wappalyzer.resolveExcludes(resolved)
    Wappalyzer.resolveImplies(resolved)

    return resolved.map(
      ({
        technology: { name, slug, categories, icon, website },
        confidence,
        version
      }) => ({
        name,
        slug,
        categories: categories.map((id) => Wappalyzer.getCategory(id)),
        confidence,
        version,
        icon,
        website
      })
    )
  },

  resolveVersion({ version, regex }, match) {
    let resolved = version

    if (version) {
      const matches = regex.exec(match)

      if (matches) {
        matches.forEach((match, index) => {
          // Parse ternary operator
          const ternary = new RegExp(`\\\\${index}\\?([^:]+):(.*)$`).exec(
            version
          )

          if (ternary && ternary.length === 3) {
            resolved = version.replace(
              ternary[0],
              match ? ternary[1] : ternary[2]
            )
          }

          // Replace back references
          resolved = resolved
            .trim()
            .replace(new RegExp(`\\\\${index}`, 'g'), match || '')
        })
      }
    }

    return resolved
  },

  resolveExcludes(resolved) {
    resolved.forEach(({ technology }) => {
      technology.excludes.forEach((name) => {
        const excluded = Wappalyzer.getTechnology(name)

        if (!excluded) {
          throw new Error(`Excluded technology does not exist: ${name}`)
        }

        const index = resolved.findIndex(({ name }) => name === excluded.name)

        if (index === -1) {
          resolved.splice(index, 1)
        }
      })
    })
  },

  resolveImplies(resolved) {
    let done = false

    while (resolved.length && !done) {
      resolved.forEach(({ technology, confidence }) => {
        done = true

        technology.implies.forEach((name) => {
          const implied = Wappalyzer.getTechnology(name)

          if (!implied) {
            throw new Error(`Implied technology does not exist: ${name}`)
          }

          if (
            resolved.findIndex(
              ({ technology: { name } }) => name === implied.name
            ) === -1
          ) {
            resolved.push({ technology: implied, confidence, version: '' })

            done = false
          }
        })
      })
    }
  },

  async analyze(url, { html, meta, headers, cookies, scripts }) {
    const oo = Wappalyzer.analyzeOneToOne
    const om = Wappalyzer.analyzeOneToMany
    const mm = Wappalyzer.analyzeManyToMany

    const flatten = (array) => Array.prototype.concat.apply([], array)

    try {
      const detections = flatten(
        flatten(
          await Promise.all(
            Wappalyzer.technologies.map((technology) =>
              Promise.all([
                oo(technology, 'url', url),
                oo(technology, 'html', html),
                om(technology, 'meta', meta),
                mm(technology, 'headers', headers),
                om(technology, 'cookies', cookies),
                om(technology, 'scripts', scripts)
              ])
            )
          )
        )
      ).filter((technology) => technology)

      return detections
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  setTechnologies(data) {
    const transform = Wappalyzer.transformPatterns

    Wappalyzer.technologies = Object.keys(data).reduce((technologies, name) => {
      const {
        cats,
        url,
        html,
        meta,
        headers,
        cookies,
        script,
        js,
        implies,
        excludes,
        icon,
        website
      } = data[name]

      technologies.push({
        name,
        categories: cats || [],
        slug: Wappalyzer.slugify(name),
        url: transform(url),
        headers: transform(
          Object.keys(headers || {}).reduce(
            (lcHeaders, header) => ({
              ...lcHeaders,
              [header.toLowerCase()]: headers[header]
            }),
            {}
          )
        ),
        cookies: transform(cookies),
        html: transform(html),
        meta: transform(meta),
        scripts: transform(script),
        js: transform(js),
        implies: typeof implies === 'string' ? [implies] : implies || [],
        excludes: typeof excludes === 'string' ? [excludes] : excludes || [],
        icon: icon || 'default.svg',
        website: website || ''
      })

      return technologies
    }, [])
  },

  setCategories(data) {
    Wappalyzer.categories = Object.keys(data)
      .reduce((categories, id) => {
        const category = data[id]

        categories.push({
          id: parseInt(id, 10),
          slug: Wappalyzer.slugify(category.name),
          ...category
        })

        return categories
      }, [])
      .sort(({ priority: a }, { priority: b }) => (a > b ? -1 : 0))
  },

  transformPatterns(patterns) {
    if (!patterns) {
      return []
    }

    const toArray = (value) => (Array.isArray(value) ? value : [value])

    if (typeof patterns === 'string' || Array.isArray(patterns)) {
      patterns = { main: patterns }
    }

    const parsed = Object.keys(patterns).reduce((parsed, key) => {
      parsed[key] = toArray(patterns[key]).map((pattern) => {
        const { regex, confidence, version } = pattern
          .split('\\;')
          .reduce((attrs, attr, i) => {
            if (i) {
              // Key value pairs
              attr = attr.split(':')

              if (attr.length > 1) {
                attrs[attr.shift()] = attr.join(':')
              }
            } else {
              // Escape slashes in regular expression
              attrs.regex = new RegExp(attr.replace(/\//g, '\\/'), 'i')
            }

            return attrs
          }, {})

        return {
          regex,
          confidence: parseInt(confidence || 100, 10),
          version: version || ''
        }
      })

      return parsed
    }, {})

    return 'main' in parsed ? parsed.main : parsed
  },

  analyzeOneToOne(technology, type, value) {
    return technology[type].reduce((technologies, pattern) => {
      if (pattern.regex.test(value)) {
        technologies.push({ technology, pattern, match: value })
      }

      return technologies
    }, [])
  },

  analyzeOneToMany(technology, type, items = []) {
    return items.reduce((technologies, { key, value }) => {
      const patterns = technology[type][key] || []

      patterns.forEach((pattern) => {
        if (pattern.regex.test(value)) {
          technologies.push({ technology, pattern, match: value })
        }
      })

      return technologies
    }, [])
  },

  analyzeManyToMany(technology, type, items = {}) {
    return Object.keys(technology[type]).reduce((technologies, key) => {
      const patterns = technology[type][key] || []
      const values = items[key] || []

      patterns.forEach((pattern) => {
        values.forEach((value) => {
          if (pattern.regex.test(value)) {
            technologies.push({ technology, pattern, match: value })
          }
        })
      })

      return technologies
    }, [])
  }
}

if (typeof module !== 'undefined') {
  module.exports = Wappalyzer
}
