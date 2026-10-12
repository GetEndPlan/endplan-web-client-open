// Ensures libsodium-wrappers-sumo can find the sumo runtime bundles by copying
// them from the libsodium-sumo package (they are not shipped inside the wrapper).
// This script is safe to run multiple times.

import fs from 'fs'
import path from 'path'

const root = path.resolve(process.cwd())
const wrapperEsm = path.join(root, 'node_modules', 'libsodium-wrappers-sumo', 'dist', 'modules-sumo-esm')
const wrapperCjs = path.join(root, 'node_modules', 'libsodium-wrappers-sumo', 'dist', 'modules-sumo')
const sumoEsm = path.join(root, 'node_modules', 'libsodium-sumo', 'dist', 'modules-sumo-esm', 'libsodium-sumo.mjs')
const sumoCjs = path.join(root, 'node_modules', 'libsodium-sumo', 'dist', 'modules-sumo', 'libsodium-sumo.js')

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

const copyIfMissing = (from, to) => {
  if (!fs.existsSync(from)) return
  ensureDir(path.dirname(to))
  fs.copyFileSync(from, to)
}

copyIfMissing(sumoEsm, path.join(wrapperEsm, 'libsodium-sumo.mjs'))
copyIfMissing(sumoCjs, path.join(wrapperCjs, 'libsodium-sumo.js'))
