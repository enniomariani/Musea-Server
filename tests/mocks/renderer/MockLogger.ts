import {Logger} from "renderer/Logger.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {MockBackendLogService} from "mocks/main/MockBackendLogService.js";

export class MockLogger extends Logger{

    start: jest.Mock

    constructor() {
        super(new MockEventEmitter(), new MockBackendLogService(), {} as Console, {} as unknown as Window);
        this.start = jest.fn();
    }
}