import { Kind, type GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { Context } from '@app/common';
import { roleAdapter } from '@app/modules/auth/adapters/role-adapter';
import { userGroupAdapter } from '@app/modules/auth/adapters/user-group-adapter';
import type {
  AuthContainer,
  FindRolesQuery,
  FindUserGroupsQuery,
} from '@app/modules/auth/interfaces';

const buildListInfo = (
  rootFieldName: string,
  fields: string[]
): GraphQLResolveInfo => {
  return {
    fieldNodes: [
      {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: rootFieldName },
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: [
            {
              kind: Kind.FIELD,
              name: { kind: Kind.NAME, value: 'data' },
              selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: fields.map((field) => ({
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: field },
                })),
              },
            },
          ],
        },
      },
    ],
  } as unknown as GraphQLResolveInfo;
};

describe('graphql list resolvers field extraction', () => {
  it('applies GraphQL selected data fields for roles query', async () => {
    const execute = vi.fn().mockResolvedValue({
      data: [],
      pagination: { count: 0, pageIndex: 0 },
    });
    const context = {
      var: {
        user: { id: 'operator-id' },
        container: {
          cradle: {
            findRolesQueryHandler: { execute },
          },
        },
      },
    } as unknown as Context<AuthContainer>;
    const info = buildListInfo('roles', ['id', 'code', 'name']);
    const resolver = roleAdapter.graphql?.resolvers['roles'] as (
      query: FindRolesQuery,
      c: Context<AuthContainer>,
      info: GraphQLResolveInfo
    ) => Promise<unknown>;

    await resolver(
      {
        searchTerm: 'admin',
        fields: ['description'],
      },
      context,
      info
    );

    expect(execute).toHaveBeenCalledWith(
      {
        searchTerm: 'admin',
        fields: ['id', 'code', 'name'],
      },
      {
        user: { id: 'operator-id' },
      }
    );
  });

  it('applies GraphQL selected data fields for userGroups query', async () => {
    const execute = vi.fn().mockResolvedValue({
      data: [],
      pagination: { count: 0, pageIndex: 0 },
    });
    const context = {
      var: {
        user: { id: 'operator-id' },
        container: {
          cradle: {
            findUserGroupsQueryHandler: { execute },
          },
        },
      },
    } as unknown as Context<AuthContainer>;
    const info = buildListInfo('userGroups', ['id', 'name', 'description']);
    const resolver = userGroupAdapter.graphql?.resolvers['userGroups'] as (
      query: FindUserGroupsQuery,
      c: Context<AuthContainer>,
      info: GraphQLResolveInfo
    ) => Promise<unknown>;

    await resolver(
      {
        pageIndex: 2,
        fields: ['createdBy'],
      },
      context,
      info
    );

    expect(execute).toHaveBeenCalledWith(
      {
        pageIndex: 2,
        fields: ['id', 'name', 'description'],
      },
      {
        user: { id: 'operator-id' },
      }
    );
  });
});
