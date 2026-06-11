import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {IOnConnectionClosed, IOnNewConnection, Server} from "renderer/network/Server.js";
import {IOnDataReceived} from "main/MainSocketServer.js";

let server: Server;
let serverPort: number = 8001;
let ip: string = "192.168.0.1";
let dataWithInOneChunk: Uint8Array = new Uint8Array([0x01, 0x00, 0x03, 0xFF, 0x1A]);
let dataInOneChunkWithoutChunkInfo: Uint8Array = new Uint8Array([0x03, 0xFF, 0x1A]);

const backEndServerMock: jest.Mocked<IBackendServer> = {
    startServer: jest.fn(),
    sendDataToClient: jest.fn(),
    closeConnection: jest.fn()
}
const mockDataFromClient: jest.MockedFunction<(callback: IOnDataReceivedFromBackend) => void> = jest.fn();
const mockClientClosed: jest.MockedFunction<(callback: IOnClientClosedFromBackend) => void> = jest.fn();

const mockClientConnected: jest.MockedFunction<(callback: IOnClientConnectedFromBackend) => void> = jest.fn();
const backEndServerEventMock: jest.Mocked<IBackendServerEvents> = {
    clientConnected: mockClientConnected,
    dataFromClient: mockDataFromClient,
    clientClosed: mockClientClosed
}

let logSpy: any = jest.spyOn(global.console, 'error');

