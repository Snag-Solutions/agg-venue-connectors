import { z } from "zod";

export const CONNECTOR_API_VERSION = "2026-06-connector-v1" as const;

export const venueIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/, "venue ids must be lower-case kebab-case");

export const tokenRefSchema = z
  .object({
    symbol: z.string().min(1).max(32),
    decimals: z.number().int().min(0).max(36).optional(),
    address: z.string().min(1).optional()
  })
  .strict();

export const addressRefSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("static"),
      address: z.string().min(1)
    })
    .strict(),
  z
    .object({
      kind: z.literal("dynamic"),
      source: z.enum(["market", "outcome", "quote", "host"])
    })
    .strict(),
  z
    .object({
      kind: z.literal("role"),
      role: z.enum([
        "managedEvmWallet",
        "managedSvmWallet",
        "venueDepositWallet",
        "venueSettlementContract",
        "venueOrderContract"
      ])
    })
    .strict()
]);

export const setupSubstepSchema = z
  .object({
    id: z.string().min(1),
    kind: z.string().min(1),
    description: z.string().min(1),
    paramsSchema: z.record(z.string(), z.unknown()).default({})
  })
  .strict();

export const setupRequirementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("chainApproval"),
      chainId: z.number().int().positive(),
      token: tokenRefSchema,
      spender: addressRefSchema,
      approval: z.enum(["erc20Allowance", "erc1155Operator"]).default("erc20Allowance"),
      proofKey: z.literal("venue_chain_approval").default("venue_chain_approval")
    })
    .strict(),
  z
    .object({
      kind: z.literal("marketAta"),
      chainId: z.number().int().positive(),
      venueMarketIdSource: z.enum(["market", "outcome"]),
      proofKey: z.literal("venue_market_ata").default("venue_market_ata")
    })
    .strict(),
  z
    .object({
      kind: z.literal("depositWallet"),
      chainId: z.number().int().positive(),
      watcherRole: z.literal("venueDepositWallet"),
      proofKey: z.literal("venue_deposit_wallet").default("venue_deposit_wallet")
    })
    .strict(),
  z
    .object({
      kind: z.literal("bundledUserOp"),
      chainId: z.number().int().positive(),
      proofKey: z.literal("venue_chain_approval").default("venue_chain_approval"),
      steps: z.array(setupSubstepSchema).min(1)
    })
    .strict(),
  z
    .object({
      kind: z.literal("preSubmitMutation"),
      name: z.literal("deauthorize7702"),
      chainId: z.number().int().positive(),
      reason: z.string().min(1)
    })
    .strict()
]);

export const chainWatcherSchema = z
  .object({
    kind: z.literal("addressActivity"),
    provider: z.enum(["host", "alchemy-notify", "custom"]).default("host"),
    chainId: z.number().int().positive(),
    addressRole: z.enum([
      "managedEvmWallet",
      "managedSvmWallet",
      "venueDepositWallet",
      "venueSettlementContract",
      "venueOrderContract"
    ]),
    tokenFilters: z.array(z.string().min(1)).default([])
  })
  .strict();

export const venueCapabilitiesSchema = z
  .object({
    discovery: z.boolean().default(false),
    orderbook: z.boolean().default(false),
    chartBars: z.boolean().default(false),
    execution: z
      .object({
        buy: z.boolean().default(false),
        sell: z.boolean().default(false),
        cancel: z.boolean().default(false),
        redeem: z.boolean().default(false)
      })
      .strict()
      .default({ buy: false, sell: false, cancel: false, redeem: false })
  })
  .strict();

export const chartingSchema = z
  .object({
    identifierSource: z.enum(["venueOutcomeIdentity", "marketIdentifier", "connectorResolved"]),
    supportedIntervals: z.array(z.enum(["1m", "5m", "15m", "1h", "1d"])).min(1),
    complementPolicy: z.enum(["none", "hostCanInvert", "connectorHandlesComplement"]),
    cachePolicy: z.enum(["connectorOwned", "hostOwned"]).default("connectorOwned")
  })
  .strict();

export const envVarSchema = z
  .object({
    name: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    required: z.boolean().default(true),
    description: z.string().min(1)
  })
  .strict();

export const venueManifestSchema = z
  .object({
    id: venueIdSchema,
    displayName: z.string().min(1),
    apiVersion: z.literal(CONNECTOR_API_VERSION),
    package: z
      .object({
        npm: z.string().min(1).optional(),
        crate: z.string().min(1).optional()
      })
      .strict()
      .default({}),
    capabilities: venueCapabilitiesSchema,
    chains: z.array(z.number().int().positive()).default([]),
    env: z.array(envVarSchema).default([]),
    setup: z.array(setupRequirementSchema).default([]),
    watchers: z.array(chainWatcherSchema).default([]),
    charting: chartingSchema.optional(),
    notes: z.array(z.string().min(1)).default([])
  })
  .strict()
  .superRefine((manifest, ctx) => {
    if (manifest.capabilities.chartBars && !manifest.charting) {
      ctx.addIssue({
        code: "custom",
        message: "venues with chartBars capability must declare charting"
      });
    }

    const knownChains = new Set(manifest.chains);
    for (const [index, watcher] of manifest.watchers.entries()) {
      if (!knownChains.has(watcher.chainId)) {
        ctx.addIssue({
          code: "custom",
          path: ["watchers", index, "chainId"],
          message: `watcher chain ${watcher.chainId} must be listed in chains`
        });
      }
    }

    for (const [index, setup] of manifest.setup.entries()) {
      if ("chainId" in setup && !knownChains.has(setup.chainId)) {
        ctx.addIssue({
          code: "custom",
          path: ["setup", index, "chainId"],
          message: `setup chain ${setup.chainId} must be listed in chains`
        });
      }
    }
  });

export type VenueId = z.infer<typeof venueIdSchema>;
export type TokenRef = z.infer<typeof tokenRefSchema>;
export type AddressRef = z.infer<typeof addressRefSchema>;
export type SetupRequirement = z.infer<typeof setupRequirementSchema>;
export type ChainWatcher = z.infer<typeof chainWatcherSchema>;
export type VenueCapabilities = z.infer<typeof venueCapabilitiesSchema>;
export type Charting = z.infer<typeof chartingSchema>;
export type VenueManifest = z.infer<typeof venueManifestSchema>;
export type VenueManifestInput = z.input<typeof venueManifestSchema>;

export function defineAggVenue(manifest: VenueManifestInput): VenueManifest {
  return venueManifestSchema.parse(manifest);
}

export function parseVenueManifest(input: unknown): VenueManifest {
  return venueManifestSchema.parse(input);
}

export function setupRequiresWatcher(setup: SetupRequirement): boolean {
  return setup.kind === "depositWallet";
}

export function chainWatcherKey(watcher: ChainWatcher): string {
  return `${watcher.kind}:${watcher.provider}:${watcher.chainId}:${watcher.addressRole}`;
}
