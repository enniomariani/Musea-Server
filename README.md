# Musea-Server
Eine electron-library zur Verwaltung von Medien. Wird über [Musea-Client](https://github.com/enniomariani/Musea-Client) gesteuert. Mehr Informationen unter [Musea](https://github.com/enniomariani/musea).

## Hauptfunktionen
- **Netzwerkkommandos empfangen** – Empfang von Steuerbefehlen über das Netzwerk (Musea Client)  
- **Medien verwalten** – Empfangene Mediendateien speichern und bei Bedarf löschen  
- **DMX-Befehle senden** – Nach Erhalt eines Lichtbefehls entsprechende DMX-Kommandos über den COM-Port ausgeben

## Installation
```shell
npm i musea-server
```

## Schnellstart

Funktionierendes Beispiel in der App [Musea Player](https://github.com/enniomariani/Musea-Player).

**main**

```typescript
import {MuseaServerMain} from "Musea-Server/main";

//Während der Entwicklung muss der Pfad relativ zur Datei main.ts angegeben werden
const pathToDataFolder:string = environment === 'development' ? join(__dirname, '..', '..', '..','daten\\') : join(process.resourcesPath, '\\daten\\');

app.whenReady().then(async () => {
    const mainWindow:BrowserWindow = new BrowserWindow({
        width: windowWidth, height: windowHeight fullscreen: false, webPreferences: {
            nodeIntegration: false, contextIsolation: true,
            preload: join(__dirname,'..', "preload", 'preload.js'),sandbox: true
        },
    });

    const museaServerMain:MuseaServerMain = new MuseaServerMain(pathToDataFolder, mainWindow);
    await museaServerMain.init("COM 1");
    //... nachfolgender electron-main-code...
});
```
**preload**

- Folgenden Code in die Datei preload.ts einfügen.
- Muss bei einem Versions-Update eventuell auch aktualisiert werden!
- Falls ein Bundler für den main/preload-Kontext verwendet wird, sollte der import auch über ```typescriptimport import {exposeMuseaServerAPI} from "Musea-Server/preload"``` funktionieren -> bisher aber nicht getestet.

```typescript
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
```

**renderer**

```typescript
import {MuseaServer} from "Musea-Server/renderer";

const museaServer:MuseaServer = new MuseaServer();

//callbackMediaCommand wird aufgerufen, wenn der Server ein Medien-Kommando (play, pause, seek, stop, etc.) erhält
museaServer.registerMediaCommandCallback(callbackMediaCommand);

//callbackSystemCommand wird aufgerufen, wenn der Server ein System-Kommando (mute, unmute, set volume) erhält
museaServer.registerSystemCommandCallback(callbackSystemCommand);

//callbackAdminAppDisconnected wird aufgerufen, wenn eine verbundene App mit der Rolle "admin" die Verbindung unterbricht
museaServer.registerAdminAppDisconnectedCallback(callbackAdminAppDisconnected);

//pathToDataFolder ist ein string, siehe Variable pathToDataFolder oben im main Kontext
await museaServer.start(pathToDataFolder, {
    port: 5000,  //standard-Port auf dem der Server Nachrichten empfängt
    lightInitSequence: false //wenn true wird beim Start der App eine Sequenz an die DMX-Lichter gesendet (hell - dunkel - hell - preset 1)
});
```

## API Dokumentation
Die vollständige API-Dokumentation befindet sich direkt im Code als JSDoc/TSDoc-Kommentare.

Das aktuelle Klassen-Diagramm befindet sich [hier](docs/UML-Musea-Server.drawio.png).

## Logs
Logs werden im Daten-Ordner (siehe pathToDataFolder unter Schnellstart) im Ordner logs abgelegt. 

## Lizenz
Dieses Projekt steht unter der [GNU General Public License v3.0](LICENSE).

Das bedeutet: Der Code darf genutzt, verändert und weitergegeben werden, aber abgeleitete Werke müssen ebenfalls unter GPL-3.0 veröffentlicht werden.
