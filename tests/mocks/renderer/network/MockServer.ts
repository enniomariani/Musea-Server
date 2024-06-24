import {Server} from "renderer/network/Server.js";

const backEndServer: jest.Mocked<IBackendServer> = {
    startServer: jest.fn(),
    sendDataToClient: jest.fn(),
    closeConnection: jest.fn()
}

const backEndServerEvents: jest.Mocked<IBackendServerEvents> = {
    clientClosed: jest.fn(),
    clientConnected: jest.fn(),
    dataFromClient: jest.fn()
}

export class MockServer extends Server{

    start: jest.Mock
    sendDataToClient: jest.Mock
    closeConnection: jest.Mock

    constructor() {
        super(backEndServer, backEndServerEvents);
        this.start = jest.fn();
        this.sendDataToClient = jest.fn();
        this.closeConnection = jest.fn();
    }
}