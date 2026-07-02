// Asset preloader — runs silently in the background while the intro screens are shown.
// Emits 'preload-done' on the scene when all assets are loaded and shaders are compiled.
//
// IMPORTANTE (fix arranque 1ª carga): la pantalla de carga blanca (#loading-screen) se
// retira en cuanto la ESCENA está montada — NO cuando termina el preload ni cuando llega
// 'realityready'. Antes estaba acoplada a 'realityready'; en la primera visita ese evento
// puede no llegar hasta que el usuario concede permisos (cámara y, en iOS, movimiento), y
// como el overlay tapaba el splash, no había forma de dar ese gesto → pantalla blanca
// infinita (y al recargar, con el permiso ya concedido, funcionaba). Ahora el splash queda
// visible e interactivo enseguida, y todo arranque tiene además red de seguridad por timeout.

const PRELOAD_START_FALLBACK_MS = 10000  // arranca el preload aunque 'realityready' no llegue
const HIDE_SCREEN_FALLBACK_MS = 5000     // nunca dejar la pantalla blanca bloqueada
const WARMUP_GPU_TIMEOUT_MS = 5000       // el warm-up de GPU no debe colgar 'preload-done'

const preloaderComponent = {
  init() {
    this._done = false
    this._started = false
    const scene = this.el.sceneEl

    // 1) Retirar la pantalla de carga en cuanto la escena (y el splash HTML que vive bajo
    //    ella, también blanco → sin flash) están listos, para que el usuario pueda
    //    interactuar y conceder permisos. El preload sigue en 2º plano.
    if (scene.hasLoaded) this._hideLoadingScreen()
    else scene.addEventListener('loaded', () => this._hideLoadingScreen(), {once: true})
    setTimeout(() => this._hideLoadingScreen(), HIDE_SCREEN_FALLBACK_MS)  // red de seguridad

    // 2) Arrancar el preload de assets con el motor AR listo, o por timeout de seguridad si
    //    'realityready' nunca llega. _startPreload es idempotente (_started).
    scene.addEventListener('realityready', () => this._startPreload(), {once: true})
    setTimeout(() => this._startPreload(), PRELOAD_START_FALLBACK_MS)
  },

  _hideLoadingScreen() {
    const loadScreen = document.getElementById('loading-screen')
    if (!loadScreen || loadScreen.classList.contains('fade-out')) return
    loadScreen.classList.add('fade-out')
    setTimeout(() => loadScreen.remove(), 650)
  },

  async _startPreload() {
    if (this._started) return
    this._started = true
    const scene = this.el.sceneEl

    await this._waitForAAssets(scene)
    await Promise.all([
      this._ensureAssetLoaded('station-360-img'),
      this._ensureAssetLoaded('exit-a-360-img'),
      this._ensureAssetLoaded('portal-glow-img'),
      this._ensureAssetLoaded('portal-frame-model'),
      this._ensureAssetLoaded('portal-door-01-model'),
      this._ensureAssetLoaded('portal-door-02-model'),
    ])
    await this._warmUpGPU(scene)
    await this._delay(300)

    if (!this._done) {
      this._done = true
      scene.emit('preload-done')
      // Por si la pantalla aún sigue (escena que tardó más que su fallback): asegúrala fuera.
      this._hideLoadingScreen()
    }
  },

  _waitForAAssets(scene) {
    return new Promise((resolve) => {
      const assets = scene.querySelector('a-assets')
      if (!assets || assets.hasLoaded) { resolve(); return }
      assets.addEventListener('loaded', resolve, {once: true})
      setTimeout(resolve, 15000)
    })
  },

  _ensureAssetLoaded(id) {
    return new Promise((resolve) => {
      const el = document.getElementById(id)
      if (!el) { resolve(); return }
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth > 0) { resolve(); return }
        el.addEventListener('load', resolve, {once: true})
        el.addEventListener('error', resolve, {once: true})
        setTimeout(resolve, 8000)
        return
      }
      if (el.hasLoaded) { resolve(); return }
      el.addEventListener('loaded', resolve, {once: true})
      setTimeout(resolve, 8000)
    })
  },

  _warmUpGPU(scene) {
    return new Promise((resolve) => {
      // Red de seguridad: si el render loop no avanza (p. ej. AR aún sin arrancar), no
      // bloquear 'preload-done'.
      setTimeout(resolve, WARMUP_GPU_TIMEOUT_MS)

      requestAnimationFrame(() => {
        const renderer = scene.renderer
        if (!renderer) { resolve(); return }

        const threeScene = scene.object3D
        const camera = scene.camera
        if (renderer.compile && threeScene && camera) {
          renderer.compile(threeScene, camera)
        }

        const contents = document.getElementById('portal-contents')
        if (contents) {
          const wasVisible = contents.object3D.visible
          contents.object3D.visible = true
          requestAnimationFrame(() => {
            contents.object3D.visible = wasVisible
            requestAnimationFrame(() => resolve())
          })
        } else {
          resolve()
        }
      })
    })
  },

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms))
  },
}

export {preloaderComponent}
