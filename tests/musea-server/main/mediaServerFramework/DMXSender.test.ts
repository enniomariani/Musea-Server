import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {DMXSender} from "main/dmx/DMXSender.js";
import {ComPortState, IComPortConnection} from "main/dmx/DMXInterface.js";

let dmxSender: DMXSender;

let mockDMXInstance: any = {
    addUniverse: jest.fn(),
};

let mockAnimationInstance: any = {
    add: jest.fn().mockReturnThis(),
    run: jest.fn(),
    stop: jest.fn(),
};

let mockUniverseInstance:any = {
    update: jest.fn(),
};

jest.mock("dmx-ts", () => {
    return {
        DMX: jest.fn(() => mockDMXInstance),
        EnttecUSBDMXProDriver: jest.fn(),
        Animation: jest.fn(()=>mockAnimationInstance)
    };
});

beforeEach(() => {
    dmxSender = new DMXSender();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("init () + getComPortConnectionInfo() ", () => {
    it("getComPortConnectionInfo() should return InitNotCalled-State when init() method was not called", () => {
        const comPortConnectionInfo:IComPortConnection = dmxSender.getComPortConnectionInfo();
        expect(comPortConnectionInfo.state).toBe(ComPortState.InitNotCalled);
    });

    it("getComPortConnectionInfo() should return Connected-State when init() method was called and universe created", async () => {
        mockDMXInstance.addUniverse.mockResolvedValue(mockUniverseInstance);
        await dmxSender.init("COM1");

        const comPortConnectionInfo:IComPortConnection = dmxSender.getComPortConnectionInfo();
        expect(comPortConnectionInfo.state).toBe(ComPortState.Connected);
    });

    it("getComPortConnectionInfo() should return Connected-State when init() method was called and universe-creation failed", async () => {
        mockDMXInstance.addUniverse.mockImplementation(() => {
            throw new Error("Test-Error");
        });
        await dmxSender.init("COM1");

        const comPortConnectionInfo:IComPortConnection = dmxSender.getComPortConnectionInfo();
        expect(comPortConnectionInfo.state).toBe(ComPortState.Fail);
        expect(comPortConnectionInfo.error?.message).toBe("Test-Error");
    });
});

describe("sendValueToChannels() ", () => {
    it("should call  update() on the universe if fade-time is 0", async () => {
        mockDMXInstance.addUniverse.mockResolvedValue(mockUniverseInstance);

        await dmxSender.init("COM1");
        dmxSender.sendValueToChannels(0,2, 200, 0, 0);

        expect(mockUniverseInstance.update).toHaveBeenCalledTimes(1);
        expect(mockUniverseInstance.update).toHaveBeenCalledWith({'0': 200, '1': 200, '2': 200});
    });

    it("should create an animation and run it if fade-time is bigger than 0", async () => {
        mockDMXInstance.addUniverse.mockResolvedValue(mockUniverseInstance);

        await dmxSender.init("COM1");
        dmxSender.sendValueToChannels(0,2, 200, 50, 0);

        expect(mockAnimationInstance.add).toHaveBeenCalledTimes(1);
        expect(mockAnimationInstance.add).toHaveBeenCalledWith({'0': 200, '1': 200, '2': 200}, 50);
        expect(mockAnimationInstance.run).toHaveBeenCalledTimes(1);
        expect(mockAnimationInstance.run).toHaveBeenCalledWith(mockUniverseInstance);
    });

    it("should stop an other animation with the same ID", async () => {
        mockDMXInstance.addUniverse.mockResolvedValue(mockUniverseInstance);

        await dmxSender.init("COM1");
        dmxSender.sendValueToChannels(0,2, 200, 50, 0);
        dmxSender.sendValueToChannels(0,2, 300, 60, 0);
        dmxSender.sendValueToChannels(0,2, 300, 60, 1);

        expect(mockAnimationInstance.stop).toHaveBeenCalledTimes(1);
        expect(mockAnimationInstance.add).toHaveBeenCalledTimes(3);
        expect(mockAnimationInstance.add).toHaveBeenNthCalledWith(1, {'0': 200, '1': 200, '2': 200}, 50);
        expect(mockAnimationInstance.add).toHaveBeenNthCalledWith(2, {'0': 300, '1': 300, '2': 300}, 60);
        expect(mockAnimationInstance.add).toHaveBeenNthCalledWith(3, {'0': 300, '1': 300, '2': 300}, 60);
        expect(mockAnimationInstance.run).toHaveBeenCalledTimes(3);
        expect(mockAnimationInstance.run).toHaveBeenCalledWith(mockUniverseInstance);
    });

    it("should throw if init() was not called", () => {
        expect(dmxSender.sendValueToChannels).toThrow;
    });
})