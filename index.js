'use strict'

import { createRequire } from 'node:module'

import { DoorLuxPlatform } from '.DoorLuxPlatform'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

function main (homebridge) {
    DoorLuxPlatform.loadPlatform(homebridge, packageJson, 'doorlux', DoorLuxPlatform)
}

export { main as default }