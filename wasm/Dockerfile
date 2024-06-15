FROM emscripten/emsdk:3.1.61 AS build

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

RUN git clone --recurse-submodules -b jq-1.7.1 https://github.com/jqlang/jq /app
WORKDIR /app

RUN autoreconf -fi \
    && emconfigure \
    ./configure \
    --disable-docs \
    --disable-valgrind \
    --with-oniguruma=builtin \
    --enable-static \
    --enable-all-static

COPY ./wasm/ /app/wasm/

ARG BUILD_TYPE=release
ENV COMMON_CFLAGS="-s STACK_SIZE=1048576 -s WASM=1 -s EXPORTED_RUNTIME_METHODS=['callMain'] -s ALLOW_MEMORY_GROWTH=1 -s INVOKE_RUN=0 -s EXIT_RUNTIME=1 -s MODULARIZE=1 -s EXPORT_NAME='jq' --pre-js /app/wasm/pre.js"
RUN if [ "$BUILD_TYPE" = "debug" ]; then \
    CFLAGS="-g4 -s ASSERTIONS=2 ${COMMON_CFLAGS}"; \
    else \
    CFLAGS="-O3 -s STACK_SIZE=1048576 ${COMMON_CFLAGS}"; \
    fi \
    && emmake \
    make \
    -j$(nproc) \
    EXEEXT=.js \
    CFLAGS="$CFLAGS"

FROM scratch AS export

COPY --from=build /app/jq.js /app/jq.wasm ./
