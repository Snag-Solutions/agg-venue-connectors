import { createDeclarativeExecutionConnector } from "@agg/execution-kit";
import { resolveExampleChartRequest } from "./charting";
import { exampleManifest } from "./manifest";

export const exampleExecution = createDeclarativeExecutionConnector({
  manifest: exampleManifest,
  statusFilter: {
    channel: "venue.example.order-status",
    key: "venueOrderId",
    valueSource: "venueOrderId",
    retryOnTimeout: false
  },
  resolveChartRequest: resolveExampleChartRequest
});
