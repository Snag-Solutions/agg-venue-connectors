# Connector Author Guide

## 1. Generate A Connector

```sh
pnpm new:connector
```

This runs `turbo gen connector` and creates `connectors/<venue>/`.

The generator creates TypeScript and Rust scaffolding. You should not need to edit root TypeScript references, Vitest aliases, pnpm workspace globs, or Cargo workspace members by hand.

## 2. Fill Out The Manifest

Declare:

- `capabilities`: discovery, orderbook, chart bars, execution side support
- `chains`: supported chain IDs
- `env`: required runtime configuration
- `setup`: chain approvals, ATAs, deposit wallets, bundled setup, or pre-submit mutations
- `watchers`: address roles the runtime should monitor
- `charting`: interval support and complement behavior

Do not read `process.env` directly. Put runtime requirements in `env`.

## 3. Implement Execution

Start with `createDeclarativeExecutionConnector`. Move to a custom `defineVenueExecutionConnector` only when the venue needs side-specific planning or advanced finalize behavior.

Required functions:

- `planSetup(input)`
- `buildBuy(input)`
- `buildSell(input)`
- `finalize(input)`

Optional functions:

- `verifyOrderStatus(input)`
- `resolveChartRequest(input)`

## 4. Implement Rust Market Data

Create a crate named `agg-venue-<venue>` and implement `VenueConnector` from `crates/venue-core`.

Required:

- `venue()`
- `fetch_orderbook_rest(market_id, outcome_id)`

Recommended:

- `discover_events()`
- `fetch_chart_bars(request)`

## 5. Add Fixtures

Every PR should include source-owned fixtures for the behavior it changes:

- orderbook snapshot
- chart bars
- execution plan
- setup requirements

Fixtures should be small and deterministic. Do not include secrets. Prefer connector-local `src/fixtures.ts` files or shared fixture sources under `fixtures/src`.

Do not hand-author generated JSON fixtures. Run:

```sh
pnpm artifacts
```

## 6. Run Conformance

```sh
pnpm test:ts
cargo test --workspace
```

Public CI should not require live venue credentials.
