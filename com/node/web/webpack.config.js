const config = require('./webpack.base');

module.exports = {
  ...config('production'),
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
