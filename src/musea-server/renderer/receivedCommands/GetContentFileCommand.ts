import {ContentFileStorageService} from "renderer/fileServices/ContentFileStorageService.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class GetContentFileCommand extends DefaultCommand implements IReceivedCommand{

    private _contentFileStorageService:ContentFileStorageService;
    private _filePath:string;
    private _eventEmitter:EventEmitter;
    private _sendCommandFactory:SendCommandFactory;

    constructor(ip:string, command:string[], filePath:string, contentFileStorageService: ContentFileStorageService, eventEmitter: EventEmitter, sendCommandFactory:SendCommandFactory) {
        super(ip, command);

        this._filePath = filePath;
        this._contentFileStorageService = contentFileStorageService;
        this._eventEmitter = eventEmitter;
        this._sendCommandFactory = sendCommandFactory;
    }

    async execute():Promise<void>{
        const fileData:string = await this._contentFileStorageService.load(this._filePath);
        this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendContentFile(fileData));
    }

    get filePath(): string {
        return this._filePath;
    }
}