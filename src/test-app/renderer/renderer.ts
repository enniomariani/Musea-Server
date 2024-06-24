import {MainApp} from "./MainApp.js";

document.addEventListener("DOMContentLoaded", async function () {
    const mainApp:MainApp = new MainApp( window.backend);
    await mainApp.loadSettings();
    await mainApp.initFrameWork();
});