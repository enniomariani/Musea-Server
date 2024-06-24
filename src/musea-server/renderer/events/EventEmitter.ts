type Listener = (...args: any[]) => void;

export class EventEmitter {
    private events: Map<string, Listener[]>;

    static readonly SEND_COMMAND:string = "sendCommand";
    static readonly COMMAND_RECEIVED:string = "commandReceived";
    static readonly INVALID_COMMAND_RECEIVED:string = "invalidCommandReceived";

    static readonly CLIENT_MEDIA_COMMAND_RECEIVED:string = "mediaCommandReceived";
    static readonly CLIENT_SYSTEM_COMMAND_RECEIVED:string = "systemCommandReceived";

    static readonly RECEIVED_INVALID_APP_TYPE:string = "receivedInvalidAppType";

    static readonly NEW_CONNECTION:string = "newConnection";
    static readonly CLOSE_CONNECTION:string = "closeConnection";
    static readonly CLIENT_ADMIN_APP_CLOSED_CONNECTION:string = "adminAppClosedConnection";

    constructor() {
        this.events = new Map();
    }

    on(event: string, listener: Listener): void {
        if (!this.events.has(event))
            this.events.set(event, []);

        this.events.get(event)!.push(listener);
    }

    off(event: string, listener: Listener): void {
        if (!this.events.has(event)) {
            console.error("Event '" + event + "' can not be removed, it was not found.");
            return;
        }

        const listeners = this.events.get(event);
        const index = listeners!.indexOf(listener);

        if (index !== -1)
            listeners!.splice(index, 1);
    }

    emit(event: string, ...args: any[]): void {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event)!;

        for (const listener of listeners)
            listener(...args);
    }
}