//the preload-script does NOT SUPPORT ESM!

import {IOnClientConnected, IOnConnectionClosed, IOnDataReceived} from "main/MainSocketServer.js";

const {ipcRenderer, contextBridge} = require('electron');

console.log("Preload-Script starts: ", process.env.NODE_ENV);

//the "main"-world means the RENDERER-world (the code that runs in the virtual browser)
//this method makes the ipcRenderer-Object available as a sub-object of the window-object (window.ipcRenderer)
//if you include it like this in the renderer.ts: const { backend } = window;, you can use the object ipcRenderer directly
//more info here: https://chiragagrawal65.medium.com/how-to-import-ipcrenderer-in-renderer-process-component-26fef55fa4b7

//--- START FOR MUSEA-SERVER ---
contextBridge.exposeInMainWorld("museaServerBackendServer", {
    startServer: (port: number, onClientConnected: Function, onDataReceived: Function) => ipcRenderer.invoke('museaServer:startServer', port),
    sendDataToClient: (ip: any, data: Uint8Array) => ipcRenderer.invoke('museaServer:sendDataToClient', ip, data),
    closeConnection: (ip: any) => ipcRenderer.invoke('museaServer:closeConnection', ip),
});

contextBridge.exposeInMainWorld("museaServerBackendFiles", {
    saveFile: (path: string, data: Uint8Array) => ipcRenderer.invoke('museaServer:saveFile', path, data),
    deleteFile: (path: string) => ipcRenderer.invoke('museaServer:deleteFile', path),
    fileExists: (path: string) => ipcRenderer.invoke('museaServer:fileExists', path),
    loadFile: (path: string) => ipcRenderer.invoke('museaServer:loadFile', path)
});

contextBridge.exposeInMainWorld("museaServerBackendLogs", {
    init: (pathToDataFolder:string) => ipcRenderer.invoke('mainLogFileService:init', pathToDataFolder),
    log: (msg: string) => ipcRenderer.invoke('mainLogFileService:log', msg)
});

contextBridge.exposeInMainWorld('museaServerBackendEvents', {
    dataFromClient: (callback:IOnDataReceived) => ipcRenderer.on('dataFromClient', callback),
    clientConnected: (callback:IOnClientConnected) => ipcRenderer.on('clientConnected', callback),
    clientClosed: (callback:IOnConnectionClosed) => ipcRenderer.on('clientClosed', callback)
});

contextBridge.exposeInMainWorld('museaServerBackendDMX', {
    sendValueToChannels : (animID:number, startChannel:number, endChannel:number, value:number, fadeTimeMS:number) =>
        ipcRenderer.invoke('museaServer:sendValueToChannels', animID, startChannel, endChannel, value, fadeTimeMS),
    getComPortConnectionInfo: () => ipcRenderer.invoke('museaServer:getComPortConnectionInfo')
});
//--- END FOR MUSEA-SERVER ---