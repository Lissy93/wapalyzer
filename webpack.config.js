const path = require('path');
const glob = require('glob');

var exports = [];

const rootPath = {
  webExtension: path.join(__dirname, 'src/drivers/webextension'),
  npm: path.join(__dirname, 'src/drivers/npm')
};

const config = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
        // query: {
        //   presets: ['es2015']
        // }
      }
    ]
  },

  node: {
    console: true,
    child_process: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};

glob.sync(path.join(rootPath.webExtension, 'src/*.js'))
  .forEach(file => {
    exports.push(Object.assign({}, config, {
      context: path.resolve(rootPath.webExtension),
      resolve: {
        modules: [
          rootPath.webExtension,
          'node_modules'
        ]
      },
      entry: file,
      output: {
        path: path.join(rootPath.webExtension, 'js'),
        filename: path.relative(path.join(rootPath.webExtension, 'src'), file)
      }
    }))
  });

module.exports = exports;
