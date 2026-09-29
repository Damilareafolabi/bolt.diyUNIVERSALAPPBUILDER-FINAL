import { useNavigate } from '@remix-run/react';
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  FileCode2,
  FileUp,
  FolderOpen,
  Globe2,
  GraduationCap,
  HeartPulse,
  Image,
  Layers3,
  MessagesSquare,
  MoreHorizontal,
  Music2,
  Plus,
  ShoppingCart,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
  Video,
  Building2,
  Camera,
  Search,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Users,
  Bot,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import JSZip from 'jszip';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { toast } from 'react-toastify';
import { FOUNDATION_REGISTRY, getFoundationForWebApp } from '~/lib/foundations/registry';
import { generateWorkflowTestCases } from '~/lib/foundations/schema-planner';
import './FactoryLaunchpad.scss';

type ProjectType = 'Web' | 'PWA';
type OnboardingStep = 'welcome' | 'category' | 'target' | 'referral' | 'builder';
type AppCategory =
  | 'Business Tools & SaaS'
  | 'AI Application'
  | 'AI Image Generator'
  | 'AI Video Creator'
  | 'E-Commerce'
  | 'Social Network'
  | 'Corporate Website'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Education'
  | 'Photography'
  | 'Productivity'
  | 'Other';
type LocalFile = { path: string; content: string };
type DataEntity = { name: string; fields: string };
type CodebaseAnalysis = {
  fileCount: number;
  packageManager: string;
  framework: string;
  language: string;
  database: string;
  authentication: string;
  build: string;
  tests: string;
  license: string;
  routes: string[];
  securityNotes: string[];
};

const MAX_FILES = 140;
const MAX_TOTAL_BYTES = 512 * 1024;
const MAX_ARCHIVE_BYTES = 4 * 1024 * 1024;
const IMPORT_KEY = 'universal-builder:pending-import';
const OMIT_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', '.cache', '.turbo']);
const TEXT_FILE_PATTERN =
  /\.(?:[cm]?[jt]sx?|json|html?|css|scss|sass|less|md|mdx|ya?ml|toml|xml|svg|sql|prisma|env\.example|gitignore|npmrc|nvmrc)$/i;

const domainDefinitions: Array<{ terms: string[]; entities: DataEntity[]; relationships: string[] }> = [
  {
    terms: ['inventory', 'stock', 'warehouse', 'products'],
    entities: [
      {
        name: 'Product',
        fields:
          'name: text, sku: text (unique), description: text, unitPrice: decimal, reorderLevel: integer, isActive: boolean',
      },
      {
        name: 'StockMovement',
        fields:
          'productId: relation(Product), quantity: integer, movementType: enum(in, out, adjustment), reason: text, occurredAt: datetime',
      },
      { name: 'Supplier', fields: 'name: text, email: email, phone: text, address: text' },
    ],
    relationships: ['Product 1 → many StockMovement', 'Supplier 1 → many Products (confirm business rule)'],
  },
  {
    terms: ['customer', 'client', 'crm', 'contact'],
    entities: [
      {
        name: 'Customer',
        fields: 'name: text, email: email, phone: text, status: enum(lead, active, inactive), notes: text',
      },
      {
        name: 'Interaction',
        fields:
          'customerId: relation(Customer), type: enum(call, email, meeting, note), summary: text, occurredAt: datetime',
      },
      { name: 'User', fields: 'name: text, email: email, roleId: relation(Role), isActive: boolean' },
    ],
    relationships: ['Customer 1 → many Interactions', 'User 1 → many Interactions'],
  },
  {
    terms: ['order', 'delivery', 'shipment', 'purchase'],
    entities: [
      { name: 'Customer', fields: 'name: text, email: email, phone: text' },
      {
        name: 'Order',
        fields:
          'customerId: relation(Customer), status: enum(draft, confirmed, fulfilled, cancelled), total: decimal, placedAt: datetime',
      },
      {
        name: 'OrderLine',
        fields: 'orderId: relation(Order), description: text, quantity: integer, unitPrice: decimal',
      },
      {
        name: 'Delivery',
        fields:
          'orderId: relation(Order), status: enum(pending, in_transit, delivered), scheduledAt: datetime, deliveredAt: datetime',
      },
    ],
    relationships: ['Customer 1 → many Orders', 'Order 1 → many OrderLines', 'Order 1 → 0..1 Deliveries'],
  },
  {
    terms: ['employee', 'staff', 'asset', 'expense', 'project', 'task', 'job', 'work order'],
    entities: [
      { name: 'User', fields: 'name: text, email: email, roleId: relation(Role), isActive: boolean' },
      {
        name: 'WorkItem',
        fields:
          'title: text, description: text, status: enum(open, in_progress, blocked, complete), priority: enum(low, normal, high), dueDate: date',
      },
      {
        name: 'Activity',
        fields: 'workItemId: relation(WorkItem), userId: relation(User), event: text, occurredAt: datetime',
      },
    ],
    relationships: ['User 1 → many WorkItems (assignee)', 'WorkItem 1 → many Activities'],
  },
];

const initialRoles = [
  'Admin: manage users, settings, and all application records',
  'Member: access the features and records assigned to their role',
];
const initialRules =
  'Confirm account ownership, data retention, and any sensitive information before using production data.';
