import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import fs from 'fs';
import {PathLike} from 'fs';
import path from "node:path";
import {MainFileService} from "main/MainFileService.js";

let fileService: MainFileService;
jest.mock("fs", () => ({
    promises: {
        readFile: jest.fn(),
        appendFile: jest.fn()
    },
    existsSync: jest.fn(),
    writeFile: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
    rmSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

let mockedFs = fs as jest.Mocked<typeof fs>;

const dataFolder = path.join(__dirname, 'test-data');
const dataFolderInput = dataFolder + "\\";
const validFile = path.join(dataFolder, 'valid-file.txt');

beforeEach(() => {
    fileService = new MainFileService(dataFolderInput);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("saveFile () ", () => {
    mockedFs.writeFile.mockImplementation(
        jest.fn((path, data, optionsOrCallback, callback?:Function) => {
            const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
            if (cb) cb(null);
        }) as any
    );

    it("should call fs.writeFile with the correct path and the passed file-data as ArrayBufferView", async () => {
        const filePath: string = dataFolderInput + "path/to/existent/directory/file.txt";
        const directory = path.dirname(filePath);
        const fileData: Uint8Array = new Uint8Array([0x00, 0xFF, 0xEF]);

        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            if (path === filePath)
                return false;
            else if (path === directory)
                return true;
            else
                throw new Error("path does not exist");
        });

        const returnValue:string = await fileService.saveFile(filePath, fileData);

        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, fileData, expect.anything());
        expect(returnValue).toEqual(MainFileService.FILE_SAVED_SUCCESSFULLY);
    });

    it("should return an error if the passed parameter overrideExistingFile is true and the file already exists", async () => {
        let filePath: string = dataFolderInput + "path/to/existent/directory/file.txt";
        const directory = path.dirname(filePath);
        let returnValue: string;
        let fileData: Uint8Array = new Uint8Array([0x00, 0xFF, 0xEF]);
        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            if (path === filePath)
                return true;
            else if (path === directory)
                return true;
            else
                throw new Error("path does not exist");
        });

        returnValue = await fileService.saveFile(filePath, fileData, false);

        expect(returnValue).toEqual(MainFileService.ERROR_FILE_EXISTS);
        expect(fs.writeFile).toHaveBeenCalledTimes(0);
    });

    it("should return an error if the folder where the file should be saved does not exist and createDirectory is false", async () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        const directory: string = path.dirname(filePath);
        let returnValue: string;
        let fileData: Uint8Array = new Uint8Array([0x00, 0xFF, 0xEF]);
        mockedFs.existsSync.mockImplementation((path: PathLike) => {
            if (path === filePath)
                return false;
            else if (path === directory)
                return false;
            else
                throw new Error("path does not exist");
        });

        returnValue = await fileService.saveFile(filePath, fileData, false, false);

        expect(returnValue).toBe(MainFileService.ERROR_DIRECTORY_DOES_NOT_EXIST);
        expect(fs.writeFile).toHaveBeenCalledTimes(0);
    });

    it("should create the folder where the file should be saved if the folder does not exist and createDirectory is true", async () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        const directory: string = path.dirname(filePath);
        let fileData: Uint8Array = new Uint8Array([0x00, 0xFF, 0xEF]);
        let buffer = Buffer.from(fileData);
        mockedFs.existsSync.mockImplementation((path: PathLike) => {
            if (path === filePath)
                return false;
            else if (path === directory)
                return false;
            else
                throw new Error("path does not exist");
        });

        const returnValue:string = await fileService.saveFile(filePath, fileData, false, true);

        expect(returnValue).toBe(MainFileService.FILE_SAVED_SUCCESSFULLY);
        expect(fs.writeFile).toHaveBeenCalledTimes(1);
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, buffer, expect.anything());
        expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
        expect(fs.mkdirSync).toHaveBeenCalledWith(directory, {recursive: true});
    });
});

