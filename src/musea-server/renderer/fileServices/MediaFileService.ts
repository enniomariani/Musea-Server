import {IMediaFile, IMediaMetadata, MediaMetadataManager} from "renderer/fileServices/MediaMetadataManager.js";
import {MediaType} from "renderer/MuseaServer.js";

export class MediaFileService {

    private _backendFileService: IBackendFileService;
    private _mediaMetadataManager: MediaMetadataManager;

    private _loadedMetaData: IMediaMetadata | null = null;

    constructor(backendFileService: IBackendFileService = window.museaServerBackendFiles, mediaMetadataManager: MediaMetadataManager = new MediaMetadataManager()) {
        this._backendFileService = backendFileService;
        this._mediaMetadataManager = mediaMetadataManager;
    }

    async initMetaData(filePath: string) {
        this._mediaMetadataManager.metadataFilePath = filePath;
        this._loadedMetaData = await this._mediaMetadataManager.loadMetadata();
    }

    getFileNameForId(id: number): string | null {
        this._checkIfLoadedMetaDAtaIsSet();

        const fileMetaData: IMediaFile | null = this._mediaMetadataManager.getMediaFileById(this._loadedMetaData!, id);

        if (!fileMetaData)
            return null;
        else
            return fileMetaData.filename;
    }

    getMediaTypeForId(id: number): MediaType | null {
        this._checkIfLoadedMetaDAtaIsSet();

        const fileMetaData: IMediaFile | null = this._mediaMetadataManager.getMediaFileById(this._loadedMetaData!, id);

        if (!fileMetaData)
            return null;
        else
            return fileMetaData.mediaType;
    }

    /**
     *
     * @param {string} mediaType        must be one of the static Types TYPE_IMAGE_JPEG, etc. (they correspond to the file-ending)
     * @param {ArrayBuffer} fileData
     */
    save(folderPath: string, mediaType: string, fileData: Uint8Array): number {
        this._checkIfLoadedMetaDAtaIsSet();

        let newID: number = this._mediaMetadataManager.getNextId(this._loadedMetaData!);
        let fileName: string = newID.toString() + "." + mediaType;

        this._mediaMetadataManager.addMediaFile(this._loadedMetaData!, fileName, mediaType);

        this._backendFileService.saveFile(folderPath + "\\" + fileName, fileData);

        return newID;
    }

    delete(folderPath: string, id: number): void {
        this._checkIfLoadedMetaDAtaIsSet();

        let mediaFileToDelete: IMediaFile | null = this._mediaMetadataManager.getMediaFileById(this._loadedMetaData!, id);

        if (!mediaFileToDelete)
            return;

        this._backendFileService.deleteFile(folderPath + "\\" + mediaFileToDelete.filename);
        this._mediaMetadataManager.deleteMediaFile(this._loadedMetaData!, id);
    }

    private _checkIfLoadedMetaDAtaIsSet(): void {
        if (!this._loadedMetaData)
            throw new Error("Call initMetaData() before this method!");
    }
}