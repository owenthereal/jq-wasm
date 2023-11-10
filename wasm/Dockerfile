FROM emscripten/emsdk:3.1.48 AS build

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

RUN git clone --recurse-submodules https://github.com/jqlang/jq /app
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
RUN emmake \
    make \
    -j$(nproc) \
    EXEEXT=.js \
    CFLAGS="-O3 -s EXPORTED_RUNTIME_METHODS=['callMain'] -s INVOKE_RUN=0 -s EXIT_RUNTIME=0 -s MODULARIZE=1 -s EXPORT_NAME='jq' --pre-js /app/wasm/pre.js"

FROM scratch AS export

COPY --from=build /app/jq.js /app/jq.wasm ./
