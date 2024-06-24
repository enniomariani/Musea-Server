import {beforeEach, describe, it, jest} from "@jest/globals";
import {Logger} from "renderer/Logger.js";
import {EventEmitter} from "renderer/events/EventEmitter.js"
import {SendCommand} from "renderer/sendCommands/SendCommand.js";
import {MockBackendLogService} from "mocks/main/MockBackendLogService.js";
import {DefaultCommand} from "renderer/receivedCommands/DefaultCommand.js";

let logger: Logger;
let eventEmitter: EventEmitter;
let mockBackendLogService: MockBackendLogService;
let mockConsole: any;
let mockWindow: any;


const pathToDataFolder:string = "path to data folder";

beforeEach(() => {
    eventEmitter = new EventEmitter();
    mockBackendLogService = new MockBackendLogService();

    mockConsole = {
        ...console,
        error: jest.fn(),
    };

    mockWindow = {
        onerror: jest.fn(),
        onunhandledrejection: jest.fn(),
    };

    logger = new Logger(eventEmitter, mockBackendLogService, mockConsole, mockWindow);
});

function checkLogMessage(spy:any, msg: string): void {
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(msg));
    spy.mockRestore();
}

function getLogSpy():any{
    return jest.spyOn(mockBackendLogService, 'log').mockImplementation(() => {});
}

describe("start() ", () => {
    it('should log when NEW_CONNECTION is emitted', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.NEW_CONNECTION, '192.168.1.10');

        checkLogMessage(spy, "New connection from: 192.168.1.10");
    });

    it('should log when CLOSE_CONNECTION is emitted', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.CLOSE_CONNECTION, '192.168.1.11');

        checkLogMessage(spy, "Connection closed: 192.168.1.11");
    });

    it('should log when RECEIVED_INVALID_APP_TYPE is emitted', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.RECEIVED_INVALID_APP_TYPE, '192.168.1.11', "wrongType");

        checkLogMessage(spy, "Received request from invalid App-Type from: 192.168.1.11 type: wrongType");
    });

    it('should log when INVALID_COMMAND_RECEIVED is emitted', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.INVALID_COMMAND_RECEIVED, '192.168.1.11', "myReason");

        checkLogMessage(spy, "Invalid command received from: 192.168.1.11 - reason: myReason");
    });

    it('should log a system-command when SEND_COMMAND is emitted', () => {
        const spy = getLogSpy();
        const command:string[] = ["system", "block"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.SEND_COMMAND, '192.168.1.11', new SendCommand(command));

        checkLogMessage(spy, "Send command to 192.168.1.11: " + command.toString());
    });

    it('should log a system-command when COMMAND_RECEIVED is emitted', () => {
        const spy = getLogSpy();
        const command:string[] = ["network", "ping"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.COMMAND_RECEIVED, new DefaultCommand("192.168.1.1", command));

        checkLogMessage(spy, "Command received from 192.168.1.1: " + command.toString());
    });

    it('should NOT log a system-command when COMMAND_RECEIVED is emitted and the command is equal to seek', () => {
        const spy = getLogSpy();
        const command:string[] = ["seek", "10"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.COMMAND_RECEIVED, new DefaultCommand("192.168.1.1", command));

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should NOT log a system-command when COMMAND_RECEIVED is emitted and the command is equal to volume', () => {
        const spy = getLogSpy();
        const command:string[] = ["volume", "0.3"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.COMMAND_RECEIVED, new DefaultCommand("192.168.1.1", command));

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should log a network-command when SEND_COMMAND is emitted', () => {
        const spy = getLogSpy();
        const command:string[] = ["network", "ping"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.SEND_COMMAND, '192.168.1.11', new SendCommand(command));

        checkLogMessage(spy, "Send command to 192.168.1.11: " + command.toString());
    });

    it('should NOT log a command when SEND_COMMAND is emitted if its anything else than the ones specified above', () => {
        const spy = getLogSpy();
        const command:string[] = ["bla", "bla"];

        logger.start(pathToDataFolder);
        eventEmitter.emit(EventEmitter.SEND_COMMAND, '192.168.1.11', new SendCommand(command));

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should log an uncaught error', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        mockWindow.onerror('TestError', 'script.js', 12, 34, new Error('boom'));

        checkLogMessage(spy, "Uncaught error: TestError at script.js:12:34");
    });

    it('should log an unhandled rejection', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);

        const error = new Error('Promise failed badly');

        // Simulate the unhandled rejection
        mockWindow.onunhandledrejection({
            reason: error
        });

        checkLogMessage(spy, "Unhandled promise rejection: " + error.stack);
    });

    it('should log console-errors', () => {
        const spy = getLogSpy();

        logger.start(pathToDataFolder);
        mockConsole.error('test-console-error-message');

        checkLogMessage(spy, "test-console-error-message");
    });
});