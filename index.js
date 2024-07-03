'use strict';

async function main(homebridge) {
    try {
        console.log("Trying to load DoorLuxPlatform");
        const { DoorLuxPlatform } = await import('./DoorLuxPlatform.js');
        console.log("Imported DoorLuxPlatform:", DoorLuxPlatform);

        if (DoorLuxPlatform) {
            console.log("DoorLuxPlatform is defined");
            if (DoorLuxPlatform.loadPlatform) {
                console.log("DoorLuxPlatform.loadPlatform is defined");
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
