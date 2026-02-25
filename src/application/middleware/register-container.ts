import type { AwilixContainer } from 'awilix';
import type { Container } from '@app/application/container';
import type { App, Context } from '@app/common';

export const registerContainer = (
  app: App,
  container: AwilixContainer<Container>
) => {
  app.use('*', async (c: Context, next) => {
    c.set('container', container);
    await next();
  });
};
