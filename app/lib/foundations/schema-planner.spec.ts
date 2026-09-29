import { describe, expect, it } from 'vitest';
import {
  buildFoundationRequirements,
  buildWebPwaFoundationRequirements,
  generateWorkflowTestCases,
} from './schema-planner';
import { getFoundationForTarget } from './registry';

describe('generateWorkflowTestCases', () => {
  it('derives validation, relationship, and role scenarios from the reviewed schema', () => {
    const testCases = generateWorkflowTestCases({
      entities: [
        { name: 'Customer', fields: 'name: text, email: email' },
        { name: 'Order', fields: 'customerId: relation(Customer), total: decimal' },
      ],
      relationships: ['Customer 1 → many Orders'],
      roles: ['Admin: manage all records', 'Member: access assigned records'],
    });

    expect(testCases).toContain('Create a valid Customer and verify it can be read back with its required fields.');
    expect(testCases).toContain('Reject an invalid Order that is missing required fields or has invalid values.');
    expect(testCases).toContain('Verify the relationship and cardinality: Customer 1 → many Orders.');
    expect(testCases).toContain('Verify access is restricted according to this role: Admin: manage all records.');
    expect(testCases).toHaveLength(7);
  });

  it('ignores blank entries and caps generated scenarios', () => {
    const testCases = generateWorkflowTestCases({
      entities: [{ name: '  ', fields: '' }],
      relationships: [' ', 'User 1 → many Notes'],
      roles: [''],
    });

    expect(testCases).toEqual(['Verify the relationship and cardinality: User 1 → many Notes.']);
    expect(
      generateWorkflowTestCases({
        entities: Array.from({ length: 20 }, (_, index) => ({ name: `Entity${index}`, fields: 'name: text' })),
        relationships: [],
        roles: [],
      }),
    ).toHaveLength(24);
  });
});

describe('buildWebPwaFoundationRequirements', () => {
  it('includes reusable auth, navigation, data, security, and test requirements', () => {
    const requirements = buildWebPwaFoundationRequirements(false).join('\n');

    expect(requirements).toContain('responsive sidebar');
    expect(requirements).toContain('email/password sign-up');
    expect(requirements).toContain('validated create/edit forms');
    expect(requirements).toContain('separate from Simeony model-provider credentials');
    expect(requirements).toContain('role restrictions');
    expect(requirements).not.toContain('web app manifest');
  });

  it('requires installability work only for the PWA target', () => {
    expect(buildWebPwaFoundationRequirements(true).join('\n')).toContain('valid web app manifest');
  });
});

describe('target foundation selection', () => {
  it('selects one distinct foundation per target', () => {
    expect(getFoundationForTarget('web').id).toBe('web-pwa');
    expect(getFoundationForTarget('pwa').id).toBe('web-pwa');
    expect(getFoundationForTarget('mobile').id).toBe('mobile');
    expect(getFoundationForTarget('desktop').id).toBe('desktop');
  });

  it('keeps mobile and desktop generation contracts isolated', () => {
    const mobileRequirements = buildFoundationRequirements('mobile').join('\n');
    const desktopRequirements = buildFoundationRequirements('desktop').join('\n');

    expect(mobileRequirements).toContain('React Native application using Expo');
    expect(mobileRequirements).toContain('native stack navigation');
    expect(mobileRequirements).toContain('Expo SQLite');
    expect(mobileRequirements).not.toContain('Electron');

    expect(desktopRequirements).toContain('desktop application shell with Electron');
    expect(desktopRequirements).toContain('context isolation enabled');
    expect(desktopRequirements).toContain('Tauri is not configured');
    expect(desktopRequirements).not.toContain('Expo SQLite');
  });
});
