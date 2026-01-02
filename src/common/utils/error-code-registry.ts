/**
 * Registry for error code to HTTP status code mappings
 * Modules can register their error code mappings here
 */
export class ErrorCodeRegistry {
  private mappings: Record<string, number> = {};

  /**
   * Register error code mappings from a module
   */
  register(mappings: Record<string, number>): void {
    this.mappings = { ...this.mappings, ...mappings };
  }

  /**
   * Get HTTP status code for an error code
   */
  getStatusCode(code: string): number | undefined {
    return this.mappings[code];
  }

  /**
   * Get all registered mappings (for debugging)
   */
  getAllMappings(): Record<string, number> {
    return { ...this.mappings };
  }
}
