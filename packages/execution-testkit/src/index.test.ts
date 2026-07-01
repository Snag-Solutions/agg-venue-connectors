import { describe, expect, it } from "vitest";
import { defaultExecutionFixture } from "./index";

describe("defaultExecutionFixture", () => {
  it("creates deterministic connector fixture inputs", () => {
    const fixture = defaultExecutionFixture("example");

    expect(fixture.buyInput.clientOrderId).toBe("example-buy-fixture");
    expect(fixture.sellInput.side).toBe("sell");
    expect(fixture.chartInput.venue).toBe("example");
  });
});
