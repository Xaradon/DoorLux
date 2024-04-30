'use strict';

const { DoorLuxPlatform } = require('./DoorLuxPlatform'); // Importiere die DoorLuxPlatform aus dem entsprechenden CommonJS-Modul
const packageJson = require('./package.json');

function main(homebridge) {
    DoorLuxPlatform.loadPlatform(homebridge, packageJson, 'doorlux', DoorLuxPlatform);
}

module.exports = main; // Exportiere die main-Funktion als Modul
