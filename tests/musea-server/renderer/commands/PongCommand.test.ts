import {afterEach, describe, it, jest} from "@jest/globals";
import {PongCommand} from "renderer/receivedCommands/PongCommand.js";
import {MockTimeoutHandler} from "mocks/renderer/network/MockTimeoutHandler.js";
import {MockConnectedClients} from "mocks/renderer/network/MockConnectedClients.js";

let pongCommand:PongCommand;
const ip:string = "192.168.0.3";

let mockTimeoutHandler: MockTimeoutHandler = new MockTimeoutHandler();
let mockConnectedClients:MockConnectedClients = new MockConnectedClients();

Object.defineProperty(mockConnectedClients, "adminApp", {
    get: jest.fn(()=>{return ip})
});

function initObject(ip:string):void {
    pongCommand = new PongCommand(ip, ["command"], mockTimeoutHandler, mockConnectedClients);
}

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=> {
    it("should stop the pongTimeoutHandler if the command comes from the actually connected admin-app", () => {
        initObject(ip);
        pongCommand.execute();
        expect(mockTimeoutHandler.stopTimeout).toHaveBeenCalledTimes(1);
    });

    it("should do nothing if the command does not come from the actually connected admin-app", () => {
        initObject("127.2.3.1");
        pongCommand.execute();
        expect(mockTimeoutHandler.stopTimeout).toHaveBeenCalledTimes(0);
    });
});