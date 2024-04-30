const WebSocket = require('ws');
const hap = require('hap-nodejs');
const Accessory = hap.Accessory;
const Service = hap.Service;
const Characteristic = hap.Characteristic;

module.exports = (homebridge) => {
    console.log('Homebridge API version: ' + homebridge.version);
    homebridge.registerPlatform("homebridge-doorlux", "doorlux", DoorLuxMain);
};

class DoorLuxMain {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.doorStates = new Map();

        this.service = new Service.LockMechanism(this.config.name);
        this.service
            .getCharacteristic(Characteristic.LockCurrentState)
            .on('get', this.handleLockCurrentStateGet.bind(this));

        this.service
            .getCharacteristic(Characteristic.LockTargetState)
            .on('get', this.handleLockTargetStateGet.bind(this))
            .on('set', this.handleLockTargetStateSet.bind(this));

        this.initWebSocket();
    }

    initWebSocket() {
        this.websocket = new WebSocket(this.config.websocketUrl);

        this.websocket.on('open', () => {
            this.log("WebSocket connection established");
        });

        this.websocket.on('message', this.handleWebsocketMessage.bind(this));

        this.websocket.on('close', () => {
            this.log("WebSocket connection closed. Attempting to reconnect...");
            setTimeout(() => this.initWebSocket(), 5000);  // Reconnect after 5 seconds
        });

        this.websocket.on('error', (error) => {
            this.log("WebSocket error:", error);
        });
    }

    handleLockCurrentStateGet(callback) {
        if (this.doorStates.has(this.config.doorID)) {
            const doorState = this.doorStates.get(this.config.doorID).current;
            this.log(`Retrieving current lock state for door ${this.config.doorID}: ${doorState}`);
            callback(null, doorState);
        } else {
            this.log(`No state found for door ${this.config.doorID}`);
            callback(new Error("No state found for door"));
        }
    }

    handleLockTargetStateGet(callback) {
        if (this.doorStates.has(this.config.doorID)) {
            const doorState = this.doorStates.get(this.config.doorID).target;
            this.log(`Retrieving target lock state for door ${this.config.doorID}: ${doorState}`);
            callback(null, doorState);
        } else {
            this.log(`No target state found for door ${this.config.doorID}`);
            callback(new Error("No target state found for door"));
        }
    }

    handleLockTargetStateSet(value, callback) {
        this.log(`Received set target state for door ${this.config.doorID} to: ${value === Characteristic.LockTargetState.SECURED ? 'SECURED' : 'UNSECURED'}`);
        // Da keine Aktion erforderlich ist, bestätigen wir den Befehl sofort
        this.log('Not implemented yet!');
        callback(null); // Erfolg
    }

    handleWebsocketMessage(message) {
        // Implement logic to process messages from WebSocket
        // Example: Parse message and update HomeKit state
        this.log("Received WebSocket message:", message);
        try{
            const data = JSON.parse(message);
            if(data.doorID && data.doorState){
                this.updateLockState(data.doorID,  data.doorState);

            }else{
                this.log("Invalid Message Format, missing DoorID or / and DoorState");
            }
        } catch (error){
            this.log("Websocket Error Message: ", error);
        }

    }

    updateLockState(doorID, doorState){
        if(this.config.doorID === doorID){ //Check if DoorID exists in Config
            let newState = (doorState === 'closed') ?
                Characteristic.LockCurrentState.SECURED :
                Characteristic.LockCurrentState.UNSECURED;

            this.doorStates.set(doorID, {
                current: currentState,
                target: targetState
            });

            // Update both Current and Target State to reflect the new state accurately
            this.service.getCharacteristic(Characteristic.LockCurrentState)
                .updateValue(newState);
            this.service.getCharacteristic(Characteristic.LockTargetState)
                .updateValue(newState);

            this.log(`Door lock state updated to: ${state}`);
        } else {
            this.log(`Received update for unconfigured door ID: ${turID}`);
        }
    }
}
