# Security

Connector packages must be safe to publish and review.

Do not include:

- secrets
- credentials
- private endpoints
- generated keys
- environment-specific values
- database clients
- message-bus clients
- direct runtime side effects at import time

Public tests must run without secrets.
