import { Kind, type GraphQLResolveInfo } from 'graphql';

/**
 * Extracts field names from a GraphQL query selection set
 * @param info - GraphQL resolve info object
 * @param fieldName - Name of the field to extract selections from (e.g., 'data')
 * @returns Array of field names, or undefined if the field is not selected or has no selection set
 */
export function extractGraphQLFields(
  info: GraphQLResolveInfo,
  fieldName: string
): string[] | undefined {
  const fieldNode = info.fieldNodes[0];
  if (!fieldNode?.selectionSet) {
    return undefined;
  }

  const targetField = fieldNode.selectionSet.selections.find(
    (selection) =>
      selection.kind === Kind.FIELD && selection.name.value === fieldName
  );

  if (
    !targetField ||
    targetField.kind !== Kind.FIELD ||
    !targetField.selectionSet
  ) {
    return undefined;
  }

  const fields: string[] = [];
  for (const selection of targetField.selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      fields.push(selection.name.value);
    }
  }

  return fields.length > 0 ? fields : undefined;
}
