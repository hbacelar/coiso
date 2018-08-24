#!/usr/bin/env node

// Packages
const arg = require('arg');
const chalk = require('chalk');

// Utilities
import loadConfig from '../config';
import { createServer } from "../http";
import { log, logError } from '../log';
import parseEndpoint from '../parse-endpoint';
import { discover, load, fsPathToURL, methodToHTTP } from '../fs';

// Constants
const { VERSION, NAME } = require('../package.json'); // prevent `tsc` from rewriting original file and complaining about it https://github.com/Microsoft/TypeScript/issues/24715
const DEFAULT_RESOURCE_FOLDER = 'resources';
const DEFAULT_HTTP_BIND_ADDRESS = parseEndpoint('tcp://127.0.0.1:8080');

// Check if the user defined any options
const args: {
    '--listen': [string, number?],
    '--help': boolean,
    '--version': boolean,
    '_': string[]
} = arg({
    '--listen': parseEndpoint,
    '-l': '--listen',

    '--help': Boolean,

    '--version': Boolean,
    '-v': '--version'
});

// When `-h` or `--help` are used, print out the usage information
if (args['--help']) {
    console.error(chalk`
  {bold.cyan ${NAME}} - Opinionated HTTP microservices

  {bold USAGE}
      {bold $} {cyan ${NAME}} --help
      {bold $} {cyan ${NAME}} --version
      {bold $} {cyan ${NAME}} [-l {underline listen_uri}] [{underline entry_point}]
      By default {cyan ${NAME}} will listen on {bold tcp://127.0.0.1:8080} and will 
       look for the {bold resources/} folder as the default {underline entry_point}.
  {bold OPTIONS}
      --help                              shows this help message
      -v, --version                       displays the current version of micro
      -l, --listen {underline listen_uri}             specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places
  {bold ENDPOINT}
      For TCP (traditional host/port) endpoints:
          {bold $} {cyan ${NAME}} -l 'tcp://{underline hostname}:{underline 1234}'
      For UNIX domain socket endpoints:
          {bold $} {cyan ${NAME}} -l 'unix:{underline /path/to/socket.sock}'
      For Windows named pipe endpoints:
          {bold $} {cyan ${NAME}} -l 'pipe:\\\\.\\pipe\\{underline PipeName}'
`);
    process.exit(2);
}

// Print out the package's version when `--version` or `-v` are used
if (args['--version']) {
    console.log(VERSION);
    process.exit();
}

// default endpoint
args['--listen'] = args['--listen'] || DEFAULT_HTTP_BIND_ADDRESS;

(async () => {
    try {
        log(`Working directory: ${process.cwd()}`);
        const path: string = args._[0] || DEFAULT_RESOURCE_FOLDER;
        const config = await loadConfig();
        const resources = await load(await discover(path), Object.assign({}, config));

        // Setup & start server
        const server = createServer();
        for (let [resource, handlers] of Object.entries(resources)) {
            handlers.forEach(([method, handler]) => {
                server.addRoute(methodToHTTP(method), fsPathToURL(resource), handler);
            })
        }
        await server.listen(...args['--listen']);
    } catch (e) {
        logError(e);
        process.exit(1);
    }
})();
