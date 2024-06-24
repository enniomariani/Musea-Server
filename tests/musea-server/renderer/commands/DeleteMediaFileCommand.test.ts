import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {
    MockMediaFileService
} from "mocks/renderer/fileServices/MockMediaFileService.js";
import {
    DeleteMediaFileCommand
} from "renderer/receivedCommands/DeleteMediaFileCommand.js";


let deleteMediaFileCommand:DeleteMediaFileCommand;
let mockFileService: MockMediaFileService = new MockMediaFileService();

const folderPath:string = "pathToFolder";

beforeEach(() => {
    deleteMediaFileCommand = new DeleteMediaFileCommand("192.168.1.1", 100, folderPath, ["command"], mockFileService);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should call contentFileStorageService.delete and pass the id", () => {
        deleteMediaFileCommand.execute();

        expect(mockFileService.delete).toHaveBeenCalledTimes(1);
        expect(mockFileService.delete).toHaveBeenCalledWith(folderPath, 100);
    });
});