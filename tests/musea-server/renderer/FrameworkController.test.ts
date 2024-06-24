import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {FrameworkController} from "renderer/FrameworkController.js";
import {
    RegisterAppTypeCommand
} from "renderer/receivedCommands/RegisterAppTypeCommand.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {
    ICloseConnection,
    ISendDataToClient
} from "renderer/network/Server.js";
import {MockReceivedCommandFactory} from "mocks/renderer/receivedCommands/MockReceivedCommandFactory.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";
import {MockLogger} from "mocks/renderer/MockLogger.js";
import {SendCommand} from "renderer/sendCommands/SendCommand.js";
import {ConvertNetworkData} from "renderer/network/ConvertNetworkData.js";

let frameworkController: FrameworkController;
let ip: string = "192.168.0.1";
let data: Uint8Array = new Uint8Array([0,10,20,100,20,2,0,1]);
let pathToDataFolder:string = "path/to/data/folder";

let eventEmitter: EventEmitter;

let mockCreateCommand = jest.fn();

let mockReceivedCommandFactory:MockReceivedCommandFactory;
let mockConnectedClients:MockConnectedClients;
let mockPongTimeoutHandler:MockTimeoutHandler;
let mockConnectionTimeoutHandler:MockTimeoutHandler;
let mockLogger:MockLogger;

let callbackSendDataToClientMock:ISendDataToClient = jest.fn();
let callbackCloseConnectionMock:ICloseConnection = jest.fn();

beforeEach(() => {
    mockReceivedCommandFactory = new MockReceivedCommandFactory();
    mockReceivedCommandFactory.createCommand = mockCreateCommand;
    mockReceivedCommandFactory.pathToFiles = pathToDataFolder;

    mockConnectedClients = new MockConnectedClients();
    mockPongTimeoutHandler = new MockTimeoutHandler();
    mockConnectionTimeoutHandler = new MockTimeoutHandler();
    mockLogger = new MockLogger();

    Object.defineProperty(mockConnectedClients, "adminApp", {
        get: jest.fn(()=>{return ip})
    });

    eventEmitter = new EventEmitter();
    jest.spyOn(eventEmitter, 'emit');

    frameworkController = new FrameworkController(eventEmitter,mockConnectedClients, mockPongTimeoutHandler, mockReceivedCommandFactory, mockConnectionTimeoutHandler, mockLogger);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("start() ", ()=>{
   it("should call sendDataToClient if EventEmitter.SEND_COMMAND is emitted - with payload in the command", async ()=>{
       const command:SendCommand = new SendCommand(["network", "ping"], "payload-string");

       await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);
       eventEmitter.emit(EventEmitter.SEND_COMMAND, ip, command)

       expect(callbackSendDataToClientMock).toHaveBeenCalledTimes(1);
       expect(callbackSendDataToClientMock).toHaveBeenCalledWith(ip, ConvertNetworkData.encodeCommand(...command.command, command.payload as string));
   });

    it("should call sendDataToClient if EventEmitter.SEND_COMMAND is emitted - WITHOUT payload in the command", async ()=>{
        const command:SendCommand = new SendCommand(["network", "ping"]);

        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);
        eventEmitter.emit(EventEmitter.SEND_COMMAND, ip, command)

        expect(callbackSendDataToClientMock).toHaveBeenCalledTimes(1);
        expect(callbackSendDataToClientMock).toHaveBeenCalledWith(ip, ConvertNetworkData.encodeCommand(...command.command));
    });

    it("should set the filePath of receivedCommandFactory and call its init-method", async ()=>{
        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);
        expect(mockReceivedCommandFactory.initMediaFileService).toHaveBeenCalledTimes(1);
    });

    it("should call initLightService of receivedCommandFactory", async ()=>{
        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, true);
        expect(mockReceivedCommandFactory.startLightInitSequence).toHaveBeenCalledTimes(1);
    });

    it("EventEmitter.CLOSE_CONNECTION should be called if the pong-command was not received in time", async ()=>{
        mockPongTimeoutHandler.init = jest.fn();
        mockPongTimeoutHandler.init.mockImplementation((time, callback)=>{
            callback();
        });

        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);

        expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(eventEmitter.emit).toHaveBeenCalledWith(EventEmitter.CLOSE_CONNECTION, ip);
    });

    it("EventEmitter.SEND_COMMAND should be called if timeout handler fires", async ()=>{
        mockConnectionTimeoutHandler.init.mockImplementation((time, callback)=>{
            callback();
        });

        //is necesary because in the start() method, the framework controller adds a SEND_COMMAND-listener which would otherwise be triggered unnecesarily
        jest.spyOn(eventEmitter, 'on').mockImplementation(() => {});

        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);

        expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(eventEmitter.emit).toHaveBeenCalledWith(EventEmitter.SEND_COMMAND, ip, expect.anything());
    });

    it("checkConnectionTimeout.stopTimeout and pongTimeoutHandler.resetAndStartTimeout should be called if timeout handler fires", async ()=>{
        mockConnectionTimeoutHandler.init = jest.fn();
        mockConnectionTimeoutHandler.init.mockImplementation((time, callback)=>{
            callback();
        });

        //is necesary because in the start() method, the framework controller adds a SEND_COMMAND-listener which would otherwise be triggered unnecesarily
        jest.spyOn(eventEmitter, 'on').mockImplementation(() => {});

        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);

        expect(mockConnectionTimeoutHandler.stopTimeout).toHaveBeenCalledTimes(1);
        expect(mockPongTimeoutHandler.resetAndStartTimeout).toHaveBeenCalledTimes(1);
    });

    it("should call checkConnectionTimeout.stopTimeout if EventEmitter.CLOSE_CONNECTION is emitted and the closed ip was the connected admin-app", async ()=>{
        await frameworkController.start(pathToDataFolder, callbackSendDataToClientMock, callbackCloseConnectionMock, false);
        eventEmitter.emit(EventEmitter.CLOSE_CONNECTION, ip);
        expect(mockConnectionTimeoutHandler.stopTimeout).toHaveBeenCalledTimes(1);
    });
});

