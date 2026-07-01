import { describe, expect, it } from "vitest";
import { CONNECTOR_API_VERSION, defineAggVenue } from "./index";

describe("defineAggVenue", () => {
  it("accepts a venue with setup, charting, and host-owned watchers", () => {
    const manifest = defineAggVenue({
      id: "example",
      displayName: "Example",
      apiVersion: CONNECTOR_API_VERSION,
      capabilities: {
        discovery: true,
        orderbook: true,
        chartBars: true,
        execution: { buy: true, sell: true }
      },
      chains: [8453],
      setup: [
        {
          kind: "chainApproval",
          chainId: 8453,
          token: { symbol: "USDC", decimals: 6 },
          spender: { kind: "dynamic", source: "market" }
        }
      ],
      watchers: [
        {
          kind: "addressActivity",
          chainId: 8453,
          addressRole: "managedEvmWallet"
        }
      ],
      charting: {
        identifierSource: "venueOutcomeIdentity",
        supportedIntervals: ["1m", "1h"],
        complementPolicy: "hostCanInvert"
      }
    });

    expect(manifest.watchers[0]?.provider).toBe("host");
    expect(manifest.setup[0]?.kind).toBe("chainApproval");
  });

  it("requires charting when chartBars are enabled", () => {
    expect(() =>
      defineAggVenue({
        id: "bad-chart",
        displayName: "Bad Chart",
        apiVersion: CONNECTOR_API_VERSION,
        capabilities: {
          chartBars: true
        }
      })
    ).toThrow(/charting/);
  });

  it("rejects watcher chains that are not declared by the venue", () => {
    expect(() =>
      defineAggVenue({
        id: "bad-chain",
        displayName: "Bad Chain",
        apiVersion: CONNECTOR_API_VERSION,
        capabilities: {},
        chains: [1],
        watchers: [
          {
            kind: "addressActivity",
            chainId: 8453,
            addressRole: "managedEvmWallet"
          }
        ]
      })
    ).toThrow(/must be listed in chains/);
  });
});
