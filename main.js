const { app, BrowserWindow, ipcMain} = require('electron');



// Permet de faire le Hot Reload
try {
	require('electron-reloader')(module);
} catch (_) {}

 
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let window;

function createWindow() {
    window = new BrowserWindow({
        width: 850,
        height: 650,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    window.loadURL(`file://${__dirname}/index.html`);
    window.once('ready-to-show', function () {
        window.show();
    });

    window.webContents.closeDevTools();

    let contents = window.webContents;

    window.on('closed', function () {
        window = null;
    });
}

app.on('ready', function () { 
    createWindow();
});


ipcMain.on('close-me', (evt, arg) => {
  app.quit()
})
