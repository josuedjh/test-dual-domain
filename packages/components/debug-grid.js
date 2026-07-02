// Debug ground-plane grid component.
// Draws a flat wireframe grid at y = 0 so you can visualise where
// 8th Wall's SLAM thinks the floor is.

const WIRE_COLORS = {
  hiderWalls:  '#FF00FF',   // magenta — hider-walls box boundaries
  portalWall:  '#00FFFF',   // cyan    — portal-wall hider planes
  stencilMask: '#FFFF00',   // yellow  — stencil mask plane
  portalWindow:'#FF8800',   // orange  — portal-window sphere
}

const debugGridComponent = {
  schema: {
    size:      {type: 'number', default: 50},     // total grid extent (metres)
    divisions: {type: 'number', default: 100},    // number of cells per axis
    color:     {type: 'color',  default: '#39FF14'}, // bright green
    opacity:   {type: 'number', default: 0.50},
  },

  init() {
    this._gridEntity = null
    this._visible = false
    this._built = false
    this._gridHelper = null
    this._wireGroup = null
    this._wireBuilt = false

    // Toggle button (created once)
    this._btn = document.getElementById('gridToggleBtn')
    if (this._btn) {
      this._btn.addEventListener('click', () => this.toggle())
    }
  },

  toggle() {
    if (!this._built) this._buildGrid()
    if (!this._wireBuilt) this._buildWireframes()
    this._visible = !this._visible
    this._gridEntity.object3D.visible = this._visible
    if (this._wireGroup) this._wireGroup.visible = this._visible
    if (this._btn) {
      this._btn.classList.toggle('grid-btn-active', this._visible)
    }
  },

  show() {
    if (!this._built) this._buildGrid()
    if (!this._wireBuilt) this._buildWireframes()
    this._visible = true
    if (this._gridEntity && this._gridEntity.object3D) {
      this._gridEntity.object3D.visible = true
    }
    if (this._wireGroup) this._wireGroup.visible = true
    if (this._btn) this._btn.classList.add('grid-btn-active')
  },

  hide() {
    if (!this._built) return
    this._visible = false
    if (this._gridEntity) this._gridEntity.object3D.visible = false
    if (this._wireGroup) this._wireGroup.visible = false
    if (this._btn) this._btn.classList.remove('grid-btn-active')
  },

  setColor(hex) {
    if (!this._gridHelper) return
    const color = new THREE.Color(hex)
    this._gridHelper.material.color.copy(color)
  },

  _buildGrid() {
    const {size, divisions, color, opacity} = this.data

    const gridHelper = new THREE.GridHelper(size, divisions, color, color)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = opacity
    gridHelper.material.depthWrite = false
    this._gridHelper = gridHelper

    // Wrap in an a-entity so it lives in the scene graph
    const entity = document.createElement('a-entity')
    entity.classList.add('debug-grid')
    this.el.sceneEl.appendChild(entity)

    // Wait for entity to initialise, then attach the grid
    entity.addEventListener('loaded', () => {
      entity.object3D.add(gridHelper)
      // Respect current _visible state (may have been set by show() before loaded fired)
      entity.object3D.visible = this._visible
    })

    this._gridEntity = entity
    this._built = true
  },

  // ── Hider wireframe visualisation ──────────────────────────────────────
  _buildWireframes() {
    this._wireGroup = new THREE.Group()
    this._wireGroup.visible = this._visible

    // Helper: create EdgesGeometry wireframe for a given geometry
    const makeWire = (geo, colorHex) => {
      const edges = new THREE.EdgesGeometry(geo)
      const mat = new THREE.LineBasicMaterial({
        color: colorHex,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.03,
      })
      const lines = new THREE.LineSegments(edges, mat)
      lines.renderOrder = 9999  // always on top
      return lines
    }

    // ── 1. Hider walls (#hider-walls children) ──────────────────────────
    const hiderWalls = document.getElementById('hider-walls')
    if (hiderWalls) {
      hiderWalls.querySelectorAll('a-box').forEach((box) => {
        const s = box.getAttribute('scale') || {x: 1, y: 1, z: 1}
        const p = box.getAttribute('position') || {x: 0, y: 0, z: 0}
        const geo = new THREE.BoxGeometry(s.x, s.y, s.z)
        const wire = makeWire(geo, WIRE_COLORS.hiderWalls)
        wire.position.set(p.x, p.y, p.z)
        this._wireGroup.add(wire)
      })
    }

    // ── 2. Portal-wall hider planes ─────────────────────────────────────
    const portalWall = document.getElementById('portal-wall')
    if (portalWall) {
      portalWall.querySelectorAll('a-plane').forEach((plane) => {
        const w = parseFloat(plane.getAttribute('width')) || 1
        const h = parseFloat(plane.getAttribute('height')) || 1
        const p = plane.getAttribute('position') || {x: 0, y: 0, z: 0}
        const r = plane.getAttribute('rotation') || {x: 0, y: 0, z: 0}
        const geo = new THREE.PlaneGeometry(w, h)
        const wire = makeWire(geo, WIRE_COLORS.portalWall)
        wire.position.set(p.x, p.y, p.z)
        wire.rotation.set(
          THREE.MathUtils.degToRad(r.x),
          THREE.MathUtils.degToRad(r.y),
          THREE.MathUtils.degToRad(r.z),
        )
        this._wireGroup.add(wire)
      })
    }

    // ── 3. Stencil mask plane ───────────────────────────────────────────
    const stencilMask = document.getElementById('portal-stencil-mask')
    if (stencilMask) {
      const w = parseFloat(stencilMask.getAttribute('width')) || 1
      const h = parseFloat(stencilMask.getAttribute('height')) || 1
      const p = stencilMask.getAttribute('position') || {x: 0, y: 0, z: 0}
      const geo = new THREE.PlaneGeometry(w, h)
      const wire = makeWire(geo, WIRE_COLORS.stencilMask)
      wire.position.set(p.x, p.y, p.z)
      this._wireGroup.add(wire)
    }

    // ── 4. Portal-window sphere ─────────────────────────────────────────
    const portalWindow = document.getElementById('portal-window')
    if (portalWindow) {
      const geoAttr = portalWindow.getAttribute('geometry') || {}
      const radius = geoAttr.radius || 50
      const geo = new THREE.SphereGeometry(radius, 24, 16)
      const wire = makeWire(geo, WIRE_COLORS.portalWindow)
      const s = portalWindow.getAttribute('scale') || {x: 1, y: 1, z: 1}
      wire.scale.set(s.x, s.y, s.z)
      this._wireGroup.add(wire)
    }

    // Attach wireframes to portal-root so they move/scale with it
    const portalRoot = document.getElementById('portal-root')
    if (portalRoot && portalRoot.object3D) {
      // Items 2,3,4 are relative to portal-root.
      // Item 1 (hider-walls) is in world space — re-parent those wires to scene.
      // Simplest: separate groups.
      const portalGroup = new THREE.Group()
      const sceneGroup = new THREE.Group()

      this._wireGroup.children.slice().forEach((child) => {
        // Hider-wall wires have magenta color
        if (child.material && child.material.color.getHexString() === 'ff00ff') {
          sceneGroup.add(child)
        } else {
          portalGroup.add(child)
        }
      })

      portalRoot.object3D.add(portalGroup)
      this.el.sceneEl.object3D.add(sceneGroup)

      // Keep references for visibility toggling
      this._wirePortalGroup = portalGroup
      this._wireSceneGroup = sceneGroup
    } else {
      this.el.sceneEl.object3D.add(this._wireGroup)
    }

    this._wireBuilt = true
  },

  tick() {
    // Sync wireframe visibility with toggle state
    if (this._wirePortalGroup) this._wirePortalGroup.visible = this._visible
    if (this._wireSceneGroup) this._wireSceneGroup.visible = this._visible
  },
}

export {debugGridComponent}