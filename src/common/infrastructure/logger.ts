import type { FastifyBaseLogger } from 'fastify';
import type { Logger } from '@app/common/domain/interfaces/logger';

/**
 * Fastify logger implementation
 * Wraps FastifyBaseLogger to implement the common Logger interface
 */
export class FastifyLogger implements Logger {
  constructor(private readonly fastifyLogger: FastifyBaseLogger) {}

  trace(bindings?: object, message?: string): void {
    this.fastifyLogger.trace(bindings, message);
  }

  debug(bindings?: object, message?: string): void {
    this.fastifyLogger.debug(bindings, message);
  }

  info(bindings?: object, message?: string): void {
    this.fastifyLogger.info(bindings, message);
  }

  warn(bindings?: object, message?: string): void {
    this.fastifyLogger.warn(bindings, message);
  }

  error(bindings?: object, message?: string): void {
    this.fastifyLogger.error(bindings, message);
  }

  fatal(bindings?: object, message?: string): void {
    this.fastifyLogger.fatal(bindings, message);
  }
}
