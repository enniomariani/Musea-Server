import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {InvalidCommand} from "renderer/receivedCommands/InvalidCommand.js";

let invalidCommand:InvalidCommand;
let ip:string = "192.168.0.3";

let mockEventEmitter: MockEventEmitter = new MockEventEmitter();

beforeEach(() => {
    invalidCommand = new InvalidCommand(ip, ["command"], mockEventEmitter, "reason");
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should emit an invalid command event", () => {
        invalidCommand.execute();
        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( MockEventEmitter.INVALID_COMMAND_RECEIVED, ip, "reason" );
    });
});