import {EventEmitter} from "renderer/events/EventEmitter.js";

export class MockEventEmitter extends EventEmitter{

    emit: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;

    constructor() {
        super();
        this.emit = jest.fn();
        this.on = jest.fn();
        this.off = jest.fn();
    }
}