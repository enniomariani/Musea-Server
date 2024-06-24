import {DMX, EnttecUSBDMXProDriver, IUniverseDriver, Animation} from "dmx-ts";
import {ComPortState, IComPortConnection} from "main/dmx/DMXInterface.js";

export class DMXSender {
    private _dmx:DMX = new DMX();
    private _universe:IUniverseDriver | null = null;
    private _animations:Map<number, Animation> = new Map();

    private _comPortConnection:IComPortConnection = {state: ComPortState.InitNotCalled, comPort: ""};

    constructor(){}

    async init(comPort:string):Promise<void>{
        try{
            this._universe = await this._dmx.addUniverse('mainLight', new EnttecUSBDMXProDriver(comPort));
        }catch (error){
            if(error instanceof Error)
                this._comPortConnection.error = error;

            this._comPortConnection.state = ComPortState.Fail;

            return;
        }

        this._comPortConnection.state = ComPortState.Connected;
    }

    getComPortConnectionInfo():IComPortConnection{
        return this._comPortConnection;
    }

    /**
     * Send a new value (0 to 255) to one of the 256 channels (starting from channel 0)
     *
     * @param {number} startChannel     a value from 0 to 255
     * @param {number} endChannel       a value from 0 to 255
     * @param {number} value            a value from 0 to 255 (the value the channels are set to)
     * @param {number} fadeTimeMS       the time in MS to fade from the previous value to the new set
     * @param {number} animID           the animation-id. Animations are saved by ID, if another animation is sent while one with the same ID is running, this animation is stopped and the new one added (no stacking)
     */
    sendValueToChannels(startChannel:number, endChannel:number, value:number, fadeTimeMS:number, animID:number){
        let newValues:any = {};

        if(!this._universe)
            throw new Error("DMXSender: call init(comPort) before running any other DMX-function!")

        for (let channel:number = startChannel; channel<= endChannel; channel++)
            newValues[channel] = value;

        if(this._animations.get(animID) !== undefined){
            const animation:Animation = this._animations.get(animID)!;
            animation.stop();
            this._animations.delete(animID);
        }

        if(fadeTimeMS > 0){
            const animation:Animation = new Animation().add(newValues, fadeTimeMS);
            this._animations.set(animID, animation);
            animation.run(this._universe);
        }
        else
            this._universe.update(newValues);
    }
}