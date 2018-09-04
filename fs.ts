// // Native
// import {basename, join} from 'path';

// // Packages
// import globby from 'globby';
// import {createError} from './error';

// // Types
// export type Handler = (req: any, res: any) => Promise<any>;

// export type Module = {[method: string]: Handler};

// export type ModuleLoader = (initValue?: any, options?: any) => Promise<Module>;

// export type InitFunction = (opts?: object) => Promise<any>;

// export type Resources = {[path: string]: Module | ModuleLoader};

// export type Project = {
//   init?: InitFunction;
//   resources: Resources;
// };

// // Constants
// const INIT_FILENAME = 'init.js';
// const FILE_ALLOW_LIST = ['**/*.js', '!**/_*'];

// export function validateInitFunction(fn: Function): void {
//   if (typeof fn !== 'function') {
//     throw createError('init-invalid-type', 'Init must be a function');
//   }
//   if (fn.length > 1) {
//     throw createError(
//       'init-invalid-signature',
//       'Init function must have `async (options?: any)` signature',
//     );
//   }
// }

// export function validateModuleLoader(fn: Function): void {
//   if (typeof fn !== 'function') {
//     throw createError(
//       'module-loader-invalid-type',
//       'Module loader must be a function',
//     );
//   }
// }

// export function validateModuleObject(mod: object): void {
//   for (let [_, handler] of Object.entries(mod)) {
//     if (handler.length !== 2) {
//       throw createError(
//         'invalid-handler-signature',
//         'Handler must have `(req: IncomingMessage, res: ServerResponse)` signature',
//       );
//     }
//   }
// }

// export function validateModule(mod: any): void {
//   switch (typeof mod) {
//     case 'function':
//       validateModuleLoader(mod);
//       break;
//     case 'object':
//       validateModuleObject(mod);
//       break;
//     default:
//       throw createError(
//         'module-invalid',
//         'Modules must be either loaders or objects',
//       );
//   }
// }

// /**
//  * Build a project from a filesystem structure
//  * @param file Path to resources folder. If not absolute, it's relative to `process.cwd()`
//  */
// export async function build(root: string): Promise<Project> {
//   const project: Project = {
//     resources: {},
//   };

//   project.resources = [...(await globby(FILE_ALLOW_LIST, {cwd: root}))].reduce(
//     (proj, path) => {
//       proj[path] = require(join(process.cwd(), root, path));
//       validateModule(proj[path]);
//       return proj;
//     },
//     project.resources,
//   );

//   if (Object.keys(project.resources).length === 0) {
//     throw createError(
//       'no-resources-found',
//       `No resources found in path "${basename(root)}"`,
//     );
//   }

//   try {
//     project.init = require(join(process.cwd(), INIT_FILENAME)) as InitFunction;
//     validateInitFunction(project.init);
//   } catch {
//     // #init is not mandatory; move on
//   }

//   return project;
// }

// /**
//  * TODO: hardening
//  * @param resources
//  * @param options
//  */
// export async function load(
//   project: Project,
//   options: {[k: string]: any},
// ): Promise<{[path: string]: Module}> {
//   const tasks: any[] = [];
//   const loadedResources: {[path: string]: Module} = {};
//   let initValue: any;

//   function parseModule(mod: Module, relativeResourcePath: string) {
//     validateModule(mod);

//     if (!loadedResources[relativeResourcePath]) {
//       loadedResources[relativeResourcePath] = {};
//     }

//     loadedResources[relativeResourcePath] = mod;
//   }

//   // Project #init goes first
//   if (project.init) {
//     initValue = await project.init(options);
//   }

//   // Load resources
//   Object.keys(project.resources).forEach(path => {
//     const mod = project.resources[path];

//     switch (typeof mod) {
//       case 'object': // Resolved module
//         parseModule(mod as Module, path);
//         break;
//       case 'function': // Module loader
//         tasks.push(
//           (mod as ModuleLoader)(initValue, options[path]).then(
//             initializedModule => parseModule(initializedModule, path),
//           ),
//         );
//         break;
//     }
//   });

//   return Promise.all(tasks).then(() => loadedResources);
// }

// /**
//  * Patterns in routes
//  *  static (/users)
//  *  named parameters (/users/[id].js)
//  *  nested parameters (/users/[id]/books/[title].js)
//  *  any match / wildcards (/users/*.js)
//  *
//  *  Because of technical limitations, the following characters cannot be used: /, \, ?, :, ( and ).
//  */
// export function fsPathToURL(path: string): string {
//   return path.replace(/\[(\w+)\]/g, ':$1').replace('index.js', '') || '/';
// }

// export function methodToHTTP(method: string): string {
//   return method.toUpperCase() === 'ALL' ? '*' : method.toUpperCase();
// }
