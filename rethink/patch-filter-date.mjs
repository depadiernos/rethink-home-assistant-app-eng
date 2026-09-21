import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Rethink publishes a zeroed filter-reset date as 0000-00-00. Its MQTT
// discovery declares this value as a date sensor, so Home Assistant rejects it.
// The pinned upstream image only contains compiled JavaScript, not TypeScript.
const original = "this.HA.publishProperty(this.id, 'filterchangeddate', changedDate);"
const replacement =
  "this.HA.publishProperty(this.id, 'filterchangeddate', this.filterChangedDate === 0 ? undefined : changedDate);"

export function patchFilterDateSource(source) {
  const occurrences = source.split(original).length - 1
  if (occurrences !== 1 || source.includes(replacement)) {
    throw new Error(`Expected exactly one unpatched filterchangeddate publisher; found ${occurrences}`)
  }
  return source.replace(original, replacement)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2]
  if (!path) throw new Error('Usage: node patch-filter-date.mjs <compiled Rethink device file>')
  const source = await readFile(path, 'utf8')
  await writeFile(path, patchFilterDateSource(source))
}
