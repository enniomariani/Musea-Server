import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class PingCommand extends DefaultCommand implements IReceivedCommand{
    private _eventEmitter:EventEmitter;
    private _sendCommandFactory:SendCommandFactory;

    constructor(ip:string, command:string[],eventEmitter: EventEmitter, sendCommandFactory:SendCommandFactory) {
        super(ip, command);

        this._eventEmitter = eventEmitter;
        this._sendCommandFactory = sendCommandFactory;
    }

    override execute():void{
        this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendPong());
    };
}