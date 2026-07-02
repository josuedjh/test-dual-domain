// Animated ground light effect displayed during the portal rise animation.
// Call playAt(x, y, z) from tap-to-place when the rise starts.
// Emits pulse rings that decelerate and fade as they expand outward.

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = `
uniform float uTime;
uniform float uFade;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uRingWidth;
varying vec2  vUv;

// Chebyshev ring — rectangular contours matching the plane's aspect ratio
float ring(float d, float center, float hw) {
  return smoothstep(center - hw, center, d)
       * (1.0 - smoothstep(center, center + hw * 0.5, d));
}

void main() {
  vec2  uv   = vUv - 0.5;
  // Rectangular (Chebyshev) distance: 0 = center, 1 = edges
  float dist = max(abs(uv.x), abs(uv.y)) * 2.0;

  // Ambient glow at the origin
  float glow = pow(max(1.0 - dist, 0.0), 2.0) * 0.35;

  // Two pulse rings, half-cycle apart for even spacing
  float raw1 = mod(uTime * uSpeed,        1.0);
  float raw2 = mod(uTime * uSpeed + 0.5,  1.0);

  // Ease-out: ring starts fast and decelerates toward the far edge (sqrt curve)
  float t1 = sqrt(raw1);
  float t2 = sqrt(raw2);

  // Alpha fades quadratically to zero at the far edge
  float r1 = ring(dist, t1, uRingWidth) * pow(1.0 - t1, 2.0);
  float r2 = ring(dist, t2, uRingWidth) * pow(1.0 - t2, 2.0);

  float brightness = glow + r1 + r2;
  gl_FragColor = vec4(uColor * 2.5, brightness * (1.0 - uFade));
}
`

const portalGroundEffectComponent = {
  schema: {
    color:     {type: 'color', default: '#38D4FF'},
    width:     {default: 18},    // plane extent in X (metres) — controls max ring radius sideways
    depth:     {default: 6},     // plane extent in Z (metres) — controls max ring radius front/back
    duration:  {default: 3500},  // total effect lifetime in ms
    ringSpeed: {default: 0.3},   // cycles per second (lower = slower/more spread out)
    ringWidth: {default: 0.02},  // ring half-width in UV space (lower = thinner)
  },

  init() {
    const col = new THREE.Color(this.data.color)

    this._uniforms = {
      uTime:      {value: 0.0},
      uFade:      {value: 1.0},
      uColor:     {value: new THREE.Vector3(col.r, col.g, col.b)},
      uSpeed:     {value: this.data.ringSpeed},
      uRingWidth: {value: this.data.ringWidth},
    }

    const geo = new THREE.PlaneGeometry(this.data.width, this.data.depth)
    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms:       this._uniforms,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
      side:           THREE.DoubleSide,
    })

    this._mesh = new THREE.Mesh(geo, mat)
    this._mesh.rotation.x = -Math.PI / 2   // lay flat on the ground
    this._mesh.renderOrder = 999
    this._mesh.visible = false
    this.el.object3D.add(this._mesh)
    this._rafId = null
  },

  // Called from environment-check during scanning — runs indefinitely until playAt() takes over
  showSteady(x, y, z) {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    this._mesh.position.set(x, y, z)
    this._mesh.visible = true
    this._uniforms.uFade.value = 0.0
    let t0 = -1
    const tick = (now) => {
      if (t0 < 0) t0 = now
      this._uniforms.uTime.value = (now - t0) / 1000.0
      this._uniforms.uFade.value = 0.0
      this._rafId = requestAnimationFrame(tick)
    }
    this._rafId = requestAnimationFrame(tick)
  },

  // Called from tap-to-place.js when the portal rise animation starts
  playAt(x, y, z) {
    // If already visible from showSteady, skip fade-in to keep the effect continuous
    const skipFadeIn = this._mesh.visible && this._uniforms.uFade.value < 0.1

    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }

    const dur = this.data.duration
    const FI  = 0.18   // fraction for fade-in (skipped when coming from showSteady)
    const FO  = 0.28   // fraction for fade-out

    this._mesh.position.set(x, y, z)
    this._mesh.visible = true
    this._uniforms.uFade.value = skipFadeIn ? 0.0 : 1.0

    let t0 = -1
    const tick = (now) => {
      if (t0 < 0) t0 = now
      const t = Math.min((now - t0) / dur, 1.0)

      let fade
      if (skipFadeIn) {
        fade = t > 1.0 - FO ? (t - (1.0 - FO)) / FO : 0.0
      } else {
        fade = t < FI
          ? 1.0 - t / FI
          : t > 1.0 - FO
            ? (t - (1.0 - FO)) / FO
            : 0.0
      }

      this._uniforms.uFade.value = fade
      this._uniforms.uTime.value = (now - t0) / 1000.0

      if (t < 1.0) {
        this._rafId = requestAnimationFrame(tick)
      } else {
        this._mesh.visible = false
        this._rafId = null
      }
    }

    this._rafId = requestAnimationFrame(tick)
  },

  remove() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    if (this._mesh) {
      this._mesh.geometry.dispose()
      this._mesh.material.dispose()
      this.el.object3D.remove(this._mesh)
    }
  },
}

export {portalGroundEffectComponent}
