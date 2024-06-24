
import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {EventEmitter} from "renderer/events/EventEmitter.js";

let eventEmitter: EventEmitter;
let logSpy:any = jest.spyOn(global.console, 'error');


beforeEach(() => {
    eventEmitter = new EventEmitter();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("on(), off() and emit() working together: ", ()=>{
    it("one event-callback added with on() should be called when emit with the same event-type is called", ()=>{
        let callback = jest.fn();
        eventEmitter.on("test", callback);

        eventEmitter.emit("test");

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("if one listener has been added and removed, this should not be called by emit()", ()=>{
        let callback = jest.fn();
        eventEmitter.on("test", callback);

        eventEmitter.off("test", callback);
        eventEmitter.emit("test");

        expect(callback).toHaveBeenCalledTimes(0);
    });

    it("if an event is removed that does not exist, print an error", ()=>{
        let callback = jest.fn();
        eventEmitter.off("test", callback);
        expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it("two event-callbacks added with on() should be called when emit with the same event-type is called", ()=>{
        let callback1 = jest.fn();
        let callback2 = jest.fn();
        eventEmitter.on("test", callback1);
        eventEmitter.on("test", callback2);

        eventEmitter.emit("test");

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("if one listener has been removed, this should not be called by emit()", ()=>{
        let callback1 = jest.fn();
        let callback2 = jest.fn();
        eventEmitter.on("test", callback1);
        eventEmitter.on("test", callback2);

        eventEmitter.off("test", callback1);
        eventEmitter.emit("test");

        expect(callback1).toHaveBeenCalledTimes(0);
        expect(callback2).toHaveBeenCalledTimes(1);
    });
})