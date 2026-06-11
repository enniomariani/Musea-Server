import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {
    MainSocketServer,
    IOnClientConnected,
    IOnDataReceived,
    IOnConnectionClosed
} from "main/MainSocketServer.js";

let server: MainSocketServer;

let mockIp:string = "192.168.0.1";
let mockData:string = "test-network-data";
let encoder:TextEncoder = new TextEncoder();
let mockDataBinary:Buffer = Buffer.from(encoder.encode(mockData));
let mockCloseConnection:any = jest.fn();
let mockSendDataFunc:any = jest.fn();
let logSpy:any = jest.spyOn(global.console, 'error');

let closeConnection:boolean = false;

jest.mock('ws', () => {
    class MockWebSocket {
        static OPEN = 1; // WebSocket.OPEN
        readyState: number;
        on: jest.Mock<(event: string, callback: (...args: any[]) => void) => void>;
        off: jest.Mock;
        close: jest.Mock;
        send: jest.Mock;

        constructor() {
            this.readyState = MockWebSocket.OPEN;
            this.on = jest.fn<(event: string, callback: (...args: any[]) => void) => void>().
            mockImplementation((event, callback: Function) => {
                if (event === 'message')
                    callback(mockDataBinary );
                else if(event === 'close' && closeConnection) {
                    closeConnection = false;
                    callback(mockIp);
                }
            });
            this.off = jest.fn();
            this.close = mockCloseConnection;
            this.send = mockSendDataFunc;
        }
    }

    // Define MockIncomingMessage with a mock IP address
    class MockIncomingMessage {
        socket: {
            remoteAddress: string;
        };

        constructor(ip: string) {
            this.socket = {
                remoteAddress: ip,
            };
        }
    }

    // Mock WebSocketServer
    const MockWebSocketServer = jest.fn().mockImplementation(() => {
        return {
            on: jest.fn<(event: string, callback: (...args: any[]) => void) => void>()
                .mockImplementation((event, callback: Function) => {
                if (event === 'connection') {
                    callback(new MockWebSocket(), new MockIncomingMessage(mockIp));
                }
            }),
        };
    });

    return {
        WebSocket: MockWebSocket,
        WebSocketServer: MockWebSocketServer,
    };
});


beforeEach(() => {
    server = new MainSocketServer();
});

afterEach(() =>{
   jest.clearAllMocks();
});

describe("start() should ", () => {
    it("call the callback onClientConnected when a client connected and pass the correct IP", () => {
        let clientConnectedCallback: IOnClientConnected = jest.fn();

        server.start(8001, clientConnectedCallback, jest.fn(), jest.fn());

        expect(clientConnectedCallback).toHaveBeenCalledTimes(1);
        expect(clientConnectedCallback).toHaveBeenCalledWith(mockIp);
    });

    it("call the callback onMessageReceived when a client sent data and pass the data and the ip to this callback", () => {
        let onMessageReceived: IOnDataReceived = jest.fn();

        server.start(8001, jest.fn(), onMessageReceived, jest.fn());

        expect(onMessageReceived).toHaveBeenCalledTimes(1);
        expect(onMessageReceived).toHaveBeenCalledWith(mockIp,mockDataBinary);
    });

    it("call the callback onConnectionClosed when a client closed the connection", () => {
        let onConnectionClosedCallback: IOnConnectionClosed = jest.fn();
        closeConnection = true;

        server.start(8001, jest.fn(), jest.fn(), onConnectionClosedCallback);

        expect(onConnectionClosedCallback).toHaveBeenCalledTimes(1);
        expect(onConnectionClosedCallback).toHaveBeenCalledWith(mockIp);
    });
});

describe("sendDataToClient() should ", () => {
    it("call send() of websocket with the passed data", () => {
        server.start(8001, jest.fn(), jest.fn(), jest.fn());
        server.sendDataToClient(mockIp, mockDataBinary);

        expect(mockSendDataFunc).toHaveBeenCalledTimes(1);
        expect(mockSendDataFunc).toHaveBeenCalledWith(mockDataBinary);
    });

    it("return true if the connection was open", () => {
        server.start(8001, jest.fn(), jest.fn(), jest.fn());
        const response:boolean = server.sendDataToClient(mockIp, mockDataBinary);
        expect(response).toBe(true);
    });

    it("return false if the connection is not open", () => {
        const response:boolean = server.sendDataToClient(mockIp, mockDataBinary);
        expect(response).toBe(false);
    });

    it("print an error if connection is not open", () => {
        server.sendDataToClient(mockIp, mockDataBinary);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });
});

describe("closeConnection() should ", () => {
    it("close a connection if it is open", async () => {
        server.start(8001, jest.fn(), jest.fn(), jest.fn());
        await server.closeConnection(mockIp);
        expect(mockCloseConnection).toHaveBeenCalledTimes(1);
    });

    it("print an error if connection was never open", () => {
        server.closeConnection(mockIp);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("print an error if connection is already closed", () => {
        server.start(8001, jest.fn(), jest.fn(), jest.fn());
        server.closeConnection(mockIp);
        server.closeConnection(mockIp);

        expect(logSpy).toHaveBeenCalledTimes(1);
    });
});