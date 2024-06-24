import {SendCommand} from "renderer/sendCommands/SendCommand.js";

export class SendCommandFactory{

    constructor() {}

    sendPing():SendCommand{
        return new SendCommand(["network", "ping"]);
    }

    sendPong():SendCommand{
        return new SendCommand(["network", "pong"]);
    }

    sendClientAccepted():SendCommand{
        return new SendCommand(["network", "registration", "accepted"]);
    }

    sendClientAcceptedButBlock():SendCommand{
        return new SendCommand(["network", "registration", "accepted_block"]);
    }

    sendClientRejected():SendCommand{
        return new SendCommand(["network", "registration", "rejected"]);
    }

    sendRegistrationIsPossible():SendCommand{
        return new SendCommand(["network", "isRegistrationPossible", "yes"]);
    }

    sendRegistrationNotPossible():SendCommand{
        return new SendCommand(["network", "isRegistrationPossible", "no"]);
    }

    sendContentFile(fileData:string):SendCommand{
        return new SendCommand(["contents", "put"], fileData);
    }

    sendMediaID(id:number):SendCommand{
        return new SendCommand(["media", "put"], id.toString());
    }

    sendBlock():SendCommand{
        return new SendCommand(["system", "block"]);
    }

    sendUnBlock():SendCommand{
        return new SendCommand(["system", "unblock"]);
    }
}