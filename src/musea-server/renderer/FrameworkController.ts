import {ReceivedCommandFactory} from "renderer/ReceivedCommandFactory.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {ICloseConnection, ISendDataToClient} from "renderer/network/Server.js";
import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {TimeoutHandler} from "renderer/network/TimeoutHandler.js";
import {RegisterAppTypeCommand} from "renderer/receivedCommands/RegisterAppTypeCommand.js";
import {MediaCommand} from "renderer/receivedCommands/MediaCommand.js";
import {PutContentFileCommand} from "renderer/receivedCommands/PutContentFileCommand.js";
import {PutMediaFileCommand} from "renderer/receivedCommands/PutMediaFileCommand.js";
import {DeleteMediaFileCommand} from "renderer/receivedCommands/DeleteMediaFileCommand.js";
import {SystemCommand} from "renderer/receivedCommands/SystemCommand.js";
import {LightCommand} from "renderer/receivedCommands/LightCommand.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {PongCommand} from "renderer/receivedCommands/PongCommand.js";
import {Logger} from "renderer/Logger.js";
import {SendCommand} from "renderer/sendCommands/SendCommand.js";
import {ConvertNetworkData} from "renderer/network/ConvertNetworkData.js";
import {IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";


export class FrameworkController{

    private _receivedCommandFactory:ReceivedCommandFactory;
    private _eventEmitter:EventEmitter;
    private _connectedClients:ConnectedClients;

    private _checkConnectionTimeout:TimeoutHandler;
    private _pongTimeoutHandler:TimeoutHandler;

    private _sendCommandFactory:SendCommandFactory = new SendCommandFactory();

    private _sendDataToClient:ISendDataToClient | null = null;
    private _closeConnection:ICloseConnection | null = null;

    private _logger:Logger;

    private _commandsToResetTimeout = [MediaCommand, PutContentFileCommand,
        PutMediaFileCommand, DeleteMediaFileCommand, SystemCommand, LightCommand, PongCommand];

    constructor(eventEmitter:EventEmitter, connectedClients:ConnectedClients, pongTimeoutHandler:TimeoutHandler,receivedCommandFactory:ReceivedCommandFactory, checkConnectionTimeout:TimeoutHandler = new TimeoutHandler(), logger:Logger = new Logger(eventEmitter, window.museaServerBackendLogs)) {
        this._eventEmitter = eventEmitter;
        this._receivedCommandFactory = receivedCommandFactory;
        this._connectedClients = connectedClients;
        this._checkConnectionTimeout = checkConnectionTimeout;

        this._pongTimeoutHandler = pongTimeoutHandler;

        this._logger = logger;
    }

    async start(pathtoDataFolder:string, sendDataToClient:ISendDataToClient, closeConnection:ICloseConnection, lightInitSequence:boolean):Promise<void>{
        this._receivedCommandFactory.pathToFiles = pathtoDataFolder;
        await this._receivedCommandFactory.initMediaFileService();

        if(lightInitSequence)
            await this._receivedCommandFactory.startLightInitSequence();

        this._sendDataToClient = sendDataToClient;
        this._closeConnection = closeConnection;

        this._logger.start(pathtoDataFolder);

        this._eventEmitter.on(EventEmitter.SEND_COMMAND, this._handleSendCommand.bind(this));
        this._eventEmitter.on(EventEmitter.CLOSE_CONNECTION, this._handleCloseConnection.bind(this));

        this._checkConnectionTimeout.init(60, this._handleTimeout.bind(this));
        this._pongTimeoutHandler.init(3, this._noPongReceivedInTime.bind(this));
    }

    handleReceivedData(ip:string, data:Uint8Array):void{
        const command:IReceivedCommand | null= this._receivedCommandFactory.createCommand(ip, data);

        this._eventEmitter.emit(EventEmitter.COMMAND_RECEIVED, command);

        command?.execute();

        if(this._connectedClients.adminApp === ip){
            if(command instanceof RegisterAppTypeCommand)
                this._checkConnectionTimeout.resetAndStartTimeout();
            else if(this._isInstanceOfClassType(command, this._commandsToResetTimeout))
                this._checkConnectionTimeout.resetAndStartTimeout();
        }
    }

    handleChunkReceived(ip:string):void{
        if(this._connectedClients.adminApp === ip)
            this._checkConnectionTimeout.resetAndStartTimeout();
    }

    handleClosedConnection(ip:string):void{
        this._receivedCommandFactory.handleClosedConnection(ip);
    }

    private _handleTimeout():void{
        this._checkConnectionTimeout.stopTimeout();

        //the pong-timeout-handler is also injected in the receiveCommandFactory: if the command pong is received, the timer is stopped
        this._pongTimeoutHandler.resetAndStartTimeout();

        this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._connectedClients.adminApp, this._sendCommandFactory.sendPing());
    }

    private _noPongReceivedInTime():void{
        this._eventEmitter.emit(EventEmitter.CLOSE_CONNECTION, this._connectedClients.adminApp)
    }

    private _handleSendCommand(sendToIp:string, command:SendCommand):void{
        if(command.payload === null || command.payload === undefined)
            this._sendDataToClient!(sendToIp, ConvertNetworkData.encodeCommand(...command.command));
        else
            this._sendDataToClient!(sendToIp, ConvertNetworkData.encodeCommand(...command.command, command.payload));
    }

    private _handleCloseConnection(ip:string):void{
        if(this._connectedClients.adminApp === ip)
            this._checkConnectionTimeout.stopTimeout();

        this._closeConnection!(ip);
    }

    private _isInstanceOfClassType(instance: any, classArray: any[]): boolean {
        return classArray.some(classType => instance instanceof classType);
    }
}