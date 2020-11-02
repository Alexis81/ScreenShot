
const electron = require('electron');

//-- Test si nous sommes sur une plateforme Windows
function testWindows() {
    // Test si nous sommes sur la plateforme Windows pour les chemins
    var isWin = process.platform === "win32";
    if (isWin) {
        console.log("OS : Windows")
    } else {
        console.log("OS : Mac ou Linux")
    }

    return isWin
}

//-- Fonction pour convertir la date et l'heure
function convertDateTime() {
    let datetime = dateFormat(new Date(), "dd-mm-yyyy__HH-MM-ss");
    return datetime;
}

//-- Permet de créer une Directory
function createDirectory(Directory) {
    fs.mkdir(path.normalize(Directory), { recursive: true }, (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully : ' + path.normalize(Directory));
    });
    return true;
}

function centerOnPrimaryDisplay(winWidth, winHeight)  {
    // Get primary display (screen / monitor) bounds
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.bounds;
  
    // Calculate X and Y coordinates to make rectangular center on primary display
    const winX = x + (width - winWidth) / 2;
    const winY = y + (height - winHeight) / 2;
  
    return {
      x: winX,
      y: winY,
    };
  };


// Exporte les modules
module.exports = {testWindows, convertDateTime, createDirectory, centerOnPrimaryDisplay}