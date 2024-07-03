'use strict';

async function main(homebridge) {
    try {
        // Stellen Sie sicher, dass Sie die vollständige Dateierweiterung angeben, wenn nötig
        const { DoorLuxPlatform } = await import('./DoorLuxPlatform.js');

        if (DoorLuxPlatform) {
            if(DoorLuxPlatform.loadPlatform) {
                DoorLuxPlatform.loadPlatform(homebridge, require('./package.json'), 'doorlux', DoorLuxPlatform);
                console.log("Loaded DoorLuxPlatformnp")
            }
            else{
                console.error("Failed to load the DoorLuxPlatform - loadPlatform was false")
            }
        } else {
            console.error("Failed to load the DoorLuxPlatform ");
        }
    } catch (error) {
        console.error("Error loading the DoorLuxPlatform:", error);
    }
}

module.exports = main;
