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

    }

    processWebSocketMessage(data) {
        let statusUpdate;
        try {
            statusUpdate = JSON.parse(data);
            this.log('Received update:', statusUpdate);
            let accessory = this.accessories[statusUpdate.id];
            if (accessory) {
                let service = accessory.getService(Service.ContactSensor);
                service.getCharacteristic(Characteristic.ContactSensorState)
                    .updateValue(statusUpdate.state === 'geschlossen' ?
                        Characteristic.ContactSensorState.CONTACT_DETECTED :
                        Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
            }
        } catch (error) {
            this.log('Error processing WebSocket message:', error);
        }
    }

    configureAccessory(accessory) {
        this.accessories[accessory.UUID] = accessory;
    }

    accessories(callback) {
        let configuredAccessories = Object.values(this.accessories);
        callback(configuredAccessories);
    }
}
