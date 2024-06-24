import {PingCommand} from "renderer/receivedCommands/PingCommand.js";
import {InvalidCommand} from "renderer/receivedCommands/InvalidCommand.js";
import {RegisterAppTypeCommand} from "renderer/receivedCommands/RegisterAppTypeCommand.js";
import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {PutContentFileCommand} from "renderer/receivedCommands/PutContentFileCommand.js";
import {ContentFileStorageService} from "renderer/fileServices/ContentFileStorageService.js";
import {PutMediaFileCommand} from "renderer/receivedCommands/PutMediaFileCommand.js";
import {ConvertNetworkData} from "renderer/network/ConvertNetworkData.js";
import {GetContentFileCommand} from "renderer/receivedCommands/GetContentFileCommand.js";
import {MediaFileService} from "renderer/fileServices/MediaFileService.js";
import {MediaCommand} from "renderer/receivedCommands/MediaCommand.js";
import {CloseConnectionCommand} from "renderer/receivedCommands/CloseConnectionCommand.js";
import {DeleteMediaFileCommand} from "renderer/receivedCommands/DeleteMediaFileCommand.js";
import {SystemCommand} from "renderer/receivedCommands/SystemCommand.js";
import {LightCommand} from "renderer/receivedCommands/LightCommand.js";
import {LightService} from "renderer/lightService/LightService.js";
import {CheckRegistrationStateCommand} from "renderer/receivedCommands/CheckRegistrationStateCommand.js";
import {TimeoutHandler} from "renderer/network/TimeoutHandler.js";
import {PongCommand} from "renderer/receivedCommands/PongCommand.js";
import {IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";
import {MediaType} from "renderer/MuseaServer.js";

export class ReceivedCommandFactory {

    static readonly FILE_NAME_CONTENT_FILE: string = "contents.json";
    static readonly FILE_NAME_METADATA_FILE: string = "mediaMetadata.json";
    static readonly FOLDER_NAME_MEDIA: string = "media";

    private _connectedClients: ConnectedClients;
    private _eventEmitter: EventEmitter;
    private _sendCommandFactory: SendCommandFactory;
    private _contentFileStorageService: ContentFileStorageService;
    private _mediaFileService: MediaFileService;
    private _pongTimeoutHandler:TimeoutHandler;

    private _pathToFiles: string = "";

    private _commandMap: Map<string, (ip: string, decodedData: any[]) => IReceivedCommand>;

    private _lightService: LightService;

    private _validMediaTypes: Map<string, MediaType> = new Map();
    private _commandsOnlyAllowedIfRegisterd;

    constructor(eventEmitter: EventEmitter, mediaFileService: MediaFileService, connectedClients: ConnectedClients, pongTimeoutHandler:TimeoutHandler, contentFileStorageService: ContentFileStorageService = new ContentFileStorageService(), lightService = new LightService(), sendCommandFactory: SendCommandFactory = new SendCommandFactory()) {
        this._eventEmitter = eventEmitter;
        this._contentFileStorageService = contentFileStorageService;
        this._mediaFileService = mediaFileService;
        this._sendCommandFactory = sendCommandFactory;
        this._connectedClients = connectedClients;
        this._lightService = lightService;

        this._pongTimeoutHandler = pongTimeoutHandler;

        this._validMediaTypes.set("png", MediaType.PNG);
        this._validMediaTypes.set("jpeg", MediaType.JPEG);
        this._validMediaTypes.set("mp4", MediaType.MP4);

        this._commandsOnlyAllowedIfRegisterd = [MediaCommand, PutContentFileCommand,
             PutMediaFileCommand, DeleteMediaFileCommand, SystemCommand, LightCommand];

        //register all possible received commands
        this._commandMap = new Map();

        const COMMANDS = {
            PONG: "network.pong",
            PING: "network.ping",
            REGISTER: "network.register",
            CHECK_REGISTRATION: "network.isRegistrationPossible",
            DISCONNECT: "network.disconnect",
            VOLUME: "system.volume",
            LIGHT: "light.preset",
            MEDIA_CONTROL: "media.control",
            MEDIA_PUT: "media.put",
            MEDIA_DELETE: "media.delete",
            CONTENTS_GET: "contents.get",
            CONTENTS_PUT: "contents.put"
        } as const;

        this._commandMap.set(COMMANDS.PONG, (ip: string, decodedData: any[]) => {
            return new PongCommand(ip, COMMANDS.PONG.split("."), this._pongTimeoutHandler, this._connectedClients);
        });

        this._commandMap.set(COMMANDS.PING, (ip: string, decodedData: any[]) => {
            return new PingCommand(ip, COMMANDS.PING.split("."), this._eventEmitter, this._sendCommandFactory)
        });

        this._commandMap.set(COMMANDS.REGISTER, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.REGISTER.split(".").concat(decodedData[2]), this._eventEmitter, COMMANDS.REGISTER + "-Command, third part is not a string!");

            return new RegisterAppTypeCommand(ip, COMMANDS.REGISTER.split(".").concat(decodedData[2]), this._connectedClients, this._eventEmitter,
                this._contentFileStorageService,this._pathToFiles + ReceivedCommandFactory.FILE_NAME_CONTENT_FILE,  this._sendCommandFactory, decodedData[2])
        });

        this._commandMap.set(COMMANDS.CHECK_REGISTRATION, (ip: string, decodedData: any[]) => {
            return new CheckRegistrationStateCommand(ip, COMMANDS.CHECK_REGISTRATION.split("."), this._connectedClients, this._eventEmitter, this._sendCommandFactory);
        });

        this._commandMap.set(COMMANDS.DISCONNECT, (ip: string, decodedData: any[]) => {
            return new CloseConnectionCommand(ip, COMMANDS.DISCONNECT.split("."), this._eventEmitter);
        });

        this._commandMap.set(COMMANDS.VOLUME, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.VOLUME.split("."), this._eventEmitter, "system.volume Command, third part is not a string!");

            return new SystemCommand(ip, decodedData.slice(1), this._eventEmitter);
        });

        this._commandMap.set(COMMANDS.LIGHT, (ip: string, decodedData: any[]) => {

            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.LIGHT.split("."), this._eventEmitter, COMMANDS.LIGHT + " Command, third part is not a string!");

            return new LightCommand(ip, decodedData.slice(1), this._lightService);
        });

        this._commandMap.set(COMMANDS.MEDIA_CONTROL, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string" || (decodedData.length > 3 && typeof decodedData[3] !== "string"))
                return new InvalidCommand(ip, COMMANDS.MEDIA_CONTROL.split("."), this._eventEmitter, COMMANDS.MEDIA_CONTROL + "-Command, third or forth part is not a string!");

            return new MediaCommand(ip, decodedData.slice(2), this._eventEmitter);
        });

        this._commandMap.set(COMMANDS.MEDIA_PUT, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.MEDIA_PUT.split("."), this._eventEmitter, COMMANDS.MEDIA_PUT.split(".") + "-Command, third part is not a string!");

            if (!(decodedData[2] === "png" || decodedData[2] === "jpeg" || decodedData[2] === "mp4"))
                return new InvalidCommand(ip, COMMANDS.MEDIA_PUT.split("."), this._eventEmitter, COMMANDS.MEDIA_PUT.split(".") + " Command, third part is neither png, jpeg or mp4!");

            return new PutMediaFileCommand(ip,COMMANDS.MEDIA_PUT.split("."), this._mediaFileService, this._eventEmitter, this._sendCommandFactory,
                this._pathToFiles + ReceivedCommandFactory.FOLDER_NAME_MEDIA, decodedData[3], this._validMediaTypes.get(decodedData[2])!);
        });

        this._commandMap.set(COMMANDS.MEDIA_DELETE, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.MEDIA_DELETE.split("."), this._eventEmitter, COMMANDS.MEDIA_DELETE.split(".") +"-Command, third part is not a string!");

            return new DeleteMediaFileCommand(ip, Number(decodedData[2]),
                this._pathToFiles + ReceivedCommandFactory.FOLDER_NAME_MEDIA,
                COMMANDS.MEDIA_DELETE.split("."), this._mediaFileService);
        });

        this._commandMap.set(COMMANDS.CONTENTS_GET, (ip: string, decodedData: any[]) => {
            return new GetContentFileCommand(ip, COMMANDS.CONTENTS_GET.split("."),
                this._pathToFiles + ReceivedCommandFactory.FILE_NAME_CONTENT_FILE,
                this._contentFileStorageService, this._eventEmitter, this._sendCommandFactory);
        });

        this._commandMap.set(COMMANDS.CONTENTS_PUT, (ip: string, decodedData: any[]) => {
            if (typeof decodedData[2] !== "string")
                return new InvalidCommand(ip, COMMANDS.CONTENTS_PUT.split("."),
                    this._eventEmitter, COMMANDS.CONTENTS_PUT.split(".")+ "-Command, third part is not a string!");

            return new PutContentFileCommand(ip, COMMANDS.CONTENTS_PUT.split("."),this._contentFileStorageService,
                this._pathToFiles + ReceivedCommandFactory.FILE_NAME_CONTENT_FILE, decodedData[2]);
        });
    }

    async initMediaFileService(): Promise<void> {
        await this._mediaFileService.initMetaData(this._pathToFiles + ReceivedCommandFactory.FOLDER_NAME_MEDIA + "\\" + ReceivedCommandFactory.FILE_NAME_METADATA_FILE);
    }

    async startLightInitSequence(): Promise<void> {
        await this._lightService.checkComPortState();
        await this._lightService.startLightInitSequence();
    }

    handleClosedConnection(ip: string): void {
        let ipIsAdminApp:boolean = ip === this._connectedClients.adminApp;

        if(ipIsAdminApp && this._connectedClients.userApp)
            this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._connectedClients.userApp, this._sendCommandFactory.sendUnBlock())

        if (this._connectedClients.clientIsRegistered(ip))
            this._connectedClients.removeClient(ip);

        if(ipIsAdminApp)
            this._eventEmitter.emit(EventEmitter.CLIENT_ADMIN_APP_CLOSED_CONNECTION);
    }

    createCommand(ip: string, data: Uint8Array): IReceivedCommand | null {
        let command: IReceivedCommand | null;
        let decodedData: any[] = ConvertNetworkData.decodeCommand(data);

        if (decodedData.length <= 0 || decodedData[0] === ConvertNetworkData.INTERPRETATION_ERROR || decodedData.length > 4){
            let invalidCommand: InvalidCommand = new InvalidCommand(ip, ["invalid data"], this._eventEmitter, "decoded data is invalid! " + decodedData);
            return invalidCommand;
        }

        command = this._getCommand(ip, decodedData[0] + "." + decodedData[1], decodedData)

        if (this._isInstanceOfClassType(command, this._commandsOnlyAllowedIfRegisterd) && !this._connectedClients.clientIsRegistered(ip))
            command = new CloseConnectionCommand(ip,["close connection"], this._eventEmitter);

        return command;
    }

    private _getCommand(ip: string, commandType: string, decodedData: any[]): IReceivedCommand | null {
        const commandFactory = this._commandMap.get(commandType);

        if (commandFactory)
            return commandFactory(ip, decodedData);

        return new InvalidCommand(ip, ["basic command-structure not found"], this._eventEmitter, "Basic command-structure was not found: " + decodedData);
    }

    private _isInstanceOfClassType(instance: any, classArray: any[]): boolean {
        return classArray.some(classType => instance instanceof classType);
    }

    set pathToFiles(value: string) {
        this._pathToFiles = value;
    }
}