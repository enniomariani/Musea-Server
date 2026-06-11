import {WebSocket} from "ws";
import {ConvertNetworkData} from "../src/musea-server/renderer/network/ConvertNetworkData.js";

export const NO_RESPONSE_IN_TIME: string = "Did not receive response in time";


export async function waitForWebSocketConnection(localIp:string = ""): Promise<WebSocket> {
    console.log("Connect app via Websocket");
    const serverAddress:string = "ws://localhost:8001";

    return new Promise<WebSocket>((resolve, reject) => {
        let ws:WebSocket;

        if(localIp !== "")
            ws = new WebSocket(serverAddress, {localAddress: localIp});
        else
            ws = new WebSocket(serverAddress);

        ws.on('open', () => {
            console.log('Test: WebSocket connected to:', ws.url);
            resolve(ws);
        });

        ws.on('error', (error) => {
            console.error('Test: WebSocket error:', error);
            reject(ws);
        });
    });
}

export async function waitForRegistrationAsAdminAndSendCommand(ws:WebSocket, command:(string | Uint8Array)[] | null){
    sendCommandToWSClient(ws, ["network", "register", "admin"]);

    try {
        await waitForWebSocketResponse(ws);
    } catch (error) {
        console.log("Error in connecting websocket: ", error);
    }

    return new Promise<(string | Uint8Array)[] | null>(async (resolve, reject) => {
        let response: (string | Uint8Array)[];

        if(command){
            sendCommandToWSClient(ws, command);

            try {
                response = await waitForWebSocketResponse(ws);
                resolve(response);
            } catch (error) {
                console.error("ERROR waiting for response: ", error);
                reject(error);
            }
        }else
            resolve(null);

    });
}

export function sendCommandToWSClient( ws:WebSocket, command: (string | Uint8Array)[]){
    const encodedCommand:Uint8Array = ConvertNetworkData.encodeCommand(...command);
    const junkInfo:Uint8Array = new Uint8Array([0x01, 0x00]);
    ws.send([...junkInfo, ...encodedCommand]);
}

export async function waitForWebSocketResponse(ws: WebSocket): Promise<(string | Uint8Array)[]> {
    let dataWithoutChunkInfo: Uint8Array;

    return new Promise<(string | Uint8Array)[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject([NO_RESPONSE_IN_TIME]);
        }, 2500);

        ws.on('message', (message: Buffer) => {
            clearTimeout(timeout);

            //delete the first 2 bytes, because they hold the information in how many chunks the message was sent, which is not important for the tests
            dataWithoutChunkInfo = new Uint8Array(message.buffer).slice(2);
            const decodedData:(string | Uint8Array)[] = ConvertNetworkData.decodeCommand(dataWithoutChunkInfo)
            resolve(decodedData);
        });
    });
}

export async function waitForTimeOut(timeInMS:number){
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, timeInMS);
    });
}

export function closeWebSocketConnection(ws:WebSocket): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        ws.on('close', () => {
            const timeout = setTimeout(() => {
                console.log('Test: WebSocket connection closed.');
                resolve();
            }, 100);
        });

        ws.on('error', (error) => {
            console.error('Test: WebSocket connection error during close:', error);
            reject(error);
        });

        console.log("call close()")
        ws.close();
    });
}

