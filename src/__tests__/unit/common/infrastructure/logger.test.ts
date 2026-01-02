import type { FastifyBaseLogger } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FastifyLogger } from '@app/common/infrastructure/logger';

describe('FastifyLogger', () => {
  let logger: FastifyLogger;
  let mockFastifyLogger: FastifyBaseLogger;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFastifyLogger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as FastifyBaseLogger;

    logger = new FastifyLogger(mockFastifyLogger);
  });

  describe('trace', () => {
    it('should call fastifyLogger.trace with bindings and message', () => {
      const bindings = { userId: '123' };
      const message = 'Trace message';

      logger.trace(bindings, message);

      expect(mockFastifyLogger.trace).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.trace).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.trace with only bindings', () => {
      const bindings = { userId: '123' };

      logger.trace(bindings);

      expect(mockFastifyLogger.trace).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.trace with only message', () => {
      const message = 'Trace message';

      logger.trace(undefined, message);

      expect(mockFastifyLogger.trace).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.trace with no arguments', () => {
      logger.trace();

      expect(mockFastifyLogger.trace).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe('debug', () => {
    it('should call fastifyLogger.debug with bindings and message', () => {
      const bindings = { userId: '123' };
      const message = 'Debug message';

      logger.debug(bindings, message);

      expect(mockFastifyLogger.debug).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.debug).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.debug with only bindings', () => {
      const bindings = { userId: '123' };

      logger.debug(bindings);

      expect(mockFastifyLogger.debug).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.debug with only message', () => {
      const message = 'Debug message';

      logger.debug(undefined, message);

      expect(mockFastifyLogger.debug).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.debug with no arguments', () => {
      logger.debug();

      expect(mockFastifyLogger.debug).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe('info', () => {
    it('should call fastifyLogger.info with bindings and message', () => {
      const bindings = { userId: '123' };
      const message = 'Info message';

      logger.info(bindings, message);

      expect(mockFastifyLogger.info).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.info with only bindings', () => {
      const bindings = { userId: '123' };

      logger.info(bindings);

      expect(mockFastifyLogger.info).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.info with only message', () => {
      const message = 'Info message';

      logger.info(undefined, message);

      expect(mockFastifyLogger.info).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.info with no arguments', () => {
      logger.info();

      expect(mockFastifyLogger.info).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('warn', () => {
    it('should call fastifyLogger.warn with bindings and message', () => {
      const bindings = { userId: '123' };
      const message = 'Warn message';

      logger.warn(bindings, message);

      expect(mockFastifyLogger.warn).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.warn).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.warn with only bindings', () => {
      const bindings = { userId: '123' };

      logger.warn(bindings);

      expect(mockFastifyLogger.warn).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.warn with only message', () => {
      const message = 'Warn message';

      logger.warn(undefined, message);

      expect(mockFastifyLogger.warn).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.warn with no arguments', () => {
      logger.warn();

      expect(mockFastifyLogger.warn).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('error', () => {
    it('should call fastifyLogger.error with bindings and message', () => {
      const bindings = { userId: '123', error: 'Something went wrong' };
      const message = 'Error message';

      logger.error(bindings, message);

      expect(mockFastifyLogger.error).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.error with only bindings', () => {
      const bindings = { userId: '123', error: 'Something went wrong' };

      logger.error(bindings);

      expect(mockFastifyLogger.error).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.error with only message', () => {
      const message = 'Error message';

      logger.error(undefined, message);

      expect(mockFastifyLogger.error).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.error with no arguments', () => {
      logger.error();

      expect(mockFastifyLogger.error).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe('fatal', () => {
    it('should call fastifyLogger.fatal with bindings and message', () => {
      const bindings = { userId: '123', error: 'Critical error' };
      const message = 'Fatal message';

      logger.fatal(bindings, message);

      expect(mockFastifyLogger.fatal).toHaveBeenCalledWith(bindings, message);
      expect(mockFastifyLogger.fatal).toHaveBeenCalledTimes(1);
    });

    it('should call fastifyLogger.fatal with only bindings', () => {
      const bindings = { userId: '123', error: 'Critical error' };

      logger.fatal(bindings);

      expect(mockFastifyLogger.fatal).toHaveBeenCalledWith(bindings, undefined);
    });

    it('should call fastifyLogger.fatal with only message', () => {
      const message = 'Fatal message';

      logger.fatal(undefined, message);

      expect(mockFastifyLogger.fatal).toHaveBeenCalledWith(undefined, message);
    });

    it('should call fastifyLogger.fatal with no arguments', () => {
      logger.fatal();

      expect(mockFastifyLogger.fatal).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });
});
