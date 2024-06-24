import {EventEmitter} from "renderer/events/EventEmitter.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class MediaCommand extends DefaultCommand implements IReceivedCommand{
    private _eventEmitter:EventEmitter;

    constructor(ip:string, command:string[],eventEmitter: EventEmitter) {
        super(ip, command);

        this._eventEmitter = eventEmitter;
        this._command = command;
    }

    override execute():void{
        this._eventEmitter.emit(EventEmitter.CLIENT_MEDIA_COMMAND_RECEIVED, this._ip, this._command);
    };
}