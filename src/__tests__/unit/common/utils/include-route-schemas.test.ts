import { describe, expect, it } from 'vitest';
import {
  error400ResponseSchema,
  error401ResponseSchema,
  error403ResponseSchema,
  error404ResponseSchema,
  error500ResponseSchema,
  success201ResponseSchema,
  success204ResponseSchema,
} from '@app/common/schemas/error-response.schemas';
import { includeRouteSchemas } from '@app/common/utils/include-route-schemas';

describe('includeRouteSchemas', () => {
  describe('happy path', () => {
    it('should include single status code schema', () => {
      const result = includeRouteSchemas([400]);

      expect(result[400]).toEqual(error400ResponseSchema[400]);
    });

    it('should include multiple status code schemas', () => {
      const result = includeRouteSchemas([400, 401, 403]);

      expect(result[400]).toEqual(error400ResponseSchema[400]);
      expect(result[401]).toEqual(error401ResponseSchema[401]);
      expect(result[403]).toEqual(error403ResponseSchema[403]);
    });

    it('should include all available status codes', () => {
      const result = includeRouteSchemas([201, 204, 400, 401, 403, 404, 500]);

      expect(result[201]).toEqual(success201ResponseSchema[201]);
      expect(result[204]).toEqual(success204ResponseSchema[204]);
      expect(result[400]).toEqual(error400ResponseSchema[400]);
      expect(result[401]).toEqual(error401ResponseSchema[401]);
      expect(result[403]).toEqual(error403ResponseSchema[403]);
      expect(result[404]).toEqual(error404ResponseSchema[404]);
      expect(result[500]).toEqual(error500ResponseSchema[500]);
    });

    it('should handle empty array', () => {
      const result = includeRouteSchemas([]);

      expect(result).toEqual({});
    });

    it('should handle duplicate status codes', () => {
      const result = includeRouteSchemas([400, 400, 401]);

      expect(result[400]).toEqual(error400ResponseSchema[400]);
      expect(result[401]).toEqual(error401ResponseSchema[401]);
    });
  });

  describe('edge cases', () => {
    it('should return object with correct schema references', () => {
      const result = includeRouteSchemas([400, 404]);

      expect(result[400]).toEqual(error400ResponseSchema[400]);
      expect(result[404]).toEqual(error404ResponseSchema[404]);
    });

    it('should handle mixed success and error codes', () => {
      const result = includeRouteSchemas([201, 400, 500]);

      expect(result[201]).toEqual(success201ResponseSchema[201]);
      expect(result[400]).toEqual(error400ResponseSchema[400]);
      expect(result[500]).toEqual(error500ResponseSchema[500]);
    });
  });
});
