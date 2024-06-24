export class MockMuseaServer {
    start: jest.Mock;
    registerMediaCommandCallback: jest.Mock;
    registerSystemCommandCallback: jest.Mock;
    registerAdminAppDisconnectedCallback: jest.Mock;
    getMediaFileName: jest.Mock;
    getMediaType: jest.Mock;

    constructor() {
        this.start = jest.fn();
        this.registerMediaCommandCallback = jest.fn();
        this.registerSystemCommandCallback = jest.fn();
        this.registerAdminAppDisconnectedCallback = jest.fn();
        this.getMediaFileName = jest.fn();
        this.getMediaType = jest.fn();
    }
}