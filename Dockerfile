# syntax=docker/dockerfile:1
# Multi-stage build for production tiny_ci.
#
# Stage 1 (builder) installs system build dependencies, gems, and bootsnap
# precompiled cache. Stage 2 (runtime) ships only the runtime libraries
# needed at request time, so the final image is roughly half the size of
# the builder.

ARG RUBY_VERSION=3.2.3
FROM ruby:${RUBY_VERSION}-slim AS builder

ENV BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development:test" \
    RAILS_ENV=production \
    DEBIAN_FRONTEND=noninteractive

# Build dependencies. trilogy ships a vendored mysql client, but it still
# needs a C toolchain + libssl-dev to compile. git is required by some gems
# that use git: sources from Gemfile.
RUN apt-get update -qq \
 && apt-get install --no-install-recommends -y \
        build-essential \
        ca-certificates \
        git \
        libssl-dev \
        libyaml-dev \
        pkg-config \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only gem manifests first so the bundler layer is cached when only
# app code changes.
COPY Gemfile Gemfile.lock ./
COPY .ruby-version ./
RUN bundle install --jobs=4 --retry=3 \
 && rm -rf /usr/local/bundle/cache/*.gem \
 && find /usr/local/bundle -type d -name spec -prune -exec rm -rf {} + \
 && find /usr/local/bundle -type d -name test -prune -exec rm -rf {} +

COPY . .

# Pre-generate the bootsnap cache so the first request after boot doesn't
# pay the load-time tax. SECRET_KEY_BASE is injected as a no-op at build
# time to satisfy any boot-time check that demands it; it's overwritten by
# the real secret at runtime.
RUN SECRET_KEY_BASE=dummy bundle exec bootsnap precompile --gemfile app/ lib/

# ---------------------------------------------------------------------------
# Runtime image
# ---------------------------------------------------------------------------
FROM ruby:${RUBY_VERSION}-slim AS runtime

ENV BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development:test" \
    RAILS_ENV=production \
    RAILS_LOG_TO_STDOUT=1 \
    PORT=7199

# Runtime deps only — no compilers. ca-certs for HTTPS GitHub clones,
# libssl/libyaml for the Ruby runtime, openssh-client for net-ssh-driven
# remote build slaves, tzdata for the configured America/New_York TZ, and
# default-mysql-client for `bin/rails dbconsole` and ad-hoc debugging.
RUN apt-get update -qq \
 && apt-get install --no-install-recommends -y \
        ca-certificates \
        default-mysql-client \
        libssl3 \
        libyaml-0-2 \
        openssh-client \
        tzdata \
 && rm -rf /var/lib/apt/lists/*

# Run as a non-root user. Match uid/gid 1000 so volume-mounted writes from
# `docker compose run` line up with a typical host user.
RUN groupadd --system --gid 1000 rails \
 && useradd --system --uid 1000 --gid rails --home /app --shell /bin/bash rails

WORKDIR /app
COPY --from=builder --chown=rails:rails /usr/local/bundle /usr/local/bundle
COPY --from=builder --chown=rails:rails /app /app

# Writable directories the app needs at runtime. `storage/` holds Rails
# Active Storage blobs; `tmp/` is required for puma's pidfile + cache.
RUN mkdir -p /app/log /app/tmp/pids /app/tmp/cache /app/storage \
 && chown -R rails:rails /app/log /app/tmp /app/storage

USER rails

EXPOSE 7199

# Bind to all interfaces so the container is reachable from the host /
# kube Service. Default CMD runs the web tier; the scheduler is launched
# with `command: bin/scheduler` (see Procfile / docker-compose.yml).
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "7199"]
