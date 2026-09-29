import { describe, expect, it } from 'vitest';
import { generateWorkflowTestCases } from './schema-planner';

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
    expect(testCases).toContain('Reject a Order that is missing required fields or has invalid values.');
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
