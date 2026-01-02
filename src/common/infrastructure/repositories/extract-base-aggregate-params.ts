import type { BaseAggregateParams } from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';

export interface BaseAggregateModelData {
  id: string;
  version?: number | null;
  createdAt: Date;
  lastModifiedAt?: Date | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
}

/**
 * Extracts base aggregate fields from a database model and converts them to the proper types
 * Used in repository toDomain methods to avoid duplicating base field conversion logic
 */
export function extractBaseAggregateParams(
  model: BaseAggregateModelData
): Pick<
  BaseAggregateParams,
  | 'id'
  | 'version'
  | 'createdAt'
  | 'lastModifiedAt'
  | 'createdBy'
  | 'lastModifiedBy'
> {
  return {
    id: Uuid.create(model.id, 'id'),
    version: model.version ?? 0,
    createdAt: model.createdAt,
    lastModifiedAt: model.lastModifiedAt ?? undefined,
    createdBy: model.createdBy
      ? Uuid.create(model.createdBy, 'createdBy')
      : undefined,
    lastModifiedBy: model.lastModifiedBy
      ? Uuid.create(model.lastModifiedBy, 'lastModifiedBy')
      : undefined,
  };
}
