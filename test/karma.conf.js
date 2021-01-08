'use strict';
const path = require('path');
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({
    basePath: path.dirname(__dirname) + '\\test',
    files: [
      { pattern: './karma-init.js', watched: false }
    ],
    preprocessors: {
      'karma-init.js': ['webpack']
    },
    webpack: require('./webpack.test.js'),
    frameworks: ['jasmine'],
    reporters: ['progress'],
    webpackServer: { noInfo: true },
    port: 9876,
    colors: true,
    autoWatch: false,

    browsers: ['ChromeHeadless'],

    browserNoActivityTimeout: 200000,
    singleRun: true,
    logLevel: config.LOG_INFO,
  });
};
