import {LightService} from "renderer/lightService/LightService.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class LightCommand extends DefaultCommand implements IReceivedCommand{

    private _lightService:LightService;

    constructor(ip:string, command:string[], lightService:LightService = new LightService()) {
        super(ip, command);
        this._lightService = lightService;
    }

    override execute():void{
        if(this._command.length === 2 && this._command[0] === "preset" && Number(this._command[1]) >= 0 && Number(this._command[1]) <= 2)
            this._lightService.activatePreset(Number(this._command[1]));
        else
            throw new Error("Unsupported light-command: " +  this._command);
    };
}