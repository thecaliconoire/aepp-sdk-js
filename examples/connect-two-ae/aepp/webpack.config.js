const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const {VueLoaderPlugin} = require('vue-loader')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const PurgecssPlugin = require('purgecss-webpack-plugin')
let glob = require('glob-all')

const distFolder = path.resolve(__dirname, 'dist')
const jsLoader = 'babel-loader!standard-loader?error=true'

// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
  static extract (content) {
    return content.match(/[A-z0-9-:\/]+/g) || [];
  }
}

module.exports = {
  mode: process.env.NODE_ENV === 'prod' ? 'production' : 'development',
  resolve: {
    alias: {
      AE_SDK_MODULES: '@aeternity/aepp-sdk/es'
    }
  },
  entry: {
    'wallet': './src/index.js'
  },
  output: {
    filename: 'bundle.js?[hash]'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 9001
  },
  devtool: process.env.NODE_ENV === 'prod' ? '' : 'eval-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      // chunks: ['wallet'],
      title: 'Æpp Example App',
      template: './src/index.html',
      filename: distFolder + '/index.html',
      alwaysWriteToDisk: true
    }),
    new PurgecssPlugin({
      // Specify the locations of any files you want to scan for class names.
      paths: glob.sync([
        path.join(__dirname, './src/**/*.vue'),
        path.join(__dirname, './src/index.html')
      ]),
      extractors: [
        {
          extractor: TailwindExtractor,
          // Specify the file extensions to include when scanning for
          // class names.
          extensions: ['html', 'js', 'php', 'vue']
        }
      ]
    }),
    new HtmlWebpackHarddiskPlugin(),
    new ExtractTextPlugin('style.css?[hash]'),
    new CleanWebpackPlugin([distFolder]),
    new VueLoaderPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: jsLoader,
        // include: [path.resolve(__dirname, 'aepp'), path.resolve(__dirname, 'wallet')]
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/@aeternity'),
          path.resolve(__dirname, 'node_modules/rlp')
        ],
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-export-default-from'
          ]
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: 'postcss.config.js'
                }
              }
            }
          ]
          // publicPath: '/web'
        })
      },
      // allows vue compoents in '<template><html><script><style>' syntax
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            js: jsLoader
          }
          // extractCSS: true
          // other vue-loader options go here
        }
      }
    ]
  }
}
