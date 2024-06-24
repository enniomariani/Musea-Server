
export interface IOnNewConnection {
    ( ip:string):void
}

export interface IOnConnectionClosed {
    ( ip:string):void
}

export interface ISendDataToClient{
    (ip:string, data:Uint8Array):void
}

export interface ICloseConnection{
    (ip:string):void
}

export interface IOnDataReceived {
    (ip:string, data:Uint8Array):void
}

export class Server{

    private _backendServer:IBackendServer;
    private _backendServerEvents:IBackendServerEvents;
    private _onDataReceivedCallback:IOnDataReceived | null = null;
    private _onChunkReceivedCallback:((ip:string) => void) | null = null;
    private _onNewConnectionCallback:IOnNewConnection | null = null;
    private _onConnectionClosedCallback:IOnConnectionClosed | null = null;
    private _connections:string[] = [];

    private _numChunks:number | null = null;
    private _receivedChunks:number | null = null;
    private _receivedData:Uint8Array | null = null;
    private _receivingChunksFromThisIpAddressAtTheMoment:string | null = null;

    private _serverStarted:boolean = false;

    constructor(backendServer:IBackendServer = window.museaServerBackendServer, backendServerEvents:IBackendServerEvents = window.museaServerBackendEvents) {
        this._backendServer = backendServer;
        this._backendServerEvents = backendServerEvents;
    }

    start(port:number, onNewConnection:IOnNewConnection, onDataReceived:IOnDataReceived, onConnectionClosed:IOnConnectionClosed, onChunkReceived:(ip:string) => void):void{

        if(this._serverStarted){
            console.error("Server has already been started!")
            return;
        }

        this._serverStarted = true;

        this._backendServer.startServer(port);

        this._onNewConnectionCallback = onNewConnection;
        this._onDataReceivedCallback = onDataReceived;
        this._onConnectionClosedCallback = onConnectionClosed;
        this._onChunkReceivedCallback = onChunkReceived;

        this._backendServerEvents.clientConnected(this._onClientConnected.bind(this));
        this._backendServerEvents.dataFromClient(this._onDataReceived.bind(this));
        this._backendServerEvents.clientClosed(this._onClientClosed.bind(this));
    }

    sendDataToClient(ip:string, data:Uint8Array):void{
        if(!this._connections.includes(ip)){
            console.error("Not possible to send data to client, client is not connected: ", ip);
            return;
        }

        this._backendServer.sendDataToClient(ip, data);
    }

    closeConnection(ip:string):void{

        if(!this._connections.includes(ip)){
            console.error("Connection can not be closed, it is not open: ", ip);
            return;
        }

        this._backendServer.closeConnection(ip);
    }

    private _onClientConnected(event:Event, ip:string):void{

        if(this._connections.includes(ip)){
            console.error("Client with the following ip tries to connect, but is already connected: ", ip);
            return;
        }

        this._connections.push(ip);

        if(this._onNewConnectionCallback)
            this._onNewConnectionCallback(ip);
    }

    private _onClientClosed(event:Event, ip:string):void{
        const index:number = this._connections.indexOf(ip);

        this._connections.splice(index, 1);

        if(this._receivingChunksFromThisIpAddressAtTheMoment === ip){
            this._receivingChunksFromThisIpAddressAtTheMoment = null;
            this._numChunks = null;
        }

        if(this._onConnectionClosedCallback)
            this._onConnectionClosedCallback(ip);
    }

    /**
     * Receive data if the backend-server receives data.
     * Can handle data splitted in multiple chunks and adds the chunks together before passing it to the callback specified in the init-method
     */
    private _onDataReceived(event:Event, ip:string, data: Uint8Array):void{
        let dataView:DataView;

        if(this._receivingChunksFromThisIpAddressAtTheMoment !== null && this._receivingChunksFromThisIpAddressAtTheMoment !== ip)
            return;

        if(this._numChunks === null){
            dataView = new DataView(data.buffer);

            this._numChunks = dataView.getUint16(0, true);
            this._receivedChunks = 0;
            this._receivedData = new Uint8Array(data.length -2);
            this._receivedData.set(data.slice(2, data.length));

            this._receivingChunksFromThisIpAddressAtTheMoment = ip;
        }else{
            const newReceivedData = new Uint8Array(this._receivedData!.length + data.length);
            newReceivedData.set(this._receivedData!);
            newReceivedData.set(data, this._receivedData!.length);

            this._receivedData = newReceivedData;
        }

        this._receivedChunks!++;

        if(this._receivedChunks! >= this._numChunks){
            this._numChunks = null;
            this._receivingChunksFromThisIpAddressAtTheMoment = null;

            if(this._onDataReceivedCallback)
                this._onDataReceivedCallback(ip, this._receivedData);

            this._receivedData = null;

        }else if(this._onChunkReceivedCallback)
            this._onChunkReceivedCallback(ip);
    }
}
