# Sistema bilingüe (ES / EU) — Portal AR TOPO

Documentación técnica resumida del sistema de cambio de idioma castellano/euskera.
Describe lo implementado hasta la fecha y deja constancia de lo pendiente.

> Arquitectura objetivo (definida por el cliente): una sola app y un solo repo que
> se sirve en dos subdominios — `es.<dominio>` y `eusk.<dominio>` — donde el usuario
> nunca ve la carpeta de idioma en la URL. Ver `arquitectura-web-bilingue.html`.

---

## 1. Modelo mental

**No existen dos apps ni dos copias del código.** Existe **un único código** que se
compila **dos veces**; en cada compilación se "hornea" dentro un idioma distinto. El
resultado son dos carpetas autocontenidas (`dist/es/` y `dist/eusk/`), idénticas en
todo salvo en el texto.

Consecuencia práctica: un arreglo de lógica o de UI se aplica a ambos idiomas a la
vez. Solo los **textos** viven por separado.

---

## 2. Piezas del sistema

| Archivo | Rol |
|---|---|
| `shared/i18n/lang.es.js` | Diccionario de textos en **castellano** (solo datos). |
| `shared/i18n/lang.eu.js` | Diccionario de textos en **euskera**, espejo del anterior. |
| `shared/i18n/index.js` | Selector: lee la marca `__LANG__` y entrega el diccionario activo (`T`). |
| `config/webpack.config.js` | Compila una vez por idioma e inyecta `__LANG__`. |
| `app.js` | Consume `T.meta` (título de pestaña, atributo `lang` del HTML). |
| `components/intro-flow.js` | Consume `T.*` en todas las pantallas de intro + botones de idioma. |
| `components/hotspot-station.js` | Consume `T.hotspots[key]`, `T.zone` y el panel "cambiar vista". |
| `index.html` | Plantilla única; los hotspots referencian textos por índice (`key`), no por texto literal. |

---

## 3. Cómo se construye el duplicado en euskera

### 3.1 Diccionarios espejo

`lang.es.js` y `lang.eu.js` exportan un objeto con **las mismas claves** y el mismo
número de elementos; solo cambia el valor. Regla de mantenimiento: toda clave nueva
debe añadirse en **ambos** archivos.

```js
// lang.es.js                         // lang.eu.js
splash: { claim: 'El nuevo Topo...' } splash: { claim: 'Topo berria...' }
```

Los párrafos de cuerpo conservan su `<strong>` porque la intro los pinta con
`innerHTML`.

### 3.2 Selector de idioma

`shared/i18n/index.js` decide qué diccionario sirve, leyendo la marca global
`__LANG__`. Si no existe (dev server, build único), cae a `'es'`.

```js
const requested = (typeof __LANG__ !== 'undefined') ? __LANG__ : 'es'
const LANG = DICTS[requested] ? requested : 'es'
const T = DICTS[LANG]        // diccionario del idioma activo
export {LANG}
export default T
```

El resto de la app importa `T` y pide textos (`T.info.headline`, `T.hotspots[0].title`),
sin conocer el idioma.

### 3.3 La doble compilación

`config/webpack.config.js` define los idiomas y compila uno por cada uno:

```js
const LOCALES = [
  {lang: 'es', folder: 'es'},
  {lang: 'eu', folder: 'eusk'},
]
```

En cada pasada graba la marca con `DefinePlugin` y manda la salida a su carpeta:

```js
new webpack.DefinePlugin({ __LANG__: JSON.stringify(lang) })  // 'es' | 'eu'
// → dist/es/  y  dist/eusk/
```

Cada carpeta es **autocontenida** (Opción A): copia sus propios assets y usa
`publicPath` relativo (`./`), para que el rewrite de subdominio resuelva sin tocar
rutas.

> **Modo desarrollo (`yarn server`):** webpack-dev-server genera **un único build en
> `'es'`** en la raíz de `dist` (sin hot-reload de euskera). Para ver euskera en local
> hoy hay que hacer `yarn build` y servir `dist/eusk/`.

### 3.4 Consumo de textos

- `app.js` → `document.title = T.meta.title`, `document.documentElement.lang = T.meta.lang`.
- `components/intro-flow.js` → claim, info, detalle, instrucciones y escaneo.
- `components/hotspot-station.js` → `T.hotspots[this.data.key]`, `STATION_LABELS = T.zone`,
  y el panel "cambiar vista".
- `index.html` → los hotspots llevan `key: N` (índice), no texto. El texto se resuelve
  en runtime desde `T.hotspots[N]`, por lo que el `index.html` es idéntico en ambos idiomas.

### 3.5 Cambio de idioma desde la UI

Los botones EUSKERA / CASTELLANO (`intro-flow.js`) parten de que cada idioma vive en
su subdominio. Pulsar "el otro" idioma = navegar al subdominio correspondiente,
reescribiendo solo el prefijo del host (`es.` ↔ `eusk.`):

```js
_otherLangUrl(targetLang) {
  const targetSub = targetLang === 'eu' ? 'eusk' : 'es'
  const m = location.hostname.match(/^(?:es|eusk)\.(.+)$/)
  if (!m) return null   // localhost → sin subdominio reconocible
  ...
}
```

Es agnóstico del dominio: no hay ningún dominio escrito a mano. En `localhost`
devuelve `null` (no hay subdominio que reescribir).

---

## 4. Flujo completo

```
lang.es.js / lang.eu.js   →  textos espejo (solo datos)
        │
webpack.config.js         →  compila 2 veces, graba __LANG__ = 'es' / 'eu'
        │
shared/i18n/index.js      →  lee __LANG__ y elige el diccionario → T
        │
app.js / intro-flow.js /  →  pintan la pantalla usando T.*
hotspot-station.js
        │
dist/es/  +  dist/eusk/   →  dos carpetas autocontenidas, cada una con su idioma
```

---

## 5. Estado y pendientes

### Implementado
- [x] Diccionarios espejo ES/EU (`shared/i18n/`).
- [x] Selector por `__LANG__` con fallback a `es`.
- [x] Doble compilación webpack → `dist/es/` y `dist/eusk/`.
- [x] Consumo de textos en `app.js`, `intro-flow.js`, `hotspot-station.js`.
- [x] Botones de idioma = salto de subdominio (agnóstico del dominio).

### Pendiente

1. **Reglas de rewrite subdominio → carpeta** *(código, en `amplify.yml`)*
   `es.<dominio>` debe servir `/es/` y `eusk.<dominio>` debe servir `/eusk/` con
   **rewrite tipo 200** (URL limpia). El `amplify.yml` actual aún **no** incluye esta
   sección. Requiere conocer el dominio real.

2. **Dominio definitivo** *(decisión del cliente)*
   Bloquea al punto 1; las reglas de rewrite necesitan el dominio exacto.

3. **Configuración en consola AWS Amplify** *(infraestructura)*
   Alta de subdominios `es.` y `eusk.` apuntando a la misma branch, registros DNS
   (CNAME) y certificados SSL.

4. **Validación profesional del euskera** *(contenido)*
   `lang.eu.js` / `traducciones-euskera.md` son **placeholder**. Pendiente revisión
   por traductor. Decisiones abiertas: nombres de botones (`EUSKERA` vs `EUSKARA`) y
   `San Sebastián` vs `Donostia`.

5. **(Opcional) Atajo de idioma para desarrollo**
   Un `?lang=eu` en modo dev permitiría probar euskera con hot-reload sin `yarn build`.
   Aislado al dev-server, sin impacto en producción.
