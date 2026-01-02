/**
 * Logger interface for application-wide logging
 * Provides a consistent logging API that can be implemented by different logging frameworks
 */
export interface Logger {
  /**
   * Logs a trace-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  trace(bindings?: object, message?: string): void;

  /**
   * Logs a debug-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  debug(bindings?: object, message?: string): void;

  /**
   * Logs an info-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  info(bindings?: object, message?: string): void;

  /**
   * Logs a warn-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  warn(bindings?: object, message?: string): void;

  /**
   * Logs an error-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  error(bindings?: object, message?: string): void;

  /**
   * Logs a fatal-level message
   * @param bindings - Optional object with additional context
   * @param message - The log message
   */
  fatal(bindings?: object, message?: string): void;
}
