import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {
    MockSendCommandFactory
} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {
    CheckRegistrationStateCommand
} from "renderer/receivedCommands/CheckRegistrationStateCommand.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";


let checkRegistrationStateCommand:CheckRegistrationStateCommand;
let ip:string = "192.168.0.3";

let mockConnectedClients: MockConnectedClients;
let mockEventEmitter: MockEventEmitter;

let mockSendCommandFactory: MockSendCommandFactory = new MockSendCommandFactory();
let returnedCommandYes:string = "testSendCommandYes";
let returnedCommandNo:string = "testSendCommandNo";

mockSendCommandFactory.sendRegistrationIsPossible.mockImplementation(()=>{return returnedCommandYes});
mockSendCommandFactory.sendRegistrationNotPossible.mockImplementation(()=>{return returnedCommandNo});

beforeEach(() => {
    mockConnectedClients = new MockConnectedClients();
    mockEventEmitter = new MockEventEmitter();
});

afterEach(() => {
    mockEventEmitter.emit.mockClear();
    mockEventEmitter.on.mockClear();
    mockEventEmitter.off.mockClear();
    jest.clearAllMocks();
});

function initObject():void{
    checkRegistrationStateCommand = new CheckRegistrationStateCommand(ip, ["command"], mockConnectedClients,
        mockEventEmitter, mockSendCommandFactory);

}

describe("execute() ", ()=> {
    it("should emit a sendCommand event with a YES command if no admin-app is connected", () => {
        mockConnectedClients = Object.defineProperty(mockConnectedClients, 'adminApp', {
            get: jest.fn(() => null), // Mock return value
        });

        initObject();

        checkRegistrationStateCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( EventEmitter.SEND_COMMAND, ip, returnedCommandYes );
    });

    it("should emit a sendCommand event with a YES command if the connecting admin-app is already connected", () => {
        mockConnectedClients = Object.defineProperty(mockConnectedClients, 'adminApp', {
            get: jest.fn(() => ip), // Mock return value
        });

        initObject();

        checkRegistrationStateCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( EventEmitter.SEND_COMMAND, ip, returnedCommandYes );
    });

    it("should emit a sendCommand event with a NO command if an admin-app is connected", () => {
        Object.defineProperty(mockConnectedClients, 'adminApp', {
            get: jest.fn(() => '192.168.0.30'), // Mock return value
        });
        initObject();

        checkRegistrationStateCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( EventEmitter.SEND_COMMAND, ip, returnedCommandNo );
    });
});