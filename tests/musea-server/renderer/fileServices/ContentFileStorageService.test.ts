import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {ContentFileStorageService} from "renderer/fileServices/ContentFileStorageService.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";

let storageService: ContentFileStorageService;
let filePath: string = "path/to/file/testFile.txt";

const backEndFileServiceMock:MockBackendFileService = new MockBackendFileService();

beforeEach(() => {
    storageService = new ContentFileStorageService(backEndFileServiceMock);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("save() ", () => {
    it("should call backendFileService.saveFile with the passed string and the path", () => {
        let encoder: TextEncoder = new TextEncoder();
        let contentFileJSONasString = JSON.stringify({
                testVar1: 100,
                textVar2: "test"
            }
        );
        let fileDataArrayBuffer: Uint8Array = encoder.encode(contentFileJSONasString);

        storageService.save(filePath, contentFileJSONasString);

        expect(backEndFileServiceMock.saveFile).toHaveBeenCalledTimes(1);
        expect(backEndFileServiceMock.saveFile).toHaveBeenCalledWith(filePath, fileDataArrayBuffer);
    });
});

describe("fileExists() ", () => {
    it("should call backendFileService.fileExists with correct arguments + return the result", async () => {
        backEndFileServiceMock.fileExists.mockResolvedValue(false);
        const fileExists:boolean = await storageService.fileExists(filePath);
        expect(fileExists).toBe(false);
    });
});

describe("load() ", () => {
    it("should return the arrayBuffer from backendFileService.loadFile if it was called with a filePath", async () => {
        let restulString:string = "fileContentAsString";
        let encoder: TextEncoder = new TextEncoder();
        let mockLoadedData:Uint8Array = encoder.encode(restulString);
        let loadedData:string;
        backEndFileServiceMock.loadFile.mockReturnValueOnce(mockLoadedData);

        loadedData = await storageService.load(filePath);

        expect(backEndFileServiceMock.loadFile).toHaveBeenCalledTimes(1);
        expect(backEndFileServiceMock.loadFile).toHaveBeenCalledWith(filePath);
        expect(loadedData).toEqual(restulString);
    });

    it("should return a string with an empty JSON if backendFileService.loadFile returns null", async () => {
        backEndFileServiceMock.loadFile.mockReturnValueOnce(null);
        const loadedData:string = await storageService.load(filePath);
        expect(loadedData).toEqual("{}");
    });
});