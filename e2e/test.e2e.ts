import {WebSocket} from "ws";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {rmSync, existsSync, appendFileSync} from "fs";
import {after} from "mocha"
import {browser} from 'wdio-electron-service';
import {ConvertNetworkData} from "../src/musea-server/renderer/network/ConvertNetworkData.js";
import {
    closeWebSocketConnection, NO_RESPONSE_IN_TIME,
    sendCommandToWSClient, waitForRegistrationAsAdminAndSendCommand, waitForTimeOut,
    waitForWebSocketConnection, waitForWebSocketResponse
} from "./HelperFunctions.js";


const filename: string = fileURLToPath(import.meta.url);
const dirNameTests: string = dirname(filename);
const dirNameData: string = join(dirNameTests, "..", "out", "Musea-Server-win32-x64", "resources", "daten");
const dirMedia: string = join(dirNameTests, "..", "out", "Musea-Server-win32-x64", "resources", "daten", "media");

let nextId: number = 0;
let tempWS:WebSocket | null = null;

process.env.TEST = 'true';

before(async () => {
    if(existsSync('./e2e/browser.log'))
        rmSync('./e2e/browser.log');

    await browser.waitUntil(
        async () => (await browser.getWindowHandles()).length > 0,
        { timeout: 10000, timeoutMsg: 'Electron window did not open' }
    );

// Find and switch to the main app window (not DevTools -> devTools is also a browser window)
    await browser.waitUntil(
        async () => {
            const handles = await browser.getWindowHandles();

            for (const handle of handles) {
                await browser.switchToWindow(handle);

                // Check if this is the app window with our e2e elements
                const isAppWindow = await browser.execute(() => {
                    return !!document.getElementById('e2eFileName');
                });

                if (isAppWindow) {
                    return true; // Found it!
                }
            }
            return false; // Keep waiting
        },
        {
            timeout: 15000,
            interval: 500,
            timeoutMsg: 'Could not find app window with e2e elements'
        }
    );

    console.log('Successfully connected to app window');
})

describe('Electron Testing', () => {
    it('should print application title', async () => {
        console.log('--- First Test: Hello', await browser.getTitle(), 'application!')
    });
});

