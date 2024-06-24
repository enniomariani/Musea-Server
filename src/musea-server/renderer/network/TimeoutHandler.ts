export class TimeoutHandler {

    private _timeOutId: number | null = null;
    private _callBack:Function | null = null;
    private _timeOutSec:number | null = null;

    constructor() {}

    init(timeoutSec:number, onTimeout:Function):void{
        this._timeOutSec = timeoutSec;
        this._callBack = onTimeout;
    }

    stopTimeout():void{
        if(this._timeOutId){
            clearTimeout(this._timeOutId);
            this._timeOutId = null;
        }
    }

    /**
     * (re)- starts the timeout
     */
    resetAndStartTimeout():void{

        if(this._timeOutSec === null)
            throw new Error("Call init before calling resetAndStartTimeout!");

        if(this._timeOutId)
            clearTimeout(this._timeOutId);

        this._timeOutId = setTimeout(this._callBack!, this._timeOutSec * 1000);
    }
}