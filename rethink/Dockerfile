# Upstream b6b3c037 (includes the region-correct CA fix 980b42e).
FROM ghcr.io/anszom/rethink@sha256:1938f4a2180a6d72f9c8f72e111d0ddcd278dc49cf6c220fe44d2d3719692562

COPY web/vendor /app/dist/html/vendor
COPY web/rethink-ui.css /app/dist/html/rethink-ui.css
COPY web/rethink-ui.js /app/dist/html/rethink-ui.js
COPY logo.png /app/dist/html/lg-thinq-local.png

RUN set -eu; \
    for page in /app/dist/html/index.html /app/dist/html/monitor.html; do \
        sed -i \
            -e 's|https://fonts.googleapis.com/icon?family=Material+Icons|vendor/material-icons.css|g' \
            -e 's|https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css|vendor/materialize.min.css|g' \
            -e 's|https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js|vendor/materialize.min.js|g' \
            -e 's|</head>|<link rel="stylesheet" href="rethink-ui.css" /></head>|' \
            -e 's|</body>|<script src="rethink-ui.js"></script></body>|' \
            -e 's|href="/"|href="./"|g' \
            "$page"; \
    done

COPY run.sh /usr/local/bin/run-rethink
COPY migrate-bridge-ca.mjs /usr/local/bin/migrate-bridge-ca.mjs
RUN chmod 0755 /usr/local/bin/run-rethink

CMD ["/usr/local/bin/run-rethink"]

LABEL \
    org.opencontainers.image.title="Home Assistant App: LG ThinQ Local" \
    org.opencontainers.image.description="Local LG ThinQ control powered by Rethink" \
    org.opencontainers.image.source="https://github.com/akinin/rethink-home-assistant-app"
