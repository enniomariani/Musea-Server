import {afterEach, beforeEach, describe, it, jest, test} from "@jest/globals";
import {
    ReceivedCommandFactory
} from "renderer/ReceivedCommandFactory.js";
import {PingCommand} from "renderer/receivedCommands/PingCommand.js";
import {InvalidCommand} from "renderer/receivedCommands/InvalidCommand.js";
import {
    RegisterAppTypeCommand
} from "renderer/receivedCommands/RegisterAppTypeCommand.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    PutContentFileCommand
} from "renderer/receivedCommands/PutContentFileCommand.js";
import {
    PutMediaFileCommand
} from "renderer/receivedCommands/PutMediaFileCommand.js";
import {
    MockContentFileStorageService
} from "mocks/renderer/fileServices/MockContentFileStorageService.js";
import {ConvertNetworkData} from "renderer/network/ConvertNetworkData.js";
import {
    GetContentFileCommand
} from "renderer/receivedCommands/GetContentFileCommand.js";
import {
    MockMediaFileService
} from "mocks/renderer/fileServices/MockMediaFileService.js";
import {
    MediaFileService
} from "renderer/fileServices/MediaFileService.js";
import {MediaCommand} from "renderer/receivedCommands/MediaCommand.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";
import {
    CloseConnectionCommand
} from "renderer/receivedCommands/CloseConnectionCommand.js";
import {
    DeleteMediaFileCommand
} from "renderer/receivedCommands/DeleteMediaFileCommand.js";
import {SystemCommand} from "renderer/receivedCommands/SystemCommand.js";
import {LightCommand} from "renderer/receivedCommands/LightCommand.js";
import {MockLightService} from "mocks/renderer/lightService/MockLightService.js";
import {
    CheckRegistrationStateCommand
} from "renderer/receivedCommands/CheckRegistrationStateCommand.js";
import {PongCommand} from "renderer/receivedCommands/PongCommand.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {MockSendCommandFactory} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";
import {IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";
import {MediaType} from "renderer/MuseaServer.js";

let receivedCommandFactory: ReceivedCommandFactory;
let ip: string = "192.168.2.2";
let filePath:string = "path/to/file";

const imageData: Uint8Array = new Uint8Array([0x01, 0x00, 0x02, 0xFF]);

jest.mock('renderer/network/ConvertNetworkData.js');

let mockDecodeCommand = jest.fn((data: Uint8Array):(string | Uint8Array)[]=>{
    return [""];
});

let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let mockContentFileService: MockContentFileStorageService = new MockContentFileStorageService();
let mockMediaFileService: MockMediaFileService = new MockMediaFileService();
let mockConnectedClients: MockConnectedClients = new MockConnectedClients();
let mockLightService:MockLightService = new MockLightService();
let mockTimeOutHandler:MockTimeoutHandler = new MockTimeoutHandler();
let mockSendCommandFactory:MockSendCommandFactory = new MockSendCommandFactory();


beforeEach(() => {
    receivedCommandFactory = new ReceivedCommandFactory(mockEventEmitter,mockMediaFileService,mockConnectedClients,  mockTimeOutHandler,mockContentFileService , mockLightService, mockSendCommandFactory);
    receivedCommandFactory.pathToFiles = filePath;
    ConvertNetworkData.decodeCommand = mockDecodeCommand;
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("initMediaFileService() ", ()=>{
   it("should call initMetaData of the mediaFileService and pass the correct path", ()=>{
       receivedCommandFactory.initMediaFileService();
       expect(mockMediaFileService.initMetaData).toHaveBeenCalledTimes(1);
       expect(mockMediaFileService.initMetaData).toHaveBeenCalledWith(filePath + ReceivedCommandFactory.FOLDER_NAME_MEDIA + "\\" + ReceivedCommandFactory.FILE_NAME_METADATA_FILE);
   });
});

describe("initLightService() ", ()=>{
    it("should call initLightService of the lightService", async ()=>{
        await receivedCommandFactory.startLightInitSequence();
        expect(mockLightService.startLightInitSequence).toHaveBeenCalledTimes(1);
    });

    it("should call checkComPortState of the lightService", async ()=>{
        await receivedCommandFactory.startLightInitSequence();
        expect(mockLightService.checkComPortState).toHaveBeenCalledTimes(1);
    });
});

describe("handleClosedConnection() ", ()=>{
    Object.defineProperty(mockConnectedClients, 'adminApp', {
        get: jest.fn(() => '192.168.2.1'), // Mock return value
    });

    it("should remove the ip from the connectedClients if it was added before", ()=>{
        let mockIp:string = "192.169.2.1";
        mockConnectedClients.clientIsRegistered.mockReturnValueOnce(true);

        receivedCommandFactory.handleClosedConnection(mockIp);

        expect(mockConnectedClients.removeClient).toHaveBeenCalledTimes(1);
        expect(mockConnectedClients.removeClient).toHaveBeenCalledWith(mockIp);
    });

    it("should not remove the ip from the connectedClients if it was not added before", ()=>{
        let mockIp:string = "192.169.2.3";
        mockConnectedClients.clientIsRegistered.mockReturnValueOnce(false);

        receivedCommandFactory.handleClosedConnection(mockIp);

        expect(mockConnectedClients.removeClient).toHaveBeenCalledTimes(0);
    });

    it("fire CLIENT_ADMIN_APP_CLOSED_CONNECTION event when the closed connection-ip is the connected admin-app", ()=>{
        let mockIp:string = "192.168.2.1";

        receivedCommandFactory.handleClosedConnection(mockIp);

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( MockEventEmitter.CLIENT_ADMIN_APP_CLOSED_CONNECTION);
    });

    it("send unblock-command to a connected user-app when the closed connection-ip is the connected admin-app", ()=>{
        let mockIp:string = "192.168.2.1";
        const userAppIp:string = "ip of user-app";
        let command:Uint8Array = new Uint8Array([0x00, 0x12, 0x33]);

        Object.defineProperty(mockConnectedClients, 'userApp', {
            get: jest.fn(() => userAppIp), // Mock return value
        });

        mockSendCommandFactory.sendUnBlock.mockReturnValueOnce(command);

        receivedCommandFactory.handleClosedConnection(mockIp);

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
        expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, EventEmitter.SEND_COMMAND, userAppIp, command)
    });

    it("should NOT fire CLIENT_ADMIN_APP_CLOSED_CONNECTION event when the closed connection-ip is not the connected admin-app", ()=>{
        let mockIp:string = "192.168.2.20";
        receivedCommandFactory.handleClosedConnection(mockIp);
        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);
    });
});

describe('createCommand(): ', () => {

    const cases = [

        //-- commands that should return a CloseConnectionCommand, because the client is not registered:
        {
            clientIsRegistered: false,
            dataParts: ["media", "put", "mp4", imageData],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, putting a media should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["contents", "put", "JSON as string"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, putting contents file should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["media", "control", "play", "0"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, receiving a media control should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["media", "delete", "0"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, receiving a media delete command should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["system", "volume", "mute"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, sending system/volume/mute should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["system", "volume", "0.3"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, sending system/volume/0.3 should return a CloseConnectionCommand command"
        },
        {
            clientIsRegistered: false,
            dataParts: ["light", "preset", "0"],
            expectedCommand: CloseConnectionCommand,
            description: "if the client is not registered, sending light/preset/0 should return a CloseConnectionCommand command"
        },

        //-- all other commands
        {
            clientIsRegistered: true,
            dataParts: [ConvertNetworkData.INTERPRETATION_ERROR],
            expectedCommand: InvalidCommand,
            description: "ConvertNetworkData.INTERPRETATION_ERROR should return an InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["xxxyyy"],
            expectedCommand: InvalidCommand,
            description: "data 'xxxyyy' should return an InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["network"],
            expectedCommand: InvalidCommand,
            description: "data 'network0' should return an InvalidCommand"
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "ping"],
            expectedCommand: PingCommand,
            description: "data 'network/ping' should return a PingCommand"
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "pong"],
            expectedCommand: PongCommand,
            description: "data 'network/pong' should return a PongCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["network", "register"],
            expectedCommand: InvalidCommand,
            description: "data 'network,register' should return an InvalidCommand"
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "register", "admin"],
            expectedCommand: RegisterAppTypeCommand,
            description: "data 'network,register,admin' should return a RegisterAppTypeCommand",
            extraAssertions: (command: IReceivedCommand) => {
                let registerAppCommand: RegisterAppTypeCommand = command as RegisterAppTypeCommand;
                expect(registerAppCommand.appType).toBe(RegisterAppTypeCommand.TYPE_ADMIN);
            },
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "register", "user"],
            expectedCommand: RegisterAppTypeCommand,
            description: "data 'network0register0user' should return a RegisterAppTypeCommand",
            extraAssertions: (command: IReceivedCommand) => {
                let registerAppCommand: RegisterAppTypeCommand = command as RegisterAppTypeCommand;
                expect(registerAppCommand.appType).toBe(RegisterAppTypeCommand.TYPE_USER);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["network", "register", "user", "usernameX", "fithpart"],
            expectedCommand: InvalidCommand,
            description: "data parts should return an InvalidCommand because there are 5 parts instead of 4"
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "disconnect"],
            expectedCommand: CloseConnectionCommand,
            description: "data parts network, disconnect should return a CloseConnectionCommand"
        },
        {
            clientIsRegistered: false,
            dataParts: ["network", "isRegistrationPossible"],
            expectedCommand: CheckRegistrationStateCommand,
            description: "data parts should return a CheckRegistrationStateCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media"],
            expectedCommand: InvalidCommand,
            description: "data 'media' should return a InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put"],
            expectedCommand: InvalidCommand,
            description: "data 'media,put' should return an InvalidCommand because no file-data is specified"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put", "JSON as string"],
            expectedCommand: InvalidCommand,
            description: "data 'media,put,JSON as string' should return an InvalidCommand, because the fileData does not start with the magic byte"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put", "xyyy", imageData],
            expectedCommand: InvalidCommand,
            description: "data 'media,put,xyyy,00x00112233' should return an InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put", "jpeg", imageData],
            expectedCommand: PutMediaFileCommand,
            description: "data 'media,put,jpeg,00x00112233' should return a PutMediaFileCommand and the path and media-type should be set correctly",
            extraAssertions: (command: IReceivedCommand) => {
                let putMediaFileCommand: PutMediaFileCommand = command as PutMediaFileCommand;
                expect(putMediaFileCommand.folderPath).toBe(filePath + ReceivedCommandFactory.FOLDER_NAME_MEDIA);
                expect(putMediaFileCommand.mediaType).toBe(MediaType.JPEG);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put", "png", imageData],
            expectedCommand: PutMediaFileCommand,
            description: "data 'media,put,png,00x00112233' should return a PutMediaFileCommand and the path and media-type should be set correctly",
            extraAssertions: (command: IReceivedCommand) => {
                let putMediaFileCommand: PutMediaFileCommand = command as PutMediaFileCommand;
                expect(putMediaFileCommand.folderPath).toBe(filePath + ReceivedCommandFactory.FOLDER_NAME_MEDIA);
                expect(putMediaFileCommand.mediaType).toBe(MediaType.PNG);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "put", "mp4", imageData],
            expectedCommand: PutMediaFileCommand,
            description: "data 'media,put,mp4,00x00112233' should return a PutMediaFileCommand and the path and media-type should be set correctly",
            extraAssertions: (command: IReceivedCommand) => {
                let putMediaFileCommand: PutMediaFileCommand = command as PutMediaFileCommand;
                expect(putMediaFileCommand.folderPath).toBe(filePath + ReceivedCommandFactory.FOLDER_NAME_MEDIA);
                expect(putMediaFileCommand.mediaType).toBe(MediaType.MP4);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "delete", "20"],
            expectedCommand: DeleteMediaFileCommand,
            description: "data 'media,delete,20' should return a DeleteMediaFileCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["contents"],
            expectedCommand: InvalidCommand,
            description: "data 'contents' should return a InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["contents", "put"],
            expectedCommand: InvalidCommand,
            description: "data 'contents,put' should return an InvalidCommand because no file-data is specified"
        },
        {
            clientIsRegistered: false,
            dataParts: ["contents", "get"],
            expectedCommand: GetContentFileCommand,
            description: "data 'contents,get' should return a GetContentFileCommand with a filePath set",
            extraAssertions: (command: IReceivedCommand) => {
                let getContentFileCommand: GetContentFileCommand = command as GetContentFileCommand;
                expect(getContentFileCommand.filePath).toBe(filePath + ReceivedCommandFactory.FILE_NAME_CONTENT_FILE);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["contents", "put", "JSON as string"],
            expectedCommand: PutContentFileCommand,
            description: "data 'contents,put,JSON as string' should return an PutContentFileCommand",
            extraAssertions: (command: IReceivedCommand) => {
                let putContentFileCommand: PutContentFileCommand = command as PutContentFileCommand;
                expect(putContentFileCommand.filePath).toBe(filePath + ReceivedCommandFactory.FILE_NAME_CONTENT_FILE);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["contents", "put", imageData],
            expectedCommand: InvalidCommand,
            description: "data 'contents,put,0x00112233' should return an InvalidCommand, because the fileData should be a string and not binary data"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "control", "play", "0"],
            expectedCommand: MediaCommand,
            description: "data 'media,control,play, 0' should return a MediaCommand with the command 'play0'",
            extraAssertions: (command: IReceivedCommand) => {
                let mediaCommand: MediaCommand = command as MediaCommand;
                expect(mediaCommand.command).toEqual(["play", "0"]);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "control", "play0"],
            expectedCommand: MediaCommand,
            description: "data 'media,control,play0' should return a MediaCommand with the command 'play0' (its invalid but should not be checked in this class but in the client using the musea-server)",
            extraAssertions: (command: IReceivedCommand) => {
                let mediaCommand: MediaCommand = command as MediaCommand;
                expect(mediaCommand.command).toEqual(["play0"]);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "control", imageData],
            expectedCommand: InvalidCommand,
            description: "data 'media,control,0x00112233' should return an InvalidCommand, because the third data-element must be a string"
        },
        {
            clientIsRegistered: true,
            dataParts: ["media", "control", "play", imageData],
            expectedCommand: InvalidCommand,
            description: "data 'media,control,play, 0x00FF212' should return a InvalidCommand (because the fourth part is not valid)"
        },
        {
            clientIsRegistered: true,
            dataParts: ["system", "volume"],
            expectedCommand: InvalidCommand,
            description: "system/volume, should return an InvalidCommand"
        },
        {
            clientIsRegistered: true,
            dataParts: ["system", "volume", "mute"],
            expectedCommand: SystemCommand,
            description: "system/volume/mute, should return a SystemCommand with the command volume/mute",
            extraAssertions: (command: IReceivedCommand) => {
                let mediaCommand: MediaCommand = command as MediaCommand;
                expect(mediaCommand.command).toEqual(["volume", "mute"]);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["system", "volume", "set", "0.1"],
            expectedCommand: SystemCommand,
            description: "system/set/0.1, should return a SystemCommand with the command volume/set/0.1",
            extraAssertions: (command: IReceivedCommand) => {
                let mediaCommand: MediaCommand = command as MediaCommand;
                expect(mediaCommand.command).toEqual(["volume", "set", "0.1"]);
            },
        },
        {
            clientIsRegistered: true,
            dataParts: ["light", "preset", "1"],
            expectedCommand: LightCommand,
            description: "light/preset/1, should return a LightCommand with the command preset/1",
            extraAssertions: (command: IReceivedCommand) => {
                let lightCommand: LightCommand = command as LightCommand;
                expect(lightCommand.command).toEqual(["preset", "1"]);
            },
        }
    ];

    test.each(cases)('$description', ({clientIsRegistered, dataParts, expectedCommand, extraAssertions}) => {
        let mockUint8Array:Uint8Array = new Uint8Array([0,10,30,7,1])
        mockDecodeCommand.mockReturnValue(dataParts);
        mockConnectedClients.clientIsRegistered.mockReturnValue(clientIsRegistered);

        const command: IReceivedCommand | null = receivedCommandFactory.createCommand(ip, mockUint8Array);

        expect(mockDecodeCommand).toHaveBeenCalledTimes(1);
        expect(mockDecodeCommand).toHaveBeenCalledWith(mockUint8Array);

        expect(command).toBeInstanceOf(expectedCommand);
        expect(command?.ip).toBe(ip);

        if (extraAssertions && command !== null)
            extraAssertions(command);
    });
});