describe("Test network calls: ", () => {
    beforeEach(() => {
        console.log("\n\n---- NEW TEST -----\n\n");
    });

    afterEach(async () => {
        console.log("CLOSE CONNECTION TO APP¨!", tempWS)
        if (tempWS && tempWS.readyState === WebSocket.OPEN) {
            try {
                await closeWebSocketConnection(tempWS);
            } catch (error) {
                console.log("Connetion could not be closed: ", error)
            }
        }

        //save console-logs from electron-browser into the file browser.log
        const logs = await browser.getLogs('browser');

        const cleanedLogs = logs.map(log => {
            // Extract just the filename and position (e.g., ReceivedCommandFactory.js 138:16)
            // @ts-ignore
            const cleanedMessage = log.message.replace(
                /file:\/\/\/?.*?([\/\\][^\/\\]+\.js\s+\d+:\d+)/,
                (_:any, match:any) => match.trim()
            );
            // @ts-ignore
            return `[${log.level}] ${cleanedMessage}\n`;
        });

        appendFileSync('./e2e/browser.log', cleanedLogs.join(), 'utf-8');
    });

    after("removeMediaFolder", () => {
        if (existsSync(dirMedia)) {
            console.log("MEDIA-Directory exists, Delete: ", dirMedia);
            rmSync(dirMedia, {recursive: true, force: true});
            console.log("STILL EXISTS? ", existsSync(dirMedia));
        }
    });

    it("should be able to connect to the ws-Server", async () => {
        try {
            tempWS = await waitForWebSocketConnection();
        } catch (error) {
        }

        expect(tempWS?.readyState).toBe(WebSocket.OPEN);
    });

    it("should get a pong-command if it sends a ping-command", async () => {
        const expectedResponse: string[] = ["network", "pong"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "ping"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {
        }

        console.log("CHECK: ", expectedResponse, response)

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get an accepted command if client tries to register as admin-app", async () => {
        const expectedResponse: string[] = ["network", "registration", "accepted"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get an accepted command if client tries to register as admin-app but is already registered", async () => {
        const expectedResponse: string[] = ["network", "registration", "accepted"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {
        }

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get an accepted command if client tries to register as user-app", async () => {
        const expectedResponse: string[] = ["network", "registration", "accepted"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "user"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get an accepted command if client tries to register as user-app and if it is already registered", async () => {
        const expectedResponse: string[] = ["network", "registration", "accepted"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "user"]);

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        sendCommandToWSClient(tempWS, ["network", "register", "user"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get an accepted command if client tries to register as admin-app, closes the conneciton and re-registers", async () => {
        const expectedResponse: string[] = ["network", "registration", "accepted"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);
        let response1: (string | Uint8Array)[] | null = null;

        try {
            response1 = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        try {
            await closeWebSocketConnection(tempWS);
        } catch (error) {
            console.log("Connection could not be closed: ", error)
        }

        tempWS = await waitForWebSocketConnection();
        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);
        let response2: (string | Uint8Array)[] | null = null;

        try {
            response2 = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response1).toStrictEqual(expectedResponse);
        expect(response2).toStrictEqual(expectedResponse);
    });

    it("should get a YES command if client checks registration as admin-app and no admin-app is connected yet", async () => {
        const expectedResponse: string[] = ["network", "isRegistrationPossible", "yes"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "isRegistrationPossible"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get a YES command if client checks registration as admin-app and itself is already connected", async () => {
        const expectedResponse: string[] = ["network", "isRegistrationPossible", "yes"];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        sendCommandToWSClient(tempWS, ["network", "isRegistrationPossible"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response).toStrictEqual(expectedResponse);
    });

    it("should get a NO command if client checks registration as admin-app and an admin-app is already connected", async () => {
        const expectedResponse: string[] = ["network", "isRegistrationPossible", "no"];

        console.log("connect with first IP")
        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        console.log("connect with second IP")

        const ws2:WebSocket = await waitForWebSocketConnection("127.0.0.2");

        sendCommandToWSClient(ws2, ["network", "isRegistrationPossible"]);
        let response: (string | Uint8Array)[] | null = null;

        try {
            response = await waitForWebSocketResponse(ws2);
        } catch (error) {}
        expect(response).toStrictEqual(expectedResponse);

        await closeWebSocketConnection(ws2);
    });

    it("nothing should be answered if I try to send a contents-json without being registered", async () => {
        tempWS = await waitForWebSocketConnection();
        sendCommandToWSClient(tempWS, ["contents", "put", "MY CONTENTS FILE WHICH IS NOT REGISTERED"]);
        sendCommandToWSClient(tempWS, ["contents", "get"]);

        let response = await new Promise<Uint8Array | string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                resolve("OK");
            }, 1000); // Adjust timeout as needed

            tempWS?.on('message', (message: Buffer) => {
                clearTimeout(timeout);
                reject(new Error("I got a command back even if I was not registered: " + ConvertNetworkData.decodeCommand(new Uint8Array(message))));
            });
        });

        expect(response).toBe("OK");
    });

    it("A user-app should get a block-command if an admin-app connects to an app with role controller", async () => {
        let myContentsJSON: string = JSON.stringify({
            image: 0,
            imagePath: "path",
            testBoolean: true
        });
        let response:(string | Uint8Array)[];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        sendCommandToWSClient(tempWS, ["contents", "put", myContentsJSON]);

        const wsUserApp:WebSocket = await waitForWebSocketConnection("127.0.0.2");
        sendCommandToWSClient(wsUserApp, ["network", "register", "user"]);
        try {
            response = await waitForWebSocketResponse(wsUserApp);
        } catch (error) {}

        expect(response!).toStrictEqual(["network", "registration", "accepted_block"]);

        await closeWebSocketConnection(wsUserApp);
    });

    it("I should get my contents back if I put it to the server and try to download it later", async () => {
        let myContentsJSON: string = JSON.stringify({
            image: 0,
            imagePath: "path",
            testBoolean: true
        });
        const expectedResponse: string[] = ["contents", "put", myContentsJSON];

        tempWS = await waitForWebSocketConnection();

        sendCommandToWSClient(tempWS, ["network", "register", "admin"]);

        try {
            await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        sendCommandToWSClient(tempWS, ["contents", "put", myContentsJSON]);
        sendCommandToWSClient(tempWS, ["contents", "get"]);
        let response2: (string | Uint8Array)[] | null = null;

        try {
            response2 = await waitForWebSocketResponse(tempWS);
        } catch (error) {}

        expect(response2).toStrictEqual(expectedResponse);
    });

    it("I should get a string with an empty JSON back if I there is no content-file and I try to download one", async () => {
        const expectedResponse: string[] = ["contents", "put", "{}"];
        let response: (string | Uint8Array)[] | null = null;
        //delete contents-file in the data-folder:
        console.log("PATH TO DATA-FOLDER: ", dirNameData)
        rmSync(dirNameData + "\\contents.json");

        tempWS = await waitForWebSocketConnection();
        response = await waitForRegistrationAsAdminAndSendCommand(tempWS, ["contents", "get"]);

        expect(response).toStrictEqual(expectedResponse);
    });

    it("If a jpeg is put to the server I should get it's ID as an answer-network-call", async () => {
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 100]);
        const expectedResponse: string[] = ["media", "put", nextId.toString()];
        let response: (string | Uint8Array)[] | null = null;

        tempWS = await waitForWebSocketConnection();
        response = await waitForRegistrationAsAdminAndSendCommand(tempWS, ["media", "put", "jpeg", imageData]);

        expect(response).toStrictEqual(expectedResponse);
    });

    it("If a not valid media-type is put to the server I should get nothing as an answer-network-call", async () => {
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 100]);
        let response: (string | Uint8Array)[] | null = null;

        tempWS = await waitForWebSocketConnection();
        try{
            response = await waitForRegistrationAsAdminAndSendCommand(tempWS, ["media", "put", "invalidMediaType", imageData]);
        }catch(error:any){
            response = error;
        }

        expect(response).toStrictEqual([NO_RESPONSE_IN_TIME]);
    });

    it("If a mp4 is put to the server I should get it's ID as an answer-network-call", async () => {
        nextId++;
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 100]);
        const expectedResponse: string[] = ["media", "put", nextId.toString()];
        let response: (string | Uint8Array)[] | null = null;

        tempWS = await waitForWebSocketConnection();
        response = await waitForRegistrationAsAdminAndSendCommand(tempWS, ["media", "put", "mp4", imageData]);

        expect(response).toStrictEqual(expectedResponse);
    });

    it("The server should return the path, id and media-type of an added PNG", async () => {
        nextId++;
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 100]);

        tempWS = await waitForWebSocketConnection();

        const response:(string | Uint8Array)[] | null = await waitForRegistrationAsAdminAndSendCommand(tempWS, ["media", "put", "png", imageData]);

        sendCommandToWSClient(tempWS, ["media", "control", "play", nextId.toString()]);

        // Retrieve the text content of the new div element
        const recievedName = await $('#e2eFileName').getText();
        const recievedType = await $('#e2eFileType').getText();
        const recievedCommand = await $('#e2eCommand').getText();

        console.log('RESPONSE FOR SAVING MEDIA: ', response);
        console.log('RECEIVED VALUES: ', recievedName, recievedType, recievedCommand);

        expect(recievedName).toEqual(nextId.toString() + ".png");
        expect(recievedType).toEqual("png");
        expect(recievedCommand).toEqual("play," + nextId.toString());
    });

    it("The server should return the path, id and media-type of an added JPEG", async () => {
        nextId++;
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 100]);

        tempWS = await waitForWebSocketConnection();

        const response:(string | Uint8Array)[] | null = await waitForRegistrationAsAdminAndSendCommand(tempWS,
            ["media", "put", "jpeg", imageData]);

        sendCommandToWSClient(tempWS, ["media", "control", "play", nextId.toString()]);


        const nameDiv = await $('#e2eFileName');
        const typeDiv = await $('#e2eFileType');
        const commandDiv = await $('#e2eCommand');

        // Retrieve the text content of the new div element
        const recievedName = await nameDiv.getText();
        const recievedType = await typeDiv.getText();
        const recievedCommand = await commandDiv.getText();

        console.log('RESPONSE FOR SAVING MEDIA: ', response);
        console.log('RECEIVED VALUES: ', recievedName, recievedType, recievedCommand);

        expect(recievedName).toEqual(nextId.toString() + ".jpeg");
        expect(recievedType).toEqual("jpeg");
        expect(recievedCommand).toEqual("play," + nextId.toString());
    });

    it("The server should return the path, id and media-type of an added MP4-video", async () => {
        nextId++;
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 200]);

        tempWS = await waitForWebSocketConnection();

        const response:(string | Uint8Array)[] | null = await waitForRegistrationAsAdminAndSendCommand(tempWS,
            ["media", "put", "mp4", imageData]);

        sendCommandToWSClient(tempWS, ["media", "control", "play", nextId.toString()]);

        // Retrieve the text content of the new div element
        const recievedName = await $('#e2eFileName').getText();
        const recievedType = await $('#e2eFileType').getText();
        const recievedCommand = await $('#e2eCommand').getText();

        console.log('RESPONSE FOR SAVING MEDIA: ', response);
        console.log('RECEIVED VALUES: ', recievedName, recievedType, recievedCommand);

        expect(recievedName).toEqual(nextId.toString() + ".mp4");
        expect(recievedType).toEqual("mp4");
        expect(recievedCommand).toEqual("play," + nextId.toString());
    });

    it("The server should delete a media-file if it receives a delete-command", async () => {
        nextId++;
        const imageData: Uint8Array = new Uint8Array([0, 1, 5, 10, 200]);

        tempWS = await waitForWebSocketConnection();

        await waitForRegistrationAsAdminAndSendCommand(tempWS, ["media", "put", "mp4", imageData]);

        sendCommandToWSClient(tempWS, ["media", "delete", nextId.toString()]);

        await waitForTimeOut(500);

        expect(existsSync(dirMedia + "\\" + nextId.toString() + ".mp4")).toBe(false);
    });

    it("The server should delete the media-file with the ID 0 (added in a previous test) if it receives a delete-command", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        sendCommandToWSClient(tempWS, ["media", "delete", "0"]);

        await waitForTimeOut(500);

        expect(existsSync(dirMedia + "\\0.jpeg")).toBe(false);
    });

    it("The server should return null as name and media-type for a previously deleted media", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        sendCommandToWSClient(tempWS, ["media", "control", "play", "0"]);

        const nameDiv = await $('#e2eFileName');
        const typeDiv = await $('#e2eFileType');
        const commandDiv = await $('#e2eCommand');

        // Retrieve the text content of the new div element
        const recievedName = await nameDiv.getText();
        const recievedType = await typeDiv.getText();
        const recievedCommand = await commandDiv.getText();

        console.log('RECEIVED VALUES: ', recievedName, recievedType, recievedCommand);

        expect(recievedName).toEqual("");
        expect(recievedType).toEqual("");
    });

    it("The server should execute the system-command callback with the correct command if it receives a system/volume/mute command", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        sendCommandToWSClient(tempWS, ["system", "volume", "mute"]);

        await waitForWebSocketConnection();

        // Retrieve the text content of the new div element
        const recievedCommand = await $('#e2eCommand').getText();

        console.log('RECEIVED VALUES: ', recievedCommand);

        expect(recievedCommand).toEqual("volume,mute");
    });

    it("The server should execute the system-command callback with the correct command if it receives a system/volume/unmute command", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        sendCommandToWSClient(tempWS, ["system", "volume", "unmute"]);

        await waitForWebSocketConnection();

        // Retrieve the text content of the new div element
        const recievedCommand = await $('#e2eCommand').getText();

        console.log('RECEIVED VALUES: ', recievedCommand);

        expect(recievedCommand).toEqual("volume,unmute");
    });

    it("The server should execute the system-command callback with the correct command if it receives a system/volume/set/0.2 command", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        sendCommandToWSClient(tempWS, ["system", "volume", "set", "0.2"]);

        await waitForWebSocketConnection();

        // Retrieve the text content of the new div element
        const recievedCommand = await $('#e2eCommand').getText();

        console.log('RECEIVED VALUES: ', recievedCommand);

        expect(recievedCommand).toEqual("volume,set,0.2");
    });

    it("The server should execute the AdminAppDisconnected callback when the admin-app closes the connection", async () => {
        tempWS = await waitForWebSocketConnection();
        await waitForRegistrationAsAdminAndSendCommand(tempWS, null);

        // Retrieve the text content of the new div element
        const textAppDisconnected = await $('#e2eAdminAppDisconnected').getText();

        console.log('RECEIVED VALUES: ', textAppDisconnected);

        expect(textAppDisconnected).toEqual("fired");
    });
});