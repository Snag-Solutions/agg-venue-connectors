import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { generatedFixtureFiles } from "../fixtures/src/index";
import { venueManifestSchema } from "../packages/venue-manifest/src/index";

const generatedRoot = join(process.cwd(), "generated");

await rm(generatedRoot, { recursive: true, force: true });

await writeJson(
  "manifests/venue.schema.json",
  z.toJSONSchema(venueManifestSchema, {
    target: "draft-2020-12"
  })
);

for (const [path, value] of Object.entries(generatedFixtureFiles)) {
  await writeJson(path, value);
}

console.log(`Generated artifacts in ${generatedRoot}`);

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = join(generatedRoot, path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
