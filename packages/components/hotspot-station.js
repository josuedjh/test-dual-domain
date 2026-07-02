// Hotspot markers + station manager live together because stationManager.goTo()
// needs to close the active hotspot panel before transitioning.

import {PORTAL_BG_SVG} from './portal-bg'
import T from '../shared/i18n'

// ── Shared state ─────────────────────────────────────────────────────────────
let _activePanel = null       // currently open hotspot panel (at most one at a time)
let _cursorInitialized = false  // raycaster cursor is created only once across all hotspots

// ── Hotspot ───────────────────────────────────────────────────────────────────
// Each <a-entity hotspot="..."> creates a pulsing 3D marker and an HTML info panel.
const hotspotComponent = {
  schema: {
    title:       {type: 'string', default: 'Punto de interés'},
    description: {type: 'string', default: ''},
    key:         {type: 'number', default: -1},    // índice en T.hotspots (i18n)
    hoverAngle:  {type: 'number', default: 18},   // degrees from center to start hover
  },

  init() {
    this._open = false
    this._hoverAmount = 0  // 0 = idle, 1 = fully hovered

    // Texto desde el diccionario activo cuando el hotspot declara un `key`.
    // Así index.html queda igual en ambos idiomas; solo cambia el bundle.
    const entry = T.hotspots[this.data.key]
    if (entry) {
      this.data.title = entry.title
      this.data.description = entry.desc
    }

    this._buildMarker()

    // Interaction events (cursor / raycaster)
    this.el.addEventListener('click', () => this._toggle())

    // Setup cursor for mobile tap interaction AFTER the portal has been placed.
    if (!_cursorInitialized) {
      _cursorInitialized = true
      const scene = this.el.sceneEl
      scene.addEventListener('dismissPrompt', () => {
        const cam = document.getElementById('camera')
        cam.setAttribute('cursor', 'rayOrigin: mouse; fuse: false')
        cam.setAttribute('raycaster', 'objects: .hotspot-marker; far: 60')
      }, {once: true})
    }

    // Reusable vectors for tick()
    this._camDir = new THREE.Vector3()
    this._toHotspot = new THREE.Vector3()
    this._camPos = new THREE.Vector3()
  },

  // ── Marker (bullet) ──────────────────────────────────────────────────────
  _buildMarker() {
    const d = this.data
    // Brand colors – same for every hotspot per design
    const BLUE_LIGHT = '#4FC3F7'
    const BLUE_DARK  = '#1565C0'

    // Outer ring – slowly spinning (light blue)
    const ring = document.createElement('a-ring')
    ring.setAttribute('radius-inner', 0.38)
    ring.setAttribute('radius-outer', 0.52)
    ring.setAttribute('material', `shader: flat; color: ${BLUE_LIGHT}; opacity: 0.7; side: double`)
    ring.setAttribute('animation__spin', {
      property: 'object3D.rotation.z',
      from: 0, to: 360, dur: 5000, loop: true, easing: 'linear',
    })
    this.el.appendChild(ring)
    this._ring = ring

    // White separation ring (creates the target / bullseye look)
    const ringWhite = document.createElement('a-ring')
    ringWhite.setAttribute('radius-inner', 0.30)
    ringWhite.setAttribute('radius-outer', 0.37)
    ringWhite.setAttribute('material', 'shader: flat; color: #FFFFFF; opacity: 0.9; side: double')
    this.el.appendChild(ringWhite)

    // Inner sphere – pulsing (dark blue)
    const sphere = document.createElement('a-sphere')
    sphere.setAttribute('radius', 0.26)
    sphere.setAttribute('material', `shader: flat; color: ${BLUE_DARK}; opacity: 1`)
    sphere.setAttribute('animation__pulse', {
      property: 'scale',
      from: '1 1 1', to: '1.35 1.35 1.35',
      dur: 900, dir: 'alternate', loop: true, easing: 'easeInOutSine',
    })
    sphere.classList.add('hotspot-marker')   // raycaster target
    this.el.appendChild(sphere)
    this._sphere = sphere

    // Glow halo (light blue)
    const glow = document.createElement('a-ring')
    glow.setAttribute('radius-inner', 0.24)
    glow.setAttribute('radius-outer', 0.7)
    glow.setAttribute('material', `shader: flat; color: ${BLUE_LIGHT}; opacity: 0.15; side: double`)
    glow.setAttribute('animation__glow', {
      property: 'scale',
      from: '1 1 1', to: '1.2 1.2 1.2',
      dur: 1400, dir: 'alternate', loop: true, easing: 'easeInOutSine',
    })
    this.el.appendChild(glow)
    this._glow = glow

    // ── Hover label (above the marker) ──────────────────────────────────────
    // Shown on proximity. Tap (dot OR label) expands it in-place to reveal the
    // description. Lives in 3D so it tilts with the panorama. The group origin
    // sits at the TOP edge of the card so the box can grow downward on expand
    // while the title row stays put.
    const labelGroup = document.createElement('a-entity')
    labelGroup.setAttribute('position', '0 2.8 0')
    labelGroup.addEventListener('loaded', () => { labelGroup.object3D.visible = false })
    this.el.appendChild(labelGroup)
    this._label = labelGroup

    // Background card (semi-transparent white) — also the label's tap target.
    const labelBg = document.createElement('a-plane')
    labelBg.setAttribute('width', 4)
    labelBg.setAttribute('height', 1)
    labelBg.setAttribute('material', 'shader: flat; color: #FFFFFF; opacity: 0.8; transparent: true; side: double')
    labelBg.setAttribute('position', '0 -0.5 0')
    labelBg.classList.add('hotspot-marker')   // raycaster target → tap expands
    labelGroup.appendChild(labelBg)
    this._labelBg = labelBg

    // Title (uppercase), anchored left so the icon can sit right after it.
    const title = document.createElement('a-text')
    title.setAttribute('value', d.title.toUpperCase())
    title.setAttribute('color', '#1a1a1a')
    title.setAttribute('anchor', 'left')
    title.setAttribute('align', 'left')
    title.setAttribute('baseline', 'center')
    title.setAttribute('width', 14)
    title.setAttribute('position', '0 0 0.02')
    labelGroup.appendChild(title)
    this._titleText = title

    // Plus / close icon, placed just after the title with a small gap.
    const icon = document.createElement('a-image')
    icon.setAttribute('src', '#icon-plus')
    icon.setAttribute('width', 0.6)
    icon.setAttribute('height', 0.6)
    icon.setAttribute('material', 'shader: flat; transparent: true; side: double')
    icon.setAttribute('position', '0 0 0.02')
    labelGroup.appendChild(icon)
    this._icon = icon

    // Description (hidden until expand, wrapped), centered below the title.
    const desc = document.createElement('a-text')
    desc.setAttribute('value', d.description)
    desc.setAttribute('color', '#33475b')
    desc.setAttribute('align', 'center')
    desc.setAttribute('anchor', 'center')
    desc.setAttribute('baseline', 'center')
    desc.setAttribute('width', 9)
    desc.setAttribute('position', '0 0 0.02')
    desc.addEventListener('loaded', () => { desc.object3D.visible = false })
    labelGroup.appendChild(desc)
    this._descText = desc

    // Fit the card to the rendered text once the meshes exist.
    this._labelReady = false
    this._layoutLabel()

    // Large invisible hit-area for easier tapping of the marker itself.
    const hitArea = document.createElement('a-sphere')
    hitArea.setAttribute('radius', 1.2)
    hitArea.setAttribute('material', 'shader: flat; opacity: 0; side: double; transparent: true')
    hitArea.classList.add('hotspot-marker')  // raycaster target
    this.el.appendChild(hitArea)
  },

  // ── Label layout ───────────────────────────────────────────────────────────
  // Measure the rendered title/description, pad the card, place the icon after
  // the title and the description below it. Retries until the text meshes exist.
  _layoutLabel() {
    const tMesh = this._titleText.getObject3D('text')
    if (!tMesh || !tMesh.geometry) {
      requestAnimationFrame(() => this._layoutLabel())
      return
    }
    tMesh.geometry.computeBoundingBox()
    const ts = tMesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(tMesh.scale)
    const tw = Math.abs(ts.x), th = Math.abs(ts.y)
    if (!(tw > 0)) {
      requestAnimationFrame(() => this._layoutLabel())
      return
    }

    // Description is optional — measure it only when present.
    let dw = 0, dh = 0
    if (this.data.description) {
      const dMesh = this._descText.getObject3D('text')
      if (!dMesh || !dMesh.geometry) {
        requestAnimationFrame(() => this._layoutLabel())
        return
      }
      dMesh.geometry.computeBoundingBox()
      const ds = dMesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(dMesh.scale)
      dw = Math.abs(ds.x); dh = Math.abs(ds.y)
    }

    // Padding so the text always breathes inside the card.
    const PAD_X = 0.6, PAD_Y = 0.45, ICON = 0.6, GAP = 0.45, GAP_TD = 0.5

    // Content (title + gap + icon) is centered horizontally over the marker.
    const contentW = tw + GAP + ICON
    const rowH = Math.max(th, ICON)
    const titleY = -(PAD_Y + rowH / 2)            // group origin = top edge

    this._titleText.object3D.position.set(-contentW / 2, titleY, 0.02)
    this._icon.object3D.position.set(-contentW / 2 + tw + GAP + ICON / 2, titleY, 0.02)
    this._descText.object3D.position.set(0, titleY - rowH / 2 - GAP_TD - dh / 2, 0.02)

    this._boxCollapsed = { w: contentW + 2 * PAD_X, h: rowH + 2 * PAD_Y }
    this._boxExpanded  = {
      w: Math.max(contentW + 2 * PAD_X, dw + 2 * PAD_X),
      h: PAD_Y + rowH + GAP_TD + dh + PAD_Y,
    }

    this._labelReady = true
    this._applyBox(this._open ? this._boxExpanded : this._boxCollapsed)
  },

  _applyBox(box) {
    this._labelBg.setAttribute('width', box.w)
    this._labelBg.setAttribute('height', box.h)
    this._labelBg.object3D.position.set(0, -box.h / 2, 0)

    // Shift the whole group upward so the card bottom stays at the same world
    // position as when collapsed — expanded content always stays above the marker.
    const extraH = box.h - (this._boxCollapsed ? this._boxCollapsed.h : box.h)
    this._label.object3D.position.y = 2.8 + extraH
  },

  // ── Tick: proximity-based hover ──────────────────────────────────────────
  tick() {
    // Hidden hotspots (other stations) skip all hover math.
    if (!this.el.object3D.visible) return

    const cam = this.el.sceneEl.camera
    if (!cam) return

    // Camera forward direction (world)
    cam.getWorldDirection(this._camDir)

    // Direction from camera to this hotspot (world) — reuse _camPos, no alloc
    this.el.object3D.getWorldPosition(this._toHotspot)
    cam.getWorldPosition(this._camPos)
    this._toHotspot.sub(this._camPos).normalize()

    // Angle between camera forward and direction to hotspot (degrees)
    const dot = this._camDir.dot(this._toHotspot)
    const angle = Math.acos(Math.min(Math.max(dot, -1), 1)) * (180 / Math.PI)

    // Map angle to hover amount: full hover at 0°, none at hoverAngle°.
    // While open, force full hover so the card stays up even if you look away.
    const threshold = this.data.hoverAngle
    const targetHover = this._open ? 1 : (angle < threshold ? 1 - (angle / threshold) : 0)

    // Smooth lerp
    this._hoverAmount += (targetHover - this._hoverAmount) * 0.12

    // Clamp tiny values
    if (this._hoverAmount < 0.01) this._hoverAmount = 0

    const h = this._hoverAmount

    // Scale: 1.0 (idle) → 1.5 (fully hovered)
    const s = 1 + h * 0.5
    this.el.object3D.scale.set(s, s, s)

    // Billboard: orient the whole marker so its front always faces the user.
    // (A-Frame 1.5 dropped the `look-at` component, so we do it manually here —
    // same approach as the label below. _camPos already holds the camera's world
    // position from the angle math above.)
    this.el.object3D.lookAt(this._camPos)

    // Label visibility: show when hovered, or whenever it's open.
    if (this._label.object3D) {
      const show = this._open || h > 0.15
      this._label.object3D.visible = show

      // Orient label toward camera when visible (world-space lookAt)
      if (show) {
        cam.getWorldPosition(this._camPos)
        this._label.object3D.lookAt(this._camPos)
      }
    }

    // Glow opacity boost (always light blue)
    if (this._glow.getObject3D('mesh') && this._glow.getObject3D('mesh').material) {
      this._glow.getObject3D('mesh').material.opacity = 0.15 + h * 0.35
    }

  },

  // ── Toggle / open / close ─────────────────────────────────────────────────
  // Tapping a hotspot expands its label card in-place. Only one open at a time.
  _toggle() {
    if (this._open) {
      this._close()
    } else {
      if (_activePanel && _activePanel !== this) _activePanel._close()
      this._expand()
    }
  },

  _close() {
    this._collapse()
  },

  // ── Info hotspot: expand the label card in-place ──────────────────────────
  _expand() {
    if (this._labelReady) this._applyBox(this._boxExpanded)
    if (this._descText.object3D) this._descText.object3D.visible = true
    this._icon.setAttribute('src', '#icon-aspa')
    this._open = true
    _activePanel = this
  },

  _collapse() {
    if (this._labelReady) this._applyBox(this._boxCollapsed)
    if (this._descText.object3D) this._descText.object3D.visible = false
    this._icon.setAttribute('src', '#icon-plus')
    this._open = false
    if (_activePanel === this) _activePanel = null
  },

  remove() {
    this._close()
  },
}

