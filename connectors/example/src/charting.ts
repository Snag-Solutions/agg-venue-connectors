import type { ChartRequestResolution, ChartResolveInput } from "@agg/execution-kit";

export function resolveExampleChartRequest(input: ChartResolveInput): ChartRequestResolution {
  return {
    marketIdentifier: input.venueMarketId,
    complementBehavior: "none"
  };
}
