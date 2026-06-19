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

ARG JQ_BRANCH=master
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
ENV COMMON_CFLAGS="-s STACK_SIZE=1048576 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS=['callMain'] \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INVOKE_RUN=0 \
    -s EXIT_RUNTIME=0 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='jq' \
    --pre-js /app/pre.js"

RUN if [ "$BUILD_TYPE" = "debug" ]; then \
    OPTIMIZATION_CFLAGS="-g4 -s ASSERTIONS=2"; \
    else \
    OPTIMIZATION_CFLAGS="-O3"; \
    fi \
    && CFLAGS="${OPTIMIZATION_CFLAGS} ${COMMON_CFLAGS} -s SINGLE_FILE=1 -s MAXIMUM_MEMORY=${MAXIMUM_MEMORY}" \
    && emmake make -j$(nproc) EXEEXT=.js CFLAGS="$CFLAGS" \
    && cp jq.js jq.single.js \
    && rm -f jq.js jq.wasm \
    # -s ENVIRONMENT=web prevents Emscripten's faulty runtime environment detection: in a Cloudflare
    # Worker it would otherwise run self.location.href (undefined) and, under nodejs_compat, __dirname,
    # both of which throw. The web build omits that detection; edge.mjs supplies the Wasm via instantiateWasm.
    && CFLAGS="${OPTIMIZATION_CFLAGS} ${COMMON_CFLAGS} -s ENVIRONMENT=web -s MAXIMUM_MEMORY=${MAXIMUM_MEMORY}" \
    && emmake make -j$(nproc) EXEEXT=.js CFLAGS="$CFLAGS" \
    && cp jq.js jq.edge.js

#
# Stage 2: Export artifacts
#
FROM scratch AS export

COPY --from=build /app/jq.single.js ./jq.js
COPY --from=build /app/jq.edge.js ./jq.edge.js
COPY --from=build /app/jq.wasm ./jq.wasm
