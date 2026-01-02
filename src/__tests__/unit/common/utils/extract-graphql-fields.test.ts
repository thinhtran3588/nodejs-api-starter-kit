import { Kind, type GraphQLResolveInfo } from 'graphql';
import { beforeEach, describe, expect, it } from 'vitest';
import { extractGraphQLFields } from '@app/common/utils/extract-graphql-fields';

describe('extractGraphQLFields', () => {
  let mockInfo: GraphQLResolveInfo;

  beforeEach(() => {
    mockInfo = {
      fieldNodes: [],
    } as unknown as GraphQLResolveInfo;
  });

  describe('happy path', () => {
    it('should extract field names from data field selection', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'email' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'displayName' },
                      },
                    ],
                  },
                },
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'pagination' },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toEqual(['id', 'email', 'displayName']);
    });

    it('should extract all field names when multiple fields are selected', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'email' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'signInType' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'externalId' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'username' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'displayName' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'status' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'version' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'createdAt' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toEqual([
        'id',
        'email',
        'signInType',
        'externalId',
        'username',
        'displayName',
        'status',
        'version',
        'createdAt',
      ]);
    });
  });

  describe('edge cases', () => {
    it('should return undefined when fieldNodes is empty', () => {
      mockInfo = {
        fieldNodes: [],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toBeUndefined();
    });

    it('should return undefined when fieldNode has no selectionSet', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toBeUndefined();
    });

    it('should return undefined when target field is not found', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'pagination' },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toBeUndefined();
    });

    it('should return undefined when target field has no selectionSet', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toBeUndefined();
    });

    it('should return undefined when target field selectionSet has no selections', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toBeUndefined();
    });

    it('should ignore non-field selections (e.g., fragments)', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FRAGMENT_SPREAD,
                        name: { kind: Kind.NAME, value: 'userFields' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toEqual(['id']);
    });

    it('should use first fieldNode when multiple fieldNodes exist', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'email' },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'otherQuery' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'name' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toEqual(['id', 'email']);
    });

    it('should extract fields from different field name', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'query' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'items' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'name' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'items');

      expect(result).toEqual(['id', 'name']);
    });

    it('should ignore inline fragments', () => {
      mockInfo = {
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'users' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'data' },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: 'id' },
                      },
                      {
                        kind: Kind.INLINE_FRAGMENT,
                        typeCondition: {
                          kind: Kind.NAMED_TYPE,
                          name: { kind: Kind.NAME, value: 'User' },
                        },
                        selectionSet: {
                          kind: Kind.SELECTION_SET,
                          selections: [
                            {
                              kind: Kind.FIELD,
                              name: { kind: Kind.NAME, value: 'email' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as unknown as GraphQLResolveInfo;

      const result = extractGraphQLFields(mockInfo, 'data');

      expect(result).toEqual(['id']);
    });
  });
});
