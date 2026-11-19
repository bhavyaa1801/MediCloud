'use strict'
const { setGlobalOptions } = require('firebase-functions/v2')
setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'asia-south1', maxInstances: 10 })

Object.assign(exports,
  require('./auth'), require('./appointments'), require('./doctors'), require('./patients'),
  require('./records'), require('./prescriptions'), require('./resources'), require('./notifications'),
  require('./admin'), require('./backup'))
