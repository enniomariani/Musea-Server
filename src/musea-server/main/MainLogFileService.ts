import {RotatingFileStream, createStream} from 'rotating-file-stream';
import path from 'path';
import fs from 'fs/promises';

export class MainLogFileService {

    private _logStream: RotatingFileStream | null;
    private _timeStampFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    private _prevLogMsg: string = "";
    private _sameMessageCount: number;

    constructor() {
        this._logStream = null;
        this._sameMessageCount = 0;
    }

    /**
     * should be called once to set up the logging-dir, filename-conventions and file-stream
     *
     * @param {string} pathToDataFolder
     * @returns {Promise<void>}
     */
    async initLogger(pathToDataFolder: string) {
        const logDirectory = path.resolve(pathToDataFolder + 'logs');

        // Ensure the logs directory exists
        try {
            await fs.mkdir(logDirectory, {recursive: true});
        } catch (err) {
            console.error('Failed to create logs directory:', err);
            throw err;
        }

        // Filename generator function for rotation naming
        const fileNameGenerator = (time: number | Date, index?: number) => {
            if (!time) return 'app.log';

            const date = time instanceof Date ? time : new Date(time);
            const year: number = date.getFullYear();
            const month: string = String(date.getMonth() + 1).padStart(2, '0');
            const day: string = String(date.getDate()).padStart(2, '0');

            return `app-${index ?? 0}-${year}-${month}-${day}.log`;
        };

        // Create rotating file stream with your config
        this._logStream = createStream(fileNameGenerator, {
            size: '5M',        // rotate after 5MB
            path: logDirectory,
            maxFiles: 10,       // keep last 10 logs
            compress: false,   // do not compress rotated logs - it's anyway a maximum of 50 MB
        });

        this._logStream.on('error', (err) => {
            console.error('Log stream error:', err);
        });
    }

    log(message: string) {

        if (!this._logStream) {
            console.error('Logger not initialized. Call initLogger() first.');
            return;
        }

        if (message === this._prevLogMsg) {
            this._sameMessageCount++;
        } else {
            if (this._sameMessageCount > 0)
                this._logStream.write(`${this._getLocalTimestamp()}: -- Previous message was logged ${this._sameMessageCount + 1} times\n`);

            this._logStream.write(`${this._getLocalTimestamp()}: ${message}\n`);
            this._sameMessageCount = 0;
        }

        this._prevLogMsg = message;
    }

    private _getLocalTimestamp(): string {
        return this._timeStampFormat.format(new Date());
    }
}
