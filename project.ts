// Native
import { join, basename } from 'path';

// Packages
import globby from 'globby';
import { createError } from './error';

// Utilities
import loadConfig from './config';
import { log, logError } from './log';
import { RequestHandler, WebSocketHandler } from './http/index';

// Constants
const RESOURCES_PATH = 'resources';
const CONFIG_FILENAME = 'coisoconfig.toml';
const FILE_PATTERNS = ['**/*.js', '!**/_*'];

// Types
type Project = {
  init?: InitFunction;
  config?: object;
  handlers: {
    [path: string]: { request?: RequestHandler, websocket?: WebSocketHandler };
  };
}

type InitFunction = (config?: object) => Promise<any>;

export function isInitFunction(fn: any): fn is InitFunction {
  return typeof fn === 'function' && fn.length <= 2;
}

export function isHandler(mod: any): mod is RequestHandler | WebSocketHandler {
  return typeof mod === 'function' && mod.length <= 3;
}

export function fsPathToURL(path: string): string {
  return path.replace(/\[(\w+)\]/g, ':$1')
    .replace('.ws', '')
    .replace('index.js', '') || '/';
}

/**
 * Build a project from a filesystem structure
 * @param file Path to project folder. If not defined, it's relative to `process.cwd()`
 */
export async function load(root?: string): Promise<Project> {
  const rootPath = root ? root : process.cwd();
  const resourcesPath = join(rootPath, RESOURCES_PATH);
  const configPath = join(rootPath, CONFIG_FILENAME);
  const packageJsonPath = join(rootPath, "package.json");
  const project: Project = {
    handlers: {}
  };

  [...(await globby(FILE_PATTERNS, { cwd: resourcesPath }))].reduce((proj, path) => {
    const path_abs = join(resourcesPath, path);
    const urlPath = fsPathToURL(path);
    const isWebsocket = basename(path).match(/\w+\.ws\.js/);

    log(`Loading resource "${path}" from "${path_abs}"`);
    const mod = require(path_abs);

    if (!isHandler(mod)) {
      throw createError(
        'module-invalid',
        `Handler for "${path}" is an invalid function`,
      );
    }

    // Initialize the structure
    proj.handlers[urlPath] = proj.handlers[urlPath] ? proj.handlers[urlPath] : {};

    if (isWebsocket) {
      proj.handlers[urlPath].websocket = mod as WebSocketHandler;
    } else {
      proj.handlers[urlPath].request = mod as RequestHandler;
    }

    return project;
  }, project);

  if (Object.keys(project.handlers).length === 0) {
    throw createError(
      'no-resources-found',
      `No resources found in path "${resourcesPath}"`,
    );
  }

  // Config
  try {
    project.config = await loadConfig(configPath);
  } catch (e) {
    logError(e);
    // config is not mandatory; move on
  }

  // Init
  try {
    const initPath = join(rootPath, require(packageJsonPath).main)
    project.init = require(initPath);
    if (isInitFunction(project.init)) {
      log(`Initializing project from "${initPath}"`);
      await project.init(project.config);
    } else {
      throw createError(
        'init-function-invalid',
        'Init function must have `(server: HttpServer, config?: object) => Promise<any>` signature',
      );
    }
  } catch (e) {
    logError(e);
    // #init is not mandatory; move on
  }

  return project;
}

// (async () => {
//   try {
//     await load();
//   } catch (e) {
//     logError(e);
//     process.exit(1);
//   }
// })();
