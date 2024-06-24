import {ContentFileStorageService} from "renderer/fileServices/ContentFileStorageService.js";
import {DefaultCommand, IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class PutContentFileCommand extends DefaultCommand implements IReceivedCommand{

    private _contentFileStorageService:ContentFileStorageService;
    private _filePath:string;
    private _fileData:string;

    constructor(ip:string, command:string[],contentFileStorageService: ContentFileStorageService, filePath:string, fileData:string) {
        super(ip, command);
        this._contentFileStorageService = contentFileStorageService;
        this._filePath = filePath;
        this._fileData = fileData
    }

    execute():void{
        this._contentFileStorageService.save(this._filePath, this._fileData);
    };

    get filePath(): string {
        return this._filePath;
    }
}