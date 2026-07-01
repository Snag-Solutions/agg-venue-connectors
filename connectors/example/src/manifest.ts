import { CONNECTOR_API_VERSION, defineAggVenue } from "@agg/venue-manifest";

export const EXAMPLE_CHAIN_ID = 8453;

export const exampleManifest = defineAggVenue({
  id: "example",
  displayName: "Example",
  apiVersion: CONNECTOR_API_VERSION,
  package: {
    npm: "@agg/venue-example",
    crate: "agg-venue-example"
  },
  capabilities: {
    discovery: true,
    orderbook: true,
    chartBars: true,
    execution: { buy: true, sell: true }
  },
  chains: [EXAMPLE_CHAIN_ID],
  env: [
    {
      name: "EXAMPLE_API_BASE",
      required: true,
      description: "Example API base URL."
    }
  ],
  setup: [],
  watchers: [],
  charting: {
    identifierSource: "connectorResolved",
    supportedIntervals: ["1m", "5m", "15m", "1h", "1d"],
    complementPolicy: "none"
  },
  notes: ["Example connector used for scaffolding and conformance tests."]
});
