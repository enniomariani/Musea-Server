import {createStream} from 'rotating-file-stream';
import fs from 'fs/promises';
import {MainLogFileService} from "main/MainLogFileService.js";
import path from "path";

jest.mock('rotating-file-stream', () => ({
    createStream: jest.fn(),
}));

jest.mock('fs/promises', () => ({
    mkdir: jest.fn(),
}));

describe('MainLogFileService', () => {
    let service: MainLogFileService;
    let mockLogStream: any;
    let dateTimeFormatSpy: jest.SpyInstance;

    const FIXED_TIMESTAMP = 'Thu, 01-01-1970 12:00:00';

    beforeAll(() => {
        // Freeze system time for all tests in this file
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01T12:00:00Z'));

        // Make Intl formatting deterministic and locale-agnostic for this file
        // We return a stable format() that matches the expected test string exactly.
        // This avoids differences like "Do., 01.01.1970, 13:00:00".
        dateTimeFormatSpy = jest
            .spyOn(Intl, 'DateTimeFormat')
            .mockImplementation(() => {
                return { format: () => FIXED_TIMESTAMP } as unknown as Intl.DateTimeFormat;
            });
    });

    afterAll(() => {
        dateTimeFormatSpy.mockRestore();
        jest.useRealTimers();
    });

    beforeEach(() => {
        service = new MainLogFileService();
        mockLogStream = {
            write: jest.fn(),
            on: jest.fn(),
        };
        // Cast createStream as jest.Mock to use jest methods
        (createStream as jest.Mock).mockReturnValue(mockLogStream);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initLogger', () => {
        const pathToDataFolder: string = '/some/folder/';
        const resolvedPath: string = path.resolve(pathToDataFolder + 'logs');

        it('should initialize the logger and create the log directory', async () => {
            // Cast the mock to the correct type so we can use mockResolvedValueOnce
            (fs.mkdir as jest.Mock).mockResolvedValueOnce(undefined);

            await service.initLogger(pathToDataFolder);

            // Check if fs.mkdir was called with the correct log directory
            expect(fs.mkdir).toHaveBeenCalledWith(resolvedPath, {recursive: true});

            // Ensure the log stream was created correctly
            expect(createStream).toHaveBeenCalledTimes(1);
            expect(createStream).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({
                    size: '5M',
                    path: resolvedPath,
                    maxFiles: 10,
                    compress: false,
                })
            );
        });

        it('should throw error if fs.mkdir fails', async () => {
            (fs.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Failed to create directory'));
            await expect(service.initLogger(pathToDataFolder)).rejects.toThrow('Failed to create directory');
        });
    });

    describe('log', () => {
        const pathToDataFolder: string = '/some/folder/';
        const message = 'Test log message';

        it('should log a message with a timestamp', async () => {
            await service.initLogger(pathToDataFolder);
            service.log(message);
            expect(mockLogStream.write).toHaveBeenCalledWith(`${FIXED_TIMESTAMP}: ${message}\n`);
        });

        it('should log repeated messages with a count', async () => {
            await service.initLogger(pathToDataFolder);

            service.log(message);  // First message, count 0
            expect(mockLogStream.write).toHaveBeenCalledWith(`${FIXED_TIMESTAMP}: ${message}\n`);

            service.log(message);  // Same message, count 1
            service.log("next message");  // counted messages are printed when the next message is shown

            // Two separate writes: one for the summary, one for the next message
            expect(mockLogStream.write).toHaveBeenCalledWith(
                `${FIXED_TIMESTAMP}: -- Previous message was logged 2 times\n`
            );
            expect(mockLogStream.write).toHaveBeenCalledWith(
                `${FIXED_TIMESTAMP}: next message\n`
            );
        });

        it('should not log a message if not initialized', () => {
            const originalError = console.error;
            console.error = jest.fn();  // Mock console.error to suppress output

            service.log('Uninitialized message');

            // Ensure an error is logged when the stream is not initialized
            expect(console.error).toHaveBeenCalledWith('Logger not initialized. Call initLogger() first.');

            console.error = originalError;  // Restore original console.error
        });
    });
});
