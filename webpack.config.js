const path = require('path');
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const packageJSON = require('./package');

const ROOT = path.resolve(__dirname, 'app');
const DEV_ENV = process.env.NODE_ENV === 'development';

/** Create Environment variables */
const env = {
  NODE_ENV: process.env.NODE_ENV,
  VERSION: packageJSON.version,

  AUTH_CONFIRMATION_HTML:
    process.env.NODE_ENV === 'development' ? '/authentication-progress.html' : '/widgets/authentication-progress.html',
  API_URL: process.env.API_URL || `https://${DEV_ENV ? 'apitest' : 'api'}.vuukle.com`,
  SESSION_COOKIE_NAME: 'token',
  PERSPECTIVE_API_KEY: 'AIzaSyBUvgT1rjqaIDv01b4ZiBK1gV3Rb6GE7ZQ',
  FACEBOOK_LOGIN_LINK: 'https://login.vuukle.com/auth/facebook',
  TWITTER_LOGIN_LINK: 'https://login.vuukle.com/auth/twitter',
  GOOGLE_LOGIN_LINK: 'https://login.vuukle.com/auth/google',
  DISQUS_LOGIN_LINK: 'https://login.vuukle.com/auth/disqus',
  GIPHY_TOKEN: '4wrgnt2H4L9wFRPILj2Dkbl1mMyC0pF9',
};

/** 💬 Log Environment Variables */
console.log('================== ENVIRONMENT ========================');
console.log(`Environment: `);
Object.keys(env).forEach((key) => {
  console.log(`${key}: ${env[key]}`);
});
console.log('=======================================================');

/** 📦 Webpack Config */
module.exports = {
  mode: DEV_ENV ? 'development' : 'production',
  devtool: DEV_ENV ? 'cheap-module-eval-source-map' : false,
  context: ROOT,
  target: 'web',
  entry: ['./index.tsx'],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [ROOT, 'node_modules'],
  },
  performance: {
    hints: false,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        sourceMap: true,
        terserOptions: {
          output: { comments: false },
        },
      }),
    ],
  },
  module: {
    rules: [
      // Preloader
      { enforce: 'pre', test: /\.js$/, use: 'source-map-loader' },
      { enforce: 'pre', test: /\.tsx?$/, exclude: /node_modules/, use: 'tslint-loader' },
      // Loaders
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          configFile: path.resolve(__dirname, '.babelrc'),
          plugins: ['lodash']
        },
      },
      {
        test: /\.tsx?$/,
        include: /node_modules/,
        loader: 'babel-loader',
        options: { configFile: path.resolve(__dirname, '.babelrc') },
      },
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    // Check for duplicate imports
    new DuplicatePackageCheckerPlugin(),
    // Simplifies creation of HTML files to serve webpack bundles.
    new HtmlWebpackPlugin({
      template: './index.ejs',
      filename: 'index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: false,
      },
      // Inline sources only for prod build
      ...(DEV_ENV ? {} : { inlineSource: '.(js|css)$' }),
    }),
    // Create Environment Variables
    new webpack.DefinePlugin(
      Object.keys(env).reduce((current, keyValue) => {
        current[`process.env.${keyValue}`] = JSON.stringify(env[keyValue]);
        return current;
      }, {})
    ),
    // Additional Plugins based on environment
    ...(DEV_ENV
      ? []
      : [
          // Bundles HTML with inline JS/CSS, so we can have everything in one HTML file
          new HtmlWebpackInlineSourcePlugin(),
          // Copies files from one folder to another
          new CopyPlugin([{ from: path.resolve(__dirname, 'static'), to: path.resolve(__dirname, 'dist') }]),
        ]),
    new LodashModuleReplacementPlugin({
      'collections': true,
      'paths': true,
    }),
  ],
  // Dev Server Config
  devServer: {
    port: 3001,
    open: false,
    hot: true,
    historyApiFallback: true,
  },
};
