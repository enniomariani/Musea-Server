import {afterEach, describe, it, jest} from "@jest/globals";
import {
    RegisterAppTypeCommand
} from "renderer/receivedCommands/RegisterAppTypeCommand.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    MockSendCommandFactory
} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {MockContentFileStorageService} from "mocks/renderer/fileServices/MockContentFileStorageService.js";

let registerAppTypeCommand:RegisterAppTypeCommand;
let ip:string = "192.168.0.3";
let returnValueAddAdminAppClient:boolean;
let returnValueAddUserAppClient:boolean;

let mockConnectedClients: MockConnectedClients = new MockConnectedClients();
mockConnectedClients.addAdminAppClient.mockImplementation(()=>{return returnValueAddAdminAppClient});
mockConnectedClients.addUserAppClient.mockImplementation(()=>{return returnValueAddUserAppClient});

let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let mockContentFileStorageService:MockContentFileStorageService = new MockContentFileStorageService();

let mockSendCommandFactory: MockSendCommandFactory = new MockSendCommandFactory();
let returnedCommandAccepted:string = "testCommandAccepted";
let returnedCommandAcceptedBlock:string = "testCommandAcceptedBlock";
let returnedCommandDeclined:string = "testCommandDeclined";
let returnedCommandCreateBlock:string = "testCommandBlocked";

const pathToContentsFile:string = "pathToContentsFile";

mockSendCommandFactory.sendClientAccepted.mockImplementation(()=>{return returnedCommandAccepted});
mockSendCommandFactory.sendClientAcceptedButBlock.mockImplementation(()=>{return returnedCommandAcceptedBlock});
mockSendCommandFactory.sendClientRejected.mockImplementation(()=>{return returnedCommandDeclined});
mockSendCommandFactory.sendBlock.mockImplementation(()=>{return returnedCommandCreateBlock});

function initObject(appType:string):void{
    registerAppTypeCommand = new RegisterAppTypeCommand(ip, ["command"], mockConnectedClients,mockEventEmitter,
        mockContentFileStorageService, pathToContentsFile, mockSendCommandFactory, appType);
}

afterEach(() => {
    mockEventEmitter.emit.mockClear();
    mockEventEmitter.on.mockClear();
    mockEventEmitter.off.mockClear();
    jest.clearAllMocks();
});

describe("execute() if appType is TYPE_ADMIN", ()=> {
    it("should add ip to the admin-ips of connectedClients", async () => {
        initObject("admin");

        await registerAppTypeCommand.execute();

        expect(mockConnectedClients.addAdminAppClient).toHaveBeenCalledTimes(1);
        expect(mockConnectedClients.addAdminAppClient).toHaveBeenLastCalledWith(ip);
    });

    it("should emit a sendCommand event to accept the client if addAdminAppClient() returns true", async () => {
        initObject("admin");
        returnValueAddAdminAppClient = true;

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenNthCalledWith( 1, EventEmitter.SEND_COMMAND, ip, returnedCommandAccepted );
    });

    it("should emit a sendCommand event to decline the client if addAdminAppClient() returns false", async () => {
        initObject("admin");
        returnValueAddAdminAppClient = false;

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenLastCalledWith(EventEmitter.SEND_COMMAND, ip, returnedCommandDeclined );
    });

    it("should emit a sendCommand event to block the userApp if addAdminAppClient() returns true AND the contents-file exists (it is the controller)", async () => {
        let ipUserApp:string = "10.100.100.100";
        initObject("admin");
        returnValueAddAdminAppClient = true;

        jest.spyOn(mockConnectedClients, 'userApp', 'get').mockReturnValue(ipUserApp);
        mockContentFileStorageService.fileExists.mockImplementation((path:string)=>{return path === pathToContentsFile});

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
        expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(2, EventEmitter.SEND_COMMAND, ipUserApp, returnedCommandCreateBlock );
    });

    it("should not send a block-call if this is not the controller-app", async () => {
        let ipUserApp:string = "10.100.100.100";
        initObject("admin");
        returnValueAddAdminAppClient = true;

        jest.spyOn(mockConnectedClients, 'userApp', 'get').mockReturnValue(ipUserApp);
        mockContentFileStorageService.fileExists.mockImplementation((path:string)=>{return false});

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    });
});

describe("execute() if appType is TYPE_USER", ()=> {
    it("should add ip to the user-ips of connectedClients", async () => {
        initObject("user");

        await registerAppTypeCommand.execute();

        expect(mockConnectedClients.addUserAppClient).toHaveBeenCalledTimes(1);
        expect(mockConnectedClients.addUserAppClient).toHaveBeenLastCalledWith(ip);
    });

    it("should emit a sendCommand 'registration accepted' event to accept the client if addUserClient() returns true", async () => {
        initObject("user");
        returnValueAddUserAppClient = true;

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( EventEmitter.SEND_COMMAND, ip, returnedCommandAccepted );
    });

    it("should emit a sendCommand 'registration accepted but block' event to accept the client if addUserClient() returns true and there is an admin-app registered", async () => {
        initObject("user");
        returnValueAddUserAppClient = true;

        jest.spyOn(mockConnectedClients, 'adminApp', 'get').mockReturnValue("ip-address admin-app");

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( EventEmitter.SEND_COMMAND, ip, returnedCommandAcceptedBlock );
    });

    it("should emit a sendCommand event to decline the client if addUserClient() returns false", async () => {
        initObject("user");
        returnValueAddUserAppClient = false;

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenLastCalledWith(EventEmitter.SEND_COMMAND, ip, returnedCommandDeclined );
    });
});

describe("execute() if app-type is not USER or ADMIN", ()=>{
    it("should emit the correct event", async ()=>{
        initObject("wrongType");

        await registerAppTypeCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenLastCalledWith(EventEmitter.RECEIVED_INVALID_APP_TYPE, ip, "wrongType");
    });
});