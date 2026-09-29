export type FoundationId =
  | 'web-pwa'
  | 'desktop'
  | 'mobile'
  | 'android'
  | 'ios'
  | 'api-backend';

export type FoundationStatus = 'mvp-engine' | 'candidate-unverified' | 'blocked-license';

export interface FoundationCandidate {
  repository: string;
  revision: string;
  license: string;
  framework: string;
  capabilities: string[];
  validation: 'not-run';
  reason: string;
}

export interface FoundationDefinition {
  id: FoundationId;
  name: string;
  target: string;
  status: FoundationStatus;
  stack: string;
  applicationGeneration: string;
  candidate?: FoundationCandidate;
  alternatives?: FoundationCandidate[];
  notYetSupported?: string;
}

export const FOUNDATION_REGISTRY: readonly FoundationDefinition[] = [
  {
    id: 'web-pwa',
    name: 'Web / PWA Foundation',
    target: 'Web and installable progressive web applications',
    status: 'mvp-engine',
    stack: 'Bolt.diy WebContainer coding workspace; generated app code stays in one selected web foundation.',
    applicationGeneration:
      'Generate the business application inside the selected foundation. Do not merge in a separate inventory, CRM, or other application repository.',
    candidate: {
      repository: 'https://github.com/andre-koga/supanext-starter',
      revision: '74bca419689303d48527f75b0c076c57a0ce3c66',
      license: 'README claims MIT; GitHub license metadata and root LICENSE file were not found.',
      framework: 'Next.js 16, React 19, TypeScript, Supabase, PWA',
      capabilities: ['PWA', 'Supabase Auth', 'local Supabase/Docker', 'Next.js web app'],
      validation: 'not-run',
      reason:
        'Not approved: no discoverable license file/metadata, and install, build, security, and auth/permission validation have not been run.',
    },
    alternatives: [
      {
        repository: 'https://github.com/gcox32/pwa-template',
        revision: '3defdefa8af6dbe6df3ba3d0b414e8ec8d2cae49',
        license: 'README claims MIT; GitHub license metadata and root LICENSE file were not found.',
        framework: 'Next.js 16, React 19, TypeScript, Tailwind CSS v4, next-pwa',
        capabilities: ['PWA manifest', 'service worker', 'offline page', 'install/update prompts'],
        validation: 'not-run',
        reason:
          'Not approved: license is unverified, repository is an initial template commit, and authentication/roles plus dependency compatibility/security/build checks are unverified.',
      },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop Foundation',
    target: 'Windows, macOS, and Linux desktop applications',
    status: 'candidate-unverified',
    stack: 'Tauri preferred; Electron remains an alternative where its runtime better fits.',
    applicationGeneration: 'Generate desktop features within a single validated desktop foundation.',
    candidate: {
      repository: 'https://github.com/tauri-apps/tauri',
      revision: 'not pinned',
      license: 'Apache-2.0 / MIT; verify applicable notices for the selected release.',
      framework: 'Rust + Tauri; frontend choice depends on a separately validated application foundation.',
      capabilities: ['Desktop runtime', 'permission-scoped capabilities', 'cross-platform packaging'],
      validation: 'not-run',
      reason: 'Runtime repository is not a complete product foundation; no secure IPC, UI, auth, tests, or OS package validation was run.',
    },
    notYetSupported: 'No desktop foundation selected or installer build verified.',
  },
  {
    id: 'mobile',
    name: 'Mobile Foundation',
    target: 'Cross-platform mobile application',
    status: 'candidate-unverified',
    stack: 'React Native / Expo candidate.',
    applicationGeneration: 'Generate mobile screens and workflows within a single validated mobile foundation.',
    candidate: {
      repository: 'https://github.com/expo/examples',
      revision: 'not pinned',
      license: 'MIT repository; verify selected example and its dependency notices.',
      framework: 'React Native + Expo',
      capabilities: ['iOS and Android project scaffolding', 'Expo Router examples'],
      validation: 'not-run',
      reason: 'Examples repository is not yet validated as an auth, roles, API, offline, notification, and release-ready product foundation.',
    },
    notYetSupported: 'No mobile app generation or package build is implemented.',
  },
  {
    id: 'android',
    name: 'Android Foundation',
    target: 'Native Android APK and AAB',
    status: 'candidate-unverified',
    stack: 'Kotlin + Jetpack Compose.',
    applicationGeneration: 'Generate native Android features within a single validated Android foundation.',
    candidate: {
      repository: 'https://github.com/android/architecture-samples',
      revision: 'not pinned',
      license: 'Apache-2.0; retain upstream license and notices.',
      framework: 'Kotlin + Jetpack Compose sample architecture',
      capabilities: ['Compose architecture samples', 'Android Gradle builds'],
      validation: 'not-run',
      reason: 'Sample repository is not yet validated for auth, roles, API/local storage, release signing, or APK/AAB packaging here.',
    },
    notYetSupported: 'No APK/AAB generation or Android build environment validation.',
  },
  {
    id: 'ios',
    name: 'iOS Foundation',
    target: 'Native iOS applications',
    status: 'candidate-unverified',
    stack: 'Swift + SwiftUI candidate.',
    applicationGeneration: 'Generate native iOS features within a single validated iOS foundation.',
    candidate: {
      repository: 'https://github.com/pointfreeco/swift-composable-architecture',
      revision: 'not pinned',
      license: 'MIT; retain upstream license and notices.',
      framework: 'Swift + SwiftUI architecture library',
      capabilities: ['State management', 'navigation', 'testable SwiftUI features'],
      validation: 'not-run',
      reason: 'A library, not a complete application foundation; no iOS build or release workflow was validated.',
    },
    notYetSupported: 'iOS package builds require macOS/Xcode; no remote macOS build workflow is implemented.',
  },
  {
    id: 'api-backend',
    name: 'API / Backend Foundation',
    target: 'Versioned APIs and backend services',
    status: 'candidate-unverified',
    stack: 'FastAPI candidate; NestJS/Node may be evaluated for TypeScript-first services.',
    applicationGeneration: 'Generate API domains inside one selected backend foundation.',
    candidate: {
      repository: 'https://github.com/fastapi/full-stack-fastapi-template',
      revision: 'not pinned',
      license: 'MIT; retain upstream license and notices.',
      framework: 'FastAPI + PostgreSQL',
      capabilities: ['Authentication', 'database migrations', 'validation', 'OpenAPI', 'tests'],
      validation: 'not-run',
      reason: 'Candidate only; install, security review, migrations, authorization model, test suite, and deployment workflow have not been run here.',
    },
    notYetSupported: 'No API/backend foundation selected or server deployment verified.',
  },
] as const;

export function getFoundation(id: FoundationId): FoundationDefinition {
  const foundation = FOUNDATION_REGISTRY.find((item) => item.id === id);

  if (!foundation) {
    throw new Error(`Unknown foundation target: ${id}`);
  }

  return foundation;
}

export function getFoundationForWebApp(isPwa: boolean): FoundationDefinition {
  const foundation = getFoundation('web-pwa');

  if (foundation.status !== 'mvp-engine') {
    throw new Error('The web/PWA coding foundation is not available.');
  }

  return {
    ...foundation,
    target: isPwa ? 'Progressive web application' : 'Web application',
  };
}
