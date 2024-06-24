export interface IReceivedCommand {
    ip: string;
    command:string[];

    execute(): void;
}

export class DefaultCommand implements IReceivedCommand{

    protected _ip:string;
    protected _command:string[];

    constructor(ip:string, command:string[]) {
        this._command = command;
        this._ip = ip;
    }

    execute():void{};

    get ip(): string {
        return this._ip;
    }

    get command(): string[] {
        return this._command;
    }
}