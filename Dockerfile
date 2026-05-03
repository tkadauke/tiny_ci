# syntax=docker/dockerfile:1
#
# Production image for TinyCI.
#
# Built for linux/amd64 (homelab K3s nodes are Intel NUC 12). On Apple
# Silicon, build with `--platform linux/amd64` from an aarch64 Colima VM
# that has Rosetta binfmt registered — see ~/code/greenacres/.claude/
# skills/colima-amd64-build/SKILL.md.
#
# Default CMD runs the web tier. To run the scheduler instead:
#   docker run ... ghcr.io/tkadauke/tiny_ci bundle exec rake tiny_ci:scheduler

ARG RUBY_VERSION=3.2.3
FROM docker.io/library/ruby:${RUBY_VERSION}-slim AS base

LABEL org.opencontainers.image.source="https://github.com/tkadauke/tiny_ci"
LABEL org.opencontainers.image.description="TinyCI continuous integration server"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /rails

ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development:test"

# ---- Build stage -----------------------------------------------------------
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      git \
      libyaml-dev \
      pkg-config \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf "${BUNDLE_PATH}"/ruby/*/cache && \
    bundle exec bootsnap precompile --gemfile

COPY . .

RUN bundle exec bootsnap precompile app/ lib/

# Asset compilation is a no-op until Propshaft lands (issue #63 / PR #79).
# JS is wired through importmap-rails which doesn't need precompilation.
# CSS is currently served from public/stylesheets/ as static files via
# RAILS_SERVE_STATIC_FILES=1.

# ---- Runtime stage ---------------------------------------------------------
FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      curl \
      libjemalloc2 \
      libyaml-0-2 \
      openssh-client \
      tzdata \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* && \
    groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash

COPY --from=build --chown=rails:rails /usr/local/bundle /usr/local/bundle
COPY --from=build --chown=rails:rails /rails /rails

USER rails:rails

# jemalloc reduces resident memory growth for long-running Ruby processes.
ENV LD_PRELOAD=libjemalloc.so.2 \
    MALLOC_CONF=dirty_decay_ms:1000,narenas:2,background_thread:true \
    RAILS_LOG_TO_STDOUT=1 \
    RAILS_SERVE_STATIC_FILES=1

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 7199
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "7199"]
