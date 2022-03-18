const fs = require('fs')
const path = require('path')
const { createConverter } = require('convert-svg-to-png')
const terminalOverwrite = require('terminal-overwrite')

// Fix memoryleak warning
const maxConvertProcesses = 1
process.setMaxListeners(maxConvertProcesses + 1)

const appPaths = () => {
  const fileDir = path.dirname(require.main.filename).split('/')
  // Remove current bin directory
  fileDir.pop()
  const appDir = fileDir.join('/')

  return {
    basePath: fileDir,
    appPath: appDir,
    iconPath: appDir + '/src/drivers/webextension/images/icons',
    convertPath: appDir + '/src/drivers/webextension/images/icons/converted',
  }
}

/**
 * Copy files from source to destination.
 * @param source
 * @param destination
 */
function copyFiles(source, destination) {
  // File destination will be created or overwritten by default.
  fs.copyFileSync(source, destination)
  // console.log(`${source} -> ${destination}`)
}

/**
 * Get extension of image file.
 * @returns {string}
 */
function getFileExtension(filePath) {
  return path.extname(filePath)
}

/**
 * Get base name of image file.
 * @returns {string}
 */
function getFileName(filePath) {
  return path.basename(filePath, getFileExtension(filePath))
}

function getConvertFileName(filePath) {
  const name = getFileName(filePath)
  return `${appPaths().convertPath}/${name}.png`
}

/**
 * Check if converted image exists
 * @returns {boolean}
 */
function checkFileExists(imagePath) {
  const fileExists = fs.existsSync(imagePath)
  return fileExists
}

/**
 * Check if path is a file
 * @param {*} filePath
 * @returns
 */
function checkIfFile(filePath) {
  return fs.statSync(filePath).isFile()
}

function dateModified(file) {
  return fs.statSync(file).mtime
}

function dateDiff(file) {
  const now = new Date().getTime()
  const then = dateModified(file).getTime()
  return Math.round(Math.abs(((then - now) / 1000) * 60 * 60 * 24))
}

;(async () => {
  // Main script
  const files = fs.readdirSync(appPaths().iconPath)
  const totalFiles = files.length
  const batchNum = Math.ceil(totalFiles / maxConvertProcesses)
  let batchCount = 1

  const converter = createConverter()

  do {
    const percentComplete = `${
      100 - Math.round((100 / totalFiles) * files.length)
    }%`
    terminalOverwrite(
      `Processing Batch: ${batchCount} of ${batchNum} (${percentComplete})`
    )

    await Promise.all(
      files.splice(0, maxConvertProcesses).map(async (fileName) => {
        const path = `${appPaths().iconPath}/${fileName}`
        const outputFilePath = getConvertFileName(fileName)
        const ext = getFileExtension(path)

        if (ext === '.svg') {
          // Check if converted file exists.
          if (checkFileExists(outputFilePath)) {
            // Skip if destination file exists and source file hasn't changed in
            // 30 days or destination file was created in the last day
            const fileAgeA = dateDiff(path)
            const fileAgeB = dateDiff(outputFilePath)

            if (fileAgeA > 30 || fileAgeB < 1) {
              return
            }
          }

          // Convert and copy file.
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await converter
                .convertFile(path, {
                  height: 32,
                  width: 32,
                  outputFilePath,
                })
                .catch((error) => {
                  throw new Error(`${error} (${fileName})`)
                })

              break
            } catch (error) {
              if (attempt >= 3) {
                throw error
              } else {
                // eslint-disable-next-line no-console
                console.error(`${error.message || error} (attempt ${attempt})`)

                await new Promise((resolve) =>
                  setTimeout(resolve, 500 * attempt)
                )
              }
            }
          }
        } else if (this.ext === '.png') {
          // If PNG, just copy the file as-is.
          // eslint-disable-next-line no-lonely-if
          if (checkIfFile(this.path)) {
            copyFiles(this.path, this.convertPath)
          }
        }
      })
    )

    batchCount++
  } while (files.length)

  await converter.destroy()

  // eslint-disable-next-line no-console
  console.log(`Converted ${totalFiles.toLocaleString()} files.`)
})()

/**

cd  ; cp *.svg converted ; cd converted ; convert-svg-to-png *.svg --width 32 --height 32 ; rm *.svg
(async() => {
  const inputFilePath = '/path/to/my-image.svg';
  const outputFilePath = await convertFile(inputFilePath);

  console.log(outputFilePath);
  //=> "/path/to/my-image.png"
})();
*/
