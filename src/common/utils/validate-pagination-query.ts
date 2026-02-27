import {
  PAGINATION_DEFAULT_ITEMS_PER_PAGE,
  PAGINATION_MAX_ITEMS_PER_PAGE,
} from '@app/common/constants';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import type { PaginationQueryParams } from '@app/common/interfaces/query';

import { ValidationException } from './errors';
import { validate } from './validate';

/**
 * Validates pagination parameters
 * @param params - Pagination parameters to validate
 * @param validFields - Array of valid field names for field selection
 * @param validSortFields - Array of valid field names for sorting
 * @throws ValidationException if pageIndex is negative or itemsPerPage exceeds maximum or is non-positive
 */
export function validatePaginationQuery(
  params: PaginationQueryParams,
  validFields: readonly string[],
  validSortFields?: readonly string[]
): PaginationQueryParams {
  const pageIndex = params.pageIndex ?? 0;
  const itemsPerPage = params.itemsPerPage ?? PAGINATION_DEFAULT_ITEMS_PER_PAGE;
  validate(
    Number.isInteger(pageIndex),
    new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
      field: 'pageIndex',
    })
  );
  validate(
    pageIndex >= 0,
    new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
      field: 'pageIndex',
    })
  );

  if (params.itemsPerPage !== undefined) {
    validate(
      Number.isInteger(params.itemsPerPage),
      new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
        field: 'itemsPerPage',
      })
    );
  }
  validate(
    itemsPerPage > 0,
    new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
      field: 'itemsPerPage',
    })
  );

  validate(
    itemsPerPage <= PAGINATION_MAX_ITEMS_PER_PAGE,
    new ValidationException(ValidationErrorCode.FIELD_ABOVE_MAX_VALUE, {
      field: 'itemsPerPage',
      maxValue: PAGINATION_MAX_ITEMS_PER_PAGE,
    })
  );

  if (params.fields) {
    validate(
      params.fields.every((field) => validFields.includes(field)),
      new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
        field: 'fields',
      })
    );
  }

  if (params.sortField) {
    validate(
      validSortFields !== undefined && validSortFields.length > 0,
      new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
        field: 'sortField',
      })
    );
    validate(
      validSortFields!.includes(params.sortField),
      new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
        field: 'sortField',
      })
    );
  }

  if (params.sortOrder) {
    validate(
      params.sortOrder === 'ASC' || params.sortOrder === 'DESC',
      new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
        field: 'sortOrder',
      })
    );
  }

  const sortOrder =
    params.sortField && !params.sortOrder ? 'ASC' : params.sortOrder;

  return {
    pageIndex,
    itemsPerPage,
    fields: params.fields,
    sortField: params.sortField,
    sortOrder,
  } as PaginationQueryParams;
}
