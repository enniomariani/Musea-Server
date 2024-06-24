import {afterEach, beforeEach, describe, expect, it, jest} from "@jest/globals";
import {ConnectedClients} from "renderer/network/ConnectedClients.js";

let connectedClients:ConnectedClients;

beforeEach(() => {
    connectedClients = new ConnectedClients();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("addAdminAppClient() should ", ()=>{
   it("return true if there is no admin app connected", ()=>{
       const returnValue:boolean = connectedClients.addAdminAppClient("192.168.0.2");
       expect(returnValue).toBe(true);
   });

    it("return true if the passed admin-app is already connected", ()=>{
        connectedClients.addAdminAppClient("192.168.0.2");
        const returnValue:boolean = connectedClients.addAdminAppClient("192.168.0.2");
        expect(returnValue).toBe(true);
    });

    it("return false if there is already an admin app connected", ()=>{
        connectedClients.addAdminAppClient("192.168.0.1");
        const returnValue:boolean = connectedClients.addAdminAppClient("192.168.0.2");
        expect(returnValue).toBe(false);
    });
});

describe("addUserAppClient() should ", ()=>{
    it("return true if there is no user app connected", ()=>{
        const returnValue:boolean = connectedClients.addUserAppClient("192.168.0.2");
        expect(returnValue).toBe(true);
    });

    it("return true if the passed user ap is already connected", ()=>{
        connectedClients.addUserAppClient("192.168.0.2");
        const returnValue:boolean = connectedClients.addUserAppClient("192.168.0.2");
        expect(returnValue).toBe(true);
    });

    it("return false if there is already an admin app connected", ()=>{
        connectedClients.addUserAppClient("192.168.0.1");
        const returnValue:boolean = connectedClients.addUserAppClient("192.168.0.2");
        expect(returnValue).toBe(false);
    });
});

describe("clientIsRegistered() should ", ()=>{
    it("return true if the ip was registered as user-app", ()=>{
        let ip:string = "192.168.0.2";

        connectedClients.addUserAppClient(ip);
        const returnValue:boolean = connectedClients.clientIsRegistered(ip);

        expect(returnValue).toBe(true);
    });

    it("return true if the ip was registered as admin-app", ()=>{
        let ip:string = "192.168.0.2";

        connectedClients.addAdminAppClient(ip);
        const returnValue:boolean = connectedClients.clientIsRegistered(ip);

        expect(returnValue).toBe(true);
    });

    it("return false if the ip was not registered", ()=>{
        let ip:string = "192.168.0.2";
        const returnValue:boolean = connectedClients.clientIsRegistered(ip);
        expect(returnValue).toBe(false);
    });
});

describe("removeClient() should ", ()=>{
    it("allow to add another user-app if the ip passed is the one of the user-app connected", ()=>{
        connectedClients.addUserAppClient("192.168.0.1");
        connectedClients.removeClient("192.168.0.1");
        const returnValue:boolean = connectedClients.addUserAppClient("192.168.0.2");

        expect(returnValue).toBe(true);
    });

    it("allow to add another admin-app if the ip passed is the one of the admin-app connected", ()=>{
        connectedClients.addAdminAppClient("192.168.0.1");
        connectedClients.removeClient("192.168.0.1");
        const returnValue:boolean = connectedClients.addAdminAppClient("192.168.0.2");

        expect(returnValue).toBe(true);
    });
});