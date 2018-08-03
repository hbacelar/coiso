#!/usr/bin/env node

// Packages
const arg = require('arg');
const chalk = require('chalk');

// Utilities
const { version, name } = require('../package');
const { logError } = require('../src/log');
const parseEndpoint = require('../src/parse-endpoint.js');
const discover = require('../src/discover');
const scheduler = require('../src/scheduler').sameProcess;
const loader = require('../src/loader');
const loadConfig = require('../src/config');

// Constants
const DEFAULT_HTTP_PORT = 8080;
const DEFAULT_HTTP_INTERFACE = '127.0.0.1';

// Check if the user defined any options
const args = arg({
    '--listen': [parseEndpoint],
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
      {bold $} {cyan ${name}} [-l {underline listen_uri}] [{underline entry_point}]
      By default {cyan ${name}} will listen on {bold tcp://127.0.0.1:8080} and will 
       look for the {bold resources/} folder as the default {underline entry_point}.
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
args['--listen'] = args['--listen'] || [];
if (args['--listen'].length === 0) {
    args['--listen'] = [DEFAULT_HTTP_PORT, DEFAULT_HTTP_INTERFACE];
}

(async () => {
    try {
        const path = args._[0] || 'resources';
        const resources = await discover(path);
        const config = await loadConfig();

        // Load tasks
        await loader(scheduler(resources, config), Object.assign({}, config, { endpoint: args['--listen'] }));
    } catch (e) {
        logError(e);
        process.exit(1);
    }
})();