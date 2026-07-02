// Punto de entrada de i18n.
//
// El idioma activo lo decide la variable de build __LANG__, que webpack reemplaza
// por un literal ('es' | 'eu') en cada build (ver Fase 3 / DefinePlugin). Antes de
// ese cableado —dev server o build único— __LANG__ no existe y se usa 'es'.
//
// Uso:
//   import T from '../shared/i18n'        // diccionario del idioma activo
//   import {LANG} from '../shared/i18n'   // 'es' | 'eu'
//   T.splash.claim, T.hotspots[0].title, ...

import es from './lang.es'
import eu from './lang.eu'

const DICTS = {es, eu}

// typeof evita un ReferenceError cuando __LANG__ aún no está definido por webpack.
const requested = (typeof __LANG__ !== 'undefined') ? __LANG__ : 'es'
const LANG = DICTS[requested] ? requested : 'es'

const T = DICTS[LANG]

export {LANG}
export default T
