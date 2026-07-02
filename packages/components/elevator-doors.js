// Two sliding panels that cover the portal opening and slide apart like elevator doors.
// Expects #door-left and #door-right child entities inside the host entity.
// Events: 'doors-open', 'doors-close', 'doors-toggle'
// Emits:  'doors-opened', 'doors-closed'
const elevatorDoorsComponent = {
  schema: {
    width:        {default: 1.1},
    height:       {default: 4},
    depth:        {default: 0.08},
    openOffset:   {default: 1.15},
    duration:     {default: 1300},
    color:        {default: '#888'},
    autoOpen:     {default: false},
    clipHalfWidth:{default: 0},   // half-width of the frame opening in scene units; 0 = no clip
  },

  init() {
    this.doorLeft = this.el.querySelector('#door-left')
    this.doorRight = this.el.querySelector('#door-right')
    this._isOpen = false
    this._animating = false

    const gap = -0.01
    const halfW = this.data.width / 2

    this._closedLeftX = -(halfW + gap / 2)
    this._closedRightX = (halfW + gap / 2)
    this._openLeftX = this._closedLeftX - this.data.openOffset
    this._openRightX = this._closedRightX + this.data.openOffset

    // ── Clipping planes to hide door geometry outside the frame ──────
    this._clipPlanes = []
    if (this.data.clipHalfWidth > 0) {
      // Left boundary: show only x >= worldX - halfW  →  normal (+1,0,0)
      this._clipLeft = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
      // Right boundary: show only x <= worldX + halfW  →  normal (-1,0,0)
      this._clipRight = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
      this._clipPlanes = [this._clipLeft, this._clipRight]
      this._worldPos = new THREE.Vector3()
      this._worldQuat = new THREE.Quaternion()
      this._worldScale = new THREE.Vector3()

      // Enable local clipping — may fire before or after renderer is ready
      const enableClipping = () => {
        if (this.el.sceneEl.renderer) {
          this.el.sceneEl.renderer.localClippingEnabled = true
        }
      }
      enableClipping()
      this.el.sceneEl.addEventListener('render-target-loaded', enableClipping)
      this.el.sceneEl.addEventListener('loaded', enableClipping)
    }

    this._setupDoor(this.doorLeft, this._closedLeftX)
    this._setupDoor(this.doorRight, this._closedRightX)

    this.el.addEventListener('doors-open', () => this.open())
    this.el.addEventListener('doors-close', () => this.close())
    this.el.addEventListener('doors-toggle', () => this.toggle())

    if (this.data.autoOpen) {
      this.open()
    }
  },

  _setupDoor(doorEl, startX) {
    if (!doorEl) return
    const d = this.data
    const clipPlanes = this._clipPlanes

    if (!doorEl.hasAttribute('gltf-model')) {
      doorEl.setAttribute('geometry', {
        primitive: 'box', width: d.width, height: d.height, depth: d.depth,
      })
      doorEl.setAttribute('material', {color: d.color, metalness: 0.4, roughness: 0.5})
    }
    doorEl.object3D.position.x = startX

    const applyStencil = () => {
      doorEl.object3D.traverse((child) => {
        if (!child.isMesh || !child.material) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          mat.stencilWrite = true
          mat.stencilRef = 0
          mat.stencilFunc = THREE.AlwaysStencilFunc
          mat.stencilZPass = THREE.ReplaceStencilOp
          mat.stencilZFail = THREE.ReplaceStencilOp
          mat.stencilFail = THREE.ReplaceStencilOp
          mat.depthWrite = true
          mat.depthTest = true
          // Apply frame clipping planes
          if (clipPlanes.length > 0) {
            mat.clippingPlanes = clipPlanes
            mat.clipShadows = true
          }
          mat.needsUpdate = true
        })
        child.renderOrder = -0.5
      })
    }
    doorEl.addEventListener('object3dset', applyStencil)
    doorEl.addEventListener('model-loaded', applyStencil)
    applyStencil()
  },

  // ── Update clipping planes to follow world position each frame ─────
  tick() {
    if (this._clipPlanes.length === 0) return
    // Decompose the world matrix so the clip half-width tracks the portal's world
    // scale — the planes live in world space, so clipHalfWidth (a local/scene-unit
    // value) must be multiplied by the entity's world scale or the clip would cut
    // the doorway too narrow whenever portal-root is scaled up.
    this.el.object3D.updateWorldMatrix(true, false)
    this.el.object3D.matrixWorld.decompose(this._worldPos, this._worldQuat, this._worldScale)
    const hw = this.data.clipHalfWidth * this._worldScale.x
    // Left: visible when x >= worldX - hw  →  (1,0,0)·p + constant >= 0  →  constant = hw - worldX
    this._clipLeft.constant = hw - this._worldPos.x
    // Right: visible when x <= worldX + hw  →  (-1,0,0)·p + constant >= 0  →  constant = hw + worldX
    this._clipRight.constant = hw + this._worldPos.x
  },

  open() {
    if (this._isOpen || this._animating) return
    this._animate(true)
  },

  close() {
    if (!this._isOpen || this._animating) return
    this._animate(false)
  },

  toggle() {
    if (this._animating) return
    this._animate(!this._isOpen)
  },

  _animate(opening) {
    this._animating = true
    const dur = this.data.duration
    const leftStart = opening ? this._closedLeftX : this._openLeftX
    const leftEnd   = opening ? this._openLeftX   : this._closedLeftX
    const rightStart = opening ? this._closedRightX : this._openRightX
    const rightEnd   = opening ? this._openRightX   : this._closedRightX

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    let startTime = -1

    const tick = (time) => {
      if (startTime < 0) startTime = time
      const t = Math.min((time - startTime) / dur, 1)
      const e = easeInOutCubic(t)

      if (this.doorLeft) this.doorLeft.object3D.position.x = leftStart + (leftEnd - leftStart) * e
      if (this.doorRight) this.doorRight.object3D.position.x = rightStart + (rightEnd - rightStart) * e

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        this._isOpen = opening
        this._animating = false
        this.el.emit(opening ? 'doors-opened' : 'doors-closed')
      }
    }

    requestAnimationFrame(tick)
  },
}

export {elevatorDoorsComponent}
