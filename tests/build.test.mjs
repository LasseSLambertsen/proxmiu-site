import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildSite, readPin, validateSource, publicFiles } from '../scripts/build.mjs'

async function fixture() {
  const scratch = await mkdtemp(join(tmpdir(), 'proxmiu-demo-build-'))
  const root = join(scratch, 'site'), source = join(scratch, 'app')
  await mkdir(root); await mkdir(source)
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '--quiet')
  await writeFile(join(source, '.gitignore'), 'dist/\n.env\nnode_modules/\n')
  await writeFile(join(source, 'source.txt'), 'Reviewed source')
  git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Fixture')
  const commit = git('rev-parse', 'HEAD')
  const pin = { version: 1, repository: 'https://github.com/LasseSLambertsen/proxmiu.git', commit }
  await writeFile(join(root, 'demo-source.json'), JSON.stringify(pin))
  for (const file of publicFiles) await writeFile(join(root, file), file === 'index.html' ? '<h1>Marketing</h1>' : 'Public fixture')
  await mkdir(join(root, 'screenshots')); await writeFile(join(root, 'screenshots', 'overview.png'), 'Picture')
  await writeFile(join(root, '.env'), 'PRIVATE_SITE_SENTINEL')
  await writeFile(join(root, 'README.md'), 'Private build notes')
  await writeFile(join(source, '.env'), 'PRIVATE_APP_SENTINEL')
  await mkdir(join(source, 'node_modules')); await writeFile(join(source, 'node_modules', 'private.js'), 'Private dependency')
  const buildDemo = async () => {
    await mkdir(join(source, 'dist', 'demo', 'assets'), { recursive: true })
    await writeFile(join(source, 'dist', 'demo', 'index.html'), '<h1>Sample data</h1><script src="/demo/assets/demo.js"></script>')
    await writeFile(join(source, 'dist', 'demo', 'assets', 'demo.js'), 'console.log("Sample only")')
  }
  return { scratch, root, source, commit, pin, buildDemo, cleanup: () => rm(scratch, { recursive: true, force: true }) }
}
async function paths(root) {
  const result = []
  for (const item of await readdir(root, { withFileTypes: true })) {
    const path = join(root, item.name)
    if (item.isDirectory()) result.push(...(await paths(path)).map(child => join(item.name, child)))
    else result.push(item.name)
  }
  return result
}

test('requires a full immutable SHA and the fixed public app repository', async () => {
  const f = await fixture()
  try {
    assert.deepEqual(await readPin(f.root), f.pin)
    for (const change of [{ commit: 'main' }, { commit: 'a'.repeat(39) }, { repository: 'https://untrusted.invalid/code.git' }, { version: 2 }, { command: 'unexpected' }]) {
      await writeFile(join(f.root, 'demo-source.json'), JSON.stringify({ ...f.pin, ...change }))
      await assert.rejects(readPin(f.root), /pin|repository|commit|version|field/i)
    }
  } finally { await f.cleanup() }
})

test('refuses mismatched or dirty local sources before the build can run', async () => {
  const f = await fixture()
  try {
    await validateSource(f.source, f.pin)
    await assert.rejects(validateSource(f.source, { ...f.pin, commit: '0'.repeat(40) }), /commit|match/i)
    await writeFile(join(f.source, 'source.txt'), 'Unreviewed change')
    let builds = 0
    await assert.rejects(buildSite({ root: f.root, source: f.source, buildDemo: async () => { builds++ } }), /clean|dirty|uncommitted/i)
    assert.equal(builds, 0)
  } finally { await f.cleanup() }
})

test('publishes only marketing allowlist and static demo assets with exact source provenance', async () => {
  const f = await fixture()
  try {
    await buildSite({ root: f.root, source: f.source, buildDemo: f.buildDemo })
    const output = join(f.root, 'dist'), files = (await paths(output)).map(path => path.replaceAll('\\', '/'))
    assert.ok(files.includes('index.html')); assert.ok(files.includes('demo/index.html')); assert.ok(files.includes('screenshots/overview.png')); assert.ok(files.includes('LICENSE'))
    assert.ok(!files.some(path => /\.env|source\.txt|node_modules|README|\.git|demo-source/.test(path)))
    assert.deepEqual(JSON.parse(await readFile(join(output, 'demo', 'build.json'), 'utf8')), { version: 1, repository: f.pin.repository, commit: f.commit })
    for (const file of files) assert.doesNotMatch(await readFile(join(output, file), 'utf8'), /PRIVATE_(SITE|APP)_SENTINEL/)
  } finally { await f.cleanup() }
})

test('failed compilation preserves the previous staged output and removes its own temporary directory', async () => {
  const f = await fixture()
  try {
    await mkdir(join(f.root, 'dist')); await writeFile(join(f.root, 'dist', 'index.html'), 'Previous complete site')
    await assert.rejects(buildSite({ root: f.root, source: f.source, buildDemo: async () => { throw new Error('Synthetic build failure') } }), /Synthetic build failure/)
    assert.equal(await readFile(join(f.root, 'dist', 'index.html'), 'utf8'), 'Previous complete site')
    assert.ok(!(await readdir(f.root)).some(name => name.startsWith('.site-stage-')))
  } finally { await f.cleanup() }
})

test('unexpected demo source, manifest or secret files fail without replacing the previous output', async () => {
  const f = await fixture()
  try {
    await mkdir(join(f.root, 'dist')); await writeFile(join(f.root, 'dist', 'index.html'), 'Previous complete site')
    for (const unexpected of ['.env', 'manifest.webmanifest', 'source.ts', 'assets/source.js.map']) {
      await rm(join(f.source, 'dist'), { recursive: true, force: true })
      await assert.rejects(buildSite({ root: f.root, source: f.source, buildDemo: async () => {
        await f.buildDemo(); await writeFile(join(f.source, 'dist', 'demo', unexpected), 'Must not publish')
      } }), /unexpected|unsupported|artifact/i)
      assert.equal(await readFile(join(f.root, 'dist', 'index.html'), 'utf8'), 'Previous complete site')
    }
  } finally { await f.cleanup() }
})
