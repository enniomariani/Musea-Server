import {MediaType} from "renderer/MuseaServer.js";

export interface IMediaFile {
    id: number;
    filename: string;
    mediaType: MediaType;
}

export interface IMediaMetadata {
    lastId: number;
    mediaFiles: IMediaFile[];
}

export class MediaMetadataManager {
    private _metadataFilePath: string | null = null;
    private _backendFileService: IBackendFileService;

    constructor(backendFileService: IBackendFileService = window.museaServerBackendFiles) {
        this._backendFileService = backendFileService;
    }

    /**
     * returns the loaded metadata from the metadataFilePath passed in the constructor
     * If there is no file or an empty one there, returns an IMediaMetadata JSON with lastID 0 and an empty mediaFile-array
     *
     * @returns {IMediaMetadata}
     */
    async loadMetadata(): Promise<IMediaMetadata> {

        if(!this._metadataFilePath)
            throw new Error("Set file-path before calling loadMetadata()!");

        let loadedData: Uint8Array|null = await this._backendFileService.loadFile(this._metadataFilePath);
        let decoder: TextDecoder = new TextDecoder();
        let json:any;

        if (loadedData !== null && loadedData !== undefined) {
            try{
                json = JSON.parse(decoder.decode(loadedData));
            }
            catch(error){
                throw new Error("loaded media-metadata JSON is not a valid JSON object! " + error + this._metadataFilePath);
            }

            return json;
        }
        else
            return {
                mediaFiles: [],
                lastId: -1,
            }
    }

    saveMetadata(metadata: IMediaMetadata): void {
        if(!this._metadataFilePath)
            throw new Error("Set file-path before calling saveMetadata()!");

        let JSONstring:string = JSON.stringify(metadata);
        const textEncoder:TextEncoder = new TextEncoder();
        let encodedJSON:Uint8Array = textEncoder.encode(JSONstring);

        this._backendFileService.saveFile(this._metadataFilePath, encodedJSON);
    }

    getNextId(metadata: IMediaMetadata): number {
        return metadata.lastId + 1;
    }

    /**
     * adds a media-file to the passed metadata and saves the metadata-file
     * automatically inscreases the id of the new media file by 1 (from the last)
     *
     * @param {IMediaMetadata} metadata
     * @param {string} filename
     * @param {string} mediaType
     */
    addMediaFile(metadata: IMediaMetadata, filename: string, mediaType: string): void {
        metadata.lastId++;
        let newMediaFile:any = {
            id: metadata.lastId,
            filename: filename,
            mediaType: mediaType
        }

        metadata.mediaFiles.push(newMediaFile);

        this.saveMetadata(metadata);
    }

    deleteMediaFile(metadata:IMediaMetadata, id: number): void {
        metadata.mediaFiles = metadata.mediaFiles.filter((mediaFile:IMediaFile):boolean => mediaFile.id !== id);
        this.saveMetadata(metadata);
    }

    getMediaFileById(metadata:IMediaMetadata, id: number): IMediaFile | null{
        const result:IMediaFile | undefined = metadata.mediaFiles.find(i => i.id === id);
        return result? result:null;
    }

    set metadataFilePath(value: string) {
        this._metadataFilePath = value;
    }
}