const appCategories: Array<{ name: AppCategory; description: string; icon: LucideIcon }> = [
  { name: 'Entertainment', description: 'Media, music and creative experiences', icon: Music2 },
  { name: 'Business Tools & SaaS', description: 'Internal tools and SaaS products', icon: BriefcaseBusiness },
  { name: 'AI Application', description: 'AI-powered products and assistants', icon: BrainCircuit },
  { name: 'AI Image Generator', description: 'Image and artwork workflows', icon: Image },
  { name: 'AI Video Creator', description: 'Video and animation tools', icon: Video },
  { name: 'E-Commerce', description: 'Online shops and order workflows', icon: ShoppingCart },
  { name: 'Social Network', description: 'Communities and social experiences', icon: MessagesSquare },
  { name: 'Corporate Website', description: 'Business and company websites', icon: Building2 },
  { name: 'Health & Wellness', description: 'Wellness and care experiences', icon: HeartPulse },
  { name: 'Photography', description: 'Photo sharing and portfolios', icon: Camera },
  { name: 'Education', description: 'Learning and course experiences', icon: GraduationCap },
  { name: 'Productivity', description: 'Tools to organize work and ideas', icon: Layers3 },
  { name: 'Other', description: 'Explore a different app idea', icon: MoreHorizontal },
];
const referralSources = [
  { name: 'YouTube', icon: Youtube },
  { name: 'Google Search', icon: Search },
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'TikTok', icon: MessageCircle },
  { name: 'Reddit', icon: MessageCircle },
  { name: 'AI Assistant', icon: Bot },
  { name: 'Instagram', icon: Instagram },
  { name: 'App Store', icon: Smartphone },
  { name: 'X', icon: Globe2 },
  { name: 'Facebook', icon: Facebook },
  { name: 'Discord', icon: MessageCircle },
  { name: 'Friends or family', icon: Users },
  { name: 'Other', icon: MoreHorizontal },
];

function safePath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  const fileName = parts.at(-1) || '';

  if (!parts.length || parts.some((part) => part === '..' || part === '.' || !/^[a-zA-Z0-9_.@+ -]+$/.test(part))) {
    return null;
  }

  if (
    parts.some((part) => OMIT_DIRS.has(part.toLowerCase())) ||
    (/^\.env(?:$|\.)/i.test(fileName) && !/^\.env\.(?:example|sample|template)$/i.test(fileName))
  ) {
    return null;
  }

  return parts.join('/');
}

function isTextPath(path: string) {
  const name = path.split('/').at(-1) || '';
  return name.startsWith('.') || TEXT_FILE_PATTERN.test(name);
}

async function loadZip(file: File): Promise<LocalFile[]> {
  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new Error('ZIP archives must be 4 MB or smaller for local analysis.');
  }

  const archive = await JSZip.loadAsync(file, { checkCRC32: false });
  const entries = Object.values(archive.files).filter((entry) => !entry.dir);

  if (entries.length > MAX_FILES * 3) {
    throw new Error(`The archive contains too many files to safely analyze (limit: ${MAX_FILES * 3}).`);
  }

  const selected: LocalFile[] = [];
  let totalBytes = 0;

  for (const entry of entries) {
    const path = safePath(entry.name);
    if (!path || !isTextPath(path)) continue;
    if (selected.length >= MAX_FILES) break;

    const declaredSize = (entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data
      ?.uncompressedSize;
    if (declaredSize !== undefined && totalBytes + declaredSize > MAX_TOTAL_BYTES) {
      break;
    }

    const content = await entry.async('string');
    const size = new TextEncoder().encode(content).byteLength;
    if (totalBytes + size > MAX_TOTAL_BYTES) break;
    totalBytes += size;
    selected.push({ path, content });
  }

  return selected;
}

