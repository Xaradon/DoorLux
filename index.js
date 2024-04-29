let Accessory, Service, Characteristic, UUIDGen;

module.exports = (homebridge) => {
    console.log('Homebridge API version: ' + homebridge.version);
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform("homebridge-doorlux", "doorlux", MyDoorsPlatform, true);
};

class MyDoorsPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.accessories = {};
        this.config = config || {};
        this.ws = new (require('ws'))(this.config.websocketURL);

        this.ws.on('open', () => {
            this.log('WebSocket connection established');
        });

        this.ws.on('message', this.processWebSocketMessage.bind(this));

        this.ws.on('error', (error) => {
            this.log('WebSocket error:', error);
        });
        this.initializeAccessories();
    }

    initializeAccessories() {
        const accessories = this.createAccessoriesBasedOnConfig();
        accessories.forEach(accessory => {
            this.api.registerPlatformAccessories("homebridge-doorlux", "doorlux", [accessory]);
            this.accessories[accessory.UUID] = accessory;
        });
    }


    processWebSocketMessage(data) {
        let statusUpdate;
        try {
            statusUpdate = JSON.parse(data);
            this.log('Received update:', statusUpdate);
            let accessory = this.accessories[statusUpdate.id];
            if (accessory) {
                let service = accessory.getService(Service.ContactSensor);
                let newState = statusUpdate.state === 'geschlossen' ?
                    Characteristic.ContactSensorState.CONTACT_DETECTED :
                    Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
                service.getCharacteristic(Characteristic.ContactSensorState)
                    .updateValue(newState);
                this.log(`Updated door state to: ${newState === Characteristic.ContactSensorState.CONTACT_DETECTED ? 'Closed' : 'Open'}`);
            }
        } catch (error) {
            this.log('Error processing WebSocket message:', error);
        }
    }


    createAccessoriesBasedOnConfig() {
        let accessories = [];
        this.config.doors.forEach(door => {
            let uuid = UUIDGen.generate(door.id);
            let accessory = new this.api.platformAccessory(door.name, uuid);
            let service = accessory.addService(Service.ContactSensor, door.name);

            service.setCharacteristic(Characteristic.ContactSensorState, Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

            this.api.registerPlatformAccessories('homebridge-doorlux', 'doorlux', [accessory]);
            this.accessories[accessory.UUID] = accessory;
            accessories.push(accessory);
        });
        return accessories;
    }


    configureAccessory(accessory) {
        this.accessories[accessory.UUID] = accessory;
    }

    accessories(callback) {
        let configuredAccessories = Object.values(this.accessories);
        callback(configuredAccessories);
    }
}
