LG ThinQ Local

A fully local server for compatible LG ThinQ devices, built on Rethink. The application runs within Home Assistant OS, accepts connections from LG appliances over the local network, and publishes entities via MQTT Discovery—eliminating the need for the LG cloud for standard operation.
Key features

Local control and status monitoring, even without an internet connection; 
Automatic creation of Home Assistant entities via MQTT Discovery; 
Secure management interface accessible through Home Assistant Ingress; 
Support for Russian and English languages, with light and dark themes (no external CDNs); 
Device discovery and summary, plus filtering and export options for monitoring logs; 
Persistent storage for the Certificate Authority (CA), keys, and device states; 
Support for multiple compatible air conditioners and other appliances via a single server; 
Pinned Rethink image version for predictable updates.

How it works

LG Device ── HTTPS 443 / MQTT TLS 8883 ──> LG ThinQ Local
│
└── MQTT Discovery ──> Home Assistant

TCP ports 443 and 8883 must be accessible from the IoT network segment to the Home Assistant instance. The web interface is not exposed to the LAN; it can only be accessed by clicking the "Open Web Interface" button on the application page.

Russian is enabled by default. Language (RU/EN) and theme toggles are located on the right side of the top panel; selections are saved locally for each browser.
DNS and TTL

Permanent local record:

rethink.lan  A  <Home Assistant IP>  TTL 300

For the initial setup of a new ThinQ2 device, temporarily create:

common.lgthinq.com  A  <Home Assistant IP>  TTL 300

A TTL of 300 (300 seconds, or five minutes) is short enough to allow for quick address changes or rollbacks, while avoiding excessive DNS load. After modifying a record, wait up to five minutes or force the device to reconnect to Wi-Fi. You may delete the `common.lgthinq.com` record once registration is successful; however, keep the `rethink.lan` record in place permanently.

To register via a phone or tablet, use the official "Rethink Setup for Android" v1.1.1. The verified APK build, its SHA-256 hash, and instructions can be found in the application repository.
Before launching:

Create a dedicated MQTT user. 
Specify the broker address, port, username, and password in the settings. 
Create a persistent DNS record for `rethink.lan`. 
Ensure that TCP ports 443 and 8883 are not in use by other applications. 
Launch the application and open the log; any MQTT errors or port conflicts will be immediately visible.

Once a device is connected, be sure to create a backup of your Home Assistant instance. Losing `/data/ca.key`, `/data/ca.cert`, or `/data/state` will require you to re-register your appliances.

Detailed information regarding installation, connecting additional devices, DNS verification, updates, and rollbacks can be found in the application documentation.
Compatibility and Limitations:

Current build: amd64. 
Primary use case: ThinQ2-enabled devices. 
The set of available features depends on the specific model profile. 
This is an independent project and is not affiliated with LG Electronics. 
Experimental operations or sending raw packets may potentially damage your appliances.
