import {app, BrowserWindow, ipcMain} from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join} from 'path';
import {MuseaServerMain} from "main/MuseaServerMain.js";

//size of main-window
const windowWidth:number = 1920;
const windowHeight:number = 1080;

const filename:string = fileURLToPath(import.meta.url);
const __dirname:string = dirname(filename);

//the NODE_ENV-variable is set before starting the app to "development", if the app is running on
//the development-system
const environment:string | undefined = process.env.NODE_ENV;

let mainWindow:BrowserWindow;
let museaServerMain:MuseaServerMain;

//this is necessary because the path to the data-folder is in the build-folder in the dev-environment but
//in the resources-folder in the production-environment. If in the production-env nothing is specified as path, it looks in the asar-package
const pathToDataFolder:string = environment === 'development' ? join(__dirname, '..', '..','daten\\') : join(process.resourcesPath, '\\daten\\');

app.whenReady().then(async () => {
    mainWindow = new BrowserWindow({
        width: windowWidth, height: windowHeight, kiosk: false,
        autoHideMenuBar: false, fullscreen: false, webPreferences: {
            nodeIntegration: false, contextIsolation: true,
            preload: join(__dirname,'..', "preload", 'preload.js'),sandbox: true
        },
    });

    museaServerMain = new MuseaServerMain(pathToDataFolder, mainWindow);
    await museaServerMain.init("COM 1");

    await mainWindow.loadFile(join(__dirname, '../index.html'));
    mainWindow.webContents.openDevTools();
    mainWindow.show(); //initially sets the focus to the created electron-window

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
});

ipcMain.handle('app:load-settings', (event, args) => {
    return {pathToDataFolder: pathToDataFolder};
});