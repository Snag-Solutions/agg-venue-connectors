import {
  type ChartResolveInput,
  type ExecutionBuildInput,
  type FinalizeInput,
  type SetupPlanInput,
  type VenueExecutionConnector,
  validateExecutionPlan,
  validateSetupPlan
} from "@agg/execution-kit";
import { describe, expect, it } from "vitest";

export interface ExecutionConformanceFixture {
  setupInput?: SetupPlanInput;
  buyInput?: ExecutionBuildInput;
  sellInput?: ExecutionBuildInput;
  finalizeInput?: FinalizeInput;
  chartInput?: ChartResolveInput;
}

export function defaultExecutionFixture(venue: string): Required<ExecutionConformanceFixture> {
  const setupInput = {
    userId: "user-fixture",
    walletAddress: "0x0000000000000000000000000000000000000001",
    venueMarketId: `${venue}-market-fixture`,
    outcomeId: "yes",
    metadata: {}
  } satisfies SetupPlanInput;

  return {
    setupInput,
    buyInput: {
      ...setupInput,
      clientOrderId: `${venue}-buy-fixture`,
      side: "buy",
      quantity: "10",
      limitPrice: "0.51"
    },
    sellInput: {
      ...setupInput,
      clientOrderId: `${venue}-sell-fixture`,
      side: "sell",
      quantity: "10",
      limitPrice: "0.49"
    },
    finalizeInput: {
      clientOrderId: `${venue}-buy-fixture`,
      venueOrderId: `${venue}-order-fixture`,
      status: "filled"
    },
    chartInput: {
      venue,
      venueMarketId: `${venue}-market-fixture`,
      outcomeId: "yes",
      interval: "1h",
      countBack: 24
    }
  };
}

export function runExecutionConnectorConformance(
  connectorName: string,
  connector: VenueExecutionConnector,
  fixture: ExecutionConformanceFixture = {}
): void {
  const merged = {
    ...defaultExecutionFixture(connector.manifest.id),
    ...fixture
  };

  describe(`${connectorName} execution connector conformance`, () => {
    it("declares a valid manifest", () => {
      expect(connector.manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(connector.manifest.apiVersion).toBe("2026-06-connector-v1");
    });

    it("returns setup requirements that match declared chains", () => {
      const setup = connector.planSetup(merged.setupInput);
      validateSetupPlan(setup, connector.manifest);
      expect(setup).toEqual(expect.any(Array));
    });

    if (connector.manifest.capabilities.execution.buy) {
      it("builds a valid buy execution plan", () => {
        const plan = connector.buildBuy(merged.buyInput);
        validateSetupPlan(plan.setup, connector.manifest);
        validateExecutionPlan(plan);
        expect(plan.steps[0]?.params.venue).toBe(connector.manifest.id);
      });
    }

    if (connector.manifest.capabilities.execution.sell) {
      it("builds a valid sell execution plan", () => {
        const plan = connector.buildSell(merged.sellInput);
        validateSetupPlan(plan.setup, connector.manifest);
        validateExecutionPlan(plan);
        expect(plan.steps[0]?.params.venue).toBe(connector.manifest.id);
      });
    }

    it("builds a valid finalize execution plan", () => {
      const plan = connector.finalize(merged.finalizeInput);
      validateExecutionPlan(plan);
      expect(plan.setup).toHaveLength(0);
    });

    const resolveChartRequest = connector.resolveChartRequest;
    if (connector.manifest.capabilities.chartBars && resolveChartRequest) {
      it("resolves chart requests without host-specific routing switches", () => {
        const resolution = resolveChartRequest(merged.chartInput);
        expect(resolution?.marketIdentifier).toEqual(expect.any(String));
      });
    }
  });
}
