import type { SimeonyTarget } from './registry';

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

export function buildFoundationRequirements(target: SimeonyTarget): string[] {
  if (target === 'web' || target === 'pwa') {
    return buildWebPwaFoundationRequirements(target === 'pwa');
  }

  if (target === 'mobile') {
    return [
      'Create a separate React Native application using Expo and TypeScript. Do not copy web-only components or merge another app repository.',
      'Use native stack navigation with screen routes derived from the approved screens, accessible navigation labels, and platform back behavior.',
      'Implement reusable mobile data-list screens with touch-sized actions, loading/empty/error states, and pagination or incremental loading when appropriate.',
      'Place approved entities behind typed repository interfaces so screens do not depend directly on persistence or remote API details.',
      'Add an offline-capable local persistence adapter using Expo SQLite, including explicit schema versioning and migration boundaries. Document that remote synchronization, conflict resolution, and encryption are separate capabilities unless actually implemented.',
      'Use Expo-compatible dependency versions aligned to the selected Expo SDK. Verify native packages and do not claim iOS/Android compilation unless a matching native toolchain was run.',
      'Implement authentication, role checks, and remote persistence only for configured services; never fake login success or copy Simeony model-provider credentials into the generated application.',
      'Generate mobile-specific acceptance tests for navigation, offline data operations, validation, and role restrictions; include setup commands and configuration placeholders without secret values.',
    ];
  }

  return [
    'Create a desktop application shell with Electron, matching the existing Simeony desktop host conventions where they apply. Do not create a second business-logic implementation.',
    'Keep domain models, validation, and data-access contracts in a shared application layer; make the desktop shell consume these contracts through the renderer.',
    'Use a minimal preload bridge with context isolation enabled, no renderer Node integration, and narrowly allowlisted IPC methods. Never expose unrestricted filesystem, shell, or process execution to renderer code.',
    'Apply least-privilege navigation and filesystem access, validate IPC payloads, and document any operating-system permissions.',
    'Reuse the existing Web/PWA authentication and data contracts where technically appropriate; do not duplicate business rules or bypass server-side authorization.',
    'Add desktop packaging scripts and platform metadata only using dependencies/configuration confirmed in the target project. Verify the current platform build before claiming Windows, macOS, or Linux installers are ready.',
    'Tauri is not configured as a generated target in this foundation; do not emit an unverified Tauri wrapper or merge its runtime with Electron.',
    'Generate desktop-specific acceptance tests for shell startup, safe IPC boundaries, core workflows, and handoff/setup requirements.',
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
