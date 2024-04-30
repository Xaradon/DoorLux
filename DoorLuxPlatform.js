'use strict';

const { Platform } = require('homebridge-lib');

class DoorLuxPlatform extends Platform {
    constructor(log, config, api) {
        super(log, config, api);

        // Initialisiere eine Map für die Türzustände
        this.doorStates = new Map();

        // Erstelle den LockMechanism-Service
        this.createLockService();

        // Initialisiere die WebSocket-Verbindung
        this.initWebSocket();
    }

    // Methode zum Erstellen des LockMechanism-Service
    createLockService() {
        const { Service, Characteristic } = this.hap;

        // Erstelle den LockMechanism-Service mit dem angegebenen Namen
        this.service = this.createService(Service.LockMechanism, this.config.name);

        // Definiere die 'get' und 'set' Ereignisse für die Charakteristiken
        this.service.getCharacteristic(Characteristic.LockCurrentState)
            .onGet(this.handleLockCurrentStateGet.bind(this));

        this.service.getCharacteristic(Characteristic.LockTargetState)
            .onGet(this.handleLockTargetStateGet.bind(this))
            .onSet(this.handleLockTargetStateSet.bind(this));
    }

    // Methode zum Initialisieren der WebSocket-Verbindung
    initWebSocket() {
        const WebSocket = require('ws');

        // Erstelle eine WebSocket-Verbindung mit der angegebenen URL
        this.websocket = new WebSocket(this.config.websocketUrl);

        // Definiere die Ereignishandler für die WebSocket-Verbindung
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

    // Ereignishandler für das Abrufen des aktuellen Türzustands
    async handleLockCurrentStateGet() {
        if (this.doorStates.has(this.config.doorID)) {
            const doorState = this.doorStates.get(this.config.doorID).current;
            this.log(`Retrieving current lock state for door ${this.config.doorID}: ${doorState}`);
            return doorState;
        } else {
            this.log(`No state found for door ${this.config.doorID}`);
            throw new Error("No state found for door");
        }
    }

    // Ereignishandler für das Abrufen des Ziel-Türzustands
    async handleLockTargetStateGet() {
        if (this.doorStates.has(this.config.doorID)) {
            const doorState = this.doorStates.get(this.config.doorID).target;
            this.log(`Retrieving target lock state for door ${this.config.doorID}: ${doorState}`);
            return doorState;
        } else {
            this.log(`No target state found for door ${this.config.doorID}`);
            throw new Error("No target state found for door");
        }
    }

    // Ereignishandler für das Setzen des Ziel-Türzustands
    async handleLockTargetStateSet(value) {
        this.log(`Received set target state for door ${this.config.doorID} to: ${value === Characteristic.LockTargetState.SECURED ? 'SECURED' : 'UNSECURED'}`);
        // Da keine Aktion erforderlich ist, bestätigen wir den Befehl sofort
        this.log('Not implemented yet!');
        return;
    }

    // Ereignishandler für eingehende Nachrichten von der WebSocket-Verbindung
    handleWebSocketMessage(message) {
        // Implementiere die Logik zur Verarbeitung von Nachrichten von der WebSocket
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

    // Methode zum Aktualisieren des Türzustands
    updateLockState(doorID, doorState) {
        if (this.config.doorID === doorID) { // Überprüfe, ob die DoorID in der Konfiguration existiert
            const { Characteristic } = this.hap;
            const currentState = this.doorStates.get(doorID).current;
            const targetState = (doorState === 'closed') ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

            // Aktualisiere den Türzustand
            this.doorStates.set(doorID, {
                current: currentState,
                target: targetState
            });

            // Aktualisiere den aktuellen und den Zielzustand, um den neuen Zustand genau widerzuspiegeln
            this.service.getCharacteristic(Characteristic.LockCurrentState)
                .updateValue(targetState);
            this.service.getCharacteristic(Characteristic.LockTargetState)
                .updateValue(targetState);

            this.log(`Door lock state updated to: ${targetState}`);
        } else {
            this.log(`Received update for unconfigured door ID: ${doorID}`);
        }
    }



}

module.exports = DoorLuxPlatform;

/*
module.exports = (homebridge) => {
    homebridge.registerPlatform("homebridge-doorlux", "doorlux", DoorLuxMain);
};*/
