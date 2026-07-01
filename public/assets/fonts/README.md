# Fuentes — Founders Grotesk

La tipografía del diseño (Figma "Font Principal") es **Founders Grotesk**, de
[Klim Type Foundry](https://klim.co.nz/retail-fonts/founders-grotesk/). Es una
fuente **comercial**: no está en Google Fonts y no puede descargarse desde Figma.

## Qué pedir al cliente (Euskotren / equipo de diseño)

Los archivos **webfont** (`.woff2`, idealmente también `.woff`) de estos dos cortes:

- Founders Grotesk **Regular** (peso 400)
- Founders Grotesk **Bold** (peso 700)

Asegúrate de que la licencia cubra **uso web** (webfont license).

## Cómo nombrarlos

Coloca los archivos en esta misma carpeta con estos nombres exactos (es lo que
espera el `@font-face` de `index.css`):

```
assets/fonts/
  FoundersGrotesk-Regular.woff2   (y opcional .woff)
  FoundersGrotesk-Bold.woff2      (y opcional .woff)
```

En cuanto estén aquí con esos nombres, toda la app los usa automáticamente. No
hay que tocar más código. Si llegan con otros nombres o formatos (p. ej. `.otf`),
solo hay que ajustar las rutas en los bloques `@font-face` del `index.css`.
