// Fondo diagonal compartido (bandas full-bleed).
// Lo usan el intro flow (scanning-hud + overlay de instrucciones) y el panel
// "Cambiar vista" del station-manager — debe ser EXACTAMENTE el mismo SVG en
// ambos para garantizar alineamiento pixel-perfect.
//
// viewBox extendido a "-2000 -600 5614 2009": geometría del Figma (1614×809) +
// márgenes planos (Mx=2000 lados, My=600 arriba/abajo) para que las bandas hagan
// full-bleed en cualquier aspect ratio. La diagonal del diseño se conserva;
// band-0 prolonga su diagonal hacia arriba (vértice 1256.8,-600 sobre la misma
// recta 864.512,56 → 898,0) y el rect inferior se alarga hacia abajo.
// Anclaje/recortes se calculan en index.css (.instr-union). NO editar estas
// coordenadas sin recalcular los clips del CSS.
export const PORTAL_BG_SVG = `<svg class="instr-union" viewBox="-2000 -600 5614 2009" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M-2000 -600H1256.8L864.512 56H-2000Z" fill="white" fill-opacity="0.83"/><path d="M863.291 56L838 112H3614V56H863.291Z" fill="white" fill-opacity="0.83"/><path d="M-2000 112V168H806.749L838 112H-2000Z" fill="white" fill-opacity="0.83"/><path d="M807.182 168L780 224H3614V168H807.182Z" fill="white" fill-opacity="0.83"/><path d="M-2000 224V280H750.912L780 224H-2000Z" fill="white" fill-opacity="0.83"/><path d="M751.072 280L722 336H3614V280H751.072Z" fill="white" fill-opacity="0.83"/><rect x="-2000" y="336" width="5614" height="1073" fill="white" fill-opacity="0.83"/></svg>`
