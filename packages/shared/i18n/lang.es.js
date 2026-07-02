// Textos de la experiencia — CASTELLANO.
// Estructura espejo de lang.eu.js: si añades una clave aquí, añádela allí también.
// Los párrafos de cuerpo conservan su <strong> porque se pintan con innerHTML.

export default {
  meta: {
    title: 'TOPO portal',
    lang: 'es',
  },

  // 1. Pantalla de idioma (splash)
  splash: {
    claim: 'El nuevo Topo, más cerca',
    btnEuskera: 'EUSKERA',
    btnCastellano: 'CASTELLANO',
  },

  // 2. Introducción (info)
  info: {
    headline: 'El futuro del transporte ya está aquí',
    body: [
      '<strong>Cada vez queda menos para la puesta en marcha del nuevo Topo de Donostia.</strong> Las obras siguen avanzando y el cambio ya es una realidad visible.',
      '<strong>Descúbrelo recorriendo sus distintos puntos</strong> y observa cómo toma forma <strong>una nueva manera de moverse</strong> por la ciudad y por Gipuzkoa.',
    ],
    saberMas: 'SABER MÁS',
    comenzar: 'COMENZAR',
  },

  // 3. Detalle (se abre desde "SABER MÁS")
  detail: {
    headline: 'Un avance de todo lo que está por venir',
    body: [
      'Vas a recorrer la estación del Centro-La Concha por la que, junto a las de Benta Berri y Amara, pronto pasará el tren.',
      'Para estudiar, para trabajar, para ir a un concierto o quedar con la cuadrilla, <strong>el nuevo Topo cambiará nuestra forma de movernos por San Sebastián y Gipuzkoa.</strong>',
      '<strong>Con más frecuencias y más destinos a nuestro alcance.</strong> Y además, libera espacios en superficie para la ciudadanía.',
      '<strong>El nuevo Topo ya está llamando a tu puerta.</strong>',
    ],
    topoLink: 'INFÓRMATE EN TOPO.EUS',
    volverHome: 'VOLVER A LA HOME',
  },

  // 4. Indicaciones importantes (instructions)
  instructions: {
    title: 'Indicaciones importantes',
    desc: 'Para garantizar el correcto funcionamiento de la experiencia, es necesario verificar el espacio antes de comenzar.',
    rows: [
      {label: 'Espacio despejado: ', text: 'El suelo debe estar libre de objetos u obstáculos.'},
      {label: 'Buena iluminación: ', text: 'Asegúrate de que tu espacio tenga suficiente luz.'},
      {label: 'Superficie estable: ', text: 'Mantén el dispositivo estable mientras el sistema detecta la superficie del suelo.'},
    ],
    btnEscanear: 'INICIAR ESCANEO',
  },

  // 5. Escaneo (scanning)
  scanning: {
    boxText: 'ESCANEANDO ENTORNO',
    messages: ['ILUMINACIÓN ADECUADA', 'ESPACIO DESPEJADO', 'SUPERFICIE ESTABLE'],
    ready: 'ENTORNO ADECUADO',
    btnIniciar: 'INICIAR EXPERIENCIA',
  },

  // 6. HUD persistente + panel "Cambiar vista"
  hud: {
    cambiarVista: 'CAMBIAR VISTA',
  },
  changeView: {
    cerrar: 'CERRAR',
    title: 'Cambiar vista',
    desc: 'Cambia entre las distintas vistas de la experiencia para explorar el proyecto desde otra perspectiva.',
    btnVestibulo: 'VESTÍBULO',
    btnAcceso: 'ACCESO',
  },

  // 7. Puntos de interés (hotspots) — orden = orden en index.html
  hotspots: [
    {title: 'MAYOR FRECUENCIA', desc: 'Topo cada 7,5 minutos sin transbordos.'},
    {title: 'SOTERRADO', desc: 'Tres estaciones bajo tierra. 4,2 km recorridos en 6 minutos.'},
    {title: 'MÁS ESPACIO', desc: 'Más espacio libre para la ciudadanía (21.000 m² de superficie liberados). Más tren, menos atascos.'},
  ],

  // 8. Etiquetas de zona — clave = id de estación (STATION_LABELS)
  zone: {
    'station-entrance': 'Andén',
    'station-exit-a': 'Acceso',
  },
}
