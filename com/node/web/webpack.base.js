/* eslint-disable no-cond-assign, import/no-extraneous-dependencies */
const path = require('path');
const fs = require('fs');

// html related imports
const HTMLWebpackPlugin = require('html-webpack-plugin');

// css related imports
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');
const cssnano = require('cssnano');

// util functions
const src = path.join(__dirname, 'src');
const chunkname = (fname) => path.relative(src, fname)
  .replace(/\//g, 's')
  .replace(/\..*$/, '');
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      const f = getAllFiles(path.join(dirPath, file));
      for (const i of f) {
        arrayOfFiles.push(i);
      }
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};

// determine unique pages
const entries = {};
const pages = getAllFiles(src)
  .filter((f) => f.endsWith('html'))
  .filter((f) => fs.existsSync(f.replace('.html', '.js')));
for (const page of pages) {
  entries[chunkname(page)] = page.replace('.html', '.js');
}

module.exports = (environment) => ({
  mode: environment,
  entry: entries,
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    ...pages.map((fname) => new HTMLWebpackPlugin({
      favicon: `${__dirname}/src/img/favicon-32x32.png`,
      filename: path.relative(src, fname),
      template: fname,
      minify: (environment === 'production'),
      chunks: [chunkname(fname)],
    })),
  ],
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          preprocessor: (content, loaderContext) => {
            let result = content;

            const reg = /{{>\s([\w/]+.html)\s}}/g;
            let match;
            while ((match = reg.exec(content)) !== null) {
              const fname = path.join(src, match[1]);
              if (!fs.existsSync(fname)) {
                loaderContext.emitError(`${fname} not found!`);
                return content;
              }

              const pageContent = fs.readFileSync(fname, 'utf8');
              result = result.replace(match[0], pageContent);
            }

            return result;
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: true,
              hmr: (environment !== 'production'),
            },
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                tailwindcss,
                autoprefixer,
                cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
              ],
            },
          },
        ],
      },
      {
        test: /\.(ico)$/,
        use: 'file-loader',
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              // webp: {
              // quality: 75,
              //  enabled: false,
              // },
            },
          },
        ],
      },
    ],
  },
});
