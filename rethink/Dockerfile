FROM ghcr.io/anszom/rethink@sha256:8c6b2e15fc1af9879188e982742342dd7bb34054bb733e6410bc67285fa76d8c

COPY web/vendor /app/dist/html/vendor
COPY web/rethink-ui.css /app/dist/html/rethink-ui.css
COPY web/rethink-ui.js /app/dist/html/rethink-ui.js

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
RUN chmod 0755 /usr/local/bin/run-rethink

CMD ["/usr/local/bin/run-rethink"]

LABEL \
    org.opencontainers.image.title="Home Assistant App: LG ThinQ Local" \
    org.opencontainers.image.description="Local LG ThinQ control powered by Rethink" \
    org.opencontainers.image.source="https://github.com/akinin/rethink-home-assistant-app"
