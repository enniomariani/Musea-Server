import {ReceivedCommandFactory} from "renderer/ReceivedCommandFactory.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {MockMediaFileService} from "mocks/renderer/fileServices/MockMediaFileService.js";
import {MockContentFileStorageService} from "mocks/renderer/fileServices/MockContentFileStorageService.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {MockLightService} from "mocks/renderer/lightService/MockLightService.js";
import {MockSendCommandFactory} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";

export class MockReceivedCommandFactory extends ReceivedCommandFactory{

    initMediaFileService: jest.Mock
    startLightInitSequence: jest.Mock
    handleClosedConnection: jest.Mock
    createCommand: jest.Mock

    constructor() {
        super(new MockEventEmitter(), new MockMediaFileService(), new MockConnectedClients()
            ,new MockTimeoutHandler(), new MockContentFileStorageService(),
            new MockLightService(), new MockSendCommandFactory());

        this.initMediaFileService = jest.fn();
        this.startLightInitSequence = jest.fn();
        this.handleClosedConnection = jest.fn();
        this.createCommand = jest.fn();
    }
}