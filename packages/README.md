# PORTAL TOPO — Documentación del Proyecto

Experiencia de **Realidad Aumentada** del nuevo Topo de Donostia, construida con **A-Frame** + **8th Wall**. Tras un flujo de pantallas introductorias, el usuario apunta la cámara al suelo, se coloca un portal que emerge del suelo y, al cruzarlo, accede a una vista 360° de la estación. Dentro puede consultar puntos de interés y cambiar entre vistas (Andén / Acceso).

El efecto de "ventana al otro mundo" se consigue con una **máscara de stencil**, no con geometría que tapa: la apertura del portal escribe `stencil = 1` y el contenido 360° se renderiza solo donde toca según el estado (fuera / dentro).

---

## 0. Levantar el proyecto (inicio rápido)

El desarrollo corre dentro de un contenedor Docker que ya trae el toolchain.

### Requisitos previos
- [Docker](https://docs.docker.com/get-docker/) instalado y corriendo
- Acceso al registro `ghcr.io/apache-digital-studio` (pide el token al equipo)

### Pasos
```bash
# 1. Login al registro de imágenes
echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin

# 2. Levantar el contenedor de desarrollo (abre una shell dentro con el repo montado en /app)
make frontend

# 3. Dentro del contenedor: instalar dependencias
yarn install

# 4. Dentro del contenedor: servidor de desarrollo (HTTPS, hot reload, puerto 8080)
yarn server
```

> El servidor es **HTTPS** porque 8th Wall (acceso a cámara / sensores de movimiento) lo requiere. Para probar en el móvil, accede desde la red local a `https://<IP-del-host>:8080` y acepta el certificado.

### Scripts disponibles (`package.json`)
| Comando | Qué hace |
|---|---|
| `yarn server` | Dev server con hot reload (HTTPS, puerto 8080) |
| `yarn build` | Build de producción → `dist/` |
| `yarn build:dev` | Build sin minimizar (debug) → `dist/` |

### Despliegue
Se despliega con **AWS Amplify** (ver [`amplify.yml`](amplify.yml)): instala con yarn, ejecuta `yarn run build`, publica `dist/` y notifica el deploy por Google Chat. El commit se inyecta como meta `x-build-commit` en `index.html`.

---

## 1. Tecnologías y librerías

### Motor 3D y AR (cargadas por CDN en `index.html`)
| Librería | Versión | Qué hace |
|---|---|---|
| **A-Frame** | 1.5.0 | Framework 3D declarativo sobre HTML (`<a-entity>`, `<a-sky>`, …). Base de toda la escena. |
| **8th Wall Engine** (`@8thwall/engine-binary`) | @1 | Motor de AR: world tracking (SLAM), detección de superficies, sincronía cámara real/virtual. Carga `data-preload-chunks="slam"`. |
| **8th Wall XR Extras** (`@8thwall/xrextras`) | @1 | Utilidades: pantalla de carga (`xrextras-loading`), errores (`xrextras-runtime-error`), oclusión (`xrextras-hider-material`), fondo opaco (`xrextras-opaque-background`), seguimiento de luz (`xrextras-attach`). |
| **aframe-extras** | 7.0.0 | Componentes extra de A-Frame (loaders, utilidades de animación). |
| **THREE.js** | (incluido en A-Frame) | Motor 3D de bajo nivel. Los componentes custom manipulan stencil, clipping planes, mixers y shaders directamente sobre su API. |

### Tipografías
- **Founders Grotesk** — local vía `@font-face` ([assets/fonts/stylesheet.css](assets/fonts/stylesheet.css)), pesos Regular y Bold (woff2/woff). Tipografía principal de la UI.
- **Contrail One** — Google Fonts.

### Herramientas de build (solo desarrollo)
| Herramienta | Para qué |
|---|---|
| **Webpack 5** | Empaqueta JS/CSS en `bundle.js` y copia `assets/` a `dist/`. |
| **Babel** (`@babel/preset-env`) | Transpila ES6+ para navegadores antiguos. |
| **webpack-dev-server** | Servidor local HTTPS con live reload. |

> **Nota de build (fuentes):** el `css-loader` está configurado con `url: false` ([config/webpack.config.js](config/webpack.config.js)) para que las `url()` del CSS queden como rutas literales en vez de pasar por el asset-loader (que emite JS y rompía el `@font-face`). Los archivos reales los sirve `CopyWebpackPlugin` desde `dist/assets/`.

---

## 2. Estructura de archivos

```
PORTAL TOPO/
│
├── index.html                  ← Escena A-Frame + overlays HTML (template de Webpack)
├── app.js                      ← Punto de entrada: importa y registra los componentes
├── index.css                   ← Todo el CSS (loading screen, intro flow, HUD, paneles)
├── package.json                ← Dependencias y scripts de build
├── Makefile / docker-compose.yml ← Entorno de desarrollo en Docker
├── amplify.yml                 ← Pipeline de deploy (AWS Amplify)
│
├── components/
│   ├── preloader.js            ← Carga de assets en 2º plano; emite 'preload-done'
│   ├── intro-flow.js           ← Flujo de pantallas pre-experiencia + escaneo del entorno
│   ├── responsive-immersive.js ← Gating por tipo de dispositivo (ejemplo 8th Wall)
│   ├── variant-selector.js     ← Tras 'environment-ok': refresca refs y dispara la colocación
│   ├── tap-to-place.js         ← Colocación, recentrado y animación de emergencia del portal
│   ├── portal-camera.js        ← Máquina de estados del portal (stencil INITIAL/INSIDE/OUTSIDE)
│   ├── elevator-doors.js       ← Puertas correderas del portal (animación + clipping + stencil)
│   ├── hotspot-station.js      ← Marcadores de interés (hotspot) + gestor de estaciones 360°
│   ├── portal-ground-effect.js ← Anillos de luz en el suelo (shader) durante la emergencia
│   ├── portal-bg.js            ← SVG de bandas diagonales compartido (intro + "Cambiar vista")
│   ├── debug-grid.js           ← Rejilla de depuración del suelo SLAM (botón GRID)
│   └── surface-quality.js      ← Mide jitter de pose y tiñe la rejilla (verde=estable/rojo)
│
├── config/
│   ├── webpack.config.js       ← Configuración de Webpack
│   └── asset-loader.js         ← Loader custom: exporta la ruta del asset como contenido
│
└── assets/
    ├── fonts/                  ← Founders Grotesk (otf/woff/woff2) + stylesheet.css
    ├── images/                 ← Logos, iconos, flechas, SVG decorativos del intro flow
    ├── models/
    │   ├── Portal_frame.glb        ← Marco/aro del portal (#portalRim)
    │   ├── Portal_Door_01.glb      ← Puerta izquierda
    │   └── Portal_Door_02.glb      ← Puerta derecha
    └── textures/
        ├── station-360.jpg     ← Panorámica 360° de la estación (vista "Andén")
        ├── exit-a-360.jpg      ← Panorámica 360° del acceso (vista "Acceso")
        ├── portal-glow.png     ← Halo aditivo alrededor de la apertura
        └── recenter.png        ← Icono del botón de recentrar
```

---

## 3. Componentes custom (JavaScript)

Todos se registran en [app.js](app.js) y se activan como atributos sobre `<a-scene>` o entidades del [index.html](index.html).

### 3.1 `preloader`
Carga assets (texturas + modelos GLB) en segundo plano mientras se muestran las pantallas del intro. Retira la pantalla de carga blanca (`#loading-screen`) en cuanto la **escena** está montada — no cuando termina el preload — para que el usuario pueda interactuar y conceder permisos cuanto antes. Emite **`preload-done`** al terminar (con red de seguridad por timeout). Hace además un *warm-up* de GPU (`renderer.compile`) para evitar tirones al primer render.

### 3.2 `intro-flow`
Construye y gobierna las pantallas previas a la experiencia (UI en `_buildUI()`, HTML inyectado en `document.body`):

```
splash (idioma EUSKERA/CASTELLANO) → info → [detail vía "SABER MÁS"] → instructions → scanning
```

La fase **scanning** muestra mensajes escalonados y un escaneo simulado del entorno; espera a que se cumplan **`SCAN_DURATION`** (8,2 s) **y** `preload-done` antes de habilitar "INICIAR EXPERIENCIA". Al pulsarlo emite **`environment-ok`** y se desvanece. Un HUD persistente (`#scanning-hud`: logo + trazado diagonal) sobrevive al cierre del overlay y aloja el botón "CAMBIAR VISTA".

### 3.3 `responsive-immersive`
Ejemplo de 8th Wall: inspecciona los `sessionAttributes` del motor para distinguir Desktop / VR / AR-HMD / móvil. En este proyecto los componentes de portal ya están declarados estáticamente en el HTML, por lo que su efecto práctico es residual (gating de plataforma).

### 3.4 `variant-selector`
Al recibir `environment-ok`: refresca las referencias del `portal-camera`, re-engancha el seguimiento de luz, y emite en cadena `variant-selected` → `portal-reset` → `place-portal` para arrancar la colocación del portal.

### 3.5 `tap-to-place-portal`
Gestiona la colocación y el recentrado:
- En **`place-portal`** (primera vez) y en cada clic del botón de recentrar: reproduce la **animación de emergencia** del portal (sube desde bajo el suelo con squash-and-stretch anclado a la base, clipping plane a la altura del suelo), dispara el efecto de luz del suelo y, al terminar, abre las puertas (`doors-open`).
- Se re-arma ante `portal-reset` para soportar recolocaciones.

### 3.6 `portal-camera`
**Máquina de estados** del portal sobre la cámara: `INITIAL → INSIDE ↔ OUTSIDE`.

| Estado | Significado |
|---|---|
| **INITIAL** | Portal enfrente; el 360° se ve a través de la ventana de stencil; animación de emergencia. |
| **INSIDE** | Has cruzado; el 360° llena la vista y la AR se ve a través del hueco de la puerta. |
| **OUTSIDE** | Has vuelto; AR en todo salvo la ventana del portal (que muestra el 360°). |

Toda la lógica de visibilidad se hace con **stencil** (la función `Equal`/`NotEqual` cambia según el estado), no encendiendo/apagando objetos, para evitar recompilaciones de shader y parpadeos. La detección de cruce dispara la entrada unos centímetros **antes** del plano del portal (histéresis) para que la transición sea invisible.

### 3.7 `elevator-doors`
Dos paneles GLB (`#door-left`, `#door-right`) que se deslizan como puertas de ascensor. API por eventos: `doors-open` / `doors-close` / `doors-toggle` (emite `doors-opened` / `doors-closed`). Aplica stencil a sus mallas y usa *clipping planes* en espacio mundo (escalados con el portal) para no asomar fuera del marco.

### 3.8 `hotspot` + `station-manager` (`hotspot-station.js`)
- **`hotspot`**: cada `<a-entity hotspot="title:…; description:…">` crea un marcador 3D pulsante con etiqueta que se expande in-place al tocarla (proximidad por ángulo de cámara + raycaster). Solo uno abierto a la vez.
- **`station-manager`**: gestiona las estaciones 360° dentro del portal. `goTo(stationId)` cambia la panorámica (sky + esfera de la ventana) con un *flash* blanco de transición y muestra/oculta los hotspots de cada estación. El botón "CAMBIAR VISTA" abre el panel de selección.

| Estación | Etiqueta | Panorámica |
|---|---|---|
| `station-entrance` | Andén | `station-360.jpg` |
| `station-exit-a` | Acceso | `exit-a-360.jpg` |

### 3.9 `portal-ground-effect`
Plano en el suelo con un *shader* que emite anillos de luz rectangulares que se expanden y desvanecen. `showSteady()` lo mantiene durante el escaneo; `playAt()` lo reproduce durante la emergencia del portal (encadenando sin corte si ya estaba visible).

### 3.10 Depuración: `debug-grid` + `surface-quality`
- **`debug-grid`**: dibuja una rejilla en `y=0` y wireframes de los volúmenes clave (hider walls, portal-wall, máscara de stencil, ventana). Se activa con el botón **GRID** del overlay.
- **`surface-quality`**: mide el *jitter* de la pose de la cámara (desviación estándar de deltas) y tiñe la rejilla de rojo→verde según la estabilidad de la superficie detectada.

> Ambos son herramientas de desarrollo; no afectan a la experiencia salvo por el botón GRID.

---

## 4. Anatomía de la escena 3D ([index.html](index.html))

### 4.1 Hider walls (oclusión exterior)
```
xrextras-opaque-background remove="true"
 └── #hider-walls
      ├── Suelo:     box 100×1×100   en y=-1
      ├── Fondo:     box 100×100×1   en z=75
      ├── Techo:     box 100×1×100   en y=100
      ├── Izquierda: box 1×100×100   en x=-30
      └── Derecha:   box 1×100×100   en x=30
```
Cajas con `xrextras-hider-material`: invisibles pero escriben en el depth buffer, ocultando el contenido del portal cuando estás fuera. Envueltas en `xrextras-opaque-background` para que solo existan en modo AR.

### 4.2 Portal contents (mundo interior)
```
#portal-contents
 ├── <a-sky src="#station-360-img">   — panorámica 360° de la estación
 └── 3 × <a-entity hotspot>           — puntos de interés (data-station="station-entrance")
```
Siempre visible: el **stencil** decide dónde se renderiza según el estado.

### 4.3 Portal root (el portal en sí)
```
#portal-root  (scale 1.4)
 ├── #portal-stencil-mask  — plano que escribe stencil=1 en la apertura (invisible)
 ├── #portal-window        — esfera 360° interior (legacy; oculta, el contenido se ve por stencil)
 ├── #portal-wall          — dos planos hider que bloquean la vista al volver
 ├── #portal-glow          — halo aditivo (portal-glow.png)
 ├── #elevator-doors       — puertas correderas (#door-left / #door-right, Portal_Door_0X.glb)
 └── #portalRim            — marco/aro del portal (Portal_frame.glb)
```

### 4.4 Iluminación
- **Directional light** con sombras (2048×2048), sigue al portal vía `xrextras-attach`.
- **Hemisphere light** (cielo `#CEE4F0` / suelo `#332211`, intensidad 0.8) como relleno.

---

## 5. Flujo de la experiencia

```
1. Carga
   └── #loading-screen visible → preloader retira la pantalla al montar la escena
       (los assets siguen cargando en 2º plano → 'preload-done')

2. Intro flow (HTML overlay)
   splash (idioma) → info → [detail] → instructions → scanning
   └── espera SCAN_DURATION + preload-done → botón "INICIAR EXPERIENCIA"
       └── emite 'environment-ok'

3. variant-selector
   └── refresca refs → 'portal-reset' → 'place-portal'

4. tap-to-place-portal
   └── animación de emergencia del portal (rise + ground-effect) → abre puertas

5. portal-camera (máquina de estados por stencil)
   ├── INITIAL: 360° por la ventana del portal
   ├── cruzas el umbral → INSIDE: 360° llena la vista
   └── vuelves → OUTSIDE: AR + ventana al 360°

6. Dentro de la experiencia
   ├── Hotspots: tocar para expandir info
   └── "CAMBIAR VISTA" → station-manager.goTo() → cambia Andén ↔ Acceso (flash blanco)
```

---

## 6. Compatibilidad por dispositivo

| Plataforma | Soporte | Experiencia |
|---|---|---|
| **iOS Safari** | ✅ Completo | AR con cámara. World tracking vía 8th Wall SLAM. |
| **Android Chrome** | ✅ Completo | AR con cámara. World tracking vía 8th Wall SLAM. |
| **Desktop / sin AR** | ⚠️ Fallback | `xrweb="allowedDevices: any"` deja entrar a todos; sin tracking la experiencia es limitada. |
| **Navegadores sin WebGL** | ❌ No soportado | `xrextras-runtime-error` muestra el mensaje de error. |

`xrextras-opaque-background remove="true"` elimina los hider walls en plataformas sin feed de cámara para que la escena siga siendo visible.
