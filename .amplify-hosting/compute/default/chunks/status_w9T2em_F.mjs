import { c as createComponent } from './astro-component_CtXFmZVC.mjs';
import 'piccolore';
import { i as createRenderInstruction, r as renderTemplate, f as addAttribute, j as renderComponent, k as renderHead } from '../entry.mjs';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Status = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Status;
  const host = Astro2.request.headers.get("host") || "unknown";
  const hostConfig = {
    "topoberriagertuago.topo.localhost:4321": { lang: "eu" },
    "nuevotopomascerca.topo.localhost:4321": { lang: "es" }
  };
  const config = hostConfig[host] || { lang: "es" };
  Astro2.response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return renderTemplate(_a || (_a = __template(["<html", '> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TOPO portal (', "</title>", "</head>) <!-- A-Frame and dependencies MUST be in head before scene --> ", ' <script src="https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js" crossorigin="anonymous" data-preload-chunks="slam"><\/script> <script src="https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js" crossorigin="anonymous"><\/script> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Contrail+One&display=swap" rel="stylesheet"> <body> <div id="loading-screen"></div> <div id="crosshair"></div> <div id="transition-overlay"></div> <div id="experience-hud"><span id="zone-label">Andén</span></div> <div id="overlay" style="display:none" class="absolute-fill"> <img id="recenterButton" src="assets/textures/recenter.png"> <button id="gridToggleBtn" class="grid-btn">GRID</button> </div> ', " <script", "><\/script> </body> </html>"])), addAttribute(config.lang, "lang"), config.lang, renderHead(), renderScript($$result, "/home/ashe/apps/apachestudio.com/test-dual-domain/src/pages/status.astro?astro&type=script&index=0&lang.ts"), renderComponent($$result, "a-scene", "a-scene", { "preloader": true, "responsive-immersive": true, "intro-flow": true, "debug-grid": true, "surface-quality": true, "variant-selector": true, "tap-to-place-portal": true, "station-manager": true, "portal-ground-effect": true, "vr-mode-ui": "enabled: false", "xrextras-loading": true, "xrextras-runtime-error": true, "renderer": "colorManagement: true;", "xrweb": "allowedDevices: any; disableDefaultEnvironment: true;" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-assets", "a-assets", {}, { "default": () => renderTemplate` ${renderComponent($$result, "a-asset-item", "a-asset-item", { "id": "portal-frame-model", "src": "assets/models/Portal_frame.glb" })} ${renderComponent($$result, "a-asset-item", "a-asset-item", { "id": "portal-door-01-model", "src": "assets/models/Portal_Door_01.glb" })} ${renderComponent($$result, "a-asset-item", "a-asset-item", { "id": "portal-door-02-model", "src": "assets/models/Portal_Door_02.glb" })} <img id="station-360-img" src="assets/textures/station-360.jpg"> <img id="exit-a-360-img" src="assets/textures/exit-a-360.jpg"> <img id="portal-glow-img" src="assets/textures/portal-glow.png"> <img id="icon-plus" src="assets/images/Plus.svg"> <img id="icon-aspa" src="assets/images/aspa.svg"> ` })} ${renderComponent($$result, "a-camera", "a-camera", { "id": "camera", "portal-camera": true, "position": "0 9 11" })} ${renderComponent($$result, "xrextras-opaque-background", "xrextras-opaque-background", { "remove": "true" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-entity", "a-entity", { "id": "hider-walls" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-box", "a-box", { "scale": "100 1 100", "position": "0 -1 49", "xrextras-hider-material": true })} ${renderComponent($$result, "a-box", "a-box", { "scale": "100 100 1", "position": "0 50 75", "xrextras-hider-material": true })} ${renderComponent($$result, "a-box", "a-box", { "scale": "100 1 100", "position": "0 100 49", "xrextras-hider-material": true })} ${renderComponent($$result, "a-box", "a-box", { "scale": "1 100 100", "position": "-30 50 50", "xrextras-hider-material": true })} ${renderComponent($$result, "a-box", "a-box", { "scale": "1 100 100", "position": "30 50 50", "xrextras-hider-material": true })} ` })} ` })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "directional-light", "light": "\n      type: directional;\n      intensity: 0.2;\n      castShadow: true;\n      shadowMapHeight:2048;\n      shadowMapWidth:2048;\n      shadowCameraTop: 35;\n      shadowCameraBottom: -20;\n      shadowCameraRight: 40;\n      shadowCameraLeft: -10;\n      target: #portalRim", "xrextras-attach": "target: portalRim; offset: 18 7 14", "shadow": true })} ${renderComponent($$result, "a-light", "a-light", { "id": "secondary-light", "type": "hemisphere", "color": "#CEE4F0", "groundColor": "#332211", "intensity": "0.8" })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "portal-contents" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-sky", "a-sky", { "src": "#station-360-img", "rotation": "0 -90 0" })} ${renderComponent($$result, "a-entity", "a-entity", { "data-station": "station-entrance", "hotspot": "key: 0", "position": "0 10 -40" })} ${renderComponent($$result, "a-entity", "a-entity", { "data-station": "station-entrance", "hotspot": "key: 1", "position": "20 6 -35" })} ${renderComponent($$result, "a-entity", "a-entity", { "data-station": "station-entrance", "hotspot": "key: 2", "position": "-25 8 -30" })} ` })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "portal-root", "scale": "1.4 1.4 1.4", "visible": "false" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-plane", "a-plane", { "id": "portal-stencil-mask", "width": "3.4", "height": "8.51", "position": "0 6.71 0.05", "material": "shader: flat; color: #000", "visible": "false" })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "portal-window", "geometry": "primitive: sphere; radius: 50; segmentsWidth: 64; segmentsHeight: 32", "material": "shader: flat; src: #station-360-img; side: back", "position": "0 0 0", "rotation": "0 -90 0", "scale": "-1 1 1", "visible": "false" })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "portal-wall" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-plane", "a-plane", { "width": "7", "height": "14", "rotation": "0 180 0", "position": "0 6.71 0", "xrextras-hider-material": true })} ${renderComponent($$result, "a-plane", "a-plane", { "width": "7", "height": "14", "rotation": "0 180 0", "position": "0 6.71 0.3", "xrextras-hider-material": true })} ` })} ${renderComponent($$result, "a-plane", "a-plane", { "id": "portal-glow", "width": "3.4", "height": "8.51", "position": "0 6.71 0", "material": "shader: flat; src: #portal-glow-img; transparent: true; depthWrite: false; blending: additive; side: double" })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "elevator-doors", "elevator-doors": "width: 0; openOffset: 1.7; clipHalfWidth: 1.7", "position": "0 2.45 0" }, { "default": () => renderTemplate` ${renderComponent($$result, "a-entity", "a-entity", { "id": "door-left", "gltf-model": "#portal-door-01-model", "scale": "4.3 4.3 4.3" })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "door-right", "gltf-model": "#portal-door-02-model", "scale": "4.3 4.3 4.3" })} ` })} ${renderComponent($$result, "a-entity", "a-entity", { "id": "portalRim", "gltf-model": "#portal-frame-model", "reflections": "type: realtime", "position": "0 2.45 0", "rotation": "0 0 0", "scale": "4.3 4.3 4.3", "shadow": "receive: false" })} ` })} ` }), addAttribute(`/bundle.${config.lang}.js`, "src"));
}, "/home/ashe/apps/apachestudio.com/test-dual-domain/src/pages/status.astro", void 0);

const $$file = "/home/ashe/apps/apachestudio.com/test-dual-domain/src/pages/status.astro";
const $$url = "/status";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Status,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
