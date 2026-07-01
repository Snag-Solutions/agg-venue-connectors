# Architecture

The repository is organized around connector packages.

Each connector lives in `connectors/<venue>/` and includes:

- a TypeScript package for manifest, setup declarations, chart request resolution, execution planning, and tests
- a Rust crate under `rust/` for market data, orderbooks, and chart bars

Shared contracts live in `packages/` and `crates/`.

Generated artifacts are outputs, not source. Run:

```sh
pnpm artifacts
```
