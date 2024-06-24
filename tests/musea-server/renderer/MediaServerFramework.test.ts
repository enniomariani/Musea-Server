import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {MediaType, MuseaServer} from "renderer/MuseaServer.js";
import {MockMediaFileService} from "mocks/renderer/fileServices/MockMediaFileService.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {MockServer} from "mocks/renderer/network/MockServer.js";
import {MockFrameworkController} from "mocks/renderer/MockFrameworkController.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";

let museaServer: MuseaServer;

let mockDataBinary: ArrayBuffer = new ArrayBuffer(50);
let ip: string = "192.168.2.20";
let pathToDataFolder:string = "path/to/data/folder";

let mockServer: MockServer;
let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let mockMediaFileService:MockMediaFileService = new MockMediaFileService();
let mockFrameworkController: MockFrameworkController = new MockFrameworkController();
let mockConnectedClients: MockConnectedClients = new MockConnectedClients();
let mockTimeoutHandler: MockTimeoutHandler = new MockTimeoutHandler();

beforeEach(() => {
    mockServer = new MockServer();

    mockServer.start.mockImplementation((port: number, callbackNewConnection: Function, callbackData: Function, callBackCloseConnection:Function, callBackChunkReceived:Function) => {
        callbackData(ip, mockDataBinary);
        callBackCloseConnection(ip);
        callBackChunkReceived(ip);
    });

    museaServer = new MuseaServer(mockServer,mockEventEmitter, mockConnectedClients,mockTimeoutHandler, mockMediaFileService, mockFrameworkController);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("start() ", () => {
    it("should call server.start() with the port passed in the config-JSON", async () => {
        let port: number = 6000;
        let config: any = {port: port, lightInitSequence:true};

        await museaServer.start(pathToDataFolder, config);

        expect(mockServer.start).toHaveBeenCalledTimes(1);
        expect(mockServer.start).toHaveBeenLastCalledWith(port, expect.anything(), expect.anything(), expect.anything(), expect.anything());
    });

    it("should call frameWorkController.start() with the function server.sendDataToClient and server.closeConnection as parameter", async () => {
        let config: any = {port: 6000, lightInitSequence:true};

        await museaServer.start(pathToDataFolder, config);

        expect(mockFrameworkController.start).toHaveBeenCalledTimes(1);
        //expect.anything() because the bound methods can not be checked by jest
        expect(mockFrameworkController.start).toHaveBeenCalledWith(pathToDataFolder, expect.anything(), expect.anything(), true);
    });

    it("should call frameWorkController.handleReceivedData() with the correct attributes if the server received data", async () => {
        await museaServer.start(pathToDataFolder);
        expect(mockFrameworkController.handleReceivedData).toHaveBeenCalledTimes(1);
        expect(mockFrameworkController.handleReceivedData).toHaveBeenLastCalledWith(ip, mockDataBinary);
    });

    it("should call frameWorkController.handleChunkReceived() with the correct attributes if the server received a chunk", async () => {
        await museaServer.start(pathToDataFolder);
        expect(mockFrameworkController.handleChunkReceived).toHaveBeenCalledTimes(1);
        expect(mockFrameworkController.handleChunkReceived).toHaveBeenLastCalledWith(ip);
    });

    it("should call frameworkController.handleClosedConnection() with the correct attributes if the server got a closed connection from client", async () => {
        await museaServer.start(pathToDataFolder);
        expect(mockFrameworkController.handleClosedConnection).toHaveBeenCalledTimes(1);
        expect(mockFrameworkController.handleClosedConnection).toHaveBeenLastCalledWith(ip);
    });
});

describe("getMediaType() ", ()=>{
    it("should return the media-type of the passed file-id", ()=>{
        let requestedID:number = 2;
        let correctType:string = "jpeg";

        mockMediaFileService.getMediaTypeForId.mockImplementationOnce((id:number)=>{
            if(id === requestedID)
                return correctType;
        });

        const returnedType:MediaType | null = museaServer.getMediaType(requestedID);

        expect(returnedType).toEqual(correctType);
    });

    it("should return null if the id does not exist in the metadata", ()=>{
        let requestedID:number = 2;

        mockMediaFileService.getMediaTypeForId.mockImplementationOnce((id:number)=>{
            return null;
        });

        const returnedType:MediaType | null = museaServer.getMediaType(requestedID);

        expect(returnedType).toEqual(null);
    });
});

describe("getMediaFileName() ", ()=>{
    it("should return the media-type of the passed file-id", ()=>{
        let requestedID:number = 2;
        let correctFilename:string = "jpeg";

        mockMediaFileService.getFileNameForId.mockImplementationOnce((id:number)=>{
            console.log("TEST: ", id, requestedID, correctFilename)
            if(id === requestedID)
                return correctFilename;
        });

        const returnedType:string | null = museaServer.getMediaFileName(requestedID);

        expect(returnedType).toEqual(correctFilename);
    });

    it("should return null if the id does not exist in the metadata", ()=>{
        let requestedID:number = 2;

        mockMediaFileService.getFileNameForId.mockImplementationOnce((id:number)=>{
            return null;
        });

        const returnedType:string | null = museaServer.getMediaFileName(requestedID);

        expect(returnedType).toEqual(null);
    });
});