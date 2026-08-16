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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="description" content="머니트랙: 가상의 20년 동안 저축과 투자를 경험하며 자산관리의 원리를 배우는 한국 청소년용 시뮬레이션 웹앱" />
    <meta name="theme-color" content="#1e1b4b" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="머니트랙" />
    <link rel="manifest" href="./manifest.json" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="apple-touch-icon" href="./favicon.svg" />
    <title>머니트랙: 20년 자산관리 실험실</title>
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

