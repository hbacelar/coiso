#!/usr/bin/env node

// Packages
const arg = require('arg');
const chalk = require('chalk');

// Utilities
import { createServer } from "../http";
import { log, logError } from '../log';
import parseEndpoint from '../parse-endpoint';
import { load } from '../project';

// Constants
const { version, name } = require('../package.json'); // prevent `tsc` from rewriting original file and complaining about it https://github.com/Microsoft/TypeScript/issues/24715
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
  {bold.cyan ${name}} - Opinionated HTTP microservices

  {bold USAGE}
      {bold $} {cyan ${name}} --help
      {bold $} {cyan ${name}} --version
      {bold $} {cyan ${name}} [-l {underline listen_uri}]
      By default {cyan ${name}} will listen on {bold tcp://127.0.0.1:8080}.

  {bold OPTIONS}
      --help                              shows this help message
      -v, --version                       displays the current version of micro
      -l, --listen {underline listen_uri}             specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places
  {bold ENDPOINT}
      For TCP (traditional host/port) endpoints:
          {bold $} {cyan ${name}} -l 'tcp://{underline hostname}:{underline 1234}'
      For UNIX domain socket endpoints:
          {bold $} {cyan ${name}} -l 'unix:{underline /path/to/socket.sock}'
      For Windows named pipe endpoints:
          {bold $} {cyan ${name}} -l 'pipe:\\\\.\\pipe\\{underline PipeName}'
`);
    process.exit(2);
}

// Print out the package's version when `--version` or `-v` are used
if (args['--version']) {
    console.log(version);
    process.exit();
}

// default endpoint
args['--listen'] = args['--listen'] || DEFAULT_HTTP_BIND_ADDRESS;

(async function main() {
    try {
        log(`Working directory: ${process.cwd()}`)
        const project = await load(process.cwd());

        // Setup & start server
        const server = createServer();
        for (let [path, { request, websocket }] of Object.entries(project.handlers)) {
            request && server.addRequestHandler(path, request)
            websocket && server.addWebsocketHandler(path, websocket)
        }
        await server.listen(...args['--listen']);
    } catch (e) {
        logError(e);
        process.exit(1);
    }
})();
