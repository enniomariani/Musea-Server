import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {

} from "renderer/receivedCommands/PutContentFileCommand.js";
import {
    MockContentFileStorageService
} from "mocks/renderer/fileServices/MockContentFileStorageService.js";
import {
    GetContentFileCommand
} from "renderer/receivedCommands/GetContentFileCommand.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    MockSendCommandFactory
} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";

const ip:string = "192.168.0.3";
const filePath:string = "pathToFile";


let getContentFileCommand: GetContentFileCommand;

let mockFileService: MockContentFileStorageService = new MockContentFileStorageService();
let mockEventEmitter: MockEventEmitter = new MockEventEmitter();

let encoder:TextEncoder = new TextEncoder();
let sendContentDataCommand:string = "sendContentData";
let commandBuffer:Uint8Array = encoder.encode(sendContentDataCommand);
let mockSendCommandFactory:MockSendCommandFactory = new MockSendCommandFactory();

beforeEach(() => {
    getContentFileCommand = new GetContentFileCommand(ip, ["command"], filePath, mockFileService, mockEventEmitter, mockSendCommandFactory);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should call contentFileStorageService.load and pass the data to the send command event", async () => {
        let fileData:string = JSON.stringify({
            testJSON: true,
            property2: 1222
        });

        mockFileService.load.mockImplementationOnce((path:string)=>{
            if(path === filePath)
                return fileData;
        });

        mockSendCommandFactory.sendContentFile.mockImplementation((data:string)=>{
            if(data === fileData)
                return commandBuffer;
        });

        await getContentFileCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( MockEventEmitter.SEND_COMMAND, ip, commandBuffer );
    });
});