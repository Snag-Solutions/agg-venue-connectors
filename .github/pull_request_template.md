## Connector Scope

- [ ] Manifest updated
- [ ] TypeScript execution connector updated, if execution changed
- [ ] Rust market-data connector updated, if orderbook/charting changed
- [ ] Source-owned fixtures added or updated
- [ ] Public conformance tests pass

## Setup And Watchers

- [ ] Setup requirements are declared in the manifest
- [ ] Watcher intent is declared in the manifest
- [ ] No secrets, private endpoints, direct database clients, or message-bus clients

## Validation

```sh
pnpm test:ts
cargo test --workspace
pnpm artifacts
```

## Notes

Describe venue-specific behavior, fixtures, and failure modes.
