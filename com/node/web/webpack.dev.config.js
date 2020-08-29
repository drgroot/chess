// eslint-disable-next-line import/no-extraneous-dependencies
const config = require('./webpack.base')('development');

module.exports = {
  ...config,
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
    open: false,
    port: 3000,
    host: '0.0.0.0',
  },
  output: {
    ...config.output,
    filename: '[name].[hash].js',
  },
};
