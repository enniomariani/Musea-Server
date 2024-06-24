import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {
    SendCommandFactory
} from "renderer/sendCommands/SendCommandFactory.js";
import {SendCommand} from "renderer/sendCommands/SendCommand.js";

let sendCommandFactory: SendCommandFactory;

let createdCommand: SendCommand;

beforeEach(() => {
    sendCommandFactory = new SendCommandFactory();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("method should return the converted Code from ConvertNetworkData.encodeCommand: ", () => {
    it("sendPing()", () => {
        createdCommand = sendCommandFactory.sendPing();
        expect(createdCommand.command).toEqual(["network", "ping"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendPong()", () => {
        createdCommand = sendCommandFactory.sendPong();
        expect(createdCommand.command).toEqual(["network", "pong"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendClientAccepted()", () => {
        createdCommand = sendCommandFactory.sendClientAccepted();
        expect(createdCommand.command).toEqual(["network", "registration", "accepted"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendClientAcceptedButBlock()", () => {
        createdCommand = sendCommandFactory.sendClientAcceptedButBlock();
        expect(createdCommand.command).toEqual(["network", "registration", "accepted_block"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendClientRejected()", () => {
        createdCommand = sendCommandFactory.sendClientRejected();
        expect(createdCommand.command).toEqual(["network", "registration", "rejected"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendRegistrationIsPossible()", () => {
        createdCommand = sendCommandFactory.sendRegistrationIsPossible();
        expect(createdCommand.command).toEqual(["network", "isRegistrationPossible", "yes"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendRegistrationNotPossible()", () => {
        createdCommand = sendCommandFactory.sendRegistrationNotPossible();
        expect(createdCommand.command).toEqual(["network", "isRegistrationPossible", "no"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendContentFile()", () => {
        let fileData: string = "testContentFileContent";

        createdCommand = sendCommandFactory.sendContentFile(fileData);

        expect(createdCommand.command).toEqual(["contents", "put"]);
        expect(createdCommand.payload).toEqual(fileData);
    });

    it("sendMediaID()", () => {
        let mediaId: number = 20;

        createdCommand = sendCommandFactory.sendMediaID(mediaId);

        expect(createdCommand.command).toEqual(["media", "put"]);
        expect(createdCommand.payload).toEqual(mediaId.toString());
    });

    it("sendBlock()", () => {
        createdCommand = sendCommandFactory.sendBlock();
        expect(createdCommand.command).toEqual(["system", "block"]);
        expect(createdCommand.payload).toEqual(null);
    });

    it("sendUnBlock()", () => {
        createdCommand = sendCommandFactory.sendUnBlock();
        expect(createdCommand.command).toEqual(["system", "unblock"]);
        expect(createdCommand.payload).toEqual(null);
    });
});