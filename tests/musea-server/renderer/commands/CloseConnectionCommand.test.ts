import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    CloseConnectionCommand
} from "renderer/receivedCommands/CloseConnectionCommand.js";

let closeConnectionCommandTest:CloseConnectionCommand;
let ip:string = "192.168.0.3";

let mockEventEmitter: MockEventEmitter = new MockEventEmitter();

beforeEach(() => {
    closeConnectionCommandTest = new CloseConnectionCommand(ip, ["command"], mockEventEmitter);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should emit a close-connection event", () => {
        closeConnectionCommandTest.execute();
        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, MockEventEmitter.CLOSE_CONNECTION, ip );
    });
});