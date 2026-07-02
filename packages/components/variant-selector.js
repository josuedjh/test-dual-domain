// ── Portal auto-placement trigger ──────────────────────────────────────────
// After environment-check passes, refreshes component refs and auto-places
// the single portal variant defined statically in index.html.

const variantSelectorComponent = {
  init() {
    this.el.sceneEl.addEventListener('environment-ok', () => {
      this._refreshComponentRefs()
      this._refreshLightTracking()
      this.el.sceneEl.emit('variant-selected')
      this.el.sceneEl.emit('portal-reset')
      setTimeout(() => {
        this.el.sceneEl.emit('place-portal')
      }, 0)
    })
  },

  _refreshLightTracking() {
    const dirLight = document.getElementById('directional-light')
    if (!dirLight) return
    if (dirLight.hasAttribute('xrextras-attach')) {
      dirLight.removeAttribute('xrextras-attach')
      setTimeout(() => {
        dirLight.setAttribute('xrextras-attach', 'target: portalRim; offset: 18 7 14')
      }, 0)
    }
  },

  _refreshComponentRefs() {
    const cam = document.getElementById('camera')
    if (cam && cam.components['portal-camera']) {
      const pc = cam.components['portal-camera']
      pc.portalWall = document.getElementById('portal-wall')
      pc.stencilMask = document.getElementById('portal-stencil-mask')
      pc.portalWindow = document.getElementById('portal-window')
      pc._spawnPos = null
      pc._spawnScale = null
      pc._stencilReady = false
      pc.resetToInitial()
    }
    this.el.sceneEl.emit('portal-refs-changed')
  },
}

export {variantSelectorComponent}
