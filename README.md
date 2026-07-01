# Venue Connectors

Public connector development kit for venue integrations.

This repository contains the contracts, generator, example connector, and conformance tests needed to build a connector package. A connector has two parts:

- TypeScript for manifest, setup, chart resolution, and execution planning.
- Rust for market data, orderbook, and chart-bar integration.

## Quick Start

```sh
pnpm install
pnpm check
```

Create a connector:

```sh
pnpm new:connector
```

The generator creates a complete `connectors/<venue>/` directory with TypeScript and Rust scaffolding.

## Layout

```txt
connectors/example          Example connector
packages/venue-manifest     Manifest, setup, watcher, and charting schema
packages/execution-kit      Execution plan types and validators
packages/execution-testkit  TypeScript conformance helpers
crates/venue-core           Rust connector traits and validators
crates/venue-core-testkit   Rust conformance helpers
fixtures/src                Code-owned fixture sources
turbo/generators            turbo gen connector
```

Generated JSON artifacts are written to `generated/` and are not committed.

## Commands

```sh
pnpm new:connector
pnpm artifacts
pnpm test
pnpm build
pnpm check
```

## Connector Rules

- Keep connector code self-contained.
- Do not include secrets.
- Do not read runtime environment variables directly from connector code.
- Declare runtime requirements in the manifest.
- Keep fixtures deterministic.
- Add conformance tests for behavior changes.
