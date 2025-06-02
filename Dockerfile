FROM emscripten/emsdk:4.0.9 AS build

ENV DEBIAN_FRONTEND=noninteractive \
    DEBCONF_NONINTERACTIVE_SEEN=true \
    LC_ALL=C.UTF-8 \
    LANG=C.UTF-8

RUN apt-get update \
    && apt-get install -y \
    build-essential \
    autoconf \
    libtool \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG JQ_BRANCH
RUN git clone https://github.com/jqlang/jq /app && \
    cd /app && \
    git checkout $JQ_BRANCH && \
    git submodule update --init --recursive
WORKDIR /app

RUN autoreconf -fi \
    && emconfigure \
    ./configure \
    --disable-docs \
    --disable-valgrind \
    --with-oniguruma=builtin \
    --enable-static \
    --enable-all-static

COPY ./src/pre.js /app/pre.js

# Build-time arguments
ARG BUILD_TYPE=release
# Default 256 MB
ARG MAXIMUM_MEMORY=268435456

# Common Emscripten flags
# Note: SINGLE_FILE=1 embeds the .wasm binary into the .js file
ENV COMMON_CFLAGS="-s STACK_SIZE=1048576 \
    -s SINGLE_FILE=1 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS=['callMain'] \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INVOKE_RUN=0 \
    -s EXIT_RUNTIME=0 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='jq' \
    --pre-js /app/pre.js"

RUN if [ "$BUILD_TYPE" = "debug" ]; then \
    CFLAGS="-g4 -s ASSERTIONS=2 ${COMMON_CFLAGS} -s MAXIMUM_MEMORY=${MAXIMUM_MEMORY}"; \
    else \
    CFLAGS="-O3 ${COMMON_CFLAGS} -s MAXIMUM_MEMORY=${MAXIMUM_MEMORY}"; \
    fi \
    && emmake make -j$(nproc) EXEEXT=.js CFLAGS="$CFLAGS"

#
# Stage 2: Export artifacts
#
FROM scratch AS export

COPY --from=build /app/jq.js ./
