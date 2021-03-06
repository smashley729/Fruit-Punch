const path = require('path')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const db = require('./db')
const PORT = process.env.PORT || 1337
const app = express()

module.exports = app

if (process.env.NODE_ENV !== 'production') require('../secrets')

const createApp = () => {
  // logging middleware
  app.use(morgan('dev'))

  // body parsing middleware
  app.use(express.json())
  app.use(express.urlencoded({extended: true}))

  // compression middleware
  app.use(compression())

  // if (process.env.NODE_ENV === 'production') {
  //   //redirect the visitor to the secure version of the site (most browsers block camera access from non-secure urls)
  //   app.use((req, res, next) => {
  //     if (!req.secure) {
  //       return res.redirect('https://' + req.headers.host + req.path)
  //     }
  //     next()
  //   })
  // }

  // api routes
  app.use('/api', require('./routes'))

  // static file-serving middleware
  app.use(express.static(path.join(__dirname, '..', 'public')))

  // any remaining requests with an extension (.js, .css, etc.) send 404
  app.use((req, res, next) => {
    if (path.extname(req.path).length) {
      const err = new Error('Not found')
      err.status = 404
      next(err)
    } else {
      next()
    }
  })

  // sends index.html
  app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public/index.html'))
  })

  // error handling endware
  app.use((err, req, res, next) => {
    console.error(err)
    console.error(err.stack)
    res.status(err.status || 500).send(err.message || 'Internal server error.')
  })
}

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  app.listen(PORT, () => console.log(`I'm listening on port ${PORT}!`))
}

const syncDb = () => db.sync()

async function bootApp() {
  await syncDb()
  await createApp()
  await startListening()
}

if (require.main === module) {
  bootApp()
} else {
  createApp()
}
