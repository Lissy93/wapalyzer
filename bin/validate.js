const fs = require('fs')
const path = require('path')

const { apps: technologies, categories } = JSON.parse(
  fs.readFileSync(path.resolve(`${__dirname}/../src/apps.json`))
)

try {
  Object.keys(technologies).forEach((name) => {
    const technology = technologies[name]

    ;['url', 'html', 'meta', 'headers', 'cookies', 'script', 'js'].forEach(
      (type) => {
        if (technology[type]) {
          const keyed =
            typeof technology[type] === 'string' ||
            Array.isArray(technology[type])
              ? { _: technology[type] }
              : technology[type]

          Object.keys(keyed).forEach((key) => {
            const patterns = Array.isArray(keyed[key])
              ? keyed[key]
              : [keyed[key]]

            patterns.forEach((pattern, index) => {
              const id = `${name}: ${type}[${key === '_' ? `${index}` : key}]`

              const [regex, ...flags] = pattern.split('\\;')

              let maxGroups = 0

              flags.forEach((flag) => {
                const [key, value] = flag.split(':')

                if (key === 'version') {
                  const refs = value.match(/\\(\d+)/g)

                  if (refs) {
                    maxGroups = refs.reduce((max, ref) =>
                      Math.max(max, parseInt(refs[1] || 0))
                    )
                  }
                } else if (key === 'confidence') {
                  if (
                    !/^\d+$/.test(value) ||
                    parseInt(value, 10) < 0 ||
                    parseInt(value, 10) > 99
                  ) {
                    throw new Error(
                      `Confidence value must a number between 0 and 99: ${value} (${id})`
                    )
                  }
                } else {
                  throw new Error(`Invalid flag: ${key} (${id})`)
                }
              })

              try {
                // eslint-disable-next-line no-new
                new RegExp(regex)
              } catch (error) {
                throw new Error(`${error.message} (${id})`)
              }

              const groups = new RegExp(`${regex}|`).exec('').length - 1

              if (groups > maxGroups) {
                throw new Error(
                  `Too many non-capturing groups, expected ${maxGroups}: ${regex} (${id})`
                )
              }

              if (type === 'html' && !/[<>]/.test(regex)) {
                throw new Error(
                  `HTML pattern must include < or >: ${regex} (${id})`
                )
              }
            })
          })
        }
      }
    )

    technology.cats.forEach((id) => {
      if (!categories[id]) {
        throw new Error(`No such category: ${id} (${name})`)
      }
    })

    if (
      technology.icon &&
      !fs.existsSync(
        path.resolve(
          `${__dirname}/../src/drivers/webextension/images/icons/${technology.icon}`
        )
      )
    ) {
      throw new Error(`No such icon: ${technology.icon} (${name})`)
    }

    try {
      // eslint-disable-next-line no-new
      const { protocol } = new URL(technology.website)

      if (protocol !== 'http:' && protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }
    } catch (error) {
      throw new Error(`Invalid website URL: ${technology.website} (${name})`)
    }

    // TODO check implies, excludes
  })
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error.message)
}
