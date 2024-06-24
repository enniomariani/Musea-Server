export enum ComPortState{
    InitNotCalled = "InitNotCalled",
    Connected= "Connected",
    Fail = "Fail"
}

export interface IComPortConnection{
    comPort:string;
    state:ComPortState;
    error?:Error;
}