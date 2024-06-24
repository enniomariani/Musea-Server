import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {
    IMediaFile,
    MediaMetadataManager
} from "renderer/fileServices/MediaMetadataManager.js";
import {MediaFileService} from "renderer/fileServices/MediaFileService.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";
import {MediaType} from "renderer/MuseaServer.js";

let metadataManager: MediaMetadataManager;
const textEncoder:TextEncoder = new TextEncoder();
let metadataFilePath: string = "path/to/metadataFile";

let validMetadataJSON:any;
let validMetadataJSONString:string;
let validMetadataJSONArrayBuffer:Uint8Array;

const backEndFileServiceMock: MockBackendFileService = new MockBackendFileService();

beforeEach(() => {
    validMetadataJSON = {
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
    validMetadataJSONString = JSON.stringify(validMetadataJSON);
    validMetadataJSONArrayBuffer = textEncoder.encode(validMetadataJSONString);

    metadataManager = new MediaMetadataManager(backEndFileServiceMock);
    metadataManager.metadataFilePath = metadataFilePath;
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("loadMetadata() ", () => {
    it("should return the loaded Metadata JSON from the backend if the backend provided a valid JSON", async () => {
        backEndFileServiceMock.loadFile.mockImplementationOnce((path: string): Uint8Array | null => {
            if (path === metadataFilePath)
                return validMetadataJSONArrayBuffer;
            else
                return null;
        });

        const returnedMetaData:any = await metadataManager.loadMetadata();

        expect(returnedMetaData).toStrictEqual(validMetadataJSON)
    });

    it("should return an empty metadata-object if the backend returned null", async () => {
        let emptyMetaDataobject:any = {
            mediaFiles: [],
            lastId: -1,
        }

        backEndFileServiceMock.loadFile.mockImplementationOnce((): Uint8Array | null => {
                return null;
        });

        const returnedMetaData:any = await metadataManager.loadMetadata();

        expect(returnedMetaData).toStrictEqual(emptyMetaDataobject)
    });

    it("should throw an error if the loaded data is not a valid JSON-object", async () => {
        let nonValidJSONstring:string = "not a valid} JSON-string {/";
        let nonValidJSONencoded:Uint8Array = textEncoder.encode(nonValidJSONstring);
        let thrownError = null;

        backEndFileServiceMock.loadFile.mockImplementationOnce(async (): Promise<Uint8Array | null> => {
            return nonValidJSONencoded;
        });

        try{
            await metadataManager.loadMetadata();
        }catch(error){
            thrownError = error;
        }
        expect(thrownError).not.toBe(null);
    });
});

describe("saveMetadata() ", () =>{
   it("should call mediaFileService.save with the passed metadata", ()=>{
       metadataManager.saveMetadata(validMetadataJSON);
       expect(backEndFileServiceMock.saveFile).toHaveBeenCalledTimes(1);
       expect(backEndFileServiceMock.saveFile).toHaveBeenCalledWith(metadataFilePath, validMetadataJSONArrayBuffer);
   });
});

describe("getNextId() ", () =>{
    it("should return the next ID of the passed metadata", ()=>{
        const nextID:number = metadataManager.getNextId(validMetadataJSON);
        expect(nextID).toBe(2);
    });
});

describe("addMediaFile() ", () =>{
    it("adds a media-file and saves the metadata-file", ()=>{
        let newJSON:any = {
            mediaFiles: [{
                id: 0,
                filename: "0.jpeg",
                mediaType: "jpeg"
            },
                {
                    id: 1,
                    filename: "1.mp4",
                    mediaType: "mp4"
                },
                {
                    id: 2,
                    filename: "2.jpeg",
                    mediaType: "jpeg"
                }],
            lastId: 2,
        }
        metadataManager.saveMetadata = jest.fn();

        metadataManager.addMediaFile(validMetadataJSON, "2.jpeg", MediaType.JPEG);

        expect(validMetadataJSON).toStrictEqual(newJSON);
        expect(metadataManager.saveMetadata).toHaveBeenCalledTimes(1);
        expect(metadataManager.saveMetadata).toHaveBeenCalledWith(validMetadataJSON);
    });
});

describe("getMediaFileById() ", () =>{
    it("returns the media File if the ID exists", ()=>{
        const result:IMediaFile | null = metadataManager.getMediaFileById(validMetadataJSON, 1);

        expect(result).toStrictEqual({
            id: 1,
            filename: "1.mp4",
            mediaType: "mp4"
        });
    });

    it("returns null if the ID does not exist", ()=>{
        const result:IMediaFile | null  = metadataManager.getMediaFileById(validMetadataJSON, 3);
        expect(result).toBe(null);
    });
});

describe("deleteMediaFile() ", () =>{
    it("should remove the mediaFile from the passed mediaMetadata", ()=>{
        metadataManager.saveMetadata = jest.fn();
        metadataManager.deleteMediaFile(validMetadataJSON, 0);

        expect(validMetadataJSON).toStrictEqual({
            mediaFiles: [
                {
                    id: 1,
                    filename: "1.mp4",
                    mediaType: "mp4"
                }],
            lastId: 1,
        });

        expect(metadataManager.saveMetadata).toHaveBeenCalledTimes(1);
        expect(metadataManager.saveMetadata).toHaveBeenCalledWith(validMetadataJSON);
    });
});