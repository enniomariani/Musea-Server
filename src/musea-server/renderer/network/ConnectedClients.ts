export class ConnectedClients{

    private _userApp:string | null = null;
    private _adminApp:string | null = null;

    constructor() {}

    /**
     * adds the passed ip as admin-app
     *
     * returns true if the app is already connected or not app is connected yet
     * returns false if another admin-app is connected
     *
     * @param {string} ip
     * @returns {boolean}
     */
    addAdminAppClient(ip:string):boolean{
        if(this._adminApp !== null && ip !== this._adminApp)
            return false;

        this._adminApp = ip;
        return true;
    }

    /**
     * adds the passed ip as user-app
     *
     * returns true if the app is already connected or not app is connected yet
     * returns false if another user-app is connected
     *
     * @param {string} ip
     * @returns {boolean}
     */
    addUserAppClient(ip:string):boolean{
        if(this._userApp !== null && ip !== this._userApp)
            return false;

        this._userApp = ip;
        return true;
    }

    clientIsRegistered(ip:string):boolean{
        return this._userApp === ip || this._adminApp === ip;
    }

    removeClient(ip:string){
        if(this._userApp === ip)
            this._userApp = null;
        else if(this._adminApp === ip)
            this._adminApp = null;
    }

    get adminApp(): string | null {
        return this._adminApp;
    }

    get userApp(): string | null {
        return this._userApp;
    }
}