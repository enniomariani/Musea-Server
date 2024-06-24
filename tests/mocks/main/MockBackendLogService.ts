
export class MockBackendLogService implements IBackendLogFileService{

    init:jest.Mock
    log:jest.Mock

    constructor() {
        this.init = jest.fn();
        this.log = jest.fn();
    }
}