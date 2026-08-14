# LG ThinQ Local for Home Assistant

[Русский](README.md) · **English**

Home Assistant OS app repository that runs
[Rethink](https://github.com/anszom/rethink) for fully local control of
compatible LG ThinQ appliances.

## Features

- local control and state reporting without the LG cloud;
- Home Assistant MQTT Discovery;
- protected management UI through Home Assistant Ingress;
- Russian and English UI, light and dark themes;
- bundled web resources with no Google Fonts or CDN dependency;
- device search, editable friendly names, status summaries and monitor-log export;
- persistent local CA, keys and device state;
- multiple compatible appliances handled by one app instance;
- Rethink base image pinned by digest.

## Quick installation

Add this URL as a custom repository in the Home Assistant app store:

```text
https://github.com/akinin/rethink-home-assistant-app
```

Install **LG ThinQ Local**, configure MQTT and add this permanent DNS record:

```text
rethink.lan  A  <Home Assistant IP>  TTL 300
```

Read the [complete English guide](rethink/DOCS.en.md) for first-time
provisioning, adding another air conditioner, the temporary
`common.lgthinq.com` record, TTL, backups, updates and rollback.

## Android companion

The [`apk/`](apk/) directory contains an unchanged verified copy of the official
[Rethink Setup for Android v1.1.1](https://github.com/anszom/rethink-setup-android/releases/tag/v1.1.1).
Its source, SHA-256, requirements and installation procedure are documented in
the [English APK guide](apk/README.en.md).

## Security

- the management UI is available only through Home Assistant Ingress;
- MQTT credentials are never stored in this repository;
- the ThinQ1 and internal MQTT listeners are restricted to loopback;
- only TCP 443 and 8883 need to be reachable from the local/IoT networks.

Remove IP addresses, device UUIDs, MQTT credentials and `/data` contents before
publishing logs or diagnostics.

## Origin and license

The server is provided by [anszom/rethink](https://github.com/anszom/rethink)
under GPL-2.0. This Home Assistant packaging project is independent and is not
affiliated with LG Electronics.
