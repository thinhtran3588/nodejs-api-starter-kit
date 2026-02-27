import { z } from '@hono/zod-openapi';
import {
  PAGINATION_MAX_ITEMS_PER_PAGE,
  SORT_ORDERS,
} from '@app/common/constants';

type EnumValues = readonly [string, ...string[]];

interface CreateFindQuerySchemaOptions {
  includeSearchTerm?: boolean;
}

const createFindQueryBaseShape = <
  TFields extends EnumValues,
  TSortFields extends EnumValues,
>(
  fields: TFields,
  sortFields: TSortFields,
  options: CreateFindQuerySchemaOptions = {}
) => ({
  searchTerm:
    options.includeSearchTerm === false
      ? z.never().optional()
      : z.string().optional(),
  pageIndex: z.coerce.number().min(0).optional(),
  itemsPerPage: z.coerce
    .number()
    .min(1)
    .max(PAGINATION_MAX_ITEMS_PER_PAGE)
    .optional(),
  fields: z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : undefined),
    z.array(z.enum(fields)).optional()
  ),
  sortField: z.enum(sortFields).optional(),
  sortOrder: z.enum(SORT_ORDERS).optional(),
});

type FindQueryBaseShape<
  TFields extends EnumValues,
  TSortFields extends EnumValues,
> = ReturnType<typeof createFindQueryBaseShape<TFields, TSortFields>>;

export function createFindQuerySchema<
  TFields extends EnumValues,
  TSortFields extends EnumValues,
>(
  fields: TFields,
  sortFields: TSortFields,
  extraShape?: undefined,
  options?: CreateFindQuerySchemaOptions
): z.ZodObject<FindQueryBaseShape<TFields, TSortFields>>;

export function createFindQuerySchema<
  TFields extends EnumValues,
  TSortFields extends EnumValues,
  TExtra extends z.ZodRawShape,
>(
  fields: TFields,
  sortFields: TSortFields,
  extraShape: TExtra,
  options?: CreateFindQuerySchemaOptions
): z.ZodObject<FindQueryBaseShape<TFields, TSortFields> & TExtra>;

export function createFindQuerySchema<
  TFields extends EnumValues,
  TSortFields extends EnumValues,
  TExtra extends z.ZodRawShape,
>(
  fields: TFields,
  sortFields: TSortFields,
  extraShape?: TExtra,
  options: CreateFindQuerySchemaOptions = {}
) {
  const baseShape = createFindQueryBaseShape(fields, sortFields, options);
  if (!extraShape) {
    return z.object(baseShape);
  }

  const shape = {
    ...baseShape,
    ...extraShape,
  } as FindQueryBaseShape<TFields, TSortFields> & TExtra;

  return z.object(shape);
}
