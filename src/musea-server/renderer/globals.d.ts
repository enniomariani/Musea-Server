import {MuseaServer} from "renderer/MuseaServer.js";

export {};

declare global {
    interface Window {
        museaServerBackendServer:IBackendServer;
        museaServerBackendEvents:IBackendServerEvents;
        museaServerBackendFiles:IBackendFileService;
        museaServerBackendDMX:IBackendDMXService;
        museaServerBackendLogs:IBackendLogFileService;
    }

    interface IBackendServer {
        startServer(port:number):void;
        sendDataToClient(ip:string, data:Uint8Array):boolean;
        closeConnection(ip:string):void;
    }

    interface IOnClientConnectedFromBackend {
        ( event:Event, ip:string, data:Uint8Array):void
    }

    interface IOnClientClosedFromBackend {
        ( event:Event, ip:string):void
    }

    interface IOnDataReceivedFromBackend {
        (event:Event,ip:string, data:Uint8Array):void
    }

    interface IBackendServerEvents{
        clientConnected(callback:IOnDataReceivedFromBackend):void;
        clientClosed(callback:IOnClientClosedFromBackend):void;
        dataFromClient(callback:IOnClientConnectedFromBackend):void;
    }

    interface IBackendFileService{
        saveFile(path:string, data:Uint8Array):string;
        deleteFile(path:string):string;
        appendToFile(path:string, data:string):string;
        loadFile(path:string):Promise<Uint8Array|null>;
        fileExists(path:string):Promise<boolean>;
    }

    interface IBackendLogFileService{
        init(pathToDataFolder:string):void;
        log(msg:string):void;
    }

    interface IBackendDMXService{
        sendValueToChannels(animID:number, startChannel:number, endChannel:number, value:number, fadeTimeMS:number):void;
        getComPortConnectionInfo():IComPortConnection;
    }
}