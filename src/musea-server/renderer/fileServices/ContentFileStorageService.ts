export class ContentFileStorageService {

    private _backendFileService: IBackendFileService;

    constructor(backendFileService: IBackendFileService = window.museaServerBackendFiles) {
        this._backendFileService = backendFileService;
    }

    save(filePath: string, fileData: string): void {
        let bufferView: Uint8Array;
        let encoder: TextEncoder = new TextEncoder();

        bufferView = encoder.encode(fileData);

        this._backendFileService.saveFile(filePath, bufferView);
    }

    async fileExists(filePath: string): Promise<boolean> {
        let fileExists:boolean = await this._backendFileService.fileExists(filePath);
        return fileExists;
    }

    async load(filePath:string): Promise<string>{
        let loadedData:Uint8Array | null = await this._backendFileService.loadFile(filePath);
        let decoder: TextDecoder = new TextDecoder();

        if(!loadedData)
            return "{}";

        return decoder.decode(loadedData);
    }
}