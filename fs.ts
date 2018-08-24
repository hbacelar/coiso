// Native
import {basename, join} from 'path';

// Packages
import globby from 'globby';
import {createError} from './error';

export type Handler = (req: any, res: any, params?: any) => Promise<any>;

export type HandlerMap = {
  [path: string]: [string, Handler][];
};

export type FilesystemResource = {
  fullyQualifiedPath: string;
  resource: string;
  options?: object;
};

type Module = {[method: string]: Handler};

type ModuleLoader = (options?: any) => Promise<Module>;

/**
 * TODO: load routes using async iterator
 * @param file Path to resources folder. If not absolute, it's relative to `process.cwd()`
 */
export async function discover(file: string): Promise<FilesystemResource[]> {
  const paths = [...(await globby(['**/*.js', '!**/_*'], {cwd: file}))].map(
    path => ({
      fullyQualifiedPath: join(process.cwd(), file, path),
      resource: path,
      options: {},
    }),
  );

  if (paths.length === 0) {
    throw createError(
      'no-resources-found',
      `No resources found in path "${basename(file)}"`,
    );
  }

  return paths;
}

/**
 * TODO: hardening
 * @param resources
 * @param options
 */
export async function load(
  resources: FilesystemResource[],
  options: {[k: string]: any},
): Promise<HandlerMap> {
  const tasks: any[] = [];
  const loadedResources: HandlerMap = {};

  function parseModule(module: Module, relativeResourcePath: string) {
    for (let [method, handler] of Object.entries(module)) {
      if (!loadedResources[relativeResourcePath]) {
        loadedResources[relativeResourcePath] = [];
      }

      if (handler.length < 2 || handler.length > 3) {
        throw createError(
          'invalid-handler-signature',
          'Handler must have req, res and (optional) param args',
        );
      }

      loadedResources[relativeResourcePath].push([method, handler as Handler]);
    }
  }

  resources.forEach(resource => {
    const module: Module | ModuleLoader = require(resource.fullyQualifiedPath);

    switch (typeof module) {
      case 'object': // No init process required
        parseModule(module as Module, resource.resource);
        break;
      case 'function': // start init process
        tasks.push(
          (module as ModuleLoader)(options[resource.resource]).then(
            (initializedModule: any) =>
              parseModule(initializedModule, resource.resource),
          ),
        );
        break;
    }
  });

  return Promise.all(tasks).then(() => loadedResources);
}

/**
 * Patterns in routes
 *  static (/users)
 *  named parameters (/users/[id].js)
 *  nested parameters (/users/[id]/books/[title].js)
 *  any match / wildcards (/users/*.js)
 *
 *  Because of technical limitations, the following characters cannot be used: /, \, ?, :, ( and ).
 */
export function fsPathToURL(path: string): string {
  return path.replace(/\[(\w+)\]/g, ':$1').replace('index.js', '') || '/';
}

export function methodToHTTP(method: string): string {
  return method.toUpperCase() === 'ALL' ? '*' : method.toUpperCase();
}
