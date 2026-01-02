import { readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type {
  GraphQLResolverConfiguration,
  GraphQLSchemaConfiguration,
  ModelAssociationConfiguration,
  ModelConfiguration,
  ModuleConfiguration,
  RouteConfiguration,
} from '@app/common/interfaces/configuration';

export interface DiscoverModulesResult {
  modules: ModuleConfiguration[];
  models: ModelConfiguration[];
  modelAssociations: ModelAssociationConfiguration[];
  routes: RouteConfiguration[];
  graphqlSchemas: GraphQLSchemaConfiguration[];
  graphqlResolvers: GraphQLResolverConfiguration[];
  moduleNames: string[];
}

export interface RegisterDatabaseModelsResult {
  models: ModelConfiguration[];
  modelAssociations: ModelAssociationConfiguration[];
}

export async function registerDatabaseModels(
  modulePath: string
): Promise<RegisterDatabaseModelsResult> {
  const modelsDir = join(modulePath, 'infrastructure', 'models');
  const filePaths = await readdir(modelsDir);
  const modelFiles = filePaths.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );
  const models: ModelConfiguration[] = [];
  const modelAssociations: ModelAssociationConfiguration[] = [];
  for (const configurationFile of modelFiles) {
    const configurationFilePath = join(modelsDir, configurationFile);
    const configuration = (await import(
      pathToFileURL(configurationFilePath).href
    )) as {
      modelConfiguration: ModelConfiguration;
    };
    models.push(configuration.modelConfiguration);
  }

  const associationsFile = filePaths.find(
    (file) => file === `associations.ts` || file === `associations.js`
  );
  if (associationsFile) {
    const associationsFilePath = join(modelsDir, associationsFile);
    const associations = (await import(
      pathToFileURL(associationsFilePath).href
    )) as {
      associationConfiguration: ModelAssociationConfiguration;
    };
    modelAssociations.push(associations.associationConfiguration);
  }
  return {
    models,
    modelAssociations,
  };
}

export async function registerRoutes(
  modulePath: string
): Promise<RouteConfiguration[]> {
  const routesDir = join(modulePath, 'adapters', 'routes');
  const filePaths = await readdir(routesDir);
  const routeFiles = filePaths.filter(
    (file) => file.endsWith('.route.ts') || file.endsWith('.route.js')
  );
  const routeConfigurations: RouteConfiguration[] = [];
  for (const routeFile of routeFiles) {
    const routeFilePath = join(routesDir, routeFile);
    const configuration = (await import(pathToFileURL(routeFilePath).href)) as {
      routeConfiguration: RouteConfiguration;
    };
    routeConfigurations.push(configuration.routeConfiguration);
  }
  return routeConfigurations;
}

export async function registerGraphQLSchemas(
  modulePath: string
): Promise<GraphQLSchemaConfiguration[]> {
  const graphqlDir = join(modulePath, 'adapters', 'graphql');
  try {
    const filePaths = await readdir(graphqlDir);
    const schemaFiles = filePaths.filter(
      (file) => file.endsWith('.schema.ts') || file.endsWith('.schema.js')
    );
    const schemas: GraphQLSchemaConfiguration[] = [];
    for (const schemaFile of schemaFiles) {
      const schemaFilePath = join(graphqlDir, schemaFile);
      const module = (await import(
        pathToFileURL(schemaFilePath).href
      )) as Record<string, string>;
      for (const [key, value] of Object.entries(module)) {
        if (key.endsWith('Schema') && typeof value === 'string') {
          schemas.push({ schema: value });
        }
      }
    }
    return schemas;
  } catch {
    return [];
  }
}

export async function registerGraphQLResolvers(
  modulePath: string
): Promise<GraphQLResolverConfiguration[]> {
  const graphqlDir = join(modulePath, 'adapters', 'graphql');
  try {
    const filePaths = await readdir(graphqlDir);
    const resolverFiles = filePaths.filter(
      (file) => file.endsWith('.resolvers.ts') || file.endsWith('.resolvers.js')
    );
    const resolvers: GraphQLResolverConfiguration[] = [];
    for (const resolverFile of resolverFiles) {
      const resolverFilePath = join(graphqlDir, resolverFile);
      const module = (await import(
        pathToFileURL(resolverFilePath).href
      )) as Record<string, Record<string, unknown>>;
      for (const [key, value] of Object.entries(module)) {
        if (key.endsWith('Resolvers') && typeof value === 'object') {
          resolvers.push({ resolvers: value });
        }
      }
    }
    return resolvers;
  } catch {
    return [];
  }
}

export async function discoverModules(): Promise<DiscoverModulesResult> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const modulesDir = join(__dirname, '../modules');
  const result: DiscoverModulesResult = {
    modules: [],
    models: [],
    modelAssociations: [],
    routes: [],
    graphqlSchemas: [],
    graphqlResolvers: [],
    moduleNames: [],
  };

  const whitelistEnv = process.env['MODULE_WHITELIST'];
  const whitelistArray =
    whitelistEnv
      ?.split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0) ?? [];
  const whitelist = whitelistArray.length > 0 ? whitelistArray : undefined;

  const moduleNames = await readdir(modulesDir);
  const loadedModuleNames: string[] = [];

  for (const moduleName of moduleNames) {
    if (whitelist && !whitelist.includes(moduleName)) {
      continue;
    }
    const modulePath = join(modulesDir, moduleName);
    const moduleStat = await stat(modulePath);
    if (!moduleStat.isDirectory()) {
      continue;
    }
    // list all files in the module directory
    const filePaths = await readdir(modulePath);
    const moduleConfigFile = filePaths.find(
      (file) =>
        file === `module-configuration.ts` || file === `module-configuration.js`
    );
    if (!moduleConfigFile) {
      continue;
    }
    const configurationFilePath = join(modulePath, moduleConfigFile);
    const moduleConfiguration = (await import(
      pathToFileURL(configurationFilePath).href
    )) as {
      moduleConfiguration: ModuleConfiguration;
    };
    result.modules.push(moduleConfiguration.moduleConfiguration);

    const { models, modelAssociations } =
      await registerDatabaseModels(modulePath);
    result.models.push(...models);
    result.modelAssociations.push(...modelAssociations);

    const routes = await registerRoutes(modulePath);
    result.routes.push(...routes);

    const graphqlSchemas = await registerGraphQLSchemas(modulePath);
    result.graphqlSchemas.push(...graphqlSchemas);

    const graphqlResolvers = await registerGraphQLResolvers(modulePath);
    result.graphqlResolvers.push(...graphqlResolvers);

    loadedModuleNames.push(moduleName);
  }

  result.moduleNames = loadedModuleNames;

  if (whitelist !== undefined) {
    if (loadedModuleNames.length === 0) {
      throw new Error(
        `MODULE_WHITELIST is set but no matching modules found. Whitelist: ${whitelist.join(', ')}`
      );
    }

    const missingModules = whitelist.filter(
      (moduleName) => !loadedModuleNames.includes(moduleName)
    );
    if (missingModules.length > 0) {
      throw new Error(
        `MODULE_WHITELIST contains modules that were not found: ${missingModules.join(', ')}. Found modules: ${loadedModuleNames.join(', ')}`
      );
    }
  }

  //register application routes
  const applicationRoutesDir = join(__dirname);
  const applicationRoutes = await registerRoutes(applicationRoutesDir);
  result.routes.push(...applicationRoutes);

  return result;
}
