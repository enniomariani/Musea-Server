import {
    MediaMetadataManager
} from "renderer/fileServices/MediaMetadataManager.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";

const backEndFileServiceMock: MockBackendFileService = new MockBackendFileService();

export class MockMediaMetadataManager extends MediaMetadataManager{

    loadMetadata:jest.Mock
    saveMetadata:jest.Mock
    getNextId:jest.Mock
    addMediaFile:jest.Mock
    deleteMediaFile:jest.Mock
    getMediaFileById:jest.Mock

    constructor() {
        super(backEndFileServiceMock);
        this.loadMetadata = jest.fn();
        this.saveMetadata = jest.fn();
        this.getNextId = jest.fn();
        this.addMediaFile = jest.fn();
        this.deleteMediaFile = jest.fn();
        this.getMediaFileById = jest.fn();
    }
}