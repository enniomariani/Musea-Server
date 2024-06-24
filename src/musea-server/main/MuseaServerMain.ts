import {BrowserWindow, ipcMain} from 'electron';
import {MainSocketServer} from "main/MainSocketServer.js";
import {MainFileService} from "main/MainFileService.js";
import {DMXSender} from "main/dmx/DMXSender.js";
import {MainLogFileService} from "main/MainLogFileService.js";

export class MuseaServerMain {
    private _mainWindow: BrowserWindow;

    private _socketServer: MainSocketServer;
    private _mainFileService: MainFileService;
    private _mainLogFileService: MainLogFileService;
    private _dmxSender: DMXSender;

    private _comPort: string | null = null;

    /**
     * Create a new instance of the Musea-Server for the main process
     *
     * @param {string} pathToDataFolder     the path to the folder to store logs, media and json-files
     * @param {} mainWindow the instance of the electron-window in where the Server-Library is used
     */
    constructor(pathToDataFolder: string, mainWindow: BrowserWindow, socketServer: MainSocketServer = new MainSocketServer(), dmxSender: DMXSender = new DMXSender(), logFileService: MainLogFileService = new MainLogFileService()) {
        this._mainWindow = mainWindow;
        this._socketServer = socketServer;
        this._mainFileService = new MainFileService(pathToDataFolder);
        this._dmxSender = dmxSender;
        this._mainLogFileService = logFileService;
    }

    /**
     * Initialize all IPC-handlers and the dmx-framework
     *
     * @param {string | null} comPort   the com-port where the DMX-lights are connected to (e.g. "COM 1"). If null, no DMX-lights are used
     */
    async init(comPort: string | null): Promise<void> {

        this._comPort = comPort;

        if(comPort !== null)
            await this._dmxSender.init(comPort);

        //websocket server
        ipcMain.handle('museaServer:startServer', (event: Electron.IpcMainInvokeEvent, port: number) => {
            this._socketServer.start(port, this._onClientConnected.bind(this), this._onDataFromClient.bind(this), this._onConnectionClosed.bind(this));
        });

        ipcMain.handle('museaServer:sendDataToClient', (event: Electron.IpcMainInvokeEvent, ip: string, data: Uint8Array) => {
            let dataAsNodeBuffer: Buffer = Buffer.from(data);
            return this._socketServer.sendDataToClient(ip, dataAsNodeBuffer);
        });

        ipcMain.handle('museaServer:closeConnection', async (event: Electron.IpcMainInvokeEvent, ip: string): Promise<void> => {
            await this._socketServer.closeConnection(ip);
        });

        //load/save/delete files
        ipcMain.handle('museaServer:saveFile', async (event: Electron.IpcMainInvokeEvent, path: string, data: Uint8Array): Promise<string> => {
            return await this._mainFileService.saveFile(path, data);
        });

        ipcMain.handle('museaServer:deleteFile', (event: Electron.IpcMainInvokeEvent, path: string) => {
            return this._mainFileService.delete(path);
        });

        ipcMain.handle('museaServer:fileExists', (event:Electron.IpcMainInvokeEvent, path: string) => {
            return this._mainFileService.fileExists(path);
        });

        ipcMain.handle('museaServer:loadFile', async (event: Electron.IpcMainInvokeEvent, path: string) => {
            let loadedFileData: Buffer | null = await this._mainFileService.loadFile(path);
            let fileDataAsUint8Array: Uint8Array;

            if (loadedFileData === null)
                return null;
            else {
                fileDataAsUint8Array = new Uint8Array(loadedFileData);
                return fileDataAsUint8Array;
            }
        });

        //log-rotation
        ipcMain.handle('mainLogFileService:init', async (event: Electron.IpcMainInvokeEvent, pathToDataFolder: string): Promise<void> => {
            await this._mainLogFileService.initLogger(pathToDataFolder);
        });

        ipcMain.handle('mainLogFileService:log', (event: Electron.IpcMainInvokeEvent, msg: string): void => {
            this._mainLogFileService.log(msg);
        });

        //handle DMX-lights
        ipcMain.handle('museaServer:getComPortConnectionInfo', (event:Electron.IpcMainInvokeEvent, ) => {
            return this._dmxSender.getComPortConnectionInfo();
        });

        ipcMain.handle('museaServer:sendValueToChannels', (event, animID: number, startChannel: number, endChannel: number, value: number, fadeTimeMS: number) => {
            //this DMX-light has 4 channels: 0-3: each one of them corresponds to a different part of the LEDs
            //so to change the light-intensity of all lights, all 4 channels have to be addressed

            if(this._comPort === null){
                console.error("No COM-port set!");
                return;
            }

            this._dmxSender.sendValueToChannels(startChannel, endChannel, value, fadeTimeMS, animID);
        });
    }

    private _onClientConnected(ip: string) {
        this._mainWindow.webContents.send('clientConnected', ip);
    }

    private _onDataFromClient(ip: string, data: Buffer) {
        let dataAsUint8Array: Uint8Array = new Uint8Array(data);
        this._mainWindow.webContents.send('dataFromClient', ip, dataAsUint8Array);
    }

    private _onConnectionClosed(ip: string) {
        this._mainWindow.webContents.send('clientClosed', ip);
    }
}