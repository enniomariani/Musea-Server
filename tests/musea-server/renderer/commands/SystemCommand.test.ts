import {afterEach, describe, it, jest} from "@jest/globals";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SystemCommand} from "renderer/receivedCommands/SystemCommand.js";

let systemCommand:SystemCommand;
let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let ip:string = "192.168.1.1"

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=>{
    it("should emit a CLIENT_MEDIA_COMMAND_RECEIVED event and pass the received command to it", () => {
        systemCommand = new SystemCommand(ip,["testCommand"], mockEventEmitter);
        systemCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith(  EventEmitter.CLIENT_SYSTEM_COMMAND_RECEIVED, ip, ["testCommand"]);
    });
})