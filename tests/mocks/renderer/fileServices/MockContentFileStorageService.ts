import {
    ContentFileStorageService
} from "renderer/fileServices/ContentFileStorageService.js";
import {MockBackendFileService} from "mocks/main/MockBackendFileService.js";

const backEndFileServiceMock: MockBackendFileService = new MockBackendFileService();

export class MockContentFileStorageService extends ContentFileStorageService{

    save:jest.Mock
    load:jest.Mock
    fileExists:jest.Mock
    delete:jest.Mock

    constructor() {
        super(backEndFileServiceMock);
        this.save = jest.fn();
        this.load = jest.fn();
        this.fileExists = jest.fn();
        this.delete = jest.fn();
    }
}