import {EventEmitter} from "renderer/events/EventEmitter.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class SystemCommand extends DefaultCommand implements IReceivedCommand{

    private _eventEmitter:EventEmitter;

    constructor(ip:string, command:string[],eventEmitter: EventEmitter) {
        super(ip, command);
        this._eventEmitter = eventEmitter;
    }

    override execute():void{
        this._eventEmitter.emit(EventEmitter.CLIENT_SYSTEM_COMMAND_RECEIVED, this._ip, this._command);
    };
}