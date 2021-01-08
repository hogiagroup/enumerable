const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const outDir = path.resolve(__dirname, '../test/dist');
const srcDir = path.resolve(__dirname, '../src');
const configFilePath = path.resolve(__dirname, '../tsconfig.json');
const nodeModulesDir = path.resolve(__dirname, '../node_modules');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, nodeModulesDir]
  },
  output: {
    path: outDir,
    publicPath: './test/dist/'
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        loader: 'ts-loader',
        include: [srcDir, srcDir + '/**/*.{ts,tsx,js,jsx}'],
        options: {
          transpileOnly: true,
          configFile: configFilePath
        }
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      eslint: {
        files: srcDir + '/**/*.{ts,tsx,js,jsx}'
      }
    })
  ]
};
