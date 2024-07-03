import { Platform } from 'homebridge-lib/Platform';
import WebSocket from 'ws';
import { DoorLuxAccessory } from './DoorLuxAccessory.js';

// Define the DoorLuxPlatform class after the Platform has been imported
class DoorLuxPlatform extends Platform {
    constructor(log, config, api) {
        super(log, config, api);

        // Ensure hap is correctly initialized
        this.hap = api.hap;
        this.log = log;
        this.config = config;
        this.api = api;

        // Initialize a map for door states
        this.doorStates = new Map();

        // Check if doors are defined in config
        if (Array.isArray(this.config.doors)) {
            // Initialize door services for each door in the config
            this.config.doors.forEach(doorConfig => {
                this.log(`Creating Lock Service for Door with ID: ${doorConfig.doorID}`);
                this.createLockService(doorConfig);
            });
        } else {
            this.log.error('No doors defined in config');
        }

        // Initialize WebSocket connection
        this.initWebSocket();
    }

    createLockService(doorConfig) {
        const accessory = new DoorLuxAccessory(this, doorConfig);
        this.doorStates.set(String(doorConfig.doorID), {
            accessory: accessory,
            current: this.hap.Characteristic.LockCurrentState.UNSECURED,
            target: this.hap.Characteristic.LockTargetState.UNSECURED
        });

        // Register the accessory
        this.api.registerPlatformAccessories('homebridge-doorlux', 'doorlux', [accessory.accessory]);
    }

    initWebSocket() {
        this.websocket = new WebSocket(this.config.websocketUrl);

        // Define event handlers for the WebSocket connection
        this.websocket.on('open', () => {
            this.log("WebSocket connection established");
        });

        this.websocket.on('message', this.handleWebSocketMessage.bind(this));
        this.websocket.on('close', () => {
            this.log("WebSocket connection closed. Attempting to reconnect...");
            setTimeout(() => this.initWebSocket(), 5000);  // Reconnect after 5 seconds
        });

        this.websocket.on('error', (error) => {
            this.log("WebSocket error:", error);
        });
    }

    handleWebSocketMessage(message) {
        this.log("Received WebSocket message:", message);
        try {
            const data = JSON.parse(message);
            if (data.doorID && data.doorState) {
                this.updateLockState(String(data.doorID), data.doorState);  // Ensure doorID is a string
            } else {
                this.log("Invalid Message Format, missing DoorID or / and DoorState");
            }
        } catch (error) {
            this.log("WebSocket Error Message: ", error);
        }
    }

    updateLockState(doorID, doorState) {
        doorID = String(doorID);  // Ensure doorID is a string
        if (this.doorStates.has(doorID)) {
            const { Characteristic } = this.hap;
            const currentState = this.doorStates.get(doorID).current;
            const targetState = (doorState === 'closed') ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

            this.doorStates.set(doorID, {
                accessory: this.doorStates.get(doorID).accessory,
                current: currentState,
                target: targetState
            });

            const service = this.doorStates.get(doorID).accessory.lockService;
            service.getCharacteristic(Characteristic.LockCurrentState)
                .updateValue(targetState);
            service.getCharacteristic(Characteristic.LockTargetState)
                .updateValue(targetState);

            this.log(`Door lock state updated to: ${targetState} for door ID: ${doorID}`);
        } else {
            this.log(`Received update for unconfigured door ID: ${doorID}`);
        }
    }
}

// Export the class
export { DoorLuxPlatform };
