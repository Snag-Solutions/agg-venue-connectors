# Integration

Connector packages are designed to be consumed by an application runtime.

The consuming runtime is responsible for:

- loading connector manifests
- supplying runtime configuration
- applying setup requirements
- subscribing to declared watcher targets
- executing generated plans
- routing Rust market-data connectors

Connector packages should stay declarative and deterministic.
