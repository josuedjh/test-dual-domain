// Handles portal placement on first tap, recenter button, and the rise animation.
const tapToPlacePortalComponent = {
  schema: {
    riseHeight: {default: 20},
    spawnDuration: {default: 3780},
    groundOffset: {default: 0},  // metres above y=0 – adjust so portal sits on the grid
    portalDistance: {default: -4.5},   // metres in Z – negative = farther from user
  },
  init() {
    const {sceneEl} = this.el
    const recenterBtn = document.getElementById('recenterButton')

    this.camera = document.getElementById('camera')
    this.portalRoot = this.el.sceneEl.querySelector('#portal-root')

    // ── Reusable rise animation ──────────────────────────────────────
    // Original scale from HTML attribute (before any state changes)
    const _origScale = this.portalRoot.getAttribute('scale')
    const originalScale = {x: _origScale.x, y: _origScale.y, z: _origScale.z}

    const playRiseAnimation = () => {
      const dur = this.data.spawnDuration
      // Always use the original HTML scale, not the current (possibly scaled-up) value
      const portalScale = {x: originalScale.x, y: originalScale.y, z: originalScale.z}
      // Rise distance scales with the portal so the emergence reads identically at any scale
      const riseH = this.data.riseHeight * portalScale.y

      // Reset portal-camera to INITIAL state
      const portalCam = sceneEl.camera.el.components['portal-camera']
      if (portalCam) portalCam.resetToInitial()

      // Close doors before the rise starts (support both door types)
      const elevatorDoors = this.portalRoot.querySelector('#elevator-doors')
      const portalRimEl = this.portalRoot.querySelector('#portalRim')
      if (elevatorDoors) elevatorDoors.emit('doors-close')
      else if (portalRimEl) portalRimEl.emit('doors-close')

      // Restore spawn scale for the animation
      this.portalRoot.setAttribute('scale', portalScale)
      this.portalRoot.object3D.scale.set(portalScale.x, portalScale.y, portalScale.z)

      // ── Compute how far the model's visual base sits above portal-root origin ──
      // baseOffset = world Y of model bottom when portal-root is at Y=0.
      // targetRootY = the portal-root Y at which the model base lands on groundOffset (floor).
      let baseOffset = 0
      const rimEl = this.portalRoot.querySelector('#portalRim')
      if (rimEl && rimEl.object3D.children.length > 0) {
        const box = new THREE.Box3().setFromObject(rimEl.object3D)
        if (!box.isEmpty()) {
          const rootY = this.portalRoot.object3D.getWorldPosition(new THREE.Vector3()).y
          baseOffset = box.min.y - rootY
        }
      }
      // portal-root must end here so the model base sits exactly on the floor
      const targetRootY = this.data.groundOffset - baseOffset

      // ── Clipping-plane setup ─────────────────────────────────────────
      // Clip at floor level (groundOffset), not at the model-base world Y.
      // This hides geometry below the floor as the portal rises from underground.
      const renderer = sceneEl.renderer
      renderer.localClippingEnabled = true
      const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.data.groundOffset)

      // Dynamic lookup (refs may change after variant swap)
      const portalStencilMask = this.portalRoot.querySelector('#portal-stencil-mask')
      const portalWindow = this.portalRoot.querySelector('#portal-window')
      const windowMesh = portalWindow ? portalWindow.getObject3D('mesh') : null

      const applyClip = () => {
        this.portalRoot.object3D.traverse((child) => {
          if (!child.isMesh || !child.material) return
          if (child === windowMesh) return

          const mats = Array.isArray(child.material)
            ? child.material : [child.material]
          mats.forEach((mat) => {
            const existing = mat.clippingPlanes || []
            if (!existing.includes(clipPlane)) {
              mat.clippingPlanes = [...existing, clipPlane]
              if (mat.isShaderMaterial) mat.clipping = true
              mat.needsUpdate = true
            }
          })
        })
      }

      const removeClip = () => {
        this.portalRoot.object3D.traverse((child) => {
          if (!child.isMesh || !child.material) return
          if (child === windowMesh) return

          const mats = Array.isArray(child.material)
            ? child.material : [child.material]
          mats.forEach((mat) => {
            if (mat.clippingPlanes) {
              mat.clippingPlanes = mat.clippingPlanes.filter((p) => p !== clipPlane)
            }
            mat.needsUpdate = true
          })
        })
      }

      // ── Portal initial state ─────────────────────────────────────────
      this.portalRoot.setAttribute('data-rising', '')
      this.portalRoot.setAttribute('visible', 'true')

      const pDist = this.data.portalDistance

      // ── Ground light effect ──────────────────────────────────────────
      // Always at groundOffset (floor) — same Y as showSteady during scanning.
      const groundEffect = sceneEl.components['portal-ground-effect']
      if (groundEffect) groundEffect.playAt(0, this.data.groundOffset, pDist)

      // ── Base-anchored rise (scale-invariant) ─────────────────────────
      // We animate the model BASE from underground up to the floor and derive
      // portal-root Y from the live scale.y each frame. This keeps the base planted
      // on the clip plane while the squash-stretch only stretches the top, so the
      // animation looks identical (proportional) at any portal scale. Anchoring to
      // portal-root origin instead made the base detach from the floor by an amount
      // proportional to the scale, which read as distortion at larger scales.
      const localBaseY = baseOffset / portalScale.y   // model bottom in root-local units
      const baseEnd = this.data.groundOffset
      const baseStart = baseEnd - riseH
      const startScaleY = portalScale.y * 0.85
      const rootYFor = (baseY, scaleY) => baseY - localBaseY * scaleY

      const startRootY = rootYFor(baseStart, startScaleY)
      this.portalRoot.object3D.position.set(0, startRootY, pDist)
      this.portalRoot.object3D.scale.set(portalScale.x, startScaleY, portalScale.z)
      this.portalRoot.setAttribute('position', `0 ${startRootY} ${pDist}`)
      this.portalRoot.setAttribute('scale', {
        x: portalScale.x, y: startScaleY, z: portalScale.z,
      })

      applyClip()
      const onModelLoaded = () => applyClip()
      this.portalRoot.querySelectorAll('[gltf-model]').forEach((el) => {
        el.addEventListener('model-loaded', onModelLoaded)
      })
      const onObject3dSet = () => applyClip()
      this.portalRoot.addEventListener('object3dset', onObject3dSet)
      this.portalRoot.querySelectorAll('*').forEach((el) => {
        el.addEventListener('object3dset', onObject3dSet)
      })

      if (portalStencilMask) portalStencilMask.setAttribute('visible', 'true')
      if (portalWindow) portalWindow.setAttribute('visible', 'true')

      // ── Custom rAF animation ─────────────────────────────────────────
      const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      const easeOutElastic = (t) => {
        if (t === 0 || t === 1) return t
        const c = (2 * Math.PI) / 3
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1
      }

      const portalObj = this.portalRoot.object3D
      let startTime = -1

      const tick = (time) => {
        if (startTime < 0) startTime = time
        const elapsed = time - startTime
        const t = Math.min(elapsed / dur, 1)

        // Scale: squash-and-stretch — decompress during the last 60 % of the rise
        const scaleT = Math.max(0, (t - 0.4) / 0.6)
        const scaleY = scaleT > 0
          ? startScaleY + (portalScale.y - startScaleY) * easeOutElastic(Math.min(scaleT, 1))
          : startScaleY
        portalObj.scale.y = scaleY

        // Position: model base rises with a smooth cubic; root Y is derived from the
        // live scale.y so the base stays planted on the floor regardless of the squash.
        const baseY = baseStart + (baseEnd - baseStart) * easeInOutCubic(t)
        portalObj.position.y = rootYFor(baseY, scaleY)
        portalObj.position.z = pDist

        if (t < 1) {
          requestAnimationFrame(tick)
          return
        }

        // ── Animation finished — snap & cleanup ──────────────────────
        portalObj.position.set(0, targetRootY, pDist)
        portalObj.scale.set(portalScale.x, portalScale.y, portalScale.z)
        this.portalRoot.setAttribute('position', `0 ${targetRootY} ${pDist}`)
        this.portalRoot.setAttribute('scale', portalScale)

        removeClip()
        this.portalRoot.removeAttribute('data-rising')

        // Small pause then open doors
        const doorsTarget = this.portalRoot.querySelector('#elevator-doors') || this.portalRoot.querySelector('#portalRim')
        if (doorsTarget) setTimeout(() => doorsTarget.emit('doors-open'), 600)

        if (portalCam) portalCam._stencilReady = false

        this.portalRoot.querySelectorAll('[gltf-model]').forEach((el) => {
          el.removeEventListener('model-loaded', onModelLoaded)
        })
        this.portalRoot.removeEventListener('object3dset', onObject3dSet)
        this.portalRoot.querySelectorAll('*').forEach((el) => {
          el.removeEventListener('object3dset', onObject3dSet)
        })
      }

      // Kick off after 2 frames so shader compilation from applyClip()
      // finishes before any movement starts.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(tick)
        })
      })
    }

    // ── Recenter handler: always returns to INITIAL with animation ────
    const handleClickEvent = (e) => {
      if (!e.touches || e.touches.length < 2) {
        recenterBtn.classList.add('pulse-once')

        sceneEl.emit('recenter')
        playRiseAnimation()

        setTimeout(() => {
          recenterBtn.classList.remove('pulse-once')
        }, 200)
      }
    }

    // ── First placement (triggered by place-portal button)
    const handlePlacement = () => {
      sceneEl.emit('recenter')
      sceneEl.emit('dismissPrompt')
      const overlay = document.getElementById('overlay')
      if (overlay) overlay.style.display = 'block'

      playRiseAnimation()

      sceneEl.removeEventListener('place-portal', handlePlacement)
      recenterBtn.addEventListener('click', handleClickEvent, true)
    }

    sceneEl.addEventListener('place-portal', handlePlacement)

    // ── Re-arm for variant switching ─────────────────────────────────
    sceneEl.addEventListener('portal-reset', () => {
      sceneEl.removeEventListener('place-portal', handlePlacement)
      recenterBtn.removeEventListener('click', handleClickEvent, true)

      const reArmedPlacement = () => {
        sceneEl.emit('recenter')
        sceneEl.emit('dismissPrompt')
        playRiseAnimation()
        sceneEl.removeEventListener('place-portal', reArmedPlacement)
        recenterBtn.addEventListener('click', handleClickEvent, true)
      }
      sceneEl.addEventListener('place-portal', reArmedPlacement)
    })
  },
}

export {tapToPlacePortalComponent}
