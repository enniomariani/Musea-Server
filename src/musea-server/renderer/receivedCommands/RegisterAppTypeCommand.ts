import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";
import {ContentFileStorageService} from "renderer/fileServices/ContentFileStorageService.js";

export class RegisterAppTypeCommand extends DefaultCommand implements IReceivedCommand {
    static readonly TYPE_ADMIN: string = "typeAdmin";
    static readonly TYPE_USER: string = "typeUser";

    private _appType: string;
    private _connectedClients: ConnectedClients;
    private _eventEmitter: EventEmitter;
    private _sendCommandFactory: SendCommandFactory;
    private _contentFileStorageService: ContentFileStorageService;
    private _pathToContentFile:string;

    constructor(ip:string, command:string[], connectedClients: ConnectedClients, eventEmitter: EventEmitter,
                contentFileStorageService:ContentFileStorageService, pathToContentFile:string, sendCommandFactory: SendCommandFactory, appType: string) {
        super(ip, command);

        this._connectedClients = connectedClients;
        this._eventEmitter = eventEmitter;
        this._sendCommandFactory = sendCommandFactory;
        this._contentFileStorageService = contentFileStorageService;
        this._pathToContentFile = pathToContentFile;

        if (appType === "admin")
            this._appType = RegisterAppTypeCommand.TYPE_ADMIN;
        else if (appType === "user")
            this._appType = RegisterAppTypeCommand.TYPE_USER;
        else
            this._appType = appType;
    }

    override async execute(): Promise<void> {
        if (this._appType === RegisterAppTypeCommand.TYPE_ADMIN) {
            if (this._connectedClients.addAdminAppClient(this._ip)) {
                this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendClientAccepted());
            } else {
                this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendClientRejected());
                return;
            }

            //send block-command to user-app if a new admin-app connects
            //AND this app is a controller-app (which is only the case if the content-file exists)
            if (this._connectedClients.userApp !== null && await this._contentFileStorageService.fileExists(this._pathToContentFile))
                this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._connectedClients.userApp, this._sendCommandFactory.sendBlock());

        } else if (this._appType === RegisterAppTypeCommand.TYPE_USER) {
            if (this._connectedClients.addUserAppClient(this._ip)){
                if (this._connectedClients.adminApp === null)
                    this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendClientAccepted());
                else
                    this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendClientAcceptedButBlock());
            }
            else
                this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendClientRejected());
        } else
            this._eventEmitter.emit(EventEmitter.RECEIVED_INVALID_APP_TYPE, this._ip, this._appType);
    };

    get appType(): string {
        return this._appType;
    }
}