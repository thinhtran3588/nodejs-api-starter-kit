import { loadEnvConfig } from './load-env-config';

// Side-effect: Load environment variables immediately when this module is imported
loadEnvConfig();
