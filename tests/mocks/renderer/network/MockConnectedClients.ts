import {ConnectedClients} from "renderer/network/ConnectedClients.js";

export class MockConnectedClients extends ConnectedClients{

    addAdminAppClient:jest.Mock
    addUserAppClient:jest.Mock
    clientIsRegistered:jest.Mock
    removeClient:jest.Mock

    constructor() {
        super();
        this.addAdminAppClient = jest.fn();
        this.addUserAppClient = jest.fn();
        this.clientIsRegistered = jest.fn();
        this.removeClient = jest.fn();
    }
}