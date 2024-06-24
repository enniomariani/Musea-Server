import {afterEach, describe, it, jest} from "@jest/globals";
import {MockLightService} from "mocks/renderer/lightService/MockLightService.js";
import {LightCommand} from "renderer/receivedCommands/LightCommand.js";

let lightCommandTest:LightCommand;
let mockLightService: MockLightService = new MockLightService();

let ip:string = "192.168.1.1"

function initObject(command:string[]){
    lightCommandTest = new LightCommand(ip, command, mockLightService);
}

afterEach(() => {
    jest.clearAllMocks();
});

describe("execute() ", ()=>{
    it("should call lightService.activatePreset with the correct params from the passed preset", () => {
        initObject(["preset", "1"]);

        lightCommandTest.execute();

        expect(mockLightService.activatePreset).toHaveBeenCalledTimes(1);
        expect(mockLightService.activatePreset).toHaveBeenCalledWith(1);
    });

    it("should throw an error if the first part of the command is wrong", () => {
        initObject(["presetXY", "1"]);
        expect(() => lightCommandTest.execute()).toThrow(Error("Unsupported light-command: presetXY,1" ))
    });

    it("should throw an error if the second part of the command is wrong (number below 0)", () => {
        initObject(["preset", "-1"]);
        expect(() => lightCommandTest.execute()).toThrow(Error("Unsupported light-command: preset,-1" ))
    });

    it("should throw an error if the second part of the command is wrong (number above 2)", () => {
        initObject(["preset", "4"]);
        expect(() => lightCommandTest.execute()).toThrow(Error("Unsupported light-command: preset,4" ))
    });
})