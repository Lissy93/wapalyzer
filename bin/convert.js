const fs = require('fs')
const path = require('path')
const { convertFile } = require('convert-svg-to-png')

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

// Main script
fs.readdirSync(appPaths().iconPath).forEach((fileName) => {
  const image = {
    id: fileName,
    path: `${appPaths().iconPath}/${fileName}`,
    convertPath: `${appPaths().convertPath}/${fileName}`,
    /**
     * Copy files from source to destination.
     * @param source
     * @param destination
     */
    copyFiles(source, destination) {
      // File destination will be created or overwritten by default.
      fs.copyFileSync(source, destination)
      console.log(`Copied icon: ${this.id}`)
    },
    /**
     * Get extension of image file.
     * @returns {string}
     */
    getFileExtension() {
      return path.extname(this.path)
    },
    /**
     * Get base name of image file.
     * @returns {string}
     */
    getFileName() {
      return path.basename(this.path, this.getFileExtension())
    },
    getConvertFileName() {
      const name = this.getFileName()
      return `${appPaths().convertPath}/${name}.png`
    },
    /**
     * Check if converted image exists
     * @returns {boolean}
     */
    checkFileExists(imagePath) {
      const fileExists = fs.existsSync(imagePath)
      return fileExists
    },
    checkIfFile() {
      return fs.statSync(this.path).isFile()
    },
    diffFiles(fileOne, fileTwo) {
      const f1 = fs.readFileSync(fileOne)
      const f2 = fs.readFileSync(fileTwo)
      return f1.equals(f2)
    },
    dateModified(file) {
      return fs.statSync(file).mtime
    },
    dateDiff(file) {
      const now = new Date().getTime()
      const then = this.dateModified(file).getTime()
      return Math.round(Math.abs((then - now) / 86400000))
    },
    async convertAndCopy() {
      await convertFile(this.path, {
        height: 32,
        width: 32,
        outputFilePath: this.convertPath,
      }).then((outputFile) => {
        console.log(`SVG Converted: ${outputFile}`)
      })
    },
    processFile() {
      // Setup variables.
      const ext = this.getFileExtension()

      // If SVG, run checks.
      if (ext === '.svg') {
        // Check if converted file exists.
        const convertFilePath = this.getConvertFileName()
        if (this.checkFileExists(convertFilePath)) {
          // If file has changed in past 7 days.
          if (this.dateDiff(this.path) > 8) {
            console.log(`File exists, skipping: ${this.id}`)
            return null
          }
        }
        // Convert and copy file.
        this.convertAndCopy()
      } else {
        // If PNG or other, just copy the file as-is.
        // eslint-disable-next-line no-lonely-if
        if (this.checkIfFile()) {
          this.copyFiles(this.path, this.convertPath)
        } else {
          console.info('Not a file, skipping...')
        }
      }
    },
  }

  image.processFile()
})

/**

cd  ; cp *.svg converted ; cd converted ; convert-svg-to-png *.svg --width 32 --height 32 ; rm *.svg
(async() => {
  const inputFilePath = '/path/to/my-image.svg';
  const outputFilePath = await convertFile(inputFilePath);

  console.log(outputFilePath);
  //=> "/path/to/my-image.png"
})();
*/
