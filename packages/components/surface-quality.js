// Surface quality monitor.
// Analyses camera pose jitter density to estimate surface quality.
// High-frequency micro-movements → many clustered tracking points → unstable (red).
// Smooth pose changes → clean surface → stable (green).
// Drives the debug-grid colour in real-time.

const HISTORY_SIZE = 30          // frames of delta history to keep
const JITTER_THRESHOLD = 0.12   // avg delta above this = too many tracking points (red)
const STABLE_THRESHOLD = 0.04   // avg delta below this = very clean surface (green)
const LERP_SPEED = 0.08         // colour transition smoothness

const surfaceQualityComponent = {
  init() {
    this._deltas = []
    this._lastPos = null
    this._lastTime = 0
    this._quality = 0.5  // 0 = worst (red), 1 = best (green)
    this._tmpVec = new THREE.Vector3()

    // Reusable colour objects for lerping
    this._currentColor = new THREE.Color('#ff4444')
    this._targetColor = new THREE.Color('#39FF14')
    this._redColor = new THREE.Color('#ff4444')
    this._greenColor = new THREE.Color('#39FF14')
  },

  tick(time) {
    // Sample at ~15 Hz to avoid noise from very high frame rates
    if (time - this._lastTime < 66) return
    this._lastTime = time

    const cam = this.el.sceneEl.camera
    if (!cam) return

    const pos = cam.getWorldPosition(this._tmpVec)

    if (this._lastPos) {
      const delta = pos.distanceTo(this._lastPos)
      this._deltas.push(delta)
      if (this._deltas.length > HISTORY_SIZE) {
        this._deltas.shift()
      }
    }

    if (!this._lastPos) this._lastPos = new THREE.Vector3()
    this._lastPos.copy(pos)

    if (this._deltas.length < 5) return

    // Calculate jitter metric: standard deviation of recent deltas.
    // High stddev = erratic micro-movements = dense clustered features.
    // Low stddev = smooth = clean surface.
    const avg = this._deltas.reduce((a, b) => a + b, 0) / this._deltas.length
    let variance = 0
    for (let i = 0; i < this._deltas.length; i++) {
      const diff = this._deltas[i] - avg
      variance += diff * diff
    }
    variance /= this._deltas.length
    const stddev = Math.sqrt(variance)

    // Combine avg magnitude and stddev for quality score
    const jitter = avg + stddev * 2

    // Map jitter to quality: 0 (bad) → 1 (good)
    let targetQuality
    if (jitter <= STABLE_THRESHOLD) {
      targetQuality = 1
    } else if (jitter >= JITTER_THRESHOLD) {
      targetQuality = 0
    } else {
      targetQuality = 1 - (jitter - STABLE_THRESHOLD) / (JITTER_THRESHOLD - STABLE_THRESHOLD)
    }

    // Smooth quality transitions
    this._quality += (targetQuality - this._quality) * LERP_SPEED

    // Lerp colour: red (0) → green (1)
    this._targetColor.copy(this._redColor).lerp(this._greenColor, this._quality)
    this._currentColor.lerp(this._targetColor, 0.15)

    // Apply to grid
    const grid = this.el.sceneEl.components['debug-grid']
    if (grid && grid._visible && grid._gridHelper) {
      grid._gridHelper.material.color.copy(this._currentColor)
    }
  },
}

export {surfaceQualityComponent}
