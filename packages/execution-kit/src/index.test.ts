import { CONNECTOR_API_VERSION, defineAggVenue } from "@agg/venue-manifest";
import { describe, expect, it } from "vitest";
import { createDeclarativeExecutionConnector, createStep, validateExecutionPlan } from "./index";

const manifest = defineAggVenue({
  id: "example",
  displayName: "Example",
  apiVersion: CONNECTOR_API_VERSION,
  capabilities: {
    execution: { buy: true, sell: true }
  },
  chains: [8453]
});

describe("createDeclarativeExecutionConnector", () => {
  it("creates executable buy, sell, and finalize execution plans", () => {
    const connector = createDeclarativeExecutionConnector({
      manifest,
      statusFilter: { key: "orderID", retryOnTimeout: true }
    });

    const buy = connector.buildBuy({
      userId: "user-1",
      clientOrderId: "client-1",
      side: "buy",
      venueMarketId: "market-1",
      outcomeId: "yes",
      quantity: "10",
      limitPrice: "0.51"
    });

    validateExecutionPlan(buy);
    expect(buy.statusFilter?.key).toBe("orderID");
    expect(buy.steps[0]?.retry?.maxAttempts).toBe(2);

    const finalize = connector.finalize({
      clientOrderId: "client-1",
      venueOrderId: "venue-1",
      status: "filled"
    });

    validateExecutionPlan(finalize);
    expect(finalize.steps[0]?.kind).toBe("venue.finalizeOrder");
  });

  it("rejects duplicate and cyclic steps", () => {
    expect(() =>
      validateExecutionPlan({
        setup: [],
        steps: [
          createStep({ id: "a", kind: "x", params: {}, dependsOn: ["b"] }),
          createStep({ id: "b", kind: "x", params: {}, dependsOn: ["a"] })
        ]
      })
    ).toThrow(/cycle/);
  });
});
