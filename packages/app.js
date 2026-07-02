// Copyright (c) 2023 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './index.css'
import T from './shared/i18n'
import {responsiveImmersiveComponent} from './components/responsive-immersive'
import {portalCameraComponent} from './components/portal-camera'
import {tapToPlacePortalComponent} from './components/tap-to-place'
import {hotspotComponent, stationManagerComponent} from './components/hotspot-station'
import {elevatorDoorsComponent} from './components/elevator-doors'
import {portalGroundEffectComponent} from './components/portal-ground-effect'
import {introFlowComponent} from './components/intro-flow'
import {debugGridComponent} from './components/debug-grid'
import {surfaceQualityComponent} from './components/surface-quality'
import {variantSelectorComponent} from './components/variant-selector'
import {preloaderComponent} from './components/preloader'

// Metadatos de página según el idioma activo (i18n).
document.title = T.meta.title
document.documentElement.lang = T.meta.lang

AFRAME.registerComponent('portal-camera', portalCameraComponent)

AFRAME.registerComponent('tap-to-place-portal', tapToPlacePortalComponent)

AFRAME.registerComponent('responsive-immersive', responsiveImmersiveComponent)
AFRAME.registerComponent('hotspot', hotspotComponent)
AFRAME.registerComponent('intro-flow', introFlowComponent)
AFRAME.registerComponent('debug-grid', debugGridComponent)
AFRAME.registerComponent('surface-quality', surfaceQualityComponent)
AFRAME.registerComponent('elevator-doors', elevatorDoorsComponent)
AFRAME.registerComponent('variant-selector', variantSelectorComponent)
AFRAME.registerComponent('station-manager', stationManagerComponent)
AFRAME.registerComponent('preloader', preloaderComponent)
AFRAME.registerComponent('portal-ground-effect', portalGroundEffectComponent)
