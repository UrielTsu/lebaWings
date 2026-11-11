<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Leba Wings

Sistema web para comandas, cocina e inventario de Leba Wings.

## Run Locally

**Prerequisites:** Node.js 18+


1. Instalar dependencias:
   `npm install`
2. Ejecutar en desarrollo:
   `npm run dev`
3. Generar la versión de producción:
   `npm run build`

## PWA

La aplicación incluye un manifest y un Service Worker para instalación y
funcionamiento básico del shell sin conexión. El Service Worker se registra
solamente en producción; para probar la instalación:

```bash
npm run build
npm run preview
```

La instalación y el Service Worker requieren HTTPS en producción (localhost es
la excepción). Los datos operativos todavía deben conectarse a la API PHP para
habilitar sincronización de comandas entre dispositivos.
