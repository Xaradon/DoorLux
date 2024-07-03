import { Platform } from 'homebridge-lib/Platform';
import WebSocket from 'ws';

// Define the DoorLuxPlatform class after the Platform has been imported
class DoorLuxPlatform extends Platform {
    constructor(log, config, api) {
        super(log, config, api);

        // Ensure hap is correctly initialized
        this.hap = api.hap;
        this.log = log;
        this.config = config;

        // Initialize a map for door states
        this.doorStates = new Map();

        // Create the LockMechanism Service
        this.createLockService();

        // Initialize WebSocket connection
        this.initWebSocket();
    }

    createLockService(doorConfig) {
        const { Service, Characteristic } = this.hap;

        // Create a LockMechanism Service with the specified name
        const service = new Service.LockMechanism(doorConfig.name);
        this.doorStates.set(doorConfig.doorID, {
            service: service,
            current: Characteristic.LockCurrentState.UNSECURED,
            target: Characteristic.LockTargetState.UNSECURED
        });

        // Define the 'get' and 'set' events for the characteristics
        service.getCharacteristic(Characteristic.LockCurrentState)
            .onGet(() => this.handleLockCurrentStateGet(doorConfig.doorID));

        service.getCharacteristic(Characteristic.LockTargetState)
            .onGet(() => this.handleLockTargetStateGet(doorConfig.doorID))
            .onSet((value) => this.handleLockTargetStateSet(doorConfig.doorID, value));
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

    async handleLockCurrentStateGet(doorID) {
        if (this.doorStates.has(doorID)) {
            const doorState = this.doorStates.get(doorID).current;
            this.log(`Retrieving current lock state for door ${doorID}: ${doorState}`);
            return doorState;
        } else {
            this.log(`No state found for door ${doorID}`);
            throw new Error("No state found for door");
        }
    }

    async handleLockTargetStateGet(doorID) {
        if (this.doorStates.has(doorID)) {
            const doorState = this.doorStates.get(doorID).target;
            this.log(`Retrieving target lock state for door ${doorID}: ${doorState}`);
            return doorState;
        } else {
            this.log(`No target state found for door ${doorID}`);
            throw new Error("No target state found for door");
        }
    }

    async handleLockTargetStateSet(doorID, value) {
        this.log(`Received set target state for door ${doorID} to: ${value === this.hap.Characteristic.LockTargetState.SECURED ? 'SECURED' : 'UNSECURED'}`);
        // As no action is required, confirm the command immediately
        this.log('Not implemented yet!');
        return;
    }

    handleWebSocketMessage(message) {
        this.log("Received WebSocket message:", message);
        try {
            const data = JSON.parse(message);
            if (data.doorID && data.doorState) {
                this.updateLockState(data.doorID, data.doorState);
            } else {
                this.log("Invalid Message Format, missing DoorID or / and DoorState");
            }
        } catch (error) {
            this.log("WebSocket Error Message: ", error);
        }
    }

    updateLockState(doorID, doorState) {
        if (this.doorStates.has(doorID)) {
            const { Characteristic } = this.hap;
            const currentState = this.doorStates.get(doorID).current;
            const targetState = (doorState === 'closed') ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

            this.doorStates.set(doorID, {
                service: this.doorStates.get(doorID).service,
                current: currentState,
                target: targetState
            });

            const service = this.doorStates.get(doorID).service;
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
