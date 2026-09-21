import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  certificateUrl,
  fetchRegionalCa,
  migrateStateDirectory,
  migrateStateFile,
  validateCaPem,
} from '../migrate-bridge-ca.mjs'

const fixtureDir = await mkdtemp(join(tmpdir(), 'rethink-ca-test-'))
const certPath = join(fixtureDir, 'ca.pem')
const keyPath = join(fixtureDir, 'ca.key')
const generated = spawnSync(
  'openssl',
  [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
    '-subj', '/CN=Test Root CA', '-addext', 'basicConstraints=critical,CA:TRUE',
    '-keyout', keyPath, '-out', certPath,
  ],
  { encoding: 'utf8' },
)
if (generated.status !== 0) throw new Error(`Could not create test CA: ${generated.stderr}`)
const testCa = await readFile(certPath, 'utf8')
const secondCertPath = join(fixtureDir, 'ca2.pem')
const secondCa = spawnSync(
  'openssl',
  [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
    '-subj', '/CN=Second Test Root CA', '-addext', 'basicConstraints=critical,CA:TRUE',
    '-keyout', join(fixtureDir, 'ca2.key'), '-out', secondCertPath,
  ],
  { encoding: 'utf8' },
)
if (secondCa.status !== 0) throw new Error(`Could not create second test CA: ${secondCa.stderr}`)
const rotatedCa = await readFile(secondCertPath, 'utf8')
const leafCertPath = join(fixtureDir, 'leaf.pem')
const leaf = spawnSync(
  'openssl',
  [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
    '-subj', '/CN=Not a CA', '-addext', 'basicConstraints=critical,CA:FALSE',
    '-keyout', join(fixtureDir, 'leaf.key'), '-out', leafCertPath,
  ],
  { encoding: 'utf8' },
)
if (leaf.status !== 0) throw new Error(`Could not create leaf certificate: ${leaf.stderr}`)
const leafCert = await readFile(leafCertPath, 'utf8')

test.after(async () => {
  await rm(fixtureDir, { recursive: true, force: true })
})

function certificateResponse(certificatePem = testCa, resultCode = '0000') {
  return new Response(JSON.stringify({ resultCode, result: { certificatePem } }), {
    headers: { 'content-type': 'application/json' },
  })
}

test('regional certificate URL is HTTPS on an LG host', () => {
  assert.equal(
    certificateUrl('https://api.eu.lgthinq.com').href,
    'https://api.eu.lgthinq.com/route/certificate?name=aws-iot',
  )
  assert.equal(
    certificateUrl('https://ruic-common.lgthinq.com:443').href,
    'https://ruic-common.lgthinq.com/route/certificate?name=aws-iot',
  )
  for (const url of [
    'http://api.eu.lgthinq.com',
    'https://lgthinq.com.evil.test',
    'https://127.0.0.1',
    'https://api.eu.lgthinq.com:1234',
    'https://api.eu.lgthinq.com:46030',
    'https://user:pass@api.eu.lgthinq.com',
    'https://api.eu.lgthinq.com/other',
    'https://api.eu.lgthinq.com?next=evil',
    'https://api.eu.lgthinq.com#fragment',
  ]) {
    assert.throws(() => certificateUrl(url), { message: /URL/ })
  }
})

test('fetch accepts only valid CA from the regional API with TLS defaults', async () => {
  let called = false
  const cert = await fetchRegionalCa('https://api.eu.lgthinq.com', (url, options) => {
    called = true
    assert.equal(url.hostname, 'api.eu.lgthinq.com')
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.accept, 'application/json')
    assert.ok(options.signal)
    assert.equal(options.agent, undefined)
    return Promise.resolve(certificateResponse())
  })
  assert.ok(called)
  assert.equal(cert, testCa.trim() + '\n')
  assert.equal(validateCaPem(testCa), cert)
  await assert.rejects(fetchRegionalCa('https://api.eu.lgthinq.com', () => Promise.resolve(certificateResponse(testCa, '9999'))))
  await assert.rejects(fetchRegionalCa('https://api.eu.lgthinq.com', () => Promise.resolve(certificateResponse('not PEM'))))
  await assert.rejects(fetchRegionalCa('https://api.eu.lgthinq.com', () => Promise.resolve(certificateResponse(leafCert))))
  await assert.rejects(fetchRegionalCa('https://api.eu.lgthinq.com', () => Promise.resolve(new Response('x'.repeat(65537)))))
  await assert.rejects(fetchRegionalCa('https://api.eu.lgthinq.com', () => Promise.reject(new Error('TLS failed'))))
})

test('migration backs up and atomically changes only CA, then stays idempotent', async () => {
  const statePath = join(fixtureDir, 'device_abc123.json')
  const state = {
    countryCode: 'RU',
    apiServer: 'https://api.eu.lgthinq.com',
    mqttServer: 'ssl://mqtt.eu.lgthinq.com:8883',
    caCertificate: 'old CA',
    privateKey: 'secret private key',
    certificate: 'client certificate',
    pubTopic: 'publish',
    provTopic: 'provision',
    subTopic: 'subscribe',
  }
  const original = JSON.stringify(state)
  await writeFile(statePath, original)
  const fetchMock = () => Promise.resolve(certificateResponse())

  assert.equal(await migrateStateFile(statePath, fetchMock), 'updated')
  assert.deepEqual(JSON.parse(await readFile(statePath, 'utf8')), {
    ...state,
    caCertificate: testCa.trim() + '\n',
  })
  const backupName = (await readdir(fixtureDir)).find((name) => name.startsWith('device_abc123.json.before-region-ca.'))
  assert.ok(backupName)
  const backupPath = join(fixtureDir, backupName)
  assert.equal(await readFile(backupPath, 'utf8'), original)
  assert.equal((await stat(backupPath)).mode & 0o777, 0o600)
  assert.equal(await migrateStateFile(statePath, fetchMock), 'unchanged')
  assert.equal(await readFile(backupPath, 'utf8'), original)
  assert.equal((await readdir(fixtureDir)).filter((name) => name.startsWith('device_abc123.json.before-region-ca.')).length, 1)
  assert.deepEqual((await readdir(fixtureDir)).filter((name) => name.endsWith('.tmp')), [])

  assert.equal(await migrateStateFile(statePath, () => Promise.resolve(certificateResponse(rotatedCa))), 'updated')
  const backups = (await readdir(fixtureDir)).filter((name) => name.startsWith('device_abc123.json.before-region-ca.'))
  assert.equal(backups.length, 2)
  assert.ok(backups.some((name) => name !== backupName))
  assert.equal(await readFile(backupPath, 'utf8'), original)
  assert.equal(JSON.parse(await readFile(statePath, 'utf8')).caCertificate, rotatedCa.trim() + '\n')
})

test('bad TLS or API response leaves state and backup untouched', async () => {
  const statePath = join(fixtureDir, 'device_nochange.json')
  const original = JSON.stringify({
    apiServer: 'https://api.eu.lgthinq.com',
    caCertificate: 'old CA',
    privateKey: 'keep me',
  })
  await writeFile(statePath, original)

  const result = await migrateStateDirectory(fixtureDir, () => Promise.reject(new Error('TLS failed')))
  assert.ok(result.failed >= 1)
  assert.equal(await readFile(statePath, 'utf8'), original)
  assert.ok(!(await readdir(fixtureDir)).some((name) => name.startsWith('device_nochange.json.before-region-ca.')))
})
