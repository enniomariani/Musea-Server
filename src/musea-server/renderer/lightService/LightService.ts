import {ComPortState, IComPortConnection} from "main/dmx/DMXInterface.js";

export class LightService {
    static readonly FADE_TIME: number = 3000;

    private _backendDMXService: IBackendDMXService;
    private _channelValues:Map<number, number[]>;

    constructor(backendDMXService: IBackendDMXService = window.museaServerBackendDMX) {
        this._backendDMXService = backendDMXService;

        this._channelValues = new Map();

        this._channelValues.set(0, [0,0,0]);
        this._channelValues.set(1, [25,50,102]);
        this._channelValues.set(2, [150,100,100]);
    }

    async checkComPortState():Promise<void>{
        const connectionInfo:IComPortConnection = this._backendDMXService.getComPortConnectionInfo();

        if(connectionInfo.state === ComPortState.InitNotCalled)
            console.warn("No COM-Port is set!")
        else if(connectionInfo.state === ComPortState.Fail)
            console.error("Failed to connect to COM-Port: ", connectionInfo.comPort, " - error: " , connectionInfo.error!);
        else if(connectionInfo.state === ComPortState.Connected)
            console.log("Connection to COM-Port successful: ", connectionInfo.comPort);
    }

    /**
     * Start initialize-sequence and set the preset to 1
     */
    async startLightInitSequence(): Promise<void> {
        this._setNewValuesFor3DMXChannels(255, 255, 255);

        await this._sleep(2000);
        this._setNewValuesFor3DMXChannels(0, 0, 0);

        await this._sleep(2000);
        this._setNewValuesFor3DMXChannels(255, 255, 255);

        await this._sleep(2000);
        this.activatePreset(1);
    }

    private _sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Activate preset, (at the moment 0,1 and 2)
     */
    activatePreset(presetID:number): void {
        this._setNewValuesFor3DMXChannels(this._channelValues.get(presetID)![0], this._channelValues.get(presetID)![1], this._channelValues.get(presetID)![2]);
    }

    private _setNewValuesFor3DMXChannels(valueChannel1:number, valueChannel2:number, valueChannel3:number): void {
        this._backendDMXService.sendValueToChannels(1, 0, 4, valueChannel1, LightService.FADE_TIME);
        this._backendDMXService.sendValueToChannels(2, 10, 10 + 4,valueChannel2, LightService.FADE_TIME);
        this._backendDMXService.sendValueToChannels(3, 20, 20 + 4, valueChannel3, LightService.FADE_TIME);
    }
}