import {afterEach, describe, it, jest} from "@jest/globals";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {MediaCommand} from "renderer/receivedCommands/MediaCommand.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";

let mediaCommand:MediaCommand;
let mockEventEmitter: MockEventEmitter = new MockEventEmitter();

let ip:string = "192.168.1.1"

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=>{
    it("should emit a CLIENT_MEDIA_COMMAND_RECEIVED event and pass the received command to it", () => {
        mediaCommand = new MediaCommand(ip, ["testCommand"], mockEventEmitter);

        mediaCommand.execute();

        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith(  EventEmitter.CLIENT_MEDIA_COMMAND_RECEIVED, ip, ["testCommand"]);
    });
})