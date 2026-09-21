import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { fileURLToPath } from 'node:url'
import { patchFilterDateSource } from '../patch-filter-date.mjs'

const script = fileURLToPath(new URL('../patch-filter-date.mjs', import.meta.url))
const compiledFixture = `
class Device {
  publishFilterData() {
    const changedDate =
      Math.floor(this.filterChangedDate / 10000).toString().padStart(4, '0') +
      '-' +
      (Math.floor(this.filterChangedDate / 100) % 100).toString().padStart(2, '0') +
      '-' +
      (this.filterChangedDate % 100).toString().padStart(2, '0');
    this.HA.publishProperty(this.id, 'filterused', this.filterUsedTime);
    this.HA.publishProperty(this.id, 'filterlife', this.filterLifeTime);
    this.HA.publishProperty(this.id, 'filterchangeddate', changedDate);
  }
}
Device
`

function publishFilterData(filterChangedDate) {
  const Device = runInNewContext(patchFilterDateSource(compiledFixture))
  const published = []
  const device = Object.create(Device.prototype)
  device.id = 'test-device'
  device.filterUsedTime = 10
  device.filterLifeTime = 20
  device.filterChangedDate = filterChangedDate
  device.HA = {
    publishProperty(id, property, value) {
      published.push({ id, property, value })
    },
  }
  device.publishFilterData()
  return published
}

test('zero filter date becomes unknown without changing the other properties', () => {
  assert.deepEqual(publishFilterData(0), [
    { id: 'test-device', property: 'filterused', value: 10 },
    { id: 'test-device', property: 'filterlife', value: 20 },
    { id: 'test-device', property: 'filterchangeddate', value: undefined },
  ])
})

test('known filter date remains unchanged', () => {
  assert.deepEqual(publishFilterData(20260922)[2], {
    id: 'test-device', property: 'filterchangeddate', value: '2026-09-22',
  })
})

test('patch fails closed if pinned compiled source changes or is already patched', () => {
  assert.throws(() => patchFilterDateSource(''), /exactly one unpatched/)
  assert.throws(() => patchFilterDateSource(compiledFixture + compiledFixture), /found 2/)
  assert.throws(() => patchFilterDateSource(patchFilterDateSource(compiledFixture)), /exactly one unpatched/)
})

test('CLI refuses to overwrite an unexpected compiled file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rethink-date-patch-test-'))
  try {
    const path = join(dir, 'device.js')
    const unexpectedSource = '/* changed upstream */\n'
    await writeFile(path, unexpectedSource)
    const failed = spawnSync(process.execPath, [script, path], { encoding: 'utf8' })
    assert.notEqual(failed.status, 0)
    assert.equal(await readFile(path, 'utf8'), unexpectedSource)

    await writeFile(path, compiledFixture)
    const patched = spawnSync(process.execPath, [script, path], { encoding: 'utf8' })
    assert.equal(patched.status, 0, patched.stderr)
    assert.equal(await readFile(path, 'utf8'), patchFilterDateSource(compiledFixture))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
