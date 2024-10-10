ARG NODE_IMAGE_TAG=21.7.0
FROM docker.io/node:${NODE_IMAGE_TAG}

# NOTE(nicholas-ramsey): Install build dependencies
RUN set -eux \
    && apt-get update \
    && apt-get install --yes --no-install-recommends git=1:2.39.5-0+deb12u1 \
    && curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain 1.81.0

# NOTE(nicholas-ramsey): Install spreet
ARG SPREET_GIT_URL
ARG SPREET_GIT_REV
 
RUN set -eux \
    && /root/.cargo/bin/cargo install spreet --git="${SPREET_GIT_URL}" --rev="${SPREET_GIT_REV}" 

# NOTE(nicholas-ramsey): Install cwebp
ARG CWEBP_URL

RUN set -eux \
    && curl --fail --silent --show-error --location "${CWEBP_URL}" \
        | tar --gzip --extract --verbose --file - --strip-components=2 --wildcards --directory /usr/bin "libwebp-*/bin/cwebp"


ENV PATH="/root/.cargo/bin:${PATH}"
