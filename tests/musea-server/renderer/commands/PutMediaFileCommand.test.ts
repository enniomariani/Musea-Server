import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {
    PutMediaFileCommand
} from "renderer/receivedCommands/PutMediaFileCommand.js";
import {
    MockMediaFileService
} from "mocks/renderer/fileServices/MockMediaFileService.js";
import {
    MediaFileService
} from "renderer/fileServices/MediaFileService.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    MockSendCommandFactory
} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";
import {MediaType} from "renderer/MuseaServer.js";


const fileData:Uint8Array = new Uint8Array([0,12,22]);;
const folderPath:string = "pathToFolder";
const mediaType:string = MediaType.MP4;

let putMediaFileCommand:PutMediaFileCommand;

let mockFileService: MockMediaFileService = new MockMediaFileService();
let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let mockSendCommandFactory:MockSendCommandFactory = new MockSendCommandFactory();

let ip:string = "192.168.1.1"
let encoder:TextEncoder = new TextEncoder();
let sendMediaIDCommand:string = "sendMediaID";
let commandBuffer:Uint8Array = encoder.encode(sendMediaIDCommand);

beforeEach(() => {
    putMediaFileCommand = new PutMediaFileCommand(ip, ["command"], mockFileService, mockEventEmitter, mockSendCommandFactory,
        folderPath, fileData, mediaType);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should call contentFileStorageService.save and pass the file-data", () => {
        putMediaFileCommand.execute();
        expect(mockFileService.save).toHaveBeenCalledTimes(1);
        expect(mockFileService.save).toHaveBeenCalledWith(folderPath, MediaType.MP4, fileData);
    });

    it("should call createMediaID.load and pass the data to the send command event", () => {
        let newId:number = 2;
        mockSendCommandFactory.sendMediaID.mockImplementation((id:number)=>{
            if(id === newId)
                return commandBuffer;
        });
        mockFileService.save.mockReturnValueOnce(newId);

        putMediaFileCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( MockEventEmitter.SEND_COMMAND, ip, commandBuffer );
    });
});