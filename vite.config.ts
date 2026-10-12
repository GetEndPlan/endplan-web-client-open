import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

type AlgorithmPolicy = {
  keyAlgorithms?: string[]
}

const LIBOQS_DIST_ASSETS_BY_ALGORITHM: Record<string, string[]> = {
  'ML-KEM-768': ['ml-kem-768.min.js'],
}

const PDF_WORKER_ASSET_PATH = 'assets/pdf.worker.min.js'
const PDF_WORKER_REQUEST_PATH = `/${PDF_WORKER_ASSET_PATH}`

function pdfWorkerPlugin(rootDir: string): Plugin {
  const workerSourcePath = path.resolve(
    rootDir,
    'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  )

  return {
    name: 'pdf-worker-js',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url ? request.url.split('?')[0] : null
        if (requestUrl !== PDF_WORKER_REQUEST_PATH) {
          next()
          return
        }

        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.end(fs.readFileSync(workerSourcePath))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: PDF_WORKER_ASSET_PATH,
        source: fs.readFileSync(workerSourcePath),
      })
    },
  }
}

function getConfiguredLiboqsDistAssets(rootDir: string): Map<string, string> {
  const algorithmPolicyPath = path.resolve(rootDir, 'src/algorithm.json')
  const algorithmPolicy = JSON.parse(
    fs.readFileSync(algorithmPolicyPath, 'utf8'),
  ) as AlgorithmPolicy

  const assetEntries = (algorithmPolicy.keyAlgorithms ?? []).flatMap((algorithm) => {
    const fileNames = LIBOQS_DIST_ASSETS_BY_ALGORITHM[algorithm] ?? []
    return fileNames.map((fileName) => [
      `/dist/${fileName}`,
      path.resolve(rootDir, 'node_modules/@oqs/liboqs-js/dist', fileName),
    ] as const)
  })

  return new Map(assetEntries)
}

function liboqsDistAssetsPlugin(rootDir: string): Plugin {
  const assetPathsByRequestPath = getConfiguredLiboqsDistAssets(rootDir)

  return {
    name: 'liboqs-dist-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url ? request.url.split('?')[0] : null
        if (!requestUrl) {
          next()
          return
        }

        const assetPath = assetPathsByRequestPath.get(requestUrl)
        if (!assetPath) {
          next()
          return
        }

        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.end(fs.readFileSync(assetPath))
      })
    },
    generateBundle() {
      for (const [requestPath, assetPath] of assetPathsByRequestPath.entries()) {
        this.emitFile({
          type: 'asset',
          fileName: requestPath.replace(/^\//, ''),
          source: fs.readFileSync(assetPath),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sysDemoHost = env.VITE_SYS_DEMO_HOST?.trim()

  return {
    plugins: [
      react(),
      liboqsDistAssetsPlugin(__dirname),
      pdfWorkerPlugin(__dirname),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1100,
    },
    server: {
      port: 5173,
      allowedHosts: sysDemoHost ? ['localhost', sysDemoHost] : ['localhost'],
    },
  }
})
