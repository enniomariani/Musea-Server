import {MuseaServer, MediaType} from "renderer/MuseaServer.js";

export class MainApp extends EventTarget {
    private _backend: IBackend;

    private _museaServer: MuseaServer;

    private _e2eDivFileName: HTMLDivElement | null = null;
    private _e2eDivFileType: HTMLDivElement | null = null;
    private _e2eDivCommand: HTMLDivElement | null = null;
    private _e2eDivAdminAppDisconnected: HTMLDivElement | null = null;

    private _pathToDataFolder: string | null = null;

    constructor(backend: IBackend, museaServer: MuseaServer = new MuseaServer()) {
        super();
        this._backend = backend;
        this._museaServer = museaServer;
    }

    async loadSettings() {
        let backendData: BackendData = await this._backend.loadSettings();
        this._pathToDataFolder = backendData.pathToDataFolder;

        if(this._pathToDataFolder === null)
            throw new Error("No pathToDataFolder loaded from Backend!");
    }

    async initFrameWork() {
        this._e2eDivFileName = document.createElement('div');
        this._e2eDivFileType = document.createElement('div');
        this._e2eDivCommand = document.createElement('div');
        this._e2eDivAdminAppDisconnected = document.createElement('div');
        this._e2eDivFileName.id = 'e2eFileName';
        this._e2eDivFileType.id = 'e2eFileType';
        this._e2eDivCommand.id = 'e2eCommand';
        this._e2eDivAdminAppDisconnected.id = 'e2eAdminAppDisconnected';

        document.body.appendChild(this._e2eDivFileName);
        document.body.appendChild(this._e2eDivFileType);
        document.body.appendChild(this._e2eDivCommand);
        document.body.appendChild(this._e2eDivAdminAppDisconnected);

        this._museaServer.registerMediaCommandCallback(this._onMediaCommandReceived.bind(this));
        this._museaServer.registerSystemCommandCallback(this._onSystemCommandReceived.bind(this));
        this._museaServer.registerAdminAppDisconnectedCallback(this._onAdminAppDisconnected.bind(this));
        await this._museaServer.start(this._pathToDataFolder!, {
            port: 8001,
            lightInitSequence: false
        });
    }

    private _onMediaCommandReceived(ip: string, command: string[]): void {
        this._e2eDivFileName!.textContent = "";
        this._e2eDivFileType!.textContent = "";
        this._e2eDivCommand!.textContent = "";
        this._e2eDivAdminAppDisconnected!.textContent = "";

        console.log("MEDIA COMMAND RECEIVED: ", ip, command);

        if (command.length >= 1) {

            if (command[0] === "play") {
                console.log("PLAY-COMMAND: ", command[1], this._museaServer.getMediaFileName(parseInt(command[1])), this._museaServer.getMediaType(parseInt(command[1])));
                this._e2eDivFileName!.textContent = this._museaServer.getMediaFileName(parseInt(command[1]));
                this._e2eDivFileType!.textContent = this._museaServer.getMediaType(parseInt(command[1]));
                this._e2eDivCommand!.textContent = command.toString();
            } else if (command[0] === "stop") {
                console.log("STOP-COMMAND: ", command[1]);
                this._e2eDivCommand!.textContent = command.toString();
            }

        }
    }

    private _onSystemCommandReceived(ip: string, command: string[]): void {
        this._e2eDivCommand!.textContent = "";
        this._e2eDivAdminAppDisconnected!.textContent = "";

        console.log("SYSTEM COMMAND RECEIVED: ", ip, command);

        if (command.length >= 1) {
            if (command[0] === "volume") {
                console.log("VOLUME-COMMAND: ", command);
                this._e2eDivCommand!.textContent = command.toString();
            }
        }
    }

    private _onAdminAppDisconnected(): void {
        this._e2eDivAdminAppDisconnected!.textContent = "fired";
    }
}