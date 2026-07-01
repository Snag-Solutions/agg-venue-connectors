import type { ExecutionBuildInput } from "@agg/execution-kit";

export const exampleBuyFixture = {
  userId: "user-fixture",
  clientOrderId: "example-buy-fixture",
  side: "buy",
  walletAddress: "0x0000000000000000000000000000000000000001",
  venueMarketId: "example-market-fixture",
  outcomeId: "yes",
  quantity: "10",
  limitPrice: "0.51",
  metadata: {}
} satisfies ExecutionBuildInput;
