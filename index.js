'use strict';

async function main(homebridge) {
    try {
        const { DoorLuxPlatform } = require('./DoorLuxPlatform.js');
        console.log("Imported DoorLuxPlatform:", DoorLuxPlatform);

        if (DoorLuxPlatform) {
            if (DoorLuxPlatform.loadPlatform) {
                DoorLuxPlatform.loadPlatform(homebridge, require('./package.json'), 'doorlux', DoorLuxPlatform);
                console.log("Loaded DoorLuxPlatform");
            } else {
                console.error("Failed to load the DoorLuxPlatform - loadPlatform was false");
            }
        } else {
            console.error("Failed to load the DoorLuxPlatform");
        }
    } catch (error) {
        console.error("Error loading the DoorLuxPlatform:", error);
    }
}

module.exports = main;
