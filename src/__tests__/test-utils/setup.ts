import { beforeAll } from 'vitest';

beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['PORT'] = '0';
  process.env['HOST'] = '127.0.0.1';
});
