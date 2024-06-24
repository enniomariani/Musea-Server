import {WebSocketServer, WebSocket} from "ws";
import {IncomingMessage} from 'http';

export interface IOnDataReceived {
    (ip:string, data:Buffer):void
}

export interface IOnClientConnected{
    (ip:string):void
}

export interface IOnConnectionClosed{
    (ip:string):void
}

export class MainSocketServer {

    private _server:WebSocketServer | null = null;
    private _onDataReceived:IOnDataReceived | null = null;
    private _onClientConnectedCallback:IOnClientConnected | null = null;
    private _onConnectionClosedCallback:IOnConnectionClosed | null = null;

    private _clients:Map<string, WebSocket> = new Map<string, WebSocket>();
    private _clientsMessageListeners:Map<string, (data: Buffer) => void> = new Map<string, (data: Buffer) => void>();
    private _clientsCloseListeners:Map<string, (ip:string, code:number) => void> = new Map<string, (ip:string, code:number) => void>();

    constructor() {}

    start(port:number, onClientConnected:IOnClientConnected, onDataReceived:IOnDataReceived, onConnectionClosed:IOnConnectionClosed):void{
        this._onDataReceived = onDataReceived;
        this._onClientConnectedCallback = onClientConnected;
        this._onConnectionClosedCallback = onConnectionClosed;

        this._server = new WebSocketServer({port: port});

        this._server.on('connection', this._onClientConnected.bind(this));
        this._server.on('error', this._onServerError.bind(this));
    }

    async closeConnection(ip:string):Promise<void>{
        let connection:WebSocket | undefined = this._clients.get(ip);

        if(connection){
            connection.off('error', console.error);
            connection.off('message', this._clientsMessageListeners.get(ip)!);
            connection.off('close', this._clientsCloseListeners.get(ip)!);
            this._clients.delete(ip);

            if(this._onConnectionClosedCallback)
                await this._onConnectionClosedCallback(ip);

            connection.close();
        }
        else
            console.error("connection can not be closed, it's not open: ", ip);
    }

    sendDataToClient(ip:string, data:Buffer):boolean{
        let connection:WebSocket | undefined = this._clients.get(ip);

        if(connection)
        {
            connection.send(data);
            return true;
        }
        else{
            console.error("connection is not open, data can not be sent: ", ip);
            return false;
        }
    }

    _onServerError(error:string):void{
        console.error("SocketServer: error: ", error);
    }

    _onClientConnected(ws:WebSocket, req:IncomingMessage):void{
        const normalizedIp:string | undefined = req.socket.remoteAddress === "::1"? "127.0.0.1": req.socket.remoteAddress;

        if(!normalizedIp)
            return;

        this._clients.set(normalizedIp, ws);

        ws.on('error', console.error);

        this._clientsMessageListeners.set(normalizedIp, (data: Buffer) => {return this._onReceivedMessageFromClient(normalizedIp, data)});
        this._clientsCloseListeners.set(normalizedIp, (ip:string, code:number) => {return this._onConnectionClosed(normalizedIp, code)});

        ws.on('message', this._clientsMessageListeners.get(normalizedIp)!);
        ws.on('close', this._clientsCloseListeners.get(normalizedIp)!);

        if(this._onClientConnectedCallback)
            this._onClientConnectedCallback(normalizedIp);
    }

    _onReceivedMessageFromClient(ip:string, data:Buffer):void{
        if(this._onDataReceived)
            this._onDataReceived(ip,data);
    }

    async _onConnectionClosed(ip:string, code:number):Promise<void>{
        await this.closeConnection(ip);
    }
}