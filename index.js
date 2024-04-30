'use strict';

async function main(homebridge) {
    try {
        // Stellen Sie sicher, dass Sie die vollständige Dateierweiterung angeben, wenn nötig
        const { DoorLuxPlatform } = await import('./DoorLuxPlatform.js');

        if (DoorLuxPlatform && DoorLuxPlatform.loadPlatform) {
            DoorLuxPlatform.loadPlatform(homebridge, require('./package.json'), 'doorlux', DoorLuxPlatform);
        } else {
            console.error("Failed to load the DoorLuxPlatform or the 'loadPlatform' method is not defined.");
        }
    } catch (error) {
        console.error("Error loading the DoorLuxPlatform:", error);
    }
}

module.exports = main;
