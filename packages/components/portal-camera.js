// Portal state machine: INITIAL → INSIDE ↔ OUTSIDE.
// INITIAL: portal in front, 360° visible through stencil window, rise animation.
// INSIDE:  360° sky everywhere, AR visible through stencil doorway, portal behind user.
// OUTSIDE: AR everywhere, 360° visible through stencil window, portal behind user.
// Only way back to INITIAL: recenter button (re-triggers rise animation).
const portalCameraComponent = {
  schema: {
    height: {default: 10},
    insidePortalOffset: {default: 3},
    smoothFactor: {default: 0.05},
    jitterThreshold: {default: 0.002},
    exitProximityThreshold: {default: 1.5},
    // Fire the INITIAL/OUTSIDE → INSIDE switch this many metres in FRONT of
    // the portal plane (relZ still > 0). Must exceed the camera near-clip
    // distance so the switch happens while the stencil mask still fully
    // covers the viewport — otherwise the mask gets near-clipped, stops
    // writing stencil=1, and the AR feed flashes through for 1-2 frames.
    entryZThreshold: {default: 0.3},
    // Half-width of the entry trigger zone in X (portal-root units). Matches
    // the stencil mask aperture (width 3.4 → ±1.7) plus a small margin so
    // edge crossings still trigger. The old 1.5 was narrower than the opening.
    entryHalfWidth: {default: 1.8},
  },
  init() {
    this.camera = this.el
    this.contents = document.getElementById('portal-contents')
    this.walls = document.getElementById('hider-walls')
    this.portalWall = document.getElementById('portal-wall')
    this.stencilMask = document.getElementById('portal-stencil-mask')
    this.portalWindow = document.getElementById('portal-window')
    this.portalRoot = document.getElementById('portal-root')

    // State machine: 'INITIAL' | 'INSIDE' | 'OUTSIDE'
    this._state = 'INITIAL'
    this.wasOutside = true

    // Spawn values — captured once after first placement, never mutated
    this._spawnPos = null
    this._spawnScale = null

    // Position smoothing
    this._smoothedPos = new THREE.Vector3()
    this._targetPos = new THREE.Vector3()
    this._smoothingActive = false

    // Cooldown: prevent false re-entry from SLAM jitter after portal teleports
    this._lastTransitionTime = 0

    // Stencil ready flag (same as stable version)
    this._stencilReady = false

    // Belt-and-suspenders: ensure the stencil buffer is cleared every frame.
    // INSIDE rendering (NotEqualStencilFunc on a buffer of 0) assumes no
    // residue from the OUTSIDE frame, where the mask wrote stencil=1 across
    // most of the screen. THREE defaults autoClearStencil to true, but 8th
    // Wall drives the render loop, so we assert it once the renderer exists.
    this._stencilClearAsserted = false

    // Content stencil is only re-applied when the state flips (or when a new
    // mesh appears under #portal-contents). `object3dset` and `model-loaded`
    // bubble up from descendants, so a single listener on contents catches
    // late-loaded hotspot/sky meshes and forces a refresh next tick.
    this._lastStencilInside = null
    const markStencilDirty = () => { this._lastStencilInside = null }
    this.contents.addEventListener('object3dset', markStencilDirty)
    this.contents.addEventListener('model-loaded', markStencilDirty)
  },

  // ── Stencil setup ───────────────────────────────────────────────────
  // Configures the stencil mask (writes stencil=1 at the portal opening).
  // Called every frame during rise animation (shader recompilation can
  // wipe stencil state), and once after that.
  _initStencil() {
    const stencilMask = this.stencilMask || document.getElementById('portal-stencil-mask')
    if (!stencilMask) return
    const maskMesh = stencilMask.getObject3D('mesh')
    if (!maskMesh || !maskMesh.material) return

    const rising = this.portalRoot && this.portalRoot.hasAttribute('data-rising')
    if (this._stencilReady && !rising) return

    // Mask: writes stencil=1, invisible (no color/depth output)
    const mm = maskMesh.material
    mm.side = THREE.DoubleSide
    mm.colorWrite = false
    mm.depthWrite = false
    mm.depthTest = false
    mm.stencilWrite = true
    mm.stencilRef = 1
    mm.stencilFunc = THREE.AlwaysStencilFunc
    mm.stencilZPass = THREE.ReplaceStencilOp
    mm.stencilZFail = THREE.ReplaceStencilOp
    mm.stencilFail = THREE.ReplaceStencilOp
    maskMesh.renderOrder = -1

    this._stencilReady = true
  },

  // ── Content stencil (sky + hotspots) ──────────────────────────────────
  // portal-contents is ALWAYS visible (object3D.visible = true).
  // Stencil is ALWAYS enabled (stencilWrite = true) — only the function
  // changes between states. This avoids any shader recompilation since the
  // stencil program variant is compiled once on the first render and reused.
  //
  // OUTSIDE: EqualStencilFunc   → only renders through the doorway (stencil=1)
  // INSIDE:  NotEqualStencilFunc → renders everywhere EXCEPT the doorway
  //          → creates a "window" to the AR world through the portal
  _applyContentStencil(inside) {
    const func = inside ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc
    this.contents.object3D.traverse((child) => {
      if (!child.isMesh || !child.material) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((mat) => {
        mat.stencilWrite = true
        mat.stencilRef = 1
        mat.stencilFunc = func
        mat.stencilFail = THREE.KeepStencilOp
        mat.stencilZFail = THREE.KeepStencilOp
        mat.stencilZPass = THREE.KeepStencilOp
      })
    })
  },

  // ── Transition: INITIAL/OUTSIDE → INSIDE ────────────────────────────
  _enterPortal() {
    // Capture spawn values once (never overwritten)
    if (!this._spawnPos) {
      const p = this.portalRoot.getAttribute('position')
      this._spawnPos = Object.freeze({x: p.x, y: p.y, z: p.z})
    }
    if (!this._spawnScale) {
      const s = this.portalRoot.getAttribute('scale')
      this._spawnScale = Object.freeze({x: s.x, y: s.y, z: s.z})
    }

    // Reposition portal behind the camera
    const pz = this._spawnPos.z + this.data.insidePortalOffset
    this.portalRoot.setAttribute('position', {x: this._spawnPos.x, y: this._spawnPos.y, z: pz})
    this.portalRoot.object3D.position.set(this._spawnPos.x, this._spawnPos.y, pz)

    this._state = 'INSIDE'
    this._smoothingActive = false
    this.el.sceneEl.emit('portal-entered', null, false)
  },

  // ── Transition: INSIDE → OUTSIDE ───────────────────────────────────
  _exitPortal() {
    if (!this._spawnPos || !this._spawnScale) return

    // Place portal behind the camera at the original ground Y.
    const camZ = this.camera.object3D.position.z
    const pz = camZ - this.data.insidePortalOffset
    this.portalRoot.setAttribute('position', {
      x: this._spawnPos.x, y: this._spawnPos.y, z: pz,
    })
    this.portalRoot.object3D.position.set(this._spawnPos.x, this._spawnPos.y, pz)

    this._state = 'OUTSIDE'
    this._smoothingActive = false
  },

  // ── Reset to INITIAL (called by recenter / first-place) ────────────
  resetToInitial() {
    this._state = 'INITIAL'
    this.wasOutside = true
    this._smoothingActive = false
    this._lastTransitionTime = 0
    this._stencilReady = false
    this._lastStencilInside = null   // force content stencil refresh next tick
  },

  // ── Main tick ───────────────────────────────────────────────────────
  tick() {
    this._initStencil()

    // Assert stencil auto-clear once (renderer isn't ready during init)
    if (!this._stencilClearAsserted) {
      const r = this.el.sceneEl && this.el.sceneEl.renderer
      if (r) {
        r.autoClearStencil = true
        this._stencilClearAsserted = true
      }
    }

    const camPos = this.camera.object3D.position

    // ── Crossing detection (portal-root Z plane) ──────────────────────
    const rootPos = this.portalRoot
      ? this.portalRoot.object3D.position : {x: 0, y: 0, z: 0}
    let relZ = camPos.z - rootPos.z

    const now = performance.now()
    const cooledDown = (now - this._lastTransitionTime) > 600

    if (cooledDown) {
      if (this._state === 'INITIAL' || this._state === 'OUTSIDE') {
        // ── Entry detection (edge, with forward hysteresis) ─────────
        // Fires `entryZThreshold` metres BEFORE the portal plane (relZ
        // still > 0). At that distance the stencil mask already fills the
        // whole viewport, so OUTSIDE and INSIDE look identical at the switch
        // frame → the transition is invisible. Triggering exactly at
        // relZ ≤ 0 left a 1-2 frame gap where the mask is being clipped by
        // the camera near-plane and the AR feed flashed through.
        // Works for both INITIAL and OUTSIDE: portal is at spawn scale in
        // both, so the crossing geometry is identical.
        const entryThresh = this.data.entryZThreshold
        const isOutsideNow = relZ > entryThresh
        if (this.wasOutside && !isOutsideNow) {
          const scaleX = this.portalRoot ? this.portalRoot.object3D.scale.x : 1
          // Bounds must match the visible aperture (mask width 3.4 → ±1.7),
          // else edge crossings miss the trigger, never switch state, and
          // the camera ends up past the plane in OUTSIDE mode → stuck flash.
          const withinBounds = camPos.y < this.data.height * scaleX
            && Math.abs(camPos.x - rootPos.x) < this.data.entryHalfWidth * scaleX
          if (withinBounds) {
            this._enterPortal()
            this._lastTransitionTime = now
            relZ = camPos.z - this.portalRoot.object3D.position.z
          }
        }
        this.wasOutside = isOutsideNow
      } else if (this._state === 'INSIDE') {
        // ── INSIDE → OUTSIDE (proximity trigger) ────────────────────
        if (relZ > -this.data.exitProximityThreshold) {
          this._exitPortal()
          this._lastTransitionTime = now
          relZ = camPos.z - this.portalRoot.object3D.position.z
          this.wasOutside = relZ > this.data.entryZThreshold
        }
      }
    } else if (this._state !== 'INSIDE') {
      this.wasOutside = relZ > this.data.entryZThreshold
    }

    // ── Per-frame visibility (driven by state) ────────────────────────
    // portal-contents is ALWAYS visible — stencil controls where it renders.
    // This eliminates GPU shader-compilation flicker from visibility toggles.
    const inside = this._state === 'INSIDE'

    // Dynamic lookups — these elements are injected by variant-selector
    const portalWall = this.portalWall || document.getElementById('portal-wall')
    const stencilMask = this.stencilMask || document.getElementById('portal-stencil-mask')
    const portalWindow = this.portalWindow || document.getElementById('portal-window')

    // Contents always visible — stencil decides where it renders
    this.contents.object3D.visible = true
    // portal-window no longer needed (contents itself renders through stencil)
    if (portalWindow) portalWindow.object3D.visible = false
    // Stencil mask always visible (writes stencil=1 at doorway opening)
    if (stencilMask) stencilMask.object3D.visible = true
    // Hider walls: hide them when inside so the sky fills the view
    this.walls.object3D.visible = !inside
    // Portal wall: blocks the doorway view from inside
    if (portalWall) portalWall.object3D.visible = inside

    // Apply stencil to content meshes only on state change or new-mesh load.
    // The stencil program is compiled once; only the func differs per state,
    // so there's no flicker from re-applying lazily instead of every frame.
    if (inside !== this._lastStencilInside) {
      this._applyContentStencil(inside)
      this._lastStencilInside = inside
    }

    // ── Portal orientation (geometric, every frame) ───────────────────
    if (this.portalRoot && this.portalRoot.object3D) {
      this.portalRoot.object3D.rotation.y = this._state === 'INSIDE' ? Math.PI : 0
    }

    // ── Position smoothing (INITIAL only — INSIDE/OUTSIDE are fixed) ──
    if (this.portalRoot && this.portalRoot.object3D) {
      if (this.portalRoot.hasAttribute('data-rising')) {
        this._smoothingActive = false
      } else if (this._state === 'INITIAL') {
        const obj = this.portalRoot.object3D
        const attr = this.portalRoot.getAttribute('position')
        this._targetPos.set(attr.x, attr.y, attr.z)

        if (!this._smoothingActive) {
          this._smoothedPos.copy(this._targetPos)
          this._smoothingActive = true
        } else {
          const dist = this._smoothedPos.distanceTo(this._targetPos)
          if (dist > this.data.jitterThreshold) {
            if (dist > 1.0) {
              this._smoothedPos.copy(this._targetPos)
            } else {
              this._smoothedPos.lerp(this._targetPos, this.data.smoothFactor)
            }
          }
        }
        obj.position.copy(this._smoothedPos)
      } else {
        // INSIDE / OUTSIDE: snap position directly
        const obj = this.portalRoot.object3D
        const attr = this.portalRoot.getAttribute('position')
        obj.position.set(attr.x, attr.y, attr.z)
        this._smoothingActive = false
      }
    }
  },
}

export {portalCameraComponent}
