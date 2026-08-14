FROM ghcr.io/anszom/rethink@sha256:8c6b2e15fc1af9879188e982742342dd7bb34054bb733e6410bc67285fa76d8c

COPY run.sh /usr/local/bin/run-rethink
RUN chmod 0755 /usr/local/bin/run-rethink

CMD ["/usr/local/bin/run-rethink"]

LABEL \
    org.opencontainers.image.title="Home Assistant App: LG ThinQ Local" \
    org.opencontainers.image.description="Local LG ThinQ control powered by Rethink" \
    org.opencontainers.image.source="https://github.com/akinin/rethink-home-assistant-app"
