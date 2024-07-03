'use strict';

import { DoorLuxPlatform } from './DoorLuxPlatform.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function main(homebridge) {
    try {
        console.log("Trying to load DoorLuxPlatform");
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

export default main;
