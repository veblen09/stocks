import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const devHtmlTemplate = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="머니트랙: 1980년 말부터 2025년 말까지 실제 시장 데이터로 경험하는 45년 한·미 주식투자 실험실" />
    <meta name="theme-color" content="#f4f7fb" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="머니트랙" />

    <link rel="manifest" href="./manifest.json" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="apple-touch-icon" href="./favicon.svg" />
    <title>머니트랙: 45년 한·미 주식투자 실험실</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

function standaloneHtmlPlugin() {
  return {
    name: 'standalone-html-manager',
    // In dev mode or before bundling, feed the dev HTML template so Vite always knows entry is /src/main.tsx
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string, ctx: any) {
        if (ctx.server || ctx.bundle === undefined) {
          return devHtmlTemplate
        }
        return html
      }
    },
    closeBundle() {
      try {
        const distHtml = path.resolve(__dirname, 'dist/index.html')
        const rootHtml = path.resolve(__dirname, 'index.html')
        if (fs.existsSync(distHtml)) {
          fs.copyFileSync(distHtml, rootHtml)
          console.log('[standaloneHtmlPlugin] Copied dist/index.html to root index.html')
        }
      } catch (err) {
        console.error('[standaloneHtmlPlugin] Failed to sync index.html:', err)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    standaloneHtmlPlugin(),
    react(),
    tailwindcss(),
    viteSingleFile()
  ],
  server: {
    allowedHosts: true
  },
  preview: {
    allowedHosts: true
  }
})

