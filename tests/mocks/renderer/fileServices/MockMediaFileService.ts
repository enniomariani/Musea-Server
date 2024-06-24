import {
    MediaFileService
} from "renderer/fileServices/MediaFileService.js";
import {MockMediaMetadataManager} from "mocks/renderer/fileServices/MockMediaMetadataManager.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";

export class MockMediaFileService extends MediaFileService{

    save:jest.Mock
    delete:jest.Mock
    initMetaData:jest.Mock
    getFileNameForId: jest.Mock
    getMediaTypeForId: jest.Mock

    constructor() {
        super(new MockBackendFileService(), new MockMediaMetadataManager());

        this.save = jest.fn();
        this.delete = jest.fn();
        this.initMetaData = jest.fn();
        this.getFileNameForId = jest.fn();
        this.getMediaTypeForId = jest.fn();
    }
}