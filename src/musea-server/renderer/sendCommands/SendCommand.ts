export class SendCommand{
    private _command:string[];
    private _payload:string | null ;

    constructor(command:string[], payload:string | null = null){
        this._command = command;
        this._payload = payload;
    }

    get payload(): string | null {
        return this._payload;
    }

    get command(): string[] {
        return this._command;
    }
}