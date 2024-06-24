import {MediaFileService} from "renderer/fileServices/MediaFileService.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class DeleteMediaFileCommand extends DefaultCommand implements IReceivedCommand{
    private _mediaFileStorageService:MediaFileService;
    private _folderPath:string;
    private _id:number;

    constructor(ip:string, id:number, folderPath:string, command:string[], mediaFileStorageService: MediaFileService) {
        super(ip, command);
        this._id = id;
        this._folderPath = folderPath;
        this._mediaFileStorageService = mediaFileStorageService;
    }

    execute():void{
        this._mediaFileStorageService.delete(this._folderPath, this._id);
    };

    get id(): number {
        return this._id;
    }

    get folderPath(): string {
        return this._folderPath;
    }
}