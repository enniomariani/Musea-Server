import {TimeoutHandler} from "renderer/network/TimeoutHandler.js";


export class MockTimeoutHandler extends TimeoutHandler{

    init: jest.Mock

    stopTimeout: jest.Mock
    resetAndStartTimeout: jest.Mock

    constructor() {
        super();
        this.init = jest.fn();

        this.stopTimeout = jest.fn();
        this.resetAndStartTimeout = jest.fn();
    }
}