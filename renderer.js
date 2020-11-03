// Les includes
const ipc = require('electron').ipcRenderer;
const { shell } = require('electron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const log = require('electron-log')
const notifier = require('node-notifier');


const { testWindows, convertDateTime, createDirectory } = require('./Utilitaires/utilitaires')

// Des variables
let Url = ''
let Echantillons = 0
let Duree = 0
let Directory = ""
let Compteur = 0;
let datetime = "";
let oldFichier = "";
let fichierDiff = "";
let fichier = "";
let compteur = 0

// Test si nous sommes sous windows
let isWin = testWindows()


//-- Ecoute des boutons -----------------------------------------------
// Bouton OK
const connectBtn = document.getElementById('boutonOk')
connectBtn.addEventListener('click', onConnect)

// Bouton Quit
const closeApp = document.getElementById('boutonKo')
closeApp.addEventListener('click', () => {
  ipc.send('close-me')
});

// Ecoute Files
const filesBtn = document.getElementById('files')
filesBtn.addEventListener('click', () => {
  shell.showItemInFolder(fichier);
});

//-- Ecoute des images si clique ---------------------------------------
// Image New
const imageNew = document.getElementById('nameSource')
imageNew.addEventListener('click', () => {
  shell.openPath(fichier);
});

// Image Old
const imageOld = document.getElementById('nameSourceOld')
imageOld.addEventListener('click', () => {
  shell.openPath(oldFichier);
});

// Image Diff
const imageDiff = document.getElementById('nameImageDiff')
imageDiff.addEventListener('click', () => {
  shell.openPath(fichierDiff);
});

//-- Cacher les éléments de la page ------------------------------------
// Image New plus le chemin
document.getElementById('name').style = "visibility: hidden;"
document.getElementById('nameSource').style = "visibility: hidden;"

// Image Old plus le chemin
document.getElementById('nameSourceOld').style = "visibility: hidden;"
document.getElementById('nameOld').style = "visibility: hidden;"

// Image Diff plus le chemin
document.getElementById('nameImageDiff').style = "visibility: hidden;"
document.getElementById('nameDiff').style = "visibility: hidden;"

// Pour la progresse Bar
document.getElementById("containerProgresse").style = "visibility: hidden;"

// Désactive le bouton Files
//https://stackoverflow.com/questions/11737512/document-getelementbyidbtnid-disabled-is-not-working-in-firefox-and-chrome
document.getElementById('files').setAttribute("disabled", "disabled");



//-- SI clique sur le bouton Run ----------------------------------
function onConnect() {
  // Récupérer les valeurs des boîtes de saisies
  Url = document.getElementById('url').value;
  Directory = document.getElementById('directory').value
  Duree = document.getElementById('duree').value;
  Echantillons = document.getElementById('echantillon').value;

  // Init de la log
  log.transports.file.level = 'info'

  // Si nous sommes sous Windows normalize le chemin
  if (isWin) {
    log.transports.file.file = path.win32.normalize(path.join(Directory, "/ScreenShot.log"))
  } else {
    log.transports.file.file = path.join(Directory, "/ScreenShot.log")
  }


  // Désactive le bouton Run
  document.getElementById('boutonOk').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Running...'

  // Lance la capture
  run()
}

//-- Permet de lancer la capture ---------------------------------
function run() {

  // Affiche la date et l'heure du lancement du script
  let dateTime_Start = convertDateTime();
  console.log("- Start : " + dateTime_Start);
  log.info("*** Start : " + dateTime_Start)
  // Ecrire dans la textarea
  addtext("*** Start : " + dateTime_Start.replace("__", " "))

  document.getElementById("containerProgresse").style = "visibility: visible;"


  // Création de la directory pour la sauvegarde
  createDirectory(Directory);

  // Termine le programme au bout du temps défini par Duree
  setTimeout(function () {
    document.getElementById("progress").style = "width: 100%"
    log.info("*** End : " + convertDateTime())
    addtext("*** End : " + convertDateTime().replace("__", " "))
    // Arrête la boucle pour faire des captures
    clearInterval(intervalEchantillon)
    // Mettre le bouton Run comme avant
    document.getElementById('boutonOk').innerHTML = 'Run'
    ipc.send('AfficheAlerte')
  }, Duree * 60 * 1000);

  // Boucle en échantillon 
  let intervalEchantillon = setInterval(function () {
    compteur = compteur + 1

    // Lance la capture de l'image
    captureImage(convertDateTime())

    // Calcul pourcentage
    let dureeMs = Duree * 60
    let nombreBoucle = dureeMs / Echantillons
    let pourcentage = (compteur / nombreBoucle) * 100;
    let pourcentageArrondi = Math.round(pourcentage)

    document.getElementById("progress").style = "width: " + pourcentage.toString() + "%"
    document.getElementById("progress").innerText = pourcentageArrondi.toString() + "%"

  }, Echantillons * 1000);
}


//-- Fonction pour comparer images
async function compareImages(imageNew, imageOld, dateTimeDiff) {
  const img1 = PNG.sync.read(fs.readFileSync(imageNew));
  const img2 = PNG.sync.read(fs.readFileSync(imageOld));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  // Calcul la différence entre les deux images
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

  // Affiche l'image Diff plus le chemin
  document.getElementById('nameImageDiff').style = "visibility: visible;"
  document.getElementById('nameDiff').style = "visibility: visible; font-size: 8px; color:#ffffff;"

  // Valorise l'image Diff plus le chemin
  document.getElementById('nameImageDiff').setAttribute("src", fichierDiff);
  document.getElementById('nameDiff').innerHTML = "Compatibilité : " + compatibility + '%' + " - Pixels : " + difference

  // Si l'image ne change pas, écrire dans la log
  if (compatibility == 100) {
    log.warn("Frozen image..")
    log.warn(" - Old image : " + imageOld)
    log.warn(" - Image : " + imageNew)
    log.warn(" - Image Diff : " + fichierDiff)

    // Ecrire dans la textarea
    addtext("Frozen image..")
    addtext(" - Old image : " + imageOld)
    addtext(" - Image : " + imageNew)
    addtext(" - Image Diff : " + fichierDiff)

    // Lance une notification dans l'OS
    notifier.notify({
      title: 'Frozen image',
      message: dateTimeDiff,
      icon: path.join(__dirname, '/assets/logo/Logo.jpg'),
      timeout: 5
    });
  }
}

//-- Fonction pour capturer l'image depuis l'URL
/*
FetchError: request to http://192.168.1.102:8080/index.html failed, reason: connect EHOSTDOWN 192.168.1.102:8080 - Local (192.168.1.103:59451)
*/
function captureImage(dateTime) {
  (async () => {
    // Lance la requête Http
    const response = await fetch(Url)
      .catch(err => addtext(err));
    if (response.status == 200) {
      // Récupère le Body de la page
      const body = await response.text()
        .catch(err => addtext(err));

      // Extraire les données de l'image
      const data = body.substring(
        body.lastIndexOf(";base64,") + 8,
        body.lastIndexOf("\"><div id=")
      )

      // Test si nous sommes sous Windows pour le Path
      if (isWin) {
        fichier = path.win32.normalize(path.join(Directory, '/screen_' + dateTime + '.png'))
      } else {
        fichier = path.join(Directory, '/screen_' + dateTime + '.png')
      }

      // Ecrire l'image sur le disque
      //http://www.codeblocq.com/2016/04/Convert-a-base64-string-to-a-file-in-Node/
      fs.writeFileSync(fichier, data, { encoding: 'base64' }, function (err) {
        console.log('File created');
      });

      // Affiche l'image New plus le chemin
      document.getElementById('name').style = "visibility: visible; font-size: 8px; color:#ffffff;"
      document.getElementById('nameSource').style = "visibility: visible;"

      // Valorise l'image New plus le chemin
      document.getElementById('name').innerHTML = path.basename(fichier)
      document.getElementById('nameSource').setAttribute("src", fichier);

      // Active le bouton Files
      document.getElementById('files').removeAttribute("disabled");

      // Test si nous avons fait déjà une capture
      if (oldFichier != "") {
        // Lance une comparaison des deux images (New et Old)
        await compareImages(fichier, oldFichier, dateTime)

        // Active l'image Old plus le chemin
        document.getElementById('nameOld').style = "visibility: visible; font-size: 8px; color:#ffffff;"
        document.getElementById('nameSourceOld').style = "visibility: visible;"

        // Affiche l'image Old plus le chemin
        document.getElementById('nameSourceOld').setAttribute("src", oldFichier);
        document.getElementById('nameOld').innerHTML = path.basename(oldFichier)
      }
      // Enregistre le nom de l'image courante dans oldFichier
      oldFichier = fichier
    } else {
      addtext("Reponse Http : " + response.status)
    }
  })();
}

// Permet d'ajouter du texte dans la textarea ==> Console
function addtext(newtext) {
  document.getElementById('console').value += newtext + '\n';
}


