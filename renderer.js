//https://github.com/architjn/node-webshot
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const ipc = require('electron').ipcRenderer;
const os = require('os');

// Test si nous sommes sur la plateforme Windows pour les chemins
var isWin = process.platform === "win32";
if (isWin) {
  console.log("OS : Windows")
}

// Ecoute les évenements du bouton lancer
const connectBtn = document.getElementById('boutonOk')
connectBtn.addEventListener('click', onConnect)

// Ecoure les évenements du bouton Quitter
const closeApp = document.getElementById('boutonKo')
closeApp.addEventListener('click', () => {
  ipc.send('close-me')
});

// Cache le Spinner
document.getElementById('spinner').style = "display: none;"
document.getElementById('name').style = "visibility: hidden;"
document.getElementById('nameSource').style = "visibility: hidden;"

document.getElementById('nameSourceOld').style = "visibility: hidden;"
      document.getElementById('nameOld').style = "visibility: hidden;"

document.getElementById('nameImageDiff').style = "visibility: hidden;"
document.getElementById('nameDiff').style = "visibility: hidden;"

// Des variables
let Url = ''
let Echantillons = 0
let Duree = 0
let Directory = ''
let Compteur = 0;
let datetime = "";
let oldFichier = "";
let fichierDiff= "";
let fichier = "";

// SI clique sur le bouton Lancer
function onConnect() {
  // Récupérer les valeurs
  Url = document.getElementById('url').value;
  Directory = document.getElementById('directory').value

  Duree = document.getElementById('duree').value;
  Echantillons = document.getElementById('echantillon').value;

  // Efface le bouton de lancement...
  document.getElementById('boutonOk').setAttribute("disabled", "disabled");
  document.getElementById('spinner').style = "visibility: hidden;"

  // Lance la capture
  run()
}

// Permet de lancer la capture
function run() {
  // Affiche le Spinner
  document.getElementById('spinner').style = "visibility: visible;"

  // Affiche la date et l'heure du lancement du script
  let dateTime_Start = convertDateTime();
  console.log("- Start : " + dateTime_Start);

  console.log(os.homedir())

  // Création de la directory pour la sauvegarde
  createDirectory(Directory);

  // Termine le programme au bout du temps défini par Duree
  setTimeout(function () {
    process.exit(0);
  }, Duree * 60 * 1000);

  // Boucle en échantillon 
  setInterval(function () {

    // Création du nom de fichier
    let dateTime = convertDateTime();

    // Lance la capture de l'image
    captureImage(dateTime)

  }, Echantillons * 1000);
}


// Fonction pour convertir la date et l'heure
function convertDateTime() {
  datetime = dateFormat(new Date(), "dd-mm-yyyy__HH-MM-ss");
  return datetime;
}

// Permet de créer la directory
function createDirectory(Directory) {
  fs.mkdir(path.normalize(Directory), { recursive: true }, (err) => {
    if (err) { 
      return console.error(err); 
  } 
    console.log('Directory created successfully : ' + path.normalize(Directory));
  });
  return true;
}

// Fonction pour comparer images
async function compareImages(imageNew, imageOld, dateTimeDiff) {
  const img1 = PNG.sync.read(fs.readFileSync(imageNew));
  const img2 = PNG.sync.read(fs.readFileSync(imageOld));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const difference = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });

  if (isWin) {
    fichierDiff = path.win32.normalize(path.join(Directory, '/diff_' + dateTimeDiff + '.png'))
  } else {
    fichierDiff = path.join(Directory, '/diff_' + dateTimeDiff + '.png')
  }
  fs.writeFileSync(fichierDiff, PNG.sync.write(diff)); // see diff.png for the difference

  const compatibility = 100 - difference * 100 / (width * height);
  console.log(difference + ' pixels differents');
  console.log('Compatibility: ' + compatibility + '%');

  document.getElementById('nameImageDiff').style = "visibility: visible;"
  document.getElementById('nameDiff').style = "visibility: visible;"

  document.getElementById('nameImageDiff').setAttribute("src", fichierDiff);
  document.getElementById('nameDiff').innerHTML = "Compatibilité : " + compatibility + '%'
}


function captureImage(dateTime) {
  (async () => {
    // Lance la requête Http
    const response = await fetch(Url);
    // Récupère le Body de la page
    const body = await response.text();

    // Extraire les données de l'image
    const data = body.substring(
      body.lastIndexOf(";base64,") + 8,
      body.lastIndexOf("\"><div id=")
    )

    if (isWin) {
      fichier = path.join(Directory, '/screen_' + dateTime + '.png')
    } else {
      fichier = path.join(Directory, '/screen_' + dateTime + '.png')
    }

    // Ecrire l'image sur le disque
    //http://www.codeblocq.com/2016/04/Convert-a-base64-string-to-a-file-in-Node/
    fs.writeFileSync(fichier, data, { encoding: 'base64' }, function (err) {
      console.log('File created');
    });

    document.getElementById('name').style = "visibility: visible;"
    document.getElementById('nameSource').style = "visibility: visible;"

    document.getElementById('name').innerHTML = path.basename(fichier)
    document.getElementById('nameSource').setAttribute("src", fichier);
    


    if (oldFichier != "") {
      await compareImages(fichier, oldFichier, dateTime)

      document.getElementById('nameOld').style = "visibility: visible;"
      document.getElementById('nameSourceOld').style = "visibility: visible;"

      document.getElementById('nameSourceOld').setAttribute("src", oldFichier);
      document.getElementById('nameOld').innerHTML = path.basename(oldFichier)
    }
    oldFichier = fichier

    //console.log(data);
  })();
}


