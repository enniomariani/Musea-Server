import {MediaFileService} from "renderer/fileServices/MediaFileService.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommandFactory} from "renderer/sendCommands/SendCommandFactory.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class PutMediaFileCommand extends DefaultCommand implements IReceivedCommand{

    private _mediaFileStorageService:MediaFileService;
    private _eventEmitter:EventEmitter;
    private _sendCommandFactory:SendCommandFactory;

    private _fileData:Uint8Array | null;
    private _folderPath:string;
    private _mediaType:string;

    constructor(ip:string, command:string[],mediaFileStorageService: MediaFileService, eventEmitter: EventEmitter, sendCommandFactory:SendCommandFactory,
                folderPath:string, fileData:Uint8Array, mediaType:string) {
        super(ip, command);

        this._mediaFileStorageService = mediaFileStorageService;
        this._eventEmitter = eventEmitter;
        this._sendCommandFactory = sendCommandFactory;
        this._folderPath = folderPath;
        this._fileData = fileData;
        this._mediaType = mediaType;
    }

    override  execute():void{
        let newID: number = this._mediaFileStorageService.save(this._folderPath, this._mediaType, this._fileData!);
        this._fileData = null;
        this._eventEmitter.emit(EventEmitter.SEND_COMMAND, this._ip, this._sendCommandFactory.sendMediaID(newID));
    };

    get folderPath(): string {
        return this._folderPath;
    }

    get mediaType(): string {
        return this._mediaType;
    }
}