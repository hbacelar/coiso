// Native
import {
  createServer as nodeCreateServer,
  IncomingMessage,
  ServerResponse,
  Server,
} from 'http';

// 3rd party
const Trouter = require('trouter');
import {createError} from '../error';
import {log} from '../log';

/* @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods */
/* CONNECT, TRACE, OPTIONS and PATCH not supported on purpose */
enum HTTP_METHOD {
  /* REST */
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',

  /* SHORTHAND */
  ANY = '*', // any of the above
}

export interface APIServer {
  // Raw nodejs server
  server: Server;

  /* route methods */
  get: ServerRouteFn;
  head: ServerRouteFn;
  post: ServerRouteFn;
  put: ServerRouteFn;
  delete: ServerRouteFn;
  any: ServerRouteFn;
  addRoute(method: string, route: string, handler: RouteHandler): APIServer;

  /* lifecyle methods */
  listen(ifc_path: string, port?: number): Promise<void>;
  close(): Promise<void>;
}

type RequestParams<T> = {[p: string]: T} | {}; // Dictionary<string, string>
type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: RequestParams<string>,
) => void;
type ServerRouteFn = (route: string, handler: RouteHandler) => APIServer;

// Used to run code when process is bound to shutdown
function registerShutdown(fn: () => void) {
  let run = false;

  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };

  process.once('SIGINT', wrapper);
  process.once('SIGTERM', wrapper);
  process.once('exit', wrapper);
}

const {PerformanceObserver, performance} = require('perf_hooks');

export function createServer(): APIServer {
  let routes = 0;
  const trouter = new Trouter(); // consider find-my-way router for more performance
  const server = nodeCreateServer((req, res) => {
    performance.mark('find route');
    const obj = trouter.find(req.method, req.url);
    performance.mark('route found');
    performance.measure('routing', 'find route', 'route found');
    // route not found
    if (obj === false) {
      res.statusCode = 404;
      return res.end();
    }

    performance.mark('handler start');
    // Execute route handler
    obj.handler(req, res);
    performance.mark('handler end');
    performance.measure('handler', 'handler start', 'handler end');
  });

  return {
    get server(): Server {
      return server;
    },

    get(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.GET, route, handler);
      return this;
    },
    head(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.HEAD, route, handler);
      return this;
    },
    post(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.POST, route, handler);
      return this;
    },
    put(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.PUT, route, handler);
      return this;
    },
    delete(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.DELETE, route, handler);
      return this;
    },
    any(route: string, handler: RouteHandler): APIServer {
      this.addRoute(HTTP_METHOD.ANY, route, handler);
      return this;
    },
    addRoute(method: string, route: string, handler: RouteHandler): APIServer {
      log(`Route: "${method} ${route}"`);
      trouter.add(method, route, handler);
      routes += 1;
      return this;
    },

    listen(ifc_path: string, port?: number): Promise<void> {
      return new Promise((resolve, reject) => {
        if (routes === 0) {
          return reject(createError('no-routes', 'No HTTP routes defined'));
        }

        server.once('error', err => {
          reject(err);
        });

        const listen = ifc_path
          ? server.listen.bind(server, port, ifc_path)
          : server.listen.bind(server, ifc_path);

        listen(() => {
          const details = server.address();

          registerShutdown(() => server.close());

          if (typeof details === 'string') {
            log(`Accepting connections on ${details}`);
          } else if (typeof details === 'object') {
            log(`Accepting connections on ${details.address}:${details.port}`);
          } else {
            log('Accepting connections');
          }
          resolve();
        });
      });
    },

    close(): Promise<void> {
      return new Promise(resolve => {
        server.close(resolve);
      });
    },
  };
}
