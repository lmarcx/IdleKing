export type RegistryEntry = {
  id: string;
};

export type RegistryReferenceValue = string | readonly string[] | null | undefined;

export type RegistryReference<TEntry extends RegistryEntry> = {
  field: string;
  targetRegistry: string;
  select(entry: TEntry): RegistryReferenceValue;
};

export type RegistryDefinition<TEntry extends RegistryEntry = RegistryEntry> = {
  name: string;
  entries: readonly TEntry[];
  references?: readonly RegistryReference<TEntry>[];
};

export type RegistryValidationIssue =
  | {
      code: "DUPLICATE_ID";
      registry: string;
      sourceId: string;
      message: string;
    }
  | {
      code: "MISSING_TARGET_REGISTRY";
      registry: string;
      sourceId: string;
      field: string;
      targetRegistry: string;
      message: string;
    }
  | {
      code: "MISSING_REFERENCE";
      registry: string;
      sourceId: string;
      field: string;
      targetRegistry: string;
      missingRef: string;
      message: string;
    };

type AnyRegistryDefinition = RegistryDefinition<any>;

export class RegistryValidationError extends Error {
  readonly issues: readonly RegistryValidationIssue[];

  constructor(issues: readonly RegistryValidationIssue[]) {
    super(`Registry validation failed:\n${issues.map((issue) => `- ${issue.message}`).join("\n")}`);
    this.name = "RegistryValidationError";
    this.issues = issues;
  }
}

export function defineRegistry<TEntry extends RegistryEntry>(
  registry: RegistryDefinition<TEntry>
): RegistryDefinition<TEntry> {
  return registry;
}

function toReferences(value: RegistryReferenceValue): readonly string[] {
  if (value == null) return [];
  return typeof value === "string" ? [value] : value;
}

export function validateRegistries(
  registries: readonly AnyRegistryDefinition[]
): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const idsByRegistry = new Map<string, Set<string>>();

  for (const registry of registries) {
    const ids = idsByRegistry.get(registry.name) ?? new Set<string>();
    idsByRegistry.set(registry.name, ids);

    for (const entry of registry.entries) {
      if (ids.has(entry.id)) {
        issues.push({
          code: "DUPLICATE_ID",
          registry: registry.name,
          sourceId: entry.id,
          message: `Registry "${registry.name}" has duplicate id "${entry.id}".`,
        });
      }
      ids.add(entry.id);
    }
  }

  for (const registry of registries) {
    for (const reference of registry.references ?? []) {
      const targetIds = idsByRegistry.get(reference.targetRegistry);

      for (const entry of registry.entries) {
        if (!targetIds) {
          issues.push({
            code: "MISSING_TARGET_REGISTRY",
            registry: registry.name,
            sourceId: entry.id,
            field: reference.field,
            targetRegistry: reference.targetRegistry,
            message: `Registry "${registry.name}": source "${entry.id}" field "${reference.field}" targets missing registry "${reference.targetRegistry}".`,
          });
          continue;
        }

        for (const ref of toReferences(reference.select(entry))) {
          if (targetIds.has(ref)) continue;
          issues.push({
            code: "MISSING_REFERENCE",
            registry: registry.name,
            sourceId: entry.id,
            field: reference.field,
            targetRegistry: reference.targetRegistry,
            missingRef: ref,
            message: `Registry "${registry.name}": source "${entry.id}" field "${reference.field}" references missing "${ref}" in registry "${reference.targetRegistry}".`,
          });
        }
      }
    }
  }

  return issues;
}

export function assertValidRegistries(registries: readonly AnyRegistryDefinition[]): void {
  const issues = validateRegistries(registries);
  if (issues.length > 0) {
    throw new RegistryValidationError(issues);
  }
}
