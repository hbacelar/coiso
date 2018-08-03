// Native
const http = require("http");

// 3rd party
const Trouter = require('trouter');
const { fsPathToURL, methodToHTTP } = require("./helpers");
const { createError } = require('../error');
const { log, logError } = require('../log');

function registerShutdown(fn) {
    let run = false;

    const wrapper = () => {
        if (!run) {
            run = true;
            fn();
        }
    };

    process.on('SIGINT', wrapper);
    process.on('SIGTERM', wrapper);
    process.on('exit', wrapper);
}

const validHTTPMethods = (method) => {
    return ['GET', 'POST', 'PUT', 'DELETE', 'ALL'].indexOf(method.toUpperCase()) !== -1;
}

module.exports = async (resources, endpoint) => {
    let routes = 0;
    const trouter = new Trouter();

    resources.forEach(({ fullyQualifiedPath, resource, options }) => {
        const module = require(fullyQualifiedPath);

        Object.keys(module).filter(validHTTPMethods).map(method => {
            const path = fsPathToURL(resource);
            const trouterMethod = methodToHTTP(method.toUpperCase());

            trouter.add(trouterMethod, path, module[method]);
            routes += 1;
            log(`Registered route "${trouterMethod} ${path}" from resource "${resource}"`);
        });
    });

    if (routes === 0) {
        logError(createError('no-routes', 'No HTTP routes defined'));
        process.exit(1);
    }

    const server = http.createServer((req, res) => {
        const obj = trouter.find(req.method, req.url);

        // route not found
        if (obj === false) {
            res.statusCode = 404;
            return res.end();
        }

        // Execute route handler
        obj.handler(req, res);
    });

    server.on('error', err => {
        logError(err.stack);
        process.exit(1);
    });

    server.listen(...endpoint, () => {
        const details = server.address();

        registerShutdown(() => server.close());

        if (typeof details === 'string') {
            log(`Accepting connections on ${details}`);
        } else if (typeof details === 'object') {
            log(`Accepting connections on ${details.address}:${details.port}`);
        } else {
            log('Accepting connections');
        }
    });
};