describe("appendToFile () ", () => {
    let fileData: string = "data-to-append";
    mockedFs.promises.appendFile.mockReturnValue(Promise.resolve());

    it("should call fs.promises.appendFile with the correct path and the passed string", async () => {
        let filePath: string = dataFolderInput + "path/to/existent/directory/file.txt";
        const directory = path.dirname(filePath);

        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            if (path === filePath)
                return false;
            else if (path === directory)
                return true;
            else
                throw new Error("path does not exist");
        });

        const returnValue:string | null = await fileService.appendToFile(filePath, fileData);

        expect(fs.promises.appendFile).toHaveBeenCalledTimes(1);
        expect(fs.promises.appendFile).toHaveBeenCalledWith(filePath, fileData);
        expect(returnValue).toEqual(MainFileService.FILE_SAVED_SUCCESSFULLY);
    });

    it("should return an error if the folder where the file should be saved does not exist and createDirectory is false", async () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        const directory = path.dirname(filePath);

        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            if (path === filePath || path === directory)
                return false;
            else
                return true;
        });

        const returnValue:string | null = await fileService.appendToFile(filePath, fileData, false);

        expect(returnValue).toBe(MainFileService.ERROR_DIRECTORY_DOES_NOT_EXIST);
        expect(fs.promises.appendFile).toHaveBeenCalledTimes(0);
    });

    it("should create the folder where the file should be saved if the folder does not exist and createDirectory is true", async () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        const directory: string = path.dirname(filePath);

        mockedFs.existsSync.mockImplementation((path: PathLike):boolean => {
            if (path === filePath)
                return false;
            else if (path === directory)
                return false;
            else
                throw new Error("path does not exist");
        });

        const returnValue:string | null = await fileService.appendToFile(filePath, fileData, true);

        expect(returnValue).toBe(MainFileService.FILE_SAVED_SUCCESSFULLY);
        expect(fs.promises.appendFile).toHaveBeenCalledTimes(1);
        expect(fs.promises.appendFile).toHaveBeenCalledWith(filePath, fileData);
        expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
        expect(fs.mkdirSync).toHaveBeenCalledWith(directory, {recursive: true});
    });
});


describe("fileExists () ", () => {
    it("should return true if fs.existsSync returns true", () => {
        let filePath: string = dataFolderInput + "path/to/existent/directory/file.txt";
        let returnValue: boolean;

        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            return true
        });

        returnValue = fileService.fileExists(filePath);

        expect(returnValue).toBe(true);
    });

    it("should return false if fs.existsSync returns false", () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        let returnValue: boolean;

        mockedFs.existsSync.mockImplementation((path: PathLike): boolean => {
            return false
        });

        returnValue = fileService.fileExists(filePath);

        expect(returnValue).toBe(false);
    });
})

describe("delete () ", () => {
    it("should call fs.rmSync if a file is passed", () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        const returnValue: string = fileService.delete(filePath);

        expect(fs.rmSync).toHaveBeenCalledTimes(1);
        expect(fs.rmSync).toHaveBeenCalledWith(filePath);
        expect(returnValue).toBe(MainFileService.FILE_DELETED_SUCCESSFULLY);
    });

    it("should call fs.rmSync if a folder-path is passed", () => {
        let folderPath: string = dataFolderInput + "path/to/nonexistent/directory";
        const returnValue: string = fileService.delete(folderPath);

        expect(fs.rmSync).toHaveBeenCalledTimes(1);
        expect(fs.rmSync).toHaveBeenCalledWith(folderPath);
        expect(returnValue).toBe(MainFileService.FILE_DELETED_SUCCESSFULLY);
    });

    it("should return an error string if file or folder cannot be deleted", () => {
        let folderPath: string = dataFolderInput + "path/to/nonexistent/directory";

        mockedFs.rmSync.mockImplementation(() => {
            throw new Error("file cannot be deleted");
        });

        const returnValue:string = fileService.delete(folderPath);

        expect(returnValue).toBe(MainFileService.FILE_OR_FOLDER_CAN_NOT_BE_DELETED);
    });
});

