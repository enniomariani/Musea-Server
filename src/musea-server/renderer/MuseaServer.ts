import {Server} from "renderer/network/Server.js";
import {FrameworkController} from "renderer/FrameworkController.js";
import {EventEmitter} from "renderer/events/EventEmitter.js";
import {MediaFileService} from "renderer/fileServices/MediaFileService.js";
import {ReceivedCommandFactory} from "renderer/ReceivedCommandFactory.js";
import {ConnectedClients} from "renderer/network/ConnectedClients.js";
import {TimeoutHandler} from "renderer/network/TimeoutHandler.js";

export const MediaType = {
    PNG: "png",
    JPEG: "jpeg",
    MP4: "mp4"
} as const;
export type MediaType = typeof MediaType[keyof typeof MediaType];

/**
 * @param {string} ip       the ip-adress of the client that sent the command
 * @param {string[]} command    the network-command (e.g. ["play", "1"]) -> see documentation of the network-protocol for more information
 */
export interface IMediaCommandReceived{
    (ip:string, command:string[]):void;
}

/**
 * @param {string} ip       the ip-adress of the client that sent the command
 * @param {string[]} command    the network-command (e.g. ["volume", "mute"]) -> see documentation of the network-protocol for more information
 */
export interface ISystemCommandReceived{
    (ip:string, command:string[]):void;
}

export class MuseaServer {

    private _server:Server;
    private _frameworkController:FrameworkController;
    private _eventEmitter:EventEmitter;
    private _mediaFileService:MediaFileService;

    constructor(server:Server = new Server(), eventEmitter:EventEmitter = new EventEmitter(), connectedClients:ConnectedClients = new ConnectedClients(),pongTimeout:TimeoutHandler = new TimeoutHandler(), mediaFileService:MediaFileService = new MediaFileService(),
                frameworkController:FrameworkController = new FrameworkController(eventEmitter, connectedClients, pongTimeout, new ReceivedCommandFactory(eventEmitter, mediaFileService, connectedClients, pongTimeout))) {
        this._server = server;
        this._frameworkController = frameworkController;
        this._eventEmitter = eventEmitter;
        this._mediaFileService = mediaFileService
    }

    /**
     * Start the server to listen for connections from admin- or user-apps.
     *
     * @param {string} pathToDataFolder the path to the folder where logs, saved media and the contents.json file (if this is defined in the admin-console as controller) are saved
     * @param config        options:
     * - config.port: defines the port on which the server is listening. Default is 5000.
     * - lightInitSequence: if true, the server sends a light-sequence when starting to the DMX-lights: bright - dark -bright and then preset 1.
     */
    async start(pathToDataFolder:string, config:any = {}):Promise<void>{
        let port:number = 5000;

        if(config.port !== undefined)
            port = config.port;

        this._server.start(port, this._onNewConnection.bind(this), this._onDataReceived.bind(this), this._onConnectionClosed.bind(this), this._onChunkReceived.bind(this));
        await this._frameworkController.start(pathToDataFolder, this._server.sendDataToClient.bind(this._server), this._server.closeConnection.bind(this._server), config.lightInitSequence);
    }

    /**
     * Register a callback to receive media-commands from an admin- or user-app.
     * Media-Commands are play, stop, seek, fwd, rew, etc.
     *
     * See documentation of the network-protocol for more information
     */
    registerMediaCommandCallback(callback: IMediaCommandReceived):void{
        this._eventEmitter.on(EventEmitter.CLIENT_MEDIA_COMMAND_RECEIVED, callback);
    }

    /**
     * Register a callback to receive system-commands from an admin- or user-app.
     * System commands are for example volume-commands (mute, unmute, etc.)
     *
     * See documentation of the network-protocol for more information
     */
    registerSystemCommandCallback(callback: ISystemCommandReceived):void{
        this._eventEmitter.on(EventEmitter.CLIENT_SYSTEM_COMMAND_RECEIVED, callback);
    }

    /**
     * Register a callback to handle the case when admin-apps close their connection (either because it crashed,
     * the network connection was lost or because they closed the connection intentionally)
     */
    registerAdminAppDisconnectedCallback(callback:() => void):void{
        this._eventEmitter.on(EventEmitter.CLIENT_ADMIN_APP_CLOSED_CONNECTION, callback);
    }

    /**
     * Return the filename (including the file-ending) for the passed unique media-id.
     * Return null if there is no existing media-file with the passed id
     */
    getMediaFileName(id:number):string | null{
        return this._mediaFileService.getFileNameForId(id);
    }

    /**
     * Return the media-type for the passed id.
     */
    getMediaType(id:number):MediaType | null{
        return this._mediaFileService.getMediaTypeForId(id);
    }

    private _onNewConnection(ip:string):void{
        this._eventEmitter.emit(EventEmitter.NEW_CONNECTION, ip);
    }

    private _onDataReceived(ip:string, data:Uint8Array):void{
        this._frameworkController.handleReceivedData(ip, data);
    }

    private _onChunkReceived(ip:string):void{
        this._frameworkController.handleChunkReceived(ip);
    }

    private _onConnectionClosed(ip:string):void{
        this._frameworkController.handleClosedConnection(ip);
    }
}