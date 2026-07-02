const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Plugin personalizado para reemplazar variables en el HTML
class TemplateVarsPlugin {
  constructor(vars) {
    this.vars = vars
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('TemplateVarsPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        'TemplateVarsPlugin',
        (data, cb) => {
          let html = data.html
          for (const [key, value] of Object.entries(this.vars)) {
            html = html.replace(new RegExp(`<%=\\s*${key}\\s*%>`, 'g'), value)
          }
          data.html = html
          cb(null, data)
        }
      )
    })
  }
}

const rootPath = process.cwd()
const parentPath = path.dirname(rootPath)
const distPath = path.join(parentPath, 'public')
const srcPath = rootPath

// Idiomas del build multi-carpeta. `lang` = clave del diccionario (i18n/__LANG__);
// `folder` = subcarpeta de salida (la del documento: /es/ y /eusk/).
const LOCALES = [
  {lang: 'es', folder: 'es'},
  {lang: 'eu', folder: 'eusk'},
]

const ATTRIBUTES_TO_EXPAND = [
  'src', 'gltf-model',
  'cover-image-url', 'footer-image-url', 'watermark-image-url',
]

const makeJsLoader = () => ({
  test: /\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
  exclude: /node_modules/,
})

const makeCssLoader = () => ({
  test: /\.css$/,
  exclude: /\/assets\//,
  // url:false → css-loader deja las url() como rutas literales en vez de
  // pasarlas por el asset-loader (que emite JS y rompe las fuentes). Los
  // archivos reales los sirve CopyWebpackPlugin desde dist/assets/.
  use: ['style-loader', {loader: 'css-loader', options: {url: false}}],
})

const makeAssetLoader = () => ({
  test: /\..*$/,
  include: [path.join(srcPath, 'assets')],
  loader: path.join(__dirname, 'asset-loader.js'),
})

const makeDefaultHtmlLoader = () => ({
  test: /\.html$/,
  use: {
    loader: 'html-loader',
    options: {
      esModule: false,
      sources: {
        list: [
          '...',
          {
            tag: 'script',
            attribute: 'src',
            type: 'src',
            filter: () => false,
          },
          ...ATTRIBUTES_TO_EXPAND.map(attr => ({
            tag: '*',
            attribute: attr,
            type: 'src',
          })),
        ],
      },
    },
  },
})

// Construye una configuración. `outPath` es la carpeta de salida; `lang` se inyecta
// como global __LANG__ que el diccionario (shared/i18n) lee para elegir idioma.
// En prod: los archivos llevan `lang` como identificador (bundle.es.js, index.eu.html)
const makeConfig = ({lang, outPath, publicPath, isProd}) => ({
  name: lang,
  entry: path.join(srcPath, 'app.js'),
  plugins: [
    new webpack.DefinePlugin({
      __LANG__: JSON.stringify(lang),
    }),
    new HtmlWebpackPlugin({
      template: path.join(srcPath, 'index.html'),
      filename: isProd ? `index.${lang}.html` : 'index.html',
      inject: false,
      minify: false,
    }),
    new TemplateVarsPlugin({lang}),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(srcPath, 'assets'),
          // Assets autocontenidos en dist/assets (todos los idiomas los usan)
          to: path.join(outPath, 'assets'),
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  resolve: {extensions: ['.js']},
  module: {
    rules: [
      makeJsLoader(),
      makeCssLoader(),
      makeAssetLoader(),
      makeDefaultHtmlLoader(),
    ],
  },
  context: srcPath,
  devtool: isProd ? 'source-map' : 'eval-source-map',
  output: {
    filename: isProd ? `bundle.${lang}.js` : 'bundle.js',
    path: outPath,
    publicPath,
    clean: !isProd, // Solo limpiar en dev, no en prod (evita borrar archivos del otro idioma)
  },
  optimization: isProd ? {
    minimize: true,
    splitChunks: false,
  } : {},
  performance: isProd ? {
    hints: 'warning',
    maxAssetSize: 5 * 1024 * 1024,
    maxEntrypointSize: 1 * 1024 * 1024,
  } : false,
})

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const isServe = Boolean(env && env.WEBPACK_SERVE)

  // En modo dev-server: build único en la raíz de dist (idioma 'es' por defecto),
  // para que la experiencia de desarrollo siga igual que antes.
  if (isServe) {
    return {
      ...makeConfig({lang: 'es', outPath: distPath, publicPath: '/', isProd}),
      devServer: {
        open: false,
        compress: true,
        hot: false,
        liveReload: true,
        server: 'https',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        },
        client: {
          overlay: {
            warnings: false,
            errors: true,
          },
        },
      },
    }
  }

  // En build: una configuración por idioma, todo en dist/ con identificador de idioma
  // (bundle.es.js, index.eu.html, etc.)
  return LOCALES.map(({lang}) => makeConfig({
    lang,
    outPath: distPath,
    publicPath: isProd ? './' : '/',
    isProd,
  }))
}
