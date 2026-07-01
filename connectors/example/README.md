# Example Connector

This is the only committed connector implementation in the public template.

It shows the expected connector layout:

- `src/` for the TypeScript manifest, execution planner, chart resolver, and tests.
- `rust/` for the Rust market-data connector.

Use `pnpm new:connector` to create a new connector from the same shape.
