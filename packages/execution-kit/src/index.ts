import type { SetupRequirement, VenueManifest } from "@agg/venue-manifest";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type TradeSide = "buy" | "sell";
export type OrderStatus = "unknown" | "pending" | "filled" | "partial" | "rejected" | "cancelled";

export interface SetupPlanInput {
  userId: string;
  walletAddress?: string;
  venueMarketId: string;
  outcomeId: string;
  metadata?: JsonObject;
}

export interface ExecutionBuildInput extends SetupPlanInput {
  clientOrderId: string;
  side: TradeSide;
  quantity: string;
  limitPrice: string;
}

export interface FinalizeInput {
  clientOrderId: string;
  venueOrderId?: string;
  status: OrderStatus;
  metadata?: JsonObject;
}

export interface OrderStatusInput {
  clientOrderId: string;
  venueOrderId?: string;
  metadata?: JsonObject;
}

export interface OrderStatusResult {
  status: OrderStatus;
  venueOrderId?: string;
  filledQuantity?: string;
  remainingQuantity?: string;
  raw?: JsonObject;
}

export interface ExecutionStep {
  id: string;
  kind: string;
  params: JsonObject;
  dependsOn?: string[];
  timeoutMs?: number;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface VenueOrderStatusFilter {
  channel: string;
  key: string;
  valueSource: "clientOrderId" | "venueOrderId" | "metadata";
  retryOnTimeout: boolean;
}

export interface ExecutionPlan {
  setup: SetupRequirement[];
  steps: ExecutionStep[];
  statusFilter?: VenueOrderStatusFilter;
  metadata?: JsonObject;
}

export interface ChartResolveInput {
  venue: string;
  venueMarketId: string;
  outcomeId: string;
  interval: "1m" | "5m" | "15m" | "1h" | "1d";
  countBack?: number;
  fromUnixSeconds?: number;
  toUnixSeconds?: number;
  metadata?: JsonObject;
}

export interface ChartRequestResolution {
  marketIdentifier: string;
  complementBehavior: "none" | "invert";
  metadata?: JsonObject;
}

export interface VenueExecutionConnector {
  manifest: VenueManifest;
  planSetup(input: SetupPlanInput): SetupRequirement[];
  buildBuy(input: ExecutionBuildInput): ExecutionPlan;
  buildSell(input: ExecutionBuildInput): ExecutionPlan;
  finalize(input: FinalizeInput): ExecutionPlan;
  verifyOrderStatus?(input: OrderStatusInput): Promise<OrderStatusResult>;
  resolveChartRequest?(input: ChartResolveInput): ChartRequestResolution | null;
}

export interface DeclarativeExecutionOptions {
  manifest: VenueManifest;
  statusFilter?: {
    channel?: string;
    key: string;
    valueSource?: "clientOrderId" | "venueOrderId" | "metadata";
    retryOnTimeout?: boolean;
  };
  planSetup?: (input: SetupPlanInput) => SetupRequirement[];
  resolveChartRequest?: (input: ChartResolveInput) => ChartRequestResolution | null;
}

export function defineVenueExecutionConnector(
  connector: VenueExecutionConnector
): VenueExecutionConnector {
  assertManifestSupportsExecution(connector.manifest);
  return connector;
}

export function createDeclarativeExecutionConnector(
  options: DeclarativeExecutionOptions
): VenueExecutionConnector {
  const planSetup = options.planSetup ?? (() => options.manifest.setup);
  const channel = options.statusFilter?.channel ?? `venue.${options.manifest.id}.orders`;

  return defineVenueExecutionConnector({
    manifest: options.manifest,
    planSetup,
    buildBuy(input) {
      return buildSubmitPlan(options.manifest, input, "buy", planSetup(input), {
        channel,
        key: options.statusFilter?.key ?? "venueOrderId",
        valueSource: options.statusFilter?.valueSource ?? "venueOrderId",
        retryOnTimeout: options.statusFilter?.retryOnTimeout ?? false
      });
    },
    buildSell(input) {
      return buildSubmitPlan(options.manifest, input, "sell", planSetup(input), {
        channel,
        key: options.statusFilter?.key ?? "venueOrderId",
        valueSource: options.statusFilter?.valueSource ?? "venueOrderId",
        retryOnTimeout: options.statusFilter?.retryOnTimeout ?? false
      });
    },
    finalize(input) {
      return {
        setup: [],
        steps: [
          createStep({
            id: "finalize",
            kind: "venue.finalizeOrder",
            params: {
              venue: options.manifest.id,
              clientOrderId: input.clientOrderId,
              venueOrderId: input.venueOrderId ?? null,
              status: input.status,
              metadata: input.metadata ?? {}
            }
          })
        ]
      };
    },
    resolveChartRequest: options.resolveChartRequest
  });
}

export function createStep(step: ExecutionStep): ExecutionStep {
  if (!step.id.trim()) {
    throw new Error("step id is required");
  }
  if (!step.kind.trim()) {
    throw new Error(`step ${step.id} must declare a kind`);
  }
  return {
    dependsOn: [],
    ...step
  };
}

export function validateExecutionPlan(plan: ExecutionPlan): void {
  if (plan.steps.length === 0) {
    throw new Error("execution plan must contain at least one step");
  }

  const stepIds = new Set<string>();
  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      throw new Error(`duplicate execution step id: ${step.id}`);
    }
    stepIds.add(step.id);
  }

  for (const step of plan.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!stepIds.has(dep)) {
        throw new Error(`step ${step.id} depends on missing step ${dep}`);
      }
      if (dep === step.id) {
        throw new Error(`step ${step.id} cannot depend on itself`);
      }
    }
  }

  assertAcyclic(plan.steps);
}

export function validateSetupPlan(setup: SetupRequirement[], manifest: VenueManifest): void {
  const knownChains = new Set(manifest.chains);
  for (const requirement of setup) {
    if ("chainId" in requirement && !knownChains.has(requirement.chainId)) {
      throw new Error(
        `setup requirement ${requirement.kind} references undeclared chain ${requirement.chainId}`
      );
    }
  }
}

export function assertManifestSupportsExecution(manifest: VenueManifest): void {
  const execution = manifest.capabilities.execution;
  if (!execution.buy && !execution.sell && !execution.cancel && !execution.redeem) {
    throw new Error(`venue ${manifest.id} does not declare execution capabilities`);
  }
}

function buildSubmitPlan(
  manifest: VenueManifest,
  input: ExecutionBuildInput,
  side: TradeSide,
  setup: SetupRequirement[],
  statusFilter: VenueOrderStatusFilter
): ExecutionPlan {
  if (input.side !== side) {
    throw new Error(`build${capitalize(side)} received ${input.side} input`);
  }

  const step = createStep({
    id: `submit-${side}`,
    kind: "venue.submitOrder",
    params: {
      venue: manifest.id,
      side,
      clientOrderId: input.clientOrderId,
      venueMarketId: input.venueMarketId,
      outcomeId: input.outcomeId,
      quantity: input.quantity,
      limitPrice: input.limitPrice,
      metadata: input.metadata ?? {}
    },
    timeoutMs: statusFilter.retryOnTimeout ? 30_000 : 60_000,
    retry: statusFilter.retryOnTimeout ? { maxAttempts: 2, backoffMs: 750 } : undefined
  });

  return {
    setup,
    steps: [step],
    statusFilter,
    metadata: {
      venue: manifest.id,
      side
    }
  };
}

function assertAcyclic(steps: ExecutionStep[]): void {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      throw new Error(`execution plan contains a cycle at step ${id}`);
    }
    visiting.add(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const step of steps) {
    visit(step.id);
  }
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
