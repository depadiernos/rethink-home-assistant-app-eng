# LG ThinQ Local

A fully local server for compatible LG ThinQ devices, based on
[Rethink](https://github.com/anszom/rethink). The application runs within
Home Assistant OS, accepts connections from LG appliances over the local network,
and publishes entities via MQTT Discovery—no LG cloud connection is required for
standard operation.

## Features

- Local control and status monitoring, even without an internet connection;
- Automatic creation of Home Assistant entities via MQTT Discovery;
- Secure management interface via Home Assistant Ingress;
- Support for Russian and English languages, with light and dark themes (no external CDNs);
- Device discovery and summary, plus filtering and export options for monitoring logs;
- Persistent storage for the Certificate Authority (CA), keys, and device states;
- A single server that supports multiple compatible air conditioners and other appliances;
- A pinned version of the Rethink image to ensure predictable updates.

## How it works

```text
LG Device ── HTTPS 443 / MQTT TLS 8883 ──> LG ThinQ Local
│
└── MQTT Discovery ──> Home Assistant
```

TCP ports `443` and `8883` must be accessible from the IoT network segment to
Home Assistant. The web interface is not exposed to the LAN; it can only be
accessed by clicking the **Open Web Interface** button on the application page.

Russian is enabled by default. The **RU/EN** language toggle and theme selectors
are located on the right side of the top panel; your preferences are saved
individually for each browser. ## DNS and TTL

Permanent local record:

```text
rethink.lan  A  <IP Home Assistant>  TTL 300
```

For the initial connection of a new ThinQ2 device, temporarily create:

```text
common.lgthinq.com  A  <IP Home Assistant>  TTL 300
```

`TTL 300` represents 300 seconds, or five minutes. This duration is short enough
to allow for quick address changes or rollbacks, without placing a constant
load on the DNS system. After modifying the record, either wait up to five
minutes or force the device to reconnect to Wi-Fi. Once registration is
successful, delete the `common.lgthinq.com` record; keep the `rethink.lan`
record permanently.

To register using a phone or tablet, use the official
[Rethink Setup for Android v1.1.1](https://github.com/akinin/rethink-home-assistant-app/blob/main/apk/README.md).
The verified APK build, its SHA-256 hash, and instructions can be found in the
application's repository.

## Before Starting

1. Create a dedicated MQTT user.
2. Enter the broker address, port, username, and password in the settings.
3. Create a permanent DNS record for `rethink.lan`.
4. Ensure that TCP ports `443` and `8883` are not already in use by other applications.
5. Launch the application and open the log; any MQTT errors or port conflicts
will be immediately visible.

Once a device has been connected, be sure to create a backup of your Home
Assistant instance. Losing the `/data/ca.key`, `/data/ca.cert`, or `/data/state`
files will require you to re-register your appliances. Detailed installation, connection of additional devices, DNS verification,
as well as updating and rolling back, are described in the [application documentation](DOCS.md).

## Compatibility and Limitations

- Current build: `amd64`;
- Primary use case: ThinQ2 devices;
- The set of available features depends on the profile of the specific model;
- This is an independent project, not affiliated with LG Electronics;
- Experimental operations and the transmission of raw packets may damage your equipment.
