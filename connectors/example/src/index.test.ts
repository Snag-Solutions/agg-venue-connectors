import { runExecutionConnectorConformance } from "@agg/execution-testkit";
import { exampleBuyFixture, exampleExecution } from "./index";

runExecutionConnectorConformance("example", exampleExecution, {
  buyInput: exampleBuyFixture
});
