import {afterEach, beforeEach, describe, it, jest} from "@jest/globals";
import {LightService} from "renderer/lightService/LightService.js";
import {ComPortState} from "main/dmx/DMXInterface.js";

let lightService:LightService;
const mockBackendDMXService: jest.Mocked<IBackendDMXService> = {
    sendValueToChannels: jest.fn(),
    getComPortConnectionInfo: jest.fn()
}

beforeEach(() => {
    lightService = new LightService(mockBackendDMXService)
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("checkComPortState() ", ()=>{
    it("If no com-port is set, print a warning on the console", async () => {
        const logSpy = jest.spyOn(console, "warn");
        mockBackendDMXService.getComPortConnectionInfo.mockReturnValue({state: ComPortState.InitNotCalled, comPort:""});

        await lightService.checkComPortState();

        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("If a com-port is set, but there is a connection error, print an error", async () => {
        const logSpy = jest.spyOn(console, "error");
        mockBackendDMXService.getComPortConnectionInfo.mockReturnValue({state: ComPortState.Fail, comPort:"COM 1", error: new Error("Conn-Err")});

        await lightService.checkComPortState();

        expect(logSpy).toHaveBeenCalledTimes(1);
        const call = logSpy.mock.calls[0];
        const allArgs:string = call.join(' ');
        expect(allArgs).toContain("COM 1");
        expect(allArgs).toContain("Conn-Err");
    });

    it("If a com-port is set and connected succesfully, print a log", async () => {
        const logSpy = jest.spyOn(console, "log");
        mockBackendDMXService.getComPortConnectionInfo.mockReturnValue({state: ComPortState.Connected, comPort:"COM 1"});

        await lightService.checkComPortState();

        expect(logSpy).toHaveBeenCalledTimes(1);
        const call = logSpy.mock.calls[0];
        const allArgs:string = call.join(' ');
        expect(allArgs).toContain("COM 1");
    });
})

describe("activatePreset() ", ()=>{
    it("Preset 0: should call backendDMXService.sendDmxSignal with the correct params from the passed preset", () => {
        lightService.activatePreset(0);

        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenCalledTimes(3);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(1, 1, 0,4,0, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(2, 2, 10,14,0, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(3,3, 20,24,0, LightService.FADE_TIME);
    });
    it("Preset 1: should call backendDMXService.sendDmxSignal with the correct params from the passed preset", () => {
        lightService.activatePreset(1);

        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenCalledTimes(3);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(1,1, 0,4,25, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(2,2, 10,14,50, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(3,3, 20,24,102, LightService.FADE_TIME);
    });
    it("Preset 2: should call backendDMXService.sendDmxSignal with the correct params from the passed preset", () => {
        lightService.activatePreset(2);

        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenCalledTimes(3);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(1,1, 0,4,150, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(2,2, 10,14,100, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(3,3, 20,24,100, LightService.FADE_TIME);
    });
})

describe("startLightInitSequence() ", ()=>{
    it("should call sendDmxSignal with all 255, then all 0, then all 255 and then preset 1", async () => {
        jest.useFakeTimers();

        const promise = lightService.startLightInitSequence();

        // Run all timers (simulate passage of time)
        await jest.runAllTimersAsync();

        // Wait for all microtasks to finish
        await Promise.resolve(); // Flush microtasks
        await promise;

        // Assertions
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenCalledTimes(12);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(1, 1, 0, 4, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(2, 2, 10, 14, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(3, 3, 20, 24, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(4, 1, 0, 4, 0, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(5, 2, 10, 14, 0, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(6, 3, 20, 24, 0, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(7, 1, 0, 4, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(8, 2, 10, 14, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(9, 3, 20, 24, 255, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(10, 1, 0, 4, 25, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(11, 2, 10, 14, 50, LightService.FADE_TIME);
        expect(mockBackendDMXService.sendValueToChannels).toHaveBeenNthCalledWith(12, 3, 20, 24, 102, LightService.FADE_TIME);

        jest.useRealTimers();
    });

})