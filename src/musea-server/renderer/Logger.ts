import {EventEmitter} from "renderer/events/EventEmitter.js";
import {SendCommand} from "renderer/sendCommands/SendCommand.js";
import {IReceivedCommand} from "renderer/receivedCommands/DefaultCommand.js";

export class Logger {

    private _eventEmitter: EventEmitter;
    private _backendLogService: IBackendLogFileService;

    private _console: Console;
    private _window: Window;
    private _originalConsoleError:any;

    private _eventHandlers: Map<string, (...payload: any) => void> = new Map();

    constructor(eventEmitter: EventEmitter, backendLogService: IBackendLogFileService, consoleRef: Console = console, windowRef: Window = window) {
        this._eventEmitter = eventEmitter;
        this._backendLogService = backendLogService;
        this._console = consoleRef;
        this._window = windowRef;

        this._originalConsoleError = this._console.error;

        this._eventHandlers.set(EventEmitter.NEW_CONNECTION, this._onNewConnection.bind(this));
        this._eventHandlers.set(EventEmitter.CLOSE_CONNECTION, this._onConnectionClosed.bind(this));
        this._eventHandlers.set(EventEmitter.COMMAND_RECEIVED, this._onCommandReceived.bind(this));
        this._eventHandlers.set(EventEmitter.RECEIVED_INVALID_APP_TYPE, this._onReceivedInvalidAppType.bind(this));
        this._eventHandlers.set(EventEmitter.INVALID_COMMAND_RECEIVED, this._onReceivedInvalidCommand.bind(this));
        this._eventHandlers.set(EventEmitter.SEND_COMMAND, this._onSendCommand.bind(this));
    }

    start(pathToDataFolder:string): void {

        for (const [eventName, handler] of this._eventHandlers.entries()) {
            this._eventEmitter.on(eventName, handler);
        }

        this._backendLogService.init(pathToDataFolder);

        this._console.error = this._handleConsoleErrors.bind(this);
        this._window.onerror = this._handleUncaughtErrors.bind(this);
        this._window.onunhandledrejection = this._handleUnhadledRedirection.bind(this);
    }

    private _handleUncaughtErrors(event: string | Event, source?: string, lineno?: number, colno?: number, error?: Error): void {
        const message:string = typeof event === 'string' ? event : event.type;
        const errorMsg: string = `Uncaught error: ${message} at ${source}:${lineno}:${colno}`;
        this._logError(errorMsg);
    }

    private _handleConsoleErrors(...args: any[]):void{
        const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
        this._logError(`console.error: ${message}`);
        this._originalConsoleError(...args);
    }

    private _handleUnhadledRedirection(event:any):void{
        const reason = event.reason instanceof Error ? event.reason.stack : JSON.stringify(event.reason);
        this._logError(`Unhandled promise rejection: ${reason}`);
    }

    private _onNewConnection(ip: string): void {
        this._logInfo("New connection from: " + ip);
    }

    private _onConnectionClosed(ip: string): void {
        this._logInfo("Connection closed: " + ip);
    }

    private _onCommandReceived(command:IReceivedCommand):void{
        if(command.command[0] === "volume" || command.command[0] === "seek")
            return;

        this._logInfo("Command received from " + command.ip + ": " + command.command.toString());
    }

    private _onReceivedInvalidAppType(ip:string, appType: string): void {
        this._logInfo("Received request from invalid App-Type from: " + ip + " type: " + appType);
    }

    private _onReceivedInvalidCommand(ip:string, reason: string): void {
        this._logInfo("Invalid command received from: " + ip + " - reason: " + reason);
    }

    private _onSendCommand(ip:string, command: SendCommand): void {
        //log all network- and system-commands sent to other apps
        if(command.command[0] === "network" || command.command[0] === "system") {
            this._logInfo("Send command to " + ip + ": " + command.command.toString());
        }
    }

    private _logInfo(msg: string): void {
        console.log(this._getTime() + ": " + msg);
        this._backendLogService.log(msg);
    }

    private _logError(msg: string): void {
        this._backendLogService.log(msg);
    }

    private _getTime(): string {
        const dateTime: Date = new Date();
        return dateTime.toLocaleString('de-CH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }
}