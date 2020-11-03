const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ipc = require('electron').ipcRenderer;
const Alert = require("electron-alert");
const {centerOnPrimaryDisplay} = require('./Utilitaires/utilitaires')

let alert = new Alert();

// Permet de faire le Hot Reload
try {
    require('electron-reloader')(module);
} catch (_) { }

// Empêche le message d'erreur lié à la sécurité
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Déclarer la variable fene^tre
let window;

// Création de la fenêtre
function createWindow() {
    const width = 850;
  const height = 650;

    // Get X and Y coordinations on primary display
    const winPOS = centerOnPrimaryDisplay(width, height);

    window = new BrowserWindow({
        x: winPOS.x,
        y: winPOS.y,
        width: width,
        height: height,
        minWidth: width,
        minHeight: height,
        show: false,
        backgroundColor: '#312450',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // Ouvre la page index.html
    window.loadURL(`file://${__dirname}/index.html`);
    window.once('ready-to-show', function () {
        window.show();

    });

    // Ferme la fenêtre des outils de dev
    window.webContents.closeDevTools();

    // Si fenêtre fermée
    window.on('closed', function () {
        window = null;
    });
}



// Quand l'interface est construite, affiche la fenêtre
app.on('ready', function () {
    createWindow();
});

// Permte de fermer l'application depuis renderer.js
ipcMain.on('close-me', (evt, arg) => {
    app.quit()
})

ipcMain.on('AfficheAlerte', (event, arg) => {
    alert.fireFrameless(swalOptions, null, true, false);
})

let swalOptions = {
    title: "End of capture",
    type: "info",
    showConfirmButton: true
};

