// Textos de la experiencia — EUSKERA.
// ⚠️ TRADUCCIÓN PROVISIONAL (placeholder). Debe validarla un traductor de euskera
//    antes de publicar. Ver traducciones-euskera.md para el detalle y las
//    decisiones pendientes (marcadas con 🔶).
// Estructura espejo de lang.es.js: mismas claves, mismo número de elementos.

export default {
  meta: {
    title: 'TOPO ataria',
    lang: 'eu',
  },

  // 1. Pantalla de idioma (splash)
  splash: {
    claim: 'Topo berria, gertuago',
    btnEuskera: 'EUSKERA',
    btnCastellano: 'CASTELLANO',
  },

  // 2. Introducción (info)
  info: {
    headline: 'Garraioaren etorkizuna hemen da jada',
    body: [
      '<strong>Gero eta gutxiago falta da Donostiako Topo berria abian jartzeko.</strong> Obrak aurrera doaz eta aldaketa errealitate ikusgai bat da jada.',
      '<strong>Ezagutu ezazu bere puntu desberdinak ibiliz</strong> eta ikusi nola hartzen duen forma <strong>mugitzeko modu berri batek</strong> hirian eta Gipuzkoan zehar.',
    ],
    saberMas: 'GEHIAGO JAKIN',
    comenzar: 'HASI',
  },

  // 3. Detalle (se abre desde "SABER MÁS")
  detail: {
    headline: 'Datorren guztiaren aurrerapena',
    body: [
      'Centro-La Concha geltokia ibiliko duzu; bertatik, Benta Berri eta Amarakoetatik bezala, laster pasako da trena.',
      'Ikasteko, lan egiteko, kontzertu batera joateko edo koadrilarekin geratzeko, <strong>Topo berriak Donostian eta Gipuzkoan mugitzeko dugun modua aldatuko du.</strong>',
      '<strong>Maiztasun gehiagorekin eta esku-eskura helmuga gehiagorekin.</strong> Eta gainera, azaleran espazioak askatzen ditu herritarrentzat.',
      '<strong>Topo berria zure atea jotzen ari da jada.</strong>',
    ],
    topoLink: 'INFORMATU ZAITEZ TOPO.EUS-EN',
    volverHome: 'HASIERARA ITZULI',
  },

  // 4. Indicaciones importantes (instructions)
  instructions: {
    title: 'Jarraibide garrantzitsuak',
    desc: 'Esperientziak behar bezala funtziona dezan, beharrezkoa da espazioa egiaztatzea hasi aurretik.',
    rows: [
      {label: 'Espazio garbia: ', text: 'Lurrak objektu edo oztoporik gabe egon behar du.'},
      {label: 'Argiztapen ona: ', text: 'Ziurtatu zure espazioak nahikoa argi duela.'},
      {label: 'Gainazal egonkorra: ', text: 'Mantendu gailua egonkor, sistemak lurraren gainazala detektatzen duen bitartean.'},
    ],
    btnEscanear: 'ESKANEATZEN HASI',
  },

  // 5. Escaneo (scanning)
  scanning: {
    boxText: 'INGURUNEA ESKANEATZEN',
    messages: ['ARGIZTAPEN EGOKIA', 'ESPAZIO GARBIA', 'GAINAZAL EGONKORRA'],
    ready: 'INGURUNE EGOKIA',
    btnIniciar: 'ESPERIENTZIA HASI',
  },

  // 6. HUD persistente + panel "Cambiar vista"
  hud: {
    cambiarVista: 'IKUSPEGIA ALDATU',
  },
  changeView: {
    cerrar: 'ITXI',
    title: 'Ikuspegia aldatu',
    desc: 'Aldatu esperientziaren ikuspegi desberdinen artean, proiektua beste ikuspegi batetik esploratzeko.',
    btnVestibulo: 'ATARIA',
    btnAcceso: 'SARBIDEA',
  },

  // 7. Puntos de interés (hotspots) — orden = orden en index.html
  hotspots: [
    {title: 'MAIZTASUN HANDIAGOA', desc: 'Topoa 7,5 minututik behin, transbordorik gabe.'},
    {title: 'LURPERATUA', desc: 'Hiru geltoki lur azpian. 4,2 km egiten dira 6 minututan.'},
    {title: 'ESPAZIO GEHIAGO', desc: 'Espazio libre gehiago herritarrentzat (21.000 m² azalera askatuak). Tren gehiago, auto-ilara gutxiago.'},
  ],

  // 8. Etiquetas de zona — clave = id de estación (STATION_LABELS)
  zone: {
    'station-entrance': 'Nasa',
    'station-exit-a': 'Sarbidea',
  },
}