beforeEach(() => {
    server = new Server(backEndServerMock, backEndServerEventMock);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("start() should ", () => {
    it("call startServer of backend Server with the port argument", () => {
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        expect(backEndServerMock.startServer).toHaveBeenCalledTimes(1);
        expect(backEndServerMock.startServer).toHaveBeenCalledWith(serverPort);
    });

    it("should only start the server once event if start() is called multiple times", () => {
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        expect(backEndServerMock.startServer).toHaveBeenCalledTimes(1);
    });

    it("should print an error if the server was already started", () => {
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("should call the passed onClientConnected callback when a client connected", () => {
        let callback: jest.Mocked<IOnNewConnection> = jest.fn();

        mockClientConnected.mockImplementationOnce((backendCallback: IOnClientConnectedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallback(mockEvent, ip, mockData);
        });

        server.start(serverPort, callback, jest.fn(), jest.fn(), jest.fn());

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith( ip);
    });

    it("should call the passed onClientClosed callback when a client disconnected", () => {
        let callback: jest.Mocked<IOnConnectionClosed> = jest.fn();

        mockClientClosed.mockImplementationOnce((backendCallback: IOnClientClosedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip);
        });

        server.start(serverPort, jest.fn(), jest.fn(), callback, jest.fn());

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith( ip);
    });

    it("should reset the chunks-variables when a client disconnected", () => {
        mockClientClosed.mockImplementationOnce((backendCallback: IOnClientClosedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip);
        });

        server["_receivingChunksFromThisIpAddressAtTheMoment"] = ip;

        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());

        expect(server["_receivingChunksFromThisIpAddressAtTheMoment"]).toBe(null)
        expect(server["_numChunks"]).toBe(null)
    });

    it("should allow to reconnect if a client was closed before", () => {
        let callback: jest.Mocked<IOnConnectionClosed> = jest.fn();
        let backendCallBackClientConnected:(evt:Event, ip:string, data:Uint8Array) => void = () => {};

        mockClientConnected.mockImplementationOnce((backendCallback: IOnClientConnectedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallBackClientConnected = backendCallback;
            backendCallback(mockEvent, ip, mockData);
        });

        mockClientClosed.mockImplementationOnce((backendCallback: IOnClientClosedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallback(mockEvent, ip);
            backendCallBackClientConnected(mockEvent, ip, mockData);
        });

        server.start(serverPort, callback, jest.fn(), jest.fn(), jest.fn());

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith( ip);
    });

    it("should do nothing and print an error if a client tries to connect twice", () => {
        let callback: jest.Mocked<IOnNewConnection> = jest.fn();

        mockClientConnected.mockImplementationOnce((backendCallback: IOnClientConnectedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallback(mockEvent, ip, mockData);
            backendCallback(mockEvent, ip, mockData);
        });

        server.start(serverPort, callback, jest.fn(), jest.fn(), jest.fn());

        expect(callback).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("should call the passed onDataReceived callback when a client sent data with one chunk", () => {
        let callback = jest.fn();

        mockDataFromClient.mockImplementationOnce((backendCallback: IOnDataReceivedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip, dataWithInOneChunk);
        });

        server.start(serverPort, jest.fn(), callback, jest.fn(), jest.fn());

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith( ip, dataInOneChunkWithoutChunkInfo);
    });

    it("should call the passed onDataReceived callback when a client sent data with two chunks and one time the onChunkReceived", () => {
        const dataWithInTwoChunks: Uint8Array = new Uint8Array([0x02, 0x00, 0x03, 0xFF, 0x1A]);
        const secondChunkOfData: Uint8Array = new Uint8Array([0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
        const completeDataWithoutChunkInfo: Uint8Array = new Uint8Array([0x03, 0xFF, 0x1A, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00]);

        let callback = jest.fn();
        let chunkCallback: jest.Mock = jest.fn();

        mockDataFromClient.mockImplementationOnce((backendCallback: IOnDataReceivedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip, dataWithInTwoChunks);
            backendCallback(mockEvent, ip, secondChunkOfData);
        });

        server.start(serverPort, jest.fn(), callback, jest.fn(), chunkCallback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith( ip, completeDataWithoutChunkInfo);
        expect(chunkCallback).toHaveBeenCalledTimes( 1);
        expect(chunkCallback).toHaveBeenCalledWith( ip);
    });

    it("should call the passed onDataReceived callback when a client sent data with three chunks and two times the onChunkReceived", () => {
        const dataWithInThreeChunks: Uint8Array = new Uint8Array([0x03, 0x00, 0x03, 0xFF, 0x1A]);
        const secondChunkOfData: Uint8Array = new Uint8Array([0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
        const thirdChunkOfData: Uint8Array = new Uint8Array([0x11, 0x11, 0x11, 0x22, 0x22, 0x22]);
        const completeDataWithoutChunkInfo: Uint8Array = new Uint8Array([0x03, 0xFF, 0x1A, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0x11, 0x11, 0x11, 0x22, 0x22, 0x22]);

        let callback = jest.fn();
        let chunkCallback: jest.Mock = jest.fn();

        mockDataFromClient.mockImplementationOnce((backendCallback: IOnDataReceivedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip, dataWithInThreeChunks);
            backendCallback(mockEvent, ip, secondChunkOfData);
            backendCallback(mockEvent, ip, thirdChunkOfData);
        });

        server.start(serverPort, jest.fn(), callback, jest.fn(), chunkCallback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith( ip, completeDataWithoutChunkInfo);
        expect(chunkCallback).toHaveBeenCalledTimes( 2);
        expect(chunkCallback).toHaveBeenCalledWith( ip);
    });

    it("should call the passed onDataReceived callback two times when a client sent data with two chunks and after that with one chunk", () => {
        const dataWithInTwoChunks: Uint8Array = new Uint8Array([0x02, 0x00, 0x03, 0xFF, 0x1A]);
        const secondChunkOfData: Uint8Array = new Uint8Array([0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
        const completeDataWithoutChunkInfo: Uint8Array = new Uint8Array([0x03, 0xFF, 0x1A, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00]);

        let callback = jest.fn();

        mockDataFromClient.mockImplementationOnce((backendCallback: IOnDataReceivedFromBackend) => {
            const mockEvent = {} as Event;
            backendCallback(mockEvent, ip, dataWithInTwoChunks);
            backendCallback(mockEvent, ip, secondChunkOfData);
            backendCallback(mockEvent, ip, dataWithInOneChunk);
        });

        server.start(serverPort, jest.fn(), callback, jest.fn(), jest.fn());

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, ip, completeDataWithoutChunkInfo);
        expect(callback).toHaveBeenNthCalledWith( 2,ip, dataInOneChunkWithoutChunkInfo);
    });
});

describe("sendDataToClient() should ", () => {
    it("print an error and do not send the data if the connection is not open", () => {
        server.sendDataToClient(ip, dataWithInOneChunk);
        expect(backEndServerMock.sendDataToClient).toHaveBeenCalledTimes(0);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("pass the data to the backend server", () => {
        mockClientConnected.mockImplementationOnce((backendCallback: IOnClientConnectedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallback(mockEvent, ip, mockData);
        });

        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());

        server.sendDataToClient(ip, dataWithInOneChunk);

        expect(backEndServerMock.sendDataToClient).toHaveBeenCalledTimes(1);
        expect(backEndServerMock.sendDataToClient).toHaveBeenCalledWith( ip, dataWithInOneChunk);
    });
});

describe("closeConnection() should ", () => {
    it("print an error if the ip is not connected", () => {
        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        server.closeConnection(ip);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("call closeConnection() from backend if the connection is open", () => {
        mockClientConnected.mockImplementationOnce((backendCallback: IOnClientConnectedFromBackend) => {
            const mockEvent = {} as Event;
            const mockData = new Uint8Array([0x00, 0xFF, 0xEF]);
            backendCallback(mockEvent, ip, mockData);
        });

        server.start(serverPort, jest.fn(), jest.fn(), jest.fn(), jest.fn());
        server.closeConnection(ip);

        expect(backEndServerMock.closeConnection).toHaveBeenCalledTimes(1);
        expect(backEndServerMock.closeConnection).toHaveBeenCalledWith(ip);
    });
});