describe("loadFile () ", () => {
    it("should return the correct fileData if a file is loaded", async () => {
        let filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        let fileData: Buffer = new Buffer([0x00, 0xFF, 0xEF]);

        mockedFs.promises.readFile.mockResolvedValue(fileData);

        const returnValue: Buffer | null = await fileService.loadFile(filePath);

        expect(returnValue).toEqual(fileData);
    });

    it("should return null if the file could not be loaded", async () => {
        const filePath: string = dataFolderInput + "path/to/nonexistent/directory/file.txt";
        mockedFs.promises.readFile.mockRejectedValue(new Error("file cannot be loaded"));
        const returnValue: Buffer | null = await fileService.loadFile(filePath);

        expect(returnValue).toEqual(null);
    });
});

describe('Path Validation Security Tests', () => {
    /**
     * Tests if a file operation properly blocks malicious path attempts
     * @param operation - The function to test (e.g., load, save, delete)
     * @param operationName - Name of the operation for test descriptions
     */
    const testPathValidation = (
        operation: (filePath: string, ...args: any[]) => any,
        operationName: string,
        isSync: boolean = false
    ) => {
        describe(`${operationName} - Path Validation`, () => {
            const maliciousPaths = [
                {
                    name: 'parent directory traversal with ..',
                    path: path.join(dataFolder, '..', '..', 'etc', 'passwd')
                },
                {
                    name: 'relative path traversal',
                    path: '../../../etc/passwd'
                },
                {
                    name: 'absolute path outside data folder',
                    path: '/etc/passwd'
                },
                {
                    name: 'Windows absolute path outside data folder',
                    path: 'C:\\Windows\\System32\\config\\sam'
                },
                {
                    name: 'path with null byte injection',
                    path: path.join(dataFolder, 'file.txt\0.jpg')
                },
                {
                    name: 'encoded path traversal',
                    path: path.join(dataFolder, '..%2F..%2F..%2Fetc%2Fpasswd')
                },
                {
                    name: 'double-encoded path traversal',
                    path: path.join(dataFolder, '..%252F..%252Fetc%252Fpasswd')
                },
                {
                    name: 'path trying to match prefix (data-evil)',
                    path: dataFolder + '-evil/malicious.txt'
                },
                {
                    name: 'empty path',
                    path: ''
                },
                {
                    name: 'path with backslash traversal',
                    path: path.join(dataFolder, '..\\..\\..\\etc\\passwd')
                }
            ];

            test.each(maliciousPaths)(
                'should reject $name',
                async ({ path: maliciousPath }) => {
                    console.log("check malicious path: " + maliciousPath)
                    if (isSync)
                        expect(() => operation(maliciousPath)).toThrow();
                    else
                        await expect(operation(maliciousPath)).rejects.toThrow();
                }
            );

            test('should allow valid path inside data folder', async () => {
                // This test assumes the operation might fail for other reasons
                // (e.g., file doesn't exist), but shouldn't fail with path validation error
                try {
                    await operation(validFile);
                } catch (error: any) {
                    // Should not be a path validation error
                    expect(error.message).not.toMatch(/invalid.*path|path.*invalid|unauthorized/i);
                }
            });

            test('should allow nested valid paths', async () => {
                const nestedPath = path.join(dataFolder, 'subfolder', 'nested', 'file.txt');
                try {
                    await operation(nestedPath);
                } catch (error: any) {
                    expect(error.message).not.toMatch(/invalid.*path|path.*invalid|unauthorized/i);
                }
            });
        });
    };

    testPathValidation(
        (filePath) => fileService.loadFile(filePath),
        'load'
    );

    testPathValidation(
        (filePath) => fileService.saveFile(filePath, new Uint8Array( [ 0x00, 0xFF, 0xEF ] )),
        'save'
    );

    testPathValidation(
        (filePath:string) => fileService.delete(filePath),
        'delete',
        true
    );
});