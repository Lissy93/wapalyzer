/* eslint-env browser */

;(function() {
  try {
    const onMessage = ({ data }) => {
      if (!data.wappalyzer) {
        return
      }

      const { technologies } = data.wappalyzer || {}

      removeEventListener('message', onMessage)

      postMessage({
        wappalyzer: {
          js: technologies.reduce((results, { name, chains }) => {
            chains.forEach((chain) => {
              const value = chain
                .split('.')
                .reduce(
                  (value, method) =>
                    value && value.hasOwnProperty(method)
                      ? value[method]
                      : undefined,
                  window
                )

              technologies.push({
                name,
                chain,
                value:
                  typeof value === 'string' || typeof value === 'number'
                    ? value
                    : !!value
              })
            })

            return technologies
          }, [])
        }
      })
    }

    addEventListener('message', onMessage)
  } catch (e) {
    // Fail quietly
  }
})()
