import {EventEmitter} from "renderer/events/EventEmitter.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class InvalidCommand extends DefaultCommand implements IReceivedCommand{

    private _eventEmitter:EventEmitter;
    private _reason:string;

    constructor(ip:string, command:string[], eventEmitter: EventEmitter, reason:string) {
        super(ip, command);

        this._eventEmitter = eventEmitter;
        this._reason = reason;
    }

    override execute():void{
        this._eventEmitter.emit(EventEmitter.INVALID_COMMAND_RECEIVED, this._ip, this._reason);
    };
}