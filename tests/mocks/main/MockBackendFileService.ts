
export class MockBackendFileService implements IBackendFileService{

    saveFile:jest.Mock
    loadFile:jest.Mock
    fileExists:jest.Mock
    deleteFile:jest.Mock
    appendToFile:jest.Mock

    constructor() {
        this.saveFile = jest.fn();
        this.loadFile = jest.fn();
        this.fileExists = jest.fn();
        this.deleteFile = jest.fn();
        this.appendToFile = jest.fn();
    }
}