export interface SchemaEntity {
  name: string;
  fields: string;
}

export interface SchemaPlan {
  entities: SchemaEntity[];
  relationships: string[];
  roles: string[];
}

export function buildWebPwaFoundationRequirements(isPwa: boolean): string[] {
  return [
    "Create a polished, responsive web application using the existing project stack; do not replace the user's framework or project configuration.",
    'Build a consistent application shell with an accessible responsive sidebar, primary navigation derived from the requested screens, current-location indication, and a mobile navigation fallback.',
    'For each approved data entity, create a usable list/table view with relevant columns, empty/loading/error states, and search or filtering when it fits the workflow.',
    'For each entity users can manage, create validated create/edit forms with labels, required-field feedback, and confirmation before destructive actions.',
    'Implement email/password sign-up, sign-in, sign-out, protected routes, and role-aware navigation when the chosen authentication service and configuration support them; provide a Google OAuth entry point only when configured. Document missing provider setup and never simulate a successful login.',
    'Keep persistence behind a small data-access layer. Use the database service actually selected and configured for this project; document required environment variable names without values. If no service is configured, make the missing persistence explicit instead of silently presenting browser-only demo data as durable.',
    'Use the approved relationships and roles in data access and UI permissions; hiding a control is not a substitute for server-side authorization.',
    'Keep generated application secrets separate from Simeony model-provider credentials. Do not copy generation API keys into generated files, browser bundles, logs, or exports.',
    'Include setup documentation and focused tests for authentication gates, entity validation, core create/read/update flows, and role restrictions using the generated schema acceptance scenarios.',
    ...(isPwa
      ? [
          'For the PWA target, add a valid web app manifest, installable icons, and a service worker with a conservative offline strategy; verify the production build and installability before claiming PWA support.',
        ]
      : []),
  ];
}

export function generateWorkflowTestCases(plan: SchemaPlan): string[] {
  const scenarios = new Set<string>();

  for (const entity of plan.entities) {
    const name = entity.name.trim();

    if (!name) {
      continue;
    }

    scenarios.add(`Create a valid ${name} and verify it can be read back with its required fields.`);
    scenarios.add(`Reject an invalid ${name} that is missing required fields or has invalid values.`);
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
