import {LightService} from "renderer/lightService/LightService.js";
import {MockBackendDMXService} from "mocks/main/MockBackendDMXService.js";

export class MockLightService extends LightService{

    activatePreset:jest.Mock
    startLightInitSequence:jest.Mock
    checkComPortState:jest.Mock

    constructor() {
        super(new MockBackendDMXService());
        this.activatePreset = jest.fn();
        this.startLightInitSequence = jest.fn();
        this.checkComPortState = jest.fn();
    }
}