import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {PingCommand} from "renderer/receivedCommands/PingCommand.js";
import {MockEventEmitter} from "mocks/renderer/events/MockEventEmitter.js";
import {
    MockSendCommandFactory
} from "mocks/renderer/sendCommands/MockSendCommandFactory.js";

let pingCommand:PingCommand;
let ip:string = "192.168.0.3";
let encoder:TextEncoder = new TextEncoder();
let pongCommandText:string = "pongCommand";
let pongCommandBuffer:Uint8Array = encoder.encode(pongCommandText);

let mockEventEmitter: MockEventEmitter = new MockEventEmitter();
let mockSendCommandFactory:MockSendCommandFactory = new MockSendCommandFactory();
mockSendCommandFactory.sendPong.mockImplementationOnce(()=>{return pongCommandBuffer});

beforeEach(() => {
    pingCommand = new PingCommand(ip, ["command"], mockEventEmitter, mockSendCommandFactory);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should emit a sendCommand event to send a pong-command", () => {
        pingCommand.execute();
        expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith( MockEventEmitter.SEND_COMMAND, ip, pongCommandBuffer );
    });
});