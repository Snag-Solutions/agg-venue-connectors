# Testing

Run all public checks:

```sh
pnpm check
```

Run TypeScript tests:

```sh
pnpm test:ts
```

Run Rust tests:

```sh
cargo test --workspace
```

Connector tests should use fixtures and conformance helpers. They should not require live credentials.
