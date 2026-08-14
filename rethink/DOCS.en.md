# LG ThinQ Local: installation and operation

[Русский](DOCS.md) · **English**

This app packages [Rethink](https://github.com/anszom/rethink) for Home
Assistant OS. Rethink replaces the cloud endpoint used by compatible LG ThinQ
appliances and exposes their local protocol through Home Assistant MQTT
Discovery.

## Architecture

```text
                         ┌─────────────────────────────┐
LG ThinQ2 appliance ────>│ LG ThinQ Local              │
  HTTPS/TCP 443          │ Rethink Cloud               │───> MQTT broker
  MQTT TLS/TCP 8883      │ CA, keys and state in /data │     TCP 1883
                         └─────────────────────────────┘
                                      │
                                      └── Home Assistant Ingress
                                          internal TCP 44401
```

One app instance can serve multiple compatible appliances. You do not need a
separate app or MQTT account for every air conditioner.

## Requirements

- Home Assistant OS or Supervised on `amd64`;
- an MQTT broker and dedicated credentials for this app;
- local DNS with custom A records;
- routing from the appliance network to Home Assistant TCP 443 and 8883;
- free TCP ports 443 and 8883 on the Home Assistant host.

## Install from the repository

1. Open **Settings → Apps → App store** in Home Assistant.
2. Add this custom repository:

   ```text
   https://github.com/akinin/rethink-home-assistant-app
   ```

3. Refresh the store, install **LG ThinQ Local**, configure MQTT and start it.
4. Inspect the log before provisioning an appliance.

## Configuration

### Rethink server

| Field | Recommended value | Purpose |
| --- | --- | --- |
| `hostname` | `rethink.lan` | Local server name supplied to appliances |
| `management_port` | `44401` | Internal Ingress management port |

### MQTT

| Field | Example | Purpose |
| --- | --- | --- |
| `host` | `<Home Assistant IP>` | MQTT broker address |
| `port` | `1883` | Local MQTT port |
| `username` | `lg_thinq_local` | Dedicated app user |
| `password` | — | Unique MQTT password; never commit it |

The advanced `discovery_prefix: homeassistant` and `rethink_prefix: rethink`
values normally should not be changed. Different prefixes may duplicate
entities.

## DNS records and TTL

Create this permanent record:

```text
Type: A
Name: rethink.lan
Address: <Home Assistant IP>
TTL: 300
```

Already registered appliances use it to reconnect to the local server.

During initial ThinQ2 registration, also create this temporary record:

```text
Type: A
Name: common.lgthinq.com
Address: <Home Assistant IP>
TTL: 300
```

It intercepts only the route-discovery stage. Delete it after the appliance
appears in Rethink so other clients can use the real LG domain normally.

TTL is measured in seconds. `300` means cached DNS answers can remain for five
minutes. After a change, wait up to five minutes or reconnect the appliance to
Wi-Fi. Avoid automatic or very large TTL values for the temporary record;
`300` is a practical compromise. Verify from the same network:

```bash
dig +short rethink.lan
dig +short common.lgthinq.com
```

Both must return the Home Assistant IP while provisioning.

## Provision the first or an additional appliance

Use the official **Rethink Setup** companion on Android 8.0 or newer. A verified
v1.1.1 copy and its digest are in the [`apk/`](../apk/) directory.

1. Confirm LG ThinQ Local is running and MQTT is connected.
2. Temporarily point `common.lgthinq.com` to Home Assistant with TTL `300`.
3. Put the appliance into Wi-Fi setup mode according to its manual.
4. Join its Wi-Fi from Android (often `LG_Smart_*` or `LGE_*`). No internet on
   that network is expected.
5. Run **Provision a device** in Rethink Setup.
6. Rejoin the home network and wait for the appliance in Rethink.
7. Verify that MQTT entities appear in Home Assistant.
8. Delete the temporary `common.lgthinq.com` record.
9. Create a Home Assistant backup.

For another air conditioner, repeat only steps 2–9. Keep the same server,
`rethink.lan` record, app and MQTT user.

## Network and security

| Direction | Port | Purpose |
| --- | --- | --- |
| appliance → Home Assistant | `443/tcp` | local ThinQ2 HTTPS |
| appliance → Home Assistant | `8883/tcp` | local ThinQ2 MQTT TLS |
| app → MQTT broker | `1883/tcp` | discovery and state |
| Home Assistant → app | `44401/tcp` | internal app Ingress |

Do not publish port 44401 through a reverse proxy. The management UI is already
protected by the Home Assistant session through Ingress. Restrict 443/8883 to
local and IoT networks and use a dedicated MQTT account.

## Web interface

Open it with **Open web UI** from the app page. Russian is the default; use
**RU/EN** to switch languages and the sun/moon button to switch theme. Both
preferences are stored per browser.

The dashboard provides device totals, support/bridge status, last update time,
search and editable friendly names. The monitor provides RX/TX counters,
content filtering, clear and text-log download. All fonts and assets are bundled
and continue to work without internet access.

## Persistent data and backups

`/data` contains:

- `ca.key` — local CA private key;
- `ca.cert` — local CA certificate;
- `state/` — registered appliance state;
- `config.json` — generated runtime configuration.

These files survive app updates. Appliances trust this exact CA, so losing the
data requires provisioning them again. Create a full Home Assistant backup after
each new registration.

## Update and rollback

Before updating, create a backup and read `CHANGELOG.md`. After updating, verify
MQTT and wait for appliances to reconnect automatically; they do not need to be
turned on. The upstream Rethink image is pinned by digest and changes only with
an explicit app release.

Diagnostics:

```bash
ha apps info local_lg_thinq_local
ha apps logs local_lg_thinq_local
ha apps restart local_lg_thinq_local
```

For rollback, stop the app, restore the previous server with the same CA and
state, restore the `rethink.lan` DNS target, then reconnect Wi-Fi. Never run two
servers using the same DNS name with different certificate authorities.

## Limitations

The current package targets ThinQ2 and `amd64`. Available functions depend on
the model profile. Rethink and this app are independent projects and are not
affiliated with LG Electronics. Do not send raw packets unless you understand
the appliance protocol.
