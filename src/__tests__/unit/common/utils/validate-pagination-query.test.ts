import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { validatePaginationQuery } from '@app/common/utils/validate-pagination-query';

describe('validatePaginationQuery', () => {
  const validFields = ['id', 'name', 'email'];
  const validSortFields = ['name', 'email'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should return default pagination when params is undefined', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: undefined as any,
          itemsPerPage: undefined as any,
        },
        validFields
      );

      expect(result.pageIndex).toBe(0);
      expect(result.itemsPerPage).toBe(PAGINATION_DEFAULT_ITEMS_PER_PAGE);
    });

    it('should return default pagination when params is empty object', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: undefined as any,
          itemsPerPage: undefined as any,
        },
        validFields
      );

      expect(result.pageIndex).toBe(0);
      expect(result.itemsPerPage).toBe(PAGINATION_DEFAULT_ITEMS_PER_PAGE);
    });

    it('should return validated pagination with valid pageIndex and itemsPerPage', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 2,
          itemsPerPage: 25,
        },
        validFields
      );

      expect(result.pageIndex).toBe(2);
      expect(result.itemsPerPage).toBe(25);
    });

    it('should return validated pagination with only pageIndex', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 5,
          itemsPerPage: undefined as any,
        },
        validFields
      );

      expect(result.pageIndex).toBe(5);
      expect(result.itemsPerPage).toBe(PAGINATION_DEFAULT_ITEMS_PER_PAGE);
    });

    it('should return validated pagination with only itemsPerPage', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: undefined as any,
          itemsPerPage: 30,
        },
        validFields
      );

      expect(result.pageIndex).toBe(0);
      expect(result.itemsPerPage).toBe(30);
    });

    it('should accept pageIndex of 0', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
        },
        validFields
      );

      expect(result.pageIndex).toBe(0);
      expect(result.itemsPerPage).toBe(10);
    });

    it('should accept itemsPerPage equal to maximum', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 100,
        },
        validFields
      );

      expect(result.pageIndex).toBe(0);
      expect(result.itemsPerPage).toBe(100);
    });

    it('should preserve fields when provided', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          fields: ['id', 'name'],
        },
        validFields
      );

      expect(result.fields).toEqual(['id', 'name']);
    });

    it('should not include fields when not provided', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
        },
        validFields
      );

      expect(result.fields).toBeUndefined();
    });
  });

  describe('validation errors - pageIndex', () => {
    it('should throw ValidationException when pageIndex is not an integer', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 1.5 as any,
            itemsPerPage: 10,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 1.5 as any,
            itemsPerPage: 10,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'pageIndex',
        });
      }
    });

    it('should throw ValidationException when pageIndex is negative', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: -1,
            itemsPerPage: 10,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: -1,
            itemsPerPage: 10,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'pageIndex',
        });
      }
    });

    it('should throw ValidationException when pageIndex is negative and itemsPerPage is undefined', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: -5,
            itemsPerPage: undefined as any,
          },
          validFields
        );
      }).toThrow(ValidationException);
    });
  });

  describe('validation errors - itemsPerPage', () => {
    it('should throw ValidationException when itemsPerPage is not an integer', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10.5 as any,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10.5 as any,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'itemsPerPage',
        });
      }
    });

    it('should throw ValidationException when itemsPerPage is zero', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 0,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 0,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'itemsPerPage',
        });
      }
    });

    it('should throw ValidationException when itemsPerPage is negative', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: -5,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: -5,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'itemsPerPage',
        });
      }
    });

    it('should throw ValidationException when itemsPerPage exceeds maximum', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 101,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 101,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_ABOVE_MAX_VALUE
        );
        expect((error as ValidationException).data).toEqual({
          field: 'itemsPerPage',
          maxValue: 100,
        });
      }
    });

    it('should throw ValidationException when itemsPerPage exceeds maximum and pageIndex is undefined', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: undefined as any,
            itemsPerPage: 200,
          },
          validFields
        );
      }).toThrow(ValidationException);
    });
  });

  describe('validation errors - fields', () => {
    it('should throw ValidationException when fields contains invalid field', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            fields: ['id', 'invalidField'],
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            fields: ['id', 'invalidField'],
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'fields',
        });
      }
    });

    it('should accept valid fields', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          fields: ['id', 'name'],
        },
        validFields
      );

      expect(result.fields).toEqual(['id', 'name']);
    });

    it('should accept all valid fields', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          fields: ['id', 'name', 'email'],
        },
        validFields
      );

      expect(result.fields).toEqual(['id', 'name', 'email']);
    });
  });

  describe('edge cases', () => {
    it('should handle both pageIndex and itemsPerPage validation errors', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: -1,
            itemsPerPage: 0,
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: -1,
            itemsPerPage: 0,
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'pageIndex',
        });
      }
    });

    it('should handle large valid pageIndex values', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 1000,
          itemsPerPage: 50,
        },
        validFields
      );

      expect(result.pageIndex).toBe(1000);
      expect(result.itemsPerPage).toBe(50);
    });

    it('should handle empty fields array', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          fields: [],
        },
        validFields
      );

      expect(result.fields).toEqual([]);
    });
  });

  describe('sortField and sortOrder', () => {
    it('should preserve sortField and sortOrder when provided', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          sortField: 'name',
          sortOrder: 'DESC',
        },
        validFields,
        validSortFields
      );

      expect(result.sortField).toBe('name');
      expect(result.sortOrder).toBe('DESC');
    });

    it('should default sortOrder to ASC when sortField is provided but sortOrder is not', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          sortField: 'name',
        },
        validFields,
        validSortFields
      );

      expect(result.sortField).toBe('name');
      expect(result.sortOrder).toBe('ASC');
    });

    it('should not include sortField and sortOrder when not provided', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
        },
        validFields,
        validSortFields
      );

      expect(result.sortField).toBeUndefined();
      expect(result.sortOrder).toBeUndefined();
    });

    it('should throw ValidationException when sortField is provided but validSortFields is not', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'name',
          },
          validFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'name',
          },
          validFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'sortField',
        });
      }
    });

    it('should throw ValidationException when sortField is not in validSortFields', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'invalidField',
          },
          validFields,
          validSortFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'invalidField',
          },
          validFields,
          validSortFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'sortField',
        });
      }
    });

    it('should throw ValidationException when sortOrder is not ASC or DESC', () => {
      expect(() => {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'name',
            sortOrder: 'INVALID' as any,
          },
          validFields,
          validSortFields
        );
      }).toThrow(ValidationException);

      try {
        validatePaginationQuery(
          {
            pageIndex: 0,
            itemsPerPage: 10,
            sortField: 'name',
            sortOrder: 'INVALID' as any,
          },
          validFields,
          validSortFields
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({
          field: 'sortOrder',
        });
      }
    });

    it('should accept valid sortField and sortOrder', () => {
      const result = validatePaginationQuery(
        {
          pageIndex: 0,
          itemsPerPage: 10,
          sortField: 'email',
          sortOrder: 'ASC',
        },
        validFields,
        validSortFields
      );

      expect(result.sortField).toBe('email');
      expect(result.sortOrder).toBe('ASC');
    });
  });
});
