#!/bin/sh
set -eu

DATA_DIR=/data
OPTIONS_FILE="$DATA_DIR/options.json"
CONFIG_FILE="$DATA_DIR/config.json"

mkdir -p "$DATA_DIR/state"

node <<'NODE'
const fs = require('fs');

const optionsPath = '/data/options.json';
const configPath = '/data/config.json';
const options = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));

for (const [group, keys] of Object.entries({
  server: ['hostname', 'management_port'],
  mqtt: ['host', 'port', 'username', 'password'],
})) {
  for (const key of keys) {
    if (options[group]?.[key] === undefined || options[group][key] === '') {
      throw new Error(`Required application option is missing: ${group}.${key}`);
    }
  }
}

const config = {
  hostname: options.server.hostname,
  homeassistant: {
    mqtt_url: `mqtt://${options.mqtt.host}:${options.mqtt.port}`,
    discovery_prefix: options.advanced?.discovery_prefix || 'homeassistant',
    rethink_prefix: options.advanced?.rethink_prefix || 'rethink',
    mqtt_user: options.mqtt.username,
    mqtt_pass: options.mqtt.password,
  },
  ca_key_file: '/data/ca.key',
  ca_cert_file: '/data/ca.cert',
  https_port: 443,
  mqtts_port: 8883,
  mqtt_port: {
    address: '127.0.0.1',
    bind: 11884,
    advertise: 1884,
  },
  thinq1_http_port: {
    address: '127.0.0.1',
    bind: 46043,
    advertise: 46043,
  },
  thinq1_https_port: {
    address: '127.0.0.1',
    bind: 46044,
    advertise: 46044,
  },
  thinq1_port: {
    address: '127.0.0.1',
    bind: 47878,
    advertise: 47878,
  },
  management_port: {
    address: '172.30.32.1',
    bind: Number(options.server.management_port || 44401),
  },
  bridge: {
    storage_path: '/data/state',
  },
  log: ['status', 'HTTPS', 'MGMT'],
};

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
NODE

cd /app
if ! node /usr/local/bin/migrate-bridge-ca.mjs "$DATA_DIR/state"; then
  echo 'Bridge CA migration could not run; starting local server without changing TLS verification' >&2
fi
exec node dist/rethink-cloud.js "$CONFIG_FILE"
