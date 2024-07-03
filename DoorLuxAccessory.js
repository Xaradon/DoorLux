import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate';
import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate';

class DoorLuxAccessory extends AccessoryDelegate {
    constructor(platform, doorConfig) {
        const params = {
            name: doorConfig.name,
            id: 'DL-' + doorConfig.doorID,
            manufacturer: 'YourManufacturer',
            model: 'DoorLux',
            category: platform.Accessory.Categories.DoorLock
        };
        super(platform, params);

        this.context.doorID = doorConfig.doorID;

        // Create a LockMechanism Service
        this.lockService = new ServiceDelegate(this, {
            name: doorConfig.name,
            Service: platform.Service.LockMechanism,
            Characteristic: platform.Characteristic
        });

        // Define the 'get' and 'set' events for the characteristics
        this.lockService
            .addCharacteristic(platform.Characteristic.LockCurrentState)
            .on('get', this.handleLockCurrentStateGet.bind(this));

        this.lockService
            .addCharacteristic(platform.Characteristic.LockTargetState)
            .on('get', this.handleLockTargetStateGet.bind(this))
            .on('set', this.handleLockTargetStateSet.bind(this));
    }

    async handleLockCurrentStateGet(callback) {
        const doorState = this.platform.doorStates.get(this.context.doorID)?.current;
        this.platform.log(`Retrieving current lock state for door ${this.context.doorID}: ${doorState}`);
        callback(null, doorState);
    }

    async handleLockTargetStateGet(callback) {
        const doorState = this.platform.doorStates.get(this.context.doorID)?.target;
        this.platform.log(`Retrieving target lock state for door ${this.context.doorID}: ${doorState}`);
        callback(null, doorState);
    }

    async handleLockTargetStateSet(value, callback) {
        this.platform.log(`Received set target state for door ${this.context.doorID} to: ${value === this.platform.Characteristic.LockTargetState.SECURED ? 'SECURED' : 'UNSECURED'}`);
        // As no action is required, confirm the command immediately
        this.platform.log('Not implemented yet!');
        callback();
    }
}

export { DoorLuxAccessory };
