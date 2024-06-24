import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class CheckRegistrationStateCommand extends DefaultCommand implements IReceivedCommand{
    private _connectedClients:ConnectedClients;
    private _eventEmitter: EventEmitter;
    private _sendCommandFactory: SendCommandFactory;

    constructor(ip:string, command:string[],connectedClients: ConnectedClients, eventEmitter: EventEmitter, sendCommandFactory: SendCommandFactory) {
        super(ip, command);

        this._connectedClients = connectedClients;
        this._eventEmitter = eventEmitter;
        this._sendCommandFactory = sendCommandFactory;
    }

    override execute():void{
        if(this._connectedClients.adminApp === null || this._connectedClients.adminApp === this._ip)
            this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendRegistrationIsPossible());
        else
            this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendRegistrationNotPossible());
    };
}