describe("handleReceivedData() ", () => {
    it("should pass the ip and data to the ReceivedCommandFactory", () => {
        let commandMock = {
            execute: jest.fn(),
            ip: ip
        } as Partial<RegisterAppTypeCommand> as RegisterAppTypeCommand;

        mockCreateCommand.mockImplementation(() => {
            return commandMock;
        });

        frameworkController.handleReceivedData(ip, data);

        expect(mockReceivedCommandFactory.createCommand).toHaveBeenCalledTimes(1);
        expect(mockReceivedCommandFactory.createCommand).toHaveBeenCalledWith(ip, data);
    });

    it("should execute the command returned from the command factory, if it is not null", () => {
        let commandMock = {
            execute: jest.fn(),
            ip: ip
        } as Partial<RegisterAppTypeCommand> as RegisterAppTypeCommand;

        mockCreateCommand.mockImplementation(() => {
            return commandMock;
        });

        frameworkController.handleReceivedData(ip, data);

        expect(commandMock.execute).toHaveBeenCalledTimes(1);
    });

    it("should not throw an exception if the command is null", () => {
        mockCreateCommand.mockImplementation(() => {
            return null;
        });

        expect(() => frameworkController.handleReceivedData(ip, data)).not.toThrow();;
    });
});

describe("handleChunkReceived() ", ()=>{
    it("should call resetAndStartTimeout() if the chunk came from the actual admin-app", ()=>{
        frameworkController.handleChunkReceived(ip);
        expect(mockConnectionTimeoutHandler.resetAndStartTimeout).toHaveBeenCalledTimes(1);
    });

    it("should NOT call resetAndStartTimeout() if the chunk came not from the actual admin-app", ()=>{
        frameworkController.handleChunkReceived("other-ip");
        expect(mockConnectionTimeoutHandler.resetAndStartTimeout).toHaveBeenCalledTimes(0);
    });
});


describe("handleClosedConnection() ", ()=>{
    it("should call handleClosedConnection() from receivedCommandFactory", ()=>{
        let mockIp:string = "192.169.2.1"

        frameworkController.handleClosedConnection(mockIp);

        expect(mockReceivedCommandFactory.handleClosedConnection).toHaveBeenCalledTimes(1);
        expect(mockReceivedCommandFactory.handleClosedConnection).toHaveBeenCalledWith(mockIp);
    });
});