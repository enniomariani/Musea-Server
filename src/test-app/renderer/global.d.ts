export {};

declare global {
    interface Window {
        backend:IBackend;
    }

    interface IBackend {
        loadSettings():BackendData;
    }

    interface BackendData{
        pathToDataFolder: string;
    }
}