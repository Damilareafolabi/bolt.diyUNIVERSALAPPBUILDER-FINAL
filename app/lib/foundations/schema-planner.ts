export interface SchemaEntity {
  name: string;
  fields: string;
}

export interface SchemaPlan {
  entities: SchemaEntity[];
  relationships: string[];
  roles: string[];
}

export function generateWorkflowTestCases(plan: SchemaPlan): string[] {
  const scenarios = new Set<string>();

  for (const entity of plan.entities) {
    const name = entity.name.trim();

    if (!name) {
      continue;
    }

    scenarios.add(`Create a valid ${name} and verify it can be read back with its required fields.`);
    scenarios.add(`Reject a ${name} that is missing required fields or has invalid values.`);
  }

  for (const relationship of plan.relationships) {
    const description = relationship.trim();

    if (description) {
      scenarios.add(`Verify the relationship and cardinality: ${description}.`);
    }
  }

  for (const role of plan.roles) {
    const description = role.trim();

    if (description) {
      scenarios.add(`Verify access is restricted according to this role: ${description}.`);
    }
  }

  return Array.from(scenarios).slice(0, 24);
}
