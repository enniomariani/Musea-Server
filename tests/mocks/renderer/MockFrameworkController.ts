import {FrameworkController} from "renderer/FrameworkController.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {MockReceivedCommandFactory} from "mocks/renderer/receivedCommands/MockReceivedCommandFactory.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {MockLogger} from "mocks/renderer/MockLogger.js";

export class MockFrameworkController extends FrameworkController{

    start: jest.Mock
    handleReceivedData: jest.Mock
    handleChunkReceived: jest.Mock
    handleClosedConnection: jest.Mock

    constructor() {
        super(new MockEventEmitter(),new MockConnectedClients(), new MockTimeoutHandler(), new MockReceivedCommandFactory(), new MockTimeoutHandler() ,new MockLogger());
        this.start = jest.fn();
        this.handleReceivedData = jest.fn();
        this.handleChunkReceived = jest.fn();
        this.handleClosedConnection = jest.fn();
    }
}