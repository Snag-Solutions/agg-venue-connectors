import type { PlopTypes } from "@turbo/gen";

interface ConnectorAnswers {
  id: string;
  displayName: string;
  chainId: string;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setHelper("kebabCase", kebabCase);
  plop.setHelper("camelCase", camelCase);
  plop.setHelper("pascalCase", pascalCase);
  plop.setHelper("constantCase", constantCase);

  plop.setGenerator("connector", {
    description: "Create a venue connector with manifest, execution, charting, tests, and Rust stubs",
    prompts: [
      {
        type: "input",
        name: "id",
        message: "Venue id (kebab-case)",
        validate(value: string) {
          return /^[a-z][a-z0-9-]*$/.test(value)
            ? true
            : "Use lower-case kebab-case, for example acme-markets";
        }
      },
      {
        type: "input",
        name: "displayName",
        message: "Display name",
        default(answers: Partial<ConnectorAnswers>) {
          return titleCase(answers.id ?? "new-venue");
        }
      },
      {
        type: "input",
        name: "chainId",
        message: "Primary chain id",
        default: "8453",
        validate(value: string) {
          const parsed = Number(value);
          return Number.isInteger(parsed) && parsed > 0 ? true : "Enter a positive integer";
        }
      }
    ],
    actions(answers) {
      const actions: PlopTypes.ActionType[] = [
        {
          type: "addMany",
          destination: "connectors/{{kebabCase id}}",
          base: "templates/connector",
          templateFiles: "templates/connector/**",
          globOptions: {
            dot: true
          },
          abortOnFail: true
        }
      ];

      return actions;
    }
  });
}

function kebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function camelCase(value: string): string {
  const kebab = kebabCase(value);
  return kebab.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function pascalCase(value: string): string {
  const camel = camelCase(value);
  return `${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

function constantCase(value: string): string {
  return kebabCase(value).replace(/-/g, "_").toUpperCase();
}

function titleCase(value: string): string {
  return kebabCase(value)
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
