import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {
    MediaFileService
} from "renderer/fileServices/MediaFileService.js";
import {
    MockMediaMetadataManager
} from "mocks/renderer/fileServices/MockMediaMetadataManager.js";
import {
    IMediaMetadata
} from "renderer/fileServices/MediaMetadataManager.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";
import {MediaType} from "renderer/MuseaServer.js";

let storageService: MediaFileService;

const backEndFileServiceMock: MockBackendFileService = new MockBackendFileService();
const mediaFolderPath:string = "path/to/media/folder";

let mockMediaMetadataManager: MockMediaMetadataManager;

let validMetadataJSON: any = {
    mediaFiles: [{
        id: 0,
        filename: "0.jpeg",
        mediaType: "jpeg"
    },
        {
            id: 1,
            filename: "1.mp4",
            mediaType: "mp4"
        }],
    lastId: 1,
}

beforeEach(() => {
    mockMediaMetadataManager = new MockMediaMetadataManager();
    mockMediaMetadataManager.loadMetadata.mockReturnValue(validMetadataJSON);
    storageService = new MediaFileService(backEndFileServiceMock, mockMediaMetadataManager);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("getFileNameForId() ", () => {
    it("should return the filename of the passed file-id", async () => {
        let requestedID: number = 2;
        let correctFileName: string = "correctFileName";

        mockMediaMetadataManager.getMediaFileById.mockImplementationOnce((metadata: IMediaMetadata, id: number) => {
            if (id === requestedID)
                return {filename: correctFileName};
        });

        await storageService.initMetaData(mediaFolderPath);
        const returnedFileName: string | null = storageService.getFileNameForId(requestedID);

        expect(returnedFileName).toEqual(correctFileName);
    });

    it("should return null if the id does not exist in the metadata", async () => {
        let requestedID: number = 2;

        mockMediaMetadataManager.getMediaFileById.mockImplementationOnce((metadata: IMediaMetadata, id: number) => {
            return null;
        });

        await storageService.initMetaData(mediaFolderPath);
        const returnedFileName: string | null = storageService.getFileNameForId(requestedID);

        expect(returnedFileName).toEqual(null);
    });
});

describe("getMediaTypeForId() ", () => {
    it("should return the media-type of the passed file-id", async () => {
        let requestedID: number = 2;
        let correctType: string = "jpeg";

        mockMediaMetadataManager.getMediaFileById.mockImplementationOnce((metadata: IMediaMetadata, id: number) => {
            console.log("MOCK: ", id, requestedID, correctType)
            if (id === requestedID)
                return {mediaType: correctType};
        });

        await storageService.initMetaData(mediaFolderPath);
        const returnedType: MediaType | null = storageService.getMediaTypeForId(requestedID);

        expect(returnedType).toEqual(correctType);
    });

    it("should return null if the id does not exist in the metadata", async () => {
        let requestedID: number = 2;

        mockMediaMetadataManager.getMediaFileById.mockImplementationOnce((metadata: IMediaMetadata, id: number) => {
            return null;
        });

        await storageService.initMetaData(mediaFolderPath);
        const returnedType: MediaType | null = storageService.getMediaTypeForId(requestedID);

        expect(returnedType).toEqual(null);
    });
});


describe("save() ", () => {
    it("get the next ID from the mediaMetadatamanager, create the filename of it and add the mediaFile to the metadata", async () => {
        let mediaType: string = MediaType.JPEG;
        mockMediaMetadataManager.getNextId.mockReturnValueOnce(2);
        mockMediaMetadataManager.loadMetadata.mockReturnValueOnce(validMetadataJSON);
        let fileName: string = "2.jpeg";

        let encoder: TextEncoder = new TextEncoder();
        let mediaData: string = "I am an image :)"
        let fileDataArrayBuffer: Uint8Array = encoder.encode(mediaData);
        let folderPath: string = "/path/to/media/folder";

        await storageService.initMetaData(folderPath);
        storageService.save(folderPath, MediaType.JPEG, fileDataArrayBuffer);

        expect(mockMediaMetadataManager.addMediaFile).toHaveBeenCalledTimes(1);
        expect(mockMediaMetadataManager.addMediaFile).toHaveBeenCalledWith(validMetadataJSON, fileName, mediaType);

        expect(backEndFileServiceMock.saveFile).toHaveBeenCalledTimes(1);
        expect(backEndFileServiceMock.saveFile).toHaveBeenCalledWith(folderPath + "\\" + fileName, fileDataArrayBuffer);
    });

    it("return the new ID", async () => {
        let result: number;
        mockMediaMetadataManager.getNextId.mockReturnValueOnce(2);
        mockMediaMetadataManager.loadMetadata.mockReturnValueOnce(validMetadataJSON);

        let encoder: TextEncoder = new TextEncoder();
        let mediaData: string = "I am an image :)"
        let fileDataArrayBuffer: Uint8Array = encoder.encode(mediaData);
        let folderPath: string = "/path/to/media/folder";

        await storageService.initMetaData(folderPath);
        result = storageService.save(folderPath, MediaType.JPEG, fileDataArrayBuffer);

        expect(result).toBe(2);
    });
});

describe("delete() ", () => {
    it("delete the file in the metadata and on the harddisk (via backend)", async () => {
        let idToDelete: number = 0;
        mockMediaMetadataManager.loadMetadata.mockReturnValueOnce(validMetadataJSON);
        mockMediaMetadataManager.getMediaFileById.mockImplementationOnce((metadata: IMediaMetadata, id: number) => {
            console.log("get media file by id: ", metadata, id)
            if (id === idToDelete)
                return validMetadataJSON.mediaFiles[id];
        })

        let folderPath: string = "/path/to/media/folder";

        await storageService.initMetaData(folderPath);
        storageService.delete(folderPath, idToDelete);

        expect(mockMediaMetadataManager.deleteMediaFile).toHaveBeenCalledTimes(1);
        expect(mockMediaMetadataManager.deleteMediaFile).toHaveBeenCalledWith(validMetadataJSON, idToDelete);

        expect(backEndFileServiceMock.deleteFile).toHaveBeenCalledTimes(1);
        expect(backEndFileServiceMock.deleteFile).toHaveBeenCalledWith(folderPath + "\\0.jpeg");
    });
});