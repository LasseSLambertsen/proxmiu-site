import { randomUUID } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repository = 'https://github.com/LasseSLambertsen/proxmiu.git'
export const publicFiles = ['index.html', 'styles.css', 'app.js', 'lynx-easter-egg.js', 'logo.png', 'logo.svg', 'favicon.svg', 'apple-touch-icon.png', 'robots.txt', 'sitemap.xml', 'LICENSE']
const assetTypes = new Set(['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.ico', '.woff', '.woff2'])

export async function readPin(root) {
  const pin = JSON.parse(await readFile(join(root, 'demo-source.json'), 'utf8'))
  if (!pin || Array.isArray(pin) || Object.keys(pin).sort().join(',') !== 'commit,repository,version') throw new Error('Invalid demo source pin fields')
  if (pin.version !== 1) throw new Error('Unsupported demo source pin version')
  if (pin.repository !== repository) throw new Error('Demo repository must be the fixed public Proxmiu repository')
  if (typeof pin.commit !== 'string' || !/^[a-f0-9]{40}$/.test(pin.commit)) throw new Error('Demo commit must be a full immutable SHA')
  return pin
}

function git(source, args) {
  return execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
export async function validateSource(source, pin) {
  if (git(source, ['rev-parse', 'HEAD']) !== pin.commit) throw new Error('Local app commit does not match the demo source pin')
  if (git(source, ['status', '--porcelain', '--untracked-files=normal'])) throw new Error('Demo source must be a clean checkout, without uncommitted files')
}
function npm(source, args) {
  // Only fixed npm arguments reach the Windows command shim; no user text is interpolated.
  const windows = process.platform === 'win32'
  const result = spawnSync(windows ? 'npm.cmd' : 'npm', args, { cwd: source, stdio: 'inherit', shell: windows })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Demo npm ${args[0]} failed (${result.status ?? 'no status'})`)
}
async function plainFile(source, destination) {
  const stat = await lstat(source)
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unexpected non-file in public artifact')
  await copyFile(source, destination)
}
async function assetTree(source, destination) {
  const stat = await lstat(source)
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unexpected directory in public artifact')
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error('Unexpected hidden file or symlink in public artifact')
    const input = join(source, entry.name), output = join(destination, entry.name)
    if (entry.isDirectory()) await assetTree(input, output)
    else {
      if (!assetTypes.has(extname(entry.name).toLowerCase())) throw new Error(`Unsupported public artifact type: ${extname(entry.name)}`)
      await plainFile(input, output)
    }
  }
}

export async function buildSite({ root, source, buildDemo = async () => npm(source, ['run', 'build:demo']) }) {
  const pin = await readPin(root)
  await validateSource(source, pin)
  const stage = await mkdtemp(join(root, '.site-stage-'))
  const output = join(root, 'dist'), backup = join(root, `.site-backup-${randomUUID()}`)
  let previous = false, activated = false
  try {
    for (const file of publicFiles) await plainFile(join(root, file), join(stage, file))
    await assetTree(join(root, 'screenshots'), join(stage, 'screenshots'))
    await buildDemo()
    const artifact = join(source, 'dist', 'demo')
    for (const entry of await readdir(artifact)) if (!['index.html', 'assets'].includes(entry)) throw new Error(`Unexpected demo artifact: ${entry}`)
    await mkdir(join(stage, 'demo'))
    await plainFile(join(artifact, 'index.html'), join(stage, 'demo', 'index.html'))
    await assetTree(join(artifact, 'assets'), join(stage, 'demo', 'assets'))
    await writeFile(join(stage, 'demo', 'build.json'), JSON.stringify(pin, null, 2) + '\n')
    try { await rename(output, backup); previous = true } catch (error) { if (error.code !== 'ENOENT') throw error }
    try { await rename(stage, output); activated = true } catch (error) {
      if (previous) { await rename(backup, output); previous = false }
      throw error
    }
    console.log(`Staged website with demo source ${pin.commit}`)
    return output
  } finally {
    await rm(stage, { recursive: true, force: true })
    if (activated && previous) await rm(backup, { recursive: true, force: true })
  }
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--source')) throw new Error('Usage: node scripts/build.mjs [--source <clean pinned app checkout>]')
  const pin = await readPin(root)
  let scratch
  try {
    let source
    if (args.length) source = resolve(args[1])
    else {
      scratch = await mkdtemp(join(tmpdir(), 'proxmiu-demo-source-'))
      source = scratch
      git(source, ['init', '--quiet'])
      git(source, ['remote', 'add', 'origin', repository])
      git(source, ['fetch', '--quiet', '--depth=1', 'origin', pin.commit])
      git(source, ['checkout', '--quiet', '--detach', 'FETCH_HEAD'])
      await validateSource(source, pin)
      npm(source, ['ci'])
    }
    await buildSite({ root, source })
  } finally { if (scratch) await rm(scratch, { recursive: true, force: true }) }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
