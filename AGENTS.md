# AGENTS.md

These rules apply to coding agents and contributors working in this repository.

## Purpose

This repository is a public connector development kit. Keep it generic, self-contained, and safe for external contributors.

## Rules

- Use `pnpm new:connector` to create connector scaffolding.
- Keep connector changes scoped to `connectors/<venue>/` unless changing shared contracts or testkits.
- Every connector must include TypeScript code and a Rust crate under `rust/`.
- Do not include secrets, credentials, private endpoints, or environment-specific values.
- Do not read `process.env` directly from connector code. Declare runtime requirements in the manifest.
- Do not hand-author generated JSON artifacts. Source data should live in TypeScript or Rust and be generated with `pnpm artifacts`.
- Keep fixtures deterministic and safe to publish.
- Add or update conformance tests for behavior changes.

## Layout

- `connectors/<venue>/` contains the TypeScript connector package.
- `connectors/<venue>/rust/` contains the Rust market-data connector.
- `packages/venue-manifest/` owns manifest, setup, watcher, and charting schema.
- `packages/execution-kit/` owns execution plan types.
- `packages/execution-testkit/` owns TypeScript conformance helpers.
- `crates/venue-core/` owns Rust connector traits and validators.
- `crates/venue-core-testkit/` owns Rust conformance helpers.
- `turbo/generators/` owns `turbo gen connector`.

## Validation

```sh
pnpm check
pnpm build
```