// ── Station manager ───────────────────────────────────────────────────────────
// Manages multiple 360° panorama stations inside the portal contents.
// Call goTo(stationId) to transition between stations with a white flash.

const STATION_SKIES = {
  'station-entrance': '#station-360-img',
  'station-exit-a':   '#exit-a-360-img',
}

// Etiquetas de zona desde el diccionario activo (claves = id de estación).
const STATION_LABELS = T.zone

const stationManagerComponent = {
  schema: {
    initial: {type: 'string', default: 'station-entrance'},
  },

  init() {
    this._current = this.data.initial
    this._confirmCard = null

    this.el.addEventListener('portal-entered', () => {
      // Zone label (experience-hud, z:18 — no solapa con trazado)
      const hud = document.getElementById('experience-hud')
      if (hud) {
        // Banda diagonal contenedora del nombre de estación: 2ª franja del MISMO
        // Union que aloja el logo (band-2, y56–112, alineada a la derecha y bajo el
        // contenedor del logo = "Trazado 199" del Figma). Recortada a esa única franja.
        if (!hud.querySelector('.zone-band-clip')) {
          const band = document.createElement('div')
          band.className = 'zone-band-clip'
          band.innerHTML = PORTAL_BG_SVG
          hud.insertBefore(band, hud.firstChild)
        }
        hud.classList.add('visible')
      }
      this._updateZoneLabel(this._current)

      // Botón (scanning-hud, z:199 — por encima del trazado por DOM order)
      const btn = document.getElementById('btn-cambiar-vista')
      if (btn) {
        btn.classList.add('visible')
        btn.addEventListener('click', () => this._showChangeViewConfirm())
      }
    }, {once: true})
  },

  _updateZoneLabel(stationId) {
    const label = document.getElementById('zone-label')
    if (label) label.textContent = STATION_LABELS[stationId] || stationId
  },

  _showChangeViewConfirm() {
    if (this._confirmCard) { this._closeConfirmOverlay(); return }

    const el = document.createElement('div')
    el.id = 'change-view-overlay'
    el.innerHTML = `
      ${PORTAL_BG_SVG}
      <div class="splash-frame">
        <img class="info-logo" src="/assets/images/TOPO-simbolo-logotipo.svg" alt="TOPO">
        <button class="cv-cerrar">
          <span>${T.changeView.cerrar}</span>
          <img src="/assets/images/aspa.svg" alt="" width="26" height="26">
        </button>
        <div class="cv-text">
          <h2 class="cv-title">${T.changeView.title}</h2>
          <p class="cv-desc">${T.changeView.desc}</p>
        </div>
        <button class="cv-btn cv-btn-vestibulo" data-target="station-entrance">
          <span>${T.changeView.btnVestibulo}</span>
          <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
        </button>
        <button class="cv-btn cv-btn-acceso" data-target="station-exit-a">
          <span>${T.changeView.btnAcceso}</span>
          <img src="/assets/images/arrow.svg" width="22" height="10" alt="" aria-hidden="true">
        </button>
      </div>
    `

    this._confirmCard = el
    document.body.appendChild(el)
    // Oculta la banda minimizada persistente para que no se solape con el panel completo
    document.body.classList.add('cv-open')
    requestAnimationFrame(() => el.classList.add('active'))

    el.querySelector('.cv-cerrar').addEventListener('click', () => this._closeConfirmOverlay())

    el.querySelectorAll('.cv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target
        this._closeConfirmOverlay()
        this.goTo(target)
      })
    })
  },

  _closeConfirmOverlay() {
    if (!this._confirmCard) return
    const el = this._confirmCard
    this._confirmCard = null
    document.body.classList.remove('cv-open')
    el.classList.remove('active')
    el.addEventListener('transitionend', () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, {once: true})
  },

  goTo(targetStation) {
    if (targetStation === this._current) return

    // Close any open hotspot panel or confirm overlay
    if (_activePanel) _activePanel._close()
    this._closeConfirmOverlay()

    const overlay = document.getElementById('transition-overlay')
    if (!overlay) return

    // Step 1: fade to white
    overlay.classList.add('active')

    overlay.addEventListener('transitionend', () => {
      const newSrc = STATION_SKIES[targetStation]
      if (!newSrc) {
        overlay.classList.remove('active')
        return
      }

      // Swap panorama sky
      const skyEl = document.querySelector('#portal-contents a-sky')
      if (skyEl) skyEl.setAttribute('src', newSrc)

      // Swap portal-window sphere texture
      const windowEl = document.getElementById('portal-window')
      if (windowEl) windowEl.setAttribute('material', {src: newSrc})

      // Show/hide hotspots by station
      document.querySelectorAll('[data-station]').forEach(el => {
        el.setAttribute('visible', el.dataset.station === targetStation)
      })

      this._current = targetStation
      this._updateZoneLabel(targetStation)

      // Step 2: fade back to transparent
      overlay.classList.remove('active')
    }, {once: true})
  },
}

export {hotspotComponent, stationManagerComponent}
