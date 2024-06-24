import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {
    PutContentFileCommand
} from "renderer/receivedCommands/PutContentFileCommand.js";
import {
    MockContentFileStorageService
} from "mocks/renderer/fileServices/MockContentFileStorageService.js";

const fileData:string = JSON.stringify({
    testJSON: true,
    property2: 1222
});
const path:string = "pathToFile";

let putContentFileCommand:PutContentFileCommand;
let mockFileService: MockContentFileStorageService = new MockContentFileStorageService();

beforeEach(() => {
    putContentFileCommand = new PutContentFileCommand("192.168.1.2", ["command"], mockFileService, path, fileData);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should call contentFileStorageService.save and pass the file-data", () => {
        putContentFileCommand.execute();
        expect(mockFileService.save).toHaveBeenCalledTimes(1);
        expect(mockFileService.save).toHaveBeenCalledWith(path, fileData);
    });
});