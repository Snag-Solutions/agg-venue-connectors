import type { ExecutionBuildInput } from "@agg/execution-kit";

export const exampleOrderbookFixture = {
  venue: "example",
  market_id: "example-market",
  outcome_id: "yes",
  bids: [
    { price: 0.49, size: 10 },
    { price: 0.48, size: 8 }
  ],
  asks: [
    { price: 0.51, size: 12 },
    { price: 0.52, size: 6 }
  ],
  sequence: 1,
  timestamp_unix_ms: 1_700_000_000_000
};

export const exampleBarsFixture = {
  cache_status: "fresh",
  bars: [
    {
      timestamp_unix_seconds: 1_700_000_000,
      open: 0.5,
      high: 0.55,
      low: 0.48,
      close: 0.52,
      volume: 100
    },
    {
      timestamp_unix_seconds: 1_700_003_600,
      open: 0.52,
      high: 0.56,
      low: 0.5,
      close: 0.53,
      volume: 120
    }
  ]
};

export const exampleSetupFixture = {
  venue: "example",
  setup: []
};

export const exampleBuyInputFixture = {
  userId: "user-fixture",
  clientOrderId: "client-order-fixture",
  side: "buy",
  walletAddress: "0x0000000000000000000000000000000000000001",
  venueMarketId: "example-market",
  outcomeId: "yes",
  quantity: "10",
  limitPrice: "0.51",
  metadata: {}
} satisfies ExecutionBuildInput;

export const generatedFixtureFiles = {
  "fixtures/orderbooks/example-orderbook.json": exampleOrderbookFixture,
  "fixtures/charts/example-bars.json": exampleBarsFixture,
  "fixtures/setup/example-setup.json": exampleSetupFixture,
  "fixtures/execution/example-buy-input.json": exampleBuyInputFixture
} as const;
