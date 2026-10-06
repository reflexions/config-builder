# Config Builder Changelog

## [Unreleased]

## [1.7.0] - 2026-10-06

- Added `otel/BuildTrace.mjs`: a dependency-free OTLP/HTTP exporter that records build timings as one trace (root span + child spans) and posts it to the build collector (`https://otel.nycrcubic.com`). The endpoint and its write-only token are baked in, so a consumer only needs to bump this package. `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_INGRESS_BEARER_TOKEN` override them, and an empty endpoint turns export off. Export is best-effort and never fails the build.
- `WebpackCompile` now records a span per sub-compiler (browser, node) under a "webpack build" root span and exports it on every build. The root span records host name, CPU count, total memory and node version, plus `CUSTOMER_URL` / `PUBLIC_URL` when set. `TRACEPARENT` nests it under a parent trace.

## [1.0.11] - 2024-04-22

- Removed date-fns => date-fns/esm alias. Date-fns changed their packaging and that alias is no longer necessary.
- Added more hooks to baseConfig
