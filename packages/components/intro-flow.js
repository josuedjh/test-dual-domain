// Intro flow + environment scan.
// Phases: splash → info → detail → instructions → scanning → environment-ok
// The preloader runs silently in the background; scanning waits for both
// SCAN_DURATION and 'preload-done' before enabling the start button.

import {PORTAL_BG_SVG} from './portal-bg'
import T, {LANG} from '../shared/i18n'

const SCAN_DURATION = 8200
// El texto de la banda va cambiando de forma escalonada para generar anticipación.
// El último mensaje cae ~1.5s antes de SCAN_DURATION para dejar un beat antes del mensaje "entorno adecuado".
// Los tiempos son de diseño; el texto sale del diccionario (T.scanning.messages).
const SCAN_MESSAGE_TIMES = [2400, 4600, 6700]
const SCAN_MESSAGES = SCAN_MESSAGE_TIMES.map((time, i) => ({time, text: T.scanning.messages[i]}))
const BRIGHTNESS_LOW = 45
const BRIGHTNESS_HIGH = 245
const MIN_POSE_SAMPLES = 5
const MAX_JITTER = 0.6

const introFlowComponent = {
  init() {
    this._phase = 'language'
    this._preloadDone = false
    this._scanDone = false
    this._scanning = false
    this._scanStart = 0
    this._brightnessSamples = []
    this._poseSamples = []
    this._lastPos = null
    this._deltas = []
    this._cameraVideo = null
    this._canvas = null
    this._ctx = null

    this._buildUI()
    this._setupCanvas()
    this._updateSplashScale()
    this._onResize = () => this._updateSplashScale()
    window.addEventListener('resize', this._onResize)

    this.el.sceneEl.addEventListener('preload-done', () => {
      this._preloadDone = true
      this._checkReadyToStart()
    })

    this._showPhase('splash')
  },

  _updateSplashScale() {
    const s = Math.min(window.innerWidth / 375, window.innerHeight / 812)
    document.documentElement.style.setProperty('--splash-scale', s)
  },

  _buildUI() {
    const overlay = document.createElement('div')
    overlay.id = 'intro-overlay'

    overlay.innerHTML = `
      <div id="intro-backdrop"></div>

      <!-- Phase: splash — gráfico inicial + selección de idioma -->
      <div id="intro-splash" class="intro-screen">

        <div class="splash-frame">
          <img class="splash-logo" src="/assets/images/TOPO-logotipo-negro.svg" alt="TOPO">
          <img class="splash-background" src="/assets/images/background.svg" alt="">
          <div class="splash-claim-text">
            <p class="splash-claim-bold">${T.splash.claim}</p>
            <p class="splash-claim-regular">${T.splash.claim}</p>
          </div>
          <button class="splash-btn splash-btn-blue" id="btn-euskera">
            <span>${T.splash.btnEuskera}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
          <button class="splash-btn splash-btn-teal" id="btn-castellano">
            <span>${T.splash.btnCastellano}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
          <div class="splash-footer">
            <img class="splash-footer-logo splash-footer-euskotren" src="/assets/images/logo-euskotren.svg" alt="Euskotren">
            <img class="splash-footer-logo splash-footer-trenbide" src="/assets/images/logo-euskal-trenbide.svg" alt="Euskal Trenbide Sarea">
            <img class="splash-footer-logo splash-footer-gobierno" src="/assets/images/logo-gobierno-vasco.svg" alt="Gobierno Vasco">
          </div>
        </div>
      </div>

      <!-- Phase: project info -->
      <div id="intro-info" class="intro-screen">
        <div class="splash-frame">
          <img class="info-logo" src="/assets/images/TOPO-simbolo-logotipo.svg" alt="TOPO">
          <div class="info-content">
            <h1 class="info-headline">${T.info.headline}</h1>
            <div class="info-body">
              <p>${T.info.body[0]}</p>
              <p>${T.info.body[1]}</p>
            </div>
            <a href="#" class="info-link" id="info-project-link">
              <span>${T.info.saberMas}</span>
              <svg viewBox="0 0 8 10" width="8" height="10" fill="none" aria-hidden="true">
                <polyline points="2,1 7,5 2,9" stroke="#1e1e1e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
          <button class="info-btn-comenzar" id="btn-continuar">
            <span>${T.info.comenzar}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
        </div>
      </div>

      <!-- Phase: detail info (abre desde SABER MÁS) -->
      <div id="intro-detail" class="intro-screen">
        <div class="splash-frame">
          <img class="info-logo" src="/assets/images/TOPO-simbolo-logotipo.svg" alt="TOPO">
          <div class="info-content">
            <h1 class="info-headline">${T.detail.headline}</h1>
            <div class="info-body">
              <p>${T.detail.body[0]}</p>
              <p>${T.detail.body[1]}</p>
              <p>${T.detail.body[2]}</p>
              <p>${T.detail.body[3]}</p>
            </div>
            <a href="https://topo.eus" class="info-link" id="info-topo-link" target="_blank" rel="noopener">
              <span>${T.detail.topoLink}</span>
              <img src="/assets/images/chevron.svg" alt="" width="8" height="12" aria-hidden="true">
            </a>
          </div>
          <button class="info-btn-comenzar" id="btn-home">
            <span>${T.detail.volverHome}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
        </div>
      </div>

      <!-- Phase: environment instructions -->
      <div id="intro-instructions" class="intro-screen">

        <!-- Fondo: staircase sobre la cámara AR — inline SVG + blur del wrapper -->
        <div class="instr-bg">
          ${PORTAL_BG_SVG}
        </div>

        <!-- Contenido escalado al frame 375×812 — sin recuadro blanco -->
        <div class="splash-frame">
          <img class="info-logo" src="/assets/images/TOPO-simbolo-logotipo.svg" alt="TOPO">
          <div class="instr-content">
            <h2 class="instr-title">${T.instructions.title}</h2>
            <p class="instr-desc">${T.instructions.desc}</p>
            <div class="instr-list">
              <div class="instr-row instr-row-1">
                <img class="instr-icon-img" src="/assets/images/icono-espacio-despejado.svg" alt="" width="40" height="40">
                <p class="instr-row-text"><span class="instr-label">${T.instructions.rows[0].label}</span>${T.instructions.rows[0].text}</p>
              </div>
              <div class="instr-row instr-row-2">
                <img class="instr-icon-img" src="/assets/images/icono-buena-iluminacion.svg" alt="" width="40" height="40">
                <p class="instr-row-text"><span class="instr-label">${T.instructions.rows[1].label}</span>${T.instructions.rows[1].text}</p>
              </div>
              <div class="instr-row instr-row-3">
                <img class="instr-icon-img" src="/assets/images/icono-superficie-estable.svg" alt="" width="40" height="40">
                <p class="instr-row-text"><span class="instr-label">${T.instructions.rows[2].label}</span>${T.instructions.rows[2].text}</p>
              </div>
            </div>
          </div>
          <button class="instr-btn-escanear" id="btn-escanear">
            <span>${T.instructions.btnEscanear}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
        </div>
      </div>

      <!-- Phase: scanning — solo scan-box y botón; logo y trazado viven en #scanning-hud -->
      <div id="intro-scanning" class="intro-screen">
        <div class="splash-frame">
          <div id="scan-box" class="scan-box">
            <img id="scan-icon" class="scan-icon scan-icon-spin" src="/assets/images/loader.svg" alt="" width="20" height="20">
            <span id="scan-box-text">${T.scanning.boxText}</span>
          </div>
          <button class="scan-btn-start" id="btn-iniciar">
            <span>${T.scanning.btnIniciar}</span>
            <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
          </button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    this._overlay = overlay

    // ── HUD persistente: logo + trazado — sobrevive a _finish() ─────────
    const hud = document.createElement('div')
    hud.id = 'scanning-hud'
    hud.innerHTML = `
      <div class="logo-container-clip">
        ${PORTAL_BG_SVG}
      </div>
      <div class="splash-frame">
        <img class="info-logo" src="/assets/images/TOPO-simbolo-logotipo.svg" alt="TOPO">
      </div>
      <div class="scan-trazado" aria-hidden="true"></div>
      <div class="splash-frame">
        <button id="btn-cambiar-vista" class="scan-btn-start">
          <span>${T.hud.cambiarVista}</span>
          <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
        </button>
      </div>
    `
    document.body.appendChild(hud)
    this._scanningHud = hud

    document.getElementById('btn-euskera').addEventListener('click', () => this._selectLanguage('eu'))
    document.getElementById('btn-castellano').addEventListener('click', () => this._selectLanguage('es'))
    document.getElementById('btn-continuar').addEventListener('click', () => this._showPhase('instructions'))
    document.getElementById('btn-escanear').addEventListener('click', () => this._startScan())
    document.getElementById('info-project-link').addEventListener('click', e => { e.preventDefault(); this._showPhase('detail') })
    document.getElementById('btn-home').addEventListener('click', () => this._showPhase('info'))

  },

  // Selección de idioma. Cada idioma vive en su subdominio (es. / eusk.), por lo que
  // elegir "el otro" idioma es navegar al subdominio correspondiente. El idioma del
  // build actual (LANG) ya está servido aquí, así que ese botón solo continúa.
  _selectLanguage(targetLang) {
    if (targetLang === LANG) {
      this._showPhase('info')
      return
    }
    const url = this._otherLangUrl(targetLang)
    if (url) {
      window.location.href = url
    } else {
      // Sin subdominio reconocible (dev/localhost): no hay a dónde ir, seguimos.
      this._showPhase('info')
    }
  },

  // Reescribe solo el prefijo de subdominio del host actual (es. ↔ eusk.), por lo que
  // funciona en cualquier dominio sin hardcodearlo. Devuelve null si el host no tiene
  // un subdominio de idioma reconocible.
  _otherLangUrl(targetLang) {
    const targetSub = targetLang === 'eu' ? 'eusk' : 'es'
    const m = location.hostname.match(/^(?:es|eusk)\.(.+)$/)
    if (!m) return null
    const port = location.port ? `:${location.port}` : ''
    return `${location.protocol}//${targetSub}.${m[1]}${port}${location.pathname}${location.search}`
  },

  _setupCanvas() {
    this._canvas = document.createElement('canvas')
    this._canvas.width = 64
    this._canvas.height = 64
    this._canvas.style.display = 'none'
    document.body.appendChild(this._canvas)
    this._ctx = this._canvas.getContext('2d', {willReadFrequently: true})
  },

  _showPhase(phase) {
    const current = this._overlay.querySelector('.intro-screen.active')
    if (current) current.classList.remove('active')
    document.getElementById('intro-' + phase).classList.add('active')
    this._overlay.className = 'phase-' + phase
    this._phase = phase
  },

  /* ── Scan ────────────────────────────────────────────────────────────── */

  _startScan() {
    this._scanning = true
    this._scanDone = false
    this._scanStart = Date.now()
    this._brightnessSamples = []
    this._poseSamples = []
    this._lastPos = null
    this._deltas = []
    this._cameraVideo = null

    this._showGrid()
    this._showPhase('scanning')
    this._scanningHud.classList.add('visible')
    this._runMessageSequence()
  },

  // El mensaje de la banda va cambiando de forma escalonada; el loader sigue girando.
  _runMessageSequence() {
    if (this._msgTimers) this._msgTimers.forEach(clearTimeout)
    this._msgTimers = []

    const textEl = document.getElementById('scan-box-text')
    if (textEl) textEl.textContent = T.scanning.boxText

    SCAN_MESSAGES.forEach(({time, text}) => {
      this._msgTimers.push(setTimeout(() => {
        if (!textEl) return
        textEl.classList.remove('scan-text-swap')
        void textEl.offsetWidth // reinicia la animación de fade
        textEl.textContent = text
        textEl.classList.add('scan-text-swap')
      }, time))
    })
  },

  tick() {
    if (!this._scanning) return

    const elapsed = Date.now() - this._scanStart

    const brightness = this._sampleBrightness()
    if (brightness >= 0) this._brightnessSamples.push(brightness)

    const cam = this.el.sceneEl.camera
    if (cam) {
      const pos = cam.getWorldPosition(new THREE.Vector3())
      if (this._lastPos) {
        const delta = pos.distanceTo(this._lastPos)
        if (delta > 0.001) {
          this._poseSamples.push(delta)
          this._deltas.push(delta)
        }
      }
      this._lastPos = pos.clone()
    }

    if (this._deltas.length >= 3) {
      const recent = this._deltas.slice(-10)
      const avgDelta = recent.reduce((a, b) => a + b, 0) / recent.length
      this._updateGridStability(avgDelta < MAX_JITTER && this._poseSamples.length >= 2)
    }

    if (elapsed >= SCAN_DURATION) {
      this._scanning = false
      this._scanDone = true
      this._checkReadyToStart()
    }
  },

  _checkReadyToStart() {
    if (this._scanDone && this._preloadDone) this._onReadyToStart()
  },

  _onReadyToStart() {
    const icon = document.getElementById('scan-icon')
    const text = document.getElementById('scan-box-text')
    const box = document.getElementById('scan-box')
    const btn = document.getElementById('btn-iniciar')

    icon.src = '/assets/images/check.svg'
    icon.classList.remove('scan-icon-spin')
    text.textContent = T.scanning.ready

    setTimeout(() => {
      box.style.opacity = '0'
      box.style.pointerEvents = 'none'
      btn.classList.add('visible')
      btn.addEventListener('click', () => this._finish(), {once: true})
    }, 1200)
  },

  _finish() {
    this._hideGrid()
    this._overlay.style.transition = 'opacity 0.4s ease'
    this._overlay.style.opacity = '0'
    this._overlay.style.pointerEvents = 'none'
    setTimeout(() => {
      this._overlay.remove()
      this.el.sceneEl.emit('environment-ok')
    }, 420)
  },

  /* ── Scan ground-effect helpers ─────────────────────────────────────── */

  _getGroundEffect() { return this.el.sceneEl.components['portal-ground-effect'] },
  _showGrid() { const g = this._getGroundEffect(); if (g) g.showSteady(0, 0, -4.5) },
  _hideGrid() { /* ground effect persists — tap-to-place-portal.playAt() takes over */ },
  _updateGridStability(stable) { },

  /* ── Brightness sampling ─────────────────────────────────────────────── */

  _sampleBrightness() {
    if (!this._cameraVideo) {
      const videos = document.querySelectorAll('video')
      for (const v of videos) {
        if (v.srcObject) { this._cameraVideo = v; break }
      }
    }
    const video = this._cameraVideo
    if (!video || video.readyState < 2) return -1
    this._ctx.drawImage(video, 0, 0, 64, 64)
    const data = this._ctx.getImageData(0, 0, 64, 64).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }
    return sum / (64 * 64)
  },
}

export {introFlowComponent}
