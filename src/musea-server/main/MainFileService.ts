import fs from 'fs';
import path from "node:path";

export class MainFileService {

    static readonly ERROR_FILE_EXISTS: string = "FileService: file already exists, and overwriting is deactivated";
    static readonly ERROR_DIRECTORY_DOES_NOT_EXIST: string = "FileService: folder does not exist!";
    static readonly FILE_SAVED_SUCCESSFULLY: string = "FileService: file saved";
    static readonly FILE_OR_FOLDER_CAN_NOT_BE_DELETED: string = "FileService: file or folder can not be deleted!";
    static readonly FILE_DELETED_SUCCESSFULLY: string = "FileService: file or folder deleted";

    private _dataFolder: string;

    constructor(dataFolder: string) {
        this._dataFolder = dataFolder;
    }
    /**
     * Write a file to the passed path. If overrideExistingFile is false, it returns an error if the file already exists
     */
    async saveFile(filePath: string, fileData: NodeJS.ArrayBufferView, overrideExistingFile: boolean = true, createDirectory: boolean = true): Promise<string> {
        this._validatePath(filePath);

        const directory: string = path.dirname(filePath);


        if (!fs.existsSync(directory)) {
            if (!createDirectory)
                return MainFileService.ERROR_DIRECTORY_DOES_NOT_EXIST;
            else
                fs.mkdirSync(directory, {recursive: true})
        }

        if (!overrideExistingFile && fs.existsSync(filePath))
            return MainFileService.ERROR_FILE_EXISTS;

        await new Promise<void>((resolve, reject) => {
            fs.writeFile(filePath, fileData, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });

        return MainFileService.FILE_SAVED_SUCCESSFULLY;
    }

    async appendToFile(filePath: string, content: string, createDirectory: boolean = true): Promise<string | null> {
        this._validatePath(filePath);

        const directory: string = path.dirname(filePath);

        if (!fs.existsSync(directory)) {
            if (!createDirectory)
                return MainFileService.ERROR_DIRECTORY_DOES_NOT_EXIST;
            else
                fs.mkdirSync(directory, {recursive: true})
        }

        try {
            await fs.promises.appendFile(filePath, content);
            return MainFileService.FILE_SAVED_SUCCESSFULLY;
        } catch (error) {
            console.error("Failed to append to file:", filePath, "Error:", (error as Error).message);
            return null;
        }
    }

    fileExists(path: string): boolean {
        this._validatePath(path);
        return fs.existsSync(path);
    }

    /**
     * Delete files and directories (recursive)
     */
    delete(path: string): string {
        this._validatePath(path);

        try {
            fs.rmSync(path);
            return MainFileService.FILE_DELETED_SUCCESSFULLY;
        } catch (error) {
            return MainFileService.FILE_OR_FOLDER_CAN_NOT_BE_DELETED;
        }
    }

    async loadFile(filePath: string): Promise<Buffer | null> {
        this._validatePath(filePath);

        try {
            let loadedFile: Buffer = await fs.promises.readFile(filePath);
            return loadedFile;
        } catch (error:any) {
            console.error("Failed to load file:", filePath, "Error:", error.message);
            return null;
        }
    }

    private _validatePath(filePath: string): void {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error(`Invalid path: Path must be a non-empty string`);
        }

        const normalizedPath = path.normalize(filePath);
        const normalizedDataFolder = path.normalize(this._dataFolder);

        const absolutePath = path.resolve(normalizedPath);
        const absoluteDataFolder = path.resolve(normalizedDataFolder);

        if (!absolutePath.startsWith(absoluteDataFolder + path.sep) &&
            absolutePath !== absoluteDataFolder) {
            throw new Error(
                `Security error: Path "${filePath}" is outside allowed directory. ` +
                `Resolved to: "${absolutePath}"`
            );
        }

        if (filePath.includes('\0')) {
            throw new Error(`Invalid path: Null byte detected in path`);
        }

        if (filePath.includes('..')) {
            throw new Error(`Invalid path: Path traversal attempt detected`);
        }
    }
}