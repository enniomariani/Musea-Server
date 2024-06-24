import {TimeoutHandler} from "renderer/network/TimeoutHandler.js";
import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class PongCommand extends DefaultCommand implements IReceivedCommand{
    private _timeoutHandler:TimeoutHandler;
    private _connectedClients:ConnectedClients;

    constructor(ip:string, command:string[],pongTimeoutHandler:TimeoutHandler, connectedClients:ConnectedClients) {
        super(ip, command);

        this._timeoutHandler = pongTimeoutHandler;
        this._connectedClients = connectedClients;
    }

    override execute():void{
        if(this._ip === this._connectedClients.adminApp)
            this._timeoutHandler.stopTimeout();
    };
}