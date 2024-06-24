import {
    SendCommandFactory
} from "renderer/sendCommands/SendCommandFactory.js";

export class MockSendCommandFactory extends SendCommandFactory{
    sendPing:jest.Mock
    sendPong:jest.Mock

    sendClientAccepted:jest.Mock
    sendClientAcceptedButBlock:jest.Mock
    sendClientRejected:jest.Mock

    sendRegistrationIsPossible:jest.Mock
    sendRegistrationNotPossible:jest.Mock

    sendBlock:jest.Mock
    sendUnBlock:jest.Mock
    sendContentFile: jest.Mock
    sendMediaID: jest.Mock

    constructor() {
        super();
        this.sendPing = jest.fn();
        this.sendPong = jest.fn();

        this.sendClientAccepted = jest.fn();
        this.sendClientAcceptedButBlock = jest.fn();
        this.sendClientRejected = jest.fn();

        this.sendRegistrationIsPossible = jest.fn();
        this.sendRegistrationNotPossible = jest.fn();

        this.sendBlock = jest.fn();
        this.sendUnBlock = jest.fn();
        this.sendContentFile = jest.fn();
        this.sendMediaID = jest.fn();
    }
}