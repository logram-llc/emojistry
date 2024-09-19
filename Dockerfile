ARG NODE_IMAGE_TAG=21.7-alpine3.20
FROM docker.io/node:${NODE_IMAGE_TAG} AS builder

WORKDIR /app

# NOTE(nicholas-ramsey): Setup Alpine edge repositories for cargo=1.81.0, which depends on the rustc version we're looking for
RUN set -eux \
    && echo 'https://dl-cdn.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories \
    && echo 'https://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories \
    && apk update

# NOTE(nicholas-ramsey): Install build dependencies
RUN set -eux \
    && apk add --no-cache git=2.45.2-r0 cargo=1.81.0-r0

ARG SPREET_GIT_URL
ARG SPREET_GIT_REV

ENV BUILDER_CARGO_BIN_PATH="/app/.cargo/"
ENV PATH="${PATH}:${BUILDER_CARGO_BIN_PATH}/bin/"
    
RUN set -eux \
    && mkdir -p ${BUILDER_CARGO_BIN_PATH} \
    && cargo install spreet --git="${SPREET_GIT_URL}" --rev="${SPREET_GIT_REV}" --root="${BUILDER_CARGO_BIN_PATH}"

COPY package.json package-lock.json ./
RUN set -eux \
    && npm ci

ENV PATH="${PATH}:${BUILDER_CARGO_BIN_PATH}/bin/"

COPY . ./

# NOTE(nicholas-ramsey): Build
RUN set -eux \
    && npm run build

FROM docker.io/caddy:2.8.4-alpine AS production

ARG BUILD_VERSION
ARG BUILD_CREATION_DATE
ARG BUILD_COMMIT_SHA
ARG BUILD_CLONE_URL
ARG BUILD_DOCUMENTATION_URL
ARG BUILD_URL

LABEL org.opencontainers.image.title="Emojistry"
LABEL org.opencontainers.image.licenses="GPL-3.0"
LABEL org.opencontainers.image.authors="Nicholas Ramsey (nicholas@logram.io), Jordan Ramsey (jordan@logram.io)"
LABEL org.opencontainers.image.description="An emoji browser web app for power-users"
LABEL org.opencontainers.image.vendor="Logram"
LABEL io.logram.emoji.version=${BUILD_VERSION}
LABEL org.opencontainers.image.version=${BUILD_VERSION}
LABEL org.opencontainers.image.created=${BUILD_CREATION_DATE}
LABEL org.opencontainers.image.revision=${BUILD_COMMIT_SHA}
LABEL org.opencontainers.image.url=${BUILD_CLONE_URL}
LABEL org.opencontainers.image.documentation=${BUILD_DOCUMENTATION_URL}
LABEL org.opencontainers.image.source=${BUILD_URL}

WORKDIR /app

COPY --from=builder /app/LICENSE ./
COPY --from=builder /app/build ./build

ENV BUILD_VERSION=${BUILD_VERSION}

EXPOSE 5173

ENTRYPOINT ["caddy", "file-server", "--root", "/app/build"]
CMD ["--listen", ":5173"]