
export class MockBackendDMXService implements IBackendDMXService{

    sendValueToChannels:jest.Mock
    getComPortConnectionInfo:jest.Mock

    constructor() {
        this.sendValueToChannels = jest.fn();
        this.getComPortConnectionInfo = jest.fn();
    }
}