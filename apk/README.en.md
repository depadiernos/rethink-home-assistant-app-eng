# Rethink Setup for Android

[Русский](README.md) · **English**

This directory contains an unchanged copy of the official Android companion
used to provision appliances to Rethink:

- file: [`rethink-setup-android-v1.1.1.apk`](rethink-setup-android-v1.1.1.apk);
- version: `v1.1.1`;
- release size: `13,844,948` bytes;
- upstream release date: August 1, 2026;
- source release: [anszom/rethink-setup-android v1.1.1](https://github.com/anszom/rethink-setup-android/releases/tag/v1.1.1);
- source repository: [anszom/rethink-setup-android](https://github.com/anszom/rethink-setup-android);
- upstream license: MIT;
- SHA-256: `6c1e13605e0842b9c2a796102cc04b615db4a80a9901cbf4be1f10c93183098a`.

## Verify the file

macOS:

```bash
shasum -a 256 rethink-setup-android-v1.1.1.apk
```

Linux:

```bash
sha256sum rethink-setup-android-v1.1.1.apk
```

PowerShell:

```powershell
Get-FileHash .\rethink-setup-android-v1.1.1.apk -Algorithm SHA256
```

The result must exactly match the digest above and the official GitHub Release.
Do not install the file if it differs.

## Install and use

1. Download the APK to a phone or tablet running Android 8.0 or newer.
2. Allow installation from unknown sources only for the app opening the APK.
3. Install the APK and disable that permission again.
4. Connect Android to the home Wi-Fi and run **Check DNS redirection**.
5. To add an appliance, open **Provision a device** and follow the wizard.

The companion does not replace the **LG ThinQ Local** server. It is used only
to verify DNS and provision home Wi-Fi settings during initial registration.

## DNS and TTL

Before **Check DNS redirection**, create:

```text
rethink.lan         A  <Home Assistant IP>  TTL 300  # permanent
common.lgthinq.com  A  <Home Assistant IP>  TTL 300  # temporary
```

`TTL 300` is five minutes. After changing a record, wait up to five minutes or
reconnect the tablet's Wi-Fi. A successful ThinQ2 check confirms that the LG
cloud endpoint is being served locally by Rethink.

Delete the local `common.lgthinq.com` record after the appliance is registered.
Keep `rethink.lan`: appliances use it to find the local server after a restart
or Wi-Fi outage.

## Updating the APK

Only add a new version after checking its official GitHub Release and SHA-256.
Keep the version in the filename; never silently replace an existing APK.