function analyzeCodebase(files: LocalFile[]): CodebaseAnalysis {
  const contentByPath = new Map(files.map((file) => [file.path.toLowerCase(), file.content]));
  const packageJson = [...contentByPath.entries()].find(
    ([path]) => path.endsWith('/package.json') || path === 'package.json',
  )?.[1];
  let packageData: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  } = {};
  let malformedManifest = false;

  if (packageJson) {
    try {
      packageData = JSON.parse(packageJson);
    } catch {
      malformedManifest = true;
    }
  }

  const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
  const entries = Object.keys(dependencies);
  const framework = entries.find((name) =>
    ['next', 'react', 'vue', 'svelte', 'astro', '@remix-run/react', 'angular'].includes(name),
  );
  const routes = files
    .map((file) => file.path)
    .filter((path) => /(^|\/)(routes?|pages?)\//i.test(path))
    .slice(0, 8);
  const licenseFile = [...contentByPath.entries()].find(([path]) => /(^|\/)license(?:\.md|\.txt)?$/i.test(path))?.[1];
  const license = licenseFile
    ? /mit license/i.test(licenseFile)
      ? 'MIT (detected from LICENSE text)'
      : 'License file found; manual review required'
    : 'Not detected — verify before reuse or distribution';
  const scripts = packageData.scripts || {};
  const securityNotes: string[] = [];

  if (!files.some((file) => file.path.toLowerCase().startsWith('.env.example'))) {
    securityNotes.push('No .env.example found; verify runtime secrets are documented without values.');
  }
  if (files.some((file) => /(^|\/)\.env(?:$|\.)/i.test(file.path) && !/\.env\.example$/i.test(file.path))) {
    securityNotes.push('Potential environment file detected; exclude secrets before importing.');
  }
  if (!licenseFile) securityNotes.push('No license detected; do not assume the codebase is reusable.');
  if (malformedManifest)
    securityNotes.push('package.json is malformed; dependencies and scripts could not be inspected.');
  if (files.some((file) => /(^|\/)(test|tests|__tests__)\//i.test(file.path))) {
    securityNotes.push('Test files found; inspect coverage and run them after changes.');
  }

  return {
    fileCount: files.length,
    packageManager: files.some((file) => file.path === 'pnpm-lock.yaml')
      ? 'pnpm'
      : files.some((file) => file.path === 'yarn.lock')
        ? 'Yarn'
        : files.some((file) => file.path === 'package-lock.json')
          ? 'npm'
          : 'Not detected',
    framework: framework || 'Not detected',
    language: files.some((file) => /\.tsx?$/.test(file.path))
      ? 'TypeScript'
      : files.some((file) => /\.jsx?$/.test(file.path))
        ? 'JavaScript'
        : 'Not detected',
    database:
      entries.find((name) => /prisma|drizzle|supabase|mongoose|typeorm|sequelize|pg$/.test(name)) || 'Not detected',
    authentication: entries.find((name) => /auth|clerk|passport|next-auth|supabase/.test(name)) || 'Not detected',
    build: scripts.build || 'No package build script detected',
    tests: scripts.test || scripts['test:unit'] || 'No package test script detected',
    license,
    routes: routes.length ? routes : ['No conventional routes/pages folder detected'],
    securityNotes: securityNotes.length
      ? securityNotes
      : ['No obvious import warnings detected; this is not a security audit.'],
  };
}

function createDraft(prompt: string, projectType: ProjectType) {
  const normalized = prompt.toLowerCase();
  const match = domainDefinitions.find((definition) => definition.terms.some((term) => normalized.includes(term)));
  const entities = match?.entities || [
    { name: 'User', fields: 'name: text, email: email, roleId: relation(Role), isActive: boolean' },
    { name: 'Record', fields: 'title: text, status: enum(open, in_progress, complete), createdAt: datetime' },
    {
      name: 'Activity',
      fields: 'recordId: relation(Record), userId: relation(User), event: text, occurredAt: datetime',
    },
  ];

  return {
    foundation: getFoundationForWebApp(projectType === 'PWA'),
    domainHint: match ? 'Potential starting domain identified from your prompt' : 'Generic application draft',
    entities,
    relationships: match?.relationships || ['User 1 → many Records', 'Record 1 → many Activities'],
    roles: initialRoles,
    rules: initialRules,
  };
}

function makeBuildPrompt(options: {
  prompt: string;
  projectType: ProjectType;
  foundationName: string;
  category: AppCategory;
  entities: DataEntity[];
  relationships: string[];
  roles: string[];
  rules: string;
  workflowTests: string[];
  analysis?: CodebaseAnalysis;
}) {
  const {
    prompt,
    projectType,
    foundationName,
    category,
    entities,
    relationships,
    roles,
    rules,
    workflowTests,
    analysis,
  } = options;
  const model = entities.map((entity) => `- ${entity.name}: ${entity.fields}`).join('\n');

  return `[Universal App Builder: foundation=web-pwa; approved-data-model=true]

Build the requested ${category} application from the user's approved plan. Use exactly ONE Web/PWA technical foundation for this application. Generate the application's entities, screens, and workflows inside that foundation; do not clone, import, merge, or compose any separate application repository. Use the existing Simeony coding workspace as the coding engine, inspect current project files before edits, and preserve existing behavior not explicitly replaced.

APPLICATION REQUEST:
${prompt}

APP CATEGORY: ${category}
APP TARGET: ${projectType} (Web/PWA target foundation)
SELECTED FOUNDATION: ${foundationName}
FOUNDATION RULE: Select one web technical stack for this app and stay within it for the whole build. Do not mix frameworks or copy another application's repository. Do not switch foundations during generation.

USER-APPROVED DATA MODEL:
${model}

RELATIONSHIPS:
${relationships.map((item) => `- ${item}`).join('\n')}

ROLES AND ACCESS:
${roles.map((item) => `- ${item}`).join('\n')}

LOCALLY GENERATED ACCEPTANCE TESTS (derived from the user-approved schema; refine as needed):
${workflowTests.map((item) => `- ${item}`).join('\n')}

BUSINESS RULES / OPEN QUESTIONS:
${rules || '- None provided; surface important assumptions to the user.'}

${
  analysis
    ? `IMPORTED CODEBASE ANALYSIS (inspect actual files before edits; this summary is not a substitute for inspection):
- Files analyzed locally: ${analysis.fileCount}
- Framework: ${analysis.framework}; language: ${analysis.language}; package manager: ${analysis.packageManager}
- Database: ${analysis.database}; authentication: ${analysis.authentication}
- Build: ${analysis.build}; tests: ${analysis.tests}; license: ${analysis.license}
- Existing routes: ${analysis.routes.join(', ')}
- Plan: preserve architecture and functionality, add only what the approved request requires, run the project's real build/test commands, and report any failures truthfully.
`
    : ''
}

GENERATION CONTRACT:
- Before editing, inspect the current project files and turn the approved request into a coherent implementation plan: user roles, screens/navigation, entities and relationships, key workflows, integrations, and acceptance checks. Follow the user-approved model above; surface contradictions rather than silently changing it.
- Create a maintainable, runnable starter application with an intentional project structure, shared UI components, clear feature boundaries, and the requested core workflows. Prioritize a complete first pass a developer can review and refine over a disconnected mockup or a pile of placeholder files.
- Implement requested authentication, admin, billing, storage, and other capability modules as real end-to-end features only when the project foundation and required configuration support them. Reuse existing integrations where available; do not invent successful API responses, subscriptions, users, or database writes. Where credentials or external setup are missing, keep secrets out of client code, provide an explicit setup path, and clearly report what remains unconfigured.
- Never hardcode credentials, commit secrets, disable authorization checks, or claim production readiness from a successful page render alone. Preserve existing project behavior and make focused changes rather than overwriting unrelated files.
- Derive concrete acceptance scenarios from the agreed workflows and data relationships. Run the project's real available tests and build/type checks. If a check fails, inspect its output and make up to three targeted repair attempts, rerunning the failing check each time; do not hide unresolved failures or report a passing result without evidence.
- When checks pass, start the actual app preview and summarize the generated structure, implemented features, checks and results, plus any required setup or limitations. Do not claim deployment, authentication, persistence, PWA installability, or third-party integrations succeeded unless you verified the complete behavior.

Aim to eliminate repetitive project setup and give a developer a substantial, testable first pass to finish. Do not promise a fixed percentage of work saved, a fixed delivery price, or production readiness that the checks do not support.`;
}

export function FactoryLaunchpad() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Web');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [appCategory, setAppCategory] = useState<AppCategory>('Business Tools & SaaS');
  const [hearAbout, setHearAbout] = useState('');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<ReturnType<typeof createDraft> | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    folderRef.current?.setAttribute('webkitdirectory', '');
    folderRef.current?.setAttribute('directory', '');
  }, []);

  useEffect(() => {
    setPlan(null);
    setApproved(false);
  }, [projectType]);

  const inspectFiles = async (incoming: File[]) => {
    setError('');
    setIsReading(true);

    try {
      let collected: LocalFile[] = [];
      const archives = incoming.filter((file) => file.name.toLowerCase().endsWith('.zip'));

      if (archives.length) {
        if (archives.length > 1 || incoming.length > 1) {
          throw new Error('Import one ZIP archive at a time.');
        }
        collected = await loadZip(archives[0]);
      } else {
        const candidates = incoming
          .map((file) => {
            const path = file.webkitRelativePath || file.name;
            const segments = path.replace(/\\/g, '/').split('/').filter(Boolean);
            return { file, path: segments.length > 1 ? segments.slice(1).join('/') : path };
          })
          .filter(({ path, file }) => safePath(path) && isTextPath(path) && file.size <= MAX_TOTAL_BYTES)
          .slice(0, MAX_FILES);

        for (const candidate of candidates) {
          const path = safePath(candidate.path);
          if (!path) continue;
          const content = await candidate.file.text();
          const size = new TextEncoder().encode(content).byteLength;
          const currentSize = collected.reduce(
            (total, entry) => total + new TextEncoder().encode(entry.content).byteLength,
            0,
          );
          if (currentSize + size > MAX_TOTAL_BYTES) break;
          collected.push({ path, content });
        }
      }

      if (!collected.length) {
        throw new Error('No supported text source files were found. Check that the ZIP or folder has source files.');
      }

      setFiles(collected);
      setAnalysis(analyzeCodebase(collected));
      toast.success(`Inspected ${collected.length} source files locally.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not inspect the selected files.';
      setError(message);
      setFiles([]);
      setAnalysis(null);
      toast.error(message);
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
      if (folderRef.current) folderRef.current.value = '';
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    void inspectFiles(Array.from(event.target.files || []));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void inspectFiles(Array.from(event.dataTransfer.files));
  };

  const createPlan = () => {
    if (!prompt.trim()) {
      setError('Describe your app before creating its plan.');
      return;
    }

    setError('');
    setApproved(false);
    setPlan(createDraft(prompt, projectType));
  };

  const updateEntity = (index: number, field: keyof DataEntity, value: string) => {
    setPlan((current) =>
      current
        ? {
            ...current,
            entities: current.entities.map((entity, entityIndex) =>
              entityIndex === index ? { ...entity, [field]: value } : entity,
            ),
          }
        : current,
    );
  };

  const startBuild = () => {
    if (!plan || !prompt.trim()) return;
    const buildPrompt = makeBuildPrompt({
      prompt: prompt.trim(),
      projectType,
      foundationName: plan.foundation.name,
      category: appCategory,
      entities: plan.entities,
      relationships: plan.relationships,
      roles: plan.roles,
      rules: plan.rules,
      workflowTests: generateWorkflowTestCases(plan),
      analysis: analysis || undefined,
    });

    if (files.length) {
      const name =
        prompt
          .trim()
          .slice(0, 60)
          .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
          .trim() || 'business-tool';
      try {
        sessionStorage.setItem(IMPORT_KEY, JSON.stringify({ name, files, buildPrompt }));
      } catch {
        setError(
          'The selected codebase is too large to stage in this browser. Use the IDE’s folder import or reduce the source size.',
        );
        return;
      }
      setApproved(true);
      navigate('/?factoryBuild=1');
      return;
    }

    setApproved(true);
    navigate(`/?prompt=${encodeURIComponent(buildPrompt)}`);
  };

  const progressSteps: Exclude<OnboardingStep, 'welcome' | 'builder'>[] = ['category', 'target', 'referral'];
  const activeProgressIndex =
    onboardingStep === 'category' ? 0 : onboardingStep === 'target' ? 1 : onboardingStep === 'referral' ? 2 : 0;

  if (onboardingStep !== 'builder') {
    const stepTitle =
      onboardingStep === 'category'
        ? 'What type of app do you want to build?'
        : onboardingStep === 'target'
          ? 'What do you want AI to build?'
          : onboardingStep === 'referral'
            ? 'How did you hear about us?'
            : '';

    const continueOnboarding = () => {
      if (onboardingStep === 'category') setOnboardingStep('target');
      else if (onboardingStep === 'target') setOnboardingStep('referral');
      else if (onboardingStep === 'referral') setOnboardingStep('builder');
    };

    return (
      <main
        className={`factory factory-onboarding ${onboardingStep === 'welcome' ? 'welcome-screen' : 'wizard-screen'}`}
      >
        <header className="factory-topline">
          <div>
            <div className="factory-brand">
              <span className="factory-brand-mark">
                <Layers3 size={19} />
              </span>{' '}
              Simeony
            </div>
            <p className="factory-subtitle">
              IDEA IN. APP OUT. <span>·</span> by SimeonJr Studios
            </p>
          </div>
          {onboardingStep === 'welcome' && (
            <nav className="simeony-nav" aria-label="Main navigation">
              <a href="#platform">Platform</a>
              <a href="#preview">Preview</a>
              <a href="#workflow">How it works</a>
            </nav>
          )}
          <div className="factory-mode">
            <span className="online-dot" /> WEB / PWA <span className="mode-divider" /> Ready to plan
          </div>
        </header>

        {onboardingStep === 'welcome' ? (
          <div className="simeony-home">
            <section className="simeony-home-grid" id="platform" aria-labelledby="home-title">
              <div className="simeony-home-copy">
                <span className="simeony-home-eyebrow">
                  <Sparkles size={14} /> IDEA IN. APP OUT.
                </span>
                <h1 id="home-title">
                  Don’t fight with code.
                  <br />
                  <span>Just build your idea.</span>
                </h1>
                <p className="simeony-home-description">
                  Give your developer a head start. Turn your idea into a reviewed plan and an AI-built starting point,
                  so they can focus on refining and shipping instead of beginning with a blank project.
                </p>
                <div className="simeony-prompt-card">
                  <label htmlFor="simeony-home-prompt">
                    <span>What do you want to build?</span>
                    <small>Start with an idea</small>
                  </label>
                  <textarea
                    id="simeony-home-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    maxLength={4000}
                    rows={3}
                    placeholder="“Build a modern AI image generator for creators with accounts, subscriptions, image history, credits, an admin dashboard and a mobile-friendly interface.”"
                  />
                  <div className="simeony-prompt-footer">
                    <div className="simeony-target-chips" aria-label="Choose an app direction">
                      <button
                        type="button"
                        className={projectType === 'Web' ? 'selected' : ''}
                        aria-pressed={projectType === 'Web'}
                        onClick={() => setProjectType('Web')}
                      >
                        Web app
                      </button>
                      <button
                        type="button"
                        className={projectType === 'PWA' ? 'selected' : ''}
                        aria-pressed={projectType === 'PWA'}
                        onClick={() => setProjectType('PWA')}
                      >
                        PWA
                      </button>
                      <button
                        type="button"
                        className={appCategory === 'AI Application' ? 'selected' : ''}
                        aria-pressed={appCategory === 'AI Application'}
                        onClick={() => setAppCategory('AI Application')}
                      >
                        AI app
                      </button>
                      <span className="planned" title="Native mobile builds are not available yet">
                        Mobile · planned
                      </span>
                    </div>
                    <button
                      className="simeony-build-button"
                      type="button"
                      disabled={!prompt.trim()}
                      onClick={() => setOnboardingStep('category')}
                    >
                      Create my plan <ArrowRight size={16} />
                    </button>
                  </div>
                  {prompt.length > 0 && <span className="simeony-prompt-count">{prompt.length}/4000</span>}
                </div>
                <div className="simeony-example-prompts">
                  <span>Try an example</span>
                  {[
                    'A booking app for a small salon',
                    'A simple inventory dashboard',
                    'A course platform for teachers',
                  ].map((example) => (
                    <button key={example} type="button" onClick={() => setPrompt(example)}>
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="simeony-home-side">
                <section className="simeony-pipeline-card" aria-label="How Simeony builds your app">
                  <div className="simeony-side-heading">
                    <span>YOUR BUILD WORKFLOW</span>
                    <span className="simeony-ready-status">Ready when you are</span>
                  </div>
                  <ol>
                    {[
                      'Understand your idea',
                      'Plan screens and data',
                      'Review before building',
                      'Build, then preview',
                    ].map((step, index) => (
                      <li key={step}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{step}</strong>
                        <i>Not started</i>
                      </li>
                    ))}
                  </ol>
                  <p>No build runs in the background. Your plan starts when you submit an idea.</p>
                </section>

                <section className="simeony-preview-card" id="preview" aria-label="Illustrative app preview">
                  <div className="simeony-browser-bar">
                    <span className="simeony-browser-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="simeony-preview-address">Illustrative app preview</span>
                    <span className="simeony-preview-target">WEB / PWA</span>
                  </div>
                  <div className="simeony-generated-app">
                    <div className="simeony-generated-heading">
                      <span className="simeony-app-mark">C</span>
                      <strong>Creator Studio</strong>
                      <span className="simeony-credit-badge">Sample dashboard</span>
                    </div>
                    <div className="simeony-generated-gallery" aria-hidden="true">
                      <div className="simeony-gallery-art simeony-gallery-art-one">
                        <span>Dreamscape · 01</span>
                      </div>
                      <div className="simeony-gallery-art simeony-gallery-art-two">
                        <span>Portrait · 02</span>
                      </div>
                    </div>
                    <div className="simeony-preview-actions">
                      <span>App canvas</span>
                      <span>Example UI — not a live generated app</span>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <section className="simeony-refinement" id="workflow" aria-labelledby="refinement-title">
              <div>
                <span className="simeony-home-eyebrow">BUILD IN PLAIN ENGLISH</span>
                <h2 id="refinement-title">Keep shaping your app as you go.</h2>
                <p>Once you’re in the coding workspace, describe the next change in the chat.</p>
              </div>
              <div className="simeony-refinement-examples">
                {[
                  ['“Make the dashboard cleaner.”', 'Ask the coding workspace to refine the interface.'],
                  ['“Add an admin dashboard.”', 'Describe the screens and workflows you need.'],
                  ['“Fix this error.”', 'Share the issue with the coding agent for a targeted repair.'],
                ].map(([title, detail]) => (
                  <article key={title}>
                    <span>AI</span>
                    <div>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <footer className="simeony-footer">
              <span className="simeony-footer-brand">
                <b>S</b> Simeony <small>by SimeonJr Studios</small>
              </span>
              <span>IDEA IN. APP OUT.</span>
              <span>Web / PWA builder · Other platforms are planned</span>
            </footer>
          </div>
        ) : (
          <section className="onboarding-panel" aria-labelledby="onboarding-title">
            <div className="wizard-progress" aria-label={`Step ${activeProgressIndex + 1} of 3`}>
              <span style={{ width: `${((activeProgressIndex + 1) / progressSteps.length) * 100}%` }} />
            </div>
            {onboardingStep !== 'category' && (
              <button
                className="wizard-back"
                type="button"
                aria-label="Go back"
                onClick={() => setOnboardingStep(onboardingStep === 'target' ? 'category' : 'target')}
              >
                <ArrowRight size={18} />
              </button>
            )}
            <h1 id="onboarding-title">{stepTitle}</h1>

            {onboardingStep === 'category' && (
              <>
                <div className="category-grid" role="group" aria-label="App categories">
                  {appCategories.map(({ name, description, icon: Icon }) => (
                    <button
                      className={`category-option ${appCategory === name ? 'selected' : ''}`}
                      type="button"
                      key={name}
                      aria-pressed={appCategory === name}
                      onClick={() => setAppCategory(name)}
                    >
                      <Icon size={19} aria-hidden="true" />
                      <strong>{name}</strong>
                      <small>{description}</small>
                    </button>
                  ))}
                </div>
                <p className="category-note">
                  Choose a direction to help shape your prompt. The Web/PWA foundation can be adapted to many app ideas.
                </p>
              </>
            )}

            {onboardingStep === 'target' && (
              <div className="target-choice-list">
                <button
                  className="target-choice selected"
                  type="button"
                  aria-pressed="true"
                  onClick={() => setProjectType('Web')}
                >
                  <span className="target-choice-icon">
                    <Globe2 size={22} />
                  </span>
                  <span>
                    <strong>Build My Web App</strong>
                    <small>Go live on the web; installable PWA options can be selected later.</small>
                  </span>
                  <Check size={18} />
                </button>
                <div className="target-choice unavailable" aria-disabled="true">
                  <span className="target-choice-icon">
                    <Smartphone size={22} />
                  </span>
                  <span>
                    <strong>Build My Mobile App</strong>
                    <small>Ship to App Store &amp; Google Play</small>
                  </span>
                  <span className="coming-soon">COMING SOON</span>
                </div>
                <p className="target-honesty">
                  <ShieldCheck size={15} /> Native iOS and Android builds are not available yet. The current MVP builds
                  Web/PWA applications only.
                </p>
              </div>
            )}

            {onboardingStep === 'referral' && (
              <div className="referral-list" role="group" aria-label="How did you hear about us?">
                {referralSources.map(({ name, icon: Icon }) => (
                  <button
                    className={`referral-option ${hearAbout === name ? 'selected' : ''}`}
                    type="button"
                    key={name}
                    aria-pressed={hearAbout === name}
                    onClick={() => setHearAbout(name)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{name}</span>
                    {hearAbout === name && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}

            <div className="wizard-actions">
              {onboardingStep === 'referral' && (
                <button type="button" className="skip-referral" onClick={() => setOnboardingStep('builder')}>
                  Skip
                </button>
              )}
              <button type="button" className="wizard-continue" onClick={continueOnboarding}>
                {onboardingStep === 'referral' ? 'Continue to your AI team' : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="factory">
      <div className="factory-topline">
        <div>
          <div className="factory-brand">
            <span className="factory-brand-mark">
              <Layers3 size={19} />
            </span>{' '}
            Simeony
          </div>
          <p className="factory-subtitle">
            IDEA IN. APP OUT. <span>·</span> by SimeonJr Studios
          </p>
        </div>
        <div className="factory-mode">
          <span className="online-dot" /> FREE STUDIO <span className="mode-divider" /> Local planning needs no API key
        </div>
      </div>

      <section className="factory-heading">
        <span className="factory-kicker">
          <Sparkles size={15} /> YOUR AI DEV TEAM. READY TO BUILD.
        </span>
        <h1>Your AI Dev Team. Ready to Build.</h1>
        <p>
          Describe your {appCategory.toLowerCase()} idea, review its data model, then send the approved plan to the
          Web/PWA coding workspace.
        </p>
        <div className="builder-selection-tags" aria-label="Your selections">
          <span>{appCategory}</span>
          <span>{projectType === 'PWA' ? 'PWA' : 'Web app'}</span>
          {hearAbout && <span>Found us via {hearAbout}</span>}
        </div>
        <p className="factory-scope-note">
          Web and PWA are the build targets available today. Mobile and desktop publishing are planned for a later
          release.
        </p>
      </section>

      <nav className="factory-steps" aria-label="Build workflow">
        {['Describe', 'Understand', 'Data model', 'Approve', 'Build & test'].map((step, index) => (
          <div
            className={`factory-step ${index === 0 ? 'is-active' : ''} ${plan && index < 3 ? 'is-done' : ''}`}
            key={step}
          >
            <span className="step-number">{plan && index < 3 ? <Check size={13} /> : `0${index + 1}`}</span>
            <span>{step}</span>
            {index < 4 && <span className="step-line" />}
          </div>
        ))}
      </nav>

      <section className="foundation-registry" aria-label="Application target foundations">
        <div className="foundation-registry-heading">
          <span className="step-label">ONE FOUNDATION PER TARGET</span>
          <span>Generate the business app inside its target foundation — never merge application repos.</span>
        </div>
        <div className="foundation-targets">
          {FOUNDATION_REGISTRY.map((foundation) => (
            <div
              className={`foundation-target ${foundation.id === 'web-pwa' ? 'current' : 'planned'}`}
              key={foundation.id}
            >
              <span className="foundation-target-icon">
                <Layers3 size={14} />
              </span>
              <span className="foundation-target-copy">
                <strong>{foundation.name}</strong>
                <small>{foundation.id === 'web-pwa' ? 'MVP coding workspace' : 'Foundation validation pending'}</small>
              </span>
              <span className={`foundation-target-state ${foundation.id === 'web-pwa' ? 'active' : ''}`}>
                {foundation.id === 'web-pwa' ? 'MVP' : 'PLANNED'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="factory-grid">
        <section className="factory-card factory-input-card">
          <div className="card-title-row">
            <div>
              <span className="step-label">01 / IDEA IN</span>
              <h2>What do you want to build?</h2>
            </div>
            <CircleHelp size={18} className="muted-icon" />
          </div>
          <label className="field-label" htmlFor="business-prompt">
            What do you want to build?
          </label>
          <textarea
            id="business-prompt"
            className="factory-prompt"
            placeholder="Describe your idea, who will use it, the key screens and workflows, and what a successful result looks like..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={4000}
            rows={6}
          />
          <div className="input-meta">
            <span>Start simple. You can refine the app and data model before build.</span>
            <span>{prompt.length}/4000</span>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="app-type">
                What kind of app?
              </label>
              <div className="select-wrap">
                <select
                  id="app-type"
                  value={projectType}
                  onChange={(event) => setProjectType(event.target.value as ProjectType)}
                >
                  <option>Web</option>
                  <option>PWA</option>
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="hear-about">
                How did you hear about us?
              </label>
              <div className="select-wrap">
                <select id="hear-about" value={hearAbout} onChange={(event) => setHearAbout(event.target.value)}>
                  <option value="">Select an option</option>
                  <option>Search engine</option>
                  <option>Social media</option>
                  <option>Friend or colleague</option>
                  <option>Online community</option>
                  <option>Other</option>
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
          </div>

          <div
            className={`factory-dropzone ${isDragging ? 'drag-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.ts,.tsx,.js,.jsx,.json,.html,.css,.scss,.md,.yaml,.yml,.sql,.prisma"
              multiple
              onChange={handleFiles}
              hidden
            />
            <input ref={folderRef} type="file" multiple onChange={handleFiles} hidden />
            <div className="drop-icon">
              <Upload size={19} />
            </div>
            <div className="drop-copy">
              <strong>Drop your codebase here</strong>
              <span>ZIP, source files, or an existing project folder</span>
            </div>
            <div className="drop-actions">
              <button type="button" onClick={() => inputRef.current?.click()}>
                <FileUp size={15} /> Choose files
              </button>
              <button type="button" onClick={() => folderRef.current?.click()}>
                <FolderOpen size={15} /> Folder
              </button>
            </div>
            <span className="drop-footnote">
              Local source inspection only · up to 140 text files / 512 KB · .env and build folders excluded
            </span>
          </div>

          {isReading && (
            <div className="source-summary">
              <FileCode2 size={16} /> Inspecting selected source files locally…
            </div>
          )}
          {analysis && (
            <div className="source-summary source-ready">
              <div className="source-summary-title">
                <Check size={15} /> Codebase analyzed locally{' '}
                <button
                  type="button"
                  aria-label="Remove codebase"
                  onClick={() => {
                    setFiles([]);
                    setAnalysis(null);
                  }}
                >
                  <X size={15} />
                </button>
              </div>
              <div className="analysis-grid">
                <span>
                  Framework <b>{analysis.framework}</b>
                </span>
                <span>
                  Language <b>{analysis.language}</b>
                </span>
                <span>
                  Package manager <b>{analysis.packageManager}</b>
                </span>
                <span>
                  Database <b>{analysis.database}</b>
                </span>
                <span>
                  Authentication <b>{analysis.authentication}</b>
                </span>
                <span>
                  License <b>{analysis.license}</b>
                </span>
              </div>
              <p className="security-warning">{analysis.securityNotes.join(' ')}</p>
            </div>
          )}

          {error && (
            <div className="factory-error" role="alert">
              {error}
            </div>
          )}

          <button type="button" className="factory-primary" onClick={createPlan} disabled={!prompt.trim() || isReading}>
            Create free plan <ArrowRight size={17} />
          </button>
          <p className="privacy-note">
            <ShieldCheck size={14} /> Planning runs locally. No model call happens until you approve and start a build.
          </p>
        </section>

        <section className="factory-card workflow-card">
          <div className="card-title-row">
            <div>
              <span className="step-label">02 / REVIEW BEFORE BUILD</span>
              <h2>Your AI Dev Team</h2>
            </div>
            <span className="template-count">8 stages</span>
          </div>
          <p className="workflow-intro">
            Your plan stays editable. The code agent will not run until you approve the data model.
          </p>
          <div className="agent-list">
            {[
              ['Understanding', 'Free local keyword-based draft', 'done'],
              ['Product architecture', `${appCategory} · Web/PWA target`, plan ? 'done' : 'waiting'],
              ['Data model', 'Review entities, relationships & access', plan ? 'review' : 'waiting'],
              [
                'Foundation selection',
                plan?.foundation.name || 'Single Web/PWA target foundation',
                plan ? 'review' : 'waiting',
              ],
              ['UI/UX design', 'Uses the configured coding model', 'queued'],
              ['Build & run', 'Simeony coding workspace', 'queued'],
              ['Functional test & repair', 'Actual workflows; bounded repair loop', 'queued'],
              ['Analysis · QC · package · deploy', 'Not complete until each real check passes', 'queued'],
            ].map(([name, detail, status]) => (
              <div className="agent-row" key={name}>
                <span className={`agent-indicator ${status}`} aria-hidden="true">
                  {status === 'done' ? <Check size={12} /> : status === 'review' ? '!' : ''}
                </span>
                <span className="agent-copy">
                  <strong>{name}</strong>
                  <small>{detail}</small>
                </span>
                <span className={`agent-status ${status}`}>
                  {status === 'done'
                    ? 'LOCAL'
                    : status === 'review'
                      ? 'REVIEW'
                      : status === 'queued'
                        ? 'QUEUED'
                        : 'WAITING'}
                </span>
              </div>
            ))}
          </div>
          <div className="honesty-callout">
            <ShieldCheck size={17} />
            <p>
              <strong>No fake success states.</strong> Build, tests, preview and deployment results come from the
              existing IDE and configured services; unconfigured services stay marked as such.
            </p>
          </div>
        </section>
      </div>

      {plan && (
        <section className="factory-card model-card" aria-labelledby="model-heading">
          <div className="model-heading-row">
            <div>
              <span className="step-label">03 / MANDATORY CHECKPOINT</span>
              <h2 id="model-heading">Review your data model</h2>
              <p>The following is a free, local draft — not an AI-generated specification. Edit it before approval.</p>
            </div>
            <span className="draft-badge">DRAFT · NOT APPROVED</span>
          </div>
          <div className="selected-foundation">
            <Layers3 size={16} />
            <span>
              <b>Selected target foundation</b>
              {plan.foundation.name}
              <small>
                {plan.foundation.stack} Candidate status: evaluation pending; no third-party business application
                repository is imported.
              </small>
            </span>
          </div>
          <div className="entity-grid">
            {plan.entities.map((entity, index) => (
              <article className="entity-card" key={`${entity.name}-${index}`}>
                <div className="entity-title">
                  <span className="entity-symbol">
                    <Layers3 size={14} />
                  </span>
                  <input
                    aria-label={`Entity ${index + 1} name`}
                    value={entity.name}
                    onChange={(event) => updateEntity(index, 'name', event.target.value)}
                  />
                  <button
                    aria-label={`Remove ${entity.name}`}
                    type="button"
                    onClick={() =>
                      setPlan({ ...plan, entities: plan.entities.filter((_, itemIndex) => itemIndex !== index) })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="field-label">Fields</label>
                <textarea
                  aria-label={`${entity.name} fields`}
                  value={entity.fields}
                  rows={3}
                  onChange={(event) => updateEntity(index, 'fields', event.target.value)}
                />
                <small>Comma-separated fields. Confirm sensitive data, uniqueness, and required values.</small>
              </article>
            ))}
            <button
              type="button"
              className="add-entity"
              onClick={() =>
                setPlan({
                  ...plan,
                  entities: [...plan.entities, { name: 'NewEntity', fields: 'name: text, createdAt: datetime' }],
                })
              }
            >
              <Plus size={16} /> Add entity
            </button>
          </div>
          <div className="model-details-grid">
            <div>
              <label className="field-label">Relationships</label>
              <textarea
                value={plan.relationships.join('\n')}
                rows={4}
                onChange={(event) => setPlan({ ...plan, relationships: event.target.value.split('\n') })}
              />
              <small>One relationship per line; correct cardinality before approval.</small>
            </div>
            <div>
              <label className="field-label">Roles &amp; permissions</label>
              <textarea
                value={plan.roles.join('\n')}
                rows={4}
                onChange={(event) => setPlan({ ...plan, roles: event.target.value.split('\n') })}
              />
              <small>One role per line. Enforce least-privilege access.</small>
            </div>
          </div>
          <section className="schema-test-plan" aria-labelledby="schema-test-heading">
            <div>
              <span className="step-label">GENERATED LOCALLY · NO API KEY</span>
              <h3 id="schema-test-heading">Workflow checks for your schema</h3>
              <p>
                These acceptance scenarios update from your entities, relationships, and roles. They will be included in
                the request when you approve the plan.
              </p>
            </div>
            <ul>
              {generateWorkflowTestCases(plan).map((testCase) => (
                <li key={testCase}>
                  <Check size={14} />
                  <span>{testCase}</span>
                </li>
              ))}
            </ul>
          </section>
          <label className="field-label rules-label">Application rules and open questions</label>
          <textarea
            className="rules-input"
            value={plan.rules}
            rows={3}
            onChange={(event) => setPlan({ ...plan, rules: event.target.value })}
          />
          <div className="approval-footer">
            <span>Approve is required before the coding agent receives this request.</span>
            <button
              type="button"
              className="factory-primary"
              onClick={startBuild}
              disabled={
                !plan.entities.length || plan.entities.some((entity) => !entity.name.trim() || !entity.fields.trim())
              }
            >
              Approve &amp; build <ArrowRight size={17} />
            </button>
          </div>
          {approved && (
            <p className="launch-confirmation" role="status">
              <Check size={14} /> Approval captured. Passing the approved request to the Simeony coding workspace.
            </p>
          )}
        </section>
      )}
      <footer className="factory-footer">
        IDEA IN <span>→</span> APPROVED DATA MODEL <span>→</span> WEB / PWA APP OUT <i>·</i> Native mobile and desktop
        are not in this MVP.
      </footer>
    </main>
  );
}
