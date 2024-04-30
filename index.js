'use strict';

async function main(homebridge) {
    const { DoorLuxPlatform } = await import('./DoorLuxPlatform');

    if (DoorLuxPlatform && DoorLuxPlatform.loadPlatform) {
        DoorLuxPlatform.loadPlatform(homebridge, require('./package.json'), 'doorlux', DoorLuxPlatform);
    } else {
        console.error("Failed to load the DoorLuxPlatform or the 'loadPlatform' method is not defined.");
    }
}

module.exports = main;
