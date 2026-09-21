import { X509Certificate, randomUUID } from 'node:crypto'
import { lstat, open, readFile, readdir, rename, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const MAX_STATE_BYTES = 1024 * 1024
const MAX_RESPONSE_BYTES = 64 * 1024
const FETCH_TIMEOUT_MS = 5000
const DEVICE_STATE_NAME = /^device_[a-zA-Z0-9_-]+\.json$/

export function certificateUrl(apiServer) {
  if (typeof apiServer !== 'string') throw new Error('Invalid API URL')
  const url = new URL(apiServer)
  const host = url.hostname.toLowerCase()
  if (
    url.protocol !== 'https:' ||
    (url.port !== '' && url.port !== '443') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    !host.endsWith('.lgthinq.com')
  ) {
    throw new Error('Untrusted API URL')
  }
  url.pathname = '/route/certificate'
  url.searchParams.set('name', 'aws-iot')
  return url
}

export function validateCaPem(pem) {
  if (typeof pem !== 'string' || pem.length > MAX_RESPONSE_BYTES) throw new Error('Invalid CA certificate')
  const certificates = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)
  if (!certificates || certificates.length === 0 || certificates.length > 8) {
    throw new Error('Invalid CA certificate')
  }
  if (pem.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim()) {
    throw new Error('Unexpected certificate data')
  }
  const now = Date.now()
  for (const certificate of certificates) {
    const parsed = new X509Certificate(certificate)
    if (!parsed.ca || Date.parse(parsed.validFrom) > now || Date.parse(parsed.validTo) < now) {
      throw new Error('Certificate is not a valid CA')
    }
  }
  return pem.trim() + '\n'
}

async function limitedText(response) {
  const declaredSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredSize) && declaredSize > MAX_RESPONSE_BYTES) {
    throw new Error('Certificate response too large')
  }
  if (!response.body) throw new Error('Empty certificate response')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_RESPONSE_BYTES) throw new Error('Certificate response too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function fetchRegionalCa(apiServer, fetchImpl = fetch) {
  const url = certificateUrl(apiServer)
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error('Certificate API request failed')
  const payload = JSON.parse(await limitedText(response))
  if (payload?.resultCode !== '0000') throw new Error('Certificate API rejected request')
  return validateCaPem(payload.result?.certificatePem)
}

export async function migrateStateFile(filePath, fetchImpl = fetch) {
  const file = await lstat(filePath)
  if (!file.isFile() || file.size > MAX_STATE_BYTES) return 'skipped'

  const original = await readFile(filePath, 'utf8')
  const state = JSON.parse(original)
  if (!state || typeof state !== 'object' || Array.isArray(state)) return 'skipped'
  if (typeof state.apiServer !== 'string' || typeof state.caCertificate !== 'string') return 'skipped'

  const caCertificate = await fetchRegionalCa(state.apiServer, fetchImpl)
  if (state.caCertificate.trim() === caCertificate.trim()) return 'unchanged'

  // Keep a separate rollback point for every future CA rotation. Exclusive
  // creation refuses existing paths or symlinks; never overwrite a backup.
  const backupPath = `${filePath}.before-region-ca.${Date.now()}-${randomUUID()}.bak`
  await writeAndSyncUnique(backupPath, original)

  const tempPath = `${filePath}.${randomUUID()}.tmp`
  try {
    await writeAndSyncUnique(tempPath, JSON.stringify({ ...state, caCertificate }))
    await rename(tempPath, filePath)
  } finally {
    await unlink(tempPath).catch(() => {})
  }
  return 'updated'
}

async function writeAndSyncUnique(filePath, contents) {
  const file = await open(filePath, 'wx', 0o600)
  try {
    await file.writeFile(contents, 'utf8')
    await file.sync()
  } finally {
    await file.close()
  }
}

function failureClass(error) {
  const code = error?.cause?.code || error?.code
  if (typeof code === 'string' && /^(SELF_SIGNED_CERT_IN_CHAIN|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE|CERT_)/.test(code)) {
    return 'tls'
  }
  if (error instanceof TypeError) return 'network'
  if (error instanceof SyntaxError) return 'response'
  return 'validation-or-file'
}

export async function migrateStateDirectory(stateDir, fetchImpl = fetch) {
  const names = (await readdir(stateDir)).filter((name) => DEVICE_STATE_NAME.test(name))
  const results = await Promise.all(
    names.map(async (name) => {
      try {
        return await migrateStateFile(resolve(stateDir, name), fetchImpl)
      } catch (error) {
        return `failed:${failureClass(error)}`
      }
    }),
  )
  const summary = Object.fromEntries(
    ['updated', 'unchanged', 'skipped', 'failed'].map((status) => [
      status,
      results.filter((result) => result === status || result.startsWith(`${status}:`)).length,
    ]),
  )
  summary.failureClasses = Object.fromEntries(
    ['tls', 'network', 'response', 'validation-or-file'].map((kind) => [
      kind,
      results.filter((result) => result === `failed:${kind}`).length,
    ]),
  )
  return summary
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const summary = await migrateStateDirectory(process.argv[2] || '/data/state')
    console.log(
      `Bridge CA migration: ${summary.updated} updated, ${summary.unchanged} unchanged, ` +
        `${summary.skipped} skipped, ${summary.failed} failed`,
    )
    if (summary.failed) console.warn(`Bridge CA migration failure classes: ${JSON.stringify(summary.failureClasses)}`)
  } catch {
    console.warn('Bridge CA migration could not read state; local server will still start')
  }
}
